'use client';

import {
  useRef,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import CanvasGrid from './CanvasGrid';

interface InfiniteCanvasProps {
  children: ReactNode;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export default function InfiniteCanvas({ children }: InfiniteCanvasProps) {
  const { viewport, setViewport } = useCanvasStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  // Wheel handler — zoom toward cursor position
  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = clamp(viewport.zoom * zoomFactor, 0.25, 3);

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      setViewport({
        x: mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom),
        y: mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom),
        zoom: newZoom,
      });
    },
    [viewport, setViewport]
  );

  // Pan handlers
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on direct canvas click (not on children)
      if (e.target !== containerRef.current && e.target !== containerRef.current?.querySelector('.canvas-grid-area')) {
        return;
      }
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        vx: viewport.x,
        vy: viewport.y,
      };
    },
    [viewport]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setViewport({
        x: panStartRef.current.vx + dx,
        y: panStartRef.current.vy + dy,
        zoom: viewport.zoom,
      });
    },
    [isPanning, viewport.zoom, setViewport]
  );

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Touch handling for pinch-to-zoom
  const touchStartRef = useRef<{ dist: number; zoom: number; cx: number; cy: number } | null>(null);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        touchStartRef.current = {
          dist,
          zoom: viewport.zoom,
          cx: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          cy: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      } else if (e.touches.length === 1) {
        setIsPanning(true);
        panStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          vx: viewport.x,
          vy: viewport.y,
        };
      }
    },
    [viewport]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && touchStartRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = dist / touchStartRef.current.dist;
        const newZoom = clamp(touchStartRef.current.zoom * scale, 0.25, 3);
        setViewport({ ...viewport, zoom: newZoom });
      } else if (e.touches.length === 1 && isPanning) {
        const dx = e.touches[0].clientX - panStartRef.current.x;
        const dy = e.touches[0].clientY - panStartRef.current.y;
        setViewport({
          x: panStartRef.current.vx + dx,
          y: panStartRef.current.vy + dy,
          zoom: viewport.zoom,
        });
      }
    },
    [viewport, isPanning, setViewport]
  );

  const onTouchEnd = useCallback(() => {
    touchStartRef.current = null;
    setIsPanning(false);
  }, []);

  // Attach wheel event with passive: false
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Global mouse move/up for panning
  useEffect(() => {
    if (isPanning) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [isPanning, onMouseMove, onMouseUp]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-black-primary"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
    >
      {/* Grid layer (behind transform) */}
      <div className="absolute inset-0 canvas-grid-area">
        <CanvasGrid zoom={viewport.zoom} />
      </div>

      {/* Transformed canvas content */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute top-0 left-0"
      >
        {children}
      </div>
    </div>
  );
}
