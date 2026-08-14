"use client";

import React from "react";
import { Typography, Tag, Space, Divider, Avatar, Alert, Row, Col, Layout, Collapse, Tabs, List, Timeline, Button, Empty, Card } from "antd";
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
    EditOutlined,
    InfoCircleOutlined,
    PlayCircleOutlined,
    SyncOutlined,
    RocketOutlined,
    BugOutlined,
    CheckOutlined,
    PauseCircleOutlined,
    CheckSquareOutlined
} from "@ant-design/icons";
import { usePublicTicket } from "@/hooks/useTickets";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AttachmentList from "@/components/common/AttachmentList";

import PublicTicketSkeleton from "./PublicTicketSkeleton";
import { getStatusColor, getStatusLabel, getPriorityColor, STATUS_OPTIONS } from "@/utils/ticketUtils";
import { DrawerField } from "@/components/projects/drawer/DrawerField";

dayjs.extend(relativeTime);

const { Text, Paragraph } = Typography;
const { Content } = Layout;

interface PublicTicketDetailsProps {
    ticketId: string;
}

export default function PublicTicketDetails({ ticketId }: PublicTicketDetailsProps) {
    const { data: ticket, isLoading: loading, error } = usePublicTicket(ticketId);

    if (loading) {
        return <PublicTicketSkeleton />;
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

    return (
        <Layout style={{ height: "100vh", overflowY: "auto", background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)" }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                padding: '0 20px',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 1px 0 0 rgba(15, 23, 42, 0.05)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000
            }}>
                <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
                    <Text strong style={{ fontSize: 20, color: "#1677ff", fontWeight: 700 }}>
                        Zukvo
                    </Text>
                </div>
            </div>
            
            <Content style={{ marginTop: 64, padding: '16px 12px' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 40px -10px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04)', backgroundColor: 'var(--bg-pure-white)', border: '1px solid rgba(15, 23, 42, 0.03)' }}>
                        <Row style={{ minHeight: '80vh' }}>
                            {/* LEFT COLUMN: Main Content */}
                            <Col
                                xs={24}
                                md={15}
                                style={{
                                    padding: '16px 24px',
                                    borderRight: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-pure-white)'
                                }}
                            >
                                {/* Title Area */}
                                <div className="ticket-hero-section">
                                    <div className="ticket-hero-section__eyebrow">
                                        <Space size={8} align="center">
                                            <Tag style={{ borderRadius: 4, margin: 0, padding: '2px 8px', background: 'rgba(22, 119, 255, 0.1)', color: '#1677ff', border: '1px solid rgba(22, 119, 255, 0.2)', fontSize: 12, fontWeight: 600 }}>
                                                {ticket.ticketNumber || 'TICKET'}
                                            </Tag>
                                            <Text style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-slate-400)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                                                {(typeof ticket.project === 'object' ? ticket.project?.name : ticket.project) || 'Project'}
                                            </Text>
                                        </Space>
                                    </div>
                                    <Text style={{ display: 'block', fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: 'var(--text-primary)', margin: '12px 0 0 0', letterSpacing: '-0.02em' }}>
                                        {ticket.title}
                                    </Text>
                                </div>

                                {/* Tags */}
                                {ticket.tags && ticket.tags.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0 16px' }}>
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                            {ticket.tags.map((t: string) => (
                                                <Tag key={t} style={{ borderRadius: 4, padding: '2px 8px', margin: 0, border: '1px solid var(--border-color)', background: 'var(--bg-slate-50)', color: 'var(--text-slate-600)', fontSize: 12, fontWeight: 500, transition: 'all 0.2s ease', cursor: 'default' }} className="premium-tag">
                                                    {t}
                                                </Tag>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div style={{ marginBottom: 12 }}>
                                    <div className="description-header">
                                        <span className="description-header__title">
                                            <span className="description-header__bar" />
                                            Description
                                        </span>
                                    </div>
                                    <div className="description-body">
                                        <div className={`description-viewer-v2 ${!ticket.description ? 'is-empty' : ''}`} style={{ cursor: 'default' }}>
                                            {ticket.description ? (
                                                <div
                                                    className="prose max-w-none focus:outline-none description-viewer-v2__content"
                                                    dangerouslySetInnerHTML={{ __html: ticket.description }}
                                                />
                                            ) : (
                                                <div className="description-viewer-v2__empty">
                                                    <div className="description-viewer-v2__empty-icon">
                                                        <FileTextOutlined />
                                                    </div>
                                                    <div className="description-viewer-v2__empty-copy">
                                                        <Text className="description-viewer-v2__empty-title">No description yet</Text>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
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
                                                                <Tag color={getStatusColor(subtask.status)}>{getStatusLabel(subtask.status, STATUS_OPTIONS)}</Tag>
                                                            </Space>
                                                        }
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    </>
                                )}

                                <Divider style={{ margin: '16px 0' }} />

                                <div className="premium-tabs-wrapper">
                                    <Tabs
                                        defaultActiveKey="comments"
                                        centered
                                        tabBarStyle={{ marginBottom: 12, borderBottom: '1px solid var(--border-color)' }}
                                        items={[
                                            {
                                                key: 'comments',
                                                label: <span><MessageOutlined style={{ marginRight: 6 }} />Comments ({ticket.comments?.length || 0})</span>,
                                                children: (
                                                    ticket.comments && ticket.comments.length > 0 ? (
                                                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                                            {ticket.comments.map((comment: any) => (
                                                                <Card key={comment.id} size="small" type="inner" style={{ background: '#fafafa', borderRadius: 8 }}>
                                                                    <Space align="start">
                                                                        <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
                                                                            {comment.user?.name?.charAt(0) || '?'}
                                                                        </Avatar>
                                                                        <div>
                                                                            <Space>
                                                                                <Text strong>{comment.user?.name || 'Unknown'}</Text>
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
                                                label: <span><PaperClipOutlined style={{ marginRight: 6 }} />Attachments ({ticket.attachments?.length || 0})</span>,
                                                children: (
                                                    <div style={{ padding: '16px 0' }}>
                                                        <AttachmentList
                                                            attachments={(ticket.attachments || []).map((a: any) => ({ ...a, fileSize: a.fileSize || 0, uploadedBy: { ...a.uploadedBy, workEmail: '', position: '' } })) as any}
                                                            loading={false}
                                                        />
                                                    </div>
                                                )
                                            },
                                            {
                                                key: 'links',
                                                label: <span><LinkOutlined style={{ marginRight: 6 }} />Links ({ticket.relatedLinks?.length || 0})</span>,
                                                children: (
                                                    <List
                                                        dataSource={ticket.relatedLinks || []}
                                                        renderItem={(item: any) => (
                                                            <List.Item>
                                                                <List.Item.Meta
                                                                    avatar={<LinkOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
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
                                                label: <span><HistoryOutlined style={{ marginRight: 6 }} />Timeline</span>,
                                                children: (
                                                    <div style={{ padding: '20px 0' }}>
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
                                </div>
                            </Col>

                            {/* RIGHT COLUMN: Metadata Sidebar */}
                            <Col
                                xs={24}
                                md={9}
                                style={{
                                    padding: '16px',
                                    backgroundColor: "var(--bg-pure-white)",
                                }}
                            >
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                        <div style={(() => {
                                            const color = getStatusColor(ticket.status);
                                            let hexColor = "#8c8c8c";
                                            if (color === "processing") hexColor = "#3b82f6";
                                            else if (color === "success") hexColor = "#10b981";
                                            else if (color === "warning") hexColor = "#f59e0b";
                                            else if (color === "purple") hexColor = "#8b5cf6";
                                            else if (color === "cyan") hexColor = "#06b6d4";
                                            else if (color === "geekblue") hexColor = "#4f46e5";
                                            else if (color === "orange") hexColor = "#f59e0b";

                                            return {
                                                backgroundColor: `${hexColor}08`,
                                                borderRadius: 8,
                                                border: `1px solid ${hexColor}30`,
                                                padding: '8px 12px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                boxShadow: `0 2px 10px ${hexColor}10`
                                            };
                                        })()} className="status-badge-premium-glow">
                                            {(() => {
                                                const s = ticket.status;
                                                const color = getStatusColor(ticket.status);
                                                let hexColor = "#8c8c8c";
                                                if (color === "processing") hexColor = "#3b82f6";
                                                else if (color === "success") hexColor = "#10b981";
                                                else if (color === "warning") hexColor = "#f59e0b";
                                                else if (color === "purple") hexColor = "#8b5cf6";
                                                else if (color === "cyan") hexColor = "#06b6d4";
                                                else if (color === "geekblue") hexColor = "#4f46e5";
                                                else if (color === "orange") hexColor = "#f59e0b";
                                                
                                                const iconStyle = { fontSize: 16, color: hexColor };
                                                const iconMap: Record<string, React.ReactNode> = {
                                                    'not_started': <PlayCircleOutlined style={iconStyle} />,
                                                    'in_progress': <SyncOutlined spin style={iconStyle} />,
                                                    'dev_complete': <RocketOutlined style={iconStyle} />,
                                                    'dev_testing': <BugOutlined style={iconStyle} />,
                                                    'in_review': <SyncOutlined style={iconStyle} />,
                                                    'live': <CheckCircleOutlined style={iconStyle} />,
                                                    'live_testing': <CheckCircleOutlined style={iconStyle} />,
                                                    'completed': <CheckSquareOutlined style={iconStyle} />,
                                                    'pause': <PauseCircleOutlined style={iconStyle} />
                                                };
                                                return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: `${hexColor}15` }}>{iconMap[s] || <PlayCircleOutlined style={iconStyle} />}</div>;
                                            })()}
                                            <div style={{ flex: 1 }}>
                                                <Text style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-slate-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 0 }}>
                                                    Current Status
                                                </Text>
                                                <Text style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>
                                                    {getStatusLabel(ticket.status, STATUS_OPTIONS)}
                                                </Text>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="sidebar-collapse-wrapper premium-sidebar-cards" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <Collapse
                                            defaultActiveKey={["details"]}
                                            ghost
                                            expandIconPosition="end"
                                            style={{ backgroundColor: 'transparent' }}
                                            items={[
                                                {
                                                    key: "details",
                                                    label: (
                                                        <div style={{ padding: '2px 0' }}>
                                                            <Space size={8}>
                                                                <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <InfoCircleOutlined style={{ color: '#1890ff', fontSize: 13 }} />
                                                                </div>
                                                                <Text strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Core Details</Text>
                                                            </Space>
                                                        </div>
                                                    ),
                                                    children: (
                                                        <div style={{ padding: 0 }}>
                                                            <Row gutter={[0, 0]}>
                                                                <Col span={24}>
                                                                    <DrawerField label="Assignee" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                            {(typeof ticket.assignee === 'object' ? ticket.assignee?.name : ticket.assignee) || "Unassigned"}
                                                                        </Text>
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Report To" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                            {(typeof ticket.reportTo === 'object' ? ticket.reportTo?.name : ticket.reportTo) || "No Reporter"}
                                                                        </Text>
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Platform" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                            {ticket.platform || "—"}
                                                                        </Text>
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Priority" variant="table" interactive={false}>
                                                                        {ticket.priority ? <Tag color={getPriorityColor(ticket.priority)} style={{ margin: 0, borderRadius: 4 }}>{ticket.priority}</Tag> : "—"}
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Type" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{ticket.type || "—"}</Text>
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Task Level" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{ticket.taskLevel || "—"}</Text>
                                                                    </DrawerField>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    )
                                                }
                                            ]}
                                        />
                                        
                                        <Collapse
                                            defaultActiveKey={["activity"]}
                                            ghost
                                            expandIconPosition="end"
                                            style={{ backgroundColor: 'transparent' }}
                                            items={[
                                                {
                                                    key: "activity",
                                                    label: (
                                                        <div style={{ padding: '2px 0' }}>
                                                            <Space size={8}>
                                                                <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'rgba(168, 85, 247, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <HistoryOutlined style={{ color: '#a855f7', fontSize: 13 }} />
                                                                </div>
                                                                <Text strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Activity</Text>
                                                            </Space>
                                                        </div>
                                                    ),
                                                    children: (
                                                        <div style={{ padding: 0 }}>
                                                            <Row gutter={[0, 0]}>
                                                                <Col span={24}>
                                                                    <DrawerField label="Created by" variant="table" interactive={false}>
                                                                        <Space size={6} align="center">
                                                                            <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                                {ticket?.createdBy?.name ? ticket.createdBy.name.split(" ")[0] : 'System'}
                                                                            </Text>
                                                                            <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
                                                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                                                {ticket?.createdAt ? dayjs(ticket.createdAt).format('MMM D, YYYY HH:mm') : '-'}
                                                                            </Text>
                                                                        </Space>
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Updated by" variant="table" interactive={false}>
                                                                        <Space size={6} align="center">
                                                                            <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                                {((ticket as any)?.updatedBy?.name || ticket?.createdBy?.name || 'System').split(" ")[0]}
                                                                            </Text>
                                                                            <Text type="secondary" style={{ fontSize: 11 }}>·</Text>
                                                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                                                {ticket?.updatedAt ? dayjs(ticket.updatedAt).format('MMM D, YYYY HH:mm') : '-'}
                                                                            </Text>
                                                                        </Space>
                                                                    </DrawerField>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    )
                                                }
                                            ]}
                                        />

                                        {/* Planning & Estimates Card */}
                                        <Collapse
                                            defaultActiveKey={["planning"]}
                                            ghost
                                            expandIconPosition="end"
                                            style={{ backgroundColor: 'transparent' }}
                                            items={[
                                                {
                                                    key: "planning",
                                                    label: (
                                                        <div style={{ padding: '2px 0' }}>
                                                            <Space size={8}>
                                                                <div style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                    <CalendarOutlined style={{ color: '#52c41a', fontSize: 13 }} />
                                                                </div>
                                                                <Text strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>Planning & Estimates</Text>
                                                            </Space>
                                                        </div>
                                                    ),
                                                    children: (
                                                        <div style={{ padding: 0 }}>
                                                            <Row gutter={[0, 0]}>
                                                                <Col span={24}>
                                                                    <DrawerField label="Story Points" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                                                                            {ticket.storyPoint || "—"}
                                                                        </Text>
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Estimate (h)" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                                                                            {ticket.estimateHours || "—"}
                                                                        </Text>
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Start Date" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                            {ticket.startDate ? dayjs(ticket.startDate).format("MMM D, YYYY") : "—"}
                                                                        </Text>
                                                                    </DrawerField>
                                                                </Col>
                                                                <Col span={24}>
                                                                    <DrawerField label="Due Date" variant="table" interactive={false}>
                                                                        <Text style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>
                                                                            {ticket.endDate ? dayjs(ticket.endDate).format("MMM D, YYYY") : "—"}
                                                                        </Text>
                                                                    </DrawerField>
                                                                </Col>
                                                            </Row>
                                                        </div>
                                                    )
                                                }
                                            ]}
                                        />
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </div>
            </Content>

            <style jsx global>{`
                .ticket-title-card {
                    position: relative;
                    padding: 16px 20px;
                    border: 1px solid var(--border-color);
                    border-radius: 12px;
                    background: var(--bg-pure-white);
                    box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.04);
                }
                .ticket-title-card__accent {
                    position: absolute;
                    top: -1px;
                    left: 20px;
                    width: 48px;
                    height: 3px;
                    background: linear-gradient(90deg, #3B82F6, #8B5CF6);
                    border-radius: 0 0 4px 4px;
                }
                .ticket-title-card__eyebrow {
                    display: block;
                    font-size: 10px;
                    font-weight: 700;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: var(--text-slate-400);
                    margin-bottom: 6px;
                }
                .description-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }
                .description-header__title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--text-primary);
                }
                .description-header__bar {
                    width: 4px;
                    height: 14px;
                    background: #1890ff;
                    border-radius: 2px;
                }
                .description-viewer-v2 {
                    position: relative;
                    border: 1px solid transparent;
                    border-radius: 10px;
                    background: transparent;
                    transition: all 0.2s ease;
                }
                .description-viewer-v2.is-empty {
                    border: 1px dashed var(--border-color);
                    background: var(--bg-slate-50);
                }
                .description-viewer-v2__content {
                    font-size: 14px;
                    color: var(--text-slate-700);
                    line-height: 1.6;
                }
                .description-viewer-v2__empty {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 32px 16px;
                    text-align: center;
                }
                .description-viewer-v2__empty-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: var(--bg-pure-white);
                    border: 1px solid var(--border-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    color: var(--text-slate-400);
                    margin-bottom: 12px;
                    box-shadow: 0 2px 4px rgba(15, 23, 42, 0.04);
                }
                .description-viewer-v2__empty-title {
                    display: block;
                    font-weight: 600;
                    color: var(--text-slate-700);
                    font-size: 13px;
                    margin-bottom: 4px;
                }
                .premium-tabs-wrapper .ant-tabs-nav {
                    border-bottom: 1px solid var(--border-color) !important;
                }
                .premium-tabs-wrapper .ant-tabs-tab {
                    padding: 8px 12px !important;
                    margin: 0 4px !important;
                }
                .premium-tabs-wrapper .ant-tabs-tab-btn {
                    font-weight: 500 !important;
                    color: #8c8c8c !important;
                    font-size: 12px !important;
                }
                .premium-tabs-wrapper .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #1890ff !important;
                    font-weight: 700 !important;
                }
                .premium-tabs-wrapper .ant-tabs-ink-bar {
                    height: 3px !important;
                    border-radius: 3px 3px 0 0 !important;
                    background: #1890ff !important;
                }
                .sidebar-collapse-wrapper .ant-collapse-item {
                    border: 1px solid var(--border-color) !important;
                    border-radius: 12px !important;
                    margin-bottom: 10px !important;
                    background: var(--bg-pure-white) !important;
                    overflow: hidden !important;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
                }
                .sidebar-collapse-wrapper .ant-collapse-header {
                    padding: 6px 10px !important;
                    background: transparent !important;
                    border-bottom: none !important;
                }
                .sidebar-collapse-wrapper .ant-collapse-content {
                    background: transparent !important;
                    border-top: 1px solid var(--border-color) !important;
                }
                .sidebar-collapse-wrapper .drawer-field.table-variant {
                    border-bottom: none !important;
                    padding: 4px 10px !important;
                    position: relative;
                }
                .sidebar-collapse-wrapper .drawer-field.table-variant + .drawer-field.table-variant::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 14px;
                    right: 14px;
                    height: 1px;
                    background: var(--border-color);
                }
                .sidebar-collapse-wrapper .drawer-field.table-variant > div:first-child .ant-typography {
                    font-size: 11.5px !important;
                    font-weight: 600 !important;
                    color: var(--text-slate-500) !important;
                }
                
                /* Animations */
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .premium-sidebar-cards .ant-collapse-item {
                    border: 1px solid rgba(15, 23, 42, 0.05) !important;
                    border-radius: 8px !important;
                    margin-bottom: 8px !important;
                    background: var(--bg-pure-white) !important;
                    overflow: hidden !important;
                    box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.03) !important;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .premium-sidebar-cards .ant-collapse-item:hover {
                    box-shadow: 0 6px 16px -4px rgba(15, 23, 42, 0.06) !important;
                    transform: translateY(-1px);
                }
                
                .premium-tabs-wrapper .ant-tabs-nav::before {
                    border-bottom: 2px solid rgba(15, 23, 42, 0.05) !important;
                }
                .premium-tabs-wrapper .ant-tabs-ink-bar {
                    background: linear-gradient(90deg, #3B82F6, #8B5CF6) !important;
                    height: 3px !important;
                    border-radius: 3px 3px 0 0 !important;
                }
                .premium-tabs-wrapper .ant-tabs-tab {
                    padding: 8px 12px !important;
                    transition: all 0.2s ease;
                }
                .premium-tabs-wrapper .ant-tabs-tab:hover {
                    background: rgba(15, 23, 42, 0.02);
                    border-radius: 8px 8px 0 0;
                }
                .premium-tabs-wrapper .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #0f172a !important;
                    font-weight: 700 !important;
                }
                
                .description-viewer-v2 {
                    border-radius: 12px;
                    padding: 8px 0;
                }
            `}</style>
        </Layout>
    );
}
