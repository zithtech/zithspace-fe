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

const { Text } = Typography;

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
      render: (text) => <Tag color="green">{text}</Tag>,
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
      width: 100,
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
      width: 80,
      align: "center",
      render: (points) => (
        <Badge 
          count={points} 
          showZero 
          style={{ backgroundColor: '#52c41a' }} 
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
    },
  ];

  return (
    <div style={{ padding: 24, height: "calc(85vh - 220px)", overflow: "auto" }}>
      {tickets.length === 0 ? (
        <Empty
          description="No completed tickets"
          style={{ marginTop: 100 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          {/* Summary Header */}
          <div
            style={{
              marginBottom: 16,
              padding: 16,
              background: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: 8,
            }}
          >
            <Space size={24}>
              <Space>
                <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                    Completed Tickets
                  </Text>
                  <Text strong style={{ fontSize: 20 }}>
                    {tickets.length}
                  </Text>
                </div>
              </Space>
              <Space>
                <TrophyOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                    Story Points
                  </Text>
                  <Text strong style={{ fontSize: 20 }}>
                    {totalPoints}
                  </Text>
                </div>
              </Space>
              <Space>
                <UserOutlined style={{ color: "#52c41a", fontSize: 20 }} />
                <div>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                    Contributors
                  </Text>
                  <Text strong style={{ fontSize: 20 }}>
                    {new Set(tickets.map(t => t.assignee?.id).filter(Boolean)).size}
                  </Text>
                </div>
              </Space>
            </Space>
          </div>

          {/* Tickets Table */}
          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} completed tickets`,
            }}
            scroll={{ x: 1200 }}
            size="small"
          />
        </>
      )}
    </div>
  );
};

export default CompletedTicketsTab;
