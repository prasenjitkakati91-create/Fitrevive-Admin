import React from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';

const SplashScreen = ({ logo }: { logo: string }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#0b0f1a] transition-colors duration-500">
      {/* Background Ambient Shapes */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-400/10 dark:bg-teal-600/10 blur-[120px] animate-pulse delay-1000" />
      
      {/* Subtle Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -20, 0]
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
          className="absolute w-2 h-2 rounded-full bg-blue-500/20 dark:bg-blue-400/20 blur-sm"
          style={{
            top: `${20 + i * 15}%`,
            left: `${15 + i * 12}%`,
          }}
        />
      ))}

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-12"
        >
          {/* Pulsing Outer Rings */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-8 rounded-full border-2 border-blue-500/20 blur-[2px]"
          />
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -inset-16 rounded-full border border-teal-500/10 blur-[4px]"
          />
          
          {/* Glassmorphism Logo Box */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative w-32 h-32 rounded-[2.5rem] bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center p-4 overflow-hidden group"
          >
            {/* Shimmer overlay */}
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent skew-x-12"
            />
            
            <img 
              src={logo} 
              alt="FitRevive" 
              className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:rotate-3"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          {/* Logo Glow */}
          <div className="absolute -inset-4 bg-blue-500/20 dark:bg-blue-400/10 blur-3xl -z-10 rounded-full" />
        </motion.div>

        {/* Text Section */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
              FitRevive <span className="text-blue-600 dark:text-blue-400">Clinic</span>
            </h1>
            <div className="flex items-center justify-center gap-3">
               <motion.span 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 0.5 }} 
                 transition={{ delay: 0.6 }}
                 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]"
               >
                 Care
               </motion.span>
               <span className="w-1 h-1 rounded-full bg-blue-500/30" />
               <motion.span 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 0.5 }} 
                 transition={{ delay: 0.8 }}
                 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]"
               >
                 Recovery
               </motion.span>
               <span className="w-1 h-1 rounded-full bg-blue-500/30" />
               <motion.span 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 0.5 }} 
                 transition={{ delay: 1.0 }}
                 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]"
               >
                 Strength
               </motion.span>
            </div>
          </motion.div>

          {/* Premium Progress Section */}
          <div className="pt-12 w-64 mx-auto">
            <div className="relative h-[3px] w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
              >
                {/* Shimmer line */}
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                />
              </motion.div>
            </div>
            
            <motion.p
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-4 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest"
            >
              Syncing Clinical Records...
            </motion.p>
          </div>
        </div>
      </div>

      {/* Modern Waveform at bottom (decorative) */}
      <div className="absolute bottom-[-20%] inset-x-0 h-[40%] bg-gradient-to-t from-blue-500/5 to-transparent pointer-none" />
    </div>
  );
};

export default SplashScreen;
