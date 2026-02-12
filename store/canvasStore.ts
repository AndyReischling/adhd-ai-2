import { create } from 'zustand';
import { CanvasAsset, AgentCursor, AssetState, CanvasPhase } from '@/types';

interface CanvasState {
  assets: CanvasAsset[];
  agentCursors: AgentCursor[];
  viewport: { x: number; y: number; zoom: number };
  canvasPhase: CanvasPhase;
  isComplete: boolean;

  addAsset: (asset: CanvasAsset) => void;
  updateAsset: (id: string, update: Partial<CanvasAsset>) => void;
  updateAssetPosition: (id: string, pos: { x: number; y: number }) => void;
  updateAssetState: (id: string, state: AssetState) => void;
  removeAsset: (id: string) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setAgentCursors: (cursors: AgentCursor[]) => void;
  updateAgentCursor: (agentId: string, update: Partial<AgentCursor>) => void;
  setCanvasPhase: (phase: CanvasPhase) => void;
  setComplete: (complete: boolean) => void;
  reset: () => void;
}

const initialCursors: AgentCursor[] = [
  {
    agentId: 'boris',
    position: { x: 400, y: 300 },
    targetPosition: { x: 400, y: 300 },
    state: 'idle',
    color: '#C23B22',
    label: 'BORIS',
  },
  {
    agentId: 'nadia',
    position: { x: 600, y: 350 },
    targetPosition: { x: 600, y: 350 },
    state: 'idle',
    color: '#C4A44A',
    label: 'NADIA',
  },
  {
    agentId: 'gremlin',
    position: { x: 300, y: 500 },
    targetPosition: { x: 300, y: 500 },
    state: 'idle',
    color: '#39FF14',
    label: 'GREMLIN',
  },
  {
    agentId: 'the-archivist',
    position: { x: 700, y: 250 },
    targetPosition: { x: 700, y: 250 },
    state: 'idle',
    color: '#5B8CFF',
    label: 'THE ARCHIVIST',
  },
  {
    agentId: 'comrade-pixel',
    position: { x: 500, y: 450 },
    targetPosition: { x: 500, y: 450 },
    state: 'idle',
    color: '#FF6B9D',
    label: 'COMRADE PIXEL',
  },
];

export const useCanvasStore = create<CanvasState>((set) => ({
  assets: [],
  agentCursors: initialCursors,
  viewport: { x: 0, y: 0, zoom: 1 },
  canvasPhase: 'research',
  isComplete: false,

  addAsset: (asset) =>
    set((state) => ({ assets: [...state.assets, asset] })),

  updateAsset: (id, update) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === id ? { ...a, ...update } : a
      ),
    })),

  updateAssetPosition: (id, pos) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === id ? { ...a, position: pos } : a
      ),
    })),

  updateAssetState: (id, newState) =>
    set((state) => ({
      assets: state.assets.map((a) =>
        a.id === id ? { ...a, state: newState } : a
      ),
    })),

  removeAsset: (id) =>
    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
    })),

  setViewport: (viewport) => set({ viewport }),

  setAgentCursors: (cursors) => set({ agentCursors: cursors }),

  updateAgentCursor: (agentId, update) =>
    set((state) => ({
      agentCursors: state.agentCursors.map((c) =>
        c.agentId === agentId ? { ...c, ...update } : c
      ),
    })),

  setCanvasPhase: (phase) => set({ canvasPhase: phase }),

  setComplete: (complete) => set({ isComplete: complete }),

  reset: () =>
    set({
      assets: [],
      agentCursors: initialCursors,
      viewport: { x: 0, y: 0, zoom: 1 },
      canvasPhase: 'research',
      isComplete: false,
    }),
}));
