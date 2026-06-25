import React from 'react';
import {
  Users,
  UserPlus,
  Link2,
  Settings as SettingsIcon,
} from 'lucide-react';

// Single source of truth for the Onboarding left-rail. Mirrors the Leaves 2.0
// pattern: each item is a real route (own URL) gated by permission, so the rule
// lives in one place and RBAC is managed per page. A user sees the item (and may
// open the route) if ANY of `anyPerm` is true.
export interface OnboardingNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  anyPerm: string[];
}

export const ONBOARDING_NAV_ITEMS: OnboardingNavItem[] = [
  {
    key: 'employees',
    label: 'Employees',
    href: '/onboarding/onboarded',
    icon: <Users size={16} />,
    color: '#3B82F6',
    anyPerm: ['canReadOnboarding'],
  },
  {
    key: 'create',
    label: 'Add Employee',
    href: '/onboarding/create',
    icon: <UserPlus size={16} />,
    color: '#10B981',
    anyPerm: ['canCreateOnboarding', 'canUpdateOnboarding'],
  },
  {
    key: 'invites',
    label: 'Invites',
    href: '/onboarding/invites',
    icon: <Link2 size={16} />,
    color: '#8B5CF6',
    anyPerm: ['canCreateOnboarding', 'canReadOnboarding'],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/onboarding/settings',
    icon: <SettingsIcon size={16} />,
    color: '#64748B',
    anyPerm: ['canReadOnboardingSetting', 'canUpdateOnboardingSetting'],
  },
];

export function getOnboardingNavItem(key: string): OnboardingNavItem | undefined {
  return ONBOARDING_NAV_ITEMS.find((i) => i.key === key);
}

/** True if the permission map grants access to a nav item. */
export function canAccessOnboardingItem(
  perms: Record<string, any>,
  item: OnboardingNavItem,
): boolean {
  return item.anyPerm.some((p) => !!perms[p]);
}
