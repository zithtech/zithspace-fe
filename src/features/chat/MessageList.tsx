"use client";

import React, { useEffect, useRef } from 'react';
import { List, Avatar, Typography } from 'antd';
import { useChatStore } from '@/store/chatStore';

const { Text } = Typography;

interface MessageListProps {
    channelId: string;
}

export default function MessageList({ channelId }: MessageListProps) {
    // Use specific selector to ensure React re-renders on changes
    const channelMessages = useChatStore((state) => state.messages[channelId] || []);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Debug log to verify messages are updating
    useEffect(() => {
        console.log('MessageList render - messages count:', channelMessages.length);
    }, [channelMessages]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [channelMessages.length]);

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <List
                itemLayout="horizontal"
                dataSource={channelMessages}
                rowKey={(msg) => msg.id}
                renderItem={(msg) => (
                    <List.Item style={{ border: 'none', padding: '4px 16px' }} className="message-item">
                        <List.Item.Meta
                            avatar={
                                <Avatar
                                    shape="square"
                                    size={36}
                                    style={{ marginTop: 4, borderRadius: 4 }}
                                >
                                    {msg.user?.name?.[0] || 'U'}
                                </Avatar>
                            }
                            title={
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                                    <Text strong style={{ fontSize: 15 }}>{msg.user?.name || 'Unknown User'}</Text>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </div>
                            }
                            description={
                                <div style={{ color: '#1d1c1d', fontSize: 15, lineHeight: '1.46668' }}>
                                    {msg.content}
                                </div>
                            }
                        />
                    </List.Item>
                )}
            />
            <style jsx global>{`
                .message-item:hover {
                    background-color: #f8f8f8;
                }
            `}</style>
            <div ref={bottomRef} />
        </div>
    );
}
