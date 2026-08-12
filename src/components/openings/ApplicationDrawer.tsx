'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Drawer, Empty, Input, Skeleton, Tag, Tooltip } from 'antd';
import { ExternalLink, Save, Mail, Phone, Briefcase, Star, Code, AlertTriangle, ArrowRightCircle, Activity, Calendar } from 'lucide-react';

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
  const { message } = App.useApp();
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
      message.error(err?.response?.data?.error || 'Could not load the application');
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
      message.success('Application updated');
      onChanged();
    } catch (err: any) {
      message.error(err?.response?.data?.error || 'Could not save the application');
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
      width={600}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm border border-blue-200 dark:border-blue-800/50">
            {app?.candidateName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'C'}
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-slate-900 dark:text-slate-100">{app?.candidateName ?? 'Candidate'}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Application Profile</span>
          </div>
        </div>
      }
      extra={
        perms.canUpdateOpening && (
          <Button
            type="primary"
            icon={<Save size={14} />}
            loading={saving}
            disabled={!dirty}
            onClick={save}
            className="font-semibold shadow-sm"
          >
            Save Changes
          </Button>
        )
      }
      styles={{
        header: { borderBottom: '1px solid var(--border-slate-200)', padding: '16px 24px' },
        body: { padding: '24px', background: 'var(--bg-slate-50)' }
      }}
    >
      {loading || !app ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Quick Stats / Overview Card */}
          <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Activity size={13} /> Current Stage
                </div>
                <div><StageChip stage={app.stage} /></div>
              </div>
              
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Calendar size={13} /> Applied On
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{fmtDate(app.appliedAt)}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Mail size={13} /> Email Address
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{app.candidateEmail ?? '—'}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Phone size={13} /> Phone Number
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{app.candidatePhone ?? '—'}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Briefcase size={13} /> Current Role
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{app.candidateCurrentRole ?? '—'}</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <Star size={13} /> Experience
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {app.candidateExperience !== null ? `${app.candidateExperience} yrs` : '—'}
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                  <ArrowRightCircle size={13} /> Source
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {SOURCE_LABELS[app.source] ?? app.source}
                  {app.referredByName ? <span className="text-slate-500 ml-1">· referred by {app.referredByName}</span> : ''}
                </div>
              </div>

              {!!app.candidateSkills?.length && (
                <div className="col-span-2">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                    <Code size={13} /> Skills
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {app.candidateSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-slate-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {app.rejectionReason && (
                <div className="col-span-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-lg p-3">
                  <div className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={13} /> Rejection Reason
                  </div>
                  <div className="text-sm font-medium text-red-700 dark:text-red-300">
                    {app.rejectionReason}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Fields */}
          <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Source Detail</label>
              <Input
                value={sourceDetail}
                onChange={(e) => setSourceDetail(e.target.value)}
                placeholder="Agency, campus, campaign…"
                disabled={!perms.canUpdateOpening}
                className="rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Resume URL</label>
              <Input
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                placeholder="https://…"
                disabled={!perms.canUpdateOpening}
                className="rounded-md"
                suffix={
                  app.resumeUrl ? (
                    <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-600">
                      <ExternalLink size={14} />
                    </a>
                  ) : null
                }
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notes</label>
              <Input.TextArea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Screening notes, panel feedback…"
                disabled={!perms.canUpdateOpening}
                className="rounded-md"
              />
            </div>
          </div>

          {/* Also in play for */}
          <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              Also in play for
            </div>
            {pipeline.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                Not on any other opening.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pipeline.map((p) => (
                  <button
                    key={p.openingId}
                    className="flex items-center gap-3 w-full text-left p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-[#0B0F1A] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    onClick={() => {
                      onClose();
                      router.push(`/openings/${p.openingId}`);
                    }}
                  >
                    <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded">
                      {p.openingCode}
                    </div>
                    <div className="flex-1 font-semibold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {p.jobTitle}
                    </div>
                    <StageChip stage={p.stage as ApplicationStage} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stage History Timeline */}
          <div className="bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
              Stage History
            </div>
            {app.history.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No movement recorded" className="my-4" />
            ) : (
              <div className="relative pl-3">
                {app.history.map((h, i) => {
                  const meta = STAGE_META[h.toStage];
                  const tone = meta ? PALETTE[meta.tone] : PALETTE.ash;
                  const isLast = i === app.history.length - 1;
                  
                  return (
                    <div className="flex gap-4 relative pb-5" key={h.id}>
                      {!isLast && (
                        <div className="absolute top-5 left-1.5 w-px h-full bg-slate-200 dark:bg-slate-700 -translate-x-1/2"></div>
                      )}
                      <div 
                        className="w-3 h-3 rounded-full mt-1.5 relative z-10 flex-shrink-0 shadow-sm border-2 border-white dark:border-[#0B0F1A]" 
                        style={{ backgroundColor: tone }}
                      ></div>
                      <div className="flex-1 flex flex-col">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {h.fromStage ? (
                            <>
                              <span className="text-slate-500 font-normal">{STAGE_META[h.fromStage]?.label ?? h.fromStage}</span>
                              <span className="text-slate-400 mx-1.5">→</span>
                            </>
                          ) : (
                            <span className="text-slate-500 font-normal mr-1.5">Added at</span>
                          )}
                          <span style={{ color: tone }} className="font-bold">{meta?.label ?? h.toStage}</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {fmtDateTime(h.changedAt)}
                          {h.changedByName ? ` · ${h.changedByName}` : ''}
                        </div>
                        {h.note && (
                          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-2.5 rounded-lg italic">
                            “{h.note}”
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
