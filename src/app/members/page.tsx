"use client";

import NoData from "@/components/common/NoData";
import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Modal,
  Drawer,
  Form,
  App,
  Dropdown,
  Row,
  Col,
  Tooltip,
  Avatar,
  Badge,
  Skeleton,
  Segmented,
  InputNumber,
  Switch,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  MenuOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  TeamOutlined,
  ReloadOutlined,
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  IdcardOutlined,
  FilterOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  EllipsisOutlined,
  CopyOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import {
  MembersService,
  Member,
  CreateMemberData,
  UpdateMemberData,
} from "@/services/membersService";
import { SettingsService, Shift } from "@/services/settingsService";
import { ApiError } from "@/lib/axios";
import { RBACService, RBACRole } from "@/services/rbacService";
import type { ColumnsType } from "antd/es/table";
import type { Dayjs } from "dayjs";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import dayjs from "dayjs";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { usePositions } from "@/hooks/usePositions";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { History, Sparkles } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { drawerFormStyles as formStyles, SectionCard, SectionHeader, commonDrawerProps } from "@/components/common/DrawerSection";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;



const ROLE_META: Record<
  string,
  { label: string; bg: string; color: string; dot: string }
> = {
  super_admin: { label: "Super Admin", bg: "rgba(16,185,129,0.10)", color: "#10b981", dot: "#10b981" },
  admin: { label: "Admin", bg: "rgba(100,116,139,0.10)", color: "#64748b", dot: "#64748b" },
  user: { label: "User", bg: "rgba(59,130,246,0.10)", color: "#3b82f6", dot: "#3b82f6" },
};

const AVATAR_PALETTE = [
  ["#3b82f6", "#2563eb"], // blue
  ["#10b981", "#059669"], // green
  ["#64748b", "#475569"], // grey
  ["#0284c7", "#0369a1"], // sky blue
  ["#0d9488", "#0f766e"], // teal/green
  ["#4b5563", "#374151"], // slate grey
];

const gradientFor = (seed: string) => {
  return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
};

const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
  const w = 96;
  const h = 34;
  const max = Math.max(...values, 1);
  const n = values.length;
  const stepX = n > 1 ? w / (n - 1) : w;
  const pts = values.map((v, i) => {
    const x = i * stepX;
    const y = h - 3 - (v / max) * (h - 8);
    return [x, y] as const;
  });
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block', width: '100%', maxWidth: '96px', height: 'auto' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      fontSize: 10.5,
      fontWeight: 700,
      color: "var(--text-slate-500)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      margin: "4px 0 12px",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    <span>{children}</span>
    <div style={{ flex: 1, height: 1, background: "var(--border-slate-100)" }} />
  </div>
);

const DAYS = [
  { value: 1, short: "M", label: "Mon" },
  { value: 2, short: "T", label: "Tue" },
  { value: 3, short: "W", label: "Wed" },
  { value: 4, short: "T", label: "Thu" },
  { value: 5, short: "F", label: "Fri" },
  { value: 6, short: "S", label: "Sat" },
  { value: 0, short: "S", label: "Sun" },
];

const DayPills = ({
  value = [],
  onChange,
}: {
  value?: number[];
  onChange?: (v: number[]) => void;
}) => {
  const toggle = (d: number) => {
    if (!onChange) return;
    const next = value.includes(d)
      ? value.filter((x) => x !== d)
      : [...value, d];
    onChange(next.sort());
  };
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {DAYS.map((d) => {
        const active = value.includes(d.value);
        return (
          <Tooltip key={d.value} title={d.label}>
            <button
              type="button"
              onClick={() => toggle(d.value)}
              className={`mm-day-pill${active ? " active" : ""}`}
            >
              {d.short}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
};

const EmailSelector = ({ value, onChange, workEmail, personalEmail }: any) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 4 }}>
      <div
        onClick={() => onChange?.("work")}
        style={{
          padding: "16px",
          border: value === "work" ? "2px solid #3b82f6" : "1px solid var(--border-slate-100)",
          borderRadius: 8,
          background: value === "work" ? "rgba(59,130,246,0.03)" : "var(--bg-pure-white)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: value === "work" ? "0 4px 12px rgba(59,130,246,0.1)" : "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MailOutlined style={{ color: value === "work" ? "#3b82f6" : "var(--text-slate-400)" }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-slate-900)" }}>Work Mail</span>
          </div>
          <span style={{
            width: 16,
            height: 16,
            borderRadius: "50",
            border: value === "work" ? "5px solid #3b82f6" : "1px solid var(--border-slate-300)",
            display: "inline-block"
          }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-slate-500)", marginTop: 6, wordBreak: "break-all" }}>
          {workEmail || "jane@company.com"}
        </div>
      </div>

      <div
        onClick={() => onChange?.("personal")}
        style={{
          padding: "16px",
          border: value === "personal" ? "2px solid #3b82f6" : "1px solid var(--border-slate-100)",
          borderRadius: 8,
          background: value === "personal" ? "rgba(59,130,246,0.03)" : "var(--bg-pure-white)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: value === "personal" ? "0 4px 12px rgba(59,130,246,0.1)" : "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MailOutlined style={{ color: value === "personal" ? "#3b82f6" : "var(--text-slate-400)" }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-slate-900)" }}>Personal Mail</span>
          </div>
          <span style={{
            width: 16,
            height: 16,
            borderRadius: 0,
            border: value === "personal" ? "5px solid #3b82f6" : "1px solid var(--border-slate-300)",
            display: "inline-block"
          }} />
        </div>
        <div style={{ fontSize: 11, color: "var(--text-slate-500)", marginTop: 6, wordBreak: "break-all" }}>
          {personalEmail || "jane@personal.com"}
        </div>
      </div>
    </div>
  );
};

interface MemberDrawerContentProps {
  mode: "add" | "edit";
  selectedMember: Member | null;
  form: any;
  formLoading: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  positions: any[];
  positionsLoading: boolean;
  managers: Member[];
  shifts: Shift[];
  availableRoles: RBACRole[];
  employees: any[];
  onEmployeeSelect: (employeeId: string | null) => void;
}

const MemberDrawerContent: React.FC<MemberDrawerContentProps> = ({
  mode,
  selectedMember,
  form,
  formLoading,
  onClose,
  onSubmit,
  positions,
  positionsLoading,
  managers,
  shifts,
  availableRoles,
  employees,
  onEmployeeSelect,
}) => {
  const watchedRole =
    Form.useWatch("role", form) || selectedMember?.role || "user";
  const workEmail = Form.useWatch("workEmail", form);
  const personalEmail = Form.useWatch("personalEmail", form);
  const positionType = Form.useWatch("positionType", form) || "grade";

  const [historyOpen, setHistoryOpen] = useState(false);
  const { canReadActivityLog } = usePermission();

  const ROLE_OPTIONS = [
    {
      value: "user",
      icon: <IdcardOutlined />,
      title: "User",
      desc: "Read & contribute to assigned work",
      color: "#10b981",
    },
    {
      value: "admin",
      icon: <SafetyCertificateOutlined />,
      title: "Admin",
      desc: "Manage team & projects",
      color: "#f59e0b",
    },
    {
      value: "super_admin",
      icon: <CrownOutlined />,
      title: "Super Admin",
      desc: "Full org-wide control",
      color: "#e11d48",
    },
    ...availableRoles
      .filter((r) => !["user", "admin", "super_admin"].includes(r.slug))
      .map((r) => ({
        value: r.slug,
        icon: <UserOutlined />,
        title: r.name,
        desc: r.description || "Custom organization role",
        color: "#3b82f6",
      })),
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
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
            {mode === "add" ? <PlusOutlined style={{ fontSize: 18 }} /> : <EditOutlined style={{ fontSize: 18 }} />}
          </div>
          <div className="min-w-0">
            <div
              className="text-[15px] font-semibold leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {mode === "add" ? "New Member" : "Edit Member"}
            </div>
            <div
              className="text-[12px] mt-0.5"
              style={{ color: 'var(--text-secondary)' }}
            >
              {mode === "add" ? (
                "Invite a new member to your workspace"
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div>Updating {selectedMember?.name || ""}</div>
                  {selectedMember && (
                    <div style={{ fontSize: 10.5, color: "var(--text-slate-400)" }}>
                      Created by: <span style={{ fontWeight: 600, color: "var(--text-slate-600)" }}>{(selectedMember as any).createdBy || "System"}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {mode === "edit" && selectedMember && canReadActivityLog && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)] flex items-center gap-2"
              title="Activity history"
              style={{ color: 'var(--text-secondary)' }}
            >
              <History size={14} strokeWidth={2} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>History</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <CloseOutlined />
          </button>
        </div>
      </div>

      {/* Scrollable form body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "var(--customers-page-bg)",
        }}
      >
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          onFinish={onSubmit}
          className="customer-drawer-form"
          colon={false}
          requiredMark="optional"
        >
          {/* ── Import from Employee (Add mode only) ── */}
          {mode === 'add' && (
            <div
              style={{
                padding: '14px 16px',
                marginBottom: 16,
                background: 'rgba(59,130,246,0.04)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Sparkles size={14} color="#3b82f6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Import from Employee
                </span>
              </div>
              <Select
                showSearch
                allowClear
                style={{ width: '100%' }}
                placeholder="Select an employee to auto-fill details…"
                optionFilterProp="label"
                options={employees.map((emp: any) => ({
                  value: emp.id,
                  label: `${emp.firstName || ''} ${emp.lastName || ''} — ${emp.workEmail || emp.personalEmail || ''}`.trim(),
                }))}
                onChange={(employeeId: string | undefined) => {
                  if (!employeeId) {
                    form.resetFields(['name', 'workEmail', 'personalEmail']);
                    onEmployeeSelect(null);
                    return;
                  }
                  const emp = employees.find((e: any) => e.id === employeeId);
                  if (emp) {
                    form.setFieldsValue({
                      name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
                      workEmail: emp.workEmail || '',
                      personalEmail: emp.personalEmail || '',
                      phone: emp.mobile || '',
                      ...(emp.positionId ? { positionType: 'grade', position: emp.positionId } : {}),
                      ...(emp.reportsToId ? { reportsTo: emp.reportsToId } : {}),
                    });
                    onEmployeeSelect(employeeId);
                  }
                }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-slate-400)', marginTop: 8 }}>
                Selecting an employee will auto-fill Name, Work Email and Personal Email.
              </div>
            </div>
          )}

          <SectionCard
            icon={<UserOutlined />}
            title="Profile Details"
            subtitle="Enter the basic information for this member"
            step="STEP 1"
          >


            <Form.Item
              name="name"
              label="Full name"
              normalize={(value) => (value || '').replace(/[^a-zA-Z\s]/g, '')}
              rules={[
                { required: true, message: "Please enter full name" },
                {
                  pattern: /^[a-zA-Z\s]*$/,
                  message: "Only text is allowed",
                },
              ]}
            >
              <Input placeholder="e.g. Jane Doe" />
            </Form.Item>

            <Form.Item
              name="workEmail"
              label="Work email"
              rules={[
                { required: true, message: "Please enter work email" },
                { type: "email", message: "Please enter valid email" },
                { pattern: /^[^\s]+$/, message: "Spaces are not allowed" }
              ]}
            >
              <Input
                placeholder="jane@company.com"
                onKeyPress={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="personalEmail"
              label="Personal email"
              rules={[
                { required: true, message: "Please enter personal email" },
                { type: "email", message: "Please enter valid email" },
                { pattern: /^[^\s]+$/, message: "Spaces are not allowed" }
              ]}
            >
              <Input
                placeholder="jane@personal.com"
                onKeyPress={(e) => {
                  if (e.key === ' ') {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone number"
              rules={[
                { required: true, message: "Please enter phone number" },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const digits = value.replace(/\D/g, "");
                    if (digits.length !== 10) {
                      return Promise.reject(new Error("Phone number must be exactly 10 digits"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <Input
                placeholder="e.g. 9876543210"
                maxLength={10}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
              />
            </Form.Item>
          </SectionCard>

          <SectionCard
            icon={<SafetyCertificateOutlined />}
            title="Access"
            subtitle="Configure role and reporting structure"
            step="STEP 2"
          >

            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Please select role" }]}
              initialValue="user"
            >
              <SearchableDropdown
                placeholder="Select a role"
                options={ROLE_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.title,
                  description: opt.desc,
                  badge: opt.icon,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="positionType"
              label="Position Specification"
              initialValue="grade"
              style={{ marginBottom: 16 }}
            >
              <Segmented
                options={[
                  { label: "Grade-based Position", value: "grade" },
                  { label: "Custom Title", value: "custom" },
                ]}
                block
              />
            </Form.Item>

            {positionType === "grade" ? (
              <Form.Item
                name="position"
                label="Position"
                preserve={false}
                rules={[{ required: true, message: "Please select position" }]}
              >
                <SearchableDropdown
                  placeholder="Select position"
                  loading={positionsLoading}
                  options={positions.map((position) => ({
                    value: position.id,
                    label: position.title,
                  }))}
                />
              </Form.Item>
            ) : (
              <Form.Item
                name="positionTitle"
                label="Position Title"
                preserve={false}
                normalize={(value) => (value || '').replace(/[^a-zA-Z\s]/g, '')}
                rules={[
                  { required: true, message: "Please enter position title" },
                  {
                    pattern: /^[a-zA-Z\s]*$/,
                    message: "Only text is allowed",
                  },
                ]}
              >
                <Input placeholder="e.g. Senior Software Architect" />
              </Form.Item>
            )}

            <Form.Item name="reportsTo" label="Reports to">
              <SearchableDropdown
                placeholder="Select manager"
                options={managers
                  .filter((m) => m.id !== selectedMember?.id)
                  .map((manager) => ({
                    value: manager.id,
                    label: manager.name,
                    avatarUrl: manager.avatarUrl,
                  }))}
              />
            </Form.Item>
          </SectionCard>

          <SectionCard
            icon={<CalendarOutlined />}
            title="Schedule"
            subtitle="Set up work schedule and availability"
            step="STEP 3"
          >

            <Form.Item name="assignedShift" label="Assigned shift">
              <SearchableDropdown
                placeholder="Select shift (optional)"
                options={shifts.map((shift) => ({
                  value: shift.id,
                  label: shift.name,
                  description: `${shift.startTime}–${shift.endTime}`,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="workDays"
              label="Work days"
              initialValue={[1, 2, 3, 4, 5]}
            >
              <DayPills />
            </Form.Item>

            <Form.Item
              name="isActive"
              label="Status"
              initialValue={true}
              rules={[{ required: true, message: "Please select status" }]}
            >
              <SearchableDropdown
                placeholder="Select status"
                options={[
                  { value: true as any, label: "Active" },
                  { value: false as any, label: "Inactive" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="minWorkingHours"
              label="Minimum Working Hours Per Day"
              initialValue={6}
              rules={[
                { required: true, message: "Please enter minimum working hours" },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null) return Promise.resolve();
                    if (value < 1 || value > 10) {
                      return Promise.reject(new Error("Minimum working hours must be between 1 and 10"));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber min={1} max={10} style={{ width: "100%" }} placeholder="e.g. 6" />
            </Form.Item>
          </SectionCard>

          {mode === "add" && (
            <SectionCard
              icon={<MailOutlined />}
              title="Welcome Notification"
              subtitle="Send a welcome email to the new member"
              step="STEP 4"
            >
              <Form.Item name="sendEmailTo" initialValue="work" style={{ marginBottom: 16 }} wrapperCol={{ span: 24 }}>
                <EmailSelector workEmail={workEmail} personalEmail={personalEmail} />
              </Form.Item>

              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  background: "var(--bg-slate-50)",
                  border: "1px solid var(--border-slate-100)",
                  borderRadius: 8,
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <InfoCircleOutlined
                  style={{ color: "var(--text-slate-400)", marginTop: 2, fontSize: 13 }}
                />
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    lineHeight: 1.55,
                  }}
                >
                  A temporary password will be generated. The member will be
                  prompted to set a new password on first login.
                </div>
              </div>
            </SectionCard>
          )}
        </Form>
      </div>

      {/* Sticky footer */}
      <div
        className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        <span style={{ fontSize: 11.5, color: 'var(--text-slate-400)', fontWeight: 500, marginRight: 'auto' }}>
          Fields marked required must be filled
        </span>
        <Button
          onClick={onClose}
          className="mm-footer-btn"
          style={{ height: 38, fontWeight: 500, padding: "0 16px" }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          loading={formLoading}
          onClick={() => form.submit()}
          className="mm-footer-btn"
          style={{
            height: 38,
            padding: "0 20px",
            fontWeight: 600,
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
          }}
        >
          {mode === "add" ? "Add Member" : "Save Changes"}
        </Button>
      </div>

      {mode === "edit" && selectedMember && (
        <TransactionHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          entityType="user"
          entityId={selectedMember.id}
          subtitle={selectedMember.name}
        />
      )}
    </div>
  );
};

interface MemberPreviewDrawerContentProps {
  member: Member | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  shifts: Shift[];
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  canManageUsers: boolean;
}

const MemberPreviewDrawerContent: React.FC<MemberPreviewDrawerContentProps> = ({
  member,
  onClose,
  onEdit,
  onDelete,
  shifts,
  canUpdateUser,
  canDeleteUser,
  canManageUsers,
}) => {
  if (!member) return null;
  const { message } = App.useApp();

  const roleMeta = ROLE_META[member.role] || {
    label: member.role,
    bg: "rgba(59,130,246,0.10)",
    color: "#3b82f6",
    dot: "#3b82f6",
  };

  const reportsToObj = member.reportsTo && typeof member.reportsTo === "object" ? member.reportsTo : null;
  const assignedShiftObj = shifts.find(
    (s) => s.id === ((member as any).assignedShift?.id || (member as any).assignedShiftId)
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--customers-page-bg, #0B0F1A)" }}>
      {/* Clean minimal header */}
      <div
        className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
        style={{
          background: 'color-mix(in oklab, var(--bg-secondary) 92%, transparent)',
          borderColor: 'var(--border-color)'
        }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <Avatar
            size={46}
            shape="square"
            src={member.avatarUrl}
            style={{
              background: gradientFor(member.id || member.name || "x"),
              color: "#fff",
              fontSize: 18,
              fontWeight: 800,
              borderRadius: 12,
              flexShrink: 0,
            }}
          >
            {initialsOf(member.name || "")}
          </Avatar>
          <div className="min-w-0">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-slate-900)", letterSpacing: "-0.01em" }}>
                {member.name}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: member.isActive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                  color: member.isActive ? "#10b981" : "#ef4444",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  flexShrink: 0,
                }}
              >
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: member.isActive ? "#10b981" : "#ef4444" }} />
                {member.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-slate-500)", marginTop: 2 }}>
              {member.position?.title || "—"}
            </div>
            {/* Meta row: Created By · Updated By · Updated — single line */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              flexWrap: "nowrap",
              overflow: "hidden",
              minWidth: 0,
            }}>
              {member.createdBy && (
                <>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-slate-400)", flexShrink: 0 }}>
                    <UserOutlined style={{ fontSize: 10 }} />
                    <span>Created by</span>
                    <span style={{ fontWeight: 600, color: "var(--text-slate-600)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member.createdBy}
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: "var(--border-slate-200)", flexShrink: 0 }}>·</span>
                </>
              )}
              {member.updatedBy && (
                <>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-slate-400)", flexShrink: 0 }}>
                    <EditOutlined style={{ fontSize: 10 }} />
                    <span>Updated by</span>
                    <span style={{ fontWeight: 600, color: "var(--text-slate-600)", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member.updatedBy}
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: "var(--border-slate-200)", flexShrink: 0 }}>·</span>
                </>
              )}
              {member.updatedAt && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--text-slate-400)", flexShrink: 0 }}>
                  <CalendarOutlined style={{ fontSize: 10 }} />
                  <span style={{ fontWeight: 600, color: "var(--text-slate-600)", whiteSpace: "nowrap" }}>
                    {dayjs(member.updatedAt).format("DD MMM YYYY")}
                  </span>
                </span>
              )}
            </div>

          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {(canUpdateUser || canManageUsers) && (
            <button
              type="button"
              onClick={onEdit}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                height: 32,
                padding: "0 12px",
                borderRadius: 8,
                background: "var(--bg-slate-50)",
                border: "1px solid var(--border-slate-200)",
                color: "var(--text-slate-600)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-blue-50)";
                e.currentTarget.style.borderColor = "#bfdbfe";
                e.currentTarget.style.color = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-slate-50)";
                e.currentTarget.style.borderColor = "var(--border-slate-200)";
                e.currentTarget.style.color = "var(--text-slate-600)";
              }}
            >
              <EditOutlined style={{ fontSize: 12 }} />
              Edit Profile
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--bg-slate-50)",
              border: "1px solid var(--border-slate-200)",
              color: "var(--text-slate-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-blue-50)";
              e.currentTarget.style.borderColor = "#bfdbfe";
              e.currentTarget.style.color = "#3b82f6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--bg-slate-50)";
              e.currentTarget.style.borderColor = "var(--border-slate-200)";
              e.currentTarget.style.color = "var(--text-slate-500)";
            }}
          >
            <CloseOutlined style={{ fontSize: 13 }} />
          </button>
        </div>{/* end Actions */}
      </div>

      {/* Details Scrollable Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: "var(--customers-page-bg, #0B0F1A)" }}>

        {/* Panel 1: Profile & Access */}
        <SectionCard
          icon={<CrownOutlined />}
          title="Role & Reports"
          subtitle="System role and reporting line"
        >

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 600, textTransform: "uppercase" }}>System Role</div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: roleMeta.bg,
                  color: roleMeta.color,
                  fontSize: 11,
                  fontWeight: 600,
                  marginTop: 6,
                }}
              >
                {roleMeta.label}
              </span>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 600, textTransform: "uppercase" }}>Reports To</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                {reportsToObj ? (
                  <>
                    <Avatar
                      size={20}
                      src={reportsToObj.avatarUrl}
                      style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}
                    >
                      {initialsOf(reportsToObj.name || "")}
                    </Avatar>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-700)" }}>{reportsToObj.name}</span>
                  </>
                ) : (
                  <span style={{ fontSize: 12, color: "var(--text-slate-400)" }}>No manager assigned</span>
                )}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Panel 2: Contact Information */}
        <SectionCard
          icon={<MailOutlined />}
          title="Contact Information"
          subtitle="Direct channels for this member"
        >

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MailOutlined style={{ color: "var(--text-slate-400)", fontSize: 14 }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>Work Email</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-slate-700)" }}>{member.workEmail || "—"}</div>
                </div>
              </div>
              {member.workEmail && (
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(member.workEmail);
                    message.success("Work email copied");
                  }}
                />
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MailOutlined style={{ color: "var(--text-slate-400)", fontSize: 14 }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>Personal Email</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-slate-700)" }}>{member.personalEmail || "—"}</div>
                </div>
              </div>
              {member.personalEmail && (
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(member.personalEmail);
                    message.success("Personal email copied");
                  }}
                />
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <PhoneOutlined style={{ color: "var(--text-slate-400)", fontSize: 14 }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>Phone Number</div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-slate-700)" }}>{member.phone || "—"}</div>
                </div>
              </div>
              {member.phone && (
                <Button
                  size="small"
                  type="text"
                  icon={<CopyOutlined />}
                  onClick={() => {
                    navigator.clipboard.writeText(member.phone);
                    message.success("Phone number copied");
                  }}
                />
              )}
            </div>
          </div>
        </SectionCard>

        {/* Panel 3: Schedule & Tracking */}
        <SectionCard
          icon={<CalendarOutlined />}
          title="Schedule & Shift"
          subtitle="Assigned working hours and days"
        >

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>Assigned Shift</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-slate-700)", marginTop: 4 }}>
                  {assignedShiftObj ? `${assignedShiftObj.name} (${assignedShiftObj.startTime} - ${assignedShiftObj.endTime})` : "No shift assigned"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500 }}>Min Daily Hours</div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-slate-700)", marginTop: 4 }}>
                  {member.minWorkingHours || 6} hours
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: "var(--text-slate-400)", fontWeight: 500, marginBottom: 6 }}>Work Days</div>
              <DayPills value={(member as any).workDays || [1, 2, 3, 4, 5]} />
            </div>
          </div>
        </SectionCard>

      </div>

      {/* Sticky footer actions */}
      <div
        className="customer-drawer-footer px-6 py-3 flex items-center justify-end gap-2 border-t"
        style={{
          background: 'var(--bg-pure-white)',
          borderColor: 'var(--border-color)',
          flexShrink: 0,
        }}
      >
        <Button
          onClick={onClose}
          style={{ height: 38, borderRadius: 8, fontWeight: 500, padding: "0 16px" }}
        >
          Close
        </Button>

        {(canDeleteUser || canManageUsers) && (
          <ConfirmDialog
            tone="danger"
            icon={<DeleteOutlined />}
            title="Delete Member?"
            description={`Are you sure you want to delete ${member.name}? This action will deactivate the member account and revoke their access.`}
            confirmText="Delete"
            cancelText="Cancel"
            placement="topRight"
            onConfirm={onDelete}
          >
            <Button
              danger
              style={{ height: 38, borderRadius: 8, fontWeight: 500, padding: "0 16px" }}
            >
              Delete
            </Button>
          </ConfirmDialog>
        )}


      </div>
    </div>
  );
};


/* -------------------------------------------------------------------------- */
/*                              Premium StatCard                              */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
  subtle?: string;
  loading?: boolean;
  chart?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accent,
  subtle,
  loading,
  chart,
}) => (
  <div className="mm-stat-card" style={{ ["--mm-accent" as any]: accent }}>
    <div className="mm-stat-head">
      <div
        className="mm-stat-icon"
        style={{
          background: `${accent}14`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}26`,
        }}
      >
        {icon}
      </div>
      <Text className="mm-stat-label">{label}</Text>
      <div className="mm-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="mm-stat-value">{value}</span>
        )}
      </div>
    </div>
    {subtle && <Text className="mm-stat-subtle">{subtle}</Text>}
    {chart && <div className="mm-stat-chart">{chart}</div>}
    <span
      className="mm-stat-accent"
      style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
    />
  </div>
);

/* Mini distribution bar */
interface MiniBarProps {
  segments: { value: number; color: string; label: string }[];
}
const MiniBar: React.FC<MiniBarProps> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="mm-minibar">
      <div className="mm-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="mm-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="mm-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="mm-minibar-legend-item">
            <span className="mm-minibar-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

const initialsOf = (name: string) =>
  (name || '—')
    .split(' ')
    .map((s: string) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export default function MembersPage() {
  useActivitySource({ section: "ADMIN", module: "Members", page: "MemberList" });
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [form] = Form.useForm();
  const {
    canReadUser,
    canCreateUser,
    canUpdateUser,
    canDeleteUser,
    canManageUsers,
  } = usePermission();
  console.log("Forcing HMR reload for members page");
  const { allPositions: positions, loading: positionsLoading, refresh: fetchPositions } = usePositions();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { message: messageApi } = App.useApp();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [positionFilter, setPositionFilter] = useState<string | undefined>(
    undefined,
  );
  const [reportsToFilter, setReportsToFilter] = useState<string | undefined>(
    undefined,
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "delete">("add");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewMember, setPreviewMember] = useState<Member | null>(null);

  const showPreviewDrawer = (member: Member) => {
    setPreviewMember(member);
    setPreviewVisible(true);
  };

  const [managers, setManagers] = useState<Member[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RBACRole[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // State for forms
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Layout and Sidebar view states
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [savedView, setSavedView] = useState<'all' | 'admin' | 'active' | 'inactive'>('all');
  const [isActiveFilter, setIsActiveFilter] = useState<string | undefined>("all");
  const [view, setView] = useState<'list' | 'grid'>('list');

  const memberStats = React.useMemo(() => {
    return {
      total: allMembers.filter((m) => m.isActive).length,
      superAdmin: allMembers.filter((m) => m.role === "super_admin" && m.isActive).length,
      admin: allMembers.filter((m) => m.role === "admin" && m.isActive).length,
      user: allMembers.filter((m) => m.role === "user" && m.isActive).length,
    };
  }, [allMembers]);

  const viewCounts = React.useMemo(() => {
    return {
      active: allMembers.filter((m) => m.isActive).length,
      inactive: allMembers.filter((m) => !m.isActive).length,
      all: allMembers.length,
      admin: allMembers.filter((m) => (m.role === "admin" || m.role === "super_admin") && m.isActive).length,
    };
  }, [allMembers]);

  const getMemberTrend = (role?: string) => {
    if (allMembers.length === 0) return [0, 0, 0, 0, 0];
    const months = Array.from({ length: 5 }, (_, i) => dayjs().subtract(4 - i, 'month'));
    return months.map((m) => {
      const endOfMonth = m.endOf('month');
      return allMembers.filter((u) => {
        const created = dayjs(u.createdAt);
        const matchesDate = created.isBefore(endOfMonth) || created.isSame(endOfMonth);
        const matchesRole = role ? u.role === role : true;
        return matchesDate && matchesRole && u.isActive;
      }).length;
    });
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await MembersService.getMembers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: debouncedSearchTerm,
        role: roleFilter,
        position: positionFilter,
        reportsToId: reportsToFilter,
        isActive: isActiveFilter,
      });

      setMembers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error("Failed to fetch members:", error);
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error("Failed to fetch members");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMembers = async () => {
    try {
      const response = await MembersService.getMembers({ limit: 1000, isActive: "all" });
      setAllMembers(response.data);
    } catch (error) {
      console.error("Failed to fetch all members for stats:", error);
    }
  };

  const fetchManagers = async () => {
    try {
      const managers = await MembersService.getMembersForSelect();
      setManagers(
        managers.map(
          (m) =>
            ({
              id: m.value,
              name: m.label,
              position: m.position ? { title: m.position, id: "" } : null,
              avatarUrl: m.avatarUrl || null,
            }) as Member,
        ),
      );
    } catch (error) {
      console.error("Failed to fetch managers:", error);
    }
  };

  const fetchShifts = async () => {
    try {
      const shifts = await SettingsService.getAllShifts();
      setShifts(shifts || []);
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
      setShifts([]);
    }
  };

  const fetchRoles = async () => {
    try {
      const roles = await RBACService.listRoles();
      setAvailableRoles(roles || []);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await EmployeeOnboardingService.getAllEmployees();
      let list: any[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.data)) {
        list = res.data;
      } else if (Array.isArray(res?.data?.data)) {
        list = res.data.data;
      }
      setEmployees(list);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  useEffect(() => {
    if (!isLoading && !canReadUser) {
      router.push("/dashboard");
    }
  }, [isLoading, canReadUser, router]);

  useEffect(() => {
    if (user) {
      fetchManagers();
      fetchShifts();
      fetchRoles();
      fetchAllMembers();
      fetchEmployees();
    }
  }, [user]);

  useEffect(() => {
    if (isModalVisible && modalType === "add") {
      fetchEmployees();
    }
  }, [isModalVisible, modalType]);


  // Debounce search input — wait 400ms after last keystroke before updating
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (user) {
      fetchMembers();
    }
  }, [
    user,
    pagination.current,
    pagination.pageSize,
    debouncedSearchTerm,
    roleFilter,
    positionFilter,
    reportsToFilter,
    isActiveFilter,
  ]);

  // Sync savedView with filters
  useEffect(() => {
    if (savedView === 'active') {
      setIsActiveFilter("true");
      setRoleFilter(undefined);
    } else if (savedView === 'inactive') {
      setIsActiveFilter("false");
      setRoleFilter(undefined);
    } else if (savedView === 'all') {
      setIsActiveFilter("all");
      setRoleFilter(undefined);
    } else if (savedView === 'admin') {
      setIsActiveFilter("true");
      setRoleFilter('admin,super_admin');
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [savedView]);

  const handleSubmit = async (values: any) => {
    try {
      setFormLoading(true);

      const isCustom = values.positionType === "custom";

      if (modalType === "edit" && selectedMember) {
        const updatePayload: UpdateMemberData = {
          name: values.name,
          phone: values.phone,
          personalEmail: values.personalEmail,
          workEmail: values.workEmail,
          role: values.role,
          positionId: isCustom ? undefined : values.position,
          positionTitle: isCustom ? values.positionTitle : undefined,
          reportsToId: values.reportsTo || null,
          isActive: values.isActive !== undefined ? values.isActive : true,
          workDays: values.workDays || [1, 2, 3, 4, 5],
          assignedShiftId: values.assignedShift || null,
          minWorkingHours: values.minWorkingHours !== undefined ? Number(values.minWorkingHours) : 6,
        };
        await MembersService.updateMember(selectedMember.id, updatePayload);
        messageApi.success("Member updated successfully");
      } else {
        const createPayload: CreateMemberData = {
          name: values.name,
          phone: values.phone,
          personalEmail: values.personalEmail,
          workEmail: values.workEmail,
          role: values.role,
          positionId: isCustom ? undefined : values.position,
          positionTitle: isCustom ? values.positionTitle : undefined,
          password: "temp123",
          reportsToId: values.reportsTo || null,
          workDays: values.workDays || [1, 2, 3, 4, 5],
          assignedShiftId: values.assignedShift || null,
          isActive: values.isActive !== undefined ? values.isActive : true,
          sendEmailTo: values.sendEmailTo || "work",
          minWorkingHours: values.minWorkingHours !== undefined ? Number(values.minWorkingHours) : 6,
          employeeId: selectedEmployeeId || null,
        };
        await MembersService.createMember(createPayload);
        messageApi.success("Member created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedMember(null);
      setSelectedEmployeeId(null);
      fetchMembers();
      fetchAllMembers();
      fetchPositions();
    } catch (error: any) {
      console.error("Failed to submit member form:", error);
      const serverError = error?.response?.data?.message || error?.response?.data?.error || error?.message || "";

      if (typeof serverError === "string" && serverError.toLowerCase().includes("phone")) {
        messageApi.error("This phone number already exists. Please use a different phone number.");
      } else if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error(typeof serverError === "string" && serverError ? serverError : "Operation failed");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await MembersService.deleteMember(memberId);
      messageApi.success("Member moved to trash");
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setAllMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (error: any) {
      console.error("Failed to delete member:", error);
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error("Delete failed");
      }
    }
  };

  const showAddModal = () => {
    setModalType("add");
    form.resetFields();
    form.setFieldsValue({
      sendEmailTo: "work",
      positionType: "grade",
      isActive: true,
      minWorkingHours: 6,
    });
    setSelectedMember(null);
    setIsModalVisible(true);
  };

  const showEditModal = (member: Member) => {
    setModalType("edit");
    setSelectedMember(member);
    form.setFieldsValue({
      name: member?.name,
      phone: member?.phone,
      personalEmail: member?.personalEmail,
      workEmail: member?.workEmail,
      role: member?.role,
      positionType: "grade",
      position: member?.position?.id,
      positionTitle: member?.position?.title || "",
      reportsTo:
        typeof member.reportsTo === "object"
          ? member?.reportsTo?.id
          : member?.reportsTo || "",
      assignedShift:
        (member as any)?.assignedShift?.id ||
        (member as any)?.assignedShiftId ||
        null,
      workDays: (member as any)?.workDays || [1, 2, 3, 4, 5],
      isActive: member?.isActive !== undefined ? member?.isActive : true,
      minWorkingHours: (member as any)?.minWorkingHours || 6,
    });
    setIsModalVisible(true);
  };



  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleFilter(undefined);
    setPositionFilter(undefined);
    setReportsToFilter(undefined);
  };

  const hasActiveFilters = !!(
    searchTerm ||
    roleFilter ||
    positionFilter ||
    reportsToFilter
  );

  // ─── Rich dropdown menu label (icon + title + desc) ───────────────────────
  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, tint: string) => (
    <div className="mm-menu-item">
      <span className="mm-menu-ic" style={{ color, background: tint }}>{icon}</span>
      <span className="mm-menu-text">
        <span className="mm-menu-title">{title}</span>
        <span className="mm-menu-desc">{desc}</span>
      </span>
    </div>
  );

  // Track in-flight AI-access toggles so we can show a per-row spinner.
  const [aiTogglingId, setAiTogglingId] = useState<string | null>(null);

  const handleToggleAiAccess = async (record: Member, checked: boolean) => {
    setAiTogglingId(record.id);
    // Optimistic update.
    setMembers((prev) => prev.map((m) => (m.id === record.id ? { ...m, aiEnabled: checked } : m)));
    try {
      await MembersService.setAiAccess(record.id, checked);
      messageApi.success(`AI ${checked ? "enabled" : "disabled"} for ${record.name}`);
    } catch (error: any) {
      // Revert on failure.
      setMembers((prev) => prev.map((m) => (m.id === record.id ? { ...m, aiEnabled: !checked } : m)));
      messageApi.error(error?.message || "Failed to update AI access");
    } finally {
      setAiTogglingId(null);
    }
  };

  const columns: ColumnsType<Member> = [
    {
      title: "Member",
      dataIndex: "name",
      key: "name",
      width: 240,
      render: (text: string, record: Member) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar
            size={38}
            shape="square"
            src={record.avatarUrl}
            style={{
              background: gradientFor(record.id || text || "x"),
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(15,23,42,0.10)",
              borderRadius: 10,
            }}
          >
            {initialsOf(text)}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text
              strong
              style={{
                fontSize: 12.5,
                color: "var(--text-slate-900)",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              {text}
            </Text>
            <Text
              style={{
                fontSize: 11.5,
                color: "var(--text-slate-500)",
                display: "block",
                marginTop: 2,
              }}
            >
              {record?.position?.title || "—"}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 280,
      render: (_, record: Member) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Tooltip title="Work Email">
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-slate-900)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <MailOutlined style={{ fontSize: 11, color: "var(--text-slate-400)" }} />
              <span>{record.workEmail || "—"}</span>
              {record.workEmail && (
                <Tooltip title="Copy Email">
                  <CopyOutlined
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(record.workEmail);
                      messageApi.success("Email copied to clipboard");
                    }}
                    style={{
                      cursor: "pointer",
                      fontSize: 11,
                      color: "var(--text-slate-400)",
                      transition: "color 0.2s",
                      marginLeft: 2,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--text-slate-900)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--text-slate-400)";
                    }}
                  />
                </Tooltip>
              )}
            </div>
          </Tooltip>
          {record?.phone && (
            <Text
              style={{
                fontSize: 11.5,
                color: "var(--text-slate-500)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <PhoneOutlined style={{ fontSize: 10, color: "var(--text-slate-400)" }} />
              {record.phone}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Position",
      key: "position",
      width: 180,
      render: (_, record: Member) => (
        <Text style={{ fontSize: 12, color: "var(--text-slate-700, #475569)", fontWeight: 500 }}>
          {record?.position?.title || "—"}
        </Text>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 140,
      render: (role: string, record: any) => {
        // Use RBAC role name if available, otherwise use legacy label
        const rbacRole = record.userRoles?.[0]?.role;
        const label = rbacRole ? rbacRole.name : (ROLE_META[role]?.label || role);
        const meta = ROLE_META[role] || {
          bg: "rgba(59,130,246,0.10)",
          color: "#3b82f6",
          dot: "#3b82f6",
        };

        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: meta.bg,
              color: meta.color,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: meta.dot,
                boxShadow: `0 0 0 2px ${meta.bg}`,
              }}
            />
            {label}
          </span>
        );
      },
    },
    {
      title: "Reports To",
      key: "reportsTo",
      width: 160,
      render: (_, record: Member) => {
        const reportsTo =
          record?.reportsTo && typeof record.reportsTo === "object"
            ? record.reportsTo.name
            : null;
        if (!reportsTo) {
          return <Text style={{ fontSize: 12, color: "var(--text-slate-400)" }}>—</Text>;
        }
        const reportsToObj = record?.reportsTo && typeof record.reportsTo === "object" ? record.reportsTo : null;
        const avatarUrl = reportsToObj?.avatarUrl;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar
              size={22}
              src={avatarUrl}
              style={{
                background: 'rgba(59,130,246,0.10)',
                color: '#3b82f6',
                fontSize: 9,
                fontWeight: 700,
              }}
            >
              {initialsOf(reportsTo)}
            </Avatar>
            <Text style={{ fontSize: 12, color: "var(--text-slate-900)" }}>
              {reportsTo}
            </Text>
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      width: 120,
      render: (isActive: boolean) => {
        const bg = isActive ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)";
        const color = isActive ? "#10b981" : "#ef4444";
        const dot = isActive ? "#10b981" : "#ef4444";
        const label = isActive ? "Active" : "Inactive";
        return (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              background: bg,
              color: color,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: dot,
                boxShadow: `0 0 0 2px ${bg}`,
              }}
            />
            {label}
          </span>
        );
      },
    },
    {
      title: "AI Access",
      key: "aiAccess",
      width: 110,
      align: "center",
      render: (_, record: Member) => (
        <Tooltip
          title={
            !canManageUsers
              ? "AI access"
              : record.aiEnabled === false
                ? "AI disabled — click to enable"
                : "AI enabled — click to disable"
          }
        >
          <Switch
            size="small"
            checked={record.aiEnabled !== false}
            loading={aiTogglingId === record.id}
            disabled={!canManageUsers}
            onChange={(checked) => handleToggleAiAccess(record, checked)}
          />
        </Tooltip>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 64,
      align: "center",
      fixed: "right",
      render: (_, record: Member) => {
        if (!canUpdateUser && !canDeleteUser && !canManageUsers) return null;

        const menuItems: any[] = [];
        if (canUpdateUser || canManageUsers) {
          menuItems.push({
            key: "edit",
            label: menuLabel("Edit member", "Update profile details", <EditOutlined />, "#64748b", "rgba(100,116,139,0.12)"),
          });
        }
        if (canDeleteUser || canManageUsers) {
          menuItems.push({ type: "divider" as const });
          menuItems.push({
            key: "delete",
            danger: true,
            label: (
              <ConfirmDialog
                tone="danger"
                icon={<DeleteOutlined />}
                title="Delete Member?"
                description={`Are you sure you want to delete ${record.name}? This action will deactivate the member account and revoke their access.`}
                confirmText="Delete"
                cancelText="Cancel"
                placement="left"
                onConfirm={async () => {
                  await handleDeleteMember(record.id);
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  {menuLabel("Delete member", "Move to trash", <DeleteOutlined />, "#ef4444", "rgba(239,68,68,0.12)")}
                </div>
              </ConfirmDialog>
            ),
          });
        }

        if (menuItems.length === 0) return null;

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              menu={{
                items: menuItems,
                onClick: ({ key, domEvent }: any) => {
                  domEvent.stopPropagation();
                  if (key === "edit") showEditModal(record);
                },
              }}
              trigger={["click"]}
              placement="bottomRight"
              overlayClassName="mm-action-pop"
            >
              <Button
                type="text"
                icon={<MoreOutlined style={{ fontSize: 16 }} />}
                size="small"
                className="mm-action-btn"
                style={{ width: 28, height: 28 }}
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];



  const sidebarViews = [
    { key: 'all', label: 'All members', icon: <TeamOutlined />, color: '#3b82f6' },
    { key: 'active', label: 'Active members', icon: <CheckCircleOutlined style={{ color: '#10b981' }} />, color: '#10b981' },
    { key: 'inactive', label: 'Inactive members', icon: <CloseCircleOutlined style={{ color: '#ef4444' }} />, color: '#ef4444' },
    { key: 'admin', label: 'Administrators', icon: <CrownOutlined style={{ color: '#10b981' }} />, color: '#10b981' },
  ] as const;

  const statCells = useMemo(() => {
    const totalTrend = getMemberTrend();
    const superAdminTrend = getMemberTrend('super_admin');
    const adminTrend = getMemberTrend('admin');
    const userTrend = getMemberTrend('user');

    return [
      {
        key: 'total',
        title: 'Total Members',
        value: memberStats.total,
        icon: <TeamOutlined />,
        color: '#3b82f6', // Blue
        tint: 'rgba(59,130,246,0.10)',
        trend: totalTrend,
        delta: allMembers.length,
        deltaLabel: 'members',
      },
      {
        key: 'superAdmin',
        title: 'Super Admins',
        value: memberStats.superAdmin,
        icon: <CrownOutlined />,
        color: '#10b981', // Green
        tint: 'rgba(16,185,129,0.10)',
        trend: superAdminTrend,
        delta: memberStats.superAdmin,
        deltaLabel: 'admins',
      },
      {
        key: 'admin',
        title: 'Team Admins',
        value: memberStats.admin,
        icon: <SafetyCertificateOutlined />,
        color: '#64748b', // Grey
        tint: 'rgba(100,116,139,0.10)',
        trend: adminTrend,
        delta: memberStats.admin,
        deltaLabel: 'admins',
      },
      {
        key: 'user',
        title: 'Regular Users',
        value: memberStats.user,
        icon: <IdcardOutlined />,
        color: '#3b82f6', // Blue
        tint: 'rgba(59,130,246,0.10)',
        trend: userTrend,
        delta: memberStats.user,
        deltaLabel: 'users',
      },
    ];
  }, [memberStats, allMembers]);

  const total = pagination.total;
  const pageStart = total === 0 ? 0 : (pagination.current - 1) * pagination.pageSize + 1;
  const pageEnd = Math.min(pagination.current * pagination.pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pagination.pageSize));

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><Sparkles size={26} /></div>
      <div className="pp-empty-title">No members found</div>
      <div className="pp-empty-sub">Add a member to invite them to the workspace.</div>
      {(canCreateUser || canManageUsers) && (
        <Button type="primary" icon={<PlusOutlined />} className="pp-btn-primary" onClick={showAddModal} style={{ marginTop: 14 }}>
          Add Member
        </Button>
      )}
    </div>
  );

  if (isLoading) {
    return <ZukvoLoader message="Loading members..." />;
  }

  if (!canReadUser) {
    return null;
  }

  if (!user || isLoading || !canReadUser) {
    if (isLoading) return <ZukvoLoader message="Loading members..." />;
    return null;
  }

  return (
    <MainLayout>
      <div className="pp-shell">
        {/* ============================ SIDEBAR ============================ */}
        {isMobileOpen && (
          <div className="pp-backdrop" onClick={() => setIsMobileOpen(false)} />
        )}
        <aside className={`pp-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
          <div className="pp-side-head">
            <div className="pp-side-logo"><TeamOutlined /></div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Members</div>
              <div className="pp-side-subtitle">Directory & access</div>
            </div>
          </div>

          {(canCreateUser || canManageUsers) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="pp-create-btn"
              onClick={showAddModal}
              block
            >
              Add Member
            </Button>
          )}

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              {sidebarViews.map((v) => {
                const active = savedView === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    className={`pp-view-item ${active ? 'is-active' : ''}`}
                    onClick={() => setSavedView(v.key)}
                  >
                    <span className="pp-view-icon" style={{ color: active ? v.color : 'var(--text-slate-400)' }}>{v.icon}</span>
                    <span className="pp-view-label">{v.label}</span>
                    <span className="pp-view-count">{viewCounts[v.key]}</span>
                  </button>
                );
              })}
            </div>

            <div className="pp-side-section-label">Filters</div>
            <div className="pp-side-filters">
              <SearchableDropdown
                className="pp-side-sd"
                placeholder="Role"
                searchPlaceholder="Search roles"
                itemNoun="roles"
                value={roleFilter ?? undefined}
                onChange={(v) => setRoleFilter(v ?? undefined)}
                options={[
                  { value: "super_admin", label: "Super Admin" },
                  { value: "admin", label: "Admin" },
                  { value: "user", label: "User" },
                  ...availableRoles
                    .filter((r) => !["user", "admin", "super_admin"].includes(r.slug))
                    .map((r) => ({ value: r.slug, label: r.name })),
                ]}
                width={232}
                hideAvatar
              />

              <SearchableDropdown
                className="pp-side-sd"
                placeholder="Position"
                searchPlaceholder="Search positions"
                itemNoun="positions"
                value={positionFilter ?? undefined}
                onChange={(v) => setPositionFilter(v ?? undefined)}
                options={positions.map((p) => ({ value: p.title, label: p.title }))}
                width={232}
                disabled={positions.length === 0}
                hideAvatar
              />

              <SearchableDropdown
                className="pp-side-sd"
                placeholder="Reports to"
                searchPlaceholder="Search managers"
                itemNoun="managers"
                value={reportsToFilter ?? undefined}
                onChange={(v) => setReportsToFilter(v ?? undefined)}
                options={managers.map((m) => ({
                  value: m.id,
                  label: m.name,
                  avatarUrl: m.avatarUrl || null,
                  description: m.position?.title || undefined,
                }))}
                width={232}
                disabled={managers.length === 0}
              />

              {(searchTerm || roleFilter || positionFilter || reportsToFilter) && (
                <button
                  type="button"
                  className="pp-clear-filters"
                  onClick={() => {
                    handleClearFilters();
                    setSavedView('all');
                  }}
                >
                  <CloseCircleOutlined /> Clear filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="pp-main">
          {/* Top search & views bar */}
          <div className="pp-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 240, maxWidth: 520 }}>
              <button className="pp-mobile-toggle" onClick={() => setIsMobileOpen(true)} style={{ marginRight: 0 }}>
                <MenuOutlined style={{ fontSize: 16 }} />
              </button>
              <div className="pp-search-wrap" style={{ flex: 1, maxWidth: 'none', minWidth: 0 }}>
                <SearchOutlined className="pp-search-icon" />
                <input
                  className="pp-search"
                  placeholder="Search name, position, email…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item"><span className="pp-pulse" /><strong>{pagination.total}</strong> members</span>
            </div>

            <div className="pp-topbar-actions">
              <div className="pp-segmented">
                <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
                <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
              </div>
              <Tooltip title="Refresh">
                <button type="button" className="pp-ghost-btn" onClick={() => { fetchMembers(); fetchAllMembers(); }}><ReloadOutlined spin={loading} /></button>
              </Tooltip>
            </div>
          </div>

          <div className="pp-divider" />

          {/* Stats Cards */}
          <div className="pp-stats">
            {statCells.map((s) => (
              <div key={s.key} className="pp-stat-card">
                <div className="pp-stat-top">
                  <div className="pp-stat-left">
                    <span className="pp-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                    <span className="pp-stat-label">{s.title}</span>
                  </div>
                  {s.delta > 0 && (
                    <span className="pp-stat-delta" style={{ color: s.color, background: s.tint }}>
                      +{s.delta} {s.deltaLabel}
                    </span>
                  )}
                </div>
                <div className="pp-stat-bottom">
                  <div className="pp-stat-value-wrap">
                    <span className="pp-stat-value">{s.value}</span>
                    <span className="pp-stat-period">monthly trend</span>
                  </div>
                  <div className="pp-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Body */}
          <div className="pp-body">
            <ZukvoLoadingOverlay loading={loading} message="">
              {view === 'list' ? (
                <div className="pp-table-wrap">
                  <Table
                    className="pp-table"
                    columns={columns}
                    dataSource={members}
                    rowKey="id"
                    pagination={false}
                    scroll={{ x: 1024 }}
                    locale={{ emptyText: <NoData description={emptyState} /> }}
                    rowClassName="pp-row"
                    onRow={(record) => ({
                      onClick: () => showPreviewDrawer(record),
                    })}
                  />

                </div>
              ) : (
                <div className="pp-grid">
                  {loading && members.length === 0 ? (
                    <div className="pp-grid-loading">Loading…</div>
                  ) : members.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1' }}><NoData description={emptyState} /></div>
                  ) : (
                    members.map((item) => {
                      const reportsTo = item.reportsTo && typeof item.reportsTo === 'object' ? item.reportsTo.name : null;
                      const rbacRole = (item as any).userRoles?.[0]?.role;
                      const roleLabel = rbacRole ? rbacRole.name : (ROLE_META[item.role]?.label || item.role);
                      const roleMeta = ROLE_META[item.role] || {
                        bg: "rgba(59,130,246,0.10)",
                        color: "#3b82f6",
                        dot: "#3b82f6",
                      };
                      const cardMenuItems: any[] = [];
                      if (canUpdateUser || canManageUsers) {
                        cardMenuItems.push({
                          key: "edit",
                          label: menuLabel("Edit member", "Update profile details", <EditOutlined />, "#64748b", "rgba(100,116,139,0.12)"),
                        });
                      }
                      if (canDeleteUser || canManageUsers) {
                        cardMenuItems.push({ type: "divider" as const });
                        cardMenuItems.push({
                          key: "delete",
                          danger: true,
                          label: (
                            <ConfirmDialog
                              tone="danger"
                              icon={<DeleteOutlined />}
                              title="Delete Member?"
                              description={`Are you sure you want to delete ${item.name}? This action will deactivate the member account and revoke their access.`}
                              confirmText="Delete"
                              cancelText="Cancel"
                              placement="left"
                              onConfirm={async () => {
                                await handleDeleteMember(item.id);
                              }}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                {menuLabel("Delete member", "Move to trash", <DeleteOutlined />, "#ef4444", "rgba(239,68,68,0.12)")}
                              </div>
                            </ConfirmDialog>
                          ),
                        });
                      }

                      return (
                        <div key={item.id} className="pc-card" onClick={() => showPreviewDrawer(item)}>
                          <div className="pc-top">
                            <Avatar
                              size={30}
                              shape="square"
                              src={item.avatarUrl}
                              style={{
                                background: gradientFor(item.id || item.name || "x"),
                                color: "#fff",
                                fontSize: 12,
                                fontWeight: 800,
                                borderRadius: 6,
                                flexShrink: 0,
                              }}
                            >
                              {initialsOf(item.name || '')}
                            </Avatar>
                            <div className="pc-identity-body">
                              <Tooltip title={item.name} placement="topLeft">
                                <div className="pc-title">{item.name}</div>
                              </Tooltip>
                              <div className="pc-client-line">
                                <span className="pc-client-key">Position:</span>
                                <span className="pc-client-val">
                                  {item.position?.title || "—"}
                                </span>
                              </div>
                            </div>
                            {cardMenuItems.length > 0 && (
                              <Dropdown
                                menu={{
                                  items: cardMenuItems,
                                  onClick: ({ key, domEvent }: any) => {
                                    domEvent.stopPropagation();
                                    if (key === 'edit') showEditModal(item);
                                  },
                                }}
                                trigger={['click']}
                                placement="bottomRight"
                                overlayClassName="mm-action-pop"
                              >
                                <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                                  <EllipsisOutlined />
                                </button>
                              </Dropdown>
                            )}
                          </div>

                          <div className="pc-foot">
                            <div className="pc-foot-row">
                              <span className="pc-foot-item" style={{ flex: '0 0 auto', maxWidth: '50%' }}>
                                <span className="pc-foot-key">Reports:</span>
                                {item.reportsTo && typeof item.reportsTo === 'object' ? (
                                  <>
                                    <Avatar
                                      size={16}
                                      src={(item.reportsTo as any).avatarUrl}
                                      style={{ background: 'rgba(59,130,246,0.10)', color: '#3b82f6', fontSize: 8, fontWeight: 700 }}
                                    >
                                      {initialsOf((item.reportsTo as any).name || '')}
                                    </Avatar>
                                    <span className="pc-foot-val">{(item.reportsTo as any).name}</span>
                                  </>
                                ) : <span className="pc-foot-val">—</span>}
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item" style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="pc-foot-key">Email:</span>
                                <span className="pc-foot-val" title={item.workEmail || undefined} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {item.workEmail || "—"}
                                </span>
                                {item.workEmail && (
                                  <Tooltip title="Copy Email">
                                    <CopyOutlined
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(item.workEmail);
                                        messageApi.success("Email copied to clipboard");
                                      }}
                                      style={{ cursor: "pointer", fontSize: 11, color: "var(--text-slate-400)", flexShrink: 0 }}
                                    />
                                  </Tooltip>
                                )}
                              </span>
                            </div>
                            <div className="pc-foot-row" style={{ flexWrap: "nowrap", overflow: "hidden" }}>
                              <span className="pc-foot-item" style={{ flexShrink: 0 }}>
                                <span className="pc-foot-key">Role:</span>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: roleMeta.color }}>
                                  {roleLabel.toUpperCase()}
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item" style={{ flexShrink: 0 }}>
                                <span className="pc-foot-key">Status:</span>
                                <span style={{ fontSize: "10px", fontWeight: 700, color: item.isActive ? "#10b981" : "#ef4444" }}>
                                  {item.isActive ? "ACTIVE" : "INACTIVE"}
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item" style={{ flex: "0 1 auto", minWidth: 0, overflow: "hidden" }}>
                                <span className="pc-foot-key">Created:</span>
                                <span className="pc-foot-val" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {item.createdBy || "—"}
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <span className="pc-foot-item" style={{ flex: "0 1 auto", minWidth: 0, overflow: "hidden" }}>
                                <span className="pc-foot-key">Updated:</span>
                                <span className="pc-foot-val" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {item.updatedBy || "—"}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </ZukvoLoadingOverlay>
          </div>

          {/* Sticky footer pagination */}
          {total > 0 && (
            <div className="pp-footer pp-footer--sticky">
              <div className="pp-footer-info">
                Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
              </div>
              <div className="pp-pager">
                <button type="button" className="pp-pager-btn" disabled={pagination.current <= 1} onClick={() => setPagination(p => ({ ...p, current: Math.max(1, p.current - 1) }))}>‹</button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, pagination.current - 3), Math.max(0, pagination.current - 3) + 5).map((p) => (
                  <button key={p} type="button" className={`pp-pager-num ${p === pagination.current ? 'is-active' : ''}`} onClick={() => setPagination(prev => ({ ...prev, current: p }))}>{p}</button>
                ))}
                <button type="button" className="pp-pager-btn" disabled={pagination.current >= pageCount} onClick={() => setPagination(p => ({ ...p, current: Math.min(pageCount, p.current + 1) }))}>›</button>
                <Select
                  className="pp-pagesize"
                  value={pagination.pageSize}
                  onChange={(v) => { setPagination(p => ({ ...p, pageSize: v, current: 1 })); }}
                  options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                  popupMatchSelectWidth={120}
                />
              </div>
            </div>
          )}
        </main>
      </div>



      {/* Preview Drawer */}
      <Drawer
        {...commonDrawerProps}
        className="mm-preview-drawer"
        open={previewVisible}
        onClose={() => {
          setPreviewVisible(false);
          setPreviewMember(null);
        }}
      >
        <MemberPreviewDrawerContent
          member={previewMember}
          onClose={() => {
            setPreviewVisible(false);
            setPreviewMember(null);
          }}
          onEdit={() => {
            if (previewMember) {
              setPreviewVisible(false);
              showEditModal(previewMember);
            }
          }}
          onDelete={async () => {
            if (previewMember) {
              await handleDeleteMember(previewMember.id);
              setPreviewVisible(false);
              setPreviewMember(null);
            }
          }}
          shifts={shifts}
          canUpdateUser={canUpdateUser}
          canDeleteUser={canDeleteUser}
          canManageUsers={canManageUsers}
        />
      </Drawer>

      {/* Add / Edit Drawer */}
      <Drawer
        rootClassName="leave-drawer-root"
        className="mm-drawer"
        width={720}
        open={isModalVisible && modalType !== "delete"}
        onClose={() => {
          setIsModalVisible(false);
          form.resetFields();
          setSelectedMember(null);
        }}
        closable={false}
        destroyOnClose
        styles={{
          body: { padding: 0, background: "var(--customers-page-bg)" },
          header: { display: "none" },
          footer: { display: "none" },
          mask: { background: 'rgba(15, 23, 42, 0.35)', backdropFilter: 'blur(2px)' },
        }}
        footer={null}
      >
        <MemberDrawerContent
          mode={modalType as "add" | "edit"}
          selectedMember={selectedMember}
          form={form}
          formLoading={formLoading}
          onClose={() => {
            setIsModalVisible(false);
            form.resetFields();
            setSelectedMember(null);
            setSelectedEmployeeId(null);
          }}
          onSubmit={handleSubmit}
          positions={positions}
          positionsLoading={positionsLoading}
          managers={managers}
          shifts={shifts}
          availableRoles={availableRoles}
          employees={employees}
          onEmployeeSelect={setSelectedEmployeeId}
        />
      </Drawer>

      <style jsx global>{`
        /* --- Member Drawer Style Overrides --- */
        .mm-drawer .ant-input,
        .mm-drawer .ant-select-selector,
        .mm-drawer .ant-btn,
        .mm-drawer .ant-segmented,
        .mm-drawer .ant-segmented-item,
        .mm-drawer .ant-segmented-thumb,
        .mm-drawer .ant-input-number,
        .mm-drawer .ant-select,
        .mm-drawer .email-selector-card {
          border-radius: 8px !important;
        }
        
        .mm-drawer .ant-segmented {
          padding: 4px !important;
          background: var(--bg-slate-100) !important;
        }
        .mm-drawer .ant-segmented-item-selected {
          box-shadow: 0 2px 5px rgba(0,0,0,0.06) !important;
          font-weight: 600 !important;
          border-radius: 6px !important;
        }
        
        .mm-drawer .ant-form-item-label > label {
          color: #475569 !important;
          font-weight: 500 !important;
          font-size: 13.5px !important;
          text-transform: none !important;
          letter-spacing: 0 !important;
        }
        
        .mm-drawer .ant-input,
        .mm-drawer .ant-select-selector,
        .mm-drawer .ant-input-number,
        .email-selector-card {
          border-color: #cbd5e1 !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
        }
        .mm-drawer .ant-input:focus,
        .mm-drawer .ant-input-focused,
        .mm-drawer .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important;
        }
        
        [data-theme='dark'] .mm-drawer .ant-input,
        [data-theme='dark'] .mm-drawer .ant-select-selector,
        [data-theme='dark'] .mm-drawer .ant-input-number,
        [data-theme='dark'] .email-selector-card {
          background-color: #171f2e !important;
          border-color: #2a374a !important;
          color: #e2e8f0 !important;
        }
        [data-theme='dark'] .mm-drawer .ant-input::placeholder,
        [data-theme='dark'] .mm-drawer .ant-select-selection-placeholder {
          color: #64748b !important;
        }
        [data-theme='dark'] .mm-drawer .ant-form-item-label > label {
          color: #94a3b8 !important;
        }

        /* Restore border-radius for footer action buttons */
        .mm-drawer .mm-footer-btn.ant-btn {
          border-radius: 8px !important;
        }

        /* Header icon buttons (History + Close) */
        .mm-drawer-icon-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          height: 30px;
          padding: 0 10px;
          border-radius: 8px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-500);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: color .15s ease, border-color .15s ease, background .15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .mm-drawer-icon-btn:hover {
          color: #3b82f6;
          border-color: #bfdbfe;
          background: var(--bg-blue-50);
        }

        .mm-day-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          color: var(--text-slate-600);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .mm-day-pill:hover {
          border-color: #93c5fd;
          color: #3b82f6;
          background: var(--bg-blue-50);
        }

        .mm-day-pill.active {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) !important;
          border-color: transparent !important;
          color: #fff !important;
          box-shadow: 0 3px 8px rgba(59, 130, 246, 0.30) !important;
        }

        .sp-form-section {
          background: var(--bg-pure-white);
          border-radius: 0 !important;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
        }
        .sp-form-section-header {
          padding: 14px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .sp-form-section-body {
          padding: 24px 28px;
        }
        [data-theme='dark'] .sp-form-section {
          background: #141b27 !important;
          border-color: #232f41 !important;
        }
        [data-theme='dark'] .sp-form-section-header {
          background: #141b27 !important;
          border-bottom-color: #232f41 !important;
        }
        .sp-section-icon {
          padding: 6px;
          border-radius: 0 !important;
          display: flex;
        }
        .sp-section-icon.slate { background: var(--bg-slate-50); }
        .sp-section-icon.orange { background: var(--bg-orange-50); }
        .sp-section-icon.green { background: var(--bg-green-50); }
        [data-theme='dark'] .sp-section-icon.slate { background: #1f2937 !important; }
        [data-theme='dark'] .sp-section-icon.orange { background: rgba(249,115,22,0.12) !important; }
        [data-theme='dark'] .sp-section-icon.green { background: rgba(16,185,129,0.12) !important; }

        .pp-shell {
          display: flex;
          margin: 0 -24px;
          min-height: calc(100vh - 64px);
          background: var(--bg-pure-white);
        }
        .pp-shell,
        .pp-shell *,
        .ant-table,
        .ant-btn,
        .ant-select,
        .ant-picker,
        .ant-input,
        .ant-modal,
        .ant-drawer,
        .ant-tooltip,
        .ant-popconfirm,
        .ant-dropdown {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif !important;
        }

        /* ---------------- Sidebar ---------------- */
        .pp-sidebar {
          width: 264px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0 38px;
          position: sticky;
          top: 0;
          height: calc(100vh - 64px);
          z-index: 31;
        }
        .pp-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .pp-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .pp-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .pp-create-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
        }
        .pp-create-btn:hover { background: #2563EB !important; }
        .pp-create-btn .anticon { font-size: 12px !important; }
        .pp-side-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pp-side-scroll::-webkit-scrollbar {
          display: none;
        }
        .pp-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
        }
        .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 6px; }
        .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
        .pp-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .pp-view-count {
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
          min-width: 18px; text-align: right;
        }
        .pp-view-item.is-active .pp-view-count {
          color: #3B82F6; font-weight: 700;
          background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }
        .pp-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
        .pp-side-sd { border-radius: 8px !important; }
        .pp-side-sd.sd-trigger,
        .pp-side-sd.sd-trigger.is-compact { height: 35px !important; border-radius: 8px !important; }
        .pp-side-select .ant-select-selector {
          border-radius: 8px !important; border-color: var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
        }
        .pp-side-select { width: 100%; }
        .pp-side-select .ant-select-selector { height: 35px !important; padding: 0 12px !important; display: flex; align-items: center; }
        .pp-side-select .ant-select-selection-placeholder,
        .pp-side-select .ant-select-selection-item { font-size: 13px; line-height: 33px !important; }
        .pp-clear-filters {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #ef4444;
        }
        .pp-clear-filters:hover { color: #dc2626; }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 8px 32px 0 20px; display: flex; flex-direction: column; }
        .pp-body { flex: 1 0 auto; padding-bottom: 60px; }
        .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; }
        .pp-search-wrap {
          position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900);
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-meta-dot { color: var(--text-slate-300); }
        .pp-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          display: inline-block;
          margin-right: 5px;
          position: relative;
          vertical-align: middle;
        }
        .pp-pulse::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          border-radius: 50%;
          background: inherit;
          animation: pp-pulse-ping 2s infinite ease-out;
        }
        @keyframes pp-pulse-ping {
          0% {
            transform: scale(1);
            opacity: 0.85;
          }
          100% {
            transform: scale(2.8);
            opacity: 0;
          }
        }
        .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

        .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 -32px 10px -20px; }

        /* Stat cards */
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .pp-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); line-height: 1.25; }
        .pp-stat-delta {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          font-size: 10.5px;
          font-weight: 700;
          border-radius: 6px;
          padding: 1px 6px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        /* Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table-wrap ::-webkit-scrollbar { display: none !important; }
        .pp-table-wrap, .pp-table-wrap * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pp-table, .pp-table.ant-table-wrapper, .pp-table .ant-table, .pp-table .ant-table-container, .pp-table .ant-table-content, .pp-table .ant-table-header, .pp-table .ant-table-body { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .pp-table .ant-table-thead > tr > th,
        .pp-table .ant-table-thead > tr > td {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important; border-radius: 0 !important;
          border-start-start-radius: 0 !important; border-start-end-radius: 0 !important;
        }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-tbody > tr { cursor: pointer; }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30;
          margin: 8px -32px 0 -20px;
          padding: 0 32px 0 20px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 45px;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Empty + grid */
        .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .pp-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
        }
        .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
        .pp-btn-primary {
          background: #3B82F6 !important; border: none !important;
          border-radius: 8px !important; font-weight: 600 !important;
        }
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; height: 64px; overflow: hidden; }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); height: 78px; justify-content: center; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-val { font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }
        .pc-view-btn {
          background: none; border: none; cursor: pointer; padding: 0;
          color: #3B82F6; font-weight: 700; font-size: 11.5px;
        }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 1250px) {
          .pp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .pp-stats { grid-template-columns: 1fr !important; }
        }
        .pp-backdrop { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 999; }
        .pp-mobile-toggle { display: none; align-items: center; justify-content: center; background: none; border: none; padding: 8px; cursor: pointer; color: var(--text-slate-600); margin-right: 12px; }
        @media (max-width: 1024px) {
          .pp-sidebar { position: fixed; left: -280px; top: 64px; bottom: 0; height: calc(100vh - 64px); transition: left 0.3s ease; z-index: 1000; box-shadow: 4px 0 24px rgba(15, 23, 42, 0.1); display: flex; }
          .pp-sidebar.is-open { left: 0; }
          .pp-backdrop { display: block; }
          .pp-mobile-toggle { display: flex; }
          .pp-topbar-meta { display: none; }
        }
        /* ---- Premium action dropdown (matches Proposals page) ---- */
        .mm-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0 !important; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .mm-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .mm-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .mm-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .mm-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .mm-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .mm-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .mm-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .mm-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .mm-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .mm-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .mm-action-pop .ant-dropdown-menu-item-danger .mm-menu-title { color: #ef4444; }
        .mm-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .mm-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
        /* dark theme */
        [data-theme='dark'] .mm-action-pop .ant-dropdown-menu,
        [data-theme="dark"] .mm-action-pop .ant-dropdown-menu {
          background-color: #0B0F1A !important;
          border-color: #1F2937 !important;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3) !important;
        }
        [data-theme='dark'] .mm-action-pop .ant-dropdown-menu-item:hover,
        [data-theme="dark"] .mm-action-pop .ant-dropdown-menu-item:hover {
          background: #161B22 !important;
        }
        [data-theme='dark'] .mm-action-pop .ant-dropdown-menu-item-divider,
        [data-theme="dark"] .mm-action-pop .ant-dropdown-menu-item-divider {
          background: #1F2937 !important;
        }
        [data-theme='dark'] .mm-menu-title,
        [data-theme="dark"] .mm-menu-title {
          color: #FFFFFF !important;
        }
        [data-theme='dark'] .mm-menu-desc,
        [data-theme="dark"] .mm-menu-desc {
          color: #94A3B8 !important;
        }
        [data-theme='dark'] .mm-action-pop .ant-dropdown-menu-item-danger:hover,
        [data-theme="dark"] .mm-action-pop .ant-dropdown-menu-item-danger:hover {
          background: rgba(239, 68, 68, 0.15) !important;
        }
      `}</style>
    </MainLayout>
  );
}
