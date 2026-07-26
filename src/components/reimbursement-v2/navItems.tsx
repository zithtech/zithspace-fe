import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  BadgeCheck,
  Banknote,
  Tags,
  ScrollText,
  Target,
  Settings,
} from 'lucide-react';

// Single source of truth for the Reimbursement 2.0 left-rail.
// Each item is a real route (own URL) gated by permission. `anyPerm` lists keys
// from usePermission(); a user sees the item (and may open the route) if ANY is
// true — or if they can manage reimbursements.
export interface ReimbursementNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  anyPerm: string[];
}

export const REIMBURSEMENT_NAV_ITEMS: ReimbursementNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/reimbursement-v2/dashboard',
    icon: <LayoutDashboard size={16} />,
    color: '#3B82F6',
    anyPerm: ['canReadReimbursementDashboard', 'canReadReimbursement'],
  },
  {
    key: 'claims',
    label: 'My Claims',
    href: '/reimbursement-v2/claims',
    icon: <ReceiptText size={16} />,
    color: '#10B981',
    anyPerm: ['canReadReimbursement', 'canReadMyHubClaims'],
  },
  {
    key: 'advances',
    label: 'Advances',
    href: '/reimbursement-v2/advances',
    icon: <Wallet size={16} />,
    color: '#06B6D4',
    anyPerm: ['canReadReimbursement'],
  },
  {
    key: 'approvals',
    label: 'Approvals',
    href: '/reimbursement-v2/approvals',
    icon: <BadgeCheck size={16} />,
    color: '#F59E0B',
    anyPerm: ['canApproveReimbursement'],
  },
  {
    key: 'finance',
    label: 'Finance',
    href: '/reimbursement-v2/finance',
    icon: <Banknote size={16} />,
    color: '#8B5CF6',
    anyPerm: ['canPayReimbursement'],
  },
  {
    key: 'categories',
    label: 'Categories',
    href: '/reimbursement-v2/categories',
    icon: <Tags size={16} />,
    color: '#EC4899',
    anyPerm: ['canReadReimbursementPolicy'],
  },
  {
    key: 'policies',
    label: 'Policies',
    href: '/reimbursement-v2/policies',
    icon: <ScrollText size={16} />,
    color: '#F97316',
    anyPerm: ['canReadReimbursementConfig'],
  },
  {
    key: 'budgets',
    label: 'Budgets',
    href: '/reimbursement-v2/budgets',
    icon: <Target size={16} />,
    color: '#EF4444',
    anyPerm: ['canReadReimbursementConfig', 'canReadReimbursementDashboard'],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/reimbursement-v2/settings',
    icon: <Settings size={16} />,
    color: '#64748B',
    anyPerm: ['canReadReimbursementConfig'],
  },
];

export function getReimbursementNavItem(key: string): ReimbursementNavItem | undefined {
  return REIMBURSEMENT_NAV_ITEMS.find((i) => i.key === key);
}

/** True if the permission map grants access to a nav item. */
export function canAccessReimbursementItem(
  perms: Record<string, any>,
  item: ReimbursementNavItem
): boolean {
  return !!perms.canManageReimbursements || item.anyPerm.some((p) => !!perms[p]);
}
