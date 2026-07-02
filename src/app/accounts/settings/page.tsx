"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  App,
  Spin,
  Drawer,
  Tooltip,
  Switch,
  Select,
  Card,
  Empty,
  Tag,
  Dropdown,
} from "antd";

import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  RestOutlined,
  BankOutlined,
  ArrowLeftOutlined,
  EllipsisOutlined,
} from '@ant-design/icons';
import { Sparkles, Check, AlertCircle, LayoutGrid, List, Menu } from 'lucide-react';
import { useActivitySource } from "@/hooks/useActivitySource";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const { Text } = Typography;
const { TextArea } = Input;

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#2563eb", // Royal Blue
  "#60a5fa", // Sky Blue
  "#10b981", // Green
  "#059669", // Emerald Green
  "#34d399", // Mint Green
  "#64748b", // Slate Grey
  "#475569", // Dark Grey
  "#94a3b8", // Light Grey
];

const initialsOf = (name: string) =>
  (name || '—')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function AccountsSettingsPage() {
  const router = useRouter();
  useActivitySource({ section: "FINANCE", module: "Accounts", page: "AccountsSettings" });

  const { message: messageApi } = App.useApp();

  // Premium row/card action menu label helper
  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="pp-menu-item">
      <span className="pp-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </span>
    </div>
  );
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [form] = Form.useForm();
  const isActiveValue = Form.useWatch("isActive", form);
  const colorValue = Form.useWatch("color", form);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const {
    canReadAccountConfig,
    canCreateAccountConfig,
    canUpdateAccountConfig,
    canDeleteAccountConfig,
  } = usePermission();

  const { data: categories = [], isLoading: loading, refetch, isFetching } = useExpenseCategories();
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, statusFilter]);

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
      messageApi.error("Failed to save category");
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

  // Client-side pagination counts
  const total = filteredCategories.length;
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pagedCategories = useMemo(() => {
    return filteredCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredCategories, currentPage, pageSize]);

  const columns = [
    {
      title: "Category",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ExpenseCategory) => (
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="settings-cat__avatar"
            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
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
                icon={<EditOutlined style={{ fontSize: 13 }} />}
                onClick={() => handleEdit(record)}
                className="settings-row-actions__btn settings-row-actions__edit"
                aria-label="Edit category"
              />
            </Tooltip>
          )}
          {canDeleteAccountConfig && (
            <ConfirmDialog
              tone="danger"
              title="Delete Category"
              description="Are you sure you want to delete this category?"
              confirmText="Delete"
              cancelText="Cancel"
              placement="left"
              onConfirm={() => handleDelete(record.id)}
            >
              <Tooltip title="Delete">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                  className="settings-row-actions__btn settings-row-actions__delete"
                  aria-label="Delete category"
                />
              </Tooltip>
            </ConfirmDialog>
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
            <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "#64748b" }} />
            <Typography.Title level={4} style={{ color: "#475569" }}>
              Access Denied
            </Typography.Title>
            <Typography.Paragraph style={{ color: "#64748b" }}>
              You don't have permission to access accounts settings.
            </Typography.Paragraph>
          </div>
        </div>
      </MainLayout>
    );
  }

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><Sparkles size={26} /></div>
      <div className="pp-empty-title">No categories found</div>
      <div className="pp-empty-sub">
        {searchText || statusFilter !== "all"
          ? "Try adjusting your filters or search term"
          : "Create your first category to start organizing your transactions"}
      </div>
      {!searchText && statusFilter === "all" && canCreateAccountConfig && (
        <Button
          type="primary"
          icon={<PlusOutlined />}
          className="pp-btn-primary"
          onClick={handleCreate}
          style={{ marginTop: 14 }}
        >
          Create First Category
        </Button>
      )}
    </div>
  );

  return (
    <MainLayout>
      <div className="pp-shell">
        {/* ============================ SIDEBAR ============================ */}
        {isMobileOpen && (
          <div className="pp-backdrop" onClick={() => setIsMobileOpen(false)} />
        )}
        <aside className={`pp-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
          <div className="pp-side-head">
            <div className="pp-side-logo"><BankOutlined /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Accounts</div>
              <div className="pp-side-subtitle">Settings</div>
            </div>
          </div>

          {canCreateAccountConfig && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="pp-create-btn"
              onClick={handleCreate}
              block
            >
              Add Category
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "all" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "all" ? "#3b82f6" : "var(--text-slate-400)" }}><FolderOutlined /></span>
                <span className="pp-view-label">All categories</span>
                <span className="pp-view-count">{counts.total}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "active" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("active")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "active" ? "#10b981" : "var(--text-slate-400)" }}><CheckCircleOutlined /></span>
                <span className="pp-view-label">Active</span>
                <span className="pp-view-count">{counts.active}</span>
              </button>
              <button
                type="button"
                className={`pp-view-item ${statusFilter === "inactive" ? "is-active" : ""}`}
                onClick={() => setStatusFilter("inactive")}
              >
                <span className="pp-view-icon" style={{ color: statusFilter === "inactive" ? "#64748b" : "var(--text-slate-400)" }}><CloseCircleOutlined /></span>
                <span className="pp-view-label">Inactive</span>
                <span className="pp-view-count">{counts.inactive}</span>
              </button>
            </div>
          </div>

          <div className="pp-side-bottom-actions">
            <button
              type="button"
              className="pp-view-item"
              onClick={() => router.push("/accounts/accounts-dashboard")}
              style={{ padding: "7px 10px", borderRadius: "8px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", width: "100%", marginBottom: "4px" }}
            >
              <span className="pp-view-icon" style={{ color: "#3b82f6" }}><ArrowLeftOutlined /></span>
              <span className="pp-view-label">Dashboard</span>
            </button>
            <button
              type="button"
              className="pp-trash"
              onClick={() => router.push("/accounts/trash")}
            >
              <RestOutlined /> Trash
            </button>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          {/* Top search & views bar */}
          <div className="pp-topbar">
            <button className="pp-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="pp-search-wrap">
              <SearchOutlined className="pp-search-icon" />
              <input
                className="pp-search"
                placeholder="Search categories, descriptions…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{filteredCategories.length}</strong> categories</span>
            </div>

            <div className="pp-topbar-actions">
              <div className="pp-segmented">

                <button
                  type="button"
                  className={viewMode === "table" ? "is-active" : ""}
                  onClick={() => setViewMode("table")}
                  aria-label="Table view"
                >
                  <List size={14} />
                </button>
                <button
                  type="button"
                  className={viewMode === "card" ? "is-active" : ""}
                  onClick={() => setViewMode("card")}
                  aria-label="Card view"
                >
                  <LayoutGrid size={14} />
                </button>
                
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="pp-ghost-btn" onClick={() => refetch()}><ReloadOutlined spin={loading || isFetching} /></button>
              </Tooltip>
            </div>
          </div>

          <div className="pp-divider" />

          {/* Main View Area */}
          <div className="pp-body">
            {viewMode === "card" ? (
              loading ? (
                <div className="pp-grid">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="pc-card pc-card--skeleton">
                      <div className="pc-top">
                        <div className="pc-avatar pc-avatar--skeleton" />
                        <div className="pc-identity-body">
                          <div className="pc-title--skeleton" />
                          <div className="pc-subtitle--skeleton" />
                        </div>
                      </div>
                      <div className="pc-foot">
                        <div className="pc-foot-row">
                          <div className="pc-foot-skeleton" style={{ width: "40%" }} />
                          <span className="pc-foot-div" />
                          <div className="pc-foot-skeleton" style={{ width: "30%" }} />
                        </div>
                        <div className="pc-foot-row">
                          <div className="pc-foot-skeleton" style={{ width: "25%" }} />
                          <div className="pc-foot-skeleton" style={{ width: "30%", marginLeft: "auto" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pagedCategories.length === 0 ? (
                emptyState
              ) : (
                <div className="pp-grid">
                  {pagedCategories.map((category) => {
                    const actionMenu = {
                      className: 'pp-action-menu',
                      items: [
                        {
                          key: "edit",
                          disabled: !canUpdateAccountConfig,
                          label: menuLabel('Edit category', 'Modify category details', <EditOutlined />, '#3b82f6', 'rgba(59,130,246,0.12)'),
                        },
                        { type: "divider" as const },
                        {
                          key: "delete",
                          danger: true,
                          disabled: !canDeleteAccountConfig,
                          label: (
                            <ConfirmDialog
                              tone="danger"
                              title="Delete Category"
                              description="Are you sure you want to delete this category?"
                              confirmText="Delete"
                              cancelText="Cancel"
                              placement="left"
                              onConfirm={() => handleDelete(category.id)}
                            >
                              <div
                                style={{
                                  margin: '-5px -12px',
                                  padding: '5px 12px',
                                  width: 'calc(100% + 24px)',
                                  height: '100%'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                                {menuLabel('Delete category', 'Permanently remove category', <DeleteOutlined />, '#ef4444', 'rgba(239,68,68,0.12)')}
                              </div>
                            </ConfirmDialog>
                          )
                        },
                      ],
                      onClick: ({ key, domEvent }: any) => {
                        domEvent.stopPropagation();
                        if (key === 'edit') handleEdit(category);
                      }
                    };

                    return (
                      <div
                        key={category.id}
                        className="pc-card"
                        onClick={() => {
                          if (canUpdateAccountConfig) {
                            handleEdit(category);
                          }
                        }}
                      >
                        <div className="pc-top">
                          <div
                            className="pc-avatar"
                            style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
                          >
                            {initialsOf(category.name)}
                          </div>
                          <div className="pc-identity-body">
                            <div className="pc-title" style={{ fontSize: '13px' }}>{category.name}</div>
                            <div className="pc-client-line">
                              <span className="pc-client-key">Description:</span>
                              <span className="pc-client-val">
                                {category.description || "No description"}
                              </span>
                            </div>
                          </div>
                          <Dropdown
                            menu={actionMenu}
                            overlayClassName="pp-action-pop"
                            trigger={["click"]}
                            placement="bottomRight"
                          >
                            <button
                              type="button"
                              className="pc-actions"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <EllipsisOutlined />
                            </button>
                          </Dropdown>
                        </div>

                        <div className="pc-foot">
                          <div className="pc-foot-row">
                            <span className="pc-foot-item">
                              <span className="pc-foot-key">Status:</span>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  color: category.isActive ? '#10b981' : '#64748b',
                                }}
                              >
                                <span
                                  style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: category.isActive ? '#10b981' : '#64748b',
                                  }}
                                />
                                {category.isActive ? "Active" : "Inactive"}
                              </span>
                            </span>
                            <span className="pc-foot-div" />
                            <span className="pc-foot-item">
                              <span className="pc-foot-key">Date:</span>
                              <span className="pc-foot-val">
                                {new Date(category.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }) + " · " + new Date(category.createdAt).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </span>
                            </span>
                          </div>
                          <div className="pc-foot-row">
                            <span className="pc-foot-item">
                              <span className="pc-foot-key">Type:</span>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#3b82f6" }}>
                                CATEGORY
                              </span>
                            </span>
                            <span className="pc-foot-div" />
                            <span className="pc-foot-item">
                              <span className="pc-foot-key">State:</span>
                              <span style={{ fontSize: "11px", fontWeight: 700, color: category.isActive ? "#10b981" : "#94a3b8" }}>
                                {category.isActive ? "ACTIVE" : "INACTIVE"}
                              </span>
                            </span>
                            <span className="pc-foot-div" />
                            <button
                              type="button"
                              className="pc-foot-item pc-view-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(category);
                              }}
                            >
                              <EditOutlined /> Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="pp-table-wrap">
                <Table
                  size="small"
                  columns={columns}
                  dataSource={pagedCategories}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                  scroll={{ x: 'max-content' }}
                  locale={{ emptyText: emptyState }}
                  onRow={(record) => ({
                    onClick: (e) => {
                      const t = e.target as HTMLElement;
                      if (t.closest('button, input, .ant-select, .ant-popover, .ant-popconfirm, .settings-row-actions, .ant-dropdown-trigger')) return;
                      if (canUpdateAccountConfig) {
                        handleEdit(record);
                      }
                    },
                    className: 'pp-row',
                  })}
                />
              </div>
            )}
          </div>

          {/* Sticky footer pagination */}
          {total > 0 && (
            <div className="pp-footer pp-footer--sticky">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
              </div>
              <div className="pp-pager">
                <button type="button" className="pp-pager-btn" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, currentPage - 3), Math.max(0, currentPage - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`pp-pager-num ${p === currentPage ? 'is-active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                ))}
                <button type="button" className="pp-pager-btn" disabled={currentPage >= pageCount} onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}>›</button>
                <Select
                  className="pp-pagesize"
                  value={pageSize}
                  onChange={(v) => { setPageSize(v); setCurrentPage(1); }}
                  options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Category Drawer */}
      <Drawer
        title={
          <div className="settings-drawer__title">
            <div
              className={`settings-drawer__title-icon ${editingCategory ? "is-edit" : "is-add"
                }`}
            >
              {editingCategory ? <EditOutlined style={{ fontSize: 18 }} /> : <PlusOutlined style={{ fontSize: 18 }} />}
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
        width={420}
        open={drawerVisible}
        onClose={() => {
          setDrawerVisible(false);
          form.resetFields();
        }}
        destroyOnClose
        styles={{
          header: {
            borderBottom: "1px solid var(--accounts-card-border)",
            padding: "12px 18px",
            background: "var(--accounts-card-bg)",
          },
          body: { padding: 0, background: "var(--customers-page-bg)" },
          footer: {
            borderTop: "1px solid var(--accounts-card-border)",
            padding: "10px 18px",
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
              icon={editingCategory ? <EditOutlined /> : <PlusOutlined />}
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
                  style={{ padding: '10px 14px' }}
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
                    Pick a color used to identify this category in lists and charts (restricted to Blue, Green, and Grey shades)
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
                  className={`settings-status-toggle__dot ${isActiveValue ? "is-active" : "is-inactive"
                    }`}
                  style={{ background: isActiveValue ? "#10b981" : "#64748b" }}
                />
                {isActiveValue ? "Category is active" : "Category is inactive"}
              </span>
            </div>
          </div>
        </Form>
      </Drawer>

      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0 -24px;
          min-height: calc(100vh - 54px);
          background: var(--bg-pure-white);
        }
        .pp-shell,
        .pp-shell *,
        .ant-table,
        .ant-btn,
        .ant-select,
        .ant-picker,
        .ant-input,
        .ant-modal,
        .ant-drawer,
        .ant-tooltip,
        .ant-popconfirm,
        .ant-dropdown {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif !important;
        }

        /* ---------------- Sidebar ---------------- */
        .pp-sidebar {
          width: 264px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0 38px;
          position: sticky;
          top: 0;
          height: calc(100vh - 54px);
          z-index: 31;
        }
        .pp-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .pp-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .pp-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .pp-create-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
        .pp-side-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pp-side-scroll::-webkit-scrollbar {
          display: none;
        }
        .pp-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
        }
        .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 6px; }
        .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
        .pp-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .pp-view-count {
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
          min-width: 18px; text-align: right;
        }
        .pp-view-item.is-active .pp-view-count {
          color: #3B82F6; font-weight: 700;
          background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }
        .pp-side-bottom-actions {
          margin: auto -14px 0 -38px;
          padding: 8px 14px 0 38px;
          border-top: 1px solid var(--border-slate-100);
          background: var(--bg-pure-white);
        }
        .pp-trash {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-align: left;
          margin: 0 -14px 0 -38px; padding: 0 0 0 38px;
          height: 45px;
          width: calc(100% + 52px);
          border-top: 1px solid var(--border-slate-200);
          background: transparent; color: var(--text-slate-600); font-size: 13px; font-weight: 500; cursor: pointer;
        }
        .pp-trash .anticon { font-size: 15px; }
        .pp-trash:hover { color: #3B82F6; }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 8px 32px 0 20px; display: flex; flex-direction: column; }
        .pp-body { flex: 1 0 auto; padding-bottom: 60px; min-width: 0; }
        .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
        .pp-search-wrap {
          position: relative; flex: 1; max-width: 520px; min-width: 240px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900);
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-meta-dot { color: var(--text-slate-300); }
        .pp-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
        .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

        .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 -32px 10px -20px; }

        /* Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table-wrap ::-webkit-scrollbar { display: none !important; }
        .pp-table-wrap, .pp-table-wrap * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }

        .settings-cat__avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
          background: var(--cat-color);
        }
        .settings-cat__name { font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
        .settings-cat__desc { font-size: 11px; color: var(--text-slate-400); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .settings-cat__date { font-size: 11px; color: var(--text-slate-500); }

        .settings-status {
          display: inline-flex; align-items: center; gap: 5px; height: 20px; padding: 0 8px;
          border-radius: 5px; font-size: 10.5px; font-weight: 700; border: 1px solid transparent;
        }
        .settings-status.is-active {
          color: #10b981; background: rgba(16,185,129,0.10); border-color: rgba(16,185,129,0.25);
        }
        .settings-status.is-inactive {
          color: #64748b; background: rgba(100,116,139,0.10); border-color: rgba(100,116,139,0.25);
        }
        .settings-status__dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        .settings-row-actions__btn {
          width: 26px !important; height: 26px !important; display: inline-flex !important; align-items: center; justify-content: center;
          border-radius: 6px !important; border: 1px solid transparent !important; color: var(--text-slate-400) !important;
          transition: all .15s ease; background: transparent !important;
        }
        .settings-row-actions__edit:hover {
          color: #3b82f6 !important; background: rgba(59,130,246,0.10) !important; border-color: rgba(59,130,246,0.22) !important;
        }
        .settings-row-actions__delete:hover {
          color: #ef4444 !important; background: rgba(239,68,68,0.10) !important; border-color: rgba(239,68,68,0.22) !important;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30;
          margin: 8px -32px 0 -20px;
          padding: 0 32px 0 20px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 45px;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Premium action dropdown */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          overflow: hidden !important;
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
          overflow: hidden !important;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        /* Empty state */
        .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .pp-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
        }
        .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
        .pp-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 0 !important; font-weight: 600 !important;
        }

        /* Drawer Custom Colors */
        .settings-drawer__title { display: flex; align-items: center; gap: 12px; }
        .settings-drawer__title-icon { width: 38px; height: 38px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; }
        .settings-drawer__title-icon.is-add {
          color: #3b82f6; background: linear-gradient(135deg, rgba(59,130,246,0.16), rgba(100,116,139,0.14));
          border: 1px solid rgba(59,130,246,0.24); box-shadow: 0 8px 18px -10px rgba(59,130,246,0.55);
        }
        .settings-drawer__title-icon.is-edit {
          color: #3b82f6; background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(100,116,139,0.14));
          border: 1px solid rgba(59,130,246,0.28); box-shadow: 0 8px 18px -10px rgba(59,130,246,0.55);
        }
        .settings-drawer__title-text { line-height: 1.15; }
        .settings-drawer__title-main { font-size: 15px; font-weight: 800; color: var(--text-slate-900); }
        .settings-drawer__title-sub { font-size: 11.5px; font-weight: 500; color: var(--text-slate-400); margin-top: 2px; }
        .settings-drawer__body { padding: 12px 16px 20px; display: flex; flex-direction: column; gap: 12px; }
        .settings-drawer__footer { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }

        .settings-section {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 16px; padding: 12px 14px 4px; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
        }
        .settings-section__head {
          display: flex; align-items: flex-start; gap: 12px; margin-bottom: 8px;
          padding-bottom: 8px; border-bottom: 1px dashed var(--border-slate-200);
        }
        .settings-section__num {
          width: 28px; height: 28px; flex-shrink: 0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 800; color: #3b82f6; background: rgba(59,130,246,0.10); border: 1px solid rgba(59,130,246,0.22);
        }
        .settings-section__title { font-size: 13px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; }
        .settings-section__sub { font-size: 11px; color: var(--text-slate-400); margin-top: 2px; font-weight: 500; }

        .settings-form .ant-form-item-label > label {
          font-size: 11.5px !important; font-weight: 600 !important; color: var(--text-slate-400) !important;
          letter-spacing: .02em; height: 18px !important;
        }
        .settings-form .ant-form-item { margin-bottom: 10px; }
        .settings-form .ant-input,
        .settings-form .ant-input-textarea,
        .settings-form .ant-select-selector {
          border-radius: 10px !important; transition: border-color .2s ease, box-shadow .2s ease;
        }
        .settings-form .ant-input:hover,
        .settings-form .ant-input-textarea:hover,
        .settings-form .ant-select:hover .ant-select-selector {
          border-color: #3b82f6 !important;
        }
        .settings-form .ant-input:focus,
        .settings-form .ant-input-focused,
        .settings-form .ant-input-textarea:focus-within,
        .settings-form .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
        }

        /* Preset color picker styles */
        .settings-color-picker {
          display: flex; flex-wrap: wrap; gap: 8px; padding: 12px;
          border: 1px solid var(--border-slate-200); border-radius: 12px; background: var(--bg-pure-white);
        }
        .settings-color-picker__swatch {
          width: 30px; height: 30px; border-radius: 9px; cursor: pointer; position: relative;
          transition: transform .15s ease, box-shadow .15s ease; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
        }
        .settings-color-picker__swatch:hover { transform: translateY(-2px) scale(1.05); }
        .settings-color-picker__swatch.is-selected { box-shadow: 0 0 0 2px var(--bg-pure-white), 0 0 0 4px currentColor; }
        .settings-color-picker__swatch.is-selected::after {
          content: ""; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>") center/14px no-repeat;
        }

        .settings-color-preview {
          margin-top: 8px; display: flex; align-items: center; gap: 12px; padding: 10px 12px;
          border-radius: 12px; background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
        }
        .settings-color-preview__swatch { width: 36px; height: 36px; border-radius: 10px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06), 0 8px 18px -10px currentColor; }
        .settings-color-preview__label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-slate-400); }
        .settings-color-preview__hex { font-size: 13px; font-weight: 700; color: var(--text-slate-900); font-variant-numeric: tabular-nums; }

        .settings-status-toggle__text { display: inline-flex; align-items: center; gap: 8px; margin-left: 12px; font-size: 12px; font-weight: 600; color: var(--text-slate-700); }
        .settings-status-toggle__dot { width: 8px; height: 8px; border-radius: 999px; }

        .pp-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px);
          z-index: 999;
        }
        .pp-mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-slate-600);
          margin-right: 12px;
        }
        @media (max-width: 1024px) {
          .pp-sidebar {
            position: fixed;
            left: -280px;
            top: 54px;
            bottom: 0;
            height: calc(100vh - 54px);
            transition: left 0.3s ease;
            z-index: 1000;
            box-shadow: 4px 0 24px rgba(15, 23, 42, 0.1);
            display: flex;
          }
          .pp-sidebar.is-open { left: 0; }
          .pp-backdrop { display: block; }
          .pp-mobile-toggle { display: flex; }
        }

        /* ---------------- Cards ---------------- */
        .pp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 24px;
        }
        @media (max-width: 600px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          border-radius: 0;
          display: flex;
          flex-direction: column;
          height: 144px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color .15s ease, box-shadow .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; height: 64px; overflow: hidden; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); height: 78px; justify-content: center; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        /* Segmented control */
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }

        /* Skeleton styling */
        .pc-card--skeleton { pointer-events: none; }
        .pc-avatar--skeleton { background: var(--bg-slate-100) !important; animation: pulse 1.5s infinite; }
        .pc-title--skeleton { height: 14px; width: 60%; background: var(--bg-slate-100); border-radius: 4px; animation: pulse 1.5s infinite; }
        .pc-subtitle--skeleton { height: 11px; width: 40%; background: var(--bg-slate-100); border-radius: 3px; animation: pulse 1.5s infinite; margin-top: 4px; }
        .pc-foot-skeleton { height: 12px; width: 80%; background: var(--bg-slate-100); border-radius: 3px; animation: pulse 1.5s infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </MainLayout>
  );
}

interface ColorPickerProps {
  value?: string;
  onChange?: (value: string) => void;
  presets: string[];
}

function ColorPicker({ value, onChange, presets }: ColorPickerProps) {
  return (
    <div className="settings-color-picker">
      {presets.map((c) => (
        <div
          key={c}
          role="button"
          tabIndex={0}
          aria-label={`Pick color ${c}`}
          className={`settings-color-picker__swatch ${(value || "").toLowerCase() === c.toLowerCase() ? "is-selected" : ""
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
    </div>
  );
}
