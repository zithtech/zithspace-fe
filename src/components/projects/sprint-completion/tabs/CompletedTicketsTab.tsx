"use client";

import React from "react";
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
      render: (text) => <span className="sc-chip sc-chip-ticket">{text}</span>,
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
            <span style={{ color: 'var(--sc-text)', fontSize: 13 }}>{assignee.name}</span>
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
            padding: '60px 0',
            textAlign: 'center',
            background: 'var(--sc-surface)',
            border: '1px solid var(--sc-border)',
            borderRadius: 16,
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
          <div
            style={{
              background: 'var(--sc-surface)',
              border: '1px solid var(--sc-border)',
              borderRadius: 16,
              padding: '14px 18px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              boxShadow: 'var(--sc-shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              {stats.map((s) => (
                <div
                  key={s.key}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                      color: s.color,
                      fontSize: 18,
                    }}
                  >
                    {s.icon}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        color: 'var(--sc-text-muted)',
                      }}
                    >
                      {s.label}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--sc-text)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                      {s.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <span className="sc-success-tag">
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
                pageSize: 10,
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
              marginTop: 14,
              padding: '12px 16px',
              borderRadius: 14,
              background:
                'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%)',
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
        </>
      )}
    </div>
  );
};

export default CompletedTicketsTab;
