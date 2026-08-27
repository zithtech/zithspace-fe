'use client';

import NoData from "@/components/common/NoData";
import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Archive,
  Search,
  Filter,
  Download,
  Trash2,
  FileText,
  FileCheck,
  User,
  Clock,
  Plus,
  Eye,
  X,
  Menu,
  Edit2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { LettersService, GeneratedDocument, DocumentTemplate, DocumentCategory } from '@/services/lettersService';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { toast } from 'react-hot-toast';
import { usePermission } from '@/hooks/usePermission';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import { Table, Button, Dropdown, Tooltip, Select, Drawer, Avatar, Modal } from 'antd';
import { LetterStatsCards, StatCellData } from '@/components/letters/LetterStatsCards';
import { SnippetsOutlined, FileTextOutlined, CheckCircleOutlined, StarOutlined } from '@ant-design/icons';

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
import type { ColumnsType } from 'antd/es/table';
import { AppstoreOutlined, UnorderedListOutlined, EllipsisOutlined, ReloadOutlined } from '@ant-design/icons';
import ZukvoLoader from '@/components/common/ZukvoLoader';

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

export default function DocumentRepositoryPage() {
  const router = useRouter();
  const perms = usePermission();
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingDocs, setDownloadingDocs] = useState<Record<string, 'pdf' | 'docx' | null>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'card'>('list');

  const [filterPortalNode, setFilterPortalNode] = useState<Element | null>(null);

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const total = documents.length;
  const pageCount = Math.ceil(total / tablePageSize) || 1;
  const paginatedDocuments = documents.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);

  useEffect(() => {
    setFilterPortalNode(document.getElementById('letters-docs-sidebar-filters'));
  }, []);

  useEffect(() => {
    if (perms.canReadLetter === false) {
      router.push('/dashboard');
    }
  }, [perms.canReadLetter, router]);

  const [previewModalDoc, setPreviewModalDoc] = useState<GeneratedDocument | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const handleDownload = async (docId: string, type: 'pdf' | 'docx', filename: string) => {
    try {
      setDownloadingDocs(prev => ({ ...prev, [docId]: type }));
      await LettersService.downloadLetter(docId, type, filename);
    } catch (error: any) {
      toast.error(`Failed to download ${type.toUpperCase()}`);
    } finally {
      setDownloadingDocs(prev => ({ ...prev, [docId]: null }));
    }
  };

  const handlePreviewDocument = async (doc: GeneratedDocument) => {
    try {
      setPreviewModalDoc(doc);
      setPreviewLoading(true);
      setPreviewHtml('');

      const fullDoc = await LettersService.getGeneratedLetterById(doc.id);
      const valMap: Record<string, string> = {};
      if (fullDoc.values) {
        fullDoc.values.forEach((v) => {
          valMap[v.placeholderKey] = v.placeholderValue || '';
        });
      }
      // Always preview from snapshot_content using generatedDocumentId.
      // templateId is only passed when the template still exists (used as fallback source).
      const html = await LettersService.previewLetter(fullDoc.templateId || '', valMap, fullDoc.id);
      setPreviewHtml(html);

    } catch (err: any) {
      toast.error(err.message || 'Failed to load document preview');
      setPreviewHtml('<div style="padding: 60px 20px; text-align: center; color: #ef4444; font-size: 15px;">Failed to load live preview for this document.</div>');
    } finally {
      setPreviewLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docs, tpls, cats] = await Promise.all([
        LettersService.getGeneratedLetters({
          templateId: selectedTemplateId || undefined,
          categoryId: selectedCategoryId || undefined,
          search: searchQuery || undefined,
        }),
        LettersService.getTemplates(),
        LettersService.getCategories(),
      ]);
      setDocuments(docs);
      setTemplates(tpls.data || []);
      setCategories(cats);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch generated documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTemplateId, selectedCategoryId]);

  const statCells: StatCellData[] = useMemo(() => {
    const total = documents.length;
    const thisWeekCount = documents.filter(d => {
      if (!d.generatedAt) return false;
      return (new Date().getTime() - new Date(d.generatedAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;
    const todayCount = documents.filter(d => {
      if (!d.generatedAt) return false;
      return (new Date().getTime() - new Date(d.generatedAt).getTime()) < 24 * 60 * 60 * 1000;
    }).length;

    const genericTrend = [0, 2, 4, 3, 5, 4, 7];

    return [
      { key: 'total', title: 'Total Generated', value: total, suffix: '', icon: <FileTextOutlined />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: genericTrend, delta: total },
      { key: 'this_week', title: 'This Week', value: thisWeekCount, suffix: '', icon: <CheckCircleOutlined />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: genericTrend, delta: thisWeekCount },
      { key: 'today', title: 'Today', value: todayCount, suffix: '', icon: <StarOutlined />, color: '#8b5cf6', tint: 'rgba(139,92,246,0.10)', trend: genericTrend, delta: todayCount },
      { key: 'archived', title: 'In Repository', value: total, suffix: '', icon: <SnippetsOutlined />, color: '#f59e0b', tint: 'rgba(245,158,11,0.10)', trend: genericTrend, delta: total },
    ];
  }, [documents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleDeleteDocument = async () => {
    if (!deleteDocId) return;
    try {
      toast.loading('Deleting document record...', { id: 'del' });
      await LettersService.deleteGeneratedLetter(deleteDocId);
      toast.success('Generated document deleted', { id: 'del' });
      setDocuments(documents.filter((d) => d.id !== deleteDocId));
      setDeleteDocId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document', { id: 'del' });
    }
  };

  const columns: ColumnsType<GeneratedDocument> = [
    {
      title: 'DOCUMENT REF',
      dataIndex: 'documentNumber',
      key: 'documentNumber',
      render: (_: any, doc: GeneratedDocument) => (
        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-slate-900)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
          <FileCheck size={16} style={{ color: '#3b82f6' }} />
          {doc.documentNumber}
        </div>
      ),
    },
    {
      title: 'DOCUMENT NAME',
      dataIndex: 'documentName',
      key: 'documentName',
      render: (_: any, doc: GeneratedDocument) => (
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-slate-700)' }}>
          {doc.documentName || <span style={{ color: 'var(--text-slate-400)' }}>-</span>}
        </div>
      ),
    },
    {
      title: 'TEMPLATE',
      dataIndex: 'template',
      key: 'template',
      render: (_: any, doc: GeneratedDocument) => (
        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-slate-700)' }}>
          {doc.template ? doc.template.templateName : <span style={{ color: 'var(--text-slate-400)' }}>Deleted Template</span>}
        </div>
      ),
    },
    {
      title: 'CATEGORY',
      dataIndex: 'category',
      key: 'category',
      render: (_: any, doc: GeneratedDocument) => (
        doc.category ? (
          <span style={{ background: 'var(--border-slate-100)', color: 'var(--text-slate-700)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
            {doc.category.categoryName}
          </span>
        ) : (
          <span style={{ color: 'var(--text-slate-400)', fontSize: '11px' }}>Uncategorized</span>
        )
      ),
    },
    // {
    //   title: 'GENERATED BY',
    //   dataIndex: 'generatedBy',
    //   key: 'generatedBy',
    //   render: (_: any, doc: GeneratedDocument) => (
    //     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-slate-600)' }}>
    //       <User size={13} style={{ color: 'var(--text-slate-400)' }} />
    //       {doc.generatedBy ? doc.generatedBy.name : 'System User'}
    //     </div>
    //   ),
    // },
    {
      title: 'DATE',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (_: any, doc: GeneratedDocument) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-slate-600)' }}>
          <Clock size={13} />
          {new Date(doc.generatedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: 'GENERATED BY',
      dataIndex: ['generatedBy', 'name'],
      key: 'generatedBy',
      render: (_: any, record: GeneratedDocument) => {
        const creator = record.generatedBy;
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
      title: 'DOWNLOADS & ACTIONS',
      key: 'actions',
      align: 'center',
      width: 72,
      fixed: 'right',
      render: (_: any, doc: GeneratedDocument) => (
        <Dropdown
          overlayClassName="pp-action-pop"
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              ...(perms.canGenerateLetter ? [{ key: 'edit', label: renderDropdownItem(<Edit2 size={16} />, 'Edit Document', 'Open in the builder', 'var(--border-slate-100)', 'var(--text-slate-600)'), onClick: (e: any) => { e.domEvent.stopPropagation(); router.push(`/letters-docs/generate?editId=${doc.id}`); } }] : []),
              { key: 'preview', label: renderDropdownItem(<Eye size={16} />, 'Preview', 'View document contents', 'var(--bg-blue-50)', '#3b82f6'), onClick: (e) => { e.domEvent.stopPropagation(); handlePreviewDocument(doc); } },
              { key: 'pdf', label: renderDropdownItem(<Download size={16} />, 'Download PDF', 'Export as PDF', 'var(--bg-green-50)', 'var(--text-holiday)'), onClick: (e) => { e.domEvent.stopPropagation(); handleDownload(doc.id, 'pdf', `${doc.documentNumber}.pdf`); } },
              { key: 'docx', label: renderDropdownItem(<Download size={16} />, 'Download DOCX', 'Export as Word Document', 'var(--bg-green-50)', 'var(--text-holiday)'), onClick: (e) => { e.domEvent.stopPropagation(); handleDownload(doc.id, 'docx', `${doc.documentNumber}.docx`); } },
              { type: 'divider' as const },
              ...(perms.canDeleteLetter ? [{ key: 'del', label: renderDropdownItem(<Trash2 size={16} />, 'Delete', 'Move to trash', 'var(--bg-red-50)', 'var(--text-leave)', true), onClick: (e: any) => { e.domEvent.stopPropagation(); setDeleteDocId(doc.id); } }] : []),
            ]
          }}
        >
          <Button type="text" className="pp-icon-btn" icon={<EllipsisOutlined />} onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      ),
    },
  ];

  const filterContent = filterPortalNode ? createPortal(
    <div style={{ padding: '12px 6px', marginTop: '16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate-400)', padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Filter size={12} /> FILTERS
      </div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-slate-600)', marginBottom: '6px' }}>Template</label>
        <SearchableDropdown
          value={selectedTemplateId || ''}
          onChange={(newVal) => setSelectedTemplateId(newVal)}
          placeholder="All Templates"
          options={templates.map((tpl) => ({
            value: tpl.id,
            label: tpl.templateName
          }))}
          hideAvatar={true}
          allowClear={true}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-slate-600)', marginBottom: '6px' }}>Category</label>
        <SearchableDropdown
          value={selectedCategoryId || ''}
          onChange={(newVal) => setSelectedCategoryId(newVal)}
          placeholder="All Categories"
          options={categories.map((cat) => ({
            value: cat.id,
            label: cat.categoryName
          }))}
          hideAvatar={true}
          allowClear={true}

        />
      </div>
    </div>,
    filterPortalNode
  ) : null;

  return (
    <div className="doc-repository-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
      {filterContent}
      {/* Category Filter Portal Target */}
      {/* Sticky Header matching onboarding page */}
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
            <Archive size={18} />
          </div>
          <div>
            <div className="lv-header-title">Generated Records</div>
            <div className="lv-header-sub">
              Centralized archive of generated HR documents with instant PDF/DOCX export.
            </div>
          </div>
        </div>
        <div className="lv-header-actions">
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', marginRight: '4px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '34px', width: '260px', borderRadius: '8px', background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)', padding: '0 10px' }}>
              <Search size={14} style={{ color: 'var(--text-slate-400)' }} />
              <input
                type="text"
                placeholder="Search by Document Number..."
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
            onClick={() => router.push('/letters-docs/generate')}
            style={{ height: 34, borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            Generate New Letter
          </Button>
        </div>
      </div>

      <div style={{ padding: '14px 24px 32px', flex: 1, overflow: 'hidden', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <LetterStatsCards statCells={statCells} />
        {/* Documents List Table */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-slate-600)', fontSize: '15px' }}>
            <ZukvoLoader message="Loading document repository..." size="md" />
          </div>
        ) : documents.length === 0 ? (
          <NoData description={
            <div
              className="pp-empty"
              style={{
                background: 'var(--bg-pure-white)',
                borderRadius: '12px',
                border: '1px dashed var(--border-slate-200)',
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <div className="pp-empty-orb"><Archive size={48} style={{ color: 'var(--text-slate-400)', margin: '0 auto 16px' }} /></div>
              <h3 className="pp-empty-title" style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-slate-900)', margin: '0 0 8px' }}>No Generated Documents Yet</h3>
              <p className="pp-empty-sub" style={{ fontSize: '14px', color: 'var(--text-slate-600)', margin: '0 0 20px' }}>
                Personalize and generate your first HR letter from Template Management or Letter Generation.
              </p>
              <Link
                href="/letters-docs/generate"
                style={{
                  padding: '10px 22px',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '14px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Go to Document Generation
              </Link>
            </div>
          } />
        ) : view === 'list' ? (
          <div className="att-table-wrap" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Table
              rowKey="id"
              size="small"
              className="att-table flex-table"
              columns={columns}
              dataSource={paginatedDocuments}
              pagination={false}
              scroll={{ x: 'max-content', y: '100%' }}
              onRow={(record) => ({ className: 'att-row', onClick: () => handlePreviewDocument(record), style: { cursor: 'pointer' } })} locale={{ emptyText: <NoData /> }}
            />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px', marginRight: '-4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', paddingBottom: '16px' }}>
              {paginatedDocuments.map((doc) => (
                <div key={doc.id} className="pc-card" onClick={(e) => { e.stopPropagation(); handlePreviewDocument(doc); }}>
                  <div className="pc-top">
                    <div className="pc-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                      {doc.template?.templateName?.substring(0, 2).toUpperCase() || 'DC'}
                    </div>
                    <div className="pc-identity-body">
                      <div className="pc-title">{doc.documentNumber}</div>
                      <div className="pc-client-line">
                        <span className="pc-client-key">Template:</span>
                        <span className="pc-client-val">{doc.template?.templateName || 'No Template'}</span>
                      </div>
                    </div>
                    <Dropdown
                      overlayClassName="pc-dropdown"
                      menu={{
                        items: [
                          ...(perms.canGenerateLetter ? [{ key: 'edit', label: renderDropdownItem(<Edit2 size={16} />, 'Edit Document', 'Open in the builder', 'var(--border-slate-100)', 'var(--text-slate-600)'), onClick: (e: any) => { e.domEvent.stopPropagation(); router.push(`/letters-docs/generate?editId=${doc.id}`); } }] : []),
                          { key: 'preview', label: renderDropdownItem(<Eye size={16} />, 'Preview', 'View document contents', 'var(--bg-blue-50)', '#3b82f6'), onClick: (e) => { e.domEvent.stopPropagation(); handlePreviewDocument(doc); } },
                          { key: 'pdf', label: renderDropdownItem(<Download size={16} />, 'Download PDF', 'Export as PDF', 'var(--bg-green-50)', 'var(--text-holiday)'), onClick: (e) => { e.domEvent.stopPropagation(); LettersService.downloadLetter(doc.id, 'pdf', `${doc.documentNumber}.pdf`); } },
                          { key: 'docx', label: renderDropdownItem(<Download size={16} />, 'Download DOCX', 'Export as Word Document', 'var(--bg-green-50)', 'var(--text-holiday)'), onClick: (e) => { e.domEvent.stopPropagation(); LettersService.downloadLetter(doc.id, 'docx', `${doc.documentNumber}.docx`); } },
                          { type: 'divider' as const },
                          ...(perms.canDeleteLetter ? [{ key: 'del', label: renderDropdownItem(<Trash2 size={16} />, 'Delete', 'Move to trash', 'var(--bg-red-50)', 'var(--text-leave)', true), onClick: (e: any) => { e.domEvent.stopPropagation(); setDeleteDocId(doc.id); } }] : []),
                        ]
                      }}
                      trigger={['click']}
                      placement="bottomRight"
                    >
                      <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                        <EllipsisOutlined />
                      </button>
                    </Dropdown>
                  </div>
                  <div className="pc-foot">
                    <div className="pc-foot-row">
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Generated By:</span>
                        <Avatar size={16} src={doc.generatedBy?.avatarUrl || doc.generatedBy?.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 8, fontWeight: 700 }}>
                          {initialsOf(doc.generatedBy?.name || '—')}
                        </Avatar>
                        <span className="pc-foot-val">{doc.generatedBy?.name || 'System'}</span>
                      </span>
                      <span className="pc-foot-div" />
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Date:</span>
                        <span className="pc-foot-val">{new Date(doc.generatedAt).toLocaleDateString()}</span>
                      </span>
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

      {/* Delete Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--bg-red-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle color="#ef4444" size={22} />
            </div>
            <div>
              <span style={{ color: 'var(--text-slate-900)', fontSize: '18px', fontWeight: 600 }}>Delete Document</span>
            </div>
          </div>
        }
        open={!!deleteDocId}
        onOk={handleDeleteDocument}
        onCancel={() => setDeleteDocId(null)}
        okText="Delete Document"
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
          header: { background: 'var(--bg-pure-white) !important', borderBottom: 'none', paddingBottom: '10px' },
          footer: { background: 'var(--bg-pure-white) !important', borderTop: 'none', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' },
          body: { paddingTop: '2px', paddingBottom: '2px' }
        }}
        centered

      >
        <p style={{ margin: 0, color: 'var(--text-slate-600) !important', fontSize: '14px', lineHeight: '1.6', marginLeft: '48px' }}>
          Are you sure you want to delete this document from the repository? This action cannot be undone.
        </p>
      </Modal>

      {/* Document Preview Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'var(--bg-blue-50)',
                color: 'var(--text-blue-700)',
                display: 'flex',
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-slate-900)', margin: 0 }}>
                {previewModalDoc?.documentNumber}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-slate-600)', margin: '2px 0 0' }}>
                {previewModalDoc?.template?.templateName || 'Generated Document'} • {previewModalDoc ? new Date(previewModalDoc.generatedAt).toLocaleDateString() : ''}
              </p>
            </div>
          </div>
        }
        placement="right"
        width={1100}
        onClose={() => setPreviewModalDoc(null)}
        open={!!previewModalDoc}
        styles={{ body: { padding: '40px 48px', background: 'var(--bg-pure-white)' }, header: { background: 'var(--bg-slate-50)' } }}
        extra={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => previewModalDoc && handleDownload(previewModalDoc.id, 'pdf', `${previewModalDoc.documentNumber}.pdf`)}
              disabled={Boolean(previewModalDoc && downloadingDocs[previewModalDoc.id] === 'pdf')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'var(--bg-blue-50)',
                border: '1px solid var(--border-blue-200)',
                color: 'var(--text-blue-700)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: (previewModalDoc && downloadingDocs[previewModalDoc.id] === 'pdf') ? 'not-allowed' : 'pointer',
                opacity: (previewModalDoc && downloadingDocs[previewModalDoc.id] === 'pdf') ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Download PDF"
            >
              {previewModalDoc && downloadingDocs[previewModalDoc.id] === 'pdf' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              PDF
            </button>
            <button
              onClick={() => previewModalDoc && handleDownload(previewModalDoc.id, 'docx', `${previewModalDoc.documentNumber}.docx`)}
              disabled={Boolean(previewModalDoc && downloadingDocs[previewModalDoc.id] === 'docx')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'var(--bg-green-50)',
                border: '1px solid var(--border-green-200)',
                color: 'var(--text-holiday)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: (previewModalDoc && downloadingDocs[previewModalDoc.id] === 'docx') ? 'not-allowed' : 'pointer',
                opacity: (previewModalDoc && downloadingDocs[previewModalDoc.id] === 'docx') ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Download DOCX"
            >
              {previewModalDoc && downloadingDocs[previewModalDoc.id] === 'docx' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              DOCX
            </button>
          </div>
        }
      >
        {previewLoading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-slate-600)', fontSize: '15px', fontWeight: 500 }}>
            Loading live document preview...
          </div>
        ) : previewHtml ? (() => {
          let parsedConfig = {} as any;
          let cleanHtml = previewHtml;
          const configRegex = /<script\s+id="zith-page-config"\s+type="application\/json">([\s\S]*?)<\/script>/i;
          const match = configRegex.exec(previewHtml);
          if (match && match[1]) {
            try { parsedConfig = JSON.parse(match[1]); } catch (e) { }
            cleanHtml = previewHtml.replace(configRegex, '');
          }
          const pages = cleanHtml.split(/<div[^>]*class="[^"]*html2pdf__page-break[^"]*"[^>]*><\/div>/gi).map(p => p.trim()).filter(p => !!p);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
              {pages.map((pageContent, index) => (
                <div key={index} className="preview-paper-content force-light-theme" style={{
                  width: '210mm',
                  minHeight: '297mm',
                  background: '#ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
                  paddingTop: parsedConfig.marginTop || '20mm',
                  paddingRight: parsedConfig.marginRight || '20mm',
                  paddingBottom: parsedConfig.marginBottom || '20mm',
                  paddingLeft: parsedConfig.marginLeft || '20mm',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  borderWidth: parsedConfig.borderWidth || '0px',
                  borderStyle: parsedConfig.borderStyle || 'solid',
                  borderColor: parsedConfig.borderColor || '#000000',
                  margin: '0 auto',
                  fontSize: '14px', lineHeight: '1.6'
                }}>
                  {parsedConfig.headerHtml && (
                    <div className="preview-header-zone" style={{ width: '100%', marginBottom: '4px' }} dangerouslySetInnerHTML={{ __html: parsedConfig.headerHtml }} />
                  )}
                  <div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: pageContent }} />
                  {parsedConfig.footerHtml && (
                    <div className="preview-header-zone" style={{ width: '100%', marginTop: '4px' }} dangerouslySetInnerHTML={{ __html: parsedConfig.footerHtml.replace(/\[Page #\]/g, (index + 1).toString()) }} />
                  )}
                </div>
              ))}
            </div>
          );
        })() : null}
      </Drawer>

      <style jsx global>{`
        .pc-card {
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 4px 16px rgba(15,23,42,0.06); border-color: var(--border-slate-300); }
        .pc-dropdown .ant-dropdown-menu { border-radius: 0 !important; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; flex: 1; }
        .pc-avatar {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 13px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 4px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--border-slate-100); color: #0f172a; }
        .pc-title {
          font-size: 14px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 12px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-600); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 12px;color: var(--text-slate-700); }
        .pc-foot-key { font-size: 11px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 12px; background: var(--border-slate-200); }

        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3b82f6; }

        .preview-paper-content {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #0f172a;
        }
        .preview-paper-content p {
          margin-bottom: 1em;
        }
        .preview-paper-content h1 {
          font-size: 1.8em !important;
          font-weight: 700 !important;
          margin-top: 1.2em !important;
          margin-bottom: 0.5em !important;
          color: #0f172a !important;
        }
        .preview-paper-content h2 {
          font-size: 1.4em !important;
          font-weight: 600 !important;
          margin-top: 1.2em !important;
          margin-bottom: 0.5em !important;
          color: #0f172a !important;
        }
        .preview-paper-content h3 {
          font-size: 1.2em !important;
          font-weight: 600 !important;
          margin-top: 1em !important;
          margin-bottom: 0.5em !important;
          color: #334155 !important;
        }
        .preview-paper-content h4,
        .preview-paper-content h5,
        .preview-paper-content h6 {
          font-size: 1.1em !important;
          font-weight: 600 !important;
          margin-top: 1em !important;
          margin-bottom: 0.5em !important;
          color: #334155 !important;
        }
        .preview-paper-content strong,
        .preview-paper-content b {
          font-weight: 700 !important;
        }
        .preview-paper-content em,
        .preview-paper-content i {
          font-style: italic !important;
        }
        .preview-paper-content u {
          text-decoration: underline !important;
        }
        .preview-paper-content table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1.5em 0;
          overflow: hidden;
        }
        .preview-paper-content td,
        .preview-paper-content th {
          min-width: 1em;
          border: 1px solid var(--border-slate-200);
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .preview-paper-content th {
          font-weight: 600 !important;
          text-align: left;
          background-color: #f1f5f9;
        }
        .preview-paper-content ul,
        .preview-paper-content ol {
          padding-left: 1.5rem !important;
          margin-bottom: 1em;
        }
        .preview-paper-content ul {
          list-style-type: disc !important;
        }
        .preview-paper-content ol {
          list-style-type: decimal !important;
        }
        .preview-paper-content li {
          margin-bottom: 0.25em;
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
