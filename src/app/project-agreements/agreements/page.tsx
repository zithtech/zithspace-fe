'use client';

/**
 * Agreements — every document raised from an agreement template.
 *
 * Laid out like the Tickets list: a section head that says what you are
 * looking at and how it breaks down, a pill row of filters, a table that owns
 * the page's scroll, and a pager pinned under it. The shared chrome
 * (tl-section-head, tl-filter-row, pp-table, pp-footer, tl-action-pop) is
 * declared on the module layout.
 *
 * Filtering is SERVER-SIDE (project, status, search) because an established
 * tenant accumulates agreements indefinitely. The stat strip comes back from
 * the same call, so the counts always describe the whole set rather than the
 * page you are on. PAGING is client-side: the endpoint answers with the full
 * filtered set, and slicing it here keeps the counts and the rows in step.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, Dropdown, Tooltip } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import {
  Briefcase,
  Download,
  Eye,
  FileText,
  Filter,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SignalHigh,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import NoData from '@/components/common/NoData';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import TicketFilterPill from '@/components/projects/TicketFilterPill';
import { ListFooter, menuLabel } from '@/components/project-agreements/listChrome';
import AgreementDetailDrawer from '@/components/project-agreements/AgreementDetailDrawer';
import { usePermission } from '@/hooks/usePermission';
import { useDebounce } from '@/hooks/useDebounce';
import {
  AGREEMENT_STATUS_META,
  Agreement,
  AgreementStats,
  AgreementStatus,
  DocumentType,
  EXPIRING_SOON_DAYS,
  ProjectAgreementsService,
  ProjectOption,
} from '@/services/projectAgreementsService';

const EMPTY_STATS: AgreementStats = {
  total: 0,
  draft: 0,
  pending: 0,
  active: 0,
  expired: 0,
  terminated: 0,
  expiringSoon: 0,
  untyped: 0,
  byType: {},
};

const STATUS_KEYS = Object.keys(AGREEMENT_STATUS_META) as AgreementStatus[];

/** The leading "All" row is how a single-select pill gets cleared. */
const STATUS_OPTIONS = [
  { value: '', label: 'All statuses', description: 'Do not filter by status' },
  ...STATUS_KEYS.map((s) => ({ value: s, label: AGREEMENT_STATUS_META[s].label })),
];

/**
 * The counts in the section head, in the order a document travels.
 *
 * "Expiring soon" rides along at the end because it is the number this module
 * exists to surface — which live contracts lapse next month is not something
 * the status column can answer on its own.
 */
const STAT_CHIPS: Array<[keyof AgreementStats, string, string]> = [
  ['draft', 'Draft', '#64748b'],
  ['pending', 'Pending', '#3b82f6'],
  ['active', 'Active', '#16a34a'],
  ['expired', 'Expired', '#94a3b8'],
  ['terminated', 'Terminated', '#ef4444'],
  ['expiringSoon', `Expiring in ${EXPIRING_SOON_DAYS}d`, '#f59e0b'],
];

export default function AgreementsPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense
      fallback={
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <ZukvoLoader size="md" />
        </div>
      }
    >
      <AgreementsList />
    </Suspense>
  );
}

function AgreementsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const perms = usePermission() as unknown as Record<string, any>;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Agreement[]>([]);
  const [stats, setStats] = useState<AgreementStats>(EMPTY_STATS);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  /** The rail's selection: which kind of document the list is narrowed to. */
  const [typeId, setTypeId] = useState<string>('');

  const [projectId, setProjectId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);

  /**
   * Which agreement the drawer is showing. null is closed.
   *
   * Seeded from ?open= so /agreements/<id> can redirect here and land on the
   * document it named, and so a refresh keeps the drawer open.
   */
  const [openId, setOpenId] = useState<string | null>(searchParams?.get('open') ?? null);

  // Keep the URL in step, so the drawer is linkable and the back button closes
  // it rather than leaving the page.
  useEffect(() => {
    const current = searchParams?.get('open') ?? null;
    if (current === openId) return;
    router.replace(
      openId ? `/project-agreements/agreements?open=${openId}` : '/project-agreements/agreements',
      { scroll: false }
    );
  }, [openId, searchParams, router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ProjectAgreementsService.listAgreements({
        projectId: projectId || undefined,
        status: (status || undefined) as AgreementStatus | undefined,
        documentTypeId: typeId || undefined,
        search: debouncedSearch || undefined,
      });
      setItems(data.items ?? []);
      setStats(data.stats ?? EMPTY_STATS);
    } catch (err: any) {
      toast.error(err?.message || 'Could not load agreements');
    } finally {
      setLoading(false);
    }
  }, [projectId, status, typeId, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  // Any change to the filters puts you back on page one. Staying on page 4 of
  // a result set that now has two rows shows an empty table over a full count.
  useEffect(() => {
    setPage(1);
  }, [projectId, status, typeId, debouncedSearch]);

  useEffect(() => {
    // activeOnly: the rail lists what you can still raise. A retired kind stays
    // on the documents citing it but is not a place to file new work.
    ProjectAgreementsService.listDocumentTypes({ activeOnly: true })
      .then(setDocumentTypes)
      .catch(() => {
        // The rail is navigation, not the page. A failure here must not stop
        // the list from rendering.
      });

    ProjectAgreementsService.listProjects()
      .then(setProjects)
      .catch(() => {
        // The picker is a filter, not the page. A failure here should not stop
        // the list from rendering.
      });
  }, []);

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'All projects', description: 'Do not filter by project' },
      ...projects.map((p) => ({
        value: p.id,
        label: p.name,
        description: p.code ?? undefined,
      })),
    ],
    [projects]
  );

  const activeFilterCount = (projectId ? 1 : 0) + (status ? 1 : 0) + (search ? 1 : 0);

  /** Everything narrowing the list, rail included — what Clear all undoes. */
  const narrowed = activeFilterCount > 0 || typeId !== '';

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  const resetFilters = () => {
    setProjectId('');
    setStatus('');
    setSearch('');
  };

  /** Back to everything, rail included. */
  const clearAll = () => {
    resetFilters();
    setTypeId('');
  };

  const handleDelete = async (id: string) => {
    try {
      await ProjectAgreementsService.deleteAgreement(id);
      toast.success('Agreement deleted');
      load();
    } catch (err: any) {
      toast.error(err?.message || 'Could not delete that agreement');
    }
  };

  const handlePdf = async (row: Agreement) => {
    setPdfBusyId(row.id);
    try {
      const { pdfUrl } = await ProjectAgreementsService.generatePdf(row.id);
      // Opened rather than fetched as a blob: the PDF already lives in R2 with
      // a download disposition, so there is nothing to hold in memory here.
      window.open(pdfUrl, '_blank', 'noopener');
      setItems((prev) => prev.map((a) => (a.id === row.id ? { ...a, pdfUrl } : a)));
    } catch (err: any) {
      toast.error(err?.message || 'Could not generate the PDF');
    } finally {
      setPdfBusyId(null);
    }
  };

  const columns = [
    {
      title: 'Document',
      dataIndex: 'title',
      key: 'title',
      render: (_: unknown, row: Agreement) => (
        <div className="pp-name-cell">
          <span className="pp-name-icon">
            <FileText size={13} />
          </span>
          <span className="pp-name-text">
            <span className="pp-name-title">{row.title}</span>
            <span className="pp-name-sub">
              {row.documentNumber || 'No reference'}
              {row.templateName ? ` · ${row.templateName}` : ''}
            </span>
          </span>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'documentTypeCode',
      key: 'documentTypeCode',
      width: 170,
      render: (_: unknown, row: Agreement) =>
        row.documentTypeCode ? (
          <span className="pa-code">{row.documentTypeCode}</span>
        ) : (
          <span className="pp-cell pp-cell-muted">Not set</span>
        ),
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      render: (_: unknown, row: Agreement) =>
        row.projectName ? (
          <span className="pp-cell">
            {row.projectName}
            {row.projectCode ? (
              <span className="pp-cell-muted"> ({row.projectCode})</span>
            ) : null}
          </span>
        ) : (
          // Not a gap — a document can legitimately belong to no project.
          <span className="pp-cell pp-cell-muted">Not linked</span>
        ),
    },
    {
      title: 'Counterparty',
      dataIndex: 'partyName',
      key: 'partyName',
      width: 180,
      render: (v: string | null) => (
        <span className={`pp-cell ${v ? '' : 'pp-cell-muted'}`}>{v || '—'}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 190,
      render: (_: unknown, row: Agreement) => {
        const meta = AGREEMENT_STATUS_META[row.status];
        return (
          <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
            <span className="pp-vis-pill" style={{ background: meta.bg, color: meta.color }}>
              <span className="pp-vis-dot" style={{ background: meta.color }} />
              {meta.label}
            </span>
            {/* Whether the client has opened it in the portal. Only shown once
                it has been: "not viewed" on a draft nobody sent is noise. */}
            {row.portalViewedAt && (
              <Tooltip title={`Client viewed ${formatDate(row.portalViewedAt)}`}>
                <span
                  className="pp-vis-pill"
                  style={{ background: 'rgba(99,102,241,0.12)', color: '#4338ca' }}
                >
                  <Eye size={11} /> Viewed
                </span>
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      title: 'Effective',
      dataIndex: 'effectiveDate',
      key: 'effectiveDate',
      width: 165,
      render: (_: unknown, row: Agreement) => (
        <span className={`pp-cell ${row.effectiveDate ? '' : 'pp-cell-muted'}`}>
          {formatDate(row.effectiveDate)}
          {row.expiryDate ? ` → ${formatDate(row.expiryDate)}` : ''}
        </span>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      fixed: 'right' as const,
      render: (_: unknown, row: Agreement) => (
        <Dropdown
          overlayClassName="tl-action-pop"
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              {
                key: 'view',
                label: menuLabel(<Eye size={14} />, 'Open', 'Read the document', '#3b82f6'),
                onClick: ({ domEvent }: any) => {
                  domEvent.stopPropagation();
                  setOpenId(row.id);
                },
              },
              ...(perms.canUpdateAgreement
                ? [
                    {
                      key: 'edit',
                      label: menuLabel(
                        <Pencil size={14} />,
                        'Edit',
                        'Change the wording or details'
                      ),
                      onClick: ({ domEvent }: any) => {
                        domEvent.stopPropagation();
                        router.push(`/project-agreements/agreements/${row.id}?edit=1`);
                      },
                    },
                  ]
                : []),
              {
                key: 'pdf',
                disabled: pdfBusyId === row.id,
                label: menuLabel(
                  <Download size={14} />,
                  pdfBusyId === row.id ? 'Generating…' : 'Download PDF',
                  'Render to A4 and open it',
                  '#16a34a'
                ),
                onClick: ({ domEvent }: any) => {
                  domEvent.stopPropagation();
                  handlePdf(row);
                },
              },
              ...(perms.canDeleteAgreement
                ? [
                    { type: 'divider' as const, key: 'd1' },
                    {
                      key: 'delete',
                      danger: true,
                      label: menuLabel(
                        <Trash2 size={14} />,
                        'Delete',
                        'Remove the record; PDFs stay',
                        '#ef4444'
                      ),
                      onClick: ({ domEvent }: any) => {
                        domEvent.stopPropagation();
                        // antd's menu closes before a popover confirm could
                        // attach, so the confirmation is a window prompt here.
                        if (
                          window.confirm(
                            `Delete "${row.title}"? Generated PDFs stay in storage but the record is removed.`
                          )
                        ) {
                          handleDelete(row.id);
                        }
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
      ),
    },
  ];

  return (
    <div className="pa-list-page">
      <div className="pa-header">
        <div className="pa-header-about">
          <div className="pa-header-icon">
            <FileText size={19} />
          </div>
          <div>
            <div className="pa-header-title">Agreements</div>
            <div className="pa-header-sub">
              Documents raised from your agreement templates
            </div>
          </div>
        </div>
        <div className="pa-header-actions">
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
          {perms.canCreateAgreement && (
            <Link href="/project-agreements/agreements/new" className="pa-btn pa-btn-primary">
              <Plus size={14} /> New agreement
            </Link>
          )}
        </div>
      </div>

      <div className="pa-list-split">
      {/* ── The rail ───────────────────────────────────────────────────────
        * Saved views on top, the tenant's document types under them. Counts
        * come from the UNFILTERED stats, so a number never moves because you
        * clicked the thing beside it. */}
      <aside className="pa-rail">
        <div className="pa-rail-scroll">
          <div className="pa-rail-label">Document types</div>
          <div className="pa-rail-list">
            <button
              type="button"
              className={`pa-rail-item ${typeId === '' ? 'is-on' : ''}`}
              onClick={() => setTypeId('')}
              aria-pressed={typeId === ''}
            >
              <span className="pa-rail-icon" style={{ color: '#3b82f6' }}>
                <Layers size={14} />
              </span>
              <span className="pa-rail-text">Every type</span>
            </button>
            {documentTypes.map((t) => {
              const n = stats.byType?.[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`pa-rail-item ${typeId === t.id ? 'is-on' : ''}`}
                  onClick={() => setTypeId(typeId === t.id ? '' : t.id)}
                  aria-pressed={typeId === t.id}
                  title={t.description || t.code}
                >
                  <span className="pa-rail-code">{t.code.slice(0, 2)}</span>
                  <span className="pa-rail-text">{t.name}</span>
                  {n > 0 && <span className="pa-rail-count">{n}</span>}
                </button>
              );
            })}
            {documentTypes.length === 0 && (
              <Link href="/project-agreements/settings" className="pa-rail-empty">
                No active types — add one in Settings
              </Link>
            )}
          </div>

          {/* Anything raised before Document Types existed. Shown only while
              there is a backlog, so it disappears once cleared rather than
              sitting there as permanent furniture. */}
          {stats.untyped > 0 && (
            <button
              type="button"
              className="pa-rail-note"
              onClick={() => {
                setTypeId('');
                toast('Sort or scan the Type column for "Not set" to find them.');
              }}
            >
              <TriangleAlert size={13} />
              <span>
                <b>{stats.untyped}</b> without a document type
              </span>
            </button>
          )}
        </div>

        <div className="pa-rail-foot">
          {narrowed ? (
            <button type="button" className="pa-rail-clear" onClick={clearAll}>
              <RotateCcw size={11} /> Clear all filters
            </button>
          ) : (
            <Link href="/project-agreements/settings" className="pa-rail-clear">
              <Layers size={11} /> Manage document types
            </Link>
          )}
        </div>
      </aside>

      <div className="pa-list-main">
      {/* What you are looking at, and how the whole set breaks down. The chips
          are counts for EVERY agreement, not the filtered page. */}
      <div className="tl-section-head">
        <div className="tl-sprint-row1">
          <div className="tl-sprint-title-block">
            <span
              className="tl-sprint-dot"
              style={{ background: '#3b82f6', boxShadow: '0 0 0 3px #3b82f633' }}
            />
            <span className="tl-sprint-title">
              {/* Names what the rail and the pills selected — the heading is
                  the only confirmation of a filter set in three places. */}
              {[
                typeId
                  ? documentTypes.find((t) => t.id === typeId)?.name ?? 'Document type'
                  : 'All agreements',
                projectId ? projects.find((p) => p.id === projectId)?.name : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <span className="tl-sprint-tags">
              {STAT_CHIPS.map(([key, label, color]) => (
                <span
                  key={key}
                  className="tl-sprint-tag"
                  style={{
                    color,
                    background: `${color}1a`,
                    borderColor: `${color}40`,
                  }}
                >
                  <b>{stats[key] as number}</b> {label}
                </span>
              ))}
            </span>
          </div>
        </div>
        <div className="tl-sprint-row2">
          <span className="tl-sprint-meta">
            <b>{stats.total}</b> in total
          </span>
          <span className="tl-sprint-meta">
            <b>{stats.active}</b> currently in force
          </span>
          {narrowed && (
            <span className="tl-sprint-meta">
              <b>{items.length}</b> in this view
            </span>
          )}

        </div>
      </div>

      <div className="tl-filter-row">
        <div className="tl-filter-row-label">
          <Filter size={11} />
          <span>Filters</span>
          <span className="tl-filter-row-count">
            {activeFilterCount + (typeId ? 1 : 0)}
          </span>
        </div>
        <div className="tl-filter-row-pills">
          <div className="tl-filter-search">
            <Search size={13} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, reference, project or counterparty"
              aria-label="Search agreements"
            />
          </div>
          <TicketFilterPill
            icon={<Briefcase size={11} />}
            label="Project"
            value={projectId}
            options={projectOptions}
            onChange={(v: any) => setProjectId(v ?? '')}
            multiple={false}
            itemNoun="projects"
            searchPlaceholder="Find a project"
          />
          <TicketFilterPill
            icon={<SignalHigh size={11} />}
            label="Status"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(v: any) => setStatus(v ?? '')}
            multiple={false}
            itemNoun="statuses"
          />
        </div>
        {narrowed && (
          <div className="tl-filter-row-actions">
            {/* Clears the rail too. Below 1100px the rail is hidden, and a
                selection you cannot see must still be one you can undo. */}
            <button type="button" className="tl-filter-row-reset" onClick={clearAll}>
              <RotateCcw size={10} />
              Reset
            </button>
          </div>
        )}
      </div>

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
                onClick: () => setOpenId(record.id),
              })}
              locale={{
                emptyText: (
                  <NoData
                    title={narrowed ? 'Nothing in this view' : 'No agreements yet'}
                    description={
                      narrowed
                        ? 'Clear a filter or pick another view to widen the search.'
                        : 'Raise one from a published template to get started.'
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
            total={items.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            noun="agreements"
          />
        </>
      )}
      </div>
      </div>

      <AgreementDetailDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        // A status change or a delete happened inside the drawer; the row and
        // the rail counts behind it are now stale.
        onChanged={load}
      />
    </div>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return value;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1]} ${m[1]}`;
}
