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
  Tooltip,
  Dropdown,
  notification,
  Breadcrumb,
  App,
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
import { ImplementationPartnerService, ImplementationPartner } from "@/services/implementationPartner.service";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ImplementationPartnerListPage() {
  const { tenantId } = useTenant();
  const router = useRouter();
  const { modal, notification: antdNotification } = App.useApp();
  const [data, setData] = useState<ImplementationPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    industry: undefined as string | undefined,
    status: undefined as string | undefined,
  });

  const fetchData = async (page = 1, pageSize = 10, currentFilters = filters) => {
    setLoading(true);
    try {
      const result = await ImplementationPartnerService.getPartners({
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
      console.error("Failed to fetch implementation partners", err);
      antdNotification.error({ message: "Failed to load implementation partners" });
    } finally {
      setLoading(false);
    }
  };

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
    modal.confirm({
      title: "Are you sure you want to delete this partner?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await ImplementationPartnerService.deletePartner(id);
          antdNotification.success({ message: "Partner Deleted Successfully" });
          fetchData(pagination.current || 1, pagination.pageSize || 10);
        } catch (err) {
          antdNotification.error({ message: "Failed to delete partner" });
        }
      },
    });
  };

  const columns = useMemo(() => [
    {
      title: "Partner Name",
      dataIndex: "companyName",
      key: "companyName",
      render: (text: string, record: ImplementationPartner) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: "#1677ff" }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.industry || "N/A"}</Text>
        </Space>
      ),
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
      render: (_: any, record: ImplementationPartner) => {
        const contact = record.contactPersons?.[0];
        return contact ? (
          <Space direction="vertical" size={0}>
            <Text>{contact.personName}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{contact.email}</Text>
          </Space>
        ) : "N/A";
      },
    },
    {
      title: "Location",
      key: "location",
      render: (_: any, record: ImplementationPartner) => (
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
      title: "Vendors",
      key: "vendors",
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
      render: (_: any, record: ImplementationPartner) => {
        const items = [
          {
            key: "view",
            label: "View Partner",
            icon: <EyeOutlined />,
          },
          {
            key: "edit",
            label: "Edit Partner",
            icon: <EditOutlined />,
          },
          {
            type: "divider" as const,
          },
          {
            key: "delete",
            label: "Delete Partner",
            icon: <DeleteOutlined />,
            danger: true,
          },
        ];

        const handleMenuClick = ({ key }: { key: string }) => {
          if (key === "view") router.push(`/implementation-partner/view/${record.id}`);
          else if (key === "edit") router.push(`/implementation-partner/edit/${record.id}`);
          else if (key === "delete") handleDelete(record.id);
        };

        return (
          <Dropdown menu={{ items, onClick: handleMenuClick }} trigger={["click"]}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        );
      },
    },
  ], [router, pagination]);

  return (
    <MainLayout>
      <App>
        <div style={{ background: "#ffffff", minHeight: "100vh", padding: "24px" }}>
          <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
            <Breadcrumb style={{ marginBottom: 16, fontSize: "12px" }}>
              <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
              <Breadcrumb.Item>Implementation Partners</Breadcrumb.Item>
            </Breadcrumb>

            <div style={{
              background: "#ffffff",
              padding: "24px",
              borderRadius: "8px",
              border: "1px solid #f0f0f0",
              marginBottom: 24
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
                <div>
                  <Title level={4} style={{ margin: 0, fontWeight: 600 }}>Implementation Partners</Title>
                  <Text type="secondary" style={{ fontSize: "13px" }}>Manage your technical and business relationships with implementation partners.</Text>
                </div>
                <Space>
                  <Button icon={<SearchOutlined />}>Import</Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => router.push("/implementation-partner/create")}
                    style={{ borderRadius: "6px" }}
                  >
                    Add Partner
                  </Button>
                </Space>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                marginBottom: 24, 
                padding: '16px', 
                background: '#fafafa', 
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
              }}>
                <div style={{ flex: 1 }}>
                  <Input
                    placeholder="Search by partner name..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    allowClear
                    onSearch={handleSearch}
                    onChange={(e) => !e.target.value && handleSearch("")}
                    style={{ borderRadius: '6px' }}
                  />
                </div>
                <Select
                  placeholder="All Industries"
                  style={{ width: 200 }}
                  allowClear
                  onChange={(val) => handleFilterChange('industry', val)}
                >
                  <Option value="Technology">Technology</Option>
                  <Option value="Healthcare">Healthcare</Option>
                  <Option value="Finance">Finance</Option>
                  <Option value="Manufacturing">Manufacturing</Option>
                  <Option value="Retail">Retail</Option>
                </Select>
                <Select
                  placeholder="Status"
                  style={{ width: 150 }}
                  allowClear
                  onChange={(val) => handleFilterChange('status', val)}
                >
                  <Option value="true">Active</Option>
                  <Option value="false">Inactive</Option>
                </Select>
              </div>

              <Table
                columns={columns}
                dataSource={data}
                rowKey="id"
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showTotal: (totalItem) => `Total ${totalItem} partners`,
                }}
                loading={loading}
                onChange={handleTableChange}
                size="middle"
                className="premium-table"
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>
      </App>
    </MainLayout>
  );
}