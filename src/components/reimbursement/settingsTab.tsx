"use client";

import { useEffect, useState } from "react";
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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";

import { Category } from "@/types/category";
import { CategoryService } from "@/services/categoryService";

const { Text } = Typography;

/* ================= TABLE COLUMNS ================= */
const columns = (
  handleEdit: (r: Category) => void,
  handleDelete: (r: Category) => void
): ColumnsType<Category> => [
  { title: "Category", dataIndex: "name" },
  { title: "Max / Request", dataIndex: "maxPerRequest" },
  { title: "Monthly Limit", dataIndex: "monthlyLimit" },
  { title: "Yearly Limit", dataIndex: "yearlyLimit" },
  { title: "Eligible Roles", dataIndex: "eligibleRoles" },
  {
    title: "Accepted By",
    dataIndex: "accept",
    render: (accept: string[]) =>
      accept && accept.length > 0 ? (
        accept.map((role) => (
          <Tag key={role} color="green">
            {role}
          </Tag>
        ))
      ) : (
        <Text type="secondary">—</Text>
      ),
  },
  {
    title: "Attachment",
    dataIndex: "attachmentRequired",
    render: (v: boolean) =>
      v ? <Tag color="blue">Required</Tag> : <Tag>Optional</Tag>,
  },
  {
    title: "Status",
    dataIndex: "status",
    render: (s: "Active" | "Inactive") =>
      s === "Active" ? (
        <Tag color="green">Active</Tag>
      ) : (
        <Tag color="red">Inactive</Tag>
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
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record)}
        />
      </Space>
    ),
  },
];

export default function ReimbursementSettings() {
  const [data, setData] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);




  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const [form] = Form.useForm();

  // ✅ FIXED: Load data from service
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const categories = await CategoryService.getAll();
      setData(categories);
    } finally {
      setLoading(false);
    }
  };

  const activeCount = data.filter((d) => d.status === "Active").length;
  const inactiveCount = data.filter((d) => d.status === "Inactive").length;
  const attachmentRequired = data.some((d) => d.attachmentRequired);

  /* ================= ADD / UPDATE ================= */
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      
      const categoryData: Omit<Category, 'id' | 'key'> = {
        name: values.category,
        maxPerRequest: values.categoryMax,
        monthlyLimit: values.monthlyLimit,
        yearlyLimit: values.yearlyLimit,
        eligibleRoles: values.eligibleRoles || [],
        accept: values.accept || [],
        attachmentRequired: values.attachment || false,
        status: values.status ? "Active" : "Inactive" as const,
      };

      if (editingCategory) {
        // ✅ UPDATE using service
        await CategoryService.update(editingCategory.id, categoryData);
      } else {
        // ✅ CREATE using service
        await CategoryService.create(categoryData as Category);
      }

      // ✅ REFRESH from service
      await loadCategories();
      
      setOpen(false);
      setEditingCategory(null);
      form.resetFields();
    } catch (error) {
      console.log("Validation failed:", error);
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
      status: record.status === "Active",
    });
  };

  /* ================= DELETE ================= */
const handleDelete = (record: Category) => {
  setCategoryToDelete(record);
  setDeleteConfirmVisible(true);
};

  const summaryCardClass = `
    h-24
    rounded-2xl
    border border-gray-200
    bg-white
    p-4
    shadow-[0_6px_20px_rgba(0,0,0,0.08)]
  `;

  return (
    <>
      {/* ================= SUMMARY CARDS ================= */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <div className="text-xs text-gray-500 mb-1">Total Categories</div>
            <div className="text-[22px] font-bold text-gray-900">
              {data.length}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <div className="text-xs text-gray-500 mb-1">Active</div>
            <div className="text-[22px] font-bold text-gray-900">
              {activeCount}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <div className="text-xs text-gray-500 mb-1">Inactive</div>
            <div className="text-[22px] font-bold text-gray-900">
              {inactiveCount}
            </div>
          </Card>
        </Col>

        <Col xs={24} md={6}>
          <Card className={summaryCardClass}>
            <div className="text-xs text-gray-500 mb-1">
              Attachment Required
            </div>
            <div className="text-[22px] font-bold text-gray-900">
              {attachmentRequired ? "Yes" : "No"}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ================= ADD CATEGORY ================= */}
      <div className="flex justify-end mb-3">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingCategory(null);
            setOpen(true);
            form.resetFields();
          }}
        >
          Add Category
        </Button>
      </div>

      {/* ================= TABLE ================= */}
      <Card>
        <Table
          columns={columns(handleEdit, handleDelete)}
          dataSource={data}
          rowKey="key"
          loading={loading}
          pagination={{ pageSize: 5 }}
        />
      </Card>

      {/* ================= MODAL ================= */}
      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        width={500}
        centered
        footer={null}
        styles={{
          body: {
            padding: 0,
            height: "90vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <div className="mb-6 pb-5 border-b border-gray-100 flex items-center px-8 pt-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
            <FolderOpenOutlined className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {editingCategory ? "Edit Category" : "Create New Category"}
            </h3>
            <p className="text-sm text-gray-500">
              Configure reimbursement category
            </p>
          </div>
        </div>

        {/* ================= FORM ================= */}
        <Form
          form={form}
          layout="vertical"
          className="flex-1 overflow-y-auto px-8 pb-6"
        >
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Enter category" }]}
          >
            <Input
              className="w-full"
              style={{ width: '97%' }}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="categoryMax"
            label="Max Per Request"
            rules={[{ required: true, message: "Enter max per request" }]}
          >
            <InputNumber
              className="w-full"
              style={{ width: '97%' }}
              size="large"
              formatter={(value) =>
                `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
            />
          </Form.Item>

          <Form.Item
            name="monthlyLimit"
            label="Monthly Limit"
            rules={[{ required: true, message: "Enter monthly limit" }]}
          >
            <InputNumber
              className="w-full"
              style={{ width: '97%' }}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="yearlyLimit"
            label="Yearly Limit"
          >
            <InputNumber
              className="w-full"
              style={{ width: '97%' }}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="eligibleRoles"
            label="Eligible Roles"
          >
            <Select
              mode="multiple"
              allowClear
              size="large"
              style={{ width: '97%' }}
              placeholder="Select roles"
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
            label="Accepted By"
          >
            <Select
              mode="multiple"
              allowClear
              size="large"
              style={{ width: "97%" }}
              placeholder="Select roles"
            >
              <Select.Option value="MANAGER">Manager</Select.Option>
              <Select.Option value="FINANCE">Finance</Select.Option>
            </Select>
          </Form.Item>

          <div className="grid grid-cols-2 gap-6">
            <Form.Item
              name="attachment"
              label="Attachment Required"
              valuePropName="checked"
            >
              <Switch checkedChildren="Required" unCheckedChildren="Optional" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </div>
        </Form>

        <div className="flex justify-end gap-5 pt-9 pb-6 border-t px-8">
          <Button
            size="large"
            onClick={() => {
              setOpen(false);
              setEditingCategory(null);
              form.resetFields();
            }}
          >
            Cancel
          </Button>

          <Button type="primary" size="large" onClick={handleAdd}>
            {editingCategory ? "Update Category" : "Create Category"}
          </Button>
        </div>
      </Modal>


<Modal
  title="Delete Category"
  open={deleteConfirmVisible}
  onCancel={() => setDeleteConfirmVisible(false)}
  okText="Delete"
  okType="danger"
  onOk={async () => {
    if (categoryToDelete) {
      await CategoryService.delete(categoryToDelete.id);
      await loadCategories();
    }
    setDeleteConfirmVisible(false);
    setCategoryToDelete(null);
  }}
>
  Are you sure you want to delete "{categoryToDelete?.name}"?
</Modal>




















    </>
  );
}
