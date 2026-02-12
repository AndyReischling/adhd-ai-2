'use client';

import { motion } from 'framer-motion';
import PageTransition from '@/components/layout/PageTransition';
import CompanySearch from '@/components/project/CompanySearch';

export default function ProjectPage() {
  return (
    <PageTransition>
      <section className="min-h-screen flex flex-col items-center justify-center bg-black-primary px-6 -mt-16 pt-16">
        {/* Corner label */}
        <div className="fixed top-24 left-8 font-accent text-[10px] tracking-[0.4em] text-gray-800 -rotate-1">
          FORM 001-A
        </div>

        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-5xl md:text-7xl mb-4"
          >
            Select Your Subject
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-mono text-sm tracking-[0.2em] text-gray-400"
          >
            CHOOSE A COMPANY. WE&apos;LL MODEL ITS DOOM.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="w-full max-w-2xl"
        >
          <CompanySearch />
        </motion.div>
      </section>
    </PageTransition>
  );
}
