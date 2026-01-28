"use client";

import React, { useState } from 'react';
import { Typography, Input, Button, Switch, message } from 'antd';
import { useRouter } from 'next/navigation';
import { channelService } from '@/services/channelService';
import { useChatStore } from '@/store/chatStore';
import { NumberOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CreateChannelPage() {
    const router = useRouter();
    const { setChannels, channels } = useChatStore();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            message.error('Channel name is required');
            return;
        }

        setCreating(true);
        try {
            const newChannel = await channelService.createChannel({
                name: name.trim(),
                description: description.trim() || undefined,
                type: isPrivate ? 'GROUP' : 'CHANNEL'
            });

            setChannels([...channels, newChannel]);
            message.success('Channel created!');
            router.push(`/chat/${newChannel.id}`);
        } catch (error) {
            console.error('Failed to create channel:', error);
            message.error('Failed to create channel');
            setCreating(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#fff'
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <Title level={5} style={{ margin: 0 }}>Create Channel</Title>
            </div>

            {/* Form */}
            <div style={{ padding: '24px 20px', maxWidth: 480 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                    Channels are where your team communicates. They're best when organized around a topic.
                </Text>

                {/* Name input */}
                <div style={{ marginBottom: 20 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Name</Text>
                    <Input
                        prefix={isPrivate ? <LockOutlined style={{ color: '#8c8c8c' }} /> : <NumberOutlined style={{ color: '#8c8c8c' }} />}
                        placeholder="e.g. general"
                        value={name}
                        onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        maxLength={80}
                    />
                </div>

                {/* Description input */}
                <div style={{ marginBottom: 20 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                        Description <Text type="secondary">(optional)</Text>
                    </Text>
                    <TextArea
                        placeholder="What's this channel about?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                    />
                </div>

                {/* Private toggle */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 24,
                    padding: '16px',
                    background: '#fafafa',
                    borderRadius: 8,
                    border: '1px solid #f0f0f0'
                }}>
                    <div>
                        <Text strong style={{ display: 'block' }}>Make private</Text>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Only invited members can see this channel.
                        </Text>
                    </div>
                    <Switch checked={isPrivate} onChange={setIsPrivate} />
                </div>

                {/* Create button */}
                <Button
                    type="primary"
                    size="large"
                    onClick={handleCreate}
                    loading={creating}
                    disabled={!name.trim()}
                >
                    Create Channel
                </Button>
            </div>
        </div>
    );
}
