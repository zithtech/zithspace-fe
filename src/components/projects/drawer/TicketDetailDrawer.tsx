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
    Collapse
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
    EditOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { useTicketComments, useTicketAttachments, useTicketLinks, useAddComment, useDeleteComment, useUploadAttachment, useDeleteAttachment, useAddRelatedLink, useUpdateRelatedLink, useDeleteRelatedLink } from "@/hooks/useTicketDetails";
import { useTicket, useUpdateTicket } from "@/hooks/useTickets";
import { useMembers, useTicketConfig, useUserProjects } from "@/hooks/useGlobalData";
import { PRIORITY_OPTIONS, TYPE_OPTIONS, getStatusColor, getPriorityColor, getTypeColor } from "@/utils/ticketUtils";
import { EditableField } from "./editable/EditableField";
import { EditableSelect } from "./editable/EditableSelect";
import { EditableDate } from "./editable/EditableDate";
import TiptapEditor from "@/components/common/TiptapEditor";
import AttachmentList from "@/components/common/AttachmentList"; // Default export
import { AttachmentsSection, CommentsSection, RelatedLinksSection } from "../ticket-details";
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
    open
}) => {
    const [descriptionEditorOpen, setDescriptionEditorOpen] = useState(false);
    const [editorContent, setEditorContent] = useState('');

    // Data Hooks
    const { data: ticket, isLoading: ticketLoading } = useTicket(ticketId || "");
    const { data: comments = [], isLoading: commentsLoading } = useTicketComments(ticketId || "");
    const { data: relatedLinks = [], isLoading: linksLoading } = useTicketLinks(ticketId || "");
    const { data: attachments = [], isLoading: attachmentsLoading } = useTicketAttachments(ticketId || "");

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
    const priorities = ticketConfig?.priorities?.map((p: any) => ({ label: p.label, value: p.value, color: 'default' })) ||
        PRIORITY_OPTIONS.map(p => ({ label: p.label, value: p.value, color: getPriorityColor(p.value) }));

    const types = ticketConfig?.taskTypes?.map((t: any) => ({ label: t.label, value: t.value, color: 'default' })) ||
        TYPE_OPTIONS.map(t => ({ label: t.label, value: t.value, color: getTypeColor(t.value) }));

    const platforms = ticketConfig?.platforms?.map((p: any) => ({ label: p.label, value: p.value, color: 'default' })) || [];
    const stacks = ticketConfig?.stacks?.map((s: any) => ({ label: s.label, value: s.value, color: 'default' })) || [];
    const taskLevels = ticketConfig?.taskLevels?.map((l: any) => ({ label: l.label, value: l.value, color: 'default' })) || [];

    const statuses = [
        { label: "Not Started", value: "not_started", color: "default" },
        { label: "In Progress", value: "in_progress", color: "processing" },
        { label: "In Testing", value: "in_testing", color: "warning" },
        { label: "Completed", value: "completed", color: "success" },
    ];

    const projectMembers = members.map(m => ({ label: m.label, value: m.value, avatar: m.label.charAt(0) }));

    // Handlers
    const handleUpdate = async (field: string, value: any) => {
        if (!ticketId) return;
        try {
            await updateTicketMutation.mutateAsync({
                id: ticketId,
                data: { [field]: value }
            });
            message.success(`${field} updated`);
        } catch (error) {
            message.error("Failed to update");
        }
    };

    const handleDescriptionSave = async () => {
        // Only update if content changed/valid. 
        await handleUpdate('description', editorContent);
        setDescriptionEditorOpen(false);
    };

    // Renderers
    if (!ticketId) return null;

    return (
        <Drawer
            title={
                <Row justify="space-between" align="middle" style={{ width: '100%' }}>
                    <Space>
                        <Tag color="blue" style={{ fontSize: 14, padding: '4px 8px' }}>
                            {ticket?.ticketNumber || '...'}
                        </Tag>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
                                    Description
                                </Text>
                                {!descriptionEditorOpen && (
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => setDescriptionEditorOpen(true)}
                                        style={{ fontSize: 12, color: '#8c8c8c' }}
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
                                    <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                        <Button size="small" onClick={() => {
                                            setDescriptionEditorOpen(false);
                                            setEditorContent(ticket.description || ''); // Reset on cancel
                                        }}>Cancel</Button>
                                        <Button type="primary" size="small" onClick={handleDescriptionSave}>Done</Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="description-viewer"
                                    onClick={() => setDescriptionEditorOpen(true)}
                                    style={{
                                        minHeight: 80,
                                        cursor: 'text',
                                        padding: '12px',
                                        border: '1px solid transparent',
                                        borderRadius: 6,
                                        marginLeft: -12,
                                        position: 'relative'
                                    }}
                                >
                                    {ticket.description ? (
                                        <div dangerouslySetInnerHTML={{ __html: ticket.description }} />
                                    ) : (
                                        <Text type="secondary" style={{ fontStyle: 'italic' }}>Add a description...</Text>
                                    )}

                                    <div className="description-edit-icon" style={{ position: 'absolute', top: 8, right: 8, opacity: 0, transition: 'opacity 0.2s' }}>
                                        <EditOutlined style={{ fontSize: 16, color: '#1890ff', background: '#e6f7ff', padding: 4, borderRadius: 4 }} />
                                    </div>

                                    <style jsx>{`
                             .description-viewer:hover { border-color: #d9d9d9; background: #fafafa; }
                             .description-viewer:hover .description-edit-icon { opacity: 1; }
                           `}</style>
                                </div>
                            )}
                        </div>

                        {/* Subtasks Section */}
                        <div style={{ marginBottom: 32 }}>
                            <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden' }}>
                                <SubtasksSection
                                    tickets={ticket.subTasks || []}
                                    parentId={ticket.id}
                                    projectId={typeof ticket?.project === 'string' ? ticket.project : ticket?.project?.id || ""}
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
                                    key: 'comments',
                                    label: `Comments (${comments.length})`,
                                    children: (
                                        <CommentsSection
                                            comments={comments}
                                            isEditing={false} // pass false to enable Edit/Delete actions on items
                                            onAddComment={async (c) => await addCommentMutation.mutateAsync({ ticketId, comment: c })}
                                            onDeleteComment={async (id) => await deleteCommentMutation.mutateAsync({ ticketId, commentId: id })}
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
                                            onUpload={async (f, n) => await uploadAttachmentMutation.mutateAsync({ ticketId, file: f, fileName: n })}
                                            onDelete={async (id) => await deleteAttachmentMutation.mutateAsync({ ticketId, attachmentId: id })}
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
                                            onAddLink={async (t, d) => { await addLinkMutation.mutateAsync({ ticketId, linkData: { linkType: t, ...d } }) }}
                                            onUpdateLink={async (id, d) => { await updateLinkMutation.mutateAsync({ ticketId, linkId: id, linkData: d }) }}
                                            onDeleteLink={async (id) => { await deleteLinkMutation.mutateAsync({ ticketId, linkId: id }) }}
                                            isAddingLink={addLinkMutation.isPending}
                                            isUpdatingLink={updateLinkMutation.isPending}
                                            isDeletingLink={deleteLinkMutation.isPending}
                                        />
                                    )
                                }
                            ]}
                        />

                    </Col>

                    {/* RIGHT COLUMN: Metadata Sidebar */}
                    <Col xs={24} md={9} style={{ padding: 24, background: '#fff', height: '100%', overflowY: 'auto', borderLeft: '1px solid #f0f0f0' }}>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                            {/* Status & Transitions */}
                            <div>
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Status</Text>
                                <EditableSelect
                                    value={ticket.status}
                                    options={statuses}
                                    onSave={(val) => handleUpdate('status', val)}
                                    mode="tag"
                                />
                            </div>

                            {/* Collapsible Sections */}
                            <Collapse
                                defaultActiveKey={['details', 'planning']}
                                ghost
                                expandIconPosition="end"
                                items={[
                                    {
                                        key: 'details',
                                        label: <Space><InfoCircleOutlined /><Text strong style={{ fontSize: 13 }}>Details</Text></Space>,
                                        children: (
                                            <>
                                                <Row gutter={[12, 16]}>
                                                    <Col span={24}>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, width: 80 }}>Assignee</Text>
                                                            <div style={{ flex: 1 }}>
                                                                <EditableSelect
                                                                    value={typeof ticket.assignee === 'string' ? ticket.assignee : ticket.assignee?.id}
                                                                    options={projectMembers}
                                                                    onSave={(val) => handleUpdate('assignee', val)}
                                                                    mode="user"
                                                                    emptyText="Unassigned"
                                                                />
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col span={24}>
                                                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, width: 80 }}>Report To</Text>
                                                            <div style={{ flex: 1 }}>
                                                                <EditableSelect
                                                                    value={typeof ticket.reportTo === 'string' ? ticket.reportTo : ticket.reportTo?.id}
                                                                    options={projectMembers}
                                                                    onSave={(val) => handleUpdate('reportTo', val)}
                                                                    mode="user"
                                                                    emptyText="No Reporter"
                                                                />
                                                            </div>
                                                        </div>
                                                    </Col>

                                                    <Col span={24}>
                                                        <div style={{ marginBottom: 4 }}>
                                                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Platform</Text>
                                                            <EditableSelect
                                                                value={ticket.platform}
                                                                options={platforms}
                                                                onSave={(val) => handleUpdate('platform', val)}
                                                                mode="tag"
                                                                emptyText="Select Platform"
                                                            />
                                                        </div>
                                                    </Col>

                                                    {ticket.platform === 'Development' && (
                                                        <Col span={24}>
                                                            <div style={{ marginBottom: 4 }}>
                                                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Stack</Text>
                                                                <EditableSelect
                                                                    value={ticket.stack || ticket.metadata?.stack}
                                                                    options={stacks}
                                                                    onSave={(val) => handleUpdate('stack', val)}
                                                                    mode="tag"
                                                                    emptyText="Select Stack"
                                                                />
                                                            </div>
                                                        </Col>
                                                    )}

                                                    <Col span={12}>
                                                        <div style={{ marginBottom: 4 }}>
                                                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Priority</Text>
                                                            <EditableSelect
                                                                value={ticket.priority}
                                                                options={priorities}
                                                                onSave={(val) => handleUpdate('priority', val)}
                                                                mode="tag"
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col span={12}>
                                                        <div style={{ marginBottom: 4 }}>
                                                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Type</Text>
                                                            <EditableSelect
                                                                value={ticket.type}
                                                                options={types}
                                                                onSave={(val) => handleUpdate('type', val)}
                                                                mode="tag"
                                                            />
                                                        </div>
                                                    </Col>
                                                    <Col span={24}>
                                                        <div style={{ marginBottom: 4 }}>
                                                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Task Level</Text>
                                                            <EditableSelect
                                                                value={ticket.taskLevel}
                                                                options={taskLevels}
                                                                onSave={(val) => handleUpdate('taskLevel', val)}
                                                                mode="tag"
                                                            />
                                                        </div>
                                                    </Col>
                                                </Row>


                                            </>
                                        )
                                    },
                                    {
                                        key: 'planning',
                                        label: <Space><CalendarOutlined /><Text strong style={{ fontSize: 13 }}>Planning</Text></Space>,
                                        children: (
                                            <Row gutter={[12, 16]}>
                                                <Col span={12}>
                                                    <div style={{ marginBottom: 4 }}>
                                                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Story Points</Text>
                                                        <div style={{ marginTop: 4 }}>
                                                            <EditableField
                                                                value={ticket.storyPoint}
                                                                onSave={(val) => handleUpdate('storyPoint', Number(val))}
                                                                type="number"
                                                                emptyText="-"
                                                                textStyle={{
                                                                    background: '#e6f7ff',
                                                                    borderRadius: 12,
                                                                    padding: '2px 8px',
                                                                    color: '#096dd9',
                                                                    fontWeight: 600,
                                                                    width: 'fit-content',
                                                                    minWidth: 24,
                                                                    textAlign: 'center'
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ marginBottom: 4 }}>
                                                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Estimate (h)</Text>
                                                        <div style={{ marginTop: 4 }}>
                                                            <EditableField
                                                                value={ticket.estimateHours}
                                                                onSave={(val) => handleUpdate('estimateHours', Number(val))}
                                                                type="number"
                                                                emptyText="-"
                                                            />
                                                        </div>
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ marginBottom: 4 }}>
                                                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Start Date</Text>
                                                        <EditableDate
                                                            value={ticket.startDate}
                                                            onSave={(val) => handleUpdate('startDate', val)}
                                                            placeholder="Start"
                                                        />
                                                    </div>
                                                </Col>
                                                <Col span={12}>
                                                    <div style={{ marginBottom: 4 }}>
                                                        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 2 }}>Due Date</Text>
                                                        <EditableDate
                                                            value={ticket.endDate}
                                                            onSave={(val) => handleUpdate('endDate', val)}
                                                            placeholder="Due By"
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        )
                                    }
                                ]}
                            />

                            <div style={{ marginTop: 'auto', paddingTop: 24, fontSize: 12, color: '#8c8c8c' }}>
                                Created {dayjs(ticket.createdAt).format('MMM D, YYYY')} by {ticket.createdBy?.name}
                                <br />
                                Updated {dayjs(ticket.updatedAt).fromNow()}
                            </div>

                        </div>
                    </Col>
                </Row>
            )}
        </Drawer>
    );
}
