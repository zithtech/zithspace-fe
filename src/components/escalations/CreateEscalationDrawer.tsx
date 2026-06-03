'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  App,
} from 'antd';
import {
  UserOutlined,
  BugOutlined,
  PaperClipOutlined,
  SendOutlined,
  CloseOutlined,
  AlertOutlined,
  FireOutlined,
  ProjectOutlined,
  LinkOutlined,
  CloudUploadOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  BulbOutlined,
  ThunderboltOutlined,
  EditOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { api } from '@/lib/axios';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';
import { EscalationSettingsService } from '@/services/escalationSettings';

const { Text } = Typography;
const { TextArea } = Input;

/* -------------------------------------------------------------------------- */
/*                               Interfaces                                   */
/* -------------------------------------------------------------------------- */

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
  /** The ID of the escalation to edit. When provided the drawer opens in edit mode. */
  editingId?: string;
}

/* -------------------------------------------------------------------------- */
/*                             Section Header                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                                 Drawer                                     */
/* -------------------------------------------------------------------------- */

const CreateEscalationDrawer: React.FC<CreateEscalationDrawerProps> = ({
  open,
  onClose,
  onSuccess,
  editingId,
}) => {
  const [form] = Form.useForm();
  const [loadingRef, setLoadingRef] = useState(false);  // reference data loading
  const [loadingEdit, setLoadingEdit] = useState(false); // escalation data loading
  const [submitting, setSubmitting] = useState(false);
  const { message } = App.useApp();

  const isEditMode = !!editingId;

  /* ── Reference data ─────────────────────────────────────────────────── */
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);

  /* ── Escalation being edited (full detail from API) ─────────────────── */
  const [editData, setEditData] = useState<any>(null);

  // Memoized options that merge active reference list with editing values if inactive
  const selectMembersOptions = useMemo(() => {
    const list = [...members];
    if (isEditMode && editData?.targetMembers) {
      editData.targetMembers.forEach((tm: any) => {
        const userId = tm?.user?.id;
        const userName = tm?.user?.name;
        if (userId && !list.some((m) => m.value === userId)) {
          list.push({
            value: userId,
            label: userName || 'Inactive User',
            email: tm?.user?.email || '',
            position: tm?.user?.position?.title || tm?.user?.role,
          });
        }
      });
    }
    return list;
  }, [members, isEditMode, editData]);

  const selectCategoriesOptions = useMemo(() => {
    const list = [...categories];
    if (isEditMode && editData) {
      const catId = editData.escalation_category_id;
      const catName = editData.category_name;
      const catColor = editData.category_color;
      if (catId && !list.some((c) => c.id === catId)) {
        list.push({
          id: catId,
          name: catName || 'Inactive Category',
          color: catColor || '#94a3b8',
        });
      }
    }
    return list;
  }, [categories, isEditMode, editData]);

  const selectProjectsOptions = useMemo(() => {
    const list = [...projects];
    if (isEditMode && editData) {
      const projId = editData.project_id;
      const projName = editData.project?.name || editData.project_name;
      if (projId && !list.some((p) => p.value === projId)) {
        list.push({
          value: projId,
          label: projName || 'Inactive Project',
        });
      }
    }
    return list;
  }, [projects, isEditMode, editData]);

  /* ── Guards ─────────────────────────────────────────────────────────── */
  // Prevents double-population per open session
  const populatedRef = useRef(false);
  // Holds ticketIds to apply after ticket options are fetched
  const pendingTicketIds = useRef<string[] | null>(null);

  /* ── Watchers for step indicators ───────────────────────────────────── */
  const watchedTargets: string[] = Form.useWatch('targetUsers', form) || [];
  const watchedCategory = Form.useWatch('categoryId', form);
  const watchedSubject = Form.useWatch('subject', form);
  const watchedPriority = Form.useWatch('priorityId', form);
  const watchedDescription = Form.useWatch('description', form);

  const stepContextDone = watchedTargets.length > 0 && !!watchedCategory;
  const stepDetailsDone = !!watchedSubject && !!watchedPriority && !!watchedDescription;

  const notify = (type: 'success' | 'error', title: string, description: string) => {
    if (type === 'success') message.success(`${title} — ${description}`);
    else message.error(`${title} — ${description}`);
  };

  /* ── 1. Fetch reference data (members, categories, priorities …) ─────── */
  useEffect(() => {
    if (!open) {
      // Reset everything when drawer closes
      populatedRef.current = false;
      pendingTicketIds.current = null;
      setEditData(null);
      return;
    }

    // Already cached – nothing to load
    if (members.length > 0 && categories.length > 0 && statuses.length > 0) return;

    const load = async () => {
      setLoadingRef(true);
      try {
        const [membersRes, categoriesRes, prioritiesRes, projectsRes, statusesRes] = await Promise.all([
          api.get('/api/members/select'),
          EscalationSettingsService.getCategories(),
          EscalationSettingsService.getPriorities(),
          api.get('/api/projects/select'),
          EscalationSettingsService.getStatuses(),
        ]);

        const activeStatuses = (statusesRes || []).filter((s: Status) => s.isActive);

        setMembers(membersRes || []);
        setProjects(projectsRes || []);
        setCategories((categoriesRes || []).filter((c: Category) => c.isActive));
        setPriorities((prioritiesRes || []).filter((p: Priority) => p.isActive));
        setStatuses(activeStatuses);

      } catch (err) {
        console.error('Failed to load reference data:', err);
        notify('error', 'Load Failed', 'Failed to load form data. Please close and reopen.');
      } finally {
        setLoadingRef(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* ── 2. Fetch full escalation details when editing ─────────────────── */
  useEffect(() => {
    if (!open || !isEditMode || !editingId) return;

    const load = async () => {
      setLoadingEdit(true);
      try {
        const data = await EscalationServiceV2.getEscalationById(editingId);
        setEditData(data);
      } catch (err) {
        console.error('Failed to load escalation for editing:', err);
        notify('error', 'Load Failed', 'Could not load escalation details. Please try again.');
      } finally {
        setLoadingEdit(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingId]);

  /* ── 3. Populate form once BOTH reference data AND edit data are ready ─ */
  useEffect(() => {
    if (
      !open ||
      !isEditMode ||
      !editData ||
      populatedRef.current ||
      categories.length === 0 ||
      priorities.length === 0 ||
      statuses.length === 0 ||
      members.length === 0
    ) {
      return;
    }

    populatedRef.current = true;

    // ── Map exact DB column names to form field names ─────────────────────
    // DB returns: escalation_category_id, escalation_priority_id,
    //             initial_status_id, project_id, short_summary,
    //             detailed_description, targetMembers[].user.id,
    //             tickets[].ticket.id

    const categoryId   = editData.escalation_category_id || null;
    const priorityId   = editData.escalation_priority_id  || null;
    const projectId    = editData.project_id               || undefined;
    const subject      = editData.short_summary            || '';
    const description  = editData.detailed_description     || '';

    // targetMembers is a JSON aggregated array: [{ user: { id, name, ... } }]
    const targetUsers = (editData.targetMembers || [])
      .map((m: any) => m?.user?.id)
      .filter(Boolean);

    // tickets is a JSON aggregated array: [{ ticket: { id, ticketNumber, title } }]
    const ticketIds = (editData.tickets || [])
      .map((t: any) => t?.ticket?.id)
      .filter(Boolean);

    // Store ticketIds to apply after ticket options are loaded via selectedProjectId effect
    pendingTicketIds.current = ticketIds.length > 0 ? ticketIds : null;

    form.setFieldsValue({
      subject,
      description,
      categoryId,
      priorityId,
      projectId,
      targetUsers,
    });

    // If no project, no tickets to load — clear pending
    if (!projectId) {
      pendingTicketIds.current = null;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEditMode, editData, categories, priorities, statuses, members]);


  /* ── 4. Fetch tickets when project changes ──────────────────────────── */
  const selectedProjectId = Form.useWatch('projectId', form);

  useEffect(() => {
    const load = async () => {
      if (!selectedProjectId) {
        setTickets([]);
        return;
      }
      try {
        const res = await api.get(`/api/tickets?projectId=${selectedProjectId}&limit=100`);
        setTickets(res || []);

        if (pendingTicketIds.current !== null) {
          // Apply pending ticketIds now that options are available
          form.setFieldsValue({ ticketIds: pendingTicketIds.current });
          pendingTicketIds.current = null;
        } else if (!isEditMode) {
          form.setFieldsValue({ ticketIds: [] });
        }
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  /* ── Handlers ───────────────────────────────────────────────────────── */

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setTickets([]);
    setEditData(null);
    pendingTicketIds.current = null;
    populatedRef.current = false;
    onClose();
  };

  const onFinish = async (values: any) => {
    setSubmitting(true);
    try {
      if (isEditMode && editingId) {
        await EscalationServiceV2.updateEscalation(editingId, {
          subject: values.subject,
          description: values.description,
          categoryId: values.categoryId,
          priorityId: values.priorityId,
          projectId: values.projectId,
          targetMemberIds: values.targetUsers,
          ticketIds: values.ticketIds || [],
        });
        notify('success', 'Escalation Updated', 'The escalation has been successfully updated.');
      } else {
        const filePromises = fileList.map(
          (fileItem) =>
            new Promise<{ fileName: string; fileBase64: string }>((resolve, reject) => {
              const file = fileItem.originFileObj || fileItem;
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve({ fileName: file.name, fileBase64: reader.result as string });
              reader.onerror = reject;
            }),
        );
        const attachments = await Promise.all(filePromises);

        const defaultStatus = statuses.find((s) => s.isDefault);

        await EscalationServiceV2.createEscalation({
          subject: values.subject,
          description: values.description,
          categoryId: values.categoryId,
          priorityId: values.priorityId,
          projectId: values.projectId,
          statusId: defaultStatus?.id || statuses[0]?.id || '',
          targetMemberIds: values.targetUsers,
          ticketIds: values.ticketIds || [],
          attachments,
        });
        notify('success', 'Escalation Created', 'The escalation has been posted to technical leadership.');
      }

      handleClose();
      onSuccess?.();
    } catch (err) {
      console.error('Failed to save escalation:', err);
      notify(
        'error',
        isEditMode ? 'Update Failed' : 'Submission Failed',
        isEditMode
          ? 'Failed to update escalation. Please check your inputs.'
          : 'Failed to create escalation. Please check your inputs.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Derived loading state ───────────────────────────────────────────── */
  const isLoading = loadingRef || loadingEdit;

  /* ── Render ─────────────────────────────────────────────────────────── */
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
              icon={isEditMode ? <EditOutlined /> : <SendOutlined />}
              loading={submitting}
              disabled={isLoading}
              onClick={() => form.submit()}
              className="ced-btn-primary"
            >
              {isEditMode ? 'Save Changes' : 'Post Escalation'}
            </Button>
          </div>
        </div>
      }
    >
      {/* Hero header */}
      <div className="ced-hero">
        <div className="ced-hero__bg" />
        <div className="ced-hero__content">
          <div className="ced-hero__top">
            <div className="ced-hero__icon">
              {isLoading && isEditMode ? <LoadingOutlined /> : isEditMode ? <EditOutlined /> : <AlertOutlined />}
            </div>
            <div className="ced-hero__text">
              <div className="ced-hero__title">
                {isEditMode ? 'Edit Escalation' : 'Raise Manual Escalation'}
              </div>
              <div className="ced-hero__sub">
                {isEditMode
                  ? isLoading
                    ? 'Loading escalation details…'
                    : 'Update the escalation details below. All changes will be saved immediately.'
                  : 'Flag a quality or performance concern. Technical leads are notified immediately.'}
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

          {/* ── Section 1: Team Context ─────────────────────────────── */}
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
              {isLoading ? (
                <Skeleton.Input active block style={{ height: 42 }} />
              ) : (
                <Select
                  mode="multiple"
                  showSearch
                  placeholder="Search by name or role…"
                  maxTagCount="responsive"
                  optionFilterProp="label"
                  className="ced-select"
                  options={selectMembersOptions.map((m) => ({
                    value: m.value,
                    label: m.label,
                    searchText: `${m.label} ${m.position || ''} ${m.email}`,
                    rich: (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar
                          size={24}
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: 11, fontWeight: 600 }}
                        >
                          {(m.label || '?').charAt(0).toUpperCase()}
                        </Avatar>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-slate-800)', fontSize: 13 }}>{m.label}</span>
                          {(m.position || m.role) && (
                            <span style={{ fontSize: 11, color: 'var(--text-slate-400)' }}>{m.position || m.role}</span>
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
              {isLoading ? (
                <Skeleton.Input active block style={{ height: 42 }} />
              ) : (
                <Select
                  placeholder="Issue type"
                  className="ced-select"
                  options={selectCategoriesOptions.map((c) => ({
                    value: c.id,
                    label: c.name,
                    rich: (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 4, height: 14, borderRadius: 2, background: c.color || '#94a3b8' }} />
                        {c.name}
                      </span>
                    ),
                  }))}
                  optionRender={(option) => (option.data as any).rich}
                />
              )}
            </Form.Item>
          </div>

          {/* ── Section 2: Issue Particulars ────────────────────────── */}
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

          <div className="ced-grid-2">
            <Form.Item
              name="priorityId"
              label={<span><FireOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />Priority</span>}
              rules={[{ required: true, message: 'Pick a priority' }]}
            >
              {isLoading ? (
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
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color || '#94a3b8' }} />
                        {p.name}
                      </span>
                    ),
                  }))}
                  optionRender={(option) => (option.data as any).rich}
                />
              )}
            </Form.Item>

            <Form.Item
              name="projectId"
              label={<span><ProjectOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />Project</span>}
            >
              {isLoading ? (
                <Skeleton.Input active block style={{ height: 42 }} />
              ) : (
                <Select
                  placeholder="Related project"
                  className="ced-select"
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={selectProjectsOptions.map((p) => ({ value: p.value, label: p.label }))}
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
              notFoundContent={selectedProjectId ? 'No tickets for this project' : 'Pick a project first'}
              options={tickets.map((t) => ({
                value: t.id,
                label: `${t.ticketNumber} ${t.title}`,
                rich: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <Space>
                      <Tag color="blue" bordered={false} style={{ margin: 0, background: 'var(--bg-blue-50)', color: 'var(--premium-blue)' }}>
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
            style={{ marginTop: 20 }}
            label={<span><FileTextOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />Detailed description</span>}
            rules={[{ required: true, message: 'Provide a detailed description' }]}
          >
            <TextArea
              rows={5}
              placeholder="Provide clear evidence of the issues. Mention specific instances and reproduction steps."
              className="ced-textarea"
              style={{ padding: '12px 16px' }}
              showCount
              maxLength={2000}
            />
          </Form.Item>

          {/* ── Section 3: Evidence (create mode only) ──────────────── */}
          {!isEditMode && (
            <>
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
                onChange={({ fileList: fl }) => setFileList(fl)}
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
            </>
          )}
        </Form>
      </div>
    </Drawer>
  );
};

export default CreateEscalationDrawer;
