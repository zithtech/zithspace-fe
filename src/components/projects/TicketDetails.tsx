"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Avatar,
  Descriptions,
  Progress,
  Timeline,
  Alert,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  message,
  Spin,
  Divider,
  List,
  Skeleton,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  SendOutlined,
  PlusOutlined,
  LinkOutlined,
  DeleteOutlined,
  ExportOutlined,
  FileTextOutlined,
  BgColorsOutlined,
  CodeOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import TicketService, { RelatedLink } from "@/services/ticketService";
import { ProjectService } from "@/services/projectService";
import { MembersService } from "@/services/membersService";
import {
  SettingsService,
  TicketConfigurations,
} from "@/services/settingsService";
import TiptapEditor from '@/components/common/TiptapEditor';
import TiptapViewer from '@/components/common/TiptapViewer';
import AttachmentUploader from '@/components/common/AttachmentUploader';
import AttachmentList from '@/components/common/AttachmentList';
import { useUserProjects, useMembers, useTicketConfig } from "@/hooks/useGlobalData";
import {
  useTicketDetails,
  useTicketComments,
  useTicketLinks,
  useTicketAttachments,
  useUpdateTicket,
  useAddComment,
  useDeleteComment,
  useAddRelatedLink,
  useUpdateRelatedLink,
  useDeleteRelatedLink,
  useUploadAttachment,
  useDeleteAttachment,
} from "@/hooks/useTicketDetails";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TYPE_OPTIONS } from "@/utils/ticketUtils";

interface TicketDetailsProps {
  ticketId: string;
}

interface TicketDetails {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  platform: string;
  stack?: string;
  project: {
    id: string;
    name: string;
    code: string;
  };
  priority: "P1" | "P2" | "P3";
  type: string;
  taskLevel: string;
  status: string;
  assignee: {
    id: string;
    name: string;
    email: string;
  };
  reportTo:
    | {
        id: string;
        name: string;
        position?: string;
      }
    | string;
  storyPoint: number;
  estimateHours: number;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  startDate?: string;
  endDate?: string;
  currentStep?: string;
  completedSteps?: number;
  totalSteps?: number;
  releasePlan?: string;
  comments?: Array<{
    id: string;
    userId:
      | string
      | {
          id: string;
          name: string;
          email: string;
        };
    userName?: string;
    comment: string;
    timestamp: string;
  }>;
}

interface TicketComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

export default function TicketDetails({ ticketId }: TicketDetailsProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  
  // React Query hooks for data fetching (parallel loading)
  const { data: ticket, isLoading: ticketLoading } = useTicketDetails(ticketId);
  const { data: comments = [], isLoading: commentsLoading } = useTicketComments(ticketId);
  const { data: relatedLinks = [], isLoading: linksLoading } = useTicketLinks(ticketId);
  const { data: attachments = [], isLoading: attachmentsLoading } = useTicketAttachments(ticketId);

  // Mutation hooks
  const updateTicketMutation = useUpdateTicket();
  const addCommentMutation = useAddComment();
  const deleteCommentMutation = useDeleteComment();
  const addLinkMutation = useAddRelatedLink();
  const updateLinkMutation = useUpdateRelatedLink();
  const deleteLinkMutation = useDeleteRelatedLink();
  const uploadAttachmentMutation = useUploadAttachment();
  const deleteAttachmentMutation = useDeleteAttachment();

  // UI state
  const [editing, setEditing] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Comments state
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  // Related Links state
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<
    "ui_design" | "scope_doc" | "sample_response" | "dev_doc" | null
  >(null);
  const [linkFormData, setLinkFormData] = useState({
    description: "",
    url: "",
  });
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);

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

  // Populate form when ticket data is loaded
  useEffect(() => {
    if (ticket && editing) {
      form.setFieldsValue({
        title: ticket.title || "",
        description: ticket.description || "",
        platform: ticket.platform || "",
        stack: (ticket as any).stack || "",
        project: typeof ticket.project === 'string' ? ticket.project : ticket.project?.id || "",
        priority: ticket.priority || "",
        type: ticket.type || "",
        taskLevel: ticket.taskLevel || "",
        status: ticket.status || "",
        assignee: ticket.assignee?.id || "",
        reportTo: typeof ticket.reportTo === "string" ? ticket.reportTo : ticket.reportTo?.id || "",
        storyPoint: (ticket as any).storyPoint || 0,
        estimateHours: (ticket as any).estimateHours || 0,
        startDate: (ticket as any).startDate ? dayjs((ticket as any).startDate) : null,
        endDate: (ticket as any).endDate ? dayjs((ticket as any).endDate) : null,
        releasePlan: (ticket as any).releasePlan || "",
      });
    }
  }, [ticket, editing, form]);

  const handleUploadAttachment = async (file: string, fileName: string) => {
    try {
      await uploadAttachmentMutation.mutateAsync({ ticketId, file, fileName });
      message.success("Attachment uploaded successfully");
    } catch (error: any) {
      console.error("Failed to upload attachment:", error);
      throw error;
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachmentMutation.mutateAsync({ ticketId, attachmentId });
      message.success("Attachment deleted successfully");
    } catch (error) {
      console.error("Failed to delete attachment:", error);
      message.error("Failed to delete attachment");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

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
        assignee: values.assignee,
        reportTo: values.reportTo,
        status: values.status,
        startDate: values.startDate ? values.startDate.toISOString() : null,
        endDate: values.endDate ? values.endDate.toISOString() : null,
        releasePlan: values.releasePlan || undefined,
      };

      // Remove undefined/null/empty values
      Object.keys(updateData).forEach(key => {
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await addCommentMutation.mutateAsync({ ticketId, comment: newComment });
      setNewComment("");
      message.success("Comment added successfully");
    } catch (error) {
      console.error("Failed to add comment:", error);
      message.error("Failed to add comment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "processing";
      case "in_testing":
        return "warning";
      case "not_started":
        return "default";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P1":
        return "red";
      case "P2":
        return "orange";
      case "P3":
        return "green";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Bug":
        return "red";
      case "Task":
        return "blue";
      case "Feat":
        return "green";
      case "Overwrite":
        return "orange";
      default:
        return "default";
    }
  };

  const workflowSteps = [
    "Scope Document",
    "KT (Knowledge Transfer)",
    "Developer Doc",
    "Grooming",
    "Dev Code Work Effort",
    "Designer Approval",
    "Testing",
    "Unit Testing",
    "Code Review",
    "Push to Live",
    "Live Test",
  ];

  if (loading) {
    return (
      <div className="p-10">
        {/* Header Skeleton */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Skeleton.Button active size="default" style={{ width: 80 }} />
          </Col>
        </Row>

        <Row gutter={24}>
          {/* Main Content Skeleton */}
          <Col xs={24} lg={16}>
            {/* Ticket Header Card Skeleton */}
            <Card>
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "8px",
                  padding: "20px",
                  marginBottom: "24px",
                  border: "1px solid #e8e8e8",
                }}
              >
                {/* Ticket Number */}
                <Skeleton.Button active size="small" style={{ width: 100, marginBottom: 12 }} />
                
                {/* Title */}
                <Skeleton active title={{ width: '70%' }} paragraph={false} style={{ marginBottom: 16 }} />
                
                {/* Description */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "6px",
                    padding: "16px",
                    border: "1px solid #e8e8e8",
                  }}
                >
                  <Skeleton active paragraph={{ rows: 4 }} />
                </div>
              </div>

              {/* Ticket Information Skeleton */}
              <Divider orientation="left">Ticket Information</Divider>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>

            {/* Related Links Card Skeleton */}
            <Card title="Related Links" style={{ marginTop: 16 }}>
              <Skeleton active avatar paragraph={{ rows: 2 }} />
              <Divider />
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </Card>

            {/* Attachments Card Skeleton */}
            <Card title="Attachments" style={{ marginTop: 16 }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>

            {/* Comments Card Skeleton */}
            <Card title="Comments" style={{ marginTop: 16 }}>
              <Skeleton.Input active size="large" block style={{ marginBottom: 16 }} />
              <Divider />
              <Skeleton active avatar paragraph={{ rows: 2 }} />
              <Divider />
              <Skeleton active avatar paragraph={{ rows: 2 }} />
            </Card>
          </Col>

          {/* Sidebar Skeleton */}
          <Col xs={24} lg={8}>
            <Card title="Workflow Progress">
              {/* Progress Bar Skeleton */}
              <div style={{ marginBottom: 16 }}>
                <Skeleton.Input active size="small" block />
              </div>
              
              {/* Timeline Skeleton */}
              <Skeleton active paragraph={{ rows: 10 }} />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

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
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
              Back
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          <Card>
            {/* Hidden form to prevent useForm warning - always keeps form connected */}
            {!editing && (
              <Form form={form} style={{ display: 'none' }}>
                <Form.Item name="title"><Input /></Form.Item>
              </Form>
            )}
            
            {editing ? (
              <div style={{ position: "relative" }}>
                {/* Save/Cancel Buttons - Top Right */}
                <div
                  style={{
                    position: "absolute",
                    top: "0px",
                    right: "0px",
                    zIndex: 10,
                  }}
                >
                  <Space>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setEditing(false);
                      }}
                      size="small"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={updateTicketMutation.isPending}
                      onClick={handleSave}
                      size="small"
                    >
                      Save Changes
                    </Button>
                  </Space>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  style={{ paddingTop: "40px" }}
                >
                  <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: "Please enter title" }]}
                  >
                    <Input placeholder="Enter ticket title..." />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Platform"
                        name="platform"
                        rules={[
                          { required: true, message: "Please select platform" },
                        ]}
                      >
                        <Select loading={dataLoading}>
                          {platforms.map((platform) => (
                            <Select.Option
                              key={platform.value}
                              value={platform.value}
                            >
                              {platform.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="Project"
                        name="project"
                        rules={[
                          { required: true, message: "Please select project" },
                        ]}
                      >
                        <Select loading={dataLoading}>
                          {projects.map((project) => (
                            <Select.Option
                              key={project.value}
                              value={project.value}
                            >
                              {project.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) =>
                      prevValues.platform !== currentValues.platform
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue("platform") === "Development" ? (
                        <Form.Item
                          label="Stack"
                          name="stack"
                          rules={[
                            { required: true, message: "Please select a stack" },
                          ]}
                        >
                          <Select loading={dataLoading}>
                            {stacks.map((stack) => (
                              <Select.Option
                                key={stack.value}
                                value={stack.value}
                              >
                                {stack.label}
                              </Select.Option>
                            ))}
                          </Select>
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>

                  <Form.Item
                    label="Description"
                    name="description"
                    rules={[
                      { required: true, message: "Please enter description" },
                    ]}
                  >
                    <TiptapEditor
                      content={form.getFieldValue('description')}
                      onChange={(html) => form.setFieldValue('description', html)}
                      minHeight={200}
                      maxHeight={400}
                    />
                  </Form.Item>

                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Priority"
                        name="priority"
                        rules={[
                          { required: true, message: "Please select priority" },
                        ]}
                      >
                        <Select loading={dataLoading}>
                          {priorities.map((priority) => (
                            <Select.Option
                              key={priority.value}
                              value={priority.value}
                            >
                              {priority.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Status"
                        name="status"
                        rules={[
                          { required: true, message: "Please select status" },
                        ]}
                      >
                        <Select loading={dataLoading}>
                          {STATUS_OPTIONS.map((status) => (
                            <Select.Option key={status.value} value={status.value}>
                              {status.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      {/* Empty column for better spacing */}
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Task Type"
                        name="taskType"
                        rules={[
                          {
                            required: true,
                            message: "Please select task type",
                          },
                        ]}
                      >
                        <Select loading={dataLoading}>
                          {taskTypes.map((taskType) => (
                            <Select.Option
                              key={taskType.value}
                              value={taskType.value}
                            >
                              {taskType.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Task Level"
                        name="taskLevel"
                        rules={[
                          {
                            required: true,
                            message: "Please select task level",
                          },
                        ]}
                      >
                        <Select loading={dataLoading}>
                          {taskLevels.map((taskLevel) => (
                            <Select.Option
                              key={taskLevel.value}
                              value={taskLevel.value}
                            >
                              {taskLevel.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Story Points"
                        name="storyPoint"
                        rules={[
                          {
                            required: true,
                            message: "Please enter story points",
                          },
                        ]}
                      >
                        <InputNumber
                          min={1}
                          max={5}
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Assignee"
                        name="assignee"
                        rules={[
                          { required: true, message: "Please select assignee" },
                        ]}
                      >
                        <Select
                          placeholder="Select assignee"
                          loading={dataLoading}
                          showSearch
                          filterOption={(input, option) => {
                            const member = members.find(
                              (m) => m.value === option?.value
                            );
                            return member
                              ? member.label
                                  .toLowerCase()
                                  .includes(input.toLowerCase()) ||
                                  member.position
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                              : false;
                          }}
                        >
                          {members.map((member) => (
                            <Select.Option
                              key={member.value}
                              value={member.value}
                            >
                              {member.label} - {member.position}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Report To"
                        name="reportTo"
                        rules={[
                          {
                            required: true,
                            message: "Please select report to",
                          },
                        ]}
                      >
                        <Select
                          placeholder="Select manager"
                          loading={dataLoading}
                          showSearch
                          filterOption={(input, option) => {
                            const member = members.find(
                              (m) => m.value === option?.value
                            );
                            return member
                              ? member.label
                                  .toLowerCase()
                                  .includes(input.toLowerCase()) ||
                                  member.position
                                    .toLowerCase()
                                    .includes(input.toLowerCase())
                              : false;
                          }}
                        >
                          {members.map((member) => (
                            <Select.Option
                              key={member.value}
                              value={member.value}
                            >
                              {member.label} - {member.position}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Estimate Hours"
                        name="estimateHours"
                        rules={[
                          {
                            required: true,
                            message: "Please enter estimate hours",
                          },
                        ]}
                      >
                        <InputNumber min={1} style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item label="Start Date" name="startDate">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="End Date" name="endDate">
                        <DatePicker style={{ width: "100%" }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item label="Plans" name="releasePlan">
                    <Input />
                  </Form.Item>
                </Form>
              </div>
            ) : (
              <div>
                {/* Simple Ticket Header Section */}
                <div
                  style={{
                    background: "#fafafa",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "24px",
                    border: "1px solid #e8e8e8",
                    position: "relative",
                  }}
                >
                  {/* Edit Button - Top Right */}
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                    }}
                  >
                    <Button
                      type="primary"
                      icon={<EditOutlined />}
                      onClick={() => setEditing(true)}
                      size="small"
                    >
                      Edit Ticket
                    </Button>
                  </div>

                  {/* Ticket Number */}
                  <div style={{ marginBottom: "12px" }}>
                    <Tag
                      color="blue"
                      style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        padding: "4px 10px",
                        borderRadius: "4px",
                      }}
                    >
                      {ticket.ticketNumber}
                    </Tag>
                  </div>

                  {/* Title */}
                  <Title
                    level={3}
                    style={{
                      margin: "0 0 16px 0",
                      color: "#262626",
                      fontSize: "22px",
                      fontWeight: "600",
                      lineHeight: "1.4",
                      paddingRight: "120px", // Add padding to avoid overlap with button
                    }}
                  >
                    {ticket.title}
                  </Title>

                  {/* Description */}
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "6px",
                      padding: "16px",
                      border: "1px solid #e8e8e8",
                    }}
                  >
                    <Text
                      strong
                      style={{
                        color: "#8c8c8c",
                        fontSize: "12px",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        display: "block",
                        marginBottom: "8px",
                      }}
                    >
                      Description
                    </Text>
                    <TiptapViewer
                      content={ticket.description}
                      minHeight={100}
                    />
                  </div>
                </div>

                <Descriptions title="Ticket Information" bordered column={2}>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(ticket.status)}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Priority">
                    <Tag color={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Project">
                    <Tag color="blue">
                      {typeof ticket.project === 'string' ? ticket.project : ticket.project?.name || "Unknown"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Platform">
                    {ticket?.platform || "Not specified"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Task Type">
                    <Tag color={getTypeColor(ticket?.type || "")}>
                      {ticket?.type || "Not specified"}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Task Level">
                    {ticket?.taskLevel || "Not specified"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Story Points">
                    {ticket?.storyPoint || 0}/5
                  </Descriptions.Item>
                  <Descriptions.Item label="Estimate Hours">
                    {ticket?.estimateHours || 0}h
                  </Descriptions.Item>
                  <Descriptions.Item label="Assignee">
                    <Space>
                      <Avatar
                        size="small"
                        style={{ backgroundColor: "#1677ff" }}
                      >
                        {ticket?.assignee?.name?.charAt(0) || "U"}
                      </Avatar>
                      {ticket?.assignee?.name || "Unassigned"}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Report To">
                    {typeof ticket?.reportTo === "string"
                      ? ticket.reportTo
                      : ticket?.reportTo?.name || "Not assigned"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created By">
                    {ticket?.createdBy?.name || "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created At">
                    {ticket?.createdAt
                      ? dayjs(ticket.createdAt).format("MMMM DD, YYYY HH:mm")
                      : "Unknown"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Duration" span={2}>
                    {ticket?.startDate && ticket?.endDate
                      ? `${dayjs(ticket.startDate).format("MMM DD")} - ${dayjs(
                          ticket.endDate
                        ).format("MMM DD, YYYY")}`
                      : "Not set"}
                  </Descriptions.Item>
                  {(ticket as any)?.releasePlan && (
                    <Descriptions.Item label="Plans" span={2}>
                      <Tag color="purple">{(ticket as any).releasePlan}</Tag>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </div>
            )}
          </Card>

          {/* Related Links Section */}
          <Card
            title="Related Links"
            style={{ marginTop: 16 }}
            extra={
              !editing && (
                <Select
                  placeholder="Add Link"
                  style={{ width: 150 }}
                  value={null}
                  onChange={(value) => {
                    setSelectedLinkType(value);
                    setShowAddLinkForm(true);
                    setLinkFormData({ description: "", url: "" });
                    setEditingLinkId(null);
                  }}
                  suffixIcon={<PlusOutlined />}
                >
                  <Select.Option value="ui_design">
                    <Space>
                      <BgColorsOutlined />
                      UI Design Link
                    </Space>
                  </Select.Option>
                  <Select.Option value="scope_doc">
                    <Space>
                      <FileTextOutlined />
                      Scope Doc Link
                    </Space>
                  </Select.Option>
                  <Select.Option value="sample_response">
                    <Space>
                      <ApiOutlined />
                      Sample Response/Payload
                    </Space>
                  </Select.Option>
                  <Select.Option value="dev_doc">
                    <Space>
                      <CodeOutlined />
                      Dev Doc Link
                    </Space>
                  </Select.Option>
                </Select>
              )
            }
          >
            {/* Add Link Form */}
            {showAddLinkForm && selectedLinkType && (
              <div
                style={{
                  background: "#fafafa",
                  border: "1px solid #e8e8e8",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "16px",
                }}
              >
                <div style={{ marginBottom: "12px" }}>
                  <Text strong>
                    Add{" "}
                    {selectedLinkType === "ui_design"
                      ? "UI Design Link"
                      : selectedLinkType === "scope_doc"
                      ? "Scope Doc Link"
                      : selectedLinkType === "sample_response"
                      ? "Sample Response/Payload Link"
                      : "Dev Doc Link"}
                  </Text>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <Text>Description</Text>
                  <Input
                    placeholder="Enter description for this link..."
                    value={linkFormData.description}
                    onChange={(e) =>
                      setLinkFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    style={{ marginTop: "4px" }}
                  />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <Text>URL</Text>
                  <Input
                    placeholder="https://..."
                    value={linkFormData.url}
                    onChange={(e) =>
                      setLinkFormData((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    style={{ marginTop: "4px" }}
                  />
                </div>

                <div style={{ textAlign: "right" }}>
                  <Space>
                    <Button
                      size="small"
                      onClick={() => {
                        setShowAddLinkForm(false);
                        setSelectedLinkType(null);
                        setLinkFormData({ description: "", url: "" });
                        setEditingLinkId(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      loading={addLinkMutation.isPending || updateLinkMutation.isPending}
                      onClick={async () => {
                        if (
                          !linkFormData.description.trim() ||
                          !linkFormData.url.trim()
                        ) {
                          message.error("Please fill in all fields");
                          return;
                        }

                        // // Basic URL validation
                        // if (!linkFormData.url.match(/^https?:\/\/.+/)) {
                        //   message.error('Please enter a valid URL starting with http:// or https://');
                        //   return;
                        // }

                        try {
                          if (editingLinkId) {
                            await updateLinkMutation.mutateAsync({
                              ticketId,
                              linkId: editingLinkId,
                              linkData: {
                                title: linkFormData.description.trim().substring(0, 100),
                                description: linkFormData.description.trim(),
                                url: linkFormData.url.trim(),
                              }
                            });
                            message.success("Link updated successfully");
                          } else {
                            await addLinkMutation.mutateAsync({
                              ticketId,
                              linkData: {
                                linkType: selectedLinkType!,
                                title: linkFormData.description.trim().substring(0, 100),
                                description: linkFormData.description.trim(),
                                url: linkFormData.url.trim(),
                              }
                            });
                            message.success("Link added successfully");
                          }

                          // Reset form
                          setShowAddLinkForm(false);
                          setSelectedLinkType(null);
                          setLinkFormData({ description: "", url: "" });
                          setEditingLinkId(null);
                        } catch (error) {
                          console.error("Failed to save link:", error);
                          message.error("Failed to save link");
                        }
                      }}
                    >
                      {editingLinkId ? "Update" : "Save"} Link
                    </Button>
                  </Space>
                </div>
              </div>
            )}

            {/* Display existing links */}
            <div>
              {relatedLinks.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#999",
                    padding: "20px",
                  }}
                >
                  No related links added yet
                </div>
              ) : (
                <List
                  dataSource={relatedLinks}
                  renderItem={(link) => {
                    // Check if this link is being edited
                    const isEditing = editingLinkId === link.id;
                    
                    if (isEditing) {
                      // Show inline edit form
                      return (
                        <List.Item>
                          <div style={{ width: "100%", padding: "12px", background: "#fafafa", borderRadius: "8px" }}>
                            <div style={{ marginBottom: "12px" }}>
                              <Text strong>Edit Link</Text>
                            </div>
                            <div style={{ marginBottom: "12px" }}>
                              <Text>Description</Text>
                              <Input
                                placeholder="Enter description..."
                                value={linkFormData.description}
                                onChange={(e) =>
                                  setLinkFormData((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                style={{ marginTop: "4px" }}
                              />
                            </div>
                            <div style={{ marginBottom: "12px" }}>
                              <Text>URL</Text>
                              <Input
                                placeholder="https://..."
                                value={linkFormData.url}
                                onChange={(e) =>
                                  setLinkFormData((prev) => ({
                                    ...prev,
                                    url: e.target.value,
                                  }))
                                }
                                style={{ marginTop: "4px" }}
                              />
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <Space>
                                <Button
                                  size="small"
                                  onClick={() => {
                                    setEditingLinkId(null);
                                    setLinkFormData({ description: "", url: "" });
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="primary"
                                  size="small"
                                  loading={updateLinkMutation.isPending}
                                  onClick={async () => {
                                    if (!linkFormData.description.trim() || !linkFormData.url.trim()) {
                                      message.error("Please fill in all fields");
                                      return;
                                    }
                                    
                                    try {
                                      await updateLinkMutation.mutateAsync({
                                        ticketId,
                                        linkId: link.id || "",
                                        linkData: {
                                          title: linkFormData.description.trim().substring(0, 100),
                                          description: linkFormData.description.trim(),
                                          url: linkFormData.url.trim(),
                                        }
                                      });
                                      message.success("Link updated successfully");
                                      setEditingLinkId(null);
                                      setLinkFormData({ description: "", url: "" });
                                    } catch (error) {
                                      console.error("Failed to update link:", error);
                                      message.error("Failed to update link");
                                    }
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
                    
                    // Show normal link display
                    return (
                      <List.Item
                        actions={
                          !editing
                            ? [
                                <Button
                                  key="edit"
                                  type="link"
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => {
                                    setEditingLinkId(link.id || "");
                                    setLinkFormData({
                                      description: link.description,
                                      url: link.url,
                                    });
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
                                  loading={deleteLinkMutation.isPending}
                                  onClick={async () => {
                                    try {
                                      await deleteLinkMutation.mutateAsync({
                                        ticketId,
                                        linkId: link.id || ""
                                      });
                                      message.success("Link deleted successfully");
                                    } catch (error) {
                                      console.error("Failed to delete link:", error);
                                      message.error("Failed to delete link");
                                    }
                                  }}
                                >
                                  Delete
                                </Button>,
                              ]
                            : []
                        }
                      >
                        <List.Item.Meta
                          avatar={
                            link.type === "ui_design" ? (
                              <BgColorsOutlined
                                style={{ fontSize: "16px", color: "#1677ff" }}
                              />
                            ) : link.type === "scope_doc" ? (
                              <FileTextOutlined
                                style={{ fontSize: "16px", color: "#52c41a" }}
                              />
                            ) : link.type === "sample_response" ? (
                              <ApiOutlined
                                style={{ fontSize: "16px", color: "#fa8c16" }}
                              />
                            ) : (
                              <CodeOutlined
                                style={{ fontSize: "16px", color: "#722ed1" }}
                              />
                            )
                          }
                          title={
                            <Space>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ fontWeight: 500 }}
                              >
                                {link.title}
                                <ExportOutlined
                                  style={{ marginLeft: "4px", fontSize: "12px" }}
                                />
                              </a>
                            </Space>
                          }
                          description={link.description}
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </div>
          </Card>

          {/* Attachments Section */}
          <Card
            title={
              <Space>
                <span>Attachments</span>
                {attachments.length > 0 && (
                  <Tag color="blue">{attachments.length}</Tag>
                )}
              </Space>
            }
            style={{ marginTop: 16 }}
          >
            {!editing && (
              <div style={{ marginBottom: 16 }}>
                <AttachmentUploader
                  onUpload={handleUploadAttachment}
                  maxSize={5}
                  disabled={editing}
                />
              </div>
            )}

            <AttachmentList
              attachments={attachments}
              onDelete={handleDeleteAttachment}
              loading={attachmentsLoading}
            />
          </Card>

          {/* Comments Section */}
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
                  loading={addCommentMutation.isPending}
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

                const isEditing = editingCommentId === comment.id;

                if (isEditing) {
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
                              loading={updateTicketMutation.isPending}
                              onClick={async () => {
                                if (!editCommentText.trim()) {
                                  message.error("Comment cannot be empty");
                                  return;
                                }

                                try {
                                  await updateTicketMutation.mutateAsync({
                                    ticketId,
                                    updates: { comment: editCommentText.trim() }
                                  });
                                  message.success("Comment updated successfully");
                                  setEditingCommentId(null);
                                  setEditCommentText("");
                                } catch (error) {
                                  console.error("Failed to update comment:", error);
                                  message.error("Failed to update comment");
                                }
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
                      !editing
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
                              loading={deleteCommentMutation.isPending}
                              onClick={async () => {
                                try {
                                  await deleteCommentMutation.mutateAsync({
                                    ticketId,
                                    commentId: comment.id
                                  });
                                  message.success("Comment deleted successfully");
                                } catch (error) {
                                  console.error("Failed to delete comment:", error);
                                  message.error("Failed to delete comment");
                                }
                              }}
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
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          <Card title="Workflow Progress">
            <Progress
              percent={Math.round(
                (((ticket as any).completedSteps || 0) / ((ticket as any).totalSteps || 11)) * 100
              )}
              format={() =>
                `${(ticket as any).completedSteps || 0}/${
                  (ticket as any).totalSteps || 11
                } steps completed`
              }
              style={{ marginBottom: 16 }}
            />

            <Timeline
              items={workflowSteps.map((step, index) => ({
                color:
                  index < ((ticket as any).completedSteps || 0)
                    ? "green"
                    : index === ((ticket as any).completedSteps || 0)
                    ? "blue"
                    : "gray",
                children: (
                  <div>
                    <Text strong={index === ((ticket as any).completedSteps || 0)}>
                      {step}
                    </Text>
                    {index === ((ticket as any).completedSteps || 0) && (
                      <Tag color="processing" style={{ marginLeft: 8 }}>
                        Current
                      </Tag>
                    )}
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
