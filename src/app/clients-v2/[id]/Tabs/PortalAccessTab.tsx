"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  Tooltip,
  Empty,
  Drawer,
  Table,
  Dropdown,
  App,
  Tag,
  Avatar,
} from "antd";
import dayjs from "dayjs";
import {
  KeyRound,
  Plus,
  Copy,
  RefreshCw,
  Power,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Check,
  Clock,
  Search,
  User,
  AtSign,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Sparkles,
  Eye,
  EyeOff,
  Building2,
  Receipt,
  Link2,
  Unlink,
  Info,
  LayoutList,
  LayoutGrid,
  MoreHorizontal,
} from "lucide-react";
import {
  clientPortalService,
  ClientPortalUser,
  CreatePortalUserResponse,
  LinkedCustomer,
  AvailableCustomer,
} from "@/services/clientPortalService";
import { useTheme } from "@/context/ThemeContext";
import { useSocket } from "@/providers/SocketProvider";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
  FieldLabel as FLabel,
} from "./_PremiumModal";
import { commonDrawerProps, SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

/* ---------------------------------------------------------------------- */
/*  Theme palette                                                          */
/* ---------------------------------------------------------------------- */

type Mode = "light" | "dark";

const palette = (mode: Mode) => {
  const dark = mode === "dark";
  return {
    surface: dark ? "#0B0F1A" : "#ffffff",
    surfaceElevated: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    surfaceSubtle: dark ? "#0E1422" : "#f9fafb",
    border: dark ? "#1E293B" : "#e5e7eb",
    borderStrong: dark ? "#273449" : "#d1d5db",
    borderFocus: "#3b82f6",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#CBD5E1" : "#475569",
    textSubtle: dark ? "#94A3B8" : "#64748b",
    textFaint: dark ? "#64748B" : "#94a3b8",
    accent: "#3b82f6",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentBorder: dark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    success: dark ? "#34d399" : "#059669",
    successBg: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: dark ? "rgba(16,185,129,0.35)" : "#a7f3d0",
    successText: dark ? "#6ee7b7" : "#047857",
    danger: dark ? "#f87171" : "#dc2626",
    dangerBg: dark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    dangerBorder: dark ? "rgba(239,68,68,0.35)" : "#fecaca",
    dangerText: dark ? "#fca5a5" : "#b91c1c",
    warning: dark ? "#fbbf24" : "#d97706",
    warningBg: dark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    warningBorder: dark ? "rgba(245,158,11,0.35)" : "#fde68a",
    warningText: dark ? "#fcd34d" : "#92400e",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

/* ---------------------------------------------------------------------- */

interface Props {
  clientId: string;
  contacts: any[];
  onRefresh?: () => void;
  onCountChange?: (n: number) => void;
}

const formatRelative = (iso: string | null) => {
  if (!iso) return "Never signed in";
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

export default function PortalAccessTab({ clientId, contacts, onCountChange }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);

  const [users, setUsers] = useState<ClientPortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();
  const [credentialDialog, setCredentialDialog] =
    useState<CreatePortalUserResponse | null>(null);
  const [resetDialog, setResetDialog] = useState<{
    user: ClientPortalUser;
    tempPassword: string;
    emailSent: boolean;
  } | null>(null);
  const { message: messageApi, modal } = App.useApp();

  const contactOptions = useMemo(() => {
    const taken = new Set(users.map((u) => u.contactId).filter(Boolean));
    return (contacts || [])
      .filter((c) => !taken.has(c.id))
      .map((c) => ({
        label: `${c.firstName || ""} ${c.lastName || ""}`.trim() || c.officialEmail,
        value: c.id,
        email: c.officialEmail,
        designation: c.designation,
        avatarUrl: c.avatarUrl || c.avatar,
      }));
  }, [contacts, users]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.displayName || "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "active").length;
    const disabled = users.filter((u) => u.status === "disabled").length;
    const pending = users.filter((u) => u.mustChangePassword).length;
    return { total: users.length, active, disabled, pending };
  }, [users]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await clientPortalService.listForClient(clientId);
      setUsers(data || []);
      onCountChange?.((data || []).length);
    } catch (err: any) {
      messageApi.error(`Failed to load portal users: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  // Real-time: another staff tab/window changes credentials → reload here.
  const { socket, connected } = useSocket();
  useEffect(() => {
    if (!socket || !connected) return;
    const handler = (payload: { clientId?: string } | undefined) => {
      if (payload?.clientId && payload.clientId !== clientId) return;
      load();
    };
    socket.on("portal_user:created", handler);
    socket.on("portal_user:updated", handler);
    socket.on("portal_user:deleted", handler);
    return () => {
      socket.off("portal_user:created", handler);
      socket.off("portal_user:updated", handler);
      socket.off("portal_user:deleted", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, connected, clientId]);

  const handleCreate = async (values: any) => {
    setCreating(true);
    try {
      const contact = contacts?.find((c) => c.id === values.contactId);
      const payload = {
        contactId: values.contactId || undefined,
        email: values.email,
        displayName:
          values.displayName ||
          (contact
            ? `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
            undefined
            : undefined),
        username: values.username || undefined,
        portalUrl: typeof window !== "undefined" ? `${window.location.origin}/portal/login` : undefined,
      };
      const created = await clientPortalService.create(clientId, payload);
      setCreateOpen(false);
      form.resetFields();
      setCredentialDialog(created);
      load();
    } catch (err: any) {
      messageApi.error(`Could not create portal user: ${err?.message}`);
    } finally {
      setCreating(false);
    }
  };

  const handleReset = async (user: ClientPortalUser) => {
    try {
      const { temporaryPassword, emailSent } =
        await clientPortalService.resetPassword(user.id);
      setResetDialog({ user, tempPassword: temporaryPassword, emailSent });
      if (emailSent) {
        messageApi.success(`Password reset: New temporary password emailed to ${user.email}.`);
      } else {
        messageApi.warning(
          "Password reset (email not sent): Could not send the email. Copy and share the temporary password manually."
        );
      }
      load();
    } catch (err: any) {
      messageApi.error(`Password reset failed: ${err?.message}`);
    }
  };

  const handleToggleStatus = async (user: ClientPortalUser) => {
    const next = user.status === "active" ? "disabled" : "active";
    try {
      await clientPortalService.updateStatus(user.id, next);
      messageApi.success(next === "active" ? "Access enabled" : "Access disabled");
      load();
    } catch (err: any) {
      messageApi.error(`Update failed: ${err?.message}`);
    }
  };

  const handleDelete = async (user: ClientPortalUser) => {
    try {
      await clientPortalService.remove(user.id);
      messageApi.success("Portal user removed");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message}`);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success("Copied");
    } catch {
      messageApi.error("Copy failed");
    }
  };

  const columns = [
    {
      title: "User",
      key: "user",
      width: 200,
      ellipsis: true,
      render: (record: ClientPortalUser) => {
        const initials = (record.displayName || record.username || "?")
          .split(" ")
          .map((s) => s[0])
          .filter(Boolean)
          .slice(0, 2)
          .join("")
          .toUpperCase();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "#3b82f6",
                border: "none",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11.5,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span
              style={{
                fontWeight: 600,
                color: c.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
              title={record.displayName || record.username}
            >
              {record.displayName || record.username}
            </span>
          </div>
        );
      },
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      width: 160,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11.5,
              padding: "2px 6px",
              background: c.surfaceMuted,
              border: `1px solid ${c.border}`,
              borderRadius: 4,
              color: c.textMuted,
              display: "inline-block",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "middle",
            }}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: c.textMuted }}>
          <AtSign size={12} color={c.textFaint} />
          {text}
        </span>
      ),
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      render: (text: string) => text ? (
        <span style={{ fontSize: 13, color: c.textMuted }}>{text}</span>
      ) : (
        <span style={{ fontSize: 13, color: c.textFaint }}>—</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 220,
      render: (record: ClientPortalUser) => (
        <div style={{ display: "flex", gap: 6, flexDirection: "row", flexWrap: "nowrap", alignItems: "center", overflow: "hidden" }}>
          {record.status === "active" ? (
            <StatusBadge variant="success" c={c} icon={ShieldCheck}>
              Active
            </StatusBadge>
          ) : (
            <StatusBadge variant="danger" c={c} icon={ShieldOff}>
              Disabled
            </StatusBadge>
          )}
          {record.mustChangePassword && (
            <Tooltip title="User has not changed the temporary password yet">
              <span>
                <StatusBadge variant="warning" c={c} icon={Clock}>
                  Pending first sign-in
                </StatusBadge>
              </span>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Last Active",
      dataIndex: "lastLoginAt",
      key: "lastLoginAt",
      render: (iso: string | null) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: c.textMuted }}>
          <Clock size={12} color={c.textFaint} />
          {formatRelative(iso)}
        </span>
      ),
    },
    {
      title: "Created By",
      key: "createdBy",
      render: (_: any, record: ClientPortalUser) => {
        const creator = record.createdBy;
        if (!creator?.name) return <span style={{ background: "var(--bg-blue-50)", color: "#3b82f6" }}>—</span>;
        return (
          <div className="pp-creator" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Avatar size={20} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}>
              {(creator.name?.[0] || "").toUpperCase()}
            </Avatar>
            <span className="pp-creator-name" style={{ fontSize: "11.5px", color: "var(--text-slate-700)", whiteSpace: "nowrap" }}>{creator.name}</span>
          </div>
        );
      },
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? (
          <div className="pp-date" style={{ display: "flex", flexDirection: "column" }}>
            <span className="pp-date-main" style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-slate-700)" }}>{dayjs(date).format("MMM D, YYYY")}</span>
            <span className="pp-date-sub" style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>{dayjs(date).format("h:mm A")}</span>
          </div>
        ) : <span style={{ color: "var(--text-slate-400)" }}>—</span>,
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      fixed: "right" as const,
      width: 60,
      /* ── Inline background so fixed-column never becomes transparent ──
         Ant Design v5 applies row-hover background after CSS paint,
         so CSS overrides alone don't work. onCell injects a bg directly
         on the <td> which always wins.                                  */
      onCell: () => ({
        style: { background: c.surfaceElevated },
      }),
      onHeaderCell: () => ({
        style: { background: c.surfaceMuted },
      }),
      render: (record: ClientPortalUser) => {
        return (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Dropdown
              menu={getPortalUserActionMenu(
                record,
                () => {
                  modal.confirm({
                    title: "Reset password?",
                    content: `A new temporary password will be emailed to ${record.email} and all active sessions will be signed out.`,
                    okText: "Reset & email",
                    okButtonProps: { type: "primary" },
                    centered: true,
                    onOk: () => handleReset(record),
                  });
                },
                () => handleToggleStatus(record),
                () => {
                  modal.confirm({
                    title: "Remove portal access?",
                    content: "This permanently deletes the login. The client contact will not be removed.",
                    okText: "Remove",
                    okButtonProps: { danger: true },
                    centered: true,
                    onOk: () => handleDelete(record),
                  });
                }
              )}
              overlayClassName="pp-action-pop"
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreHorizontal size={16} />}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                  color: c.textSubtle,
                }}
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>

      {/* ---------------- Header card ---------------- */}
      <div className="cd-tab-sticky-head">
      <div className="portal-access-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<KeyRound size={20} color="#3b82f6" />}
            title="Portal Access"
            description="Create logins for client contacts to view their portal workspace."
            extra={
              <Button
                type="primary"
                icon={<Plus size={15} />}
                onClick={() => setCreateOpen(true)}
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                  borderColor: "transparent",
                  borderRadius: "8px",
                  height: "36px",
                  fontWeight: 600,
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Create credential
              </Button>
            }
            style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
          />
        </div>
  
        {/* ---------------- Billing customers (gates invoice visibility) ---------------- */}
        {/* <BillingCustomersCard clientId={clientId} c={c} messageApi={messageApi} /> */}
  
        {/* ---------------- Stats strip ---------------- */}
        {users.length > 0 && (
          <div className="cd-stat-grid" style={{ marginTop: 20 }}>
            <StatPill
              label="Total"
              value={stats.total}
              icon={User}
              c={c}
              tone="neutral"
            />
            <StatPill
              label="Active"
              value={stats.active}
              icon={ShieldCheck}
              c={c}
              tone="success"
            />
            <StatPill
              label="Disabled"
              value={stats.disabled}
              icon={ShieldOff}
              c={c}
              tone="danger"
            />
            <StatPill
              label="Pending first sign-in"
              value={stats.pending}
              icon={Clock}
              c={c}
              tone="warning"
            />
          </div>
        )}
  
        {/* ---------------- Search & View Mode Toggle ---------------- */}
        {users.length > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 20, marginBottom: 16 }}>
              <Input
                allowClear
                className="contacts-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, username, or email…"
                prefix={<Search size={14} color={c.textFaint} />}
                style={{
                  flex: 1,
                }}
              />
              <div className="ptab-segmented">
                <Tooltip title="List view">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={viewMode === "list" ? "is-active" : ""}
                  >
                    <LayoutList size={15} />
                  </button>
                </Tooltip>
                <Tooltip title="Card view">
                  <button
                    type="button"
                    onClick={() => setViewMode("card")}
                    className={viewMode === "card" ? "is-active" : ""}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </Tooltip>
              </div>
            </div>
            <div className="ptab-divider" />
          </>
        )}
      </div>

      {/* ---------------- List ---------------- */}
      {loading ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            border: `1px solid ${c.border}`,
            borderRadius: 12,
            background: c.surfaceElevated,
            color: c.textSubtle,
          }}
        >
          Loading…
        </div>
      ) : users.length === 0 ? (
        <EmptyState c={c} onCreate={() => setCreateOpen(true)} />
      ) : filteredUsers.length === 0 ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            border: `1px dashed ${c.border}`,
            borderRadius: 12,
            background: c.surfaceMuted,
            color: c.textSubtle,
            fontSize: 13,
          }}
        >
          No portal users match “{search}”.
        </div>
      ) : viewMode === "list" ? (
        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: "max-content" }}
          className="premium-table"
          locale={{ emptyText: <div style={{ color: c.textSubtle }}>No portal users found</div> }}
          onRow={() => ({
            onMouseEnter: (e) => {
              const tr = e.currentTarget as HTMLTableRowElement;
              tr.querySelectorAll<HTMLTableCellElement>("td.ant-table-cell-fix-right").forEach((td) => {
                td.style.setProperty("background", c.surfaceSubtle, "important");
              });
            },
            onMouseLeave: (e) => {
              const tr = e.currentTarget as HTMLTableRowElement;
              tr.querySelectorAll<HTMLTableCellElement>("td.ant-table-cell-fix-right").forEach((td) => {
                td.style.setProperty("background", c.surfaceElevated, "important");
              });
            },
          })}
        />
      ) : (
        <div className="pp-grid">
          {filteredUsers.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              c={c}
              onReset={() => handleReset(u)}
              onToggle={() => handleToggleStatus(u)}
              onDelete={() => handleDelete(u)}
            />
          ))}
        </div>
      )}

      {/* ---------------- Create Modal ---------------- */}
      <CreateCredentialModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          form.resetFields();
        }}
        onSubmit={handleCreate}
        creating={creating}
        contactOptions={contactOptions}
        contacts={contacts}
        form={form}
        c={c}
      />

      {/* ---------------- One-time credential dialog ---------------- */}
      <CredentialRevealModal
        open={!!credentialDialog}
        title="Credential created"
        intro="This temporary password will not be shown again. Copy it and share it with the client securely."
        portalUrl={
          typeof window !== "undefined" ? `${window.location.origin}/portal/login` : ""
        }
        username={credentialDialog?.username}
        email={credentialDialog?.email}
        password={credentialDialog?.temporaryPassword}
        onClose={() => setCredentialDialog(null)}
        onCopy={copyToClipboard}
        c={c}
      />      {/* ---------------- Reset password dialog ---------------- */}
      <CredentialRevealModal
        open={!!resetDialog}
        title="New temporary password"
        intro={
          resetDialog
            ? `${resetDialog.emailSent
              ? `The new password has been emailed to ${resetDialog.user.email}. `
              : `Email delivery failed — copy and share the password manually. `
            }Username and email are unchanged. All active sessions for ${resetDialog.user.displayName || resetDialog.user.username
            } have been signed out.`
            : ""
        }
        password={resetDialog?.tempPassword}
        onClose={() => setResetDialog(null)}
        onCopy={copyToClipboard}
        c={c}
      />

      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Dropdown Action Popover */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 220px;
          background: var(--bg-pure-white) !important;
          border: 1px solid var(--border-slate-100) !important;
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03) !important;
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100) !important; }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; text-align: left; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

        [data-theme="dark"] .pp-action-pop .ant-dropdown-menu {
          background: var(--bg-secondary) !important;
          border-color: var(--border-slate-800) !important;
        }
        [data-theme="dark"] .pp-action-pop .ant-dropdown-menu-item:hover {
          background: var(--bg-slate-800) !important;
        }
        [data-theme="dark"] .pp-action-pop .pp-menu-title {
          color: var(--text-slate-200) !important;
        }
        [data-theme="dark"] .pp-action-pop .pp-menu-desc {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .pp-action-pop .ant-dropdown-menu-item-divider {
          background: var(--border-slate-800) !important;
        }

       /* Full bleed header styling flush with vertical sidebar border */
        .portal-access-header-wrap {
          margin-bottom: 0 !important;
          display: block !important;
        }
        .portal-access-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .portal-access-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .portal-access-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        /* Premium Table Styles */
        .premium-table .ant-table {
          background: transparent !important;
          color: var(--text-slate-700) !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-400) !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          padding: 6px 10px !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        .premium-table .ant-table-tbody > tr > td {
          padding: 6.5px 10px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        .premium-table .ant-table-placeholder > td {
          background: transparent !important;
        }

        /* ── Fixed-column scroll overlay fix ──────────────────────────────
           Ant Design fixed columns use position:sticky. Without an explicit
           background the cell is transparent and scrolled content "bleeds"
           through it. We match the row background in every state so the
           fixed columns cleanly mask whatever is behind them.           */
        .premium-table .ant-table-tbody > tr > td.ant-table-cell-fix-right {
          background: #ffffff !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right {
          background: var(--bg-slate-50) !important;
        }
        /* Header fixed cells */
        .premium-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
          background: var(--bg-slate-50) !important;
        }
        /* Remove Ant's default right-shadow on fixed columns so it doesn't
           create a visual seam on top of the badges */
        .premium-table .ant-table-cell-fix-right-first::after,
        .premium-table .ant-table-cell-fix-right-last::after {
          box-shadow: inset -6px 0 8px -4px rgba(0,0,0,0.06) !important;
        }

        [data-theme="dark"] .premium-table .ant-table {
          color: var(--text-slate-200) !important;
        }
        [data-theme="dark"] .premium-table .ant-table-thead > tr > th {
          background: var(--bg-secondary) !important;
          color: var(--text-slate-300) !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
        }
        [data-theme="dark"] .premium-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-200) !important;
        }
        [data-theme="dark"] .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-800) !important;
        }
        /* Dark mode fixed columns */
        [data-theme="dark"] .premium-table .ant-table-tbody > tr > td.ant-table-cell-fix-right {
          background: var(--bg-secondary) !important;
        }
        [data-theme="dark"] .premium-table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right {
          background: var(--bg-slate-800) !important;
        }
        [data-theme="dark"] .premium-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
          background: var(--bg-secondary) !important;
        }

        /* Proposal Grid & Cards */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ptab-empty-wrapper { grid-column: 1 / -1; }
        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }

        [data-theme="dark"] .pc-card {
          background: var(--bg-slate-900);
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot {
          background: var(--bg-secondary);
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot-row {
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot-div {
          background: var(--border-slate-800);
        }
      `}} />
    </div>
  );
}

/* ====================================================================== */
/*  Sub-components                                                         */
/* ====================================================================== */

function StatPill({
  label,
  value,
  icon: Icon,
  tone,
  c,
}: {
  label: string;
  value: number;
  icon: any;
  tone: "neutral" | "success" | "danger" | "warning";
  c: ReturnType<typeof palette>;
}) {
  const map: Record<string, string> = {
    neutral: "#3b82f6",
    success: "#10b981",
    danger: "#ef4444",
    warning: "#f59e0b",
  };
  const accent = map[tone] || "#3b82f6";
  return (
    <div className="cd-stat-card">
      <div className="cd-stat-top">
        <div className="cd-stat-left">
          <div
            className="cd-stat-icon"
            style={{ background: `${accent}14`, color: accent }}
          >
            <Icon size={13} color={accent} />
          </div>
          <span className="cd-stat-label">{label}</span>
        </div>
      </div>
      <div className="cd-stat-bottom">
        <div className="cd-stat-value">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({
  variant,
  c,
  children,
  icon: Icon,
}: {
  variant: "success" | "danger" | "warning";
  c: ReturnType<typeof palette>;
  children: React.ReactNode;
  icon: any;
}) {
  const map = {
    success: {
      bg: c.successBg,
      border: c.successBorder,
      text: c.successText,
    },
    danger: { bg: c.dangerBg, border: c.dangerBorder, text: c.dangerText },
    warning: {
      bg: c.warningBg,
      border: c.warningBorder,
      text: c.warningText,
    },
  }[variant];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        background: map.bg,
        border: `1px solid ${map.border}`,
        color: map.text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={11} />
      {children}
    </span>
  );
}

const getPortalUserActionMenu = (
  user: ClientPortalUser,
  onResetClick: () => void,
  onToggleClick: () => void,
  onDeleteClick: () => void
) => ({
  className: "pp-action-pop",
  items: [
    {
      key: "reset",
      label: (
        <div className="pp-menu-item">
          <span className="pp-menu-ic" style={{ color: "#3b82f6", background: "rgba(59, 130, 246, 0.12)" }}><RefreshCw size={13} /></span>
          <span className="pp-menu-text">
            <span className="pp-menu-title">Reset Password</span>
            <span className="pp-menu-desc">Generate new temporary password</span>
          </span>
        </div>
      ),
    },
    {
      key: "toggle",
      label: (
        <div className="pp-menu-item">
          <span
            className="pp-menu-ic"
            style={{
              color: user.status === "active" ? "#f59e0b" : "#10b981",
              background: user.status === "active" ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
            }}
          >
            <Power size={13} />
          </span>
          <span className="pp-menu-text">
            <span className="pp-menu-title">{user.status === "active" ? "Disable Access" : "Enable Access"}</span>
            <span className="pp-menu-desc">
              {user.status === "active" ? "Suspend portal workspace login" : "Restore portal workspace access"}
            </span>
          </span>
        </div>
      ),
    },
    { type: "divider" as const },
    {
      key: "remove",
      danger: true,
      label: (
        <div className="pp-menu-item">
          <span className="pp-menu-ic" style={{ color: "#ef4444", background: "rgba(239, 68, 68, 0.12)" }}><Trash2 size={13} /></span>
          <span className="pp-menu-text">
            <span className="pp-menu-title" style={{ color: "#ef4444" }}>Remove Access</span>
            <span className="pp-menu-desc">Delete credentials permanently</span>
          </span>
        </div>
      ),
    },
  ],
  onClick: ({ key, domEvent }: any) => {
    domEvent?.stopPropagation();
    if (key === "reset") {
      onResetClick();
    } else if (key === "toggle") {
      onToggleClick();
    } else if (key === "remove") {
      onDeleteClick();
    }
  },
});

function UserCard({
  user,
  c,
  onReset,
  onToggle,
  onDelete,
}: {
  user: ClientPortalUser;
  c: ReturnType<typeof palette>;
  onReset: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const initial = (user.displayName || user.username || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="pc-card">
      <div className="pc-top">
        <div className="pc-avatar" style={{ background: "#3b82f6", color: "#fff", borderRadius: "50%" }}>
          {initial}
        </div>
        <div className="pc-identity-body">
          <div className="pc-title" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span>{user.displayName || user.username}</span>
            {user.status === "active" ? (
              <Tag color="success" style={{ margin: 0, borderRadius: 6, fontWeight: 600, border: 0, fontSize: "10px", padding: "1px 6px" }}>ACTIVE</Tag>
            ) : (
              <Tag color="error" style={{ margin: 0, borderRadius: 6, fontWeight: 600, border: 0, fontSize: "10px", padding: "1px 6px" }}>DISABLED</Tag>
            )}
            {user.mustChangePassword && (
              <Tag color="warning" style={{ margin: 0, borderRadius: 6, fontWeight: 600, border: 0, fontSize: "10px", padding: "1px 6px" }}>PENDING</Tag>
            )}
          </div>
          <div className="pc-client-line">
            <span className="pc-client-key">Username:</span>
            <span className="pc-client-val" style={{ fontFamily: "monospace", fontSize: "11px" }}>@{user.username}</span>
          </div>
        </div>
        <Dropdown
          menu={getPortalUserActionMenu(user, onReset, onToggle, onDelete)}
          overlayClassName="pp-action-pop"
          trigger={["click"]}
          placement="bottomRight"
        >
          <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal size={14} />
          </button>
        </Dropdown>
      </div>

      <div className="pc-foot">
        <div className="pc-foot-row">
          <span className="pc-foot-item">
            <span className="pc-foot-key">Created by</span>
            <Avatar size={16} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 8, fontWeight: 700 }}>
              {(user.createdBy?.name?.[0] || "—").toUpperCase()}
            </Avatar>
            <span className="pc-foot-val">{user.createdBy?.name || "—"}</span>
          </span>
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Created</span>
            <span className="pc-foot-val">{user.createdAt ? dayjs(user.createdAt).format("MMM D, YYYY · h:mm A") : "—"}</span>
          </span>
        </div>

        <div className="pc-foot-row">
          <span className="pc-foot-item" style={{ minWidth: 0 }}>
            <AtSign size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
            <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user.email}
            </span>
          </span>
          {user.designation && (
            <>
              <span className="pc-foot-div" />
              <span className="pc-foot-item" style={{ minWidth: 0 }}>
                <Building2 size={12} style={{ color: "var(--text-slate-400)", flexShrink: 0 }} />
                <span style={{ fontSize: "11.5px", color: "var(--text-slate-700)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.designation}
                </span>
              </span>
            </>
          )}
          <span className="pc-foot-div" />
          <span className="pc-foot-item">
            <span className="pc-foot-key">Active</span>
            <span className="pc-foot-val">{formatRelative(user.lastLoginAt)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  c,
  onCreate,
}: {
  c: ReturnType<typeof palette>;
  onCreate: () => void;
}) {
  return (
    <div
      style={{
        padding: "56px 24px",
        textAlign: "center",
        background: c.surfaceElevated,
        border: `1px dashed ${c.border}`,
        borderRadius: 14,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: c.accentBg,
          color: c.accentText,
          border: `1px solid ${c.accentBorder}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <KeyRound size={22} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: c.text }}>
        No portal logins yet
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: c.textSubtle,
          maxWidth: 440,
          margin: "6px auto 0",
          lineHeight: 1.55,
        }}
      >
        Create a credential for a client contact. They'll receive a temporary
        password to sign in to the portal and view their workspace.
      </div>
      <div style={{ marginTop: 20 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onCreate}>
          Create first credential
        </Button>
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  Create Credential Modal                                                */
/* ====================================================================== */

function CreateCredentialModal({
  open,
  onClose,
  onSubmit,
  creating,
  contactOptions,
  contacts,
  form,
  c,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  creating: boolean;
  contactOptions: { label: string; value: string; email: string; designation: string | null; avatarUrl?: string | null }[];
  contacts: any[];
  form: any;
  c: ReturnType<typeof palette>;
}) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setSelectedContactId(null);
  }, [open]);

  const selectedContact = contacts?.find((x) => x.id === selectedContactId);

  return (
    <>
      <style>{drawerFormStyles}</style>
      <Drawer
        {...commonDrawerProps}
        open={open}
        onClose={onClose}
      >
        <div className="flex flex-col h-full bg-[var(--customers-page-bg,#0B0F1A)]">
          <div className="customer-drawer-header shrink-0 flex items-center justify-between px-6 py-4 border-b border-dashed border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}`, color: c.accentText }}
              >
                <KeyRound size={16} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-[var(--text-primary)] leading-tight m-0">Create portal credential</h2>
                <p className="text-[12px] text-[var(--text-secondary)] m-0 mt-0.5 font-medium">The contact will get a temporary password and must change it on first sign-in.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 customer-drawer-form">
            <div className="mb-6 p-3 rounded-lg flex gap-3" style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}` }}>
              <Sparkles size={16} className="shrink-0 mt-0.5" style={{ color: c.accentText }} />
              <div className="text-[12.5px] font-medium" style={{ color: c.accentText }}>
                A secure temporary password is generated and shown <strong>once</strong>{" "}
                after creation. Copy it before closing the dialog.
              </div>
            </div>
      <Form
        form={form}
        layout="horizontal"
        labelCol={{ span: 7 }}
        wrapperCol={{ span: 17 }}
        labelAlign="left"
        onFinish={onSubmit}
        requiredMark={false}
        onValuesChange={(changed) => {
          if ("contactId" in changed) {
            setSelectedContactId(changed.contactId || null);
            const ct = contacts?.find((c) => c.id === changed.contactId);
            if (ct) {
              form.setFieldsValue({
                email: ct.officialEmail,
                displayName:
                  `${ct.firstName || ""} ${ct.lastName || ""}`.trim(),
              });
            } else {
              form.setFieldsValue({ email: undefined, displayName: undefined });
            }
          }
        }}
      >
        <SectionCard
          title="Link to contact"
          subtitle="Optional shortcut — pick a contact to auto-fill email and name below."
          icon={<User size={14} />}
          step="STEP 1"
        >
          <Form.Item label="Contact" name="contactId" style={{ marginBottom: 0 }}>
            <SearchableDropdown
              placeholder="Search by name or email…"
              searchPlaceholder="Search by name or email…"
              options={contactOptions.map((c) => ({
                value: c.value,
                label: c.label,
                description: `${c.email}${c.designation ? ` · ${c.designation}` : ""}`,
                avatarUrl: c.avatarUrl
              }))}
            />
          </Form.Item>

          {selectedContact && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 10px",
                background: c.successBg,
                border: `1px solid ${c.successBorder}`,
                borderRadius: 8,
                color: c.successText,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
              }}
            >
              <CheckCircle2 size={13} />
              Linked to{" "}
              <strong style={{ fontWeight: 600 }}>
                {selectedContact.firstName} {selectedContact.lastName}
              </strong>
              . Email and name pre-filled below.
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Account details"
          subtitle="These appear in the portal sign-in screen for the client."
          icon={<AtSign size={14} />}
          step="STEP 2"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Enter a valid email" },
            ]}
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<AtSign size={14} color={c.textFaint} />}
              placeholder="contact@clientcompany.com"
            />
          </Form.Item>

          <Form.Item
            label="Display name"
            name="displayName"
            style={{ marginBottom: 12 }}
          >
            <Input
              prefix={<User size={14} color={c.textFaint} />}
              placeholder="Full name shown in the portal"
            />
          </Form.Item>

          <Form.Item
            label="Username"
            name="username"
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={<KeyRound size={14} color={c.textFaint} />}
              placeholder="e.g. john_acme"
            />
          </Form.Item>
        </SectionCard>
      </Form>
    </div>
    
    <div className="customer-drawer-footer shrink-0 px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-end gap-3 bg-[var(--customers-page-bg,#0B0F1A)]">
      <Button onClick={onClose} className="border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] bg-transparent">
        Cancel
      </Button>
      <Button
        type="primary"
        htmlType="submit"
        loading={creating}
        onClick={() => form.submit()}
        icon={<KeyRound size={14} />}
        className="font-medium shadow-sm hover:opacity-90"
      >
        Create credential
      </Button>
    </div>
  </div>
</Drawer>
</>
  );
}

/* ====================================================================== */
/*  Credential reveal modal (post-create + post-reset)                     */
/* ====================================================================== */

function CredentialRevealModal({
  open,
  title,
  intro,
  username,
  email,
  password,
  portalUrl,
  onClose,
  onCopy,
  c,
}: {
  open: boolean;
  title: string;
  intro: string;
  username?: string;
  email?: string;
  password?: string;
  portalUrl?: string;
  onClose: () => void;
  onCopy: (v: string) => void;
  c: ReturnType<typeof palette>;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!open) setRevealed(false);
  }, [open]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={520}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: {
          background: c.surfaceElevated,
          border: `1px solid ${c.border}`,
          padding: 0,
          overflow: "hidden",
        },
        body: { padding: 0 },
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 24px 16px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: c.successBg,
            color: c.successText,
            border: `1px solid ${c.successBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, color: c.text }}>
            {title}
          </div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {/* Warning banner */}
        <div
          style={{
            padding: "12px 14px",
            background: c.warningBg,
            border: `1px solid ${c.warningBorder}`,
            borderRadius: 10,
            color: c.warningText,
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginBottom: 18,
            fontSize: 12.5,
            lineHeight: 1.5,
          }}
        >
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{intro}</span>
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {username && (
            <CredField
              c={c}
              label="Username"
              value={username}
              onCopy={onCopy}
              icon={User}
            />
          )}
          {email && (
            <CredField
              c={c}
              label="Email"
              value={email}
              onCopy={onCopy}
              icon={AtSign}
            />
          )}
          {password && (
            <CredField
              c={c}
              label="Temporary password"
              value={password}
              mono
              hidden={!revealed}
              onToggleVisibility={() => setRevealed((v) => !v)}
              onCopy={onCopy}
              icon={KeyRound}
              emphasized
            />
          )}
          {portalUrl && (
            <CredField
              c={c}
              label="Portal sign-in URL"
              value={portalUrl}
              onCopy={onCopy}
              icon={Globe}
              mono
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 20,
            paddingTop: 18,
            borderTop: `1px solid ${c.border}`,
          }}
        >
          <Button type="primary" onClick={onClose}>
            I have saved these details
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function CredField({
  c,
  label,
  value,
  mono,
  hidden,
  onToggleVisibility,
  onCopy,
  icon: Icon,
  emphasized,
}: {
  c: ReturnType<typeof palette>;
  label: string;
  value: string;
  mono?: boolean;
  hidden?: boolean;
  onToggleVisibility?: () => void;
  onCopy: (v: string) => void;
  icon: any;
  emphasized?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: c.textSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Icon size={11} />
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: emphasized ? "12px 14px" : "10px 12px",
          background: emphasized ? c.accentBg : c.surfaceMuted,
          border: `1px solid ${emphasized ? c.accentBorder : c.border}`,
          borderRadius: 10,
        }}
      >
        <code
          style={{
            flex: 1,
            fontFamily: mono
              ? "ui-monospace, SFMono-Regular, Menlo, monospace"
              : "inherit",
            fontSize: emphasized ? 15 : 13,
            fontWeight: emphasized ? 600 : 400,
            color: emphasized ? c.text : c.textMuted,
            background: "transparent",
            padding: 0,
            wordBreak: "break-all",
            letterSpacing: mono ? "0.01em" : "normal",
          }}
        >
          {hidden ? "•".repeat(Math.min(value.length, 22)) : value}
        </code>
        {onToggleVisibility && (
          <Tooltip title={hidden ? "Show" : "Hide"}>
            <Button
              size="small"
              type="text"
              icon={
                hidden ? (
                  <Eye size={14} color={c.textSubtle} />
                ) : (
                  <EyeOff size={14} color={c.textSubtle} />
                )
              }
              onClick={onToggleVisibility}
            />
          </Tooltip>
        )}
        <Button
          size="small"
          icon={<Copy size={13} />}
          onClick={() => onCopy(value)}
        >
          Copy
        </Button>
      </div>
    </div>
  );
}

/* ====================================================================== */
/*  Billing customers — linkage that powers portal invoice visibility      */
/* ====================================================================== */

function BillingCustomersCard({
  clientId,
  c,
  messageApi,
}: {
  clientId: string;
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [linked, setLinked] = useState<LinkedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [available, setAvailable] = useState<AvailableCustomer[]>([]);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await clientPortalService.listLinkedCustomers(clientId);
      setLinked(data || []);
    } catch (err: any) {
      messageApi.error(`Failed to load linked customers: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const loadAvailable = async (q: string) => {
    setSearching(true);
    try {
      const data = await clientPortalService.searchAvailableCustomers(
        clientId,
        q || undefined,
      );
      setAvailable(data || []);
    } catch (err: any) {
      messageApi.error(`Search failed: ${err?.message}`);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!pickerOpen) return;
    const t = setTimeout(() => loadAvailable(search), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen, search]);

  const handleLink = async (customerId: string) => {
    setLinkingId(customerId);
    try {
      await clientPortalService.linkCustomer(clientId, customerId);
      messageApi.success("Customer linked");
      load();
      loadAvailable(search);
    } catch (err: any) {
      messageApi.error(`Link failed: ${err?.message}`);
    } finally {
      setLinkingId(null);
    }
  };

  const handleUnlink = async (customerId: string) => {
    try {
      await clientPortalService.unlinkCustomer(clientId, customerId);
      messageApi.success("Customer unlinked");
      load();
    } catch (err: any) {
      messageApi.error(`Unlink failed: ${err?.message}`);
    }
  };

  return (
    <div
      style={{
        padding: 18,
        background: c.surfaceElevated,
        border: `1px solid ${c.border}`,
        borderRadius: 14,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: c.warningBg,
              color: c.warningText,
              border: `1px solid ${c.warningBorder}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Receipt size={16} />
          </div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: c.text,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Linked billing customers
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "1px 8px",
                  background: c.surfaceMuted,
                  border: `1px solid ${c.border}`,
                  borderRadius: 999,
                  color: c.textMuted,
                }}
              >
                {linked.length}
              </span>
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 12.5,
                color: c.textSubtle,
                lineHeight: 1.5,
                maxWidth: 560,
              }}
            >
              Portal users for this client will see invoices belonging to these
              billing customer records.
            </div>
          </div>
        </div>
        <Button
          icon={<Link2 size={14} />}
          onClick={() => {
            setPickerOpen(true);
            setSearch("");
          }}
        >
          Link customer
        </Button>
      </div>

      {/* List */}
      <div style={{ marginTop: 14 }}>
        {loading ? (
          <div
            style={{ padding: 14, color: c.textSubtle, fontSize: 13 }}
          >
            Loading…
          </div>
        ) : linked.length === 0 ? (
          <div
            style={{
              padding: "14px 16px",
              background: c.surfaceMuted,
              border: `1px dashed ${c.border}`,
              borderRadius: 10,
              color: c.textSubtle,
              fontSize: 12.5,
              lineHeight: 1.55,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              No billing customers linked yet. Until you link at least one, the
              client&apos;s portal will show an empty invoices page.
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {linked.map((cu) => (
              <div
                key={cu.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "10px 12px",
                  background: c.surfaceMuted,
                  border: `1px solid ${c.border}`,
                  borderRadius: 9,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Building2 size={14} color={c.textSubtle} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: c.text,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cu.company_name}
                    </div>
                    {cu.email && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: c.textSubtle,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cu.email}
                      </div>
                    )}
                  </div>
                </div>
                <Popconfirm
                  title="Unlink this customer?"
                  description="Portal users for this client will stop seeing this customer's invoices."
                  okText="Unlink"
                  onConfirm={() => handleUnlink(cu.id)}
                >
                  <Button
                    size="small"
                    icon={<Unlink size={12} />}
                    style={{ flexShrink: 0 }}
                  >
                    Unlink
                  </Button>
                </Popconfirm>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Picker modal */}
      <Modal
        open={pickerOpen}
        onCancel={() => setPickerOpen(false)}
        footer={null}
        title={null}
        closable={false}
        destroyOnClose
        width={560}
        styles={{
          mask: { backgroundColor: c.overlay },
          content: {
            background: c.surfaceElevated,
            border: `1px solid ${c.border}`,
            padding: 0,
            overflow: "hidden",
          },
          body: { padding: 0 },
        }}
      >
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
            Link a billing customer
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: c.textSubtle,
            }}
          >
            Pick from existing billing customers. Already-linked ones are
            hidden.
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={14} color={c.textFaint} />}
            placeholder="Search by company name or email…"
            style={{ marginBottom: 14 }}
          />
          <div
            style={{
              maxHeight: 360,
              overflowY: "auto",
              border: `1px solid ${c.border}`,
              borderRadius: 10,
            }}
          >
            {searching ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: c.textSubtle,
                  fontSize: 13,
                }}
              >
                Searching…
              </div>
            ) : available.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: c.textSubtle,
                  fontSize: 13,
                }}
              >
                No matching customers.
              </div>
            ) : (
              available.map((cu, i) => {
                const isLinked = cu.client_id === clientId;
                return (
                  <div
                    key={cu.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "10px 12px",
                      borderTop: i === 0 ? "none" : `1px solid ${c.border}`,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: c.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cu.company_name}
                      </div>
                      {cu.email && (
                        <div
                          style={{
                            fontSize: 11.5,
                            color: c.textSubtle,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {cu.email}
                        </div>
                      )}
                    </div>
                    {isLinked ? (
                      <span
                        style={{
                          fontSize: 11.5,
                          fontWeight: 500,
                          padding: "3px 8px",
                          background: c.successBg,
                          border: `1px solid ${c.successBorder}`,
                          color: c.successText,
                          borderRadius: 999,
                        }}
                      >
                        Already linked
                      </span>
                    ) : (
                      <Button
                        size="small"
                        type="primary"
                        icon={<Link2 size={12} />}
                        loading={linkingId === cu.id}
                        onClick={() => handleLink(cu.id)}
                      >
                        Link
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
              paddingTop: 14,
              borderTop: `1px solid ${c.border}`,
            }}
          >
            <Button onClick={() => setPickerOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
