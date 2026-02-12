'use client';

import { useCanvasStore } from '@/store/canvasStore';

const phaseLabels: Record<string, string> = {
  research: 'PHASE I: RESEARCH & BRIEF',
  ideation: 'PHASE II: IDEATION',
  production: 'PHASE III: ASSET PRODUCTION',
  finalization: 'PHASE IV: FINALIZATION',
  export: 'PHASE V: EXPORT',
  complete: 'CAMPAIGN COMPLETE',
};

export default function CanvasToolbar() {
  const { viewport, setViewport, canvasPhase } = useCanvasStore();

  const handleZoomIn = () => {
    setViewport({
      ...viewport,
      zoom: Math.min(3, viewport.zoom * 1.2),
    });
  };

  const handleZoomOut = () => {
    setViewport({
      ...viewport,
      zoom: Math.max(0.25, viewport.zoom / 1.2),
    });
  };

  const handleReset = () => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-end gap-3">
      {/* Zoom controls */}
      <div className="bg-gray-900/90 border border-gray-800 backdrop-blur-sm flex flex-col">
        <button
          onClick={handleZoomIn}
          className="px-3 py-2 font-mono text-xs text-gray-400 hover:text-off-white hover:bg-gray-800 transition-colors border-b border-gray-800"
        >
          +
        </button>
        <button
          onClick={handleReset}
          className="px-3 py-2 font-mono text-[10px] text-gray-400 hover:text-off-white hover:bg-gray-800 transition-colors border-b border-gray-800"
        >
          {Math.round(viewport.zoom * 100)}%
        </button>
        <button
          onClick={handleZoomOut}
          className="px-3 py-2 font-mono text-xs text-gray-400 hover:text-off-white hover:bg-gray-800 transition-colors"
        >
          −
        </button>
      </div>

      {/* Phase indicator */}
      <div className="bg-gray-900/90 border border-gray-800 backdrop-blur-sm px-4 py-2">
        <div className="font-mono text-[10px] tracking-[0.2em] text-gray-600 mb-1">
          STATUS
        </div>
        <div className="font-mono text-xs tracking-[0.15em] text-red-primary">
          {phaseLabels[canvasPhase] || canvasPhase}
        </div>
      </div>
    </div>
  );
}
