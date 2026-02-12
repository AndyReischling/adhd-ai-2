'use client';

import { motion } from 'framer-motion';

interface StampLabelProps {
  text: string;
  variant?: 'red' | 'gold' | 'green' | 'default';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}

export default function StampLabel({
  text,
  variant = 'red',
  size = 'md',
  animated = false,
  className = '',
}: StampLabelProps) {
  const colors = {
    red: 'border-red-primary text-red-primary',
    gold: 'border-gold-accent text-gold-accent',
    green: 'border-green-terminal text-green-terminal',
    default: 'border-gray-400 text-gray-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const stamp = (
    <span
      className={`font-accent uppercase tracking-[0.3em] border-2 inline-block transform -rotate-[5deg] ${colors[variant]} ${sizes[size]} ${className}`}
    >
      {text}
    </span>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 3, opacity: 0, rotate: -15 }}
        animate={{ scale: 1, opacity: 1, rotate: -5 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {stamp}
      </motion.div>
    );
  }

  return stamp;
}
