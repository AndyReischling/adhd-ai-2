'use client';

import { ChatMessage as ChatMessageType } from '@/types';
import { getAgent } from '@/lib/agents';

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  // Guard against undefined/malformed messages
  if (!message || !message.agentId) return null;

  const content = message.content || '';
  const isUser = message.agentId === 'user';
  const agent = !isUser ? getAgent(message.agentId) : null;
  const agentColor = agent?.color || '#F2EDE8';
  const isStreaming = !message.isComplete && !isUser;

  let timestamp = '';
  try {
    timestamp = new Date(message.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    timestamp = '';
  }

  if (isUser) {
    return (
      <div className="px-4 py-3 bg-gray-800/30">
        <div className="flex items-baseline justify-between mb-1">
          <span className="font-mono text-[10px] tracking-[0.15em] text-gray-400">
            USER
          </span>
          <span className="font-mono text-[10px] text-gray-600">
            {timestamp}
          </span>
        </div>
        <p className="font-mono text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    );
  }

  const displayName = agent?.name || (message.agentId || 'AGENT').toUpperCase();

  return (
    <div className="px-4 py-3">
      <div className="flex items-baseline justify-between mb-1">
        <span
          className="font-mono text-[11px] tracking-[0.15em] font-bold"
          style={{ color: agentColor }}
        >
          {displayName}
        </span>
        <span className="font-mono text-[10px] text-gray-600">
          {timestamp}
        </span>
      </div>
      <div
        className="w-full h-[1px] mb-2"
        style={{ backgroundColor: `${agentColor}30` }}
      />
      <p className="font-mono text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
        {content}
        {isStreaming && (
          <span
            className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
            style={{
              backgroundColor: agentColor,
              animation: 'cursor-blink 1s step-end infinite',
            }}
          />
        )}
      </p>
    </div>
  );
}
