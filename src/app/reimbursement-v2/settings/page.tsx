import React from 'react';
import SettingsPanel from '@/components/reimbursement-v2/SettingsPanel';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - Reimbursement',
};

export default function SettingsPage() {
  return <SettingsPanel />;
}
