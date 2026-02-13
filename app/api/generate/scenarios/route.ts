import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const { company } = await req.json();

    if (!company || !company.name) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    let systemPrompt: string;
    try {
      systemPrompt = readFileSync(
        join(process.cwd(), 'lib/prompts/task-scenarios.txt'),
        'utf-8'
      );
    } catch {
      systemPrompt =
        'You are a team of analysts modeling catastrophic scenarios for companies. Be creative and specific. Respond in JSON format.';
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate doomsday scenarios for ${company.name} (${company.sector || 'Unknown sector'}). ${company.description || ''}

IMPORTANT: Every scenario title and summary must be highly specific to ${company.name} and its actual business, products, market position, and known vulnerabilities. Do NOT use generic templates. Reference real aspects of this specific company.`,
        },
      ],
    });

    const textContent = message.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text in response');
    }

    // Extract JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const data = JSON.parse(jsonMatch[0]);

    // Add IDs to scenarios
    const addIds = (scenarios: Array<Record<string, unknown>>, horizon: string) =>
      (scenarios || []).map((s, i) => ({
        ...s,
        id: `${horizon}-${i}`,
        horizon,
      }));

    return NextResponse.json({
      company: data.company || company.name,
      horizons: {
        '1_year': addIds(data.horizons?.['1_year'], '1_year'),
        '5_year': addIds(data.horizons?.['5_year'], '5_year'),
        '10_year': addIds(data.horizons?.['10_year'], '10_year'),
        '50_year': addIds(data.horizons?.['50_year'], '50_year'),
      },
    });
  } catch (error) {
    console.error('Scenario generation error:', error);
    return NextResponse.json(
      { error: 'Scenario generation failed', details: String(error) },
      { status: 500 }
    );
  }
}
