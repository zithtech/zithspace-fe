"use client";

import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import {
  Card,
  Table,
  Button,
  Typography,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  App,
  Drawer,
  Checkbox,
  Divider,
  Tooltip,
  Badge,
  Spin,
  Row,
  Col,
  Select,
  Avatar,
  List,
  Skeleton,
  Switch,
  Collapse,
} from "antd";
import {
  SafetyOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UserOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  TeamOutlined,
  MinusOutlined,
  MinusCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  KeyOutlined,
  CrownOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BankOutlined,
  EllipsisOutlined,
  CloseOutlined,
  BarsOutlined,
  MenuOutlined,
  RocketOutlined,
  ApartmentOutlined,
  DownOutlined,
  UpOutlined
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useActivitySource } from "@/hooks/useActivitySource";
import { RBACService, RBACRole, RBACPermission, RBACRoleDetail } from "@/services/rbacService";
import { MembersService } from "@/services/membersService";
import { History } from 'lucide-react';
import TransactionHistoryDrawer from '@/components/common/TransactionHistoryDrawer';
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const { Title, Text } = Typography;
const { TextArea } = Input;

/** Human-readable label per permission resource. */
const RESOURCE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  integration: "Integrations",
  user: "Users / Members",
  project: "Projects",
  ticket: "Tickets",
  qa: "QA Space",
  attendance: "Attendance",
  leave: "Leaves",
  shift: "Shifts",
  invoice: "Invoices",
  account: "Accounts & Finance",
  client: "Clients / CRM",
  settings: "System Settings",
  role: "Roles & RBAC",
  report: "Reports / Analytics",
  reimbursement: "Reimbursements",
  payroll: "Payroll / Payslips",
  salary: "Salary Structures",
  document: "Documents / Hub",
  onboarding: "Onboarding",
  timesheet: "Timesheet",
  org: "Org Structure",
  daily_update: "Daily Updates",
  squad: "Squad Management",
  lead: "Lead Management",
  bidiq: "BidIq",
  proposal: "Proposals",
  vendor: "Vendors",
  escalation: "Escalations",
  pipeline: "Sales Pipeline",
  recruitment: "Candidate Pipeline",
  exit: "Employee Exit",
  performance: "Performance",
  opening: "Opening Management",
  profile: "User Profile",
  hotspot: "Hotspot",
  letter: "Doc Suite",
  letter_template: "Doc Suite Templates",
  'letter.format': "Doc Suite Formats",
  mail: "Mail Settings",
  calendar: "Calendar Settings",
  chat: "Internal Chat",
  skills: "Skills Portal",
  notification: "Notifications",
  bookmark: "Bookmarks",
  time_tracking: "Time Tracking",
  activity_log: "Activity Log / Transaction History",
  my_hub: "My Hub",
};

/**
 * Leaves 2.0 — map each leave permission to the page it gates, so the Roles UI
 * lists permissions under all 9 real pages (instead of collapsing several into a
 * generic "Leaves Core"). Trash perms have no page → grouped as "Recycle Bin".
 */
const LEAVE_PAGE_BY_PERM: Record<string, string> = {
  'leave.dashboard.read': 'Dashboard',
  'leave.create': 'Apply Leave',
  'leave.read': 'Apply Leave',
  'leave.update': 'Apply Leave',
  'leave.delete': 'Apply Leave',
  'leave.approve': 'Approvals',
  'leave.holiday.read': 'Government Holidays',
  'leave.holiday.update': 'Government Holidays',
  'leave.holiday.delete': 'Government Holidays',
  'leave.adjustment.read': 'Leave Adjustment',
  'leave.adjustment.create': 'Leave Adjustment',
  'leave.adjustment.update': 'Leave Adjustment',
  'leave.adjustment.delete': 'Leave Adjustment',
  'leave.type.read': 'Leave Type',
  'leave.type.create': 'Leave Type',
  'leave.type.update': 'Leave Type',
  'leave.type.delete': 'Leave Type',
  'leave.policy.read': 'Leave Policy',
  'leave.policy.create': 'Leave Policy',
  'leave.policy.update': 'Leave Policy',
  'leave.policy.delete': 'Leave Policy',
  'leave.holiday.create': 'Add Government Holidays',
  'leave.manage': 'Configuration',
  'leave.trash.read': 'Recycle Bin',
  'leave.trash.restore': 'Recycle Bin',
  'leave.trash.delete': 'Recycle Bin',
};

/** Display order for the leave page sub-groups (mirrors the left-rail order). */
const LEAVE_PAGE_ORDER = [
  'Dashboard',
  'Apply Leave',
  'Approvals',
  'Government Holidays',
  'Leave Adjustment',
  'Leave Type',
  'Leave Policy',
  'Add Government Holidays',
  'Configuration',
  'Recycle Bin',
];

/**
 * QA Space — map each permission to the page it gates, so the Roles UI lists the
 * 5 QA Space pages by name. Bug List moved here from Tickets, so its permissions
 * group under QA Space too; trash/archive perms have no page of their own.
 */
const QA_PAGE_BY_PERM: Record<string, string> = {
  'qa.scope.create': 'Test Scope',
  'qa.scope.read': 'Test Scope',
  'qa.scope.update': 'Test Scope',
  'qa.scope.delete': 'Test Scope',
  'qa.scope.approve': 'Test Scope',
  'qa.case.create': 'Test Cases',
  'qa.case.read': 'Test Cases',
  'qa.case.update': 'Test Cases',
  'qa.case.delete': 'Test Cases',
  'qa.suite.create': 'Test Suites',
  'qa.suite.read': 'Test Suites',
  'qa.suite.update': 'Test Suites',
  'qa.suite.delete': 'Test Suites',
  'qa.run.create': 'Test Runs',
  'qa.run.read': 'Test Runs',
  'qa.run.update': 'Test Runs',
  'qa.run.delete': 'Test Runs',
  'bug.create': 'Bug List',
  'bug.read': 'Bug List',
  'bug.update': 'Bug List',
  'bug.delete': 'Bug List',
  'bug.manage': 'Bug List',
  'bug.archive.read': 'Bug Archive',
  'bug.archive.restore': 'Bug Archive',
  'bug.archive.delete': 'Bug Archive',
  'bug.trash.read': 'Bug Recycle Bin',
  'bug.trash.restore': 'Bug Recycle Bin',
  'bug.trash.delete': 'Bug Recycle Bin',
  'qa.submission.create': 'QA Submissions',
  'qa.submission.read': 'QA Submissions',
  'qa.submission.update': 'QA Submissions',
  'qa.submission.delete': 'QA Submissions',
  'qa.submission.submit': 'QA Submissions',
  'qa.submission.signoff': 'QA Sign-off',
  'qa.approval.read': 'PM Approval',
  'qa.approval.approve': 'PM Approval',
  'qa.approval.send_back': 'PM Approval',
  'qa.analytics.read': 'Analytics',
  'qa.manage': 'QA Settings',
};

const QA_PAGE_ORDER = [
  'Test Scope',
  'Test Cases',
  'Test Suites',
  'Test Runs',
  'Bug List',
  'Bug Archive',
  'Bug Recycle Bin',
  'QA Submissions',
  'QA Sign-off',
  'PM Approval',
  'Analytics',
  'QA Settings',
];

const DOC_SUITE_PAGE_ORDER = [
  'Template Builder',
  'Letter Composer',
  'Generated Records',
  'Custom Formats'
];

/**
 * Performance — map each permission to the page it gates, so the Roles UI lists
 * the 4 Performance Report pages by name (Reports, Settings, Generated Reports,
 * My Reports). Legacy performance review perms group under "Performance Review".
 */
const PERFORMANCE_PAGE_BY_PERM: Record<string, string> = {
  'performance.report.read': 'Reports',
  'performance.report.setting.read': 'Settings',
  'performance.report.setting.update': 'Settings',
  'performance.report.generated.read': 'Generated Reports',
  'performance.report.my.read': 'My Reports',
};

/** Display order for the performance page sub-groups. */
const PERFORMANCE_PAGE_ORDER = [
  'Reports',
  'Settings',
  'Generated Reports',
  'My Reports',
  'Performance Review',
];

/**
 * My Hub — personal self-service launcher. One permission per page, so the Roles
 * UI lists the 7 My Hub pages by name.
 */
const MY_HUB_PAGE_BY_PERM: Record<string, string> = {
  'my_hub.overview.read': 'Overview',
  'my_hub.apply_leave.read': 'Apply Leave',
  'my_hub.attendance.read': 'Attendance',
  'my_hub.escalation.read': 'Escalations',
  'my_hub.performance.read': 'Performance Report',
  'my_hub.payslips.read': 'My Payslips',
  'my_hub.profile.read': 'My Profile',
};

/** Display order for the My Hub page sub-groups (mirrors the My Hub rail). */
const MY_HUB_PAGE_ORDER = [
  'My Profile',
  'Overview',
  'Apply Leave',
  'Attendance',
  'Escalations',
  'Performance Report',
  'My Payslips',
];

/** Access Control drawer — tabs that mirror the app module navigation */
interface AccessGroup {
  key: string;
  label: string;
  icon: React.ReactNode;
  resources: string[] | null; // null = 'all' or 'others'
  accent: string;
}

const ACCESS_GROUPS: AccessGroup[] = [
  {
    key: 'all',
    label: 'All',
    icon: <AppstoreOutlined />,
    resources: null,
    accent: '#3b82f6',
  },
  {
    key: 'my_hub',
    label: 'My Hub',
    icon: <AppstoreOutlined />,
    resources: ['my_hub'],
    accent: '#ec4899',
  },
  {
    key: 'home',
    label: 'Home',
    icon: <AppstoreOutlined />,
    resources: ['dashboard', 'integration', 'mail', 'calendar', 'chat', 'skills', 'notification', 'bookmark', 'time_tracking', 'activity_log', 'hotspot'],
    accent: '#3b82f6',
  },
  {
    key: 'work',
    label: 'Work',
    icon: <RocketOutlined />,
    resources: ['project', 'ticket', 'qa', 'timesheet', 'daily_update', 'document', 'squad', 'lead', 'bidiq', 'proposal', 'pipeline'],
    accent: '#8b5cf6',
  },
  {
    key: 'hrms',
    label: 'HRMS',
    icon: <TeamOutlined />,
    resources: ['attendance', 'leave', 'shift', 'onboarding', 'exit', 'performance', 'opening', 'profile', 'recruitment', 'escalation', 'letter',
      'letter_template',
      'letter.format'
    ],
    accent: '#10b981',
  },
  {
    key: 'admin',
    label: 'Admin',
    icon: <SettingOutlined />,
    resources: ['client', 'settings', 'user', 'role', 'report', 'org'],
    accent: '#f59e0b',
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: <BankOutlined />,
    resources: ['invoice', 'account', 'reimbursement', 'payroll', 'salary', 'vendor'],
    accent: '#0ea5e9',
  },
  // {
  //   key: 'others',
  //   label: 'Others',
  //   icon: <EllipsisOutlined />,
  //   resources: null,
  //   accent: '#94a3b8',
  // },
];

const ASSIGNED_RESOURCES = new Set(
  ACCESS_GROUPS.flatMap((g) => g.resources || []),
);

const getResourcesForGroup = (groupKey: string, allResources: string[]): string[] => {
  if (groupKey === 'all') return allResources;
  if (groupKey === 'others') {
    return allResources.filter((r) => !ASSIGNED_RESOURCES.has(r));
  }
  const group = ACCESS_GROUPS.find((g) => g.key === groupKey);
  return (group?.resources || []).filter((r) => allResources.includes(r));
};

/** Avatar gradient palette (consistent per user id) */
const AVATAR_PALETTE: [string, string][] = [
  ['#6366f1', '#8b5cf6'],
  ['#0ea5e9', '#06b6d4'],
  ['#10b981', '#14b8a6'],
  ['#f59e0b', '#f97316'],
  ['#ec4899', '#f43f5e'],
  ['#8b5cf6', '#d946ef'],
  ['#3b82f6', '#6366f1'],
];

const gradientFor = (seed: string): string => {
  const idx =
    Math.abs(seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) %
    AVATAR_PALETTE.length;
  const [a, b] = AVATAR_PALETTE[idx];
  return `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
};

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

/** Logical grouping (legacy — kept for reference) */
const PERMISSION_MODULES = [
  {
    title: "Home",
    icon: <PlusOutlined />, // Placeholder or appropriate icon
    resources: ["dashboard", "integration", "mail", "calendar", "chat", "skills", "notification", "bookmark", "time_tracking", "hotspot"]
  },
  {
    title: "Work",
    resources: ["project", "ticket", "qa", "timesheet", "daily_update", "document", "squad", "lead", "pipeline"]
  },
  {
    title: "HRMS",
    resources: ["user", "attendance", "leave", "shift", "onboarding", "exit", "org", "performance", "opening", "profile", "escalation"]
  },
  {
    title: "Finance",
    resources: ["invoice", "account", "reimbursement", "payroll", "salary", "vendor"]
  },
  {
    title: "Admin",
    resources: ["client", "settings", "role", "report"]
  }
];

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

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, accent, subtle, loading, chart }) => (
  <div className="rp-stat-card" style={{ ['--rp-accent' as any]: accent }}>
    <div className="rp-stat-top">
      <div className="rp-stat-left">
        <span
          className="rp-stat-icon"
          style={{
            background: `${accent}14`,
            color: accent,
            boxShadow: `inset 0 0 0 1px ${accent}26`,
          }}
        >
          {icon}
        </span>
        <span className="rp-stat-label">{label}</span>
      </div>
    </div>
    <div className="rp-stat-bottom">
      <div className="rp-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="rp-stat-value">{value}</span>
        )}
        {subtle && <span className="rp-stat-period">{subtle}</span>}
      </div>
      {chart && <div className="rp-stat-spark">{chart}</div>}
    </div>
    <span
      className="rp-stat-accent"
      style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
    />
  </div>
);

interface MiniBarProps {
  segments: { value: number; color: string; label: string }[];
}
const MiniBar: React.FC<MiniBarProps> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="rp-minibar">
      <div className="rp-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="rp-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="rp-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="rp-minibar-legend-item">
            <span className="rp-minibar-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                Role Form Content (used in Create & Edit modals)            */
/* -------------------------------------------------------------------------- */

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/__+/g, '_');

interface RoleFormContentProps {
  form: any;
  mode: 'create' | 'edit';
  existingSlug?: string;
}

const RoleFormContent: React.FC<RoleFormContentProps> = ({ form, mode, existingSlug }) => {
  const watchedName: string = Form.useWatch('name', form) || '';
  const watchedDesc: string = Form.useWatch('description', form) || '';

  const previewName = watchedName.trim() || (mode === 'create' ? 'New role name' : 'Role name');
  const previewSlug = mode === 'edit'
    ? existingSlug || slugify(watchedName)
    : (watchedName ? slugify(watchedName) : 'auto_generated');
  const initials = previewName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'NR';

  return (
    <div className="rp-rm-body">
      {/* Live preview tile */}
      <div className="rp-rm-preview">
        <div className="rp-rm-preview__label">Live preview</div>
        <div className="rp-rm-preview__card">
          <div className={`rp-rm-preview__avatar${watchedName ? '' : ' is-empty'}`}>
            {initials}
          </div>
          <div className="rp-rm-preview__text">
            <div className={`rp-rm-preview__name${watchedName ? '' : ' is-placeholder'}`}>
              {previewName}
            </div>
            <div className="rp-rm-preview__slug">{previewSlug}</div>
          </div>
          {mode === 'edit' && (
            <span className="rp-rm-preview__badge">EDITING</span>
          )}
        </div>
      </div>

      {/* Fields */}
      <Form.Item
        name="name"
        label="Role name"
        rules={[
          { required: true, message: 'Please enter a role name' },
          { max: 64, message: 'Keep it under 64 characters' },
        ]}
      >
        <Input
          placeholder="e.g. Project Manager"
          className="rp-rm-input"
          maxLength={64}
          autoFocus
          showCount
        />
      </Form.Item>

      <Form.Item
        name="description"
        label={
          <span>
            Description{' '}
            <span className="rp-rm-optional">(optional)</span>
          </span>
        }
      >
        <TextArea
          rows={3}
          placeholder="Describe what this role can do, who should be assigned, and any caveats…"
          className="rp-rm-textarea"
          maxLength={200}
          showCount
          style={{ padding: '10px 14px' }}
        />
      </Form.Item>

      {/* Helper hint */}
      <div className="rp-rm-hint">
        <SafetyOutlined className="rp-rm-hint__icon" />
        <div>
          <div className="rp-rm-hint__title">
            {mode === 'create' ? "What's next?" : 'Heads up'}
          </div>
          <div className="rp-rm-hint__text">
            {mode === 'create'
              ? 'Permissions are configured separately. After creating, open the role and click the settings icon to grant access.'
              : 'Renaming a role only changes its display name — the slug and assigned permissions stay the same.'}
          </div>
        </div>
      </div>

      {/* Live char count for description (visual only) */}
      {watchedDesc.length > 0 && watchedDesc.length < 30 && (
        <div className="rp-rm-tip">
          Tip: a few more words help teammates understand this role.
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function RolesPage() {
  useActivitySource({ section: "ADMIN", module: "RoleAndPermissions", page: "RoleList" });
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { canReadRole, canCreateRole, canUpdateRole, canDeleteRole, canAssignRole, canReadActivityLog } = usePermission();
  console.log("Forcing HMR reload for roles page 2");
  const [historyOpen, setHistoryOpen] = useState(false);

  const [roles, setRoles] = useState<RBACRole[]>([]);
  const [allPermissions, setAllPermissions] = useState<Record<string, RBACPermission[]>>({});
  const [loading, setLoading] = useState(true);
  const { message: messageApi } = App.useApp();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [roleTypeFilter, setRoleTypeFilter] = useState<"all" | "system" | "custom">("all");

  // List / grid view
  const [view, setView] = useState<"list" | "grid">("list");

  // ── Create role modal ──────────────────────────────────────────────────────
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  // ── Edit role modal (name/description) ────────────────────────────────────
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<RBACRole | null>(null);
  const [editForm] = Form.useForm();

  // ── Members drawer ─────────────────────────────────────────────────────────
  const [membersDrawerRole, setMembersDrawerRole] = useState<RBACRole | null>(null);
  const [membersDrawerOpen, setMembersDrawerOpen] = useState(false);
  const [membersDrawerLoading, setMembersDrawerLoading] = useState(false);
  const [roleMembers, setRoleMembers] = useState<RBACRoleDetail["userRoles"]>([]);
  const [allMembers, setAllMembers] = useState<Array<{ value: string; label: string; avatarUrl?: string | null }>>([]);
  const [assigningMemberId, setAssigningMemberId] = useState<string | undefined>(undefined);
  const [assignLoading, setAssignLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // ── Permissions drawer ─────────────────────────────────────────────────────
  const [drawerRole, setDrawerRole] = useState<RBACRole | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSaving, setDrawerSaving] = useState(false);
  const [drawerLoadingPerms, setDrawerLoadingPerms] = useState(false);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [accessTab, setAccessTab] = useState<string>('all');
  const [permSearch, setPermSearch] = useState<string>('');
  const [expandedPermGroups, setExpandedPermGroups] = useState<string[]>([]);

  // Auto-expand groups when searching
  React.useEffect(() => {
    if (permSearch.trim()) {
      const q = permSearch.trim().toLowerCase();
      const matching = Object.keys(allPermissions).filter(res => {
        const perms = allPermissions[res] || [];
        if ((RESOURCE_LABELS[res] || res).toLowerCase().includes(q)) return true;
        return perms.some(p => p.name.toLowerCase().includes(q) || p.action.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
      });
      setExpandedPermGroups(prev => [...new Set([...prev, ...matching])]);
    }
  }, [permSearch, allPermissions]);

  // Calculate role stats
  const roleStats = React.useMemo(() => {
    const totalMembers = roles.reduce((sum, r) => sum + (r._count?.userRoles || 0), 0);
    const assignedPerms = roles.reduce((sum, r) => sum + (r._count?.rolePermissions || 0), 0);
    return {
      total: roles.length,
      system: roles.filter(r => r.isSystem).length,
      custom: roles.filter(r => !r.isSystem).length,
      permissions: Object.values(allPermissions).flat().length,
      assignedPerms,
      totalMembers,
    };
  }, [roles, allPermissions]);

  // Filtered roles
  const filteredRoles = React.useMemo(() => {
    let list = [...roles];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q),
      );
    }
    if (roleTypeFilter === "system") list = list.filter(r => r.isSystem);
    else if (roleTypeFilter === "custom") list = list.filter(r => !r.isSystem);
    return list;
  }, [roles, searchTerm, roleTypeFilter]);

  const hasActiveFilter = !!searchTerm || roleTypeFilter !== "all";

  // Sidebar "Views" — drives the role-type filter (proposal-style left rail)
  const roleViews: { key: "all" | "system" | "custom"; label: string; icon: React.ReactNode; color: string; count: number }[] = [
    { key: "all", label: "All roles", icon: <AppstoreOutlined />, color: "#3b82f6", count: roleStats.total },
    { key: "system", label: "System roles", icon: <LockOutlined />, color: "#3b82f6", count: roleStats.system },
    { key: "custom", label: "Custom roles", icon: <CrownOutlined />, color: "#10b981", count: roleStats.custom },
  ];

  const handleClearFilters = () => {
    setSearchTerm("");
    setRoleTypeFilter("all");
  };

  // ── Route guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && user && !canReadRole) {
      router.push("/dashboard");
    }
  }, [user, isLoading, canReadRole, router]);

  // ── Initial data fetch ─────────────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await RBACService.listRoles();
      setRoles(data);
    } catch {
      messageApi.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = useCallback(async () => {
    try {
      const { grouped } = await RBACService.listPermissions();

      // Merge 'bug' permissions into 'qa'
      if (grouped.bug && grouped.qa) {
        grouped.qa = [...grouped.qa, ...grouped.bug];
        delete grouped.bug;
      } else if (grouped.bug && !grouped.qa) {
        grouped.qa = grouped.bug;
        delete grouped.bug;
      }

      // Merge 'proposal' permissions into 'lead'
      if (grouped.proposal && grouped.lead) {
        grouped.lead = [...grouped.lead, ...grouped.proposal];
        delete grouped.proposal;
      } else if (grouped.proposal && !grouped.lead) {
        grouped.lead = grouped.proposal;
        delete grouped.proposal;
      }

      setAllPermissions(grouped);
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchRoles();
      fetchPermissions();
    }
  }, [user, fetchRoles, fetchPermissions]);

  // ── Members drawer logic ───────────────────────────────────────────────────
  const openMembersDrawer = async (role: RBACRole) => {
    setMembersDrawerRole(role);
    setMembersDrawerOpen(true);
    setRoleMembers([]);
    setAssigningMemberId(undefined);
    setMemberSearch('');
    setMembersDrawerLoading(true);
    try {
      const [fullRole, selectMembers] = await Promise.all([
        RBACService.getRoleById(role.id),
        MembersService.getMembersForSelect(),
      ]);
      setRoleMembers(fullRole.userRoles);
      setAllMembers(selectMembers.map((m) => ({ value: m.value, label: m.label, avatarUrl: m.avatarUrl })));
    } catch {
      messageApi.error("Failed to load role members");
    } finally {
      setMembersDrawerLoading(false);
    }
  };

  const handleAssignMember = async () => {
    if (!membersDrawerRole || !assigningMemberId) return;
    try {
      setAssignLoading(true);
      await RBACService.assignRoleToUser(assigningMemberId, membersDrawerRole.id);
      messageApi.success("Role assigned");
      setAssigningMemberId(undefined);
      // Refresh member list
      const full = await RBACService.getRoleById(membersDrawerRole.id);
      setRoleMembers(full.userRoles);
      fetchRoles();
    } catch (err: any) {
      messageApi.error(err?.message || "Failed to assign role");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!membersDrawerRole) return;
    try {
      await RBACService.removeRoleFromUser(userId, membersDrawerRole.id);
      setRoleMembers((prev) => prev.filter((ur) => ur.user.id !== userId));
      fetchRoles();
    } catch (err: any) {
      messageApi.error(err?.message || "Failed to remove member from role");
    }
  };


  // ── Create role ────────────────────────────────────────────────────────────
  const handleCreateRole = async (values: { name: string; description?: string }) => {
    try {
      setCreateLoading(true);
      await RBACService.createRole(values);
      messageApi.success("Role created successfully");
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchRoles();
    } catch (err: any) {
      messageApi.error(err?.message || "Failed to create role");
    } finally {
      setCreateLoading(false);
    }
  };

  // ── Edit role (name/desc) ──────────────────────────────────────────────────
  const openEditModal = (role: RBACRole) => {
    setEditingRole(role);
    editForm.setFieldsValue({ name: role.name, description: role.description || "" });
    setEditModalOpen(true);
  };

  const handleEditRole = async (values: { name: string; description?: string }) => {
    if (!editingRole) return;
    try {
      setEditLoading(true);
      await RBACService.updateRole(editingRole.id, values);
      messageApi.success("Role updated");
      setEditModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      messageApi.error(err?.message || "Failed to update role");
    } finally {
      setEditLoading(false);
    }
  };

  // ── Delete role ────────────────────────────────────────────────────────────
  const handleDeleteRole = async (roleId: string) => {
    try {
      await RBACService.deleteRole(roleId);
      messageApi.success("Role deleted");
      fetchRoles();
    } catch (err: any) {
      messageApi.error(err?.message || "Failed to delete role");
    }
  };

  // ── Permissions drawer ─────────────────────────────────────────────────────
  const openPermissionsDrawer = async (role: RBACRole) => {
    setDrawerRole(role);
    setDrawerOpen(true);
    setSelectedPermIds([]);
    setAccessTab('all');
    setPermSearch('');
    setDrawerLoadingPerms(true);
    try {
      const full = await RBACService.getRoleById(role.id);
      setSelectedPermIds(full.rolePermissions.map((rp) => rp.permission.id));
    } catch {
      messageApi.error("Failed to load role permissions");
    } finally {
      setDrawerLoadingPerms(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!drawerRole) return;
    try {
      setDrawerSaving(true);
      await RBACService.setRolePermissions(drawerRole.id, selectedPermIds);
      messageApi.success(`Permissions saved for "${drawerRole.name}"`);
      setDrawerOpen(false);
      fetchRoles();
    } catch (err: any) {
      messageApi.error(err?.message || "Failed to save permissions");
    } finally {
      setDrawerSaving(false);
    }
  };

  const togglePermission = (permId: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(permId) ? prev.filter((id) => id !== permId) : [...prev, permId]
    );
  };

  const toggleResource = (perms: RBACPermission[]) => {
    const ids = perms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedPermIds.includes(id));
    if (allSelected) {
      setSelectedPermIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedPermIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const selectAll = () => {
    const all = Object.values(allPermissions).flatMap((perms) => perms.map((p) => p.id));
    setSelectedPermIds(all);
  };

  const clearAll = () => setSelectedPermIds([]);

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<RBACRole> = [
    {
      title: "Role",
      key: "name",
      width: 280,
      render: (_, record) => (
        <div className="rp-row-name">
          <div className={`rp-row-name__avatar${record.isSystem ? ' is-system' : ' is-custom'}`}>
            {record.isSystem ? <LockOutlined /> : <CrownOutlined />}
          </div>
          <div className="rp-row-name__text">
            <div className="rp-row-name__title-row">
              <span className="rp-row-name__title">{record.name}</span>
              {record.isSystem && <span className="rp-system-tag">SYSTEM</span>}
            </div>
            <div className="rp-row-name__slug">{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => (
        <span className="rp-row-desc">{text || "—"}</span>
      ),
    },
    {
      title: "Permissions",
      key: "perms",
      width: 130,
      align: "center" as const,
      render: (_, record) => {
        const count = record._count?.rolePermissions ?? 0;
        return (
          <span className={`rp-pill is-perms${count === 0 ? ' is-empty' : ''}`}>
            <KeyOutlined />
            {count}
          </span>
        );
      },
    },
    {
      title: "Members",
      key: "users",
      width: 110,
      align: "center" as const,
      render: (_, record) => {
        const count = record._count?.userRoles ?? 0;
        return (
          <span className={`rp-pill is-members${count === 0 ? ' is-empty' : ''}`}>
            <UserOutlined />
            {count}
          </span>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 110,
      render: (_, record) => (
        <span className={`rp-status-pill ${record.isActive ? 'is-active' : 'is-inactive'}`}>
          <span className="rp-status-dot" />
          {record.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      align: "right" as const,
      render: (_, record) => (
        <div className="rp-row-actions">
          {canAssignRole && (
            <Tooltip title="Manage members">
              <Button
                type="text"
                icon={<TeamOutlined />}
                size="small"
                onClick={() => openMembersDrawer(record)}
              />
            </Tooltip>
          )}
          {canUpdateRole && (
            <Tooltip title="Edit name / description">
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => openEditModal(record)}
                disabled={record.isSystem}
              />
            </Tooltip>
          )}
          {canUpdateRole && (
            <Tooltip title="Edit permissions">
              <Button
                type="text"
                icon={<SettingOutlined />}
                size="small"
                onClick={() => openPermissionsDrawer(record)}
              />
            </Tooltip>
          )}
          {canDeleteRole && !record.isSystem && (
            <ConfirmDialog
              tone="danger"
              title="Delete this role?"
              description="All members assigned this role will lose its permissions immediately."
              confirmText="Delete"
              cancelText="Cancel"
              placement="left"
              onConfirm={() => handleDeleteRole(record.id)}
            >
              <Tooltip title="Delete role">
                <Button type="text" icon={<DeleteOutlined />} size="small" danger />
              </Tooltip>
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];


  // ── Render ─────────────────────────────────────────────────────────────────
  if (!user || isLoading || !canReadRole) {
    if (isLoading) return <ZukvoLoader message="Loading roles..." />;
    return null;
  }

  return (
    <MainLayout>
      <div className="rp-shell">
        {/* ============================ SIDEBAR ============================ */}
        {isMobileOpen && (
          <div className="rp-backdrop" onClick={() => setIsMobileOpen(false)} />
        )}
        <aside className={`rp-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
          <div className="rp-side-head">
            <div className="rp-side-logo">
              <SafetyOutlined />
            </div>
            <div className="rp-side-head-text">
              <div className="rp-side-title">Roles &amp; Permissions</div>
              <div className="rp-side-subtitle">Access · control</div>
            </div>
          </div>

          {canCreateRole && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="rp-side-create"
              onClick={() => setCreateModalOpen(true)}
              block
            >
              Create Role
            </Button>
          )}

          <div className="rp-side-scroll">
            <div className="rp-side-section-label">Views</div>
            <div className="rp-side-list">
              {roleViews.map((v) => {
                const active = roleTypeFilter === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    className={`rp-view-item${active ? ' is-active' : ''}`}
                    onClick={() => setRoleTypeFilter(v.key)}
                  >
                    <span className="rp-view-icon" style={{ color: active ? v.color : 'var(--text-slate-400)' }}>
                      {v.icon}
                    </span>
                    <span className="rp-view-label">{v.label}</span>
                    <span className="rp-view-count">{v.count}</span>
                  </button>
                );
              })}
            </div>

            <div className="rp-side-tip">
              <SafetyOutlined className="rp-side-tip__icon" />
              <div>
                <div className="rp-side-tip__title">Manage access</div>
                <div className="rp-side-tip__text">
                  Open a role to configure its permissions and assign members.
                </div>
              </div>
            </div>
          </div>

        </aside>

        {/* ============================ MAIN ============================ */}
        <main className="rp-main">
          {/* Topbar */}
          <div className="rp-main-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 240, maxWidth: 520 }}>
              <button className="rp-mobile-toggle" onClick={() => setIsMobileOpen(true)} style={{ marginRight: 0 }}>
                <MenuOutlined style={{ fontSize: 16 }} />
              </button>
              <Input
                className="rp-search"
                prefix={
                  <SearchOutlined style={{ color: 'var(--text-slate-400)', marginRight: 6 }} />
                }
                placeholder="Search by role name, slug, or description…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                style={{ flex: 1 }}
              />
            </div>
            {hasActiveFilter && (
              <Tooltip title="Clear all filters">
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={handleClearFilters}
                  className="rp-clear-btn"
                >
                  Reset
                </Button>
              </Tooltip>
            )}
            <div className="rp-main-meta">
              <div className="rp-segmented">
                <button
                  type="button"
                  className={view === "list" ? "is-active" : ""}
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <BarsOutlined />
                </button>
                <button
                  type="button"
                  className={view === "grid" ? "is-active" : ""}
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                >
                  <AppstoreOutlined />
                </button>
              </div>
              <Tooltip title="Refresh">
                <Button
                  className="rp-ghost-btn"
                  icon={<ReloadOutlined spin={loading} />}
                  onClick={() => { fetchRoles(); fetchPermissions(); }}
                />
              </Tooltip>
              {canReadActivityLog && (
                <Tooltip title="View change history">
                  <Button
                    className="rp-history-btn"
                    icon={<History size={15} />}
                    onClick={() => setHistoryOpen(true)}
                  >
                    History
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Premium stats grid */}
          <div className="rp-stat-grid">
            <StatCard
              label="Total Roles"
              value={roleStats.total}
              icon={<SafetyOutlined />}
              accent="#3b82f6"
              subtle="Across all access tiers"
              loading={loading && roleStats.total === 0}
              chart={
                roleStats.total > 0 ? (
                  <MiniBar
                    segments={[
                      {
                        value: roleStats.system,
                        color: '#3b82f6',
                        label: `${roleStats.system} system`,
                      },
                      {
                        value: roleStats.custom,
                        color: '#10b981',
                        label: `${roleStats.custom} custom`,
                      },
                    ]}
                  />
                ) : null
              }
            />

            <StatCard
              label="System Roles"
              value={roleStats.system}
              icon={<LockOutlined />}
              accent="#3b82f6"
              subtle="Locked baseline roles"
              loading={loading && roleStats.total === 0}
              chart={
                roleStats.total > 0 ? (
                  <div className="rp-cv-row">
                    <KeyOutlined style={{ fontSize: 11 }} />
                    <span>
                      <strong>
                        {Math.round((roleStats.system / Math.max(roleStats.total, 1)) * 100)}%
                      </strong>{' '}
                      of roles
                    </span>
                  </div>
                ) : null
              }
            />

            <StatCard
              label="Custom Roles"
              value={roleStats.custom}
              icon={<ApartmentOutlined />}
              accent="#10b981"
              subtle="Created by your team"
              loading={loading && roleStats.total === 0}
              chart={
                roleStats.total > 0 ? (
                  <div className="rp-cv-row">
                    <TeamOutlined style={{ fontSize: 11 }} />
                    <span>
                      <strong>{roleStats.totalMembers}</strong> total members
                    </span>
                  </div>
                ) : null
              }
            />

            <StatCard
              label="Permissions"
              value={roleStats.permissions}
              icon={<KeyOutlined />}
              accent="#64748b"
              subtle={
                roleStats.permissions > 0
                  ? `${roleStats.assignedPerms} assigned across roles`
                  : 'No permissions defined'
              }
              loading={loading && roleStats.permissions === 0}
              chart={
                roleStats.total > 0 && roleStats.permissions > 0 ? (
                  <div className="rp-progress-row">
                    <div className="rp-progress-track">
                      <span
                        className="rp-progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (roleStats.assignedPerms /
                                Math.max(roleStats.permissions * roleStats.total, 1)) *
                              100,
                            ),
                          )}%`,
                          background: 'linear-gradient(90deg, #64748b, #94a3b8)',
                        }}
                      />
                    </div>
                    <span className="rp-progress-label">
                      {roleStats.assignedPerms}/{roleStats.permissions * roleStats.total}
                    </span>
                  </div>
                ) : null
              }
            />
          </div>



          {/* Roles panel */}
          {view === "list" ? (
            <div className="rp-panel" style={{ position: 'relative' }}>
              {/* Table */}
              {loading && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ZukvoLoader size="md" />
                </div>
              )}
              <Table
                className="premium-table rp-table"
                columns={columns}
                dataSource={filteredRoles}
                rowKey="id"
                loading={false}
                pagination={false}
                scroll={{ x: 1000 }}
              />
            </div>
          ) : (
            <div className="rp-grid">
              {loading ? (
                <div className="rp-grid-loading">Loading…</div>
              ) : filteredRoles.length === 0 ? (
                <div className="rp-grid-loading">No roles match your filters.</div>
              ) : (
                filteredRoles.map((record) => {
                  const permCount = record._count?.rolePermissions ?? 0;
                  const memberCount = record._count?.userRoles ?? 0;
                  return (
                    <div key={record.id} className="rp-card">
                      <div className="rp-card-top">
                        <div
                          className={`rp-row-name__avatar${record.isSystem ? " is-system" : " is-custom"}`}
                        >
                          {record.isSystem ? <LockOutlined /> : <CrownOutlined />}
                        </div>
                        <div className="rp-card-identity">
                          <div className="rp-card-title-row">
                            <span className="rp-card-title">{record.name}</span>
                            {record.isSystem && <span className="rp-system-tag">SYSTEM</span>}
                          </div>
                          <div className="rp-row-name__slug">{record.slug}</div>
                        </div>
                        <span
                          className={`rp-status-pill ${record.isActive ? "is-active" : "is-inactive"}`}
                        >
                          <span className="rp-status-dot" />
                          {record.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>

                      <div className="rp-card-desc">
                        {record.description || "No description provided."}
                      </div>

                      <div className="rp-card-foot">
                        <div className="rp-card-foot-row">
                          <span className="rp-card-foot-item">
                            <span className="rp-card-foot-key">Permissions</span>
                            <span
                              className={`rp-pill is-perms${permCount === 0 ? " is-empty" : ""}`}
                            >
                              <KeyOutlined />
                              {permCount}
                            </span>
                          </span>
                          <span className="rp-card-foot-div" />
                          <span className="rp-card-foot-item">
                            <span className="rp-card-foot-key">Members</span>
                            <span
                              className={`rp-pill is-members${memberCount === 0 ? " is-empty" : ""}`}
                            >
                              <UserOutlined />
                              {memberCount}
                            </span>
                          </span>
                        </div>
                        <div className="rp-card-foot-row rp-card-actions">
                          {canAssignRole && (
                            <Tooltip title="Manage members">
                              <Button
                                type="text"
                                icon={<TeamOutlined />}
                                size="small"
                                onClick={() => openMembersDrawer(record)}
                              />
                            </Tooltip>
                          )}
                          {canUpdateRole && (
                            <Tooltip title="Edit name / description">
                              <Button
                                type="text"
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => openEditModal(record)}
                                disabled={record.isSystem}
                              />
                            </Tooltip>
                          )}
                          {canUpdateRole && (
                            <Tooltip title="Edit permissions">
                              <Button
                                type="text"
                                icon={<SettingOutlined />}
                                size="small"
                                onClick={() => openPermissionsDrawer(record)}
                              />
                            </Tooltip>
                          )}
                          {canDeleteRole && !record.isSystem && (
                            <ConfirmDialog
                              tone="danger"
                              title="Delete this role?"
                              description="All members assigned this role will lose its permissions immediately."
                              confirmText="Delete"
                              cancelText="Cancel"
                              placement="left"
                              onConfirm={() => handleDeleteRole(record.id)}
                            >
                              <Tooltip title="Delete role">
                                <Button type="text" icon={<DeleteOutlined />} size="small" danger />
                              </Tooltip>
                            </ConfirmDialog>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          <div className="rp-footer rp-footer--sticky">
            <div className="rp-footer-info">
              Showing <strong>{filteredRoles.length}</strong> of <strong>{roleStats.total}</strong> roles
            </div>
          </div>
        </main>

        {/* ── Create Role Modal (premium) ── */}
        <Modal
          className="rp-role-modal"
          open={createModalOpen}
          onCancel={() => {
            setCreateModalOpen(false);
            createForm.resetFields();
          }}
          footer={null}
          closable={false}
          width={520}
          centered
          destroyOnHidden
        >
          <div className="rp-rm-hero">
            <div className="rp-rm-hero__icon">
              <PlusOutlined />
            </div>
            <div className="rp-rm-hero__text">
              <div className="rp-rm-hero__eyebrow">Roles &amp; Permissions</div>
              <div className="rp-rm-hero__title">Create new role</div>
              <div className="rp-rm-hero__sub">
                Define a reusable bundle of permissions for your team.
              </div>
            </div>
            <button
              type="button"
              className="rp-rm-hero__close"
              onClick={() => {
                setCreateModalOpen(false);
                createForm.resetFields();
              }}
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
          </div>

          <Form form={createForm} layout="vertical" onFinish={handleCreateRole} requiredMark={false}>
            <RoleFormContent form={createForm} mode="create" />

            <div className="rp-rm-footer">
              <Button
                onClick={() => {
                  setCreateModalOpen(false);
                  createForm.resetFields();
                }}
                className="rp-rm-btn-ghost"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createLoading}
                icon={<PlusOutlined />}
                className="rp-rm-btn-primary"
              >
                Create Role
              </Button>
            </div>
          </Form>
        </Modal>

        {/* ── Edit Role Modal (premium) ── */}
        <Modal
          className="rp-role-modal"
          open={editModalOpen}
          onCancel={() => setEditModalOpen(false)}
          footer={null}
          closable={false}
          width={520}
          centered
          destroyOnHidden
        >
          <div className="rp-rm-hero is-edit">
            <div className="rp-rm-hero__icon">
              <EditOutlined />
            </div>
            <div className="rp-rm-hero__text">
              <div className="rp-rm-hero__eyebrow">Editing role</div>
              <div className="rp-rm-hero__title">{editingRole?.name || 'Edit role'}</div>
              <div className="rp-rm-hero__sub">
                Update the display name &amp; description. Permissions are unchanged.
              </div>
            </div>
            <button
              type="button"
              className="rp-rm-hero__close"
              onClick={() => setEditModalOpen(false)}
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
          </div>

          <Form form={editForm} layout="vertical" onFinish={handleEditRole} requiredMark={false}>
            <RoleFormContent
              form={editForm}
              mode="edit"
              existingSlug={editingRole?.slug}
            />

            <div className="rp-rm-footer">
              <Button onClick={() => setEditModalOpen(false)} className="rp-rm-btn-ghost">
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={editLoading}
                className="rp-rm-btn-primary"
              >
                Save Changes
              </Button>
            </div>
          </Form>
        </Modal>

        {/* ── Access Control Drawer (premium) ── */}
        <Drawer
          className="rp-acc-drawer"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={1080}
          closable={false}
          styles={{
            header: { display: 'none' },
            body: { padding: 0, background: 'var(--bg-pure-white)' },
            content: { background: 'var(--bg-pure-white)' },
            footer: { padding: 0, border: 'none' },
          }}
          footer={
            <div className="rp-acc-footer">
              <div className="rp-acc-footer__meta">
                <KeyOutlined />
                <span>
                  <strong>{selectedPermIds.length}</strong> permission{selectedPermIds.length === 1 ? '' : 's'} selected
                </span>
              </div>
              <div className="rp-acc-footer__actions">
                <Button onClick={() => setDrawerOpen(false)} className="rp-acc-btn-ghost">
                  Cancel
                </Button>
                {canUpdateRole && (
                  <Button
                    type="primary"
                    loading={drawerSaving}
                    onClick={handleSavePermissions}
                    className="rp-acc-btn-primary"
                  >
                    Save Configuration
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {/* Hero header */}
          <div className="rp-acc-hero">
            <div className="rp-acc-hero__icon">
              <SafetyOutlined />
            </div>
            <div className="rp-acc-hero__text">
              <div className="rp-acc-hero__eyebrow">Access Control</div>
              <div className="rp-acc-hero__title-row">
                <span className="rp-acc-hero__title">{drawerRole?.name || '—'}</span>
                {drawerRole?.isSystem && <span className="rp-acc-hero__badge">SYSTEM ROLE</span>}
              </div>
              <div className="rp-acc-hero__sub">
                Define granular permissions and operational limits for this role.
              </div>
            </div>
            <button
              className="rp-acc-hero__close"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
          </div>

          {drawerLoadingPerms ? (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <Spin tip="Loading permissions">
                <div style={{ height: 40 }} />
              </Spin>
            </div>
          ) : (
            (() => {
              const allResources = Object.keys(allPermissions);
              const tabResources = getResourcesForGroup(accessTab, allResources);
              const searchQ = permSearch.trim().toLowerCase();

              // Filter perms by search across the current tab
              const filteredByResource: Record<string, RBACPermission[]> = {};
              tabResources.forEach((res) => {
                if (res === 'letter_template' || res === 'letter.format') return;

                let perms = allPermissions[res] || [];
                if (res === 'letter') {
                  if (allPermissions['letter_template']) {
                    perms = [...perms, ...allPermissions['letter_template']];
                  }
                  if (allPermissions['letter.format']) {
                    perms = [...perms, ...allPermissions['letter.format']];
                  }
                }

                if (!searchQ) {
                  filteredByResource[res] = perms;
                  return;
                }
                const label = (RESOURCE_LABELS[res] || res).toLowerCase();
                if (label.includes(searchQ) || (res === 'letter' && ((RESOURCE_LABELS['letter_template'] || '').toLowerCase().includes(searchQ) || (RESOURCE_LABELS['letter.format'] || '').toLowerCase().includes(searchQ)))) {
                  filteredByResource[res] = perms;
                  return;
                }
                const matching = perms.filter(
                  (p) =>
                    p.name.toLowerCase().includes(searchQ) ||
                    p.action.toLowerCase().includes(searchQ) ||
                    (p.description || '').toLowerCase().includes(searchQ),
                );
                if (matching.length > 0) filteredByResource[res] = matching;
              });

              const visibleResources = Object.keys(filteredByResource);

              // Counts per group for tab pills
              const groupCounts: Record<string, number> = {};
              ACCESS_GROUPS.forEach((g) => {
                const res = getResourcesForGroup(g.key, allResources);
                groupCounts[g.key] = res.reduce(
                  (sum, r) => sum + (allPermissions[r]?.length || 0),
                  0,
                );
              });

              const totalPerms = allResources.reduce(
                (s, r) => s + (allPermissions[r]?.length || 0),
                0,
              );
              const selectedInTabPerms = tabResources.reduce((sum, r) => {
                const perms = allPermissions[r] || [];
                return sum + perms.filter((p) => selectedPermIds.includes(p.id)).length;
              }, 0);
              const tabTotalPerms = tabResources.reduce(
                (sum, r) => sum + (allPermissions[r]?.length || 0),
                0,
              );

              const handleSelectTab = () => {
                const ids = tabResources.flatMap((r) =>
                  (allPermissions[r] || []).map((p) => p.id),
                );
                setSelectedPermIds((prev) => [...new Set([...prev, ...ids])]);
              };
              const handleClearTab = () => {
                const ids = new Set(
                  tabResources.flatMap((r) =>
                    (allPermissions[r] || []).map((p) => p.id),
                  ),
                );
                setSelectedPermIds((prev) => prev.filter((id) => !ids.has(id)));
              };

              return (
                <div className="rp-acc-body">
                  {/* Sticky tabs + search + toolbar */}
                  <div className="rp-acc-sticky">
                    {/* Tabs row */}
                    <div className="rp-acc-tabs">
                      {ACCESS_GROUPS.map((g) => {
                        const count = groupCounts[g.key] || 0;
                        const isActive = accessTab === g.key;
                        return (
                          <button
                            key={g.key}
                            type="button"
                            className={`rp-acc-tab${isActive ? ' is-active' : ''}`}
                            onClick={() => setAccessTab(g.key)}
                            style={{ ['--tab-accent' as any]: g.accent }}
                          >
                            <span className="rp-acc-tab__icon">{g.icon}</span>
                            <span className="rp-acc-tab__label">{g.label}</span>
                            <span className="rp-acc-tab__count">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search + toolbar */}
                    <div className="rp-acc-toolbar">
                      <Input
                        className="rp-acc-search"
                        prefix={
                          <SearchOutlined style={{ color: 'var(--text-slate-400)', marginRight: 6 }} />
                        }
                        placeholder="Search permission by name, action, or description…"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        allowClear
                      />

                      <div className="rp-acc-toolbar__meta">
                        <span className="rp-acc-pill">
                          <KeyOutlined />
                          <strong>{selectedInTabPerms}</strong>
                          <span className="rp-acc-pill__sep">/</span>
                          {tabTotalPerms} in tab
                        </span>
                        <span className="rp-acc-pill is-muted">
                          <span className="rp-acc-pill__dot" />
                          <strong>{selectedPermIds.length}</strong>
                          <span className="rp-acc-pill__sep">/</span>
                          {totalPerms} total
                        </span>
                      </div>

                      <div className="rp-acc-toolbar__actions" style={{ display: 'flex', gap: 12 }}>
                        {(() => {
                          const allExpanded = visibleResources.length > 0 && visibleResources.every((r) => expandedPermGroups.includes(r));
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-slate-700)', border: '1px solid var(--border-color, #e2e8f0)', padding: '4px 12px', borderRadius: 6, background: 'var(--bg-pure-white, #ffffff)' }}>
                              <Switch
                                size="small"
                                checked={allExpanded}
                                onChange={(checked) => setExpandedPermGroups(checked ? visibleResources : [])}
                              />
                              <span style={{ cursor: 'pointer', fontWeight: 500 }} onClick={() => setExpandedPermGroups(allExpanded ? [] : visibleResources)}>
                                Expand all
                              </span>
                            </div>
                          );
                        })()}
                        {canUpdateRole && (
                          <>
                            <Button
                              size="small"
                              icon={<CheckSquareOutlined />}
                              onClick={accessTab === 'all' ? selectAll : handleSelectTab}
                              className="rp-acc-link"
                            >
                              Select {accessTab === 'all' ? 'all' : 'tab'}
                            </Button>
                            <Button
                              size="small"
                              icon={<BorderOutlined />}
                              onClick={accessTab === 'all' ? clearAll : handleClearTab}
                              className="rp-acc-link is-danger"
                            >
                              Clear {accessTab === 'all' ? 'all' : 'tab'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Tab progress bar */}
                    {tabTotalPerms > 0 && (
                      <div className="rp-acc-progress">
                        <div className="rp-acc-progress__track">
                          <span
                            className="rp-acc-progress__fill"
                            style={{
                              width: `${(selectedInTabPerms / tabTotalPerms) * 100}%`,
                              background: `linear-gradient(90deg, ${ACCESS_GROUPS.find((g) => g.key === accessTab)?.accent ||
                                '#3b82f6'
                                }, ${ACCESS_GROUPS.find((g) => g.key === accessTab)?.accent ||
                                '#3b82f6'
                                }aa)`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Resource groups */}
                  <div className="rp-acc-groups">
                    {visibleResources.length === 0 ? (
                      <div className="rp-acc-empty">
                        <SearchOutlined className="rp-acc-empty__icon" />
                        <div className="rp-acc-empty__title">
                          {permSearch ? 'No permissions match your search' : 'No permissions in this group'}
                        </div>
                        <div className="rp-acc-empty__sub">
                          {permSearch
                            ? 'Try a different keyword or switch tabs.'
                            : 'This tab has no resources to manage.'}
                        </div>
                      </div>
                    ) : (
                      visibleResources.map((resource) => {
                        const perms = filteredByResource[resource];
                        const allPermsForRes = resource === 'letter'
                          ? [
                            ...(allPermissions['letter'] || []),
                            ...(allPermissions['letter_template'] || []),
                            ...(allPermissions['letter.format'] || [])
                          ]
                          : (allPermissions[resource] || []);
                        const label = RESOURCE_LABELS[resource] || resource;
                        const selectedCount = allPermsForRes.filter((p) =>
                          selectedPermIds.includes(p.id),
                        ).length;
                        const allInGroup = selectedCount === allPermsForRes.length;
                        const someInGroup = selectedCount > 0 && !allInGroup;

                        // Sub-grouping logic (preserved)
                        const subGroups: Record<string, RBACPermission[]> = {};
                        if (resource === 'leave') {
                          // Group by the page each permission gates, so all 9
                          // Leaves pages show up by name (see LEAVE_PAGE_BY_PERM).
                          perms.forEach((p) => {
                            const subKey = LEAVE_PAGE_BY_PERM[p.name] || 'Other';
                            if (!subGroups[subKey]) subGroups[subKey] = [];
                            subGroups[subKey].push(p);
                          });
                        } else if (resource === 'performance') {
                          // List the 4 Performance Report pages by name
                          // (see PERFORMANCE_PAGE_BY_PERM).
                          perms.forEach((p) => {
                            const subKey = PERFORMANCE_PAGE_BY_PERM[p.name] || 'Other';
                            if (!subGroups[subKey]) subGroups[subKey] = [];
                            subGroups[subKey].push(p);
                          });
                        } else if (resource === 'my_hub') {
                          // List the 7 My Hub pages by name (see MY_HUB_PAGE_BY_PERM).
                          perms.forEach((p) => {
                            const subKey = MY_HUB_PAGE_BY_PERM[p.name] || 'Other';
                            if (!subGroups[subKey]) subGroups[subKey] = [];
                            subGroups[subKey].push(p);
                          });
                        } else if (resource === 'qa') {
                          // List the 5 QA Space pages by name, Bug List included
                          // (see QA_PAGE_BY_PERM).
                          perms.forEach((p) => {
                            const subKey = QA_PAGE_BY_PERM[p.name] || 'Other';
                            if (!subGroups[subKey]) subGroups[subKey] = [];
                            subGroups[subKey].push(p);
                          });
                        } else if (resource === 'letter') {
                          perms.forEach((p) => {
                            let subKey = 'Other';
                            if (p.name.startsWith('letter_template.')) {
                              subKey = 'Template Builder';
                            } else if (p.name.startsWith('letter.format.')) {
                              subKey = 'Custom Formats';
                            } else if (p.name === 'letter.generate' || p.name === 'letter.manage') {
                              subKey = 'Letter Composer';
                            } else if (p.name === 'letter.read' || p.name === 'letter.delete') {
                              subKey = 'Generated Records';
                            }
                            if (!subGroups[subKey]) subGroups[subKey] = [];
                            subGroups[subKey].push(p);
                          });
                        } else
                          perms.forEach((p) => {
                            const parts = p.name.split('.');
                            let subKey = `${label} Core`;
                            if (p.name === 'time_tracking.manage_time') {
                              subKey = 'Team Module';
                            } else if (parts.length > 2) {
                              const subName = parts[1]
                                .split('_')
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(' ');
                              subKey = `${subName} ${label.includes('Settings') ? 'Config' : 'Module'}`;
                            } else if (parts[0] !== resource) {
                              const subName = parts[0]
                                .split('_')
                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(' ');
                              subKey = `${subName} Module`;
                            }
                            if (!subGroups[subKey]) subGroups[subKey] = [];
                            subGroups[subKey].push(p);
                          });

                        const isExpanded = expandedPermGroups.includes(resource);

                        return (
                          <Collapse
                            key={resource}
                            className="rp-acc-card rp-acc-collapse"
                            activeKey={isExpanded ? [resource] : []}
                            onChange={(keys) => {
                              if (keys.includes(resource)) {
                                setExpandedPermGroups(prev => [...prev, resource]);
                              } else {
                                setExpandedPermGroups(prev => prev.filter(r => r !== resource));
                              }
                            }}
                            expandIcon={({ isActive }) => (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={allInGroup}
                                    indeterminate={someInGroup}
                                    onChange={() => toggleResource(allPermsForRes)}
                                    disabled={!canUpdateRole}
                                    className="rp-acc-card__check"
                                  />
                                </div>
                                <span style={{
                                  color: 'var(--text-slate-500)',
                                  fontSize: 10,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 16,
                                  height: 16,
                                  border: '1px solid var(--border-color, #e2e8f0)',
                                  borderRadius: 4,
                                  background: 'var(--bg-secondary, #f8fafc)'
                                }}>
                                  {isActive ? <MinusOutlined /> : <PlusOutlined />}
                                </span>
                              </div>
                            )}
                            items={[{
                              key: resource,
                              label: (
                                <div className="rp-acc-card__text" style={{ marginLeft: 8 }}>
                                  <div className="rp-acc-card__title">{label}</div>
                                  <div className="rp-acc-card__sub">{resource}</div>
                                </div>
                              ),
                              extra: (
                                <span className={`rp-acc-card__count${allInGroup ? ' is-full' : someInGroup ? ' is-partial' : ''}`}>
                                  {selectedCount} / {allPermsForRes.length}
                                </span>
                              ),
                              children: (
                                <div className="rp-acc-card__body" style={{ padding: 0 }}>
                                  {(resource === 'leave'
                                    ? ([...LEAVE_PAGE_ORDER, 'Other'].filter((t) => subGroups[t]).map((t) => [t, subGroups[t]] as [string, RBACPermission[]]))
                                    : resource === 'performance'
                                      ? ([...PERFORMANCE_PAGE_ORDER, 'Other'].filter((t) => subGroups[t]).map((t) => [t, subGroups[t]] as [string, RBACPermission[]]))
                                      : resource === 'my_hub'
                                        ? ([...MY_HUB_PAGE_ORDER, 'Other'].filter((t) => subGroups[t]).map((t) => [t, subGroups[t]] as [string, RBACPermission[]]))
                                        : resource === 'qa'
                                          ? ([...QA_PAGE_ORDER, 'Other'].filter((t) => subGroups[t]).map((t) => [t, subGroups[t]] as [string, RBACPermission[]]))
                                          : resource === 'letter'
                                            ? ([...DOC_SUITE_PAGE_ORDER, 'Other'].filter((t) => subGroups[t]).map((t) => [t, subGroups[t]] as [string, RBACPermission[]]))
                                            : Object.entries(subGroups)
                                  ).map(([subTitle, subPerms]) => (
                                    <div key={subTitle} className="rp-acc-subgroup">
                                      <div className="rp-acc-subgroup__title">{subTitle}</div>
                                      <Row gutter={[10, 10]}>
                                        {subPerms.map((perm) => {
                                          const isSelected = selectedPermIds.includes(perm.id);
                                          return (
                                            <Col key={perm.id} xs={24} sm={12} lg={8}>
                                              <div
                                                onClick={() => canUpdateRole && togglePermission(perm.id)}
                                                className={`rp-acc-perm${isSelected ? ' is-selected' : ''}${!canUpdateRole ? ' is-readonly' : ''}`}
                                              >
                                                <Checkbox
                                                  checked={isSelected}
                                                  disabled={!canUpdateRole}
                                                  className="rp-acc-perm__check"
                                                />
                                                <div className="rp-acc-perm__text">
                                                  <div className="rp-acc-perm__title">
                                                    {(() => {
                                                      const name = perm.name;
                                                      const action = perm.action;
                                                      if (name.startsWith('leave.')) {
                                                        // Page is the sub-group title; show only the verb.
                                                        const verb = action.split('.').pop() || action;
                                                        return verb.charAt(0).toUpperCase() + verb.slice(1);
                                                      }
                                                      if (name.startsWith('qa.') || name.startsWith('bug.')) {
                                                        // QA Space page is the sub-group title; show only the verb.
                                                        const verb = action.split('.').pop() || action;
                                                        return verb.charAt(0).toUpperCase() + verb.slice(1);
                                                      }
                                                      if (name.startsWith('letter_template.') || name.startsWith('letter.')) {
                                                        const verb = action.split('.').pop() || action;
                                                        return verb.charAt(0).toUpperCase() + verb.slice(1);
                                                      }
                                                      if (name.startsWith('proposal.')) {
                                                        return `Proposal ${action.charAt(0).toUpperCase() + action.slice(1)}`;
                                                      }
                                                      if (action.includes('.')) {
                                                        return action
                                                          .split('.')
                                                          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                          .join(' ');
                                                      }
                                                      return action.charAt(0).toUpperCase() + action.slice(1);
                                                    })()}
                                                  </div>
                                                  {perm.description && (
                                                    <div className="rp-acc-perm__desc">
                                                      {perm.description}
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            </Col>
                                          );
                                        })}
                                      </Row>
                                    </div>
                                  ))}
                                </div>
                              )
                            }]}
                          />
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </Drawer>

        {/* ── Members Drawer (premium) ── */}
        <Drawer
          className="rp-mb-drawer"
          open={membersDrawerOpen}
          onClose={() => setMembersDrawerOpen(false)}
          width={560}
          closable={false}
          styles={{
            header: { display: 'none' },
            body: { padding: 0, background: 'var(--bg-pure-white)' },
            content: { background: 'var(--bg-pure-white)' },
            footer: { padding: 0, border: 'none' },
          }}
          footer={
            <div className="rp-mb-footer">
              <div className="rp-mb-footer__meta">
                <TeamOutlined />
                <span>
                  <strong>{roleMembers.length}</strong> member{roleMembers.length === 1 ? '' : 's'} assigned
                </span>
              </div>
              <Button onClick={() => setMembersDrawerOpen(false)} className="rp-mb-btn-ghost">
                Done
              </Button>
            </div>
          }
        >
          {/* Hero */}
          <div className="rp-mb-hero">
            <div className="rp-mb-hero__icon">
              <TeamOutlined />
            </div>
            <div className="rp-mb-hero__text">
              <div className="rp-mb-hero__eyebrow">Manage Members</div>
              <div className="rp-mb-hero__title-row">
                <span className="rp-mb-hero__title">{membersDrawerRole?.name || '—'}</span>
                <span className="rp-mb-hero__count">{roleMembers.length}</span>
              </div>
              <div className="rp-mb-hero__sub">
                Assign or remove members from this role. Permission changes take effect immediately.
              </div>
            </div>
            <button
              type="button"
              className="rp-mb-hero__close"
              onClick={() => setMembersDrawerOpen(false)}
              aria-label="Close"
            >
              <CloseOutlined />
            </button>
          </div>

          {membersDrawerLoading ? (
            <div style={{ textAlign: 'center', paddingTop: 80 }}>
              <Spin tip="Loading members">
                <div style={{ height: 40 }} />
              </Spin>
            </div>
          ) : (
            (() => {
              const availableMembers = allMembers.filter(
                (m) => !roleMembers.some((rm) => rm.user.id === m.value),
              );
              const searchQ = memberSearch.trim().toLowerCase();
              const filteredMembers = searchQ
                ? roleMembers.filter(
                  (e) =>
                    (e.user.name || '').toLowerCase().includes(searchQ) ||
                    (e.user.workEmail || '').toLowerCase().includes(searchQ),
                )
                : roleMembers;

              return (
                <div className="rp-mb-body">
                  {/* Assign card */}
                  {canAssignRole && (
                    <div className="rp-mb-assign">
                      <div className="rp-mb-assign__header">
                        <div className="rp-mb-assign__icon">
                          <UserOutlined />
                        </div>
                        <div className="rp-mb-assign__text">
                          <div className="rp-mb-assign__title">Assign new member</div>
                          <div className="rp-mb-assign__sub">
                            {availableMembers.length > 0
                              ? `${availableMembers.length} member${availableMembers.length === 1 ? '' : 's'} available to assign`
                              : 'All members are already assigned to this role'}
                          </div>
                        </div>
                      </div>

                      <div className="rp-mb-assign__row">
                        <div style={{ flex: 1 }}>
                          <SearchableDropdown
                            className="rp-mb-select"
                            placeholder="Search by name…"
                            value={assigningMemberId}
                            onChange={setAssigningMemberId}
                            disabled={availableMembers.length === 0}
                            style={{ width: '100%' }}
                            showSelectedAvatar={true}
                            options={availableMembers.map((m) => ({
                              value: m.value,
                              label: m.label,
                              avatarUrl: (m as any).avatarUrl,
                            }))}
                          />
                        </div>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          loading={assignLoading}
                          disabled={!assigningMemberId}
                          onClick={handleAssignMember}
                          className="rp-mb-assign__btn"
                        >
                          Assign
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Current members header + search */}
                  <div className="rp-mb-list-header">
                    <div className="rp-mb-list-header__title">
                      <span>Current members</span>
                      <span className="rp-mb-list-header__count">{roleMembers.length}</span>
                    </div>
                    {roleMembers.length > 0 && (
                      <Input
                        className="rp-mb-search"
                        prefix={
                          <SearchOutlined style={{ color: 'var(--text-slate-400)', marginRight: 6 }} />
                        }
                        placeholder="Filter assigned members…"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        allowClear
                      />
                    )}
                  </div>

                  {roleMembers.length === 0 ? (
                    <div className="rp-mb-empty">
                      <div className="rp-mb-empty__illustration">
                        <TeamOutlined />
                      </div>
                      <div className="rp-mb-empty__title">No members yet</div>
                      <div className="rp-mb-empty__sub">
                        Assign your first member from the picker above to grant access.
                      </div>
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="rp-mb-empty">
                      <div className="rp-mb-empty__illustration">
                        <SearchOutlined />
                      </div>
                      <div className="rp-mb-empty__title">No matches</div>
                      <div className="rp-mb-empty__sub">
                        Try a different name or email keyword.
                      </div>
                    </div>
                  ) : (
                    <div className="rp-mb-list">
                      {filteredMembers.map((entry) => (
                        <div key={entry.user.id} className="rp-mb-row">
                          <div
                            className="rp-mb-row__avatar"
                            style={{ background: gradientFor(entry.user.id) }}
                          >
                            {initialsOf(entry.user.name || '?')}
                          </div>
                          <div className="rp-mb-row__text">
                            <div className="rp-mb-row__name">{entry.user.name}</div>
                            <div className="rp-mb-row__email">
                              {entry.user.workEmail || 'No email provided'}
                            </div>
                          </div>
                          {canAssignRole && (
                            <ConfirmDialog
                              tone="danger"
                              title="Remove from role?"
                              description={`Are you sure you want to remove ${entry.user.name} from this role?`}
                              confirmText="Remove"
                              cancelText="Cancel"
                              placement="left"
                              onConfirm={() => handleRemoveMember(entry.user.id)}
                            >
                              <Tooltip title="Remove from role">
                                <button
                                  type="button"
                                  className="rp-mb-row__remove"
                                  aria-label={`Remove ${entry.user.name}`}
                                >
                                  <MinusCircleOutlined />
                                </button>
                              </Tooltip>
                            </ConfirmDialog>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </Drawer>
        <TransactionHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          module="RoleAndPermissions"
          title="Roles & Permissions History"
          subtitle="All security policy and assignment changes"
        />
      </div>
    </MainLayout>
  );
}
