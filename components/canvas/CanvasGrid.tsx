'use client';

interface CanvasGridProps {
  zoom: number;
}

export default function CanvasGrid({ zoom }: CanvasGridProps) {
  // Fade grid at high zoom, show at low zoom
  const opacity = Math.max(0, Math.min(0.3, 0.3 - (zoom - 1) * 0.15));
  const spacing = 30;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity }}
    >
      <defs>
        <pattern
          id="dotGrid"
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={spacing / 2} cy={spacing / 2} r="1" fill="#6B6B6B" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotGrid)" />
    </svg>
  );
}
