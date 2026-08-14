'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useProposalStore, BlockType } from '@/store/proposalStore';
import { BlockProperties } from '@/components/proposals/BlockProperties';
import { EditorCanvas } from '@/components/proposals/EditorCanvas';
import { LeftRail } from '@/components/proposals/LeftRail';
import { CommandPalette } from '@/components/proposals/CommandPalette';
import { Typography, Layout, Button, message, Drawer, Space, Dropdown, Segmented } from 'antd';
import type { MenuProps } from 'antd';
import { SaveOutlined, EyeOutlined, DownloadOutlined, FilePdfOutlined, FileWordOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SnippetsOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { ProposalService } from '@/services/proposalService';
import { ProposalTemplateService } from '@/services/proposalTemplateService';
import { useProposalLibraryStore } from '@/store/proposalLibraryStore';
import SaveAsTemplateModal from '@/components/proposals/SaveAsTemplateModal';
import { useTheme } from '@/context/ThemeContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, Wand2, Command as CommandIcon } from 'lucide-react';
import { EndToEndZaiModal } from '@/components/proposals/EndToEndZaiModal';
import { FloatingAIToolbar } from '@/components/proposals/FloatingAIToolbar';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useActivitySource } from '@/hooks/useActivitySource';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function BuilderContent() {
  useActivitySource({ section: "WORK", module: "Proposals", page: "ProposalBuilder" });
  const { theme } = useTheme();
  const defaultThemeFallback = 'elegant-classic';
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messageApi, messageHolder] = message.useMessage();
  const proposalId = searchParams.get('id');
  // ─── Template mode ──────────────────────────────────────────────────────────
  // ?templateId=<id> → edit an existing template · ?template=1 → author a new one.
  const templateId = searchParams.get('templateId');
  const isNewTemplate = searchParams.get('template') === '1';
  const isTemplateMode = !!templateId || isNewTemplate;
  const createTemplate = useProposalLibraryStore((s) => s.createTemplate);
  const updateTemplate = useProposalLibraryStore((s) => s.updateTemplate);

  const { blocks, addBlock, reorderBlocks, setBlocks, setSelectedBlockId } = useProposalStore();
  const selectedBlockId = useProposalStore((s) => s.selectedBlockId);
  const documentTheme = useProposalStore((s) => s.documentTheme);

  // "Save (as) Template" modal
  const [tplModalOpen, setTplModalOpen] = useState(false);
  const [tplName, setTplName] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplSaving, setTplSaving] = useState(false);

  // These blocks are edited via the right panel; only composed components edit inline.
  const STRUCTURED_TYPES = ['cover', 'pricing', 'scope', 'timeline', 'signature', 'text', 'section'];

  const [activeDragType, setActiveDragType] = useState<BlockType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isRailVisible, setIsRailVisible] = useState(true);
  // Panel is collapsed by default — free-text edits happen inline on the canvas.
  // It auto-opens only when a structured block (cover/pricing/…) is selected.
  const [isPropertiesVisible, setIsPropertiesVisible] = useState(false);
  const [railWidth, setRailWidth] = useState(248);
  const [propertiesWidth, setPropertiesWidth] = useState(() => {
    if (typeof window === 'undefined') return 480;
    return Math.max(320, Math.min(720, Math.round(window.innerWidth * 0.30)));
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resizingPane = useRef<'left' | 'right' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStep, setGenStep] = useState('');
  const [showGenOverlay, setShowGenOverlay] = useState(false);
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [endToEndOpen, setEndToEndOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const { canCreateProposal, canUpdateProposal } = usePermission();

  // ─── Route Guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && user) {
      if (proposalId && !canUpdateProposal) {
        router.push("/proposals");
      } else if (!proposalId && !canCreateProposal) {
        router.push("/proposals");
      }
    }
  }, [user, isLoading, canCreateProposal, canUpdateProposal, proposalId, router]);

  // Auto-open the properties panel only when a structured block is selected.
  useEffect(() => {
    if (!selectedBlockId) return;
    const b = blocks.find((x: any) => x.id === selectedBlockId);
    const opensPanel = b && (STRUCTURED_TYPES.includes(b.type) || (b.type === 'component' && ['twoColumn', 'paragraph'].includes(b.data?.kind)));
    if (opensPanel) setIsPropertiesVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBlockId]);

  const [zoom, setZoom] = useState(1);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [railPosition, setRailPosition] = useState<'top' | 'left'>('top');

  const isInitialized = useRef(false);

  // Auto-open ZAI modal if directed from the themes gallery
  useEffect(() => {
    if (searchParams.get('openZai') === 'true') {
      setEndToEndOpen(true);
    }
  }, [searchParams]);

  // 1. Fetch existing proposal if ID is present
  useEffect(() => {
    const fetchProposal = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      const TYPE_ORDER: Record<string, number> = {
        'cover': 1,
        'text': 2,
        'scope': 3,
        'timeline': 4,
        'pricing': 5,
        'signature': 6,
        'section': 7
      };

      // ─── TEMPLATE MODE ──────────────────────────────────────────────────
      // Editing an existing template: hydrate the canvas from its blocks.
      if (templateId) {
        try {
          const tpl: any = await ProposalTemplateService.getById(templateId);
          const tplBlocks = Array.isArray(tpl?.blocks) ? tpl.blocks : [];
          setTplName(tpl?.name || '');
          setTplDesc(tpl?.description || '');
          if (tpl?.themeId) {
            useProposalStore.getState().setDocumentTheme({ themeId: tpl.themeId, fontId: tpl.fontId || 'inter' });
          }
          if (tplBlocks.length) {
            setBlocks(tplBlocks);
          } else {
            setBlocks([]);
            addBlock('cover');
          }
          messageApi.success({ content: `Loaded template "${tpl?.name || ''}"`, key: 'load_data' });
        } catch (e) {
          console.error('Failed to load template:', e);
          messageApi.error({ content: 'Template could not be loaded.', key: 'load_data' });
          setBlocks([]);
          addBlock('cover');
        }
        return;
      }
      // Authoring a brand-new template: start from a Cover, same as a new proposal.
      if (isNewTemplate) {
        setBlocks([]);
        addBlock('cover');
        setIsPropertiesVisible(true);
        return;
      }

      if (!proposalId) {
        // 0. CHECK IF WE HAVE A PENDING TEMPLATE (from the Template Library)
        const pendingTpl = sessionStorage.getItem('pending_template_blocks');
        if (pendingTpl) {
          try {
            const parsed = JSON.parse(pendingTpl);
            sessionStorage.removeItem('pending_template_blocks');
            if (Array.isArray(parsed?.blocks) && parsed.blocks.length) {
              setBlocks(parsed.blocks);
              if (parsed.themeId) {
                useProposalStore.getState().setDocumentTheme({ themeId: parsed.themeId, fontId: parsed.fontId || 'inter' });
              }
              messageApi.success({ content: `Loaded "${parsed.name || 'template'}"`, key: 'load_data' });
              return;
            }
          } catch (e) {
            console.error('Failed to parse pending template:', e);
          }
        }

        // 1. CHECK IF WE HAVE PENDING AI DATA (from Lead Dashboard)
        const pendingData = sessionStorage.getItem('pending_proposal_data');
        if (pendingData) {
          try {
            const parsed = JSON.parse(pendingData);
            if (parsed.blocks) {
              // START AI GENERATION SIMULATION
              setShowGenOverlay(true);
              setIsGenerating(true);

              const steps = [
                { label: 'Analyzing Lead Intelligence...', duration: 800 },
                { label: 'Synthesizing Cover Design...', duration: 1000 },
                { label: 'Structuring Scope of Work...', duration: 1200 },
                { label: 'Drafting Executive Summary...', duration: 900 },
                { label: 'Finalizing Financial Proposal...', duration: 1100 },
                { label: 'Reviewing Proposal Accuracy...', duration: 600 }
              ];

              let currentProgress = 0;
              for (let i = 0; i < steps.length; i++) {
                setGenStep(steps[i].label);
                const stepIncrement = 100 / steps.length;

                // Animate progress within step
                const subSteps = 10;
                for (let j = 0; j < subSteps; j++) {
                  await new Promise(r => setTimeout(r, steps[i].duration / subSteps));
                  currentProgress += stepIncrement / subSteps;
                  setGenProgress(Math.min(Math.round(currentProgress), 99));
                }
              }

              setBlocks(parsed.blocks);
              if (parsed.lead_id) {
                setPendingLeadId(parsed.lead_id);
              }
              setGenProgress(100);
              setGenStep('Proposal Ready!');

              setTimeout(() => {
                setIsGenerating(false);
                setTimeout(() => setShowGenOverlay(false), 500); // Wait for fade out
                sessionStorage.removeItem('pending_proposal_data');
                messageApi.success({ content: 'AI Proposal Draft Prepared!', key: 'load_data' });
              }, 800);
              return;
            }
          } catch (e) {
            console.error('Failed to parse pending AI data:', e);
          }
        }

        // 2. NEW PROPOSAL — start with just the Cover so the user lands on
        //    Branding & Identity first. More sections are added from the rail.
        setBlocks([]);
        addBlock('cover');
        setIsPropertiesVisible(true);
        return;
      }

      try {
        const response: any = await ProposalService.getProposalById(proposalId);
        const proposal = response?.data || response;
        if (proposal) {
          let fetchedBlocks = proposal.blocks_data || [];
          if (typeof fetchedBlocks === 'string') {
            try {
              fetchedBlocks = JSON.parse(fetchedBlocks);
            } catch (e) {
              console.error('Failed to parse blocks_data string:', e);
              fetchedBlocks = [];
            }
          }

          if (Array.isArray(fetchedBlocks)) {
            // Proposals that use composed components keep their exact saved order.
            // Legacy proposals are normalised by TYPE_ORDER (Cover first, etc.).
            const hasComponents = fetchedBlocks.some((b: any) => b?.type === 'component');
            const orderedBlocks = hasComponents
              ? fetchedBlocks
              : [...fetchedBlocks].sort((a, b) => (TYPE_ORDER[a.type] || 99) - (TYPE_ORDER[b.type] || 99));

            setBlocks(orderedBlocks);
            if (proposal.lead_id) {
              setPendingLeadId(proposal.lead_id);
            }
            messageApi.success({ content: 'Proposal data loaded.', key: 'load_data' });
          } else {
            setBlocks([]);
          }
        }
      } catch (err) {
        console.error('Failed to load proposal:', err);
        messageApi.error({ content: 'Existing data could not be recovered.', key: 'load_data' });
        setBlocks([]);
      }
    };

    fetchProposal();
  }, [proposalId, templateId, isNewTemplate, setBlocks, addBlock, messageApi]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    setPropertiesWidth(Math.max(320, Math.min(720, Math.round(window.innerWidth * 0.30))));
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!resizingPane.current) return;

      if (resizingPane.current === 'right') {
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth >= 280 && newWidth <= 720) {
          requestAnimationFrame(() => setPropertiesWidth(newWidth));
        }
      } else if (resizingPane.current === 'left') {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 420) {
          requestAnimationFrame(() => setRailWidth(newWidth));
        }
      }
    };

    const stopResize = () => {
      resizingPane.current = null;
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', stopResize);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleResize);
        window.removeEventListener('mouseup', stopResize);
      }
    };
  }, []);

  const startResizeRight = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingPane.current = 'right';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startResizeLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingPane.current = 'left';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const editorScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SYNC_BLOCKS',
        payload: blocks
      }, '*');
    }
  }, [blocks]);

  const prevBlocksLength = useRef(blocks.length);
  const initialLoadCompletedAt = useRef<number | null>(null);
  // Mark initial load complete shortly after mount so the bulk-add of default blocks
  // doesn't trigger the auto-scroll-to-bottom behavior.
  useEffect(() => {
    const t = setTimeout(() => {
      initialLoadCompletedAt.current = Date.now();
      editorScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      // No auto-selection on load — the properties panel stays collapsed until the
      // user picks a structured block. Free-text editing happens inline.
    }, 600);
    return () => clearTimeout(t);
  }, [setSelectedBlockId]);

  useEffect(() => {
    const initialDone = initialLoadCompletedAt.current !== null;
    const isUserAdd = initialDone && blocks.length > prevBlocksLength.current && blocks.length > 0;
    if (isUserAdd) {
      editorScrollRef.current?.scrollTo({
        top: editorScrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    prevBlocksLength.current = blocks.length;
  }, [blocks]);

  useEffect(() => {
    const handleInitialSync = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_READY') {
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'SYNC_BLOCKS',
            payload: useProposalStore.getState().blocks
          }, '*');
        }
      }
    };
    window.addEventListener('message', handleInitialSync);
    return () => window.removeEventListener('message', handleInitialSync);
  }, []);

  // ⌘K / Ctrl+K toggles the command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const jumpToBlock = React.useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
    const el = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement | null;
    if (el && editorScrollRef.current) {
      const containerRect = editorScrollRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + editorScrollRef.current.scrollTop - 48;
      editorScrollRef.current.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [setSelectedBlockId]);

  // Sync the live-preview iframe with whichever block is closest to the canvas
  // viewport's top — but only when the preview drawer is open. The right-side
  // Properties panel is intentionally NOT auto-selected on scroll: selection
  // follows the user's click/focus, not their reading position.
  const lastSyncedBlock = useRef<string | null>(null);
  useEffect(() => {
    if (!previewOpen) return;
    const scrollContainer = editorScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      if (initialLoadCompletedAt.current === null) return;
      const canvas = document.getElementById('proposal-builder-canvas');
      if (!canvas) return;

      const blocksInView = Array.from(canvas.querySelectorAll('[data-block-id]'));
      if (blocksInView.length === 0) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const triggerPoint = containerRect.top + 150;

      let closestBlockId: string | null = null;
      let minDelta = Infinity;
      blocksInView.forEach((el: any) => {
        const rect = el.getBoundingClientRect();
        const delta = Math.abs(rect.top - triggerPoint);
        if (delta < minDelta) {
          minDelta = delta;
          closestBlockId = el.getAttribute('data-block-id');
        }
      });

      if (closestBlockId && closestBlockId !== lastSyncedBlock.current) {
        lastSyncedBlock.current = closestBlockId;
        iframeRef.current?.contentWindow?.postMessage({
          type: 'SCROLL_TO_BLOCK',
          payload: closestBlockId,
        }, '*');
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [previewOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    if (active.data.current?.fromPalette) {
      setActiveDragType(active.data.current.type);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveDragType(null);

    if (!over) return;

    if (active.data.current?.fromPalette && over.id === 'canvas-droppable') {
      addBlock(active.data.current.type);
    } else if (active.id !== over.id) {
      reorderBlocks(active.id, over.id);
    }
  };

  const handleSave = async (skipRedirect?: boolean) => {
    const focusBlock = (id: string) => {
      setSelectedBlockId(id);
      setIsPropertiesVisible(true);
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
      messageApi.loading({ content: 'Saving proposal...', key: 'save_proposal' });

      const coverBlock = cover?.data || {};
      const payload = {
        title: coverBlock.title?.trim() || 'Untitled Proposal',
        client_name: coverBlock.clientName?.trim() || 'Unknown Client',
        blocks: blocks,
        status: 'draft',
        lead_id: pendingLeadId // Link to the lead if we have it
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
          router.replace(`/proposals/builder?id=${activeId}`);
        }
      }

      if (response) {
        setSavedAt(new Date());
        messageApi.success({ content: `Proposal ${proposalId ? 'updated' : 'created'} successfully!`, key: 'save_proposal' });
        if (skipRedirect) {
          return activeId;
        }
        // Redirect to main list after success
        setTimeout(() => {
          router.push('/proposals');
        }, 1200);
        return activeId;
      }
    } catch (err: any) {
      console.error('Save error:', err);
      messageApi.error({ content: err.message || 'Error occurred while saving', key: 'save_proposal' });
    }
  };

  // ─── Save (as) Template ───────────────────────────────────────────────────
  // Opens the name/description modal. In proposal mode this turns the current
  // proposal into a reusable template; in template mode it saves the template.
  const openTemplateModal = () => {
    if (!templateId && !tplName.trim()) {
      const cover = useProposalStore.getState().blocks.find((b: any) => b.type === 'cover');
      if (cover?.data?.title?.trim()) setTplName(`${cover.data.title.trim()} Template`);
    }
    setTplModalOpen(true);
  };

  const persistTemplate = async () => {
    if (!tplName.trim()) {
      messageApi.warning('Give the template a name');
      return;
    }
    const liveBlocks = useProposalStore.getState().blocks;
    if (!liveBlocks.length) {
      messageApi.warning('Add at least one section or component before saving as a template.');
      return;
    }
    const { themeId, fontId } = useProposalStore.getState().documentTheme;
    setTplSaving(true);
    try {
      if (templateId) {
        await updateTemplate(templateId, { name: tplName.trim(), description: tplDesc, blocks: liveBlocks, themeId, fontId });
        messageApi.success({ content: 'Template updated', key: 'save_template' });
      } else {
        await createTemplate({ name: tplName.trim(), description: tplDesc, blocks: liveBlocks, themeId, fontId });
        messageApi.success({ content: 'Saved as template', key: 'save_template' });
      }
      setTplModalOpen(false);
      setTimeout(() => router.push('/proposals/templates'), 800);
    } catch (err: any) {
      console.error('Save template error:', err);
      messageApi.error({ content: err?.message || 'Failed to save template', key: 'save_template' });
    } finally {
      setTplSaving(false);
    }
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

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', paddingTop: 1 }}>
      {messageHolder}
      <Header className="pb-header" style={{ lineHeight: 'normal' }}>
        <div className="pb-header__left">
          <Button
            type="text"
            className="pb-back-btn"
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/proposals')}
          >

          </Button>
          <span className="pb-header__sep" />

          <div className="pb-header__title-container">
            <div className="pb-header__brand">
              <SnippetsOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="pb-header__title-wrap">
              <Title level={4} className="pb-header__title premium-title">{isTemplateMode ? 'Template Builder' : 'Proposal Builder'}</Title>
              <Text className="pb-header__sub premium-text-sec">{isTemplateMode ? 'Compose a reusable template' : 'Draft and design your perfect proposal'}</Text>
            </div>
            {!isTemplateMode && (
              <Button
                size="small"
                onClick={() => handleSave()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, borderRadius: 6 }}
              >
                <span className="pb-status-pill__dot" />
                Auto-saved
              </Button>
            )}
          </div>
        </div>
        <div className="pb-header__actions">
          {/* <Segmented
            className="pb-seg"
            options={[{ label: 'Top', value: 'top' }, { label: 'Left', value: 'left' }]}
            value={railPosition}
            onChange={(val) => setRailPosition(val as 'top' | 'left')}
          /> */}
          {/* <button
            type="button"
            className="pb-cmd-trigger"
            onClick={() => setCommandOpen(true)}
            aria-label="Open command palette"
          >
            <CommandIcon size={12} />
            <span className="pb-cmd-trigger__text">Search & commands</span>
            <span className="pb-cmd-trigger__kbd">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </span>
          </button> */}
          {/* {!isTemplateMode && canUpdateProposal && (
            <Button
              className="pb-zai-cta"
              onClick={() => setEndToEndOpen(true)}
              icon={<Wand2 size={14} />}
            >
              Create with Zai
            </Button>
          )} */}
          <Button className="pb-action-btn" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
            Live Preview
          </Button>
          {!isTemplateMode && canUpdateProposal && (
            <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
              <Button className="pb-action-btn" icon={<DownloadOutlined />}>
                Export
              </Button>
            </Dropdown>
          )}
          {isTemplateMode ? (
            canCreateProposal && (
              <Button
                className="pb-action-btn pb-action-btn--primary"
                type="primary"
                icon={<SaveOutlined />}
                onClick={openTemplateModal}
              >
                {templateId ? 'Save Template' : 'Create Template'}
              </Button>
            )
          ) : (
            <>
              {canCreateProposal && (
                <Button
                  className="pb-action-btn"
                  icon={<SnippetsOutlined />}
                  onClick={openTemplateModal}
                >
                  Save as Template
                </Button>
              )}
              {((proposalId && canUpdateProposal) || (!proposalId && canCreateProposal)) && (
                <Button
                  className="pb-action-btn pb-action-btn--primary"
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={() => handleSave()}
                >
                  {proposalId ? 'Save Changes' : 'Save'}
                </Button>
              )}
            </>
          )}
          <Button
            type="text"
            className="pb-iconbtn"
            icon={isPropertiesVisible ? <MenuFoldOutlined style={{ transform: 'rotate(180deg)' }} /> : <MenuUnfoldOutlined style={{ transform: 'rotate(180deg)' }} />}
            onClick={() => setIsPropertiesVisible(!isPropertiesVisible)}
          />
        </div>
      </Header>

      <Content style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {isRailVisible && railPosition === 'top' && (
            <div className="builder-top-rail">
              <LeftRail onJumpToBlock={jumpToBlock} layout="horizontal" />
            </div>
          )}

          <div className="builder-main-container" style={{ display: 'flex', flex: 1, minHeight: 0, margin: 0, width: '100%', overflow: 'hidden' }}>
            {isRailVisible && railPosition === 'left' && (
              <>
                <div className="builder-side-pane" style={{ width: `${railWidth}px`, flexShrink: 0, height: '100%' }}>
                  <LeftRail onJumpToBlock={jumpToBlock} layout="vertical" />
                </div>
                <div onMouseDown={startResizeLeft} className="builder-resizer pb-resizer">
                  <div className="pb-resizer__handle" />
                </div>
              </>
            )}

            <div
              ref={editorScrollRef}
              className="builder-canvas-wrapper"
              style={{ flex: 1, height: '100%', overflowY: 'auto', minWidth: '300px', position: 'relative' }}
            >
              <div className="pb-canvas-stage" style={{ ['--pb-zoom' as any]: zoom }}>
                <EditorCanvas />
              </div>
            </div>

            {isPropertiesVisible && (
              <div onMouseDown={startResizeRight} className="builder-resizer pb-resizer">
                <div className="pb-resizer__handle" />
              </div>
            )}

            {isPropertiesVisible && (
              <div className="builder-side-pane properties-pane" style={{ width: `${propertiesWidth}px`, flexShrink: 0, height: '100%', overflowY: 'auto', borderLeft: '1px solid var(--border-color)' }}>
                <BlockProperties />
              </div>
            )}
          </div>

          <DragOverlay>
            {activeDragType ? (
              <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--box-shadow)', color: 'var(--text-primary)', opacity: 0.8, fontWeight: 600 }}>
                Dragging {activeDragType}...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Content>

      <EndToEndZaiModal
        visible={endToEndOpen}
        onClose={() => setEndToEndOpen(false)}
        defaultTheme={searchParams.get('theme') || defaultThemeFallback}
      />

      <SaveAsTemplateModal
        open={tplModalOpen}
        variant={templateId ? 'edit' : (isNewTemplate ? 'create' : 'save')}
        blockCount={blocks.length}
        themeId={documentTheme.themeId}
        fontId={documentTheme.fontId}
        name={tplName}
        onNameChange={setTplName}
        description={tplDesc}
        onDescriptionChange={setTplDesc}
        saving={tplSaving}
        onCancel={() => setTplModalOpen(false)}
        onSave={persistTemplate}
      />

      <FloatingAIToolbar />

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onSave={() => handleSave()}
        onTogglePreview={() => setPreviewOpen((v) => !v)}
        onExport={() => handleExport('pdf')}
        onOpenZai={() => setEndToEndOpen(true)}
        onJumpToBlock={jumpToBlock}
      />

      <Drawer
        className="pb-preview-drawer"
        rootClassName="pb-preview-drawer-root"
        title={
          <div className="pb-preview-title">
            <div className="pb-preview-title__icon">
              <EyeOutlined />
            </div>
            <div className="pb-preview-title__text">
              <span className="pb-preview-title__name">Live Preview</span>
              <span className="pb-preview-title__sub">{blocks.length} {blocks.length === 1 ? 'section' : 'sections'} · synced in real-time</span>
            </div>
            <span className="pb-preview-title__pill">
              <Sparkles size={11} />
              CLIENT VIEW
            </span>
          </div>
        }
        placement="right"
        width={Math.min(960, typeof window !== 'undefined' ? window.innerWidth - 80 : 960)}
        onClose={() => setPreviewOpen(false)}
        open={previewOpen}
        closeIcon={<span className="pb-preview-close" aria-label="Close">×</span>}
        extra={
          <Space size={8}>
            <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
              <Button icon={<DownloadOutlined />} className="pb-preview-extra-btn">Export</Button>
            </Dropdown>
          </Space>
        }
        styles={{
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(8, 12, 24, 0.45)' },
          wrapper: { boxShadow: '-30px 0 80px rgba(8, 12, 24, 0.25)' },
        }}
      >
        <div className="pb-preview-frame">
          <iframe
            ref={iframeRef}
            src={`/proposals/preview?theme=${theme}`}
            className="pb-preview-iframe"
            title="Proposal Preview Slider"
          />
        </div>
      </Drawer>

      {/* AI GENERATION — slim top bar + corner card; canvas stays visible */}
      {showGenOverlay && (
        <>
          <div
            className="pb-gen-shell"
            style={{
              opacity: isGenerating ? 1 : 0,
              transition: 'opacity 0.4s ease',
            }}
          />
          <div className="pb-gen-topbar">
            <div className="pb-gen-topbar__fill" style={{ width: `${genProgress}%` }} />
          </div>
          <div
            className="pb-gen-card"
            style={{
              opacity: isGenerating ? 1 : 0,
              transform: isGenerating ? 'translateY(0)' : 'translateY(12px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
            }}
          >
            <div className="pb-gen-card__orb">
              <Sparkles size={18} />
            </div>
            <div className="pb-gen-card__text">
              <span className="pb-gen-card__title">Crafting your proposal</span>
              <span className="pb-gen-card__step">{genStep}</span>
            </div>
            <span className="pb-gen-card__pct">{genProgress}%</span>
          </div>

          <style dangerouslySetInnerHTML={{
            __html: `
              .builder-main-container { background: var(--bg-pure-white); }
              .builder-side-pane { background: var(--bg-pure-white); }
              .builder-resizer { background: var(--bg-pure-white); }

              [data-theme='dark'] .builder-main-container { background: #0d1117 !important; }
              [data-theme='dark'] .builder-side-pane { background: #161b22 !important; }
              [data-theme='dark'] .builder-resizer { background: #161b22 !important; border-color: #30363d !important; }
              [data-theme='dark'] .ant-layout-header { background: #161b22 !important; border-bottom-color: #30363d !important; }
              [data-theme='dark'] .ant-segmented { background: #0d1117 !important; color: #8b949e !important; }
              [data-theme='dark'] .ant-segmented-item-selected { background: #30363d !important; color: #f0f6fc !important; }
              [data-theme='dark'] .ant-drawer-content { background: #161b22 !important; }
              [data-theme='dark'] .ant-drawer-header { background: #161b22 !important; border-bottom-color: #30363d !important; }
              [data-theme='dark'] .ant-drawer-title { color: #f0f6fc !important; }

              [data-theme='dark'] .ant-input-filled,
              [data-theme='dark'] .ant-input-number-affix-wrapper,
              [data-theme='dark'] .ant-picker,
              [data-theme='dark'] .ant-select-selector {
                background: #0d1117 !important;
                border-color: #30363d !important;
                color: #f0f6fc !important;
              }
              [data-theme='dark'] .ant-input-filled:focus,
              [data-theme='dark'] .ant-input-filled:hover {
                background: #0d1117 !important;
                border-color: var(--premium-blue) !important;
              }
              [data-theme='dark'] .ant-divider { border-color: #30363d !important; }

              [data-theme='dark'] .tiptap-editor-wrapper { border-color: #30363d !important; }
              [data-theme='dark'] .tiptap-toolbar { background: #161b22 !important; border-bottom-color: #30363d !important; }

              [data-theme='dark'] #proposal-builder-canvas {
                background: #161b22 !important;
                border: 3px solid #30363d !important;
                box-shadow: 0 8px 24px rgba(0,0,0,0.3) !important;
              }
            `}} />
        </>
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <MainLayout noPadding>
      <Suspense fallback={<div>Loading builder...</div>}>
        <BuilderContent />
      </Suspense>
    </MainLayout>
  );
}
