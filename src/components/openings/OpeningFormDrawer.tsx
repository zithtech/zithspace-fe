'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { App,
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  DatePicker,
  Tooltip,
} from 'antd';
import {
  Plus,
  Trash2,
  Star,
  Info,
  X,
  Briefcase,
  FileText,
  Wallet,
  Building2,
  Tag,
  Users,
  UsersRound,
  FileCheck,
} from 'lucide-react';
import dayjs from 'dayjs';

import { SearchableDropdown } from '@/components/common/SearchableDropdown';
import { PositionService } from '@/services/positionService';
import AiAssistTextArea from './AiAssistTextArea';
import OpeningV2Service, {
  type AssistContext,
  type CreateOpeningInput,
  type HiringTeamMemberInput,
  type OpeningDetail,
  type RecruiterInput,
  type RequiredDocumentInput,
} from '@/services/openingV2Service';
import {
  EMPLOYMENT_TYPE_LABELS,
  HIRING_TYPE_LABELS,
  MEMBER_TYPE_LABELS,
  PALETTE,
  VISIBILITY_LABELS,
  WORK_MODE_LABELS,
} from './ui';
import { useReferenceData } from './useReferenceData';
// The platform's shared drawer kit — same chrome as the Members "Add Member"
// drawer, so this reads as part of the product rather than its own thing.
import {
  SectionCard,
  commonDrawerProps,
  drawerFormStyles as formStyles,
} from '@/components/common/DrawerSection';
import { SKILLS_DATA } from '@/data/skillsData';
import { EDUCATION_OPTIONS, CERTIFICATION_OPTIONS } from '@/data/qualificationsData';
import { useSkills } from '@/hooks/useSkills';

// Create / edit an opening. One drawer for both: `openingId` decides which.
//
// Everything here is Phase 1 of the backend — linkage, job details,
// classification, and the three child collections. Status is deliberately absent:
// an opening is always born in `draft` and moves only through the approval and
// lifecycle endpoints, so offering a status picker here would be a lie.

const DOCUMENT_PRESETS = [
  'Resume',
  'Aadhaar',
  'PAN',
  'Degree Certificate',
  'Experience Letter',
  'Relieving Letter',
  'Payslips',
  'Photograph',
];

interface Props {
  open: boolean;
  openingId?: string | null;
  onClose: () => void;
  onSaved: (opening: OpeningDetail) => void;
}

export default function OpeningFormDrawer({ open, openingId, onClose, onSaved }: Props) {
  const { message } = App.useApp();

  const [form] = Form.useForm();
  const reference = useReferenceData(open);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Existing position titles double as the job-title catalog. The dropdown is
  // free-text, so a title that has never been used before is still allowed.
  const [titleOptions, setTitleOptions] = useState<
    { value: string; label: string; description?: string }[]
  >([]);
  const [recruiters, setRecruiters] = useState<RecruiterInput[]>([]);
  const [hiringTeam, setHiringTeam] = useState<HiringTeamMemberInput[]>([]);
  const [documents, setDocuments] = useState<RequiredDocumentInput[]>([]);

  const { skills: dynamicSkills, fetchSkills } = useSkills();

  const allSkillsOptions = useMemo(() => {
    const map = new Map<string, string>();
    SKILLS_DATA.forEach(s => map.set(s.name, s.name));
    (dynamicSkills || []).forEach((s: any) => {
      if (s.name) map.set(s.name, s.name);
    });
    return Array.from(map.values()).sort().map(name => ({ label: name, value: name }));
  }, [dynamicSkills]);

  const isEdit = !!openingId;

  const reqSkills = Form.useWatch('requiredSkills', form);
  const prefSkills = Form.useWatch('preferredSkills', form);

  useEffect(() => {
    if (open) fetchSkills();
  }, [open, fetchSkills]);

  useEffect(() => {
    if (!open || titleOptions.length) return;
    PositionService.getAll()
      .then((positions) => {
        const seen = new Set<string>();
        const options: { value: string; label: string; description?: string }[] = [];
        for (const p of positions ?? []) {
          const title = (p as any)?.title?.trim();
          if (!title || seen.has(title.toLowerCase())) continue;
          seen.add(title.toLowerCase());
          options.push({
            value: title,
            label: title,
            description: (p as any)?.department?.name ?? (p as any)?.code ?? undefined,
          });
        }
        setTitleOptions(options);
      })
      // A missing catalog must not block the form — the field still takes free text.
      .catch(() => setTitleOptions([]));
  }, [open, titleOptions.length]);

  /**
   * The AI endpoints ground their output in the rest of the form, so read it
   * fresh at click time rather than closing over stale values.
   */
  const assistContext = (): AssistContext => {
    const v = form.getFieldsValue();
    return {
      jobTitle: (v.jobTitle ?? '').trim(),
      departmentName:
        reference.departments.find((d) => d.value === v.departmentId)?.label ?? null,
      employmentType: v.employmentType || null,
      workMode: v.workMode || null,
      location: v.location || null,
      minExperience: v.minExperience === '' ? null : (v.minExperience ?? null),
      maxExperience: v.maxExperience === '' ? null : (v.maxExperience ?? null),
      requiredSkills: v.requiredSkills ?? [],
      preferredSkills: v.preferredSkills ?? [],
    };
  };

  useEffect(() => {
    if (!open) return;

    if (!openingId) {
      form.resetFields();
      form.setFieldsValue({
        employmentType: 'full_time',
        workMode: 'office',
        numberOfPositions: 1,
        priority: 'medium',
        visibility: 'both',
        salaryCurrency: 'INR',
        salaryPeriod: 'yearly',
      });
      setRecruiters([]);
      setHiringTeam([]);
      setDocuments([{ documentName: 'Resume', isMandatory: true }]);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const o = await OpeningV2Service.get(openingId);
        form.setFieldsValue({
          ...o,
          targetJoiningDate: o.targetJoiningDate ? dayjs(o.targetJoiningDate) : null,
        });
        setRecruiters(
          o.recruiters.map((r) => ({ recruiterId: r.recruiterId, isPrimary: r.isPrimary }))
        );
        setHiringTeam(
          o.hiringTeam.map((m) => ({
            memberType: m.memberType,
            memberId: m.memberId,
            memberName: m.memberName,
            memberEmail: m.memberEmail,
          }))
        );
        setDocuments(
          o.requiredDocuments.map((d) => ({
            documentName: d.documentName,
            isMandatory: d.isMandatory,
            notes: d.notes,
          }))
        );
      } catch (err: any) {
        message.error(err?.response?.data?.error || 'Could not load the opening');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, openingId]);

  const peopleOptions = reference.people;

  const availableRecruiters = useMemo(
    () => peopleOptions.filter((p) => !recruiters.some((r) => r.recruiterId === p.value)),
    [peopleOptions, recruiters]
  );

  const nameOf = (id?: string | null) =>
    peopleOptions.find((p) => p.value === id)?.label ?? id ?? '—';

  const handleSubmit = async () => {
    let values: any;
    try {
      values = await form.validateFields();
    } catch {
      message.error('Please fix the highlighted fields');
      return;
    }

    // The backend rejects a referral-style team member with neither id nor name,
    // so drop half-filled rows rather than sending them.
    const cleanTeam = hiringTeam.filter((m) => m.memberId || m.memberName);
    const cleanDocs = documents.filter((d) => d.documentName?.trim());

    const payload: CreateOpeningInput = {
      ...values,
      targetJoiningDate: values.targetJoiningDate
        ? dayjs(values.targetJoiningDate).format('YYYY-MM-DD')
        : null,
      recruiters,
      hiringTeam: cleanTeam,
      requiredDocuments: cleanDocs,
    };

    setSaving(true);
    try {
      const saved = openingId
        ? await OpeningV2Service.update(openingId, payload)
        : await OpeningV2Service.create(payload);
      message.success(openingId ? 'Opening updated' : `Opening ${saved.openingCode} created`);
      onSaved(saved);
    } catch (err: any) {
      const data = err?.response?.data;
      // Zod validation errors come back as a details[] of path/message pairs.
      if (data?.details?.length) {
        message.error(`${data.details[0].path}: ${data.details[0].message}`);
      } else {
        message.error(data?.error || 'Could not save the opening');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer {...commonDrawerProps} width={900} open={open} onClose={onClose} footer={null}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <style>{formStyles}</style>

        {/* Header */}
        <div
          className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
          style={{
            background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
            borderColor: 'var(--border-color)',
          }}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(59,130,246,0.10)',
                color: '#3b82f6',
                border: '1px solid var(--border-blue-200)',
              }}
            >
              <Briefcase size={18} strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {isEdit ? 'Edit Opening' : 'New Opening'}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {isEdit
                  ? 'Update this requisition'
                  : 'Created as a draft — submit it for approval when it is ready'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable form body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            background: 'var(--customers-page-bg)',
          }}
        >
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        labelAlign="left"
        disabled={loading}
        className="omf customer-drawer-form"
        colon={false}
        requiredMark="optional"
      >
        {/* ── Job details ─────────────────────────────────────────────── */}
        <SectionCard
          step="STEP 1"
          icon={<FileText size={13} strokeWidth={2.25} />}
          title="Job details"
          subtitle="What the role is and who you are looking for"
        >

        <Form.Item
          name="jobTitle"
          label="Job title"
          normalize={(v) => typeof v === 'string' ? v.replace(/[^a-zA-Z0-9\s\-&]/g, '') : v}
          rules={[
            { required: true, message: 'A job title is required' },
            { pattern: /^[a-zA-Z0-9\s\-&]*$/, message: 'Job title contains invalid characters' }
          ]}
        >
          <SearchableDropdown
            options={titleOptions}
            // freeText lets the typed value itself be submitted, so a brand-new
            // title does not need a position record to exist first.
            freeText
            placeholder="Search existing titles, or type a new one"
            searchPlaceholder="Search or type a title…"
            itemNoun="titles"
            width={420}
          />
        </Form.Item>

        <div className="omf-grid-3">
          <Form.Item
            name="employmentType"
            label="Employment type"
            rules={[{ required: true, message: 'Required' }]}
          >
            <SearchableDropdown
              options={Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder="Select type"
              hideAvatar
              allowClear={false}
            />
          </Form.Item>
          <Form.Item
            name="workMode"
            label="Work mode"
            rules={[{ required: true, message: 'Required' }]}
          >
            <SearchableDropdown
              options={Object.entries(WORK_MODE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder="Select mode"
              hideAvatar
              allowClear={false}
            />
          </Form.Item>
          <Form.Item name="numberOfPositions" label="Number of positions">
            <InputNumber min={1} max={10000} style={{ width: '100%' }} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
          </Form.Item>
        </div>

        <Form.Item
          name="jobDescription"
          label="Job description"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
        >
          <AiAssistTextArea
            field="job_description"
            getContext={assistContext}
            rows={5}
            placeholder="What the role is and why it exists…"
          />
        </Form.Item>

        <Form.Item
          name="responsibilities"
          label="Responsibilities"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
        >
          <AiAssistTextArea
            field="responsibilities"
            getContext={assistContext}
            rows={4}
            placeholder="Day-to-day ownership…"
          />
        </Form.Item>

        <div className="omf-grid-2">
        <Form.Item label="Required skills" style={{ marginBottom: reqSkills?.length ? 4 : 14 }}>
          <Form.Item name="requiredSkills" style={{ marginBottom: 0 }} 
            normalize={(val) => Array.isArray(val) ? val.map((v: string) => v.replace(/[^a-zA-Z0-9\s\+#\.\-]/g, '')) : val}
            rules={[{
              validator: async (_, value) => {
                if (value && value.some((v: string) => !/^[a-zA-Z0-9\s\+#\.\-]*$/.test(v))) {
                  return Promise.reject(new Error('Contains invalid characters'));
                }
                return Promise.resolve();
              }
            }]}>
            <SearchableDropdown
              mode="multiple"
              freeText
              options={allSkillsOptions}
              placeholder="Search or type a skill…"
              searchPlaceholder="Search skills…"
              itemNoun="skills"
            />
          </Form.Item>
          {reqSkills && reqSkills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {reqSkills.map((s: string) => {
                const label = allSkillsOptions.find(o => o.value === s)?.label || s;
                return (
                  <span key={s} className="sd-skill-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--bg-blue-50, #eff6ff)', color: 'var(--text-blue-600, #2563eb)', borderRadius: 12, fontSize: 12, border: '1px solid var(--border-blue-100, #dbeafe)' }}>
                    {label}
                    <X size={12} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => form.setFieldValue('requiredSkills', reqSkills.filter((v: string) => v !== s))} />
                  </span>
                );
              })}
            </div>
          )}
        </Form.Item>
        <Form.Item label="Preferred skills" style={{ marginBottom: prefSkills?.length ? 4 : 14 }}>
          <Form.Item name="preferredSkills" style={{ marginBottom: 0 }}
            normalize={(val) => Array.isArray(val) ? val.map((v: string) => v.replace(/[^a-zA-Z0-9\s\+#\.\-]/g, '')) : val}
            rules={[{
              validator: async (_, value) => {
                if (value && value.some((v: string) => !/^[a-zA-Z0-9\s\+#\.\-]*$/.test(v))) {
                  return Promise.reject(new Error('Contains invalid characters'));
                }
                return Promise.resolve();
              }
            }]}>
            <SearchableDropdown
              mode="multiple"
              freeText
              options={allSkillsOptions}
              placeholder="Nice to have…"
              searchPlaceholder="Search skills…"
              itemNoun="skills"
            />
          </Form.Item>
          {prefSkills && prefSkills.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
              {prefSkills.map((s: string) => {
                const label = allSkillsOptions.find(o => o.value === s)?.label || s;
                return (
                  <span key={s} className="sd-skill-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'var(--bg-blue-50, #eff6ff)', color: 'var(--text-blue-600, #2563eb)', borderRadius: 12, fontSize: 12, border: '1px solid var(--border-blue-100, #dbeafe)' }}>
                    {label}
                    <X size={12} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={() => form.setFieldValue('preferredSkills', prefSkills.filter((v: string) => v !== s))} />
                  </span>
                );
              })}
            </div>
          )}
        </Form.Item>
        </div>

        <div className="omf-grid-3">
          <Form.Item name="minExperience" label="Min experience (yrs)">
            <InputNumber min={0} max={60} step={0.5} style={{ width: '100%' }} onKeyPress={(e) => { if (!/[0-9\.]/.test(e.key)) e.preventDefault(); }} />
          </Form.Item>
          <Form.Item name="maxExperience" label="Max experience (yrs)">
            <InputNumber min={0} max={60} step={0.5} style={{ width: '100%' }} onKeyPress={(e) => { if (!/[0-9\.]/.test(e.key)) e.preventDefault(); }} />
          </Form.Item>
          <Form.Item name="noticePeriodDays" label="Notice period (days)">
            <InputNumber min={0} max={365} style={{ width: '100%' }} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
          </Form.Item>
        </div>

        <div className="omf-grid-2">
          <Form.Item name="education" label="Education" 
            normalize={(v) => typeof v === 'string' ? v.replace(/[^a-zA-Z0-9\s\.\/]/g, '') : v}
            rules={[{ pattern: /^[a-zA-Z0-9\s\.\/]*$/, message: 'Contains invalid characters' }]}>
            <SearchableDropdown
              freeText
              options={EDUCATION_OPTIONS}
              placeholder="e.g. B.E / B.Tech"
              searchPlaceholder="Search or type…"
              itemNoun="degrees"
            />
          </Form.Item>
          <Form.Item name="certifications" label="Certifications">
            <SearchableDropdown
              mode="multiple"
              renderTags
              freeText
              options={CERTIFICATION_OPTIONS}
              placeholder="e.g. AWS Solutions Architect"
              searchPlaceholder="Search or type…"
              itemNoun="certs"
            />
          </Form.Item>
        </div>

        </SectionCard>

        <SectionCard
          step="STEP 2"
          icon={<Wallet size={13} strokeWidth={2.25} />}
          title="Compensation"
          subtitle="Salary range, budget and timing"
        >

        {/* ── Compensation ────────────────────────────────────────────── */}
        <div className="omf-grid-4">
          <Form.Item name="salaryMin" label="Salary from">
            <InputNumber min={0} style={{ width: '100%' }} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
          </Form.Item>
          <Form.Item name="salaryMax" label="Salary to">
            <InputNumber min={0} style={{ width: '100%' }} onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
          </Form.Item>
          <Form.Item name="salaryCurrency" label="Currency">
            <SearchableDropdown
              options={['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD'].map((c) => ({
                value: c,
                label: c,
              }))}
              hideAvatar
              allowClear={false}
              placeholder="INR"
            />
          </Form.Item>
          <Form.Item name="salaryPeriod" label="Per">
            <SearchableDropdown
              options={[
                { value: 'yearly', label: 'Year' },
                { value: 'monthly', label: 'Month' },
                { value: 'hourly', label: 'Hour' },
              ]}
              hideAvatar
              allowClear={false}
              placeholder="Year"
            />
          </Form.Item>
        </div>

        <div className="omf-grid-3">
          <Form.Item name="budget" label="Budget">
            <InputNumber min={0} style={{ width: '100%' }} placeholder="Total hiring budget" onKeyPress={(e) => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
          </Form.Item>
          <Form.Item name="shiftTiming" label="Shift timing" 
            normalize={(v) => typeof v === 'string' ? v.replace(/[^a-zA-Z0-9\s:\-]/g, '') : v}
            rules={[{ pattern: /^[a-zA-Z0-9\s:\-]*$/, message: 'Contains invalid characters' }]}>
            <Input placeholder="e.g. 10:00 – 19:00 IST" />
          </Form.Item>
          <Form.Item name="joiningTimeline" label="Joining timeline" 
            normalize={(v) => typeof v === 'string' ? v.replace(/[^0-9]/g, '') : v}
            rules={[{ pattern: /^[0-9]*$/, message: 'Only numbers allowed' }]}>
            <Input placeholder="e.g. 30" />
          </Form.Item>
        </div>

        <Form.Item name="targetJoiningDate" label="Target joining date">
          <DatePicker style={{ width: '100%' }} format="DD MMM YYYY" />
        </Form.Item>

        </SectionCard>

        <SectionCard
          step="STEP 3"
          icon={<Building2 size={13} strokeWidth={2.25} />}
          title="Linked to"
          subtitle="Where this opening sits in the organisation"
        >

        {/* ── Linkage ─────────────────────────────────────────────────── */}
        <div className="omf-grid-3">
          <Form.Item name="clientId" label="Client / Account">
            <SearchableDropdown
              options={reference.clients}
              loading={reference.loading}
              placeholder="Select client"
              itemNoun="clients"
            />
          </Form.Item>
          <Form.Item name="projectId" label="Project">
            <SearchableDropdown
              options={reference.projects}
              loading={reference.loading}
              placeholder="Select project"
              itemNoun="projects"
            />
          </Form.Item>
          <Form.Item name="departmentId" label="Department">
            <SearchableDropdown
              options={reference.departments}
              loading={reference.loading}
              placeholder="Select department"
              itemNoun="departments"
            />
          </Form.Item>
        </div>

        <div className="omf-grid-3">
          <Form.Item name="subDepartmentId" label="Sub-department">
            <SearchableDropdown
              options={reference.subDepartments}
              loading={reference.loading}
              placeholder="Select sub-department"
              itemNoun="sub-departments"
            />
          </Form.Item>
          <Form.Item
            name="hiringManagerId"
            label={
              <span>
                Hiring manager{' '}
                <Tooltip title="The default first approver when this opening is submitted.">
                  <Info size={12} style={{ color: PALETTE.lightGray }} />
                </Tooltip>
              </span>
            }
            className="hide-optional"
          >
            <SearchableDropdown
              options={peopleOptions}
              loading={reference.loading}
              placeholder="Select hiring manager"
              itemNoun="people"
            />
          </Form.Item>
          <Form.Item name="employmentTypeId" label="Employment type (master)">
            <SearchableDropdown
              options={reference.employmentTypes}
              loading={reference.loading}
              placeholder="Optional master link"
              itemNoun="types"
            />
          </Form.Item>
        </div>

        <div className="omf-grid-2">
          <Form.Item name="locationId" label="Office location">
            <SearchableDropdown
              options={reference.locations}
              loading={reference.loading}
              placeholder="Select location"
              itemNoun="locations"
            />
          </Form.Item>
          <Form.Item name="location" label="Location (free text)" 
            normalize={(v) => typeof v === 'string' ? v.replace(/[^a-zA-Z0-9\s,]/g, '') : v}
            rules={[{ pattern: /^[a-zA-Z0-9\s,]*$/, message: 'Contains invalid characters' }]}>
            <Input placeholder="e.g. Chennai, IN" />
          </Form.Item>
        </div>

        </SectionCard>

        <SectionCard
          step="STEP 4"
          icon={<Tag size={13} strokeWidth={2.25} />}
          title="Classification"
          subtitle="Priority, hiring type and who can see it"
        >

        {/* ── Classification ──────────────────────────────────────────── */}
        <div className="omf-grid-3">
          <style>{`
            .hide-optional .ant-form-item-optional {
              display: none !important;
            }
          `}</style>
          <Form.Item name="priority" label="Priority">
            <SearchableDropdown
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
              hideAvatar
              allowClear={false}
              placeholder="Medium"
            />
          </Form.Item>
          <Form.Item name="hiringType" label="Hiring type">
            <SearchableDropdown
              options={Object.entries(HIRING_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              hideAvatar
              placeholder="Select type"
            />
          </Form.Item>
          <Form.Item name="visibility" label="Visibility">
            <SearchableDropdown
              options={Object.entries(VISIBILITY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              hideAvatar
              allowClear={false}
              placeholder="Internal & External"
            />
          </Form.Item>
        </div>

        </SectionCard>

        <SectionCard
          step="STEP 5"
          icon={<Users size={13} strokeWidth={2.25} />}
          title="Recruiters"
          subtitle="One can be marked primary"
        >

        {/* ── Recruiters ──────────────────────────────────────────────── */}
        <div className="omf-rows">
          {recruiters.map((r, i) => (
            <div key={r.recruiterId} className="omf-row">
              <span className="omf-row-main">{nameOf(r.recruiterId)}</span>
              <Tooltip title={r.isPrimary ? 'Primary recruiter' : 'Make primary'}>
                <Button
                  type="text"
                  size="small"
                  icon={
                    <Star
                      size={14}
                      fill={r.isPrimary ? PALETTE.blue : 'none'}
                      color={r.isPrimary ? PALETTE.blue : PALETTE.lightGray}
                    />
                  }
                  onClick={() =>
                    // Exactly one primary — the backend enforces it with a partial
                    // unique index, so the UI must not offer a second.
                    setRecruiters((prev) =>
                      prev.map((x, j) => ({ ...x, isPrimary: j === i ? !x.isPrimary : false }))
                    )
                  }
                />
              </Tooltip>
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => setRecruiters((prev) => prev.filter((_, j) => j !== i))}
              />
            </div>
          ))}
          <SearchableDropdown
            options={availableRecruiters}
            loading={reference.loading}
            placeholder="Add a recruiter…"
            itemNoun="people"
            value={null}
            onChange={(v: any) => {
              if (!v) return;
              setRecruiters((prev) => [
                ...prev,
                { recruiterId: v, isPrimary: prev.length === 0 },
              ]);
            }}
          />
        </div>

        </SectionCard>

        <SectionCard
          step="STEP 6"
          icon={<UsersRound size={13} strokeWidth={2.25} />}
          title="Hiring team"
          subtitle="Interviewers and decision makers"
        >

        {/* ── Hiring team ─────────────────────────────────────────────── */}
        <div className="omf-rows">
          {hiringTeam.map((m, i) => (
            <div key={i} className="omf-team-row">
              <SearchableDropdown
                value={m.memberType}
                onChange={(v: any) =>
                  setHiringTeam((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, memberType: v } : x))
                  )
                }
                options={Object.entries(MEMBER_TYPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                hideAvatar
                allowClear={false}
                width={200}
                style={{ width: 170 }}
              />
              {m.memberType === 'client_interviewer' ? (
                <>
                  <Input
                    placeholder="Name"
                    value={m.memberName ?? ''}
                    onChange={(e) =>
                      setHiringTeam((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, memberName: e.target.value } : x))
                      )
                    }
                  />
                  <Input
                    placeholder="Email (optional)"
                    value={m.memberEmail ?? ''}
                    onChange={(e) =>
                      setHiringTeam((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, memberEmail: e.target.value } : x))
                      )
                    }
                  />
                </>
              ) : (
                <SearchableDropdown
                  value={m.memberId ?? null}
                  onChange={(v: any) =>
                    setHiringTeam((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, memberId: v } : x))
                    )
                  }
                  options={peopleOptions}
                  loading={reference.loading}
                  placeholder="Select person"
                  itemNoun="people"
                  style={{ flex: 1 }}
                />
              )}
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => setHiringTeam((prev) => prev.filter((_, j) => j !== i))}
              />
            </div>
          ))}
          <Button
            type="dashed"
            icon={<Plus size={14} />}
            onClick={() =>
              setHiringTeam((prev) => [...prev, { memberType: 'technical_panel', memberId: null }])
            }
          >
            Add team member
          </Button>
        </div>

        </SectionCard>

        <SectionCard
          step="STEP 7"
          icon={<FileCheck size={13} strokeWidth={2.25} />}
          title="Required documents"
          subtitle="What candidates must supply"
        >

        {/* ── Required documents ──────────────────────────────────────── */}
        <div className="omf-rows">
          {documents.map((d, i) => (
            <div key={i} className="omf-doc-row">
              <Input
                placeholder="Document name"
                value={d.documentName}
                onChange={(e) =>
                  setDocuments((prev) =>
                    prev.map((x, j) => (j === i ? { ...x, documentName: e.target.value } : x))
                  )
                }
              />
              <Tooltip title={d.isMandatory ? 'Mandatory' : 'Optional'}>
                <span className="omf-doc-switch">
                  <Switch
                    size="small"
                    checked={d.isMandatory !== false}
                    onChange={(checked) =>
                      setDocuments((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, isMandatory: checked } : x))
                      )
                    }
                  />
                  <span>{d.isMandatory !== false ? 'Mandatory' : 'Optional'}</span>
                </span>
              </Tooltip>
              <Button
                type="text"
                size="small"
                danger
                icon={<Trash2 size={14} />}
                onClick={() => setDocuments((prev) => prev.filter((_, j) => j !== i))}
              />
            </div>
          ))}
          <div className="omf-doc-presets">
            {DOCUMENT_PRESETS.filter(
              (p) => !documents.some((d) => d.documentName?.toLowerCase() === p.toLowerCase())
            ).map((p) => (
              <Button
                key={p}
                size="small"
                type="dashed"
                icon={<Plus size={12} />}
                onClick={() =>
                  setDocuments((prev) => [...prev, { documentName: p, isMandatory: true }])
                }
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
        </SectionCard>
      </Form>
        </div>

        {/* Footer */}
        <div
          className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
        >
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--text-slate-400)',
              fontWeight: 500,
              marginRight: 'auto',
            }}
          >
            Job title, employment type and work mode are required
          </span>
          <Button onClick={onClose} style={{ height: 38, fontWeight: 500, padding: '0 16px' }}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={saving}
            onClick={handleSubmit}
            style={{
              height: 38,
              padding: '0 20px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
            }}
          >
            {isEdit ? 'Save changes' : 'Create opening'}
          </Button>
        </div>
      </div>

      <style jsx global>{`
        .omf .ant-form-item { margin-bottom: 14px; }
        .omf .customer-drawer-card:last-child { margin-bottom: 0 !important; }
        /* Section headings and separators are now the shared SectionCard's job. */
        .omf-grid-2, .omf-grid-3, .omf-grid-4 { display: block; }
        .omf-rows { display: flex; flex-direction: column; gap: 8px; margin-bottom: 4px; }
        .omf-row {
          display: flex; align-items: center; gap: 8px; padding: 6px 10px;
          border: 1px solid var(--border-slate-200); background: var(--bg-slate-50);
          border-radius: 8px;
        }
        .omf-row-main { flex: 1; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); }
        .omf-team-row, .omf-doc-row { display: flex; align-items: center; gap: 8px; }
        .omf-team-row > *:nth-child(2) { flex: 1; }
        .omf-doc-row > .ant-input { flex: 1; }
        .omf-doc-switch {
          display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px;
          color: var(--text-slate-500); min-width: 96px;
        }
        .omf-doc-presets { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
      `}</style>
    </Drawer>
  );
}
