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
  FileTextOutlined,
} from "@ant-design/icons";
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
  Tooltip,
  DatePicker,
  Space,
  message,
  Spin,
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
  const { isLoading: authLoading } = useAuth();
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
      await queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
      setModalVisible(false);
      form.resetFields();
      router.push(`/documenthub/${data?.id}`);
    } catch (error) {
      console.error("Failed to create document hub", error);
    } finally {
      setIsCreating(false);
    }
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
        <span className="font-medium text-blue-600">{text}</span>
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
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => handleDeleteHub(e, record.id, record.name)}
        />
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
              Create Document
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
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-slate-50)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                setModalVisible(false);
                setSelectedProjectId(undefined);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isCreating}
              className="px-8 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 border-none outline-none"
              style={{ display: 'flex', alignItems: 'center', height: '40px' }}
            >
              Create Hub
            </Button>
          </div>
        </Form>
      </Modal>

      <TrashDrawer open={trashVisible} onClose={() => setTrashVisible(false)} />
    </MainLayout>
  );
};

export default DocumentHubPage;
