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
      // Build context-aware mock response
      const mockResponse = buildMockResponse(agentId, conversationHistory, context);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const words = mockResponse.split(' ');
          for (let i = 0; i < words.length; i++) {
            const text = (i === 0 ? '' : ' ') + words[i];
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
            await new Promise((r) => setTimeout(r, 25 + Math.random() * 35));
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

    // Build conversation transcript as a single context block for Claude
    const recentHistory = (conversationHistory || []).slice(-25);
    const transcript = recentHistory
      .map((msg: { agentId: string; content: string }) => {
        if (msg.agentId === 'user') return `[USER]: ${msg.content}`;
        const name = agentNames[msg.agentId] || msg.agentId.toUpperCase();
        return `[${name}]: ${msg.content}`;
      })
      .join('\n\n');

    // Find the last user message if any
    const lastUserMsg = [...recentHistory]
      .reverse()
      .find((m: { agentId: string }) => m.agentId === 'user');

    // Find the last few agent messages to know what was recently discussed
    const lastAgentMsgs = recentHistory
      .filter((m: { agentId: string }) => m.agentId !== 'user')
      .slice(-3);

    let userPrompt: string;
    if (lastUserMsg) {
      userPrompt = `Here is the conversation so far:\n\n${transcript}\n\nThe human user just said: "${lastUserMsg.content}"\n\nRespond directly to the user's message. Be specific and helpful while staying in character as ${agentNames[agentId] || agentId}.`;
    } else if (lastAgentMsgs.length > 0) {
      const lastAgent = lastAgentMsgs[lastAgentMsgs.length - 1];
      const lastName = agentNames[lastAgent.agentId] || lastAgent.agentId;
      userPrompt = `Here is the conversation so far:\n\n${transcript}\n\n${lastName} just said: "${lastAgent.content}"\n\nReact to what was just said. Build on, critique, agree, or redirect the conversation. Add something new and specific to the ${context.company?.name || 'company'} campaign. Do NOT repeat anything already said.`;
    } else {
      userPrompt = `The team is starting work on the proactive apology campaign for ${context.company?.name || 'the company'}.\n\nScenario: ${context.scenarios?.map((s: { title: string }) => s.title).join(', ') || 'General threat'}\n\nShare your opening thoughts on the campaign approach. Be specific to this company and scenario.`;
    }

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
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
    return new Response(
      JSON.stringify({ error: 'THE APPARATUS HAS ENCOUNTERED A TEMPORARY CONTRADICTION' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Build a context-aware mock response when no API key is set.
 * Uses conversation history and company context to vary responses.
 */
function buildMockResponse(
  agentId: string,
  conversationHistory: Array<{ agentId: string; content: string }>,
  context: { company?: { name: string }; scenarios?: Array<{ title: string }> }
): string {
  const company = context?.company?.name || 'the company';
  const scenario = context?.scenarios?.[0]?.title || 'the impending crisis';
  const msgCount = (conversationHistory || []).length;
  const lastUserMsg = [...(conversationHistory || [])]
    .reverse()
    .find((m) => m.agentId === 'user');
  const lastAgentMsg = [...(conversationHistory || [])]
    .reverse()
    .find((m) => m.agentId !== 'user' && m.agentId !== agentId);

  // Phase-based responses that reference company and scenario
  const pools: Record<string, string[]> = {
    boris: [
      `The ${company} campaign demands ABSOLUTE conviction. "${scenario}" is not just a threat — it is our creative AMMUNITION.`,
      `I have reviewed the latest assets and they lack the GRAVITAS this moment requires. ${company} deserves a reckoning, not a memo.`,
      `This is PRECISELY the kind of crisis that separates great campaigns from corporate wallpaper. ${company} will thank us.`,
      `The headline must hit like a declaration of war. ${company}'s audience needs to feel the weight of accountability in every syllable.`,
      `We are not apologizing FOR ${company}. We are teaching them HOW to apologize. There is a MAGNIFICENT difference.`,
      lastUserMsg ? `Your suggestion has MERIT. But let me refine it — ${company} needs more FORCE behind the message. More conviction.` : `Every asset on this canvas must serve the narrative. ${company}'s credibility depends on our precision.`,
      lastAgentMsg ? `I hear what ${agentNames[lastAgentMsg.agentId] || 'they'} said, and I DISAGREE with the timidity. ${company} needs BOLD action, not careful hedging.` : `The campaign for ${company} is taking shape. I see the architecture of a truly MAGNIFICENT apology.`,
    ],
    nadia: [
      `My models indicate that ${company}'s exposure to "${scenario}" carries a 67% probability of materialization within the projected timeframe. We must calibrate the messaging accordingly.`,
      `The data from comparable crises suggests ${company} should lead with specificity. Vague contrition performs 41% worse than targeted accountability.`,
      `I have cross-referenced ${company}'s stakeholder sentiment data. The window for proactive action is narrower than Boris assumes.`,
      `The messaging framework needs to address three distinct audience segments for ${company}. Each requires a different calibration of contrition.`,
      lastUserMsg ? `Your point is well-taken. The data supports a pivot in that direction. I will adjust the probability matrices for ${company} accordingly.` : `Current campaign trajectory for ${company} tracks well against crisis response benchmarks. Confidence: 0.82.`,
      lastAgentMsg ? `${agentNames[lastAgentMsg.agentId] || 'The previous point'}'s observation aligns with my models, though I would note a 23% variance in the underlying assumption about ${company}'s market position.` : `${company}'s risk profile suggests we frontload the remediation commitments. The data is unambiguous.`,
    ],
    gremlin: [
      `ok so the ${company} color palette is wrong. not wrong-wrong but wrong in a way that feels dishonest. like the colors are trying too hard to say sorry.`,
      `what if we stripped everything back for ${company}. just black and white. the apology doesn't need decoration it needs oxygen.`,
      `the type on the ${company} manifesto is doing something. i dont know what yet but dont touch it.`,
      `ok hear me out. what if the ${company} billboard is just empty. like completely empty. and then the url at the bottom in 6pt type.`,
      lastUserMsg ? `wait actually. that idea you just said. what if we pushed it further for ${company}. like way further.` : `the visual language for ${company} needs to feel like a confession not a press release. raw paper. imperfect registration.`,
      lastAgentMsg ? `yeah what ${agentNames[lastAgentMsg?.agentId] || 'they'} said but more chaotic. ${company} can handle it.` : `im thinking about texture for the ${company} campaign. like literal texture. sandpaper ads. you have to feel it.`,
    ],
    'the-archivist': [
      `For context: ${company}'s sector has experienced 23 comparable crises since 2008. Only 4 companies survived with brand equity intact. The common factor was timing of disclosure.`,
      `It should be noted that ${company}'s regulatory environment has shifted 3 times in the last 18 months. Our messaging must account for this instability.`,
      `I have compiled a dossier of 12 historical parallels to "${scenario}." The most instructive is the 2015 case — the parallels to ${company} are remarkable.`,
      `Historical note: every company that delayed its response to a comparable threat by more than 90 days experienced an average 47% increase in remediation costs. ${company} should act decisively.`,
      lastUserMsg ? `To address your point: the historical record suggests that approach has been tried twice before in ${company}'s sector. Once it succeeded. Once it did not. I can provide the details.` : `My research on ${company}'s institutional history reveals patterns that should inform our creative approach. Footnote 34 is particularly relevant.`,
      lastAgentMsg ? `Building on what ${agentNames[lastAgentMsg?.agentId] || 'they'} suggested — the precedent for ${company} actually supports an even more aggressive timeline. See footnote 89.` : `The historical context for ${company} is critical. I have identified 7 inflection points that our campaign must address.`,
    ],
    'comrade-pixel': [
      `What if the ${company} manifesto starts not with an apology but with a question. "What would you do if you knew?" And then we answer it. Honestly.`,
      `I have been writing the ${company} headline for three hours. This version is the one. It sounds like the truth sounds when you finally say it out loud.`,
      `The ${company} copy needs to breathe. Right now it reads like a legal document wearing a human costume. We need to strip it down to the bone.`,
      `What if "${scenario}" is not the crisis. What if the crisis is that ${company} never said anything when they could have. The campaign writes itself from there.`,
      lastUserMsg ? `Your words just unlocked something. What if we built the entire ${company} manifesto around that exact feeling. The feeling of finally saying the thing.` : `The voice of the ${company} campaign should sound like a letter you write at 3am when you can't sleep because you know you owe someone the truth.`,
      lastAgentMsg ? `What ${agentNames[lastAgentMsg?.agentId] || 'they'} said. But softer. ${company} needs tenderness here, not force. The wound is already open.` : `Every word in the ${company} campaign must earn its place. I am editing ruthlessly. Iteration thirty-seven.`,
    ],
  };

  const pool = pools[agentId] || pools.boris;
  // Use msgCount to cycle through responses so they don't repeat
  const idx = msgCount % pool.length;
  return pool[idx];
}
