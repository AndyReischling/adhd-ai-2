'use client';

import { motion } from 'framer-motion';

interface AgentAvatarProps {
  agentId: string;
  color: string;
  size?: number;
}

/**
 * Abstract geometric Soviet-poster-style avatar.
 * Each agent gets a unique geometric composition in their signature color.
 */
export default function AgentAvatar({ agentId, color, size = 200 }: AgentAvatarProps) {
  const shapes: Record<string, React.ReactNode> = {
    boris: (
      // Bold triangle pointing up — authority, aggression
      <g>
        <polygon
          points={`${size / 2},${size * 0.1} ${size * 0.15},${size * 0.85} ${size * 0.85},${size * 0.85}`}
          fill="none"
          stroke={color}
          strokeWidth="3"
        />
        <rect
          x={size * 0.35}
          y={size * 0.45}
          width={size * 0.3}
          height={size * 0.3}
          fill={color}
          opacity="0.3"
        />
        <circle cx={size / 2} cy={size * 0.42} r={size * 0.08} fill={color} />
      </g>
    ),
    nadia: (
      // Precise concentric circles — precision, control
      <g>
        <circle cx={size / 2} cy={size / 2} r={size * 0.4} fill="none" stroke={color} strokeWidth="2" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.28} fill="none" stroke={color} strokeWidth="1.5" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.16} fill="none" stroke={color} strokeWidth="1" />
        <circle cx={size / 2} cy={size / 2} r={size * 0.04} fill={color} />
        <line x1={size * 0.1} y1={size / 2} x2={size * 0.9} y2={size / 2} stroke={color} strokeWidth="0.5" opacity="0.5" />
        <line x1={size / 2} y1={size * 0.1} x2={size / 2} y2={size * 0.9} stroke={color} strokeWidth="0.5" opacity="0.5" />
      </g>
    ),
    gremlin: (
      // Chaotic scattered shapes — chaos, creativity
      <g>
        <rect x={size * 0.15} y={size * 0.2} width={size * 0.25} height={size * 0.25} fill={color} opacity="0.4" transform={`rotate(15, ${size * 0.27}, ${size * 0.32})`} />
        <circle cx={size * 0.65} cy={size * 0.35} r={size * 0.12} fill="none" stroke={color} strokeWidth="2" />
        <polygon points={`${size * 0.5},${size * 0.55} ${size * 0.35},${size * 0.85} ${size * 0.65},${size * 0.85}`} fill={color} opacity="0.3" />
        <line x1={size * 0.7} y1={size * 0.6} x2={size * 0.9} y2={size * 0.8} stroke={color} strokeWidth="3" />
        <circle cx={size * 0.3} cy={size * 0.7} r={size * 0.05} fill={color} />
      </g>
    ),
    'the-archivist': (
      // Grid/filing system — order, knowledge
      <g>
        <rect x={size * 0.15} y={size * 0.15} width={size * 0.7} height={size * 0.7} fill="none" stroke={color} strokeWidth="2" />
        <line x1={size * 0.15} y1={size * 0.38} x2={size * 0.85} y2={size * 0.38} stroke={color} strokeWidth="1" />
        <line x1={size * 0.15} y1={size * 0.62} x2={size * 0.85} y2={size * 0.62} stroke={color} strokeWidth="1" />
        <line x1={size * 0.5} y1={size * 0.15} x2={size * 0.5} y2={size * 0.85} stroke={color} strokeWidth="1" />
        <circle cx={size * 0.325} cy={size * 0.265} r={size * 0.04} fill={color} />
        <rect x={size * 0.55} y={size * 0.43} width={size * 0.2} height={size * 0.12} fill={color} opacity="0.3" />
      </g>
    ),
    'comrade-pixel': (
      // Heart-like or poetic flowing form — emotion, words
      <g>
        <circle cx={size * 0.38} cy={size * 0.35} r={size * 0.15} fill="none" stroke={color} strokeWidth="2" />
        <circle cx={size * 0.62} cy={size * 0.35} r={size * 0.15} fill="none" stroke={color} strokeWidth="2" />
        <path
          d={`M ${size * 0.23} ${size * 0.38} Q ${size * 0.5} ${size * 0.9} ${size * 0.77} ${size * 0.38}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
        <line x1={size * 0.35} y1={size * 0.55} x2={size * 0.65} y2={size * 0.55} stroke={color} strokeWidth="1" opacity="0.5" />
        <line x1={size * 0.4} y1={size * 0.62} x2={size * 0.6} y2={size * 0.62} stroke={color} strokeWidth="1" opacity="0.5" />
      </g>
    ),
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {shapes[agentId] || shapes.boris}
    </motion.svg>
  );
}
