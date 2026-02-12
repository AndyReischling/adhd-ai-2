'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { CanvasPhase } from '@/types';

interface Task {
  id: string;
  label: string;
  phase: CanvasPhase;
}

const tasks: Task[] = [
  { id: 't1', label: 'Review company dossier', phase: 'research' },
  { id: 't2', label: 'Identify threat vectors', phase: 'research' },
  { id: 't3', label: 'Research historical precedent', phase: 'research' },
  { id: 't4', label: 'Generate scenario models', phase: 'ideation' },
  { id: 't5', label: 'Develop creative concepts', phase: 'ideation' },
  { id: 't6', label: 'Draft ad campaigns', phase: 'production' },
  { id: 't7', label: 'Produce OOH mockups', phase: 'production' },
  { id: 't8', label: 'Write messaging framework', phase: 'production' },
  { id: 't9', label: 'Compose manifesto', phase: 'production' },
  { id: 't10', label: 'Final review & approval', phase: 'finalization' },
  { id: 't11', label: 'Compile dossier for export', phase: 'export' },
];

const phaseOrder: CanvasPhase[] = ['research', 'ideation', 'production', 'finalization', 'export', 'complete'];

function getTaskStatus(task: Task, currentPhase: CanvasPhase): 'done' | 'in_progress' | 'todo' {
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const taskIdx = phaseOrder.indexOf(task.phase);
  if (taskIdx < currentIdx) return 'done';
  if (taskIdx === currentIdx) return 'in_progress';
  return 'todo';
}

export default function TaskPanel() {
  const { canvasPhase } = useCanvasStore();

  const currentPhaseIdx = phaseOrder.indexOf(canvasPhase);
  const totalPhases = 4; // Not counting 'export' and 'complete'
  const displayPhase = Math.min(currentPhaseIdx, totalPhases);

  const todoTasks = tasks.filter((t) => getTaskStatus(t, canvasPhase) === 'todo');
  const inProgressTasks = tasks.filter((t) => getTaskStatus(t, canvasPhase) === 'in_progress');
  const doneTasks = tasks.filter((t) => getTaskStatus(t, canvasPhase) === 'done');

  return (
    <div className="w-[260px] flex-shrink-0 bg-gray-900/80 border-r border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
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
          Phase {displayPhase}/{totalPhases}
        </span>
      </div>

      {/* Task lists */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* TO DO */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-gray-400">
              TO DO
            </span>
            <span className="font-mono text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded-sm">
              {todoTasks.length}
            </span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {todoTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-3.5 h-3.5 border border-gray-700 mt-0.5 flex-shrink-0" />
                  <span className="font-mono text-[11px] text-gray-500 leading-tight">
                    {task.label}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* IN PROGRESS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-gold-accent">
              IN PROGRESS
            </span>
            <span className="font-mono text-[10px] text-gold-accent bg-gold-accent/10 px-1.5 py-0.5 rounded-sm">
              {inProgressTasks.length}
            </span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {inProgressTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-3.5 h-3.5 border border-gold-accent mt-0.5 flex-shrink-0 flex items-center justify-center">
                    <motion.div
                      className="w-1.5 h-1.5 bg-gold-accent"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-gold-accent leading-tight">
                    {task.label}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* DONE */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] tracking-[0.2em] text-green-muted">
              DONE
            </span>
            <span className="font-mono text-[10px] text-green-terminal bg-green-terminal/10 px-1.5 py-0.5 rounded-sm">
              {doneTasks.length}
            </span>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {doneTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-start gap-2"
                >
                  <div className="w-3.5 h-3.5 border border-green-muted mt-0.5 flex-shrink-0 flex items-center justify-center">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4 7L8 3" stroke="#1A472A" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <span className="font-mono text-[11px] text-gray-600 leading-tight line-through">
                    {task.label}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
