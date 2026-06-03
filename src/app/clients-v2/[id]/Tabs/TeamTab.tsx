"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Switch,
  Tooltip,
} from "antd";
import {
  Plus,
  Users,
  User as UserIcon,
  Mail,
  Phone,
  Star,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Crown,
  Briefcase,
} from "lucide-react";
import {
  teamService,
  TeamMember,
  TeamDiscipline,
  TeamAvailability,
  CreateTeamMemberPayload,
  StaffOption,
} from "@/services/teamService";
import { useTheme } from "@/context/ThemeContext";
import {
  PremiumModal,
  ModalSection,
  ModalFooterActions,
} from "./_PremiumModal";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";

type Mode = "light" | "dark";

const palette = (mode: Mode) => {
  const dark = mode === "dark";
  return {
    surfaceElevated: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    border: dark ? "#1E293B" : "#e5e7eb",
    borderStrong: dark ? "#273449" : "#d1d5db",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#CBD5E1" : "#475569",
    textSubtle: dark ? "#94A3B8" : "#64748b",
    textFaint: dark ? "#64748B" : "#94a3b8",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentBorder: dark ? "rgba(59,130,246,0.35)" : "#bfdbfe",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    successBg: dark ? "rgba(16,185,129,0.12)" : "#ecfdf5",
    successBorder: dark ? "rgba(16,185,129,0.35)" : "#a7f3d0",
    successText: dark ? "#6ee7b7" : "#047857",
    warningBg: dark ? "rgba(245,158,11,0.12)" : "#fffbeb",
    warningBorder: dark ? "rgba(245,158,11,0.35)" : "#fde68a",
    warningText: dark ? "#fcd34d" : "#92400e",
    dangerBg: dark ? "rgba(239,68,68,0.12)" : "#fef2f2",
    dangerBorder: dark ? "rgba(239,68,68,0.35)" : "#fecaca",
    dangerText: dark ? "#fca5a5" : "#b91c1c",
    purpleBg: dark ? "rgba(139,92,246,0.12)" : "#f5f3ff",
    purpleBorder: dark ? "rgba(139,92,246,0.35)" : "#ddd6fe",
    purpleText: dark ? "#c4b5fd" : "#6d28d9",
    pinkBg: dark ? "rgba(236,72,153,0.12)" : "#fdf2f8",
    pinkBorder: dark ? "rgba(236,72,153,0.35)" : "#fbcfe8",
    pinkText: dark ? "#f9a8d4" : "#be185d",
    overlay: dark ? "rgba(0,0,0,0.7)" : "rgba(15,23,42,0.45)",
  };
};

function tonesOf(c: ReturnType<typeof palette>) {
  return {
    accent: { bg: c.accentBg, border: c.accentBorder, text: c.accentText },
    success: { bg: c.successBg, border: c.successBorder, text: c.successText },
    warning: { bg: c.warningBg, border: c.warningBorder, text: c.warningText },
    danger: { bg: c.dangerBg, border: c.dangerBorder, text: c.dangerText },
    purple: { bg: c.purpleBg, border: c.purpleBorder, text: c.purpleText },
    pink: { bg: c.pinkBg, border: c.pinkBorder, text: c.pinkText },
    neutral: {
      bg: c.surfaceMuted,
      border: c.border,
      text: c.textSubtle,
    },
  };
}

const DISCIPLINE_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof tonesOf> }
> = {
  engineering: { label: "Engineering", tone: "accent" },
  design: { label: "Design", tone: "pink" },
  qa: { label: "QA", tone: "purple" },
  pm: { label: "PM", tone: "warning" },
  account: { label: "Account", tone: "success" },
  devops: { label: "DevOps", tone: "accent" },
  data: { label: "Data", tone: "purple" },
  support: { label: "Support", tone: "accent" },
  other: { label: "Other", tone: "neutral" },
};

const AVAILABILITY_META: Record<
  string,
  { label: string; tone: keyof ReturnType<typeof tonesOf>; dot: string }
> = {
  available: { label: "Available", tone: "success", dot: "#10b981" },
  limited: { label: "Limited capacity", tone: "warning", dot: "#f59e0b" },
  away: { label: "Away", tone: "neutral", dot: "#94a3b8" },
  unavailable: { label: "Unavailable", tone: "danger", dot: "#ef4444" },
};

function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* --------------------------------------------------------------- */

interface Props {
  clientId: string;
  projects?: { id: string; name: string; code?: string | null }[];
  onRefresh?: () => void;
}

export default function TeamTab({ clientId, projects = [] }: Props) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);
  const tones = useMemo(() => tonesOf(c), [c]);

  const [items, setItems] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await teamService.listForClient(clientId));
    } catch (err: any) {
      messageApi.error(`Failed to load team: ${err?.message || ""}`);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const toggleVisible = async (m: TeamMember) => {
    try {
      await teamService.update(m.id, { isVisible: !m.isVisible });
      load();
    } catch (err: any) {
      messageApi.error(`Update failed: ${err?.message || ""}`);
    }
  };
  const togglePrimary = async (m: TeamMember) => {
    try {
      await teamService.update(m.id, { isPrimaryContact: !m.isPrimaryContact });
      load();
    } catch (err: any) {
      messageApi.error(`Update failed: ${err?.message || ""}`);
    }
  };
  const remove = async (m: TeamMember) => {
    try {
      await teamService.remove(m.id);
      messageApi.success("Team member removed");
      load();
    } catch (err: any) {
      messageApi.error(`Delete failed: ${err?.message || ""}`);
    }
  };

  return (
    <div style={{ padding: "4px 0 24px", color: c.text }}>
      {contextHolder}

      {/* Header */}
      <div className="team-header-wrap" style={{ margin: "0 -32px" }}>
        <TimeTrackingHeader
          icon={<Users size={20} color="#3b82f6" />}
          title="Team &amp; contacts"
          description="Devs, designers, QA and account managers who build your products."
          extra={
            <Button
              type="primary"
              icon={<Plus size={15} />}
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
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
              Add team member
            </Button>
          }
          style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)" }}
        />
      </div>

      <div style={{ marginTop: 20 }}>
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
      ) : items.length === 0 ? (
        <EmptyState
          c={c}
          onAdd={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {items.map((m) => (
            <TeamCard
              key={m.id}
              member={m}
              c={c}
              tones={tones}
              onEdit={() => {
                setEditing(m);
                setModalOpen(true);
              }}
              onToggleVisible={() => toggleVisible(m)}
              onTogglePrimary={() => togglePrimary(m)}
              onRemove={() => remove(m)}
            />
          ))}
        </div>
      )}
      </div>

      <TeamMemberModal
        open={modalOpen}
        editing={editing}
        clientId={clientId}
        projects={projects}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={() => {
          setModalOpen(false);
          setEditing(null);
          load();
        }}
        c={c}
        messageApi={messageApi}
      />

      {/* Premium adaptive header styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Full bleed header styling flush with vertical sidebar border */
        .team-header-wrap {
          margin-bottom: 24px !important;
          display: block !important;
        }
        .team-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 10px !important;
          padding-bottom: 12px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .team-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .team-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        /* Force header elements to stay on the exact same line, overriding TimeTrackingHeader media query */
        @media (max-width: 1200px) {
          html body .team-header-wrap .saas-header-container .saas-header-row {
            flex-wrap: nowrap !important;
          }
          html body .team-header-wrap .saas-header-container .saas-header-left-col {
            width: auto !important;
            flex: 1 1 auto !important;
            min-width: 0 !important;
          }
          html body .team-header-wrap .saas-header-container .saas-header-extra-col {
            width: auto !important;
            flex: 0 0 auto !important;
            margin-top: 0 !important;
          }
          html body .team-header-wrap .saas-header-container .saas-header-left-group {
            flex-direction: row !important;
            align-items: center !important;
            gap: 16px !important;
          }
          html body .team-header-wrap .saas-header-container .bh-header-divider {
            display: inline-block !important;
          }
        }
      `}} />
    </div>
  );
}

/* --------------------------------------------------------------- */

function EmptyState({
  c,
  onAdd,
}: {
  c: ReturnType<typeof palette>;
  onAdd: () => void;
}) {
  return (
    <div
      style={{
        padding: 56,
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
          marginBottom: 14,
        }}
      >
        <Users size={22} />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
        No team members visible to this client yet
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 13,
          color: c.textSubtle,
          maxWidth: 480,
          margin: "6px auto 0",
        }}
      >
        Add the account manager and key people so the client knows who to
        contact for what.
      </div>
      <div style={{ marginTop: 18 }}>
        <Button type="primary" icon={<Plus size={15} />} onClick={onAdd}>
          Add first team member
        </Button>
      </div>
    </div>
  );
}

function TeamCard({
  member,
  c,
  tones,
  onEdit,
  onToggleVisible,
  onTogglePrimary,
  onRemove,
}: {
  member: TeamMember;
  c: ReturnType<typeof palette>;
  tones: ReturnType<typeof tonesOf>;
  onEdit: () => void;
  onToggleVisible: () => void;
  onTogglePrimary: () => void;
  onRemove: () => void;
}) {
  const [hover, setHover] = useState(false);
  const disc = member.discipline ? DISCIPLINE_META[member.discipline] : null;
  const avail = AVAILABILITY_META[member.availabilityStatus] || AVAILABILITY_META.available;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: c.surfaceElevated,
        border: `1px solid ${hover ? c.borderStrong : c.border}`,
        borderRadius: 16,
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: member.isVisible ? 1 : 0.65,
        transform: hover ? "translateY(-3px)" : "none",
        boxShadow: hover ? "0 12px 24px -8px rgba(0,0,0,0.15)" : "0 2px 8px -2px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Avatar member={member} c={c} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 15.5,
                fontWeight: 600,
                color: c.text,
                letterSpacing: "-0.01em",
              }}
            >
              {member.displayName}
            </div>
            {member.isPrimaryContact && (
              <Tooltip title="Primary contact for this client">
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "2px 8px",
                    background: "rgba(250, 204, 21, 0.08)",
                    border: `1px solid rgba(250, 204, 21, 0.3)`,
                    color: "#facc15",
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                  }}
                >
                  <Crown size={10} strokeWidth={2.5} />
                  Primary
                </span>
              </Tooltip>
            )}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 13,
              color: c.textMuted,
              fontWeight: 400,
            }}
          >
            {member.roleLabel}
          </div>
          {disc && (
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 10px",
                  background: tones[disc.tone].bg,
                  border: `1px solid ${tones[disc.tone].border}`,
                  color: tones[disc.tone].text,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {disc.label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          fontSize: 13,
          color: c.textMuted,
          marginTop: 2,
        }}
      >
        {member.contactEmail && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={13} color={c.textFaint} />
            <span
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: c.text,
              }}
            >
              {member.contactEmail}
            </span>
          </div>
        )}
        {member.contactPhone && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={13} color={c.textFaint} />
            <span style={{ color: c.text }}>{member.contactPhone}</span>
          </div>
        )}
        {member.projectName && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Briefcase size={13} color={c.textFaint} />
            <span style={{ color: c.text }}>{member.projectName}</span>
          </div>
        )}
      </div>

      {member.bio && (
        <div
          style={{
            fontSize: 12.5,
            color: c.textSubtle,
            lineHeight: 1.6,
            padding: "10px 14px",
            background: "rgba(0,0,0,0.15)",
            border: `1px solid ${c.border}`,
            borderRadius: 10,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            boxShadow: "inset 0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          {member.bio}
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 16,
          borderTop: `1px solid ${c.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: tones[avail.tone].text,
            fontWeight: 600,
            letterSpacing: "0.01em",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: avail.dot,
              display: "inline-block",
              boxShadow: `0 0 0 2px ${tones[avail.tone].bg}`,
            }}
          />
          {avail.label}
          {member.availabilityNote && (
            <span style={{ color: c.textFaint, fontWeight: 400 }}>
              · {member.availabilityNote}
            </span>
          )}
        </span>
        <div style={{ display: "flex", gap: 2 }}>
          <Tooltip
            title={
              member.isVisible
                ? "Visible to client"
                : "Hidden from client portal"
            }
          >
            <Button
              size="small"
              type="text"
              icon={
                member.isVisible ? (
                  <Eye size={14} color={c.textSubtle} />
                ) : (
                  <EyeOff size={14} color={c.dangerText} />
                )
              }
              onClick={onToggleVisible}
              style={{ padding: "0 6px" }}
            />
          </Tooltip>
          <Tooltip
            title={
              member.isPrimaryContact
                ? "Remove primary-contact flag"
                : "Mark as primary contact"
            }
          >
            <Button
              size="small"
              type="text"
              icon={
                member.isPrimaryContact ? (
                  <Star size={14} color="#facc15" fill="#facc15" />
                ) : (
                  <Star size={14} color={c.textSubtle} />
                )
              }
              onClick={onTogglePrimary}
              style={{ padding: "0 6px" }}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              type="text"
              icon={<Edit3 size={14} color={c.textSubtle} />}
              onClick={onEdit}
              style={{ padding: "0 6px" }}
            />
          </Tooltip>
          <Popconfirm
            title="Remove team member?"
            description="They'll disappear from the client portal immediately."
            onConfirm={onRemove}
            okText="Remove"
            okButtonProps={{ danger: true }}
          >
            <Button
              size="small"
              type="text"
              icon={<Trash2 size={14} color={c.textSubtle} />}
              style={{ padding: "0 6px" }}
            />
          </Popconfirm>
        </div>
      </div>
    </div>
  );
}

function Avatar({
  member,
  c,
  size = 44,
}: {
  member: { displayName: string; avatarUrl: string | null };
  c: ReturnType<typeof palette>;
  size?: number;
}) {
  if (member.avatarUrl) {
    return (
      <img
        src={member.avatarUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: size / 4,
          objectFit: "cover",
          border: `1px solid ${c.border}`,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: c.accentBg,
        border: `1px solid ${c.accentBorder}`,
        color: c.accentText,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(size * 0.32),
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials(member.displayName)}
    </div>
  );
}

/* --------------------------------------------------------------- */

function TeamMemberModal({
  open,
  editing,
  clientId,
  projects,
  onClose,
  onSaved,
  c,
  messageApi,
}: {
  open: boolean;
  editing: TeamMember | null;
  clientId: string;
  projects: { id: string; name: string; code?: string | null }[];
  onClose: () => void;
  onSaved: () => void;
  c: ReturnType<typeof palette>;
  messageApi: any;
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [staffSearch, setStaffSearch] = useState("");

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setStaffSearch("");
      return;
    }
    if (editing) {
      form.setFieldsValue({
        staffUserId: editing.staffUserId || undefined,
        displayName: editing.displayName,
        roleLabel: editing.roleLabel,
        discipline: editing.discipline || undefined,
        contactEmail: editing.contactEmailOverride || undefined,
        contactPhone: editing.contactPhone || undefined,
        isPrimaryContact: editing.isPrimaryContact,
        bio: editing.bio || undefined,
        availabilityStatus: editing.availabilityStatus,
        availabilityNote: editing.availabilityNote || undefined,
        isVisible: editing.isVisible,
        projectId: editing.projectId || undefined,
      });
    } else {
      form.setFieldsValue({
        availabilityStatus: "available",
        isPrimaryContact: false,
        isVisible: true,
      });
    }
    // Load staff list
    teamService
      .staffOptions(clientId, "")
      .then((list) => setStaffOptions(list || []))
      .catch(() => setStaffOptions([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  // Search debounce
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      teamService
        .staffOptions(clientId, staffSearch)
        .then((list) => setStaffOptions(list || []))
        .catch(() => undefined);
    }, 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffSearch]);

  const handleStaffPick = (id: string | undefined) => {
    if (!id) return;
    const picked = staffOptions.find((s) => s.id === id);
    if (!picked) return;
    const cur = form.getFieldsValue();
    const next: any = {};
    if (!cur.displayName) next.displayName = picked.name;
    if (!cur.contactEmail) next.contactEmail = picked.work_email || undefined;
    if (picked.title) next.roleLabel = picked.title;
    if (Object.keys(next).length) form.setFieldsValue(next);
  };

  const submit = async (v: any) => {
    setSubmitting(true);
    try {
      const payload: CreateTeamMemberPayload = {
        staffUserId: v.staffUserId || undefined,
        displayName: v.displayName?.trim() || undefined,
        roleLabel: v.roleLabel.trim(),
        discipline: v.discipline || undefined,
        contactEmail: v.contactEmail || undefined,
        contactPhone: v.contactPhone || undefined,
        isPrimaryContact: v.isPrimaryContact === true,
        bio: v.bio || undefined,
        availabilityStatus: v.availabilityStatus || "available",
        availabilityNote: v.availabilityNote || undefined,
        isVisible: v.isVisible !== false,
        projectId: v.projectId || undefined,
      };
      if (editing) {
        await teamService.update(editing.id, payload);
        messageApi.success("Saved");
      } else {
        await teamService.create(clientId, payload);
        messageApi.success("Team member added");
      }
      onSaved();
    } catch (err: any) {
      messageApi.error(`Save failed: ${err?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PremiumModal
      open={open}
      onClose={onClose}
      width={700}
      c={c}
      ribbonColor={c.accentText}
      iconTile={{ bg: c.accentBg, border: c.accentBorder, text: c.accentText }}
      icon={<UserIcon size={20} />}
      title={editing ? "Edit team member" : "Add team member"}
      subtitle="Pick a staff member to auto-fill basics, or add an external/free-text entry without linking."
      tip={
        <span>
          <Crown
            size={11}
            style={{ verticalAlign: -1, marginRight: 5, color: c.warningText }}
          />
          Marking someone as <strong>Primary contact</strong> pins them to the
          top of the portal team page with a highlighted badge.
        </span>
      }
      footer={
        <ModalFooterActions c={c} kbdHint="⌘ ↵ to save">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            onClick={() => form.submit()}
            icon={<UserIcon size={14} />}
          >
            {editing ? "Save changes" : "Add team member"}
          </Button>
        </ModalFooterActions>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} requiredMark={false}>
        <ModalSection
          c={c}
          title="Who"
          description="Auto-fill name + email from a staff user, or type them in manually."
          icon={<UserIcon size={11} />}
          plain
        >
          <Form.Item
            name="staffUserId"
            label={
              <L c={c}>
                Link to staff member
              </L>
            }
            style={{ marginBottom: 12 }}
          >
            <Select
              allowClear
              showSearch
              placeholder="Search staff by name or email…"
              filterOption={false}
              onSearch={setStaffSearch}
              onChange={handleStaffPick}
              optionLabelProp="labelText"
              options={staffOptions.map((s) => ({
                value: s.id,
                labelText: s.name,
                label: <StaffOptionRow option={s} c={c} />,
              }))}
            />
          </Form.Item>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 10,
            }}
          >
            <Form.Item
              name="displayName"
              label={<L c={c}>Display name</L>}
              rules={[{ required: true, message: "Required" }]}
              style={{ marginBottom: 12 }}
            >
              <Input
                prefix={<UserIcon size={13} color={c.textFaint} />}
                placeholder="Name shown to client"
                maxLength={200}
              />
            </Form.Item>
            <Form.Item
              name="discipline"
              label={<L c={c}>Discipline</L>}
              style={{ marginBottom: 12 }}
            >
              <Select
                allowClear
                placeholder="—"
                options={(Object.keys(DISCIPLINE_META) as TeamDiscipline[]).map(
                  (d) => ({ value: d, label: DISCIPLINE_META[d].label }),
                )}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="roleLabel"
            label={<L c={c}>Role / title</L>}
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="e.g. Senior Engineer · Frontend"
              maxLength={160}
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Contact & context"
          description="How the client can reach them, and what they're working on."
          icon={<Mail size={11} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Form.Item
              name="contactEmail"
              label={<L c={c} >Email</L>}
              style={{ marginBottom: 0 }}
            >
              <Input
                prefix={<Mail size={13} color={c.textFaint} />}
                placeholder="custom@email.com"
              />
            </Form.Item>
            <Form.Item
              name="contactPhone"
              label={<L c={c}>Phone</L>}
              style={{ marginBottom: 0 }}
            >
              <Input
                prefix={<Phone size={13} color={c.textFaint} />}
                placeholder="+1 555 …"
              />
            </Form.Item>
          </div>

          <Form.Item
            name="projectId"
            label={
              <L c={c} >
                Linked project
              </L>
            }
            style={{ marginBottom: 12 }}
          >
            <Select
              allowClear
              placeholder={
                projects.length
                  ? "Pick a project this member works on"
                  : "No projects linked to this client yet"
              }
              disabled={projects.length === 0}
              suffixIcon={<Briefcase size={13} color={c.textFaint} />}
              optionLabelProp="labelText"
              options={projects.map((p) => ({
                value: p.id,
                labelText: p.code ? `${p.name} · ${p.code}` : p.name,
                label: (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      minWidth: 0,
                    }}
                  >
                    <Briefcase size={12} color={c.textFaint} />
                    <span
                      style={{
                        color: c.text,
                        fontWeight: 500,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </span>
                    {p.code && (
                      <span
                        style={{
                          fontSize: 11,
                          color: c.textSubtle,
                          padding: "1px 6px",
                          background: c.surfaceMuted,
                          border: `1px solid ${c.border}`,
                          borderRadius: 4,
                          fontFamily:
                            "ui-monospace, SFMono-Regular, Menlo, monospace",
                        }}
                      >
                        {p.code}
                      </span>
                    )}
                  </span>
                ),
              }))}
            />
          </Form.Item>

          <Form.Item
            name="bio"
            label={<L c={c}>Short bio</L>}
            style={{ marginBottom: 16 }}
          >
            <Input.TextArea
              rows={3}
              placeholder="What they specialise in, years at the company, etc."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </ModalSection>

        <ModalSection
          c={c}
          title="Availability & visibility"
          description="The portal page shows availability dots — set yours here."
          icon={<Eye size={11} />}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.6fr",
              gap: 10,
              marginBottom: 12,
            }}
          >
            <Form.Item
              name="availabilityStatus"
              label={<L c={c}>Status</L>}
              style={{ marginBottom: 0 }}
            >
              <Select
                options={(
                  Object.keys(AVAILABILITY_META) as TeamAvailability[]
                ).map((a) => ({
                  value: a,
                  label: AVAILABILITY_META[a].label,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="availabilityNote"
              label={<L c={c}>Note</L>}
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="e.g. Out until 15 Mar · OOO Fridays" />
            </Form.Item>
          </div>

          <div
            style={{
              display: "flex",
              gap: 24,
              padding: "10px 12px",
              background: c.surfaceElevated,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
            }}
          >
            <Form.Item
              name="isPrimaryContact"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
              label={
                <span
                  style={{
                    fontSize: 12.5,
                    color: c.textMuted,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Crown size={11} color={c.warningText} />
                  Primary contact
                </span>
              }
            >
              <Switch />
            </Form.Item>
            <Form.Item
              name="isVisible"
              valuePropName="checked"
              style={{ marginBottom: 0 }}
              label={
                <span
                  style={{
                    fontSize: 12.5,
                    color: c.textMuted,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Eye size={11} color={c.successText} />
                  Visible to client
                </span>
              }
            >
              <Switch />
            </Form.Item>
          </div>
        </ModalSection>
      </Form>
    </PremiumModal>
  );
}

function L({
  c,
  children,
  hint,
}: {
  c: ReturnType<typeof palette>;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <span style={{ fontSize: 12.5, color: c.textMuted, fontWeight: 500 }}>
      {children}
      {hint && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 11.5,
            color: c.textFaint,
            fontWeight: 400,
          }}
        >
          · {hint}
        </span>
      )}
    </span>
  );
}

function StaffOptionRow({
  option,
  c,
}: {
  option: StaffOption;
  c: ReturnType<typeof palette>;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "2px 0",
        minWidth: 0,
      }}
    >
      {option.avatar_url ? (
        <img
          src={option.avatar_url}
          alt=""
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            objectFit: "cover",
            border: `1px solid ${c.border}`,
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: c.accentBg,
            color: c.accentText,
            border: `1px solid ${c.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {initials(option.name)}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1, lineHeight: 1.25 }}>
        <div
          style={{
            fontSize: 13,
            color: c.text,
            fontWeight: 500,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {option.name}
          {option.title && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 11,
                color: c.textSubtle,
                fontWeight: 400,
              }}
            >
              · {option.title}
            </span>
          )}
        </div>
        {option.work_email && (
          <div
            style={{
              fontSize: 11.5,
              color: c.textFaint,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {option.work_email}
          </div>
        )}
      </div>
    </div>
  );
}
