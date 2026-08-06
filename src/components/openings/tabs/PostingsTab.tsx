'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Button, Empty, Popconfirm, Skeleton, Tooltip } from 'antd';
import { Bot, Globe, Lock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { usePermission } from '@/hooks/usePermission';
import OpeningV2Service, { type OpeningPosting } from '@/services/openingV2Service';
import { PALETTE, TINT, fmtDateTime, relativeDays } from '../ui';

// Phase 4 — the posting history. One row per posting EVENT, so an opening that
// was posted internally, auto-moved, then re-posted shows all three.

export default function PostingsTab({
  openingId,
  onChanged,
}: {
  openingId: string;
  onChanged: () => void;
}) {
  const perms = usePermission() as unknown as Record<string, any>;
  const [postings, setPostings] = useState<OpeningPosting[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPostings(await OpeningV2Service.listPostings(openingId));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not load postings');
    } finally {
      setLoading(false);
    }
  }, [openingId]);

  useEffect(() => {
    load();
  }, [load]);

  const takeDown = async (postingId: string) => {
    try {
      setPostings(await OpeningV2Service.closePosting(openingId, postingId, 'Taken down manually'));
      toast.success('Posting taken down');
      onChanged();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not take the posting down');
    }
  };

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;

  if (postings.length === 0) {
    return (
      <div className="omp-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <>
              <div className="omp-empty-title">Not posted anywhere yet</div>
              <div className="omp-empty-sub">
                An approved opening can be posted internally first, then move to external.
              </div>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {postings.map((p) => {
        const isInternal = p.postingType === 'internal';
        const live = p.status === 'active';
        return (
          <div className="omp-section omp-posting" key={p.id}>
            <div className="omp-posting-icon" style={{ background: TINT.blue, color: PALETTE.blue }}>
              {isInternal ? <Lock size={16} /> : <Globe size={16} />}
            </div>

            <div className="omp-posting-body">
              <div className="omp-posting-head">
                <span className="omp-posting-title">
                  {isInternal ? 'Internal job posting' : 'External job posting'}
                </span>
                <span
                  className="omp-chip"
                  style={{
                    color: live ? PALETTE.green : PALETTE.lightGray,
                    background: live ? TINT.green : TINT.lightGray,
                  }}
                >
                  {p.status}
                </span>
                {p.isAutomated && (
                  <Tooltip title="Created or closed by the scheduled auto-move">
                    <span className="omp-chip" style={{ color: PALETTE.ash, background: TINT.ash }}>
                      <Bot size={11} style={{ marginRight: 4 }} />
                      Automated
                    </span>
                  </Tooltip>
                )}
              </div>

              <div className="omp-posting-meta">
                Posted {fmtDateTime(p.postedAt)}
                {p.postedByName ? ` by ${p.postedByName}` : ''}
              </div>

              {isInternal && p.expiresAt && (
                <div className="omp-posting-meta">
                  Window {live ? 'closes' : 'closed'} {fmtDateTime(p.expiresAt)} (
                  {relativeDays(p.expiresAt)})
                  {live && p.daysRemaining !== null && (
                    <strong style={{ marginLeft: 6, color: PALETTE.blue }}>
                      {p.daysRemaining} day{p.daysRemaining === 1 ? '' : 's'} left
                    </strong>
                  )}
                  {p.autoMove ? ' · auto-moves to external' : ' · no auto-move'}
                </div>
              )}

              {p.closedAt && (
                <div className="omp-posting-meta">
                  {p.movedAt ? 'Handed over' : 'Closed'} {fmtDateTime(p.closedAt)}
                  {p.closedReason ? ` — ${p.closedReason}` : ''}
                </div>
              )}
            </div>

            {live && perms.canUpdateOpening && (
              <Popconfirm
                title="Take this posting down?"
                description="The opening's status is not changed."
                okText="Take down"
                onConfirm={() => takeDown(p.id)}
              >
                <Button size="small" icon={<XCircle size={13} />}>
                  Take down
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      })}

      <style jsx global>{`
        .omp-posting { display: flex; align-items: flex-start; gap: 14px; }
        .omp-posting-icon {
          width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .omp-posting-body { flex: 1; min-width: 0; }
        .omp-posting-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .omp-posting-title { font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
        .omp-posting-meta { font-size: 11.5px; color: var(--text-slate-500); margin-top: 3px; }
      `}</style>
    </div>
  );
}
