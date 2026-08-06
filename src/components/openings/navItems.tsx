import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  BadgeCheck,
  Megaphone,
  Archive,
  Settings,
} from 'lucide-react';
import { PALETTE } from './ui';

// Single source of truth for the Opening Management left-rail.
// Each item is a real route gated by permission. `anyPerm` lists keys from
// usePermission(); a user sees the item (and may open the route) if ANY is true —
// or if they can manage openings.
export interface OpeningNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  anyPerm: string[];
}

export const OPENING_NAV_ITEMS: OpeningNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/openings/dashboard',
    icon: <LayoutDashboard size={16} />,
    color: PALETTE.blue,
    anyPerm: ['canReadOpening'],
  },
  {
    key: 'list',
    label: 'Openings',
    href: '/openings/list',
    icon: <Briefcase size={16} />,
    color: PALETTE.blue,
    anyPerm: ['canReadOpening'],
  },
  {
    key: 'approvals',
    label: 'Approvals',
    href: '/openings/approvals',
    icon: <BadgeCheck size={16} />,
    color: PALETTE.green,
    anyPerm: ['canReadOpening'],
  },
  {
    key: 'closing',
    label: 'Ready to Close',
    href: '/openings/closing',
    icon: <Megaphone size={16} />,
    color: PALETTE.green,
    anyPerm: ['canReadOpening'],
  },
  {
    key: 'archive',
    label: 'Archive',
    href: '/openings/archive',
    icon: <Archive size={16} />,
    color: PALETTE.ash,
    anyPerm: ['canReadOpening'],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/openings/settings',
    icon: <Settings size={16} />,
    color: PALETTE.ash,
    anyPerm: ['canManageOpenings'],
  },
];

export function getOpeningNavItem(key: string): OpeningNavItem | undefined {
  return OPENING_NAV_ITEMS.find((item) => item.key === key);
}

export function canAccessOpeningItem(
  perms: Record<string, any>,
  item: OpeningNavItem
): boolean {
  return !!perms.canManageOpenings || item.anyPerm.some((p) => !!perms[p]);
}
