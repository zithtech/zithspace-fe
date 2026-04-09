"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Tag,
  Space,
  Card,
  Typography,
  Tooltip,
  Row,
  Col,
  Divider,
} from "antd";
import type { ColumnType } from "antd/es/table";
import {
  Plus,
  Search,
  Building2,
  Users,
  AlertCircle,
  Zap,
  CheckCircle2,
  Settings2,
  Eye,
  PlusCircle,
  MinusCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api, apiUtils } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";

const { Title, Text } = Typography;

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card 
    bodyStyle={{ padding: "16px 20px" }} 
    style={{ 
      borderRadius: 12, 
      border: "1px solid var(--border-slate-100)", 
      background: "var(--bg-pure-white)",
      height: "100%",
      boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
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

export default function ClientsV2ListPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [highRiskCount, setHighRiskCount] = useState(0);
  const [expandedClientProjects, setExpandedClientProjects] = useState<{
    [key: string]: any[];
  }>({});
  const [expandedLoading, setExpandedLoading] = useState<string | null>(null);

  const fetchClients = async (page = 1, pageSize = 10, search = "") => {
    setLoading(true);
    try {
      const result = await apiUtils.getPaginated("/api/clients-v2", {
        page,
        limit: pageSize,
        search,
      });

      setData(result.data);
      setPagination({
        current: result.pagination.current,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
      });
    } catch (err) {
      console.error("Failed to fetch clients v2", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHighRiskStats = async () => {
    try {
      const result = await apiUtils.getPaginated("/api/clients-v2", {
        page: 1,
        limit: 1,
        riskLevel: "High",
      });
      setHighRiskCount(result.pagination.total);
    } catch (err) {
      console.error("Failed to fetch high risk stats", err);
    }
  };

  const fetchClientProjects = async (clientId: string) => {
    if (expandedClientProjects[clientId]) {
      return;
    }
    setExpandedLoading(clientId);
    try {
      const result = await api.get(`/api/clients-v2/${clientId}/projects`);
      setExpandedClientProjects((prev) => ({
        ...prev,
        [clientId]: (result as any)?.data || result || [],
      }));
    } catch (err) {
      console.error(`Failed to fetch projects for client ${clientId}`, err);
    } finally {
      setExpandedLoading(null);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchClients();
      fetchHighRiskStats();
    }
  }, [tenantId]);

  const handleTableChange = (paginationInfo: any) => {
    fetchClients(paginationInfo.current, paginationInfo.pageSize, searchText);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchClients(1, pagination.pageSize, value);
  };

  const columns: ColumnType<any>[] = [
    {
      title: "Client Entity",
      key: "client",
      width: 280,
      render: (_: any, record: any) => (
        <Space size={12}>
          <div style={{ 
            width: 36, 
            height: 36, 
            borderRadius: 10, 
            background: "var(--bg-blue-50)", 
            color: "var(--text-blue-600)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 14
          }}>
            {record.clientCode?.substring(0, 2).toUpperCase() || "CL"}
          </div>
          <div>
            <Text strong style={{ display: "block", color: "var(--text-slate-900)", fontSize: 14 }}>{record.companyName}</Text>
            <Text type="secondary" style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{record.clientCode} • {record.clientType}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Risk Analysis",
      dataIndex: "riskLevel",
      key: "riskLevel",
      width: 130,
      render: (risk: string) => (
        <Tag
          style={{ borderRadius: 6, fontWeight: 500, border: 0 }}
          color={
            risk === "High" ? "error" : risk === "Medium" ? "warning" : "success"
          }
        >
          {risk?.toUpperCase() || "LOW"}
        </Tag>
      ),
    },
    {
      title: "Business Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag 
          style={{ borderRadius: 20, padding: "0 10px", fontWeight: 600, border: 0 }}
          color={status === "Active" ? "success" : "default"}
        >
          {status?.toUpperCase() || "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<Eye size={18} style={{ color: "var(--text-slate-400)" }} />}
              onClick={() => router.push(`/clients-v2/${record.id}`)}
              className="action-btn"
            />
          </Tooltip>
          <Tooltip title="Edit Configuration">
            <Button
              type="text"
              icon={<Settings2 size={18} style={{ color: "var(--text-slate-400)" }} />}
              onClick={() => router.push(`/clients-v2/create?id=${record.id}`)}
              className="action-btn"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const projectColumns: ColumnType<any>[] = [
    { 
      title: "Project Name", 
      dataIndex: "name", 
      key: "name",
      width: 180,
      render: (text: string) => <Text strong style={{ fontSize: 13 }}>{text}</Text>
    },
    { title: "Code", dataIndex: "code", key: "code", width: 100 },
    {
      title: "Budget Allocation",
      dataIndex: "budget",
      key: "budget",
      width: 140,
      render: (val: number) => (val ? <Text style={{ color: "#059669", fontWeight: 600 }}>${val.toLocaleString()}</Text> : "N/A"),
    },
    {
      title: "Project Manager",
      dataIndex: "projectManager",
      key: "projectManager",
      width: 160,
      render: (pm: any) => (pm ? (
        <Space>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600 }}>
            {pm.name?.charAt(0)}
          </div>
          <Text style={{ fontSize: 13 }}>{pm.name}</Text>
        </Space>
      ) : "N/A"),
    },
  ];

  const expandedRowRender = (record: any) => {
    const projects = expandedClientProjects[record.id];
    const isLoading = expandedLoading === record.id;

    return (
      <div style={{ padding: "0 24px 24px 72px", background: "var(--bg-slate-50)" }}>
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 1, background: "#e2e8e0" }} />
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Active Projects for {record.companyName}
          </Text>
        </div>
        <Table
          columns={projectColumns}
          dataSource={projects || []}
          loading={isLoading}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: "max-content" }}
          className="nested-project-table"
        />
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ 
          margin: "0 -24px", 
          padding: "24px 32px", 
          background: "var(--bg-pure-white)", 
          minHeight: "calc(100vh - 64px)" 
        }}>
        
        {/* Header Section */}
        <Row 
          justify="space-between" 
          align="bottom" 
          gutter={[16, 24]} 
          style={{ marginBottom: 32 }}
        >
          <Col xs={24} lg={14}>
            <Space size={12} align="start">
              <div style={{ 
                background: "var(--bg-blue-50)", 
                padding: 10, 
                borderRadius: 12, 
                color: "var(--text-blue-600)",
                display: "flex"
              }}>
                <Building2 size={24} />
              </div>
              <div>
                <Title level={2} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>Client Management</Title>
                <Text style={{ color: "var(--text-slate-500)", fontSize: 15 }}>Monitor, manage, and configure all client entity profiles and their associated projects.</Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {/* <Input 
                placeholder="Search clients..." 
                prefix={<Search size={16} style={{ color: "#94a3b8" }} />}
                style={{ flex: "1 1 200px", maxWidth: "100%", borderRadius: 10, height: 44 }}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Button 
                type="primary" 
                size="large" 
                icon={<Plus size={18} />} 
                style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
                onClick={() => router.push("/clients-v2/create")}
              >
                Create Client
              </Button> */}
              <Input 
              placeholder="Search clients..." 
              prefix={<Search size={16} style={{ color: "var(--text-slate-400)" }} />}
              style={{ width: 280, borderRadius: 10, height: 44, background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <Button 
              type="primary" 
              size="large" 
              icon={<Plus size={18} />} 
              style={{ borderRadius: 10, height: 44, fontWeight: 600, display: "flex", alignItems: "center" }}
              onClick={() => router.push("/clients-v2/create")}
            >
              Create Client
            </Button>
            </div>
          </Col>
        </Row>

        {/* Metrics Grid */}
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={6}>
            <StatCard 
              label="Total Partners" 
              value={pagination.total} 
              icon={Users} 
              color="#3b82f6" 
            />
          </Col>
          <Col xs={24} sm={6}>
            <StatCard 
              label="Active Accounts" 
              value={data.filter((c) => c.status === "Active").length} 
              icon={CheckCircle2} 
              color="#10b981" 
            />
          </Col>
          <Col xs={24} sm={6}>
            <StatCard 
              label="High Risk Entities" 
              value={highRiskCount} 
              icon={AlertCircle} 
              color="#ef4444" 
            />
          </Col>
          <Col xs={24} sm={6}>
            <StatCard 
              label="Average Projects" 
              value="2.4" 
              icon={Zap} 
              color="#f59e0b" 
            />
          </Col>
        </Row>

        {/* Table Card */}
        <Card 
          bodyStyle={{ padding: 0 }} 
          style={{ borderRadius: 16, border: "1px solid var(--border-slate-100)", background: "var(--bg-pure-white)", overflow: "hidden" }}
        >
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            size="middle"
            scroll={{ x: "max-content" }}
            pagination={{
              ...pagination,
              pageSizeOptions: ["10", "20", "50"],
              showSizeChanger: true,
              position: ["bottomRight"]
            }}
            loading={loading}
            onChange={handleTableChange}
            expandable={{
              expandedRowRender,
              onExpand: (expanded, record) => {
                if (expanded) {
                  fetchClientProjects(record.id);
                }
              },
              expandIcon: ({ expanded, onExpand, record }) =>
                expanded ? (
                  <MinusCircle size={18} style={{ color: "#94a3b8", cursor: "pointer" }} onClick={(e: any) => onExpand(record, e)} />
                ) : (
                  <PlusCircle size={18} style={{ color: "#3b82f6", cursor: "pointer" }} onClick={(e: any) => onExpand(record, e)} />
                ),
            }}
          />
        </Card>

        <style dangerouslySetInnerHTML={{ __html: `
          .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-500) !important;
            font-weight: 600 !important;
            text-transform: uppercase !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          .ant-input:focus, .ant-input-focused {
            border-color: var(--premium-blue) !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
          }
          .nested-project-table .ant-table-thead > tr > th {
            background: transparent !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          @media (max-width: 768px) {
            .expanded-row-container {
              padding: 0 16px 16px 24px !important;
            }
          }
        `}} />
      </div>
    </MainLayout>
    </ProtectedRoute>
  );
}
