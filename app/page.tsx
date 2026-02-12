'use client';

import PageTransition from '@/components/layout/PageTransition';
import Hero from '@/components/home/Hero';
import Manifesto from '@/components/home/Manifesto';
import ServicesStrip from '@/components/home/ServicesStrip';
import AntiTestimonials from '@/components/home/AntiTestimonials';

export default function HomePage() {
  return (
    <PageTransition>
      <Hero />
      <Manifesto />
      <ServicesStrip />
      <AntiTestimonials />
    </PageTransition>
  );
}
