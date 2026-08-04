'use client';

import React from 'react';
import { Empty } from 'antd';
import { BadgeCheck, Check, Clock, MinusCircle, X } from 'lucide-react';
import type {
  ApprovalStatus,
  OpeningApproval,
  OpeningApprovalState,
} from '@/services/openingV2Service';
import { APPROVER_TYPE_LABELS, PALETTE, fmtDateTime } from '../ui';

// The approval trail, newest round first. Each round is the snapshot taken when
// the opening was submitted — re-submission after a rejection opens a new round
// and the old one is kept, which is why this renders as a list of rounds rather
// than a single chain.

const STATUS_ICON: Record<ApprovalStatus, React.ReactNode> = {
  pending: <Clock size={13} />,
  approved: <Check size={13} />,
  rejected: <X size={13} />,
  skipped: <MinusCircle size={13} />,
  cancelled: <MinusCircle size={13} />,
};

const STATUS_TONE: Record<ApprovalStatus, string> = {
  pending: PALETTE.blue,
  approved: PALETTE.green,
  rejected: PALETTE.red,
  skipped: PALETTE.lightGray,
  cancelled: PALETTE.lightGray,
};

function approverLabel(step: OpeningApproval): string {
  if (step.approverName) return step.approverName;
  if (step.roleName) return `Anyone with the ${step.roleName} role`;
  if (step.fallbackUserName) return `${step.fallbackUserName} (fallback)`;
  return APPROVER_TYPE_LABELS[step.approverType] ?? step.approverType;
}

export default function ApprovalsTab({ state }: { state: OpeningApprovalState | null }) {
  if (!state || state.rounds.length === 0) {
    return (
      <div className="omp-empty">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <>
              <div className="omp-empty-title">Not submitted for approval yet</div>
              <div className="omp-empty-sub">
                Submitting a draft opening materialises the approval chain here.
              </div>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div>
      {state.rounds.map((round) => (
        <div className="omp-section" key={round.round}>
          <div className="omp-section-head">
            <div>
              <div className="omp-section-title">
                Round {round.round}
                {round.round === state.opening.approvalRound && state.currentStep && (
                  <span className="omp-round-live">In progress</span>
                )}
              </div>
              <div className="omp-section-sub">
                {round.steps.length} step{round.steps.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          <div className="omp-steps">
            {round.steps.map((step, i) => {
              const tone = STATUS_TONE[step.status];
              const isCurrent = state.currentStep?.id === step.id;
              return (
                <div key={step.id} className={`omp-step${isCurrent ? ' is-current' : ''}`}>
                  <div className="omp-step-rail">
                    <span className="omp-step-dot" style={{ background: `${tone}1a`, color: tone }}>
                      {STATUS_ICON[step.status]}
                    </span>
                    {i < round.steps.length - 1 && <span className="omp-step-line" />}
                  </div>

                  <div className="omp-step-body">
                    <div className="omp-step-head">
                      <span className="omp-step-name">{step.stepName}</span>
                      {step.isOptional && <span className="omp-step-flag">Optional</span>}
                      <span className="omp-step-status" style={{ color: tone }}>
                        {step.status}
                      </span>
                    </div>
                    <div className="omp-step-meta">{approverLabel(step)}</div>
                    {step.decidedAt && (
                      <div className="omp-step-meta">
                        {step.status} by {step.decidedByName ?? 'someone'} ·{' '}
                        {fmtDateTime(step.decidedAt)}
                        {step.decidedAsAdmin && ' · admin override'}
                      </div>
                    )}
                    {step.decisionNote && (
                      <div className="omp-step-note">“{step.decisionNote}”</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <style jsx global>{`
        .omp-round-live {
          margin-left: 8px; font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: ${PALETTE.blue}; background: rgba(59,130,246,0.10);
          border-radius: 5px; padding: 1px 6px;
        }
        .omp-steps { display: flex; flex-direction: column; }
        .omp-step { display: flex; gap: 12px; }
        .omp-step.is-current .omp-step-name { color: ${PALETTE.blue}; }
        .omp-step-rail { display: flex; flex-direction: column; align-items: center; }
        .omp-step-dot {
          width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0;
        }
        .omp-step-line { flex: 1; width: 1px; background: var(--border-slate-200); margin: 2px 0; }
        .omp-step-body { padding-bottom: 16px; min-width: 0; flex: 1; }
        .omp-step-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .omp-step-name { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); }
        .omp-step-flag {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-slate-400); border: 1px solid var(--border-slate-200);
          border-radius: 4px; padding: 0 5px;
        }
        .omp-step-status {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          margin-left: auto;
        }
        .omp-step-meta { font-size: 11.5px; color: var(--text-slate-500); margin-top: 2px; }
        .omp-step-note {
          font-size: 11.5px; color: var(--text-slate-600); margin-top: 6px; padding: 6px 10px;
          background: var(--bg-slate-50); border-radius: 6px; border: 1px solid var(--border-slate-100);
        }
      `}</style>
    </div>
  );
}
