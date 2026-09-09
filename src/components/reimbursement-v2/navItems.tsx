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
  requiredSubscriptionFeature?: string[];
}

export const REIMBURSEMENT_NAV_ITEMS: ReimbursementNavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/reimbursement-v2/dashboard',
    icon: <LayoutDashboard size={16} />,
    color: '#3B82F6',
    anyPerm: ['canReadReimbursementDashboard', 'canReadReimbursement'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_dashboard', 'finance_reimbursement_v2'],
  },
  {
    key: 'claims',
    label: 'My Claims',
    href: '/reimbursement-v2/claims',
    icon: <ReceiptText size={16} />,
    color: '#10B981',
    anyPerm: ['canReadReimbursement', 'canReadMyHubClaims'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_claims'],
  },
  {
    key: 'advances',
    label: 'Advances',
    href: '/reimbursement-v2/advances',
    icon: <Wallet size={16} />,
    color: '#06B6D4',
    anyPerm: ['canReadReimbursement'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_advances'],
  },
  {
    key: 'approvals',
    label: 'Approvals',
    href: '/reimbursement-v2/approvals',
    icon: <BadgeCheck size={16} />,
    color: '#F59E0B',
    anyPerm: ['canApproveReimbursement'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_approvals'],
  },
  {
    key: 'finance',
    label: 'Finance',
    href: '/reimbursement-v2/finance',
    icon: <Banknote size={16} />,
    color: '#8B5CF6',
    anyPerm: ['canPayReimbursement'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_finance'],
  },
  {
    key: 'categories',
    label: 'Categories',
    href: '/reimbursement-v2/categories',
    icon: <Tags size={16} />,
    color: '#EC4899',
    anyPerm: ['canReadReimbursementPolicy'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_categories'],
  },
  {
    key: 'policies',
    label: 'Policies',
    href: '/reimbursement-v2/policies',
    icon: <ScrollText size={16} />,
    color: '#F97316',
    anyPerm: ['canReadReimbursementConfig'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_policies'],
  },
  {
    key: 'budgets',
    label: 'Budgets',
    href: '/reimbursement-v2/budgets',
    icon: <Target size={16} />,
    color: '#EF4444',
    anyPerm: ['canReadReimbursementConfig', 'canReadReimbursementDashboard'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_budgets'],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/reimbursement-v2/settings',
    icon: <Settings size={16} />,
    color: '#64748B',
    anyPerm: ['canReadReimbursementConfig'],
    requiredSubscriptionFeature: ['finance_reimbursement_v2_settings'],
  },
];

export function getReimbursementNavItem(key: string): ReimbursementNavItem | undefined {
  return REIMBURSEMENT_NAV_ITEMS.find((i) => i.key === key);
}

/** True if the permission map grants access to a nav item. */
export function canAccessReimbursementItem(
  perms: Record<string, any>,
  item: ReimbursementNavItem,
  hasAnySubscriptionFeature?: (...features: string[]) => boolean
): boolean {
  const hasPerm = !!perms.canManageReimbursements || item.anyPerm.some((p) => !!perms[p]);
  const hasSub = hasAnySubscriptionFeature && item.requiredSubscriptionFeature
    ? hasAnySubscriptionFeature(...item.requiredSubscriptionFeature)
    : true;
  return hasPerm && hasSub;
}
