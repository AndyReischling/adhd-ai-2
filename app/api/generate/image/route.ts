import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Visual style direction per asset type — NO TEXT in the image
const assetStyleDirections: Record<string, string> = {
  ad_concept: `Create a powerful visual composition for a high-end print advertisement. NO TEXT, NO WORDS, NO LETTERS, NO TYPOGRAPHY in the image. Focus entirely on visual imagery, photography, and composition. Think of the visual half of an award-winning Pentagram or Collins campaign — the striking image that sits above or beside the headline. Cinematic, evocative, emotionally charged. The image should tell a story on its own. Photographic or hyper-realistic illustration style.`,

  ooh_mockup: `Create a striking visual scene for an out-of-home billboard campaign. NO TEXT, NO WORDS, NO LETTERS in the image. Show a powerful visual concept that would stop someone in their tracks on a city street. The image should work as a standalone visual — dramatic, symbolic, emotionally resonant. Can include urban environments, dramatic lighting, symbolic objects, or powerful human moments. Cinematic photography or photorealistic rendering.`,

  manifesto: `Create an evocative visual composition for a manifesto poster. NO TEXT, NO WORDS, NO LETTERS, NO TYPOGRAPHY in the image. Instead create a powerful abstract or symbolic visual — could be a dramatic landscape, an architectural space, a symbolic object, or an abstract composition. The mood should be somber, contemplative, and powerful. Think gallery-quality fine art photography or painterly illustration. Dark, moody, with subtle accent color (red or gold).`,

  messaging_framework: `Create a visual composition suggesting structured corporate communications. NO TEXT, NO WORDS, NO LETTERS. Show visual elements that suggest documentation: grids, ruled lines, classification marks as abstract shapes, red accent marks, folder edges, paper textures. The aesthetic is Soviet bureaucratic form meets Swiss modernist design. Abstract, geometric, institutional.`,

  text_card: `Create an abstract visual composition suggesting intelligence analysis. NO TEXT, NO WORDS, NO LETTERS. Show visual elements: data visualization shapes, network diagrams as abstract art, dark background with glowing connection points, radar-like graphics. Think intelligence dossier as abstract art. Dark, precise, institutional.`,

  sticky_note: `Create a small abstract visual sketch. NO TEXT. Just colors, gestural marks, arrows, and abstract shapes on colored paper. Raw, energetic, brainstorm energy.`,
};

// Brand palette
const brandPalette = `Color palette: primarily deep blacks (#0A0A0A) and warm off-whites (#F2EDE8) with accent colors deep red (#C23B22) and institutional gold (#C4A44A). The mood is institutional gravitas meets high-end design.`;

export async function POST(req: Request) {
  try {
    const { assetType, title, content, company, scenario, agentId, isFinal } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not configured', imageUrl: null },
        { status: 200 }
      );
    }

    const client = new OpenAI({ apiKey });

    const styleDirection = assetStyleDirections[assetType] || assetStyleDirections.ad_concept;

    // Agent-specific visual direction
    const agentDirections: Record<string, string> = {
      boris: 'Bold, theatrical, maximum visual impact. Strong contrast, dramatic lighting, powerful composition. Feels like a statement.',
      nadia: 'Precise, clinical, elegant. Clean lines, structured composition, cool tones. Feels data-informed and controlled.',
      gremlin: 'Chaotic but brilliant. Unexpected angles, raw textures, saturated color pops against dark backgrounds. Feels alive.',
      'the-archivist': 'Archival, documentary. Aged textures, warm sepia tones, found-document aesthetic. Feels historical.',
      'comrade-pixel': 'Poetic, emotional, ethereal. Soft focus areas, dramatic depth of field, intimate framing. Feels human.',
    };

    const agentStyle = agentDirections[agentId] || agentDirections.boris;

    const prompt = `${styleDirection}

VISUAL MOOD: ${brandPalette}

CREATIVE DIRECTION: ${agentStyle}

SUBJECT CONTEXT (for visual inspiration, NOT text):
- This visual relates to: ${company || 'a major corporation'} facing ${scenario || 'a corporate crisis'}
- The concept is called "${title}" — capture this FEELING visually, do not write these words
- The visual should evoke: ${content?.slice(0, 200) || 'corporate accountability, institutional gravity, the weight of truth'}

ABSOLUTE RULES:
- ZERO text, words, letters, numbers, or typography anywhere in the image
- NO logos, wordmarks, or brand names visible
- Pure visual composition only — imagery, photography, texture, color, light
- The image must work as a standalone visual without any text overlay
- Award-winning visual quality — belongs in Communication Arts or D&AD annual
- Photorealistic or high-end illustration style`;

    // DALL-E 3 HD for final assets, DALL-E 2 for drafts
    const useDalle3 = isFinal === true;
    const response = useDalle3
      ? await client.images.generate({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'hd',
          style: 'vivid',
        })
      : await client.images.generate({
          model: 'dall-e-2',
          prompt: prompt.slice(0, 1000),
          n: 1,
          size: '512x512',
        });

    const imageUrl = response.data?.[0]?.url;
    const revisedPrompt = response.data?.[0]?.revised_prompt;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    // Convert to base64 data URI
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
