'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { Button, Modal, Drawer, Row, Col, Space, Typography } from 'antd';
const { Title } = Typography;
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import { Sparkles, Palette } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ThemePreviewRenderer } from '@/components/proposals/themes/ThemePreviewRenderer';

const THEMES = [
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'A sharp, professional design with energetic blue accents and a contemporary layout.',
    badge: 'Default',
    bgStart: '#e0f2fe',
    bgEnd: '#0284c7'
  },
  {
    id: 'minimalist-light',
    name: 'Minimalist Light',
    description: 'A striking blend of navy blue and emerald green waves over a clean geometric background.',
    badge: 'Modern',
    bgStart: '#f8fafc',
    bgEnd: '#10b981'
  },
  {
    id: 'bold-dark',
    name: 'Bold Geometric',
    description: 'A striking light theme with sharp red and dark grey geometric accents.',
    badge: 'Premium',
    bgStart: '#ffffff',
    bgEnd: '#ef4444'
  },
  {
    id: 'elegant-classic',
    name: 'Elegant Wave',
    description: 'A sophisticated layout featuring a sweeping vertical navy wave and clean typography.',
    badge: 'Classic',
    bgStart: '#ffffff',
    bgEnd: '#1e293b'
  }
];

export default function ThemeGalleryPage() {
  const router = useRouter();
  const { theme: currentTheme } = useTheme();
  const isDark = currentTheme === 'dark';
  const [previewTheme, setPreviewTheme] = React.useState<string | null>(null);

  return (
    <MainLayout>
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Row align="middle" justify="space-between">
            {/* Left side - Title */}
            <Col>
              <Space align="center">
                <Palette style={{ color: "#1677ff" }} size={24} />
                <Title level={3} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>
                  Cover Themes Gallery
                </Title>
              </Space>
              <p style={{ fontSize: 14, color: isDark ? '#94a3b8' : '#64748b', margin: '8px 0 0 0', maxWidth: 600 }}>
                Select a starting design for your proposal's cover page. This visual theme will carry through your PDF exports and web previews.
              </p>
            </Col>
            
            {/* Right side */}
            <Col>
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />} 
                onClick={() => router.push('/proposals')}
                style={{ color: '#64748b' }}
              >
                Back to Proposals
              </Button>
            </Col>
          </Row>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {THEMES.map((theme) => (
            <div 
              key={theme.id}
              style={{
                background: isDark ? '#1e293b' : '#fff',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'all 0.2s',
                boxShadow: isDark ? '0 4px 6px -1px rgba(0,0,0,0.5)' : '0 4px 6px -1px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 20px -8px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
              }}
            >
              {/* Preview Thumbnail */}
              <div style={{ 
                height: 180, 
                background: `linear-gradient(135deg, ${theme.bgStart}, ${theme.bgEnd})`,
                position: 'relative',
                borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {theme.badge && (
                  <span style={{ 
                    position: 'absolute', top: 12, right: 12, 
                    background: 'rgba(255,255,255,0.9)', color: '#0f172a', 
                    padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700, 
                    letterSpacing: '0.05em', textTransform: 'uppercase', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                  }}>
                    {theme.badge}
                  </span>
                )}
                
                {/* Mockup of a proposal cover */}
                <div style={{ 
                  width: '65%', height: '80%', background: theme.id === 'bold-dark' ? '#f8fafc' : (theme.id === 'elegant-classic' ? '#fafaf9' : '#ffffff'), 
                  borderRadius: '8px 8px 0 0', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  display: 'flex', flexDirection: 'column', padding: 20, position: 'relative', overflow: 'hidden',
                  border: '1px solid #e2e8f0'
                }}>
                  {theme.id === 'minimalist-light' && (
                    <>
                      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: '#1e293b' }}></div>
                      <div style={{ position: 'absolute', top: -10, right: -10, width: 50, height: 50, borderRadius: '50%', background: '#10b981' }}></div>
                      <div style={{ position: 'absolute', bottom: -10, left: -10, width: 60, height: 60, borderRadius: '50%', background: '#1e293b' }}></div>
                      <div style={{ position: 'absolute', bottom: -5, left: -5, width: 40, height: 40, borderRadius: '50%', background: '#10b981' }}></div>
                    </>
                  )}
                  {theme.id === 'bold-dark' && (
                    <>
                      <div style={{ position: 'absolute', top: -30, left: -40, width: 80, height: 80, background: '#334155', transform: 'rotate(-45deg)' }}></div>
                      <div style={{ position: 'absolute', top: -10, left: -60, width: 80, height: 80, background: '#dc2626', transform: 'rotate(-45deg)' }}></div>
                      <div style={{ position: 'absolute', bottom: -40, right: -40, width: 100, height: 80, background: '#1e293b', transform: 'rotate(-35deg)' }}></div>
                      <div style={{ position: 'absolute', bottom: -20, right: -60, width: 100, height: 80, background: '#dc2626', transform: 'rotate(-35deg)' }}></div>
                      <div style={{ position: 'absolute', top: 5, right: 5, width: 40, height: 40, backgroundImage: 'radial-gradient(#dc2626 1px, transparent 1px)', backgroundSize: '4px 4px', opacity: 0.3 }}></div>
                    </>
                  )}
                  {theme.id === 'elegant-classic' && (
                    <svg style={{ position: 'absolute', top: 0, right: 0, width: '45%', height: '100%', zIndex: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M 50 0 C 20 40, 90 60, 40 100 L 100 100 L 100 0 Z" fill="#1e293b" />
                      <path d="M 40 0 C 10 40, 80 60, 30 100" fill="none" stroke="#1f2937" strokeWidth="4" vectorEffect="non-scaling-stroke" />
                    </svg>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 20, zIndex: 1 }}>
                    <div style={{ width: 24, height: 24, background: theme.id === 'bold-dark' ? '#dc2626' : (theme.id === 'minimalist-light' ? '#1e293b' : '#1e293b'), borderRadius: 4 }}></div>
                  </div>
                  <div style={{ width: '60%', height: 16, background: theme.id === 'bold-dark' ? '#0f172a' : (theme.id === 'minimalist-light' ? '#1e293b' : '#1e293b'), borderRadius: 4, marginBottom: 8, zIndex: 1 }}></div>
                  <div style={{ width: '40%', height: 16, background: theme.id === 'bold-dark' ? '#dc2626' : (theme.id === 'minimalist-light' ? '#1e293b' : '#1e293b'), borderRadius: 4, marginBottom: 30, zIndex: 1 }}></div>
                  
                  <div style={{ width: '30%', height: 8, background: theme.id === 'bold-dark' ? '#ef4444' : (theme.id === 'minimalist-light' ? '#10b981' : '#64748b'), borderRadius: 4, marginBottom: 6, zIndex: 1, marginTop: 'auto' }}></div>
                  <div style={{ width: '40%', height: 10, background: theme.id === 'bold-dark' ? '#1e293b' : (theme.id === 'minimalist-light' ? '#10b981' : '#1e293b'), borderRadius: 4, zIndex: 1 }}></div>
                </div>
              </div>

              {/* Details & Actions */}
              <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', margin: '0 0 6px 0' }}>{theme.name}</h3>
                <p style={{ fontSize: 13, color: isDark ? '#cbd5e1' : '#64748b', margin: '0 0 16px 0', lineHeight: 1.4, flex: 1 }}>
                  {theme.description}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button 
                    icon={<EyeOutlined />}
                    onClick={() => setPreviewTheme(theme.id)}
                    style={{ 
                      borderRadius: 8, fontWeight: 600, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDark ? '#334155' : '#f1f5f9',
                      borderColor: isDark ? '#475569' : '#e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      flex: 1
                    }}
                  >
                    Preview
                  </Button>
                </div>
                </div>
            </div>
          ))}
        </div>

        {/* Live Preview Drawer */}
        <Drawer
          title={null}
          open={!!previewTheme}
          onClose={() => setPreviewTheme(null)}
          placement="right"
          width={880}
          closable={true}
          styles={{
            body: { padding: 0, overflow: 'hidden', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
            header: { display: 'none' }
          }}
          closeIcon={<span style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '8px', borderRadius: '50%', display: 'flex' }}>✕</span>}
        >
          {previewTheme && (
            <div style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex', justifyContent: 'center', padding: '40px 0', position: 'relative' }}>
              <Button 
                type="text" 
                icon={<span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</span>} 
                onClick={() => setPreviewTheme(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', color: 'white', width: 36, height: 36, borderRadius: '50%', zIndex: 100 }}
              />
              <div style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', borderRadius: 4, overflow: 'hidden', width: '210mm', height: '297mm', background: 'white' }}>
                <ThemePreviewRenderer theme={previewTheme} />
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </MainLayout>
  );
}
