"use client";

import React from 'react';
import { List, Avatar, Typography, Badge } from 'antd';
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';
import { useRoomStore } from '@/store/roomStore';

const { Text } = Typography;

export default function ParticipantList() {
    const { participants } = useRoomStore();

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
                <Text strong>Participants ({participants.length})</Text>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                <List
                    dataSource={participants}
                    renderItem={(item) => (
                        <List.Item style={{ padding: '12px 16px', border: 'none' }}>
                            <List.Item.Meta
                                avatar={<Avatar>{item.name[0]}</Avatar>}
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text>{item.name}</Text>
                                        {item.hasAudio ? <AudioOutlined style={{ color: '#52c41a' }} /> : <AudioMutedOutlined style={{ color: '#ff4d4f' }} />}
                                    </div>
                                }
                                description={<Text type="secondary" style={{ fontSize: 12 }}>{item.role}</Text>}
                            />
                        </List.Item>
                    )}
                />
            </div>
        </div>
    );
}
