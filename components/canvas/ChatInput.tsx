'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { agents } from '@/lib/agents';

interface ChatInputProps {
  onSend: (message: string, taggedAgentId?: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback((value: string) => {
    setText(value);

    // Check for @ mention
    const lastAt = value.lastIndexOf('@');
    if (lastAt !== -1 && lastAt === value.length - 1) {
      setShowMentions(true);
      setMentionFilter('');
    } else if (lastAt !== -1) {
      const afterAt = value.slice(lastAt + 1);
      if (!afterAt.includes(' ')) {
        setShowMentions(true);
        setMentionFilter(afterAt.toLowerCase());
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  }, []);

  const handleMentionSelect = useCallback(
    (agentName: string) => {
      const lastAt = text.lastIndexOf('@');
      const newText = text.slice(0, lastAt) + `@${agentName} `;
      setText(newText);
      setShowMentions(false);
      inputRef.current?.focus();
    },
    [text]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (text.trim().length === 0) return;

        // Extract tagged agent
        const mentionMatch = text.match(/@(\S+)/);
        let taggedAgentId: string | undefined;
        if (mentionMatch) {
          const mentioned = mentionMatch[1].toLowerCase();
          const agent = agents.find(
            (a) =>
              a.name.toLowerCase() === mentioned ||
              a.id === mentioned
          );
          if (agent) taggedAgentId = agent.id;
        }

        onSend(text, taggedAgentId);
        setText('');
        setShowMentions(false);
      } else if (e.key === 'Escape') {
        setShowMentions(false);
      }
    },
    [text, onSend]
  );

  const filteredAgents = agents.filter((a) =>
    mentionFilter
      ? a.name.toLowerCase().includes(mentionFilter) ||
        a.id.includes(mentionFilter)
      : true
  );

  return (
    <div className="relative border-t border-gray-800 bg-gray-900">
      {/* @ mention dropdown */}
      <AnimatePresence>
        {showMentions && filteredAgents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-0 right-0 bg-gray-900 border border-gray-800 border-b-0"
          >
            {filteredAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleMentionSelect(agent.name)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 transition-colors text-left"
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="font-mono text-xs text-off-white">
                  {agent.name}
                </span>
                <span className="font-mono text-[10px] text-gray-600">
                  {agent.role.split('/')[0].trim()}
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 p-3">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message the collective... (@ to mention)"
          disabled={disabled}
          className="flex-1 bg-transparent font-mono text-sm text-off-white placeholder:text-gray-600 outline-none"
        />
        <button
          onClick={() => {
            if (text.trim().length === 0) return;
            const mentionMatch = text.match(/@(\S+)/);
            let taggedAgentId: string | undefined;
            if (mentionMatch) {
              const mentioned = mentionMatch[1].toLowerCase();
              const agent = agents.find(
                (a) =>
                  a.name.toLowerCase() === mentioned ||
                  a.id === mentioned
              );
              if (agent) taggedAgentId = agent.id;
            }
            onSend(text, taggedAgentId);
            setText('');
          }}
          disabled={disabled || text.trim().length === 0}
          className="font-mono text-xs text-red-primary hover:text-red-hover disabled:text-gray-600 transition-colors tracking-[0.1em]"
        >
          SEND
        </button>
      </div>
    </div>
  );
}
