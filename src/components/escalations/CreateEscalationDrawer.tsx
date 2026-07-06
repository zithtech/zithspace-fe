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
import { ExternalLink, FileText, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { hivebugStyles } from '@/components/projects/bug-list/hivebug-styles';

import { api } from '@/lib/axios';
import { EscalationServiceV2 } from '@/services/escalationServiceV2';

import { EscalationSettingsService } from '@/services/escalationSettings';
import { commonDrawerProps, drawerFormStyles, SectionCard } from '@/components/common/DrawerSection';

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
  const { theme } = useTheme();
  const [previewFile, setPreviewFile] = useState<any>(null);

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

    const categoryId = editData.escalation_category_id || null;
    const priorityId = editData.escalation_priority_id || null;
    const projectId = editData.project_id || undefined;
    const subject = editData.short_summary || '';
    const description = editData.detailed_description || '';

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

    if (editData.document_url) {
      try {
        const urls = JSON.parse(editData.document_url);
        if (Array.isArray(urls)) {
          const initialFileList = urls.map((url, index) => {
            let fileName = url.split('/').pop() || `Attachment ${index + 1}`;

            // Remove the 12-character nanoid prefix if it exists
            const match = fileName.match(/^[\w-]{12}_(.+)$/);
            if (match) {
              fileName = match[1];
            }

            return {
              uid: `existing-${index}`,
              name: fileName,
              status: 'done',
              url: url,
            };
          });
          setFileList(initialFileList);
        }
      } catch (e) {
        console.error("Failed to parse document_url", e);
      }
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
        const newFiles = fileList.filter(f => f.originFileObj);
        const existingUrls = fileList.filter(f => !f.originFileObj && f.url).map(f => f.url);

        const filePromises = newFiles.map(
          (fileItem) =>
            new Promise<{ fileName: string; fileBase64: string }>((resolve, reject) => {
              const file = fileItem.originFileObj;
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve({ fileName: file.name, fileBase64: reader.result as string });
              reader.onerror = reject;
            }),
        );
        const attachments = await Promise.all(filePromises);

        await EscalationServiceV2.updateEscalation(editingId, {
          subject: values.subject,
          description: values.description,
          categoryId: values.categoryId,
          priorityId: values.priorityId,
          projectId: values.projectId,
          targetMemberIds: values.targetUsers,
          ticketIds: values.ticketIds || [],
          attachments: attachments.length > 0 ? attachments : undefined,
          existingUrls: existingUrls.length > 0 ? existingUrls : undefined,
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
    <>
      <Drawer
        {...commonDrawerProps}
        open={open}
        onClose={handleClose}
        destroyOnHidden={false}
      >
        <style>{drawerFormStyles}</style>
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Drawer Header */}
          <div
            className="customer-drawer-header"
            style={{
              padding: "16px 14px 12px 14px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 0,
                  background: "rgba(220, 38, 38, 0.10)",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {isLoading && isEditMode ? <LoadingOutlined /> : isEditMode ? <EditOutlined /> : <AlertOutlined />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {isEditMode ? 'Edit Escalation' : 'Raise Manual Escalation'}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
                  {isEditMode
                    ? isLoading
                      ? 'Loading escalation details…'
                      : 'Update the escalation details below.'
                    : 'Flag a quality or performance concern.'}
                </div>
              </div>
            </div>
            <Space>
              <Button
                type="text"
                shape="circle"
                icon={<CloseOutlined />}
                onClick={handleClose}
                style={{ color: "var(--text-slate-500)" }}
              />
            </Space>
          </div>

          {/* Drawer Form Content */}
          <div style={{ padding: "16px 16px", flex: 1, overflowY: "auto" }}>
            <Form
              form={form}
              layout="horizontal"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              labelAlign="left"
              colon={false}
              className="customer-drawer-form"
              onFinish={onFinish}
            >
              <div style={{ display: 'flex', gap: 16, background: 'var(--bg-slate-50)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, border: '1px solid var(--border-slate-200)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-slate-700)' }}>
                  <ThunderboltOutlined style={{ color: '#f59e0b', fontSize: 16 }} />
                  <span>
                    <strong>24 hr</strong> review SLA
                  </span>
                </div>
                <div style={{ width: 1, height: 16, background: 'var(--border-slate-200)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-slate-700)' }}>
                  <BulbOutlined style={{ color: '#3b82f6', fontSize: 16 }} />
                  <span>Be specific — add evidence</span>
                </div>
              </div>

              {/* ── Section 1: Team Context ─────────────────────────────── */}
              <SectionCard
                step="STEP 1"
                icon={<UserOutlined />}
                title="Team Context"
                subtitle="Who is this about and what type of issue?"
              >
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
                      style={{ borderRadius: 6 }}
                      options={selectMembersOptions.map((m) => ({
                        value: m.value,
                        label: m.label,
                        searchText: `${m.label} ${m.position || ''} ${m.email}`,
                        rich: (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar
                              size={24}
                              style={{ background: '#3B82F6', fontSize: 11, fontWeight: 600 }}
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
                      style={{ borderRadius: 6 }}
                      options={selectCategoriesOptions.map((c) => ({
                        value: c.id,
                        label: c.name,
                        rich: (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ width: 4, height: 14, borderRadius: 0, background: c.color || '#94a3b8' }} />
                            {c.name}
                          </span>
                        ),
                      }))}
                      optionRender={(option) => (option.data as any).rich}
                    />
                  )}
                </Form.Item>

              </SectionCard>

              {/* ── Section 2: Issue Particulars ────────────────────────── */}
              <SectionCard
                step="STEP 2"
                icon={<BugOutlined />}
                title="Issue Particulars"
                subtitle="Subject, severity, project and detailed context"
              >
                <Form.Item
                  name="subject"
                  label="Subject"
                  rules={[
                    { required: true, message: 'Enter a subject' },
                    {
                      pattern: /^[a-zA-Z0-9\s.,!?'"()-]+$/,
                      message: 'Subject can only contain letters, numbers, and basic punctuation'
                    }
                  ]}
                  style={{ marginBottom: 14 }}
                >
                  <Input
                    placeholder="e.g. Repeated regressions on Employee Profile deploy"
                    style={{ borderRadius: 6 }}
                    maxLength={140}
                    showCount
                    onKeyPress={(e) => {
                      if (!/^[a-zA-Z0-9\s.,!?'"()-]+$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                  />
                </Form.Item>

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
                        style={{ borderRadius: 6 }}
                        options={priorities.map((p) => ({
                          value: p.id,
                          label: p.name,
                          rich: (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ width: 8, height: 8, borderRadius: 0, background: p.color || '#94a3b8' }} />
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
                        style={{ borderRadius: 6 }}
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        options={selectProjectsOptions.map((p) => ({ value: p.value, label: p.label }))}
                      />
                    )}
                  </Form.Item>

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
                      style={{ borderRadius: 6 }}
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
                    label={<span><FileTextOutlined style={{ marginRight: 6, color: 'var(--text-slate-400)' }} />Detailed description</span>}
                    rules={[{ required: true, message: 'Provide a detailed description' }]}
                    style={{ marginBottom: 14 }}
                  >
                    <TextArea
                      rows={5}
                      placeholder="Provide clear evidence of the issues. Mention specific instances and reproduction steps."
                      style={{ padding: '12px 16px', borderRadius: 6 }}
                      showCount
                      maxLength={2000}
                    />
                  </Form.Item>
              </SectionCard>

              {/* ── Section 3: Evidence ──────────────── */}
              <SectionCard
                step="STEP 3"
                icon={<PaperClipOutlined />}
                title="Evidence & attachments"
                subtitle="Optional — screenshots, logs, or reference documents"
              >
                <Upload.Dragger
                  multiple
                  listType="picture"
                  fileList={fileList}
                  onChange={({ fileList: fl }) => setFileList(fl)}
                  onPreview={async (file) => {
                    if (!file.url && !file.preview && file.originFileObj) {
                      file.preview = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(file.originFileObj as Blob);
                        reader.onload = () => resolve(reader.result as string);
                      });
                    }
                    setPreviewFile(file);
                  }}
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
              </SectionCard>
            </Form>
          </div> {/* End Drawer Form Content */}

          {/* Drawer Footer */}
          <div
            className="customer-drawer-footer"
            style={{
              padding: "14px 28px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              position: "sticky",
              bottom: 0,
              gap: 8
            }}
          >
            <Button onClick={handleClose} style={{ borderRadius: 6, height: 38, fontWeight: 600, padding: "0 18px" }}>Discard</Button>
            <Button
              onClick={() => form.submit()}
              type="primary"
              loading={submitting}
              disabled={isLoading}
              style={{
                fontWeight: 600,
                height: 38,
                padding: '0 18px',
                borderRadius: 6,
              }}
            >
              {isEditMode ? 'Save Changes' : 'Post Escalation'}
            </Button>
          </div>
        </div>
      </Drawer>

      <Drawer
        placement="left"
        width={700}
        closable={false}
        title={null}
        footer={null}
        mask={false}
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        className={`hb-preview-drawer ${theme === "dark" ? "hb-preview-drawer-dark" : "hb-preview-drawer-light"}`}
        styles={{
          body: { padding: 0, height: '100%' }
        }}
      >
        {previewFile && (
          (() => {
            const displayUrl = (() => {
              let url = previewFile.url || previewFile.preview || "";
              if (url.includes("r2.cloudflarestorage.com")) {
                url = url.replace(
                  /https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+/,
                  "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev"
                );
              }
              if (url.includes(".r2.dev") && !url.includes(".r2.dev/")) {
                url = url.replace(".r2.dev", ".r2.dev/");
              }
              return url;
            })();

            const fileType = previewFile.type || (previewFile.name ? previewFile.name.split('.').pop()?.toLowerCase() : '');

            return (
              <div className="hb-preview-shell">
                <div className="hb-preview-header">
                  <div className="hb-preview-fileinfo">
                    <FileText size={16} className="hb-preview-icon" />
                    <div className="hb-preview-meta">
                      <div className="hb-preview-filename">{previewFile.name}</div>
                      <div className="hb-preview-filesize">
                        {previewFile.size ? formatBytes(previewFile.size) : fileType}
                      </div>
                    </div>
                  </div>
                  <div className="hb-preview-actions">
                    <button
                      className="hb-preview-btn"
                      onClick={() => {
                        if (displayUrl) window.open(displayUrl, '_blank');
                      }}
                      title="Open in new tab"
                    >
                      <ExternalLink size={16} />
                    </button>
                    <button
                      className="hb-preview-close"
                      onClick={() => setPreviewFile(null)}
                      aria-label="Close preview"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="hb-preview-body">
                  {(() => {
                    const isImage =
                      fileType?.startsWith("image/") ||
                      displayUrl.startsWith("data:image/") ||
                      /\.(jpg|jpeg|png|gif|webp|svg)/i.test(displayUrl);

                    const isVideo =
                      fileType?.startsWith("video/") ||
                      /\.(mp4|webm|ogg|mov)/i.test(displayUrl);

                    const isPdf =
                      fileType === "application/pdf" ||
                      /\.pdf/i.test(displayUrl) || fileType === "pdf";

                    if (!displayUrl) return <div className="hb-preview-error">No preview available</div>;

                    if (isImage) {
                      return (
                        <div className="hb-preview-media-container">
                          <img src={displayUrl} alt={previewFile.name} className="hb-preview-image" />
                        </div>
                      );
                    }
                    if (isVideo) {
                      return (
                        <div className="hb-preview-media-container">
                          <video src={displayUrl} controls className="hb-preview-video" />
                        </div>
                      );
                    }
                    if (isPdf) {
                      const googleDocsUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(displayUrl)}&embedded=true`;
                      return <iframe src={googleDocsUrl} className="hb-preview-iframe" title="PDF Preview" />;
                    }

                    return (
                      <div className="hb-preview-fallback">
                        <FileText size={48} />
                        <p>Preview not available for this file type</p>
                        <button
                          className="hb-cbd-primary"
                          onClick={() => {
                            if (displayUrl) window.open(displayUrl, '_blank');
                          }}
                        >
                          Download File
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })()
        )}
      </Drawer>
    </>
  );
};

function formatBytes(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default CreateEscalationDrawer;
