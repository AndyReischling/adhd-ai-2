'use client';

import { useCanvasStore } from '@/store/canvasStore';

export default function AgentCursorLayer() {
  const { agentCursors } = useCanvasStore();

  return (
    <>
      {agentCursors.map((cursor) => (
        <div
          key={cursor.agentId}
          className="absolute pointer-events-none z-50"
          style={{
            transform: `translate(${cursor.position.x}px, ${cursor.position.y}px)`,
            transition: 'none',
          }}
        >
          {/* Arrow cursor */}
          <svg
            width="16"
            height="20"
            viewBox="0 0 16 20"
            fill="none"
            className="drop-shadow-sm"
          >
            <path
              d="M0 0L16 12L8 12L12 20L8 20L4 12L0 16V0Z"
              fill={cursor.color}
              fillOpacity="0.9"
            />
            <path
              d="M0 0L16 12L8 12L12 20L8 20L4 12L0 16V0Z"
              stroke="#0A0A0A"
              strokeWidth="0.5"
            />
          </svg>

          {/* Name label */}
          <div
            className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.1em] px-1.5 py-0.5 whitespace-nowrap"
            style={{
              color: cursor.color,
              backgroundColor: 'rgba(10, 10, 10, 0.85)',
              border: `1px solid ${cursor.color}40`,
            }}
          >
            {cursor.label}
          </div>
        </div>
      ))}
    </>
  );
}
