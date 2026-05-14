"use client";

import React, { useMemo, useState } from "react";
import {
    Drawer,
    Input,
    Button,
    message,
    Empty,
    Tooltip,
    Select,
    Modal,
    Form,
    Skeleton,
    Avatar,
} from "antd";
import {
    UndoOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
    ClockCircleOutlined,
    InboxOutlined,
    FolderOutlined,
    SearchOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DocumentHubService, { DocumentHub } from "@/services/documentHub";
import { format, formatDistanceToNow } from "date-fns";
import { usePermission } from "@/hooks/usePermission";

interface TrashDrawerProps {
    open: boolean;
    onClose: () => void;
}

type TabKey = "hubs" | "folders" | "documents";

const tabAccent: Record<TabKey, { gradient: string; shadow: string; tint: string; text: string }> = {
    hubs: {
        gradient: "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
        shadow: "rgba(59, 130, 246, 0.28)",
        tint: "var(--bg-blue-50)",
        text: "var(--text-blue-700)",
    },
    folders: {
        gradient: "linear-gradient(135deg, #F97316 0%, #F59E0B 100%)",
        shadow: "rgba(249, 115, 22, 0.28)",
        tint: "var(--bg-orange-50)",
        text: "#b45309",
    },
    documents: {
        gradient: "linear-gradient(135deg, #10B981 0%, #14B8A6 100%)",
        shadow: "rgba(16, 185, 129, 0.28)",
        tint: "var(--bg-green-50)",
        text: "var(--text-holiday)",
    },
};

const TrashDrawer: React.FC<TrashDrawerProps> = ({ open, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabKey>("hubs");
    const [searchValue, setSearchValue] = useState("");
    const { canUpdateDocument } = usePermission();
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<any>(null);
    const [restoreForm] = Form.useForm();

    const { data: trashItems, isLoading, refetch } = useQuery({
        queryKey: ["trashItems"],
        queryFn: () => DocumentHubService.getTrash(),
        enabled: open,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: "always",
    });

    const { data: activeHubs = [] } = useQuery({
        queryKey: ["activeHubs"],
        queryFn: () => DocumentHubService.getAllDocumentHubs(),
        enabled: open,
    });

    const hubs = trashItems?.hubs || [];
    const documents = trashItems?.documents || [];
    const folders = trashItems?.folders || [];

    const handleRestoreHub = async (id: string, name: string) => {
        modal.confirm({
            title: "Restore document hub?",
            content: `"${name}" will be moved back to your active hubs.`,
            okText: "Restore",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await DocumentHubService.restoreDocumentHub(id);
                    messageApi.success("Document hub restored");
                    refetch();
                    queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
                } catch (error) {
                    console.error(error);
                    messageApi.error("Failed to restore document hub");
                }
            },
        });
    };

    const handleRestoreDocument = async (id: string, title: string) => {
        modal.confirm({
            title: "Restore document?",
            content: `"${title}" will be moved back to its hub.`,
            okText: "Restore",
            cancelText: "Cancel",
            onOk: async () => {
                try {
                    await DocumentHubService.restoreDocument(id);
                    messageApi.success("Document restored");
                    refetch();
                    queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
                } catch (error) {
                    console.error(error);
                    messageApi.error("Failed to restore document");
                }
            },
        });
    };

    const handleRestoreFolder = (item: any) => {
        setSelectedFolder(item);
        setIsRestoreModalOpen(true);
        restoreForm.setFieldsValue({ hubId: item.documentHubId });
    };

    const onFinishRestoreFolder = async (values: any) => {
        try {
            if (!selectedFolder) return;
            await DocumentHubService.restoreTreeNode(selectedFolder.id, {
                documentHubId: values.hubId,
                parentId: null,
            });
            messageApi.success("Folder restored");
            setIsRestoreModalOpen(false);
            refetch();
            queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
        } catch (error: any) {
            console.error(error);
            messageApi.error(error.message || "Failed to restore folder");
        }
    };

    // Filter the active list by the search query.
    const visibleItems = useMemo(() => {
        const q = searchValue.trim().toLowerCase();
        const matchHub = (h: any) => !q || (h.name || "").toLowerCase().includes(q);
        const matchOther = (i: any) =>
            !q ||
            (i.title || "").toLowerCase().includes(q) ||
            (i.documentHub?.name || "").toLowerCase().includes(q);
        if (activeTab === "hubs") return hubs.filter(matchHub);
        if (activeTab === "folders") return folders.filter(matchOther);
        return documents.filter(matchOther);
    }, [activeTab, hubs, folders, documents, searchValue]);

    const totalCount = hubs.length + folders.length + documents.length;

    /* ------------------------------------------------------------------ */
    /*  Sub-components                                                    */
    /* ------------------------------------------------------------------ */

    const TabPill: React.FC<{
        tab: TabKey;
        label: string;
        count: number;
    }> = ({ tab, label, count }) => {
        const active = activeTab === tab;
        const accent = tabAccent[tab];
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className="flex-1 flex items-center justify-center gap-2 transition-all"
                style={{
                    padding: "8px 12px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: active ? "var(--text-slate-900)" : "var(--text-slate-600)",
                    background: active ? "var(--bg-pure-white)" : "transparent",
                    boxShadow: active ? "0 1px 3px rgba(15, 23, 42, 0.08)" : "none",
                }}
            >
                {label}
                <span
                    className="text-[10.5px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded"
                    style={{
                        background: active ? accent.tint : "var(--bg-slate-100)",
                        color: active ? accent.text : "var(--text-slate-400)",
                    }}
                >
                    {count}
                </span>
            </button>
        );
    };

    interface CardProps {
        type: TabKey extends "hubs" ? never : never;
    }
    type CardType = "hub" | "folder" | "document";
    const TrashItemCard: React.FC<{
        type: CardType;
        title: string;
        subtext?: string;
        deletedBy?: string;
        deletedByAvatar?: string;
        deletedAt?: string;
        onRestore: () => void;
    }> = ({
        type,
        title,
        subtext,
        deletedBy,
        deletedByAvatar,
        deletedAt,
        onRestore,
    }) => {
        const tab: TabKey = type === "hub" ? "hubs" : type === "folder" ? "folders" : "documents";
        const accent = tabAccent[tab];
        const Icon =
            type === "hub" ? FolderOpenOutlined : type === "folder" ? FolderOutlined : FileTextOutlined;
        return (
            <div
                className="group rounded-2xl p-4 transition-all duration-200"
                style={{
                    border: "1px solid var(--border-slate-200)",
                    background: "var(--bg-pure-white)",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 8px 24px ${accent.shadow}`;
                    e.currentTarget.style.borderColor = "transparent";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "var(--border-slate-200)";
                }}
            >
                <div className="flex items-start gap-3">
                    {/* Gradient icon */}
                    <div
                        className="flex items-center justify-center shrink-0 text-white"
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: accent.gradient,
                            boxShadow: `0 4px 12px ${accent.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                        }}
                    >
                        <Icon style={{ fontSize: 16 }} />
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h4
                                className="text-[14px] font-semibold m-0 truncate tracking-tight"
                                style={{
                                    color: "var(--text-slate-900)",
                                    letterSpacing: "-0.01em",
                                }}
                            >
                                {title}
                            </h4>
                        </div>

                        {subtext && (
                            <div
                                className="inline-flex items-center gap-1 mt-1 px-1.5 py-[1px] rounded text-[10.5px] font-medium"
                                style={{ background: accent.tint, color: accent.text }}
                            >
                                <FolderOpenOutlined style={{ fontSize: 9 }} />
                                {subtext}
                            </div>
                        )}

                        <div
                            className="flex items-center gap-2 mt-2"
                            style={{ color: "var(--text-slate-400)" }}
                        >
                            <Avatar
                                size={18}
                                src={deletedByAvatar}
                                style={{
                                    background: "var(--bg-blue-50)",
                                    color: "var(--text-blue-700)",
                                    fontSize: 9,
                                }}
                            >
                                {(deletedBy || "U").charAt(0).toUpperCase()}
                            </Avatar>
                            <span className="text-[11.5px] font-medium" style={{ color: "var(--text-slate-600)" }}>
                                {deletedBy || "Unknown"}
                            </span>
                            <span style={{ color: "var(--border-slate-200)" }}>·</span>
                            <Tooltip title={deletedAt ? format(new Date(deletedAt), "PPp") : ""}>
                                <span className="inline-flex items-center gap-1 text-[11.5px]">
                                    <ClockCircleOutlined style={{ fontSize: 10 }} />
                                    {deletedAt
                                        ? formatDistanceToNow(new Date(deletedAt), { addSuffix: true })
                                        : "Unknown"}
                                </span>
                            </Tooltip>
                        </div>
                    </div>
                </div>

                {/* Action row */}
                {canUpdateDocument && (
                    <div
                        className="flex items-center justify-end mt-3 pt-3"
                        style={{ borderTop: "1px solid var(--border-slate-200)" }}
                    >
                        <Button
                            size="small"
                            icon={<UndoOutlined />}
                            onClick={onRestore}
                            style={{
                                borderRadius: 8,
                                height: 30,
                                fontSize: 12,
                                fontWeight: 600,
                                paddingInline: 12,
                                background: accent.gradient,
                                color: "#fff",
                                border: "none",
                                boxShadow: `0 2px 8px ${accent.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                            }}
                        >
                            Restore
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    const renderEmpty = (label: string) => (
        <div
            className="rounded-2xl py-10 mt-2"
            style={{
                border: "1px dashed var(--border-slate-200)",
                background: "var(--bg-pure-white)",
            }}
        >
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                    <span style={{ color: "var(--text-slate-400)", fontSize: 13 }}>{label}</span>
                }
            />
        </div>
    );

    const renderLoading = () => (
        <div className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="rounded-2xl p-4"
                    style={{
                        border: "1px solid var(--border-slate-200)",
                        background: "var(--bg-pure-white)",
                    }}
                >
                    <Skeleton avatar active paragraph={{ rows: 2 }} />
                </div>
            ))}
        </div>
    );

    /* ------------------------------------------------------------------ */
    /*  Render                                                             */
    /* ------------------------------------------------------------------ */

    return (
        <Drawer
            title={null}
            closable={false}
            placement="right"
            width={500}
            onClose={onClose}
            open={open}
            styles={{
                header: { display: "none" },
                body: { padding: 0, background: "var(--bg-pure-white)" },
                content: { background: "var(--bg-pure-white)" },
                mask: { backdropFilter: "blur(4px)", background: "rgba(15, 23, 42, 0.35)" },
            }}
        >
            {contextHolder}
            {modalContextHolder}

            {/* Hero header */}
            <div
                className="px-5 pt-5 pb-4"
                style={{
                    background:
                        "linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)",
                    borderBottom: "1px solid var(--border-slate-200)",
                }}
            >
                <div className="flex items-start gap-3">
                    <div
                        className="flex items-center justify-center shrink-0 text-white"
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                            boxShadow:
                                "0 4px 12px rgba(239, 68, 68, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)",
                        }}
                    >
                        <InboxOutlined style={{ fontSize: 18 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2
                            className="text-[17px] font-bold tracking-tight m-0"
                            style={{ color: "var(--text-slate-900)", letterSpacing: "-0.02em" }}
                        >
                            Trash Bin
                        </h2>
                        <p
                            className="m-0 mt-0.5 text-[12.5px]"
                            style={{ color: "var(--text-slate-400)" }}
                        >
                            {totalCount === 0
                                ? "Nothing in trash."
                                : `${totalCount} ${totalCount === 1 ? "item" : "items"} can be restored`}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
                        style={{
                            width: 30,
                            height: 30,
                            color: "var(--text-slate-400)",
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-slate-100)";
                            e.currentTarget.style.color = "var(--text-slate-700)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--text-slate-400)";
                        }}
                        aria-label="Close"
                    >
                        <CloseOutlined style={{ fontSize: 13 }} />
                    </button>
                </div>

                {/* Search */}
                <div className="mt-4">
                    <Input
                        size="large"
                        placeholder="Search trash…"
                        prefix={
                            <SearchOutlined style={{ color: "var(--text-slate-400)" }} />
                        }
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        allowClear
                        style={{ borderRadius: 10, fontSize: 13 }}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-4">
                <div
                    className="flex items-center p-1 rounded-xl"
                    style={{
                        background: "var(--bg-slate-50)",
                        border: "1px solid var(--border-slate-200)",
                    }}
                >
                    <TabPill tab="hubs" label="Hubs" count={hubs.length} />
                    <TabPill tab="folders" label="Folders" count={folders.length} />
                    <TabPill tab="documents" label="Documents" count={documents.length} />
                </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4 flex flex-col gap-2.5">
                {isLoading
                    ? renderLoading()
                    : visibleItems.length === 0
                      ? renderEmpty(
                            searchValue.trim()
                                ? "No matching items in trash."
                                : activeTab === "hubs"
                                  ? "No trashed document hubs."
                                  : activeTab === "folders"
                                    ? "No trashed folders."
                                    : "No trashed documents.",
                        )
                      : visibleItems.map((item: any) => {
                            if (activeTab === "hubs") {
                                return (
                                    <TrashItemCard
                                        key={item.id}
                                        type="hub"
                                        title={item.name}
                                        deletedBy={item.deletedBy?.name}
                                        deletedByAvatar={item.deletedBy?.avatarUrl}
                                        deletedAt={item.deletedAt}
                                        onRestore={() =>
                                            handleRestoreHub(item.id, item.name)
                                        }
                                    />
                                );
                            }
                            if (activeTab === "folders") {
                                return (
                                    <TrashItemCard
                                        key={item.id}
                                        type="folder"
                                        title={item.title}
                                        subtext={item.documentHub?.name}
                                        deletedBy={item.deletedBy?.name}
                                        deletedByAvatar={item.deletedBy?.avatarUrl}
                                        deletedAt={item.deletedAt}
                                        onRestore={() => handleRestoreFolder(item)}
                                    />
                                );
                            }
                            return (
                                <TrashItemCard
                                    key={item.id}
                                    type="document"
                                    title={item.title}
                                    subtext={item.documentHub?.name}
                                    deletedBy={item.deletedBy?.name}
                                    deletedByAvatar={item.deletedBy?.avatarUrl}
                                    deletedAt={item.deletedAt}
                                    onRestore={() =>
                                        handleRestoreDocument(item.id, item.title)
                                    }
                                />
                            );
                        })}
            </div>

            <Modal
                title={
                    <div className="flex items-center gap-3 py-1">
                        <div
                            className="flex items-center justify-center shrink-0 text-white"
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 12,
                                background: tabAccent.folders.gradient,
                                boxShadow: `0 4px 12px ${tabAccent.folders.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                            }}
                        >
                            <FolderOutlined style={{ fontSize: 16 }} />
                        </div>
                        <div>
                            <div
                                className="text-[15px] font-semibold leading-tight"
                                style={{ color: "var(--text-slate-900)" }}
                            >
                                Restore folder
                            </div>
                            <div
                                className="text-[12px] font-normal mt-0.5"
                                style={{ color: "var(--text-slate-400)" }}
                            >
                                Choose where to put it back.
                            </div>
                        </div>
                    </div>
                }
                open={isRestoreModalOpen}
                onCancel={() => setIsRestoreModalOpen(false)}
                onOk={() => restoreForm.submit()}
                okText="Restore"
                centered
                width={460}
                styles={{
                    content: { borderRadius: 16, padding: 22 },
                    mask: { backdropFilter: "blur(6px)", background: "rgba(15, 23, 42, 0.45)" },
                }}
                destroyOnClose
            >
                <div className="pt-2">
                    <p
                        className="m-0 mb-3 text-[12.5px]"
                        style={{ color: "var(--text-slate-600)" }}
                    >
                        Restoring{" "}
                        <span style={{ color: "var(--text-slate-900)", fontWeight: 600 }}>
                            {selectedFolder?.title}
                        </span>{" "}
                        — pick the destination hub.
                    </p>
                    <Form form={restoreForm} layout="vertical" onFinish={onFinishRestoreFolder}>
                        <Form.Item
                            name="hubId"
                            label={
                                <span
                                    className="text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                                    style={{ color: "var(--text-slate-400)" }}
                                >
                                    Target hub
                                </span>
                            }
                            rules={[{ required: true, message: "Please select a hub" }]}
                            className="mb-0"
                        >
                            <Select
                                size="large"
                                placeholder="Select a hub"
                                showSearch
                                optionFilterProp="label"
                                style={{ borderRadius: 10 }}
                                options={activeHubs.map((hub: DocumentHub) => ({
                                    value: hub.id,
                                    label: hub.name,
                                }))}
                            />
                        </Form.Item>
                    </Form>
                </div>
            </Modal>
        </Drawer>
    );
};

export default TrashDrawer;
