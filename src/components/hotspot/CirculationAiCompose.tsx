'use client';

import React, { useState } from 'react';
import { App, Button, Input, Tooltip } from 'antd';
import { ChevronDown, Sparkles, Wand2 } from 'lucide-react';
import { PALETTE, TINT } from '@/components/openings/ui';
import HotspotCirculationService, {
  ComposeTone,
  CirculationCategory,
} from '@/services/hotspotCirculationService';

// "Create with Zai" — the panel that turns a one-line brief into a drafted
// title and body.
//
// It is collapsed by default and never auto-runs. Writing an update is the
// user's job; this is an offer, not the primary path, and the panel says what
// it will overwrite before it does it.

const TONES: { key: ComposeTone; label: string; hint: string }[] = [
  { key: 'neutral', label: 'Neutral', hint: 'Clear and matter-of-fact' },
  { key: 'friendly', label: 'Friendly', hint: 'Warm and conversational' },
  { key: 'formal', label: 'Formal', hint: 'Formal and precise' },
  { key: 'urgent', label: 'Urgent', hint: 'Direct, leads with the action needed' },
  { key: 'celebratory', label: 'Celebratory', hint: 'Upbeat and appreciative' },
];

export default function CirculationAiCompose({
  category,
  categoryLabel,
  currentTitle,
  currentBody,
  disabled,
  onDrafted,
}: {
  category: CirculationCategory;
  /** Set for tenant-defined categories — the slug alone is a poor prompt. */
  categoryLabel?: string | null;
  currentTitle: string;
  currentBody: string;
  disabled?: boolean;
  /** Receives the drafted title and body — the parent decides what to keep. */
  onDrafted: (draft: { title: string; body: string }) => void;
}) {
  const { message } = App.useApp();

  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState('');
  const [tone, setTone] = useState<ComposeTone>('neutral');
  const [busy, setBusy] = useState(false);

  const hasDraft = !!currentBody.replace(/<[^>]*>/g, '').trim() || !!currentTitle.trim();

  const run = async () => {
    if (brief.trim().length < 3) {
      message.error('Say what the update is about first');
      return;
    }
    setBusy(true);
    try {
      const result = await HotspotCirculationService.aiCompose({
        brief: brief.trim(),
        category,
        categoryLabel: categoryLabel ?? null,
        tone,
        currentTitle: currentTitle.trim() || null,
        currentBody: currentBody || null,
      });
      onDrafted(result);
      message.success(hasDraft ? 'Draft rewritten' : 'Draft created');
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not draft the update');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={`hsai ${open ? 'is-open' : ''}`}>
      <button className="hsai-head" onClick={() => setOpen((v) => !v)} type="button">
        <span className="hsai-icon">
          <Sparkles size={16} />
        </span>
        <span className="hsai-head-text">
          <span className="hsai-title">Create with Zai</span>
          <span className="hsai-sub">
            Describe the update in a line — get a title and a formatted draft back
          </span>
        </span>
        <ChevronDown size={16} className="hsai-chev" />
      </button>

      {open && (
        <div className="hsai-body">
          <Input.TextArea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Office will be closed on 14 Aug for Independence Day; WFH for everyone, client calls to be rescheduled"
            autoSize={{ minRows: 2, maxRows: 5 }}
            maxLength={2000}
            disabled={disabled || busy}
          />

          <div className="hsai-tones">
            <span className="hsai-tones-label">Tone</span>
            {TONES.map((t) => (
              <Tooltip key={t.key} title={t.hint}>
                <button
                  type="button"
                  className={`hsai-tone ${tone === t.key ? 'is-on' : ''}`}
                  onClick={() => setTone(t.key)}
                  disabled={busy}
                >
                  {t.label}
                </button>
              </Tooltip>
            ))}
          </div>

          <div className="hsai-actions">
            <span className="hsai-note">
              {hasDraft
                ? 'Your current draft is kept and improved — you can undo afterwards.'
                : 'Nothing is posted yet. You can edit everything before publishing.'}
            </span>
            <Button
              type="primary"
              icon={<Wand2 size={14} />}
              loading={busy}
              disabled={disabled}
              onClick={run}
            >
              {hasDraft ? 'Rewrite draft' : 'Generate draft'}
            </Button>
          </div>
        </div>
      )}

      <style jsx>{`
        .hsai {
          border: 1px solid ${PALETTE.blue}33;
          border-radius: 10px;
          background: linear-gradient(135deg, ${TINT.blue} 0%, rgba(16, 185, 129, 0.06) 100%);
          overflow: hidden;
        }
        .hsai-head {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 12px 14px; background: transparent; border: none; cursor: pointer;
          text-align: left;
        }
        .hsai-icon {
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 32px; height: 32px; border-radius: 9px;
          color: #fff; background: linear-gradient(135deg, ${PALETTE.blue}, ${PALETTE.green});
        }
        .hsai-head-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .hsai-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); line-height: 1.3;
        }
        .hsai-sub { font-size: 11.5px; color: var(--text-slate-500); font-weight: 500; }
        .hsai :global(.hsai-chev) {
          color: var(--text-slate-400); flex-shrink: 0; transition: transform .15s ease;
        }
        .hsai.is-open :global(.hsai-chev) { transform: rotate(180deg); }
        .hsai-body {
          display: flex; flex-direction: column; gap: 10px;
          padding: 0 14px 14px;
        }
        .hsai-tones { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .hsai-tones-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-slate-400); margin-right: 2px;
        }
        .hsai-tone {
          padding: 3px 10px; border-radius: 100px; cursor: pointer;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-600);
          transition: border-color .12s ease, color .12s ease, background .12s ease;
        }
        .hsai-tone:hover:not(:disabled) { border-color: ${PALETTE.blue}66; }
        .hsai-tone.is-on {
          color: ${PALETTE.blue}; background: ${TINT.blue}; border-color: ${PALETTE.blue}66;
        }
        .hsai-tone:disabled { cursor: not-allowed; opacity: 0.6; }
        .hsai-actions {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          flex-wrap: wrap;
        }
        .hsai-note {
          font-size: 11px; color: var(--text-slate-500); font-weight: 500; flex: 1; min-width: 200px;
        }
      `}</style>
    </section>
  );
}
