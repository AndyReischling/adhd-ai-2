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
      // Return mock data if no API key
      return NextResponse.json(generateMockScenarios(company.name));
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
      scenarios.map((s, i) => ({
        ...s,
        id: `${horizon}-${i}`,
        horizon,
      }));

    return NextResponse.json({
      company: data.company || company.name,
      horizons: {
        '1_year': addIds(data.horizons['1_year'] || [], '1_year'),
        '5_year': addIds(data.horizons['5_year'] || [], '5_year'),
        '10_year': addIds(data.horizons['10_year'] || [], '10_year'),
        '50_year': addIds(data.horizons['50_year'] || [], '50_year'),
      },
    });
  } catch (error) {
    console.error('Scenario generation error:', error);
    // Always fall back to mock data so the app never breaks
    try {
      const { company: c } = await req.clone().json();
      return NextResponse.json(generateMockScenarios(c?.name || 'Unknown'));
    } catch {
      return NextResponse.json(generateMockScenarios('Unknown'));
    }
  }
}

function generateMockScenarios(companyName: string) {
  const mockScenario = (
    horizon: string,
    index: number,
    title: string,
    prob: number,
    severity: number,
    summary: string
  ) => ({
    id: `${horizon}-${index}`,
    title,
    probability: prob,
    severity,
    summary,
    horizon,
  });

  return {
    company: companyName,
    horizons: {
      '1_year': [
        mockScenario('1_year', 0, 'The Regulatory Reckoning Begins', 72, 3, `A sweeping regulatory investigation reveals systemic compliance failures at ${companyName}. Internal documents leak, showing executives were aware of the issues for years. Public trust erodes by 40% in a single quarter.`),
        mockScenario('1_year', 1, 'The Talent Exodus Accelerates', 58, 3, `${companyName}'s top engineers and creative minds defect to competitors, citing cultural rot and leadership stagnation. The brain drain triggers a cascade of delayed product launches and abandoned initiatives.`),
        mockScenario('1_year', 2, 'The Data Breach That Ends Trust', 45, 4, `A sophisticated cyberattack exposes the personal data of millions of ${companyName} users. The breach reveals embarrassingly outdated security infrastructure and a culture of negligence toward data protection.`),
      ],
      '5_year': [
        mockScenario('5_year', 0, 'The Platform Becomes the Prison', 65, 4, `${companyName}'s dominance invites aggressive antitrust action across multiple jurisdictions. Forced restructuring and interoperability mandates fundamentally alter the business model that drove decades of growth.`),
        mockScenario('5_year', 1, 'The Next Generation Forgets You', 55, 3, `Gen Alpha consumers actively reject ${companyName} as a relic of their parents' era. Market share among under-25 demographics collapses to single digits, and no rebrand can undo the generational perception shift.`),
        mockScenario('5_year', 2, 'The Supply Chain Shatters', 48, 4, `Geopolitical tensions and climate disruptions devastate ${companyName}'s global supply chain. Cost of goods triples, margins evaporate, and the company is forced into a painful strategic retreat from key markets.`),
      ],
      '10_year': [
        mockScenario('10_year', 0, 'The AI Makes You Obsolete', 62, 5, `Open-source AI models eliminate the core value proposition of ${companyName}. What once required a billion-dollar company can now be replicated by a teenager with a laptop. The market cap loses 80% of its value.`),
        mockScenario('10_year', 1, 'The Climate Bill Comes Due', 70, 4, `Mandatory climate impact accounting reveals ${companyName}'s true environmental cost. Carbon taxation and remediation requirements consume 35% of annual revenue. Shareholders revolt.`),
        mockScenario('10_year', 2, 'The Competitor That Cannot Be Named', 40, 5, `A startup from an unexpected sector renders ${companyName}'s entire product category irrelevant. The disruption is so complete that business schools will teach it as a cautionary tale for the next century.`),
      ],
      '50_year': [
        mockScenario('50_year', 0, 'The Brand Becomes a Warning', 75, 5, `${companyName} enters the lexicon as a synonym for corporate hubris. Children learn about it in history class alongside other cautionary tales. The name itself becomes legally toxic — no successor entity dares to use it.`),
        mockScenario('50_year', 1, 'The Ocean Claims the Headquarters', 50, 5, `Rising sea levels and mega-storms render ${companyName}'s physical infrastructure uninhabitable. The iconic headquarters becomes a diving attraction. The company exists only as a distributed ghost, its assets scattered across jurisdictions that no longer recognize its authority.`),
        mockScenario('50_year', 2, 'The Machines Remember Everything', 60, 5, `Future AI systems, trained on the complete historical record, surface every ethical compromise ${companyName} ever made. In a world of perfect institutional memory, the concept of "moving on" from corporate misdeeds becomes impossible.`),
      ],
    },
  };
}
