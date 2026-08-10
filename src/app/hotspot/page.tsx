'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /hotspot has no content of its own — it is the module root. The TopNav and
// existing bookmarks point here, so land on the first rail item.
export default function HotspotPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hotspot/circulation');
  }, [router]);

  return null;
}
