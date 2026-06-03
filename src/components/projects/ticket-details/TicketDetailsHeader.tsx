"use client";

import React from "react";
import { Button, Space, Row, Col } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";

interface TicketDetailsHeaderProps {
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

export default function TicketDetailsHeader({ onBack, rightContent }: TicketDetailsHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
      <Col>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Back
          </Button>
        </Space>
      </Col>
      {rightContent && <Col>{rightContent}</Col>}
    </Row>
  );
}
