"use client";

import { SectionCard, drawerFormStyles } from "@/components/common/DrawerSection";
import TestCaseDetailsPanel from "./TestCaseDetailsPanel";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Drawer, Select, Tooltip, message, App, ConfigProvider, theme as antdTheme, notification, Form, Input, Button, Tag, Typography } from "antd";
import { BugOutlined, LoadingOutlined, AppstoreOutlined, PaperClipOutlined, InfoCircleOutlined, TeamOutlined } from "@ant-design/icons";

import {
  X,
  UploadCloud,
  Paperclip,
  Link2,
  Trash2,
  Plus,
  Sparkles,
  ImageIcon,
  ExternalLink,
  Type as TypeIcon,
  Layers,
  Hash,
  AlertOctagon,
  UserPlus,
  Loader2,
  Wand2,
  Play,
  FileText,
  Eye,
  Download,
  Edit2,
  Check,
} from "lucide-react";
import TiptapEditor from "@/components/common/TiptapEditor";
import { useAuth } from '@/context/AuthContext';

const { Text } = Typography;
import { useProjectMembers } from "@/hooks/useGlobalData";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { NO_MODULES_STYLES, NoModulesEmpty } from "@/components/qa/ModuleSettingsSection";
import { useTheme } from "@/context/ThemeContext";
import BugListService, {
  BugAttachment,
  BugExternalLink,
  BugListItem,
  CreateBugInput,
  UpdateBugInput,
} from "@/services/bugListService";
import {
  useBugSeverityOptions,
  useBugListTypeOptions,
} from "@/hooks/useBugList";

const MAX_FILE_MB = 5;

const formatBytes = (bytes?: number) => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Chrome for the capture drawer. Scoped to `.hbcap` (the drawer's rootClassName)
 * so nothing here leaks into the other drawers that share SectionCard.
 */
const captureDrawerStyles = `
.hbcap {
  --cap-bg: #0B0F1A;
  --cap-elev: #10151F;
  --cap-soft: #141A26;
  --cap-hover: #1A2231;
  --cap-border: #1F2937;
  --cap-border-strong: #2C3849;
  --cap-text: #F1F5F9;
  --cap-text-soft: #94A3B8;
  --cap-text-muted: #64748B;
  --cap-accent: #3B82F6;
  --cap-accent-soft: rgba(59,130,246,0.14);
  --cap-accent-border: rgba(59,130,246,0.38);
  --cap-success: #10B981;
  --cap-success-soft: rgba(16,185,129,0.14);
  --cap-danger: #EF4444;
  --cap-shadow: 0 20px 44px rgba(4,8,16,0.45);
}
.hbcap.hbcap-light {
  --cap-bg: #FFFFFF;
  --cap-elev: #FFFFFF;
  --cap-soft: #F8FAFC;
  --cap-hover: #F1F5F9;
  --cap-border: #E5E7EB;
  --cap-border-strong: #CBD5E1;
  --cap-text: #0F172A;
  --cap-text-soft: #475569;
  --cap-text-muted: #94A3B8;
  --cap-accent: #2563EB;
  --cap-accent-soft: rgba(37,99,235,0.09);
  --cap-accent-border: rgba(37,99,235,0.30);
  --cap-success-soft: rgba(16,185,129,0.10);
  --cap-shadow: 0 18px 38px rgba(15,23,42,0.12);
}

.hbcap .ant-drawer-content,
.hbcap .ant-drawer-body { background: var(--cap-bg) !important; }
.hbcap .ant-drawer-body {
  padding: 0 !important;
  overflow: hidden !important;
  display: flex; flex-direction: column;
}
.hbcap .ant-drawer-mask { backdrop-filter: blur(6px); }

.hbcap-shell {
  position: relative;
  flex: 1; min-height: 0;
  display: flex; flex-direction: column;
  color: var(--cap-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  letter-spacing: -0.01em;
}

/* ── Header ── */
.hbcap-head {
  position: relative;
  flex-shrink: 0;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--cap-border);
  overflow: hidden;
}
.hbcap-head-glow {
  position: absolute; inset: 0;
  background:
    radial-gradient(70% 130% at 92% -20%, rgba(59,130,246,0.22) 0%, transparent 62%),
    radial-gradient(50% 120% at 2% 120%, rgba(16,185,129,0.12) 0%, transparent 62%);
  pointer-events: none;
}
.hbcap-light .hbcap-head-glow { opacity: 0.5; }
.hbcap-head-row {
  position: relative;
  display: flex; align-items: center; gap: 12px;
}
.hbcap-mark {
  width: 38px; height: 38px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 11px;
  background: linear-gradient(135deg, var(--cap-accent), #6366F1);
  color: #FFFFFF;
  box-shadow: 0 8px 20px rgba(37,99,235,0.34), inset 0 0 0 1px rgba(255,255,255,0.18);
}
.hbcap-head-text { flex: 1; min-width: 0; }
.hbcap-eyebrow {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px;
  margin-bottom: 4px;
  border-radius: 999px;
  background: var(--cap-accent-soft);
  border: 1px solid var(--cap-accent-border);
  color: var(--cap-accent);
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.14em; text-transform: uppercase;
}
.hbcap-title {
  font-size: 16px; font-weight: 650; line-height: 1.2;
  color: var(--cap-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hbcap-sub {
  margin-top: 2px;
  font-size: 11.5px; color: var(--cap-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hbcap-head-actions {
  position: relative;
  display: inline-flex; align-items: center; gap: 6px;
  flex-shrink: 0;
}
.hbcap-iconbtn {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: transparent;
  border: 1px solid var(--cap-border);
  color: var(--cap-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.hbcap-iconbtn:hover {
  background: var(--cap-hover); color: var(--cap-text);
  border-color: var(--cap-border-strong);
}

/* Readiness meter */
.hbcap-ready {
  position: relative;
  display: flex; align-items: center; gap: 10px;
  margin-top: 12px;
}
.hbcap-checks { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hbcap-check {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px 3px 6px;
  border-radius: 999px;
  border: 1px solid var(--cap-border);
  background: var(--cap-soft);
  color: var(--cap-text-muted);
  font-size: 10.5px; font-weight: 600;
  white-space: nowrap;
  transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
}
.hbcap-check-dot {
  width: 14px; height: 14px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--cap-border-strong);
  color: transparent;
}
.hbcap-check.is-done {
  border-color: color-mix(in oklab, var(--cap-success) 38%, transparent);
  background: var(--cap-success-soft);
  color: var(--cap-success);
}
.hbcap-check.is-done .hbcap-check-dot {
  background: var(--cap-success); border-color: var(--cap-success); color: #FFFFFF;
}
.hbcap-ready-meter {
  flex: 1; min-width: 60px;
  height: 4px; border-radius: 999px;
  background: var(--cap-border);
  overflow: hidden;
}
.hbcap-ready-fill {
  display: block; height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, rgba(59,130,246,0.65), var(--cap-accent));
  transition: width 260ms cubic-bezier(.4,0,.2,1), background 200ms ease;
}
.hbcap-ready-fill.is-done {
  background: linear-gradient(90deg, rgba(16,185,129,0.7), var(--cap-success));
}

/* ── Body ── */
.hbcap-body {
  flex: 1; min-height: 0;
  overflow-y: auto;
  padding: 14px 18px 16px;
}
.hbcap-body::-webkit-scrollbar { width: 8px; }
.hbcap-body::-webkit-scrollbar-thumb {
  background: var(--cap-border-strong); border-radius: 999px;
}

/* Section cards (shared component — restyled only inside this drawer) */
.hbcap .customer-drawer-card {
  background: var(--cap-elev) !important;
  border: 1px solid var(--cap-border) !important;
  border-radius: 14px !important;
  margin-bottom: 12px !important;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.hbcap .customer-drawer-card:focus-within {
  border-color: var(--cap-accent-border) !important;
  box-shadow: 0 0 0 3px var(--cap-accent-soft);
}
.hbcap .customer-drawer-card > div:first-child {
  margin: 0 !important;
  padding: 11px 15px !important;
  gap: 10px !important;
  border-bottom: 1px solid var(--cap-border) !important;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent);
  align-items: center !important;
}
.hbcap-light .customer-drawer-card > div:first-child { background: var(--cap-soft); }
.hbcap .customer-drawer-card > div:first-child > div:first-child {
  width: 26px !important; height: 26px !important;
  border-radius: 8px !important;
  background: var(--cap-accent-soft) !important;
  border: 1px solid var(--cap-accent-border) !important;
  color: var(--cap-accent) !important;
  font-size: 10px !important;
}
.hbcap .customer-drawer-card > div:first-child > div:last-child > div:first-child {
  color: var(--cap-text) !important;
  font-size: 12.5px !important;
}
.hbcap .customer-drawer-card > div:first-child > div:last-child > div:last-child {
  color: var(--cap-text-muted) !important;
  font-size: 10.5px !important;
}
.hbcap .customer-drawer-card > div:last-child { padding: 14px 15px !important; }
.hbcap .ant-form-item { margin-bottom: 12px; }

/* Labels + controls */
.hbcap .customer-drawer-form .premium-form-label,
.hbcap .customer-drawer-form .ant-form-item-label > label {
  color: var(--cap-text-muted) !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.13em !important;
  text-transform: uppercase;
}
.hbcap .customer-drawer-form .ant-input,
.hbcap .customer-drawer-form .ant-input-affix-wrapper,
.hbcap .customer-drawer-form textarea.ant-input,
.hbcap .customer-drawer-form .ant-input-textarea-show-count,
.hbcap .customer-drawer-form .ant-input-textarea-affix-wrapper {
  background: var(--cap-soft) !important;
  border: 1px solid var(--cap-border) !important;
  border-radius: 10px !important;
  color: var(--cap-text) !important;
  font-size: 13px !important;
}
.hbcap .customer-drawer-form .ant-input::placeholder,
.hbcap .customer-drawer-form textarea.ant-input::placeholder {
  color: var(--cap-text-muted) !important;
}
.hbcap .customer-drawer-form .ant-input:focus,
.hbcap .customer-drawer-form .ant-input-focused,
.hbcap .customer-drawer-form .ant-input-affix-wrapper:focus-within,
.hbcap .customer-drawer-form .ant-input-textarea-affix-wrapper:focus-within {
  border-color: var(--cap-accent) !important;
  box-shadow: 0 0 0 3px var(--cap-accent-soft) !important;
}
.hbcap .customer-drawer-form .sd-trigger {
  height: 38px !important;
  padding: 6px 12px !important;
  border-radius: 10px !important;
  background: var(--cap-soft) !important;
  border-color: var(--cap-border) !important;
}
.hbcap .customer-drawer-form .sd-trigger:hover { border-color: var(--cap-border-strong) !important; }
.hbcap .customer-drawer-form .sd-trigger-value { color: var(--cap-text) !important; }

/* Field header: label on the left, inline action on the right */
.hbcap-fieldhead {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  min-height: 26px;
}
.hbcap .customer-drawer-form .hbcap-fieldlabel {
  color: var(--cap-text-muted) !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0.13em !important;
  text-transform: uppercase;
}
.hbcap-req { color: var(--cap-danger); margin-left: 3px; }
.hbcap .customer-drawer-form .hbcap-fieldhint,
.hbcap .customer-drawer-form .ant-form-item-extra {
  font-size: 10.5px;
  color: var(--cap-text-muted);
  margin-top: 5px;
}

/* AI polish button */
.hbcap-ai-btn.ant-btn {
  height: 26px !important;
  padding: 0 10px !important;
  border-radius: 999px !important;
  border: 1px solid var(--cap-accent-border) !important;
  background: var(--cap-accent-soft) !important;
  color: var(--cap-accent) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
}
.hbcap-ai-btn.ant-btn:hover:not(:disabled) {
  filter: brightness(1.12);
  border-color: var(--cap-accent) !important;
}
.hbcap-ai-btn.ant-btn:disabled { opacity: 0.5; }

/* Tags */
.hbcap-tagbox {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  min-height: 38px;
  padding: 6px 8px;
  border-radius: 10px;
  background: var(--cap-soft);
  border: 1px solid var(--cap-border);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.hbcap-tagbox:focus-within {
  border-color: var(--cap-accent);
  box-shadow: 0 0 0 3px var(--cap-accent-soft);
}
.hbcap-tagbox .ant-tag {
  margin: 0 !important;
  padding: 1px 6px !important;
  border-radius: 6px !important;
  background: var(--cap-accent-soft) !important;
  border: 1px solid var(--cap-accent-border) !important;
  color: var(--cap-accent) !important;
  font-size: 11px !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hbcap-tagbox .ant-tag .ant-tag-close-icon { color: var(--cap-accent) !important; opacity: 0.7; }
.hbcap .customer-drawer-form .hbcap-tagbox .ant-input,
.hbcap .customer-drawer-form .hbcap-tagbox .ant-input:focus {
  flex: 1 1 90px;
  min-width: 90px;
  height: 22px;
  padding: 0 2px !important;
  background: transparent !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  color: var(--cap-text) !important;
  font-size: 12.5px !important;
}
.hbcap .customer-drawer-form .hbcap-tagbox .ant-input::placeholder {
  color: var(--cap-text-muted) !important;
}

/* Attachments */
.hbcap-drop {
  display: flex; align-items: center; gap: 11px;
  width: 100%;
  padding: 11px 13px;
  border-radius: 12px;
  border: 1px dashed var(--cap-border-strong);
  background: var(--cap-soft);
  color: var(--cap-text-soft);
  text-align: left;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms ease;
}
.hbcap-drop:hover {
  border-color: var(--cap-accent);
  background: var(--cap-hover);
  transform: translateY(-1px);
}
.hbcap-drop-icon {
  width: 32px; height: 32px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: var(--cap-accent-soft);
  border: 1px solid var(--cap-accent-border);
  color: var(--cap-accent);
}
.hbcap-drop-title { font-size: 12.5px; font-weight: 600; color: var(--cap-text); }
.hbcap-drop-sub { font-size: 11px; color: var(--cap-text-muted); margin-top: 1px; }

.hbcap-list { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.hbcap-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: var(--cap-soft);
  border: 1px solid var(--cap-border);
  transition: border-color 140ms ease, background 140ms ease;
}
.hbcap-item:hover { border-color: var(--cap-border-strong); background: var(--cap-hover); }
.hbcap-item-icon {
  width: 28px; height: 28px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--cap-elev);
  border: 1px solid var(--cap-border);
  color: var(--cap-text-soft);
}
.hbcap-item-text { flex: 1; min-width: 0; }
.hbcap-item-name {
  font-size: 12.5px; font-weight: 550; color: var(--cap-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.hbcap-item-name a { color: var(--cap-accent); text-decoration: none; }
.hbcap-item-name a:hover { text-decoration: underline; }
.hbcap-item-meta { font-size: 10.5px; color: var(--cap-text-muted); margin-top: 1px; }
.hbcap-item-actions { display: inline-flex; align-items: center; gap: 2px; flex-shrink: 0; }
.hbcap-item-btn {
  width: 26px; height: 26px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 7px;
  background: transparent; border: none;
  color: var(--cap-text-muted);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.hbcap-item-btn:hover { background: var(--cap-hover); color: var(--cap-text); }
.hbcap-item-btn.is-danger:hover { color: var(--cap-danger); }

.hbcap-linkadd { display: flex; gap: 8px; }
.hbcap-linkadd .ant-input { flex: 1; }
.hbcap-addbtn {
  width: 38px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: var(--cap-accent-soft);
  border: 1px solid var(--cap-accent-border);
  color: var(--cap-accent);
  cursor: pointer;
  transition: filter 130ms ease;
}
.hbcap-addbtn:hover:not(:disabled) { filter: brightness(1.15); }
.hbcap-addbtn:disabled { opacity: 0.45; cursor: not-allowed; }

.hbcap-empty {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px dashed var(--cap-border);
  color: var(--cap-text-muted);
  font-size: 11.5px;
  text-align: center;
}

/* ── Footer ── */
.hbcap-foot {
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 11px 18px;
  border-top: 1px solid var(--cap-border);
  background: var(--cap-elev);
  box-shadow: 0 -10px 24px -18px rgba(4,8,16,0.7);
}
.hbcap-hint {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11.5px; color: var(--cap-text-muted);
  min-width: 0;
}
.hbcap-hint.is-ready { color: var(--cap-success); }
.hbcap-kbd {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--cap-soft);
  border: 1px solid var(--cap-border);
  color: var(--cap-text-soft);
  font-size: 10px; font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.hbcap-foot-actions { display: inline-flex; align-items: center; gap: 8px; }
.hbcap-btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 32px; padding: 0 15px;
  border-radius: 9px;
  border: 1px solid var(--cap-border-strong);
  background: var(--cap-soft);
  color: var(--cap-text);
  font-size: 12.5px; font-weight: 550;
  cursor: pointer;
  transition: background 130ms ease, border-color 130ms ease, transform 130ms ease;
}
.hbcap-btn:hover:not(:disabled) { background: var(--cap-hover); }
.hbcap-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.hbcap-btn-primary {
  border-color: transparent;
  background: linear-gradient(135deg, var(--cap-accent), #6366F1);
  color: #FFFFFF;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(37,99,235,0.28);
}
.hbcap-btn-primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.hbcap-btn-primary:disabled { box-shadow: none; }
.hbcap-spin { animation: hbcapSpin 900ms linear infinite; }
@keyframes hbcapSpin { to { transform: rotate(360deg); } }

/* Drag-and-drop overlay */
.hbcap-dropoverlay {
  position: absolute; inset: 8px;
  z-index: 30;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px;
  border-radius: 16px;
  border: 2px dashed var(--cap-accent);
  background: color-mix(in oklab, var(--cap-accent) 12%, transparent);
  backdrop-filter: blur(8px);
  color: var(--cap-accent);
  pointer-events: none;
}
.hbcap-dropoverlay-title { font-size: 14.5px; font-weight: 650; }
.hbcap-dropoverlay-sub { font-size: 11.5px; opacity: 0.8; }
`;


interface Props {
  open: boolean;
  onClose: () => void;
  folderId: string | null;
  sheetId: string | null;
  editingBug?: BugListItem | null;
  /** The project's own QA modules — the list bugs, scopes and cases share. */
  moduleOptions?: { value: string; label: string; description?: string }[];
  /** Named in the empty module dropdown, so the reader knows which project has none. */
  projectName?: string | null;
  /** Re-reads the module list, for once one has been added in QA settings. */
  onModulesRefresh?: () => void;
  /** Module names on older bugs that predate the shared list, so they still read back. */
  legacyModules?: string[];
  projectId?: string;
  onSubmit: (
    payload: CreateBugInput | (UpdateBugInput & { id: string }),
  ) => Promise<void>;
  submitting?: boolean;
}

const fileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Bugs raised from a test run used to have the case definition pasted into
 * comments. That now lives in the Test Case details panel, so strip those
 * generated blocks off older bugs and leave only what a person typed.
 */
const TEST_CASE_BLOCK = /^(test case|failed in run|steps to reproduce|expected result|preconditions)\s*:/i;
const stripTestCaseBlocks = (raw?: string | null): string =>
  (raw || "")
    .split(/\n\s*\n/)
    .filter((block) => !TEST_CASE_BLOCK.test(block.trim()))
    .join("\n\n")
    .trim();

export default function CreateBugDrawer({
  open,
  onClose,
  folderId,
  sheetId,
  editingBug,
  moduleOptions = [],
  legacyModules = [],
  projectName,
  projectId,
  onModulesRefresh,
  onSubmit,
  submitting,
}: Props) {
  const { theme } = useTheme();
  const { user } = useAuth();
  const hasPrime = !user?.subscriptionFeatures ? true : user.subscriptionFeatures.includes('work_qa_space_bug_list_prime');
  const { data: projectMembers } = useProjectMembers(projectId);
  const members = (projectMembers || []).map(u => ({ value: u.value, label: u.label, avatarUrl: u.avatarUrl, position: u.position, email: u.workEmail, role: u.position }));
  const [notificationApi, notificationContextHolder] = notification.useNotification();
  const { message } = App.useApp();
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [module, setModule] = useState<string>("");
  const [bugType, setBugType] = useState<string | undefined>();
  const [severity, setSeverity] = useState<string | undefined>();
  const { data: severityOptions } = useBugSeverityOptions();
  const { data: typeOptions } = useBugListTypeOptions();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [assigneeId, setAssigneeId] = useState<string | undefined>();
  const [attachments, setAttachments] = useState<BugAttachment[]>([]);
  const [links, setLinks] = useState<BugExternalLink[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [descriptionTouched, setDescriptionTouched] = useState(false);
  const [enhancingDescription, setEnhancingDescription] = useState(false);
  const [comments, setComments] = useState("");
  const [previewAttachment, setPreviewAttachment] = useState<BugAttachment | null>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(undefined);

  /**
   * The project's modules, plus any name an existing bug already carries that
   * the list no longer has — editing a bug must never silently drop its module.
   */
  const moduleChoices = useMemo(() => {
    const known = new Set(moduleOptions.map((o) => o.value.toLowerCase()));
    const extras = [...legacyModules, module]
      .map((m) => (m || "").trim())
      .filter((m) => m && !known.has(m.toLowerCase()));
    return [
      ...moduleOptions,
      ...Array.from(new Set(extras)).map((m) => ({
        value: m,
        label: m,
        description: "Not in this project's module list",
      })),
    ];
  }, [moduleOptions, legacyModules, module]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  useEffect(() => {
    if (!open) return;
    let observer: ResizeObserver | null = null;
    const timer = setTimeout(() => {
      const trigger = document.querySelector('.customer-drawer-form .sd-trigger');
      if (trigger) {
        observer = new ResizeObserver((entries) => {
          for (let entry of entries) {
            setDropdownWidth(entry.contentRect.width);
          }
        });
        observer.observe(trigger);
        setDropdownWidth((trigger as HTMLElement).offsetWidth);
      }
    }, 50);
    return () => {
      clearTimeout(timer);
      if (observer) observer.disconnect();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editingBug) {
      setTitle(editingBug.title || "");
      setDescription(editingBug.description || "");
      setModule(editingBug.module || "");
      setBugType(editingBug.bugType || undefined);
      setSeverity(editingBug.severity || undefined);
      setTags(editingBug.tags || []);
      setAssigneeId(editingBug.assigneeId || undefined);
      setAttachments(editingBug.attachments || []);
      setLinks(editingBug.externalLinks || []);
      setComments(stripTestCaseBlocks(editingBug.comments));
    } else {
      setTitle("");
      setDescription("");
      setModule("");
      const defaultSeverity = severityOptions?.find(
        (s) => s.isActive && s.isDefault,
      )?.key;
      const defaultType = typeOptions?.find(
        (t) => t.isActive && t.isDefault,
      )?.key;
      setBugType(defaultType);
      setSeverity(defaultSeverity);
      setTags([]);
      setAssigneeId(undefined);
      setAttachments([]);
      setLinks([]);
      setComments("");
    }
    setTagInput("");
    setLinkUrl("");
    setLinkLabel("");
    setDragOver(false);
    setDescriptionTouched(false);
  }, [open, editingBug, severityOptions, typeOptions]);

  const assignee = useMemo(
    () => members.find((m) => m.value === assigneeId),
    [members, assigneeId],
  );

  // ─── Global Paste Handler (Direct Paste Fix) ──────────────────────────
  const addFiles = React.useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    for (const file of list) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > MAX_FILE_MB) {
        message.error(`${file.name} is over ${MAX_FILE_MB}MB`);
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        setAttachments((prev) => [
          ...prev,
          {
            fileName: file.name,
            fileUrl: base64,
            fileSize: file.size,
            fileType: file.type || "application/octet-stream",
            isNew: true,
          },
        ]);
      } catch {
        message.error(`Failed to read ${file.name}`);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file") {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }

      if (files.length > 0) {
        const target = e.target as HTMLElement;
        const isInput =
          target.tagName === "INPUT" || target.tagName === "TEXTAREA";
        if (!isInput) {
          e.preventDefault();
        }
        addFiles(files);
      }
    };

    window.addEventListener("paste", handleWindowPaste);
    return () => window.removeEventListener("paste", handleWindowPaste);
  }, [open, addFiles]);

  const removeAttachment = (idx: number) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const renameAttachment = (idx: number, newName: string) => {
    setAttachments((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, fileName: newName } : a)),
    );
  };

  // ─── Drag-and-drop ─────────────────────────────────────────────────────
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types?.includes("Files")) {
      dragCounter.current++;
      setDragOver(true);
    }
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragOver(false);
    }
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  // ─── Tags ──────────────────────────────────────────────────────────────
  const commitTag = () => {
    const v = tagInput.trim().replace(/^#/, "");
    if (!v) return;
    setTags((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setTagInput("");
  };
  const removeTag = (t: string) =>
    setTags((prev) => prev.filter((x) => x !== t));

  // ─── Links ─────────────────────────────────────────────────────────────
  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    setLinks((prev) => [
      ...prev,
      { url, label: linkLabel.trim() || undefined },
    ]);
    setLinkUrl("");
    setLinkLabel("");
  };
  const removeLink = (idx: number) =>
    setLinks((prev) => prev.filter((_, i) => i !== idx));

  // ─── Enhance grammar ───────────────────────────────────────────────────
  const enhanceDescription = async () => {
    const current = description.trim();
    if (!current || enhancingDescription) return;
    setEnhancingDescription(true);
    try {
      const enhanced = await BugListService.aiEnhanceText(current);
      if (enhanced && enhanced !== current) {
        setDescription(enhanced);
        message.success("Grammar polished");
      } else {
        message.info("Already looks good");
      }
    } catch (err: any) {
      console.error("enhanceDescription error:", err);
      message.error(err?.response?.data?.error || "Couldn't enhance text");
    } finally {
      setEnhancingDescription(false);
    }
  };

  // ─── Submit ────────────────────────────────────────────────────────────
  const isValid =
    description.trim().length > 0 &&
    !!severity &&
    !!bugType;

  /** Drives the header's readiness meter — the three fields the API insists on. */
  const readyChecks = [
    { label: "Description", done: description.trim().length > 0 },
    { label: "Severity", done: !!severity },
    { label: "Type", done: !!bugType },
  ];
  const doneCount = readyChecks.filter((c) => c.done).length;
  const readyPercent = Math.round((doneCount / readyChecks.length) * 100);

  const handleSubmit = async () => {
    setDescriptionTouched(true);
    if (!isValid) return;

    let finalLinks = [...links];
    if (linkUrl.trim()) {
      finalLinks.push({
        url: linkUrl.trim(),
        label: linkLabel.trim() || undefined,
      });
    }

    if (editingBug) {
      await onSubmit({
        id: editingBug.id,
        title: title.trim() || null,
        description: description.trim(),
        module: module.trim() || null,
        bugType: bugType || null,
        severity: severity || null,
        tags,
        assigneeId: assigneeId || null,
        attachments,
        externalLinks: finalLinks,
        comments: comments.trim() || null,
      });
    } else {
      if (!folderId || !sheetId) {
        message.error("Select a sheet first");
        return;
      }
      await onSubmit({
        folderId,
        sheetId,
        title: title.trim() || undefined,
        description: description.trim(),
        module: module.trim() || undefined,
        bugType,
        severity,
        tags,
        assigneeId,
        attachments,
        externalLinks: finalLinks,
        comments: comments.trim() || undefined,
      });
    }
  };

  // ⌘/Ctrl + Enter
  const onShellKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <Drawer
        open={open}
        onClose={onClose}
        width={720}
        destroyOnHidden
        maskClosable={!submitting}
        closable={false}
        title={null}
        rootClassName={`hbcap ${theme === "dark" ? "hbcap-dark" : "hbcap-light"}`}
        styles={{
          header: { display: 'none' },
          body: { padding: 0 },
          mask: { backdropFilter: 'blur(6px)', background: 'rgba(11, 15, 26, 0.45)' },
        }}
      >
        <style>{captureDrawerStyles}</style>
        <style>{NO_MODULES_STYLES}</style>
        <div
          className="hbcap-shell"
          onKeyDown={onShellKeyDown}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <header className="hbcap-head">
            <div className="hbcap-head-glow" aria-hidden />

            <div className="hbcap-head-row">
              <span className="hbcap-mark">
                <BugOutlined style={{ fontSize: 17 }} />
              </span>

              <div className="hbcap-head-text">
                <div className="hbcap-eyebrow">
                  {editingBug ? "Editing bug" : "New bug entry"}
                </div>
                <div className="hbcap-title">
                  {editingBug ? `${editingBug.bugNumber || "Bug"} · Refine` : "Capture a bug"}
                </div>
                <div className="hbcap-sub">
                  {editingBug
                    ? "Update the details — every change is tracked in history."
                    : "Describe it once. Severity, owner and evidence all live here."}
                </div>
              </div>

              <div className="hbcap-head-actions">
                <button className="hbcap-iconbtn" onClick={onClose} aria-label="Close">
                  <X size={15} />
                </button>
              </div>
            </div>

            <div className="hbcap-ready">
              <div className="hbcap-checks">
                {readyChecks.map((c) => (
                  <span key={c.label} className={`hbcap-check ${c.done ? "is-done" : ""}`}>
                    <span className="hbcap-check-dot">
                      <Check size={9} strokeWidth={3.4} />
                    </span>
                    {c.label}
                  </span>
                ))}
              </div>
              <span className="hbcap-ready-meter">
                <span
                  className={`hbcap-ready-fill ${isValid ? "is-done" : ""}`}
                  style={{ width: `${readyPercent}%` }}
                />
              </span>
            </div>
          </header>

          <div className="hbcap-body">
          <ConfigProvider
            theme={{
              token: {
                borderRadius: 10,
                borderRadiusSM: 8,
                borderRadiusLG: 12,
                borderRadiusXS: 6,
              },
              components: {
                Select: { borderRadius: 10 },
                Input: { borderRadius: 10 },
                Button: { borderRadius: 9 }
              }
            }}
          >
            {dragOver && (
              <div className="hbcap-dropoverlay">
                <UploadCloud size={34} strokeWidth={1.6} />
                <div className="hbcap-dropoverlay-title">Drop files to attach</div>
                <div className="hbcap-dropoverlay-sub">Up to {MAX_FILE_MB}MB each</div>
              </div>
            )}

            <style>{drawerFormStyles}</style>
            <style>{`
              .sd-overlay-popover .sd-list::-webkit-scrollbar {
                display: none;
              }
              .sd-overlay-popover .sd-list {
                -ms-overflow-style: none;
                scrollbar-width: none;
              }
            `}</style>
            <Form
              layout="horizontal"
              labelCol={{ span: 8 }}
              wrapperCol={{ span: 16 }}
              labelAlign="left"
              colon={false}
              className="lead-drawer-form customer-drawer-form"
            >
              <SectionCard step="STEP 1" icon={<InfoCircleOutlined style={{ color: '#475569', fontSize: 13 }} />} title="General Details" subtitle="Core bug information">
                {/* Raised from a QA test run — the source case, collapsed by default */}
                {(editingBug?.testCaseRef || editingBug?.testCaseId) && (
                  <TestCaseDetailsPanel
                    testCaseId={editingBug.testCaseId ?? null}
                    testCaseRef={editingBug.testCaseRef ?? null}
                  />
                )}

                <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Bug Title</Text>}>
                  <Input
                    placeholder="Bug title (optional — AI can refine)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={140}
                  />
                </Form.Item>

                {/* Sits with the title, not with severity: the module is what
                    ties this bug to the project's scopes and test cases. */}
                <Form.Item
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                  label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Module</Text>}
                  extra={
                    <span style={{ fontSize: 11, color: "var(--text-slate-400)" }}>
                      {moduleChoices.length
                        ? "The project's modules — the same list its scopes and test cases file under."
                        : "No modules yet — open the dropdown to add the first one."}
                    </span>
                  }
                >
                  <SearchableDropdown
                    placeholder={moduleChoices.length ? "Select module" : "No modules yet — add one"}
                    searchPlaceholder="Search modules…"
                    itemNoun="modules"
                    value={module || undefined}
                    onChange={(v) => setModule(v || "")}
                    options={moduleChoices}
                    emptyComponent={<NoModulesEmpty projectName={projectName} onRefresh={onModulesRefresh} />}
                    width={dropdownWidth}
                    style={{ flex: 1, width: "100%", height: 32 }}
                  />
                </Form.Item>
                <div>
                  <div className="hbcap-fieldhead">
                    <span className="premium-form-label hbcap-fieldlabel">
                      Description<span className="hbcap-req">*</span>
                    </span>
                    {hasPrime && (
                      <Button
                        size="small"
                        className="hbcap-ai-btn"
                        icon={enhancingDescription ? <LoadingOutlined /> : <Sparkles size={11} />}
                        onClick={(e) => { e.preventDefault(); enhanceDescription(); }}
                        disabled={enhancingDescription || !description.trim()}
                      >
                        {enhancingDescription ? "Polishing…" : "Polish with AI"}
                      </Button>
                    )}
                  </div>
                  <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} validateStatus={description.trim().length === 0 && descriptionTouched ? 'error' : ''} help={description.trim().length === 0 && descriptionTouched ? 'Description is required' : ''}>
                    <div onBlur={() => setDescriptionTouched(true)}>
                      <TiptapEditor
                        content={description}
                        onChange={(html) => setDescription(html)}
                        placeholder="What went wrong? Steps to reproduce?"
                      />
                    </div>
                  </Form.Item>
                </div>
                <Form.Item labelCol={{ span: 24 }} wrapperCol={{ span: 24 }} label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Comments</Text>}>
                  <Input.TextArea
                    rows={2}
                    placeholder="Any additional internal comments or notes…"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </Form.Item>
              </SectionCard>

              <SectionCard step="STEP 2" icon={<AppstoreOutlined style={{ color: '#475569', fontSize: 13 }} />} title="Classification" subtitle="Severity and type">
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Severity</Text>} required validateStatus={!severity && descriptionTouched ? 'error' : ''}>
                  <SearchableDropdown
                    placeholder="Select severity"
                    itemNoun="severities"
                    value={severity}
                    onChange={(v) => setSeverity(v)}
                    options={(severityOptions || []).filter((s) => s.isActive).map((s) => ({
                      value: s.key,
                      label: s.label,
                      badge: s.color ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} /> : undefined
                    }))}
                    width={dropdownWidth}
                    style={{ flex: 1, width: "100%", height: 32 }}
                  />
                </Form.Item>
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Type</Text>} required validateStatus={!bugType && descriptionTouched ? 'error' : ''}>
                  <SearchableDropdown
                    placeholder="Select type"
                    itemNoun="types"
                    value={bugType}
                    onChange={(v) => setBugType(v)}
                    options={(typeOptions || []).filter((t) => t.isActive).map((t) => ({ value: t.key, label: t.label }))}
                    width={dropdownWidth}
                    style={{ flex: 1, width: "100%", height: 32 }}
                  />
                </Form.Item>
              </SectionCard>

              <SectionCard step="STEP 3" icon={<TeamOutlined style={{ color: '#10b981', fontSize: 13 }} />} title="Assignments & Tags" subtitle="Ownership and categorization">
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Assignee</Text>}>
                  <SearchableDropdown
                    placeholder="Unassigned"
                    searchPlaceholder="Search by name or role…"
                    itemNoun="members"
                    value={assigneeId || undefined}
                    onChange={(v) => setAssigneeId(v as string | undefined)}
                    options={members.map((m) => ({ 
                      value: m.value, 
                      label: m.label, 
                      description: m.position,
                      avatarUrl: m.avatarUrl 
                    }))}
                    showSelectedAvatar
                    width={dropdownWidth}
                    style={{ flex: 1, width: "100%", height: 32 }}
                  />
                </Form.Item>
                <Form.Item
                  labelCol={{ span: 24 }}
                  wrapperCol={{ span: 24 }}
                  label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Tags</Text>}
                  extra={<span className="hbcap-fieldhint">Press Enter or comma to add · Backspace removes the last one</span>}
                >
                  <div className="hbcap-tagbox">
                    {tags.map((t) => (
                      <Tag key={t} closable onClose={() => removeTag(t)} style={{ margin: 0 }}>#{t}</Tag>
                    ))}
                    <Input
                      variant="borderless"
                      size="small"
                      placeholder={tags.length === 0 ? "Type tag & Enter" : ""}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      className="hbcap-taginput"
                      onPressEnter={(e) => { e.preventDefault(); commitTag(); }}
                      onKeyDown={(e) => {
                        if (e.key === "," || e.key === "Enter") {
                          e.preventDefault();
                          commitTag();
                        } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
                          setTags(prev => prev.slice(0, -1));
                        }
                      }}
                      onBlur={commitTag}
                    />
                  </div>
                </Form.Item>
              </SectionCard>

              <SectionCard step="STEP 4" icon={<PaperClipOutlined style={{ color: '#f59e0b', fontSize: 13 }} />} title="Attachments & Links" subtitle="Files and external resources">
                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Files</Text>}>
                  <button
                    type="button"
                    className="hbcap-drop"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span className="hbcap-drop-icon">
                      <UploadCloud size={16} />
                    </span>
                    <span>
                      <span className="hbcap-drop-title">Drop files here, or browse</span>
                      <span className="hbcap-drop-sub" style={{ display: 'block' }}>
                        Screenshots, recordings, logs or PDFs · up to {MAX_FILE_MB}MB each · ⌘V works too
                      </span>
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: 'none' }}
                    accept="image/*,video/*,application/pdf,.log,.txt"
                    onChange={(e) => {
                      if (e.target.files) addFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  {attachments.length > 0 && (
                    <div className="hbcap-list">
                      {attachments.map((a, i) => {
                        const isImage = a.fileType?.startsWith("image/");
                        const isVideo = a.fileType?.startsWith("video/");
                        return (
                          <div key={i} className="hbcap-item">
                            <span className="hbcap-item-icon">
                              {isImage ? <ImageIcon size={14} /> : isVideo ? <Play size={14} /> : <FileText size={14} />}
                            </span>
                            <span className="hbcap-item-text">
                              <span className="hbcap-item-name">{a.fileName}</span>
                              <span className="hbcap-item-meta">
                                {[formatBytes(a.fileSize), a.isNew ? "Pending upload" : null]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            </span>
                            <span className="hbcap-item-actions">
                              <Tooltip title="Preview">
                                <button
                                  className="hbcap-item-btn"
                                  onClick={() => setPreviewAttachment(a)}
                                  aria-label="Preview attachment"
                                >
                                  <Eye size={14} />
                                </button>
                              </Tooltip>
                              <Tooltip title="Remove">
                                <button
                                  className="hbcap-item-btn is-danger"
                                  onClick={() => removeAttachment(i)}
                                  aria-label="Remove attachment"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </Tooltip>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Form.Item>

                <Form.Item label={<Text strong className="premium-form-label" style={{ fontSize: 12, color: "#64748b" }}>Links</Text>}>
                  <div className="hbcap-linkadd">
                    <Input placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onPressEnter={addLink} />
                    <Input placeholder="Label (optional)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} onPressEnter={addLink} style={{ width: 150 }} />
                    <button
                      type="button"
                      className="hbcap-addbtn"
                      onClick={addLink}
                      disabled={!linkUrl.trim()}
                      aria-label="Add link"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  {links.length > 0 && (
                    <div className="hbcap-list">
                      {links.map((lnk, i) => (
                        <div key={i} className="hbcap-item">
                          <span className="hbcap-item-icon">
                            <Link2 size={14} />
                          </span>
                          <span className="hbcap-item-text">
                            <span className="hbcap-item-name">
                              <a href={lnk.url} target="_blank" rel="noopener noreferrer">
                                {lnk.label || lnk.url}
                              </a>
                            </span>
                            {lnk.label && <span className="hbcap-item-meta">{lnk.url}</span>}
                          </span>
                          <span className="hbcap-item-actions">
                            <Tooltip title="Open">
                              <a
                                className="hbcap-item-btn"
                                href={lnk.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open link"
                              >
                                <ExternalLink size={14} />
                              </a>
                            </Tooltip>
                            <Tooltip title="Remove">
                              <button
                                className="hbcap-item-btn is-danger"
                                onClick={() => removeLink(i)}
                                aria-label="Remove link"
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Item>
              </SectionCard>
            </Form>
          </ConfigProvider>
          </div>

          <footer className="hbcap-foot">
            <span className={`hbcap-hint ${isValid ? "is-ready" : ""}`}>
              {isValid ? (
                <>
                  <Check size={13} />
                  Ready — press
                  <span className="hbcap-kbd">⌘ ⏎</span>
                  to save
                </>
              ) : (
                <>
                  {3 - doneCount} required field{3 - doneCount === 1 ? "" : "s"} left
                </>
              )}
            </span>

            <div className="hbcap-foot-actions">
              <button className="hbcap-btn" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                className="hbcap-btn hbcap-btn-primary"
                onClick={handleSubmit}
                disabled={submitting || !isValid}
              >
                {submitting ? (
                  <Loader2 size={14} className="hbcap-spin" />
                ) : (
                  <Check size={14} />
                )}
                {submitting
                  ? "Saving…"
                  : editingBug
                    ? "Save changes"
                    : "Create bug"}
              </button>
            </div>
          </footer>
        </div>

      </Drawer>
      {previewAttachment && (
        <Drawer
          open={!!previewAttachment}
          onClose={() => setPreviewAttachment(null)}
          placement="left"
          width={700}
          title="File Preview"
        >
          {(() => {
            let url = previewAttachment.fileUrl || "";
            if (url.includes("r2.cloudflarestorage.com")) {
              url = url.replace(/https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/[^/]+/, "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev");
            }
            if (url.includes(".r2.dev") && !url.includes(".r2.dev/")) {
              url = url.replace(".r2.dev", ".r2.dev/");
            }

            const isImage = previewAttachment.fileType?.startsWith("image/") || url.startsWith("data:image/") || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(url);
            const isVideo = previewAttachment.fileType?.startsWith("video/") || /\.(mp4|webm|ogg|mov)/i.test(url);
            const isPdf = previewAttachment.fileType === "application/pdf" || /\.pdf/i.test(url);

            if (isImage) return <img src={url} alt="Preview" style={{ width: '100%', objectFit: 'contain' }} />;
            if (isVideo) return <video src={url} controls style={{ width: '100%' }} />;
            if (isPdf) return <iframe src={url} style={{ width: '100%', height: '80vh', border: 'none' }} />;
            return (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p>Preview not available</p>
                <Button onClick={() => window.open(url, '_blank')} type="primary">Open in New Tab</Button>
              </div>
            );
          })()}
        </Drawer>
      )}
    </>
  );
}
