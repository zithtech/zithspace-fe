'use client';

import NoData from "@/components/common/NoData";
import React, { useMemo, useState, useEffect } from 'react';
import {
  Button, Input, Select, Modal, Dropdown, Tooltip, message, Table,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, SearchOutlined, EllipsisOutlined, EditOutlined, CopyOutlined,
  InboxOutlined, DeleteOutlined, RollbackOutlined, AppstoreOutlined, UnorderedListOutlined,
  GlobalOutlined, BlockOutlined, FolderOpenOutlined, LayoutOutlined, MenuOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { Blocks } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { CATEGORY_META, CATEGORY_ORDER, typeMeta } from '@/components/proposals/library/sectionMeta';
import { SectionComposerDrawer, ComposerPayload } from '@/components/proposals/library/SectionComposerDrawer';
import {
  useProposalLibraryStore, LibrarySection, SectionCategory,
} from '@/store/proposalLibraryStore';
import { usePermission } from '@/hooks/usePermission';
import { useActivitySource } from '@/hooks/useActivitySource';
import '../library.css';

type SavedView = 'all' | 'global' | 'archived';

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

// Gradient for the card avatar, derived from the type's palette colour.
const GRADIENTS: Record<string, [string, string]> = {
  '#2563eb': ['#3b82f6', '#2563eb'],
  '#059669': ['#10b981', '#059669'],
  '#475569': ['#64748b', '#475569'],
};
const gradientForColor = (c: string): [string, string] => GRADIENTS[c] || ['#3b82f6', '#2563eb'];

// Deterministic mini-trend for the stat sparkline.
const trendFor = (seed: number): number[] =>
  Array.from({ length: 8 }, (_, i) => 3 + ((seed * 7 + i * i * 5) % 11));

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96, h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => [i * stepX, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const MenuItem = ({ icon, tint, color, title, desc }: { icon: React.ReactNode; tint: string; color: string; title: string; desc: string }) => (
  <div className="pp-menu-item">
    <span className="pp-menu-ic" style={{ background: tint, color }}>{icon}</span>
    <span className="pp-menu-text">
      <span className="pp-menu-title">{title}</span>
      <span className="pp-menu-desc">{desc}</span>
    </span>
  </div>
);

function SectionsContent() {
  console.log("Forcing HMR reload for Sections");
  useActivitySource({ section: 'WORK', module: 'Proposals', page: 'SectionLibrary' });
  const router = useRouter();
  const [messageApi, holder] = message.useMessage();
  const [modal, modalHolder] = Modal.useModal();
  const { canCreateProposal, canUpdateProposal, canDeleteProposal } = usePermission();

  const sections = useProposalLibraryStore((s) => s.sections);
  const templates = useProposalLibraryStore((s) => s.templates);
  const createSection = useProposalLibraryStore((s) => s.createSection);
  const updateSection = useProposalLibraryStore((s) => s.updateSection);
  const duplicateSection = useProposalLibraryStore((s) => s.duplicateSection);
  const archiveSection = useProposalLibraryStore((s) => s.archiveSection);
  const deleteSection = useProposalLibraryStore((s) => s.deleteSection);
  const fetchSections = useProposalLibraryStore((s) => s.fetchSections);
  const sectionsLoading = useProposalLibraryStore((s) => s.sectionsLoading);
  const sectionsLoaded = useProposalLibraryStore((s) => s.sectionsLoaded);

  const handleRefresh = () => {
    fetchSections(true);
  };

  useEffect(() => { fetchSections(); }, [fetchSections]);

  const usageCount = useMemo(() => {
    const map: Record<string, number> = {};
    templates.forEach((t) => t.sectionIds.forEach((id) => { map[id] = (map[id] || 0) + 1; }));
    return map;
  }, [templates]);

  const [searchText, setSearchText] = useState('');
  const [savedView, setSavedView] = useState<SavedView>('all');
  const [catFilter, setCatFilter] = useState<SectionCategory | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<LibrarySection | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // ── Counts ──────────────────────────────────────────────────────────
  const activeCount = sections.filter((s) => !s.archived).length;
  const globalCount = sections.filter((s) => s.isGlobal && !s.archived).length;
  const archivedCount = sections.filter((s) => s.archived).length;
  const usedSections = sections.filter((s) => !s.archived && (usageCount[s.id] || 0) > 0).length;
  const categoriesUsed = new Set(sections.filter((s) => !s.archived).map((s) => s.category)).size;

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    sections.filter((s) => !s.archived).forEach((s) => { m[s.category] = (m[s.category] || 0) + 1; });
    return m;
  }, [sections]);

  const views: { key: SavedView; label: string; icon: React.ReactNode; color: string; count: number }[] = [
    { key: 'all', label: 'All Sections', icon: <BlockOutlined />, color: '#3B82F6', count: activeCount },
    { key: 'global', label: 'Global', icon: <GlobalOutlined />, color: '#2563eb', count: globalCount },
    { key: 'archived', label: 'Archived', icon: <InboxOutlined />, color: '#64748b', count: archivedCount },
  ];

  // ── Filtering ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return sections.filter((s) => {
      if (savedView === 'archived') { if (!s.archived) return false; }
      else if (s.archived) return false;
      if (savedView === 'global' && !s.isGlobal) return false;
      if (catFilter && s.category !== catFilter) return false;
      if (q && !`${s.name} ${s.description || ''} ${s.type} ${s.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sections, searchText, savedView, catFilter]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const safePage = Math.min(tablePage, pageCount);
  const pageStart = total === 0 ? 0 : (safePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(safePage * tablePageSize, total);
  const paged = filtered.slice((safePage - 1) * tablePageSize, safePage * tablePageSize);

  // ── Modal ───────────────────────────────────────────────────────────
  const openCreate = () => { setEditing(null); setComposerOpen(true); };
  const openEdit = (s: LibrarySection) => { setEditing(s); setComposerOpen(true); };
  const handleComposerSave = async (payload: ComposerPayload) => {
    try {
      if (editing) {
        await updateSection(editing.id, payload);
        messageApi.success('Section updated');
      } else {
        await createSection({ ...payload, data: {} });
        messageApi.success('Section created');
      }
      setComposerOpen(false);
    } catch (e: any) {
      messageApi.error(e?.message || 'Could not save section');
    }
  };

    const actionMenu = (s: LibrarySection): MenuProps => ({
      className: 'pp-action-menu',
      items: [
        canUpdateProposal ? { key: 'edit', label: <MenuItem icon={<EditOutlined />} tint="rgba(59,130,246,0.10)" color="#3B82F6" title="Edit Section" desc="Update name, type & content" /> } : null,
        canCreateProposal ? { key: 'duplicate', label: <MenuItem icon={<CopyOutlined />} tint="rgba(100,116,139,0.10)" color="#475569" title="Duplicate" desc="Create an editable copy" /> } : null,
        canUpdateProposal ? {
          key: 'archive',
          label: <MenuItem
            icon={s.archived ? <RollbackOutlined /> : <InboxOutlined />}
            tint="rgba(16,185,129,0.10)" color="#059669"
            title={s.archived ? 'Restore' : 'Archive'}
            desc={s.archived ? 'Bring back to the library' : 'Hide from pickers'} />,
        } : null,
        (canDeleteProposal && !s.system) ? { type: 'divider' } : null,
        (canDeleteProposal && !s.system) ? {
          key: 'delete',
          danger: true,
          label: (
            <ConfirmDialog
              tone="danger"
              icon={<DeleteOutlined style={{ fontSize: 15 }} />}
              title="Delete Section?"
              description={`"${s.name}" will be permanently removed and dropped from any templates that use it.`}
              confirmText="Delete"
              cancelText="Cancel"
              placement="left"
              onConfirm={async () => {
                try {
                  await deleteSection(s.id);
                  messageApi.success('Section deleted');
                } catch (e: any) {
                  messageApi.error(e?.message || 'Could not delete section');
                }
              }}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <MenuItem icon={<DeleteOutlined />} tint="rgba(239,68,68,0.10)" color="#ef4444" title="Delete" desc="Permanently remove" />
              </div>
            </ConfirmDialog>
          ),
        } : null,
      ].filter(Boolean) as MenuProps['items'],
      onClick: async ({ key, domEvent }) => {
        domEvent.stopPropagation();
        try {
          if (key === 'edit') openEdit(s);
          else if (key === 'duplicate') { await duplicateSection(s.id); messageApi.success('Section duplicated'); }
          else if (key === 'archive') { await archiveSection(s.id, !s.archived); messageApi.success(s.archived ? 'Section restored' : 'Section archived'); }
        } catch (e: any) {
          messageApi.error(e?.message || 'Action failed');
        }
      },
    });

  const statCells = [
    { key: 'total', title: 'Total Sections', value: activeCount, icon: <BlockOutlined />, color: '#3B82F6', tint: 'var(--bg-blue-50)' },
    { key: 'global', title: 'Global', value: globalCount, icon: <GlobalOutlined />, color: '#2563eb', tint: 'rgba(37,99,235,0.10)' },
    { key: 'used', title: 'In Templates', value: usedSections, icon: <LayoutOutlined />, color: '#059669', tint: 'rgba(5,150,105,0.10)' },
    { key: 'cats', title: 'Categories', value: categoriesUsed, icon: <FolderOpenOutlined />, color: '#475569', tint: 'rgba(71,85,105,0.10)' },
  ];

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><Blocks size={26} /></div>
      <div className="pp-empty-title">{savedView === 'archived' ? 'No archived sections' : 'No sections found'}</div>
      <div className="pp-empty-sub">
        {savedView === 'archived' ? 'Archived sections will appear here.' : 'Try a different filter, or create a new section.'}
      </div>
      {canCreateProposal && savedView !== 'archived' && (
        <Button type="primary" icon={<PlusOutlined />} className="pp-btn-primary" onClick={openCreate} style={{ marginTop: 14 }}>
          Create Section
        </Button>
      )}
    </div>
  );

  const tableColumns = [
    {
      title: 'NAME',
      dataIndex: 'name',
      key: 'name',
      render: (_: string, s: LibrarySection) => {
        const meta = typeMeta(s.type);
        const grad = gradientForColor(meta.color);
        return (
          <div className="pp-name-cell" onClick={() => openEdit(s)} style={{ cursor: 'pointer' }}>
            <div className="pp-name-icon" style={{ background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)`, color: '#fff' }}>
              {meta.icon}
            </div>
            <span className="pp-name-title">{s.name}</span>
          </div>
        );
      },
    },
    {
      title: 'CATEGORY',
      dataIndex: 'category',
      key: 'category',
      render: (c: SectionCategory) => <span style={{ fontSize: '12px', color: 'var(--text-slate-700)' }}>{CATEGORY_META[c]?.label || c}</span>,
    },
    {
      title: 'TYPE',
      key: 'type',
      render: (_: any, s: LibrarySection) => {
        const meta = typeMeta(s.type);
        return (
          <span className="pc-status-tag" style={{ color: meta.color, background: meta.bg, display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
            {meta.icon}{meta.label}
          </span>
        );
      },
    },
    {
      title: 'SCOPE',
      key: 'scope',
      render: (_: any, s: LibrarySection) => s.isGlobal
        ? <span className="pc-status-tag" style={{ color: '#2563eb', background: 'rgba(37,99,235,0.12)', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}><GlobalOutlined />Global</span>
        : <span style={{ color: '#94a3b8', fontSize: '12px' }}>Standard</span>,
    },
    {
      title: 'USED',
      key: 'used',
      render: (_: any, s: LibrarySection) => {
        const used = usageCount[s.id] || 0;
        return <span style={{ color: used > 0 ? '#059669' : '#94a3b8', fontSize: '12px' }}>{used > 0 ? `${used} template${used > 1 ? 's' : ''}` : 'Not used'}</span>;
      }
    },
    {
      title: 'UPDATED',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => <span style={{ fontSize: '12px', color: '#64748b' }}>{dayjs(date).format('MMM D, YYYY')}</span>,
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, s: LibrarySection) => (
        <Dropdown menu={actionMenu(s)} overlayClassName="pp-action-pop" trigger={['click']} placement="bottomRight">
          <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <EllipsisOutlined style={{ fontSize: '16px', color: '#64748b' }} />
          </button>
        </Dropdown>
      ),
    }
  ];

  return (
    <>
      {holder}
      {modalHolder}
      <div className={`pp-shell ${isMobileSidebarOpen ? 'is-mobile-open' : ''}`}>
        <div className="pp-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />
        {/* ============================ SIDEBAR ============================ */}
        <aside className="pp-sidebar">
          <div className="pp-side-head">
            <div className="pp-side-logo"><BlockOutlined /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Sections</div>
              <div className="pp-side-subtitle">Reusable blocks</div>
            </div>
          </div>

          {canCreateProposal && (
            <Button type="primary" icon={<PlusOutlined />} className="pp-create-btn" onClick={openCreate} block>
              Create Section
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              {views.map((v) => {
                const active = savedView === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    className={`pp-view-item ${active ? 'is-active' : ''}`}
                    onClick={() => { setSavedView(v.key); setTablePage(1); }}
                  >
                    <span className="pp-view-icon" style={{ color: active ? v.color : 'var(--text-slate-400)' }}>{v.icon}</span>
                    <span className="pp-view-label">{v.label}</span>
                    <span className="pp-view-count">{v.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="pp-side-section-label">Categories</div>
            <div className="pp-side-list">
              <button
                type="button"
                className={`pp-view-item ${catFilter === null ? 'is-active' : ''}`}
                onClick={() => { setCatFilter(null); setTablePage(1); }}
              >
                <span className="pp-view-icon" style={{ color: catFilter === null ? '#3B82F6' : 'var(--text-slate-400)' }}><AppstoreOutlined /></span>
                <span className="pp-view-label">All Categories</span>
                <span className="pp-view-count">{activeCount}</span>
              </button>
              {CATEGORY_ORDER.map((c) => {
                const n = catCounts[c] || 0;
                if (n === 0 && c === 'Custom') return null;
                const active = catFilter === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`pp-view-item ${active ? 'is-active' : ''}`}
                    onClick={() => { setCatFilter(active ? null : c); setTablePage(1); }}
                  >
                    <span className="pp-view-icon" style={{ color: active ? CATEGORY_META[c].color : 'var(--text-slate-400)' }}>{CATEGORY_META[c].icon}</span>
                    <span className="pp-view-label">{CATEGORY_META[c].label}</span>
                    <span className="pp-view-count">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <button type="button" className="pp-trash" onClick={() => router.push('/proposals/templates')}>
            <LayoutOutlined /> Template Library
          </button>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          <div className="pp-topbar">
            <button 
              type="button" 
              className="pp-mobile-toggle"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <MenuOutlined />
            </button>
            <div className="pp-search-wrap">
              <SearchOutlined className="pp-search-icon" />
              <input
                className="pp-search"
                placeholder="Search sections, types, categories…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{activeCount}</strong> sections</span>
              <span className="pp-meta-dot">·</span>
              <span className="pp-meta-item"><strong>{globalCount}</strong> global</span>
              <span className="pp-meta-dot">·</span>
              <span className="pp-meta-item"><strong>{templates.filter((t) => !t.archived).length}</strong> templates</span>
            </div>

            <div className="pp-topbar-actions">
              <div className="pp-segmented">
                <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="pp-ghost-btn" onClick={handleRefresh} disabled={sectionsLoading}>
                  <ReloadOutlined spin={sectionsLoading} />
                </button>
              </Tooltip>
              <Tooltip title="Manage templates">
                <button type="button" className="pp-ghost-btn" onClick={() => router.push('/proposals/templates')}><LayoutOutlined /></button>
              </Tooltip>
            </div>
          </div>

          <div className="pp-divider" />

          {/* Stat cards */}
          <div className="pp-stats">
            {statCells.map((s, i) => (
              <div key={s.key} className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                    <span className="pp-stat-label">{s.title}</span>
                  </div>
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{s.value}</span>
                  </div>
                  <div className="pp-stat-spark"><AreaSparkline values={trendFor(i + s.value)} color={s.color} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid of section cards */}
          <div className="pp-body">
            {view === 'list' ? (
              <div className="pp-table-wrap" style={{ borderRadius: 0, background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)' }}>
                <Table
                  columns={tableColumns}
                  dataSource={paged}
                  rowKey="id"
                  size="small"
                  className="pp-table"
                  scroll={{ x: 'max-content' }}
                  pagination={false}
                  locale={{ emptyText: <NoData description={emptyState} /> }}
                  onRow={(record) => ({
                    onClick: (e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest('.ant-dropdown-trigger, button')) return;
                      openEdit(record);
                    }
                  })}
                  rowClassName="pp-row"
                />
              </div>
            ) : (
              <div className="pp-grid">
                {sectionsLoading && !sectionsLoaded ? (
                  <div className="pp-grid-loading" style={{ gridColumn: '1 / -1' }}>Loading sections…</div>
                ) : paged.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1' }}><NoData description={emptyState} /></div>
                ) : paged.map((s) => {
                  const meta = typeMeta(s.type);
                  const grad = gradientForColor(meta.color);
                  const used = usageCount[s.id] || 0;
                  return (
                    <div key={s.id} className="pc-card" onClick={() => openEdit(s)}>
                      <div className="pc-top">
                        <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${grad[0]} 0%, ${grad[1]} 100%)` }}>
                          {meta.icon}
                        </div>
                        <div className="pc-identity-body">
                          <div className="pc-title">{s.name}</div>
                          <div className="pc-client-line">
                            <span className="pc-client-key">Category:</span>
                            <span className="pc-client-val">{CATEGORY_META[s.category].label}</span>
                          </div>
                        </div>
                        <Dropdown menu={actionMenu(s)} overlayClassName="pp-action-pop" trigger={['click']} placement="bottomRight">
                          <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                            <EllipsisOutlined />
                          </button>
                        </Dropdown>
                      </div>

                      <div className="pc-foot">
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Type:</span>
                            <span className="pc-status-tag" style={{ color: meta.color, background: meta.bg }}>
                              {meta.icon}{meta.label}
                            </span>
                          </span>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Scope:</span>
                            {s.isGlobal
                              ? <span className="pc-status-tag" style={{ color: '#2563eb', background: 'rgba(37,99,235,0.12)' }}><GlobalOutlined />Global</span>
                              : <span className="pc-foot-val" style={{ color: '#94a3b8' }}>Standard</span>}
                          </span>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Updated</span>
                            <span className="pc-foot-val">{dayjs(s.updatedAt).format('MMM D, YYYY')}</span>
                          </span>
                        </div>
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Used:</span>
                            <span className="pc-foot-val" style={{ color: used > 0 ? '#059669' : '#94a3b8' }}>
                              {used > 0 ? `${used} template${used > 1 ? 's' : ''}` : 'Not used'}
                            </span>
                          </span>
                          {s.archived && (
                            <>
                              <span className="pc-foot-div" />
                              <span className="pc-status-tag" style={{ color: '#64748b', background: 'rgba(148,163,184,0.18)' }}>Archived</span>
                            </>
                          )}
                          <span className="pc-foot-div" />
                          <button type="button" className="pc-foot-item pc-view-btn" onClick={(e) => { e.stopPropagation(); openEdit(s); }}>
                            <EditOutlined /> Edit
                          </button>
                          <span className="pc-foot-div" />
                          <button type="button" className="pc-foot-item pc-timeline-btn" onClick={async (e) => { e.stopPropagation(); try { await duplicateSection(s.id); messageApi.success('Section duplicated'); } catch (err: any) { messageApi.error(err?.message || 'Duplicate failed'); } }}>
                            <CopyOutlined /> <span className="pc-timeline-view">Duplicate</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {total > 0 && (
            <div className="pp-footer pp-footer--sticky">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
              </div>
              <div className="pp-pager">
                <button type="button" className="pp-pager-btn" disabled={safePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`pp-pager-num ${p === safePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
                ))}
                <button type="button" className="pp-pager-btn" disabled={safePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
                <Select
                  className="pp-pagesize"
                  value={tablePageSize}
                  onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
                  options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Advanced section composer ───────────────────────────────────── */}
      <SectionComposerDrawer
        open={composerOpen}
        initial={editing}
        onClose={() => setComposerOpen(false)}
        onSave={handleComposerSave}
      />
    </>
  );
}

export default function SectionsPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <SectionsContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
