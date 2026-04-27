"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Briefcase,
  Plus,
  Search,
  CheckCircle2,
  Settings2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Clock,
  Link as LinkIcon,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  User,
  PlusCircle,
  X,
  ExternalLink,
  AlertCircle,
  Eye,
  Filter,
  RefreshCw,
  ShieldCheck,
  Zap,
  Sparkles,
  MoreVertical,
  ChevronRight,
  Edit2
} from "lucide-react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Drawer,
  notification,
  Space,
  Row,
  Col,
  Typography,
  Tooltip,
  Popconfirm,
  InputNumber,
  Divider,
  DatePicker,
  Avatar,
  Empty,
  Spin,
  Tabs,
  Dropdown,
  Modal,
  type MenuProps
} from "antd";
import dayjs from "dayjs";
import { useLeads } from "@/hooks/useLeads";
import { useLeadSettings } from "@/hooks/useLeadSettings";
import { Lead } from "@/services/leadService";
import {
  ClockCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  UserOutlined,
  FileOutlined,
  CalendarOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  SendOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { TextArea } = Input;
const { Text, Title } = Typography;

export default function LeadsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [modal, modalContextHolder] = Modal.useModal();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Use the custom hook for backend connectivity
  const { leads, loading: leadsLoading, error, fetchLeads, createLead, updateLead, deleteLead } = useLeads();
  const { statuses: configStatuses, actions: configActions, fetchStatuses, fetchActions, loading: settingsLoading } = useLeadSettings();

  const loading = leadsLoading || settingsLoading;

  const handleView = (record: Lead) => {
    router.push(`/leads/view/${record.id}`);
  };

  // Load leads and settings on component mount
  useEffect(() => {
    fetchLeads();
    fetchStatuses();
    fetchActions();
  }, [fetchLeads, fetchStatuses, fetchActions]);

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      api.error({
        message: "API Error",
        description: error,
      });
    }
  }, [error, api]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLead(leadId, { status: newStatus });
      api.success({ message: 'Status Updated', placement: 'topRight' });
    } catch (error) {
      api.error({ message: 'Failed to update status', placement: 'topRight' });
    }
  };

  const handleActionChange = async (leadId: string, newAction: string) => {
    try {
      await updateLead(leadId, { actions: newAction });
      api.success({ message: 'Action Updated', placement: 'topRight' });
    } catch (error) {
      api.error({ message: 'Failed to update action', placement: 'topRight' });
    }
  };

  const renderActionIcon = (iconName: string) => {
    switch (iconName) {
      case 'phone': return <PhoneOutlined />;
      case 'mail': return <MailOutlined />;
      case 'clock': return <ClockCircleOutlined />;
      case 'user': return <UserOutlined />;
      case 'file': return <FileOutlined />;
      case 'calendar': return <CalendarOutlined />;
      case 'message': return <MessageOutlined />;
      case 'video': return <VideoCameraOutlined />;
      case 'check': return <CheckCircleOutlined />;
      case 'close': return <CloseCircleOutlined />;
      case 'team': return <TeamOutlined />;
      case 'send': return <SendOutlined />;
      case 'link': return <LinkOutlined />;
      default: return null;
    }
  };

  const columns = [
    {
      title: "Lead Title",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Lead) => (
        <div>
          <Text strong style={{ display: "block", color: "var(--text-slate-900)", fontSize: 14 }}>{text}</Text>
          <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{record.client_name}</Text>
        </div>
      ),
    },
    {
      title: "Platform",
      dataIndex: "platform",
      key: "platform",
      width: 120,
      render: (platform: string) => (
        <Tag color={
          platform === 'Upwork' ? 'green' :
            platform === 'LinkedIn' ? 'blue' :
              platform === 'Freelancer' ? 'cyan' :
                platform === 'Fiverr' ? 'orange' : 'default'
        } style={{ borderRadius: 6 }}>
          {platform || 'Upwork'}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: string, record: Lead) => (
        <Select
          value={status}
          style={{ width: '100%' }}
          bordered={false}
          className="status-select-premium"
          onChange={(value) => handleStatusChange(record.id, value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          dropdownMatchSelectWidth={false}
          suffixIcon={<ChevronRight size={14} color="#94a3b8" />}
        >
          {configStatuses.map(s => (
            <Select.Option key={s.id} value={s.name}>
              <Tag style={{
                backgroundColor: `${s.color || '#6366f1'}12`,
                color: s.color || '#6366f1',
                border: `1px solid ${s.color || '#6366f1'}25`,
                fontWeight: 800,
                borderRadius: 8,
                padding: "2px 12px",
                fontSize: 10,
                letterSpacing: "0.03em",
                margin: 0,
                textTransform: 'uppercase'
              }}>
                {s.name}
              </Tag>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Action",
      dataIndex: "actions_item",
      key: "action",
      width: 180,
      render: (action: string, record: Lead) => (
        <Select
          value={action}
          placeholder="Next Step"
          style={{ width: '100%' }}
          bordered={false}
          className="action-select-premium"
          onChange={(value) => handleActionChange(record.id, value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          allowClear
          suffixIcon={<MoreVertical size={14} color="#94a3b8" />}
        >
          {configActions.map(a => (
            <Select.Option key={a.id} value={a.name}>
              <Space size={8} style={{ padding: '2px 0' }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: `${a.color || '#6366f1'}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: a.color || '#6366f1'
                }}>
                  {React.cloneElement(renderActionIcon(a.icon) as React.ReactElement, { style: { fontSize: 12 } })}
                </div>
                <span style={{ fontWeight: 600, color: '#475569', fontSize: 12 }}>{a.name}</span>
              </Space>
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Bidiq",
      key: "bidiq",
      width: 100,
      align: "center" as const,
      render: (_: unknown, record: Lead) => (
        <Button
          type="link"
          icon={<Zap size={16} />}
          onClick={(e) => { e.stopPropagation(); router.push(`/leads/bidiq/${record.id}`); }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: "var(--premium-blue)",
            fontWeight: 700,
            fontSize: 13,
            padding: 0
          }}
        >
          Bidiq
        </Button>
      ),
    },
    {
      title: "Proposal",
      key: "proposal",
      width: 140,
      render: (_: unknown, record: Lead) => (
        record.proposal_id ? (
          <Button
            type="link"
            icon={<FileText size={16} />}
            onClick={(e) => { e.stopPropagation(); router.push(`/proposals/${record.proposal_id}`); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "#10b981",
              fontWeight: 700,
              fontSize: 13,
              padding: 0
            }}
          >
            View Proposal
          </Button>
        ) : (
          <Button
            type="link"
            icon={<Sparkles size={16} />}
            onClick={(e) => { e.stopPropagation(); router.push(`/leads/bidiq/${record.id}`); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--premium-blue)",
              fontWeight: 700,
              fontSize: 13,
              padding: 0
            }}
          >
            Generate
          </Button>
        )
      ),
    },
    {
      title: "Actions",
      key: "table-actions",
      align: "right" as const,
      width: 80,
      render: (_: unknown, record: Lead) => {
        const menuItems: MenuProps['items'] = [
          {
            key: 'view',
            label: 'View Details',
            icon: <Eye size={16} />,
          },
          {
            key: 'edit',
            label: 'Edit Lead',
            icon: <Settings2 size={16} />,
          },
          {
            type: 'divider',
          },
          {
            key: 'delete',
            label: 'Delete Lead',
            danger: true,
            icon: <Trash2 size={16} />,
          }
        ];

        return (
          <Dropdown
            menu={{
              items: menuItems,
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation();
                if (key === 'view') handleView(record);
                if (key === 'edit') handleEdit(record);
                if (key === 'delete') {
                  modal.confirm({
                    title: "Are you sure you want to delete this lead?",
                    content: "This action cannot be undone.",
                    okText: "Delete",
                    cancelText: "Cancel",
                    okButtonProps: { danger: true },
                    onOk: () => handleDelete(record.id)
                  });
                }
              }
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreVertical size={20} style={{ color: "var(--text-slate-400)" }} />}
              className="action-btn"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        );
      },
    },
  ];

  const handleEdit = (record: Lead) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      clientName: record.client_name,
      clientMail: record.client_mail,
      clientPhone: record.client_phone,
      clientLocation: record.client_location,
      title: record.title,
      summary: record.summary,
      skills: record.skills,
      duration: record.duration,
      hourBasedAmount: record.hour_based_amount,
      jobLink: record.job_link,
      estOrProjectDuration: record.est_project_duration,
      status: record.status,
      actions: record.actions_item,
      timeline: record.timeline_start && record.timeline_end
        ? [dayjs(record.timeline_start), dayjs(record.timeline_end)]
        : null,
      postedOn: record.posted_on ? dayjs(record.posted_on) : null,
      documents: Array.isArray(record.documents)
        ? record.documents.map(doc =>
          typeof doc === 'string' ? { name: doc, url: doc } : doc
        )
        : record.documents,
      platform: ['Upwork', 'LinkedIn', 'Freelancer', 'Fiverr'].includes(record.platform || '') ? record.platform : 'Other',
      customPlatform: !['Upwork', 'LinkedIn', 'Freelancer', 'Fiverr'].includes(record.platform || '') ? record.platform : '',
      experienceLevel: record.experience_level,
      jobType: record.job_type,
      budget: record.budget,
      clientRating: record.client_rating,
      clientSpend: record.client_spend,
      clientPaymentVerified: record.client_payment_verified,
      clientPhoneVerified: record.client_phone_verified,
      ai_summary: record.ai_summary,
    });
    setIsDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLead(id);
      api.success({
        message: "Success",
        description: "Lead deleted successfully",
      });
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const handleSaveLead = async (values: any) => {
    try {
      // Map custom platform if 'Other' is selected
      const finalValues = { ...values };
      if (values.platform === 'Other') {
        finalValues.platform = values.customPlatform;
      }
      delete finalValues.customPlatform;

      if (editingKey) {
        await updateLead(editingKey, finalValues);
        api.success({
          message: "Lead Updated",
          description: "Details have been synchronized with the server.",
        });
      } else {
        await createLead(finalValues);
        api.success({
          message: "Lead Created",
          description: "New project lead added to the system.",
        });
      }
      setIsDrawerVisible(false);
      form.resetFields();
      setEditingKey(null);
    } catch (err) {
      // Error handled by useEffect
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(item => {
      // Search matching
      const matchesSearch = !searchText ||
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.client_name.toLowerCase().includes(searchText.toLowerCase());

      // Status matching
      const matchesStatus = !filterStatus || item.status === filterStatus;

      // Action matching
      const matchesAction = !filterAction || item.actions_item === filterAction;

      // Platform matching
      const matchesPlatform = !filterPlatform || item.platform === filterPlatform;

      // Date Range matching
      let matchesDateRange = true;
      if (filterDateRange && item.posted_on) {
        const postedOn = dayjs(item.posted_on);
        const [start, end] = filterDateRange;
        // Set to start/end of day for accurate comparison
        matchesDateRange = postedOn.isAfter(start.startOf('day')) && postedOn.isBefore(end.endOf('day'));
      }

      return matchesSearch && matchesStatus && matchesAction && matchesPlatform && matchesDateRange;
    });
  }, [leads, searchText, filterStatus, filterAction, filterPlatform, filterDateRange]);

  const leadsToday = useMemo(() => {
    const today = dayjs().startOf('day');
    return leads.filter(l => dayjs(l.created_at || l.posted_on).isAfter(today)).length;
  }, [leads]);

  const totalClients = useMemo(() => {
    return new Set(leads.map(l => l.client_name)).size;
  }, [leads]);

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      bodyStyle={{ padding: "8px 16px" }}
      className="stat-card-premium"
      style={{
        borderRadius: 14,
        border: "1px solid #f1f5f9",
        background: "#fff",
        boxShadow: "0 2px 8px -2px rgba(0,0,0,0.02)",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text className="premium-text-sec" style={{ color: "#94a3b8", fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</Text>
          <div className="premium-title" style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", marginTop: 0, letterSpacing: '-0.02em' }}>{value}</div>
        </div>
        <div style={{
          color: "#6366f1",
          background: "rgba(99, 102, 241, 0.06)",
          padding: 8,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="leads-page-wrapper" style={{
          margin: "0 -24px",
          padding: "12px 24px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)"
        }}>
          {contextHolder}
          {modalContextHolder}

          {/* Header Section */}
          <div style={{ marginBottom: 0, paddingBottom: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'rgba(99, 102, 241, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: "#6366f1"
                }}>
                  <Layers size={20} />
                </div>
                <div>
                  <Title level={4} className="premium-title" style={{ margin: 0, fontWeight: 800, color: "var(--text-primary)", fontSize: 18, letterSpacing: "-0.01em" }}>Leads Management</Title>
                  <Text type="secondary" className="premium-text-sec" style={{ fontSize: '11px', display: 'block', color: "var(--text-secondary)" }}>
                    Track, manage and convert your potential business opportunities
                  </Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                placeholder="Search leads..."
                prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
                className="premium-input-search"
                style={{
                  width: 220,
                  borderRadius: 8,
                  height: 32,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  fontSize: 13,
                  fontWeight: 500
                }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                size="small"
                icon={<Plus size={14} />}
                style={{
                  borderRadius: 6,
                  height: 32,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  background: "#6366f1",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
                  padding: "0 12px",
                  fontSize: 13
                }}
                onClick={() => {
                  setEditingKey(null);
                  form.resetFields();
                  form.setFieldsValue({ platform: 'Upwork', customPlatform: '' });
                  const defaultStatus = configStatuses.find(s => s.is_default);
                  if (defaultStatus) {
                    form.setFieldsValue({ status: defaultStatus.name });
                  }
                  setIsDrawerVisible(true);
                }}
              >
                New Lead
              </Button>
            </div>
          </div>

          <Divider className="hub-divider-premium" style={{ margin: '0 -24px 16px -24px', width: 'calc(100% + 48px)', borderTop: '1px solid #e2e8f0' }} />


          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={6}>
              <StatCard label="Total Leads" value={leads.length} icon={Layers} color="#6366f1" />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard label="New Today" value={leadsToday} icon={Zap} color="#f59e0b" />
            </Col>
            <Col xs={24} sm={6}>
              <StatCard label="Total Clients" value={totalClients} icon={User} color="#10b981" />
            </Col>
          </Row>

          {/* Filter Bar Section */}
          <Card
            bodyStyle={{ padding: "8px 16px" }}
            className="leads-filter-card"
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "#fff",
              boxShadow: "0 2px 4px 0 rgb(0 0 0 / 0.05)"
            }}
          >
            <Row gutter={[16, 16]} align="middle">
              <Col>
                <Space size={8} style={{ color: "var(--text-slate-500)", fontWeight: 600 }}>
                  <Filter size={18} />
                  <span>Filters</span>
                </Space>
              </Col>
              <Col flex="auto">
                <Row gutter={12}>
                  <Col span={5}>
                    <Select
                      placeholder="Filter by Status"
                      style={{ width: '100%' }}
                      allowClear
                      value={filterStatus}
                      onChange={setFilterStatus}
                      dropdownStyle={{ borderRadius: 8 }}
                    >
                      {configStatuses.map(s => (
                        <Select.Option key={s.id} value={s.name}>
                          <Tag style={{
                            backgroundColor: `${s.color}15`,
                            color: s.color,
                            border: `1px solid ${s.color}30`,
                            fontWeight: 700,
                            borderRadius: 6,
                            padding: "2px 10px",
                            fontSize: 10,
                            margin: 0
                          }}>
                            {s.name.toUpperCase()}
                          </Tag>
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={5}>
                    <Select
                      placeholder="Filter by Platform"
                      style={{ width: '100%' }}
                      allowClear
                      value={filterPlatform}
                      onChange={setFilterPlatform}
                    >
                      <Select.Option value="Upwork">Upwork</Select.Option>
                      <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                      <Select.Option value="Freelancer">Freelancer</Select.Option>
                      <Select.Option value="Fiverr">Fiverr</Select.Option>
                    </Select>
                  </Col>
                  <Col span={5}>
                    <Select
                      placeholder="Filter by Action"
                      style={{ width: '100%' }}
                      allowClear
                      value={filterAction}
                      onChange={setFilterAction}
                    >
                      {configActions.map(a => (
                        <Select.Option key={a.id} value={a.name}>
                          <Space>
                            {renderActionIcon(a.icon)}
                            {a.name}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={6}>
                    <DatePicker.RangePicker
                      style={{ width: '100%' }}
                      value={filterDateRange}
                      onChange={(dates) => setFilterDateRange(dates as any)}
                    />
                  </Col>
                  <Col span={3}>
                    <Button
                      icon={<RefreshCw size={14} />}
                      onClick={() => {
                        setFilterStatus(null);
                        setFilterAction(null);
                        setFilterPlatform(null);
                        setFilterDateRange(null);
                        setSearchText("");
                      }}
                      block
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      Clear
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          <Card
            bodyStyle={{ padding: 0 }}
            style={{
              borderRadius: 20,
              border: "1px solid #f1f5f9",
              overflow: "hidden",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.04)"
            }}
            className="leads-table-container"
          >
            {loading && leads.length === 0 ? (
              <div style={{ padding: '80px 0', textAlign: 'center' }}>
                <Spin size="large" tip={<Text style={{ marginTop: 12, display: 'block', color: '#6366f1', fontWeight: 600 }}>Loading Leads...</Text>} />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredLeads}
                rowKey="id"
                size="middle"
                pagination={{
                  pageSize: 10,
                  position: ["bottomRight"],
                  showSizeChanger: false,
                  className: "premium-pagination"
                }}
                className="premium-table"
                onRow={(record) => ({
                  onClick: () => handleView(record),
                  style: { cursor: 'pointer' }
                })}
                locale={{
                  emptyText: <Empty description="No matching leads found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                }}
              />
            )}
          </Card>
        </div>

        {/* Lead Form Drawer */}
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                background: 'rgba(99, 102, 241, 0.1)',
                padding: '8px',
                borderRadius: '10px',
                color: '#6366f1',
                display: 'flex'
              }}>
                {editingKey ? <Edit2 size={20} /> : <Plus size={20} />}
              </div>
              <div>
                <div className="premium-title" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1.2 }}>
                  {editingKey ? 'Edit Opportunity' : 'New Lead Entry'}
                </div>
                <div className="premium-text-sec" style={{ fontSize: 12, color: 'var(--text-slate-500)', fontWeight: 400, marginTop: 2 }}>
                  {editingKey ? 'Refine the details of this high-intent lead' : 'Initialize a new lead into your intelligence pipeline'}
                </div>
              </div>
            </div>
          }
          width={640}
          open={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          className="premium-drawer"
          headerStyle={{ borderBottom: '1px solid var(--border-slate-100)', padding: '16px 24px' }}
          bodyStyle={{ padding: '24px' }}
          footerStyle={{ borderTop: '1px solid var(--border-slate-100)', padding: '12px 24px' }}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button onClick={() => setIsDrawerVisible(false)} style={{ borderRadius: 8, height: 40, fontWeight: 600 }} className="premium-btn-cancel">Cancel</Button>
              <Button
                type="primary"
                loading={loading}
                onClick={() => form.submit()}
                style={{ borderRadius: 8, height: 40, padding: "0 24px", background: "#6366f1", border: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)' }}
              >
                {editingKey ? 'Update Lead' : 'Create Lead'}
              </Button>
            </div>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleSaveLead} requiredMark={false}>
            {/* Client Details Section */}
            <div className="premium-drawer-section" style={{
              marginBottom: 24,
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <Title level={5} className="premium-section-title" style={{ marginBottom: 20, color: "#1e293b", display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <User size={16} color="#6366f1" /> Client Information
              </Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientName" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Client Name</Text>} rules={[{ required: true }]}>
                    <Input prefix={<User size={14} style={{ color: '#94a3b8' }} />} placeholder="e.g. John Doe" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientMail" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Email Address</Text>} rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<Mail size={14} style={{ color: '#94a3b8' }} />} placeholder="john@example.com" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientPhone" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Phone Number</Text>}>
                    <Input prefix={<Phone size={14} style={{ color: '#94a3b8' }} />} placeholder="+1 234..." style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientLocation" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Location</Text>}>
                    <Input prefix={<MapPin size={14} style={{ color: '#94a3b8' }} />} placeholder="City, Country" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientRating" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Client Rating</Text>}>
                    <Input placeholder="e.g. 4.9/5" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientSpend" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Total Spend</Text>}>
                    <Input placeholder="e.g. $10k+" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientPaymentVerified" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Payment Verified</Text>}>
                    <Select style={{ borderRadius: 8 }}>
                      <Select.Option value={true}>Verified</Select.Option>
                      <Select.Option value={false}>Not Verified</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientPhoneVerified" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Phone Verified</Text>}>
                    <Select style={{ borderRadius: 8 }}>
                      <Select.Option value={true}>Verified</Select.Option>
                      <Select.Option value={false}>Not Verified</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Job Details Section */}
            <div className="premium-drawer-section-alt" style={{
              marginBottom: 24,
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <Title level={5} className="premium-section-title" style={{ marginBottom: 20, color: "#1e293b", display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Briefcase size={16} color="#6366f1" /> Job Specification
              </Title>
              <Form.Item name="title" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Job Title</Text>} rules={[{ required: true }]}>
                <Input placeholder="e.g. Senior Frontend Engineer" style={{ borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="ai_summary" label={<Space><Sparkles size={14} color="#6366f1" /> <Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>AI Intelligence Summary</Text></Space>}>
                <TextArea rows={4} placeholder="AI generated insights will appear here..." style={{ borderRadius: 12, background: 'rgba(99, 102, 241, 0.02)', border: '1px solid rgba(99, 102, 241, 0.1)' }} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="skills" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Required Skills</Text>}>
                    <Select mode="tags" style={{ width: '100%' }} placeholder="Add skills..." tokenSeparators={[',']} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="duration" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Duration</Text>}>
                    <Input placeholder="e.g. 3 Months" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="hourBasedAmount" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Hourly ($)</Text>}>
                    <InputNumber style={{ width: '100%', borderRadius: 8 }} min={0} prefix={<DollarSign size={14} />} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="budget" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Budget ($)</Text>}>
                    <Input placeholder="e.g. 5000" prefix={<DollarSign size={14} />} style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="estOrProjectDuration" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Type</Text>}>
                    <Input placeholder="Fixed/Hourly" style={{ borderRadius: 8 }} />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Timeline & Meta Section */}
            <div className="premium-drawer-section" style={{
              marginBottom: 24,
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <Title level={5} className="premium-section-title" style={{ marginBottom: 20, color: "#1e293b", display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <LinkIcon size={16} color="#6366f1" /> Platform & Status
              </Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="platform" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Platform</Text>} initialValue="Upwork">
                    <Select placeholder="Select Platform" style={{ borderRadius: 8 }}>
                      <Select.Option value="Upwork">Upwork</Select.Option>
                      <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                      <Select.Option value="Freelancer">Freelancer</Select.Option>
                      <Select.Option value="Fiverr">Fiverr</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="status" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Current Status</Text>}>
                    <Select placeholder="Select Status" style={{ borderRadius: 8 }}>
                      {configStatuses.map(s => (
                        <Select.Option key={s.id} value={s.name}>
                          <Space>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color }} />
                            {s.name}
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="jobLink" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Job Link</Text>}>
                <Input prefix={<LinkIcon size={14} style={{ color: '#94a3b8' }} />} placeholder="https://..." style={{ borderRadius: 8 }} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="postedOn" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Posted On</Text>} initialValue={dayjs()}>
                    <DatePicker style={{ width: '100%', borderRadius: 8 }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="actions" label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: '#64748b' }}>Next Action Items</Text>}>
                    <Select placeholder="Select Action" allowClear style={{ borderRadius: 8 }}>
                      {configActions.map(a => (
                        <Select.Option key={a.id} value={a.name}>
                          <Space>
                            {renderActionIcon(a.icon)}
                            <span style={{ color: a.color }}>{a.name}</span>
                          </Space>
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {/* Documents Section */}
            <div className="premium-drawer-section-alt" style={{
              padding: '20px',
              borderRadius: '16px',
              border: '1px solid var(--border-slate-100)'
            }}>
              <Title level={5} className="premium-section-title" style={{ marginBottom: 20, color: "#1e293b", display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <FileText size={16} color="#6366f1" /> Documents
              </Title>
              <Form.List name="documents">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row key={key} gutter={12} align="middle" style={{ marginBottom: 12 }}>
                        <Col span={10}>
                          <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Missing name' }]} noStyle>
                            <Input placeholder="Document Name" style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col span={10}>
                          <Form.Item {...restField} name={[name, 'url']} rules={[{ required: true, message: 'Missing URL' }]} noStyle>
                            <Input placeholder="URL" prefix={<LinkIcon size={12} />} style={{ borderRadius: 8 }} />
                          </Form.Item>
                        </Col>
                        <Col span={4} style={{ textAlign: 'right' }}>
                          <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => remove(name)} style={{ borderRadius: 6 }} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusCircle size={16} />} style={{ marginTop: 8, borderRadius: 10, height: 40, color: '#6366f1', borderColor: '#e0e7ff', background: '#f5f7ff' }}>
                      Add Supporting Document
                    </Button>
                  </>
                )}
              </Form.List>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
            .premium-table .ant-table { background: transparent; }
            .premium-table .ant-table-thead > tr > th { 
              background: #f8fafc; 
              color: #64748b; 
              font-weight: 700; 
              font-size: 11px; 
              text-transform: uppercase; 
              letter-spacing: 0.05em;
              border-bottom: 1px solid #f1f5f9;
              padding: 16px 20px;
            }
            .premium-table .ant-table-tbody > tr > td { 
              padding: 16px 20px; 
              border-bottom: 1px solid #f8fafc;
              transition: all 0.2s ease;
            }
            .premium-table .ant-table-tbody > tr:hover > td { 
              background: #fdfdff !important; 
            }
            .premium-table .ant-table-tbody > tr:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.02);
            }
            
            .status-select-premium .ant-select-selector, .action-select-premium .ant-select-selector {
              padding: 0 !important;
              height: auto !important;
            }
            
            .premium-pagination .ant-pagination-item-active {
              border-color: #6366f1;
            }
            .premium-pagination .ant-pagination-item-active a {
              color: #6366f1;
            }
            
            .action-btn:hover {
              background: #f1f5f9 !important;
              color: #6366f1 !important;
            }
            
            .leads-table-container {
              animation: slideUp 0.4s ease-out;
            }
            
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }

            /* DARK THEME OVERRIDES */
            [data-theme='dark'] .leads-page-wrapper { background: #0d1117 !important; }
            [data-theme='dark'] .premium-table .ant-table-thead > tr > th { 
              background: #161b22 !important; 
              color: #8b949e !important; 
              border-bottom-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-table .ant-table-tbody > tr > td { 
              border-bottom-color: #21262d !important; 
              color: #c9d1d9 !important;
            }
            [data-theme='dark'] .premium-table .ant-table-tbody > tr:hover > td { 
              background: #1c2128 !important; 
            }
            [data-theme='dark'] .stat-card-premium { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .leads-table-container { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .leads-filter-card { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .hub-divider-premium { 
              border-top-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-title { color: #f0f6fc !important; }
            [data-theme='dark'] .premium-text-sec { color: #8b949e !important; }
            [data-theme='dark'] .premium-input-search { 
              background: #0d1117 !important; 
              border-color: #30363d !important; 
              color: #c9d1d9 !important; 
            }

            /* DARK DRAWER OVERRIDES */
            [data-theme='dark'] .premium-drawer .ant-drawer-content { background: #161b22 !important; }
            [data-theme='dark'] .premium-drawer .ant-drawer-header { 
              background: #161b22 !important; 
              border-bottom-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer .ant-drawer-footer { 
              background: #0d1117 !important; 
              border-top-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer-section { 
              background: #0d1117 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-drawer-section-alt { 
              background: #161b22 !important; 
              border-color: #30363d !important; 
            }
            [data-theme='dark'] .premium-form-label { color: #8b949e !important; }
            [data-theme='dark'] .premium-section-title { color: #f0f6fc !important; }
            [data-theme='dark'] .premium-btn-cancel { 
              background: #21262d !important; 
              border-color: #30363d !important; 
              color: #c9d1d9 !important; 
            }
            [data-theme='dark'] .premium-drawer .ant-select-selector,
            [data-theme='dark'] .premium-drawer .ant-input,
            [data-theme='dark'] .premium-drawer .ant-input-number,
            [data-theme='dark'] .premium-drawer .ant-picker {
              background: #0d1117 !important;
              border-color: #30363d !important;
              color: #c9d1d9 !important;
            }
          `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
