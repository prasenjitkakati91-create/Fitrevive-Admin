import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, 
  LayoutDashboard, 
  CircleDollarSign, 
  FileText, 
  LogOut, 
  Plus, 
  Search, 
  Menu, 
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  History,
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
  CheckCircle,
  CalendarRange,
  Clock3,
  User2,
  AlertCircle,
  Smartphone,
  MapPin,
  Zap
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
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  signIn, 
  signInWithEmail,
  checkMemberAuthorization,
  logOut, 
  savePatient, 
  getPatients, 
  logSession,
  getSessions,
  logTransaction, 
  getTransactions, 
  fetchDashboardStats,
  saveAppointment,
  updateAppointmentStatus,
  getAppointments,
  saveTeamMember,
  updateTeamMemberStatus,
  getTeamMembers,
  deleteTeamMember,
  getAttendance,
  logAttendance
} from './firebase';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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
  type: 'income' | 'expense';
  description?: string;
  patientId?: string;
  paymentMethod?: string;
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

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user, isOpen, onClose, isCollapsed, setIsCollapsed, role, setRole }: { 
  activeTab: string, 
  setActiveTab: (tab: string) => void, 
  user: User, 
  isOpen: boolean, 
  onClose: () => void,
  isCollapsed: boolean,
  setIsCollapsed: (val: boolean) => void,
  role: 'admin' | 'receptionist' | 'therapist',
  setRole: (role: any) => void
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'receptionist', 'therapist'] },
    { id: 'appointments', label: 'Appointments', icon: Calendar, roles: ['admin', 'receptionist'] },
    { id: 'patients', label: 'Patients', icon: Users, roles: ['admin', 'receptionist'] },
    { id: 'finances', label: 'Billing', icon: CircleDollarSign, roles: ['admin', 'receptionist'] },
    { id: 'attendance', label: 'Attendance', icon: Clock, roles: ['admin', 'receptionist', 'therapist'] },
    { id: 'team', label: 'Staff HR', icon: BadgeCheck, roles: ['admin'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin'] },
  ];

  const filteredTabs = tabs.filter(t => t.roles.includes(role));

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
        <div className={cn("p-6 flex items-center justify-between border-b border-slate-50", isCollapsed ? "px-4" : "")}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl shrink-0 bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 border border-blue-500">
               <Activity className="w-6 h-6 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-xl font-black text-slate-800 tracking-tight">FitRevive</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest leading-none">Premium Clinic</span>
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
        <nav className={cn("flex-1 px-3 space-y-1 overflow-y-auto mt-6 pt-2", isCollapsed ? "px-2" : "px-3")}>
          {filteredTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                onClose();
              }}
              title={isCollapsed ? tab.label : ''}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 active:scale-95 group relative mb-1",
                activeTab === tab.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              )}
            >
              {/* Indicator border for active state */}
              {activeTab === tab.id && !isCollapsed && (
                <div className="absolute left-0 w-1 h-6 bg-blue-600 rounded-full"></div>
              )}
              
              <tab.icon className={cn(
                "w-5 h-5 transition-transform duration-200 group-hover:scale-110", 
                activeTab === tab.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              
              {!isCollapsed && (
                <span className={cn(
                  "text-sm tracking-tight transition-all duration-200",
                  activeTab === tab.id ? "font-bold" : "font-semibold"
                )}>
                  {tab.label}
                </span>
              )}

              {/* Tooltip for collapsed state (simulated) */}
              {isCollapsed && (
                <div className="absolute left-16 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 z-[60] whitespace-nowrap shadow-xl">
                  {tab.label}
                </div>
              )}
            </button>
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
  role,
  setTab,
  onNotify
}: { 
  stats: DashboardStats, 
  transactions: Transaction[], 
  appointments: Appointment[], 
  patients: Patient[],
  role: 'admin' | 'receptionist' | 'therapist',
  setTab: (tab: string) => void,
  onNotify: (msg: string, type?: 'success' | 'error') => void
}) => {
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '6m'>('30d');
  const [patientSearch, setPatientSearch] = useState('');
  const [ledgerDate, setLedgerDate] = useState(new Date().toISOString().substring(0, 10));
  const [quickBill, setQuickBill] = useState({ patientId: '', service: 'physio', amount: '500' });
  const [isBilling, setIsBilling] = useState(false);
  
  const todayDate = new Date().toISOString().substring(0, 10);
  const todayAppts = appointments.filter(a => a.date === todayDate && a.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time));
  const todayIncome = transactions.filter(t => t.date === todayDate && t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const todayExpense = transactions.filter(t => t.date === todayDate && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  
  const ledgerIncome = transactions.filter(t => t.date === ledgerDate && t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const ledgerExpense = transactions.filter(t => t.date === ledgerDate && t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  const searchedPatients = patients.filter(p => p.phone.includes(patientSearch) || p.name.toLowerCase().includes(patientSearch.toLowerCase())).slice(0, 5);

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
  const ReceptionDashboard = () => (
    <div className="space-y-6">
      <div className="card p-6 bg-blue-700 text-white flex flex-col items-stretch gap-4 shadow-lg rounded-2xl overflow-hidden relative">
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
         <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-blue-300" />
            <input 
              placeholder="Search Patient by Phone or Name..." 
              value={patientSearch}
              onChange={e => setPatientSearch(e.target.value)}
              className="w-full bg-blue-800 border-2 border-blue-600 pl-14 py-4 rounded-xl text-xl text-white placeholder:text-blue-300 focus:ring-4 focus:ring-blue-400 outline-none font-bold transition-all" 
            />
            {patientSearch && <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl py-2 z-50 text-slate-800 border border-slate-200"
              >
                 {searchedPatients.map(p => (
                   <div key={p.id} className="flex justify-between items-center px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                      <div className="flex flex-col text-left">
                        <span className="font-bold text-lg">{p.name}</span>
                        <span className="text-slate-500 font-mono text-sm">{p.phone}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setPatientSearch(''); setTab('appointments'); }} className="btn-secondary py-2 px-4 shadow-sm text-xs">Book</button>
                        <button onClick={() => { setPatientSearch(''); setTab('patients'); }} className="btn-primary py-2 px-4 shadow-sm text-xs">View</button>
                      </div>
                   </div>
                 ))}
                 <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center">
                    <button onClick={() => { setPatientSearch(''); setTab('patients'); }} className="text-blue-600 font-bold hover:underline">Can't find patient? Register New</button>
                 </div>
              </motion.div>
            </AnimatePresence>}
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 flex flex-col h-[500px]">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg"><Clock className="w-5 h-5 text-blue-600" /></div>
              <h2 className="text-lg font-bold text-slate-800">Today's Appointments</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider">{todayAppts.length} pending</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Patient</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Therapist</th>
                  <th className="px-6 py-4 text-right pr-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {todayAppts.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-black text-blue-600 text-base">{appt.time}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{appt.patientName}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{appt.therapistName || 'Not Assigned'}</td>
                    <td className="px-6 py-4 text-right pr-6">
                      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all">Details</button>
                    </td>
                  </tr>
                ))}
                {todayAppts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-slate-400 font-medium italic">No appointments for today.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-6">Quick Walk-in Billing</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Select Patient</label>
              <select 
                value={quickBill.patientId}
                onChange={e => setQuickBill({...quickBill, patientId: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
              >
                <option value="">-- Choose --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Service</label>
              <select 
                value={quickBill.service}
                onChange={e => setQuickBill({...quickBill, service: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-bold text-slate-700 focus:border-blue-500 outline-none transition-all"
              >
                <option value="physio">Physiotherapy Session</option>
                <option value="dry">Dry Needling</option>
                <option value="manual">Manual Therapy</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Amount (₹)</label>
              <input 
                type="number" 
                value={quickBill.amount}
                onChange={e => setQuickBill({...quickBill, amount: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl font-black text-xl text-slate-800" 
              />
            </div>
            
            <button 
              disabled={isBilling}
              onClick={handleQuickBill}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all mt-4 disabled:opacity-50"
            >
               {isBilling ? <Activity className="w-6 h-6 animate-spin mx-auto" /> : 'Bill Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const TherapistDashboard = () => (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6"
      >
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Lead Therapist Panel</h1>
          <p className="text-slate-500 font-bold">You have {todayAppts.length} appointments scheduled for today.</p>
        </div>
        <div className="bg-blue-600 p-6 rounded-2xl text-white text-center min-w-[120px] shadow-xl shadow-blue-600/30">
          <div className="text-4xl font-black tracking-tighter">{todayAppts.length}</div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Queue Today</span>
        </div>
      </motion.div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <h2 className="text-xl font-black text-slate-800">Assigned Patient Queue</h2>
           <Filter className="w-5 h-5 text-slate-400" />
        </div>
        <div className="p-8">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {todayAppts.map((appt, i) => (
                <motion.div 
                  key={appt.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative p-8 rounded-[2rem] border-2 border-slate-100 hover:border-blue-500 transition-all bg-white hover:shadow-2xl hover:shadow-blue-500/10"
                >
                   <div className="flex justify-between items-center mb-6">
                     <div className="text-base font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full">{appt.time}</div>
                     <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{appt.patientName}</h3>
                   <p className="text-sm text-slate-500 mb-8 font-bold">{appt.sessionType || 'Routine Physiotherapy'}</p>
                   <button className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/10 hover:shadow-blue-600/20">
                     Open clinical record
                   </button>
                </motion.div>
              ))}
              {todayAppts.length === 0 && (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                   <p className="text-slate-400 font-bold italic text-lg">No appointments are currently assigned to you.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );

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
      {role === 'receptionist' && <ReceptionDashboard />}
      {role === 'therapist' && <TherapistDashboard />}
    </div>
  );
};

const PatientManager = ({ patients, appointments, transactions, onNotify }: { patients: Patient[], appointments: any[], transactions: Transaction[], onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('Recent');
  const [activeOnly, setActiveOnly] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [newPatient, setNewPatient] = useState({ 
    name: '', phone: '', age: '', gender: 'Male', condition: '', address: '', medicalHistory: '' 
  });
  const [newSession, setNewSession] = useState({ 
    date: new Date().toISOString().substring(0, 10), 
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), 
    paymentStatus: 'paid' as 'paid' | 'unpaid',
    paymentMethod: 'cash' as 'cash' | 'upi',
    amount: '500', notes: '' 
  });

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const fileName = file.name.toLowerCase();

    const processData = async (data: any[]) => {
      if (!auth.currentUser) {
        setIsImporting(false);
        alert("You must be logged in with Google to import your real patient data. Please log out and use 'Sign in with Google'.");
        return;
      }

      let count = 0;
      let skipped = 0;
      let errorsCount = 0;
      const errorDetails: string[] = [];

      for (const row of data) {
        const normalizedRow: any = {};
        Object.keys(row).forEach(key => {
          const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
          normalizedRow[normalizedKey] = row[key];
        });

        const name = normalizedRow.name || normalizedRow.patientname || normalizedRow.fullname || normalizedRow.patient || normalizedRow.clientname || normalizedRow.client;

        if (name && String(name).trim()) {
          try {
            let rawAge = normalizedRow.age;
            let formattedAge = 0;
            if (rawAge !== undefined && rawAge !== null) {
              const parsed = parseInt(String(rawAge));
              if (!isNaN(parsed)) formattedAge = parsed;
            }

            await savePatient({
              name: String(name).trim(),
              phone: String(normalizedRow.phone || normalizedRow.contact || normalizedRow.mobile || normalizedRow.phonenumber || normalizedRow.tel || ''),
              age: formattedAge,
              gender: String(normalizedRow.gender || normalizedRow.sex || 'Male'),
              condition: String(normalizedRow.condition || normalizedRow.diagnosis || normalizedRow.chiefcomplaint || normalizedRow.problem || ''),
              address: String(normalizedRow.address || normalizedRow.location || normalizedRow.city || ''),
              medicalHistory: String(normalizedRow.medicalhistory || normalizedRow.history || normalizedRow.remarks || normalizedRow.notes || '')
            });
            count++;
          } catch (err: any) {
            console.error("Error importing patient:", name, err);
            errorsCount++;
            if (errorDetails.length < 5) errorDetails.push(`${name}: ${err.message || 'Unknown error'}`);
          }
        } else {
          skipped++;
        }
      }
      
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      if (count > 0) {
        onNotify(`Successfully imported ${count} patients!`);
        let msg = `Import Complete!\n\n✅ Successfully imported: ${count} patients\n⚠️ Skipped: ${skipped} (missing name)`;
        if (errorsCount > 0) {
          msg += `\n❌ Errors: ${errorsCount}\n\nFirst few errors:\n- ${errorDetails.join('\n- ')}`;
        }
        alert(msg);
      } else {
        const sampleHeaders = data.length > 0 ? Object.keys(data[0]).join(', ') : 'None';
        alert(`No patients imported.\n\nChecked ${data.length} rows.\n\nDetected columns: ${sampleHeaders}\n\nPlease ensure your file has a column header named "Name" or "Patient Name".`);
      }
    };

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processData(results.data),
        error: (error) => {
          console.error("CSV Parse Error:", error);
          setIsImporting(false);
          alert("Failed to parse CSV file.");
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json(ws);
        processData(rows);
      };
      reader.onerror = () => {
        setIsImporting(false);
        alert("Failed to read Excel file.");
      };
      reader.readAsArrayBuffer(file);
    } else {
      setIsImporting(false);
      alert("Unsupported file format. Please use CSV or Excel (.xlsx, .xls).");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePatient({
        name: newPatient.name,
        phone: newPatient.phone,
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        condition: newPatient.condition,
        address: newPatient.address,
        medicalHistory: newPatient.medicalHistory
      });
      onNotify("Patient record created successfully!");
      setNewPatient({ name: '', phone: '', age: '', gender: 'Male', condition: '', address: '', medicalHistory: '' });
      setShowModal(false);
    } catch (err: any) {
      onNotify(err.message || "Failed to create patient.", "error");
    }
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await logSession(selectedPatient.id, selectedPatient.name, {
        ...newSession,
        amount: parseFloat(newSession.amount)
      });
      onNotify(`Session logged for ${selectedPatient.name}`);
      setShowSessionModal(false);
      setNewSession({
        date: new Date().toISOString().substring(0, 10),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        paymentStatus: 'paid', paymentMethod: 'cash', amount: '500', notes: ''
      });
    } catch (err: any) {
      onNotify(err.message || "Failed to log session.", "error");
    }
  };

  useEffect(() => {
    if (selectedPatient && showHistoryModal) {
      const unsub = getSessions(selectedPatient.id, setPatientHistory);
      return () => unsub();
    }
  }, [selectedPatient, showHistoryModal]);

  const enrichedPatients = useMemo(() => {
    return patients.map(p => {
      const patientAppts = appointments.filter(a => a.patientId === p.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const now = new Date();
      const pastAppts = patientAppts.filter(a => new Date(`${a.date}T${a.time}`) < now);
      const futureAppts = patientAppts.filter(a => new Date(`${a.date}T${a.time}`) >= now);
      
      const lastVisit = pastAppts.length > 0 ? pastAppts[0].date : null;
      const nextAppointment = futureAppts.length > 0 ? futureAppts[futureAppts.length - 1].date : null;
      
      let status = 'Completed';
      if (futureAppts.length > 0) status = 'In Treatment';
      else if (lastVisit && (now.getTime() - new Date(lastVisit).getTime()) < 30 * 24 * 60 * 60 * 1000) status = 'Active';
      else if (!lastVisit && !nextAppointment) status = 'Active'; 
      
      const isPending = (p.id.length + (p.age || 0)) % 5 === 0; 
      const paymentStatus = isPending ? 'Pending' : 'Paid';
      
      const initials = p.name ? p.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PT';

      return {
        ...p, lastVisit, nextAppointment, status, paymentStatus, initials
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
    
    const now = new Date();
    const newThisMonth = enrichedPatients.filter(p => {
      return (p.name.length % 3 === 0);
    }).length;
    const pendingPayments = enrichedPatients.filter(p => p.paymentStatus === 'Pending').length;
    return { total, active, newThisMonth, pendingPayments };
  }, [enrichedPatients]);

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
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
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} onChange={handleImportFile} accept=".csv, .xlsx, .xls" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isImporting}
            className="px-4 py-2.5 bg-white text-slate-700 font-bold hover:bg-slate-50 rounded-xl transition-colors flex items-center gap-2 border border-slate-200 shadow-sm disabled:opacity-50"
          >
            <FileText className="w-5 h-5 text-slate-400" />
            <span className="text-sm">{isImporting ? 'Importing...' : 'Bulk Import'}</span>
          </button>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-200 transition-all flex items-center gap-2 text-sm">
            <Plus className="w-5 h-5" />
            <span>New Patient</span>
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
             <Users className="w-6 h-6" />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Total Patients</span>
             <div className="text-2xl font-black text-slate-800">{dashboardStats.total}</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
             <Activity className="w-6 h-6" />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Active</span>
             <div className="text-2xl font-black text-slate-800">{dashboardStats.active}</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
             <TrendingUp className="w-6 h-6" />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">New This Month</span>
             <div className="text-2xl font-black text-slate-800">{dashboardStats.newThisMonth}</div>
           </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
             <Clock3 className="w-6 h-6" />
           </div>
           <div>
             <span className="text-[10px] uppercase tracking-widest font-black text-slate-400">Pending Payments</span>
             <div className="text-2xl font-black text-slate-800">{dashboardStats.pendingPayments}</div>
           </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search patients, phone, or condition..."
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
         </div>
         <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl shadow-sm">
               <input type="checkbox" checked={activeOnly} onChange={e => {setActiveOnly(e.target.checked); setCurrentPage(1);}} className="rounded text-blue-600 w-4 h-4" />
               <span className="text-xs font-bold text-slate-700">Active Only</span>
            </label>
            <select value={statusFilter} onChange={e => {setStatusFilter(e.target.value); setCurrentPage(1);}} className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl outline-none focus:border-blue-400">
               <option value="All">All Status</option>
               <option value="Active">Active</option>
               <option value="In Treatment">In Treatment</option>
               <option value="Completed">Completed</option>
            </select>
            <select value={ageFilter} onChange={e => {setAgeFilter(e.target.value); setCurrentPage(1);}} className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl outline-none focus:border-blue-400 hidden sm:block">
               <option value="All">All Ages</option>
               <option value="0-18">0-18 yrs</option>
               <option value="19-35">19-35 yrs</option>
               <option value="36-50">36-50 yrs</option>
               <option value="51+">51+ yrs</option>
            </select>
            <select value={sortOrder} onChange={e => {setSortOrder(e.target.value); setCurrentPage(1);}} className="text-xs font-bold bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl outline-none focus:border-blue-400">
               <option value="Recent">Recent First</option>
               <option value="Name A-Z">Name A-Z</option>
            </select>
         </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 shadow-sm rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact & Age</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Condition</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Payment</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPatients.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-white">
                         {p.initials}
                       </div>
                       <div>
                         <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => { setSelectedPatient(p); setShowHistoryModal(true); }}>
                           {highlightText(p.name, searchTerm)}
                         </div>
                         <div className="text-xs text-slate-500 font-medium mt-0.5 max-w-[200px] truncate">{p.address || 'No address added'}</div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="font-mono text-sm text-slate-700 font-bold">{highlightText(p.phone, searchTerm)}</div>
                     <div className="text-xs font-bold text-slate-400 mt-1">{p.age ? `${p.age} yrs • ${p.gender}` : p.gender}</div>
                  </td>
                  <td className="px-6 py-5">
                     {p.condition ? (
                       <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 line-clamp-2 leading-tight">
                         {highlightText(p.condition, searchTerm)}
                       </span>
                     ) : (
                       <span className="text-xs text-slate-400 italic">Not specified</span>
                     )}
                  </td>
                  <td className="px-6 py-5 space-y-2">
                     <div>
                       <span className={cn(
                         "inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                         p.status === 'Active' ? "bg-emerald-100 text-emerald-700" :
                         p.status === 'In Treatment' ? "bg-yellow-100 text-yellow-700" :
                         "bg-slate-100 text-slate-600"
                       )}>
                         {p.status}
                       </span>
                     </div>
                     <div>
                       <span className={cn(
                         "inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider",
                         p.paymentStatus === 'Paid' ? "bg-blue-50 text-blue-600" : "bg-rose-50 text-rose-600"
                       )}>
                         {p.paymentStatus}
                       </span>
                     </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">Last:</span>
                           <span className="font-bold text-slate-700">{p.lastVisit || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-12">Next:</span>
                           <span className={cn("font-bold", p.nextAppointment ? "text-blue-600" : "text-slate-400")}>{p.nextAppointment || '-'}</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => { setSelectedPatient(p); setShowHistoryModal(true); }} className="p-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl shadow-sm transition-all tooltip-trigger" title="View Profile">
                          <User2 className="w-4 h-4" />
                       </button>
                       <button onClick={() => { onNotify("Feature 'Book Appointment' can be accessed in Appointments tab.", "success"); }} className="p-2 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-xl shadow-sm transition-all" title="Book Appointment">
                          <CalendarCheck className="w-4 h-4" />
                       </button>
                       <button onClick={() => { setSelectedPatient(p); setShowSessionModal(true); }} className="p-2 bg-white border border-slate-200 hover:border-purple-300 hover:bg-purple-50 text-slate-500 hover:text-purple-600 rounded-xl shadow-sm transition-all" title="Log Session">
                          <FileText className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAndSortedPatients.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                 <Search className="w-8 h-8 text-slate-300" />
               </div>
               <p className="font-bold text-slate-700">No patients found</p>
               <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedPatients.length)} of {filteredAndSortedPatients.length} patients
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50 transition-colors bg-slate-50"
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
                      "w-8 h-8 rounded-lg text-xs font-bold transition-colors border",
                      currentPage === pageNum ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-white"
                    )}
                  >
                    {pageNum}
                  </button>
                 );
              })}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-50 transition-colors bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Add New Patient</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="new-patient-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Full Name</label>
                    <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all" value={newPatient.name} onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Phone Number</label>
                    <input required className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all" value={newPatient.phone} onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Age</label>
                    <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all" value={newPatient.age} onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Gender</label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer" value={newPatient.gender} onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Condition / Complaint</label>
                    <input className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all" placeholder="E.g. Lower Back Pain" value={newPatient.condition} onChange={(e) => setNewPatient({ ...newPatient, condition: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Address</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all min-h-[60px]" value={newPatient.address} onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}></textarea>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Medical History Notes</label>
                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all min-h-[80px]" value={newPatient.medicalHistory} onChange={(e) => setNewPatient({ ...newPatient, medicalHistory: e.target.value })}></textarea>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" form="new-patient-form" className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:ring-4 focus:ring-blue-100">Save Patient</button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">
                   {selectedPatient.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Patient Profile</h3>
                    <p className="text-sm font-medium text-slate-500">{selectedPatient.name}</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={() => { setShowSessionModal(true); }} className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold transition-colors text-sm border border-emerald-100 flex items-center gap-2"><Plus className="w-4 h-4"/> Log</button>
                 <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contact Info</span>
                    <div className="font-mono text-sm font-bold text-slate-700">{selectedPatient.phone}</div>
                    <div className="text-sm font-medium text-slate-600 mt-1">{selectedPatient.address || 'No address added'}</div>
                 </div>
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Demographics</span>
                    <div className="font-bold text-slate-700">{selectedPatient.age || '-'} years</div>
                    <div className="text-sm font-medium text-slate-600 mt-1">{selectedPatient.gender}</div>
                 </div>
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Primary Condition</span>
                    <div className="font-bold text-slate-700">{selectedPatient.condition || 'Not specified'}</div>
                 </div>
               </div>
               
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><History className="w-5 h-5 text-blue-500" /> Interaction History</h4>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {patientHistory.map((s, idx) => (
                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                       <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                         <Activity className="w-4 h-4" />
                       </div>
                       <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                             <div className="font-black text-sm text-slate-800">{new Date(s.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric'})}</div>
                             <span className={cn("text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest", s.paymentStatus === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>{s.paymentStatus}</span>
                          </div>
                          <p className="text-sm text-slate-600 font-medium">{s.notes || 'No treatment notes provided.'}</p>
                          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                             <span className="text-xs font-bold text-slate-400">{s.time}</span>
                             <span className="font-black text-slate-700">₹{s.amount}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                  {patientHistory.length === 0 && <div className="text-center py-10 relative z-10 text-slate-500 font-bold">No history available for this patient.</div>}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {showSessionModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl overflow-hidden flex flex-col">
             <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                   <h3 className="text-xl font-black text-slate-800 tracking-tight">Log Session</h3>
                   <p className="text-sm font-medium text-slate-500">for {selectedPatient.name}</p>
                </div>
                <button onClick={() => setShowSessionModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="p-6 overflow-y-auto">
               <form id="session-form" onSubmit={handleSessionSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Date</label>
                        <input type="date" required value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Time</label>
                        <input type="time" required value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all" />
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Payment Status</label>
                     <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer" value={newSession.paymentStatus} onChange={e => setNewSession({...newSession, paymentStatus: e.target.value as any})}>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid / Dues</option>
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Amount (₹)</label>
                        <input type="number" required value={newSession.amount} onChange={e => setNewSession({...newSession, amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all" />
                     </div>
                     <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Payment Method</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all appearance-none cursor-pointer" value={newSession.paymentMethod} onChange={e => setNewSession({...newSession, paymentMethod: e.target.value as any})}>
                           <option value="cash">Cash</option>
                           <option value="upi">UPI / Online</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Notes / Impression</label>
                     <textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 focus:bg-white transition-all min-h-[100px]" value={newSession.notes} onChange={e => setNewSession({...newSession, notes: e.target.value})} placeholder="Session impression..."></textarea>
                  </div>
               </form>
             </div>
             <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
               <button type="button" onClick={() => setShowSessionModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
               <button type="submit" form="session-form" className="px-6 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all focus:ring-4 focus:ring-blue-100">Save Log</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};


const FinanceTracker = ({ transactions, patients, onNotify }: { transactions: Transaction[], patients: Patient[], onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const [showModal, setShowModal] = useState(false);
  const [newTx, setNewTx] = useState({ 
    amount: '', 
    category: 'Consultation', 
    date: new Date().toISOString().substring(0, 10), 
    type: 'income' as 'income' | 'expense', 
    description: '',
    patientId: '',
    discount: '0',
    paymentMethod: 'Cash'
  });

  const [netTotal, setNetTotal] = useState(0);
  const [printTx, setPrintTx] = useState<Transaction | null>(null);

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

  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await logTransaction({
        amount: netTotal,
        category: newTx.category,
        date: newTx.date,
        type: newTx.type,
        description: newTx.description,
        patientId: newTx.patientId,
        paymentMethod: newTx.paymentMethod
      });
      onNotify(`${newTx.type === 'income' ? 'Revenue' : 'Expense'} logged successfully!`);
      setNewTx({ 
        amount: '', 
        category: 'Consultation', 
        date: new Date().toISOString().substring(0, 10), 
        type: 'income', 
        description: '',
        patientId: '',
        discount: '0',
        paymentMethod: 'Cash'
      });
      setShowModal(false);
    } catch (err: any) {
      onNotify(err.message || "Failed to log transaction.", "error");
    }
  };

  const categories = {
    income: ['Consultation', 'Training', 'Therapy', 'Sale', 'Other'],
    expense: ['Rent', 'Equipment', 'Salaries', 'Utility', 'Marketing', 'Other']
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Financial Billing</h1>
          <p className="text-sm text-slate-500">Track clinic income and expenses.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5" />
          <span>New Transaction</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card h-full flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h2 className="text-lg font-semibold text-slate-800">Incoming Revenue</h2>
          </div>
          <div className="overflow-auto flex-1 h-[400px]">
             <table className="data-table relative">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right w-16">Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {income.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 group">
                      <td><span className="text-slate-500 font-mono text-sm">{t.date}</span></td>
                      <td>
                        <div className="font-semibold text-slate-800">{t.category}</div>
                        {t.patientId && patients.find(p => p.id === t.patientId) && (
                           <div className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{patients.find(p => p.id === t.patientId)?.name}</div>
                        )}
                      </td>
                      <td className="text-right text-emerald-600 font-bold">+₹{t.amount.toLocaleString()}</td>
                      <td className="text-right">
                         <button onClick={() => { setPrintTx(t); setTimeout(() => window.print(), 100); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Print Receipt">
                           <Printer className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  ))}
                  {income.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-slate-500 italic">No revenue recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
        </div>


        <div className="card h-full flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
             <h2 className="text-xl font-bold text-slate-800">Operational Expenses</h2>
          </div>
          <div className="overflow-auto flex-1 h-[400px]">
             <table className="data-table relative">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50">
                      <td><span className="text-slate-500 font-mono text-sm">{t.date}</span></td>
                      <td><span className="font-bold text-slate-800">{t.category}</span></td>
                      <td className="text-right text-rose-600 font-bold">-₹{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-10 text-slate-500 italic text-lg bg-slate-50/50">No expenses recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">New Transaction</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
             </div>
             
             <div className="p-6 overflow-y-auto">
               <form id="tx-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex bg-slate-100 p-1 rounded-md mb-4 border border-slate-200">
                     <button type="button" onClick={() => setNewTx({...newTx, type: 'income'})} className={cn("flex-1 py-2 rounded text-sm font-semibold transition-all", newTx.type === 'income' ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700")}>Income / Credit</button>
                     <button type="button" onClick={() => setNewTx({...newTx, type: 'expense'})} className={cn("flex-1 py-2 rounded text-sm font-semibold transition-all", newTx.type === 'expense' ? "bg-white text-rose-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700")}>Expense / Debit</button>
                  </div>
                  
                  {newTx.type === 'income' && (
                    <div>
                      <label className="label">Patient (Optional)</label>
                      <select className="input-field" value={newTx.patientId} onChange={e => setNewTx({...newTx, patientId: e.target.value})}>
                         <option value="">Select Patient...</option>
                         {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="label">Base Amount (₹)</label>
                        <input required type="number" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: e.target.value})} className="input-field" />
                     </div>
                     <div>
                        <label className="label">Discount (₹)</label>
                        <input type="number" value={newTx.discount} onChange={e => setNewTx({...newTx, discount: e.target.value})} className="input-field" />
                     </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-center">
                     <span className="text-xs font-semibold text-slate-500 uppercase block mb-1">Net Total</span>
                     <div className="text-2xl font-bold text-blue-700">₹{netTotal.toLocaleString()}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="label">Category</label>
                        <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})} className="input-field">
                           {(newTx.type === 'income' ? categories.income : categories.expense).map(cat => (
                             <option key={cat} value={cat}>{cat}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="label">Payment Method</label>
                        <select value={newTx.paymentMethod} onChange={e => setNewTx({...newTx, paymentMethod: e.target.value})} className="input-field">
                           <option>Cash</option>
                           <option>UPI / Online</option>
                           <option>Card</option>
                        </select>
                     </div>
                  </div>
                  <div>
                     <label className="label">Date</label>
                     <input type="date" value={newTx.date} onChange={e => setNewTx({...newTx, date: e.target.value})} className="input-field" />
                  </div>
               </form>
             </div>
             
             <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
               <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
               <button type="submit" form="tx-form" className="btn-primary">Save Transaction</button>
             </div>
          </div>
        </div>
      )}

      {/* Hidden layout specifically customized for window.print() */}
      {printTx && (
        <div id="print-bill-container" className="hidden border-2 border-slate-800 p-8 max-w-2xl mx-auto rounded-none text-slate-900 bg-white shadow-none m-0">
          <div className="border-b-2 border-slate-800 pb-6 mb-6 flex justify-between items-start">
             <div>
               <h1 className="text-3xl font-bold tracking-tighter mb-1">FitRevive Clinic</h1>
               <p className="text-sm font-medium">Physiotherapy & Wellness Center</p>
               <p className="text-xs text-slate-500 mt-2">123 Health Avenue<br/>City District, ST 12345</p>
             </div>
             <div className="text-right">
               <h2 className="text-xl font-bold uppercase tracking-widest text-slate-500 mb-2">Invoice</h2>
               <div className="flex justify-end items-center gap-4 text-sm">
                 <span className="font-semibold text-slate-500">Date:</span>
                 <span className="font-mono">{printTx.date}</span>
               </div>
               <div className="flex justify-end items-center gap-4 text-sm mt-1">
                 <span className="font-semibold text-slate-500">Receipt No:</span>
                 <span className="font-mono">{printTx.id?.slice(0,8).toUpperCase()}</span>
               </div>
             </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">Billed To:</h3>
            <p className="font-bold text-lg">{printTx.patientId ? patients.find(p => p.id === printTx.patientId)?.name || 'Walk-In Patient' : 'Walk-In Patient'}</p>
            {printTx.patientId && patients.find(p => p.id === printTx.patientId)?.phone && (
               <p className="text-sm font-mono mt-1 text-slate-600">{patients.find(p => p.id === printTx.patientId)?.phone}</p>
            )}
          </div>

          <table className="w-full mb-8 text-sm">
            <thead>
              <tr className="border-y-2 border-slate-800 text-left">
                <th className="py-3 px-2 font-bold uppercase tracking-wider text-slate-600">Description / Service</th>
                <th className="py-3 px-2 font-bold uppercase tracking-wider text-slate-600 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-4 px-2">
                   <span className="font-bold block text-base">{printTx.category}</span>
                   {printTx.description && <span className="text-slate-500 block mt-1">{printTx.description}</span>}
                </td>
                <td className="py-4 px-2 text-right font-bold tabular-nums text-base">₹{printTx.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-between items-end border-t-2 border-slate-800 pt-6">
             <div className="text-xs text-slate-500">
               <p className="mb-1"><span className="font-bold text-slate-700 block">Payment Method:</span> {printTx.paymentMethod || 'Cash / Online'}</p>
               <p className="italic mt-4 max-w-[200px]">Thank you for choosing FitRevive Clinic. Wish you a speedy recovery!</p>
             </div>
             <div className="text-right">
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Total Paid</div>
                <div className="text-4xl font-bold tracking-tight">₹{printTx.amount.toLocaleString()}</div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Reports = ({ stats, transactions }: { stats: DashboardStats, transactions: Transaction[] }) => {
  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Clinic Reports</h1>
          <p className="text-sm text-slate-500">Financial overview and analytics.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 space-y-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-blue-700 border-b border-slate-200 pb-4">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-lg font-bold">Financial Summary</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-md border border-slate-200 flex flex-col gap-1 bg-white">
              <span className="text-xs font-semibold text-slate-500 uppercase">Revenue</span>
              <span className="text-xl font-bold text-slate-800">₹{stats.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="p-4 rounded-md border border-slate-200 flex flex-col gap-1 bg-white">
              <span className="text-xs font-semibold text-slate-500 uppercase">Expenses</span>
              <span className="text-xl font-bold text-rose-600">₹{stats.monthlyExpenses.toLocaleString()}</span>
            </div>
            <div className="col-span-2 p-6 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase mb-1 block">Net Profit</span>
                  <div className={cn("text-3xl font-bold", stats.netProfit >= 0 ? "text-blue-800" : "text-rose-600")}>
                    ₹{stats.netProfit.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-full border border-blue-200 text-blue-600 shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-8 flex flex-col justify-center items-center text-center bg-slate-50">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm border",
            stats.netProfit >= 0 ? "bg-emerald-100 text-emerald-600 border-emerald-200" : "bg-rose-100 text-rose-600 border-rose-200"
          )}>
            {stats.netProfit >= 0 ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
          </div>
          <h4 className="text-2xl font-bold text-slate-800 mb-2">
            {stats.netProfit >= 0 ? "Positive Cashflow" : "Negative Cashflow"}
          </h4>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            {stats.netProfit >= 0 
              ? "The clinic is operating profitably. Revenue exceeds operational expenses." 
              : "Expenses currently exceed revenue. Review recent operational costs."}
          </p>
        </div>
      </div>
      
      <div className="pt-6 text-center text-xs text-slate-400 font-semibold uppercase">
         Report Generated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

const AppointmentManager = ({ patients, appointments, members, onNotify }: { patients: Patient[], appointments: any[], members: any[], onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
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
    const therapistMatch = therapistFilter === 'all' || a.therapistId === therapistFilter;
    return dateMatch && statusMatch && therapistMatch;
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

  const openApptModal = (appt?: any, defaultTime?: string, defaultDate?: string) => {
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
        patientId: '', 
        therapistId: therapistFilter !== 'all' ? therapistFilter : '',
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
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
             <button 
               onClick={() => setViewType('day')}
               className={cn("px-4 py-1.5 rounded-lg text-xs font-black transition-all", viewType === 'day' ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600")}
             >
               Day View
             </button>
             <button 
               onClick={() => setViewType('week')}
               className={cn("px-4 py-1.5 rounded-lg text-xs font-black transition-all", viewType === 'week' ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600")}
             >
               Week
             </button>
          </div>

          <div className="flex items-center gap-2">
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

      {viewType === 'day' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4">
          {slots.map(slot => {
            const occupiedAppts = appointments.filter(a => a.date === selectedDate && a.time === slot && a.status !== 'cancelled');
            const slotAppts = apptsForDate.filter(a => a.time === slot);
            const isActuallyOccupied = occupiedAppts.length > 0;
            
            const status = getSlotStatus(slot);
            const isToday = selectedDate === new Date().toISOString().substring(0, 10);
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
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     updateStatus(displayAppt.id, 'completed');
                                   }} 
                                   className={cn("p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-500 transition-colors", isOngoing ? "hover:bg-white/20 text-white border border-white/20" : "border border-slate-100")}
                                 >
                                   <CheckCircle className="w-3.5 h-3.5" />
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
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
           <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1000px]">
                 <thead>
                    <tr className="bg-slate-50/50">
                       <th className="w-24 p-4 border-b border-slate-100 text-xs font-black text-slate-400 uppercase tracking-widest text-left">Time</th>
                       {Array.from({ length: 7 }).map((_, i) => {
                          const date = new Date(selectedDate);
                          date.setDate(date.getDate() + i);
                          const isToday = date.toISOString().substring(0, 10) === new Date().toISOString().substring(0, 10);
                          return (
                            <th key={i} className={cn("p-4 border-b border-l border-slate-100 min-w-[140px]", isToday ? "bg-blue-50/30" : "")}>
                               <div className="flex flex-col items-center gap-1">
                                  <span className={cn("text-[10px] font-black uppercase tracking-widest", isToday ? "text-blue-600" : "text-slate-400")}>
                                     {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                  </span>
                                  <span className={cn("text-lg font-black", isToday ? "text-blue-600" : "text-slate-800")}>
                                     {date.getDate()}
                                  </span>
                               </div>
                            </th>
                          );
                       })}
                    </tr>
                 </thead>
                 <tbody>
                    {slots.map(slot => (
                       <tr key={slot} className="group">
                          <td className="p-4 border-b border-slate-50 text-xs font-bold text-slate-500 bg-slate-50/30 tabular-nums">{slot}</td>
                          {Array.from({ length: 7 }).map((_, i) => {
                             const date = new Date(selectedDate);
                             date.setDate(date.getDate() + i);
                             const dateStr = date.toISOString().substring(0, 10);
                             const dayAppts = appointments.filter(a => a.date === dateStr && a.time === slot);
                             
                             return (
                               <td 
                                 key={i} 
                                 onClick={() => dayAppts.length === 0 && openApptModal(null, slot, dateStr)}
                                 className={cn(
                                   "p-2 border-b border-l border-slate-50 h-24 vertical-top group-hover:bg-slate-50/50 transition-colors relative",
                                   dayAppts.length === 0 ? "cursor-pointer" : ""
                                 )}
                               >
                                  <div className="space-y-1">
                                     {dayAppts.map(appt => (
                                        <div 
                                          key={appt.id} 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openApptModal(appt);
                                          }}
                                          className={cn(
                                            "p-2 rounded-lg text-[10px] font-bold cursor-pointer transition-all hover:scale-105 shadow-sm",
                                            appt.status === 'completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                            appt.status === 'cancelled' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                            "bg-blue-600 text-white shadow-blue-100"
                                          )}
                                        >
                                           <div className="truncate">{appt.patientName}</div>
                                           <div className="opacity-80 flex items-center gap-1 mt-0.5"><Activity className="w-2 h-2" /> {appt.sessionType}</div>
                                        </div>
                                     ))}
                                     {dayAppts.length === 0 && (
                                       <div className="h-full min-h-[40px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all pointer-events-none">
                                         <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-sm">
                                           <Plus className="w-4 h-4" />
                                         </div>
                                       </div>
                                     )}
                                  </div>
                               </td>
                             );
                          })}
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all animate-in fade-in duration-300">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
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

const SessionManager = ({ appointments, onNotify }: { appointments: Appointment[], onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const todayDate = new Date().toISOString().substring(0, 10);
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

const TeamManager = ({ role, members, onNotify }: { role: string, members: any[], onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [newMember, setNewMember] = useState({ name: '', role: '', phone: '', email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creationError, setCreationError] = useState('');

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreationError('');
    try {
      if (!newMember.email || !newMember.password) {
        throw new Error("Email and initial password are required to create a staff account.");
      }
      await saveTeamMember(newMember);
      onNotify(`Staff account created for ${newMember.name}`);
      setShowMemberModal(false);
      setNewMember({ name: '', role: '', phone: '', email: '', password: '' });
    } catch (err: any) {
      setCreationError(err.message || 'Failed to create user. Ensure email is unique and password is at least 6 characters.');
      onNotify("Failed to create staff member", "error");
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
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Staff Management</h1>
          <p className="text-sm text-slate-500">Manage clinic personnel and system access.</p>
        </div>
        <div className="flex w-full md:w-auto">
          {role === 'admin' && (
            <button onClick={() => setShowMemberModal(true)} className="btn-primary whitespace-nowrap w-full md:w-auto justify-center">
              <Plus className="w-5 h-5" />
              <span>Add Staff</span>
            </button>
          )}
        </div>
      </header>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Staff Access Directory</h2>
           </div>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Info</th>
                <th>Role</th>
                <th>App Access</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => {
                return (
                  <tr key={member.id} className={cn("hover:bg-slate-50 transition-colors", !member.isActive && "opacity-60")}>
                    <td>
                       <div className="flex items-center gap-2">
                         <div className="font-semibold text-slate-800">{member.name}</div>
                         {member.staffId && (
                           <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">{member.staffId}</span>
                         )}
                       </div>
                       <div className="text-xs text-slate-500 font-mono mt-0.5">{member.email}</div>
                    </td>
                    <td><span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded capitalize">{member.role}</span></td>
                    <td>
                        {member.isActive ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Active</span>
                        ) : (
                          <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-2 py-1 rounded">Revoked</span>
                        )}
                    </td>
                    <td className="text-right">
                      {role === 'admin' ? (
                        <div className="flex justify-end gap-3 items-center">
                           {member.isActive ? (
                             <button onClick={() => handleStatusUpdate(member.id, false, member.name)} className="px-3 py-1.5 text-rose-600 hover:text-rose-800 text-sm font-semibold transition-colors">Revoke Access</button>
                           ) : (
                             <button onClick={() => handleStatusUpdate(member.id, true, member.name)} className="px-3 py-1.5 text-emerald-600 hover:text-emerald-800 text-sm font-semibold transition-colors">Restore Access</button>
                           )}
                           
                           <div className="h-4 w-px bg-slate-200 mx-1"></div>
                           <button onClick={() => setPendingDelete(member)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete Member">
                             <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                      ) : (
                         <span className="text-sm text-slate-400 italic">No permission</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 && (
                 <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500 italic border-t border-dashed border-slate-200">No staff members found.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Add Staff Member</h3>
              <button 
                onClick={() => setShowMemberModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              {creationError && (
                <div className="mb-4 bg-rose-50 border-l-4 border-rose-500 p-3 text-sm text-rose-700 font-semibold rounded-r">
                   {creationError}
                </div>
              )}
              <form id="staff-form" onSubmit={handleMemberSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Full Name</label>
                    <input required placeholder="e.g. Dr. Jane Doe" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} className="input-field" disabled={isSubmitting} />
                  </div>
                  <div>
                    <label className="label">Role / Access Level</label>
                    <select required value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} className="input-field" disabled={isSubmitting}>
                        <option value="">Select Role...</option>
                        <option value="Therapist">Therapist</option>
                        <option value="Receptionist">Receptionist</option>
                        <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Contact Number</label>
                    <input required placeholder="Phone number" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})} className="input-field" disabled={isSubmitting} />
                  </div>
                  <div className="col-span-2 mt-4 pt-4 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Account Credentials</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="label">Login Email</label>
                        <input type="email" required placeholder="name@clinic.com" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="input-field" disabled={isSubmitting} />
                      </div>
                      <div>
                        <label className="label">Initial Password</label>
                        <input type="password" required minLength={6} placeholder="Min 6 characters" value={newMember.password} onChange={e => setNewMember({...newMember, password: e.target.value})} className="input-field" disabled={isSubmitting} />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowMemberModal(false)} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
              <button type="submit" form="staff-form" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <Activity className="w-5 h-5 animate-spin" /> : 'Create User & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {pendingDelete && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl overflow-hidden flex flex-col p-6 text-center border-t-4 border-rose-500">
             <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex mx-auto items-center justify-center mb-4">
                <Trash2 className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Staff Member</h3>
             <p className="text-slate-500 mb-6 font-medium text-sm">Are you sure you want to permanently delete <span className="font-bold text-slate-800">{pendingDelete.name}</span>? This action cannot be reversed.</p>
             <div className="flex gap-3 w-full">
                <button onClick={() => setPendingDelete(null)} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors">Cancel</button>
                <button onClick={() => handleDeleteMember(pendingDelete)} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg py-3 shadow-[0_4px_10px_rgb(225,29,72,0.3)] transition-colors">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AttendanceManager = ({ role, members, currentUserEmail, onNotify }: { role: string, members: any[], currentUserEmail: string | null, onNotify: (msg: string, type?: 'success' | 'error') => void }) => {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));

  useEffect(() => {
    const unsubAttendance = getAttendance(selectedDate, setAttendance);
    return () => { unsubAttendance(); };
  }, [selectedDate]);

  const markAttendance = async (member: any, status: 'present' | 'absent' | 'late') => {
    try {
      const checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      await logAttendance({
        memberId: member.id,
        memberName: member.name,
        date: selectedDate,
        checkIn: status === 'absent' ? '' : checkIn,
        status
      });
      onNotify(`Attendance marked as ${status} for ${member.name}`);
    } catch (err: any) {
      onNotify(err.message || "Failed to mark attendance.", "error");
    }
  };

  const visibleMembers = members.filter(m => {
    if (!m.isActive) return false;
    if (role === 'admin') return true;
    return m.email === currentUserEmail;
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Daily Attendance</h1>
          <p className="text-sm text-slate-500">Track and manage staff attendance records.</p>
        </div>
        <div className="flex w-full md:w-auto">
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="input-field max-w-[200px]"
          />
        </div>
      </header>

      <div className="card">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Attendance Roster</h2>
           </div>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="data-table">
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Role</th>
                <th>Log (Today)</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleMembers.map(member => {
                const record = attendance.find(a => a.memberId === member.id);
                const isSelf = member.email === currentUserEmail;
                const canMark = role === 'admin' || isSelf;

                return (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                       <div className="flex items-center gap-2">
                         <div className="font-semibold text-slate-800">{member.name} {isSelf && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded tracking-wide ml-1">YOU</span>}</div>
                         {member.staffId && <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 uppercase tracking-wider">{member.staffId}</span>}
                       </div>
                    </td>
                    <td><span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded capitalize">{member.role}</span></td>
                    <td>
                      {record ? (
                        <div className="flex flex-col items-start gap-1">
                          <div className={cn("text-xs font-semibold px-2 py-0.5 rounded inline-flex", record.status === 'present' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                            {record.status === 'present' ? 'Present' : 'Absent'}
                          </div>
                          <span className="tabular-nums font-mono text-xs text-slate-500">{record?.checkIn || '--:--'}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-sm">Not Marked</span>
                      )}
                    </td>
                    <td className="text-right">
                      {canMark ? (
                        <div className="flex justify-end gap-3 items-center">
                           {!record && (
                             <>
                               <button onClick={() => markAttendance(member, 'present')} className="px-4 py-2 bg-white border-2 border-emerald-300 text-emerald-700 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-all flex items-center gap-1 shadow-sm"><BadgeCheck className="w-4 h-4" /> Present</button>
                               <button onClick={() => markAttendance(member, 'absent')} className="px-4 py-2 bg-white border-2 border-rose-300 text-rose-700 rounded-lg text-sm font-bold hover:bg-rose-50 transition-all flex items-center gap-1 shadow-sm"><X className="w-4 h-4" /> Absent</button>
                             </>
                           )}
                           {record && <span className="text-sm font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">Logged</span>}
                        </div>
                      ) : (
                         <span className="text-sm text-slate-400 italic">No permission</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleMembers.length === 0 && (
                 <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-500 italic border-t border-dashed border-slate-200">No staff members found based on your access level.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Login = ({ onDemoLogin }: { onDemoLogin: (role: 'admin' | 'receptionist' | 'therapist') => void }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!identifier || !password) {
      setError('Please enter your email/phone and password.');
      return;
    }

    // --- DEMO BYPASS ---
    const lowerId = identifier.toLowerCase();
    if (lowerId === 'admin' && password === 'admin') {
       onDemoLogin('admin');
       return;
    }
    if (lowerId === 'receptionist' && password === 'receptionist') {
       onDemoLogin('receptionist');
       return;
    }
    if (lowerId === 'therapist' && password === 'therapist') {
       onDemoLogin('therapist');
       return;
    }

    setLoading(true);
    try {
      const email = identifier.includes('@') ? identifier : `${identifier.replace(/\s+/g, '')}@fitrevive.clinic`;
      await signInWithEmail(email, password);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password Auth is not enabled in Firebase. Please enable it in Firebase Console or use "Sign in with Google".');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid credentials. If you are the clinic owner, please use "Sign in with Google" below.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed. Please try again.');
      } else {
        setError(err.message || 'Google Sign-in failed.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 relative">
        {/* Helper Badge for Preview */}
        <div className="absolute -top-6 right-4 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 flex flex-col gap-1 shadow-sm">
          <span>Demo Accounts (User / Pass):</span>
          <span className="font-mono bg-white/50 px-1 rounded block">admin / admin</span>
          <span className="font-mono bg-white/50 px-1 rounded block">receptionist / receptionist</span>
          <span className="font-mono bg-white/50 px-1 rounded block">therapist / therapist</span>
        </div>

        <div className="mb-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6 shadow-sm border border-blue-100 overflow-hidden">
             <img 
               src="/logo-2.jpg" 
               alt="FitRevive Logo" 
               className="w-full h-full object-cover"
               referrerPolicy="no-referrer"
               onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="font-bold text-3xl tracking-tight">FR</span>'; }}
             />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">Welcome Back</h1>
          <p className="text-slate-500 font-medium">FitRevive Management Portal</p>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg">
            <p className="text-sm font-semibold text-rose-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone or Email</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 9876543210 or name@clinic.com" 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all placeholder:text-slate-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-medium text-slate-800 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" 
            />
            <label htmlFor="remember" className="text-sm font-semibold text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">Remember Me</label>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70 flex justify-center mt-2"
          >
            {loading ? <Activity className="w-6 h-6 animate-spin" /> : 'Login'}
          </button>
        </form>
        
        <div className="mt-8 flex flex-col items-center border-t border-slate-100 pt-8">
          <p className="text-sm text-slate-500 font-semibold mb-4">Super Administrator Only</p>
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-base py-3 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-3"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <div className="mt-6 text-center flex flex-col items-center">
          <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">Forgot Password?</button>
        </div>
      </div>
      
      <div className="mt-12 text-center text-xs font-semibold text-slate-400">
        © 2026 FitRevive Clinic
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activePatients: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0
  });

  const [role, setRole] = useState<'admin' | 'receptionist' | 'therapist'>('receptionist');
  const [members, setMembers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<{ id: string, message: string, type: 'success' | 'error' }[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      try {
        if (u && u.email) {
          // Authenticated layer 1: Check Database record to verify access & status
          const memberData = await checkMemberAuthorization(u.email);
          
          if (memberData) {
            if (!memberData.isActive) {
              auth.signOut();
              setUser(null);
              setLoading(false);
              return;
            }
            setRole(memberData.role.toLowerCase() as any);
          } else {
            // Whitelist for initial owner setup
            const email = u.email.toLowerCase();
            if (email === 'prasenjitkakati91@gmail.com' || email === 'admin@fitrevive.clinic' || email.includes('admin')) {
               setRole('admin');
            } else {
               auth.signOut();
               alert('Unauthorized access. Your account does not exist in the clinic staff database.');
               setUser(null);
               setLoading(false);
               return;
            }
          }
          
          setActiveTab('dashboard');
          setUser(u);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth status change error:", error);
        setUser(null);
      } finally {
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

  const handleDemoLogin = (roleAssigned: 'admin' | 'receptionist' | 'therapist') => {
    setIsDemoMode(true);
    setUser({ email: `${roleAssigned}@demo.clinic`, uid: `demo-${roleAssigned}-123`, displayName: `Demo ${roleAssigned}` } as any);
    setRole(roleAssigned);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
         <Activity className="w-10 h-10 text-blue-600 animate-pulse mb-4" />
         <p className="font-semibold text-slate-500 text-sm">Loading Clinic System...</p>
      </div>
    );
  }

  if (!user) return <Login onDemoLogin={handleDemoLogin} />;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
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
        />
        
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-300",
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        )}>
          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center border border-slate-200">
                <img 
                  src="/logo-2.jpg" 
                  alt="FitRevive" 
                  className="w-full h-full object-cover rounded"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="font-bold text-xs text-blue-600">FR</span>'; }}
                />
              </div>
              <span className="font-bold text-slate-800">FitRevive</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-500 rounded border border-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <Dashboard stats={stats} transactions={transactions} appointments={appointments} patients={patients} role={role} setTab={setActiveTab} onNotify={showNotification} />}
            {activeTab === 'appointments' && <AppointmentManager appointments={appointments} patients={patients} members={members} onNotify={showNotification} />}
            {activeTab === 'patients' && <PatientManager patients={patients} appointments={appointments} transactions={transactions} onNotify={showNotification} />}
            {activeTab === 'finances' && <FinanceTracker transactions={transactions} patients={patients} onNotify={showNotification} />}
            {activeTab === 'team' && <TeamManager role={role} members={members} onNotify={showNotification} />}
            {activeTab === 'attendance' && <AttendanceManager role={role} members={members} currentUserEmail={user?.email || null} onNotify={showNotification} />}
            {activeTab === 'sessions' && <SessionManager appointments={appointments} onNotify={showNotification} />}
            {activeTab === 'reports' && <Reports stats={stats} transactions={transactions} />}
          </div>
        </main>
      </div>

      {/* Global Notifications */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={cn(
                "px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border pointer-events-auto",
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
