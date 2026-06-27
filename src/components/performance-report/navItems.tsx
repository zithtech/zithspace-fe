import React from 'react';
import { Gauge, SlidersHorizontal, Archive, FileUser } from 'lucide-react';

// Single source of truth for the Performance Report left-rail.
// Each item is a real route gated by permission, so RBAC can be managed per
// page. `anyPerm` lists keys from usePermission(); a user sees the item (and may
// open the route) if ANY is true. `always` items are visible to every
// authenticated user (e.g. "My Reports" — a self-service view).
export interface PRNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  anyPerm: string[];
  always?: boolean;
}

export const PR_NAV_ITEMS: PRNavItem[] = [
  {
    key: 'reports',
    label: 'Reports',
    href: '/performance-report/reports',
    icon: <Gauge size={16} />,
    color: '#3B82F6',
    anyPerm: ['canReadPerformanceReport'],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/performance-report/settings',
    icon: <SlidersHorizontal size={16} />,
    color: '#64748B',
    anyPerm: ['canReadPerformanceReportSetting'],
  },
  {
    key: 'generated',
    label: 'Generated Reports',
    href: '/performance-report/generated',
    icon: <Archive size={16} />,
    color: '#8B5CF6',
    anyPerm: ['canReadGeneratedPerformanceReport'],
  },
  {
    key: 'my-reports',
    label: 'My Reports',
    href: '/performance-report/my-reports',
    icon: <FileUser size={16} />,
    color: '#0EA5E9',
    anyPerm: ['canReadMyPerformanceReport'],
  },
];

export function getPRNavItem(key: string): PRNavItem | undefined {
  return PR_NAV_ITEMS.find((i) => i.key === key);
}

/** True if the permission map grants access to a nav item. */
export function canAccessPRItem(perms: Record<string, any>, item: PRNavItem): boolean {
  return !!item.always || item.anyPerm.some((p) => !!perms[p]);
}
