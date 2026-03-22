"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Dropdown,
  Modal,
  message,
  notification,
  Breadcrumb,
} from "antd";
import type { TablePaginationConfig } from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  DeleteOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useTenant } from "@/context/TenantContext";
import MainLayout from "@/components/layout/MainLayout";
import { RecruitmentClientService, RecruitmentClient } from "@/services/recruitmentClient.service";
import ClientDrawer from "./components/ClientDrawer";

const { Title, Text } = Typography;
const { Option } = Select;

export default function RecruitmentClientListPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [data, setData] = useState<RecruitmentClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });


  const [filters, setFilters] = useState({
    search: "",
    industry: undefined as string | undefined,
  });

  const fetchData = async (page = 1, pageSize = 10, currentFilters = filters) => {
    setLoading(true);
    try {
      const result = await RecruitmentClientService.getClients({
        page,
        limit: pageSize,
        ...currentFilters,
      });

      setData(result.data);
      setPagination(prev => ({
        ...prev,
        current: result.pagination.current,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
      }));
    } catch (err) {
      console.error("Failed to fetch recruitment clients", err);
      message.error("Failed to load recruitment clients");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { console.log("data", data) }, [data])

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const handleTableChange = (paginationInfo: TablePaginationConfig) => {
    fetchData(paginationInfo.current || 1, paginationInfo.pageSize || 10);
  };

  const handleSearch = (value: string) => {
    const newFilters = { ...filters, search: value };
    setFilters(newFilters);
    fetchData(1, pagination.pageSize || 10, newFilters);
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchData(1, pagination.pageSize || 10, newFilters);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: "Are you sure you want to delete this client?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await RecruitmentClientService.deleteClient(id);
          notification.success({ message: "Client Deleted Successfully" });
          fetchData(pagination.current || 1, pagination.pageSize || 10);
        } catch (err) {
          message.error("Failed to delete client");
        }
      },
    });
  };

  const handleEdit = (id: string) => {
    setSelectedClientId(id);
    setDrawerOpen(true);
  };

  const handleAdd = () => {
    setSelectedClientId(null);
    setDrawerOpen(true);
  };

  const columns = useMemo(() => [
    {
      title: "Client Name",
      dataIndex: "clientName",
      key: "clientName",
      render: (text: string, record: RecruitmentClient) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#1677ff", cursor: "pointer" }} onClick={() => router.push(`/recruitment-client/view/${record.id}`)}>{text || "N/A"}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.industry || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Industry",
      dataIndex: "industry",
      key: "industry",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Website",
      dataIndex: "website",
      key: "website",
      render: (text: string) => text ? (
        <a href={text.startsWith('http') ? text : `https://${text}`} target="_blank" rel="noopener noreferrer">
          {text.replace(/^https?:\/\//, '')}
        </a>
      ) : "N/A",
    },
    {
      title: "Primary Contact",
      key: "primaryContact",
      render: (_: any, record: RecruitmentClient) => {
        const contact = record.contacts?.[0];
        return contact ? (
          <Space direction="vertical" size={0}>
            <Text>{contact.personName}</Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>{contact.email}</Text>
          </Space>
        ) : "N/A";
      },
    },
    {
      title: "Email",
      dataIndex: "companyEmail",
      key: "companyEmail",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Phone",
      dataIndex: "companyPhone",
      key: "companyPhone",
      render: (text: string) => text || "N/A",
    },
    {
      title: "Location",
      key: "location",
      render: (_: any, record: RecruitmentClient) => (
        <Space>
          <GlobalOutlined style={{ color: "#8c8c8c" }} />
          <Text>{[record.city, record.country].filter(Boolean).join(', ') || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Active Jobs",
      key: "activeJobs",
      align: "center" as const,
      render: () => "0",
    },
    {
      title: "Submissions",
      key: "submissions",
      align: "center" as const,
      render: () => "0",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: boolean) => (
        <Tag color={status ? "green" : "red"}>
          {status ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: RecruitmentClient) => {
        const items = [
          {
            key: "view",
            label: "View Client",
            icon: <EyeOutlined />,
            onClick: () => router.push(`/recruitment-client/view/${record.id}`),
          },
          {
            key: "edit",
            label: "Edit Client",
            icon: <EditOutlined />,
            onClick: () => handleEdit(record.id),
          },
          {
            type: "divider" as const,
          },
          {
            key: "delete",
            label: "Delete Client",
            icon: <DeleteOutlined />,
            danger: true,
            onClick: () => handleDelete(record.id),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ], [router, pagination]);

  return (
    <MainLayout>
      <div style={{ background: "white" }}>
        <div style={{ padding: "24px", background: "#fff", minHeight: "100vh" }}>
          <Breadcrumb style={{ marginBottom: 16 }}>
            <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
            <Breadcrumb.Item>Recruitment Clients</Breadcrumb.Item>
          </Breadcrumb>

          <div style={{
            background: "#fff",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            marginBottom: 24
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
              <div>
                <Title level={2} style={{ margin: 0 }}>Recruitment Clients</Title>
                <Text type="secondary">Manage your recruitment clients, their hiring preferences, and relationships.</Text>
              </div>
              <Space>
                <Button icon={<SearchOutlined />}>Import Client</Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add Client
                </Button>
              </Space>
            </div>

            <Space size="large" style={{ marginBottom: 24, width: '100%', justifyContent: 'flex-start' }} wrap>
              <div style={{ width: 300 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Search</Text>
                <Input.Search
                  placeholder="Search by client name..."
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => !e.target.value && handleSearch("")}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ width: 200 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Industry</Text>
                <Select
                  placeholder="All Industries"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(val) => handleFilterChange('industry', val)}
                >
                  <Option value="Technology">Technology</Option>
                  <Option value="Healthcare">Healthcare</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Manufacturing">Manufacturing</Option>
                  <Option value="Retail">Retail</Option>
                </Select>
              </div>
            </Space>

            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (totalItem) => `Total ${totalItem} clients`,
              }}
              loading={loading}
              onChange={handleTableChange}
              size="middle"
            />
          </div>
        </div>

        <ClientDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          clientId={selectedClientId}
          onSuccess={() => fetchData(pagination.current)}
        />
      </div>
    </MainLayout>
  );
}