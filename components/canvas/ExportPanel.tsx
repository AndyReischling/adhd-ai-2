'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useCanvasStore } from '@/store/canvasStore';
import { useChatStore } from '@/store/chatStore';
import { useProjectStore } from '@/store/projectStore';
import { generateExport } from '@/lib/api';
import { saveAs } from 'file-saver';
import Button from '@/components/ui/Button';
import StampLabel from '@/components/ui/StampLabel';

export default function ExportPanel() {
  const { assets } = useCanvasStore();
  const { messages } = useChatStore();
  const { company, selectedScenarios } = useProjectStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const finalAssets = assets.filter((a) => a.state === 'final');
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
      const blob = await generateExport({
        assets: finalAssets,
        chatLog: messages,
        company: company!,
        scenarios: selectedScenarios,
      });
      const slug = company?.domain?.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'unknown';
      saveAs(blob, `ADHD_AI_${slug}_dossier.zip`);
      setExportComplete(true);
    } catch (err) {
      console.error('Export failed:', err);
      const content = generateTextFallback();
      const blob = new Blob([content], { type: 'text/plain' });
      const slug = company?.domain?.replace(/\.[^.]+$/, '').replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'unknown';
      saveAs(blob, `ADHD_AI_${slug}_dossier.txt`);
      setExportComplete(true);
    } finally {
      setIsExporting(false);
    }
  }, [finalAssets, messages, company, selectedScenarios]);

  const generateTextFallback = useCallback(() => {
    let text = `ADHD AI — CAMPAIGN DOSSIER\n`;
    text += `Company: ${company?.name}\n`;
    text += `Sector: ${company?.sector}\n`;
    text += `${'='.repeat(60)}\n\n`;

    text += `SELECTED SCENARIOS:\n`;
    for (const s of selectedScenarios) {
      text += `- ${s.title} (${s.probability}% probability, severity ${s.severity}/5)\n`;
      text += `  ${s.summary}\n\n`;
    }

    text += `${'='.repeat(60)}\n\nCAMPAIGN ASSETS:\n\n`;
    for (const asset of finalAssets) {
      text += `[${asset.type.toUpperCase().replace('_', ' ')}] ${asset.title}\n`;
      text += `${'-'.repeat(40)}\n${asset.content}\n\n`;
    }

    text += `${'='.repeat(60)}\n\nCHAT TRANSCRIPT:\n\n`;
    for (const msg of messages) {
      const name = msg.agentId === 'user' ? 'USER' : msg.agentId.toUpperCase();
      const time = new Date(msg.timestamp).toLocaleTimeString();
      text += `[${time}] ${name}: ${msg.content}\n\n`;
    }

    text += `\n${'='.repeat(60)}\n© ADHD AI COLLECTIVE. ALL OUTPUT IS THE PROPERTY OF THE VOID.\n`;
    return text;
  }, [company, selectedScenarios, finalAssets, messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-[260px] right-[350px] z-30 bg-gray-900/98 backdrop-blur-sm border-t border-gray-800"
    >
      <div className="px-6 py-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-accent text-sm tracking-[0.3em] text-gold-accent">
              DOSSIER READY
            </div>
            <div className="font-mono text-[10px] text-gray-400 tracking-[0.2em]">
              {finalAssets.length} FINALIZED ASSETS
            </div>
          </div>

          {exportComplete ? (
            <StampLabel text="DOSSIER DELIVERED" variant="gold" size="md" />
          ) : (
            <Button
              variant="secondary"
              size="md"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'COMPILING...' : 'DOWNLOAD DOSSIER'}
            </Button>
          )}
        </div>

        {/* Asset summary row */}
        <div className="flex gap-4 overflow-x-auto">
          {Object.entries(assetsByType).map(([category, categoryAssets]) => {
            if (categoryAssets.length === 0) return null;
            const label = category.replace(/_/g, ' ').toUpperCase();
            return (
              <div key={category} className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono text-[10px] text-gray-600">{label}</span>
                <span className="font-mono text-[10px] text-gold-accent bg-gold-accent/10 px-1.5 py-0.5">
                  {categoryAssets.length}
                </span>
              </div>
            );
          })}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-[10px] text-gray-600">TRANSCRIPT</span>
            <span className="font-mono text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5">
              {messages.length} msgs
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
