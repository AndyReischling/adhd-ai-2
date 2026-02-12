import type { Metadata } from 'next';
import {
  Playfair_Display,
  JetBrains_Mono,
  Bebas_Neue,
  Instrument_Serif,
} from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import GrainOverlay from '@/components/ui/GrainOverlay';
import CustomCursor from '@/components/ui/CustomCursor';

const playfair = Playfair_Display({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap',
});

const bebas = Bebas_Neue({
  variable: '--font-accent',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

const instrument = Instrument_Serif({
  variable: '--font-body',
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ADHD AI — A Feral Design Collective',
  description:
    'We see the disasters you\'re too polite to mention. Then we design the apology.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${jetbrains.variable} ${bebas.variable} ${instrument.variable} bg-black-primary text-off-white antialiased`}
      >
        <CustomCursor />
        <GrainOverlay />
        <Navbar />
        <main className="min-h-screen pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
