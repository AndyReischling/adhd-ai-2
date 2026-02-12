'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const testimonials = [
  {
    quote:
      "The client didn't ask for this. That's what makes it essential.",
    author: 'BORIS',
    color: '#C23B22',
  },
  {
    quote:
      'I have modeled 114 ways this company could be destroyed. I selected the three most poetic.',
    author: 'THE ARCHIVIST',
    color: '#5B8CFF',
  },
  {
    quote:
      'The probability of survival increases by 12% with adequate crisis messaging. You are welcome.',
    author: 'NADIA',
    color: '#C4A44A',
  },
  {
    quote:
      'every pixel is a small act of defiance against the void. also i think we should make the logo bigger.',
    author: 'GREMLIN',
    color: '#39FF14',
  },
];

export default function AntiTestimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="py-32 bg-black-primary relative">
      {/* Corner label */}
      <div className="absolute top-8 right-8 font-accent text-[10px] tracking-[0.4em] text-gray-800 -rotate-2">
        FOR INTERNAL REVIEW
      </div>

      <div ref={ref} className="max-w-[1000px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {testimonials.map((t, i) => (
            <motion.blockquote
              key={t.author}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="border-l-[3px] pl-6"
              style={{ borderColor: t.color }}
            >
              <p className="font-body text-lg italic text-gray-200 leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>
              <cite
                className="font-mono text-xs tracking-[0.2em] not-italic"
                style={{ color: t.color }}
              >
                — {t.author}
              </cite>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
