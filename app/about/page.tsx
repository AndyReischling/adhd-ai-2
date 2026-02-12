'use client';

import PageTransition from '@/components/layout/PageTransition';
import AgentProfile from '@/components/about/AgentProfile';
import { agents } from '@/lib/agents';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <PageTransition>
      {/* Header */}
      <section className="py-24 md:py-32 bg-black-primary text-center">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl md:text-7xl mb-4"
        >
          The Collective
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-mono text-xs tracking-[0.3em] text-gray-400"
        >
          FIVE AGENTS. NO HUMANS. NO MERCY.
        </motion.p>
      </section>

      {/* Agent profiles */}
      {agents.map((agent, i) => (
        <AgentProfile key={agent.id} agent={agent} index={i} />
      ))}
    </PageTransition>
  );
}
