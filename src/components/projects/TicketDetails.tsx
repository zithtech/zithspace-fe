"use client";

import React, { useState } from "react";
import { Form, Alert, message } from "antd";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import { useUserProjects, useProjectMembers, useTicketConfig } from "@/hooks/useGlobalData";
import {
  useTicketDetails,
  useTicketComments,
  useTicketLinks,
  useTicketAttachments,
  useUpdateTicket,
  useAddComment,
  useUpdateComment,
  useDeleteComment,
  useAddRelatedLink,
  useUpdateRelatedLink,
  useDeleteRelatedLink,
  useUploadAttachment,
  useDeleteAttachment,
} from "@/hooks/useTicketDetails";
import { TicketDetailsProps } from "@/types/ticket";
import { usePermission } from "@/hooks/usePermission";
import { PRIORITY_OPTIONS, TYPE_OPTIONS } from "@/utils/ticketUtils";
import {
  TicketDetailStyles,
  TicketDetailHero,
  TicketDetailsForm,
  TicketDescription,
  TicketProperties,
  TicketPeople,
  RelatedLinksSection,
  AttachmentsSection,
  CommentsSection,
  TicketDetailsLoading,
} from "./ticket-details";

export default function TicketDetails({ ticketId }: TicketDetailsProps) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { canAssignTicket, canReadActivityLog } = usePermission();

  // React Query hooks for data fetching (parallel loading)
  const { data: ticket, isLoading: ticketLoading } = useTicketDetails(ticketId);
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(ticketId);
  const { data: relatedLinks = [], isLoading: linksLoading } = useTicketLinks(ticketId);
  const { data: attachments = [], isLoading: attachmentsLoading } = useTicketAttachments(ticketId);

  // Mutation hooks
  const updateTicketMutation = useUpdateTicket();
  const addCommentMutation = useAddComment();
  const updateCommentMutation = useUpdateComment();
  const deleteCommentMutation = useDeleteComment();
  const addLinkMutation = useAddRelatedLink();
  const updateLinkMutation = useUpdateRelatedLink();
  const deleteLinkMutation = useDeleteRelatedLink();
  const uploadAttachmentMutation = useUploadAttachment();
  const deleteAttachmentMutation = useDeleteAttachment();

  const projectId = typeof ticket?.project === 'string' ? ticket.project : ticket?.project?.id;

  // Use cached global data hooks - only fetch when editing
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects({ enabled: editing });
  const { data: members = [], isLoading: membersLoading } = useProjectMembers(projectId, { enabled: editing });
  const { data: ticketConfig, isLoading: configLoading } = useTicketConfig({ enabled: editing });

  // Extract dropdown options from cached config
  const platforms = ticketConfig?.platforms || [];
  const stacks = ticketConfig?.stacks || [];
  const priorities = ticketConfig?.priorities || PRIORITY_OPTIONS.map(opt => ({ value: opt.value, label: opt.label, color: 'default' }));
  const taskLevels = ticketConfig?.taskLevels || [];
  const taskTypes = ticketConfig?.taskTypes || TYPE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label, color: 'default' }));

  // Combined loading states
  const dataLoading = projectsLoading || membersLoading || configLoading;
  const loading = ticketLoading || commentsLoading || linksLoading || attachmentsLoading;

  // Handler functions
  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      // Check if assignee is being changed and user lacks assign permission
      const originalAssigneeId = typeof ticket?.assignee === 'string' 
        ? ticket.assignee 
        : ticket?.assignee?.id || null;
      
      const newAssigneeId = values.assignee || null;

      if (originalAssigneeId !== newAssigneeId && !canAssignTicket) {
        message.error("Access Denied: You do not have permission to assign tickets.");
        return;
      }

      const updateData = {
        title: values.title,
        description: values.description,
        platform: values.platform,
        project: values.project,
        stack: values.stack,
        priority: values.priority,
        taskLevel: values.taskLevel,
        type: values.type,
        storyPoint: values.storyPoint,
        estimateHours: values.estimateHours,
        assignee: values.assignee || null,
        reportTo: values.reportTo || null,
        status: values.status,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        releasePlan: values.releasePlan || undefined,
      };

      // Remove undefined/null/empty values
      Object.keys(updateData).forEach(key => {
        if (key === 'assignee' || key === 'reportTo') {
          return;
        }
        if (updateData[key as keyof typeof updateData] === undefined ||
            updateData[key as keyof typeof updateData] === null ||
            updateData[key as keyof typeof updateData] === '') {
          delete updateData[key as keyof typeof updateData];
        }
      });

      await updateTicketMutation.mutateAsync({ ticketId, updates: updateData });
      message.success("Ticket updated successfully");
      setEditing(false);
    } catch (error) {
      console.error("Failed to update ticket:", error);
      message.error("Failed to update ticket");
    }
  };

  const handleAddComment = async (comment: string) => {
    await addCommentMutation.mutateAsync({ ticketId, comment });
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!ticketId) return;
    await deleteCommentMutation.mutateAsync({ ticketId, commentId });
  };

  const handleEditComment = async (commentId: string, comment: string) => {
    if (!ticketId) return;
    await updateCommentMutation.mutateAsync({ ticketId, commentId, comment });
  };

  const handleAddLink = async (linkType: any, linkData: any) => {
    await addLinkMutation.mutateAsync({
      ticketId,
      linkData: { linkType, ...linkData }
    });
  };

  const handleUpdateLink = async (linkId: string, linkData: any) => {
    await updateLinkMutation.mutateAsync({ ticketId, linkId, linkData });
  };

  const handleDeleteLink = async (linkId: string) => {
    await deleteLinkMutation.mutateAsync({ ticketId, linkId });
  };

  const handleUploadAttachment = async (file: string, fileName: string) => {
    await uploadAttachmentMutation.mutateAsync({ ticketId, file, fileName });
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    await deleteAttachmentMutation.mutateAsync({ ticketId, attachmentId });
  };

  // Loading state
  if (loading) {
    return <TicketDetailsLoading />;
  }

  // Error state
  if (!ticket) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Alert
          message="Ticket Not Found"
          description="The requested ticket could not be found."
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="tdx tdx-page">
      <TicketDetailStyles />

      <TicketDetailHero
        ticket={ticket}
        isEditing={editing}
        onEdit={() => setEditing(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        canViewHistory={canReadActivityLog}
      />

      <TransactionHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entityType="ticket"
        entityId={ticketId}
        subtitle={ticket ? `${ticket.ticketNumber ?? ""}${ticket.title ? ` — ${ticket.title}` : ""}` : undefined}
      />

      <div className="tdx-grid">
        {/* Primary column */}
        <div className="tdx-col">
          <Form form={form} layout="vertical" component={false}>
            {editing ? (
              <div className="tdx-card tdx-card--form">
                <div className="tdx-card__body">
                  <TicketDetailsForm
                    ticket={ticket}
                    form={form}
                    projects={projects}
                    members={members}
                    platforms={platforms}
                    stacks={stacks}
                    priorities={priorities}
                    taskLevels={taskLevels}
                    taskTypes={taskTypes}
                    onSave={handleSave}
                    onCancel={() => setEditing(false)}
                    isSaving={updateTicketMutation.isPending}
                    dataLoading={dataLoading}
                    canAssignTicket={canAssignTicket}
                  />
                </div>
              </div>
            ) : (
              <TicketDescription ticket={ticket} />
            )}
          </Form>

          <CommentsSection
            chrome="card"
            comments={comments}
            isEditing={editing}
            onAddComment={handleAddComment}
            onEditComment={handleEditComment}
            onDeleteComment={handleDeleteComment}
            isAddingComment={addCommentMutation.isPending}
            isEditingComment={updateCommentMutation.isPending}
            isDeletingComment={deleteCommentMutation.isPending}
          />
        </div>

        {/* Context rail */}
        <aside className="tdx-col tdx-col--rail">
          <TicketProperties ticket={ticket} />
          <TicketPeople ticket={ticket} />
          <RelatedLinksSection
            chrome="card"
            relatedLinks={relatedLinks}
            isEditing={editing}
            onAddLink={handleAddLink}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
            isAddingLink={addLinkMutation.isPending}
            isUpdatingLink={updateLinkMutation.isPending}
            isDeletingLink={deleteLinkMutation.isPending}
          />
          <AttachmentsSection
            chrome="card"
            attachments={attachments}
            isLoading={attachmentsLoading}
            isEditing={editing}
            onUpload={handleUploadAttachment}
            onDelete={handleDeleteAttachment}
          />
        </aside>
      </div>

      <style jsx global>{`
        .tdx-page {
          padding: 0 28px 48px;
          max-width: 1520px;
          margin: 0 auto;
          background: var(--tdx-canvas);
          min-height: 100%;
        }
        .tdx-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 384px;
          gap: 20px;
          align-items: start;
        }
        .tdx-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 0;
        }
        .tdx-col--rail {
          position: sticky;
          top: 76px;
        }
        .tdx-card--form .tdx-card__body {
          padding: 20px;
        }

        @media (max-width: 1280px) {
          .tdx-grid {
            grid-template-columns: minmax(0, 1fr) 340px;
          }
        }
        @media (max-width: 1024px) {
          .tdx-grid {
            grid-template-columns: minmax(0, 1fr);
          }
          .tdx-col--rail {
            position: static;
          }
        }
        @media (max-width: 640px) {
          .tdx-page {
            padding: 0 14px 36px;
          }
        }
      `}</style>
    </div>
  );
}
