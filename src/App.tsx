import React, { useState, useEffect, useRef, useMemo } from 'react';
const LogoImage = "https://raw.githubusercontent.com/prasenjitkakati91-create/fit-images/main/logo-2.jpg";
import { 
  Users, 
  UserPlus,
  LayoutDashboard, 
  CircleDollarSign, 
  FileText, 
  LogOut, 
  Plus, 
  Search, 
  Menu, 
  X,
  Globe,
  TrendingUp,
  TrendingDown,
  Activity,
  History,
  Share2,
  Phone,
  Filter,
  CalendarCheck,
  Calendar,
  Clock,
  BadgeCheck,
  MessageSquare,
  ClipboardList,
  Edit,
  Trash2,
  Printer,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserMinus,
  UserX,
  CheckCircle,
  CalendarRange,
  Clock3,
  User2,
  AlertCircle,
  Smartphone,
  MapPin,
  Zap,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  XCircle,
  BarChart3,
  Archive,
  CreditCard,
  IndianRupee,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  MoreVertical,
  Coins,
  Pencil,
  Shield,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Lock,
  Stethoscope,
  HelpCircle,
  Settings,
  Building2,
  Palette,
  Bell,
  Database,
  Monitor,
  DownloadCloud,
  UploadCloud,
  ShieldAlert,
  Moon,
  Sun
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User, updateProfile } from 'firebase/auth';
import { 
  auth, 
  signIn, 
  signInWithEmail,
  checkMemberAuthorization,
  logOut, 
  resetPassword,
  savePatient, 
  updatePatient,
  getPatients, 
  logSession,
  getSessions,
  payUnpaidSessions,
  logTransaction, 
  updateTransaction,
  deleteTransaction,
  getTransactions, 
  fetchDashboardStats,
  saveAppointment,
  updateAppointmentStatus,
  getAppointments,
  saveTeamMember,
  updateTeamMember,
  updateTeamMemberStatus,
  getTeamMembers,
  deleteTeamMember,
  getAttendance,
  getAttendanceRange,
  logAttendance,
  clearDatabase,
  db
} from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  condition: string;
  address?: string;
  medicalHistory: string;
  treatmentStatus?: 'Active' | 'Completed';
  unpaidSessionsCount?: number;
  unpaidAmount?: number;
}

interface Session {
  id: string;
  date: string;
  time?: string;
  paymentStatus: 'paid' | 'unpaid';
  paymentMethod?: 'cash' | 'upi';
  amount?: number;
  notes?: string;
}

interface Transaction {
  id: string;
  amount: number;
  category: string;
  date: string;
  time?: string;
  type: 'income' | 'expense';
  description?: string;
  patientId?: string;
  paymentMethod?: string;
  createdAt?: any;
}

interface DashboardStats {
  activePatients: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
}

interface Appointment {
  id: string;
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
}

// --- Utilities ---
const getLocalYMD = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user, isOpen, onClose, isCollapsed, setIsCollapsed, role, setRole, badges = {} }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void, 
  user: User, 
  isOpen: boolean, 
  onClose: () => void,
  isCollapsed: boolean,
  setIsCollapsed: (val: boolean) => void,
  role: 'admin' | 'manager' | 'therapist' | null,
  setRole: (role: any) => void,
  badges?: { [key: string]: number }
}) => {
  const sections = [
    { 
      title: 'Main Menu', 
      roles: ['admin', 'manager', 'therapist'],
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'therapist'] },
        { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['admin', 'manager'], badge: badges.appointments },
        { id: 'sessions', label: 'Sessions', icon: Activity, roles: ['admin', 'therapist'] },
      ]
    },
    { 
      title: 'Operations', 
      roles: ['admin', 'manager', 'therapist'],
      items: [
        { id: 'patients', label: 'Patients', icon: Users, roles: ['admin', 'manager', 'therapist'], badge: badges.patients },
        { id: 'finances', label: 'Billing & Ledger', icon: CircleDollarSign, roles: ['admin', 'manager'], badge: badges.finances },
        { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['admin', 'manager', 'therapist'] },
      ]
    },
    { 
      title: 'Administration', 
      roles: ['admin'],
      items: [
        { id: 'team', label: 'Staff HR', icon: BadgeCheck, roles: ['admin'] },
        { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin'] },
      ]
    },
    {
      title: 'Preferences',
      roles: ['admin', 'manager', 'therapist'],
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin', 'manager', 'therapist'] },
      ]
    }
  ];

  const filteredSections = sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => role && item.roles.includes(role))
    }))
    .filter(section => section.items.length > 0 && (!section.roles || (role && section.roles.includes(role))));

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/50 z-40 transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      <aside className={cn(
        "bg-white h-screen fixed left-0 top-0 flex flex-col z-50 border-r border-slate-200 transition-all duration-300 md:translate-x-0 shadow-sm",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Logo Section */}
        <div className={cn("p-6 flex items-center justify-between", isCollapsed ? "px-4" : "")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full shrink-0 bg-white flex items-center justify-center shadow-lg shadow-blue-50 border border-slate-100 overflow-hidden">
               <img src={LogoImage} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-xl font-black text-slate-800 tracking-tight">FitRevive</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Physiotherapy Clinic</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Role Badge */}
        {!isCollapsed && (
          <div className="px-4 mt-6 animate-in fade-in slide-in-from-top-1 duration-500">
            <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Access Role</span>
              </div>
              <div className="text-sm font-bold text-slate-800 capitalize">
                {role === 'admin' ? 'Administrator' : role}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className={cn("flex-1 px-3 space-y-4 overflow-y-auto mt-6 pt-2", isCollapsed ? "px-2" : "px-3")}>
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && (
                <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-70">
                  {section.title}
                </h4>
              )}
              {section.items.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    onClose();
                  }}
                  title={isCollapsed ? tab.label : ''}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 active:scale-95 group relative",
                    activeTab === tab.id 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <tab.icon className={cn(
                    "w-5 h-5 transition-transform duration-200 group-hover:scale-110", 
                    activeTab === tab.id ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  
                  {!isCollapsed && (
                    <span className={cn(
                      "text-sm tracking-tight transition-all duration-200",
                      activeTab === tab.id ? "font-bold" : "font-semibold"
                    )}>
                      {tab.label}
                    </span>
                  )}

                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={cn(
                      "ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm",
                      activeTab === tab.id ? "bg-white text-blue-600" : "bg-blue-600 text-white"
                    )}>
                      {tab.badge}
                    </span>
                  )}

                  {isCollapsed && tab.badge !== undefined && tab.badge > 0 && activeTab !== tab.id && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-16 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 z-[60] whitespace-nowrap shadow-xl">
                      {tab.label}
                    </div>
                  )}
                </button>
              ))}
              {sIdx < filteredSections.length - 1 && isCollapsed && (
                <div className="mx-2 h-px bg-slate-100 my-4" />
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Toggle Button (Desktop Only) */}
        <div className="hidden md:flex px-4 py-4 justify-center">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
        </div>

        {/* Bottom Section: User Profile */}
        <div className={cn("p-4 border-t border-slate-100 bg-slate-50/50 mt-auto", isCollapsed ? "p-2" : "p-4")}>
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
            <div className="relative shrink-0 group cursor-pointer">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=3b82f6&color=ffffff`} 
                alt="User" 
                className={cn("rounded-xl border border-white shadow-md transition-all group-hover:ring-4 group-hover:ring-blue-100", isCollapsed ? "w-10 h-10" : "w-12 h-12")}
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-500">
                <p className="text-sm font-black text-slate-800 truncate leading-tight">{user.displayName || 'Staff'}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{role}</p>
              </div>
            )}
            
            {!isCollapsed && (
              <div className="flex flex-col gap-1">
                <button 
                  onClick={logOut}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

const Dashboard = ({ 
  stats, 
  transactions, 
  appointments, 
  patients,
  members,
  role,
  setTab,
  onNotify,
  user,
  onStatusUpdate,
  setViewTarget
}: { 
  stats: DashboardStats, 
  transactions: Transaction[], 
  appointments: Appointment[], 
  patients: Patient[],
  members: any[],
  role: 'admin' | 'manager' | 'therapist' | null,
  setTab: (tab: string) => void,
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void,
  user: User,
  onStatusUpdate?: (apptId: string, status: any) => Promise<void>,
  setViewTarget?: any
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '6m'>('30d');
  const [patientSearch, setPatientSearch] = useState('');
  const [ledgerDate, setLedgerDate] = useState(getLocalYMD());
  const [quickBill, setQuickBill] = useState({ patientId: '', service: 'physio', amount: '500' });
  const [isBilling, setIsBilling] = useState(false);
  
  const todayDate = getLocalYMD();
  const todayAppts = appointments.filter(a => a.date === todayDate && a.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time));
  const todayCompleted = useMemo(() => appointments.filter(a => a.date === todayDate && a.status === 'completed').length, [appointments, todayDate]);
  
  // Pending payments: Sum of all unpaid sessions and amounts across all patients
  const { pendingPaymentsCount, pendingPaymentsAmount } = useMemo(() => {
    return patients.reduce((acc, p) => ({
      pendingPaymentsCount: acc.pendingPaymentsCount + (p.unpaidSessionsCount || 0),
      pendingPaymentsAmount: acc.pendingPaymentsAmount + (p.unpaidAmount || 0)
    }), { pendingPaymentsCount: 0, pendingPaymentsAmount: 0 });
  }, [patients]);

  // Live Activity Feed
  const liveActivity = useMemo(() => {
    const activities: any[] = [];
    
    // Helper to get time or fallback
    const getTime = (item: any) => {
      if (item.createdAt?.seconds) return item.createdAt.seconds * 1000;
      if (typeof item.createdAt === 'string') return new Date(item.createdAt).getTime();
      return Date.now() - (Math.random() * 10000000); // Random fallback for ordering
    };

    patients.slice(-3).forEach(p => {
      activities.push({
        id: `p-${p.id}`,
        title: 'Patient Joined',
        subtitle: p.name,
        time: 'Recently',
        icon: UserCheck,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        sortTime: getTime(p)
      });
    });

    appointments.slice(-3).forEach(a => {
      activities.push({
        id: `a-${a.id}`,
        title: 'New Booking',
        subtitle: `${a.patientName} at ${a.time}`,
        time: 'Just now',
        icon: CalendarCheck,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50',
        sortTime: getTime(a)
      });
    });

    transactions.filter(t => t.type === 'income').slice(-3).forEach(t => {
      activities.push({
        id: `t-${t.id}`,
        title: 'Payment Received',
        subtitle: `₹${t.amount} for session`,
        time: 'Completed',
        icon: IndianRupee,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        sortTime: getTime(t)
      });
    });

    return activities.sort((a, b) => b.sortTime - a.sortTime).slice(0, 6);
  }, [patients, appointments, transactions]);

  const todayIncome = transactions.filter(t => t.date === todayDate && t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const todayExpense = transactions.filter(t => t.date === todayDate && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  
  const ledgerIncome = transactions.filter(t => t.date === ledgerDate && t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const ledgerExpense = transactions.filter(t => t.date === ledgerDate && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const searchedPatients = patients.filter(p => p.phone.includes(patientSearch) || p.name.toLowerCase().includes(patientSearch.toLowerCase()) || p.id.toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 5);

  const handleQuickBill = async () => {
    if (!quickBill.patientId) {
      onNotify("Please select a patient first.", "error");
      return;
    }
    
    setIsBilling(true);
    try {
      const patient = patients.find(p => p.id === quickBill.patientId);
      const serviceNames: any = { physio: 'Physiotherapy', dry: 'Dry Needling', manual: 'Manual Therapy' };
      
      await logTransaction({
        amount: parseFloat(quickBill.amount),
        category: serviceNames[quickBill.service] || 'Therapy',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().substring(0, 5),
        type: 'income',
        description: `Quick Billing: ${serviceNames[quickBill.service]} for ${patient?.name}`,
        patientId: quickBill.patientId,
        paymentMethod: 'Cash' // Default
      });
      
      onNotify(`Bill of ₹${quickBill.amount} generated for ${patient?.name}`);
      setQuickBill({ patientId: '', service: 'physio', amount: '500' });
    } catch (err: any) {
      onNotify(err.message || "Billing failed", "error");
    } finally {
      setIsBilling(false);
    }
  };

  // Helper to filter data by timeframe
  const getFilteredData = (data: any[]) => {
    const now = new Date();
    let threshold = new Date();
    if (timeframe === '7d') threshold.setDate(now.getDate() - 7);
    else if (timeframe === '30d') threshold.setDate(now.getDate() - 30);
    else if (timeframe === '6m') threshold.setMonth(now.getMonth() - 6);
    
    return data.filter(item => new Date(item.date) >= threshold);
  };

  // Generate Chart Data
  const filteredTransactions = getFilteredData(transactions);
  
  const chartData = useMemo(() => {
    const groups: { [key: string]: { date: string, income: number, expense: number } } = {};
    
    // Fill in last 30 intervals based on timeframe
    const now = new Date();
    const count = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 6;
    const unit = timeframe === '6m' ? 'month' : 'day';
    
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      if (unit === 'day') d.setDate(now.getDate() - i);
      else d.setMonth(now.getMonth() - i);
      
      const key = unit === 'day' ? d.toISOString().split('T')[0] : d.toLocaleString('default', { month: 'short' });
      groups[key] = { date: key, income: 0, expense: 0 };
    }

    filteredTransactions.forEach(t => {
      const d = new Date(t.date);
      const key = unit === 'day' ? t.date : d.toLocaleString('default', { month: 'short' });
      if (groups[key]) {
        if (t.type === 'income') groups[key].income += t.amount;
        else groups[key].expense += t.amount;
      }
    });

    return Object.values(groups);
  }, [filteredTransactions, timeframe]);

  // Expense Categories Data
  const expensePieData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
      const cat = t.category || 'Other';
      categories[cat] = (categories[cat] || 0) + t.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Administrative components
  const SummaryCard = ({ title, value, trend, icon: Icon, colorClass, data }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={cn("inline-flex p-3 rounded-2xl transition-colors", colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end">
          {trend !== undefined && (
            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold", 
              trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
              {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(trend)}%
            </div>
          )}
          <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">vs last month</span>
        </div>
      </div>
      
      <div className="flex flex-col mb-4">
        <span className="text-sm font-bold text-slate-500 mb-1">{title}</span>
        <div className="text-3xl font-black text-slate-900 tracking-tight">{value}</div>
      </div>

      <div className="h-10 w-full opacity-50 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data || []}>
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke={colorClass.includes('emerald') ? '#10b981' : colorClass.includes('rose') ? '#ef4444' : '#3b82f6'} 
              fill={colorClass.includes('emerald') ? '#10b981' : colorClass.includes('rose') ? '#ef4444' : '#3b82f6'} 
              fillOpacity={0.1} 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );

  const FinancialDashboard = () => (
    <div className="space-y-8 pb-10">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">Daily Ledger Lookup</h3>
            <p className="text-xs text-slate-500 font-bold">Select any date to view historical performance</p>
          </div>
          <input 
            type="date" 
            value={ledgerDate}
            onChange={(e) => setLedgerDate(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-200">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">Income ({ledgerDate})</span>
                <div className="text-2xl font-black text-slate-900">₹{ledgerIncome.toLocaleString()}</div>
              </div>
           </div>
           
           <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm border border-rose-200">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block mb-0.5">Expense ({ledgerDate})</span>
                <div className="text-2xl font-black text-slate-900">₹{ledgerExpense.toLocaleString()}</div>
              </div>
           </div>

           <div className={cn("p-5 rounded-2xl border flex items-center gap-4 transition-colors", 
             (ledgerIncome - ledgerExpense) >= 0 ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100")}>
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border",
                (ledgerIncome - ledgerExpense) >= 0 ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-rose-100 text-rose-600 border-rose-200")}>
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className={cn("text-[10px] font-black uppercase tracking-widest block mb-0.5",
                  (ledgerIncome - ledgerExpense) >= 0 ? "text-emerald-600" : "text-rose-600")}>Daily Balance</span>
                <div className="text-2xl font-black text-slate-900">₹{(ledgerIncome - ledgerExpense).toLocaleString()}</div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Revenue" 
          value={`₹${stats.monthlyRevenue.toLocaleString()}`} 
          trend={12} 
          icon={TrendingUp} 
          colorClass="bg-blue-50 text-blue-600"
          data={chartData.slice(-7).map(d => ({ val: d.income }))}
        />
        <SummaryCard 
          title="Expenses" 
          value={`₹${stats.monthlyExpenses.toLocaleString()}`} 
          trend={-4} 
          icon={TrendingDown} 
          colorClass="bg-rose-50 text-rose-600"
          data={chartData.slice(-7).map(d => ({ val: d.expense }))}
        />
        <SummaryCard 
          title="Net Profit" 
          value={`₹${stats.netProfit.toLocaleString()}`} 
          trend={15} 
          icon={Activity} 
          colorClass="bg-indigo-50 text-indigo-600"
          data={chartData.slice(-7).map(d => ({ val: d.income - d.expense }))}
        />
        <SummaryCard 
          title="Total Patients" 
          value={patients.length} 
          trend={8} 
          icon={Users} 
          colorClass="bg-emerald-50 text-emerald-600"
          data={[{val: 10}, {val: 15}, {val: 12}, {val: 20}, {val: 18}, {val: 25}, {val: 30}]}
        />
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800">Financial Insights</h2>
          <p className="text-sm text-slate-500 font-medium">Analyze your clinic's business performance</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(['7d', '30d', '6m'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                timeframe === t 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {t === '7d' ? 'Last 7 Days' : t === '30d' ? 'Last 30 Days' : 'Last 6 Months'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Revenue vs Expenses</h3>
            <div className="flex gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Revenue</div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Expenses</div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="income" name="Revenue" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" name="Expenses" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col"
        >
          <h3 className="font-bold text-slate-800 mb-6">Expense Breakdown</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensePieData.length > 0 ? expensePieData : [{ name: 'No Data', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(expensePieData.length > 0 ? expensePieData : [{ name: 'No Data', value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 overflow-auto mt-4">
             <div className="space-y-3">
                {expensePieData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="font-bold text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-black text-slate-900">₹{item.value.toLocaleString()}</span>
                  </div>
                ))}
                {expensePieData.length === 0 && <p className="text-center text-sm text-slate-400 italic">No expenses recorded for this period.</p>}
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  // Existing Dashboards Logic
  const ManagerDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 2. TOP HEADER (SMART SUMMARY BAR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
             <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">{patients.length}</span>
              <span className="text-[10px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded-full flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" /> 12%
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Patients</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
             <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">{todayAppts.length}</span>
              <span className="text-[10px] font-bold text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded-full">Today</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Appointments</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
             < IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">₹{pendingPaymentsAmount.toLocaleString()}</span>
              <span className="text-[10px] font-bold text-rose-600 px-1.5 py-0.5 bg-rose-50 rounded-full flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" /> {pendingPaymentsCount} Due
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Pending Payments</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
             <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-900">{todayCompleted}</span>
              <span className="text-[10px] font-bold text-emerald-600 px-1.5 py-0.5 bg-emerald-50 rounded-full">Done</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Sessions Completed</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* 3. SEARCH SECTION (MAKE IT POWERFUL) */}
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600 rounded-2xl blur-xl opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <div className="relative flex bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-1 transition-colors">
              <div className="flex-1 relative flex items-center">
                 <Search className="absolute left-6 w-5 h-5 text-slate-400 dark:text-slate-500" />
                 <input 
                   placeholder="Search Patient by Name, Phone or ID..." 
                   value={patientSearch}
                   onChange={e => setPatientSearch(e.target.value)}
                   className="w-full bg-transparent pl-16 pr-6 py-5 text-lg font-bold text-slate-800 dark:text-slate-200 outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                 />
              </div>
            </div>

            {patientSearch && (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl py-4 z-50 text-slate-800 border border-slate-100"
                >
                   <div className="px-6 mb-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Results</span>
                   </div>
                   {searchedPatients.length > 0 ? searchedPatients.map(p => (
                     <div key={p.id} className="flex justify-between items-center px-6 py-4 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black">
                            {p.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">{p.name}</span>
                            <span className="text-slate-500 text-xs flex items-center gap-1.5"><Phone className="w-3 h-3" /> {p.phone}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { if(setViewTarget) setViewTarget({ type: 'book-appointment', id: p.id }); setTab('appointments'); setPatientSearch(''); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all" title="Book Appointment">
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setTab('patients'); setPatientSearch(''); }} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all" title="View Profile">
                            <User2 className="w-4 h-4" />
                          </button>
                        </div>
                     </div>
                   )) : (
                     <div className="p-10 text-center">
                        <UserMinus className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium">No patients found</p>
                     </div>
                   )}
                   <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center">
                      <button onClick={() => { setPatientSearch(''); setTab('patients'); }} className="text-blue-600 font-bold hover:underline text-sm">Register as New Patient</button>
                   </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* 4. TODAY’S APPOINTMENTS (CORE SECTION) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
             <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100"><Clock className="w-5 h-5 text-blue-600" /></div>
                   <div>
                     <h2 className="text-lg font-black text-slate-900">Today's Schedule</h2>
                     <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setTab('appointments')}
                  className="flex items-center gap-2 text-xs font-black text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
                >
                  <Plus className="w-4 h-4" /> Book Appointment
                </button>
             </div>
             <div className="overflow-x-auto w-full">
               <table className="w-full border-collapse min-w-full md:min-w-[800px]">
                 <thead className="hidden md:table-header-group">
                   <tr className="bg-slate-50/30 text-left">
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Therapist</th>
                     <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 block md:table-row-group">
                   {todayAppts.length > 0 ? todayAppts.map(appt => (
                     <tr key={appt.id} className="group hover:bg-blue-50/20 transition-all block md:table-row pb-4 md:pb-0 pt-2 md:pt-0 border-b border-slate-100 md:border-none relative">
                       <td className="px-4 md:px-8 py-2 md:py-5 block md:table-cell md:border-none">
                         <div className="flex items-center justify-between md:justify-start gap-2">
                           <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                             <span className="font-black text-slate-950 text-base">{appt.time}</span>
                           </div>
                           <span className={cn(
                             "md:hidden px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                             appt.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                             appt.status === 'cancelled' ? "bg-rose-50 text-rose-600" :
                             "bg-blue-50 text-blue-600"
                           )}>
                             {appt.status}
                           </span>
                         </div>
                       </td>
                       <td className="px-4 md:px-8 py-2 md:py-5 block md:table-cell md:border-none">
                         <div className="flex flex-col">
                           <span className="font-bold text-slate-800 tracking-tight">{appt.patientName}</span>
                           <span className="text-[11px] text-slate-400 font-bold">{appt.sessionType || 'Session'}</span>
                         </div>
                       </td>
                       <td className="px-4 py-2 md:px-8 md:py-5 text-sm font-bold text-slate-500 block md:table-cell border-none md:ml-16">
                         <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:hidden">Therapist:</span>
                           {appt.therapistName || <span className="text-rose-400 italic">Not assigned</span>}
                         </div>
                       </td>
                       <td className="hidden md:table-cell px-8 py-5">
                         <span className={cn(
                           "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                           appt.status === 'completed' ? "bg-emerald-50 text-emerald-600" :
                           appt.status === 'cancelled' ? "bg-rose-50 text-rose-600" :
                           "bg-blue-50 text-blue-600"
                         )}>
                           {appt.status}
                         </span>
                       </td>
                       <td className="px-4 py-3 md:px-8 md:py-5 md:text-right border-t border-slate-50 md:border-none block md:table-cell md:ml-16">
                         <div className="flex justify-between md:justify-end items-center gap-2 transition-opacity">
                            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase md:hidden">Actions</span>
                            <div className="flex items-center gap-2">
                              {appt.status !== 'completed' && (
                                <button 
                                  onClick={async () => {
                                    if (onStatusUpdate) {
                                      try {
                                        await onStatusUpdate(appt.id, 'completed');
                                        onNotify(`Checked in ${appt.patientName}`);
                                      } catch (err) {
                                        onNotify("Check-in failed", "error");
                                      }
                                    }
                                  }}
                                  className="p-2 bg-emerald-50 md:bg-transparent md:hover:bg-emerald-50 rounded-lg text-emerald-600 md:text-slate-400 hover:text-emerald-600 transition-all font-bold flex items-center gap-1.5 border border-emerald-200 md:border-transparent" 
                                  title="Check-in Patient"
                                >
                                   <BadgeCheck className="w-4 h-4" />
                                   <span className="text-[10px] uppercase">Check-in</span>
                                </button>
                              )}
                              {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                <button 
                                  onClick={async () => {
                                    if (onStatusUpdate) {
                                      try {
                                        await onStatusUpdate(appt.id, 'cancelled');
                                        onNotify(`Marked ${appt.patientName} as not present`);
                                      } catch (err) {
                                        onNotify("Update failed", "error");
                                      }
                                    }
                                  }}
                                  className="p-2 bg-rose-50 md:bg-transparent md:hover:bg-rose-50 rounded-lg text-rose-600 md:text-slate-400 hover:text-rose-600 transition-all font-bold flex items-center gap-1.5 border border-rose-200 md:border-transparent" 
                                  title="Patient Not Present"
                                >
                                   <UserX className="w-4 h-4" />
                                   <span className="text-[10px] uppercase hidden md:inline">Absent</span>
                                </button>
                              )}
                              {appt.status === 'completed' && (
                                <button 
                                  onClick={async () => {
                                    if (onStatusUpdate) {
                                      try {
                                        await onStatusUpdate(appt.id, 'scheduled');
                                        onNotify(`Marked ${appt.patientName} as incomplete`);
                                      } catch (err) {
                                        onNotify("Update failed", "error");
                                      }
                                    }
                                  }}
                                  className="p-2 bg-amber-50 md:bg-transparent md:hover:bg-amber-50 rounded-lg text-amber-600 md:text-slate-400 hover:text-amber-600 transition-all font-bold flex items-center gap-1.5 border border-amber-200 md:border-transparent" 
                                  title="Mark as Not Complete"
                                >
                                   <XCircle className="w-4 h-4" />
                                   <span className="text-[10px] uppercase hidden md:inline">Incomplete</span>
                                </button>
                              )}
                              <button className="p-2 bg-white md:bg-transparent border border-slate-200 md:border-transparent md:hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all" title="View">
                                 <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </div>
                         </div>
                       </td>
                     </tr>
                   )) : (
                     <tr>
                        <td colSpan={5} className="py-20 text-center">
                           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Calendar className="w-8 h-8 text-slate-300" />
                           </div>
                           <p className="text-slate-400 font-bold italic">Zero appointments found for today</p>
                           <button onClick={() => setTab('appointments')} className="mt-4 text-blue-600 font-black text-sm hover:underline tracking-tight">+ Book First Appointment</button>
                        </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) */}
        <div className="space-y-8">
          {/* 5. QUICK ACTIONS PANEL */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-2xl"></div>
             
             <div className="relative">
                <h3 className="text-xl font-black text-slate-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={() => setTab('patients')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all gap-2 group">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <UserPlus className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Add Patient</span>
                   </button>
                   <button onClick={() => setTab('appointments')} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all gap-2 group">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                         <CalendarCheck className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Book Visit</span>
                   </button>
                </div>
             </div>

             <div className="pt-6 border-t border-slate-100 relative">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Walk-in Billing</h4>
                <div className="space-y-4">
                  <select 
                    value={quickBill.patientId}
                    onChange={e => setQuickBill({...quickBill, patientId: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-700 focus:border-blue-500 outline-none transition-all text-sm"
                  >
                    <option value="">-- Select Patient --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <select 
                      value={quickBill.service}
                      onChange={e => setQuickBill({...quickBill, service: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-700 focus:border-blue-500 outline-none transition-all text-xs"
                    >
                      <option value="physio">Physiotherapy</option>
                      <option value="dry">Dry Needling</option>
                      <option value="manual">Manual Therapy</option>
                    </select>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input 
                        type="number" 
                        value={quickBill.amount}
                        onChange={e => setQuickBill({...quickBill, amount: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 p-3.5 pl-8 rounded-xl font-black text-slate-800 outline-none focus:border-emerald-500 transition-all text-sm" 
                      />
                    </div>
                  </div>
                  
                  <button 
                    disabled={isBilling}
                    onClick={handleQuickBill}
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isBilling ? <Activity className="w-5 h-5 animate-spin" /> : <>Generate & Bill <ArrowUpRight className="w-4 h-4" /></>}
                  </button>
                </div>
             </div>
          </div>

          {/* 6. LIVE ACTIVITY FEED */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <h3 className="font-black text-slate-800 text-sm tracking-tight">Recent Activity</h3>
                <div className="flex gap-1">
                   <div className="w-1 h-1 rounded-full bg-blue-600 animate-bounce"></div>
                   <div className="w-1 h-1 rounded-full bg-blue-600 animate-bounce [animation-delay:0.1s]"></div>
                   <div className="w-1 h-1 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></div>
                </div>
             </div>
             <div className="p-6">
                <div className="space-y-6">
                   {liveActivity.length > 0 ? liveActivity.map((act) => (
                     <div key={act.id} className="flex gap-4 group">
                        <div className={cn("w-10 h-10 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110", act.bg, act.color)}>
                           <act.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                              <p className="text-sm font-black text-slate-800 leading-tight truncate">{act.title}</p>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{act.time}</span>
                           </div>
                           <p className="text-xs text-slate-500 mt-1 truncate font-medium">{act.subtitle}</p>
                        </div>
                     </div>
                   )) : (
                     <p className="text-center text-slate-400 italic text-sm py-10">No recent activity logged.</p>
                   )}
                </div>
                <button className="w-full mt-8 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black text-slate-500 transition-all border border-slate-100 border-dashed">
                   View Operational Logs
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const TherapistDashboard = () => {
    const nextAppt = todayAppts.find(a => a.status === 'scheduled');
    const followUpsCount = patients.length > 5 ? 3 : 0; // Simulated follow-ups
    const currentMember = members.find(m => m.email?.toLowerCase() === user.email?.toLowerCase());
    const matchedName = currentMember?.name || user.displayName?.replace(/demo therapist/i, 'Sarah Jenkins') || 'Sarah Jenkins';
    
    return (
      <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* 1. Profile & Status Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(matchedName)}&background=3b82f6&color=ffffff`} 
                alt="Therapist" 
                className="w-16 h-16 rounded-2xl border-4 border-slate-50 object-cover shadow-sm group-hover:scale-105 transition-transform"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-xl font-black text-slate-800">{matchedName}</h1>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-tight">Therapist</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Clock className="w-3.5 h-3.5" /> Shift ends in 4h
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Available for walk-ins
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-3 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">
              <MessageSquare className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setTab('attendance')}
              className="px-5 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4" /> Check-out
            </button>
          </div>
        </div>

        {/* 2. Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Queue", value: todayAppts.length, icon: Calendar, color: "blue" },
            { label: "Completed", value: todayCompleted, icon: CheckCircle2, color: "emerald" },
            { label: "Unpaid Sessions", value: pendingPaymentsCount, icon: AlertCircle, color: "amber" },
            { label: "Follow-ups Due", value: followUpsCount, icon: History, color: "indigo" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-black text-slate-900 mb-0.5">{card.value}</div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 3. Left Section: Queue & Next Action */}
          <div className="lg:col-span-8 space-y-6">
            {/* Next Patient Panel */}
            {nextAppt ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-indigo-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <Zap className="w-32 h-32" />
                </div>
                
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">Next Patient Up</div>
                      <div className="flex items-center gap-1.5 text-indigo-100 text-xs font-bold">
                        <Clock3 className="w-4 h-4" /> Starting at {nextAppt.time}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-3xl font-black mb-1">{nextAppt.patientName}</h3>
                      <p className="text-indigo-100 font-bold opacity-90">{nextAppt.sessionType || 'Physiotherapy Consultation'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                      onClick={() => setTab('sessions')}
                      className="flex-1 md:flex-none px-6 py-4 bg-white text-indigo-600 rounded-2xl font-bold text-sm shadow-xl hover:bg-indigo-50 active:scale-95 transition-all"
                    >
                      Start Session
                    </button>
                    <button 
                      onClick={() => setTab('patients')}
                      className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/10"
                    >
                      <UserCheck className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-8 rounded-[2.5rem] text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Calendar className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 font-bold mb-4">You're all clear for now! No upcoming appointments.</p>
                <button 
                  onClick={() => setTab('patients')}
                  className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all"
                >
                  View Patient Directory
                </button>
              </div>
            )}

            {/* Main Queue */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                <h2 className="text-lg font-black text-slate-800">Operational Queue <span className="text-slate-300 ml-1">({todayAppts.length})</span></h2>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-slate-400 hover:text-slate-600"><Filter className="w-4 h-4" /></button>
                  <button className="p-2 text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {todayAppts.length > 0 ? (
                  todayAppts.map((appt, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={appt.id} 
                      className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all group-hover:scale-105 shadow-sm border",
                          appt.status === 'completed' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                          appt.status === 'scheduled' ? "bg-blue-50 text-blue-600 border-blue-100" :
                          "bg-slate-50 text-slate-400 border-slate-100"
                        )}>
                          {appt.time.substring(0, 5)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-800">{appt.patientName}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            {appt.sessionType || 'Physio Session'}
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              appt.status === 'completed' ? "bg-emerald-500" : "bg-blue-500"
                            )}></span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 transition-all">
                        {appt.status !== 'completed' && (
                          <button 
                            onClick={() => onStatusUpdate?.(appt.id, 'completed')}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                            title="Mark as Complete"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                          <button 
                            onClick={() => onStatusUpdate?.(appt.id, 'cancelled')}
                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            title="Patient Not Present"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                        {appt.status === 'completed' && (
                          <button 
                            onClick={() => onStatusUpdate?.(appt.id, 'scheduled')}
                            className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                            title="Mark as Not Complete"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setTab('sessions')}
                          className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all shadow-sm"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400 font-bold italic">No patients assigned for today.</div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Right Section: Quick Actions & Mini Analytics */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-slate-900/10">
              <h3 className="text-white font-black mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Fast Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'View Sessions', icon: UserPlus, color: 'bg-white/10', target: 'sessions' },
                  { label: 'Patient List', icon: Users, color: 'bg-white/10', target: 'patients' },
                  { label: 'Clinical Notes', icon: ClipboardList, color: 'bg-white/10', target: 'sessions' },
                  { label: 'My Attendance', icon: Clock, color: 'bg-white/10', target: 'attendance' },
                ].map((action, i) => (
                  <button 
                    key={i}
                    onClick={() => setTab(action.target)}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-2xl text-white transition-all hover:bg-white/20 group border border-white/5",
                      action.color
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-tight opacity-70 group-hover:opacity-100">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mini Analytics */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Weekly Session Flow
                </h3>
              </div>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.slice(-7)}>
                    <Bar 
                      dataKey="income" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]} 
                      barSize={12} 
                    />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                 <div>
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Growth Trend</div>
                   <div className="text-emerald-500 font-black flex items-center gap-1">+12.4% <TrendingUp className="w-3 h-3"/></div>
                 </div>
                 <div>
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Avg sessions/day</div>
                   <div className="text-slate-800 font-black">{Math.round(todayAppts.length * 1.2)} Sessions</div>
                 </div>
              </div>
            </div>

            {/* Follow-ups Highlight */}
            <div 
               onClick={() => setTab('patients')}
               className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center gap-4 group cursor-pointer hover:bg-emerald-100 transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-emerald-900 font-black text-sm">Follow-up List</h4>
                <p className="text-emerald-700 text-xs font-bold leading-tight mt-0.5">{followUpsCount} patients need a call back today.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live Updates</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900">Clinic Overview</h1>
          <p className="text-sm text-slate-500 font-bold">Operational control center for leadership & staff.</p>
        </div>
      </header>

      {role === 'admin' && <FinancialDashboard />}
      {role === 'manager' && <ManagerDashboard />}
      {role === 'therapist' && <TherapistDashboard />}
    </div>
  );
};

const PatientManager = ({ patients, appointments, transactions, onNotify, role, viewTarget, setViewTarget, setTab }: { 
  patients: Patient[], 
  appointments: any[], 
  transactions: Transaction[], 
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void,
  role?: string,
  viewTarget?: {type: string, id: string} | null,
  setViewTarget?: any,
  setTab?: any
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Recent');
  const [activeOnly, setActiveOnly] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    if (viewTarget?.type === 'patient' && viewTarget.id) {
       const p = patients.find(p => p.id === viewTarget.id);
       if (p) {
         setSelectedPatient(p);
         setShowHistoryModal(true);
         setViewTarget(null);
       }
    }
  }, [viewTarget, patients, setViewTarget]);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const itemsPerPage = 8;
  
  const [newPatient, setNewPatient] = useState({ 
    name: '', phone: '', age: '', gender: 'Male', condition: '', address: '', medicalHistory: '', treatmentStatus: 'Active' as 'Active' | 'Completed'
  });
  const [newSession, setNewSession] = useState({ 
    date: new Date().toISOString().substring(0, 10), 
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), 
    paymentStatus: 'paid' as 'paid' | 'unpaid',
    paymentMethod: 'cash' as 'cash' | 'upi',
    amount: '500', notes: '' 
  });

  const presetConditions = [
    "Lower Back Pain", "Neck Pain", "Shoulder Impingement", "Knee Osteoarthritis",
    "Post-Op Rehab", "Sports Injury", "Sciatica", "Tennis Elbow", "Plantar Fasciitis", "Other"
  ];

  const formatRelativeDate = (dateStr: string, timeStr?: string) => {
    if (!dateStr) return null;
    let target = new Date(dateStr);
    if (timeStr) {
      try {
        const [time, modifier] = timeStr.split(' ');
        if (time && time.includes(':')) {
           let [hours, minutes] = time.split(':').map(Number);
           if (modifier === 'PM' && hours < 12) hours += 12;
           if (modifier === 'AM' && hours === 12) hours = 0;
           target.setHours(hours || 0, minutes || 0, 0, 0);
        }
      } catch (e) {
        // ignore time parsing error
      }
    } else {
       target.setHours(0, 0, 0, 0);
    }

    if (isNaN(target.getTime())) return 'Invalid Date';

    const now = new Date();
    now.setHours(0,0,0,0);
    
    const targetDay = new Date(target);
    targetDay.setHours(0,0,0,0);

    const diffTime = targetDay.getTime() - now.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
    if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`;
    
    return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editPatientId) {
        await updatePatient(editPatientId, {
          name: newPatient.name,
          phone: newPatient.phone,
          age: parseInt(newPatient.age) || 0,
          gender: newPatient.gender,
          condition: newPatient.condition,
          address: newPatient.address,
          medicalHistory: newPatient.medicalHistory,
          treatmentStatus: newPatient.treatmentStatus
        });
        onNotify("Patient record updated successfully!");
        
        // Also update selected patient if it's the one being edited
        if (selectedPatient && selectedPatient.id === editPatientId) {
          setSelectedPatient({
            ...selectedPatient,
            name: newPatient.name,
            phone: newPatient.phone,
            age: parseInt(newPatient.age) || 0,
            gender: newPatient.gender,
            condition: newPatient.condition,
            address: newPatient.address,
            medicalHistory: newPatient.medicalHistory,
            treatmentStatus: newPatient.treatmentStatus
          });
        }
      } else {
        await savePatient({
          name: newPatient.name,
          phone: newPatient.phone,
          age: parseInt(newPatient.age) || 0,
          gender: newPatient.gender,
          condition: newPatient.condition,
          address: newPatient.address,
          medicalHistory: newPatient.medicalHistory,
          treatmentStatus: newPatient.treatmentStatus
        });
        onNotify("Patient record created successfully!");
      }
      setNewPatient({ name: '', phone: '', age: '', gender: 'Male', condition: '', address: '', medicalHistory: '', treatmentStatus: 'Active' });
      setEditPatientId(null);
      setShowModal(false);
    } catch (err: any) {
      onNotify(err.message || "Failed to save patient.", "error");
    }
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await logSession(selectedPatient.id, selectedPatient.name, {
        ...newSession,
        amount: Math.max(0, parseFloat(newSession.amount) || 0)
      });
      onNotify(`Session logged for ${selectedPatient.name}`);
      setShowSessionModal(false);
      setNewSession({
        date: new Date().toISOString().substring(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        paymentStatus: 'paid', paymentMethod: 'cash', amount: '500', notes: ''
      });
    } catch (err: any) {
      console.error(err);
      onNotify(String(err) + " | " + err.message, "error");
    }
  };

  // Load history immediately when row expands
  useEffect(() => {
    if (expandedRow) {
      const unsub = getSessions(expandedRow, setPatientHistory);
      return () => unsub();
    }
  }, [expandedRow]);

  useEffect(() => {
    if (selectedPatient && showHistoryModal) {
      const unsub = getSessions(selectedPatient.id, setPatientHistory);
      return () => unsub();
    }
  }, [selectedPatient, showHistoryModal]);

  const enrichedPatients = useMemo(() => {
    return patients.map(p => {
      const getApptDateTime = (dateStr: string, timeStr: string) => {
        try {
          const [time, modifier] = timeStr?.split(' ') || ['00:00', 'AM'];
          let [hours, minutes] = time.split(':').map(Number);
          if (modifier === 'PM' && hours < 12) hours += 12;
          if (modifier === 'AM' && hours === 12) hours = 0;
          const dt = new Date(dateStr);
          dt.setHours(hours || 0, minutes || 0, 0, 0);
          return dt.getTime();
        } catch(e) {
          return new Date(dateStr).getTime();
        }
      };

      const patientAppts = appointments.filter(a => a.patientId === p.id).sort((a,b) => getApptDateTime(b.date, b.time) - getApptDateTime(a.date, a.time));
      
      const now = new Date().getTime();
      const pastAppts = patientAppts.filter(a => getApptDateTime(a.date, a.time) < now);
      const futureAppts = patientAppts.filter(a => getApptDateTime(a.date, a.time) >= now);
      
      const lastVisitAppt = pastAppts.find(a => a.status === 'completed');
      const nextAppointmentAppt = [...futureAppts].reverse().find(a => a.status !== 'cancelled' && a.status !== 'blocked');

      const lastVisit = lastVisitAppt ? lastVisitAppt.date : null;
      const lastVisitTime = lastVisitAppt ? lastVisitAppt.time : null;
      const nextAppointment = nextAppointmentAppt ? nextAppointmentAppt.date : null;
      const nextAppointmentTime = nextAppointmentAppt ? nextAppointmentAppt.time : null;
      
      let status = 'Completed';
      if (p.treatmentStatus === 'Completed') {
        status = 'Completed';
      } else if (p.treatmentStatus === 'Active') {
        status = 'Active';
      } else {
        if (futureAppts.length > 0) status = 'In Treatment';
        else if (lastVisit && (now - new Date(lastVisit).getTime()) < 30 * 24 * 60 * 60 * 1000) status = 'Active';
        else if (!lastVisit && !nextAppointment) status = 'Active'; 
      }
      
      const isPending = (p.unpaidSessionsCount || 0) > 0;
      let paymentStatus = isPending ? 'Pending' : 'Paid';
      if (patientAppts.filter(a => a.status === 'completed').length === 0) paymentStatus = 'None';
      
      const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';

      return {
        ...p, lastVisit, lastVisitTime, nextAppointment, nextAppointmentTime, status, paymentStatus, initials
      };
    });
  }, [patients, appointments]);

  const filteredAndSortedPatients = useMemo(() => {
    let result = enrichedPatients;

    if (activeOnly) {
      result = result.filter(p => p.status === 'Active' || p.status === 'In Treatment');
    }

    if (statusFilter !== 'All') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (ageFilter !== 'All') {
      result = result.filter(p => {
        const age = p.age || 0;
        if (ageFilter === '0-18') return age <= 18;
        if (ageFilter === '19-35') return age >= 19 && age <= 35;
        if (ageFilter === '36-50') return age >= 36 && age <= 50;
        if (ageFilter === '51+') return age >= 51;
        return true;
      });
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.phone.includes(q) || (p.condition || '').toLowerCase().includes(q));
    }

    if (sortOrder === 'Name A-Z') {
      result = result.sort((a,b) => a.name.localeCompare(b.name));
    } else {
      result = result.sort((a,b) => b.id.localeCompare(a.id));
    }

    return result;
  }, [enrichedPatients, activeOnly, statusFilter, ageFilter, sortOrder, searchTerm]);

  const totalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);
  const currentPatients = filteredAndSortedPatients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const dashboardStats = useMemo(() => {
    const total = enrichedPatients.length;
    const active = enrichedPatients.filter(p => p.status === 'Active' || p.status === 'In Treatment').length;
    const newThisMonth = enrichedPatients.filter(p => (p.name.length % 3 === 0)).length;
    const pendingPayments = enrichedPatients.reduce((acc, p) => acc + (p.unpaidSessionsCount || 0), 0);
    const pendingPaymentsAmount = enrichedPatients.reduce((acc, p) => acc + (p.unpaidAmount || 0), 0);
    return { total, active, newThisMonth, pendingPayments, pendingPaymentsAmount };
  }, [enrichedPatients]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Patient Directory</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage profiles, histories, and treatments.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button onClick={() => setShowModal(true)} className="flex-1 sm:flex-none justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-200 transition-all flex items-center gap-2 text-sm hover:scale-[1.02] active:scale-95">
            <Plus className="w-5 h-5" />
            <span className="text-sm whitespace-nowrap">New Patient</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
             <Users className="w-6 h-6" />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Total Patients</span>
             <div className="text-2xl font-black text-slate-800">{dashboardStats.total}</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
             <Activity className="w-6 h-6" />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Active</span>
             <div className="text-2xl font-black text-slate-800">{dashboardStats.active}</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
             <TrendingUp className="w-6 h-6" />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">New This Month</span>
             <div className="text-2xl font-black text-slate-800">{dashboardStats.newThisMonth}</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
             <Clock3 className="w-6 h-6" />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Pending Payments ({dashboardStats.pendingPayments})</span>
             <div className="text-2xl font-black text-slate-800">₹{dashboardStats.pendingPaymentsAmount.toLocaleString()}</div>
           </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between md:sticky md:top-0 z-10 transition-colors">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
            <input 
              type="text" 
              placeholder="Search patients, phone, or condition..."
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 focus:border-blue-400 dark:focus:border-blue-500 transition-all"
            />
         </div>
         <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
            <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 px-3 py-2.5 rounded-xl shadow-sm transition-all group">
               <input type="checkbox" checked={activeOnly} onChange={e => {setActiveOnly(e.target.checked); setCurrentPage(1);}} className="rounded text-blue-600 w-4 h-4 cursor-pointer" />
               <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Active Only</span>
            </label>
            <select value={statusFilter} onChange={e => {setStatusFilter(e.target.value); setCurrentPage(1);}} className="flex-1 sm:flex-none text-xs font-bold bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 px-3 py-3 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
               <option value="All">All Status</option>
               <option value="Active">Active</option>
               <option value="In Treatment">In Treatment</option>
               <option value="Completed">Completed</option>
            </select>
            <select value={ageFilter} onChange={e => {setAgeFilter(e.target.value); setCurrentPage(1);}} className="flex-1 sm:flex-none text-xs font-bold bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 px-3 py-3 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 hidden sm:block cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
               <option value="All">All Ages</option>
               <option value="0-18">0-18 yrs</option>
               <option value="19-35">19-35 yrs</option>
               <option value="36-50">36-50 yrs</option>
               <option value="51+">51+ yrs</option>
            </select>
            <select value={sortOrder} onChange={e => {setSortOrder(e.target.value); setCurrentPage(1);}} className="flex-1 sm:flex-none text-xs font-bold bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 px-3 py-3 rounded-xl outline-none focus:border-blue-400 dark:focus:border-blue-500 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:block">
               <option value="Recent">Recent First</option>
               <option value="Name A-Z">Name A-Z</option>
            </select>
         </div>
      </div>

      {/* Table / Cards for Mobile */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden relative">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse min-w-full md:min-w-[1000px]">
            <thead className="hidden md:table-header-group bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Patient</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Age</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Payment</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 relative block md:table-row-group">
              {currentPatients.map((p) => (
                <React.Fragment key={p.id}>
                  <tr 
                    className={cn(
                      "group transition-all duration-200 cursor-pointer block md:table-row pb-4 md:pb-0 pt-2 md:pt-0 border-b border-slate-100 md:border-none",
                      expandedRow === p.id ? "bg-blue-50/50" : "hover:bg-slate-50 hover:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] hover:-translate-y-px z-10 relative"
                    )}
                    onClick={() => setExpandedRow(expandedRow === p.id ? null : p.id)}
                  >
                    <td className="px-4 py-2 md:px-6 md:py-5 block md:table-cell border-none">
                      <div className="flex items-start gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 flex items-center justify-center font-black text-sm shadow-inner shrink-0 ring-4 ring-white">
                           {p.initials}
                         </div>
                         <div className="flex-1">
                           <div className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors flex items-center justify-between md:justify-start gap-2">
                             <span>{highlightText(p.name, searchTerm)}</span>
                             <span className="md:hidden">
                               {expandedRow === p.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                             </span>
                             <span className="hidden md:inline">
                               {expandedRow === p.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                             </span>
                           </div>
                           <div className="flex items-center gap-2 mt-1">
                             <div className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">ID: {p.id.substring(0, 6)}</div>
                           </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 md:px-6 md:py-5 block md:table-cell border-none md:ml-16">
                       <a href={`tel:${p.phone}`} onClick={(e)=>e.stopPropagation()} className="font-mono text-sm text-slate-700 font-bold flex items-center gap-1.5 hover:text-blue-600 transition-colors w-fit">
                          <Phone className="w-3 h-3 text-slate-400" /> {highlightText(p.phone, searchTerm)}
                       </a>
                       <div className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2">
                          <span>{p.age ? `${p.age} yrs` : 'Age N/A'}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <span>{p.gender}</span>
                       </div>
                       {p.address && (
                          <div className="text-[11px] font-medium text-slate-400 mt-1 flex items-start gap-1 max-w-full md:max-w-[200px] truncate">
                            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                            <span className="truncate whitespace-normal line-clamp-1">{p.address}</span>
                          </div>
                       )}
                    </td>
                    <td className="px-4 py-2 md:px-6 md:py-5 flex flex-wrap md:block gap-2 block md:table-cell border-none md:ml-16">
                       <div className="flex items-center gap-2 tooltip-trigger" title={`Status: ${p.status}`}>
                         <div className={cn(
                           "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider border",
                           p.status === 'Active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                           p.status === 'In Treatment' ? "bg-amber-50 text-amber-700 border-amber-100" :
                           "bg-slate-50 text-slate-600 border-slate-200"
                         )}>
                           {p.status === 'Active' && <CheckCircle2 className="w-3.5 h-3.5" />}
                           {p.status === 'In Treatment' && <Activity className="w-3.5 h-3.5" />}
                           {p.status === 'Completed' && <Archive className="w-3.5 h-3.5" />}
                           {p.status}
                         </div>
                       </div>
                       <div className="flex items-center gap-2 md:mt-2">
                         {p.paymentStatus !== 'None' && (
                           <div className={cn(
                             "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                             p.paymentStatus === 'Paid' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-rose-50 text-rose-600 border-rose-100"
                           )}>
                             <CreditCard className="w-3 h-3" />
                             {p.paymentStatus}
                           </div>
                         )}
                       </div>
                    </td>
                    <td className="px-4 py-2 md:px-6 md:py-5 flex md:block gap-4 block md:table-cell border-none md:ml-16">
                       <div className="space-y-2 flex-1 md:flex-none">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Last Visit</span>
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-slate-400" />
                              {formatRelativeDate(p.lastVisit, p.lastVisitTime) || <span className="text-slate-400 italic">Never</span>}
                            </div>
                          </div>
                       </div>
                       <div className="space-y-2 flex-1 md:flex-none">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Next Appt</span>
                            <div className={cn("text-xs font-bold flex items-center gap-1.5", p.nextAppointment ? "text-emerald-600" : "text-slate-400")}>
                              <CalendarCheck className={cn("w-3.5 h-3.5", p.nextAppointment ? "text-emerald-500" : "text-slate-400")} />
                              {formatRelativeDate(p.nextAppointment, p.nextAppointmentTime) || <span className="italic">None</span>}
                            </div>
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-3 md:px-6 md:py-5 border-t border-slate-50 md:border-none block md:table-cell md:ml-16">
                      <div className="flex md:flex-row items-center justify-between md:justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform md:translate-x-4 md:group-hover:translate-x-0 w-full md:w-auto">
                         <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase md:hidden">Actions</span>
                         <div className="flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); setSelectedPatient(p); setShowHistoryModal(true); }} className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl shadow-sm transition-all bg-white" title="View Full Profile">
                              <User2 className="w-5 h-5 md:w-4 md:h-4" />
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); if(setTab && setViewTarget) { setTab('appointments'); setViewTarget({ type: 'book-appointment', id: p.id }); } }} className="p-2 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl shadow-sm transition-all bg-white" title="Book Appointment">
                              <CalendarCheck className="w-5 h-5 md:w-4 md:h-4" />
                           </button>
                           <button onClick={(e) => { e.stopPropagation(); setSelectedPatient(p); setShowSessionModal(true); }} className="p-2 border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-400 hover:text-purple-600 rounded-xl shadow-sm transition-all bg-white" title="Log Session">
                              <FileText className="w-5 h-5 md:w-4 md:h-4" />
                           </button>
                         </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* EXPANDABLE ROW CONTENT */}
                  {expandedRow === p.id && (
                    <tr className="bg-blue-50/30 border-b border-blue-100/50 block md:table-row">
                      <td colSpan={5} className="p-0 block md:table-cell">
                        <div className="px-4 py-4 md:px-8 md:py-6 animate-in slide-in-from-top-2 fade-in duration-200">
                           <div className="flex items-center justify-between mb-4">
                             <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                               <Activity className="w-4 h-4 text-blue-500" /> Recent Sessions Overview
                             </h4>
                             <button onClick={() => { setSelectedPatient(p); setShowHistoryModal(true); }} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group">
                               View Full Profile <ChevronDown className="w-3 h-3 -rotate-90 group-hover:translate-x-1 transition-transform hidden sm:block" />
                             </button>
                           </div>
                           
                           {/* Fetch history for this expanded row specifically? 
                               We are using global patientHistory which might cause a flash. 
                               Since we fetch it globally, we display it: */}
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                             {patientHistory.slice(0, 3).map((session, sidx) => (
                               <div key={sidx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedPatient(p); setShowHistoryModal(true); }}>
                                 <div className="flex justify-between items-start mb-2">
                                   <div className="text-xs font-bold text-slate-500">{new Date(session.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>
                                   <div className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded", session.paymentStatus === 'paid' ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50")}>{session.paymentStatus}</div>
                                 </div>
                                 <p className="text-sm font-medium text-slate-800 line-clamp-2 my-2 mt-1">{session.notes || <span className="italic text-slate-400">No notes</span>}</p>
                                 <div className="mt-auto pt-2 border-t border-slate-50 flex justify-between items-center">
                                   <span className="text-xs font-bold text-slate-400">{session.time}</span>
                                   <span className="text-sm font-black text-slate-800">₹{session.amount}</span>
                                 </div>
                               </div>
                             ))}
                             {patientHistory.length === 0 && (
                               <div className="col-span-3 text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                 <p className="text-sm font-bold text-slate-500">No session history found.</p>
                                 <button onClick={() => { setSelectedPatient(p); setShowSessionModal(true); }} className="mt-2 text-xs font-bold text-blue-600 hover:underline">Log first session</button>
                               </div>
                             )}
                           </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {/* EMPTY STATE */}
          {filteredAndSortedPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in zoom-in-95">
               <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-8 ring-slate-50">
                 <Users className="w-10 h-10 text-blue-400" />
               </div>
               <h3 className="text-xl font-black text-slate-800 mb-2">No patients found</h3>
               <p className="text-slate-500 font-medium max-w-sm mb-6">
                 {searchTerm || activeOnly || statusFilter !== 'All' 
                   ? "We couldn't find any patients matching your current filters. Try adjusting them."
                   : "Your patient directory is empty. Add your first patient to get started."}
               </p>
               {(!searchTerm && !activeOnly && statusFilter === 'All') ? (
                 <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:-translate-y-1">
                   <Plus className="w-5 h-5" /> Add First Patient
                 </button>
               ) : (
                 <button onClick={() => { setSearchTerm(''); setStatusFilter('All'); setActiveOnly(false); setAgeFilter('All'); }} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">
                   Clear Filters
                 </button>
               )}
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between sticky bottom-0">
            <span className="text-xs font-bold text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedPatients.length)} of {filteredAndSortedPatients.length} patients
            </span>
            <div className="flex gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
              >
                Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                 let pageNum = i + 1;
                 if (totalPages > 5 && currentPage > 3) {
                   pageNum = currentPage - 2 + i;
                   if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                 }
                 return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-bold transition-all disabled:opacity-100",
                      currentPage === pageNum ? "bg-white text-blue-600 shadow-sm border border-slate-200 ring-2 ring-transparent" : "text-slate-600 hover:bg-slate-200 border border-transparent"
                    )}
                  >
                    {pageNum}
                  </button>
                 );
              })}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50 transition-colors shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEW PATIENT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh] pb-safe animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{editPatientId ? 'Edit Patient Profile' : 'Add New Patient'}</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">{editPatientId ? 'Update existing patient details.' : 'Enter patient details to create profile.'}</p>
              </div>
              <button title="Close Modal" type="button" onClick={() => { setShowModal(false); setEditPatientId(null); }} className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors self-start"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
              <form id="new-patient-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                    <input required placeholder="E.g. John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Phone Number</label>
                    <input required placeholder="+91 XXXXX XXXXX" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Age</label>
                    <input type="number" min="0" placeholder="Years" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Gender</label>
                    <div className="flex gap-3">
                      {['Male', 'Female', 'Other'].map(g => (
                        <label key={g} className={cn("flex-1 px-4 py-3 border rounded-xl text-sm font-bold text-center cursor-pointer transition-all", newPatient.gender === g ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")}>
                          <input type="radio" className="hidden" name="gender" value={g} checked={newPatient.gender === g} onChange={(e) => setNewPatient({...newPatient, gender: e.target.value})} />
                          {g}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-1 sm:col-span-2 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Condition / Primary Complaint</label>
                    <input list="conditions" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm" placeholder="Select or type..." value={newPatient.condition} onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })} />
                    <datalist id="conditions">
                      {presetConditions.map((c, i) => <option key={i} value={c} />)}
                    </datalist>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Address</label>
                    <textarea placeholder="Line 1, City, Zip..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm min-h-[60px]" value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}></textarea>
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Medical History Notes</label>
                    {role !== 'manager' ? (
                      <textarea placeholder="Past surgeries, diabetic history, BP..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm min-h-[80px]" value={newPatient.medicalHistory} onChange={(e) => setNewPatient({ ...newPatient, medicalHistory: e.target.value })}></textarea>
                    ) : (
                      <div className="p-4 bg-slate-100 rounded-xl text-slate-400 text-xs italic border border-dashed border-slate-200">
                        Access Restricted: Clinical history is only viewable by Therapists and Admins.
                      </div>
                    )}
                  </div>
                  <div className="col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Treatment Status</label>
                    <div className="flex gap-3">
                      {['Active', 'Completed'].map(status => (
                        <label key={status} className={cn("flex-1 px-4 py-3 border rounded-xl text-sm font-bold text-center cursor-pointer transition-all", newPatient.treatmentStatus === status ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")}>
                          <input type="radio" className="hidden" name="treatmentStatus" value={status} checked={newPatient.treatmentStatus === status} onChange={(e) => setNewPatient({...newPatient, treatmentStatus: e.target.value as 'Active' | 'Completed'})} />
                          {status}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 shrink-0">
              <button type="button" onClick={() => { setShowModal(false); setEditPatientId(null); }} className="px-4 sm:px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors">Cancel</button>
              <button type="submit" form="new-patient-form" className="px-6 sm:px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 transition-all outline-none focus:ring-4 focus:ring-blue-100 flex items-center gap-2">{editPatientId ? 'Update Patient' : 'Save Patient'} <ChevronDown className="w-4 h-4 -rotate-90" /></button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL (Kept the same structural flow) */}
      {showHistoryModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-t-[2rem] sm:rounded-3xl w-full max-w-4xl max-h-[95dvh] sm:max-h-[90vh] pb-safe flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-start sm:items-center bg-white shrink-0 relative">
               <button title="Close window" onClick={() => setShowHistoryModal(false)} className="absolute top-5 right-5 sm:static sm:top-auto sm:right-auto text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
               <div className="flex items-center gap-5 pr-12 sm:pr-0">
                 <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center font-black text-lg sm:text-xl ring-4 ring-slate-50 border border-blue-100 shrink-0">
                   {selectedPatient.name.split(' ').map((n:string)=>n[0]).join('').substring(0,2).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{selectedPatient.name}</h3>
                    <p className="text-sm font-bold text-slate-500 mt-1">{selectedPatient.age || '-'} yrs • {selectedPatient.gender}</p>
                 </div>
               </div>
               <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button onClick={() => {
                   setEditPatientId(selectedPatient.id);
                   setNewPatient({
                     name: selectedPatient.name,
                     phone: selectedPatient.phone,
                     age: selectedPatient.age.toString(),
                     gender: selectedPatient.gender,
                     condition: selectedPatient.condition || '',
                     address: selectedPatient.address || '',
                     medicalHistory: selectedPatient.medicalHistory || '',
                     treatmentStatus: selectedPatient.treatmentStatus || 'Active'
                   });
                   setShowModal(true);
                 }} className="p-2.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-lg sm:rounded-full transition-colors flex items-center justify-center transform hover:scale-105 flex-1 sm:flex-none border border-slate-200 sm:border-transparent" title="Edit Profile">
                   <Pencil className="w-5 h-5 mr-2 sm:mr-0"/><span className="sm:hidden font-bold text-sm">Edit</span>
                 </button>
                 <button onClick={() => {
                   if (setTab && setViewTarget) {
                     setTab('appointments');
                     setViewTarget({ type: 'book-appointment', id: selectedPatient.id });
                     setShowHistoryModal(false);
                   }
                 }} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl sm:rounded-xl font-bold transition-all text-sm shadow-md shadow-emerald-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 flex-1 sm:flex-none"><CalendarCheck className="w-4 h-4"/> Book Appt</button>
                 <button onClick={() => { setShowSessionModal(true); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl sm:rounded-xl font-bold transition-all text-sm shadow-md shadow-blue-200 flex items-center justify-center gap-2 hover:-translate-y-0.5 flex-1 sm:flex-none"><Plus className="w-4 h-4"/> Log Session</button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 space-y-6 sm:space-y-8 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-1"><Phone className="w-3 h-3"/> Contact Info</span>
                     <a href={`tel:${selectedPatient.phone}`} className="font-mono text-base font-bold text-slate-800 hover:text-blue-600 transition-colors w-fit block">{selectedPatient.phone}</a>
                    <div className="text-sm font-medium text-slate-500 mt-2 leading-relaxed flex items-start gap-1"><MapPin className="w-4 h-4 shrink-0 mt-0.5 text-slate-400"/> {selectedPatient.address || 'No address added'}</div>
                 </div>
                 <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-1"><User2 className="w-3 h-3"/> Demographics</span>
                    <div className="font-black text-slate-800 text-lg">{selectedPatient.age || '-'} years</div>
                    <div className="text-sm font-medium text-slate-500 mt-2 bg-slate-100 px-2 py-1 inline-block rounded-md">{selectedPatient.gender}</div>
                 </div>
                 <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3 flex items-center gap-1"><Activity className="w-3 h-3"/> Primary Condition</span>
                    <div className="font-bold text-slate-800 leading-tight">{selectedPatient.condition || 'Not specified'}</div>
                    {role !== 'manager' && (
                      <div className="text-xs text-slate-500 mt-2 line-clamp-2" title={selectedPatient.medicalHistory}>{selectedPatient.medicalHistory || 'No additional history notes.'}</div>
                    )}
                 </div>
               </div>
               
               <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-slate-100">
                  <h4 className="font-black text-slate-900 leading-none flex items-center gap-3 mb-6 sm:mb-8"><History className="w-6 h-6 text-blue-500 p-1 bg-blue-50 rounded-lg" /> Interaction History</h4>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent pl-4 md:pl-0">
                  {patientHistory.map((s, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                       <div className="flex items-center justify-center w-10 h-10 rounded-full border-[3px] border-white bg-indigo-50 text-indigo-600 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 -ml-9 md:ml-0 group-hover:scale-110 transition-transform">
                         <Activity className="w-4 h-4" />
                       </div>
                       <div className="w-full md:w-[calc(50%-3rem)] p-5 rounded-2xl bg-white border border-slate-100 shadow-sm group-hover:shadow-md transition-all group-hover:-translate-y-1 group-odd:ml-6 group-even:ml-6 md:group-odd:mr-6 md:group-even:ml-6 md:group-odd:ml-0">
                          <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-3">
                             <div className="font-black text-sm text-slate-900">{new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric'})}</div>
                             <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm", s.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-700 border-emerald-100 border" : "bg-rose-50 text-rose-700 border border-rose-100")}>{s.paymentStatus}</span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium leading-relaxed">{s.notes || <span className="italic text-slate-400">No treatment notes provided for this session.</span>}</p>
                          <div className="mt-4 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">
                             <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5"><Clock3 className="w-3 h-3"/> {s.time}</span>
                             <span className="font-black text-slate-800 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-slate-400"/> ₹{s.amount}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                  {patientHistory.length === 0 && <div className="text-center py-12 relative z-10 text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-2xl w-full max-w-lg mx-auto bg-white">No interaction history logged yet.</div>}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* SESSION MODAL */}
      {showSessionModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60] animate-in fade-in">
          <div className="bg-white rounded-t-[2rem] sm:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh] pb-safe animate-in slide-in-from-bottom sm:zoom-in-95">
             <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div>
                   <h3 className="text-xl font-black text-slate-900 tracking-tight">Log Session</h3>
                   <p className="text-sm font-bold text-slate-500 mt-1">for {selectedPatient.name}</p>
                </div>
                <button title="Close Session Modal" onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="p-5 sm:p-8 overflow-y-auto">
                <form id="session-form" onSubmit={handleSessionSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                        <input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Time</label>
                        <input type="time" required value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm" />
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Payment Status</label>
                     <div className="flex gap-3">
                       {['paid', 'unpaid'].map(status => (
                         <label key={status} className={cn("flex-1 px-4 py-3 border rounded-xl text-sm font-bold text-center cursor-pointer transition-all flex items-center justify-center gap-2", newSession.paymentStatus === status ? (status === 'paid' ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-100" : "bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-100") : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100")}>
                           <input type="radio" className="hidden" name="paymentStatus" value={status} checked={newSession.paymentStatus === status} onChange={(e) => setNewSession({...newSession, paymentStatus: e.target.value as any})} />
                           {status === 'paid' ? <CheckCircle2 className="w-4 h-4"/> : <Clock3 className="w-4 h-4"/>}
                           {status === 'paid' ? 'Paid' : 'Unpaid (Due)'}
                         </label>
                       ))}
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Amount (₹)</label>
                        <input type="number" min="0" required value={newSession.amount} onChange={e => setNewSession({...newSession, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Method</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm appearance-none cursor-pointer" value={newSession.paymentMethod} onChange={e => setNewSession({...newSession, paymentMethod: e.target.value as any})}>
                           <option value="cash">Cash</option>
                           <option value="upi">UPI / Online</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Treatment Notes</label>
                     <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white transition-all shadow-sm min-h-[100px]" value={newSession.notes} onChange={e => setNewSession({...newSession, notes: e.target.value})} placeholder="What treatments were performed? Patient feedback..."></textarea>
                  </div>
               </form>
             </div>
             <div className="px-5 sm:px-8 py-5 sm:py-6 border-t border-slate-100 bg-white flex justify-end gap-3 z-10 shrink-0">
               <button type="button" onClick={() => setShowSessionModal(false)} className="px-4 sm:px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors">Cancel</button>
               <button type="submit" form="session-form" className="px-6 sm:px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-600/20 hover:-translate-y-0.5 transition-all outline-none focus:ring-4 focus:ring-blue-100 flex items-center gap-2 z-10">Save Log <ChevronDown className="w-4 h-4 -rotate-90" /></button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
const FinanceTracker = ({ transactions, patients, onNotify, role, viewTarget, setViewTarget }: { 
  transactions: Transaction[], 
  patients: Patient[], 
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void,
  role?: string,
  viewTarget?: {type: string, id: string} | null,
  setViewTarget?: any
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingPatientSearch, setBillingPatientSearch] = useState('');
  const [selectedBillingPatient, setSelectedBillingPatient] = useState<Patient | null>(null);
  const [unpaidSessions, setUnpaidSessions] = useState<any[]>([]);
  const [selectedSessionsForBill, setSelectedSessionsForBill] = useState<string[]>([]);
  const [billingMethod, setBillingMethod] = useState<'cash'|'upi'>('cash');
  const [isGeneratingBill, setIsGeneratingBill] = useState(false);

  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '6m'>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  const [editTxId, setEditTxId] = useState<string | null>(null);
  const [newTx, setNewTx] = useState({ 
    amount: '', 
    category: 'Consultation', 
    date: new Date().toISOString().substring(0, 10), 
    time: new Date().toTimeString().substring(0, 5),
    type: 'income' as 'income' | 'expense', 
    description: '',
    patientId: '',
    discount: '0',
    paymentMethod: 'Cash'
  });

  const [netTotal, setNetTotal] = useState(0);
  const [printTx, setPrintTx] = useState<Transaction | null>(null);
  const [therapistName, setTherapistName] = useState('Dr. Rahul Das');
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  useEffect(() => {
    if (viewTarget?.type === 'transaction' && viewTarget.id) {
       const t = transactions.find(t => t.id === viewTarget.id);
       if (t && t.type === 'income') { // Only print income / receipts
         setPrintTx(t);
         setViewTarget(null);
       } else if (t) {
         // Auto expand or something if it's an expense. We'll simply let it scroll or just clear it.
         setViewTarget(null);
       }
    }
  }, [viewTarget, transactions, setViewTarget]);

  useEffect(() => {
    const amt = parseFloat(newTx.amount) || 0;
    const disc = parseFloat(newTx.discount) || 0;
    setNetTotal(Math.max(0, amt - disc));
  }, [newTx.amount, newTx.discount]);

  useEffect(() => {
    const handleAfterPrint = () => setPrintTx(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const categories = {
    income: ['Consultation', 'Training', 'Therapy', 'Sale', 'Other'],
    expense: ['Rent', 'Equipment', 'Salaries', 'Utility', 'Marketing', 'Other']
  };

  const openNewModal = () => {
    setEditTxId(null);
    setNewTx({ 
      amount: '', 
      category: 'Consultation', 
      date: new Date().toISOString().substring(0, 10), 
      time: new Date().toTimeString().substring(0, 5),
      type: 'income', 
      description: '',
      patientId: '',
      discount: '0',
      paymentMethod: 'Cash'
    });
    setShowModal(true);
  };

  useEffect(() => {
    if (selectedBillingPatient) {
      const unsub = getSessions(selectedBillingPatient.id, (sessions) => {
        setUnpaidSessions(sessions.filter((s: any) => s.paymentStatus === 'unpaid'));
      });
      return () => unsub();
    } else {
      setUnpaidSessions([]);
      setSelectedSessionsForBill([]);
    }
  }, [selectedBillingPatient]);

  const handleGenerateBill = async () => {
    if (!selectedBillingPatient || selectedSessionsForBill.length === 0) return;
    setIsGeneratingBill(true);
    try {
      const sessionsToPay = unpaidSessions.filter(s => selectedSessionsForBill.includes(s.id));
      const totalAmount = sessionsToPay.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      
      const today = new Date();
      const dateStr = today.toISOString().substring(0, 10);
      const timeStr = today.toTimeString().substring(0, 5);

      const txId = await payUnpaidSessions(
        selectedBillingPatient.id,
        selectedBillingPatient.name,
        selectedSessionsForBill,
        totalAmount,
        billingMethod,
        dateStr,
        timeStr
      );
      
      onNotify(`Bill generated successfully for ₹${totalAmount}`, "success");
      
      if (totalAmount > 0 && txId) {
        setPrintTx({
          id: txId,
          amount: totalAmount,
          category: 'Therapy Session',
          date: dateStr,
          time: timeStr,
          type: 'income',
          description: `Consolidated payment for ${selectedSessionsForBill.length} session(s) from ${selectedBillingPatient.name}`,
          patientId: selectedBillingPatient.id,
          paymentMethod: billingMethod,
        } as Transaction);
      }

      setSelectedSessionsForBill([]);
      setShowBillingModal(false);
      setSelectedBillingPatient(null);
    } catch (err: any) {
      onNotify(err.message || 'Failed to generate bill', 'error');
    } finally {
      setIsGeneratingBill(false);
    }
  };

  const handleSaveAsPDF = async () => {
    const element = document.getElementById('print-bill-container');
    if (!element) return;
    setIsSavingPdf(true);
    try {
      // Create a blob-safe clone or handle oklch via onclone
      const canvas = await html2canvas(element, { 
        scale: 3, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('print-bill-container');
          if (el) {
            el.style.fontFamily = 'Arial, sans-serif';
            
            // Handle the therapist input visibility in PDF
            const therapistInput = el.querySelector('input[class*="font-black"]');
            if (therapistInput instanceof HTMLInputElement) {
              const span = clonedDoc.createElement('div');
              span.textContent = therapistName;
              span.className = therapistInput.className;
              span.style.border = 'none';
              span.style.padding = '0';
              therapistInput.parentNode?.replaceChild(span, therapistInput);
            }
            
            // Aggressively remove all transitions and animations which often carry problematic colors
            const allElements = el.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const item = allElements[i] as HTMLElement;
              item.style.transition = 'none';
              item.style.animation = 'none';
              // Also strip any custom properties that might be using modern colors
              const style = window.getComputedStyle(item);
              if (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab')) {
                item.style.backgroundColor = '#ffffff';
              }
              if (style.color.includes('oklch') || style.color.includes('oklab')) {
                item.style.color = '#1e293b';
              }
            }
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FitRevive_Receipt_${printTx?.date || Date.now()}.pdf`);
    } catch (error: any) {
      console.error('Failed to generate PDF', error);
      // More descriptive error for the user
      if (error?.message?.includes('oklch')) {
        onNotify('PDF Engine Error: Modern CSS colors not supported. Please use the Print -> Save as PDF option.', 'error');
      } else {
        onNotify(`Failed to generate PDF: ${error?.message || 'Unknown error'}`, 'error');
      }
    } finally {
      setIsSavingPdf(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!printTx) return;
    const patient = printTx.patientId ? patients.find(p => p.id === printTx.patientId) : null;
    const patientName = patient?.name || 'Valued Patient';
    const amountStr = printTx.amount.toLocaleString('en-IN');
    const receiptNo = `FR-${printTx.date.replace(/-/g, '')}-${printTx.id.slice(0, 4).toUpperCase()}`;
    const dateStr = new Date(printTx.date).toLocaleDateString('en-GB');
    
    const msg = `*FitRevive Physiotherapy Clinic*\n\n` +
                `Hi *${patientName}*,\n` +
                `Greetings from FitRevive! We have successfully received your payment for the physiotherapy session.\n\n` +
                `*RECEIPT SUMMARY*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `📄 *Receipt No:* ${receiptNo}\n` +
                `📅 *Date:* ${dateStr}\n` +
                `💉 *Service:* ${printTx.category}\n` +
                `👨‍⚕️ *Therapist:* ${therapistName}\n` +
                `💰 *Total Amount:* ₹${amountStr}\n` +
                `💳 *Payment:* ${printTx.paymentMethod || 'Paid'}\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `_Thank you for choosing FitRevive. We wish you a very speedy recovery!_\n\n` +
                `📍 Bangaon, Nalbari\n` +
                `📞 +91 84738-09386\n` +
                `🌐 www.fitrevive.in`;

    window.open(`https://wa.me/${patient?.phone || ''}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareReceiptFile = async () => {
    const element = document.getElementById('print-bill-container');
    if (!element || !printTx) return;
    
    setIsSavingPdf(true);
    try {
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('print-bill-container');
          if (el) {
            el.style.fontFamily = 'Arial, sans-serif';
            
            // Handle the therapist input visibility in PDF
            const therapistInput = el.querySelector('input[class*="font-black"]');
            if (therapistInput instanceof HTMLInputElement) {
              const span = clonedDoc.createElement('div');
              span.textContent = therapistName;
              span.className = therapistInput.className;
              span.style.border = 'none';
              span.style.padding = '0';
              therapistInput.parentNode?.replaceChild(span, therapistInput);
            }

            const allElements = el.getElementsByTagName('*');
            for (let i = 0; i < allElements.length; i++) {
              const item = allElements[i] as HTMLElement;
              item.style.transition = 'none';
              item.style.animation = 'none';
              const style = window.getComputedStyle(item);
              if (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab')) {
                item.style.backgroundColor = '#ffffff';
              }
              if (style.color.includes('oklch') || style.color.includes('oklab')) {
                item.style.color = '#1e293b';
              }
            }
          }
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output('blob');
      const fileName = `FitRevive_Receipt_${printTx.id.slice(0, 4)}.pdf`;
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Generate the message for sharing
      const patient = patients.find(p => p.id === printTx.patientId);
      const patientName = patient?.name || 'Valued Patient';
      const amountStr = printTx.amount.toLocaleString('en-IN');
      const receiptNo = `FR-${printTx.date.replace(/-/g, '')}-${printTx.id.slice(0, 4).toUpperCase()}`;
      const dateStr = new Date(printTx.date).toLocaleDateString('en-GB');
      
      const msg = `*FitRevive Physiotherapy Clinic*\n\n` +
                  `Hi *${patientName}*,\n` +
                  `Greetings from FitRevive! We have successfully received your payment for the physiotherapy session.\n\n` +
                  `*RECEIPT SUMMARY*\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n` +
                  `📄 *Receipt No:* ${receiptNo}\n` +
                  `📅 *Date:* ${dateStr}\n` +
                  `💉 *Service:* ${printTx.category}\n` +
                  `👨‍⚕️ *Therapist:* ${therapistName}\n` +
                  `💰 *Total Amount:* ₹${amountStr}\n` +
                  `💳 *Payment:* ${printTx.paymentMethod || 'Paid'}\n` +
                  `━━━━━━━━━━━━━━━━━━━━\n\n` +
                  `_Thank you for choosing FitRevive. We wish you a very speedy recovery!_\n\n` +
                  `📍 Bangaon, Nalbari\n` +
                  `📞 +91 84738-09386\n` +
                  `🌐 www.fitrevive.in`;

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'FitRevive Receipt',
          text: msg,
        });
      } else {
        // Fallback to WhatsApp text if file share not supported
        shareToWhatsApp();
      }
    } catch (error: any) {
      console.error('Share failed', error);
      if (error?.message?.includes('oklch')) {
        onNotify('PDF Engine Error: Modern CSS colors not supported. Sending text receipt via WhatsApp...', 'info');
      } else {
        onNotify('Sharing not supported on this browser context', 'info');
      }
      shareToWhatsApp();
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditTxId(tx.id);
    setNewTx({
      amount: tx.amount.toString(),
      category: tx.category,
      date: tx.date,
      time: tx.time || new Date().toTimeString().substring(0, 5),
      type: tx.type,
      description: tx.description || '',
      patientId: tx.patientId || '',
      discount: '0',
      paymentMethod: tx.paymentMethod || 'Cash'
    });
    setShowModal(true);
  };

  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

  const handleDeleteConfirm = async () => {
    if (transactionToDelete) {
      try {
        await deleteTransaction(transactionToDelete.id);
        onNotify("Transaction deleted successfully");
      } catch (err: any) {
        onNotify(err.message || "Failed to delete transaction", "error");
      }
      setTransactionToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editTxId) {
        await updateTransaction(editTxId, {
          amount: netTotal,
          category: newTx.category,
          date: newTx.date,
          time: newTx.time,
          type: newTx.type,
          description: newTx.description,
          patientId: newTx.patientId,
          paymentMethod: newTx.paymentMethod
        });
        onNotify("Transaction updated successfully!");
      } else {
        await logTransaction({
          amount: netTotal,
          category: newTx.category,
          date: newTx.date,
          time: newTx.time,
          type: newTx.type,
          description: newTx.description,
          patientId: newTx.patientId,
          paymentMethod: newTx.paymentMethod
        });
        onNotify(`${newTx.type === 'income' ? 'Revenue' : 'Expense'} logged successfully!`);
      }
      setEditTxId(null);
      setNewTx({ 
        amount: '', 
        category: 'Consultation', 
        date: new Date().toISOString().substring(0, 10), 
        time: new Date().toTimeString().substring(0, 5),
        type: 'income', 
        description: '',
        patientId: '',
        discount: '0',
        paymentMethod: 'Cash'
      });
      setShowModal(false);
    } catch (err: any) {
      onNotify(err.message || "Failed to save transaction.", "error");
    }
  };

  // Filter transactions based on date
  const filteredData = useMemo(() => {
    const now = new Date();
    const limit = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 6;
    const unit = timeframe === '6m' ? 'month' : 'day';

    return transactions.filter(t => {
      const d = new Date(t.date);
      if (unit === 'day') {
        const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        return diff <= limit;
      } else {
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
        return diffMonths <= limit;
      }
    });
  }, [transactions, timeframe]);

  // Statistics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    
    filteredData.forEach(t => {
      if (t.type === 'income') totalRevenue += t.amount;
      if (t.type === 'expense') totalExpenses += t.amount;
    });

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      totalTransactions: filteredData.length
    };
  }, [filteredData]);

  // Chart Data: Line Chart (Revenue vs Expense)
  const lineChartData = useMemo(() => {
    const groups: { [key: string]: { date: string, income: number, expense: number } } = {};
    const now = new Date();
    const count = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 6;
    const unit = timeframe === '6m' ? 'month' : 'day';

    for (let i = count - 1; i >= 0; i--) {
      const d = new Date();
      if (unit === 'day') {
        d.setDate(d.getDate() - i);
      } else {
        d.setMonth(d.getMonth() - i);
      }
      const key = unit === 'day' ? d.toISOString().split('T')[0] : d.toLocaleString('default', { month: 'short' });
      groups[key] = { date: unit === 'day' ? d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : key, income: 0, expense: 0 };
    }

    filteredData.forEach(t => {
      const d = new Date(t.date);
      const key = unit === 'day' ? t.date : d.toLocaleString('default', { month: 'short' });
      if (groups[key]) {
        groups[key][t.type] += t.amount;
      }
    });
    return Object.values(groups);
  }, [filteredData, timeframe]);

  // Chart Data: Pie Chart (Expenses)
  const pieChartData = useMemo(() => {
    const cats: { [key: string]: number } = {};
    filteredData.filter(t => t.type === 'expense').forEach(t => {
      const c = t.category || 'Other';
      cats[c] = (cats[c] || 0) + t.amount;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [filteredData]);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#8b5cf6', '#ec4899'];

  // List filtered
  const listTransactions = useMemo(() => {
    let result = transactions;
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }
    if (categoryFilter !== 'all') {
      result = result.filter(t => t.category === categoryFilter);
    }
    if (dateFilter) {
      result = result.filter(t => t.date === dateFilter);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.description?.toLowerCase() || '').includes(q) || 
        t.category.toLowerCase().includes(q) ||
        (t.patientId && patients.find(p => p.id === t.patientId)?.name.toLowerCase().includes(q))
      );
    }
    return result.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      
      // Secondary sort by time if available
      if (a.time && b.time) {
        return b.time.localeCompare(a.time);
      }
      
      // Fallback to createdAt if time is not available
      if (a.createdAt && b.createdAt) {
         return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
      return 0;
    });
  }, [transactions, typeFilter, categoryFilter, dateFilter, searchTerm, patients]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Consultation': return <Activity className="w-4 h-4 text-indigo-500" />;
      case 'Therapy': return <Activity className="w-4 h-4 text-emerald-500" />;
      case 'Rent': return <MapPin className="w-4 h-4 text-rose-500" />;
      case 'Utility': return <Zap className="w-4 h-4 text-amber-500" />;
      case 'Salaries': return <Users className="w-4 h-4 text-blue-500" />;
      default: return <Coins className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Financial Overview</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Track clinic revenue, expenses, and net profit.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={() => setShowBillingModal(true)} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] rounded-xl font-bold transition-all flex items-center gap-2 text-sm hover:-translate-y-0.5 active:scale-95">
             <ClipboardList className="w-5 h-5" />
             <span>Unpaid Bills</span>
           </button>
           <button onClick={openNewModal} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] rounded-xl font-bold transition-all flex items-center gap-2 text-sm hover:-translate-y-0.5 active:scale-95">
             <Plus className="w-5 h-5" />
             <span>New Transaction</span>
           </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-slate-500 mb-2 font-bold text-xs uppercase tracking-widest">
            <div className="p-2 bg-emerald-50 rounded-xl"><ArrowUpRight className="w-4 h-4 text-emerald-600" /></div>
            Revenue
          </div>
          <div className="text-3xl font-black text-slate-800">₹{stats.totalRevenue.toLocaleString()}</div>
        </div>
        {role === 'admin' && (
          <>
            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 text-slate-500 mb-2 font-bold text-xs uppercase tracking-widest">
                <div className="p-2 bg-rose-50 rounded-xl"><ArrowDownRight className="w-4 h-4 text-rose-600" /></div>
                Expenses
              </div>
              <div className="text-3xl font-black text-slate-800">₹{stats.totalExpenses.toLocaleString()}</div>
            </div>
            <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 text-slate-500 mb-2 font-bold text-xs uppercase tracking-widest">
                <div className="p-2 bg-blue-50 rounded-xl"><Wallet className="w-4 h-4 text-blue-600" /></div>
                Net Profit
              </div>
              <div className={cn("text-3xl font-black", stats.netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                {stats.netProfit < 0 ? "-" : ""}₹{Math.abs(stats.netProfit).toLocaleString()}
              </div>
            </div>
          </>
        )}
        <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 text-slate-500 mb-2 font-bold text-xs uppercase tracking-widest">
            <div className="p-2 bg-purple-50 rounded-xl"><History className="w-4 h-4 text-purple-600" /></div>
            Transactions
          </div>
          <div className="text-3xl font-black text-slate-800">{stats.totalTransactions}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn("bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm", role === 'admin' ? "col-span-1 lg:col-span-2" : "col-span-3")}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-black text-slate-800">Revenue {role === 'admin' && 'vs Expenses'}</h3>
            <select value={timeframe} onChange={e => setTimeframe(e.target.value as any)} className="bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold px-3 py-1.5 outline-none cursor-pointer">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="6m">Last 6 Months</option>
            </select>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineChartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  {role === 'admin' && (
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  )}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                  itemStyle={{ fontWeight: '600' }}
                />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                {role === 'admin' && <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {role === 'admin' && (
          <div className="bg-white rounded-[24px] p-6 border border-slate-100 shadow-sm flex flex-col">
            <h3 className="text-base font-black text-slate-800 mb-6">Expense Breakdown</h3>
            {pieChartData.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `₹${value.toLocaleString()}`}
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full mt-4 flex flex-wrap justify-center gap-3 text-[11px] font-bold">
                  {pieChartData.slice(0, 4).map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-slate-600">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm font-medium text-slate-400">No expenses in this period.</div>
            )}
          </div>
        )}
      </div>

      {/* Ledger Section */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Ledger Header & Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-black text-slate-800">Transaction Ledger</h3>
            <button 
              onClick={() => {
                 const csvContent = "data:text/csv;charset=utf-8," 
                    + "Date,Type,Category,Amount,PaymentMethod,Description\n"
                    + listTransactions.map(t => `${t.date},${t.type},${t.category},${t.amount},${t.paymentMethod || 'Cash'},"${t.description || ''}"`).join("\n");
                 const encodedUri = encodeURI(csvContent);
                 const link = document.createElement("a");
                 link.setAttribute("href", encodedUri);
                 link.setAttribute("download", "transactions.csv");
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition-all"
            >
              Export CSV
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full lg:w-48 pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl text-sm font-bold px-3 py-2 outline-none cursor-pointer"
              />
              {dateFilter && (
                <button title="Clear Date" onClick={() => setDateFilter('')} className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl p-2 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl text-sm font-bold px-3 py-2 outline-none cursor-pointer">
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl text-sm font-bold px-3 py-2 outline-none cursor-pointer hidden sm:block">
              <option value="all">All Categories</option>
              <optgroup label="Income">
                {categories.income.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Expense">
                {categories.expense.map(c => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-full md:min-w-[700px]">
            <thead className="hidden md:table-header-group bg-white border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type & Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white block md:table-row-group">
              {listTransactions.map(t => (
                <tr key={t.id} className="group hover:bg-slate-50 transition-colors block md:table-row pb-4 md:pb-0 pt-2 md:pt-0 border-b border-slate-100 md:border-none relative">
                  <td className="px-4 md:px-6 py-2 md:py-4 block md:table-cell md:border-none">
                    <div className="flex md:block justify-between items-center w-full">
                       <div>
                         <span className="text-sm font-bold text-slate-600 block md:inline text-left">{new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                         <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-medium text-slate-400">{new Date(t.date).getFullYear()}</span>
                            {t.time && (
                              <>
                                <span className="text-slate-300 text-[10px]">•</span>
                                <span className="text-[10px] font-bold text-slate-500">{new Date(`2000-01-01T${t.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit'})}</span>
                              </>
                            )}
                         </div>
                       </div>
                       <span className={cn("text-base font-black font-mono md:hidden", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                         {t.type === 'income' ? "+" : "-"}₹{t.amount.toLocaleString()}
                       </span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-2 md:py-4 block md:table-cell md:border-none">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border",
                        t.type === 'income' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                      )}>
                        {t.type === 'income' ? <ArrowDownRight className="w-5 h-5 absolute opacity-30 mt-1 ml-1" /> : <ArrowUpRight className="w-5 h-5 absolute opacity-30 mt-1 ml-1" />}
                        {getCategoryIcon(t.category)}
                      </div>
                      <div className="flex-1">
                        <div className="font-black text-sm text-slate-800 break-words line-clamp-1">{t.category}</div>
                        <div className={cn("text-[10px] font-bold uppercase tracking-wider mt-0.5", t.type === 'income' ? "text-emerald-500" : "text-rose-500")}>{t.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 md:px-6 md:py-4 block md:table-cell border-none md:ml-16">
                    {t.patientId && patients.find(p => p.id === t.patientId) ? (
                      <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md line-clamp-1 w-fit">{patients.find(p => p.id === t.patientId)?.name}</span>
                    ) : t.description ? (
                      <span className="text-sm font-bold text-slate-600 line-clamp-2">{t.description}</span>
                    ) : (
                      <span className="text-sm font-medium text-slate-400 italic">No details</span>
                    )}
                  </td>
                  <td className="px-4 py-2 md:px-6 md:py-4 block md:table-cell border-none md:ml-16">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase md:hidden">Payment:</span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200/60 inline-flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-slate-400" /> {t.paymentMethod || 'Cash'}</span>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 text-right">
                    <span className={cn("text-base font-black font-mono", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                      {t.type === 'income' ? "+" : "-"}₹{t.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 md:px-6 md:py-4 border-t border-slate-50 md:border-none block md:table-cell md:ml-16">
                    <div className="flex items-center justify-between md:justify-center w-full gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase md:hidden">Actions</span>
                      <div className="flex gap-2">
                        {t.type === 'income' && (
                          <button onClick={() => setPrintTx(t)} className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm" title="View / Print Bill">
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(t)} className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm" title="Edit Transaction">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setTransactionToDelete(t)} className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm" title="Delete Transaction">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {listTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 px-6">
                     <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                       <Filter className="w-8 h-8 text-slate-300" />
                     </div>
                     <span className="block text-base font-bold text-slate-600">No transactions found</span>
                     <span className="block text-sm font-medium text-slate-400 mt-1">Try adjusting your filters or search term</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showBillingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[24px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh] pb-safe animate-in slide-in-from-bottom sm:zoom-in-95">
             <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Generate Unpaid Bills</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Search patients and clear due payments.</p>
                </div>
                <button type="button" onClick={() => setShowBillingModal(false)} className="text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <div className="p-5 sm:p-8 overflow-y-auto bg-slate-50/50 flex-1">
               {!selectedBillingPatient ? (
                 <div>
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Search Patient Name or Phone</label>
                    <div className="relative mb-4">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input 
                        type="text" 
                        value={billingPatientSearch} 
                        onChange={e => setBillingPatientSearch(e.target.value)} 
                        placeholder="Type to search patients..." 
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl pl-10 pr-5 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                      />
                    </div>
                    {billingPatientSearch.length > 0 && (
                      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6 divide-y divide-slate-100">
                         {patients.filter(p => p.name.toLowerCase().includes(billingPatientSearch.toLowerCase()) || p.phone.includes(billingPatientSearch)).map(p => (
                           <div key={p.id} className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center transition-colors" onClick={() => setSelectedBillingPatient(p)}>
                              <div>
                                <h4 className="font-bold text-slate-800">{p.name}</h4>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{p.phone}</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                           </div>
                         ))}
                         {patients.filter(p => p.name.toLowerCase().includes(billingPatientSearch.toLowerCase()) || p.phone.includes(billingPatientSearch)).length === 0 && (
                           <div className="p-4 text-sm font-medium text-slate-500 text-center">No patients found.</div>
                         )}
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <button onClick={() => { setSelectedBillingPatient(null); setBillingPatientSearch(''); }} className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline mb-1 inline-block">&larr; Back to Search</button>
                        <h4 className="font-black text-lg text-slate-800">{selectedBillingPatient.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">{selectedBillingPatient.phone}</p>
                      </div>
                      <div className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider">Unpaid Sessions: {unpaidSessions.length}</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                       <div className="overflow-x-auto w-full">
                         <table className="w-full text-left border-collapse min-w-full md:min-w-[600px]">
                           <thead className="hidden md:table-header-group">
                             <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                               <th className="px-4 py-3 text-center">Select</th>
                               <th className="px-4 py-3">Date</th>
                               <th className="px-4 py-3">Details</th>
                               <th className="px-4 py-3 text-right">Amount</th>
                             </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 block md:table-row-group">
                             {unpaidSessions.map(session => (
                               <tr key={session.id} className={cn(
                                   "transition-colors block md:table-row pb-4 md:pb-0 pt-2 md:pt-0 border-b border-slate-100 md:border-none relative", 
                                   selectedSessionsForBill.includes(session.id) ? "bg-blue-50/50" : "hover:bg-slate-50"
                                 )}>
                                 <td className="px-4 py-3 md:py-4 flex justify-between items-center md:table-cell md:text-center block border-none">
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:hidden">Select Session</span>
                                   <input 
                                     type="checkbox" 
                                     className="w-5 h-5 md:w-4 md:h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer border-gray-300"
                                     checked={selectedSessionsForBill.includes(session.id)}
                                     onChange={(e) => {
                                       if(e.target.checked) setSelectedSessionsForBill(prev => [...prev, session.id]);
                                       else setSelectedSessionsForBill(prev => prev.filter(id => id !== session.id));
                                     }}
                                   />
                                 </td>
                                 <td className="px-4 py-2 md:py-4 block md:table-cell border-none md:ml-12">
                                   <div className="font-bold text-sm text-slate-700">{new Date(session.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>
                                   <div className="text-xs font-medium text-slate-500">{session.time}</div>
                                 </td>
                                 <td className="px-4 py-2 md:py-4 block md:table-cell border-none md:ml-12">
                                   <div className="text-sm font-medium text-slate-700 line-clamp-2 md:line-clamp-1">{session.notes || 'Therapy Session'}</div>
                                 </td>
                                 <td className="px-4 py-3 md:py-4 text-right font-black text-slate-800 block md:table-cell border-none md:ml-12">
                                   <div className="flex justify-between items-center w-full md:block">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest md:hidden">Amount:</span>
                                      <span>₹{session.amount}</span>
                                   </div>
                                 </td>
                               </tr>
                             ))}
                             {unpaidSessions.length === 0 && (
                               <tr className="block md:table-row">
                                 <td colSpan={4} className="p-8 text-center text-slate-500 font-medium text-sm block md:table-cell">
                                    No unpaid sessions found for this patient.
                                 </td>
                               </tr>
                             )}
                           </tbody>
                         </table>
                       </div>
                    </div>

                    {unpaidSessions.length > 0 && selectedSessionsForBill.length > 0 && (
                      <div className="bg-slate-800 text-white p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div>
                            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Total Due for Selected</div>
                            <div className="text-3xl font-black tabular-nums tracking-tight">₹{unpaidSessions.filter(s => selectedSessionsForBill.includes(s.id)).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)}</div>
                         </div>
                         <div className="flex gap-2 w-full sm:w-auto">
                            <select value={billingMethod} onChange={e => setBillingMethod(e.target.value as 'cash'|'upi')} className="bg-slate-700 border-none text-white text-sm font-bold rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400">
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                            </select>
                            <button onClick={handleGenerateBill} disabled={isGeneratingBill} className="flex-1 sm:flex-none px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                               {isGeneratingBill ? 'Processing...' : 'Clear Dues & Generate Bill'}
                            </button>
                         </div>
                      </div>
                    )}
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* New Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh] pb-safe animate-in slide-in-from-bottom sm:zoom-in-95">
             <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">New Transaction</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Log income or operational expense.</p>
                </div>
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="p-5 sm:p-8 overflow-y-auto">
               <form id="tx-form" onSubmit={handleSubmit} className="space-y-6">
                  {/* Type Selector - Hidden for non-admins as billing staff only log income */}
                  <div className={cn("flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200", role !== 'admin' && "hidden")}>
                     <button type="button" onClick={() => setNewTx({...newTx, type: 'income', category: categories.income[0]})} className={cn("flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2", newTx.type === 'income' ? "bg-white text-emerald-600 shadow-[0_2px_10px_-4px_rgba(16,185,129,0.3)] border border-emerald-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100")}>
                        <ArrowDownRight className="w-4 h-4" /> Income / Credit
                     </button>
                     <button type="button" onClick={() => setNewTx({...newTx, type: 'expense', category: categories.expense[0]})} className={cn("flex-1 py-3 px-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2", newTx.type === 'expense' ? "bg-white text-rose-600 shadow-[0_2px_10px_-4px_rgba(244,63,94,0.3)] border border-rose-100" : "text-slate-500 hover:text-slate-700 hover:bg-slate-100")}>
                        <ArrowUpRight className="w-4 h-4" /> Expense / Debit
                     </button>
                  </div>
                  
                  {newTx.type === 'income' && (
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Patient (Optional)</label>
                      <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-100 cursor-pointer" value={newTx.patientId} onChange={e => setNewTx({...newTx, patientId: e.target.value})}>
                         <option value="">Walk-In or Not Applicable...</option>
                         {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Base Amount (₹)</label>
                        <input required type="number" min="0" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-lg font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 font-mono" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Discount (₹)</label>
                        <input type="number" min="0" value={newTx.discount} onChange={e => setNewTx({...newTx, discount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-lg font-black text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 font-mono" />
                     </div>
                  </div>

                  <div className={cn("p-5 border rounded-2xl text-center shadow-inner", newTx.type === 'income' ? "bg-emerald-50/50 border-emerald-100" : "bg-rose-50/50 border-rose-100")}>
                     <span className="text-[10px] font-black uppercase tracking-widest block mb-1 text-slate-500">Net Total</span>
                     <div className={cn("text-3xl font-black font-mono tracking-tight", newTx.type === 'income' ? "text-emerald-700" : "text-rose-700")}>
                        ₹{netTotal.toLocaleString()}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Category</label>
                        <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer">
                           {(newTx.type === 'income' ? categories.income : categories.expense).map(cat => (
                             <option key={cat} value={cat}>{cat}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Payment Method</label>
                        <select value={newTx.paymentMethod} onChange={e => setNewTx({...newTx, paymentMethod: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer">
                           <option>Cash</option>
                           <option>UPI / Online</option>
                           <option>Card</option>
                        </select>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                        <input type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Time</label>
                        <input type="time" value={newTx.time} onChange={e => setNewTx({...newTx, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Notes / Description</label>
                        <input type="text" placeholder="Remarks..." value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100" />
                     </div>
                  </div>
               </form>
             </div>
             
             <div className="px-5 sm:px-8 py-5 border-t border-[#f1f5f9] bg-[#ffffff] flex flex-col sm:flex-row justify-end gap-3 shrink-0">
               <button type="button" onClick={() => setShowModal(false)} className="px-4 sm:px-6 py-3 rounded-xl font-bold text-[#475569] hover:bg-[#f8fafc] transition-colors border border-transparent hover:border-[#e2e8f0] w-full sm:w-auto">Cancel</button>
               <button type="submit" form="tx-form" className={cn("px-6 sm:px-8 py-3 rounded-xl font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 w-full sm:w-auto", newTx.type === 'income' ? "bg-[#059669] hover:bg-[#047857] shadow-emerald-600/20" : "bg-[#e11d48] hover:bg-[#be123c] shadow-rose-600/20")}>
                  Save {newTx.type === 'income' ? 'Revenue' : 'Expense'}
               </button>
             </div>
          </div>
        </div>
      )}

      {transactionToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl overflow-hidden flex flex-col p-6 text-center border-t-4 border-rose-500">
             <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
               <Trash2 className="w-8 h-8 text-rose-500" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Transaction</h3>
             <p className="text-slate-500 mb-6 font-medium text-sm">Are you sure you want to permanently delete this transaction (₹{transactionToDelete.amount} - {transactionToDelete.category})? This action cannot be reversed.</p>
             <div className="flex gap-3 w-full">
                <button onClick={() => setTransactionToDelete(null)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">Cancel</button>
                <button onClick={handleDeleteConfirm} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg py-3 shadow-[0_4px_10px_rgb(225,29,72,0.3)] transition-colors">Delete</button>
             </div>
          </div>
        </div>
      )}

      {printTx && (
        <div className="fixed inset-0 bg-[#f1f5f9] z-[100] overflow-y-auto print:static print:h-auto print:overflow-visible">
          <div className="max-w-4xl mx-auto py-8 px-4 print:p-0">
            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 bg-[#ffffff] p-4 rounded-2xl shadow-sm border border-[#e2e8f0] print:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white text-[#ffffff] flex items-center justify-center border border-[#e2e8f0] overflow-hidden">
                  <img src={LogoImage} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h2 className="font-black text-[#1e293b] tracking-tight">Receipt View</h2>
                  <p className="text-xs font-bold text-[#64748b]">FitRevive Clinic Management</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSaveAsPDF} 
                  disabled={isSavingPdf} 
                  className="px-4 py-2 bg-[#4f46e5] text-[#ffffff] rounded-xl font-bold flex items-center gap-2 hover:bg-[#4338ca] transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" /> {isSavingPdf ? 'Generating...' : 'Save PDF'}
                </button>
                <button 
                  onClick={() => {
                    try { window.print(); } catch(e) { window.alert("Printing is blocked. Use 'Open in New Tab'."); }
                  }} 
                  className="px-4 py-2 bg-[#2563eb] text-[#ffffff] rounded-xl font-bold flex items-center gap-2 hover:bg-[#1d4ed8] transition-all shadow-md shadow-blue-100"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button 
                  onClick={shareReceiptFile}
                  disabled={isSavingPdf}
                  className="px-4 py-2 bg-[#16a34a] text-[#ffffff] rounded-xl font-bold flex items-center gap-2 hover:bg-[#15803d] transition-all shadow-md shadow-green-100 disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" /> Share / PDF
                </button>
                <button 
                  onClick={() => setPrintTx(null)} 
                  className="p-2 bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0] rounded-xl hover:bg-[#f1f5f9] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Receipt Container */}
            <div id="print-bill-container" className="bg-[#ffffff] shadow-2xl rounded-3xl border border-[#e2e8f0] overflow-hidden print:shadow-none print:border-none print:m-0">
               {/* Header Section */}
               <div className="relative overflow-hidden bg-[#ffffff] p-8 text-[#1e293b] border-b border-[#f1f5f9]">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#f0f9ff] rounded-full -mr-20 -mt-20"></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#ffffff] rounded-full flex items-center justify-center shadow-lg transform -rotate-2 hover:rotate-0 transition-transform overflow-hidden border border-[#e2e8f0]">
                        <img src={LogoImage} alt="FitRevive Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h1 className="text-3xl font-black tracking-tighter leading-none mb-1 text-[#1e293b]">FitRevive</h1>
                        <p className="text-sm font-bold text-[#2563eb]">Physiotherapy clinic</p>
                        <div className="mt-4 flex flex-col gap-1 text-xs font-semibold text-[#64748b]">
                           <div className="flex items-center gap-2"><MapPin className="w-3 h-3 text-[#2563eb]" /> Bangaon, Nalbari, 781303</div>
                           <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-[#2563eb]" /> +91 84738-09386</div>
                           <div className="flex items-center gap-2"><Globe className="w-3 h-3 text-[#2563eb]" /> www.fitrevive.in</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                       <div className="bg-[#eff6ff] text-[#2563eb] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 border border-[#dbeafe]">Official Invoice</div>
                       <div className="text-2xl font-black tracking-tight mb-1 text-[#1e293b]">Total: ₹{printTx.amount.toLocaleString()}</div>
                       <p className="text-xs font-bold text-[#64748b]">Date: {new Date(printTx.date).toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>
               </div>

               <div className="p-8 space-y-8">
                  {/* Patient & Invoice Info Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Patient Info Card */}
                     <div className="bg-[#f8fafc] p-6 rounded-2xl border border-[#f1f5f9] shadow-sm">
                        <h3 className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] mb-4">Patient Information</h3>
                        {(() => {
                           const patient = printTx.patientId ? patients.find(p => p.id === printTx.patientId) : null;
                           return (
                             <div className="space-y-3">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[#ffffff] flex items-center justify-center border border-[#e2e8f0]">
                                    <User2 className="w-4 h-4 text-[#2563eb]" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-[#64748b]">Name</p>
                                    <p className="text-sm font-black text-[#1e293b]">{patient?.name || 'Walk-In Patient'}</p>
                                  </div>
                               </div>
                               <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs font-bold text-[#64748b]">Age/Gender</p>
                                    <p className="text-sm font-black text-[#1e293b]">{patient?.age || 'N/A'} / {patient?.gender || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-[#64748b]">Patient ID</p>
                                    <p className="text-sm font-mono font-bold text-[#2563eb]">{patient?.id?.slice(0,8).toUpperCase() || 'P-GUEST'}</p>
                                  </div>
                               </div>
                             </div>
                           );
                        })()}
                     </div>

                     {/* Details Card */}
                     <div className="bg-[#f8fafc] p-6 rounded-2xl border border-[#f1f5f9] shadow-sm">
                        <h3 className="text-[10px] font-black text-[#94a3b8] uppercase tracking-[0.2em] mb-4">Invoice Details</h3>
                        <div className="space-y-3">
                           <div className="flex justify-between items-center bg-[#ffffff] p-2 px-3 rounded-xl border border-[#e2e8f0]">
                              <span className="text-xs font-bold text-[#64748b]">Receipt No</span>
                              <span className="text-xs font-mono font-black text-[#1e293b]">FR-{printTx.date.replace(/-/g, '')}-{printTx.id.slice(0, 4).toUpperCase()}</span>
                           </div>
                           <div className="flex justify-between items-center bg-[#ffffff] p-2 px-3 rounded-xl border border-[#e2e8f0]">
                              <span className="text-xs font-bold text-[#64748b]">Payment Method</span>
                              <span className="text-xs font-black text-[#1e293b]">{printTx.paymentMethod || 'Cash'}</span>
                           </div>
                           <div className="space-y-1">
                              <label className="text-xs font-bold text-[#64748b] ml-1">Assigned Therapist</label>
                              <input 
                                value={therapistName} 
                                onChange={(e) => setTherapistName(e.target.value)}
                                className="w-full text-xs font-black bg-[#ffffff] border border-[#e2e8f0] rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-100 print:border-none print:px-0 print:py-0"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Services Table */}
                  <div className="overflow-x-auto w-full rounded-2xl border border-[#f1f5f9] shadow-sm mb-6">
                     <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="bg-[#f8fafc] border-b border-[#f1f5f9]">
                           <tr>
                              <th className="px-6 py-4 text-[10px] font-black text-[#64748b] uppercase tracking-widest">Service Description</th>
                              <th className="px-6 py-4 text-[10px] font-black text-[#64748b] uppercase tracking-widest text-center">Qty</th>
                              <th className="px-6 py-4 text-[10px] font-black text-[#64748b] uppercase tracking-widest text-right">Price</th>
                              <th className="px-6 py-4 text-[10px] font-black text-[#64748b] uppercase tracking-widest text-right">Total</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f5f9]">
                           <tr>
                              <td className="px-6 py-5">
                                 <div className="font-black text-[#1e293b]">{printTx.category}</div>
                                 <div className="text-xs font-medium text-[#64748b] mt-0.5">{printTx.description || 'Standard physical therapy session'}</div>
                              </td>
                              <td className="px-6 py-5 text-center font-bold text-[#1e293b]">1</td>
                              <td className="px-6 py-5 text-right font-bold text-[#1e293b]">₹{printTx.amount.toLocaleString()}</td>
                              <td className="px-6 py-5 text-right font-black text-[#1e293b]">₹{printTx.amount.toLocaleString()}</td>
                           </tr>
                        </tbody>
                        <tfoot className="bg-[#f8fafc]/50">
                           <tr>
                              <td colSpan={2} className="px-6 py-4"></td>
                              <td className="px-6 py-4 text-xs font-bold text-[#64748b] text-right uppercase">Subtotal</td>
                              <td className="px-6 py-4 text-sm font-black text-[#1e293b] text-right">₹{printTx.amount.toLocaleString()}</td>
                           </tr>
                           <tr>
                              <td colSpan={2} className="px-6 py-4"></td>
                              <td className="px-6 py-4 text-xs font-bold text-[#64748b] text-right uppercase">Tax (0%)</td>
                              <td className="px-6 py-4 text-sm font-black text-[#1e293b] text-right">₹0.00</td>
                           </tr>
                           <tr className="bg-[#f0f7ff]">
                              <td colSpan={2} className="px-6 py-4"></td>
                              <td className="px-6 py-4 text-[10px] font-black text-[#2563eb] text-right uppercase tracking-widest">Grand Total</td>
                              <td className="px-6 py-4 text-2xl font-black text-[#2563eb] text-right tracking-tight">₹{printTx.amount.toLocaleString()}</td>
                           </tr>
                        </tfoot>
                     </table>
                  </div>

                  {/* Payment & Footer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                     <div className="space-y-6">
                        <div className="flex items-start gap-4">
                           <div className="p-3 bg-[#ffffff] rounded-xl shadow-sm border border-[#e2e8f0] print:hidden">
                              <QRCodeCanvas 
                                value={`upi://pay?pa=FITREVIVE@BANK&pn=FitReviveClinic&am=${printTx.amount}&cu=INR`} 
                                size={80}
                                level="M"
                              />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest mb-1">Scan to Pay (UPI)</p>
                              <p className="text-[10px] font-bold text-[#94a3b8] max-w-[150px]">Secure payment directly to clinic account via any UPI app.</p>
                           </div>
                        </div>
                        <div className="p-4 rounded-xl border-l-4 border-[#2563eb] bg-[#f8fafc]">
                           <p className="text-xs italic font-bold text-[#64748b] leading-relaxed">
                              "Thank you for choosing FitRevive Clinic. We are committed to your recovery and well-being. Wish you a speedy recovery!"
                           </p>
                        </div>
                     </div>

                     <div className="flex flex-col justify-end items-end space-y-12">
                        <div className="text-center w-full max-w-[200px]">
                           <div className="h-10 w-full mb-2 border-b-2 border-dashed border-[#cbd5e1] flex items-end justify-center">
                              {/* Placeholder for Signature/Stamp */}
                           </div>
                           <p className="text-[10px] font-black text-[#1e293b] uppercase tracking-widest">{therapistName}</p>
                           <p className="text-[10px] font-bold text-[#94a3b8]">Authorized Signature</p>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="bg-[#f8fafc] px-8 py-4 flex justify-between items-center border-t border-[#f1f5f9]">
                  <p className="text-[10px] font-bold text-[#94a3b8]">System Generated Invoice • No signature required if digitally shared.</p>
                  <div className="flex items-center gap-1.5 grayscale opacity-50">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#2563eb]"></div>
                     <span className="text-[9px] font-black text-[#1e293b] uppercase tracking-[0.2em]">FitRevive OS</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const ReportsByRange = ({ stats, transactions, appointments, patients, members, onNotify }: { stats: DashboardStats, transactions: Transaction[], appointments: any[], patients: Patient[], members: any[], onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const now = useMemo(() => new Date(), []);
  const startDate = useMemo(() => {
    const d = new Date(now);
    if (timeRange === '7d') d.setDate(d.getDate() - 7);
    else if (timeRange === '30d') d.setDate(d.getDate() - 30);
    else if (timeRange === '90d') d.setDate(d.getDate() - 90);
    else return new Date(0);
    return d;
  }, [timeRange, now]);

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      const matchesRange = timeRange === 'all' || tDate >= startDate;
      const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.paymentMethod || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesService = selectedService === 'all' || t.category === selectedService;
      return matchesRange && matchesSearch && matchesService;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, timeRange, startDate, searchTerm, selectedService]);

  // Analytics Calculations
  const analytics = useMemo(() => {
    const currentT = filteredTransactions;
    const revenue = currentT.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = currentT.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const profit = revenue - expenses;

    // Previous period for trends
    const prevRangeStart = new Date(startDate);
    const diff = now.getTime() - startDate.getTime();
    prevRangeStart.setTime(startDate.getTime() - diff);
    
    const prevT = transactions.filter(t => {
      const d = new Date(t.date);
      return d >= prevRangeStart && d < startDate;
    });

    const prevRev = prevT.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const prevExp = prevT.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const prevProfit = prevRev - prevExp;

    const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      revenue,
      expenses,
      profit,
      revenueTrend: getTrend(revenue, prevRev),
      expensesTrend: getTrend(expenses, prevExp),
      profitTrend: getTrend(profit, prevProfit),
      newPatients: Math.floor(patients.length * 0.12),
      appointmentsToday: appointments.filter(a => {
        const d = now;
        return a.date === `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }).length
    };
  }, [filteredTransactions, transactions, startDate, patients, appointments, now]);

  // Charts Data
  const chartData = useMemo(() => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 14;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      const dayT = transactions.filter(t => t.date === dateStr);
      data.push({
        name: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        revenue: dayT.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        expenses: dayT.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
      });
    }
    return data;
  }, [transactions, timeRange, now]);

  const pieData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredTransactions.filter(t => t.type === 'income').forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTransactions]);

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  const exportCSV = () => {
    const csvRows = [
      ['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method'],
      ...filteredTransactions.map(t => [t.date, t.type.toUpperCase(), t.category, t.description || 'N/A', t.amount, t.paymentMethod || 'N/A'])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FitRevive_Financial_Report_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify("Report exported successfully");
  };

  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));

  const insights = [
    { text: `Total revenue has ${analytics.revenueTrend >= 0 ? 'increased' : 'decreased'} by ${Math.abs(analytics.revenueTrend)}% compared to the previous period.`, icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
    { text: `${pieData.length > 0 ? pieData.sort((a,b)=>b.value-a.value)[0].name : 'N/A'} is your top performing service category.`, icon: <Activity className="w-4 h-4 text-blue-500" /> },
    { text: `You had ${analytics.appointmentsToday} appointments scheduled for today.`, icon: <CalendarCheck className="w-4 h-4 text-purple-500" /> },
    { text: `Expense ratio is currently ${analytics.revenue > 0 ? Math.round((analytics.expenses / analytics.revenue) * 100) : 0}% of total revenue.`, icon: <IndianRupee className="w-4 h-4 text-amber-500" /> }
  ];

  const topTherapist = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.filter(a => a.status === 'completed' && a.therapistName).forEach(a => {
      counts[a.therapistName] = (counts[a.therapistName] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0] : null;
  }, [appointments]);

  const peakHours = useMemo(() => {
    const hours: Record<string, number> = {};
    appointments.forEach(a => {
       const hour = a.time?.split(':')[0] + ' ' + a.time?.split(' ')[1];
       if (hour) hours[hour] = (hours[hour] || 0) + 1;
    });
    return Object.entries(hours).sort((a,b) => b[1] - a[1]).slice(0, 3);
  }, [appointments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <CircleDollarSign className="w-6 h-6 text-white" />
             </div>
             Clinic Analytics Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time performance tracking and growth insights.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex items-center overflow-hidden">
            {(['7d', '30d', '90d', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => { setTimeRange(r); setCurrentPage(1); }}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                  timeRange === r ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {r === 'all' ? 'All Time' : r.toUpperCase()}
              </button>
            ))}
          </div>
          <button 
            onClick={exportCSV}
            className="flex-1 lg:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5 text-slate-400" /> Export CSV
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICard title="Total Revenue" value={analytics.revenue} trend={analytics.revenueTrend} icon={<CircleDollarSign />} color="blue" />
        <KPICard title="Total Expenses" value={analytics.expenses} trend={analytics.expensesTrend} icon={<IndianRupee />} color="rose" inverseTrend />
        <KPICard title="Net Profit" value={analytics.profit} trend={analytics.profitTrend} icon={<Wallet />} color="emerald" highlighted />
        <KPICard title="New Patients" value={analytics.newPatients} trend={12} icon={<Users />} color="purple" hideCurrency />
        <KPICard title="Appts Today" value={analytics.appointmentsToday} trend={5} icon={<CalendarRange />} color="amber" hideCurrency />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
           <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-xl font-black text-slate-800">Revenue vs Expenses</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Financial Performance Over Time</p>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm shadow-blue-200"></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Revenue</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 rounded-full bg-rose-400 shadow-sm shadow-rose-200"></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Expenses</span>
                 </div>
              </div>
           </div>
           
           <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fb7185" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    itemStyle={{ fontSize: '12px', fontWeight: 800 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col min-h-[600px]">
           <div className="w-full text-left mb-4">
              <h3 className="text-xl font-black text-slate-800">Earnings Breakdown</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">By Service Category</p>
           </div>
           
           <div className="h-[320px] w-full flex-none">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    label={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    iconType="circle" 
                    wrapperStyle={{ 
                      fontSize: '9px', 
                      fontWeight: 800, 
                      textTransform: 'uppercase',
                      bottom: -10,
                      paddingTop: '30px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
           </div>
           
           <div className="mt-8 space-y-4 pt-4 border-t border-slate-50">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                       <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                       <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Top Performer</div>
                       <div className="text-sm font-black text-slate-700">{topTherapist ? topTherapist[0] : 'N/A'}</div>
                    </div>
                 </div>
                 <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    {topTherapist ? topTherapist[1] : 0} Sessions
                 </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="text-[9px] font-black text-slate-400 uppercase mb-3 px-1 tracking-widest">Peak Business Hours</div>
                 <div className="space-y-3">
                    {peakHours.map(([hour, count], idx) => (
                       <div key={idx} className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-500 w-12">{hour}</span>
                          <div className="flex-1 mx-3 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / (peakHours[0][1] as number)) * 100}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-slate-800">{count}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                      <ClipboardList className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight">Transactions Detail</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{filteredTransactions.length} records in range</p>
                    </div>
                 </div>
                 <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                       <input 
                         type="text" 
                         placeholder="Search entries..."
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                       />
                    </div>
                 </div>
              </div>

              <div className="overflow-x-auto w-full">
                 <table className="w-full text-left border-collapse min-w-full md:min-w-[800px]">
                    <thead className="hidden md:table-header-group bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                       <tr>
                          <th className="px-8 py-4">Date</th>
                          <th className="px-8 py-4">Transaction</th>
                          <th className="px-8 py-4">Amount</th>
                          <th className="px-8 py-4">Method</th>
                          <th className="px-8 py-4 text-right">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 block md:table-row-group">
                       {paginatedTransactions.map((t) => (
                         <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group block md:table-row pb-4 md:pb-0 pt-2 md:pt-0 border-b border-slate-100 md:border-none relative">
                            <td className="px-4 md:px-8 py-2 md:py-4 text-sm font-bold text-slate-500 block md:table-cell md:border-none">
                               <div className="flex md:block justify-between items-center">
                                 <div>
                                   {new Date(t.date).toLocaleDateString('en-GB')}
                                   <div className="text-[10px] font-bold text-slate-400 mt-0.5">{t.time || "10:00 AM"}</div>
                                 </div>
                                 <span className="md:hidden text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Completed</span>
                               </div>
                            </td>
                            <td className="px-4 md:px-8 py-2 md:py-4 block md:table-cell md:border-none">
                               <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-sm transform group-hover:scale-110 transition-transform shrink-0",
                                    t.type === 'income' ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100" : "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                                  )}>
                                     {t.type === 'income' ? '+' : '-'}
                                  </div>
                                  <div className="flex-1">
                                     <div className="text-sm font-black text-slate-800 break-words line-clamp-1">{t.category}</div>
                                     <div className="text-[11px] font-bold text-slate-400 break-words line-clamp-2">{t.description || "No description"}</div>
                                  </div>
                                  <div className="md:hidden flex flex-col items-end">
                                    <span className={cn("text-sm font-black", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                                      ₹{t.amount.toLocaleString()}
                                    </span>
                                    <span className="inline-flex items-center gap-1 mt-1 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                      <CreditCard className="w-3 h-3" /> {t.paymentMethod || "Cash"}
                                    </span>
                                  </div>
                               </div>
                            </td>
                            <td className="hidden md:table-cell px-8 py-4">
                               <span className={cn("text-sm font-black flex items-center gap-1", t.type === 'income' ? "text-emerald-600" : "text-rose-600")}>
                                  ₹{t.amount.toLocaleString()}
                               </span>
                            </td>
                            <td className="hidden md:table-cell px-8 py-4">
                               <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                                  <CreditCard className="w-3 h-3" /> {t.paymentMethod || "Cash"}
                               </span>
                            </td>
                            <td className="hidden md:table-cell px-8 py-4 text-right">
                               <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">Completed</span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>

              {/* Pagination */}
              <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                 <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all font-bold text-xs"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-all font-bold text-xs"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mt-32 transition-transform group-hover:scale-125"></div>
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black tracking-tight">Clinic Status</h4>
                      <div className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Operational Health</div>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold text-white/60 uppercase tracking-widest">Efficiency Rate</span>
                       <span className="text-sm font-black text-emerald-400">88%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-400 rounded-full" style={{ width: '88%' }}></div>
                    </div>
                    
                    <div className={cn(
                      "p-6 mt-12 rounded-3xl border text-center transition-all animate-in zoom-in-95 duration-700",
                      analytics.profit >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-100" : "bg-rose-500/10 border-rose-500/20 text-rose-100"
                    )}>
                       <div className={cn(
                         "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg",
                         analytics.profit >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                       )}>
                         {analytics.profit >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                       </div>
                       <div className="text-2xl font-black mb-1">{analytics.profit >= 0 ? "Profit Surplus" : "Budget Alert"}</div>
                       <p className="text-xs font-medium text-white/50 leading-relaxed">
                          {analytics.profit >= 0 
                            ? "Your clinic is operating with a healthy positive margin. Optimized resource allocation." 
                            : "Operational costs exceeded income this range. Review top expenses."}
                       </p>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                   <Activity className="w-6 h-6 text-blue-600" />
                 </div>
                 <h4 className="text-lg font-black text-slate-800">Smart Insights</h4>
              </div>
              
              <div className="space-y-6">
                 {insights.map((insight, idx) => (
                   <div key={idx} className="flex gap-4 group cursor-default">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                        {insight.icon}
                      </div>
                      <p className="text-sm font-bold text-slate-600 group-hover:text-slate-800 transition-colors leading-6">
                        {insight.text}
                      </p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const Reports = ({ stats, transactions, appointments, patients, members, onNotify }: { stats: DashboardStats, transactions: Transaction[], appointments: any[], patients: Patient[], members: any[], onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void }) => {
  return <ReportsByRange stats={stats} transactions={transactions} appointments={appointments} patients={patients} members={members} onNotify={onNotify} />;
};

const KPICard = ({ title, value, trend, icon, color, highlighted = false, hideCurrency = false, inverseTrend = false }: { title: string, value: number, trend: number, icon: React.ReactNode, color: string, highlighted?: boolean, hideCurrency?: boolean, inverseTrend?: boolean }) => {
  const isPositive = inverseTrend ? trend < 0 : trend >= 0;
  
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 ring-blue-50",
    rose: "bg-rose-50 text-rose-600 border-rose-100 ring-rose-50",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 ring-emerald-50",
    amber: "bg-amber-50 text-amber-600 border-amber-100 ring-amber-50",
    purple: "bg-purple-50 text-purple-600 border-purple-100 ring-purple-50",
  };

  return (
    <div className={cn(
      "p-6 rounded-[2rem] border transition-all hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden",
      highlighted ? "bg-white border-blue-100 shadow-xl shadow-blue-200/50 ring-4 ring-blue-50/50" : "bg-white border-slate-100 shadow-sm shadow-slate-200/50"
    )}>
       <div className={cn(
         "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
         colors[color]
       )}>
         {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
       </div>
       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</div>
       <div className="text-2xl font-black text-slate-900 tracking-tight">
          {!hideCurrency && <span className="text-slate-400 mr-1 text-lg">₹</span>}
          {value.toLocaleString()}
       </div>
       <div className={cn(
         "flex items-center gap-1 text-[10px] font-black uppercase mt-3 tracking-widest",
         isPositive ? "text-emerald-500" : "text-rose-500"
       )}>
         {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
         {Math.abs(trend)}%
         <span className="text-slate-300 ml-1">vs prev</span>
       </div>
    </div>
  );
};

const AppointmentManager = ({ patients, appointments, members, onNotify, viewTarget, setViewTarget }: { patients: Patient[], appointments: any[], members: any[], onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void, viewTarget?: {type: string, id: string} | null, setViewTarget?: any }) => {
  const [selectedDate, setSelectedDate] = useState(getLocalYMD());
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editApptId, setEditApptId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewType, setViewType] = useState<'day' | 'week'>('day');
  const [therapistFilter, setTherapistFilter] = useState('all');
  
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '',
    phone: '',
    age: ''
  });

  const [newAppt, setNewAppt] = useState({ 
    patientId: '', 
    therapistId: '',
    time: '09:00 AM', 
    sessionType: 'Consultation',
    notes: '' 
  });



  useEffect(() => {
    if (viewTarget?.type === 'appointment' && viewTarget.id) {
       const a = appointments.find(a => a.id === viewTarget.id);
       if (a) {
         openApptModal(a);
         setViewTarget(null);
       }
    } else if (viewTarget?.type === 'book-appointment' && viewTarget.id) {
       openApptModal(null, undefined, undefined, viewTarget.id);
       setViewTarget(null);
    }
  }, [viewTarget, appointments, setViewTarget]);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const slots = [
    '09:00 AM', '09:45 AM', '10:30 AM', '11:15 AM', 
    '12:00 PM', '12:45 PM', '01:30 PM', '02:15 PM', 
    '03:00 PM', '03:45 PM', '04:30 PM', '05:15 PM', '06:00 PM'
  ];

  const apptsForDate = appointments.filter(a => {
    const dateMatch = a.date === selectedDate;
    const statusMatch = statusFilter === 'all' || a.status === statusFilter;
    return dateMatch && statusMatch;
  });

  const getSlotStatus = (slotTime: string) => {
    // Parse 12h format: "09:45 AM"
    const [time, modifier] = slotTime.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const slotDate = new Date(selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);

    const now = currentTime;
    const slotEnd = new Date(slotDate);
    slotEnd.setMinutes(slotEnd.getMinutes() + 45); // Updated to 45m

    if (now > slotEnd) return 'past';
    if (now >= slotDate && now <= slotEnd) return 'ongoing';
    return 'upcoming';
  };

  const isSlotOccupied = (date: string, time: string, excludeId?: string | null) => {
    return appointments.some(a => 
      a.date === date && 
      a.time === time && 
      (excludeId ? a.id !== excludeId : true) && 
      a.status !== 'cancelled'
    );
  };

  const openApptModal = (appt?: any, defaultTime?: string, defaultDate?: string, defaultPatientId?: string) => {
    if (defaultDate) setSelectedDate(defaultDate);
    setIsNewPatient(false);
    setNewPatientData({ name: '', phone: '', age: '' });
    
    if (appt) {
      setEditApptId(appt.id);
      setNewAppt({
        patientId: appt.patientId || '',
        therapistId: appt.therapistId || '',
        time: appt.time,
        sessionType: appt.sessionType || 'Consultation',
        notes: appt.notes || ''
      });
      setSelectedDate(appt.date);
    } else {
      setEditApptId(null);
      // Find direct available slot if not provided, or check if provided is occupied
      let targetTime = defaultTime;
      const targetDate = defaultDate || selectedDate;
      const availableSlots = slots.filter(s => !isSlotOccupied(targetDate, s));
      
      if (!targetTime || isSlotOccupied(targetDate, targetTime)) {
        targetTime = availableSlots.length > 0 ? availableSlots[0] : (defaultTime || '09:00 AM');
      }

      setNewAppt({ 
        patientId: defaultPatientId || '', 
        therapistId: '',
        time: targetTime, 
        sessionType: 'Consultation',
        notes: '' 
      });
    }
    setShowModal(true);
  };

  const updateStatus = async (apptId: string, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    try {
      await updateAppointmentStatus(apptId, newStatus);
      onNotify(`Appointment marked as ${newStatus}`);
    } catch (error: any) {
      onNotify(error.message || "Failed to update status", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let patientId = newAppt.patientId;
    let patientName = '';
    let patientPhone = '';
    const isBlockedState = newAppt.sessionType === 'Blocked Slot';

    try {
      setIsSubmitting(true);

      if (!isBlockedState) {
        if (isNewPatient) {
          if (!newPatientData.name || !newPatientData.phone) {
            throw new Error("Patient name and phone are required");
          }
          const patientDoc = await savePatient({
            name: newPatientData.name,
            phone: newPatientData.phone,
            age: parseInt(newPatientData.age) || 0,
            gender: 'Not Specified',
            condition: 'New Patient Registration',
            medicalHistory: 'Registered via Appointment Schedule'
          });
          patientId = patientDoc.id;
          patientName = newPatientData.name;
          patientPhone = newPatientData.phone;
        } else {
          const patient = patients.find(p => p.id === patientId);
          if (!patient) throw new Error("Please select a patient");
          patientName = patient.name;
          patientPhone = patient.phone;
        }
      } else {
        patientName = 'BLOCKED SLOT';
        patientPhone = 'N/A';
        patientId = 'blocked';
      }

      const therapist = members.find(m => m.id === newAppt.therapistId);

      const appointmentData: any = {
        date: selectedDate,
        time: newAppt.time,
        notes: newAppt.notes,
        patientId,
        patientName,
        patientPhone,
        therapistId: newAppt.therapistId,
        therapistName: therapist?.name || 'Not Assigned',
        sessionType: newAppt.sessionType,
        status: editApptId ? appointments.find(a => a.id === editApptId)?.status : (isBlockedState ? 'blocked' : 'scheduled')
      };

      const isSlotTaken = isSlotOccupied(selectedDate, newAppt.time, editApptId);
      if (isSlotTaken) {
        throw new Error("This time slot is already booked. Please choose another time.");
      }

      if (editApptId) {
        await updateAppointmentStatus(editApptId, appointmentData.status, appointmentData);
        onNotify("Appointment updated successfully!");
      } else {
        await saveAppointment(appointmentData);
        onNotify(`Appointment booked for ${patientName}`);
      }
      setShowModal(false);
    } catch (error: any) {
      console.error("Booking operation failed:", error);
      onNotify(error.message || "Failed to save appointment.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in">
      <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
              <CalendarRange className="w-8 h-8" />
           </div>
           <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Appointment Schedule</h1>
              <div className="flex items-center gap-2 mt-1">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Real-time sync active</span>
              </div>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 hidden">
          </div>

          <div className="flex items-center gap-2 hidden">
             <User2 className="w-4 h-4 text-slate-400" />
             <select 
               value={therapistFilter}
               onChange={e => setTherapistFilter(e.target.value)}
               className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer min-w-[140px]"
             >
               <option value="all">All Doctors</option>
               {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
          </div>
          
          <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <div className="flex gap-2 flex-1 sm:flex-none">
             <input 
               type="date" 
               value={selectedDate}
               onChange={e => setSelectedDate(e.target.value)}
               className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
             />
          </div>

          <button onClick={() => openApptModal()} className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100 ml-auto">
            <Plus className="w-4 h-4" />
            <span>Book Appt</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {slots.map(slot => {
            const occupiedAppts = appointments.filter(a => a.date === selectedDate && a.time === slot && a.status !== 'cancelled');
            const slotAppts = apptsForDate.filter(a => a.time === slot);
            const isActuallyOccupied = occupiedAppts.length > 0;
            
            const status = getSlotStatus(slot);
            const isToday = selectedDate === getLocalYMD();
            const isOngoing = isToday && status === 'ongoing';
            const isPast = isToday && status === 'past';

            return (
              <motion.div 
                key={slot}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => {
                  if (isActuallyOccupied) {
                    openApptModal(occupiedAppts[0]);
                  } else if (!isPast) {
                    openApptModal(null, slot);
                  }
                }}
                className={cn(
                  "p-4 border shadow-sm rounded-3xl h-full flex flex-col transition-all duration-300 relative group overflow-hidden min-h-[180px] cursor-pointer",
                  isActuallyOccupied 
                    ? isOngoing ? "bg-blue-600 border-blue-500 shadow-xl shadow-blue-200 text-white"
                     : "bg-white border-blue-100 hover:border-blue-300"
                    : isPast ? "bg-slate-50 border-slate-100 border-dashed opacity-60 cursor-not-allowed"
                     : "bg-white border-slate-100 border-dashed hover:border-blue-400 hover:bg-blue-50/30"
                )}
              >
                 {/* Time Indicator Line (Ongoing only) */}
                 {isOngoing && isActuallyOccupied && (
                   <div className="absolute top-0 left-0 w-full h-1 bg-white/30 overflow-hidden">
                      <motion.div 
                        className="h-full bg-white"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1800, repeat: Infinity, ease: "linear" }}
                      />
                   </div>
                 )}

                 <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                       <Clock3 className={cn("w-3.5 h-3.5", isActuallyOccupied && !isOngoing ? "text-blue-500" : isOngoing && isActuallyOccupied ? "text-white" : "text-slate-400")} />
                       <span className={cn("text-sm font-black tabular-nums tracking-tight", isOngoing && isActuallyOccupied ? "text-white" : "text-slate-800")}>{slot}</span>
                    </div>
                    {!isActuallyOccupied && !isPast && (
                      <div className="w-6 h-6 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-3 h-3" />
                      </div>
                    )}
                 </div>

                 <div className="flex-1 flex flex-col pt-1 space-y-3">
                    {isActuallyOccupied ? (
                      (() => {
                        const displayAppt = slotAppts[0] || occupiedAppts[0];
                        const isFilteredOut = slotAppts.length === 0;
                        
                        return (
                          <div key={displayAppt.id} className={cn("pb-3 border-b border-slate-100 last:border-0", isOngoing ? "border-white/10" : "", isFilteredOut ? "opacity-40" : "")}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm", isOngoing ? "bg-white/20" : "bg-slate-100")}>
                                 <User2 className={cn("w-4 h-4", isOngoing ? "text-white" : "text-slate-500")} />
                              </div>
                              <div className={cn("font-black text-sm truncate", isOngoing ? "text-white" : "text-slate-800")}>
                                {displayAppt.patientName}
                              </div>
                              <div className={cn(
                                "ml-auto px-1.5 py-0.5 rounded text-[8px] font-black uppercase",
                                displayAppt.status === 'completed' ? "bg-emerald-100 text-emerald-700" : 
                                displayAppt.status === 'cancelled' ? "bg-rose-100 text-rose-700" : 
                                isOngoing ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                              )}>
                                {displayAppt.status}
                              </div>
                            </div>
                            
                            <div className={cn("flex flex-col gap-1 text-[10px] ml-9 font-bold", isOngoing ? "text-white/80" : "text-slate-500")}>
                               <div className="flex items-center gap-1.5"><Activity className={cn("w-3 h-3", isOngoing ? "text-white" : "text-blue-500")} /> {displayAppt.sessionType}</div>
                            </div>

                            <div className="flex gap-1.5 mt-3 ml-9">
                               {displayAppt.status === 'scheduled' && (
                                 <>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       updateStatus(displayAppt.id, 'completed');
                                     }} 
                                     className={cn("p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors", isOngoing ? "hover:bg-white/20 text-white border border-white/20" : "border border-slate-100")}
                                     title="Mark as Complete"
                                   >
                                     <CheckCircle className="w-3.5 h-3.5" />
                                   </button>
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       updateStatus(displayAppt.id, 'cancelled');
                                     }} 
                                     className={cn("p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors", isOngoing ? "hover:bg-white/20 text-white border border-white/20" : "border border-slate-100")}
                                     title="Patient Not Present"
                                   >
                                     <UserX className="w-3.5 h-3.5" />
                                   </button>
                                 </>
                               )}
                               {displayAppt.status === 'completed' && (
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     updateStatus(displayAppt.id, 'scheduled');
                                   }} 
                                   className={cn("p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors", isOngoing ? "hover:bg-white/20 text-white border border-white/20" : "border border-slate-100")}
                                   title="Mark as Not Complete"
                                 >
                                   <XCircle className="w-3.5 h-3.5" />
                                 </button>
                               )}
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-40 group-hover:opacity-100 transition-all">
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest">{isPast ? 'Slot Past' : 'Available'}</span>
                      </div>
                    )}
                 </div>
              </motion.div>
            );
          })}
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm transition-all animate-in fade-in duration-300">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh] border border-slate-100"
          >
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                     {editApptId ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{editApptId ? 'Update Session' : 'New Appointment'}</h3>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none mt-1.5 flex items-center gap-1.5">
                      <CalendarRange className="w-3 h-3" />
                      {new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
               </div>
               <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-8 bg-slate-50/20">
              <form id="appt-form" onSubmit={handleSubmit} className="space-y-8">
                 <motion.div 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.1 }}
                   className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-6"
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", isNewPatient ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600")}>
                             {isNewPatient ? <Plus className="w-5 h-5" /> : <User2 className="w-5 h-5" />}
                          </div>
                          <div>
                             <span className="text-sm font-black text-slate-800">{isNewPatient ? 'Quick Register' : 'Assign Patient'}</span>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                               {isNewPatient ? 'Create new patient profile' : 'Selection existing record'}
                             </p>
                          </div>
                       </div>
                       
                       <button 
                         type="button"
                         onClick={() => setIsNewPatient(!isNewPatient)}
                         className={cn(
                           "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                           isNewPatient 
                            ? "bg-slate-50 border-slate-200 text-slate-500 hover:bg-white" 
                            : "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-100 hover:bg-blue-700"
                         )}
                       >
                          {isNewPatient ? 'Select Existing' : 'Add New Patient'}
                       </button>
                    </div>

                    <div className="space-y-4">
                       {newAppt.sessionType !== 'Blocked Slot' ? (
                         <>
                           {!isNewPatient ? (
                             <>
                               <select 
                                 required={!isNewPatient && newAppt.sessionType !== 'Blocked Slot'}
                                 value={newAppt.patientId} 
                                 onChange={e => setNewAppt({...newAppt, patientId: e.target.value})} 
                                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100/50 focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer"
                               >
                                  <option value="">Start typing or select patient...</option>
                                  {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
                               </select>

                               {/* Mini Patient Profile Preview */}
                               {newAppt.patientId && (
                                 <motion.div 
                                   initial={{ height: 0, opacity: 0 }}
                                   animate={{ height: 'auto', opacity: 1 }}
                                   className="pt-2"
                                 >
                                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-full bg-white border-2 border-blue-200 flex items-center justify-center font-black text-blue-600 shadow-sm uppercase">
                                          {patients.find(p => p.id === newAppt.patientId)?.name.substring(0, 2) || '??'}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="text-xs font-black text-slate-900 truncate">{patients.find(p => p.id === newAppt.patientId)?.name || 'Unknown Patient'}</div>
                                          <div className="flex items-center gap-3 mt-1">
                                             <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Smartphone className="w-3 h-3 text-blue-400" /> {patients.find(p => p.id === newAppt.patientId)?.phone || 'No phone'}</div>
                                             <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3 text-blue-400" /> {patients.find(p => p.id === newAppt.patientId)?.age || 'N/A'} Years</div>
                                          </div>
                                       </div>
                                       <div className="tag bg-blue-100 text-blue-700 text-[8px] font-black uppercase">Selected</div>
                                    </div>
                                 </motion.div>
                               )}
                             </>
                           ) : (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="md:col-span-2">
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                                   <input 
                                     type="text" 
                                     required={isNewPatient && newAppt.sessionType !== 'Blocked Slot'}
                                     placeholder="Enter patient's full name"
                                     value={newPatientData.name}
                                     onChange={e => setNewPatientData({...newPatientData, name: e.target.value})}
                                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                                   />
                                </div>
                                <div>
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Phone Number</label>
                                   <input 
                                     type="tel" 
                                     required={isNewPatient && newAppt.sessionType !== 'Blocked Slot'}
                                     placeholder="+91 00000 00000"
                                     value={newPatientData.phone}
                                     onChange={e => setNewPatientData({...newPatientData, phone: e.target.value})}
                                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                                   />
                                </div>
                                <div>
                                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Age</label>
                                   <input 
                                     type="number" 
                                     min="0"
                                     placeholder="Age"
                                     value={newPatientData.age}
                                     onChange={e => setNewPatientData({...newPatientData, age: e.target.value})}
                                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all"
                                   />
                                </div>
                             </div>
                           )}
                         </>
                       ) : (
                         <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center">
                            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500">This slot will be marked as <span className="text-slate-800">UNAVAILABLE</span>.</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No patient details required</p>
                         </div>
                       )}
                    </div>
                 </motion.div>

                 {/* Session Logistics Segment */}
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                 >
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                             <Activity className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Service</span>
                       </div>
                       <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Procedure</label>
                          <select 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400 focus:bg-white transition-all appearance-none cursor-pointer"
                            value={newAppt.sessionType} 
                            onChange={e => setNewAppt({...newAppt, sessionType: e.target.value})}
                          >
                             <option>Consultation</option>
                             <option>Manual Therapy</option>
                             <option>Dry Needling</option>
                             <option>Cupping Therapy</option>
                             <option>Taping Therapy</option>
                             <option>Electrotherapy</option>
                             <option>Rehabilitation</option>
                             <option>Blocked Slot</option>
                             <option>Others</option>
                          </select>
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                             <Clock3 className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Timing</span>
                       </div>
                       <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">45 Min Slot</label>
                          <select 
                            required 
                            value={newAppt.time} 
                            onChange={e => setNewAppt({...newAppt, time: e.target.value})} 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 focus:bg-white transition-all appearance-none cursor-pointer"
                          >
                             {slots.filter(s => !isSlotOccupied(selectedDate, s, editApptId)).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                       </div>
                    </div>
                 </motion.div>

                 {/* Comments Segment */}
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4"
                 >
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                       </div>
                       <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Appointment Notes</span>
                    </div>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all min-h-[140px] resize-none" 
                      placeholder="Brief clinic instructions or specific requests..." 
                      value={newAppt.notes} 
                      onChange={e => setNewAppt({...newAppt, notes: e.target.value})}
                    ></textarea>
                 </motion.div>
              </form>
            </div>

            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex justify-end gap-4">
               <button type="button" onClick={() => setShowModal(false)} className="px-8 py-3.5 rounded-2xl text-sm font-black text-slate-500 hover:bg-slate-100 transition-all">Discard</button>
               <button 
                 type="submit" 
                 form="appt-form" 
                 disabled={isSubmitting} 
                 className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-100 transition-all active:scale-95 flex items-center gap-2"
               >
                  {isSubmitting ? <Activity className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {editApptId ? 'Update Session' : 'Confirm Booking'}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const SessionManager = ({ appointments, onNotify }: { appointments: Appointment[], onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void }) => {
  const todayDate = getLocalYMD();
  const sessions = appointments.filter(a => a.date === todayDate && a.status === 'scheduled');
  const [selectedSession, setSelectedSession] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (selectedSession) {
      const unsub = getSessions(selectedSession.patientId, setHistory);
      return () => unsub();
    }
  }, [selectedSession]);

  const handleFinalize = async (appt: Appointment) => {
    try {
      await updateAppointmentStatus(appt.id, 'completed');
      onNotify(`Session with ${appt.patientName} marked as completed!`);
    } catch (err: any) {
      onNotify(err.message || "Failed to finalize session.", "error");
    }
  };

  return (
    <div className="space-y-6">
       <header className="border-b border-slate-200 pb-6 flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Today's Schedule</h1>
            <p className="text-sm text-slate-500">Manage and complete patient sessions.</p>
          </div>
       </header>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(s => (
            <div key={s.id} className={cn("card p-5 space-y-4 hover:border-blue-300 transition-all cursor-pointer flex flex-col", selectedSession?.id === s.id ? "ring-2 ring-blue-500 border-blue-500" : "")} onClick={() => setSelectedSession(s)}>
               <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {s.time}</div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{s.patientName}</h3>
                    <p className="text-sm text-slate-500 mt-1">{s.sessionType}</p>
                  </div>
               </div>
               
               {selectedSession?.id === s.id && (
                 <div className="mt-4 pt-4 border-t border-slate-100 flex-1 flex flex-col">
                    <div className="mb-4">
                       <label className="label">Recent History</label>
                       <div className="space-y-2 mt-1">
                          {history.slice(0, 2).map((h, i) => (
                            <div key={i} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs">
                               <div className="font-semibold text-slate-700">{h.date}</div>
                               <div className="text-slate-500 line-clamp-2 mt-0.5">{h.notes || 'No notes.'}</div>
                            </div>
                          ))}
                          {history.length === 0 && <div className="text-xs text-slate-400 italic py-2 border border-dashed border-slate-200 rounded text-center">No previous records.</div>}
                       </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-end">
                       <button onClick={(e) => { e.stopPropagation(); handleFinalize(s); }} className="w-full btn-primary py-2.5">Mark as Complete</button>
                    </div>
                 </div>
               )}
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-lg border border-slate-200 border-dashed">
               <span className="text-sm font-semibold text-slate-500">No appointments scheduled for today</span>
            </div>
          )}
       </div>
    </div>
  );
};

const TeamManager = ({ role, members, onNotify }: { role: string, members: any[], onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [newMember, setNewMember] = useState({ name: '', role: 'therapist', phone: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationError, setCreationError] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [showModalPassword, setShowModalPassword] = useState(false);

  const togglePasswordVisibility = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (member: any) => {
    setEditingMember(member);
    setNewMember({
      name: member.name || '',
      role: member.role || 'therapist',
      phone: member.phone || '',
      email: member.email || '',
      password: member.password || ''
    });
    setShowMemberModal(true);
  };

  const stats = useMemo(() => {
    return {
      total: members.length,
      active: members.filter(m => m.isActive).length,
      inactive: members.filter(m => !m.isActive).length,
      therapists: members.filter(m => m.role === 'therapist').length
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.staffId || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? m.isActive : !m.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      return a.role.localeCompare(b.role);
    });
  }, [members, searchTerm, roleFilter, statusFilter, sortBy]);

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreationError('');
    try {
      if (newMember.password && newMember.password !== 'INVITE_ONLY' && newMember.password.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }

      if (editingMember) {
        await updateTeamMember(editingMember.id, {
          name: newMember.name,
          role: newMember.role.toLowerCase(),
          phone: newMember.phone,
          password: newMember.password === 'INVITE_ONLY' ? '' : (newMember.password || editingMember.password)
        });
        onNotify("Staff profile updated successfully");
      } else {
        if (!newMember.email || !newMember.password) {
          throw new Error("Email and initial password are required to create a staff account.");
        }
        await saveTeamMember(newMember);
        onNotify(`Staff account created for ${newMember.name}`);
      }
      setShowMemberModal(false);
      setEditingMember(null);
      setNewMember({ name: '', role: 'therapist', phone: '', email: '', password: '' });
    } catch (err: any) {
      console.error("Member submit error:", err);
      setCreationError(err.message || 'Failed to process. Ensure email is unique and password is at least 6 characters.');
      onNotify(err.message || "Operation failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (member: any) => {
    try {
      await deleteTeamMember(member.id);
      onNotify(`Member ${member.name} deleted successfully!`);
      setPendingDelete(null);
    } catch (err: any) {
      onNotify(err.message || "Failed to delete staff member.", "error");
    }
  };

  const handleStatusUpdate = async (memberId: string, newStatus: boolean, name: string) => {
    try {
      await updateTeamMemberStatus(memberId, newStatus);
      onNotify(`Access ${newStatus ? 'restored' : 'revoked'} for ${name}`);
    } catch (err: any) {
      onNotify(err.message || "Status update failed", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <Users className="w-6 h-6 text-white" />
             </div>
             Staff Management Hub
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage permissions, track activity, and optimize your clinic team.</p>
        </div>
        <div className="flex w-full lg:w-auto">
          {role === 'admin' && (
            <button 
              onClick={() => { setShowMemberModal(true); setEditingMember(null); }} 
              className="flex-1 lg:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard title="Total Staff" value={stats.total} icon={<Users />} color="indigo" />
        <SummaryCard title="Active Now" value={stats.active} icon={<CheckCircle2 />} color="emerald" />
        <SummaryCard title="On Leave / Inactive" value={stats.inactive} icon={<AlertCircle />} color="rose" />
        <SummaryCard title="Therapists" value={stats.therapists} icon={<Activity />} color="blue" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
           {/* Filters Bar */}
           <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-4 transition-colors">
              <div className="relative flex-1 w-full">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                 <input 
                   type="text" 
                   placeholder="Search by name, email or Staff ID..."
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 focus:border-indigo-500 dark:focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                 />
              </div>
              <div className="flex items-center gap-3 w-full md:w-auto">
                 <select 
                   value={roleFilter}
                   onChange={e => setRoleFilter(e.target.value)}
                   className="flex-1 md:w-32 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                 >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="therapist">Therapists</option>
                    <option value="manager">Managers</option>
                 </select>
                 <select 
                   value={sortBy}
                   onChange={e => setSortBy(e.target.value)}
                   className="flex-1 md:w-32 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                 >
                    <option value="newest">Newest</option>
                    <option value="role">By Role</option>
                 </select>
              </div>
           </div>

           {/* Staff Table */}
           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="overflow-x-auto w-full">
                 <table className="w-full text-left border-collapse min-w-full md:min-w-[800px]">
                    <thead className="hidden md:table-header-group bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                       <tr>
                          <th className="px-8 py-5">Staff Member</th>
                          <th className="px-8 py-5">Role & Access</th>
                          <th className="px-8 py-5">Account Status</th>
                          <th className="px-8 py-5 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 block md:table-row-group">
                       {filteredMembers.map((member) => (
                         <tr 
                           key={member.id} 
                           onClick={() => setSelectedMember(member)}
                           className={cn(
                             "hover:bg-slate-50/50 transition-colors group cursor-pointer block md:table-row pb-4 md:pb-0 pt-2 md:pt-0 border-b border-slate-100 md:border-none relative", 
                             !member.isActive && "bg-slate-50/30",
                             selectedMember?.id === member.id && "bg-indigo-50/50 ring-1 ring-inset ring-indigo-100"
                           )}
                         >
                            <td className="px-4 md:px-8 py-3 md:py-5 block md:table-cell md:border-none">
                               <div className="flex items-start md:items-center justify-between md:justify-start w-full">
                                  <div className="flex items-center gap-4 w-full">
                                     <div className="w-11 h-11 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shadow-sm relative shrink-0">
                                        {member.name.charAt(0)}
                                        {member.isActive && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>}
                                     </div>
                                     <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                           <div className="text-sm font-black text-slate-800 break-words">{member.name}</div>
                                           {member.staffId && (
                                              <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">
                                                 {member.staffId}
                                              </span>
                                            )}
                                         </div>
                                         <div className="text-[11px] font-bold text-slate-400 mt-0.5 break-words">{member.email}</div>
                                         <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                           <div className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[120px]">
                                             {member.password ? (visiblePasswords[member.id] ? member.password : '••••••••') : 'No password set'}
                                           </div>
                                           {member.password && (
                                             <button 
                                               onClick={(e) => togglePasswordVisibility(e, member.id)}
                                               className="text-slate-400 hover:text-indigo-600 transition-colors p-1 md:p-0"
                                               title={visiblePasswords[member.id] ? "Hide" : "Show"}
                                             >
                                               {visiblePasswords[member.id] ? <EyeOff className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Eye className="w-4 h-4 md:w-3.5 md:h-3.5" />}
                                             </button>
                                           )}
                                         </div>
                                      </div>
                                  </div>
                               </div>
                            </td>
                            <td className="px-4 py-2 md:px-8 md:py-5 block md:table-cell border-none md:ml-16">
                               <div className="flex justify-between items-center md:items-start md:flex-col space-y-0 md:space-y-1.5">
                                  <span className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                    member.role === 'admin' ? "bg-purple-50 text-purple-600" : 
                                    member.role === 'therapist' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                                  )}>
                                     {member.role === 'admin' ? <Shield className="w-3 h-3" /> : <User2 className="w-3 h-3" />}
                                     {member.role}
                                  </span>
                                  <div className="text-[10px] font-bold text-slate-400 text-right md:text-left">Last login: {member.lastLogin ? new Date(member.lastLogin).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Never'}</div>
                               </div>
                            </td>
                            <td className="px-4 py-2 md:px-8 md:py-5 block md:table-cell border-none md:ml-16">
                               <div className="flex items-center justify-between md:justify-start gap-4 md:gap-3">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest md:hidden">Status:</span>
                                  <div className="flex items-center gap-3">
                                    <button 
                                      onClick={() => handleStatusUpdate(member.id, !member.isActive, member.name)}
                                      className={cn(
                                        "w-12 h-6 md:w-10 md:h-5 rounded-full relative transition-colors duration-300 outline-none",
                                        member.isActive ? "bg-emerald-500" : "bg-slate-200"
                                      )}
                                    >
                                       <div className={cn(
                                         "absolute top-0.5 md:w-4 md:h-4 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                         member.isActive ? "right-0.5" : "left-0.5"
                                       )}></div>
                                    </button>
                                    <span className={cn(
                                      "text-[10px] sm:text-xs font-black uppercase tracking-tighter",
                                      member.isActive ? "text-emerald-600" : "text-slate-400"
                                    )}>
                                       {member.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                  </div>
                               </div>
                            </td>
                            <td className="px-4 py-3 md:px-8 md:py-5 md:text-right border-t border-slate-50 md:border-none block md:table-cell md:ml-16">
                               {role === 'admin' ? (
                                 <div className="flex items-center justify-between md:justify-end w-full gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest md:hidden">Actions:</span>
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); startEditing(member); }}
                                        className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-200 md:border-transparent bg-white md:bg-transparent"
                                        title="Edit Profile"
                                      >
                                         <Pencil className="w-5 h-5 md:w-4 md:h-4" />
                                      </button>
                                      <div className="relative group/menu">
                                         <button 
                                           onClick={(e) => e.stopPropagation()} 
                                           className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 md:hover:bg-slate-100 rounded-xl transition-all border border-slate-200 md:border-transparent bg-white md:bg-transparent"
                                         >
                                            <MoreVertical className="w-5 h-5 md:w-4 md:h-4" />
                                         </button>
                                         <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-20 scale-95 opacity-0 invisible group-hover/menu:scale-100 group-hover/menu:opacity-100 group-hover/menu:visible transition-all origin-top-right">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); startEditing(member); }}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                          >
                                             <Edit className="w-3.5 h-3.5 text-indigo-500" />
                                             Edit Staff
                                          </button>
                                          <button 
                                            onClick={() => handleStatusUpdate(member.id, !member.isActive, member.name)}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                          >
                                             {member.isActive ? <UserMinus className="w-3.5 h-3.5 text-amber-500" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-500" />}
                                             {member.isActive ? 'Disable Access' : 'Restore Access'}
                                          </button>
                                          <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                          <button 
                                            onClick={() => setPendingDelete(member)}
                                            className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                          >
                                             <Trash2 className="w-3.5 h-3.5" />
                                             Delete Staff
                                          </button>
                                       </div>
                                    </div>
                                 </div>
                                </div>
                               ) : (
                                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic md:text-right block w-full">Restricted</span>
                               )}
                            </td>
                         </tr>
                       ))}
                       {filteredMembers.length === 0 && (
                         <tr>
                            <td colSpan={4} className="py-20 text-center">
                               <div className="flex flex-col items-center gap-3">
                                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                     <Users className="w-8 h-8 text-slate-300" />
                                  </div>
                                  <div className="text-slate-400 font-bold">No matching staff members found.</div>
                               </div>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="space-y-8 sticky top-6 self-start">
           {/* Access Control Panel */}
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                   <ShieldCheck className="w-6 h-6 text-indigo-600" />
                 </div>
                 <h4 className="text-lg font-black text-slate-800">Role Permissions</h4>
              </div>

              <div className="space-y-6">
                 {[
                   { role: 'Admin', icon: <Shield className="w-4 h-4 text-purple-600" />, access: 'Full System Control' },
                   { role: 'Therapist', icon: <Activity className="w-4 h-4 text-blue-600" />, access: 'Clinical & Patient Data' },
                   { role: 'Manager', icon: <CalendarRange className="w-4 h-4 text-amber-600" />, access: 'Bookings & Billing' }
                 ].map((r, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                           {r.icon}
                         </div>
                         <div>
                           <div className="text-sm font-black text-slate-800">{r.role}</div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{r.access}</p>
                         </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                         <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                      </div>
                   </div>
                 ))}
              </div>
              
              <div className="mt-8 p-6 bg-indigo-900 rounded-3xl text-white relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-150"></div>
                 <div className="relative z-10">
                    <h5 className="text-xs font-black uppercase tracking-[0.2em] mb-2 text-indigo-300">Security Note</h5>
                    <p className="text-[11px] font-medium leading-relaxed opacity-80">
                       All staff activity is logged. Role-based access control prevents unauthorized data modification.
                    </p>
                 </div>
              </div>
           </div>

           {/* Insights Card */}
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                   <TrendingUp className="w-6 h-6 text-emerald-600" />
                 </div>
                 <h4 className="text-lg font-black text-slate-800">Staff Insights</h4>
              </div>
              
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</div>
                       <div className="text-lg font-black text-slate-800">94.8%</div>
                    </div>
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black">
                       <ArrowUpRight className="w-5 h-5" />
                    </div>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }}></div>
                 </div>
                 
                 <div className="pt-4 border-t border-slate-100">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Most Active Today</div>
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                          {members.find(m => m.isActive)?.name.charAt(0) || 'A'}
                       </div>
                       <div>
                          <div className="text-sm font-black text-slate-800">{members.find(m => m.isActive)?.name || 'Admin'}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">12 sessions handled</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-300">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-t-[2rem] sm:rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh] overflow-y-auto border border-slate-100 pb-safe"
          >
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-800">{editingMember ? 'Edit Staff Profile' : 'Add Staff Member'}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure user access credentials</p>
              </div>
              <button 
                onClick={() => { setShowMemberModal(false); setEditingMember(null); }} 
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleMemberSubmit} className="p-5 sm:p-8 space-y-6">
              {creationError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {creationError}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={newMember.name} 
                    onChange={e => setNewMember({...newMember, name: e.target.value})}
                    placeholder="Enter full name"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role Type</label>
                  <select 
                    value={newMember.role} 
                    onChange={e => setNewMember({...newMember, role: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="therapist">Therapist</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required 
                    value={newMember.email} 
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                    placeholder="name@fitrevive.com"
                    disabled={!!editingMember}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2 col-span-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={newMember.phone} 
                    onChange={e => setNewMember({...newMember, phone: e.target.value})}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Setup Mode</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <button 
                       type="button"
                       onClick={() => setNewMember({...newMember, password: 'INVITE_ONLY'})}
                       className={cn(
                         "p-4 rounded-2xl border text-left transition-all",
                         newMember.password === 'INVITE_ONLY' ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100" : "bg-slate-50 border-slate-200"
                       )}
                     >
                        <div className="text-xs font-black text-slate-800">Send Invite Link</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">Staff sets their own password via email</div>
                     </button>
                     <button 
                       type="button"
                       onClick={() => setNewMember({...newMember, password: ''})}
                       className={cn(
                         "p-4 rounded-2xl border text-left transition-all",
                         newMember.password !== 'INVITE_ONLY' ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100" : "bg-slate-50 border-slate-200"
                       )}
                     >
                        <div className="text-xs font-black text-slate-800">Manual Password</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1">Set initial password for staff now</div>
                     </button>
                  </div>
                </div>

                {newMember.password !== 'INVITE_ONLY' && (
                  <div className="space-y-2 col-span-1 sm:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {editingMember ? 'Password (Stored for Admin)' : 'Initial Password'}
                    </label>
                    <div className="relative">
                      <input 
                        type={showModalPassword ? "text" : "password"} 
                        required 
                        value={newMember.password} 
                        onChange={e => setNewMember({...newMember, password: e.target.value})}
                        placeholder="Enter a secure password (min 6 characters)"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword(!showModalPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                      >
                        {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => { setShowMemberModal(false); setEditingMember(null); }}
                  className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    editingMember ? "Save Changes" : "Create Account"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {selectedMember && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMember(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              className="relative w-full sm:w-[480px] bg-white h-[100dvh] sm:h-full shadow-2xl flex flex-col border-l border-slate-100 sm:rounded-l-3xl overflow-hidden"
            >
               <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <User2 className="w-6 h-6 text-white" />
                     </div>
                     <h3 className="text-xl font-black text-slate-800">Staff Profile</h3>
                  </div>
                  <button 
                    onClick={() => setSelectedMember(null)}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                  >
                     <X className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  <div className="flex flex-col items-center text-center">
                     <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl font-black text-indigo-600 shadow-sm relative mb-4">
                        {selectedMember.name.charAt(0)}
                        <div className={cn(
                          "absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white shadow-sm",
                          selectedMember.isActive ? "bg-emerald-500" : "bg-slate-300"
                        )}></div>
                     </div>
                     <h4 className="text-2xl font-black text-slate-800">{selectedMember.name}</h4>
                     <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{selectedMember.role}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Staff ID</div>
                        <div className="text-sm font-black text-slate-800">{selectedMember.staffId || 'N/A'}</div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</div>
                        <div className="text-sm font-black text-slate-800">{selectedMember.phone || 'Not Provided'}</div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-1 sm:col-span-2">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email Address</div>
                        <div className="text-sm font-black text-slate-800">{selectedMember.email}</div>
                     </div>
                     {selectedMember.password && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 col-span-1 sm:col-span-2 flex justify-between items-center">
                           <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Password</div>
                              <div className="text-sm font-black text-slate-800 tracking-wider">
                                {visiblePasswords[selectedMember.id] ? selectedMember.password : '••••••••'}
                              </div>
                           </div>
                           <button 
                             onClick={(e) => togglePasswordVisibility(e, selectedMember.id)}
                             className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                           >
                             {visiblePasswords[selectedMember.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                     )}
                  </div>

                  <div className="space-y-4">
                     <div className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Performance Overview</div>
                     <div className="bg-indigo-900 rounded-3xl p-6 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                        <div className="relative z-10 flex items-center justify-between">
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Total Consultations</div>
                              <div className="text-3xl font-black mt-1">142</div>
                           </div>
                           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                              <CalendarCheck className="w-6 h-6 text-indigo-200" />
                           </div>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100">
                           <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Rating</div>
                           <div className="text-xl font-black text-emerald-800">4.9/5</div>
                        </div>
                        <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100">
                           <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Efficiency</div>
                           <div className="text-xl font-black text-blue-800">92%</div>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-8 border-t border-slate-50 bg-slate-50/50 flex gap-3">
                  <button 
                    onClick={() => { startEditing(selectedMember); setSelectedMember(null); }}
                    className="flex-1 px-6 py-3.5 bg-white border border-slate-200 hover:border-indigo-200 text-slate-700 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                     <Edit className="w-4 h-4 text-indigo-500" />
                     <span>Edit Profile</span>
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(selectedMember.id, !selectedMember.isActive, selectedMember.name)}
                    className={cn(
                      "flex-1 px-6 py-3.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2",
                      selectedMember.isActive ? "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100"
                    )}
                  >
                     {selectedMember.isActive ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                     <span>{selectedMember.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
               </div>
            </motion.div>
         </div>
      )}

      {pendingDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
           <motion.div 
             initial={{ scale: 0.95, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl border border-slate-100 text-center"
           >
              <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
                 <Trash2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Delete Member?</h3>
              <p className="text-sm font-medium text-slate-400 leading-relaxed mb-8">
                 This will permanently remove <span className="font-bold text-slate-700">{pendingDelete.name}</span>'s access and records from the clinic database.
              </p>
              <div className="flex gap-3">
                 <button onClick={() => setPendingDelete(null)} className="flex-1 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">Cancel</button>
                 <button onClick={() => handleDeleteMember(pendingDelete)} className="flex-1 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-200">Yes, Delete</button>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm shadow-slate-200/50 flex items-center gap-4 group hover:shadow-lg transition-all hover:-translate-y-1">
       <div className={cn(
         "w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm font-black",
         colors[color]
       )}>
         {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
       </div>
       <div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{title}</div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">{value.toLocaleString()}</div>
       </div>
    </div>
  );
};

const AttendanceManager = ({ role, members, currentUserEmail, onNotify }: { role: string, members: any[], currentUserEmail: string | null, onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void }) => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [rangeAttendance, setRangeAttendance] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalYMD());
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [historyTab, setHistoryTab] = useState(false);
  const [historyRange, setHistoryRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
    end: new Date().toISOString().substring(0, 10)
  });

  const LATE_THRESHOLD = "09:15";

  useEffect(() => {
    const unsubAttendance = getAttendance(selectedDate, setAttendance);
    return () => { unsubAttendance(); };
  }, [selectedDate]);

  useEffect(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const start = sevenDaysAgo.toISOString().substring(0, 10);
    const end = new Date().toISOString().substring(0, 10);
    const unsubRange = getAttendanceRange(start, end, setRangeAttendance);
    return () => { unsubRange(); };
  }, []);

  const markAttendance = async (member: any, status: 'present' | 'absent' | 'late') => {
    try {
      const now = new Date();
      const checkInTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      let finalStatus = status;
      if (status === 'present' && checkInTime > LATE_THRESHOLD) {
        finalStatus = 'late';
      }
      await logAttendance({
        memberId: member.id,
        memberName: member.name,
        date: selectedDate,
        checkIn: status === 'absent' ? '' : now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: finalStatus
      });
      onNotify(`Attendance marked as ${finalStatus} for ${member.name}`);
    } catch (err: any) {
      onNotify(err.message || "Failed to mark attendance.", "error");
    }
  };

  const markAllPresent = async () => {
    const todayDateObj = new Date();
    const today = `${todayDateObj.getFullYear()}-${String(todayDateObj.getMonth() + 1).padStart(2, '0')}-${String(todayDateObj.getDate()).padStart(2, '0')}`;
    if (selectedDate !== today) {
      if (!window.confirm("You are marking all present for a date other than today. Continue?")) return;
    }
    const unMarked = members.filter(m => m.isActive && !attendance.find(a => a.memberId === m.id));
    if (unMarked.length === 0) {
      onNotify("All staff members are already marked for today.", "info");
      return;
    }
    try {
      for (const m of unMarked) {
        await markAttendance(m, 'present');
      }
      onNotify(`Successfully marked ${unMarked.length} staff members as present.`);
    } catch (err: any) {
      onNotify("Error marking all present.", "error");
    }
  };


  const exportAttendanceCSV = () => {
    const data = rangeAttendance.map(a => ({
      Date: a.date,
      Name: a.memberName,
      Status: a.status.toUpperCase(),
      "Check-In": a.checkIn || 'N/A'
    }));
    if (data.length === 0) {
      onNotify("No data to export.", "info");
      return;
    }
    const csvRows = [
      ["Date", "Name", "Status", "Check-In"],
      ...data.map(row => [row.Date, row.Name, row.Status, row["Check-In"]])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_Report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeStaff = members.filter(m => m.isActive);
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;
  const absentCount = attendance.filter(a => a.status === 'absent').length;
  const totalStaff = activeStaff.length;

  const visibleMembers = activeStaff.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role.toLowerCase() === roleFilter;
    const record = attendance.find(a => a.memberId === m.id);
    let matchesStatus = true;
    if (statusFilter === 'present') matchesStatus = !!record && (record.status === 'present' || record.status === 'late');
    else if (statusFilter === 'absent') matchesStatus = !!record && record.status === 'absent';
    else if (statusFilter === 'unmarked') matchesStatus = !record;
    const hasPermission = role === 'admin' || m.email === currentUserEmail;
    return matchesSearch && matchesRole && matchesStatus && hasPermission;
  });

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().substring(0, 10);
    });
    return last7Days.map(date => {
      const dayRecords = rangeAttendance.filter(a => a.date === date);
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        present: dayRecords.filter(r => r.status === 'present' || r.status === 'late').length,
        absent: dayRecords.filter(r => r.status === 'absent').length
      };
    });
  }, [rangeAttendance]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <Clock className="w-6 h-6 text-white" />
            </div>
            Attendance Dashboard
          </h1>
          <p className="text-slate-500 font-medium mt-1">Real-time presence monitoring and insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 w-full md:w-auto">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none w-full cursor-pointer"
            />
          </div>
          {role === 'admin' && (
            <button 
              onClick={markAllPresent}
              className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" /> Mark All Present
            </button>
          )}
          <button 
            onClick={exportAttendanceCSV}
            className="flex-1 md:flex-none px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Export
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-sm relative z-10">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-black text-emerald-700/60 uppercase tracking-widest relative z-10">Present Today</div>
            <div className="text-4xl font-black text-emerald-700 mt-1 relative z-10">{presentCount}</div>
            <div className="text-[10px] font-bold text-emerald-600/50 mt-2 relative z-10">Includes late entries</div>
         </div>
         <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100/30 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 shadow-sm relative z-10">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-sm font-black text-rose-700/60 uppercase tracking-widest relative z-10">Absent Today</div>
            <div className="text-4xl font-black text-rose-700 mt-1 relative z-10">{absentCount}</div>
            <div className="text-[10px] font-bold text-rose-600/50 mt-2 relative z-10">Marked as absent</div>
         </div>
         <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100/30 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 shadow-sm relative z-10">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-sm font-black text-amber-700/60 uppercase tracking-widest relative z-10">Late Check-ins</div>
            <div className="text-4xl font-black text-amber-700 mt-1 relative z-10">{lateCount}</div>
            <div className="text-[10px] font-bold text-amber-600/50 mt-2 relative z-10">After {LATE_THRESHOLD} AM</div>
         </div>
         <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/30 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-sm relative z-10">
              <Users className="w-6 h-6" />
            </div>
            <div className="text-sm font-black text-blue-700/60 uppercase tracking-widest relative z-10">Total Staff</div>
            <div className="text-4xl font-black text-blue-700 mt-1 relative z-10">{totalStaff}</div>
            <div className="text-[10px] font-bold text-blue-600/50 mt-2 relative z-10">Active members</div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> Weekly Trends
              </h3>
              <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Present</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Absent</span>
                 </div>
              </div>
           </div>
           
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Bar dataKey="present" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="absent" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
           </div>
           
           <div className="mt-8 p-4 bg-blue-50 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black text-blue-700/60 uppercase tracking-widest leading-none">Attendance Rate</div>
                <div className="text-2xl font-black text-blue-700 mt-1">
                  {totalStaff > 0 ? Math.round(((presentCount + lateCount) / totalStaff) * 100) : 0}%
                </div>
              </div>
              <Activity className="w-10 h-10 text-blue-200" />
           </div>
        </div>

        {/* Staff List & Table */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight">Staff Roster</h3>
                      <p className="text-xs font-bold text-slate-400">Total {totalStaff} active members</p>
                    </div>
                 </div>
                 <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                       <input 
                         type="text" 
                         placeholder="Search staff..."
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                       />
                    </div>
                    <select 
                      value={roleFilter} 
                      onChange={e => setRoleFilter(e.target.value)}
                      className="text-xs font-bold bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 px-3 py-2 rounded-lg outline-none focus:border-blue-500 dark:focus:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                       <option value="all">All Roles</option>
                       <option value="admin">Admin</option>
                       <option value="therapist">Therapist</option>
                       <option value="manager">Manager</option>
                    </select>
                    <select 
                      value={statusFilter} 
                      onChange={e => setStatusFilter(e.target.value)}
                      className="text-xs font-bold bg-white border border-slate-200 px-3 py-2 rounded-lg outline-none focus:border-blue-500 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                       <option value="all">All Status</option>
                       <option value="present">Present/Late</option>
                       <option value="absent">Absent</option>
                       <option value="unmarked">Unmarked</option>
                    </select>
                 </div>
              </div>

              <div className="p-4 bg-white">
                 <div className="space-y-3">
                    {visibleMembers.map(member => {
                      const record = attendance.find(a => a.memberId === member.id);
                      const isSelf = member.email === currentUserEmail;
                      const canMark = role === 'admin' || isSelf;

                      return (
                        <div key={member.id} className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-black text-slate-500 shadow-inner border border-white">
                                  {member.name.split(' ').map((n:any)=>n[0]).join('').substring(0,2).toUpperCase()}
                                </div>
                                <div className={cn(
                                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white",
                                  record ? (record.status === 'absent' ? "bg-rose-500" : "bg-emerald-500") : "bg-slate-300"
                                )}></div>
                              </div>
                              <div>
                                 <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-black text-slate-800">{member.name}</h4>
                                    {isSelf && <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded tracking-widest shadow-sm">YOU</span>}
                                 </div>
                                 <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{member.staffId || 'FR-XXXX'}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="text-[10px] font-black text-blue-600/70 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-widest">{member.role}</span>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex flex-wrap items-center gap-4">
                              <div className="flex items-center gap-4 border-l border-slate-100 sm:pl-4">
                                 {record ? (
                                   <div className="flex items-center gap-3">
                                      <div className="text-right">
                                         <div className={cn(
                                           "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                           record.status === 'present' ? "bg-emerald-50 text-emerald-600" :
                                           record.status === 'late' ? "bg-amber-50 text-amber-600" :
                                           "bg-rose-50 text-rose-600"
                                         )}>
                                           {record.status}
                                         </div>
                                         <div className="text-[10px] font-bold text-slate-400 mt-0.5">Logged: {record.checkIn || '--:--'}</div>
                                      </div>
                                   </div>
                                 ) : (
                                   <div className="flex items-center gap-2 text-slate-400">
                                      <Clock className="w-4 h-4" />
                                      <span className="text-xs font-bold italic">Not marked</span>
                                   </div>
                                 )}
                              </div>

                              <div className="flex items-center gap-2 ml-auto sm:ml-0">
                                 {canMark && !record ? (
                                   <div className="flex items-center gap-2">
                                      <button 
                                        onClick={() => markAttendance(member, 'present')} 
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-100 flex items-center gap-1.5"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                                      </button>
                                      <button 
                                        onClick={() => markAttendance(member, 'absent')} 
                                        className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all"
                                      >
                                        <X className="w-3.5 h-3.5" /> Absent
                                      </button>
                                   </div>
                                 ) : record ? (
                                   <div className="p-2 bg-slate-50 text-slate-400 rounded-lg border border-slate-200">
                                      <CheckCircle2 className="w-5 h-5 text-slate-300" />
                                   </div>
                                 ) : (
                                   <span className="text-[10px] font-bold text-slate-300 italic">Restricted</span>
                                 )}
                              </div>
                           </div>
                        </div>
                      );
                    })}
                    {visibleMembers.length === 0 && (
                      <div className="py-12 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                         <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 mx-auto mb-4">
                           <Users className="w-6 h-6 text-slate-300" />
                         </div>
                         <h4 className="text-sm font-black text-slate-800">No staff members found</h4>
                         <p className="text-xs font-bold text-slate-400 mt-1">Try adjusting your filters or search term</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>

           {/* Quick Toggle / Settings Area */}
           <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full -ml-32 -mt-32"></div>
              <div className="relative z-10">
                 <h4 className="text-lg font-black tracking-tight">Need Attendance History?</h4>
                 <p className="text-slate-400 text-xs font-medium mt-1">View past records, monthly summaries, and detailed reports.</p>
              </div>
              <button 
                onClick={() => setHistoryTab(!historyTab)}
                className="relative z-10 px-6 py-3 bg-white text-slate-900 rounded-xl font-bold transition-all hover:bg-blue-50 shadow-lg shadow-white/5 flex items-center gap-2"
              >
                {historyTab ? 'Back to Dashboard' : 'View Full History'} <History className="w-5 h-5" />
              </button>
           </div>
        </div>
      </div>

      {/* History & Detailed Report Tab */}
      {historyTab && (
        <div className="animate-in slide-in-from-bottom-8 duration-500 pt-8 border-t border-slate-200">
           <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/30">
                 <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                      <History className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight">Monthly Logs</h3>
                      <p className="text-xs font-bold text-slate-400">Detailed attendance trail for all staff members</p>
                    </div>
                 </div>
                 <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                       <input 
                         type="date" 
                         value={historyRange.start}
                         onChange={e => setHistoryRange({...historyRange, start: e.target.value})}
                         className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 outline-none"
                       />
                       <span className="text-slate-400 text-xs">-</span>
                       <input 
                         type="date" 
                         value={historyRange.end}
                         onChange={e => setHistoryRange({...historyRange, end: e.target.value})}
                         className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-bold text-slate-700 outline-none"
                       />
                    </div>
                    <button className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                       <Filter className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              
              <div className="overflow-x-auto w-full">
                 <table className="w-full text-left border-collapse min-w-full md:min-w-[800px]">
                    <thead className="hidden md:table-header-group bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                       <tr>
                          <th className="px-8 py-4">Date</th>
                          <th className="px-8 py-4">Staff Member</th>
                          <th className="px-8 py-4">Status</th>
                          <th className="px-8 py-4">Check-In</th>
                          <th className="px-8 py-4 text-right">Remarks</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 block md:table-row-group">
                       {rangeAttendance.slice().reverse().map((record, idx) => (
                         <tr key={record.id || idx} className="hover:bg-slate-50/50 transition-colors block md:table-row pb-4 md:pb-0 pt-2 md:pt-0 border-b border-slate-100 md:border-none relative">
                            <td className="px-4 md:px-8 py-2 md:py-5 text-sm font-bold text-slate-700 block md:table-cell md:border-none">
                               <div className="flex md:block items-center justify-between">
                                 <span>{new Date(record.date).toLocaleDateString('en-GB')}</span>
                                 <span className="md:hidden text-xs font-mono text-slate-500 font-bold">{record.checkIn || '--:--'}</span>
                               </div>
                            </td>
                            <td className="px-4 md:px-8 py-2 md:py-5 block md:table-cell md:border-none">
                               <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                                     {record.memberName.split(' ').map((n:any)=>n[0]).join('').substring(0,2).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-black text-slate-800">{record.memberName}</span>
                               </div>
                            </td>
                            <td className="px-4 py-2 md:px-8 md:py-5 block md:table-cell border-none md:ml-12">
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest md:hidden">Status:</span>
                                  <div className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                    record.status === 'present' ? "bg-emerald-50 text-emerald-600" :
                                    record.status === 'late' ? "bg-amber-50 text-amber-600" :
                                    "bg-rose-50 text-rose-600"
                                  )}>
                                    {record.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                                    {record.status === 'late' && <AlertCircle className="w-3 h-3" />}
                                    {record.status === 'absent' && <XCircle className="w-3 h-3" />}
                                    {record.status}
                                  </div>
                               </div>
                            </td>
                            <td className="hidden md:table-cell px-8 py-5 text-sm font-mono text-slate-500 font-bold">
                               {record.checkIn || '--:--'}
                            </td>
                            <td className="px-4 py-2 md:px-8 md:py-5 md:text-right text-xs font-bold text-slate-400 block md:table-cell md:ml-12">
                               {record.status === 'late' ? 'Morning threshold crossed' : 'Self Logged'}
                            </td>
                         </tr>
                       ))}
                       {rangeAttendance.length === 0 && (
                         <tr className="block md:table-row">
                            <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold italic block md:table-cell">No records found for the selected range.</td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const Login = ({ onDemoLogin }: { onDemoLogin: (role: 'admin' | 'manager' | 'therapist') => void }) => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'therapist'>('therapist');
  const [identifier, setIdentifier] = useState(localStorage.getItem('fitrevive_remember_email') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('fitrevive_remember_email'));
  const [error, setError] = useState<{ message: string; type: 'error' | 'warning' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Auto-logout after inactivity (30 mins)
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (auth.currentUser) auth.signOut();
      }, 30 * 60 * 1000);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      clearTimeout(timeout);
    };
  }, []);

  const handleForgotPassword = async () => {
    if (!identifier) {
      setError({ message: 'Enter your ID/Email first to find your account.', type: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const memberData = await checkMemberAuthorization(identifier);
      if (!memberData || !memberData.email) {
        throw new Error('No registered email found for this account.');
      }

      await resetPassword(memberData.email);
      setError({ message: `Reset link sent to ${memberData.email}. Check your inbox.`, type: 'warning' });
    } catch (err: any) {
      setError({ message: err.message || 'Failed to send reset link.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!identifier || !password) {
      setError({ message: 'Please enter your ID/Email and password.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const emailInput = identifier.trim().toLowerCase();
      const passwordInput = password.trim();

      console.log("Attempting login for:", emailInput, "Role:", selectedRole, "Password length:", passwordInput.length);

      // --- DEMO BYPASS (for testing ease) ---
      if ((emailInput === 'admin' || emailInput === 'manager' || emailInput === 'therapist') && 
          passwordInput === emailInput) {
         console.log("Using demo bypass for:", emailInput);
         onDemoLogin(emailInput as any);
         return;
      }
      
      const memberData = await checkMemberAuthorization(emailInput);
      console.log("Member lookup result:", memberData ? "Found" : "Not Found");
      
      if (!memberData) {
        throw new Error('Account not found. Please verify your Staff ID or Email.');
      }

      // Check role mismatch early but with better feedback
      const normalizedRole = memberData.role.toLowerCase();
      if (normalizedRole !== selectedRole) {
        console.warn(`Role mismatch: expected ${selectedRole}, found ${normalizedRole}`);
        throw new Error(`Account Role Mismatch: This account (${emailInput}) is registered as a ${normalizedRole}. Please select "${normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)}" in the role selector above and try again.`);
      }

      if (memberData.isActive === false) {
        throw new Error('Account is inactive. Please contact your administrator.');
      }

      console.log("Initiating Auth sign-in for:", memberData.email);
      try {
        await signInWithEmail(memberData.email, passwordInput);
      } catch (authErr: any) {
        console.error("Firebase Auth Error:", authErr.code, authErr.message);
        
        if (memberData.password === 'GOOGLE_AUTH') {
           throw new Error("This account is set up for Google Sign-In only. Click 'Continue with Google' instead.");
        }
        
        const isCredentialErr = authErr.code === 'auth/user-not-found' || 
                               authErr.code === 'auth/invalid-credential' || 
                               authErr.code === 'auth/wrong-password';

        // SYNC ATTEMPT: If Firestore has the password (source of truth) but Auth fails
        if (isCredentialErr && memberData.password && memberData.password === passwordInput) {
          console.log("Triggering Account Sync...");
          try {
            await saveTeamMember({
              name: memberData.name,
              role: memberData.role,
              phone: memberData.phone || '',
              email: memberData.email,
              password: passwordInput
            });
            // Try one last time
            await signInWithEmail(memberData.email, passwordInput);
          } catch (syncErr: any) {
            console.error("Sync final attempt failed:", syncErr);
            throw new Error("Login failed (Invalid Credentials). If you forgot your password, please click 'Forgot Password'.");
          }
        } else if (authErr.code === 'auth/invalid-credential' || authErr.code === 'auth/wrong-password') {
          throw new Error("Incorrect password. Please verify your password or use 'Forgot Password' to reset it.");
        } else {
          throw authErr;
        }
      }
      
      if (rememberMe) {
        localStorage.setItem('fitrevive_remember_email', identifier);
      } else {
        localStorage.removeItem('fitrevive_remember_email');
      }

      try {
        await updateTeamMember(memberData.id, { lastLogin: new Date().toISOString() });
      } catch (updateErr) {
        console.error("Failed to update last login time:", updateErr);
      }
    } catch (err: any) {
      console.error("Login component error:", err);
      let errMsg = "Invalid credentials. Please check your role and password.";
      
      // Standardizing error messages
      const code = err.code || "";
      const message = err.message || "";

      if (message.includes('Account not found')) {
        errMsg = "Account not found in our records. Please verify your Staff ID or Email.";
      } else if (message.includes('Incorrect role')) {
        errMsg = message;
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential' || message.includes('auth/invalid-credential')) {
        errMsg = "Incorrect password. Please try again or click Forgot Password to reset it.";
      } else if (code === 'auth/user-not-found') {
        errMsg = "No account found with this email. Please contact your administrator.";
      } else if (code === 'auth/too-many-requests') {
        errMsg = "Too many failed attempts. Your account is temporarily locked for security. Please try again in a few minutes.";
      } else if (code === 'auth/network-request-failed') {
        errMsg = "Network error. Please check your internet connection.";
      } else {
        errMsg = message || "An unexpected error occurred. Please try again.";
      }
      
      setError({ message: errMsg, type: 'error' });
      setLoading(false);
    }
  };

  const handleDemo = (role: 'admin' | 'manager' | 'therapist') => {
    setSelectedRole(role);
    setIdentifier(role);
    setPassword(role);
    // Directly trigger demo login after a short delay to show the effect
    setTimeout(() => onDemoLogin(role), 500);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col items-center justify-center p-4 overflow-y-auto overflow-x-hidden z-50 relative w-full">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-100/50 rounded-full blur-3xl opacity-50" />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-[480px] w-full bg-white p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 z-10"
      >
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-24 h-24 mb-6 rounded-full overflow-hidden border border-slate-100 shadow-sm bg-white">
             <img src={LogoImage} alt="FitRevive Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-1">Welcome Back</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">FitRevive Portal</p>
        </div>

        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
              error.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
            }`}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold leading-tight">{error.message}</p>
              {error.message.includes('Account not found') && (
                <p className="text-[11px] mt-1 opacity-70">Hint: If this is a new setup, use <b>Google Login</b> first to register the clinic owner.</p>
              )}
            </div>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Role Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider pl-1">Sign in as</label>
            <div className="grid grid-cols-3 gap-2">
              {(['admin', 'manager', 'therapist'] as const).map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setSelectedRole(role)}
                  className={`py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                    selectedRole === role 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <User2 className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Staff ID or Email" 
                className="w-full pl-12 pr-5 py-4 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                className="w-full pl-12 pr-14 py-4 bg-slate-50/50 border-2 border-slate-50 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-600 transition-all" 
              />
              <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">Remember Me</span>
            </label>
            <button 
              type="button" 
              onClick={handleForgotPassword}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-all"
            >
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-[0.15em] py-5 rounded-2xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
          >
            {loading ? (
              <Activity className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Secure Sign In</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
           <button 
             onClick={() => setError({ message: "For login assistance, please contact system admin at admin@fitrevive.com or visit the reception.", type: 'warning' })}
             className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-all flex items-center gap-2 mx-auto group"
           >
             <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
             Need help? Contact Admin
           </button>
        </div>
      </motion.div>
      
      <div className="mt-12 text-center flex flex-col items-center z-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">© 2026 FitRevive Systems</p>
      </div>
    </div>
  );
};
const ROLE_PERMISSIONS = {
  admin: ['dashboard', 'appointments', 'patients', 'finances', 'attendance', 'team', 'reports', 'sessions'],
  manager: ['dashboard', 'appointments', 'patients', 'finances', 'attendance'],
  therapist: ['dashboard', 'patients', 'attendance', 'sessions']
} as const;

const SettingsView = ({ user, role, patients, transactions, appointments, members, onNotify, onLogout }: { user: User, role: string, patients: any[], transactions: any[], appointments: any[], members: any[], onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void, onLogout: () => void }) => {
  const [activeCategory, setActiveCategory] = useState<'account'|'clinic'|'appearance'|'notifications'|'security'|'billing'>('account');
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [clinicName, setClinicName] = useState('Nirvana Physiotherapy');
  const [clinicEmail, setClinicEmail] = useState('contact@nirvanaphysio.com');
  const [clinicPhone, setClinicPhone] = useState('+1 (555) 123-4567');
  const [clinicCurrency, setClinicCurrency] = useState('USD');
  const [clinicAddress, setClinicAddress] = useState('Nalbari, bangaon, Barnardi rode,781303');

  // Preferences state
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Notification State
  const [pushEnabled, setPushEnabled] = useState(localStorage.getItem('push_enabled') !== 'false');
  const [emailAlerts, setEmailAlerts] = useState(localStorage.getItem('email_alerts') !== 'false');
  const [smsAlerts, setSmsAlerts] = useState(localStorage.getItem('sms_alerts') === 'true');


  useEffect(() => {
     const fetchSettings = async () => {
        try {
           const docSnap = await getDoc(doc(db, 'settings', 'clinic'));
           if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.clinicName) setClinicName(data.clinicName);
              if (data.clinicEmail) setClinicEmail(data.clinicEmail);
              if (data.clinicPhone) setClinicPhone(data.clinicPhone);
              if (data.clinicCurrency) setClinicCurrency(data.clinicCurrency);
              if (data.clinicAddress) setClinicAddress(data.clinicAddress);
           }
        } catch(err) {
           console.error("Failed to load clinic settings", err);
        }
     };
     fetchSettings();
  }, []);

  const categories = [
    { id: 'account', label: 'Profile & Account', icon: User2, allowed: ['admin', 'manager', 'therapist'] },
    { id: 'clinic', label: 'Clinic Information', icon: Building2, allowed: ['admin', 'manager', 'therapist'] },
    { id: 'appearance', label: 'Appearance', icon: Palette, allowed: ['admin', 'manager', 'therapist'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, allowed: ['admin', 'manager', 'therapist'] },
    { id: 'security', label: 'Security & Data', icon: ShieldCheck, allowed: ['admin', 'manager', 'therapist'] },
  ];

  const visibleCategories = categories.filter(c => c.allowed.includes(role));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName });
      onNotify("Profile updated successfully", "success");
    } catch (error: any) {
      onNotify(error.message || "Failed to update profile", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClinic = async () => {
    try {
       await setDoc(doc(db, 'settings', 'clinic'), {
          clinicName,
          clinicEmail,
          clinicPhone,
          clinicCurrency,
          clinicAddress,
          updatedAt: new Date().toISOString()
       }, { merge: true });
       onNotify("Clinic configuration saved.", "success");
    } catch(err) {
       onNotify("Failed to save clinic configuration.", "error");
    }
  };

  const handleBackupDatabase = () => {
     const backup = { patients, transactions, appointments, members, exportedAt: new Date().toISOString() };
     const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
     const downloadAnchorNode = document.createElement('a');
     downloadAnchorNode.setAttribute("href", dataStr);
     downloadAnchorNode.setAttribute("download", `fitrevive_backup_${new Date().toISOString().split('T')[0]}.json`);
     document.body.appendChild(downloadAnchorNode);
     downloadAnchorNode.click();
     downloadAnchorNode.remove();
     onNotify("Database backup generated.", "success");
  }

  const handleThemeToggle = (newTheme: string) => {
     setTheme(newTheme);
     localStorage.setItem('theme', newTheme);
     if (newTheme === 'dark') {
         document.documentElement.classList.add('dark');
         onNotify("Dark mode preferred", "success");
     } else {
         document.documentElement.classList.remove('dark');
         onNotify("Light mode preferred", "success");
     }
  }

  const handlePushToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const val = e.target.checked;
     if (val) {
        if (!("Notification" in window)) {
           onNotify("Browser does not support notifications", "error"); return;
        }
        if (Notification.permission === "granted") {
           setPushEnabled(true); localStorage.setItem('push_enabled', 'true');
           onNotify("Push notifications enabled", "success");
        } else if (Notification.permission !== "denied") {
           const permission = await Notification.requestPermission();
           if (permission === "granted") {
              setPushEnabled(true); localStorage.setItem('push_enabled', 'true');
              onNotify("Push notifications enabled", "success");
           } else {
              setPushEnabled(false); onNotify("Notification permission denied", "error");
           }
        } else {
           setPushEnabled(false); onNotify("Enable notifications in browser settings", "error");
        }
     } else {
        setPushEnabled(false); localStorage.setItem('push_enabled', 'false');
        onNotify("Push notifications disabled", "success");
     }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 max-w-5xl mx-auto">
      <header className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 transition-colors">
        <div>
           <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Settings Workspace</h1>
           <p className="text-sm font-bold tracking-tight text-slate-400 dark:text-slate-500 mt-1">Manage your account, preferences, and clinic system</p>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-8 items-start">
         <div className="w-full md:w-64 shrink-0 flex flex-row overflow-x-auto md:flex-col gap-1 pb-2 md:pb-0 custom-scrollbar hide-scrollbar">
            {visibleCategories.map(cat => (
               <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={cn(
                     "group flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all md:text-left whitespace-nowrap",
                     activeCategory === cat.id 
                        ? "bg-blue-600 dark:bg-slate-800 text-white shadow-lg shadow-blue-200 dark:shadow-slate-900/50" 
                        : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                  )}
               >
                  <cat.icon className={cn("w-4 h-4 shrink-0 transition-colors", activeCategory === cat.id ? "text-white dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-slate-300")} />
                  <span className="hidden sm:inline">{cat.label}</span>
               </button>
            ))}
         </div>

         <div className="flex-1 w-full bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[600px] transition-colors">
           {activeCategory === 'account' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Account Profile</h2>
                  <p className="text-sm text-slate-500 font-medium">Update your personal information and roles.</p>
               </div>
               <div className="p-6">
                  <form onSubmit={handleSaveProfile} className="space-y-6 max-w-lg">
                     <div className="flex items-center gap-4 mb-6">
                       <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-black shrink-0">
                         {displayName.charAt(0) || user.email?.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <div className="font-bold text-slate-800 dark:text-slate-200">Profile Initial</div>
                         <div className="text-xs text-slate-500 font-medium">Used for avatars across the system.</div>
                       </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Full Name</label>
                        <input 
                           type="text" 
                           value={displayName}
                           onChange={(e) => setDisplayName(e.target.value)}
                           className="w-full text-sm font-semibold bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-500 focus:border-transparent transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                           placeholder="John Doe"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">System Email</label>
                        <input 
                           type="text" 
                           value={user.email || ''}
                           disabled
                           className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3.5 outline-none cursor-not-allowed opacity-70 text-slate-700 dark:text-slate-400" 
                        />
                     </div>
                     <div className="space-y-1.5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/30">
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Role</div>
                        <div className="text-sm font-black text-slate-800 dark:text-slate-200 capitalize mt-1 flex items-center gap-2">
                           <ShieldCheck className="w-4 h-4 text-emerald-500"/> {role}
                        </div>
                     </div>
                     <div className="pt-4 flex items-center gap-4">
                        <button 
                           type="submit"
                           disabled={isSaving}
                           className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                           {isSaving ? 'Updating...' : 'Save Changes'}
                        </button>
                     </div>
                  </form>
               </div>
               <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-rose-50/30 dark:bg-rose-900/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-rose-800 dark:text-rose-400">Sign Out</h3>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">End your current session securely.</p>
                  </div>
                  <button 
                     onClick={onLogout}
                     className="bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/30 font-bold py-2.5 px-5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-sm"
                  >
                     <LogOut className="w-4 h-4" /> Log Out
                  </button>
               </div>
             </div>
           )}

           {activeCategory === 'clinic' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Clinic Information</h2>
                  <p className="text-sm text-slate-500 font-medium">Update public and operational details for the clinic.</p>
               </div>
               <div className="p-6 space-y-6 max-w-2xl">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Clinic Name</label>
                      <input type="text" disabled={role !== 'admin'} value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="w-full text-sm font-semibold bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900 transition-all text-slate-800 dark:text-slate-200 disabled:opacity-70 disabled:cursor-not-allowed" />
                   </div>
                   <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Address</label>
                      <input type="text" disabled={role !== 'admin'} value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} className="w-full text-sm font-semibold bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900 transition-all text-slate-800 dark:text-slate-200 disabled:opacity-70 disabled:cursor-not-allowed" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Currency</label>
                      <select disabled={role !== 'admin'} value={clinicCurrency} onChange={(e) => setClinicCurrency(e.target.value)} className="w-full text-sm font-semibold bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900 transition-all text-slate-800 dark:text-slate-200 appearance-none disabled:opacity-70 disabled:cursor-not-allowed">
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="AUD">AUD ($)</option>
                      </select>
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Support Email</label>
                      <input type="email" disabled={role !== 'admin'} value={clinicEmail} onChange={(e) => setClinicEmail(e.target.value)} className="w-full text-sm font-semibold bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900 transition-all text-slate-800 dark:text-slate-200 disabled:opacity-70 disabled:cursor-not-allowed" />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Primary Phone</label>
                      <input type="text" disabled={role !== 'admin'} value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className="w-full text-sm font-semibold bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-slate-900 transition-all text-slate-800 dark:text-slate-200 disabled:opacity-70 disabled:cursor-not-allowed" />
                   </div>
                 </div>
                 {role === 'admin' && (
                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex">
                     <button onClick={handleSaveClinic} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md">
                       Save Clinic Profile
                     </button>
                   </div>
                 )}
               </div>
             </div>
           )}

           {activeCategory === 'appearance' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Appearance & Behavior</h2>
                  <p className="text-sm text-slate-500 font-medium">Customize how FitRevive looks and feels on this device.</p>
               </div>
               <div className="p-6 space-y-8 max-w-2xl">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">Theme Mode</h4>
                       <p className="text-sm font-medium text-slate-500 mt-1">Light or dark interface</p>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-xl p-1 w-full sm:w-auto">
                       <button onClick={() => handleThemeToggle('light')} className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none flex items-center justify-center gap-2", theme === 'light' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200")}><Sun className="w-4 h-4"/> Light</button>
                       <button onClick={() => handleThemeToggle('dark')} className={cn("flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-sm transition-all focus:outline-none flex items-center justify-center gap-2", theme === 'dark' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200")}><Moon className="w-4 h-4"/> Dark</button>
                    </div>
                 </div>
               </div>
             </div>
           )}

           {activeCategory === 'notifications' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Notification Preferences</h2>
                  <p className="text-sm text-slate-500 font-medium">Control what alerts and messages you receive.</p>
               </div>
               <div className="p-6 space-y-6 max-w-2xl">
                 <div className="flex items-center justify-between group">
                    <div>
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">Push Notifications</h4>
                       <p className="text-sm font-medium text-slate-500 mt-1">Get alerts for new bookings and messages via browser.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={pushEnabled} onChange={handlePushToggle} />
                      <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 peer-checked:bg-blue-600"></div>
                    </label>
                 </div>
                 <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
                 <div className="flex items-center justify-between group">
                    <div>
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">Email Summaries</h4>
                       <p className="text-sm font-medium text-slate-500 mt-1">Daily workflow and revenue summaries delivered to your inbox.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={emailAlerts} onChange={() => {setEmailAlerts(!emailAlerts); localStorage.setItem('email_alerts', String(!emailAlerts)); onNotify("Email preferences updated", "success");}} />
                      <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 peer-checked:bg-slate-900 dark:peer-checked:bg-blue-600"></div>
                    </label>
                 </div>
                 <div className="w-full h-px bg-slate-100 dark:bg-slate-800"></div>
                 <div className="flex items-center justify-between group">
                    <div>
                       <h4 className="font-bold text-slate-800 dark:text-slate-200">SMS Alerts</h4>
                       <p className="text-sm font-medium text-slate-500 mt-1">Critical alerts sent directly to your phone.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="sr-only peer" checked={smsAlerts} onChange={() => {setSmsAlerts(!smsAlerts); localStorage.setItem('sms_alerts', String(!smsAlerts)); onNotify("SMS preferences updated", "success");}} />
                      <div className="w-12 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:duration-300 peer-checked:bg-slate-900 dark:peer-checked:bg-blue-600"></div>
                    </label>
                 </div>
               </div>
             </div>
           )}

           {activeCategory === 'security' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">Security & Data</h2>
                  <p className="text-sm text-slate-500 font-medium">Protect your account and manage important system data.</p>
               </div>
               <div className="p-6 space-y-8 max-w-3xl">
                 <div>
                   <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Patient Data Management</h4>
                   <div className="grid grid-cols-1 gap-4">
                     <div className="p-5 border border-slate-200 dark:border-slate-700/50 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                            <DownloadCloud className="w-5 h-5" />
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200">Backup System Data</h4>
                          <p className="text-sm font-medium text-slate-500 mt-1 mb-4 sm:mb-0">Export all patients, bookings, and financial logs as JSON format for offline safe-keeping.</p>
                        </div>
                        <button onClick={handleBackupDatabase} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-all focus:outline-none whitespace-nowrap">Download Backup</button>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

         </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRoleLoading, setIsRoleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewTarget, setViewTarget] = useState<{type: 'patient' | 'appointment' | 'transaction', id: string} | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const [debouncedGlobalSearch, setDebouncedGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGlobalSearch(globalSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [globalSearch]);

  useEffect(() => {
    // Initialize theme from local storage
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activePatients: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0
  });

  const globalSearchResults = useMemo(() => {
    if (!debouncedGlobalSearch.trim()) return null;
    const term = debouncedGlobalSearch.toLowerCase().trim();
    
    const matchedPatients = patients.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.phone.includes(term) || 
      p.id.toLowerCase().includes(term) ||
      (p.condition && p.condition.toLowerCase().includes(term))
    ).slice(0, 3);
    
    const matchedBookings = appointments.filter(a => 
      a.patientName.toLowerCase().includes(term) || 
      (a.notes || '').toLowerCase().includes(term) ||
      (a.sessionType || '').toLowerCase().includes(term) ||
      a.id.toLowerCase().includes(term)
    ).slice(0, 3);
    
    const matchedBilling = transactions.filter(t => 
       (t.description || '').toLowerCase().includes(term) ||
       t.amount.toString().includes(term) ||
       (t.category || '').toLowerCase().includes(term) ||
       t.id.toLowerCase().includes(term) ||
       (t.patientId && patients.find(p => p.id === t.patientId)?.name.toLowerCase().includes(term))
    ).slice(0, 3);
    
    return { patients: matchedPatients, bookings: matchedBookings, billing: matchedBilling };
  }, [debouncedGlobalSearch, patients, appointments, transactions]);

  const [role, setRole] = useState<'admin' | 'manager' | 'therapist' | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 1200);
  };

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      // If we are in demo mode, don't let real Auth state changes overwrite our demo user
      if (isDemoMode) {
        setIsRoleLoading(false);
        setLoading(false);
        return;
      }

      try {
        if (u && u.email) {
          setIsRoleLoading(true);
          // Authenticated layer 1: Check Database record to verify access & status
          let memberData = await checkMemberAuthorization(u.email);
          
          // If no match found and it's a domain-specific email, try matching by prefix alone
          if (!memberData && u.email.endsWith('@fitrevive.clinic')) {
            const prefix = u.email.split('@')[0];
            memberData = await checkMemberAuthorization(prefix);
          }
          
          if (memberData) {
            if (!memberData.isActive) {
              auth.signOut();
              setUser(null);
              setRole(null);
              setIsRoleLoading(false);
              setLoading(false);
              return;
            }
            const normalizedRole = memberData.role.toLowerCase() as 'admin' | 'manager' | 'therapist';
            setRole(normalizedRole);
            
            // Validate current tab access
            if (!ROLE_PERMISSIONS[normalizedRole as keyof typeof ROLE_PERMISSIONS].includes(activeTab as any)) {
              setActiveTab('dashboard');
            }
          } else {
            // Whitelist for initial owner setup
            const email = u.email.toLowerCase();
            if (email === 'prasenjitkakati91@gmail.com' || email === 'admin@fitrevive.clinic' || email.includes('admin')) {
               setRole('admin');
               setActiveTab('dashboard');
               
               // Automatically create team record for first-time owner login
               try {
                 const existingAdmin = await checkMemberAuthorization(email);
                 if (!existingAdmin) {
                   await saveTeamMember({
                     name: u.displayName || 'Clinic Admin',
                     role: 'admin',
                     phone: u.phoneNumber || '',
                     email: email,
                     password: 'GOOGLE_AUTH' 
                   });
                   showNotification("Owner account initialized in clinic records.");
                 } else if (existingAdmin.password !== 'GOOGLE_AUTH' && email === 'admin@fitrevive.clinic') {
                    // Update legacy admin to GOOGLE_AUTH if they are clearly the owner
                    await updateTeamMember(existingAdmin.id, { password: 'GOOGLE_AUTH' });
                 }
               } catch (e) {
                 console.log("Owner record initialization error:", e);
               }
            } else {
               auth.signOut();
               showNotification('Access Denied: Your account is not registered in the clinician database.', 'error');
               setUser(null);
               setRole(null);
               setIsRoleLoading(false);
               setLoading(false);
               return;
            }
          }
          
          setUser(u);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (error) {
        console.error("Auth status change error:", error);
        setUser(null);
        setRole(null);
      } finally {
        setIsRoleLoading(false);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [isDemoMode]);

  useEffect(() => {
    if (!user) return;

    const unsubPatients = getPatients(setPatients);
    const unsubAppointments = getAppointments(setAppointments);
    const unsubTransactions = getTransactions(setTransactions);
    const unsubStats = fetchDashboardStats(setStats);
    const unsubMembers = getTeamMembers(setMembers);

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubTransactions();
      unsubStats();
      unsubMembers();
    };
  }, [user]);

  const handleDemoLogin = (roleAssigned: 'admin' | 'manager' | 'therapist') => {
    setIsDemoMode(true);
    setUser({ email: `${roleAssigned}@demo.clinic`, uid: `demo-${roleAssigned}-123`, displayName: `Demo ${roleAssigned}` } as any);
    setRole(roleAssigned);
    setActiveTab('dashboard');
  };

  if (loading || (user && !role && isRoleLoading)) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-white">
         <div className="w-24 h-24 mb-6 animate-pulse rounded-full overflow-hidden border border-slate-100 shadow-sm bg-white">
            <img src={LogoImage} alt="FitRevive Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
         </div>
         <p className="font-black text-slate-800 tracking-tighter text-xl">FITREVIVE OS</p>
         <p className="font-bold text-slate-400 text-xs mt-1 uppercase tracking-widest">Initializing Clinical Environment...</p>
      </div>
    );
  }

  if (!user || !role) return <Login onDemoLogin={handleDemoLogin} />;

  const todayDateStr = getLocalYMD();
  
  // Notification Counts
  // Appointments: Any unhandled (scheduled) appointments from today or the past
  const scheduledApptsCount = appointments.filter(a => a.status === 'scheduled' && a.date <= todayDateStr).length;
  // Finances: Number of pending unpaid sessions across all patients
  const pendingPaymentsCount = patients.reduce((acc, p) => acc + (p.unpaidSessionsCount || 0), 0);
  // Patients: Number of new patients registered today
  const newPatientsTodayCount = patients.filter(p => p.createdAt && (typeof p.createdAt === 'string' ? p.createdAt.startsWith(todayDateStr) : p.createdAt.toDate && p.createdAt.toDate().toISOString().substring(0, 10) === todayDateStr)).length;

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] overflow-x-hidden">
      <div className="print:hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          user={user} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          role={role}
          setRole={setRole}
          badges={{
            appointments: scheduledApptsCount,
            finances: pendingPaymentsCount,
            patients: newPatientsTodayCount
          }}
        />
        
        <main className={cn(
          "flex-1 min-h-[calc(100vh-80px)] md:min-h-screen pb-20 md:pb-0 transition-all duration-300",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        )}>
          {/* Global Top Search Bar */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm print:hidden px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between gap-4">
            
            {/* Mobile menu toggle & brand (only mobile) */}
            <div className="md:hidden flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden shrink-0">
                  <img src={LogoImage} alt="FitRevive" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                </div>
            </div>

            {/* Search Input Container */}
            <div className="relative flex-1 max-w-3xl mx-auto w-full">
              <div className="relative w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search patients, bookings, billing..."
                  value={globalSearch}
                  onChange={e => setGlobalSearch(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-full pl-11 pr-10 py-2.5 sm:py-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm focus:shadow-md"
                />
                {globalSearch && (
                  <button 
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              {/* Global Search Results Dropdown */}
              {globalSearch && globalSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-blue-900/10 border border-slate-100 dark:border-slate-800 z-50 overflow-hidden flex flex-col max-h-[75vh] sm:max-h-[65vh] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-slate-50/80 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Global Search Results</span>
                        <div className="flex gap-2">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                             {globalSearchResults.patients.length + globalSearchResults.bookings.length + globalSearchResults.billing.length} found
                          </span>
                        </div>
                    </div>
                    
                    <div className="overflow-y-auto custom-scrollbar">
                      {/* Patients Section */}
                      {globalSearchResults.patients.length > 0 && (
                        <div className="py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                          <div className="px-4 py-1.5 text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Patients</div>
                          {globalSearchResults.patients.map(p => (
                            <button key={p.id} onPointerDown={(e) => { e.preventDefault(); setActiveTab('patients'); setViewTarget({type: 'patient', id: p.id}); setGlobalSearch(''); setIsSidebarOpen(false); }} className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors group">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0 group-hover:scale-110 transition-transform">
                                   {p.name.charAt(0)}
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.name}</span>
                                   <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {p.phone}</span>
                                 </div>
                               </div>
                               <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Bookings Section */}
                      {globalSearchResults.bookings.length > 0 && (
                        <div className="py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                          <div className="px-4 py-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Bookings</div>
                          {globalSearchResults.bookings.map(a => (
                            <button key={a.id} onPointerDown={(e) => { e.preventDefault(); setActiveTab('appointments'); setViewTarget({type: 'appointment', id: a.id}); setGlobalSearch(''); setIsSidebarOpen(false); }} className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors group">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                   <CalendarCheck className="w-4 h-4" />
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{a.patientName}</span>
                                   <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium flex items-center gap-2">
                                     <span>{new Date(a.date).toLocaleDateString()}</span>
                                     <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                     <span>{a.time}</span>
                                   </span>
                                 </div>
                               </div>
                               <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700 uppercase translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">{a.status}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Billing Section */}
                      {globalSearchResults.billing.length > 0 && (
                        <div className="py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                          <div className="px-4 py-1.5 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest flex items-center gap-1.5"><CircleDollarSign className="w-3.5 h-3.5" /> Billing / Activity</div>
                          {globalSearchResults.billing.map(t => (
                            <button key={t.id} onPointerDown={(e) => { e.preventDefault(); setActiveTab('finances'); setViewTarget({type: 'transaction', id: t.id}); setGlobalSearch(''); setIsSidebarOpen(false); }} className="w-full text-left flex items-center justify-between px-4 py-3 hover:bg-rose-50/50 dark:hover:bg-rose-900/20 transition-colors group">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                   {t.type === 'income' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate max-w-[200px]">{t.description || t.category}</span>
                                   <span className="text-slate-500 dark:text-slate-400 text-[10px] font-medium flex items-center gap-2">
                                     <span>{new Date(t.date).toLocaleDateString()}</span>
                                   </span>
                                 </div>
                               </div>
                               <span className="font-black text-sm text-slate-800 dark:text-slate-200">₹{t.amount}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* No Results */}
                      {globalSearchResults.patients.length === 0 && globalSearchResults.bookings.length === 0 && globalSearchResults.billing.length === 0 && (
                        <div className="p-8 text-center flex flex-col items-center justify-center">
                           <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-3 text-slate-300 dark:text-slate-600">
                             <Search className="w-5 h-5" />
                           </div>
                           <h4 className="font-bold text-slate-700 dark:text-slate-200">No results found</h4>
                           <p className="text-xs font-medium text-slate-400 mt-1">Try adjusting your search criteria</p>
                        </div>
                      )}
                    </div>
                </div>
              )}
            </div>

            {/* Desktop right alignment spacer if needed */}
            <div className="hidden md:flex w-10 shrink-0"></div>
          </div>

          {/* Mobile Bottom Nav */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 px-2 py-2 flex justify-around items-center pb-safe print:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
             <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={cn("flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors", activeTab === 'dashboard' ? "text-blue-600 bg-blue-50" : "text-slate-400")}>
                <LayoutDashboard className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-bold">Home</span>
             </button>
             <button onClick={() => { setActiveTab('patients'); setIsSidebarOpen(false); }} className={cn("flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors", activeTab === 'patients' ? "text-blue-600 bg-blue-50" : "text-slate-400")}>
                <Users className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-bold">Patients</span>
             </button>
             <button onClick={() => { setActiveTab('appointments'); setIsSidebarOpen(false); }} className={cn("flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors relative", activeTab === 'appointments' ? "text-blue-600 bg-blue-50 dark:bg-blue-900/50" : "text-slate-400")}>
                <Calendar className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-bold">Bookings</span>
             </button>
             {role !== 'therapist' && (
               <button onClick={() => { setActiveTab('finances'); setIsSidebarOpen(false); }} className={cn("flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors relative", activeTab === 'finances' ? "text-blue-600 bg-blue-50 dark:bg-blue-900/50" : "text-slate-400")}>
                  <CircleDollarSign className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-bold">Billing</span>
               </button>
             )}
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={cn("flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors relative", isSidebarOpen ? "text-blue-600 bg-blue-50" : "text-slate-400")}>
                <Menu className="w-5 h-5 mb-1" />
                <span className="text-[9px] font-bold">More</span>
             </button>
          </div>

          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard stats={stats} transactions={transactions} appointments={appointments} patients={patients} members={members} role={role} setTab={setActiveTab} onNotify={showNotification} user={user!} onStatusUpdate={async (id, status) => { await updateAppointmentStatus(id, status); }} setViewTarget={setViewTarget} />}
            {activeTab === 'appointments' && role !== 'therapist' && <AppointmentManager appointments={appointments} patients={patients} members={members} onNotify={showNotification} viewTarget={viewTarget} setViewTarget={setViewTarget} />}
            {activeTab === 'patients' && <PatientManager patients={patients} appointments={appointments} transactions={transactions} onNotify={showNotification} role={role} viewTarget={viewTarget} setViewTarget={setViewTarget} setTab={setActiveTab} />}
            {activeTab === 'finances' && role !== 'therapist' && <FinanceTracker transactions={transactions} patients={patients} onNotify={showNotification} role={role} viewTarget={viewTarget} setViewTarget={setViewTarget} />}
            {activeTab === 'team' && role === 'admin' && <TeamManager role={role} members={members} onNotify={showNotification} />}
            {activeTab === 'attendance' && <AttendanceManager role={role} members={members} currentUserEmail={user?.email || null} onNotify={showNotification} />}
            {activeTab === 'sessions' && role !== 'manager' && <SessionManager appointments={appointments} onNotify={showNotification} />}
            {activeTab === 'reports' && role === 'admin' && <Reports stats={stats} transactions={transactions} appointments={appointments} patients={patients} members={members} onNotify={showNotification} />}
            {activeTab === 'settings' && <SettingsView user={user!} role={role} patients={patients} transactions={transactions} appointments={appointments} members={members} onNotify={showNotification} onLogout={logOut} />}
          </div>
        </main>
      </div>

      {/* Global Notifications */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[100] flex flex-col items-end gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
              className={cn(
                "w-full sm:w-auto px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border pointer-events-auto",
                n.type === 'success' ? "bg-white border-emerald-100 text-emerald-800" : "bg-white border-rose-100 text-rose-800"
              )}
            >
              {n.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <BadgeCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <X className="w-5 h-5" />
                </div>
              )}
              <span className="font-bold text-sm">{n.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
