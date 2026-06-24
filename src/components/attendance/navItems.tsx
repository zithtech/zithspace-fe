import React from 'react';
import { LayoutDashboard, Clock, UserCheck } from 'lucide-react';

// Single source of truth for the Attendance left-rail.
// Each item is a real route (own URL) gated by permission, so RBAC can be
// managed per page. `anyPerm` lists keys from usePermission(); a user sees the
// item (and may open the route) if ANY is true.
export interface AttendanceNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  anyPerm: string[];
}

export const ATTENDANCE_NAV_ITEMS: AttendanceNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/attendance/dashboard',
    icon: <LayoutDashboard size={16} />,
    color: '#3B82F6',
    anyPerm: ['canReadAttendanceDashboard', 'canReadAttendance'],
  },
  {
    key: 'clock-in-out',
    label: 'Clock In / Out',
    href: '/attendance/clock-in-out',
    icon: <Clock size={16} />,
    color: '#10B981',
    anyPerm: ['canClockInOut', 'canReadAttendance'],
  },
  {
    key: 'manage',
    label: 'Manage Attendance',
    href: '/attendance/manage',
    icon: <UserCheck size={16} />,
    color: '#06B6D4',
    anyPerm: [
      'canManageAttendance',
      'canCreateAttendance',
      'canUpdateAttendance',
      'canReadAttendance',
      'canDeleteAttendance',
    ],
  },
];

export function getAttendanceNavItem(key: string): AttendanceNavItem | undefined {
  return ATTENDANCE_NAV_ITEMS.find((i) => i.key === key);
}

/** True if the permission map grants access to a nav item. */
export function canAccessAttendanceItem(
  perms: Record<string, any>,
  item: AttendanceNavItem
): boolean {
  return item.anyPerm.some((p) => !!perms[p]);
}
