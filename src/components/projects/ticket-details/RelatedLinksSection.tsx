"use client";

import React, { useState } from "react";
import { Card, Select, Space, Input, Button, List, Typography, message } from "antd";
import {
  PlusOutlined,
  BgColorsOutlined,
  FileTextOutlined,
  ApiOutlined,
  CodeOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { LinkType, RelatedLinkFormData } from "@/types/ticket";

const { Text } = Typography;

interface RelatedLinksSectionProps {
  relatedLinks: any[];
  isEditing: boolean;
  onAddLink: (linkType: LinkType, linkData: { title: string; description: string; url: string }) => Promise<void>;
  onUpdateLink: (linkId: string, linkData: { title: string; description: string; url: string }) => Promise<void>;
  onDeleteLink: (linkId: string) => Promise<void>;
  isAddingLink: boolean;
  isUpdatingLink: boolean;
  isDeletingLink: boolean;
}

export default function RelatedLinksSection({
  relatedLinks,
  isEditing,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
  isAddingLink,
  isUpdatingLink,
  isDeletingLink,
}: RelatedLinksSectionProps) {
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType | null>(null);
  const [linkFormData, setLinkFormData] = useState<RelatedLinkFormData>({
    description: "",
    url: "",
  });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

  const handleSaveLink = async () => {
    if (!linkFormData.description.trim() || !linkFormData.url.trim()) {
      message.error("Please fill in all fields");
      return;
    }

    try {
      if (editingLinkId) {
        await onUpdateLink(editingLinkId, {
          title: linkFormData.description.trim().substring(0, 100),
          description: linkFormData.description.trim(),
          url: linkFormData.url.trim(),
        });
        message.success("Link updated successfully");
      } else {
        await onAddLink(selectedLinkType!, {
          title: linkFormData.description.trim().substring(0, 100),
          description: linkFormData.description.trim(),
          url: linkFormData.url.trim(),
        });
        message.success("Link added successfully");
      }

      // Reset form
      setShowAddLinkForm(false);
      setSelectedLinkType(null);
      setLinkFormData({ description: "", url: "" });
      setEditingLinkId(null);
    } catch (error) {
      console.error("Failed to save link:", error);
      message.error("Failed to save link");
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await onDeleteLink(linkId);
      message.success("Link deleted successfully");
    } catch (error) {
      console.error("Failed to delete link:", error);
      message.error("Failed to delete link");
    }
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case "ui_design":
        return <BgColorsOutlined style={{ fontSize: "16px", color: "#1677ff" }} />;
      case "scope_doc":
        return <FileTextOutlined style={{ fontSize: "16px", color: "#52c41a" }} />;
      case "sample_response":
        return <ApiOutlined style={{ fontSize: "16px", color: "#fa8c16" }} />;
      case "dev_doc":
        return <CodeOutlined style={{ fontSize: "16px", color: "#722ed1" }} />;
      default:
        return <FileTextOutlined style={{ fontSize: "16px", color: "#999" }} />;
    }
  };

  const getLinkTypeLabel = (type: LinkType) => {
    switch (type) {
      case "ui_design":
        return "UI Design Link";
      case "scope_doc":
        return "Scope Doc Link";
      case "sample_response":
        return "Sample Response/Payload Link";
      case "dev_doc":
        return "Dev Doc Link";
      default:
        return "Link";
    }
  };

  return (
    <Card
      title="Related Links"
      style={{ marginTop: 16 }}
      extra={
        !isEditing && (
          <Select
            placeholder="Add Link"
            style={{ width: 150 }}
            value={null}
            onChange={(value: LinkType) => {
              setSelectedLinkType(value);
              setShowAddLinkForm(true);
              setLinkFormData({ description: "", url: "" });
              setEditingLinkId(null);
            }}
            suffixIcon={<PlusOutlined />}
          >
            <Select.Option value="ui_design">
              <Space>
                <BgColorsOutlined />
                UI Design Link
              </Space>
            </Select.Option>
            <Select.Option value="scope_doc">
              <Space>
                <FileTextOutlined />
                Scope Doc Link
              </Space>
            </Select.Option>
            <Select.Option value="sample_response">
              <Space>
                <ApiOutlined />
                Sample Response/Payload
              </Space>
            </Select.Option>
            <Select.Option value="dev_doc">
              <Space>
                <CodeOutlined />
                Dev Doc Link
              </Space>
            </Select.Option>
          </Select>
        )
      }
    >
      {/* Add Link Form */}
      {showAddLinkForm && selectedLinkType && (
        <div
          style={{
            background: "#fafafa",
            border: "1px solid #e8e8e8",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
          }}
        >
          <div style={{ marginBottom: "12px" }}>
            <Text strong>
              {editingLinkId ? "Edit" : "Add"} {getLinkTypeLabel(selectedLinkType)}
            </Text>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <Text>Description</Text>
            <Input
              placeholder="Enter description for this link..."
              value={linkFormData.description}
              onChange={(e) =>
                setLinkFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              style={{ marginTop: "4px" }}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <Text>URL</Text>
            <Input
              placeholder="https://..."
              value={linkFormData.url}
              onChange={(e) =>
                setLinkFormData((prev) => ({
                  ...prev,
                  url: e.target.value,
                }))
              }
              style={{ marginTop: "4px" }}
            />
          </div>

          <div style={{ textAlign: "right" }}>
            <Space>
              <Button
                size="small"
                onClick={() => {
                  setShowAddLinkForm(false);
                  setSelectedLinkType(null);
                  setLinkFormData({ description: "", url: "" });
                  setEditingLinkId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                size="small"
                loading={isAddingLink || isUpdatingLink}
                onClick={handleSaveLink}
              >
                {editingLinkId ? "Update" : "Save"} Link
              </Button>
            </Space>
          </div>
        </div>
      )}

      {/* Display existing links */}
      <div>
        {relatedLinks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#999",
              padding: "20px",
            }}
          >
            No related links added yet
          </div>
        ) : (
          <List
            dataSource={relatedLinks}
            renderItem={(link) => {
              // Check if this link is being edited
              const isEditingThis = editingLinkId === link.id;

              if (isEditingThis) {
                // Show inline edit form
                return (
                  <List.Item>
                    <div style={{ width: "100%", padding: "12px", background: "#fafafa", borderRadius: "8px" }}>
                      <div style={{ marginBottom: "12px" }}>
                        <Text strong>Edit Link</Text>
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <Text>Description</Text>
                        <Input
                          placeholder="Enter description..."
                          value={linkFormData.description}
                          onChange={(e) =>
                            setLinkFormData((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          style={{ marginTop: "4px" }}
                        />
                      </div>
                      <div style={{ marginBottom: "12px" }}>
                        <Text>URL</Text>
                        <Input
                          placeholder="https://..."
                          value={linkFormData.url}
                          onChange={(e) =>
                            setLinkFormData((prev) => ({
                              ...prev,
                              url: e.target.value,
                            }))
                          }
                          style={{ marginTop: "4px" }}
                        />
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <Space>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditingLinkId(null);
                              setLinkFormData({ description: "", url: "" });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="primary"
                            size="small"
                            loading={isUpdatingLink}
                            onClick={handleSaveLink}
                          >
                            Save
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </List.Item>
                );
              }

              // Show normal link display
              return (
                <List.Item
                  actions={
                    !isEditing
                      ? [
                          <Button
                            key="edit"
                            type="link"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => {
                              setEditingLinkId(link.id || "");
                              setLinkFormData({
                                description: link.description,
                                url: link.url,
                              });
                            }}
                          >
                            Edit
                          </Button>,
                          <Button
                            key="delete"
                            type="link"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            loading={isDeletingLink}
                            onClick={() => handleDeleteLink(link.id || "")}
                          >
                            Delete
                          </Button>,
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={getLinkIcon(link.type)}
                    title={
                      <Space>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontWeight: 500 }}
                        >
                          {link.title}
                          <ExportOutlined
                            style={{ marginLeft: "4px", fontSize: "12px" }}
                          />
                        </a>
                      </Space>
                    }
                    description={link.description}
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </Card>
  );
}
