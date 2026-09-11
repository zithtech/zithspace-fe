'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import Image from 'next/image';
import {
  RocketOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  AppstoreOutlined,
  FolderOpenOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
  SearchOutlined,
  BellOutlined,
  PlayCircleOutlined,
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
} from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/context/ProductContext';
import ZukvoLoader from '@/components/common/ZukvoLoader';

import ZukvoLogoImg from '@/assets/logo/Zukvologo.png';
import TestiezMarkImg from '@/assets/logo/testiez/mark.png';
import TestiezWordmarkImg from '@/assets/logo/testiez/wordmark.png';

interface OnboardCard {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  gradient: string;
  route: string;
  isPrimary?: boolean;
}

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

function FloatingShape({ shape, x, y, size, color, delay, rotate = 0 }: {
  shape: 'circle' | 'square' | 'triangle' | 'hexagon';
  x: string; y: string; size: number; color: string; delay: number; rotate?: number;
}) {
  const base: React.CSSProperties = {
    position: 'absolute', left: x, top: y,
    animation: `shapeFloat 6s ease-in-out ${delay}s infinite alternate`,
    pointerEvents: 'none',
  };

  if (shape === 'circle') {
    return <div style={{ ...base, width: size, height: size, borderRadius: '50%', border: `1.5px solid ${color}`, opacity: 0.12 }} />;
  }
  if (shape === 'square') {
    return <div style={{ ...base, width: size, height: size, border: `1.5px solid ${color}`, borderRadius: 6, opacity: 0.12, transform: `rotate(${rotate}deg)`, animation: `shapeSpin 20s linear ${delay}s infinite` }} />;
  }
  if (shape === 'triangle') {
    return (
      <div style={{ ...base, width: 0, height: 0, borderLeft: `${size / 2}px solid transparent`, borderRight: `${size / 2}px solid transparent`, borderBottom: `${size}px solid ${color}`, opacity: 0.08 }} />
    );
  }
  return (
    <div style={{ ...base, width: size, height: size, background: color, opacity: 0.08, clipPath: 'polygon(25% 0%,75% 0%,100% 50%,75% 100%,25% 100%,0% 50%)' }} />
  );
}



function ProductPreviewMockup({ accent }: { accent: string }) {
  const modules = [
    { name: 'All Test Cases', count: 47, active: true },
    { name: 'Auth & Login', count: 12 },
    { name: 'Payment Gateway', count: 9 },
    { name: 'User Dashboard', count: 11 },
    { name: 'Checkout Flow', count: 8 },
    { name: 'Notifications', count: 7 },
  ];

  const testCases = [
    { id: 'TC-041', title: 'Verify OTP login with valid mobile number', status: 'Pass', assignee: 'Ravi K.', priority: 'High' },
    { id: 'TC-042', title: 'Validate payment webhook on gateway timeout', status: 'Fail', assignee: 'Priya M.', priority: 'Critical' },
    { id: 'TC-043', title: 'Check session expiry after 30min idle', status: 'Pending', assignee: 'Ananya S.', priority: 'Medium' },
    { id: 'TC-044', title: 'Assert cart total with applied coupon code', status: 'Pass', assignee: 'Karan D.', priority: 'High' },
  ];

  const statusStyle: Record<string, { color: string; bg: string }> = {
    Pass:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    Fail:    { color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    Pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  };

  const priorityColor: Record<string, string> = {
    Critical: '#ef4444',
    High:     '#f97316',
    Medium:   '#f59e0b',
  };

  return (
    <div style={{ width: '100%', maxWidth: 680, position: 'relative', height: 450 }}>

      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: -40, left: '8%', width: 260, height: 260, background: accent, filter: 'blur(120px)', opacity: 0.14, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 10, right: '6%', width: 180, height: 180, background: '#8b5cf6', filter: 'blur(100px)', opacity: 0.12, borderRadius: '50%', pointerEvents: 'none' }} />

      {/* ── Pass Rate badge — top-right ── */}
      <div style={{
        position: 'absolute', top: 0, right: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        width: 64, height: 64, borderRadius: 18,
        background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(240,253,244,0.95))',
        border: '1px solid rgba(16,185,129,0.2)',
        boxShadow: '0 8px 24px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,1)',
        backdropFilter: 'blur(12px)',
        gap: 2,
      }}>

        <span style={{ fontSize: 16, fontWeight: 900, color: '#10b981', letterSpacing: '-0.03em', lineHeight: 1, position: 'relative' }}>94%</span>
        <span style={{ fontSize: 7.5, color: 'rgba(16,185,129,0.8)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', position: 'relative' }}>Pass Rate</span>
      </div>

      {/* ── Main light card ── */}
      <div style={{
        position: 'absolute', top: 28, left: 0, right: 66,
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 20,
        boxShadow: '0 28px 80px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Top accent line */}
        <div style={{ height: 2, background: `linear-gradient(90deg, ${accent}, #8b5cf6, transparent)` }} />

        {/* ── Header ── */}
        <div style={{ padding: '13px 18px 11px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.4)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', flex: 1 }}>E-Commerce QA · Sprint 3</span>
          <span style={{ padding: '3px 9px', borderRadius: 20, background: `rgba(42,120,214,0.1)`, border: `1px solid rgba(42,120,214,0.2)`, color: accent, fontSize: 10, fontWeight: 700 }}>Agile</span>
          <span style={{ padding: '3px 9px', borderRadius: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 10, fontWeight: 700 }}>Active</span>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', height: 312 }}>

          {/* Sidebar — Modules */}
          <div style={{ width: 162, borderRight: '1px solid rgba(0,0,0,0.06)', background: '#f8fafc', padding: '14px 10px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 8 }}>Modules</div>

            {modules.map((mod, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                background: mod.active ? `rgba(42,120,214,0.08)` : 'transparent',
                borderLeft: mod.active ? `3px solid ${accent}` : '3px solid transparent',
                transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: 11, color: mod.active ? '#0f172a' : 'rgba(0,0,0,0.6)', fontWeight: mod.active ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 100 }}>{mod.name}</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: mod.active ? accent : 'rgba(0,0,0,0.4)', background: mod.active ? `rgba(42,120,214,0.15)` : 'rgba(0,0,0,0.04)', borderRadius: 8, padding: '1px 6px', flexShrink: 0 }}>{mod.count}</span>
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#ffffff' }}>

            {/* Search bar */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 9 }}>
                <SearchOutlined style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}/>
                <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.4)' }}>Search test cases...</span>
              </div>
            </div>

            {/* Sub-header */}
            <div style={{ padding: '8px 14px 7px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.5)' }}>47 test cases</span>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ l: 'Pass', c: '#10b981' }, { l: 'Fail', c: '#ef4444' }, { l: 'Pending', c: '#f59e0b' }].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.c }} />
                    <span style={{ fontSize: 9.5, color: 'rgba(0,0,0,0.5)', fontWeight: 500 }}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Test case rows */}
            <div style={{ flex: 1, overflowY: 'hidden' }}>
              {testCases.map((tc, i) => {
                const st = statusStyle[tc.status];
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                    {/* Status indicator */}
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: st.color, boxShadow: `0 0 6px ${st.color}66`, flexShrink: 0 }} />
                    {/* ID */}
                    <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: 600, minWidth: 42 }}>{tc.id}</span>
                    {/* Title */}
                    <span style={{ flex: 1, fontSize: 11.5, color: '#1e293b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tc.title}</span>
                    {/* Priority dot */}
                    <span style={{ fontSize: 9, fontWeight: 700, color: priorityColor[tc.priority] || '#000', opacity: 0.8, flexShrink: 0 }}>●</span>
                    {/* Status badge */}
                    <div style={{ padding: '2px 8px', borderRadius: 20, background: st.bg, fontSize: 9.5, color: st.color, fontWeight: 700, flexShrink: 0 }}>{tc.status}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating "Generate Test Cases" AI pill ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 4, zIndex: 10,
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: 14, padding: '10px 18px',
        boxShadow: '0 8px 32px rgba(139,92,246,0.15), 0 2px 8px rgba(0,0,0,0.05)',
        backdropFilter: 'blur(16px)',
        animation: 'shapeFloat 4s ease-in-out infinite alternate',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 0.5L8.3 5.2L13 7L8.3 8.8L7 13.5L5.7 8.8L1 7L5.7 5.2Z" fill="url(#tcAiGrad)"/>
          <defs>
            <linearGradient id="tcAiGrad" x1="0" y1="0" x2="14" y2="14" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8b5cf6"/>
              <stop offset="1" stopColor="#6d28d9"/>
            </linearGradient>
          </defs>
        </svg>
        <span style={{ fontSize: 12.5, fontWeight: 700, background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Generate Test Cases</span>
      </div>

    </div>
  );
}



// ── Demo Tour Modal ────────────────────────────────────────────────────────────



function TourStepVisual({ stepIndex, accent }: { stepIndex: number; accent: string }) {
  const visuals: React.ReactNode[] = [
    // 0 – Create Project
    <div key={0} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 12, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>New Project</div>
      {[{ label: 'Project Name', val: 'E-Commerce QA Sprint 3' }, { label: 'Framework', val: 'Agile / Scrum' }, { label: 'Team Size', val: '4 QA Engineers' }].map((f, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontWeight: 600 }}>{f.label}</div>
          <div style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{f.val}</div>
        </div>
      ))}
      <div style={{ marginTop: 4, padding: '10px 16px', borderRadius: 10, background: accent, color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center', cursor: 'pointer' }}>Create Project →</div>
    </div>,
    // 1 – Settings
    <div key={1} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Project Settings</div>
      {['Notifications', 'Member Permissions', 'Integrations', 'Workflow Rules'].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 8, padding: '10px 14px' }}>
          <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{item}</span>
          <div style={{ width: 32, height: 16, borderRadius: 8, background: i % 2 === 0 ? accent : 'rgba(0,0,0,0.1)', position: 'relative' }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, right: i % 2 === 0 ? 2 : 18 }} />
          </div>
        </div>
      ))}
    </div>,
    // 2 – Scope
    <div key={2} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Test Scope</div>
      <div style={{ display: 'flex', gap: 8 }}>
        {['Functional', 'Regression', 'API', 'UI'].map((tag, i) => (
          <div key={i} style={{ padding: '4px 10px', borderRadius: 20, background: i === 0 ? accent : 'rgba(0,0,0,0.05)', border: `1px solid ${i === 0 ? accent : 'rgba(0,0,0,0.08)'}`, fontSize: 11, color: i === 0 ? '#fff' : '#0f172a', fontWeight: 600 }}>{tag}</div>
        ))}
      </div>
      {['Login & Auth Module', 'Payment Gateway', 'User Profile', 'Checkout Flow'].map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.02)', borderRadius: 8, padding: '8px 12px' }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${i < 2 ? accent : 'rgba(0,0,0,0.2)'}`, background: i < 2 ? accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff' }}>{i < 2 ? '✓' : ''}</div>
          <span style={{ fontSize: 13, color: '#0f172a' }}>{item}</span>
        </div>
      ))}
    </div>,
    // 3 – Test Cases
    <div key={3} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Test Cases</div>
      {[
        { id: 'TC-001', title: 'Verify user login with valid credentials', status: 'Pass', statusColor: '#10b981' },
        { id: 'TC-002', title: 'Validate 2FA authentication flow', status: 'Fail', statusColor: '#ef4444' },
        { id: 'TC-003', title: 'Test password reset via email', status: 'Pass', statusColor: '#10b981' },
        { id: 'TC-004', title: 'Check session timeout behavior', status: 'Pending', statusColor: '#f59e0b' },
      ].map((tc, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: 700, minWidth: 48 }}>{tc.id}</span>
          <span style={{ flex: 1, fontSize: 11.5, color: '#0f172a' }}>{tc.title}</span>
          <div style={{ padding: '2px 8px', borderRadius: 20, background: `${tc.statusColor}20`, border: `1px solid ${tc.statusColor}50`, fontSize: 10, color: tc.statusColor, fontWeight: 700 }}>{tc.status}</div>
        </div>
      ))}
    </div>,
    // 4 – Test Suites
    <div key={4} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Test Suites</div>
      {[
        { name: 'Authentication Suite', count: 12, passed: 10, color: '#2a78d6' },
        { name: 'Payment Suite',        count: 8,  passed: 6,  color: '#8b5cf6' },
        { name: 'UI Regression Suite',  count: 24, passed: 22, color: '#10b981' },
      ].map((suite, i) => {
        const pct = Math.round((suite.passed / suite.count) * 100);
        return (
          <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
            {/* Left accent bar */}
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: suite.color, borderRadius: '14px 0 0 14px' }} />
            <div style={{ paddingLeft: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>{suite.name}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: suite.color }}>{pct}%</span>
              </div>
              {/* Progress track */}
              <div style={{ height: 6, borderRadius: 999, background: `${suite.color}18` }}>
                <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: `linear-gradient(90deg, ${suite.color}cc, ${suite.color})`, boxShadow: `0 0 8px ${suite.color}55`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ marginTop: 7, fontSize: 11, color: 'rgba(0,0,0,0.4)', fontWeight: 500 }}>{suite.passed} of {suite.count} cases passed</div>
            </div>
          </div>
        );
      })}
    </div>,
    // 5 – Test Runs
    <div key={5} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Test Runs</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { name: 'Sprint 3 - Full Regression', date: 'Today 09:00', status: 'Running', color: '#3b82f6', passed: 34, total: 47 },
          { name: 'Auth Module - Smoke Test',   date: 'Yesterday',   status: 'Passed',  color: '#10b981', passed: 12, total: 12 },
          { name: 'Checkout API - Integration', date: '2 days ago',  status: 'Failed',  color: '#ef4444', passed: 5,  total: 9  },
        ].map((run, i) => {
          const pct = Math.round((run.passed / run.total) * 100);
          return (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 14, padding: '12px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden' }}>
              {/* Left status bar */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: run.color, borderRadius: '14px 0 0 14px' }} />
              <div style={{ paddingLeft: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>{run.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{run.date}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                    <div style={{ padding: '3px 10px', borderRadius: 20, background: `${run.color}15`, border: `1px solid ${run.color}40`, fontSize: 11, color: run.color, fontWeight: 700 }}>{run.status}</div>
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', fontWeight: 700 }}>{run.passed}/{run.total}</span>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div style={{ height: 4, borderRadius: 999, background: `${run.color}15` }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: `linear-gradient(90deg, ${run.color}bb, ${run.color})`, boxShadow: `0 0 6px ${run.color}44` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>,
    // 6 – Bug List
    <div key={6} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Bug List</div>
      {[
        { id: 'BUG-42', title: 'Payment fails on mobile Safari', severity: 'Critical', color: '#ef4444' },
        { id: 'BUG-38', title: 'Cart total rounds incorrectly', severity: 'High', color: '#f97316' },
        { id: 'BUG-31', title: 'Profile image not loading on slow networks', severity: 'Medium', color: '#f59e0b' },
        { id: 'BUG-27', title: 'Tooltip overflow on small screens', severity: 'Low', color: '#6b7280' },
      ].map((bug, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 8, padding: '8px 12px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)', minWidth: 50 }}>{bug.id}</span>
          <span style={{ flex: 1, fontSize: 12, color: '#0f172a' }}>{bug.title}</span>
          <div style={{ padding: '2px 8px', borderRadius: 20, background: `${bug.color}20`, border: `1px solid ${bug.color}50`, fontSize: 10, color: bug.color, fontWeight: 700 }}>{bug.severity}</div>
        </div>
      ))}
    </div>,
    // 7 – Tickets
    <div key={7} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Tickets</div>
      {[
        { id: 'TKT-14', title: 'Payment fails on mobile Safari', assignee: 'Dev: Karan D.', due: 'Due Today', status: 'In Progress', color: '#f97316' },
        { id: 'TKT-11', title: 'Cart total rounding issue on coupon apply', assignee: 'Dev: Ravi K.', due: 'Due Tomorrow', status: 'Open', color: '#3b82f6' },
        { id: 'TKT-09', title: 'Profile image fails on slow network', assignee: 'Dev: Ananya S.', due: 'Due in 3d', status: 'Resolved', color: '#10b981' },
      ].map((ticket, i) => (
        <div key={i} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.35)' }}>{ticket.id}</span>
            <div style={{ padding: '2px 8px', borderRadius: 20, background: `${ticket.color}18`, border: `1px solid ${ticket.color}40`, fontSize: 10, color: ticket.color, fontWeight: 700 }}>{ticket.status}</div>
          </div>
          <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 600, marginBottom: 4 }}>{ticket.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.45)' }}>{ticket.assignee}</span>
            <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>{ticket.due}</span>
          </div>
        </div>
      ))}
    </div>,
    // 8 – QA Submissions
    <div key={8} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>QA Submissions</div>
      {[
        { name: 'Ananya M.', module: 'Auth Module', time: '10m ago', status: 'Submitted', color: '#3b82f6' },
        { name: 'Ravi K.', module: 'Payment Flow', time: '1h ago', status: 'Under Review', color: '#f59e0b' },
        { name: 'Priya S.', module: 'UI Regression', time: '2h ago', status: 'Approved', color: '#10b981' },
      ].map((sub, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${accent}22`, border: `1px solid ${accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: accent, flexShrink: 0 }}>
            {sub.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{sub.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)' }}>{sub.module} · {sub.time}</div>
          </div>
          <div style={{ padding: '3px 10px', borderRadius: 20, background: `${sub.color}20`, fontSize: 11, color: sub.color, fontWeight: 700 }}>{sub.status}</div>
        </div>
      ))}
    </div>,
    // 9 – Approvals
    <div key={9} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Approvals</div>
      {[
        { title: 'Sprint 3 QA Sign-off', requestedBy: 'Ananya M.', status: 'Pending Your Approval' },
        { title: 'Auth Module Release', requestedBy: 'Ravi K.', status: 'Approved by Lead' },
      ].map((apr, i) => (
        <div key={i} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, marginBottom: 4 }}>{apr.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 12 }}>Requested by {apr.requestedBy}</div>
          {i === 0 ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, padding: '7px', borderRadius: 8, background: '#10b98120', border: '1px solid #10b98150', color: '#10b981', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>✓ Approve</div>
              <div style={{ flex: 1, padding: '7px', borderRadius: 8, background: '#ef444420', border: '1px solid #ef444450', color: '#ef4444', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>✗ Reject</div>
            </div>
          ) : (
            <div style={{ padding: '4px 12px', borderRadius: 20, background: '#10b98120', border: '1px solid #10b98150', color: '#10b981', fontSize: 11, fontWeight: 700, display: 'inline-block' }}>✓ {apr.status}</div>
          )}
        </div>
      ))}
    </div>,
    // 10 – Analytics
    <div key={10} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Analytics</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          { label: 'Tests Run', value: '1,248', color: accent },
          { label: 'Pass Rate', value: '94.2%', color: '#10b981' },
          { label: 'Bugs Found', value: '87', color: '#ef4444' },
          { label: 'Avg. Cycle', value: '2.3d', color: '#f59e0b' },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', fontWeight: 600, marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: kpi.color, letterSpacing: '-0.02em' }}>{kpi.value}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 10, fontWeight: 600 }}>Weekly Pass Rate</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 56 }}>
          {[78, 82, 75, 90, 88, 94, 92].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, background: i === 5 ? accent : 'rgba(0,0,0,0.1)', borderRadius: '3px 3px 0 0' }} />
          ))}
        </div>
      </div>
    </div>,
    // 11 – Coverage Map
    <div key={11} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(0,0,0,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Coverage Map</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { module: 'Auth & Login', coverage: 92, cases: 12 },
          { module: 'Payment Gateway', coverage: 78, cases: 9 },
          { module: 'User Dashboard', coverage: 55, cases: 11 },
          { module: 'Checkout Flow', coverage: 88, cases: 8 },
          { module: 'Notifications', coverage: 30, cases: 7 },
          { module: 'API Endpoints', coverage: 0, cases: 0 },
        ].map((m, i) => {
          const coverageColor = m.coverage >= 80 ? '#10b981' : m.coverage >= 50 ? '#f59e0b' : '#ef4444';
          return (
            <div key={i} style={{ background: 'rgba(0,0,0,0.02)', border: `1px solid ${coverageColor}30`, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{m.module}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: coverageColor }}>{m.coverage > 0 ? `${m.coverage}%` : '—'}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.07)' }}>
                <div style={{ height: '100%', width: `${m.coverage}%`, borderRadius: 3, background: coverageColor, transition: 'width 0.4s ease' }} />
              </div>
              <div style={{ marginTop: 5, fontSize: 10, color: 'rgba(0,0,0,0.35)' }}>{m.cases > 0 ? `${m.cases} test cases` : 'No cases yet'}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 2 }}>
        {[{ label: 'High ≥80%', color: '#10b981' }, { label: 'Medium ≥50%', color: '#f59e0b' }, { label: 'Low <50%', color: '#ef4444' }].map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
            <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', fontWeight: 600 }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>,
  ];
  return <>{visuals[stepIndex]}</>;
}

function FAQAccordion({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div style={{ padding: '32px 40px 40px', borderTop: '1px solid rgba(0,0,0,0.06)', background: 'rgba(0,0,0,0.02)' }}>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 24, textAlign: 'center' }}>Frequently Asked Questions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 680, margin: '0 auto' }}>
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, background: 'rgba(0,0,0,0.02)', overflow: 'hidden', transition: 'all 0.3s' }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'transparent', border: 'none', color: '#0f172a', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
              >
                {faq.q}
                <RightOutlined style={{ fontSize: 12, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: 'rgba(0,0,0,0.4)' }} />
              </button>
              <div style={{ maxHeight: isOpen ? 200 : 0, opacity: isOpen ? 1 : 0, transition: 'all 0.3s ease-in-out', padding: isOpen ? '0 20px 16px' : '0 20px', color: 'rgba(0,0,0,0.6)', fontSize: 14, lineHeight: 1.6 }}>
                {faq.a}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DemoTourModal({ onClose, accent }: { onClose: () => void; accent: string }) {
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState<'left' | 'right'>('right');
  const [animKey, setAnimKey] = useState(0);

  const steps: Omit<TourStep, 'visual'>[] = [
    { id: 1, title: 'Create Project', subtitle: 'Start your QA journey', description: 'Set up a dedicated QA project in seconds. Give it a name, choose your methodology, and invite your team. All your modules, test cases, and runs will live inside this project.', icon: <RocketOutlined />, gradient: 'linear-gradient(135deg, #2a78d6, #1a5cbf)', accentColor: '#2a78d6', highlights: ['Custom project templates', 'Agile & Waterfall support', 'Team role assignment'], faqs: [{ q: 'Can I create multiple projects for different products?', a: 'Yes. Testiez supports unlimited projects, so you can have separate projects for each product, client, or sprint cycle. Each project is fully isolated with its own modules, test cases, runs, and team members — nothing bleeds across projects.' }, { q: 'What happens to my data if I archive a project?', a: 'Archiving a project hides it from your active workspace but preserves all data permanently. Test cases, runs, submissions, and bug reports are all retained and can be accessed or restored at any time from the Archived Projects section in your account settings.' }] },
    { id: 2, title: 'Settings', subtitle: 'Configure your workspace', description: "Control every aspect of your project — from member roles and notification preferences to workflow rules and third-party integrations. Settings ensure your team works within a consistent, well-governed process.", icon: <SettingOutlined />, gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', accentColor: '#8b5cf6', highlights: ['Granular role & permission control', 'Slack & Jira integrations', 'Custom workflow status rules'], faqs: [{ q: 'What roles are available and what can each role do?', a: 'Testiez has four roles: Owner (full access), Manager (manage members and approve submissions), QA Engineer (create and execute test cases), and Viewer (read-only access for developers or stakeholders). You can change a member role at any time from the Team Settings tab without losing any of their historical data.' }, { q: 'Can I control which events trigger Slack or email notifications?', a: 'Yes. In the Notifications section of Settings, you can precisely choose which events send alerts — such as bug logged, submission created, approval granted, or run completed — and configure whether they go to email, Slack, or both. Each team member can also personalise their own notification preferences independently.' }] },
    { id: 3, title: 'Scope', subtitle: 'Define what gets tested', description: 'Before writing a single test case, define the boundaries of your testing. The Scope module lets you list the modules and features active in this sprint, ensuring nothing is accidentally missed or over-tested.', icon: <DeploymentUnitOutlined />, gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)', accentColor: '#0ea5e9', highlights: ['Sprint-specific scope definition', 'Clone scope from previous sprints', 'Coverage gap highlighting'], faqs: [{ q: 'How is Scope different from just organising modules?', a: 'Modules are permanent structural containers for your test cases. Scope is sprint-specific — it defines which of those modules are actively being tested in the current cycle. This means you reuse the same module structure across sprints while scoping only what is relevant each time, keeping your reporting clean and accurate.' }, { q: 'Can I reuse the scope definition from a previous sprint?', a: 'Yes. When creating a new scope, you can clone it directly from any past sprint within the same project. This saves significant setup time and ensures consistency, especially for regression cycles where the scope changes minimally between sprints. Cloned scopes can then be adjusted before finalising.' }] },
    { id: 4, title: 'Test Cases', subtitle: 'Write, group, and reuse test cases', description: 'Create step-by-step test cases with preconditions, numbered steps, expected results, and priority levels. Group related cases together within a module for better organisation, and tag them for fast filtering during execution.', icon: <FileTextOutlined />, gradient: 'linear-gradient(135deg, #10b981, #059669)', accentColor: '#10b981', highlights: ['Group related cases within modules', 'Step-by-step editor with expected results', 'Priority, severity & tag filtering'], faqs: [{ q: 'Can I import existing test cases from Excel or another tool?', a: 'Yes. Testiez supports bulk import via CSV. Download the import template, fill in your test case details (title, preconditions, steps, expected results, priority), and upload it directly. For teams migrating from Jira Zephyr or TestRail, we support structured imports from those formats as well.' }, { q: 'How does grouping test cases work, and when should I use it?', a: 'Within any module, you can create named groups to cluster related test cases together \u2014 for example, grouping all login-related cases under an \u201cAuthentication\u201d group inside your Auth Module. This is especially useful when a module is large and covers multiple distinct flows. Groups help QA engineers navigate quickly during execution and make reports easier to read by breaking results down at the group level.' }] },
    { id: 5, title: 'Test Suites', subtitle: 'Group test cases for efficient execution', description: 'Organise related test cases into suites — smoke tests, regression packs, or feature-specific groups. Suites let you launch targeted runs without selecting cases one by one every time.', icon: <ExperimentOutlined />, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', accentColor: '#f59e0b', highlights: ['Drag-and-drop case organisation', 'Suite-level pass rate tracking', 'Reusable across multiple sprints'], faqs: [{ q: 'Can the same test case appear in more than one suite?', a: 'Yes. Test cases are linked, not duplicated. A single test case can belong to multiple suites — for example, a login test case might be in both a Smoke Test suite and a Full Regression suite. Any update to the test case reflects across all suites it belongs to automatically.' }, { q: 'Can I build a re-test suite from the failures of the last run?', a: 'Yes. After a test run is complete, filter the results by Failed status and add those cases directly to a new or existing suite. This makes it easy to run a targeted re-test after a bug fix without re-executing your full test pack, saving significant time in fast-paced sprint cycles.' }] },
    { id: 6, title: 'Test Runs', subtitle: 'Execute and track tests in real time', description: 'Launch a test run from any suite. Assign cases to specific engineers, track execution progress live on the dashboard, and record pass/fail results with notes and screenshots directly inside the run.', icon: <PlayCircleOutlined />, gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)', accentColor: '#3b82f6', highlights: ['Live execution progress dashboard', 'Per-case tester assignment', 'Step-level result logging with evidence'], faqs: [{ q: 'Can multiple engineers work on the same test run at the same time?', a: 'Yes. Test runs support concurrent execution. Different cases within the same run can be assigned to different engineers, and each person works their assigned cases independently. The run dashboard updates in real time as results come in, giving the QA lead a live view of overall progress without any page refresh.' }, { q: 'When a step is marked failed, does it automatically create a bug?', a: 'When you mark a step as failed, Testiez immediately prompts you to log a bug from that step. The bug report is pre-populated with the test case ID, the failing step description, and any screenshots you attach — so you never have to manually recreate the context. Every bug is fully traceable back to the exact run and step that triggered it.' }] },
    { id: 7, title: 'Bug List', subtitle: 'Capture and manage every defect', description: 'Every bug logged during a test run lands in the Bug List automatically. Review severity, assign it to the responsible developer, link it back to the failing test case, and track its resolution status through to closure.', icon: <BugOutlined />, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', accentColor: '#ef4444', highlights: ['Auto-populated from failed test steps', 'Severity, priority & assignee fields', 'Two-way Jira & Linear sync'], faqs: [{ q: 'Does the Bug List sync automatically with Jira or Linear?', a: 'Yes. If you connect your Jira or Linear workspace in Settings, every bug created in Testiez is automatically pushed as an issue to your connected board. Status updates made in Jira (e.g. marking it as Done) also sync back to Testiez, keeping both tools in perfect alignment without any manual effort from your team.' }, { q: 'Can I filter the Bug List by severity, module, or sprint?', a: 'Yes. The Bug List supports multi-dimensional filtering. You can filter by severity (Critical, High, Medium, Low), the module the bug belongs to, the tester who logged it, the sprint it was found in, and the current resolution status. You can also save frequently used filter combinations as named views for one-click access in future sprints.' }] },
    { id: 8, title: 'Tickets', subtitle: 'Turn bugs into trackable action items', description: 'A ticket is the actionable follow-up to a bug. Convert a logged bug into a ticket, assign it to a developer, set a due date, and track its progress from Open to In Progress to Resolved — all within Testiez.', icon: <TagsOutlined />, gradient: 'linear-gradient(135deg, #f97316, #ea580c)', accentColor: '#f97316', highlights: ['One-click bug-to-ticket conversion', 'Assignee, due date & priority fields', 'Full resolution lifecycle tracking'], faqs: [{ q: 'What is the difference between a Bug and a Ticket in Testiez?', a: 'A Bug is the defect record — it captures what went wrong, which test case it came from, its severity, and the evidence. A Ticket is the fix task derived from that bug, carrying ownership (assigned developer), a due date, and resolution status. Separating them lets QA track what was found while developers track what needs to be fixed, without conflating the two workflows.' }, { q: 'Can a ticket be traced all the way back to the original test case that failed?', a: 'Yes. Every ticket maintains a full traceability chain: Test Case → Test Run → Bug → Ticket. You can click through from any ticket to see exactly which test step triggered the bug, which run it occurred in, and when it was first detected. This chain is especially useful for release sign-off audits and root cause analysis after production incidents.' }] },
    { id: 9, title: 'QA Submissions', subtitle: 'Formally submit your QA sign-off', description: 'When testing is complete, engineers submit a structured QA report summarising what was tested, the pass/fail breakdown, outstanding bugs, and any risk notes. This formal submission triggers the approval workflow for the team lead.', icon: <AuditOutlined />, gradient: 'linear-gradient(135deg, #ec4899, #be185d)', accentColor: '#ec4899', highlights: ['Structured test summary with pass rate', 'Open bug count & risk notes', 'Evidence uploads & screenshot attachments'], faqs: [{ q: 'Can a QA engineer submit even if some test cases are still pending?', a: 'Yes, but the submission will clearly flag the number of untested cases as a risk item. The team lead will see an explicit warning in the approval view highlighting what was not tested and why. This is intentional — it allows teams to make an informed release decision with known gaps rather than blocking the entire process when minor cases remain pending.' }, { q: 'Can I include screenshots or recorded evidence in the submission?', a: 'Yes. Submissions have a dedicated Evidence section where engineers can attach screenshots, screen recordings, exported test reports, or any supporting documentation. This is particularly important for compliance-driven teams that require documented proof of testing before each production release or client delivery.' }] },
    { id: 10, title: 'Approvals', subtitle: 'Enforce quality gates before every release', description: 'Team leads review each QA submission and either approve it, request changes, or reject it with written feedback. An approval is the final quality gate — every decision is permanently logged with a timestamp and reason.', icon: <SafetyCertificateOutlined />, gradient: 'linear-gradient(135deg, #10b981, #047857)', accentColor: '#10b981', highlights: ['Approve, reject or request changes', 'Written feedback on rejections', 'Timestamped approval audit trail'], faqs: [{ q: 'Can a team lead request changes without outright rejecting a submission?', a: 'Yes. Instead of rejecting, the team lead can click Request Changes and leave specific written feedback — such as asking for additional test cases to be executed or for a critical bug to be resolved first. The QA engineer is notified, can act on the feedback, and re-submit. This loop continues until the lead is satisfied and grants final approval.' }, { q: 'Is there a permanent audit log of all approval decisions?', a: 'Yes. Every approval action — approved, changes requested, or rejected — is permanently recorded with the reviewer name, their written reason, and an exact timestamp. This audit trail is visible to all project members and can be exported as part of a compliance package, release documentation, or client handover report.' }] },
    { id: 11, title: 'Analytics', subtitle: 'Measure and improve QA performance', description: 'Track pass rates, defect trends, test cycle times, and individual tester performance across sprints. Analytics gives QA leads the data they need to identify bottlenecks, improve processes, and report to stakeholders confidently.', icon: <TrophyOutlined />, gradient: 'linear-gradient(135deg, #f59e0b, #b45309)', accentColor: '#f59e0b', highlights: ['Sprint-over-sprint pass rate trends', 'Bug severity & module breakdown', 'Tester performance & velocity metrics'], faqs: [{ q: 'Can I compare analytics across multiple sprints or filter by module?', a: 'Yes. The Analytics dashboard lets you select a custom date range or compare specific sprint cycles side by side. You can filter by project, module, or individual tester to drill into exactly where defect rates are climbing or where test velocity is slower than expected. This makes it straightforward to spot recurring problem areas before they escalate.' }, { q: 'Can I export reports to share with stakeholders who do not use Testiez?', a: 'Yes. Any analytics view — pass rate charts, bug trend graphs, tester performance tables — can be exported as a PDF report or CSV dataset. You can also schedule automated weekly or monthly email digests to go directly to stakeholders outside your QA team, ensuring leadership always has full visibility without needing to log in to the platform.' }] },
    { id: 12, title: 'Coverage Map', subtitle: 'See every gap in your test coverage', description: 'The Coverage Map gives you a visual overview of which modules and features are well-tested, partially covered, or have no test cases at all. Use it to prioritise where to write tests next and eliminate blind spots before release.', icon: <RadarChartOutlined />, gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)', accentColor: '#6366f1', highlights: ['Module-level coverage heatmap', 'Zero-coverage area detection', 'Coverage trend across sprint cycles'], faqs: [{ q: 'How does Testiez calculate coverage for each module?', a: 'Coverage is calculated based on the ratio of test cases assigned to a module against the total features defined in the project scope. If a module has 10 features scoped but only 4 test cases written against it, its coverage shows as 40%. As you write more test cases and link them to scope items, the coverage percentage updates in real time automatically.' }, { q: 'How should I use the Coverage Map before a major release?', a: 'The Coverage Map is most powerful pre-release. Filter it to your current sprint scope and immediately see which modules are under-tested or entirely uncovered. Most teams review this during sprint planning to decide where new test cases are needed, and again during release sign-off to confirm no critical module was left uncovered before shipping to production.' }] },
  ];

  const currentStep = steps[step];
  const total = steps.length;

  const goNext = () => {
    if (step < total - 1) {
      setAnimDir('right');
      setAnimKey(k => k + 1);
      setStep(s => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setAnimDir('left');
      setAnimKey(k => k + 1);
      setStep(s => s - 1);
    }
  };

  return (
    <>
      <style>{`
        @keyframes tourSlideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes tourSlideInLeft  { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes tourFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes tourBackdropIn { from { opacity:0; } to { opacity:1; } }
        .tour-step-anim-right { animation: tourSlideInRight 0.42s cubic-bezier(0.34,1.2,0.64,1) both; }
        .tour-step-anim-left  { animation: tourSlideInLeft  0.42s cubic-bezier(0.34,1.2,0.64,1) both; }
        .tour-modal-in        { animation: tourFadeIn 0.3s ease both; }
        .tour-nav-btn:hover   { opacity:0.85; transform:scale(1.04); }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(10px)',
          animation: 'tourBackdropIn 0.3s ease both',
        }}
      />

      {/* Modal */}
      <div
        className="tour-modal-in"
        style={{
          position: 'fixed', inset: 0, zIndex: 1001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          pointerEvents: 'none',
        }}
      >
        <div 
          className="hide-scrollbar"
          style={{
          width: '100%', maxWidth: 980, minHeight: 560, maxHeight: '90vh',
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 28,
          boxShadow: `0 32px 80px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.04)`,
          overflowY: 'auto', overflowX: 'hidden',
          display: 'flex', flexDirection: 'column',
          pointerEvents: 'all',
          position: 'relative',
        }}>
          {/* Top gradient accent bar */}
          <div style={{ height: 3, background: currentStep.gradient, transition: 'background 0.4s ease' }} />

          {/* Glow behind icon */}
          <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, background: currentStep.accentColor, filter: 'blur(140px)', opacity: 0.08, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.5s ease' }} />

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px 0', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ThunderboltOutlined style={{ color: currentStep.accentColor, fontSize: 16, transition: 'color 0.4s' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Testiez Feature Tour</span>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(0,0,0,0.5)', cursor: 'pointer', fontSize: 14, transition: 'all 0.2s ease' }}
            >
              <CloseOutlined />
            </button>
          </div>

          {/* Step indicator dots */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '16px 28px 0', position: 'relative', zIndex: 2 }}>
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAnimDir(i > step ? 'right' : 'left'); setAnimKey(k => k + 1); setStep(i); }}
                style={{
                  width: i === step ? 24 : 7, height: 7, borderRadius: 4, border: 'none',
                  background: i === step ? currentStep.accentColor : 'rgba(0,0,0,0.1)',
                  cursor: 'pointer', transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {/* Body */}
          <div className={`tour-step-anim-${animDir}`} key={animKey} style={{ flex: 1, display: 'flex', gap: 0, padding: '28px 28px 24px', position: 'relative', zIndex: 2 }}>

            {/* Left: text */}
            <div style={{ flex: '0 0 46%', display: 'flex', flexDirection: 'column', paddingRight: 32, borderRight: '1px solid rgba(0,0,0,0.06)' }}>
              {/* Step number + icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: currentStep.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#fff', boxShadow: `0 8px 24px ${currentStep.accentColor}55`, transition: 'background 0.4s ease' }}>
                  {currentStep.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 1 }}>Step {currentStep.id} of {total}</div>
                  <div style={{ fontSize: 12, color: currentStep.accentColor, fontWeight: 600, transition: 'color 0.4s' }}>{currentStep.subtitle}</div>
                </div>
              </div>

              <h2 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {currentStep.title}
              </h2>
              <p style={{ margin: '0 0 24px', fontSize: 14.5, color: 'rgba(0,0,0,0.6)', lineHeight: 1.7 }}>
                {currentStep.description}
              </p>

              {/* Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 'auto' }}>
                {currentStep.highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: `${currentStep.accentColor}22`, border: `1px solid ${currentStep.accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: currentStep.accentColor, flexShrink: 0, transition: 'all 0.4s' }}>✓</div>
                    <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.7)', fontWeight: 500 }}>{h}</span>
                  </div>
                ))}
              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                {step > 0 && (
                  <button
                    className="tour-nav-btn"
                    onClick={goBack}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    <LeftOutlined style={{ fontSize: 11 }} /> Back
                  </button>
                )}
                <button
                  className="tour-nav-btn"
                  onClick={step < total - 1 ? goNext : onClose}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 24px', borderRadius: 12, border: 'none',
                    background: currentStep.gradient,
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 8px 20px ${currentStep.accentColor}44`,
                    transition: 'all 0.3s cubic-bezier(0.34,1.2,0.64,1)',
                  }}
                >
                  {step < total - 1 ? (<>Next <RightOutlined style={{ fontSize: 12 }} /></>) : (<><TrophyOutlined style={{ fontSize: 14 }} /> Finish Tour</>)}
                </button>
              </div>
            </div>

            {/* Right: visual preview */}
            <div style={{ flex: 1, paddingLeft: 32, display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, background: '#f8fafc', border: '1px solid rgba(0,0,0,0.05)', borderRadius: 16, padding: '20px 18px', overflow: 'hidden', position: 'relative' }}>
                {/* Subtle glow inside preview */}
                <div style={{ position: 'absolute', bottom: -30, right: -30, width: 200, height: 200, background: currentStep.accentColor, filter: 'blur(80px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.5s' }} />
                <TourStepVisual stepIndex={step} accent={currentStep.accentColor} />
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className={`tour-step-anim-${animDir}`} key={`faq-${animKey}`}>
            <FAQAccordion faqs={currentStep.faqs || []} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function WelcomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { manifest, brand, isTestiez } = useProduct();
  const [actionLoading, setActionLoading] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  if (isLoading) return <ZukvoLoader message="Loading..." />;
  if (user && user.onboardingCompleted) {
    router.replace(manifest.homeRoute);
    return null;
  }

  const handleAction = async (destination: string) => {
    try {
      setActionLoading(true);
      router.push(destination);
    } catch (err: any) {
      message.error(err?.message || 'Something went wrong.');
      setActionLoading(false);
    }
  };

  const accent = brand.accent;
  const isTestiezBrand = isTestiez;

  const bgGrad = isTestiezBrand
    ? 'linear-gradient(135deg,#ffffff 0%,#f1f5f9 50%,#e2e8f0 100%)'
    : 'linear-gradient(135deg,#ffffff 0%,#f8fafc 50%,#f1f5f9 100%)';
  const primaryGrad = isTestiezBrand
    ? 'linear-gradient(135deg,#2a78d6 0%,#1a5cbf 100%)'
    : 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)';
  const secondaryGrad = isTestiezBrand
    ? 'linear-gradient(135deg,#0ea5e9 0%,#2a78d6 100%)'
    : 'linear-gradient(135deg,#3b82f6 0%,#6366f1 100%)';
  const accentAlt = isTestiezBrand ? '#0ea5e9' : '#8b5cf6';



  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes shapeFloat { 0% { transform: translateY(0); } 100% { transform: translateY(-22px); } }
        @keyframes shapeSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes gridPan { 0% { background-position:0 0; } 100% { background-position:40px 40px; } }
        @keyframes scanline { 0% { top:-30%; } 100% { top:120%; } }
        .welcome-wrap { font-family:'Inter',system-ui,sans-serif; -webkit-font-smoothing:antialiased; }
      `}</style>

      <div className="welcome-wrap" style={{ minHeight: '100vh', width: '100vw', background: bgGrad, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>




        {/* Main layout */}
        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 1280, padding: '40px 0 40px 20px', display: 'flex', alignItems: 'center', gap: 60, animation: 'fadeIn 0.7s ease both', flexWrap: 'wrap' }}>

          {/* ══ LEFT ══════════════════════════════════════ */}
          <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', animation: 'fadeSlideUp 0.65s ease both', position: 'relative', zIndex: 3 }}>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
              <Image
                src={isTestiezBrand ? TestiezMarkImg : ZukvoLogoImg}
                alt={isTestiezBrand ? 'Testiez' : 'Zukvo'}
                width={72} height={72}
                style={{ objectFit: 'contain', filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.7)) contrast(1.05) saturate(1.1)' }}
              />
              {isTestiezBrand ? (
                <Image
                  src={TestiezWordmarkImg}
                  alt="Testiez"
                  height={42} width={160}
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 1px 6px rgba(0,0,0,0.6)) contrast(1.08) saturate(1.1)' }}
                />
              ) : (
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.04em', background: primaryGrad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Zukvo</div>
              )}
            </div>

            <h1 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 800, color: '#0f172a', textAlign: 'left', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 16px' }}>
              Welcome to {isTestiezBrand ? 'Testiez' : 'Zukvo'}
            </h1>

            <p style={{ fontSize: 16, color: 'rgba(0,0,0,0.6)', textAlign: 'left', lineHeight: 1.6, margin: '0 0 24px', maxWidth: 460 }}>
              {isTestiezBrand
                ? 'Your QA workspace is ready. Set up a project from scratch, or bring your existing work over from Jira or Linear to get started instantly.'
                : 'Your workspace is ready. Create a project from scratch or import your existing work.'}
            </p>

            {/* 3 Detailed Points */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
              {[
                'Centralized Test Management with AI-powered test generation',
                'End-to-end Bug Tracking and real-time execution analytics',
                'Seamless integration with your Jira & Linear workspaces'
              ].map((point, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, animation: 'fadeSlideUp 0.65s ease both', animationDelay: `${0.1 + i * 0.1}s` }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(82,184,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircleOutlined style={{ color: '#52b88a', fontSize: 12 }} />
                  </div>
                  <span style={{ fontSize: 16, color: 'rgba(0,0,0,0.85)', fontWeight: 500 }}>{point}</span>
                </div>
              ))}
            </div>

            {/* 4 Small Buttons in a single row */}
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 10, alignItems: 'center', animation: 'fadeSlideUp 0.65s ease both', animationDelay: '0.6s' }}>
              <button
                onClick={() => handleAction('/projects/manage')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  background: accent, border: 'none',
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: `0 4px 14px ${accent}40`,
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${accent}60`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${accent}40`; }}
              >
                <RocketOutlined /> Create Project
              </button>

              <button
                onClick={() => handleAction('/integrations')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)',
                  color: '#0f172a', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <LinkOutlined /> Jira
              </button>

              <button
                onClick={() => handleAction('/integrations')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)',
                  color: '#0f172a', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <AppstoreOutlined /> Linear
              </button>

              <button
                onClick={() => setTourOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.1)',
                  color: '#0f172a', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; e.currentTarget.style.borderColor = accent; e.currentTarget.style.color = accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <PlayCircleOutlined /> Demo Tour
              </button>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 32, color: 'rgba(0,0,0,0.4)', fontSize: 12, letterSpacing: '0.03em' }}>
              {isTestiezBrand ? '© Testiez by ZithTech' : '© Zukvo by ZithTech'}
            </div>
          </div>

          {/* ══ RIGHT — Product Preview ════════════════════ */}
          <div style={{ flex: '1 1 600px', display: 'flex', justifyContent: 'flex-end', animation: 'fadeSlideUp 0.8s ease both', animationDelay: '0.3s' }}>
            <ProductPreviewMockup accent={accent} />
          </div>
        </div>
      </div>

      {/* Demo Tour Modal */}
      {tourOpen && <DemoTourModal onClose={() => setTourOpen(false)} accent={accent} />}
    </>
  );
}
