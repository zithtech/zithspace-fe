"use client";

import React, { useEffect, useRef } from 'react';
import { useMediaStore } from '@/store/mediaStore';
import { useRoomStore } from '@/store/roomStore';
import { Typography } from 'antd';

const { Text } = Typography;

export default function VideoGrid() {
    const { localStream } = useMediaStore();
    const { participants } = useRoomStore();
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 16,
            height: '100%'
        }}>
            {/* Local Video */}
            <div style={{
                background: '#333',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '16/9'
            }}>
                <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                    position: 'absolute',
                    bottom: 16, left: 16,
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 8px',
                    borderRadius: 4
                }}>
                    <Text style={{ color: '#fff' }}>You</Text>
                </div>
            </div>

            {/* Remote Participants */}
            {participants.map(p => (
                <div key={p.userId} style={{
                    background: '#333',
                    borderRadius: 8,
                    overflow: 'hidden',
                    position: 'relative',
                    aspectRatio: '16/9'
                }}>
                    {/* Remote video placeholder */}
                    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff' }}>
                        {p.name}
                    </div>
                </div>
            ))}
        </div>
    );
}
