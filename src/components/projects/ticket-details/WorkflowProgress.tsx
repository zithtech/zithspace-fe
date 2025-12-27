"use client";

import React from "react";
import { Card, Progress, Timeline, Typography, Tag } from "antd";
import { TicketDetails } from "@/types/ticket";

const { Text } = Typography;

interface WorkflowProgressProps {
  ticket: TicketDetails;
}

const workflowSteps = [
  "Scope Document",
  "KT (Knowledge Transfer)",
  "Developer Doc",
  "Grooming",
  "Dev Code Work Effort",
  "Designer Approval",
  "Testing",
  "Unit Testing",
  "Code Review",
  "Push to Live",
  "Live Test",
];

export default function WorkflowProgress({ ticket }: WorkflowProgressProps) {
  const completedSteps = (ticket as any).completedSteps || 0;
  const totalSteps = (ticket as any).totalSteps || 11;

  return (
    <Card title="Workflow Progress">
      <Progress
        percent={Math.round((completedSteps / totalSteps) * 100)}
        format={() => `${completedSteps}/${totalSteps} steps completed`}
        style={{ marginBottom: 16 }}
      />

      <Timeline
        items={workflowSteps.map((step, index) => ({
          color:
            index < completedSteps
              ? "green"
              : index === completedSteps
              ? "blue"
              : "gray",
          children: (
            <div>
              <Text strong={index === completedSteps}>
                {step}
              </Text>
              {index === completedSteps && (
                <Tag color="processing" style={{ marginLeft: 8 }}>
                  Current
                </Tag>
              )}
            </div>
          ),
        }))}
      />
    </Card>
  );
}
