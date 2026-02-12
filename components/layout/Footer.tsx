'use client';

export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-black-primary">
      <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="font-mono text-[11px] text-gray-600 tracking-[0.15em]">
          &copy; ADHD AI COLLECTIVE. ALL OUTPUT IS THE PROPERTY OF THE VOID.
        </p>

        {/* Constructivist geometric mark */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="opacity-40">
          <rect x="2" y="2" width="12" height="12" stroke="#C23B22" strokeWidth="2" />
          <circle cx="22" cy="22" r="6" stroke="#C4A44A" strokeWidth="2" />
          <line x1="4" y1="28" x2="28" y2="4" stroke="#6B6B6B" strokeWidth="1.5" />
        </svg>
      </div>
    </footer>
  );
}
