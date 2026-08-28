"use client";

import NoData from "@/components/common/NoData";
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
  TrendingUp,
  X,
  Clock,
  Wallet,
} from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { usePermission } from "@/hooks/usePermission";
import { api } from "@/lib/axios";
import dayjs from "dayjs";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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
  const { canUpdateClient } = usePermission();
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
            style={{ backgroundColor: "var(--bg-slate-50)", color: "var(--text-slate-500)", borderRadius: 8 }}
            icon={<User size={16} />}
          >
            {record.employee?.first_name?.[0]}{record.employee?.last_name?.[0]}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: 14 }}>
              {record.employee
                ? `${record.employee.first_name} ${record.employee.last_name}`
                : record.employeeId}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-slate-500)" }}>ID: {record.employeeId?.substring(0, 8)}...</div>
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
          <div style={{ padding: 4, background: "var(--bg-slate-50)", borderRadius: 6, color: "var(--text-slate-500)" }}>
            <TrendingUp size={14} />
          </div>
          <span style={{ fontWeight: 500, color: "var(--text-slate-700)" }}>{type}</span>
        </Space>
      )
    },
    {
      title: "Bill Rate",
      dataIndex: "billAmount",
      key: "billAmount",
      render: (amount: number) => (
        <span style={{ fontWeight: 600, color: "var(--text-slate-900)" }}>
          ${Number(amount || 0).toLocaleString()} <span style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 400 }}>/ month</span>
        </span>
      )
    },
    {
      title: "Duration",
      key: "duration",
      render: (_: any, record: any) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Space size={6} style={{ fontSize: 13, color: "var(--text-slate-700)" }}>
            <Calendar size={14} style={{ color: "var(--text-slate-400)" }} />
            <span>{dayjs(record.startDate).format("MMM DD, YYYY")}</span>
          </Space>
          {record.endDate && (
            <div style={{ fontSize: 11, color: "var(--text-slate-400)", marginLeft: 20 }}>
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
              style={{ backgroundColor: isActive ? "#10b981" : "var(--border-slate-200)" }}
              disabled={!canUpdateClient}
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
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: any) =>
        canUpdateClient && (
          <Button
            type="text"
            className="premium-action-btn"
            icon={<Edit2 size={16} />}
            onClick={() => openEditModal(record)}
            style={{ color: "var(--text-slate-500)" }}
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
      <Card className="ptab-card" styles={{ body: { padding: 0 } }}>
        <div className="ptab-header">
          <div className="ptab-header-left">
            <div className="ptab-header-icon green">
              <Briefcase size={20} />
            </div>
            <div className="ptab-header-titlewrap">
              <div className="ptab-header-title">
                Resource Allocations
                <span className="ptab-header-count">{allocations.length}</span>
              </div>
              <div className="ptab-header-desc">
                Monitor and manage expert resources assigned to this client account
              </div>
            </div>
          </div>
          <div className="ptab-header-right">
            <Input
              placeholder="Search resource..."
              prefix={<Search size={15} style={{ color: "var(--text-slate-400)" }} />}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="ptab-search"
              allowClear
            />
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => setIsModalOpen(true)}
              className="ptab-primary-btn"
            >
              Add Allocation
            </Button>
          </div>
        </div>

        <div className="pp-table-wrap">
        <ZukvoLoadingOverlay loading={loading} message="">
                  <Table
                            dataSource={allocations}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 20, hideOnSinglePage: true }}
                            className="pp-table"
                            scroll={{ x: "max-content" }}
                            locale={{
                              emptyText: <NoData description={(
                                                                    <div className="ptab-empty">
                                                                      <div className="ptab-empty-icon">
                                                                        <Briefcase size={26} />
                                                                      </div>
                                                                      <div className="ptab-empty-title">No allocations yet</div>
                                                                      <div className="ptab-empty-desc">
                                                                        Assign team members, set billing roles and budgets to start tracking work for this client.
                                                                      </div>
                                                                    </div>
                                                                  )} />,
                            }}
                          />
                  </ZukvoLoadingOverlay>
        </div>
      </Card>

      {/* Add Modal */}
      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        title={null}
        width={600}
        centered
        destroyOnClose
        className="pmodal"
        closeIcon={<X size={16} />}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <div className="pmodal-hero green">
            <div className="pmodal-hero-mesh" />
            <div className="pmodal-hero-blob" />
            <div className="pmodal-hero-content">
              <div className="pmodal-hero-icon">
                <Briefcase size={20} />
              </div>
              <div>
                <div className="pmodal-hero-title">New Resource Allocation</div>
                <div className="pmodal-hero-sub">
                  Assign an expert to this client engagement
                </div>
              </div>
            </div>
          </div>

          <div className="pmodal-body">
            <div className="pmodal-section-label">
              <User size={11} />
              <span>Resource</span>
            </div>
            <Form.Item
              name="employeeId"
              label="Expert resource"
              rules={[{ required: true, message: "Resource selection is required" }]}
            >
              <Select
                showSearch
                placeholder="Search by name…"
                loading={employees.length === 0}
                filterOption={(input, option) =>
                  (option?.label ?? "").toString().toLowerCase().includes(input.toLowerCase())
                }
                options={employees}
              />
            </Form.Item>

            <div className="pmodal-section-label">
              <Wallet size={11} />
              <span>Billing</span>
            </div>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="billingType"
                  label="Billing model"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select model">
                    <Option value="T&M">Time &amp; Material (T&amp;M)</Option>
                    <Option value="Fixed Price">Fixed Price</Option>
                    <Option value="Retainer">Retainer</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="billAmount"
                  label="Monthly bill rate"
                >
                  <InputNumber
                    type="number"
                    prefix={<DollarSign size={14} style={{ color: "var(--text-slate-400)" }} />}
                    style={{ width: "100%" }}
                    placeholder="0.00"
                  />
                </Form.Item>
              </Col>
            </Row>

            <div className="pmodal-section-label">
              <Clock size={11} />
              <span>Duration</span>
            </div>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="startDate"
                  label="Start date"
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: "100%" }} placeholder="Select start" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="endDate"
                  label="End date (optional)"
                >
                  <DatePicker style={{ width: "100%" }} placeholder="Select end" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div className="pmodal-footer">
            <span className="pmodal-footer-hint">
              <Briefcase size={12} />
              Allocation will be created in active state
            </span>
            <Button
              onClick={() => setIsModalOpen(false)}
              className="pmodal-btn-cancel"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<Plus size={15} />}
              className="pmodal-btn-primary"
            >
              Create Allocation
            </Button>
          </div>
        </Form>
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
              label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Expert Resource</span>}
            >
              <Select disabled options={employees} style={{ borderRadius: 8, height: 44 }} />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="billingType"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Billing Model</span>}
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
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Bill Rate</span>}
                >
                  <InputNumber prefix={<DollarSign size={14} />} style={{ width: "100%", borderRadius: 8, height: 40, display: "flex", alignItems: "center" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="startDate"
                  label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>Start Date</span>}
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: "100%", borderRadius: 8, height: 40 }} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="endDate" label={<span style={{ fontWeight: 600, fontSize: 12, color: "var(--text-slate-700)" }}>End Date</span>}>
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
        .premium-table .ant-table {
          background: transparent !important;
          color: var(--text-slate-700) !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-500) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 16px 24px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        @media (max-width: 576px) {
          .premium-table .ant-table-thead > tr > th,
          .premium-table .ant-table-tbody > tr > td {
            padding: 12px 16px !important;
          }
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        .premium-table .ant-table-placeholder > td {
          background: transparent !important;
        }
        .premium-action-btn:hover {
          background: var(--bg-slate-50) !important;
          color: #8b5cf6 !important;
        }
        [data-theme="dark"] .premium-action-btn {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .premium-action-btn:hover {
          background: rgba(139, 92, 246, 0.16) !important;
          color: #a78bfa !important;
        }
      `}} />
    </div>
  );
}
