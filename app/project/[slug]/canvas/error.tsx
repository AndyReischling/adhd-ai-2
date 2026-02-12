'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

export default function CanvasError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black-primary px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        <div className="font-accent text-4xl text-red-primary mb-4 tracking-[0.3em]">
          ERROR
        </div>
        <h1 className="font-display text-xl text-off-white mb-4">
          THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION
        </h1>
        <p className="font-mono text-sm text-gray-400 mb-8 tracking-[0.1em]">
          THE COLLECTIVE&apos;S CREATIVE ENGINE EXPERIENCED AN UNEXPECTED INTERRUPTION.
          THIS IS NOT A REFLECTION OF YOUR CORPORATE DOOM — THAT REMAINS INTACT.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="primary" onClick={reset}>
            REINITIALIZE
          </Button>
          <Button variant="ghost" onClick={() => window.location.href = '/project'}>
            RETURN TO SEARCH
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
