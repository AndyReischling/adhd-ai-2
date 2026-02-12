'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black-primary px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        <div className="font-accent text-4xl md:text-5xl text-red-primary mb-4 tracking-[0.3em]">
          ERROR
        </div>
        <h1 className="font-display text-xl md:text-2xl text-off-white mb-4">
          THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION
        </h1>
        <p className="font-mono text-sm text-gray-400 mb-8 tracking-[0.1em]">
          A SYSTEMIC INCONGRUITY HAS BEEN DETECTED. THE COLLECTIVE IS AWARE AND
          IS RECALIBRATING THE RELEVANT SUBSYSTEMS. PLEASE STAND BY.
        </p>
        <Button variant="primary" onClick={reset}>
          REINITIALIZE
        </Button>
      </motion.div>
    </div>
  );
}
