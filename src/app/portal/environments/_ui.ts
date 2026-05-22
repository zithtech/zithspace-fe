import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CircleDot,
  History,
} from "lucide-react";

export const p = {
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
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
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

export const KIND_META: Record<string, { label: string; tone: keyof typeof TONE }> = {
  production: { label: "Production", tone: "danger" },
  staging: { label: "Staging", tone: "warning" },
  uat: { label: "UAT", tone: "accent" },
  qa: { label: "QA", tone: "purple" },
  dev: { label: "Dev", tone: "neutral" },
  demo: { label: "Demo", tone: "neutral" },
  preview: { label: "Preview", tone: "neutral" },
  other: { label: "Other", tone: "neutral" },
};

export const STATUS_META: Record<
  string,
  { label: string; tone: keyof typeof TONE; icon: any }
> = {
  operational: { label: "Operational", tone: "success", icon: CheckCircle2 },
  degraded: { label: "Degraded", tone: "warning", icon: AlertTriangle },
  down: { label: "Down", tone: "danger", icon: XCircle },
  maintenance: { label: "Maintenance", tone: "accent", icon: CircleDot },
  unknown: { label: "Unknown", tone: "neutral", icon: CircleDot },
};

export const DEPLOY_STATUS_META: Record<
  string,
  { label: string; tone: keyof typeof TONE; icon: any }
> = {
  success: { label: "Success", tone: "success", icon: CheckCircle2 },
  failed: { label: "Failed", tone: "danger", icon: XCircle },
  rolled_back: { label: "Rolled back", tone: "warning", icon: History },
  in_progress: { label: "In progress", tone: "accent", icon: CircleDot },
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
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
}
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
export function fmtDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h${m ? ` ${m}m` : ""}`;
}
