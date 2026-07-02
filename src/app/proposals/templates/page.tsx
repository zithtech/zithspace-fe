'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Button, Dropdown, message, Select, Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, SearchOutlined, EllipsisOutlined, EditOutlined, CopyOutlined,
  InboxOutlined, DeleteOutlined, RollbackOutlined, EyeOutlined, ArrowRightOutlined,
  AppstoreOutlined, UnorderedListOutlined, MenuOutlined,
  BlockOutlined, FolderOpenOutlined, FileDoneOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { LayoutTemplate } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { resolveTheme } from '@/components/proposals/themePresets';
import { nanoid } from 'nanoid';
import {
  useProposalLibraryStore, LibraryTemplate, LibrarySection, blockTypeForSectionType,
} from '@/store/proposalLibraryStore';
import { usePermission } from '@/hooks/usePermission';
import { useActivitySource } from '@/hooks/useActivitySource';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import TemplatePreviewModal from '@/components/proposals/TemplatePreviewModal';
import '../library.css';

type SavedView = 'all' | 'archived';
const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

const BLOCK_TYPE_LABEL: Record<string, string> = {
  cover: 'Cover', text: 'Text', section: 'Section', pricing: 'Pricing',
  scope: 'Scope', timeline: 'Timeline', signature: 'Signature', component: 'Component',
};
const blockLabel = (b: any): string =>
  (b?.data?.heading || b?.data?.title || BLOCK_TYPE_LABEL[b?.type] || 'Block');

const trendFor = (seed: number): number[] =>
  Array.from({ length: 8 }, (_, i) => 3 + ((seed * 7 + i * i * 5) % 11));

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96, h = 34;
  const max = Math.max(...values, 1);
  const stepX = values.length > 1 ? w / (values.length - 1) : w;
  const pts = values.map((v, i) => [i * stepX, h - 3 - (v / max) * (h - 8)] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `tspk-${color.replace(/[^a-z0-9]/gi, '')}`;
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

function TemplatesContent() {
  useActivitySource({ section: 'WORK', module: 'Proposals', page: 'TemplateLibrary' });
  const router = useRouter();
  const [messageApi, holder] = message.useMessage();
  const { canCreateProposal, canUpdateProposal, canDeleteProposal } = usePermission();

  const templates = useProposalLibraryStore((s) => s.templates);
  const sections = useProposalLibraryStore((s) => s.sections);
  const fetchSections = useProposalLibraryStore((s) => s.fetchSections);
  const fetchTemplates = useProposalLibraryStore((s) => s.fetchTemplates);
  useEffect(() => { fetchSections(); fetchTemplates(true); }, [fetchSections, fetchTemplates]);
  const duplicateTemplate = useProposalLibraryStore((s) => s.duplicateTemplate);
  const archiveTemplate = useProposalLibraryStore((s) => s.archiveTemplate);
  const deleteTemplate = useProposalLibraryStore((s) => s.deleteTemplate);

  const sectionById = useMemo(() => {
    const m = new Map<string, LibrarySection>();
    sections.forEach((s) => m.set(s.id, s));
    return m;
  }, [sections]);

  // A template's content count = composed blocks (legacy templates fall back to section refs).
  const blockCount = (t: LibraryTemplate): number => (t.blocks?.length ?? t.sectionIds?.length ?? 0);
  const chipLabels = (t: LibraryTemplate): string[] =>
    (t.blocks?.length
      ? t.blocks.map(blockLabel)
      : (t.sectionIds || []).map((id) => sectionById.get(id)?.name).filter(Boolean) as string[]);

  const [searchText, setSearchText] = useState('');
  const [savedView, setSavedView] = useState<SavedView>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [previewTpl, setPreviewTpl] = useState<LibraryTemplate | null>(null);

  const handleDeleteTemplate = async (t: LibraryTemplate) => {
    try {
      await deleteTemplate(t.id);
      messageApi.success('Template deleted');
    } catch (e: any) {
      messageApi.error(e?.message || 'Failed to delete template');
      throw e; // keep the confirm popover open on failure
    }
  };

  const activeCount = templates.filter((t) => !t.archived).length;
  const archivedCount = templates.filter((t) => t.archived).length;
  const avgBlocks = activeCount
    ? Math.round(templates.filter((t) => !t.archived).reduce((a, t) => a + blockCount(t), 0) / activeCount)
    : 0;
  const sectionCount = sections.filter((s) => !s.archived).length;

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return templates.filter((t) => {
      if (savedView === 'archived') { if (!t.archived) return false; }
      else if (t.archived) return false;
      if (q && !`${t.name} ${t.description || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [templates, searchText, savedView]);

  const total = filtered.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const safePage = Math.min(tablePage, pageCount);
  const pageStart = total === 0 ? 0 : (safePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(safePage * tablePageSize, total);
  const paged = filtered.slice((safePage - 1) * tablePageSize, safePage * tablePageSize);

  const views: { key: SavedView; label: string; icon: React.ReactNode; color: string; count: number }[] = [
    { key: 'all', label: 'All Templates', icon: <AppstoreOutlined />, color: '#3B82F6', count: activeCount },
    { key: 'archived', label: 'Archived', icon: <InboxOutlined />, color: '#64748b', count: archivedCount },
  ];

  // "New Template" / "Edit" now open the full proposal builder in template mode,
  // where the user composes with sections AND components, then saves.
  const openCreate = () => router.push('/proposals/builder?template=1');
  const openEdit = (t: LibraryTemplate) => router.push(`/proposals/builder?templateId=${t.id}`);

  const useTemplate = (t: LibraryTemplate) => {
    const blocks = (t.blocks && t.blocks.length)
      ? t.blocks.map((b) => ({ ...b, id: nanoid() }))
      : (t.sectionIds || [])
          .map((id) => sectionById.get(id))
          .filter(Boolean)
          .map((sec) => ({ id: nanoid(), type: blockTypeForSectionType(sec!.type), data: { ...(sec!.data || {}) } }));
    if (blocks.length === 0) {
      messageApi.warning('This template is empty');
      return;
    }
    sessionStorage.setItem('pending_template_blocks', JSON.stringify({ blocks, themeId: t.themeId, fontId: t.fontId, name: t.name }));
    router.push('/proposals/builder');
  };

  const cardMenu = (t: LibraryTemplate): MenuProps => ({
    items: [
      { key: 'preview', label: <MenuItem icon={<EyeOutlined />} tint="rgba(59,130,246,0.10)" color="#3B82F6" title="Preview" desc="See the block layout" /> },
      canCreateProposal ? { key: 'use', label: <MenuItem icon={<ArrowRightOutlined />} tint="rgba(5,150,105,0.10)" color="#059669" title="Use Template" desc="Start a proposal from this" /> } : null,
      canUpdateProposal ? { key: 'edit', label: <MenuItem icon={<EditOutlined />} tint="rgba(37,99,235,0.10)" color="#2563eb" title="Edit" desc="Open in the builder" /> } : null,
      canCreateProposal ? { key: 'duplicate', label: <MenuItem icon={<CopyOutlined />} tint="rgba(100,116,139,0.10)" color="#475569" title="Duplicate" desc="Create an editable copy" /> } : null,
      canUpdateProposal ? {
        key: 'archive',
        label: <MenuItem icon={t.archived ? <RollbackOutlined /> : <InboxOutlined />} tint="rgba(100,116,139,0.10)" color="#64748b" title={t.archived ? 'Restore' : 'Archive'} desc={t.archived ? 'Bring back to the library' : 'Hide from the list'} />,
      } : null,
    ].filter(Boolean) as MenuProps['items'],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === 'preview') setPreviewTpl(t);
      else if (key === 'use') useTemplate(t);
      else if (key === 'edit') openEdit(t);
      else if (key === 'duplicate') {
        duplicateTemplate(t.id)
          .then(() => messageApi.success('Template duplicated'))
          .catch((e: any) => messageApi.error(e?.message || 'Failed to duplicate template'));
      } else if (key === 'archive') {
        archiveTemplate(t.id, !t.archived)
          .then(() => messageApi.success(t.archived ? 'Template restored' : 'Template archived'))
          .catch((e: any) => messageApi.error(e?.message || 'Failed to update template'));
      }
    },
  });

  const statCells = [
    { key: 'active', title: 'Active Templates', value: activeCount, icon: <AppstoreOutlined />, color: '#3B82F6', tint: 'var(--bg-blue-50)' },
    { key: 'avg', title: 'Avg. Blocks', value: avgBlocks, icon: <BlockOutlined />, color: '#2563eb', tint: 'rgba(37,99,235,0.10)' },
    { key: 'lib', title: 'Section Library', value: sectionCount, icon: <FolderOpenOutlined />, color: '#059669', tint: 'rgba(5,150,105,0.10)' },
    { key: 'arch', title: 'Archived', value: archivedCount, icon: <InboxOutlined />, color: '#475569', tint: 'rgba(71,85,105,0.10)' },
  ];

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><LayoutTemplate size={26} /></div>
      <div className="pp-empty-title">{savedView === 'archived' ? 'No archived templates' : 'No templates yet'}</div>
      <div className="pp-empty-sub">{savedView === 'archived' ? 'Archived templates appear here.' : 'Build one in the proposal builder, then save it as a template.'}</div>
      {canCreateProposal && savedView !== 'archived' && (
        <Button type="primary" icon={<PlusOutlined />} className="pp-btn-primary" onClick={openCreate} style={{ marginTop: 14 }}>New Template</Button>
      )}
    </div>
  );

  return (
    <>
      {holder}
      <div className={`pp-shell ${isMobileSidebarOpen ? 'is-mobile-open' : ''}`}>
        <div className="pp-backdrop" onClick={() => setIsMobileSidebarOpen(false)} />
        {/* ============================ SIDEBAR ============================ */}
        <aside className="pp-sidebar">
          <div className="pp-side-head">
            <div className="pp-side-logo"><LayoutTemplate size={22} /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Templates</div>
              <div className="pp-side-subtitle">Reusable blueprints</div>
            </div>
          </div>

          {canCreateProposal && (
            <Button type="primary" icon={<PlusOutlined />} className="pp-create-btn" onClick={openCreate} block>
              New Template
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              {views.map((v) => {
                const active = savedView === v.key;
                return (
                  <button key={v.key} type="button" className={`pp-view-item ${active ? 'is-active' : ''}`} onClick={() => { setSavedView(v.key); setTablePage(1); }}>
                    <span className="pp-view-icon" style={{ color: active ? v.color : 'var(--text-slate-400)' }}>{v.icon}</span>
                    <span className="pp-view-label">{v.label}</span>
                    <span className="pp-view-count">{v.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="pp-side-section-label">Library</div>
            <div className="pp-side-list">
              <button type="button" className="pp-view-item" onClick={() => router.push('/proposals/sections')}>
                <span className="pp-view-icon" style={{ color: '#059669' }}><BlockOutlined /></span>
                <span className="pp-view-label">Section Library</span>
                <span className="pp-view-count">{sectionCount}</span>
              </button>
              <button type="button" className="pp-view-item" onClick={() => router.push('/proposals')}>
                <span className="pp-view-icon" style={{ color: 'var(--text-slate-400)' }}><FileTextOutlined /></span>
                <span className="pp-view-label">All Proposals</span>
              </button>
            </div>
          </div>

          <button type="button" className="pp-trash" onClick={() => router.push('/proposals/builder')}>
            <FileDoneOutlined /> Open Builder
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
              <input className="pp-search" placeholder="Search templates…" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{activeCount}</strong> templates</span>
              <span className="pp-meta-dot">·</span>
              <span className="pp-meta-item"><strong>{avgBlocks}</strong> avg blocks</span>
            </div>
            <div className="pp-topbar-actions">
              <div className="pp-segmented">
                <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
              </div>
              <Tooltip title="Section library">
                <button type="button" className="pp-ghost-btn" onClick={() => router.push('/proposals/sections')}><BlockOutlined /></button>
              </Tooltip>
            </div>
          </div>

          <div className="pp-divider" />

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
                  <div className="pp-stat-value-wrap"><span className="pp-stat-value">{s.value}</span></div>
                  <div className="pp-stat-spark"><AreaSparkline values={trendFor(i + s.value)} color={s.color} /></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pp-body">
            <div className="pp-grid" style={view === 'list' ? { gridTemplateColumns: '1fr' } : undefined}>
              {paged.length === 0 ? (
                <div style={{ gridColumn: '1 / -1' }}>{emptyState}</div>
              ) : paged.map((t) => {
                const theme = resolveTheme(t.themeId);
                const chips = chipLabels(t);
                return (
                  <div key={t.id} className="pc-card" onClick={() => setPreviewTpl(t)}>
                    <div className="pc-top">
                      <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}>
                        <LayoutTemplate size={15} />
                      </div>
                      <div className="pc-identity-body">
                        <div className="pc-title">{t.name}</div>
                        <div className="pc-client-line">
                          <span className="pc-client-key">Blocks:</span>
                          <span className="pc-client-val">{blockCount(t)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                        {canDeleteProposal && !t.system && (
                          <ConfirmDialog
                            tone="danger"
                            icon={<DeleteOutlined />}
                            title="Delete template?"
                            description={`"${t.name}" will be permanently removed. Proposals already created from it are not affected.`}
                            confirmText="Delete"
                            placement="bottomRight"
                            onConfirm={() => handleDeleteTemplate(t)}
                          >
                            <button type="button" className="pc-actions" title="Delete" style={{ color: '#ef4444' }}><DeleteOutlined /></button>
                          </ConfirmDialog>
                        )}
                        <Dropdown menu={cardMenu(t)} overlayClassName="pp-action-pop" trigger={['click']} placement="bottomRight">
                          <button type="button" className="pc-actions"><EllipsisOutlined /></button>
                        </Dropdown>
                      </div>
                    </div>
                    <div className="pc-foot">
                      <div className="pc-foot-row">
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Theme</span>
                          <span style={{ width: 12, height: 12, borderRadius: 3, background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`, display: 'inline-block' }} />
                          <span className="pc-foot-val">{theme.label}</span>
                        </span>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Updated</span>
                          <span className="pc-foot-val">{t.updatedAt ? dayjs(t.updatedAt).format('MMM D, YYYY') : '—'}</span>
                        </span>
                      </div>
                      <div className="pc-foot-row">
                        {chips.slice(0, 3).map((label, i) => <span key={i} className="lib-tpl__seq-chip">{label}</span>)}
                        {chips.length > 3 && <span className="lib-tpl__seq-chip">+{chips.length - 3}</span>}
                      </div>
                      <div className="pc-foot-row">
                        <button type="button" className="pc-foot-item pc-view-btn" onClick={(e) => { e.stopPropagation(); setPreviewTpl(t); }}>
                          <EyeOutlined /> Preview
                        </button>
                        {canCreateProposal && (
                          <>
                            <span className="pc-foot-div" />
                            <button type="button" className="pc-foot-item pc-view-btn" onClick={(e) => { e.stopPropagation(); useTemplate(t); }}>
                              <ArrowRightOutlined /> Use Template
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {total > 0 && (
            <div className="pp-footer pp-footer--sticky">
              <div className="pp-footer-info">Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong></div>
              <div className="pp-pager">
                <button type="button" className="pp-pager-btn" disabled={safePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`pp-pager-num ${p === safePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
                ))}
                <button type="button" className="pp-pager-btn" disabled={safePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
                <Select className="pp-pagesize" value={tablePageSize} onChange={(v) => { setTablePageSize(v); setTablePage(1); }} options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))} popupMatchSelectWidth={120} />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Premium Preview ──────────────────────────────────────────────── */}
      <TemplatePreviewModal
        open={!!previewTpl}
        template={previewTpl}
        canEdit={canUpdateProposal}
        canUse={canCreateProposal}
        onClose={() => setPreviewTpl(null)}
        onEdit={(t) => openEdit(t)}
        onUse={(t) => useTemplate(t)}
      />
    </>
  );
}

export default function TemplatesPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <TemplatesContent />
      </MainLayout>
    </ProtectedRoute>
  );
}
