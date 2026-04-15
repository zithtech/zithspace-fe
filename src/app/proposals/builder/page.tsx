'use client';

import React, { useState, useEffect, useRef } from 'react';
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

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function BuilderPage() {
  const { blocks, addBlock, reorderBlocks } = useProposalStore();
  const [activeDragType, setActiveDragType] = useState<BlockType | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPaletteVisible, setIsPaletteVisible] = useState(true);
  const [isPropertiesVisible, setIsPropertiesVisible] = useState(true);
  const [palettePosition, setPalettePosition] = useState<'top' | 'left' | 'right'>('top');
  const [paletteWidth, setPaletteWidth] = useState(280);
  const [propertiesWidth, setPropertiesWidth] = useState(480);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const resizingPane = useRef<'left' | 'right' | 'palette-right' | null>(null);

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

  const startResizePaletteRight = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingPane.current = 'palette-right';
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Sync state to iframe when blocks change
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SYNC_BLOCKS',
        payload: blocks
      }, '*');
    }
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

  const handleSave = () => {
    console.log('Saved Proposal State:', JSON.stringify(blocks, null, 2));
    message.success('Proposal saved successfully! (Check console for output)');
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
    <MainLayout>
      <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
        <Header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', lineHeight: 'normal' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Button 
              type="text" 
              icon={isPaletteVisible ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />} 
              onClick={() => setIsPaletteVisible(!isPaletteVisible)} 
              style={{ fontSize: '18px', padding: '4px 8px', color: '#64748b' }} 
            />
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Proposal Builder</Title>
              <Text type="secondary">Draft and design your perfect proposal</Text>
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
              Save
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
              {/* Palette */}
              {isPaletteVisible && palettePosition === 'left' && (
                <>
                  <div style={{ width: `${paletteWidth}px`, flexShrink: 0, height: '100%', background: '#fff' }}>
                    <BlockPalette layout="vertical" />
                  </div>
                  
                  {/* Left Adjustable Resizer Handle */}
                  <div 
                    onMouseDown={startResizeLeft}
                    style={{
                      width: '6px',
                      cursor: 'col-resize',
                      background: '#f8fafc',
                      borderLeft: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ height: '40px', width: '2px', background: '#94a3b8', borderRadius: '2px' }} />
                  </div>
                </>
              )}

              {/* Editor */}
              <div style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#ffffff', minWidth: '300px' }}>
                <EditorCanvas />
              </div>

              {/* Right Adjustable Resizer Handle for Properties */}
              {isPropertiesVisible && (
                <div 
                  onMouseDown={startResizeRight}
                  style={{
                    width: '6px',
                    cursor: 'col-resize',
                    background: '#f8fafc',
                    borderLeft: '1px solid #e2e8f0',
                    borderRight: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                >
                  <div style={{ height: '40px', width: '2px', background: '#94a3b8', borderRadius: '2px' }} />
                </div>
              )}

              {/* Properties */}
              {isPropertiesVisible && (
                <div style={{ width: `${propertiesWidth}px`, flexShrink: 0, height: '100%', background: '#fff', overflowY: 'auto' }}>
                  <BlockProperties />
                </div>
              )}

              {/* Palette (Right Position) */}
              {isPaletteVisible && palettePosition === 'right' && (
                <>
                  {/* Right Adjustable Resizer Handle for Palette */}
                  <div 
                    onMouseDown={startResizePaletteRight}
                    style={{
                      width: '6px',
                      cursor: 'col-resize',
                      background: '#f8fafc',
                      borderLeft: '1px solid #e2e8f0',
                      borderRight: '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
                  >
                    <div style={{ height: '40px', width: '2px', background: '#94a3b8', borderRadius: '2px' }} />
                  </div>
                  <div style={{ width: `${paletteWidth}px`, flexShrink: 0, height: '100%', background: '#fff' }}>
                    <BlockPalette layout="vertical" />
                  </div>
                </>
              )}
            </div>

            <DragOverlay>
              {activeDragType ? (
                <div style={{ padding: '12px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', opacity: 0.8, fontWeight: 600 }}>
                  Dragging {activeDragType}...
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </Content>

        {/* Live Preview Drawer */}
        <Drawer
          title="Live Preview"
          placement="right"
          width={850}
          onClose={() => setPreviewOpen(false)}
          open={previewOpen}
          styles={{ body: { padding: 0, background: '#f1f5f9' } }}
        >
          <iframe
            ref={iframeRef}
            src="/proposals/preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Proposal Preview Slider"
          />
        </Drawer>
      </div>
    </MainLayout>
  );
}
