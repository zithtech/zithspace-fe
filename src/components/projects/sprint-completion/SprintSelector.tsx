"use client";

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React from "react";
import {
  Card,
  Radio,
  Button,
  Space,
  Tag,
  Typography,
  Empty,
  Divider,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { ReleasePlan } from "@/services/releasePlanService";

const { Text } = Typography;

interface SprintSelectorProps {
  visible: boolean;
  sprints: ReleasePlan[];
  loading: boolean;
  selectedSprintId: string | null;
  onSelectSprint: (sprintId: string) => void;
  onCreateNewSprint: () => void;
  onClose: () => void;
}

export function SprintSelector({
  visible,
  sprints,
  loading,
  selectedSprintId,
  onSelectSprint,
  onCreateNewSprint,
  onClose,
}: SprintSelectorProps) {
  if (!visible) return null;

  return (
    <Card
      style={{
        marginTop: 12,
        maxHeight: 400,
        overflowY: "auto",
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <Text strong>Select Sprint or Create New:</Text>
      </div>

      {/* Existing Sprints List */}
      {sprints.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 8 }}
          >
            AVAILABLE SPRINTS
          </Text>
          <Radio.Group
            value={selectedSprintId}
            onChange={(e) => onSelectSprint(e.target.value)}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            {loading ? (
              <ZukvoLoader size="sm" />
            ) : (
              sprints.map((sprint) => (
                <Radio
                  key={sprint.id}
                  value={sprint.id}
                  style={{ padding: 8, borderRadius: 4 }}
                >
                  <Space>
                    <span style={{ fontWeight: 500 }}>{sprint.version || sprint.name}</span>
                    <Tag
                      color={
                        sprint.status === "active"
                          ? "green"
                          : sprint.status === "planning"
                          ? "blue"
                          : "default"
                      }
                    >
                      {sprint.status.toUpperCase()}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ({sprint.totalTickets || 0} tickets)
                    </Text>
                  </Space>
                </Radio>
              ))
            )}
          </Radio.Group>

          <Divider style={{ margin: "12px 0" }} />
        </div>
      )}

      {/* No Sprints Message */}
      {sprints.length === 0 && !loading && (
        <NoData description="No sprints available" />
      )}

      {/* Create New Sprint Button */}
      <Button
        type="dashed"
        block
        icon={<PlusOutlined />}
        onClick={onCreateNewSprint}
        style={{ marginTop: 8 }}
      >
        Create New Sprint
      </Button>
    </Card>
  );
}
