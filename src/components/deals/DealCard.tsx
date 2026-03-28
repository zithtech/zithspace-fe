"use client";

import React from "react";
import { Card, Tag, Typography, Avatar, Tooltip, Space } from "antd";
import { ClockCircleOutlined, DollarOutlined, UserOutlined } from "@ant-design/icons";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import dayjs from "dayjs";
import { Deal } from "@/services/dealService";

const { Text } = Typography;

interface DealCardProps {
  deal: Deal;
  onClick: (deal: Deal) => void;
}

const DealCard: React.FC<DealCardProps> = ({ deal, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: "Deal",
      deal,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
    marginBottom: "10px",
    borderRadius: "8px",
    boxShadow: isDragging ? "0 12px 24px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
  };

  const formattedDate = deal.expectedClosingDate 
    ? dayjs(deal.expectedClosingDate).format("MMM DD") 
    : "No date";

  const isOverdue = deal.expectedClosingDate && dayjs().isAfter(dayjs(deal.expectedClosingDate));

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick(deal)}>
      <Card
        size="small"
        hoverable
        bordered
        style={{ borderColor: "#e8e8e8", borderRadius: "8px" }}
        styles={{ body: { padding: "14px 16px" } }}
      >
        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Text strong style={{ fontSize: "13px", color: "#262626", display: "block", marginBottom: "2px", lineHeight: 1.3 }}>
              {deal.title}
            </Text>
            <Tag bordered={false} color={deal.probability && deal.probability > 70 ? "success" : deal.probability && deal.probability > 40 ? "processing" : "warning"} style={{ marginRight: 0, fontSize: "10px", fontWeight: 600 }}>
              {deal.probability}%
            </Tag>
          </div>

          <Text type="secondary" style={{ fontSize: "12px" }}>
            {deal.companyName || deal.clientName}
          </Text>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
            <Space size={4}>
              <DollarOutlined style={{ color: "#8c8c8c", fontSize: "12px" }} />
              <Text strong style={{ fontSize: "13px" }}>
                {deal.currency || "USD"} {deal.estimatedValue?.toLocaleString()}
              </Text>
            </Space>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {deal.tags?.slice(0, 2).map((tag) => (
              <Tag key={tag} style={{ fontSize: "10px", margin: 0 }}>
                {tag}
              </Tag>
            ))}
            {deal.tags && deal.tags.length > 2 && (
              <Tag style={{ fontSize: "10px", margin: 0 }}>+{deal.tags.length - 2}</Tag>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f0f0f0", paddingTop: "8px" }}>
            <Space size={4}>
              <ClockCircleOutlined style={{ color: isOverdue ? "#ff4d4f" : "#8c8c8c", fontSize: "12px" }} />
              <Text type={isOverdue ? "danger" : "secondary"} style={{ fontSize: "11px" }}>
                {formattedDate}
              </Text>
            </Space>
            
            <Tooltip title={deal.assignedTo ? `${deal.assignedTo.first_name} ${deal.assignedTo.last_name}` : "Unassigned"}>
              {deal.assignedTo ? (
                <Avatar size={20} style={{ backgroundColor: "#1890ff" }} icon={<UserOutlined />} />
              ) : (
                <Avatar size={20} icon={<UserOutlined />} />
              )}
            </Tooltip>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default DealCard;
