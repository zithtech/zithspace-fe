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
} from 'lucide-react';
import { LettersService, DocumentStructure } from '@/services/lettersService';
import { toast } from 'react-hot-toast';
import { Table, Button, Tooltip, Select, Modal } from 'antd';
import { LetterStatsCards, StatCellData } from '@/components/letters/LetterStatsCards';
import { SnippetsOutlined, FileTextOutlined, CheckCircleOutlined, StarOutlined, AppstoreOutlined, UnorderedListOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

export default function StructuresManagementPage() {
  const router = useRouter();
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
      title: 'ACTIONS',
      key: 'actions',
      align: 'right',
      render: (_: any, record: DocumentStructure) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Tooltip title="Preview">
            <button
              onClick={(e) => { e.stopPropagation(); setPreviewStructure(record); }}
              style={{
                padding: '6px', borderRadius: '4px', background: 'transparent',
                border: '1px solid var(--border-slate-200)', cursor: 'pointer',
                color: 'var(--text-slate-600)'
              }}
            >
              <EyeOutlined />
            </button>
          </Tooltip>
          {record.tenantId !== 'GLOBAL' && (
            <>
              <Tooltip title="Edit">
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(`/letters-docs/structures/builder?editId=${record.id}`); }}
                  style={{
                    padding: '6px', borderRadius: '4px', background: 'transparent',
                    border: '1px solid var(--border-slate-200)', cursor: 'pointer',
                    color: '#3b82f6'
                  }}
                >
                  <EditOutlined />
                </button>
              </Tooltip>
              <Tooltip title="Delete">
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteStructId(record.id); }}
                  style={{
                    padding: '6px', borderRadius: '4px', background: 'transparent',
                    border: '1px solid var(--border-slate-200)', cursor: 'pointer',
                    color: '#ef4444'
                  }}
                >
                  <DeleteOutlined />
                </button>
              </Tooltip>
            </>
          )}
        </div>
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

          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => router.push('/letters-docs/structures/builder')}
            style={{ height: 34, borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Create Format
          </Button>
        </div>
      </div>

      <div style={{ padding: '24px 28px 40px', flex: 1, overflow: 'hidden', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

        <LetterStatsCards statCells={statCells} />

        {/* Structures List */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-slate-600)', fontSize: '15px' }}>
            Loading custom structures...
          </div>
        ) : filteredStructures.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <Layers size={48} style={{ color: 'var(--text-slate-300)', margin: '0 auto 16px' }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-slate-800)', marginBottom: '8px' }}>No Structures Found</div>
            <div style={{ color: 'var(--text-slate-500)', fontSize: '14px', marginBottom: '24px' }}>
              Create your first custom structure to reuse across document templates.
            </div>
            <Button type="primary" onClick={() => router.push('/letters-docs/structures/builder')} icon={<Plus size={15} />}>
              Create Format
            </Button>
          </div>
        ) : view === 'list' ? (
          <div className="att-table-wrap">
            <Table
              rowKey="id"
              size="small"
              className="att-table"
              columns={columns}
              dataSource={paginatedStructures}
              pagination={false}
              onRow={() => ({ className: 'att-row' })}
              scroll={{ x: 'max-content', y: 'calc(100vh - 360px)' }}
            />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {paginatedStructures.map((s) => (
              <div key={s.id} className="pc-card">
                <div className="pc-top">
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
                </div>
                <div className="pc-foot">
                  <div className="pc-foot-row">
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
        title={`Preview: ${previewStructure?.name}`}
        open={!!previewStructure}
        onCancel={() => setPreviewStructure(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewStructure(null)}>
            Close
          </Button>
        ]}
        width={800}
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
        title="Delete Structure"
        open={!!deleteStructId}
        onOk={handleDelete}
        onCancel={() => setDeleteStructId(null)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this custom structure? This action cannot be undone.</p>
      </Modal>

      <style jsx global>{`
        .pc-card {
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          border-radius: 12px; cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.06); border-color: var(--border-slate-300); }
        .pc-top { display: flex; align-items: flex-start; gap: 12px; padding: 16px; flex: 1; }
        .pc-avatar {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 14px;
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
          border: 1px solid #cbd5e1;
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
      `}</style>
    </div>
  );
}
