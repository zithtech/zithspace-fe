'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { useRouter } from 'next/navigation';
import ZukvoLoader from "@/components/common/ZukvoLoader";



/**
 * Legacy Redirect Page
 *
 * This page handles backward compatibility for the old /projects/tickets route.
 * It automatically redirects users to the new project selection page.
 *
 * Old Flow: /projects/tickets (with optional project filter)
 * New Flow: /projects/select → /projects/:projectId/tickets
 */
export default function LegacyTicketsRedirect() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadTicket } = usePermission();

  useEffect(() => {
    if (!authLoading) {
      if (!canReadTicket) {
        router.replace('/dashboard');
      } else {
        // Redirect to the new project selection page
        router.replace('/tickets/select');
      }
    }
  }, [authLoading, canReadTicket, router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: 16
    }}>
      <ZukvoLoader size="lg" />
      <p style={{ color: '#8c8c8c' }}>Redirecting to project selection...</p>
    </div>
  );
}
