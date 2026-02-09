"use client"
import { Space, Typography } from "antd";
import React from "react";
const { Title, Paragraph } = Typography;

type Props = {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
};

function Header({ icon, title, description }: Props) {
  return (
    <div style={{ marginBottom: 32 }}>
      <Space align="center">
        {icon}
        <Title level={2} style={{ margin: 0 }}>
          {title ?? ""}
        </Title>
      </Space>
      <Paragraph style={{ marginTop: 8, fontSize: 16, color: "#666" }}>
        {description ?? ""}
      </Paragraph>
    </div>
  );
}

export default Header;
