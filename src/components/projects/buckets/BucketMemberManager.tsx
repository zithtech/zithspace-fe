"use client";

import React, { useState } from "react";
import {
  Modal,
  Select,
  Space,
  Typography,
  message,
  Tag,
  Avatar,
} from "antd";
import { UserAddOutlined } from "@ant-design/icons";
import { useMembers } from "@/hooks/useGlobalData";
import { useAddBucketMember } from "@/hooks/useBuckets";

const { Title, Text } = Typography;

interface BucketMemberManagerProps {
  bucketId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function BucketMemberManager({
  bucketId,
  open,
  onClose,
  onSuccess,
}: BucketMemberManagerProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("editor");

  const { data: members = [], isLoading: membersLoading } = useMembers();
  const addMember = useAddBucketMember();

  const handleSubmit = async () => {
    if (selectedUserIds.length === 0) {
      message.warning("Please select at least one member");
      return;
    }

    try {
      // Add members one by one
      for (const userId of selectedUserIds) {
        await addMember.mutateAsync({
          bucketId,
          userId,
          role: selectedRole,
        });
      }

      message.success(
        `${selectedUserIds.length} member(s) added successfully`
      );
      setSelectedUserIds([]);
      setSelectedRole("editor");
      onSuccess();
    } catch (error: any) {
      console.error("Failed to add members:", error);
      message.error(error.message || "Failed to add members");
    }
  };

  const handleClose = () => {
    setSelectedUserIds([]);
    setSelectedRole("editor");
    onClose();
  };

  return (
    <Modal
      title={
        <div style={{ marginBottom: 20 }}>
          <Title level={4} style={{ margin: 0 }}>
            <UserAddOutlined style={{ marginRight: 8 }} />
            Add Members
          </Title>
          <Text type="secondary">Add members to this bucket</Text>
        </div>
      }
      open={open}
      onCancel={handleClose}
      onOk={handleSubmit}
      okText="Add Members"
      cancelText="Cancel"
      width={600}
      confirmLoading={addMember.isPending}
      maskClosable={false}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Select Members
          </Text>
          <Select
            mode="multiple"
            placeholder="Select members to add"
            style={{ width: "100%" }}
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            loading={membersLoading}
            showSearch
            filterOption={(input, option) => {
              const member = members.find((m) => m.value === option?.value);
              return member
                ? member.label.toLowerCase().includes(input.toLowerCase()) ||
                    member.position.toLowerCase().includes(input.toLowerCase())
                : false;
            }}
            optionRender={(option) => {
              const member = members.find((m) => m.value === option.value);
              if (!member) return null;

              return (
                <Space>
                  <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
                    {member.label.charAt(0)}
                  </Avatar>
                  <div>
                    <div>
                      <Text strong>{member.label}</Text>
                    </div>
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {member.position}
                      </Text>
                    </div>
                  </div>
                </Space>
              );
            }}
          >
            {members.map((member) => (
              <Select.Option key={member.value} value={member.value}>
                {member.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Role
          </Text>
          <Select
            value={selectedRole}
            onChange={setSelectedRole}
            style={{ width: "100%" }}
            options={[
              {
                label: (
                  <Space>
                    <Tag color="blue">EDITOR</Tag>
                    <Text type="secondary">Can view and manage tickets</Text>
                  </Space>
                ),
                value: "editor",
              },
              {
                label: (
                  <Space>
                    <Tag color="default">VIEWER</Tag>
                    <Text type="secondary">
                      Can only view tickets
                    </Text>
                  </Space>
                ),
                value: "viewer",
              },
            ]}
          />
        </div>

        {selectedUserIds.length > 0 && (
          <div
            style={{
              padding: 12,
              background: "#f5f5f5",
              borderRadius: 8,
            }}
          >
            <Text type="secondary">
              Adding {selectedUserIds.length} member(s) as{" "}
              <Tag color={selectedRole === "editor" ? "blue" : "default"}>
                {selectedRole.toUpperCase()}
              </Tag>
            </Text>
          </div>
        )}
      </Space>
    </Modal>
  );
}
