'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, message, Tooltip, Input } from 'antd';
import {
    GlobalOutlined,
    LockOutlined,
    CopyOutlined,
    CheckOutlined,
    LinkOutlined,
    ShareAltOutlined,

    CloseOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
} from '@ant-design/icons';
import { documentHubService as DocumentHubService } from '@/services/documentHub';

interface ShareModalProps {
    open: boolean;
    onClose: () => void;
    entityId: string;
    entityTitle: string;
    entityType: 'document' | 'hub';
    currentVisibility?: string;
    currentShareToken?: string | null;
    currentSharedWith?: string[];
}

type VisibilityOption = {
    value: 'private' | 'public';
    icon: React.ReactNode;
    label: string;
    description: string;
    gradient: string;
    shadow: string;
    accent: string;
};

const visibilityOptions: VisibilityOption[] = [
    {
        value: 'private',
        icon: <LockOutlined />,
        label: 'Private',
        description: 'Only you can access this.',
        gradient: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)',
        shadow: 'rgba(100, 116, 139, 0.28)',
        accent: '#64748B',
    },
    {
        value: 'public',
        icon: <GlobalOutlined />,
        label: 'Public',
        description: 'Anyone with the link can view.',
        gradient: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
        shadow: 'rgba(16, 185, 129, 0.28)',
        accent: 'var(--text-holiday)',
    },
];

const ShareModal: React.FC<ShareModalProps> = ({
    open,
    onClose,
    entityId,
    entityTitle,
    entityType,
    currentVisibility = 'private',
    currentShareToken = null,
    currentSharedWith = [],
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

    // The cached entity data may say visibility='public' but be missing the
    // shareToken (stale fetch, freshly re-mounted modal, etc.). When that
    // happens, fetch/generate the token on open so the user doesn't have to
    // toggle private→public to make the link appear.
    useEffect(() => {
        if (!open) return;
        if (currentVisibility !== 'public') return;
        if (currentShareToken) return; // already have it
        let cancelled = false;
        (async () => {
            try {
                setIsUpdating(true);
                const result =
                    entityType === 'document'
                        ? await DocumentHubService.shareDocument(entityId, 'public')
                        : await DocumentHubService.shareDocumentHub(entityId, 'public');
                if (cancelled) return;
                if (result?.shareToken) setShareToken(result.shareToken);
            } catch (err) {
                console.error('Failed to fetch share token', err);
            } finally {
                if (!cancelled) setIsUpdating(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, currentVisibility, currentShareToken, entityType, entityId]);

    const updateSharing = async (newVisibility: 'private' | 'public', newSharedWith: string[] = []) => {
        setIsUpdating(true);
        try {
            let result;
            if (entityType === 'document') {
                result = await DocumentHubService.shareDocument(entityId, newVisibility, newSharedWith);
            } else {
                result = await DocumentHubService.shareDocumentHub(entityId, newVisibility, newSharedWith);
            }

            setVisibility(newVisibility);
            setShareToken(result.shareToken || null);
            messageApi.success('Sharing settings updated');
        } catch (error) {
            console.error(error);
            messageApi.error('Failed to update sharing settings');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleVisibilityChange = async (newVisibility: 'private' | 'public') => {
        if (newVisibility === visibility) return;
        await updateSharing(newVisibility, []);
    };

    const handleRevokeShare = async () => {
        setIsUpdating(true);
        try {
            if (entityType === 'document') {
                await DocumentHubService.revokeShare(entityId);
            } else {
                await DocumentHubService.revokeHubShare(entityId);
            }

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
        const path = entityType === 'document' ? 'document' : 'document/hub';
        return `${window.location.origin}/public/${path}/${shareToken}`;
    };

    const handleCopyLink = async () => {
        const url = getShareUrl();
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            messageApi.success('Link copied');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            messageApi.error('Failed to copy link');
        }
    };

    return (
        <>
            <Modal
                open={open}
                onCancel={onClose}
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
                destroyOnClose
            >
                {contextHolder}

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
                            <ShareAltOutlined style={{ fontSize: 18 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2
                                className="text-[16px] font-bold tracking-tight m-0"
                                style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}
                            >
                                Share {entityType === 'document' ? 'document' : 'document hub'}
                            </h2>
                            <p
                                className="m-0 mt-0.5 text-[12.5px]"
                                style={{ color: 'var(--text-slate-400)' }}
                            >
                                Choose who can access this — and grab a shareable link.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUpdating}
                            className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
                            style={{
                                width: 30,
                                height: 30,
                                color: 'var(--text-slate-400)',
                                background: 'transparent',
                                border: 'none',
                                cursor: isUpdating ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                if (isUpdating) return;
                                e.currentTarget.style.background = 'var(--bg-slate-100)';
                                e.currentTarget.style.color = 'var(--text-slate-700)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text-slate-400)';
                            }}
                            aria-label="Close"
                        >
                            <CloseOutlined style={{ fontSize: 13 }} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-4 flex flex-col gap-4">
                    {/* Entity card */}
                    <div
                        className="rounded-xl p-3 flex items-center gap-3"
                        style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-slate-200)',
                        }}
                    >
                        <div
                            className="flex items-center justify-center shrink-0 text-white"
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background:
                                    entityType === 'document'
                                        ? 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                                        : 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                                boxShadow:
                                    entityType === 'document'
                                        ? '0 2px 6px rgba(16, 185, 129, 0.25)'
                                        : '0 2px 6px rgba(59, 130, 246, 0.25)',
                            }}
                        >
                            {entityType === 'document' ? (
                                <FileTextOutlined style={{ fontSize: 14 }} />
                            ) : (
                                <FolderOpenOutlined style={{ fontSize: 14 }} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div
                                className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                                style={{ color: 'var(--text-slate-400)' }}
                            >
                                {entityType === 'document' ? 'Document' : 'Document hub'}
                            </div>
                            <div
                                className="text-[13.5px] font-semibold truncate mt-0.5"
                                style={{ color: 'var(--text-slate-900)' }}
                            >
                                {entityTitle || 'Untitled'}
                            </div>
                        </div>
                        <div
                            className="inline-flex items-center gap-1.5 px-2 py-[3px] rounded-full text-[11px] font-medium"
                            style={{
                                background:
                                    visibility === 'public'
                                        ? 'var(--bg-green-50)'
                                        : 'var(--bg-slate-50)',
                                color:
                                    visibility === 'public'
                                        ? 'var(--text-holiday)'
                                        : 'var(--text-slate-600)',
                            }}
                        >
                            {visibility === 'public' ? (
                                <GlobalOutlined style={{ fontSize: 10 }} />
                            ) : (
                                <LockOutlined style={{ fontSize: 10 }} />
                            )}
                            {visibility === 'public' ? 'Public' : 'Private'}
                        </div>
                    </div>

                    {/* Visibility selector */}
                    <div>
                        <div
                            className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-2"
                            style={{ color: 'var(--text-slate-400)' }}
                        >
                            Who can access
                        </div>
                        <div className="flex flex-col gap-2">
                            {visibilityOptions.map((option) => {
                                const isActive = visibility === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            !isUpdating && handleVisibilityChange(option.value)
                                        }
                                        disabled={isUpdating}
                                        className="relative w-full text-left transition-all"
                                        style={{
                                            padding: '12px 14px',
                                            borderRadius: 12,
                                            border: isActive
                                                ? `1.5px solid ${option.accent}`
                                                : '1px solid var(--border-slate-200)',
                                            background: isActive
                                                ? `${option.accent}0F` // ~6% tint
                                                : 'var(--bg-pure-white)',
                                            cursor: isUpdating ? 'not-allowed' : 'pointer',
                                            boxShadow: isActive
                                                ? `0 2px 12px ${option.shadow}`
                                                : 'none',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (isUpdating || isActive) return;
                                            e.currentTarget.style.background = 'var(--bg-slate-50)';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (isActive) return;
                                            e.currentTarget.style.background = 'var(--bg-pure-white)';
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex items-center justify-center shrink-0 text-white"
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: 10,
                                                    background: option.gradient,
                                                    boxShadow: `0 2px 6px ${option.shadow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
                                                }}
                                            >
                                                {option.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="text-[13.5px] font-semibold"
                                                    style={{
                                                        color: isActive
                                                            ? 'var(--text-slate-900)'
                                                            : 'var(--text-slate-700)',
                                                    }}
                                                >
                                                    {option.label}
                                                </div>
                                                <div
                                                    className="text-[11.5px] mt-0.5"
                                                    style={{ color: 'var(--text-slate-400)' }}
                                                >
                                                    {option.description}
                                                </div>
                                            </div>
                                            <div
                                                className="flex items-center justify-center shrink-0 rounded-full"
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    border: `2px solid ${isActive
                                                            ? option.accent
                                                            : 'var(--border-slate-200)'
                                                        }`,
                                                    background: 'var(--bg-pure-white)',
                                                }}
                                            >
                                                {isActive && (
                                                    <div
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: 999,
                                                            background: option.accent,
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Public share link */}
                    {visibility === 'public' && shareToken && (
                        <div
                            className="rounded-xl p-3.5"
                            style={{
                                background: 'var(--bg-blue-50)',
                                border: '1px solid var(--border-blue-200)',
                            }}
                        >
                            <div className="flex items-center justify-between mb-2.5">
                                <div
                                    className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold"
                                    style={{ color: 'var(--text-blue-700)' }}
                                >
                                    <LinkOutlined style={{ fontSize: 11 }} />
                                    Shareable link
                                </div>
                                <span
                                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded-full"
                                    style={{
                                        background: 'var(--bg-green-50)',
                                        color: 'var(--text-holiday)',
                                    }}
                                >
                                    <span
                                        className="w-1.5 h-1.5 rounded-full"
                                        style={{ background: 'var(--text-holiday)' }}
                                    />
                                    Live
                                </span>
                            </div>
                            <div className="flex items-stretch gap-2">
                                <Input
                                    readOnly
                                    value={getShareUrl()}
                                    onFocus={(e) => e.currentTarget.select()}
                                    style={{
                                        borderRadius: 10,
                                        fontSize: 12,
                                        fontFamily:
                                            'ui-monospace, SFMono-Regular, Menlo, monospace',
                                        background: 'var(--bg-pure-white)',
                                        color: 'var(--text-slate-700)',
                                    }}
                                />
                                <Tooltip title={copied ? 'Copied' : 'Copy link'}>
                                    <Button
                                        type="primary"
                                        icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                                        onClick={handleCopyLink}
                                        style={{
                                            height: 36,
                                            width: 44,
                                            borderRadius: 10,
                                            border: 'none',
                                            background: copied
                                                ? 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)'
                                                : 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                                            boxShadow: copied
                                                ? '0 2px 6px rgba(16, 185, 129, 0.32)'
                                                : '0 2px 6px rgba(59, 130, 246, 0.32)',
                                        }}
                                    />
                                </Tooltip>
                            </div>
                            <div
                                className="mt-2 text-[11px]"
                                style={{ color: 'var(--text-slate-600)' }}
                            >
                                Anyone with this link can view this {entityType}.
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-3 flex items-center justify-between"
                    style={{
                        borderTop: '1px solid var(--border-slate-200)',
                        background: 'var(--bg-secondary)',
                    }}
                >
                    {visibility !== 'private' ? (
                        <Button
                            danger
                            type="text"
                            size="small"
                            onClick={handleRevokeShare}
                            loading={isUpdating}
                            style={{ fontWeight: 500, height: 32 }}
                        >
                            Revoke access
                        </Button>
                    ) : (
                        <span
                            className="text-[11.5px]"
                            style={{ color: 'var(--text-slate-400)' }}
                        >
                            Set to public to generate a link.
                        </span>
                    )}
                    <Button
                        type="primary"
                        onClick={onClose}
                        style={{
                            borderRadius: 9,
                            height: 34,
                            paddingInline: 18,
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                            border: 'none',
                            boxShadow:
                                '0 4px 12px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
                        }}
                    >
                        Done
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default ShareModal;
