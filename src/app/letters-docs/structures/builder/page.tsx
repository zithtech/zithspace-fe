'use client';

import React, { Suspense } from 'react';
import StructureBuilder from '@/components/letters/StructureBuilder';

export default function StructureBuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>Loading Builder...</div>}>
      <StructureBuilder />
    </Suspense>
  );
}
