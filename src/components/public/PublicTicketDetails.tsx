"use client";

import React, { useEffect, useState } from "react";
import { Card, Typography, Tag, Space, Divider, Avatar, Spin, Alert, Row, Col, Layout } from "antd";
import {
    CalendarOutlined,
    UserOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    FileTextOutlined,
    LinkOutlined,
    PaperClipOutlined,
    HistoryOutlined,
    MessageOutlined,
    PlusCircleOutlined,
    EditOutlined
} from "@ant-design/icons";
import { usePublicTicket } from "@/hooks/useTickets";
import dayjs from "dayjs";
import { Tabs, List, Timeline, Button, Tooltip, Empty } from "antd";
import { format } from "date-fns";

const { Title, Text, Paragraph } = Typography;
const { Content, Footer } = Layout;

interface PublicTicketDetailsProps {
    ticketId: string;
}

export default function PublicTicketDetails({ ticketId }: PublicTicketDetailsProps) {
    const { data: ticket, isLoading: loading, error } = usePublicTicket(ticketId);

    if (loading) {
        return (
            <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ padding: 100, textAlign: 'center' }}>
                    <Spin size="large" tip="Loading ticket details">
                        <div style={{ height: 100 }} />
                    </Spin>
                </div>
                </div>
            </Layout>
        );
    }

    if (error || !ticket) {
        return (
            <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
                <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
                    <Alert
                        message="Error"
                        description={error instanceof Error ? error.message : "Ticket not found"}
                        type="error"
                        showIcon
                    />
                </div>
            </Layout>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "success";
            case "in_progress": return "processing";
            case "dev_complete": return "cyan";
            case "in_testing": return "warning";
            case "in_review": return "purple";
            case "live": return "blue";
            case "not_started": return "default";
            default: return "default";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "P1": return "red";
            case "P2": return "orange";
            case "P3": return "green";
            default: return "default";
        }
    };

    return (
        <Layout style={{ minHeight: "100vh", background: "#f5f5f5" }}>
            <div style={{
                background: '#fff',
                padding: '0 20px',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000
            }}>
                <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 20, color: "#1677ff", fontWeight: 700 }}>
                        Zithspace
                    </Text>
                </div>
            </div>
            <Content style={{ marginTop: 64 }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
                    <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        {/* Header */}
                        <div style={{ marginBottom: 24 }}>
                            <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Space direction="vertical" size={4}>
                                    <Space>
                                        <Text type="secondary" style={{ fontSize: 16 }}>{ticket.ticketNumber}</Text>
                                        <Tag color={getStatusColor(ticket.status)} style={{ fontSize: 14, padding: '4px 8px' }}>
                                            {ticket.status.replace('_', ' ').toUpperCase()}
                                        </Tag>
                                    </Space>
                                    <Title level={2} style={{ margin: 0 }}>{ticket.title}</Title>
                                </Space>
                            </Space>
                        </div>

                        <Divider />

                        <Row gutter={[32, 24]}>
                            {/* Main Content */}
                            <Col xs={24} md={16}>
                                <Title level={5}><FileTextOutlined /> Description</Title>
                                <div
                                    style={{ fontSize: 16, lineHeight: 1.6, color: '#333', minHeight: 100 }}
                                    dangerouslySetInnerHTML={{ __html: ticket.description }}
                                />

                                {ticket.subTasks && ticket.subTasks.length > 0 && (
                                    <>
                                        <Divider orientation="left">Subtasks</Divider>
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={ticket.subTasks}
                                            renderItem={(subtask: any) => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        avatar={<Tag>{subtask.type}</Tag>}
                                                        title={
                                                            <Space>
                                                                <Text strong>{subtask.ticketNumber}</Text>
                                                                <Text>{subtask.title}</Text>
                                                                <Tag color={getStatusColor(subtask.status)}>{subtask.status}</Tag>
                                                            </Space>
                                                        }
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    </>
                                )}

                                <Divider />

                                <Tabs
                                    defaultActiveKey="comments"
                                    items={[
                                        {
                                            key: 'comments',
                                            label: `Comments (${ticket.comments?.length || 0})`,
                                            icon: <MessageOutlined />,
                                            children: (
                                                ticket.comments && ticket.comments.length > 0 ? (
                                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                                        {ticket.comments.map((comment: any) => (
                                                            <Card key={comment.id} size="small" type="inner" style={{ background: '#fafafa' }}>
                                                                <Space align="start">
                                                                    <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                                                                        {comment.user.name.charAt(0)}
                                                                    </Avatar>
                                                                    <div>
                                                                        <Space>
                                                                            <Text strong>{comment.user.name}</Text>
                                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                                {dayjs(comment.timestamp).format('MMM D, YYYY h:mm A')}
                                                                            </Text>
                                                                        </Space>
                                                                        <Paragraph style={{ margin: 0, marginTop: 4 }}>
                                                                            <div dangerouslySetInnerHTML={{ __html: comment.comment }} />
                                                                        </Paragraph>
                                                                    </div>
                                                                </Space>
                                                            </Card>
                                                        ))}
                                                    </Space>
                                                ) : <Empty description="No comments yet" />
                                            )
                                        },
                                        {
                                            key: 'attachments',
                                            label: `Attachments (${ticket.attachments?.length || 0})`,
                                            icon: <PaperClipOutlined />,
                                            children: (
                                                <List
                                                    dataSource={ticket.attachments || []}
                                                    renderItem={(item: any) => (
                                                        <List.Item
                                                            actions={[
                                                                <Button
                                                                    type="link"
                                                                    href={item.fileUrl}
                                                                    target="_blank"
                                                                    icon={<FileTextOutlined />}
                                                                >
                                                                    View
                                                                </Button>
                                                            ]}
                                                        >
                                                            <List.Item.Meta
                                                                avatar={<FileTextOutlined style={{ fontSize: 24 }} />}
                                                                title={item.fileName}
                                                                description={
                                                                    <Space>
                                                                        <Text type="secondary">{dayjs(item.uploadedAt).format('MMM D, YYYY')}</Text>
                                                                        <Text type="secondary">•</Text>
                                                                        <Text type="secondary">{item.uploadedBy?.name}</Text>
                                                                    </Space>
                                                                }
                                                            />
                                                        </List.Item>
                                                    )}
                                                    locale={{ emptyText: <Empty description="No attachments" /> }}
                                                />
                                            )
                                        },
                                        {
                                            key: 'links',
                                            label: `Links (${ticket.relatedLinks?.length || 0})`,
                                            icon: <LinkOutlined />,
                                            children: (
                                                <List
                                                    dataSource={ticket.relatedLinks || []}
                                                    renderItem={(item: any) => (
                                                        <List.Item>
                                                            <List.Item.Meta
                                                                avatar={<LinkOutlined style={{ fontSize: 24 }} />}
                                                                title={<a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a>}
                                                                description={item.description}
                                                            />
                                                        </List.Item>
                                                    )}
                                                    locale={{ emptyText: <Empty description="No related links" /> }}
                                                />
                                            )
                                        },
                                        {
                                            key: 'timeline',
                                            label: 'Timeline',
                                            icon: <HistoryOutlined />,
                                            children: (
                                                <div style={{ padding: 20, background: '#fff' }}>
                                                    <Timeline
                                                        mode="left"
                                                        items={(ticket.activityLogs || []).map((activity: any) => {
                                                            let color = 'gray';
                                                            let dot = <ClockCircleOutlined />;

                                                            if (activity.action.includes('Created')) { color = 'green'; dot = <PlusCircleOutlined />; }
                                                            else if (activity.action.includes('Comment')) { color = 'blue'; dot = <MessageOutlined />; }
                                                            else if (activity.action.includes('Updated')) { color = 'orange'; dot = <EditOutlined />; }
                                                            else if (activity.action.includes('Completed')) { color = 'green'; dot = <CheckCircleOutlined />; }

                                                            return {
                                                                key: activity.id,
                                                                color,
                                                                dot,
                                                                label: <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(activity.timestamp).format('MMM D, h:mm A')}</Text>,
                                                                children: (
                                                                    <>
                                                                        <Space>
                                                                            <Text strong>{activity.action}</Text>
                                                                            <Text type="secondary">by {activity.performedBy?.name || 'System'}</Text>
                                                                        </Space>
                                                                        {activity.details?.changes && (
                                                                            <ul style={{ paddingLeft: 20, marginTop: 4, marginBottom: 0 }}>
                                                                                {activity.details.changes.map((change: string, idx: number) => (
                                                                                    <li key={idx} style={{ fontSize: 12, color: '#666' }}>{change}</li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                        {activity.action === 'Comment Added' && (
                                                                            <div style={{ fontSize: 12, color: '#666', borderLeft: '2px solid #eee', paddingLeft: 8, marginTop: 4 }}>
                                                                                "{activity.details.contentPreview || 'Attachment only'}"
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )
                                                            };
                                                        })}
                                                    />
                                                    {(!ticket.activityLogs || ticket.activityLogs.length === 0) && <Empty description="No activity recorded" />}
                                                </div>
                                            )
                                        }
                                    ]}
                                />
                            </Col>

                            {/* Sidebar Info */}
                            <Col xs={24} md={8}>
                                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                                    <Card size="small" title="Details">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text type="secondary">Project:</Text>
                                                <Text strong>
                                                    {typeof ticket.project === 'string'
                                                        ? ticket.project
                                                        : `${ticket.project?.name} (${ticket.project?.code})`}
                                                </Text>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text type="secondary">Type:</Text>
                                                <Tag>{ticket.type}</Tag>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <Text type="secondary">Priority:</Text>
                                                <Tag color={getPriorityColor(ticket.priority)}>{ticket.priority}</Tag>
                                            </div>
                                        </Space>
                                    </Card>

                                    <Card size="small" title="People">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <div>
                                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Assignee:</Text>
                                                <Space>
                                                    <Avatar size="small" icon={<UserOutlined />} />
                                                    <Text>{ticket.assignee?.name || "Unassigned"}</Text>
                                                </Space>
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Reporter:</Text>
                                                <Space>
                                                    <Avatar size="small" icon={<UserOutlined />} />
                                                    <Text>{ticket.createdBy?.name || "Unknown"}</Text>
                                                </Space>
                                            </div>
                                        </Space>
                                    </Card>

                                    <Card size="small" title="Dates">
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <div>
                                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Created:</Text>
                                                <Space>
                                                    <CalendarOutlined />
                                                    <Text>{dayjs(ticket.createdAt).format('MMM D, YYYY')}</Text>
                                                </Space>
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Last Updated:</Text>
                                                <Space>
                                                    <ClockCircleOutlined />
                                                    <Text>{dayjs(ticket.updatedAt).format('MMM D, YYYY')}</Text>
                                                </Space>
                                            </div>
                                        </Space>
                                    </Card>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </div>
            </Content>
            <Footer style={{ textAlign: "center", background: 'transparent' }}>
                Zithspace ©{new Date().getFullYear()} - Public Ticket View
            </Footer>
        </Layout>
    );
}
