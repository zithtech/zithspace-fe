"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, message, Space, Typography, Card, Tag, Tooltip } from "antd";
import { 
  KeyOutlined, 
  ReloadOutlined, 
  SafetyCertificateOutlined, 
  CheckCircleFilled,
  WarningFilled,
  ApiOutlined
} from "@ant-design/icons";
import { apiClient } from "@/lib/axios";

const { Title, Text } = Typography;

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  web_inquiry_secret_key: string | null;
  plan_type: string;
  is_active: boolean;
  created_at: string;
}

export default function TenantKeysPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/tenants");
      if (res.data.success) {
        setTenants(res.data.data);
      } else {
        message.error("Failed to load tenants");
      }
    } catch (error) {
      console.error(error);
      message.error("Error loading tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleGenerateIndividual = async (tenantId: string) => {
    try {
      setGeneratingId(tenantId);
      const res = await apiClient.post(`/api/tenants/${tenantId}/generate-secret`);
      if (res.data.success) {
        message.success("Secret key generated successfully");
        fetchTenants();
      } else {
        message.error("Failed to generate key");
      }
    } catch (error) {
      console.error(error);
      message.error("Error generating key");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleGenerateAll = async () => {
    try {
      setGeneratingAll(true);
      const res = await apiClient.post("/api/tenants/generate-missing-secrets");
      if (res.data.success) {
        message.success(`Generated ${res.data.data.generatedCount} missing keys successfully`);
        fetchTenants();
      } else {
        message.error("Failed to generate keys");
      }
    } catch (error) {
      console.error(error);
      message.error("Error generating keys");
    } finally {
      setGeneratingAll(false);
    }
  };

  const columns = [
    {
      title: "Tenant Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm text-xs">
            {text.charAt(0).toUpperCase()}
          </div>
          <Text strong className="text-gray-800 dark:text-gray-200 text-[13px]">{text}</Text>
        </div>
      ),
    },
    {
      title: "Subdomain",
      dataIndex: "subdomain",
      key: "subdomain",
      render: (text: string) => (
        <Tag color="blue" className="px-3 py-1 rounded-full font-medium border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
          {text}
        </Tag>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_: any, record: Tenant) => (
        record.web_inquiry_secret_key ? (
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircleFilled className="text-emerald-500 dark:text-emerald-400" />
            <span className="text-[13px]">Active</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-medium">
            <WarningFilled className="text-rose-500 dark:text-rose-400" />
            <span className="text-[13px]">Missing</span>
          </div>
        )
      )
    },
    {
      title: "Secret Key",
      dataIndex: "web_inquiry_secret_key",
      key: "web_inquiry_secret_key",
      render: (key: string | null) => 
        key ? (
          <div className="bg-gray-50 dark:bg-[#1e252e] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-1.5 inline-flex items-center group transition-colors hover:bg-gray-100 dark:hover:bg-[#252c35] hover:border-gray-300 dark:hover:border-[#40464d]">
            <Text copyable={{ text: key }} className="text-gray-600 dark:text-gray-300 font-mono text-[13px]">
              {key}
            </Text>
          </div>
        ) : (
          <Text className="text-gray-400 dark:text-gray-500 italic text-[13px]">No key assigned</Text>
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Tenant) => (
        <Button
          type={record.web_inquiry_secret_key ? "default" : "primary"}
          className={`h-8 px-3 text-[13px] ${record.web_inquiry_secret_key ? "dark:bg-[#1e252e] dark:border-[#30363d] dark:text-gray-300" : "bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow hover:shadow-md transition-all"}`}
          icon={record.web_inquiry_secret_key ? <SafetyCertificateOutlined className="text-emerald-500 dark:text-emerald-400" /> : <ApiOutlined />}
          loading={generatingId === record.id}
          disabled={!!record.web_inquiry_secret_key}
          onClick={() => handleGenerateIndividual(record.id)}
        >
          {record.web_inquiry_secret_key ? "Generated" : "Generate"}
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Card 
          bordered={false} 
          className="shadow-xl rounded-2xl overflow-hidden border border-gray-100 dark:border-[#1e252e] dark:bg-[#151b23]"
          styles={{ body: { padding: 0 } }}
        >
          {/* Header Section */}
          <div className="bg-white dark:bg-[#151b23] border-b border-gray-100 dark:border-[#1e252e] px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                  <KeyOutlined className="text-lg text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <Title level={5} className="!m-0 text-gray-900 dark:text-gray-100 font-bold tracking-tight">
                    Tenant Web Inquiry Keys
                  </Title>
                  <Text className="text-gray-500 dark:text-gray-400 text-[13px] font-medium">
                    Manage API secret keys
                  </Text>
                </div>
              </div>
              
              <Space size="small">
                <Tooltip title="Refresh Data">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchTenants}
                    loading={loading}
                    className="h-8 w-8 px-0 flex items-center justify-center border-gray-200 dark:border-[#30363d] dark:bg-[#151b23] text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-600 dark:hover:border-indigo-400"
                  />
                </Tooltip>
                <Button
                  type="primary"
                  icon={<ApiOutlined />}
                  onClick={handleGenerateAll}
                  loading={generatingAll}
                  disabled={loading || tenants.every(t => t.web_inquiry_secret_key)}
                  className="h-8 px-4 text-[13px] bg-gradient-to-r from-indigo-600 to-violet-600 border-none shadow-sm hover:shadow hover:-translate-y-0.5 transition-all font-semibold"
                >
                  Generate Missing
                </Button>
              </Space>
            </div>
          </div>

          {/* Table Section */}
          <div className="p-0 overflow-x-auto w-full">
            <Table
              columns={columns}
              dataSource={tenants}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1000 }}
              pagination={{ 
                pageSize: 15,
                className: "px-4 py-3 border-t border-gray-100 dark:border-[#1e252e] m-0",
                showTotal: (total) => `Total ${total} tenants`
              }}
              className="tenant-keys-table"
            />
          </div>
        </Card>
      </div>

      <style jsx global>{`
        .tenant-keys-table .ant-table-thead > tr > th {
          background: #f8fafc;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          padding: 10px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        [data-theme='dark'] .tenant-keys-table .ant-table-thead > tr > th {
          background: #1e252e;
          color: #9ca3af;
          border-bottom: 1px solid #30363d;
        }
        .tenant-keys-table .ant-table-tbody > tr > td {
          padding: 10px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        [data-theme='dark'] .tenant-keys-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #1e252e;
        }
        .tenant-keys-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        [data-theme='dark'] .tenant-keys-table .ant-table-tbody > tr:hover > td {
          background: #1e252e !important;
        }
        [data-theme='dark'] .tenant-keys-table {
          background: #151b23;
        }
        [data-theme='dark'] .tenant-keys-table .ant-table {
          background: transparent;
          color: #e5e7eb;
        }
        [data-theme='dark'] .tenant-keys-table .ant-table-empty .ant-table-tbody > tr.ant-table-placeholder:hover > td {
          background: transparent !important;
        }
      `}</style>
    </div>
  );
}
