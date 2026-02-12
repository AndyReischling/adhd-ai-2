'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useProjectStore } from '@/store/projectStore';

interface TerminalLine {
  agent: string;
  text: string;
  color: string;
  delay: number;
}

function buildTerminalLines(companyName: string, sector: string): TerminalLine[] {
  return [
    { agent: 'NADIA', text: `Initializing threat assessment model for ${companyName}...`, color: '#C4A44A', delay: 800 },
    { agent: 'THE ARCHIVIST', text: `Querying institutional memory for ${sector} sector precedents...`, color: '#5B8CFF', delay: 2200 },
    { agent: 'NADIA', text: `Loading regulatory exposure data. ${companyName} flagged in 3 jurisdictions.`, color: '#C4A44A', delay: 3800 },
    { agent: 'THE ARCHIVIST', text: `Found 847 comparable incidents in sector database. Cross-referencing...`, color: '#5B8CFF', delay: 5200 },
    { agent: 'BORIS', text: `I have reviewed the brief. ${companyName} has a MAGNIFICENT vulnerability.`, color: '#C23B22', delay: 6800 },
    { agent: 'GREMLIN', text: `lol the data is already painting a picture. a very red picture.`, color: '#39FF14', delay: 8000 },
    { agent: 'NADIA', text: `Short-term risk vectors identified. Probability matrices converging at 0.87 confidence.`, color: '#C4A44A', delay: 9500 },
    { agent: 'BORIS', text: `Nadia, what is the PRIMARY threat? I need to know where to AIM the campaign.`, color: '#C23B22', delay: 11000 },
    { agent: 'NADIA', text: `Regulatory and reputational exposure are correlated. Both spike in Year 1 models.`, color: '#C4A44A', delay: 12500 },
    { agent: 'THE ARCHIVIST', text: `For context: the last ${sector} company to ignore this pattern was fined $2.3 billion.`, color: '#5B8CFF', delay: 14000 },
    { agent: 'COMRADE PIXEL', text: `Every empire contains the seed of its own eulogy. ${companyName} is no exception.`, color: '#FF6B9D', delay: 15500 },
    { agent: 'GREMLIN', text: `the 5-year outlook is wild. like, structurally wild. im seeing shapes.`, color: '#39FF14', delay: 17000 },
    { agent: 'NADIA', text: `Projecting decade-horizon scenarios. Compounding risk factors: 7 independent vectors.`, color: '#C4A44A', delay: 18500 },
    { agent: 'BORIS', text: `The long-term scenarios are where the REAL campaign lives. This is where we make history.`, color: '#C23B22', delay: 20000 },
    { agent: 'THE ARCHIVIST', text: `50-year extrapolation complete. The historical parallels are... instructive.`, color: '#5B8CFF', delay: 21500 },
    { agent: 'COMRADE PIXEL', text: `What if the worst has already happened and nobody said it out loud yet?`, color: '#FF6B9D', delay: 23000 },
    { agent: 'NADIA', text: `All scenario models compiled. 12 viable doomsday vectors across 4 horizons.`, color: '#C4A44A', delay: 24500 },
    { agent: 'BORIS', text: `MAGNIFICENT. The dossier is ready. Let us show them their future.`, color: '#C23B22', delay: 26000 },
    { agent: 'NADIA', text: `Compiling final report for ${companyName}...`, color: '#C4A44A', delay: 27500 },
  ];
}

export default function AnalysisLoadingScreen() {
  const { company } = useProjectStore();
  const companyName = company?.name || 'the subject';
  const sector = company?.sector || 'Unknown';

  const [lines] = useState(() => buildTerminalLines(companyName, sector));
  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    const timers = lines.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [lines]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black-primary px-6">
      <div className="absolute inset-0 bg-gradient-radial from-red-primary/[0.03] to-transparent animate-pulse" />

      <div className="relative max-w-2xl w-full">
        <div className="font-mono text-xs text-gray-600 mb-2 tracking-[0.3em]">
          ANALYSIS IN PROGRESS
        </div>
        <div className="font-mono text-[10px] text-gray-700 mb-6">
          TARGET: {companyName.toUpperCase()} / {sector.toUpperCase()}
        </div>

        {/* Progress bar */}
        <div className="w-full h-[3px] bg-gray-800 mb-8">
          <motion.div
            className="h-full bg-red-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${(visibleLines / lines.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Terminal output — scrollable */}
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
          {lines.slice(0, visibleLines).map((line, i) => (
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
