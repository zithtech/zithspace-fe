"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Tag,
  Switch,
  Popconfirm,
  notification,
  Card,
  Space,
  Row,
  Col,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { useTenant } from "@/context/TenantContext";
import { api } from "@/lib/axios";
import dayjs from "dayjs";

const { Option } = Select;

interface Props {
  clientId: string;
  allocations: any[];
  onRefresh: () => void;
}

export default function AllocationsTab({
  clientId,
  allocations,
  onRefresh,
}: Props) {
  const { tenantId } = useTenant();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<
    { label: string; value: string }[]
  >([]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [notify, contextHolder] = notification.useNotification();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await api.get<
          { id: string; first_name: string; last_name: string }[]
        >("/api/clients-v2/employees/select");
        // The API structure might vary, adapting standard assumption
        const employeeOptions = (
          Array.isArray(response) ? response : (response as any).data || []
        ).map((emp: any) => ({
          label:
            `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.id,
          value: emp.id,
        }));
        setEmployees(employeeOptions);
      } catch (err) {
        console.error("Failed to fetch employees", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleAdd = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      };

      const data = await api.post(
        `/api/clients-v2/${clientId}/allocations`,
        payload,
      );
      if (data) {
        notify.success({
          message: "Success",
          description: "Allocation added successfully",
          placement: "top",
        });
        setIsModalOpen(false);
        form.resetFields();
        onRefresh();
      } else {
        notify.error({
          message: "Error",
          description: "Failed to add allocation",
          placement: "top",
        });
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Error",
        description: "Error adding allocation",
        placement: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (allocation: any) => {
    setEditingAllocation(allocation);
    editForm.setFieldsValue({
      employeeId: allocation.employeeId,
      billingType: allocation.billingType,
      billAmount: allocation.billAmount,
      startDate: allocation.startDate ? dayjs(allocation.startDate) : undefined,
      endDate: allocation.endDate ? dayjs(allocation.endDate) : undefined,
    });
    setIsEditModalOpen(true);
  };

  const handleEdit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString(),
      };

      const data = await api.put(
        `/api/clients-v2/allocations/${editingAllocation.id}`,
        payload,
      );
      if (data) {
        notify.success({
          message: "Success",
          description: "Allocation updated successfully",
          placement: "top",
        });
        setIsEditModalOpen(false);
        editForm.resetFields();
        setEditingAllocation(null);
        onRefresh();
      } else {
        notify.error({
          message: "Error",
          description: "Failed to update allocation",
          placement: "top",
        });
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Error",
        description: "Error updating allocation",
        placement: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (recordId: string, checked: boolean) => {
    const newStatus = checked ? "Active" : "Inactive";
    try {
      const data = await api.put(`/api/clients-v2/allocations/${recordId}`, {
        status: newStatus,
      });
      if (data) {
        notify.success({
          message: "Success",
          description: "Status updated successfully",
          placement: "top",
        });
        onRefresh();
      } else {
        notify.error({
          message: "Error",
          description: "Failed to update status",
          placement: "top",
        });
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Error",
        description: "Error updating status",
        placement: "top",
      });
    }
  };

  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_: any, record: any) =>
        record.employee
          ? `${record.employee.first_name} ${record.employee.last_name}`
          : record.employeeId,
    },
    {
      title: "Billing Type",
      dataIndex: "billingType",
      key: "billingType",
    },
    {
      title: "Bill Rate / Amount",
      dataIndex: "billAmount",
      key: "billAmount",
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: any) => {
        const isActive = status === "Active";
        return (
          <Popconfirm
            title={`Make allocation ${isActive ? "Inactive" : "Active"}?`}
            description={`Are you sure you want to change the status to ${isActive ? "Inactive" : "Active"}?`}
            onConfirm={() => handleStatusChange(record.id, !isActive)}
            okText="Yes"
            cancelText="No"
          >
            <Switch
              checked={isActive}
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              style={{
                backgroundColor: isActive ? "#95de64" : "#ff7875",
              }}
            />
          </Popconfirm>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => openEditModal(record)}
        />
      ),
    },
  ];

  const filteredAllocations = allocations.filter((allocation) => {
    const empName = allocation.employee
      ? `${allocation.employee.first_name} ${allocation.employee.last_name}`
      : allocation.employeeId || "";
    return empName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <Card className="premium-card" style={{ height: "60vh" }}>
      {contextHolder}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <p
            style={{ fontSize: 12, fontWeight: 600, margin: 0, color: "grey" }}
          >
            Manage employee allocations, bill rates, and statuses for this
            client.
          </p>
        </div>
        <Space>
          <Input
            placeholder="Search allocations..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Allocation
          </Button>
        </Space>
      </div>
      <Table
        dataSource={filteredAllocations}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <Modal
        className="premium-modal"
        title={
          <Space>
            <SolutionOutlined style={{ color: "#1677ff" }} />
            <span>Add Employee Client Allocation</span>
          </Space>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <div style={{ marginBottom: 16, color: "#666" }}>
          Allocate a new employee to this client with their billing details.
        </div>
        <Divider style={{ margin: "0 0 16px 0" }} />
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employeeId"
                label="Employee"
                rules={[
                  { required: true, message: "Please select an employee" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Select Employee"
                  loading={employees.length === 0}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={employees}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="billingType"
                label="Billing Type"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="T&M">Time & Material (T&M)</Option>
                  <Option value="Fixed Price">Fixed Price</Option>
                  <Option value="Retainer">Retainer</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="billAmount" label="Bill Amount / Rate">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 16, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save Allocation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        className="premium-modal"
        title={
          <Space>
            <SolutionOutlined style={{ color: "#1677ff" }} />
            <span>Edit Employee Client Allocation</span>
          </Space>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingAllocation(null);
        }}
        footer={null}
        width={700}
      >
        <div style={{ marginBottom: 16, color: "#666" }}>
          Update the allocation details for the employee.
        </div>
        <Divider style={{ margin: "0 0 16px 0" }} />
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="employeeId"
                label="Employee"
                rules={[
                  { required: true, message: "Please select an employee" },
                ]}
              >
                <Select
                  showSearch
                  placeholder="Select Employee"
                  loading={employees.length === 0}
                  filterOption={(input, option) =>
                    (option?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={employees}
                  disabled // Usually you don't change the employee after allocation
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="billingType"
                label="Billing Type"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="T&M">Time & Material (T&M)</Option>
                  <Option value="Fixed Price">Fixed Price</Option>
                  <Option value="Retainer">Retainer</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="billAmount" label="Bill Amount / Rate">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Start Date"
                rules={[{ required: true }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginTop: 16, textAlign: "right" }}>
            <Space>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAllocation(null);
                }}
              >
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
