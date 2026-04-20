"use client";

import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Typography, Spin, message, Avatar, Input, Empty, theme } from 'antd';
import { UserOutlined, SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { channelService } from '@/services/channelService';
import { userService, User } from '@/services/userService';
import { useChatStore } from '@/store/chatStore';
import { useAuth } from '@/context/AuthContext';

const { Text, Title } = Typography;

interface ChannelSettingsModalProps {
    open: boolean;
    onClose: () => void;
    channelId: string;
}

export default function ChannelSettingsModal({ open, onClose, channelId }: ChannelSettingsModalProps) {
    const { token } = theme.useToken();
    const { user } = useAuth();
    const { channels } = useChatStore();
    const channel = channels.find(c => c.id === channelId);

    const [activeTab, setActiveTab] = useState<'members' | 'add'>('members');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [addingIds, setAddingIds] = useState<string[]>([]);

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setActiveTab('members');
            setSearchQuery('');
            setSearchResults([]);
        }
    }, [open]);

    // Search users when query changes
    useEffect(() => {
        const search = async () => {
            if (!searchQuery.trim()) {
                setSearchResults([]);
                return;
            }

            try {
                const results = await userService.searchUsers(searchQuery);
                // Filter out existing members
                const existingMemberIds = channel?.members?.map(m => m.userId) || [];
                setSearchResults(results.filter(u => !existingMemberIds.includes(u.id)));
            } catch (error) {
                console.error('Search failed:', error);
            }
        };

        const timeoutId = setTimeout(search, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, channel?.members]);

    const handleAddMember = async (userId: string) => {
        setAddingIds(prev => [...prev, userId]);
        try {
            await channelService.addMembers(channelId, [userId]);
            message.success('Member added successfully');

            // Remove from search results
            setSearchResults(prev => prev.filter(u => u.id !== userId));

            // Note: In a real app we'd refresh the channel data here
            // For now we rely on the backend update and potential socket event
        } catch (error) {
            console.error('Failed to add member:', error);
            message.error('Failed to add member');
        } finally {
            setAddingIds(prev => prev.filter(id => id !== userId));
        }
    };

    const canAddMembers = channel?.type === 'CHANNEL' ||
        channel?.members?.some(m => m.userId === user?.id && ['owner', 'admin'].includes(m.role));

    return (
        <Modal
            title={<Title level={5} style={{ margin: 0, color: token.colorText }}>Channel Settings: #{channel?.name}</Title>}
            open={open}
            onCancel={onClose}
            footer={null}
            width={520}
        >
            <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                <Button
                    type={activeTab === 'members' ? 'primary' : 'default'}
                    onClick={() => setActiveTab('members')}
                >
                    Members ({channel?.members?.length || 0})
                </Button>
                {canAddMembers && (
                    <Button
                        type={activeTab === 'add' ? 'primary' : 'default'}
                        onClick={() => setActiveTab('add')}
                        icon={<PlusOutlined />}
                    >
                        Add People
                    </Button>
                )}
            </div>

            {activeTab === 'members' ? (
                <List
                    dataSource={channel?.members || []}
                    renderItem={(member) => (
                        <List.Item>
                            <List.Item.Meta
                                avatar={
                                    <Avatar icon={<UserOutlined />}>
                                        {member.user?.name?.[0]}
                                    </Avatar>
                                }
                                title={<Text style={{ color: token.colorText }}>{member.user?.name || 'Unknown User'}</Text>}
                                description={member.role}
                            />
                        </List.Item>
                    )}
                />
            ) : (
                <div>
                    <Input
                        placeholder="Search users by name or email..."
                        prefix={<SearchOutlined />}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ marginBottom: 16 }}
                        autoFocus
                    />

                    {searchResults.length > 0 ? (
                        <List
                            dataSource={searchResults}
                            renderItem={(user) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            key="add"
                                            type="primary"
                                            size="small"
                                            loading={addingIds.includes(user.id)}
                                            onClick={() => handleAddMember(user.id)}
                                        >
                                            Add
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar icon={<UserOutlined />} src={user.avatar}>
                                                {user.name?.[0]}
                                            </Avatar>
                                        }
                                        title={<Text style={{ color: token.colorText }}>{user.name}</Text>}
                                        description={user.workEmail || user.email}
                                    />
                                </List.Item>
                            )}
                        />
                    ) : searchQuery ? (
                        <Empty description="No users found" />
                    ) : (
                        <div style={{ textAlign: 'center', color: token.colorTextSecondary, padding: 20 }}>
                            Type to search for people to add
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
