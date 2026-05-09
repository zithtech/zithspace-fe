"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Space,
  Input,
  Button,
  message,
  Spin,
  Card,
  Typography,
  Switch,
  Dropdown,
  Popconfirm,
  Row,
  Col,
} from "antd";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MoreVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";

const { Text, Title } = Typography;

/* ---------------- HELPERS ---------------- */

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card
    styles={{ body: { padding: "16px 20px" } }}
    style={{
      borderRadius: 12,
      border: "1px solid var(--border-slate-100)",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      background: "var(--bg-pure-white)"
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Text style={{ color: "var(--text-slate-500)", fontSize: 13, fontWeight: 500 }}>{label}</Text>
        <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-slate-900)", marginTop: 4 }}>{value}</div>
      </div>
      <div style={{ color: color, background: `${color}15`, padding: 10, borderRadius: 12 }}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

/* ---------------- MAIN COMPONENT ---------------- */

const Onboarded = () => {
  const { isLoading: authLoading } = useAuth();
  const { canReadOnboarded } = usePermission();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !canReadOnboarded) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadOnboarded, router]);

  // ✅ Fetch All Employees
  const fetchEmployees = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await EmployeeOnboardingService.getAllEmployees();
      let employees = [];

      if (res?.data?.success) {
        employees = res.data.data || [];
      } else if (res?.success) {
        employees = res.data || [];
      } else if (Array.isArray(res?.data)) {
        employees = res.data;
      } else if (Array.isArray(res)) {
        employees = res;
      }

      setData(employees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      message.error("Failed to fetch employees");
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadOnboarded) {
      fetchEmployees();
    }
  }, [canReadOnboarded]);

  // ✅ Status Toggle
  const handleStatusChange = async (id: string, checked: boolean) => {
    try {
      await EmployeeOnboardingService.updateEmployee(id, { status: checked });
      setData(prev => prev.map(item => item.id === id ? { ...item, status: checked } : item));
      message.success(`Employee ${checked ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  // ✅ Delete Employee
  const handleDelete = async (id: string) => {
    try {
      const res = await EmployeeOnboardingService.deleteEmployee(id);
      const success = res?.data?.success || res?.success || res?.status === 200;

      if (success) {
        message.success("Employee removed successfully");
        setData(prev => prev.filter(e => e.id !== id));
      } else {
        message.error("Failed to delete employee");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      message.error("Failed to remove employee");
    }
  };

  // ✅ Filter Employees
  const filteredData = data.filter((e: any) => {
    const personal = e.personal || e;
    const fullName = `${personal.firstName || ""} ${personal.lastName || ""}`.toLowerCase();
    const code = (e.employee_code || "").toLowerCase();
    return fullName.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  const activeCount = data.filter((item: any) => item.status).length;
  const totalCount = data.length;

  // ✅ Table Columns
  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_: any, record: any) => {
        const personal = record.personal || record;
        const firstName = personal.firstName || "";
        const lastName = personal.lastName || "";
        return (
          <Space size={12}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: '#f0f4ff',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: 14,
              border: '1px solid #e0e7ff'
            }}>
              {firstName?.[0]?.toUpperCase()}{lastName?.[0]?.toUpperCase()}
            </div>
            <div>
              <Text strong style={{ display: 'block', color: '#1e293b', fontSize: 14 }}>
                {firstName} {lastName}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{record.employee_code || "No Code"}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Contact Details",
      key: "contact",
      render: (_: any, record: any) => {
        const personal = record.personal || record;
        return (
          <div>
            <div style={{ fontSize: 13, color: "#475569" }}>{personal.workEmail || personal.personalEmail || "N/A"}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{personal.mobile || personal.phone || "N/A"}</div>
          </div>
        );
      }
    },
    {
      title: "Designation",
      key: "designation",
      render: (_: any, record: any) => {
        const employment = record.employment || record;
        return (
          <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500 }}>
            {employment.designation || employment.position?.title || "Staff"}
          </Tag>
        );
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: boolean, record: any) => (
        <Switch
          size="small"
          checked={status}
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'View Details',
                icon: <Eye size={14} />,
                onClick: () => router.push(`/onboarding/onboarded/${record.id}`)
              },
              {
                key: 'edit',
                label: 'Edit Info',
                icon: <Edit2 size={14} />,
                onClick: () => router.push(`/onboarding/create?id=${record.id}`)
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                label: 'Delete Record',
                icon: <Trash2 size={14} />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === 'delete') {
                // Popconfirm used via separate trigger for better UX
              }
            }
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreVertical size={18} style={{ color: "#64748b" }} />} />
        </Dropdown>
      ),
    },
  ];

  // Overriding action column for Delete specifically to use Popconfirm
  const actionColumn = columns.find(c => c.key === 'action');
  if (actionColumn) {
    actionColumn.render = (_: any, record: any) => (
      <Space size={0}>
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: 'View Details',
                icon: <Eye size={14} />,
                onClick: () => router.push(`/onboarding/onboarded/${record.id}`)
              },
              {
                key: 'edit',
                label: 'Edit Info',
                icon: <Edit2 size={14} />,
                onClick: () => router.push(`/onboarding/create?id=${record.id}`)
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                label: (
                  <Popconfirm
                    title="Delete this record?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDelete(record.id)}
                    okText="Delete"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <span style={{ color: '#ff4d4f', display: 'block', width: '100%' }}>Delete Record</span>
                  </Popconfirm>
                ),
                icon: <Trash2 size={14} color="#ff4d4f" />,
              },
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreVertical size={18} style={{ color: "#64748b" }} />} />
        </Dropdown>
      </Space>
    );
  }

  if (authLoading || !canReadOnboarded) return null;

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <Space size={12} align="center">
            <div style={{
              background: "#eff6ff",
              padding: 10,
              borderRadius: 12,
              color: "#3b82f6",
              display: "flex"
            }}>
              <Users size={24} />
            </div>
            <div>
              <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Onboarded Members</Title>
              <Text style={{ color: "#64748b", fontSize: 15 }}>Manage and review employees who have successfully onboarded.</Text>
            </div>
          </Space>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Input
            placeholder="Search employees..."
            prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
            style={{ width: 280, borderRadius: 10, height: 44 }}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            type="primary"
            size="large"
            icon={<Plus size={18} />}
            style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center", background: "#3b82f6", border: "none" }}
            onClick={() => router.push("/onboarding/create")}
          >
            Hire Employee
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} sm={6}>
          <StatCard label="Total Employees" value={totalCount} icon={Users} color="#3b82f6" />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard label="Active" value={activeCount} icon={CheckCircle2} color="#10b981" />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard label="Inactive" value={totalCount - activeCount} icon={Clock} color="#f59e0b" />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard label="Verified" value="100%" icon={ShieldCheck} color="#8b5cf6" />
        </Col>
      </Row>

      {/* Table */}
      <Card
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: 16, border: "1px solid #ebedef", overflow: "hidden", background: "#fff" }}
      >
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 12, position: ["bottomRight"] }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default function OnboardedPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Onboarded />
      </MainLayout>
    </ProtectedRoute>
  );
}
