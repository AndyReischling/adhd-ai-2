'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black-primary">
      {/* Constructivist loading animation */}
      <div className="relative w-32 h-32 mb-8">
        <motion.div
          className="absolute inset-0 border-2 border-red-primary"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 border-2 border-gold-accent"
          animate={{ rotate: -360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-4 border-2 border-gray-600"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-red-primary" />
        </div>
      </div>

      {/* Soviet progress bar */}
      <div className="w-48 h-[3px] bg-gray-800 overflow-hidden">
        <motion.div
          className="h-full bg-red-primary"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: '50%' }}
        />
      </div>

      <p className="font-mono text-[10px] text-gray-600 tracking-[0.3em] mt-4">
        THE COLLECTIVE IS ASSEMBLING
      </p>
    </div>
  );
}
