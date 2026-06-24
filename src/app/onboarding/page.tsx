'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// /onboarding has no page of its own — send users to the employees list.
export default function OnboardingIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/onboarding/onboarded');
  }, [router]);
  return null;
}
