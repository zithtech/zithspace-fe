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
import { VendorService, Vendor } from "@/services/vendor.service";

const { Title, Text } = Typography;
const { Option } = Select;

export default function VendorListPage() {
  const router = useRouter();
  const { tenantId } = useTenant();
  const [data, setData] = useState<Vendor[]>([]);
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
      const result = await VendorService.getVendors({
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
      console.error("Failed to fetch vendors", err);
      message.error("Failed to load vendors");
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
    Modal.confirm({
      title: "Are you sure you want to delete this vendor?",
      content: "This action cannot be undone.",
      okText: "Yes, Delete",
      okType: "danger",
      cancelText: "No",
      onOk: async () => {
        try {
          await VendorService.deleteVendor(id);
          notification.success({ message: "Vendor Deleted Successfully" });
          fetchData(pagination.current || 1, pagination.pageSize || 10);
        } catch (err) {
          message.error("Failed to delete vendor");
        }
      },
    });
  };

  const columns = useMemo(() => [
    {
      title: "Vendor Name",
      dataIndex: "companyName",
      key: "companyName",
      render: (text: string, record: Vendor) => (
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
      render: (_: any, record: Vendor) => {
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
      render: (_: any, record: Vendor) => (
        <Space>
          <GlobalOutlined style={{ color: "#8c8c8c" }} />
          <Text>{[record.city, record.country].filter(Boolean).join(', ') || "N/A"}</Text>
        </Space>
      ),
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
      render: (_: any, record: Vendor) => {
        const items = [
          {
            key: "view",
            label: "View Vendor",
            icon: <EyeOutlined />,
            onClick: () => router.push(`/vendor/view/${record.id}`),
          },
          {
            key: "edit",
            label: "Edit Vendor",
            icon: <EditOutlined />,
            onClick: () => router.push(`/vendor/edit/${record.id}`),
          },
          {
            type: "divider" as const,
          },
          {
            key: "delete",
            label: "Delete Vendor",
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
            <Breadcrumb.Item>Vendors</Breadcrumb.Item>
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
                <Title level={2} style={{ margin: 0 }}>Vendors</Title>
                <Text type="secondary">Manage your vendors, their contacts, and business relationships.</Text>
              </div>
              <Space>
                <Button icon={<SearchOutlined />}>Import Vendor</Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => router.push("/vendor/create")}
                >
                  Add Vendor
                </Button>
              </Space>
            </div>

            <Space size="large" style={{ marginBottom: 24, width: '100%', justifyContent: 'flex-start' }} wrap>
              <div style={{ width: 300 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Search</Text>
                <Input.Search
                  placeholder="Search by vendor name..."
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
              <div style={{ width: 150 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Status</Text>
                <Select
                  placeholder="All Status"
                  style={{ width: '100%' }}
                  allowClear
                  onChange={(val) => handleFilterChange('status', val)}
                >
                  <Option value="true">Active</Option>
                  <Option value="false">Inactive</Option>
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
                showTotal: (totalItem) => `Total ${totalItem} vendors`,
              }}
              loading={loading}
              onChange={handleTableChange}
              size="middle"
            />
          </div>
        </div>

      </div>

    </MainLayout>
  );
}
