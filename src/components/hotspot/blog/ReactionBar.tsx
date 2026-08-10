'use client';

import React, { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { PALETTE, TINT } from '@/components/openings/ui';
import type { BlogReaction, ReactionSummary } from '@/services/hotspotBlogService';
import { REACTION_META, REACTION_ORDER } from './blogMeta';

// The react button, with the hover-to-choose picker every social feed uses.
//
// One click on the button applies "like" — the overwhelmingly common case
// should not cost a hover-and-aim. Hovering (or a long-press equivalent: the
// picker is also opened by keyboard focus) reveals the full set.
//
// Clicking the reaction you already have clears it. That is handled server-side
// so a double click cannot leave a stale reaction behind.
export default function ReactionBar({
  reactions,
  onReact,
  size = 'default',
}: {
  reactions: ReactionSummary;
  onReact: (reaction: BlogReaction) => void;
  size?: 'default' | 'small';
}) {
  const [open, setOpen] = useState(false);
  const mine = reactions.mine;
  const meta = mine ? REACTION_META[mine] : null;

  return (
    <div
      className={`hsb-react ${size === 'small' ? 'is-small' : ''}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`hsb-react-btn ${mine ? 'is-on' : ''}`}
        style={meta ? { color: meta.color } : undefined}
        onFocus={() => setOpen(true)}
        onClick={() => onReact(mine ?? 'like')}
      >
        {meta ? (
          <span className="hsb-react-emoji">{meta.emoji}</span>
        ) : (
          <ThumbsUp size={size === 'small' ? 13 : 15} />
        )}
        {meta ? meta.label : 'Like'}
      </button>

      {open && (
        <div className="hsb-react-picker" role="menu">
          {REACTION_ORDER.map((key) => {
            const r = REACTION_META[key];
            return (
              <button
                key={key}
                type="button"
                className={`hsb-react-option ${mine === key ? 'is-on' : ''}`}
                title={r.label}
                aria-label={r.label}
                onClick={() => {
                  onReact(key);
                  setOpen(false);
                }}
              >
                <span className="hsb-react-option-emoji">{r.emoji}</span>
                <span className="hsb-react-option-label">{r.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .hsb-react { position: relative; display: inline-flex; }
        .hsb-react-btn {
          display: inline-flex; align-items: center; gap: 6px;
          /* Kept in step with .hsb-post-action — they share the actions row, so
             the taller of the two sets its height. */
          padding: 4px 9px; border-radius: 8px; cursor: pointer;
          border: none; background: transparent;
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-500);
          transition: background .12s ease, color .12s ease;
        }
        .is-small .hsb-react-btn { padding: 2px 6px; font-size: 12px; gap: 4px; }
        .hsb-react-btn:hover { background: var(--bg-slate-50); }
        .hsb-react-btn.is-on { font-weight: 700; }
        .hsb-react-emoji { font-size: 15px; line-height: 1; }
        .is-small .hsb-react-emoji { font-size: 13px; }

        .hsb-react-picker {
          position: absolute; bottom: calc(100% + 6px); left: 0; z-index: 30;
          display: flex; gap: 2px; padding: 6px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 100px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
        }
        .hsb-react-option {
          position: relative; display: flex; align-items: center; justify-content: center;
          width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
          border: none; background: transparent; transition: transform .12s ease, background .12s ease;
        }
        .hsb-react-option:hover { transform: scale(1.22); background: var(--bg-slate-50); }
        .hsb-react-option.is-on { background: ${TINT.blue}; }
        .hsb-react-option-emoji { font-size: 20px; line-height: 1; }
        .hsb-react-option-label {
          position: absolute; bottom: calc(100% + 4px); left: 50%; transform: translateX(-50%);
          padding: 2px 8px; border-radius: 100px; white-space: nowrap;
          font-size: 10.5px; font-weight: 600; color: #fff; background: rgba(15, 23, 42, 0.9);
          opacity: 0; pointer-events: none; transition: opacity .12s ease;
        }
        .hsb-react-option:hover .hsb-react-option-label { opacity: 1; }
      `}</style>
    </div>
  );
}

/** The stacked emoji + count shown above the action row. */
export function ReactionSummaryChips({
  reactions,
  onClick,
}: {
  reactions: ReactionSummary;
  onClick?: () => void;
}) {
  if (reactions.total === 0) return null;

  const used = REACTION_ORDER.filter((k) => (reactions.counts[k] ?? 0) > 0).slice(0, 3);

  return (
    <button type="button" className="hsb-sum" onClick={onClick} disabled={!onClick}>
      <span className="hsb-sum-emojis">
        {used.map((k) => (
          <span key={k} className="hsb-sum-emoji">
            {REACTION_META[k].emoji}
          </span>
        ))}
      </span>
      <span className="hsb-sum-count">{reactions.total}</span>

      <style jsx>{`
        .hsb-sum {
          display: inline-flex; align-items: center; gap: 6px;
          border: none; background: transparent; padding: 0;
          cursor: ${onClick ? 'pointer' : 'default'};
        }
        .hsb-sum-emojis { display: inline-flex; }
        .hsb-sum-emoji {
          font-size: 13px; line-height: 1; width: 18px; height: 18px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          margin-left: -5px;
        }
        .hsb-sum-emoji:first-child { margin-left: 0; }
        .hsb-sum-count {
          font-size: 12px; font-weight: 500; color: var(--text-slate-500);
        }
        .hsb-sum:hover .hsb-sum-count { color: ${PALETTE.blue}; }
      `}</style>
    </button>
  );
}
