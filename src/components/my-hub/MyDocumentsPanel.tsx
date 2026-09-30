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
    <div className="mydocs-wrap">
      <div className="mydocs-header">
        <div className="mydocs-header-about">
          <div className="mydocs-header-icon">
            <FileTextOutlined />
          </div>
          <div>
            <div className="mydocs-header-title">My Documents</div>
            <div className="mydocs-header-sub">View and download your HR documents</div>
          </div>
        </div>
        <div className="mydocs-header-actions">
          <div className="mydocs-search-wrap">
            <SearchOutlined className="mydocs-search-icon" />
            <input
              className="mydocs-search"
              placeholder="Search documents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mydocs-body">
        <div className="my-docs-table-wrap">
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
            />
          </ZukvoLoadingOverlay>
        </div>
      </div>

      <style jsx global>{`
        .mydocs-wrap { display: flex; flex-direction: column; flex: 1; min-height: 100%; position: relative; background: var(--bg-pure-white); }
        .mydocs-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: 14px 24px; margin: 0;
          border-bottom: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          flex-wrap: wrap;
        }
        .mydocs-header-about { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .mydocs-header-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(59, 130, 246, 0.10); color: #3b82f6;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .mydocs-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .mydocs-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .mydocs-header-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .mydocs-search-wrap {
          display: flex; align-items: center; height: 34px; width: 240px;
          border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .mydocs-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.10); }
        .mydocs-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .mydocs-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        
        .mydocs-body { flex: 1; min-height: 0; padding: 20px 24px 24px 24px; }
        .my-docs-table-wrap { border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; background: var(--bg-pure-white); }
        .my-docs-table .ant-table, .my-docs-table .ant-table-container { background: transparent; font-size: 12.5px; border-radius: 0px !important; }
        .my-docs-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important;
          letter-spacing: 0.04em; text-transform: uppercase;
          color: var(--text-slate-400) !important; padding: 9px 12px !important;
          border-radius: 0 !important;
        }
        .my-docs-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 10px 12px !important;
        }
        .my-docs-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .my-docs-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }

        @media (max-width: 768px) {
          .mydocs-header { padding: 12px 16px; }
          .mydocs-body { padding: 16px 16px 20px 16px; }
          .mydocs-search-wrap { width: 100%; }
        }
      `}</style>
    </div>
  );
}
