import React, { useEffect, useRef } from 'react';
import { Modal, Button, Row, Col } from 'antd';
import { AudioOutlined, AudioMutedOutlined, VideoCameraOutlined, VideoCameraAddOutlined, PhoneOutlined } from '@ant-design/icons';
import { useMediaStore } from '@/store/mediaStore';
import { callService } from '@/services/callService';

const VideoTrack = ({ track }: { track: MediaStreamTrack }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && track) {
            const stream = new MediaStream([track]);
            videoRef.current.srcObject = stream;
        }
    }, [track]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, background: '#000' }}
        />
    );
};

export const CallModal = () => {
    const {
        callStatus,
        localStream,
        remoteTracks,
        micEnabled,
        camEnabled,
        toggleMic,
        toggleCam,
        resetCall
    } = useMediaStore();

    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const handleEndCall = () => {
        callService.endCall();
        resetCall();
        // Stop local tracks
        localStream?.getTracks().forEach(track => track.stop());
    };



    return (
        <Modal
            open={callStatus !== 'idle'}
            footer={null}
            closable={false}
            width={800}
            centered
            maskClosable={false}
            bodyStyle={{ padding: 0, height: '60vh', background: '#1f1f1f', overflow: 'hidden' }}
        >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Video Grid */}
                <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
                    <Row gutter={[16, 16]} style={{ height: '100%' }}>
                        {/* Local Video */}
                        <Col span={remoteTracks.size > 0 ? 8 : 24} style={{ height: remoteTracks.size > 0 ? '200px' : '100%' }}>
                            <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, background: '#000' }}
                                />
                                <div style={{ position: 'absolute', bottom: 8, left: 8, color: 'white', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: 4 }}>
                                    You
                                </div>
                            </div>
                        </Col>

                        {/* Remote Videos */}
                        {Array.from(remoteTracks.values()).map((track) => (
                            <Col key={track.id} span={8} style={{ height: '200px' }}>
                                <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                                    <VideoTrack track={track} />
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* Controls */}
                <div style={{ padding: 16, background: '#141414', display: 'flex', justifyContent: 'center', gap: 16 }}>
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
                        type="primary"
                        danger
                        icon={<PhoneOutlined />}
                        onClick={handleEndCall}
                    />
                </div>
            </div>
        </Modal>
    );
};
