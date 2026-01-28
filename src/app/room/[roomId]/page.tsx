"use client";

import React, { useEffect } from 'react';
import { CallModal } from '@/features/calls/CallModal';
import { useMediaStore } from '@/store/mediaStore';
import { callService } from '@/services/callService';
import { useParams } from 'next/navigation';

export default function RoomPage() {
    const params = useParams();
    const roomId = params.roomId as string;
    const { setSessionId, setCallStatus } = useMediaStore();

    useEffect(() => {
        if (roomId) {
            // In a real app, we'd validate the room ID and join the session
            // For now, we'll just set the session ID and open the modal
            setSessionId(roomId);
            setCallStatus('connected'); // Or 'connecting' if we had a join flow
        }
    }, [roomId, setSessionId, setCallStatus]);

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <CallModal />
        </div>
    );
}
