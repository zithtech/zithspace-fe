'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Radio, Button, message, Typography, Space, Tag, Tooltip, Divider } from 'antd';
import {
    GlobalOutlined,
    TeamOutlined,
    LockOutlined,
    CopyOutlined,
    CheckOutlined,
    LinkOutlined,
} from '@ant-design/icons';
import { documentHubService as DocumentHubService } from '@/services/documentHub';

const { Text, Paragraph } = Typography;

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    documentId: string;
    documentTitle: string;
    currentVisibility?: string;
    currentShareToken?: string | null;
}

const visibilityOptions = [
    {
        value: 'private',
        icon: <LockOutlined />,
        label: 'Private',
        description: 'Only you can access this document',
        color: '#595959',
    },
    {
        value: 'internal',
        icon: <TeamOutlined />,
        label: 'Internal',
        description: 'All members in your workspace can view',
        color: '#1677ff',
    },
    {
        value: 'public',
        icon: <GlobalOutlined />,
        label: 'Public',
        description: 'Anyone with the link can view',
        color: '#52c41a',
    },
];

const ShareModal: React.FC<ShareModalProps> = ({
    open,
    onClose,
    documentId,
    documentTitle,
    currentVisibility = 'private',
    currentShareToken = null,
}) => {
    const [visibility, setVisibility] = useState(currentVisibility);
    const [shareToken, setShareToken] = useState<string | null>(currentShareToken);
    const [isUpdating, setIsUpdating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        setVisibility(currentVisibility);
        setShareToken(currentShareToken);
    }, [currentVisibility, currentShareToken, open]);

    const handleVisibilityChange = async (newVisibility: string) => {
        setIsUpdating(true);
        try {
            const result = await DocumentHubService.shareDocument(
                documentId,
                newVisibility as 'private' | 'internal' | 'public'
            );
            setVisibility(newVisibility);
            setShareToken(result.shareToken || null);
            messageApi.success(`Document visibility set to ${newVisibility}`);
        } catch (error) {
            console.error(error);
            messageApi.error('Failed to update sharing settings');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRevokeShare = async () => {
        setIsUpdating(true);
        try {
            await DocumentHubService.revokeShare(documentId);
            setVisibility('private');
            setShareToken(null);
            messageApi.success('Sharing revoked');
        } catch (error) {
            console.error(error);
            messageApi.error('Failed to revoke sharing');
        } finally {
            setIsUpdating(false);
        }
    };

    const getShareUrl = () => {
        if (!shareToken) return '';
        return `${window.location.origin}/public/document/${shareToken}`;
    };

    const handleCopyLink = async () => {
        const url = getShareUrl();
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            messageApi.success('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            messageApi.error('Failed to copy link');
        }
    };

    const currentOption = visibilityOptions.find((o) => o.value === visibility);

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LinkOutlined />
                    <span>Share Document</span>
                </div>
            }
            open={open}
            onCancel={onClose}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    {visibility !== 'private' && (
                        <Button danger onClick={handleRevokeShare} loading={isUpdating}>
                            Revoke Access
                        </Button>
                    )}
                    <div style={{ marginLeft: 'auto' }}>
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </div>
            }
            width={480}
            destroyOnClose
        >
            {contextHolder}
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">Sharing: </Text>
                <Text strong>{documentTitle}</Text>
            </div>

            <div style={{ marginBottom: 20 }}>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                    Visibility
                </Text>
                <Radio.Group
                    value={visibility}
                    onChange={(e) => handleVisibilityChange(e.target.value)}
                    disabled={isUpdating}
                    style={{ width: '100%' }}
                >
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                        {visibilityOptions.map((option) => (
                            <Radio
                                key={option.value}
                                value={option.value}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    border: '1px solid',
                                    borderColor:
                                        visibility === option.value ? option.color : '#f0f0f0',
                                    borderRadius: 8,
                                    backgroundColor:
                                        visibility === option.value ? `${option.color}08` : '#fff',
                                    transition: 'all 0.2s',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: option.color, fontSize: 16 }}>
                                        {option.icon}
                                    </span>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{option.label}</div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {option.description}
                                        </Text>
                                    </div>
                                </div>
                            </Radio>
                        ))}
                    </Space>
                </Radio.Group>
            </div>

            {visibility === 'public' && shareToken && (
                <>
                    <Divider style={{ margin: '16px 0' }} />
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Share Link
                        </Text>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 12px',
                                background: '#f5f5f5',
                                borderRadius: 8,
                                border: '1px solid #e8e8e8',
                            }}
                        >
                            <LinkOutlined style={{ color: '#8c8c8c', flexShrink: 0 }} />
                            <Text
                                ellipsis
                                style={{
                                    flex: 1,
                                    fontSize: 13,
                                    fontFamily: 'monospace',
                                    color: '#595959',
                                }}
                            >
                                {getShareUrl()}
                            </Text>
                            <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={
                                        copied ? (
                                            <CheckOutlined style={{ color: '#52c41a' }} />
                                        ) : (
                                            <CopyOutlined />
                                        )
                                    }
                                    onClick={handleCopyLink}
                                />
                            </Tooltip>
                        </div>
                        <Text
                            type="secondary"
                            style={{ fontSize: 12, display: 'block', marginTop: 8 }}
                        >
                            Anyone with this link can view the document without logging in.
                        </Text>
                    </div>
                </>
            )}

            {visibility === 'internal' && (
                <>
                    <Divider style={{ margin: '16px 0' }} />
                    <div
                        style={{
                            padding: '12px 16px',
                            background: '#e6f4ff',
                            borderRadius: 8,
                            border: '1px solid #91caff',
                        }}
                    >
                        <Text style={{ fontSize: 13, color: '#0958d9' }}>
                            <TeamOutlined style={{ marginRight: 6 }} />
                            All members in your workspace can view this document.
                        </Text>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default ShareModal;
