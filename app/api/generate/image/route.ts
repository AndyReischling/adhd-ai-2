import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Visual style direction per asset type
const assetStyleDirections: Record<string, string> = {
  ad_concept: `Design a high-end print advertisement. Clean, award-winning layout. Think Pentagram or Collins-level craft. The ad should feel like a full-page spread in The New York Times or Wallpaper* magazine. Bold serif headlines, considered whitespace, strong visual hierarchy. No stock photo energy — this should feel intentional, provocative, and beautifully composed. Include crop marks at the corners.`,

  ooh_mockup: `Design an out-of-home billboard or transit poster mockup. Show the ad placed in an urban environment — a bus shelter, building facade, or highway billboard. The design should be striking from a distance with a dominant headline and minimal supporting elements. Soviet Constructivist influence: bold geometry, stark contrasts, propaganda poster energy but with modern high-design polish.`,

  manifesto: `Design a full-page manifesto poster. Think broadsheet declaration meets typographic art. Large display serif typography. The text should be the hero — arranged with visual rhythm, varied sizes, and deliberate line breaks. Minimal color — primarily black and white with one accent color (red or gold). The layout should feel like a political declaration or a gallery exhibition poster.`,

  messaging_framework: `Design a structured corporate communications document as a designed artifact. Think classified document meets information design. Monospace type, ruled sections, classification stamps ("CONFIDENTIAL", "FOR INTERNAL USE"), red accent marks. Grid-based layout with clear hierarchy. The aesthetic is Soviet bureaucratic form meets Swiss modernist typography.`,

  text_card: `Design a research card or strategic brief as a designed object. Clean typography, data visualization elements, structured information blocks. Think intelligence dossier meets design annual. Dark background, light text, precise grid alignment. Include subtle classification stamps or reference numbers.`,

  sticky_note: `Design a handwritten creative note on colored paper. Informal, energetic handwriting style. Sketches, arrows, underlines. The note should feel like a genuine artifact from a brainstorm — raw, immediate, alive with creative energy.`,
};

// Brand palette for consistent visual identity
const brandPalette = `Color palette: primarily #0A0A0A (near-black) and #F2EDE8 (warm off-white) with accent colors #C23B22 (propaganda red) and #C4A44A (institutional gold). Typography should suggest high-end serif for headlines and monospace for labels.`;

export async function POST(req: Request) {
  try {
    const { assetType, title, content, company, scenario, agentId } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured', imageUrl: null },
        { status: 200 }
      );
    }

    const client = new OpenAI({ apiKey });

    const styleDirection = assetStyleDirections[assetType] || assetStyleDirections.ad_concept;

    // Agent-specific creative direction
    const agentDirections: Record<string, string> = {
      boris: 'Bold, theatrical, maximum impact. Every element should feel like a proclamation. Heavy type, strong contrast, no subtlety.',
      nadia: 'Precise, data-informed, clinical elegance. Charts, statistics, structured grids. Cold beauty.',
      gremlin: 'Chaotic but brilliant. Unexpected color choices, broken grids, raw texture. Feels alive and slightly unhinged.',
      'the-archivist': 'Archival, documentary, institutional. Aged paper textures, footnote references, catalog numbering. Feels found.',
      'comrade-pixel': 'Poetic, emotional, typographically exquisite. Every word placement is a design decision. Breathes.',
    };

    const agentStyle = agentDirections[agentId] || agentDirections.boris;

    const prompt = `${styleDirection}

BRAND IDENTITY: ${brandPalette}

CREATIVE DIRECTION (from the Art Director): ${agentStyle}

CAMPAIGN CONTEXT:
- Client: ${company || 'Major corporation'}
- Crisis scenario: ${scenario || 'Proactive apology campaign'}
- Asset title: "${title}"
- Asset copy/content: "${content?.slice(0, 300) || ''}"

CRITICAL REQUIREMENTS:
- This is a PROACTIVE APOLOGY campaign — the brand is getting ahead of a crisis
- The visual tone is dead-serious institutional gravitas meets award-winning design
- Include the headline "${title}" as prominent typography in the design
- Reference the company name "${company}" somewhere in the composition
- The output should look like it belongs in a design awards annual
- Photorealistic rendering of the final produced piece (print-ready quality)
- NO placeholder text, Lorem Ipsum, or generic stock imagery`;

    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
    });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    // Fetch the image and convert to base64 data URI so it persists
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUri = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      imageUrl: dataUri,
      revisedPrompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: String(error), imageUrl: null },
      { status: 200 }
    );
  }
}
