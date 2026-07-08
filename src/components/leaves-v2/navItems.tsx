import React from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  BadgeCheck,
  Landmark,
  CalendarCog,
  Tag as TagIcon,
  BookOpen,
  CalendarHeart,
  Settings as SettingsIcon,
} from 'lucide-react';

// Single source of truth for the Leaves 2.0 left-rail.
// Each item is a real route (own URL) gated by permission, so RBAC can be
// managed per page. `anyPerm` lists keys from usePermission(); a user sees the
// item (and may open the route) if ANY is true — or if they can manage leaves.
export interface LeaveNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  anyPerm: string[];
}

export const LEAVE_NAV_ITEMS: LeaveNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/leaves-v2/dashboard',
    icon: <LayoutDashboard size={16} />,
    color: '#3B82F6',
    anyPerm: ['canReadLeaveDashboard', 'canReadLeave'],
  },
  {
    key: 'apply',
    label: 'Apply Leave',
    href: '/leaves-v2/apply',
    icon: <CalendarPlus size={16} />,
    color: '#10B981',
    // canReadMyHubApplyLeave is the My Hub self-service permission so that
    // users granted my_hub.apply_leave.read (without full leave module
    // access) can still reach this page via My Hub.
    anyPerm: ['canReadLeave', 'canReadMyHubApplyLeave'],
  },
  {
    key: 'approvals',
    label: 'Approvals',
    href: '/leaves-v2/approvals',
    icon: <BadgeCheck size={16} />,
    color: '#F59E0B',
    anyPerm: ['canApproveLeave'],
  },
  {
    key: 'holidays',
    label: 'Government Holidays',
    href: '/leaves-v2/holidays',
    icon: <Landmark size={16} />,
    color: '#8B5CF6',
    anyPerm: ['canReadLeaveHoliday'],
  },
  {
    key: 'adjustment',
    label: 'Leave Adjustment',
    href: '/leaves-v2/adjustment',
    icon: <CalendarCog size={16} />,
    color: '#EC4899',
    anyPerm: ['canReadLeaveAdjustment'],
  },
  {
    key: 'types',
    label: 'Leave Type',
    href: '/leaves-v2/types',
    icon: <TagIcon size={16} />,
    color: '#06B6D4',
    anyPerm: ['canReadLeaveType'],
  },
  {
    key: 'policy',
    label: 'Leave Policy',
    href: '/leaves-v2/policy',
    icon: <BookOpen size={16} />,
    color: '#F97316',
    anyPerm: ['canReadLeavePolicy'],
  },
  {
    key: 'add-holidays',
    label: 'Add Government Holidays',
    href: '/leaves-v2/add-holidays',
    icon: <CalendarHeart size={16} />,
    color: '#EF4444',
    anyPerm: ['canCreateLeaveHoliday', 'canReadLeaveHoliday'],
  },
  {
    key: 'configuration',
    label: 'Configuration',
    href: '/leaves-v2/configuration',
    icon: <SettingsIcon size={16} />,
    color: '#64748B',
    anyPerm: ['canManageLeaves'],
  },
];

export function getLeaveNavItem(key: string): LeaveNavItem | undefined {
  return LEAVE_NAV_ITEMS.find((i) => i.key === key);
}

/** True if the permission map grants access to a nav item. */
export function canAccessLeaveItem(perms: Record<string, any>, item: LeaveNavItem): boolean {
  return !!perms.canManageLeaves || item.anyPerm.some((p) => !!perms[p]);
}
