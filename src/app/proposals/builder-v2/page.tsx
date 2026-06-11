'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { nanoid } from 'nanoid';
import {
  DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  Button, Drawer, Space, Dropdown, message, Input, Switch, Segmented, Tooltip, Tabs, Empty,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, EyeOutlined, DownloadOutlined, FilePdfOutlined,
  CopyOutlined, EyeInvisibleOutlined,
} from '@ant-design/icons';
import { Wand2, SlidersHorizontal, Braces, Palette, Layers } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useProposalStore, BlockType, ProposalBlock } from '@/store/proposalStore';
import {
  useProposalLibraryStore, LibrarySection, blockTypeForSectionType,
} from '@/store/proposalLibraryStore';
import { EditorCanvas } from '@/components/proposals/EditorCanvas';
import { BlockProperties } from '@/components/proposals/BlockProperties';
import { SectionLibraryPanel } from '@/components/proposals/library/SectionLibraryPanel';
import { THEME_PRESETS, FONT_PRESETS, resolveTheme } from '@/components/proposals/themePresets';
import { ProposalService } from '@/services/proposalService';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useActivitySource } from '@/hooks/useActivitySource';
import '../library.css';

interface SectionMeta { name?: string; hidden?: boolean }

const DEFAULT_VARS = [
  { token: 'client_name', label: 'Client Name' },
  { token: 'client_company', label: 'Client Company' },
  { token: 'project_name', label: 'Project Name' },
  { token: 'sender_company', label: 'Your Company' },
  { token: 'sender_name', label: 'Your Name' },
  { token: 'date', label: 'Date' },
  { token: 'valid_until', label: 'Valid Until' },
];

function BuilderV2Content() {
  useActivitySource({ section: 'WORK', module: 'Proposals', page: 'ProposalBuilderV2' });
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = searchParams.get('id');
  const templateId = searchParams.get('template');
  const [messageApi, holder] = message.useMessage();

  const { blocks, selectedBlockId, addBlock, updateBlock, reorderBlocks, setBlocks, setSelectedBlockId, documentTheme, setDocumentTheme } = useProposalStore();
  const libraryTemplates = useProposalLibraryStore((s) => s.templates);
  const librarySections = useProposalLibraryStore((s) => s.sections);
  const fetchSections = useProposalLibraryStore((s) => s.fetchSections);
  const sectionsLoaded = useProposalLibraryStore((s) => s.sectionsLoaded);
  useEffect(() => { fetchSections(); }, [fetchSections]);

  const { canCreateProposal, canUpdateProposal } = usePermission();
  const { user, isLoading } = useAuth();

  const [activeDragType, setActiveDragType] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [propTab, setPropTab] = useState<'section' | 'variables' | 'theme'>('section');
  const [sectionMeta, setSectionMeta] = useState<Record<string, SectionMeta>>({});
  const [vars, setVars] = useState(DEFAULT_VARS);
  const [newVar, setNewVar] = useState('');
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>('Untitled Proposal');

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // ─── Route guard ────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && user) {
      if (proposalId && !canUpdateProposal) router.push('/proposals');
      else if (!proposalId && !canCreateProposal) router.push('/proposals');
    }
  }, [user, isLoading, canCreateProposal, canUpdateProposal, proposalId, router]);

  // ─── Initial load: template / existing proposal / blank ─────────────
  useEffect(() => {
    if (initialized.current) return;
    // Template-based init needs the section library loaded first.
    if (templateId && !sectionsLoaded) return;
    initialized.current = true;

    const buildBlocksFromSections = (sectionIds: string[]): { blocks: ProposalBlock[]; meta: Record<string, SectionMeta> } => {
      const meta: Record<string, SectionMeta> = {};
      const built: ProposalBlock[] = [];
      sectionIds.forEach((sid) => {
        const sec = librarySections.find((s) => s.id === sid);
        if (!sec) return;
        const id = nanoid();
        built.push({ id, type: blockTypeForSectionType(sec.type), data: { ...(sec.data || {}) } });
        meta[id] = { name: sec.name, hidden: false };
      });
      return { blocks: built, meta };
    };

    const init = async () => {
      // 1. From a template
      if (templateId) {
        const tpl = libraryTemplates.find((t) => t.id === templateId);
        if (tpl) {
          const { blocks: built, meta } = buildBlocksFromSections(tpl.sectionIds);
          setBlocks(built);
          setSectionMeta(meta);
          setDocumentTheme({ themeId: tpl.themeId, fontId: tpl.fontId });
          setTemplateName(tpl.name);
          if (built[0]) setSelectedBlockId(built[0].id);
          messageApi.success({ content: `Loaded "${tpl.name}" template`, key: 'load' });
          return;
        }
      }

      // 2. Existing proposal
      if (proposalId) {
        try {
          const res: any = await ProposalService.getProposalById(proposalId);
          const proposal = res?.data || res;
          let fetched = proposal?.blocks_data || [];
          if (typeof fetched === 'string') { try { fetched = JSON.parse(fetched); } catch { fetched = []; } }
          if (Array.isArray(fetched) && fetched.length) {
            setBlocks(fetched);
            if (fetched[0]?.id) setSelectedBlockId(fetched[0].id);
          }
          if (proposal?.lead_id) setPendingLeadId(proposal.lead_id);
          if (proposal?.title) setTemplateName(proposal.title);
          messageApi.success({ content: 'Proposal loaded', key: 'load' });
        } catch {
          messageApi.error({ content: 'Could not load proposal', key: 'load' });
        }
        return;
      }

      // 3. Blank — start with a cover
      setBlocks([]);
      addBlock('cover');
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsLoaded]);

  // keep iframe preview in sync
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'SYNC_BLOCKS', payload: blocks }, '*');
  }, [blocks]);
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'PREVIEW_READY') {
        iframeRef.current?.contentWindow?.postMessage({ type: 'SYNC_BLOCKS', payload: useProposalStore.getState().blocks }, '*');
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // ─── Add a library section as a block (seeding its data + name) ─────
  const addFromLibrary = (section: LibrarySection) => {
    const bt = blockTypeForSectionType(section.type);
    const before = useProposalStore.getState().blocks;
    addBlock(bt);
    const after = useProposalStore.getState().blocks;
    const newId = useProposalStore.getState().selectedBlockId;
    if (after.length > before.length && newId) {
      if (section.data && Object.keys(section.data).length) updateBlock(newId, { ...section.data });
      setSectionMeta((m) => ({ ...m, [newId]: { name: section.name, hidden: false } }));
    } else if (newId) {
      // unique type already present — surface it
      messageApi.info(`${section.name} section is already on the canvas`);
    }
  };

  const handleDragStart = (e: any) => {
    if (e.active.data.current?.fromLibrary) {
      const sid = e.active.data.current.sectionId;
      const sec = librarySections.find((s) => s.id === sid);
      setActiveDragType(sec?.name || 'Section');
    }
  };

  const handleDragEnd = (e: any) => {
    const { active, over } = e;
    setActiveDragType(null);
    if (!over) return;
    if (active.data.current?.fromLibrary && over.id === 'canvas-droppable') {
      const sec = librarySections.find((s) => s.id === active.data.current.sectionId);
      if (sec) addFromLibrary(sec);
    } else if (active.id !== over.id) {
      reorderBlocks(active.id, over.id);
    }
  };

  // ─── Save ───────────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      messageApi.loading({ content: 'Saving…', key: 'save' });
      const cover = blocks.find((b) => b.type === 'cover')?.data || {};
      const payload = {
        title: cover.title || templateName || 'Untitled Proposal',
        client_name: cover.clientName || 'Unnamed Client',
        blocks,
        status: 'draft',
        lead_id: pendingLeadId,
      };
      const res: any = proposalId
        ? await ProposalService.updateProposal(proposalId, payload)
        : await ProposalService.createProposal(payload);
      if (res) {
        messageApi.success({ content: `Proposal ${proposalId ? 'updated' : 'created'}`, key: 'save' });
        setTimeout(() => router.push('/proposals'), 1000);
      }
    } catch (err: any) {
      messageApi.error({ content: err?.message || 'Save failed', key: 'save' });
    }
  };

  const exportPdf = () => {
    if (!previewOpen) {
      setPreviewOpen(true);
      setTimeout(() => iframeRef.current?.contentWindow?.print(), 600);
    } else {
      iframeRef.current?.contentWindow?.print();
    }
  };

  const exportMenu: MenuProps['items'] = [
    { key: 'pdf', label: 'Download as PDF', icon: <FilePdfOutlined style={{ color: '#ef4444' }} />, onClick: exportPdf },
  ];

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);
  const selMeta = selectedBlockId ? sectionMeta[selectedBlockId] : undefined;

  const setSelMeta = (patch: SectionMeta) => {
    if (!selectedBlockId) return;
    setSectionMeta((m) => ({ ...m, [selectedBlockId]: { ...m[selectedBlockId], ...patch } }));
  };

  const copyToken = (token: string) => {
    navigator.clipboard?.writeText(`{{${token}}}`);
    messageApi.success(`{{${token}}} copied`);
  };

  const addVar = () => {
    const t = newVar.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!t) return;
    if (vars.some((v) => v.token === t)) { messageApi.info('Variable already exists'); return; }
    setVars((v) => [...v, { token: t, label: newVar.trim() }]);
    setNewVar('');
  };

  const activeTheme = useMemo(() => resolveTheme(documentTheme.themeId), [documentTheme.themeId]);

  return (
    <div className="pbv2">
      {holder}
      <div className="pbv2__head">
        <div className="pbv2__head-left">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.push('/proposals')} />
          <div className="pbv2__brand"><Layers size={18} /></div>
          <div>
            <div className="pbv2__title">
              {templateName} <span className="pbv2__v2-pill">V2</span>
            </div>
            <div className="pbv2__sub">{blocks.length} section{blocks.length === 1 ? '' : 's'} · {activeTheme.label} theme</div>
          </div>
        </div>
        <div className="pbv2__head-actions">
          <Button icon={<Wand2 size={14} />} onClick={() => router.push('/proposals/templates')}>Templates</Button>
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Live Preview</Button>
          {canUpdateProposal && (
            <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
              <Button icon={<DownloadOutlined />}>Export</Button>
            </Dropdown>
          )}
          {((proposalId && canUpdateProposal) || (!proposalId && canCreateProposal)) && (
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              {proposalId ? 'Save Changes' : 'Save'}
            </Button>
          )}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="pbv2__main">
          {/* LEFT — Section library */}
          <SectionLibraryPanel onAdd={addFromLibrary} />

          {/* CENTER — Canvas */}
          <div ref={editorScrollRef} className="pbv2__canvas">
            <EditorCanvas />
          </div>

          {/* RIGHT — Properties */}
          <div className="pbv2__pane pbv2__pane--right">
            <Tabs
              activeKey={propTab}
              onChange={(k) => setPropTab(k as any)}
              centered
              items={[
                { key: 'section', label: <span><SlidersHorizontal size={13} style={{ verticalAlign: -2, marginRight: 5 }} />Section</span> },
                { key: 'variables', label: <span><Braces size={13} style={{ verticalAlign: -2, marginRight: 5 }} />Variables</span> },
                { key: 'theme', label: <span><Palette size={13} style={{ verticalAlign: -2, marginRight: 5 }} />Theme</span> },
              ]}
              style={{ padding: '0 10px' }}
            />

            {propTab === 'section' && (
              <div>
                {selectedBlock ? (
                  <>
                    <div className="pbv2__section">
                      <div className="pbv2__section-title"><SlidersHorizontal size={13} /> Section Settings</div>
                      <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b', marginBottom: 5 }}>Section name</div>
                      <Input
                        placeholder="Section name"
                        value={selMeta?.name ?? ''}
                        onChange={(e) => setSelMeta({ name: e.target.value })}
                        style={{ marginBottom: 12 }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 13, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
                          {selMeta?.hidden ? <EyeInvisibleOutlined /> : <EyeOutlined />} Visible in proposal
                        </span>
                        <Switch checked={!selMeta?.hidden} onChange={(v) => setSelMeta({ hidden: !v })} />
                      </div>
                    </div>
                    <BlockProperties />
                  </>
                ) : (
                  <div style={{ padding: 40 }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select a section to edit" />
                  </div>
                )}
              </div>
            )}

            {propTab === 'variables' && (
              <div className="pbv2__section" style={{ borderBottom: 'none' }}>
                <div className="pbv2__section-title"><Braces size={13} /> Dynamic Variables</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                  Insert tokens into any section. They’re replaced with client data when the proposal is sent.
                </div>
                <div className="pbv2__var-toolbar">
                  <Input
                    size="small"
                    placeholder="New variable name"
                    value={newVar}
                    onChange={(e) => setNewVar(e.target.value)}
                    onPressEnter={addVar}
                  />
                  <Button size="small" type="primary" onClick={addVar}>Add</Button>
                </div>
                {vars.map((v) => (
                  <div key={v.token} className="pbv2__var-row">
                    <span className="pbv2__var-token">{`{{${v.token}}}`}</span>
                    <span style={{ flex: 1, fontSize: 12.5, color: '#64748b' }}>{v.label}</span>
                    <Tooltip title="Copy token">
                      <Button size="small" type="text" icon={<CopyOutlined />} onClick={() => copyToken(v.token)} />
                    </Tooltip>
                  </div>
                ))}
              </div>
            )}

            {propTab === 'theme' && (
              <div className="pbv2__section" style={{ borderBottom: 'none' }}>
                <div className="pbv2__section-title"><Palette size={13} /> Document Theme</div>
                <div className="pbv2__theme-grid">
                  {THEME_PRESETS.map((p) => (
                    <div
                      key={p.id}
                      className={`pbv2__swatch ${documentTheme.themeId === p.id ? 'is-active' : ''}`}
                      style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                      onClick={() => setDocumentTheme({ themeId: p.id })}
                    >
                      <span>{p.label}</span>
                    </div>
                  ))}
                </div>
                <div className="pbv2__section-title" style={{ marginTop: 18 }}>Typeface</div>
                <Segmented
                  block
                  value={documentTheme.fontId}
                  onChange={(v) => setDocumentTheme({ fontId: v as string })}
                  options={FONT_PRESETS.map((f) => ({ label: f.label, value: f.id }))}
                />
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeDragType ? (
            <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,.12)', fontWeight: 600, color: '#0f172a' }}>
              {activeDragType}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Drawer
        title={
          <Space>
            <EyeOutlined />
            <span style={{ fontWeight: 600 }}>Live Preview</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{blocks.length} sections · client view</span>
          </Space>
        }
        placement="right"
        width={Math.min(960, typeof window !== 'undefined' ? window.innerWidth - 80 : 960)}
        onClose={() => setPreviewOpen(false)}
        open={previewOpen}
        extra={
          <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
            <Button icon={<DownloadOutlined />}>Export</Button>
          </Dropdown>
        }
      >
        <div style={{ height: '100%', borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
          <iframe ref={iframeRef} src={`/proposals/preview?theme=${theme}`} style={{ width: '100%', height: '100%', border: 'none' }} title="Proposal Preview" />
        </div>
      </Drawer>
    </div>
  );
}

export default function BuilderV2Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Suspense fallback={<div style={{ padding: 40 }}>Loading builder…</div>}>
          <BuilderV2Content />
        </Suspense>
      </MainLayout>
    </ProtectedRoute>
  );
}
