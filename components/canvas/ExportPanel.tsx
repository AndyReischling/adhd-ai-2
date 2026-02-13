'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { useChatStore } from '@/store/chatStore';
import { useProjectStore } from '@/store/projectStore';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Button from '@/components/ui/Button';
import StampLabel from '@/components/ui/StampLabel';
import { CanvasAsset, ChatMessage, DoomsdayScenario } from '@/types';

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50);
}

function extractBase64(dataUri: string): string | null {
  const match = dataUri.match(/^data:image\/\w+;base64,(.+)$/);
  return match ? match[1] : null;
}

function formatAsset(asset: CanvasAsset): string {
  return `# ${asset.title}\n\n**Type:** ${asset.type.replace(/_/g, ' ')}\n**Created by:** ${asset.createdBy}\n\n---\n\n${asset.content}\n`;
}

function formatChat(messages: ChatMessage[]): string {
  let text = 'ADHD AI — COLLECTIVE COMMUNICATIONS TRANSCRIPT\n';
  text += '='.repeat(60) + '\n\n';
  for (const msg of messages) {
    if (!msg || !msg.agentId) continue;
    const name = msg.agentId === 'user' ? 'USER' : (msg.agentId || 'AGENT').toUpperCase();
    let time = '';
    try { time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }); } catch { /* */ }
    text += `[${time}] ${name}\n${'-'.repeat(name.length + 8)}\n${msg.content || ''}\n\n`;
  }
  text += '='.repeat(60) + '\n© ADHD AI COLLECTIVE. ALL OUTPUT IS THE PROPERTY OF THE VOID.\n';
  return text;
}

export default function ExportPanel() {
  const { assets } = useCanvasStore();
  const { messages } = useChatStore();
  const { company, selectedScenarios } = useProjectStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const finalAssets = (assets || []).filter((a) => a.state === 'final');
  const assetsByType = {
    ad_concepts: finalAssets.filter((a) => a.type === 'ad_concept'),
    ooh_mockups: finalAssets.filter((a) => a.type === 'ooh_mockup'),
    messaging: finalAssets.filter((a) => a.type === 'messaging_framework'),
    manifestos: finalAssets.filter((a) => a.type === 'manifesto'),
    text_cards: finalAssets.filter((a) => a.type === 'text_card'),
  };

  const handleExport = useCallback(async () => {
    setIsExporting(true);

    try {
      const zip = new JSZip();
      const companyName = company?.name || 'Unknown';
      const scenarios = selectedScenarios || [];

      // Campaign Brief
      zip.file('campaign_brief.md', `# ADHD AI — Campaign Brief\n## Proactive Apology Campaign for ${companyName}\n\n**Sector:** ${company?.sector || 'Unknown'}\n**Prepared by:** The ADHD AI Collective\n\n---\n\n## Selected Doomsday Scenarios\n\n${scenarios.map((s: DoomsdayScenario) => `### ${s.title}\n- **Probability:** ${s.probability}%\n- **Severity:** ${s.severity}/5\n- **Summary:** ${s.summary}\n`).join('\n')}\n\n---\n\n## Campaign Assets\n\n${finalAssets.map((a) => `- **${a.title}** (${a.type.replace(/_/g, ' ')}) — by ${a.createdBy}`).join('\n')}\n\n---\n\n*© ADHD AI Collective. All output is the property of the void.*\n`);

      // Manifesto
      const manifestos = finalAssets.filter((a) => a.type === 'manifesto');
      if (manifestos.length > 0) {
        const m = manifestos[manifestos.length - 1];
        zip.file('manifesto.md', `# ${m.title}\n\n${m.content}\n\n---\n\n*Written by Comrade Pixel for the ADHD AI Collective*\n`);
        if (m.imageUrl) {
          const b64 = extractBase64(m.imageUrl);
          if (b64) zip.file('manifesto.png', b64, { base64: true });
        }
      }

      // Messaging Framework
      const frameworks = finalAssets.filter((a) => a.type === 'messaging_framework');
      if (frameworks.length > 0) {
        zip.file('messaging_framework.md', formatAsset(frameworks[0]));
      }

      // Ad Concepts — PNGs + copy
      const ads = finalAssets.filter((a) => a.type === 'ad_concept');
      if (ads.length > 0) {
        const folder = zip.folder('ad_concepts')!;
        for (const ad of ads) {
          const s = slugify(ad.title);
          folder.file(`${s}_copy.md`, formatAsset(ad));
          if (ad.imageUrl) {
            const b64 = extractBase64(ad.imageUrl);
            if (b64) folder.file(`${s}.png`, b64, { base64: true });
          }
        }
      }

      // OOH Concepts — PNGs + copy
      const oohs = finalAssets.filter((a) => a.type === 'ooh_mockup');
      if (oohs.length > 0) {
        const folder = zip.folder('ooh_concepts')!;
        for (const ooh of oohs) {
          const s = slugify(ooh.title);
          folder.file(`${s}_copy.md`, formatAsset(ooh));
          if (ooh.imageUrl) {
            const b64 = extractBase64(ooh.imageUrl);
            if (b64) folder.file(`${s}.png`, b64, { base64: true });
          }
        }
      }

      // Chat transcript
      if (messages && messages.length > 0) {
        zip.file('chat_transcript.txt', formatChat(messages));
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const slug = company?.domain?.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'unknown';
      saveAs(blob, `ADHD_AI_${slug}_dossier.zip`);
      setExportComplete(true);
    } catch (err) {
      console.error('Export failed:', err);
      // Fallback to text-only export
      let text = `ADHD AI — CAMPAIGN DOSSIER\nCompany: ${company?.name}\n${'='.repeat(60)}\n\n`;
      for (const asset of finalAssets) {
        text += `[${asset.type.toUpperCase().replace('_', ' ')}] ${asset.title}\n${'-'.repeat(40)}\n${asset.content}\n\n`;
      }
      const blob = new Blob([text], { type: 'text/plain' });
      saveAs(blob, `ADHD_AI_dossier.txt`);
      setExportComplete(true);
    } finally {
      setIsExporting(false);
    }
  }, [finalAssets, messages, company, selectedScenarios]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-[260px] right-[350px] z-30 bg-gray-900/98 backdrop-blur-sm border-t border-gray-800"
    >
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-accent text-sm tracking-[0.3em] text-gold-accent">DOSSIER READY</div>
            <div className="font-mono text-[10px] text-gray-400 tracking-[0.2em]">
              {finalAssets.length} FINALIZED ASSETS
              {finalAssets.filter((a) => a.imageUrl).length > 0 &&
                ` · ${finalAssets.filter((a) => a.imageUrl).length} IMAGES`}
            </div>
          </div>
          {exportComplete ? (
            <StampLabel text="DOSSIER DELIVERED" variant="gold" size="md" />
          ) : (
            <Button variant="secondary" size="md" onClick={handleExport} disabled={isExporting}>
              {isExporting ? 'COMPILING...' : 'DOWNLOAD DOSSIER'}
            </Button>
          )}
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {Object.entries(assetsByType).map(([cat, items]) => {
            if (items.length === 0) return null;
            const hasImages = items.some((a) => a.imageUrl);
            return (
              <div key={cat} className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-[10px] text-gray-600">{cat.replace(/_/g, ' ').toUpperCase()}</span>
                <span className="font-mono text-[10px] text-gold-accent bg-gold-accent/10 px-1.5 py-0.5">
                  {items.length}{hasImages ? ' + PNGs' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
