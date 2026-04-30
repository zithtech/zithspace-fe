import React, { useState, useEffect, useRef } from 'react';
import { Input, Typography, Spin } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface EditableFieldProps {
    value: string | number | undefined;
    onSave: (value: string | number) => Promise<void>;
    type?: 'text' | 'textarea' | 'number';
    placeholder?: string;
    label?: string; // For accessibility or tooltip
    textStyle?: React.CSSProperties;
    emptyText?: string;
    editIconVisibility?: 'hover' | 'always' | 'visible';
}

export const EditableField: React.FC<EditableFieldProps> = ({
    value,
    onSave,
    type = 'text',
    placeholder,
    label,
    textStyle,
    emptyText = 'Click to edit',
    editIconVisibility = 'hover',
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState<string | number>('');
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<any>(null);

    useEffect(() => {
        setCurrentValue(value !== undefined && value !== null ? value : '');
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (currentValue === value) {
            setIsEditing(false);
            return;
        }

        try {
            setLoading(true);
            await onSave(currentValue);
            setIsEditing(false);
        } catch (error) {
            // Error handling is usually done by parent or global message
            console.error("Failed to save field", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setCurrentValue(value !== undefined && value !== null ? value : '');
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && type !== 'textarea') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div style={{ position: 'relative', width: '100%' }}>
                {type === 'textarea' ? (
                    <Input.TextArea
                        ref={inputRef}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoSize={{ minRows: 2, maxRows: 6 }}
                        placeholder={placeholder}
                        disabled={loading}
                    />
                ) : (
                    <Input
                        ref={inputRef}
                        type={type === 'number' ? 'number' : 'text'}
                        value={currentValue}
                        onChange={(e) => setCurrentValue(type === 'number' ? Number(e.target.value) : e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={loading}
                        suffix={loading ? <Spin size="small" /> : null}
                    />
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4, gap: 4 }}>
                    <div
                        onClick={handleSave}
                        style={{ cursor: 'pointer', color: '#52c41a', fontSize: '12px', padding: '2px 6px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}
                    >
                        <CheckOutlined /> Save
                    </div>
                    <div
                        onClick={handleCancel}
                        style={{ cursor: 'pointer', color: '#ff4d4f', fontSize: '12px', padding: '2px 6px', background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: '4px' }}
                    >
                        <CloseOutlined />
                    </div>
                </div>
            </div>
        );
    }

    const hasValue = value !== undefined && value !== null && value !== '';

    return (
        <div
            onClick={() => setIsEditing(true)}
            style={{
                cursor: 'pointer',
                padding: '4px 8px',
                margin: '-4px -8px',
                borderRadius: '4px',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s',
                ...textStyle
            }}
            className="editable-field-hover"
            title={label || placeholder}
        >
            {hasValue ? (
                <Text style={{ width: '100%', ...textStyle }}>{value}</Text>
            ) : (
                <Text type="secondary" style={{ fontStyle: 'italic', fontSize: '13px' }}>
                    {emptyText}
                </Text>
            )}
            <EditOutlined
                style={{
                    marginLeft: 8,
                    opacity: editIconVisibility === 'always' || editIconVisibility === 'visible' ? 0.6 : 0,
                    transition: 'opacity 0.2s'
                }}
                className="edit-icon"
            />
            <style jsx global>{`
        .editable-field-hover:hover {
          background-color: rgba(144, 144, 144, 0.08);
        }
        .editable-field-hover:hover .edit-icon {
          opacity: 1 !important;
        }
      `}</style>
        </div>
    );
};
