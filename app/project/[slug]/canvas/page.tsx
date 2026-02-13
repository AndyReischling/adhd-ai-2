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
    addAsset,
    updateAsset,
    updateAssetState,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const chatMessagesRef = useRef(chatMessages);
  chatMessagesRef.current = chatMessages;

  const [cursorEngine, setCursorEngine] = useState<CursorEngine | null>(null);
  const [showCombineIndicator, setShowCombineIndicator] = useState(false);
  const [isCombining, setIsCombining] = useState(false);
  const [showCompleteBanner, setShowCompleteBanner] = useState(false);

  // Auto-show and auto-dismiss the "CAMPAIGN COMPLETE" banner
  useEffect(() => {
    if (isComplete) {
      setShowCompleteBanner(true);
      const timer = setTimeout(() => setShowCompleteBanner(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  // Redirect if no company
  useEffect(() => {
    if (!company) {
      router.push('/project');
    }
  }, [company, router]);

  // Initialize cursor engine + orchestrator
  useEffect(() => {
    if (!company) return;
    mountedRef.current = true;

    // Create cursor engine (uses direct DOM updates, no React state)
    const initialCursors = [
      { agentId: 'boris', position: { x: 200, y: 120 }, targetPosition: { x: 200, y: 120 }, state: 'idle' as const, color: '#C23B22', label: 'BORIS' },
      { agentId: 'nadia', position: { x: 500, y: 160 }, targetPosition: { x: 500, y: 160 }, state: 'idle' as const, color: '#C4A44A', label: 'NADIA' },
      { agentId: 'gremlin', position: { x: 350, y: 80 }, targetPosition: { x: 350, y: 80 }, state: 'idle' as const, color: '#39FF14', label: 'GREMLIN' },
      { agentId: 'the-archivist', position: { x: 650, y: 100 }, targetPosition: { x: 650, y: 100 }, state: 'idle' as const, color: '#5B8CFF', label: 'THE ARCHIVIST' },
      { agentId: 'comrade-pixel', position: { x: 820, y: 140 }, targetPosition: { x: 820, y: 140 }, state: 'idle' as const, color: '#FF6B9D', label: 'COMRADE PIXEL' },
    ];

    const engine = new CursorEngine(initialCursors);
    const w = Math.max(800, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 260 - 350 - 20);
    const h = Math.max(400, (typeof window !== 'undefined' ? window.innerHeight : 800) - 64 - 20);
    engine.setWorkspaceSize(w, h);
    engine.start();
    cursorEngineRef.current = engine;
    setCursorEngine(engine);

    // Guard state setters against unmount
    const guard = <T extends unknown[]>(fn: (...args: T) => void) => {
      return (...args: T) => { if (mountedRef.current) fn(...args); };
    };

    const orchestrator = new PhaseOrchestrator(
      {
        addAsset: guard(addAsset),
        updateAsset: guard(updateAsset),
        updateAssetState: guard(updateAssetState),
        addChatMessage: guard(addMessage),
        updateChatMessage: guard(updateMessage),
        setCursorState: (agentId, state, target) => {
          engine.setCursorState(
            agentId,
            state as 'idle' | 'working' | 'discussing' | 'reviewing' | 'creating',
            target
          );
        },
        setPhase: (phase: string) => { if (mountedRef.current) setCanvasPhase(phase as CanvasPhase); },
        setComplete: (v: boolean) => { if (mountedRef.current) setComplete(v); },
        getMessages: () => chatMessagesRef.current || [],
      },
      { company, scenarios: selectedScenarios || [] }
    );

    orchestrator.start();
    orchestratorRef.current = orchestrator;

    return () => {
      mountedRef.current = false;
      engine.destroy();
      orchestrator.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  // Update cursor engine with latest assets
  useEffect(() => {
    cursorEngineRef.current?.setAssets(assets || []);
  }, [assets]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle asset combination
  const handleDragToAsset = useCallback(
    async (draggedId: string, targetId: string) => {
      if (isCombining || !company) return;
      const assetA = (assets || []).find((a) => a.id === draggedId);
      const assetB = (assets || []).find((a) => a.id === targetId);
      if (!assetA || !assetB) return;

      setIsCombining(true);
      setShowCombineIndicator(true);

      try {
        const result = await apiCombineAssets(assetA, assetB, {
          company,
          scenarios: selectedScenarios || [],
        });
        if (result?.conversation) {
          for (const msg of result.conversation) {
            addMessage({
              id: `combine-${Date.now()}-${Math.random()}`,
              agentId: msg.agentId,
              content: msg.content,
              timestamp: new Date(),
              isComplete: true,
            });
            await new Promise((r) => setTimeout(r, 500));
          }
        }
        addAsset(createCombinedAsset(assetA, assetB, {
          type: result?.newAsset?.type,
          title: result?.newAsset?.title || 'Combined Asset',
          content: result?.newAsset?.content || '',
        }));
        updateAssetState(draggedId, 'review');
        updateAssetState(targetId, 'review');
      } catch {
        addAsset(createCombinedAsset(assetA, assetB, {
          title: `${assetA.title} × ${assetB.title}`,
          content: `${assetA.content}\n\n${assetB.content}`,
        }));
      } finally {
        setIsCombining(false);
        setTimeout(() => setShowCombineIndicator(false), 800);
      }
    },
    [assets, isCombining, company, selectedScenarios, addAsset, addMessage, updateAssetState]
  );

  // Handle user chat
  const handleChatSend = useCallback(
    async (text: string, taggedAgentId?: string) => {
      if (!company) return;
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
      addMessage({
        id: msgId,
        agentId: respondingAgent,
        content: '',
        timestamp: new Date(),
        isComplete: false,
      });

      try {
        let fullContent = '';
        await streamChat(
          respondingAgent,
          [...(chatMessagesRef.current || []), userMsg],
          { company, scenarios: selectedScenarios || [] },
          (token: string) => {
            fullContent += token;
            if (mountedRef.current) updateMessage(msgId, { content: fullContent });
          },
          () => {
            if (mountedRef.current) {
              updateMessage(msgId, { isComplete: true, content: fullContent });
              setTyping(respondingAgent, false);
            }
          }
        );
      } catch {
        if (mountedRef.current) {
          updateMessage(msgId, { content: 'THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION.', isComplete: true });
          setTyping(respondingAgent, false);
        }
      }
    },
    [addMessage, updateMessage, setTyping, company, selectedScenarios]
  );

  const phaseIndex = ['research', 'ideation', 'production', 'finalization', 'export', 'complete'].indexOf(canvasPhase);

  if (!company) return null;

  return (
    <div className="fixed inset-0 top-16 bg-black-primary overflow-hidden flex select-none" style={{ userSelect: 'none' }}>
      <TaskPanel />

      <WorkspaceCanvas cursorEngine={cursorEngine}>
        {(assets || []).map((asset) => (
          <AssetNode key={asset.id} asset={asset} onDragToAsset={handleDragToAsset} />
        ))}
      </WorkspaceCanvas>

      <div className="w-[350px] flex-shrink-0 bg-gray-900/95 border-l border-gray-800 flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <span className="font-mono text-xs tracking-[0.15em] text-off-white font-bold">AGENT DIALOGUE</span>
          <span className="font-mono text-[10px] text-green-terminal tracking-wider">Phase {Math.min(Math.max(phaseIndex, 0), 4)}/4</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {(chatMessages || []).filter((msg) => msg && msg.agentId).map((msg) => (
            <ChatMessageComponent key={msg.id} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <ChatInput onSend={handleChatSend} />
      </div>

      <AnimatePresence>{isComplete && <ExportPanel />}</AnimatePresence>

      <AnimatePresence>
        {showCombineIndicator && (
          <motion.div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] pointer-events-none" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <StampLabel text={isCombining ? 'COMBINING' : 'COMBINED'} variant="gold" size="lg" animated />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCompleteBanner && (
          <motion.div
            className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[150] pointer-events-none"
            initial={{ opacity: 0, scale: 3, rotate: -15 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="border-4 border-gold-accent px-12 py-6 bg-black-primary/90 backdrop-blur-sm">
              <div className="font-accent text-3xl md:text-5xl tracking-[0.3em] text-gold-accent text-center">CAMPAIGN COMPLETE</div>
              <div className="font-mono text-xs text-gray-400 text-center mt-2 tracking-[0.2em]">THE COLLECTIVE HAS DELIVERED</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
