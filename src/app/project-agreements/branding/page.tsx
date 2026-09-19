'use client';

/**
 * The letterhead moved into Settings as a tab. This route stays so links,
 * bookmarks and anything still pointing at /branding land somewhere correct.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ZukvoLoader from '@/components/common/ZukvoLoader';

export default function BrandingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/project-agreements/settings?tab=letterhead');
  }, [router]);

  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <ZukvoLoader size="md" />
    </div>
  );
}
