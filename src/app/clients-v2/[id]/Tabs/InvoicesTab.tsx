"use client";

import NoData from "@/components/common/NoData";
import React, { useState, useEffect, useMemo } from "react";
import { Table, Tag, Badge, Card, notification, Button, Input, Pagination, Typography } from "antd";
import { FileText, Receipt, RefreshCw, Search, LayoutGrid, List } from "lucide-react";
import { api, apiClient } from "@/lib/axios";
import dayjs from "dayjs";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { currencySymbol } from "@/utils/currencies";

interface InvoicesTabProps {
  clientId: string;
  onRefresh: () => void;
}

// Status color mapping matching main invoice page
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'DRAFT': 'default',
    'PENDING': 'blue',
    'APPROVED': 'cyan',
    'SENT': 'geekblue',
    'PAID': 'success',
    'PARTIALLY_PAID': 'warning',
    'OVERDUE': 'error',
    'CANCELLED': 'default',
    'REFUNDED': 'default',
    'VIEWED': 'geekblue'
  };
  return colors[status] || 'default';
};

const fromBackendStatus = (status: string): string => {
  if (status === 'APPROVAL') return 'APPROVED';
  return status;
};

export default function InvoicesTab({ clientId, onRefresh }: InvoicesTabProps) {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notify, contextHolder] = notification.useNotification();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchInvoices = async (page = currentPage, size = pageSize, search = searchTerm) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.append("page", String(page));
      qs.append("limit", String(size));
      if (search.trim()) qs.append("search", search.trim());
      const res = await apiClient.get(`/api/clients-v2/${clientId}/invoices?${qs.toString()}`);
      const data = res.data?.data || [];
      const meta = res.data?.meta || { total: data.length };
      setInvoices(Array.isArray(data) ? data : []);
      setTotalCount(meta.total ?? (Array.isArray(data) ? data.length : 0));
    } catch (error) {
      console.error("Error fetching invoices:", error);
      notify.error({
        message: "Load Error",
        description: "Failed to load client invoices.",
        placement: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([
        fetchInvoices(currentPage, pageSize, searchTerm),
        onRefresh(),
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvoices(currentPage, pageSize, searchTerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, currentPage, pageSize]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      fetchInvoices(1, pageSize, searchTerm);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const paginatedInvoices = invoices;

  const columns = [
    {
      title: "INVOICE",
      dataIndex: "invoiceNumber",
      width: 160,
      render: (text: string) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: 'var(--bg-slate-50)', color: 'var(--text-slate-500)' }}>
            <FileText size={16} />
          </div>
          <div>
            <div className="font-bold" style={{ color: 'var(--text-primary)', fontSize: 13 }}>
              {text}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "CUSTOMER",
      dataIndex: "customerName",
      width: 180,
      render: (companyName: string) => {
        if (!companyName) return <span style={{ color: "var(--text-slate-400)" }}>-</span>;
        return (
          <div className="flex items-center gap-3 truncate">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shrink-0" style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
              {companyName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {companyName}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: "DATE",
      dataIndex: "invoiceDate",
      width: 120,
      render: (date: string) => (
        <div style={{ color: 'var(--text-secondary)' }}>
          {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
        </div>
      ),
    },
    {
      title: "DUE DATE",
      dataIndex: "dueDate",
      width: 120,
      render: (date: string, record: any) => {
        return (
          <div className={record.isOverdue ? "text-red-500 font-medium" : ""} style={{ color: record.isOverdue ? '#ef4444' : 'var(--text-secondary)' }}>
            {date ? dayjs(date).format('MMM DD, YYYY') : '-'}
          </div>
        );
      },
    },
    {
      title: "AMOUNT",
      dataIndex: "grandTotal",
      width: 160,
      render: (v: number, record: any) => (
        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
          {currencySymbol(record?.currency)}{Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      ),
    },
    {
      title: "CLIENT STATUS",
      dataIndex: "clientStatus",
      width: 140,
      render: (status: string) => {
        if (!status || status === "UNPAID") {
          return <Tag color="error" style={{ margin: 0, fontWeight: 600, border: "none" }}>UNPAID</Tag>;
        }
        if (status === "PARTIALLY_PAID") {
          return <Tag color="warning" style={{ margin: 0, fontWeight: 600, border: "none" }}>PARTIALLY PAID</Tag>;
        }
        if (status === "PAID") {
          return <Tag color="success" style={{ margin: 0, fontWeight: 600, border: "none" }}>PAID</Tag>;
        }
        return <span style={{ color: "var(--text-slate-400)" }}>{status}</span>;
      },
    },
    {
      title: "STATUS",
      dataIndex: "status",
      width: 150,
      render: (status: string, record: any) => {
        const frontendStatus = fromBackendStatus(status);
        const displayStatus = record.isOverdue ? 'OVERDUE' : frontendStatus;
        return (
          <div className="flex items-center gap-2">
            <Badge
              count={
                <Tag
                  color={getStatusColor(displayStatus)}
                  className="m-0"
                  style={{
                    padding: "4px 10px",
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: "1",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    border: "none",
                    textTransform: "uppercase",
                  }}
                >
                  <span className="w-[6px] h-[6px] rounded-full bg-current opacity-70"></span>
                  {displayStatus.replace('_', ' ')}
                </Tag>
              }
            />
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }} className="invoices-tab-container">
      {contextHolder}
      
      <div className="cd-tab-sticky-head">
      <div className="projects-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<Receipt size={20} color="#3b82f6" />}
            title="Invoices"
            description="View all sent, partially paid, and paid invoices associated with this client"
            style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)", padding: "4px 32px", marginBottom: "8px" }}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        </div>
  
        <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Input
            placeholder="Search by invoice number or customer name..."
            prefix={<Search size={15} style={{ color: "var(--text-slate-400)", marginRight: 8 }} />}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="projects-search-input"
            style={{ width: "340px" }}
            allowClear
          />
  
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="ptab-segmented">
              <button
                type="button"
                className={viewMode === "grid" ? "is-active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "is-active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="ptab-divider" />
      </div>

      <div className="invoices-tab-body">
        {viewMode === "list" ? (
          <div className="pp-table-wrap">
            <ZukvoLoadingOverlay loading={loading} message="">
              <Table
                dataSource={paginatedInvoices}
                columns={columns}
                rowKey="id"
                pagination={false}
                className="pp-table"
                scroll={{ x: "max-content" }}
                locale={{
                  emptyText: <NoData description={(
                    <div className="ptab-empty">
                      <div className="ptab-empty-icon">
                        <Receipt size={26} />
                      </div>
                      <div className="ptab-empty-title">No Invoices Found</div>
                      <div className="ptab-empty-desc">
                        There are no portal-visible invoices for this client yet.
                      </div>
                    </div>
                  )} />,
                }}
              />
            </ZukvoLoadingOverlay>
          </div>
        ) : (
          <div className="pp-grid">
            {loading ? (
              <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "var(--text-slate-400)" }}>Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <div className="ptab-empty-wrapper">
                <div className="ptab-empty" style={{ background: "var(--bg-pure-white)", border: "1px solid var(--border-slate-200)", padding: "40px 24px" }}>
                  <div className="ptab-empty-icon">
                    <Receipt size={26} />
                  </div>
                  <div className="ptab-empty-title">No Invoices Found</div>
                  <div className="ptab-empty-desc">
                    There are no portal-visible invoices for this client yet.
                  </div>
                </div>
              </div>
            ) : (
              paginatedInvoices.map((invoice) => {
                const displayStatus = invoice.isOverdue ? 'OVERDUE' : fromBackendStatus(invoice.status);
                return (
                  <div key={invoice.id} className="pc-card">
                    <div className="pc-top">
                      <div className="pc-avatar" style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%" }}>
                        {invoice.invoiceNumber?.charAt(0) || "I"}
                      </div>
                      <div className="pc-identity-body">
                        <div className="pc-title" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span>{invoice.invoiceNumber}</span>
                          <Tag
                            color={getStatusColor(displayStatus)}
                            style={{ borderRadius: 6, fontWeight: 600, border: 0, fontSize: "10px", padding: "1px 6px", display: "inline-flex", alignItems: "center", gap: 3 }}
                          >
                            {displayStatus.replace('_', ' ')}
                          </Tag>
                        </div>
                        <div className="pc-client-line">
                          <span className="pc-client-key">Customer:</span>
                          <span className="pc-client-val">{invoice.customerName || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pc-foot">
                      <div className="pc-foot-row">
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Date:</span>
                          <span className="pc-foot-val">{invoice.invoiceDate ? dayjs(invoice.invoiceDate).format("MMM DD, YYYY") : "—"}</span>
                        </span>
                        <span className="pc-foot-div" />
                        <span className="pc-foot-item">
                          <span className="pc-foot-key">Due Date:</span>
                          <span
                            className="pc-foot-val"
                            style={{ color: invoice.isOverdue ? "#ef4444" : "var(--text-slate-700)", fontWeight: invoice.isOverdue ? 600 : 500 }}
                          >
                            {invoice.dueDate ? dayjs(invoice.dueDate).format("MMM DD, YYYY") : "—"}
                          </span>
                        </span>
                      </div>

                      <div className="pc-foot-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                        <span className="pc-foot-item" style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-slate-900)" }}>
                          {currencySymbol(invoice?.currency)}{Number(invoice.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span>
                          {(!invoice.clientStatus || invoice.clientStatus === "UNPAID") ? (
                            <Tag color="error" style={{ margin: 0, fontWeight: 600, border: "none", borderRadius: 6, fontSize: "10px" }}>UNPAID</Tag>
                          ) : invoice.clientStatus === "PARTIALLY_PAID" ? (
                            <Tag color="warning" style={{ margin: 0, fontWeight: 600, border: "none", borderRadius: 6, fontSize: "10px" }}>PARTIALLY PAID</Tag>
                          ) : invoice.clientStatus === "PAID" ? (
                            <Tag color="success" style={{ margin: 0, fontWeight: 600, border: "none", borderRadius: 6, fontSize: "10px" }}>PAID</Tag>
                          ) : (
                            <Tag style={{ margin: 0, fontWeight: 600, border: "none", borderRadius: 6, fontSize: "10px" }}>{invoice.clientStatus}</Tag>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {!loading && totalCount > 0 && (
        <div className="pm2-pagination invoices-pagination-footer">
          <Typography.Text style={{ fontSize: 13, color: "var(--text-slate-500)" }}>
            Showing{" "}
            <span style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>
              {(currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{" "}
            of{" "}
            <span style={{ color: "var(--text-slate-700)", fontWeight: 700 }}>
              {totalCount}
            </span>{" "}
            invoice{totalCount !== 1 ? "s" : ""}
          </Typography.Text>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalCount}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            showSizeChanger
            pageSizeOptions={[10, 15, 20, 25, 50, 100]}
          />
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-table .ant-table {
          background: transparent !important;
          color: var(--text-slate-700) !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-400) !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          padding: 6px 10px !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        .premium-table .ant-table-tbody > tr > td {
          padding: 6.5px 10px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        .premium-table .ant-table-placeholder > td {
          background: transparent !important;
        }

        /* Segmented Toggles */
        .ptab-segmented {
          display: inline-flex;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .ptab-segmented button {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text-slate-400);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ptab-segmented button:hover {
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
        }
        .ptab-segmented button.is-active {
          background: var(--bg-blue-50) !important;
          color: #3b82f6 !important;
        }
        [data-theme='dark'] .ptab-segmented {
          border-color: var(--border-slate-200);
          background: var(--bg-secondary);
        }
        [data-theme='dark'] .ptab-segmented button.is-active {
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }

        /* Proposal Style Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-thead > tr > th::before { display: none !important; }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-placeholder > td { background: transparent !important; }

        /* Search input styling */
        .projects-search-input.ant-input-affix-wrapper {
          height: 32px !important;
          border-radius: 8px !important;
          background: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          box-shadow: none !important;
          transition: all 0.2s ease !important;
          padding: 4px 12px !important;
        }
        .projects-search-input.ant-input-affix-wrapper:hover {
          border-color: var(--border-slate-200) !important;
        }
        .projects-search-input.ant-input-affix-wrapper:focus-within {
          border-color: #8b5cf6 !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
          background: var(--bg-pure-white) !important;
        }
        .projects-search-input .ant-input {
          background: transparent !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          color: var(--text-slate-800) !important;
        }
        [data-theme="dark"] .projects-search-input.ant-input-affix-wrapper {
          background: var(--bg-secondary);
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .projects-search-input.ant-input-affix-wrapper:focus-within {
          background: var(--bg-slate-900);
          border-color: #8b5cf6;
        }

        /* Proposal Grid & Cards */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ptab-empty-wrapper { grid-column: 1 / -1; }
        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }

        [data-theme="dark"] .pc-card {
          background: var(--bg-slate-900);
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot {
          background: var(--bg-secondary);
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot-row {
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot-div {
          background: var(--border-slate-800);
        }

        /* ── Container & Body for full-height stretch ── */
        .invoices-tab-container {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 !important;
          min-height: 100% !important;
          padding: 4px 0 0 0 !important;
          position: relative !important;
        }
        .invoices-tab-body {
          flex: 1 0 auto !important;
          padding-bottom: 16px !important;
        }

        /* ── Sticky pagination footer (fixed to bottom) ── */
        .invoices-pagination-footer {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 12px !important;
          padding: 10px 16px !important;
          margin-top: auto !important;
          margin-left: -12px !important;
          margin-right: -12px !important;
          margin-bottom: 0 !important;
          flex-wrap: wrap !important;
          position: sticky !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          background: var(--bg-pure-white) !important;
          border-top: 1px solid var(--border-slate-200) !important;
          z-index: 20 !important;
          box-shadow: 0 -4px 16px rgba(15, 23, 42, 0.04) !important;
        }
        [data-theme="dark"] .invoices-pagination-footer {
          background: #0B0F1A !important;
          border-top-color: #1f2937 !important;
        }
        @media (max-width: 900px) {
          .invoices-pagination-footer {
            margin-left: -12px !important;
            margin-right: -12px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
        @media (max-width: 720px) {
          .invoices-pagination-footer {
            margin-left: -12px !important;
            margin-right: -12px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }

        .invoices-pagination-footer .ant-pagination-item,
        .invoices-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        .invoices-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          background: transparent !important;
          color: var(--text-slate-500) !important;
        }
        .invoices-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        .invoices-pagination-footer .ant-pagination-item-active a {
          color: #fff !important;
        }
        .invoices-pagination-footer .ant-select-selector {
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 6px !important;
          background: transparent !important;
          height: 28px !important;
          font-size: 12px !important;
        }
        [data-theme="dark"] .invoices-pagination-footer .ant-pagination-item,
        [data-theme="dark"] .invoices-pagination-footer .ant-pagination-prev .ant-pagination-item-link,
        [data-theme="dark"] .invoices-pagination-footer .ant-pagination-next .ant-pagination-item-link {
          border-color: #374151 !important;
          background: #111827 !important;
          color: #9ca3af !important;
        }
        [data-theme="dark"] .invoices-pagination-footer .ant-pagination-item-active {
          background: #3b82f6 !important;
          border-color: #3b82f6 !important;
        }
        [data-theme="dark"] .invoices-pagination-footer .ant-pagination-item-active a {
          color: #fff !important;
        }
        [data-theme="dark"] .invoices-pagination-footer .ant-select-selector {
          border-color: #374151 !important;
          background: #111827 !important;
          color: #e5e7eb !important;
        }
      `}} />
    </div>
  );
}
