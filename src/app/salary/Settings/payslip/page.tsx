"use client";

import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Row,
  Col,
  InputNumber,
  DatePicker,
  Divider
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { usePermission } from "@/hooks/usePermission";
import dayjs from "dayjs";

interface PayslipField {
  id: number;
  label: string;
  value: any;
  // isDefault?: boolean;
  type: "text" | "number" | "date" | "dropdown";
  options?: string[]; // dropdown ku
}

const { Title, Text } = Typography;

export default function PayslipSettings() {
  const { canManageSalary } = usePermission();
  
  const [fields, setFields] = useState<PayslipField[]>([
    {
      id: 1,
      label: "Payslip Date",
      value: dayjs("2026-01-13"),
      type: "date",
      // isDefault: true,
    },
    {
      id: 2,
      label: "Reference Number",
      value: "PAY-MKCHOCK",
      type: "text",
    },
    {
      id: 3,
      label: "Payroll Cycle",
      value: "Bi-Weekly",
      type: "dropdown",
      options: ["Weekly", "Bi-Weekly", "Monthly"],
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [editField, setEditField] = useState<PayslipField | null>(null);
  const [editForm] = Form.useForm();

  const handleAddField = () => {
    form.validateFields().then((values) => {
      setFields([
        ...fields,
        {
          id: Date.now(),
          label: values.name,
          value: values.defaultValue || "-",
          type: values.type,
        },
      ]);
      form.resetFields();
      setIsModalOpen(false);
    });
  };

  const handleDeleteField = (id: number) => {
    setFields((prev) => prev.filter((field) => field.id !== id));
  };

  const renderInputByType = (field: PayslipField) => {
    switch (field.type) {
      case "date":
        return <DatePicker style={{ width: "100%" }} />;

      case "number":
        return <InputNumber style={{ width: "100%" }} />;

      case "dropdown":
        return (
          <Select
            options={field.options?.map((o) => ({
              label: o,
              value: o,
            }))}
          />
        );

      default:
        return <Input />;
    }
  };

  return (
    <>
      
        {/* Header */}

        {/* Payslip Fields Card */}
        <Card>
  {/* HEADER */}
  <Space style={{ width: "100%", justifyContent: "space-between" }}>
    <div>
      <Title level={4} style={{ margin: 0 }}>
        Payslip Base Configuration
      </Title>
      <Text type="secondary">
        Configure payslip fields with add, edit, and delete functionality
      </Text>
    </div>

    <Space>
      {canManageSalary && (
        <>
          <Button
            icon={<CheckOutlined />}
            onClick={() => console.log("Save payslip settings")}
          >
            Save Payslip Details
          </Button>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Field
          </Button>
        </>
      )}
    </Space>
  </Space>

  <Divider style={{ margin: "12px 0" }} />

  {/* FIELDS */}
  <Row gutter={[16, 16]}>
    {fields.map((field) => (
      <Col key={field.id} xs={24} sm={12} md={8}>
        <Card
          bordered
          bodyStyle={{ padding: 16 }}
          style={{ border: "1px solid #aba9a9" }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 6,
                height: "100%",
                backgroundColor: "#1677ff",
                borderRadius: 4,
                marginRight: 16,
              }}
            />
            <div style={{ flex: 1 }}>
              <Text strong>{field.label}</Text>
              <div>
                <Text type="secondary">
                  {field.type === "date"
                    ? dayjs(field.value).format("DD MMM YYYY")
                    : field.value}
                </Text>
              </div>
            </div>

            {canManageSalary && (
              <Space>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditField(field);
                    editForm.setFieldsValue({
                      label: field.label,
                      value: field.value,
                    });
                  }}
                />
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteField(field.id)}
                />
              </Space>
            )}
          </div>
        </Card>
      </Col>
    ))}
  </Row>
</Card>

      
      {/* Add Field Modal */}
      <Modal
        title="Add New Field"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleAddField}
        okText="Add Field"
      >
        <Text type="secondary">Create a new field to appear on payslips</Text>

        <Form layout="vertical" form={form} style={{ marginTop: 16 }}>
          <Form.Item
            label="Field Name"
            name="name"
            rules={[{ required: true, message: "Please enter field name" }]}
          >
            <Input placeholder="e.g. Department, Location" />
          </Form.Item>

          <Form.Item label="Field Type" name="type" initialValue="text">
            <Select
              options={[
                { value: "text", label: "Text" },
                { value: "number", label: "Number" },
                { value: "date", label: "Date" },
              ]}
            />
          </Form.Item>

          <Form.Item label="Default Value (Optional)" name="defaultValue">
            <Input placeholder="Enter default value" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Field"
        open={!!editField}
        onCancel={() => setEditField(null)}
        onOk={() => {
          editForm.validateFields().then((values) => {
            setFields((prev) =>
              prev.map((f) =>
                f.id === editField?.id ? { ...f, ...values } : f,
              ),
            );
            setEditField(null);
          });
        }}
      >
        <Text type="secondary">Update the field configuration</Text>

        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Field Name" name="label">
            <Input />
          </Form.Item>

          <Form.Item
            label={editField?.type === "date" ? "Date" : "Value"}
            name="value"
          >
            {editField && renderInputByType(editField)}
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
