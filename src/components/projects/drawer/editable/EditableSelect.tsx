import React, { useState, useEffect, useRef } from 'react';
import { Select, Typography, Spin, Tag, Space, Avatar } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Option {
    label: string;
    value: string;
    color?: string; // For Tags
    avatar?: string; // For Users
    description?: string;
}

interface EditableSelectProps {
    value: string | undefined;
    onSave: (value: string) => Promise<void>;
    options: Option[];
    placeholder?: string;
    label?: string;
    mode?: 'tag' | 'user' | 'text' | 'dot'; // Display mode
    emptyText?: string;
    plain?: boolean; // If true, removes default hover background and padding
    textStyle?: React.CSSProperties;
}

export const EditableSelect: React.FC<EditableSelectProps> = ({
    value,
    onSave,
    options,
    placeholder,
    label,
    mode = 'text',
    emptyText = 'Select...',
    plain = false,
    textStyle,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const selectRef = useRef<any>(null);

    useEffect(() => {
        if (isEditing && selectRef.current) {
            selectRef.current.focus();
        }
    }, [isEditing]);

    const handleChange = async (newValue: string) => {
        try {
            setLoading(true);
            await onSave(newValue);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save selection", error);
        } finally {
            setLoading(false);
        }
    };

    const normalize = (val: string | undefined) => val?.toLowerCase().replace(/ /g, '_');
    const selectedOption = options.find(opt => normalize(opt.value) === normalize(value));
    const hasValue = !!value;
    const internalValue = selectedOption ? selectedOption.value : value;

    if (isEditing) {
        return (
            <Select
                ref={selectRef}
                value={internalValue}
                onChange={handleChange}
                onBlur={() => setIsEditing(false)}
                style={{ width: '100%' }}
                placeholder={placeholder}
                loading={loading}
                defaultOpen
                showSearch
                filterOption={(input, option) => {
                    // Filter by the searchLabel (plain text)
                    const searchLabel = option?.searchLabel || '';
                    return searchLabel.toLowerCase().includes(input.toLowerCase());
                }}
                options={options.map(opt => ({
                    value: opt.value,
                    searchLabel: opt.label, // Plain string for search
                    label: (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {opt.color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color }} />}
                            {opt.avatar && <Avatar size="small" style={{ width: 18, height: 18, fontSize: 10 }}>{opt.avatar}</Avatar>}
                            <span>{opt.label}</span>
                        </div>
                    )
                }))}
            />
        );
    }

    const renderValue = () => {
        if (!hasValue || !selectedOption) {
            return <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '13px' }}>{emptyText}</Text>;
        }

        if (mode === 'tag') {
            // Use Tag styling if color available, otherwise default
            return (
                <Tag color={selectedOption.color || 'default'} style={{ margin: 0 }}>
                    {selectedOption.label}
                </Tag>
            );
        }

        if (mode === 'dot') {
            const dotColorMap: Record<string, string> = {
                blue: '#3b82f6', cyan: '#06b6d4', geekblue: '#4f46e5',
                purple: '#8b5cf6', magenta: '#ec4899',
                green: '#10b981', lime: '#84cc16',
                gold: '#f59e0b', orange: '#f97316', volcano: '#ef4444', red: '#dc2626',
                default: '#94a3b8',
            };
            const c = selectedOption.color || 'default';
            const dotColor = c.startsWith('#') ? c : (dotColorMap[c] || dotColorMap.default);
            return (
                <Space size={6} align="center">
                    <span
                        style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: dotColor, display: 'inline-block',
                            boxShadow: `0 0 0 3px ${dotColor}1f`,
                            flexShrink: 0,
                        }}
                    />
                    <Text style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)' }}>
                        {selectedOption.label}
                    </Text>
                </Space>
            );
        }

        if (mode === 'user') {
            return (
                <Space size={4}>
                    <Avatar
                        size="small"
                        style={{ width: 20, height: 20, fontSize: 12, lineHeight: '20px', backgroundColor: '#1677ff' }}
                    >
                        {selectedOption.label.charAt(0)}
                    </Avatar>
                    <Text style={textStyle}>{selectedOption.label}</Text>
                </Space>
            );
        }

        return <Text style={textStyle}>{selectedOption.label}</Text>;
    };

    return (
        <div
            onClick={() => !loading && setIsEditing(true)}
            style={{
                cursor: 'pointer',
                padding: plain ? '0' : '4px 8px',
                margin: plain ? '0' : '-4px -8px',
                borderRadius: '4px',
                minHeight: plain ? 'auto' : '28px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s',
            }}
            className={plain ? "" : "editable-field-hover"}
            title={label || placeholder}
        >
            <div style={{ flex: 1 }}>{renderValue()}</div>
            {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
            {!loading && <EditOutlined style={{ marginLeft: 8, opacity: 0, transition: 'opacity 0.2s' }} className="edit-icon" />}

            <style jsx global>{`
        .editable-field-hover:hover {
          background-color: rgba(144, 144, 144, 0.08);
        }
        .editable-field-hover:hover .edit-icon {
          opacity: 0.5 !important;
        }
      `}</style>
        </div>
    );
};
