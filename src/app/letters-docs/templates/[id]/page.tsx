'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import TemplateBuilder from '@/components/letters/TemplateBuilder';

export default function TemplateEditPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  return <TemplateBuilder templateId={id} />;
}
