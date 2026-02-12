'use client';

import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { CanvasAsset } from '@/types';
import { getAgent } from '@/lib/agents';
import { useCanvasStore } from '@/store/canvasStore';
import StampLabel from '@/components/ui/StampLabel';

interface AssetNodeProps {
  asset: CanvasAsset;
  onDragToAsset?: (draggedId: string, targetId: string) => void;
}

export default function AssetNode({ asset, onDragToAsset }: AssetNodeProps) {
  const updateAssetPosition = useCanvasStore((s) => s.updateAssetPosition);
  const assets = useCanvasStore((s) => s.assets);
  const viewport = useCanvasStore((s) => s.viewport);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, assetX: 0, assetY: 0 });

  const agent = getAgent(asset.createdBy);
  const agentColor = agent?.color || '#C23B22';

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        assetX: asset.position.x,
        assetY: asset.position.y,
      };

      const onMove = (moveEvent: MouseEvent) => {
        const dx = (moveEvent.clientX - dragRef.current.startX) / viewport.zoom;
        const dy = (moveEvent.clientY - dragRef.current.startY) / viewport.zoom;
        updateAssetPosition(asset.id, {
          x: dragRef.current.assetX + dx,
          y: dragRef.current.assetY + dy,
        });
      };

      const onUp = (upEvent: MouseEvent) => {
        setIsDragging(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);

        // Check proximity to other assets for combination
        const finalX = dragRef.current.assetX + (upEvent.clientX - dragRef.current.startX) / viewport.zoom;
        const finalY = dragRef.current.assetY + (upEvent.clientY - dragRef.current.startY) / viewport.zoom;

        if (onDragToAsset) {
          for (const other of assets) {
            if (other.id === asset.id) continue;
            const dx = Math.abs(finalX - other.position.x);
            const dy = Math.abs(finalY - other.position.y);
            if (dx < 50 && dy < 50) {
              onDragToAsset(asset.id, other.id);
              break;
            }
          }
        }
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [asset, updateAssetPosition, viewport.zoom, assets, onDragToAsset]
  );

  const stateStyles = {
    draft: 'opacity-70 border-gray-600',
    review: 'opacity-85 border-gold-accent',
    final: 'opacity-100 border-gray-400',
  };

  const renderContent = () => {
    switch (asset.type) {
      case 'sticky_note':
        return (
          <div
            className="p-3 min-w-[140px] max-w-[180px]"
            style={{ backgroundColor: `${agentColor}15` }}
          >
            <p className="font-body text-xs italic text-gray-300 leading-relaxed">
              {asset.content}
            </p>
            <div className="mt-2 font-mono text-[9px]" style={{ color: agentColor }}>
              — {agent?.name}
            </div>
          </div>
        );

      case 'ad_concept':
        return (
          <div className="p-5 min-w-[260px] max-w-[320px] bg-gray-900">
            {/* Crop marks */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t border-l border-gray-600" />
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-gray-600" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-gray-600" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b border-r border-gray-600" />

            <div className="font-mono text-[9px] tracking-[0.3em] text-gray-600 mb-3">
              AD CONCEPT
            </div>
            <h4 className="font-display text-lg text-off-white mb-2 leading-tight">
              {asset.title}
            </h4>
            <p className="font-body text-sm text-gray-400 leading-relaxed">
              {asset.content}
            </p>
          </div>
        );

      case 'ooh_mockup':
        return (
          <div className="p-5 min-w-[280px] max-w-[360px] bg-gray-800 border-4 border-gray-700">
            <div className="font-mono text-[9px] tracking-[0.3em] text-gray-500 mb-3">
              OOH PLACEMENT
            </div>
            <h4 className="font-display text-xl text-off-white mb-2 leading-tight">
              {asset.title}
            </h4>
            <div className="w-full h-[2px] bg-red-primary mb-3" />
            <p className="font-body text-sm text-gray-300 leading-relaxed">
              {asset.content}
            </p>
          </div>
        );

      case 'messaging_framework':
        return (
          <div className="p-5 min-w-[300px] max-w-[380px] bg-gray-900 font-mono">
            <div className="text-[9px] tracking-[0.3em] text-red-primary mb-3">
              MESSAGING FRAMEWORK — CLASSIFIED
            </div>
            <h4 className="text-sm text-off-white mb-3 tracking-[0.1em]">
              {asset.title}
            </h4>
            <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
              {asset.content}
            </div>
          </div>
        );

      case 'manifesto':
        return (
          <div className="p-6 min-w-[320px] max-w-[420px] bg-gray-900 border-2 border-gray-700 relative">
            {/* Decorative corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-accent" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-accent" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-accent" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-accent" />

            <div className="font-accent text-sm tracking-[0.4em] text-gold-accent mb-4 text-center">
              MANIFESTO
            </div>
            <h4 className="font-display text-lg text-off-white mb-3 text-center">
              {asset.title}
            </h4>
            <p className="font-body text-sm text-gray-300 leading-[1.8] text-center">
              {asset.content}
            </p>
          </div>
        );

      default: // text_card
        return (
          <div className="p-4 min-w-[220px] max-w-[300px] bg-gray-900">
            <div className="font-mono text-[9px] tracking-[0.2em] text-gray-600 mb-2">
              {asset.type.toUpperCase().replace('_', ' ')}
            </div>
            <h4 className="font-display text-base text-off-white mb-2">
              {asset.title}
            </h4>
            <p className="font-body text-xs text-gray-400 leading-relaxed">
              {asset.content}
            </p>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        mass: 0.8,
      }}
      className={`absolute border ${stateStyles[asset.state]} ${
        isDragging ? 'z-50 shadow-xl shadow-black/40' : 'z-10 shadow-lg shadow-black/20'
      } hover:shadow-xl hover:shadow-black/30 transition-shadow duration-200`}
      style={{
        left: asset.position.x,
        top: asset.position.y,
        cursor: 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Agent attribution dot */}
      <div
        className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full"
        style={{ backgroundColor: agentColor }}
      />

      {/* State stamps */}
      {asset.state === 'draft' && (
        <div className="absolute top-2 right-2">
          <StampLabel text="WIP" variant="red" size="sm" />
        </div>
      )}
      {asset.state === 'final' && (
        <div className="absolute top-2 right-2">
          <StampLabel text="APPROVED" variant="gold" size="sm" />
        </div>
      )}

      {renderContent()}
    </motion.div>
  );
}
