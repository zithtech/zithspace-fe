'use client';

import { Suspense } from 'react';
import AgreementComposer from '@/components/project-agreements/AgreementComposer';

export default function NewAgreementPage() {
  return (
    <Suspense fallback={null}>
      <AgreementComposer />
    </Suspense>
  );
}
