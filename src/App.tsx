import React, { useState, useEffect } from 'react';
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
  Unlock
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
  Area
} from 'recharts';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  auth, 
  signIn, 
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
  getTeamMembers,
  logAttendance,
  getAttendance
} from './firebase';
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
}

interface DashboardStats {
  activePatients: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
}

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab, user, isOpen, onClose }: { activeTab: string, setActiveTab: (tab: string) => void, user: User, isOpen: boolean, onClose: () => void }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Bookings', icon: Calendar },
    { id: 'patients', label: 'Patients', icon: Users },
    { id: 'finances', label: 'Finances', icon: CircleDollarSign },
    { id: 'team', label: 'Staff & HR', icon: BadgeCheck },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[45] transition-opacity duration-500 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      <aside className={cn(
        "w-[280px] md:w-[260px] bg-slate-950 text-white h-screen fixed left-0 top-0 flex flex-col z-50 border-r border-white/5 shadow-2xl shadow-black/20 overflow-hidden transition-transform duration-500 ease-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-[16px] md:rounded-[18px] bg-gradient-to-br from-primary to-primary-dark p-0.5 shadow-lg shadow-primary/20 overflow-hidden">
              <div className="w-full h-full bg-slate-950 rounded-[14px] md:rounded-[16px] flex items-center justify-center overflow-hidden">
                <img 
                  src="/logo-2.jpg" 
                  alt="FitRevive Logo" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter leading-none">
              FitRevive<span className="text-primary truncate block text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] mt-1 opacity-50">Clinical Cloud</span>
            </h1>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-2 overflow-y-auto overflow-x-hidden pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                onClose();
              }}
              className={cn(
                "sidebar-item w-full group",
                activeTab === tab.id ? "sidebar-item-active" : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              )}
            >
              <tab.icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", activeTab === tab.id ? "text-primary" : "")} />
              <span className="tracking-tight text-[15px]">{tab.label}</span>
            </button>
          ))}
        </nav>

      <div className="p-4">
        <div className="glass-dark p-4 rounded-[28px] shadow-xl relative group">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=0EA5E9&color=fff`} 
                alt="User" 
                className="w-10 h-10 rounded-2xl border border-white/10 shadow-lg"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-950 rounded-full scale-0 group-hover:scale-100 transition-transform"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate leading-none mb-1">{user.displayName?.split(' ')[0]}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate">Clinical Owner</p>
            </div>
            <button 
              onClick={logOut}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-all shadow-sm"
              title="Logout"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  </>
);
};

const Dashboard = ({ stats, transactions }: { stats: DashboardStats, transactions: Transaction[] }) => {
  const chartData = [
    { name: 'Mon', revenue: 400, expenses: 240 },
    { name: 'Tue', revenue: 300, expenses: 139 },
    { name: 'Wed', revenue: 200, expenses: 980 },
    { name: 'Thu', revenue: 278, expenses: 390 },
    { name: 'Fri', revenue: 189, expenses: 480 },
    { name: 'Sat', revenue: 239, expenses: 380 },
    { name: 'Sun', revenue: 349, expenses: 430 },
  ];

  // Simple aggregation for chart if we have real transactions
  const last7DaysData = () => {
    // For demo/simplicity, we'll use a mix of real trends if data exists
    if (transactions.length < 3) return chartData;
    
    // Map transactions to last 7 days... (simplified)
    return chartData;
  };

  const SummaryCard = ({ title, value, trend, icon: Icon, color }: any) => (
    <div className="stat-card group">
      <div className="flex justify-between items-start mb-2">
        <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", color || "bg-blue-50 text-primary")}>
          <Icon className="w-5 h-5 shadow-sm" />
        </div>
        {trend && (
          <div className={cn("text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-tighter", trend > 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-500")}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{title}</span>
        <div className="text-[32px] display-heading text-slate-900 tracking-tighter tabular-nums">{value}</div>
      </div>
      <div className="mt-4 flex gap-1 items-center">
        <div className="h-1.5 flex-1 bg-slate-100/80 rounded-full overflow-hidden shadow-inner">
          <div className={cn("h-full transition-all duration-1000 ease-out", trend > 0 ? "bg-primary" : "bg-rose-400")} style={{ width: '70%', borderRadius: 'inherit' }}></div>
        </div>
        <span className="text-[10px] font-bold text-slate-300 ml-2">EST</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in p-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-100 pb-10 gap-6 md:gap-0">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-emerald-500 border border-emerald-300 rounded-full animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Clinic Status: Verified</span>
          </div>
          <h1 className="text-3xl md:text-5xl display-heading text-slate-900 leading-tight md:leading-[0.85]">Health Pulse</h1>
          <p className="text-sm md:text-[15px] text-slate-500 font-semibold mt-2 md:mt-3 max-w-sm">Aggregated clinical intelligence for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button className="p-3 md:p-4 rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all shrink-0">
            <History className="w-5 h-5" />
          </button>
          <div className="h-10 w-[1px] bg-slate-100 mx-2 hidden md:block"></div>
          <div className="text-right">
            <div className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Server Time</div>
            <div className="font-mono font-bold text-slate-900 tabular-nums text-sm md:text-base">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SummaryCard 
          title="Revenue Pipeline" 
          value={`₹${stats.monthlyRevenue.toLocaleString()}`} 
          trend={12.4}
          icon={CircleDollarSign}
          color="bg-blue-50 text-blue-500"
        />
        <SummaryCard 
          title="Operation Cost" 
          value={`₹${stats.monthlyExpenses.toLocaleString()}`} 
          trend={-5}
          icon={TrendingDown}
          color="bg-rose-50 text-rose-500"
        />
        <SummaryCard 
          title="Clinical Load" 
          value={String(stats.activePatients)} 
          trend={8}
          icon={Users}
          color="bg-emerald-50 text-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.8fr_1fr] gap-10">
        <div className="panel">
          <div className="panel-header glass-light flex-col md:flex-row gap-4 md:gap-0 px-6 md:px-10 py-6 md:py-8">
            <span className="text-lg md:text-xl display-heading text-slate-900 tracking-tight">Engagement Register</span>
            <div className="flex gap-4 w-full md:w-auto">
              <div className="relative group w-full md:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input type="text" placeholder="Scan clinical ID..." className="bg-slate-50/50 border border-slate-100 pl-12 pr-6 py-3 rounded-2xl text-[13px] font-bold w-full md:w-[260px] focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all shadow-inner" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Clinical Signature</th>
                  <th>Age Brackets</th>
                  <th>Clinical Context</th>
                  <th className="text-right">Operation Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 5).map((t, idx) => (
                  <tr key={idx} className="group hover:bg-slate-50/70 transition-all cursor-pointer">
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-[14px] bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center font-mono font-black text-xs shadow-sm">
                          {String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">Patient Alpha {idx + 1}</span>
                          <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.15em] mt-0.5">Verified Record</span>
                        </div>
                      </div>
                    </td>
                    <td className="tabular-nums font-bold text-slate-600 tracking-tight">{28 + (idx * 2)} yrs</td>
                    <td className="text-slate-400 font-medium max-w-[200px] truncate italic">Physical reconstruction protocol phase {idx + 1}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-blue-600">Active</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden border-none shadow-2xl shadow-slate-900/5">
          <div className="bg-slate-950 p-10 text-white relative h-full flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="grid grid-cols-6 h-full border-l border-white/10">
                {Array.from({length: 6}).map((_, i) => <div key={i} className="border-r border-white/10"></div>)}
              </div>
            </div>
            
            <div className="relative z-10">
               <div className="flex justify-between items-start mb-8">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Net Financial State</span>
                  <span className="text-4xl display-heading leading-none">₹{stats.netProfit.toLocaleString()}</span>
                </div>
                <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl border border-emerald-500/20 shadow-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="space-y-6 flex-grow">
                {transactions.slice(0, 3).map(t => (
                  <div key={t.id} className="group p-5 rounded-[28px] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-[18px] flex items-center justify-center shadow-lg", t.type === 'income' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                          {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-white tracking-tight">{t.category}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5 tabular-nums">{t.date}</div>
                        </div>
                      </div>
                      <div className={cn("text-lg font-black tabular-nums tracking-tighter", t.type === 'income' ? "text-emerald-400" : "text-rose-400")}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-8 py-5 border border-white/10 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white hover:text-black transition-all">
                Audit Registry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PatientManager = ({ patients }: { patients: Patient[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientHistory, setPatientHistory] = useState<Session[]>([]);
  
  const [newPatient, setNewPatient] = useState({ name: '', phone: '', age: '', medicalHistory: '' });
  const [newSession, setNewSession] = useState({ 
    date: new Date().toISOString().substring(0, 10), 
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), 
    paymentStatus: 'unpaid' as 'paid' | 'unpaid',
    paymentMethod: 'cash' as 'cash' | 'upi',
    amount: '',
    notes: '' 
  });

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePatient({
      name: newPatient.name,
      phone: newPatient.phone,
      age: parseInt(newPatient.age),
      medicalHistory: newPatient.medicalHistory
    });
    setNewPatient({ name: '', phone: '', age: '', medicalHistory: '' });
    setShowModal(false);
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    await logSession(selectedPatient.id, selectedPatient.name, {
      ...newSession,
      amount: newSession.paymentStatus === 'paid' ? parseFloat(newSession.amount) : 0
    });
    setShowSessionModal(false);
    setNewSession({
      date: new Date().toISOString().substring(0, 10),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      amount: '',
      notes: ''
    });
  };

  useEffect(() => {
    if (selectedPatient && showHistoryModal) {
      const unsub = getSessions(selectedPatient.id, setPatientHistory);
      return () => unsub();
    }
  }, [selectedPatient, showHistoryModal]);

  return (
    <div className="space-y-8 animate-in p-2 md:p-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-100 pb-8 gap-6 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl display-heading text-slate-900">Patient Database</h1>
          <p className="text-sm md:text-[14px] text-slate-400 font-semibold tracking-tight mt-2 md:mt-1">Managing {patients.length} verified clinical records</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-4 rounded-[20px] md:rounded-2xl font-extrabold text-[12px] md:text-[13px] shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 group w-full md:w-auto"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
          <span>Register New Patient</span>
        </button>
      </header>

      <div className="panel">
        <div className="panel-header flex-col md:flex-row gap-4 py-8 px-6 md:px-10">
          <div className="flex items-center gap-4 w-full max-w-xl bg-slate-50 px-5 py-3 rounded-[20px] focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <Search className="w-5 h-5 text-slate-300" />
            <input 
              type="text" 
              placeholder="Query database..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[14px] text-slate-600 w-full placeholder:text-slate-300 focus:outline-none"
            />
          </div>
          <button className="p-3 bg-slate-50 md:bg-transparent hover:bg-slate-50 rounded-2xl text-slate-300 transition-all self-end md:self-auto">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left data-table">
            <thead>
              <tr>
                <th>Identity</th>
                <th>Contact</th>
                <th className="text-center">Age</th>
                <th>Surgical Context</th>
                <th className="text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPatients.map(patient => (
                <tr key={patient.id} className="group hover:bg-slate-50/30 transition-all">
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[14px]">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="font-extrabold text-slate-900 group-hover:text-primary transition-colors">{patient.name}</div>
                    </div>
                  </td>
                  <td className="font-bold text-slate-400 tracking-tight tabular-nums">{patient.phone}</td>
                  <td className="text-center text-slate-500 font-black">{patient.age}</td>
                  <td>
                    <div className="max-w-[240px] truncate text-slate-400 font-medium italic">
                      {patient.medicalHistory || 'Historical context unavailable'}
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-3 pr-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <button 
                        onClick={() => { setSelectedPatient(patient); setShowSessionModal(true); }}
                        className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                        title="Log Interaction"
                      >
                        <CalendarCheck className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => { setSelectedPatient(patient); setShowHistoryModal(true); }}
                        className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Interaction Log"
                      >
                        <History className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredPatients.length === 0 && (
            <div className="p-32 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-slate-100" />
              </div>
              <p className="text-slate-400 font-black tracking-tight text-lg">No records discovered for this query</p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 text-primary font-bold text-sm hover:underline"
              >Clear identifiers</button>
            </div>
          )}
        </div>
      </div>

      {/* New Patient Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl animate-in p-2 md:p-0">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-[17px] font-bold text-slate-900">Add Patient</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-50 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Full Name</label>
                  <input required placeholder="Name" value={newPatient.name} onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Phone</label>
                    <input required placeholder="Phone" value={newPatient.phone} onChange={e => setNewPatient({...newPatient, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Age</label>
                    <input required type="number" placeholder="Age" value={newPatient.age} onChange={e => setNewPatient({...newPatient, age: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Medical Highlights</label>
                  <textarea rows={2} placeholder="Notes..." value={newPatient.medicalHistory} onChange={e => setNewPatient({...newPatient, medicalHistory: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] resize-none focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#0EA5E9] text-white py-2 rounded-md font-bold text-[13px] mt-2 shadow-sm hover:bg-[#0284C7] transition-colors">
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Log Visit Modal */}
      {showSessionModal && selectedPatient && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl animate-in p-2 md:p-0">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900">Log Visit</h3>
                <p className="text-[11px] text-slate-500">Patient: {selectedPatient.name}</p>
              </div>
              <button onClick={() => setShowSessionModal(false)} className="p-1 hover:bg-slate-50 rounded text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSessionSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Date</label>
                  <input type="date" value={newSession.date} onChange={e => setNewSession({...newSession, date: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Time</label>
                  <input type="time" value={newSession.time} onChange={e => setNewSession({...newSession, time: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Payment Status</label>
                <div className="flex gap-2 p-1 bg-slate-50 rounded-lg">
                  {(['unpaid', 'paid'] as const).map(s => (
                    <button 
                      key={s}
                      type="button"
                      onClick={() => setNewSession({...newSession, paymentStatus: s})}
                      className={cn(
                        "flex-1 py-1.5 rounded-md text-[11px] font-bold transition-all capitalize",
                        newSession.paymentStatus === s 
                          ? s === 'paid' ? "bg-emerald-500 text-white shadow-sm" : "bg-rose-500 text-white shadow-sm"
                          : "text-slate-400"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {newSession.paymentStatus === 'paid' && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Method</label>
                    <select 
                      value={newSession.paymentMethod} 
                      onChange={e => setNewSession({...newSession, paymentMethod: e.target.value as any})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Amount (₹)</label>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="500" 
                      value={newSession.amount} 
                      onChange={e => setNewSession({...newSession, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" 
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Session Notes</label>
                <input placeholder="Short session highlights..." value={newSession.notes} onChange={e => setNewSession({...newSession, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0EA5E9]" />
              </div>
              <button type="submit" className="w-full bg-[#0F172A] text-white py-2 rounded-md font-bold text-[13px] mt-2 shadow-sm hover:bg-slate-800 transition-colors">
                Confirm & Log Session
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedPatient && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl animate-in max-h-[85vh] flex flex-col p-2 md:p-0">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-[32px] z-10">
              <div>
                <h3 className="text-[17px] font-bold text-slate-900">Attendance History</h3>
                <p className="text-[11px] text-slate-500">Patient: {selectedPatient.name}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-slate-100 rounded text-slate-400 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {patientHistory.map((s, idx) => (
                <div key={s.id || idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                       <span className="text-[13px] font-bold text-slate-900">{s.date}</span>
                       <span className="text-[11px] text-slate-400">{s.time || ''}</span>
                    </div>
                    {s.notes && <p className="text-[12px] text-slate-500 mt-0.5">{s.notes}</p>}
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                      s.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-500 border-rose-100"
                    )}>
                      {s.paymentStatus}
                    </span>
                    {s.paymentStatus === 'paid' && (
                      <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
                        ₹{s.amount} • {s.paymentMethod}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {patientHistory.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-10" />
                  <p>No visits logged for this patient yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FinanceTracker = ({ transactions }: { transactions: Transaction[] }) => {
  const [showModal, setShowModal] = useState(false);
  const [newTx, setNewTx] = useState({ amount: '', category: 'Consultation', date: new Date().toISOString().substring(0, 10), type: 'income' as 'income' | 'expense', description: '' });

  const income = transactions.filter(t => t.type === 'income');
  const expenses = transactions.filter(t => t.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logTransaction({
      amount: parseFloat(newTx.amount),
      category: newTx.category,
      date: newTx.date,
      type: newTx.type,
      description: newTx.description
    });
    setNewTx({ amount: '', category: 'Consultation', date: new Date().toISOString().substring(0, 10), type: 'income', description: '' });
    setShowModal(false);
  };

  const categories = {
    income: ['Consultation', 'Training', 'Therapy', 'Sale', 'Other'],
    expense: ['Rent', 'Equipment', 'Salaries', 'Utility', 'Marketing', 'Other']
  };

  return (
    <div className="space-y-8 animate-in p-2 md:p-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-100 pb-8 gap-6 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-4xl display-heading text-slate-900">Financial Ledger</h1>
          <p className="text-sm md:text-[14px] text-slate-400 font-semibold tracking-tight mt-2 md:mt-1">Audit your revenue streams and operational cost centers</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-3 bg-slate-950 text-white px-6 py-4 rounded-[20px] md:rounded-2xl font-extrabold text-[12px] md:text-[13px] shadow-2xl shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-95 group w-full md:w-auto"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 text-primary" strokeWidth={3} />
          <span>New Entry Posting</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="panel">
          <div className="panel-header bg-emerald-50/10 py-6">
             <div className="flex items-center gap-3">
               <div className="p-2.5 bg-emerald-50 rounded-2xl">
                 <TrendingUp className="w-5 h-5 text-emerald-500" />
               </div>
               <span className="text-[17px] display-heading text-slate-900 tracking-tight">Revenue Stream</span>
             </div>
             <span className="text-[11px] font-black text-emerald-600 bg-white px-3 py-1.5 rounded-xl border border-emerald-50 shadow-sm uppercase tracking-widest">₹{income.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</span>
          </div>
          <div className="overflow-x-auto min-h-[440px]">
             <table className="w-full text-left data-table">
                <thead>
                  <tr>
                    <th>Entry Date</th>
                    <th>Source</th>
                    <th className="text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {income.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/20 transition-all">
                      <td className="text-slate-300 font-bold tabular-nums">{t.date}</td>
                      <td className="font-extrabold text-slate-800">{t.category}</td>
                      <td className="text-right font-black text-emerald-500 tabular-nums text-base tracking-tighter">+₹{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header bg-rose-50/10 py-6">
             <div className="flex items-center gap-3">
               <div className="p-2.5 bg-rose-50 rounded-2xl">
                 <TrendingDown className="w-5 h-5 text-rose-500" />
               </div>
               <span className="text-[17px] display-heading text-slate-900 tracking-tight">Expense Ledger</span>
             </div>
             <span className="text-[11px] font-black text-rose-500 bg-white px-3 py-1.5 rounded-xl border border-rose-50 shadow-sm uppercase tracking-widest">₹{expenses.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}</span>
          </div>
          <div className="overflow-x-auto min-h-[440px]">
             <table className="w-full text-left data-table">
                <thead>
                  <tr>
                    <th>Entry Date</th>
                    <th>Category</th>
                    <th className="text-right">Debit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {expenses.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/20 transition-all">
                      <td className="text-slate-300 font-bold tabular-nums">{t.date}</td>
                      <td className="font-extrabold text-slate-800">{t.category}</td>
                      <td className="text-right font-black text-rose-500 tabular-nums text-base tracking-tighter">-₹{t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Log Transaction</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: 'income', category: categories.income[0]})}
                  className={cn("flex-1 py-2 rounded-lg font-bold text-sm transition-all", newTx.type === 'income' ? "bg-white text-green-600 shadow-sm" : "text-slate-500")}
                >Income</button>
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: 'expense', category: categories.expense[0]})}
                  className={cn("flex-1 py-2 rounded-lg font-bold text-sm transition-all", newTx.type === 'expense' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500")}
                >Expense</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Amount (₹)</label>
                  <input 
                    required 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="250.00"
                    value={newTx.amount}
                    onChange={e => setNewTx({...newTx, amount: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#0EA5E9]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Category</label>
                    <select 
                      value={newTx.category}
                      onChange={e => setNewTx({...newTx, category: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#0EA5E9]/20"
                    >
                      {(newTx.type === 'income' ? categories.income : categories.expense).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Date</label>
                    <input 
                      required 
                      type="date" 
                      value={newTx.date}
                      onChange={e => setNewTx({...newTx, date: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#0EA5E9]/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">Description (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Short detail..."
                    value={newTx.description}
                    onChange={e => setNewTx({...newTx, description: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#0EA5E9]/20"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className={cn(
                  "w-full py-4 rounded-2xl font-bold mt-4 shadow-lg transition-transform hover:scale-[1.02]",
                  newTx.type === 'income' ? "bg-green-600 shadow-green-600/20 text-white" : "bg-rose-500 shadow-rose-500/20 text-white"
                )}
              >
                Log {newTx.type === 'income' ? 'Income' : 'Expense'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Reports = ({ stats, transactions }: { stats: DashboardStats, transactions: Transaction[] }) => {
  return (
    <div className="space-y-10 animate-in p-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-100 pb-10 gap-6 md:gap-0">
        <div>
          <h1 className="text-3xl md:text-5xl display-heading text-slate-900 leading-[0.85]">Clinical Audit</h1>
          <p className="text-sm md:text-[15px] text-slate-500 font-semibold mt-3">Finalized business intelligence and fiscal performance</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="panel p-6 md:p-10 space-y-8">
          <div className="flex items-center gap-3 text-primary">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-xl display-heading">Profit Dynamics</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Status</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">₹{stats.monthlyRevenue.toLocaleString()}</span>
            </div>
            <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 flex flex-col gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Burn Rate</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">₹{stats.monthlyExpenses.toLocaleString()}</span>
            </div>
            <div className="col-span-2 p-10 bg-slate-950 rounded-[40px] text-white shadow-2xl shadow-blue-500/10">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 block">Net Clinical Profit</span>
                  <div className={cn("text-5xl display-heading leading-none", stats.netProfit >= 0 ? "text-primary" : "text-rose-400")}>
                    ₹{stats.netProfit.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                  <Activity className="w-8 h-8 text-primary glow" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel p-10 flex flex-col justify-center items-center text-center overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
             <div className="grid grid-cols-8 h-full border-l border-slate-900">
               {Array.from({length: 8}).map((_, i) => <div key={i} className="border-r border-slate-900"></div>)}
             </div>
          </div>
          
          <div className={cn(
            "w-28 h-28 rounded-[40px] flex items-center justify-center mb-8 shadow-2xl relative z-10",
            stats.netProfit >= 0 ? "bg-emerald-50 text-emerald-500 shadow-emerald-500/10" : "bg-rose-50 text-rose-500 shadow-rose-500/10"
          )}>
            {stats.netProfit >= 0 ? <TrendingUp className="w-12 h-12" /> : <TrendingDown className="w-12 h-12" />}
          </div>
          <h4 className="text-3xl display-heading text-slate-900 mb-4 z-10">
            {stats.netProfit >= 0 ? "Growth Optimized" : "Deficit Alert"}
          </h4>
          <p className="text-slate-400 font-medium max-w-xs mx-auto z-10 leading-relaxed text-[15px]">
            {stats.netProfit >= 0 
              ? "Your clinical operation is sustainable. Performance indicators suggest capital reinvestment readiness." 
              : "Negative variance detected. Fiscal auditing of operational overhead is recommended."}
          </p>
        </div>
      </div>
      
      <div className="pt-12 text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border border-slate-100 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Live Audit Report Generated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

const AppointmentManager = ({ patients, appointments }: { patients: Patient[], appointments: any[] }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAppt, setNewAppt] = useState({ 
    patientId: '', 
    time: '09:00', 
    status: 'scheduled' as 'scheduled' | 'blocked',
    notes: '' 
  });

  const slots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const apptsForDate = appointments.filter(a => a.date === selectedDate);
  const bookedSlots = apptsForDate.map(a => a.time);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const patient = patients.find(p => p.id === newAppt.patientId);
    if (!patient) return;

    try {
      setIsSubmitting(true);
      
      const appointmentData: any = {
        date: selectedDate,
        time: newAppt.time,
        status: newAppt.status,
        notes: newAppt.notes
      };

      if (newAppt.status === 'scheduled') {
        const patient = patients.find(p => p.id === newAppt.patientId);
        if (!patient) throw new Error("Patient required for scheduled slots");
        appointmentData.patientId = patient.id;
        appointmentData.patientName = patient.name;
        appointmentData.patientPhone = patient.phone;
      } else {
        appointmentData.patientName = "Administrative Block";
        appointmentData.patientId = "system-block";
      }

      await saveAppointment(appointmentData);
      
      setNewAppt({ patientId: '', time: '09:00', status: 'scheduled', notes: '' });
      setShowModal(false);
    } catch (error) {
      console.error("Booking failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: any) => {
    await updateAppointmentStatus(id, status);
  };

  const sendReminder = (appt: any) => {
    const text = `Hi ${appt.patientName}, this is a reminder for your physiotherapy appointment at FitRevive on ${appt.date} at ${appt.time}. See you soon!`;
    const url = `https://wa.me/${appt.patientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-10 animate-in p-2">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-100 pb-10 gap-8 md:gap-0">
        <div>
           <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-blue-50 text-primary flex items-center justify-center">
              <Calendar className="w-4 h-4 md:w-5 md:h-5 shadow-sm" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Queue Matrix</span>
          </div>
          <h1 className="text-3xl md:text-5xl display-heading text-slate-900 leading-tight md:leading-none">Booking Grid</h1>
          <p className="text-sm md:text-[15px] text-slate-500 font-semibold mt-2 md:mt-3">Slot management and patient logistics for clinical sessions</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
          <div className="relative group flex-1 sm:flex-initial">
            <CalendarCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-300 group-focus-within:text-primary transition-colors" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 md:py-4 rounded-[20px] md:rounded-[24px] bg-white border border-slate-100 shadow-sm font-black text-[12px] md:text-[13px] text-slate-600 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-primary text-white px-6 md:px-8 py-3.5 md:py-4.5 rounded-[20px] md:rounded-[24px] font-black text-[12px] md:text-[13px] uppercase tracking-widest shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span>Secure New Slot</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
        <div className="panel bg-white/40 backdrop-blur-sm border-none shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map(slot => {
              const appt = apptsForDate.find(a => a.time === slot);
              return (
                <div 
                  key={slot}
                  className={cn(
                    "p-7 rounded-[40px] border-2 transition-all group relative overflow-hidden",
                    appt 
                      ? appt.status === 'blocked'
                        ? "bg-slate-50 border-slate-100 border-dashed"
                        : "bg-slate-900 border-slate-800 text-white shadow-2xl shadow-black/20" 
                      : "bg-white border-slate-50 hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(14,165,233,0.08)]"
                  )}
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all", 
                        appt 
                          ? appt.status === 'blocked' 
                            ? "bg-amber-50 text-amber-500" 
                            : "bg-white/10 text-primary" 
                          : "bg-slate-50 text-slate-300 group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                         <Clock className="w-5 h-5 shadow-sm" />
                      </div>
                      <span className={cn("font-mono font-bold text-xl tracking-tighter tabular-nums", 
                        appt 
                          ? appt.status === 'blocked' ? "text-slate-400" : "text-white" 
                          : "text-slate-900"
                      )}>{slot}</span>
                    </div>
                    {appt && (
                      <div className={cn(
                        "w-2 h-2 rounded-full animate-pulse",
                        appt.status === 'scheduled' ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" :
                        appt.status === 'completed' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : 
                        appt.status === 'blocked' ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
                      )}></div>
                    )}
                  </div>

                  {appt ? (
                    <div className="space-y-6">
                      <div>
                        <div className={cn("font-extrabold text-lg leading-tight mb-1 transition-colors", appt.status === 'blocked' ? "text-slate-400" : "group-hover:text-primary")}>
                          {appt.patientName}
                        </div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <Activity className={cn("w-3 h-3", appt.status === 'blocked' ? "text-amber-500" : "text-slate-500")} />
                           {appt.status === 'blocked' ? 'Maintenance / Reserved' : appt.patientPhone}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {appt.status === 'scheduled' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(appt.id, 'completed')}
                              className="flex-1 bg-white/10 hover:bg-emerald-500 hover:text-white border border-white/5 p-3 rounded-2xl transition-all shadow-lg text-emerald-400"
                              title="Capture Performance"
                            ><BadgeCheck className="w-5 h-5 mx-auto" /></button>
                            <button 
                              onClick={() => sendReminder(appt)}
                              className="flex-1 bg-white/10 hover:bg-primary hover:text-white border border-white/5 p-3 rounded-2xl transition-all shadow-lg text-blue-400"
                              title="Broadcast Alert"
                            ><MessageSquare className="w-5 h-5 mx-auto" /></button>
                          </>
                        )}
                        {appt.status === 'blocked' && (
                           <button 
                              onClick={() => handleStatusChange(appt.id, 'cancelled')}
                              className="flex-1 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-100 p-3 rounded-2xl transition-all shadow-sm text-amber-600"
                              title="Unblock Time Node"
                            ><Unlock className="w-5 h-5 mx-auto" /></button>
                        )}
                        {appt.status !== 'blocked' && (
                          <button 
                            onClick={() => handleStatusChange(appt.id, 'cancelled')}
                            className="flex-1 bg-white/10 hover:bg-rose-500 hover:text-white border border-white/5 p-3 rounded-2xl transition-all shadow-lg text-rose-400"
                            title="Purge Slot"
                          ><X className="w-5 h-5 mx-auto" /></button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-50 rounded-[32px] group-hover:border-primary/20 group-hover:bg-primary/[0.02] transition-colors">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-200 group-hover:text-primary/40">Vacant Grid</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-8">
          <div className="glass-dark p-10 rounded-[48px] text-white overflow-hidden relative shadow-2xl">
             <Activity className="absolute -top-12 -right-12 w-48 h-48 text-white/[0.03] rotate-12 pointer-events-none" />
             <h3 className="display-heading text-2xl mb-8 flex items-center gap-3 relative z-10">
              <ClipboardList className="w-6 h-6 text-primary glow" />
              Pulse Audit
            </h3>
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Scheduled Queue</span>
                <span className="text-2xl font-bold font-mono tracking-tighter text-blue-400">{apptsForDate.filter(a => a.status === 'scheduled').length}</span>
              </div>
              <div className="w-full h-[1px] bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Inaccessible Nodes</span>
                <span className="text-2xl font-bold font-mono tracking-tighter text-amber-400">{apptsForDate.filter(a => a.status === 'blocked').length}</span>
              </div>
              <div className="w-full h-[1px] bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Processed Cases</span>
                <span className="text-2xl font-bold font-mono tracking-tighter text-emerald-400">{apptsForDate.filter(a => a.status === 'completed').length}</span>
              </div>
              <div className="w-full h-[1px] bg-white/10"></div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Aborted Nodes</span>
                <span className="text-2xl font-bold font-mono tracking-tighter text-rose-400">{apptsForDate.filter(a => a.status === 'cancelled').length}</span>
              </div>
            </div>

            <div className="mt-12 p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 relative z-10">
               <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                 <TrendingUp className="w-5 h-5" />
               </div>
               <div className="flex-1">
                 <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Load Optimization</div>
                 <div className="text-sm font-bold">Grid operating at {Math.round(((apptsForDate.filter(a => a.status !== 'cancelled').length) / slots.length) * 100)}% capacity</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-[40px] md:rounded-[56px] w-full max-w-xl shadow-2xl p-8 md:p-12 animate-in zoom-in-95 relative overflow-hidden border border-white/20">
            <Activity className="absolute -bottom-20 -left-20 w-80 h-80 text-slate-50 pointer-events-none" />
            <div className="flex justify-between items-center mb-8 md:mb-10 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Slot Allocation Protocol</span>
                <h2 className="text-4xl display-heading tracking-tighter">Allocate Clinical Slot</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="w-14 h-14 flex items-center justify-center bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-[24px] text-slate-400 transition-all active:scale-95 shadow-sm">
                <X className="w-7 h-7" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-10 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4">Node Directive Type</label>
                  <div className="flex bg-slate-50 p-2 rounded-[24px]">
                    <button 
                      type="button"
                      onClick={() => setNewAppt({...newAppt, status: 'scheduled'})}
                      className={cn("flex-1 py-4 rounded-[18px] font-black text-[11px] uppercase tracking-widest transition-all", 
                        newAppt.status === 'scheduled' ? "bg-white text-primary shadow-sm" : "text-slate-400")}
                    >Patient Interaction</button>
                    <button 
                      type="button"
                      onClick={() => setNewAppt({...newAppt, status: 'blocked'})}
                      className={cn("flex-1 py-4 rounded-[18px] font-black text-[11px] uppercase tracking-widest transition-all", 
                        newAppt.status === 'blocked' ? "bg-white text-amber-500 shadow-sm" : "text-slate-400")}
                    >Maintenance Block</button>
                  </div>
                </div>
                
                {newAppt.status === 'scheduled' && (
                  <div className="md:col-span-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4">Patient Oracle Link</label>
                    <select 
                      required
                      value={newAppt.patientId}
                      onChange={e => setNewAppt({...newAppt, patientId: e.target.value})}
                      className="w-full px-8 py-5 rounded-[28px] bg-slate-50 border-none font-black text-[15px] text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Query Registry...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4">Chronos Slot</label>
                  <select 
                    required
                    value={newAppt.time}
                    onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                    className="w-full px-8 py-5 rounded-[28px] bg-slate-50 border-none font-black text-[15px] text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                  >
                    {slots.map(s => (
                      <option key={s} value={s} disabled={bookedSlots.includes(s)}>
                        {s} {bookedSlots.includes(s) ? '(Inaccessible)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest block mb-4">Target Signature Date</label>
                  <div className="px-8 py-5 rounded-[28px] bg-slate-100 font-mono font-black text-slate-400 text-lg tabular-nums flex items-center justify-center">{selectedDate}</div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4">Strategic Treatment Notes</label>
                <textarea 
                  placeholder="Annotate goals for this clinical node..."
                  value={newAppt.notes}
                  onChange={e => setNewAppt({...newAppt, notes: e.target.value})}
                  className="w-full px-8 py-6 rounded-[32px] bg-slate-50 border-none font-bold text-slate-600 focus:ring-4 focus:ring-primary/10 h-32 resize-none transition-all"
                ></textarea>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full py-6 bg-slate-950 text-white rounded-[32px] font-black text-[15px] uppercase tracking-[0.25em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all group",
                  isSubmitting && "opacity-50 cursor-not-allowed"
                )}
              >
                 <div className="flex items-center justify-center gap-3">
                   {isSubmitting ? (
                     <Activity className="w-5 h-5 animate-spin text-primary" />
                   ) : (
                     <BadgeCheck className="w-5 h-5 text-primary group-hover:scale-125 transition-transform" />
                   )}
                   <span>{isSubmitting ? 'Synchronizing Node...' : 'Commit Slot Allocation'}</span>
                 </div>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TeamManager = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', role: '', phone: '' });

  useEffect(() => {
    const unsubMembers = getTeamMembers(setMembers);
    const unsubAttendance = getAttendance(selectedDate, setAttendance);
    return () => { unsubMembers(); unsubAttendance(); };
  }, [selectedDate]);

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveTeamMember(newMember);
    setShowMemberModal(false);
    setNewMember({ name: '', role: '', phone: '' });
  };

  const markAttendance = async (member: any, status: 'present' | 'absent' | 'late') => {
    const checkIn = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await logAttendance({
      memberId: member.id,
      memberName: member.name,
      date: selectedDate,
      checkIn: status === 'absent' ? '' : checkIn,
      status
    });
  };

  return (
    <div className="space-y-10 animate-in p-2">
      <header className="flex justify-between items-end border-b border-slate-100 pb-10">
        <div>
          <h1 className="text-5xl display-heading text-slate-900 leading-none">Personnel</h1>
          <p className="text-[15px] text-slate-500 font-semibold mt-3">Team synchronization and clinical attendance records</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <input 
              type="date" 
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="pl-6 pr-6 py-4 rounded-[24px] bg-white border border-slate-100 shadow-sm font-black text-[13px] text-slate-600 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => setShowMemberModal(true)}
            className="bg-slate-950 text-white px-8 py-4.5 rounded-[24px] font-black text-[13px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:scale-[1.03] active:scale-95 transition-all"
          >
            <Plus className="w-5 h-5 text-primary" />
            <span>Induct Member</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10">
        <div className="panel">
          <div className="panel-header glass-light">
            <span className="text-xl display-heading text-slate-900 tracking-tight">Attendance Protocol</span>
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedDate}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left data-table">
              <thead>
                <tr>
                  <th>Clinical Agent</th>
                  <th>Position</th>
                  <th>Time Signature</th>
                  <th className="text-right">Allocation</th>
                </tr>
              </thead>
              <tbody>
                {members.map(member => {
                  const record = attendance.find(a => a.memberId === member.id);
                  return (
                    <tr key={member.id} className="group hover:bg-slate-50/50 transition-all cursor-pointer">
                      <td>
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-[16px] bg-slate-950 text-primary flex items-center justify-center font-black text-xs shadow-lg">
                            {member.name.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{member.name}</span>
                            <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.1em] mt-0.5 tabular-nums">ID: {member.id.substring(0,6)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="font-bold text-slate-400 text-sm italic">{member.role}</td>
                      <td>
                        {record ? (
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                record.status === 'present' ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" :
                                record.status === 'late' ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]"
                              )}></div>
                              <span className={cn(
                                "text-[11px] font-black uppercase tracking-wider",
                                record.status === 'present' ? "text-emerald-600" :
                                record.status === 'late' ? "text-amber-600" : "text-rose-500"
                              )}>{record.status}</span>
                            </div>
                            {record.checkIn && <span className="text-[10px] font-bold text-slate-300 mt-1 uppercase ml-3.5 italic">Logged At {record.checkIn}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-200 font-bold text-[11px] uppercase tracking-widest italic">Awaiting Log...</span>
                        )}
                      </td>
                      <td className="text-right">
                        {!record && (
                          <div className="flex justify-end gap-2 pr-2">
                            <button 
                              onClick={() => markAttendance(member, 'present')}
                              className="w-10 h-10 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Mark Present"
                            ><BadgeCheck className="w-5 h-5" /></button>
                            <button 
                              onClick={() => markAttendance(member, 'late')}
                              className="w-10 h-10 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                              title="Mark Late"
                            ><Clock className="w-5 h-5" /></button>
                            <button 
                              onClick={() => markAttendance(member, 'absent')}
                              className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                              title="Mark Absent"
                            ><X className="w-5 h-5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden border-none shadow-2xl shadow-slate-900/5">
           <div className="bg-slate-950 p-10 text-white h-full relative flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="grid grid-cols-6 h-full border-l border-white/10">
                {Array.from({length: 6}).map((_, i) => <div key={i} className="border-r border-white/10"></div>)}
              </div>
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 block">Staff Matrix</span>
                   <h3 className="text-3xl display-heading">Team Directory</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                   <Users className="w-6 h-6 text-primary glow" />
                </div>
              </div>

              <div className="space-y-4">
                {members.map(member => (
                  <div key={member.id} className="group p-5 rounded-[28px] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-[18px] bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary group-hover:scale-110 transition-transform">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-white tracking-tight">{member.name}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-0.5">{member.role}</div>
                        </div>
                      </div>
                      <button className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="p-16 text-center text-slate-500 italic text-sm">Awaiting clinical team expansion...</div>
                )}
              </div>

              <button className="w-full mt-10 py-5 border border-white/10 rounded-3xl font-black uppercase text-[11px] tracking-[0.3em] hover:bg-white hover:text-black transition-all">
                Registry Archive
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMemberModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 md:p-6">
          <div className="bg-white rounded-[40px] md:rounded-[56px] w-full max-w-xl shadow-2xl p-8 md:p-12 animate-in zoom-in-95 relative border border-white/20 overflow-hidden">
            <Activity className="absolute -bottom-20 -right-20 w-80 h-80 text-slate-50 pointer-events-none" />
            <div className="flex justify-between items-center mb-8 md:mb-10 relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Personnel Induction</span>
                <h2 className="text-4xl display-heading tracking-tighter">New Clinical Agent</h2>
              </div>
              <button 
                onClick={() => setShowMemberModal(false)} 
                className="w-14 h-14 flex items-center justify-center bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-[24px] text-slate-400 transition-all active:scale-95 shadow-sm"
              >
                <X className="w-7 h-7" />
              </button>
            </div>
            <form onSubmit={handleMemberSubmit} className="space-y-8 relative z-10">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4">Agent Name</label>
                <input required placeholder="Full Identity Signature" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})}
                  className="w-full px-8 py-5 rounded-[28px] bg-slate-50 border-none font-bold text-[15px] text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4">Clinical Designation</label>
                  <input required placeholder="e.g. Lead Therapist" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}
                    className="w-full px-8 py-5 rounded-[28px] bg-slate-50 border-none font-bold text-[15px] text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-4">Comms Channel</label>
                  <input required placeholder="Phone / Contact" value={newMember.phone} onChange={e => setNewMember({...newMember, phone: e.target.value})}
                    className="w-full px-8 py-5 rounded-[28px] bg-slate-50 border-none font-bold text-[15px] text-slate-600 focus:ring-4 focus:ring-primary/10 transition-all outline-none" />
                </div>
              </div>
              <button type="submit" className="w-full py-6 bg-slate-950 text-white rounded-[32px] font-black text-[15px] uppercase tracking-[0.25em] shadow-2xl shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all">
                Authorize Personnel Induction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Login = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="atmosphere absolute w-full h-full inset-0"></div>
        <div className="grid grid-cols-12 h-full gap-px border-l border-white/[0.03]">
          {Array.from({length: 12}).map((_, i) => (
            <div key={i} className="border-r border-white/[0.03] h-full relative">
               <div className="absolute top-1/4 left-0 w-full h-[1px] bg-white/[0.05]"></div>
               <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/[0.05]"></div>
               <div className="absolute top-3/4 left-0 w-full h-[1px] bg-white/[0.05]"></div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-md w-full glass-dark p-8 md:p-12 rounded-[32px] md:rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] relative z-10 border border-white/5 animate-in zoom-in-95">
        <div className="mb-10 md:mb-12 text-center">
          <div className="mb-8 md:mb-10 flex justify-center group">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[28px] md:rounded-[32px] bg-gradient-to-br from-primary to-primary-dark p-0.5 shadow-[0_0_40px_rgba(14,165,233,0.3)] group-hover:scale-105 transition-transform duration-500 overflow-hidden">
               <div className="w-full h-full bg-slate-950 rounded-[26px] md:rounded-[30px] flex items-center justify-center overflow-hidden">
                 <img 
                    src="/logo-2.jpg" 
                    alt="FitRevive Logo" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
               </div>
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2">FitRevive</h1>
          <p className="text-slate-500 font-bold uppercase tracking-[0.25em] text-[9px] md:text-[10px]">Clinical Operating System</p>
        </div>

        <div className="space-y-8">
          <button 
            onClick={signIn}
            className="w-full flex items-center justify-center gap-4 bg-white text-slate-950 py-5 rounded-[24px] font-black text-[15px] uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 rounded-sm" />
            Connect via Google
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/[0.06]"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-slate-950 px-5 font-black text-slate-600 tracking-[0.3em]">Authorized Bio-Access</span></div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500/80 leading-relaxed text-center justify-center italic">
            <BadgeCheck className="w-4 h-4 text-primary" />
            HIPAA Compliant Environment
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">
        © 2026 FitRevive Cloud Architecture
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    activePatients: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    netProfit: 0
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubPatients = getPatients(setPatients);
    const unsubAppointments = getAppointments(setAppointments);
    const unsubTransactions = getTransactions(setTransactions);
    const unsubStats = fetchDashboardStats(setStats);

    return () => {
      unsubPatients();
      unsubAppointments();
      unsubTransactions();
      unsubStats();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
          <Activity className="w-12 h-12 text-[#0EA5E9] animate-bounce" />
          <p className="mt-4 font-bold text-slate-400 uppercase tracking-widest text-xs tracking-widest">Loading CLINIC OS...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <main className="md:pl-[260px] min-h-screen">
        {/* Mobile Top Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden border border-slate-100">
              <img 
                src="/logo-2.jpg" 
                alt="FitRevive Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-black text-slate-900 tracking-tighter">FitRevive</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 bg-slate-50 rounded-xl text-slate-500"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="max-w-[1340px] mx-auto p-4 md:p-10 lg:px-12 lg:py-10 pb-24">
          {activeTab === 'dashboard' && <Dashboard stats={stats} transactions={transactions} />}
          {activeTab === 'appointments' && <AppointmentManager appointments={appointments} patients={patients} />}
          {activeTab === 'patients' && <PatientManager patients={patients} />}
          {activeTab === 'finances' && <FinanceTracker transactions={transactions} />}
          {activeTab === 'team' && <TeamManager />}
          {activeTab === 'reports' && <Reports stats={stats} transactions={transactions} />}
        </div>
      </main>
    </div>
  );
}
