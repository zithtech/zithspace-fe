"use client";

import NoData from "@/components/common/NoData";
import React, { useEffect, useState } from "react";
import { Table, Typography, Tag, Avatar, Tooltip, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { OverviewPager } from "./OverviewPager";

const { Text } = Typography;

export interface SprintTicket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string | null;
  assigneeName: string | null;
  assigneeAvatar: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  dueDate: string | Date | null;
}

export interface TableSprint {
  id: string;
  name: string;
  description: string | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  status: string;
  progress: number;
  ticketCount: number;
  completedCount: number;
  tickets: SprintTicket[];
}

import { useQuery } from "@tanstack/react-query";
import { ProjectService } from "@/services/projectService";
import ZukvoLoader from "@/components/common/ZukvoLoader";

interface SprintTableProps {
  sprints?: TableSprint[];
  projectId?: string;
  selectedSprintId: string | null;
  onSelectSprint: (id: string | null) => void;
}

const isDone = (status: string) =>
  ["completed", "done", "live", "live (deployed)"].includes((status || "").toLowerCase());
const isActive = (status: string) =>
  ["in_progress", "in_testing", "started", "active"].includes((status || "").toLowerCase());

const statusMeta = (status: string) => {
  if (isDone(status)) return { color: "#10b981", bg: "rgba(16,185,129,0.10)" };
  if (isActive(status)) return { color: "#f59e0b", bg: "rgba(245,158,11,0.10)" };
  return { color: "#64748b", bg: "rgba(100,116,139,0.10)" };
};

const priorityMeta = (priority: string | null) => {
  const p = (priority || "").toLowerCase();
  if (p.includes("critical") || p.includes("p0")) return { color: "#ef4444", label: "Critical" };
  if (p.includes("high") || p.includes("p1")) return { color: "#f59e0b", label: "High" };
  if (p.includes("low")) return { color: "#64748b", label: "Low" };
  return { color: "#3b82f6", label: priority ? priority : "Medium" };
};

const fmt = (d: string | Date | null) => (d ? dayjs(d as any).format("MMM D") : "—");

const TicketChildTable: React.FC<{ tickets: SprintTicket[] }> = ({ tickets }) => {
  if (!tickets.length) {
    return (
      <div style={{ padding: "16px 0" }}>
        <NoData description={
                        <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                          No tickets in this sprint
                        </Text>
                      } />
      </div>
    );
  }

  const cols: ColumnsType<SprintTicket> = [
    {
      title: "Ticket",
      dataIndex: "ticketNumber",
      width: 360,
      render: (_: any, t) => {
        const meta = statusMeta(t.status);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: meta.color,
                flexShrink: 0,
              }}
            />
            <Text style={{ fontSize: 11, fontWeight: 700, color: "var(--premium-blue)", flexShrink: 0 }}>
              {t.ticketNumber}
            </Text>
            <Text ellipsis style={{ fontSize: 12.5, color: "var(--text-slate-700)" }}>
              {t.title}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 130,
      render: (status: string) => {
        const meta = statusMeta(status);
        return (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: meta.color,
              background: meta.bg,
              padding: "2px 8px",
              borderRadius: 6,
              textTransform: "capitalize",
              whiteSpace: "nowrap",
            }}
          >
            {(status || "—").replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      width: 100,
      render: (priority: string | null) => {
        const meta = priorityMeta(priority);
        return (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: meta.color }}>{meta.label}</span>
        );
      },
    },
    {
      title: "Assignee",
      dataIndex: "assigneeName",
      width: 170,
      render: (_: any, t) =>
        t.assigneeName ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Avatar
              size={20}
              src={t.assigneeAvatar || undefined}
              style={{
                backgroundColor: "var(--bg-secondary, #f1f5f9)",
                color: "var(--text-slate-700)",
                fontSize: 9,
                border: "1px solid var(--border-color)",
                fontWeight: 600,
              }}
            >
              {t.assigneeName.substring(0, 2).toUpperCase()}
            </Avatar>
            <Text ellipsis style={{ fontSize: 12, color: "var(--text-slate-600)" }}>
              {t.assigneeName}
            </Text>
          </div>
        ) : (
          <Text style={{ fontSize: 12, color: "var(--text-slate-400)" }}>Unassigned</Text>
        ),
    },
    {
      title: "Due",
      dataIndex: "dueDate",
      width: 90,
      render: (_: any, t) => (
        <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
          {fmt(t.dueDate || t.endDate)}
        </Text>
      ),
    },
  ];

  return (
    <Table
      className="po-child-table"
      rowKey="id"
      size="small"
      columns={cols}
      dataSource={tickets}
      pagination={false} locale={{ emptyText: <NoData /> }}
    />
  );
};

export const SprintTable: React.FC<SprintTableProps> = ({
  sprints = [],
  projectId,
  selectedSprintId,
  onSelectSprint,
}) => {
  const [expanded, setExpanded] = useState<React.Key[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data: sprintResponse, isLoading } = useQuery({
    queryKey: ["projectSprints", projectId, page, pageSize],
    queryFn: () => ProjectService.getProjectSprints(projectId!, { page, limit: pageSize }),
    enabled: !!projectId,
  });

  // Keep the table expansion in sync with the selection.
  useEffect(() => {
    if (selectedSprintId) setExpanded([selectedSprintId]);
  }, [selectedSprintId]);

  const displayedSprints: TableSprint[] = projectId
    ? (sprintResponse?.data ?? [])
    : sprints.slice((page - 1) * pageSize, page * pageSize);

  const total = projectId
    ? (sprintResponse?.pagination?.total ?? 0)
    : sprints.length;

  const columns: ColumnsType<TableSprint> = [
    {
      title: "Sprint",
      dataIndex: "name",
      render: (_: any, s) => {
        const complete = s.progress >= 100;
        const accent = complete ? "#10b981" : "#3b82f6";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `${accent}12`,
                color: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                flexShrink: 0,
              }}
            >
              {complete ? <CheckCircleOutlined /> : <ThunderboltOutlined />}
            </div>
            <div style={{ minWidth: 0 }}>
              <Text strong ellipsis style={{ fontSize: 13, color: "var(--text-slate-900)", display: "block" }}>
                {s.name}
              </Text>
              <Text style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                <ClockCircleOutlined style={{ fontSize: 10, marginRight: 4 }} />
                {fmt(s.startDate)} → {fmt(s.endDate)}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 130,
      render: (status: string, s) => {
        const complete = s.progress >= 100;
        const color = complete ? "#10b981" : status === "active" ? "#3b82f6" : "#64748b";
        const label = complete ? "Completed" : status === "active" ? "Active" : "Planned";
        return (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color,
              background: `${color}1a`,
              padding: "2px 10px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      title: "Tickets",
      dataIndex: "ticketCount",
      width: 110,
      align: "center",
      render: (_: any, s) => (
        <Text style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-slate-700)" }}>
          {s.completedCount}/{s.ticketCount}
        </Text>
      ),
    },
    {
      title: "Progress",
      dataIndex: "progress",
      width: 200,
      render: (progress: number, s) => {
        const accent = progress >= 100 ? "#10b981" : "#3b82f6";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                flex: 1,
                height: 5,
                borderRadius: 999,
                background: "var(--bg-secondary, #f1f5f9)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: accent,
                  borderRadius: 999,
                }}
              />
            </div>
            <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--text-slate-900)", minWidth: 34 }}>
              {progress}%
            </Text>
          </div>
        );
      },
    },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          background: "var(--bg-pure-white)",
          border: "1px solid var(--border-color)",
          borderRadius: 6,
          padding: "48px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ZukvoLoader size="md" message="Loading sprints..." />
      </div>
    );
  }

  if (!isLoading && total === 0) {
    return (
      <div
        style={{
          background: "var(--bg-pure-white)",
          border: "1px solid var(--border-color)",
          borderRadius: 6,
          padding: "48px 0",
        }}
      >
        <NoData description={
                        <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>No sprints yet</Text>
                      } />
      </div>
    );
  }

  return (
    <div className="po-sprint-wrap">
      <div className="po-panel">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 18px",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "#3b82f612",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            <ThunderboltOutlined />
          </div>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text-slate-900)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Sprints
          </Text>
          <span
            style={{
              padding: "1px 8px",
              borderRadius: 999,
              background: "var(--bg-secondary, #f1f5f9)",
              color: "var(--text-slate-600)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {total}
          </span>
          <Text style={{ fontSize: 11.5, color: "var(--text-slate-400)", marginLeft: "auto" }}>
            Click a row to expand its tickets
          </Text>
        </div>

        <Table
          className="po-sprint-table"
          rowKey="id"
          size="middle"
          columns={columns}
          dataSource={displayedSprints}
          pagination={false}
          expandable={{
            expandedRowKeys: expanded,
            onExpandedRowsChange: (keys) => {
              const arr = keys as React.Key[];
              setExpanded(arr);
              onSelectSprint(arr.length ? String(arr[arr.length - 1]) : null);
            },
            expandedRowRender: (record) => <TicketChildTable tickets={record.tickets} />,
            expandIcon: ({ expanded: isExp, onExpand, record }) => (
              <Tooltip title={isExp ? "Collapse" : "Expand tickets"}>
                <RightOutlined
                  onClick={(e) => onExpand(record, e)}
                  style={{
                    fontSize: 11,
                    color: "var(--text-slate-400)",
                    transition: "transform .15s ease",
                    transform: isExp ? "rotate(90deg)" : "none",
                    cursor: "pointer",
                  }}
                />
              </Tooltip>
            ),
          }}
          rowClassName={(record) => (record.id === selectedSprintId ? "po-row-active" : "")} locale={{ emptyText: <NoData /> }}
        />
      </div>

      {/* Sticky footer detached from table box */}
      {total > 0 && (
        <OverviewPager
          total={total}
          page={page}
          pageSize={pageSize}
          pageSizeOptions={[10, 15, 20, 25, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
          noun="sprints"
          sticky={true}
        />
      )}

      <style jsx global>{`
        .po-sprint-wrap {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: calc(100vh - 280px);
          position: relative;
        }
        .po-sprint-wrap .po-panel {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          position: relative;
        }
        .po-sprint-table .ant-table {
          background: transparent;
        }
        .po-sprint-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          border-bottom: 1px solid var(--border-color) !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-slate-400) !important;
          padding: 8px 12px !important;
        }
        .po-sprint-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-color) !important;
          padding: 12px !important;
        }
        .po-sprint-table .ant-table-tbody > tr.ant-table-row:hover > td {
          background: var(--bg-slate-50) !important;
          cursor: pointer;
        }
        .po-sprint-table .po-row-active > td {
          background: var(--bg-blue-50) !important;
        }
        .po-sprint-table .ant-table-expanded-row > td {
          background: var(--bg-secondary, #f8fafc) !important;
          padding: 0 12px 12px 48px !important;
        }
        .po-child-table .ant-table {
          background: transparent;
        }
        .po-child-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-color) !important;
          font-size: 9.5px !important;
          font-weight: 700 !important;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-slate-400) !important;
          padding: 6px 10px !important;
        }
        .po-child-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 8px 10px !important;
        }
        .po-child-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-pure-white) !important;
        }
      `}</style>
    </div>
  );
};
