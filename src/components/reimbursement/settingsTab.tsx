
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
  InputNumber,
  Switch,
  ConfigProvider,
  Popconfirm,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  FilterOutlined,
  SettingOutlined,
  CloseOutlined,
} from "@ant-design/icons";

import { CategoryService } from "@/services/categoryService";
import { useCategories } from "@/hooks/useCategories";
import { useRouter } from "next/navigation";

const { Text } = Typography;

/* ================= TABLE COLUMNS ================= */
export interface Category {
  id: string;
  name: string;
  maxPerRequest?: number;
  monthlyLimit?: number;
  yearlyLimit?: number;
  eligibleRoles?: string[];
  accept?: string[];
  attachmentRequired?: boolean;
  isActive?: boolean;
}

const chipBase =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium";

const roleColorMap: { [key: string]: string } = {
  ADMIN: "bg-purple-100 text-purple-700",
  MANAGER: "bg-blue-100 text-blue-700",
  HR: "bg-pink-100 text-pink-700",
  FINANCE: "bg-green-100 text-green-700",
  EMPLOYEE: "bg-slate-100 text-slate-700",
};

const columns = (
  handleEdit: (r: Category) => void,
  handleConfirmDelete: (id: string) => void
): ColumnsType<any> => [
    { 
      title: "Category", 
      dataIndex: "name",
      render: (text) => <span className="font-medium text-sm">{text}</span>,
    },
    { 
      title: "Max / Request", 
      dataIndex: "maxPerRequest",
      render: (value) => <span className="text-sm">₹{value?.toLocaleString('en-IN') || '-'}</span>,
    },
    { 
      title: "Monthly Limit", 
      dataIndex: "monthlyLimit",
      render: (value) => <span className="text-sm">₹{value?.toLocaleString('en-IN') || '-'}</span>,
    },
    { 
      title: "Yearly Limit", 
      dataIndex: "yearlyLimit",
      render: (value) => <span className="text-sm">₹{value?.toLocaleString('en-IN') || '-'}</span>,
    },
    {
      title: "Eligible Roles",
      dataIndex: "eligibleRoles",
      render: (roles: string[]) => (
        <div className="flex flex-wrap gap-1">
          {roles?.length ? (
            roles.map((role) => {
              const colorClass =
                roleColorMap[role.toUpperCase()] || "bg-gray-100 text-gray-700";
              return (
                <span key={role} className={`${chipBase} ${colorClass}`}>
                  {role}
                </span>
              );
            })
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      title: "Accepted By",
      dataIndex: "accept",
      render: (acceptRoles: string[]) => (
        <div className="flex flex-wrap gap-1">
          {acceptRoles?.length ? (
            acceptRoles.map((role) => {
              const colorClass =
                roleColorMap[role.toUpperCase()] || "bg-gray-100 text-gray-700";
              return (
                <span key={role} className={`${chipBase} ${colorClass}`}>
                  {role}
                </span>
              );
            })
          ) : (
            <span className="text-gray-400 text-xs">—</span>
          )}
        </div>
      ),
    },
    {
      title: "Attachment",
      dataIndex: "attachmentRequired",
      render: (v: boolean) => (
        <span
          className={`${chipBase} ${v ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
        >
          {v ? "Required" : "Optional"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (isActive: boolean) => (
        <span
          className={`${chipBase} ${isActive
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"}`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Actions",
      width: 90,
      render: (_, record) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-6 h-6"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete this category?"
            description="This action cannot be undone."
            onConfirm={() => handleConfirmDelete(record.id)}
            okText="Delete"
            okType="danger"
            cancelText="Cancel"
          >
            <Button 
              size="small" 
              danger 
              icon={<DeleteOutlined />} 
              className="hover:bg-red-50 w-6 h-6"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

export default function ReimbursementSettings() {
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const router = useRouter();

  // Search & Filter State
  const [searchText, setSearchText] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const filterRef = useRef<HTMLDivElement>(null);

  // Prepare query params for backend filtering
  const queryParams = {
    page: 1,
    limit: 100,
    search: searchText,
    isActive: statusFilter === 'all' ? 'all' : statusFilter === 'ACTIVE' ? 'true' : 'false',
  };

  // Fetch data with filters
  const { data: queryData, isLoading: loading, refetch: refreshCategories } = useCategories(queryParams);
  const data = queryData?.data || [];

  const filteredData = data.filter((item: any) => {
    const matchesCategory = categoryFilter.length === 0 || categoryFilter.includes(item.name);
    const matchesRole = roleFilter.length === 0 || (Array.isArray(item.eligibleRoles) && item.eligibleRoles.some((r: string) => roleFilter.includes(r)));
    return matchesCategory && matchesRole;
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilter(false);
      }
    }

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Unique Lists for Dropdowns
  const allCategories = Array.from(new Set(data.map((d: any) => d.name)));
  const allRoles = ["ADMIN", "MANAGER", "EMPLOYEE", "HR", "FINANCE"];

  /* ================= ADD / UPDATE ================= */
  const handleAdd = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      const categoryData: any = {
        name: values.category,
        maxPerRequest: values.categoryMax,
        monthlyLimit: values.monthlyLimit,
        yearlyLimit: values.yearlyLimit,
        eligibleRoles: values.eligibleRoles || [],
        accept: values.accept || [],
        attachmentRequired: values.attachment || false,
        isActive: values.status,
      };

      if (editingCategory) {
        await CategoryService.updateCategory(editingCategory.id, categoryData);
      } else {
        await CategoryService.createCategory(categoryData);
      }

      await refreshCategories();

      setOpen(false);
      setEditingCategory(null);
      form.resetFields();
    } catch (error) {
      console.log("Validation failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= EDIT ================= */
  const handleEdit = (record: Category) => {
    setEditingCategory(record);
    setOpen(true);

    form.setFieldsValue({
      category: record.name,
      categoryMax: record.maxPerRequest,
      monthlyLimit: record.monthlyLimit,
      yearlyLimit: record.yearlyLimit,
      eligibleRoles: record.eligibleRoles,
      accept: record.accept,
      attachment: record.attachmentRequired,
      status: (record as any).isActive,
    });
  };

  /* ================= DELETE ================= */
  const handleConfirmDelete = async (categoryId: string) => {
    await CategoryService.deleteCategory(categoryId);
    setTimeout(async () => {
      await refreshCategories();
    }, 300);
  };

  return (
    <Card className="rounded-lg shadow-sm bg-white h-[540px] flex flex-col border border-gray-100">
      <div className="flex flex-col flex-1 overflow-visible p-3">

        {/* HEADER SECTION */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
          {/* LEFT SIDE */}
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-gray-900">
              <Space size={4}>
                <SettingOutlined className="text-blue-600" />
                <span>Settings</span>
              </Space>
            </h2>

            <p className="text-xs text-gray-500 max-w-[500px]">
              Manage categories, control active/inactive settings, and configure expense rules.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <div className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                Total: {data.length}
              </div>

              <div className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                Active: {data.filter(c => (c as any).isActive).length}
              </div>

              <div className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                Inactive: {data.filter(c => !(c as any).isActive).length}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE – ACTIONS */}
          <div className="flex items-center gap-2">
            {/* SEARCH */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-44 px-3 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none focus:border-blue-500 bg-gray-50/50"
              />
            </div>

            {/* FILTER BUTTON */}
            <div className="relative" ref={filterRef}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilter((prev) => !prev)}
                className={`
                  flex items-center gap-1 px-3 py-1.5 h-auto rounded-md border text-xs font-medium
                  ${showFilter ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}
                `}
              >
                Filter
              </Button>

              {/* FILTER DROPDOWN */}
              {showFilter && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-1.5">
                    <span className="font-semibold text-gray-800 text-sm">Filter</span>
                    <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-gray-600" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                      <Select
                        mode="multiple"
                        size="small"
                        placeholder="Select"
                        value={categoryFilter}
                        onChange={setCategoryFilter}
                        style={{ width: "100%" }}
                        className="text-xs"
                        maxTagCount={1}
                        getPopupContainer={(trigger) => trigger.parentElement}
                      >
                        {allCategories.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
                      <Select
                        mode="multiple"
                        size="small"
                        placeholder="Select"
                        value={roleFilter}
                        onChange={setRoleFilter}
                        style={{ width: "100%" }}
                        className="text-xs"
                        maxTagCount={1}
                        getPopupContainer={(trigger) => trigger.parentElement}
                      >
                        {allRoles.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:border-blue-500 focus:outline-none bg-white"
                      >
                        <option value="all">All</option>
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-gray-100">
                    <Button
                      size="small"
                      onClick={() => { setStatusFilter("all"); setCategoryFilter([]); setRoleFilter([]); setSearchText(""); }}
                      className="text-xs px-3"
                    >
                      Reset
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setShowFilter(false)}
                      className="text-xs px-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* CREATE BUTTON */}
            <Button
              type="primary"
              size="middle"
              icon={<PlusOutlined />}
              className="h-8 px-4 text-xs font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-1"
              onClick={() => {
                setEditingCategory(null);
                setOpen(true);
                form.resetFields();
              }}
            >
              Add
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
          
          .settings-table .ant-btn {
            height: 24px !important;
            width: 24px !important;
          }
          
          .settings-table .ant-pagination {
            margin-top: 10px !important;
          }
          
          .settings-table .ant-pagination-item {
            min-width: 26px !important;
            height: 26px !important;
            line-height: 24px !important;
          }
        `}</style>

        <div className="mt-3 flex-1 overflow-hidden">
          <Table
            className="settings-table"
            rowKey="id"
            columns={columns(handleEdit, handleConfirmDelete)}
            dataSource={filteredData}
            loading={loading}
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showQuickJumper: false,
              position: ["bottomRight"],
            }}
          />
        </div>

        {/* ================= MODAL ================= */}
        <Modal
          open={open}
          onCancel={() => {
            setOpen(false);
            setEditingCategory(null);
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
          {/* ===== HEADER ===== */}
          <div className="px-5 py-3 border-b border-gray-200 shrink-0">
            <h3 className="text-base font-semibold text-gray-900">
              {editingCategory ? "Edit Category" : "Create Category"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure reimbursement category
            </p>
          </div>

          {/* ===== FORM ===== */}
          <Form
            form={form}
            layout="vertical"
            className="px-5 py-3"
            size="small"
          >
            <div className="flex gap-3">
              <Form.Item
                name="category"
                label={<span className="text-xs font-medium">Category</span>}
                rules={[{ required: true, message: "Required" }]}
                className="flex-[3] mb-3"
              >
                <Input placeholder="e.g., Travel" className="w-full text-sm" />
              </Form.Item>

              <Form.Item
                name="categoryMax"
                label={<span className="text-xs font-medium">Max</span>}
                rules={[{ required: true, message: "Required" }]}
                className="flex-[2] mb-3"
              >
                <InputNumber
                  className="w-full text-sm"
                  placeholder="Amount"
                  formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                />
              </Form.Item>
            </div>

            <div className="flex gap-3">
              <Form.Item
                name="monthlyLimit"
                label={<span className="text-xs font-medium">Monthly</span>}
                className="flex-1 mb-3"
              >
                <InputNumber 
                  placeholder="Amount" 
                  className="w-full text-sm" 
                  formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                />
              </Form.Item>

              <Form.Item
                name="yearlyLimit"
                label={<span className="text-xs font-medium">Yearly</span>}
                className="flex-1 mb-3"
              >
                <InputNumber 
                  placeholder="Amount" 
                  className="w-full text-sm"
                  formatter={(v) => `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                />
              </Form.Item>
            </div>

            <Form.Item
              name="eligibleRoles"
              label={<span className="text-xs font-medium">Eligible Roles</span>}
              className="mb-3"
            >
              <Select
                mode="multiple"
                allowClear
                className="w-full"
                placeholder="Select roles"
                size="small"
              >
                <Select.Option value="ADMIN">Admin</Select.Option>
                <Select.Option value="MANAGER">Manager</Select.Option>
                <Select.Option value="EMPLOYEE">Employee</Select.Option>
                <Select.Option value="HR">HR</Select.Option>
                <Select.Option value="FINANCE">Finance</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="accept"
              label={<span className="text-xs font-medium">Accepted By</span>}
              className="mb-3"
            >
              <Select
                mode="multiple"
                allowClear
                className="w-full"
                placeholder="Select approvers"
                size="small"
              >
                <Select.Option value="MANAGER">Manager</Select.Option>
                <Select.Option value="FINANCE">Finance</Select.Option>
              </Select>
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
                  <Form.Item name="attachment" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                </ConfigProvider>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-800">Status</p>
                  <p className="text-xs text-gray-500">Category is active</p>
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
                  <Form.Item
                    name="status"
                    valuePropName="checked"
                    initialValue={true}
                    noStyle
                  >
                    <Switch size="small" />
                  </Form.Item>
                </ConfigProvider>
              </div>
            </div>
          </Form>

          {/* ===== FOOTER ===== */}
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-white">
            <Button
              size="middle"
              onClick={() => {
                setOpen(false);
                setEditingCategory(null);
                form.resetFields();
              }}
              className="px-4 text-xs"
            >
              Cancel
            </Button>

            <Button 
              type="primary" 
              size="middle" 
              onClick={handleAdd} 
              loading={submitting}
              className="px-5 text-xs bg-blue-600 hover:bg-blue-700"
            >
              {editingCategory ? "Update" : "Create"}
            </Button>
          </div>
        </Modal>
      </div>
    </Card>
  );
}