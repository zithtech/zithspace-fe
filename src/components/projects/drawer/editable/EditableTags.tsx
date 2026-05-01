import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Input, Tag, Typography, Spin, Tooltip } from 'antd';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';

const { Text } = Typography;

interface EditableTagsProps {
    value?: string[];
    onSave: (next: string[]) => Promise<void>;
    placeholder?: string;
    emptyText?: string;
    maxTagLength?: number;
}

const TAG_PALETTE = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#4f46e5',
];

const colorForTag = (tag: string): string => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = (hash * 31 + tag.charCodeAt(i)) >>> 0;
    }
    return TAG_PALETTE[hash % TAG_PALETTE.length];
};

const normalize = (tags: string[]): string[] => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of tags) {
        const t = raw.trim();
        if (!t) continue;
        const key = t.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(t);
    }
    return out;
};

export const EditableTags: React.FC<EditableTagsProps> = ({
    value,
    onSave,
    placeholder = 'Add tag…',
    emptyText = 'No tags',
    maxTagLength = 32,
}) => {
    const tags = value ?? [];
    const [isAdding, setIsAdding] = useState(false);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<InputRef>(null);

    useEffect(() => {
        if (isAdding) inputRef.current?.focus();
    }, [isAdding]);

    const persist = async (next: string[]) => {
        const normalized = normalize(next);
        // Skip the round-trip when nothing actually changed.
        if (
            normalized.length === tags.length &&
            normalized.every((t, i) => t === tags[i])
        ) {
            return;
        }
        try {
            setLoading(true);
            await onSave(normalized);
        } catch (err) {
            console.error('Failed to save tags', err);
        } finally {
            setLoading(false);
        }
    };

    const commitDraft = async () => {
        const v = draft.trim();
        setDraft('');
        setIsAdding(false);
        if (!v) return;
        if (tags.some(t => t.toLowerCase() === v.toLowerCase())) return;
        await persist([...tags, v]);
    };

    const removeTag = async (tag: string) => {
        await persist(tags.filter(t => t !== tag));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commitDraft();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setDraft('');
            setIsAdding(false);
        } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
            e.preventDefault();
            removeTag(tags[tags.length - 1]);
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 4,
                width: '100%',
                minHeight: 24,
            }}
        >
            {tags.length === 0 && !isAdding && (
                <Text
                    type="secondary"
                    style={{ fontStyle: 'italic', fontSize: 13, marginRight: 4 }}
                >
                    {emptyText}
                </Text>
            )}

            {tags.map(tag => {
                const color = colorForTag(tag);
                return (
                    <Tag
                        key={tag}
                        bordered={false}
                        closable={!loading}
                        closeIcon={<CloseOutlined style={{ fontSize: 10 }} />}
                        onClose={(e) => {
                            e.preventDefault();
                            removeTag(tag);
                        }}
                        style={{
                            margin: 0,
                            padding: '1px 8px',
                            fontSize: 12,
                            fontWeight: 500,
                            borderRadius: 10,
                            background: `${color}1a`,
                            color,
                            border: `1px solid ${color}33`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            lineHeight: '18px',
                        }}
                    >
                        {tag}
                    </Tag>
                );
            })}

            {isAdding ? (
                <Input
                    ref={inputRef}
                    size="small"
                    value={draft}
                    placeholder={placeholder}
                    maxLength={maxTagLength}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commitDraft}
                    onKeyDown={handleKeyDown}
                    style={{
                        width: 110,
                        height: 22,
                        fontSize: 12,
                        borderRadius: 10,
                        padding: '0 8px',
                    }}
                />
            ) : (
                <Tooltip title="Add tag">
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={() => !loading && setIsAdding(true)}
                        onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                                e.preventDefault();
                                setIsAdding(true);
                            }
                        }}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '1px 8px',
                            fontSize: 12,
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            border: '1px dashed var(--border-color)',
                            borderRadius: 10,
                            background: 'transparent',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            lineHeight: '18px',
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        <PlusOutlined style={{ fontSize: 10 }} />
                        {tags.length === 0 ? 'Add' : ''}
                    </span>
                </Tooltip>
            )}

            {loading && <Spin size="small" style={{ marginLeft: 4 }} />}
        </div>
    );
};

export default EditableTags;
