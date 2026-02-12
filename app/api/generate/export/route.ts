import { NextResponse } from 'next/server';
import JSZip from 'jszip';

interface AssetWithImage {
  title: string;
  content: string;
  type: string;
  createdBy: string;
  state: string;
  imageUrl?: string;
}

/** Extract base64 data from a data URI */
function extractBase64(dataUri: string): string | null {
  const match = dataUri.match(/^data:image\/\w+;base64,(.+)$/);
  return match ? match[1] : null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function formatAssetForExport(asset: { title: string; content: string; type: string; createdBy: string }): string {
  return `# ${asset.title}\n\n**Type:** ${asset.type.replace(/_/g, ' ')}\n**Created by:** ${asset.createdBy}\n\n---\n\n${asset.content}\n`;
}

function formatChatLog(chatLog: Array<{ agentId: string; content: string; timestamp: string | Date }>): string {
  let text = 'ADHD AI — COLLECTIVE COMMUNICATIONS TRANSCRIPT\n';
  text += '='.repeat(60) + '\n\n';

  for (const msg of chatLog) {
    const name = msg.agentId === 'user' ? 'USER' : msg.agentId.toUpperCase();
    const time = new Date(msg.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    text += `[${time}] ${name}\n`;
    text += '-'.repeat(name.length + 8) + '\n';
    text += `${msg.content}\n\n`;
  }

  text += '='.repeat(60) + '\n';
  text += '© ADHD AI COLLECTIVE. ALL OUTPUT IS THE PROPERTY OF THE VOID.\n';
  return text;
}

export async function POST(req: Request) {
  try {
    const { assets, chatLog, company, scenarios } = await req.json();

    const zip = new JSZip();

    // Campaign Brief
    const brief = `# ADHD AI — Campaign Brief
## Proactive Apology Campaign for ${company?.name || 'Unknown'}

**Sector:** ${company?.sector || 'Unknown'}
**Prepared by:** The ADHD AI Collective

---

## Selected Doomsday Scenarios

${(scenarios || [])
  .map(
    (s: { title: string; probability: number; severity: number; summary: string }) =>
      `### ${s.title}\n- **Probability:** ${s.probability}%\n- **Severity:** ${s.severity}/5\n- **Summary:** ${s.summary}\n`
  )
  .join('\n')}

---

## Campaign Assets

${(assets || [])
  .filter((a: { state: string }) => a.state === 'final')
  .map((a: { title: string; type: string; createdBy: string }) => `- **${a.title}** (${a.type.replace(/_/g, ' ')}) — by ${a.createdBy}`)
  .join('\n')}

---

## Campaign Strategy

This proactive apology campaign was developed by the full ADHD AI Collective: Boris (Creative Director), Nadia (Strategist), Gremlin (Art Director), The Archivist (Researcher), and Comrade Pixel (Copywriter).

The campaign anticipates potential crises and prepares authentic, specific, and human messaging that can be deployed before external pressure forces a reactive response.

---

*© ADHD AI Collective. All output is the property of the void.*
`;
    zip.file('campaign_brief.md', brief);

    // Manifesto
    const manifestos = (assets || []).filter(
      (a: AssetWithImage) => a.type === 'manifesto' && a.state === 'final'
    );
    if (manifestos.length > 0) {
      const manifesto = manifestos[manifestos.length - 1];
      zip.file(
        'manifesto.md',
        `# ${manifesto.title}\n\n${manifesto.content}\n\n---\n\n*Written by Comrade Pixel for the ADHD AI Collective*\n`
      );
      if (manifesto.imageUrl) {
        const imgData = extractBase64(manifesto.imageUrl);
        if (imgData) zip.file(`manifesto_visual.png`, imgData, { base64: true });
      }
    }

    // Messaging Framework
    const frameworks = (assets || []).filter(
      (a: AssetWithImage) => a.type === 'messaging_framework' && a.state === 'final'
    );
    if (frameworks.length > 0) {
      const fw = frameworks[0];
      zip.file('messaging_framework.md', formatAssetForExport(fw));
      if (fw.imageUrl) {
        const imgData = extractBase64(fw.imageUrl);
        if (imgData) zip.file(`messaging_framework_visual.png`, imgData, { base64: true });
      }
    }

    // Ad Concepts — PNGs + text
    const adConcepts = (assets || []).filter(
      (a: AssetWithImage) => a.type === 'ad_concept' && a.state === 'final'
    );
    if (adConcepts.length > 0) {
      const adFolder = zip.folder('ad_concepts');
      for (let i = 0; i < adConcepts.length; i++) {
        const ad = adConcepts[i];
        const slug = slugify(ad.title);
        adFolder!.file(`${slug}_copy.md`, formatAssetForExport(ad));
        if (ad.imageUrl) {
          const imgData = extractBase64(ad.imageUrl);
          if (imgData) adFolder!.file(`${slug}.png`, imgData, { base64: true });
        }
      }
    }

    // OOH Concepts — PNGs + text
    const oohConcepts = (assets || []).filter(
      (a: AssetWithImage) => a.type === 'ooh_mockup' && a.state === 'final'
    );
    if (oohConcepts.length > 0) {
      const oohFolder = zip.folder('ooh_concepts');
      for (let i = 0; i < oohConcepts.length; i++) {
        const ooh = oohConcepts[i];
        const slug = slugify(ooh.title);
        oohFolder!.file(`${slug}_copy.md`, formatAssetForExport(ooh));
        if (ooh.imageUrl) {
          const imgData = extractBase64(ooh.imageUrl);
          if (imgData) oohFolder!.file(`${slug}.png`, imgData, { base64: true });
        }
      }
    }

    // Chat transcript
    if (chatLog && chatLog.length > 0) {
      zip.file('chat_transcript.txt', formatChatLog(chatLog));
    }

    const buffer = await zip.generateAsync({ type: 'arraybuffer' });

    const slug = company?.domain
      ? company.domain.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase()
      : 'unknown';

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="ADHD_AI_${slug}_dossier.zip"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'THE EXPORT APPARATUS HAS ENCOUNTERED A CONTRADICTION' },
      { status: 500 }
    );
  }
}
