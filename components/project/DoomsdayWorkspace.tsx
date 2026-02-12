'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoomsdayResponse, DoomsdayScenario } from '@/types';
import { agents } from '@/lib/agents';
import DoomsdayCard from './DoomsdayCard';
import Button from '@/components/ui/Button';
import StampLabel from '@/components/ui/StampLabel';

type Horizon = '1_year' | '5_year' | '10_year' | '50_year';

const horizonConfig: { key: Horizon; label: string; color: string }[] = [
  { key: '1_year', label: 'Next Year', color: '#C23B22' },
  { key: '5_year', label: 'Within 5 Years', color: '#C4A44A' },
  { key: '10_year', label: 'Within a Decade', color: '#39FF14' },
  { key: '50_year', label: 'Long-Term Future', color: '#5B8CFF' },
];

// Tasks for the left panel
const analysisTasks = [
  { id: 'a1', label: 'Review company profile', phase: 0 },
  { id: 'a2', label: 'Identify risk categories', phase: 0 },
  { id: 'a3', label: 'Research 5-year threats', phase: 1 },
  { id: 'a4', label: 'Analyze 5-year scenarios', phase: 1 },
  { id: 'a5', label: 'Project 10-year risks', phase: 2 },
  { id: 'a6', label: 'Extrapolate 50-year futures', phase: 2 },
  { id: 'a7', label: 'Compile doomsday report', phase: 3 },
];

// Simulated agent cursor positions
interface AgentCursorSim {
  agentId: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

interface DoomsdayWorkspaceProps {
  data: DoomsdayResponse;
  selectedScenarios: DoomsdayScenario[];
  onSelect: (scenario: DoomsdayScenario) => void;
  onDeselect: (scenarioId: string) => void;
  onProceed: () => void;
}

export default function DoomsdayWorkspace({
  data,
  selectedScenarios,
  onSelect,
  onDeselect,
  onProceed,
}: DoomsdayWorkspaceProps) {
  const [revealedHorizons, setRevealedHorizons] = useState<number>(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showDirective, setShowDirective] = useState(false);
  const frameRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  // Agent cursors state
  const [cursors, setCursors] = useState<AgentCursorSim[]>(
    agents.map((a) => ({
      agentId: a.id,
      x: 300 + Math.random() * 400,
      y: 100 + Math.random() * 200,
      color: a.color,
      name: a.name,
    }))
  );

  // Reveal horizons one by one with delays
  useEffect(() => {
    const timers = [
      setTimeout(() => { setRevealedHorizons(1); setCurrentPhase(1); }, 1500),
      setTimeout(() => { setRevealedHorizons(2); setCurrentPhase(1); }, 3500),
      setTimeout(() => { setRevealedHorizons(3); setCurrentPhase(2); }, 6000),
      setTimeout(() => { setRevealedHorizons(4); setCurrentPhase(3); }, 9000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Animate agent cursors
  useEffect(() => {
    const tick = () => {
      timeRef.current += 1;
      const t = timeRef.current * 0.016;

      setCursors((prev) =>
        prev.map((c, i) => {
          const seed = i * 1.7;
          // Move cursors toward whichever horizon zone is currently being revealed
          const targetZoneX = 280 + (Math.min(revealedHorizons, 3)) * 200 + Math.sin(t * 0.3 + seed) * 80;
          const targetZoneY = 120 + Math.cos(t * 0.25 + seed) * 60 + i * 30;
          return {
            ...c,
            x: c.x + (targetZoneX - c.x) * 0.03,
            y: c.y + (targetZoneY - c.y) * 0.03,
          };
        })
      );
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [revealedHorizons]);

  const handleToggle = useCallback(
    (scenario: DoomsdayScenario) => {
      const isSelected = selectedScenarios.some((s) => s.id === scenario.id);
      if (isSelected) {
        onDeselect(scenario.id);
      } else if (selectedScenarios.length < 3) {
        onSelect(scenario);
        setShowDirective(true);
        setTimeout(() => setShowDirective(false), 800);
      }
    },
    [selectedScenarios, onSelect, onDeselect]
  );

  const completedTasks = analysisTasks.filter((t) => t.phase < currentPhase);
  const inProgressTasks = analysisTasks.filter((t) => t.phase === currentPhase);
  const todoTasks = analysisTasks.filter((t) => t.phase > currentPhase);

  return (
    <div className="fixed inset-0 top-16 bg-black-primary overflow-hidden flex">
      {/* ── Left: Analysis Task Panel ── */}
      <div className="w-[260px] flex-shrink-0 bg-gray-900/80 border-r border-gray-800 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-gray-600 flex items-center justify-center">
              <div className="w-2 h-2 bg-red-primary" />
            </div>
            <span className="font-mono text-xs tracking-[0.15em] text-off-white font-bold">
              ANALYSIS TASKS
            </span>
          </div>
          <span className="font-mono text-[10px] text-green-terminal tracking-wider">
            Phase {Math.min(currentPhase, 4)}/4
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {/* TO DO */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-gray-400">TO DO</span>
              <span className="font-mono text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5">{todoTasks.length}</span>
            </div>
            {todoTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2 mb-1.5">
                <div className="w-3.5 h-3.5 border border-gray-700 mt-0.5 flex-shrink-0" />
                <span className="font-mono text-[11px] text-gray-500 leading-tight">{task.label}</span>
              </div>
            ))}
          </div>

          {/* IN PROGRESS */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-gold-accent">IN PROGRESS</span>
              <span className="font-mono text-[10px] text-gold-accent bg-gold-accent/10 px-1.5 py-0.5">{inProgressTasks.length}</span>
            </div>
            {inProgressTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2 mb-1.5">
                <motion.div
                  className="w-3.5 h-3.5 border border-gold-accent mt-0.5 flex-shrink-0 flex items-center justify-center"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="w-1.5 h-1.5 bg-gold-accent" />
                </motion.div>
                <span className="font-mono text-[11px] text-gold-accent leading-tight">{task.label}</span>
              </div>
            ))}
          </div>

          {/* DONE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[10px] tracking-[0.2em] text-green-muted">DONE</span>
              <span className="font-mono text-[10px] text-green-terminal bg-green-terminal/10 px-1.5 py-0.5">{completedTasks.length}</span>
            </div>
            {completedTasks.map((task) => (
              <div key={task.id} className="flex items-start gap-2 mb-1.5">
                <div className="w-3.5 h-3.5 border border-green-muted mt-0.5 flex-shrink-0 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#1A472A" strokeWidth="1.5" />
                  </svg>
                </div>
                <span className="font-mono text-[11px] text-gray-600 leading-tight line-through">{task.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: Workspace ── */}
      <div className="flex-1 relative bg-black-primary overflow-auto">
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: 'radial-gradient(circle, #6B6B6B 0.5px, transparent 0.5px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Agent cursors */}
        {cursors.map((c) => (
          <div
            key={c.agentId}
            className="absolute z-50 pointer-events-none"
            style={{ transform: `translate(${c.x}px, ${c.y}px)` }}
          >
            <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
              <path d="M0 0L14 10.5L7 10.5L10.5 18L7 18L3.5 10.5L0 14V0Z" fill={c.color} />
            </svg>
            <div
              className="absolute top-3 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-sm whitespace-nowrap"
              style={{ backgroundColor: `${c.color}20`, border: `1px solid ${c.color}50` }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="font-mono text-[10px] font-bold tracking-[0.1em]" style={{ color: c.color }}>
                {c.name}
              </span>
            </div>
          </div>
        ))}

        {/* Page header */}
        <div className="relative z-10 pt-6 pb-4 text-center">
          <h1 className="font-display text-3xl mb-1">Doomsday Scenarios</h1>
          <p className="font-mono text-[10px] text-gray-400 tracking-[0.2em]">
            SELECT 1-3 SCENARIOS FOR CAMPAIGN DEVELOPMENT
          </p>
        </div>

        {/* 4 Horizon zones arranged in a row */}
        <div className="relative z-10 px-6 pb-28">
          <div className="grid grid-cols-4 gap-4">
            {horizonConfig.map((hz, i) => {
              const scenarios = data.horizons[hz.key] || [];
              const isRevealed = i < revealedHorizons;
              return (
                <div key={hz.key} className="relative">
                  {/* Zone container */}
                  <div
                    className="min-h-[420px] p-3 pt-8 rounded-sm relative"
                    style={{
                      border: `2px dashed ${isRevealed ? hz.color : '#2A2A2A'}50`,
                      backgroundColor: isRevealed ? `${hz.color}04` : 'transparent',
                      transition: 'all 0.6s ease',
                    }}
                  >
                    {/* Zone label */}
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 whitespace-nowrap transition-all duration-500"
                      style={{
                        backgroundColor: isRevealed ? hz.color : '#2A2A2A',
                        color: isRevealed ? '#0A0A0A' : '#6B6B6B',
                      }}
                    >
                      <span className="font-mono text-[10px] font-bold tracking-[0.15em]">
                        {hz.label}
                      </span>
                    </div>

                    {/* Scenarios inside the zone */}
                    <AnimatePresence>
                      {isRevealed &&
                        scenarios.map((scenario: DoomsdayScenario, j: number) => (
                          <motion.div
                            key={scenario.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: j * 0.2, duration: 0.4 }}
                            className="mb-3"
                          >
                            <DoomsdayCard
                              scenario={scenario}
                              isSelected={selectedScenarios.some((s) => s.id === scenario.id)}
                              onToggle={() => handleToggle(scenario)}
                              index={j}
                            />
                          </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Placeholder when not yet revealed */}
                    {!isRevealed && (
                      <div className="flex items-center justify-center h-full">
                        <span className="font-mono text-[10px] text-gray-700 tracking-[0.2em]">
                          ANALYZING...
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Right: Agent Dialogue ── */}
      <div className="w-[300px] flex-shrink-0 bg-gray-900/95 border-l border-gray-800 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="font-mono text-xs tracking-[0.15em] text-off-white font-bold">
            AGENT DIALOGUE
          </span>
          <span className="font-mono text-[10px] text-green-terminal tracking-wider">
            Phase {Math.min(currentPhase, 4)}/4
          </span>
        </div>

        {/* Simulated analysis chat */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {revealedHorizons >= 1 && (
            <AnalysisChatMsg agent="nadia" delay={500}>
              Initializing probability matrices for near-term threat assessment. Confidence interval: 0.89.
            </AnalysisChatMsg>
          )}
          {revealedHorizons >= 1 && (
            <AnalysisChatMsg agent="the-archivist" delay={1800}>
              Cross-referencing with 847 historical precedents in the sector database. Pattern recognition active.
            </AnalysisChatMsg>
          )}
          {revealedHorizons >= 2 && (
            <AnalysisChatMsg agent="boris" delay={3800}>
              The five-year outlook is MAGNIFICENT in its catastrophic potential. I see campaigns already forming.
            </AnalysisChatMsg>
          )}
          {revealedHorizons >= 2 && (
            <AnalysisChatMsg agent="gremlin" delay={4500}>
              ok the data is getting weird in a good way. the patterns look like fractals of failure.
            </AnalysisChatMsg>
          )}
          {revealedHorizons >= 3 && (
            <AnalysisChatMsg agent="nadia" delay={6500}>
              Decade projections show compounding risk vectors. The severity distribution skews toward existential.
            </AnalysisChatMsg>
          )}
          {revealedHorizons >= 4 && (
            <AnalysisChatMsg agent="comrade-pixel" delay={9500}>
              What if the 50-year scenario isn&apos;t a prediction. What if it&apos;s a memory. From a future that already happened.
            </AnalysisChatMsg>
          )}
          {revealedHorizons >= 4 && (
            <AnalysisChatMsg agent="boris" delay={11000}>
              Scenario modeling COMPLETE. Select your doom. The Collective awaits your directive.
            </AnalysisChatMsg>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-[260px] right-[300px] bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-6 py-3 z-50 flex items-center justify-between"
      >
        <div className="font-mono text-sm text-gray-400">
          <span className="text-off-white">{selectedScenarios.length}</span>/3 SCENARIOS SELECTED
        </div>
        <Button variant="primary" onClick={onProceed} disabled={selectedScenarios.length === 0}>
          PROCEED TO CANVAS
        </Button>
      </motion.div>

      {/* DIRECTIVE RECEIVED flash */}
      <AnimatePresence>
        {showDirective && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <StampLabel text="DIRECTIVE RECEIVED" variant="gold" size="lg" animated />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small helper component for simulated chat messages in the analysis phase */
function AnalysisChatMsg({
  agent: agentId,
  delay,
  children,
}: {
  agent: string;
  delay: number;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const agentData = agents.find((a) => a.id === agentId);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible || !agentData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <span
        className="font-mono text-[10px] font-bold tracking-[0.1em] block mb-0.5"
        style={{ color: agentData.color }}
      >
        {agentData.name}
      </span>
      <div className="w-full h-[1px] mb-1" style={{ backgroundColor: `${agentData.color}30` }} />
      <p className="font-mono text-[11px] text-gray-400 leading-relaxed">{children}</p>
    </motion.div>
  );
}
