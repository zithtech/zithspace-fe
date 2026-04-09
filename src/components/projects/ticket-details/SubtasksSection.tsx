import React, { useState } from 'react';
import { Space, Typography, Tooltip, Avatar, Input, Button, message, Dropdown, MenuProps, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleFilled, SyncOutlined, ClockCircleOutlined, UserOutlined, StopOutlined } from '@ant-design/icons';
import { Ticket } from '@/services/ticketService';
import { useCreateTicket, useUpdateTicket, useDeleteTicket } from '@/hooks/useTickets';
import Link from 'next/link';

const { Text } = Typography;

interface SubtasksSectionProps {
    tickets: Ticket[];
    parentId: string;
    projectId: string;
    members: any[]; // Using any[] for now as Member type specific import might differ, but ideally should be Member[] or User[]
    onSubtaskClick?: (ticketId: string) => void; // Optional callback for subtask navigation
}

const SubtasksSection: React.FC<SubtasksSectionProps> = ({ tickets = [], parentId, projectId, members = [], onSubtaskClick }) => {
    console.log({ members })
    const [isCreating, setIsCreating] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const createTicketMutation = useCreateTicket();
    const updateTicketMutation = useUpdateTicket();
    const deleteTicketMutation = useDeleteTicket();

    const STATUS_CONFIG: Record<string, { icon: React.ReactNode, color: string, label: string }> = {
        not_started: { icon: <ClockCircleOutlined />, color: '#8c8c8c', label: 'Not Started' }, // Darker grey
        in_progress: { icon: <SyncOutlined spin />, color: '#1890ff', label: 'In Progress' },
        in_testing: { icon: <ClockCircleOutlined />, color: '#faad14', label: 'In Testing' },
        completed: { icon: <CheckCircleFilled />, color: '#52c41a', label: 'Completed' },
        blocked: { icon: <StopOutlined />, color: '#ff4d4f', label: 'Blocked' }
    };

    const handleCreateSubtask = async () => {
        if (!newSubtaskTitle.trim() || !parentId || !projectId) return;

        try {
            await createTicketMutation.mutateAsync({
                title: newSubtaskTitle,
                project: projectId,
                parentId: parentId,
                type: 'Subtask',
                priority: 'Medium (P2)',
                status: 'not_started'
            });
            message.success('Subtask created');
            setNewSubtaskTitle('');
            // Keep creating active for rapid entry
        } catch (error) {
            console.error('Failed to create subtask', error);
            message.error('Failed to create subtask');
        }
    };

    const handleUpdateStatus = async (ticketId: string, status: string) => {
        try {
            await updateTicketMutation.mutateAsync({ id: ticketId, data: { status }, parentId });
            message.success('Status updated');
        } catch (error) {
            message.error('Failed to update status');
        }
    };

    const handleUpdateTitle = async (ticketId: string) => {
        if (!editTitle.trim()) return;
        try {
            await updateTicketMutation.mutateAsync({ id: ticketId, data: { title: editTitle }, parentId });
            setEditingId(null);
            message.success('Title updated');
        } catch (error) {
            message.error('Failed to update title');
        }
    };

    const handleUpdateAssignee = async (ticketId: string, assigneeId: string | null) => {
        // Explicitly handle null/empty string as null
        const finalAssigneeId = (!assigneeId || assigneeId === '') ? null : assigneeId;
        console.log('Updating assignee:', { ticketId, assigneeId, finalAssigneeId, parentId });

        // Find member for optimistic update
        const member = members.find(m => m.value === finalAssigneeId);
        const optimisticAssignee = member ? {
            id: member.value,
            name: member.label, // Using label as name
            email: member.email
        } : null;

        try {
            // Force type assertion to ensure null is passed
            await updateTicketMutation.mutateAsync({
                id: ticketId,
                data: { assignee: finalAssigneeId as any },
                optimisticData: { assignee: optimisticAssignee },
                parentId
            });
            message.success('Assignee updated');
        } catch (error) {
            console.error('Assignee update failed:', error);
            message.error('Failed to update assignee');
        }
    };

    const handleDelete = async (ticketId: string) => {
        try {
            await deleteTicketMutation.mutateAsync(ticketId);
            message.success('Subtask removed');
        } catch (error) {
            message.error('Failed to remove subtask');
        }
    };

    const getStatusMenu = (ticketId: string): MenuProps => ({
        items: Object.keys(STATUS_CONFIG).map(key => ({
            key,
            label: (
                <Space>
                    <span style={{ color: STATUS_CONFIG[key].color }}>{STATUS_CONFIG[key].icon}</span>
                    <span>{STATUS_CONFIG[key].label}</span>
                </Space>
            ),
            onClick: () => handleUpdateStatus(ticketId, key)
        }))
    });

    const getAssigneeMenu = (ticketId: string): MenuProps => ({
        style: { maxHeight: '300px', overflowY: 'auto' },
        items: [
            {
                key: 'unassigned',
                label: (
                    <Space>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <span>Unassigned</span>
                    </Space>
                ),
                onClick: () => handleUpdateAssignee(ticketId, null) // Send null for unassigned
            },
            ...members.map(member => ({
                key: member.value,
                label: (
                    <Space>
                        <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>{member?.label?.charAt(0).toUpperCase()}</Avatar>
                        <span>{member?.label}</span>
                    </Space>
                ),
                onClick: () => handleUpdateAssignee(ticketId, member.value)
            }))
        ]
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* List of Subtasks */}
            {tickets.map((subtask) => {
                const statusKey = subtask.status?.toLowerCase().replace(' ', '_') || 'not_started';
                const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG['not_started'];

                return (
                    <div
                        key={subtask.id}
                        className="subtask-row"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderBottom: '1px solid var(--border-color)',
                            gap: 8,
                            position: 'relative', // For hover actions
                            transition: 'all 0.2s'
                        }}
                    >
                        {/* Status Dropdown */}
                        <Dropdown menu={getStatusMenu(subtask.id)} trigger={['click']}>
                            <div className="status-trigger" style={{ color: statusConfig.color, fontSize: 16, display: 'flex', cursor: 'pointer', padding: 4, borderRadius: 4 }}>
                                <Tooltip title={`Status: ${statusConfig.label}`}>
                                    {statusConfig.icon}
                                </Tooltip>
                            </div>
                        </Dropdown>

                        {/* Ticket ID - Clickable */}
                        <Text
                            type="secondary"
                            style={{
                                fontSize: 12,
                                minWidth: 60,
                                cursor: onSubtaskClick ? 'pointer' : 'default',
                                transition: 'color 0.2s'
                            }}
                            className={onSubtaskClick ? 'clickable-ticket-number' : ''}
                            onClick={() => onSubtaskClick?.(subtask.id)}
                        >
                            {subtask.ticketNumber}
                        </Text>

                        {/* Title (Inline Edit) */}
                        <div style={{ flex: 1, display: 'flex' }}>
                            {editingId === subtask.id ? (
                                <Input
                                    value={editTitle}
                                    onChange={e => setEditTitle(e.target.value)}
                                    onBlur={() => handleUpdateTitle(subtask.id)}
                                    onPressEnter={() => handleUpdateTitle(subtask.id)}
                                    autoFocus
                                    size="small"
                                    style={{ margin: '-4px 0' }}
                                />
                            ) : (
                                <Text
                                    className="editable-title"
                                    style={{
                                        fontSize: 13,
                                        textDecoration: subtask.status === 'completed' ? 'line-through' : 'none',
                                        color: subtask.status === 'completed' ? '#8c8c8c' : 'var(--text-primary)', // Updated color
                                        cursor: 'text',
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        transition: 'background 0.2s',
                                        width: '100%',
                                        display: 'block'
                                    }}
                                    onClick={() => {
                                        setEditingId(subtask.id);
                                        setEditTitle(subtask.title);
                                    }}
                                >
                                    {subtask.title}
                                </Text>
                            )}
                        </div>

                        {/* Assignee Avatar (Dropdown) */}
                        <Dropdown menu={getAssigneeMenu(subtask.id)} trigger={['click']} placement="bottomRight">
                            <div className="assignee-trigger" style={{ cursor: 'pointer', padding: 2, borderRadius: '50%' }}>
                                {subtask.assignee ? (
                                    <Tooltip title={`Assignee: ${subtask.assignee.name}`}>
                                        <Avatar size={24} style={{ backgroundColor: '#1890ff', fontSize: 12 }}>
                                            {subtask.assignee.name.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Tooltip>
                                ) : (
                                    <Tooltip title="Click to assign">
                                        <div style={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: '50%',
                                            border: '1px dashed var(--border-color)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#8c8c8c'
                                        }}>
                                            <UserOutlined style={{ fontSize: 12 }} />
                                        </div>
                                    </Tooltip>
                                )}
                            </div>
                        </Dropdown>

                        {/* Delete Action (Visible on Hover) */}
                        <div className="subtask-actions">
                            <Popconfirm title="Delete subtask?" onConfirm={() => handleDelete(subtask.id)}>
                                <Button type="text" size="small" danger icon={<DeleteOutlined />} style={{ opacity: 0.6 }} />
                            </Popconfirm>
                        </div>
                    </div>
                );
            })}

            {/* Creation Input */}
            <div style={{ padding: '4px 10px' }}>
                <div
                    className="create-subtask-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'text',
                        padding: '6px 10px',
                        borderRadius: 8,
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: '1px solid transparent'
                    }}
                    onClick={() => setIsCreating(true)}
                >
                    {isCreating ? (
                        <Input
                            autoFocus
                            placeholder="What needs to be done?"
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateSubtask();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                            suffix={createTicketMutation.isPending ? <SyncOutlined spin /> : <Button type="text" size="small" icon={<PlusOutlined />} onClick={handleCreateSubtask} />}
                            variant="borderless"
                            style={{ padding: '4px 0', fontSize: 13 }}
                        />
                    ) : (
                        <>
                            <div style={{
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: '#e6f7ff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#1890ff',
                                transition: 'all 0.2s'
                            }} className="plus-icon-container">
                                <PlusOutlined style={{ fontSize: 12 }} />
                            </div>
                            <Text style={{ fontSize: 13, color: '#1890ff', fontWeight: 600 }}>Create subtask</Text>
                        </>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .subtask-row:hover {
                    background-color: var(--bg-secondary);
                    filter: brightness(0.98);
                }
                .create-subtask-btn:hover {
                    background-color: var(--bg-secondary);
                    border-color: var(--border-color);
                    filter: brightness(0.98);
                }
                .create-subtask-btn:hover .plus-icon-container {
                    background-color: #1890ff;
                    color: #fff;
                }
                .status-trigger:hover {
                    background-color: #e6f7ff;
                }
                .editable-title:hover {
                    background-color: var(--bg-pure-white);
                    border: 1px solid var(--border-color);
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .assignee-trigger:hover {
                    transform: scale(1.1);
                }
                .assignee-trigger:hover .anticon {
                    color: #1890ff; /* Primary color on hover */
                }
                /* Target the unassigned circle specifically if possible, or just the trigger content */
                .assignee-trigger:hover > div {
                    border-color: #1890ff !important;
                    color: #1890ff !important;
                }
                .subtask-actions {
                    opacity: 0;
                    transition: opacity 0.2s;
                    margin-left: 8px;
                }
                .subtask-row:hover .subtask-actions {
                    opacity: 1;
                }
                .subtask-actions button:hover {
                    opacity: 1 !important;
                    background-color: #fff1f0;
                }
                /* Clickable ticket number styling */
                .clickable-ticket-number:hover {
                    color: #1890ff !important;
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};

export default SubtasksSection;
