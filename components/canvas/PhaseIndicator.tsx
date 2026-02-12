'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';

const phaseConfig: Record<string, { label: string; number: string }> = {
  research: { label: 'RESEARCH & BRIEF', number: 'I' },
  ideation: { label: 'IDEATION', number: 'II' },
  production: { label: 'ASSET PRODUCTION', number: 'III' },
  finalization: { label: 'FINALIZATION', number: 'IV' },
  export: { label: 'CAMPAIGN COMPLETE', number: 'V' },
  complete: { label: 'CAMPAIGN COMPLETE', number: '✓' },
};

export default function PhaseIndicator() {
  const { canvasPhase, isComplete } = useCanvasStore();

  const config = phaseConfig[canvasPhase] || phaseConfig.research;

  return (
    <div className="fixed top-20 left-4 z-40">
      <AnimatePresence mode="wait">
        <motion.div
          key={canvasPhase}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-gray-900/90 border border-gray-800 backdrop-blur-sm px-4 py-3"
        >
          <div className="font-mono text-[10px] tracking-[0.3em] text-gray-600 mb-1">
            PHASE {config.number}
          </div>
          <div
            className={`font-mono text-xs tracking-[0.2em] ${
              isComplete ? 'text-gold-accent' : 'text-red-primary'
            }`}
          >
            {config.label}
          </div>

          {/* Phase progress dots */}
          {!isComplete && (
            <div className="flex gap-1 mt-2">
              {Object.keys(phaseConfig).slice(0, 5).map((phase) => (
                <div
                  key={phase}
                  className={`w-2 h-2 ${
                    phase === canvasPhase
                      ? 'bg-red-primary'
                      : Object.keys(phaseConfig).indexOf(phase) <
                        Object.keys(phaseConfig).indexOf(canvasPhase)
                      ? 'bg-gray-400'
                      : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Campaign Complete banner */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 bg-gold-accent/10 border border-gold-accent px-4 py-2"
          >
            <div className="font-accent text-sm tracking-[0.3em] text-gold-accent text-center">
              CAMPAIGN COMPLETE
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
