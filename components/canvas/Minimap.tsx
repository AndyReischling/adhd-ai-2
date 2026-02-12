'use client';

import { useCanvasStore } from '@/store/canvasStore';

export default function Minimap() {
  const { viewport, assets } = useCanvasStore();

  // Calculate bounds of all assets
  const bounds = assets.reduce(
    (acc, asset) => ({
      minX: Math.min(acc.minX, asset.position.x),
      minY: Math.min(acc.minY, asset.position.y),
      maxX: Math.max(acc.maxX, asset.position.x + asset.width),
      maxY: Math.max(acc.maxY, asset.position.y + asset.height),
    }),
    { minX: -500, minY: -500, maxX: 1500, maxY: 1000 }
  );

  const mapWidth = 160;
  const mapHeight = 100;

  const worldWidth = bounds.maxX - bounds.minX + 200;
  const worldHeight = bounds.maxY - bounds.minY + 200;
  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  // Viewport rectangle in minimap coords
  const vpWidth = (window?.innerWidth || 1200) / viewport.zoom;
  const vpHeight = (window?.innerHeight || 800) / viewport.zoom;
  const vpX = (-viewport.x / viewport.zoom - bounds.minX + 100) * scale;
  const vpY = (-viewport.y / viewport.zoom - bounds.minY + 100) * scale;

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-gray-900/90 border border-gray-800 backdrop-blur-sm">
      <svg width={mapWidth} height={mapHeight} className="block">
        {/* Asset dots */}
        {assets.map((asset) => (
          <rect
            key={asset.id}
            x={(asset.position.x - bounds.minX + 100) * scale}
            y={(asset.position.y - bounds.minY + 100) * scale}
            width={Math.max(3, asset.width * scale)}
            height={Math.max(2, asset.height * scale)}
            fill="#C23B22"
            opacity={0.6}
          />
        ))}

        {/* Viewport indicator */}
        <rect
          x={vpX}
          y={vpY}
          width={vpWidth * scale}
          height={vpHeight * scale}
          fill="none"
          stroke="#F2EDE8"
          strokeWidth="1"
          opacity={0.5}
        />
      </svg>
    </div>
  );
}
