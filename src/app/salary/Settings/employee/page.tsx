"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Space,
  Button,
  Table,
  Tag,
  Switch,
  Input,
  Modal,
  Form,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  useEmployeeFields,
  useCreateEmployeeField,
  useUpdateEmployeeField,
  useToggleFieldVisibility,
  useDeleteEmployeeField,
} from "@/hooks/useEmployeeFields";
import { useAllCompanies } from "@/hooks/useCompanies"; // Assuming you have this hook
import { EmployeeField } from "@/types/employeeField";

import { PreviewType } from "@/types/salary";

interface Props {
  onPreview: (type: Exclude<PreviewType, null>, data: any) => void;
}

const { Title, Text } = Typography;
const { Column } = Table;
const { Option } = Select;

interface EmployeeFieldFormData {
  companyId: number;
  systemKey: string;
  displayName: string;
  isVisible: boolean;
}

export default function EmployeeSettings({ onPreview }: Props) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );
  const [searchText, setSearchText] = useState("");
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingField, setEditingField] = useState<EmployeeField | null>(null);
  const [form] = Form.useForm();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Get all companies for dropdown
  const { data: companies = [], isLoading: companiesLoading } =
    useAllCompanies();

  // Get employee fields for selected company
  const {
    data: fields = [],
    isLoading,
    error,
    refetch,
  } = useEmployeeFields(selectedCompanyId);
  const createMutation = useCreateEmployeeField();
  const updateMutation = useUpdateEmployeeField();
  const toggleVisibilityMutation = useToggleFieldVisibility();
  const deleteMutation = useDeleteEmployeeField();

  // Auto-select first company if available
  // useEffect(() => {
  //   if (companies.length > 0 && !selectedCompanyId) {
  //     setSelectedCompanyId(companies[0].id);
  //   }
  // }, [companies])
  //

  useEffect(() => {
    if (companies.length > 0) {
      setSelectedCompanyId((prev) => prev ?? companies[0].id);
    }
  }, [companies]);

  // Filter fields based on search
  const filteredFields = fields.filter(
    (field) =>
      field.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
      field.systemKey.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleCreate = () => {
    if (!selectedCompanyId) {
      message.error("Please select a company first");
      return;
    }
    form.resetFields();
    form.setFieldsValue({ companyId: selectedCompanyId, isVisible: true });
    setIsCreateModalVisible(true);
  };

  const handleEdit = (field: EmployeeField) => {
    setEditingField(field);
    form.setFieldsValue({
      displayName: field.displayName,
    });
    setIsEditModalVisible(true);
  };

  const handleCreateSubmit = async (values: EmployeeFieldFormData) => {
    try {
      await createMutation.mutateAsync({
        companyId: values.companyId,
        systemKey: values.systemKey,
        displayName: values.displayName || values.systemKey,
        isVisible: values.isVisible,
      });
      setIsCreateModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Failed to create field:", error);
    }
  };

  const handleEditSubmit = async (values: { displayName: string }) => {
    if (!editingField) return;

    try {
      await updateMutation.mutateAsync({
        id: editingField.id,
        data: { displayName: values.displayName },
      });
      setIsEditModalVisible(false);
      setEditingField(null);
    } catch (error) {
      console.error("Failed to update field:", error);
    }
  };

  // const handleToggleVisibility = async (id: number) => {
  //   try {
  //     await toggleVisibilityMutation.mutateAsync(id);
  //   } catch (error) {
  //     console.error("Failed to toggle visibility:", error);
  //   }
  // };

  const handleToggleVisibility = async (id: number) => {
    try {
      setTogglingId(id);
      await toggleVisibilityMutation.mutateAsync(id);
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success("Field deleted successfully");
    } catch (error) {
      console.error("Failed to delete field:", error);
    }
  };

  if (error) {
    return (
      <Card>
        <div style={{ textAlign: "center", padding: 50 }}>
          <Title level={4}>Error loading employee fields</Title>
          <Text type="danger">{(error as Error).message}</Text>
          <br />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div>
      <Card style={{ marginLeft: 5, marginTop: -16 }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                Employee Field Configuration
              </Title>
              <Text type="secondary">
                Customize which employee fields are visible in the system
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() =>
                    onPreview(
                      "employee",
                      fields
                        .filter((f) => f.isVisible)
                        .map((f) => ({
                          key: f.systemKey, // required
                          label: f.displayName, // display name
                          value: "-", // dummy value
                        })),
                    )
                  }
                >
                  Preview
                </Button>

                {/* <Select
                  placeholder="Select Company"
                  style={{ width: 200 }}
                  value={selectedCompanyId}
                  onChange={setSelectedCompanyId}
                  loading={companiesLoading}
                >
                  {companies.map((company) => (
                    <Option key={company.id} value={company.id}>
                      {company.name}
                    </Option>
                  ))}
                </Select> */}

                <Select
                  placeholder={
                    companiesLoading ? "Loading companies..." : "Select Company"
                  }
                  style={{ width: 200 }}
                  value={selectedCompanyId}
                  onChange={setSelectedCompanyId}
                  loading={companiesLoading}
                  disabled={companiesLoading}
                >
                  {companies.map((company) => (
                    <Option key={company.id} value={company.id}>
                      {company.name}
                    </Option>
                  ))}
                </Select>

                <Input
                  placeholder="Search fields..."
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  disabled={!selectedCompanyId}
                />

                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                  loading={createMutation.isPending}
                  disabled={!selectedCompanyId}
                >
                  Add Field
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {selectedCompanyId && (
          <Row gutter={[16, 16]}>
            {filteredFields.map((field) => (
              <Col key={field.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  bordered
                  bodyStyle={{
                    padding: 16,
                    backgroundColor: field.isVisible ? "#fafafa" : "#f5f5f5",
                    borderRadius: 6,
                    opacity: field.isVisible ? 1 : 0.8,
                    height: "100%",
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    border: `1px solid ${field.isVisible ? "#d9d9d9" : "#e8e8e8"}`,
                    borderRadius: 8,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <Text
                          strong
                          style={{
                            fontSize: 14,
                            color: field.isVisible ? "#1a1a1a" : "#8c8c8c",
                          }}
                        >
                          {field.systemKey}
                        </Text>
                        {!field.isVisible && (
                          <Tag
                            color="default"
                            style={{ marginLeft: 4, fontSize: 10 }}
                          >
                            Inactive
                          </Tag>
                        )}
                      </div>
                      <div
                        style={{
                          backgroundColor: "#ffffff",
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: "1px solid #f0f0f0",
                          minHeight: 32,
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: field.isVisible ? "#595959" : "#bfbfbf",
                            fontSize: 13,
                            fontFamily: "monospace",
                          }}
                        >
                          {field.displayName}
                        </Text>
                      </div>
                    </div>

                    <Space
                      direction="vertical"
                      align="end"
                      style={{
                        marginLeft: 8,
                        height: "100%",
                        justifyContent: "space-between",
                      }}
                    >
                      <Space size={4}>
                        <Button
                          type="text"
                          icon={<EditOutlined />}
                          onClick={() => handleEdit(field)}
                          size="small"
                          style={{ color: "#1890ff" }}
                          disabled={!field.isVisible}
                        />
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(field.id)}
                          size="small"
                          loading={deleteMutation.isPending}
                        />
                      </Space>

                      <Space size={6}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {field.isVisible ? "Visible" : "Hidden"}
                        </Text>
                        {/* <Switch
                          size="small"
                          checked={field.isVisible}
                          onChange={() => handleToggleVisibility(field.id)}
                          loading={toggleVisibilityMutation.isPending}
                        /> */}

                        <Switch
                          size="small"
                          checked={field.isVisible}
                          onChange={() => handleToggleVisibility(field.id)}
                          loading={togglingId === field.id}
                          disabled={
                            togglingId !== null && togglingId !== field.id
                          }
                        />
                      </Space>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create Employee Field"
        open={isCreateModalVisible}
        onCancel={() => setIsCreateModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={createMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateSubmit}
          initialValues={{ isVisible: true }}
        >
          <Form.Item name="companyId" label="Company" hidden>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            name="systemKey"
            label="System Key"
            rules={[
              { required: true, message: "Please enter system key" },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: "Only letters, numbers and underscore allowed",
              },
            ]}
          >
            <Input placeholder="e.g., employee_id, department" />
          </Form.Item>
          <Form.Item name="displayName" label="Display Name">
            <Input placeholder="Leave empty to use system key" />
          </Form.Item>
          <Form.Item
            name="isVisible"
            label="Visibility"
            valuePropName="checked"
          >
            <Switch checkedChildren="Visible" unCheckedChildren="Hidden" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Employee Field"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingField(null);
        }}
        onOk={() => form.submit()}
        confirmLoading={updateMutation.isPending}
      >
        <Form form={form} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            name="displayName"
            label="Display Name"
            rules={[{ required: true, message: "Please enter display name" }]}
          >
            <Input />
          </Form.Item>
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">
              System Key: <Tag>{editingField?.systemKey}</Tag>
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
