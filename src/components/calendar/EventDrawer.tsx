"use client";

import React, { useState, useEffect } from 'react';
import { Drawer, Button, Space, Typography, Divider, Tag, Popconfirm, Radio } from 'antd';
import { 
    ClockCircleOutlined, 
    EnvironmentOutlined, 
    TeamOutlined, 
    CalendarOutlined, 
    VideoCameraOutlined,
    EditOutlined,
    DeleteOutlined,
    GlobalOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { CalendarEvent } from '@/services/calendarService';

const { Title, Text, Paragraph } = Typography;

interface EventDrawerProps {
    open: boolean;
    onClose: () => void;
    event: CalendarEvent | null;
    onEdit: (event: CalendarEvent) => void;
    onDelete: (event: CalendarEvent) => void;
    loading?: boolean;
}

export default function EventDrawer({
    open,
    onClose,
    event,
    onEdit,
    onDelete,
    loading
}: EventDrawerProps) {
    const [deleteAction, setDeleteAction] = useState<number>(0);

    useEffect(() => {
        if (open) {
            setDeleteAction(0);
        }
    }, [open]);

    if (!event) return null;

    const startTime = dayjs(event.startTime);
    const endTime = dayjs(event.endTime);
    const isMultiDay = !startTime.isSame(endTime, 'day');

    return (
        <Drawer
            title={null}
            placement="right"
            onClose={onClose}
            open={open}
            width={450}
            closable={false}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                    <Popconfirm
                        title="Delete Event"
                        description={event.isRecurring ? (
                            <div style={{ padding: '12px 0' }}>
                                <Radio.Group onChange={(e) => setDeleteAction(e.target.value)} value={deleteAction}>
                                    <Space direction="vertical" size="middle">
                                        <Radio value={0}>
                                            <Text strong style={{ color: 'var(--cal-text-strong)' }}>Delete for one day</Text>
                                            <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginLeft: '24px', color: 'var(--cal-text-muted)' }}>
                                                Only this occurrence will be removed
                                            </Text>
                                        </Radio>
                                        <Radio value={2}>
                                            <Text strong style={{ color: 'var(--cal-text-strong)' }}>Delete for all days</Text>
                                            <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginLeft: '24px', color: 'var(--cal-text-muted)' }}>
                                                The entire recurring series will be removed
                                            </Text>
                                        </Radio>
                                    </Space>
                                </Radio.Group>
                            </div>
                        ) : "Are you sure you want to delete this event?"}
                        onConfirm={() => {
                            if (event.isRecurring) {
                                // If recurring, pass the selected action
                                (onDelete as any)(event, deleteAction);
                            } else {
                                onDelete(event);
                            }
                        }}
                        okText="Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                    >
                        <Button 
                            danger 
                            type="text" 
                            icon={<DeleteOutlined />}
                            style={{ fontWeight: 600, borderRadius: '8px' }}
                        >
                            Delete
                        </Button>
                    </Popconfirm>
                    <Space size={12}>
                        <Button onClick={onClose} style={{ borderRadius: '10px', fontWeight: 600, height: '38px', padding: '0 20px' }}>
                            Close
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<EditOutlined />} 
                            onClick={() => onEdit(event)}
                            style={{ 
                                borderRadius: '10px', 
                                fontWeight: 700, 
                                background: 'var(--cal-brand)', 
                                border: 'none',
                                height: '38px', 
                                padding: '0 20px',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' 
                            }}
                        >
                            Edit Event
                        </Button>
                    </Space>
                </div>
            }
            styles={{
                body: { padding: 0, background: 'var(--cal-surface)' },
                footer: { borderTop: '1px solid var(--cal-border)', padding: '16px 24px', background: 'var(--cal-surface)' },
                mask: { backdropFilter: 'blur(6px)' }
            }}
        >
            {/* Header with Date Badge */}
            <div style={{ 
                padding: '24px', 
                background: 'var(--cal-surface)',
                borderBottom: '1px solid var(--cal-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{
                    width: '52px',
                    height: '52px',
                    background: '#3b82f6',
                    color: '#fff',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}>
                    <Text style={{ color: '#fff', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>{startTime.format('MMM')}</Text>
                    <Text style={{ color: '#fff', fontSize: '20px', fontWeight: 800, lineHeight: 1.1 }}>{startTime.format('DD')}</Text>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Tag color="blue" style={{ margin: 0, borderRadius: '4px', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700, border: 'none', background: 'var(--cal-brand-soft)', color: 'var(--cal-brand)' }}>
                            {event.calendar || 'Personal'}
                        </Tag>
                        {event.isRecurring && (
                            <Tag color="purple" style={{ margin: 0, borderRadius: '4px', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700, border: 'none', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                                Recurring
                            </Tag>
                        )}
                    </div>
                    <Title level={4} style={{ margin: 0, fontWeight: 700, color: 'var(--cal-text-strong)', fontSize: '18px' }}>
                        {event.title}
                    </Title>
                </div>
                <Button 
                    type="text" 
                    icon={<span style={{ color: '#94a3b8', fontSize: '18px' }}>✕</span>} 
                    onClick={onClose}
                    style={{ borderRadius: '8px' }}
                />
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Time & Schedule */}
                <div style={{ 
                    padding: '16px', 
                    background: 'var(--cal-surface-2)', 
                    borderRadius: '16px', 
                    border: '1px solid var(--cal-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                        <div style={{ marginTop: '4px', color: '#3b82f6' }}><ClockCircleOutlined /></div>
                        <div>
                            <Text strong style={{ display: 'block', color: 'var(--cal-text-strong)', fontSize: '15px' }}>
                                {startTime.format('dddd, MMMM D')}
                            </Text>
                            <Text style={{ color: 'var(--cal-text-muted)', fontSize: '13px' }}>
                                {event.isAllDay ? 'All Day' : `${startTime.format('hh:mm A')} – ${endTime.format('hh:mm A')}`}
                                {isMultiDay && <Text type="secondary" style={{ fontSize: '11px', marginLeft: '4px', color: 'var(--cal-text-faint)' }}>({endTime.format('MMM D')})</Text>}
                            </Text>
                        </div>
                    </div>

                    {event.location && (
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', paddingTop: '12px', borderTop: '1px dotted #e2e8f0' }}>
                            <div style={{ marginTop: '4px', color: 'var(--cal-text-muted)' }}><EnvironmentOutlined /></div>
                            <div>
                                <Text strong style={{ display: 'block', color: 'var(--cal-text-strong)', fontSize: '14px' }}>Location</Text>
                                <Text style={{ color: 'var(--cal-text-muted)', fontSize: '13px' }}>{event.location}</Text>
                            </div>
                        </div>
                    )}
                </div>

                {/* Meeting Section */}
                {event.meetingLink && (
                    <div style={{ 
                        padding: '20px', 
                        background: 'var(--cal-success-bg)', 
                        borderRadius: '16px', 
                        border: '1px solid var(--cal-success-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--cal-surface)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <VideoCameraOutlined style={{ color: 'var(--cal-success-text)' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <Text strong style={{ color: 'var(--cal-success-text)', display: 'block', fontSize: '14px' }}>Online Meeting</Text>
                                <Text style={{ color: 'var(--cal-success-text)', fontSize: '12px', opacity: 0.8 }}>Secure video link generated</Text>
                            </div>
                        </div>
                        <Button 
                            type="primary" 
                            href={event.meetingLink} 
                            target="_blank"
                            icon={<GlobalOutlined />}
                            style={{ 
                                background: 'var(--cal-success-text)', 
                                border: 'none', 
                                borderRadius: '10px', 
                                fontWeight: 700,
                                height: '40px',
                                boxShadow: '0 4px 12px rgba(16, 163, 74, 0.2)' 
                            }}
                        >
                            Join Video Call
                        </Button>
                    </div>
                )}

                {/* Description */}
                {event.description && (
                    <div style={{ padding: '0 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ width: '2px', height: '14px', background: 'var(--cal-border)', borderRadius: '1px' }} />
                            <Text strong style={{ color: 'var(--cal-text-strong)', fontSize: '13px' }}>DESCRIPTION</Text>
                        </div>
                        <Paragraph style={{ color: 'var(--cal-text-secondary)', whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: 1.6 }}>
                            {event.description}
                        </Paragraph>
                    </div>
                )}

                {/* Attendees */}
                {event.attendees && event.attendees.length > 0 && (
                    <div style={{ padding: '0 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <div style={{ width: '2px', height: '14px', background: 'var(--cal-border)', borderRadius: '1px' }} />
                            <Text strong style={{ color: 'var(--cal-text-strong)', fontSize: '13px' }}>ATTENDEES ({event.attendees.length})</Text>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {(event.attendees as string[]).map((email, index) => (
                                <div key={index} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px',
                                    padding: '8px 12px',
                                    background: 'var(--cal-surface-3)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--cal-border-soft)' 
                                }}>
                                    <div style={{ 
                                        width: '28px', 
                                        height: '28px', 
                                        borderRadius: '10px', 
                                        background: `hsl(${index * 45}, 70%, 95%)`, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '11px',
                                        fontWeight: 800,
                                        color: `hsl(${index * 45}, 70%, 45%)`
                                    }}>
                                        {email.charAt(0).toUpperCase()}
                                    </div>
                                    <Text style={{ fontSize: '13px', color: 'var(--cal-text-secondary)', fontWeight: 500 }}>{email}</Text>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Drawer>
    );
}
