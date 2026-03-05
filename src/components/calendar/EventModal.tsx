



"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Checkbox, Space, Button, Divider, Select, Popconfirm, Typography, Radio, Row, Col, Alert } from 'antd';
import { VideoCameraOutlined, CalendarOutlined, ClockCircleOutlined, UserOutlined, TeamOutlined, TagOutlined, FileTextOutlined, EnvironmentOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { CalendarEvent, CreateEventData, CalendarProvider } from '@/services/calendarService';
import { api } from '@/lib/axios';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

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

export default function EventModal({
    open,
    onClose,
    onSave,
    onDelete,
    editEvent,
    initialDate,
    loading,
    error
}: EventModalProps) {
    const [form] = Form.useForm();
    const isAllDay = Form.useWatch('isAllDay', form);
    const isRecurring = Form.useWatch('isRecurring', form);
    const [isDeleting, setIsDeleting] = useState(false);
    const [users, setUsers] = useState<{ id: string, name: string, workEmail: string }[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);
    const [updateAction, setUpdateAction] = useState<number>(0); // Default to "Update this event only"
    const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
    const [pendingUpdateData, setPendingUpdateData] = useState<any>(null);
    const [confirmLoading, setConfirmLoading] = useState(false); // Separate loading for confirmation modal


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
                    // Unroll JSON metadata if present (can be multiple layers due to legacy bugs)
                    let safety = 0;
                    // Recursive unwrap if it starts with { or [
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

                    // Extract BYDAY pattern
                    const ruleString = Array.isArray(ruleToParse) ? ruleToParse.join(' ') : String(ruleToParse);
                    const match = ruleString.match(/BYDAY=([^;\]\"\s]+)/);
                    if (match && match[1]) {
                        // Sanitize: strip any trailing garbage that isn't A-Z or comma
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
                let start = initialDate ? initialDate.hour(9).minute(0) : dayjs().hour(9).minute(0);
                if (start.isBefore(dayjs())) {
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
        try {
            const values = await form.validateFields();
            console.log("Form values:", values);

            // Create base event data
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
                recurringDays: values.recurringDays || []
            };

            // If editing a recurring event, show confirmation modal for recurring events
            if (editEvent?.isRecurring && !editEvent?.externalId?.includes('_occ_')) {
                const eventDataWithProvider = {
                    ...baseEventData,
                    provider: editEvent.provider
                };
                setPendingUpdateData(eventDataWithProvider);
                setShowUpdateConfirm(true);
                // Don't set loading state for recurring events - let confirmation modal handle it
                return;
            } else if (editEvent) {
                const eventDataWithProvider = {
                    ...baseEventData,
                    provider: editEvent.provider
                };
                console.log("Sending to onSave (with provider):", eventDataWithProvider);
                await onSave(eventDataWithProvider);
            } else {
                // For new events, send base data without provider
                console.log("Sending to onSave (no provider):", baseEventData);
                await onSave(baseEventData);
            }
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleConfirmUpdate = async () => {
        if (pendingUpdateData) {
            try {
                setConfirmLoading(true); // Set confirmation loading
                // Add action and occurrenceDate for backend handling
                const finalData = {
                    ...pendingUpdateData,
                    action: updateAction,
                    occurrenceDate: editEvent?.occurrenceDate
                };
                console.log("Confirmed update:", finalData);
                await onSave(finalData);
                setShowUpdateConfirm(false);
                setPendingUpdateData(null);
            } catch (error) {
                console.error('Update failed:', error);
            } finally {
                setConfirmLoading(false); // Reset confirmation loading
            }
        }
    };


    const handleDelete = async (action?: number) => {
        if (onDelete && editEvent) {
            setIsDeleting(true);
            try {
                // Use provided action or fall back to deleteAction state
                let finalAction: number | undefined =
  action !== undefined ? action : deleteAction;
                
                // For single (non-recurring) events, send undefined to trigger single event delete logic
                if (!editEvent.isRecurring) {
                    finalAction = undefined;
                    console.log(`[EventModal] Single event detected, sending action: undefined`);
                }
                
                console.log(`[EventModal] handleDelete called with action: ${action}, deleteAction: ${deleteAction}, finalAction: ${finalAction}, isRecurring: ${editEvent.isRecurring}`);
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
            <Radio.Group onChange={(e) => {
                console.log(`[EventModal] Update action changed to: ${e.target.value}`);
                setUpdateAction(e.target.value);
            }} value={updateAction}>
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
            <Modal
                title={null}
                open={open}
                onCancel={onClose}
                footer={null}
                width={600}
                centered
                closable={false}
                styles={{
                    body: { padding: 0 },
                    mask: { backdropFilter: 'blur(4px)' }
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(to right, #fafafa, #ffffff)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '28px',
                            height: '28px',
                            background: '#e6f4ff',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CalendarOutlined style={{ color: '#1677ff', fontSize: '16px' }} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                                {editEvent ? "Edit Event" : "Create New Event"}
                            </Title>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {editEvent ? "Update your event details" : "Fill in the information for your event"}
                            </Text>
                        </div>
                    </div>
                    <Button
                        type="text"
                        onClick={onClose}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px'
                        }}
                    >
                        ✕
                    </Button>
                </div>

                {/* Form */}
                <div style={{ padding: '20px 24px' }}>
                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            closable
                            style={{ marginBottom: '16px', borderRadius: '8px' }}
                        />
                    )}
                    <Form
                        form={form}
                        layout="vertical"
                        requiredMark={false}
                    >
                        {/* Title Field */}
                        <Form.Item
                            name="title"
                            rules={[{ required: true, message: 'Please enter event title' }]}
                            style={{ marginBottom: '16px' }}
                        >
                            <Input
                                placeholder="Event title"
                                prefix={<TagOutlined style={{ color: '#bfbfbf' }} />}
                                style={{
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    border: '1px solid #e8e8e8',
                                    boxShadow: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </Form.Item>

                        {/* Description Field */}
                        <Form.Item name="description" style={{ marginBottom: '16px' }}>
                            <TextArea
                                placeholder="Add description, notes, or details..."
                                autoSize={{ minRows: 2, maxRows: 4 }}
                                style={{
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    border: '1px solid #e8e8e8',
                                    fontSize: '14px'
                                }}
                            />
                        </Form.Item>

                        {/* Options Row - All in same line */}
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            marginBottom: '16px',
                            background: '#f9f9fc',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid #f0f0f0'
                        }}>
                            <Form.Item name="isAllDay" valuePropName="checked" style={{ marginBottom: 0, flex: 1 }}>
                                <Checkbox style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px 0',
                                }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>All Day</span>
                                </Checkbox>
                            </Form.Item>
                            <Divider type="vertical" style={{ height: '24px', margin: '4px 0' }} />
                            <Form.Item name="isRecurring" valuePropName="checked" style={{ marginBottom: 0, flex: 1 }}>
                                <Checkbox style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px 0',
                                }}>
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Repeat Daily</span>
                                </Checkbox>
                            </Form.Item>
                            <Divider type="vertical" style={{ height: '24px', margin: '4px 0' }} />
                            <Form.Item name="generateMeeting" valuePropName="checked" style={{ marginBottom: 0, flex: 1 }}>
                                <Checkbox style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px 0',
                                }}>
                                    <VideoCameraOutlined style={{ fontSize: '14px', color: '#1677ff', marginRight: '4px' }} />
                                    <span style={{ fontSize: '13px', fontWeight: 500 }}>Meeting</span>
                                </Checkbox>
                            </Form.Item>
                        </div>

                        {/* Recurring Days Selection */}
                        {isRecurring && (
                            <div style={{
                                marginBottom: '16px',
                                padding: '12px 16px',
                                background: '#f9f9fc',
                                borderRadius: '12px',
                                border: '1px solid #f0f0f0'
                            }}>
                                <Text strong style={{ fontSize: '12px', color: '#4b5563', display: 'block', marginBottom: '12px' }}>
                                    Occurs on:
                                </Text>
                                <Form.Item name="recurringDays" style={{ marginBottom: 0 }}>
                                    <Checkbox.Group style={{ width: '100%' }}>
                                        <Row gutter={[4, 8]} justify="space-between">
                                            {[
                                                { label: 'S', value: 'SU' },
                                                { label: 'M', value: 'MO' },
                                                { label: 'T', value: 'TU' },
                                                { label: 'W', value: 'WE' },
                                                { label: 'T', value: 'TH' },
                                                { label: 'F', value: 'FR' },
                                                { label: 'S', value: 'SA' }
                                            ].map(day => (
                                                <Col key={day.value}>
                                                    <Checkbox value={day.value} style={{ fontSize: '12px' }}>
                                                        {day.label}
                                                    </Checkbox>
                                                </Col>
                                            ))}
                                        </Row>
                                    </Checkbox.Group>
                                </Form.Item>
                            </div>
                        )}

                        {/* Date/Time Section */}
                        <div style={{
                            background: '#f9f9fc',
                            borderRadius: '12px',
                            padding: '12px',
                            marginBottom: '16px'
                        }}>
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item
                                        label={<Text style={{ fontSize: '12px', color: '#6b7280' }}>Start</Text>}
                                        name="startTime"
                                        rules={[{ required: true, message: 'Select start time' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <DatePicker
                                            showTime={{ format: 'HH:mm' }}
                                            format="DD MMM YYYY, hh:mm A"
                                            style={{
                                                width: '100%',
                                                borderRadius: '10px',
                                                padding: '7px 12px',
                                                border: '1px solid #e8e8e8',
                                                height: '38px'
                                            }}
                                            placeholder="Select date"
                                            suffixIcon={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        label={<Text style={{ fontSize: '12px', color: '#6b7280' }}>End</Text>}
                                        name="endTime"
                                        rules={[{ required: true, message: 'Select end time' }]}
                                        style={{ marginBottom: 0 }}
                                    >
                                        <DatePicker
                                            showTime={{ format: 'HH:mm' }}
                                            format="DD MMM YYYY, hh:mm A"
                                            style={{
                                                width: '100%',
                                                borderRadius: '10px',
                                                padding: '7px 12px',
                                                border: '1px solid #e8e8e8',
                                                height: '38px'
                                            }}
                                            placeholder="Select date"
                                            suffixIcon={<ClockCircleOutlined style={{ color: '#bfbfbf' }} />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* Location Field - Updated to only show location */}
                        <Form.Item name="location" style={{ marginBottom: '16px' }}>
                            <Input
                                placeholder="Add location"
                                prefix={<EnvironmentOutlined style={{ color: '#bfbfbf' }} />}
                                style={{
                                    borderRadius: '10px',
                                    padding: '8px 12px',
                                    border: '1px solid #e8e8e8',
                                    height: '38px'
                                }}
                            />
                        </Form.Item>

                        {/* Calendar and Source Type */}
                        <Row gutter={12} style={{ marginBottom: '12px' }}>
                            <Col span={12}>
                                <Form.Item name="calendar" style={{ marginBottom: 0 }}>
                                    <Select
                                        style={{ height: '38px', borderRadius: '10px' }}
                                        dropdownStyle={{ borderRadius: '10px' }}
                                        placeholder="Select calendar"
                                    >
                                        <Option value="Personal Calendar">📅 Personal Calendar</Option>
                                        <Option value="Team Calendar">👥 Team Calendar</Option>
                                        <Option value="Company Holidays">🎉 Company Holidays</Option>
                                        <Option value="Approved Leaves">🌴 Approved Leaves</Option>
                                        <Option value="Project Milestones">🎯 Project Milestones</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item name="sourceType" style={{ marginBottom: 0 }}>
                                    <Select
                                        style={{ height: '38px', borderRadius: '10px' }}
                                        dropdownStyle={{ borderRadius: '10px' }}
                                        placeholder="Source type"
                                    >
                                        <Option value="Tickets">🎫 Tickets</Option>
                                        <Option value="Project">📊 Project</Option>
                                        <Option value="Leave">🌴 Leave</Option>
                                        <Option value="Attendance">⏱️ Attendance</Option>
                                        <Option value="Manual">✍️ Manual</Option>
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Attendees Field */}
                        <Form.Item name="attendees" style={{ marginBottom: 0 }}>
                            <Select
                                mode="multiple"
                                style={{ borderRadius: '10px' }}
                                placeholder="Add attendees"
                                loading={fetchingUsers}
                                optionLabelProp="label"
                                dropdownStyle={{ borderRadius: '10px' }}
                                suffixIcon={<UserOutlined style={{ color: '#bfbfbf' }} />}
                            >
                                {users.map(user => (
                                    <Option key={user.id} value={user.workEmail} label={user.name}>
                                        <Space>
                                            <span style={{
                                                width: '22px',
                                                height: '22px',
                                                borderRadius: '16px',
                                                background: '#e6f4ff',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '11px',
                                                color: '#1677ff'
                                            }}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '13px' }}>{user.name}</span>
                                            <Text type="secondary" style={{ fontSize: '11px' }}>{user.workEmail}</Text>
                                        </Space>
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Form>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 24px 16px',
                    borderTop: '1px solid #f0f0f0',
                    background: '#fafafa',
                    borderRadius: '0 0 12px 12px'
                }}>
                    <Row justify="space-between" align="middle">
                        <Col>
                            {editEvent && (
                                editEvent.isRecurring ? (
                                    <Popconfirm
                                        key="delete"
                                        title="Delete Recurring Event"
                                        description={deleteContent}
                                        onConfirm={() => handleDelete(deleteAction)}
                                        okText="Delete"
                                        cancelText="Cancel"
                                        okButtonProps={{ danger: true, loading: isDeleting }}
                                    >
                                        <Button
                                            danger
                                            style={{
                                                borderRadius: '8px',
                                                padding: '4px 12px',
                                                height: '36px',
                                                fontWeight: 500,
                                                fontSize: '13px'
                                            }}
                                            disabled={loading && !isDeleting}
                                        >
                                            Delete
                                        </Button>
                                    </Popconfirm>
                                ) : (
                                    <Popconfirm
                                        key="delete"
                                        title="Delete Event"
                                        description="Are you sure you want to delete this event?"
                                        onConfirm={() => handleDelete()}
                                        okText="Delete"
                                        cancelText="Cancel"
                                        okButtonProps={{ danger: true, loading: isDeleting }}
                                    >
                                        <Button
                                            danger
                                            style={{
                                                borderRadius: '8px',
                                                padding: '4px 12px',
                                                height: '36px',
                                                fontWeight: 500,
                                                fontSize: '13px'
                                            }}
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
                                        borderRadius: '8px',
                                        padding: '4px 16px',
                                        height: '36px',
                                        fontWeight: 500,
                                        fontSize: '13px',
                                        background: '#52c41a',
                                        borderColor: '#52c41a',
                                        marginLeft: '8px'
                                    }}
                                >
                                    Join Meeting
                                </Button>
                            )}
                        </Col>
                        <Col>
                            <Space size={10}>
                                <Button
                                    key="cancel"
                                    onClick={onClose}
                                    disabled={isDeleting || (loading && !showUpdateConfirm)}
                                    style={{
                                        borderRadius: '8px',
                                        padding: '4px 16px',
                                        height: '36px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        border: '1px solid #e0e0e0'
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    key="save"
                                    type="primary"
                                    size="large"
                                    onClick={handleSubmit}
                                    loading={loading && !isDeleting && !showUpdateConfirm}
                                    disabled={isDeleting || showUpdateConfirm}
                                    style={{
                                        minWidth: '110px',
                                        borderRadius: '8px',
                                        height: '36px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        background: '#1677ff',
                                        border: 'none',
                                        boxShadow: '0 4px 8px rgba(22, 119, 255, 0.2)'
                                    }}
                                >
                                    {editEvent ? "Update Event" : "Create Event"}
                                </Button>
                            </Space>
                        </Col>
                    </Row>
                </div>
            </Modal>

            {/* Update Confirmation Modal */}
            <Modal
                title="Update Recurring Event"
                open={showUpdateConfirm}
                onCancel={() => setShowUpdateConfirm(false)}
                onOk={handleConfirmUpdate}
                okText="Update"
                cancelText="Cancel"
                width={400}
                centered
                confirmLoading={confirmLoading} // Use separate loading state
            >
                {updateContent}
            </Modal>
        </>
    );
}