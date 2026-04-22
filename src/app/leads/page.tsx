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
  MoreVertical
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
          className="status-select"
          onChange={(value) => handleStatusChange(record.id, value)}
          dropdownMatchSelectWidth={false}
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
                fontSize: 11,
                letterSpacing: "0.02em",
                margin: 0
              }}>
                {s.name.toUpperCase()}
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
          placeholder="Select Action"
          style={{ width: '100%' }}
          bordered={false}
          onChange={(value) => handleActionChange(record.id, value)}
          allowClear
        >
          {configActions.map(a => (
            <Select.Option key={a.id} value={a.name}>
              <Space>
                {renderActionIcon(a.icon)}
                <span style={{ color: a.color }}>{a.name}</span>
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
          onClick={() => router.push(`/leads/bidiq/${record.id}`)}
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

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      bodyStyle={{ padding: "10px 16px" }}
      style={{
        borderRadius: 10,
        border: "1px solid var(--border-slate-100)",
        background: "var(--bg-pure-white)",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "var(--text-slate-500)", fontSize: 12, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 2 }}>{value}</div>
        </div>
        <div style={{ color: color, background: `${color}15`, padding: 8, borderRadius: 10 }}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{
          margin: "0 -24px",
          padding: "16px 24px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)"
        }}>
          {contextHolder}
          {modalContextHolder}

          {/* Header Section */}
          <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Space size={10} align="center">
                <div style={{
                  background: "var(--bg-blue-50)",
                  padding: 8,
                  borderRadius: 10,
                  color: "var(--premium-blue)",
                  display: "flex"
                }}>
                  <Layers size={18} />
                </div>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Leads Management</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 13 }}>Track project leads and specifications.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Input
                placeholder="Search leads..."
                prefix={<Search size={16} style={{ color: "var(--text-slate-400)" }} />}
                style={{ width: 240, borderRadius: 8, height: 36, border: "1px solid var(--border-slate-200)", background: "var(--bg-pure-white)" }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                size="middle"
                icon={<Plus size={16} />}
                style={{ borderRadius: 8, height: 36, fontWeight: 600, display: "flex", alignItems: "center", background: "var(--premium-blue)" }}
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

          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={6}>
              <StatCard label="Total Leads" value={leads.length} icon={Layers} color="#3b82f6" />
            </Col>
          </Row>

          {/* Filter Bar Section */}
          <Card
            bodyStyle={{ padding: "8px 16px" }}
            style={{
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid var(--border-slate-200)",
              background: "var(--bg-pure-white)",
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
            style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", overflow: "hidden" }}
          >
            {loading && leads.length === 0 ? (
              <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Spin size="large" tip="Loading leads..." />
              </div>
            ) : (
              <Table
                columns={columns}
                dataSource={filteredLeads}
                rowKey="id"
                size="middle"
                pagination={{ pageSize: 12, position: ["bottomRight"] }}
                locale={{
                  emptyText: <Empty description="No leads found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                }}
              />
            )}
          </Card>
        </div>

        {/* Lead Form Drawer */}
        <Drawer
          title={
            <Space size={12}>
              <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)", display: "flex" }}>
                <FileText size={20} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  {editingKey ? "Edit Lead Details" : "Create New Lead"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-slate-500)" }}>Complete all fields to process the lead</div>
              </div>
            </Space>
          }
          width={640}
          open={isDrawerVisible}
          onClose={() => setIsDrawerVisible(false)}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "8px 0" }}>
              <Button onClick={() => setIsDrawerVisible(false)} style={{ borderRadius: 8, height: 40 }}>Cancel</Button>
              <Button
                type="primary"
                loading={loading}
                onClick={() => form.submit()}
                style={{ borderRadius: 8, height: 40, padding: "0 24px", background: "var(--premium-blue)" }}
              >
                Save Lead
              </Button>
            </div>
          }
        >
          <Form form={form} layout="vertical" onFinish={handleSaveLead} requiredMark={false}>
            {/* Client Details Section */}
            <div style={{ marginBottom: 32 }}>
              <Title level={5} style={{ marginBottom: 16, color: "var(--premium-blue)", display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={18} /> Client Information
              </Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientName" label={<Text strong style={{ fontSize: 13 }}>Client Name</Text>} rules={[{ required: true }]}>
                    <Input prefix={<User size={14} style={{ color: 'var(--text-slate-400)' }} />} placeholder="e.g. John Doe" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientMail" label={<Text strong style={{ fontSize: 13 }}>Email Address</Text>} rules={[{ required: true, type: 'email' }]}>
                    <Input prefix={<Mail size={14} style={{ color: 'var(--text-slate-400)' }} />} placeholder="john@example.com" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientPhone" label={<Text strong style={{ fontSize: 13 }}>Phone Number</Text>}>
                    <Input prefix={<Phone size={14} style={{ color: 'var(--text-slate-400)' }} />} placeholder="+1 234..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientLocation" label={<Text strong style={{ fontSize: 13 }}>Location</Text>}>
                    <Input prefix={<MapPin size={14} style={{ color: 'var(--text-slate-400)' }} />} placeholder="City, Country" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientRating" label={<Text strong style={{ fontSize: 13 }}>Client Rating</Text>}>
                    <Input placeholder="e.g. 4.9/5" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientSpend" label={<Text strong style={{ fontSize: 13 }}>Total Spend</Text>}>
                    <Input placeholder="e.g. $10k+" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="clientPaymentVerified" label={<Text strong style={{ fontSize: 13 }}>Payment Verified</Text>}>
                    <Select>
                      <Select.Option value={true}>Verified</Select.Option>
                      <Select.Option value={false}>Not Verified</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="clientPhoneVerified" label={<Text strong style={{ fontSize: 13 }}>Phone Verified</Text>}>
                    <Select>
                      <Select.Option value={true}>Verified</Select.Option>
                      <Select.Option value={false}>Not Verified</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* Job Details Section */}
            <div style={{ marginBottom: 32 }}>
              <Title level={5} style={{ marginBottom: 16, color: "var(--premium-blue)", display: 'flex', alignItems: 'center', gap: 8 }}>
                <Briefcase size={18} /> Job Specification
              </Title>
              <Form.Item name="title" label={<Text strong style={{ fontSize: 13 }}>Job Title</Text>} rules={[{ required: true }]}>
                <Input placeholder="e.g. Senior Frontend Engineer" />
              </Form.Item>
              <Form.Item name="ai_summary" label={<Space><Sparkles size={14} color="var(--premium-blue)" /> <Text strong style={{ fontSize: 13 }}>AI Intelligence Summary</Text></Space>}>
                <TextArea rows={4} placeholder="AI generated insights will appear here..." style={{ background: 'var(--bg-blue-50)', border: '1px solid var(--border-blue-100)' }} />
              </Form.Item>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="skills" label={<Text strong style={{ fontSize: 13 }}>Required Skills</Text>}>
                    <Select mode="tags" style={{ width: '100%' }} placeholder="Add skills..." tokenSeparators={[',']} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="duration" label={<Text strong style={{ fontSize: 13 }}>Duration</Text>}>
                    <Input placeholder="e.g. 3 Months" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="hourBasedAmount" label={<Text strong style={{ fontSize: 13 }}>Hourly ($)</Text>}>
                    <InputNumber style={{ width: '100%' }} min={0} prefix={<DollarSign size={14} />} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="budget" label={<Text strong style={{ fontSize: 13 }}>Budget ($)</Text>}>
                    <Input placeholder="e.g. 5000" prefix={<DollarSign size={14} />} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item name="estOrProjectDuration" label={<Text strong style={{ fontSize: 13 }}>Type</Text>}>
                    <Input placeholder="Fixed/Hourly" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="experienceLevel" label={<Text strong style={{ fontSize: 13 }}>Experience Level</Text>}>
                    <Input placeholder="e.g. Expert" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="jobType" label={<Text strong style={{ fontSize: 13 }}>Job Type</Text>}>
                    <Input placeholder="e.g. Hourly" />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            <Divider />

            {/* Timeline & Meta Section */}
            <div style={{ marginBottom: 32 }}>
              <Title level={5} style={{ marginBottom: 16, color: "var(--premium-blue)", display: 'flex', alignItems: 'center', gap: 8 }}>
                <LinkIcon size={18} /> Platform & Link
              </Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="platform" label={<Text strong style={{ fontSize: 13 }}>Platform</Text>} initialValue="Upwork">
                    <Select placeholder="Select Platform">
                      <Select.Option value="Upwork">Upwork</Select.Option>
                      <Select.Option value="LinkedIn">LinkedIn</Select.Option>
                      <Select.Option value="Freelancer">Freelancer</Select.Option>
                      <Select.Option value="Fiverr">Fiverr</Select.Option>
                      <Select.Option value="Other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Form.Item noStyle dependencies={['platform']}>
                  {({ getFieldValue }) => getFieldValue('platform') === 'Other' && (
                    <Col span={12}>
                      <Form.Item name="customPlatform" label={<Text strong style={{ fontSize: 13 }}>Custom Platform Name</Text>} rules={[{ required: true }]}>
                        <Input placeholder="Enter platform name" />
                      </Form.Item>
                    </Col>
                  )}
                </Form.Item>
              </Row>
              <Form.Item name="jobLink" label={<Text strong style={{ fontSize: 13 }}>Job Link</Text>}>
                <Input prefix={<LinkIcon size={14} style={{ color: 'var(--text-slate-400)' }} />} placeholder="https://..." />
              </Form.Item>
            </div>

            <Divider />

            {/* Timeline & Meta Section */}
            <div style={{ marginBottom: 32 }}>
              <Title level={5} style={{ marginBottom: 16, color: "var(--premium-blue)", display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={18} /> Schedule & Status
              </Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="status" label={<Text strong style={{ fontSize: 13 }}>Current Status</Text>}>
                    <Select placeholder="Select Status">
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
                <Col span={12}>
                  <Form.Item name="timeline" label={<Text strong style={{ fontSize: 13 }}>Timeline</Text>}>
                    <DatePicker.RangePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="postedOn" label={<Text strong style={{ fontSize: 13 }}>Posted On</Text>} initialValue={dayjs()}>
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="actions" label={<Text strong style={{ fontSize: 13 }}>Next Action Items</Text>}>
                    <Select placeholder="Select Action" allowClear>
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

            <Divider />

            {/* Documents Section */}
            <div>
              <Title level={5} style={{ marginBottom: 16, color: "var(--premium-blue)", display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={18} /> Documents
              </Title>
              <Form.List name="documents">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row key={key} gutter={12} align="middle" style={{ marginBottom: 12 }}>
                        <Col span={10}>
                          <Form.Item {...restField} name={[name, 'name']} rules={[{ required: true, message: 'Missing name' }]} noStyle>
                            <Input placeholder="Document Name" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item {...restField} name={[name, 'url']} rules={[{ required: true, message: 'Missing URL' }]} noStyle>
                            <Input placeholder="Document URL" prefix={<LinkIcon size={12} />} />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Button type="text" danger icon={<Trash2 size={16} />} onClick={() => remove(name)} />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusCircle size={16} />} style={{ marginTop: 8 }}>
                      Add Document
                    </Button>
                  </>
                )}
              </Form.List>
            </div>
          </Form>
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
          .action-btn:hover {
            background: var(--bg-slate-50) !important;
            color: var(--premium-blue) !important;
          }
          .action-btn-danger:hover {
            background: #fff1f2 !important;
          }
          .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-500) !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          .ant-input:focus, .ant-input-focused {
            border-color: var(--premium-blue) !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .premium-tabs .ant-tabs-nav {
            margin-bottom: 24px !important;
          }
          .premium-tabs .ant-tabs-tab {
            padding: 12px 0 !important;
            margin-right: 40px !important;
          }
          .premium-tabs .ant-tabs-tab-btn {
            font-size: 14px !important;
            font-weight: 600 !important;
            color: var(--text-slate-500) !important;
          }
          .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: var(--premium-blue) !important;
          }
          .premium-tabs .ant-tabs-ink-bar {
            background: var(--premium-blue) !important;
            height: 3px !important;
            border-radius: 3px 3px 0 0 !important;
          }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
