"use client";

import React, { useState } from 'react';
import { Input, Button, Tooltip, theme } from 'antd';
import {
    SendOutlined,
    PaperClipOutlined,
    SmileOutlined,
    BoldOutlined
} from '@ant-design/icons';
import { streamClient } from '@/services/streamClient';
import { messageService } from '@/services/messageService';
import { useChatStore } from '@/store/chatStore';
import { useAuth } from '@/context/AuthContext';

const { TextArea } = Input;

interface MessageInputProps {
    channelId: string;
}

export default function MessageInput({ channelId }: MessageInputProps) {
    const { token } = theme.useToken();
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const { channels, addMessage } = useChatStore();
    const { user } = useAuth();

    const channel = channels.find(c => c.id === channelId);
    const placeholder = channel?.type === 'DM'
        ? 'Type a message...'
        : `Message #${channel?.name || 'channel'}`;

    const handleSend = async () => {
        if (!content.trim() || sending || !user) return;

        const messageContent = content.trim();
        setContent('');
        setSending(true);

        // Create optimistic message
        const optimisticMessage = {
            id: `temp-${Date.now()}`,
            channelId,
            userId: user.id,
            content: messageContent,
            type: 'text',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: {
                id: user.id,
                name: user.name,
                workEmail: user.workEmail || ''
            }
        };

        // Add to UI instantly
        addMessage(channelId, optimisticMessage);

        // Broadcast to other users via WebSocket
        streamClient.sendMessage(messageContent, user.id, user.name);

        // Save to database
        try {
            console.log('>>> Saving message to API:', messageContent);
            const savedMessage = await messageService.sendMessage(channelId, messageContent);
            console.log('>>> Message saved successfully:', savedMessage);
        } catch (error) {
            console.error('>>> Failed to send message:', error);
            setContent(messageContent);
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{ padding: '12px 20px 20px', background: token.colorBgLayout }}>
            <div style={{
                border: `1px solid ${token.colorBorder}`,
                borderRadius: 8,
                backgroundColor: token.colorBgContainer,
                overflow: 'hidden',
                transition: 'border-color 0.2s'
            }}
                className="message-input-container"
            >
                <div style={{ padding: '12px 12px 0' }}>
                    <TextArea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        bordered={false}
                        style={{
                            resize: 'none',
                            padding: 0,
                            fontSize: 14
                        }}
                    />
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderTop: `1px solid ${token.colorBorderSecondary}`
                }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <Tooltip title="Bold">
                            <Button type="text" size="small" icon={<BoldOutlined />} />
                        </Tooltip>
                        <Tooltip title="Attach file">
                            <Button type="text" size="small" icon={<PaperClipOutlined />} />
                        </Tooltip>
                        <Tooltip title="Emoji">
                            <Button type="text" size="small" icon={<SmileOutlined />} />
                        </Tooltip>
                    </div>

                    <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        disabled={!content.trim() || sending}
                        loading={sending}
                    />
                </div>
            </div>

            <style jsx global>{`
                .message-input-container:focus-within {
                    border-color: ${token.colorPrimary} !important;
                }
            `}</style>
        </div>
    );
}
