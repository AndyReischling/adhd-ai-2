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

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildTerminalLines(name: string, sector: string): TerminalLine[] {
  const n = name;
  const s = sector;

  // Each slot picks one random line from a pool — so every run is different
  return [
    { agent: 'NADIA', color: '#C4A44A', delay: 800, text: pick([
      `Initializing threat assessment model for ${n}...`,
      `Loading ${n} risk profile into scenario engine...`,
      `Calibrating probability matrices against ${n}'s market exposure...`,
      `Running vulnerability scan on ${n}'s corporate structure...`,
    ])},
    { agent: 'THE ARCHIVIST', color: '#5B8CFF', delay: 2200, text: pick([
      `Querying institutional memory for ${s} sector precedents...`,
      `Searching failure database. ${s} sector: ${300 + Math.floor(Math.random() * 900)} records found.`,
      `Pulling regulatory filings for ${n}. ${Math.floor(Math.random() * 12) + 3} red flags identified.`,
      `Cross-referencing ${n} with historical corporate collapse patterns...`,
    ])},
    { agent: 'NADIA', color: '#C4A44A', delay: 3800, text: pick([
      `${n} flagged in ${Math.floor(Math.random() * 5) + 2} jurisdictions for regulatory exposure.`,
      `Preliminary risk score for ${n}: ${(Math.random() * 0.3 + 0.65).toFixed(2)}. Elevated.`,
      `Market sentiment analysis for ${n} shows ${Math.floor(Math.random() * 30) + 15}% negative trajectory.`,
      `${n}'s competitive moat has eroded ${Math.floor(Math.random() * 40) + 20}% since peak valuation.`,
    ])},
    { agent: 'THE ARCHIVIST', color: '#5B8CFF', delay: 5200, text: pick([
      `Found ${Math.floor(Math.random() * 600) + 200} comparable incidents in the ${s} database.`,
      `For context: ${Math.floor(Math.random() * 4) + 2} companies in ${n}'s exact position failed within 5 years.`,
      `Historical note: the ${s} sector has a ${Math.floor(Math.random() * 30) + 40}% crisis recurrence rate.`,
      `${n}'s organizational structure mirrors pre-collapse patterns I've documented ${Math.floor(Math.random() * 8) + 3} times before.`,
    ])},
    { agent: 'BORIS', color: '#C23B22', delay: 6800, text: pick([
      `I have reviewed the brief. ${n} has a MAGNIFICENT vulnerability.`,
      `${n}. I see it now. The campaign practically WRITES ITSELF.`,
      `This is the kind of corporate exposure that makes creative directors WEEP with possibility.`,
      `The ${n} brief is EXTRAORDINARY. Their hubris is our canvas.`,
    ])},
    { agent: 'GREMLIN', color: '#39FF14', delay: 8000, text: pick([
      `lol the data is already painting a picture. a very red picture.`,
      `ok ${n.toLowerCase()} is in trouble and i mean that as a compliment to us.`,
      `the numbers look like abstract art. beautiful terrible abstract art.`,
      `im not saying ${n.toLowerCase()} is doomed but the graphs are doing something alarming.`,
    ])},
    { agent: 'NADIA', color: '#C4A44A', delay: 9500, text: pick([
      `Short-term risk vectors identified. Probability matrices converging at ${(Math.random() * 0.15 + 0.78).toFixed(2)} confidence.`,
      `Year 1 models show ${Math.floor(Math.random() * 5) + 3} independent threat vectors for ${n}.`,
      `Near-term exposure for ${n} exceeds the ${Math.floor(Math.random() * 20) + 75}th percentile of ${s} companies.`,
      `Running Monte Carlo simulation on ${n}'s 12-month outlook... convergence achieved.`,
    ])},
    { agent: 'BORIS', color: '#C23B22', delay: 11000, text: pick([
      `Nadia, what is the PRIMARY threat? I need to know where to AIM the campaign.`,
      `Which vector hits HARDEST? The campaign needs a single devastating truth.`,
      `I want the scenario that will make ${n}'s board lose sleep. Give me the WORST one.`,
      `Nadia, rank them by DRAMATIC POTENTIAL. The data serves the creative, not the other way around.`,
    ])},
    { agent: 'NADIA', color: '#C4A44A', delay: 12500, text: pick([
      `Regulatory and reputational exposure are correlated for ${n}. Both spike in Year 1 models.`,
      `For ${n}, technological disruption is the primary vector. Reputational collapse follows within ${Math.floor(Math.random() * 8) + 4} months.`,
      `${n}'s greatest exposure is market-structural. The ${s} sector is entering a correction phase.`,
      `The data points to cultural backlash as ${n}'s most acute near-term risk. Consumer sentiment is fragile.`,
    ])},
    { agent: 'THE ARCHIVIST', color: '#5B8CFF', delay: 14000, text: pick([
      `For context: the last ${s} company to ignore this pattern was fined $${(Math.random() * 4 + 0.8).toFixed(1)} billion.`,
      `It should be noted that ${Math.floor(Math.random() * 3) + 2} of ${n}'s direct competitors have already faced similar scrutiny.`,
      `The historical record is clear: companies in ${n}'s position have a ${Math.floor(Math.random() * 18) + 6}-month window to act.`,
      `I have documented ${Math.floor(Math.random() * 20) + 8} cases where delay proved costlier than the crisis itself.`,
    ])},
    { agent: 'COMRADE PIXEL', color: '#FF6B9D', delay: 15500, text: pick([
      `Every empire contains the seed of its own eulogy. ${n} is no exception.`,
      `What if ${n}'s story isn't tragedy. What if it's a confession that hasn't been written yet.`,
      `I keep thinking about the word "accountability." It has the word "count" in it. As in, this counts.`,
      `The silence before a public reckoning is the loudest sound in corporate history. ${n} is about to hear it.`,
    ])},
    { agent: 'GREMLIN', color: '#39FF14', delay: 17000, text: pick([
      `the 5-year outlook is wild. like, structurally wild. im seeing shapes.`,
      `the mid-range projections look like a building falling in slow motion. beautiful honestly.`,
      `ok the 5-year data for ${n.toLowerCase()} is giving brutalist architecture. i love it.`,
      `something about the way ${n.toLowerCase()}'s numbers collapse at the 5-year mark is genuinely poetic.`,
    ])},
    { agent: 'NADIA', color: '#C4A44A', delay: 18500, text: pick([
      `Decade-horizon scenarios compiled. ${Math.floor(Math.random() * 5) + 5} independent compounding vectors.`,
      `10-year projection for ${n}: existential risk probability ${Math.floor(Math.random() * 30) + 35}%.`,
      `Long-range models show ${n}'s current business model has a ${Math.floor(Math.random() * 15) + 8}-year viability window.`,
      `At the 10-year mark, ${Math.floor(Math.random() * 4) + 3} of ${n}'s core revenue streams face structural obsolescence.`,
    ])},
    { agent: 'BORIS', color: '#C23B22', delay: 20000, text: pick([
      `The long-term scenarios are where the REAL campaign lives. This is where we make history.`,
      `50-year thinking. THAT is where the manifesto comes from. ${n} needs to reckon with its legacy.`,
      `The deep future scenarios are MAGNIFICENT. They are what separates us from every other agency.`,
      `At the 50-year horizon, we are no longer writing ads. We are writing ${n}'s epitaph. Or its redemption.`,
    ])},
    { agent: 'THE ARCHIVIST', color: '#5B8CFF', delay: 21500, text: pick([
      `50-year extrapolation complete. The historical parallels are... instructive.`,
      `Long-term analysis complete. ${n} joins a very specific category in my database. It is not a flattering one.`,
      `The 50-year model references ${Math.floor(Math.random() * 12) + 4} civilizational-scale precedents. Footnotes available.`,
      `Extrapolation complete. At this timescale, ${n}'s fate becomes indistinguishable from the fate of the ${s} sector itself.`,
    ])},
    { agent: 'COMRADE PIXEL', color: '#FF6B9D', delay: 23000, text: pick([
      `What if the worst has already happened and nobody said it out loud yet.`,
      `The 50-year scenario reads like a poem. A very sad, very true poem.`,
      `I want to write the manifesto from the perspective of someone in 2076 looking back at ${n}. What would they wish we had said?`,
      `At the long horizon, every company becomes a question: did you say the thing when it mattered?`,
    ])},
    { agent: 'NADIA', color: '#C4A44A', delay: 24500, text: pick([
      `All scenario models compiled. ${Math.floor(Math.random() * 5) + 10} viable doomsday vectors across 4 horizons.`,
      `Final compilation: ${Math.floor(Math.random() * 4) + 12} scenarios generated. Confidence: ${(Math.random() * 0.1 + 0.88).toFixed(2)}.`,
      `Scenario matrix complete for ${n}. Ready for agent review and selection.`,
      `Analysis pipeline complete. ${n}'s doomsday profile is comprehensive. Awaiting directive.`,
    ])},
    { agent: 'BORIS', color: '#C23B22', delay: 26000, text: pick([
      `MAGNIFICENT. The dossier is ready. Let us show them their future.`,
      `The analysis is COMPLETE. Now the real work begins — turning doom into campaign gold.`,
      `I have never seen a more compelling set of scenarios. ${n}'s reckoning will be BEAUTIFUL.`,
      `EXCELLENT. Present the findings. The Collective is ready to CREATE.`,
    ])},
    { agent: 'NADIA', color: '#C4A44A', delay: 27500, text: pick([
      `Compiling final report for ${n}...`,
      `Rendering scenario dossier for ${n}. Stand by.`,
      `Finalizing threat assessment. Transferring to workspace.`,
      `Report compiled. Initiating presentation sequence for ${n}.`,
    ])},
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

        <div className="w-full h-[3px] bg-gray-800 mb-8">
          <motion.div
            className="h-full bg-red-primary"
            initial={{ width: '0%' }}
            animate={{ width: `${(visibleLines / lines.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

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
