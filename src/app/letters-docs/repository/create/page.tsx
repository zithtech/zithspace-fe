'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DocumentEditor from '@/components/letters/DocumentEditor';
import ZukvoLoader from '@/components/common/ZukvoLoader';

function CreateDocumentContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || searchParams.get('editId') || undefined;
  return <DocumentEditor documentId={id} />;
}

export default function CreateDocumentPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '12px' }}>
          <ZukvoLoader />
          <span style={{ fontSize: '13px', color: 'var(--text-slate-500)', fontWeight: 500 }}>Loading Editor...</span>
        </div>
      }
    >
      <CreateDocumentContent />
    </Suspense>
  );
}
