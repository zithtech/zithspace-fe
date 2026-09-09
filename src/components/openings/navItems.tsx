import { App } from 'antd';
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
  requiredSubscriptionFeature?: string[];
}

export const OPENING_NAV_ITEMS: OpeningNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/openings/dashboard',
    icon: <LayoutDashboard size={16} />,
    color: PALETTE.blue,
    anyPerm: ['canReadOpening'],
    requiredSubscriptionFeature: ['hrms_openings_dashboard', 'hrms_openings'],
  },
  {
    key: 'list',
    label: 'Openings',
    href: '/openings/list',
    icon: <Briefcase size={16} />,
    color: PALETTE.blue,
    anyPerm: ['canReadOpening'],
    requiredSubscriptionFeature: ['hrms_openings_list', 'hrms_openings'],
  },
  {
    key: 'approvals',
    label: 'Approvals',
    href: '/openings/approvals',
    icon: <BadgeCheck size={16} />,
    color: PALETTE.green,
    anyPerm: ['canReadOpening'],
    requiredSubscriptionFeature: ['hrms_openings_approvals', 'hrms_openings'],
  },
  {
    key: 'closing',
    label: 'Ready to Close',
    href: '/openings/closing',
    icon: <Megaphone size={16} />,
    color: PALETTE.green,
    anyPerm: ['canReadOpening'],
    requiredSubscriptionFeature: ['hrms_openings_closing', 'hrms_openings'],
  },
  {
    key: 'archive',
    label: 'Archive',
    href: '/openings/archive',
    icon: <Archive size={16} />,
    color: PALETTE.ash,
    anyPerm: ['canReadOpening'],
    requiredSubscriptionFeature: ['hrms_openings_archive', 'hrms_openings'],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/openings/settings',
    icon: <Settings size={16} />,
    color: PALETTE.ash,
    anyPerm: ['canManageOpenings'],
    requiredSubscriptionFeature: ['hrms_openings_settings', 'hrms_openings'],
  },
];

export function getOpeningNavItem(key: string): OpeningNavItem | undefined {
  return OPENING_NAV_ITEMS.find((item) => item.key === key);
}

/** True if the permission map grants access to a nav item. */
export function canAccessOpeningItem(
  perms: Record<string, any>,
  item: OpeningNavItem,
  hasAnySubscriptionFeature?: (...features: string[]) => boolean
): boolean {
  const hasPerm = !!perms.canManageOpenings || item.anyPerm.some((p) => !!perms[p]);
  const hasSub = hasAnySubscriptionFeature && item.requiredSubscriptionFeature
    ? hasAnySubscriptionFeature(...item.requiredSubscriptionFeature)
    : true;
  return hasPerm && hasSub;
}
