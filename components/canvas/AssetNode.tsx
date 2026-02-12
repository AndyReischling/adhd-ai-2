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
  const [imageExpanded, setImageExpanded] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, assetX: 0, assetY: 0 });

  const agent = getAgent(asset.createdBy);
  const agentColor = agent?.color || '#C23B22';
  const hasImage = !!asset.imageUrl;

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
    draft: 'opacity-80 border-gray-600',
    review: 'opacity-90 border-gold-accent',
    final: 'opacity-100 border-gray-400',
  };

  const stateLabel =
    asset.state === 'draft' ? 'WIP' : asset.state === 'final' ? 'APPROVED' : null;
  const stateLabelColor =
    asset.state === 'draft' ? '#C23B22' : asset.state === 'final' ? '#C4A44A' : null;

  const typeLabel = asset.type.replace(/_/g, ' ').toUpperCase();

  return (
    <>
      <motion.div
        data-asset="true"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
        className={`absolute border ${stateStyles[asset.state]} ${
          isDragging ? 'z-50 shadow-xl shadow-black/40' : 'z-10 shadow-lg shadow-black/20'
        } hover:shadow-xl hover:shadow-black/30 transition-shadow duration-200 bg-gray-900`}
        style={{
          left: asset.position.x,
          top: asset.position.y,
          cursor: 'grab',
          width: hasImage ? 230 : undefined,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Agent attribution label above */}
        <div
          className="absolute -top-2.5 left-2 flex items-center gap-1 px-1.5 py-0.5"
          style={{ backgroundColor: '#0A0A0A' }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: agentColor }} />
          <span className="font-mono text-[8px] tracking-[0.1em]" style={{ color: agentColor }}>
            {agent?.name}
          </span>
        </div>

        {/* State label below */}
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

        {/* ── Content: IMAGE or TEXT ── */}
        {hasImage ? (
          /* Image-based asset */
          <div className="p-2">
            <div className="font-mono text-[7px] tracking-[0.2em] text-gray-600 mb-1.5 px-1">
              {typeLabel}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.imageUrl}
              alt={asset.title}
              className="w-full rounded-sm cursor-pointer"
              style={{ imageRendering: 'auto' }}
              onClick={(e) => {
                e.stopPropagation();
                setImageExpanded(true);
              }}
            />
            <h4 className="font-display text-[11px] text-off-white mt-1.5 px-1 leading-tight line-clamp-2">
              {asset.title}
            </h4>
          </div>
        ) : (
          /* Text-based asset (fallback) */
          <div className="p-3 min-w-[180px] max-w-[230px]">
            <div className="font-mono text-[8px] tracking-[0.2em] text-gray-600 mb-1.5">
              {typeLabel}
            </div>
            <h4 className="font-display text-sm text-off-white mb-1.5 leading-tight">
              {asset.title}
            </h4>
            <p className="font-body text-[11px] text-gray-400 leading-relaxed line-clamp-4">
              {asset.content}
            </p>
          </div>
        )}

        {/* Loading indicator while image is being generated */}
        {asset.state === 'draft' && !hasImage && asset.type !== 'sticky_note' && asset.type !== 'text_card' && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-primary rounded-full animate-pulse" />
              <span className="font-mono text-[8px] text-gray-600">RENDERING VISUAL...</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Expanded image lightbox ── */}
      {imageExpanded && hasImage && (
        <div
          className="fixed inset-0 z-[9000] bg-black-primary/90 backdrop-blur-sm flex items-center justify-center p-8"
          onClick={() => setImageExpanded(false)}
        >
          <div className="relative max-w-3xl max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImageExpanded(false)}
              className="absolute -top-8 right-0 font-mono text-xs text-gray-400 hover:text-off-white"
            >
              CLOSE ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.imageUrl}
              alt={asset.title}
              className="max-w-full max-h-[80vh] object-contain rounded-sm"
            />
            <div className="mt-3 text-center">
              <h3 className="font-display text-lg text-off-white">{asset.title}</h3>
              <p className="font-mono text-[10px] text-gray-400 mt-1">
                {typeLabel} — by {agent?.name}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
