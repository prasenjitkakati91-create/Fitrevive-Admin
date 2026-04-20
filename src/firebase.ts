import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, doc, updateDoc, deleteDoc, Timestamp, onSnapshot, where, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const signIn = () => signInWithPopup(auth, googleProvider);
export const logOut = () => signOut(auth);

// Patient Services
export const savePatient = async (patientData: { name: string; phone: string; age: number; medicalHistory: string }) => {
  const patientsRef = collection(db, 'patients');
  return addDoc(patientsRef, {
    ...patientData,
    createdAt: Timestamp.now(),
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
    ...sessionData,
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
      type: 'income',
      description: `Payment from ${patientName} (${sessionData.paymentMethod?.toUpperCase() || 'Other'})`,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
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

// Transaction Services
export const logTransaction = async (transactionData: { amount: number; category: string; date: string; type: 'income' | 'expense'; description?: string }) => {
  const transactionsRef = collection(db, 'transactions');
  return addDoc(transactionsRef, {
    ...transactionData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
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
  date: string; 
  time: string; 
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string; 
}) => {
  const appointmentsRef = collection(db, 'appointments');
  return addDoc(appointmentsRef, {
    ...appointmentData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
};

export const updateAppointmentStatus = async (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
  const docRef = doc(db, 'appointments', id);
  return updateDoc(docRef, { status, updatedAt: Timestamp.now() });
};

export const getAppointments = (callback: (appointments: any[]) => void) => {
  const q = query(collection(db, 'appointments'), orderBy('date', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(appointments);
  });
};

// Team & Attendance Services
export const saveTeamMember = async (memberData: { name: string; role: string; phone: string }) => {
  const teamRef = collection(db, 'team');
  return addDoc(teamRef, {
    ...memberData,
    createdAt: Timestamp.now(),
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
