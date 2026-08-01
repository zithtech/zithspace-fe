'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FilePlus,
  Search,
  Eye,
  Download,
  Save,
  FileText,
  FileCheck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Menu,
  Filter,
} from 'lucide-react';
import { LettersService, DocumentTemplate, GeneratedDocument, DocumentCategory } from '@/services/lettersService';
import { PositionService, Position } from '@/services/positionService';
import { DepartmentService, Department } from '@/services/departmentService';
import { PayrollV2Service, PayStructureListItem } from '@/services/payrollV2Service';
import { SearchableDropdown, SearchableDropdownOption } from '@/components/common/SearchableDropdown';
import { toast } from 'react-hot-toast';
import { Table, Button, Tooltip, Select } from 'antd';
import { LetterStatsCards, StatCellData } from '@/components/letters/LetterStatsCards';
import { SnippetsOutlined, FileTextOutlined, CheckCircleOutlined, StarOutlined } from '@ant-design/icons';

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];
import type { ColumnsType } from 'antd/es/table';
import { AppstoreOutlined, UnorderedListOutlined, ReloadOutlined } from '@ant-design/icons';

function LetterGenerationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<PayStructureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'card'>('list');

  // Selection & Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [documentNumber, setDocumentNumber] = useState<string>(`DOC-${Date.now().toString().slice(-6)}`);
  const [valuesMap, setValuesMap] = useState<Record<string, string>>({});
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const [filterPortalNode, setFilterPortalNode] = useState<Element | null>(null);

  useEffect(() => {
    setFilterPortalNode(document.getElementById('letters-docs-sidebar-filters'));
  }, []);

  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const total = templates.length;
  const pageCount = Math.ceil(total / tablePageSize) || 1;
  const paginatedTemplates = templates.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);

  const urlTemplateId = searchParams?.get('templateId') || searchParams?.get('template') || searchParams?.get('id') || '';
  const editId = searchParams?.get('editId') || null;

  useEffect(() => {
    if (urlTemplateId && urlTemplateId !== selectedTemplateId) {
      setSelectedTemplateId(urlTemplateId);
    } else if (!urlTemplateId && selectedTemplateId && !editId) {
      setSelectedTemplateId('');
    }
  }, [urlTemplateId, selectedTemplateId, editId]);

  // Live Preview & Generation State
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generatingAction, setGeneratingAction] = useState<'save' | 'docx' | 'pdf' | null>(null);
  const [lastGeneratedDoc, setLastGeneratedDoc] = useState<GeneratedDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(!!editId);
  const [initialValuesLoaded, setInitialValuesLoaded] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await LettersService.getTemplates({
        status: 'ACTIVE',
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined
      });
      setTemplates(templatesData);
    } catch (err: any) {
      toast.error(err.message || 'Failed to search templates');
    } finally {
      fetchPositionsAndDepartments();
    }
  };

  const statCells: StatCellData[] = useMemo(() => {
    const total = templates.length;
    const globalCount = templates.filter(t => t.tenantId === 'GLOBAL').length;
    const activeCount = templates.filter(t => t.status === 'ACTIVE').length;
    const recentCount = templates.filter(t => {
      if (!t.createdAt && !t.updatedAt) return false;
      const d = new Date(t.createdAt || t.updatedAt);
      return (new Date().getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    }).length;

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
    fetchTemplates();
  };

  const fetchPositionsAndDepartments = async () => {
    try {
      const [positionsData, departmentsData, structuresData] = await Promise.all([
        PositionService.getAll().catch(() => []),
        DepartmentService.getAll().catch(() => []),
        PayrollV2Service.listStructures(false).catch(() => []),
      ]);
      setPositions(positionsData || []);
      setDepartments(departmentsData || []);
      setSalaryStructures(structuresData || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchTemplatesAndPositions = async () => {
      try {
        setLoading(true);
        const [templatesData, categoriesData] = await Promise.all([
          LettersService.getTemplates({ status: 'ACTIVE' }),
          LettersService.getCategories(),
        ]);
        setTemplates(templatesData);
        setCategories(categoriesData || []);

        if (editId) {
          try {
            const doc = await LettersService.getGeneratedLetterById(editId);
            setSelectedTemplateId(doc.templateId || '');
            setDocumentNumber(doc.documentNumber || '');
          } catch (err: any) {
            toast.error('Failed to load document for editing');
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load active templates');
      } finally {
        fetchPositionsAndDepartments();
      }
    };
    fetchTemplatesAndPositions();
  }, [editId]);

  useEffect(() => {
    fetchTemplates();
  }, [selectedCategory]);

  const filterContent = filterPortalNode ? createPortal(
    <div className="lv-sidebar-filter-sec" style={{ marginTop: '20px', padding: '0 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
        <Filter size={12} /> Filters
      </div>
      <div className="lv-filter-group">
        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-slate-600)', marginBottom: '8px' }}>Category</label>
        <SearchableDropdown
          value={selectedCategory || ''}
          onChange={(newCatId) => setSelectedCategory(newCatId)}
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

  const salaryStructureOptions: SearchableDropdownOption[] = useMemo(() => {
    return salaryStructures.map((struct) => ({
      value: struct.id,
      label: struct.name,
      description: struct.code ? `Code: ${struct.code}` : undefined,
      meta: (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'var(--bg-slate-100)',
            color: 'var(--text-slate-600)',
            fontSize: '11px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {struct.monthlyCtc ? `₹${Number(struct.monthlyCtc).toLocaleString('en-IN')}/mo` : 'No CTC'}
        </span>
      ),
    }));
  }, [salaryStructures]);

  const positionOptions: SearchableDropdownOption[] = useMemo(() => {
    return positions.map((pos) => ({
      value: pos.title,
      label: pos.title,
      description: [
        pos.department?.name ? `Department: ${pos.department.name}` : null,
        pos.code ? `Code: ${pos.code}` : null,
      ].filter(Boolean).join(' • ') || 'General Position',
      meta: pos.grade?.name ? (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'var(--bg-blue-50)',
            color: 'var(--text-blue-700)',
            fontSize: '11px',
            fontWeight: 700,
            border: '1px solid #bfdbfe',
            whiteSpace: 'nowrap',
          }}
        >
          Grade: {pos.grade.name}
        </span>
      ) : (
        <span
          style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'var(--border-slate-100)',
            color: 'var(--text-slate-600)',
            fontSize: '11px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          General
        </span>
      ),
    }));
  }, [positions]);

  const departmentOptions: SearchableDropdownOption[] = useMemo(() => {
    const deptNames = Array.from(
      new Set([
        ...departments.map((d) => d.name),
        ...positions.map((p) => p.department?.name).filter((x): x is string => typeof x === 'string' && Boolean(x)),
      ])
    ).filter(Boolean);

    return deptNames.map((deptName) => {
      const deptObj = departments.find((d) => d.name === deptName);
      const gradesForDept = Array.from(
        new Set(
          positions
            .filter((p) => p.department?.name === deptName && p.grade?.name)
            .map((p) => p.grade!.name)
        )
      );

      return {
        value: deptName,
        label: deptName,
        description: [
          deptObj?.code ? `Code: ${deptObj.code}` : null,
          deptObj?.head?.name ? `Head: ${deptObj.head.name}` : null,
          gradesForDept.length > 0 ? `Grades: ${gradesForDept.join(', ')}` : null,
        ].filter(Boolean).join(' • ') || 'Organization Department',
        meta: gradesForDept.length > 0 ? (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'var(--bg-blue-50)',
              color: 'var(--text-blue-700)',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid #bfdbfe',
              whiteSpace: 'nowrap',
            }}
          >
            {gradesForDept.length === 1 ? `Grade: ${gradesForDept[0]}` : `Grades: ${gradesForDept.slice(0, 2).join(', ')}${gradesForDept.length > 2 ? '+' : ''}`}
          </span>
        ) : (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              background: 'var(--border-slate-100)',
              color: 'var(--text-slate-600)',
              fontSize: '11px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}
          >
            {deptObj?.code || 'Department'}
          </span>
        ),
      };
    });
  }, [departments, positions]);

  // When selected template changes, initialize values map
  useEffect(() => {
    if (!selectedTemplateId) {
      setSelectedTemplate(null);
      setValuesMap({});
      setPreviewHtml('');
      setShowValidationErrors(false);
      return;
    }
    setShowValidationErrors(false);
    const tpl = templates.find((t) => t.id === selectedTemplateId) || null;
    setSelectedTemplate(tpl);

    if (tpl) {
      const initialMap: Record<string, string> = {};
      // Populate standard placeholders
      if (tpl.placeholders && tpl.placeholders.length > 0) {
        tpl.placeholders.forEach((p) => {
          initialMap[p.placeholderKey] = p.defaultValue || '';
          if (p.placeholderKey === 'current_date' && !initialMap[p.placeholderKey]) {
            initialMap[p.placeholderKey] = new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          }
        });
      }

      if (editId) {
        if (!initialValuesLoaded) {
          LettersService.getGeneratedLetterById(editId).then(doc => {
            const docValues = { ...initialMap };
            doc.values?.forEach((v: any) => {
              docValues[v.placeholderKey] = v.placeholderValue;
            });
            setValuesMap(docValues);
            setInitialValuesLoaded(true);
            updatePreview(tpl.id, docValues);
          }).catch(() => {
            setValuesMap(initialMap);
            updatePreview(tpl.id, initialMap);
          });
        }
      } else {
        setValuesMap(initialMap);
        updatePreview(tpl.id, initialMap);
      }
    }
  }, [selectedTemplateId, editId, initialValuesLoaded, templates]);

  const activePlaceholders = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.placeholders) return [];
    const content = selectedTemplate.editorContent || '';

    return selectedTemplate.placeholders.filter((p) => {
      const key = p.placeholderKey;
      const label = p.placeholderLabel || '';
      const humanized = key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      // 1. Check if tagged by data-placeholder-key or data-id in HTML
      const attrRegex = new RegExp(`data-(?:placeholder-key|id|placeholder-label|label)=["'](?:${key}|${label})["']`, 'i');
      if (attrRegex.test(content)) return true;

      // 2. Check if present as {{Term}} or {{key:Term}} in text/HTML
      const searchTerms = Array.from(
        new Set([key, label, key.replace(/_/g, ' '), humanized].filter(Boolean))
      );

      for (const term of searchTerms) {
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const termRegex = new RegExp(`\\{\\{\\s*(?:${key}:)?${escapedTerm}\\s*\\}\\}`, 'i');
        if (termRegex.test(content)) return true;
        const looseRegex = new RegExp(`\\{\\{[^}]*${escapedTerm}[^}]*\\}\\}`, 'i');
        if (looseRegex.test(content)) return true;
      }

      return false;
    });
  }, [selectedTemplate]);

  const updatePreview = async (tplId: string, map: Record<string, string>) => {
    try {
      setPreviewLoading(true);
      const html = await LettersService.previewLetter(tplId, map);
      setPreviewHtml(html);
    } catch (err: any) {
      console.error('Failed to generate preview', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleValueChange = (key: string, val: string) => {
    const nextMap = { ...valuesMap, [key]: val };
    setValuesMap(nextMap);
    if (selectedTemplateId) {
      updatePreview(selectedTemplateId, nextMap);
    }
  };

  const handleGenerateDocument = async (downloadType?: 'pdf' | 'docx') => {
    if (!selectedTemplateId) {
      toast.error('Please select a document template first');
      return;
    }
    if (!documentNumber.trim()) {
      setShowValidationErrors(true);
      toast.error('Please specify a Document Number / Reference ID');
      return;
    }

    if (activePlaceholders && activePlaceholders.length > 0) {
      const missingPlaceholders = activePlaceholders.filter(
        (p) => !valuesMap[p.placeholderKey] || String(valuesMap[p.placeholderKey]).trim() === ''
      );

      const hasSalaryCTC = activePlaceholders.some((p) => p.placeholderKey === 'salary_ctc');
      if (hasSalaryCTC && !valuesMap['salary_structure_id']) {
        setShowValidationErrors(true);
        toast.error('Please select a Salary Structure');
        return;
      }

      if (missingPlaceholders.length > 0) {
        setShowValidationErrors(true);
        const missingNames = missingPlaceholders.map((p) => p.placeholderLabel || p.placeholderKey).join(', ');
        toast.error(`Please fill in required placeholder values: ${missingNames}`);
        return;
      }
    }

    try {
      setGeneratingAction(downloadType || 'save');
      toast.loading(isEditMode ? 'Updating personalized document...' : 'Generating personalized document...', { id: 'gen' });

      let generated;
      if (isEditMode && editId) {
        generated = await LettersService.updateGeneratedLetter(editId, {
          templateId: selectedTemplateId,
          documentNumber: documentNumber.trim(),
          values: valuesMap,
        });
        toast.success('Document updated successfully!', { id: 'gen' });
      } else {
        generated = await LettersService.generateLetter({
          templateId: selectedTemplateId,
          documentNumber: documentNumber.trim(),
          values: valuesMap,
        });
        toast.success('Document generated and saved to repository!', { id: 'gen' });
      }
      setLastGeneratedDoc(generated);

      if (downloadType === 'pdf') {
        await LettersService.downloadLetter(generated.id, 'pdf', `${generated.documentNumber}.pdf`);
      } else if (downloadType === 'docx') {
        await LettersService.downloadLetter(generated.id, 'docx', `${generated.documentNumber}.docx`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate document', { id: 'gen' });
    } finally {
      setGeneratingAction(null);
    }
  };

  return (
    <div className="letter-gen-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, minHeight: 0 }}>
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
            <FilePlus size={18} />
          </div>
          <div>
            <div className="lv-header-title">{isEditMode ? 'Edit Generated Document' : 'Letter Generation'}</div>
            <div className="lv-header-sub">
              {isEditMode ? 'Update placeholders and regenerate an existing document.' : 'Generate personalized documents from templates with real-time preview and PDF/DOCX export.'}
            </div>
          </div>
        </div>
        <div className="lv-header-actions">
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', marginRight: '12px' }}>
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

          <Tooltip title="Refresh">
            <button type="button" className="lv-ghost-btn" onClick={fetchTemplates}><ReloadOutlined spin={loading} /></button>
          </Tooltip>

          <Button
            type="primary"
            icon={<FileCheck size={15} />}
            onClick={() => router.push('/letters-docs/repository')}
            style={{ height: 34, borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            View Repository
          </Button>
        </div>
      </div>

      <div className="lv-content-body" style={{ padding: '24px 28px', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Step 1 or Step 2/3 Conditional View */}
        {/* Step 1 or Step 2/3 Conditional View */}
        {selectedTemplate ? (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Navigation Bar when a template is selected */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-pure-white)',
                padding: '10px 24px',
                borderRadius: '12px',
                border: '1px solid var(--border-slate-200)',
                marginBottom: '24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                flexShrink: 0,
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                  onClick={() => {
                    setSelectedTemplateId('');
                    router.push('/letters-docs/generate');
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--border-slate-100)',
                    border: '1px solid var(--border-slate-200)',
                    color: 'var(--text-slate-700)',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ArrowLeft size={16} />
                  Back to Templates
                </button>
                <div style={{ height: '24px', width: '1px', background: 'var(--border-slate-200)' }} />
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    Selected Template
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-slate-900)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {selectedTemplate.templateName}
                    {selectedTemplate.category && (
                      <span style={{ background: 'var(--bg-blue-50)', color: 'var(--text-blue-700)', fontSize: '12px', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                        {selectedTemplate.category.categoryName}
                      </span>
                    )}
                    <span style={{ fontSize: '13px', color: 'var(--text-slate-600)', fontWeight: 500 }}>
                      · v{selectedTemplate.currentVersion}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <SearchableDropdown
                  value={selectedTemplateId || ''}
                  onChange={(val) => {
                    if (val) {
                      setSelectedTemplateId(val);
                      router.push(`/letters-docs/generate?templateId=${val}`);
                    } else {
                      setSelectedTemplateId('');
                      router.push('/letters-docs/generate');
                    }
                  }}
                  placeholder="Change Template..."
                  options={templates.map((t) => ({
                    value: t.id,
                    label: t.templateName,
                    description: t.category ? t.category.categoryName : 'Uncategorized'
                  }))}
                  hideAvatar={true}
                  width={300}
                  style={{
                    minHeight: '40px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-slate-200)',
                    background: 'var(--bg-pure-white)'
                  }}
                />
              </div>
            </div>

            {/* Step 2 & 3: Split Grid for Form and Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1fr)', gap: '24px', flex: 1, minHeight: 0 }}>
              {/* Left: Live Preview Paper */}
              <div style={{ background: 'var(--bg-pure-white)', borderRadius: '12px', border: '1px solid var(--border-slate-200)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px 20px', background: 'var(--bg-slate-50)', borderBottom: '1px solid var(--border-slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-slate-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Eye size={16} style={{ color: '#3b82f6' }} />
                    Live Document Preview
                  </span>
                  {previewLoading && <span style={{ fontSize: '12px', color: 'var(--text-slate-400)' }}>Updating preview...</span>}
                </div>

                <div
                  style={{
                    padding: '36px 40px',
                    flex: 1,
                    overflowY: 'auto',
                    background: 'var(--bg-pure-white)',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.02)',
                  }}
                >
                  {previewHtml ? (
                    <div
                      className="preview-paper-content"
                      dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                  ) : (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-slate-400)' }}>
                      Select a template to generate live preview.
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Dynamic Placeholder Form */}
              <div style={{ background: 'var(--bg-pure-white)', borderRadius: '12px', padding: '24px', border: '1px solid var(--border-slate-200)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-slate-900)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <span style={{ background: '#3b82f6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>2</span>
                  Fill Dynamic Placeholders
                </h2>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                  <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-slate-100)' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-slate-700)', marginBottom: '6px' }}>
                    Document Number / Reference ID <span style={{ color: 'var(--text-leave)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={documentNumber}
                    onChange={(e) => {
                      setDocumentNumber(e.target.value);
                      if (showValidationErrors && e.target.value.trim()) {
                        setShowValidationErrors(false);
                      }
                    }}
                    placeholder="e.g. OFF-2026-001"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: showValidationErrors && !documentNumber.trim() ? '1px solid #ef4444' : '1px solid var(--border-slate-200)',
                      background: showValidationErrors && !documentNumber.trim() ? 'var(--bg-red-50)' : 'var(--bg-pure-white)',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-slate-900)',
                      outline: 'none',
                    }}
                  />
                  {showValidationErrors && !documentNumber.trim() ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-leave)', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                      Document Number is required.
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-slate-600)', marginTop: '4px', display: 'block' }}>
                      Unique reference number for tracking and auditing in repository.
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {activePlaceholders && activePlaceholders.length > 0 ? (
                    activePlaceholders.map((p) => {
                      const isMissing = showValidationErrors && (!valuesMap[p.placeholderKey] || String(valuesMap[p.placeholderKey]).trim() === '');
                      return (
                        <div key={p.placeholderKey}>
                          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-slate-700)', marginBottom: '6px' }}>
                            {p.placeholderLabel}{' '}
                            <span style={{ color: 'var(--text-leave)', fontWeight: 700 }}>*</span>{' '}
                            <span style={{ fontSize: '11px', color: 'var(--text-slate-400)', fontWeight: 400, fontFamily: 'monospace' }}>
                              ({p.placeholderKey})
                            </span>
                          </label>
                          {p.placeholderKey === 'designation' ||
                            p.placeholderKey === 'designation_title' ||
                            p.placeholderLabel.toLowerCase().includes('designation') ||
                            p.placeholderLabel.toLowerCase().includes('position') ? (
                            <SearchableDropdown
                              value={valuesMap[p.placeholderKey] || null}
                              onChange={(val) => handleValueChange(p.placeholderKey, val || '')}
                              options={positionOptions}
                              placeholder="Select Designation / Position..."
                              searchPlaceholder="Search by position title, department, or grade..."
                              freeText={true}
                              hideAvatar={true}
                              style={{
                                width: '100%',
                                minHeight: '40px',
                                border: isMissing ? '1px solid #ef4444' : undefined,
                                background: isMissing ? 'var(--bg-red-50)' : undefined,
                                borderRadius: '8px',
                              }}
                            />
                          ) : p.placeholderKey === 'department' ||
                            p.placeholderLabel.toLowerCase().includes('department') ? (
                            <SearchableDropdown
                              value={valuesMap[p.placeholderKey] || null}
                              onChange={(val) => handleValueChange(p.placeholderKey, val || '')}
                              options={departmentOptions}
                              placeholder="Select Department..."
                              searchPlaceholder="Search by department name, code, or associated grades..."
                              freeText={true}
                              hideAvatar={true}
                              style={{
                                width: '100%',
                                minHeight: '40px',
                                border: isMissing ? '1px solid #ef4444' : undefined,
                                background: isMissing ? 'var(--bg-red-50)' : undefined,
                                borderRadius: '8px',
                              }}
                            />
                          ) : (
                            <React.Fragment>
                              <input
                                type={p.dataType === 'date' ? 'date' : p.dataType === 'number' ? 'number' : 'text'}
                                value={valuesMap[p.placeholderKey] || ''}
                                onChange={(e) => handleValueChange(p.placeholderKey, e.target.value)}
                                placeholder={`Enter ${p.placeholderLabel}...`}
                                style={{
                                  width: '100%',
                                  padding: '10px 14px',
                                  borderRadius: '8px',
                                  border: isMissing ? '1px solid #ef4444' : '1px solid var(--border-slate-200)',
                                  background: isMissing ? 'var(--bg-red-50)' : 'var(--bg-pure-white)',
                                  fontSize: '14px',
                                  outline: 'none',
                                }}
                              />
                              {p.placeholderKey === 'salary_ctc' && (
                                <div style={{ marginTop: '14px' }}>
                                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-slate-700)', marginBottom: '6px' }}>
                                    Salary Structure <span style={{ color: 'var(--text-leave)', fontWeight: 700 }}>*</span> <span style={{ fontSize: '11px', color: 'var(--text-slate-400)', fontWeight: 400, fontFamily: 'monospace' }}>(salary_structure_id)</span>
                                  </label>
                                  <SearchableDropdown
                                    value={valuesMap['salary_structure_id'] || null}
                                    onChange={(val) => handleValueChange('salary_structure_id', val || '')}
                                    options={salaryStructureOptions}
                                    placeholder="Select Salary Structure..."
                                    searchPlaceholder="Search structures..."
                                    freeText={false}
                                    hideAvatar={true}
                                    emptyComponent={
                                      <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                                        <div style={{ color: 'var(--text-slate-500)', fontSize: '13px', marginBottom: '12px' }}>
                                          No salary structures found.
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // Close any open popovers by blurring the active element
                                            if (document.activeElement instanceof HTMLElement) {
                                              document.activeElement.blur();
                                            }
                                            router.push('/payroll-v2/structures');
                                          }}
                                          style={{
                                            padding: '6px 14px',
                                            background: '#3b82f6',
                                            color: '#ffffff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                          }}
                                        >
                                          <FilePlus size={14} />
                                          Create Salary Structure
                                        </button>
                                      </div>
                                    }
                                    style={{
                                      width: '100%',
                                      minHeight: '40px',
                                      border: showValidationErrors && !valuesMap['salary_structure_id'] ? '1px solid #ef4444' : undefined,
                                      background: showValidationErrors && !valuesMap['salary_structure_id'] ? 'var(--bg-red-50)' : undefined,
                                      borderRadius: '8px',
                                    }}
                                  />
                                  {showValidationErrors && !valuesMap['salary_structure_id'] && (
                                    <span style={{ fontSize: '11px', color: 'var(--text-leave)', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                                      Salary Structure is required.
                                    </span>
                                  )}
                                </div>
                              )}
                            </React.Fragment>
                          )}
                          {isMissing && (
                            <span style={{ fontSize: '11px', color: 'var(--text-leave)', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                              {p.placeholderLabel} is required.
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ color: 'var(--text-slate-600)', fontSize: '14px', padding: '10px 0' }}>
                      This template has no defined placeholders. You can generate it directly.
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 1: Template Selector */
          <div style={{ marginBottom: '24px' }}>
            <LetterStatsCards statCells={statCells} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-slate-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#3b82f6', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>1</span>
                Select Document Template
              </h2>
              <div className="pp-segmented">
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
                <button type="button" className={view === 'card' ? 'is-active' : ''} onClick={() => setView('card')} aria-label="Card view"><AppstoreOutlined /></button>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: '20px', color: 'var(--text-slate-600)', fontSize: '14px' }}>Loading active templates...</div>
            ) : templates.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-slate-600)' }}>
                No active document templates available. Please create or activate a template in Template Management first.
              </div>
            ) : view === 'list' ? (
              <div className="att-table-wrap" style={{ marginTop: '16px' }}>
                <Table
                  rowKey="id"
                  size="small"
                  className="att-table"
                  columns={[
                    {
                      title: 'TEMPLATE NAME',
                      dataIndex: 'templateName',
                      key: 'templateName',
                      render: (_: any, tpl: DocumentTemplate) => (
                        <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-slate-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FileText size={16} style={{ color: '#3b82f6' }} />
                          {tpl.templateName}
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
                      render: (ver: number) => <span style={{ color: '#3b82f6', fontWeight: 600, fontSize: '12px' }}>v{ver}</span>,
                    },
                  ]}
                  dataSource={paginatedTemplates}
                  pagination={false}
                  scroll={{ x: 'max-content', y: 'calc(100vh - 380px)' }}
                  onRow={(tpl) => ({
                    className: 'att-row',
                    onClick: () => {
                      setSelectedTemplateId(tpl.id);
                      router.push(`/letters-docs/generate?templateId=${tpl.id}`);
                    },
                    style: { cursor: 'pointer', background: selectedTemplateId === tpl.id ? 'var(--bg-blue-50)' : undefined }
                  })}
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginTop: '16px' }}>
                {paginatedTemplates.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tpl.id}
                      className="pc-card"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        router.push(`/letters-docs/generate?templateId=${tpl.id}`);
                      }}
                      style={{
                        border: isSelected ? '2px solid #3b82f6' : '1px solid var(--border-slate-200)',
                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                        cursor: 'pointer'
                      }}
                    >
                      <div className="pc-top">
                        <div className="pc-avatar" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
                          {tpl.templateName.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="pc-identity-body">
                          <div className="pc-title">{tpl.templateName}</div>
                          <div className="pc-client-line">
                            <span className="pc-client-key">Category:</span>
                            <span className="pc-client-val">{tpl.category?.categoryName || 'Uncategorized'}</span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />}
                      </div>
                      <div className="pc-foot">
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <RefreshCw size={12} style={{ color: 'var(--text-slate-400)' }} />
                            <span className="pc-foot-key">Version</span>
                            <span className="pc-foot-val">v{tpl.currentVersion}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}


          </div>
        )}
      </div>

      {/* Pagination Footer for Template Selector */}
      {total > 0 && !selectedTemplate && (
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

      {/* Sticky Footer when template is selected */}
      {selectedTemplate && (
        <div
          className="lv-footer"
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 30,
            background: 'var(--bg-pure-white)',
            borderTop: '1px solid var(--border-slate-200)',
            padding: '16px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          <button
            onClick={() => handleGenerateDocument()}
            disabled={generatingAction !== null}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'var(--bg-slate-50)',
              border: '1px solid var(--border-slate-200)',
              color: 'var(--text-slate-700)',
              fontWeight: 600,
              fontSize: '14px',
              cursor: generatingAction !== null ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              opacity: generatingAction !== null ? 0.7 : 1,
            }}
          >
            {generatingAction === 'save' ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            {generatingAction === 'save' ? (isEditMode ? 'Saving...' : 'Saving...') : (isEditMode ? 'Save Updates' : 'Save Only')}
          </button>

          <button
            onClick={() => handleGenerateDocument('docx')}
            disabled={generatingAction !== null}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: 'var(--bg-blue-50)',
              border: '1px solid #bfdbfe',
              color: '#1e40af',
              fontWeight: 600,
              fontSize: '14px',
              cursor: generatingAction !== null ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
              opacity: generatingAction !== null ? 0.7 : 1,
            }}
          >
            {generatingAction === 'docx' ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {generatingAction === 'docx' ? 'Downloading...' : 'Download DOCX'}
          </button>

          <button
            onClick={() => handleGenerateDocument('pdf')}
            disabled={generatingAction !== null}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#3b82f6',
              color: 'var(--bg-pure-white)',
              fontWeight: 700,
              fontSize: '14px',
              border: 'none',
              cursor: generatingAction !== null ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.15s ease',
              opacity: generatingAction !== null ? 0.7 : 1,
            }}
          >
            {generatingAction === 'pdf' ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            {generatingAction === 'pdf' ? (isEditMode ? 'Updating...' : 'Generating...') : (isEditMode ? 'Update & Download PDF' : 'Generate & Download PDF')}
          </button>
        </div>
      )}

      <style jsx global>{`
        .pc-card {
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: var(--border-slate-200); }
        .pc-card.is-selected { border-color: #3b82f6; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15); }

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

        .att-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .att-table, .att-table.ant-table-wrapper, .att-table .ant-table, .att-table .ant-table-container, .att-table .ant-table-content, .att-table .ant-table-header, .att-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .att-table .ant-table-thead > tr > th,
        .att-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .att-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; font-size: 12px !important; }
        .att-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .att-table .ant-table-tbody > tr.att-row:hover > td { background: var(--bg-slate-50) !important; }

        .preview-paper-content {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-slate-900);
        }
        .preview-paper-content p {
          margin-bottom: 1em;
        }
        .preview-paper-content h1 {
          font-size: 1.8em !important;
          font-weight: 700 !important;
          margin-top: 1.2em !important;
          margin-bottom: 0.5em !important;
          color: var(--text-slate-900) !important;
        }
        .preview-paper-content h2 {
          font-size: 1.4em !important;
          font-weight: 600 !important;
          margin-top: 1.2em !important;
          margin-bottom: 0.5em !important;
          color: var(--text-slate-900) !important;
        }
        .preview-paper-content h3 {
          font-size: 1.2em !important;
          font-weight: 600 !important;
          margin-top: 1em !important;
          margin-bottom: 0.5em !important;
          color: var(--text-slate-700) !important;
        }
        .preview-paper-content h4,
        .preview-paper-content h5,
        .preview-paper-content h6 {
          font-size: 1.1em !important;
          font-weight: 600 !important;
          margin-top: 1em !important;
          margin-bottom: 0.5em !important;
          color: var(--text-slate-700) !important;
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
          background-color: var(--border-slate-100);
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
      `}</style>
    </div>
  );
}

export default function LetterGenerationPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-slate-600)' }}>Loading Letter Generator...</div>}>
      <LetterGenerationContent />
    </Suspense>
  );
}
