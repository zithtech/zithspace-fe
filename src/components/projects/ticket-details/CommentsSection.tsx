"use client";

import React, { useState } from "react";
import { Card, Input, Button, Divider, List, Avatar, Typography, Space, message } from "antd";
import { SendOutlined, EditOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);
import { TicketComment } from "@/types/ticket";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface CommentsSectionProps {
  comments: any[];
  isEditing: boolean;
  onAddComment: (comment: string) => Promise<void>;
  onEditComment?: (commentId: string, comment: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  isAddingComment: boolean;
  isEditingComment?: boolean;
  isDeletingComment: boolean;
}

export default function CommentsSection({
  comments,
  isEditing,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isAddingComment,
  isEditingComment,
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

  const handleEditComment = async (commentId: string) => {
    if (!editCommentText.trim() || !onEditComment) return;
    try {
      await onEditComment(commentId, editCommentText);
      setEditingCommentId(null);
      message.success("Comment updated successfully");
    } catch (error) {
      console.error("Failed to update comment:", error);
      message.error("Failed to update comment");
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Title level={5} style={{ fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Conversation</Text>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>• {comments.length} messages</span>
      </Typography.Title>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Comment List */}
        <div className="comments-list-container" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: 8, border: '1px dashed var(--border-color)' }}>
               <Text type="secondary" style={{ fontSize: 13 }}>No conversation started yet</Text>
            </div>
          ) : (
            comments.map((comment) => {
              const userName = (comment as any).user?.name || "System";
              const isEditingThis = editingCommentId === comment.id;

              return (
                <div key={comment.id} className="comment-bubble-wrapper" style={{ display: 'flex', gap: 10 }}>
                  <Avatar 
                    size={28} 
                    src={(comment as any).user?.avatarUrl}
                    style={{ 
                      backgroundColor: (comment as any).user?.name ? "#1890ff" : "#bfbfbf", 
                      fontSize: 12,
                      marginTop: 4,
                      flexShrink: 0
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </Avatar>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditingThis ? (
                      <div style={{ 
                        backgroundColor: 'var(--bg-secondary)', 
                        border: '1px solid #1890ff', 
                        borderRadius: 12, 
                        padding: 8,
                        boxShadow: '0 2px 8px rgba(24, 144, 255, 0.1)'
                      }}>
                        <TextArea
                          rows={2}
                          value={editCommentText}
                          onChange={(e) => setEditCommentText(e.target.value)}
                          autoFocus
                          variant="borderless"
                          style={{ marginBottom: 4, fontSize: 13, padding: 4 }}
                        />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                          <Button size="small" type="text" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                          <Button
                            size="small"
                            type="primary"
                            style={{ borderRadius: 6 }}
                            loading={isEditingComment && editingCommentId === comment.id}
                            onClick={() => handleEditComment(comment.id)}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                        <div className="comment-content-container" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="comment-bubble" style={{ 
                            backgroundColor: 'var(--bg-secondary)', 
                            padding: '10px 14px', 
                            borderRadius: '0 12px 12px 12px',
                            display: 'inline-block',
                            maxWidth: '100%',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.2s'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
                              <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{userName}</Text>
                              <Text type="secondary" style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{dayjs(comment?.timestamp).fromNow()}</Text>
                            </div>
                            <Paragraph style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {comment?.comment}
                            </Paragraph>
                          </div>
                          
                          {/* Hover Actions */}
                          <div className="comment-actions" style={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 4,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            flexShrink: 0
                          }}>
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />}
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditCommentText(comment.comment);
                              }}
                              className="action-btn"
                              style={{ height: 24, width: 24, padding: 0 }}
                            />
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                              loading={isDeletingComment}
                              onClick={() => handleDeleteComment(comment.id)}
                              className="action-btn"
                              style={{ height: 24, width: 24, padding: 0 }}
                            />
                          </div>
                        </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Area */}
        <div style={{ 
          marginTop: 8,
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          padding: 8,
          transition: 'border-color 0.2s, box-shadow 0.2s',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }} className="comment-input-wrapper">
          <TextArea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            autoSize={{ minRows: 1, maxRows: 6 }}
            variant="borderless"
            style={{ fontSize: 13, padding: '4px 8px' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddComment();
              }
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginTop: 4,
            padding: '4px 8px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Press Enter to send, Shift+Enter for newline</Text>
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined style={{ fontSize: 12 }} />}
              loading={isAddingComment}
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              style={{ 
                borderRadius: 6, 
                height: 28, 
                padding: '0 12px',
                fontWeight: 600,
                boxShadow: newComment.trim() ? '0 2px 4px rgba(24, 144, 255, 0.2)' : 'none'
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .comment-content-container:hover .comment-actions {
          opacity: 1 !important;
        }
        .comment-bubble:hover {
          filter: brightness(0.97);
          border-color: #1890ff40 !important;
        }
        .action-btn:hover {
          background-color: var(--border-color) !important;
        }
        .comment-input-wrapper:focus-within {
          border-color: #1890ff !important;
          box-shadow: 0 0 0 2px rgba(24,144,255,0.1) !important;
        }
      `}</style>
    </div>
  );
}
