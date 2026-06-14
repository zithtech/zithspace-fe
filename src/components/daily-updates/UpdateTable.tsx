"use client";

import React from "react";
import { Table, Avatar, Tag, Space, Typography, Button, Popconfirm, Tooltip } from "antd";
import {
  MoreHorizontal,
  Clock,
  Package,
  CheckCircle2,
  Eye,
  Activity,
  User,
  Edit2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  DailyStatusUpdate,
  ProjectUpdate,
  formatHours,
} from "@/types/dailyUpdate";
import { useTicketDrawer } from "@/context/TicketDrawerContext";

const { Text } = Typography;

interface UpdateTableProps {
  updates: DailyStatusUpdate[];
  loading: boolean;
  onViewDetails: (update: DailyStatusUpdate) => void;
  onDeleteUpdate?: (updateId: string) => Promise<void>;
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
  submittedAt: string | Date;
  dueDate: string | Date;
}

export default function UpdateTable({
  updates,
  loading,
  onViewDetails,
  onDeleteUpdate,
}: UpdateTableProps) {
  const { open: openTicketDrawer } = useTicketDrawer();
  const { user } = useAuth();
  const { canUpdateDailyUpdate, canDeleteDailyUpdate } = usePermission();
  const router = useRouter();

  const columns: ColumnsType<TableDataType> = [
    {
      title: "Team Member",
      dataIndex: "userName",
      key: "userName",
      width: 200,
      fixed: "left",
      render: (name: string, record) => {
        const updateType = record.update.updateType || "EOD";
        return (
          <Space size={10}>
            <Avatar
              src={record.update.user?.avatarUrl}
              size={32}
              style={{
                backgroundColor: updateType === "BOD" ? "var(--bg-holiday)" : "var(--bg-blue-50)",
                color: updateType === "BOD" ? "var(--text-holiday)" : "var(--text-blue-700)",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {name.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 13, display: "block", color: "var(--text-slate-900)", lineHeight: 1.2 }}>
                {name}
              </Text>
              <Text style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                {record.userPosition || "Team Member"}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Projects",
      dataIndex: "projectCount",
      key: "projectCount",
      width: 140,
      render: (count: number, record) => {
        const projectUpdates = (record.update.projectUpdates || []) as ProjectUpdate[];
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Package size={14} color="var(--text-slate-400)" />
            <Text style={{ fontSize: 12, color: "var(--text-slate-700)" }}>
              {count === 1 ? projectUpdates[0]?.projectName : `${count} Projects`}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Tasks",
      dataIndex: "taskCount",
      key: "taskCount",
      width: 200,
      render: (count: number, record) => {
        const projectUpdates = (record.update.projectUpdates || []) as ProjectUpdate[];
        const firstTask = projectUpdates[0]?.tasks?.[0];
        const showAsTicketLink = count === 1 && !!firstTask?.ticketNumber && !!firstTask?.ticketId;
        if (showAsTicketLink) {
          return (
            <Text
              ellipsis
              onClick={(e) => {
                e.stopPropagation();
                openTicketDrawer(firstTask!.ticketId!);
              }}
              style={{
                fontSize: 12,
                color: "var(--text-sky-500, #0ea5e9)",
                maxWidth: 160,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {firstTask!.ticketNumber}
            </Text>
          );
        }
        return (
          <Text ellipsis style={{ fontSize: 12, color: "var(--text-slate-700)", maxWidth: 160 }}>
            {count === 1 ? (firstTask?.description) : `${count} Tasks Completed`}
          </Text>
        );
      },
    },
    {
      title: "Hours",
      dataIndex: "totalHours",
      key: "totalHours",
      width: 110,
      render: (hours: number) => (
        <Tag
          style={{
            borderRadius: 6,
            background: "var(--bg-blue-50)",
            border: "none",
            color: "var(--text-blue-700)",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px"
          }}
        >
          {formatHours(hours)}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      width: 130,
      render: (date: string) => (
        <Text style={{ fontSize: 12, color: "var(--text-slate-600)", fontWeight: 500 }}>
          {dayjs(date).format("DD MMM YYYY")}
        </Text>
      ),
    },
    {
      title: "Submitted On",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 140,
      render: (time: string | Date, record: TableDataType) => {
        const isEdited = record.update.updatedAt && record.update.createdAt && dayjs(record.update.updatedAt).diff(dayjs(record.update.createdAt), 'second') > 60;
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: 12, color: "var(--text-slate-600)" }}>
              {dayjs(isEdited ? record.update.updatedAt : time).format("MMM D, h:mm A")}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: "right",
      render: (_, record) => {
        const update = record.update;
        const isEditable = dayjs().diff(dayjs(update.createdAt), "hour") < 24;
        const isOwner = user?.id === update.userId;
        const editDisabled = !isEditable || !canUpdateDailyUpdate;

        return (
          <Space size={8} onClick={(e) => e.stopPropagation()}>
            <Tooltip title="View Details">
              <Button
                type="text"
                size="small"
                icon={<Eye size={15} color="var(--text-sky-500)" />}
                onClick={() => onViewDetails(update)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--bg-sky-50)",
                  borderRadius: 6
                }}
              />
            </Tooltip>
            {isOwner && (
              <Tooltip title={editDisabled ? "Daily update is no longer editable (24h limit) or permission denied" : "Edit Update"}>
                <Button
                  type="text"
                  size="small"
                  disabled={editDisabled}
                  icon={<Edit2 size={15} color={editDisabled ? undefined : "var(--text-blue-700)"} />}
                  onClick={() => router.push(`/daily-updates/submit?edit=${update.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: editDisabled ? undefined : "var(--bg-blue-50)",
                    borderRadius: 6
                  }}
                />
              </Tooltip>
            )}
            {canDeleteDailyUpdate && (
              <Popconfirm
                title="Delete Update"
                description="Are you sure you want to delete this status update?"
                onConfirm={async () => {
                  if (onDeleteUpdate) {
                    await onDeleteUpdate(update.id);
                  }
                }}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Delete Update">
                  <Button
                    type="text"
                    size="small"
                    icon={<Trash2 size={15} color="var(--text-leave, #ef4444)" />}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--bg-leave, rgba(239, 68, 68, 0.08))",
                      borderRadius: 6
                    }}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  const dataSource: TableDataType[] = updates.map((update) => {
    const projectUpdates = (update.projectUpdates || []) as ProjectUpdate[];
    const totalHours = projectUpdates.reduce(
      (sum, project) => sum + (project.hoursWorked || 0),
      0
    );
    const totalTasks = projectUpdates.reduce(
      (sum, project) => sum + (project.tasks?.length || 0),
      0
    );

    return {
      key: update.id,
      update,
      userName: update.user?.name || "Unknown",
      userPosition: update.user?.position?.title || "",
      mood: update.mood || "neutral",
      totalHours,
      projectCount: projectUpdates.length,
      taskCount: totalTasks,
      submittedAt: typeof update.submittedAt === "string"
        ? update.submittedAt
        : update.submittedAt?.toISOString() || update.createdAt,
      dueDate: update.is_missed && update.missed_updateAt
        ? update.missed_updateAt
        : update.createdAt,
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
        style: { padding: "0 24px 24px" }
      }}
      scroll={{ x: 1060 }}
      onRow={(record) => ({
        onClick: () => onViewDetails(record.update),
        style: { cursor: "pointer" },
      })}
      style={{
        background: "transparent",
      }}
      className="premium-table"
    />
  );
}
