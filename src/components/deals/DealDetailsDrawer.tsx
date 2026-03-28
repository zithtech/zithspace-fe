"use client";

import React from "react";
import { Drawer, Descriptions, Tag, Typography, Badge, Avatar, Space, Button, Divider } from "antd";
import { UserOutlined, ClockCircleOutlined, DollarOutlined, PhoneOutlined, MailOutlined, BuildOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Deal } from "@/services/dealService";

const { Title, Text, Paragraph } = Typography;

interface DealDetailsDrawerProps {
  deal: Deal | null;
  visible: boolean;
  onClose: () => void;
}

const DealDetailsDrawer: React.FC<DealDetailsDrawerProps> = ({ deal, visible, onClose }) => {
  if (!deal) return null;

  const formattedDate = deal.expectedClosingDate 
    ? dayjs(deal.expectedClosingDate).format("MMMM DD, YYYY") 
    : "Not set";

  return (
    <Drawer
      title="Deal Details"
      placement="right"
      onClose={onClose}
      open={visible}
      width={600}
    >
      <div style={{ marginBottom: "24px" }}>
        <Title level={4}>{deal.title}</Title>
        <Space size={8}>
          <Tag color={deal.stage?.color || "blue"}>{deal.stage?.name || "No Stage"}</Tag>
          <Tag color="purple">{deal.status}</Tag>
          <Badge status="processing" text={`Probability: ${deal.probability}%`} />
        </Space>
      </div>

      <Divider />

      <Descriptions title="Client Information" bordered column={1} size="small">
        <Descriptions.Item label="Client Name">{deal.clientName}</Descriptions.Item>
        <Descriptions.Item label="Company">{deal.companyName || "-"}</Descriptions.Item>
        <Descriptions.Item label="Email">
          {deal.email ? (
            <Space>
              <MailOutlined />
              <a href={`mailto:${deal.email}`}>{deal.email}</a>
            </Space>
          ) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Phone">
          {deal.phone ? (
            <Space>
              <PhoneOutlined />
              <span>{deal.phone}</span>
            </Space>
          ) : "-"}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Descriptions title="Deal Information" bordered column={1} size="small">
        <Descriptions.Item label="Estimated Value">
          <Space>
            <DollarOutlined />
            <Text strong>{deal.currency || "USD"} {deal.estimatedValue?.toLocaleString()}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Expected Closing">
          <Space>
            <ClockCircleOutlined />
            <span>{formattedDate}</span>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Assigned To">
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <span>{deal.assignedTo ? `${deal.assignedTo.first_name} ${deal.assignedTo.last_name}` : "Unassigned"}</span>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Source">{deal.source || "-"}</Descriptions.Item>
        <Descriptions.Item label="Tags">
          {deal.tags && deal.tags.length > 0 ? (
            <Space wrap>
              {deal.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
            </Space>
          ) : "-"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {dayjs(deal.createdAt).format("MMM DD, YYYY HH:mm")}
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Title level={5}>Notes</Title>
      <Paragraph style={{ whiteSpace: "pre-wrap", padding: "12px", background: "#fafafa", borderRadius: "4px" }}>
        {deal.notes || "No notes available for this deal."}
      </Paragraph>

      <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
        <Button block icon={<MailOutlined />}>Email Client</Button>
        <Button block icon={<BuildOutlined />}>Convert to Project</Button>
      </div>
    </Drawer>
  );
};

export default DealDetailsDrawer;
