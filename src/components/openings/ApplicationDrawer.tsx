'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Drawer, Empty, Input, Skeleton, Tag } from 'antd';
import { ExternalLink, Save } from 'lucide-react';
import toast from 'react-hot-toast';

import { usePermission } from '@/hooks/usePermission';
import OpeningV2Service, {
  type ApplicationDetail,
  type ApplicationStage,
} from '@/services/openingV2Service';
import { PALETTE, SOURCE_LABELS, STAGE_META, StageChip, fmtDate, fmtDateTime } from './ui';

// One candidate's application: their stage history, the editable intake fields,
// and every other opening they are in play for.
//
// That last part is the point of the drawer — a recruiter about to progress
// someone should know they are already at offer stage on a different role.
export default function ApplicationDrawer({
  open,
  openingId,
  applicationId,
  onClose,
  onChanged,
}: {
  open: boolean;
  openingId: string;
  applicationId: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [pipeline, setPipeline] = useState<
    { openingId: string; openingCode: string; jobTitle: string; stage: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sourceDetail, setSourceDetail] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const detail = await OpeningV2Service.getApplication(openingId, applicationId);
      setApp(detail);
      setSourceDetail(detail.sourceDetail ?? '');
      setResumeUrl(detail.resumeUrl ?? '');
      setNotes(detail.notes ?? '');

      // Other openings this candidate is on. Non-fatal if it fails.
      OpeningV2Service.candidatePipeline(detail.candidateId)
        .then((rows) => setPipeline(rows.filter((r) => r.openingId !== openingId)))
        .catch(() => setPipeline([]));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not load the application');
      onClose();
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openingId, applicationId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const save = async () => {
    if (!applicationId) return;
    setSaving(true);
    try {
      const updated = await OpeningV2Service.updateApplication(openingId, applicationId, {
        sourceDetail: sourceDetail.trim() || null,
        resumeUrl: resumeUrl.trim() || null,
        notes: notes.trim() || null,
      });
      setApp(updated);
      toast.success('Application updated');
      onChanged();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not save the application');
    } finally {
      setSaving(false);
    }
  };

  const dirty =
    !!app &&
    (sourceDetail !== (app.sourceDetail ?? '') ||
      resumeUrl !== (app.resumeUrl ?? '') ||
      notes !== (app.notes ?? ''));

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={560}
      title={app?.candidateName ?? 'Candidate'}
      extra={
        perms.canUpdateOpening && (
          <Button
            type="primary"
            icon={<Save size={14} />}
            loading={saving}
            disabled={!dirty}
            onClick={save}
          >
            Save
          </Button>
        )
      }
    >
      {loading || !app ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="omp-fields" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <div className="omp-field">
              <div className="omp-field-label">Stage</div>
              <div className="omp-field-value">
                <StageChip stage={app.stage} />
              </div>
            </div>
            <div className="omp-field">
              <div className="omp-field-label">Applied</div>
              <div className="omp-field-value">{fmtDate(app.appliedAt)}</div>
            </div>
            <div className="omp-field">
              <div className="omp-field-label">Email</div>
              <div className="omp-field-value">{app.candidateEmail ?? '—'}</div>
            </div>
            <div className="omp-field">
              <div className="omp-field-label">Phone</div>
              <div className="omp-field-value">{app.candidatePhone ?? '—'}</div>
            </div>
            <div className="omp-field">
              <div className="omp-field-label">Current role</div>
              <div className="omp-field-value">{app.candidateCurrentRole ?? '—'}</div>
            </div>
            <div className="omp-field">
              <div className="omp-field-label">Experience</div>
              <div className="omp-field-value">
                {app.candidateExperience !== null ? `${app.candidateExperience} yrs` : '—'}
              </div>
            </div>
            <div className="omp-field is-span">
              <div className="omp-field-label">Source</div>
              <div className="omp-field-value">
                {SOURCE_LABELS[app.source] ?? app.source}
                {app.referredByName ? ` · referred by ${app.referredByName}` : ''}
              </div>
            </div>
            {!!app.candidateSkills?.length && (
              <div className="omp-field is-span">
                <div className="omp-field-label">Skills</div>
                <div className="omp-field-value">
                  {app.candidateSkills.map((s) => (
                    <Tag key={s} className="omp-tag">
                      {s}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {app.rejectionReason && (
              <div className="omp-field is-span">
                <div className="omp-field-label">Rejection reason</div>
                <div className="omp-field-value" style={{ color: PALETTE.red }}>
                  {app.rejectionReason}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="omp-field-label">Source detail</div>
            <Input
              value={sourceDetail}
              onChange={(e) => setSourceDetail(e.target.value)}
              placeholder="Agency, campus, campaign…"
              disabled={!perms.canUpdateOpening}
            />
          </div>

          <div>
            <div className="omp-field-label">Resume submitted for this opening</div>
            <Input
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
              placeholder="https://…"
              disabled={!perms.canUpdateOpening}
              suffix={
                app.resumeUrl ? (
                  <a href={app.resumeUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={13} />
                  </a>
                ) : null
              }
            />
          </div>

          <div>
            <div className="omp-field-label">Notes</div>
            <Input.TextArea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Screening notes, panel feedback…"
              disabled={!perms.canUpdateOpening}
            />
          </div>

          <div>
            <div className="omp-field-label" style={{ marginBottom: 8 }}>
              Also in play for
            </div>
            {pipeline.length === 0 ? (
              <div className="omp-muted" style={{ fontSize: 12 }}>
                Not on any other opening.
              </div>
            ) : (
              <div className="omp-pipeline">
                {pipeline.map((p) => (
                  <button
                    key={p.openingId}
                    className="omp-pipeline-row"
                    onClick={() => {
                      onClose();
                      router.push(`/openings/${p.openingId}`);
                    }}
                  >
                    <span className="omp-code">{p.openingCode}</span>
                    <span className="omp-pipeline-title">{p.jobTitle}</span>
                    <StageChip stage={p.stage as ApplicationStage} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="omp-field-label" style={{ marginBottom: 10 }}>
              Stage history
            </div>
            {app.history.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No movement recorded" />
            ) : (
              <div className="omp-timeline">
                {app.history.map((h, i) => {
                  const meta = STAGE_META[h.toStage];
                  const tone = meta ? PALETTE[meta.tone] : PALETTE.ash;
                  return (
                    <div className="omp-tl-item" key={h.id}>
                      <div className="omp-tl-rail">
                        <span className="omp-tl-dot" style={{ background: tone }} />
                        {i < app.history.length - 1 && <span className="omp-tl-line" />}
                      </div>
                      <div className="omp-tl-body">
                        <div className="omp-tl-title">
                          {h.fromStage ? (
                            <>
                              {STAGE_META[h.fromStage]?.label ?? h.fromStage}
                              <span className="omp-muted"> → </span>
                            </>
                          ) : (
                            <span className="omp-muted">Added at </span>
                          )}
                          <strong style={{ color: tone }}>{meta?.label ?? h.toStage}</strong>
                        </div>
                        <div className="omp-tl-meta">
                          {fmtDateTime(h.changedAt)}
                          {h.changedByName ? ` · ${h.changedByName}` : ''}
                        </div>
                        {h.note && <div className="omp-tl-note">“{h.note}”</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        .omp-pipeline { display: flex; flex-direction: column; gap: 6px; }
        .omp-pipeline-row {
          display: flex; align-items: center; gap: 10px; width: 100%; text-align: left;
          padding: 8px 10px; border: 1px solid var(--border-slate-200); border-radius: 8px;
          background: var(--bg-pure-white); cursor: pointer;
        }
        .omp-pipeline-row:hover { background: var(--bg-slate-50); }
        .omp-pipeline-title {
          flex: 1; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
      `}</style>
    </Drawer>
  );
}
