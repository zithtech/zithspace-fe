"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Card,
  Typography,
  Tooltip,
  Dropdown,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  MinusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  TeamOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import { api, apiUtils } from "@/lib/axios";
import MainLayout from "@/components/layout/MainLayout";

const { Title, Text } = Typography;

const StatCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) => (
  <Card
    hoverable
    bordered={false}
    style={{
      borderRadius: 8,
      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
      height: "100%",
    }}
    bodyStyle={{ padding: "16px" }}
  >
    <Row align="middle" justify="space-between" wrap={false}>
      <Col>
        <div style={{ color: "#595959", fontSize: 14, fontWeight: 500 }}>
          {title}
        </div>
      </Col>
      <Col>
        <Row align="middle" gutter={12} wrap={false}>
          <Col>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 19,
              }}
            >
              {icon}
            </div>
          </Col>
          <Col>
            <div style={{ fontSize: 22, fontWeight: 600, color: color }}>
              {value}
            </div>
          </Col>
        </Row>
      </Col>
    </Row>
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
        [clientId]: result || [],
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

  const columns = [
    {
      title: "Client Code",
      dataIndex: "clientCode",
      key: "clientCode",
    },
    {
      title: "Company Name",
      dataIndex: "companyName",
      key: "companyName",
    },
    {
      title: "Client Type",
      dataIndex: "clientType",
      key: "clientType",
    },
    {
      title: "Risk Level",
      dataIndex: "riskLevel",
      key: "riskLevel",
      render: (risk: string) => (
        <Tag
          color={
            risk === "High" ? "red" : risk === "Medium" ? "orange" : "green"
          }
        >
          {risk || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Active" ? "green" : "default"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/clients-v2/${record.id}`)}
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => router.push(`/clients-v2/create?id=${record.id}`)}
            ></Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const projectColumns = [
    { title: "Project Name", dataIndex: "name", key: "name" },
    { title: "Project Code", dataIndex: "code", key: "code" },
    {
      title: "Budget",
      dataIndex: "budget",
      key: "budget",
      render: (val: number) => (val ? `$${val.toLocaleString()}` : "N/A"),
    },
    {
      title: "Outstanding",
      dataIndex: "outstanding",
      key: "outstanding",
      render: () => "N/A",
    },
    {
      title: "Manager",
      dataIndex: "projectManager",
      key: "projectManager",
      render: (pm: any) => (pm ? pm.name : "N/A"),
    },
  ];

  const expandedRowRender = (record: any) => {
    const projects = expandedClientProjects[record.id];
    const isLoading = expandedLoading === record.id;

    return (
      <Card style={{ margin: "10px 0" }}>
        {/* <Title level={5}>Projects for {record.companyName}</Title> */}
        <Table
          columns={projectColumns}
          dataSource={projects}
          loading={isLoading}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  return (
    <MainLayout>
      <div
        style={{
          padding: "24px",
          height: "calc(100vh - 100px)",
          overflowY: "auto",
        }}
      >
        {/* <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <TeamOutlined style={{ fontSize: 32, color: "#1677ff" }} />
            <div>
              <Title level={3} style={{ margin: 0 }}>
                Client Management
              </Title>
              <Text type="secondary">
                View, search, and manage all client profiles in the system.
              </Text>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push("/clients-v2/create")}
          >
            Create Client
          </Button>
        </div>

        <Row gutter={[24, 16]} align="stretch" style={{ marginBottom: 24 }}>
          <Col xs={24} md={8} lg={6}>
            <StatCard
              title="Total Clients"
              value={pagination.total}
              icon={<UserOutlined />}
              color="#1890ff"
            />
          </Col>
          <Col xs={24} md={8} lg={6}>
            <StatCard
              title="High Risk Companies"
              value={highRiskCount}
              icon={<WarningOutlined />}
              color="#ff4d4f"
            />
          </Col>
          <Col xs={24} md={8} lg={12}>
            <Card
              bordered={false}
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              bodyStyle={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Input.Search
                placeholder="Search clients by name or code..."
                allowClear
                onSearch={handleSearch}
                style={{ width: "100%", maxWidth: 400 }}
              />
            </Card>
          </Col>
        </Row> */}

        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space align="center" size="middle">
              <TeamOutlined style={{ fontSize: 24, color: "inherit" }} />
              <Title level={3} style={{ margin: 0 }}>
                Client Management
              </Title>
            </Space>
            <Space>
              <Input.Search
                placeholder="Search clients by name or code..."
                allowClear
                onSearch={handleSearch}
                style={{ width: 300 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push("/clients-v2/create")}
              >
                Create Client
              </Button>
            </Space>
          </div>
          <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            View, search, and manage all client profiles in the system.
          </Text>
          <Space style={{ marginTop: 8 }}>
            <Tag icon={<UserOutlined />} color="blue">
              Total Clients: {pagination.total}
            </Tag>
            <Tag icon={<WarningOutlined />} color="red">
              High Risk Companies: {highRiskCount}
            </Tag>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={pagination}
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
                <MinusOutlined onClick={(e) => onExpand(record, e)} />
              ) : (
                <PlusOutlined onClick={(e) => onExpand(record, e)} />
              ),
          }}
        />
      </div>
    </MainLayout>
  );
}
