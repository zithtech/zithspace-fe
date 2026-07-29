'use client';

import React, { useMemo, useState } from 'react';
import { Avatar, Tooltip, Modal, Empty, Skeleton, message } from 'antd';
import {
    EyeOutlined,
    UndoOutlined,
    DeleteOutlined,
    UserOutlined,
    HistoryOutlined,
} from '@ant-design/icons';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import ConfirmDialog from './ConfirmDialog';

interface HistoryEntry {
    id: string;
    createdAt: string;
    createdBy: {
        id: string;
        name: string;
        workEmail: string;
        avatarUrl?: string;
    };
    content: any;
}

interface DocumentHistoryProps {
    history: HistoryEntry[];
    isLoading: boolean;
    /** Open the version in preview mode in the editor. */
    onSelectVersion: (entry: HistoryEntry) => void;
    /** Restore the version directly (skip the preview step). */
    onRestoreVersion?: (entry: HistoryEntry) => void;
    /** Permanently delete a version from history. */
    onDeleteVersion?: (entry: HistoryEntry) => void;
    canRestore?: boolean;
    canDelete?: boolean;
}

const dayBucket = (iso: string): string => {
    const d = new Date(iso);
    if (isToday(d)) return 'Today';
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d, yyyy');
};

/** Cheap "size" estimator for the version: counts blocks. */
const blockCount = (content: any): number => {
    if (!content) return 0;
    if (Array.isArray(content)) return content.length;
    return 0;
};

const DocumentHistory: React.FC<DocumentHistoryProps> = ({
    history,
    isLoading,
    onSelectVersion,
    onRestoreVersion,
    onDeleteVersion,
    canRestore = true,
    canDelete = true,
}) => {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();

    // History comes back newest-first from the server. The first entry is the
    // current/live version.
    const grouped = useMemo(() => {
        const sorted = [...history].sort(
            (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const buckets: { label: string; entries: HistoryEntry[] }[] = [];
        for (const entry of sorted) {
            const label = dayBucket(entry.createdAt);
            const last = buckets[buckets.length - 1];
            if (last && last.label === label) last.entries.push(entry);
            else buckets.push({ label, entries: [entry] });
        }
        return { sorted, buckets };
    }, [history]);

    const latestId = grouped.sorted[0]?.id;

    const confirmRestore = (entry: HistoryEntry) => {
        modal.confirm({
            title: 'Restore this version?',
            content:
                'The current page will be replaced with this version. Your live content will be saved as a new history entry first.',
            okText: 'Restore',
            cancelText: 'Cancel',
            onOk: () => onRestoreVersion?.(entry),
        });
    };

    if (isLoading) {
        return (
            <div className="px-4 py-3 flex flex-col gap-3">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-xl p-3"
                        style={{
                            border: '1px solid var(--border-slate-200)',
                            background: 'var(--bg-pure-white)',
                        }}
                    >
                        <Skeleton avatar active paragraph={{ rows: 1 }} />
                    </div>
                ))}
            </div>
        );
    }

    if (!history || history.length === 0) {
        return (
            <div
                className="m-4 rounded-2xl py-10"
                style={{
                    border: '1px dashed var(--border-slate-200)',
                    background: 'var(--bg-pure-white)',
                }}
            >
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span style={{ color: 'var(--text-slate-400)', fontSize: 13 }}>
                            No history yet — saving the document creates a new version each time.
                        </span>
                    }
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            {contextHolder}
            {modalContextHolder}

            {/* Header */}
            <div
                className="px-4 py-3 flex items-center gap-2.5"
                style={{ borderBottom: '1px solid var(--border-slate-200)' }}
            >
                <div
                    className="flex items-center justify-center rounded-lg"
                    style={{
                        width: 30,
                        height: 30,
                        background: 'var(--bg-blue-50)',
                        color: 'var(--text-blue-700)',
                    }}
                >
                    <HistoryOutlined style={{ fontSize: 14 }} />
                </div>
                <div className="flex flex-col">
                    <span
                        className="text-[14px] font-semibold tracking-tight"
                        style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.01em' }}
                    >
                        Version history
                    </span>
                    <span
                        className="text-[11.5px]"
                        style={{ color: 'var(--text-slate-400)' }}
                    >
                        {history.length} {history.length === 1 ? 'version' : 'versions'} saved
                    </span>
                </div>
            </div>

            {/* Body */}
            <div className="px-3 py-3 flex flex-col gap-4">
                {grouped.buckets.map((bucket) => (
                    <div key={bucket.label}>
                        {/* Day header */}
                        <div
                            className="px-2 mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
                            style={{ color: 'var(--text-slate-400)' }}
                        >
                            {bucket.label}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            {bucket.entries.map((entry) => {
                                const isLatest = entry.id === latestId;
                                const isHovered = hoveredId === entry.id;
                                const blocks = blockCount(entry.content);
                                return (
                                    <div
                                        key={entry.id}
                                        onMouseEnter={() => setHoveredId(entry.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                        className="relative rounded-xl px-3 py-2.5 cursor-pointer transition-all"
                                        style={{
                                            border: '1px solid var(--border-slate-200)',
                                            background: isHovered
                                                ? 'var(--bg-slate-50)'
                                                : 'var(--bg-pure-white)',
                                        }}
                                        onClick={() => onSelectVersion(entry)}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <Avatar
                                                size={28}
                                                src={entry.createdBy?.avatarUrl}
                                                icon={<UserOutlined />}
                                                style={{
                                                    backgroundColor: 'var(--bg-blue-50)',
                                                    color: 'var(--text-blue-700)',
                                                    fontSize: 12,
                                                }}
                                            >
                                                {entry.createdBy?.name?.charAt(0).toUpperCase()}
                                            </Avatar>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span
                                                        className="text-[12.5px] font-semibold truncate"
                                                        style={{ color: 'var(--text-slate-900)' }}
                                                    >
                                                        {entry.createdBy?.name || 'Unknown'}
                                                    </span>
                                                    {isLatest && (
                                                        <span
                                                            className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-[1px] rounded"
                                                            style={{
                                                                background: 'var(--bg-green-50)',
                                                                color: 'var(--text-holiday)',
                                                            }}
                                                        >
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <Tooltip
                                                    title={format(
                                                        new Date(entry.createdAt),
                                                        'EEEE, MMM d, yyyy h:mm:ss a',
                                                    )}
                                                    mouseEnterDelay={0.4}
                                                >
                                                    <div
                                                        className="text-[11px] mt-0.5"
                                                        style={{ color: 'var(--text-slate-400)' }}
                                                    >
                                                        {format(new Date(entry.createdAt), 'h:mm a')}
                                                        {' · '}
                                                        {formatDistanceToNow(new Date(entry.createdAt), {
                                                            addSuffix: true,
                                                        })}
                                                        {blocks > 0 && (
                                                            <>
                                                                {' · '}
                                                                {blocks} {blocks === 1 ? 'block' : 'blocks'}
                                                            </>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            </div>
                                        </div>

                                        {/* Action row — always visible. */}
                                        <div
                                            className="flex items-center gap-1 mt-2 pt-2"
                                            style={{
                                                borderTop: '1px solid var(--border-slate-200)',
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => onSelectVersion(entry)}
                                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                                                style={{
                                                    color: 'var(--text-slate-700)',
                                                    background: 'transparent',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = 'var(--bg-slate-100)';
                                                    e.currentTarget.style.color = 'var(--text-blue-700)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'transparent';
                                                    e.currentTarget.style.color = 'var(--text-slate-700)';
                                                }}
                                            >
                                                <EyeOutlined style={{ fontSize: 12 }} />
                                                Preview
                                            </button>
                                            {!isLatest && onRestoreVersion && canRestore && (
                                                <button
                                                    onClick={() => confirmRestore(entry)}
                                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11.5px] font-medium transition-colors"
                                                    style={{
                                                        color: 'var(--text-blue-700)',
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'var(--bg-blue-50)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    <UndoOutlined style={{ fontSize: 12 }} />
                                                    Restore
                                                </button>
                                            )}
                                            <div className="ml-auto" />
                                            {!isLatest && onDeleteVersion && canDelete && (
                                                <ConfirmDialog
                                                    tone="danger"
                                                    title="Delete this version?"
                                                    description="This will permanently remove this version from the history. The action cannot be undone."
                                                    confirmText="Delete"
                                                    onConfirm={async () => {
                                                        await Promise.resolve(onDeleteVersion(entry));
                                                    }}
                                                    placement="left"
                                                >
                                                    <button
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors"
                                                        style={{
                                                            color: 'var(--text-slate-400)',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = 'var(--bg-red-50)';
                                                            e.currentTarget.style.color = 'var(--text-leave)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = 'var(--text-slate-400)';
                                                        }}
                                                        aria-label="Delete version"
                                                    >
                                                        <DeleteOutlined style={{ fontSize: 12 }} />
                                                    </button>
                                                </ConfirmDialog>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DocumentHistory;
