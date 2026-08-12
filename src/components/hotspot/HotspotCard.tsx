'use client';

import React from 'react';
import { Button } from 'antd';
import { ArrowUpRight, Briefcase, Building2, Clock, MapPin, Users } from 'lucide-react';
import { OpeningListItem } from '@/services/openingV2Service';
import {
  EMPLOYMENT_TYPE_LABELS,
  PALETTE,
  TINT,
  WORK_MODE_LABELS,
  experienceRange,
  relativeDays,
} from '@/components/openings/ui';
import { useReferenceData } from '@/components/openings/useReferenceData';
import { usePermission } from '@/hooks/usePermission';

// A role on the internal job board.
//
// The card is a summary and an invitation, not the posting: everything here
// answers "is this worth opening?" — title, team, where, how senior, how many
// seats — and the full description lives in the drawer. The whole card is the
// click target; Apply is the one thing that stops propagation, because someone
// aiming for it has already decided.
//
// Work mode gets its own tinted badge because it is the single filter people
// scan for hardest. Under the narrow palette it can only group (green = remote,
// blue = hybrid, ash = office), so the label carries the precision.
const WORK_MODE_TONE: Record<string, { color: string; tint: string }> = {
  remote: { color: PALETTE.green, tint: TINT.green },
  hybrid: { color: PALETTE.blue, tint: TINT.blue },
  office: { color: PALETTE.ash, tint: TINT.ash },
};

export default function HotspotCard({
  opening,
  onApply,
  onClick,
}: {
  opening: OpeningListItem;
  onApply: (e: React.MouseEvent) => void;
  onClick?: () => void;
}) {
  const { canCreateHotspotOpening } = usePermission();
  const reference = useReferenceData(true);
  const resolvedLocation = opening.locationId
    ? reference.locations.find((l) => l.value === opening.locationId)?.label || opening.location
    : opening.location;

  const mode = WORK_MODE_TONE[opening.workMode] ?? WORK_MODE_TONE.office;
  const skills = opening.requiredSkills ?? [];

  return (
    <article
      className="hsj"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Accent rail — the one flash of colour, and it only lights on hover. */}
      <span className="hsj-rail" />

      <div className="hsj-body">
        <header className="hsj-head">
          <div className="hsj-head-text">
            <h3 className="hsj-title">{opening.jobTitle}</h3>
            <div className="hsj-org">
              <Building2 size={13} />
              <span className="hsj-org-name">{opening.clientName || 'Internal'}</span>
              {opening.departmentName && (
                <>
                  <span className="hsj-dot" />
                  <span className="hsj-dept">{opening.departmentName}</span>
                </>
              )}
            </div>
          </div>
          <span className="hsj-open" aria-hidden>
            <ArrowUpRight size={15} />
          </span>
        </header>

        <div className="hsj-badges">
          <span className="hsj-mode" style={{ color: mode.color, background: mode.tint }}>
            {WORK_MODE_LABELS[opening.workMode] ?? opening.workMode}
          </span>
          <span className="hsj-code">{opening.openingCode}</span>
        </div>

        <div className="hsj-meta">
          <span className="hsj-meta-item">
            <MapPin size={13} />
            {resolvedLocation || 'Remote'}
          </span>
          <span className="hsj-meta-item">
            <Briefcase size={13} />
            {experienceRange(opening.minExperience, opening.maxExperience)}
          </span>
          <span className="hsj-meta-item">
            <Clock size={13} />
            {EMPLOYMENT_TYPE_LABELS[opening.employmentType] ?? opening.employmentType}
          </span>
          <span className="hsj-meta-item">
            <Users size={13} />
            {opening.numberOfPositions} seat{opening.numberOfPositions === 1 ? '' : 's'}
          </span>
        </div>

        {skills.length > 0 && (
          <div className="hsj-skills">
            {skills.slice(0, 4).map((skill, i) => (
              <span className="hsj-skill" key={`${skill}-${i}`}>
                {skill}
              </span>
            ))}
            {skills.length > 4 && <span className="hsj-skill is-more">+{skills.length - 4}</span>}
          </div>
        )}
      </div>

      <footer className="hsj-foot">
        <span className="hsj-posted">
          {opening.postedInternallyAt ? `Posted ${relativeDays(opening.postedInternallyAt)}` : ''}
        </span>
        {canCreateHotspotOpening && (
          <Button
            type="primary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onApply(e);
            }}
            className="hsj-apply"
          >
            Apply
          </Button>
        )}
      </footer>

      <style jsx>{`
        .hsj {
          position: relative;
          display: flex;
          flex-direction: column;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            transform 0.15s ease;
        }
        .hsj:hover {
          border-color: ${PALETTE.blue}55;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
          transform: translateY(-2px);
        }
        .hsj:focus-visible {
          outline: 2px solid ${PALETTE.blue};
          outline-offset: 2px;
        }

        .hsj-rail {
          position: absolute;
          inset: 0 auto 0 0;
          width: 3px;
          background: linear-gradient(180deg, ${PALETTE.blue}, ${PALETTE.green});
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .hsj:hover .hsj-rail {
          opacity: 1;
        }

        .hsj-body {
          flex: 1;
          padding: 16px 18px 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hsj-head {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .hsj-head-text {
          flex: 1;
          min-width: 0;
        }
        .hsj-title {
          margin: 0 0 5px;
          font-size: 16px;
          font-weight: 700;
          line-height: 1.3;
          letter-spacing: -0.015em;
          color: var(--text-slate-900);
        }
        .hsj-org {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-slate-500);
        }
        .hsj-org-name,
        .hsj-dept {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .hsj-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--border-slate-200);
          flex-shrink: 0;
        }
        /* The open affordance sits quiet until the card is hovered. */
        .hsj-open {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 8px;
          flex-shrink: 0;
          color: var(--text-slate-400);
          background: var(--bg-slate-50);
          transition:
            color 0.15s ease,
            background 0.15s ease;
        }
        .hsj:hover .hsj-open {
          color: ${PALETTE.blue};
          background: ${TINT.blue};
        }

        .hsj-badges {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .hsj-mode {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
          border-radius: 100px;
          letter-spacing: 0.01em;
        }
        .hsj-code {
          font-size: 10.5px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          color: var(--text-slate-400);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          font-variant-numeric: tabular-nums;
        }

        /* Two columns so the four facts line up as a block the eye can scan,
           rather than a ragged wrapped row. */
        .hsj-meta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 12px;
        }
        .hsj-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text-slate-700);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hsj-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .hsj-skill {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          padding: 3px 9px;
          border-radius: 100px;
        }
        .hsj-skill.is-more {
          color: var(--text-slate-400);
        }

        .hsj-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 18px;
          border-top: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50);
        }
        .hsj-posted {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-400);
        }
      `}</style>
    </article>
  );
}
