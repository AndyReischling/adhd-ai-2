'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import TypewriterText from '@/components/ui/TypewriterText';
import Button from '@/components/ui/Button';

export default function Hero() {
  const router = useRouter();

  const titleLetters = 'ADHD AI'.split('');

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-black-primary overflow-hidden -mt-16 pt-16">
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-primary/[0.02] to-transparent" />

      <div className="relative z-10 text-center px-6">
        {/* Main title — staggered reveal */}
        <h1 className="font-display text-[clamp(4rem,15vw,12rem)] leading-[0.85] tracking-tight mb-6">
          {titleLetters.map((letter, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.1 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block"
            >
              {letter === ' ' ? '\u00A0' : letter}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-body italic text-[clamp(1.1rem,3vw,1.75rem)] text-gray-200 mb-10"
        >
          A Feral Design Collective
        </motion.p>

        {/* Typewriter tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="font-mono text-sm md:text-base text-gray-400 mb-16 max-w-xl mx-auto"
        >
          <TypewriterText
            text={`"We see the disasters you're too polite to mention. Then we design the apology."`}
            speed={25}
            delay={1600}
          />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push('/project')}
          >
            START PROJECT
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => router.push('/about')}
          >
            MEET THE AGENTS
          </Button>
        </motion.div>
      </div>

      {/* Brutalist divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-red-primary" />
    </section>
  );
}
