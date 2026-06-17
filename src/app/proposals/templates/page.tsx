'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Button, Input, Modal, Dropdown, message, Empty, Tooltip, Select,
} from 'antd';
import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, SearchOutlined, EllipsisOutlined, EditOutlined, CopyOutlined,
  InboxOutlined, DeleteOutlined, RollbackOutlined, EyeOutlined, ArrowRightOutlined,
  ArrowUpOutlined, ArrowDownOutlined, CloseOutlined, AppstoreOutlined, UnorderedListOutlined,
  BlockOutlined, FolderOpenOutlined, FileDoneOutlined, FileTextOutlined,
} from '@ant-design/icons';
import { LayoutTemplate } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { CATEGORY_META, typeMeta } from '@/components/proposals/library/sectionMeta';
import { THEME_PRESETS, resolveTheme } from '@/components/proposals/themePresets';
import { nanoid } from 'nanoid';
import {
  useProposalLibraryStore, LibraryTemplate, LibrarySection, blockTypeForSectionType,
} from '@/store/proposalLibraryStore';
import { usePermission } from '@/hooks/usePermission';
import { useActivitySource } from '@/hooks/useActivitySource';
import '../library.css';

type SavedView = 'all' | 'archived';
const PAGE_SIZE_OPTIONS = [12, 24, 48];

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
  useEffect(() => { fetchSections(); }, [fetchSections]);
  const createTemplate = useProposalLibraryStore((s) => s.createTemplate);
  const updateTemplate = useProposalLibraryStore((s) => s.updateTemplate);
  const duplicateTemplate = useProposalLibraryStore((s) => s.duplicateTemplate);
  const archiveTemplate = useProposalLibraryStore((s) => s.archiveTemplate);
  const deleteTemplate = useProposalLibraryStore((s) => s.deleteTemplate);

  const sectionById = useMemo(() => {
    const m = new Map<string, LibrarySection>();
    sections.forEach((s) => m.set(s.id, s));
    return m;
  }, [sections]);

  const [searchText, setSearchText] = useState('');
  const [savedView, setSavedView] = useState<SavedView>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(12);

  // ── Builder modal state ──────────────────────────────────────────────
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editing, setEditing] = useState<LibraryTemplate | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplTheme, setTplTheme] = useState('azure');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerSearch, setPickerSearch] = useState('');

  const [previewTpl, setPreviewTpl] = useState<LibraryTemplate | null>(null);

  const activeCount = templates.filter((t) => !t.archived).length;
  const archivedCount = templates.filter((t) => t.archived).length;
  const avgSections = activeCount
    ? Math.round(templates.filter((t) => !t.archived).reduce((a, t) => a + t.sectionIds.length, 0) / activeCount)
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

  const openCreate = () => {
    setEditing(null);
    setTplName(''); setTplDesc(''); setTplTheme('azure'); setSelectedIds([]); setPickerSearch('');
    setBuilderOpen(true);
  };
  const openEdit = (t: LibraryTemplate) => {
    setEditing(t);
    setTplName(t.name); setTplDesc(t.description || ''); setTplTheme(t.themeId);
    setSelectedIds([...t.sectionIds]); setPickerSearch('');
    setBuilderOpen(true);
  };

  const addSection = (id: string) => setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const removeSel = (id: string) => setSelectedIds((prev) => prev.filter((x) => x !== id));
  const move = (idx: number, dir: -1 | 1) => {
    setSelectedIds((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const saveTemplate = () => {
    if (!tplName.trim()) { messageApi.warning('Give the template a name'); return; }
    if (selectedIds.length === 0) { messageApi.warning('Add at least one section'); return; }
    if (editing) {
      updateTemplate(editing.id, { name: tplName.trim(), description: tplDesc, themeId: tplTheme, sectionIds: selectedIds });
      messageApi.success('Template updated');
    } else {
      createTemplate({ name: tplName.trim(), description: tplDesc, themeId: tplTheme, sectionIds: selectedIds });
      messageApi.success('Template created');
    }
    setBuilderOpen(false);
  };

  const useTemplate = (t: LibraryTemplate) => {
    const blocks = t.sectionIds
      .map((id) => sectionById.get(id))
      .filter(Boolean)
      .map((sec) => ({ id: nanoid(), type: blockTypeForSectionType(sec!.type), data: { ...(sec!.data || {}) } }));
    if (blocks.length === 0) {
      messageApi.warning('This template has no available sections');
      return;
    }
    sessionStorage.setItem('pending_template_blocks', JSON.stringify({ blocks, themeId: t.themeId, fontId: t.fontId, name: t.name }));
    router.push('/proposals/builder');
  };

  const cardMenu = (t: LibraryTemplate): MenuProps => ({
    items: [
      { key: 'preview', label: <MenuItem icon={<EyeOutlined />} tint="rgba(59,130,246,0.10)" color="#3B82F6" title="Preview" desc="See the section order" /> },
      canCreateProposal ? { key: 'use', label: <MenuItem icon={<ArrowRightOutlined />} tint="rgba(5,150,105,0.10)" color="#059669" title="Use Template" desc="Start a proposal from this" /> } : null,
      canUpdateProposal ? { key: 'edit', label: <MenuItem icon={<EditOutlined />} tint="rgba(37,99,235,0.10)" color="#2563eb" title="Edit" desc="Rename, reorder, retheme" /> } : null,
      canCreateProposal ? { key: 'duplicate', label: <MenuItem icon={<CopyOutlined />} tint="rgba(100,116,139,0.10)" color="#475569" title="Duplicate" desc="Create an editable copy" /> } : null,
      canUpdateProposal ? {
        key: 'archive',
        label: <MenuItem icon={t.archived ? <RollbackOutlined /> : <InboxOutlined />} tint="rgba(100,116,139,0.10)" color="#64748b" title={t.archived ? 'Restore' : 'Archive'} desc={t.archived ? 'Bring back to the library' : 'Hide from the list'} />,
      } : null,
      (canDeleteProposal && !t.system) ? { type: 'divider' } : null,
      (canDeleteProposal && !t.system) ? { key: 'delete', danger: true, label: <MenuItem icon={<DeleteOutlined />} tint="rgba(239,68,68,0.10)" color="#ef4444" title="Delete" desc="Permanently remove" /> } : null,
    ].filter(Boolean) as MenuProps['items'],
    onClick: ({ key, domEvent }) => {
      domEvent.stopPropagation();
      if (key === 'preview') setPreviewTpl(t);
      else if (key === 'use') useTemplate(t);
      else if (key === 'edit') openEdit(t);
      else if (key === 'duplicate') { duplicateTemplate(t.id); messageApi.success('Template duplicated'); }
      else if (key === 'archive') { archiveTemplate(t.id, !t.archived); messageApi.success(t.archived ? 'Template restored' : 'Template archived'); }
      else if (key === 'delete') {
        Modal.confirm({
          title: 'Delete template?', content: `"${t.name}" will be permanently removed.`,
          okText: 'Delete', okType: 'danger', cancelText: 'Cancel',
          onOk: () => { deleteTemplate(t.id); messageApi.success('Template deleted'); },
        });
      }
    },
  });

  const pickerSections = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return sections.filter((s) => !s.archived && (!q || `${s.name} ${s.category}`.toLowerCase().includes(q)));
  }, [sections, pickerSearch]);

  const statCells = [
    { key: 'active', title: 'Active Templates', value: activeCount, icon: <AppstoreOutlined />, color: '#3B82F6', tint: 'var(--bg-blue-50)' },
    { key: 'avg', title: 'Avg. Sections', value: avgSections, icon: <BlockOutlined />, color: '#2563eb', tint: 'rgba(37,99,235,0.10)' },
    { key: 'lib', title: 'Section Library', value: sectionCount, icon: <FolderOpenOutlined />, color: '#059669', tint: 'rgba(5,150,105,0.10)' },
    { key: 'arch', title: 'Archived', value: archivedCount, icon: <InboxOutlined />, color: '#475569', tint: 'rgba(71,85,105,0.10)' },
  ];

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><LayoutTemplate size={26} /></div>
      <div className="pp-empty-title">{savedView === 'archived' ? 'No archived templates' : 'No templates yet'}</div>
      <div className="pp-empty-sub">{savedView === 'archived' ? 'Archived templates appear here.' : 'Compose a template from your section library.'}</div>
      {canCreateProposal && savedView !== 'archived' && (
        <Button type="primary" icon={<PlusOutlined />} className="pp-btn-primary" onClick={openCreate} style={{ marginTop: 14 }}>Create Template</Button>
      )}
    </div>
  );

  return (
    <>
      {holder}
      <div className="pp-shell">
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
              Create Template
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
            <div className="pp-search-wrap">
              <SearchOutlined className="pp-search-icon" />
              <input className="pp-search" placeholder="Search templates…" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{activeCount}</strong> templates</span>
              <span className="pp-meta-dot">·</span>
              <span className="pp-meta-item"><strong>{avgSections}</strong> avg sections</span>
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
                const secs = t.sectionIds.map((id) => sectionById.get(id)).filter(Boolean) as LibrarySection[];
                return (
                  <div key={t.id} className="pc-card" onClick={() => setPreviewTpl(t)}>
                    <div className="pc-top">
                      <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}>
                        <LayoutTemplate size={15} />
                      </div>
                      <div className="pc-identity-body">
                        <div className="pc-title">{t.name}</div>
                        <div className="pc-client-line">
                          <span className="pc-client-key">Sections:</span>
                          <span className="pc-client-val">{t.sectionIds.length}</span>
                        </div>
                      </div>
                      <Dropdown menu={cardMenu(t)} overlayClassName="pp-action-pop" trigger={['click']} placement="bottomRight">
                        <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}><EllipsisOutlined /></button>
                      </Dropdown>
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
                        {secs.slice(0, 3).map((s) => <span key={s.id} className="lib-tpl__seq-chip">{s.name}</span>)}
                        {secs.length > 3 && <span className="lib-tpl__seq-chip">+{secs.length - 3}</span>}
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

      {/* ── Template Builder ─────────────────────────────────────────────── */}
      <Modal
        title={editing ? 'Edit Template' : 'Create Template'}
        open={builderOpen}
        onCancel={() => setBuilderOpen(false)}
        onOk={saveTemplate}
        okText={editing ? 'Save Template' : 'Create Template'}
        width={860}
        destroyOnClose
      >
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, marginTop: 6 }}>
          <Input placeholder="Template name" value={tplName} onChange={(e) => setTplName(e.target.value)} style={{ flex: 2 }} />
          <SearchableDropdown
            triggerLabel="Theme"
            value={tplTheme}
            onChange={(v) => v && setTplTheme(v)}
            allowClear={false}
            searchPlaceholder="Search themes"
            itemNoun="themes"
            width={200}
            style={{ flex: 1 }}
            options={THEME_PRESETS.map((p) => ({
              value: p.id,
              label: p.label,
              badge: <span style={{ width: 16, height: 16, borderRadius: 4, display: 'block', background: `linear-gradient(135deg, ${p.from}, ${p.to})` }} />,
            }))}
          />
        </div>
        <Input.TextArea placeholder="Short description" value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} autoSize={{ minRows: 1, maxRows: 2 }} style={{ marginBottom: 14 }} />

        <div className="tpl-build">
          <div className="tpl-build__col">
            <div className="tpl-build__col-head">
              <span>Available Sections</span>
              <Input size="small" allowClear prefix={<SearchOutlined style={{ color: '#94a3b8' }} />} placeholder="Filter" value={pickerSearch} onChange={(e) => setPickerSearch(e.target.value)} style={{ width: 130 }} />
            </div>
            <div className="tpl-build__list">
              {pickerSections.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No sections" style={{ marginTop: 40 }} />
              ) : pickerSections.map((s) => {
                const meta = typeMeta(s.type);
                const isSel = selectedIds.includes(s.id);
                return (
                  <div key={s.id} className={`tpl-pick ${isSel ? 'is-selected' : ''}`} onClick={() => (isSel ? removeSel(s.id) : addSection(s.id))}>
                    <div className="tpl-pick__ic" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="tpl-pick__name">{s.name}</div>
                      <div className="tpl-pick__cat">{CATEGORY_META[s.category].label} · {meta.label}</div>
                    </div>
                    {isSel ? <CloseOutlined style={{ color: '#94a3b8' }} /> : <PlusOutlined style={{ color: '#2563eb' }} />}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="tpl-build__col">
            <div className="tpl-build__col-head">
              <span>Selected Sections</span>
              <span style={{ color: '#94a3b8', fontWeight: 600 }}>{selectedIds.length}</span>
            </div>
            <div className="tpl-build__list">
              {selectedIds.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Pick sections from the left" style={{ marginTop: 40 }} />
              ) : selectedIds.map((id, idx) => {
                const s = sectionById.get(id);
                if (!s) return null;
                const meta = typeMeta(s.type);
                return (
                  <div key={id} className="tpl-pick is-selected">
                    <span className="tpl-pick__idx">{idx + 1}</span>
                    <div className="tpl-pick__ic" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="tpl-pick__name">{s.name}</div>
                      <div className="tpl-pick__cat">{CATEGORY_META[s.category].label}</div>
                    </div>
                    <Button type="text" size="small" icon={<ArrowUpOutlined />} disabled={idx === 0} onClick={() => move(idx, -1)} />
                    <Button type="text" size="small" icon={<ArrowDownOutlined />} disabled={idx === selectedIds.length - 1} onClick={() => move(idx, 1)} />
                    <Button type="text" size="small" danger icon={<CloseOutlined />} onClick={() => removeSel(id)} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Preview ──────────────────────────────────────────────────────── */}
      <Modal
        title={previewTpl ? `Preview · ${previewTpl.name}` : 'Preview'}
        open={!!previewTpl}
        onCancel={() => setPreviewTpl(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewTpl(null)}>Close</Button>,
          canCreateProposal && previewTpl ? (
            <Button key="use" type="primary" icon={<ArrowRightOutlined />} onClick={() => useTemplate(previewTpl)}>Use Template</Button>
          ) : null,
        ]}
      >
        {previewTpl && (
          <div style={{ marginTop: 6 }}>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 14 }}>{previewTpl.description}</div>
            {previewTpl.sectionIds.map((id, idx) => {
              const s = sectionById.get(id);
              if (!s) return null;
              const meta = typeMeta(s.type);
              return (
                <div key={id} className="tpl-pick" style={{ cursor: 'default' }}>
                  <span className="tpl-pick__idx">{idx + 1}</span>
                  <div className="tpl-pick__ic" style={{ background: meta.bg, color: meta.color }}>{meta.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="tpl-pick__name">{s.name}</div>
                    <div className="tpl-pick__cat">{CATEGORY_META[s.category].label} · {meta.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
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
