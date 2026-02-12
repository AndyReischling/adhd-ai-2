'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { useProjectStore } from '@/store/projectStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useChatStore } from '@/store/chatStore';
import { CursorEngine } from '@/lib/canvas/cursorEngine';
import { PhaseOrchestrator } from '@/lib/canvas/phaseOrchestrator';
import { combineAssets as apiCombineAssets, streamChat } from '@/lib/api';
import { createCombinedAsset } from '@/lib/canvas/assetFactory';
import { ChatMessage as ChatMessageType, CanvasPhase } from '@/types';
import WorkspaceCanvas from '@/components/canvas/WorkspaceCanvas';
import AssetNode from '@/components/canvas/AssetNode';
import ChatMessageComponent from '@/components/canvas/ChatMessage';
import ChatInput from '@/components/canvas/ChatInput';
import TaskPanel from '@/components/canvas/TaskPanel';
import ExportPanel from '@/components/canvas/ExportPanel';
import StampLabel from '@/components/ui/StampLabel';

export default function CanvasPage() {
  const router = useRouter();
  const { company, selectedScenarios } = useProjectStore();
  const {
    assets,
    agentCursors,
    setAgentCursors,
    addAsset,
    updateAsset,
    updateAssetState,
    updateAgentCursor,
    setCanvasPhase,
    setComplete,
    isComplete,
    canvasPhase,
  } = useCanvasStore();
  const {
    messages: chatMessages,
    addMessage,
    updateMessage,
    setTyping,
  } = useChatStore();

  const cursorEngineRef = useRef<CursorEngine | null>(null);
  const orchestratorRef = useRef<PhaseOrchestrator | null>(null);
  const startedRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Refs for stable access from the orchestrator (avoids stale closure)
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;

  const [showCombineIndicator, setShowCombineIndicator] = useState(false);
  const [isCombining, setIsCombining] = useState(false);

  // Redirect if no company selected
  useEffect(() => {
    if (!company) {
      router.push('/project');
    }
  }, [company, router]);

  // Initialize and start cursor engine + orchestrator
  useEffect(() => {
    if (!company || startedRef.current) return;
    startedRef.current = true;

    const engine = new CursorEngine(agentCursors, (updated) => {
      setAgentCursors(updated);
    });

    // Set workspace size based on available space
    const workspaceWidth = Math.max(800, window.innerWidth - 260 - 350 - 20);
    const workspaceHeight = Math.max(400, window.innerHeight - 64 - 20);
    engine.setWorkspaceSize(workspaceWidth, workspaceHeight);

    engine.start();
    cursorEngineRef.current = engine;

    const orchestrator = new PhaseOrchestrator(
      {
        addAsset,
        updateAsset,
        updateAssetState,
        addChatMessage: addMessage,
        updateChatMessage: updateMessage,
        setCursorState: (agentId, state, target) => {
          updateAgentCursor(agentId, {
            state: state as 'idle' | 'working' | 'discussing' | 'reviewing' | 'creating',
            ...(target ? { targetPosition: target } : {}),
          });
          engine.setCursorState(
            agentId,
            state as 'idle' | 'working' | 'discussing' | 'reviewing' | 'creating',
            target
          );
        },
        setPhase: (phase: string) => setCanvasPhase(phase as CanvasPhase),
        setComplete,
        getMessages: () => chatMessagesRef.current || [],
      },
      { company, scenarios: selectedScenarios || [] }
    );

    orchestrator.start();
    orchestratorRef.current = orchestrator;

    return () => {
      engine.destroy();
      orchestrator.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  // Update cursor engine with latest assets
  useEffect(() => {
    cursorEngineRef.current?.setAssets(assets);
  }, [assets]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle asset combination via drag
  const handleDragToAsset = useCallback(
    async (draggedId: string, targetId: string) => {
      if (isCombining) return;
      const assetA = assets.find((a) => a.id === draggedId);
      const assetB = assets.find((a) => a.id === targetId);
      if (!assetA || !assetB) return;

      setIsCombining(true);
      setShowCombineIndicator(true);

      try {
        const result = await apiCombineAssets(assetA, assetB, {
          company: company!,
          scenarios: selectedScenarios,
        });

        for (const msg of result.conversation) {
          const chatMsg: ChatMessageType = {
            id: `combine-${Date.now()}-${Math.random()}`,
            agentId: msg.agentId,
            content: msg.content,
            timestamp: new Date(),
            isComplete: true,
          };
          addMessage(chatMsg);
          await new Promise((r) => setTimeout(r, 500));
        }

        const newAsset = createCombinedAsset(assetA, assetB, {
          type: result.newAsset.type,
          title: result.newAsset.title,
          content: result.newAsset.content,
        });
        addAsset(newAsset);
        updateAssetState(draggedId, 'review');
        updateAssetState(targetId, 'review');
      } catch {
        const newAsset = createCombinedAsset(assetA, assetB, {
          title: `${assetA.title} × ${assetB.title}`,
          content: `${assetA.content}\n\n${assetB.content}`,
        });
        addAsset(newAsset);
      } finally {
        setIsCombining(false);
        setTimeout(() => setShowCombineIndicator(false), 800);
      }
    },
    [assets, isCombining, company, selectedScenarios, addAsset, addMessage, updateAssetState]
  );

  // Handle user chat message
  const handleChatSend = useCallback(
    async (text: string, taggedAgentId?: string) => {
      const userMsg: ChatMessageType = {
        id: `user-${Date.now()}`,
        agentId: 'user',
        content: text,
        timestamp: new Date(),
        isComplete: true,
      };
      addMessage(userMsg);

      const respondingAgent = taggedAgentId || 'boris';
      const msgId = `${respondingAgent}-${Date.now()}`;
      setTyping(respondingAgent, true);

      const agentMsg: ChatMessageType = {
        id: msgId,
        agentId: respondingAgent,
        content: '',
        timestamp: new Date(),
        isComplete: false,
      };
      addMessage(agentMsg);

      try {
        let fullContent = '';
        await streamChat(
          respondingAgent,
          [...(chatMessages || []), userMsg],
          { company: company!, scenarios: selectedScenarios || [] },
          (token: string) => {
            fullContent += token;
            updateMessage(msgId, { content: fullContent });
          },
          () => {
            updateMessage(msgId, { isComplete: true, content: fullContent });
            setTyping(respondingAgent, false);
          }
        );
      } catch {
        updateMessage(msgId, {
          content: 'THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION.',
          isComplete: true,
        });
        setTyping(respondingAgent, false);
      }
    },
    [addMessage, updateMessage, setTyping, chatMessages, company, selectedScenarios]
  );

  const phaseIndex = ['research', 'ideation', 'production', 'finalization', 'export', 'complete'].indexOf(canvasPhase);
  const displayPhase = Math.min(phaseIndex, 4);

  if (!company) return null;

  return (
    <div className="fixed inset-0 top-16 bg-black-primary overflow-hidden flex select-none" style={{ userSelect: 'none' }}>
      {/* Left: Task Panel */}
      <TaskPanel />

      {/* Center: Workspace Canvas */}
      <WorkspaceCanvas>
        {assets.map((asset) => (
          <AssetNode
            key={asset.id}
            asset={asset}
            onDragToAsset={handleDragToAsset}
          />
        ))}
      </WorkspaceCanvas>

      {/* Right: Agent Dialogue Panel */}
      <div className="w-[350px] flex-shrink-0 bg-gray-900/95 border-l border-gray-800 flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <span className="font-mono text-xs tracking-[0.15em] text-off-white font-bold">
            AGENT DIALOGUE
          </span>
          <span className="font-mono text-[10px] text-green-terminal tracking-wider">
            Phase {displayPhase}/4
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {chatMessages.map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSend={handleChatSend} />
      </div>

      {/* Export panel overlay */}
      <AnimatePresence>
        {isComplete && <ExportPanel />}
      </AnimatePresence>

      {/* Combine indicator */}
      <AnimatePresence>
        {showCombineIndicator && (
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <StampLabel
              text={isCombining ? 'COMBINING' : 'COMBINED'}
              variant="gold"
              size="lg"
              animated
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Complete banner */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] pointer-events-none"
            initial={{ opacity: 0, scale: 3, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-4 border-gold-accent px-12 py-6 bg-black-primary/90 backdrop-blur-sm">
              <div className="font-accent text-3xl md:text-5xl tracking-[0.3em] text-gold-accent text-center">
                CAMPAIGN COMPLETE
              </div>
              <div className="font-mono text-xs text-gray-400 text-center mt-2 tracking-[0.2em]">
                THE COLLECTIVE HAS DELIVERED
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
