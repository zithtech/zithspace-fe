"use client";

import React, { useState } from "react";
import { Drawer, Tabs, List, Button, Tag, Space, message, Modal } from "antd";
import {
    DeleteOutlined,
    UndoOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
    ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DocumentHubService, { DocumentHub } from "@/services/documentHub";
import { format } from "date-fns";

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
            // We might need to invalidate specific document hub queries if we knew which one
            // For now, allow the user to refresh or simple invalidation
        } catch (error) {
            console.error(error);
            messageApi.error("Failed to restore Document");
        }
    };

    const hubs = trashItems?.hubs || [];
    const documents = trashItems?.documents || [];

    return (
        <Drawer
            title="Trash"
            placement="right"
            width={500}
            onClose={onClose}
            open={open}
        >
            {contextHolder}
            <Tabs
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as "hubs" | "documents")}
                items={[
                    {
                        key: "hubs",
                        label: `Document Hubs (${hubs.length})`,
                        children: (
                            <List
                                loading={isLoading}
                                dataSource={hubs}
                                renderItem={(item: any) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key="restore"
                                                type="link"
                                                icon={<UndoOutlined />}
                                                onClick={() => handleRestoreHub(item.id)}
                                            >
                                                Restore
                                            </Button>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<FolderOpenOutlined className="text-blue-500 text-xl" />}
                                            title={item.name}
                                            description={
                                                <Space direction="vertical" size={0}>
                                                    <span className="text-xs text-gray-400">
                                                        Deleted by: {item.deletedBy?.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        Deleted at: {item.deletedAt && format(new Date(item.deletedAt), "PP p")}
                                                    </span>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ),
                    },
                    {
                        key: "documents",
                        label: `Documents (${documents.length})`,
                        children: (
                            <List
                                loading={isLoading}
                                dataSource={documents}
                                renderItem={(item: any) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key="restore"
                                                type="link"
                                                icon={<UndoOutlined />}
                                                onClick={() => handleRestoreDocument(item.id)}
                                            >
                                                Restore
                                            </Button>,
                                        ]}
                                    >
                                        <List.Item.Meta
                                            avatar={<FileTextOutlined className="text-green-500 text-xl" />}
                                            title={item.title}
                                            description={
                                                <Space direction="vertical" size={0}>
                                                    <span className="text-xs text-gray-500">
                                                        Hub: {item.documentHub?.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        Deleted by: {item.deletedBy?.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        Deleted at: {item.deletedAt && format(new Date(item.deletedAt), "PP p")}
                                                    </span>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                )}
                            />
                        ),
                    },
                ]}
            />
        </Drawer>
    );
};

export default TrashDrawer;
