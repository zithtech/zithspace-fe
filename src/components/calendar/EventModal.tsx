"use client";

import React, { useEffect, useState } from 'react';
import {
    Modal, Form, Input, DatePicker, Checkbox, Space, Button, Select, Popconfirm, Typography, Radio, Row, Col, Alert,
} from 'antd';
import {
    VideoCameraOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    UserOutlined,
    EnvironmentOutlined,
    CloseOutlined,
    EditOutlined,
    PlusOutlined,
    InfoCircleOutlined,
    AlignLeftOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent } from '@/services/calendarService';
import { api } from '@/lib/axios';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

interface EventModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    onDelete?: (action?: number, occurrenceDate?: string) => Promise<void>;
    editEvent?: CalendarEvent | null;
    initialDate?: Dayjs;
    loading: boolean;
    error?: string | null;
}

const DAYS_OF_WEEK = [
    { label: 'S', value: 'SU', full: 'Sunday' },
    { label: 'M', value: 'MO', full: 'Monday' },
    { label: 'T', value: 'TU', full: 'Tuesday' },
    { label: 'W', value: 'WE', full: 'Wednesday' },
    { label: 'T', value: 'TH', full: 'Thursday' },
    { label: 'F', value: 'FR', full: 'Friday' },
    { label: 'S', value: 'SA', full: 'Saturday' },
];

const CALENDAR_OPTIONS = [
    { value: 'Personal Calendar', label: 'Personal Calendar', dot: '#6366F1' },
    { value: 'Team Calendar', label: 'Team Calendar', dot: '#A855F7' },
    { value: 'Company Holidays', label: 'Company Holidays', dot: '#F87171' },
    { value: 'Approved Leaves', label: 'Approved Leaves', dot: '#34D399' },
    { value: 'Project Milestones', label: 'Project Milestones', dot: '#38BDF8' },
];

const SOURCE_OPTIONS = [
    { value: 'Manual', label: 'Manual', emoji: '✍️' },
    { value: 'Tickets', label: 'Tickets', emoji: '🎫' },
    { value: 'Project', label: 'Project', emoji: '📊' },
    { value: 'Leave', label: 'Leave', emoji: '🌴' },
    { value: 'Attendance', label: 'Attendance', emoji: '⏱️' },
];

export default function EventModal({
    open,
    onClose,
    onSave,
    onDelete,
    editEvent,
    initialDate,
    loading,
    error,
}: EventModalProps) {
    const [form] = Form.useForm();
    const isAllDay = Form.useWatch('isAllDay', form);
    const isRecurring = Form.useWatch('isRecurring', form);
    const generateMeeting = Form.useWatch('generateMeeting', form);
    const recurringDays = Form.useWatch('recurringDays', form) || [];

    const [isDeleting, setIsDeleting] = useState(false);
    const [users, setUsers] = useState<{ id: string; name: string; workEmail: string }[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [updateAction, setUpdateAction] = useState<number>(0);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
    const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [deleteAction, setDeleteAction] = useState<number>(0);

    useEffect(() => {
        const fetchUsers = async () => {
            setFetchingUsers(true);
            try {
                const data = await api.get<any[]>('/api/members/select');
                setUsers(data.map(u => ({ id: u.value, name: u.label, workEmail: u.email })));
            } catch (err) {
                console.error('Failed to fetch users:', err);
            } finally {
                setFetchingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (open && editEvent) setDeleteAction(0);
    }, [open, editEvent]);

    useEffect(() => {
        if (open) {
            setIsDeleting(false);
            if (editEvent) {
                let parsedDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
                if (editEvent.isRecurring && editEvent.rrule) {
                    let ruleToParse: string | any[] = editEvent.rrule;
                    let safety = 0;
                    while (
                        typeof ruleToParse === 'string' &&
                        (ruleToParse.trim().startsWith('{') || ruleToParse.trim().startsWith('[')) &&
                        safety < 10
                    ) {
                        try {
                            const parsed = JSON.parse(ruleToParse);
                            if (parsed && typeof parsed === 'object' && parsed.originalRrule) {
                                ruleToParse = parsed.originalRrule;
                            } else if (typeof parsed === 'string' || Array.isArray(parsed)) {
                                ruleToParse = parsed;
                            } else {
                                break;
                            }
                        } catch (e) {
                            break;
                        }
                        safety++;
                    }
                    const ruleString = Array.isArray(ruleToParse) ? ruleToParse.join(' ') : String(ruleToParse);
                    const match = ruleString.match(/BYDAY=([^;\]\"\s]+)/);
                    if (match && match[1]) {
                        const rawDays = match[1].replace(/[^A-Z,]/g, '');
                        parsedDays = rawDays.split(',').filter(d => d.length > 0);
                    }
                }

                form.setFieldsValue({
                    title: editEvent.title,
                    description: editEvent.description,
                    location: editEvent.location,
                    startTime: dayjs(editEvent.startTime),
                    endTime: dayjs(editEvent.endTime),
                    isAllDay: !!editEvent.isAllDay,
                    isRecurring: !!editEvent.isRecurring,
                    calendar: editEvent.calendar || 'Personal Calendar',
                    sourceType: editEvent.sourceType || 'Manual',
                    attendees: (editEvent.attendees as string[]) || [],
                    generateMeeting: !!editEvent.meetingLink,
                    recurringDays: parsedDays,
                });
            } else {
                let start = initialDate ? initialDate.hour(9).minute(0) : dayjs().hour(9).minute(0);
                if (start.isBefore(dayjs())) start = dayjs().add(1, 'hour').startOf('hour');
                const end = start.add(1, 'hour');
                form.setFieldsValue({
                    title: '',
                    description: '',
                    location: '',
                    startTime: start,
                    endTime: end,
                    isAllDay: false,
                    isRecurring: false,
                    calendar: 'Personal Calendar',
                    sourceType: 'Manual',
                    attendees: [],
                    generateMeeting: false,
                    recurringDays: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
                });
            }
        }
    }, [open, editEvent, initialDate, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const baseEventData = {
                title: values.title,
                description: values.description || '',
                location: values.location || '',
                startTime: values.startTime.toISOString(),
                endTime: values.endTime.toISOString(),
                isRecurring: values.isRecurring || false,
                isAllDay: values.isAllDay || false,
                calendar: values.calendar || 'Personal Calendar',
                sourceType: values.sourceType || 'Manual',
                attendees: values.attendees || [],
                generateMeeting: values.generateMeeting || false,
                recurringDays: values.recurringDays || [],
            };

            if (editEvent?.isRecurring && !editEvent?.externalId?.includes('_occ_')) {
                setPendingUpdateData({ ...baseEventData, provider: editEvent.provider });
                setShowUpdateConfirm(true);
                return;
            } else if (editEvent) {
                await onSave({ ...baseEventData, provider: editEvent.provider });
            } else {
                await onSave(baseEventData);
            }
        } catch (err) {
            console.error('Validation failed:', err);
        }
    };

    const handleConfirmUpdate = async () => {
        if (pendingUpdateData) {
            try {
                setConfirmLoading(true);
                const finalData = {
                    ...pendingUpdateData,
                    action: updateAction,
                    occurrenceDate: editEvent?.occurrenceDate,
                };
                await onSave(finalData);
                setShowUpdateConfirm(false);
                setPendingUpdateData(null);
            } catch (err) {
                console.error('Update failed:', err);
            } finally {
                setConfirmLoading(false);
            }
        }
    };

    const handleDelete = async (action?: number) => {
        if (onDelete && editEvent) {
            setIsDeleting(true);
            try {
                let finalAction: number | undefined = action !== undefined ? action : deleteAction;
                if (!editEvent.isRecurring) finalAction = undefined;
                await onDelete(finalAction, editEvent.startTime);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const toggleRecurringDay = (value: string) => {
        const current: string[] = form.getFieldValue('recurringDays') || [];
        const next = current.includes(value)
            ? current.filter(d => d !== value)
            : [...current, value];
        form.setFieldsValue({ recurringDays: next });
    };

    const deleteContent = (
        <div style={{ padding: '8px 0', minWidth: 260 }}>
            <Radio.Group onChange={(e) => setDeleteAction(e.target.value)} value={deleteAction}>
                <Space direction="vertical" size="middle">
                    <Radio value={0}>
                        <Text strong>Delete this event only</Text>
                        <div style={{ fontSize: 12, color: 'var(--cal-text-muted)', marginLeft: 24 }}>
                            Only this occurrence will be removed
                        </div>
                    </Radio>
                    <Radio value={2}>
                        <Text strong>Delete all events</Text>
                        <div style={{ fontSize: 12, color: 'var(--cal-text-muted)', marginLeft: 24 }}>
                            The entire recurring series will be removed
                        </div>
                    </Radio>
                </Space>
            </Radio.Group>
        </div>
    );

    const updateContent = (
        <div style={{ padding: '4px 0' }}>
            <Radio.Group onChange={(e) => setUpdateAction(e.target.value)} value={updateAction}>
                <Space direction="vertical" size="middle">
                    <Radio value={0}>
                        <Text strong>Update this event only</Text>
                        <div style={{ fontSize: 12, color: 'var(--cal-text-muted)', marginLeft: 24 }}>
                            Only this occurrence will be updated
                        </div>
                    </Radio>
                    <Radio value={2}>
                        <Text strong>Update all events</Text>
                        <div style={{ fontSize: 12, color: 'var(--cal-text-muted)', marginLeft: 24 }}>
                            The entire recurring series will be updated
                        </div>
                    </Radio>
                </Space>
            </Radio.Group>
        </div>
    );

    return (
        <>
            <Modal
                className="cal-event-modal"
                title={null}
                open={open}
                onCancel={onClose}
                footer={null}
                width={640}
                centered
                closable={false}
                styles={{
                    body: { padding: 0, background: 'var(--cal-surface)' },
                    mask: { backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.45)' },
                }}
            >
                {/* Hero header with gradient */}
                <div
                    style={{
                        position: 'relative',
                        padding: '22px 24px 20px',
                        background: editEvent
                            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.10) 0%, rgba(99, 102, 241, 0.10) 100%)'
                            : 'linear-gradient(135deg, rgba(99, 102, 241, 0.10) 0%, rgba(56, 189, 248, 0.10) 100%)',
                        borderBottom: '1px solid var(--cal-border)',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        aria-hidden
                        style={{
                            position: 'absolute',
                            top: -40,
                            right: -40,
                            width: 160,
                            height: 160,
                            borderRadius: '50%',
                            background: editEvent
                                ? 'radial-gradient(circle, rgba(168, 85, 247, 0.18), transparent 70%)'
                                : 'radial-gradient(circle, rgba(99, 102, 241, 0.18), transparent 70%)',
                            pointerEvents: 'none',
                        }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: editEvent
                                        ? 'linear-gradient(135deg, #A855F7 0%, #6366F1 100%)'
                                        : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 8px 16px -4px rgba(79, 70, 229, 0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                                }}
                            >
                                {editEvent ? (
                                    <EditOutlined style={{ color: '#FFFFFF', fontSize: 20 }} />
                                ) : (
                                    <PlusOutlined style={{ color: '#FFFFFF', fontSize: 20 }} />
                                )}
                            </div>
                            <div>
                                <div style={{
                                    margin: 0,
                                    fontSize: 17,
                                    fontWeight: 700,
                                    color: 'var(--cal-text-strong)',
                                    letterSpacing: '-0.01em',
                                }}>
                                    {editEvent ? 'Edit event' : 'Create new event'}
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--cal-text-muted)', marginTop: 2 }}>
                                    {editEvent ? 'Update the details below to keep your team in sync' : 'Schedule something delightful — fill in the details below'}
                                </div>
                            </div>
                        </div>
                        <Button
                            type="text"
                            onClick={onClose}
                            icon={<CloseOutlined />}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                color: 'var(--cal-text-muted)',
                            }}
                        />
                    </div>
                </div>

                {/* Form body */}
                <div style={{ padding: '20px 24px 8px', maxHeight: '70vh', overflowY: 'auto' }}>
                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            closable
                            style={{ marginBottom: 16, borderRadius: 10 }}
                        />
                    )}

                    <Form form={form} layout="vertical" requiredMark={false}>
                        {/* Title — large input */}
                        <Form.Item
                            name="title"
                            rules={[{ required: true, message: 'Please enter an event title' }]}
                            style={{ marginBottom: 14 }}
                        >
                            <Input
                                placeholder="Add a title…"
                                style={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    height: 48,
                                    padding: '8px 14px',
                                    borderRadius: 12,
                                    background: 'transparent',
                                    color: 'var(--cal-text-strong)',
                                }}
                            />
                        </Form.Item>

                        {/* Quick-toggle pill row */}
                        <div
                            style={{
                                display: 'flex',
                                gap: 8,
                                marginBottom: 16,
                                flexWrap: 'wrap',
                            }}
                        >
                            <TogglePill
                                name="isAllDay"
                                form={form}
                                active={!!isAllDay}
                                icon={<CalendarOutlined />}
                                label="All day"
                            />
                            <TogglePill
                                name="isRecurring"
                                form={form}
                                active={!!isRecurring}
                                icon={<ClockCircleOutlined />}
                                label="Repeats"
                            />
                            <TogglePill
                                name="generateMeeting"
                                form={form}
                                active={!!generateMeeting}
                                icon={<VideoCameraOutlined />}
                                label="Add meeting link"
                                accent="#10B981"
                            />
                        </div>

                        {/* Hidden fields holding actual values */}
                        <Form.Item name="isAllDay" valuePropName="checked" hidden><Checkbox /></Form.Item>
                        <Form.Item name="isRecurring" valuePropName="checked" hidden><Checkbox /></Form.Item>
                        <Form.Item name="generateMeeting" valuePropName="checked" hidden><Checkbox /></Form.Item>

                        {/* Recurring day chips */}
                        {isRecurring && (
                            <div
                                style={{
                                    marginBottom: 16,
                                    padding: '12px 14px',
                                    background: 'var(--cal-brand-soft)',
                                    border: '1px solid var(--cal-brand-soft-border)',
                                    borderRadius: 12,
                                }}
                            >
                                <div style={{
                                    fontSize: 11,
                                    color: 'var(--cal-text-muted)',
                                    fontWeight: 700,
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                    marginBottom: 10,
                                }}>
                                    Repeats on
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {DAYS_OF_WEEK.map((day) => {
                                        const checked = recurringDays.includes(day.value);
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                title={day.full}
                                                onClick={() => toggleRecurringDay(day.value)}
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: '50%',
                                                    border: checked
                                                        ? '1px solid var(--cal-brand)'
                                                        : '1px solid var(--cal-border)',
                                                    background: checked ? 'var(--cal-brand)' : 'var(--cal-surface)',
                                                    color: checked ? '#FFFFFF' : 'var(--cal-text-muted)',
                                                    fontWeight: 700,
                                                    fontSize: 13,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    boxShadow: checked
                                                        ? '0 2px 6px -1px rgba(79, 70, 229, 0.45)'
                                                        : 'none',
                                                }}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <Form.Item name="recurringDays" hidden><Input /></Form.Item>
                            </div>
                        )}

                        {/* Date & time card */}
                        <div
                            style={{
                                background: 'var(--cal-surface-2)',
                                border: '1px solid var(--cal-border)',
                                borderRadius: 12,
                                padding: 12,
                                marginBottom: 16,
                            }}
                        >
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item
                                        label="Starts"
                                        name="startTime"
                                        rules={[{ required: true, message: 'Select start time' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <DatePicker
                                            showTime={!isAllDay ? { format: 'HH:mm' } : false}
                                            format={isAllDay ? 'DD MMM YYYY' : 'DD MMM YYYY · h:mm A'}
                                            style={{ width: '100%', borderRadius: 10, height: 40 }}
                                            placeholder="Select date"
                                            suffixIcon={<ClockCircleOutlined style={{ color: 'var(--cal-text-faint)' }} />}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label="Ends"
                                        name="endTime"
                                        rules={[{ required: true, message: 'Select end time' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <DatePicker
                                            showTime={!isAllDay ? { format: 'HH:mm' } : false}
                                            format={isAllDay ? 'DD MMM YYYY' : 'DD MMM YYYY · h:mm A'}
                                            style={{ width: '100%', borderRadius: 10, height: 40 }}
                                            placeholder="Select date"
                                            suffixIcon={<ClockCircleOutlined style={{ color: 'var(--cal-text-faint)' }} />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* Description */}
                        <Form.Item
                            name="description"
                            label={<FieldLabel icon={<AlignLeftOutlined />} text="Description" />}
                            style={{ marginBottom: 14 }}
                        >
                            <TextArea
                                placeholder="Add description, agenda, or notes…"
                                autoSize={{ minRows: 2, maxRows: 5 }}
                                style={{ borderRadius: 10, padding: '10px 12px', fontSize: 13.5 }}
                            />
                        </Form.Item>

                        {/* Location */}
                        <Form.Item
                            name="location"
                            label={<FieldLabel icon={<EnvironmentOutlined />} text="Location" />}
                            style={{ marginBottom: 14 }}
                        >
                            <Input
                                placeholder="Add location or address"
                                style={{ borderRadius: 10, height: 40, fontSize: 13.5 }}
                            />
                        </Form.Item>

                        {/* Calendar + Source */}
                        <Row gutter={12} style={{ marginBottom: 14 }}>
                            <Col span={12}>
                                <Form.Item
                                    name="calendar"
                                    label={<FieldLabel icon={<CalendarOutlined />} text="Calendar" />}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Select
                                        style={{ height: 40 }}
                                        placeholder="Select calendar"
                                        optionLabelProp="label"
                                    >
                                        {CALENDAR_OPTIONS.map(c => (
                                            <Option key={c.value} value={c.value} label={c.label}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        background: c.dot,
                                                    }} />
                                                    {c.label}
                                                </span>
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="sourceType"
                                    label={<FieldLabel icon={<InfoCircleOutlined />} text="Source" />}
                                    style={{ marginBottom: 0 }}
                                >
                                    <Select style={{ height: 40 }} placeholder="Source type">
                                        {SOURCE_OPTIONS.map(s => (
                                            <Option key={s.value} value={s.value}>
                                                <span style={{ marginRight: 6 }}>{s.emoji}</span>
                                                {s.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Attendees */}
                        <Form.Item
                            name="attendees"
                            label={<FieldLabel icon={<UserOutlined />} text="Attendees" />}
                            style={{ marginBottom: 4 }}
                        >
                            <Select
                                mode="multiple"
                                placeholder="Add team members…"
                                loading={fetchingUsers}
                                optionLabelProp="label"
                                style={{ minHeight: 40 }}
                                maxTagCount="responsive"
                            >
                                {users.map(user => (
                                    <Option key={user.id} value={user.workEmail} label={user.name}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 0' }}>
                                            <span style={{
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                                                color: '#FFFFFF',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                flexShrink: 0,
                                            }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--cal-text)' }}>
                                                    {user.name}
                                                </div>
                                                <div style={{ fontSize: 11, color: 'var(--cal-text-muted)' }}>
                                                    {user.workEmail}
                                                </div>
                                            </div>
                                        </div>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Form>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '14px 24px',
                        borderTop: '1px solid var(--cal-border)',
                        background: 'var(--cal-surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <Space size={8}>
                        {editEvent && (
                            editEvent.isRecurring ? (
                                <Popconfirm
                                    title="Delete recurring event"
                                    description={deleteContent}
                                    onConfirm={() => handleDelete(deleteAction)}
                                    okText="Delete"
                                    cancelText="Cancel"
                                    okButtonProps={{ danger: true, loading: isDeleting }}
                                >
                                    <Button
                                        danger
                                        style={{ borderRadius: 9, height: 38, fontWeight: 500 }}
                                        disabled={loading && !isDeleting}
                                    >
                                        Delete
                                    </Button>
                                </Popconfirm>
                            ) : (
                                <Popconfirm
                                    title="Delete event"
                                    description="Are you sure you want to delete this event?"
                                    onConfirm={() => handleDelete()}
                                    okText="Delete"
                                    cancelText="Cancel"
                                    okButtonProps={{ danger: true, loading: isDeleting }}
                                >
                                    <Button
                                        danger
                                        style={{ borderRadius: 9, height: 38, fontWeight: 500 }}
                                        disabled={loading && !isDeleting}
                                    >
                                        Delete
                                    </Button>
                                </Popconfirm>
                            )
                        )}
                        {editEvent?.meetingLink && (
                            <Button
                                type="primary"
                                icon={<VideoCameraOutlined />}
                                onClick={() => editEvent.meetingLink && window.open(editEvent.meetingLink, '_blank')}
                                style={{
                                    borderRadius: 9,
                                    height: 38,
                                    fontWeight: 600,
                                    background: '#10B981',
                                    borderColor: '#10B981',
                                    boxShadow: '0 4px 10px -3px rgba(16, 185, 129, 0.5)',
                                }}
                            >
                                Join meeting
                            </Button>
                        )}
                    </Space>
                    <Space size={8}>
                        <Button
                            onClick={onClose}
                            disabled={isDeleting || (loading && !showUpdateConfirm)}
                            style={{ borderRadius: 9, height: 38, fontWeight: 500, padding: '0 16px' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={loading && !isDeleting && !showUpdateConfirm}
                            disabled={isDeleting || showUpdateConfirm}
                            style={{
                                minWidth: 130,
                                borderRadius: 9,
                                height: 38,
                                fontWeight: 600,
                                background: 'var(--cal-brand)',
                                borderColor: 'var(--cal-brand)',
                                boxShadow: '0 4px 10px -3px rgba(79, 70, 229, 0.5)',
                            }}
                        >
                            {editEvent ? 'Save changes' : 'Create event'}
                        </Button>
                    </Space>
                </div>
            </Modal>

            {/* Update confirmation */}
            <Modal
                className="cal-event-modal"
                title="Update recurring event"
                open={showUpdateConfirm}
                onCancel={() => setShowUpdateConfirm(false)}
                onOk={handleConfirmUpdate}
                okText="Update"
                cancelText="Cancel"
                width={420}
                centered
                confirmLoading={confirmLoading}
                okButtonProps={{
                    style: {
                        background: 'var(--cal-brand)',
                        borderColor: 'var(--cal-brand)',
                        borderRadius: 8,
                        fontWeight: 600,
                    },
                }}
            >
                {updateContent}
            </Modal>
        </>
    );
}

function FieldLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--cal-text-secondary)',
            letterSpacing: '0.01em',
        }}>
            <span style={{ color: 'var(--cal-text-faint)' }}>{icon}</span>
            {text}
        </span>
    );
}

function TogglePill({
    name,
    form,
    active,
    icon,
    label,
    accent,
}: {
    name: string;
    form: any;
    active: boolean;
    icon: React.ReactNode;
    label: string;
    accent?: string;
}) {
    const activeColor = accent || 'var(--cal-brand)';
    return (
        <button
            type="button"
            onClick={() => form.setFieldsValue({ [name]: !active })}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: 999,
                border: active ? `1px solid ${activeColor}` : '1px solid var(--cal-border)',
                background: active
                    ? (accent ? 'rgba(16, 185, 129, 0.10)' : 'var(--cal-brand-soft)')
                    : 'var(--cal-surface)',
                color: active ? activeColor : 'var(--cal-text-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                height: 36,
            }}
        >
            <span style={{ fontSize: 13, display: 'inline-flex' }}>{icon}</span>
            {label}
        </button>
    );
}
