import React from 'react';
import { Space, Typography, Button, Tag } from 'antd';
import { ArrowLeftOutlined, RightOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface TicketBreadcrumbProps {
    ticket: any; // Current ticket
    parentTicket?: any; // Parent if current is subtask
    onNavigateToParent?: () => void;
    showBackButton?: boolean;
    onBack?: () => void;
}

export const TicketBreadcrumb: React.FC<TicketBreadcrumbProps> = ({
    ticket,
    parentTicket,
    onNavigateToParent,
    showBackButton,
    onBack
}) => {
    const isSubtask = !!ticket?.parentId;

    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '8px 12px',
            background: '#fafafa',
            borderBottom: '1px solid #f0f0f0'
        }}>
            {/* Back Button (if navigated from parent) */}
            {showBackButton && (
                <Button 
                    type="text" 
                    size="small" 
                    icon={<ArrowLeftOutlined />}
                    onClick={onBack}
                    style={{ marginRight: 4 }}
                />
            )}

            {isSubtask ? (
                // Subtask breadcrumb
                <Space size={6} style={{ fontSize: 13 }}>
                    <Button
                        type="link"
                        size="small"
                        onClick={onNavigateToParent}
                        style={{ padding: 0, height: 'auto', fontSize: 13 }}
                    >
                        Main Ticket
                    </Button>
                    <RightOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                    <Text type="secondary">Sub-task</Text>
                    <Tag color="blue" style={{ margin: 0 }}>
                        {ticket.ticketNumber}
                    </Tag>
                </Space>
            ) : (
                // Main ticket badge
                <Tag color="blue" bordered={false}>
                    Main Ticket
                </Tag>
            )}
        </div>
    );
};
