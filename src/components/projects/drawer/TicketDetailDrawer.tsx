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
  Avatar,
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
  ArrowRightOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  PlayCircleOutlined,
  BugOutlined,
  CheckOutlined,
  RocketOutlined,
  PauseCircleOutlined,
  CheckSquareOutlined,
  HistoryOutlined,
  MessageOutlined,
  PaperClipOutlined,
  CodeOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { useTicketComments, useTicketAttachments, useTicketLinks, useAddComment, useUpdateComment, useDeleteComment, useUploadAttachment, useDeleteAttachment, useRenameAttachment, useAddRelatedLink, useUpdateRelatedLink, useDeleteRelatedLink } from "@/hooks/useTicketDetails";
import { useTicket, useUpdateTicket, ticketKeys } from "@/hooks/useTickets";
import { useMembers, useTicketConfig, useUserProjects } from "@/hooks/useGlobalData";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { useAuth } from "@/context/AuthContext";
import {
  PRIORITY_OPTIONS,
  TYPE_OPTIONS,
  STATUS_OPTIONS,
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getTypeColor,
  getPlatformColor,
  getTaskLevelColor,
  getStackColor
} from "@/utils/ticketUtils";
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
  ticketIds?: string[];
  onNavigate?: (id: string) => void;
}

export const TicketDetailDrawer: React.FC<TicketDetailDrawerProps> = ({
  ticketId,
  onClose,
  open,
  ticketIds = [],
  onNavigate,
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
    setEditorContent(ticket?.description || "");
  }, [ticket?.description]);

  // Pagination Navigation
  const currentIndex = ticketIds.indexOf(currentTicketId || "");
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < ticketIds.length - 1 && currentIndex !== -1;

  const navigateToPrevious = () => {
    if (hasPrevious && onNavigate) {
      onNavigate(ticketIds[currentIndex - 1]);
    }
  };

  const navigateToNext = () => {
    if (hasNext && onNavigate) {
      onNavigate(ticketIds[currentIndex + 1]);
    }
  };

  // Reset navigation stack when ticketId prop changes
  useEffect(() => {
    if (open && ticketId) {
      setCurrentTicketId(ticketId);
      setNavigationStack([]);
    } else if (!open) {
      setCurrentTicketId(null);
      setNavigationStack([]);
      setTimeEntries([]);
      setEditorContent("");
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
  const renameAttachmentMutation = useRenameAttachment();

  const { user: authUser } = useAuth();
  const currentUserId = authUser?.id;
  const addLinkMutation = useAddRelatedLink();
  const updateLinkMutation = useUpdateRelatedLink();
  const deleteLinkMutation = useDeleteRelatedLink();

  // Helper Options
  const priorities =
    (ticketConfig?.priorities?.length ? ticketConfig.priorities : PRIORITY_OPTIONS).map((p: any) => ({
      label: p.label,
      value: p.value,
      color: getPriorityColor(p.value),
    }));

  const types =
    (ticketConfig?.taskTypes?.length ? ticketConfig.taskTypes : TYPE_OPTIONS).map((t: any) => ({
      label: t.label,
      value: t.value,
      color: getTypeColor(t.value),
    }));

  const platforms =
    (ticketConfig?.platforms?.length ? ticketConfig.platforms : []).map((p: any) => ({
      label: p.label,
      value: p.value,
      color: getPlatformColor(p.value),
    }));
  const stacks =
    (ticketConfig?.stacks?.length ? ticketConfig.stacks : []).map((s: any) => ({
      label: s.label,
      value: s.value,
      color: getStackColor(s.value),
    }));
  const taskLevels =
    (ticketConfig?.taskLevels?.length ? ticketConfig.taskLevels : []).map((l: any) => ({
      label: l.label,
      value: l.value,
      color: getTaskLevelColor(l.value),
    }));

  const statuses = (() => {
    const baseOptions = ticketConfig?.statuses?.length ? ticketConfig.statuses : STATUS_OPTIONS;
    const options = baseOptions.map(s => ({
      label: s.label,
      value: s.value,
      color: getStatusColor(s.value)
    }));

    // Ensure current status is present in options to prevent 'Select...' placeholder
    if (ticket?.status) {
      const normalizedCurrent = ticket.status.toLowerCase().replace(/ /g, '_');
      const exists = options.some(opt => opt.value?.toLowerCase().replace(/ /g, '_') === normalizedCurrent);

      if (!exists) {
        options.push({
          label: getStatusLabel(ticket.status), // fallback label helper handles spaces/underscores
          value: ticket.status,
          color: getStatusColor(ticket.status)
        });
      }
    }
    return options;
  })();

  const projectMembers = members.map((m) => ({
    label: m.label,
    value: m.value,
    avatar: m.label?.charAt(0),
    avatarUrl: (m as any).avatarUrl,
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          padding: '4px 8px'
        }}>
          <Space size={12}>
            {/* Show back button + parent/subtask format for subtasks */}
            {ticket?.parentId ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowLeftOutlined style={{ fontSize: 14, color: '#8c8c8c' }} />}
                  onClick={navigateBack}
                  style={{
                    backgroundColor: 'var(--bg-pure-white)',
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)'
                  }}
                />
                <Tag
                  bordered={false}
                  color="blue"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    margin: 0,
                    padding: '0 8px',
                    cursor: 'pointer',
                    borderRadius: 4,
                  }}
                  onClick={navigateBack}
                  className="parent-ticket-badge"
                >
                  {parentTicket?.ticketNumber || ''}
                </Tag>
                <span style={{ color: '#d9d9d9', fontWeight: 300, fontSize: 16 }}>/</span>
                <Tag
                  bordered={false}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    margin: 0,
                    padding: '0 8px',
                    backgroundColor: 'var(--bg-pure-white)',
                    color: '#595959',
                    borderRadius: 4,
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {ticket.ticketNumber}
                </Tag>
              </div>
            ) : (
              /* Show just ticket badge for main tickets */
              <Tag
                bordered={false}
                color="blue"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 4,
                  margin: 0
                }}
              >
                {ticket?.ticketNumber || ''}
              </Tag>
            )}
            {ticket?.status && (
              <Tag
                bordered={false}
                color={getStatusColor(ticket.status)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  margin: 0,
                  textTransform: 'capitalize'
                }}
              >
                Status: {getStatusLabel(ticket.status, ticketConfig?.statuses || STATUS_OPTIONS)}
              </Tag>
            )}
          </Space>

          {/* Metadata Header Row */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: '0 16px', whiteSpace: 'nowrap' }}>
            <Space split={<Divider type="vertical" style={{ margin: 0, height: 12, borderColor: '#d9d9d9' }} />} size={16} align="center">
              <Space size={8} style={{ alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Created by</Text>
                <Space size={6}>
                  <Avatar
                    size={18}
                    src={ticket?.createdBy?.avatarUrl}
                    style={{ backgroundColor: '#1890ff', fontSize: 10 }}
                  >
                    {ticket?.createdBy?.name?.charAt(0) || 'S'}
                  </Avatar>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{ticket?.createdBy?.name || 'System'}</Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 11, margin: '0 4px' }}>•</Text>
                <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ticket?.createdAt ? dayjs(ticket.createdAt).format('MMM D, YYYY HH:mm') : '-'}</Text>
              </Space>

              <Space size={8} style={{ alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Updated by</Text>
                <Space size={6}>
                  <Avatar
                    size={18}
                    src={(ticket as any)?.updatedBy?.avatarUrl || ticket?.createdBy?.avatarUrl}
                    style={{ backgroundColor: '#87d068', fontSize: 10 }}
                  >
                    {((ticket as any)?.updatedBy?.name || ticket?.createdBy?.name || 'System').charAt(0)}
                  </Avatar>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{(ticket as any)?.updatedBy?.name || ticket?.createdBy?.name || 'System'}</Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 11, margin: '0 4px' }}>•</Text>
                <Text style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ticket?.updatedAt ? dayjs(ticket.updatedAt).format('MMM D, YYYY HH:mm') : '-'}</Text>
              </Space>
            </Space>
          </div>

          <Space size={8}>
            <Space size={0} style={{ border: '1px solid #f0f0f0', borderRadius: 6, overflow: 'hidden', marginRight: 8 }}>
              <Tooltip title="Previous Ticket">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined style={{ fontSize: 13 }} />}
                  disabled={!hasPrevious}
                  onClick={navigateToPrevious}
                  style={{ height: 32, width: 36, borderRight: '1px solid var(--border-color)', borderRadius: 0 }}
                />
              </Tooltip>
              <Tooltip title="Next Ticket">
                <Button
                  type="text"
                  icon={<ArrowRightOutlined style={{ fontSize: 13 }} />}
                  disabled={!hasNext}
                  onClick={navigateToNext}
                  style={{ height: 32, width: 36, borderRadius: 0 }}
                />
              </Tooltip>
            </Space>

            <Tooltip title="Copy Public Link">
              <Button
                type="text"
                icon={<ShareAltOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />}
                onClick={() => {
                  if (ticket?.id) {
                    const url = `${window.location.origin}/public/tickets/${ticket.id}`;
                    navigator.clipboard.writeText(url).then(() => {
                      message.success('Public link copied to clipboard!');
                    });
                  }
                }}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>
            <Divider type="vertical" style={{ margin: '0 4px', height: 20 }} />
            <Button
              type="text"
              icon={<CloseOutlined style={{ fontSize: 16, color: '#8c8c8c' }} />}
              onClick={onClose}
              style={{ borderRadius: 6 }}
            />
          </Space>
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      width={1100} // Increased slightly for better column balance and header single-row fitting
      styles={{
        header: { padding: '12px 20px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-pure-white)' },
        body: { padding: 0 }
      }}
      closeIcon={null}
    >
      {!ticket ? (
        <div style={{ padding: 40, textAlign: "center", background: "var(--bg-pure-white)" }}><Text>Loading</Text></div>
      ) : (
        <Row style={{ height: '100%', backgroundColor: 'var(--bg-pure-white)' }}>
          {/* LEFT COLUMN: Main Content (Title, Description, Activity) */}
          <Col
            xs={24}
            md={15}
            style={{
              padding: '24px 32px',
              borderRight: '1px solid var(--border-color)',
              overflowY: 'auto',
              height: '100%',
              backgroundColor: 'var(--bg-pure-white)'
            }}
          >

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <EditableField
                value={ticket.title}
                onSave={(val) => handleUpdate('title', val)}
                textStyle={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)', margin: '0' }}
                type="textarea"
                placeholder="Ticket Title"
                editIconVisibility="hover"
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <DrawerField
                label="Description"
                layout="vertical"
                action={!descriptionEditorOpen && (
                  <Button
                    type="text"
                    size="small"
                    style={{
                      fontSize: 12,
                      color: "#1890ff",
                      fontWeight: 600,
                      padding: '0 8px',
                      borderRadius: 4,
                      background: '#e6f7ff'
                    }}
                    onClick={() => setDescriptionEditorOpen(true)}
                  >
                    Edit
                  </Button>
                )}
              >

                {descriptionEditorOpen ? (
                  <div style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 14,
                    padding: '16px',
                    backgroundColor: 'var(--bg-pure-white)',
                    boxShadow: '0 8px 24px rgba(24, 144, 255, 0.08)',
                    width: '100%'
                  }}>
                    <TiptapEditor
                      content={editorContent}
                      onChange={(html) => setEditorContent(html)}
                      placeholder="Add a detailed description here..."
                      minHeight={180}
                    />
                    <div
                      style={{
                        marginTop: 16,
                        display: "flex",
                        gap: 12,
                        justifyContent: "flex-end",
                      }}
                    >
                      <Button
                        size="small"
                        style={{ borderRadius: 8, padding: '0 16px', height: 32 }}
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
                        style={{ borderRadius: 8, padding: '0 20px', height: 32, fontWeight: 600 }}
                        onClick={handleDescriptionSave}
                      >
                        Save Description
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="description-viewer"
                    onClick={() => setDescriptionEditorOpen(true)}
                    style={{
                      minHeight: 120,
                      cursor: "text",
                      padding: "20px",
                      backgroundColor: "var(--bg-pure-white)",
                      border: "1px solid var(--border-color)",
                      borderRadius: 16,
                      position: "relative",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      width: '100%',
                      lineHeight: '1.6'
                    }}
                  >
                    {ticket.description ? (
                      <div className="prose max-w-none focus:outline-none"
                        style={{ color: 'var(--text-secondary)', fontSize: 14 }}
                        dangerouslySetInnerHTML={{ __html: ticket.description }}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Text type="secondary" style={{ fontSize: 14, color: '#94a3b8' }}>No description provided yet.</Text>
                        <Text type="secondary" style={{ fontSize: 12, color: '#cbd5e1' }}>Click to add details about this ticket...</Text>
                      </div>
                    )}

                    <div
                      className="description-edit-icon"
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        opacity: 0,
                        transition: "all 0.2s ease",
                        transform: 'scale(0.9)',
                      }}
                    >
                      <Tooltip title="Edit Description">
                        <EditOutlined
                          style={{
                            fontSize: 14,
                            color: "#1890ff",
                            background: "#fff",
                            padding: 8,
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            border: '1px solid #e2e8f0'
                          }}
                        />
                      </Tooltip>
                    </div>
                  </div>
                )}
              </DrawerField>
            </div>

            {/* Subtasks Section - Conditional Rendering */}
            <div style={{ marginBottom: 4 }}>
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
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden', background: 'var(--bg-pure-white)' }}>
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

            <Divider style={{ margin: '16px 0' }} />

            {/* Tabs for Comments, Attachments, etc. */}
            <div className="premium-tabs-wrapper">
              <Tabs
                defaultActiveKey="comments"
                centered
                tabBarStyle={{ marginBottom: 12, borderBottom: '1px solid var(--border-color)' }}
                items={[
                  {
                    key: 'comments',
                    label: (
                      <span>
                        <MessageOutlined style={{ marginRight: 8 }} />
                        Comments ({comments.length})
                      </span>
                    ),
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
                    label: (
                      <span>
                        <PaperClipOutlined style={{ marginRight: 8 }} />
                        Attachments ({attachments.length})
                      </span>
                    ),
                    children: (
                      <AttachmentsSection
                        attachments={attachments}
                        isLoading={attachmentsLoading}
                        isEditing={false} // pass false to enable Uploader
                        onUpload={async (f, n) => await uploadAttachmentMutation.mutateAsync({ ticketId: currentTicketId || "", file: f, fileName: n })}
                        onDelete={async (id) => await deleteAttachmentMutation.mutateAsync({ ticketId: currentTicketId || "", attachmentId: id })}
                        onRename={async (id, newName) => await renameAttachmentMutation.mutateAsync({ ticketId: currentTicketId || "", attachmentId: id, newFileName: newName })}
                        currentUserId={currentUserId}
                      />
                    )
                  },
                  {
                    key: 'links',
                    label: (
                      <span>
                        <LinkOutlined style={{ marginRight: 8 }} />
                        Links ({relatedLinks.length})
                      </span>
                    ),
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
                    label: (
                      <span>
                        <HistoryOutlined style={{ marginRight: 8 }} />
                        Timeline
                      </span>
                    ),
                    children: (
                      <ActivityTimeline ticketId={currentTicketId} />
                    )
                  },
                  {
                    key: 'code',
                    label: (
                      <span>
                        <CodeOutlined style={{ marginRight: 8 }} />
                        Code
                      </span>
                    ),
                    children: (
                      <div style={{ paddingTop: 16 }}>
                        {currentTicketId ? (
                          <CodeIntegrationSection
                            ticketId={currentTicketId}
                            isEditing={false}
                          />
                        ) : (
                          <Text type="secondary">Loading ticket context</Text>
                        )}
                      </div>
                    )
                  }
                ]}
              />
            </div>
            {/* End Premium Tabs Wrapper */}
          </Col>

          {/* RIGHT COLUMN: Metadata Sidebar */}
          <Col
            xs={24}
            md={9}
            style={{
              padding: '24px 20px',
              background: "var(--bg-pure-white)",
              height: "100%",
              overflowY: "auto",
              borderLeft: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {/* Compact Status Hub */}
                <div style={(() => {
                  const color = getStatusColor(ticket.status);
                  let hexColor = "#8c8c8c";
                  if (color === "processing") hexColor = "#3b82f6";
                  else if (color === "success") hexColor = "#10b981";
                  else if (color === "warning") hexColor = "#f59e0b";
                  else if (color === "purple") hexColor = "#8b5cf6";
                  else if (color === "cyan") hexColor = "#06b6d4";
                  else if (color === "geekblue") hexColor = "#4f46e5";
                  else if (color === "orange") hexColor = "#f59e0b";

                  return {
                    backgroundColor: 'var(--bg-pure-white)',
                    borderRadius: 8,
                    border: `1px solid ${hexColor}25`,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: `0 1px 4px ${hexColor}05`
                  };
                })()} className="status-badge-premium">
                  <div style={{ flex: 1 }}>
                    <EditableSelect
                      value={ticket.status}
                      options={statuses}
                      onSave={(val) => handleUpdate("status", val)}
                      mode="text"
                      plain
                      textStyle={{ fontWeight: 700, fontSize: 12, color: 'var(--text-primary)' }}
                    />
                  </div>
                  {(() => {
                    const s = ticket.status;
                    const iconStyle = { fontSize: 14, color: 'inherit' };
                    const iconMap: Record<string, React.ReactNode> = {
                      'not_started': <PlayCircleOutlined style={iconStyle} />,
                      'in_progress': <SyncOutlined spin style={iconStyle} />,
                      'dev_complete': <RocketOutlined style={iconStyle} />,
                      'dev_testing': <BugOutlined style={iconStyle} />,
                      'in_review': <SyncOutlined style={iconStyle} />,
                      'live': <CheckCircleOutlined style={iconStyle} />,
                      'live_testing': <CheckCircleOutlined style={iconStyle} />,
                      'completed': <CheckSquareOutlined style={iconStyle} />,
                      'pause': <PauseCircleOutlined style={iconStyle} />
                    };
                    return iconMap[s] || <PlayCircleOutlined style={iconStyle} />;
                  })()}
                </div>

                {/* suggested action hub */}
                <div style={{ width: '100%' }}>
                  {ticket.status?.toLowerCase() === 'not_started' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleUpdate('status', 'in_progress')}
                      style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 30, fontWeight: 600, backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                    >
                      Start Sprint
                    </Button>
                  )}
                  {ticket.status?.toLowerCase() === 'in_progress' && (
                    <Space direction="vertical" style={{ width: '100%' }} size={4}>
                      <Button
                        size="small"
                        type="primary"
                        icon={<RocketOutlined />}
                        onClick={() => handleUpdate('status', 'dev_complete')}
                        style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 30, fontWeight: 600, backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
                      >
                        Finish Development
                      </Button>
                      <Button
                        size="small"
                        type="default"
                        icon={<PauseCircleOutlined />}
                        onClick={() => handleUpdate('status', 'pause')}
                        style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 28, fontWeight: 600, border: '1px solid #fa8c16', color: '#fa8c16' }}
                      >
                        Pause
                      </Button>
                    </Space>
                  )}
                  {ticket.status?.toLowerCase() === 'pause' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handleUpdate('status', 'in_progress')}
                      style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 30, fontWeight: 600, backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                    >
                      Resume Sprint
                    </Button>
                  )}
                  {ticket.status === 'dev_complete' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<BugOutlined />}
                      onClick={() => handleUpdate('status', 'dev_testing')}
                      style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 30, fontWeight: 600, backgroundColor: '#fa8c16', borderColor: '#fa8c16' }}
                    >
                      Move to Dev Testing
                    </Button>
                  )}
                  {ticket.status === 'dev_testing' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<SyncOutlined />}
                      onClick={() => handleUpdate('status', 'in_review')}
                      style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 30, fontWeight: 600, backgroundColor: '#722ed1', borderColor: '#722ed1' }}
                    >
                      Request Review
                    </Button>
                  )}
                  {ticket.status === 'in_review' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckOutlined />}
                      onClick={() => handleUpdate('status', 'live')}
                      style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 30, fontWeight: 600, backgroundColor: '#2f54eb', borderColor: '#2f54eb' }}
                    >
                      Deploy to Live
                    </Button>
                  )}
                  {ticket.status === 'live' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<SyncOutlined />}
                      onClick={() => handleUpdate('status', 'live_testing')}
                      style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 30, fontWeight: 600, backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
                    >
                      Move to Live Testing
                    </Button>
                  )}
                  {ticket.status === 'live_testing' && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleUpdate('status', 'completed')}
                      style={{ fontSize: 11, borderRadius: 6, width: '100%', height: 30, fontWeight: 600, backgroundColor: '#10b981', borderColor: '#10b981' }}
                    >
                      Complete Ticket
                    </Button>
                  )}
                  {ticket.status === 'completed' && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'rgba(82, 196, 26, 0.05)',
                      borderRadius: 6,
                      border: '1px solid rgba(82, 196, 26, 0.2)'
                    }}>
                      <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                      <Text style={{ fontSize: 11, color: '#389e0d', fontWeight: 600 }}>All steps completed</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible Sections */}
            <div className="sidebar-collapse-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Core Details Card */}
              <Collapse
                defaultActiveKey={["details"]}
                ghost
                expandIconPosition="end"
                style={{ backgroundColor: 'transparent' }}
                items={[
                  {
                    key: "details",
                    label: (
                      <div style={{ padding: '4px 0' }}>
                        <Space size={10}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            backgroundColor: '#e6f7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 14 }} />
                          </div>
                          <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                            Core Details
                          </Text>
                        </Space>
                      </div>
                    ),
                    children: (
                      <div style={{ padding: 0 }}>
                        <Row gutter={[0, 0]}>
                          <Col span={24}>
                            <DrawerField label="Assignee" variant="table">
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
                            <DrawerField label="Report To" variant="table">
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

                            <DrawerField label="Platform" variant="table">
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
                              <DrawerField label="Stack" variant="table">
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
                            <DrawerField label="Priority" variant="table">
                              <EditableSelect
                                value={ticket.priority}
                                options={priorities}
                                onSave={(val) => handleUpdate("priority", val)}
                                mode="tag"
                              />
                            </DrawerField>
                          </Col>
                          <Col span={24}>
                            <DrawerField label="Type" variant="table">
                              <EditableSelect
                                value={ticket.type}
                                options={types}
                                onSave={(val) => handleUpdate("type", val)}
                                mode="tag"
                              />
                            </DrawerField>
                          </Col>
                          <Col span={24}>
                            <DrawerField label="Task Level" variant="table">
                              <EditableSelect
                                value={ticket.taskLevel}
                                options={taskLevels}
                                onSave={(val) => handleUpdate("taskLevel", val)}
                                mode="tag"
                              />
                            </DrawerField>
                          </Col>
                        </Row>
                      </div>
                    ),
                  }
                ]}
              />

              {/* Planning & Estimates Card */}
              <Collapse
                defaultActiveKey={["planning"]}
                ghost
                expandIconPosition="end"
                style={{ backgroundColor: 'transparent' }}
                items={[
                  {
                    key: "planning",
                    label: (
                      <div style={{ padding: '4px 0' }}>
                        <Space size={10}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            backgroundColor: '#f6ffed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CalendarOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                          </div>
                          <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                            Planning & Estimates
                          </Text>
                        </Space>
                      </div>
                    ),
                    children: (
                      <div style={{ padding: 0 }}>
                        <Row gutter={[0, 0]}>
                          <Col span={24}>
                            <DrawerField label="Story Points" variant="table">
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
                            </DrawerField>
                          </Col>
                          <Col span={24}>
                            <DrawerField label="Estimate (h)" variant="table">
                              <EditableField
                                value={ticket.estimateHours}
                                onSave={(val) =>
                                  handleUpdate("estimateHours", Number(val))
                                }
                                type="number"
                                emptyText="-"
                              />
                            </DrawerField>
                          </Col>
                          <Col span={24}>
                            <DrawerField label="Start Date" variant="table">
                              <EditableDate
                                value={ticket.startDate}
                                onSave={(val) => handleUpdate("startDate", val)}
                                placeholder="Start"
                              />
                            </DrawerField>
                          </Col>
                          <Col span={24}>
                            <DrawerField label="Due Date" variant="table">
                              <EditableDate
                                value={ticket.endDate}
                                onSave={(val) => handleUpdate("endDate", val)}
                                placeholder="Due By"
                              />
                            </DrawerField>
                          </Col>
                        </Row>
                      </div>
                    ),
                  }
                ]}
              />

              {/* Time Tracking Card */}
              <Collapse
                ghost
                expandIconPosition="end"
                style={{ backgroundColor: 'transparent' }}
                items={[
                  {
                    key: "time-tracking",
                    label: (
                      <div style={{ padding: '4px 0' }}>
                        <Space size={10}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            backgroundColor: '#fff7e6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <FieldTimeOutlined style={{ color: '#fa8c16', fontSize: 14 }} />
                          </div>
                          <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Time Tracked</Text>
                          {timeEntries.length > 0 && (
                            <Badge
                              count={(() => {
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
                              style={{ backgroundColor: '#fff7e6', color: '#fa8c16', boxShadow: 'none', border: 'none', fontWeight: 600, fontSize: 10, padding: '0 8px', height: 20, lineHeight: '20px', borderRadius: 10 }}
                            />
                          )}
                        </Space>
                      </div>
                    ),
                    children: (
                      <div style={{ padding: 0 }}>
                        {timeEntriesLoading ? (
                          <Text type="secondary" style={{ fontSize: 12, padding: 12 }}>Loading...</Text>
                        ) : timeEntries.length === 0 ? (
                          <Text type="secondary" style={{ fontSize: 12, padding: 12 }}>No time tracked yet for this ticket.</Text>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {timeEntries.map(entry => {
                              return (
                                <div key={entry.id} style={{ padding: '10px 12px', background: 'var(--bg-pure-white)', borderBottom: '1px solid var(--border-color)' }}>
                                  {/* User row */}
                                  {entry.user && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                      <Avatar
                                        size={20}
                                        src={entry.user.avatarUrl}
                                        style={{
                                          backgroundColor: '#1890ff',
                                          color: 'white',
                                          fontSize: 10,
                                          fontWeight: 700
                                        }}
                                      >
                                        {entry.user.name.charAt(0).toUpperCase()}
                                      </Avatar>
                                      <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {entry.user.name}
                                      </Text>
                                    </div>
                                  )}
                                  {/* Date / time / duration row */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                        {dayjs(entry.startTime).format('MMM D, YYYY')}
                                      </div>
                                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                        {dayjs(entry.startTime).format('h:mm A')}
                                        {entry.endTime ? ` – ${dayjs(entry.endTime).format('h:mm A')}` : ''}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <Text strong style={{ fontSize: 13, color: '#1890ff', fontFamily: 'monospace' }}>
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
                                          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
                                        })()}
                                      </Text>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ),
                  }
                ]}
              />
            </div>

          </Col>
        </Row>
      )}

      <style jsx global>{`
        .parent-ticket-badge:hover {
          background-color: rgba(144, 144, 144, 0.1) !important;
          color: #1890ff !important;
          transform: translateY(-1px);
        }
        .description-viewer:hover {
          background-color: rgba(144, 144, 144, 0.05) !important;
          border-color: #1890ff !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04) !important;
        }
        .description-viewer:hover .description-edit-icon {
          opacity: 1 !important;
          transform: scale(1) !important;
        }
        .premium-tabs-wrapper .ant-tabs-nav {
          position: sticky !important;
          top: -16px !important;
          z-index: 100 !important;
          background: var(--bg-pure-white) !important;
          margin-top: 0 !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .premium-tabs-wrapper .ant-tabs-nav::before {
          content: '' !important;
          position: absolute !important;
          top: 0 !important;
          left: -40px !important;
          right: -40px !important;
          bottom: 0 !important;
          background: var(--bg-pure-white) !important;
          z-index: -1 !important;
        }
        .premium-tabs-wrapper .ant-tabs-tab {
          padding: 8px 12px !important;
          margin: 0 2px !important;
          transition: all 0.3s ease !important;
        }
        .premium-tabs-wrapper .ant-tabs-tab-btn {
          font-weight: 500 !important;
          color: #8c8c8c !important;
          font-size: 13px !important;
        }
        .premium-tabs-wrapper .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #1890ff !important;
          font-weight: 700 !important;
        }
        .premium-tabs-wrapper .ant-tabs-ink-bar {
          height: 3px !important;
          border-radius: 3px 3px 0 0 !important;
          background: #1890ff !important;
        }
        .sidebar-collapse-wrapper .ant-collapse {
          background: transparent !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-item {
          border: 1px solid var(--border-color) !important;
          border-radius: 14px !important;
          margin-bottom: 12px !important;
          background: var(--bg-pure-white) !important;
          overflow: hidden !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02) !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-header {
          padding: 14px 16px !important;
          background: transparent !important;
          border-bottom: none !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-content {
          background: transparent !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-content-box {
          padding: 0 !important;
        }
        .sidebar-collapse-wrapper .DrawerField-table-variant {
          border-bottom: 1px solid var(--border-color) !important;
        }
        .sidebar-collapse-wrapper .DrawerField-table-variant:last-child {
          border-bottom: none !important;
        }
        .status-badge-premium:hover {
          filter: brightness(0.98);
          background-color: rgba(144, 144, 144, 0.08) !important;
          box-shadow: 0 6px 16px rgba(0,0,0,0.06) !important;
          transform: translateY(-1px);
        }
        .status-button-v2:hover {
          filter: brightness(1.05);
          transform: translateY(-1px);
        }
      `}</style>
    </Drawer>
  );
};
