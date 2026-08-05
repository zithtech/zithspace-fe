'use client';

import React from 'react';
import { Tag } from 'antd';
import { Star } from 'lucide-react';
import type { OpeningDetail } from '@/services/openingV2Service';
import {
  EMPLOYMENT_TYPE_LABELS,
  Field,
  HIRING_TYPE_LABELS,
  MEMBER_TYPE_LABELS,
  PALETTE,
  TagList,
  VISIBILITY_LABELS,
  WORK_MODE_LABELS,
  experienceRange,
  fmtDate,
  salaryRange,
} from '../ui';

// Read-only view of everything Phase 1 captured.
export default function OverviewTab({ opening: o }: { opening: OpeningDetail }) {
  return (
    <div>
      <div className="omp-section">
        <div className="omp-section-head">
          <div>
            <div className="omp-section-title">Job details</div>
            <div className="omp-section-sub">What the role is and who it is for</div>
          </div>
        </div>

        <div className="omp-fields">
          <Field label="Employment type">
            {EMPLOYMENT_TYPE_LABELS[o.employmentType] ?? o.employmentType}
          </Field>
          <Field label="Work mode">{WORK_MODE_LABELS[o.workMode] ?? o.workMode}</Field>
          <Field label="Positions">{o.numberOfPositions}</Field>

          <Field label="Experience">{experienceRange(o.minExperience, o.maxExperience)}</Field>
          <Field label="Salary">
            {salaryRange(o.salaryMin, o.salaryMax, o.salaryCurrency, o.salaryPeriod)}
          </Field>
          <Field label="Budget">
            {o.budget !== null ? salaryRange(o.budget, null, o.salaryCurrency) : '—'}
          </Field>

          <Field label="Notice period">
            {o.noticePeriodDays !== null ? `${o.noticePeriodDays} days` : '—'}
          </Field>
          <Field label="Shift timing">{o.shiftTiming ?? '—'}</Field>
          <Field label="Joining timeline">
            {o.joiningTimeline ?? '—'}
            {o.targetJoiningDate ? ` · target ${fmtDate(o.targetJoiningDate)}` : ''}
          </Field>

          <Field label="Required skills" span>
            <TagList items={o.requiredSkills} empty="None specified" />
          </Field>
          <Field label="Preferred skills" span>
            <TagList items={o.preferredSkills} empty="None specified" />
          </Field>

          <Field label="Education">{o.education ?? '—'}</Field>
          <Field label="Certifications" span>
            <TagList items={o.certifications} empty="None specified" />
          </Field>

          {o.jobDescription && (
            <Field label="Job description" span>
              <div className="omp-longtext">{o.jobDescription}</div>
            </Field>
          )}
          {o.responsibilities && (
            <Field label="Responsibilities" span>
              <div className="omp-longtext">{o.responsibilities}</div>
            </Field>
          )}
        </div>
      </div>

      <div className="omp-section">
        <div className="omp-section-head">
          <div>
            <div className="omp-section-title">Linked to</div>
            <div className="omp-section-sub">Where this opening sits in the organisation</div>
          </div>
        </div>

        <div className="omp-fields">
          <Field label="Client / Account">{o.clientName ?? '—'}</Field>
          <Field label="Project">{o.projectName ?? '—'}</Field>
          <Field label="Department">{o.departmentName ?? '—'}</Field>
          <Field label="Sub-department">{o.subDepartmentName ?? '—'}</Field>
          <Field label="Hiring manager">{o.hiringManagerName ?? '—'}</Field>
          <Field label="Location">{o.location ?? '—'}</Field>
          <Field label="Priority">{o.priority}</Field>
          <Field label="Hiring type">
            {o.hiringType ? HIRING_TYPE_LABELS[o.hiringType] ?? o.hiringType : '—'}
          </Field>
          <Field label="Visibility">{VISIBILITY_LABELS[o.visibility] ?? o.visibility}</Field>
        </div>
      </div>

      <div className="omp-two-col">
        <div className="omp-section">
          <div className="omp-section-head">
            <div>
              <div className="omp-section-title">Recruiters</div>
              <div className="omp-section-sub">{o.recruiters.length} assigned</div>
            </div>
          </div>
          {o.recruiters.length === 0 ? (
            <div className="omp-muted">No recruiters assigned yet.</div>
          ) : (
            <div className="omp-people">
              {o.recruiters.map((r) => (
                <div key={r.id} className="omp-person">
                  <span className="omp-person-name">{r.recruiterName ?? r.recruiterId}</span>
                  {r.isPrimary && (
                    <Star size={12} fill={PALETTE.blue} color={PALETTE.blue} />
                  )}
                  {r.recruiterEmail && (
                    <span className="omp-person-meta">{r.recruiterEmail}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="omp-section">
          <div className="omp-section-head">
            <div>
              <div className="omp-section-title">Hiring team</div>
              <div className="omp-section-sub">{o.hiringTeam.length} member(s)</div>
            </div>
          </div>
          {o.hiringTeam.length === 0 ? (
            <div className="omp-muted">No hiring team set up yet.</div>
          ) : (
            <div className="omp-people">
              {o.hiringTeam.map((m) => (
                <div key={m.id} className="omp-person">
                  <span className="omp-person-name">{m.memberName ?? m.memberId}</span>
                  <Tag className="omp-tag">
                    {MEMBER_TYPE_LABELS[m.memberType] ?? m.memberType}
                  </Tag>
                  {m.memberEmail && <span className="omp-person-meta">{m.memberEmail}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="omp-section">
        <div className="omp-section-head">
          <div>
            <div className="omp-section-title">Required documents</div>
            <div className="omp-section-sub">What candidates must supply</div>
          </div>
        </div>
        {o.requiredDocuments.length === 0 ? (
          <div className="omp-muted">No documents required.</div>
        ) : (
          <div className="omp-docs">
            {o.requiredDocuments.map((d) => (
              <div key={d.id} className="omp-doc">
                <span className="omp-doc-name">{d.documentName}</span>
                <span
                  className="omp-chip"
                  style={{
                    color: d.isMandatory ? PALETTE.blue : PALETTE.lightGray,
                    background: d.isMandatory
                      ? 'rgba(59,130,246,0.10)'
                      : 'rgba(148,163,184,0.12)',
                  }}
                >
                  {d.isMandatory ? 'Mandatory' : 'Optional'}
                </span>
                {d.notes && <span className="omp-person-meta">{d.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .omp-longtext { white-space: pre-wrap; line-height: 1.6; color: var(--text-slate-700); }
        .omp-two-col { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        @media (max-width: 900px) { .omp-two-col { grid-template-columns: 1fr; } }
        .omp-people { display: flex; flex-direction: column; gap: 8px; }
        .omp-person { display: flex; align-items: center; gap: 8px; font-size: 12.5px; flex-wrap: wrap; }
        .omp-person-name { font-weight: 600; color: var(--text-slate-900); }
        .omp-person-meta { font-size: 11.5px; color: var(--text-slate-400); }
        .omp-docs { display: flex; flex-wrap: wrap; gap: 10px; }
        .omp-doc {
          display: flex; align-items: center; gap: 8px; padding: 6px 10px;
          border: 1px solid var(--border-slate-200); background: var(--bg-slate-50); border-radius: 8px;
        }
        .omp-doc-name { font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); }
      `}</style>
    </div>
  );
}
