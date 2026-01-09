'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

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

  useEffect(() => {
    // Redirect to the new project selection page
    router.replace('/projects/select');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: 16
    }}>
      <Spin size="large" />
      <p style={{ color: '#8c8c8c' }}>Redirecting to project selection...</p>
    </div>
  );
}
