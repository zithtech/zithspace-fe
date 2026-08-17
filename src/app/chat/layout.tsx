"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useState } from 'react';
import { Layout, Button, Typography, Tooltip, message, theme } from 'antd';
import { PlusOutlined, EditOutlined, AppstoreOutlined, VideoCameraOutlined } from '@ant-design/icons';
import ChannelList from '@/features/chat/ChannelList';
import BrowseChannelsModal from '@/features/chat/BrowseChannelsModal';
import { CallModal } from '@/features/calls/CallModal';
import MainLayout from '@/components/layout/MainLayout';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { channelService } from '@/services/channelService';
import { streamClient } from '@/services/streamClient';
import { usePermission } from '@/hooks/usePermission';

const { Sider } = Layout;
const { Title } = Typography;

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { setChannels, channels } = useChatStore();
    const { token } = theme.useToken();
    const { canCreateChat, canReadChat } = usePermission();
    const [loading, setLoading] = useState(true);
    const [browseOpen, setBrowseOpen] = useState(false);

    useEffect(() => {
        if (!canReadChat) return;
        const loadChannels = async () => {
            try {
                const data = await channelService.getChannels();
                setChannels(data);
            } catch (error) {
                console.error('Failed to load channels:', error);
            } finally {
                setLoading(false);
            }
        };
        loadChannels();
    }, [setChannels]);

    // Refresh channels periodically or when window gains focus
    useEffect(() => {
        const handleFocus = async () => {
            try {
                const data = await channelService.getChannels();
                setChannels(data);
            } catch (error) {
                console.error('Failed to refresh channels:', error);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [setChannels]);

    return (
        <MainLayout>
            <Layout style={{ height: 'calc(100vh - 64px)' }}>
                {/* Sidebar */}
                <Sider
                    width={280}
                    style={{
                        background: token.colorBgContainer,
                        borderRight: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '16px',
                        borderBottom: `1px solid ${token.colorBorderSecondary}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Title level={5} style={{ margin: 0, color: token.colorText }}>
                            ZithConnect
                        </Title>
                        <div style={{ display: 'flex', gap: 4 }}>
                            <Tooltip title="Browse channels">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<AppstoreOutlined />}
                                    onClick={() => setBrowseOpen(true)}
                                />
                            </Tooltip>
                            {canCreateChat && (
                                <Tooltip title="New message">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<EditOutlined />}
                                        onClick={() => router.push('/chat/new')}
                                    />
                                </Tooltip>
                            )}
                            {canCreateChat && (
                                <Tooltip title="Create channel">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={() => router.push('/chat/create')}
                                    />
                                </Tooltip>
                            )}
                            {/* <Tooltip title="Start Meeting">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<VideoCameraOutlined />}
                                    onClick={async () => {
                                        try {
                                            const { callService } = await import('@/services/callService');
                                            const { useMediaStore } = await import('@/store/mediaStore');

                                            useMediaStore.getState().setCallStatus('connecting');
                                            const session = await callService.createSession();
                                            useMediaStore.getState().setSessionId(session.sessionId);

                                            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                                            useMediaStore.getState().setLocalStream(stream);

                                            // Initialize peer connection
                                            await callService.initializePeerConnection(session.sessionDescription);

                                            // Add local tracks
                                            stream.getTracks().forEach(track => callService.addTrack(track));

                                            await callService.connect();
                                            useMediaStore.getState().setCallStatus('connected');
                                        } catch (error) {
                                            console.error('Failed to start call:', error);
                                            const { useMediaStore } = await import('@/store/mediaStore');
                                            useMediaStore.getState().setCallStatus('error');
                                            message.error('Failed to start meeting');
                                        }
                                    }}
                                />
                            </Tooltip> */}
                        </div>
                    </div>

                    {/* Channel list */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                                <ZukvoLoader size="sm" />
                            </div>
                        ) : (
                            <ChannelList />
                        )}
                    </div>
                </Sider>

                {/* Main content area */}
                <Layout style={{ background: token.colorBgContainer }}>
                    {children}
                </Layout>
            </Layout>

            {/* Browse Channels Modal */}
            <BrowseChannelsModal
                open={browseOpen}
                onClose={() => setBrowseOpen(false)}
            />

            {/* Active Call Modal */}
            <CallModal />
        </MainLayout>
    );
}
