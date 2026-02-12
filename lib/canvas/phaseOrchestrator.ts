import { CanvasAsset, ChatMessage, DoomsdayScenario, Company, AssetType } from '@/types';
import { createAsset, getNextPosition, resetLayoutCounters } from './assetFactory';
import { generateAsset, generateImage, streamChat } from '@/lib/api';

// Asset types that should get visual image generation
const VISUAL_ASSET_TYPES: AssetType[] = ['ad_concept', 'ooh_mockup', 'manifesto'];

interface OrchestratorCallbacks {
  addAsset: (asset: CanvasAsset) => void;
  updateAsset: (id: string, update: Partial<CanvasAsset>) => void;
  updateAssetState: (id: string, state: 'draft' | 'review' | 'final') => void;
  addChatMessage: (message: ChatMessage) => void;
  updateChatMessage: (id: string, update: Partial<ChatMessage>) => void;
  setCursorState: (agentId: string, state: string, target?: { x: number; y: number }) => void;
  setPhase: (phase: string) => void;
  setComplete: (complete: boolean) => void;
  getMessages: () => ChatMessage[];
}

interface OrchestratorContext {
  company: Company;
  scenarios: DoomsdayScenario[];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

let msgCounter = 0;
function chatId(agentId: string): string {
  msgCounter++;
  return `orch-${agentId}-${Date.now()}-${msgCounter}`;
}

/**
 * Safely run an async function, logging errors but never throwing.
 */
async function safe<T>(fn: () => Promise<T>, label: string): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[Orchestrator] ${label} failed:`, err);
    return null;
  }
}

async function addAgentChat(
  agentId: string,
  callbacks: OrchestratorCallbacks,
  context: OrchestratorContext
): Promise<void> {
  const id = chatId(agentId);
  const msg: ChatMessage = {
    id,
    agentId,
    content: '',
    timestamp: new Date(),
    isComplete: false,
  };
  callbacks.addChatMessage(msg);

  try {
    let fullContent = '';
    const messages = callbacks.getMessages() || [];
    await streamChat(
      agentId,
      messages.slice(-15),
      { company: context.company, scenarios: context.scenarios || [] },
      (token) => {
        fullContent += token;
        callbacks.updateChatMessage(id, { content: fullContent });
      },
      () => {
        callbacks.updateChatMessage(id, { content: fullContent, isComplete: true });
      }
    );
    // If streamChat completed without calling onComplete (edge case)
    if (!fullContent) {
      callbacks.updateChatMessage(id, {
        content: 'The Collective is processing.',
        isComplete: true,
      });
    }
  } catch (err) {
    console.error(`[Chat] ${agentId} failed:`, err);
    callbacks.updateChatMessage(id, {
      content: 'THE APPARATUS IS EXPERIENCING A MOMENTARY RECALIBRATION.',
      isComplete: true,
    });
  }
}

async function createAssetFromAPI(
  agentId: string,
  assetType: AssetType,
  phase: string,
  callbacks: OrchestratorCallbacks,
  context: OrchestratorContext,
  initialState: 'draft' | 'review' | 'final' = 'draft'
): Promise<CanvasAsset | null> {
  const pos = getNextPosition(phase, agentId);
  callbacks.setCursorState(agentId, 'creating', pos);

  try {
    const data = await generateAsset(agentId, assetType, {
      company: context.company,
      scenarios: context.scenarios || [],
      phase,
    });

    const asset = createAsset({
      type: assetType,
      title: data?.title || 'Untitled',
      content: data?.content || '',
      createdBy: agentId,
      position: pos,
      state: initialState,
    });

    callbacks.addAsset(asset);
    callbacks.setCursorState(agentId, 'working', pos);

    // Trigger image generation in background for visual asset types
    if (VISUAL_ASSET_TYPES.includes(assetType)) {
      const scenarioTitle = context.scenarios?.[0]?.title || 'crisis scenario';
      generateImage(
        assetType,
        asset.title,
        asset.content,
        context.company?.name || 'Company',
        scenarioTitle,
        agentId
      ).then((result) => {
        if (result.imageUrl) {
          callbacks.updateAsset(asset.id, {
            imageUrl: result.imageUrl,
            imagePrompt: result.revisedPrompt,
          });
        }
      }).catch((err) => {
        console.error(`Image generation failed for ${asset.id}:`, err);
      });
    }

    return asset;
  } catch (err) {
    console.error(`[Asset] ${agentId}/${assetType} failed:`, err);
    const asset = createAsset({
      type: assetType,
      title: 'Draft in Progress',
      content: 'The Collective is deliberating.',
      createdBy: agentId,
      position: pos,
      state: initialState,
    });
    callbacks.addAsset(asset);
    return asset;
  }
}

export class PhaseOrchestrator {
  private callbacks: OrchestratorCallbacks;
  private context: OrchestratorContext;
  private isRunning: boolean = false;
  private createdAssets: CanvasAsset[] = [];

  constructor(callbacks: OrchestratorCallbacks, context: OrchestratorContext) {
    this.callbacks = callbacks;
    this.context = context;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    resetLayoutCounters();
    msgCounter = 0;

    try {
      await this.runPhase1_Research();
      if (!this.isRunning) return;

      await this.runPhase2_Ideation();
      if (!this.isRunning) return;

      await this.runPhase3_Production();
      if (!this.isRunning) return;

      await this.runPhase4_Finalization();
      if (!this.isRunning) return;

      await this.runPhase5_Export();
    } catch (err) {
      console.error('Orchestrator fatal error:', err);
      // Don't crash the whole page — mark as complete so user can export what exists
      this.callbacks.setPhase('export');
      this.callbacks.setComplete(true);
    }
  }

  stop() {
    this.isRunning = false;
  }

  // ─────── PHASE 1: RESEARCH & BRIEF ───────
  private async runPhase1_Research() {
    this.callbacks.setPhase('research');

    for (const agentId of ['boris', 'nadia', 'gremlin', 'the-archivist', 'comrade-pixel']) {
      this.callbacks.setCursorState(agentId, 'discussing');
    }

    await delay(2000);
    await safe(() => addAgentChat('the-archivist', this.callbacks, this.context), 'archivist chat 1');
    const r1 = await safe(() => createAssetFromAPI('the-archivist', 'text_card', 'research', this.callbacks, this.context), 'archivist asset 1');
    if (r1) this.createdAssets.push(r1);

    await delay(3000);
    await safe(() => addAgentChat('the-archivist', this.callbacks, this.context), 'archivist chat 2');
    const r2 = await safe(() => createAssetFromAPI('the-archivist', 'text_card', 'research', this.callbacks, this.context), 'archivist asset 2');
    if (r2) this.createdAssets.push(r2);

    await delay(2500);
    await safe(() => addAgentChat('nadia', this.callbacks, this.context), 'nadia chat 1');
    const n1 = await safe(() => createAssetFromAPI('nadia', 'text_card', 'research', this.callbacks, this.context), 'nadia asset 1');
    if (n1) this.createdAssets.push(n1);

    await delay(3000);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris chat 1');

    await delay(1500);
    await safe(() => addAgentChat('gremlin', this.callbacks, this.context), 'gremlin chat 1');
    await delay(1000);
    await safe(() => addAgentChat('comrade-pixel', this.callbacks, this.context), 'pixel chat 1');

    await delay(2000);
  }

  // ─────── PHASE 2: IDEATION ───────
  private async runPhase2_Ideation() {
    this.callbacks.setPhase('ideation');

    for (const agentId of ['boris', 'gremlin', 'comrade-pixel', 'nadia', 'the-archivist']) {
      this.callbacks.setCursorState(agentId, 'creating');
    }

    await delay(2000);
    await safe(() => createAssetFromAPI('gremlin', 'sticky_note', 'ideation', this.callbacks, this.context), 'gremlin sticky');
    await safe(() => addAgentChat('gremlin', this.callbacks, this.context), 'gremlin chat');

    await delay(2000);
    await safe(() => createAssetFromAPI('boris', 'sticky_note', 'ideation', this.callbacks, this.context), 'boris sticky');
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris chat');

    await delay(2000);
    await safe(() => createAssetFromAPI('comrade-pixel', 'sticky_note', 'ideation', this.callbacks, this.context), 'pixel sticky');
    await safe(() => addAgentChat('comrade-pixel', this.callbacks, this.context), 'pixel chat');

    await delay(3000);
    await safe(() => createAssetFromAPI('nadia', 'sticky_note', 'ideation', this.callbacks, this.context), 'nadia sticky');
    await safe(() => addAgentChat('nadia', this.callbacks, this.context), 'nadia chat');

    await delay(2500);
    await safe(() => createAssetFromAPI('the-archivist', 'sticky_note', 'ideation', this.callbacks, this.context), 'archivist sticky');

    await delay(2000);
    await safe(() => createAssetFromAPI('gremlin', 'sticky_note', 'ideation', this.callbacks, this.context), 'gremlin sticky 2');
    await safe(() => addAgentChat('gremlin', this.callbacks, this.context), 'gremlin chat 2');

    await delay(3000);
    await safe(() => createAssetFromAPI('comrade-pixel', 'sticky_note', 'ideation', this.callbacks, this.context), 'pixel sticky 2');
    await safe(() => addAgentChat('comrade-pixel', this.callbacks, this.context), 'pixel chat 2');

    await delay(2000);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris critique');
    await safe(() => createAssetFromAPI('boris', 'sticky_note', 'ideation', this.callbacks, this.context), 'boris sticky 2');

    await delay(3000);
  }

  // ─────── PHASE 3: PRODUCTION ───────
  private async runPhase3_Production() {
    this.callbacks.setPhase('production');

    for (const agentId of ['boris', 'nadia', 'gremlin', 'the-archivist', 'comrade-pixel']) {
      this.callbacks.setCursorState(agentId, 'working');
    }

    // Ad Concept 1
    await delay(3000);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris prod chat 1');
    const ad1 = await safe(() => createAssetFromAPI('boris', 'ad_concept', 'production', this.callbacks, this.context), 'ad 1');
    if (ad1) this.createdAssets.push(ad1);

    await delay(2000);
    await safe(() => addAgentChat('gremlin', this.callbacks, this.context), 'gremlin react');

    // Ad Concept 2
    await delay(3000);
    const ad2 = await safe(() => createAssetFromAPI('gremlin', 'ad_concept', 'production', this.callbacks, this.context), 'ad 2');
    if (ad2) this.createdAssets.push(ad2);
    await safe(() => addAgentChat('gremlin', this.callbacks, this.context), 'gremlin chat ad2');

    if (ad1) {
      this.callbacks.updateAssetState(ad1.id, 'review');
      this.callbacks.setCursorState('boris', 'reviewing');
    }

    // OOH Mockup 1
    await delay(4000);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris ooh chat');
    const ooh1 = await safe(() => createAssetFromAPI('gremlin', 'ooh_mockup', 'production', this.callbacks, this.context), 'ooh 1');
    if (ooh1) this.createdAssets.push(ooh1);

    // Messaging Framework
    await delay(3500);
    await safe(() => addAgentChat('nadia', this.callbacks, this.context), 'nadia fw chat');
    const mf = await safe(() => createAssetFromAPI('nadia', 'messaging_framework', 'production', this.callbacks, this.context), 'messaging fw');
    if (mf) this.createdAssets.push(mf);

    // Ad Concept 3
    await delay(3000);
    const ad3 = await safe(() => createAssetFromAPI('comrade-pixel', 'ad_concept', 'production', this.callbacks, this.context), 'ad 3');
    if (ad3) this.createdAssets.push(ad3);
    await safe(() => addAgentChat('comrade-pixel', this.callbacks, this.context), 'pixel ad chat');

    // OOH Mockup 2
    await delay(3000);
    const ooh2 = await safe(() => createAssetFromAPI('boris', 'ooh_mockup', 'production', this.callbacks, this.context), 'ooh 2');
    if (ooh2) this.createdAssets.push(ooh2);

    await delay(2000);
    await safe(() => addAgentChat('the-archivist', this.callbacks, this.context), 'archivist prod');
    await delay(1500);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris prod');

    if (ad2) this.callbacks.updateAssetState(ad2.id, 'review');
    if (ooh1) this.callbacks.updateAssetState(ooh1.id, 'review');
    await delay(2000);

    // Manifesto
    await safe(() => addAgentChat('comrade-pixel', this.callbacks, this.context), 'pixel manifesto chat');
    const manifesto = await safe(() => createAssetFromAPI('comrade-pixel', 'manifesto', 'production', this.callbacks, this.context), 'manifesto');
    if (manifesto) this.createdAssets.push(manifesto);

    await delay(3000);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris debate');
    await delay(1500);
    await safe(() => addAgentChat('gremlin', this.callbacks, this.context), 'gremlin debate');
    await delay(1500);
    await safe(() => addAgentChat('nadia', this.callbacks, this.context), 'nadia debate');

    if (mf) this.callbacks.updateAssetState(mf.id, 'review');

    // Ad Concept 4
    await delay(3000);
    const ad4 = await safe(() => createAssetFromAPI('boris', 'ad_concept', 'production', this.callbacks, this.context), 'ad 4');
    if (ad4) this.createdAssets.push(ad4);

    await delay(2000);
  }

  // ─────── PHASE 4: FINALIZATION ───────
  private async runPhase4_Finalization() {
    this.callbacks.setPhase('finalization');

    for (const agentId of ['boris', 'nadia', 'gremlin', 'the-archivist', 'comrade-pixel']) {
      this.callbacks.setCursorState(agentId, 'reviewing');
    }

    await delay(2000);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris final');

    // Approve all non-sticky assets
    await delay(2000);
    for (const asset of this.createdAssets) {
      if (asset.type !== 'sticky_note') {
        try {
          this.callbacks.updateAssetState(asset.id, 'final');
        } catch { /* ignore */ }
        await delay(800);
      }
    }

    await delay(1500);
    await safe(() => addAgentChat('comrade-pixel', this.callbacks, this.context), 'pixel final');
    await delay(2000);
    await safe(() => addAgentChat('nadia', this.callbacks, this.context), 'nadia final');
    await delay(1500);
    await safe(() => addAgentChat('the-archivist', this.callbacks, this.context), 'archivist final');
    await delay(1000);
    await safe(() => addAgentChat('gremlin', this.callbacks, this.context), 'gremlin final');
    await delay(1500);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris closing');

    await delay(2000);
  }

  // ─────── PHASE 5: EXPORT ───────
  private async runPhase5_Export() {
    this.callbacks.setPhase('export');

    for (const agentId of ['boris', 'nadia', 'gremlin', 'the-archivist', 'comrade-pixel']) {
      this.callbacks.setCursorState(agentId, 'idle');
    }

    this.callbacks.setComplete(true);
    this.isRunning = false;
  }
}
