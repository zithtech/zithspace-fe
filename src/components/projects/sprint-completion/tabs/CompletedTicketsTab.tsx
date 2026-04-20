"use client";

import React from "react";
import {
  Table,
  Tag,
  Typography,
  Space,
  Empty,
  Badge,
  Avatar,
  Tooltip,
  Card,
} from "antd";
import {
  CheckCircleOutlined,
  TrophyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { SprintTicket } from "@/services/sprintCompletionService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

interface CompletedTicketsTabProps {
  tickets: SprintTicket[];
}

export const CompletedTicketsTab: React.FC<CompletedTicketsTabProps> = ({
  tickets,
}) => {
  // Calculate total story points
  const totalPoints = tickets.reduce((sum, ticket) => sum + (ticket.storyPoint || 0), 0);

  // Table columns
  const columns: ColumnsType<SprintTicket> = [
    {
      title: "Ticket",
      dataIndex: "ticketNumber",
      key: "ticketNumber",
      width: 120,
      fixed: "left",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title) => (
        <Tooltip title={title}>
          <Text>{title}</Text>
        </Tooltip>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => (
        <Tag icon={<CheckCircleOutlined />} color="success">
          {status === 'completed' ? 'Completed' : status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type) => (
        <Tag color={
          type === 'Bug' ? 'red' :
            type === 'Feature' ? 'blue' :
              type === 'Enhancement' ? 'cyan' :
                'default'
        }>
          {type}
        </Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority) => (
        <Tag color={
          priority === 'HIGH' ? 'red' :
            priority === 'MEDIUM' ? 'orange' :
              priority === 'LOW' ? 'blue' :
                'default'
        }>
          {priority}
        </Tag>
      ),
    },
    {
      title: "Points",
      dataIndex: "storyPoint",
      key: "storyPoint",
      width: 100,
      align: "center",
      render: (points) => (
        <Badge
          count={points}
          showZero
          style={{ backgroundColor: '#1890ff' }}
        />
      ),
    },
    {
      title: "Assignee",
      dataIndex: "assignee",
      key: "assignee",
      width: 180,
      render: (assignee) => {
        if (!assignee) {
          return <Text type="secondary">Unassigned</Text>;
        }
        return (
          <Space size={8}>
            <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
              {assignee.name.charAt(0).toUpperCase()}
            </Avatar>
            <Text>{assignee.name}</Text>
          </Space>
        );
      },
    },
    {
      title: "Completed",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (date) => (
        <Tooltip title={dayjs(date).format('MMM D, YYYY h:mm A')}>
          <Text type="secondary">{dayjs(date).fromNow()}</Text>
        </Tooltip>
      ),
    }
  ];

  return (
    <div className="no-scrollbar" style={{ padding: '8px 20px 16px 20px', height: "calc(85vh - 220px)", overflow: "auto", background: 'var(--bg-pure-white)' }}>
      {tickets.length === 0 ? (
        <div style={{ padding: '100px 0', textAlign: 'center' }}>
          <Empty
            description={<Text type="secondary" style={{ fontSize: 16 }}>No tickets completed in this sprint yet.</Text>}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <>
          {/* Summary Header */}
          <Card
            bordered={false}
            style={{
              marginBottom: 12,
              borderRadius: 12,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}
            styles={{ body: { padding: '10px 16px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={24}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(24, 144, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1890ff'
                  }}>
                    <CheckCircleOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resolved</Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{tickets.length}</Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>Tickets</Text>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(24, 144, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1890ff'
                  }}>
                    <TrophyOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Velocity</Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{totalPoints}</Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>Points</Text>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(24, 144, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1890ff'
                  }}>
                    <UserOutlined style={{ fontSize: 18 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Squad</Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <Title level={5} style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
                        {new Set(tickets.map(t => t.assignee?.id).filter(Boolean)).size}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>Contributors</Text>
                    </div>
                  </div>
                </div>
              </Space>

              <div style={{ textAlign: 'right' }}>
                <Tag color="success" style={{ borderRadius: 6, padding: '4px 12px', fontWeight: 600, fontSize: 13, border: 'none' }}>
                  SPRINT SUCCESS
                </Tag>
              </div>
            </div>
          </Card>

          {/* Tickets Table */}
          <div style={{ background: 'var(--bg-pure-white)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)', border: '1px solid var(--border-color)' }}>
            <Table
              columns={columns}
              dataSource={tickets}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} completed tickets`,
              }}
              scroll={{ x: 1200 }}
              size="middle"
              className="custom-premium-table"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CompletedTicketsTab;
