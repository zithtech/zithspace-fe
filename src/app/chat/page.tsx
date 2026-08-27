"use client";

import { useActivitySource } from '@/hooks/useActivitySource';
import React from 'react';
import { Empty, Typography } from 'antd';
import NoData from "@/components/common/NoData";

const { Text } = Typography;

export default function ChatPage() {
  useActivitySource({ section: "HOME", module: "Messages", page: "MessagesView" });
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            flexDirection: 'column'
        }}>
            <NoData />
            <Text type="secondary" style={{ marginTop: 16 }}>
                Select a channel to start chatting
            </Text>
        </div>
    );
}