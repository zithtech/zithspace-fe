"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
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
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
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
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { usePositions } from "@/hooks/usePositions";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";

const { Title, Text } = Typography;
const { Option } = Select;

const ROLE_META: Record<
  string,
  { label: string; bg: string; color: string; dot: string }
> = {
  super_admin: { label: "Super Admin", bg: "rgba(225,29,72,0.10)", color: "#e11d48", dot: "#e11d48" },
  admin: { label: "Admin", bg: "rgba(245,158,11,0.12)", color: "#d97706", dot: "#f59e0b" },
  user: { label: "User", bg: "rgba(16,185,129,0.10)", color: "#059669", dot: "#10b981" },
};

const AVATAR_PALETTE = [
  ["#6366f1", "#8b5cf6"],
  ["#0ea5e9", "#06b6d4"],
  ["#10b981", "#14b8a6"],
  ["#f59e0b", "#f97316"],
  ["#ec4899", "#f43f5e"],
  ["#8b5cf6", "#d946ef"],
];

const gradientFor = (seed: string) => {
  const idx = Math.abs(
    seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0),
  ) % AVATAR_PALETTE.length;
  const [a, b] = AVATAR_PALETTE[idx];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
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
          border: value === "work" ? "2px solid #8b5cf6" : "1px solid var(--border-slate-100)",
          borderRadius: 12,
          background: value === "work" ? "rgba(139,92,246,0.03)" : "var(--bg-pure-white)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: value === "work" ? "0 4px 12px rgba(139,92,246,0.1)" : "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MailOutlined style={{ color: value === "work" ? "#8b5cf6" : "var(--text-slate-400)" }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-slate-900)" }}>Work Mail</span>
          </div>
          <span style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: value === "work" ? "5px solid #8b5cf6" : "1px solid var(--border-slate-300)",
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
          border: value === "personal" ? "2px solid #8b5cf6" : "1px solid var(--border-slate-100)",
          borderRadius: 12,
          background: value === "personal" ? "rgba(139,92,246,0.03)" : "var(--bg-pure-white)",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: value === "personal" ? "0 4px 12px rgba(139,92,246,0.1)" : "none",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MailOutlined style={{ color: value === "personal" ? "#8b5cf6" : "var(--text-slate-400)" }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--text-slate-900)" }}>Personal Mail</span>
          </div>
          <span style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            border: value === "personal" ? "5px solid #8b5cf6" : "1px solid var(--border-slate-300)",
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
        color: "#6366f1",
      })),
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "var(--bg-pure-white)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 24px",
          borderBottom: "1px solid var(--border-slate-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "var(--bg-pure-white)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: "rgba(139,92,246,0.10)",
              color: "#8b5cf6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {mode === "add" ? <PlusOutlined /> : <EditOutlined />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--text-slate-900)",
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              {mode === "add" ? "New Member" : "Edit Member"}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--text-slate-500)",
                marginTop: 2,
              }}
            >
              {mode === "add"
                ? "Invite a new member to your workspace"
                : `Updating ${selectedMember?.name || ""}`}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {mode === "edit" && selectedMember && canReadActivityLog && (
            <Button
              icon={<History size={14} />}
              onClick={() => setHistoryOpen(true)}
              size="small"
              style={{ borderRadius: 6 }}
            >
              History
            </Button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="mm-drawer-close"
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
          padding: "20px 24px 28px",
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onSubmit}
          size="middle"
          requiredMark={false}
        >
          <SectionLabel>Profile</SectionLabel>

          <Form.Item
            name="name"
            label="Full name"
            rules={[{ required: true, message: "Please enter full name" }]}
          >
            <Input placeholder="e.g. Jane Doe" />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            <Form.Item
              name="workEmail"
              label="Work email"
              rules={[
                { required: true, message: "Please enter work email" },
                { type: "email", message: "Please enter valid email" },
              ]}
            >
              <Input placeholder="jane@company.com" />
            </Form.Item>

            <Form.Item
              name="personalEmail"
              label="Personal email"
              rules={[
                { required: true, message: "Please enter personal email" },
                { type: "email", message: "Please enter valid email" },
              ]}
            >
              <Input placeholder="jane@personal.com" />
            </Form.Item>
          </div>

          <Form.Item
            name="phone"
            label="Phone number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="+1 555 123 4567" />
          </Form.Item>

          <div style={{ height: 8 }} />
          <SectionLabel>Access</SectionLabel>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select role" }]}
            initialValue="user"
          >
            <Select placeholder="Select a role" optionLabelProp="label">
              {ROLE_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value} label={opt.title}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: opt.color, display: "flex", alignItems: "center" }}>
                      {opt.icon}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{opt.title}</div>
                      <div style={{ fontSize: 11, color: "var(--text-slate-500)" }}>
                        {opt.desc}
                      </div>
                    </div>
                  </div>
                </Select.Option>
              ))}
            </Select>
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
            {positionType === "grade" ? (
              <Form.Item
                name="position"
                label="Position"
                rules={[{ required: true, message: "Please select position" }]}
              >
                <Select
                  placeholder="Select position"
                  loading={positionsLoading}
                  showSearch
                  optionFilterProp="children"
                >
                  {positions.map((position) => (
                    <Option key={position.id} value={position.id}>
                      {position.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            ) : (
              <Form.Item
                name="positionTitle"
                label="Position Title"
                rules={[{ required: true, message: "Please enter position title" }]}
              >
                <Input placeholder="e.g. Senior Software Architect" />
              </Form.Item>
            )}

            <Form.Item name="reportsTo" label="Reports to">
              <Select
                placeholder="Select manager"
                showSearch
                allowClear
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.children ?? "")
                    .toString()
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {managers
                  .filter((m) => m.id !== selectedMember?.id)
                  .map((manager) => (
                    <Option key={manager.id} value={manager.id}>
                      {manager.name}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ height: 8 }} />
          <SectionLabel>Schedule</SectionLabel>

          <Form.Item name="assignedShift" label="Assigned shift">
            <Select placeholder="Select shift (optional)" allowClear>
              {shifts.map((shift) => (
                <Option key={shift.id} value={shift.id}>
                  {shift.name} · {shift.startTime}–{shift.endTime}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="workDays"
            label="Work days"
            initialValue={[1, 2, 3, 4, 5]}
          >
            <DayPills />
          </Form.Item>

          {mode === "add" && (
            <>
              <div style={{ height: 16 }} />
              <SectionLabel>Send Welcome Mail To</SectionLabel>
              <Form.Item name="sendEmailTo" initialValue="work" style={{ marginBottom: 16 }}>
                <EmailSelector workEmail={workEmail} personalEmail={personalEmail} />
              </Form.Item>

              <div
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  background: "var(--bg-slate-50)",
                  border: "1px solid var(--border-slate-100)",
                  borderRadius: 10,
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
            </>
          )}
        </Form>
      </div>

      {/* Sticky footer */}
      <div
        style={{
          padding: "14px 24px",
          borderTop: "1px solid var(--border-slate-100)",
          background: "var(--bg-pure-white)",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Button
          onClick={onClose}
          style={{ borderRadius: 8, height: 38, fontWeight: 500, padding: "0 16px" }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          loading={formLoading}
          onClick={() => form.submit()}
          style={{
            borderRadius: 8,
            height: 38,
            padding: "0 20px",
            fontWeight: 600,
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(139,92,246,0.25)",
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
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const { message: messageApi } = App.useApp();

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
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

  const [managers, setManagers] = useState<Member[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RBACRole[]>([]);

  const memberStats = React.useMemo(() => {
    return {
      total: pagination.total,
      superAdmin: members.filter((m) => m.role === "super_admin").length,
      admin: members.filter((m) => m.role === "admin").length,
      user: members.filter((m) => m.role === "user").length,
    };
  }, [members, pagination.total]);

  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await MembersService.getMembers({
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchTerm,
        role: roleFilter,
        position: positionFilter,
        reportsToId: reportsToFilter,
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

  useEffect(() => {
    if (!isLoading && !canReadUser) {
      router.push("/dashboard");
    }
  }, [isLoading, canReadUser, router]);

  useEffect(() => {
    if (user) {
      fetchMembers();
      fetchManagers();
      fetchShifts();
      fetchRoles();
    }
  }, [
    user,
    pagination.current,
    pagination.pageSize,
    searchTerm,
    roleFilter,
    positionFilter,
    reportsToFilter,
  ]);

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
          isActive: true,
          sendEmailTo: values.sendEmailTo || "work",
        };
        await MembersService.createMember(createPayload);
        messageApi.success("Member created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to submit member form:", error);
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error("Operation failed");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    try {
      setFormLoading(true);
      await MembersService.deleteMember(selectedMember.id);
      messageApi.success("Member deleted successfully");
      setIsModalVisible(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to delete member:", error);
      if (error instanceof ApiError) {
        messageApi.error(error.message);
      } else {
        messageApi.error("Delete failed");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const showAddModal = () => {
    setModalType("add");
    form.resetFields();
    form.setFieldsValue({
      sendEmailTo: "work",
      positionType: "grade",
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
    });
    setIsModalVisible(true);
  };

  const showDeleteModal = (member: Member) => {
    setModalType("delete");
    setSelectedMember(member);
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

  const columns: ColumnsType<Member> = [
    {
      title: "Member",
      dataIndex: "name",
      key: "name",
      width: 240,
      render: (text: string, record: Member) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge
            dot
            offset={[-4, 32]}
            color={record.isActive === false ? "#94a3b8" : "#10b981"}
          >
            <Avatar
              size={38}
              src={record.avatarUrl}
              style={{
                background: gradientFor(record.id || text || "x"),
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                boxShadow: "0 2px 6px rgba(15,23,42,0.10)",
              }}
            >
              {text?.charAt(0)?.toUpperCase()}
            </Avatar>
          </Badge>
          <div style={{ minWidth: 0 }}>
            <Text
              strong
              style={{
                fontSize: 13.5,
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
      width: 240,
      render: (_, record: Member) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Tooltip title="Work Email">
            <Text
              style={{
                fontSize: 12.5,
                color: "var(--text-slate-900)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <MailOutlined style={{ fontSize: 11, color: "var(--text-slate-400)" }} />
              {record.workEmail || "—"}
            </Text>
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
        <Text style={{ fontSize: 12.5, color: "var(--text-slate-700, #475569)", fontWeight: 500 }}>
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
          bg: "rgba(99,102,241,0.10)",
          color: "#6366f1",
          dot: "#6366f1",
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
              fontSize: 11.5,
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
          return <Text style={{ fontSize: 12.5, color: "var(--text-slate-400)" }}>—</Text>;
        }
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar
              size={22}
              style={{
                background: gradientFor(reportsTo),
                color: "#fff",
                fontSize: 10,
                fontWeight: 600,
              }}
            >
              {reportsTo.charAt(0).toUpperCase()}
            </Avatar>
            <Text style={{ fontSize: 12.5, color: "var(--text-slate-900)" }}>
              {reportsTo}
            </Text>
          </div>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 64,
      align: "center",
      fixed: "right",
      render: (_, record: Member) => {
        if (!canUpdateUser && !canDeleteUser && !canManageUsers) return null;

        const menuItems = [];
        if (canUpdateUser || canManageUsers) {
          menuItems.push({
            key: "edit",
            icon: <EditOutlined />,
            label: "Edit member",
            onClick: () => showEditModal(record),
          });
        }
        if (canDeleteUser || canManageUsers) {
          menuItems.push({
            key: "delete",
            icon: <DeleteOutlined />,
            label: "Delete member",
            danger: true,
            onClick: () => showDeleteModal(record),
          });
        }

        if (menuItems.length === 0) return null;

        return (
          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 16 }} />}
              size="small"
              className="mm-action-btn"
              style={{ width: 28, height: 28 }}
            />
          </Dropdown>
        );
      },
    },
  ];



  if (isLoading) {
    return <LoadingSpinner message="Loading members..." />;
  }

  if (!canReadUser) {
    return null;
  }

  if (!user || isLoading || !canReadUser) {
    if (isLoading) return <LoadingSpinner message="Loading members..." />;
    return null;
  }

  return (
    <MainLayout>
      <div
        style={{
          margin: "0 -24px",
          background: "var(--bg-pure-white)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        <TimeTrackingHeader
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1000,
            background: "var(--bg-pure-white)",
            padding: "8.5px 32px",
            borderBottom: "1px solid var(--border-slate-100)",
            marginBottom: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
          icon={<TeamOutlined style={{ fontSize: 20, color: "#8b5cf6" }} />}
          title="Members Management"
          description="Directory and access control for all organization members"
          extra={
            (canCreateUser || canManageUsers) ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={showAddModal}
                size="large"
                style={{
                  borderRadius: 10,
                  height: 40,
                  fontWeight: 600,
                  padding: "0 18px",
                  background:
                    "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.25)",
                }}
              >
                Add Member
              </Button>
            ) : null
          }
        />

        <div style={{ padding: "8px 32px 32px 32px" }}>
          {/* Premium stats grid */}
          <div className="mm-stat-grid">
            <StatCard
              label="Total Members"
              value={memberStats.total}
              icon={<TeamOutlined />}
              accent="#6366f1"
              subtle="Across all roles"
              loading={loading && memberStats.total === 0}
              chart={
                memberStats.total > 0 ? (
                  <MiniBar
                    segments={[
                      {
                        value: memberStats.superAdmin,
                        color: "#e11d48",
                        label: `${memberStats.superAdmin} super`,
                      },
                      {
                        value: memberStats.admin,
                        color: "#f59e0b",
                        label: `${memberStats.admin} admin`,
                      },
                      {
                        value: memberStats.user,
                        color: "#10b981",
                        label: `${memberStats.user} user`,
                      },
                    ]}
                  />
                ) : null
              }
            />

            <StatCard
              label="Super Admins"
              value={memberStats.superAdmin}
              icon={<CrownOutlined />}
              accent="#e11d48"
              subtle={
                memberStats.total > 0
                  ? `${Math.round((memberStats.superAdmin / memberStats.total) * 100)}% of total`
                  : "No members"
              }
              loading={loading && memberStats.total === 0}
              chart={
                memberStats.total > 0 ? (
                  <div className="mm-progress-row">
                    <div className="mm-progress-track">
                      <span
                        className="mm-progress-fill"
                        style={{
                          width: `${(memberStats.superAdmin / memberStats.total) * 100}%`,
                          background: "linear-gradient(90deg, #e11d48, #f43f5e)",
                        }}
                      />
                    </div>
                    <span className="mm-progress-label">
                      {Math.round((memberStats.superAdmin / memberStats.total) * 100)}%
                    </span>
                  </div>
                ) : null
              }
            />

            <StatCard
              label="Team Admins"
              value={memberStats.admin}
              icon={<SafetyCertificateOutlined />}
              accent="#f59e0b"
              subtle={
                memberStats.total > 0
                  ? `${Math.round((memberStats.admin / memberStats.total) * 100)}% of total`
                  : "No members"
              }
              loading={loading && memberStats.total === 0}
              chart={
                memberStats.total > 0 ? (
                  <div className="mm-progress-row">
                    <div className="mm-progress-track">
                      <span
                        className="mm-progress-fill"
                        style={{
                          width: `${(memberStats.admin / memberStats.total) * 100}%`,
                          background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                        }}
                      />
                    </div>
                    <span className="mm-progress-label">
                      {Math.round((memberStats.admin / memberStats.total) * 100)}%
                    </span>
                  </div>
                ) : null
              }
            />

            <StatCard
              label="Regular Users"
              value={memberStats.user}
              icon={<IdcardOutlined />}
              accent="#10b981"
              subtle={
                memberStats.total > 0
                  ? `${Math.round((memberStats.user / memberStats.total) * 100)}% of total`
                  : "No members"
              }
              loading={loading && memberStats.total === 0}
              chart={
                memberStats.total > 0 ? (
                  <div className="mm-progress-row">
                    <div className="mm-progress-track">
                      <span
                        className="mm-progress-fill"
                        style={{
                          width: `${(memberStats.user / memberStats.total) * 100}%`,
                          background: "linear-gradient(90deg, #10b981, #34d399)",
                        }}
                      />
                    </div>
                    <span className="mm-progress-label">
                      {Math.round((memberStats.user / memberStats.total) * 100)}%
                    </span>
                  </div>
                ) : null
              }
            />
          </div>

          {/* Alerts */}


          {/* Filters + Table */}
          <Card
            bordered={false}
            className="mm-table-card"
            style={{
              borderRadius: 14,
              border: "1px solid var(--border-slate-100)",
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              background: "var(--bg-pure-white)",
              overflow: "hidden",
            }}
            styles={{ body: { padding: 0 } }}
          >
            {/* Toolbar — single row */}
            <div className="mm-toolbar-v2">
              <Input
                placeholder="Search name, email…"
                prefix={
                  <SearchOutlined style={{ color: "var(--text-slate-400)", marginRight: 6 }} />
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mm-search"
                allowClear
              />

              <Select
                placeholder={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <UserOutlined style={{ fontSize: 12, color: "var(--text-slate-400)" }} />
                    Role
                  </span>
                }
                value={roleFilter}
                onChange={setRoleFilter}
                className="mm-select"
                allowClear
                style={{ flex: "1 1 140px", minWidth: 130, maxWidth: 180 }}
                options={[
                  { value: "super_admin", label: "Super Admin" },
                  { value: "admin", label: "Admin" },
                  { value: "user", label: "User" },
                  ...availableRoles
                    .filter((r) => !["user", "admin", "super_admin"].includes(r.slug))
                    .map((r) => ({ value: r.slug, label: r.name })),
                ]}
              />

              <Select
                placeholder={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <IdcardOutlined style={{ fontSize: 12, color: "var(--text-slate-400)" }} />
                    Position
                  </span>
                }
                value={positionFilter}
                onChange={setPositionFilter}
                className="mm-select"
                allowClear
                loading={positionsLoading}
                showSearch
                optionFilterProp="label"
                style={{ flex: "1 1 180px", minWidth: 160, maxWidth: 220 }}
                options={positions.map((position) => ({
                  value: position.title,
                  label: position.title,
                }))}
              />

              <Select
                placeholder={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CrownOutlined style={{ fontSize: 12, color: "var(--text-slate-400)" }} />
                    Reports to
                  </span>
                }
                value={reportsToFilter}
                onChange={setReportsToFilter}
                className="mm-select"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ flex: "1 1 200px", minWidth: 180, maxWidth: 260 }}
                options={managers.map((manager) => ({
                  value: manager.id,
                  label: manager.name,
                  rich: (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar
                        size={22}
                        style={{
                          background: gradientFor(manager.id || manager.name),
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#fff",
                        }}
                      >
                        {manager.name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                        <span style={{ fontWeight: 600, color: "var(--text-slate-800)", fontSize: 13 }}>
                          {manager.name}
                        </span>
                        {manager.position?.title && (
                          <span style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                            {manager.position.title}
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                }))}
                optionRender={(option) => (option.data as any).rich}
              />

              {hasActiveFilters && (
                <Tooltip title="Clear all filters">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleClearFilters}
                    className="mm-clear-btn"
                  >
                    Reset
                  </Button>
                </Tooltip>
              )}

              <div className="mm-toolbar-v2__divider" />

              <div className="mm-toolbar-v2__meta">
                <FilterOutlined style={{ color: "var(--text-slate-400)", fontSize: 12 }} />
                <Text className="mm-count-text">
                  <strong>{pagination.total}</strong>{" "}
                  {pagination.total === 1 ? "member" : "members"}
                </Text>
              </div>
            </div>

            {/* Table */}
            <Table
              className="mm-table"
              columns={columns}
              dataSource={members}
              rowKey="id"
              loading={loading}
              pagination={{
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}–${range[1]} of ${total}`,
                onChange: (page, pageSize) => {
                  setPagination((prev) => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize || 10,
                  }));
                },
                style: { padding: "16px 20px" },
              }}
              scroll={{ x: 1024 }}
            />
          </Card>
        </div>

        {/* Delete confirmation modal */}
        <Modal
          className="mm-modal"
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(225,29,72,0.10)",
                  color: "#e11d48",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                <DeleteOutlined />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  Delete Member
                </div>
                <div style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
                  This action will deactivate the account
                </div>
              </div>
            </div>
          }
          open={isModalVisible && modalType === "delete"}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedMember(null);
          }}
          footer={null}
          width={440}
          destroyOnClose
        >
          <Text style={{ color: "var(--text-slate-600)", fontSize: 13.5 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: "var(--text-slate-900)" }}>
              {selectedMember?.name}
            </strong>
            ? This action will deactivate the member account and revoke their
            access.
          </Text>
          <div style={{ marginTop: 24, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)} style={{ borderRadius: 8 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                danger
                loading={formLoading}
                onClick={handleDelete}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Delete Member
              </Button>
            </Space>
          </div>
        </Modal>

        {/* Add / Edit Drawer */}
        <Drawer
          className="mm-drawer"
          width={560}
          open={isModalVisible && modalType !== "delete"}
          onClose={() => {
            setIsModalVisible(false);
            form.resetFields();
            setSelectedMember(null);
          }}
          closable={false}
          destroyOnClose
          styles={{
            body: { padding: 0, background: "var(--bg-pure-white)" },
            header: { display: "none" },
            content: { background: "var(--bg-pure-white)" },
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
            }}
            onSubmit={handleSubmit}
            positions={positions}
            positionsLoading={positionsLoading}
            managers={managers}
            shifts={shifts}
            availableRoles={availableRoles}
          />
        </Drawer>

      </div>
    </MainLayout>
  );
}
