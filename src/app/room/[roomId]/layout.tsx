"use client";

import React from 'react';
import { Layout } from 'antd';

export default function RoomLayout({ children }: { children: React.ReactNode }) {
    return (
        <Layout style={{ height: '100vh', background: '#000' }}>
            {children}
        </Layout>
    );
}
