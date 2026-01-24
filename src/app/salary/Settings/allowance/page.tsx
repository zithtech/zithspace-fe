"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Table,
  Button,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Space,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

import { fetchAllowances } from "@/services/salarySettings.service";

const { Title, Text } = Typography;

type Allowance = {
  id: number;
  name: string;
  amount: number;
  ytd: number;
};

const AllowanceSettings = () => {
  useEffect(() => {
    fetchAllowances().then(setData);
  }, []);

  const [data, setData] = useState<Allowance[]>([]);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form] = Form.useForm();

  /* OPEN ADD MODAL */
  const openAdd = () => {
    setMode("add");
    form.resetFields();
    setOpen(true);
  };

  /* OPEN EDIT MODAL */
  const openEdit = (record: Allowance) => {
    setMode("edit");
    setEditingId(record.id);
    form.setFieldsValue(record);
    setOpen(true);
  };

  /* SAVE (ADD / EDIT) */
  const handleSubmit = (values: any) => {
    if (mode === "add") {
      setData((prev) => [
        ...prev,
        {
          id: Date.now(),
          ...values,
        },
      ]);
    } else {
      setData((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...values } : item,
        ),
      );
    }

    setOpen(false);
    setEditingId(null);
    form.resetFields();
  };

  /* DELETE */
  const handleDelete = (id: number) => {
    setData((prev) => prev.filter((item) => item.id !== id));
  };

  const columns = [
    {
      title: "Allowance Name",
      dataIndex: "name",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      render: (v: number) => `₹ ${v}`,
    },
    {
      title: "YTD",
      dataIndex: "ytd",
      render: (v: number) => `₹ ${v}`,
    },
    {
      title: "Action",
      align: "center" as const,
      render: (_: any, record: Allowance) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this allowance?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card style={{ marginTop: 16 }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Allowance Details
          </Title>
          <Text type="secondary">Manage monthly allowances</Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAdd}
          style={{
            borderRadius: 20,
            padding: "0 18px",
            fontWeight: 600,
          }}
        >
          Add Allowance
        </Button>
      </div>

      {/* TABLE */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        bordered
        size="small"
      />

      {/* ADD / EDIT MODAL */}
      <Modal
        open={open}
        title={mode === "add" ? "Add Allowance" : "Edit Allowance"}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText={mode === "add" ? "Save" : "Update"}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Allowance Name"
            name="name"
            rules={[{ required: true, message: "Allowance name is required" }]}
          >
            <Input placeholder="e.g. House Rent Allowance" />
          </Form.Item>

          <Form.Item
            label="Monthly Amount"
            name="amount"
            rules={[{ required: true, message: "Amount is required" }]}
          >
            <InputNumber style={{ width: "100%" }} placeholder="Enter amount" />
          </Form.Item>

          <Form.Item
            label="Year To Date (YTD)"
            name="ytd"
            rules={[{ required: true, message: "YTD amount is required" }]}
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Enter YTD amount"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
    
  );
};

export default AllowanceSettings;
