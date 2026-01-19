"use client";

import React, { useState } from "react";
import {
  Drawer,
  Typography,
  Row,
  Col,
  Space,
  Button,
  Divider,
  Tag,
  Tabs,
  Badge,
  Descriptions,
  message,
  Tooltip,
  Collapse,
} from "antd";
import {
  CloseOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  LinkOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  UserOutlined,
  InfoCircleOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  useTicketComments,
  useTicketAttachments,
  useTicketLinks,
  useAddComment,
  useDeleteComment,
  useUploadAttachment,
  useDeleteAttachment,
  useAddRelatedLink,
  useUpdateRelatedLink,
  useDeleteRelatedLink,
} from "@/hooks/useTicketDetails";
import { useTicket, useUpdateTicket } from "@/hooks/useTickets";
import {
  useMembers,
  useTicketConfig,
  useUserProjects,
} from "@/hooks/useGlobalData";
import {
  PRIORITY_OPTIONS,
  TYPE_OPTIONS,
  getStatusColor,
  getPriorityColor,
  getTypeColor,
} from "@/utils/ticketUtils";
import { EditableField } from "./editable/EditableField";
import { EditableSelect } from "./editable/EditableSelect";
import { EditableDate } from "./editable/EditableDate";
import TiptapEditor from "@/components/common/TiptapEditor";
import AttachmentList from "@/components/common/AttachmentList"; // Default export
import {
  AttachmentsSection,
  CommentsSection,
  RelatedLinksSection,
} from "../ticket-details";
import SubtasksSection from "../ticket-details/SubtasksSection";

// Add relativeTime plugin
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const { Title, Text, Paragraph } = Typography;

interface TicketDetailDrawerProps {
  ticketId: string | null;
  onClose: () => void;
  open: boolean;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticketId,
  onClose,
  open,
}) => {
  const [descriptionEditorOpen, setDescriptionEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState("");

  // Data Hooks
  const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId || "");
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(
    ticketId || ""
  );
  const { data: relatedLinks = [], isLoading: linksLoading } = useTicketLinks(
    ticketId || ""
  );
  const { data: attachments = [], isLoading: attachmentsLoading } =
    useTicketAttachments(ticketId || "");

  // Update editor content when description changes externally
  React.useEffect(() => {
    if (ticket?.description) {
      setEditorContent(ticket.description);
    }
  }, [ticket?.description]);

  // Config Hooks
  const { data: members = [] } = useMembers();
  const { data: ticketConfig } = useTicketConfig();
  const { data: projects = [] } = useUserProjects();

  // Mutations
  const updateTicketMutation = useUpdateTicket();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const uploadAttachmentMutation = useUploadAttachment();
  const deleteAttachmentMutation = useDeleteAttachment();
  const addLinkMutation = useAddRelatedLink();
  const updateLinkMutation = useUpdateRelatedLink();
  const deleteLinkMutation = useDeleteRelatedLink();

  // Helper Options
  const priorities =
    ticketConfig?.priorities?.map((p: any) => ({
      label: p.label,
      value: p.value,
      color: "default",
    })) ||
    PRIORITY_OPTIONS.map((p) => ({
      label: p.label,
      value: p.value,
      color: getPriorityColor(p.value),
    }));

  const types =
    ticketConfig?.taskTypes?.map((t: any) => ({
      label: t.label,
      value: t.value,
      color: "default",
    })) ||
    TYPE_OPTIONS.map((t) => ({
      label: t.label,
      value: t.value,
      color: getTypeColor(t.value),
    }));

  const platforms =
    ticketConfig?.platforms?.map((p: any) => ({
      label: p.label,
      value: p.value,
      color: "default",
    })) || [];
  const stacks =
    ticketConfig?.stacks?.map((s: any) => ({
      label: s.label,
      value: s.value,
      color: "default",
    })) || [];
  const taskLevels =
    ticketConfig?.taskLevels?.map((l: any) => ({
      label: l.label,
      value: l.value,
      color: "default",
    })) || [];

  const statuses = [
    { label: "Not Started", value: "not_started", color: "default" },
    { label: "In Progress", value: "in_progress", color: "processing" },
    { label: "In Testing", value: "in_testing", color: "warning" },
    { label: "Completed", value: "completed", color: "success" },
  ];

  const projectMembers = members.map((m) => ({
    label: m.label,
    //value: m.value,
    value: String(m.value),
    avatar: m.label.charAt(0),
  }));

  // Handlers
  const handleUpdate = async (field: string, value: any) => {
    if (!ticketId) return;
    try {
      await updateTicketMutation.mutateAsync({
        id: ticketId,
        data: { [field]: value },
      });
      message.success(`${field} updated`);
    } catch (error) {
      message.error("Failed to update");
    }
  };

  const handleDescriptionSave = async () => {
    // Only update if content changed/valid.
    await handleUpdate("description", editorContent);
    setDescriptionEditorOpen(false);
  };
  const sectionContainer = {
    padding: "0",
    margin: "0",
  };

  const fieldColStyle = {
    marginBottom: 8,
    padding: "2px 0",
  };

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "4px 6px",
    borderRadius: 6,
    transition: "background-color 0.15s ease",
  };

  const labelStyle = {
    width: 90,
    fontSize: 11,
    fontWeight: 600,
    color: "#8c8c8c",
    lineHeight: "20px",
    whiteSpace: "nowrap",
  };

  const hoverRow = (e: any, enter: boolean) => {
    e.currentTarget.style.background = enter ? "#fafafa" : "transparent";
  };

  const SectionHeader = ({ icon, title }: any) => (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 8,
        transition: "background-color 0.2s ease",
        width: "100%",
        background: "#e6f7ff",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#e6f7ff")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#e6f7ff")}
    >
      {icon}
      <Text strong style={{ fontSize: 13 }}>
        {title}
      </Text>
    </div>
  );

 

  const DetailRow = ({ label, children }: any) => (
    <div
      style={rowStyle}
      onMouseEnter={(e) => hoverRow(e, true)}
      onMouseLeave={(e) => hoverRow(e, false)}
    >
      <Text style={labelStyle}>{label}</Text>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );

  // Renderers
  if (!ticketId) return null;

  return (
    <Drawer
      title={
        <Row justify="space-between" align="middle" style={{ width: "100%" }}>
          <Space>
            <Tag color="blue" style={{ fontSize: 14, padding: "4px 8px" }}>
              {ticket?.ticketNumber || "..."}
            </Tag>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  margin: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Status
              </Text>

              <EditableSelect
                value={ticket?.status}
                options={statuses}
                onSave={(val) => handleUpdate("status", val)}
                mode="tag"
              />
            </div>

            {/* <Text type="secondary" style={{ fontSize: 13 }}>
                   {ticket?.project?.name}
                </Text> */}
          </Space>
          <Space>
            <Tooltip title="Copy Link">
              <Button type="text" icon={<LinkOutlined />} />
            </Tooltip>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
          </Space>
        </Row>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={900} // Wider drawer for better layout
      styles={{ body: { padding: 0 } }}
      closeIcon={null} // Custom close in title
    >
      {!ticket ? (
        <div style={{ padding: 40, textAlign: "center" }}>
          <Text>Loading...</Text>
        </div>
      ) : (
        <Row style={{ height: "100%" }}>
          {/* LEFT COLUMN: Main Content (Title, Description, Activity) */}
          <Col
            xs={24}
            md={15}
            style={{
              padding: 24,
              paddingRight: 32,
              borderRight: "1px solid #f0f0f0",
              overflowY: "auto",
              height: "100%",
            }}
          >
            {/* Title */}
            <div style={{ marginBottom: 24 }}>
              <EditableField
                value={ticket.title}
                onSave={(val) => handleUpdate("title", val)}
                textStyle={{
                  fontSize: 20,
                  fontWeight: 600,
                  lineHeight: 1.4,
                  margin: "0",
                }}
                type="textarea"
                placeholder="Ticket Title"
                editIconVisibility="hover"
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}
                >
                  Description
                </Text>
                {!descriptionEditorOpen && (
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setDescriptionEditorOpen(true)}
                    style={{ fontSize: 12, color: "#8c8c8c" }}
                  >
                    Edit
                  </Button>
                )}
              </div>

              {descriptionEditorOpen ? (
                <div>
                  <TiptapEditor
                    content={editorContent}
                    onChange={(html) => setEditorContent(html)}
                    placeholder="Add description..."
                    minHeight={150}
                  />
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => {
                        setDescriptionEditorOpen(false);
                        setEditorContent(ticket.description || ""); // Reset on cancel
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleDescriptionSave}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="description-viewer"
                  onClick={() => setDescriptionEditorOpen(true)}
                  style={{
                    minHeight: 80,
                    cursor: "text",
                    padding: "12px",
                    border: "1px solid transparent",
                    borderRadius: 6,
                    marginLeft: -12,
                    position: "relative",
                  }}
                >
                  {ticket.description ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: ticket.description }}
                    />
                  ) : (
                    <Text type="secondary" style={{ fontStyle: "italic" }}>
                      Add a description...
                    </Text>
                  )}

                  <div
                    className="description-edit-icon"
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                  >
                    <EditOutlined
                      style={{
                        fontSize: 16,
                        color: "#1890ff",
                        background: "#e6f7ff",
                        padding: 4,
                        borderRadius: 4,
                      }}
                    />
                  </div>

                  <style jsx>{`
                    .description-viewer:hover {
                      border-color: #d9d9d9;
                      background: #fafafa;
                    }
                    .description-viewer:hover .description-edit-icon {
                      opacity: 1;
                    }
                  `}</style>
                </div>
              )}
            </div>

            {/* Subtasks Section */}
            <div style={{ marginBottom: 32 }}>
              <div
                style={{
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <SubtasksSection
                  tickets={ticket.subTasks || []}
                  parentId={ticket.id}
                  projectId={
                    typeof ticket?.project === "string"
                      ? ticket.project
                      : ticket?.project?.id || ""
                  }
                  members={members}
                />
              </div>
            </div>

            <Divider />

            {/* Tabs for Comments, Attachments, etc. */}
            <Tabs
              defaultActiveKey="comments"
              items={[
                {
                  key: "comments",
                  label: `Comments (${comments.length})`,
                  children: (
                    <CommentsSection
                      comments={comments}
                      isEditing={false} // pass false to enable Edit/Delete actions on items
                      onAddComment={async (c) =>
                        await addCommentMutation.mutateAsync({
                          ticketId,
                          comment: c,
                        })
                      }
                      onDeleteComment={async (id) =>
                        await deleteCommentMutation.mutateAsync({
                          ticketId,
                          commentId: id,
                        })
                      }
                      isAddingComment={addCommentMutation.isPending}
                      isDeletingComment={deleteCommentMutation.isPending}
                    />
                  ),
                },
                {
                  key: "attachments",
                  label: `Attachments (${attachments.length})`,
                  children: (
                    <AttachmentsSection
                      attachments={attachments}
                      isLoading={attachmentsLoading}
                      isEditing={false} // pass false to enable Uploader
                      onUpload={async (f, n) =>
                        await uploadAttachmentMutation.mutateAsync({
                          ticketId,
                          file: f,
                          fileName: n,
                        })
                      }
                      onDelete={async (id) =>
                        await deleteAttachmentMutation.mutateAsync({
                          ticketId,
                          attachmentId: id,
                        })
                      }
                    />
                  ),
                },
                {
                  key: "links",
                  label: `Links (${relatedLinks.length})`,
                  children: (
                    <RelatedLinksSection
                      relatedLinks={relatedLinks}
                      isEditing={false} // pass false to enable Add Link and specific item actions
                      onAddLink={async (t, d) => {
                        await addLinkMutation.mutateAsync({
                          ticketId,
                          linkData: { linkType: t, ...d },
                        });
                      }}
                      onUpdateLink={async (id, d) => {
                        await updateLinkMutation.mutateAsync({
                          ticketId,
                          linkId: id,
                          linkData: d,
                        });
                      }}
                      onDeleteLink={async (id) => {
                        await deleteLinkMutation.mutateAsync({
                          ticketId,
                          linkId: id,
                        });
                      }}
                      isAddingLink={addLinkMutation.isPending}
                      isUpdatingLink={updateLinkMutation.isPending}
                      isDeletingLink={deleteLinkMutation.isPending}
                    />
                  ),
                },
              ]}
            />
          </Col>

          {/* RIGHT COLUMN: Metadata Sidebar */}
          <Col
            xs={24}
            md={9}
            style={{
              padding: 24,
              background: "#fff",
              height: "100%",
              overflowY: "auto",
              borderLeft: "1px solid #f0f0f0",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Status & Transitions */}
              

              <Collapse
                defaultActiveKey={["details", "planning"]}
                ghost
                expandIconPosition="end"
                items={[
                  {
                    key: "details",
                    label: (
                      <SectionHeader
                        icon={<InfoCircleOutlined />}
                        title="Details"
                      />
                    ),
                    children: (
                      <Row gutter={[0, 0]} style={sectionContainer}>
                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Assignee">
                            <EditableSelect
                              value={
                                typeof ticket.assignee === "string"
                                  ? ticket.assignee
                                  : ticket.assignee?.id
                              }
                              options={projectMembers}
                              onSave={(v) => handleUpdate("assignee", v)}
                              mode="user"
                              emptyText="Unassigned"
                            />
                          </DetailRow>
                        </Col>
                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Report To">
                            <EditableSelect
                              value={
                                ticket.reportTo
                                  ? String(
                                      typeof ticket.reportTo === "string"
                                        ? ticket.reportTo
                                        : ticket.reportTo.id
                                    )
                                  : undefined
                              }
                              options={projectMembers}
                              onSave={(v) =>
                                handleUpdate("reportTo", v ?? null)
                              }
                              mode="user"
                              emptyText="No Reporter"
                            />
                          </DetailRow>
                        </Col>

                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Platform">
                            <EditableSelect
                              value={ticket.platform}
                              options={platforms}
                              onSave={(v) => handleUpdate("platform", v)}
                              mode="tag"
                              emptyText="Select Platform"
                            />
                          </DetailRow>
                        </Col>

                        {ticket.platform === "Development" && (
                          <Col span={24} style={fieldColStyle}>
                            <DetailRow label="Stack">
                              <EditableSelect
                                value={ticket.stack || ticket.metadata?.stack}
                                options={stacks}
                                onSave={(v) => handleUpdate("stack", v)}
                                mode="tag"
                              />
                            </DetailRow>
                          </Col>
                        )}

                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Priority">
                            <EditableSelect
                              value={ticket.priority}
                              options={priorities}
                              onSave={(v) => handleUpdate("priority", v)}
                              mode="tag"
                            />
                          </DetailRow>
                        </Col>

                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Type">
                            <EditableSelect
                              value={ticket.type}
                              options={types}
                              onSave={(v) => handleUpdate("type", v)}
                              mode="tag"
                            />
                          </DetailRow>
                        </Col>

                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Task Level">
                            <EditableSelect
                              value={ticket.taskLevel}
                              options={taskLevels}
                              onSave={(v) => handleUpdate("taskLevel", v)}
                              mode="tag"
                            />
                          </DetailRow>
                        </Col>
                      </Row>
                    ),
                  },
                  {
                    key: "planning",
                    label: (
                      <SectionHeader
                        icon={<CalendarOutlined />}
                        title="Planning"
                      />
                    ),
                    children: (
                      <Row gutter={[0, 0]} style={sectionContainer}>
                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Story Points">
                            <EditableField
                              value={ticket.storyPoint}
                              onSave={(v) =>
                                handleUpdate("storyPoint", Number(v))
                              }
                              type="number"
                              emptyText="-"
                             
                            />
                          </DetailRow>
                        </Col>

                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Estimate (h)">
                            <EditableField
                              value={ticket.estimateHours}
                              onSave={(v) =>
                                handleUpdate("estimateHours", Number(v))
                              }
                              type="number"
                              emptyText="-"
                            />
                          </DetailRow>
                        </Col>

                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Start Date">
                            <EditableDate
                              value={ticket.startDate}
                              onSave={(v) => handleUpdate("startDate", v)}
                            />
                          </DetailRow>
                        </Col>

                        <Col span={24} style={fieldColStyle}>
                          <DetailRow label="Due Date">
                            <EditableDate
                              value={ticket.endDate}
                              onSave={(v) => handleUpdate("endDate", v)}
                            />
                          </DetailRow>
                        </Col>
                      </Row>
                    ),
                  },
                ]}
              />

             
          
              <div
               
                style={{
                  marginTop: 8,
                  paddingTop: 6,
                  borderTop: "1px dashed #f0f0f0",
                  fontSize: 11,
                  color: "#8c8c8c",
                }}
              >
                Created {dayjs(ticket.createdAt).format("MMM D, YYYY")} by{" "}
                {ticket.createdBy?.name}
                <br />
                Updated {dayjs(ticket.updatedAt).fromNow()}
              </div>
            </div>
          </Col>
        </Row>
      )}
    </Drawer>
  );
};
