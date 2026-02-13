import { Company, DoomsdayScenario, DoomsdayResponse, CanvasAsset, ChatMessage } from '@/types';

const API_BASE = '/api/generate';

export async function generateScenarios(company: Company): Promise<DoomsdayResponse> {
  const res = await fetch(`${API_BASE}/scenarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.details || errorData?.error || `Scenarios API returned ${res.status}`);
  }

  return res.json();
}

export async function streamChat(
  agentId: string,
  conversationHistory: ChatMessage[],
  context: {
    company: Company;
    scenarios: DoomsdayScenario[];
    phase?: string;
  },
  onToken: (token: string) => void,
  onComplete: () => void
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, conversationHistory, context }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData?.error || `Chat API returned ${res.status}`);
  }
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          onComplete();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) onToken(parsed.text);
        } catch {
          // skip malformed chunks
        }
      }
    }
  }

  onComplete();
}

export async function generateAsset(
  agentId: string,
  assetType: string,
  context: {
    company: Company;
    scenarios: DoomsdayScenario[];
    phase: string;
    existingAssets?: CanvasAsset[];
  }
): Promise<{ title: string; content: string }> {
  const res = await fetch(`${API_BASE}/asset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, assetType, context }),
  });

  if (!res.ok) throw new Error('Asset generation failed');
  return res.json();
}

/**
 * Generate a visual PNG for a canvas asset using OpenAI image generation.
 * Returns the image as a data URI, or null if generation fails/not configured.
 */
export async function generateImage(
  assetType: string,
  title: string,
  content: string,
  company: string,
  scenario: string,
  agentId: string,
  isFinal: boolean = false
): Promise<{ imageUrl: string | null; revisedPrompt?: string }> {
  try {
    const res = await fetch(`${API_BASE}/image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetType, title, content, company, scenario, agentId, isFinal }),
    });

    const data = await res.json();
    return { imageUrl: data.imageUrl || null, revisedPrompt: data.revisedPrompt };
  } catch {
    return { imageUrl: null };
  }
}

export async function combineAssets(
  assetA: CanvasAsset,
  assetB: CanvasAsset,
  context: {
    company: Company;
    scenarios: DoomsdayScenario[];
  }
): Promise<{
  conversation: { agentId: string; content: string }[];
  newAsset: { type: string; title: string; content: string };
}> {
  const res = await fetch(`${API_BASE}/combine`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assetA, assetB, context }),
  });

  if (!res.ok) throw new Error('Combination failed');
  return res.json();
}

export async function generateExport(data: {
  assets: CanvasAsset[];
  chatLog: ChatMessage[];
  company: Company;
  scenarios: DoomsdayScenario[];
}): Promise<Blob> {
  const res = await fetch(`${API_BASE}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Export generation failed');
  return res.blob();
}
