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
  Eye
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
  Spin
} from "antd";
import dayjs from "dayjs";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/services/leadService";

const { TextArea } = Input;
const { Text, Title } = Typography;

export default function LeadsPage() {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isViewDrawerVisible, setIsViewDrawerVisible] = useState(false);
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // Use the custom hook for backend connectivity
  const { leads, loading, error, fetchLeads, createLead, updateLead, deleteLead } = useLeads();

  const handleView = (record: Lead) => {
    setViewingLead(record);
    setIsViewDrawerVisible(true);
  };

  // Load leads on component mount
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Handle errors from the hook
  useEffect(() => {
    if (error) {
      api.error({
        message: "API Error",
        description: error,
      });
    }
  }, [error, api]);

  const columns = [
    {
      title: "Lead Information",
      dataIndex: "title",
      key: "title",
      width: "30%",
      render: (text: string, record: Lead) => (
        <Space size={12}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "var(--bg-blue-50)",
            color: "var(--premium-blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Briefcase size={20} />
          </div>
          <div>
            <Text strong style={{ display: "block", color: "var(--text-slate-900)", fontSize: 14 }}>{text}</Text>
            <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{record.client_name} • {record.client_location || 'Unknown'}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Skills",
      dataIndex: "skills",
      key: "skills",
      render: (skills: string[]) => (
        <Space size={[0, 4]} wrap>
          {(skills || []).map(skill => (
            <Tag key={skill} color="blue" style={{ borderRadius: 4, margin: 0, fontSize: 11 }}>{skill}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Duration / Rate",
      key: "rate",
      render: (record: Lead) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13, color: "var(--text-slate-700)" }}>{record.duration || 'N/A'}</Text>
          <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>${record.hour_based_amount}/hr</Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}
          color={status === "Open" ? "success" : status === "In Progress" ? "processing" : "default"}
        >
          {(status || 'Unknown').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "table-actions",
      align: "right" as const,
      render: (_: unknown, record: Lead) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<Eye size={18} style={{ color: "var(--text-slate-400)" }} />}
              onClick={() => handleView(record)}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="Edit Lead">
            <Button
              type="text"
              icon={<Settings2 size={18} style={{ color: "var(--text-slate-400)" }} />}
              onClick={() => handleEdit(record)}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="Delete Lead">
            <Popconfirm
              title="Delete this lead?"
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                type="text"
                icon={<Trash2 size={18} />}
                className="action-btn-danger"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
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
      documents: record.documents,
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
      if (editingKey) {
        await updateLead(editingKey, values);
        api.success({
          message: "Lead Updated",
          description: "Details have been synchronized with the server.",
        });
      } else {
        await createLead(values);
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
    return leads.filter(item => 
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.client_name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [leads, searchText]);

  const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <Card
      bodyStyle={{ padding: "16px 20px" }}
      style={{
        borderRadius: 12,
        border: "1px solid var(--border-slate-100)",
        background: "var(--bg-pure-white)",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
          <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
        </div>
        <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{
          margin: "0 -24px",
          padding: "24px 32px",
          background: "var(--bg-secondary)",
          minHeight: "calc(100vh - 64px)"
        }}>
          {contextHolder}

          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{
                  background: "var(--bg-blue-50)",
                  padding: 10,
                  borderRadius: 12,
                  color: "var(--premium-blue)",
                  display: "flex"
                }}>
                  <Layers size={24} />
                </div>
                <div>
                  <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Leads Management</Title>
                  <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Track project leads, client details, and job specifications.</Text>
                </div>
              </Space>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <Input
                placeholder="Search leads..."
                prefix={<Search size={16} style={{ color: "var(--text-slate-400)" }} />}
                style={{ width: 280, borderRadius: 10, height: 44, border: "1px solid var(--border-slate-200)", background: "var(--bg-pure-white)" }}
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center", background: "var(--premium-blue)" }}
                onClick={() => {
                  setEditingKey(null);
                  form.resetFields();
                  setIsDrawerVisible(true);
                }}
              >
                New Lead
              </Button>
            </div>
          </div>

          <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={8}>
              <StatCard label="Total Leads" value={leads.length} icon={Layers} color="#3b82f6" />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard label="Open Leads" value={leads.filter(d => d.status === "Open").length} icon={CheckCircle2} color="#10b981" />
            </Col>
            <Col xs={24} sm={8}>
              <StatCard label="In Progress" value={leads.filter(d => d.status === "In Progress").length} icon={Clock} color="#f59e0b" />
            </Col>
          </Row>

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
              <Form.Item name="summary" label={<Text strong style={{ fontSize: 13 }}>Job Summary</Text>}>
                <TextArea rows={3} placeholder="Briefly describe the role..." />
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
                <Col span={8}>
                  <Form.Item name="hourBasedAmount" label={<Text strong style={{ fontSize: 13 }}>Hourly Rate ($)</Text>}>
                    <InputNumber style={{ width: '100%' }} min={0} prefix={<DollarSign size={14} />} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="estOrProjectDuration" label={<Text strong style={{ fontSize: 13 }}>Project Type</Text>}>
                    <Select>
                      <Select.Option value="Short Term">Short Term</Select.Option>
                      <Select.Option value="Long Term">Long Term</Select.Option>
                      <Select.Option value="Fixed Price">Fixed Price</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
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
                  <Form.Item name="status" label={<Text strong style={{ fontSize: 13 }}>Current Status</Text>} initialValue="Open">
                    <Select>
                      <Select.Option value="Open">Open</Select.Option>
                      <Select.Option value="In Progress">In Progress</Select.Option>
                      <Select.Option value="Closed">Closed</Select.Option>
                      <Select.Option value="Paused">Paused</Select.Option>
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
                    <Input placeholder="e.g. Schedule interview" />
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

        {/* View Lead Drawer */}
        <Drawer
          title={
            <Space size={12}>
              <div style={{ background: "var(--bg-blue-50)", padding: 8, borderRadius: 10, color: "var(--premium-blue)", display: "flex" }}>
                <Eye size={20} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>Lead Details</div>
                <div style={{ fontSize: 12, color: "var(--text-slate-500)" }}>View complete profile and requirements</div>
              </div>
            </Space>
          }
          width={640}
          open={isViewDrawerVisible}
          onClose={() => setIsViewDrawerVisible(false)}
        >
          {viewingLead && (
            <div style={{ paddingBottom: 40 }}>
              {/* Header Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <Tag 
                  color={viewingLead.status === "Open" ? "success" : viewingLead.status === "In Progress" ? "processing" : "default"}
                  style={{ borderRadius: 20, padding: "4px 12px", border: 0, fontWeight: 600 }}
                >
                  {viewingLead.status?.toUpperCase()}
                </Tag>
                <Text style={{ fontSize: 12, color: 'var(--text-slate-400)' }}>
                  Posted on: {viewingLead.posted_on ? dayjs(viewingLead.posted_on).format('MMM DD, YYYY') : 'N/A'}
                </Text>
              </div>

              {/* Client Section */}
              <div style={{ marginBottom: 40 }}>
                <Title level={5} style={{ marginBottom: 20, color: "var(--premium-blue)", fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Client Information
                </Title>
                <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 12, border: '1px solid var(--border-slate-100)', background: 'var(--bg-slate-50)' }}>
                  <Row gutter={[24, 20]}>
                    <Col span={12}>
                      <Space direction="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Client Name</Text>
                        <Text strong style={{ fontSize: 14 }}>{viewingLead.client_name}</Text>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Email Address</Text>
                        <Space size={4}>
                          <Mail size={12} />
                          <Text style={{ fontSize: 14 }}>{viewingLead.client_mail}</Text>
                        </Space>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Phone Number</Text>
                        <Space size={4}>
                          <Phone size={12} />
                          <Text style={{ fontSize: 14 }}>{viewingLead.client_phone || 'N/A'}</Text>
                        </Space>
                      </Space>
                    </Col>
                    <Col span={12}>
                      <Space direction="vertical" size={2}>
                        <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>Location</Text>
                        <Space size={4}>
                          <MapPin size={12} />
                          <Text style={{ fontSize: 14 }}>{viewingLead.client_location || 'N/A'}</Text>
                        </Space>
                      </Space>
                    </Col>
                  </Row>
                </Card>
              </div>

              {/* Job Section */}
              <div style={{ marginBottom: 40 }}>
                <Title level={5} style={{ marginBottom: 20, color: "var(--premium-blue)", fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Job Specification
                </Title>
                <div style={{ marginBottom: 24 }}>
                  <Title level={4} style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 700 }}>{viewingLead.title}</Title>
                  <Text style={{ fontSize: 14, color: 'var(--text-slate-600)', lineHeight: '1.6' }}>{viewingLead.summary || 'No summary provided.'}</Text>
                </div>

                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col span={8}>
                    <Card bodyStyle={{ padding: 12 }} style={{ borderRadius: 10, textAlign: 'center', border: '1px solid var(--border-slate-100)' }}>
                      <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>Duration</Text>
                      <Text strong>{viewingLead.duration || 'N/A'}</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card bodyStyle={{ padding: 12 }} style={{ borderRadius: 10, textAlign: 'center', border: '1px solid var(--border-slate-100)' }}>
                      <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>Hourly Rate</Text>
                      <Text strong color="var(--premium-blue)">${viewingLead.hour_based_amount || 0}/hr</Text>
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card bodyStyle={{ padding: 12 }} style={{ borderRadius: 10, textAlign: 'center', border: '1px solid var(--border-slate-100)' }}>
                      <Text type="secondary" style={{ display: 'block', fontSize: 11 }}>Project Type</Text>
                      <Text strong>{viewingLead.est_project_duration || 'N/A'}</Text>
                    </Card>
                  </Col>
                </Row>

                <div style={{ marginBottom: 24 }}>
                  <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Required Skills</Text>
                  <Space wrap size={[8, 8]}>
                    {(viewingLead.skills || []).map(skill => (
                      <Tag key={skill} style={{ borderRadius: 4, margin: 0, padding: '4px 12px', background: 'var(--bg-blue-50)', color: 'var(--premium-blue)', border: 0 }}>{skill}</Tag>
                    ))}
                  </Space>
                </div>

                {viewingLead.job_link && (
                  <Button 
                    type="link" 
                    icon={<LinkIcon size={14} />} 
                    href={viewingLead.job_link} 
                    target="_blank" 
                    style={{ padding: 0, height: 'auto', color: 'var(--premium-blue)' }}
                  >
                    View Original Job Post
                  </Button>
                )}
              </div>

              {/* Timeline & Meta */}
              <div style={{ marginBottom: 40 }}>
                <Title level={5} style={{ marginBottom: 20, color: "var(--premium-blue)", fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Timeline & Actions
                </Title>
                <Card bodyStyle={{ padding: 20 }} style={{ borderRadius: 12, border: '1px solid var(--border-slate-100)' }}>
                  <Space direction="vertical" size={24} style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Project Timeline</Text>
                      {viewingLead.timeline_start ? (
                        <Space size={12}>
                          <Calendar size={14} style={{ color: 'var(--text-slate-400)' }} />
                          <Text>{dayjs(viewingLead.timeline_start).format('MMM DD, YYYY')} — {dayjs(viewingLead.timeline_end).format('MMM DD, YYYY')}</Text>
                        </Space>
                      ) : <Text>No timeline set</Text>}
                    </div>
                    <div>
                      <Text type="secondary" style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 8 }}>Next Action Item</Text>
                      <Space size={12}>
                        <CheckCircle2 size={14} style={{ color: 'var(--premium-green)' }} />
                        <Text strong>{viewingLead.actions_item || 'No actions defined'}</Text>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </div>

              {/* Documents */}
              {viewingLead.documents && viewingLead.documents.length > 0 && (
                <div>
                  <Title level={5} style={{ marginBottom: 20, color: "var(--premium-blue)", fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Documents
                  </Title>
                  <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    {viewingLead.documents.map((doc: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'var(--bg-slate-50)', borderRadius: 8 }}>
                        <Space>
                          <FileText size={16} style={{ color: 'var(--text-slate-400)' }} />
                          <Text>{doc.name}</Text>
                        </Space>
                        <Button type="link" size="small" href={doc.url} target="_blank" icon={<ExternalLink size={14} />}>View</Button>
                      </div>
                    ))}
                  </Space>
                </div>
              )}
            </div>
          )}
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
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
