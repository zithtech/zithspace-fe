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
  Avatar,
  Tooltip,
} from "antd";
import {
  Plus,
  Edit2,
  Search,
  User,
  Calendar,
  DollarSign,
  Briefcase,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
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
          message: "Allocation Successful",
          description: "Resource has been successfully allocated to the client.",
          placement: "top",
        });
        setIsModalOpen(false);
        form.resetFields();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Allocation Failed",
        description: "An error occurred while creating the allocation.",
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
          message: "Allocation Updated",
          description: "Resource allocation details have been modified.",
          placement: "top",
        });
        setIsEditModalOpen(false);
        editForm.resetFields();
        setEditingAllocation(null);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Update Failed",
        description: "Failed to update allocation details.",
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
          message: "Status Updated",
          description: `Allocation is now ${newStatus}.`,
          placement: "top",
        });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      notify.error({
        message: "Update Failed",
        description: "Failed to change allocation status.",
        placement: "top",
      });
    }
  };

  const columns = [
    {
      title: "Allocated Resource",
      key: "employee",
      render: (_: any, record: any) => (
        <Space size={12}>
          <Avatar
            shape="square"
            style={{ backgroundColor: "#f8fafc", color: "#64748b", borderRadius: 8 }}
            icon={<User size={16} />}
          >
            {record.employee?.first_name?.[0]}{record.employee?.last_name?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
              {record.employee
                ? `${record.employee.first_name} ${record.employee.last_name}`
                : record.employeeId}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>ID: {record.employeeId?.substring(0, 8)}...</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Billing Model",
      dataIndex: "billingType",
      key: "billingType",
      render: (type: string) => (
        <Space size={6}>
          <div style={{ padding: 4, background: "#f1f5f9", borderRadius: 6, color: "#64748b" }}>
            <TrendingUp size={14} />
          </div>
          <span style={{ fontWeight: 500, color: "#475569" }}>{type}</span>
        </Space>
      )
    },
    {
      title: "Bill Rate",
      dataIndex: "billAmount",
      key: "billAmount",
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: "#0f172a" }}>
          ${Number(amount || 0).toLocaleString()} <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>/ month</span>
        </span>
      )
    },
    {
      title: "Duration",
      key: "duration",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Space size={6} style={{ fontSize: 13, color: "#475569" }}>
            <Calendar size={14} style={{ color: "#94a3b8" }} />
            <span>{dayjs(record.startDate).format("MMM DD, YYYY")}</span>
          </Space>
          {record.endDate && (
            <div style={{ fontSize: 11, color: "#94a3b8", marginLeft: 20 }}>
              to {dayjs(record.endDate).format("MMM DD, YYYY")}
            </div>
          )}
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: any) => {
        const isActive = status === "Active";
        return (
          <Space size={12}>
            <Switch
              size="small"
              checked={isActive}
              onChange={(checked) => handleStatusChange(record.id, checked)}
              style={{ backgroundColor: isActive ? "#10b981" : "#cbd5e1" }}
            />
            <Tag
              style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}
              color={isActive ? "success" : "default"}
            >
              {status?.toUpperCase()}
            </Tag>
          </Space>
        );
      },
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Button
          type="text"
          className="premium-action-btn"
          icon={<Edit2 size={16} />}
          onClick={() => openEditModal(record)}
          style={{ color: "#64748b" }}
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
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid #f1f5f9",
          background: "#fff"
        }}
        bodyStyle={{ padding: "0" }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>Resource Allocations</div>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Monitor and manage expert resources assigned to this client account</div>
              </div>
            </Col>
              <Col xs={24} md={10}>
              <Row gutter={[12, 12]} justify="end">
                <Col xs={24} sm={16} md={12} lg={14}>
                  <Input
                    placeholder="Search resource..."
                    prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ borderRadius: 10, width: "100%", height: 40 }}
                  />
                </Col>
                <Col xs={24} sm={8} md={12} lg={10}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<Plus size={18} />}
                    onClick={() => setIsModalOpen(true)}
                    style={{ borderRadius: 10, height: 40, fontWeight: 600, display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}
                  >
                    Add Allocation
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </div>

        <Table
          dataSource={filteredAllocations}
          columns={columns}
          rowKey="id"
          pagination={false}
          className="premium-table"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: <div style={{ padding: "40px 0", color: "#64748b" }}>No resource allocations found</div> }}
        />
      </Card>

      {/* Add Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#eff6ff", padding: 8, borderRadius: 8, color: "#3b82f6", display: "flex" }}>
              <Briefcase size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>New Resource Allocation</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={600}
        centered
        destroyOnClose
        className="premium-modal"
      >
        <div style={{ padding: "8px 0" }}>
          <Form form={form} layout="vertical" onFinish={handleAdd}>
            <Form.Item
              name="employeeId"
              label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Select Expert Resource</span>}
              rules={[{ required: true, message: "Resource selection is required" }]}
            >
              <Select
                showSearch
                placeholder="Search by name..."
                loading={employees.length === 0}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={employees}
                style={{ borderRadius: 8, height: 44 }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="billingType"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Billing Model</span>}
                  rules={[{ required: true }]}
                >
                  <Select style={{ borderRadius: 8, height: 40 }}>
                    <Option value="T&M">Time & Material (T&M)</Option>
                    <Option value="Fixed Price">Fixed Price</Option>
                    <Option value="Retainer">Retainer</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="billAmount"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Monthly Bill Rate</span>}
                >
                  <InputNumber
                    type="number"
                    prefix={<DollarSign size={14} style={{ color: "#94a3b8" }} />}
                    style={{ width: "100%", borderRadius: 8, height: 40, display: "flex", alignItems: "center" }}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="startDate"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Allocation Start</span>}
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="endDate"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>End Date (Optional)</span>}
                >
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button
                onClick={() => setIsModalOpen(false)}
                style={{ borderRadius: 8, height: 40, fontWeight: 500 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ borderRadius: 8, height: 40, fontWeight: 600, padding: "0 24px" }}
              >
                Create Allocation
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#f0f9ff", padding: 8, borderRadius: 8, color: "#0ea5e9", display: "flex" }}>
              <Edit2 size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18 }}>Modify Allocation</span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingAllocation(null);
        }}
        footer={null}
        width={600}
        centered
        className="premium-modal"
      >
        <div style={{ padding: "8px 0" }}>
          <Form form={editForm} layout="vertical" onFinish={handleEdit}>
            <Form.Item
              name="employeeId"
              label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Expert Resource</span>}
            >
              <Select disabled options={employees} style={{ borderRadius: 8, height: 44 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="billingType"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Billing Model</span>}
                  rules={[{ required: true }]}
                >
                  <Select style={{ borderRadius: 8, height: 40 }}>
                    <Option value="T&M">Time & Material (T&M)</Option>
                    <Option value="Fixed Price">Fixed Price</Option>
                    <Option value="Retainer">Retainer</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="billAmount"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Bill Rate</span>}
                >
                  <InputNumber prefix={<DollarSign size={14} />} style={{ width: "100%", borderRadius: 8, height: 40, display: "flex", alignItems: "center" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="startDate"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>Start Date</span>}
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="endDate" label={<span style={{ fontWeight: 600, fontSize: 12, color: "#475569" }}>End Date</span>}>
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingAllocation(null);
                }}
                style={{ borderRadius: 8, height: 40 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{ borderRadius: 8, height: 40, fontWeight: 600, padding: "0 24px" }}
              >
                Save Changes
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 16px 24px !important;
          border-bottom: 1px solid #f1f5f9 !important;
          white-space: nowrap !important;
        }
        @media (max-width: 576px) {
          .premium-table .ant-table-thead > tr > th,
          .premium-table .ant-table-tbody > tr > td {
            padding: 12px 16px !important;
          }
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid #f1f5f9 !important;
        }
        .premium-action-btn:hover {
          background: #f1f5f9 !important;
          color: #3b82f6 !important;
        }
      `}} />
    </div>
  );
}
