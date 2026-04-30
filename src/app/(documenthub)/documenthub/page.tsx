"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
// import Header from "@/components/common/Header";
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
  ShareAltOutlined,
  LockOutlined,
  FileTextOutlined,
  GlobalOutlined,
  EyeOutlined,
  UserOutlined,
  ReloadOutlined,
  FolderOutlined,
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
  Tooltip,
  DatePicker,
  Space,
  message,
  Spin,
  Divider,
  Avatar,
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
const InlineTicketSelector = ({
  record,
  updateHub,
  user
}: any) => {
  const [searchValue, setSearchValue] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const isOwner = user?.id === record.createdById;

  // Use the hook locally for each row to avoid state conflicts
  const { data: rowTickets = [], isLoading: rowTicketsLoading } =
    useUserTicketsByProjects(record.projectId);

  const getOptions = () => {
    const sortedTickets = [...(rowTickets || [])].sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let filtered = sortedTickets;

    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = sortedTickets.filter((t: any) =>
        t.ticketNumber?.toLowerCase().includes(search) ||
        t.title?.toLowerCase().includes(search)
      );
    }

    let limited = filtered.slice(0, 10);

    if (record.ticketId && !limited.find(t => t.id === record.ticketId)) {
      const currentTicket = sortedTickets.find(t => t.id === record.ticketId);
      if (currentTicket) {
        limited.push(currentTicket);
      }
    }

    return limited.map((t: any) => ({
      label: (
        <div className="flex flex-col py-1">
          <span className="font-semibold text-slate-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>{t.ticketNumber}</span>
          <span className="text-slate-400 truncate" style={{ fontSize: '9px', lineHeight: '1.2', maxWidth: '160px' }}>{t.title}</span>
        </div>
      ),
      value: t.id
    }));
  };

  if (record.ticketId && !isEditing) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="flex flex-col py-0.5 px-2 hover:bg-sky-50 rounded-md cursor-pointer transition-colors group"
        style={{ width: 'fit-content', maxWidth: '100%' }}
      >
        <span className="font-semibold text-sky-500 group-hover:text-sky-600" style={{ fontSize: '11px', lineHeight: '1.2' }}>
          {record.ticket?.ticketNumber}
        </span>
        <span className="text-slate-400 truncate group-hover:text-slate-500" style={{ fontSize: '9px', lineHeight: '1.2', maxWidth: '160px' }}>
          {record.ticket?.title}
        </span>
      </div>
    );
  }

  if (!record.ticketId && !isEditing) {
    return (
      <div onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined style={{ fontSize: '10px' }} />}
          className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 flex items-center gap-1 p-0 px-2 h-7 rounded-md"
          style={{ fontSize: '11px', fontWeight: 500 }}
          disabled={!isOwner}
        >
          Add Ticket
        </Button>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        placeholder={<span className="text-slate-400">Search...</span>}
        value={record.ticketId || undefined}
        disabled={!isOwner}
        loading={rowTicketsLoading}
        className="w-full premium-inline-select"
        variant="borderless"
        showSearch
        allowClear
        autoFocus
        defaultOpen
        onSearch={setSearchValue}
        searchValue={searchValue}
        onBlur={() => setIsEditing(false)}
        onChange={(value) => {
          updateHub(record.id, { ticketId: value, name: record.name });
          setSearchValue("");
          setIsEditing(false);
        }}
        options={getOptions()}
        filterOption={false}
        style={{ minWidth: 220 }}
      />
    </div>
  );
};

const InlineProjectSelector = ({
  record,
  projects,
  projectsLoading,
  updateHub,
  user
}: any) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const isOwner = user?.id === record.createdById;

  const getOptions = () => {
    return (projects || []).map((p: any) => ({
      label: (
        <div className="flex flex-col py-1">
          <span className="font-semibold text-slate-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>{p.label}</span>
          {p.code && (
            <span className="text-slate-400" style={{ fontSize: '9px', lineHeight: '1.2' }}>{p.code}</span>
          )}
        </div>
      ),
      value: p.value
    }));
  };

  if (record.projectId && !isEditing) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
        className="flex flex-col py-0.5 px-2 hover:bg-sky-50 rounded-md cursor-pointer transition-colors group"
        style={{ width: 'fit-content', maxWidth: '100%' }}
      >
        <span className="font-semibold text-sky-600 group-hover:text-sky-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>
          {record.project?.name}
        </span>
        {record.project?.code && (
          <span className="text-slate-400 group-hover:text-slate-500 truncate" style={{ fontSize: '9px', lineHeight: '1.2', maxWidth: '130px' }}>
            {record.project.code}
          </span>
        )}
      </div>
    );
  }

  if (!record.projectId && !isEditing) {
    return (
      <div onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
        <Button
          type="text"
          size="small"
          icon={<PlusOutlined style={{ fontSize: '10px' }} />}
          className="text-slate-400 hover:text-blue-500 hover:bg-blue-50 flex items-center gap-1 p-0 px-2 h-7 rounded-md"
          style={{ fontSize: '11px', fontWeight: 500 }}
          disabled={!isOwner}
        >
          Add Project
        </Button>
      </div>
    );
  }

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Select
        placeholder={<span className="text-slate-400">Search project...</span>}
        value={record.projectId || undefined}
        disabled={!isOwner}
        loading={projectsLoading}
        className="w-full premium-inline-select"
        variant="borderless"
        showSearch
        autoFocus
        defaultOpen
        onBlur={() => setIsEditing(false)}
        onChange={(value) => {
          updateHub(record.id, { projectId: value, name: record.name });
          setIsEditing(false);
        }}
        options={getOptions()}
        style={{ minWidth: 220 }}
      />
    </div>
  );
};

const DocumentHubPage = (props: Props) => {
  const router = useRouter();
  // ... rest of state ...
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
  const [filterTicketId, setFilterTicketId] = useState<string | undefined>(undefined);
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

  const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
  const { data: tickets = [], isLoading: ticketsLoading } =
    useUserTicketsByProjects(selectedProjectId);
  const { data: filterTickets = [], isLoading: filterTicketsLoading } =
    useUserTicketsByProjects(filterProjectId);
  const { data: members = [], isLoading: membersLoading } = useMembers();

  const queryClient = useQueryClient();

  const {
    data: documentHubs = [],
    isLoading: hubsLoading,
    isFetching: hubsFetching,
    refetch,
  } = useQuery({
    queryKey: ["documentHubs"],
    queryFn: DocumentHubService.getAllDocumentHubs,
  });

  const updateHub = async (id: string, data: any) => {
    try {
      const response = await DocumentHubService.updateDocumentHub(id, data);
      console.log("UpdateHub Response:", response);
      messageApi.success("Hub updated successfully");
      refetch();
    } catch (error) {
      console.error(error);
      messageApi.error("Update failed");
    }
  };

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
      ? (hub.projectId === filterProjectId || hub.project?.id === filterProjectId)
      : true;
    const matchesTicket = filterTicketId
      ? (hub.ticketId === filterTicketId || hub.ticket?.id === filterTicketId)
      : true;

    let matchesDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = startOfDay(dateRange[0].toDate());
      const endDate = endOfDay(dateRange[1].toDate());
      const createdAt = new Date(hub.createdAt);
      const updatedAt = new Date(hub.updatedAt);

      const createdInRange = isWithinInterval(createdAt, { start: startDate, end: endDate });
      const updatedInRange = isWithinInterval(updatedAt, { start: startDate, end: endDate });

      matchesDate = createdInRange || updatedInRange;
    }

    return matchesSearch && matchesUser && matchesProject && matchesTicket && matchesDate;
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
      title: "Doc Name",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (text) => (
        <Space size={8}>
          <FolderOutlined className="text-blue-500" />
          <span className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">{text}</span>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Project",
      dataIndex: ["project", "name"],
      key: "project",
      width: 150,
      render: (text, record) => (
        <InlineProjectSelector
          record={record}
          projects={projects}
          projectsLoading={projectsLoading}
          updateHub={(id: string, updateData: any) => updateHub(id, updateData)}
          user={user}
        />
      )
    },
    {
      title: "Ticket",
      dataIndex: ["ticket", "ticketNumber"],
      key: "ticket",
      width: 160,
      render: (text, record) => (
        <InlineTicketSelector
          record={record}
          updateHub={(id: string, updateData: any) => updateHub(id, updateData)}
          user={user}
        />
      )
    },
    {
      title: "Created By",
      dataIndex: ["createdBy", "name"],
      key: "createdBy",
      render: (text, record) => (
        <Space>
          <Avatar 
            size={24} 
            src={record.createdBy?.avatarUrl}
            style={{ backgroundColor: 'var(--bg-blue-50)', color: 'var(--text-blue-500)', fontSize: '10px' }}
          >
            {text?.charAt(0).toUpperCase()}
          </Avatar>

          <span className="text-slate-600" style={{ color: 'var(--text-slate-700)' }}>{text}</span>
        </Space>
      )
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => (
        <span className="text-[11px] font-medium text-slate-500" style={{ color: 'var(--text-slate-600)' }}>
          {format(new Date(date), "MMM d, yyyy h:mm a")}
        </span>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => (
        <span className="text-[11px] font-medium text-slate-500" style={{ color: 'var(--text-slate-600)' }}>
          {format(new Date(date), "MMM d, yyyy h:mm a")}
        </span>
      ),
      sorter: (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    },
    {
      title: "Visibility",
      dataIndex: "visibility",
      key: "visibility",
      width: 120,
      render: (visibility, record) => {
        const isOwner = user?.id === record.createdById;
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              size="small"
              value={visibility || 'private'}
              disabled={!isOwner}
              style={{ width: 100 }}
              bordered={false}
              className="visibility-select font-medium"
              suffixIcon={null}
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
                { value: 'private', label: <Space size={6} style={{ color: 'var(--text-slate-500)' }}><LockOutlined style={{ fontSize: 10 }} /> <span style={{ fontSize: 11 }}>Private</span></Space> },
                { value: 'public', label: <Space size={6} style={{ color: 'var(--text-blue-500)' }}><GlobalOutlined style={{ fontSize: 10 }} /> <span style={{ fontSize: 11 }}>Public</span></Space> },
              ]}
            />
          </div>
        );
      }
    },
    {
      title: "Action",
      key: "actions",
      width: 80,
      render: (text, record) => (
        <Space size={0} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="View Knowledge Base">
            <Button
              type="text"
              icon={<EyeOutlined style={{ fontSize: '14px' }} className="text-slate-400 hover:text-blue-500" />}
              onClick={() => router.push(`/documenthub/${record.id}`)}
              className="flex items-center justify-center p-0 w-7 h-7 rounded-lg hover:bg-slate-50"
            />
          </Tooltip>
          <Tooltip title="Share Hub">
            <Button
              type="text"
              icon={<ShareAltOutlined style={{ fontSize: '14px' }} className="text-slate-400 hover:text-blue-500" />}
              onClick={(e) => handleShareHub(e, record)}
              className="flex items-center justify-center p-0 w-7 h-7 rounded-lg hover:bg-slate-50"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined style={{ fontSize: '14px' }} />}
              onClick={(e) => handleDeleteHub(e, record.id, record.name)}
              className="flex items-center justify-center p-0 w-7 h-7 rounded-lg hover:bg-red-50"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleReload = () => {
    setSearchText("");
    setFilterProjectId(undefined);
    setFilterTicketId(undefined);
    setSelectedUser(undefined);
    setDateRange(null);
    refetch();
  };

  return (
    <MainLayout>
      {contextHolder}
      {modalContextHolder}
      <div style={{
        margin: "0 -16px",
        padding: "0 24px 16px 24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column"
      }}>
        <div className="flex flex-wrap justify-between items-center flex-shrink-0 py-3 gap-4" style={{
          minHeight: '58px',
          borderBottom: '1px solid var(--border-color)',
          margin: '0 -24px 24px -24px',
          padding: '0 24px'
        }}>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2 m-0" style={{ color: 'var(--text-slate-900)' }}>
              <FileZipOutlined className="text-blue-500" />
              Document Hub
            </h1>
            <Divider type="vertical" className="hidden sm:block" style={{ height: '20px', backgroundColor: 'var(--border-color)' }} />
            <p className="text-slate-500 m-0 hidden sm:block" style={{ color: 'var(--text-slate-400)', fontSize: '13px' }}>
              Manage all your documentation in one place
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              icon={<RestOutlined />}
              onClick={() => setTrashVisible(true)}
              className="border-none shadow-none hover:bg-slate-50"
            >
              Trash
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
              className="shadow-sm font-medium"
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
          <div className="pb-2">
            <DocumentHubDashboard
              documentHubs={documentHubs}
              isLoading={hubsLoading || hubsFetching}
              onHubClick={(id) => router.push(`/documenthub/${id}`)}
              onShareHub={handleShareHub}
            />
          </div>

          {/* Filters Section - Sticky inside the card */}
          <div className="sticky top-0 z-20" style={{ background: 'var(--bg-pure-white)', zIndex: 100 }}>
            <div className="px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-wrap items-center gap-4 flex-1">
                <div className="relative w-full max-w-sm min-w-[200px]">
                  <Input
                    placeholder="Search hubs..."
                    prefix={<SearchOutlined className="text-slate-400" style={{ color: 'var(--text-blue-500)' }} />}
                    className="premium-search-input h-10 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all shadow-sm"
                    style={{ background: 'var(--bg-pure-white)' }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </div>
                <div className="h-6 w-[1px] bg-slate-200 hidden md:block" />
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    placeholder={<Space><ProjectOutlined style={{ fontSize: '10px' }} /> <span style={{ fontSize: '11px' }}>Project</span></Space>}
                    className="premium-select min-w-[140px]"
                    style={{ height: 40 }}
                    allowClear
                    showSearch
                    value={filterProjectId}
                    onChange={setFilterProjectId}
                    loading={projectsLoading}
                    filterOption={(input, option: any) => {
                      const project = projects.find(p => p.value === option.value);
                      if (!project) return false;
                      return (
                        project.label?.toLowerCase().includes(input.toLowerCase()) ||
                        project.code?.toLowerCase().includes(input.toLowerCase())
                      );
                    }}
                    options={projects.map((p: any) => ({
                      label: (
                        <div className="flex flex-col py-1">
                          <span className="font-semibold text-slate-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>{p.label}</span>
                          {p.code && <span className="text-slate-400" style={{ fontSize: '9px', lineHeight: '1.2' }}>{p.code}</span>}
                        </div>
                      ),
                      value: p.value
                    }))}
                  />
                  <Select
                    placeholder={<Space><TagOutlined style={{ fontSize: '10px' }} /> <span style={{ fontSize: '11px' }}>Ticket</span></Space>}
                    className="premium-select min-w-[200px]"
                    style={{ height: 40 }}
                    allowClear
                    showSearch
                    value={filterTicketId}
                    onChange={setFilterTicketId}
                    loading={filterTicketsLoading}
                    filterOption={(input, option: any) => {
                      // Support searching by ticket number or title
                      const options = filterProjectId ? filterTickets : Array.from(new Map(documentHubs.filter(h => h.ticket).map(h => [h.ticket!.id, h.ticket])).values());
                      const ticket: any = options.find((t: any) => t.id === option.value);
                      if (!ticket) return false;
                      return (
                        ticket.ticketNumber?.toLowerCase().includes(input.toLowerCase()) ||
                        ticket.title?.toLowerCase().includes(input.toLowerCase())
                      );
                    }}
                    options={(() => {
                      // If a project is selected, show tickets for that project
                      if (filterProjectId) {
                        return filterTickets.map((t: any) => ({
                          label: (
                            <div className="flex flex-col py-1">
                              <span className="font-semibold text-slate-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>{t.ticketNumber}</span>
                              <span className="text-slate-400 truncate" style={{ fontSize: '9px', lineHeight: '1.2', maxWidth: '180px' }}>{t.title}</span>
                            </div>
                          ),
                          value: t.id
                        }));
                      }

                      // Otherwise, show all tickets currently linked to any Document Hub in the list
                      const uniqueTickets = Array.from(
                        new Map(
                          documentHubs
                            .filter(hub => hub.ticket)
                            .map(hub => [hub.ticket!.id, hub.ticket])
                        ).values()
                      );

                      return uniqueTickets.map((t: any) => ({
                        label: (
                          <div className="flex flex-col py-1">
                            <span className="font-semibold text-slate-700" style={{ fontSize: '11px', lineHeight: '1.2' }}>{t.ticketNumber}</span>
                            <span className="text-slate-400 truncate" style={{ fontSize: '9px', lineHeight: '1.2', maxWidth: '180px' }}>{t.title}</span>
                          </div>
                        ),
                        value: t.id
                      }));
                    })()}
                  />
                  <Select
                    placeholder={<Space><UserOutlined className="text-xs" /> <span>Created By</span></Space>}
                    className="premium-select min-w-[150px]"
                    style={{ height: 40 }}
                    showSearch
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
                    className="premium-range-picker rounded-xl border-slate-200 h-10 shadow-sm"
                    style={{ width: 240, background: 'var(--bg-pure-white)' }}
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates as any)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip title="Reload Docs">
                  <Button
                    icon={<ReloadOutlined spin={hubsFetching} />}
                    onClick={handleReload}
                    className="flex items-center justify-center rounded-xl h-10 w-10 border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200"
                  />
                </Tooltip>
              </div>
            </div>
          </div>


          <div className="p-2 overflow-x-auto">
            <Table
              columns={columns}
              dataSource={filteredHubs}
              rowKey="id"
              loading={hubsLoading || hubsFetching}
              pagination={{ pageSize: 15, showSizeChanger: true }}
              size="small"
              className="premium-table"
              scroll={{ x: 1300 }}
              sticky={{
                offsetHeader: 0,
              }}
              onRow={(record) => ({
                onClick: () => router.push(`/documenthub/${record.id}`),
                className: "cursor-pointer",
              })}
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
      <style jsx global>{`
        .premium-table .ant-table-thead > tr > th {
          background: #f8fafc !important;
          color: #64748b !important;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #f1f5f9 !important;
        }
        [data-theme='dark'] .premium-table .ant-table-thead > tr > th {
          background: #161b22 !important;
          color: #94a3b8 !important;
          border-bottom-color: #1f2937 !important;
        }
        .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 8px 16px !important;
          background: var(--bg-pure-white) !important;
        }
        [data-theme='dark'] .premium-table .ant-table-tbody > tr > td {
          border-bottom-color: #1f2937 !important;
          background: #161b22 !important;
        }
        .premium-table .ant-table-row:hover > td {
          background: #fdfdfd !important;
        }
        [data-theme='dark'] .premium-table .ant-table-row:hover > td {
          background: #1f2937 !important;
        }
        .visibility-select .ant-select-selection-item {
          display: flex;
          align-items: center;
        }
        .premium-inline-select .ant-select-selector {
          padding: 0 !important;
          font-size: 11px !important;
          font-weight: 500 !important;
        }
        .premium-inline-select .ant-select-selection-placeholder {
          font-size: 11px !important;
          font-style: italic;
        }
        .premium-inline-select:hover .ant-select-selector {
          background: rgba(22, 119, 255, 0.05) !important;
          border-radius: 4px;
        }
      `}</style>
    </MainLayout>
  );
};

export default DocumentHubPage;
