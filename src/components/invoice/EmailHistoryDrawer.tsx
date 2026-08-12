"use client";

import React, { useState } from 'react';
import {
  Drawer,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Tooltip,
  Badge,
  Empty,
  Input,
  Select
} from 'antd';
import {
  Mail,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  SendHorizontal,
  ChevronRight
} from 'lucide-react';
import dayjs from 'dayjs';
import { useEmailLogs } from '@/hooks/useEmailHistory';
import { STATUS_CONFIGS, MODULE_CONFIGS } from '@/services/emailHistoryService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const { Text, Title } = Typography;

interface EmailHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  invoiceId?: string;
  module?: string;
}

export default function EmailHistoryDrawer({ open, onClose, invoiceId, module = 'INVOICE' }: EmailHistoryDrawerProps) {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const {
    data: historyData,
    isLoading,
    isFetching,
    refetch
  } = useEmailLogs({
    page,
    limit: 10,
    module,
    moduleId: invoiceId,
    status: statusFilter,
    search: search || undefined
  });

  const columns = [
    {
      title: 'Date/Time',
      dataIndex: 'sentAt',
      key: 'sentAt',
      width: 160,
      render: (text: string) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13, color: 'var(--dashboard-stat-value)' }}>{dayjs(text).format('MMM D, YYYY')}</Text>
          <Text style={{ fontSize: 11, color: 'var(--dashboard-stat-label)' }}>{dayjs(text).format('hh:mm A')}</Text>
        </Space>
      )
    },
    {
      title: 'Recipient',
      dataIndex: 'to',
      key: 'to',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: 13, color: 'var(--dashboard-stat-value)' }}>{record.customerName || 'Customer'}</Text>
          <Text style={{ fontSize: 11, color: 'var(--dashboard-stat-label)' }}>{text}</Text>
        </Space>
      )
    },
    {
      title: 'From (Integration)',
      dataIndex: 'from',
      key: 'from',
      render: (text: string) => (
        <Tooltip title={text}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--history-drawer-expanded-bg)',
            padding: '4px 10px',
            borderRadius: 8,
            border: '1px solid var(--history-drawer-header-border)'
          }}>
            <Mail size={12} className="text-blue-500" />
            <Text style={{ fontSize: 12, maxWidth: 150, color: 'var(--dashboard-stat-label)' }} ellipsis>{text}</Text>
          </div>
        </Tooltip>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = STATUS_CONFIGS[status] || { color: '#8c8c8c', label: status };
        return (
          <Tag color={config.color} style={{ borderRadius: 6, border: 'none', padding: '0 8px', textTransform: 'uppercase', fontSize: 10, fontWeight: 700 }}>
            {config.label}
          </Tag>
        );
      }
    },
  ];

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 24 }}>
          <Space size={12}>
            <div style={{ background: 'var(--history-drawer-icon-bg)', padding: 10, borderRadius: 12, color: 'var(--history-drawer-icon-color)' }}>
              <Clock size={20} />
            </div>
            <div>
              <Title level={5} style={{ margin: 0, fontWeight: 700, color: 'var(--dashboard-stat-value)' }}>Email Communication Logs</Title>
              <Text style={{ fontSize: 12, color: 'var(--dashboard-stat-label)' }}>History of all sent invoice communications</Text>
            </div>
          </Space>
          <Button
            icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
        </div>
      }
      placement="right"
      width={900}
      onClose={onClose}
      open={open}
      styles={{
        header: {
          borderBottom: '1px solid var(--history-drawer-header-border)',
          padding: '20px 24px',
          background: 'var(--history-drawer-header-bg)'
        },
        body: {
          padding: '24px',
          background: 'var(--history-drawer-header-bg)'
        }
      }}
    >
      {/* Filters Header */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16 }}>
        <Input
          placeholder="Search by recipient or subject..."
          prefix={<Search size={16} className="text-slate-400" />}
          style={{ flex: 1, borderRadius: 10 }}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          placeholder="All Status"
          style={{ width: 150 }}
          allowClear
          onChange={(val) => setStatusFilter(val)}
          options={Object.keys(STATUS_CONFIGS).map(s => ({ label: STATUS_CONFIGS[s].label, value: s }))}
        />
      </div>

      {/* Main Table */}
      <ZukvoLoadingOverlay loading={isLoading} message="">
        <Table
          columns={columns}
          dataSource={historyData?.data || []}
          rowKey="id"
          pagination={{
            pageSizeOptions: [10, 20, 25, 50, 100], current: page,
            pageSize: 10,
            total: historyData?.pagination?.total || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            style: { marginTop: 24 }
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No email history found"
                style={{ padding: '60px 0' }}
              />
            )
          }}
          className="email-history-table"
          style={{
            background: 'var(--history-drawer-header-bg)',
            borderRadius: 16,
          }}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '16px 24px', background: 'var(--history-drawer-expanded-bg)', borderRadius: 12, border: '1px solid var(--history-drawer-header-border)' }}>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                  <Space direction="vertical" size={4}>
                    <Text strong style={{ fontSize: 13, color: 'var(--dashboard-stat-value)' }}>Subject</Text>
                    <Text style={{ color: 'var(--dashboard-stat-label)' }}>{record.subject}</Text>
                  </Space>
                  {record.hasAttachment && (
                    <Button size="small" icon={<Download size={14} />} style={{ borderRadius: 8, background: 'var(--history-drawer-header-bg)', color: 'var(--dashboard-stat-label)', border: '1px solid var(--history-drawer-header-border)' }}>
                      Attachment
                    </Button>
                  )}
                </div>
              </div>
            )
          }}
        />
      </ZukvoLoadingOverlay>

      <style dangerouslySetInnerHTML={{
        __html: `
        .email-history-table .ant-table-thead > tr > th {
          background: var(--history-drawer-table-header-bg) !important;
          color: var(--history-drawer-table-header-text) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid var(--history-drawer-header-border) !important;
        }
        .email-history-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--history-drawer-header-border) !important;
          background: var(--history-drawer-header-bg) !important;
        }
        .email-history-table .ant-table-row:hover > td {
          background: var(--history-drawer-row-hover) !important;
        }
        .email-history-table .ant-empty-description {
          color: var(--dashboard-stat-label) !important;
        }
        .email-history-table .ant-pagination-item a {
          color: var(--dashboard-stat-label) !important;
        }
        .email-history-table .ant-pagination-item-active a {
          color: var(--premium-blue) !important;
        }
      `}} />
    </Drawer>
  );
}
