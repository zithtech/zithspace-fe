"use client";

import React, { useEffect, useRef } from 'react';
import { Button, Card, Typography, Space } from 'antd';
import { AudioOutlined, AudioMutedOutlined, VideoCameraOutlined, VideoCameraAddOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { useMediaStore } from '@/store/mediaStore';
import { useRoomStore } from '@/store/roomStore';

const { Title, Text } = Typography;

export default function LobbyPage() {
    const router = useRouter();
    const params = useParams();
    const roomId = params.roomId as string;

    const videoRef = useRef<HTMLVideoElement>(null);
    const { micEnabled, camEnabled, toggleMic, toggleCam, setLocalStream, localStream } = useMediaStore();
    const { joinRoom } = useRoomStore();

    useEffect(() => {
        const startStream = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                });
                setLocalStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("Error accessing media devices:", err);
            }
        };

        startStream();

        return () => {
            // Don't stop stream here, pass it to the meeting
        };
    }, [setLocalStream]);

    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => track.enabled = micEnabled);
            localStream.getVideoTracks().forEach(track => track.enabled = camEnabled);
        }
    }, [micEnabled, camEnabled, localStream]);

    const handleJoin = () => {
        joinRoom(roomId);
        router.push(`/room/${roomId}`);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            background: '#f0f2f5'
        }}>
            <Card style={{ width: 600, textAlign: 'center' }}>
                <Title level={3}>Ready to join?</Title>

                <div style={{
                    width: '100%',
                    height: 300,
                    background: '#000',
                    margin: '24px 0',
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: camEnabled ? 'block' : 'none' }}
                    />
                    {!camEnabled && (
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            color: '#fff'
                        }}>
                            Camera is off
                        </div>
                    )}
                </div>

                <Space size="large" style={{ marginBottom: 24 }}>
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
                </Space>

                <div>
                    <Button type="primary" size="large" onClick={handleJoin} style={{ width: 200 }}>
                        Join now
                    </Button>
                </div>
            </Card>
        </div>
    );
}
