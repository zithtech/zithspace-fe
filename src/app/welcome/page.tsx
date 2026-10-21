'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import Image from 'next/image';
import {
  RocketOutlined,
  ThunderboltOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  BugOutlined,
  AuditOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ExperimentOutlined,
  DeploymentUnitOutlined,
  TrophyOutlined,
  TagsOutlined,
  RadarChartOutlined,
  SettingOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  Play,
  CheckCircle2,
  TrendingUp,
  Search,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/context/ProductContext';
import ZukvoLoader from '@/components/common/ZukvoLoader';

import ZukvoLogoImg from '@/assets/logo/Zukvologo.png';
import TestiezMarkImg from '@/assets/logo/testiez/mark.png';
import TestiezWordmarkImg from '@/assets/logo/testiez/wordmark.png';

interface TourStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  accentColor: string;
  highlights: string[];
  visual: React.ReactNode;
  faqs?: { q: string; a: string }[];
}

// ── Jira & Linear Vector Glyphs ──────────────────────────────────────────────
function JiraLogoSvg({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M11.53 2c0 5.25 4.25 9.5 9.5 9.5h.97v-8.53C22 2.43 21.57 2 21.03 2H11.53z" fill="#0052CC" />
      <path d="M2 11.53c5.25 0 9.5 4.25 9.5 9.5v.97H2.97C2.43 22 2 21.57 2 21.03V11.53z" fill="#2684FF" />
      <path d="M11.53 11.53c0 5.25 4.25 9.5 9.5 9.5h.97v-8.53c0-.54-.43-.97-.97-.97H11.53z" fill="#0052CC" opacity="0.85" />
    </svg>
  );
}

function LinearLogoSvg({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M50 0C22.3858 0 0 22.3858 0 50C0 77.6142 22.3858 100 50 100C77.6142 100 100 77.6142 100 50C100 22.3858 77.6142 0 50 0ZM14.1421 50C14.1421 30.1966 30.1966 14.1421 50 14.1421C61.4286 14.1421 71.5541 19.4678 78.1408 27.7656L27.7656 78.1408C19.4678 71.5541 14.1421 61.4286 14.1421 50ZM50 85.8579C38.5714 85.8579 28.4459 80.5322 21.8592 72.2344L72.2344 21.8592C80.5322 28.4459 85.8579 38.5714 85.8579 50C85.8579 69.8034 69.8034 85.8579 50 85.8579Z"
        fill="#5E6AD2"
      />
    </svg>
  );
}

// ── Ultra-Detailed Interactive Mockup ─────────────────────────────────────────
function ProductPreviewMockup({ accent }: { accent: string }) {
  const [activeModule, setActiveModule] = useState('All Test Cases');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Pass' | 'Fail' | 'Pending'>('All');
  const [aiGenerating, setAiGenerating] = useState(false);

  const modules = [
    { name: 'All Test Cases', count: 47 },
    { name: 'Auth & Login', count: 12 },
    { name: 'Payment Gateway', count: 9 },
    { name: 'User Dashboard', count: 11 },
    { name: 'Checkout Flow', count: 8 },
    { name: 'Notifications', count: 7 },
  ];

  const allTestCases = [
    { id: 'TC-041', title: 'Verify OTP login fallback on SMS gateway timeout', status: 'Pass', assignee: 'RK', module: 'Auth & Login', priority: 'High', runtime: '340ms' },
    { id: 'TC-042', title: 'Validate payment webhook retry on 504 gateway timeout', status: 'Fail', assignee: 'PM', module: 'Payment Gateway', priority: 'Critical', runtime: '1.8s' },
    { id: 'TC-043', title: 'Check session token expiry after 30min idle state', status: 'Pending', assignee: 'AS', module: 'Auth & Login', priority: 'Medium', runtime: '120ms' },
    { id: 'TC-044', title: 'Assert cart subtotal with stacked coupon calculation', status: 'Pass', assignee: 'KD', module: 'Checkout Flow', priority: 'High', runtime: '490ms' },
  ];

  const filteredCases = allTestCases.filter(tc => {
    const matchModule = activeModule === 'All Test Cases' || tc.module === activeModule;
    const matchFilter = activeFilter === 'All' || tc.status === activeFilter;
    return matchModule && matchFilter;
  });

  const statusStyle: Record<string, { color: string; bg: string; border: string }> = {
    Pass: { color: '#059669', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
    Fail: { color: '#dc2626', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)' },
    Pending: { color: '#d97706', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  };

  const priorityColor: Record<string, string> = {
    Critical: '#ef4444',
    High: '#f97316',
    Medium: '#f59e0b',
  };

  const handleGenerateAI = () => {
    setAiGenerating(true);
    setTimeout(() => {
      setAiGenerating(false);
      message.success('Synthesized 3 boundary test cases with AI Copilot!');
    }, 700);
  };

  return (
    <div style={{ width: '100%', maxWidth: 640, position: 'relative', height: 410, margin: '0 auto' }}>
      {/* Ambient background glows */}
      <div
        style={{
          position: 'absolute',
          top: -15,
          left: '10%',
          width: 260,
          height: 260,
          background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          filter: 'blur(80px)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -15,
          right: '5%',
          width: 240,
          height: 240,
          background: 'radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)',
          filter: 'blur(75px)',
          pointerEvents: 'none',
          borderRadius: '50%',
        }}
      />

      {/* ── Top-Right Floating Metric Badge ── */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          right: 2,
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(16, 185, 129, 0.28)',
          borderRadius: 14,
          padding: '8px 12px',
          boxShadow: '0 10px 28px -4px rgba(16, 185, 129, 0.18), 0 3px 8px rgba(15, 23, 42, 0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'shapeFloat 5s ease-in-out infinite alternate',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 3px 10px rgba(16, 185, 129, 0.35)',
          }}
        >
          <TrendingUp size={16} strokeWidth={2.5} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>94.2%</span>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#059669' }}>+3.8% ↑</span>
          </div>
          <span style={{ fontSize: 9, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pass Rate · Sprint 3
          </span>
        </div>
      </div>

      {/* ── Main macOS Studio Window ── */}
      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 8,
          right: 8,
          background: '#ffffff',
          borderRadius: 18,
          border: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.12), 0 8px 20px -4px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.8) inset',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(20px)',
          textAlign: 'left',
        }}
      >
        {/* macOS Title Bar */}
        <div
          style={{
            height: 36,
            background: '#f8fafc',
            borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px',
            userSelect: 'none',
          }}
        >
          {/* Traffic Lights */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56', border: '1px solid rgba(224,68,62,0.5)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e', border: '1px solid rgba(222,161,35,0.5)' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f', border: '1px solid rgba(40,179,60,0.5)' }} />
          </div>

          {/* Breadcrumb Path */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#ffffff',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: 5,
              padding: '2px 8px',
              fontSize: 10.5,
              color: '#475569',
              fontWeight: 500,
            }}
          >
            <Lock size={9} color="#94a3b8" />
            <span>zukvo-cloud</span>
            <span style={{ color: '#cbd5e1' }}>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>sprint-3-qa</span>
          </div>

          {/* Live Sync Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#059669' }}>Live Sync</span>
          </div>
        </div>

        {/* Project Header Bar */}
        <div
          style={{
            padding: '9px 14px',
            borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            background: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                background: `${accent}15`,
                border: `1px solid ${accent}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accent,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              QA
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                E-Commerce QA · Sprint 3
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                47 Scoped Test Cases
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 5,
                background: '#f1f5f9',
                color: '#475569',
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              Scrum
            </span>
            <span
              style={{
                padding: '2px 7px',
                borderRadius: 5,
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#059669',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              Active
            </span>
          </div>
        </div>

        {/* Window Body: Sidebar + Main Content */}
        <div style={{ display: 'flex', height: 260 }}>
          {/* Module Navigation Sidebar */}
          <div
            style={{
              width: 145,
              borderRight: '1px solid rgba(226, 232, 240, 0.8)',
              background: '#f8fafc',
              padding: '10px 6px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '2px 6px 4px',
              }}
            >
              Modules
            </div>

            {modules.map((mod, i) => {
              const isSelected = activeModule === mod.name;
              return (
                <div
                  key={i}
                  onClick={() => setActiveModule(mod.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isSelected ? '#ffffff' : 'transparent',
                    boxShadow: isSelected ? '0 1px 3px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: isSelected ? '#0f172a' : '#475569',
                      fontWeight: isSelected ? 700 : 500,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {mod.name}
                  </span>
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: isSelected ? accent : '#94a3b8',
                      background: isSelected ? `${accent}15` : 'transparent',
                      padding: '1px 4px',
                      borderRadius: 999,
                    }}
                  >
                    {mod.count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Main Test Case Table Panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#ffffff' }}>
            {/* Toolbar: Search & Filter Tabs */}
            <div
              style={{
                padding: '7px 12px',
                borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#f1f5f9',
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: 6,
                  padding: '4px 8px',
                }}
              >
                <Search size={11} color="#64748b" />
                <span style={{ fontSize: 10.5, color: '#94a3b8', flex: 1 }}>Search test cases...</span>
                <span
                  style={{
                    fontSize: 8.5,
                    color: '#64748b',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 3,
                    padding: '1px 3px',
                    fontWeight: 600,
                  }}
                >
                  ⌘K
                </span>
              </div>

              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: 3 }}>
                {(['All', 'Pass', 'Fail', 'Pending'] as const).map(f => {
                  const isSel = activeFilter === f;
                  return (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      style={{
                        background: isSel ? '#0f172a' : '#f8fafc',
                        color: isSel ? '#ffffff' : '#64748b',
                        border: isSel ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
                        borderRadius: 5,
                        padding: '3px 6px',
                        fontSize: 9.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Test Case Rows */}
            <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {filteredCases.map((tc, i) => {
                const st = statusStyle[tc.status];
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 12px',
                      borderBottom: '1px solid rgba(241, 245, 249, 0.9)',
                      transition: 'background 0.15s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
                  >
                    {/* Priority dot */}
                    <span style={{ fontSize: 7, color: priorityColor[tc.priority] || '#94a3b8' }}>●</span>

                    {/* Test ID */}
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#64748b', minWidth: 42 }}>
                      {tc.id}
                    </span>

                    {/* Test Title */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: 11,
                        color: '#0f172a',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tc.title}
                    </span>

                    {/* Runtime */}
                    <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: 'monospace', flexShrink: 0 }}>
                      {tc.runtime}
                    </span>

                    {/* Status Pill */}
                    <div
                      style={{
                        padding: '2px 7px',
                        borderRadius: 999,
                        background: st.bg,
                        border: `1px solid ${st.border}`,
                        fontSize: 9.5,
                        color: st.color,
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {tc.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating AI Test Generator Card (Bottom-Left) ── */}
      <div
        onClick={handleGenerateAI}
        style={{
          position: 'absolute',
          bottom: -4,
          left: 4,
          zIndex: 20,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(139, 92, 246, 0.28)',
          borderRadius: 12,
          padding: '7px 12px',
          boxShadow: '0 10px 24px -4px rgba(139, 92, 246, 0.2), 0 3px 8px rgba(15, 23, 42, 0.05)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          animation: 'shapeFloat 6s ease-in-out infinite alternate',
          textAlign: 'left',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.28)';
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 7,
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 6px rgba(139, 92, 246, 0.4)',
          }}
        >
          <Sparkles size={12} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
            {aiGenerating ? 'Synthesizing...' : 'Generate with AI Copilot'}
          </div>
          <div style={{ fontSize: 9, color: '#64748b' }}>
            Auto-generate edge scenarios
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Demo Tour Modal Visuals ──────────────────────────────────────────────────
function TourStepVisual({ stepIndex, accent }: { stepIndex: number; accent: string }) {
  const visuals: React.ReactNode[] = [
    // 0 – Create Project
    <div key={0} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 12, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>New Project Setup</div>
      {[{ label: 'Project Name', val: 'E-Commerce QA Sprint 3' }, { label: 'Methodology', val: 'Agile / Scrum' }, { label: 'Assigned Leads', val: '4 QA Specialists' }].map((f, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{f.label}</div>
          <div style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, color: '#0f172a', fontWeight: 500 }}>{f.val}</div>
        </div>
      ))}
      <div style={{ marginTop: 6, padding: '9px 16px', borderRadius: 10, background: accent, color: '#fff', fontSize: 12.5, fontWeight: 700, textAlign: 'center', cursor: 'pointer', boxShadow: `0 4px 12px ${accent}40` }}>
        Create QA Project →
      </div>
    </div>,
    // 1 – Settings
    <div key={1} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Workspace Governance</div>
      {['Notification Webhooks', 'Role-Based Permissions', 'Two-Way Jira Sync', 'Custom Quality Gates'].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '9px 12px' }}>
          <span style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 500 }}>{item}</span>
          <div style={{ width: 30, height: 16, borderRadius: 8, background: i % 2 === 0 ? accent : '#e2e8f0', position: 'relative' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, right: i % 2 === 0 ? 2 : 16 }} />
          </div>
        </div>
      ))}
    </div>,
    // 2 – Scope
    <div key={2} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Sprint Scope Definition</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['Functional', 'Regression', 'API Suite', 'UI Flow'].map((tag, i) => (
          <div key={i} style={{ padding: '3px 8px', borderRadius: 6, background: i === 0 ? accent : '#f1f5f9', color: i === 0 ? '#fff' : '#475569', fontSize: 10.5, fontWeight: 600 }}>{tag}</div>
        ))}
      </div>
      {['Login & Multi-Factor Auth', 'Checkout & Payment Webhooks', 'User Profile & Settings', 'Real-time Notifications'].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '7px 10px' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${i < 2 ? accent : '#cbd5e1'}`, background: i < 2 ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff' }}>{i < 2 ? '✓' : ''}</div>
          <span style={{ fontSize: 12, color: '#0f172a' }}>{item}</span>
        </div>
      ))}
    </div>,
    // 3 – Test Cases
    <div key={3} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Test Repository</div>
      {[
        { id: 'TC-001', title: 'Verify user login with valid credentials', status: 'Pass', color: '#10b981' },
        { id: 'TC-002', title: 'Validate 2FA authentication flow error states', status: 'Fail', color: '#ef4444' },
        { id: 'TC-003', title: 'Test password reset token expiry behavior', status: 'Pass', color: '#10b981' },
        { id: 'TC-004', title: 'Check checkout session idle expiration', status: 'Pending', color: '#f59e0b' },
      ].map((tc, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '7px 12px' }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748b', fontWeight: 700, minWidth: 46 }}>{tc.id}</span>
          <span style={{ flex: 1, fontSize: 11.5, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tc.title}</span>
          <div style={{ padding: '2px 8px', borderRadius: 999, background: `${tc.color}15`, border: `1px solid ${tc.color}40`, fontSize: 9.5, color: tc.color, fontWeight: 700 }}>{tc.status}</div>
        </div>
      ))}
    </div>,
    // 4 – Test Suites
    <div key={4} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Organized Test Suites</div>
      {[
        { name: 'Authentication Suite', count: 12, passed: 10, color: '#2a78d6' },
        { name: 'Payment Flow Suite', count: 8, passed: 6, color: '#8b5cf6' },
        { name: 'Core Regression Pack', count: 24, passed: 22, color: '#10b981' },
      ].map((suite, i) => {
        const pct = Math.round((suite.passed / suite.count) * 100);
        return (
          <div key={i} style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 10, padding: '10px 14px', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 700 }}>{suite.name}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: suite.color }}>{pct}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: suite.color }} />
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: '#64748b' }}>{suite.passed} of {suite.count} passed</div>
          </div>
        );
      })}
    </div>,
    // 5 – Test Runs
    <div key={5} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Live Execution Runs</div>
      {[
        { name: 'Sprint 3 - Full Regression', date: 'Today 09:00', status: 'Running', color: '#3b82f6', passed: 34, total: 47 },
        { name: 'Auth Module - Smoke Run', date: 'Yesterday', status: 'Passed', color: '#10b981', passed: 12, total: 12 },
        { name: 'Checkout API - Integration', date: '2 days ago', status: 'Failed', color: '#ef4444', passed: 5, total: 9 },
      ].map((run, i) => (
        <div key={i} style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 10, padding: '9px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{run.name}</span>
            <span style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 999, background: `${run.color}15`, color: run.color, fontWeight: 700 }}>{run.status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#64748b' }}>
            <span>{run.date}</span>
            <span style={{ fontWeight: 600 }}>{run.passed}/{run.total} executed</span>
          </div>
        </div>
      ))}
    </div>,
    // 6 – Bug List
    <div key={6} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Defect Tracker</div>
      {[
        { id: 'BUG-42', title: 'Payment timeout on mobile checkout', severity: 'Critical', color: '#ef4444' },
        { id: 'BUG-38', title: 'Cart subtotal rounding error with coupon', severity: 'High', color: '#f97316' },
        { id: 'BUG-31', title: 'Avatar image fails on high latency networks', severity: 'Medium', color: '#f59e0b' },
      ].map((bug, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#64748b', minWidth: 48 }}>{bug.id}</span>
          <span style={{ flex: 1, fontSize: 11.5, color: '#0f172a' }}>{bug.title}</span>
          <div style={{ padding: '2px 8px', borderRadius: 999, background: `${bug.color}15`, fontSize: 9.5, color: bug.color, fontWeight: 700 }}>{bug.severity}</div>
        </div>
      ))}
    </div>,
    // 7 – Tickets
    <div key={7} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Jira & Linear Tickets</div>
      {[
        { id: 'TKT-14', title: 'Payment failure on mobile Safari', assignee: 'Dev: Karan D.', due: 'Due Today', status: 'In Progress', color: '#f97316' },
        { id: 'TKT-11', title: 'Cart total rounding logic update', assignee: 'Dev: Ravi K.', due: 'Due Tomorrow', status: 'Open', color: '#3b82f6' },
      ].map((t, i) => (
        <div key={i} style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '9px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#64748b' }}>{t.id}</span>
            <span style={{ fontSize: 9.5, padding: '2px 6px', borderRadius: 4, background: `${t.color}15`, color: t.color, fontWeight: 700 }}>{t.status}</span>
          </div>
          <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 600 }}>{t.title}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{t.assignee} · {t.due}</div>
        </div>
      ))}
    </div>,
    // 8 – QA Submissions
    <div key={8} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Formal QA Sign-Offs</div>
      {[
        { name: 'Ananya M.', module: 'Auth Module', time: '10m ago', status: 'Submitted', color: '#3b82f6' },
        { name: 'Ravi K.', module: 'Payment Flow', time: '1h ago', status: 'Under Review', color: '#f59e0b' },
        { name: 'Priya S.', module: 'UI Regression', time: '2h ago', status: 'Approved', color: '#10b981' },
      ].map((sub, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${accent}15`, color: accent, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {sub.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 600 }}>{sub.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{sub.module} · {sub.time}</div>
          </div>
          <div style={{ padding: '2px 8px', borderRadius: 999, background: `${sub.color}15`, fontSize: 10, color: sub.color, fontWeight: 700 }}>{sub.status}</div>
        </div>
      ))}
    </div>,
    // 9 – Approvals
    <div key={9} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Quality Gate Approvals</div>
      <div style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 10, padding: '12px' }}>
        <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>Sprint 3 Final QA Sign-off</div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>Requested by Lead QA · 94.2% Pass Rate</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '7px', borderRadius: 6, background: '#10b981', color: '#fff', fontSize: 11, fontWeight: 700, textAlign: 'center', cursor: 'pointer' }}>✓ Approve Release</div>
          <div style={{ flex: 1, padding: '7px', borderRadius: 6, background: '#f1f5f9', color: '#475569', fontSize: 11, fontWeight: 600, textAlign: 'center', cursor: 'pointer' }}>Request Changes</div>
        </div>
      </div>
    </div>,
    // 10 – Analytics
    <div key={10} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Performance Metrics</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Tests Run', value: '1,248', color: accent },
          { label: 'Pass Rate', value: '94.2%', color: '#10b981' },
          { label: 'Bugs Found', value: '87', color: '#ef4444' },
          { label: 'Avg Cycle', value: '2.3d', color: '#f59e0b' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '9px 10px' }}>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>{kpi.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>
    </div>,
    // 11 – Coverage Map
    <div key={11} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Module Coverage Heatmap</div>
      {[
        { module: 'Auth & Security', coverage: 92 },
        { module: 'Payment Gateway', coverage: 78 },
        { module: 'Cart & Checkout', coverage: 88 },
      ].map((m, i) => (
        <div key={i} style={{ background: '#ffffff', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
            <span>{m.module}</span>
            <span style={{ color: '#10b981', fontWeight: 800 }}>{m.coverage}%</span>
          </div>
          <div style={{ height: 4, borderRadius: 999, background: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${m.coverage}%`, background: '#10b981' }} />
          </div>
        </div>
      ))}
    </div>,
  ];
  return <>{visuals[stepIndex]}</>;
}

function FAQAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div style={{ padding: '24px 32px 32px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', background: '#fafafa' }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 16, textAlign: 'center' }}>
        Frequently Asked Questions
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 680, margin: '0 auto' }}>
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={i}
              style={{
                border: '1px solid rgba(226, 232, 240, 0.9)',
                borderRadius: 10,
                background: '#ffffff',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: '#0f172a',
                  fontSize: 13.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {faq.q}
                <RightOutlined
                  style={{
                    fontSize: 10,
                    transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.25s',
                    color: '#94a3b8',
                  }}
                />
              </button>
              {isOpen && (
                <div style={{ padding: '0 16px 14px', color: '#64748b', fontSize: 13, lineHeight: 1.6, textAlign: 'left' }}>
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DemoTourModal({ onClose, accent }: { onClose: () => void; accent: string }) {
  const [step, setStep] = useState(0);

  const steps: Omit<TourStep, 'visual'>[] = [
    { id: 1, title: 'Create Project', subtitle: 'Start your QA journey', description: 'Set up a dedicated QA project in seconds. Give it a name, choose your methodology, and invite your team. All your modules, test cases, and runs will live inside this project.', icon: <RocketOutlined />, gradient: 'linear-gradient(135deg, #2a78d6, #1a5cbf)', accentColor: '#2a78d6', highlights: ['Custom project templates', 'Agile & Waterfall support', 'Team role assignment'], faqs: [{ q: 'Can I create multiple projects for different products?', a: 'Yes. Testiez supports unlimited projects, so you can have separate projects for each product, client, or sprint cycle. Each project is fully isolated with its own modules, test cases, runs, and team members — nothing bleeds across projects.' }, { q: 'What happens to my data if I archive a project?', a: 'Archiving a project hides it from your active workspace but preserves all data permanently. Test cases, runs, submissions, and bug reports are all retained and can be accessed or restored at any time from the Archived Projects section in your account settings.' }] },
    { id: 2, title: 'Settings', subtitle: 'Configure your workspace', description: "Control every aspect of your project — from member roles and notification preferences to workflow rules and third-party integrations. Settings ensure your team works within a consistent, well-governed process.", icon: <SettingOutlined />, gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', accentColor: '#8b5cf6', highlights: ['Granular role & permission control', 'Slack & Jira integrations', 'Custom workflow status rules'], faqs: [{ q: 'What roles are available and what can each role do?', a: 'Testiez has four roles: Owner (full access), Manager (manage members and approve submissions), QA Engineer (create and execute test cases), and Viewer (read-only access for developers or stakeholders). You can change a member role at any time from the Team Settings tab without losing any of their historical data.' }, { q: 'Can I control which events trigger Slack or email notifications?', a: 'Yes. In the Notifications section of Settings, you can precisely choose which events send alerts — such as bug logged, submission created, approval granted, or run completed — and configure whether they go to email, Slack, or both.' }] },
    { id: 3, title: 'Scope', subtitle: 'Define what gets tested', description: 'Before writing a single test case, define the boundaries of your testing. The Scope module lets you list the modules and features active in this sprint, ensuring nothing is accidentally missed or over-tested.', icon: <DeploymentUnitOutlined />, gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)', accentColor: '#0ea5e9', highlights: ['Sprint-specific scope definition', 'Clone scope from previous sprints', 'Coverage gap highlighting'], faqs: [{ q: 'How is Scope different from just organising modules?', a: 'Modules are permanent structural containers for your test cases. Scope is sprint-specific — it defines which of those modules are actively being tested in the current cycle.' }] },
    { id: 4, title: 'Test Cases', subtitle: 'Write, group, and reuse test cases', description: 'Create step-by-step test cases with preconditions, numbered steps, expected results, and priority levels. Group related cases together within a module for better organisation, and tag them for fast filtering during execution.', icon: <FileTextOutlined />, gradient: 'linear-gradient(135deg, #10b981, #059669)', accentColor: '#10b981', highlights: ['Group related cases within modules', 'Step-by-step editor with expected results', 'Priority, severity & tag filtering'] },
    { id: 5, title: 'Test Suites', subtitle: 'Group test cases for efficient execution', description: 'Organise related test cases into suites — smoke tests, regression packs, or feature-specific groups. Suites let you launch targeted runs without selecting cases one by one every time.', icon: <ExperimentOutlined />, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', accentColor: '#f59e0b', highlights: ['Drag-and-drop case organisation', 'Suite-level pass rate tracking', 'Reusable across multiple sprints'] },
    { id: 6, title: 'Test Runs', subtitle: 'Execute and track tests in real time', description: 'Launch a test run from any suite. Assign cases to specific engineers, track execution progress live on the dashboard, and record pass/fail results with notes and screenshots directly inside the run.', icon: <PlayCircleOutlined />, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', accentColor: '#3b82f6', highlights: ['Live execution progress dashboard', 'Per-case tester assignment', 'Step-level result logging with evidence'] },
    { id: 7, title: 'Bug List', subtitle: 'Capture and manage every defect', description: 'Every bug logged during a test run lands in the Bug List automatically. Review severity, assign it to the responsible developer, link it back to the failing test case, and track its resolution status through to closure.', icon: <BugOutlined />, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', accentColor: '#ef4444', highlights: ['Auto-populated from failed test steps', 'Severity, priority & assignee fields', 'Two-way Jira & Linear sync'] },
    { id: 8, title: 'Tickets', subtitle: 'Turn bugs into trackable action items', description: 'A ticket is the actionable follow-up to a bug. Convert a logged bug into a ticket, assign it to a developer, set a due date, and track its progress from Open to In Progress to Resolved — all within Testiez.', icon: <TagsOutlined />, gradient: 'linear-gradient(135deg, #f97316, #ea580c)', accentColor: '#f97316', highlights: ['One-click bug-to-ticket conversion', 'Assignee, due date & priority fields', 'Full resolution lifecycle tracking'] },
    { id: 9, title: 'QA Submissions', subtitle: 'Formally submit your QA sign-off', description: 'When testing is complete, engineers submit a structured QA report summarising what was tested, the pass/fail breakdown, outstanding bugs, and any risk notes. This formal submission triggers the approval workflow for the team lead.', icon: <AuditOutlined />, gradient: 'linear-gradient(135deg, #ec4899, #be185d)', accentColor: '#ec4899', highlights: ['Structured test summary with pass rate', 'Open bug count & risk notes', 'Evidence uploads & screenshot attachments'] },
    { id: 10, title: 'Approvals', subtitle: 'Enforce quality gates before every release', description: 'Team leads review each QA submission and either approve it, request changes, or reject it with written feedback. An approval is the final quality gate — every decision is permanently logged with a timestamp and reason.', icon: <SafetyCertificateOutlined />, gradient: 'linear-gradient(135deg, #10b981, #047857)', accentColor: '#10b981', highlights: ['Approve, reject or request changes', 'Written feedback on rejections', 'Timestamped approval audit trail'] },
    { id: 11, title: 'Analytics', subtitle: 'Measure and improve QA performance', description: 'Track pass rates, defect trends, test cycle times, and individual tester performance across sprints. Analytics gives QA leads the data they need to identify bottlenecks, improve processes, and report to stakeholders confidently.', icon: <TrophyOutlined />, gradient: 'linear-gradient(135deg, #f59e0b, #b45309)', accentColor: '#f59e0b', highlights: ['Sprint-over-sprint pass rate trends', 'Bug severity & module breakdown', 'Tester performance & velocity metrics'] },
    { id: 12, title: 'Coverage Map', subtitle: 'See every gap in your test coverage', description: 'The Coverage Map gives you a visual overview of which modules and features are well-tested, partially covered, or have no test cases at all. Use it to prioritise where to write tests next and eliminate blind spots before release.', icon: <RadarChartOutlined />, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', accentColor: '#6366f1', highlights: ['Module-level coverage heatmap', 'Zero-coverage area detection', 'Coverage trend across sprint cycles'] },
  ];

  const currentStep = steps[step];
  const total = steps.length;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(12px)',
        }}
      />
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 960,
            maxHeight: '90vh',
            background: '#ffffff',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            borderRadius: 24,
            boxShadow: '0 32px 80px rgba(15, 23, 42, 0.2)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'all',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ThunderboltOutlined style={{ color: currentStep.accentColor, fontSize: 16 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Feature Walkthrough · Step {currentStep.id} of {total}
              </span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                cursor: 'pointer',
              }}
            >
              <CloseOutlined style={{ fontSize: 12 }} />
            </button>
          </div>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', gap: 5, padding: '12px 24px 0', justifyContent: 'center' }}>
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? 22 : 6,
                  height: 6,
                  borderRadius: 3,
                  border: 'none',
                  background: i === step ? currentStep.accentColor : '#e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Modal Body */}
          <div style={{ display: 'flex', padding: '24px 32px', gap: 32 }}>
            {/* Left Column */}
            <div style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: currentStep.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    color: '#fff',
                    boxShadow: `0 8px 20px ${currentStep.accentColor}35`,
                  }}
                >
                  {currentStep.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    {currentStep.subtitle}
                  </div>
                  <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                    {currentStep.title}
                  </h2>
                </div>
              </div>

              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
                {currentStep.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 'auto' }}>
                {currentStep.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={15} color={currentStep.accentColor} />
                    <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{h}</span>
                  </div>
                ))}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(226, 232, 240, 0.8)' }}>
                {step > 0 && (
                  <button
                    onClick={() => setStep(s => s - 1)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 16px',
                      borderRadius: 10,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#475569',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <LeftOutlined style={{ fontSize: 10 }} /> Back
                  </button>
                )}
                <button
                  onClick={step < total - 1 ? () => setStep(s => s + 1) : onClose}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '9px 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: currentStep.gradient,
                    color: '#fff',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: `0 6px 16px ${currentStep.accentColor}40`,
                  }}
                >
                  {step < total - 1 ? (
                    <>Next Step <RightOutlined style={{ fontSize: 11 }} /></>
                  ) : (
                    'Finish Walkthrough'
                  )}
                </button>
              </div>
            </div>

            {/* Right Column Preview */}
            <div style={{ flex: 1, background: '#f8fafc', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: 16, padding: '16px', overflow: 'hidden' }}>
              <TourStepVisual stepIndex={step} accent={currentStep.accentColor} />
            </div>
          </div>

          {/* FAQ Section */}
          <FAQAccordion faqs={currentStep.faqs || []} />
        </div>
      </div>
    </>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function WelcomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { manifest, brand, isTestiez } = useProduct();
  const [tourOpen, setTourOpen] = useState(false);

  if (isLoading) return <ZukvoLoader message="Initializing QA Workspace..." />;
  if (user && user.onboardingCompleted) {
    router.replace(manifest.homeRoute);
    return null;
  }

  const handleAction = (destination: string) => {
    try {
      router.push(destination);
    } catch (err: any) {
      message.error(err?.message || 'Navigation error');
    }
  };

  const accent = brand.accent || '#2a78d6';
  const isTestiezBrand = isTestiez;

  return (
    <>
      <style>{`
        @keyframes shapeFloat { 0% { transform: translateY(0); } 100% { transform: translateY(-12px); } }
        @keyframes pulseDot { 0% { opacity: 0.6; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1.1); } 100% { opacity: 0.6; transform: scale(0.95); } }
        .welcome-hero-card:hover {
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.4) !important;
          box-shadow: 0 10px 24px -4px rgba(15, 23, 42, 0.08) !important;
        }
      `}</style>

      {/* Main Studio Canvas */}
      <div
        style={{
          minHeight: '100vh',
          width: '100vw',
          background: '#f8fafc',
          position: 'relative',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 32px 32px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {/* Subtle Engineering Dot Grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(148, 163, 184, 0.18) 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none',
            maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 70%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, #000 70%, transparent 100%)',
          }}
        />

        {/* Ambient Atmospheric Lighting */}
        <div
          style={{
            position: 'absolute',
            top: '-5%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '65vw',
            height: '35vw',
            background: `radial-gradient(circle, ${accent}12 0%, transparent 70%)`,
            filter: 'blur(130px)',
            pointerEvents: 'none',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0%',
            right: '10%',
            width: '45vw',
            height: '30vw',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
            filter: 'blur(110px)',
            pointerEvents: 'none',
            borderRadius: '50%',
          }}
        />

        {/* ══ TOP CENTERED SECTION: WELCOME TO ZUKVO ═══════════════════ */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: 720,
            margin: '0 auto 20px',
            width: '100%',
          }}
        >
          {/* Brand Row: Logo Tile + Wordmark + Enterprise Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 12,
            }}
          >
            {/* Ceramic Glass Logo Tile */}
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: '#ffffff',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                boxShadow: '0 6px 16px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
              }}
            >
              <Image
                src={isTestiezBrand ? TestiezMarkImg : ZukvoLogoImg}
                alt={isTestiezBrand ? 'Testiez' : 'Zukvo'}
                width={32}
                height={32}
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isTestiezBrand ? (
                <Image
                  src={TestiezWordmarkImg}
                  alt="Testiez"
                  height={24}
                  width={100}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              ) : (
                <span style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.035em' }}>
                  Zukvo
                </span>
              )}
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  padding: '2px 7px',
                  borderRadius: 999,
                  background: 'rgba(59, 130, 246, 0.1)',
                  color: '#2563eb',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                }}
              >
                Enterprise
              </span>
            </div>
          </div>

          {/* Overline Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
              backdropFilter: 'blur(8px)',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 6px #10b981',
                animation: 'pulseDot 2s infinite ease-in-out',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#0f172a' }}>
              Next-Gen QA Workspace
            </span>
            <span style={{ fontSize: 10, color: '#cbd5e1' }}>·</span>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: accent }}>
              v2.4 Ready
            </span>
          </div>

          {/* Headline: Welcome to Zukvo */}
          <h1
            style={{
              fontSize: 'clamp(28px, 3.4vw, 40px)',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              margin: '0 0 8px',
            }}
          >
            Welcome to{' '}
            <span
              style={{
                background: isTestiezBrand
                  ? 'linear-gradient(135deg, #2a78d6 0%, #0284c7 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {isTestiezBrand ? 'Testiez' : 'Zukvo'}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 14.5,
              color: '#475569',
              lineHeight: 1.5,
              margin: '0 auto',
              maxWidth: 580,
              fontWeight: 400,
            }}
          >
            {isTestiezBrand
              ? 'Your collaborative QA workspace is ready. Author test suites, track live execution analytics, and synchronize seamlessly with Jira & Linear.'
              : 'Your collaborative QA workspace is ready. Author test suites, track live execution analytics, and synchronize seamlessly with your team.'}
          </p>
        </div>

        {/* ══ DOWN SECTION: SET LEFT AND RIGHT ═════════════════════════ */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: 1240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 36,
            flexWrap: 'wrap',
            margin: '0 auto',
          }}
        >
          {/* ── LEFT COLUMN: 3 Cards + CTAs + Connectors ── */}
          <div
            style={{
              flex: '1 1 420px',
              maxWidth: 480,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* 3 Detailed Micro-Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                {
                  icon: <Sparkles size={15} color="#6366f1" />,
                  iconBg: 'rgba(99, 102, 241, 0.1)',
                  iconBorder: 'rgba(99, 102, 241, 0.2)',
                  title: 'Centralized Test Management',
                  desc: 'AI-assisted test generation, parameterized test cases & reusable suite orchestration.',
                },
                {
                  icon: <ShieldCheck size={15} color="#10b981" />,
                  iconBg: 'rgba(16, 185, 129, 0.1)',
                  iconBorder: 'rgba(16, 185, 129, 0.2)',
                  title: 'End-to-End Defect Intelligence',
                  desc: 'Live execution telemetry, regression tracking & multi-gate QA sign-off workflows.',
                },
                {
                  icon: <Layers size={15} color="#0284c7" />,
                  iconBg: 'rgba(2, 132, 199, 0.1)',
                  iconBorder: 'rgba(2, 132, 199, 0.2)',
                  title: 'Bi-Directional Workspace Sync',
                  desc: 'Instant two-way synchronization with your Jira boards and Linear project cycles.',
                },
              ].map((feat, i) => (
                <div
                  key={i}
                  className="welcome-hero-card"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(226, 232, 240, 0.85)',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.02)',
                    backdropFilter: 'blur(8px)',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9,
                      background: feat.iconBg,
                      border: `1px solid ${feat.iconBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {feat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                      {feat.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.45, marginTop: 2 }}>
                      {feat.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
              <button
                onClick={() => handleAction('/projects/manage')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 11,
                  background: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = '#1e293b';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = '#0f172a';
                }}
              >
                <RocketOutlined style={{ fontSize: 13, color: '#38bdf8' }} />
                <span>Create Project</span>
                <ArrowRight size={13} color="#94a3b8" />
              </button>

              <button
                onClick={() => setTourOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '10px 18px',
                  borderRadius: 11,
                  background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(203, 213, 225, 0.8)',
                  color: '#0f172a',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = accent;
                  e.currentTarget.style.color = accent;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(203, 213, 225, 0.8)';
                  e.currentTarget.style.color = '#0f172a';
                }}
              >
                <Play size={12} fill="currentColor" color="currentColor" />
                <span>Interactive Tour</span>
              </button>
            </div>

            {/* Instant Workspace Connectors */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
              <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>
                Or connect:
              </span>

              <button
                onClick={() => handleAction('/integrations')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 7,
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  color: '#334155',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#0052CC';
                  e.currentTarget.style.color = '#0052CC';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                <JiraLogoSvg size={13} />
                <span>Jira Cloud</span>
              </button>

              <button
                onClick={() => handleAction('/integrations')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  borderRadius: 7,
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  color: '#334155',
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#5E6AD2';
                  e.currentTarget.style.color = '#5E6AD2';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(226, 232, 240, 0.9)';
                  e.currentTarget.style.color = '#334155';
                }}
              >
                <LinearLogoSvg size={13} />
                <span>Linear</span>
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Studio Showcase Mockup ── */}
          <div
            style={{
              flex: '1 1 540px',
              maxWidth: 660,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ProductPreviewMockup accent={accent} />
          </div>
        </div>

        {/* ══ CENTERED PLATFORM FOOTER ════════════════════════════════ */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            marginTop: 20,
            fontSize: 11,
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span>{isTestiezBrand ? '© Testiez by ZithTech' : '© Zukvo by ZithTech'}</span>
          <span>·</span>
          <span>Enterprise QA Platform</span>
          <span>·</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: '#059669', fontWeight: 600 }}>All Systems Operational</span>
          </span>
        </div>
      </div>

      {/* Feature Walkthrough Modal */}
      {tourOpen && <DemoTourModal onClose={() => setTourOpen(false)} accent={accent} />}
    </>
  );
}
