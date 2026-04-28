import React from 'react';
import { motion } from 'motion/react';

const SplashScreen = ({ logo }: { logo: string }) => {
  // Stagger variants for the tagline
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.8
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 0.5, y: 0 }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#0b0f1a] transition-colors duration-500 font-sans">
      {/* Background Ambient Shapes */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.12, 0.05],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.15, 0.05],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-600/20 blur-[120px]" 
      />
      
      {/* Dynamic Background Particles */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.3, 0],
            scale: [0.5, 1, 0.5],
            y: [0, -100],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5
          }}
          className="absolute w-1 h-1 rounded-full bg-blue-400/40 blur-[1px]"
          style={{
            bottom: "0%",
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      <div className="relative flex flex-col items-center">
        {/* Succession Entrance Logo Stack */}
        <div className="relative mb-16 flex items-center justify-center">
          {/* Outer Sonar Rings (Successive) */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0, 0.2, 0],
                scale: [0.8, 2.2],
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                delay: i * 0.8,
                ease: "easeOut" 
              }}
              className="absolute w-36 h-36 rounded-full border border-blue-400/30"
            />
          ))}

          {/* Central Orbiting Dot */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute w-48 h-48 rounded-full border border-dashed border-slate-200 dark:border-white/10 opacity-40"
          >
             <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
          </motion.div>
          
          {/* Main Logo Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              rotate: 0,
              y: [0, -8, 0]
            }}
            transition={{ 
              opacity: { duration: 0.4 },
              scale: { type: "spring", stiffness: 260, damping: 20 },
              rotate: { duration: 0.8, ease: "anticipate" },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }
            }}
            className="relative w-36 h-36 rounded-full bg-white dark:bg-white/10 backdrop-blur-3xl border border-white dark:border-white/20 shadow-[0_32px_64px_-16px_rgba(37,99,235,0.2)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] flex items-center justify-center p-6 z-20"
          >
            <motion.img 
              src={logo} 
              alt="Logo" 
              className="w-full h-full object-contain relative z-10 rounded-full"
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              referrerPolicy="no-referrer"
            />
            
            {/* Rapid Shine Beam */}
            <motion.div
              animate={{ x: ['-250%', '250%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 dark:via-white/10 to-transparent skew-x-25 z-20 pointer-events-none"
            />
          </motion.div>

          {/* Core Glow */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -inset-10 bg-blue-500/20 dark:bg-blue-400/10 blur-[80px] -z-10 rounded-full" 
          />
        </div>

        {/* Text Section (Succession) */}
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
              FitRevive <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">Clinic</span>
            </h1>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center gap-3"
            >
               <motion.span variants={itemVariants} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Care</motion.span>
               <motion.span variants={itemVariants} className="w-1 h-1 rounded-full bg-blue-400/40" />
               <motion.span variants={itemVariants} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Recovery</motion.span>
               <motion.span variants={itemVariants} className="w-1 h-1 rounded-full bg-blue-400/40" />
               <motion.span variants={itemVariants} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Strength</motion.span>
            </motion.div>
          </motion.div>

          {/* Interactive Loading Indicators */}
          <div className="pt-16 w-72 mx-auto">
            <div className="relative h-[2px] w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden mb-6">
              <motion.div
                initial={{ width: "0%", left: "-100%" }}
                animate={{ width: ["20%", "40%", "20%"], left: ["-20%", "100%", "110%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-0 bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.8)]"
              />
            </div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex gap-2">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ 
                      y: [0, -4, 0],
                      backgroundColor: ['#94a3b8', '#3b82f6', '#94a3b8']
                    }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                    className="w-1.5 h-1.5 rounded-full"
                  />
                ))}
              </div>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] animate-pulse">
                Establishing Neural Link
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Atmospheric Soft Light (Bottom) */}
      <div className="absolute bottom-[-15%] inset-x-0 h-[40%] bg-gradient-to-t from-blue-600/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default SplashScreen;
