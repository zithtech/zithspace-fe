

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
  useReimbursementSettings,
  useCreateReimbursementSetting,
  useUpdateReimbursementSetting,
  useDeleteReimbursementSetting,
} from "@/hooks/usereimbursementsettings";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const { Text } = Typography;

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
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <span className="font-medium text-sm">{text}</span>,
        sorter: (a, b) => a.name.localeCompare(b.name),
      },
      {
        title: "Code",
        dataIndex: "code",
        key: "code",
        render: (text) => <span className="text-sm font-mono">{text}</span>,
      },
      {
        title: "Description",        // 👈 changed
        dataIndex: "description",
        key: "description",
        render: (text) => text || "-",
        ellipsis: true,              // 👈 optional truncation
      },
      {
        title: "Attachment",
        dataIndex: "attachmentRequired",
        key: "attachmentRequired",
        align: "center",
        render: (value) => (
          <Tag color={value ? "blue" : "default"}>
            {value ? "Required" : "Optional"}
          </Tag>
        ),
      },
      {
        title: "Status",
        dataIndex: "isActive",
        key: "isActive",
        align: "center",
        render: (isActive) => (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Active" : "Inactive"}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        align: "center",
        width: 120,
        render: (_, record) => (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="text-blue-600 hover:text-blue-700"
            />
            <Popconfirm
              title="Delete this setting?"
              description="This action cannot be undone."
              onConfirm={() => handleConfirmDelete(record.id)}
              okText="Delete"
              okType="danger"
              cancelText="Cancel"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                className="hover:bg-red-50"
              />
            </Popconfirm>
          </Space>
        ),
      },
    ];

  return (
    // <Card className="rounded-lg shadow-sm bg-white border border-gray-100">
    <div className="flex flex-col flex-1 overflow-visible p-3">
      {/* HEADER SECTION */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
        {/* LEFT SIDE */}
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-gray-900">
            <Space size={4}>
              <SettingOutlined className="text-blue-600" />
              <span>Reimbursement Settings</span>
            </Space>
          </h2>

          <p className="text-xs text-gray-500 max-w-[500px]">
            Configure reimbursement categories and settings
          </p>

          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
              Total: {stats.total}
            </div>
            <div className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
              Active: {stats.active}
            </div>
            <div className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-100">
              Inactive: {stats.inactive}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE – ACTIONS */}
        <div className="flex items-center gap-2">
          {/* SEARCH */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-44 px-3 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none focus:border-blue-500 bg-gray-50/50"
            />
          </div>

          {/* STATUS FILTER */}
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-24"
            size="small"
          >
            <Select.Option value="all">All</Select.Option>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>

          {/* CREATE BUTTON */}
          <Button
            type="primary"
            size="middle"
            icon={<PlusOutlined />}
            className="h-8 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm"
            onClick={handleAdd}
          >
            Add Category
          </Button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <style jsx global>{`
          .settings-table .ant-table-thead > tr > th {
            padding: 8px 10px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            background-color: #fafafa !important;
          }
          .settings-table .ant-table-tbody > tr > td {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
          .settings-table .ant-table-tbody > tr:hover > td {
            background-color: #f5f9ff !important;
          }
          .settings-table .ant-pagination {
            margin-top: 10px !important;
          }
        `}</style>

      <div className="mt-3 flex-1 overflow-hidden">
        <ZukvoLoadingOverlay loading={isLoading} message="">
              <Table
                        className="settings-table"
                        rowKey="id"
                        columns={columns(handleEdit, handleConfirmDelete)}
                        dataSource={filteredData}
                        pagination={{
                          pageSize: 8,
                          showSizeChanger: false,
                          showQuickJumper: false,
                          position: ["bottomRight"],
                        }}
                        locale={{ emptyText: "No settings found" }}
                      />
              </ZukvoLoadingOverlay>
      </div>

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
        {/* ===== HEADER with left alignment ===== */}
        <div className="px-1 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-50">
              {editingItem ? (
                <EditOutlined className="text-sm text-blue-600" />
              ) : (
                <PlusCircleOutlined className="text-sm text-blue-600" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {editingItem ? "Edit Category" : "Create Category"}
              </h3>
              <p className="text-xs text-gray-500">
                {editingItem ? "Update reimbursement category" : "Add new reimbursement category"}
              </p>
            </div>
          </div>
        </div>

        {/* ===== FORM with flex layout for name and code ===== */}
        <Form
          form={form}
          layout="vertical"
          className="px-5 py-3"
          size="small"
        >
          {/* Name and Code in one line - flex row */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Form.Item
                name="name"
                label={<span className="text-xs font-medium text-gray-700">Category</span>}
                rules={[{ required: true, message: "Name is required" }]}
                className="mb-3"
              >
                <Input
                  placeholder="e.g., Travel Allowance"
                  className="w-full text-sm h-8"
                  onChange={handleNameChange}
                />
              </Form.Item>
            </div>

            <div className="flex-1">
              <Form.Item
                name="code"
                label={<span className="text-xs font-medium text-gray-700">Code</span>}
                rules={[{ required: true, message: "Code is required" }]}
                className="mb-3"
              >
                <Input
                  placeholder="Auto-generated"
                  className="w-full text-sm font-mono bg-gray-50 h-8"
                  readOnly
                />
              </Form.Item>
            </div>
          </div>

          {/* Description field - full width */}
          <Form.Item
            name="description"
            label={<span className="text-xs font-medium text-gray-700">Description</span>}
            className="mb-3"
          >
            <Input.TextArea
              className="w-full text-sm"
              placeholder="Enter description (optional)"
              rows={2}
            />
          </Form.Item>

          {/* Settings section */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3 space-y-3">
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
                <p className="text-xs text-gray-500">
                  Category is active and available
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
                <Form.Item name="isActive" valuePropName="checked" initialValue={true} noStyle>
                  <Switch size="small" />
                </Form.Item>
              </ConfigProvider>
            </div>
          </div>
        </Form>

        {/* ===== FOOTER ===== */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200">
          <Button
            size="middle"
            onClick={() => {
              setModalOpen(false);
              setEditingItem(null);
              form.resetFields();
            }}
            className="px-4 text-xs h-8"
          >
            Cancel
          </Button>

          <Button
            type="primary"
            size="middle"
            onClick={handleSubmit}
            loading={submitting}
            className="px-4 text-xs h-8 bg-blue-600 hover:bg-blue-700"
          >
            {editingItem ? "Update" : "Create"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}



