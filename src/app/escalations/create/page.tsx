'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateEscalationRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/escalations');
  }, [router]);
  return null;
}
