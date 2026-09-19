'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TemplateBuilder from '@/components/project-agreements/TemplateBuilder';
import ZukvoLoader from '@/components/common/ZukvoLoader';

function BuilderContent() {
  const searchParams = useSearchParams();
  return <TemplateBuilder templateId={searchParams.get('id') || undefined} />;
}

export default function TemplateBuilderPage() {
  return (
    <Suspense
      fallback={
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 60 }}>
          <ZukvoLoader size="md" />
        </div>
      }
    >
      <BuilderContent />
    </Suspense>
  );
}
