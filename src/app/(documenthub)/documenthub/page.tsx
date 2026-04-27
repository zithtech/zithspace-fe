"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import Header from "@/components/common/Header";
import MainLayout from "@/components/layout/MainLayout";
import {
  useUserProjects,
  useUserTicketsByProjects,
  useMembers,
} from "@/hooks/useGlobalData";
import DocumentHubService, { DocumentHub } from "@/services/documentHub";
import { aiService } from "@/services/ai";
import { TicketDetails } from "@/types/ticket";
import {
  FileZipOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ProjectOutlined,
  TagOutlined,
  DeleteOutlined,
  RestOutlined,
  ShareAltOutlined,
  LockOutlined,
  FileTextOutlined,
  FolderOutlined,
  GlobalOutlined,
  EyeOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import ShareModal from "@/components/documenthub/ShareModal";
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Table,
  Tag,
  Card,
  Tooltip,
  DatePicker,
  Space,
  message,
  Spin,
  Tabs,
  Typography,
} from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnsType } from "antd/es/table";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import dayjs from "dayjs";
import TrashDrawer from "@/components/documenthub/TrashDrawer";
import DocumentHubDashboard from "@/components/documenthub/DocumentHubDashboard";

const { Option } = Select;
const { RangePicker } = DatePicker;

type Props = {};
const DocumentHubPage = (props: Props) => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { canReadDocument, canCreateDocument, canUpdateDocument, canDeleteDocument } = usePermission();

  // Route guard
  useEffect(() => {
    if (!authLoading && !canReadDocument) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadDocument, router]);

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [selectedProjectId, setSelectedProjectId] = useState<
    string | undefined
  >("");
  const [filterProjectId, setFilterProjectId] = useState<string | undefined>(
    undefined,
  );
  const [searchText, setSearchText] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | undefined>(
    undefined,
  );
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);
  const [trashVisible, setTrashVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  // Share Modal State
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedHubForShare, setSelectedHubForShare] = useState<{
    id: string;
    title: string;
    visibility: string;
    shareToken: string | null;
  } | null>(null);

  // AI Hub State
  const [hubTabKey, setHubTabKey] = useState<'manual' | 'ai'>('manual');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [suggestedStructure, setSuggestedStructure] = useState<any[]>([]);
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [currentStep, setCurrentStep] = useState(0); // 0: Prompt, 1: Review

  // Content Generation Progress State
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationTotal, setGenerationTotal] = useState(0);
  const [isProcessingContent, setIsProcessingContent] = useState(false);
  const [currentProcessingTitle, setCurrentProcessingTitle] = useState('');

  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: tickets = [], isLoading: ticketsLoading } =
    useUserTicketsByProjects(selectedProjectId);
  const { data: members = [], isLoading: membersLoading } = useMembers();

  const queryClient = useQueryClient();

  const {
    data: documentHubs = [],
    isLoading: hubsLoading,
    refetch,
  } = useQuery({
    queryKey: ["documentHubs"],
    queryFn: DocumentHubService.getAllDocumentHubs,
  });

  const handleAddDocument = async (values: any) => {
    try {
      setIsCreating(true);
      const documentDetails = {
        ...values,
      };

      const data = await DocumentHubService.createDocumentHub(documentDetails);

      // If AI mode was used, execute the structure and content creation in one single pass
      if (hubTabKey === 'ai' && suggestedStructure.length > 0) {
        try {
          setIsProcessingContent(true);
          setCurrentProcessingTitle('Architecting content for all files...');
          
          // The backend now handles both structure AND content generation in this single call
          await aiService.createHubStructure(data.id, suggestedStructure);
          
          messageApi.success("Hub architected and content generated successfully.");
        } catch (aiError) {
          console.error("AI structure or content creation failed:", aiError);
          messageApi.warning("Hub created, but AI content generation encountered an issue.");
        } finally {
          setIsProcessingContent(false);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
      if (data?.id) {
        await queryClient.invalidateQueries({ queryKey: ["documentHub", data.id] });
      }
      setModalVisible(false);
      resetAIState();
      form.resetFields();

      router.push(`/documenthub/${data?.id}`);
    } catch (error) {
      console.error("Failed to create document hub", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateStructure = async () => {
    if (!aiPrompt.trim()) {
      messageApi.warning("Please enter a description for your hub.");
      return;
    }

    setIsGeneratingStructure(true);
    try {
      const result = await aiService.suggestStructure(aiPrompt);
      setSuggestedStructure(result.structure);
      setSuggestedTitle(result.suggestedTitle);
      setCurrentStep(1);
    } catch (error: any) {
      messageApi.error(error.message || "Failed to generate structure.");
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  const resetAIState = () => {
    setHubTabKey('manual');
    setAiPrompt('');
    setSuggestedStructure([]);
    setSuggestedTitle('');
    setCurrentStep(0);
    setIsGeneratingStructure(false);
  };

  const handleDeleteHub = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    modal.confirm({
      title: "Delete Document Hub",
      content: `Are you sure you want to delete "${name}"? This will move it to trash.`,
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await DocumentHubService.deleteDocumentHub(id);
          messageApi.success("Document Hub moved to trash");
          queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
        } catch (error) {
          console.error(error);
          messageApi.error("Failed to delete Document Hub");
        }
      },
    });
  };

  const handleShareHub = (e: React.MouseEvent, hub: any) => {
    e.stopPropagation();
    setSelectedHubForShare({
      id: hub.id,
      title: hub.name,
      visibility: hub.visibility || 'private',
      shareToken: hub.shareToken || null
    });
    setShareModalOpen(true);
  };

  const filteredHubs = documentHubs.filter((hub) => {
    const matchesSearch = hub.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesUser = selectedUser ? hub.createdById === selectedUser : true;
    const matchesProject = filterProjectId
      ? hub.projectId === filterProjectId
      : true;

    let matchesDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = startOfDay(dateRange[0].toDate());
      const endDate = endOfDay(dateRange[1].toDate());
      const hubDate = new Date(hub.createdAt);
      matchesDate = isWithinInterval(hubDate, {
        start: startDate,
        end: endDate,
      });
    }

    return matchesSearch && matchesUser && matchesProject && matchesDate;
  });

  // Loading & permission check
  if (authLoading) {
    return (
      <MainLayout>
        <div style={{
          margin: "0 -24px",
          padding: "24px 32px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Spin size="large" tip="Orchestrating technical repository..." />
        </div>
      </MainLayout>
    );
  }

  if (!canReadDocument) {
    return null;
  }

  const columns: ColumnsType<DocumentHub> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Tooltip title={text} mouseEnterDelay={0.5}>
          <span className="font-medium text-blue-600 truncate block max-w-[300px]">
            {text}
          </span>
        </Tooltip>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Project",
      dataIndex: ["project", "name"],
      key: "project",
      render: (text, record) =>
        record.project ? (
          <Tooltip title={record.project.code}>
            <Tag color="blue">{text}</Tag>
          </Tooltip>
        ) : (
          <span className="text-slate-400" style={{ color: 'var(--text-slate-400)' }}>-</span>
        ),
    },
    {
      title: "Ticket",
      dataIndex: ["ticket", "title"],
      key: "ticket",
      render: (text, record) =>
        record.ticket ? (
          <Tooltip title={record.ticket.status}>
            <Tag color="orange">
              {record.ticket.ticketNumber || record.ticket.id}
            </Tag>
          </Tooltip>
        ) : (
          <span className="text-slate-400" style={{ color: 'var(--text-slate-400)' }}>-</span>
        ),
    },
    {
      title: "Created By",
      dataIndex: ["createdBy", "name"],
      key: "createdBy",
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span className="text-slate-500" style={{ color: 'var(--text-slate-600)' }}>
          {format(new Date(date), "MMM d, yyyy")}
        </span>
      ),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => (
        <span className="text-slate-500" style={{ color: 'var(--text-slate-600)' }}>
          {format(new Date(date), "MMM d, yyyy")}
        </span>
      ),
      sorter: (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: "Visibility",
      dataIndex: "visibility",
      key: "visibility",
      width: 130,
      render: (visibility, record) => {
        const isOwner = user?.id === record.createdById;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              size="small"
              value={visibility || 'public'}
              disabled={!isOwner}
              style={{ width: 100 }}
              bordered={false}
              className="visibility-select"
              onChange={async (value) => {
                try {
                  if (value === 'public') {
                    await DocumentHubService.shareDocumentHub(record.id, 'public');
                  } else {
                    await DocumentHubService.revokeHubShare(record.id);
                  }
                  messageApi.success(`Hub is now ${value}`);
                  refetch();
                } catch (error) {
                  console.error(error);
                  messageApi.error("Failed to update visibility");
                }
              }}
              options={[
                { value: 'private', label: <Space><LockOutlined /> Private</Space> },
                { value: 'public', label: <Space><GlobalOutlined /> Public</Space> },
              ]}
            />
          </div>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button
            type="text"
            icon={<ShareAltOutlined className="text-blue-500" />}
            onClick={(e) => handleShareHub(e, record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => handleDeleteHub(e, record.id, record.name)}
          />
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      {contextHolder}
      {modalContextHolder}
      <div style={{
        margin: "0 -24px",
        padding: "24px 32px 16px 32px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column"
      }}>
        <div className="flex justify-between items-center mb-3 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2" style={{ color: 'var(--text-slate-900)' }}>
              <FileZipOutlined className="text-blue-500" />
              Document Hub
            </h1>
            <p className="text-slate-500 mt-1" style={{ color: 'var(--text-slate-400)' }}>
              Manage all your documentation in one place
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              icon={<RestOutlined />}
              onClick={() => setTrashVisible(true)}
            >
              Trash
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              Create Hub
            </Button>
          </div>
        </div>

        {/* Main Card - This will scroll as a whole */}
        <div
        // className="bg-white rounded-lg shadow-sm border border-gray-100 flex-1 overflow-y-auto" style={{marginBottom:20}}
        >
          {/* Dashboard Cards */}
          <div className="pt-4 pb-2">
            <DocumentHubDashboard
              documentHubs={documentHubs}
              isLoading={hubsLoading}
              onHubClick={(id) => router.push(`/documenthub/${id}`)}
              onShareHub={handleShareHub}
            />
          </div>

          {/* Filters Section - Sticky inside the card */}
          <div className="sticky top-0  bg-white z-20" style={{ background: 'var(--bg-pure-white)' }}>
            <div className="px-4 py-2 flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2 w-full">
                <Input
                  placeholder="Search..."
                  prefix={<SearchOutlined className="text-slate-400" style={{ color: 'var(--text-slate-400)' }} />}
                  style={{ width: "40%" }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  placeholder="Project"
                  style={{ width: 150 }}
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  value={filterProjectId}
                  onChange={setFilterProjectId}
                  loading={projectsLoading}
                  options={projects}
                />
                <Select
                  placeholder="Created By"
                  showSearch
                  style={{ width: 150 }}
                  allowClear
                  optionFilterProp="label"
                  value={selectedUser}
                  onChange={setSelectedUser}
                  loading={membersLoading}
                  options={members.map((m: any) => ({
                    label: m.label,
                    value: m.value,
                  }))}
                />
                <RangePicker
                  style={{ width: 240 }}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as any)}
                />
              </div>
            </div>
          </div>


          <div className="p-2">
            <Table
              columns={columns}
              dataSource={filteredHubs}
              rowKey="id"
              loading={hubsLoading}
              pagination={{ pageSize: 20, showSizeChanger: true }}
              size="small"
              sticky={{
                offsetHeader: 80,
              }}
              scroll={{
                y: "calc(100vh - 380px)",
              }}
              onRow={(record) => ({
                onClick: () => router.push(`/documenthub/${record.id}`),
                className: "cursor-pointer",
              })}
              className="[&_.ant-table-body]:!scrollbar-hide [&_.ant-table-body]:![-ms-overflow-style:none] [&_.ant-table-body]:![scrollbar-width:none] [&_.ant-table-body::-webkit-scrollbar]:!hidden"
            />
          </div>
        </div>
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-blue-50)' }}>
              <FileZipOutlined className="text-blue-500 text-lg" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-900 leading-tight" style={{ color: 'var(--text-slate-900)' }}>Create New Hub</div>
              <div className="text-sm font-normal text-slate-500" style={{ color: 'var(--text-slate-400)' }}>Organize your technical knowledge and project assets</div>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
        centered
        className="premium-modal"
        styles={{
          mask: { backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.4)' },
          content: { borderRadius: '16px', padding: '24px' }
        }}
      >
        <Tabs
          activeKey={hubTabKey}
          onChange={(key) => {
            setHubTabKey(key as 'manual' | 'ai');
            if (key === 'manual') resetAIState();
          }}
          items={[
            {
              key: 'manual',
              label: 'Manual Setup',
              children: (
                <Form form={form} layout="vertical" onFinish={handleAddDocument}>
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <Form.Item
                        name="name"
                        label={<span className="font-medium text-slate-700" style={{ color: 'var(--text-slate-700)' }}>Hub Name</span>}
                        rules={[
                          { required: true, message: "Please enter hub name" },
                          { min: 2, message: "Name must be at least 2 characters" },
                        ]}
                      >
                        <Input
                          size="large"
                          placeholder="e.g., API Documentation"
                          prefix={<FileTextOutlined className="text-slate-400" style={{ color: 'var(--text-slate-400)' }} />}
                          className="rounded-lg border-slate-200 hover:border-blue-400 focus:border-blue-500"
                          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-900)' }}
                        />
                      </Form.Item>
                    </Col>

                    <Col span={24}>
                      <Form.Item
                        name="projectId"
                        label={<span className="font-medium text-slate-700" style={{ color: 'var(--text-slate-700)' }}>Project <span className="text-slate-400 font-normal" style={{ color: 'var(--text-slate-400)' }}>(Optional)</span></span>}
                      >
                        <Select
                          size="large"
                          placeholder="Select project"
                          loading={projectsLoading}
                          className="rounded-lg"
                          suffixIcon={<ProjectOutlined className="text-slate-400" style={{ color: 'var(--text-slate-400)' }} />}
                          onChange={(value) => {
                            setSelectedProjectId(value);
                            form.setFieldsValue({ projectId: value });
                          }}
                          allowClear
                        >
                          {projects.map((project) => (
                            <Option key={project.value} value={project.value}>
                              {project.label} ({project.code})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="ticketId"
                        label={<span className="font-medium text-slate-700" style={{ color: 'var(--text-slate-700)' }}>Ticket <span className="text-slate-400 font-normal" style={{ color: 'var(--text-slate-400)' }}>(Optional)</span></span>}
                      >
                        <Select
                          size="large"
                          showSearch
                          placeholder="Select ticket"
                          loading={ticketsLoading}
                          className="rounded-lg"
                          suffixIcon={<TagOutlined className="text-slate-400" style={{ color: 'var(--text-slate-400)' }} />}
                          allowClear
                          disabled={!selectedProjectId}
                          optionFilterProp="label"
                          options={tickets.map((ticket: any) => ({
                            value: ticket.id,
                            label: `${ticket.ticketNumber} (${ticket.title})`,
                          }))}
                          filterOption={(input, option) =>
                            String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div className="flex items-center justify-end gap-3 mt-8 pt-4 border-t border-slate-100" style={{ borderTopColor: 'var(--border-slate-100)' }}>
                    <Button
                      size="large"
                      className="px-6 rounded-lg font-medium text-slate-500 border-none hover:bg-slate-100"
                      style={{ color: 'var(--text-slate-600)' }}
                      onClick={() => {
                        setModalVisible(false);
                        setSelectedProjectId(undefined);
                        form.resetFields();
                        resetAIState();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      htmlType="submit"
                      loading={isCreating}
                      className="px-8 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 border-none"
                    >
                      Create Hub
                    </Button>
                  </div>
                </Form>
              )
            },
            {
              key: 'ai',
              label: (
                <span>
                  <RobotOutlined /> AI Hub Architect
                </span>
              ),
              children: (
                <div className="py-2">
                  {currentStep === 0 ? (
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                      <div>
                        <Typography.Title level={5} style={{ margin: 0 }}>What's the goal?</Typography.Title>
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                          Provide a detailed description of the documentation hub you want the AI to architect.
                        </Typography.Paragraph>
                      </div>
                      <Input.TextArea
                        rows={6}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g., A comprehensive documentation hub for a Fintech SaaS project, including API specs, user guides, and legal compliance..."
                        style={{ borderRadius: 12 }}
                      />
                      <Button
                        type="primary"
                        block
                        size="large"
                        icon={<RobotOutlined />}
                        onClick={handleGenerateStructure}
                        loading={isGeneratingStructure}
                        style={{ height: 48, borderRadius: 12, marginTop: 8 }}
                      >
                        Architect Hub Structure
                      </Button>
                    </Space>
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size={16}>
                      <div>
                        <Typography.Title level={5} style={{ margin: 0 }}>Review Suggested Structure</Typography.Title>
                        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                          The AI has suggested this folder and file hierarchy.
                        </Typography.Paragraph>
                      </div>
                      <Card
                        size="small"
                        style={{
                          borderRadius: 12,
                          background: '#f8fafc',
                          maxHeight: 300,
                          overflowY: 'auto',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ padding: '8px' }}>
                          {suggestedStructure.map((node, i) => (
                            <div key={i} style={{ marginBottom: 4 }}>
                              <Space>
                                {node.type === 'folder' ? <FolderOutlined style={{ color: '#faad14' }} /> : <FileTextOutlined style={{ color: '#1890ff' }} />}
                                <Typography.Text strong={node.type === 'folder'}>{node.title}</Typography.Text>
                              </Space>
                              {node.children && node.children.map((child: any, j: number) => (
                                <div key={j} style={{ marginLeft: 24, marginTop: 4 }}>
                                  <Space>
                                    {child.type === 'folder' ? <FolderOutlined style={{ color: '#faad14' }} /> : <FileTextOutlined style={{ color: '#1890ff' }} />}
                                    <Typography.Text>{child.title}</Typography.Text>
                                  </Space>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </Card>
                      {isProcessingContent ? (
                        <Card size="small" style={{ borderRadius: 12, border: '1px solid #bae7ff', background: '#f0f7ff', marginTop: 12 }}>
                          <Space direction="vertical" style={{ width: '100%' }} align="center" size={12}>
                            <Spin indicator={<RobotOutlined spin style={{ fontSize: 24 }} />} />
                            <div style={{ textAlign: 'center' }}>
                              <Typography.Text strong style={{ display: 'block' }}>
                                {currentProcessingTitle}
                              </Typography.Text>
                              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                Building technical repository and generating intelligent content...
                              </Typography.Text>
                            </div>
                            <div style={{ width: '100%', height: 8, background: '#e6f7ff', borderRadius: 4, overflow: 'hidden', border: '1px solid #91d5ff' }}>
                              <div style={{
                                width: `100%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #1890ff 0%, #69c0ff 100%)',
                                transition: 'width 0.5s ease'
                              }} />
                            </div>
                          </Space>
                        </Card>
                      ) : (
                        <div className="flex gap-3 mt-4">
                          <Button style={{ flex: 1 }} onClick={() => setCurrentStep(0)}>Back</Button>
                          <Button
                            type="primary"
                            style={{ flex: 2 }}
                            loading={isCreating}
                            onClick={() => handleAddDocument({ name: suggestedTitle || "AI Generated Hub" })}
                          >
                            Confirm & Build Hub
                          </Button>
                        </div>
                      )}
                    </Space>
                  )}
                </div>
              )
            }
          ]}
        />
      </Modal>

      {selectedHubForShare && (
        <ShareModal
          open={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedHubForShare(null);
            refetch(); // Refresh to get updated sharing state
          }}
          entityId={selectedHubForShare.id}
          entityTitle={selectedHubForShare.title}
          entityType="hub"
          currentVisibility={selectedHubForShare.visibility}
          currentShareToken={selectedHubForShare.shareToken}
        />
      )}

      <TrashDrawer open={trashVisible} onClose={() => setTrashVisible(false)} />
    </MainLayout>
  );
};

export default DocumentHubPage;
