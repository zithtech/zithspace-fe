"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Typography,
  Button,
  Space,
  Input,
  Tabs,
  Table,
  Tag,
  Modal,
  Form,
  Switch,
  notification,
  Select,
  Row,
  Col,
  Popconfirm,
  Divider
} from "antd";
import {
  ScheduleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { useDepartments } from "@/hooks/useDepartments";
import { SubDepartment } from "@/services/subDepartmentService";

const { Text } = Typography;

export default function SubDepartmentsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrg, canManageOrg } = usePermission();
  
  // Protect route - requires org.read permission
  useEffect(() => {
    if (!authLoading && !canReadOrg) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadOrg, router]);

  // Show loading while auth is being checked
  if (authLoading) {
    return null;
  }

  // Don't render if no read permission
  if (!canReadOrg) {
    return null;
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [submitting, setSubmitting] = useState(false);

  const {
    subDepartments,
    loading,
    createSubDepartment,
    updateSubDepartment,
    deleteSubDepartment
  } = useSubDepartments();

  const { departments, loading: departmentsLoading } = useDepartments();
  const {
    subDepartments,
    loading: subDepartmentsLoading,
    fetchSubDepartments,
    createSubDepartment,
    updateSubDepartment,
    deleteSubDepartment,
  } = useSubDepartments();

  const totalSubDepartments = subDepartments.length;
  const activeSubDepartments = subDepartments.filter((d) => d.isActive).length;
  const inactiveSubDepartments = totalSubDepartments - activeSubDepartments;

  const filteredData = useMemo(() => {
    return subDepartments.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.code.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesDepartment =
        !departmentFilter || item.parentDepartmentId === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [subDepartments, searchText, statusFilter, departmentFilter]);

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== "string") {
      return "";
    }
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setFieldsValue({ code: generateCodeFromName(name) });
  };

  const handleTabChange = (key: string) => {
    router.push(key);
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (record: SubDepartment) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      ...record,
      subDepartmentName: record.name,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const payload = {
        code: formValues.code,
        name: formValues.subDepartmentName,
        parentDepartmentId: formValues.departmentId,
        description: formValues.description,
        isActive: formValues.isActive,
      };

      setSubmitting(true);
      try {
        if (editingKey) {
          await updateSubDepartment(editingKey, payload);
        } else {
          await createSubDepartment(payload);
        }
        setSubmitting(false);
        setIsModalOpen(false);
        api.success({
          message: `Sub-Department ${editingKey ? "Updated" : "Added"}`,
          description: `The sub-department "${payload.name}" has been ${editingKey ? "updated" : "added"} successfully.`,
          placement: "topRight",
          duration: 1,
        });
      } catch (error) {
        setSubmitting(false);
        throw error;
      }
    } catch (error) {
      setSubmitting(false);
      console.error("Validation failed:", error);
      api.error({
        message: "Error",
        description: `Failed to ${editingKey ? "update" : "add"} sub-department.`,
        placement: "topRight",
      });
    }
  };

  const filteredData = useMemo(() => {
    return subDepartments.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.parentDepartment?.name || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesDepartment =
        !departmentFilter || item.parentDepartmentId === departmentFilter;
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [subDepartments, searchText, statusFilter, departmentFilter]);

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 120,
      sorter: (a: SubDepartment, b: SubDepartment) => a.code.localeCompare(b.code),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: SubDepartment, b: SubDepartment) => a.name.localeCompare(b.name),
    },
    {
      title: "Parent Department",
      key: "parentDepartment",
      render: (_: any, record: SubDepartment) => record.parentDepartment?.name || "-",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (status: boolean) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div style={{marginTop:20}}>
          <Tabs
            activeKey={pathname}
            onChange={handleTabChange}
            items={[
              { key: "/org-structure/overview", label: "Overview" },
              { key: "/org-structure/grades", label: "Grades" },
              {
                key: "/org-structure/employment-types",
                label: "Employment Types",
              },
              { key: "/org-structure/departments", label: "Departments" },
              {
                key: "/org-structure/sub-departments",
                label: "Sub-Departments",
              },
              { key: "/org-structure/positions", label: "Positions" },
            ]}
          />
          
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <Space align="center" size={8}>
                  <ScheduleOutlined
                    style={{ color: "#1a64c4ff", fontSize: 20 }}
                  />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Sub-Departments Management
                  </Typography.Title>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Define and manage organization sub-departments.
                  </Text>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Select
                  placeholder="Status"
                  allowClear
                  style={{ width: 120 }}
                  onChange={(value) => setStatusFilter(value)}
                >
                  <Select.Option value="active">Active</Select.Option>
                  <Select.Option value="inactive">Inactive</Select.Option>
                </Select>
                <Select
                  placeholder="Parent Department"
                  allowClear
                  style={{ width: 200 }}
                  onChange={(value) => setDepartmentFilter(value)}
                  loading={departmentsLoading}
                  showSearch
                  optionFilterProp="children"
                >
                  {departments.map((dept) => (
                    <Select.Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Select.Option>
                  ))}
                </Select>
                <Input.Search
                  placeholder="Search..."
                  allowClear
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 300 }}
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add Sub-Department
                </Button>
              </div>
            </div>

            <Space>
              <Tag style={{ borderRadius: 12 }}>
                Total Sub-Departments: {totalSubDepartments}
              </Tag>
              <Tag style={{ borderRadius: 12 }} color="green">
                Active: {activeSubDepartments}
              </Tag>
              <Tag style={{ borderRadius: 12 }} color="red">
                Inactive: {inactiveSubDepartments}
              </Tag>
            </Space>
                  <Divider style={{marginTop:20}}/>
            <Table
              size="small"
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={subDepartmentsLoading}
            />
        

          <Modal
            title={editingId ? "Edit Sub-Department" : "Add Sub-Department"}
            open={isModalOpen}
            onOk={handleSave}
            okText={editingId ? "Update Sub-Department" : "Add Sub-Department"}
            onCancel={() => setIsModalOpen(false)}
            confirmLoading={submitting}
            cancelButtonProps={{ disabled: submitting }}
            maskClosable={!submitting}
            destroyOnClose
            width={450}
          >
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="code"
                    label="Code"
                    rules={[{ required: true, message: "Code is required" }]}
                  >
                    <Input placeholder="Auto-generated" disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="Sub-Department Name"
                    normalize={(value) =>
                      value
                        ? value.charAt(0).toUpperCase() + value.slice(1)
                        : value
                    }
                    rules={[{ required: true, message: "Please enter name" }]}
                  >
                    <Input
                      placeholder="e.g. Recruitment"
                      onChange={handleNameChange}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="parentDepartmentId"
                label="Parent Department"
                rules={[
                  {
                    required: true,
                    message: "Please select parent department",
                  },
                ]}
              >
                <Select
                  placeholder="Select Parent Department"
                  loading={departmentsLoading}
                  showSearch
                  optionFilterProp="children"
                >
                  {departments.map((dept) => (
                    <Select.Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} />
              </Form.Item>
              <Form.Item style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 0",
                    minHeight: 64,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      Status
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>
                      Enable or disable this record
                    </div>
                  </div>

                  <Form.Item name="isActive" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
