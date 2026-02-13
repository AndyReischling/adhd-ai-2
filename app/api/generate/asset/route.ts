import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

const agentPromptFiles: Record<string, string> = {
  boris: 'system-boris.txt',
  nadia: 'system-nadia.txt',
  gremlin: 'system-gremlin.txt',
  'the-archivist': 'system-archivist.txt',
  'comrade-pixel': 'system-comrade-pixel.txt',
};

function loadPrompt(filename: string): string {
  try {
    return readFileSync(join(process.cwd(), 'lib/prompts', filename), 'utf-8');
  } catch {
    return '';
  }
}

export async function POST(req: Request) {
  try {
    const { agentId, assetType, context } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const agentPrompt = loadPrompt(agentPromptFiles[agentId] || 'system-boris.txt');
    const taskPrompt = loadPrompt('task-asset.txt');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: `${agentPrompt}\n\n${taskPrompt}`,
      messages: [
        {
          role: 'user',
          content: `Generate a ${assetType} asset for the proactive apology campaign for ${context.company?.name || 'the company'} (${context.company?.sector || 'Unknown sector'}).

Scenario: ${context.scenarios?.map((s: { title: string }) => s.title).join(', ') || 'General doomsday scenario'}

Current phase: ${context.phase || 'production'}

Respond ONLY with valid JSON:
{ "title": "...", "content": "..." }`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text in response');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({
        title: 'Untitled',
        content: textContent.text,
      });
    }

    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (error) {
    console.error('Asset generation error:', error);
    return NextResponse.json(
      { error: 'Asset generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
