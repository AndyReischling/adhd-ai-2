'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DoomsdayScenario, DoomsdayResponse } from '@/types';
import DoomsdayCard from './DoomsdayCard';
import Button from '@/components/ui/Button';
import StampLabel from '@/components/ui/StampLabel';

type Horizon = '1_year' | '5_year' | '10_year' | '50_year';

const horizonLabels: Record<Horizon, string> = {
  '1_year': '1 YEAR',
  '5_year': '5 YEARS',
  '10_year': '10 YEARS',
  '50_year': '50 YEARS',
};

interface ScenarioSelectorProps {
  data: DoomsdayResponse;
  selectedScenarios: DoomsdayScenario[];
  onSelect: (scenario: DoomsdayScenario) => void;
  onDeselect: (scenarioId: string) => void;
  onProceed: () => void;
}

export default function ScenarioSelector({
  data,
  selectedScenarios,
  onSelect,
  onDeselect,
  onProceed,
}: ScenarioSelectorProps) {
  const [activeHorizon, setActiveHorizon] = useState<Horizon>('1_year');
  const [showDirective, setShowDirective] = useState(false);

  const horizons: Horizon[] = ['1_year', '5_year', '10_year', '50_year'];

  const handleToggle = (scenario: DoomsdayScenario) => {
    const isSelected = selectedScenarios.some((s) => s.id === scenario.id);
    if (isSelected) {
      onDeselect(scenario.id);
    } else if (selectedScenarios.length < 3) {
      onSelect(scenario);
      // Flash directive animation
      setShowDirective(true);
      setTimeout(() => setShowDirective(false), 800);
    }
  };

  const scenarios = data.horizons[activeHorizon] || [];

  return (
    <div className="min-h-screen bg-black-primary">
      {/* Header */}
      <div className="py-12 text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-3">
          Doomsday Scenarios
        </h1>
        <p className="font-mono text-xs text-gray-400 tracking-[0.2em]">
          SELECT 1-3 SCENARIOS FOR CAMPAIGN DEVELOPMENT
        </p>
      </div>

      {/* Horizon tabs */}
      <div className="flex justify-center gap-0 mb-12">
        {horizons.map((h) => (
          <button
            key={h}
            onClick={() => setActiveHorizon(h)}
            className={`px-6 py-3 font-mono text-xs tracking-[0.2em] border transition-all duration-200 ${
              activeHorizon === h
                ? 'border-red-primary text-red-primary bg-red-primary/5'
                : 'border-gray-800 text-gray-400 hover:border-gray-600'
            }`}
          >
            {horizonLabels[h]}
          </button>
        ))}
      </div>

      {/* Scenario cards */}
      <div className="max-w-[1200px] mx-auto px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHorizon}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {scenarios.map((scenario: DoomsdayScenario, i: number) => (
              <DoomsdayCard
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedScenarios.some((s) => s.id === scenario.id)}
                onToggle={() => handleToggle(scenario)}
                index={i}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action bar */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-6 py-4 z-50"
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="font-mono text-sm text-gray-400">
            <span className="text-off-white">{selectedScenarios.length}</span>/3
            SCENARIOS SELECTED
          </div>

          <Button
            variant="primary"
            onClick={onProceed}
            disabled={selectedScenarios.length === 0}
          >
            PROCEED TO CANVAS
          </Button>
        </div>
      </motion.div>

      {/* DIRECTIVE RECEIVED flash */}
      <AnimatePresence>
        {showDirective && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StampLabel text="DIRECTIVE RECEIVED" variant="gold" size="lg" animated />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
