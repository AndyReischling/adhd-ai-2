'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '@/store/chatStore';
import { useProjectStore } from '@/store/projectStore';
import { streamChat } from '@/lib/api';
import { ChatMessage as ChatMessageType } from '@/types';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

export default function ChatPanel() {
  const {
    messages,
    isChatOpen,
    setChatOpen,
    addMessage,
    updateMessage,
    setTyping,
  } = useChatStore();
  const { company, selectedScenarios } = useProjectStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAutoScroll]);

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAutoScroll(isNearBottom);
    setShowScrollButton(!isNearBottom && messages.length > 5);
  }, [messages.length]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAutoScroll(true);
    setShowScrollButton(false);
  }, []);

  const handleSend = useCallback(
    async (text: string, taggedAgentId?: string) => {
      // Add user message
      const userMsg: ChatMessageType = {
        id: `user-${Date.now()}`,
        agentId: 'user',
        content: text,
        timestamp: new Date(),
        isComplete: true,
      };
      addMessage(userMsg);

      // Determine which agent responds
      const respondingAgent = taggedAgentId || 'boris';
      const msgId = `${respondingAgent}-${Date.now()}`;

      setTyping(respondingAgent, true);

      // Add placeholder message
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
          [...messages, userMsg],
          {
            company: company!,
            scenarios: selectedScenarios,
          },
          (token) => {
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
          content: 'THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION. STAND BY.',
          isComplete: true,
        });
        setTyping(respondingAgent, false);
      }
    },
    [addMessage, updateMessage, setTyping, messages, company, selectedScenarios]
  );

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setChatOpen(!isChatOpen)}
        className="fixed top-20 right-4 z-50 bg-gray-900/90 border border-gray-800 px-3 py-2 font-mono text-[10px] tracking-[0.2em] text-gray-400 hover:text-off-white transition-colors backdrop-blur-sm"
      >
        {isChatOpen ? 'CLOSE' : 'COMMS'}
      </button>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ x: 350 }}
            animate={{ x: 0 }}
            exit={{ x: 350 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-16 right-0 bottom-0 w-full md:w-[350px] bg-gray-900/95 backdrop-blur-sm border-l border-gray-800 z-40 flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
              <h3 className="font-mono text-xs tracking-[0.2em] text-gray-400">
                COLLECTIVE COMMUNICATIONS
              </h3>
            </div>

            {/* Messages */}
            <div
              ref={containerRef}
              className="flex-1 overflow-y-auto"
              onScroll={handleScroll}
            >
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom FAB */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-16 right-4 bg-red-primary text-off-white font-mono text-[10px] px-3 py-1.5 z-10"
                >
                  LATEST ↓
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input */}
            <ChatInput onSend={handleSend} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
