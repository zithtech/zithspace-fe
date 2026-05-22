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
  Input,
  notification,
  App,
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
  CodeOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  LoadingOutlined,
  PlusOutlined,
  RiseOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTicketComments, useTicketAttachments, useTicketLinks, useAddComment, useUpdateComment, useDeleteComment, useUploadAttachment, useDeleteAttachment, useRenameAttachment, useAddRelatedLink, useUpdateRelatedLink, useDeleteRelatedLink, useTicketDocumentHubs } from "@/hooks/useTicketDetails";
import { useTicket, useUpdateTicket, useAllTicketTags, ticketKeys } from "@/hooks/useTickets";
import { useMembers, useTicketConfig, useUserProjects } from "@/hooks/useGlobalData";
import { useAvailableSprints } from "@/hooks/useAvailableSprints";
import { useTimeTrackerStore } from "@/store/useTimeTrackerStore";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import {  PRIORITY_OPTIONS,
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
import { EditableTags } from "./editable/EditableTags";
import { DrawerField } from "./DrawerField";
import { EditableDate } from "./editable/EditableDate";
import TiptapEditor from "@/components/common/TiptapEditor";
import AttachmentList from "@/components/common/AttachmentList"; // Default export
import {
  AttachmentsSection,
  CommentsSection,
  RelatedLinksSection,
  ActivityTimeline,
  LinkedDocumentHubsList,
} from "../ticket-details";
import SubtasksSection from "../ticket-details/SubtasksSection";
import CodeIntegrationSection from "../ticket-details/code/CodeIntegrationSection";
import TicketService from "@/services/ticketService";
import { TimeTrackingService, TimeTrackingEntry } from "@/services/timeTracking.service";
import CreateDocHubModal from "@/components/documenthub/CreateDocHubModal";
import AiCreateHubModal from "@/components/documenthub/AiCreateHubModal";
import { Dropdown } from "antd";
import type { MenuProps } from "antd";
import { useRouter } from "next/navigation";

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

  // Enhance-with-Zai flow: when active, the description box flips to a Zai
  // prompt panel that takes a short hint and asks Gemini to write a polished
  // description, which then replaces the ticket's existing description.
  // True only when the description has visible text after stripping HTML.
  // Tiptap leaves "<p></p>" / "<p><br></p>" behind on clear, both of which are
  // truthy strings — so a plain `if (description)` check incorrectly thinks
  // there's still content.
  const hasMeaningfulDescription = (html: string | undefined | null): boolean => {
    if (!html) return false;
    const stripped = html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return stripped.length > 0;
  };

  const {
    canCreateTicket,
    canReadTicket,
    canUpdateTicket,
    canDeleteTicket,
    canAssignTicket,
    canManageTickets
  } = usePermission();

  const [enhanceZaiOpen, setEnhanceZaiOpen] = useState(false);
  const [zaiHint, setZaiHint] = useState('');
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);
  // Last failure reason from Zai, surfaced as a retry banner inside the panel.
  // Cleared when the user starts typing again or successfully generates.
  const [zaiError, setZaiError] = useState<string | null>(null);
  // What to do with the AI's output when an existing description is present.
  //   overwrite — discard old, replace with newly generated description
  //   enhance   — feed old + hint to AI, replace with the polished version
  //   append    — keep old, append a new generated section to the bottom
  type ZaiMode = 'overwrite' | 'enhance' | 'append';
  const [zaiMode, setZaiMode] = useState<ZaiMode>('enhance');

  // Navigation State
  const [navigationStack, setNavigationStack] = useState<string[]>([]);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  const [timeEntries, setTimeEntries] = useState<TimeTrackingEntry[]>([]);
  const [timeEntriesLoading, setTimeEntriesLoading] = useState(false);
  const [createDocOpen, setCreateDocOpen] = useState(false);
  const [createDocAiOpen, setCreateDocAiOpen] = useState(false);
  const router = useRouter();

  // Data Hooks - Use currentTicketId instead of ticketId prop
  const { message, notification: notifyApi } = App.useApp();
  const { data: ticket, isLoading: ticketLoading } = useTicket(currentTicketId || "");
  const { data: tagSuggestions = [] } = useAllTicketTags();
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
  const { data: linkedHubs = [], isLoading: linkedHubsLoading } = useTicketDocumentHubs(currentTicketId || "");
  const queryClient = useQueryClient();

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
    TimeTrackingService.getEntries({ ticketId: currentTicketId, allUsers: true })
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

  // Available sprints for the current ticket's project
  const ticketProjectId =
    typeof (ticket as any)?.project === "string"
      ? ((ticket as any).project as string)
      : (ticket as any)?.project?.id;
  const { data: availableSprints = [] } = useAvailableSprints(ticketProjectId);
  const activeSprint = availableSprints.find((s: any) => s.status === "active");
  const ticketSprintId =
    (ticket as any)?.sprintPlanId ||
    (ticket as any)?.releasePlanId ||
    (ticket as any)?.metadata?.releasePlan ||
    null;
  const isInActiveSprint = !!activeSprint && ticketSprintId === activeSprint.id;
  const isInBacklog = !ticketSprintId;

  // const [sprintToastApi, sprintToastHolder] = notification.useNotification({
  //   placement: "top",
  //   top: 12,
  //   duration: 2,
  // });

  const showSprintToast = (
    kind: "added" | "removed" | "error",
    label?: string
  ) => {
    if (kind === "added") {
      message.success(`Ticket added to ${label} successfully`);
    } else if (kind === "removed") {
      message.success(`Ticket removed from sprint successfully`);
    } else if (kind === "error") {
      message.error(`Sprint update failed`);
    }
  };

  // Mirror TicketList's handleSprintAssignment so behavior is identical
  const handleSprintAssignment = (action: "add" | "remove") => {
    if (!currentTicketId) return;
    if (action === "add" && !activeSprint) {
      showSprintToast("error");
      return;
    }
    const releasePlanId =
      action === "add" && activeSprint ? activeSprint.id : null;

    updateTicketMutation.mutate(
      {
        id: currentTicketId,
        data: { releasePlan: releasePlanId } as any,
        optimisticData: { releasePlan: releasePlanId } as any,
      } as any,
      {
        onSuccess: () => {
          if (action === "add") {
            showSprintToast(
              "added",
              activeSprint?.version || activeSprint?.name || "Sprint"
            );
          } else {
            showSprintToast("removed");
          }
        },
        onError: () => {
          showSprintToast("error");
        },
      }
    );
  };

  // Mutations
  const updateTicketMutation = useUpdateTicket();
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
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
    if (field === "assignee" && !canAssignTicket) {
      message.error("Access Denied: You do not have permission to assign tickets.");
      return;
    }
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

  /**
   * Send the user's hint to Zai with mode-specific framing, then apply the
   * AI's output to the ticket description according to the chosen mode:
   *   overwrite → replace existing entirely
   *   enhance   → polish the existing using the hint as guidance
   *   append    → keep the existing and add the new section underneath
   */
  const handleEnhanceWithZai = async () => {
    const hint = zaiHint.trim();
    const existing = ticket?.description?.trim() || '';
    const hasExisting = hasMeaningfulDescription(ticket?.description);
    const effectiveMode: ZaiMode = hasExisting ? zaiMode : 'overwrite';

    // Hint requirement varies per mode — see canGenerate below.
    if (isEnhancingDescription) return;
    if (effectiveMode !== 'enhance' && !hint) return;
    if (effectiveMode === 'enhance' && !hint && !hasExisting) return;

    setZaiError(null);
    setIsEnhancingDescription(true);
    try {
      // Build a mode-specific seed so the model knows what to do.
      let seed: string;
      if (effectiveMode === 'enhance' && hasExisting) {
        seed =
          `Improve and polish the following ticket description. ` +
          `Keep the meaning intact, fix structure, fill gaps, and add acceptance criteria where helpful.` +
          (hint ? `\n\nUser refinement: ${hint}` : '') +
          `\n\nExisting description (HTML):\n${existing}`;
      } else if (effectiveMode === 'append' && hasExisting) {
        seed =
          `Write a NEW additional section that complements (does not duplicate) the existing ticket description.\n\n` +
          `User request: ${hint}\n\nExisting description (for context only — do not repeat it):\n${existing}`;
      } else {
        seed = ticket?.title ? `${ticket.title}\n\n${hint}` : hint;
      }

      const result = await TicketService.generateAiTicketDraft({
        description: seed,
        title: ticket?.title || undefined,
      });

      // If Zai didn't actually generate (heuristic mock fallback), don't save
      // the generic placeholder — surface the failure with a Retry button so
      // the user controls the next attempt.
      if (result.source === 'mock') {
        setZaiError(result.fallbackReason || 'Zai is unavailable right now.');
        return;
      }

      // Decide what to persist based on mode.
      let next = result.description;
      if (effectiveMode === 'append' && hasExisting) {
        next = `${existing}\n${result.description}`;
      }

      await handleUpdate('description', next);
      message.success(
        effectiveMode === 'enhance'
          ? 'Description enhanced with Zai'
          : effectiveMode === 'append'
            ? 'Section appended by Zai'
            : 'Description generated by Zai',
      );
      setEnhanceZaiOpen(false);
      setZaiHint('');
    } catch (err: any) {
      // Network / timeout / 5xx — same retry banner UX, no auto-save.
      setZaiError(err?.message || 'Failed to reach Zai. Try again.');
    } finally {
      setIsEnhancingDescription(false);
    }
  };

  // Renderers
  if (!currentTicketId) return null;

  return (
    <>
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

         

          <Space size={8}>
            {isInBacklog && activeSprint && (canUpdateTicket || canManageTickets) && (
              <Tooltip title={`Add to ${activeSprint.version || activeSprint.name || "sprint"}`}>
                <Button
                  type="default"
                  size="middle"
                  icon={<PlusCircleOutlined style={{ color: "#52c41a" }} />}
                  onClick={() => handleSprintAssignment("add")}
                  style={{
                    height: 32,
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                    padding: "0 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Add to Sprint
                </Button>
              </Tooltip>
            )}
            {isInActiveSprint && (canUpdateTicket || canManageTickets) && (
              <Tooltip title="Remove from sprint, return to backlog">
                <Button
                  danger
                  type="default"
                  size="middle"
                  icon={<MinusCircleOutlined />}
                  onClick={() => handleSprintAssignment("remove")}
                  style={{
                    height: 32,
                    borderRadius: 6,
                    fontWeight: 600,
                    fontSize: 12,
                    padding: "0 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Remove from Sprint
                </Button>
              </Tooltip>
            )}

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

            <Dropdown
              trigger={['hover', 'click']}
              placement="bottomRight"
              overlayClassName="create-doc-from-ticket-menu"
              menu={{
                items: [
                  {
                    key: 'manual',
                    label: (
                      <div className="flex items-start gap-3 py-1.5 pr-2" style={{ minWidth: 260 }}>
                        <div
                          className="flex items-center justify-center shrink-0 text-white"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                            boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)',
                          }}
                        >
                          <FileTextOutlined style={{ fontSize: 15 }} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            className="text-[13px] font-semibold leading-tight"
                            style={{ color: 'var(--text-slate-900)' }}
                          >
                            Manual creation
                          </span>
                          <span
                            className="text-[11.5px] leading-snug mt-0.5"
                            style={{ color: 'var(--text-slate-400)' }}
                          >
                            Start from a blank document hub
                          </span>
                        </div>
                      </div>
                    ),
                    onClick: () => setCreateDocOpen(true),
                  },
                  {
                    key: 'zai',
                    label: (
                      <div className="flex items-start gap-3 py-1.5 pr-2" style={{ minWidth: 290 }}>
                        <div
                          className="flex items-center justify-center shrink-0 text-white"
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                            boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)',
                          }}
                        >
                          <ThunderboltOutlined style={{ fontSize: 15 }} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[13px] font-semibold leading-tight"
                              style={{ color: 'var(--text-slate-900)' }}
                            >
                              Create with Zai
                            </span>
                            <span
                              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded"
                              style={{
                                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                                color: '#fff',
                              }}
                            >
                              AI
                            </span>
                          </div>
                          <span
                            className="text-[11.5px] leading-snug mt-0.5"
                            style={{ color: 'var(--text-slate-400)' }}
                          >
                            Draft the hub from this ticket's context
                          </span>
                        </div>
                      </div>
                    ),
                    onClick: () => setCreateDocAiOpen(true),
                  },
                ] as MenuProps['items'],
              }}
            >
              <Button
                size="middle"
                icon={<FileTextOutlined />}
                style={{
                  height: 32,
                  borderRadius: 8,
                  paddingInline: 12,
                  fontWeight: 600,
                  fontSize: 12,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  color: '#fff',
                  border: 'none',
                  boxShadow:
                    '0 2px 8px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                Create Doc
              </Button>
            </Dropdown>

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
            <div className="ticket-title-card">
              <span className="ticket-title-card__accent" aria-hidden />
              <span className="ticket-title-card__eyebrow">Ticket Title</span>
              <div className="ticket-title-card__field">
                <EditableField
                  value={ticket.title}
                  onSave={(val) => handleUpdate('title', val)}
                  textStyle={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, color: 'var(--text-primary)', margin: '0', letterSpacing: '-0.015em' }}
                  type="textarea"
                  placeholder="Untitled ticket — add a clear, action-oriented title"
                  editIconVisibility="hover"
                  disabled={!canUpdateTicket}
                />
              </div>
            </div>

            {/* Tags — below the title on the left side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 16px' }}>
              <Text strong style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tags
              </Text>
              <div style={{ flex: 1, minWidth: 0 }}>
                <EditableTags
                  value={ticket.tags || []}
                  suggestions={tagSuggestions}
                  onSave={(next) => handleUpdate("tags", next)}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <div className="description-header">
                <span className="description-header__title">
                  <span className="description-header__bar" />
                  Description
                </span>
                {!descriptionEditorOpen && !enhanceZaiOpen && (
                  <div className="description-header__actions">
                    <Button
                      type="text"
                      size="small"
                      icon={<ThunderboltOutlined />}
                      className="description-header__btn description-header__btn--zai"
                      onClick={() => {
                        const has = hasMeaningfulDescription(ticket?.description);
                        setEnhanceZaiOpen(true);
                        setZaiMode(has ? 'enhance' : 'overwrite');
                        setZaiHint(has ? '' : (ticket?.title || ''));
                      }}
                    >
                      Enhance with Zai
                    </Button>
                    <Button
                      type="text"
                      size="small"
                      icon={<EditOutlined />}
                      className="description-header__btn description-header__btn--edit"
                      onClick={() => setDescriptionEditorOpen(true)}
                    >
                      Edit
                    </Button>
                  </div>
                )}
              </div>
              <div className="description-body">

                {enhanceZaiOpen ? (
                  /* Flipped Zai prompt panel: takes a short hint, asks Gemini
                     to write a polished description, then replaces the existing
                     description with the result. */
                  <div
                    style={{
                      border: '1px solid rgba(114, 46, 209, 0.3)',
                      borderRadius: 14,
                      padding: '16px',
                      background: 'linear-gradient(180deg, rgba(114, 46, 209, 0.04) 0%, var(--bg-pure-white) 100%)',
                      boxShadow: '0 8px 24px rgba(114, 46, 209, 0.08)',
                      width: '100%',
                      animation: 'zai-flip-in 320ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <style>{`
                      @keyframes zai-flip-in {
                        from { opacity: 0; transform: rotateX(-6deg) translateY(-6px); }
                        to   { opacity: 1; transform: rotateX(0) translateY(0); }
                      }
                    `}</style>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: 'linear-gradient(135deg, #722ed1 0%, #391085 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          boxShadow: '0 4px 12px rgba(114,46,209,0.25)',
                        }}
                      >
                        <ThunderboltOutlined />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                          Enhance with Zai
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {hasMeaningfulDescription(ticket.description)
                            ? 'Pick how Zai should work with the existing description.'
                            : 'Describe the work in plain English — Zai will draft a polished description.'}
                        </div>
                      </div>
                    </div>

                    {/* Mode picker — only when there's already a description.
                        Three radio-style cards covering the common intents. */}
                    {hasMeaningfulDescription(ticket.description) && (() => {
                      const modes: Array<{
                        key: ZaiMode;
                        title: string;
                        sub: string;
                        icon: React.ReactNode;
                      }> = [
                        {
                          key: 'enhance',
                          title: 'Enhance existing',
                          sub: 'Polish & expand what\'s there',
                          icon: <RiseOutlined />,
                        },
                        {
                          key: 'overwrite',
                          title: 'Overwrite & generate',
                          sub: 'Discard old, write fresh',
                          icon: <SyncOutlined />,
                        },
                        {
                          key: 'append',
                          title: 'Generate & append',
                          sub: 'Add a new section below',
                          icon: <PlusOutlined />,
                        },
                      ];
                      return (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 8,
                            marginBottom: 12,
                          }}
                        >
                          {modes.map((m) => {
                            const selected = zaiMode === m.key;
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={() => setZaiMode(m.key)}
                                disabled={isEnhancingDescription}
                                style={{
                                  textAlign: 'left',
                                  padding: '10px 12px',
                                  borderRadius: 10,
                                  border: selected
                                    ? '1px solid #722ed1'
                                    : '1px solid var(--border-color)',
                                  background: selected
                                    ? 'linear-gradient(135deg, rgba(114,46,209,0.10) 0%, rgba(57,16,133,0.06) 100%)'
                                    : 'var(--bg-pure-white)',
                                  cursor: isEnhancingDescription ? 'not-allowed' : 'pointer',
                                  transition: 'all 120ms ease',
                                  boxShadow: selected ? '0 4px 12px rgba(114,46,209,0.12)' : 'none',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    color: selected ? '#722ed1' : 'var(--text-primary)',
                                    fontWeight: 700,
                                    fontSize: 12,
                                  }}
                                >
                                  {m.icon}
                                  {m.title}
                                </div>
                                <div
                                  style={{
                                    marginTop: 4,
                                    fontSize: 11,
                                    color: 'var(--text-secondary)',
                                  }}
                                >
                                  {m.sub}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Compact error banner with inline Retry. Maps the raw
                        backend error to a 2-4 word user-friendly summary;
                        full reason is available on hover via tooltip. */}
                    {zaiError && (() => {
                      const e = zaiError.toLowerCase();
                      const shortLabel =
                        /quota|exhausted|per[\s_-]*day/.test(e)
                          ? 'Quota exceeded'
                          : /timeout|aborted|econn|network|fetch/.test(e)
                            ? 'Connection failed'
                            : /not valid json|empty response|malformed/.test(e)
                              ? 'Bad response'
                              : /404|not found|not supported/.test(e)
                                ? 'Model unavailable'
                                : 'Zai unavailable';
                      return (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            marginBottom: 10,
                            borderRadius: 10,
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#b91c1c',
                            fontSize: 12,
                          }}
                        >
                          <Tooltip title={zaiError}>
                            <InfoCircleOutlined style={{ fontSize: 14, cursor: 'help' }} />
                          </Tooltip>
                          <span style={{ fontWeight: 700, flex: 1 }}>{shortLabel}</span>
                          <Button
                            size="small"
                            type="primary"
                            icon={isEnhancingDescription ? <LoadingOutlined /> : <SyncOutlined />}
                            loading={isEnhancingDescription}
                            onClick={handleEnhanceWithZai}
                            style={{
                              borderRadius: 6,
                              background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
                              border: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Retry
                          </Button>
                        </div>
                      );
                    })()}

                    <Input.TextArea
                      value={zaiHint}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setZaiHint(e.target.value);
                        if (zaiError) setZaiError(null);
                      }}
                      placeholder={
                        hasMeaningfulDescription(ticket.description) && zaiMode === 'enhance'
                          ? 'Optional — e.g. "make it clearer", "add acceptance criteria"'
                          : hasMeaningfulDescription(ticket.description) && zaiMode === 'append'
                            ? 'What new section should Zai add? e.g. "add a testing section"'
                            : 'e.g. Use UUID primary keys, soft-delete column, indexes on assignee_id and project_id'
                      }
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      autoFocus
                      disabled={isEnhancingDescription}
                      style={{
                        borderRadius: 10,
                        padding: '12px 14px',
                        fontSize: 14,
                        background: 'var(--bg-pure-white)',
                      }}
                    />

                    {(() => {
                      // Hint requirement varies by mode:
                      //   enhance with existing → optional
                      //   everything else → required
                      const hasExisting = hasMeaningfulDescription(ticket.description);
                      const effective: ZaiMode = hasExisting ? zaiMode : 'overwrite';
                      const hintRequired = !(effective === 'enhance' && hasExisting);
                      const canGenerate = !hintRequired || zaiHint.trim().length > 0;
                      const buttonLabel =
                        effective === 'enhance'
                          ? 'Enhance description'
                          : effective === 'append'
                            ? 'Generate & append'
                            : 'Overwrite & generate';
                      return (
                        <div
                          style={{
                            marginTop: 14,
                            display: 'flex',
                            gap: 12,
                            justifyContent: 'flex-end',
                          }}
                        >
                          <Button
                            size="small"
                            disabled={isEnhancingDescription}
                            style={{ borderRadius: 8, padding: '0 16px', height: 32 }}
                            onClick={() => {
                              setEnhanceZaiOpen(false);
                              setZaiHint('');
                              setZaiError(null);
                            }}
                          >
                            Back to description
                          </Button>
                          <Button
                            type="primary"
                            size="small"
                            icon={isEnhancingDescription ? <LoadingOutlined /> : <ThunderboltOutlined />}
                            loading={isEnhancingDescription}
                            disabled={!canGenerate || isEnhancingDescription || !canUpdateTicket}
                            onClick={handleEnhanceWithZai}
                            style={{
                              borderRadius: 8,
                              padding: '0 20px',
                              height: 32,
                              fontWeight: 600,
                              background: canGenerate
                                ? 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)'
                                : undefined,
                              border: 'none',
                              boxShadow: canGenerate
                                ? '0 4px 12px rgba(114, 46, 209, 0.3)'
                                : undefined,
                            }}
                          >
                            {isEnhancingDescription ? 'Generating…' : buttonLabel}
                          </Button>
                        </div>
                      );
                    })()}
                  </div>
                ) : descriptionEditorOpen ? (
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
                    className={`description-viewer-v2 ${!ticket.description ? 'is-empty' : ''}`}
                    onClick={() => canUpdateTicket && setDescriptionEditorOpen(true)}
                    style={{ cursor: canUpdateTicket ? 'pointer' : 'default' }}
                  >
                    {ticket.description ? (
                      <div
                        className="prose max-w-none focus:outline-none description-viewer-v2__content"
                        dangerouslySetInnerHTML={{ __html: ticket.description }}
                      />
                    ) : (
                      <div className="description-viewer-v2__empty">
                        <div className="description-viewer-v2__empty-icon">
                          <FileTextOutlined />
                        </div>
                        <div className="description-viewer-v2__empty-copy">
                          <Text className="description-viewer-v2__empty-title">No description yet</Text>
                          <Text className="description-viewer-v2__empty-sub">
                            Click here to add context, acceptance criteria, or links — or use Enhance with Zai to draft it for you.
                          </Text>
                        </div>
                      </div>
                    )}

                    <Tooltip title="Edit description">
                      <span className="description-viewer-v2__edit-pill">
                        <EditOutlined />
                      </span>
                    </Tooltip>
                  </div>
                )}
              </div>
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
                        onEditComment={async (id, c) => await updateCommentMutation.mutateAsync({ ticketId: currentTicketId, commentId: id, comment: c })}
                        onDeleteComment={async (id) => await deleteCommentMutation.mutateAsync({ ticketId: currentTicketId, commentId: id })}
                        isAddingComment={addCommentMutation.isPending}
                        isEditingComment={updateCommentMutation.isPending}
                        isDeletingComment={deleteCommentMutation.isPending}
                      />
                    )
                  },
                  {
                    key: 'attachments',
                    label: (
                      <span>
                        <PaperClipOutlined style={{ marginRight: 8 }} />
                        Attachments ({attachments.length + linkedHubs.length})
                      </span>
                    ),
                    children: (
                      <>
                        <LinkedDocumentHubsList
                          hubs={linkedHubs}
                          isLoading={linkedHubsLoading}
                          onOpenHub={(hubId) => {
                            onClose();
                            router.push(`/documenthub/${hubId}`);
                          }}
                        />
                        <AttachmentsSection
                          attachments={attachments}
                          isLoading={attachmentsLoading}
                          isEditing={false} // pass false to enable Uploader
                          onUpload={async (f, n) => await uploadAttachmentMutation.mutateAsync({ ticketId: currentTicketId || "", file: f, fileName: n })}
                          onDelete={async (id) => await deleteAttachmentMutation.mutateAsync({ ticketId: currentTicketId || "", attachmentId: id })}
                          onRename={async (id, newName) => await renameAttachmentMutation.mutateAsync({ ticketId: currentTicketId || "", attachmentId: id, newFileName: newName })}
                          onOpen={onClose}
                          currentUserId={currentUserId}
                        />
                      </>
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
                      disabled={!canUpdateTicket}
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
                              <div
                                onClickCapture={(e) => {
                                  if (!canAssignTicket) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    message.error("Access Denied: You do not have permission to assign tickets.");
                                  }
                                }}
                                style={{ width: "100%" }}
                              >
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
                                  disabled={!canAssignTicket}
                                />
                              </div>
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
                                    mode="dot"
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
                                      mode="dot"
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
                                    mode="dot"
                                  />
                                </DrawerField>
                              </Col>
                              <Col span={24}>
                                <DrawerField label="Task Level" variant="table">
                                  <EditableSelect
                                    value={ticket.taskLevel}
                                    options={taskLevels}
                                    onSave={(val) => handleUpdate("taskLevel", val)}
                                    mode="dot"
                                  />
                                </DrawerField>
                              </Col>
                            </Row>
                          </div>
                        ),
                      }
                    ]}
                  />
                
                {/* Activity / Audit Card */}
                <Collapse
                  defaultActiveKey={["activity"]}
                  ghost
                  expandIconPosition="end"
                  style={{ backgroundColor: 'transparent' }}
                  items={[
                    {
                      key: "activity",
                      label: (
                        <div style={{ padding: '4px 0' }}>
                          <Space size={10}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: 8,
                              backgroundColor: 'rgba(168, 85, 247, 0.12)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <HistoryOutlined style={{ color: '#a855f7', fontSize: 14 }} />
                            </div>
                            <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                              Activity
                            </Text>
                          </Space>
                        </div>
                      ),
                      children: (
                        <div style={{ padding: 0 }}>
                          <Row gutter={[0, 0]}>
                            <Col span={24}>
                              <DrawerField label="Created by" variant="table">
                                <Space size={6} align="center">
                                  <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {ticket?.createdBy?.name || 'System'}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {ticket?.createdAt ? dayjs(ticket.createdAt).format('MMM D, YYYY HH:mm') : '-'}
                                  </Text>
                                </Space>
                              </DrawerField>
                            </Col>
                            <Col span={24}>
                              <DrawerField label="Updated by" variant="table">
                                <Space size={6} align="center">
                                  <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                    {(ticket as any)?.updatedBy?.name || ticket?.createdBy?.name || 'System'}
                                  </Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
                                  <Text type="secondary" style={{ fontSize: 11 }}>
                                    {ticket?.updatedAt ? dayjs(ticket.updatedAt).format('MMM D, YYYY HH:mm') : '-'}
                                  </Text>
                                </Space>
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
                                    emptyText="—"
                                    textStyle={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: 'var(--text-primary)',
                                      letterSpacing: '-0.01em',
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
                                    emptyText="—"
                                    textStyle={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}
                                  />
                                </DrawerField>
                              </Col>
                              <Col span={24}>
                                <DrawerField label="Start Date" variant="table">
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <EditableDate
                                      value={ticket.startDate}
                                      onSave={(val) => handleUpdate("startDate", val)}
                                      placeholder="Start"
                                    />
                                    {ticket.startDate && (
                                      <span className="date-meta-pill">
                                        {dayjs(ticket.startDate).fromNow()}
                                      </span>
                                    )}
                                  </div>
                                </DrawerField>
                              </Col>
                              <Col span={24}>
                                <DrawerField label="Due Date" variant="table">
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                    <EditableDate
                                      value={ticket.endDate}
                                      onSave={(val) => handleUpdate("endDate", val)}
                                      placeholder="Due By"
                                    />
                                    {ticket.endDate && (() => {
                                      const due = dayjs(ticket.endDate);
                                      const now = dayjs();
                                      const diff = due.diff(now, 'day');
                                      const overdue = diff < 0;
                                      const isDone = ticket.status === 'completed';
                                      const tone = isDone ? 'success' : overdue ? 'danger' : diff <= 2 ? 'warning' : 'muted';
                                      const label = isDone
                                        ? 'Done'
                                        : overdue
                                          ? `${Math.abs(diff)}d overdue`
                                          : diff === 0 ? 'Due today' : diff === 1 ? 'Due tomorrow' : `Due in ${diff}d`;
                                      return (
                                        <span className={`date-meta-pill date-meta-pill--${tone}`}>
                                          {label}
                                        </span>
                                      );
                                    })()}
                                  </div>
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
                                          <div style={{
                                            width: 20, height: 20, borderRadius: '50%',
                                            background: '#1890ff', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 10, fontWeight: 700
                                          }}>
                                            {entry.user.name.charAt(0).toUpperCase()}
                                          </div>
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
          border-radius: 12px !important;
          margin-bottom: 10px !important;
          background: var(--bg-pure-white) !important;
          overflow: hidden !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .sidebar-collapse-wrapper .ant-collapse-item:hover {
          border-color: var(--border-slate-200) !important;
          box-shadow: 0 4px 12px -6px rgba(15, 23, 42, 0.08) !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-header {
          padding: 10px 14px !important;
          background: transparent !important;
          border-bottom: none !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-header .ant-space-item:first-child > div {
          width: 22px !important;
          height: 22px !important;
          border-radius: 6px !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-header .ant-space-item:first-child .anticon {
          font-size: 12px !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-header .ant-typography {
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.06em !important;
          text-transform: uppercase !important;
          color: var(--text-slate-500) !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-content {
          background: transparent !important;
          border-top: 1px solid var(--border-color) !important;
        }
        .sidebar-collapse-wrapper .ant-collapse-content-box {
          padding: 4px 0 !important;
        }
        .sidebar-collapse-wrapper .DrawerField-table-variant {
          border-bottom: none !important;
          padding: 9px 14px !important;
          transition: background-color 0.15s ease;
          position: relative;
        }
        .sidebar-collapse-wrapper .DrawerField-table-variant + .DrawerField-table-variant::before,
        .sidebar-collapse-wrapper .ant-col + .ant-col .DrawerField-table-variant:first-child::before,
        .sidebar-collapse-wrapper .ant-col .DrawerField-table-variant + .DrawerField-table-variant::before {
          content: '';
          position: absolute;
          top: 0;
          left: 14px;
          right: 14px;
          height: 1px;
          background: var(--border-color);
        }
        .sidebar-collapse-wrapper .DrawerField-table-variant:hover {
          background-color: rgba(15, 23, 42, 0.02) !important;
        }
        .sidebar-collapse-wrapper .DrawerField-table-variant > div:first-child .ant-typography {
          font-size: 11.5px !important;
          font-weight: 600 !important;
          color: var(--text-slate-500) !important;
        }
        .date-meta-pill {
          font-size: 10.5px;
          font-weight: 700;
          line-height: 1;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.14);
          color: var(--text-slate-500);
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
        .date-meta-pill--success {
          background: rgba(16, 185, 129, 0.12);
          color: #059669;
        }
        .date-meta-pill--warning {
          background: rgba(245, 158, 11, 0.14);
          color: #b45309;
        }
        .date-meta-pill--danger {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        }
        .date-meta-pill--muted {
          background: rgba(148, 163, 184, 0.14);
          color: var(--text-slate-500);
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

    <CreateDocHubModal
      open={createDocOpen}
      onClose={() => setCreateDocOpen(false)}
      defaultName={ticket?.title ? `${ticket?.ticketNumber || 'Ticket'} — ${ticket.title}` : ''}
      defaultProjectId={
        typeof ticket?.project === 'string'
          ? (ticket.project as string)
          : (ticket?.project as any)?.id
      }
      defaultTicketId={ticket?.id}
      lockLink
      onCreated={(hubId) => {
        onClose();
        queryClient.invalidateQueries({ queryKey: ['ticket', currentTicketId, 'documentHubs'] });
        router.push(`/documenthub/${hubId}`);
      }}
    />

    <AiCreateHubModal
      open={createDocAiOpen}
      onClose={() => setCreateDocAiOpen(false)}
      defaultProjectId={
        typeof ticket?.project === 'string'
          ? (ticket.project as string)
          : (ticket?.project as any)?.id
      }
      defaultTicketId={ticket?.id}
      lockedTicket={ticket as any}
      onCreated={(hubId) => {
        onClose();
        queryClient.invalidateQueries({ queryKey: ['ticket', currentTicketId, 'documentHubs'] });
        router.push(`/documenthub/${hubId}`);
      }}
    />

    {/* Plain global <style> tag (not styled-jsx) — Next.js disallows two
        nested `<style jsx global>` blocks in the same tree, and this file
        already has one inside the Drawer for ticket-card styling. */}
    <style
      dangerouslySetInnerHTML={{
        __html: `
          .create-doc-from-ticket-menu .ant-dropdown-menu {
            padding: 6px !important;
            border-radius: 14px !important;
            border: 1px solid var(--border-slate-200) !important;
            background: var(--bg-pure-white) !important;
            box-shadow:
              0 12px 32px rgba(15, 23, 42, 0.10),
              0 2px 6px rgba(15, 23, 42, 0.06) !important;
            min-width: 320px !important;
          }
          .create-doc-from-ticket-menu .ant-dropdown-menu-item {
            border-radius: 10px !important;
            padding: 8px 10px !important;
            margin-bottom: 2px !important;
          }
          .create-doc-from-ticket-menu .ant-dropdown-menu-item:last-child {
            margin-bottom: 0 !important;
          }
          .create-doc-from-ticket-menu .ant-dropdown-menu-item:hover {
            background: var(--bg-slate-50) !important;
          }
        `,
      }}
    />
    </>
  );
};
