'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, Typography } from 'antd';
import { FolderOpenOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * Archived Tickets Page
 *
 * Displays archived tickets that are no longer active but kept for historical reference.
 * Unlike trash, archived tickets don't have auto-purge and can be unarchived anytime.
 */
export default function ArchivedTicketsPage() {
  return (
    <MainLayout>
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3}>
            <FolderOpenOutlined /> Archived Tickets
          </Title>
          <Text type="secondary">
            Long-term storage for completed tickets. No auto-purge, can be unarchived anytime.
          </Text>
        </div>
        
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <FolderOpenOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <Title level={4} type="secondary">Archived View Coming Soon</Title>
            <Text type="secondary">
              This page will show all archived tickets with the ability to filter, search, and unarchive them.
            </Text>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
