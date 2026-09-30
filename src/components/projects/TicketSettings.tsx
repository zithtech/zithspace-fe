'use client';

import React, { useState } from 'react';
import { Button, Typography, Grid } from 'antd';
import {
  DeploymentUnitOutlined,
  CodeOutlined,
  ThunderboltOutlined,
  BlockOutlined,
  AppstoreOutlined,
  ControlOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Menu, RotateCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { globalDataKeys } from '@/hooks/useGlobalData';
import DropdownManager from './DropdownManager';
import { QA_SUBMISSION_STYLES } from '@/app/qa-workspace/qa-submissions/shared';

const { useBreakpoint } = Grid;

/** The six ticket-config sections, mirrored from DropdownManager.dropdownTypes */
const NAV_SECTIONS = [
  { key: 'platform',  label: 'Platforms',   icon: <DeploymentUnitOutlined />, description: 'Core team platforms and delivery departments',       color: '#1677ff' },
  { key: 'stack',     label: 'Stacks',       icon: <CodeOutlined />,           description: 'Available technology stacks for project tagging',   color: '#52c41a' },
  { key: 'priority',  label: 'Priorities',   icon: <ThunderboltOutlined />,    description: 'Urgency levels and visual indicators',              color: '#faad14' },
  { key: 'taskLevel', label: 'Complexity',   icon: <BlockOutlined />,          description: 'Difficulty and story point weighting',              color: '#13c2c2' },
  { key: 'taskType',  label: 'Work Types',   icon: <AppstoreOutlined />,       description: 'Classifications for development activities',        color: '#722ed1' },
  { key: 'status',    label: 'Lifecycles',   icon: <ControlOutlined />,        description: 'Global status mapping for ticket workflows',        color: '#eb2f96' },
] as const;

type NavKey = typeof NAV_SECTIONS[number]['key'];

export default function TicketSettings() {
  const [activeKey, setActiveKey] = useState<NavKey>('platform');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const queryClient = useQueryClient();

  const activeSection = NAV_SECTIONS.find(s => s.key === activeKey)!;

  const handleNavClick = (key: NavKey) => {
    setActiveKey(key);
    setMobileSidebarOpen(false);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: globalDataKeys.ticketConfig });
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: QA_SUBMISSION_STYLES + TS_EXTRA_STYLES }} />

      {/* ── Shell ───────────────────────────────────────────────────────── */}
      <div className="dh-shell ts-shell">
        {/* Mobile backdrop */}
        <div
          className={`dh-sidebar-backdrop ${mobileSidebarOpen ? 'is-open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />

        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className={`dh-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo" style={{ background: 'var(--bg-purple-50)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,.18)' }}>
                <SettingOutlined style={{ fontSize: 14 }} />
              </div>
              <div>
                <h1 className="pp-side-title">Settings</h1>
                <p className="pp-side-subtitle">Ticket Configuration</p>
              </div>
            </div>
          </div>

          <div className="dh-sidebar-scroll">
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="pp-nav-caption">Configuration</span>
              {NAV_SECTIONS.map(s => (
                <button
                  key={s.key}
                  className={`pp-nav-item ${activeKey === s.key ? 'is-active' : ''}`}
                  onClick={() => handleNavClick(s.key)}
                >
                  <span className="pp-nav-icon" style={{ fontSize: 14 }}>{s.icon}</span>
                  <span className="pp-nav-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Main ────────────────────────────────────────────────────── */}
        <main className="dh-main">
          {/* Top bar */}
          <div className="dh-main-topbar sc-topbar">
            <div className="sc-topbar__title">
              <Button
                className="dh-mobile-menu-btn"
                type="text"
                icon={<Menu size={18} />}
                onClick={() => setMobileSidebarOpen(true)}
              />
              <span className="sc-topbar__h1">{activeSection.label}</span>
              <span className="sc-topbar__div" />
              <span className="sc-topbar__sub">{activeSection.description}</span>
            </div>
            <div className="dh-main-controls">
              <Button
                type="default"
                icon={<RotateCw size={14} />}
                onClick={handleRefresh}
                title="Refresh"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, padding: 0 }}
              />
            </div>
          </div>

          {/* Content — DropdownManager driven by activeKey */}
          <div className="dh-main-scroll no-scrollbar" style={{ padding: 0 }}>
            <DropdownManager
              key={activeKey}
              initialTab={activeKey}
              hideTabs
              onDataChange={handleRefresh}
            />
          </div>
        </main>
      </div>
    </>
  );
}

// ── Extra styles specific to this shell ─────────────────────────────────────
const TS_EXTRA_STYLES = `
  .ts-shell { height: calc(100vh - 64px); }

  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  /* Mobile menu button — hidden above 820 */
  .dh-mobile-menu-btn { display: none !important; }

  @media (max-width: 820px) {
    .ts-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
    .dh-main { height: auto; overflow: visible; width: 100%; }
    .dh-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; margin-right: 8px; color: var(--text-slate-600); }
    .dh-mobile-menu-btn:hover { background: var(--bg-slate-100); }

    .dh-sidebar-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
      opacity: 0; pointer-events: none; transition: opacity 0.3s;
      display: block !important;
    }
    .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }

    .dh-sidebar {
      position: fixed; top: 0; left: -320px; bottom: 0;
      z-index: 1100; height: 100%; max-height: none;
      border-right: 1px solid var(--border-slate-200); border-bottom: 0;
      display: flex; flex-direction: column; align-items: stretch;
      background: var(--bg-pure-white); width: 260px; box-sizing: border-box;
      transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 4px 0 24px rgba(0,0,0,0.08);
    }
    .dh-sidebar.is-mobile-open { left: 0; }

    .sc-topbar { padding: 8px 14px !important; }
  }

  @media (max-width: 480px) {
    .sc-topbar__sub, .sc-topbar__div { display: none !important; }
  }

  /* Make DropdownManager fill the available height without its own header chrome */
  .dh-main-scroll .dm-root {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
`;
