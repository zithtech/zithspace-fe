'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ComingSoon from '@/components/common/ComingSoon';
import { ShopOutlined } from '@ant-design/icons';

export default function ClientsPage() {
  return (
    <MainLayout>
      <ComingSoon
        title="Clients"
        description="Manage client relationships, track communications, and maintain detailed client profiles and project history."
        icon={<ShopOutlined />}
      />
    </MainLayout>
  );
}
