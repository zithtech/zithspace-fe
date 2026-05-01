"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Typography,
  Button,
  Input,
  Select,
  Row,
  Col,
  Space,
  Table,
  Avatar,
  message,
  Tooltip,
  Card,
} from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  UserOutlined,
  EyeOutlined,
  EditOutlined,
  CrownOutlined,
  StarOutlined,
  InboxOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { Squad, SquadService } from '@/services/squadService';
import SquadCard from '@/components/squad/SquadCard';
import SquadDrawer from '@/components/squad/SquadDrawer';
import SquadViewDrawer from '@/components/squad/SquadViewDrawer';
import { TimeTrackingHeader } from '@/components/time-tracking/TimeTrackingHeader';
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const { Text } = Typography;
const { Option } = Select;

type StatTone = 'blue' | 'green' | 'amber' | 'purple';

interface StatCardConfig {
  key: string;
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: StatTone;
  hint?: string;
}

export default function SquadManagement() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [filteredSquads, setFilteredSquads] = useState<Squad[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.squadName.toLowerCase().includes(q) ||
        s.squadCode.toLowerCase().includes(q)
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

  const stats = useMemo<StatCardConfig[]>(() => {
    const totalSquads = squads.length;
    const activeSquads = squads.filter(s => s.squadStatus && !s.isArchived).length;
    const archivedSquads = squads.filter(s => s.isArchived).length;
    const totalMembers = squads.reduce((sum, s) => {
      const ids = new Set(s.squadMembers?.map(m => m.squadMemberId));
      return sum + ids.size;
    }, 0);
    const totalLeads = squads.reduce(
      (sum, s) => sum + (s.squadMembers?.filter(m => m.memberType === 'HEAD' || m.memberType === 'SUB_HEAD').length || 0),
      0
    );

    return [
      {
        key: 'total',
        label: 'Total Squads',
        value: totalSquads,
        icon: <RocketOutlined />,
        tone: 'blue',
        hint: `${activeSquads} active`,
      },
      {
        key: 'active',
        label: 'Active Squads',
        value: activeSquads,
        icon: <StarOutlined />,
        tone: 'green',
      },
      {
        key: 'leads',
        label: 'Leadership',
        value: totalLeads,
        icon: <CrownOutlined />,
        tone: 'amber',
        hint: 'Heads + Sub-Heads',
      },
      {
        key: 'members',
        label: 'Total Members',
        value: totalMembers,
        icon: <TeamOutlined />,
        tone: 'purple',
        hint: archivedSquads ? `${archivedSquads} archived` : undefined,
      },
    ];
  }, [squads]);

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
      title: 'Squad',
      dataIndex: 'squadName',
      key: 'squadName',
      width: 280,
      render: (text: string, record: Squad) => {
        const initials = text.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
        return (
          <Space size={12}>
            <div className="squad-card-v2__avatar" style={{ width: 38, height: 38, fontSize: 14 }}>
              {initials || <TeamOutlined />}
            </div>
            <Space direction="vertical" size={2}>
              <Text strong style={{ fontSize: '14px', color: 'var(--text-slate-900)' }}>{text}</Text>
              <span className="squad-card-v2__code" style={{ marginTop: 0 }}>{record.squadCode}</span>
            </Space>
          </Space>
        );
      },
    },
    {
      title: 'Heads',
      key: 'heads',
      render: (record: Squad) => {
        const heads = record.squadMembers?.filter(m => m.memberType === 'HEAD') || [];
        if (heads.length === 0) return <Text style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>—</Text>;
        return (
          <Avatar.Group max={{ count: 3 }} size="small">
            {heads.map(m => (
              <Tooltip key={m.id} title={`${m.member.name} • Head`}>
                <Avatar style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontWeight: 600, fontSize: 11 }}>
                  {m.member.name.substring(0, 2).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
          </Avatar.Group>
        );
      },
    },
    {
      title: 'Members',
      key: 'membersCount',
      render: (record: Squad) => {
        const total = record.squadMembers?.length || 0;
        return (
          <Space size={6}>
            <UserOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />
            <Text style={{ fontSize: '13px', color: 'var(--text-slate-700)', fontWeight: 600 }}>{total}</Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'squadStatus',
      key: 'status',
      render: (status: boolean, record: Squad) => {
        const cls = record.isArchived
          ? 'squad-status--archived'
          : status
            ? 'squad-status--active'
            : 'squad-status--inactive';
        const label = record.isArchived ? 'Archived' : status ? 'Active' : 'Inactive';
        return (
          <span className={`squad-card-v2__status ${cls}`}>
            <span className="squad-status-dot" />
            {label}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'right' as const,
      render: (record: Squad) => (
        <Space>
          <Tooltip title="View details">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => handleOpen(record)} />
          </Tooltip>
          <Tooltip title="Manage squad">
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleManage(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (authLoading) {
    return (
      <MainLayout>
        <div className="squad-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <LoadingSpinner message="Authenticating system entrance..." />
        </div>
      </MainLayout>
    );
  }

  const renderSkeletonGrid = () => (
    <Row gutter={[20, 20]}>
      {Array.from({ length: 8 }).map((_, i) => (
        <Col key={i} xs={24} sm={12} lg={8} xl={6}>
          <div className="squad-skel-card">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
              <div className="squad-skel-bar" style={{ width: 46, height: 46, borderRadius: 12 }} />
              <div style={{ flex: 1 }}>
                <div className="squad-skel-bar" style={{ width: '60%', height: 14, marginBottom: 8 }} />
                <div className="squad-skel-bar" style={{ width: '40%', height: 10 }} />
              </div>
            </div>
            <div className="squad-skel-bar" style={{ width: '100%', height: 36, marginBottom: 8 }} />
            <div className="squad-skel-bar" style={{ width: '100%', height: 36, marginBottom: 8 }} />
            <div className="squad-skel-bar" style={{ width: '100%', height: 36 }} />
          </div>
        </Col>
      ))}
    </Row>
  );

  return (
    <MainLayout>
      <div className="squad-shell">
        <TimeTrackingHeader
          icon={<TeamOutlined style={{ fontSize: 20, color: '#8b5cf6' }} />}
          title="Squad Management"
          description="Configure and manage project teams, leadership roles, and member allocations."
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
              style={{
                borderRadius: '10px',
                height: '40px',
                padding: '0 22px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                border: 'none',
                boxShadow: '0 8px 18px -8px rgba(37, 99, 235, 0.55)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Create Squad
            </Button>
          }
        />

        <div className="squad-content">
          {/* Stats Overview */}
          <div className="squad-stats-row">
            {stats.map(s => (
              <div key={s.key} className={`squad-stat-card is-${s.tone}`}>
                <div className="squad-stat-card__icon">{s.icon}</div>
                <div className="squad-stat-card__label">{s.label}</div>
                <div className="squad-stat-card__value">
                  {s.value.toLocaleString()}
                  {s.hint && <span className="squad-stat-card__delta">{s.hint}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="squad-toolbar">
            <div className="squad-toolbar__left">
              <Input
                className="squad-search"
                prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', marginRight: 8 }} />}
                placeholder="Search by squad name or code…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />
              <Select
                className="squad-status-pill"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ minWidth: 180 }}
                suffixIcon={null}
              >
                <Option value="all">All Statuses</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
                <Option value="archived">Archived</Option>
              </Select>
              <Text style={{ fontSize: 12, color: 'var(--text-slate-400)', marginLeft: 4 }}>
                {filteredSquads.length} of {squads.length}
              </Text>
            </div>

            <div className="squad-view-switch">
              <Tooltip title="Grid view">
                <button
                  className={viewMode === 'grid' ? 'is-active' : ''}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <AppstoreOutlined />
                </button>
              </Tooltip>
              <Tooltip title="List view">
                <button
                  className={viewMode === 'list' ? 'is-active' : ''}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <BarsOutlined />
                </button>
              </Tooltip>
            </div>
          </div>

          {/* Content */}
          <div className="squad-content-area">
            {loading ? (
              viewMode === 'grid' ? (
                renderSkeletonGrid()
              ) : (
                <div style={{ textAlign: 'center', padding: '80px 0' }}>
                  <LoadingSpinner message="Fetching squads..." />
                </div>
              )
            ) : filteredSquads.length === 0 ? (
              <div className="squad-empty">
                <div className="squad-empty__illustration">
                  {searchTerm || statusFilter !== 'all' ? <SearchOutlined /> : <InboxOutlined />}
                </div>
                <div className="squad-empty__title">
                  {searchTerm || statusFilter !== 'all' ? 'No squads match your filters' : 'No squads yet'}
                </div>
                <div className="squad-empty__sub">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your search or status filter to find what you’re looking for.'
                    : 'Create your first squad to start organising teams, leadership, and project allocations.'}
                </div>
                {!searchTerm && statusFilter === 'all' && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={handleCreate}
                    style={{
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      border: 'none',
                      fontWeight: 600,
                      height: 42,
                      padding: '0 22px',
                      boxShadow: '0 8px 18px -8px rgba(37, 99, 235, 0.55)',
                    }}
                  >
                    Create First Squad
                  </Button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <Row gutter={[20, 20]} className="squad-grid">
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
              <Card
                bordered={false}
                style={{
                  borderRadius: 14,
                  overflow: 'hidden',
                  border: '1px solid var(--border-slate-200)',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.03)',
                }}
                styles={{ body: { padding: 0 } }}
              >
                <Table
                  dataSource={filteredSquads}
                  columns={columns}
                  rowKey="id"
                  style={{ background: 'var(--bg-pure-white)' }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    position: ['bottomRight'],
                  }}
                  className="premium-table"
                />
              </Card>
            )}
          </div>

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
            onManage={handleManage}
          />
        </div>
      </div>
    </MainLayout>
  );
}
