'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const manifestoLines = [
  'Every brand will face its reckoning.',
  'The question is not if — but whether',
  'the apology will be ready.',
  '',
  'We are five minds. None of them human.',
  'All of them feral. We study your company.',
  'We model its doom. Then we build',
  'the campaign that says sorry',
  'before you have to.',
];

export default function Manifesto() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section className="py-32 md:py-48 bg-black-primary relative">
      {/* Classification stamp */}
      <div className="absolute top-8 right-8 font-accent text-[10px] tracking-[0.4em] text-gray-800 rotate-3">
        CLASSIFIED
      </div>

      <div ref={ref} className="max-w-[680px] mx-auto px-6">
        {manifestoLines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.6,
              delay: i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={`font-body text-xl md:text-2xl leading-relaxed text-center ${
              line === '' ? 'h-8' : 'text-off-white'
            }`}
          >
            {line}
          </motion.p>
        ))}
      </div>

      {/* Brutalist divider */}
      <div className="mt-32 mx-auto w-24 h-[3px] bg-red-primary" />
    </section>
  );
}
