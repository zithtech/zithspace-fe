"use client";

import React, { useState } from "react";
import { Card, Form, Alert, Row, Col, message, Space } from "antd";
import { useUserProjects, useMembers, useTicketConfig } from "@/hooks/useGlobalData";
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
  TicketDetailsHeader,
  TicketDetailsForm,
  TicketInformation,
  RelatedLinksSection,
  AttachmentsSection,
  CommentsSection,
  WorkflowProgress,
  TicketDetailsLoading,
} from "./ticket-details";

export default function TicketDetails({ ticketId }: TicketDetailsProps) {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const { canAssignTicket } = usePermission();

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

  // Use cached global data hooks - only fetch when editing
  const { data: projects = [], isLoading: projectsLoading } = useUserProjects({ enabled: editing });
  const { data: members = [], isLoading: membersLoading } = useMembers({ enabled: editing });
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
    <div className="p-10">
      <TicketDetailsHeader />

      <Row gutter={24}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          <Form form={form} layout="vertical" component={false}>
            {editing ? (
              <Card>
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
              </Card>
            ) : (
              <TicketInformation ticket={ticket} onEdit={() => setEditing(true)} />
            )}
          </Form>

          <div style={{ marginTop: 24 }}>
            <CommentsSection
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
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={24} style={{ width: "100%" }}>
            <WorkflowProgress ticket={ticket} />
            <RelatedLinksSection
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
              attachments={attachments}
              isLoading={attachmentsLoading}
              isEditing={editing}
              onUpload={handleUploadAttachment}
              onDelete={handleDeleteAttachment}
            />
          </Space>
        </Col>
      </Row>
    </div>
  );
}
