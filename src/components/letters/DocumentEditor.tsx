'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import {
  ArrowLeft,
  Save,
  Download,
  Eye,
  Edit3,
  FileText,
  ZoomIn,
  ZoomOut,
  Sliders,
  Settings,
  Layers,
  LayoutTemplate,
  AlignVerticalSpaceAround,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  Trash2,
} from 'lucide-react';
import LetterTiptapEditor from './LetterTiptapEditor';
import { LettersService } from '@/services/lettersService';
import { toast } from 'react-hot-toast';
import { Drawer, Button, Tooltip, Tag, Switch, Radio } from 'antd';
import ZukvoLoader from '@/components/common/ZukvoLoader';

interface DocumentEditorProps {
  documentId?: string;
}

const MARGIN_PRESETS = [
  { name: 'Normal', top: '20mm', bottom: '20mm', left: '20mm', right: '20mm', desc: 'Standard 20mm' },
  { name: 'Narrow', top: '12.7mm', bottom: '12.7mm', left: '12.7mm', right: '12.7mm', desc: 'Compact 12.7mm' },
  { name: 'Moderate', top: '25.4mm', bottom: '25.4mm', left: '19mm', right: '19mm', desc: 'Book style' },
  { name: 'Wide', top: '25.4mm', bottom: '25.4mm', left: '31.8mm', right: '31.8mm', desc: 'Executive' },
];

export default function DocumentEditor({ documentId }: DocumentEditorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const perms = usePermission() as unknown as Record<string, any>;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingType, setDownloadingType] = useState<'pdf' | 'docx' | null>(null);

  // Document metadata state
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(documentId);
  const [documentNumber, setDocumentNumber] = useState<string>(`DOC-${Date.now().toString().slice(-6)}`);
  const [documentName, setDocumentName] = useState<string>('');
  const [status, setStatus] = useState<string>('DRAFT');

  // Editor and page config state
  const [editorContent, setEditorContent] = useState<string>('<p>Start writing your document here...</p>');
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>('editor');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Page setup / layout config
  const [isPageSettingsOpen, setIsPageSettingsOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'margins' | 'header' | 'footer'>('margins');
  const [pageConfig, setPageConfig] = useState<any>({
    marginTop: '20mm',
    marginRight: '20mm',
    marginBottom: '20mm',
    marginLeft: '20mm',
    borderWidth: '0px',
    borderColor: '#000000',
    borderStyle: 'solid',
    headerHtml: '',
    footerHtml: '',
  });

  // Permission check
  useEffect(() => {
    if (perms.canGenerateLetter === false && perms.canReadLetter === false) {
      router.push('/dashboard');
    }
  }, [perms.canGenerateLetter, perms.canReadLetter, router]);

  // Load existing doc if editing
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);

        if (documentId) {
          const doc = await LettersService.getGeneratedLetterById(documentId);
          if (!isMounted) return;

          setDocumentNumber(doc.documentNumber || '');
          setDocumentName(doc.documentName || '');
          setStatus(doc.status || 'GENERATED');

          let rawContent = (doc as any).snapshotContent || '';
          if (rawContent) {
            const configRegex = /<script\s+id="zith-page-config"\s+type="application\/json">([\s\S]*?)<\/script>/i;
            const match = configRegex.exec(rawContent);
            if (match && match[1]) {
              try {
                setPageConfig(JSON.parse(match[1]));
              } catch (e) {
                console.error('Failed to parse document page config:', e);
              }
              rawContent = rawContent.replace(configRegex, '');
            }
            setEditorContent(rawContent);
          }
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load document');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [documentId]);

  // Handle Save
  const handleSave = async () => {
    const titleToUse = documentName.trim() || `Document ${documentNumber}`;
    if (!editorContent || editorContent.trim() === '' || editorContent === '<p></p>') {
      toast.error('Document content cannot be empty');
      return;
    }

    try {
      setSaving(true);
      const configScript = `\n<script id="zith-page-config" type="application/json">${JSON.stringify(pageConfig)}</script>`;
      const finalContent = editorContent + configScript;

      if (currentDocId) {
        const updated = await LettersService.updateGeneratedLetter(currentDocId, {
          documentNumber,
          documentName: titleToUse,
          customContent: finalContent,
          values: {},
        });
        toast.success('Document updated successfully!');
        setStatus(updated.status || 'UPDATED');
      } else {
        const created = await LettersService.generateLetter({
          documentNumber,
          documentName: titleToUse,
          customContent: finalContent,
          values: {},
        });
        toast.success('Document created successfully!');
        setCurrentDocId(created.id);
        setStatus(created.status || 'GENERATED');
        router.replace(`/letters-docs/repository/create?id=${created.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  // Handle Download PDF/DOCX
  const handleDownload = async (type: 'pdf' | 'docx') => {
    if (!currentDocId) {
      toast.error('Please save the document first to download.');
      return;
    }
    try {
      setDownloadingType(type);
      const safeTitle = (documentName || documentNumber || 'document').replace(/\s+/g, '_');
      await LettersService.downloadLetter(currentDocId, type, `${safeTitle}.${type}`);
      toast.success(`${type.toUpperCase()} downloaded successfully`);
    } catch (err: any) {
      toast.error(`Failed to download ${type.toUpperCase()}`);
    } finally {
      setDownloadingType(null);
    }
  };

  // Preset Layout Helpers
  const applyMarginPreset = (preset: typeof MARGIN_PRESETS[0]) => {
    setPageConfig((prev: any) => ({
      ...prev,
      marginTop: preset.top,
      marginBottom: preset.bottom,
      marginLeft: preset.left,
      marginRight: preset.right,
    }));
    toast.success(`${preset.name} margins applied`);
  };

  const applyHeaderPreset = (type: 'left-details' | 'left-logo' | 'center' | 'clear') => {
    if (type === 'clear') {
      setPageConfig((prev: any) => ({ ...prev, headerHtml: '' }));
      toast.success('Header cleared');
      return;
    }
    const company = (user as any)?.companyName || 'Company Name';
    const email = (user as any)?.companyEmail || (user as any)?.workEmail || 'contact@company.com';
    const address = (user as any)?.companyLocation || 'Company Address, City, Country';

    let html = '';
    if (type === 'left-details') {
      html = `<table style="width: 100%; border: none; margin-bottom: 0px;"><tr><td style="border: none; text-align: left; vertical-align: middle; width: 440px;"><p style="margin: 0 0 2px 0; font-weight: bold; font-size: 14px; line-height: 1.2;">${company}</p><p style="margin: 0 0 2px 0; font-size: 10px; color: #64748b; line-height: 1.2;">${address}</p><p style="margin: 0; font-size: 10px; color: #64748b; line-height: 1.2;">${email}</p></td><td style="border: none; text-align: right; vertical-align: middle; width: 180px;"><button data-type="logo-upload"></button></td></tr></table>`;
    } else if (type === 'left-logo') {
      html = `<table style="width: 100%; border: none; margin-bottom: 0px;"><tr><td style="border: none; text-align: left; vertical-align: middle; width: 180px;"><button data-type="logo-upload"></button></td><td style="border: none; text-align: right; vertical-align: middle; width: 440px;"><p style="margin: 0 0 2px 0; font-weight: bold; font-size: 14px; line-height: 1.2;">${company}</p><p style="margin: 0 0 2px 0; font-size: 10px; color: #64748b; line-height: 1.2;">${address}</p><p style="margin: 0; font-size: 10px; color: #64748b; line-height: 1.2;">${email}</p></td></tr></table>`;
    } else if (type === 'center') {
      html = `<div style="text-align: center; margin-bottom: 0px;"><p style="margin: 0 0 6px 0; text-align: center;"><button data-type="logo-upload"></button></p><p style="margin: 0 0 2px 0; font-weight: bold; font-size: 14px; text-align: center; line-height: 1.2;">${company}</p><p style="margin: 0; font-size: 10px; color: #64748b; text-align: center; line-height: 1.2;">${address} | ${email}</p></div>`;
    }
    setPageConfig((prev: any) => ({ ...prev, headerHtml: html }));
    toast.success('Header layout applied');
  };

  const applyFooterPreset = (type: 'confidential' | 'address-center' | 'right-num' | 'clear') => {
    if (type === 'clear') {
      setPageConfig((prev: any) => ({ ...prev, footerHtml: '' }));
      toast.success('Footer cleared');
      return;
    }
    if (type === 'confidential') {
      const html = `<div style="text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px;">Confidential Document &bull; Page [Page #]</div>`;
      setPageConfig((prev: any) => ({ ...prev, footerHtml: html }));
    } else if (type === 'address-center') {
      const company = (user as any)?.companyName || 'Company Name';
      const address = (user as any)?.companyLocation || 'Company Address, City, Country';
      const html = `<div style="text-align: center; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;"><p style="margin: 0 0 2px 0; font-weight: 600;">${company} &bull; ${address}</p><p style="margin: 0; color: #94a3b8;">Page [Page #]</p></div>`;
      setPageConfig((prev: any) => ({ ...prev, footerHtml: html }));
    } else if (type === 'right-num') {
      const html = `<div style="text-align: right; font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">Page [Page #]</div>`;
      setPageConfig((prev: any) => ({ ...prev, footerHtml: html }));
    }
    toast.success('Footer layout applied');
  };

  const resetPageConfigToDefaults = () => {
    setPageConfig({
      marginTop: '20mm',
      marginRight: '20mm',
      marginBottom: '20mm',
      marginLeft: '20mm',
      borderWidth: '0px',
      borderColor: '#000000',
      borderStyle: 'solid',
      headerHtml: '',
      footerHtml: '',
    });
    toast.success('Reset to default A4 page layout');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '12px' }}>
        <ZukvoLoader />
        <span style={{ fontSize: '13px', color: 'var(--text-slate-500)', fontWeight: 500 }}>Loading Document Editor...</span>
      </div>
    );
  }

  // Split preview content into pages if page-breaks are present
  const previewPages = editorContent
    .split(/<div[^>]*class="[^"]*html2pdf__page-break[^"]*"[^>]*><\/div>/gi)
    .map((p) => p.trim())
    .filter((p) => !!p);

  const displayPages = previewPages.length > 0 ? previewPages : [editorContent];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
        flex: 1,
        overflow: 'hidden',
        background: '#f1f5f9',
      }}
    >
      {/* ─── Premium Header Bar ────────────────────────────────────────────── */}
      <header
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          height: '56px',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
          zIndex: 20,
        }}
      >
        {/* Left: Back Button + Doc Title + Doc Number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <button
            type="button"
            onClick={() => router.push('/letters-docs/repository')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: '32px',
              padding: '0 12px',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }}
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div style={{ width: '1px', height: '22px', background: '#e2e8f0', flexShrink: 0 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1, maxWidth: '560px' }}>
            <FileText size={17} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Untitled Document..."
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#0f172a',
                border: '1px solid transparent',
                borderRadius: '6px',
                padding: '4px 8px',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                textOverflow: 'ellipsis',
                transition: 'all 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontWeight: 600,
                color: '#475569',
                background: '#f8fafc',
                padding: '2px 8px',
                borderRadius: '5px',
                border: '1px solid #e2e8f0',
                letterSpacing: '0.02em',
                whiteSpace: 'nowrap',
              }}
            >
              {documentNumber}
            </span>
            <Tag
              color={currentDocId ? 'blue' : 'gold'}
              style={{
                margin: 0,
                fontSize: '10px',
                lineHeight: '16px',
                height: '18px',
                borderRadius: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {currentDocId ? status : 'DRAFT'}
            </Tag>
          </div>
        </div>

        {/* Right: Page Setup, View Toggle, Downloads, Save CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Page Setup Button */}
          <Tooltip title="Configure page margins, border, header & footer">
            <button
              type="button"
              onClick={() => setIsPageSettingsOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
                padding: '0 11px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#94a3b8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
            >
              <Sliders size={13} style={{ color: '#3b82f6' }} />
              Page Setup
            </button>
          </Tooltip>

          <div style={{ width: '1px', height: '22px', background: '#e2e8f0', margin: '0 2px' }} />

          {/* Segmented View Mode Toggle */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '9px',
              border: '1px solid #e2e8f0',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode('editor')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: viewMode === 'editor' ? 600 : 500,
                cursor: 'pointer',
                background: viewMode === 'editor' ? '#ffffff' : 'transparent',
                color: viewMode === 'editor' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'editor' ? '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'editor') {
                  e.currentTarget.style.color = '#1e293b';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'editor') {
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Edit3 size={13.5} style={{ color: viewMode === 'editor' ? '#2563eb' : '#94a3b8' }} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: '7px',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: viewMode === 'preview' ? 600 : 500,
                cursor: 'pointer',
                background: viewMode === 'preview' ? '#ffffff' : 'transparent',
                color: viewMode === 'preview' ? '#0f172a' : '#64748b',
                boxShadow: viewMode === 'preview' ? '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                if (viewMode !== 'preview') {
                  e.currentTarget.style.color = '#1e293b';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (viewMode !== 'preview') {
                  e.currentTarget.style.color = '#64748b';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Eye size={13.5} style={{ color: viewMode === 'preview' ? '#2563eb' : '#94a3b8' }} />
              <span>Preview</span>
              {displayPages.length > 1 && (
                <span
                  style={{
                    background: viewMode === 'preview' ? '#eff6ff' : '#e2e8f0',
                    color: viewMode === 'preview' ? '#2563eb' : '#64748b',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    marginLeft: '2px',
                  }}
                >
                  {displayPages.length}p
                </span>
              )}
            </button>
          </div>

          {/* Downloads (if existing doc) */}
          {currentDocId && (
            <>
              <Tooltip title="Download PDF">
                <Button
                  icon={<Download size={13} />}
                  onClick={() => handleDownload('pdf')}
                  loading={downloadingType === 'pdf'}
                  style={{ height: 32, borderRadius: 7, fontSize: '12px', fontWeight: 600 }}
                >
                  PDF
                </Button>
              </Tooltip>
              <Tooltip title="Download Word Document">
                <Button
                  icon={<Download size={13} />}
                  onClick={() => handleDownload('docx')}
                  loading={downloadingType === 'docx'}
                  style={{ height: 32, borderRadius: 7, fontSize: '12px', fontWeight: 600 }}
                >
                  DOCX
                </Button>
              </Tooltip>
            </>
          )}

          {/* Primary Save Button */}
          <Button
            type="primary"
            icon={<Save size={15} />}
            onClick={handleSave}
            loading={saving}
            style={{
              height: 32,
              borderRadius: 7,
              fontWeight: 600,
              fontSize: '13px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 16px',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)',
            }}
          >
            {currentDocId ? 'Save Changes' : 'Create Document'}
          </Button>
        </div>
      </header>

      {/* ─── Main Editor / Preview Canvas ───────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: viewMode === 'preview' ? 'auto' : 'hidden',
          padding: viewMode === 'editor' ? '16px 20px 20px' : '32px 24px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: viewMode === 'editor' ? '#f1f5f9' : '#e6ebf1',
          backgroundImage: viewMode === 'preview' ? 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)' : 'none',
          backgroundSize: '24px 24px',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Scoped CSS for Preview Mode rendering */}
        <style>{`
          .document-preview-sheet {
            transition: box-shadow 0.2s ease;
          }
          .document-preview-content {
            color: #1e293b;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.65;
            word-wrap: break-word;
          }
          .document-preview-content p {
            margin-top: 0;
            margin-bottom: 8px;
            line-height: 1.65;
          }
          .document-preview-content h1 {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-top: 18px;
            margin-bottom: 10px;
            line-height: 1.3;
          }
          .document-preview-content h2 {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-top: 14px;
            margin-bottom: 8px;
            line-height: 1.35;
          }
          .document-preview-content h3 {
            font-size: 15px;
            font-weight: 600;
            color: #334155;
            margin-top: 12px;
            margin-bottom: 6px;
            line-height: 1.4;
          }
          .document-preview-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            table-layout: fixed;
            font-size: 13.5px;
          }
          .document-preview-content td,
          .document-preview-content th {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
            vertical-align: top;
            box-sizing: border-box;
          }
          .document-preview-content th {
            background-color: #f8fafc;
            font-weight: 600;
            text-align: left;
            color: #0f172a;
          }
          .document-preview-content table[data-layout="side-by-side"],
          .document-preview-content table[style*="border: none"],
          .document-preview-content table[style*="border-style: none"],
          .document-preview-content table[style*="border-width: 0"] {
            border: none !important;
          }
          .document-preview-content table[data-layout="side-by-side"] td,
          .document-preview-content table[style*="border: none"] td,
          .document-preview-content table[style*="border-style: none"] td,
          .document-preview-content table[style*="border-width: 0"] td {
            border: none !important;
            padding: 4px 8px;
          }
          .document-preview-content img {
            max-width: 100% !important;
            height: auto !important;
            object-fit: contain;
            display: inline-block;
          }
          .document-preview-content td img,
          .document-preview-content th img {
            max-height: 120px !important;
            width: auto !important;
            max-width: 100% !important;
          }
          .document-preview-content img[style*="text-align: center"],
          .document-preview-content p[style*="text-align: center"] img {
            display: block;
            margin-left: auto;
            margin-right: auto;
          }
          .document-preview-content img[style*="text-align: right"],
          .document-preview-content p[style*="text-align: right"] img {
            display: block;
            margin-left: auto;
            margin-right: 0;
          }
          .document-preview-content ul {
            list-style-type: disc !important;
            list-style-position: outside !important;
            padding-left: 24px !important;
            margin: 8px 0 !important;
          }
          .document-preview-content ul ul {
            list-style-type: circle !important;
            margin: 4px 0 !important;
          }
          .document-preview-content ul ul ul {
            list-style-type: square !important;
          }
          .document-preview-content ol {
            list-style-type: decimal !important;
            list-style-position: outside !important;
            padding-left: 24px !important;
            margin: 8px 0 !important;
          }
          .document-preview-content ol ol {
            list-style-type: lower-alpha !important;
            margin: 4px 0 !important;
          }
          .document-preview-content ol ol ol {
            list-style-type: lower-roman !important;
          }
          .document-preview-content li {
            display: list-item !important;
            margin-bottom: 4px !important;
            line-height: 1.6;
          }
          .document-preview-content li p {
            margin-top: 0 !important;
            margin-bottom: 2px !important;
          }
          .document-preview-content blockquote {
            border-left: 4px solid #3b82f6;
            background: #f8fafc;
            padding: 10px 14px;
            margin: 12px 0;
            border-radius: 0 6px 6px 0;
            color: #334155;
          }
          .document-preview-content pre {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            font-family: monospace;
            font-size: 13px;
            overflow-x: auto;
          }
          .document-preview-content code {
            background: #f1f5f9;
            padding: 2px 5px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12.5px;
          }
          .document-preview-content span[data-placeholder-key],
          .document-preview-content .tiptap-placeholder-tag {
            color: #2563eb;
            font-weight: 600;
            background: #eff6ff;
            border: 1px solid #dbeafe;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 13px;
            display: inline-block;
          }
          .document-preview-content button[data-type="logo-upload"],
          .document-preview-content .logo-placeholder-btn,
          .document-preview-content [data-tiptap-ignore] {
            display: none !important;
          }
          .document-preview-header img,
          .document-preview-footer img {
            max-width: 100% !important;
            max-height: 120px !important;
            height: auto !important;
            object-fit: contain;
          }
          .document-preview-header table,
          .document-preview-footer table {
            width: 100%;
            border-collapse: collapse;
          }
          .document-preview-header table td,
          .document-preview-footer table td {
            vertical-align: top;
            border: none;
          }
        `}</style>

        {viewMode === 'editor' ? (
          /* Editor Paper Canvas Container */
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              height: '100%',
              flex: 1,
              minHeight: 0,
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header / Letterhead notice if configured */}
            {pageConfig.headerHtml && pageConfig.headerHtml.trim() !== '' && (
              <div
                style={{
                  padding: `${pageConfig.marginTop || '20mm'} ${pageConfig.marginRight || '20mm'} 12px ${pageConfig.marginLeft || '20mm'}`,
                  borderBottom: '1px dashed #cbd5e1',
                  background: '#fafafa',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>
                  Letterhead / Header Preview
                </div>
                <div dangerouslySetInnerHTML={{ __html: pageConfig.headerHtml }} />
              </div>
            )}

            {/* Rich Editor */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <LetterTiptapEditor
                content={editorContent}
                onChange={setEditorContent}
                bordered={false}
                minHeight={350}
              />
            </div>

            {/* Footer notice if configured */}
            {pageConfig.footerHtml && pageConfig.footerHtml.trim() !== '' && (
              <div
                style={{
                  padding: `12px ${pageConfig.marginRight || '20mm'} ${pageConfig.marginBottom || '20mm'} ${pageConfig.marginLeft || '20mm'}`,
                  borderTop: '1px dashed #cbd5e1',
                  background: '#fafafa',
                  flexShrink: 0,
                }}
              >
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>
                  Footer Preview
                </div>
                <div dangerouslySetInnerHTML={{ __html: pageConfig.footerHtml.replace(/\[Page #\]/g, '1') }} />
              </div>
            )}
          </div>
        ) : (
          /* Multi-Page A4 Live Preview */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
              minHeight: '100%',
            }}
          >
            {/* Pages Container with unified Zoom */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '36px',
                alignItems: 'center',
                width: '100%',
                zoom: previewZoom / 100,
                transition: 'zoom 0.15s ease',
              }}
            >
              {displayPages.map((pageHtml, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  {/* Page Header Bar */}
                  <div
                    style={{
                      width: '210mm',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                      padding: '0 4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          color: '#334155',
                          background: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        <FileText size={11} style={{ color: '#2563eb' }} />
                        Page {index + 1} of {displayPages.length}
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                        A4 Standard (210 × 297 mm)
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                      Margins: {pageConfig.marginTop || '20mm'} / {pageConfig.marginRight || '20mm'}
                    </div>
                  </div>

                  {/* Realistic Paper Sheet */}
                  <div
                    className="force-light-theme document-preview-sheet"
                    style={{
                      width: '210mm',
                      minHeight: '297mm',
                      background: '#ffffff',
                      boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                      borderRadius: '3px',
                      paddingTop: pageConfig.marginTop || '20mm',
                      paddingRight: pageConfig.marginRight || '20mm',
                      paddingBottom: pageConfig.marginBottom || '20mm',
                      paddingLeft: pageConfig.marginLeft || '20mm',
                      borderWidth: pageConfig.borderWidth || '0px',
                      borderStyle: pageConfig.borderStyle || 'solid',
                      borderColor: pageConfig.borderColor || '#000000',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Header / Letterhead */}
                    {pageConfig.headerHtml && (
                      <div
                        className="document-preview-header"
                        style={{ marginBottom: '20px', flexShrink: 0 }}
                        dangerouslySetInnerHTML={{ __html: pageConfig.headerHtml }}
                      />
                    )}

                    {/* Body Content */}
                    <div
                      className="document-preview-content"
                      style={{
                        flex: 1,
                      }}
                      dangerouslySetInnerHTML={{ __html: pageHtml }}
                    />

                    {/* Footer */}
                    {pageConfig.footerHtml && (
                      <div
                        className="document-preview-footer"
                        style={{ marginTop: '20px', flexShrink: 0 }}
                        dangerouslySetInnerHTML={{
                          __html: pageConfig.footerHtml.replace(/\[Page #\]/g, (index + 1).toString()),
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Floating Dock for Zoom & Document Actions */}
            <div
              style={{
                position: 'sticky',
                bottom: '24px',
                zIndex: 40,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '7px 18px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.9)',
                marginTop: '32px',
              }}
            >
              {/* Zoom Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Tooltip title="Zoom out (-10%)">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.max(50, z - 10))}
                    style={{
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#1e293b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    <ZoomOut size={14} />
                  </button>
                </Tooltip>

                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: '#1e293b',
                    minWidth: '48px',
                    textAlign: 'center',
                    userSelect: 'none',
                  }}
                >
                  {previewZoom}%
                </span>

                <Tooltip title="Zoom in (+10%)">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom((z) => Math.min(150, z + 10))}
                    style={{
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      color: '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#1e293b';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.color = '#475569';
                    }}
                  >
                    <ZoomIn size={14} />
                  </button>
                </Tooltip>
              </div>

              <div style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />

              {/* Quick Zoom Presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(80)}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: previewZoom === 80 ? '#2563eb' : '#64748b',
                    background: previewZoom === 80 ? '#eff6ff' : 'transparent',
                    border: previewZoom === 80 ? '1px solid #bfdbfe' : '1px solid transparent',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  Fit
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewZoom(100)}
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: previewZoom === 100 ? '#2563eb' : '#64748b',
                    background: previewZoom === 100 ? '#eff6ff' : 'transparent',
                    border: previewZoom === 100 ? '1px solid #bfdbfe' : '1px solid transparent',
                    padding: '3px 8px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                  }}
                >
                  100%
                </button>
              </div>

              <div style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />

              {/* Page count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={13.5} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                  {displayPages.length} {displayPages.length === 1 ? 'Page' : 'Pages'}
                </span>
              </div>

              {/* Quick Page Setup Drawer Trigger */}
              <div style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />
              <Tooltip title="Configure Margins, Letterhead & Borders">
                <button
                  type="button"
                  onClick={() => setIsPageSettingsOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#1e293b';
                    e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#475569';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <Sliders size={12.5} style={{ color: '#3b82f6' }} />
                  <span>Page Setup</span>
                </button>
              </Tooltip>

              {/* Quick PDF download button in preview */}
              {currentDocId && (
                <>
                  <div style={{ width: '1px', height: '18px', background: '#e2e8f0' }} />
                  <button
                    type="button"
                    onClick={() => handleDownload('pdf')}
                    disabled={downloadingType === 'pdf'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#ffffff',
                      background: '#2563eb',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      boxShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
                      opacity: downloadingType === 'pdf' ? 0.7 : 1,
                    }}
                  >
                    <Download size={13} />
                    <span>{downloadingType === 'pdf' ? 'Generating...' : 'Export PDF'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ─── Premium Page & Layout Setup Drawer ────────────────────────────── */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sliders size={17} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                  Page & Layout Setup
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                  A4 margins, page border, repeating letterhead & footer
                </div>
              </div>
            </div>
          </div>
        }
        placement="right"
        width={480}
        onClose={() => setIsPageSettingsOpen(false)}
        open={isPageSettingsOpen}
        bodyStyle={{ padding: '0px', display: 'flex', flexDirection: 'column' }}
        footer={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
            <button
              type="button"
              onClick={resetPageConfigToDefaults}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '6px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0f172a')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <RotateCcw size={13} />
              Reset Defaults
            </button>
            <Button type="primary" onClick={() => setIsPageSettingsOpen(false)} style={{ borderRadius: 7, fontWeight: 600 }}>
              Done
            </Button>
          </div>
        }
      >
        {/* Navigation Tabs Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            padding: '4px 8px 0',
          }}
        >
          <button
            type="button"
            onClick={() => setDrawerTab('margins')}
            style={{
              padding: '10px 8px',
              fontSize: '12px',
              fontWeight: drawerTab === 'margins' ? 700 : 600,
              color: drawerTab === 'margins' ? '#2563eb' : '#64748b',
              background: 'transparent',
              border: 'none',
              borderBottom: drawerTab === 'margins' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <Sliders size={13} />
            Margins & Border
          </button>
          <button
            type="button"
            onClick={() => setDrawerTab('header')}
            style={{
              padding: '10px 8px',
              fontSize: '12px',
              fontWeight: drawerTab === 'header' ? 700 : 600,
              color: drawerTab === 'header' ? '#2563eb' : '#64748b',
              background: 'transparent',
              border: 'none',
              borderBottom: drawerTab === 'header' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <LayoutTemplate size={13} />
            Header
          </button>
          <button
            type="button"
            onClick={() => setDrawerTab('footer')}
            style={{
              padding: '10px 8px',
              fontSize: '12px',
              fontWeight: drawerTab === 'footer' ? 700 : 600,
              color: drawerTab === 'footer' ? '#2563eb' : '#64748b',
              background: 'transparent',
              border: 'none',
              borderBottom: drawerTab === 'footer' ? '2px solid #2563eb' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease',
            }}
          >
            <AlignVerticalSpaceAround size={13} />
            Footer
          </button>
        </div>

        {/* Tab 1: Margins & Border */}
        {drawerTab === 'margins' && (
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Quick Margin Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                Quick Margin Presets
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {MARGIN_PRESETS.map((p) => {
                  const isCurrent =
                    (pageConfig.marginTop || '20mm') === p.top &&
                    (pageConfig.marginLeft || '20mm') === p.left;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyMarginPreset(p)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '7px',
                        border: isCurrent ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                        background: isCurrent ? 'rgba(59, 130, 246, 0.05)' : '#ffffff',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isCurrent) e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        if (!isCurrent) e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: isCurrent ? '#2563eb' : '#1e293b' }}>{p.name}</span>
                        {isCurrent && <Check size={12} style={{ color: '#2563eb' }} />}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Margin Dimensions */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                Custom Margins (e.g. 20mm, 15mm, 1in)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Top Margin
                  </label>
                  <input
                    type="text"
                    value={pageConfig.marginTop || '20mm'}
                    onChange={(e) => setPageConfig((prev: any) => ({ ...prev, marginTop: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Bottom Margin
                  </label>
                  <input
                    type="text"
                    value={pageConfig.marginBottom || '20mm'}
                    onChange={(e) => setPageConfig((prev: any) => ({ ...prev, marginBottom: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Left Margin
                  </label>
                  <input
                    type="text"
                    value={pageConfig.marginLeft || '20mm'}
                    onChange={(e) => setPageConfig((prev: any) => ({ ...prev, marginLeft: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Right Margin
                  </label>
                  <input
                    type="text"
                    value={pageConfig.marginRight || '20mm'}
                    onChange={(e) => setPageConfig((prev: any) => ({ ...prev, marginRight: e.target.value }))}
                    style={{
                      width: '100%',
                      height: '32px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid #cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#0f172a',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Page Border Settings */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Page Border</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Framing line around all printed document pages</div>
                </div>
                <Switch
                  checked={Boolean(pageConfig.borderWidth && pageConfig.borderWidth !== '0px' && pageConfig.borderWidth !== '0')}
                  onChange={(checked) => {
                    setPageConfig((prev: any) => ({
                      ...prev,
                      borderWidth: checked ? '1px' : '0px',
                      borderColor: prev.borderColor || '#000000',
                      borderStyle: prev.borderStyle || 'solid',
                    }));
                  }}
                />
              </div>

              {Boolean(pageConfig.borderWidth && pageConfig.borderWidth !== '0px' && pageConfig.borderWidth !== '0') && (
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Border Width</label>
                      <select
                        value={pageConfig.borderWidth || '1px'}
                        onChange={(e) => setPageConfig((prev: any) => ({ ...prev, borderWidth: e.target.value }))}
                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', padding: '0 8px' }}
                      >
                        <option value="1px">1px Thin</option>
                        <option value="2px">2px Medium</option>
                        <option value="3px">3px Bold</option>
                        <option value="4px">4px Heavy</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Border Style</label>
                      <select
                        value={pageConfig.borderStyle || 'solid'}
                        onChange={(e) => setPageConfig((prev: any) => ({ ...prev, borderStyle: e.target.value }))}
                        style={{ width: '100%', height: '32px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', padding: '0 8px' }}
                      >
                        <option value="solid">Solid Line</option>
                        <option value="double">Double Line</option>
                        <option value="dashed">Dashed Line</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Border Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="color"
                        value={pageConfig.borderColor || '#000000'}
                        onChange={(e) => setPageConfig((prev: any) => ({ ...prev, borderColor: e.target.value }))}
                        style={{ width: '36px', height: '32px', padding: '1px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                      />
                      <input
                        type="text"
                        value={pageConfig.borderColor || '#000000'}
                        onChange={(e) => setPageConfig((prev: any) => ({ ...prev, borderColor: e.target.value }))}
                        style={{ width: '90px', height: '32px', padding: '0 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Header (Letterhead) */}
        {drawerTab === 'header' && (
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                Repeating Header Letterhead
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Appears automatically at the top of every generated PDF page.
              </div>
            </div>

            {/* Quick Layout Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Quick Layout Presets
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => applyHeaderPreset('left-details')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Details Left</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Logo on right side</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyHeaderPreset('left-logo')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Logo Left</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Details on right side</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyHeaderPreset('center')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Centered Banner</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Logo top, centered text</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyHeaderPreset('clear')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #fee2e2',
                    background: '#fff5f5',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#dc2626',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Clear Header</div>
                  <div style={{ fontSize: '10px', color: '#ef4444' }}>No repeating header</div>
                </button>
              </div>
            </div>

            {/* WYSIWYG Header Editor */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>Header Content Editor</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Supports text & images</span>
              </div>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <LetterTiptapEditor
                  content={pageConfig.headerHtml || ''}
                  onChange={(html) => setPageConfig((prev: any) => ({ ...prev, headerHtml: html }))}
                  minHeight={160}
                />
              </div>
            </div>

            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#166534', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Tip: When adding a tall header or logo, remember to increase your <strong>Top Margin</strong> in the Margins tab so page body text does not overlap.
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Footer (Pagination) */}
        {drawerTab === 'footer' && (
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '2px' }}>
                Repeating Footer & Pagination
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Appears automatically at the bottom of every generated PDF page.
              </div>
            </div>

            {/* Quick Footer Presets */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Quick Footer Presets
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => applyFooterPreset('confidential')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Confidential</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Centered + Page #</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyFooterPreset('address-center')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Company Address</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Address & Page #</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyFooterPreset('right-num')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e2e8f0')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                >
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Page # Only</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>Right aligned</div>
                </button>
                <button
                  type="button"
                  onClick={() => applyFooterPreset('clear')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    border: '1px solid #fee2e2',
                    background: '#fff5f5',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#dc2626',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>Clear Footer</div>
                  <div style={{ fontSize: '10px', color: '#ef4444' }}>No repeating footer</div>
                </button>
              </div>
            </div>

            {/* WYSIWYG Footer Editor */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>Footer Content Editor</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Supports text & page tokens</span>
              </div>
              <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <LetterTiptapEditor
                  content={pageConfig.footerHtml || ''}
                  onChange={(html) => setPageConfig((prev: any) => ({ ...prev, footerHtml: html }))}
                  minHeight={150}
                />
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', color: '#1e40af', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                Automatic Pagination: Include <code>[Page #]</code> anywhere in your footer text to automatically insert the current page number (e.g. "Page [Page #]").
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
