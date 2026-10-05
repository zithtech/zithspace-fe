"use client";

/**
 * Shared portal UI primitives:
 *   PortalStatsCard  — tonal stat tile
 *   PortalFilterBar  — pill-button filter row with optional counts
 *   PortalViewToggle — list / card toggle
 */

import React from "react";
import { LayoutGrid, List } from "lucide-react";

/* ── Palette ────────────────────────────────────────────────────────────── */

export const PORTAL_PALETTE = {
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e2e8f0",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#6366f1",
  accentBg: "#e0e7ff",
  accentBorder: "#c7d2fe",
  accentText: "#4338ca",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#b45309",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  neutralBg: "#f8fafc",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

export type PortalTone = "accent" | "success" | "warning" | "danger" | "neutral";

export const PORTAL_TONES: Record<PortalTone, { bg: string; border: string; text: string }> = {
  accent:  { bg: PORTAL_PALETTE.accentBg,  border: PORTAL_PALETTE.accentBorder,  text: PORTAL_PALETTE.accentText  },
  success: { bg: PORTAL_PALETTE.successBg, border: PORTAL_PALETTE.successBorder, text: PORTAL_PALETTE.successText },
  warning: { bg: PORTAL_PALETTE.warningBg, border: PORTAL_PALETTE.warningBorder, text: PORTAL_PALETTE.warningText },
  danger:  { bg: PORTAL_PALETTE.dangerBg,  border: PORTAL_PALETTE.dangerBorder,  text: PORTAL_PALETTE.dangerText  },
  neutral: { bg: PORTAL_PALETTE.neutralBg, border: PORTAL_PALETTE.neutralBorder, text: PORTAL_PALETTE.neutralText },
};

/* ── PortalStatsCard ────────────────────────────────────────────────────── */

export interface PortalStatsCardProps {
  label: string;
  value: number | string;
  tone?: PortalTone;
  icon?: React.ElementType;
  onClick?: () => void;
  active?: boolean;
}

export function PortalStatsCard({ label, value, tone = "neutral", icon: Icon, onClick, active }: PortalStatsCardProps) {
  const t = PORTAL_TONES[tone];
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      style={{
        flex: "1 1 120px",
        minWidth: 0,
        padding: "12px 14px",
        borderRadius: 12,
        background: t.bg,
        border: `1.5px solid ${active ? t.text : t.border}`,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color .15s, box-shadow .15s",
        boxShadow: active ? `0 0 0 3px ${t.bg}` : "none",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 22, fontWeight: 800, color: t.text, lineHeight: 1.1 }}>
        {Icon && <Icon size={16} style={{ opacity: 0.7 }} />}
        {value}
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: t.text, opacity: 0.75, marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

/* ── PortalFilterBar ────────────────────────────────────────────────────── */

export interface PortalFilterOption {
  key: string;
  label: string;
  count?: number;
}

export interface PortalFilterBarProps {
  options: PortalFilterOption[];
  active: string;
  onChange: (key: string) => void;
}

export function PortalFilterBar({ options, active, onChange }: PortalFilterBarProps) {
  const pal = PORTAL_PALETTE;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map((opt) => {
        const on = active === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            style={{
              height: 32,
              padding: "0 12px",
              borderRadius: 9,
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: 600,
              background: on ? pal.accentBg : pal.surface,
              border: `1px solid ${on ? pal.accentBorder : pal.border}`,
              color: on ? pal.accentText : pal.textMuted,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              transition: "background .12s, border-color .12s, color .12s",
            }}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span style={{
                background: on ? "rgba(255,255,255,0.3)" : pal.border,
                color: on ? pal.accentText : pal.textSubtle,
                padding: "2px 6px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                lineHeight: 1.3,
              }}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ── PortalViewToggle ───────────────────────────────────────────────────── */

export type PortalViewMode = "list" | "card";

export interface PortalViewToggleProps {
  value: PortalViewMode;
  onChange: (v: PortalViewMode) => void;
}

export function PortalViewToggle({ value, onChange }: PortalViewToggleProps) {
  const pal = PORTAL_PALETTE;
  const Btn = ({ mode, Icon, label }: { mode: PortalViewMode; Icon: React.ElementType; label: string }) => {
    const on = value === mode;
    return (
      <button
        type="button"
        onClick={() => onChange(mode)}
        aria-label={label}
        title={label}
        style={{
          width: 34, height: 34,
          display: "grid", placeItems: "center",
          border: "none", borderRadius: 0,
          background: on ? pal.accentBg : "transparent",
          color: on ? pal.accentText : pal.textMuted,
          cursor: "pointer",
          transition: "background .12s, color .12s",
        }}
      >
        <Icon size={15} />
      </button>
    );
  };

  return (
    <div style={{ display: "inline-flex", border: `1px solid ${pal.border}`, borderRadius: 9, overflow: "hidden" }}>
      <Btn mode="list" Icon={List} label="Table view" />
      <div style={{ width: 1, background: pal.border }} />
      <Btn mode="card" Icon={LayoutGrid} label="Card view" />
    </div>
  );
}
