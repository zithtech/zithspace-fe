"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Card, Typography, Button, Space, Input, Tabs, Table, Tag, Modal, Form, Switch, notification, Select, Row, Col, Popconfirm } from "antd";
import { ScheduleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useEmploymentTypes } from "@/hooks/useEmploymentTypes";
import { MembersService } from "@/services/membersService";
import { useDepartments } from "@/hooks/useDepartments";
import { Department } from "@/services/departmentService";

const { Text } = Typography;

export default function DepartmentsPage() {
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
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const [submitting, setSubmitting] = useState(false);

  const {
    employmentTypes,
    loading: employmentTypesLoading,
  } = useEmploymentTypes();

  const {
    departments,
    loading,
    createDepartment,
    updateDepartment,
    deleteDepartment
  } = useDepartments();

  const totalDepartments = departments.length;
  const activeDepartments = departments.filter(d => d.isActive).length;
  const inactiveDepartments = totalDepartments - activeDepartments;

  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await MembersService.getMembersForSelect();
        setMembers(data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };
    fetchMembers();
  }, []);

  const handleTabChange = (key: string) => {
    router.push(key);
  };

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== 'string') {
      return '';
    }
    return name.trim().toUpperCase().replace(/\s+/g, '_');
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (record: Department) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      ...record,
      code: record.code,
      departmentName: record.name, // form field name
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const payload = {
        code: formValues.code,
        name: formValues.departmentName,
        employmentType: formValues.employmentType,
        headId: formValues.headId,
        description: formValues.description,
        isActive: formValues.isActive,
      };

      setSubmitting(true);
      let success = false;
      if (editingKey) {
        // Update department
        success = await updateDepartment(editingKey, payload);
      } else {
        // Add new department
        success = await createDepartment(payload);
      }
      setSubmitting(false);
      
      if (success) {
        setIsModalOpen(false);
        api.success({
          message: `Department ${editingKey ? "Updated" : "Added"}`,
          description: `The department "${payload.name}" has been ${editingKey ? "updated" : "added"} successfully.`,
          placement: "topRight",
          duration: 1,
        });
      }
    } catch (error) {
      setSubmitting(false);
      console.error("Validation failed:", error);
      api.error({
        message: "Error",
        description: `Failed to ${editingKey ? "update" : "add"} department.`,
        placement: "topRight",
      });
    }
  };
  const filteredData = useMemo(() => {
    return departments.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        (item.employmentType || "").toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q) ||
        (item.head?.name || "").toLowerCase().includes(q);
      const matchesStatus =
        !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesEmploymentType =
        !employmentTypeFilter || item.employmentType === employmentTypeFilter;
      return matchesSearch && matchesStatus && matchesEmploymentType;
    });
  }, [departments, searchText, statusFilter, employmentTypeFilter]);

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      sorter: (a: Department, b: Department) =>
        a.code.localeCompare(b.code),
    },
    {
      title: "Department Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: Department, b: Department) =>
        a.name.localeCompare(b.name),
    },
    {
      title: "Employment Type",
      dataIndex: "employmentType",
      key: "employmentType",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Head",
      dataIndex: "head",
      key: "head",
      render: (head: any) => head?.name || "-",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: Department) => (
        <Space >
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },
  ];

  const handleFormValuesChange = (changedValues: { departmentName?: string }) => {
    if (changedValues.departmentName !== undefined) {
      const name = changedValues.departmentName;
      const code = generateCodeFromName(name);
      form.setFieldsValue({ code });
    }
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div style={{ padding: 24 }}>
          <Tabs activeKey={pathname} onChange={handleTabChange} items={[
             { key: "/org-structure/overview", label: "Overview" },
            { key: "/org-structure/grades", label: "Grades" },
            { key: "/org-structure/employment-types", label: "Employment Types" },
            { key: "/org-structure/departments", label: "Departments" },
            { key: "/org-structure/sub-departments", label: "Sub-Departments" },
            { key: "/org-structure/positions", label: "Positions" },
            
          ]} />
          <Card>
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
                  <ScheduleOutlined style={{ color: "#1a64c4ff", fontSize: 20 }} />
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    Departments Management
                  </Typography.Title>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Define and manage organization departments.
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
                  placeholder="Employment Type"
                  allowClear
                  style={{ width: 200 }}
                  onChange={(value) => setEmploymentTypeFilter(value)}
                  loading={employmentTypesLoading}
                >
                  {employmentTypes.map((et) => (
                    <Select.Option key={et.id} value={et.name}>
                      {et.name}
                    </Select.Option>
                  ))}
                </Select>
                <Input.Search
                  placeholder="Search..."
                  allowClear
                  style={{ width: 300 }}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Department</Button>
              </div>
            </div>

            <Space style={{ marginBottom: 16 }}>
              <Tag style={{ borderRadius: 12 }}>Total Departments: {totalDepartments}</Tag>
              <Tag style={{ borderRadius: 12 }} color="green">Active: {activeDepartments}</Tag>
              <Tag style={{ borderRadius: 12 }} color="red">Inactive: {inactiveDepartments}</Tag>
            </Space>

            <Table
              rowKey="id"
              size="small"
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              pagination={{ pageSize: 10 }}
            />
            <Modal
              title={editingKey ? "Edit Department" : "Add Department"}
              open={isModalOpen}
              onOk={handleSave}
              okText={editingKey ? "Update Department" : "Add Department"}
              onCancel={() => setIsModalOpen(false)}
              confirmLoading={submitting}
              cancelButtonProps={{ disabled: submitting }}
              maskClosable={!submitting}
              destroyOnClose
              width={450}
            >
              <Form form={form} layout="vertical" onValuesChange={handleFormValuesChange}>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item
                      name="code"
                      label="Department Code"
                      rules={[{ required: true, message: "Code is required" }]}
                    >
                      <Input placeholder="Auto-generated" disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="departmentName"
                      label="Department Name"
                      normalize={(value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)}
                      rules={[{ required: true, message: "Please enter a department name" }]}
                    >
                      <Input
                        placeholder="Enter a department name"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item
                  name="employmentType"
                  label="Employment Type"
                >
                  <Select
                    placeholder="Select an employment type"
                    loading={employmentTypesLoading}
                    allowClear
                  >
                    {employmentTypes
                      .filter((et) => et.isActive)
                      .map((type) => (
                        <Select.Option key={type.id} value={type.name}>
                          {type.name}
                        </Select.Option>
                      ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  name="headId"
                  label="Head"
                >
                  <Select placeholder="Select department head" allowClear showSearch optionFilterProp="children">
                    {members.map((m) => (
                      <Select.Option key={m.value} value={m.value}>
                        {m.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} placeholder="Enter a description for the department." />
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
        Enable or disable this department.
      </div>
    </div>

    <Form.Item
      name="isActive"
      valuePropName="checked"
      initialValue={true}
      noStyle
    >
      <Switch />
    </Form.Item>
  </div>
</Form.Item>

              </Form>
            </Modal>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}