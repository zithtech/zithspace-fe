"use client";

import React from "react";
import {
  Card,
  Avatar,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Dropdown,
  Menu,
  message,
  Tooltip,
  Modal,
  notification,
  Badge
} from "antd";
import {
  ClockCircleOutlined,
  ProjectOutlined,
  CheckCircleOutlined,
  MoreOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
import {
  DailyStatusUpdate,
  ProjectUpdate,
  formatHours,
} from "@/types/dailyUpdate";
import { useRouter } from "next/navigation";
import DailyUpdateService from "@/services/dailyUpdateService";

const { Text } = Typography;

interface UpdateCardProps {
  update: DailyStatusUpdate;
  onOpen: () => void; // drawer open
  onDelete: () => void; // refresh list
}

export default function UpdateCard({
  update,
  onOpen,
  onDelete,
}: UpdateCardProps) {
  const [api, contextHolder] = notification.useNotification();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = () => setIsDeleteModalOpen(true);

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return; // 🔥 PREVENT DOUBLE CALL

    try {
      setIsDeleting(true);

      await DailyUpdateService.deleteUpdate(update.id);
      api.success({
      message: "Deleted",
      description: "Daily update deleted successfully",
      placement: "topRight",
    });
      console.log("id", update.id);

      message.success("Daily update deleted successfully");
      onDelete(); // parent refresh/remove item
    } catch (err: any) {
      message.error(err.message || "Failed to delete update");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const projectUpdates = update.projectUpdates as ProjectUpdate[];
  const totalHours = projectUpdates.reduce(
    (sum, project) => sum + (project.hoursWorked || 0),
    0
  );
  const totalTasks = projectUpdates.reduce(
    (sum, project) => sum + project.tasks.length,
    0
  );
  const projectCount = projectUpdates.length;

  // Get all tasks
  const allTasks = projectUpdates.flatMap((project) => project.tasks);

  // Calculate status summary
  const statusSummary = allTasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get time range
  const startTimes = projectUpdates.map((p) => new Date(p.startTime).getTime());
  const endTimes = projectUpdates.map((p) => new Date(p.endTime).getTime());
  const earliestStart = new Date(Math.min(...startTimes));
  const latestEnd = new Date(Math.max(...endTimes));

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

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      { icon: string; color: string; label: string }
    > = {
      pending: { icon: "⏳", color: "default", label: "Pending" },
      in_progress: { icon: "⚙️", color: "processing", label: "In Progress" },
      dev_complete: { icon: "✅", color: "success", label: "Complete" },
      in_testing: { icon: "🧪", color: "warning", label: "Testing" },
      pushed_to_staging: { icon: "🚀", color: "cyan", label: "Staging" },
      pushed_to_production: {
        icon: "🎉",
        color: "purple",
        label: "Production",
      },
    };
    return configs[status] || configs.pending;
  };

  const formatTime = (date: Date) => {
    return dayjs(date).format("h:mm A");
  };

  const truncateText = (text: string, maxLength: number = 40) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };
  //const isMissed = update.is_missed === true;
  const isMissed = Boolean(update.is_missed);
  //  console.log("isMissed",update.is_missed)
  // const isMissed = !!update?.missed_updateAt;
  console.log("isMissed", isMissed);
  // const isMissed = Boolean(update.is_missed);
  const router = useRouter();

  // 🔥 24 hour edit rule
  const isEditable = dayjs().diff(dayjs(update.createdAt), "hour") < 24;

  const handleEdit = () => {
    router.push(`/daily-updates/submit?edit=${update.id}`);
  };
 const getUpdateTypeConfig = (type?: string) => {
  switch (type) {
    case "BOD":
      return { text: "BOD", color: "green" };
    case "EOD":
      return { text: "EOD", color: "blue" };
    default:
      return { text: "UNKNOWN", color: "gray" };
  }
};


  
 

  return (
    <>
    {contextHolder}
    <Badge.Ribbon
  text={getUpdateTypeConfig(update.updateType).text}
  color={getUpdateTypeConfig(update.updateType).color}
  placement="end" // start = top-left, end = top-right
>
    <Card
      hoverable
      //onClick={onOpen}
      onClick={() => {
        if (!isDeleteModalOpen) {
          onOpen();
        }
      }}
      style={{
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        cursor: "pointer",
        height: "100%",
        transition: "all 0.3s ease",
      }}
      bodyStyle={{ padding: 14 }}
      className="update-card"
    >
      <Modal
        title="Delete Daily Update"
        open={isDeleteModalOpen}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Yes, Delete"
        okType="danger"
        cancelText="Cancel"
        confirmLoading={isDeleting} // 🔥 IMPORTANT
      >
        Are you sure you want to delete this update?
      </Modal>

      <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
      </Row>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* LEFT – Avatar + Name + Mood + Total Hours */}
          <Space size={8} align="center">
            <Avatar
              size={36}
              style={{ backgroundColor: "#1890ff", fontSize: 14 }}
            >
              {update.user?.name.charAt(0).toUpperCase()}
            </Avatar>

            <Space size={6} wrap>
              <Text strong style={{ fontSize: 13 }}>
                {update.user?.name}
              </Text>

              <Text style={{ fontSize: 12 }}>{getMoodEmoji(update.mood)}</Text>

              {/* TOTAL HOURS next to MOOD */}
              <Tag
                icon={<ClockCircleOutlined />}
                color="blue"
                style={{ fontSize: 11, margin: 0 }}
              >
                {formatHours(totalHours)}
              </Tag>
            </Space>
          </Space>

          {/* RIGHT – MISSED + Dropdown */}
          <div style={{ display: "flex", gap: "5px" }}>
            
            {isMissed && (
              <Tag color="red" style={{ fontSize: 10, margin: 0 }}>
                MISSED
              </Tag>
            )}

            <Dropdown
              trigger={["click"]}
              menu={{
                items: [
                  { key: "edit", label: "Edit", disabled: !isEditable },
                  { key: "delete", label: "Delete", danger: true },
                ],
                onClick: (info) => {
                  info.domEvent.stopPropagation(); // prevent card click
                  if (info.key === "edit") handleEdit();
                  if (info.key === "delete") handleDelete(); // ✅ open modal
                },
              }}
            >
              <span
                onClick={(e) => e.stopPropagation()}
                style={{ cursor: "pointer" }}
              >
                <MoreOutlined />
              </span>
            </Dropdown>
          </div>
        </div>

        {/* POSITION */}
        <Text
          type="secondary"
          style={{
            fontSize: 11,
            display: "block",
            marginTop: 4,
            marginLeft: 44,
          }}
        >
          {update.user?.position}
        </Text>
      </div>

      {/* Project Display - Smart Logic */}
      <div style={{ marginBottom: 10, marginTop: 8}}>
        {projectCount === 1 ? (
          <div
            style={{
              padding: 8,
              backgroundColor: "#fafafa",
              borderRadius: 4,
              border: "1px solid #e8e8e8",
            }}
          >
            <Text style={{ fontSize: 12 }}>
              📦 {projectUpdates[0].projectName}
            </Text>
          </div>
        ) : (
          <div
            style={{
              padding: 8,
              backgroundColor: "#fafafa",
              borderRadius: 4,
              border: "1px solid #e8e8e8",
            }}
          >
            <Space size={4}>
              <ProjectOutlined style={{ fontSize: 12, color: "#595959" }} />
              <Text style={{ fontSize: 12 }}>{projectCount} Projects</Text>
            </Space>
          </div>
        )}
      </div>

      {/* Task Display - Smart Logic */}
      <div style={{ marginBottom: 10 }}>
        {totalTasks === 1 ? (
          <div
            style={{
              padding: 8,
              backgroundColor: "#fafafa",
              borderRadius: 4,
              border: "1px solid #e8e8e8",
            }}
          >
            {allTasks[0].type === "ticket" ? (
              <Text style={{ fontSize: 11 }}>
                🎫 {allTasks[0].ticketNumber}
              </Text>
            ) : (
              <Text style={{ fontSize: 11 }} ellipsis>
                {truncateText(allTasks[0].description || "", 40)}
              </Text>
            )}
          </div>
        ) : (
          <div
            style={{
              padding: 8,
              backgroundColor: "#fafafa",
              borderRadius: 4,
              border: "1px solid #e8e8e8",
            }}
          >
            <Space size={4}>
              <CheckCircleOutlined style={{ fontSize: 12, color: "#595959" }} />
              <Text style={{ fontSize: 12 }}>{totalTasks} Tasks</Text>
            </Space>
          </div>
        )}
      </div>

      {/* Time Tracking - Detailed */}
      <div
        style={{
          marginBottom: 10,
          padding: 10,
          backgroundColor: "#fafafa",
          borderRadius: 4,
          border: "1px solid #e8e8e8",
        }}
      >
        <Text
          strong
          style={{
            fontSize: 11,
            display: "block",
            marginBottom: 8,
            color: "#595959",
          }}
        >
          ⏰ Time Tracking
        </Text>
        <Space direction="vertical" size={4} style={{ width: "100%" }}>
          <Row justify="space-between">
            <Text style={{ fontSize: 10, color: "#8c8c8c" }}>Start:</Text>
            <Text strong style={{ fontSize: 11 }}>
              {formatTime(earliestStart)}
            </Text>
          </Row>
          <Row justify="space-between">
            <Text style={{ fontSize: 10, color: "#8c8c8c" }}>End:</Text>
            <Text strong style={{ fontSize: 11 }}>
              {formatTime(latestEnd)}
            </Text>
          </Row>
          <div style={{ borderTop: "1px solid #e8e8e8", margin: "4px 0" }} />
          <Row justify="space-between">
            <Text strong style={{ fontSize: 10 }}>
              Total:
            </Text>
            <Text strong style={{ fontSize: 12 }}>
              {formatHours(totalHours)}
            </Text>
          </Row>
        </Space>
      </div>

      {/* Task Summary - Detailed */}
      {Object.keys(statusSummary).length > 0 && (
        <div
          style={{
            marginBottom: 10,
            padding: 10,
            backgroundColor: "#fafafa",
            borderRadius: 4,
            border: "1px solid #e8e8e8",
          }}
        >
          <Text
            strong
            style={{
              fontSize: 11,
              display: "block",
              marginBottom: 8,
              color: "#595959",
            }}
          >
            📊 Task Summary
          </Text>
          <Space direction="vertical" size={3} style={{ width: "100%" }}>
            {/* Sort statuses by priority */}
            {[
              "pushed_to_production",
              "pushed_to_staging",
              "in_testing",
              "dev_complete",
              "in_progress",
              "pending",
            ]
              .filter((status) => statusSummary[status])
              .map((status) => {
                const config = getStatusConfig(status);
                return (
                  <Row key={status} justify="space-between" align="middle">
                    <Space size={4}>
                      <Text style={{ fontSize: 10 }}>{config.icon}</Text>
                      <Text style={{ fontSize: 10, color: "#8c8c8c" }}>
                        {config.label}
                      </Text>
                    </Space>
                    <Text strong style={{ fontSize: 11, color: "#262626" }}>
                      {statusSummary[status]}
                    </Text>
                  </Row>
                );
              })}
          </Space>
        </div>
      )}
      {/*footer*/}

      <div
        style={{
          marginTop: 10,
          paddingTop: 8,
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* LEFT SIDE – Due Date (always) */}
        <Text type="secondary" style={{ fontSize: 10 }}>
          Due Date:{" "}
          {dayjs(
            update.is_missed
              ? update.missed_updateAt // missed ON → picked date
              : dayjs().tz("Asia/Kolkata") // missed OFF → same-day date
          ).format("DD MMM YYYY")}
        </Text>

        {/* RIGHT SIDE – Submitted Date & Time (always) */}
        <Text type="secondary" style={{ fontSize: 10 }}>
          Submitted: {dayjs(update.createdAt).format("DD MMM YYYY, h:mm A")}
        </Text>
      </div>
    </Card>
    </Badge.Ribbon>
    </>
  );
}
