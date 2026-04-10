"use client";

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Input,
  Select,
  Row,
  Col,
  Space,
  Table,
  Tag,
  Avatar,
  message,
  Empty,
  Tooltip,
  Card,
  Alert
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { Squad, SquadService } from '@/services/squadService';
import SquadCard from '@/components/squad/SquadCard';
import SquadDrawer from '@/components/squad/SquadDrawer';
import SquadViewDrawer from '@/components/squad/SquadViewDrawer';
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const { Title, Text } = Typography;
const { Option } = Select;

export default function SquadManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [filteredSquads, setFilteredSquads] = useState<Squad[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawers
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null);

  useEffect(() => {
    if (user) {
      fetchSquads();
    }
  }, [user]);

  useEffect(() => {
    filterSquads();
  }, [squads, searchTerm, statusFilter]);


  const fetchSquads = async () => {
    try {
      setLoading(true);
      const data = await SquadService.getSquads();
      setSquads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch squads');
    } finally {
      setLoading(false);
    }
  };

  const filterSquads = () => {
    let filtered = [...squads];

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.squadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.squadCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'archived') {
        filtered = filtered.filter(s => s.isArchived);
      } else if (statusFilter === 'active') {
        filtered = filtered.filter(s => s.squadStatus && !s.isArchived);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(s => !s.squadStatus && !s.isArchived);
      }
    }

    setFilteredSquads(filtered);
  };

  const handleCreate = () => {
    setCurrentSquad(null);
    setDrawerVisible(true);
  };

  const handleManage = (squad: Squad) => {
    setCurrentSquad(squad);
    setDrawerVisible(true);
  };

  const handleOpen = (squad: Squad) => {
    setCurrentSquad(squad);
    setViewDrawerVisible(true);
  };

  const columns = [
    {
      title: 'Squad Name',
      dataIndex: 'squadName',
      key: 'squadName',
      width: 250,
      render: (text: string, record: Squad) => (
        <Space>
          <div style={{ backgroundColor: 'var(--bg-secondary)', width: 32, height: 32, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TeamOutlined style={{ color: 'var(--premium-blue)' }} />
          </div>
          <Space direction="vertical" size={0}>
            <Text strong style={{ fontSize: '14px', color: 'var(--text-slate-900)' }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: '11px', color: 'var(--text-slate-400)' }}>{record.squadCode}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Heads',
      key: 'heads',
      render: (record: Squad) => (
        <Avatar.Group maxCount={2} size="small">
          {record.squadMembers?.filter(m => m.memberType === 'HEAD').map(m => (
            <Tooltip key={m.id} title={`${m.member.name} (Head)`}>
              <Avatar style={{ backgroundColor: '#52c41a' }}>{m.member.name.substring(0, 1).toUpperCase()}</Avatar>
            </Tooltip>
          ))}
        </Avatar.Group>
      ),
    },
    {
      title: 'Members',
      key: 'membersCount',
      render: (record: Squad) => (
        <Space size={4}>
          <UserOutlined style={{ color: 'var(--text-slate-400)', fontSize: '12px' }} />
          <Text style={{ fontSize: '13px', color: 'var(--text-slate-700)' }}>{record.squadMembers?.length || 0}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'squadStatus',
      key: 'status',
      render: (status: boolean, record: Squad) => {
        if (record.isArchived) return <Tag color="warning" bordered={false} style={{ borderRadius: '12px' }}>Archived</Tag>;
        return (
          <Tag
            color={status ? 'success' : 'error'}
            bordered={false}
            style={{ borderRadius: '12px', padding: '0 10px' }}
          >
            {status ? 'Active' : 'Inactive'}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      align: 'right' as const,
      render: (record: Squad) => (
        <Space>
          <Tooltip title="View Details">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => handleOpen(record)} />
          </Tooltip>
          <Tooltip title="Manage Squad">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleManage(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
          <LoadingSpinner message="Authenticating..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: '24px', background: 'var(--bg-pure-white)', minHeight: '100%' }}>
        {/* Top Header Section */}
        <div style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space size={16} align="start">
                <div style={{
                  backgroundColor: 'var(--bg-pure-white)',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-slate-200)',
                  boxShadow: 'var(--card-shadow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TeamOutlined style={{ fontSize: '28px', color: 'var(--premium-blue)' }} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 600, color: 'var(--text-slate-900)' }}>Squad Management</Title>
                  <Text type="secondary" style={{ fontSize: '14px', color: 'var(--text-slate-400)' }}>
                    Configure and manage project teams, leadership roles, and member allocations.
                  </Text>
                </div>
              </Space>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={handleCreate}
                style={{
                  borderRadius: '10px',
                  height: '44px',
                  padding: '0 24px',
                  fontWeight: 500,
                  boxShadow: '0 4px 10px rgba(24, 144, 255, 0.2)'
                }}
              >
                Create Squad
              </Button>
            </Col>
          </Row>
        </div>

        {/* Filter Section - Premium Card Style */}
        <Card
          size="small"
          bordered={false}
          style={{
            marginBottom: '16px',
            borderRadius: '12px',
            background: 'var(--bg-pure-white)',
            border: '1px solid var(--border-slate-200)',
          }}
          styles={{ body: { padding: '16px 20px' } }}
        >
          <Row gutter={24} align="middle">
            <Col flex="auto">
              <Space size={20}>
                <div style={{ width: '320px' }}>
                  <Input
                    prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', marginRight: '8px' }} />}
                    placeholder="Search Squad by Name or Code"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderRadius: '8px', height: '36px', background: 'var(--bg-secondary)', border: '1px solid var(--border-slate-200)', color: 'var(--text-slate-900)' }}
                    allowClear
                  />
                </div>
                <Select
                  placeholder="All Status"
                  style={{ width: '180px' }}
                  value={statusFilter}
                  onChange={setStatusFilter}
                  allowClear
                  className="status-filter-select"
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active Squads</Option>
                  <Option value="inactive">Inactive Squads</Option>
                  <Option value="archived">Archived</Option>
                </Select>
              </Space>
            </Col>
            <Col>
              <Space align="center" size={12}>
                <Text type="secondary" style={{ fontSize: '13px', color: 'var(--text-slate-400)' }}>View:</Text>
                <div style={{ background: 'var(--bg-slate-50)', padding: '3px', borderRadius: '8px', display: 'flex', border: '1px solid var(--border-slate-200)' }}>
                  <Button
                    type={viewMode === 'grid' ? 'primary' : 'text'}
                    size="small"
                    icon={<AppstoreOutlined />}
                    onClick={() => setViewMode('grid')}
                    style={{
                      borderRadius: '6px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: viewMode === 'grid' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                  />
                  <Button
                    type={viewMode === 'list' ? 'primary' : 'text'}
                    size="small"
                    icon={<BarsOutlined />}
                    onClick={() => setViewMode('list')}
                    style={{
                      borderRadius: '6px',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: viewMode === 'list' ? 'var(--premium-blue)' : 'transparent',
                      color: viewMode === 'list' ? '#fff' : 'var(--text-slate-600)',
                      boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                    }}
                  />
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Content Area */}
        <div className="squad-content-area">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <LoadingSpinner message="Fetching squads..." />
            </div>
          ) : filteredSquads.length === 0 ? (
            <Card bordered={false} style={{ borderRadius: '12px', textAlign: 'center', padding: '60px 0', border: '1px solid var(--border-slate-200)', background: 'var(--bg-pure-white)' }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: 'var(--text-slate-400)' }}>
                    {searchTerm || statusFilter !== 'all' ? "No squads match your current filters" : "No squads available yet"}
                  </span>
                }
              >
                {!searchTerm && statusFilter === 'all' && (
                  <Button type="primary" onClick={handleCreate}>Create First Squad</Button>
                )}
              </Empty>
            </Card>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <Row gutter={[20, 20]}>
                  {filteredSquads.map(squad => (
                    <Col key={squad.id} xs={24} sm={12} lg={8} xl={6}>
                      <SquadCard
                        squad={squad}
                        onOpen={handleOpen}
                        onManage={handleManage}
                        onRefresh={fetchSquads}
                      />
                    </Col>
                  ))}
                </Row>
              ) : (
                <Card bordered={false} style={{ borderRadius: '12px', overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
                  <Table
                    dataSource={filteredSquads}
                    columns={columns}
                    rowKey="id"
                    style={{ background: 'var(--bg-pure-white)' }}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      position: ['bottomRight']
                    }}
                    className="premium-table"
                  />
                </Card>
              )}
            </>
          )}
        </div>

        {/* Drawers */}
        <SquadDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          onSuccess={fetchSquads}
          initialData={currentSquad}
        />

        <SquadViewDrawer
          visible={viewDrawerVisible}
          onClose={() => setViewDrawerVisible(false)}
          squad={currentSquad}
        />
      </div>
    </MainLayout>
  );
}
