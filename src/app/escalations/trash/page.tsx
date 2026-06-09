'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  Input,
  Avatar,
  Empty,
  Tag,
  App,
  Skeleton,
  Badge,
  Spin,
} from 'antd';
import {
  DeleteOutlined,
  UndoOutlined,
  SearchOutlined,
  ReloadOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;
const BLUE_PRIMARY = 'var(--premium-blue)';

export default function EscalationTrashPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { canReadEscalation, canDeleteEscalation, canUpdateEscalation } = usePermission();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);

  const { message } = App.useApp();

  const fetchTrashedEscalations = async () => {
    setLoading(true);
    try {
      const data = await EscalationServiceV2.getTrashEscalations();
      setEscalations(data || []);
    } catch (error) {
      console.error('Failed to fetch trashed escalations:', error);
      message.error('Failed to fetch trashed escalations.');
    } finally {
      setLoading(false);
    }
  };

  // Route Guard
  useEffect(() => {
    if (!authLoading && user && !canReadEscalation) {
      router.push('/dashboard');
    }
  }, [user, authLoading, canReadEscalation, router]);

  useEffect(() => {
    if (canReadEscalation) {
      fetchTrashedEscalations();
    }
  }, [canReadEscalation]);

  const handleRestore = async (id: string) => {
    setRestoringId(id);
    try {
      await EscalationServiceV2.restoreEscalation(id);
      message.success('Escalation restored successfully');
      setEscalations((prev) => prev.filter((e) => e.id !== id));
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch (error) {
      console.error('Failed to restore escalation:', error);
      message.error('Failed to restore escalation.');
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await EscalationServiceV2.permanentDeleteEscalation(id);
      message.success('Escalation permanently deleted');
      setEscalations((prev) => prev.filter((e) => e.id !== id));
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
    } catch (error) {
      console.error('Failed to permanently delete escalation:', error);
      message.error('Failed to permanently delete escalation.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyTrash = async () => {
    setEmptying(true);
    try {
      await EscalationServiceV2.emptyTrash();
      message.success('All trashed escalations have been permanently deleted');
      setEscalations([]);
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Failed to empty trash:', error);
      message.error('Failed to empty trash.');
    } finally {
      setEmptying(false);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const ids = selectedRowKeys as string[];
      await EscalationServiceV2.bulkRestore(ids);
      message.success(`${ids.length} escalations restored successfully`);
      setEscalations((prev) => prev.filter((e) => !ids.includes(e.id)));
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Failed to bulk restore:', error);
      message.error('Failed to restore selected escalations.');
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      const ids = selectedRowKeys as string[];
      await EscalationServiceV2.bulkPermanentDelete(ids);
      message.success(`${ids.length} escalations permanently deleted`);
      setEscalations((prev) => prev.filter((e) => !ids.includes(e.id)));
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      message.error('Failed to permanently delete selected escalations.');
    }
  };

  // Filter list
  const filteredEscalations = useMemo(() => {
    if (!searchQuery) return escalations;
    const q = searchQuery.toLowerCase();
    return escalations.filter((e) => {
      const subject = e.subject || e.short_summary || '';
      const catName = e.category?.name || e.category_name || '';
      const projName = e.project?.name || e.project_name || '';
      const members = e.targetMembers || [];
      return (
        subject.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        projName.toLowerCase().includes(q) ||
        members.some((m: any) => (m.user?.name || '').toLowerCase().includes(q))
      );
    });
  }, [escalations, searchQuery]);

  const isViewLoading = loading || authLoading || isRefreshing;

  // Column definitions
  const columns = [
    {
      title: 'Escalation',
      key: 'escalation',
      render: (record: any) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Text strong style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
            {record.subject || record.short_summary || 'No Subject'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {(record.category_name || record.category?.name || 'General').toUpperCase()}
          </Text>
        </div>
      ),
    },
    {
      title: 'Target Team Members',
      dataIndex: 'targetMembers',
      key: 'targetMembers',
      width: 220,
      render: (members: any[], record: any) => {
        const list = members || record.targetMembers || [];
        if (list.length === 0) return <Text type="secondary">—</Text>;
        if (list.length === 1) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" style={{ backgroundColor: BLUE_PRIMARY }}>
                {list[0].user?.name?.charAt(0) || 'U'}
              </Avatar>
              <Text style={{ fontSize: 13 }}>{list[0].user?.name || 'User'}</Text>
            </div>
          );
        }
        return (
          <Avatar.Group max={{ count: 3 }} size="small">
            {list.map((m: any, idx: number) => (
              <Tooltip title={m.user?.name} key={idx}>
                <Avatar style={{ backgroundColor: BLUE_PRIMARY }}>{m.user?.name?.charAt(0)}</Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority: any, record: any) => (
        <Tag color={record.priority_color || priority?.color || 'blue'} style={{ borderRadius: 4, fontWeight: 600 }}>
          {(record.priority_name || priority?.name || 'MEDIUM').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Raised By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 160,
      render: (user: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size="small">{user?.name?.charAt(0) || 'S'}</Avatar>
          <Text style={{ fontSize: 13 }}>{user?.name || 'System'}</Text>
        </div>
      ),
    },
    {
      title: 'Deleted At',
      dataIndex: 'deleted_at',
      key: 'deletedAt',
      width: 150,
      render: (date: string) => (
        <Tooltip title={date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : ''}>
          <Text style={{ fontSize: 13 }}>
            {date ? dayjs(date).format('MMM D, YYYY') : '—'}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: () => <Tag color="error">DELETED</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right' as const,
      width: 120,
      fixed: 'right' as const,
      render: (record: any) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {canUpdateEscalation && (
            <Tooltip title="Restore Escalation">
              <Button
                type="text"
                icon={<UndoOutlined style={{ color: '#52c41a' }} />}
                loading={restoringId === record.id}
                onClick={() => handleRestore(record.id)}
              />
            </Tooltip>
          )}
          {canDeleteEscalation && (
            <Popconfirm
              title="Permanently delete escalation?"
              description="This action cannot be undone. All associated data will be lost."
              onConfirm={() => handlePermanentDelete(record.id)}
              okText="Yes, delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deletingId === record.id }}
              icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
            >
              <Tooltip title="Permanent Delete">
                <Button
                  type="text"
                  icon={<DeleteOutlined style={{ color: '#ff4d4f' }} />}
                  loading={deletingId === record.id}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (!canReadEscalation) return null;

  return (
    <MainLayout>
      <div className="escalation-trash-container">
        <TimeTrackingHeader
          style={{
            padding: '9.5px 24px',
            margin: '0 -8px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: 20,
          }}
          icon={<InboxOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />}
          title="Escalation Trash Repository"
          description="Recover deleted escalations or permanently purge them from the system."
          extra={
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Input
                placeholder="Search escalations..."
                prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
                style={{
                  width: 240,
                  borderRadius: 8,
                  background: 'transparent',
                  borderColor: 'var(--border-color)',
                }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Tooltip title="Refresh view">
                <Button
                  icon={<ReloadOutlined spin={isRefreshing} />}
                  onClick={async () => {
                    setIsRefreshing(true);
                    await fetchTrashedEscalations();
                    setIsRefreshing(false);
                    message.success('Trash view refreshed');
                  }}
                  loading={isViewLoading}
                  style={{
                    borderRadius: 8,
                    background: 'transparent',
                    borderColor: 'var(--border-color)',
                  }}
                />
              </Tooltip>

              {canDeleteEscalation && (
                <Popconfirm
                  title="Empty trash repository?"
                  description="This will permanently delete all escalations currently in the trash. This action cannot be undone."
                  onConfirm={handleEmptyTrash}
                  okText="Yes, empty all"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true, loading: emptying }}
                  icon={<DeleteOutlined style={{ color: 'red' }} />}
                  disabled={filteredEscalations.length === 0 || isViewLoading}
                >
                  <Button
                    danger
                    type="primary"
                    icon={<DeleteOutlined />}
                    loading={emptying}
                    style={{ borderRadius: 8, height: 32 }}
                    disabled={filteredEscalations.length === 0 || isViewLoading}
                  >
                    Empty Trash
                  </Button>
                </Popconfirm>
              )}
            </div>
          }
        />

        <div style={{ padding: '0 24px', marginTop: 24 }}>
          {selectedRowKeys.length > 0 && (
            <div className="saas-bulk-actions">
              <div className="saas-bulk-content">
                <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#1890ff' }} />
                <Text strong style={{ marginLeft: 8 }}>Escalations Selected</Text>
              </div>
              <div className="saas-bulk-buttons">
                {canUpdateEscalation && (
                  <Button
                    type="text"
                    size="small"
                    icon={<UndoOutlined />}
                    onClick={handleBulkRestore}
                    className="saas-bulk-btn restore"
                  >
                    Restore
                  </Button>
                )}
                {canDeleteEscalation && (
                  <Popconfirm
                    title={`Purge ${selectedRowKeys.length} escalations?`}
                    description="This will permanently delete the selected escalations. This action cannot be undone."
                    onConfirm={handleBulkPermanentDelete}
                    okText="Purge Selected"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      className="saas-bulk-btn purge"
                    >
                      Purge
                    </Button>
                  </Popconfirm>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedRowKeys([])}
                  className="saas-bulk-btn cancel"
                />
              </div>
            </div>
          )}

          <Card
            styles={{ body: { padding: 0 } }}
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-pure-white)',
              transition: 'all 0.3s ease',
              boxShadow: 'var(--premium-shadow)',
            }}
          >
            <Table
              rowSelection={isViewLoading ? undefined : {
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
              }}
              dataSource={isViewLoading ? Array(5).fill({}) : filteredEscalations}
              columns={columns.map((col) => ({
                ...col,
                render: (text: any, record: any, index: number) => {
                  if (isViewLoading) {
                    return <Skeleton.Input active size="small" block style={{ height: 20 }} />;
                  }
                  return col.render ? (col.render as any)(text, record, index) : text;
                },
              }))}
              loading={false}
              rowKey={(record: any) => record.id || Math.random()}
              pagination={{ pageSize: 10, size: 'small' }}
              className="saas-table"
              scroll={{ x: 'max-content' }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<Text type="secondary">No escalations found in trash</Text>}
                  />
                ),
              }}
            />
          </Card>
        </div>

        <style jsx global>{`
          .escalation-trash-container {
            min-height: calc(100vh - 64px);
            background: var(--bg-primary);
            transition: background 0.3s ease;
          }
          
          .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            font-size: 12px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            font-weight: 700 !important;
            color: var(--text-slate-500) !important;
            border-bottom: 1px solid var(--border-color) !important;
          }

          .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--border-color) !important;
          }

          .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }

          [data-theme='dark'] .escalation-trash-container {
            background: #0B0F1A;
          }

          [data-theme='dark'] .ant-table-thead > tr > th {
            background: #161B22 !important;
            color: #94A3B8 !important;
            border-bottom-color: #1F2937 !important;
          }

          [data-theme='dark'] .ant-table-tbody > tr > td {
            border-bottom-color: #1F2937 !important;
          }

          [data-theme='dark'] .ant-table-tbody > tr:hover > td {
            background: #1F2937 !important;
          }

          [data-theme='dark'] .ant-card {
            background: #161B22 !important;
            border-color: #1F2937 !important;
          }

          .saas-bulk-actions {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 12px 20px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: var(--premium-shadow);
            animation: slideIn 0.3s ease-out;
          }

          .saas-bulk-content {
            display: flex;
            align-items: center;
          }

          .saas-bulk-buttons {
            display: flex;
            gap: 8px;
            align-items: center;
          }

          .saas-bulk-btn {
            border-radius: 6px !important;
            font-weight: 500 !important;
            font-size: 13px !important;
            height: 32px !important;
            padding: 4px 12px !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }

          .saas-bulk-btn.restore {
            color: #52c41a !important;
          }
          .saas-bulk-btn.restore:hover {
            background: #f6ffed !important;
          }

          .saas-bulk-btn.purge {
            color: #ff4d4f !important;
          }
          .saas-bulk-btn.purge:hover {
            background: #fff1f0 !important;
          }

          .saas-bulk-btn.cancel {
            color: var(--text-slate-400) !important;
          }
          .saas-bulk-btn.cancel:hover {
            background: var(--bg-slate-50) !important;
          }

          [data-theme='dark'] .saas-bulk-actions {
            background: #161B22;
            border-color: #1F2937;
          }
          [data-theme='dark'] .saas-bulk-btn.restore:hover {
            background: rgba(82, 196, 26, 0.1) !important;
          }
          [data-theme='dark'] .saas-bulk-btn.purge:hover {
            background: rgba(255, 77, 79, 0.1) !important;
          }
          [data-theme='dark'] .saas-bulk-btn.cancel:hover {
            background: #1F2937 !important;
          }

          @keyframes slideIn {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
