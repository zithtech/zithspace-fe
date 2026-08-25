"use client";

import NoData from "@/components/common/NoData";
import React, { useEffect, useState, useMemo } from "react";
import { Table, Typography, Button, Spin, Empty, Input } from "antd";
import { DownloadOutlined, FileTextOutlined, SearchOutlined } from "@ant-design/icons";
import { EmployeeDocumentService } from "@/services/onboardingService";
import dayjs from "dayjs";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const { Title, Text } = Typography;

export default function MyDocumentsPanel() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const filteredDocuments = useMemo(() => {
    if (!search) return documents;
    const q = search.toLowerCase();
    return documents.filter(d =>
      (d.documentName || '').toLowerCase().includes(q) ||
      (d.documentType || '').toLowerCase().includes(q)
    );
  }, [documents, search]);

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
      title: "Uploaded By",
      dataIndex: "uploadedByName",
      key: "uploadedByName",
      render: (name: string) => <Text type="secondary">{name || "—"}</Text>,
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
              const link = document.createElement("a");
              link.href = record.documentUrl;
              link.download = record.documentName || "document";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
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
    <div style={{ padding: "24px 0 64px 0", minHeight: "100%", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        margin: "0 -32px",
        padding: "0 32px 16px 32px",
        borderBottom: "1px solid var(--border-slate-200)"
      }}>
        <div>
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
            My Documents
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            View and download your HR documents.
          </Text>
        </div>
        <Input
          placeholder="Search documents..."
          prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)' }} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 280 }}
        />
      </div>

      <style>{`
        .my-docs-table .ant-table-container,
        .my-docs-table .ant-table,
        .my-docs-table .ant-table-thead > tr > th {
          border-radius: 0px !important;
        }
      `}</style>
      <ZukvoLoadingOverlay loading={loading} message="">
        <Table
          className="my-docs-table"
          dataSource={filteredDocuments}
          columns={columns}
          rowKey="id"
          pagination={false}
          locale={{
            emptyText: (
              <NoData description="No documents found." />
            ),
          }}
          style={{ border: "1px solid var(--border-slate-200)", borderRadius: 0, overflow: "hidden" }}
        />
      </ZukvoLoadingOverlay>
    </div>
  );
}
