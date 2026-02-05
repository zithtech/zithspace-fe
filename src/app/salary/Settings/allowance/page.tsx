"use client";

import React, { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Table,
  Drawer,
  Form,
  Input,
  Radio,
  Select,
  Switch,
  Space,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import {
  useSalaryComponents,
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
  useUpdateSalaryStatus,
  useDeleteSalaryComponent,
} from "@/hooks/useSalaryComponents";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

const { Title, Text } = Typography;
const { Option } = Select;

/* ===== FUTURE USE ===== */
// type CalculationType = "Fixed" | "Percentage" | "Formula";

type ComponentType = "Earning" | "Deduction";
type SalaryComponent = {
  key: number;
  componentName: string;
  componentCode: string;
  type: ComponentType;

  /* ===== FUTURE USE ===== */
  // calculationType: CalculationType;
  // amount?: number;
  // percentage?: number;

  status: boolean;
};

const SalaryComponentManagement = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form] = Form.useForm();

  React.useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  const { data, isLoading } = useSalaryComponents({
    page,
    limit: pageSize,
    search,
    type: typeFilter as any,
    status: statusFilter as any,
  });

  console.log("React Query raw data:", data);

  const components = data?.data || [];
  // const pagination = data?.pagination;

  const createMutation = useCreateSalaryComponent();
  const updateMutation = useUpdateSalaryComponent();
  const statusMutation = useUpdateSalaryStatus();
  const deleteMutation = useDeleteSalaryComponent();

  const generateComponentCode = (name: string) =>
    name.toUpperCase().trim().replace(/\s+/g, "_");

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast.success("Salary component deleted successfully ");
      },
      onError: () => {
        toast.error("Failed to delete salary component ");
      },
    });
  };

  const columns = [
    { title: "Component Name", dataIndex: "componentName" },
    { title: "Code", dataIndex: "componentCode" },
    {
      title: "Type",
      dataIndex: "type",
      render: (t: string) => (
        <span style={{ color: t === "Earning" ? "green" : "red" }}>{t}</span>
      ),
    },

    /* ===== FUTURE USE ===== */
    // { title: "Calculation Type", dataIndex: "calculationType" },

    // {
    //   title: "Status",
    //   dataIndex: "status",
    //   render: (s: boolean, record: any) => (
    //     <Switch
    //       checked={s}
    //       checkedChildren="Active"
    //       unCheckedChildren="Inactive"
    //       onChange={(checked) => toggleStatus(record.key, checked)}
    //     />
    //   ),
    // },

    {
      title: "Status",
      dataIndex: "status",
      render: (s: boolean, record: SalaryComponent) => (
        <Switch
          checked={s}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={(checked) => toggleStatus(record.key, checked)} // ✅ use key
        />
      ),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: SalaryComponent) => (
        <Space size={16}>
          <EditOutlined
            style={{ color: "#1677ff", cursor: "pointer" }}
            onClick={() => handleEdit(record)}
          />

          <Popconfirm
            title="Delete component?"
            description="This action cannot be undone"
            okText="Yes"
            cancelText="No"
            onConfirm={() => handleDelete(record.key)}
          >
            <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];


  const handleSave = async () => {
    const values = await form.validateFields();

    if (isEditMode && editingKey !== null) {
      updateMutation.mutate(
        {
          id: editingKey,
          data: values,
        },
        {
          onSuccess: () => {
            toast.success("Salary component successfully updated ");
            form.resetFields();
            setIsEditMode(false);
            setEditingKey(null);
            setOpen(false);
          },
          onError: () => {
            toast.error("Failed to update salary component ");
          },
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success("Salary component successfully added ");
          form.resetFields();
          setOpen(false);
        },
        onError: () => {
          toast.error("Failed to add salary component ");
        },
      });
    }
  };

  

  const toggleStatus = (key: number, status: boolean) => {
  statusMutation.mutate(
    { key, status },
    {
      onSuccess: () => {
        toast.success(
          `Salary component ${status ? "activated" : "deactivated"} successfully`
        );
      },
      onError: () => {
        toast.error("Failed to update component status");
      },
    }
  );
};


  const handleEdit = (record: SalaryComponent) => {
    setIsEditMode(true);
    setEditingKey(record.key);
    form.setFieldsValue(record);
    setOpen(true);
  };

  return (
    <Card style={{ marginLeft: 5, marginTop: -16 }}>
      {/* Header */}

      <Toaster position="top-right" />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
            Salary Component Management
          </Title>
          <Text type="secondary">
            Define and manage earning and deduction components for payroll
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setIsEditMode(false);
            setEditingKey(null);
            setOpen(true);
          }}
        >
          Add Component
        </Button>
      </div>

      {/* Filters */}
      <Space style={{ marginTop: 24 }}>
        <Select
          placeholder="All Types"
          allowClear
          style={{ width: 160 }}
          onChange={setTypeFilter}
        >
          <Option value="Earning">Earning</Option>
          <Option value="Deduction">Deduction</Option>
        </Select>

        <Select
          placeholder="All Status"
          allowClear
          style={{ width: 160 }}
          onChange={setStatusFilter}
        >
          <Option value="Active">Active</Option>
          <Option value="Inactive">Inactive</Option>
        </Select>

        <Input
          placeholder="Search by name or code"
          prefix={<SearchOutlined />}
          style={{ width: 260 }}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Space>

      {/* Table */}
      {/* <Table
        loading={isLoading}
        columns={columns}
        dataSource={components}
        rowKey="id" 
        pagination={{
          current: pagination?.current,
          pageSize: pagination?.pageSize,
          total: pagination?.total,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          },
        }}
        pagination={{ pageSize: 7 }}
      /> */}

      <div style={{ marginTop: 22 }}>
        <Card
          bordered={false}
          style={{
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            borderRadius: 12,
          }}
        >
          <Table
            loading={isLoading}
            columns={columns}
            dataSource={components}
            rowKey="key"
            pagination={{ pageSize: 7 }}
            size="middle"
            rowClassName={() => "salary-table-row"}
          />
        </Card>
      </div>

      {/* Drawer */}
      <Drawer
        title={isEditMode ? "Edit Salary Component" : "Add Salary Component"}
        open={open}
        onClose={() => setOpen(false)}
        width={420}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed) => {
            if (changed.componentName) {
              form.setFieldsValue({
                componentCode: generateComponentCode(changed.componentName),
              });
            }
          }}
        >
          <Form.Item
            label="Component Name"
            name="componentName"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Component Code"
            name="componentCode"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Component Type"
            name="type"
            initialValue="Earning"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value="Earning">Earning</Radio>
              <Radio value="Deduction">Deduction</Radio>
            </Radio.Group>
          </Form.Item>

          {/* ===== CALCULATION TYPE – FULLY COMMENTED (FUTURE USE) ===== */}
          {/*
          <Form.Item label="Calculation Type" name="calculationType">
            <Select>
              <Option value="Fixed">Fixed</Option>
              <Option value="Percentage">Percentage</Option>
              <Option value="Formula">Formula</Option>
            </Select>
          </Form.Item>
          */}

          {/*
          <Form.Item shouldUpdate>
            {({ getFieldValue }) => {
              const calcType = getFieldValue("calculationType");
              if (calcType === "Fixed") {
                return <Form.Item name="amount" label="Amount"><Input /></Form.Item>;
              }
              if (calcType === "Percentage") {
                return <Form.Item name="percentage" label="Percentage"><Input /></Form.Item>;
              }
              return null;
            }}
          </Form.Item>
          */}

          <Form.Item
            label="Status"
            name="status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleSave}>
              {isEditMode ? "Update" : "Add"}
            </Button>
          </Space>
        </Form>
      </Drawer>
    </Card>
  );
};

export default SalaryComponentManagement;
