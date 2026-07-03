'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import {
  REIMBURSEMENT_NAV_ITEMS,
  canAccessReimbursementItem,
} from '@/components/reimbursement-v2/navItems';

// Index route: redirect to the first sub-page the user can access.
export default function ReimbursementV2Index() {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    const first = REIMBURSEMENT_NAV_ITEMS.find((item) => canAccessReimbursementItem(perms, item));
    router.replace(first ? first.href : '/dashboard');
  }, [perms, router]);

  return null;
}
