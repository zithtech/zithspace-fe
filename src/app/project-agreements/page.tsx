'use client';

/** /project-agreements has no page of its own — the layout decides where you land. */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectAgreementsIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/project-agreements/agreements');
  }, [router]);
  return null;
}
