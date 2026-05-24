'use client';

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Upload,
  Avatar,
  Tag,
  Space,
  Typography,
  Skeleton,
  notification,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  BugOutlined,
  PaperClipOutlined,
  SendOutlined,
  CloseOutlined,
  AlertOutlined,
  TagOutlined,
  FireOutlined,
  FlagOutlined,
  ProjectOutlined,
  LinkOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  BulbOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/axios';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';
import { EscalationSettingsService } from '@/services/escalationSettings';

const { Text } = Typography;
const { TextArea } = Input;

interface Member {
  value: string;
  label: string;
  email: string;
  position?: string;
  role?: string;
}

interface Category {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
}

interface Priority {
  id: string;
  name: string;
  description?: string | null;
  weight: number;
  color?: string | null;
  isActive?: boolean;
}

interface Status {
  id: string;
  name: string;
  color?: string | null;
  isDefault: boolean;
  isActive?: boolean;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  assignee?: { name: string };
}

interface Project {
  value: string;
  label: string;
}

interface CreateEscalationDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  step: number;
  done?: boolean;
}> = ({ icon, title, subtitle, step, done }) => (
  <div className={`ced-section-header${done ? ' is-done' : ''}`}>
    <div className="ced-section-header__step">{done ? <CheckCircleFilled /> : step}</div>
    <div className="ced-section-header__icon">{icon}</div>
    <div className="ced-section-header__text">
      <div className="ced-section-header__title">{title}</div>
      {subtitle && <div className="ced-section-header__sub">{subtitle}</div>}
    </div>
  </div>
);

const CreateEscalationDrawer: React.FC<CreateEscalationDrawerProps> = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notify, contextHolder] = notification.useNotification();

  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);

  // Live-watched values to drive step "done" indicators + summary
  const watchedTargets: string[] = Form.useWatch('targetUsers', form) || [];
  const watchedCategory = Form.useWatch('categoryId', form);
  const watchedSubject = Form.useWatch('subject', form);
  const watchedPriority = Form.useWatch('priorityId', form);
  const watchedDescription = Form.useWatch('description', form);

  const stepContextDone = watchedTargets.length > 0 && !!watchedCategory;
  const stepDetailsDone = !!watchedSubject && !!watchedPriority && !!watchedDescription;

  const notifyPremium = (type: 'success' | 'error', title: string, description: string) => {
    notify[type]({
      message: <span className="premium-notif-title">{title}</span>,
      description: <span className="premium-notif-desc">{description}</span>,
      icon:
        type === 'success' ? (
          <CheckCircleFilled style={{ color: '#10B981' }} />
        ) : (
          <CloseCircleFilled style={{ color: '#EF4444' }} />
        ),
      className: 'premium-notification',
      placement: 'topRight',
      duration: 4,
    });
  };

  // Fetch reference data when drawer opens (cache across opens)
  useEffect(() => {
    if (!open) return;
    if (members.length > 0 && categories.length > 0 && statuses.length > 0) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [membersRes, categoriesRes, prioritiesRes, projectsRes, statusesRes] = await Promise.all([
          api.get('/api/members/select'),
          EscalationSettingsService.getCategories(),
          EscalationSettingsService.getPriorities(),
          api.get('/api/projects/select'),
          EscalationSettingsService.getStatuses(),
        ]);

        setMembers(membersRes || []);
        setProjects(projectsRes || []);
        setCategories(categoriesRes.filter((c: Category) => c.isActive));
        setPriorities(prioritiesRes.filter((p: Priority) => p.isActive));

        const activeStatuses = statusesRes.filter((s: Status) => s.isActive);
        setStatuses(activeStatuses);

        const defaultStatus = activeStatuses.find((s: Status) => s.isDefault);
        if (defaultStatus) {
          form.setFieldsValue({ statusId: defaultStatus.id });
        }
      } catch (error) {
        console.error('Failed to fetch escalation context data:', error);
        notifyPremium('error', 'Load Failed', 'Failed to load form data. Please close and reopen.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open]);

  // Fetch tickets when project changes
  const selectedProjectId = Form.useWatch('projectId', form);

  useEffect(() => {
    const fetchTickets = async () => {
      if (!selectedProjectId) {
        setTickets([]);
        return;
      }
      try {
        const res = await api.get(`/api/tickets?projectId=${selectedProjectId}&limit=100`);
        setTickets(res || []);
        form.setFieldsValue({ ticketIds: [] });
      } catch (error) {
        console.error('Failed to fetch project tickets:', error);
      }
    };
    fetchTickets();
  }, [selectedProjectId, form]);

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setTickets([]);
    onClose();
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      const filePromises = fileList.map((fileItem) => {
        return new Promise<{ fileName: string; fileBase64: string }>((resolve, reject) => {
          const file = fileItem.originFileObj || fileItem;
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () =>
            resolve({
              fileName: file.name,
              fileBase64: reader.result as string,
            });
          reader.onerror = (error) => reject(error);
        });
      });

      const attachments = await Promise.all(filePromises);

      const payload = {
        subject: values.subject,
        description: values.description,
        categoryId: values.categoryId,
        priorityId: values.priorityId,
        projectId: values.projectId,
        statusId: values.statusId,
        targetMemberIds: values.targetUsers,
        ticketIds: values.ticketIds || [],
        attachments,
      };

      await EscalationServiceV2.createEscalation(payload);
      notifyPremium('success', 'Escalation Created', 'The escalation has been posted to technical leadership.');
      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create escalation:', error);
      notifyPremium('error', 'Submission Failed', 'Failed to create escalation. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      className="ced-drawer"
      placement="right"
      width={760}
      open={open}
      onClose={handleClose}
      closable={false}
      destroyOnHidden={false}
      styles={{
        header: { display: 'none' },
        body: { padding: 0, background: 'var(--bg-pure-white)' },
        content: { background: 'var(--bg-pure-white)' },
        footer: { padding: 0, border: 'none' },
      }}
      footer={
        <div className="ced-footer">
          <div className="ced-footer__progress">
            <div className={`ced-footer__dot${stepContextDone ? ' is-done' : ''}`} />
            <div className="ced-footer__line" />
            <div className={`ced-footer__dot${stepDetailsDone ? ' is-done' : ''}`} />
            <div className="ced-footer__line" />
            <div className={`ced-footer__dot${fileList.length > 0 ? ' is-done' : ''}`} />
          </div>
          <div className="ced-footer__actions">
            <Button onClick={handleClose} className="ced-btn-ghost">
              Discard
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={submitting}
              onClick={() => form.submit()}
              className="ced-btn-primary"
            >
              Post Escalation
            </Button>
          </div>
        </div>
      }
    >
      {contextHolder}

      {/* Premium gradient hero header */}
      <div className="ced-hero">
        <div className="ced-hero__bg" />
        <div className="ced-hero__content">
          <div className="ced-hero__top">
            <div className="ced-hero__icon">
              <AlertOutlined />
            </div>
            <div className="ced-hero__text">
              <div className="ced-hero__title">Raise Manual Escalation</div>
              <div className="ced-hero__sub">
                Flag a quality or performance concern. Technical leads are notified immediately.
              </div>
            </div>
            <button className="ced-hero__close" onClick={handleClose} aria-label="Close">
              <CloseOutlined />
            </button>
          </div>

          <div className="ced-hero__stats">
            <div className="ced-hero__stat">
              <ThunderboltOutlined className="ced-hero__stat-icon" />
              <span>
                <strong>24 hr</strong> review SLA
              </span>
            </div>
            <div className="ced-hero__stat-divider" />
            <div className="ced-hero__stat">
              <BulbOutlined className="ced-hero__stat-icon" />
              <span>Be specific — add evidence</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ced-body">
        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={false}>
          {/* Section 1: Team Context */}
          <SectionHeader
            step={1}
            done={stepContextDone}
            icon={<UserOutlined />}
            title="Team Context"
            subtitle="Who is this about and what type of issue?"
          />

          <div className="ced-grid-2">
            <Form.Item
              name="targetUsers"
              label="Target team members"
              rules={[{ required: true, message: 'Select at least one team member' }]}
            >
              {loading ? (
                <Skeleton.Input active block style={{ height: 42 }} />
              ) : (
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Search by name or role…"
                  maxTagCount="responsive"
                  optionFilterProp="label"
                  className="ced-select"
                  options={members.map((m) => ({
                    value: m.value,
                    label: m.label,
                    searchText: `${m.label} ${m.position || ''} ${m.email}`,
                    rich: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar
                          size={24}
                          style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {(m.label || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-slate-800)', fontSize: 13 }}>
                            {m.label}
                          </span>
                          {(m.position || m.role) && (
                            <span style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>
                              {m.position || m.role}
                            </span>
                          )}
                        </div>
                      </div>
                    ),
                  }))}
                  optionRender={(option) => (option.data as any).rich}
                  filterOption={(input, option: any) =>
                    (option?.searchText || '').toLowerCase().includes(input.toLowerCase())
                  }
                />
              )}
            </Form.Item>

            <Form.Item
              name="categoryId"
              label="Category"
              rules={[{ required: true, message: 'Pick a category' }]}
            >
              {loading ? (
                <Skeleton.Input active block style={{ height: 42 }} />
              ) : (
                <Select
                  placeholder="Issue type"
                  className="ced-select"
                  options={categories.map((c) => ({
                    value: c.id,
                    label: c.name,
                    rich: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 4,
                            height: 14,
                            borderRadius: 2,
                            background: c.color || '#94a3b8',
                          }}
                        />
                        {c.name}
                      </span>
                    ),
                  }))}
                  optionRender={(option) => (option.data as any).rich}
                />
              )}
            </Form.Item>
          </div>

          {/* Section 2: Issue Particulars */}
          <SectionHeader
            step={2}
            done={stepDetailsDone}
            icon={<BugOutlined />}
            title="Issue Particulars"
            subtitle="Subject, severity, project and detailed context"
          />

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Enter a subject' }]}
          >
            <Input
              placeholder="e.g. Repeated regressions on Employee Profile deploy"
              className="ced-input"
              maxLength={140}
              showCount
            />
          </Form.Item>

          <div className="ced-grid-3">
            <Form.Item
              name="priorityId"
              label={
                <span>
                  <FireOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />
                  Priority
                </span>
              }
              rules={[{ required: true, message: 'Pick a priority' }]}
            >
              {loading ? (
                <Skeleton.Input active block style={{ height: 42 }} />
              ) : (
                <Select
                  placeholder="Severity"
                  className="ced-select"
                  options={priorities.map((p) => ({
                    value: p.id,
                    label: p.name,
                    rich: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: p.color || '#94a3b8',
                          }}
                        />
                        {p.name}
                      </span>
                    ),
                  }))}
                  optionRender={(option) => (option.data as any).rich}
                />
              )}
            </Form.Item>

            <Form.Item
              name="statusId"
              label={
                <span>
                  <FlagOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />
                  Initial status
                </span>
              }
              rules={[{ required: true, message: 'Pick a status' }]}
            >
              {loading ? (
                <Skeleton.Input active block style={{ height: 42 }} />
              ) : (
                <Select
                  placeholder="Status"
                  className="ced-select"
                  options={statuses.map((s) => ({
                    value: s.id,
                    label: s.name,
                    rich: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: s.color || 'var(--premium-blue)',
                          }}
                        />
                        {s.name}
                      </span>
                    ),
                  }))}
                  optionRender={(option) => (option.data as any).rich}
                />
              )}
            </Form.Item>

            <Form.Item
              name="projectId"
              label={
                <span>
                  <ProjectOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />
                  Project
                </span>
              }
            >
              {loading ? (
                <Skeleton.Input active block style={{ height: 42 }} />
              ) : (
                <Select
                  placeholder="Related project"
                  className="ced-select"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={projects.map((p) => ({ value: p.value, label: p.label }))}
                />
              )}
            </Form.Item>
          </div>

          <Form.Item
            name="ticketIds"
            label={
              <span>
                <LinkOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />
                Related tickets
                {!selectedProjectId && (
                  <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-slate-400)', fontWeight: 400 }}>
                    select a project to load tickets
                  </span>
                )}
              </span>
            }
          >
            <Select
              mode="multiple"
              className="ced-select"
              placeholder={selectedProjectId ? 'Link related tickets' : 'No project selected'}
              disabled={!selectedProjectId}
              showSearch
              optionFilterProp="label"
              maxTagCount="responsive"
              notFoundContent={
                selectedProjectId ? 'No tickets for this project' : 'Pick a project first'
              }
              options={tickets.map((t) => ({
                value: t.id,
                label: `${t.ticketNumber} ${t.title}`,
                rich: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Space>
                      <Tag
                        color="blue"
                        bordered={false}
                        style={{ margin: 0, background: 'var(--bg-blue-50)', color: 'var(--premium-blue)' }}
                      >
                        {t.ticketNumber}
                      </Tag>
                      <span style={{ color: 'var(--text-slate-800)', fontWeight: 500 }}>{t.title}</span>
                    </Space>
                    {t.assignee && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text-slate-400)' }}>
                        <UserOutlined />
                        {t.assignee.name}
                      </span>
                    )}
                  </div>
                ),
              }))}
              optionRender={(option) => (option.data as any).rich}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span>
                <FileTextOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />
                Detailed description
              </span>
            }
            rules={[{ required: true, message: 'Provide a detailed description' }]}
          >
            <TextArea
              rows={5}
              placeholder="Provide clear evidence of the issues. Mention specific instances and reproduction steps."
              className="ced-textarea"
              showCount
              maxLength={2000}
            />
          </Form.Item>

          {/* Section 3: Evidence */}
          <SectionHeader
            step={3}
            done={fileList.length > 0}
            icon={<PaperClipOutlined />}
            title="Evidence & attachments"
            subtitle="Optional — screenshots, logs, or reference documents"
          />

          <Upload.Dragger
            multiple
            listType="picture"
            fileList={fileList}
            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            beforeUpload={() => false}
            className="ced-dragger"
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined style={{ color: 'var(--premium-blue)', fontSize: 32 }} />
            </p>
            <p className="ant-upload-text" style={{ fontWeight: 600, color: 'var(--text-slate-900)', fontSize: 14 }}>
              Drop files here, or <span style={{ color: 'var(--premium-blue)' }}>click to browse</span>
            </p>
            <p className="ant-upload-hint" style={{ color: 'var(--text-slate-400)', fontSize: 12 }}>
              Screenshots, logs, or any supporting documents
            </p>
          </Upload.Dragger>
        </Form>
      </div>
    </Drawer>
  );
};

export default CreateEscalationDrawer;
