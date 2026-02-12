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
  const [expanded, setExpanded] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, assetX: 0, assetY: 0 });
  const didDragRef = useRef(false);

  const agent = getAgent(asset.createdBy);
  const agentColor = agent?.color || '#C23B22';
  const hasImage = !!asset.imageUrl;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      didDragRef.current = false;
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        assetX: asset.position.x,
        assetY: asset.position.y,
      };

      const onMove = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - dragRef.current.startX;
        const dy = moveEvent.clientY - dragRef.current.startY;
        // Only start dragging if moved more than 4px (otherwise it's a click)
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          didDragRef.current = true;
        }
        if (didDragRef.current) {
          updateAssetPosition(asset.id, {
            x: dragRef.current.assetX + dx / viewport.zoom,
            y: dragRef.current.assetY + dy / viewport.zoom,
          });
        }
      };

      const onUp = (upEvent: MouseEvent) => {
        setIsDragging(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);

        if (!didDragRef.current) {
          // It was a click, not a drag — open expanded view
          setExpanded(true);
          return;
        }

        const finalX = dragRef.current.assetX + (upEvent.clientX - dragRef.current.startX) / viewport.zoom;
        const finalY = dragRef.current.assetY + (upEvent.clientY - dragRef.current.startY) / viewport.zoom;

        if (onDragToAsset) {
          for (const other of assets) {
            if (other.id === asset.id) continue;
            const ddx = Math.abs(finalX - other.position.x);
            const ddy = Math.abs(finalY - other.position.y);
            if (ddx < 50 && ddy < 50) {
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
          <div className="p-2">
            <div className="font-mono text-[7px] tracking-[0.2em] text-gray-600 mb-1.5 px-1">
              {typeLabel}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={asset.imageUrl}
              alt={asset.title}
              className="w-full rounded-sm"
            />
            <h4 className="font-display text-[11px] text-off-white mt-1.5 px-1 leading-tight">
              {asset.title}
            </h4>
          </div>
        ) : (
          <div className="p-3 min-w-[180px] max-w-[230px]">
            <div className="font-mono text-[8px] tracking-[0.2em] text-gray-600 mb-1.5">
              {typeLabel}
            </div>
            <h4 className="font-display text-sm text-off-white mb-1.5 leading-tight">
              {asset.title}
            </h4>
            <p className="font-body text-[11px] text-gray-400 leading-relaxed">
              {asset.content}
            </p>
          </div>
        )}

        {/* Loading indicator */}
        {asset.state === 'draft' && !hasImage && asset.type !== 'sticky_note' && asset.type !== 'text_card' && (
          <div className="px-3 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-primary rounded-full animate-pulse" />
              <span className="font-mono text-[8px] text-gray-600">RENDERING VISUAL...</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Expanded lightbox (click to read full text or view full image) ── */}
      {expanded && (
        <div
          className="fixed inset-0 z-[9000] bg-black-primary/90 backdrop-blur-sm flex items-center justify-center p-8"
          style={{ userSelect: 'text', cursor: 'default' }}
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-gray-900 border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setExpanded(false)}
              className="absolute top-3 right-3 font-mono text-xs text-gray-400 hover:text-off-white z-10"
            >
              CLOSE ×
            </button>

            {/* Header */}
            <div className="px-6 pt-5 pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agentColor }} />
                <span className="font-mono text-[10px] tracking-[0.15em]" style={{ color: agentColor }}>
                  {agent?.name}
                </span>
                <span className="font-mono text-[10px] text-gray-600 ml-2">
                  {typeLabel}
                </span>
                {stateLabel && (
                  <span
                    className="font-accent text-[9px] tracking-[0.2em] px-1.5 py-0.5 ml-auto"
                    style={{ color: stateLabelColor!, border: `1px solid ${stateLabelColor}40` }}
                  >
                    {stateLabel}
                  </span>
                )}
              </div>
              <h2 className="font-display text-2xl text-off-white leading-tight">
                {asset.title}
              </h2>
            </div>

            {/* Image if present */}
            {hasImage && (
              <div className="px-6 pt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset.imageUrl}
                  alt={asset.title}
                  className="w-full rounded-sm"
                />
              </div>
            )}

            {/* Full text content — no truncation */}
            <div className="px-6 py-5">
              <p className="font-body text-sm text-gray-300 leading-[1.8] whitespace-pre-wrap">
                {asset.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
