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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#0b0f1a] transition-colors duration-500">
      {/* Background Ambient Shapes */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.05, 0.1, 0.05],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/20 blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.05, 0.15, 0.05],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/20 blur-[120px]" 
      />
      
      {/* Dynamic Background Particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 0, 
            scale: Math.random() * 0.5 + 0.5,
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50
          }}
          animate={{ 
            opacity: [0.1, 0.4, 0.1],
            scale: [1, 1.1, 1],
            x: [0, (i % 2 === 0 ? 30 : -30), 0],
            y: [0, (i % 3 === 0 ? -40 : 40), 0]
          }}
          transition={{
            duration: 7 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.3
          }}
          className="absolute w-1.5 h-1.5 rounded-full bg-blue-500/30 dark:bg-blue-400/30 blur-[1px]"
          style={{
            top: `${10 + Math.random() * 80}%`,
            left: `${10 + Math.random() * 80}%`,
          }}
        />
      ))}

      <div className="relative flex flex-col items-center">
        {/* Animated Logo Section */}
        <div className="relative mb-14">
          {/* Advanced Rotating Rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-10 rounded-full border border-blue-500/10 border-t-blue-500/40 blur-[1px]"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-14 rounded-full border border-teal-500/5 border-b-teal-500/30 blur-[2px]"
          />
          
          {/* Secondary Pulse Waves */}
          <motion.div
            animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            className="absolute -inset-4 rounded-[2.8rem] border-2 border-blue-400/20"
          />
          
          {/* Logo Glass Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              rotate: 0,
              y: [0, -10, 0] 
            }}
            transition={{ 
              opacity: { duration: 1 },
              scale: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
              rotate: { duration: 1.2, ease: "easeOut" },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }
            }}
            className="relative w-36 h-36 rounded-[2.8rem] bg-white/90 dark:bg-white/10 backdrop-blur-2xl border border-white dark:border-white/20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] flex items-center justify-center p-6 overflow-hidden"
          >
            {/* Glossy Scanner Effect */}
            <motion.div
              animate={{ top: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              className="absolute inset-x-0 h-1/2 bg-gradient-to-b from-transparent via-blue-400/10 dark:via-white/5 to-transparent skew-y-12 pointer-events-none"
            />
            
            <motion.img 
              src={logo} 
              alt="Logo" 
              className="w-full h-full object-contain relative z-10"
              animate={{ rotate: [0, 2, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          {/* Core Glow */}
          <div className="absolute -inset-10 bg-blue-500/15 dark:bg-blue-400/10 blur-[80px] -z-10 rounded-full" />
        </div>

        {/* Brand Presence */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          >
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
              FitRevive <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">Clinic</span>
            </h1>
            
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center gap-3"
            >
               <motion.span variants={itemVariants} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em]">Care</motion.span>
               <motion.span variants={itemVariants} className="w-1 h-1 rounded-full bg-blue-500/40" />
               <motion.span variants={itemVariants} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em]">Recovery</motion.span>
               <motion.span variants={itemVariants} className="w-1 h-1 rounded-full bg-blue-500/40" />
               <motion.span variants={itemVariants} className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.25em]">Strength</motion.span>
            </motion.div>
          </motion.div>

          {/* Progress Engineering */}
          <div className="pt-16 w-72 mx-auto">
            <div className="relative h-[2px] w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%", left: "-100%" }}
                animate={{ width: ["20%", "60%", "30%"], left: ["-20%", "100%", "110%"] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-y-0 bg-gradient-to-r from-transparent via-blue-600 to-transparent shadow-[0_0_15px_rgba(37,99,235,0.6)]"
              />
            </div>
            
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-6 flex flex-col items-center gap-2"
            >
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">
                Authenticating Session
              </p>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full bg-blue-500"
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Atmospheric Soft Light (Bottom) */}
      <div className="absolute bottom-[-15%] inset-x-0 h-[40%] bg-gradient-to-t from-blue-500/10 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

export default SplashScreen;
