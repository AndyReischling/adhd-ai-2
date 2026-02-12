export interface Company {
  name: string;
  domain: string;
  sector: string;
  description: string;
  logoUrl: string;
}

export interface DoomsdayScenario {
  id: string;
  title: string;
  probability: number;
  severity: number; // 1-5
  summary: string;
  horizon: '1_year' | '5_year' | '10_year' | '50_year';
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  color: string;
  personality: string;
  voiceSample: string;
  bio: string;
}

export interface ChatMessage {
  id: string;
  agentId: string | 'user';
  content: string;
  timestamp: Date;
  isComplete: boolean;
}

export type AssetType =
  | 'text_card'
  | 'ad_concept'
  | 'ooh_mockup'
  | 'messaging_framework'
  | 'manifesto'
  | 'sticky_note';

export type AssetState = 'draft' | 'review' | 'final';

export interface CanvasAsset {
  id: string;
  type: AssetType;
  title: string;
  content: string;
  position: { x: number; y: number };
  state: AssetState;
  createdBy: string;
  width: number;
  height: number;
  combinedFrom?: [string, string];
}

export interface AgentCursor {
  agentId: string;
  position: { x: number; y: number };
  targetPosition: { x: number; y: number };
  state: 'idle' | 'working' | 'discussing' | 'reviewing' | 'creating';
  color: string;
  label: string;
}

export type ProjectPhase = 'search' | 'analysis' | 'canvas' | 'export';

export type CanvasPhase =
  | 'research'
  | 'ideation'
  | 'production'
  | 'finalization'
  | 'export'
  | 'complete';

export interface DoomsdayResponse {
  company: string;
  horizons: {
    '1_year': DoomsdayScenario[];
    '5_year': DoomsdayScenario[];
    '10_year': DoomsdayScenario[];
    '50_year': DoomsdayScenario[];
  };
}
