"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Card, Typography, Button, Space, Input, Tabs, Table, Tag, Modal, Form, Switch, notification, Select, Row, Col, Popconfirm } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
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

  const totalSubDepartments = subDepartments.length;
  const activeSubDepartments = subDepartments.filter(sd => sd.isActive).length;
  const inactiveSubDepartments = totalSubDepartments - activeSubDepartments;

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
      key: "status",
      width: 100,
      render: (_: any, record: SubDepartment) => (
        <Tag color={record.isActive ? "success" : "default"}>
          {record.isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: SubDepartment) => {
        if (!canManageOrg) return null;
        
        return (
          <Space>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
            <Popconfirm
              title="Delete sub-department?"
              description="Are you sure you want to delete this sub-department?"
              onConfirm={() => deleteSubDepartment(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div style={{ padding: 24 }}>
          <Tabs
            activeKey={pathname}
            onChange={handleTabChange}
            items={[
              { key: "/org-structure/overview", label: "Overview" },
              { key: "/org-structure/departments", label: "Departments" },
              { key: "/org-structure/sub-departments", label: "Sub-Departments" },
              { key: "/org-structure/positions", label: "Positions" },
              { key: "/org-structure/grades", label: "Grades" },
              { key: "/org-structure/employment-types", label: "Employment Types" },
            ]}
          />

          <Card style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <Space>
                <Tag>Total: {totalSubDepartments}</Tag>
                <Tag color="success">Active: {activeSubDepartments}</Tag>
                <Tag>Inactive: {inactiveSubDepartments}</Tag>
              </Space>
              {canManageOrg && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  Add Sub-Department
                </Button>
              )}
            </div>

            <Space style={{ marginBottom: 16, width: "100%" }}>
              <Input
                placeholder="Search..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              <Select
                placeholder="Filter by Status"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
                allowClear
              >
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
              <Select
                placeholder="Filter by Department"
                value={departmentFilter}
                onChange={setDepartmentFilter}
                style={{ width: 200 }}
                allowClear
                loading={departmentsLoading}
              >
                {departments.map((dept) => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>

            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>

          <Modal
            title={editingKey ? "Edit Sub-Department" : "Add Sub-Department"}
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={handleSave}
            confirmLoading={submitting}
            width={600}
          >
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="subDepartmentName"
                    label="Name"
                    rules={[{ required: true, message: "Please enter name" }]}
                  >
                    <Input
                      placeholder="Enter name"
                      onChange={(e) => {
                        const code = generateCodeFromName(e.target.value);
                        form.setFieldsValue({ code });
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="code"
                    label="Code"
                    rules={[{ required: true, message: "Please enter code" }]}
                  >
                    <Input placeholder="AUTO_GENERATED" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="departmentId"
                label="Department"
                rules={[{ required: true, message: "Please select department" }]}
              >
                <Select placeholder="Select department" loading={departmentsLoading}>
                  {departments.map((dept) => (
                    <Select.Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="Enter description" />
              </Form.Item>

              <Form.Item name="isActive" label="Status" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
