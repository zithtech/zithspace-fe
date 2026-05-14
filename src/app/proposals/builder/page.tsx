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
import { BlockPalette } from '@/components/proposals/BlockPalette';
import { BlockProperties } from '@/components/proposals/BlockProperties';
import { EditorCanvas } from '@/components/proposals/EditorCanvas';
import { Typography, Layout, Button, message, Drawer, Space, Dropdown, Segmented, Progress } from 'antd';
import type { MenuProps } from 'antd';
import { SaveOutlined, EyeOutlined, DownloadOutlined, FilePdfOutlined, FileWordOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SnippetsOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { ProposalService } from '@/services/proposalService';
import { useTheme } from '@/context/ThemeContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, Wand2 } from 'lucide-react';
import { EndToEndZaiModal } from '@/components/proposals/EndToEndZaiModal';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function BuilderContent() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [messageApi, messageHolder] = message.useMessage();
  const proposalId = searchParams.get('id');
  const { blocks, addBlock, reorderBlocks, setBlocks, selectedBlockId, setSelectedBlockId } = useProposalStore();

  const [activeDragType, setActiveDragType] = useState<BlockType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isPropertiesVisible, setIsPropertiesVisible] = useState(true);
  const [palettePosition, setPalettePosition] = useState<'top' | 'left' | 'right'>('top');
  const [paletteWidth, setPaletteWidth] = useState(240);
  const [propertiesWidth, setPropertiesWidth] = useState(() => {
    if (typeof window === 'undefined') return 520;
    // Default split: canvas 65% / properties 35%
    return Math.max(320, Math.min(800, Math.round(window.innerWidth * 0.35)));
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resizingPane = useRef<'left' | 'right' | 'palette-right' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStep, setGenStep] = useState('');
  const [showGenOverlay, setShowGenOverlay] = useState(false);
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [endToEndOpen, setEndToEndOpen] = useState(false);

  const isInitialized = useRef(false);

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

      if (!proposalId) {
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

        // 2. DEFAULT TEMPLATE FOR NEW PROPOSAL
        const defaultTemplateTypes: BlockType[] = ['cover', 'text', 'scope', 'timeline', 'pricing', 'signature', 'section'];
        setBlocks([]);
        defaultTemplateTypes.forEach((t) => addBlock(t));
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
            // Sort by TYPE_ORDER to ensure Cover is first, Executive Summary second, etc.
            const sortedBlocks = [...fetchedBlocks].sort((a, b) =>
              (TYPE_ORDER[a.type] || 99) - (TYPE_ORDER[b.type] || 99)
            );

            setBlocks(sortedBlocks);
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
  }, [proposalId, setBlocks, addBlock, messageApi]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    // Apply default 65/35 split on mount in case SSR fallback was used
    setPropertiesWidth(Math.max(320, Math.min(800, Math.round(window.innerWidth * 0.35))));
    return () => { document.head.removeChild(style); };
  }, []);

  useEffect(() => {
    const handleResize = (e: MouseEvent) => {
      if (!resizingPane.current) return;

      if (resizingPane.current === 'right') {
        const newWidth = document.body.clientWidth - e.clientX - (palettePosition === 'right' ? paletteWidth : 0);
        if (newWidth >= 280 && newWidth <= 800) {
          requestAnimationFrame(() => setPropertiesWidth(newWidth));
        }
      } else if (resizingPane.current === 'palette-right') {
        const newWidth = document.body.clientWidth - e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          requestAnimationFrame(() => setPaletteWidth(newWidth));
        }
      } else if (resizingPane.current === 'left') {
        const newWidth = e.clientX;
        if (newWidth >= 200 && newWidth <= 600) {
          requestAnimationFrame(() => setPaletteWidth(newWidth));
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
  }, [palettePosition, paletteWidth]);

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

  const startResizePaletteRight = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingPane.current = 'palette-right';
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
      // Default-select the first (Cover) block so the right panel highlights it
      const firstBlock = useProposalStore.getState().blocks[0];
      if (firstBlock && !useProposalStore.getState().selectedBlockId) {
        setSelectedBlockId(firstBlock.id);
      }
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

  const lastScrolledBlock = useRef<string | null>(null);

  useEffect(() => {
    const scrollContainer = editorScrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      // Skip during initial load so the bulk-mount of default blocks doesn't auto-select the bottom one
      if (initialLoadCompletedAt.current === null) return;
      const canvas = document.getElementById('proposal-builder-canvas');
      if (!canvas) return;

      const blocksInView = Array.from(canvas.querySelectorAll('[data-block-id]'));
      if (blocksInView.length === 0) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const triggerPoint = containerRect.top + 150; // Increased offset slightly for better proximity feel

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

      if (closestBlockId && closestBlockId !== lastScrolledBlock.current) {
        lastScrolledBlock.current = closestBlockId;

        // Sync with Preview Iframe ONLY if open
        if (previewOpen && iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'SCROLL_TO_BLOCK',
            payload: closestBlockId
          }, '*');
        }

        // AUTO-SELECT for the Properties Pane on the right - ALWAYS sync this
        if (closestBlockId !== selectedBlockId) {
          setSelectedBlockId(closestBlockId);
        }
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [blocks, previewOpen, selectedBlockId]);

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

  const handleSave = async () => {
    try {
      messageApi.loading({ content: 'Saving proposal...', key: 'save_proposal' });

      // Extract dynamic metadata from the blocks area
      const coverBlock = blocks.find((b: any) => b.type === 'cover')?.data || {};

      const payload = {
        title: coverBlock.title || 'Untitled Proposal',
        client_name: coverBlock.clientName || 'Unnamed Client',
        blocks: blocks,
        status: 'draft',
        lead_id: pendingLeadId // Link to the lead if we have it
      };

      let response: any;
      if (proposalId) {
        response = await ProposalService.updateProposal(proposalId, payload);
      } else {
        response = await ProposalService.createProposal(payload);
      }

      if (response) {
        messageApi.success({ content: `Proposal ${proposalId ? 'updated' : 'created'} successfully!`, key: 'save_proposal' });
        // Redirect to main list after success
        setTimeout(() => {
          router.push('/proposals');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Save error:', err);
      messageApi.error({ content: err.message || 'Error occurred while saving', key: 'save_proposal' });
    }
  };

  const handleExportPDF = () => {
    if (!previewOpen) {
      message.info('Opening preview bounds to generate PDF...');
      setPreviewOpen(true);
      setTimeout(() => {
        iframeRef.current?.contentWindow?.print();
      }, 500);
    } else {
      iframeRef.current?.contentWindow?.print();
    }
  };

  const executeWordExport = () => {
    try {
      const iframeDoc = iframeRef.current?.contentDocument;
      if (!iframeDoc) throw new Error('Cannot access preview document');

      const wrapper = iframeDoc.querySelector('div[style*="zoom"]') as HTMLElement;
      let originalZoom = '';
      if (wrapper) {
        originalZoom = wrapper.style.zoom;
        wrapper.style.zoom = '1';
        wrapper.style.width = '100%';
      }

      const htmlContent = iframeDoc.body.innerHTML;

      if (wrapper) {
        wrapper.style.zoom = originalZoom;
        wrapper.style.width = '100%';
      }

      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Proposal Document</title></head><body>";
      const footer = "</body></html>";
      const sourceHTML = header + htmlContent + footer;

      const blob = new Blob([sourceHTML], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Proposal.doc';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('Word document downloaded successfully');
    } catch (e) {
      console.error(e);
      message.error('Failed to export. Please ensure the preview panel is fully loaded.');
    }
  };

  const handleExportWord = () => {
    if (!previewOpen) {
      message.info('Opening preview to synthesize Word Document...');
      setPreviewOpen(true);
      setTimeout(() => executeWordExport(), 800);
    } else {
      executeWordExport();
    }
  };

  const exportMenu: MenuProps['items'] = [
    { key: 'pdf', label: 'Download as PDF', icon: <FilePdfOutlined style={{ color: '#ef4444' }} />, onClick: handleExportPDF },
    { key: 'word', label: 'Download as Word', icon: <FileWordOutlined style={{ color: '#2563eb' }} />, onClick: handleExportWord },
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
          
          <Space size={12} align="center">
            <div className="pb-header__brand">
              <SnippetsOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="pb-header__title-wrap">
              <Title level={4} className="pb-header__title premium-title">Proposal Builder</Title>
              <Text className="pb-header__sub premium-text-sec">Draft and design your perfect proposal</Text>
            </div>
            <span className="pb-status-pill">
              <span className="pb-status-pill__dot" />
              Auto-saved
            </span>
          </Space>
        </div>
        <Space size={10} className="pb-header__actions">
          {isPaletteVisible && (
            <Segmented
              className="pb-seg"
              options={[{ label: 'Top', value: 'top' }, { label: 'Left', value: 'left' }]}
              value={palettePosition}
              onChange={(val) => setPalettePosition(val as 'top' | 'left' | 'right')}
            />
          )}
          <Button
            className="pb-zai-cta"
            onClick={() => setEndToEndOpen(true)}
            icon={<Wand2 size={14} />}
          >
            Create with Zai
          </Button>
          <Button className="pb-action-btn" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
            Live Preview
          </Button>
          <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
            <Button className="pb-action-btn" icon={<DownloadOutlined />}>
              Export
            </Button>
          </Dropdown>
          <Button
            className="pb-action-btn pb-action-btn--primary"
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
          >
            {proposalId ? 'Save Changes' : 'Save'}
          </Button>
          <Button
            type="text"
            className="pb-iconbtn"
            icon={isPropertiesVisible ? <MenuFoldOutlined style={{ transform: 'rotate(180deg)' }} /> : <MenuUnfoldOutlined style={{ transform: 'rotate(180deg)' }} />}
            onClick={() => setIsPropertiesVisible(!isPropertiesVisible)}
          />
        </Space>
      </Header>

      <Content style={{ flex: 1, overflow: 'hidden' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {isPaletteVisible && palettePosition === 'top' && (
            <BlockPalette layout="horizontal" />
          )}

          <div className="builder-main-container" style={{ display: 'flex', height: '100%', margin: 0, width: '100%', overflow: 'hidden' }}>
            {isPaletteVisible && palettePosition === 'left' && (
              <>
                <div className="builder-side-pane" style={{ width: `${paletteWidth}px`, flexShrink: 0, height: '100%' }}>
                  <BlockPalette layout="vertical" />
                </div>
                <div
                  onMouseDown={startResizeLeft}
                  className="builder-resizer"
                  style={{
                    width: '6px',
                    cursor: 'col-resize',
                    borderLeft: '1px solid var(--border-color)',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div style={{ height: '40px', width: '2px', background: 'var(--text-slate-400)', borderRadius: '2px' }} />
                </div>
              </>
            )}

            <div
              ref={editorScrollRef}
              className="builder-canvas-wrapper"
              style={{ flex: 1, height: '100%', overflowY: 'auto', minWidth: '300px' }}
            >
              <EditorCanvas />
            </div>

            {isPropertiesVisible && (
              <div
                onMouseDown={startResizeRight}
                className="builder-resizer"
                style={{
                  width: '6px',
                  cursor: 'col-resize',
                  borderLeft: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <div style={{ height: '40px', width: '2px', background: 'var(--text-slate-400)', borderRadius: '2px' }} />
              </div>
            )}

            {isPropertiesVisible && (
              <div className="builder-side-pane properties-pane" style={{ width: `${propertiesWidth}px`, flexShrink: 0, height: '100%', overflowY: 'auto', borderLeft: '1px solid var(--border-color)' }}>
                <BlockProperties />
              </div>
            )}

            {isPaletteVisible && palettePosition === 'right' && (
              <>
                <div
                  onMouseDown={startResizePaletteRight}
                  className="builder-resizer"
                  style={{
                    width: '6px',
                    cursor: 'col-resize',
                    borderLeft: '1px solid var(--border-color)',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div style={{ height: '40px', width: '2px', background: 'var(--text-slate-400)', borderRadius: '2px' }} />
                </div>
                <div className="builder-side-pane" style={{ width: `${paletteWidth}px`, flexShrink: 0, height: '100%' }}>
                  <BlockPalette layout="vertical" />
                </div>
              </>
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

      {/* AI GENERATION OVERLAY */}
      {showGenOverlay && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-pure-white)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'opacity 0.5s ease',
          opacity: isGenerating ? 1 : 0,
          pointerEvents: isGenerating ? 'all' : 'none',
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{ width: '400px', textAlign: 'center' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '20px', background: 'var(--premium-blue)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                margin: '0 auto 24px auto', boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
                animation: 'pulse 2s infinite'
              }}>
                <Sparkles size={40} style={{ margin: 'auto' }} />
              </div>
              <Title level={2} className="premium-title" style={{ margin: 0, fontWeight: 800 }}>Crafting Your Proposal</Title>
              <Text className="premium-text-sec" style={{ fontSize: '16px' }}>AI is synthesizing your winning bid...</Text>
            </div>

            <div className="gen-progress-card" style={{ background: 'var(--bg-slate-50)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-slate-100)' }}>
              <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong style={{ color: 'var(--premium-blue)', fontSize: '13px' }}>{genStep}</Text>
                <Text className="premium-text-sec" style={{ fontSize: '12px' }}>{genProgress}%</Text>
              </div>
              <Progress
                percent={genProgress}
                showInfo={false}
                strokeColor={{ '0%': '#3b82f6', '100%': '#60a5fa' }}
                strokeWidth={10}
                status="active"
              />
            </div>

            <style dangerouslySetInnerHTML={{
              __html: `
              @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3); }
                50% { transform: scale(1.05); box-shadow: 0 12px 32px rgba(59, 130, 246, 0.5); }
                100% { transform: scale(1); box-shadow: 0 8px 24px rgba(59, 130, 246, 0.3); }
              }

              .builder-main-container { background: var(--bg-pure-white); }
              .builder-side-pane { background: var(--bg-pure-white); }
              .builder-resizer { background: var(--bg-pure-white); }
              .builder-canvas-wrapper { background: var(--bg-slate-50); }

              /* DARK THEME OVERRIDES */
              [data-theme='dark'] .builder-main-container { background: #0d1117 !important; }
              [data-theme='dark'] .builder-side-pane { background: #161b22 !important; }
              [data-theme='dark'] .builder-resizer { background: #161b22 !important; border-color: #30363d !important; }
              [data-theme='dark'] .builder-canvas-wrapper { background: #0d1117 !important; }
              [data-theme='dark'] .ant-layout-header { background: #161b22 !important; border-bottom-color: #30363d !important; }
              [data-theme='dark'] .ant-segmented { background: #0d1117 !important; color: #8b949e !important; }
              [data-theme='dark'] .ant-segmented-item-selected { background: #30363d !important; color: #f0f6fc !important; }
              [data-theme='dark'] .ant-drawer-content { background: #161b22 !important; }
              [data-theme='dark'] .ant-drawer-header { background: #161b22 !important; border-bottom-color: #30363d !important; }
              [data-theme='dark'] .ant-drawer-title { color: #f0f6fc !important; }

              /* Input & Ant Design Overrides in Dark Mode */
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
              
              /* Tiptap Dark Mode Fixes */
              [data-theme='dark'] .tiptap-editor-wrapper { border-color: #30363d !important; }
              [data-theme='dark'] .tiptap-toolbar { background: #161b22 !important; border-bottom-color: #30363d !important; }
              
              /* Canvas Paper in Dark Mode */
              [data-theme='dark'] #proposal-builder-canvas { 
                background: #161b22 !important; 
                box-shadow: 0 0 0 1px #30363d, 0 8px 24px rgba(0,0,0,0.3) !important; 
              }
              [data-theme='dark'] .premium-title { color: #f0f6fc !important; }
              [data-theme='dark'] .premium-text-sec { color: #8b949e !important; }
              [data-theme='dark'] .gen-progress-card { background: #161b22 !important; border-color: #30363d !important; }
            `}} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <MainLayout>
      <Suspense fallback={<div>Loading builder...</div>}>
        <BuilderContent />
      </Suspense>
    </MainLayout>
  );
}
