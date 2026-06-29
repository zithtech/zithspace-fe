'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePermission } from '@/hooks/usePermission';
import { ATTENDANCE_NAV_ITEMS, canAccessAttendanceItem } from '@/components/attendance/navItems';

// /attendance index → redirect to the first page the user can access.
export default function AttendanceIndex() {
  const router = useRouter();
  const perms = usePermission() as unknown as Record<string, any>;

  useEffect(() => {
    const first = ATTENDANCE_NAV_ITEMS.find((i) => canAccessAttendanceItem(perms, i));
    router.replace(first ? first.href : '/dashboard');
  }, [perms, router]);

  return null;
}
