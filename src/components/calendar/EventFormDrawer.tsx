
"use client";

import React, { useEffect, useState } from 'react';
import { Drawer, Modal, Form, Input, DatePicker, Checkbox, Space, Button, Divider, Select, Popconfirm, Typography, Radio, Row, Col, Alert, App } from 'antd';
import { SyncOutlined, VideoCameraOutlined, CalendarOutlined, ClockCircleOutlined, UserOutlined, TeamOutlined, TagOutlined, FileTextOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarService, CalendarEvent, CreateEventData, CalendarProvider } from '@/services/calendarService';
import { api } from '@/lib/axios';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

interface EventFormDrawerProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: any) => Promise<void>;
    onDelete?: (action?: number, occurrenceDate?: string) => Promise<void>;
    editEvent?: CalendarEvent | null;
    initialDate?: Dayjs;
    loading: boolean;
    error?: string | null;
}

export default function EventFormDrawer({
    open,
    onClose,
    onSave,
    onDelete,
    editEvent,
    initialDate,
    loading,
    error
}: EventFormDrawerProps) {
    const { modal, message } = App.useApp();
    const [form] = Form.useForm();
    const isAllDay = Form.useWatch('isAllDay', form);
    const isRecurring = Form.useWatch('isRecurring', form);
    const [isDeleting, setIsDeleting] = useState(false);
    const [users, setUsers] = useState<{ id: string, name: string, workEmail: string }[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [updateAction, setUpdateAction] = useState<number>(0);
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
    const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            setFetchingUsers(true);
            try {
                const data = await api.get<any[]>('/api/members/select');
                setUsers(data.map(u => ({ id: u.value, name: u.label, workEmail: u.email })));
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setFetchingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (open && editEvent) {
            setDeleteAction(0);
        }
    }, [open, editEvent]);

    useEffect(() => {
        if (open) {
            setIsDeleting(false);
            if (editEvent) {
                let parsedDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
                if (editEvent.isRecurring && editEvent.rrule) {
                    let ruleToParse: string | any[] = editEvent.rrule;
                    let safety = 0;
                    while (typeof ruleToParse === 'string' && (ruleToParse.trim().startsWith('{') || ruleToParse.trim().startsWith('[')) && safety < 10) {
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
                    recurringDays: parsedDays
                });
            } else {
                let start = initialDate ? initialDate : dayjs().hour(9).minute(0).second(0).millisecond(0);
                
                // If initialDate is at midnight (likely from MonthView or DatePicker), default to 9 AM
                if (initialDate && initialDate.hour() === 0 && initialDate.minute() === 0) {
                    start = initialDate.hour(9).minute(0);
                }
                
                // Only force to future if no initialDate was provided (i.e. clicking "Create Event" button)
                if (!initialDate && start.isBefore(dayjs())) {
                    start = dayjs().add(1, 'hour').startOf('hour');
                }
                
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
                    recurringDays: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
                });
            }
        }
    }, [open, editEvent, initialDate, form]);

    const handleSubmit = async () => {
        console.log("🟢 Submit clicked in EventFormDrawer");
        try {
            const values = await form.validateFields();
            const startTime = values.startTime.toISOString();
            const endTime = values.endTime.toISOString();
            const excludeId = editEvent?.id || editEvent?.externalId;

            console.log("🟢 Form validated, data:", { startTime, endTime, excludeId });

            const baseEventData = {
                title: values.title,
                description: values.description || '',
                location: values.location || '',
                startTime,
                endTime,
                isRecurring: values.isRecurring || false,
                isAllDay: values.isAllDay || false,
                calendar: values.calendar || 'Personal Calendar',
                sourceType: values.sourceType || 'Manual',
                attendees: values.attendees || [],
                generateMeeting: values.generateMeeting || false,
                recurringDays: values.recurringDays || []
            };

            const performSave = async (data: any) => {
                console.log("🚀 Starting performSave with data:", data);
                try {
                    if (editEvent?.isRecurring && !editEvent?.externalId?.includes('_occ_')) {
                        const eventDataWithProvider = {
                            ...data,
                            provider: editEvent.provider
                        };
                        setPendingUpdateData(eventDataWithProvider);
                        setShowUpdateConfirm(true);
                    } else if (editEvent) {
                        const eventDataWithProvider = {
                            ...data,
                            provider: editEvent.provider
                        };
                        console.log("🚀 Updating existing event");
                        await onSave(eventDataWithProvider);
                    } else {
                        console.log("🚀 Creating new event");
                        await onSave(data);
                    }
                } catch (saveError) {
                    console.error("❌ Save operation failed:", saveError);
                }
            };

            // --- COLLISION DETECTION ---
            let hasOverlap = false;
            try {
                console.log("🔍 Checking for overlaps...");
                const overlap = await CalendarService.checkOverlap(startTime, endTime, excludeId);
                console.log("🔍 Overlap check response:", overlap);
                
                if (overlap?.hasOverlap) {
                    hasOverlap = true;
                    console.log("⚠️ Conflict detected, blocking operation");
                    modal.error({
                        title: (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <SyncOutlined style={{ color: '#ef4444' }} />
                                <span style={{ fontWeight: 800, letterSpacing: '-0.01em' }}>Time Slot Occupied</span>
                            </div>
                        ),
                        content: (
                            <div style={{ marginTop: '12px' }}>
                                <Text style={{ color: '#64748b' }}>Double-booking is not allowed. The following event(s) are already scheduled during this time:</Text>
                                <div style={{ 
                                    marginTop: '16px', 
                                    background: '#fef2f2', 
                                    padding: '12px', 
                                    borderRadius: '12px',
                                    border: '1px solid #fee2e2'
                                }}>
                                    {overlap.overlaps?.slice(0, 2).map((o: any, idx: number) => (
                                        <div key={o.id} style={{ marginBottom: idx === 0 && (overlap.count || 0) > 1 ? '12px' : 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '4px', height: '14px', borderRadius: '2px', background: '#ef4444' }} />
                                                <Text strong style={{ fontSize: '14px', color: '#991b1b' }}>{o.title}</Text>
                                            </div>
                                            <div style={{ paddingLeft: '12px', marginTop: '2px' }}>
                                                <Text type="secondary" style={{ fontSize: '12px', color: '#b91c1c' }}>
                                                    {dayjs(o.startTime).format('hh:mm A')} - {dayjs(o.endTime).format('hh:mm A')}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                    {(overlap.count || 0) > 2 && (
                                        <div style={{ marginTop: '8px', textAlign: 'center' }}>
                                            <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic', color: '#b91c1c' }}>
                                                + {overlap.count - 2} more conflicts
                                            </Text>
                                        </div>
                                    )}
                                </div>
                                <Text style={{ marginTop: '20px', display: 'block', fontWeight: 600, color: '#1e293b' }}>
                                    Please select a different time slot to proceed.
                                </Text>
                            </div>
                        ),
                        okText: 'Got it',
                        okButtonProps: { 
                            type: 'primary', 
                            danger: true,
                            style: { borderRadius: '8px', height: '36px', fontWeight: 600 } 
                        },
                        width: 400,
                        centered: true
                    });
                }
            } catch (overlapError) {
                console.error('❌ Overlap check call failed:', overlapError);
                // Fall back to normal save if check fails
            }

            if (!hasOverlap) {
                console.log("✅ No conflict found, proceeding to save immediately");
                await performSave(baseEventData);
            }

        } catch (error) {
            console.error('❌ Form validation failed or check threw an unhandled error:', error);
        }
    };

    const handleConfirmUpdate = async () => {
        if (pendingUpdateData) {
            try {
                setConfirmLoading(true);
                const finalData = {
                    ...pendingUpdateData,
                    action: updateAction,
                    occurrenceDate: editEvent?.occurrenceDate
                };
                await onSave(finalData);
                setShowUpdateConfirm(false);
                setPendingUpdateData(null);
            } catch (error) {
                console.error('Update failed:', error);
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
                if (!editEvent.isRecurring) {
                    finalAction = undefined;
                }
                await onDelete(finalAction, editEvent.startTime);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const [deleteAction, setDeleteAction] = useState<number>(0);

    const deleteContent = (
        <div style={{ padding: '12px 0' }}>
            <Radio.Group onChange={(e) => setDeleteAction(e.target.value)} value={deleteAction}>
                <Space direction="vertical" size="middle">
                    <Radio value={0}>
                        <Text strong>Delete for one day</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginLeft: '24px' }}>
                            Only this occurrence will be removed
                        </Text>
                    </Radio>
                    <Radio value={2}>
                        <Text strong>Delete for all days</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginLeft: '24px' }}>
                            The entire recurring series will be removed
                        </Text>
                    </Radio>
                </Space>
            </Radio.Group>
        </div>
    );

    const updateContent = (
        <div style={{ padding: '12px 0' }}>
            <Radio.Group onChange={(e) => setUpdateAction(e.target.value)} value={updateAction}>
                <Space direction="vertical" size="middle">
                    <Radio value={0}>
                        <Text strong>Update this event only</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginLeft: '24px' }}>
                            Only this occurrence will be updated
                        </Text>
                    </Radio>
                    <Radio value={2}>
                        <Text strong>Update all events</Text>
                        <Text type="secondary" style={{ display: 'block', fontSize: '12px', marginLeft: '24px' }}>
                            The entire recurring series will be updated
                        </Text>
                    </Radio>
                </Space>
            </Radio.Group>
        </div>
    );

    return (
        <>
            <Drawer
                title={null}
                open={open}
                onClose={onClose}
                width={500}
                closable={false}
                maskClosable={!loading}
                styles={{
                    body: { padding: 0 },
                    mask: { backdropFilter: 'blur(6px)' }
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            background: '#eff6ff',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)'
                        }}>
                            <CalendarOutlined style={{ color: '#3b82f6', fontSize: '20px' }} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
                                {editEvent ? "Edit Event" : "New Event"}
                            </Title>
                            <Text style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                                {editEvent ? "Modify your event details" : "Schedule a new calendar entry"}
                            </Text>
                        </div>
                    </div>
                    <Button
                        type="text"
                        onClick={onClose}
                        icon={<span style={{ fontSize: '18px', color: '#94a3b8' }}>✕</span>}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    />
                </div>

                {/* Form Content */}
                <div style={{ padding: '24px' }}>
                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            style={{ marginBottom: '24px', borderRadius: '12px' }}
                        />
                    )}
                    <Form
                        form={form}
                        layout="vertical"
                        requiredMark={false}
                    >
                        {/* Section: Basic Details */}
                        <div style={{ marginBottom: '24px' }}>
                            <Form.Item
                                name="title"
                                rules={[{ required: true, message: 'Please enter event title' }]}
                                style={{ marginBottom: '16px' }}
                            >
                                <Input
                                    placeholder="Event title"
                                    style={{
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '16px',
                                        fontWeight: 600,
                                        color: '#1e293b',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}
                                />
                            </Form.Item>

                            <Form.Item name="description" style={{ marginBottom: 0 }}>
                                <TextArea
                                    placeholder="Add description and notes..."
                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                    style={{
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        border: '1px solid #e2e8f0',
                                        fontSize: '14px',
                                        color: '#475569',
                                        background: '#fafafa'
                                    }}
                                />
                            </Form.Item>
                        </div>

                        {/* Section: Time & Schedule */}
                        <div style={{ 
                            padding: '20px', 
                            background: '#f8fafc', 
                            borderRadius: '16px', 
                            border: '1px solid #f1f5f9',
                            marginBottom: '24px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <ClockCircleOutlined style={{ color: '#3b82f6' }} />
                                <Text strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schedule</Text>
                            </div>

                            <Row gutter={12} style={{ marginBottom: '16px' }}>
                                <Col span={12}>
                                    <Form.Item
                                        label={<Text style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>STARTS</Text>}
                                        name="startTime"
                                        rules={[{ required: true, message: 'Start required' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <DatePicker
                                            showTime={{ format: 'hh:mm A', use12Hours: true }}
                                            format="DD MMM YYYY, hh:mm A"
                                            onChange={(date) => {
                                                if (date) {
                                                    const currentEnd = form.getFieldValue('endTime');
                                                    // By default, assume 1 hour duration if they change start time and we want to keep it reasonable
                                                    // This prevents accidentally creating 12-hour or multi-day events
                                                    form.setFieldsValue({ endTime: date.add(1, 'hour') });
                                                }
                                            }}
                                            style={{
                                                width: '100%',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                border: '1px solid #e2e8f0',
                                                height: '42px',
                                                background: '#fff'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={<Text style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>ENDS</Text>}
                                        name="endTime"
                                        rules={[{ required: true, message: 'End required' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <DatePicker
                                            showTime={{ format: 'hh:mm A', use12Hours: true }}
                                            format="DD MMM YYYY, hh:mm A"
                                            style={{
                                                width: '100%',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                border: '1px solid #e2e8f0',
                                                height: '42px',
                                                background: '#fff'
                                            }}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <Form.Item name="isAllDay" valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Checkbox>
                                        <Text style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>All Day</Text>
                                    </Checkbox>
                                </Form.Item>
                                <Form.Item name="isRecurring" valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Checkbox>
                                        <Text style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Repeat Series</Text>
                                    </Checkbox>
                                </Form.Item>
                                <Form.Item name="generateMeeting" valuePropName="checked" style={{ marginBottom: 0 }}>
                                    <Checkbox>
                                        <Space size={4}>
                                            <VideoCameraOutlined style={{ color: '#3b82f6' }} />
                                            <Text style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Video Meeting</Text>
                                        </Space>
                                    </Checkbox>
                                </Form.Item>
                            </div>
                        </div>

                        {/* Recurring Days Selection */}
                        {isRecurring && (
                            <div style={{
                                marginBottom: '24px',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #f5f3ff 0%, #fcfaff 100%)',
                                borderRadius: '16px',
                                border: '1px solid #ddd6fe'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <SyncOutlined spin style={{ color: '#7c3aed', fontSize: '12px' }} />
                                    <Text strong style={{ fontSize: '11px', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recurrence Pattern</Text>
                                </div>
                                <Form.Item name="recurringDays" style={{ marginBottom: 0 }}>
                                    <Checkbox.Group style={{ width: '100%' }}>
                                        <Row justify="space-between" align="middle">
                                            {[
                                                { label: 'SUN', value: 'SU' },
                                                { label: 'MON', value: 'MO' },
                                                { label: 'TUE', value: 'TU' },
                                                { label: 'WED', value: 'WE' },
                                                { label: 'THU', value: 'TH' },
                                                { label: 'FRI', value: 'FR' },
                                                { label: 'SAT', value: 'SA' }
                                            ].map(day => (
                                                <Checkbox 
                                                    key={day.value} 
                                                    value={day.value} 
                                                    className="custom-day-checkbox"
                                                >
                                                    <div style={{ 
                                                        width: '42px', 
                                                        height: '36px', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        borderRadius: '10px',
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                                    }}>
                                                        {day.label}
                                                    </div>
                                                </Checkbox>
                                            ))}
                                        </Row>
                                    </Checkbox.Group>
                                </Form.Item>
                            </div>
                        )}

                        {/* Section: Collaboration & Context */}
                        <div style={{ 
                            padding: '20px', 
                            background: '#f8fafc', 
                            borderRadius: '16px', 
                            border: '1px solid #f1f5f9',
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '16px' 
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TeamOutlined style={{ color: '#3b82f6' }} />
                                <Text strong style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collaboration</Text>
                            </div>

                            <Form.Item 
                                label={<Text style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>LOCATION</Text>}
                                name="location" 
                                style={{ marginBottom: 0 }}
                            >
                                <Input
                                    placeholder="Add location or physical address"
                                    prefix={<EnvironmentOutlined style={{ color: '#94a3b8' }} />}
                                    style={{
                                        borderRadius: '10px',
                                        padding: '8px 12px',
                                        border: '1px solid #e2e8f0',
                                        height: '42px',
                                        background: '#fff'
                                    }}
                                />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item 
                                        label={<Text style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>CALENDAR</Text>}
                                        name="calendar" 
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select style={{ height: '42px' }} className="custom-select">
                                            <Option value="Personal Calendar">Personal Calendar</Option>
                                            <Option value="Team Calendar">Team Calendar</Option>
                                            <Option value="Company Holidays">Company Holidays</Option>
                                            <Option value="Approved Leaves">Approved Leaves</Option>
                                            <Option value="Project Milestones">Project Milestones</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        label={<Text style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>SOURCE TYPE</Text>}
                                        name="sourceType" 
                                        style={{ marginBottom: 0 }}
                                    >
                                        <Select style={{ height: '42px' }} className="custom-select">
                                            <Option value="Manual">Manual</Option>
                                            <Option value="Project">Project</Option>
                                            <Option value="Tickets">Tickets</Option>
                                            <Option value="Leave">Leave</Option>
                                            <Option value="Attendance">Attendance</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item 
                                label={<Text style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8' }}>INVITE ATTENDEES</Text>}
                                name="attendees" 
                                style={{ marginBottom: 0 }}
                            >
                                <Select
                                    mode="multiple"
                                    placeholder="Invite members..."
                                    className="custom-select"
                                    suffixIcon={<UserOutlined style={{ color: '#94a3b8' }} />}
                                >
                                    {users.map(user => (
                                        <Option key={user.id} value={user.workEmail} label={user.name}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{
                                                    width: '24px',
                                                    height: '24px',
                                                    background: '#f1f5f9',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    color: '#475569'
                                                }}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <Text style={{ fontSize: '13px', fontWeight: 500 }}>{user.name}</Text>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </div>
                    </Form>
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '16px 24px 24px',
                    borderTop: '1px solid #f1f5f9',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10
                }}>
                    <div>
                        {editEvent && (
                            <Popconfirm
                                title={`Delete ${editEvent.isRecurring ? 'Series' : 'Event'}`}
                                description={editEvent.isRecurring ? deleteContent : "Remove this event permanently?"}
                                onConfirm={() => handleDelete(editEvent.isRecurring ? deleteAction : undefined)}
                                okText="Delete"
                                okButtonProps={{ danger: true, loading: isDeleting }}
                            >
                                <Button 
                                    danger 
                                    type="text"
                                    style={{ 
                                        fontWeight: 600, 
                                        borderRadius: '8px',
                                        color: '#ef4444'
                                    }}
                                >
                                    Delete Event
                                </Button>
                            </Popconfirm>
                        )}
                    </div>
                    <Space size={12}>
                        <Button
                            onClick={onClose}
                            style={{
                                borderRadius: '10px',
                                height: '40px',
                                padding: '0 20px',
                                fontWeight: 600,
                                border: '1px solid #e2e8f0',
                                color: '#64748b'
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleSubmit}
                            loading={loading}
                            style={{
                                borderRadius: '10px',
                                height: '40px',
                                padding: '0 24px',
                                fontWeight: 700,
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                                background: '#3b82f6',
                                border: 'none'
                            }}
                        >
                            {editEvent ? "Save Changes" : "Create Event"}
                        </Button>
                    </Space>
                </div>

                <style jsx global>{`
                    .custom-select .ant-select-selector {
                        border-radius: 12px !important;
                        border: 1px solid #e2e8f0 !important;
                        padding: 4px 12px !important;
                    }
                    .custom-day-checkbox .ant-checkbox {
                        display: none;
                    }
                    .custom-day-checkbox span:not(.ant-checkbox) {
                        padding: 0 !important;
                    }
                    .ant-checkbox-wrapper-checked.custom-day-checkbox div {
                        background: #3b82f6 !important;
                        color: #fff !important;
                    }
                    .custom-day-checkbox div {
                        background: #f1f5f9;
                        color: #64748b;
                        transition: all 0.2s;
                    }
                `}</style>
            </Drawer>

            <Modal
                title="Update Recurring Event"
                open={showUpdateConfirm}
                onCancel={() => setShowUpdateConfirm(false)}
                onOk={handleConfirmUpdate}
                okText="Update"
                cancelText="Cancel"
                width={400}
                centered
                confirmLoading={confirmLoading}
            >
                {updateContent}
            </Modal>
        </>
    );
}
