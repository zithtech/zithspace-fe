'use client';

/**
 * Templates — the reusable wording an agreement is cut from.
 *
 * PUBLISHING IS THE GATE. The composer only offers published templates, so a
 * draft is genuinely a draft: half-written clauses cannot reach a client
 * because somebody picked the wrong row in a dropdown.
 *
 * Same furniture as the Agreements list and the Tickets list — section head,
 * pill row, table, pager. It was a card grid, which read well with six
 * templates and stopped reading at thirty: a table is scannable by status and
 * by how many documents depend on a row, which is what you actually come here
 * to check before archiving something.
 *
 * Search is server-side; STATUS is filtered here, because the endpoint takes
 * one status and the pill needs an "all" position that the filter bar can
 * reset without a second round trip.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table, Dropdown, Tooltip } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import {
  Archive,
  CheckCircle2,
  Copy,
  Eye,
  FileStack,
  Filter,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SignalHigh,
  Trash2,
} from 'lucide-react';
import { message } from '@/providers/AntdGlobalProvider';
import NoData from '@/components/common/NoData';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import TicketFilterPill from '@/components/projects/TicketFilterPill';
import StatCards from '@/components/common/StatCards';
import FilterBar, { FilterToggleButton } from '@/components/common/FilterBar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { ListFooter, menuLabel } from '@/components/project-agreements/listChrome';
import TemplateDetailDrawer from '@/components/project-agreements/TemplateDetailDrawer';
import PasswordUnlockModal from '@/components/project-agreements/PasswordUnlockModal';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import {
  AgreementTemplate,
  ProjectAgreementsService,
  TEMPLATE_STATUS_META,
  TemplateStatus,
  getLockScope,
  isPasswordLockError,
  unlockTemplate,
} from '@/services/projectAgreementsService';

const STATUS_KEYS = Object.keys(TEMPLATE_STATUS_META) as TemplateStatus[];

/** The leading "All" row is how a single-select pill gets cleared. */
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses', description: 'Do not filter by status' },
  ...STATUS_KEYS.map((s) => ({
    value: s,
    label: TEMPLATE_STATUS_META[s].label,
  })),
];

export default function TemplatesPage() {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  const [templates, setTemplates] = useState<AgreementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const [deleteTarget, setDeleteTarget] = useState<AgreementTemplate | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockScope, setLockScope] = useState<'TENANT' | 'AGREEMENT' | 'TEMPLATE'>('TENANT');
  const [unlockTargetId, setUnlockTargetId] = useState<string | null>(null);
  const pendingActionRef = React.useRef<(() => void) | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  /** Which template the drawer is showing. null is closed. */
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTemplates(
        await ProjectAgreementsService.listTemplates({ search: debouncedSearch || undefined })
      );
    } catch (err: any) {
      message.error(err?.message || 'Could not load templates');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  /** Counts for EVERY template, so the chips do not move as you filter. */
  const counts = useMemo(() => {
    const base: Record<TemplateStatus, number> = { draft: 0, published: 0, archived: 0 };
    for (const t of templates) base[t.status] += 1;
    return base;
  }, [templates]);

  const filtered = useMemo(
    () => (status ? templates.filter((t) => t.status === status) : templates),
    [templates, status]
  );

  const pageItems = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize]
  );

  const activeFilterCount = (status ? 1 : 0) + (search ? 1 : 0);

  const handleTemplateUnlock = async (password: string) => {
    if (!unlockTargetId) return;
    const result = await unlockTemplate(unlockTargetId, password);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`pa_unlock_${unlockTargetId}`, result.unlockToken);
    }
    setIsLocked(false);
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      await action();
    }
  };

  const setTemplateStatus = async (t: AgreementTemplate, next: TemplateStatus) => {
    try {
      const updated = await ProjectAgreementsService.setTemplateStatus(t.id, next);
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...updated } : x)));
      message.success(next === 'published' ? 'Template published' : `Template moved to ${next}`);
    } catch (err: any) {
      if (isPasswordLockError(err)) {
        setUnlockTargetId(t.id);
        pendingActionRef.current = () => setTemplateStatus(t, next);
        setIsLocked(true);
        setLockScope(getLockScope(err));
      } else {
        message.error(err?.message || 'Could not change the status');
      }
    }
  };

  const duplicate = async (t: AgreementTemplate) => {
    try {
      const copy = await ProjectAgreementsService.duplicateTemplate(t.id);
      message.success('Template duplicated');
      router.push(`/project-agreements/templates/builder?id=${copy.id}`);
    } catch (err: any) {
      if (isPasswordLockError(err)) {
        setUnlockTargetId(t.id);
        pendingActionRef.current = () => duplicate(t);
        setIsLocked(true);
        setLockScope(getLockScope(err));
      } else {
        message.error(err?.message || 'Could not duplicate that template');
      }
    }
  };

  const checkDelete = (t: AgreementTemplate) => {
    setDeleteTarget(t);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    try {
      await ProjectAgreementsService.deleteTemplate(targetId);
      setTemplates((prev) => prev.filter((x) => x.id !== targetId));
      message.success('Template deleted');
      setDeleteTarget(null);
    } catch (err: any) {
      if (isPasswordLockError(err)) {
        setUnlockTargetId(targetId);
        pendingActionRef.current = () => confirmDelete();
        setIsLocked(true);
        setLockScope(getLockScope(err));
      } else {
        message.error(err?.message || 'Could not delete that template');
      }
    }
  };

  const columns = [
    {
      title: 'Template',
      dataIndex: 'name',
      key: 'name',
      render: (_: unknown, row: AgreementTemplate) => (
        <div className="pp-name-cell">
          <span className="pp-name-icon">
            <FileStack size={13} />
          </span>
          <span className="pp-name-text">
            <span className="pp-name-title">{row.name}</span>
            <span className="pp-name-sub">
              {row.documentTypeName || 'No type'} · v{row.version}
              {row.description ? ` · ${row.description}` : ''}
            </span>
          </span>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'documentTypeCode',
      key: 'documentTypeCode',
      width: 180,
      render: (_: unknown, row: AgreementTemplate) =>
        row.documentTypeCode ? (
          <span className="pa-code">{row.documentTypeCode}</span>
        ) : (
          // Predates Document Types and was never reclassified — it must be
          // given one the next time it is saved.
          <span className="pp-cell pp-cell-muted">Not set</span>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (s: TemplateStatus) => {
        const meta = TEMPLATE_STATUS_META[s];
        return (
          <span className="pp-vis-pill" style={{ background: meta.bg, color: meta.color }}>
            <span className="pp-vis-dot" style={{ background: meta.color }} />
            {meta.label}
          </span>
        );
      },
    },
    {
      title: 'Fields',
      key: 'fields',
      width: 100,
      render: (_: unknown, row: AgreementTemplate) => (
        <span className={`pp-cell ${row.placeholders.length ? '' : 'pp-cell-muted'}`}>
          {row.placeholders.length || 'None'}
        </span>
      ),
    },
    {
      title: 'In use',
      key: 'inUse',
      width: 110,
      render: (_: unknown, row: AgreementTemplate) =>
        row.agreementCount ? (
          <span className="pp-cell">
            {row.agreementCount} document{row.agreementCount === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="pp-cell pp-cell-muted">Unused</span>
        ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 130,
      render: (v: string) => <span className="pp-cell">{formatDate(v)}</span>,
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right' as const,
      render: (_: unknown, row: AgreementTemplate) => (
        <ConfirmDialog
          open={deleteTarget?.id === row.id}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          tone="danger"
          title={`Delete "${row.name}"?`}
          description={
            row.agreementCount
              ? `This template has ${row.agreementCount} agreement(s) raised from it. Those documents keep their wording, but the template leaves the picker.`
              : undefined
          }
          confirmText="Delete"
          onConfirm={confirmDelete}
        >
          <Dropdown
            overlayClassName="tl-action-pop"
            trigger={['click']}
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'view',
                  label: menuLabel(<Eye size={14} />, 'Open', 'Read the wording', '#3b82f6'),
                  onClick: ({ domEvent }: any) => {
                    domEvent.stopPropagation();
                    setOpenId(row.id);
                  },
                },
                ...(perms.canUpdateAgreementTemplate
                  ? [
                      {
                        key: 'edit',
                        label: menuLabel(
                          <Pencil size={14} />,
                          'Edit',
                          'Open in the template builder',
                          '#3b82f6'
                        ),
                        onClick: ({ domEvent }: any) => {
                          domEvent.stopPropagation();
                          router.push(`/project-agreements/templates/builder?id=${row.id}`);
                        },
                      },
                      row.status === 'published'
                        ? {
                            key: 'archive',
                            label: menuLabel(
                              <Archive size={14} />,
                              'Archive',
                              'Take it out of the composer'
                            ),
                            onClick: ({ domEvent }: any) => {
                              domEvent.stopPropagation();
                              setTemplateStatus(row, 'archived');
                            },
                          }
                        : {
                            key: 'publish',
                            label: menuLabel(
                              <CheckCircle2 size={14} />,
                              'Publish',
                              'Make it available in the composer',
                              '#16a34a'
                            ),
                            onClick: ({ domEvent }: any) => {
                              domEvent.stopPropagation();
                              setTemplateStatus(row, 'published');
                            },
                          },
                    ]
                  : []),
                ...(perms.canCreateAgreementTemplate
                  ? [
                      {
                        key: 'duplicate',
                        label: menuLabel(
                          <Copy size={14} />,
                          'Duplicate',
                          'Start a new draft from this wording'
                        ),
                        onClick: ({ domEvent }: any) => {
                          domEvent.stopPropagation();
                          duplicate(row);
                        },
                      },
                    ]
                  : []),
                ...(perms.canDeleteAgreementTemplate
                  ? [
                      { type: 'divider' as const, key: 'd1' },
                      {
                        key: 'delete',
                        danger: true,
                        label: menuLabel(
                          <Trash2 size={14} />,
                          'Delete',
                          'Documents raised keep their wording',
                          '#ef4444'
                        ),
                        onClick: ({ domEvent }: any) => {
                          domEvent.stopPropagation();
                          checkDelete(row);
                        },
                      },
                    ]
                  : []),
              ],
            }}
          >
            <button
              type="button"
              className="pa-btn"
              style={{ width: 28, height: 28, padding: 0, justifyContent: 'center' }}
              onClick={(e) => e.stopPropagation()}
              aria-label="Actions"
            >
              <EllipsisOutlined />
            </button>
          </Dropdown>
        </ConfirmDialog>
      ),
    },
  ];

  return (
    <div className="pa-list-page">
      <div className="pa-header">
        <div className="pa-header-about">
          <div className="pa-header-icon">
            <Layers size={19} />
          </div>
          <div>
            <div className="pa-header-title">Agreement templates</div>
            <div className="pa-header-sub">
              Reusable wording. Publish one to make it available in the composer.
            </div>
          </div>
        </div>
        <div className="pa-header-actions">
          <FilterToggleButton
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
            activeCount={activeFilterCount}
          />
          <Tooltip title="Refresh">
            <button
              type="button"
              className="pa-btn"
              onClick={load}
              style={{ width: 32, padding: 0, justifyContent: 'center' }}
              aria-label="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </Tooltip>
          {perms.canCreateAgreementTemplate && (
            <Link href="/project-agreements/templates/builder" className="pa-btn pa-btn-primary">
              <Plus size={14} /> New template
            </Link>
          )}
        </div>
      </div>

      <StatCards
        title={status ? TEMPLATE_STATUS_META[status as TemplateStatus].label : 'All templates'}
        statusText=""
        cells={[
          { label: 'Total', value: templates.length },
          { label: 'Published', value: counts.published },
          ...(activeFilterCount > 0 ? [{ label: 'Matching', value: filtered.length }] : []),
        ]}
        extra={
          <div className="common-sprint-tags">
            {STATUS_KEYS.map((key) => {
              const meta = TEMPLATE_STATUS_META[key];
              return (
                <span
                  key={key}
                  className="common-sprint-tag"
                  style={{
                    color: meta.color,
                    background: `${meta.color}1a`,
                    borderColor: `${meta.color}40`,
                  }}
                >
                  <b>{counts[key]}</b> {meta.label}
                </span>
              );
            })}
          </div>
        }
      />

      <FilterBar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onReset={() => {
          setStatus('');
          setSearch('');
        }}
        activeCount={activeFilterCount}
      >
        <div className="tl-filter-search">
          <Search size={13} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates"
            aria-label="Search templates"
          />
        </div>
        <TicketFilterPill
          icon={<SignalHigh size={11} />}
          label="Status"
          value={status}
          options={STATUS_OPTIONS}
          onChange={(v: any) => setStatus(v ?? '')}
          multiple={false}
          itemNoun="statuses"
        />
      </FilterBar>

      {loading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ZukvoLoader size="md" />
        </div>
      ) : (
        <>
          <div className="pp-table-wrap">
            <Table
              className="pp-table"
              rowKey="id"
              size="small"
              columns={columns as any}
              dataSource={pageItems}
              pagination={false}
              scroll={{ x: 'max-content' }}
              rowClassName="pp-row"
              onRow={(record) => ({
                // Opening READS it; editing is the explicit action. Clicking a
                // row straight into an editor is how wording gets changed by
                // somebody who only meant to look at it.
                onClick: () => setOpenId(record.id),
              })}
              locale={{
                emptyText: (
                  <NoData
                    title={activeFilterCount > 0 ? 'Nothing matches' : 'No templates yet'}
                    description={
                      activeFilterCount > 0
                        ? 'Clear a filter to widen the search.'
                        : 'Create one to start raising agreements.'
                    }
                    accent="#3b82f6"
                  />
                ),
              }}
            />
          </div>

          <ListFooter
            current={page}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            noun="templates"
          />
        </>
      )}

      <TemplateDetailDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        onChanged={load}
      />

      <PasswordUnlockModal
        open={isLocked}
        documentTitle={templates.find((t) => t.id === unlockTargetId)?.name || 'Template'}
        scope={lockScope}
        onUnlock={handleTemplateUnlock}
        onCancel={() => {
          setIsLocked(false);
          setUnlockTargetId(null);
          pendingActionRef.current = null;
        }}
      />
    </div>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
