// Shared palette + helpers for the portal Tickets module. Mirrors the
// borders-only / no-shadow style used elsewhere in the portal.

import {
  AlertTriangle,
  Bug,
  Sparkles,
  LifeBuoy,
  Server,
  Lock,
  HelpCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  Eye,
  XCircle,
  PauseCircle,
} from "lucide-react";

export const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

export const TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  purple: { bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
};

export const CATEGORY_META: Record<
  string,
  { label: string; icon: any; tone: keyof typeof TONE }
> = {
  bug: { label: "Bug", icon: Bug, tone: "danger" },
  enhancement: { label: "Enhancement", icon: Sparkles, tone: "purple" },
  support: { label: "Support", icon: LifeBuoy, tone: "accent" },
  infra: { label: "Infra issue", icon: Server, tone: "warning" },
  access: { label: "Access request", icon: Lock, tone: "neutral" },
  other: { label: "Other", icon: HelpCircle, tone: "neutral" },
};

export const PRIORITY_META: Record<
  string,
  { label: string; tone: keyof typeof TONE }
> = {
  critical: { label: "Critical", tone: "danger" },
  high: { label: "High", tone: "warning" },
  medium: { label: "Medium", tone: "accent" },
  low: { label: "Low", tone: "neutral" },
};

export const STATUS_META: Record<
  string,
  { label: string; tone: keyof typeof TONE; icon: any }
> = {
  new: { label: "New", tone: "accent", icon: Clock },
  in_review: { label: "In review", tone: "purple", icon: Eye },
  in_progress: { label: "In progress", tone: "accent", icon: PlayCircle },
  waiting_on_client: {
    label: "Waiting on you",
    tone: "warning",
    icon: PauseCircle,
  },
  resolved: { label: "Resolved", tone: "success", icon: CheckCircle2 },
  closed: { label: "Closed", tone: "neutral", icon: XCircle },
};

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(iso);
  }
}

export function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}

export { AlertTriangle };
