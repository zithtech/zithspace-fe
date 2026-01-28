"use client";

import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Typography, Spin, message, Empty } from 'antd';
import { NumberOutlined, TeamOutlined } from '@ant-design/icons';
import { channelService, PublicChannel } from '@/services/channelService';
import { useChatStore } from '@/store/chatStore';
import { useRouter } from 'next/navigation';

const { Text, Title } = Typography;

interface BrowseChannelsModalProps {
    open: boolean;
    onClose: () => void;
}

export default function BrowseChannelsModal({ open, onClose }: BrowseChannelsModalProps) {
    const router = useRouter();
    const { channels, setChannels } = useChatStore();
    const [publicChannels, setPublicChannels] = useState<PublicChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            loadChannels();
        }
    }, [open]);

    const loadChannels = async () => {
        setLoading(true);
        try {
            const data = await channelService.discoverChannels();
            setPublicChannels(data);
        } catch (error) {
            console.error('Failed to load public channels:', error);
            message.error('Failed to load channels');
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (channelId: string) => {
        setJoiningId(channelId);
        try {
            const joinedChannel = await channelService.joinChannel(channelId);
            message.success('Successfully joined channel!');

            // Add to local channels list
            if (!channels.find(c => c.id === joinedChannel.id)) {
                setChannels([...channels, joinedChannel]);
            }

            // Update the public channels list to show joined status
            setPublicChannels(prev =>
                prev.map(c => c.id === channelId ? { ...c, isMember: true } : c)
            );

            // Navigate to the channel
            onClose();
            router.push(`/chat/${channelId}`);
        } catch (error) {
            console.error('Failed to join channel:', error);
            message.error('Failed to join channel');
        } finally {
            setJoiningId(null);
        }
    };

    return (
        <Modal
            title={<Title level={5} style={{ margin: 0 }}>Browse Channels</Title>}
            open={open}
            onCancel={onClose}
            footer={null}
            width={480}
        >
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                    <Spin />
                </div>
            ) : publicChannels.length === 0 ? (
                <Empty description="No public channels available" />
            ) : (
                <List
                    dataSource={publicChannels}
                    renderItem={(channel) => (
                        <List.Item
                            style={{ padding: '12px 0' }}
                            actions={[
                                channel.isMember ? (
                                    <Button
                                        type="text"
                                        disabled
                                        key="joined"
                                    >
                                        Joined
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        size="small"
                                        loading={joiningId === channel.id}
                                        onClick={() => handleJoin(channel.id)}
                                        key="join"
                                    >
                                        Join
                                    </Button>
                                )
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<NumberOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />}
                                title={<Text strong>{channel.name}</Text>}
                                description={
                                    <div>
                                        {channel.description && (
                                            <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                                                {channel.description}
                                            </Text>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                                            <TeamOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {channel.memberCount} member{channel.memberCount !== 1 ? 's' : ''}
                                            </Text>
                                        </div>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
            )}
        </Modal>
    );
}
