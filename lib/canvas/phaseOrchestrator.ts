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

    // Images are generated later during finalization phase (not on draft)
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

    // Ad Concept 1 + Boris commentary
    await delay(3000);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris prod');
    const ad1 = await safe(() => createAssetFromAPI('boris', 'ad_concept', 'production', this.callbacks, this.context), 'ad 1');
    if (ad1) this.createdAssets.push(ad1);

    // Ad Concept 2 + OOH 1 (Gremlin works)
    await delay(3500);
    const ad2 = await safe(() => createAssetFromAPI('gremlin', 'ad_concept', 'production', this.callbacks, this.context), 'ad 2');
    if (ad2) this.createdAssets.push(ad2);
    await safe(() => addAgentChat('gremlin', this.callbacks, this.context), 'gremlin react');

    await delay(3000);
    const ooh1 = await safe(() => createAssetFromAPI('gremlin', 'ooh_mockup', 'production', this.callbacks, this.context), 'ooh 1');
    if (ooh1) this.createdAssets.push(ooh1);

    // Messaging Framework (Nadia)
    await delay(3500);
    await safe(() => addAgentChat('nadia', this.callbacks, this.context), 'nadia fw');
    const mf = await safe(() => createAssetFromAPI('nadia', 'messaging_framework', 'production', this.callbacks, this.context), 'messaging fw');
    if (mf) this.createdAssets.push(mf);

    // Ad Concept 3 (Comrade Pixel)
    await delay(3000);
    const ad3 = await safe(() => createAssetFromAPI('comrade-pixel', 'ad_concept', 'production', this.callbacks, this.context), 'ad 3');
    if (ad3) this.createdAssets.push(ad3);

    // Transition earlier assets to review
    if (ad1) this.callbacks.updateAssetState(ad1.id, 'review');
    if (ad2) this.callbacks.updateAssetState(ad2.id, 'review');

    // Manifesto (Comrade Pixel)
    await delay(3000);
    await safe(() => addAgentChat('comrade-pixel', this.callbacks, this.context), 'pixel manifesto');
    const manifesto = await safe(() => createAssetFromAPI('comrade-pixel', 'manifesto', 'production', this.callbacks, this.context), 'manifesto');
    if (manifesto) this.createdAssets.push(manifesto);

    // Final production debate
    await delay(2500);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris debate');

    if (ooh1) this.callbacks.updateAssetState(ooh1.id, 'review');
    if (mf) this.callbacks.updateAssetState(mf.id, 'review');

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

    // Approve all non-sticky assets and generate images for visual ones
    await delay(2000);
    const imagePromises: Promise<void>[] = [];

    for (const asset of this.createdAssets) {
      if (asset.type !== 'sticky_note') {
        try {
          this.callbacks.updateAssetState(asset.id, 'final');
        } catch { /* ignore */ }

        // Generate images only for final visual assets (not text cards)
        if (VISUAL_ASSET_TYPES.includes(asset.type)) {
          const scenarioTitle = this.context.scenarios?.[0]?.title || 'crisis scenario';
          const imgPromise = generateImage(
            asset.type,
            asset.title,
            asset.content,
            this.context.company?.name || 'Company',
            scenarioTitle,
            asset.createdBy,
            true // isFinal — uses DALL-E 3 HD
          ).then((result) => {
            if (result.imageUrl) {
              this.callbacks.updateAsset(asset.id, {
                imageUrl: result.imageUrl,
                imagePrompt: result.revisedPrompt,
              });
            }
          }).catch((err) => {
            console.error(`Image generation failed for ${asset.id}:`, err);
          });
          imagePromises.push(imgPromise);
        }

        await delay(600);
      }
    }

    await safe(() => addAgentChat('comrade-pixel', this.callbacks, this.context), 'pixel final');
    await delay(1500);
    await safe(() => addAgentChat('nadia', this.callbacks, this.context), 'nadia final');
    await delay(1500);
    await safe(() => addAgentChat('boris', this.callbacks, this.context), 'boris closing');

    // Wait for images to finish generating (they run in parallel)
    await Promise.allSettled(imagePromises);
    await delay(1000);
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
