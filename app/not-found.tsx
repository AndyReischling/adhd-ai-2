'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black-primary px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        <div className="font-accent text-6xl md:text-8xl text-red-primary mb-4">
          404
        </div>
        <h1 className="font-display text-2xl md:text-3xl text-off-white mb-4">
          THIS DOSSIER DOES NOT EXIST
        </h1>
        <p className="font-mono text-sm text-gray-400 mb-8 tracking-[0.1em]">
          THE REQUESTED DOCUMENT HAS BEEN REDACTED, RELOCATED, OR WAS NEVER
          AUTHORIZED FOR DISTRIBUTION. THE COLLECTIVE DENIES ALL KNOWLEDGE.
        </p>
        <Button variant="primary" onClick={() => router.push('/')}>
          RETURN TO BASE
        </Button>
      </motion.div>
    </div>
  );
}
