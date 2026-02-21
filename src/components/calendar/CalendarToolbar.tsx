"use client";

import React from 'react';
import { Button, Radio, Space, Typography, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, FilterOutlined, PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { Title } = Typography;

interface CalendarToolbarProps {
    view: 'month' | 'week' | 'day';
    onViewChange: (view: 'month' | 'week' | 'day') => void;
    onNavigate: (direction: 'prev' | 'next' | 'today') => void;
    currentDateRange: string;
    onCreateEvent: () => void;
}

export default function CalendarToolbar({
    view,
    onViewChange,
    onNavigate,
    currentDateRange,
    onCreateEvent
}: CalendarToolbarProps) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0'
        }}>
            <Space size="middle">
                <Title level={4} style={{ margin: 0 }}>Calendar</Title>
                <Button onClick={() => onNavigate('today')}>Today</Button>
                <Space size="small">
                    <Button icon={<LeftOutlined />} onClick={() => onNavigate('prev')} type="text" />
                    <Button icon={<RightOutlined />} onClick={() => onNavigate('next')} type="text" />
                </Space>
                <Title level={5} style={{ margin: 0, fontWeight: 500 }}>{currentDateRange}</Title>
            </Space>

            <Space size="middle">
                <Radio.Group value={view} onChange={(e) => onViewChange(e.target.value)} buttonStyle="solid">
                    <Radio.Button value="month">Month</Radio.Button>
                    <Radio.Button value="week">Week</Radio.Button>
                    <Radio.Button value="day">Day</Radio.Button>
                </Radio.Group>

                {/* <Tooltip title="Workload (Coming Soon)">
                    <Space>
                        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>Workload</span>
                        <div style={{ width: '32px', height: '16px', background: '#f5f5f5', borderRadius: '8px' }} />
                    </Space>
                </Tooltip> */}

                {/* <Button icon={<FilterOutlined />}>Filter</Button> */}
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onCreateEvent}
                    style={{ borderRadius: '6px' }}
                >
                    Create Event
                </Button>
            </Space>
        </div>
    );
}
