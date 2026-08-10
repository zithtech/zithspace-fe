import React from 'react';
import { Briefcase, Megaphone, Newspaper } from 'lucide-react';
import { PALETTE } from '@/components/openings/ui';
import { Permissions, Permission } from '@/types/permissions';

export interface HotspotNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  hint: string;
  permission?: Permission;
}

export const HOTSPOT_NAV_ITEMS: HotspotNavItem[] = [
 
  {
    key: 'circulation',
    label: 'Circulation',
    href: '/hotspot/circulation',
    icon: <Megaphone size={16} />,
    color: PALETTE.green,
    hint: 'Company-wide updates',
    permission: Permissions.HOTSPOT_CIRCULATION_READ,
  },
  {
    key: 'blogs',
    label: 'Blogs',
    href: '/hotspot/blogs',
    icon: <Newspaper size={16} />,
    color: PALETTE.blue,
    hint: 'Share, tag, react, discuss',
    permission: Permissions.HOTSPOT_BLOG_READ,
  },
  {
    key: 'openings',
    label: 'Openings',
    href: '/hotspot/openings',
    icon: <Briefcase size={16} />,
    color: PALETTE.blue,
    hint: 'Internal roles you can apply to',
  }
];
