'use client';

import { motion } from 'framer-motion';
import { CanvasPhase } from '@/types';

interface WorkspaceZoneProps {
  id: string;
  label: string;
  color: string;
  phase: CanvasPhase;
}

const activePhases: Record<string, CanvasPhase[]> = {
  'next-year': ['research', 'ideation', 'production', 'finalization', 'export', 'complete'],
  'five-years': ['ideation', 'production', 'finalization', 'export', 'complete'],
  'decade': ['production', 'finalization', 'export', 'complete'],
  'long-term': ['production', 'finalization', 'export', 'complete'],
};

export default function WorkspaceZone({ id, label, color, phase }: WorkspaceZoneProps) {
  const isActive = (activePhases[id] || []).includes(phase);

  return (
    <motion.div
      className="flex-1 relative rounded-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        border: `2px dashed ${isActive ? color : '#2A2A2A'}`,
        backgroundColor: isActive ? `${color}05` : 'transparent',
        transition: 'border-color 0.5s, background-color 0.5s',
      }}
    >
      {/* Zone label */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="px-3 py-1 font-mono text-[10px] tracking-[0.15em] font-bold whitespace-nowrap"
          style={{
            backgroundColor: isActive ? color : '#2A2A2A',
            color: isActive ? '#0A0A0A' : '#6B6B6B',
            transition: 'background-color 0.5s, color 0.5s',
          }}
        >
          {label}
        </div>
      </div>

      {/* Active glow effect */}
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-sm"
          animate={{
            boxShadow: [
              `inset 0 0 20px ${color}05`,
              `inset 0 0 40px ${color}08`,
              `inset 0 0 20px ${color}05`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}

      {/* Subtitle when active */}
      {isActive && (
        <motion.div
          className="absolute bottom-2 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span
            className="font-mono text-[9px] tracking-[0.2em] opacity-40"
            style={{ color }}
          >
            ACTIVE
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
