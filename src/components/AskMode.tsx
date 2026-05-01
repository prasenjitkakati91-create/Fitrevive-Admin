import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Sparkles, X, Send, Bot, User, Loader2, Sparkle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { askAI } from '../geminiService';

interface AskModeProps {
  patients: any[];
  appointments: any[];
  transactions: any[];
  stats: any;
}

export const AskMode: React.FC<AskModeProps> = ({ patients, appointments, transactions, stats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! I'm your Clinic AI Assistant. Ask me anything about your patients, appointments, or clinic financials." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleAsk = async () => {
    if (!query.trim() || isLoading) return;

    const userQuery = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userQuery }]);
    setIsLoading(true);

    // Prepare context for the AI
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAppts = appointments.filter(a => a.date === todayStr);
    
    const context = {
      patientsCount: patients.length,
      appointmentsToday: todayAppts.length,
      activePatients: stats.activePatients,
      monthlyRevenue: stats.monthlyRevenue,
      todaySchedule: todayAppts.map(a => ({
        patient: a.patientName,
        time: a.time,
        status: a.status,
        type: a.sessionType
      })),
      recentPatients: patients.slice(-5).map(p => ({
        name: p.name,
        condition: p.condition,
        status: p.treatmentStatus
      }))
    };

    const answer = await askAI(userQuery, context);
    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed top-4 md:top-auto md:bottom-6 right-4 md:right-6 w-11 h-11 md:w-14 md:h-14 bg-indigo-600 text-white rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center z-[101] group"
      >
        <div className="md:hidden">
          <Bot className="w-5 h-5" />
        </div>
        <div className="hidden md:block">
          <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </div>
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 md:w-4 md:h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse"></div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 md:top-auto md:bottom-24 right-4 md:right-6 w-[calc(100vw-32px)] md:w-96 h-[60vh] md:h-[500px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-[101] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">FitRevive Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">AI Mode Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50"
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 border border-slate-100 shadow-sm'}`}>
                      {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-500" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'}`}>
                      {m.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 max-w-[85%]">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white text-slate-400 border border-slate-100 shadow-sm">
                      <Bot className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="p-3 bg-white text-slate-700 shadow-sm border border-slate-100 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                      <span className="text-xs italic font-medium text-slate-400">Assistant is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  placeholder="Ask me anything..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                />
                <button
                  onClick={handleAsk}
                  disabled={!query.trim() || isLoading}
                  className="absolute right-2 top-1.5 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-2 font-medium italic">
                AI can make mistakes. Verify important patient data.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
