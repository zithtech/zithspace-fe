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
  Alert,
  Dropdown,
  Row,
  Col,
  Tooltip,
  Avatar,
  Badge,
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
import { usePositions } from "@/hooks/usePositions";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

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
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="mm-drawer-close"
        >
          <CloseOutlined />
        </button>
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
            }}
          >
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
    </div>
  );
};


const StatCard = ({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}) => (
  <Card
    bordered={false}
    className="mm-stat-card"
    styles={{ body: { padding: "18px 20px" } }}
    style={{
      borderRadius: 14,
      border: "1px solid var(--border-slate-100)",
      background: "var(--bg-pure-white)",
      boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
    }}
  >
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Text
          style={{
            fontSize: 11,
            color: "var(--text-slate-500)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600,
          }}
        >
          {label}
        </Text>
        <Title
          level={3}
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 26,
            color: "var(--text-slate-900)",
            letterSpacing: "-0.02em",
            opacity: loading ? 0.4 : 1,
          }}
        >
          {value}
        </Title>
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: `${color}14`,
          color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          border: `1px solid ${color}1f`,
        }}
      >
        {icon}
      </div>
    </div>
  </Card>
);

export default function MembersPage() {
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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      });

      setMembers(response.data);
      setPagination((prev) => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      console.error("Failed to fetch members:", error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Failed to fetch members");
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
  ]);

  const handleSubmit = async (values: any) => {
    try {
      setFormLoading(true);
      setError("");

      if (modalType === "edit" && selectedMember) {
        const updatePayload: UpdateMemberData = {
          name: values.name,
          phone: values.phone,
          personalEmail: values.personalEmail,
          workEmail: values.workEmail,
          role: values.role,
          positionId: values.position,
          reportsToId: values.reportsTo || null,
          isActive: values.isActive !== undefined ? values.isActive : true,
          workDays: values.workDays || [1, 2, 3, 4, 5],
          assignedShiftId: values.assignedShift || null,
        };
        await MembersService.updateMember(selectedMember.id, updatePayload);
        setSuccess("Member updated successfully");
      } else {
        const createPayload: CreateMemberData = {
          name: values.name,
          phone: values.phone,
          personalEmail: values.personalEmail,
          workEmail: values.workEmail,
          role: values.role,
          positionId: values.position,
          password: "temp123",
          reportsToId: values.reportsTo || null,
          workDays: values.workDays || [1, 2, 3, 4, 5],
          assignedShiftId: values.assignedShift || null,
          isActive: true,
        };
        await MembersService.createMember(createPayload);
        setSuccess("Member created successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to submit member form:", error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Operation failed");
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
      setSuccess("Member deleted successfully");
      setIsModalVisible(false);
      setSelectedMember(null);
      fetchMembers();
    } catch (error: any) {
      console.error("Failed to delete member:", error);
      if (error instanceof ApiError) {
        setError(error.message);
      } else {
        setError("Delete failed");
      }
    } finally {
      setFormLoading(false);
    }
  };

  const showAddModal = () => {
    setModalType("add");
    form.resetFields();
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
      position: member?.position?.id,
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
  };

  const hasActiveFilters = !!(searchTerm || roleFilter || positionFilter);

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

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

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
          {/* Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Total Members"
                value={memberStats.total}
                icon={<TeamOutlined />}
                color="#6366f1"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Super Admins"
                value={memberStats.superAdmin}
                icon={<CrownOutlined />}
                color="#e11d48"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Team Admins"
                value={memberStats.admin}
                icon={<SafetyCertificateOutlined />}
                color="#f59e0b"
                loading={loading}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <StatCard
                label="Regular Users"
                value={memberStats.user}
                icon={<IdcardOutlined />}
                color="#10b981"
                loading={loading}
              />
            </Col>
          </Row>

          {/* Alerts */}
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 16, fontSize: 13, borderRadius: 10 }}
              onClose={() => setError("")}
            />
          )}
          {success && (
            <Alert
              message={success}
              type="success"
              showIcon
              closable
              style={{ marginBottom: 16, fontSize: 13, borderRadius: 10 }}
              onClose={() => setSuccess("")}
            />
          )}

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
            {/* Toolbar */}
            <div
              className="mm-toolbar"
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-slate-100)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                background: "var(--bg-pure-white)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <FilterOutlined style={{ color: "var(--text-slate-400)", fontSize: 14 }} />
                <Text
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-500)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  {pagination.total} {pagination.total === 1 ? "member" : "members"}
                </Text>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <Input
                  placeholder="Search by name, email…"
                  prefix={
                    <SearchOutlined style={{ color: "var(--text-slate-400)" }} />
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mm-search"
                  style={{ width: 280, height: 38 }}
                  allowClear
                />

                <Select
                  placeholder="All roles"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  className="mm-select"
                  style={{ width: 160, height: 38 }}
                  allowClear
                  suffixIcon={<UserOutlined style={{ color: "var(--text-slate-400)" }} />}
                >
                  <Option value="super_admin">Super Admin</Option>
                  <Option value="admin">Admin</Option>
                  <Option value="user">User</Option>
                  {availableRoles
                    .filter((r) => !["user", "admin", "super_admin"].includes(r.slug))
                    .map((r) => (
                      <Option key={r.id} value={r.slug}>
                        {r.name}
                      </Option>
                    ))}
                </Select>

                <Select
                  placeholder="All positions"
                  value={positionFilter}
                  onChange={setPositionFilter}
                  className="mm-select"
                  style={{ width: 200, height: 38 }}
                  allowClear
                  loading={positionsLoading}
                  showSearch
                  optionFilterProp="children"
                >
                  {positions.map((position) => (
                    <Option key={position.id} value={position.title}>
                      {position.title}
                    </Option>
                  ))}
                </Select>

                {hasActiveFilters && (
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleClearFilters}
                    className="mm-clear-btn"
                    style={{
                      height: 38,
                      borderRadius: 8,
                      fontWeight: 500,
                    }}
                  >
                    Reset
                  </Button>
                )}
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

        <style jsx global>{`
          .mm-stat-card {
            transition: transform 0.18s ease, box-shadow 0.18s ease,
              border-color 0.18s ease;
          }
          .mm-stat-card:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06) !important;
            border-color: var(--border-slate-200) !important;
          }
          .mm-search.ant-input-affix-wrapper,
          .mm-select .ant-select-selector {
            border-radius: 10px !important;
            background: var(--bg-secondary) !important;
            border-color: var(--border-slate-200) !important;
            transition: all 0.15s ease;
          }
          .mm-search.ant-input-affix-wrapper:hover,
          .mm-select:hover .ant-select-selector {
            border-color: #c4b5fd !important;
          }
          .mm-search.ant-input-affix-wrapper-focused,
          .mm-select.ant-select-focused .ant-select-selector {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
          }
          .mm-clear-btn {
            background: var(--bg-secondary) !important;
            border: 1px solid var(--border-slate-200) !important;
            color: var(--text-slate-600) !important;
          }
          .mm-clear-btn:hover {
            border-color: #8b5cf6 !important;
            color: #8b5cf6 !important;
          }
          .mm-action-btn:hover {
            background: var(--bg-slate-50) !important;
            color: #8b5cf6 !important;
          }
          .mm-table .ant-table-thead > tr > th {
            background: var(--bg-table-header) !important;
            color: var(--text-slate-500) !important;
            font-weight: 600 !important;
            font-size: 11px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            padding: 12px 16px !important;
          }
          .mm-table .ant-table-tbody > tr > td {
            padding: 14px 16px !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          .mm-table .ant-table-tbody > tr:hover > td {
            background: var(--bg-slate-50) !important;
          }
          .mm-table .ant-pagination .ant-pagination-item-active {
            border-color: #8b5cf6 !important;
          }
          .mm-table .ant-pagination .ant-pagination-item-active a {
            color: #8b5cf6 !important;
          }
          .mm-modal .ant-modal-content {
            background-color: var(--bg-pure-white) !important;
            border-radius: 14px !important;
            padding: 20px 24px !important;
          }
          .mm-modal .ant-modal-header {
            background-color: var(--bg-pure-white) !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            padding-bottom: 16px !important;
            margin-bottom: 20px !important;
          }
          .mm-modal .ant-modal-close {
            top: 22px !important;
            right: 22px !important;
          }
          .mm-modal .ant-form-item-label > label {
            font-weight: 600 !important;
            color: var(--text-slate-700, var(--text-slate-600)) !important;
            font-size: 12.5px !important;
          }
          .mm-modal .ant-input,
          .mm-modal .ant-select-selector,
          .mm-modal .ant-input-affix-wrapper {
            border-radius: 8px !important;
            border-color: var(--border-slate-200) !important;
            background: var(--bg-secondary) !important;
          }
          .mm-modal .ant-input:focus,
          .mm-modal .ant-input-focused,
          .mm-modal .ant-select-focused .ant-select-selector,
          .mm-modal .ant-input-affix-wrapper-focused {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
          }
          .mm-drawer .ant-drawer-content {
            background: var(--bg-pure-white) !important;
            border-radius: 0 !important;
          }
          .mm-drawer .ant-drawer-body { padding: 0 !important; }
          .mm-drawer-close {
            position: absolute;
            top: 16px; right: 16px;
            width: 32px; height: 32px;
            border-radius: 8px;
            background: rgba(255,255,255,0.7);
            border: 1px solid var(--border-slate-200);
            color: var(--text-slate-500);
            display: flex; align-items: center; justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
            backdrop-filter: blur(8px);
          }
          .mm-drawer-close:hover {
            background: var(--bg-pure-white);
            color: #ef4444;
            border-color: #fca5a5;
          }
          [data-theme='dark'] .mm-drawer-close {
            background: rgba(31,41,55,0.7);
          }
          .mm-drawer .ant-form-item-label > label {
            font-weight: 600 !important;
            color: var(--text-slate-700, var(--text-slate-600)) !important;
            font-size: 12px !important;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .mm-drawer .ant-input,
          .mm-drawer .ant-select-selector,
          .mm-drawer .ant-input-affix-wrapper {
            border-radius: 9px !important;
            border-color: var(--border-slate-200) !important;
            background: var(--bg-secondary) !important;
            min-height: 40px;
          }
          .mm-drawer .ant-select-single .ant-select-selector {
            height: 40px !important;
            display: flex; align-items: center;
          }
          .mm-drawer .ant-input:focus,
          .mm-drawer .ant-input-focused,
          .mm-drawer .ant-select-focused .ant-select-selector,
          .mm-drawer .ant-input-affix-wrapper-focused,
          .mm-drawer .ant-input-affix-wrapper:focus-within {
            border-color: #8b5cf6 !important;
            box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12) !important;
          }
          .mm-day-pill {
            width: 38px; height: 38px;
            border-radius: 10px;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-secondary);
            color: var(--text-slate-500);
            font-size: 13px; font-weight: 700;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: all 0.15s ease;
          }
          .mm-day-pill:hover {
            border-color: #c4b5fd;
            color: #8b5cf6;
          }
          .mm-day-pill.active {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-color: transparent;
            color: #fff;
            box-shadow: 0 3px 8px rgba(139,92,246,0.30);
          }
          @media (max-width: 768px) {
            .mm-toolbar > div:last-child {
              width: 100%;
            }
            .mm-search,
            .mm-select {
              width: 100% !important;
            }
          }
        `}</style>
      </div>
    </MainLayout>
  );
}
