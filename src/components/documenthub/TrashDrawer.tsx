"use client";

import React, { useState } from "react";
import { Drawer, Tabs, List, Button, Space, message, Typography, Empty, Tooltip } from "antd";
import {
    UndoOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
    ClockCircleOutlined,
    UserOutlined,
    InboxOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DocumentHubService from "@/services/documentHub";
import { format } from "date-fns";

const { Text, Title } = Typography;

interface TrashDrawerProps {
    open: boolean;
    onClose: () => void;
}

const TrashDrawer: React.FC<TrashDrawerProps> = ({ open, onClose }) => {
    const [activeTab, setActiveTab] = useState<"hubs" | "documents">("hubs");
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();

    const { data: trashItems, isLoading, refetch } = useQuery({
        queryKey: ["trashItems"],
        queryFn: () => DocumentHubService.getTrash(),
        enabled: open,
        staleTime: 0,
        gcTime: 0,
        refetchOnMount: 'always',
    });

    const handleRestoreHub = async (id: string) => {
        try {
            await DocumentHubService.restoreDocumentHub(id);
            messageApi.success("Document Hub restored successfully");
            refetch();
            queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to restore Document Hub");
        }
    };

    const handleRestoreDocument = async (id: string) => {
        try {
            await DocumentHubService.restoreDocument(id);
            messageApi.success("Document restored successfully");
            refetch();
            queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to restore Document");
        }
    };

    const hubs = trashItems?.hubs || [];
    const documents = trashItems?.documents || [];

    const TrashItemCard = ({ 
        title, 
        icon, 
        deletedBy, 
        deletedAt, 
        subtext, 
        onRestore,
        type 
    }: any) => (
        <div className="relative bg-white border border-gray-100 rounded-xl p-4 mb-3 overflow-hidden" style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)' }}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${type === 'hub' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`} style={{ backgroundColor: type === 'hub' ? 'var(--bg-blue-50)' : 'var(--bg-green-50)', color: type === 'hub' ? 'var(--text-blue-700)' : 'var(--text-holiday)' }}>
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <Title level={5} className="!mb-1 truncate text-gray-800" style={{ color: 'var(--text-slate-900)' }}>
                            {title}
                        </Title>
                        <Space direction="vertical" size={2} className="w-full">
                            {subtext && (
                                <Text type="secondary" className="text-xs block flex items-center gap-1.5 font-medium" style={{ color: 'var(--text-slate-400)' }}>
                                    <FolderOpenOutlined className="text-[10px]" /> {subtext}
                                </Text>
                            )}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                <Text type="secondary" className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-slate-400)' }}>
                                    <UserOutlined className="text-[10px]" /> {deletedBy || "Unknown"}
                                </Text>
                                <Text type="secondary" className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text-slate-400)' }}>
                                    <ClockCircleOutlined className="text-[10px]" /> {deletedAt ? format(new Date(deletedAt), "MMM d, h:mm a") : "Unknown"}
                                </Text>
                            </div>
                        </Space>
                    </div>
                </div>
                <Tooltip title="Restore">
                    <Button 
                        type="primary" 
                        shape="circle" 
                        icon={<UndoOutlined />} 
                        onClick={onRestore}
                        className="flex-shrink-0 shadow-sm"
                        style={{ background: '#3b82f6' }}
                    />
                </Tooltip>
            </div>
        </div>
    );

    return (
        <Drawer
            title={
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-red-50)' }}>
                        <InboxOutlined className="text-red-500" />
                    </div>
                    <div>
                        <div className="text-base font-semibold text-gray-800" style={{ color: 'var(--text-slate-900)' }}>Trash Bin</div>
                        <div className="text-[11px] font-normal text-gray-400" style={{ color: 'var(--text-slate-400)' }}>Manage and restore deleted items</div>
                    </div>
                </div>
            }
            placement="right"
            width={480}
            onClose={onClose}
            open={open}
            className="premium-drawer"
            headerStyle={{ borderBottom: '1px solid var(--border-slate-200)', padding: '16px 24px', background: 'var(--bg-pure-white)' }}
            bodyStyle={{ padding: '20px', background: 'var(--bg-pure-white)' }}
        >
            {contextHolder}
            
            <div className="mb-6">
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as "hubs" | "documents")}
                    className="premium-tabs"
                    items={[
                        {
                            key: "hubs",
                            label: (
                                <span className="flex items-center gap-2 px-1">
                                    Document Hubs
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'hubs' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`} style={{ backgroundColor: activeTab === 'hubs' ? 'var(--bg-blue-50)' : 'var(--bg-slate-50)', color: activeTab === 'hubs' ? 'var(--text-blue-700)' : 'var(--text-slate-400)' }}>
                                        {hubs.length}
                                    </span>
                                </span>
                            ),
                        },
                        {
                            key: "documents",
                            label: (
                                <span className="flex items-center gap-2 px-1">
                                    Documents
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTab === 'documents' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`} style={{ backgroundColor: activeTab === 'documents' ? 'var(--bg-green-50)' : 'var(--bg-slate-50)', color: activeTab === 'documents' ? 'var(--text-holiday)' : 'var(--text-slate-400)' }}>
                                        {documents.length}
                                    </span>
                                </span>
                            ),
                        },
                    ]}
                />
            </div>

            <div className="trash-content">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" style={{ borderColor: 'var(--premium-blue)' }} />
                        <Text type="secondary" style={{ color: 'var(--text-slate-400)' }}>Loading trash items...</Text>
                    </div>
                ) : activeTab === "hubs" ? (
                    hubs.length > 0 ? (
                        hubs.map((item: any) => (
                            <TrashItemCard
                                key={item.id}
                                type="hub"
                                title={item.name}
                                icon={<FolderOpenOutlined className="text-xl" />}
                                deletedBy={item.deletedBy?.name}
                                deletedAt={item.deletedAt}
                                onRestore={() => handleRestoreHub(item.id)}
                            />
                        ))
                    ) : (
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                            description={<span className="text-gray-400" style={{ color: 'var(--text-slate-400)' }}>No trashed document hubs found</span>}
                            className="mt-20"
                        />
                    )
                ) : (
                    documents.length > 0 ? (
                        documents.map((item: any) => (
                            <TrashItemCard
                                key={item.id}
                                type="document"
                                title={item.title}
                                subtext={`Cloud: ${item.documentHub?.name}`}
                                icon={<FileTextOutlined className="text-xl" />}
                                deletedBy={item.deletedBy?.name}
                                deletedAt={item.deletedAt}
                                onRestore={() => handleRestoreDocument(item.id)}
                            />
                        ))
                    ) : (
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE} 
                            description={<span className="text-gray-400" style={{ color: 'var(--text-slate-400)' }}>No trashed documents found</span>}
                            className="mt-20"
                        />
                    )
                )}
            </div>

            <style jsx global>{`
                .premium-tabs .ant-tabs-nav {
                    margin-bottom: 0 !important;
                }
                .premium-tabs .ant-tabs-nav::before {
                    border-bottom: none !important;
                }
                .premium-tabs .ant-tabs-tab {
                    padding: 8px 0 12px 0 !important;
                    margin: 0 24px 0 0 !important;
                }
                .premium-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: var(--text-slate-900) !important;
                    font-weight: 600 !important;
                }
                .premium-tabs .ant-tabs-ink-bar {
                    height: 3px !important;
                    border-radius: 3px 3px 0 0 !important;
                }
            `}</style>
        </Drawer>
    );
};

export default TrashDrawer;
