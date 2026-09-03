"use client";

import React from "react";
import { Button, Card, Typography, Space } from "antd";
import { CheckCircleOutlined, PlusOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useTour } from "@/context/TourContext";
import Image from "next/image";

const { Title, Text } = Typography;

interface PostCreationSuccessScreenProps {
  itemName: string;
  itemType: string;
  onCreateAnother: () => void;
  onContinue: () => void;
}

export default function PostCreationSuccessScreen({
  itemName,
  itemType,
  onCreateAnother,
  onContinue,
}: PostCreationSuccessScreenProps) {
  const { run, stepIndex, setStepIndex } = useTour();

  const handleContinue = () => {
    if (run) {
      setStepIndex(stepIndex + 1);
    }
    onContinue();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        minHeight: "400px",
        background: "linear-gradient(135deg, rgba(238, 242, 255, 0.4) 0%, rgba(224, 231, 255, 0.4) 100%)",
        borderRadius: "12px",
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "100%",
          maxWidth: 480,
          textAlign: "center",
          borderRadius: "20px",
          boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.05)",
          background: "var(--bg-pure-white, #ffffff)",
          border: "1px solid var(--border-color, #e2e8f0)",
        }}
        styles={{ body: { padding: "40px 32px" } }}
      >
        <div style={{ position: "relative", marginBottom: 24, display: "inline-block" }}>
          {/* Robot Image */}
          <div
            style={{
              width: 110,
              height: 110,
              margin: "0 auto",
              position: "relative",
              borderRadius: "50%",
              overflow: "hidden",
              border: "4px solid #fff",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              backgroundColor: "#f8fafc",
            }}
          >
            <Image
              src="/images/robot-guide.jpg"
              alt="Success Robot"
              fill
              style={{ objectFit: "cover" }}
            />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 4,
              right: -4,
              background: "#10B981",
              borderRadius: "50%",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)",
              border: "3px solid #fff",
            }}
          >
            <CheckCircleOutlined style={{ color: "#fff", fontSize: 22 }} />
          </div>
        </div>

        <Title level={3} style={{ margin: "0 0 12px 0", fontWeight: 700 }}>
          {itemType} Created!
        </Title>
        <Text style={{ fontSize: 16, display: "block", marginBottom: 36, color: "var(--text-secondary, #64748b)" }}>
          <strong>{itemName}</strong> was successfully created and is ready.
        </Text>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Button
            type="primary"
            size="large"
            block
            icon={<ArrowRightOutlined />}
            onClick={handleContinue}
            style={{
              height: 48,
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              background: "linear-gradient(135deg, #3B82F6 0%, #4F46E5 100%)",
              border: "none",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
            }}
          >
            {run ? "Continue Tour" : "Continue"}
          </Button>
          <Button
            type="default"
            size="large"
            block
            icon={<PlusOutlined />}
            onClick={onCreateAnother}
            style={{
              height: 48,
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              color: "#3B82F6",
              borderColor: "#BFDBFE",
              background: "#EFF6FF",
            }}
          >
            Create Another
          </Button>
        </Space>
      </Card>
    </div>
  );
}
