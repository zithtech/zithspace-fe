"use client";
import React, { useEffect, useState } from "react";
import { Table, Typography, Button, Spin, Empty } from "antd";
import { DownloadOutlined, FileTextOutlined } from "@ant-design/icons";
import { EmployeeDocumentService } from "@/services/onboardingService";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function MyDocumentsPanel() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await EmployeeDocumentService.listMyDocuments();
      setDocuments(res.data || []);
    } catch (error) {
      console.error("Failed to load my documents", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Document Name",
      dataIndex: "documentName",
      key: "documentName",
      render: (text: string, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: "var(--bg-blue-50)", display: "flex",
            alignItems: "center", justifyContent: "center", color: "#3b82f6"
          }}>
            <FileTextOutlined style={{ fontSize: 16 }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-slate-800)", fontSize: 14 }}>
              {text || record.documentType}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
              {record.documentType}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expiryDate",
      key: "expiryDate",
      render: (date: string) =>
        date ? (
          <Text style={{ fontWeight: 500 }}>{dayjs(date).format("MMM DD, YYYY")}</Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 999,
          background: "var(--bg-emerald-50)", color: "var(--text-emerald-700)",
          border: "1px solid var(--border-emerald-200)"
        }}>
          {status?.charAt(0).toUpperCase() + status?.slice(1) || "Uploaded"}
        </span>
      ),
    },
    {
      title: "Uploaded On",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      render: (date: string) => (
        <Text type="secondary">{dayjs(date).format("MMM DD, YYYY")}</Text>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: 100,
      render: (_: any, record: any) => (
        <Button
          type="text"
          icon={<DownloadOutlined />}
          onClick={() => {
            if (record.documentUrl) {
              window.open(record.documentUrl, "_blank");
            }
          }}
          style={{ color: "#3b82f6" }}
        >
          Download
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "32px 0 64px 0", minHeight: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
          My Documents
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          View and download your HR documents.
        </Text>
      </div>

      <Table
        dataSource={documents}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No documents found."
            />
          ),
        }}
        style={{ border: "1px solid var(--border-slate-200)", borderRadius: 8, overflow: "hidden" }}
      />
    </div>
  );
}
