"use client";

import React, { useMemo, useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Card, Typography, Button, Table, Space, Input, Tag, Modal, Form, Select, InputNumber, message, Row, Col, Switch, notification, Tabs, Tooltip, Spin } from "antd";
import { ScheduleOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { useGrades, GradeViewData } from "@/hooks/useGrades";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";

const { Text } = Typography;

export default function GradesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrg, canManageOrg } = usePermission();
  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadOrg) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadOrg, router]);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  const { dataSource, loading, addGrade, updateGrade } = useGrades();

  const totalGrades = dataSource.length;
  const activeGrades = dataSource.filter(g => g.status === 'Active').length;
  const inactiveGrades = totalGrades - activeGrades;

  const filteredData = useMemo(() => {
    if (!search.trim()) return dataSource;
    const q = search.toLowerCase();
    return dataSource.filter((r) =>
      [r.code, r.codes, r.name, String(r.levelOrder), r.description || "", r.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, dataSource]);

  const generateNextCode = () => {
    let maxNum = 0;
    let prefix = "G";

    dataSource.forEach((g) => {
      const match = g.code.match(/^([^\d]*)(\d+)$/);
      if (match) {
        prefix = match[1] || "G";
        const num = parseInt(match[2], 10);
        if (!Number.isNaN(num) && num > maxNum) maxNum = num;
      }
    });

    // Always return non-padded numeric suffix (e.g., G1, G2, ...)
    return `${prefix}${maxNum + 1}`;
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
    form.setFieldsValue({ code: generateNextCode(), status: true, levelOrder: dataSource.length + 1 });
    setIsModalOpen(true);
  };

  const handleEdit = (record: GradeViewData) => {
    setEditingKey(record.key);
    form.setFieldsValue({
      ...record,
      status: record.isActive, // Map boolean for Switch
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();

      // Client-side check for duplicate code to provide instant feedback
      const isDuplicateCode = dataSource.some(
        (g) =>
          g.code.toLowerCase() === formValues.code.toLowerCase() &&
          g.key !== editingKey,
      );

      if (isDuplicateCode) {
        message.error("A grade with this code already exists. Please use a different code.");
        return; // Stop submission
      }

      const isDuplicateName = dataSource.some(
        (g) =>
          g.name.toLowerCase() === formValues.name.trim().toLowerCase() &&
          g.key !== editingKey,
      );

      if (isDuplicateName) {
        message.error("This grade name already exists.");
        return;
      }

      const values = {
        name: formValues.name,
        code: formValues.code,
        codes: formValues.codes,
        levelOrder: formValues.levelOrder,
        description: formValues.description,
        isActive: !!formValues.status, // Convert Switch value to boolean
      };

      setSubmitting(true);
      let success = false;
      if (editingKey) {
        success = await updateGrade(editingKey, values);
      } else {
        success = await addGrade(values);
      }
      setSubmitting(false);

      if (success) {
        setIsModalOpen(false);
        api.success({
          message: editingKey ? "Grade Updated" : "Grade Added",
          description: `Grade "${values.name}" successfully ${editingKey ? "updated" : "added"}.`,
          placement: "topRight",
          duration: 1
        });
      }
    } catch (error) {
      // Validation failed
      setSubmitting(false);
    }
  };

  // Loading & permission check
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <Spin size="large" tip="Loading..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadOrg) {
    return null;
  }

  const handleTabChange = (key: string) => {
    router.push(key);
  };

  const columns = [
    {
      title: "Code",
      dataIndex: "codes",
      key: "codes",
      width: 200,
    },
      {
        title: "Grade ",
        dataIndex: "code",
        key: "code",
        align: "center",
        width:100,
         sorter: (a: GradeViewData, b: GradeViewData) =>
          a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: "base" }),
        sortDirections: ["ascend", "descend"],

      },
      {
        title: "Grade Name",
        dataIndex: "name",
        key: "name",
        width: 200,
        sorter: (a: GradeViewData, b: GradeViewData) =>
          a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
        sortDirections: ["ascend", "descend"],
      },
      {
        title: "Level Order",
        dataIndex: "levelOrder",
        key: "levelOrder",
        width: 100,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        width: 350,
        ellipsis: {
          showTitle: false,
        },
        render: (description: string) => (
          <Tooltip placement="topLeft" title={description}>
            {description}
          </Tooltip>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value: string) => (
          <Tag color={value === "Active" ? "green" : "red"}>{value}</Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right" as const,
        render: (_: any, record: GradeViewData) => {
          if (!canManageOrg) return null;
          return (
            <Space style={{gap:18}}>
              <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}></Button>
            </Space>
          );
        },
      },
    ];

  return (
    <MainLayout>
        <div style={{ padding: 24 }}>
          {contextHolder}
          <Tabs
            activeKey={pathname}
            onChange={handleTabChange}
            items={[
              {
                key: "/org-structure/overview",
                label: "Overview",
              },
              {
                key: "/org-structure/grades",
                label: "Grades",
              },
              {
                key: "/org-structure/employment-types",
                label: "Employment Types",
              },
              {
                key: "/org-structure/departments",
                label: "Departments",
              },
              {
                key: "/org-structure/sub-departments",
                label: "Sub-Departments",
              },
              {
                key: "/org-structure/positions",
                label: "Positions",
              },
            ]}
          />
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
                    Grades
                  </Typography.Title>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Define and manage organization grade hierarchy.
                  </Text>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Input.Search
                  placeholder="Search grades..."
                  allowClear
                  style={{ width: 320 }}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {canManageOrg && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Grade</Button>
                )}
              </div>
            </div>

            <Space style={{ marginBottom: 16 }}>
              <Tag style={{borderRadius:12}}>Total Grades: {totalGrades}</Tag>
              <Tag  style={{borderRadius:12}} color="green">Active: {activeGrades}</Tag>
              <Tag  style={{borderRadius:12}} color="red">Inactive: {inactiveGrades}</Tag>
            </Space>

            <Table
              rowKey="key"
              size="small"
              columns={columns as any}
              dataSource={filteredData}
              loading={loading}
              pagination={{ pageSize: 10 }}
          
            />

            <Modal
  title={editingKey ? "Edit Grade" : "Add Grade"}
  open={isModalOpen}
  onOk={handleSave}
  okText={editingKey ? "Update Grade" : "Add Grade"}
  onCancel={() => setIsModalOpen(false)}
  confirmLoading={submitting}
  cancelButtonProps={{ disabled: submitting }}
  maskClosable={!submitting}
  destroyOnClose
  width={450}
>
  <Form form={form} layout="vertical">
     <Form.Item
                      name="codes"
                      label="Code"
                      rules={[{ required: true, message: "Please enter a code" }]}
                    
                    >
                      <Input placeholder="Enter code" disabled />
                    </Form.Item>

    {/* Row 1 — Code + Name */}
    <Row gutter={12}>
      <Col span={12}>
        <Form.Item
          name="code"
          label="Grade"
          rules={[{ required: true, message: "Please enter grade code" }]}
        >
          <Input placeholder="Auto-generated (e.g., G1)" disabled />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item
          name="name"
          label="Grade Name"
          normalize={(value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)}
          validateTrigger={['onBlur','onSubmit']}
          rules={[{ required: true, message: "Please enter grade name" },]}
        >
          <Input
                             placeholder="Enter Grade name"
                             onChange={(e) => {
                               if (!editingKey) {
                                 const codes = generateCodeFromName(e.target.value);
                                 form.setFieldsValue({ codes });
                               }
                             }}
                           />
        </Form.Item>
      </Col>
    </Row>

   {/* Row 2 — Level + Status */}
<Row gutter={12}>
  <Col span={12}>
    <Form.Item
      name="levelOrder"
      label="Level Order"
      rules={[{ required: true, message: "Please enter level order" }]}
    >
      <InputNumber style={{ width: "100%" }} min={1} />
    </Form.Item>
  </Col>

 <Col span={12}>
  <Form.Item style={{ marginBottom: 0 }}>
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
          Enable or disable grade
        </div>
      </div>

      <Form.Item
        name="status"
        valuePropName="checked"
        initialValue={true}
        noStyle
      >
        <Switch />
      </Form.Item>
    </div>
  </Form.Item>
</Col>

</Row>

    {/* Row 3 — Description full width */}
    <Form.Item name="description" label="Description">
      <Input.TextArea rows={3} />
    </Form.Item>

  </Form>
</Modal>

          </Card>
        </div>
      </MainLayout>
  );
}
