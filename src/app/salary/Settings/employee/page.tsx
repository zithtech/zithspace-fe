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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  CheckOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { PreviewType } from "@/types/salary";

interface Props {
  onPreview: (type: Exclude<PreviewType, null>, data: any) => void;
}

const { Title, Text } = Typography;

type Field = {
  key: string;
  label: string;
  show: boolean;
};

const initialFields: Field[] = [
  { key: "Employee Name", label: "name", show: true },
  { key: "Employee ID", label: "id", show: true },
  { key: "Department", label: "department", show: true },
  { key: "Designation", label: "designation", show: true },
  { key: "Date of Joining", label: "DOJ", show: true },
  { key: "Bank Account", label: "bank", show: false },
  { key: "PAN Number", label: "pan", show: false },
];

export default function EmployeeSettings({ onPreview }: Props) {
  const [fields, setFields] = useState<Field[]>(initialFields);

  // modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  // form
  const [systemName, setSystemName] = useState("");
  const [displayName, setDisplayName] = useState("");

  const toggleShow = (key: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, show: !f.show } : f))
    );
  };

  const openAdd = () => {
    setEditingField(null);
    setSystemName("");
    setDisplayName("");
    setIsModalOpen(true);
  };

  const openEdit = (field: Field) => {
    setEditingField(field);
    setSystemName(field.key);
    setDisplayName(field.label);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!systemName.trim()) return;

    if (editingField) {
      // EDIT
      setFields((prev) =>
        prev.map((f) =>
          f.key === editingField.key
            ? { ...f, label: displayName || systemName }
            : f
        )
      );
    } else {
      // ADD
      setFields((prev) => [
        ...prev,
        {
          key: systemName,
          label: displayName || systemName,
          show: true,
        },
      ]);
    }

    setIsModalOpen(false);
    setEditingField(null);
    setSystemName("");
    setDisplayName("");
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%", padding: 5 }}>
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
            <Button
              icon={<EyeOutlined />}
              onClick={() =>
                onPreview(
                  "employee",
                  fields.filter((f) => f.show)
                )
              }
            >
              Preview
            </Button>

            <Button icon={<CheckOutlined />}>Save</Button>

            <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
              Add Custom Field
            </Button>
          </Space>
        </Space>

        <Divider style={{ margin: "12px 0" }} />

        {/* FIELDS */}
        <Row gutter={[16, 12]}>
          {fields.map((field) => (
            <Col key={field.key} xs={24} sm={12} md={8}>
              <Card
                bordered
                bodyStyle={{ padding: 12 }}
                style={{ border: "1px solid #b1adad" }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <Text strong>{field.key}</Text>
                    <div>
                      <Text type="secondary">
                        Display: {field.label}
                      </Text>
                    </div>
                  </div>

                  <Space>
                    <EditOutlined
                      style={{ color: "#1677ff", cursor: "pointer" }}
                      onClick={() => openEdit(field)}
                    />
                    <Text>Show</Text>
                    <Switch
                      checked={field.show}
                      onChange={() => toggleShow(field.key)}
                    />
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
          onOk={handleSave}
          okText={editingField ? "Update Field" : "Add Field"}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            <div>
              <Text strong>Field Name (System)</Text>
              <Input
                value={systemName}
                onChange={(e) => setSystemName(e.target.value)}
                disabled={!!editingField}
              />
            </div>

            <div>
              <Text strong>Display Name (Payslip)</Text>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          </Space>
        </Modal>
      </Card>
    </Space>
  );
}
