import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, Timestamp, onSnapshot, where, writeBatch, increment } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Secondary app instance specifically used so Admin doesn't get logged out when creating new staff accounts
const adminApp = initializeApp(firebaseConfig, 'AdminApp');
const adminAuth = getAuth(adminApp);
setPersistence(adminAuth, browserSessionPersistence).catch(err => console.error("AdminAuth persistence error:", err));

const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const signInWithEmail = (email: string, pass: string) => {
  console.log(`[Auth] Attempting sign-in for: ${email}`);
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const checkMemberAuthorization = async (identifier: string) => {
  const cleanId = identifier.trim();
  const lowerId = cleanId.toLowerCase();
  const numericOnly = cleanId.replace(/[^0-9]/g, '');
  const teamRef = collection(db, 'team');
  
  // Try email match (exact or lowercased)
  let q = query(teamRef, where('email', '==', lowerId));
  let snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    q = query(teamRef, where('email', '==', cleanId));
    snapshot = await getDocs(q);
  }
  
  // Try staffId match (exact, upper, or numeric normalize)
  if (snapshot.empty) {
    const variations = [cleanId, cleanId.toUpperCase(), lowerId];
    for (const val of variations) {
      q = query(teamRef, where('staffId', '==', val));
      snapshot = await getDocs(q);
      if (!snapshot.empty) break;
    }
  }

  // Try phone match
  if (snapshot.empty) {
    q = query(teamRef, where('phone', '==', cleanId));
    snapshot = await getDocs(q);
  }

  // Final fallback: check all members if numeric only matches OR name matches
  if (snapshot.empty) {
    const allMembers = await getDocs(teamRef);
    const found = allMembers.docs.find(d => {
      const data = d.data();
      const p = data.phone || '';
      const sid = data.staffId || '';
      const name = data.name || '';
      
      return (numericOnly && p.replace(/[^0-9]/g, '') === numericOnly) || 
             (numericOnly && String(sid).replace(/[^0-9]/g, '') === numericOnly) ||
             (name.toLowerCase().trim() === lowerId);
    });
    if (found) return { id: found.id, ...found.data() };
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

export const getPatients = (callback: (patients: any[]) => void) => {
  const q = query(collection(db, 'patients'), orderBy('name', 'asc'));
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

  // 3. If unpaid, increment the patient's unpaid logic
  if (sessionData.paymentStatus === 'unpaid') {
    const patientRef = doc(db, 'patients', patientId);
    batch.update(patientRef, {
      unpaidSessionsCount: increment(1),
      unpaidAmount: increment(sessionData.amount || 0)
    });
  }

  return batch.commit();
};

export const getSessions = (patientId: string, callback: (sessions: any[]) => void) => {
  const q = query(collection(db, 'patients', patientId, 'sessions'), orderBy('date', 'desc'), limit(50));
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

// Transaction Services
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
  const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(transactions);
  });
};

// Dashboard Stats
export const fetchDashboardStats = (callback: (stats: any) => void) => {
  const patientsQuery = collection(db, 'patients');
  const transactionsQuery = collection(db, 'transactions');

  let stats = {
    activePatients: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0
  };

  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  // Since we want real-time, we listen to both
  const unsubPatients = onSnapshot(patientsQuery, (snapshot) => {
    stats.activePatients = snapshot.size;
    callback({ ...stats });
  });

  const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
    let revenue = 0;
    let expenses = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.date.startsWith(currentMonth)) {
        if (data.type === 'income') revenue += data.amount;
        else expenses += data.amount;
      }
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

export const getAppointments = (callback: (appointments: any[]) => void) => {
  const q = query(collection(db, 'appointments'), orderBy('date', 'asc'));
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

export const getTeamMembers = (callback: (members: any[]) => void) => {
  const q = query(collection(db, 'team'), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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

export const clearDatabase = async () => {
  const collectionsToClear = ['patients', 'appointments', 'transactions', 'attendance'];
  
  for (const collectionName of collectionsToClear) {
    const snapshot = await getDocs(collection(db, collectionName));
    const batch = writeBatch(db);
    
    for (const d of snapshot.docs) {
      if (collectionName === 'patients') {
        const sessionsSnapshot = await getDocs(collection(db, 'patients', d.id, 'sessions'));
        if (!sessionsSnapshot.empty) {
          const sessionBatch = writeBatch(db);
          sessionsSnapshot.docs.forEach(s => sessionBatch.delete(s.ref));
          await sessionBatch.commit();
        }
      }
      batch.delete(d.ref);
    }
    
    if (snapshot.docs.length > 0) {
      await batch.commit();
    }
  }
};
