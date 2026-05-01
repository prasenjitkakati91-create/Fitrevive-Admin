import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserSessionPersistence, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, Timestamp, onSnapshot, where, writeBatch, increment, collectionGroup, startAfter, getDoc, QueryConstraint } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Secondary app instance specifically used so Admin doesn't get logged out when creating new staff accounts
const adminApp = initializeApp(firebaseConfig, 'AdminApp');
const adminAuth = getAuth(adminApp);
setPersistence(adminAuth, browserSessionPersistence).catch(err => console.error("AdminAuth persistence error:", err));

const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};
export const logOut = () => signOut(auth);
export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  if (error instanceof Error && error.message.toLowerCase().includes('permission-denied')) {
    errInfo.error = `Access Denied: ${error.message}. Please check your access rights.`;
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// CACHING STRATEGY: Simple in-memory cache to prevent redundant fetches within the same session
const fetchCache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key: string) => {
  const cached = fetchCache[key];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  fetchCache[key] = { data, timestamp: Date.now() };
};

export const checkMemberAuthorization = async (identifier: string) => {
  const cleanId = identifier.trim();
  const lowerId = cleanId.toLowerCase();
  const teamRef = collection(db, 'team');
  
  // Try combined query for email or staffId or phone to reduce sequential hits
  // Note: Firestore doesn't support multiple OR on different fields easily without many indices
  // But we can optimize by checking common ones first and avoiding "fetch all"
  
  // 1. Check ID/Email first as primary keys
  let q = query(teamRef, where('email', '==', lowerId));
  let snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    q = query(teamRef, where('staffId', '==', cleanId.toUpperCase()));
    snapshot = await getDocs(q);
  }

  if (snapshot.empty) {
    q = query(teamRef, where('phone', '==', cleanId));
    snapshot = await getDocs(q);
  }

  if (snapshot.empty) {
    return null;
  }
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
};

// Patient Services
export const savePatient = async (patientData: { 
  name: string; 
  phone: string; 
  age: number; 
  gender: string;
  condition: string;
  address?: string;
  medicalHistory: string; 
  treatmentStatus?: 'Active' | 'Completed';
}) => {
  const patientsRef = collection(db, 'patients');
  return addDoc(patientsRef, {
    ...patientData,
    unpaidSessionsCount: 0,
    unpaidAmount: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const updatePatient = async (id: string, patientData: any) => {
  const docRef = doc(db, 'patients', id);
  return updateDoc(docRef, {
    ...patientData,
    updatedAt: Timestamp.now()
  });
};

// Optimized Patient Fetching: One-time fetch with optional search
export const fetchPatients = async (options: { searchTerm?: string, limitCount?: number, lastDoc?: any } = {}) => {
  const patientsRef = collection(db, 'patients');
  const constraints: QueryConstraint[] = [orderBy('name', 'asc')];
  
  if (options.limitCount) {
    constraints.push(limit(options.limitCount));
  } else {
    constraints.push(limit(100)); // Reasonable default
  }

  if (options.lastDoc) {
    constraints.push(startAfter(options.lastDoc));
  }

  const q = query(patientsRef, ...constraints);
  try {
    const snapshot = await getDocs(q);
    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'patients');
    return { data: [], lastDoc: null };
  }
};

// Keep for legacy compatibility but encourage moving away from it
export const getPatients = (callback: (patients: any[]) => void) => {
  const q = query(collection(db, 'patients'), orderBy('name', 'asc'), limit(100));
  return onSnapshot(q, (snapshot) => {
    const patients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(patients);
  });
};

// Session (Attendance) Services
export const logSession = async (
  patientId: string, 
  patientName: string,
  sessionData: { 
    date: string; 
    time?: string; 
    notes?: string; 
    paymentStatus: 'paid' | 'unpaid';
    paymentMethod?: 'cash' | 'upi';
    amount?: number;
  }
) => {
  const batch = writeBatch(db);
  
  // 1. Log the session
  const sessionsRef = collection(db, 'patients', patientId, 'sessions');
  const sessionDocRef = doc(sessionsRef);
  batch.set(sessionDocRef, {
    date: sessionData.date,
    time: sessionData.time || null,
    notes: sessionData.notes || null,
    paymentStatus: sessionData.paymentStatus,
    paymentMethod: sessionData.paymentMethod || null,
    amount: sessionData.amount || null,
    createdAt: Timestamp.now()
  });

  // 2. If paid, automatically log income transaction
  if (sessionData.paymentStatus === 'paid' && sessionData.amount && sessionData.amount > 0) {
    const transactionsRef = collection(db, 'transactions');
    const txDocRef = doc(transactionsRef);
    batch.set(txDocRef, {
      amount: sessionData.amount,
      category: 'Therapy Session',
      date: sessionData.date,
      time: sessionData.time || null,
      type: 'income',
      description: `Payment from ${patientName} (${sessionData.paymentMethod?.toUpperCase() || 'Other'})`,
      patientId: patientId || null,
      paymentMethod: sessionData.paymentMethod || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  // 3. Update patient counts
  const patientRef = doc(db, 'patients', patientId);
  const patientUpdates: any = {
    totalSessions: increment(1),
    updatedAt: Timestamp.now()
  };

  if (sessionData.paymentStatus === 'unpaid') {
    patientUpdates.unpaidSessionsCount = increment(1);
    patientUpdates.unpaidAmount = increment(sessionData.amount || 0);
  }

  batch.update(patientRef, patientUpdates);

  return batch.commit();
};

export const addPatientDocumentMetadata = async (patientId: string, docData: any) => {
  const docsRef = collection(db, 'patients', patientId, 'documents');
  return addDoc(docsRef, {
    ...docData,
    createdAt: Timestamp.now()
  });
};

export const getPatientDocumentsMetadata = (patientId: string, callback: (docs: any[]) => void) => {
  const q = query(collection(db, 'patients', patientId, 'documents'), orderBy('uploadDate', 'desc'), limit(20));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });
};

export const getRecentDocumentsMetadata = (callback: (docs: any[]) => void) => {
  const q = query(collectionGroup(db, 'documents'), orderBy('uploadDate', 'desc'), limit(5));
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      patientId: doc.ref.parent.parent?.id,
      ...doc.data()
    }));
    callback(docs);
  }, (error) => {
    console.error("collectionGroup index missing or error:", error);
    callback([]);
  });
};

export const deletePatientDocumentMetadata = async (patientId: string, docId: string) => {
  const docRef = doc(db, 'patients', patientId, 'documents', docId);
  return deleteDoc(docRef);
};

export const getSessions = (patientId: string, callback: (sessions: any[]) => void) => {
  const q = query(collection(db, 'patients', patientId, 'sessions'), orderBy('date', 'desc'), limit(20));
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(sessions);
  });
};

export const payUnpaidSessions = async (
  patientId: string,
  patientName: string,
  sessionIds: string[],
  totalAmount: number,
  paymentMethod: 'cash' | 'upi',
  date: string,
  time: string
) => {
  const batch = writeBatch(db);
  let txId = '';

  // Update all selected sessions
  sessionIds.forEach(sessionId => {
    const sessionRef = doc(db, 'patients', patientId, 'sessions', sessionId);
    batch.update(sessionRef, {
      paymentStatus: 'paid',
      paymentMethod: paymentMethod,
      updatedAt: Timestamp.now()
    });
  });

  // Log a single consolidated transaction for the payment
  if (totalAmount > 0) {
    const transactionsRef = collection(db, 'transactions');
    const txDocRef = doc(transactionsRef);
    txId = txDocRef.id;
    batch.set(txDocRef, {
      amount: totalAmount,
      category: 'Therapy Session',
      date: date,
      time: time,
      type: 'income',
      description: `Consolidated payment for ${sessionIds.length} session(s) from ${patientName}`,
      patientId: patientId,
      paymentMethod: paymentMethod,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  // Update patient's unpaid counters (decrement)
  const patientRef = doc(db, 'patients', patientId);
  batch.update(patientRef, {
    unpaidSessionsCount: increment(-sessionIds.length),
    unpaidAmount: increment(-totalAmount)
  });

  await batch.commit();
  return txId;
};

// Optimized Transaction Fetching
export const fetchTransactions = async (options: { type?: 'income' | 'expense', limitCount?: number, lastDoc?: any, month?: string } = {}) => {
  const transactionsRef = collection(db, 'transactions');
  const constraints: QueryConstraint[] = [orderBy('date', 'desc'), orderBy('createdAt', 'desc')];
  
  if (options.type) {
    constraints.push(where('type', '==', options.type));
  }

  if (options.month) {
    // Basic prefix matching for date string YYYY-MM
    constraints.push(where('date', '>=', options.month));
    constraints.push(where('date', '<=', options.month + '\uf8ff'));
  }

  if (options.limitCount) {
    constraints.push(limit(options.limitCount));
  } else {
    constraints.push(limit(50));
  }

  if (options.lastDoc) {
    constraints.push(startAfter(options.lastDoc));
  }

  const q = query(transactionsRef, ...constraints);
  try {
    const snapshot = await getDocs(q);
    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1]
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'transactions');
    return { data: [], lastDoc: null };
  }
};

export const logTransaction = async (transactionData: { 
  amount: number; 
  category: string; 
  date: string; 
  time?: string;
  type: 'income' | 'expense'; 
  description?: string;
  patientId?: string;
  paymentMethod?: string;
}) => {
  const transactionsRef = collection(db, 'transactions');
  return addDoc(transactionsRef, {
    ...transactionData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const updateTransaction = async (id: string, transactionData: any) => {
  const transactionRef = doc(db, 'transactions', id);
  return updateDoc(transactionRef, {
    ...transactionData,
    updatedAt: Timestamp.now()
  });
};

export const deleteTransaction = async (id: string) => {
  const transactionRef = doc(db, 'transactions', id);
  return deleteDoc(transactionRef);
};

export const getTransactions = (callback: (transactions: any[]) => void) => {
  const q = query(collection(db, 'transactions'), orderBy('date', 'desc'), limit(100));
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(transactions);
  });
};

// Optimized Dashboard Stats: One-time fetch of aggregated data
export const getDashboardStats = async () => {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const cacheKey = `stats_${currentMonth}`;
  
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  try {
    const patientsSnap = await getDocs(query(collection(db, 'patients'), limit(1))); // Just for total count?
    const txSnap = await getDocs(query(
      collection(db, 'transactions'), 
      where('date', '>=', currentMonth),
      where('date', '<=', currentMonth + '\uf8ff')
    ));

    let revenue = 0;
    let expenses = 0;
    
    txSnap.docs.forEach(doc => {
      const data = doc.data();
      if (data.type === 'income') revenue += data.amount;
      else expenses += data.amount;
    });

    const stats = {
      activePatients: (await getDocs(collection(db, 'patients'))).size, // Optimization: use a separate counter document in production
      monthlyRevenue: revenue,
      monthlyExpenses: expenses,
      netProfit: revenue - expenses
    };

    setCachedData(cacheKey, stats);
    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { activePatients: 0, monthlyRevenue: 0, monthlyExpenses: 0, netProfit: 0 };
  }
};

// Dashboard Stats (Real-time version - limited)
export const fetchDashboardStats = (callback: (stats: any) => void) => {
  const patientsQuery = collection(db, 'patients');
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
  const transactionsQuery = query(
    collection(db, 'transactions'), 
    where('date', '>=', currentMonth),
    where('date', '<=', currentMonth + '\uf8ff')
  );

  let stats = {
    activePatients: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0
  };

  // Aggressive limit to count patients
  const unsubPatients = onSnapshot(patientsQuery, (snapshot) => {
    stats.activePatients = snapshot.size;
    callback({ ...stats });
  });

  const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
    let revenue = 0;
    let expenses = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.type === 'income') revenue += data.amount;
      else expenses += data.amount;
    });

    stats.monthlyRevenue = revenue;
    stats.monthlyExpenses = expenses;
    stats.netProfit = revenue - expenses;
    callback({ ...stats });
  });

  return () => {
    unsubPatients();
    unsubTransactions();
  };
};

// Appointment Services
export const saveAppointment = async (appointmentData: { 
  patientId: string; 
  patientName: string; 
  patientPhone: string;
  therapistId?: string;
  therapistName?: string;
  sessionType?: string;
  date: string; 
  time: string; 
  status: 'scheduled' | 'completed' | 'cancelled' | 'blocked';
  notes?: string; 
}) => {
  const appointmentsRef = collection(db, 'appointments');
  return addDoc(appointmentsRef, {
    ...appointmentData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const updateAppointmentStatus = async (id: string, status: 'scheduled' | 'completed' | 'cancelled' | 'blocked', extraData?: any) => {
  const docRef = doc(db, 'appointments', id);
  return updateDoc(docRef, { 
    ...extraData,
    status, 
    updatedAt: Timestamp.now() 
  });
};

// Optimized Appointment Fetching: Limit by date
export const fetchAppointmentsRange = async (startDate: string, endDate: string) => {
  const q = query(
    collection(db, 'appointments'), 
    where('date', '>=', startDate), 
    where('date', '<=', endDate),
    orderBy('date', 'asc'),
    orderBy('time', 'asc')
  );
  
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'appointments');
    return [];
  }
};

export const getAppointments = (callback: (appointments: any[]) => void) => {
  // Real-time listener only for next 30 days of appointments to save reads
  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  const q = query(
    collection(db, 'appointments'), 
    where('date', '>=', today),
    where('date', '<=', nextMonthStr),
    orderBy('date', 'asc'),
    limit(200)
  );
  
  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(appointments);
  });
};

// Team & Attendance Services
export const saveTeamMember = async (memberData: { name: string; role: string; phone: string; email: string; password?: string }) => {
  const teamRef = collection(db, 'team');
  const cleanEmail = memberData.email.toLowerCase().trim();
  
  // Create Firebase Auth user via secondary app so current admin is not logged out
  if (memberData.password && memberData.password !== 'GOOGLE_AUTH' && memberData.password !== 'INVITE_ONLY') {
    try {
      await createUserWithEmailAndPassword(adminAuth, cleanEmail, memberData.password);
      await signOut(adminAuth);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log("Email already registered in Firebase Auth. Updating record in Firestore only.");
      } else {
        throw new Error(`Auth Error: ${error.message}`);
      }
    }
  }

  // Check if firestore record exists to prevent duplicates
  let snap;
  try {
    const q = query(teamRef, where('email', '==', cleanEmail));
    snap = await getDocs(q);
  } catch (err) {
    console.warn("Unable to check team existence (perms?):", err);
  }
  
  if (snap && !snap.empty) {
    // If it exists, update it instead of adding
    const docId = snap.docs[0].id;
    try {
      await updateDoc(doc(db, 'team', docId), {
        name: memberData.name,
        role: memberData.role.toLowerCase(),
        phone: memberData.phone,
        password: memberData.password,
        updatedAt: Timestamp.now()
      });
      return docId;
    } catch (err) {
      console.warn("Firestore update in saveTeamMember failed (possibly permissions):", err);
      if (!auth.currentUser) return docId; // Return ID anyway if not logged in (sync scenario)
      throw err;
    }
  }

  // Auto-generate a unique 4-digit staff ID on creation
  const generatedStaffId = 'FR-' + Math.floor(1000 + Math.random() * 9000).toString();

  // Save to db
  try {
    const docRef = await addDoc(teamRef, {
      name: memberData.name,
      staffId: generatedStaffId,
      role: memberData.role.toLowerCase(), // Admin, Receptionist, Therapist
      phone: memberData.phone,
      email: cleanEmail,
      password: memberData.password, // Store for admin reference
      isActive: true, // Default active
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  } catch (err) {
    console.error("Firestore creation in saveTeamMember failed:", err);
    if (!auth.currentUser) return "temp-id-sync";
    throw err;
  }
};

export const updateTeamMemberStatus = async (id: string, isActive: boolean) => {
  const docRef = doc(db, 'team', id);
  return updateDoc(docRef, { 
    isActive,
    updatedAt: Timestamp.now() 
  });
};

export const updateTeamMember = async (id: string, data: any) => {
  const docRef = doc(db, 'team', id);
  return updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  });
};

export const uploadPatientDocument = (
  patientId: string, 
  file: File, 
  onProgress: (progress: number) => void
): Promise<{ url: string, fullPath: string }> => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().getTime();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageRef = ref(storage, `patients/${patientId}/documents/${timestamp}_${safeName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      }, 
      (error) => {
        reject(error);
      }, 
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ url: downloadURL, fullPath: storageRef.fullPath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};

export const deletePatientDocument = async (fullPath: string) => {
  const storageRef = ref(storage, fullPath);
  return deleteObject(storageRef);
};

export const fetchTeamMembers = async () => {
  const q = query(collection(db, 'team'), orderBy('name', 'asc'));
  try {
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.role && data.role.toLowerCase() === 'therapist') {
        data.role = 'physiotherapist';
      }
      return { id: doc.id, ...data };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'team');
    return [];
  }
};

export const getTeamMembers = (callback: (members: any[]) => void) => {
  const q = query(collection(db, 'team'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => {
      const data = doc.data();
      if (data.role && data.role.toLowerCase() === 'therapist') {
        data.role = 'physiotherapist';
      }
      return { id: doc.id, ...data };
    });
    callback(members);
  });
};

export const deleteTeamMember = async (id: string) => {
  const docRef = doc(db, 'team', id);
  return deleteDoc(docRef);
};

export const logAttendance = async (attendanceData: { 
  memberId: string; 
  memberName: string; 
  date: string; 
  checkIn?: string; 
  status: 'present' | 'absent' | 'late' 
}) => {
  const attendanceRef = collection(db, 'attendance');
  return addDoc(attendanceRef, {
    ...attendanceData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const updateAttendance = async (id: string, updates: any) => {
  const docRef = doc(db, 'attendance', id);
  return updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const getAttendance = (date: string, callback: (records: any[]) => void) => {
  const q = query(collection(db, 'attendance'), where('date', '==', date));
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(records);
  });
};

export const getAttendanceRange = (startDate: string, endDate: string, callback: (records: any[]) => void) => {
  const q = query(
    collection(db, 'attendance'), 
    where('date', '>=', startDate), 
    where('date', '<=', endDate)
  );
  return onSnapshot(q, (snapshot) => {
    const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(records);
  });
};
