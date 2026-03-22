"use client";
//Components
import React, { useState, useEffect } from "react";
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
  ArrowLeftOutlined,
  BranchesOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { useTicketComments, useTicketAttachments, useTicketLinks, useAddComment, useDeleteComment, useUploadAttachment, useDeleteAttachment, useAddRelatedLink, useUpdateRelatedLink, useDeleteRelatedLink } from "@/hooks/useTicketDetails";
import { useTicket, useUpdateTicket, ticketKeys } from "@/hooks/useTickets";
import { useMembers, useTicketConfig, useUserProjects } from "@/hooks/useGlobalData";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { PRIORITY_OPTIONS, TYPE_OPTIONS, STATUS_OPTIONS, getStatusColor, getPriorityColor, getTypeColor, getPlatformColor, getTaskLevelColor, getStackColor } from "@/utils/ticketUtils";
import { EditableField } from "./editable/EditableField";
import { EditableSelect } from "./editable/EditableSelect";
import { DrawerField } from "./DrawerField";
import { EditableDate } from "./editable/EditableDate";
import TiptapEditor from "@/components/common/TiptapEditor";
import AttachmentList from "@/components/common/AttachmentList"; // Default export
import {
  AttachmentsSection,
  CommentsSection,
  RelatedLinksSection,
  ActivityTimeline,
} from "../ticket-details";
import SubtasksSection from "../ticket-details/SubtasksSection";
import CodeIntegrationSection from "../ticket-details/code/CodeIntegrationSection";
import TicketService from "@/services/ticketService";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";

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
  const [editorContent, setEditorContent] = useState('');

  // Navigation State
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  const [timeEntries, setTimeEntries] = useState<TimeTrackingEntry[]>([]);
  const [timeEntriesLoading, setTimeEntriesLoading] = useState(false);

  // Data Hooks - Use currentTicketId instead of ticketId prop
  const { data: ticket, isLoading: ticketLoading } = useTicket(currentTicketId || "");
  const { activeEntry } = useTimeTrackerStore();

  // Fetch parent ticket if current is a subtask using useQuery directly
  const { data: parentTicket, isLoading: parentLoading } = useQuery({
    queryKey: ticketKeys.detail(ticket?.parentId || ''),
    queryFn: () => TicketService.getTicketById(ticket?.parentId || ''),
    enabled: !!ticket?.parentId,
    staleTime: 5 * 60 * 1000,
  });

  // Debug logging
  useEffect(() => {
    if (ticket) {
      console.log('Current ticket:', ticket.ticketNumber, 'parentId:', ticket.parentId);
      console.log('Parent ticket:', parentTicket?.ticketNumber, 'loading:', parentLoading);
    }
  }, [ticket, parentTicket, parentLoading]);
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(currentTicketId || "");
  const { data: relatedLinks = [], isLoading: linksLoading } = useTicketLinks(currentTicketId || "");
  const { data: attachments = [], isLoading: attachmentsLoading } = useTicketAttachments(currentTicketId || "");

  // Update editor content when description changes externally
  React.useEffect(() => {
    if (ticket?.description) {
      setEditorContent(ticket.description);
    }
  }, [ticket?.description]);

  // Reset navigation state when drawer opens/closes
  useEffect(() => {
    if (open && ticketId) {
      setCurrentTicketId(ticketId);
      setNavigationStack([]);
    } else if (!open) {
      setCurrentTicketId(null);
      setNavigationStack([]);
      setTimeEntries([]);
    }
  }, [open, ticketId]);

  // Load time tracking entries for this ticket
  useEffect(() => {
    if (!currentTicketId) return;
    setTimeEntriesLoading(true);
    TimeTrackingService.getEntries({ ticketId: currentTicketId })
      .then(setTimeEntries)
      .catch(() => setTimeEntries([]))
      .finally(() => setTimeEntriesLoading(false));
  }, [currentTicketId, activeEntry?.status]);

  // Navigation handlers
  const navigateToTicket = (ticketId: string) => {
    if (currentTicketId) {
      setNavigationStack(prev => [...prev, currentTicketId]);
    }
    setCurrentTicketId(ticketId);
  };

  const navigateBack = () => {
    const newStack = [...navigationStack];
    const previousTicketId = newStack.pop();
    setNavigationStack(newStack);
    if (previousTicketId) {
      setCurrentTicketId(previousTicketId);
    }
  };

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
      color: getPriorityColor(p.value),
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
      color: getTypeColor(t.value),
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
      color: getPlatformColor(p.value),
    })) || [];
  const stacks =
    ticketConfig?.stacks?.map((s: any) => ({
      label: s.label,
      value: s.value,
      color: getStackColor(s.value),
    })) || [];
  const taskLevels =
    ticketConfig?.taskLevels?.map((l: any) => ({
      label: l.label,
      value: l.value,
      color: getTaskLevelColor(l.value),
    })) || [];

  const statuses = STATUS_OPTIONS.map(s => ({
    ...s,
    color: getStatusColor(s.value)
  }));

  const projectMembers = members.map((m) => ({
    label: m.label,
    value: m.value,
    avatar: m.label.charAt(0),
  }));

  // Handlers
  const handleUpdate = async (field: string, value: any) => {
    if (!currentTicketId) return;
    try {
      await updateTicketMutation.mutateAsync({
        id: currentTicketId,
        data: { [field]: value }
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

  // Renderers
  if (!currentTicketId) return null;

  return (
    <Drawer
      title={
        <Row justify="space-between" align="middle" style={{ paddingLeft: 12, paddingRight: 12 }}>
          <Space>
            {/* Show back button + parent/subtask format for subtasks */}
            {ticket?.parentId ? (
              <Space size={8}>
                <Tooltip title="Back to parent ticket">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowLeftOutlined />}
                    onClick={navigateBack}
                    style={{
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  />
                </Tooltip>
                <Tag
                  color="blue"
                  style={{
                    fontSize: 14,
                    padding: '4px 8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={navigateBack}
                  className="parent-ticket-badge"
                >
                  {parentTicket?.ticketNumber || '...'}
                </Tag>
                <span style={{ color: '#8c8c8c' }}>/</span>
                <Tag color="default" style={{ fontSize: 14, padding: '4px 8px' }}>
                  {ticket.ticketNumber}
                </Tag>
              </Space>
            ) : (
              /* Show just ticket badge for main tickets */
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>
                {ticket?.ticketNumber || '...'}
              </Tag>
            )}
          </Space>
          <Space>
            <Tooltip title="Copy Public Link">
              <Button
                type="text"
                icon={<ShareAltOutlined />}
                onClick={() => {
                  if (ticket?.id) {
                    const url = `${window.location.origin}/public/tickets/${ticket.id}`;
                    navigator.clipboard.writeText(url).then(() => {
                      message.success('Public link copied to clipboard!');
                    });
                  }
                }}
              />
            </Tooltip>
            <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
          </Space>

          {/* Hover effect for parent ticket badge */}
          <style jsx global>{`
                        .parent-ticket-badge:hover {
                            opacity: 0.8;
                            transform: translateY(-1px);
                        }
                    `}</style>
        </Row>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={900} // Reduced width for compact layout
      styles={{ body: { padding: 0 } }}
      closeIcon={null} // Custom close in title
    >
      {!ticket ? (
        <div style={{ padding: 40, textAlign: "center" }}><Text>Loading...</Text></div>
      ) : (
        <Row style={{ height: '100%' }}>
          {/* LEFT COLUMN: Main Content (Title, Description, Activity) */}
          <Col xs={24} md={15} style={{ padding: 24, paddingRight: 32, borderRight: '1px solid #f0f0f0', overflowY: 'auto', height: '100%' }}>

            {/* Title */}
            <div style={{ marginBottom: 24 }}>
              <EditableField
                value={ticket.title}
                onSave={(val) => handleUpdate('title', val)}
                textStyle={{ fontSize: 20, fontWeight: 600, lineHeight: 1.4, margin: '0' }}
                type="textarea"
                placeholder="Ticket Title"
                editIconVisibility="hover"
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 32 }}>
              <DrawerField
                label="Description"
                layout="vertical"
                action={!descriptionEditorOpen && (
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
              >

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
                      <div className="prose max-w-none focus:outline-none"
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
              </DrawerField>
            </div>

            {/* Subtasks Section - Conditional Rendering */}
            <div style={{ marginBottom: 32 }}>
              {ticket.parentId ? (
                // Current ticket IS a subtask - show info message
                // <div style={{
                //     padding: '16px',
                //     background: '#f6f6f6',
                //     borderRadius: 8,
                //     border: '1px solid #e8e8e8'
                // }}>
                //     <Space direction="vertical" size={4}>
                //         <Text type="secondary" style={{ fontSize: 13 }}>
                //             <InfoCircleOutlined /> Subtasks cannot have nested subtasks
                //         </Text>
                //         {parentTicket && (
                //             <Text type="secondary" style={{ fontSize: 12 }}>
                //                 This is a subtask of{' '}
                //                 <Button
                //                     type="link"
                //                     size="small"
                //                     onClick={navigateBack}
                //                     style={{ padding: 0, height: 'auto' }}
                //                 >
                //                     {parentTicket.ticketNumber}
                //                 </Button>
                //             </Text>
                //         )}
                //     </Space>
                // </div>
                null
              ) : (
                // Current ticket is a main ticket - show subtasks section
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                  <SubtasksSection
                    tickets={ticket.subTasks || []}
                    parentId={ticket.id}
                    projectId={typeof ticket?.project === 'string' ? ticket.project : ticket?.project?.id || ""}
                    members={members}
                    onSubtaskClick={navigateToTicket}
                  />
                </div>
              )}
            </div>

            <Divider />

            {/* Tabs for Comments, Attachments, etc. */}
            <Tabs
              defaultActiveKey="comments"
              items={[
                {
                  key: 'comments',
                  label: `Comments (${comments.length})`,
                  children: (
                    <CommentsSection
                      comments={comments}
                      isEditing={false} // pass false to enable Edit/Delete actions on items
                      onAddComment={async (c) => await addCommentMutation.mutateAsync({ ticketId: currentTicketId, comment: c })}
                      onDeleteComment={async (id) => await deleteCommentMutation.mutateAsync({ ticketId: currentTicketId, commentId: id })}
                      isAddingComment={addCommentMutation.isPending}
                      isDeletingComment={deleteCommentMutation.isPending}
                    />
                  )
                },
                {
                  key: 'attachments',
                  label: `Attachments (${attachments.length})`,
                  children: (
                    <AttachmentsSection
                      attachments={attachments}
                      isLoading={attachmentsLoading}
                      isEditing={false} // pass false to enable Uploader
                      onUpload={async (f, n) => await uploadAttachmentMutation.mutateAsync({ ticketId: currentTicketId, file: f, fileName: n })}
                      onDelete={async (id) => await deleteAttachmentMutation.mutateAsync({ ticketId: currentTicketId, attachmentId: id })}
                    />
                  )
                },
                {
                  key: 'links',
                  label: `Links (${relatedLinks.length})`,
                  children: (
                    <RelatedLinksSection
                      relatedLinks={relatedLinks}
                      isEditing={false} // pass false to enable Add Link and specific item actions
                      onAddLink={async (t, d) => { await addLinkMutation.mutateAsync({ ticketId: currentTicketId, linkData: { linkType: t, ...d } }) }}
                      onUpdateLink={async (id, d) => { await updateLinkMutation.mutateAsync({ ticketId: currentTicketId, linkId: id, linkData: d }) }}
                      onDeleteLink={async (id) => { await deleteLinkMutation.mutateAsync({ ticketId: currentTicketId, linkId: id }) }}
                      isAddingLink={addLinkMutation.isPending}
                      isUpdatingLink={updateLinkMutation.isPending}
                      isDeletingLink={deleteLinkMutation.isPending}
                    />
                  )
                },
                {
                  key: 'timeline',
                  label: 'Timeline',
                  children: (
                    <ActivityTimeline ticketId={currentTicketId} />
                  )
                },
                {
                  key: 'code',
                  label: 'Code',
                  children: (
                    <div style={{ paddingTop: 16 }}>
                      {currentTicketId ? (
                        <CodeIntegrationSection
                          ticketId={currentTicketId}
                          isEditing={false}
                        />
                      ) : (
                        <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
                          Loading ticket context...
                        </div>
                      )}
                    </div>
                  )
                }
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
              <DrawerField label="Status">
                <EditableSelect
                  value={ticket.status}
                  options={statuses}
                  onSave={(val) => handleUpdate("status", val)}
                  mode="tag"
                />
              </DrawerField>

              {/* Collapsible Sections */}
              <div className="sidebar-collapse-wrapper">
                <Collapse
                  defaultActiveKey={["details", "planning"]}
                  ghost={false} // Turn off ghost to allow custom background/borders
                  expandIconPosition="end"
                  bordered={false} // We will add our own borders
                  items={[
                    {
                      key: "details",
                      label: (
                        <Space>
                          <InfoCircleOutlined />
                          <Text strong style={{ fontSize: 13 }}>
                            Details
                          </Text>
                        </Space>
                      ),
                      children: (
                        <>
                          <Row gutter={[12, 16]}>
                            <Col span={24}>
                              <DrawerField label="Assignee">
                                <EditableSelect
                                  value={
                                    typeof ticket.assignee === "string"
                                      ? ticket.assignee
                                      : ticket.assignee?.id
                                  }
                                  options={projectMembers}
                                  onSave={(val) =>
                                    handleUpdate("assignee", val)
                                  }
                                  mode="user"
                                  emptyText="Unassigned"
                                />
                              </DrawerField>
                            </Col>

                            <Col span={24}>
                              <DrawerField label="Report To">
                                <EditableSelect
                                  value={
                                    typeof ticket.reportTo === "string"
                                      ? ticket.reportTo
                                      : ticket.reportTo?.id
                                  }
                                  options={projectMembers}
                                  onSave={(val) =>
                                    handleUpdate("reportTo", val)
                                  }
                                  mode="user"
                                  emptyText="No Reporter"
                                />
                              </DrawerField>

                              <DrawerField label="Platform">
                                <EditableSelect
                                  value={ticket.platform}
                                  options={platforms}
                                  onSave={(val) => handleUpdate("platform", val)}
                                  mode="tag"
                                  emptyText="Select Platform"
                                />
                              </DrawerField>
                            </Col>

                            {ticket.platform === "Development" && (
                              <Col span={24}>
                                <DrawerField label="Stack">
                                  <EditableSelect
                                    value={ticket.stack || ticket.metadata?.stack}
                                    options={stacks}
                                    onSave={(val) => handleUpdate("stack", val)}
                                    mode="tag"
                                    emptyText="Select Stack"
                                  />
                                </DrawerField>
                              </Col>
                            )}

                            <Col span={24}>
                              <DrawerField label="Priority">
                                <EditableSelect
                                  value={ticket.priority}
                                  options={priorities}
                                  onSave={(val) => handleUpdate("priority", val)}
                                  mode="tag"
                                />
                              </DrawerField>
                            </Col>
                            <Col span={24}>
                              <DrawerField label="Type">
                                <EditableSelect
                                  value={ticket.type}
                                  options={types}
                                  onSave={(val) => handleUpdate("type", val)}
                                  mode="tag"
                                />
                              </DrawerField>
                            </Col>
                            <Col span={24}>
                              <DrawerField label="Task Level">
                                <EditableSelect
                                  value={ticket.taskLevel}
                                  options={taskLevels}
                                  onSave={(val) => handleUpdate("taskLevel", val)}
                                  mode="tag"
                                />
                              </DrawerField>
                            </Col>
                          </Row>
                        </>
                      ),
                    },
                    {
                      key: "planning",
                      label: (
                        <Space>
                          <CalendarOutlined />
                          <Text strong style={{ fontSize: 13 }}>
                            Planning
                          </Text>
                        </Space>
                      ),
                      children: (
                        <Row gutter={[12, 16]}>
                          <Col span={24}>
                            <DrawerField label="Story Points">
                              <div style={{ marginTop: 4 }}>
                                <EditableField
                                  value={ticket.storyPoint}
                                  onSave={(val) =>
                                    handleUpdate("storyPoint", Number(val))
                                  }
                                  type="number"
                                  emptyText="-"
                                  textStyle={{
                                    background: "#e6f7ff",
                                    borderRadius: 12,
                                    padding: "2px 8px",
                                    color: "#096dd9",
                                    fontWeight: 600,
                                    width: "fit-content",
                                    minWidth: 24,
                                    textAlign: "center",
                                  }}
                                />
                              </div>
                            </DrawerField>
                          </Col>
                          <Col span={24}>
                            <DrawerField label="Estimate (h)">
                              <div style={{ marginTop: 4 }}>
                                <EditableField
                                  value={ticket.estimateHours}
                                  onSave={(val) =>
                                    handleUpdate("estimateHours", Number(val))
                                  }
                                  type="number"
                                  emptyText="-"
                                />
                              </div>
                            </DrawerField>
                          </Col>
                          <Col span={24}>
                            <DrawerField label="Start Date">
                              <EditableDate
                                value={ticket.startDate}
                                onSave={(val) => handleUpdate("startDate", val)}
                                placeholder="Start"
                              />
                            </DrawerField>
                          </Col>
                          <Col span={24}>
                            <DrawerField label="Due Date">
                              <EditableDate
                                value={ticket.endDate}
                                onSave={(val) => handleUpdate("endDate", val)}
                                placeholder="Due By"
                              />
                            </DrawerField>
                          </Col>
                        </Row>
                      ),
                    },
                    {
                      key: "time-tracking",
                      label: (
                        <Space>
                          <FieldTimeOutlined />
                          <Text strong style={{ fontSize: 13 }}>Time Tracked</Text>
                          {timeEntries.length > 0 && (
                            <Tag color="blue" style={{ marginLeft: 4 }}>
                              {(() => {
                                const total = timeEntries.reduce((sum, e) => {
                                  let duration = e.duration || 0;
                                  if (e.status === 'RUNNING') {
                                    const lastLog = e.logs?.find(l => l.action === 'STARTED' || l.action === 'RESUMED');
                                    const startTime = lastLog ? new Date(lastLog.createdAt).getTime() : new Date(e.startTime).getTime();
                                    duration += Math.floor((new Date().getTime() - startTime) / 1000);
                                  }
                                  return sum + duration;
                                }, 0);
                                const h = Math.floor(total / 3600);
                                const m = Math.floor((total % 3600) / 60);
                                return `${h}h ${m}m`;
                              })()}
                            </Tag>
                          )}
                        </Space>
                      ),
                      children: timeEntriesLoading ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>Loading...</Text>
                      ) : timeEntries.length === 0 ? (
                        <Text type="secondary" style={{ fontSize: 12 }}>No time tracked yet for this ticket.</Text>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {timeEntries.map(entry => {
                            const h = Math.floor((entry.duration || 0) / 3600);
                            const m = Math.floor(((entry.duration || 0) % 3600) / 60);
                            const s = (entry.duration || 0) % 60;
                            return (
                              <div key={entry.id} style={{ padding: '8px 10px', background: '#f9fafb', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                                {/* User row */}
                                {entry.user && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                    <div style={{
                                      width: 22, height: 22, borderRadius: '50%',
                                      background: '#6366f1', color: 'white',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 10, fontWeight: 700, flexShrink: 0
                                    }}>
                                      {entry.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <Text style={{ fontSize: 11, fontWeight: 500, color: '#4b5563' }}>
                                      {entry.user.name}
                                    </Text>
                                  </div>
                                )}
                                {/* Date / time / duration row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                                      {dayjs(entry.startTime).format('ddd, MMM D YYYY')}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                      {dayjs(entry.startTime).format('h:mm A')}
                                      {entry.endTime ? ` – ${dayjs(entry.endTime).format('h:mm A')}` : ''}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                      {entry.status === 'RUNNING' && <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>Running</Tag>}
                                      {entry.status === 'PAUSED' && <Tag color="warning" style={{ fontSize: 10, margin: 0 }}>Paused</Tag>}
                                    </div>
                                    <Text strong style={{ fontSize: 13, color: entry.status === 'RUNNING' ? '#1890ff' : entry.status === 'PAUSED' ? '#faad14' : '#10b981', fontFamily: 'monospace' }}>
                                      {(() => {
                                        let duration = entry.duration || 0;
                                        if (entry.status === 'RUNNING') {
                                          const lastLog = entry.logs?.find(l => l.action === 'STARTED' || l.action === 'RESUMED');
                                          const startTime = lastLog ? new Date(lastLog.createdAt).getTime() : new Date(entry.startTime).getTime();
                                          duration += Math.floor((new Date().getTime() - startTime) / 1000);
                                        }
                                        const h = Math.floor(duration / 3600);
                                        const m = Math.floor((duration % 3600) / 60);
                                        const s = duration % 60;
                                        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
                                      })()}
                                    </Text>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>

              <style jsx global>{`
                .sidebar-collapse-wrapper .ant-collapse {
                    background: transparent;
                }
                .sidebar-collapse-wrapper .ant-collapse-item {
                    border-bottom: 1px solid #f0f0f0;
                    margin-bottom: 0;
                    border-radius: 0;
                }
                .sidebar-collapse-wrapper .ant-collapse-item:last-child {
                    border-bottom: 0;
                }
                .sidebar-collapse-wrapper .ant-collapse-header {
                    background: #fafafa !important;
                    border-radius: 0 !important;
                    padding: 12px 16px !important;
                    align-items: center !important;
                    border-bottom: 1px solid #f0f0f0 !important;
                }
                /* Remove border radius from first header if needed or keep default */
                .sidebar-collapse-wrapper .ant-collapse-item:first-child .ant-collapse-header {
                    border-top-left-radius: 8px !important;
                    border-top-right-radius: 8px !important;
                }
                
                .sidebar-collapse-wrapper .ant-collapse-content {
                    background: #fff;
                    border-top: 0; /* Header has border-bottom */
                }
                .sidebar-collapse-wrapper .ant-collapse-content-box {
                    padding: 16px 12px !important;
                }
              `}</style>
              <div
                style={{
                  marginTop: "auto",
                  paddingTop: 24,
                  fontSize: 12,
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
