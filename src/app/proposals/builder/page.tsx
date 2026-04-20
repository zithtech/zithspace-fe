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
import { Typography, Row, Col, Layout, Button, message, Drawer, Space, Dropdown, Segmented } from 'antd';
import type { MenuProps } from 'antd';
import { SaveOutlined, EyeOutlined, DownloadOutlined, FilePdfOutlined, FileWordOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { ProposalService } from '@/services/proposalService';
import { useTheme } from '@/context/ThemeContext';
import { useSearchParams, useRouter } from 'next/navigation';

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
  const [propertiesWidth, setPropertiesWidth] = useState(440);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resizingPane = useRef<'left' | 'right' | 'palette-right' | null>(null);

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
        // PRE-POPULATE NEW PROPOSAL WITH DEFAULT TEMPLATE IN ORDER
        const defaultTemplateTypes: BlockType[] = ['cover', 'text', 'scope', 'timeline', 'pricing', 'signature', 'section'];
        // Use a slight delay to ensure store is ready and avoided strict-mode double-run
        setBlocks([]);
        defaultTemplateTypes.forEach((t) => addBlock(t));
        return;
      }

      try {
        const response: any = await ProposalService.getProposalById(proposalId);
        if (response) {
          let fetchedBlocks = response.blocks_data || [];
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
  useEffect(() => {
    if (blocks.length > prevBlocksLength.current && blocks.length > 0) {
      editorScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
        status: 'draft'
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
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {messageHolder}
      <Header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', lineHeight: 'normal' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button
            type="text"
            icon={isPaletteVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => setIsPaletteVisible(!isPaletteVisible)}
            style={{ fontSize: '18px', padding: '4px 8px', color: '#64748b' }}
          />
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>Proposal Builder</Title>
            <Text type="secondary" style={{ color: 'var(--text-secondary)' }}>Draft and design your perfect proposal</Text>
          </div>
        </div>
        <Space size="middle">
          {isPaletteVisible && (
            <Segmented
              options={[{ label: 'Top', value: 'top' }, { label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }]}
              value={palettePosition}
              onChange={(val) => setPalettePosition(val as 'top' | 'left' | 'right')}
            />
          )}
          <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)} size="large" style={{ borderRadius: 8 }}>
            Live Preview
          </Button>
          <Dropdown menu={{ items: exportMenu }} placement="bottomRight">
            <Button size="large" icon={<DownloadOutlined />} style={{ borderRadius: 8 }}>
              Export
            </Button>
          </Dropdown>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} size="large" style={{ borderRadius: 8 }}>
            {proposalId ? 'Save Changes' : 'Save'}
          </Button>
          <Button
            type="text"
            icon={isPropertiesVisible ? <MenuFoldOutlined style={{ transform: 'rotate(180deg)' }} /> : <MenuUnfoldOutlined style={{ transform: 'rotate(180deg)' }} />}
            onClick={() => setIsPropertiesVisible(!isPropertiesVisible)}
            style={{ fontSize: '18px', padding: '4px 8px', color: '#64748b' }}
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

          <div style={{ display: 'flex', height: '100%', margin: 0, width: '100%', overflow: 'hidden' }}>
            {isPaletteVisible && palettePosition === 'left' && (
              <>
                <div style={{ width: `${paletteWidth}px`, flexShrink: 0, height: '100%', background: '#ffffff' }}>
                  <BlockPalette layout="vertical" />
                </div>
                <div
                  onMouseDown={startResizeLeft}
                  style={{
                    width: '6px',
                    cursor: 'col-resize',
                    background: '#ffffff',
                    borderLeft: '1px solid var(--border-color)',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div style={{ height: '40px', width: '2px', background: '#94a3b8', borderRadius: '2px' }} />
                </div>
              </>
            )}

            <div
              ref={editorScrollRef}
              style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#ffffff', minWidth: '300px' }}
            >
              <EditorCanvas />
            </div>

            {isPropertiesVisible && (
              <div
                onMouseDown={startResizeRight}
                style={{
                  width: '6px',
                  cursor: 'col-resize',
                  background: '#ffffff',
                  borderLeft: '1px solid var(--border-color)',
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <div style={{ height: '40px', width: '2px', background: '#94a3b8', borderRadius: '2px' }} />
              </div>
            )}

            {isPropertiesVisible && (
              <div style={{ width: `${propertiesWidth}px`, flexShrink: 0, height: '100%', background: '#ffffff', overflowY: 'auto', borderLeft: '1px solid var(--border-color)' }}>
                <BlockProperties />
              </div>
            )}

            {isPaletteVisible && palettePosition === 'right' && (
              <>
                <div
                  onMouseDown={startResizePaletteRight}
                  style={{
                    width: '6px',
                    cursor: 'col-resize',
                    background: '#ffffff',
                    borderLeft: '1px solid var(--border-color)',
                    borderRight: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                >
                  <div style={{ height: '40px', width: '2px', background: '#94a3b8', borderRadius: '2px' }} />
                </div>
                <div style={{ width: `${paletteWidth}px`, flexShrink: 0, height: '100%', background: '#ffffff' }}>
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

      <Drawer
        title={<span style={{ color: 'var(--text-primary)' }}>Live Preview</span>}
        placement="right"
        width={850}
        onClose={() => setPreviewOpen(false)}
        open={previewOpen}
        styles={{
          body: { padding: 0, background: '#ffffff' },
          header: { background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' },
          mask: { backdropFilter: 'blur(4px)' }
        }}
      >
        <iframe
          ref={iframeRef}
          src={`/proposals/preview?theme=${theme}`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Proposal Preview Slider"
        />
      </Drawer>
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
