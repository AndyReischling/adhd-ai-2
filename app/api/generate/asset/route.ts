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

// Mock responses for when no API key is set
const mockAssets: Record<string, Record<string, { title: string; content: string }>> = {
  text_card: {
    boris: { title: 'Creative Brief: The Reckoning', content: 'This campaign will not whisper. It will DECLARE. The consumer deserves to know that we knew, and we chose to act before the world forced our hand. Every word must carry the weight of institutional responsibility and the elegance of genuine contrition.' },
    nadia: { title: 'Scenario Analysis Summary', content: 'Primary threat vector: regulatory exposure at 73% probability within 18 months. Secondary: reputational contagion from supply chain dependencies. Recommended posture: pre-emptive transparency with quantified remediation commitments.' },
    'the-archivist': { title: 'Historical Precedent File', content: 'Cross-reference analysis of 47 comparable corporate crises (1986-2024) reveals a consistent pattern: companies that issued proactive statements within the first 72 hours of crisis awareness experienced 34% less market cap erosion than those who waited. Notable exception: Enron (2001), where no amount of proactivity could offset fundamental fraud.' },
  },
  ad_concept: {
    boris: { title: 'We Knew. Now You Know.', content: 'Full-page print ad. Black background. White serif text, centered. No logo until the final line. Subhead: "A letter to everyone we owe an explanation." CTA: "Read the full report at [domain]/accountability"' },
    gremlin: { title: 'the quiet version', content: 'just the word "sorry" in 6pt type on a billboard. nothing else. maybe a color. probably red. the kind of red that makes you feel something before you read it.' },
    'comrade-pixel': { title: 'Before the Headlines', content: 'Hero line: "Before the headlines wrote our story, we wanted to write it ourselves." Body: A confession masquerading as an ad. Every sentence builds toward an admission. CTA: "We owe you more than this ad. Start here."' },
  },
  ooh_mockup: {
    boris: { title: 'Transit Authority: The Apology Posters', content: 'Series of 3 bus shelter posters. Each features a single statistic in large display type against stark black. Poster 1: "4.2 million affected." Poster 2: "847 days we waited." Poster 3: "1 chance to make it right." Bottom strip: company mark + accountability URL.' },
    gremlin: { title: 'the billboard that watches back', content: 'digital billboard. eye-level. it changes based on time of day. morning: "good morning. we have something to tell you." afternoon: "by now you may have heard." evening: "we\'re still here. still sorry." midnight: just the company logo, dimmed to 10% opacity.' },
  },
  messaging_framework: {
    nadia: { title: 'Crisis Communications Framework v2.1', content: 'PRIMARY MESSAGE: We identified a systemic issue before it became a crisis. We are choosing transparency.\n\nKEY MESSAGES:\n1. We take full responsibility for the oversight.\n2. Affected stakeholders will receive direct communication within 48 hours.\n3. An independent review has been commissioned.\n4. Remediation is already underway.\n\nTONE: Sober, specific, human. Avoid corporate jargon. Use first-person plural.' },
  },
  manifesto: {
    'comrade-pixel': { title: 'A Letter to the Future We Nearly Destroyed', content: 'We built something magnificent.\nAnd in our magnificence, we forgot to look down.\n\nThis is not an apology designed by committee.\nThis is a confession written in the only language we know —\nthe language of what we should have said\nwhen the silence was still a choice.\n\nWe are not asking for forgiveness.\nWe are asking for the chance to earn\nthe right to ask for forgiveness.\n\nThis is the beginning.\nNot of a campaign.\nOf a correction.' },
  },
  sticky_note: {
    gremlin: { title: 'note', content: 'what if the whole thing is just one color. one word. one breath.' },
    boris: { title: 'note', content: 'The headline needs more CONVICTION. This reads like an apology from a parking meter.' },
    'comrade-pixel': { title: 'note', content: 'What if we lead with the silence. The thing they didn\'t say. The press release they never sent.' },
    'the-archivist': { title: 'note', content: 'Reminder: similar campaign by BP in 2010 cost $93M. Our approach is more elegant and costs nothing.' },
    nadia: { title: 'note', content: 'Contrition index is at 0.73. We need to increase specificity to reach the 0.85 threshold for credibility.' },
  },
};

export async function POST(req: Request) {
  try {
    const { agentId, assetType, context } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock data
      const typeAssets = mockAssets[assetType] || mockAssets.text_card;
      const agentAsset = typeAssets[agentId] || Object.values(typeAssets)[0];
      return NextResponse.json(agentAsset || { title: 'Untitled Asset', content: 'Content pending review by the Collective.' });
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
      { title: 'Draft Asset', content: 'The Collective is deliberating. Content forthcoming.' }
    );
  }
}
