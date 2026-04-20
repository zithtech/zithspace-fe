'use client';

import React, { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Input,
  Badge,
  Card,
  Tooltip,
  Avatar,
  Dropdown,
  Tabs,
  Row,
  Col,
  Select,
  notification,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  MoreOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BugOutlined,
  CalendarOutlined,
  ProjectOutlined,
  UserOutlined,
  FileTextOutlined,
  HistoryOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleFilled,
  CloseCircleFilled
} from '@ant-design/icons';
import { Drawer, Divider, Descriptions } from 'antd';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';
import { EscalationSettingsService } from '@/services/escalationSettings';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const BLUE_PRIMARY = 'var(--premium-blue)';

export default function EscalationListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const [escalations, setEscalations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempStatus, setTempStatus] = useState<string>('');
  const [statuses, setStatuses] = useState<any[]>([]);
  const [notify, contextHolder] = notification.useNotification();

  const notifyPremium = (type: 'success' | 'error', title: string, description: string) => {
    notify[type]({
      message: <span className="premium-notif-title">{title}</span>,
      description: <span className="premium-notif-desc">{description}</span>,
      icon: type === 'success' ? <CheckCircleFilled style={{ color: '#10B981' }} /> : <CloseCircleFilled style={{ color: '#EF4444' }} />,
      className: 'premium-notification',
      placement: 'topRight',
      duration: 4,
    });
  };

  const fetchEscalations = async () => {
    setLoading(true);
    try {
      const [escData, statusData] = await Promise.all([
        EscalationServiceV2.getAllEscalations(),
        EscalationSettingsService.getStatuses()
      ]);
      console.log("Escalations Data:", escData);
      console.log("Statuses Data:", statusData);
      setEscalations(escData || []);
      setStatuses(statusData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, []);

  const handleUpdateStatus = async () => {
    if (!selectedEscalation || !tempStatus) return;

    setUpdating(true);
    try {
      await EscalationServiceV2.updateEscalation(selectedEscalation.id, { statusId: tempStatus } as any);
      notifyPremium('success', 'Status Updated', 'The escalation status has been successfully updated.');
      setDrawerVisible(false);
      fetchEscalations();
    } catch (error) {
      console.error('Failed to update status:', error);
      notifyPremium('error', 'Update Failed', 'Failed to update escalation status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await EscalationServiceV2.deleteEscalation(id);
      notifyPremium('success', 'Escalation Deleted', 'The escalation record has been permanently removed.');
      setEscalations(prev => prev.filter(e => e.id !== id));
      if (selectedEscalation?.id === id) {
        setDrawerVisible(false);
      }
    } catch (error) {
      console.error('Failed to delete escalation:', error);
      notifyPremium('error', 'Delete Failed', 'Failed to delete escalation. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const getPriorityTag = (priority: any) => {
    return (
      <Tag
        color={priority?.color || 'blue'}
        style={{ borderRadius: 4, fontWeight: 600, fontSize: 11 }}
      >
        {priority?.name?.toUpperCase() || 'MEDIUM'}
      </Tag>
    );
  };

  const filteredEscalations = escalations.filter(e => {
    // Search filter
    const subject = e.subject || e.short_summary || '';
    const catName = e.category?.name || e.category_name || '';
    const projName = e.project?.name || e.project_name || '';
    const members = e.targetMembers || [];

    const matchesSearch =
      subject.toLowerCase().includes(searchText.toLowerCase()) ||
      catName.toLowerCase().includes(searchText.toLowerCase()) ||
      projName.toLowerCase().includes(searchText.toLowerCase()) ||
      members.some((m: any) => (m.user?.name || '').toLowerCase().includes(searchText.toLowerCase()));

    if (!matchesSearch) return false;

    // Tab filter (Tab 2: My involvement, Tab 3: Raised by me)
    if (activeTab === '2') {
      return members.some((m: any) => m.user?.id === user?.id);
    } else if (activeTab === '3') {
      return (e.createdBy?.id || e.created_by_id) === user?.id;
    }

    return true;
  });

  const getStatusBadge = (record: any) => {
    const name = record.status_name || record.escalationStatus?.name || record.status;
    const color = record.status_color || record.escalationStatus?.color || BLUE_PRIMARY;

    if (!name) {
      return <Badge status="default" text="Unknown" />;
    }

    return (
      <Badge
        color={color}
        text={name}
        style={{ fontWeight: 500 }}
      />
    );
  };

  const getCategoryTag = (cat: any) => {
    return (
      <Tag
        color="blue"
        style={{
          borderRadius: 4,
          borderLeft: cat?.color ? `4px solid ${cat.color}` : 'none',
          background: 'var(--bg-slate-50)',
          color: 'var(--text-slate-600)',
          fontWeight: 500
        }}
        bordered={false}
      >
        {cat?.name || cat?.category_name || 'General'}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Subject & Category',
      dataIndex: 'subject',
      key: 'subject',
      render: (text: string, record: any) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 14 }}>{text || record.short_summary || 'No Subject'}</Text>
          {getCategoryTag(record.category || { name: record.category_name })}
        </Space>
      ),
    },
    {
      title: 'Target Team Members',
      dataIndex: 'targetMembers',
      key: 'targetMembers',
      render: (members: any[], record: any) => {
        const list = members || record.targetMembers || [];
        if (list.length === 0) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;

        if (list.length === 1) {
          return (
            <Space>
              <Avatar size="small" style={{ backgroundColor: BLUE_PRIMARY }}>
                {list[0].user?.name?.charAt(0)}
              </Avatar>
              <Text style={{ fontSize: 13 }}>{list[0].user?.name}</Text>
            </Space>
          );
        }
        return (
          <Avatar.Group maxCount={3} size="small" maxStyle={{ color: 'var(--text-slate-900)', backgroundColor: 'var(--bg-secondary)' }}>
            {list.map((m: any, idx: number) => (
              <Tooltip title={m.user?.name} key={idx}>
                <Avatar style={{ backgroundColor: BLUE_PRIMARY }}>
                  {m.user?.name?.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        );
      },
    },
    {
      title: 'Tickets',
      dataIndex: 'tickets',
      key: 'tickets',
      render: (tickets: any[]) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 150 }}>
          {tickets?.map((t, idx) => (
            <Tooltip title={t.ticket?.title} key={idx}>
              <Tag color="cyan" style={{ fontSize: 10, borderRadius: 4, margin: 0, padding: '0 4px', background: 'var(--bg-sky-50)', border: '1px solid var(--border-sky-100)', color: 'var(--text-sky-600)' }}>
                {t.ticket?.ticketNumber}
              </Tag>
            </Tooltip>
          ))}
          {(!tickets || tickets.length === 0) && <Text type="secondary" style={{ fontSize: 12 }}>—</Text>}
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: any, record: any) => getPriorityTag(priority || { name: record.priority_name }),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: any) => getStatusBadge(record),
    },
    {
      title: 'Raised By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: (user: any) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-slate-400)' }}>{user?.name?.charAt(0)}</Avatar>
          <Text type="secondary" style={{ color: 'var(--text-slate-400)' }}>{user?.name || 'System'}</Text>
        </Space>
      ),
    },
    {
      title: 'Raised Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string, record: any) => (
        <Tooltip title={dayjs(date || record.created_at).format('YYYY-MM-DD HH:mm:ss')}>
          <Text style={{ fontSize: 13, color: 'var(--text-slate-400)' }}>
            {dayjs(date || record.created_at).format('MMM D, YYYY')}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Edit / View Details">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: BLUE_PRIMARY }} />}
              onClick={() => {
                setSelectedEscalation(record);
                setTempStatus(record.statusId || record.status);
                setIsEditing(true);
                setDrawerVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Popconfirm
              title="Delete Escalation"
              description="Are you sure you want to delete this escalation? This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Yes, Delete"
              cancelText="No"
              okButtonProps={{ danger: true, loading: deleting === record.id }}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deleting === record.id}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const stats = [
    {
      label: 'Active Escalations',
      value: escalations.length,
      icon: <ExclamationCircleOutlined />,
      color: BLUE_PRIMARY
    },
    {
      label: 'High Priority',
      value: escalations.filter(e => {
        const weight = e.priority_weight || e.priority?.weight || 0;
        const name = (e.priority_name || e.priority?.name || '').toLowerCase();
        return weight >= 80 || name === 'high' || name === 'urgent';
      }).length,
      icon: <BugOutlined />,
      color: '#ef4444'
    },
    {
      label: 'Pending Reviews',
      value: escalations.filter(e => e.escalationStatus?.isDefault).length,
      icon: <ClockCircleOutlined />,
      color: '#f59e0b'
    },
    {
      label: 'Total Resolved',
      value: escalations.filter(e => e.escalationStatus?.isFinal).length,
      icon: <CheckCircleOutlined />,
      color: '#10b981'
    },
  ];

  return (
    <MainLayout>
      <div style={{ 
        margin: "0 -24px", 
        padding: "24px 32px", 
        background: "var(--bg-pure-white)", 
        minHeight: "calc(100vh - 64px)" 
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <AlertOutlined style={{ fontSize: 24, color: BLUE_PRIMARY }} />
                <Title level={2} style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: 'var(--text-slate-900)' }}>
                  Quality & Performance Escalations
                </Title>
              </div>
              <Text type="secondary" style={{ fontSize: 16, maxWidth: 800, lineHeight: 1.5, display: 'block', color: 'var(--text-slate-400)' }}>
                Monitor and resolve manual escalations related to deployment quality and team regressions.
              </Text>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={() => router.push('/escalations/create')}
              style={{ borderRadius: 8, height: 44, fontWeight: 600, background: BLUE_PRIMARY, border: 'none' }}
            >
              Raise Manual Escalation
            </Button>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
            {stats.map((stat, idx) => (
              <Card key={idx} style={{ flex: 1, borderRadius: 16, border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)', boxShadow: 'var(--card-shadow)' }} bodyStyle={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-slate-400)' }}>{stat.label}</Text>
                    <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: 'var(--text-slate-900)' }}>
                      {loading ? '...' : stat.value.toString().padStart(2, '0')}
                    </div>
                  </div>
                  <div style={{ backgroundColor: `${stat.color}10`, padding: 12, borderRadius: 12 }}>
                    {React.cloneElement(stat.icon as React.ReactElement, { style: { color: stat.color, fontSize: 20 } })}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: '1', label: <span style={{ color: activeTab === '1' ? 'var(--premium-blue)' : 'var(--text-slate-600)' }}>All Escalations</span> },
              { key: '2', label: <span style={{ color: activeTab === '2' ? 'var(--premium-blue)' : 'var(--text-slate-600)' }}>My Escalations</span> },
              { key: '3', label: <span style={{ color: activeTab === '3' ? 'var(--premium-blue)' : 'var(--text-slate-600)' }}>Raised by Me</span> },
            ]}
          />

          {/* Filter Bar */}
          <Card style={{ marginBottom: 24, border: '1px solid var(--border-slate-200)', borderRadius: '0 16px 16px 16px', background: 'var(--bg-pure-white)' }} bodyStyle={{ padding: '10px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={16}>
                <Input
                  placeholder="Search by subject, target or category..."
                  prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
                  style={{ width: 360, borderRadius: 8, height: 40, background: 'var(--bg-secondary)', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-900)' }}
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                />
                <Button icon={<FilterOutlined />} style={{ borderRadius: 8, height: 40 }}>Filters</Button>
              </Space>
              <Space>
                <Text type="secondary" style={{ color: 'var(--text-slate-400)' }}>Sort by:</Text>
                <Dropdown menu={{ items: [{ key: '1', label: 'Recent First' }, { key: '2', label: 'Priority' }] }}>
                  <Button style={{ borderRadius: 8, height: 40, background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-600)' }}>Recent First</Button>
                </Dropdown>
              </Space>
            </div>
          </Card>

          {/* Table */}
          <Card style={{ borderRadius: 16, border: '1px solid var(--border-slate-200)', overflow: 'hidden', background: 'var(--bg-pure-white)' }} bodyStyle={{ padding: 0 }}>
            <Table
              columns={columns}
              dataSource={filteredEscalations}
              pagination={{ pageSize: 10 }}
              rowKey="id"
              loading={loading}
              className="premium-table"
              onRow={(record) => ({
                onClick: () => {
                  setSelectedEscalation(record);
                  setTempStatus(record.statusId || record.status);
                  setIsEditing(false);
                  setDrawerVisible(true);
                },
                style: { cursor: 'pointer' }
              })}
            />
          </Card>
        </div>

        {/* Escalation Detail Drawer */}
        <Drawer
          title={
            <Space direction="vertical" size={2}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertOutlined style={{ color: BLUE_PRIMARY }} />
                <Title level={4} style={{ margin: 0, color: 'var(--text-slate-900)' }}>Escalation Details</Title>
              </div>
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-slate-400)' }}>
                ID: {selectedEscalation?.id?.split('-')[0].toUpperCase()} • Raised on {dayjs(selectedEscalation?.created_at || selectedEscalation?.createdAt).format('MMM D, YYYY at HH:mm')}
              </Text>
            </Space>
          }
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          width={600}
          headerStyle={{ borderBottom: '1px solid var(--border-slate-100)', padding: '16px 24px', background: 'var(--bg-pure-white)' }}
          bodyStyle={{ padding: 0, background: 'var(--bg-pure-white)' }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              {isEditing ? (
                <>
                  <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button
                    type="primary"
                    loading={updating}
                    onClick={handleUpdateStatus}
                    style={{ background: BLUE_PRIMARY }}
                  >
                    Update Status
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => setDrawerVisible(false)}>Close</Button>
                  <Button
                    type="primary"
                    onClick={() => setIsEditing(true)}
                    style={{ background: BLUE_PRIMARY }}
                  >
                    Edit
                  </Button>
                </>
              )}
            </div>
          }
          footerStyle={{ borderTop: '1px solid var(--border-slate-100)', padding: '12px 24px', background: 'var(--bg-pure-white)' }}
        >
          {selectedEscalation && (
            <div style={{ padding: '24px' }}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>

                {/* Header Info */}
                <Card bodyStyle={{ padding: '12px 18px', background: 'var(--bg-slate-50)', border: '1px solid var(--border-slate-200)', borderRadius: 12 }}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate-400)' }}>Subject</Text>
                      <Title level={4} style={{ margin: '2px 0 0 0', fontWeight: 700, color: 'var(--text-slate-900)' }}>{selectedEscalation.subject || selectedEscalation.short_summary}</Title>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ flex: 1 }}>
                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}>Current Status</Text>
                        <div style={{ marginTop: 4 }}>
                          {isEditing ? (
                            <Select
                              value={tempStatus}
                              onChange={setTempStatus}
                              style={{ width: '100%' }}
                              options={statuses.map(s => ({
                                label: (
                                  <Space>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color || BLUE_PRIMARY }} />
                                    {s.name}
                                  </Space>
                                ),
                                value: s.id
                              }))}
                            />
                          ) : (
                            getStatusBadge(selectedEscalation)
                          )}
                        </div>
                      </div>
                      <div>
                        <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}>Priority</Text>
                        <div style={{ marginTop: 4 }}>{getPriorityTag(selectedEscalation.priority || { name: selectedEscalation.priority_name })}</div>
                      </div>
                    </div>
                  </Space>
                </Card>

                {/* Grid Info */}
                <Row gutter={[24, 24]}>
                  <Col span={12}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}>
                        <ProjectOutlined /> Category
                      </Text>
                      {getCategoryTag(selectedEscalation.category || { name: selectedEscalation.category_name })}
                    </Space>
                  </Col>
                  <Col span={12}>
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-slate-400)' }}>
                        <PlusOutlined /> Related Project
                      </Text>
                      <Text strong style={{ fontSize: 13, color: 'var(--text-slate-900)' }}>{selectedEscalation.project?.name || 'N/A'}</Text>
                    </Space>
                  </Col>
                </Row>

                <Divider style={{ margin: 0 }} />

                {/* Description */}
                <div>
                  <Space align="center" style={{ marginBottom: 8 }}>
                    <FileTextOutlined style={{ color: BLUE_PRIMARY, fontSize: 14 }} />
                    <Text strong style={{ fontSize: 14, color: 'var(--text-slate-900)' }}>Detailed Description</Text>
                  </Space>
                  <div style={{
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-slate-200)',
                    borderRadius: 10,
                    fontSize: 13,
                    lineHeight: '1.5',
                    color: 'var(--text-slate-700)',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedEscalation.description || selectedEscalation.detailed_description}
                  </div>
                </div>

                {/* Linked Tickets */}
                {selectedEscalation.tickets?.length > 0 && (
                  <div>
                    <Space align="center" style={{ marginBottom: 10 }}>
                      <BugOutlined style={{ color: BLUE_PRIMARY, fontSize: 13 }} />
                      <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate-400)' }}>Linked Development Tickets</Text>
                    </Space>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedEscalation.tickets.map((t: any, idx: number) => (
                        <Tag key={idx} color="blue" bordered={false} style={{ borderRadius: 4, margin: 0, padding: '4px 8px', background: 'var(--bg-blue-50)', border: '1px solid var(--border-slate-200)' }}>
                          <Space size={4}>
                            <Text strong style={{ fontSize: 11, color: 'var(--premium-blue)' }}>{t.ticket?.ticketNumber}</Text>
                            <Text style={{ fontSize: 11, color: 'var(--text-slate-600)' }}>{t.ticket?.title}</Text>
                          </Space>
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* Target Members */}
                <div>
                  <Space align="center" style={{ marginBottom: 10 }}>
                    <UserOutlined style={{ color: BLUE_PRIMARY, fontSize: 13 }} />
                    <Text strong style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-slate-400)' }}>Target Team Members</Text>
                  </Space>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedEscalation.targetMembers?.map((m: any, idx: number) => (
                      <div key={idx} style={{
                        padding: '4px 10px 4px 4px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-slate-200)',
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                      }}>
                        <Avatar size={24} style={{ backgroundColor: BLUE_PRIMARY, fontSize: 10 }}>
                          {m.user?.name?.charAt(0)}
                        </Avatar>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Text strong style={{ fontSize: 12, color: 'var(--text-slate-700)' }}>{m.user?.name}</Text>
                          <Text style={{ fontSize: 10, color: 'var(--text-slate-400)', background: 'var(--bg-slate-50)', padding: '2px 6px', borderRadius: 10, fontWeight: 500 }}>
                            {m.user?.position?.title || 'Member'}
                          </Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Creator Audit */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-slate-50)', borderRadius: 10 }}>
                  <Space size={10}>
                    <Avatar size="small" src={selectedEscalation.createdBy?.avatar} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-slate-400)' }}>
                      {selectedEscalation.createdBy?.name?.charAt(0)}
                    </Avatar>
                    <div>
                      <Text type="secondary" style={{ fontSize: 10, display: 'block', color: 'var(--text-slate-400)' }}>Raised By</Text>
                      <Text strong style={{ fontSize: 12, color: 'var(--text-slate-900)' }}>{selectedEscalation.createdBy?.name || 'System / Not found'}</Text>
                    </div>
                  </Space>
                  <Space size={10}>
                    <HistoryOutlined style={{ color: 'var(--text-slate-400)', fontSize: 14 }} />
                    <div>
                      <Text type="secondary" style={{ fontSize: 10, display: 'block', color: 'var(--text-slate-400)' }}>Last Updated</Text>
                      <Text strong style={{ fontSize: 12, color: 'var(--text-slate-900)' }}>{dayjs(selectedEscalation.updatedAt || selectedEscalation.updated_at).fromNow()}</Text>
                    </div>
                  </Space>
                </div>
              </Space>
            </div>
          )}
        </Drawer>

        <style jsx global>{`
          .premium-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-400) !important;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
            border-bottom: 2px solid var(--border-slate-100) !important;
          }
          .premium-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--border-slate-100);
            padding: 10px 16px;
            color: var(--text-slate-900);
          }
          .premium-table .ant-table-row:hover > td {
            background: var(--bg-slate-50) !important;
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
