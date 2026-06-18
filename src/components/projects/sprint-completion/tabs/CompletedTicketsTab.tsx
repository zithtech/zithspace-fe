"use client";

import React, { useState } from "react";
import { Table, Typography, Empty, Avatar, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  FileTextOutlined,
  BugOutlined,
  CheckSquareOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SprintTicket } from "@/services/sprintCompletionService";
import { TicketDetailDrawer } from "../../drawer/TicketDetailDrawer";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

interface CompletedTicketsTabProps {
  tickets: SprintTicket[];
}

const PRIORITY_CHIP: Record<string, string> = {
  HIGH: 'sc-chip-pri-high',
  P1: 'sc-chip-pri-high',
  MEDIUM: 'sc-chip-pri-med',
  P2: 'sc-chip-pri-med',
  LOW: 'sc-chip-pri-low',
  P3: 'sc-chip-pri-low',
};

const TYPE_META = (type: string): { cls: string; icon: React.ReactNode } => {
  if (!type) return { cls: 'sc-chip-type-default', icon: <CheckSquareOutlined /> };
  const t = type.toLowerCase();
  if (t.includes('bug')) return { cls: 'sc-chip-type-bug', icon: <BugOutlined /> };
  if (t.includes('feat') || t.includes('enh')) return { cls: 'sc-chip-type-feat', icon: <ThunderboltOutlined /> };
  return { cls: 'sc-chip-type-task', icon: <CheckSquareOutlined /> };
};

export const CompletedTicketsTab: React.FC<CompletedTicketsTabProps> = ({ tickets }) => {
  const [pageSize, setPageSize] = useState<number>(10);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const totalPoints = tickets.reduce((sum, ticket) => sum + (ticket.storyPoint || 0), 0);
  const contributors = new Set(tickets.map((t) => t.assignee?.id).filter(Boolean)).size;

  const stats = [
    {
      key: 'resolved',
      label: 'Resolved Tickets',
      value: tickets.length,
      icon: <CheckCircleOutlined />,
      color: 'var(--sc-success)',
    },
    {
      key: 'velocity',
      label: 'Story Points',
      value: totalPoints,
      icon: <TrophyOutlined />,
      color: 'var(--sc-brand)',
    },
    {
      key: 'squad',
      label: 'Contributors',
      value: contributors,
      icon: <UserOutlined />,
      color: 'var(--sc-info)',
    },
  ];

  const columns: ColumnsType<SprintTicket> = [
    {
      title: 'Ticket',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 120,
      fixed: 'left',
      render: (text, record) => (
        <span
          className="sc-chip sc-chip-ticket sc-chip-ticket-link"
          onClick={() => setSelectedTicketId(record.id)}
          role="button"
          tabIndex={0}
        >
          {text}
        </span>
      ),
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title) => (
        <Tooltip title={title}>
          <span style={{ fontWeight: 600, color: 'var(--sc-text)' }}>{title}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <span className="sc-chip sc-chip-status-success">
          <CheckCircleOutlined style={{ fontSize: 10 }} />
          {status === 'completed' ? 'Completed' : (status || '').replace('_', ' ')}
        </span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const meta = TYPE_META(type);
        return (
          <span className={`sc-chip ${meta.cls}`}>
            {meta.icon}
            {type || '—'}
          </span>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      render: (priority: string) => (
        <span className={`sc-chip ${PRIORITY_CHIP[priority] || 'sc-chip-status-default'}`}>{priority || '—'}</span>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'storyPoint',
      key: 'storyPoint',
      width: 90,
      align: 'center',
      render: (points) => <span className="sc-points-pill">{points ?? 0}</span>,
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      width: 180,
      render: (assignee: any) => {
        if (!assignee) return <Text type="secondary">Unassigned</Text>;
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Avatar
              size={24}
              src={assignee.avatarUrl}
              style={{ backgroundColor: 'var(--sc-brand)', fontSize: 11, fontWeight: 700 }}
            >
              {assignee.name?.charAt(0).toUpperCase()}
            </Avatar>
            <span style={{ color: 'var(--sc-text)', fontSize: 13 }}>{assignee.name?.split(" ")[0]}</span>
          </span>
        );
      },
    },
    {
      title: 'Completed',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 140,
      render: (date) => (
        <Tooltip title={dayjs(date).format('MMM D, YYYY h:mm A')}>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="sc-tab">
      {tickets.length === 0 ? (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            background: 'var(--sc-surface)',
            border: '1px solid var(--sc-border)',
            borderRadius: 14,
            boxShadow: 'var(--sc-shadow-sm)',
          }}
        >
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ fontSize: 14, color: 'var(--sc-text-muted)' }}>
                No tickets completed in this sprint yet.
              </span>
            }
          />
        </div>
      ) : (
        <>
          {/* Summary header */}
          <div className="sc-completed-head">
            <div className="sc-completed-stats">
              {stats.map((s) => (
                <div key={s.key} className="sc-stat" style={{ ['--sc-stat-color' as any]: s.color }}>
                  <div className="sc-stat-icon">{s.icon}</div>
                  <div className="sc-stat-body">
                    <span className="sc-stat-label">{s.label}</span>
                    <div className="sc-stat-value-row">
                      <span className="sc-stat-value">{s.value}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <span className="sc-success-badge">
              <TrophyOutlined />
              Sprint Success
            </span>
          </div>

          {/* Table */}
          <div className="sc-table-shell">
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              pagination={{
                defaultPageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => (
                  <Text style={{ fontSize: 12, color: 'var(--sc-text-muted)' }}>
                    Total <b style={{ color: 'var(--sc-text)' }}>{total}</b> completed
                  </Text>
                ),
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </div>

          {/* Bottom flair */}
          <div
            style={{
              marginBottom: 12,
              padding: '11px 14px',
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.20)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 13,
              color: 'var(--sc-text)',
            }}
          >
            <FileTextOutlined style={{ color: 'var(--sc-success)', fontSize: 18 }} />
            <span>
              <strong style={{ fontWeight: 800 }}>{tickets.length} ticket{tickets.length === 1 ? '' : 's'}</strong>{' '}
              <span style={{ color: 'var(--sc-text-muted)' }}>shipped this sprint by</span>{' '}
              <strong style={{ fontWeight: 800 }}>{contributors} contributor{contributors === 1 ? '' : 's'}</strong>
              <span style={{ color: 'var(--sc-text-muted)' }}>, totaling</span>{' '}
              <strong style={{ fontWeight: 800 }}>{totalPoints} story point{totalPoints === 1 ? '' : 's'}</strong>.
            </span>
          </div>

          {/* Table */}
          <div className="sc-table-shell">
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              pagination={{
                pageSize,
                total: tickets.length,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50, 100],
                onShowSizeChange: (_current, size) => setPageSize(size),
                onChange: (_page, size) => {
                  if (size !== pageSize) setPageSize(size);
                },
                showTotal: (total) => (
                  <Text style={{ fontSize: 12, color: 'var(--sc-text-muted)' }}>
                    Total <b style={{ color: 'var(--sc-text)' }}>{total}</b> completed
                  </Text>
                ),
              }}
              scroll={{ x: 1200, y: 'calc(90vh - 450px)' }}
              size="middle"
            />
          </div>
        </>
      )}

      <TicketDetailDrawer
        ticketId={selectedTicketId}
        open={!!selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
        ticketIds={tickets.map((t) => t.id)}
        onNavigate={setSelectedTicketId}
      />
    </div>
  );
};

export default CompletedTicketsTab;
