'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const terminalLines = [
  { agent: 'NADIA', text: 'Initializing scenario model...', color: '#C4A44A', delay: 0 },
  { agent: 'THE ARCHIVIST', text: 'Pulling regulatory history... 847 incidents found.', color: '#5B8CFF', delay: 1200 },
  { agent: 'THE ARCHIVIST', text: 'Cross-referencing industry failure database...', color: '#5B8CFF', delay: 2400 },
  { agent: 'BORIS', text: 'This company has a magnificent vulnerability.', color: '#C23B22', delay: 3800 },
  { agent: 'GREMLIN', text: 'lol they\'re so cooked', color: '#39FF14', delay: 5000 },
  { agent: 'NADIA', text: 'Probability matrices converging. 12 viable collapse vectors identified.', color: '#C4A44A', delay: 6200 },
  { agent: 'COMRADE PIXEL', text: 'Every empire contains the seed of its own eulogy.', color: '#FF6B9D', delay: 7500 },
  { agent: 'BORIS', text: 'I see the campaign already. It will be MAGNIFICENT.', color: '#C23B22', delay: 8800 },
  { agent: 'NADIA', text: 'Scenario generation complete. Compiling dossier...', color: '#C4A44A', delay: 10000 },
];

export default function AnalysisLoadingScreen() {
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const timers = terminalLines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black-primary px-6">
      {/* Pulsing red glow */}
      <div className="absolute inset-0 bg-gradient-radial from-red-primary/[0.03] to-transparent animate-pulse" />

      <div className="relative max-w-2xl w-full">
        {/* Header */}
        <div className="font-mono text-xs text-gray-600 mb-6 tracking-[0.3em]">
          ANALYSIS IN PROGRESS
        </div>

        {/* Progress bar */}
        <div className="w-full h-[3px] bg-gray-800 mb-8">
          <motion.div
            className="h-full bg-red-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${(visibleLines / terminalLines.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Terminal output */}
        <div className="space-y-3">
          {terminalLines.slice(0, visibleLines).map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="font-mono text-sm"
            >
              <span style={{ color: line.color }}>[{line.agent}]</span>{' '}
              <span className="text-gray-400">{line.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Blinking cursor at end */}
        {visibleLines > 0 && (
          <div
            className="mt-4 w-2 h-4 bg-red-primary"
            style={{ animation: 'cursor-blink 1s step-end infinite' }}
          />
        )}
      </div>
    </div>
  );
}
