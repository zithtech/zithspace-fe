'use client';

import OnboardingGuard from '@/components/onboarding/OnboardingGuard';
import OnboardingDocumentsPanel from '@/components/onboarding/OnboardingDocumentsPanel';

export default function OnboardingDocumentsPage() {
  return (
    <OnboardingGuard itemKey="documents">
      <OnboardingDocumentsPanel />
    </OnboardingGuard>
  );
}
// end of file

