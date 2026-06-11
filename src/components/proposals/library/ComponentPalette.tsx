'use client';

import React from 'react';
import { PALETTE, GROUP_ORDER, PaletteItem } from './composerComponents';

interface Props {
  onPick: (item: PaletteItem) => void;
  layout?: 'vertical' | 'horizontal';
}

/**
 * Lists the proposal UI components (same palette as the Section Composer):
 * Heading, Phase, Callouts, Pricing, Signature, … grouped by purpose.
 * Clicking one inserts it into the proposal as a `component` block.
 */
export const ComponentPalette: React.FC<Props> = ({ onPick, layout = 'vertical' }) => {
  const grouped = GROUP_ORDER.map(
    (g) => [g, PALETTE.filter((p) => p.group === g)] as const,
  ).filter(([, items]) => items.length > 0);

  if (layout === 'horizontal') {
    return (
      <div className="pb-rail__cards no-scrollbar" style={{ gap: 8 }}>
        {PALETTE.map((p) => (
          <button
            key={p.paletteId}
            type="button"
            title={p.blurb}
            onClick={() => onPick(p)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 11px',
              border: '1px solid var(--border-color, #e5e7eb)', background: 'var(--bg-pure-white, #fff)',
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <span style={{ width: 22, height: 22, display: 'grid', placeItems: 'center', color: p.accent, background: `${p.accent}14`, flexShrink: 0 }}>{p.icon}</span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>{p.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div>
      {grouped.map(([group, items]) => (
        <div key={group} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--text-slate-400, #94a3b8)', margin: '8px 2px 5px' }}>
            {group}
          </div>
          {items.map((p) => (
            <button
              key={p.paletteId}
              type="button"
              title={p.blurb}
              onClick={() => onPick(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                padding: '7px 9px', border: '1px solid transparent', background: 'transparent',
                cursor: 'pointer', marginBottom: 2,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--bg-slate-50, #f8fafc)'; e.currentTarget.style.borderColor = 'var(--border-color, #e5e7eb)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
            >
              <span style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', color: p.accent, background: `${p.accent}14`, flexShrink: 0 }}>{p.icon}</span>
              <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary, #0f172a)', lineHeight: 1.2 }}>{p.label}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-slate-400, #94a3b8)', lineHeight: 1.25 }}>{p.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};
