"use client";

import React, { useState } from "react";
import { Card, Input, Button, Divider, List, Avatar, Typography, Space, message } from "antd";
import { SendOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
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
    <Card title="Comments" style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <TextArea
          rows={3}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div style={{ marginTop: 8, textAlign: "right" }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={isAddingComment}
            onClick={handleAddComment}
            disabled={!newComment.trim()}
          >
            Add Comment
          </Button>
        </div>
      </div>

      <Divider />

      <List
        dataSource={comments}
        renderItem={(comment) => {
          // Handle user data from React Query response
          const userName = (comment as any).user?.name || "Unknown User";

          const isEditingThis = editingCommentId === comment.id;

          if (isEditingThis) {
            // Show inline edit form
            return (
              <List.Item>
                <div style={{ width: "100%", padding: "12px", background: "#fafafa", borderRadius: "8px" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <Text strong>Edit Comment</Text>
                  </div>
                  <TextArea
                    rows={3}
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    style={{ marginBottom: "12px" }}
                  />
                  <div style={{ textAlign: "right" }}>
                    <Space>
                      <Button
                        size="small"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditCommentText("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          if (!editCommentText.trim()) {
                            message.error("Comment cannot be empty");
                            return;
                          }
                          // Note: Update functionality would need to be passed as prop
                          message.info("Comment update not implemented in this component");
                          setEditingCommentId(null);
                          setEditCommentText("");
                        }}
                      >
                        Save
                      </Button>
                    </Space>
                  </div>
                </div>
              </List.Item>
            );
          }

          // Show normal comment display
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
                          setEditingCommentId(comment.id);
                          setEditCommentText(comment.comment);
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
                        loading={isDeletingComment}
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </Button>,
                    ]
                  : []
              }
            >
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Avatar
                    style={{ backgroundColor: "#1677ff", marginRight: 8 }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Text strong>{userName}</Text>
                    <div style={{ fontSize: 12, color: "#999" }}>
                      {dayjs(comment?.timestamp).format(
                        "MMMM DD, YYYY HH:mm"
                      )}
                    </div>
                  </div>
                </div>
                <Paragraph style={{ marginLeft: 40, marginBottom: 0 }}>
                  {comment?.comment}
                </Paragraph>
              </div>
            </List.Item>
          );
        }}
        locale={{ emptyText: "No comments yet" }}
      />
    </Card>
  );
}
