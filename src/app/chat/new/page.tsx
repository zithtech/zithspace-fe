"use client";

import React, { useState, useEffect } from 'react';
import { Typography, Input, Avatar, List, Spin, theme } from 'antd';
import { useRouter } from 'next/navigation';
import { channelService } from '@/services/channelService';
import { useChatStore } from '@/store/chatStore';
import { MembersService } from '@/services/membersService';
import { UserOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Member {
    value: string;
    label: string;
}

export default function NewChatPage() {
    const { token } = theme.useToken();
    const router = useRouter();
    const { setChannels, channels } = useChatStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [searchResults, setSearchResults] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        const loadMembers = async () => {
            try {
                const members = await MembersService.getMembersForSelect();
                setAllMembers(members);
            } catch (error) {
                console.error('Failed to load members:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMembers();
    }, []);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        if (value.length > 0) {
            const filtered = allMembers.filter(m =>
                m.label.toLowerCase().includes(value.toLowerCase())
            );
            setSearchResults(filtered);
        } else {
            setSearchResults([]);
        }
    };

    const handleUserSelect = async (userId: string) => {
        if (creating) return;
        setCreating(true);

        try {
            const newChannel = await channelService.createChannel({
                type: 'DM',
                members: [userId]
            });

            if (!channels.find(c => c.id === newChannel.id)) {
                setChannels([...channels, newChannel]);
            }

            router.push(`/chat/${newChannel.id}`);
        } catch (error) {
            console.error('Failed to create chat:', error);
            setCreating(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: token.colorBgContainer
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: `1px solid ${token.colorBorderSecondary}`
            }}>
                <Title level={5} style={{ margin: 0, marginBottom: 16, color: token.colorText }}>New Message</Title>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <Text type="secondary">To:</Text>
                    <Input
                        placeholder="Search for a person..."
                        bordered={false}
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ flex: 1, fontSize: 14 }}
                        autoFocus
                    />
                </div>
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                        <Spin />
                    </div>
                ) : searchResults.length > 0 ? (
                    <List
                        dataSource={searchResults}
                        renderItem={(item) => (
                            <List.Item
                                style={{
                                    cursor: creating ? 'not-allowed' : 'pointer',
                                    padding: '12px 20px',
                                    border: 'none'
                                }}
                                className="user-item"
                                onClick={() => handleUserSelect(item.value)}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar
                                            icon={<UserOutlined />}
                                            style={{ backgroundColor: '#1677ff' }}
                                        />
                                    }
                                    title={<Text strong>{item.label}</Text>}
                                />
                            </List.Item>
                        )}
                    />
                ) : searchTerm.length > 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <Text type="secondary">No results found</Text>
                    </div>
                ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <Text type="secondary">Start typing to find people</Text>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .user-item:hover {
                    background-color: ${token.colorFillAlter};
                }
            `}</style>
        </div>
    );
}
