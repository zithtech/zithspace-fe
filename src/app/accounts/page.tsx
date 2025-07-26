'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ComingSoon from '@/components/common/ComingSoon';
import { BankOutlined } from '@ant-design/icons';

export default function AccountsPage() {
  return (
    <MainLayout>
      <ComingSoon
        title="Accounts"
        description="Manage financial accounts, track expenses, handle invoicing, and generate financial reports."
        icon={<BankOutlined />}
      />
    </MainLayout>
  );
}
