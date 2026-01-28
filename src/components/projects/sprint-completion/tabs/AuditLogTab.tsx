"use client";

import React from "react";
import {
  Table,
  Tag,
  Typography,
  Space,
  Empty,
  Avatar,
  Tooltip,
  Card,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  HistoryOutlined,
  UserOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
  FolderOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useSprintCompletionLog } from "@/hooks/useSprintCompletion";
import { SprintCompletionLog } from "@/services/sprintCompletionService";
import SprintCompletionService from "@/services/sprintCompletionService";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text } = Typography;

interface AuditLogTabProps {
  sprintId: string;
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ sprintId }) => {
  const [page, setPage] = React.useState(1);
  const { data, isLoading } = useSprintCompletionLog(sprintId, page, 20);

  // Get action icon
  const getActionIcon = (action: string) => {
    switch (action) {
      case "move_to_backlog":
        return <ArrowLeftOutlined style={{ color: "#faad14" }} />;
      case "move_to_sprint":
        return <RocketOutlined style={{ color: "#1890ff" }} />;
      case "move_to_bucket":
        return <FolderOutlined style={{ color: "#722ed1" }} />;
      case "move_to_trash":
        return <DeleteOutlined style={{ color: "#ff4d4f" }} />;
      case "ticket_completed":
        return <SendOutlined style={{ color: "#52c41a" }} />;
      default:
        return <HistoryOutlined />;
    }
  };

  // Table columns
  const columns: ColumnsType<SprintCompletionLog> = [
    {
      title: "Time",
      dataIndex: "performedAt",
      key: "performedAt",
      width: 180,
      render: (date) => (
        <Tooltip title={dayjs(date).format("MMM D, YYYY h:mm:ss A")}>
          <Space size={4}>
            <HistoryOutlined style={{ fontSize: 12, color: "#8c8c8c" }} />
            <Text type="secondary">{dayjs(date).fromNow()}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: "User",
      dataIndex: "performedBy",
      key: "performedBy",
      width: 200,
      render: (performedBy) => (
        <Space size={8}>
          <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
            {performedBy.name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text style={{ fontSize: 13 }}>{performedBy.name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {performedBy.workEmail}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 200,
      render: (action) => (
        <Space>
          {getActionIcon(action)}
          <Tag color={SprintCompletionService.getActionColor(action)}>
            {SprintCompletionService.getActionLabel(action as any)}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Ticket",
      dataIndex: "ticketId",
      key: "ticketId",
      width: 120,
      render: (ticketId, record) => {
        // Extract ticket number from metadata if available
        const ticketNumber = record.metadata?.ticketNumber || ticketId.substring(0, 8);
        return <Tag color="blue">{ticketNumber}</Tag>;
      },
    },
    {
      title: "Destination",
      dataIndex: "destinationType",
      key: "destination",
      width: 180,
      render: (destinationType, record) => {
        if (!destinationType) {
          return <Text type="secondary">-</Text>;
        }

        const destinationName = record.metadata?.destinationName || record.destinationId;
        
        return (
          <Space size={4}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {destinationType}:
            </Text>
            <Text style={{ fontSize: 12 }}>{destinationName}</Text>
          </Space>
        );
      },
    },
    {
      title: "Details",
      dataIndex: "metadata",
      key: "metadata",
      ellipsis: true,
      render: (metadata) => {
        if (!metadata || Object.keys(metadata).length === 0) {
          return <Text type="secondary">-</Text>;
        }

        const details = [];
        if (metadata.ticketTitle) {
          details.push(`Title: ${metadata.ticketTitle}`);
        }
        if (metadata.fromStatus) {
          details.push(`Status: ${metadata.fromStatus} → ${metadata.toStatus || 'changed'}`);
        }
        if (metadata.notes) {
          details.push(`Notes: ${metadata.notes}`);
        }

        return (
          <Tooltip title={details.join(" | ")}>
            <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {details.join(" | ") || "-"}
            </Text>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24, height: "calc(85vh - 220px)", overflow: "auto" }}>
      {/* Summary Statistics */}
      {data && data.summary && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Actions"
                value={data.summary.totalActions}
                prefix={<HistoryOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col span={16}>
            <Card>
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Action Breakdown
                </Text>
                <Space wrap>
                  {Object.entries(data.summary.actionBreakdown || {}).map(
                    ([action, count]) => (
                      <Tag
                        key={action}
                        color={SprintCompletionService.getActionColor(action)}
                        style={{ margin: 0 }}
                      >
                        {SprintCompletionService.getActionLabel(action as any)}: {count}
                      </Tag>
                    )
                  )}
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* Audit Log Table */}
      {!data || data.logs.length === 0 ? (
        <Empty
          description="No audit logs yet"
          style={{ marginTop: 100 }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          columns={columns}
          dataSource={data.logs}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page,
            pageSize: 20,
            total: data.pagination.total,
            showSizeChanger: false,
            showTotal: (total) => `Total ${total} actions`,
            onChange: (newPage) => setPage(newPage),
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      )}
    </div>
  );
};

export default AuditLogTab;
