'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ZukvoLoader from './ZukvoLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component - handles client-side authentication
 * Works like traditional React Router guards
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      // Store the current path for redirect after login
      const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, requireAuth, router, redirectTo, pathname]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <ZukvoLoader message="Checking authentication..." />;
  }

  // If auth is required but user is not authenticated, don't render children
  // (redirect will happen in useEffect)
  if (requireAuth && !isAuthenticated) {
    return <ZukvoLoader message="Redirecting to login..." />;
  }

  // Render children if authentication check passes
  return <>{children}</>;
};

export default ProtectedRoute;
