'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TemplateBuilder from '@/components/letters/TemplateBuilder';

function BuilderContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || undefined;
  return <TemplateBuilder templateId={id} />;
}

export default function TemplateBuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading Builder...</div>}>
      <BuilderContent />
    </Suspense>
  );
}
