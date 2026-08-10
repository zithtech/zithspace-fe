'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import BlogFeed from '@/components/hotspot/blog/BlogFeed';

export default function HotspotBlogsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { canReadHotspotBlog } = usePermission();

  useEffect(() => {
    if (!isLoading && user && !canReadHotspotBlog) {
      router.push('/dashboard');
    }
  }, [user, isLoading, canReadHotspotBlog, router]);

  if (!canReadHotspotBlog) return null;

  return <BlogFeed />;
}
