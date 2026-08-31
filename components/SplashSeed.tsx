'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashSeedProps {
  onFinish: () => void;
}

export const SplashSeed: React.FC<SplashSeedProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onFinish, 250);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 250);
    }, 750);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="splash-screen"
          onClick={handleDismiss}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25, ease: 'easeInOut' } }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FDFCF9] text-[#3D4B38] select-none cursor-pointer"
        >
          {/* Gentle organic leaf/seed sprouting animation */}
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            {/* Soft background aura */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.4, 0.2] }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-[#4A6741]/15 blur-md"
            />

            <svg
              className="w-16 h-16 text-[#4A6741]"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Ground line */}
              <motion.path
                d="M16 52C24 52 40 52 48 52"
                stroke="#E5E1D8"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.8 }}
                transition={{ duration: 0.5 }}
              />

              {/* Sprout stem */}
              <motion.path
                d="M32 52C32 40 32 32 32 24"
                stroke="#4A6741"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
              />

              {/* Left delicate leaf */}
              <motion.path
                d="M32 34C24 32 18 24 20 16C28 16 32 26 32 34Z"
                fill="#A3B18A"
                stroke="#4A6741"
                strokeWidth="1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.35, type: 'spring', damping: 12 }}
                style={{ originX: '32px', originY: '34px' }}
              />

              {/* Right golden delicate leaf tip */}
              <motion.path
                d="M32 26C38 23 44 16 42 9C34 10 32 19 32 26Z"
                fill="#D4AF37"
                stroke="#B88F1E"
                strokeWidth="1.5"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.9 }}
                transition={{ duration: 0.5, delay: 0.5, type: 'spring', damping: 12 }}
                style={{ originX: '32px', originY: '26px' }}
              />
            </svg>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="font-serif text-2xl font-normal tracking-wide text-[#3D4B38]"
          >
            Para Você
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="mt-1 text-xs tracking-wider text-[#8C867E] uppercase font-sans font-medium"
          >
            Uma história sendo escrita todos os dias
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
