import { CanvasAsset, AssetType, AssetState } from '@/types';

let assetCounter = 0;

function nextId(): string {
  assetCounter++;
  return `asset-${Date.now()}-${assetCounter}`;
}

interface CreateAssetOptions {
  type: AssetType;
  title: string;
  content: string;
  createdBy: string;
  position?: { x: number; y: number };
  state?: AssetState;
}

const defaultDimensions: Record<AssetType, { width: number; height: number }> = {
  text_card: { width: 250, height: 120 },
  ad_concept: { width: 250, height: 150 },
  ooh_mockup: { width: 250, height: 150 },
  messaging_framework: { width: 250, height: 160 },
  manifesto: { width: 250, height: 180 },
  sticky_note: { width: 130, height: 70 },
};

// Agent zone layout constants (must match WorkspaceCanvas)
const ZONE_W = 280;
const ZONE_GAP = 16;
const START_X = 40;
const START_Y = 50;
const ZONE_PADDING = 10;

const agentColumns: Record<string, number> = {
  boris: 0,
  nadia: 1,
  gremlin: 2,
  'the-archivist': 3,
  'comrade-pixel': 4,
};

// Track how many assets each agent has placed
const agentSlotCounters: Record<string, number> = {};

export function resetLayoutCounters() {
  for (const key of Object.keys(agentSlotCounters)) {
    delete agentSlotCounters[key];
  }
  assetCounter = 0;
}

/**
 * Returns a position inside the given agent's zone on the workspace.
 */
export function getAgentPosition(agentId: string): { x: number; y: number } {
  const col = agentColumns[agentId] ?? 0;
  const slotIndex = agentSlotCounters[agentId] || 0;
  agentSlotCounters[agentId] = slotIndex + 1;

  const zoneX = START_X + col * (ZONE_W + ZONE_GAP);
  const zoneY = START_Y;

  // Stack assets vertically within the zone, wrapping to a second column if needed
  const itemsPerCol = 3;
  const rowInCol = slotIndex % itemsPerCol;
  const colOffset = Math.floor(slotIndex / itemsPerCol);

  return {
    x: zoneX + ZONE_PADDING + colOffset * 130,
    y: zoneY + 22 + ZONE_PADDING + rowInCol * 100,
  };
}

/**
 * Backward-compat alias used by the orchestrator
 */
export function getNextPosition(_phase: string, agentId?: string): { x: number; y: number } {
  return getAgentPosition(agentId || 'boris');
}

export function createAsset(options: CreateAssetOptions): CanvasAsset {
  const dims = defaultDimensions[options.type] || defaultDimensions.text_card;

  return {
    id: nextId(),
    type: options.type,
    title: options.title,
    content: options.content,
    position: options.position || getAgentPosition(options.createdBy),
    state: options.state || 'draft',
    createdBy: options.createdBy,
    width: dims.width,
    height: dims.height,
  };
}

export function createCombinedAsset(
  parentA: CanvasAsset,
  parentB: CanvasAsset,
  newData: { type?: string; title: string; content: string; createdBy?: string }
): CanvasAsset {
  const midX = (parentA.position.x + parentB.position.x) / 2;
  const midY = Math.max(parentA.position.y, parentB.position.y) + 40;
  const type = (newData.type as AssetType) || parentA.type;
  const dims = defaultDimensions[type] || defaultDimensions.text_card;

  return {
    id: nextId(),
    type,
    title: newData.title,
    content: newData.content,
    position: { x: midX, y: midY },
    state: 'draft',
    createdBy: newData.createdBy || parentA.createdBy,
    width: dims.width,
    height: dims.height,
    combinedFrom: [parentA.id, parentB.id],
  };
}
