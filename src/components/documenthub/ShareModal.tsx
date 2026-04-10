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
    ShareAltOutlined,
    ArrowRightOutlined
} from '@ant-design/icons';
import { documentHubService as DocumentHubService } from '@/services/documentHub';
import { format } from 'date-fns';

const { Text, Title, Paragraph } = Typography;

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
        bgColor: 'var(--bg-slate-50)',
        activeColor: 'var(--text-slate-600)',
        borderColor: 'var(--border-slate-200)',
    },
    {
        value: 'internal',
        icon: <TeamOutlined />,
        label: 'Internal',
        description: 'All workspace members can view',
        bgColor: 'var(--bg-blue-50)',
        activeColor: 'var(--premium-blue)',
        borderColor: 'var(--border-blue-200)',
    },
    {
        value: 'public',
        icon: <GlobalOutlined />,
        label: 'Public',
        description: 'Anyone with the link can view',
        bgColor: 'var(--bg-green-50)',
        activeColor: '#22c55e',
        borderColor: 'var(--border-green-200)',
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
        if (open) {
            setVisibility(currentVisibility);
            setShareToken(currentShareToken);
        }
    }, [currentVisibility, currentShareToken, open]);

    const handleVisibilityChange = async (newVisibility: string) => {
        if (newVisibility === visibility) return;

        setIsUpdating(true);
        try {
            const result = await DocumentHubService.shareDocument(
                documentId,
                newVisibility as 'private' | 'public'
            );
            setVisibility(newVisibility);
            setShareToken(result.shareToken || null);
            messageApi.success(`Visibility updated to ${newVisibility}`);
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
            messageApi.success('Sharing access revoked');
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

    return (
        <Modal
            title={
                <div className="flex items-center gap-2.5 py-1">
                    <div className="w-8 h-8 rounded-lg bg-blue-50/10 flex items-center justify-center text-blue-600">
                        <ShareAltOutlined className="text-lg" />
                    </div>
                    <div>
                        <Title level={5} className="!mb-0 text-gray-800" style={{ color: 'var(--text-slate-900)' }}>Share Document</Title>
                        <Text type="secondary" className="text-[11px] font-normal uppercase tracking-wider" style={{ color: 'var(--text-slate-400)' }}>Configure Access Settings</Text>
                    </div>
                </div>
            }
            open={open}
            onCancel={onClose}
            footer={
                <div className="flex justify-between items-center py-2">
                    {visibility !== 'private' ? (
                        <Button
                            danger
                            type="text"
                            size="small"
                            onClick={handleRevokeShare}
                            loading={isUpdating}
                            className="font-medium hover:!bg-red-50"
                            style={{ '--hover-bg': 'var(--bg-red-50)' } as any}
                        >
                            Revoke All Access
                        </Button>
                    ) : <div />}
                    <Button
                        onClick={onClose}
                        className="rounded-lg px-6 font-medium border-gray-200 hover:border-blue-400 hover:text-blue-500"
                        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-700)' }}
                    >
                        Done
                    </Button>
                </div>
            }
            width={520}
            destroyOnClose
            className="premium-share-modal"
            centered
        >
            {contextHolder}
            <div className="mt-2 mb-4 px-1">
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between gap-3 mb-4" style={{ background: 'var(--bg-slate-50)', borderColor: 'var(--border-slate-100)' }}>
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-500 shadow-sm flex-shrink-0" style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-slate-200)', color: 'var(--text-slate-400)' }}>
                            <LinkOutlined className="text-base" />
                        </div>
                        <div className="min-w-0">
                            <Text type="secondary" className="text-[10px] block leading-none mb-1" style={{ color: 'var(--text-slate-400)' }}>Editing Document</Text>
                            <Text strong className="text-[13px] block truncate text-gray-800 leading-tight" style={{ color: 'var(--text-slate-900)' }}>{documentTitle}</Text>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <Text strong className="text-[12px] text-gray-700" style={{ color: 'var(--text-slate-700)' }}>Select Visibility</Text>
                        <Tooltip title="Visibility controls who can see this document">
                            <Text type="secondary" className="text-[10px] cursor-help font-medium" style={{ color: 'var(--text-slate-400)' }}>Settings Guide</Text>
                        </Tooltip>
                    </div>

                    <div className="flex flex-col gap-2">
                        {visibilityOptions.map((option) => {
                            const isActive = visibility === option.value;
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => !isUpdating && handleVisibilityChange(option.value)}
                                    className={`
                                        relative group cursor-pointer rounded-xl p-3 border transition-all duration-200
                                        ${isActive
                                            ? `bg-slate-50/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-opacity-10`
                                            : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50'}
                                    `}
                                    style={{
                                        borderColor: isActive ? option.activeColor : 'var(--border-slate-100)',
                                        backgroundColor: isActive ? 'var(--bg-pure-white)' : 'var(--bg-pure-white)',
                                        boxShadow: isActive ? `0 2px 8px ${option.activeColor}10` : undefined,
                                        ringColor: isActive ? option.activeColor : undefined
                                    } as any}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-lg flex items-center justify-center text-base transition-colors border"
                                                style={{
                                                    backgroundColor: isActive ? 'white' : option.bgColor,
                                                    color: isActive ? option.activeColor : '#6b7280',
                                                    borderColor: isActive ? `${option.activeColor}40` : 'transparent'
                                                }}
                                            >
                                                {option.icon}
                                            </div>
                                            <div>
                                                <Text className={`font-semibold block text-sm ${isActive ? 'text-gray-900' : 'text-gray-600'}`} style={{ color: isActive ? 'var(--text-slate-900)' : 'var(--text-slate-700)' }}>
                                                    {option.label}
                                                </Text>
                                                <Text className="text-[10px] text-gray-400 block mt-0.5 leading-tight" style={{ color: 'var(--text-slate-400)' }}>
                                                    {option.description}
                                                </Text>
                                            </div>
                                        </div>
                                        <div className={`
                                            w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
                                            ${isActive ? 'bg-white' : 'border-gray-200'}
                                        `}
                                            style={{
                                                borderColor: isActive ? option.activeColor : 'var(--border-slate-200)',
                                                backgroundColor: isActive ? 'var(--bg-pure-white)' : 'transparent'
                                            }}>
                                            {isActive && (
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: option.activeColor }} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {visibility === 'public' && shareToken && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <Divider className="!my-4" />
                        <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <Text strong className="text-[12px] text-blue-900 flex items-center gap-1.5" style={{ color: 'var(--text-blue-700)' }}>
                                    <GlobalOutlined /> Public Share Link
                                </Text>
                                <Tag color="blue" className="!mr-0 border-blue-200 text-[9px] px-1.5 leading-tight py-0 rounded-full uppercase font-bold tracking-tight" style={{ background: 'var(--bg-blue-50)', borderColor: 'var(--border-blue-200)', color: 'var(--text-blue-700)' }}>Active</Tag>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 bg-white border border-blue-100 rounded-lg px-2.5 py-2 flex items-center min-w-0" style={{ background: 'var(--bg-pure-white)', borderColor: 'var(--border-blue-200)' }}>
                                    <Text
                                        ellipsis
                                        className="text-[11px] font-mono text-gray-500 flex-1"
                                        style={{ color: 'var(--text-slate-600)' }}
                                    >
                                        {getShareUrl()}
                                    </Text>
                                </div>
                                <Tooltip title={copied ? 'Copied' : 'Copy link'}>
                                    <Button
                                        type="primary"
                                        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                                        onClick={handleCopyLink}
                                        className={`rounded-lg border-none flex items-center justify-center transition-all duration-300 ${copied ? 'bg-green-500 hover:!bg-green-600' : 'bg-blue-600 hover:!bg-blue-700'}`}
                                        style={{ width: 36, height: 36 }}
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    </div>
                )}

                {/* {visibility === 'internal' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <Divider className="!my-4" />
                        <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/60 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-blue-500 flex-shrink-0 shadow-sm border border-blue-50">
                                <TeamOutlined className="text-xs" />
                            </div>
                            <Text className="text-[11px] text-blue-700 font-medium">
                                Internal access is active. Workspace members can view this document.
                            </Text>
                        </div>
                    </div>
                )} */}
            </div>

            <style jsx global>{`
                .premium-share-modal .ant-modal-content {
                    border-radius: 16px;
                    padding: 16px 20px !important;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                }
                .premium-share-modal .ant-modal-header {
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f3f4f6;
                }
                .premium-share-modal .ant-modal-close {
                    top: 16px;
                    right: 16px;
                }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-in-from-top-2 { from { transform: translateY(-0.5rem); } to { transform: translateY(0); } }
                .animate-in { animation: fade-in 0.3s ease-out, slide-in-from-top-2 0.3s ease-out; }
            `}</style>
        </Modal>
    );
};

export default ShareModal;
