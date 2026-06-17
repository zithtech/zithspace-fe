'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Blocks, LayoutTemplate } from 'lucide-react';

type Key = 'proposals' | 'sections' | 'templates';

const TABS: { key: Key; label: string; path: string; icon: React.ReactNode }[] = [
  { key: 'proposals', label: 'Proposals', path: '/proposals', icon: <FileText size={14} /> },
  { key: 'sections', label: 'Sections', path: '/proposals/sections', icon: <Blocks size={14} /> },
  { key: 'templates', label: 'Templates', path: '/proposals/templates', icon: <LayoutTemplate size={14} /> },
];

export const LibraryNav: React.FC<{ active: Key }> = ({ active }) => {
  const router = useRouter();
  return (
    <div className="lib-tabs">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`lib-tab ${active === t.key ? 'is-active' : ''}`}
          onClick={() => router.push(t.path)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
};
