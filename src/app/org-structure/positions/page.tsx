"use client";
import React, { useState, useMemo, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { Card, Typography, Button, Space, Input, Tabs, Table, Tag, Modal, Form, Switch, notification, Row, Col, Select, Popconfirm } from "antd";
import { ScheduleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useDepartments } from "@/hooks/useDepartments";
import { useGrades } from "@/hooks/useGrades";
import { useSubDepartments } from "@/hooks/useSubDepartments";
import { usePositions, PositionViewData } from "@/hooks/usePositions";

const { Text } = Typography;

export default function PositionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [api, contextHolder] = notification.useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [subDepartmentFilter, setSubDepartmentFilter] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Hooks for dropdown data
  const { departments, loading: departmentsLoading } = useDepartments();
  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { subDepartments, loading: subDepartmentsLoading } = useSubDepartments();

  // Use positions hook
  const { dataSource, loading, createPosition, updatePosition, deletePosition } = usePositions();

  const validDataSource = Array.isArray(dataSource) ? dataSource : [];
  const totalPositions = validDataSource.length;
  const activePositions = validDataSource.filter(p => p.isActive).length;
  const inactivePositions = totalPositions - activePositions;

  const handleTabChange = (key: string) => {
    router.push(key);
  };

  const generateCodeFromName = (name: string): string => {
    if (!name || typeof name !== 'string') {
      return '';
    }
    return name.trim().toUpperCase().replace(/\s+/g, '_');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setFieldsValue({ code: generateCodeFromName(title) });
  };

  const handleAdd = () => {
    setEditingKey(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setIsModalOpen(true);
  };

  const handleEdit = (record: PositionViewData) => {
    setEditingKey(record.id);
    form.setFieldsValue({
      ...record,
      status: record.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deletePosition(id);
  };

  const handleSave = async () => {
    try {
      const formValues = await form.validateFields();
      const values = {
        ...formValues,
        isActive: formValues.status,
      };
      setSubmitting(true);

      if (editingKey) {
        const success = await updatePosition(editingKey, values);
        if (success) {
          setIsModalOpen(false);
          api.success({
            message: "Position Updated",
            description: "Position updated successfully",
            placement: "topRight",
          });
        }
      } else {
        const success = await createPosition(values);
        if (success) {
          setIsModalOpen(false);
          api.success({
            message: "Position Added",
            description: "Position added successfully",
            placement: "topRight",
          });
        }
      }
    } catch (error: any) {
      console.error("Validation failed:", error);
      if (error.response?.data?.error) {
         api.error({
            message: "Error",
            description: error.response.data.error,
            placement: "topRight"
         });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredData = useMemo(() => {
    const validData = Array.isArray(dataSource) ? dataSource : [];

    return validData.filter((item) => {
      const q = searchText.toLowerCase();
      const matchesSearch =
        !searchText.trim() ||
        item.title?.toLowerCase()?.includes(q) ||
        item.code?.toLowerCase()?.includes(q);
      const matchesStatus = !statusFilter || (statusFilter === "active" ? item.isActive : !item.isActive);
      const matchesGrade = !gradeFilter || item.gradeId === gradeFilter;;
      const matchesDepartment = !departmentFilter || item.departmentId === departmentFilter;;
      const matchesSubDepartment = !subDepartmentFilter || item.subDepartmentId === subDepartmentFilter;;

      return matchesSearch && matchesStatus && matchesGrade && matchesDepartment && matchesSubDepartment;
    });
  }, [dataSource, searchText, statusFilter, gradeFilter, departmentFilter, subDepartmentFilter]);

  const columns = [
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      sorter: (a: PositionViewData, b: PositionViewData) => a.code.localeCompare(b.code),
    },
    {
      title: "Position Title",
      dataIndex: "title",
      key: "title",
      sorter: (a: PositionViewData, b: PositionViewData) => a.title.localeCompare(b.title),
    },
    {
      title: "Grade",
      dataIndex: "gradeId",
      key: "gradeId",
      render: (gradeId: string, record: PositionViewData) => record.gradeName || grades?.find((g) => g.key === gradeId)?.name || "-",
    },
    {
      title: "Department",
      dataIndex: "departmentId",
      key: "departmentId",
      render: (deptId: string, record: PositionViewData) => record.departmentName || departments?.find((d) => d.id === deptId)?.name || "-",
    },
    {
      title: "Sub-Department",
      dataIndex: "subDepartmentId",
      key: "subDepartmentId",
      render: (subDeptId: string, record: PositionViewData) => record.subDepartmentName || subDepartments?.find((sd) => sd.id === subDeptId)?.name || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status: string) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: PositionViewData) => (
        <Space style={{gap:12}}>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Delete Position"
            description="Are you sure you want to delete this position?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
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
                    Positions Management
                  </Typography.Title>
                </Space>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Define and manage organization positions.
                  </Text>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Input.Search
                  placeholder="Search..."
                  allowClear
                  style={{ width: 240 }}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>Add Position</Button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
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
                    placeholder="Grade"
                    allowClear
                    style={{ width: 150 }}
                    onChange={(value) => setGradeFilter(value)}
                    loading={gradesLoading}
                  >
                    {grades.map((g) => (
                      <Select.Option key={g.key} value={g.key}>{g.name}</Select.Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Department"
                    allowClear
                    style={{ width: 180 }}
                    onChange={(value) => setDepartmentFilter(value)}
                    loading={departmentsLoading}
                  >
                    {departments.map((d) => (
                      <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="Sub-Department"
                    allowClear
                    style={{ width: 180 }}
                    onChange={(value) => setSubDepartmentFilter(value)}
                    loading={subDepartmentsLoading}
                  >
                    {subDepartments.filter(sd => !departmentFilter || sd.parentDepartmentId === departmentFilter).map((sd) => (
                      <Select.Option key={sd.id} value={sd.id}>{sd.name}</Select.Option>
                    ))}
                  </Select>
            </div>

            <Space style={{ marginBottom: 16 }}>
              <Tag style={{ borderRadius: 12 }}>Total Positions: {totalPositions}</Tag>
              <Tag style={{ borderRadius: 12 }} color="green">Active: {activePositions}</Tag>
              <Tag style={{ borderRadius: 12 }} color="red">Inactive: {inactivePositions}</Tag>
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
              title={editingKey ? "Edit Position" : "Add Position"}
              open={isModalOpen}
              onOk={handleSave}
               okText={editingKey ? "Update Position" : "Add Position"}
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
                    >
                      <Input placeholder="Auto-generated" disabled />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="title"
                      label="Position Title"
                      normalize={(value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value)}
                      rules={[{ required: true, message: "Please enter position title" }]}
                    >
                      <Input placeholder="e.g. Senior Developer" onChange={handleTitleChange} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="gradeId"
                      label="Grade"
                      rules={[{ required: true, message: "Please select a grade" }]}
                    >
                      <Select placeholder="Select Grade" loading={gradesLoading}>
                        {grades.map((g) => (
                          <Select.Option key={g.key} value={g.key}>{g.name}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="departmentId"
                      label="Department"
                      rules={[{ required: true, message: "Please select a department" }]}
                    >
                      <Select placeholder="Select Department" loading={departmentsLoading}>
                        {departments.map((d) => (
                          <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="subDepartmentId"
                      label="Sub-Department"
                    >
                      <Select placeholder="Select Sub-Department" loading={subDepartmentsLoading} allowClear>
                        {subDepartments.map((sd) => (
                          <Select.Option key={sd.id} value={sd.id}>{sd.name}</Select.Option>
                        ))}
                      </Select>
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
              </Form>
            </Modal>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}