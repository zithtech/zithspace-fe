import React from 'react';
import {
  SlidersHorizontal,
  PieChart,
  Layers,
  CalendarClock,
  Landmark,
  Scale,
  Users as UsersIcon,
  BadgeCheck,
  FileCog,
  PlayCircle,
  FileText,
  FileBarChart,
} from 'lucide-react';

// Single source of truth for the Payroll 2.0 left-rail.
// Each item is a real route (own URL) gated by permission, so RBAC can be
// managed per page. `anyPerm` lists keys from usePermission(); a user sees the
// item (and may open the route) if ANY is true — or if they can manage payroll.
//
// NOTE: only the General Settings page is wired today. The remaining items are
// the planned Phase-1 (Settings & Configuration) surface; their routes land in
// subsequent slices. They are listed here so the rail shows the full shape and
// each page inherits the same permission convention as it ships.
export interface PayrollNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  anyPerm: string[];
  comingSoon?: boolean;
  selfService?: boolean; // visible to every authenticated user (own data only)
}

export const PAYROLL_NAV_ITEMS: PayrollNavItem[] = [
  {
    key: 'settings',
    label: 'General Settings',
    href: '/payroll-v2/settings',
    icon: <SlidersHorizontal size={16} />,
    color: '#3B82F6',
    anyPerm: ['canReadPayrollSettings'],
  },
  {
    key: 'components',
    label: 'Salary Components',
    href: '/payroll-v2/components',
    icon: <PieChart size={16} />,
    color: '#10B981',
    anyPerm: ['canReadPayrollComponents'],
  },
  {
    key: 'structures',
    label: 'Salary Structures',
    href: '/payroll-v2/structures',
    icon: <Layers size={16} />,
    color: '#8B5CF6',
    anyPerm: ['canReadPayrollStructures'],
  },
  {
    key: 'schedules',
    label: 'Pay Schedules & Groups',
    href: '/payroll-v2/schedules',
    icon: <CalendarClock size={16} />,
    color: '#F59E0B',
    anyPerm: ['canReadPayrollSchedules'],
  },
  {
    key: 'statutory',
    label: 'Statutory (PF & ESI)',
    href: '/payroll-v2/statutory',
    icon: <Landmark size={16} />,
    color: '#EF4444',
    anyPerm: ['canReadPayrollStatutory'],
  },
  {
    key: 'state-statutory',
    label: 'Professional Tax & LWF',
    href: '/payroll-v2/state-statutory',
    icon: <Scale size={16} />,
    color: '#06B6D4',
    anyPerm: ['canReadPayrollStateStatutory'],
  },
  {
    key: 'workflows',
    label: 'Approval Workflows',
    href: '/payroll-v2/workflows',
    icon: <BadgeCheck size={16} />,
    color: '#0EA5E9',
    anyPerm: ['canReadPayrollWorkflows'],
  },
  {
    key: 'payslip-template',
    label: 'Payslip & Bank',
    href: '/payroll-v2/payslip-template',
    icon: <FileCog size={16} />,
    color: '#EC4899',
    anyPerm: ['canReadPayrollPayslipBank'],
  },
  {
    key: 'employees',
    label: 'Employee Pay Setup',
    href: '/payroll-v2/employees',
    icon: <UsersIcon size={16} />,
    color: '#64748B',
    anyPerm: ['canReadPayrollEmployees'],
  },
  {
    key: 'run-payroll',
    label: 'Run Payroll',
    href: '/payroll-v2/run-payroll',
    icon: <PlayCircle size={16} />,
    color: '#10B981',
    anyPerm: ['canReadPayrollRun'],
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/payroll-v2/reports',
    icon: <FileBarChart size={16} />,
    color: '#8B5CF6',
    anyPerm: ['canReadPayrollReports'],
  },
  {
    key: 'my-payslips',
    label: 'My Payslips',
    href: '/payroll-v2/my-payslips',
    icon: <FileText size={16} />,
    color: '#06B6D4',
    anyPerm: [],
    selfService: true,
  },
];

export function getPayrollNavItem(key: string): PayrollNavItem | undefined {
  return PAYROLL_NAV_ITEMS.find((i) => i.key === key);
}

/** True if the permission map grants access to a nav item. Self-service items
 *  (e.g. My Payslips) are visible to every authenticated user — the backend
 *  scopes the data to the requester. */
export function canAccessPayrollItem(perms: Record<string, any>, item: PayrollNavItem): boolean {
  if (item.selfService) return true;
  return !!perms.canManagePayroll || item.anyPerm.some((p) => !!perms[p]);
}
