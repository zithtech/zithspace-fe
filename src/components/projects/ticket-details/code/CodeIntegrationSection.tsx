
"use client";

import React, { useState } from "react";
import { List, Typography, Button, Space, Divider, message, Tooltip, Tag, Row, Col, Card, Empty } from "antd";
import {
    BranchesOutlined,
    PullRequestOutlined,
    PlusOutlined,
    GithubOutlined,
    DeleteOutlined,
    LinkOutlined,
    CopyOutlined
} from "@ant-design/icons";
import { useTicketCodeMetadata, useRemoveBranch, useRemovePullRequest } from "@/hooks/useCodeIntegration";
import AddBranchModal from "./AddBranchModal";
import AddPRModal from "./AddPRModal";

const { Text } = Typography;

interface CodeIntegrationSectionProps {
    ticketId: string;
    isEditing?: boolean; // Can be used to toggle view-only mode if needed
}

export default function CodeIntegrationSection({ ticketId, isEditing }: CodeIntegrationSectionProps) {
    const { data: codeMetadata, isLoading } = useTicketCodeMetadata(ticketId);
    const { mutate: removeBranch, isPending: isRemovingBranch } = useRemoveBranch(ticketId);
    const { mutate: removePR, isPending: isRemovingPR } = useRemovePullRequest(ticketId);

    const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
    const [isPRModalOpen, setIsPRModalOpen] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        message.success("Copied to clipboard");
    };

    const handleRemoveBranch = (branchId: string) => {
        removeBranch(branchId, {
            onSuccess: () => message.success("Branch unlinked"),
            onError: () => message.error("Failed to unlink branch")
        });
    };

    const handleRemovePR = (prId: string) => {
        removePR(prId, {
            onSuccess: () => message.success("PR unlinked"),
            onError: () => message.error("Failed to unlink PR")
        });
    };

    return (
        <div style={{ marginTop: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Space>
                    {/* <Button icon={<BranchesOutlined />} onClick={() => setIsBranchModalOpen(true)}>Link Branch</Button> */}
                    <Button icon={<PullRequestOutlined />} onClick={() => setIsPRModalOpen(true)}>Link PR</Button>
                </Space>
            </div>

            <Row gutter={16}>
                {/* <Col span={12}>
                    <Card
                        title={<Space><BranchesOutlined /> Linked Branches</Space>}
                        size="small"
                        bodyStyle={{ padding: 0 }}
                    >
                        {(!codeMetadata?.branches || codeMetadata.branches.length === 0) ? (
                            <div style={{ padding: 24, textAlign: 'center' }}>
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No branches linked" />
                            </div>
                        ) : (
                            <List
                                dataSource={codeMetadata.branches}
                                renderItem={(branch) => (
                                    <List.Item style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0" }}>
                                        <div style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <Tooltip title={branch.repository?.name}>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>{branch.repository?.name}</Text>
                                                    </Tooltip>
                                                    <div style={{ marginTop: 2 }}>
                                                        <Text strong copyable>{branch.name}</Text>
                                                    </div>
                                                </div>
                                                <Space>
                                                    {branch.url && (
                                                        <a href={branch.url} target="_blank" rel="noopener noreferrer">
                                                            <LinkOutlined style={{ color: '#1890ff' }} />
                                                        </a>
                                                    )}
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleRemoveBranch(branch.id)}
                                                        loading={isRemovingBranch}
                                                    />
                                                </Space>
                                            </div>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col> */}
                <Col span={24}>
                    <Card
                        title={<Space><PullRequestOutlined /> Linked Pull Requests & Branches</Space>}
                        size="small"
                        bodyStyle={{ padding: 0 }}
                    >
                        {(!codeMetadata?.pullRequests || codeMetadata.pullRequests.length === 0) ? (
                            <div style={{ padding: 24, textAlign: 'center' }}>
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No PRs or Branches linked" />
                            </div>
                        ) : (
                            <List
                                dataSource={codeMetadata.pullRequests}
                                renderItem={(pr) => (
                                    <List.Item style={{ padding: "16px", borderBottom: "1px solid #f0f0f0" }}>
                                        <div style={{ width: '100%' }}>
                                            <Row align="middle" justify="space-between">
                                                <Col span={20}>
                                                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                        {/* Repository */}
                                                        <Space size={4}>
                                                            <GithubOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                {pr.repository?.name}
                                                            </Text>
                                                        </Space>

                                                        {/* Branch (if available) */}
                                                        {pr.branchName && (
                                                            <Space size={4} style={{ marginTop: 2 }}>
                                                                <BranchesOutlined style={{ fontSize: 12, color: '#1890ff' }} />
                                                                <Text code>{pr.branchName}</Text>
                                                                {pr.branchUrl && (
                                                                    <a href={pr.branchUrl} target="_blank" rel="noopener noreferrer">
                                                                        <LinkOutlined style={{ color: '#1890ff', fontSize: 12 }} />
                                                                    </a>
                                                                )}
                                                            </Space>
                                                        )}

                                                        {/* PR Details */}
                                                        <Space size={8} style={{ marginTop: 4 }} align="center">
                                                            <PullRequestOutlined style={{ color: pr.state === 'open' ? '#52c41a' : '#722ed1' }} />
                                                            <a href={pr.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>
                                                                {pr.title || `Pull Request #${pr.number || ' - '}`}
                                                            </a>
                                                            {pr.number && <Text type="secondary">#{pr.number}</Text>}
                                                            <Tag color={pr.state === 'open' ? 'green' : 'purple'} style={{ margin: 0, fontSize: 10 }}>
                                                                {pr.state.toUpperCase()}
                                                            </Tag>
                                                        </Space>
                                                    </Space>
                                                </Col>
                                                <Col>
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleRemovePR(pr.id)}
                                                        loading={isRemovingPR}
                                                    />
                                                </Col>
                                            </Row>
                                        </div>
                                    </List.Item>
                                )}
                            />
                        )}
                    </Card>
                </Col>
            </Row>

            <AddBranchModal
                open={isBranchModalOpen}
                onClose={() => setIsBranchModalOpen(false)}
                ticketId={ticketId}
            />
            <AddPRModal
                open={isPRModalOpen}
                onClose={() => setIsPRModalOpen(false)}
                ticketId={ticketId}
            />
        </div>
    );
}
