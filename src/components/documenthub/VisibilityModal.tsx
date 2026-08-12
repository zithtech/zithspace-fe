'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Avatar, Select, message } from 'antd';
import {
    LockOutlined,
    UserOutlined,
    TeamOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import { documentHubService as DocumentHubService } from '@/services/documentHub';
import { MembersService } from '@/services/membersService';

interface VisibilityModalProps {
    open: boolean;
    onClose: () => void;
    hubId: string;
    hubName: string;
    /** Current sharedWith user IDs so we can pre-populate Team mode */
    currentSharedWith?: string[];
    onSuccess?: () => void;
}

type PrivateMode = 'myself' | 'team';

const VisibilityModal: React.FC<VisibilityModalProps> = ({
    open,
    onClose,
    hubId,
    hubName,
    currentSharedWith = [],
    onSuccess,
}) => {
    const [mode, setMode] = useState<PrivateMode>(
        currentSharedWith.length > 0 ? 'team' : 'myself',
    );
    const [sharedWith, setSharedWith] = useState<string[]>(currentSharedWith);
    const [users, setUsers] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setMode(currentSharedWith.length > 0 ? 'team' : 'myself');
            setSharedWith(currentSharedWith);
        }
    }, [open, currentSharedWith]);

    // Fetch member list once
    useEffect(() => {
        MembersService.getMembersForSelect()
            .then((data) => setUsers(data || []))
            .catch(console.error);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (mode === 'myself') {
                // Private — visible only to the creator (no sharedWith)
                await DocumentHubService.shareDocumentHub(hubId, 'private', []);
            } else {
                // Private — visible to selected team members
                await DocumentHubService.shareDocumentHub(hubId, 'private', sharedWith);
            }
            messageApi.success('Visibility updated');
            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(err);
            messageApi.error('Failed to update visibility');
        } finally {
            setIsSaving(false);
        }
    };

    const ModeCard = ({
        value,
        icon,
        title,
        description,
        accent,
    }: {
        value: PrivateMode;
        icon: React.ReactNode;
        title: string;
        description: string;
        accent: string;
    }) => {
        const isActive = mode === value;
        return (
            <button
                type="button"
                onClick={() => setMode(value)}
                style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: isActive ? `1.5px solid ${accent}` : '1px solid var(--border-slate-200)',
                    background: 'var(--bg-pure-white, #fff)',
                    cursor: 'pointer',
                    transition: 'all 0.18s',
                    boxShadow: isActive ? `0 2px 8px rgba(0,0,0,0.04)` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                }}
                onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-slate-50)';
                }}
                onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-pure-white)';
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: isActive ? accent : 'var(--bg-slate-100)',
                        color: isActive ? '#fff' : 'var(--text-slate-500)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        flexShrink: 0,
                        transition: 'all 0.18s',
                        boxShadow: isActive ? `0 3px 8px ${accent}44` : 'none',
                    }}
                >
                    {icon}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: isActive ? accent : 'var(--text-slate-800)',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {title}
                    </div>
                    <div
                        style={{
                            fontSize: 12,
                            color: 'var(--text-slate-400)',
                            marginTop: 2,
                            lineHeight: 1.4,
                        }}
                    >
                        {description}
                    </div>
                </div>

                {/* Radio indicator */}
                <div
                    style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${isActive ? accent : 'var(--border-slate-300)'}`,
                        background: 'var(--bg-pure-white)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.18s',
                    }}
                >
                    {isActive && (
                        <div
                            style={{
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                background: accent,
                            }}
                        />
                    )}
                </div>
            </button>
        );
    };

    const isSaveDisabled = isSaving || (mode === 'team' && sharedWith.length === 0);

    return (
        <>
            {contextHolder}
            <Modal
                open={open}
                onCancel={onClose}
                title={null}
                footer={null}
                closable={false}
                width={540}
                centered
                styles={{
                    mask: { backdropFilter: 'blur(4px)', background: 'rgba(0, 0, 0, 0.45)' },
                    content: { borderRadius: 16, padding: 0, overflow: 'hidden', background: 'var(--bg-pure-white, #fff)' },
                    body: { padding: 0 },
                }}
                destroyOnClose
            >
                <div
                    style={{
                        padding: '20px 24px 16px',
                        background: 'var(--bg-pure-white, #fff)',
                        borderBottom: '1px solid var(--border-slate-200)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 14,
                    }}
                >
                    {/* Lock icon */}
                    <div
                        style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: '#3B82F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 18,
                            flexShrink: 0,
                        }}
                    >
                        <LockOutlined />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 16,
                                fontWeight: 800,
                                color: 'var(--text-slate-900)',
                                letterSpacing: '-0.02em',
                            }}
                        >
                            Set visibility
                        </h2>
                        <p
                            style={{
                                margin: '3px 0 0',
                                fontSize: 12.5,
                                color: 'var(--text-slate-400)',
                                lineHeight: 1.45,
                            }}
                        >
                            Who can access{' '}
                            <strong style={{ color: 'var(--text-slate-600)' }}>
                                {hubName || 'this hub'}
                            </strong>
                            ?
                        </p>
                    </div>

                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-slate-400)',
                            fontSize: 14,
                            flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-slate-100)';
                            e.currentTarget.style.color = 'var(--text-slate-700)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = 'var(--text-slate-400)';
                        }}
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div
                    style={{
                        padding: '20px 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                    }}
                >
                    <ModeCard
                        value="myself"
                        icon={<UserOutlined />}
                        title="Myself"
                        description="Only you can view and access this Document Hub."
                        accent="#3B82F6"
                    />

                    <ModeCard
                        value="team"
                        icon={<TeamOutlined />}
                        title="Team"
                        description="Select specific team members who can access this Document Hub."
                        accent="#3B82F6"
                    />

                    {/* User selector — animated slide-in when Team is selected */}
                    <div
                        style={{
                            overflow: 'hidden',
                            maxHeight: mode === 'team' ? 400 : 0,
                            opacity: mode === 'team' ? 1 : 0,
                            transition: 'max-height 0.28s ease, opacity 0.2s ease',
                        }}
                    >
                        <div style={{ paddingTop: 4 }}>
                            <div
                                style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: 'var(--text-slate-400)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    marginBottom: 8,
                                }}
                            >
                                Select team members
                            </div>
                            <Select
                                mode="multiple"
                                placeholder="Search and select users…"
                                value={sharedWith}
                                onChange={(vals) => setSharedWith(vals)}
                                style={{ width: '100%' }}
                                options={users.map((u) => ({
                                    label: (
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                            }}
                                        >
                                            <Avatar
                                                src={u.avatarUrl}
                                                size="small"
                                                style={{ background: '#3b82f6', fontSize: 11 }}
                                            >
                                                {u.label?.[0]}
                                            </Avatar>
                                            <span style={{ fontSize: 13 }}>{u.label}</span>
                                        </div>
                                    ),
                                    value: u.value,
                                }))}
                                filterOption={(input, option) => {
                                    const u = users.find((u) => u.value === option?.value);
                                    return (u?.label || '')
                                        .toLowerCase()
                                        .includes(input.toLowerCase());
                                }}
                                maxTagCount={4}
                            />

                            {/* Selected Users List */}
                            {sharedWith.length > 0 && (
                                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div
                                        style={{
                                            fontSize: 11,
                                            fontWeight: 700,
                                            color: 'var(--text-slate-400)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            marginBottom: 4,
                                        }}
                                    >
                                        Selected Team Members
                                    </div>
                                    <div style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {sharedWith.map(userId => {
                                            const user = users.find(u => u.value === userId);
                                            if (!user) return null;
                                            return (
                                                <div key={user.value} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-slate-50)', borderRadius: 10, border: '1px solid var(--border-slate-200)' }}>
                                                    <Avatar src={user.avatarUrl} size="default" style={{ background: '#3b82f6', color: '#fff' }}>
                                                        {user.label?.[0]}
                                                    </Avatar>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-slate-800)' }}>{user.label}</div>
                                                        <div style={{ fontSize: 12, color: 'var(--text-slate-500)' }}>{user.position || user.role || 'Member'}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '12px 24px 16px',
                        borderTop: '1px solid var(--border-slate-200)',
                        background: 'var(--bg-pure-white, #fff)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 10,
                    }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        style={{
                            height: 36,
                            padding: '0 18px',
                            borderRadius: 9,
                            border: '1px solid var(--border-slate-200)',
                            background: 'var(--bg-pure-white)',
                            color: 'var(--text-slate-600)',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: isSaving ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaveDisabled}
                        style={{
                            height: 36,
                            padding: '0 20px',
                            borderRadius: 9,
                            border: 'none',
                            background: isSaveDisabled
                                ? 'var(--bg-slate-200)'
                                : '#3B82F6',
                            color: isSaveDisabled ? 'var(--text-slate-400)' : '#fff',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            boxShadow: isSaveDisabled
                                ? 'none'
                                : '0 2px 6px rgba(59,130,246,0.25)',
                        }}
                    >
                        {isSaving ? (
                            <>
                                <span
                                    style={{
                                        width: 14,
                                        height: 14,
                                        border: '2px solid rgba(255,255,255,0.4)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                        display: 'inline-block',
                                    }}
                                />
                                Saving…
                            </>
                        ) : (
                            <>
                                <CheckOutlined style={{ fontSize: 12 }} />
                                Apply
                            </>
                        )}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default VisibilityModal;
