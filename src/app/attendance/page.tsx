'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Attendance Page
 * 
 * This page now serves as a redirector to the Attendance Dashboard.
 * The attendance module has been refactored into nested routes:
 * - /attendance/dashboard
 * - /attendance/clock-in-out
 * - /attendance/manage
 */
export default function AttendancePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/attendance/dashboard');
  }, [router]);

  return null;
}
