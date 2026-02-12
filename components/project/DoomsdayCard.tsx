'use client';

import { motion } from 'framer-motion';
import { DoomsdayScenario } from '@/types';

interface DoomsdayCardProps {
  scenario: DoomsdayScenario;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}

export default function DoomsdayCard({
  scenario,
  isSelected,
  onToggle,
  index,
}: DoomsdayCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      whileHover={{ scale: 1.01 }}
      onClick={onToggle}
      className={`relative border p-3 transition-all duration-200 select-none ${
        isSelected
          ? 'border-red-primary bg-red-primary/[0.08]'
          : 'border-gray-800 hover:border-gray-600 bg-gray-900/60'
      }`}
      role="button"
      tabIndex={0}
    >
      {/* Selection stamp */}
      <div className="absolute top-2 right-2">
        {isSelected ? (
          <span className="font-accent text-[9px] tracking-[0.2em] border border-red-primary text-red-primary px-1.5 py-0.5 transform -rotate-[5deg] inline-block">
            APPROVED
          </span>
        ) : (
          <span className="font-mono text-[9px] text-gray-700 tracking-[0.15em]">
            SELECT
          </span>
        )}
      </div>

      {/* Probability */}
      <span className="font-mono text-[9px] tracking-[0.15em] bg-red-primary/20 text-red-primary px-1.5 py-0.5 inline-block mb-1.5">
        PROB: {scenario.probability}%
      </span>

      {/* Title */}
      <h3 className="font-display text-sm leading-tight text-off-white mb-1.5 pr-14">
        {scenario.title}
      </h3>

      {/* Summary */}
      <p className="font-body text-[11px] text-gray-400 leading-relaxed mb-2 line-clamp-3">
        {scenario.summary}
      </p>

      {/* Severity */}
      <div className="flex items-center gap-1">
        <span className="font-mono text-[9px] text-gray-600 mr-1 tracking-[0.1em]">SEV</span>
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={`w-3 h-1.5 ${
              i < scenario.severity ? 'bg-red-primary' : 'bg-gray-800'
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
