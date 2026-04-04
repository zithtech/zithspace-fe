

"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Select,
  Modal,
  Form,
  Input,
  Switch,
  ConfigProvider,
  Popconfirm,
  App,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  SettingOutlined,
  CloseOutlined,
  PlusCircleOutlined 
} from "@ant-design/icons";
import { 
  Settings, 
  Plus, 
  Layers, 
  CheckCircle, 
  XCircle, 
  Search, 
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ClipboardList
} from "lucide-react";
import {
  useReimbursementSettings,
  useCreateReimbursementSetting,
  useUpdateReimbursementSetting,
  useDeleteReimbursementSetting,
} from "@/hooks/usereimbursementsettings";

const { Text, Title } = Typography;

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card 
    bodyStyle={{ padding: "16px 20px" }} 
    style={{ 
      borderRadius: 12, 
      border: "1px solid #f1f5f9", 
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "#64748b", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#1e293b", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

// Interface matching backend controller fields
export interface ReimbursementSetting {
  id: string;
  name: string;
  code: string;
  description?: string;  
  attachmentRequired: boolean;
  isActive: boolean;
}

export default function ReimbursementSettings() {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReimbursementSetting | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [submitting, setSubmitting] = useState(false);

  // Hooks for data fetching and mutations
  const { data: settingsData, isLoading, refetch } = useReimbursementSettings();
  const createSetting = useCreateReimbursementSetting();
  const updateSetting = useUpdateReimbursementSetting();
  const deleteSetting = useDeleteReimbursementSetting();

  // Log the data to debug
  console.log("Settings Data from hook:", settingsData);

  const settings = Array.isArray(settingsData) ? settingsData : [];

  // Filter data based on search and status
  const filteredData = settings.filter((item) => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchText.toLowerCase()); // 👈 added description search
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && item.isActive) ||
      (statusFilter === "inactive" && !item.isActive);
    
    return matchesSearch && matchesStatus;
  });

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      attachmentRequired: false,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleEdit = (record: ReimbursementSetting) => {
    setEditingItem(record);
    form.setFieldsValue({
      name: record.name,
      code: record.code,
      description: record.description,        // 👈 changed
      attachmentRequired: record.attachmentRequired,
      isActive: record.isActive,
    });
    setModalOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteSetting.mutateAsync(id);
      message.success("Setting deleted successfully");
      refetch();
    } catch (error: any) {
      message.error(error.message || "Failed to delete setting");
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      // Only include fields that exist in backend controller
      const payload = {
        name: values.name,
        code: values.code,
        description: values.description,        // 👈 changed
        attachmentRequired: values.attachmentRequired,
        isActive: values.isActive,
      };

      console.log("Submitting payload:", payload);

      if (editingItem) {
        await updateSetting.mutateAsync({
          id: editingItem.id,
          data: payload,
        });
        message.success("Setting updated successfully");
      } else {
        await createSetting.mutateAsync(payload);
        message.success("Setting created successfully");
      }

      setModalOpen(false);
      form.resetFields();
      
      // Force refetch after a short delay
      setTimeout(() => {
        refetch();
      }, 300);
    } catch (error: any) {
      console.error("Submit error:", error);
      message.error(error.message || "Validation failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-generate code from name (uppercase, underscore for spaces)
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setFieldValue("name", value);
    
    // Auto-generate code: uppercase and replace spaces with underscores
    const generatedCode = value
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace(/[^A-Z0-9_]/g, ""); // Remove special characters
    form.setFieldValue("code", generatedCode);
  };

  const stats = {
    total: settings.length,
    active: settings.filter((s) => s.isActive).length,
    inactive: settings.filter((s) => !s.isActive).length,
  };

  const columns = (
    handleEdit: (r: ReimbursementSetting) => void,
    handleConfirmDelete: (id: string) => void
  ): ColumnsType<ReimbursementSetting> => [
    {
      title: "Category Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Space size={12}>
          <div style={{ 
            width: 32, 
            height: 32, 
            borderRadius: 8, 
            background: "#eff6ff", 
            color: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Layers size={16} />
          </div>
          <Text strong style={{ color: "#1e293b", fontSize: 14 }}>{text}</Text>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      render: (text) => (
        <Tag color="blue" style={{ borderRadius: 6, padding: "0 8px", fontFamily: "monospace", fontSize: 11 }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => <Text type="secondary" style={{ fontSize: 13 }}>{text || "-"}</Text>,
      ellipsis: true,
    },
    {
      title: "Attachment",
      dataIndex: "attachmentRequired",
      key: "attachmentRequired",
      render: (value) => (
        <Tag color={value ? "blue" : "default"} style={{ border: 0, borderRadius: 20, fontWeight: 600 }}>
          {value ? "REQUIRED" : "OPTIONAL"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive) => (
        <Tag color={isActive ? "success" : "error"} style={{ border: 0, borderRadius: 20, fontWeight: 600 }}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={<Edit size={16} style={{ color: "#64748b" }} />}
            onClick={() => handleEdit(record)}
            className="action-btn"
          />
          <Popconfirm
            title="Delete category"
            description="Are you sure you want to delete this setting?"
            onConfirm={() => handleConfirmDelete(record.id)}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
            okButtonProps={{ danger: true, style: { background: "#ef4444", borderRadius: 6 } }}
            cancelButtonProps={{ style: { borderRadius: 6 } }}
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<Trash2 size={16} />}
              className="action-btn-danger"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <Space size={16} align="center">
            <div style={{ 
              background: "#eff6ff", 
              padding: 12, 
              borderRadius: 12, 
              color: "#2563eb",
              display: "flex",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
            }}>
              <Settings size={28} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Reimbursement Settings</Title>
              <Text style={{ color: "#64748b", fontSize: 15 }}>Configure and manage reimbursement categories and approval requirements.</Text>
            </div>
          </Space>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Input 
            placeholder="Search categories..." 
            prefix={<Search size={18} style={{ color: "#94a3b8" }} />}
            style={{ width: 250, borderRadius: 10, height: 44 }}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 120, height: 44 }}
            className="custom-select"
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
          <Button 
            type="primary" 
            size="large" 
            icon={<Plus size={18} />} 
            style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
            onClick={handleAdd}
          >
            Add Category
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={8}>
          <StatCard 
            label="Total Categories" 
            value={stats.total} 
            icon={ClipboardList} 
            color="#3b82f6" 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            label="Active Categories" 
            value={stats.active} 
            icon={CheckCircle} 
            color="#10b981" 
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard 
            label="Inactive Categories" 
            value={stats.inactive} 
            icon={XCircle} 
            color="#ef4444" 
          />
        </Col>
      </Row>

      {/* Main Table */}
      <Card 
        bodyStyle={{ padding: 0 }} 
        style={{ borderRadius: 16, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
      >
        <Table
          rowKey="id"
          columns={columns(handleEdit, handleConfirmDelete)}
          dataSource={filteredData}
          loading={isLoading}
          size="middle"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
            style: { padding: "16px 24px" }
          }}
        />
      </Card>

      <style dangerouslySetInnerHTML={{ __html: `
        .action-btn:hover {
          background: #f1f5f9 !important;
          color: #2563eb !important;
        }
        .action-btn-danger:hover {
          background: #fff1f2 !important;
        }
        .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          font-size: 11px !important;
          letter-spacing: 0.05em !important;
          padding: 16px !important;
        }
        .ant-table-row:hover > td {
          background: #f8fafc !important;
        }
        .ant-table-cell {
          padding: 16px !important;
        }
        .ant-input:focus, .ant-input-focused, .custom-select .ant-select-selector:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        .custom-select .ant-select-selector {
          border-radius: 10px !important;
          height: 44px !important;
          display: flex !important;
          align-items: center !important;
        }
      `}} />

        {/* ================= MODAL ================= */}
        {/* <Modal
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            setEditingItem(null);
            form.resetFields();
          }}
          footer={null}
          width={440}
          centered
          styles={{
            body: {
              padding: 0,
              display: "flex",
              flexDirection: "column",
            },
          }}
          className="rounded-lg overflow-hidden"
        >
         
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              {editingItem ? (
                <EditOutlined className="text-base text-gray-700" />
              ) : (
                <PlusCircleOutlined className="text-base text-gray-700" />
              )}
              <h3 className="text-base font-semibold text-gray-900">
                {editingItem ? "Edit Category" : "Create Category"}
              </h3>
            </div>
            <p className="text-xs text-gray-500 ml-7">
              {editingItem ? "Update reimbursement Category" : "Add new reimbursement Category"}
            </p>
          </div>

       
          <Form
            form={form}
            layout="vertical"
            className="px-5 py-3"
            size="small"
          >
            <Form.Item
              name="name"
              label={<span className="text-xs font-medium">Name</span>}
              rules={[{ required: true, message: "Name is required" }]}
            >
              <Input 
                placeholder="e.g., Travel Allowance" 
                className="w-full text-sm" 
                onChange={handleNameChange}
              />
            </Form.Item>

            <Form.Item
              name="code"
              label={<span className="text-xs font-medium">Code</span>}
              rules={[{ required: true, message: "Code is required" }]}
            >
              <Input 
                placeholder="Auto-generated" 
                className="w-full text-sm font-mono bg-gray-50" 
                readOnly
              />
            </Form.Item>

          
            <Form.Item
              name="description"
              label={<span className="text-xs font-medium">Description</span>}
            >
              <Input.TextArea
                className="w-full text-sm"
                placeholder="Enter description (optional)"
                rows={3}
              />
            </Form.Item>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Attachment Required
                  </p>
                  <p className="text-xs text-gray-500">
                    Employee must upload bills
                  </p>
                </div>

                <ConfigProvider
                  theme={{
                    components: {
                      Switch: {
                        colorPrimary: "#22c55e",
                        colorPrimaryHover: "#16a34a",
                      },
                    },
                  }}
                >
                  <Form.Item name="attachmentRequired" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </ConfigProvider>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">Status</p>
                  <p className="text-xs text-gray-500">Setting is active</p>
                </div>

                <ConfigProvider
                  theme={{
                    components: {
                      Switch: {
                        colorPrimary: "#22c55e",
                        colorPrimaryHover: "#16a34a",
                      },
                    },
                  }}
                >
                  <Form.Item name="isActive" valuePropName="checked" initialValue={true} noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </ConfigProvider>
              </div>
            </div>
          </Form>

          <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-white">
            <Button
              size="middle"
              onClick={() => {
                setModalOpen(false);
                setEditingItem(null);
                form.resetFields();
              }}
              className="px-4 text-xs"
            >
              Cancel
            </Button>

            <Button 
              type="primary" 
              size="middle" 
              onClick={handleSubmit} 
              loading={submitting}
              className="px-5 text-xs bg-blue-600 hover:bg-blue-700"
            >
              {editingItem ? "Update" : "Create"}
            </Button>
          </div>
        </Modal> */}
      <Modal
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={500}
        centered
        styles={{ body: { padding: 0 } }}
        className="rounded-lg overflow-hidden"
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
          <Space size={12}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 10, 
              background: "#eff6ff", 
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {editingItem ? <Edit size={20} /> : <Plus size={20} />}
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>
                {editingItem ? "Edit Category" : "Add New Category"}
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                {editingItem ? "Update existing category details." : "Create a new reimbursement category."}
              </Text>
            </div>
          </Space>
        </div>

        {/* Form Body */}
        <Form
          form={form}
          layout="vertical"
          style={{ padding: "24px" }}
        >
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="name"
                label={<Text strong style={{ fontSize: 13 }}>Category Name</Text>}
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input 
                  placeholder="e.g., Travel Allowance" 
                  style={{ borderRadius: 8, height: 40 }}
                  onChange={handleNameChange}
                />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="code"
                label={<Text strong style={{ fontSize: 13 }}>Category Code</Text>}
                rules={[{ required: true, message: "Code is required" }]}
              >
                <Input 
                  placeholder="AUTO-GENERATED" 
                  style={{ borderRadius: 8, height: 40, backgroundColor: "#f8fafc", fontWeight: 600, color: "#2563eb" }}
                  readOnly
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label={<Text strong style={{ fontSize: 13 }}>Description</Text>}
          >
            <Input.TextArea
              placeholder="Brief explanation of this reimbursement category..."
              rows={3}
              style={{ borderRadius: 10 }}
            />
          </Form.Item>

          <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <Text strong style={{ display: "block" }}>Attachment Required</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Employees must upload bills for this category</Text>
              </div>
              <Form.Item name="attachmentRequired" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Text strong style={{ display: "block" }}>Display Status</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>Visible to employees in the claim form</Text>
              </div>
              <Form.Item name="isActive" valuePropName="checked" initialValue={true} noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>
          </div>
        </Form>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9", textAlign: "right", background: "#fcfcfc" }}>
          <Space size={12}>
            <Button
              onClick={() => {
                setModalOpen(false);
                setEditingItem(null);
                form.resetFields();
              }}
              style={{ borderRadius: 8, height: 40 }}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={submitting}
              style={{ borderRadius: 8, height: 40, minWidth: 100, fontWeight: 600 }}
            >
              {editingItem ? "Update Category" : "Save Category"}
            </Button>
          </Space>
        </div>
      </Modal>
      </div>
  );
}



