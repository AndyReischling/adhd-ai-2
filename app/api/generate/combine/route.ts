import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

function loadPrompt(filename: string): string {
  try {
    return readFileSync(join(process.cwd(), 'lib/prompts', filename), 'utf-8');
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const { assetA, assetB, context } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock combination
      return NextResponse.json({
        conversation: [
          { agentId: 'boris', content: `These two ideas DEMAND to be united. The combination will be MAGNIFICENT.` },
          { agentId: 'gremlin', content: `ok yeah actually this works. the energy is right. dont overthink it.` },
          { agentId: 'comrade-pixel', content: `What if the merged piece starts where one ends and ends where the other begins. A loop. A promise.` },
        ],
        newAsset: {
          type: assetA.type || 'text_card',
          title: `${assetA.title} × ${assetB.title}`,
          content: `A synthesis of two ideas: the structural integrity of "${assetA.title}" meets the creative vision of "${assetB.title}." The result is something neither could have been alone — a piece that acknowledges the crisis with specificity while reaching for something resembling grace.`,
        },
      });
    }

    const client = new Anthropic({ apiKey });
    const taskPrompt = loadPrompt('task-combine.txt');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: taskPrompt || 'You are agents at ADHD AI, a feral design collective. Two creative assets have been combined by the user. Discuss the combination briefly (3-5 messages between relevant agents), then produce a new asset that synthesizes both ideas.',
      messages: [
        {
          role: 'user',
          content: `Two creative assets are being combined for the campaign for ${context.company?.name || 'the company'}.

Asset A (${assetA.type}): "${assetA.title}"
Content: ${assetA.content}

Asset B (${assetB.type}): "${assetB.title}"
Content: ${assetB.content}

Scenario: ${context.scenarios?.map((s: { title: string }) => s.title).join(', ') || 'General scenario'}

Respond ONLY with valid JSON:
{
  "conversation": [
    { "agentId": "boris", "content": "..." },
    { "agentId": "gremlin", "content": "..." }
  ],
  "newAsset": {
    "type": "${assetA.type}",
    "title": "...",
    "content": "..."
  }
}`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text in response');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('Combine error:', error);
    return NextResponse.json({
      conversation: [
        { agentId: 'boris', content: 'The combination has potential. Let us refine it.' },
      ],
      newAsset: {
        type: 'text_card',
        title: 'Combined Asset',
        content: 'A synthesis of ideas, pending refinement by the Collective.',
      },
    });
  }
}
