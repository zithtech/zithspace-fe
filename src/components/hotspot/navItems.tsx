import React from 'react';
import { Briefcase, Megaphone, Newspaper } from 'lucide-react';
import { PALETTE } from '@/components/openings/ui';

// Single source of truth for the Hotspot left-rail.
//
// Unlike the Opening Management rail, nothing here is permission-gated:
// Hotspot is the employee-facing surface — the internal job board and the
// company noticeboard — and every authenticated employee sees both pages.
// Backend authorisation still decides what a caller may *write*.
export interface HotspotNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  hint: string;
}

export const HOTSPOT_NAV_ITEMS: HotspotNavItem[] = [
  {
    key: 'openings',
    label: 'Openings',
    href: '/hotspot/openings',
    icon: <Briefcase size={16} />,
    color: PALETTE.blue,
    hint: 'Internal roles you can apply to',
  },
  {
    key: 'circulation',
    label: 'Circulation',
    href: '/hotspot/circulation',
    icon: <Megaphone size={16} />,
    color: PALETTE.green,
    hint: 'Company-wide updates',
  },
  {
    key: 'blogs',
    label: 'Blogs',
    href: '/hotspot/blogs',
    icon: <Newspaper size={16} />,
    color: PALETTE.blue,
    hint: 'Share, tag, react, discuss',
  },
];
