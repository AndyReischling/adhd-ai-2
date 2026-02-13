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

const agentNames: Record<string, string> = {
  boris: 'BORIS',
  nadia: 'NADIA',
  gremlin: 'GREMLIN',
  'the-archivist': 'THE ARCHIVIST',
  'comrade-pixel': 'COMRADE PIXEL',
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

  return `${agentPrompt}

## Current Project
- Company: ${context.company}
- Doomsday Scenario: ${context.scenario}
- Current Phase: ${context.phase || 'production'}

## Critical Rules
- You are in a GROUP CHAT with other agents AND a human user
- Read the FULL conversation transcript carefully before responding
- React SPECIFICALLY to what was just said — do not repeat yourself or others
- If a human user addressed you, respond DIRECTLY to their message
- If another agent made a point, engage with THAT specific point
- Reference the actual company name and scenario details
- NEVER repeat a phrase you or another agent already said
- Each response must advance the conversation — add something NEW
- Stay in character but be REACTIVE to context, not formulaic`;
}

export async function POST(req: Request) {
  try {
    const { agentId, conversationHistory, context } = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
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

    // Build conversation transcript — guard every field access
    const recentHistory = (conversationHistory || [])
      .filter((m: { agentId?: string; content?: string }) => m && m.agentId && m.content)
      .slice(-25);

    const transcript = recentHistory
      .map((msg: { agentId: string; content: string }) => {
        if (msg.agentId === 'user') return `[USER]: ${msg.content}`;
        const name = agentNames[msg.agentId] || String(msg.agentId || 'AGENT').toUpperCase();
        return `[${name}]: ${msg.content}`;
      })
      .join('\n\n');

    const lastUserMsg = [...recentHistory]
      .reverse()
      .find((m: { agentId: string }) => m.agentId === 'user');

    const lastAgentMsgs = recentHistory
      .filter((m: { agentId: string }) => m.agentId && m.agentId !== 'user')
      .slice(-3);

    let userPrompt: string;
    if (lastUserMsg) {
      userPrompt = `Here is the conversation so far:\n\n${transcript}\n\nThe human user just said: "${lastUserMsg.content || ''}"\n\nRespond directly to the user's message. Be specific and helpful while staying in character as ${agentNames[agentId] || agentId || 'the agent'}.`;
    } else if (lastAgentMsgs.length > 0) {
      const lastAgent = lastAgentMsgs[lastAgentMsgs.length - 1];
      const lastName = agentNames[lastAgent?.agentId] || String(lastAgent?.agentId || 'AGENT');
      userPrompt = `Here is the conversation so far:\n\n${transcript}\n\n${lastName} just said: "${lastAgent?.content || ''}"\n\nReact to what was just said. Build on, critique, agree, or redirect the conversation. Add something new and specific to the ${context.company?.name || 'company'} campaign. Do NOT repeat anything already said.`;
    } else {
      userPrompt = `The team is starting work on the proactive apology campaign for ${context.company?.name || 'the company'}.\n\nScenario: ${context.scenarios?.map((s: { title: string }) => s.title).join(', ') || 'General threat'}\n\nShare your opening thoughts on the campaign approach. Be specific to this company and scenario.`;
    }

    // Use Haiku for chat — 10x cheaper, still in-character
    const stream = client.messages.stream({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
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
    const details = String(error);
    return new Response(
      JSON.stringify({ error: details }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

