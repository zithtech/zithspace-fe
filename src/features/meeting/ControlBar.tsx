"use client";

import React from 'react';
import { Button, Space } from 'antd';
import {
    AudioOutlined,
    AudioMutedOutlined,
    VideoCameraOutlined,
    VideoCameraAddOutlined,
    PhoneOutlined,
    DesktopOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useMediaStore } from '@/store/mediaStore';
import { useRoomStore } from '@/store/roomStore';

export default function ControlBar() {
    const router = useRouter();
    const { micEnabled, camEnabled, toggleMic, toggleCam } = useMediaStore();
    const { leaveRoom } = useRoomStore();

    const handleLeave = () => {
        leaveRoom();
        // Go back to chat
        router.back();
    };

    return (
        <div style={{
            height: 64,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderTop: '1px solid #333'
        }}>
            <Space size="middle">
                <Button
                    shape="circle"
                    size="large"
                    icon={micEnabled ? <AudioOutlined /> : <AudioMutedOutlined />}
                    danger={!micEnabled}
                    onClick={toggleMic}
                />
                <Button
                    shape="circle"
                    size="large"
                    icon={camEnabled ? <VideoCameraOutlined /> : <VideoCameraAddOutlined />}
                    danger={!camEnabled}
                    onClick={toggleCam}
                />
                <Button
                    shape="circle"
                    size="large"
                    icon={<DesktopOutlined />}
                />
                <Button
                    type="primary"
                    danger
                    shape="round"
                    size="large"
                    icon={<PhoneOutlined />}
                    onClick={handleLeave}
                >
                    Leave
                </Button>
            </Space>
        </div>
    );
}
