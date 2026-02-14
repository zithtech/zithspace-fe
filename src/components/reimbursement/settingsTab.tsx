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
  "inline-flex items-center rounded-full px-2 py-[2px] text-[10px] font-semibold";

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
    { title: "Category", dataIndex: "name" },
    { title: "Max / Request", dataIndex: "maxPerRequest" },
    { title: "Monthly Limit", dataIndex: "monthlyLimit" },
    { title: "Yearly Limit", dataIndex: "yearlyLimit" },
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
      render: (accept: string[]) => (
        <div className="flex flex-wrap gap-1">
          {accept?.length ? (
            accept.map((role) => {
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
          className={`${chipBase} ${v ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
            }`}
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
            : "bg-red-100 text-red-700"
            }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Actions",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
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
            <Button size="small" danger icon={<DeleteOutlined />} />
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
    limit: 100, // Fetch enough for the table view
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
  const allRoles = ["ADMIN", "MANAGER", "EMPLOYEE", "HR", "FINANCE"]; // Fixed list or derive from data

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
        // ✅ UPDATE using service
        await CategoryService.updateCategory(editingCategory.id, categoryData);
      } else {
        // ✅ CREATE using service
        await CategoryService.createCategory(categoryData);
      }

      // ✅ REFRESH from service
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
    // A small delay to ensure backend has processed the delete before we refresh.
    // A more robust solution might involve optimistic UI or better state management from the service.
    setTimeout(async () => {
      await refreshCategories();
    }, 300);
  };

  return (

    <Card className="rounded-2xl shadow-md bg-white h-[540px] flex flex-col">

      <div className="flex flex-col flex-1 overflow-visible">

        <Row justify="space-between" align="middle">


          <div className="space-y-1">

            <h2 className="text-lg font-semibold text-gray-900">
              <Space>
                <SettingOutlined />
                <span>Settings</span>
              </Space>
            </h2>


            {/* DESCRIPTION */}
            <p className="text-[11px] text-gray-500 leading-tight">
              Manage reimbursement categories, control active and inactive settings,
              and configure expense rules for your organization.
            </p>


            {/* ✅ CHIPS JUST BELOW DESCRIPTION */}
            <div className="flex flex-wrap gap-1 pt-1">
              {/* TOTAL CATEGORIES */}
              <div className="px-2 py-[2px] rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">
                Total:
                <span className="ml-1 font-semibold">
                  {data.length}
                </span>
              </div>

              {/* ACTIVE */}
              <div className="px-2 py-[2px] rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                Active:
                <span className="ml-1 font-semibold">
                  {data.filter(c => (c as any).isActive).length}
                </span>
              </div>

              {/* INACTIVE */}
              <div className="px-2 py-[2px] rounded-full bg-red-100 text-red-700 text-[10px] font-medium">
                Inactive:
                <span className="ml-1 font-semibold">
                  {data.filter(c => !(c as any).isActive).length}
                </span>
              </div>
            </div>

          </div>



          {/* RIGHT SIDE – ACTIONS */}
          <Col>
            <div className="flex items-center gap-2">
              {/* SEARCH */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-40 px-3 h-8 rounded-md border border-gray-200 text-[11px] focus:outline-none focus:border-blue-500 bg-gray-50/50"
                />
              </div>

              {/* FILTER BUTTON */}
              <div className="relative" ref={filterRef}>
                <Button
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilter((prev) => !prev)}
                  className={`
                    flex items-center gap-1 px-3 h-8 rounded-md border text-[11px] font-medium
                    ${showFilter ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}
                  `}
                >
                  Filter
                </Button>

                {/* FILTER DROPDOWN */}
                {showFilter && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 text-[12px]">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                      <span className="font-semibold text-gray-800">Filter Settings</span>
                      <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-gray-600" />
                    </div>

                    <div className="space-y-3">
                      {/* Category Filter */}
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Category</label>
                        <Select
                          mode="multiple"
                          size="small"
                          placeholder="Select Category"
                          value={categoryFilter}
                          onChange={setCategoryFilter}
                          style={{ width: "100%" }}
                          className="text-[11px]"
                          maxTagCount={1}
                          getPopupContainer={(trigger) => trigger.parentElement}
                        >
                          {allCategories.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                        </Select>
                      </div>

                      {/* Eligible Role Filter */}
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Eligible Role</label>
                        <Select
                          mode="multiple"
                          size="small"
                          placeholder="Select Role"
                          value={roleFilter}
                          onChange={setRoleFilter}
                          style={{ width: "100%" }}
                          className="text-[11px]"
                          maxTagCount={1}
                          getPopupContainer={(trigger) => trigger.parentElement}
                        >
                          {allRoles.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
                        </Select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 mb-1">Status</label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-[11px] focus:border-blue-500 focus:outline-none bg-white"
                        >
                          <option value="all">All Status</option>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-gray-100">
                      <Button
                        size="small"
                        onClick={() => { setStatusFilter("all"); setCategoryFilter([]); setRoleFilter([]); setSearchText(""); }}
                        className="text-[10px] h-7 px-2 border-transparent hover:bg-gray-100 text-gray-500"
                      >
                        Reset
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => setShowFilter(false)}
                        className="text-[10px] h-7 px-3 bg-blue-600 hover:bg-blue-700 border-none shadow-sm"
                      >
                        Submit
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
                className="h-8 px-4 text-[11px] font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-1"
                onClick={() => {
                  setEditingCategory(null);
                  setOpen(true);
                  form.resetFields();
                }}
              >
                Add Category
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      <div className="border-t border-gray-200 my-2" />


      {/* ================= TABLE ================= */}
      <style jsx global>{`
              /* ===== TABLE ROW COMPRESSION ===== */
      
      .compact-table .ant-table-thead > tr > th {
        padding: 6px 8px !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
        height: 32px !important;
      }
      
      .compact-table .ant-table-tbody > tr > td {
        padding: 4px 6px !important;
        font-size: 11px !important;
        line-height: 1.2 !important;
        height: 32px !important;
      }
      
      /* ===== ACTION BUTTON (eye icon) ===== */
      .compact-table .ant-btn {
        padding: 0 !important;
        height: 22px !important;
        min-width: 22px !important;
      }
      
      /* ===== PAGINATION COMPACT ===== */
      .compact-table .ant-pagination {
        margin-top: 6px !important;
      }
        
      `}</style>

      <Table
        className="compact-table"
        rowKey="id"
        columns={columns(handleEdit, handleConfirmDelete)}
        dataSource={filteredData}
        loading={loading}
        size="small"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showQuickJumper: false,
        }}
      />

      {/* ================= MODAL ================= */}
      <style>{`
`}</style>


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
            // height: "70vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* ===== HEADER ===== */}
        <div className="px-4 pt-2 pb-4 border-b border-gray-200 shrink-0">
          <h3 className="text-[22px] font-semibold text-gray-900">

            {editingCategory ? "Edit Category" : "Create Category"}
          </h3>
          <p className="text-[12px] text-gray-500 leading-none pt-1">
            Configure reimbursement category
          </p>
        </div>

        {/* ===== FORM (FILL SPACE) ===== */}
        <Form
          form={form}
          layout="vertical"
          className="px-4 py-3 flex-1"
          size="small"
        >
          {/* ===== ROW 1 : CATEGORY 60% | MAX 40% ===== */}
          <div className="flex gap-2">
            <Form.Item
              name="category"
              label={<span className="text-[11px] font-medium">Category</span>}
              rules={[{ required: true, message: "Enter category" }]}
              className="flex-[3] mb-1"
            >
              <Input style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="categoryMax"
              label={<span className="text-[11px] font-medium">Max Request</span>}
              rules={[{ required: true, message: "Enter max" }]}
              className="flex-[2] mb-1"
            >
              <InputNumber
                className="w-full" style={{ width: "100%" }}
                formatter={(v) =>
                  ` ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
              />
            </Form.Item>
          </div>

          {/* ===== ROW 2 : MONTHLY 50% | YEARLY 50% ===== */}
          <div className="flex gap-2">
            <Form.Item
              name="monthlyLimit"
              label={<span className="text-[11px] font-medium">Monthly</span>}
              className="flex-1 mb-1"
            >
              <InputNumber style={{ width: "100%" }} className="w-full" />
            </Form.Item>

            <Form.Item
              name="yearlyLimit"
              label={<span className="text-[11px] font-medium">Yearly</span>}
              className="flex-1 mb-1"
            >
              <InputNumber style={{ width: "100%" }} className="w-full" />
            </Form.Item>
          </div>

          {/* ===== ELIGIBLE ROLES ===== */}
          <Form.Item
            name="eligibleRoles"
            label={<span className="text-[11px] font-medium ">Eligible Roles</span>}
            className="mb-1"
          >
            <Select
              mode="multiple"
              allowClear
              className="w-full"
              placeholder="Select roles"
            >
              <Select.Option value="ADMIN">Admin</Select.Option>
              <Select.Option value="MANAGER">Manager</Select.Option>
              <Select.Option value="EMPLOYEE">Employee</Select.Option>
              <Select.Option value="HR">HR</Select.Option>
              <Select.Option value="FINANCE">Finance</Select.Option>
            </Select>
          </Form.Item>

          {/* ===== ACCEPTED BY ===== */}
          <Form.Item
            name="accept"
            label={<span className="text-[11px] font-medium">Accepted By</span>}
            className="mb-1"
          >
            <Select
              mode="multiple"
              allowClear
              className="w-full"
              placeholder="Select roles"
            >
              <Select.Option value="MANAGER">Manager</Select.Option>
              <Select.Option value="FINANCE">Finance</Select.Option>
            </Select>
          </Form.Item>

          {/* ===== SETTINGS CARD ===== */}
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 space-y-3">
            <div className="space-y-3">
              {/* Attachment */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[12px] font-medium text-gray-800 leading-tight">
                    Attachment Required
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight">
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
                    <Switch />   {/* ✅ no size error */}
                  </Form.Item>
                </ConfigProvider>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[12px] font-medium text-gray-800 leading-tight">
                    Status
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    Category is active
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
                  <Form.Item
                    name="status"
                    valuePropName="checked"
                    initialValue={true}
                    noStyle
                  >
                    <Switch />
                  </Form.Item>
                </ConfigProvider>
              </div>
            </div>


          </div>
        </Form>

        {/* ===== FOOTER (STICKY) ===== */}
        <div className="flex  py-2 border-t border-gray-200 shrink-0 bg-white sticky bottom-0">
          <div className="ml-auto flex gap-2">
            {!submitting && (
              <Button
                size="small"
                onClick={() => {
                  setOpen(false);
                  setEditingCategory(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            )}

            <Button type="primary" size="small" onClick={handleAdd} loading={submitting}>
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </div>

      </Modal>

    </Card>

  )
}
