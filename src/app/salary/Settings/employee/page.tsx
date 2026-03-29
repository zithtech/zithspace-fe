"use client";

import { useState } from "react";
import {
  Card,
  Typography,
  Button,
  Switch,
  Input,
  Space,
  Divider,
  Row,
  Col,
  Modal,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  CheckOutlined,
  EyeOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
const { Title, Text } = Typography;

export type EmployeeField = {
  systemKey: string;
  displayName: string;
  isVisible: boolean;
};

const initialEmployeeFields: EmployeeField[] = [
  { systemKey: "Employee Name", displayName: "name", isVisible: true },
  { systemKey: "Employee ID", displayName: "id", isVisible: true },
  { systemKey: "Department", displayName: "department", isVisible: true },
  { systemKey: "Designation", displayName: "designation", isVisible: true },
  { systemKey: "Date of Joining", displayName: "DOJ", isVisible: true },
  { systemKey: "Bank Account", displayName: "bank", isVisible: false },
  { systemKey: "PAN Number", displayName: "pan", isVisible: false },
];

export default function EmployeeSettings() {
  const [employeeFields, setEmployeeFields] = useState<EmployeeField[]>(
    initialEmployeeFields,
  );

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<EmployeeField | null>(null);

  // form (UI-only naming)
  const [fieldKeyInput, setFieldKeyInput] = useState("");
  const [fieldLabelInput, setFieldLabelInput] = useState("");

  const toggleVisibility = (systemKey: string) => {
    setEmployeeFields((prev) =>
      prev.map((field) =>
        field.systemKey === systemKey
          ? { ...field, isVisible: !field.isVisible }
          : field,
      ),
    );
  };

  const openAddField = () => {
    setEditingField(null);
    setFieldKeyInput("");
    setFieldLabelInput("");
    setIsModalOpen(true);
  };

  const openEditField = (field: EmployeeField) => {
    setEditingField(field);
    setFieldKeyInput(field.systemKey);
    setFieldLabelInput(field.displayName);
    setIsModalOpen(true);
  };

  const handleSaveField = () => {
    if (!fieldKeyInput.trim()) return;

    if (editingField) {
      // EDIT
      setEmployeeFields((prev) =>
        prev.map((field) =>
          field.systemKey === editingField.systemKey
            ? {
                ...field,
                displayName: fieldLabelInput || fieldKeyInput,
              }
            : field,
        ),
      );
    } else {
      // ADD
      setEmployeeFields((prev) => [
        ...prev,
        {
          systemKey: fieldKeyInput,
          displayName: fieldLabelInput || fieldKeyInput,
          isVisible: true,
        },
      ]);
    }

    setIsModalOpen(false);
    setEditingField(null);
    setFieldKeyInput("");
    setFieldLabelInput("");
  };

  const handleDeleteField = (systemKey: string) => {
    // Your delete logic here
    console.log("Deleting field:", systemKey);
    // Example:
    // setEmployeeFields(prev => prev.filter(field => field.systemKey !== systemKey));
  };
  return (
    <Card>
      {/* HEADER */}
      <Space style={{ width: "100%", justifyContent: "space-between" }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Employee Details Configuration
          </Title>
          <Text type="secondary">
            Configure employee fields shown on payslip
          </Text>
        </div>

        <Space>
          <Button icon={<CheckOutlined />}>Save</Button>

          <Button type="primary" icon={<PlusOutlined />} onClick={openAddField}>
            Add Custom Field
          </Button>
        </Space>
      </Space>

      <Divider style={{ margin: "12px 0" }} />

      {/* FIELDS */}
      <Row gutter={[16, 12]}>
        {employeeFields.map((field) => (
          <Col key={field.systemKey} xs={24} sm={12} md={8}>
            <Card
              bordered
              bodyStyle={{ padding: 12 }}
              style={{ border: "1px solid #b1adad" }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <Text strong>{field.systemKey}</Text>
                  <div>
                    <Text type="secondary">Display: {field.displayName}</Text>
                  </div>
                </div>

                <Space size="small">
                  {/* Edit Button */}
                  <Tooltip title="Edit">
                    <EditOutlined
                      style={{
                        color: "#1677ff",
                        cursor: "pointer",
                        fontSize: "16px",
                        padding: "4px",
                      }}
                      onClick={() => openEditField(field)}
                    />
                  </Tooltip>

                  {/* Delete Button with Popconfirm */}
                  <Popconfirm
                    title="Delete Field"
                    description="Are you sure to delete this field?"
                    onConfirm={() => handleDeleteField(field.systemKey)}
                    okText="Yes"
                    cancelText="No"
                    okType="danger"
                    icon={<QuestionCircleOutlined style={{ color: "red" }} />}
                  >
                    <Tooltip title="Delete">
                      <DeleteOutlined
                        style={{
                          color: "#ff4d4f",
                          cursor: "pointer",
                          fontSize: "16px",
                          padding: "4px",
                        }}
                      />
                    </Tooltip>
                  </Popconfirm>

                  {/* Show/Hide Toggle */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginLeft: "8px",
                      paddingLeft: "8px",
                      borderLeft: "1px solid #d9d9d9",
                    }}
                  >
                    <Text style={{ fontSize: "12px" }}>Show</Text>
                    <Switch
                      size="small"
                      checked={field.isVisible}
                      onChange={() => toggleVisibility(field.systemKey)}
                    />
                  </div>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* MODAL */}
      <Modal
        title={editingField ? "Edit Field" : "Add Custom Field"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSaveField}
        okText={editingField ? "Update Field" : "Add Field"}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <Text strong>Field Name (System)</Text>
            <Input
              value={fieldKeyInput}
              onChange={(e) => setFieldKeyInput(e.target.value)}
              disabled={!!editingField}
            />
          </div>

          <div>
            <Text strong>Display Name (Payslip)</Text>
            <Input
              value={fieldLabelInput}
              onChange={(e) => setFieldLabelInput(e.target.value)}
            />
          </div>
        </Space>
      </Modal>
    </Card>
  );
}
