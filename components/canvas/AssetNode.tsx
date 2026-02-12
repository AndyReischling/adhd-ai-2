'use client';

import { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { CanvasAsset } from '@/types';
import { getAgent } from '@/lib/agents';
import { useCanvasStore } from '@/store/canvasStore';

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

  const stateLabel =
    asset.state === 'draft'
      ? 'WIP'
      : asset.state === 'final'
      ? 'APPROVED'
      : null;

  const stateLabelColor =
    asset.state === 'draft'
      ? '#C23B22'
      : asset.state === 'final'
      ? '#C4A44A'
      : null;

  const renderContent = () => {
    switch (asset.type) {
      case 'sticky_note':
        return (
          <div
            className="p-3 min-w-[120px] max-w-[160px]"
            style={{ backgroundColor: `${agentColor}15` }}
          >
            <p className="font-body text-[11px] italic text-gray-300 leading-relaxed">
              {asset.content}
            </p>
            <div className="mt-2 font-mono text-[8px]" style={{ color: agentColor }}>
              — {agent?.name}
            </div>
          </div>
        );

      case 'ad_concept':
        return (
          <div className="p-4 min-w-[200px] max-w-[240px] bg-gray-900">
            <div className="font-mono text-[8px] tracking-[0.3em] text-gray-600 mb-2">
              AD CONCEPT
            </div>
            <h4 className="font-display text-sm text-off-white mb-1.5 leading-tight">
              {asset.title}
            </h4>
            <p className="font-body text-[11px] text-gray-400 leading-relaxed line-clamp-4">
              {asset.content}
            </p>
          </div>
        );

      case 'ooh_mockup':
        return (
          <div className="p-4 min-w-[200px] max-w-[240px] bg-gray-800">
            <div className="font-mono text-[8px] tracking-[0.3em] text-gray-500 mb-2">
              OOH PLACEMENT
            </div>
            <h4 className="font-display text-sm text-off-white mb-1.5 leading-tight">
              {asset.title}
            </h4>
            <div className="w-full h-[2px] bg-red-primary mb-2" />
            <p className="font-body text-[11px] text-gray-300 leading-relaxed line-clamp-4">
              {asset.content}
            </p>
          </div>
        );

      case 'messaging_framework':
        return (
          <div className="p-4 min-w-[220px] max-w-[250px] bg-gray-900 font-mono">
            <div className="text-[8px] tracking-[0.3em] text-red-primary mb-2">
              MESSAGING FRAMEWORK
            </div>
            <h4 className="text-[11px] text-off-white mb-2 tracking-[0.05em]">
              {asset.title}
            </h4>
            <div className="text-[10px] text-gray-400 leading-relaxed whitespace-pre-wrap line-clamp-6">
              {asset.content}
            </div>
          </div>
        );

      case 'manifesto':
        return (
          <div className="p-4 min-w-[220px] max-w-[260px] bg-gray-900 relative">
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-gold-accent" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-gold-accent" />

            <div className="font-accent text-[10px] tracking-[0.3em] text-gold-accent mb-2 text-center">
              MANIFESTO
            </div>
            <h4 className="font-display text-sm text-off-white mb-2 text-center leading-tight">
              {asset.title}
            </h4>
            <p className="font-body text-[11px] text-gray-300 leading-relaxed text-center line-clamp-5">
              {asset.content}
            </p>
          </div>
        );

      default: // text_card
        return (
          <div className="p-3 min-w-[180px] max-w-[230px] bg-gray-900">
            <div className="font-mono text-[8px] tracking-[0.2em] text-gray-600 mb-1.5">
              {asset.type.toUpperCase().replace('_', ' ')}
            </div>
            <h4 className="font-display text-sm text-off-white mb-1.5 leading-tight">
              {asset.title}
            </h4>
            <p className="font-body text-[11px] text-gray-400 leading-relaxed line-clamp-4">
              {asset.content}
            </p>
          </div>
        );
    }
  };

  return (
    <motion.div
      data-asset="true"
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
      {/* Agent attribution dot + name */}
      <div
        className="absolute -top-2.5 left-2 flex items-center gap-1 px-1.5 py-0.5"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: agentColor }}
        />
        <span
          className="font-mono text-[8px] tracking-[0.1em]"
          style={{ color: agentColor }}
        >
          {agent?.name}
        </span>
      </div>

      {/* State label — positioned BELOW the card, not overlapping content */}
      {stateLabel && (
        <div className="absolute -bottom-2.5 right-2">
          <span
            className="font-accent text-[8px] tracking-[0.2em] px-1.5 py-0.5 inline-block transform -rotate-[3deg]"
            style={{
              backgroundColor: '#0A0A0A',
              color: stateLabelColor!,
              border: `1px solid ${stateLabelColor}40`,
            }}
          >
            {stateLabel}
          </span>
        </div>
      )}

      {renderContent()}
    </motion.div>
  );
}
