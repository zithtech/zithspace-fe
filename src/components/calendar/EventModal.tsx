// "use client";

// import React, { useEffect, useState } from 'react';
// import { Modal, Form, Input, DatePicker, Checkbox, Space, Button, Divider, Select, Popconfirm, Typography, Radio } from 'antd';
// import { VideoCameraOutlined } from '@ant-design/icons';
// import dayjs, { Dayjs } from 'dayjs';
// import { ZohoEvent, CreateEventData, ZohoCalendarService } from '@/services/zohoCalendarService';
// import { api } from '@/lib/axios';

// const { TextArea } = Input;
// const { RangePicker } = DatePicker;
// const { Option } = Select;
// const { Title, Text } = Typography;

// interface EventModalProps {
//     open: boolean;
//     onClose: () => void;
//     onSave: (data: CreateEventData) => Promise<void>;
//     onDelete?: (action?: number, occurrenceDate?: string) => Promise<void>;
//     editEvent?: ZohoEvent | null;
//     initialDate?: Dayjs;
//     loading: boolean;
// }

// export default function EventModal({
//     open,
//     onClose,
//     onSave,
//     onDelete,
//     editEvent,
//     initialDate,
//     loading
// }: EventModalProps) {
//     const [form] = Form.useForm();
//     const isAllDay = Form.useWatch('isAllDay', form);
//     const isRecurring = Form.useWatch('isRecurring', form);
//     const [isDeleting, setIsDeleting] = useState(false);
//     const [users, setUsers] = useState<{ id: string, name: string, workEmail: string }[]>([]);
//     const [fetchingUsers, setFetchingUsers] = useState(false);

//     useEffect(() => {
//         const fetchUsers = async () => {
//             setFetchingUsers(true);
//             try {
//                 const data = await api.get<any[]>('/api/members/select');
//                 setUsers(data.map(u => ({ id: u.value, name: u.label, workEmail: u.email })));
//             } catch (error) {
//                 console.error('Failed to fetch users:', error);
//             } finally {
//                 setFetchingUsers(false);
//             }
//         };
//         fetchUsers();
//     }, []);

//     useEffect(() => {
//         if (open && editEvent) {
//             setDeleteAction(0);
//         }
//     }, [open, editEvent]);

//     useEffect(() => {
//         if (open) {
//             setIsDeleting(false);
//             if (editEvent) {
//                 form.setFieldsValue({
//                     title: editEvent.title,
//                     description: editEvent.description,
//                     location: editEvent.location,
//                     startTime: dayjs(editEvent.startTime),
//                     endTime: dayjs(editEvent.endTime),
//                     isAllDay: !!editEvent.isAllDay,
//                     isRecurring: !!editEvent.isRecurring,
//                     calendar: editEvent.calendar || 'Personal Calendar',
//                     sourceType: editEvent.sourceType || 'Manual',
//                     attendees: (editEvent.attendees as string[]) || [],
//                     generateMeeting: !!editEvent.meetingLink
//                 });
//             } else {
//                 let start = initialDate ? initialDate.hour(9).minute(0) : dayjs().hour(9).minute(0);
//                 if (start.isBefore(dayjs())) {
//                     start = dayjs().add(1, 'hour').startOf('hour');
//                 }
//                 const end = start.add(1, 'hour');
//                 form.setFieldsValue({
//                     title: '',
//                     description: '',
//                     location: '',
//                     startTime: start,
//                     endTime: end,
//                     isAllDay: false,
//                     isRecurring: false,
//                     calendar: 'Personal Calendar',
//                     sourceType: 'Manual',
//                     attendees: [],
//                     generateMeeting: false
//                 });
//             }
//         }
//     }, [open, editEvent, initialDate, form]);

//     const handleSubmit = async () => {
//         try {
//             const values = await form.validateFields();

//             await onSave({
//                 title: values.title,
//                 description: values.description,
//                 location: values.location,
//                 startTime: values.startTime.toISOString(),
//                 endTime: values.endTime.toISOString(),
//                 isRecurring: values.isRecurring,
//                 isAllDay: values.isAllDay,
//                 calendar: values.calendar,
//                 sourceType: values.sourceType,
//                 attendees: values.attendees || [],
//                 generateMeeting: values.generateMeeting,
//             });
//         } catch (error) {
//             console.error('Validation failed:', error);
//         }
//     };

//     const handleDelete = async (action?: number) => {
//         if (onDelete && editEvent) {
//             setIsDeleting(true);
//             try {
//                 // Pass the occurrence date/time for partial deletes
//                 await onDelete(action, editEvent.startTime);
//             } finally {
//                 setIsDeleting(false);
//             }
//         }
//     };

//     const [deleteAction, setDeleteAction] = useState<number>(0);

//     const deleteContent = (
//         <div style={{ padding: '8px 0' }}>
//             <Radio.Group onChange={(e) => setDeleteAction(e.target.value)} value={deleteAction}>
//                 <Space direction="vertical">
//                     <Radio value={0}>Delete for one day</Radio>
//                     <Radio value={2}>Delete for all days</Radio>
//                 </Space>
//             </Radio.Group>
//         </div>
//     );

//     return (
//         <Modal
//             title={
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '8px' }}>
//                     <div style={{ width: '4px', height: '20px', background: '#1677ff', borderRadius: '2px' }} />
//                     <Title level={4} style={{ margin: 0, fontSize: '18px' }}>
//                         {editEvent ? "Edit Event" : "Create Event"}
//                     </Title>
//                 </div>
//             }
//             open={open}
//             onCancel={onClose}
//             footer={[
//                 editEvent && (
//                     editEvent.isRecurring ? (
//                         <Popconfirm
//                             key="delete"
//                             title="Delete Recurring Event"
//                             description={deleteContent}
//                             onConfirm={() => handleDelete(deleteAction)}
//                             okText="Delete"
//                             cancelText="Cancel"
//                             okButtonProps={{ danger: true, loading: isDeleting }}
//                         >
//                             <Button danger style={{ float: 'left', borderRadius: '8px', padding: '4px 24px' }} disabled={loading && !isDeleting}>
//                                 Delete
//                             </Button>
//                         </Popconfirm>
//                     ) : (
//                         <Popconfirm
//                             key="delete"
//                             title="Delete Event"
//                             description="Are you sure you want to delete this event?"
//                             onConfirm={() => handleDelete()}
//                             okText="Delete"
//                             cancelText="Cancel"
//                             okButtonProps={{ danger: true, loading: isDeleting }}
//                         >
//                             <Button danger style={{ float: 'left', borderRadius: '8px', padding: '4px 24px' }} disabled={loading && !isDeleting}>
//                                 Delete
//                             </Button>
//                         </Popconfirm>
//                     )
//                 ),
//                 <Button key="cancel" onClick={onClose} disabled={loading || isDeleting} style={{ borderRadius: '8px', padding: '4px 24px' }}>
//                     Cancel
//                 </Button>,
//                 <Button key="save" type="primary" size="large" onClick={handleSubmit} loading={loading && !isDeleting} disabled={isDeleting} style={{ minWidth: '120px', borderRadius: '8px', background: '#8ba6f3', borderColor: '#8ba6f3' }}>
//                     {editEvent ? "Update" : "Save Event"}
//                 </Button>
//             ]}
//             width={480}
//             centered
//             styles={{
//                 body: { padding: '12px 24px 24px' },
//                 header: { padding: '24px 24px 8px', borderBottom: 'none' },
//                 footer: { padding: '0 24px 24px', borderTop: 'none', textAlign: 'right' }
//             }}
//         >
//             <Form form={form} layout="vertical" requiredMark={false}>
//                 <Form.Item
//                     label={<Text strong style={{ fontSize: '13px', color: '#4b5563' }}>Title</Text>}
//                     name="title"
//                     rules={[{ required: true, message: 'Please enter event title' }]}
//                     style={{ marginBottom: '16px' }}
//                 >
//                     <Input
//                         placeholder="Event title"
//                         style={{ borderRadius: '8px', padding: '8px 12px' }}
//                     />
//                 </Form.Item>

//                 <Form.Item label={<Text strong style={{ fontSize: '13px', color: '#4b5563' }}>Description</Text>} name="description" style={{ marginBottom: '16px' }}>
//                     <TextArea
//                         placeholder="Add details..."
//                         autoSize={{ minRows: 3, maxRows: 6 }}
//                         style={{ borderRadius: '8px' }}
//                     />
//                 </Form.Item>

//                 <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
//                     <Form.Item name="isAllDay" valuePropName="checked" style={{ marginBottom: 0 }}>
//                         <Checkbox style={{ display: 'flex', alignItems: 'center' }}>
//                             <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '8px' }}>All Day</span>
//                         </Checkbox>
//                     </Form.Item>
//                     <Form.Item name="isRecurring" valuePropName="checked" style={{ marginBottom: 0 }}>
//                         <Checkbox style={{ display: 'flex', alignItems: 'center' }}>
//                             <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '8px' }}>Repeat Daily</span>
//                         </Checkbox>
//                     </Form.Item>
//                     <Form.Item name="generateMeeting" valuePropName="checked" style={{ marginBottom: 0 }}>
//                         <Checkbox style={{ display: 'flex', alignItems: 'center' }}>
//                             <VideoCameraOutlined style={{ fontSize: '16px', color: '#1677ff' }} />
//                             <span style={{ fontSize: '14px', fontWeight: 500, marginLeft: '8px' }}>Generate Meeting</span>
//                         </Checkbox>
//                     </Form.Item>
//                 </div>

//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
//                     <Form.Item
//                         label={<Text strong style={{ fontSize: '13px', color: '#4b5563' }}>Start</Text>}
//                         name="startTime"
//                         rules={[{ required: true, message: 'Select start time' }]}
//                         style={{ marginBottom: 0 }}
//                     >
//                         <DatePicker
//                             showTime={{ format: 'HH:mm' }}
//                             format="DD/MM/YYYY, hh:mm A"
//                             style={{ width: '100%', borderRadius: '8px', padding: '8px 12px' }}
//                             placeholder="Select Date"
//                         />
//                     </Form.Item>

//                     <Form.Item
//                         label={<Text strong style={{ fontSize: '13px', color: '#4b5563' }}>End</Text>}
//                         name="endTime"
//                         rules={[{ required: true, message: 'Select end time' }]}
//                         style={{ marginBottom: 0 }}
//                     >
//                         <DatePicker
//                             showTime={{ format: 'HH:mm' }}
//                             format="DD/MM/YYYY, hh:mm A"
//                             style={{ width: '100%', borderRadius: '8px', padding: '8px 12px' }}
//                             placeholder="Select Date"
//                         />
//                     </Form.Item>
//                 </div>

//                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
//                     <Form.Item label={<Text strong style={{ fontSize: '13px', color: '#4b5563' }}>Calendar</Text>} name="calendar" style={{ marginBottom: 0 }}>
//                         <Select style={{ height: '40px' }} dropdownStyle={{ borderRadius: '8px' }}>
//                             <Option value="Personal Calendar">Personal Calendar</Option>
//                             <Option value="Team Calendar">Team Calendar</Option>
//                             <Option value="Company Holidays">Company Holidays</Option>
//                             <Option value="Approved Leaves">Approved Leaves</Option>
//                             <Option value="Project Milestones">Project Milestones</Option>
//                         </Select>
//                     </Form.Item>
//                     <Form.Item label={<Text strong style={{ fontSize: '13px', color: '#4b5563' }}>Source Type</Text>} name="sourceType" style={{ marginBottom: 0 }}>
//                         <Select style={{ height: '40px' }} dropdownStyle={{ borderRadius: '8px' }}>
//                             <Option value="Tickets">Tickets</Option>
//                             <Option value="Project">Project</Option>
//                             <Option value="Leave">Leave</Option>
//                             <Option value="Attendance">Attendance</Option>
//                             <Option value="Manual">Manual</Option>
//                         </Select>
//                     </Form.Item>
//                 </div>
//             </Form>
//         </Modal>
//     );
// }



"use client";

import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Checkbox, Space, Button, Divider, Select, Popconfirm, Typography, Radio, Row, Col } from 'antd';
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
}

export default function EventModal({
    open,
    onClose,
    onSave,
    onDelete,
    editEvent,
    initialDate,
    loading
}: EventModalProps) {
    const [form] = Form.useForm();
    const isAllDay = Form.useWatch('isAllDay', form);
    const isRecurring = Form.useWatch('isRecurring', form);
    const [isDeleting, setIsDeleting] = useState(false);
    const [users, setUsers] = useState<{ id: string, name: string, workEmail: string }[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(false);

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
                    generateMeeting: !!editEvent.meetingLink
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
                    generateMeeting: false
                });
            }
        }
    }, [open, editEvent, initialDate, form]);

    // const handleSubmit = async () => {
    //     try {
    //         const values = await form.validateFields();

    //         await onSave({
    //             title: values.title,
    //             description: values.description,
    //             location: values.location,
    //             startTime: values.startTime.toISOString(),
    //             endTime: values.endTime.toISOString(),
    //             isRecurring: values.isRecurring,
    //             isAllDay: values.isAllDay,
    //             calendar: values.calendar,
    //             sourceType: values.sourceType,
    //             attendees: values.attendees || [],
    //             generateMeeting: values.generateMeeting,
    //             provider: editEvent?.provider || 'GOOGLE' // Default to first for new series
    //         });
    //     } catch (error) {
    //         console.error('Validation failed:', error);
    //     }
    // };

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
            generateMeeting: values.generateMeeting || false
        };

        // If editing an existing event, create a new object with provider
        if (editEvent) {
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


    const handleDelete = async (action?: number) => {
        if (onDelete && editEvent) {
            setIsDeleting(true);
            try {
                await onDelete(action, editEvent.startTime);
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

    return (
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
                <Form form={form} layout="vertical" requiredMark={false}>
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
                                disabled={loading || isDeleting}
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
                                loading={loading && !isDeleting}
                                disabled={isDeleting}
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
    );
}