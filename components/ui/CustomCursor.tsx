'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsVisible(true);
    };

    const leave = () => setIsVisible(false);
    const enter = () => setIsVisible(true);

    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 z-[99999] pointer-events-none"
      animate={{ x: position.x - 12, y: position.y - 12 }}
      transition={{ type: 'tween', duration: 0.05 }}
    >
      {/* Crosshair */}
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        {/* Horizontal line */}
        <line x1="0" y1="12" x2="9" y2="12" stroke="#C23B22" strokeWidth="1.5" />
        <line x1="15" y1="12" x2="24" y2="12" stroke="#C23B22" strokeWidth="1.5" />
        {/* Vertical line */}
        <line x1="12" y1="0" x2="12" y2="9" stroke="#C23B22" strokeWidth="1.5" />
        <line x1="12" y1="15" x2="12" y2="24" stroke="#C23B22" strokeWidth="1.5" />
        {/* Center dot */}
        <circle cx="12" cy="12" r="1.5" fill="#C23B22" />
      </svg>
    </motion.div>
  );
}
