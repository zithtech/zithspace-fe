'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Menu,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { LettersService, DocumentStructure } from '@/services/lettersService';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'react-hot-toast';
import { Table, Button, Tooltip, Select, Modal, Dropdown, Avatar } from 'antd';
import { LetterStatsCards, StatCellData } from '@/components/letters/LetterStatsCards';
import { SnippetsOutlined, FileTextOutlined, CheckCircleOutlined, StarOutlined, AppstoreOutlined, UnorderedListOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, MoreOutlined, EllipsisOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import ZukvoLoader from '@/components/common/ZukvoLoader';

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

const renderDropdownItem = (icon: React.ReactNode, title: string, subtitle: string, iconBg: string, iconColor: string, isDanger?: boolean) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px' }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '6px',
      background: iconBg, color: iconColor,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      {icon}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: isDanger ? 'var(--text-leave)' : 'var(--text-slate-900)', lineHeight: '1.2' }}>{title}</span>
      <span style={{ fontSize: '11px', color: 'var(--text-slate-600)', marginTop: '2px' }}>{subtitle}</span>
    </div>
  </div>
);

const initialsOf = (name?: string) => name ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : '';

export default function StructuresManagementPage() {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    if (perms.canReadLetterTemplate === false) {
      router.push('/dashboard');
    }
  }, [perms.canReadLetterTemplate, router]);

  const [structures, setStructures] = useState<DocumentStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'card'>('list');

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const [previewStructure, setPreviewStructure] = useState<DocumentStructure | null>(null);
  const [deleteStructId, setDeleteStructId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const structs = await LettersService.getStructures();
      setStructures(structs);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load structures');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteStructId) return;
    try {
      toast.loading('Deleting structure...', { id: 'del-struct' });
      await LettersService.deleteStructure(deleteStructId);
      toast.success('Structure deleted successfully!', { id: 'del-struct' });
      setStructures(structures.filter(s => s.id !== deleteStructId));
      setDeleteStructId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete structure', { id: 'del-struct' });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredStructures = useMemo(() => {
    if (!searchQuery) return structures;
    return structures.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [structures, searchQuery]);

  const total = filteredStructures.length;
  const pageCount = Math.ceil(total / tablePageSize) || 1;
  const paginatedStructures = filteredStructures.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);

  const statCells: StatCellData[] = useMemo(() => {
    const total = structures.length;
    const globalCount = structures.filter(s => s.tenantId === 'GLOBAL').length;
    const recentCount = structures.filter(s => {
      if (!s.createdAt && !s.updatedAt) return false;
      const d = new Date(s.createdAt || s.updatedAt);
      return (new Date().getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    const genericTrend = [0, 2, 4, 3, 5, 4, 7];

    return [
      { key: 'total', title: 'Total Structures', value: total, suffix: '', icon: <Layers size={18} />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: genericTrend, delta: total },
      { key: 'global', title: 'Global Structures', value: globalCount, suffix: '', icon: <StarOutlined />, color: '#8b5cf6', tint: 'rgba(139,92,246,0.10)', trend: genericTrend, delta: globalCount },
      { key: 'recent', title: 'New This Week', value: recentCount, suffix: '', icon: <FileTextOutlined />, color: '#f59e0b', tint: 'rgba(245,158,11,0.10)', trend: genericTrend, delta: recentCount },
      { key: 'active', title: 'Active Structures', value: total, suffix: '', icon: <CheckCircleOutlined />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: genericTrend, delta: total },
    ];
  }, [structures]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const columns: ColumnsType<DocumentStructure> = [
    {
      title: 'STRUCTURE NAME',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DocumentStructure) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} style={{ color: '#3b82f6' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>{text}</span>
          {record.tenantId === 'GLOBAL' && (
            <span style={{ background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
              GLOBAL
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'LAST UPDATED',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-slate-600)' }}>
          <Clock size={14} />
          {new Date(date).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: 'CREATED BY',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      render: (_: any, record: DocumentStructure) => {
        const creator = record.createdBy;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Avatar size={20} src={creator?.avatarUrl || creator?.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 10, fontWeight: 700 }}>
              {initialsOf(creator?.name || '—')}
            </Avatar>
            <span style={{ fontSize: '13px', color: 'var(--text-slate-700)', fontWeight: 500 }}>
              {creator?.name || '—'}
            </span>
          </div>
        );
      }
    },
    {
      title: 'ACTIONS',
      key: 'actions',
      align: 'center',
      width: 72,
      fixed: 'right',
      render: (_: any, record: DocumentStructure) => (
        <Dropdown
          overlayClassName="pp-action-pop"
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              { key: 'preview', label: renderDropdownItem(<Eye size={16} />, 'Preview', 'View structure contents', 'var(--bg-blue-50)', '#3b82f6'), onClick: ({ domEvent }) => { domEvent.stopPropagation(); setPreviewStructure(record); } },
              ...(record.tenantId !== 'GLOBAL' ? [
                { type: 'divider' as const },
                ...(perms.canUpdateLetterFormat ? [{ key: 'edit', label: renderDropdownItem(<Edit size={16} />, 'Edit', 'Open in the builder', 'var(--border-slate-100)', 'var(--text-slate-600)'), onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); router.push(`/letters-docs/structures/builder?editId=${record.id}`); } }] : []),
                ...(perms.canDeleteLetterFormat ? [{ key: 'delete', label: renderDropdownItem(<Trash2 size={16} />, 'Delete', 'Move to trash', 'var(--bg-red-50)', 'var(--text-leave)', true), onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); setDeleteStructId(record.id); } }] : []),
              ] : []),
            ]
          }}
        >
          <Button type="text" className="pp-icon-btn" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      )
    },
  ];

  return (
    <div className="template-mgmt-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
      {/* Sticky Header */}
      <div className="lv-header">
        <div className="lv-header-about">
          <button
            type="button"
            className="lv-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new Event('open-letters-sidebar'))}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="lv-header-icon">
            <Layers size={18} />
          </div>
          <div>
            <div className="lv-header-title">Custom Formats</div>
            <div className="lv-header-sub">
              Manage reusable HTML structures for templates.
            </div>
          </div>
        </div>
        <div className="lv-header-actions">
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '34px', width: '240px', borderRadius: '8px', background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)', padding: '0 10px' }}>
              <Search size={14} style={{ color: 'var(--text-slate-400)' }} />
              <input
                type="text"
                placeholder="Search structures..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', marginLeft: '9px', fontSize: '13px', color: 'var(--text-slate-900)' }}
              />
            </div>
            <button type="submit" style={{ display: 'none' }}>Search</button>
          </form>

          <div className="pp-segmented" style={{ marginRight: '8px' }}>
            <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
            <button type="button" className={view === 'card' ? 'is-active' : ''} onClick={() => setView('card')} aria-label="Card view"><AppstoreOutlined /></button>
          </div>

          <Tooltip title="Refresh">
            <button type="button" className="lv-ghost-btn" onClick={fetchData}><ReloadOutlined spin={loading} /></button>
          </Tooltip>

          {perms.canCreateLetterFormat && (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push('/letters-docs/structures/builder')}
              style={{ height: 34, borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              Create Format
            </Button>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 24px 32px', flex: 1, overflow: 'hidden', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

        <LetterStatsCards statCells={statCells} />

        {/* Structures List */}
        {loading ? (
          <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ZukvoLoader message="Loading custom structures..." size="md" fullscreen='viewport' />
          </div>
        ) : filteredStructures.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Layers size={48} style={{ color: 'var(--text-slate-300)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-slate-800)', marginBottom: '8px' }}>No Structures Found</div>
            <div style={{ color: 'var(--text-slate-500)', fontSize: '14px', marginBottom: '24px' }}>
              Create your first custom structure to reuse across document templates.
            </div>
            {perms.canCreateLetterFormat && (
              <Button type="primary" onClick={() => router.push('/letters-docs/structures/builder')} icon={<Plus size={15} />}>
                Create Format
              </Button>
            )}
          </div>
        ) : view === 'list' ? (
          <div className="att-table-wrap" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Table
              rowKey="id"
              size="small"
              className="att-table flex-table"
              columns={columns}
              dataSource={paginatedStructures}
              pagination={false}
              onRow={() => ({ className: 'att-row' })}
              scroll={{ x: 'max-content', y: '100%' }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px', marginRight: '-4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', paddingBottom: '16px' }}>
              {paginatedStructures.map((s) => (
                <div key={s.id} className="pc-card">
                  <div className="pc-top" style={{ position: 'relative' }}>
                    <div className="pc-avatar" style={{ background: '#3b82f6' }}>
                      <Layers size={16} />
                    </div>
                    <div className="pc-identity-body">
                      <div className="pc-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {s.name}
                        {s.tenantId === 'GLOBAL' && (
                          <span style={{ background: '#3b82f6', color: '#fff', fontSize: '9px', padding: '1px 5px', borderRadius: '4px', fontWeight: 800 }}>GLOBAL</span>
                        )}
                      </div>
                    </div>
                    {/* Three-dot dropdown */}
                    <Dropdown
                      overlayClassName="pc-dropdown"
                      trigger={['click']}
                      placement="bottomRight"
                      menu={{
                        items: [
                          {
                            key: 'preview',
                            label: renderDropdownItem(<Eye size={16} />, 'Preview', 'View structure contents', 'var(--bg-blue-50)', '#3b82f6'),
                            onClick: ({ domEvent }) => { domEvent.stopPropagation(); setPreviewStructure(s); },
                          },
                          ...(s.tenantId !== 'GLOBAL' ? [
                            { type: 'divider' as const },
                            ...(perms.canUpdateLetterFormat ? [{
                              key: 'edit',
                              label: renderDropdownItem(<Edit size={16} />, 'Edit', 'Open in the builder', 'var(--border-slate-100)', 'var(--text-slate-600)'),
                              onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); router.push(`/letters-docs/structures/builder?editId=${s.id}`); },
                            }] : []),
                            ...(perms.canDeleteLetterFormat ? [{
                              key: 'delete',
                              label: renderDropdownItem(<Trash2 size={16} />, 'Delete', 'Move to trash', 'var(--bg-red-50)', 'var(--text-leave)', true),
                              onClick: ({ domEvent }: any) => { domEvent.stopPropagation(); setDeleteStructId(s.id); },
                            }] : []),
                          ] : []),
                        ],
                      }}
                    >
                      <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                        <EllipsisOutlined />
                      </button>
                    </Dropdown>
                  </div>
                  <div className="pc-foot">
                    <div className="pc-foot-row">
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Created by</span>
                        <Avatar size={16} src={s.createdBy?.avatarUrl || s.createdBy?.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 8, fontWeight: 700 }}>
                          {initialsOf(s.createdBy?.name || '—')}
                        </Avatar>
                        <span className="pc-foot-val">{s.createdBy?.name || '—'}</span>
                      </span>
                      <span className="pc-foot-div" />
                      <div className="pc-foot-item">
                        <Clock size={12} style={{ color: 'var(--text-slate-400)' }} />
                        <span className="pc-foot-key">Updated:</span>
                        {new Date(s.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {total > 0 && (
        <div className="pp-footer pp-footer--sticky">
          <div className="pp-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="pp-pager">
            <button type="button" className="pp-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
              <button key={p} type="button" className={`pp-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
            ))}
            <button type="button" className="pp-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
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

      {/* Preview Modal */}
      <Modal
        title={<span style={{ color: 'var(--text-slate-900)' }}>{`Preview: ${previewStructure?.name}`}</span>}
        open={!!previewStructure}
        onCancel={() => setPreviewStructure(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewStructure(null)} style={{ background: 'var(--bg-pure-white)', color: 'var(--text-slate-900)', borderColor: 'var(--border-slate-300)' }}>
            Close
          </Button>
        ]}
        width={800}
        styles={{
          content: { background: 'var(--bg-pure-white) !important' },
          header: { background: 'var(--bg-pure-white) !important', borderBottom: '1px solid var(--border-slate-200) !important' },
          footer: { background: 'var(--bg-pure-white) !important', borderTop: '1px solid var(--border-slate-200) !important' }
        }}
      >
        <div
          className="letter-tiptap-content bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
          style={{ padding: '24px', borderRadius: '8px', border: '1px solid', minHeight: '300px' }}
        >
          <div className="ProseMirror" dangerouslySetInnerHTML={{ __html: previewStructure?.htmlContent || '' }} />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--bg-red-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle color="#ef4444" size={22} />
            </div>
            <div>
              <span style={{ color: 'var(--text-slate-900)', fontSize: '18px', fontWeight: 600 }}>Delete Structure</span>
            </div>
          </div>
        }
        open={!!deleteStructId}
        onOk={handleDelete}
        onCancel={() => setDeleteStructId(null)}
        okText="Delete Structure"
        cancelText="Cancel"
        okButtonProps={{
          danger: true,
          style: { borderRadius: '6px', fontWeight: 600, padding: '0 20px', height: '38px', background: '#ef4444', borderColor: '#ef4444' }
        }}
        cancelButtonProps={{
          style: { borderRadius: '6px', fontWeight: 600, padding: '0 20px', height: '38px', color: 'var(--text-slate-600)', borderColor: 'var(--border-slate-200)' }
        }}
        styles={{
          content: { background: 'var(--bg-pure-white) !important', borderRadius: '12px', padding: '24px' },
          header: { background: 'var(--bg-pure-white) !important', borderBottom: 'none', paddingBottom: '16px' },
          footer: { background: 'var(--bg-pure-white) !important', borderTop: 'none', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
          body: { paddingTop: '8px', paddingBottom: '8px' }
        }}
        centered
      >
        <p style={{ margin: 0, color: 'var(--text-slate-600) !important', fontSize: '14px', lineHeight: '1.6', marginLeft: '52px' }}>
          Are you sure you want to delete this custom structure? This action cannot be undone and will permanently remove this format template.
        </p>
      </Modal>

      <style jsx global>{`
        .pc-card {
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          border-radius: 0px; cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.06); border-color: var(--border-slate-300); }
        .pc-dropdown .ant-dropdown-menu { border-radius: 0 !important; }
        .pc-actions {
          flex-shrink: 0; width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
          position: absolute; top: 12px; right: 12px;
        }
        .pc-actions:hover { background: var(--border-slate-100); color: var(--text-slate-900); }
        
        .pc-top { display: flex; align-items: flex-start; gap: 12px; padding: 16px; flex: 1; }
        .pc-avatar {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 13px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 6px; flex: 1; }
        .pc-title {
          font-size: 15px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
        }
        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-100); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 16px; }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-slate-700); font-weight: 500; }
        .pc-foot-key { font-size: 11px; font-weight: 600; color: var(--text-slate-400); text-transform: uppercase; letter-spacing: 0.05em; }
        
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s ease;
        }
        .pp-segmented button:hover { color: var(--text-slate-900); }
        .pp-segmented button.is-active { background: var(--bg-slate-100); color: var(--text-slate-900); box-shadow: inset 0 1px 2px rgba(0,0,0,0.05); }
        
        .letter-tiptap-content .ProseMirror {
          outline: none;
          min-height: 300px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #1e293b;
        }
        .letter-tiptap-content .ProseMirror p {
          margin-bottom: 1em;
        }
        .letter-tiptap-content .ProseMirror h1 {
          font-size: 1.8em;
          font-weight: 700;
          margin-top: 1.2em;
          margin-bottom: 0.5em;
          color: #0f172a;
          page-break-before: always;
          break-before: page;
        }
        .letter-tiptap-content .ProseMirror > h1:first-child {
          page-break-before: auto;
          break-before: auto;
        }
        .letter-tiptap-content .ProseMirror h2 {
          font-size: 1.4em;
          font-weight: 600;
          margin-top: 1.2em;
          margin-bottom: 0.5em;
          color: #1e293b;
        }
        .letter-tiptap-content .ProseMirror h3 {
          font-size: 1.2em;
          font-weight: 600;
          margin-top: 1em;
          margin-bottom: 0.5em;
          color: #334155;
        }
        .letter-tiptap-content .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1.5em 0;
          overflow: hidden;
        }
        .letter-tiptap-content .ProseMirror td,
        .letter-tiptap-content .ProseMirror th {
          min-width: 1em;
          border: 1px solid var(--border-slate-200);
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .letter-tiptap-content .ProseMirror th {
          font-weight: 600;
          text-align: left;
          background-color: #f1f5f9;
        }

        .att-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .att-table, .att-table.ant-table-wrapper, .att-table .ant-table, .att-table .ant-table-container, .att-table .ant-table-content, .att-table .ant-table-header, .att-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .att-table .ant-table-thead > tr > th,
        .att-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .att-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 4px 10px !important; font-size: 12px !important; }
        .att-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .att-table .ant-table-tbody > tr.att-row:hover > td { background: var(--bg-slate-50) !important; }
      `}</style>
    </div>
  );
}
