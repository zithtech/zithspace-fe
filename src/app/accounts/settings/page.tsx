"use client";
import { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from "@/hooks/useExpenseCategories";
import { Category as ExpenseCategory } from "@/services/expenseCategoryService";
import {
  Space,
  Typography,
  Button,
  Form,
  Input,
  Table,
  message,
  Spin,
  Drawer,
  Tooltip,
  Popconfirm,
  Switch,
  Select,
  Card,
  Empty,
  Tag,
} from "antd";

import {
  Plus,
  Search,
  Trash2,
  Edit,
  FolderOpen,
  Tag as TagIcon,
  AlertCircle,
  Filter as FilterIcon,
  Check,
  History,
} from "lucide-react";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useActivitySource } from "@/hooks/useActivitySource";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const PRESET_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#0ea5e9",
];

export default function AccountsSettingsPage() {
  useActivitySource({ section: "FINANCE", module: "Accounts", page: "AccountsSettings" });

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [form] = Form.useForm();
  const isActiveValue = Form.useWatch("isActive", form);
  const colorValue = Form.useWatch("color", form);

  const {
    canReadAccountConfig,
    canCreateAccountConfig,
    canUpdateAccountConfig,
    canDeleteAccountConfig,
  } = usePermission();



  const { data: categories = [], isLoading: loading } = useExpenseCategories();
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();

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
      color: category.color || "#3b82f6",
      isActive: category.isActive,
    });
    setDrawerVisible(true);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, data: values });
      } else {
        createMutation.mutate(values);
      }
      setDrawerVisible(false);
      form.resetFields();
    } catch (error) {
      message.error("Failed to save category");
    }
  };

  const counts = useMemo(() => {
    const active = categories.filter((c: ExpenseCategory) => c.isActive).length;
    return {
      total: categories.length,
      active,
      inactive: categories.length - active,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    return categories.filter((c: ExpenseCategory) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && c.isActive) ||
        (statusFilter === "inactive" && !c.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [categories, searchText, statusFilter]);

  const columns = [
    {
      title: "Category",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ExpenseCategory) => (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="settings-cat__avatar"
            style={{ ['--cat-color' as any]: record.color || "#3b82f6" }}
          >
            {text.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="settings-cat__name">{text}</div>
            <div className="settings-cat__desc">
              {record.description || "No description"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 130,
      render: (isActive: boolean) => (
        <span className={`settings-status ${isActive ? "is-active" : "is-inactive"}`}>
          <span className="settings-status__dot" />
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (date: string) => (
        <div className="settings-cat__date">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 110,
      align: "center" as const,
      render: (_: any, record: ExpenseCategory) => (
        <Space size={4} className="settings-row-actions">
          {canUpdateAccountConfig && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<Edit size={15} />}
                onClick={() => handleEdit(record)}
                className="settings-row-actions__btn settings-row-actions__edit"
                aria-label="Edit category"
              />
            </Tooltip>
          )}
          {canDeleteAccountConfig && (
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
                  icon={<Trash2 size={15} />}
                  className="settings-row-actions__btn settings-row-actions__delete"
                  aria-label="Delete category"
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  if (!canReadAccountConfig) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "var(--settings-text-muted)" }} />
            <Title level={4} style={{ color: "var(--settings-text-secondary)" }}>
              Access Denied
            </Title>
            <Paragraph style={{ color: "var(--settings-text-muted)" }}>
              You don't have permission to access accounts settings.
            </Paragraph>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div
        style={{
          margin: "0 -24px",
          background: "var(--customers-page-bg)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <TimeTrackingHeader
          style={{ padding: "9.5px 32px", marginBottom: 12 }}
          icon={<FolderOpen size={20} color="#8b5cf6" />}
          title="Accounts Settings"
          description="Manage your expense categories and account settings."
          extra={
            <div className="flex items-center gap-3">
              {canCreateAccountConfig && (
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
          }
        />

        <div style={{ padding: "0 32px 32px 32px" }}>
          {/* Filter bar */}
          <div className="settings-filter-bar">
            <div className="settings-filter-bar__label">
              <FilterIcon size={13} />
              <span>Filters</span>
            </div>

            <div className="settings-filter-bar__search">
              <Input
                placeholder="Search categories..."
                prefix={<Search size={14} className="text-slate-400" />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                variant="borderless"
                allowClear
                className="settings-filter-bar__input"
              />
            </div>

            <div className="settings-filter-bar__select">
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                variant="borderless"
                className="w-full h-[34px]"
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "active", label: "Active only" },
                  { value: "inactive", label: "Inactive only" },
                ]}
              />
            </div>

            <div className="settings-filter-bar__counts">
              <span className="settings-filter-bar__chip">
                <span className="settings-filter-bar__chip-dot" style={{ background: "#3b82f6" }} />
                {counts.total} total
              </span>
              <span className="settings-filter-bar__chip">
                <span className="settings-filter-bar__chip-dot" style={{ background: "#10b981" }} />
                {counts.active} active
              </span>
              <span className="settings-filter-bar__chip">
                <span className="settings-filter-bar__chip-dot" style={{ background: "#94a3b8" }} />
                {counts.inactive} inactive
              </span>
            </div>
          </div>

          <div className="settings-content-area">
            {loading ? (
              <div className="settings-state-card">
                <Spin
                  indicator={
                    <FolderOpen
                      size={32}
                      className="animate-pulse"
                      style={{ color: "var(--text-sky-500)" }}
                    />
                  }
                />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="settings-empty">
                <div className="settings-empty__icon">
                  <FolderOpen size={28} />
                </div>
                <div className="settings-empty__title">No categories found</div>
                <div className="settings-empty__desc">
                  {searchText || statusFilter !== "all"
                    ? "Try adjusting your filters or search term"
                    : "Create your first category to start organizing your transactions"}
                </div>
                {!searchText && statusFilter === "all" && canCreateAccountConfig && (
                  <Button
                    type="primary"
                    size="large"
                    icon={<Plus size={18} />}
                    onClick={handleCreate}
                    style={{ borderRadius: 12, height: 44, padding: "0 20px", fontWeight: 600 }}
                  >
                    Create First Category
                  </Button>
                )}
              </div>
            ) : (
              <div className="settings-table-card">
                <div className="settings-table-card__header">
                  <div className="settings-table-card__title">
                    <TagIcon size={14} style={{ color: "#3b82f6" }} />
                    <span>Expense Categories</span>
                  </div>
                  <div className="settings-table-card__count">
                    {filteredCategories.length.toLocaleString()}{" "}
                    {filteredCategories.length === 1 ? "category" : "categories"}
                  </div>
                </div>
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
                    style: { padding: "12px 20px" },
                    showTotal: (total, range) =>
                      `${range[0]}-${range[1]} of ${total} categories`,
                  }}
                  scroll={{ x: 800 }}
                  rowClassName={() => "settings-table-row"}
                />
              </div>
            )}
          </div>

          {/* Add/Edit Category Drawer */}
          <Drawer
            title={
              <div className="settings-drawer__title">
                <div
                  className={`settings-drawer__title-icon ${
                    editingCategory ? "is-edit" : "is-add"
                  }`}
                >
                  {editingCategory ? <Edit size={18} /> : <Plus size={18} />}
                </div>
                <div className="settings-drawer__title-text">
                  <div className="settings-drawer__title-main">
                    {editingCategory ? "Edit Category" : "New Category"}
                  </div>
                  <div className="settings-drawer__title-sub">
                    {editingCategory
                      ? "Update the details of this expense category"
                      : "Create a new category to organize your transactions"}
                  </div>
                </div>
              </div>
            }
            width={520}
            open={drawerVisible}
            onClose={() => {
              setDrawerVisible(false);
              form.resetFields();
            }}
            destroyOnClose
            styles={{
              header: {
                borderBottom: "1px solid var(--accounts-card-border)",
                padding: "18px 22px",
                background: "var(--accounts-card-bg)",
              },
              body: { padding: 0, background: "var(--customers-page-bg)" },
              footer: {
                borderTop: "1px solid var(--accounts-card-border)",
                padding: "14px 22px",
                background: "var(--accounts-card-bg)",
              },
            }}
            footer={
              <div className="settings-drawer__footer">
                <Button
                  size="middle"
                  style={{ borderRadius: 8, height: 38, padding: "0 16px" }}
                  onClick={() => {
                    setDrawerVisible(false);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="middle"
                  icon={editingCategory ? <Edit size={14} /> : <Plus size={14} />}
                  onClick={() => form.submit()}
                  loading={createMutation.isPending || updateMutation.isPending}
                  style={{ borderRadius: 8, height: 38, padding: "0 18px", fontWeight: 600 }}
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
              initialValues={{ isActive: true, color: "#3b82f6" }}
              requiredMark={false}
              className="settings-form"
            >
              <div className="settings-drawer__body">
                {/* Section 1: Identity */}
                <div className="settings-section">
                  <div className="settings-section__head">
                    <span className="settings-section__num">01</span>
                    <div>
                      <div className="settings-section__title">Identity</div>
                      <div className="settings-section__sub">
                        Give this category a clear name and description
                      </div>
                    </div>
                  </div>

                  <Form.Item
                    name="name"
                    label="Category Name"
                    rules={[
                      { required: true, message: "Please enter category name" },
                      { min: 2, message: "Name must be at least 2 characters" },
                    ]}
                  >
                    <Input size="large" placeholder="e.g., Operating Expenses" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ max: 200, message: "Description cannot exceed 200 characters" }]}
                  >
                    <TextArea
                      rows={4}
                      placeholder="Brief description of this category..."
                      showCount
                      maxLength={200}
                    />
                  </Form.Item>
                </div>

                {/* Section 2: Theme color */}
                <div className="settings-section">
                  <div className="settings-section__head">
                    <span className="settings-section__num">02</span>
                    <div>
                      <div className="settings-section__title">Theme Color</div>
                      <div className="settings-section__sub">
                        Pick a color used to identify this category in lists and charts
                      </div>
                    </div>
                  </div>

                  <Form.Item
                    name="color"
                    rules={[{ required: true, message: "Please select a color" }]}
                  >
                    <ColorPicker presets={PRESET_COLORS} />
                  </Form.Item>

                  <div className="settings-color-preview">
                    <div
                      className="settings-color-preview__swatch"
                      style={{ background: colorValue || "#3b82f6" }}
                    />
                    <div className="settings-color-preview__meta">
                      <div className="settings-color-preview__label">Preview</div>
                      <div className="settings-color-preview__hex">
                        {(colorValue || "#3b82f6").toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Status */}
                <div className="settings-section">
                  <div className="settings-section__head">
                    <span className="settings-section__num">03</span>
                    <div>
                      <div className="settings-section__title">Visibility</div>
                      <div className="settings-section__sub">
                        Inactive categories are hidden from new transaction forms
                      </div>
                    </div>
                  </div>

                  <Form.Item name="isActive" valuePropName="checked" noStyle>
                    <Switch
                      checkedChildren={<Check size={12} />}
                      unCheckedChildren={null}
                    />
                  </Form.Item>
                  <span className="settings-status-toggle__text">
                    <span
                      className={`settings-status-toggle__dot ${
                        isActiveValue ? "is-active" : "is-inactive"
                      }`}
                    />
                    {isActiveValue ? "Category is active" : "Category is inactive"}
                  </span>
                </div>
              </div>
            </Form>
          </Drawer>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* ===== Filter Bar ===== */
        .settings-filter-bar {
          margin-bottom: 16px;
          padding: 10px 14px;
          background: var(--accounts-stat-bg);
          border: 1px solid var(--accounts-card-border);
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: nowrap;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
        }
        .settings-filter-bar__label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          color: #6366f1;
          background: linear-gradient(135deg, rgba(99,102,241,0.10), rgba(139,92,246,0.10));
          border: 1px solid rgba(99,102,241,0.18);
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .settings-filter-bar__search { flex: 1; min-width: 180px; }
        .settings-filter-bar__input {
          background: var(--bg-pure-white);
          border-radius: 8px !important;
          border: 1px solid var(--accounts-card-border) !important;
          height: 34px;
          font-size: 12px;
          padding: 0 10px;
          transition: border-color .15s ease;
        }
        .settings-filter-bar__input:hover,
        .settings-filter-bar__input:focus,
        .settings-filter-bar__input:focus-within {
          border-color: #6366f1 !important;
        }
        .settings-filter-bar__select {
          width: 160px;
          background: var(--bg-pure-white);
          border-radius: 8px;
          border: 1px solid var(--accounts-card-border);
          height: 34px;
          font-size: 12px;
        }
        .settings-filter-bar__counts {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .settings-filter-bar__chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          background: var(--bg-pure-white);
          border: 1px solid var(--accounts-card-border);
          font-size: 11px;
          font-weight: 600;
          color: var(--accounts-stat-label);
        }
        .settings-filter-bar__chip-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          display: inline-block;
        }

        /* ===== Table Card ===== */
        .settings-table-card {
          border: 1px solid var(--accounts-card-border);
          background: var(--accounts-card-bg);
          border-radius: 16px;
          overflow: hidden;
        }
        .settings-table-card__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--accounts-card-border);
          background: linear-gradient(180deg, color-mix(in srgb, var(--accounts-card-bg) 96%, transparent) 0%, var(--accounts-card-bg) 100%);
        }
        .settings-table-card__title {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--accounts-stat-value);
          letter-spacing: -0.01em;
        }
        .settings-table-card__count {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--accounts-stat-sub);
          padding: 4px 10px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--accounts-stat-label) 10%, transparent);
          border: 1px solid var(--accounts-card-border);
        }
        .settings-table-card .ant-table-thead > tr > th {
          background: var(--bg-table-header) !important;
          color: var(--accounts-stat-label) !important;
          font-weight: 700 !important;
          font-size: 10.5px !important;
          letter-spacing: .08em !important;
          text-transform: uppercase !important;
          border-bottom: 1px solid var(--accounts-card-border) !important;
        }
        .settings-table-card .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid var(--accounts-card-border) !important;
          transition: background-color .15s ease;
        }
        .settings-table-row:hover > td {
          background: color-mix(in srgb, var(--accounts-stat-label) 5%, transparent) !important;
        }

        /* Category cell */
        .settings-cat__avatar {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          background: var(--cat-color);
          box-shadow: 0 8px 18px -10px color-mix(in srgb, var(--cat-color) 70%, transparent),
                      inset 0 0 0 1px color-mix(in srgb, var(--cat-color) 40%, transparent);
        }
        .settings-cat__name {
          font-size: 13px;
          font-weight: 700;
          color: var(--accounts-stat-value);
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .settings-cat__desc {
          font-size: 11px;
          color: var(--accounts-stat-sub);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 360px;
        }
        .settings-cat__date {
          font-size: 12px;
          color: var(--accounts-stat-label);
          font-weight: 500;
          font-variant-numeric: tabular-nums;
        }

        /* Status pill */
        .settings-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .04em;
        }
        .settings-status.is-active {
          color: var(--accounts-emerald-text);
          background: var(--accounts-emerald-bg);
          border: 1px solid color-mix(in srgb, var(--accounts-emerald-text) 25%, transparent);
        }
        .settings-status.is-inactive {
          color: var(--accounts-stat-sub);
          background: color-mix(in srgb, var(--accounts-stat-sub) 10%, transparent);
          border: 1px solid var(--accounts-card-border);
        }
        .settings-status__dot {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: currentColor;
          box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 18%, transparent);
        }
        .settings-status.is-active .settings-status__dot {
          animation: settings-pulse 2.4s ease-in-out infinite;
        }
        @keyframes settings-pulse {
          0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 18%, transparent); }
          50% { box-shadow: 0 0 0 5px color-mix(in srgb, currentColor 8%, transparent); }
        }

        /* Inline action buttons */
        .settings-row-actions__btn {
          width: 28px !important;
          height: 28px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          border-radius: 8px !important;
          border: 1px solid transparent !important;
          color: var(--accounts-stat-sub) !important;
          transition: all .15s ease;
        }
        .settings-row-actions__edit:hover {
          color: #3b82f6 !important;
          background: rgba(59,130,246,0.10) !important;
          border-color: rgba(59,130,246,0.22) !important;
        }
        .settings-row-actions__delete:hover {
          color: var(--accounts-rose-text) !important;
          background: var(--accounts-rose-bg) !important;
          border-color: color-mix(in srgb, var(--accounts-rose-text) 25%, transparent) !important;
        }

        /* Empty / Loading state */
        .settings-state-card {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          background: var(--accounts-stat-bg);
          border: 1px solid var(--accounts-card-border);
          border-radius: 16px;
        }
        .settings-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 64px 24px;
          background: var(--accounts-stat-bg);
          border: 1px solid var(--accounts-card-border);
          border-radius: 16px;
        }
        .settings-empty__icon {
          width: 64px;
          height: 64px;
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          color: #6366f1;
          background: linear-gradient(135deg, rgba(99,102,241,0.14), rgba(139,92,246,0.12));
          border: 1px solid rgba(99,102,241,0.22);
          box-shadow: 0 12px 28px -16px rgba(99,102,241,0.55);
        }
        .settings-empty__title {
          font-size: 16px;
          font-weight: 800;
          color: var(--accounts-stat-value);
          letter-spacing: -0.01em;
        }
        .settings-empty__desc {
          font-size: 12.5px;
          color: var(--accounts-stat-sub);
          margin-top: 4px;
          margin-bottom: 18px;
          max-width: 340px;
        }

        /* ===== Drawer ===== */
        .settings-drawer__title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .settings-drawer__title-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .settings-drawer__title-icon.is-add {
          color: #3b82f6;
          background: linear-gradient(135deg, rgba(59,130,246,0.16), rgba(99,102,241,0.14));
          border: 1px solid rgba(59,130,246,0.24);
          box-shadow: 0 8px 18px -10px rgba(59,130,246,0.55);
        }
        .settings-drawer__title-icon.is-edit {
          color: #f59e0b;
          background: linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.14));
          border: 1px solid rgba(245,158,11,0.28);
          box-shadow: 0 8px 18px -10px rgba(245,158,11,0.55);
        }
        .settings-drawer__title-text { line-height: 1.15; }
        .settings-drawer__title-main {
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.01em;
          color: var(--accounts-stat-value);
        }
        .settings-drawer__title-sub {
          font-size: 11.5px;
          font-weight: 500;
          color: var(--accounts-stat-sub);
          margin-top: 2px;
        }
        .settings-drawer__body {
          padding: 18px 22px 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .settings-drawer__footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }

        /* Section card */
        .settings-section {
          background: var(--accounts-stat-bg);
          border: 1px solid var(--accounts-card-border);
          border-radius: 16px;
          padding: 18px 18px 6px;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
        }
        .settings-section__head {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px dashed var(--accounts-card-border);
        }
        .settings-section__num {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .04em;
          color: #6366f1;
          background: rgba(99,102,241,0.10);
          border: 1px solid rgba(99,102,241,0.22);
          font-variant-numeric: tabular-nums;
        }
        .settings-section__title {
          font-size: 13px;
          font-weight: 700;
          color: var(--accounts-stat-value);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .settings-section__sub {
          font-size: 11px;
          color: var(--accounts-stat-sub);
          margin-top: 2px;
          font-weight: 500;
        }

        /* Form polish */
        .settings-form .ant-form-item-label > label {
          font-size: 11.5px !important;
          font-weight: 600 !important;
          color: var(--accounts-stat-label) !important;
          letter-spacing: .02em;
          height: 22px !important;
        }
        .settings-form .ant-form-item {
          margin-bottom: 14px;
        }
        .settings-form .ant-input,
        .settings-form .ant-input-affix-wrapper,
        .settings-form .ant-select-selector,
        .settings-form .ant-input-textarea {
          border-radius: 10px !important;
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .settings-form .ant-input:hover,
        .settings-form .ant-input-affix-wrapper:hover,
        .settings-form .ant-select:hover .ant-select-selector {
          border-color: #6366f1 !important;
        }
        .settings-form .ant-input:focus,
        .settings-form .ant-input-focused,
        .settings-form .ant-input-affix-wrapper-focused,
        .settings-form .ant-select-focused .ant-select-selector {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important;
        }

        /* Color picker */
        .settings-color-picker {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px;
          border: 1px solid var(--accounts-card-border);
          border-radius: 12px;
          background: var(--bg-pure-white);
        }
        .settings-color-picker__swatch {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          cursor: pointer;
          position: relative;
          transition: transform .15s ease, box-shadow .15s ease;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
        }
        .settings-color-picker__swatch:hover {
          transform: translateY(-2px) scale(1.05);
        }
        .settings-color-picker__swatch.is-selected {
          box-shadow: 0 0 0 2px var(--bg-pure-white), 0 0 0 4px currentColor;
        }
        .settings-color-picker__swatch.is-selected::after {
          content: "";
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>") center/14px no-repeat;
        }
        .settings-color-picker__custom {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 10px;
          height: 30px;
          border-radius: 9px;
          background: color-mix(in srgb, var(--accounts-stat-label) 10%, transparent);
          border: 1px dashed var(--accounts-card-border);
          font-size: 11px;
          font-weight: 600;
          color: var(--accounts-stat-label);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .settings-color-picker__custom input[type="color"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          border: none;
        }
        .settings-color-preview {
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--accounts-stat-label) 6%, transparent);
          border: 1px solid var(--accounts-card-border);
        }
        .settings-color-preview__swatch {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06), 0 8px 18px -10px currentColor;
        }
        .settings-color-preview__label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--accounts-stat-sub);
        }
        .settings-color-preview__hex {
          font-size: 13px;
          font-weight: 700;
          color: var(--accounts-stat-value);
          font-variant-numeric: tabular-nums;
          letter-spacing: .02em;
        }

        /* Status toggle */
        .settings-status-toggle__text {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-left: 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--accounts-stat-label);
        }
        .settings-status-toggle__dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
        }
        .settings-status-toggle__dot.is-active {
          background: var(--accounts-emerald-text);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accounts-emerald-text) 18%, transparent);
        }
        .settings-status-toggle__dot.is-inactive {
          background: var(--accounts-stat-sub);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accounts-stat-sub) 12%, transparent);
        }
      `,
        }}
      />
    </MainLayout>
  );
}

interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  presets: string[];
}

function ColorPicker({ value, onChange, presets }: ColorPickerProps) {
  const isPreset = presets.some(
    (c) => c.toLowerCase() === (value || "").toLowerCase()
  );
  return (
    <div className="settings-color-picker">
      {presets.map((c) => (
        <div
          key={c}
          role="button"
          tabIndex={0}
          aria-label={`Pick color ${c}`}
          className={`settings-color-picker__swatch ${
            (value || "").toLowerCase() === c.toLowerCase() ? "is-selected" : ""
          }`}
          style={{ background: c, color: c }}
          onClick={() => onChange?.(c)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onChange?.(c);
            }
          }}
        />
      ))}
      <label
        className="settings-color-picker__custom"
        style={!isPreset && value ? { color: value } : undefined}
      >
        <span
          style={{
            width: 12,
            height: 12,
            borderRadius: 999,
            background: !isPreset && value ? value : "transparent",
            border: !isPreset && value ? "none" : "1px dashed currentColor",
            display: "inline-block",
          }}
        />
        Custom
        <input
          type="color"
          value={value || "#3b82f6"}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </label>
    </div>
  );
}
