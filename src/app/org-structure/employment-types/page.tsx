"use client";
import React, { useState, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Card, Typography, Button, Space, Input, Tabs, Table, Tag, Modal, Form, Switch, Popconfirm, notification,ConfigProvider } from "antd";
import { ScheduleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useEmploymentTypes } from "@/hooks/useEmploymentTypes";
import { EmploymentType } from "@/services/employmentTypeService";

const { Text } = Typography;

export default function EmploymentTypesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const {
    employmentTypes,
    loading,
    createEmploymentType,
    updateEmploymentType,
    deleteEmploymentType
  } = useEmploymentTypes();

  const totalTypes = employmentTypes.length;
  const activeTypes = employmentTypes.filter(type => type.isActive).length;
  const inactiveTypes = totalTypes - activeTypes;

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== 'string') {
      return '';
    }
    return name.trim().toUpperCase().replace(/\s+/g, '_');
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

  const handleEdit = (record: EmploymentType) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      ...record,
      code: record.code,
      typeName: record.name,
      isActive: record.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const payload = {
        code: formValues.code,
        name: formValues.typeName,
        description: formValues.description,
        isActive: formValues.isActive,
      };

      setSubmitting(true);

      let success = false;
      if (editingKey) {
        success = await updateEmploymentType(editingKey, payload);
      } else {
        success = await createEmploymentType(payload);
      }
      
      if (success) {
        setIsModalOpen(false);
        api.success({
          message: `Employment Type ${editingKey ? "Updated" : "Added"}`,
          description: `Employment type "${formValues.typeName}" was successfully ${editingKey ? "updated" : "added"}.`,
          placement: "topRight",
          duration: 1,
        });
      } else {
        api.error({
          message: "Error",
          description: `Failed to ${editingKey ? "update" : "add"} employment type.`,
          placement: "topRight",
        });
      }
    } catch (error) {
      console.error("Validation failed:", error);
    } finally {
      setSubmitting(false);
    }
  };
  const filteredData = useMemo(() => {
    if (!searchText.trim()) return employmentTypes;
    const q = searchText.toLowerCase();
    return employmentTypes.filter(
      (item) =>
        item.name.toLowerCase().includes(q) || (item.description || "").toLowerCase().includes(q)
    );
  }, [employmentTypes, searchText]);

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
    },
    {
      title: "Type Name",
      dataIndex: "name",
      key: "name",
      sorter: (a: EmploymentType, b: EmploymentType) =>
        a.name.localeCompare(b.name),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
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
      render: (_: any, record: EmploymentType) => (
        <Space >
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
        </Space>
      ),
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}
        <div style={{ padding: 24 }}>
          <Tabs activeKey={pathname} onChange={handleTabChange} items={[
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
                    Employment Types Management
                  </Typography.Title>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Define and manage employment types.
                  </Text>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Input.Search
                  placeholder="Search types..."
                  allowClear
                  style={{ width: 320 }}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Employment Types </Button>
              </div>
            </div>

            <Space style={{ marginBottom: 16 }}>
              <Tag style={{ borderRadius: 12 }}>Total Types: {totalTypes}</Tag>
              <Tag style={{ borderRadius: 12 }} color="green">Active: {activeTypes}</Tag>
              <Tag style={{ borderRadius: 12 }} color="red">Inactive: {inactiveTypes}</Tag>
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
              title={editingKey ? "Edit Employment Type" : "Add Employment Type"}
              open={isModalOpen}
              onOk={handleSave}
              okText={editingKey ? "Update Employment Type" : "Add Employment Type"}
              onCancel={() => setIsModalOpen(false)}
              confirmLoading={submitting}
              cancelButtonProps={{ disabled: submitting }}
              maskClosable={!submitting}
              destroyOnClose
              width={450}
            >
              <Form form={form} layout="vertical">
                <Form.Item
                  name="code"
                  label="Code"
                  rules={[{ required: true, message: "Please enter a code" }]}
                >
                  <Input placeholder="Enter code" />
                </Form.Item>
                <Form.Item
                  name="typeName"
                  label="Type Name"
                  normalize={(value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)}
                  rules={[{ required: true, message: "Please enter an employment type" }]}
                >
                  <Input
                    placeholder="Enter an employment type"
                    onChange={(e) => {
                      if (!editingKey) {
                        const code = generateCodeFromName(e.target.value);
                        form.setFieldsValue({ code });
                      }
                    }}
                  />
                </Form.Item>
                <Form.Item name="description" label="Description">
                  <Input.TextArea rows={3} placeholder="Enter a description for the employment type." />
                </Form.Item>
               <Form.Item >
    
  <div style={{ display: "flex", justifyContent: "space-between" }}>
    
    <div>
      <div style={{ fontWeight: 600 }}>Status</div>
      <div style={{ fontSize: 12, color: "#888" }}>
        Enable or disable this employment type
      </div>
    </div>

      <Form.Item name="isActive" valuePropName="checked" noStyle>
        <Switch style={{top:10}}  />
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