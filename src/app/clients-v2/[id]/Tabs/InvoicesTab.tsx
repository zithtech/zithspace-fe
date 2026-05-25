"use client";

import React, { useState, useEffect } from "react";
import { Table, Tag, Tooltip, Badge, Card, notification, Button } from "antd";
import { FileText, Receipt, User, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/axios";
import dayjs from "dayjs";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

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
  const [loading, setLoading] = useState(false);
  const [notify, contextHolder] = notification.useNotification();

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/clients-v2/${clientId}/invoices`);
      setInvoices(data || []);
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

  useEffect(() => {
    fetchInvoices();
  }, [clientId]);

  const columns = [
    {
      title: "INVOICE",
      dataIndex: "invoiceNumber",
      width: 160,
      render: (text: string, record: any) => (
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
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--bg-slate-50)', color: 'var(--text-slate-500)' }}>
              {companyName.charAt(0)}
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
      width: 120,
      render: (v: number) => (
        <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
          ${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}
      
      <div className="projects-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<Receipt size={20} color="#10b981" />}
          title="Invoices"
          description="View all sent, partially paid, and paid invoices associated with this client"
          style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
          extra={
            <Button 
              icon={<RefreshCw size={16} />} 
              onClick={fetchInvoices} 
              loading={loading}
              style={{
                borderRadius: 10,
                height: 38,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
              }}
            >
              Refresh
            </Button>
          }
        />
      </div>

      <div style={{ margin: "20px 0 16px 0" }}></div>

      <Card className="ptab-card" styles={{ body: { padding: 0 } }}>
        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, hideOnSinglePage: true }}
          className="premium-table"
          scroll={{ x: "max-content" }}
          locale={{
            emptyText: (
              <div className="ptab-empty">
                <div className="ptab-empty-icon">
                  <Receipt size={26} />
                </div>
                <div className="ptab-empty-title">No Invoices Found</div>
                <div className="ptab-empty-desc">
                  There are no portal-visible invoices for this client yet.
                </div>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}
