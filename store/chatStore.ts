import { create } from 'zustand';
import { ChatMessage } from '@/types';

interface ChatState {
  messages: ChatMessage[];
  isAgentTyping: Record<string, boolean>;
  isChatOpen: boolean;

  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, update: Partial<ChatMessage>) => void;
  setTyping: (agentId: string, typing: boolean) => void;
  setChatOpen: (open: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isAgentTyping: {},
  isChatOpen: true,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, update) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...update } : m
      ),
    })),

  setTyping: (agentId, typing) =>
    set((state) => ({
      isAgentTyping: { ...state.isAgentTyping, [agentId]: typing },
    })),

  setChatOpen: (open) => set({ isChatOpen: open }),

  clearMessages: () => set({ messages: [] }),
}));
