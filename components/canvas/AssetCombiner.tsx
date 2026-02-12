'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { useChatStore } from '@/store/chatStore';
import { useProjectStore } from '@/store/projectStore';
import { combineAssets as apiCombineAssets } from '@/lib/api';
import { createCombinedAsset } from '@/lib/canvas/assetFactory';
import { ChatMessage } from '@/types';
import StampLabel from '@/components/ui/StampLabel';

export default function AssetCombiner() {
  const { assets, addAsset, updateAssetState } = useCanvasStore();
  const { addMessage } = useChatStore();
  const { company, selectedScenarios } = useProjectStore();
  const [combining, setCombining] = useState<{
    idA: string;
    idB: string;
  } | null>(null);
  const [showCombineIndicator, setShowCombineIndicator] = useState(false);

  const handleDragToAsset = useCallback(
    async (draggedId: string, targetId: string) => {
      const assetA = assets.find((a) => a.id === draggedId);
      const assetB = assets.find((a) => a.id === targetId);
      if (!assetA || !assetB) return;
      if (combining) return; // Already combining

      setCombining({ idA: draggedId, idB: targetId });
      setShowCombineIndicator(true);

      try {
        const result = await apiCombineAssets(assetA, assetB, {
          company: company!,
          scenarios: selectedScenarios,
        });

        // Add conversation messages
        for (const msg of result.conversation) {
          const chatMsg: ChatMessage = {
            id: `combine-${Date.now()}-${Math.random()}`,
            agentId: msg.agentId,
            content: msg.content,
            timestamp: new Date(),
            isComplete: true,
          };
          addMessage(chatMsg);
          await new Promise((r) => setTimeout(r, 500)); // Stagger messages
        }

        // Create the combined asset
        const newAsset = createCombinedAsset(assetA, assetB, {
          type: result.newAsset.type,
          title: result.newAsset.title,
          content: result.newAsset.content,
        });
        addAsset(newAsset);

        // Dim the original assets
        updateAssetState(draggedId, 'review');
        updateAssetState(targetId, 'review');
      } catch (err) {
        console.error('Combine failed:', err);
        // Fallback — create a simple merged asset
        const newAsset = createCombinedAsset(assetA, assetB, {
          title: `${assetA.title} + ${assetB.title}`,
          content: `${assetA.content}\n\n---\n\n${assetB.content}`,
        });
        addAsset(newAsset);
      } finally {
        setCombining(null);
        setTimeout(() => setShowCombineIndicator(false), 800);
      }
    },
    [assets, combining, company, selectedScenarios, addAsset, addMessage, updateAssetState]
  );

  return (
    <>
      {/* Expose the handler via a callback prop pattern */}
      {/* This component is used as a provider — it returns the handler */}
      <CombineContext.Provider value={handleDragToAsset}>
        {/* Children would go here if this were wrapping */}
      </CombineContext.Provider>

      {/* Combining indicator */}
      <AnimatePresence>
        {showCombineIndicator && (
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <StampLabel
              text={combining ? 'COMBINING' : 'COMBINED'}
              variant="gold"
              size="lg"
              animated
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Highlight borders on combining assets */}
      {combining &&
        assets
          .filter((a) => a.id === combining.idA || a.id === combining.idB)
          .map((a) => (
            <motion.div
              key={`highlight-${a.id}`}
              className="absolute border-2 border-gold-accent pointer-events-none z-40"
              style={{
                left: a.position.x - 4,
                top: a.position.y - 4,
                width: a.width + 8,
                height: a.height + 8,
              }}
              animate={{
                borderColor: ['#C4A44A', '#C4A44A80', '#C4A44A'],
              }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
          ))}
    </>
  );
}

// Context for passing the combine handler
import { createContext, useContext } from 'react';

const CombineContext = createContext<
  ((draggedId: string, targetId: string) => void) | null
>(null);

export function useCombineHandler() {
  return useContext(CombineContext);
}

export { CombineContext };
