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
  requiredSubscriptionFeature?: string[];
}

export const PR_NAV_ITEMS: PRNavItem[] = [
  {
    key: 'reports',
    label: 'Reports',
    href: '/performance-report/reports',
    icon: <Gauge size={16} />,
    color: '#3B82F6',
    anyPerm: ['canReadPerformanceReport'],
    requiredSubscriptionFeature: ['hrms_performance_reports', 'hrms_performance'],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/performance-report/settings',
    icon: <SlidersHorizontal size={16} />,
    color: '#64748B',
    anyPerm: ['canReadPerformanceReportSetting'],
    requiredSubscriptionFeature: ['hrms_performance_settings', 'hrms_performance'],
  },
  {
    key: 'generated',
    label: 'Generated Reports',
    href: '/performance-report/generated',
    icon: <Archive size={16} />,
    color: '#8B5CF6',
    anyPerm: ['canReadGeneratedPerformanceReport'],
    requiredSubscriptionFeature: ['hrms_performance_generated', 'hrms_performance'],
  },
  {
    key: 'my-reports',
    label: 'My Reports',
    href: '/performance-report/my-reports',
    icon: <FileUser size={16} />,
    color: '#0EA5E9',
    // canReadMyHubPerformance is the My Hub self-service permission so that
    // users granted my_hub.performance.read (without full performance-report
    // module access) can still reach this page via My Hub.
    anyPerm: ['canReadMyPerformanceReport', 'canReadMyHubPerformance'],
    requiredSubscriptionFeature: ['hrms_performance_my_reports', 'hrms_performance', 'my_hub'],
  },
];

export function getPRNavItem(key: string): PRNavItem | undefined {
  return PR_NAV_ITEMS.find((i) => i.key === key);
}

/** True if the permission map grants access to a nav item. */
export function canAccessPRItem(
  perms: Record<string, any>,
  item: PRNavItem,
  hasAnySubscriptionFeature?: (...features: string[]) => boolean
): boolean {
  const hasPerm = !!item.always || item.anyPerm.some((p) => !!perms[p]);
  const hasSub = hasAnySubscriptionFeature && item.requiredSubscriptionFeature
    ? hasAnySubscriptionFeature(...item.requiredSubscriptionFeature)
    : true;
  return hasPerm && hasSub;
}
