"use client";

import React from "react";
import { Table, Avatar, Tag, Space, Typography, Button } from "antd";
import {
  EyeOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  DailyStatusUpdate,
  ProjectUpdate,
  formatHours,
} from "@/types/dailyUpdate";

const { Text } = Typography;

interface UpdateTableProps {
  updates: DailyStatusUpdate[];
  loading: boolean;
  onViewDetails: (update: DailyStatusUpdate) => void;
}

interface TableDataType {
  key: string;
  update: DailyStatusUpdate;
  userName: string;
  userPosition: string;
  mood: string;
  totalHours: number;
  projectCount: number;
  taskCount: number;
  submittedAt: string;
  dueDate: string;
}

export default function UpdateTable({
  updates,
  loading,
  onViewDetails,
}: UpdateTableProps) {
  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case "happy":
        return "😊";
      case "neutral":
        return "😐";
      case "stressed":
        return "😰";
      case "blocked":
        return "🚫";
      default:
        return "😐";
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case "happy":
        return "success";
      case "neutral":
        return "default";
      case "stressed":
        return "warning";
      case "blocked":
        return "error";
      default:
        return "default";
    }
  };

  const columns: ColumnsType<TableDataType> = [
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      width: 200,
      fixed: "left",
      render: (name: string, record) => (
        <Space size={8}>
          <Avatar
            size={36}
            style={{ backgroundColor: "#1890ff", fontSize: 14 }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Text
              strong
              style={{ fontSize: 13, display: "block", lineHeight: 1.3 }}
            >
              {name}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.userPosition}
            </Text>
          </div>
        </Space>
      ),
    },

    {
      title: "Projects",
      dataIndex: "projectCount",
      key: "projectCount",
      width: 150,
      render: (count: number, record) => {
        const projectUpdates = record.update.projectUpdates as ProjectUpdate[];
        if (count === 1) {
          return (
            <Text style={{ fontSize: 12 }}>
              📦 {projectUpdates[0].projectName}
            </Text>
          );
        }
        return (
          <Space size={4}>
            <ProjectOutlined style={{ fontSize: 12, color: "#1890ff" }} />
            <Text style={{ fontSize: 12 }}>{count}</Text>
          </Space>
        );
      },
    },
    {
      title: "Tasks",
      dataIndex: "taskCount",
      key: "taskCount",
      width: 180,
      render: (count: number, record) => {
        const projectUpdates = record.update.projectUpdates as ProjectUpdate[];
        const allTasks = projectUpdates.flatMap((p) => p.tasks);
        if (count === 1) {
          const task = allTasks[0];
          if (task.type === "ticket") {
            return <Text style={{ fontSize: 11 }}>🎫 {task.ticketNumber}</Text>;
          }
          const description = task.description || "";
          const truncated =
            description.length > 30
              ? description.substring(0, 30) + "..."
              : description;
          return <Text style={{ fontSize: 11 }}>{truncated}</Text>;
        }
        return (
          <Space size={4}>
            <CheckCircleOutlined style={{ fontSize: 12, color: "#52c41a" }} />
            <Text style={{ fontSize: 12 }}>{count}</Text>
          </Space>
        );
      },
    },

    {
      title: "Hours",
      dataIndex: "totalHours",
      key: "totalHours",
      width: 100,
      render: (hours: number) => (
        <Tag
          icon={<ClockCircleOutlined />}
          color="blue"
          style={{ fontSize: 12 }}
        >
          {formatHours(hours)}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 120,
      render: (date: string) => <Text style={{ fontSize: 12 }}>{date}</Text>,
    },
    {
      title: "Submitted",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 120,
      render: (time: string) => (
        <Text style={{ fontSize: 12 }}>{dayjs(time).format("h:mm A")}</Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => onViewDetails(record.update)}
          style={{ padding: 0 }}
        >
          View
        </Button>
      ),
    },
  ];

  const dataSource: TableDataType[] = updates.map((update) => {
    const projectUpdates = update.projectUpdates as ProjectUpdate[];
    const totalHours = projectUpdates.reduce(
      (sum, project) => sum + (project.hoursWorked || 0),
      0,
    );
    const totalTasks = projectUpdates.reduce(
      (sum, project) => sum + project.tasks.length,
      0,
    );
    const projectCount = projectUpdates.length;
    const dueDate =
      update.is_missed && update.missed_updateAt
        ? dayjs(update.missed_updateAt).format("DD MMM YYYY")
        : dayjs(update.createdAt).format("DD MMM YYYY");

    return {
      key: update.id,
      update,
      userName: update.user?.name || "Unknown",
      userPosition: update.user?.position || "",
      mood: update.mood || "neutral",
      totalHours,
      projectCount,
      taskCount: totalTasks,
      submittedAt:
        typeof update.submittedAt === "string"
          ? update.submittedAt
          : update.submittedAt.toISOString(),
      dueDate,
    };
  });

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} updates`,
      }}
      scroll={{ x: 900 }}
      onRow={(record) => ({
        onClick: () => onViewDetails(record.update),
        style: { cursor: "pointer" },
      })}
      style={{
        backgroundColor: "#fff",
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}
    />
  );
}
