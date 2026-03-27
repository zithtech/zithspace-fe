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
    },
  ];

  return (
    <div style={{ padding: '24px 32px', height: "calc(85vh - 220px)", overflow: "auto", background: '#ffffff' }}>
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
              marginBottom: 20, 
              borderRadius: 16, 
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
              background: '#ffffff',
              border: '1px solid #f0f0f0'
            }}
            styles={{ body: { padding: '16px 24px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space size={48}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    background: 'rgba(24, 144, 255, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#1890ff'
                  }}>
                    <CheckCircleOutlined style={{ fontSize: 22 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Resolved</Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{tickets.length}</Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>Tickets</Text>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    background: 'rgba(24, 144, 255, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#1890ff'
                  }}>
                    <TrophyOutlined style={{ fontSize: 22 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Velocity</Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <Title level={4} style={{ margin: 0, fontWeight: 700 }}>{totalPoints}</Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>Points</Text>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 44, 
                    height: 44, 
                    borderRadius: 12, 
                    background: 'rgba(24, 144, 255, 0.1)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#1890ff'
                  }}>
                    <UserOutlined style={{ fontSize: 22 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Squad</Text>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
                        {new Set(tickets.map(t => t.assignee?.id).filter(Boolean)).size}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13 }}>Contributors</Text>
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
          <div style={{ background: '#ffffff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)', border: '1px solid #f0f0f0' }}>
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
