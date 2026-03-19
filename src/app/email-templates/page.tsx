"use client";

import React, { useState, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Switch,
  Space,
  Tooltip,
  Modal,
  Drawer,
  Form,
  Row,
  Col,
  Typography,
  Card,
  Breadcrumb,
  Empty,
  message,
} from "antd";
import {
  PlusOutlined,
  ImportOutlined,
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  SendOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import MainLayout from "@/components/layout/MainLayout";
import {
  useMailTemplates,
  useCreateMailTemplate,
  useUpdateMailTemplate,
  useUpdateMailTemplateStatus,
  useDeleteMailTemplate,
} from "@/hooks/useMailTemplates";
import dayjs from "dayjs";
import { MailTemplate } from "@/services/mailTemplateService";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const MODULE_COLORS: Record<string, string> = {
  HR: "blue",
  Recruitment: "green",
  Finance: "orange",
  Projects: "purple",
  System: "magenta",
};

const VARIABLES = [
  {
    category: "Recruitment",
    items: ["candidate_name", "position", "interview_date", "interviewer_name"],
  },
  {
    category: "Employee",
    items: ["employee_name", "department", "joining_date"],
  },
  {
    category: "Company",
    items: ["company_name", "company_address"],
  },
  {
    category: "Finance",
    items: ["invoice_number", "amount", "due_date"],
  },
];

const EmailTemplatesPage = () => {
  const [searchText, setSearchText] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<MailTemplate | null>(null);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();
  const [emailBody, setEmailBody] = useState("");

  const { data: templatesData, isLoading, refetch } = useMailTemplates({
    search: searchText,
    module: moduleFilter,
    status: statusFilter,
  });

  const templates = templatesData?.data || [];

  const createMutation = useCreateMailTemplate();
  const updateMutation = useUpdateMailTemplate();
  const deleteMutation = useDeleteMailTemplate();
  const statusMutation = useUpdateMailTemplateStatus();

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setEmailBody("");
    setDrawerVisible(true);
  };

  const handleEdit = (record: MailTemplate) => {
    setEditingTemplate(record);
    form.setFieldsValue({
      templateName: record.templateName,
      module: record.module,
      triggerEvent: record.triggerEvent,
      description: record.description,
      subject: record.subject,
    });
    setEmailBody(record.emailBody);
    setDrawerVisible(true);
  };

  const handlePreview = (record: MailTemplate) => {
    setPreviewTemplate(record);
    setPreviewVisible(true);
  };

  const handleDelete = (id: string) => {
    console.log("Delete clicked for ID:", id);
    modal.confirm({
      title: "Are you sure you want to delete?",
      okText: "OK",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        console.log("Delete confirmed for ID:", id);
        deleteMutation.mutate(id);
      },
    });
  };

  const handleStatusToggle = (id: string, checked: boolean) => {
    statusMutation.mutate({ id, status: checked });
  };

  const onFinish = (values: any) => {
    const data = {
      ...values,
      emailBody,
    };

    if (editingTemplate) {
      updateMutation.mutate(
        { id: editingTemplate.id, data },
        {
          onSuccess: () => {
            setDrawerVisible(false);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setDrawerVisible(false);
        },
      });
    }
  };

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(`{{${variable}}}`);
    message.success(`Copied {{${variable}}} to clipboard`);
  };

  const columns = [
    {
      title: "Template Name",
      dataIndex: "templateName",
      key: "templateName",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Module",
      dataIndex: "module",
      key: "module",
      render: (module: string) => (
        <Tag color={MODULE_COLORS[module] || "default"}>{module}</Tag>
      ),
    },
    {
      title: "Trigger Event",
      dataIndex: "triggerEvent",
      key: "triggerEvent",
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string) => (
        <Tooltip title={subject}>
          <div
            style={{
              maxWidth: 200,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {subject}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: boolean, record: MailTemplate) => (
        <Switch
          checked={status}
          onChange={(checked) => handleStatusToggle(record.id, checked)}
          size="small"
        />
      ),
    },
    {
      title: "Last Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: string) => dayjs(date).format("DD MMM YYYY"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: MailTemplate) => (
        <Space size="middle">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#1890ff" }} />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const resetFilters = () => {
    setSearchText("");
    setModuleFilter(undefined);
    setStatusFilter(undefined);
  };

  return (
    <MainLayout>
      {contextHolder}
      <div style={{ padding: "24px", background: "#f9f9f9", minHeight: "100vh" }}>
        {/* Header Section */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={2} style={{ marginBottom: 4 }}>
              Mail Templates
            </Title>
            <Text type="secondary">
              Manage email templates used across modules like HR, Recruitment, Finance, and Projects.
            </Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ImportOutlined />}>Import Default Templates</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                style={{ borderRadius: 6 }}
              >
                Create Template
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filters Section */}
        <Card
          bodyStyle={{ padding: "16px" }}
          style={{ marginBottom: 24, borderRadius: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        >
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search template name"
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: "100%", borderRadius: 6 }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Module"
                style={{ width: "100%" }}
                value={moduleFilter}
                onChange={setModuleFilter}
                allowClear
              >
                <Option value="HR">HR</Option>
                <Option value="Recruitment">Recruitment</Option>
                <Option value="Finance">Finance</Option>
                <Option value="Projects">Projects</Option>
                <Option value="System">System</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Status"
                style={{ width: "100%" }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Col>
            <Col>
              <Button icon={<ReloadOutlined />} onClick={resetFilters}>
                Reset
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Table Section */}
        <Card
          bodyStyle={{ padding: 0 }}
          style={{ borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        >
          <Table
            columns={columns}
            dataSource={templates}
            loading={isLoading}
            rowKey="id"
            pagination={{
              current: templatesData?.pagination?.current || 1,
              pageSize: templatesData?.pagination?.pageSize || 10,
              total: templatesData?.pagination?.total || 0,
              position: ["bottomRight"],
              showTotal: (total) => `Total ${total} templates`,
              defaultPageSize: 10,
            }}
            rowClassName="template-row"
          />
        </Card>

        {/* Preview Modal */}
        <Modal
          title="Template Preview"
          visible={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          footer={[
            <Button key="close" onClick={() => setPreviewVisible(false)}>
              Close
            </Button>,
          ]}
          width={600}
          bodyStyle={{ padding: "24px" }}
          style={{ borderRadius: 12, overflow: "hidden" }}
        >
          {previewTemplate && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Subject:
                </Text>
                <Text strong style={{ fontSize: "16px" }}>
                  {previewTemplate.subject}
                </Text>
              </div>
              <div>
                <Text type="secondary" style={{ display: "block", marginBottom: 8 }}>
                  Email Body:
                </Text>
                <div
                  style={{
                    background: "#f8f9fa",
                    padding: "20px",
                    borderRadius: "12px",
                    whiteSpace: "pre-wrap",
                    color: "#595959",
                    minHeight: "150px",
                    lineHeight: "1.6",
                  }}
                >
                  {previewTemplate.emailBody}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Create/Edit Drawer */}
        <Drawer
          title={editingTemplate ? "Edit Mail Template" : "Create Mail Template"}
          width={900}
          onClose={() => setDrawerVisible(false)}
          visible={drawerVisible}
          bodyStyle={{ paddingBottom: 80 }}
          extra={
            <Space>
              <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
              <Button
                type="primary"
                onClick={() => form.submit()}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                Save Template
              </Button>
            </Space>
          }
          footer={
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px" }}>
              <Button icon={<SendOutlined />}>Send Test Email</Button>
              <Space>
                <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
                <Button type="primary" onClick={() => form.submit()}>
                  Save Template
                </Button>
              </Space>
            </div>
          }
        >
          <Row gutter={24}>
            <Col span={16}>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ module: "HR", status: true }}
              >
                <Title level={5} style={{ marginBottom: 16 }}>
                  Basic Information
                </Title>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      name="templateName"
                      label="Template Name"
                      rules={[{ required: true, message: "Please enter template name" }]}
                    >
                      <Input placeholder="Interview Invitation" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="module"
                      label="Module"
                      rules={[{ required: true, message: "Please select module" }]}
                    >
                      <Select placeholder="Select module">
                        <Option value="HR">HR</Option>
                        <Option value="Recruitment">Recruitment</Option>
                        <Option value="Finance">Finance</Option>
                        <Option value="Projects">Projects</Option>
                        <Option value="System">System</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="triggerEvent"
                      label="Trigger Event"
                      rules={[{ required: true, message: "Please select trigger event" }]}
                    >
                      <Select placeholder="Select trigger">
                        <Option value="Interview Scheduled">Interview Scheduled</Option>
                        <Option value="Leave Approved">Leave Approved</Option>
                        <Option value="Invoice Generated">Invoice Generated</Option>
                        <Option value="Task Assigned">Task Assigned</Option>
                        <Option value="Welcome Email">Welcome Email</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="description" label="Description">
                  <TextArea rows={3} placeholder="Optional description" />
                </Form.Item>

                <Title level={5} style={{ marginTop: 24, marginBottom: 16 }}>
                  Email Content
                </Title>
                <Form.Item
                  name="subject"
                  label="Subject"
                  rules={[{ required: true, message: "Please enter subject" }]}
                >
                  <Input placeholder="Interview Invitation for {{candidate_name}}" />
                </Form.Item>
                <Form.Item
                  label="Email Body"
                  required
                  tooltip="Use variables from the right panel to personalize content"
                >
                  <TextArea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder={`Hi {{candidate_name}},

Your interview for {{position}} is scheduled on {{interview_date}}.

Best Regards
{{company_name}}`}
                    rows={12}
                    style={{
                      borderRadius: "8px",
                      border: "1px solid #40a9ff",
                      padding: "12px",
                      fontSize: "16px",
                      color: "#b0b0b0",
                    }}
                  />
                </Form.Item>
              </Form>
            </Col>

            {/* Variables Panel */}
            <Col span={8}>
              <Card
                title={
                  <Space>
                    <InfoCircleOutlined style={{ color: "#1890ff" }} />
                    <span>Available Variables</span>
                  </Space>
                }
                bodyStyle={{ padding: "12px" }}
                style={{ position: "sticky", top: 0, borderRadius: 8, height: "calc(100vh - 180px)", overflowY: "auto" }}
              >
                {VARIABLES.map((group) => (
                  <div key={group.category} style={{ marginBottom: 20 }}>
                    <Text strong type="secondary" style={{ fontSize: "11px", textTransform: "uppercase" }}>
                      {group.category}
                    </Text>
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {group.items.map((v) => (
                        <Tag
                          key={v}
                          style={{
                            cursor: "pointer",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onClick={() => copyVariable(v)}
                        >
                          <code style={{ marginRight: 4 }}>{v}</code>
                          <CopyOutlined style={{ fontSize: "10px", color: "#8c8c8c" }} />
                        </Tag>
                      ))}
                    </div>
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </Drawer>
      </div>

      <style jsx global>{`
        .template-row:hover {
          background-color: #f0f7ff !important;
          cursor: pointer;
        }
        .ant-table-thead > tr > th {
          background-color: #fafafa !important;
          font-weight: 600 !important;
        }
        .ant-card {
          border: 1px solid #f0f0f0;
        }
      `}</style>
    </MainLayout>
  );
};

export default EmailTemplatesPage;