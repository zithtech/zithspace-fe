"use client";

import React from "react";
import { Typography, Tag, Avatar, Space, Descriptions, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import TiptapViewer from "@/components/common/TiptapViewer";
import { TicketDetails } from "@/types/ticket";
import { getStatusColor, getPriorityColor, getTypeColor, getPlatformColor, getTaskLevelColor } from "@/utils/ticketUtils";

const { Title, Text } = Typography;

interface TicketInformationProps {
  ticket: TicketDetails;
  onEdit: () => void;
}

export default function TicketInformation({ ticket, onEdit }: TicketInformationProps) {
  return (
    <div>
      {/* Simple Ticket Header Section */}
      <div
        style={{
          background: "#fafafa",
          borderRadius: "8px",
          padding: "20px",
          marginBottom: "24px",
          border: "1px solid #e8e8e8",
          position: "relative",
        }}
      >
        {/* Edit Button - Top Right */}
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
          }}
        >
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={onEdit}
            size="small"
          >
            Edit Ticket
          </Button>
        </div>

        {/* Ticket Number */}
        <div style={{ marginBottom: "12px" }}>
          <Tag
            color="blue"
            style={{
              fontSize: "13px",
              fontWeight: "600",
              padding: "4px 10px",
              borderRadius: "4px",
            }}
          >
            {ticket.ticketNumber}
          </Tag>
        </div>

        {/* Title */}
        <Title
          level={3}
          style={{
            margin: "0 0 16px 0",
            color: "#262626",
            fontSize: "22px",
            fontWeight: "600",
            lineHeight: "1.4",
            paddingRight: "120px", // Add padding to avoid overlap with button
          }}
        >
          {ticket.title}
        </Title>

        {/* Description */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "6px",
            padding: "16px",
            border: "1px solid #e8e8e8",
          }}
        >
          <Text
            strong
            style={{
              color: "#8c8c8c",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Description
          </Text>
          <TiptapViewer
            content={ticket.description}
            minHeight={100}
          />
        </div>
      </div>

      <Descriptions title="Ticket Information" bordered column={2}>
        <Descriptions.Item label="Status">
          <Tag color={getStatusColor(ticket.status)}>
            {ticket.status.replace("_", " ").toUpperCase()}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Priority">
          <Tag color={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Project">
          <Tag color="blue">
            {typeof ticket.project === 'string' ? ticket.project : ticket.project?.name || "Unknown"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Platform">
          <Tag color={getPlatformColor(ticket?.platform || "")}>
            {ticket?.platform || "Not specified"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Task Type">
          <Tag color={getTypeColor(ticket?.type || "")}>
            {ticket?.type || "Not specified"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Task Level">
          <Tag color={getTaskLevelColor(ticket?.taskLevel || "")}>
            {ticket?.taskLevel || "Not specified"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Story Points">
          {ticket?.storyPoint || 0}/5
        </Descriptions.Item>
        <Descriptions.Item label="Estimate Hours">
          {ticket?.estimateHours || 0}h
        </Descriptions.Item>
        <Descriptions.Item label="Assignee">
          <Space>
            <Avatar
              size="small"
              style={{ backgroundColor: "#1677ff" }}
            >
              {ticket?.assignee?.name?.charAt(0) || "U"}
            </Avatar>
            {ticket?.assignee?.name || "Unassigned"}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Report To">
          {typeof ticket?.reportTo === "string"
            ? ticket.reportTo
            : ticket?.reportTo?.name || "Not assigned"}
        </Descriptions.Item>
        <Descriptions.Item label="Created By">
          {ticket?.createdBy?.name || "Unknown"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {ticket?.createdAt
            ? dayjs(ticket.createdAt).format("MMMM DD, YYYY HH:mm")
            : "Unknown"}
        </Descriptions.Item>
        <Descriptions.Item label="Duration" span={2}>
          {ticket?.startDate && ticket?.endDate
            ? `${dayjs(ticket.startDate).format("MMM DD")} - ${dayjs(
              ticket.endDate
            ).format("MMM DD, YYYY")}`
            : "Not set"}
        </Descriptions.Item>
        {(ticket as any)?.releasePlan && (
          <Descriptions.Item label="Plans" span={2}>
            <Tag color="purple">{(ticket as any).releasePlan}</Tag>
          </Descriptions.Item>
        )}
      </Descriptions>
    </div>
  );
}
