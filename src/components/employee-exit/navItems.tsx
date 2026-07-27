import React from 'react';
import {
  FileText,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Banknote,
  FolderOpen,
  PieChart,
  Settings,
  List
} from 'lucide-react';
import { Permissions } from '@/types/permissions';

export interface ExitNavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  requiredPermission?: string;
  requiredAnyPermission?: string[];
  comingSoon?: boolean;
}

export const EXIT_NAV_ITEMS: ExitNavItem[] = [
  {
    key: 'my-requests',
    label: 'My Requests',
    href: '/employee-exit/my-requests',
    icon: <FileText size={18} />,
    color: '#0284c7', // light blue
    requiredAnyPermission: [Permissions.EXIT_READ, Permissions.EXIT_MANAGE],
  },
  {
    key: 'all-requests',
    label: 'All Requests',
    href: '/employee-exit/all-requests',
    icon: <List size={18} />,
    color: '#0284c7', // light blue
    requiredPermission: Permissions.EXIT_MANAGE,
  },
  {
    key: 'approvals',
    label: 'Approvals',
    href: '/employee-exit/approvals',
    icon: <CheckCircle2 size={18} />,
    color: '#16a34a', // emerald
    requiredPermission: Permissions.EXIT_MANAGE,
  },
  {
    key: 'clearance',
    label: 'Clearance',
    href: '/employee-exit/clearance',
    icon: <ShieldCheck size={18} />,
    color: '#d97706', // amber
    requiredPermission: Permissions.EXIT_MANAGE,
  },
  {
    key: 'interviews',
    label: 'Exit Interviews',
    href: '/employee-exit/interviews',
    icon: <MessageSquare size={18} />,
    color: '#8b5cf6', // violet
    requiredPermission: Permissions.EXIT_MANAGE,
  },
  {
    key: 'fnf',
    label: 'FnF Settlement',
    href: '/employee-exit/fnf',
    icon: <Banknote size={18} />,
    color: '#059669', // emerald darker
    requiredPermission: Permissions.EXIT_MANAGE,
  },
  {
    key: 'documents',
    label: 'Documents',
    href: '/employee-exit/documents',
    icon: <FolderOpen size={18} />,
    color: '#ea580c', // orange
    requiredPermission: Permissions.EXIT_MANAGE,
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/employee-exit/reports',
    icon: <PieChart size={18} />,
    color: '#db2777', // pink
    requiredPermission: Permissions.EXIT_MANAGE,
  },
  {
    key: 'configuration',
    label: 'Configuration',
    href: '/employee-exit/configuration',
    icon: <Settings size={18} />,
    color: '#475569', // slate
    requiredPermission: Permissions.EXIT_CONFIG_READ,
  }
];

export function canAccessExitItem(perms: Record<string, any>, item: ExitNavItem): boolean {
  if (item.requiredPermission) {
    return !!perms.can?.(item.requiredPermission);
  }
  if (item.requiredAnyPermission) {
    return !!perms.canAny?.(...item.requiredAnyPermission);
  }
  return true;
}
