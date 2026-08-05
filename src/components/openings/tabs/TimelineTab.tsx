'use client';

import React from 'react';
import { Empty, Tooltip } from 'antd';
import { Bot } from 'lucide-react';
import type { StatusHistoryEntry } from '@/services/openingV2Service';
import { PALETTE, STATUS_META, fmtDateTime, humanize } from '../ui';

// One timeline for the whole opening: creation, approval moves, posting moves
// and manual status changes all land in the same append-only history on the
// backend, so this is the complete story rather than one phase's slice.
export default function TimelineTab({ history }: { history: StatusHistoryEntry[] }) {
  if (!history?.length) {
    return (
      <div className="omp-empty">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No activity recorded yet" />
      </div>
    );
  }

  return (
    <div className="omp-section">
      <div className="omp-timeline">
        {history.map((h, i) => {
          const meta = STATUS_META[h.toStatus];
          const tone = meta ? PALETTE[meta.tone] : PALETTE.ash;
          return (
            <div className="omp-tl-item" key={h.id}>
              <div className="omp-tl-rail">
                <span className="omp-tl-dot" style={{ background: tone }} />
                {i < history.length - 1 && <span className="omp-tl-line" />}
              </div>
              <div className="omp-tl-body">
                <div className="omp-tl-head">
                  <span className="omp-tl-title">
                    {h.fromStatus ? (
                      <>
                        {STATUS_META[h.fromStatus]?.label ?? humanize(h.fromStatus)}
                        <span className="omp-muted"> → </span>
                      </>
                    ) : (
                      <span className="omp-muted">Created as </span>
                    )}
                    <strong style={{ color: tone }}>{meta?.label ?? humanize(h.toStatus)}</strong>
                  </span>
                  {h.isAutomated && (
                    <Tooltip title="Made by a scheduled job, not a person">
                      <Bot size={12} style={{ color: PALETTE.lightGray }} />
                    </Tooltip>
                  )}
                </div>
                <div className="omp-tl-meta">
                  {fmtDateTime(h.changedAt)}
                  {h.changedByName ? ` · ${h.changedByName}` : ''}
                  {h.reason ? ` · ${humanize(h.reason)}` : ''}
                </div>
                {h.note && <div className="omp-tl-note">“{h.note}”</div>}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        .omp-timeline { display: flex; flex-direction: column; }
        .omp-tl-item { display: flex; gap: 12px; }
        .omp-tl-rail { display: flex; flex-direction: column; align-items: center; width: 12px; }
        .omp-tl-dot { width: 9px; height: 9px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
        .omp-tl-line { flex: 1; width: 1px; background: var(--border-slate-200); margin: 3px 0; }
        .omp-tl-body { padding-bottom: 18px; flex: 1; min-width: 0; }
        .omp-tl-head { display: flex; align-items: center; gap: 8px; }
        .omp-tl-title { font-size: 12.5px; color: var(--text-slate-700); }
        .omp-tl-meta { font-size: 11.5px; color: var(--text-slate-400); margin-top: 2px; }
        .omp-tl-note {
          font-size: 11.5px; color: var(--text-slate-600); margin-top: 6px; padding: 6px 10px;
          background: var(--bg-slate-50); border-radius: 6px; border: 1px solid var(--border-slate-100);
        }
      `}</style>
    </div>
  );
}
