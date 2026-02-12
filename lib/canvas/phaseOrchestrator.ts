import { CanvasAsset, ChatMessage, DoomsdayScenario, Company, AssetType } from '@/types';
import { createAsset, getNextPosition, resetLayoutCounters } from './assetFactory';
import { generateAsset, streamChat } from '@/lib/api';

interface OrchestratorCallbacks {
  addAsset: (asset: CanvasAsset) => void;
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
    await streamChat(
      agentId,
      callbacks.getMessages().slice(-15),
      { company: context.company, scenarios: context.scenarios },
      (token) => {
        fullContent += token;
        callbacks.updateChatMessage(id, { content: fullContent });
      },
      () => {
        callbacks.updateChatMessage(id, { content: fullContent, isComplete: true });
      }
    );
  } catch {
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
      scenarios: context.scenarios,
      phase,
    });

    const asset = createAsset({
      type: assetType,
      title: data.title || 'Untitled',
      content: data.content || '',
      createdBy: agentId,
      position: pos,
      state: initialState,
    });

    callbacks.addAsset(asset);
    callbacks.setCursorState(agentId, 'working', pos);

    return asset;
  } catch (err) {
    console.error(`Asset creation failed for ${agentId}:`, err);
    // Create a fallback asset
    const asset = createAsset({
      type: assetType,
      title: 'Draft in Progress',
      content: 'The Collective is deliberating. Content forthcoming.',
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
  private abortController: AbortController | null = null;
  private createdAssets: CanvasAsset[] = [];

  constructor(callbacks: OrchestratorCallbacks, context: OrchestratorContext) {
    this.callbacks = callbacks;
    this.context = context;
  }

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.abortController = new AbortController();
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
      console.error('Orchestrator error:', err);
    }
  }

  stop() {
    this.isRunning = false;
    this.abortController?.abort();
  }

  // ─────── PHASE 1: RESEARCH & BRIEF (30-60 seconds) ───────
  private async runPhase1_Research() {
    this.callbacks.setPhase('research');

    // All cursors converge to discuss
    for (const agentId of ['boris', 'nadia', 'gremlin', 'the-archivist', 'comrade-pixel']) {
      this.callbacks.setCursorState(agentId, 'discussing');
    }

    // The Archivist drops research cards
    await delay(2000);
    await addAgentChat('the-archivist', this.callbacks, this.context);
    const r1 = await createAssetFromAPI('the-archivist', 'text_card', 'research', this.callbacks, this.context);
    if (r1) this.createdAssets.push(r1);

    await delay(3000);
    await addAgentChat('the-archivist', this.callbacks, this.context);
    const r2 = await createAssetFromAPI('the-archivist', 'text_card', 'research', this.callbacks, this.context);
    if (r2) this.createdAssets.push(r2);

    // Nadia posts scenario analysis
    await delay(2500);
    await addAgentChat('nadia', this.callbacks, this.context);
    const n1 = await createAssetFromAPI('nadia', 'text_card', 'research', this.callbacks, this.context);
    if (n1) this.createdAssets.push(n1);

    // Boris posts creative brief
    await delay(3000);
    await addAgentChat('boris', this.callbacks, this.context);

    // Quick reactions
    await delay(1500);
    await addAgentChat('gremlin', this.callbacks, this.context);
    await delay(1000);
    await addAgentChat('comrade-pixel', this.callbacks, this.context);

    await delay(2000);
  }

  // ─────── PHASE 2: IDEATION (60-90 seconds) ───────
  private async runPhase2_Ideation() {
    this.callbacks.setPhase('ideation');

    // Agents start creating sticky notes
    for (const agentId of ['boris', 'gremlin', 'comrade-pixel', 'nadia', 'the-archivist']) {
      this.callbacks.setCursorState(agentId, 'creating');
    }

    // Wave 1: sticky notes from everyone
    await delay(2000);
    await Promise.all([
      createAssetFromAPI('gremlin', 'sticky_note', 'ideation', this.callbacks, this.context),
      addAgentChat('gremlin', this.callbacks, this.context),
    ]);

    await delay(2000);
    await Promise.all([
      createAssetFromAPI('boris', 'sticky_note', 'ideation', this.callbacks, this.context),
      addAgentChat('boris', this.callbacks, this.context),
    ]);

    await delay(2000);
    await Promise.all([
      createAssetFromAPI('comrade-pixel', 'sticky_note', 'ideation', this.callbacks, this.context),
      addAgentChat('comrade-pixel', this.callbacks, this.context),
    ]);

    // Wave 2: more notes + headlines
    await delay(3000);
    await createAssetFromAPI('nadia', 'sticky_note', 'ideation', this.callbacks, this.context);
    await addAgentChat('nadia', this.callbacks, this.context);

    await delay(2500);
    await createAssetFromAPI('the-archivist', 'sticky_note', 'ideation', this.callbacks, this.context);

    // Gremlin posts visual direction
    await delay(2000);
    await createAssetFromAPI('gremlin', 'sticky_note', 'ideation', this.callbacks, this.context);
    await addAgentChat('gremlin', this.callbacks, this.context);

    // Comrade Pixel starts headline options
    await delay(3000);
    await createAssetFromAPI('comrade-pixel', 'sticky_note', 'ideation', this.callbacks, this.context);
    await addAgentChat('comrade-pixel', this.callbacks, this.context);

    // Boris critiques
    await delay(2000);
    await addAgentChat('boris', this.callbacks, this.context);
    await createAssetFromAPI('boris', 'sticky_note', 'ideation', this.callbacks, this.context);

    await delay(3000);
  }

  // ─────── PHASE 3: ASSET PRODUCTION (90-180 seconds) ───────
  private async runPhase3_Production() {
    this.callbacks.setPhase('production');

    // Set cursors to working mode
    for (const agentId of ['boris', 'nadia', 'gremlin', 'the-archivist', 'comrade-pixel']) {
      this.callbacks.setCursorState(agentId, 'working');
    }

    // Ad Concept 1
    await delay(3000);
    await addAgentChat('boris', this.callbacks, this.context);
    const ad1 = await createAssetFromAPI('boris', 'ad_concept', 'production', this.callbacks, this.context);
    if (ad1) this.createdAssets.push(ad1);

    // Chat reactions
    await delay(2000);
    await addAgentChat('gremlin', this.callbacks, this.context);

    // Ad Concept 2
    await delay(3000);
    const ad2 = await createAssetFromAPI('gremlin', 'ad_concept', 'production', this.callbacks, this.context);
    if (ad2) this.createdAssets.push(ad2);
    await addAgentChat('gremlin', this.callbacks, this.context);

    // Transition first ad to review
    if (ad1) {
      this.callbacks.updateAssetState(ad1.id, 'review');
      this.callbacks.setCursorState('boris', 'reviewing');
    }

    // OOH Mockup 1
    await delay(4000);
    await addAgentChat('boris', this.callbacks, this.context);
    const ooh1 = await createAssetFromAPI('gremlin', 'ooh_mockup', 'production', this.callbacks, this.context);
    if (ooh1) this.createdAssets.push(ooh1);

    // Messaging Framework
    await delay(3500);
    await addAgentChat('nadia', this.callbacks, this.context);
    const mf = await createAssetFromAPI('nadia', 'messaging_framework', 'production', this.callbacks, this.context);
    if (mf) this.createdAssets.push(mf);

    // Ad Concept 3
    await delay(3000);
    const ad3 = await createAssetFromAPI('comrade-pixel', 'ad_concept', 'production', this.callbacks, this.context);
    if (ad3) this.createdAssets.push(ad3);
    await addAgentChat('comrade-pixel', this.callbacks, this.context);

    // OOH Mockup 2
    await delay(3000);
    const ooh2 = await createAssetFromAPI('boris', 'ooh_mockup', 'production', this.callbacks, this.context);
    if (ooh2) this.createdAssets.push(ooh2);

    // Agent discussions during production
    await delay(2000);
    await addAgentChat('the-archivist', this.callbacks, this.context);
    await delay(1500);
    await addAgentChat('boris', this.callbacks, this.context);

    // Transition assets through review
    if (ad2) this.callbacks.updateAssetState(ad2.id, 'review');
    if (ooh1) this.callbacks.updateAssetState(ooh1.id, 'review');
    await delay(2000);

    // Manifesto draft
    await addAgentChat('comrade-pixel', this.callbacks, this.context);
    const manifesto = await createAssetFromAPI('comrade-pixel', 'manifesto', 'production', this.callbacks, this.context);
    if (manifesto) this.createdAssets.push(manifesto);

    // More debate
    await delay(3000);
    await addAgentChat('boris', this.callbacks, this.context);
    await delay(1500);
    await addAgentChat('gremlin', this.callbacks, this.context);
    await delay(1500);
    await addAgentChat('nadia', this.callbacks, this.context);

    // Transition messaging framework to review
    if (mf) this.callbacks.updateAssetState(mf.id, 'review');

    // Ad Concept 4
    await delay(3000);
    const ad4 = await createAssetFromAPI('boris', 'ad_concept', 'production', this.callbacks, this.context);
    if (ad4) this.createdAssets.push(ad4);

    await delay(2000);
  }

  // ─────── PHASE 4: FINALIZATION (30-60 seconds) ───────
  private async runPhase4_Finalization() {
    this.callbacks.setPhase('finalization');

    // All cursors reviewing
    for (const agentId of ['boris', 'nadia', 'gremlin', 'the-archivist', 'comrade-pixel']) {
      this.callbacks.setCursorState(agentId, 'reviewing');
    }

    await delay(2000);
    await addAgentChat('boris', this.callbacks, this.context);

    // Boris approves assets one by one
    await delay(2000);
    for (const asset of this.createdAssets) {
      if (asset.type !== 'sticky_note') {
        this.callbacks.updateAssetState(asset.id, 'final');
        await delay(800);
      }
    }

    // Final manifesto
    await delay(1500);
    await addAgentChat('comrade-pixel', this.callbacks, this.context);

    // Nadia posts summary
    await delay(2000);
    await addAgentChat('nadia', this.callbacks, this.context);

    // Final remarks
    await delay(1500);
    await addAgentChat('the-archivist', this.callbacks, this.context);
    await delay(1000);
    await addAgentChat('gremlin', this.callbacks, this.context);
    await delay(1500);
    await addAgentChat('boris', this.callbacks, this.context);

    await delay(2000);
  }

  // ─────── PHASE 5: EXPORT ───────
  private async runPhase5_Export() {
    this.callbacks.setPhase('export');

    // All cursors idle
    for (const agentId of ['boris', 'nadia', 'gremlin', 'the-archivist', 'comrade-pixel']) {
      this.callbacks.setCursorState(agentId, 'idle');
    }

    this.callbacks.setComplete(true);
    this.isRunning = false;
  }
}
