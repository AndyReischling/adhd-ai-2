'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import StampLabel from '@/components/ui/StampLabel';

const services = [
  {
    title: 'DOOMSDAY MODELING',
    description: 'Scenario analysis at 1, 5, 10, and 50 year horizons',
    variant: 'red' as const,
  },
  {
    title: 'PROACTIVE APOLOGY',
    description: "Campaign assets for crises that haven't happened yet",
    variant: 'gold' as const,
  },
  {
    title: 'FERAL CREATIVE',
    description: 'Five AI agents. One canvas. No creative director.',
    variant: 'green' as const,
  },
  {
    title: 'DELIVERABLES',
    description: 'Manifesto. Ad concepts. OOH. Messaging frameworks.',
    variant: 'default' as const,
  },
];

export default function ServicesStrip() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section className="py-32 bg-gray-900 relative">
      {/* Corner label */}
      <div className="absolute top-8 left-8 font-accent text-[10px] tracking-[0.4em] text-gray-800">
        DIRECTIVE 7
      </div>

      <div className="max-w-[1200px] mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="font-display text-3xl md:text-4xl text-center mb-20"
        >
          Services of the Collective
        </motion.h2>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="border border-gray-800 p-6 group hover:border-gray-600 transition-colors duration-300"
            >
              <div className="mb-4">
                <StampLabel text={service.title} variant={service.variant} size="sm" />
              </div>
              <p className="font-mono text-xs text-gray-400 leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
