'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Agent } from '@/types';
import AgentAvatar from './AgentAvatar';
import StampLabel from '@/components/ui/StampLabel';

interface AgentProfileProps {
  agent: Agent;
  index: number;
}

export default function AgentProfile({ agent, index }: AgentProfileProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const isEven = index % 2 === 0;

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center relative overflow-hidden"
      style={{
        backgroundColor: index === 0 ? '#0A0A0A' : undefined,
      }}
    >
      {/* Subtle color wash from agent */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          background: `radial-gradient(ellipse at ${isEven ? '30%' : '70%'} 50%, ${agent.color}, transparent 70%)`,
        }}
      />

      {/* Corner classification */}
      <div className="absolute top-8 right-8 font-accent text-[10px] tracking-[0.4em] text-gray-800">
        DOSSIER {String(index + 1).padStart(3, '0')}
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-24 w-full">
        <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20`}>
          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, x: isEven ? -40 : 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="flex-shrink-0"
          >
            <AgentAvatar agentId={agent.id} color={agent.color} size={240} />
          </motion.div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2
                className="font-display text-5xl md:text-7xl mb-3"
                style={{ color: agent.color }}
              >
                {agent.name}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              <StampLabel text={agent.role} variant="default" size="sm" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4 mb-8"
            >
              {agent.bio.split('\n\n').map((paragraph, i) => (
                <p key={i} className="font-body text-base md:text-lg text-gray-300 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </motion.div>

            {/* Voice sample pull-quote */}
            <motion.blockquote
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="border-l-[3px] pl-6 mt-8"
              style={{ borderColor: agent.color }}
            >
              <p className="font-body text-xl italic text-off-white leading-relaxed">
                &ldquo;{agent.voiceSample}&rdquo;
              </p>
            </motion.blockquote>
          </div>
        </div>
      </div>

      {/* Bottom rule */}
      <div className="absolute bottom-0 left-6 right-6 h-[1px] bg-gray-800" />
    </section>
  );
}
