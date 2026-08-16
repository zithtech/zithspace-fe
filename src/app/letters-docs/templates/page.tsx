'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import SearchableDropdown from '@/components/common/SearchableDropdown';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit,
  FolderCog,
  CheckCircle2,
  Clock,
  Layers,
  Menu,
  Settings,
  AlertTriangle,
} from 'lucide-react';
import { LettersService, DocumentTemplate, DocumentCategory, DocumentStructure } from '@/services/lettersService';
import LetterTiptapEditor from '@/components/letters/LetterTiptapEditor';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { toast } from 'react-hot-toast';
import { Table, Button, Dropdown, Tooltip, Select, Modal, Switch, Avatar } from 'antd';
import { LetterStatsCards, StatCellData } from '@/components/letters/LetterStatsCards';
import { SnippetsOutlined, FileTextOutlined, CheckCircleOutlined, StarOutlined } from '@ant-design/icons';
import AiCreateTemplateModal from '@/components/letters/AiCreateTemplateModal';
import { ThunderboltOutlined } from '@ant-design/icons';

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

export default function TemplateManagementPage() {
  const router = useRouter();
  const { hasPermission, user } = useAuth();
  const perms = usePermission() as unknown as Record<string, any>;
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_doc_suite_templates_prime');

  useEffect(() => {
    if (perms.canReadLetterTemplate === false) {
      router.push('/dashboard');
    }
  }, [perms.canReadLetterTemplate, router]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [catLoading, setCatLoading] = useState(false);
  const [isZaiModalOpen, setIsZaiModalOpen] = useState(false);

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatDesc, setEditingCatDesc] = useState('');
  const [editingCatLoading, setEditingCatLoading] = useState(false);

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [structures, setStructures] = useState<DocumentStructure[]>([]);
  const [isStructureTypeModalOpen, setIsStructureTypeModalOpen] = useState(false);
  const [isStructureBuilderOpen, setIsStructureBuilderOpen] = useState(false);
  const [newStructureName, setNewStructureName] = useState('');
  const [newStructureHtml, setNewStructureHtml] = useState('');
  const [savingStructure, setSavingStructure] = useState(false);

  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'card'>('list');

  const [filterPortalNode, setFilterPortalNode] = useState<Element | null>(null);

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const total = templates.length;
  const pageCount = Math.ceil(total / tablePageSize) || 1;
  const paginatedTemplates = templates.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  useEffect(() => {
    setFilterPortalNode(document.getElementById('letters-docs-sidebar-filters'));
  }, []);
  const fetchData = async () => {
    try {
      setLoading(true);
      const [tpls, cats] = await Promise.all([
        LettersService.getTemplates({ categoryId: selectedCategoryId || undefined, search: searchQuery || undefined }),
        LettersService.getCategories(),
      ]);
      setTemplates(tpls);
      setCategories(cats);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load document templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategoryId]);

  const statCells: StatCellData[] = useMemo(() => {
    const total = templates.length;
    const globalCount = templates.filter(t => t.tenantId === 'GLOBAL').length;
    const activeCount = templates.filter(t => t.status === 'ACTIVE').length;
    const recentCount = templates.filter(t => {
      if (!t.createdAt && !t.updatedAt) return false;
      const d = new Date(t.createdAt || t.updatedAt);
      return (new Date().getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

    // Use a generic trend line for visual consistency
    const genericTrend = [0, 2, 4, 3, 5, 4, 7];

    return [
      { key: 'total', title: 'Total Templates', value: total, suffix: '', icon: <SnippetsOutlined />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: genericTrend, delta: total },
      { key: 'active', title: 'Active Templates', value: activeCount, suffix: '', icon: <CheckCircleOutlined />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: genericTrend, delta: activeCount },
      { key: 'global', title: 'Global Templates', value: globalCount, suffix: '', icon: <StarOutlined />, color: '#8b5cf6', tint: 'rgba(139,92,246,0.10)', trend: genericTrend, delta: globalCount },
      { key: 'recent', title: 'New This Week', value: recentCount, suffix: '', icon: <FileTextOutlined />, color: '#f59e0b', tint: 'rgba(245,158,11,0.10)', trend: genericTrend, delta: recentCount },
    ];
  }, [templates]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleDuplicate = async (tpl: DocumentTemplate) => {
    try {
      toast.loading('Duplicating template...', { id: 'dup' });
      const dup = await LettersService.duplicateTemplate(tpl.id, `${tpl.templateName} (Copy)`);
      toast.success('Template duplicated successfully', { id: 'dup' });
      setTemplates([dup, ...templates]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate template', { id: 'dup' });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateId) return;
    try {
      toast.loading('Deleting template...', { id: 'del' });
      await LettersService.deleteTemplate(deleteTemplateId);
      toast.success('Template deleted', { id: 'del' });
      setTemplates(templates.filter((t) => t.id !== deleteTemplateId));
      setDeleteTemplateId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template', { id: 'del' });
    }
  };

  const loadStructures = async () => {
    try {
      const res = await LettersService.getStructures();
      setStructures(res);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load structures');
    }
  };

  const handleOpenSettings = () => {
    loadStructures();
    setIsSettingsModalOpen(true);
  };

  const handleSaveStructure = async () => {
    if (!newStructureName.trim() || !newStructureHtml.trim()) {
      toast.error('Name and content are required');
      return;
    }
    try {
      setSavingStructure(true);
      await LettersService.createStructure(newStructureName, newStructureHtml);
      toast.success('Structure saved successfully');
      setIsStructureBuilderOpen(false);
      setNewStructureName('');
      setNewStructureHtml('');
      loadStructures();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save structure');
    } finally {
      setSavingStructure(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      setCatLoading(true);
      const cat = await LettersService.createCategory({ categoryName: newCatName.trim(), description: newCatDesc.trim() });
      setCategories([...categories, cat]);
      setNewCatName('');
      setNewCatDesc('');
      toast.success('Category created');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create category');
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    try {
      await LettersService.deleteCategory(catId);
      setCategories(categories.filter((c) => c.id !== catId));
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  const handleSaveEditCategory = async (catId: string) => {
    if (!editingCatName.trim()) return;
    try {
      setEditingCatLoading(true);
      const updatedCat = await LettersService.updateCategory(catId, { categoryName: editingCatName.trim(), description: editingCatDesc.trim() });
      setCategories(categories.map(c => c.id === catId ? updatedCat : c));
      toast.success('Category updated');
      setEditingCatId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    } finally {
      setEditingCatLoading(false);
    }
  };

  const handleToggleCategoryStatus = async (catId: string, checked: boolean) => {
    try {
      const newStatus = checked ? 'ACTIVE' : 'INACTIVE';
      await LettersService.updateCategory(catId, { status: newStatus });
      setCategories(categories.map(c => c.id === catId ? { ...c, status: newStatus } : c));
      toast.success(`Category ${checked ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category status');
    }
  };

  const columns: ColumnsType<DocumentTemplate> = [
    {
      title: 'TEMPLATE NAME',
      dataIndex: 'templateName',
      key: 'templateName',
      render: (_: any, tpl: DocumentTemplate) => (
        <div>
          <Link
            href={`/letters-docs/templates/builder?id=${tpl.id}`}
            style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-slate-900)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <FileText size={16} style={{ color: '#3b82f6' }} />
            {tpl.templateName}
            {tpl.tenantId === 'GLOBAL' && (
              <span style={{ marginLeft: '8px', background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>GLOBAL</span>
            )}
          </Link>
          {tpl.description && (
            <div style={{ fontSize: '11px', color: 'var(--text-slate-600)', marginTop: '2px', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tpl.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'CATEGORY',
      dataIndex: 'category',
      key: 'category',
      render: (_: any, tpl: DocumentTemplate) => (
        tpl.category ? (
          <span style={{ background: 'var(--border-slate-100)', color: 'var(--text-slate-700)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
            {tpl.category.categoryName}
          </span>
        ) : (
          <span style={{ color: 'var(--text-slate-400)', fontSize: '11px' }}>Uncategorized</span>
        )
      ),
    },
    {
      title: 'VERSION',
      dataIndex: 'currentVersion',
      key: 'currentVersion',
      render: (_: any, tpl: DocumentTemplate) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-blue-50)', color: 'var(--text-blue-700)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
          <Layers size={12} />
          v{tpl.currentVersion}
        </span>
      ),
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      render: (_: any, tpl: DocumentTemplate) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            background: tpl.status === 'ACTIVE' ? 'var(--bg-green-50)' : 'var(--border-slate-100)',
            color: tpl.status === 'ACTIVE' ? 'var(--text-holiday)' : 'var(--text-slate-600)',
          }}
        >
          <CheckCircle2 size={12} />
          {tpl.status}
        </span>
      ),
    },
    {
      title: 'LAST UPDATED',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (_: any, tpl: DocumentTemplate) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-slate-600)' }}>
          <Clock size={13} />
          {new Date(tpl.updatedAt).toLocaleDateString()}
        </div>
      ),
    },
    {
      title: 'CREATED BY',
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      render: (_: any, record: DocumentTemplate) => {
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
      render: (_: any, tpl: DocumentTemplate) => (
        <Dropdown
          overlayClassName="pp-action-pop"
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              ...(perms.canUpdateLetterTemplate ? [{ key: 'edit', label: renderDropdownItem(<Edit size={16} />, 'Edit', 'Open in the builder', 'var(--border-slate-100)', 'var(--text-slate-600)'), onClick: (e: any) => { e.domEvent.stopPropagation(); router.push(`/letters-docs/templates/builder?id=${tpl.id}`); } }] : []),
              ...(perms.canCreateLetterTemplate ? [{ key: 'dup', label: renderDropdownItem(<Copy size={16} />, 'Duplicate', 'Clone this template', 'var(--bg-green-50)', 'var(--text-holiday)'), onClick: (e: any) => { e.domEvent.stopPropagation(); handleDuplicate(tpl); } }] : []),
              { type: 'divider' as const },
              ...(perms.canDeleteLetterTemplate ? [{ key: 'del', label: renderDropdownItem(<Trash2 size={16} />, 'Delete', 'Move to trash', 'var(--bg-red-50)', 'var(--text-leave)', true), onClick: (e: any) => { e.domEvent.stopPropagation(); setDeleteTemplateId(tpl.id); } }] : []),
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
      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-slate-600)', marginBottom: '6px' }}>Category</label>
        <SearchableDropdown
          value={selectedCategoryId || ''}
          onChange={(newCatId) => setSelectedCategoryId(newCatId)}
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
    <div className="template-mgmt-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
      {filterContent}
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
            <FileText size={18} />
          </div>
          <div>
            <div className="lv-header-title">Template Builder</div>
            {/* <div className="lv-header-sub">
              Create and manage reusable templates with dynamic placeholders and version history.
            </div> */}
          </div>
        </div>
        <div className="lv-header-actions">
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: '34px', width: '240px', borderRadius: '8px', background: 'var(--bg-pure-white)', border: '1px solid var(--border-slate-200)', padding: '0 10px' }}>
              <Search size={14} style={{ color: 'var(--text-slate-400)' }} />
              <input
                type="text"
                placeholder="Search templates by name..."
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

          {perms.canUpdateLetterTemplate && (
            <Button
              icon={<FolderCog size={15} />}
              onClick={() => setIsCategoryModalOpen(true)}
              style={{ height: 34, borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span className="categories-btn-text">Categories</span>
            </Button>
          )}

          <Button
            icon={<Settings size={15} />}
            onClick={handleOpenSettings}
            style={{ height: 34, borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {/* Settings */}
          </Button>
          {perms.canCreateLetterTemplate && (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'manual',
                    icon: <FileTextOutlined />,
                    label: 'Manual Creation',
                    onClick: () => router.push('/letters-docs/templates/builder')
                  },
                  ...(hasPrime ? [{
                    key: 'zai',
                    icon: <ThunderboltOutlined style={{ color: '#9333ea' }} />,
                    label: <span style={{ fontWeight: 600 }}>Create with Zai <span style={{ background: '#f3e8ff', color: '#9333ea', fontSize: '10px', padding: '1px 4px', borderRadius: '4px', marginLeft: '4px' }}>AI</span></span>,
                    onClick: () => setIsZaiModalOpen(true)
                  }] : [])
                ]
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="primary"
                icon={<Plus size={15} />}
                style={{ height: 34, borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Create Template <span style={{ display: 'inline-flex', marginLeft: '2px', opacity: 0.8 }}>▼</span>
              </Button>
            </Dropdown>
          )}
        </div>
      </div>

      <div style={{ padding: '14px 24px 32px', flex: 1, overflow: 'hidden', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

        <LetterStatsCards statCells={statCells} />

        {/* Templates List */}
        {loading ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-slate-600)', fontSize: '15px' }}>
            <ZukvoLoader message='Loading templates...' size="md" />
          </div>
        ) : templates.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-pure-white)',
              borderRadius: '12px',
              border: '1px dashed var(--border-slate-200)',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
              <FileText size={48} style={{ color: 'var(--text-slate-300)', margin: '0 auto 16px' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-slate-800)', marginBottom: '8px' }}>No Templates Found</div>
              <div style={{ color: 'var(--text-slate-500)', fontSize: '14px', marginBottom: '24px' }}>
                You don't have any templates matching your criteria yet.
              </div>
              {perms.canCreateLetterTemplate && (
                <Link
                  href="/letters-docs/templates/builder"
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '14px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Plus size={18} />
                  Create First Template
                </Link>
              )}
            </div></div>
        ) : view === 'list' ? (
          <div className="att-table-wrap" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Table
              rowKey="id"
              size="small"
              className="att-table flex-table"
              columns={columns}
              dataSource={paginatedTemplates}
              pagination={false}
              scroll={{ x: 'max-content', y: '100%' }}
              onRow={() => ({ className: 'att-row' })}
            />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingRight: '4px', marginRight: '-4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', paddingBottom: '16px' }}>
              {paginatedTemplates.map((tpl) => (
                <div key={tpl.id} className="pc-card" onClick={() => router.push(`/letters-docs/templates/builder?id=${tpl.id}`)}>
                  <div className="pc-top">
                    <div className="pc-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                      {tpl.templateName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="pc-identity-body">
                      <div className="pc-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {tpl.templateName}
                        {tpl.tenantId === 'GLOBAL' && (
                          <span style={{ background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', fontWeight: 600 }}>GLOBAL</span>
                        )}
                      </div>
                      <div className="pc-client-line">
                        <span className="pc-client-key">Category:</span>
                        <span className="pc-client-val">{tpl.category?.categoryName || 'Uncategorized'}</span>
                      </div>
                    </div>
                    <Dropdown
                      overlayClassName="pc-dropdown"
                      menu={{
                        items: [
                          ...(perms.canUpdateLetterTemplate ? [{ key: 'edit', label: renderDropdownItem(<Edit size={16} />, 'Edit', 'Open in the builder', 'var(--border-slate-100)', 'var(--text-slate-600)'), onClick: (e: any) => { e.domEvent.stopPropagation(); router.push(`/letters-docs/templates/builder?id=${tpl.id}`); } }] : []),
                          ...(perms.canCreateLetterTemplate ? [{ key: 'dup', label: renderDropdownItem(<Copy size={16} />, 'Duplicate', 'Clone this template', 'var(--bg-green-50)', 'var(--text-holiday)'), onClick: (e: any) => { e.domEvent.stopPropagation(); handleDuplicate(tpl); } }] : []),
                          { type: 'divider' as const },
                          ...(perms.canDeleteLetterTemplate ? [{ key: 'del', label: renderDropdownItem(<Trash2 size={16} />, 'Delete', 'Move to trash', 'var(--bg-red-50)', 'var(--text-leave)', true), onClick: (e: any) => { e.domEvent.stopPropagation(); setDeleteTemplateId(tpl.id); } }] : []),
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
                        <span className="pc-foot-key">Created by</span>
                        <Avatar size={16} src={tpl.createdBy?.avatarUrl || tpl.createdBy?.avatar} style={{ background: 'var(--bg-blue-50)', color: '#3b82f6', fontSize: 8, fontWeight: 700 }}>
                          {initialsOf(tpl.createdBy?.name || '—')}
                        </Avatar>
                        <span className="pc-foot-val">{tpl.createdBy?.name || '—'}</span>
                      </span>
                      <span className="pc-foot-div" />
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Status:</span>
                        <span style={{ color: tpl.status === 'ACTIVE' ? 'var(--text-holiday)' : 'var(--text-slate-600)', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {tpl.status === 'ACTIVE' ? <CheckCircle2 size={12} /> : null}{tpl.status}
                        </span>
                      </span>
                      <span className="pc-foot-div" />
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Version:</span>
                        <span className="pc-foot-val">v{tpl.currentVersion}</span>
                      </span>
                      <span className="pc-foot-div" />
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Updated</span>
                        <span className="pc-foot-val">{new Date(tpl.updatedAt).toLocaleDateString()}</span>
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

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-pure-white)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '720px',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-slate-900)', margin: 0 }}>Document Categories</h2>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-slate-600)' }}
              >
                &times;
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: 'var(--bg-slate-50)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-slate-200)' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  placeholder="New category name (e.g., Offer Letter)"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-slate-200)', fontSize: '14px', marginBottom: '8px' }}
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-slate-200)', fontSize: '13px' }}
                />
              </div>
              <button
                type="submit"
                disabled={catLoading || !newCatName.trim()}
                style={{
                  padding: '0 20px',
                  borderRadius: '6px',
                  background: '#3b82f6',
                  color: '#fff',
                  fontWeight: 600,
                  border: 'none',
                  cursor: catLoading || !newCatName.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                {catLoading ? 'Adding...' : 'Add'}
              </button>
            </form>

            {/* Categories List */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-slate-600)', marginBottom: '10px' }}>EXISTING CATEGORIES</div>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: '8px',
                    border: '1px solid var(--border-slate-200)',
                    marginBottom: '8px',
                    background: cat.status === 'INACTIVE' ? 'var(--bg-slate-50)' : 'var(--bg-pure-white)',
                    padding: '12px 16px',
                    opacity: cat.status === 'INACTIVE' ? 0.7 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {editingCatId === cat.id ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '16px' }}>
                      <input
                        type="text"
                        value={editingCatName}
                        onChange={(e) => setEditingCatName(e.target.value)}
                        placeholder="Category name"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-slate-300)', fontSize: '13px' }}
                      />
                      <input
                        type="text"
                        value={editingCatDesc}
                        onChange={(e) => setEditingCatDesc(e.target.value)}
                        placeholder="Description (optional)"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border-slate-300)', fontSize: '12px' }}
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button onClick={() => handleSaveEditCategory(cat.id)} disabled={editingCatLoading || !editingCatName.trim()} style={{ padding: '4px 12px', background: '#3b82f6', color: '#fff', borderRadius: '4px', border: 'none', fontSize: '12px', cursor: editingCatLoading || !editingCatName.trim() ? 'not-allowed' : 'pointer' }}>{editingCatLoading ? 'Saving...' : 'Save'}</button>
                        <button onClick={() => setEditingCatId(null)} disabled={editingCatLoading} style={{ padding: '4px 12px', background: 'var(--bg-slate-100)', color: 'var(--text-slate-600)', borderRadius: '4px', border: '1px solid var(--border-slate-200)', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, paddingRight: '16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-slate-900)' }}>{cat.categoryName}</div>
                        {cat.description && <div style={{ fontSize: '12px', color: 'var(--text-slate-600)' }}>{cat.description}</div>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Switch
                          size="small"
                          checked={cat.status !== 'INACTIVE'}
                          onChange={(checked) => handleToggleCategoryStatus(cat.id, checked)}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatName(cat.categoryName);
                              setEditingCatDesc(cat.description || '');
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-slate-400)',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                            title="Edit Category"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-slate-400)',
                              padding: '6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fee2e2'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-slate-400)'; e.currentTarget.style.background = 'transparent'; }}
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AiCreateTemplateModal
        open={isZaiModalOpen}
        onClose={() => setIsZaiModalOpen(false)}
        categories={categories}
        onCreated={(id) => {
          setIsZaiModalOpen(false);
          router.push(`/letters-docs/templates/builder?id=${id}`);
        }}
      />
      <Modal
        open={!!deleteTemplateId}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--bg-red-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle color="#ef4444" size={22} />
            </div>
            <div>
              <span style={{ color: 'var(--text-slate-900)', fontSize: '18px', fontWeight: 600 }}>Delete Document Template</span>
            </div>
          </div>
        }
        onOk={handleDeleteTemplate}
        onCancel={() => setDeleteTemplateId(null)}
        okText="Delete Template"
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
          Are you sure you want to delete this template? Any generated letters referencing this template will remain intact, but you will no longer be able to generate new documents from it.
        </p>
      </Modal>

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-pure-white)', borderRadius: '16px', width: '100%', maxWidth: '600px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-slate-900)', margin: 0 }}>Template Settings</h2>
              <button onClick={() => setIsSettingsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-slate-600)' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-slate-700)' }}>Custom Formats</div>
              <Button type="primary" icon={<Plus size={14} />} onClick={() => setIsStructureTypeModalOpen(true)}>Add Format</Button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {structures.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-slate-500)', fontSize: '13px' }}>
                  No custom structures found. Create one to use in your templates!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {structures.map((s) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border-slate-200)', borderRadius: '8px', background: 'var(--bg-slate-50)' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-slate-900)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {s.name}
                          {s.tenantId === 'GLOBAL' && (
                            <span style={{ background: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 4px', borderRadius: '4px', fontWeight: 600 }}>GLOBAL</span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-slate-500)' }}>Created: {new Date(s.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select Structure Type Modal */}
      {isStructureTypeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--bg-pure-white)', borderRadius: '16px', width: '100%', maxWidth: '400px', padding: '28px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-slate-900)', margin: 0 }}>Select Structure Type</h2>
              <button onClick={() => setIsStructureTypeModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-slate-600)' }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={() => { setIsStructureTypeModalOpen(false); setIsStructureBuilderOpen(true); }}
                style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-slate-200)', background: 'var(--bg-slate-50)', textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border-slate-200)')}
              >
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-slate-900)', marginBottom: '4px' }}>Table Structure</div>
                <div style={{ fontSize: '12px', color: 'var(--text-slate-500)' }}>Create a custom table layout (e.g. for Salary or Benefits).</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structure Builder Modal */}
      {isStructureBuilderOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-pure-white)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--border-slate-200)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => setIsStructureBuilderOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-slate-600)', display: 'flex' }}>&times;</button>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Build Table Structure</h2>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button onClick={() => setIsStructureBuilderOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSaveStructure} loading={savingStructure}>Save Structure</Button>
            </div>
          </div>

          <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%', flex: 1, overflowY: 'auto' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Structure Name</label>
              <input
                type="text"
                placeholder="e.g. Contractor Salary Table"
                value={newStructureName}
                onChange={(e) => setNewStructureName(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-slate-300)', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Content Builder (Use Table Tool to create structure)</label>
              <div style={{ border: '1px solid var(--border-slate-300)', borderRadius: '8px', overflow: 'hidden' }}>
                <LetterTiptapEditor
                  content={newStructureHtml}
                  onChange={setNewStructureHtml}
                  minHeight={500}
                />
              </div>
            </div>
          </div>
        </div>
      )}

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
        .pc-actions:hover { background: var(--border-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 14px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 12px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-600); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 11px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 12px; background: var(--border-slate-200); }

        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3b82f6; }

        @media (max-width: 1100px) {
          .categories-btn-text {
            display: none;
          }
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
        .att-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 5px 10px !important; font-size: 12px !important; }
        .att-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .att-table .ant-table-tbody > tr.att-row:hover > td { background: var(--bg-slate-50) !important; }
      `}</style>
    </div>
  );
}
