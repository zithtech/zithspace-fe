"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React, { useEffect, useMemo, useState } from "react";
import { Switch, message } from "antd";
import {
  Receipt,
  ClipboardList,
  FileText,
  CalendarCheck,
  Flag,
  GitPullRequest,
  CheckSquare,
  LifeBuoy,
  Rocket,
  Server,
  Users,
  Settings2,
  Eye,
  EyeOff,
  LucideIcon
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import {

  ClientV2Service,
  PortalModuleSetting
} from "@/services/clientV2Service";

type Mode = "light" | "dark";

/** Icon + helper copy per portal module key (matches backend PORTAL_MODULES). */
const META: Record<string, { icon: LucideIcon; desc: string }> = {
  invoices: { icon: Receipt, desc: "View invoices and upload payment proofs." },
  mom: { icon: ClipboardList, desc: "Read minutes of meeting and action items." },
  documents: { icon: FileText, desc: "Access shared documents and files." },
  sprints: { icon: CalendarCheck, desc: "Track sprint progress and velocity." },
  milestones: { icon: Flag, desc: "Follow delivery milestones." },
  "change-requests": {
    icon: GitPullRequest,
    desc: "Raise and review scope change requests."
  },
  approvals: { icon: CheckSquare, desc: "Review and approve pending items." },
  tickets: { icon: LifeBuoy, desc: "Raise and follow support tickets." },
  releases: { icon: Rocket, desc: "See release notes and deployments." },
  environments: { icon: Server, desc: "View environments and deployment status." },
  team: { icon: Users, desc: "See the assigned delivery team." }
};

const palette = (mode: Mode) => {
  const dark = mode === "dark";
  return {
    surface: dark ? "#131B2D" : "#ffffff",
    surfaceMuted: dark ? "#0F1626" : "#f8fafc",
    border: dark ? "#1E293B" : "#e5e7eb",
    text: dark ? "#F1F5F9" : "#0f172a",
    textMuted: dark ? "#94A3B8" : "#64748b",
    accentBg: dark ? "rgba(59,130,246,0.12)" : "#eff6ff",
    accentText: dark ? "#93c5fd" : "#1d4ed8",
    iconBg: dark ? "#1B2740" : "#f1f5f9",
    iconColor: dark ? "#CBD5E1" : "#475569"
  };
};

export default function PortalModulesTab({ clientId }: { clientId: string }) {
  const { theme } = useTheme();
  const c = useMemo(() => palette(theme as Mode), [theme]);

  const [modules, setModules] = useState<PortalModuleSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await ClientV2Service.getPortalModules(clientId);
      setModules(data);
    } catch (err: any) {
      message.error(err?.message || "Failed to load portal settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const toggle = async (key: string, next: boolean) => {
    const prev = modules;
    // optimistic
    setModules((ms) => ms.map((m) => (m.key === key ? { ...m, enabled: next } : m)));
    setSavingKey(key);
    try {
      const data = await ClientV2Service.updatePortalModules(clientId, {
        [key]: next
      });
      setModules(data);
    } catch (err: any) {
      setModules(prev); // revert
      message.error(err?.message || "Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  };

  const enabledCount = modules.filter((m) => m.enabled).length;

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <LoadingSpinner fullScreen={false} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 20 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: c.accentBg,
            color: c.accentText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Settings2 size={19} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
            Portal pages
          </div>
          <div style={{ fontSize: 13, color: c.textMuted, marginTop: 2 }}>
            Choose which pages this client can see when they sign in to the
            portal. Disabled pages are hidden from their navigation. The Home
            dashboard is always visible.
          </div>
        </div>
      </div>

      {/* Summary pill */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          fontWeight: 600,
          color: c.textMuted,
          background: c.surfaceMuted,
          border: `1px solid ${c.border}`,
          borderRadius: 8,
          padding: "5px 10px",
          marginBottom: 16
        }}
      >
        <Eye size={13} />
        {enabledCount} of {modules.length} pages enabled
      </div>

      {/* Module rows */}
      <div
        style={{
          border: `1px solid ${c.border}`,
          borderRadius: 12,
          overflow: "hidden",
          background: c.surface
        }}
      >
        {modules.map((m, i) => {
          const meta = META[m.key];
          const Icon = meta?.icon || FileText;
          return (
            <div
              key={m.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderTop: i === 0 ? "none" : `1px solid ${c.border}`,
                opacity: m.enabled ? 1 : 0.72
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: c.iconBg,
                  color: c.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <Icon size={17} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: c.text,
                    display: "flex",
                    alignItems: "center",
                    gap: 8
                  }}
                >
                  {m.label}
                  {!m.enabled && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        color: c.textMuted
                      }}
                    >
                      <EyeOff size={11} /> Hidden
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: c.textMuted, marginTop: 1 }}>
                  {meta?.desc || ""}
                </div>
              </div>
              <Switch
                checked={m.enabled}
                loading={savingKey === m.key}
                onChange={(v) => toggle(m.key, v)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
