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

function buildSystemPrompt(
  agentId: string,
  context: { company: string; scenario: string; phase?: string }
): string {
  const agentPrompt = loadPrompt(agentPromptFiles[agentId] || 'system-boris.txt');
  const taskPrompt = loadPrompt('task-chat.txt');

  return `${agentPrompt}\n\n${taskPrompt
    .replace('[COMPANY]', context.company)
    .replace('[SCENARIO_DESCRIPTION]', context.scenario)
    .replace('[AGENT_NAME]', agentId)
    .replace('[AGENT_PERSONALITY_DESCRIPTION]', agentPrompt)}

Current phase: ${context.phase || 'production'}
Stay in character. Be specific about creative work. Keep it to 1-4 sentences unless making a longer creative point.`;
}

export async function POST(req: Request) {
  try {
    const { agentId, conversationHistory, context } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock response without streaming
      const mockResponses: Record<string, string[]> = {
        boris: [
          'This headline DEMANDS attention. It is not a suggestion — it is a VERDICT delivered in 72-point type.',
          'The composition is magnificent. But we need MORE conviction in the subhead. Conviction is not optional.',
          'I have seen revolutions start with less powerful messaging than what we are building here.',
        ],
        nadia: [
          'The data suggests this messaging framework will achieve 34% higher recall in crisis contexts. I recommend we proceed.',
          'Based on my models, this scenario has a 78% probability of occurring within the stated timeframe. Our response is calibrated accordingly.',
          'The strategic positioning is sound. I have verified it against 47 comparable corporate crises.',
        ],
        gremlin: [
          'ok what if we make the whole thing red. like really red. the red of a fire alarm that nobody pulled.',
          'wait. the type is doing something interesting. dont touch it. let it breathe.',
          'no no no. bigger. the logo needs to be bigger. or smaller. one of those.',
        ],
        'the-archivist': [
          'For context: the last company to attempt this style of proactive apology was Volkswagen in 2015. The campaign cost $14.7 billion. Ours will be more elegant.',
          'It should be noted that 73% of corporate apologies fail because they lack specificity. I have prepared supplementary materials.',
          'Cross-referencing this scenario with historical precedent reveals 12 comparable instances. Footnote 23 contains the full analysis.',
        ],
        'comrade-pixel': [
          'What if the manifesto begins with silence. A single blank page. And then — the truth, arriving like weather.',
          'I have rewritten the headline forty-one times. This version is the one. I can feel it in the kerning.',
          'The apology is not just words. It is an architecture of regret, built with the precision of a cathedral and the honesty of a confession.',
        ],
      };

      const responses = mockResponses[agentId] || mockResponses.boris;
      const response = responses[Math.floor(Math.random() * responses.length)];

      // Simulate streaming with SSE
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const words = response.split(' ');
          for (let i = 0; i < words.length; i++) {
            const text = (i === 0 ? '' : ' ') + words[i];
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
            await new Promise((r) => setTimeout(r, 30 + Math.random() * 40));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const client = new Anthropic({ apiKey });

    const systemPrompt = buildSystemPrompt(agentId, {
      company: context.company?.name || 'Unknown',
      scenario:
        context.scenarios
          ?.map((s: { title: string; summary: string }) => `${s.title}: ${s.summary}`)
          .join('\n') || 'General doomsday scenario',
      phase: context.phase,
    });

    // Format conversation history
    const messages = (conversationHistory || [])
      .slice(-20)
      .map((msg: { agentId: string; content: string }) => ({
        role: msg.agentId === 'user' ? ('user' as const) : ('assistant' as const),
        content:
          msg.agentId === 'user'
            ? msg.content
            : `[${msg.agentId}]: ${msg.content}`,
      }));

    // Ensure messages alternate correctly for Claude
    if (messages.length === 0 || messages[messages.length - 1]?.role !== 'user') {
      messages.push({
        role: 'user' as const,
        content: 'Continue working on the campaign. React to the latest developments and share your thoughts.',
      });
    }

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
                )
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (err) {
          console.error('Stream error:', err);
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
