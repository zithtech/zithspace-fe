'use client';

import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Button, message, Row, Col } from 'antd';
import {
    FileZipOutlined,
    FileTextOutlined,
    ProjectOutlined,
    TagOutlined,
    PlusOutlined,
} from '@ant-design/icons';
import { documentHubService as DocumentHubService } from '@/services/documentHub';
import {
    useUserProjects,
    useUserTicketsByProjects,
} from '@/hooks/useGlobalData';

const { Option } = Select;

interface CreateDocHubModalProps {
    open: boolean;
    onClose: () => void;
    /** Called with the created hub id so the host can navigate. */
    onCreated?: (hubId: string) => void;
    /** Pre-fills the project select. */
    defaultProjectId?: string;
    /** Pre-fills the ticket select (requires defaultProjectId). */
    defaultTicketId?: string;
    /** Pre-fills the hub name. */
    defaultName?: string;
    /** When true, hides the project/ticket selects (the link is implicit). */
    lockLink?: boolean;
}

const CreateDocHubModal: React.FC<CreateDocHubModalProps> = ({
    open,
    onClose,
    onCreated,
    defaultProjectId,
    defaultTicketId,
    defaultName,
    lockLink = false,
}) => {
    const [form] = Form.useForm();
    const [isCreating, setIsCreating] = React.useState(false);
    const [selectedProjectId, setSelectedProjectId] = React.useState<string | undefined>(
        defaultProjectId,
    );
    const [messageApi, contextHolder] = message.useMessage();

    const { data: projects = [], isLoading: projectsLoading } = useUserProjects();
    const { data: tickets = [], isLoading: ticketsLoading } =
        useUserTicketsByProjects(selectedProjectId);

    // Reset / pre-fill whenever the modal opens or the defaults change.
    useEffect(() => {
        if (!open) return;
        setSelectedProjectId(defaultProjectId);
        form.setFieldsValue({
            name: defaultName || '',
            projectId: defaultProjectId,
            ticketId: defaultTicketId,
        });
    }, [open, defaultProjectId, defaultTicketId, defaultName, form]);

    const handleSubmit = async (values: any) => {
        try {
            setIsCreating(true);
            const data = await DocumentHubService.createDocumentHub({
                name: values.name,
                projectId: values.projectId,
                ticketId: values.ticketId,
            });
            messageApi.success('Document hub created');
            form.resetFields();
            setSelectedProjectId(undefined);
            onClose();
            if (data?.id) onCreated?.(data.id);
        } catch (err: any) {
            console.error(err);
            messageApi.error(err?.message || 'Failed to create document hub');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <>
            {contextHolder}
            <Modal
                open={open}
                onCancel={() => {
                    if (isCreating) return;
                    onClose();
                    form.resetFields();
                    setSelectedProjectId(undefined);
                }}
                title={null}
                footer={null}
                closable={false}
                width={520}
                centered
                styles={{
                    mask: { backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.45)' },
                    content: { borderRadius: 18, padding: 0, overflow: 'hidden' },
                    body: { padding: 0 },
                }}
            >
                {/* Hero header */}
                <div
                    className="px-6 pt-5 pb-4"
                    style={{
                        background:
                            'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(99, 102, 241, 0.04) 100%)',
                        borderBottom: '1px solid var(--border-slate-200)',
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="flex items-center justify-center shrink-0 text-white"
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                                boxShadow:
                                    '0 4px 12px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
                            }}
                        >
                            <FileZipOutlined style={{ fontSize: 18 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2
                                className="text-[16px] font-bold tracking-tight m-0"
                                style={{ color: 'var(--text-slate-900)', letterSpacing: '-0.02em' }}
                            >
                                Create new document hub
                            </h2>
                            <p
                                className="m-0 mt-0.5 text-[12.5px]"
                                style={{ color: 'var(--text-slate-400)' }}
                            >
                                {lockLink
                                    ? 'This hub will be linked to the current ticket automatically.'
                                    : "A workspace for grouping related docs — wiki, specs, runbooks."}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                if (isCreating) return;
                                onClose();
                                form.resetFields();
                                setSelectedProjectId(undefined);
                            }}
                            disabled={isCreating}
                            className="shrink-0 flex items-center justify-center rounded-lg transition-colors"
                            style={{
                                width: 30,
                                height: 30,
                                color: 'var(--text-slate-400)',
                                background: 'transparent',
                                border: 'none',
                                cursor: isCreating ? 'not-allowed' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                if (isCreating) return;
                                e.currentTarget.style.background = 'var(--bg-slate-100)';
                                e.currentTarget.style.color = 'var(--text-slate-700)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--text-slate-400)';
                            }}
                            aria-label="Close"
                        >
                            <PlusOutlined style={{ fontSize: 13, transform: 'rotate(45deg)' }} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 pt-5 pb-2">
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            name="name"
                            label={
                                <span
                                    className="text-[11.5px] font-semibold uppercase tracking-[0.06em]"
                                    style={{ color: 'var(--text-slate-400)' }}
                                >
                                    Hub name
                                </span>
                            }
                            rules={[
                                { required: true, message: 'Please enter a hub name' },
                                { min: 2, message: 'Name must be at least 2 characters' },
                                { max: 80, message: 'Up to 80 characters' },
                            ]}
                            className="mb-4"
                        >
                            <Input
                                size="large"
                                autoFocus
                                placeholder="e.g., Payments API documentation"
                                prefix={
                                    <FileTextOutlined
                                        style={{ color: 'var(--text-slate-400)', fontSize: 13 }}
                                    />
                                }
                                style={{
                                    borderRadius: 10,
                                    fontSize: 13.5,
                                    height: 42,
                                    background: 'var(--bg-pure-white)',
                                    borderColor: 'var(--border-slate-200)',
                                    color: 'var(--text-slate-900)',
                                }}
                            />
                        </Form.Item>

                        {!lockLink && (
                            <>
                                <div
                                    className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-2 mt-2"
                                    style={{ color: 'var(--text-slate-400)' }}
                                >
                                    Link to work{' '}
                                    <span
                                        style={{
                                            fontWeight: 400,
                                            textTransform: 'none',
                                            letterSpacing: 0,
                                        }}
                                    >
                                        · optional
                                    </span>
                                </div>

                                <Row gutter={[12, 0]}>
                                    <Col span={24}>
                                        <Form.Item name="projectId" className="mb-3">
                                            <Select
                                                size="large"
                                                placeholder={
                                                    <span
                                                        className="inline-flex items-center gap-1.5"
                                                        style={{ color: 'var(--text-slate-400)' }}
                                                    >
                                                        <ProjectOutlined style={{ fontSize: 12 }} />
                                                        Select a project
                                                    </span>
                                                }
                                                loading={projectsLoading}
                                                suffixIcon={
                                                    <ProjectOutlined
                                                        style={{
                                                            color: 'var(--text-slate-400)',
                                                            fontSize: 11,
                                                        }}
                                                    />
                                                }
                                                onChange={(value) => {
                                                    setSelectedProjectId(value);
                                                    form.setFieldsValue({
                                                        projectId: value,
                                                        ticketId: undefined,
                                                    });
                                                }}
                                                allowClear
                                                style={{ borderRadius: 10 }}
                                            >
                                                {projects.map((project: any) => (
                                                    <Option
                                                        key={project.value}
                                                        value={project.value}
                                                    >
                                                        {project.label} ({project.code})
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={24}>
                                        <Form.Item name="ticketId" className="mb-2">
                                            <Select
                                                size="large"
                                                showSearch
                                                placeholder={
                                                    <span
                                                        className="inline-flex items-center gap-1.5"
                                                        style={{ color: 'var(--text-slate-400)' }}
                                                    >
                                                        <TagOutlined style={{ fontSize: 12 }} />
                                                        {selectedProjectId
                                                            ? 'Select a ticket'
                                                            : 'Pick a project first to link a ticket'}
                                                    </span>
                                                }
                                                loading={ticketsLoading}
                                                suffixIcon={
                                                    <TagOutlined
                                                        style={{
                                                            color: 'var(--text-slate-400)',
                                                            fontSize: 11,
                                                        }}
                                                    />
                                                }
                                                allowClear
                                                disabled={!selectedProjectId}
                                                optionFilterProp="label"
                                                options={tickets.map((ticket: any) => ({
                                                    value: ticket.id,
                                                    label: `${ticket.ticketNumber} (${ticket.title})`,
                                                }))}
                                                filterOption={(input, option) =>
                                                    String(option?.label ?? '')
                                                        .toLowerCase()
                                                        .includes(input.toLowerCase())
                                                }
                                                style={{ borderRadius: 10 }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <div
                                    className="flex items-start gap-2 px-3 py-2 rounded-lg mt-3"
                                    style={{
                                        background: 'var(--bg-blue-50)',
                                        border: '1px solid var(--border-blue-200)',
                                    }}
                                >
                                    <ProjectOutlined
                                        style={{
                                            color: 'var(--text-blue-700)',
                                            fontSize: 12,
                                            marginTop: 3,
                                        }}
                                    />
                                    <span
                                        className="text-[11.5px] leading-snug"
                                        style={{ color: 'var(--text-slate-600)' }}
                                    >
                                        Linking a project or ticket attaches this hub's docs to that
                                        work item, so they show up alongside it everywhere else in
                                        ZithSpace.
                                    </span>
                                </div>
                            </>
                        )}

                        {/* When the link is locked (e.g. opened from a ticket drawer),
                            keep the IDs in hidden form fields. */}
                        {lockLink && (
                            <>
                                <Form.Item name="projectId" hidden>
                                    <Input />
                                </Form.Item>
                                <Form.Item name="ticketId" hidden>
                                    <Input />
                                </Form.Item>
                                <div
                                    className="flex items-start gap-2 px-3 py-2 rounded-lg mt-1"
                                    style={{
                                        background: 'var(--bg-blue-50)',
                                        border: '1px solid var(--border-blue-200)',
                                    }}
                                >
                                    <TagOutlined
                                        style={{
                                            color: 'var(--text-blue-700)',
                                            fontSize: 12,
                                            marginTop: 3,
                                        }}
                                    />
                                    <span
                                        className="text-[11.5px] leading-snug"
                                        style={{ color: 'var(--text-slate-600)' }}
                                    >
                                        This hub will be linked to the current ticket so its
                                        documents surface alongside the ticket throughout ZithSpace.
                                    </span>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                {/* Sticky footer */}
                <div
                    className="flex items-center justify-end gap-2 px-6 py-3 mt-2"
                    style={{
                        borderTop: '1px solid var(--border-slate-200)',
                        background: 'var(--bg-secondary)',
                    }}
                >
                    <Button
                        onClick={() => {
                            if (isCreating) return;
                            onClose();
                            form.resetFields();
                            setSelectedProjectId(undefined);
                        }}
                        disabled={isCreating}
                        style={{ borderRadius: 9, height: 36, fontWeight: 500 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => form.submit()}
                        loading={isCreating}
                        icon={!isCreating ? <PlusOutlined /> : undefined}
                        style={{
                            borderRadius: 9,
                            height: 36,
                            paddingInline: 18,
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
                            border: 'none',
                            boxShadow:
                                '0 4px 12px rgba(59, 130, 246, 0.32), inset 0 1px 0 rgba(255,255,255,0.18)',
                        }}
                    >
                        Create hub
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default CreateDocHubModal;
