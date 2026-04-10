"use client";

import React from 'react';
import { Button, Radio, Space, Typography, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, SyncOutlined, PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;

interface CalendarToolbarProps {
    view: 'month' | 'week' | 'day';
    onViewChange: (view: 'month' | 'week' | 'day') => void;
    onNavigate: (direction: 'prev' | 'next' | 'today') => void;
    currentDateRange: string;
    onCreateEvent: () => void;
    provider?: string | null;
    providerInfo?: any;
    onSync?: () => void;
    syncing?: boolean;
}

export default function CalendarToolbar({
    view,
    onViewChange,
    onNavigate,
    currentDateRange,
    onCreateEvent,
    provider,
    providerInfo,
    onSync,
    syncing
}: CalendarToolbarProps) {
    return (
        <div className="calendar-toolbar">
            <div className="toolbar-left">
                <div className="title-group">
                    <Title level={4} className="toolbar-title">
                        Calendar
                    </Title>
                    <div className="title-divider" />
                </div>
                
                <div className="nav-group">
                    <Button 
                        onClick={() => onNavigate('today')}
                        className="btn-today"
                    >
                        Today
                    </Button>
                    <div className="btn-nav-controls">
                        <Button 
                            icon={<LeftOutlined style={{ fontSize: '11px' }} />} 
                            onClick={() => onNavigate('prev')} 
                            type="text" 
                            className="btn-nav"
                        />
                        <Button 
                            icon={<RightOutlined style={{ fontSize: '11px' }} />} 
                            onClick={() => onNavigate('next')} 
                            type="text" 
                            className="btn-nav"
                        />
                    </div>
                </div>
                
                <Title level={5} className="current-range">
                    {currentDateRange}
                </Title>
            </div>

            <div className="toolbar-right">
                {providerInfo && provider && (
                    <div className="sync-badge-group">
                        <div className="provider-badge" style={{ 
                            background: providerInfo.color + '0a', 
                            border: `1px solid ${providerInfo.color}20` 
                        }}>
                            <div className="provider-icon" style={{ color: providerInfo.color }}>
                                {providerInfo.icon}
                            </div>
                            <Text className="provider-name" style={{ color: providerInfo.color }}>
                                {providerInfo.name}
                            </Text>
                        </div>
                        
                        <Tooltip title="Sync Calendar">
                            <Button 
                                type="text"
                                onClick={onSync}
                                loading={syncing}
                                className="btn-sync"
                                icon={!syncing && <SyncOutlined style={{ fontSize: '12px' }} />}
                            >
                                {syncing ? '...' : 'Sync'}
                            </Button>
                        </Tooltip>
                    </div>
                )}

                <Radio.Group 
                    value={view} 
                    onChange={(e) => onViewChange(e.target.value)} 
                    buttonStyle="solid"
                    className="view-switcher"
                >
                    <Radio.Button value="month">Month</Radio.Button>
                    <Radio.Button value="week">Week</Radio.Button>
                    <Radio.Button value="day">Day</Radio.Button>
                </Radio.Group>

                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={onCreateEvent}
                    className="btn-create"
                >
                    <span>Event</span>
                </Button>
            </div>

            <style jsx global>{`
                .calendar-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #fff;
                    border-bottom: 1px solid #f1f5f9;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                    flex-wrap: wrap;
                    gap: 16px;
                }

                .toolbar-left, .toolbar-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }

                .title-group {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .toolbar-title {
                    margin: 0 !important;
                    font-weight: 800 !important;
                    letter-spacing: -0.03em !important;
                    color: #0f172a !important;
                    font-size: 1.1rem !important;
                }

                .title-divider {
                    height: 20px;
                    width: 1px;
                    background: #e2e8f0;
                }

                .nav-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .btn-today {
                    border-radius: 8px !important;
                    font-weight: 600 !important;
                    color: #475569 !important;
                    border: 1px solid #e2e8f0 !important;
                    font-size: 13px !important;
                    height: 34px !important;
                }

                .btn-nav-controls {
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 2px;
                    border: 1px solid #e2e8f0;
                    display: flex;
                }

                .btn-nav {
                    height: 30px !important;
                    width: 30px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    color: #64748b !important;
                    border-radius: 6px !important;
                }

                .current-range {
                    margin: 0 !important;
                    font-weight: 700 !important;
                    color: #334155 !important;
                    font-size: 0.95rem !important;
                    white-space: nowrap;
                }

                .sync-badge-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .provider-badge {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 10px;
                    border-radius: 20px;
                }

                .provider-icon {
                    display: flex;
                    align-items: center;
                    font-size: 14px;
                }

                .provider-name {
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .btn-sync {
                    height: 30px !important;
                    border-radius: 15px !important;
                    background: #f8fafc !important;
                    border: 1px solid #e2e8f0 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    padding: 0 12px !important;
                    color: #64748b !important;
                    text-transform: uppercase;
                }

                .view-switcher {
                    background: #f1f5f9 !important;
                    padding: 3px !important;
                    border-radius: 10px !important;
                    display: flex !important;
                }

                .view-switcher .ant-radio-button-wrapper {
                    height: 28px !important;
                    line-height: 28px !important;
                    border-radius: 7px !important;
                    border: none !important;
                    background: transparent !important;
                    color: #64748b !important;
                    font-weight: 600 !important;
                    font-size: 12px !important;
                    padding: 0 12px !important;
                    transition: all 0.2s !important;
                }

                .view-switcher .ant-radio-button-wrapper:before {
                    display: none !important;
                }

                .view-switcher .ant-radio-button-wrapper-checked {
                    background: #fff !important;
                    color: #1e293b !important;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
                }

                .btn-create {
                    border-radius: 10px !important;
                    height: 38px !important;
                    font-weight: 700 !important;
                    padding: 0 18px !important;
                    background: #3b82f6 !important;
                    border: none !important;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25) !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 8px !important;
                }

                @media (max-width: 1100px) {
                    .provider-name {
                        display: none;
                    }
                    .provider-badge {
                        padding: 4px 6px;
                    }
                }

                @media (max-width: 900px) {
                    .calendar-toolbar {
                        padding: 10px 16px;
                    }
                    .toolbar-left {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .toolbar-right {
                        width: 100%;
                        justify-content: space-between;
                    }
                    .title-group {
                        display: none;
                    }
                }

                @media (max-width: 600px) {
                    .current-range {
                        font-size: 0.85rem !important;
                    }
                    .btn-today span {
                        display: none;
                    }
                    .btn-today:after {
                        content: 'T';
                    }
                    .btn-create span {
                        display: none;
                    }
                    .btn-create {
                        padding: 0 12px !important;
                    }
                }
            `}</style>
        </div>
    );
}
