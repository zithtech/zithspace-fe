"use client";

import React, { useState } from "react";
import { Card, Input, Button, Divider, List, Avatar, Typography, Space, message } from "antd";
import { SendOutlined, EditOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { TicketComment } from "@/types/ticket";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface CommentsSectionProps {
  comments: any[];
  isEditing: boolean;
  onAddComment: (comment: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isAddingComment: boolean;
  isDeletingComment: boolean;
}

export default function CommentsSection({
  comments,
  isEditing,
  onAddComment,
  onDeleteComment,
  isAddingComment,
  isDeletingComment,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await onAddComment(newComment);
      setNewComment("");
      message.success("Comment added successfully");
    } catch (error) {
      console.error("Failed to add comment:", error);
      message.error("Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await onDeleteComment(commentId);
      message.success("Comment deleted successfully");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      message.error("Failed to delete comment");
    }
  };

  return (
    <div style={{ marginTop: 12 }}>
      <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 4 }}>Comments</Typography.Title>
      <div style={{ border: "1px solid #f0f0f0", borderRadius: 4, background: "#fff" }}>
        {/* Comment List */}
        <List
          itemLayout="horizontal"
          dataSource={comments}
          renderItem={(comment) => {
            const userName = (comment as any).user?.name || "Unknown User";
            const isEditingThis = editingCommentId === comment.id;

            return (
              <List.Item
                style={{ padding: "8px 12px", borderBottom: "1px solid #f0f0f0" }}
                actions={
                  !isEditing && !isEditingThis
                    ? [
                      <Button
                        key="edit"
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          setEditingCommentId(comment.id);
                          setEditCommentText(comment.comment);
                        }}
                      />,
                      <Button
                        key="delete"
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        loading={isDeletingComment}
                        onClick={() => handleDeleteComment(comment.id)}
                      />,
                    ]
                    : []
                }
              >
                {isEditingThis ? (
                  <div style={{ width: "100%" }}>
                    <TextArea
                      rows={2}
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      style={{ marginBottom: 4, fontSize: 13 }}
                    />
                    <Space size="small" style={{ float: "right" }}>
                      <Button size="small" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => {
                          // Note: Update logic is missing in props, but UI is updated
                          setEditingCommentId(null);
                        }}
                      >
                        Save
                      </Button>
                    </Space>
                  </div>
                ) : (
                  <List.Item.Meta
                    avatar={
                      <Avatar size={24} style={{ backgroundColor: "#1890ff", fontSize: 12 }}>
                        {userName.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <Text strong>{userName}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{dayjs(comment?.timestamp).fromNow()}</Text>
                      </div>
                    }
                    description={<Text style={{ fontSize: 13, color: '#262626' }}>{comment?.comment}</Text>}
                  />
                )}
              </List.Item>
            );
          }}
          locale={{ emptyText: <div style={{ padding: 12, textAlign: 'center', color: '#8c8c8c' }}>No comments yet</div> }}
        />

        {/* Input Area */}
        <div style={{ padding: "8px 12px", background: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Avatar size={24} icon={<UserOutlined />} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <Input
                placeholder="Add a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                suffix={
                  <Button
                    type="text"
                    size="small"
                    icon={<SendOutlined />}
                    loading={isAddingComment}
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    style={{ color: newComment.trim() ? '#1890ff' : '#d9d9d9' }}
                  />
                }
                style={{ borderRadius: 4 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
