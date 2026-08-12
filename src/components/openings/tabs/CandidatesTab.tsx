'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  Empty,
  Input,
  Modal,
  message,
  Skeleton,
  Table,
  Tooltip,
} from 'antd';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import type { ColumnsType } from 'antd/es/table';
import { ChevronDown, Plus, Trash2, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { usePermission } from '@/hooks/usePermission';
import { PipelineService } from '@/services/pipelineService';
import { MembersService } from '@/services/membersService';
import OpeningV2Service, {
  type ApplicationFunnel,
  type ApplicationStage,
  type IntakeCatalog,
  type IntakeSource,
  type OpeningApplication,
} from '@/services/openingV2Service';
import ApplicationDrawer from '../ApplicationDrawer';
import {
  PALETTE,
  SOURCE_LABELS,
  STAGE_META,
  STAGE_ORDER,
  StageChip,
  TINT,
  fmtDate,
} from '../ui';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

// Phase 5 — the candidate pipeline for one opening.
//
// Candidates are NOT created here: the platform already owns a candidates table,
// so this links an existing candidate to the opening and tracks their stage. The
// picker therefore lists existing candidates and says so when there are none.

const TERMINAL_STAGES: ApplicationStage[] = ['hired', 'rejected', 'withdrawn'];

export default function CandidatesTab({
  openingId,
  opening,
  onChanged,
}: {
  openingId: string;
  opening?: any;
  onChanged: () => void;
}) {
  const perms = usePermission() as unknown as Record<string, any>;

  const [rows, setRows] = useState<OpeningApplication[]>([]);
  const [funnel, setFunnel] = useState<ApplicationFunnel | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<ApplicationStage[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [candidates, setCandidates] = useState<{ value: string; label: string; description?: string; role?: string }[]>([]);
  const [people, setPeople] = useState<{ value: string; label: string }[]>([]);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [source, setSource] = useState<IntakeSource>('careers_page');
  const [sourceDetail, setSourceDetail] = useState('');
  const [referredBy, setReferredBy] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  // The intake channels come from the backend so a new source added server-side
  // shows up here without a frontend release.
  const [catalog, setCatalog] = useState<IntakeCatalog | null>(null);
  const [openApplicationId, setOpenApplicationId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, f] = await Promise.all([
        OpeningV2Service.listApplications(openingId, {
          pageSize: 200,
          search: search || undefined,
          stage: stageFilter.length ? stageFilter : undefined,
        }),
        OpeningV2Service.getFunnel(openingId),
      ]);
      setRows(list.items);
      setFunnel(f);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not load candidates');
    } finally {
      setLoading(false);
    }
  }, [openingId, search, stageFilter]);

  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  // The picker lists only candidates not already on this opening — the backend
  // rejects duplicates, so offering them would just produce an error.
  useEffect(() => {
    OpeningV2Service.intakeCatalog()
      .then(setCatalog)
      .catch(() => setCatalog(null));
  }, []);

  useEffect(() => {
    if (!addOpen || candidates.length) return;
    (async () => {
      try {
        const [candsRes, members] = await Promise.all([
          PipelineService.listCandidates({ limit: 500 }),
          MembersService.getMembers({ limit: 500 } as any).catch(() => ({ data: [] } as any)),
        ]);
        const candsList = candsRes.data?.candidates || [];
        setCandidates(
          candsList.map((c: any) => ({
            value: c.id,
            label: c.name ?? 'Candidate',
            description: c.role ? `${c.role} • ${c.email}` : c.email,
            role: c.role,
          }))
        );
        const list = Array.isArray(members) ? members : (members as any)?.data ?? [];
        setPeople(list.map((m: any) => ({ value: m.id, label: m.name })));
      } catch {
        toast.error('Could not load the candidate list');
      }
    })();
  }, [addOpen, candidates.length]);

  const sourceOptions = useMemo(
    () =>
      catalog?.sources?.length
        ? catalog.sources.map((s) => ({ value: s.value, label: s.label }))
        : Object.entries(SOURCE_LABELS).map(([value, label]) => ({ value, label })),
    [catalog]
  );

  const sourceMeta = useMemo(
    () => catalog?.sources?.find((s) => s.value === source),
    [catalog, source]
  );

  const availableCandidates = useMemo(() => {
    let list = candidates.filter((c) => !rows.some((r) => r.candidateId === c.value));
    if (opening?.jobTitle) {
      const targetRole = opening.jobTitle.toLowerCase();
      // Filter candidates to only those whose applied role matches the opening's job title
      list = list.filter((c) => c.role && c.role.toLowerCase() === targetRole);
    }
    return list;
  }, [candidates, rows, opening?.jobTitle]);

  const addCandidate = async () => {
    if (!candidateId) {
      toast.error('Pick a candidate');
      return;
    }
    if (sourceMeta?.requiresReferrer && !referredBy) {
      toast.error('An employee referral needs a referrer');
      return;
    }
    if (sourceMeta?.requiresDetail && !sourceDetail.trim()) {
      toast.error('Describe the source');
      return;
    }

    setAdding(true);
    try {
      await OpeningV2Service.addApplication(openingId, {
        pipelineCandidateId: candidateId,
        source,
        sourceDetail: sourceDetail.trim() || null,
        referredBy: referredBy || null,
      });
      toast.success('Candidate added to the opening');
      setAddOpen(false);
      setCandidateId(null);
      setSourceDetail('');
      setReferredBy(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not add the candidate');
    } finally {
      setAdding(false);
    }
  };

  const moveStage = async (app: OpeningApplication, stage: ApplicationStage) => {
    const needsReason = stage === 'rejected';
    let note = '';

    const doMove = async () => {
      try {
        const result = await OpeningV2Service.changeStage(openingId, app.id, {
          stage,
          note: note || null,
          rejectionReason: needsReason ? note : null,
        });
        toast.success(`${app.candidateName ?? 'Candidate'} moved to ${STAGE_META[stage].label}`);
        if (result.positionsFilled) {
          toast(`All ${result.openPositions} position(s) are filled — this opening can be closed.`, {
            icon: '🎯',
          });
        }
        if (result.openingStatusChangedTo) {
          onChanged();
        }
        load();
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Could not move the candidate');
      }
    };

    if (needsReason) {
      Modal.confirm({
        title: `Reject ${app.candidateName ?? 'this candidate'}?`,
        icon: null,
        content: (
          <Input.TextArea
            rows={3}
            placeholder="Reason for rejection (required)"
            onChange={(e) => {
              note = e.target.value;
            }}
          />
        ),
        okText: 'Reject',
        okButtonProps: { danger: true },
        onOk: async () => {
          if (!note.trim()) {
            toast.error('A rejection reason is required');
            throw new Error('reason required');
          }
          await doMove();
        },
      });
      return;
    }
    await doMove();
  };

  const remove = async (app: OpeningApplication) => {
    try {
      await OpeningV2Service.removeApplication(openingId, app.id);
      toast.success('Candidate removed from the opening');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Could not remove the candidate');
    }
  };

  const columns: ColumnsType<OpeningApplication> = [
    {
      title: 'Candidate',
      width: 220,
      render: (_: any, r) => (
        <div className="omp-title-cell">
          <span className="omp-title-main">{r.candidateName ?? r.candidateId}</span>
          <span className="omp-title-sub">{r.candidateEmail ?? '—'}</span>
        </div>
      ),
    },
    {
      title: 'Stage',
      dataIndex: 'stage',
      width: 120,
      render: (s: ApplicationStage) => <StageChip stage={s} />,
    },
    {
      title: 'Source',
      width: 170,
      render: (_: any, r) => (
        <span>
          {SOURCE_LABELS[r.source] ?? r.source}
          {r.sourceDetail && <span className="omp-muted"> · {r.sourceDetail}</span>}
          {r.referredByName && <span className="omp-muted"> · by {r.referredByName}</span>}
        </span>
      ),
    },
    {
      title: 'Experience',
      width: 100,
      render: (_: any, r) =>
        r.candidateExperience !== null ? `${r.candidateExperience} yrs` : '—',
    },
    {
      title: 'Current role',
      dataIndex: 'candidateCurrentRole',
      width: 160,
      render: (v: string | null) => v ?? <span className="omp-muted">—</span>,
    },
    { title: 'Applied', width: 110, render: (_: any, r) => fmtDate(r.appliedAt) },
    {
      title: '',
      key: 'actions',
      width: 150,
      fixed: 'right',
      onCell: () => ({
        // The row navigates on click; the actions cell must not. Stopping at the
        // <td> covers the padding around the buttons too, which a wrapper <div>
        // does not — a click landing there used to navigate instead of acting.
        onClick: (e: React.MouseEvent) => e.stopPropagation(),
      }),
      render: (_: any, r) => {
        if (!perms.canUpdateOpening) return null;
        const terminal = TERMINAL_STAGES.includes(r.stage);
        return (
          // Row click opens the drawer — the action buttons must not trigger it.
          <div
            style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}
            onClick={(e) => e.stopPropagation()}
          >
            {!terminal && (
              <SearchableDropdown
                options={STAGE_ORDER.filter((s) => s !== r.stage).map((s) => ({
                  value: s,
                  label: STAGE_META[s].label,
                  disabled: false,
                }))}
                value={null}
                onChange={(val) => {
                  const stage = val as ApplicationStage;
                  if (stage) moveStage(r, stage);
                }}
                searchPlaceholder="Search stages..."
                customTrigger={
                  <Button size="small">
                    Move <ChevronDown size={12} />
                  </Button>
                }
              />
            )}
            <ConfirmDialog
              tone="danger"
              icon={<Trash2 size={18} />}
              title="Remove from this opening?"
              description="The candidate record itself is kept."
              confirmText="Remove"
              onConfirm={() => remove(r)}
            >
              <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
            </ConfirmDialog>
          </div>
        );
      },
    },
  ];

  if (loading && !funnel) return <Skeleton active paragraph={{ rows: 5 }} />;

  return (
    <div>
      {funnel && (
        <div className="omp-funnel">
          {[
            { label: 'Open Positions', value: funnel.openPositions, tone: 'ash' as const },
            { label: 'Applications', value: funnel.applications, tone: 'blue' as const },
            { label: 'Screened', value: funnel.screened, tone: 'blue' as const },
            { label: 'Interview', value: funnel.interview, tone: 'blue' as const },
            { label: 'Offers', value: funnel.offers, tone: 'blue' as const },
            { label: 'Joined', value: funnel.joined, tone: 'green' as const },
            { label: 'Rejected', value: funnel.rejected, tone: 'red' as const },
          ].map((s) => (
            <div className="omp-funnel-cell" key={s.label}>
              <div className="omp-funnel-value" style={{ color: PALETTE[s.tone] }}>
                {s.value}
              </div>
              <div className="omp-funnel-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="omp-filters">
        <Input.Search
          allowClear
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 240 }}
        />
        <SearchableDropdown
          mode="multiple"
          value={stageFilter}
          onChange={(v: any) => setStageFilter(v ?? [])}
          options={STAGE_ORDER.map((s) => ({ value: s, label: STAGE_META[s].label }))}
          placeholder="Stage"
          itemNoun="stages"
          hideAvatar
          width={220}
          style={{ minWidth: 140 }}
        />
        {perms.canUpdateOpening && (
          <Button
            type="primary"
            icon={<UserPlus size={14} />}
            onClick={() => setAddOpen(true)}
            style={{ marginLeft: 'auto' }}
          >
            Add candidate
          </Button>
        )}
      </div>

      <div className="omp-table-wrap">
        <ZukvoLoadingOverlay loading={loading} message="">
          <Table<OpeningApplication>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={rows}
            scroll={{ x: 1100 }}
            pagination={false}
            onRow={(record) => ({ onClick: () => setOpenApplicationId(record.id) })}
            locale={{
              emptyText: (
                <div className="omp-empty">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <>
                        <div className="omp-empty-title">No candidates yet</div>
                        <div className="omp-empty-sub">
                          Add an existing candidate to start the pipeline.
                        </div>
                      </>
                    }
                  />
                </div>
              ),
            }}
          />
        </ZukvoLoadingOverlay>
      </div>

      <ApplicationDrawer
        open={!!openApplicationId}
        openingId={openingId}
        applicationId={openApplicationId}
        onClose={() => setOpenApplicationId(null)}
        onChanged={load}
      />

      <Modal
        open={addOpen}
        onCancel={() => setAddOpen(false)}
        onOk={addCandidate}
        confirmLoading={adding}
        okText="Add to opening"
        title="Add a candidate"
        width={480}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
          <div>
            <div className="omp-field-label">Candidate</div>
            <SearchableDropdown
              value={candidateId}
              onChange={(v: any) => setCandidateId(v)}
              options={availableCandidates}
              placeholder="Search candidates…"
              itemNoun="candidates"
              width={400}
              style={{ width: '100%' }}
              emptyComponent={
                <div style={{ padding: 16, fontSize: 12, color: 'var(--text-slate-400)' }}>
                  No candidates available. Create the candidate record first, then add them here.
                </div>
              }
            />
          </div>

          <div>
            <div className="omp-field-label">Source</div>
            <SearchableDropdown
              value={source}
              onChange={(v: any) => setSource(v)}
              options={sourceOptions}
              hideAvatar
              allowClear={false}
              width={400}
              style={{ width: '100%' }}
            />
          </div>

          {sourceMeta?.requiresReferrer && (
            <div>
              <div className="omp-field-label">Referred by</div>
              <SearchableDropdown
                value={referredBy}
                onChange={(v: any) => setReferredBy(v)}
                options={people}
                placeholder="Who referred them?"
                itemNoun="people"
                width={400}
                style={{ width: '100%' }}
              />
            </div>
          )}

          <div>
            <div className="omp-field-label">
              {sourceMeta?.detailLabel ?? 'Source detail'}
              {sourceMeta?.requiresDetail ? '' : ' (optional)'}
            </div>
            <Input
              value={sourceDetail}
              onChange={(e) => setSourceDetail(e.target.value)}
              placeholder="Agency name, campus, campaign…"
            />
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        .omp-funnel {
          display: grid; grid-template-columns: repeat(7, minmax(0, 1fr));
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          margin-bottom: 16px;
        }
        @media (max-width: 900px) { .omp-funnel { grid-template-columns: repeat(4, 1fr); } }
        @media (max-width: 560px) { .omp-funnel { grid-template-columns: repeat(2, 1fr); } }
        .omp-funnel-cell {
          padding: 14px 12px; text-align: center; border-right: 1px solid var(--border-slate-100);
        }
        .omp-funnel-cell:last-child { border-right: none; }
        .omp-funnel-value { font-size: 22px; font-weight: 800; line-height: 1.1; }
        .omp-funnel-label {
          font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-slate-400); margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
