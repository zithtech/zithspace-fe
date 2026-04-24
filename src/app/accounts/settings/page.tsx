"use client";
import { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useExpenseCategories, useCreateExpenseCategory, useUpdateExpenseCategory, useDeleteExpenseCategory } from "@/hooks/useExpenseCategories";
import { Category as ExpenseCategory } from "@/services/expenseCategoryService";
import {
  Space,
  Typography,
  Button,
  Card,
  Row,
  Col,
  Table,
  Modal,
  Form,
  Input,
  message,
  Divider,
  Spin,
  Drawer,
  Tooltip,
  Tag,
  Popconfirm,
  Badge,
  Switch
} from "antd";

import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Settings as SettingsIcon,
  FolderOpen,
  Tag as TagIcon,
  X,
  Check,
  AlertCircle
} from "lucide-react";

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;

export default function AccountsSettingsPage() {
  console.log('AccountsSettingsPage: Component rendering...');

  const { can } = usePermission();
  const { user } = useAuth();
  const router = useRouter();

  console.log('AccountsSettingsPage: Permissions checked, canReadAccounts:', can("ACCOUNTS_READ"));

  // State management
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  // Check permissions
  const canReadAccounts = can("ACCOUNTS_READ");
  const canCreateAccounts = can("ACCOUNTS_CREATE");
  const canUpdateAccounts = can("ACCOUNTS_UPDATE");
  const canDeleteAccounts = can("ACCOUNTS_DELETE");

  // API calls
  console.log('AccountsSettingsPage: About to call useExpenseCategories...');
  const { data: categories = [], isLoading: loading, error } = useExpenseCategories();
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();

  // Debug logging
  console.log('Categories data:', categories);
  console.log('Loading:', loading);
  console.log('Error:', error);
  console.log('AccountsSettingsPage: Hook execution completed');

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setDrawerVisible(true);
  };

  const handleEdit = (category: ExpenseCategory) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      color: category.color,
      isActive: category.isActive
    });
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        // Update existing category
        updateMutation.mutate({
          id: editingCategory.id,
          data: values
        });
      } else {
        // Create new category
        createMutation.mutate(values);
      }
      setDrawerVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Failed to save category");
    }
  };

  const filteredCategories = categories.filter((category: ExpenseCategory) =>
    category.name.toLowerCase().includes(searchText.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  // Debug filtering
  console.log('Search text:', searchText);
  console.log('Filtered categories:', filteredCategories);

  const columns = [
    {
      title: "CATEGORY NAME",
      dataIndex: "name",
      key: "name",
      width: 200,
      render: (text: string, record: ExpenseCategory) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: record.color }}
          >
            {text.charAt(0)}
          </div>
          <div className="truncate">
            <div className="font-bold truncate" style={{ color: 'var(--settings-text-primary)' }}>
              {text}
            </div>
            <div className="text-[10px] truncate" style={{ color: 'var(--settings-text-muted)' }}>
              {record.description || "No description"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "CREATED DATE",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date: string) => (
        <div style={{ color: 'var(--settings-text-secondary)' }}>
          {new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 100,
      render: (_: any, record: ExpenseCategory) => (
        <Space>
          {canUpdateAccounts && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<Edit size={16} />}
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {canDeleteAccounts && (
            <Popconfirm
              title="Delete Category"
              description="Are you sure you want to delete this category?"
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={16} />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  console.log('AccountsSettingsPage: Permission check - canReadAccounts:', canReadAccounts);

  if (!canReadAccounts) {
    console.log('AccountsSettingsPage: Access denied, returning early');
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-4" style={{ color: 'var(--settings-text-muted)' }} />
            <Title level={4} style={{ color: 'var(--settings-text-secondary)' }}>
              Access Denied
            </Title>
            <Paragraph style={{ color: 'var(--settings-text-muted)' }}>
              You don't have permission to access accounts settings.
            </Paragraph>
          </div>
        </div>
      </MainLayout>
    );
  }

  console.log('AccountsSettingsPage: Permission check passed, proceeding to render');

  return (
    <MainLayout>
      <div style={{
        margin: "0 -24px",
        padding: "8px 32px 24px 32px",
        background: "var(--customers-page-bg)",
        minHeight: "calc(100vh - 64px)"
      }}>
        {/* Header */}
        <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Space size={8} align="center">
              <div style={{ background: "var(--bg-blue-50)", padding: "6px 8px", borderRadius: 8, color: "var(--text-sky-500)", display: "flex" }}>
                <FolderOpen style={{ fontSize: 18 }} />
              </div>
              <div>
                <Title level={5} style={{ margin: 0, fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>Accounts Settings</Title>
                <Typography.Text style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Manage your expense categories and account settings.</Typography.Text>
              </div>
            </Space>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search categories..."
              prefix={<Search size={14} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                width: 240,
                borderRadius: 8,
                border: '1px solid var(--border-slate-200)',
                background: 'var(--bg-pure-white)',
                fontSize: '12px'
              }}
              size="middle"
            />
            {canCreateAccounts && (
              <Button
                type="primary"
                size="middle"
                icon={<Plus size={16} />}
                style={{ borderRadius: 8, height: 38, padding: "0 16px", fontWeight: 600 }}
                onClick={handleCreate}
              >
                Add Category
              </Button>
            )}
          </div>
        </div>

        <Divider style={{ margin: "4px -32px 12px -32px", width: "calc(100% + 64px)", borderColor: 'var(--border-color)' }} />

        {loading ? (
          <div className="flex justify-center items-center h-64 rounded-2xl" style={{ backgroundColor: 'var(--settings-loading-bg)', border: '1px solid var(--settings-loading-border)' }}>
            <Spin indicator={<FolderOpen size={32} className="animate-pulse" style={{ color: 'var(--text-sky-500)' }} />} />
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ backgroundColor: 'var(--settings-empty-bg)', border: '1px solid var(--settings-empty-border)' }}>
            <div className="size-16 rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-6" style={{ backgroundColor: 'var(--bg-pure-white)' }}>
              <FolderOpen size={32} style={{ color: 'var(--settings-empty-icon)' }} />
            </div>
            <Title level={4} style={{ color: 'var(--settings-empty-title)' }}>No categories found</Title>
            <Typography.Text style={{ color: 'var(--settings-empty-desc)' }} className="mb-6 block">
              {searchText ? 'Try a different search term' : 'Create your first category to get started'}
            </Typography.Text>
            {!searchText && canCreateAccounts && (
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                onClick={handleCreate}
                style={{ borderRadius: 12, height: 48, padding: "0 24px" }}
              >
                Create First Category
              </Button>
            )}
          </div>
        ) : (
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              border: "1px solid var(--settings-card-border)",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
              overflow: "hidden",
              backgroundColor: "var(--settings-card-bg)"
            }}
            styles={{ body: { padding: 0 } }}
          >
            <Table
              size="middle"
              columns={columns}
              dataSource={filteredCategories}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                style: { padding: "16px 24px" },
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} categories`,
              }}
              scroll={{ x: 800 }}
              rowClassName={() => "category-table-row"}
            />
          </Card>
        )}

        <style dangerouslySetInnerHTML={{
          __html: `
          .category-table-row:hover {
            background-color: var(--settings-table-row-hover) !important;
          }
          .ant-table-thead > tr > th {
            background-color: var(--settings-table-header-bg) !important;
            color: var(--settings-table-header-text) !important;
            font-weight: 700 !important;
            font-size: 12px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            border-bottom: 2px solid var(--settings-table-header-border) !important;
          }
          .ant-table-tbody > tr > td {
            padding: 8px 16px !important;
            border-bottom: 1px solid var(--settings-table-border) !important;
          }
        ` }} />

        {/* Add/Edit Category Drawer */}
        <Drawer
          title={
            <Space size={12}>
              <div style={{ background: 'var(--bg-blue-50)', padding: 8, borderRadius: 10, color: 'var(--text-blue-700)', display: 'flex' }}>
                <TagIcon size={18} />
              </div>
              <div style={{ lineHeight: 1.1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {editingCategory ? "Edit Category" : "Add New Category"}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>
                  {editingCategory ? "Update the details of your expense category" : "Create a new category to organize your accounts"}
                </div>
              </div>
            </Space>
          }
          width={450}
          open={drawerVisible}
          onClose={() => {
            setDrawerVisible(false);
            form.resetFields();
          }}
          styles={{
            header: { borderBottom: '1px solid var(--border-slate-200)', padding: '20px 24px' },
            body: { padding: '24px' },
            footer: { borderTop: '1px solid var(--border-slate-200)', padding: '16px 24px' }
          }}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                style={{ borderRadius: 8 }}
                onClick={() => {
                  setDrawerVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                style={{ borderRadius: 8, padding: "0 20px", fontWeight: 600, background: "var(--customers-header-icon-color)", border: "none" }}
                onClick={() => form.submit()}
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingCategory ? "Update Category" : "Create Category"}
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              isActive: true,
              color: "#1890ff"
            }}
            requiredMark={false}
          >
            <Form.Item
              name="name"
              label={<Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Category Name</Text>}
              rules={[
                { required: true, message: "Please enter category name" },
                { min: 2, message: "Name must be at least 2 characters" }
              ]}
            >
              <Input 
                placeholder="e.g., Operating Expenses" 
                style={{ borderRadius: 8, height: 40 }}
              />
            </Form.Item>

            <Form.Item
              name="description"
              label={<Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Description</Text>}
              rules={[
                { max: 200, message: "Description cannot exceed 200 characters" }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Brief description of this category..."
                showCount
                maxLength={200}
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 8 }}>
              <Form.Item
                name="color"
                label={<Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Theme Color</Text>}
                rules={[{ required: true, message: "Please select a color" }]}
              >
                <div className="flex items-center gap-3 p-2 border rounded-lg" style={{ borderColor: 'var(--border-slate-200)', background: 'var(--bg-slate-50)' }}>
                  <Input
                    type="color"
                    style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                  <Text style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Click to pick</Text>
                </div>
              </Form.Item>

              <Form.Item
                name="isActive"
                label={<Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Category Status</Text>}
                valuePropName="checked"
              >
                <div className="flex items-center gap-3 h-[58px]">
                  <Switch 
                    style={{ background: form.getFieldValue('isActive') ? 'var(--customers-header-icon-color)' : '' }}
                  />
                  <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {form.getFieldValue('isActive') ? 'Active' : 'Inactive'}
                  </Text>
                </div>
              </Form.Item>
            </div>
          </Form>
        </Drawer>
      </div>
    </MainLayout>
  );
}