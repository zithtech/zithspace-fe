'use client';

/**
 * One agreement by id.
 *
 * VIEWING lives in a drawer over the list now, so this route redirects there
 * rather than keeping a second implementation of the same screen. The URL
 * stays valid — a link pasted into a ticket months ago still resolves to the
 * document it named.
 *
 * EDITING is still a page. The composer is a two-column authoring surface with
 * a live A4 preview and it needs the screen, so `?edit=1` renders it here.
 */

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ZukvoLoader from '@/components/common/ZukvoLoader';
import AgreementComposer from '@/components/project-agreements/AgreementComposer';
import { usePermission } from '@/hooks/usePermission';
import { Agreement, ProjectAgreementsService } from '@/services/projectAgreementsService';

const Spinner = () => (
  <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: 60 }}>
    <ZukvoLoader size="md" />
  </div>
);

export default function AgreementDetailPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={<Spinner />}>
      <AgreementRoute />
    </Suspense>
  );
}

function AgreementRoute() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const perms = usePermission() as unknown as Record<string, any>;

  const id = String(params?.id ?? '');
  const editing = searchParams?.get('edit') === '1' && Boolean(perms.canUpdateAgreement);

  const [agreement, setAgreement] = useState<Agreement | null>(null);

  useEffect(() => {
    if (!id) return;

    if (!editing) {
      // Hand it to the list, which opens the drawer on this id.
      router.replace(`/project-agreements/agreements?open=${id}`);
      return;
    }

    let cancelled = false;
    ProjectAgreementsService.getAgreement(id)
      .then((record) => {
        if (!cancelled) setAgreement(record);
      })
      .catch((err: any) => {
        if (cancelled) return;
        toast.error(err?.message || 'Could not load that agreement');
        router.replace('/project-agreements/agreements');
      });
    return () => {
      cancelled = true;
    };
  }, [id, editing, router]);

  if (editing && agreement) return <AgreementComposer agreement={agreement} />;
  return <Spinner />;
}
