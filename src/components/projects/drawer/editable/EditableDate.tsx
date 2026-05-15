import React, { useState, useEffect, useRef } from 'react';
import { DatePicker, Typography, Spin } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface EditableDateProps {
    value: string | undefined | null; // ISO string
    onSave: (value: string | null) => Promise<void>;
    placeholder?: string;
    label?: string;
    emptyText?: string;
    format?: string;
    disabled?: boolean;
}

export const EditableDate: React.FC<EditableDateProps> = ({
    value,
    onSave,
    placeholder,
    label,
    emptyText = 'Set date',
    format = 'MMM D, YYYY',
    disabled = false
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const pickerRef = useRef<any>(null);

    useEffect(() => {
        if (isEditing && pickerRef.current) {
            pickerRef.current.focus();
        }
    }, [isEditing]);

    const handleChange = async (date: dayjs.Dayjs | null) => {
        try {
            setLoading(true);
            await onSave(date ? date.toISOString() : null);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save date", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Only close if not currently saving
        if (!loading) {
            setIsEditing(false);
        }
    };

    const hasValue = !!value;
    const displayValue = value ? dayjs(value).format(format) : '';

    if (isEditing) {
        return (
            <DatePicker
                ref={pickerRef}
                value={value ? dayjs(value) : null}
                onChange={handleChange}
                onOpenChange={(open) => {
                    // Close the picker when calendar dropdown closes
                    if (!open && !loading) {
                        setIsEditing(false);
                    }
                }}
                style={{ width: '100%' }}
                placeholder={placeholder}
                open={true}
                allowClear
            />
        );
    }

    return (
        <div
            onClick={() => !loading && !disabled && setIsEditing(true)}
            style={{
                cursor: disabled ? 'default' : 'pointer',
                padding: '4px 8px',
                margin: '-4px -8px',
                borderRadius: '4px',
                minHeight: '28px',
                display: 'flex',
                alignItems: 'center',
                transition: 'background 0.2s',
                backgroundColor: 'var(--bg-secondary)', // Theme-aware background
            }}
            className="editable-field-hover"
            title={label || placeholder}
        >
            {hasValue ? (
                <Text style={{ color: 'var(--text-primary)' }}>{displayValue}</Text>
            ) : (
                <Text style={{ color: '#bfbfbf', fontSize: '13px' }}>{placeholder || emptyText}</Text>
            )}

            {loading && <Spin size="small" style={{ marginLeft: 8 }} />}
            {!loading && !disabled && <EditOutlined style={{ marginLeft: 8, opacity: 0, transition: 'opacity 0.2s' }} className="edit-icon" />}

            <style jsx global>{`
        .editable-field-hover:hover .edit-icon {
          opacity: 0.5 !important;
        }
      `}</style>
        </div>
    );
};
