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
  StarOutlined,
  StarFilled,
} from "@ant-design/icons";
import ShareModal from "@/components/documenthub/ShareModal";
import {
  Button,
  Col,
  Dropdown,
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
import type { MenuProps } from "antd";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ColumnsType } from "antd/es/table";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import dayjs from "dayjs";
import TrashDrawer from "@/components/documenthub/TrashDrawer";
import DocumentHubDashboard from "@/components/documenthub/DocumentHubDashboard";
import AiCreateHubModal from "@/components/documenthub/AiCreateHubModal";

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
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  // Optimistic star state — toggled instantly on click while the server call
  // is in flight, so the gold star never lags behind the user's click.
  const [optimisticStarred, setOptimisticStarred] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [trashVisible, setTrashVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();

  // --- Persistence Logic ---
  // Restore filters from sessionStorage on mount
  useEffect(() => {
    const savedSearch = sessionStorage.getItem("documenthub_search");
    const savedProject = sessionStorage.getItem("documenthub_filterProjectId");
    const savedTicket = sessionStorage.getItem("documenthub_filterTicketId");
    const savedUser = sessionStorage.getItem("documenthub_selectedUser");
    const savedStarred = sessionStorage.getItem("documenthub_showStarredOnly");

    if (savedSearch) setSearchText(savedSearch);
    if (savedProject && savedProject !== "undefined") setFilterProjectId(savedProject);
    if (savedTicket && savedTicket !== "undefined") setFilterTicketId(savedTicket);
    if (savedUser && savedUser !== "undefined") setSelectedUser(savedUser);
    if (savedStarred) setShowStarredOnly(savedStarred === "true");
  }, []);

  // Persist filters to sessionStorage when they change
  useEffect(() => {
    sessionStorage.setItem("documenthub_search", searchText);
  }, [searchText]);

  useEffect(() => {
    if (filterProjectId !== undefined) {
      sessionStorage.setItem("documenthub_filterProjectId", filterProjectId);
    } else {
      sessionStorage.removeItem("documenthub_filterProjectId");
    }
  }, [filterProjectId]);

  useEffect(() => {
    if (filterTicketId !== undefined) {
      sessionStorage.setItem("documenthub_filterTicketId", filterTicketId);
    } else {
      sessionStorage.removeItem("documenthub_filterTicketId");
    }
  }, [filterTicketId]);

  useEffect(() => {
    if (selectedUser !== undefined) {
      sessionStorage.setItem("documenthub_selectedUser", selectedUser);
    } else {
      sessionStorage.removeItem("documenthub_selectedUser");
    }
  }, [selectedUser]);

  useEffect(() => {
    sessionStorage.setItem("documenthub_showStarredOnly", String(showStarredOnly));
  }, [showStarredOnly]);
  // -------------------------

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
      // Snapshot the previous ticket linkage so we can also refresh the
      // ticket→hubs query for whichever side the link moved away from.
      const prevHub = (documentHubs as any[])?.find((h) => h.id === id);
      const prevTicketId = prevHub?.ticketId || prevHub?.ticket?.id;
      const response = await DocumentHubService.updateDocumentHub(id, data);
      console.log("UpdateHub Response:", response);
      messageApi.success("Hub updated successfully");
      // Keep the bidirectional link fresh: invalidate the linked-hubs cache
      // for both the ticket the hub is moving to and the one it's leaving.
      const ticketIdsToRefresh = new Set<string>();
      if (data?.ticketId) ticketIdsToRefresh.add(data.ticketId);
      if (prevTicketId) ticketIdsToRefresh.add(prevTicketId);
      ticketIdsToRefresh.forEach((tid) => {
        queryClient.invalidateQueries({ queryKey: ["ticket", tid, "documentHubs"] });
      });
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
        visibility: 'public',
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

  // Resolve the star state for a hub — optimistic override beats the server value.
  const isHubStarred = (hub: DocumentHub) => {
    if (Object.prototype.hasOwnProperty.call(optimisticStarred, hub.id)) {
      return optimisticStarred[hub.id];
    }
    return !!(hub as any).isStarred;
  };

  const handleToggleStar = async (e: React.MouseEvent, hub: DocumentHub) => {
    e.stopPropagation();
    const currentlyStarred = isHubStarred(hub);
    setOptimisticStarred((prev) => ({ ...prev, [hub.id]: !currentlyStarred }));
    try {
      if (currentlyStarred) {
        await DocumentHubService.unstarDocumentHub(hub.id);
      } else {
        await DocumentHubService.starDocumentHub(hub.id);
      }
      messageApi.success(currentlyStarred ? "Removed from starred" : "Starred");
      // Invalidate so the server-side `isStarred` flag re-loads on next fetch.
      queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
    } catch (err) {
      console.error("Failed to toggle star", err);
      messageApi.error("Failed to update star");
      // Roll back the optimistic state on failure.
      setOptimisticStarred((prev) => {
        const next = { ...prev };
        delete next[hub.id];
        return next;
      });
    }
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
    const matchesStar = showStarredOnly ? isHubStarred(hub) : true;

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

    return matchesSearch && matchesUser && matchesProject && matchesTicket && matchesStar && matchesDate;
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
      title: "",
      key: "star",
      width: 44,
      align: "center",
      render: (_text, record) => {
        const starred = isHubStarred(record);
        return (
          <Tooltip title={starred ? "Remove from starred" : "Add to starred"}>
            <button
              onClick={(e) => handleToggleStar(e, record)}
              className="flex items-center justify-center transition-colors"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: starred ? "#f59e0b" : "var(--text-slate-400)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = starred
                  ? "rgba(245, 158, 11, 0.1)"
                  : "var(--bg-slate-50)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
              aria-label={starred ? "Unstar" : "Star"}
            >
              {starred ? (
                <StarFilled style={{ fontSize: 14 }} />
              ) : (
                <StarOutlined style={{ fontSize: 14 }} />
              )}
            </button>
          </Tooltip>
        );
      },
    },
    {
      title: "Doc Name",
      dataIndex: "name",
      key: "name",
      width: 300,
      render: (text, record) => (
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center shrink-0 text-white"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
              boxShadow: "0 2px 6px rgba(59, 130, 246, 0.22)",
            }}
          >
            <FolderOutlined style={{ fontSize: 13 }} />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="font-semibold text-[13px] truncate"
              style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
            >
              {text}
            </span>
            <span
              className="text-[10.5px] truncate"
              style={{ color: 'var(--text-slate-400)' }}
            >
              {(record as any).treeNodes?.filter((n: any) => n.type === 'file').length || 0} {(record as any).treeNodes?.filter((n: any) => n.type === 'file').length === 1 ? 'doc' : 'docs'}
            </span>
          </div>
        </div>
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
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date) => (
        <Tooltip title={format(new Date(date), "EEEE, MMM d, yyyy h:mm a")}>
          <div className="flex flex-col">
            <span
              className="text-[12px] font-medium"
              style={{ color: 'var(--text-slate-700)' }}
            >
              {format(new Date(date), "MMM d, yyyy")}
            </span>
            <span
              className="text-[10.5px]"
              style={{ color: 'var(--text-slate-400)' }}
            >
              {format(new Date(date), "h:mm a")}
            </span>
          </div>
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 140,
      render: (date) => (
        <Tooltip title={format(new Date(date), "EEEE, MMM d, yyyy h:mm a")}>
          <div className="flex flex-col">
            <span
              className="text-[12px] font-medium"
              style={{ color: 'var(--text-slate-700)' }}
            >
              {format(new Date(date), "MMM d, yyyy")}
            </span>
            <span
              className="text-[10.5px]"
              style={{ color: 'var(--text-slate-400)' }}
            >
              {format(new Date(date), "h:mm a")}
            </span>
          </div>
        </Tooltip>
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
      width: 110,
      render: (text, record) => (
        <Space size={2} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Open hub">
            <Button
              type="text"
              icon={<EyeOutlined style={{ fontSize: '14px', color: 'var(--text-slate-400)' }} />}
              onClick={() => router.push(`/documenthub/${record.id}`)}
              className="flex items-center justify-center p-0 w-8 h-8 rounded-lg"
              style={{ transition: 'background 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-blue-50)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            />
          </Tooltip>
          <Tooltip title="Share">
            <Button
              type="text"
              icon={<ShareAltOutlined style={{ fontSize: '14px', color: 'var(--text-slate-400)' }} />}
              onClick={(e) => handleShareHub(e, record)}
              className="flex items-center justify-center p-0 w-8 h-8 rounded-lg"
              style={{ transition: 'background 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-blue-50)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            />
          </Tooltip>
          <Tooltip title="Move to trash">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined style={{ fontSize: '14px' }} />}
              onClick={(e) => handleDeleteHub(e, record.id, record.name)}
              className="flex items-center justify-center p-0 w-8 h-8 rounded-lg hover:bg-red-50"
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
    setShowStarredOnly(false);
    refetch();
  };

  return (
    <MainLayout>
      {contextHolder}
      {modalContextHolder}
      <div style={{
        margin: "0 -16px",
        padding: "0 24px 24px 24px",
        background: "var(--bg-pure-white)",
        minHeight: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Premium Hero Header */}
        <div
          className="flex flex-wrap justify-between items-center gap-4 flex-shrink-0"
          style={{
            margin: '0 -24px 24px -24px',
            padding: '8.5px 24px',
            borderBottom: '1px solid var(--border-slate-200)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-11 h-10 rounded-2xl shrink-0 text-white"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              <FileZipOutlined style={{ fontSize: 18 }} />
            </div>
            <h1
              className="text-[17px] font-bold m-0 tracking-tight leading-tight"
              style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}
            >
              Document Hub
            </h1>
            <Divider
              type="vertical"
              className="hidden sm:block"
              style={{ height: 22, margin: '0 4px', backgroundColor: 'var(--border-slate-200)' }}
            />
            <p
              className="m-0 text-[12.5px] hidden sm:block"
              style={{ color: 'var(--text-slate-400)' }}
            >
              Manage all your documentation in one place
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              icon={<RestOutlined />}
              onClick={() => setTrashVisible(true)}
              className="trash-action-btn"
              style={{
                height: 38,
                borderRadius: 10,
                fontWeight: 500,
                background: 'var(--bg-slate-50)',
                border: '1px solid var(--border-slate-200)',
                color: 'var(--text-slate-700)',
              }}
            >
              Trash
            </Button>
            <Dropdown
              trigger={['hover', 'click']}
              placement="bottomRight"
              overlayClassName="create-document-menu"
              menu={{
                items: [
                  {
                    key: 'manual',
                    label: (
                      <div className="flex items-start gap-3 py-1.5 pr-2" style={{ minWidth: 260 }}>
                        <div
                          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 text-white"
                          style={{
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
                    onClick: () => setModalVisible(true),
                  },
                  {
                    key: 'zai',
                    label: (
                      <div className="flex items-start gap-3 py-1.5 pr-2" style={{ minWidth: 260 }}>
                        <div
                          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0 text-white relative"
                          style={{
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                            boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)',
                          }}
                        >
                          <span style={{ fontSize: 15, lineHeight: 1 }}>✨</span>
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
                            Generate a hub from a prompt
                          </span>
                        </div>
                      </div>
                    ),
                    onClick: () => setAiModalVisible(true),
                  },
                ] as MenuProps['items'],
              }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="create-document-btn"
                style={{
                  height: 38,
                  borderRadius: 10,
                  fontWeight: 600,
                  paddingInline: 16,
                  background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255,255,255,0.18)',
                }}
              >
                Create Document
              </Button>
            </Dropdown>
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
            <div
              className="flex flex-wrap items-center gap-3 justify-between rounded-2xl"
              style={{
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-slate-200)',
                marginTop: 8,
                marginBottom: 12,
              }}
            >
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <div className="relative w-full max-w-sm min-w-[140px]">
                  <Input
                    placeholder="Search hubs..."
                    prefix={<SearchOutlined className="text-slate-400" style={{ color: 'var(--text-slate-400)' }} />}
                    className="premium-search-input h-10 rounded-xl transition-all"
                    style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)' }}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    allowClear
                  />
                </div>
                <div className="h-6 w-[1px] hidden md:block" style={{ background: 'var(--border-slate-200)' }} />
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
                {/* Starred-only toggle */}
                <Tooltip title={showStarredOnly ? "Show all hubs" : "Show only starred hubs"}>
                  <button
                    type="button"
                    onClick={() => setShowStarredOnly((v) => !v)}
                    className="flex items-center gap-1.5 transition-all"
                    style={{
                      height: 40,
                      padding: '0 12px',
                      borderRadius: 12,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: showStarredOnly
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)'
                        : 'var(--bg-pure-white)',
                      border: showStarredOnly
                        ? '1px solid rgba(245, 158, 11, 0.4)'
                        : '1px solid var(--border-slate-200)',
                      color: showStarredOnly ? '#b45309' : 'var(--text-slate-600)',
                    }}
                  >
                    {showStarredOnly ? (
                      <StarFilled style={{ fontSize: 13, color: '#f59e0b' }} />
                    ) : (
                      <StarOutlined style={{ fontSize: 13 }} />
                    )}
                    Starred
                    {showStarredOnly && (
                      <span
                        className="px-1.5 py-[1px] rounded-full text-[10px] font-bold"
                        style={{
                          background: '#f59e0b',
                          color: '#fff',
                          marginLeft: 2,
                        }}
                      >
                        {documentHubs.filter((h) => isHubStarred(h)).length}
                      </span>
                    )}
                  </button>
                </Tooltip>
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


          <div
            className="overflow-hidden"
            style={{
              borderRadius: 16,
              border: '1px solid var(--border-slate-200)',
              background: 'var(--bg-pure-white)',
            }}
          >
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
        open={modalVisible}
        onCancel={() => {
          if (isCreating) return;
          setModalVisible(false);
          setSelectedProjectId(undefined);
          form.resetFields();
        }}
        title={null}
        footer={null}
        closable={false}
        width={520}
        centered
        styles={{
          mask: { backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.45)' },
          content: { borderRadius: 18, padding: 0, overflow: 'hidden' },
          body: { padding: 0 },
        }}
      >
        {/* Hero header */}
        <div
          className="px-6 pt-5 pb-4"
          style={{
            background:
              'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(99, 102, 241, 0.04) 100%)',
            borderBottom: '1px solid var(--border-slate-200)',
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="flex items-center justify-center shrink-0 text-white"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                boxShadow:
                  '0 4px 12px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
              }}
            >
              <FileZipOutlined style={{ fontSize: 18 }} />
            </div>
            <div className="flex-1 min-w-0">
              <h2
                className="text-[16px] font-bold tracking-tight m-0"
                style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}
              >
                Create new document hub
              </h2>
              <p
                className="m-0 mt-0.5 text-[12.5px]"
                style={{ color: 'var(--text-slate-400)' }}
              >
                A hub is a workspace for grouping related documents — wiki, specs, runbooks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isCreating) return;
                setModalVisible(false);
                setSelectedProjectId(undefined);
                form.resetFields();
              }}
              disabled={isCreating}
              className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
              style={{
                width: 30,
                height: 30,
                color: 'var(--text-slate-400)',
                background: 'transparent',
                border: 'none',
                cursor: isCreating ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (isCreating) return;
                e.currentTarget.style.background = 'var(--bg-slate-100)';
                e.currentTarget.style.color = 'var(--text-slate-700)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-slate-400)';
              }}
              aria-label="Close"
            >
              <PlusOutlined style={{ fontSize: 13, transform: 'rotate(45deg)' }} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-2">
          <Form form={form} layout="vertical" onFinish={handleAddDocument}>
            <Form.Item
              name="name"
              label={
                <span
                  className="text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--text-slate-400)' }}
                >
                  Hub name
                </span>
              }
              rules={[
                { required: true, message: 'Please enter a hub name' },
                { min: 2, message: 'Name must be at least 2 characters' },
                { max: 80, message: 'Up to 80 characters' },
              ]}
              className="mb-4"
            >
              <Input
                size="large"
                autoFocus
                placeholder="e.g., Payments API documentation"
                prefix={
                  <FileTextOutlined
                    style={{ color: 'var(--text-slate-400)', fontSize: 13 }}
                  />
                }
                style={{
                  borderRadius: 10,
                  fontSize: 13.5,
                  height: 42,
                  background: 'var(--bg-pure-white)',
                  borderColor: 'var(--border-slate-200)',
                  color: 'var(--text-slate-900)',
                }}
              />
            </Form.Item>

            <div
              className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-2 mt-2"
              style={{ color: 'var(--text-slate-400)' }}
            >
              Link to work <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>· optional</span>
            </div>

            <Row gutter={[12, 0]}>
              <Col span={24}>
                <Form.Item name="projectId" className="mb-3">
                  <Select
                    size="large"
                    placeholder={
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ color: 'var(--text-slate-400)' }}
                      >
                        <ProjectOutlined style={{ fontSize: 12 }} />
                        Select a project
                      </span>
                    }
                    loading={projectsLoading}
                    suffixIcon={
                      <ProjectOutlined
                        style={{ color: 'var(--text-slate-400)', fontSize: 11 }}
                      />
                    }
                    onChange={(value) => {
                      setSelectedProjectId(value);
                      form.setFieldsValue({ projectId: value, ticketId: undefined });
                    }}
                    allowClear
                    style={{ borderRadius: 10 }}
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
                <Form.Item name="ticketId" className="mb-2">
                  <Select
                    size="large"
                    showSearch
                    placeholder={
                      <span
                        className="inline-flex items-center gap-1.5"
                        style={{ color: 'var(--text-slate-400)' }}
                      >
                        <TagOutlined style={{ fontSize: 12 }} />
                        {selectedProjectId
                          ? 'Select a ticket'
                          : 'Pick a project first to link a ticket'}
                      </span>
                    }
                    loading={ticketsLoading}
                    suffixIcon={
                      <TagOutlined
                        style={{ color: 'var(--text-slate-400)', fontSize: 11 }}
                      />
                    }
                    allowClear
                    disabled={!selectedProjectId}
                    optionFilterProp="label"
                    options={tickets.map((ticket: any) => ({
                      value: ticket.id,
                      label: `${ticket.ticketNumber} (${ticket.title})`,
                    }))}
                    filterOption={(input, option) =>
                      String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    style={{ borderRadius: 10 }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div
              className="flex items-start gap-2 px-3 py-2 rounded-lg mt-3"
              style={{
                background: 'var(--bg-blue-50)',
                border: '1px solid var(--border-blue-200)',
              }}
            >
              <ProjectOutlined
                style={{
                  color: 'var(--text-blue-700)',
                  fontSize: 12,
                  marginTop: 3,
                }}
              />
              <span
                className="text-[11.5px] leading-snug"
                style={{ color: 'var(--text-slate-600)' }}
              >
                Linking a project or ticket attaches this hub's docs to that work item, so
                they show up alongside it everywhere else in ZithSpace.
              </span>
            </div>
          </Form>
        </div>

        {/* Sticky footer */}
        <div
          className="flex items-center justify-end gap-2 px-6 py-3 mt-2"
          style={{
            borderTop: '1px solid var(--border-slate-200)',
            background: 'var(--bg-secondary)',
          }}
        >
          <Button
            onClick={() => {
              if (isCreating) return;
              setModalVisible(false);
              setSelectedProjectId(undefined);
              form.resetFields();
            }}
            disabled={isCreating}
            style={{ borderRadius: 9, height: 36, fontWeight: 500 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={() => form.submit()}
            loading={isCreating}
            icon={!isCreating ? <PlusOutlined /> : undefined}
            style={{
              borderRadius: 9,
              height: 36,
              paddingInline: 18,
              fontWeight: 600,
              background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
              border: 'none',
              boxShadow:
                '0 4px 12px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            Create hub
          </Button>
        </div>
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

      <AiCreateHubModal
        open={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        onCreated={(hubId) => {
          setAiModalVisible(false);
          queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
          router.push(`/documenthub/${hubId}`);
        }}
      />
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
        .create-document-menu .ant-dropdown-menu {
          padding: 6px !important;
          border-radius: 14px !important;
          border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06) !important;
          min-width: 290px !important;
        }
        .create-document-menu .ant-dropdown-menu-item {
          border-radius: 10px !important;
          padding: 8px 10px !important;
          margin-bottom: 2px !important;
        }
        .create-document-menu .ant-dropdown-menu-item:last-child {
          margin-bottom: 0 !important;
        }
        .create-document-menu .ant-dropdown-menu-item:hover {
          background: var(--bg-slate-50) !important;
        }
      `}</style>
    </MainLayout>
  );
};

export default DocumentHubPage;
