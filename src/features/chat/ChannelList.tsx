"use client";

import React, { useState } from 'react';
import { Typography, Tooltip, theme } from 'antd';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import {
    CaretRightOutlined,
    CaretDownOutlined,
    NumberOutlined,
    LockOutlined,
    PlusOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export default function ChannelList() {
    const router = useRouter();
    const { user } = useAuth();
    const { canCreateChat } = usePermission();
    const { channels, activeChannelId } = useChatStore();
    const { token } = theme.useToken();
    const [channelsExpanded, setChannelsExpanded] = useState(true);
    const [dmsExpanded, setDmsExpanded] = useState(true);

    const currentUserId = user?.id;

    // Group channels
    const publicChannels = channels.filter(c => c.type === 'CHANNEL');
    const privateGroups = channels.filter(c => c.type === 'GROUP');
    const dms = channels.filter(c => c.type === 'DM');

    const getDmName = (channel: any) => {
        if (channel.members && channel.members.length > 0 && currentUserId) {
            // Find the OTHER user (not the current user)
            const otherMember = channel.members.find((m: any) => m.userId !== currentUserId && m.user);
            return otherMember?.user?.name || channel.name || 'Direct Message';
        }
        return channel.name || 'Direct Message';
    };

    const renderChannelItem = (channel: any, showHash = true) => {
        const isActive = channel.id === activeChannelId;
        const displayName = channel.type === 'DM' ? getDmName(channel) : channel.name;

        return (
            <div
                key={channel.id}
                onClick={() => router.push(`/chat/${channel.id}`)}
                style={{
                    padding: '8px 16px 8px 24px',
                    cursor: 'pointer',
                    backgroundColor: isActive ? token.colorPrimaryBg : 'transparent',
                    color: isActive ? token.colorPrimary : token.colorText,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    borderRadius: 0,
                    borderRight: isActive ? `2px solid ${token.colorPrimary}` : '2px solid transparent'
                }}
                className="channel-item"
            >
                {showHash && channel.type === 'CHANNEL' && (
                    <NumberOutlined style={{ fontSize: 14, color: token.colorTextSecondary }} />
                )}
                {showHash && channel.type === 'GROUP' && (
                    <LockOutlined style={{ fontSize: 14, color: token.colorTextSecondary }} />
                )}
                {channel.type === 'DM' && (
                    <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#52c41a',
                        marginRight: 4
                    }} />
                )}
                <Text
                    ellipsis
                    style={{
                        color: 'inherit',
                        maxWidth: 200,
                        fontWeight: isActive ? 500 : 400
                    }}
                >
                    {displayName}
                </Text>
            </div>
        );
    };

    const SectionHeader = ({
        title,
        expanded,
        onToggle,
        onAdd
    }: {
        title: string;
        expanded: boolean;
        onToggle: () => void;
        onAdd?: () => void;
    }) => (
        <div
            style={{
                padding: '12px 16px 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
            }}
            className="section-header"
        >
            <div
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={onToggle}
            >
                {expanded ? (
                    <CaretDownOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                ) : (
                    <CaretRightOutlined style={{ fontSize: 10, color: token.colorTextSecondary }} />
                )}
                <Text strong style={{ color: token.colorTextSecondary, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {title}
                </Text>
            </div>
            {onAdd && (
                <Tooltip title={`Add ${title.toLowerCase()}`}>
                    <PlusOutlined
                        style={{ color: token.colorTextSecondary, fontSize: 12, cursor: 'pointer' }}
                        onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    />
                </Tooltip>
            )}
        </div>
    );

    return (
        <div style={{ paddingTop: 8 }}>
            {/* Channels Section */}
            <SectionHeader
                title="Channels"
                expanded={channelsExpanded}
                onToggle={() => setChannelsExpanded(!channelsExpanded)}
                onAdd={canCreateChat ? () => router.push('/chat/create') : undefined}
            />
            {channelsExpanded && (
                <div>
                    {publicChannels.map(c => renderChannelItem(c))}
                    {privateGroups.map(c => renderChannelItem(c))}
                    {publicChannels.length === 0 && privateGroups.length === 0 && (
                        <Text
                            style={{
                                color: token.colorTextTertiary,
                                padding: '8px 24px',
                                display: 'block',
                                fontSize: 13
                            }}
                        >
                            No channels yet
                        </Text>
                    )}
                </div>
            )}

            {/* Direct Messages Section */}
            <SectionHeader
                title="Direct Messages"
                expanded={dmsExpanded}
                onToggle={() => setDmsExpanded(!dmsExpanded)}
                onAdd={canCreateChat ? () => router.push('/chat/new') : undefined}
            />
            {dmsExpanded && (
                <div>
                    {dms.map(c => renderChannelItem(c, false))}
                    {dms.length === 0 && (
                        <Text
                            style={{
                                color: token.colorTextTertiary,
                                padding: '8px 24px',
                                display: 'block',
                                fontSize: 13
                            }}
                        >
                            No messages yet
                        </Text>
                    )}
                </div>
            )}

            <style jsx global>{`
                .channel-item:hover {
                    background-color: ${token.colorFillTertiary} !important;
                }
                .section-header:hover {
                    background-color: ${token.colorFillAlter};
                }
            `}</style>
        </div>
    );
}
