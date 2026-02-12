'use client';

import { ReactNode, useRef, useState, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { agents } from '@/lib/agents';

interface WorkspaceCanvasProps {
  children: ReactNode;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

// Agent zone layout — 5 agents across the top, plus horizon zones at bottom
const agentZones = [
  { agentId: 'boris', label: 'BORIS', color: '#C23B22', col: 0 },
  { agentId: 'nadia', label: 'NADIA', color: '#C4A44A', col: 1 },
  { agentId: 'gremlin', label: 'GREMLIN', color: '#39FF14', col: 2 },
  { agentId: 'the-archivist', label: 'THE ARCHIVIST', color: '#5B8CFF', col: 3 },
  { agentId: 'comrade-pixel', label: 'COMRADE PIXEL', color: '#FF6B9D', col: 4 },
];

const horizonZones = [
  { id: 'next-year', label: 'Next Year', color: '#C23B22' },
  { id: 'five-years', label: 'Within 5 Years', color: '#C4A44A' },
  { id: 'decade', label: 'Within a Decade', color: '#39FF14' },
  { id: 'long-term', label: 'Long-Term Future', color: '#5B8CFF' },
];

export default function WorkspaceCanvas({ children }: WorkspaceCanvasProps) {
  const { agentCursors } = useCanvasStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan & zoom state
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  // Wheel: zoom with pinch, pan with two-finger scroll
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom (trackpad) or ctrl+scroll
        const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
        const newZoom = clamp(viewport.zoom * zoomFactor, 0.3, 3);
        const mouseX = e.clientX - (containerRef.current?.getBoundingClientRect().left || 0);
        const mouseY = e.clientY - (containerRef.current?.getBoundingClientRect().top || 0);

        setViewport((prev) => ({
          x: mouseX - (mouseX - prev.x) * (newZoom / prev.zoom),
          y: mouseY - (mouseY - prev.y) * (newZoom / prev.zoom),
          zoom: newZoom,
        }));
      } else {
        // Two-finger scroll = pan
        setViewport((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
          zoom: prev.zoom,
        }));
      }
    },
    [viewport.zoom]
  );

  // Mouse drag to pan
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan when clicking on the background, not on children
      if ((e.target as HTMLElement).closest('[data-asset]')) return;
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        vx: viewport.x,
        vy: viewport.y,
      };
    },
    [viewport.x, viewport.y]
  );

  useEffect(() => {
    if (!isPanning) return;
    const onMove = (e: MouseEvent) => {
      setViewport((prev) => ({
        ...prev,
        x: panStartRef.current.vx + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.vy + (e.clientY - panStartRef.current.y),
      }));
    };
    const onUp = () => setIsPanning(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isPanning]);

  // Attach wheel event with passive: false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Zone dimensions (in canvas space)
  const zoneW = 280;
  const zoneH = 340;
  const zoneGap = 16;
  const startX = 40;
  const startY = 50;
  const horizonY = startY + zoneH + 40;
  const horizonH = 220;

  return (
    <div
      ref={containerRef}
      className="flex-1 relative bg-black-primary overflow-hidden"
      onMouseDown={onMouseDown}
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
    >
      {/* Subtle dot grid background */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, #6B6B6B 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Zoom indicator */}
      <div className="absolute bottom-3 left-3 z-30 font-mono text-[10px] text-gray-600 bg-gray-900/80 px-2 py-1 border border-gray-800">
        {Math.round(viewport.zoom * 100)}%
      </div>

      {/* Transformed canvas content */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute top-0 left-0"
      >
        {/* ── Agent workspace zones ── */}
        {agentZones.map((zone) => {
          const x = startX + zone.col * (zoneW + zoneGap);
          const y = startY;
          return (
            <div
              key={zone.agentId}
              className="absolute"
              style={{
                left: x,
                top: y,
                width: zoneW,
                height: zoneH,
                border: `2px dashed ${zone.color}40`,
                borderRadius: 2,
                backgroundColor: `${zone.color}04`,
              }}
            >
              {/* Agent label badge */}
              <div
                className="absolute -top-3 left-3 flex items-center gap-1.5 px-2 py-0.5"
                style={{
                  backgroundColor: `${zone.color}25`,
                  border: `1px solid ${zone.color}40`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
                <span
                  className="font-mono text-[10px] font-bold tracking-[0.1em]"
                  style={{ color: zone.color }}
                >
                  {zone.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* ── Time horizon zones at bottom ── */}
        {horizonZones.map((zone, i) => {
          const totalW = 5 * (zoneW + zoneGap) - zoneGap;
          const hzW = (totalW - 3 * zoneGap) / 4;
          const x = startX + i * (hzW + zoneGap);
          return (
            <div
              key={zone.id}
              className="absolute"
              style={{
                left: x,
                top: horizonY,
                width: hzW,
                height: horizonH,
                border: `2px dashed ${zone.color}35`,
                borderRadius: 2,
                backgroundColor: `${zone.color}03`,
              }}
            >
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 whitespace-nowrap"
                style={{
                  backgroundColor: `${zone.color}20`,
                  border: `1px solid ${zone.color}35`,
                }}
              >
                <span
                  className="font-mono text-[9px] font-bold tracking-[0.15em]"
                  style={{ color: zone.color }}
                >
                  {zone.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* ── Agent cursors ── */}
        {agentCursors.map((cursor) => {
          const agent = agents.find((a) => a.id === cursor.agentId);
          if (!agent) return null;
          return (
            <div
              key={cursor.agentId}
              className="absolute z-50 pointer-events-none"
              style={{
                transform: `translate(${cursor.position.x}px, ${cursor.position.y}px)`,
              }}
            >
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none" className="drop-shadow-md">
                <path d="M0 0L14 10.5L7 10.5L10.5 18L7 18L3.5 10.5L0 14V0Z" fill={agent.color} />
                <path d="M0 0L14 10.5L7 10.5L10.5 18L7 18L3.5 10.5L0 14V0Z" stroke="rgba(0,0,0,0.5)" strokeWidth="0.5" />
              </svg>
              <div
                className="absolute top-3 left-4 flex items-center gap-1.5 px-2 py-0.5 rounded-sm whitespace-nowrap"
                style={{
                  backgroundColor: `${agent.color}20`,
                  border: `1px solid ${agent.color}50`,
                }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color }} />
                <span className="font-mono text-[10px] font-bold tracking-[0.1em]" style={{ color: agent.color }}>
                  {agent.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* ── Asset nodes (children) ── */}
        {children}
      </div>
    </div>
  );
}

/**
 * Compute the top-left position for an asset inside the given agent's zone.
 * slotIndex: 0-based index of the asset within that agent's zone.
 */
export function getAgentZonePosition(agentId: string, slotIndex: number): { x: number; y: number } {
  const zoneW = 280;
  const zoneGap = 16;
  const startX = 40;
  const startY = 50;
  const padding = 12;

  const zoneIdx = agentZones.findIndex((z) => z.agentId === agentId);
  const col = zoneIdx >= 0 ? zoneIdx : 0;
  const zoneX = startX + col * (zoneW + zoneGap);
  const zoneY = startY;

  // Stack assets vertically inside the zone
  const row = Math.floor(slotIndex / 1);
  return {
    x: zoneX + padding,
    y: zoneY + 20 + padding + row * 80,
  };
}
