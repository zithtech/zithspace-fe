"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
    Settings2,
    Plus,
    Search,
    Zap,
    Tag as TagIcon,
    Activity,
    ArrowUp,
    ArrowDown,
    Trash2,
    Edit2,
    Sparkles,
    ShieldCheck,
    Hash,
    GripVertical,
    Eye,
    Star,
    CheckCircle2,
    BarChart3,
    Workflow,
    Palette,
    Inbox,
    ArrowUpRight,
    Info
} from "lucide-react";
import {
    Typography,
    Button,
    Table,
    Input,
    Form,
    Row,
    Col,
    Select,
    notification,
    Popconfirm,
    Switch,
    ColorPicker,
    Drawer,
    Tooltip
} from "antd";
import {
    ClockCircleOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    FileOutlined,
    CalendarOutlined,
    MessageOutlined,
    VideoCameraOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    TeamOutlined,
    SendOutlined,
    LinkOutlined,
} from "@ant-design/icons";
import { useLeadSettings } from "@/hooks/useLeadSettings";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";

const { Text, Title } = Typography;

export default function LeadSettingsPage() {
    const { user, isLoading } = useAuth();
    const { 
        canManageLeads,
        canCreateLeadSetting,
        canUpdateLeadSetting,
        canDeleteLeadSetting
    } = usePermission();
    const router = useRouter();

    // ─── Route Guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoading && user && !canManageLeads) {
            router.push("/dashboard");
        }
    }, [user, isLoading, canManageLeads, router]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState<"1" | "2">("1");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [api, contextHolder] = notification.useNotification();
    const [searchText, setSearchText] = useState("");

    const {
        statuses,
        actions,
        fetchStatuses,
        fetchActions,
        createStatus,
        updateStatus,
        createAction,
        updateAction,
        deleteStatus,
        deleteAction,
        loading
    } = useLeadSettings();

    const [dataSource, setDataSource] = useState<any[]>([]);
    const [actionDataSource, setActionDataSource] = useState<any[]>([]);

    useEffect(() => {
        fetchStatuses();
        fetchActions();
    }, [fetchStatuses, fetchActions]);

    useEffect(() => {
        setDataSource(statuses.map((s, i) => ({
            key: s.id,
            id: s.id,
            sno: i + 1,
            statusName: s.name,
            category: s.category,
            appliesTo: s.applies_to?.join(", "),
            color: s.color,
            isDefault: s.is_default,
            isFinal: s.is_final_stage,
            isActive: s.is_active,
            order: s.order,
        })));
    }, [statuses]);

    useEffect(() => {
        setActionDataSource(actions.map((a, i) => ({
            key: a.id,
            id: a.id,
            sno: i + 1,
            actionName: a.name,
            type: a.type,
            icon: a.icon,
            color: a.color,
            isActive: a.is_active,
            created: new Date(a.createdAt || Date.now()).toLocaleDateString(),
        })));
    }, [actions]);

    const moveRow = async (index: number, direction: "up" | "down") => {
        const newData = [...statuses];
        if (direction === "up" && index > 0) {
            const temp = newData[index];
            newData[index] = newData[index - 1];
            newData[index - 1] = temp;
        } else if (direction === "down" && index < newData.length - 1) {
            const temp = newData[index];
            newData[index] = newData[index + 1];
            newData[index + 1] = temp;
        }
        try {
            await Promise.all(newData.map((item, i) => updateStatus(item.id, { order: i })));
            api.success({ message: "Order Updated", placement: "topRight" });
        } catch (error) {
            api.error({ message: "Failed to update order", placement: "topRight" });
        }
    };

    const showDrawer = () => {
        setEditingId(null);
        form.resetFields();
        setIsDrawerOpen(true);
    };

    const handleToggleStatusProperty = async (id: string, property: string, value: boolean) => {
        try {
            const backendField = property === "isDefault" ? "is_default" :
                property === "isFinal" ? "is_final_stage" : "is_active";
            if (property === "isDefault" && value === true) {
                const existingDefault = statuses.find(s => s.is_default && s.id !== id);
                if (existingDefault) {
                    await updateStatus(existingDefault.id, { is_default: false });
                }
            }
            await updateStatus(id, { [backendField]: value });
            api.success({ message: "Status Updated", placement: "topRight" });
        } catch (error) {
            api.error({ message: "Failed to update status", placement: "topRight" });
        }
    };

    const handleToggleActionProperty = async (id: string, value: boolean) => {
        try {
            await updateAction(id, { is_active: value });
            api.success({ message: "Action Updated", placement: "topRight" });
        } catch (error) {
            api.error({ message: "Failed to update action", placement: "topRight" });
        }
    };

    const handleEditStatus = (record: any) => {
        setEditingId(record.id);
        form.setFieldsValue({
            statusName: record.statusName,
            category: record.category,
            color: record.color,
            appliesTo: record.appliesTo ? record.appliesTo.split(", ") : [],
            isDefault: record.isDefault,
            isFinalStage: record.isFinal,
            isActive: record.isActive,
        });
        setIsDrawerOpen(true);
    };

    const handleEditAction = (record: any) => {
        setEditingId(record.id);
        form.setFieldsValue({
            actionName: record.actionName,
            actionType: record.type,
            icon: record.icon,
            color: record.color,
            isActive: record.isActive,
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (activeTab === "1") {
                const payload = {
                    name: values.statusName,
                    category: values.category,
                    color: typeof values.color === "string" ? values.color : values.color?.toHexString?.() || values.color,
                    applies_to: values.appliesTo || [],
                    is_default: values.isDefault ?? false,
                    is_final_stage: values.isFinalStage ?? false,
                    is_active: values.isActive ?? true,
                };
                if (editingId) await updateStatus(editingId, payload);
                else await createStatus(payload);
            } else {
                const payload = {
                    name: values.actionName,
                    type: values.actionType,
                    icon: values.icon,
                    color: typeof values.color === "string" ? values.color : values.color?.toHexString?.() || values.color,
                    is_active: values.isActive ?? true,
                };
                if (editingId) await updateAction(editingId, payload);
                else await createAction(payload);
            }
            api.success({
                message: "Success",
                description: `${activeTab === "1" ? "Status" : "Action"} ${editingId ? "updated" : "created"} successfully`,
                placement: "topRight",
            });
            setIsDrawerOpen(false);
            setEditingId(null);
            form.resetFields();
        } catch (error: any) {
            console.error("Validation or API Failed:", error);
            const errorMessage = error.response?.data?.error || error.message || "An unexpected error occurred";
            api.error({ message: "Error", description: errorMessage, placement: "topRight" });
        }
    };

    const handleCancel = () => {
        setIsDrawerOpen(false);
        setEditingId(null);
        form.resetFields();
    };

    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case "phone": return <PhoneOutlined />;
            case "mail": return <MailOutlined />;
            case "clock": return <ClockCircleOutlined />;
            case "user": return <UserOutlined />;
            case "file": return <FileOutlined />;
            case "calendar": return <CalendarOutlined />;
            case "message": return <MessageOutlined />;
            case "video": return <VideoCameraOutlined />;
            case "check": return <CheckCircleOutlined />;
            case "close": return <CloseCircleOutlined />;
            case "team": return <TeamOutlined />;
            case "send": return <SendOutlined />;
            case "link": return <LinkOutlined />;
            default: return null;
        }
    };

    const iconOptions = [
        { value: "phone", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><PhoneOutlined /> Phone</span> },
        { value: "mail", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MailOutlined /> Mail</span> },
        { value: "clock", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><ClockCircleOutlined /> Clock</span> },
        { value: "user", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><UserOutlined /> User</span> },
        { value: "file", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><FileOutlined /> File</span> },
        { value: "calendar", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CalendarOutlined /> Calendar</span> },
        { value: "message", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MessageOutlined /> Message</span> },
        { value: "video", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><VideoCameraOutlined /> Video</span> },
        { value: "check", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircleOutlined /> Check</span> },
        { value: "close", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CloseCircleOutlined /> Close</span> },
        { value: "team", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><TeamOutlined /> Team</span> },
        { value: "send", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><SendOutlined /> Send</span> },
        { value: "link", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><LinkOutlined /> Link</span> },
    ];

    const filteredStatuses = useMemo(
        () => dataSource.filter(d =>
            d.statusName?.toLowerCase().includes(searchText.toLowerCase()) ||
            d.category?.toLowerCase().includes(searchText.toLowerCase())
        ),
        [dataSource, searchText]
    );

    const filteredActions = useMemo(
        () => actionDataSource.filter(d =>
            d.actionName?.toLowerCase().includes(searchText.toLowerCase()) ||
            d.type?.toLowerCase().includes(searchText.toLowerCase())
        ),
        [actionDataSource, searchText]
    );

    const stats = useMemo(() => {
        const activeStatuses = statuses.filter(s => s.is_active).length;
        const finalStages = statuses.filter(s => s.is_final_stage).length;
        const activeActions = actions.filter(a => a.is_active).length;
        return {
            statusCount: statuses.length,
            activeStatuses,
            finalStages,
            actionCount: actions.length,
            activeActions,
            defaultStatusName: statuses.find(s => s.is_default)?.name || "—",
        };
    }, [statuses, actions]);

    const statusColumns = [
        {
            title: "",
            key: "drag",
            width: 36,
            render: () => (
                <span className="lset-drag" aria-hidden>
                    <GripVertical size={14} />
                </span>
            ),
        },
        {
            title: "Order",
            dataIndex: "sno",
            key: "sno",
            width: 70,
            render: (text: number) => (
                <span className="lset-rank">
                    <Hash size={11} /> {text}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "statusName",
            key: "statusName",
            render: (text: string, record: any) => (
                <div className="lset-status-cell">
                    <span className="lset-color-dot" style={{ background: record.color, boxShadow: `0 0 0 4px ${record.color}22` }} />
                    <div className="lset-status-text">
                        <span className="lset-pill" style={{ background: `${record.color}14`, color: record.color, border: `1px solid ${record.color}33` }}>
                            {text?.toUpperCase()}
                        </span>
                        <span className="lset-status-meta">{record.category || "uncategorized"}</span>
                    </div>
                </div>
            ),
        },
        {
            title: "Behavior",
            key: "behavior",
            width: 220,
            render: (_: any, record: any) => (
                <div className="lset-flag-row">
                    <Tooltip title="Default starter status for new leads">
                        <span
                            className={`lset-flag ${record.isDefault ? "is-on" : ""}`}
                            onClick={() => handleToggleStatusProperty(record.id, "isDefault", !record.isDefault)}
                            role="button"
                        >
                            <Star size={11} fill={record.isDefault ? "#f59e0b" : "transparent"} stroke={record.isDefault ? "#f59e0b" : "#94a3b8"} />
                            Default
                        </span>
                    </Tooltip>
                    <Tooltip title="Final/closing milestone">
                        <span
                            className={`lset-flag ${record.isFinal ? "is-final" : ""}`}
                            onClick={() => handleToggleStatusProperty(record.id, "isFinal", !record.isFinal)}
                            role="button"
                        >
                            <CheckCircle2 size={11} />
                            Final
                        </span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: "Visibility",
            dataIndex: "isActive",
            key: "isActive",
            width: 140,
            render: (isActive: boolean, record: any) => (
                <div className="lset-visibility">
                    <Switch 
                        size="small" 
                        checked={isActive} 
                        onChange={(val) => handleToggleStatusProperty(record.id, "isActive", val)} 
                        loading={loading} 
                        disabled={!canUpdateLeadSetting}
                    />
                    <span className={`lset-vis-label ${isActive ? "is-on" : ""}`}>{isActive ? "Visible" : "Hidden"}</span>
                </div>
            ),
        },
        {
            title: "",
            key: "actions",
            align: "right" as const,
            width: 160,
            render: (_: any, record: any, index: number) => (
                <div className="lset-row-actions">
                    {canUpdateLeadSetting && (
                        <>
                            <Tooltip title="Move up">
                                <button className="lset-icon-btn" disabled={index === 0} onClick={() => moveRow(index, "up")} aria-label="Move up">
                                    <ArrowUp size={14} />
                                </button>
                            </Tooltip>
                            <Tooltip title="Move down">
                                <button className="lset-icon-btn" disabled={index === dataSource.length - 1} onClick={() => moveRow(index, "down")} aria-label="Move down">
                                    <ArrowDown size={14} />
                                </button>
                            </Tooltip>
                        </>
                    )}
                    {canUpdateLeadSetting && (
                        <Tooltip title="Edit">
                            <button className="lset-icon-btn" onClick={() => handleEditStatus(record)} aria-label="Edit">
                                <Edit2 size={14} />
                            </button>
                        </Tooltip>
                    )}
                    {canDeleteLeadSetting && (
                        <Popconfirm
                            title="Delete this status?"
                            description="Leads using this status may need reassignment."
                            onConfirm={() => deleteStatus(record.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <button className="lset-icon-btn lset-icon-danger" aria-label="Delete">
                                <Trash2 size={14} />
                            </button>
                        </Popconfirm>
                    )}
                </div>
            ),
        },
    ];

    const actionColumns = [
        {
            title: "Action",
            dataIndex: "actionName",
            key: "actionName",
            render: (text: string, record: any) => (
                <div className="lset-action-cell">
                    <span className="lset-action-icon" style={{ background: `${record.color}14`, color: record.color, border: `1px solid ${record.color}30` }}>
                        {renderIcon(record.icon)}
                    </span>
                    <div className="lset-action-text">
                        <span className="lset-action-name">{text}</span>
                        <span className="lset-action-meta">Workflow trigger</span>
                    </div>
                </div>
            ),
        },
        {
            title: "Category",
            dataIndex: "type",
            key: "type",
            render: (text: string) => (
                <span className="lset-cat-pill">
                    <Workflow size={10} /> {text}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "isActive",
            width: 140,
            render: (isActive: boolean, record: any) => (
                <div className="lset-visibility">
                    <Switch 
                        size="small" 
                        checked={isActive} 
                        onChange={(val) => handleToggleActionProperty(record.id, val)} 
                        loading={loading} 
                        disabled={!canUpdateLeadSetting}
                    />
                    <span className={`lset-vis-label ${isActive ? "is-on" : ""}`}>{isActive ? "Active" : "Disabled"}</span>
                </div>
            ),
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            width: 140,
            render: (text: string) => <span className="lset-meta-text">{text}</span>,
        },
        {
            title: "",
            key: "actions",
            align: "right" as const,
            width: 110,
            render: (_: any, record: any) => (
                <div className="lset-row-actions">
                    {canUpdateLeadSetting && (
                        <Tooltip title="Edit">
                            <button className="lset-icon-btn" onClick={() => handleEditAction(record)} aria-label="Edit">
                                <Edit2 size={14} />
                            </button>
                        </Tooltip>
                    )}
                    {canDeleteLeadSetting && (
                        <Popconfirm
                            title="Remove this action?"
                            onConfirm={() => deleteAction(record.id)}
                            okText="Remove"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <button className="lset-icon-btn lset-icon-danger" aria-label="Delete">
                                <Trash2 size={14} />
                            </button>
                        </Popconfirm>
                    )}
                </div>
            ),
        },
    ];

    const StatTile = ({
        icon,
        label,
        value,
        accent,
        sublabel,
    }: {
        icon: React.ReactNode;
        label: string;
        value: React.ReactNode;
        accent: string;
        sublabel?: string;
    }) => (
        <div className="lset-stat-tile">
            <div className="lset-stat-glow" style={{ background: `radial-gradient(120% 100% at 100% 0%, ${accent}10 0%, transparent 55%)` }} />
            <div className="lset-stat-row">
                <div className="lset-stat-text">
                    <span className="lset-stat-label">{label}</span>
                    <span className="lset-stat-value">{value}</span>
                    {sublabel && <span className="lset-stat-sub">{sublabel}</span>}
                </div>
                <div className="lset-stat-icon" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 6px 14px ${accent}33` }}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <ProtectedRoute>
            <MainLayout>
                <div className="lset-canvas">
                    {contextHolder}

                    {/* HERO HEADER */}
                    <div className="lset-hero">
                        <div className="lset-hero-bg" aria-hidden />
                        <div className="lset-hero-row">
                            <div className="lset-hero-left">
                                <div className="lset-hero-icon">
                                    <Settings2 size={20} />
                                </div>
                                <div className="lset-hero-text">
                                    <div className="lset-hero-title-row">
                                        <Title level={4} className="lset-hero-title">Workflow Settings</Title>
                                        <span className="lset-hero-divider" />
                                        <Text className="lset-hero-sub">
                                            Configure pipeline statuses and lead actions
                                        </Text>
                                    </div>
                                </div>
                            </div>
                            <div className="lset-hero-actions">
                                <Input
                                    placeholder={`Search ${activeTab === "1" ? "statuses" : "actions"}...`}
                                    prefix={<Search size={13} style={{ color: "var(--text-slate-400)" }} />}
                                    className="lset-search"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                                <Button
                                    type="primary"
                                    icon={<Plus size={14} />}
                                    onClick={showDrawer}
                                    className="lset-cta-btn"
                                    disabled={!canCreateLeadSetting}
                                >
                                    {activeTab === "1" ? "New Status" : "New Action"}
                                    <ArrowUpRight size={13} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* STATS */}
                    <div style={{ padding: '20px 32px 0' }}>
                    <Row gutter={[16, 16]} className="lset-stats">
                        <Col xs={24} sm={12} md={6}>
                            <StatTile
                                icon={<Activity size={17} />}
                                label="Pipeline Statuses"
                                value={stats.statusCount}
                                accent="#6366f1"
                                sublabel={`${stats.activeStatuses} active`}
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatTile
                                icon={<Star size={17} />}
                                label="Default Starter"
                                value={
                                    <span className="lset-stat-text-ellipsis">{stats.defaultStatusName}</span>
                                }
                                accent="#f59e0b"
                                sublabel="Auto-assigned to new leads"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatTile
                                icon={<CheckCircle2 size={17} />}
                                label="Final Stages"
                                value={stats.finalStages}
                                accent="#10b981"
                                sublabel="Closing milestones"
                            />
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <StatTile
                                icon={<Zap size={17} />}
                                label="Workflow Actions"
                                value={stats.actionCount}
                                accent="#ec4899"
                                sublabel={`${stats.activeActions} active`}
                            />
                        </Col>
                    </Row>

                    {/* SEGMENT TABS */}
                    <div className="lset-segments">
                        {([
                            { key: "1", label: "Pipeline Statuses", icon: <Activity size={13} />, count: stats.statusCount, accent: "#6366f1" },
                            { key: "2", label: "Workflow Actions", icon: <Zap size={13} />, count: stats.actionCount, accent: "#ec4899" },
                        ] as const).map(seg => {
                            const isActive = activeTab === seg.key;
                            return (
                                <button
                                    key={seg.key}
                                    onClick={() => setActiveTab(seg.key)}
                                    className={`lset-segment ${isActive ? "is-active" : ""}`}
                                    style={isActive ? { borderColor: seg.accent, background: `${seg.accent}10`, color: seg.accent } : {}}
                                >
                                    {seg.icon}
                                    {seg.label}
                                    <span
                                        className="lset-segment-count"
                                        style={isActive ? { background: seg.accent, color: "#fff" } : {}}
                                    >
                                        {seg.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* TABLE CARD */}
                    <div className="lset-table-card">
                        <div className="lset-table-head">
                            <div className="lset-table-head-left">
                                <span className="lset-table-icon" style={{ background: activeTab === "1" ? "rgba(99,102,241,0.1)" : "rgba(236,72,153,0.1)", color: activeTab === "1" ? "#6366f1" : "#ec4899" }}>
                                    {activeTab === "1" ? <BarChart3 size={14} /> : <Workflow size={14} />}
                                </span>
                                <div>
                                    <div className="lset-table-title">
                                        {activeTab === "1" ? "Pipeline Statuses" : "Workflow Actions"}
                                    </div>
                                    <div className="lset-table-sub">
                                        {activeTab === "1"
                                            ? "Drag-style ordering · color, behavior & visibility per stage"
                                            : "Operational triggers available across the lead workspace"}
                                    </div>
                                </div>
                            </div>
                            {searchText && (
                                <span className="lset-filter-chip">
                                    Filter: "{searchText}"
                                    <button onClick={() => setSearchText("")} aria-label="Clear search">×</button>
                                </span>
                            )}
                        </div>

                        <Table
                            loading={loading}
                            columns={(activeTab === "1" ? statusColumns : actionColumns) as any}
                            dataSource={activeTab === "1" ? filteredStatuses : filteredActions}
                            pagination={false}
                            size="middle"
                            className="lset-table"
                            rowClassName="lset-row"
                            locale={{
                                emptyText: (
                                    <div className="lset-empty">
                                        <div className="lset-empty-icon">
                                            <Inbox size={26} />
                                        </div>
                                        <div className="lset-empty-title">
                                            {searchText
                                                ? "No matches"
                                                : activeTab === "1"
                                                    ? "No statuses yet"
                                                    : "No actions yet"}
                                        </div>
                                        <div className="lset-empty-sub">
                                            {searchText
                                                ? "Try a different keyword or clear the filter."
                                                : activeTab === "1"
                                                    ? "Create your first pipeline stage to start organizing leads."
                                                    : "Add your first workflow action to power lead operations."}
                                        </div>
                                        <Button
                                            type="primary"
                                            icon={<Plus size={13} />}
                                            onClick={searchText ? () => setSearchText("") : showDrawer}
                                            className="lset-empty-cta"
                                        >
                                            {searchText ? "Clear search" : `Add ${activeTab === "1" ? "Status" : "Action"}`}
                                        </Button>
                                    </div>
                                ),
                            }}
                        />
                    </div>
                    </div>
                </div>

                {/* DRAWER */}
                <Drawer
                    title={
                        <div className="lset-drawer-head" style={{ margin: "-16px -24px", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
                            <div className="lset-drawer-bg" aria-hidden />
                            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
                                <div className="lset-drawer-icon">
                                    {activeTab === "1" ? <TagIcon size={20} /> : <Zap size={20} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="lset-drawer-title">
                                        {editingId
                                            ? `Edit ${activeTab === "1" ? "Status" : "Action"}`
                                            : `New ${activeTab === "1" ? "Status" : "Action"}`}
                                    </div>
                                    <div className="lset-drawer-sub">
                                        Configure properties and appearance
                                    </div>
                                </div>
                                <span className="lset-drawer-badge">
                                    <Sparkles size={10} />
                                    {activeTab === "1" ? "Pipeline" : "Workflow"}
                                </span>
                            </div>
                        </div>
                    }
                    width={520}
                    open={isDrawerOpen}
                    onClose={handleCancel}
                    className="lset-drawer"
                    closable={!loading}
                    footer={
                        <div className="lset-drawer-footer">
                            <span className="lset-drawer-footer-hint">
                                <ShieldCheck size={12} /> Changes apply instantly across all leads
                            </span>
                            <div style={{ display: "flex", gap: 10 }}>
                                <Button onClick={handleCancel} className="lset-btn-cancel">Cancel</Button>
                                {((editingId && canUpdateLeadSetting) || (!editingId && canCreateLeadSetting)) && (
                                    <Button
                                        type="primary"
                                        loading={loading}
                                        onClick={handleSave}
                                        className="lset-cta-btn"
                                        style={{ minWidth: 180 }}
                                    >
                                        {editingId ? "Update" : "Create"} {activeTab === "1" ? "Status" : "Action"}
                                        <ArrowUpRight size={13} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    }
                >
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ isDefault: false, isFinalStage: false, isActive: true }}
                        requiredMark={false}
                        className="lset-drawer-form"
                    >
                        {activeTab === "1" ? (
                            <>
                                {/* SECTION 1 */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>01</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <Palette size={13} color="#6366f1" />
                                                <span className="lset-section-title">Identity & Appearance</span>
                                            </div>
                                            <span className="lset-section-sub">How this status looks across the app</span>
                                        </div>
                                    </div>
                                    <Form.Item name="statusName" label={<span className="lset-form-label">Label Name</span>} rules={[{ required: true, message: "Required" }]}>
                                        <Input placeholder="e.g. IN PROPOSAL" />
                                    </Form.Item>
                                    <Form.Item name="category" label={<span className="lset-form-label">Internal Category</span>} rules={[{ required: true, message: "Required" }]}>
                                        <Input placeholder="e.g. negotiation" />
                                    </Form.Item>
                                    <Form.Item
                                        name="color"
                                        label={<span className="lset-form-label">Brand Color</span>}
                                        rules={[{ required: true, message: "Required" }]}
                                        getValueFromEvent={(e) => typeof e === "string" ? e : e?.toHexString?.() || e}
                                    >
                                        <ColorPicker showText style={{ width: "100%" }} />
                                    </Form.Item>
                                </div>

                                {/* SECTION 2 */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>02</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <Activity size={13} color="#f59e0b" />
                                                <span className="lset-section-title">Behavioral Rules</span>
                                            </div>
                                            <span className="lset-section-sub">Lifecycle behavior for new and closing leads</span>
                                        </div>
                                    </div>

                                    <div className="lset-toggle-row">
                                        <div className="lset-toggle-text">
                                            <span className="lset-toggle-title">
                                                <Star size={12} color="#f59e0b" />
                                                Default Starter
                                            </span>
                                            <span className="lset-toggle-sub">Auto-assigned to all new leads</span>
                                        </div>
                                        <Tooltip title={!(editingId && statuses.find(s => s.id === editingId)?.is_default) ? "Manage default from the table" : ""}>
                                            <span>
                                                <Form.Item name="isDefault" valuePropName="checked" noStyle>
                                                    <Switch disabled={!(editingId && statuses.find(s => s.id === editingId)?.is_default)} />
                                                </Form.Item>
                                            </span>
                                        </Tooltip>
                                    </div>

                                    <div className="lset-toggle-row">
                                        <div className="lset-toggle-text">
                                            <span className="lset-toggle-title">
                                                <CheckCircle2 size={12} color="#10b981" />
                                                Final Milestone
                                            </span>
                                            <span className="lset-toggle-sub">Marks completion of the pipeline</span>
                                        </div>
                                        <Form.Item name="isFinalStage" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>

                                    <div className="lset-toggle-row">
                                        <div className="lset-toggle-text">
                                            <span className="lset-toggle-title">
                                                <Eye size={12} color="#6366f1" />
                                                Visible
                                            </span>
                                            <span className="lset-toggle-sub">Available for selection in lead views</span>
                                        </div>
                                        <Form.Item name="isActive" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* SECTION 1 */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(236,72,153,0.08)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.2)" }}>01</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <Workflow size={13} color="#ec4899" />
                                                <span className="lset-section-title">Action Configuration</span>
                                            </div>
                                            <span className="lset-section-sub">Identity, type, and visual appearance</span>
                                        </div>
                                    </div>
                                    <Form.Item name="actionName" label={<span className="lset-form-label">Display Name</span>} rules={[{ required: true, message: "Required" }]}>
                                        <Input placeholder="e.g. Schedule Call" />
                                    </Form.Item>
                                    <Form.Item name="actionType" label={<span className="lset-form-label">Category</span>} rules={[{ required: true, message: "Required" }]}>
                                        <Input placeholder="e.g. Communication" />
                                    </Form.Item>
                                    <Row gutter={12}>
                                        <Col span={14}>
                                            <Form.Item name="icon" label={<span className="lset-form-label">Icon</span>} rules={[{ required: true, message: "Required" }]}>
                                                <Select
                                                    showSearch
                                                    placeholder="Search icon"
                                                    options={iconOptions}
                                                    filterOption={(input, option) =>
                                                        (option?.value as string).toLowerCase().includes(input.toLowerCase())
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={10}>
                                            <Form.Item
                                                name="color"
                                                label={<span className="lset-form-label">Color</span>}
                                                rules={[{ required: true, message: "Required" }]}
                                                getValueFromEvent={(e) => typeof e === "string" ? e : e?.toHexString?.() || e}
                                            >
                                                <ColorPicker showText style={{ width: "100%" }} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>

                                {/* SECTION 2 */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>02</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <ShieldCheck size={13} color="#10b981" />
                                                <span className="lset-section-title">Availability</span>
                                            </div>
                                            <span className="lset-section-sub">Control whether this action shows up in workflows</span>
                                        </div>
                                    </div>
                                    <div className="lset-toggle-row">
                                        <div className="lset-toggle-text">
                                            <span className="lset-toggle-title">
                                                <Eye size={12} color="#10b981" />
                                                Operational
                                            </span>
                                            <span className="lset-toggle-sub">Available for selection across leads</span>
                                        </div>
                                        <Form.Item name="isActive" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="lset-drawer-note">
                            <div className="lset-drawer-note-icon">
                                <Info size={13} />
                            </div>
                            <div className="lset-drawer-note-text">
                                Saved settings sync to every lead view and the public pipeline immediately.
                            </div>
                        </div>
                    </Form>
                </Drawer>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .lset-canvas {
                        margin: 0 -24px;
                        padding: 0 0 60px;
                        min-height: calc(100vh - 64px);
                        background: var(--bg-pure-white);
                        font-family: 'Inter', -apple-system, sans-serif;
                    }

                    /* HERO */
                    .lset-hero {
                        position: sticky;
                        top: 0;
                        z-index: 100;
                        background: var(--bg-pure-white);
                        border-bottom: 1px solid var(--border-slate-200);
                        padding: 9.5px 32px;
                        margin-bottom: 0;
                        overflow: hidden;
                    }
                    .lset-hero-bg {
                        position: absolute; inset: 0; pointer-events: none;
                        background:
                          radial-gradient(40% 60% at 100% 0%, rgba(99,102,241,0.06) 0%, transparent 60%),
                          radial-gradient(40% 60% at 0% 100%, rgba(236,72,153,0.04) 0%, transparent 60%);
                    }
                    .lset-hero-row {
                        position: relative;
                        display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
                    }
                    .lset-hero-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
                    .lset-hero-icon {
                        width: 38px; height: 38px; border-radius: 11px;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: #fff; display: inline-flex; align-items: center; justify-content: center;
                        box-shadow: 0 6px 14px -3px rgba(99,102,241,0.45);
                        flex-shrink: 0;
                    }
                    .lset-hero-title-row {
                        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
                    }
                    .lset-hero-title {
                        margin: 0 !important; font-size: 18px !important; font-weight: 800 !important;
                        color: var(--text-slate-900) !important; letter-spacing: -0.015em !important;
                    }
                    .lset-hero-divider { width: 1px; height: 16px; background: var(--border-slate-200); }
                    .lset-hero-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
                    .lset-hero-actions { display: flex; gap: 8px; align-items: center; }
                    .lset-search {
                        width: 240px;
                        border-radius: 10px !important;
                        border: 1px solid var(--border-slate-100) !important;
                        background: var(--bg-slate-50) !important;
                        font-size: 13px;
                        height: 36px;
                    }
                    .lset-search:hover, .lset-search:focus { border-color: rgba(99,102,241,0.3) !important; background: var(--bg-pure-white) !important; }
                    .lset-cta-btn {
                        height: 36px !important;
                        border-radius: 10px !important;
                        padding: 0 14px !important;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
                        color: #fff !important;
                        border: none !important;
                        font-weight: 700 !important;
                        font-size: 13px;
                        box-shadow: 0 6px 16px -4px rgba(99,102,241,0.45) !important;
                        display: inline-flex !important; align-items: center; gap: 6px;
                        transition: transform 0.18s ease, box-shadow 0.18s ease;
                    }
                    .lset-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -6px rgba(99,102,241,0.55) !important; }

                    /* STATS */
                    .lset-stats { margin-bottom: 18px !important; }
                    .lset-stat-tile {
                        position: relative;
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 16px;
                        padding: 14px 16px;
                        overflow: hidden;
                        transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
                    }
                    .lset-stat-tile:hover {
                        transform: translateY(-2px);
                        border-color: var(--border-slate-200);
                        box-shadow: 0 8px 20px -10px rgba(15,23,42,0.08);
                    }
                    .lset-stat-glow { position: absolute; inset: 0; pointer-events: none; }
                    .lset-stat-row { position: relative; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
                    .lset-stat-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
                    .lset-stat-label { font-size: 10px; font-weight: 800; color: var(--text-slate-400); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
                    .lset-stat-value { font-size: 22px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.05; }
                    .lset-stat-text-ellipsis { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; }
                    .lset-stat-sub { font-size: 11px; color: var(--text-slate-500); font-weight: 600; margin-top: 6px; }
                    .lset-stat-icon {
                        width: 36px; height: 36px; border-radius: 11px;
                        display: inline-flex; align-items: center; justify-content: center;
                        color: #fff; flex-shrink: 0;
                    }

                    /* SEGMENT TABS */
                    .lset-segments {
                        display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;
                    }
                    .lset-segment {
                        display: inline-flex; align-items: center; gap: 6px;
                        padding: 7px 14px;
                        border-radius: 999px;
                        border: 1px solid var(--border-slate-100);
                        background: var(--bg-pure-white);
                        color: var(--text-slate-500);
                        font-size: 12px; font-weight: 700; cursor: pointer;
                        transition: all 0.15s ease;
                    }
                    .lset-segment:hover:not(.is-active) {
                        background: var(--bg-slate-50);
                        border-color: var(--border-slate-200);
                        color: var(--text-slate-900);
                    }
                    .lset-segment.is-active { box-shadow: 0 1px 2px 0 rgba(15,23,42,0.04); }
                    .lset-segment-count {
                        display: inline-flex; align-items: center; justify-content: center;
                        min-width: 20px; height: 18px;
                        padding: 0 6px;
                        background: var(--bg-slate-50); color: var(--text-slate-500);
                        border-radius: 999px;
                        font-size: 10px; font-weight: 800;
                    }

                    /* TABLE CARD */
                    .lset-table-card {
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 18px;
                        overflow: hidden;
                        box-shadow: 0 1px 3px 0 rgba(15,23,42,0.02), 0 8px 24px -16px rgba(15,23,42,0.06);
                    }
                    .lset-table-head {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: 12px; padding: 16px 22px;
                        border-bottom: 1px solid var(--border-slate-100);
                    }
                    .lset-table-head-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
                    .lset-table-icon {
                        width: 32px; height: 32px; border-radius: 9px;
                        display: inline-flex; align-items: center; justify-content: center;
                        flex-shrink: 0;
                    }
                    .lset-table-title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.005em; }
                    .lset-table-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 2px; font-weight: 500; line-height: 1.4; }
                    .lset-filter-chip {
                        display: inline-flex; align-items: center; gap: 8px;
                        padding: 4px 4px 4px 10px;
                        border-radius: 999px;
                        background: rgba(99,102,241,0.08);
                        color: #4f46e5;
                        border: 1px solid rgba(99,102,241,0.18);
                        font-size: 11px; font-weight: 700;
                    }
                    .lset-filter-chip button {
                        width: 18px; height: 18px;
                        border-radius: 50%;
                        background: rgba(99,102,241,0.18);
                        border: none; color: #4f46e5;
                        cursor: pointer; padding: 0;
                        display: inline-flex; align-items: center; justify-content: center;
                        font-size: 13px; line-height: 1; font-weight: 700;
                    }

                    /* TABLE CELLS */
                    .lset-table .ant-table { background: transparent; }
                    .lset-table .ant-table-thead > tr > th {
                        background: var(--bg-slate-50) !important;
                        color: var(--text-slate-400) !important;
                        font-size: 10px !important;
                        font-weight: 800 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.06em !important;
                        border-bottom: 1px solid var(--border-slate-100) !important;
                        padding: 12px 18px !important;
                    }
                    .lset-table .ant-table-tbody > tr > td {
                        padding: 14px 18px !important;
                        border-bottom: 1px solid var(--bg-slate-50) !important;
                        transition: background 0.15s ease;
                    }
                    .lset-table .ant-table-tbody > tr:hover > td {
                        background: var(--bg-slate-50) !important;
                    }
                    .lset-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }

                    .lset-drag {
                        display: inline-flex; align-items: center; justify-content: center;
                        width: 22px; height: 22px; border-radius: 6px;
                        color: var(--text-slate-400); opacity: 0.6;
                        transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
                    }
                    .lset-table .ant-table-tbody > tr:hover .lset-drag {
                        opacity: 1; background: var(--bg-pure-white); color: #6366f1;
                    }
                    .lset-rank {
                        display: inline-flex; align-items: center; gap: 3px;
                        padding: 3px 9px;
                        border-radius: 999px;
                        background: var(--bg-slate-50);
                        border: 1px solid var(--border-slate-100);
                        color: var(--text-slate-500);
                        font-size: 11px; font-weight: 700;
                    }
                    .lset-rank svg { color: var(--text-slate-400); }

                    .lset-status-cell { display: flex; align-items: center; gap: 14px; }
                    .lset-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
                    .lset-status-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
                    .lset-pill {
                        display: inline-flex; align-items: center;
                        padding: 3px 10px; border-radius: 7px;
                        font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
                        width: fit-content;
                    }
                    .lset-status-meta {
                        font-size: 11px; color: var(--text-slate-400);
                        font-weight: 600;
                        text-transform: lowercase;
                        letter-spacing: 0.02em;
                    }

                    .lset-flag-row { display: flex; gap: 8px; }
                    .lset-flag {
                        display: inline-flex; align-items: center; gap: 5px;
                        padding: 4px 10px;
                        border-radius: 7px;
                        background: var(--bg-slate-50);
                        border: 1px solid var(--border-slate-100);
                        color: var(--text-slate-500);
                        font-size: 10.5px; font-weight: 700;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        user-select: none;
                    }
                    .lset-flag:hover { background: var(--bg-pure-white); border-color: var(--border-slate-200); }
                    .lset-flag.is-on {
                        background: rgba(245,158,11,0.08);
                        border-color: rgba(245,158,11,0.28);
                        color: #d97706;
                    }
                    .lset-flag.is-final {
                        background: rgba(16,185,129,0.08);
                        border-color: rgba(16,185,129,0.28);
                        color: #059669;
                    }

                    .lset-visibility { display: inline-flex; align-items: center; gap: 8px; }
                    .lset-vis-label { font-size: 11px; font-weight: 700; color: var(--text-slate-400); letter-spacing: 0.02em; }
                    .lset-vis-label.is-on { color: #10b981; }

                    .lset-row-actions { display: inline-flex; gap: 4px; align-items: center; justify-content: flex-end; }
                    .lset-icon-btn {
                        width: 28px; height: 28px;
                        border-radius: 8px;
                        background: transparent;
                        border: 1px solid transparent;
                        color: var(--text-slate-500);
                        cursor: pointer;
                        display: inline-flex; align-items: center; justify-content: center;
                        transition: all 0.15s ease;
                    }
                    .lset-icon-btn:hover { background: var(--bg-slate-50); border-color: var(--border-slate-100); color: #6366f1; }
                    .lset-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
                    .lset-icon-btn.lset-icon-danger:hover { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.2); color: #dc2626; }

                    .lset-action-cell { display: flex; align-items: center; gap: 12px; }
                    .lset-action-icon {
                        width: 34px; height: 34px;
                        border-radius: 10px;
                        display: inline-flex; align-items: center; justify-content: center;
                        flex-shrink: 0; font-size: 14px;
                    }
                    .lset-action-text { display: flex; flex-direction: column; gap: 2px; }
                    .lset-action-name { font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
                    .lset-action-meta { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
                    .lset-cat-pill {
                        display: inline-flex; align-items: center; gap: 4px;
                        padding: 3px 10px;
                        border-radius: 7px;
                        background: rgba(99,102,241,0.08);
                        color: #6366f1;
                        border: 1px solid rgba(99,102,241,0.2);
                        font-size: 11px; font-weight: 700;
                        text-transform: capitalize;
                    }
                    .lset-meta-text { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }

                    /* EMPTY */
                    .lset-empty {
                        padding: 56px 24px; text-align: center;
                        display: flex; flex-direction: column; align-items: center;
                    }
                    .lset-empty-icon {
                        width: 64px; height: 64px;
                        border-radius: 18px;
                        background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08));
                        color: #6366f1;
                        display: inline-flex; align-items: center; justify-content: center;
                        margin-bottom: 14px;
                    }
                    .lset-empty-title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); margin-bottom: 4px; }
                    .lset-empty-sub { font-size: 12.5px; color: var(--text-slate-500); margin-bottom: 16px; max-width: 320px; }
                    .lset-empty-cta {
                        height: 36px !important; border-radius: 10px !important; padding: 0 14px !important;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important; color: #fff !important;
                        border: none !important; font-weight: 700 !important;
                        box-shadow: 0 4px 12px -2px rgba(99,102,241,0.4) !important;
                    }

                    /* DRAWER */
                    .lset-drawer .ant-drawer-header { padding: 0 !important; border-bottom: 1px solid var(--border-slate-100); }
                    .lset-drawer .ant-drawer-header-title { padding: 16px 24px; }
                    .lset-drawer .ant-drawer-body { padding: 22px 24px; background: var(--bg-pure-white); }
                    .lset-drawer .ant-drawer-footer { padding: 0; border-top: 1px solid var(--border-slate-100); background: var(--bg-pure-white); }
                    .lset-drawer-bg {
                        position: absolute; inset: 0; pointer-events: none;
                        background:
                          radial-gradient(60% 80% at 100% 0%, rgba(139,92,246,0.08) 0%, transparent 55%),
                          radial-gradient(60% 60% at 0% 100%, rgba(99,102,241,0.06) 0%, transparent 60%);
                    }
                    .lset-drawer-icon {
                        width: 42px; height: 42px; border-radius: 12px;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: #fff; display: inline-flex; align-items: center; justify-content: center;
                        box-shadow: 0 6px 14px -4px rgba(99,102,241,0.45);
                        flex-shrink: 0;
                    }
                    .lset-drawer-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.01em; }
                    .lset-drawer-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; margin-top: 2px; }
                    .lset-drawer-badge {
                        display: inline-flex; align-items: center; gap: 4px;
                        padding: 3px 9px; border-radius: 999px;
                        background: rgba(99,102,241,0.1); color: #6366f1;
                        border: 1px solid rgba(99,102,241,0.22);
                        font-size: 9px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
                        flex-shrink: 0;
                    }
                    .lset-drawer-footer {
                        display: flex; align-items: center; justify-content: space-between; gap: 12px;
                        padding: 14px 24px;
                    }
                    .lset-drawer-footer-hint {
                        display: inline-flex; align-items: center; gap: 6px;
                        font-size: 11px; color: var(--text-slate-400); font-weight: 600;
                    }
                    .lset-drawer-footer-hint svg { color: #10b981; }
                    .lset-btn-cancel {
                        border-radius: 10px !important;
                        height: 38px !important;
                        font-weight: 600 !important;
                        padding: 0 18px !important;
                    }

                    /* SECTION CARDS IN DRAWER */
                    .lset-section-card {
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 14px;
                        padding: 16px;
                        margin-bottom: 14px;
                        transition: border-color 0.15s ease;
                    }
                    .lset-section-card:hover { border-color: var(--border-slate-200); }
                    .lset-section-head {
                        display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px;
                    }
                    .lset-section-step {
                        width: 28px; height: 28px; border-radius: 8px;
                        display: inline-flex; align-items: center; justify-content: center;
                        font-size: 11px; font-weight: 800; flex-shrink: 0;
                    }
                    .lset-section-row { display: flex; align-items: center; gap: 6px; }
                    .lset-section-title { font-size: 12.5px; font-weight: 800; color: var(--text-slate-900); text-transform: uppercase; letter-spacing: 0.04em; }
                    .lset-section-sub { font-size: 11px; color: var(--text-slate-400); font-weight: 500; display: block; line-height: 1.4; }

                    .lset-form-label { font-size: 12px; font-weight: 700; color: var(--text-slate-700); }
                    .lset-drawer-form .ant-input,
                    .lset-drawer-form .ant-input-affix-wrapper,
                    .lset-drawer-form .ant-select-selector,
                    .lset-drawer-form .ant-picker {
                        border-radius: 10px !important;
                        border-color: var(--border-slate-200) !important;
                        transition: border-color 0.15s ease, box-shadow 0.15s ease;
                    }
                    .lset-drawer-form .ant-input:focus,
                    .lset-drawer-form .ant-input-affix-wrapper-focused,
                    .lset-drawer-form .ant-select-focused .ant-select-selector,
                    .lset-drawer-form .ant-picker-focused {
                        border-color: #6366f1 !important;
                        box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
                    }
                    .lset-drawer-form .ant-color-picker-trigger { border-radius: 10px !important; }

                    .lset-toggle-row {
                        display: flex; justify-content: space-between; align-items: center;
                        padding: 12px 14px;
                        border-radius: 10px;
                        background: var(--bg-slate-50);
                        border: 1px solid var(--border-slate-100);
                        margin-bottom: 8px;
                    }
                    .lset-toggle-row:last-child { margin-bottom: 0; }
                    .lset-toggle-text { display: flex; flex-direction: column; gap: 2px; }
                    .lset-toggle-title { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
                    .lset-toggle-sub { font-size: 11px; color: var(--text-slate-500); font-weight: 500; }

                    .lset-drawer-note {
                        display: flex; gap: 10px; align-items: center;
                        padding: 12px 14px;
                        border-radius: 10px;
                        background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.04));
                        border: 1px solid rgba(99,102,241,0.18);
                        margin-top: 14px;
                    }
                    .lset-drawer-note-icon {
                        width: 26px; height: 26px; border-radius: 8px;
                        background: rgba(99,102,241,0.14); color: #6366f1;
                        display: inline-flex; align-items: center; justify-content: center;
                        flex-shrink: 0;
                    }
                    .lset-drawer-note-text { font-size: 11.5px; color: var(--text-slate-700); line-height: 1.5; font-weight: 500; }

                    /* DARK */
                    [data-theme='dark'] .lset-canvas { background: #0d1117 !important; }
                    [data-theme='dark'] .lset-hero { background: #161b22 !important; border-bottom-color: #30363d !important; }
                    [data-theme='dark'] .lset-hero-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-hero-divider { background: #30363d !important; }
                    [data-theme='dark'] .lset-hero-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-search { background: #0d1117 !important; border-color: #30363d !important; color: #c9d1d9 !important; }
                    [data-theme='dark'] .lset-stat-tile { background: #161b22 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-stat-tile:hover { border-color: #3d444d !important; }
                    [data-theme='dark'] .lset-stat-value { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-stat-label { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-stat-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-segment { background: #161b22 !important; border-color: #30363d !important; color: #8b949e !important; }
                    [data-theme='dark'] .lset-segment:hover:not(.is-active) { background: #1c2128 !important; color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-segment-count { background: #0d1117 !important; color: #8b949e !important; }
                    [data-theme='dark'] .lset-table-card { background: #161b22 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-table-head { border-bottom-color: #30363d !important; }
                    [data-theme='dark'] .lset-table-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-table-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-table .ant-table-thead > tr > th { background: #0d1117 !important; color: #6e7681 !important; border-bottom-color: #30363d !important; }
                    [data-theme='dark'] .lset-table .ant-table-tbody > tr > td { border-bottom-color: #21262d !important; color: #c9d1d9 !important; }
                    [data-theme='dark'] .lset-table .ant-table-tbody > tr:hover > td { background: #1c2128 !important; }
                    [data-theme='dark'] .lset-rank { background: #0d1117 !important; border-color: #30363d !important; color: #8b949e !important; }
                    [data-theme='dark'] .lset-status-meta { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-flag { background: #0d1117 !important; border-color: #30363d !important; color: #8b949e !important; }
                    [data-theme='dark'] .lset-icon-btn { color: #8b949e !important; }
                    [data-theme='dark'] .lset-icon-btn:hover { background: #1c2128 !important; border-color: #30363d !important; color: #818cf8 !important; }
                    [data-theme='dark'] .lset-action-name { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-action-meta { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-meta-text { color: #8b949e !important; }
                    [data-theme='dark'] .lset-empty-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-empty-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-content { background: #161b22 !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-body { background: #161b22 !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-header { border-bottom-color: #30363d !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-footer { background: #161b22 !important; border-top-color: #30363d !important; }
                    [data-theme='dark'] .lset-drawer-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-drawer-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-section-card { background: #0d1117 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-section-card:hover { border-color: #3d444d !important; }
                    [data-theme='dark'] .lset-section-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-section-sub { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-form-label { color: #c9d1d9 !important; }
                    [data-theme='dark'] .lset-drawer-form .ant-input,
                    [data-theme='dark'] .lset-drawer-form .ant-input-affix-wrapper,
                    [data-theme='dark'] .lset-drawer-form .ant-select-selector,
                    [data-theme='dark'] .lset-drawer-form .ant-picker {
                        background: #0d1117 !important;
                        border-color: #30363d !important;
                        color: #c9d1d9 !important;
                    }
                    [data-theme='dark'] .lset-toggle-row { background: #161b22 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-toggle-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-toggle-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-drawer-note { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.25) !important; }
                    [data-theme='dark'] .lset-drawer-note-text { color: #c9d1d9 !important; }
                    [data-theme='dark'] .lset-drawer-footer-hint { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-btn-cancel { background: #21262d !important; border-color: #30363d !important; color: #c9d1d9 !important; }

                    /* Autofill fix for dark mode */
                    [data-theme='dark'] input:-webkit-autofill,
                    [data-theme='dark'] input:-webkit-autofill:hover,
                    [data-theme='dark'] input:-webkit-autofill:focus,
                    [data-theme='dark'] textarea:-webkit-autofill,
                    [data-theme='dark'] textarea:-webkit-autofill:hover,
                    [data-theme='dark'] textarea:-webkit-autofill:focus,
                    [data-theme='dark'] select:-webkit-autofill,
                    [data-theme='dark'] select:-webkit-autofill:hover,
                    [data-theme='dark'] select:-webkit-autofill:focus {
                        -webkit-text-fill-color: #c9d1d9 !important;
                        -webkit-box-shadow: 0 0 0px 1000px #0d1117 inset !important;
                        transition: background-color 5000s ease-in-out 0s;
                    }
                    `,
                }} />
            </MainLayout>
        </ProtectedRoute>
    );
}
