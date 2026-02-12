'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  const baseStyles =
    'font-mono uppercase tracking-[0.2em] border-2 transition-colors duration-200 inline-flex items-center justify-center';

  const variants = {
    primary:
      'border-red-primary bg-transparent text-off-white hover:bg-red-primary hover:text-off-white',
    secondary:
      'border-gold-accent bg-transparent text-gold-accent hover:bg-gold-accent hover:text-black-primary',
    ghost:
      'border-gray-600 bg-transparent text-gray-400 hover:border-off-white hover:text-off-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      } ${className}`}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      [ {children} ]
    </motion.button>
  );
}
