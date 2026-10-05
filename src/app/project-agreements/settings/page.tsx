'use client';

/**
 * Settings — the module's two configuration surfaces, behind one header.
 *
 * Doc Types is the vocabulary every template and agreement must pick from;
 * Letterhead is the header and footer they all print inside. Neither is a
 * daily destination, which is why they share a page rather than each taking a
 * slot in the nav beside the work itself.
 *
 * The sections live in a LEFT RAIL, the same one the Agreements list uses.
 * That is deliberate: the rail is where this module puts "which slice am I
 * looking at", and settings is the same question. It also leaves the header's
 * right side free for whatever the open section needs — Save on the
 * letterhead, New type on doc types — instead of contending with the switcher.
 *
 * The section lives in the QUERY STRING so it is linkable and survives a
 * reload — /project-agreements/settings?tab=letterhead is a real address, and
 * the old /branding route redirects to it.
 */

import React, { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Drawer } from 'antd';
import { Layers, Settings as SettingsIcon, Stamp, Menu } from 'lucide-react';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import DocumentTypeSettings from '@/components/project-agreements/DocumentTypeSettings';
import LetterheadSettings from '@/components/project-agreements/LetterheadSettings';
import SecuritySettings from '@/components/project-agreements/SecuritySettings';
import { ShieldCheck } from 'lucide-react';

type TabKey = 'doc-types' | 'letterhead' | 'security';

const SECTIONS: Array<{
  key: TabKey;
  label: string;
  hint: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'doc-types',
    label: 'Doc Types',
    hint: 'The kinds you can raise',
    icon: <Layers size={14} />,
  },
  {
    key: 'letterhead',
    label: 'Letterhead',
    hint: 'Header and footer',
    icon: <Stamp size={14} />,
  },
  {
    key: 'security',
    label: 'Security & Access',
    hint: 'Password policies & locks',
    icon: <ShieldCheck size={14} />,
  },
];

function SettingsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('tab');
  const tab: TabKey = raw === 'letterhead' ? 'letterhead' : raw === 'security' ? 'security' : 'doc-types';
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const select = useCallback(
    (key: TabKey) => {
      // replace, not push: switching section is not a step you want to walk
      // back through on the way out of settings.
      router.replace(`/project-agreements/settings?tab=${key}`, { scroll: false });
    },
    [router]
  );

  const renderSidebarContent = () => (
    <div className="pa-rail-scroll">
      <div className="pa-rail-label">Configuration</div>
      <div className="pa-rail-list" role="tablist" aria-label="Settings sections">
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            type="button"
            role="tab"
            aria-selected={tab === sec.key}
            className={`pa-rail-item is-stacked ${tab === sec.key ? 'is-on' : ''}`}
            onClick={() => {
              select(sec.key);
              setIsSidebarOpen(false);
            }}
          >
            <span className="pa-rail-icon">{sec.icon}</span>
            <span className="pa-rail-text">
              {sec.label}
              <span className="pa-rail-hint">{sec.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pa-list-page">
      <div className="pa-header">
        <div className="pa-header-about">
          <button 
            type="button" 
            className="pa-sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="pa-header-icon">
            <SettingsIcon size={19} />
          </div>
          <div>
            <div className="pa-header-title">Settings</div>
            <div className="pa-header-sub">
              Document types, letterheads, and multi-tenant security policies
            </div>
          </div>
        </div>
        <div id="pa-settings-header-actions" className="pa-header-actions" />
      </div>

      <Drawer
        title="Settings"
        placement="left"
        onClose={() => setIsSidebarOpen(false)}
        open={isSidebarOpen}
        width={260}
        styles={{ body: { padding: 0 } }}
        className="pa-mobile-drawer"
      >
        <aside className="pa-rail" style={{ display: 'block', height: '100%', borderRight: 'none' }}>
          {renderSidebarContent()}
        </aside>
      </Drawer>

      <div className="pa-list-split">
        <aside className="pa-rail">
          {renderSidebarContent()}
        </aside>

        <div className="pa-list-main" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Mounted one at a time on purpose: each section loads its own data,
              and keeping the other alive would refetch a letterhead nobody is
              looking at every time the doc-type list changes. */}
          {tab === 'doc-types' ? (
            <DocumentTypeSettings />
          ) : tab === 'letterhead' ? (
            <LetterheadSettings />
          ) : (
            <SecuritySettings />
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <ZukvoLoader size="md" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
