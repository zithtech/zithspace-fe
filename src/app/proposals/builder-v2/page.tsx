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
  FileWordOutlined, CopyOutlined, EyeInvisibleOutlined,
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
  const fetchTemplates = useProposalLibraryStore((s) => s.fetchTemplates);
  const sectionsLoaded = useProposalLibraryStore((s) => s.sectionsLoaded);
  useEffect(() => { fetchSections(); fetchTemplates(); }, [fetchSections, fetchTemplates]);

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
  const handleSave = async (skipRedirect?: boolean) => {
    const focusBlock = (id: string) => {
      setSelectedBlockId(id);
      setPropTab('section');
      setTimeout(() => {
        document.getElementById(`editor-block-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    };

    // 1. Cover validation
    const cover = blocks.find((b: any) => b.type === 'cover');
    if (cover) {
      if (!cover.data?.title?.trim()) {
        messageApi.warning({ content: 'Please enter a Proposal Title in the Cover settings.', duration: 3.5 });
        focusBlock(cover.id);
        return;
      }
      if (!cover.data?.clientName?.trim()) {
        messageApi.warning({ content: 'Please enter a Client Contact Person in the Cover settings.', duration: 3.5 });
        focusBlock(cover.id);
        return;
      }
    }

    // 2. Validate all added blocks/components
    for (const block of blocks) {
      if (block.type === 'text' || block.type === 'section') {
        if (!block.data?.heading?.trim()) {
          messageApi.warning({ content: `Please enter a Heading for the ${block.type === 'text' ? 'Text' : 'Section'} block.`, duration: 3.5 });
          focusBlock(block.id);
          return;
        }
      }

      if (block.type === 'pricing') {
        if (!block.data?.title?.trim()) {
          messageApi.warning({ content: 'Please enter a Title for the Pricing block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.items || block.data.items.length === 0) {
          messageApi.warning({ content: 'Please add at least one line item to the Pricing block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        for (let i = 0; i < block.data.items.length; i++) {
          const item = block.data.items[i];
          if (!item.name?.trim()) {
            messageApi.warning({ content: `Please enter a Name for Service Item #${i + 1} in the Pricing block.`, duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          if (item.price === undefined || item.price === null || item.price < 0) {
            messageApi.warning({ content: `Please enter a valid Price for Service Item "${item.name || i + 1}" in the Pricing block.`, duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }
      }

      if (block.type === 'scope') {
        if (!block.data?.title?.trim()) {
          messageApi.warning({ content: 'Please enter a Title for the Scope of Work block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.milestones || block.data.milestones.length === 0) {
          messageApi.warning({ content: 'Please add at least one Milestone Phase to the Scope block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        for (let i = 0; i < block.data.milestones.length; i++) {
          const m = block.data.milestones[i];
          if (!m.title?.trim()) {
            messageApi.warning({ content: `Please enter a Phase Name for Milestone Phase #${i + 1} in the Scope block.`, duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          if (!m.deliverables?.trim()) {
            messageApi.warning({ content: `Please enter the Deliverables for Milestone Phase "${m.title || i + 1}" in the Scope block.`, duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }
      }

      if (block.type === 'timeline') {
        if (!block.data?.title?.trim()) {
          messageApi.warning({ content: 'Please enter a Title for the Timeline block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.startDate) {
          messageApi.warning({ content: 'Please set a Kickoff Date in the Timeline block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.finalDate) {
          messageApi.warning({ content: 'Please set a Final Delivery Date in the Timeline block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.phases || block.data.phases.length === 0) {
          messageApi.warning({ content: 'Please add at least one Project Phase to the Timeline block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        for (let i = 0; i < block.data.phases.length; i++) {
          const p = block.data.phases[i];
          if (!p.title?.trim()) {
            messageApi.warning({ content: `Please enter a Phase Name for Project Phase #${i + 1} in the Timeline block.`, duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          if (!p.deadline) {
            messageApi.warning({ content: `Please set a Deadline for Project Phase "${p.title || i + 1}" in the Timeline block.`, duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }
      }

      if (block.type === 'signature') {
        if (!block.data?.title?.trim()) {
          messageApi.warning({ content: 'Please enter a Title for the Signature block.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.companyName?.trim()) {
          messageApi.warning({ content: 'Please enter Your Company Name in the Signature block settings.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.companySigner?.trim()) {
          messageApi.warning({ content: 'Please enter Your Authorized Signer name/title in the Signature settings.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.clientName?.trim()) {
          messageApi.warning({ content: 'Please enter the Client Company Name in the Signature block settings.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
        if (!block.data?.clientSigner?.trim()) {
          messageApi.warning({ content: 'Please enter the Client Authorized Signer name/title in the Signature settings.', duration: 3.5 });
          focusBlock(block.id);
          return;
        }
      }

      if (block.type === 'component') {
        const kind = block.data?.kind;
        const props = block.data?.props || {};

        if (kind === 'heading') {
          if (!props.text?.trim()) {
            messageApi.warning({ content: 'Please enter a Heading text for the Heading component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'phase') {
          if (!props.title?.trim()) {
            messageApi.warning({ content: 'Please enter a Phase Title for the Phase component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'paragraph') {
          const cleanText = props.text?.replace(/<[^>]*>/g, '').trim();
          if (!cleanText) {
            messageApi.warning({ content: 'Please enter paragraph content.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'deliverable') {
          if (!props.text?.trim()) {
            messageApi.warning({ content: 'Please enter a description for the Deliverable component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'callout') {
          if (!props.text?.trim()) {
            messageApi.warning({ content: 'Please enter body text for the Callout component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'quote') {
          if (!props.text?.trim()) {
            messageApi.warning({ content: 'Please enter quote text for the Testimonial component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'bullets') {
          if (!props.items || props.items.length === 0 || props.items.some((item: string) => !item.trim())) {
            messageApi.warning({ content: 'Please fill in all Bullet List items.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'tasklist') {
          if (!props.items || props.items.length === 0 || props.items.some((item: string) => !item.trim())) {
            messageApi.warning({ content: 'Please fill in all Task List items.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'twoColumn') {
          const leftText = props.left?.replace(/<[^>]*>/g, '').trim();
          const rightText = props.right?.replace(/<[^>]*>/g, '').trim();
          if (!props.leftTitle?.trim()) {
            messageApi.warning({ content: 'Please enter a title for the Left Column in the Two Columns component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          if (!leftText) {
            messageApi.warning({ content: 'Please enter content for the Left Column in the Two Columns component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          if (!props.rightTitle?.trim()) {
            messageApi.warning({ content: 'Please enter a title for the Right Column in the Two Columns component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          if (!rightText) {
            messageApi.warning({ content: 'Please enter content for the Right Column in the Two Columns component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'table') {
          const columns = props.columns || [];
          const rows = props.rows || [];
          if (columns.length === 0) {
            messageApi.warning({ content: 'Please add at least one column to the Table component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          if (rows.length === 0) {
            messageApi.warning({ content: 'Please add at least one row to the Table component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          for (let i = 0; i < columns.length; i++) {
            if (!columns[i].label?.trim()) {
              messageApi.warning({ content: `Please enter a label for Column #${i + 1} in the Table component.`, duration: 3.5 });
              focusBlock(block.id);
              return;
            }
          }
          for (let r = 0; r < rows.length; r++) {
            const row = rows[r];
            for (let c = 0; c < columns.length; c++) {
              const col = columns[c];
              const cellValue = row.cells?.[col.id]?.replace(/<[^>]*>/g, '').trim();
              if (!cellValue) {
                messageApi.warning({ content: `Please fill in Row #${r + 1}, Column "${col.label || c + 1}" in the Table component.`, duration: 3.5 });
                focusBlock(block.id);
                return;
              }
            }
          }
        }

        if (kind === 'keyvalue') {
          if (!props.label?.trim()) {
            messageApi.warning({ content: 'Please enter a Label for the Highlights component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          const rows = props.rows || [];
          if (rows.length === 0) {
            messageApi.warning({ content: 'Please add at least one highlight row in the Highlights component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          for (let i = 0; i < rows.length; i++) {
            if (!rows[i].k?.trim() || !rows[i].v?.trim()) {
              messageApi.warning({ content: `Please enter both label and value for Row #${i + 1} in the Highlights component.`, duration: 3.5 });
              focusBlock(block.id);
              return;
            }
          }
        }

        if (kind === 'image') {
          if (!props.src?.trim()) {
            messageApi.warning({ content: 'Please upload or paste an image URL in the Image component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }

        if (kind === 'gallery') {
          const images = props.images || [];
          if (images.length === 0) {
            messageApi.warning({ content: 'Please add at least one image to the Gallery component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
          for (let i = 0; i < images.length; i++) {
            if (!images[i].src?.trim()) {
              messageApi.warning({ content: `Please upload or paste an image URL for Image #${i + 1} in the Gallery component.`, duration: 3.5 });
              focusBlock(block.id);
              return;
            }
          }
        }

        if (kind === 'cta') {
          if (!props.text?.trim()) {
            messageApi.warning({ content: 'Please enter button text for the CTA component.', duration: 3.5 });
            focusBlock(block.id);
            return;
          }
        }
      }
    }

    try {
      messageApi.loading({ content: 'Saving…', key: 'save' });
      const coverBlock = cover?.data || {};
      const payload = {
        title: coverBlock.title.trim(),
        client_name: coverBlock.clientName.trim(),
        blocks,
        status: 'draft',
        lead_id: pendingLeadId,
      };
      let response: any;
      let activeId = proposalId;
      if (activeId) {
        response = await ProposalService.updateProposal(activeId, payload);
      } else {
        response = await ProposalService.createProposal(payload);
        const createdObj = response?.data?.data || response?.data || response;
        if (createdObj?.id) {
          activeId = createdObj.id;
          router.replace(`/proposals/builder-v2?id=${activeId}`);
        }
      }
      if (response) {
        messageApi.success({ content: `Proposal ${proposalId ? 'updated' : 'created'}`, key: 'save' });
        if (skipRedirect) {
          return activeId;
        }
        setTimeout(() => router.push('/proposals'), 1000);
        return activeId;
      }
    } catch (err: any) {
      messageApi.error({ content: err?.message || 'Save failed', key: 'save' });
    }
    return null;
  };

  const handleExport = async (format: 'pdf' | 'word') => {
    const key = 'exporting';
    try {
      const activeId = await handleSave(true);
      if (!activeId) return;

      messageApi.open({ key, type: 'loading', content: `Downloading ${format.toUpperCase()}...`, duration: 0 });
      const response = await ProposalService.requestProposalExport(activeId);
      const resData = response?.data?.data || response?.data || response;
      const { pdfUrl, docxUrl } = resData || {};
      const fileUrl = format === 'pdf' ? pdfUrl : docxUrl;
      if (!fileUrl) throw new Error("Server didn't return a file URL");

      if (format === 'pdf') {
        window.open(fileUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.setAttribute('download', `Proposal-${activeId}.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      messageApi.open({ key, type: 'success', content: 'Export complete!', duration: 3 });
    } catch (err: any) {
      console.error('Export Failed:', err);
      messageApi.open({ key, type: 'error', content: `Export Failed: ${err.message}`, duration: 4 });
    }
  };

  const exportMenu: MenuProps['items'] = [
    { key: 'pdf', label: 'Download as PDF', icon: <FilePdfOutlined style={{ color: '#ef4444' }} />, onClick: () => handleExport('pdf') },
    { key: 'word', label: 'Download as Word', icon: <FileWordOutlined style={{ color: '#2563eb' }} />, onClick: () => handleExport('word') },
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
            <Button type="primary" icon={<SaveOutlined />} onClick={() => { handleSave(); }}>
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
                        onChange={(e) => setSelMeta({ name: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
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
                    onChange={(e) => setNewVar(e.target.value.replace(/[^a-zA-Z\s]/g, ''))}
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
