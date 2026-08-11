"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import { useActivitySource } from '@/hooks/useActivitySource';
import React, { useEffect, useState, useCallback } from 'react';
import { Layout, Typography, Button, message, theme } from 'antd';
import {
    VideoCameraOutlined,
    PhoneOutlined,
    InfoCircleOutlined,
    NumberOutlined,
    UserOutlined
} from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useAuth } from '@/context/AuthContext';
import { streamClient } from '@/services/streamClient';
import { messageService } from '@/services/messageService';
import MessageList from '@/features/chat/MessageList';
import MessageInput from '@/features/chat/MessageInput';
import { useMessages } from '@/hooks/useMessages';
import ChannelSettingsModal from '@/features/chat/ChannelSettingsModal';
import { usePermission } from '@/hooks/usePermission';


const { Header, Content } = Layout;
const { Text } = Typography;

export default function ChannelPage() {
  useActivitySource({ section: "HOME", module: "Messages", page: "MessagesView" });
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const channelId = params.channelId as string;
    const { setActiveChannel, setMessages, channels } = useChatStore();
    const { token } = theme.useToken();
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const channel = channels.find(c => c.id === channelId);
    const currentUserId = user?.id;

    // Get display name for DMs - show the OTHER person's name
    const getChannelDisplayName = () => {
        if (!channel) return 'Loading...';
        if (channel.type === 'DM' && channel.members && currentUserId) {
            const otherMember = channel.members.find((m: any) => m.userId !== currentUserId && m.user);
            return otherMember?.user?.name || channel.name || 'Direct Message';
        }
        return channel.name || 'Channel';
    };

    // Stable callback for notifications
    const handleNewMessage = useCallback((userName: string, content: string) => {
        message.info(`${userName}: ${content.substring(0, 50)}`);
    }, []);

    // Stable callback for connection status
    const handleConnectionChange = useCallback((isConnected: boolean) => {
        setConnected(isConnected);
    }, []);

    const { data: messages, isLoading: messagesLoading } = useMessages(channelId);

    const { canCreateChat } = usePermission();

    // Sync messages to store when loaded
    useEffect(() => {
        if (messages) {
            setMessages(channelId, messages);
            setLoading(false);
        }
    }, [messages, channelId, setMessages]);

    useEffect(() => {
        if (!channelId || !user?.id) return;

        setActiveChannel(channelId);

        // Set up stream client (only once per channelId change)
        streamClient.setCurrentUser(user.id);
        streamClient.onNewMessage(handleNewMessage);
        streamClient.onConnection(handleConnectionChange);
        streamClient.connect('channel', channelId);

        return () => {
            streamClient.disconnect();
        };
    }, [channelId, user?.id, setActiveChannel, handleNewMessage, handleConnectionChange]);

    const handleMeet = async () => {
        const roomId = `meet-${Date.now()}`;
        router.push(`/room/${roomId}/lobby`);
    };

    return (
        <Layout style={{ height: '100%', background: token.colorBgContainer }}>
            {/* Channel header */}
            <Header style={{
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                padding: '0 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                height: 56
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {channel?.type === 'DM' ? (
                        <UserOutlined style={{ fontSize: 16, color: token.colorTextSecondary }} />
                    ) : (
                        <NumberOutlined style={{ fontSize: 16, color: token.colorTextSecondary }} />
                    )}
                    <Text strong style={{ fontSize: 16, color: token.colorText }}>
                        {getChannelDisplayName()}
                    </Text>
                    {/* Connection status indicator - green dot when connected */}
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: connected ? '#52c41a' : '#d9d9d9',
                            display: 'inline-block',
                            marginLeft: 4,
                            transition: 'background-color 0.3s'
                        }}
                        title={connected ? 'Connected' : 'Disconnected'}
                    />
                </div>

                {/* <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="text" icon={<PhoneOutlined />} />
                    <Button
                        type="primary"
                        icon={<VideoCameraOutlined />}
                        onClick={handleMeet}
                    >
                        Meet
                    </Button>
                    <Button
                        type="text"
                        icon={<InfoCircleOutlined />}
                        onClick={() => setSettingsOpen(true)}
                    />
                </div> */}
            </Header>

            {/* Messages area */}
            <Content style={{
                display: 'flex',
                flexDirection: 'column',
                background: token.colorBgLayout,
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <LoadingSpinner fullScreen={false} />
                    </div>
                ) : (
                    <MessageList channelId={channelId} />
                )}
                {canCreateChat && <MessageInput channelId={channelId} />}
            </Content>

            <ChannelSettingsModal
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                channelId={channelId}
            />
        </Layout>
    );
}