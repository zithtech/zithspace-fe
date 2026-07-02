"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
    Settings2,
    Plus,
    Search,
    Zap,
    Tag as TagIcon,
    Activity,
    ArrowUp,
    ArrowDown,
    Trash2,
    Edit2,
    Sparkles,
    ShieldCheck,
    Hash,
    GripVertical,
    Eye,
    Star,
    CheckCircle2,
    BarChart3,
    Workflow,
    Palette,
    Inbox,
    ArrowUpRight,
    Info,
    Globe,
    Image as ImageIcon,
    Upload as UploadIcon,
    Link2,
    X as XIcon,
    Linkedin,
    Briefcase,
    Check,
    Flag,
    Trophy,
    Target,
    Award,
    Compass,
    Handshake,
    Megaphone,
    Rocket,
    Menu
} from "lucide-react";
import {
    Typography,
    Button,
    Table,
    Input,
    Form,
    Row,
    Col,
    Select,
    App,
    Switch,
    ColorPicker,
    Drawer,
    Tooltip,
    Upload,
    Tag,
    Segmented,
    Dropdown
} from "antd";
import {
    ClockCircleOutlined,
    UserOutlined,
    PhoneOutlined,
    MailOutlined,
    FileOutlined,
    CalendarOutlined,
    MessageOutlined,
    VideoCameraOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    TeamOutlined,
    SendOutlined,
    LinkOutlined,
    RiseOutlined,
    AppstoreOutlined,
    UnorderedListOutlined,
    EllipsisOutlined,
    ReloadOutlined,
    SearchOutlined,
    PlusOutlined,
} from "@ant-design/icons";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { useLeadSettings } from "@/hooks/useLeadSettings";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";
import ConfirmDialog from "@/components/common/ConfirmDialog";

const { Text, Title } = Typography;

// Brand glyphs (simple-icons paths, CC0). Inherit color via currentColor so
// the parent tints them with the brand color when rendered.
const UpworkGlyph = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.139c-2.539 0-4.51 1.649-5.31 4.366-1.22-1.834-2.148-4.036-2.687-5.892H7.828v7.112c-.002 1.406-1.141 2.546-2.547 2.548-1.405-.002-2.543-1.143-2.545-2.548V3.492H0v7.112c0 2.914 2.37 5.303 5.281 5.303 2.913 0 5.283-2.389 5.283-5.303v-1.19c.529 1.107 1.182 2.229 1.974 3.221l-1.673 7.873h2.797l1.213-5.71c1.063.679 2.285 1.109 3.686 1.109 3 0 5.439-2.452 5.439-5.45 0-3-2.439-5.439-5.439-5.439z" />
    </svg>
);
const FreelancerGlyph = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="m11.103 14.045 4.751-.866-3.04 2.696Zm2.707-4.545.65 1.802 2.745.305-2.746 2.066L20.13 9.55l1.327-3.176-2.927-.077ZM2.543 11.39l4.598 1.793-.41 1.553Zm15.214 6.853-3.353-1.474-2.057 2.318-1.43-1.474-7.165-1.318 9.06 6.722ZM0 .063l4.84 6.296 9.227 1.518L18.93.064l-3.483 3.04L11.103 0 7.06 3.04Z" />
    </svg>
);
const FiverrGlyph = ({ size = 14 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M23.004 15.588a.995.995 0 1 0 0 1.99.995.995 0 0 0 0-1.99zm-6.465-6.46h-2.973v-.348c0-.85.589-1.337 1.621-1.337h1.071V5.114h-1.404c-2.451 0-3.916 1.348-3.916 3.621v.391h-2.682v-.348c0-.85.589-1.337 1.621-1.337h.428V5.114h-.762c-2.451 0-3.916 1.348-3.916 3.621v.391H4.553v2.331h1.074v6.535h2.973v-6.535h2.682v6.535h2.973v-6.535h2.973v4.176c0 1.561.999 2.359 2.987 2.359h1.391v-2.337h-.832c-.581 0-.762-.165-.762-.671v-2.992h1.594V9.128h-1.594z" />
    </svg>
);

// Built-in icon catalogue. Stored in logo_url as `icon:<key>`; the value is
// either this prefixed key OR a raw data: / https: URL for a custom image.
// `kinds` filters which platform types the icon shows up under.
interface PlatformIconMeta {
    key: string;
    label: string;
    brand: string;
    kinds: Array<"online" | "website">;
    render: (size: number) => React.ReactNode;
}
const renderLetter = (letter: string) => (size: number) => (
    <span style={{ fontSize: size, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }} aria-hidden>
        {letter}
    </span>
);
const PLATFORM_ICONS: PlatformIconMeta[] = [
    // Online-platform brand icons
    { key: "upwork", label: "Upwork", brand: "#14a800", kinds: ["online"], render: (s) => <UpworkGlyph size={s} /> },
    { key: "linkedin", label: "LinkedIn", brand: "#0a66c2", kinds: ["online"], render: (s) => <Linkedin size={s} strokeWidth={2.4} /> },
    { key: "freelancer", label: "Freelancer", brand: "#29b2fe", kinds: ["online"], render: (s) => <FreelancerGlyph size={s} /> },
    { key: "fiverr", label: "Fiverr", brand: "#1dbf73", kinds: ["online"], render: (s) => <FiverrGlyph size={s} /> },
    { key: "toptal", label: "Toptal", brand: "#204ecf", kinds: ["online"], render: renderLetter("T") },
    { key: "guru", label: "Guru", brand: "#ff7a18", kinds: ["online"], render: renderLetter("G") },
    { key: "peopleperhour", label: "PeoplePerHour", brand: "#ff7c00", kinds: ["online"], render: renderLetter("P") },
    { key: "hubstaff", label: "Hubstaff", brand: "#3aabea", kinds: ["online"], render: renderLetter("H") },
    { key: "indeed", label: "Indeed", brand: "#003a9b", kinds: ["online"], render: renderLetter("I") },

    // Own-website generic icons (5 common picks for marketing sites / contact forms)
    { key: "globe", label: "Web presence", brand: "#6366f1", kinds: ["website", "online"], render: (s) => <Globe size={s} strokeWidth={2.2} /> },
    { key: "sparkles", label: "Marketing site", brand: "#8b5cf6", kinds: ["website"], render: (s) => <Sparkles size={s} strokeWidth={2.2} /> },
    { key: "briefcase", label: "Business site", brand: "#475569", kinds: ["website", "online"], render: (s) => <Briefcase size={s} strokeWidth={2.2} /> },
    { key: "star", label: "Featured / SaaS", brand: "#f59e0b", kinds: ["website"], render: (s) => <Star size={s} strokeWidth={2.2} /> },
    { key: "zap", label: "Launch / product", brand: "#ec4899", kinds: ["website"], render: (s) => <Zap size={s} strokeWidth={2.2} /> },
];
const ICON_BY_KEY: Record<string, PlatformIconMeta> = PLATFORM_ICONS.reduce(
    (acc, i) => { acc[i.key] = i; return acc; }, {} as Record<string, PlatformIconMeta>,
);

// Suggestion catalogue for the "New Action" drawer. Categories drive the
// Display Name dropdown AND auto-fill icon + color. Per-type overrides let
// "negative" actions (rejected, missed, lost) flag in red without rewriting
// the category default. Users can still type free-form anything.
interface ActionTypePreset { name: string; icon?: string; color?: string; }
interface ActionCategoryPreset {
    category: string;
    icon: string;
    color: string;
    types: ActionTypePreset[];
}
const WORKFLOW_ACTION_PRESETS: ActionCategoryPreset[] = [
    {
        category: "Communication",
        icon: "phone", color: "#3b82f6",
        types: [
            { name: "Call Attended", icon: "phone", color: "#10b981" },
            { name: "Call Rejected", icon: "close", color: "#f59e0b" },
            { name: "Call Missed", icon: "close", color: "#f59e0b" },
            { name: "Voicemail Left", icon: "phone", color: "#94a3b8" },
            { name: "SMS Sent", icon: "message", color: "#3b82f6" },
            { name: "WhatsApp Sent", icon: "message", color: "#10b981" },
        ],
    },
    {
        category: "Email",
        icon: "mail", color: "#3b82f6",
        types: [
            { name: "Initial Outreach", icon: "send", color: "#3b82f6" },
            { name: "Follow-up Sent", icon: "send", color: "#f59e0b" },
            { name: "Reply Received", icon: "mail", color: "#10b981" },
            { name: "Email Opened", icon: "mail", color: "#3b82f6" },
            { name: "Email Bounced", icon: "close", color: "#f59e0b" },
            { name: "Unsubscribed", icon: "close", color: "#94a3b8" },
        ],
    },
    {
        category: "Meetings",
        icon: "calendar", color: "#10b981",
        types: [
            { name: "Discovery Call Scheduled", icon: "phone", color: "#3b82f6" },
            { name: "Demo Scheduled", icon: "calendar", color: "#f59e0b" },
            { name: "Demo Completed", icon: "check", color: "#10b981" },
            { name: "No-show", icon: "close", color: "#f59e0b" },
            { name: "Rescheduled", icon: "clock", color: "#f59e0b" },
            { name: "Internal Sync", icon: "team", color: "#3b82f6" },
        ],
    },
    {
        category: "Documentation",
        icon: "file", color: "#f59e0b",
        types: [
            { name: "Proposal Sent", icon: "send", color: "#3b82f6" },
            { name: "Contract Sent", icon: "file", color: "#f59e0b" },
            { name: "NDA Signed", icon: "check", color: "#10b981" },
            { name: "Quote Generated", icon: "file", color: "#3b82f6" },
            { name: "Invoice Sent", icon: "send", color: "#10b981" },
            { name: "Onboarding Doc Shared", icon: "link", color: "#3b82f6" },
        ],
    },
    {
        category: "Pipeline",
        icon: "send", color: "#f59e0b",
        types: [
            { name: "Stage Advanced", icon: "send", color: "#10b981" },
            { name: "Stage Reverted", icon: "link", color: "#f59e0b" },
            { name: "Marked as Won", icon: "check", color: "#10b981" },
            { name: "Marked as Lost", icon: "close", color: "#f59e0b" },
            { name: "Disqualified", icon: "close", color: "#94a3b8" },
            { name: "Reactivated", icon: "check", color: "#3b82f6" },
        ],
    },
    {
        category: "Research",
        icon: "user", color: "#3b82f6",
        types: [
            { name: "LinkedIn Profile Reviewed", icon: "user", color: "#3b82f6" },
            { name: "Company Website Checked", icon: "link", color: "#3b82f6" },
            { name: "Competitor Analysis", icon: "user", color: "#f59e0b" },
            { name: "Persona Mapped", icon: "team", color: "#3b82f6" },
            { name: "BANT Qualification", icon: "check", color: "#10b981" },
        ],
    },
    {
        category: "Notes",
        icon: "message", color: "#94a3b8",
        types: [
            { name: "Internal Note Added", icon: "message", color: "#94a3b8" },
            { name: "Decision Logged", icon: "check", color: "#10b981" },
            { name: "Risk Flagged", icon: "close", color: "#f59e0b" },
            { name: "Follow-up Reminder Set", icon: "clock", color: "#f59e0b" },
        ],
    },
];
// Curated icon set for pipeline statuses — 10 picks that DON'T overlap with
// the workflow-action icon list (phone/mail/clock/user/file/calendar/message/
// video/check/close/team/send/link) so the two pickers feel distinct.
interface StatusIconMeta {
    key: string;
    label: string;
    render: (size: number) => React.ReactNode;
}
const STATUS_ICON_OPTIONS: StatusIconMeta[] = [
    { key: "flag", label: "Milestone", render: (s) => <Flag size={s} strokeWidth={2.2} /> },
    { key: "target", label: "Qualified", render: (s) => <Target size={s} strokeWidth={2.2} /> },
    { key: "compass", label: "Discovery", render: (s) => <Compass size={s} strokeWidth={2.2} /> },
    { key: "sparkles", label: "Opportunity", render: (s) => <Sparkles size={s} strokeWidth={2.2} /> },
    { key: "megaphone", label: "Outreach", render: (s) => <Megaphone size={s} strokeWidth={2.2} /> },
    { key: "handshake", label: "Negotiation", render: (s) => <Handshake size={s} strokeWidth={2.2} /> },
    { key: "rocket", label: "Launch", render: (s) => <Rocket size={s} strokeWidth={2.2} /> },
    { key: "shield-check", label: "Verified", render: (s) => <ShieldCheck size={s} strokeWidth={2.2} /> },
    { key: "trophy", label: "Won", render: (s) => <Trophy size={s} strokeWidth={2.2} /> },
    { key: "award", label: "Converted", render: (s) => <Award size={s} strokeWidth={2.2} /> },
];
const STATUS_ICON_BY_KEY: Record<string, StatusIconMeta> = STATUS_ICON_OPTIONS.reduce(
    (acc, i) => { acc[i.key] = i; return acc; }, {} as Record<string, StatusIconMeta>,
);
const renderStatusIcon = (key: string | undefined, size: number, color?: string) => {
    if (!key) return null;
    const meta = STATUS_ICON_BY_KEY[key];
    if (!meta) return null;
    return <span style={{ color: normalizeColor(color), display: "inline-flex" }}>{meta.render(size)}</span>;
};

// Suggestion catalogue for the "New Status" drawer. Names auto-fill category +
// color + icon (and isFinalStage for terminal states). Users can still freely type.
interface PipelineStatusPreset {
    name: string;
    category: string;
    color: string;
    icon: string;
    isFinal?: boolean;
}
const PIPELINE_STATUS_PRESETS: PipelineStatusPreset[] = [
    // Top of funnel
    { name: "Lead Captured", category: "prospecting", color: "#94a3b8", icon: "flag" },
    { name: "Qualified", category: "qualifying", color: "#3b82f6", icon: "target" },
    { name: "Disqualified", category: "qualifying", color: "#94a3b8", icon: "target" },
    // Assignment / outreach
    { name: "Assigned", category: "assignment", color: "#3b82f6", icon: "flag" },
    { name: "Contacted", category: "outreach", color: "#3b82f6", icon: "megaphone" },
    { name: "Follow Up", category: "outreach", color: "#f59e0b", icon: "megaphone" },
    // Meetings
    { name: "Discovery Call", category: "meetings", color: "#3b82f6", icon: "compass" },
    { name: "Demo Scheduled", category: "meetings", color: "#f59e0b", icon: "compass" },
    { name: "Demo Completed", category: "meetings", color: "#10b981", icon: "shield-check" },
    // Proposal / negotiation
    { name: "Proposal Draft", category: "proposal", color: "#f59e0b", icon: "sparkles" },
    { name: "Proposal Sent", category: "proposal", color: "#3b82f6", icon: "rocket" },
    { name: "Negotiation", category: "negotiation", color: "#f59e0b", icon: "handshake" },
    // Holding states
    { name: "On Hold", category: "paused", color: "#f59e0b", icon: "flag" },
    { name: "Nurturing", category: "paused", color: "#94a3b8", icon: "sparkles" },
    // Terminal
    { name: "Won", category: "closed_won", color: "#10b981", icon: "trophy", isFinal: true },
    { name: "Lost", category: "closed_lost", color: "#f59e0b", icon: "flag", isFinal: true },
    { name: "Converted Clients", category: "converted", color: "#10b981", icon: "award", isFinal: true },
];
const STATUS_BY_NAME: Record<string, PipelineStatusPreset> = PIPELINE_STATUS_PRESETS.reduce(
    (acc, p) => { acc[p.name.toLowerCase()] = p; return acc; },
    {} as Record<string, PipelineStatusPreset>,
);
// Unique categories with a default color (first preset that uses the category).
const PIPELINE_CATEGORY_PRESETS: Array<{ category: string; color: string; count: number }> = (() => {
    const map = new Map<string, { category: string; color: string; count: number }>();
    PIPELINE_STATUS_PRESETS.forEach(p => {
        const existing = map.get(p.category);
        if (existing) existing.count += 1;
        else map.set(p.category, { category: p.category, color: p.color, count: 1 });
    });
    return Array.from(map.values());
})();
const PIPELINE_CATEGORY_BY_KEY: Record<string, { category: string; color: string }> =
    PIPELINE_CATEGORY_PRESETS.reduce(
        (acc, p) => { acc[p.category.toLowerCase()] = { category: p.category, color: p.color }; return acc; },
        {} as Record<string, { category: string; color: string }>,
    );

const CATEGORY_BY_NAME: Record<string, ActionCategoryPreset> = WORKFLOW_ACTION_PRESETS.reduce(
    (acc, p) => { acc[p.category.toLowerCase()] = p; return acc; },
    {} as Record<string, ActionCategoryPreset>,
);
// Reverse index: type name → { category, icon, color }. Used when the user
// picks a display name first so we can back-fill category + visual identity.
const TYPE_LOOKUP: Record<string, { category: string; icon: string; color: string }> = WORKFLOW_ACTION_PRESETS.reduce(
    (acc, p) => {
        p.types.forEach(t => {
            acc[t.name.toLowerCase()] = {
                category: p.category,
                icon: t.icon || p.icon,
                color: t.color || p.color,
            };
        });
        return acc;
    },
    {} as Record<string, { category: string; icon: string; color: string }>,
);

const parseLogoValue = (v?: string): { kind: "icon" | "image" | "none"; iconKey?: string; src?: string } => {
    if (!v) return { kind: "none" };
    if (v.startsWith("icon:")) return { kind: "icon", iconKey: v.slice(5) };
    return { kind: "image", src: v };
};
const renderPlatformLogo = (v: string | undefined, size: number, fallbackColor: string = "var(--text-slate-400)", useBrandColor: boolean = true) => {
    const parsed = parseLogoValue(v);
    if (parsed.kind === "icon") {
        const meta = ICON_BY_KEY[parsed.iconKey!];
        if (meta) {
            return (
                <span style={{ color: useBrandColor ? meta.brand : 'currentColor', display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    {meta.render(size)}
                </span>
            );
        }
    }
    if (parsed.kind === "image") {
        return <img src={parsed.src} alt="" />;
    }
    return <span style={{ color: fallbackColor, display: "inline-flex" }}><ImageIcon size={size} /></span>;
};

const normalizeColor = (color?: any): string => {
    if (!color) return "#94a3b8"; // default grey
    const c = String(color).toLowerCase();
    if (c === "#3b82f6" || c === "blue" || c.includes("blue") || c === "#0ea5e9" || c === "#06b6d4" || c === "#6366f1" || c === "#096dd9") {
        return "#3b82f6"; // blue
    }
    if (c === "#10b981" || c === "green" || c.includes("green") || c === "#25d366" || c === "#14a800" || c === "#1dbf73") {
        return "#10b981"; // green
    }
    if (c === "#f59e0b" || c === "orange" || c.includes("orange") || c === "#ff7a18" || c === "#ff7c00" || c === "#ec4899" || c === "#ef4444" || c === "#8b5cf6") {
        return "#f59e0b"; // light orange
    }
    return "#94a3b8"; // grey
};

// Suggestion catalogue for the "New Action" drawer. Categories drive the
// Two-mode logo picker — built-in icon OR custom uploaded image. The pair is
// mutually exclusive: switching to the other mode just hides the inactive UI.
// `platformKind` filters the icon grid (own-website sources see a curated set
// of generic icons rather than the long gig-platform list).
const PlatformLogoPicker: React.FC<{
    value?: string;
    onChange?: (v?: string) => void;
    onError?: (msg: string) => void;
    platformKind?: "online" | "website";
}> = ({ value, onChange, onError, platformKind = "online" }) => {
    const parsed = parseLogoValue(value);
    const [mode, setMode] = React.useState<"icon" | "image">(parsed.kind === "image" ? "image" : "icon");
    const visibleIcons = PLATFORM_ICONS.filter(i => i.kinds.includes(platformKind));

    React.useEffect(() => {
        // If the value is set externally (e.g., picking a curated platform seeds
        // an icon), align the visible mode with the actual value.
        if (parsed.kind === "icon") setMode("icon");
        else if (parsed.kind === "image") setMode("image");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const handleBefore = (file: File) => {
        if (!file.type.startsWith("image/")) {
            onError?.("Logo must be an image");
            return Upload.LIST_IGNORE;
        }
        if (file.size > 512 * 1024) {
            onError?.("Logo must be under 512 KB");
            return Upload.LIST_IGNORE;
        }
        const reader = new FileReader();
        reader.onload = () => onChange?.(reader.result as string);
        reader.onerror = () => onError?.("Failed to read file");
        reader.readAsDataURL(file);
        return false;
    };

    return (
        <div className="lset-logo-picker">
            <Segmented
                block
                value={mode}
                onChange={(v) => setMode(v as "icon" | "image")}
                options={[
                    { value: "icon", label: <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5 }}><Sparkles size={11} /> Built-in icon</span> },
                    { value: "image", label: <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5 }}><ImageIcon size={11} /> Custom image</span> },
                ]}
                className="lset-logo-mode"
            />

            {mode === "icon" ? (
                <div className="lset-icon-grid" role="radiogroup" aria-label="Pick an icon">
                    {visibleIcons.map(icon => {
                        const isActive = parsed.kind === "icon" && parsed.iconKey === icon.key;
                        return (
                            <button
                                type="button"
                                key={icon.key}
                                role="radio"
                                aria-checked={isActive}
                                title={icon.label}
                                className={`lset-icon-tile${isActive ? " is-active" : ""}`}
                                style={isActive ? { borderColor: icon.brand, background: `${icon.brand}14` } : {}}
                                onClick={() => onChange?.(`icon:${icon.key}`)}
                            >
                                <span style={{ color: icon.brand, display: "inline-flex" }}>{icon.render(16)}</span>
                                {isActive && (
                                    <span className="lset-icon-tile-check" style={{ background: icon.brand }}>
                                        <Check size={9} strokeWidth={3} />
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            ) : parsed.kind === "image" ? (
                <div className="lset-logo-preview">
                    <img src={parsed.src} alt="logo preview" />
                    <div className="lset-logo-preview-actions">
                        <Upload showUploadList={false} beforeUpload={handleBefore} accept="image/*">
                            <Button size="small" icon={<UploadIcon size={12} />}>Replace</Button>
                        </Upload>
                        <Button size="small" danger icon={<XIcon size={12} />} onClick={() => onChange?.(undefined)}>Remove</Button>
                    </div>
                </div>
            ) : (
                <Upload.Dragger showUploadList={false} beforeUpload={handleBefore} accept="image/*" className="lset-logo-dropzone">
                    <div className="lset-logo-drop-content">
                        <ImageIcon size={20} />
                        <div>
                            <div className="lset-logo-drop-title">Drop a logo or click to upload</div>
                            <div className="lset-logo-drop-sub">PNG / SVG / JPG · up to 512 KB</div>
                        </div>
                    </div>
                </Upload.Dragger>
            )}
        </div>
    );
};

// Smooth area sparkline used inside the stat cards (doc-hub style).
const AreaSparkline = ({ values, color }: { values: number[]; color: string }) => {
    const w = 96;
    const h = 34;
    const max = Math.max(...values, 1);
    const n = values.length;
    const stepX = n > 1 ? w / (n - 1) : w;
    const pts = values.map((v, i) => {
        const x = i * stepX;
        const y = h - 3 - (v / max) * (h - 8);
        return [x, y] as const;
    });
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const area = `${line} L${w},${h} L0,${h} Z`;
    const gid = `spk-${color.replace(/[^a-z0-9]/gi, '')}`;
    return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: 'block' }}>
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <path d={line} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

export default function LeadSettingsPage() {
    useActivitySource({ section: "WORK", module: "Leads", page: "LeadSettings" });
    const { user, isLoading } = useAuth();
    const {
        canManageLeads,
        canCreateLeadSetting,
        canUpdateLeadSetting,
        canDeleteLeadSetting
    } = usePermission();
    const router = useRouter();

    // ─── Route Guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoading && user && !canManageLeads) {
            router.push("/dashboard");
        }
    }, [user, isLoading, canManageLeads, router]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState<"1" | "2" | "3">("1");
    const [editingId, setEditingId] = useState<string | null>(null);
    const { message } = App.useApp();
    const [searchText, setSearchText] = useState("");
    const [filterMode, setFilterMode] = useState<"all" | "active" | "hidden">("all");
    const [view, setView] = useState<"list" | "grid">("grid");
    const [tablePage, setTablePage] = useState(1);
    const [tablePageSize, setTablePageSize] = useState(20);

    const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

    useEffect(() => {
        setTablePage(1);
    }, [activeTab, searchText, filterMode]);

    const {
        statuses,
        actions,
        platforms,
        fetchStatuses,
        fetchActions,
        fetchPlatforms,
        createStatus,
        updateStatus,
        createAction,
        updateAction,
        createPlatform,
        updatePlatform,
        deletePlatform,
        deleteStatus,
        deleteAction,
        loading
    } = useLeadSettings();

    const [dataSource, setDataSource] = useState<any[]>([]);
    const [actionDataSource, setActionDataSource] = useState<any[]>([]);
    const [platformDataSource, setPlatformDataSource] = useState<any[]>([]);

    useEffect(() => {
        fetchStatuses();
        fetchActions();
        fetchPlatforms();
    }, [fetchStatuses, fetchActions, fetchPlatforms]);

    useEffect(() => {
        setDataSource(statuses.map((s, i) => ({
            key: s.id,
            id: s.id,
            sno: i + 1,
            statusName: s.name,
            category: s.category,
            appliesTo: s.applies_to?.join(", "),
            color: normalizeColor(s.color),
            icon: s.icon,
            isDefault: s.is_default,
            isFinal: s.is_final_stage,
            isActive: s.is_active,
            order: s.order,
        })));
    }, [statuses]);

    useEffect(() => {
        setActionDataSource(actions.map((a, i) => ({
            key: a.id,
            id: a.id,
            sno: i + 1,
            actionName: a.name,
            type: a.type,
            icon: a.icon,
            color: normalizeColor(a.color),
            isActive: a.is_active,
            created: new Date(a.createdAt || Date.now()).toLocaleDateString(),
        })));
    }, [actions]);

    useEffect(() => {
        setPlatformDataSource(platforms.map((p, i) => ({
            key: p.id,
            id: p.id,
            sno: i + 1,
            name: p.name,
            code: p.code,
            type: p.type,
            url: p.url,
            logoUrl: p.logo_url,
            description: p.description,
            isActive: p.is_active,
            // `color` keyed for the "Themed" stat — platforms count as themed when they have a logo.
            color: p.logo_url ? '#3b82f6' : undefined,
        })));
    }, [platforms]);

    // Derive the immutable code (Upwork → UPWORK, "Own Website" → OWN_WEBSITE).
    const derivePlatformCode = (name: string) =>
        (name || '')
            .normalize('NFKD')
            .replace(/[^\p{Letter}\p{Number}\s]/gu, '')
            .trim()
            .toUpperCase()
            .replace(/\s+/g, '_')
            .slice(0, 80);

    // Curated list of known gig platforms. Picking one auto-fills name + URL
    // (and the immutable code). "Other" drops back to a free-text name input.
    const KNOWN_ONLINE_PLATFORMS: Array<{ name: string; url: string; brand: string; iconKey: string }> = [
        { name: "Upwork", url: "https://www.upwork.com", brand: "#14a800", iconKey: "upwork" },
        { name: "LinkedIn", url: "https://www.linkedin.com", brand: "#0a66c2", iconKey: "linkedin" },
        { name: "Freelancer", url: "https://www.freelancer.com", brand: "#29b2fe", iconKey: "freelancer" },
        { name: "Fiverr", url: "https://www.fiverr.com", brand: "#1dbf73", iconKey: "fiverr" },
        { name: "Toptal", url: "https://www.toptal.com", brand: "#204ecf", iconKey: "toptal" },
        { name: "Guru", url: "https://www.guru.com", brand: "#ff7a18", iconKey: "guru" },
        { name: "PeoplePerHour", url: "https://www.peopleperhour.com", brand: "#ff7c00", iconKey: "peopleperhour" },
        { name: "Hubstaff Talent", url: "https://talent.hubstaff.com", brand: "#3aabea", iconKey: "hubstaff" },
        { name: "Indeed", url: "https://www.indeed.com", brand: "#003a9b", iconKey: "indeed" },
    ];
    const platformTypeWatch = Form.useWatch("platformType", form);
    const platformPickerWatch = Form.useWatch("platformPicker", form);
    const actionCategoryWatch = Form.useWatch("actionType", form);

    // Display Name options — filter by the current category if it matches a
    // preset; otherwise show every catalogue type so free-form typing still
    // gets suggestions.
    const actionNameOptions = useMemo(() => {
        const match = CATEGORY_BY_NAME[(actionCategoryWatch || "").toLowerCase()];
        const types = match ? match.types : WORKFLOW_ACTION_PRESETS.flatMap(p => p.types);
        return types.map(t => ({ value: t.name, label: t.name }));
    }, [actionCategoryWatch]);

    const actionCategoryOptions = WORKFLOW_ACTION_PRESETS.map(p => ({
        value: p.category,
        label: (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontWeight: 600 }}>{p.category}</span>
                <Text type="secondary" style={{ fontSize: 10.5 }}>· {p.types.length} suggestions</Text>
            </span>
        ),
    }));

    // Auto-fill icon + color when the user picks (not types) a preset. Editing
    // an existing action skips this so it doesn't stomp the saved appearance.
    const applyCategoryPreset = (category: string) => {
        if (editingId) return;
        const preset = CATEGORY_BY_NAME[category.toLowerCase()];
        if (!preset) return;
        form.setFieldsValue({ icon: preset.icon, color: preset.color });
    };
    const applyTypePreset = (typeName: string) => {
        if (editingId) return;
        const match = TYPE_LOOKUP[typeName.toLowerCase()];
        if (!match) return;
        const updates: any = { icon: match.icon, color: match.color };
        if (form.getFieldValue("actionType") !== match.category) {
            updates.actionType = match.category;
        }
        form.setFieldsValue(updates);
    };

    // Status-form presets — picking a known status name auto-fills category,
    // color and isFinalStage; picking a known category fills color only.
    const applyStatusNamePreset = (name: string) => {
        if (editingId) return;
        const match = STATUS_BY_NAME[name.toLowerCase()];
        if (!match) return;
        const updates: any = {
            category: match.category,
            color: match.color,
            statusIcon: match.icon,
        };
        if (typeof match.isFinal === "boolean") updates.isFinalStage = match.isFinal;
        form.setFieldsValue(updates);
    };
    const applyStatusCategoryPreset = (category: string) => {
        if (editingId) return;
        const match = PIPELINE_CATEGORY_BY_KEY[category.toLowerCase()];
        if (!match) return;
        form.setFieldsValue({ color: match.color });
    };

    const statusCategoryWatch = Form.useWatch("category", form);

    // Filter the status-name suggestions by the chosen category. When nothing
    // matches a preset, show the full list so free-text typing still helps.
    const statusNameOptions = useMemo(() => {
        const cat = (statusCategoryWatch || "").toLowerCase();
        const inCategory = PIPELINE_STATUS_PRESETS.filter(p => p.category.toLowerCase() === cat);
        const list = inCategory.length > 0 ? inCategory : PIPELINE_STATUS_PRESETS;
        return list.map(p => ({
            value: p.name,
            label: p.name,
            description: p.isFinal ? `${p.category} · terminal stage` : p.category,
            badge: (
                <span
                    aria-hidden
                    style={{
                        width: "100%", height: "100%",
                        background: `${p.color}1f`,
                        color: p.color,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                    }}
                >
                    {p.name.slice(0, 1).toUpperCase()}
                </span>
            ),
        }));
    }, [statusCategoryWatch]);

    const statusCategoryOptions = PIPELINE_CATEGORY_PRESETS.map(p => ({
        value: p.category,
        label: p.category,
        description: `${p.count} suggested ${p.count === 1 ? "status" : "statuses"}`,
        badge: (
            <span
                aria-hidden
                style={{
                    width: "100%", height: "100%",
                    background: `${p.color}1f`,
                    color: p.color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 800,
                }}
            >
                ●
            </span>
        ),
    }));

    const moveRow = async (index: number, direction: "up" | "down") => {
        const newData = [...statuses];
        if (direction === "up" && index > 0) {
            const temp = newData[index];
            newData[index] = newData[index - 1];
            newData[index - 1] = temp;
        } else if (direction === "down" && index < newData.length - 1) {
            const temp = newData[index];
            newData[index] = newData[index + 1];
            newData[index + 1] = temp;
        }
        try {
            await Promise.all(newData.map((item, i) => updateStatus(item.id, { order: i })));
            message.success("Order Updated");
        } catch (error) {
            message.error("Failed to update order");
        }
    };

    const showDrawer = () => {
        setEditingId(null);
        form.resetFields();
        // Seed the platform-form default so the Segmented's visually-selected
        // "Online platform" matches an actual form value and the downstream
        // identity / branding / status sections render on first open.
        if (activeTab === "3") {
            form.setFieldsValue({ platformType: "online", isActive: true });
        }
        setIsDrawerOpen(true);
    };

    const handleToggleStatusProperty = async (id: string, property: string, value: boolean) => {
        try {
            const backendField = property === "isDefault" ? "is_default" :
                property === "isFinal" ? "is_final_stage" : "is_active";
            if (property === "isDefault" && value === true) {
                const existingDefault = statuses.find(s => s.is_default && s.id !== id);
                if (existingDefault) {
                    await updateStatus(existingDefault.id, { is_default: false });
                }
            }
            await updateStatus(id, { [backendField]: value });
            message.success("Status Updated");
        } catch (error) {
            message.error("Failed to update status");
        }
    };

    const handleToggleActionProperty = async (id: string, value: boolean) => {
        try {
            await updateAction(id, { is_active: value });
            message.success("Action Updated");
        } catch (error) {
            message.error("Failed to update action");
        }
    };

    const handleEditStatus = (record: any) => {
        setEditingId(record.id);
        form.setFieldsValue({
            statusName: record.statusName,
            category: record.category,
            color: record.color,
            statusIcon: record.icon,
            appliesTo: record.appliesTo ? record.appliesTo.split(", ") : [],
            isDefault: record.isDefault,
            isFinalStage: record.isFinal,
            isActive: record.isActive,
        });
        setIsDrawerOpen(true);
    };

    const handleEditAction = (record: any) => {
        setEditingId(record.id);
        form.setFieldsValue({
            actionName: record.actionName,
            actionType: record.type,
            icon: record.icon,
            color: record.color,
            isActive: record.isActive,
        });
        setIsDrawerOpen(true);
    };

    const handleEditPlatform = (record: any) => {
        setEditingId(record.id);
        const picker =
            record.type === "online"
                ? (KNOWN_ONLINE_PLATFORMS.some(p => p.name === record.name) ? record.name : "__other__")
                : undefined;
        form.setFieldsValue({
            platformType: record.type,
            platformPicker: picker,
            platformName: record.name,
            platformCode: record.code,
            platformUrl: record.url,
            platformLogo: record.logoUrl,
            platformDescription: record.description,
            isActive: record.isActive,
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            if (activeTab === "1") {
                const payload = {
                    name: values.statusName,
                    category: values.category,
                    color: typeof values.color === "string" ? values.color : values.color?.toHexString?.() || values.color,
                    icon: values.statusIcon || null,
                    applies_to: values.appliesTo || [],
                    is_default: values.isDefault ?? false,
                    is_final_stage: values.isFinalStage ?? false,
                    is_active: values.isActive ?? true,
                };
                if (editingId) await updateStatus(editingId, payload);
                else await createStatus(payload);
            } else if (activeTab === "2") {
                const payload = {
                    name: values.actionName,
                    type: values.actionType,
                    icon: values.icon,
                    color: typeof values.color === "string" ? values.color : values.color?.toHexString?.() || values.color,
                    is_active: values.isActive ?? true,
                };
                if (editingId) await updateAction(editingId, payload);
                else await createAction(payload);
            } else {
                const payload = {
                    name: values.platformName,
                    type: values.platformType,
                    url: values.platformUrl,
                    logo_url: values.platformLogo,
                    description: values.platformDescription,
                    is_active: values.isActive ?? true,
                };
                if (editingId) await updatePlatform(editingId, payload);
                else await createPlatform(payload);
            }
            const noun = activeTab === "1" ? "Status" : activeTab === "2" ? "Action" : "Platform";
            message.success(`${noun} ${editingId ? "updated" : "created"} successfully`);
            setIsDrawerOpen(false);
            setEditingId(null);
            form.resetFields();
        } catch (error: any) {
            console.error("Validation or API Failed:", error);
            const errorMessage = error.response?.data?.error || error.message || "An unexpected error occurred";
            message.error(errorMessage);
        }
    };

    const handleCancel = () => {
        setIsDrawerOpen(false);
        setEditingId(null);
        form.resetFields();
    };

    const renderIcon = (iconName: string) => {
        switch (iconName) {
            case "phone": return <PhoneOutlined />;
            case "mail": return <MailOutlined />;
            case "clock": return <ClockCircleOutlined />;
            case "user": return <UserOutlined />;
            case "file": return <FileOutlined />;
            case "calendar": return <CalendarOutlined />;
            case "message": return <MessageOutlined />;
            case "video": return <VideoCameraOutlined />;
            case "check": return <CheckCircleOutlined />;
            case "close": return <CloseCircleOutlined />;
            case "team": return <TeamOutlined />;
            case "send": return <SendOutlined />;
            case "link": return <LinkOutlined />;
            default: return null;
        }
    };

    const iconOptions = [
        { value: "phone", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><PhoneOutlined /> Phone</span> },
        { value: "mail", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MailOutlined /> Mail</span> },
        { value: "clock", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><ClockCircleOutlined /> Clock</span> },
        { value: "user", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><UserOutlined /> User</span> },
        { value: "file", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><FileOutlined /> File</span> },
        { value: "calendar", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CalendarOutlined /> Calendar</span> },
        { value: "message", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><MessageOutlined /> Message</span> },
        { value: "video", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><VideoCameraOutlined /> Video</span> },
        { value: "check", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircleOutlined /> Check</span> },
        { value: "close", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><CloseCircleOutlined /> Close</span> },
        { value: "team", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><TeamOutlined /> Team</span> },
        { value: "send", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><SendOutlined /> Send</span> },
        { value: "link", label: <span style={{ display: "flex", alignItems: "center", gap: 8 }}><LinkOutlined /> Link</span> },
    ];

    const filteredStatuses = useMemo(
        () => dataSource
            .filter(d =>
                d.statusName?.toLowerCase().includes(searchText.toLowerCase()) ||
                d.category?.toLowerCase().includes(searchText.toLowerCase())
            )
            .filter(d => {
                if (filterMode === "active") return d.isActive;
                if (filterMode === "hidden") return !d.isActive;
                return true;
            }),
        [dataSource, searchText, filterMode]
    );

    const filteredActions = useMemo(
        () => actionDataSource
            .filter(d =>
                d.actionName?.toLowerCase().includes(searchText.toLowerCase()) ||
                d.type?.toLowerCase().includes(searchText.toLowerCase())
            )
            .filter(d => {
                if (filterMode === "active") return d.isActive;
                if (filterMode === "hidden") return !d.isActive;
                return true;
            }),
        [actionDataSource, searchText, filterMode]
    );

    const filteredPlatforms = useMemo(
        () => platformDataSource
            .filter(d => {
                if (!searchText.trim()) return true;
                const q = searchText.toLowerCase();
                return (
                    d.name?.toLowerCase().includes(q) ||
                    d.code?.toLowerCase().includes(q) ||
                    d.url?.toLowerCase().includes(q) ||
                    d.type?.toLowerCase().includes(q)
                );
            })
            .filter(d => {
                if (filterMode === "active") return d.isActive;
                if (filterMode === "hidden") return !d.isActive;
                return true;
            }),
        [platformDataSource, searchText, filterMode]
    );

    const filteredItems = useMemo(() => {
        if (activeTab === "1") return filteredStatuses;
        if (activeTab === "2") return filteredActions;
        return filteredPlatforms;
    }, [activeTab, filteredStatuses, filteredActions, filteredPlatforms]);

    const total = filteredItems.length;
    const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
    const pageEnd = Math.min(tablePage * tablePageSize, total);
    const pageCount = Math.max(1, Math.ceil(total / tablePageSize));

    const pagedStatuses = useMemo(() => {
        if (activeTab !== "1") return [];
        return filteredStatuses.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
    }, [filteredStatuses, tablePage, tablePageSize, activeTab]);

    const pagedActions = useMemo(() => {
        if (activeTab !== "2") return [];
        return filteredActions.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
    }, [filteredActions, tablePage, tablePageSize, activeTab]);

    const pagedPlatforms = useMemo(() => {
        if (activeTab !== "3") return [];
        return filteredPlatforms.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);
    }, [filteredPlatforms, tablePage, tablePageSize, activeTab]);

    const categoryMeta = [
        { key: "1" as const, label: "Pipeline Statuses", icon: <Activity size={16} />, accent: "#3b82f6", description: "Stages your leads flow through — color, default and final markers." },
        { key: "2" as const, label: "Workflow Actions", icon: <Workflow size={16} />, accent: "#f59e0b", description: "Operational triggers available across the lead workspace." },
        { key: "3" as const, label: "Platforms", icon: <Globe size={16} />, accent: "#10b981", description: "Sources leads come from — online gig platforms and your own websites." },
    ];

    const currentCat = categoryMeta.find(c => c.key === activeTab) || categoryMeta[0];
    const currentItems = activeTab === "1" ? dataSource : activeTab === "2" ? actionDataSource : platformDataSource;
    const currentActive = currentItems.filter((i: any) => i.isActive).length;
    const currentHidden = currentItems.length - currentActive;
    const currentThemed = currentItems.filter((i: any) => !!i.color).length;

    const stats = useMemo(() => {
        const activeStatuses = statuses.filter(s => s.is_active).length;
        const finalStages = statuses.filter(s => s.is_final_stage).length;
        const activeActions = actions.filter(a => a.is_active).length;
        return {
            statusCount: statuses.length,
            activeStatuses,
            finalStages,
            actionCount: actions.length,
            activeActions,
            defaultStatusName: statuses.find(s => s.is_default)?.name || "—",
        };
    }, [statuses, actions]);

    const statusColumns = [
        {
            title: "",
            key: "drag",
            width: 36,
            render: () => (
                <span className="lset-drag" aria-hidden>
                    <GripVertical size={14} />
                </span>
            ),
        },
        {
            title: "Order",
            dataIndex: "sno",
            key: "sno",
            width: 70,
            render: (text: number) => (
                <span className="lset-rank">
                    <Hash size={11} /> {text}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "statusName",
            key: "statusName",
            render: (text: string, record: any) => (
                <div className="lset-status-cell">
                    {record.icon && STATUS_ICON_BY_KEY[record.icon] ? (
                        <span
                            className="lset-status-icon"
                            style={{
                                background: `${record.color}14`,
                                color: record.color,
                                border: `1px solid ${record.color}33`,
                            }}
                            aria-hidden
                        >
                            {STATUS_ICON_BY_KEY[record.icon].render(12)}
                        </span>
                    ) : (
                        <span className="lset-color-dot" style={{ background: record.color, boxShadow: `0 0 0 4px ${record.color}22` }} />
                    )}
                    <div className="lset-status-text">
                        <span className="lset-pill" style={{ background: `${record.color}14`, color: record.color, border: `1px solid ${record.color}33` }}>
                            {text?.toUpperCase()}
                        </span>
                        <span className="lset-status-meta">{record.category || "uncategorized"}</span>
                    </div>
                </div>
            ),
        },
        {
            title: "Behavior",
            key: "behavior",
            width: 220,
            render: (_: any, record: any) => (
                <div className="lset-flag-row">
                    <Tooltip title="Default starter status for new leads">
                        <span
                            className={`lset-flag ${record.isDefault ? "is-on" : ""}`}
                            onClick={() => handleToggleStatusProperty(record.id, "isDefault", !record.isDefault)}
                            role="button"
                        >
                            <Star size={11} fill={record.isDefault ? "#f59e0b" : "transparent"} stroke={record.isDefault ? "#f59e0b" : "#94a3b8"} />
                            Default
                        </span>
                    </Tooltip>
                    <Tooltip title="Final/closing milestone">
                        <span
                            className={`lset-flag ${record.isFinal ? "is-final" : ""}`}
                            onClick={() => handleToggleStatusProperty(record.id, "isFinal", !record.isFinal)}
                            role="button"
                        >
                            <CheckCircle2 size={11} />
                            Final
                        </span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: "Visibility",
            dataIndex: "isActive",
            key: "isActive",
            width: 140,
            render: (isActive: boolean, record: any) => (
                <div className="lset-visibility">
                    <Switch
                        size="small"
                        checked={isActive}
                        onChange={(val) => handleToggleStatusProperty(record.id, "isActive", val)}
                        loading={loading}
                        disabled={!canUpdateLeadSetting}
                    />
                    <span className={`lset-vis-label ${isActive ? "is-on" : ""}`}>{isActive ? "Visible" : "Hidden"}</span>
                </div>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            align: "right" as const,
            width: 160,
            render: (_: any, record: any, index: number) => (
                <div className="lset-row-actions">
                    {canUpdateLeadSetting && (
                        <>
                            <Tooltip title="Move up">
                                <button className="lset-icon-btn" disabled={dataSource.findIndex(item => item.id === record.id) === 0} onClick={() => moveRow(dataSource.findIndex(item => item.id === record.id), "up")} aria-label="Move up">
                                    <ArrowUp size={14} />
                                </button>
                            </Tooltip>
                            <Tooltip title="Move down">
                                <button className="lset-icon-btn" disabled={dataSource.findIndex(item => item.id === record.id) === dataSource.length - 1} onClick={() => moveRow(dataSource.findIndex(item => item.id === record.id), "down")} aria-label="Move down">
                                    <ArrowDown size={14} />
                                </button>
                            </Tooltip>
                        </>
                    )}
                    {canUpdateLeadSetting && (
                        <Tooltip title="Edit">
                            <button className="lset-icon-btn" onClick={() => handleEditStatus(record)} aria-label="Edit">
                                <Edit2 size={14} />
                            </button>
                        </Tooltip>
                    )}
                    {canDeleteLeadSetting && (
                        <ConfirmDialog
                            tone="danger"
                            icon={<Trash2 size={16} />}
                            title="Delete Status?"
                            description="Leads using this status may need reassignment."
                            confirmText="Delete"
                            cancelText="Cancel"
                            placement="topRight"
                            onConfirm={async () => {
                                try {
                                    await deleteStatus(record.id);
                                    message.success("Status deleted successfully");
                                } catch (error) {
                                    message.error("Failed to delete status");
                                }
                            }}
                        >
                            <div onClick={(e) => e.stopPropagation()}>
                                <button className="lset-icon-btn lset-icon-danger" aria-label="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </ConfirmDialog>
                    )}
                </div>
            ),
        },
    ];

    const actionColumns = [
        {
            title: "Action",
            dataIndex: "actionName",
            key: "actionName",
            render: (text: string, record: any) => (
                <div className="lset-action-cell">
                    <span className="lset-action-icon" style={{ background: `${record.color}14`, color: record.color, border: `1px solid ${record.color}30` }}>
                        {renderIcon(record.icon)}
                    </span>
                    <div className="lset-action-text">
                        <span className="lset-action-name">{text}</span>
                        <span className="lset-action-meta">Workflow trigger</span>
                    </div>
                </div>
            ),
        },
        {
            title: "Category",
            dataIndex: "type",
            key: "type",
            render: (text: string) => (
                <span className="lset-cat-pill">
                    <Workflow size={10} /> {text}
                </span>
            ),
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "isActive",
            width: 140,
            render: (isActive: boolean, record: any) => (
                <div className="lset-visibility">
                    <Switch
                        size="small"
                        checked={isActive}
                        onChange={(val) => handleToggleActionProperty(record.id, val)}
                        loading={loading}
                        disabled={!canUpdateLeadSetting}
                    />
                    <span className={`lset-vis-label ${isActive ? "is-on" : ""}`}>{isActive ? "Active" : "Disabled"}</span>
                </div>
            ),
        },
        {
            title: "Created",
            dataIndex: "created",
            key: "created",
            width: 140,
            render: (text: string) => <span className="lset-meta-text">{text}</span>,
        },
        {
            title: "",
            key: "actions",
            align: "right" as const,
            width: 110,
            render: (_: any, record: any) => (
                <div className="lset-row-actions">
                    {canUpdateLeadSetting && (
                        <Tooltip title="Edit">
                            <button className="lset-icon-btn" onClick={() => handleEditAction(record)} aria-label="Edit">
                                <Edit2 size={14} />
                            </button>
                        </Tooltip>
                    )}
                    {canDeleteLeadSetting && (
                        <ConfirmDialog
                            tone="danger"
                            icon={<Trash2 size={16} />}
                            title="Remove Action?"
                            description="Are you sure you want to remove this action?"
                            confirmText="Remove"
                            cancelText="Cancel"
                            placement="topRight"
                            onConfirm={async () => {
                                try {
                                    await deleteAction(record.id);
                                    message.success("Action removed successfully");
                                } catch (error) {
                                    message.error("Failed to remove action");
                                }
                            }}
                        >
                            <div onClick={(e) => e.stopPropagation()}>
                                <button className="lset-icon-btn lset-icon-danger" aria-label="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </ConfirmDialog>
                    )}
                </div>
            ),
        },
    ];

    const platformColumns = [
        {
            title: "",
            key: "drag",
            width: 32,
            render: () => <span className="lset-drag" aria-hidden><GripVertical size={14} /></span>,
        },
        {
            title: "Order",
            dataIndex: "sno",
            key: "sno",
            width: 64,
            render: (text: number) => <span className="lset-rank"><Hash size={11} /> {text}</span>,
        },
        {
            title: "Platform",
            key: "name",
            render: (_: any, record: any) => (
                <div className="lset-platform-cell">
                    <div className="lset-platform-logo">
                        {renderPlatformLogo(record.logoUrl, 14)}
                    </div>
                    <div className="lset-platform-id">
                        <div className="lset-platform-name">{record.name}</div>
                        <div className="lset-platform-code">{record.code}</div>
                    </div>
                </div>
            ),
        },
        {
            title: "Type",
            dataIndex: "type",
            key: "type",
            width: 140,
            render: (type: string) => {
                const isOnline = type === "online";
                return (
                    <Tag
                        color={isOnline ? "blue" : "purple"}
                        style={{ borderRadius: 6, fontWeight: 700, fontSize: 11 }}
                    >
                        {isOnline ? "Online platform" : "Own website"}
                    </Tag>
                );
            },
        },
        {
            title: "URL",
            dataIndex: "url",
            key: "url",
            render: (url: string) => {
                if (!url) return <span style={{ color: "var(--text-slate-400)" }}>—</span>;
                // Prepend https:// when the saved value lacks a scheme so the link
                // doesn't resolve relative to the current path.
                const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
                return (
                    <a href={href} target="_blank" rel="noreferrer" className="lset-platform-url">
                        <Link2 size={12} /> {url}
                    </a>
                );
            },
        },
        {
            title: "Visibility",
            key: "isActive",
            width: 96,
            render: (_: any, record: any) => (
                <Switch
                    size="small"
                    checked={record.isActive}
                    onChange={async (checked) => {
                        try {
                            await updatePlatform(record.id, { is_active: checked });
                            message.success("Platform updated");
                        } catch {
                            message.error("Failed to update platform");
                        }
                    }}
                    disabled={!canUpdateLeadSetting}
                />
            ),
        },
        {
            title: "Manage",
            key: "actions",
            width: 88,
            render: (_: any, record: any) => (
                <div style={{ display: "flex", gap: 6 }}>
                    {canUpdateLeadSetting && (
                        <button className="lset-icon-btn" onClick={() => handleEditPlatform(record)} aria-label="Edit">
                            <Edit2 size={14} />
                        </button>
                    )}
                    {canDeleteLeadSetting && (
                        <ConfirmDialog
                            tone="danger"
                            icon={<Trash2 size={16} />}
                            title="Delete Platform?"
                            description="This cannot be undone."
                            confirmText="Delete"
                            cancelText="Cancel"
                            placement="topRight"
                            onConfirm={async () => {
                                try {
                                    await deletePlatform(record.id);
                                    message.success("Platform deleted");
                                } catch {
                                    message.error("Failed to delete platform");
                                }
                            }}
                        >
                            <div onClick={(e) => e.stopPropagation()}>
                                <button className="lset-icon-btn lset-icon-btn-danger" aria-label="Delete">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </ConfirmDialog>
                    )}
                </div>
            ),
        },
    ];

    const statCells = useMemo(() => {
        const days: Date[] = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (6 - i));
            return d;
        });
        const dayKey = (d: Date) => d.toISOString().slice(0, 10);
        const trendFor = (items: any[], predicate: (item: any) => boolean) => {
            const buckets = Object.fromEntries(days.map((d) => [dayKey(d), 0])) as Record<string, number>;
            items.filter(predicate).forEach((p) => {
                const dateVal = p.createdAt || p.created || Date.now();
                const k = dayKey(new Date(dateVal));
                if (k in buckets) buckets[k] += 1;
            });
            let runSum = 0;
            return days.map((d) => {
                runSum += buckets[dayKey(d)];
                return runSum;
            });
        };

        const currentItems = activeTab === "1" ? statuses : activeTab === "2" ? actions : platforms;
        const totalTrend = trendFor(currentItems, () => true);
        const activeTrend = trendFor(currentItems, (i) => i.is_active || i.isActive);
        const hiddenTrend = trendFor(currentItems, (i) => !(i.is_active || i.isActive));
        const themedTrend = trendFor(currentItems, (i) => !!(i.color || i.logoUrl || i.logo_url));

        const totalCount = currentItems.length;
        const activeCount = currentItems.filter((i: any) => i.is_active || i.isActive).length;
        const hiddenCount = totalCount - activeCount;
        const themedCount = currentItems.filter((i: any) => !!(i.color || i.logoUrl || i.logo_url)).length;

        return [
            { key: 'total', title: 'Total Definitions', value: totalCount, suffix: '', icon: activeTab === "1" ? <Activity size={14} /> : activeTab === "2" ? <Workflow size={14} /> : <Globe size={14} />, color: '#3b82f6', tint: 'rgba(59,130,246,0.10)', trend: totalTrend, delta: totalCount > 0 ? 1 : 0 },
            { key: 'active', title: 'Active Settings', value: activeCount, suffix: '', icon: <CheckCircle2 size={14} />, color: '#10b981', tint: 'rgba(16,185,129,0.10)', trend: activeTrend, delta: activeCount > 0 ? 1 : 0 },
            { key: 'hidden', title: 'Hidden Settings', value: hiddenCount, suffix: '', icon: <Eye size={14} />, color: '#94a3b8', tint: 'rgba(148,163,184,0.10)', trend: hiddenTrend, delta: hiddenCount > 0 ? 1 : 0 },
            { key: 'themed', title: 'Themed / Custom', value: themedCount, suffix: '', icon: <Star size={14} />, color: '#f59e0b', tint: 'rgba(245,158,11,0.10)', trend: themedTrend, delta: themedCount > 0 ? 1 : 0 },
        ];
    }, [activeTab, statuses, actions, platforms]);

    const activeLabel = activeTab === "1" ? "Pipeline Statuses" : activeTab === "2" ? "Workflow Actions" : "Platforms";
    const activeSingular = activeTab === "1" ? "Status" : activeTab === "2" ? "Action" : "Platform";

    const emptyState = (
        <div className="pp-empty">
            <div className="pp-empty-orb">{activeTab === "1" ? <Activity size={26} /> : activeTab === "2" ? <Workflow size={26} /> : <Globe size={26} />}</div>
            <div className="pp-empty-title">No {activeLabel.toLowerCase()} found</div>
            <div className="pp-empty-sub">Create your first {activeSingular.toLowerCase()} to get started.</div>
            {((activeTab === "1" && canCreateLeadSetting) || (activeTab === "2" && canCreateLeadSetting) || (activeTab === "3" && canCreateLeadSetting)) && (
                <Button type="primary" icon={<PlusOutlined />} className="pp-btn-primary" onClick={showDrawer} style={{ marginTop: 14 }}>
                    New {activeSingular}
                </Button>
            )}
        </div>
    );

    return (
        <ProtectedRoute>
            <MainLayout>
                <div className="pp-shell">
                    {mobileSidebarOpen && <div className="pp-mobile-overlay" onClick={() => setMobileSidebarOpen(false)} />}
                    {/* ============================ SIDEBAR ============================ */}
                    <aside className={`pp-sidebar ${mobileSidebarOpen ? 'is-open' : ''}`}>
                        <div className="pp-side-head">
                            <div className="pp-side-logo"><Settings2 size={24} style={{ color: "var(--text-slate-900)" }} /></div>
                            <div className="pp-side-head-text">
                                <div className="pp-side-title">Lead Settings</div>
                                <div className="pp-side-subtitle">Pipeline · workflow · source</div>
                            </div>
                        </div>

                        {canCreateLeadSetting && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                className="pp-create-btn"
                                onClick={showDrawer}
                                block
                            >
                                New Definition
                            </Button>
                        )}

                        <div className="pp-side-scroll">
                            <div className="pp-side-section-label">Categories</div>
                            <div className="pp-side-list">
                                {categoryMeta.map((cat) => {
                                    const active = activeTab === cat.key;
                                    const count = cat.key === "1" ? statuses.length : cat.key === "2" ? actions.length : platforms.length;
                                    return (
                                        <button
                                            key={cat.key}
                                            type="button"
                                            className={`pp-view-item ${active ? 'is-active' : ''}`}
                                            onClick={() => {
                                                setActiveTab(cat.key);
                                                setFilterMode("all");
                                            }}
                                        >
                                            <span className="pp-view-icon" style={{ color: active ? cat.accent : 'var(--text-slate-400)' }}>{cat.icon}</span>
                                            <span className="pp-view-label">{cat.label}</span>
                                            <span className="pp-view-count">{count}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="pp-side-section-label">Filters</div>
                            <div className="pp-side-filters">
                                <SearchableDropdown
                                    className="pp-side-sd"
                                    placeholder="Visibility"
                                    searchPlaceholder="Search state…"
                                    itemNoun="states"
                                    value={filterMode}
                                    onChange={(v) => setFilterMode((v as any) ?? 'all')}
                                    options={[
                                        { value: 'all', label: 'All states' },
                                        { value: 'active', label: 'Active only' },
                                        { value: 'hidden', label: 'Hidden / Disabled' },
                                    ]}
                                    width={212}
                                />
                            </div>
                        </div>
                    </aside>

                    {/* ============================ MAIN ============================ */}
                    <main className="pp-main">
                        {/* Search / status / view toggle bar */}
                        <div className="pp-topbar">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, maxWidth: 400, width: "100%" }}>
                                <Button
                                    className="pp-mobile-menu-btn"
                                    type="text"
                                    icon={<Menu size={18} />}
                                    onClick={() => setMobileSidebarOpen(true)}
                                />
                                <div className="pp-search-wrap" style={{ flex: 1, margin: 0, maxWidth: 'none' }}>
                                    <SearchOutlined className="pp-search-icon" />
                                    <input
                                        className="pp-search"
                                        placeholder={`Search ${activeLabel.toLowerCase()}…`}
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                    />
                                    {searchText && (
                                        <button type="button" className="lset-search-clear" onClick={() => setSearchText("")} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 11, color: 'var(--text-slate-400)' }}>Clear</button>
                                    )}
                                </div>
                            </div>

                            <div className="pp-topbar-meta">
                                <span className="pp-meta-item"><span className="pp-pulse" /><strong>{currentItems.length}</strong> definitions</span>
                                <span className="pp-meta-dot">·</span>
                                <span className="pp-meta-item"><strong>{currentActive}</strong> active</span>
                            </div>

                            <div className="pp-topbar-actions">
                                <div className="pp-segmented">
                                    <button type="button" className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                                    <button type="button" className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')} aria-label="List view"><UnorderedListOutlined /></button>
                                </div>
                                <Tooltip title="Refresh">
                                    <button type="button" className="pp-ghost-btn" onClick={() => { fetchStatuses(); fetchActions(); fetchPlatforms(); }}><ReloadOutlined spin={loading} /></button>
                                </Tooltip>
                            </div>
                        </div>

                        <div className="pp-divider" />

                        {/* Stat cards */}
                        <div className="pp-stats">
                            {statCells.map((s) => (
                                <div key={s.key} className="pp-stat-card">
                                    <div className="pp-stat-top">
                                        <div className="pp-stat-left">
                                            <span className="pp-stat-icon" style={{ background: s.tint, color: s.color }}>{s.icon}</span>
                                            <span className="pp-stat-label">{s.title}</span>
                                        </div>
                                    </div>
                                    <div className="pp-stat-bottom">
                                        <div className="pp-stat-value-wrap">
                                            <span className="pp-stat-value">{s.value}{s.suffix}</span>
                                            <span className="pp-stat-period">cumulative</span>
                                        </div>
                                        <div className="pp-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Table / grid */}
                        <div className="pp-body">
                            {view === 'list' ? (
                                <div className="pp-table-wrap">
                                    <Table
                                        loading={loading}
                                        columns={(activeTab === "1" ? statusColumns : activeTab === "2" ? actionColumns : platformColumns) as any}
                                        dataSource={activeTab === "1" ? pagedStatuses : activeTab === "2" ? pagedActions : pagedPlatforms}
                                        pagination={false}
                                        size="small"
                                        scroll={{ x: "max-content" }}
                                        className="pp-table"
                                        rowClassName="pp-row"
                                        locale={{ emptyText: emptyState }}
                                        onRow={(record) => ({
                                            onClick: (e) => {
                                                const t = e.target as HTMLElement;
                                                if (t.closest('.ant-checkbox-wrapper, .ant-table-selection-column, button, input, .ant-select, .ant-dropdown-trigger, .ant-switch, .lset-flag, .lset-rank, .lset-icon-btn')) return;
                                                if (activeTab === "1") handleEditStatus(record);
                                                else if (activeTab === "2") handleEditAction(record);
                                                else handleEditPlatform(record);
                                            }
                                        })}
                                    />
                                </div>
                            ) : (
                                <div className="pp-grid">
                                    {loading ? (
                                        <div className="pp-grid-loading">Loading…</div>
                                    ) : (activeTab === "1" ? pagedStatuses : activeTab === "2" ? pagedActions : pagedPlatforms).length === 0 ? (
                                        <div style={{ gridColumn: '1 / -1' }}>{emptyState}</div>
                                    ) : (
                                        activeTab === "1" ? (
                                            pagedStatuses.map((item, idx) => {
                                                return (
                                                    <div key={item.id} className="pc-card" onClick={() => handleEditStatus(item)}>
                                                        <div className="pc-top">
                                                            <div className="pc-avatar" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                                                                {item.icon && STATUS_ICON_BY_KEY[item.icon] ? STATUS_ICON_BY_KEY[item.icon].render(12) : item.statusName?.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="pc-identity-body">
                                                                <div className="pc-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                                    <span className="lset-pill" style={{ background: `${item.color || '#3b82f6'}14`, color: item.color || '#3b82f6', border: `1px solid ${item.color || '#3b82f6'}33`, fontSize: 11 }}>
                                                                        {item.statusName?.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="pc-client-line">
                                                                    <span className="pc-client-key">Category:</span>
                                                                    <span className="pc-client-val">{item.category || "uncategorized"}</span>
                                                                </div>
                                                            </div>
                                                            <Dropdown
                                                                menu={{
                                                                    items: [
                                                                        {
                                                                            key: 'edit',
                                                                            label: (
                                                                                <div className="pp-menu-item">
                                                                                    <span className="pp-menu-ic" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.12)' }}><Edit2 size={13} /></span>
                                                                                    <span className="pp-menu-text">
                                                                                        <span className="pp-menu-title">Edit status</span>
                                                                                        <span className="pp-menu-desc">Modify status properties</span>
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                            onClick: (e: any) => { e.domEvent.stopPropagation(); handleEditStatus(item); }
                                                                        },
                                                                        { type: 'divider' as const },
                                                                        {
                                                                            key: 'delete',
                                                                            danger: true,
                                                                            label: (
                                                                                <ConfirmDialog
                                                                                    tone="danger"
                                                                                    icon={<Trash2 size={16} />}
                                                                                    title="Delete Status?"
                                                                                    description="Leads using this status may need reassignment."
                                                                                    confirmText="Delete"
                                                                                    cancelText="Cancel"
                                                                                    placement="left"
                                                                                    onConfirm={async () => {
                                                                                        try {
                                                                                            await deleteStatus(item.id);
                                                                                            message.success("Status deleted successfully");
                                                                                        } catch (error) {
                                                                                            message.error("Failed to delete status");
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className="pp-menu-item" onClick={(e) => e.stopPropagation()}>
                                                                                        <span className="pp-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}><Trash2 size={13} /></span>
                                                                                        <span className="pp-menu-text">
                                                                                            <span className="pp-menu-title" style={{ color: '#ef4444' }}>Delete status</span>
                                                                                            <span className="pp-menu-desc">Remove this stage</span>
                                                                                        </span>
                                                                                    </div>
                                                                                </ConfirmDialog>
                                                                            )
                                                                        }
                                                                    ]
                                                                }}
                                                                overlayClassName="pp-action-pop"
                                                                trigger={['click']}
                                                                placement="bottomRight"
                                                            >
                                                                <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                                                                    <EllipsisOutlined />
                                                                </button>
                                                            </Dropdown>
                                                        </div>
                                                        <div className="pc-foot">
                                                            <div className="pc-foot-row">
                                                                <span className="pc-foot-item">
                                                                    <span className="pc-foot-key">Behavior:</span>
                                                                    <span
                                                                        className={`lset-flag ${item.isDefault ? "is-on" : ""}`}
                                                                        style={{ cursor: 'pointer', padding: '2px 6px', fontSize: 10 }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleToggleStatusProperty(item.id, "isDefault", !item.isDefault);
                                                                        }}
                                                                    >
                                                                        <Star size={10} fill={item.isDefault ? "#f59e0b" : "transparent"} stroke={item.isDefault ? "#f59e0b" : "#94a3b8"} />
                                                                        Default
                                                                    </span>
                                                                    <span
                                                                        className={`lset-flag ${item.isFinal ? "is-final" : ""}`}
                                                                        style={{ cursor: 'pointer', padding: '2px 6px', fontSize: 10, marginLeft: 6 }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleToggleStatusProperty(item.id, "isFinal", !item.isFinal);
                                                                        }}
                                                                    >
                                                                        <CheckCircle2 size={10} />
                                                                        Final
                                                                    </span>
                                                                </span>
                                                            </div>
                                                            <div className="pc-foot-row" style={{ borderTop: '1px solid var(--border-slate-200)' }}>
                                                                <span className="pc-foot-item">
                                                                    <span className="pc-foot-key">Visibility:</span>
                                                                    <Switch
                                                                        size="small"
                                                                        checked={item.isActive}
                                                                        onChange={(val) => handleToggleStatusProperty(item.id, "isActive", val)}
                                                                        loading={loading}
                                                                        disabled={!canUpdateLeadSetting}
                                                                        onClick={(checked, e: any) => e.stopPropagation()}
                                                                    />
                                                                    <span className={`lset-vis-label ${item.isActive ? "is-on" : ""}`} style={{ fontSize: 11, marginLeft: 4 }}>
                                                                        {item.isActive ? "Visible" : "Hidden"}
                                                                    </span>
                                                                </span>
                                                                <span className="pc-foot-div" />
                                                                <span className="pc-foot-item">
                                                                    <span className="pc-foot-key">Order:</span>
                                                                    <span className="lset-rank" style={{ fontSize: 10, padding: '1px 6px' }}>#{item.sno}</span>
                                                                    {canUpdateLeadSetting && (
                                                                        <div style={{ display: 'inline-flex', gap: 2, marginLeft: 6 }}>
                                                                            <button
                                                                                className="lset-icon-btn"
                                                                                style={{ width: 20, height: 20 }}
                                                                                disabled={dataSource.findIndex(d => d.id === item.id) === 0}
                                                                                onClick={(e) => { e.stopPropagation(); moveRow(dataSource.findIndex(d => d.id === item.id), "up"); }}
                                                                            >
                                                                                <ArrowUp size={11} />
                                                                            </button>
                                                                            <button
                                                                                className="lset-icon-btn"
                                                                                style={{ width: 20, height: 20 }}
                                                                                disabled={dataSource.findIndex(d => d.id === item.id) === dataSource.length - 1}
                                                                                onClick={(e) => { e.stopPropagation(); moveRow(dataSource.findIndex(d => d.id === item.id), "down"); }}
                                                                            >
                                                                                <ArrowDown size={11} />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : activeTab === "2" ? (
                                            pagedActions.map((item) => (
                                                <div key={item.id} className="pc-card" onClick={() => handleEditAction(item)}>
                                                    <div className="pc-top">
                                                        <div className="pc-avatar" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' }}>
                                                            {renderIcon(item.icon) || item.actionName?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="pc-identity-body">
                                                            <div className="pc-title">{item.actionName}</div>
                                                            <div className="pc-client-line">
                                                                <span className="pc-client-key">Category:</span>
                                                                <span className="pc-client-val">
                                                                    <span className="lset-cat-pill" style={{ padding: '1px 6px', fontSize: 10 }}>
                                                                        <Workflow size={9} /> {item.type}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Dropdown
                                                            menu={{
                                                                items: [
                                                                    {
                                                                        key: 'edit',
                                                                        label: (
                                                                            <div className="pp-menu-item">
                                                                                <span className="pp-menu-ic" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.12)' }}><Edit2 size={13} /></span>
                                                                                <span className="pp-menu-text">
                                                                                    <span className="pp-menu-title">Edit action</span>
                                                                                    <span className="pp-menu-desc">Modify action properties</span>
                                                                                </span>
                                                                            </div>
                                                                        ),
                                                                        onClick: (e: any) => { e.domEvent?.stopPropagation(); handleEditAction(item); }
                                                                    },
                                                                    { type: 'divider' as const },
                                                                    {
                                                                        key: 'delete',
                                                                        danger: true,
                                                                        label: (
                                                                            <ConfirmDialog
                                                                                    tone="danger"
                                                                                    icon={<Trash2 size={16} />}
                                                                                    title="Remove Action?"
                                                                                    description="Are you sure you want to remove this action?"
                                                                                    confirmText="Remove"
                                                                                    cancelText="Cancel"
                                                                                    placement="left"
                                                                                    onConfirm={async () => {
                                                                                        try {
                                                                                            await deleteAction(item.id);
                                                                                            message.success("Action removed successfully");
                                                                                        } catch (error) {
                                                                                            message.error("Failed to remove action");
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className="pp-menu-item" onClick={(e) => e.stopPropagation()}>
                                                                                        <span className="pp-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}><Trash2 size={13} /></span>
                                                                                        <span className="pp-menu-text">
                                                                                            <span className="pp-menu-title" style={{ color: '#ef4444' }}>Remove action</span>
                                                                                            <span className="pp-menu-desc">Delete from workflow</span>
                                                                                        </span>
                                                                                    </div>
                                                                                </ConfirmDialog>
                                                                        )
                                                                    }
                                                                ]
                                                            }}
                                                            overlayClassName="pp-action-pop"
                                                            trigger={['click']}
                                                            placement="bottomRight"
                                                        >
                                                            <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                                                                <EllipsisOutlined />
                                                            </button>
                                                        </Dropdown>
                                                    </div>
                                                    <div className="pc-foot">
                                                        <div className="pc-foot-row">
                                                            <span className="pc-foot-item">
                                                                <span className="pc-foot-key">Created:</span>
                                                                <span className="pc-foot-val">{item.created}</span>
                                                            </span>
                                                        </div>
                                                        <div className="pc-foot-row" style={{ borderTop: '1px solid var(--border-slate-200)' }}>
                                                            <span className="pc-foot-item">
                                                                <span className="pc-foot-key">Status:</span>
                                                                <Switch
                                                                    size="small"
                                                                    checked={item.isActive}
                                                                    onChange={(val) => handleToggleActionProperty(item.id, val)}
                                                                    loading={loading}
                                                                    disabled={!canUpdateLeadSetting}
                                                                    onClick={(checked, e: any) => e.stopPropagation()}
                                                                />
                                                                <span className={`lset-vis-label ${item.isActive ? "is-on" : ""}`} style={{ fontSize: 11, marginLeft: 4 }}>
                                                                    {item.isActive ? "Active" : "Disabled"}
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            pagedPlatforms.map((item) => {
                                                const isOnline = item.type === "online";
                                                const href = item.url ? (/^https?:\/\//i.test(item.url) ? item.url : `https://${item.url}`) : "";
                                                return (
                                                    <div key={item.id} className="pc-card" onClick={() => handleEditPlatform(item)}>
                                                        <div className="pc-top">
                                                            <div className="pc-avatar" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                                                                {renderPlatformLogo(item.logoUrl, 16, '#ffffff', false)}
                                                            </div>
                                                            <div className="pc-identity-body">
                                                                <div className="pc-title">{item.name}</div>
                                                                <div className="pc-client-line">
                                                                    <span className="pc-client-key">Code:</span>
                                                                    <span className="pc-client-val" style={{ fontFamily: 'monospace' }}>{item.code}</span>
                                                                </div>
                                                            </div>
                                                            <Dropdown
                                                                menu={{
                                                                    items: [
                                                                        {
                                                                            key: 'edit',
                                                                            label: (
                                                                                <div className="pp-menu-item">
                                                                                    <span className="pp-menu-ic" style={{ color: '#3b82f6', background: 'rgba(59,130,246,0.12)' }}><Edit2 size={13} /></span>
                                                                                    <span className="pp-menu-text">
                                                                                        <span className="pp-menu-title">Edit platform</span>
                                                                                        <span className="pp-menu-desc">Modify source settings</span>
                                                                                    </span>
                                                                                </div>
                                                                            ),
                                                                            onClick: (e: any) => { e.domEvent.stopPropagation(); handleEditPlatform(item); }
                                                                        },
                                                                        { type: 'divider' as const },
                                                                        {
                                                                            key: 'delete',
                                                                            danger: true,
                                                                            label: (
                                                                                <ConfirmDialog
                                                                                    tone="danger"
                                                                                    icon={<Trash2 size={16} />}
                                                                                    title="Delete Platform?"
                                                                                    description="This cannot be undone."
                                                                                    confirmText="Delete"
                                                                                    cancelText="Cancel"
                                                                                    placement="left"
                                                                                    onConfirm={async () => {
                                                                                        try {
                                                                                            await deletePlatform(item.id);
                                                                                            message.success("Platform deleted");
                                                                                        } catch {
                                                                                            message.error("Failed to delete platform");
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className="pp-menu-item" onClick={(e) => e.stopPropagation()}>
                                                                                        <span className="pp-menu-ic" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.12)' }}><Trash2 size={13} /></span>
                                                                                        <span className="pp-menu-text">
                                                                                            <span className="pp-menu-title" style={{ color: '#ef4444' }}>Delete platform</span>
                                                                                            <span className="pp-menu-desc">Remove source permanently</span>
                                                                                        </span>
                                                                                    </div>
                                                                                </ConfirmDialog>
                                                                            )
                                                                        }
                                                                    ]
                                                                }}
                                                                overlayClassName="pp-action-pop"
                                                                trigger={['click']}
                                                                placement="bottomRight"
                                                            >
                                                                <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                                                                    <EllipsisOutlined />
                                                                </button>
                                                            </Dropdown>
                                                        </div>
                                                        <div className="pc-foot">
                                                            <div className="pc-foot-row">
                                                                <span className="pc-foot-item">
                                                                    <span className="pc-foot-key">Type:</span>
                                                                    <Tag color={isOnline ? "blue" : "purple"} style={{ borderRadius: 6, fontWeight: 700, fontSize: 10, margin: 0 }}>
                                                                        {isOnline ? "Online platform" : "Own website"}
                                                                    </Tag>
                                                                </span>
                                                                {href && (
                                                                    <>
                                                                        <span className="pc-foot-div" />
                                                                        <span className="pc-foot-item">
                                                                            <span className="pc-foot-key">URL:</span>
                                                                            <a href={href} target="_blank" rel="noreferrer" className="lset-platform-url" style={{ fontSize: 11 }} onClick={(e) => e.stopPropagation()}>
                                                                                <Link2 size={10} style={{ marginRight: 2 }} /> Link
                                                                            </a>
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="pc-foot-row" style={{ borderTop: '1px solid var(--border-slate-200)' }}>
                                                                <span className="pc-foot-item">
                                                                    <span className="pc-foot-key">Visibility:</span>
                                                                    <Switch
                                                                        size="small"
                                                                        checked={item.isActive}
                                                                        onChange={async (checked) => {
                                                                            try {
                                                                                await updatePlatform(item.id, { is_active: checked });
                                                                                message.success("Platform updated");
                                                                            } catch {
                                                                                message.error("Failed to update platform");
                                                                            }
                                                                        }}
                                                                        disabled={!canUpdateLeadSetting}
                                                                        onClick={(checked, e: any) => e.stopPropagation()}
                                                                    />
                                                                    <span className={`lset-vis-label ${item.isActive ? "is-on" : ""}`} style={{ fontSize: 11, marginLeft: 4 }}>
                                                                        {item.isActive ? "Visible" : "Hidden"}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )
                                    )}
                                </div>
                            )}
                        </div>

                        {total > 0 && (
                            <div className="pp-footer pp-footer--sticky">
                                <div className="pp-footer-info">
                                    Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
                                </div>
                                <div className="pp-pager">
                                    <button type="button" className="pp-pager-btn" disabled={tablePage <= 1} onClick={() => setTablePage((p) => Math.max(1, p - 1))}>‹</button>
                                    {Array.from({ length: pageCount }, (_, i) => i + 1).slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5).map((p) => (
                                        <button key={p} type="button" className={`pp-pager-num ${p === tablePage ? 'is-active' : ''}`} onClick={() => setTablePage(p)}>{p}</button>
                                    ))}
                                    <button type="button" className="pp-pager-btn" disabled={tablePage >= pageCount} onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}>›</button>
                                    <Select
                                        className="pp-pagesize"
                                        value={tablePageSize}
                                        onChange={(v) => { setTablePageSize(v); setTablePage(1); }}
                                        options={PAGE_SIZE_OPTIONS.map((n) => ({ value: n, label: `${n} / page` }))}
                                        popupMatchSelectWidth={120}
                                    />
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                {/* DRAWER */}
                <Drawer
                    title={
                        <div className="lset-drawer-head" style={{ margin: "-16px -24px", padding: "20px 24px", position: "relative", overflow: "hidden" }}>
                            <div className="lset-drawer-bg" aria-hidden />
                            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
                                <div className="lset-drawer-icon">
                                    {activeTab === "1" ? <TagIcon size={20} /> : activeTab === "2" ? <Zap size={20} /> : <Globe size={20} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="lset-drawer-title">
                                        {editingId
                                            ? `Edit ${activeTab === "1" ? "Status" : activeTab === "2" ? "Action" : "Platform"}`
                                            : `New ${activeTab === "1" ? "Status" : activeTab === "2" ? "Action" : "Platform"}`}
                                    </div>
                                    <div className="lset-drawer-sub">
                                        Configure properties and appearance
                                    </div>
                                </div>
                                <span className="lset-drawer-badge">
                                    <Sparkles size={10} />
                                    {activeTab === "1" ? "Pipeline" : activeTab === "2" ? "Workflow" : "Source"}
                                </span>
                            </div>
                        </div>
                    }
                    width={570}
                    open={isDrawerOpen}
                    onClose={handleCancel}
                    className="lset-drawer"
                    closable={!loading}
                    footer={
                        <div className="lset-drawer-footer">
                            <span className="lset-drawer-footer-hint">
                                <ShieldCheck size={12} /> Changes apply instantly across all leads
                            </span>
                            <div style={{ display: "flex", gap: 10 }}>
                                <Button htmlType="button" onClick={() => handleCancel()} className="lset-btn-cancel">Cancel</Button>
                                {((editingId && canUpdateLeadSetting) || (!editingId && canCreateLeadSetting)) && (
                                    <Button
                                        type="primary"
                                        loading={loading}
                                        onClick={handleSave}
                                        className="lset-cta-btn"
                                        style={{ minWidth: 180 }}
                                    >
                                        {editingId ? "Update" : "Create"} {activeTab === "1" ? "Status" : activeTab === "2" ? "Action" : "Platform"}
                                        <ArrowUpRight size={13} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    }
                >
                    <Form
                        form={form}
                        layout="vertical"
                        initialValues={{ isDefault: false, isFinalStage: false, isActive: true }}
                        requiredMark={false}
                        className="lset-drawer-form"
                    >
                        {activeTab === "1" ? (
                            <>
                                {/* SECTION 1 */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>01</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <Palette size={13} color="#6366f1" />
                                                <span className="lset-section-title">Identity & Appearance</span>
                                            </div>
                                            <span className="lset-section-sub">How this status looks across the app</span>
                                        </div>
                                    </div>
                                    <Form.Item name="category" label={<span className="lset-form-label">Internal Category</span>} rules={[{ required: true, message: "Required" }]}>
                                        <SearchableDropdown
                                            placeholder="Pick or type — e.g. negotiation"
                                            searchPlaceholder="Search categories…"
                                            itemNoun="categories"
                                            freeText
                                            options={statusCategoryOptions}
                                            onChange={(val) => {
                                                if (val) applyStatusCategoryPreset(val);
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item name="statusName" label={<span className="lset-form-label">Label Name</span>} rules={[{ required: true, message: "Required" }]}>
                                        <SearchableDropdown
                                            placeholder={statusCategoryWatch
                                                ? `e.g. ${statusNameOptions[0]?.value || "IN PROPOSAL"}`
                                                : "Pick a category or type freely"}
                                            searchPlaceholder="Search status names…"
                                            itemNoun="suggestions"
                                            freeText
                                            options={statusNameOptions}
                                            // Picking a known status back-fills category, color and
                                            // (for Won/Lost/Converted) the Final Milestone toggle.
                                            onChange={(val) => {
                                                if (val) applyStatusNamePreset(val);
                                            }}
                                        />
                                    </Form.Item>
                                    <Row gutter={12}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="color"
                                                label={<span className="lset-form-label">Brand Color</span>}
                                                rules={[{ required: true, message: "Required" }]}
                                            >
                                                <Select
                                                    options={[
                                                        { value: "#3b82f6", label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }} /> Blue</span> },
                                                        { value: "#10b981", label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} /> Green</span> },
                                                        { value: "#94a3b8", label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#94a3b8' }} /> Grey</span> },
                                                        { value: "#f59e0b", label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} /> Light Orange</span> },
                                                    ]}
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="statusIcon"
                                                label={<span className="lset-form-label">Icon</span>}
                                            >
                                                <SearchableDropdown
                                                    placeholder="Pick a status icon"
                                                    searchPlaceholder="Search icons…"
                                                    itemNoun="icons"
                                                    options={STATUS_ICON_OPTIONS.map(icon => ({
                                                        value: icon.key,
                                                        label: icon.label,
                                                        description: icon.key,
                                                        badge: (
                                                            <span style={{
                                                                width: "100%", height: "100%",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                color: "var(--text-slate-700, #475569)",
                                                            }}>
                                                                {icon.render(14)}
                                                            </span>
                                                        ),
                                                    }))}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>

                                {/* SECTION 2 */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>02</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <Activity size={13} color="#f59e0b" />
                                                <span className="lset-section-title">Behavioral Rules</span>
                                            </div>
                                            <span className="lset-section-sub">Lifecycle behavior for new and closing leads</span>
                                        </div>
                                    </div>

                                    <div className="lset-toggle-row">
                                        <div className="lset-toggle-text">
                                            <span className="lset-toggle-title">
                                                <Star size={12} color="#f59e0b" />
                                                Default Starter
                                            </span>
                                            <span className="lset-toggle-sub">Auto-assigned to all new leads</span>
                                        </div>
                                        <Tooltip title={!(editingId && statuses.find(s => s.id === editingId)?.is_default) ? "Manage default from the table" : ""}>
                                            <span>
                                                <Form.Item name="isDefault" valuePropName="checked" noStyle>
                                                    <Switch disabled={!(editingId && statuses.find(s => s.id === editingId)?.is_default)} />
                                                </Form.Item>
                                            </span>
                                        </Tooltip>
                                    </div>

                                    <div className="lset-toggle-row">
                                        <div className="lset-toggle-text">
                                            <span className="lset-toggle-title">
                                                <CheckCircle2 size={12} color="#10b981" />
                                                Final Milestone
                                            </span>
                                            <span className="lset-toggle-sub">Marks completion of the pipeline</span>
                                        </div>
                                        <Form.Item name="isFinalStage" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>

                                    <div className="lset-toggle-row">
                                        <div className="lset-toggle-text">
                                            <span className="lset-toggle-title">
                                                <Eye size={12} color="#6366f1" />
                                                Visible
                                            </span>
                                            <span className="lset-toggle-sub">Available for selection in lead views</span>
                                        </div>
                                        <Form.Item name="isActive" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>
                                </div>
                            </>
                        ) : activeTab === "2" ? (
                            <>
                                {/* SECTION 1 */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(236,72,153,0.08)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.2)" }}>01</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <Workflow size={13} color="#ec4899" />
                                                <span className="lset-section-title">Action Configuration</span>
                                            </div>
                                            <span className="lset-section-sub">Identity, type, and visual appearance</span>
                                        </div>
                                    </div>
                                    <Form.Item name="actionType" label={<span className="lset-form-label">Category</span>} rules={[{ required: true, message: "Required" }]}>
                                        <SearchableDropdown
                                            placeholder="Pick or type — e.g. Communication"
                                            searchPlaceholder="Search categories…"
                                            itemNoun="categories"
                                            freeText
                                            options={WORKFLOW_ACTION_PRESETS.map(p => ({
                                                value: p.category,
                                                label: p.category,
                                                description: `${p.types.length} suggested types`,
                                            }))}
                                            onChange={(val) => {
                                                if (val) applyCategoryPreset(val);
                                            }}
                                        />
                                    </Form.Item>
                                    <Form.Item name="actionName" label={<span className="lset-form-label">Display Name</span>} rules={[{ required: true, message: "Required" }]}>
                                        <SearchableDropdown
                                            placeholder={actionCategoryWatch
                                                ? `e.g. ${actionNameOptions[0]?.value || "Schedule Call"}`
                                                : "Pick a category or type freely"}
                                            searchPlaceholder="Search action names…"
                                            itemNoun="suggestions"
                                            freeText
                                            options={actionNameOptions.map(o => ({
                                                value: o.value,
                                                label: o.value,
                                            }))}
                                            // Picking a known display name back-fills the matching
                                            // category, icon, and color. Free-form typing leaves them
                                            // alone so the user can override after the fact.
                                            onChange={(val) => {
                                                if (val) applyTypePreset(val);
                                            }}
                                        />
                                    </Form.Item>
                                    <Row gutter={12}>
                                        <Col span={14}>
                                            <Form.Item name="icon" label={<span className="lset-form-label">Icon</span>} rules={[{ required: true, message: "Required" }]}>
                                                <Select
                                                    showSearch
                                                    placeholder="Search icon"
                                                    options={iconOptions}
                                                    filterOption={(input, option) =>
                                                        (option?.value as string).toLowerCase().includes(input.toLowerCase())
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col span={10}>
                                            <Form.Item
                                                name="color"
                                                label={<span className="lset-form-label">Color</span>}
                                                rules={[{ required: true, message: "Required" }]}
                                            >
                                                <Select
                                                    options={[
                                                        { value: "#3b82f6", label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6' }} /> Blue</span> },
                                                        { value: "#10b981", label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10b981' }} /> Green</span> },
                                                        { value: "#94a3b8", label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#94a3b8' }} /> Grey</span> },
                                                        { value: "#f59e0b", label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b' }} /> Light Orange</span> },
                                                    ]}
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>

                                {/* SECTION 2 */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>02</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <ShieldCheck size={13} color="#10b981" />
                                                <span className="lset-section-title">Availability</span>
                                            </div>
                                            <span className="lset-section-sub">Control whether this action shows up in workflows</span>
                                        </div>
                                    </div>
                                    <div className="lset-toggle-row">
                                        <div className="lset-toggle-text">
                                            <span className="lset-toggle-title">
                                                <Eye size={12} color="#10b981" />
                                                Operational
                                            </span>
                                            <span className="lset-toggle-sub">Available for selection across leads</span>
                                        </div>
                                        <Form.Item name="isActive" valuePropName="checked" noStyle>
                                            <Switch />
                                        </Form.Item>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* PLATFORM SECTION 1 — Type */}
                                <div className="lset-section-card">
                                    <div className="lset-section-head">
                                        <span className="lset-section-step" style={{ background: "rgba(6,182,212,0.08)", color: "#06b6d4", border: "1px solid rgba(6,182,212,0.2)" }}>01</span>
                                        <div>
                                            <div className="lset-section-row">
                                                <Globe size={13} color="#06b6d4" />
                                                <span className="lset-section-title">Source kind</span>
                                            </div>
                                            <span className="lset-section-sub">Pick where leads come from. The next step adapts to your choice.</span>
                                        </div>
                                    </div>
                                    <Form.Item
                                        name="platformType"
                                        rules={[{ required: true, message: "Pick a type" }]}
                                    >
                                        <Segmented
                                            block
                                            options={[
                                                {
                                                    value: "online",
                                                    label: (
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                                                            <Globe size={12} /> Online platform
                                                        </span>
                                                    ),
                                                },
                                                {
                                                    value: "website",
                                                    label: (
                                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12 }}>
                                                            <Sparkles size={12} /> Own website
                                                        </span>
                                                    ),
                                                },
                                            ]}
                                            onChange={() => {
                                                // Reset downstream identity fields when the type flips.
                                                form.setFieldsValue({
                                                    platformPicker: undefined,
                                                    platformName: undefined,
                                                    platformCode: undefined,
                                                });
                                            }}
                                        />
                                    </Form.Item>
                                </div>

                                {/* PLATFORM SECTION 2 — Identity (depends on type) */}
                                {platformTypeWatch && (
                                    <div className="lset-section-card">
                                        <div className="lset-section-head">
                                            <span className="lset-section-step" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>02</span>
                                            <div>
                                                <div className="lset-section-row">
                                                    <TagIcon size={13} color="#6366f1" />
                                                    <span className="lset-section-title">
                                                        {platformTypeWatch === "online" ? "Pick a platform" : "Website identity"}
                                                    </span>
                                                </div>
                                                <span className="lset-section-sub">
                                                    {platformTypeWatch === "online"
                                                        ? "Choose from the curated list — name, code and URL are auto-filled."
                                                        : "Give your website a label leads will be grouped under."}
                                                </span>
                                            </div>
                                        </div>

                                        {platformTypeWatch === "online" ? (
                                            <Form.Item
                                                name="platformPicker"
                                                label={<span className="lset-form-label">Platform</span>}
                                                rules={[{ required: true, message: "Pick a platform" }]}
                                            >
                                                <SearchableDropdown
                                                    placeholder="Search platforms…"
                                                    searchPlaceholder="Search platforms…"
                                                    itemNoun="platforms"
                                                    options={[
                                                        ...KNOWN_ONLINE_PLATFORMS.map(p => ({
                                                            value: p.name,
                                                            label: p.name,
                                                            description: p.url.replace(/^https?:\/\/(www\.)?/, ""),
                                                            badge: (
                                                                <span
                                                                    aria-hidden
                                                                    style={{
                                                                        width: "100%", height: "100%",
                                                                        background: `${p.brand}14`,
                                                                        color: p.brand,
                                                                        display: "inline-flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        fontSize: 12,
                                                                        fontWeight: 800,
                                                                    }}
                                                                >
                                                                    {p.name.slice(0, 1).toUpperCase()}
                                                                </span>
                                                            ),
                                                        })),
                                                        {
                                                            value: "__other__",
                                                            label: "Other (custom)",
                                                            description: "Type your own name in the next step",
                                                        },
                                                    ]}
                                                    onChange={(val) => {
                                                        if (!val) return;
                                                        if (val === "__other__") {
                                                            form.setFieldsValue({ platformName: undefined, platformCode: undefined });
                                                            return;
                                                        }
                                                        const meta = KNOWN_ONLINE_PLATFORMS.find(p => p.name === val);
                                                        if (!meta) return;
                                                        const updates: any = {
                                                            platformName: meta.name,
                                                            platformCode: derivePlatformCode(meta.name),
                                                        };
                                                        if (!form.getFieldValue("platformUrl")) {
                                                            updates.platformUrl = meta.url;
                                                        }
                                                        const currentLogo = form.getFieldValue("platformLogo");
                                                        const parsed = parseLogoValue(currentLogo);
                                                        if (parsed.kind === "none" || parsed.kind === "icon") {
                                                            updates.platformLogo = `icon:${meta.iconKey}`;
                                                        }
                                                        form.setFieldsValue(updates);
                                                    }}
                                                />
                                            </Form.Item>
                                        ) : null}

                                        {(platformTypeWatch === "website" || platformPickerWatch === "__other__") ? (
                                            <Form.Item
                                                name="platformName"
                                                label={<span className="lset-form-label">Name</span>}
                                                rules={[{ required: true, message: "Required" }, { pattern: /^[A-Za-z0-9\s\-&.,]+$/, message: "Special characters are not allowed" }]}
                                                getValueFromEvent={(e) => e.target.value.replace(/[^A-Za-z0-9\s\-&.,]/g, '')}
                                            >
                                                <Input
                                                    placeholder={platformTypeWatch === "website" ? "e.g. Zukvo, Zithtech" : "e.g. AngelList Talent"}
                                                    onChange={(e) => {
                                                        if (!editingId) {
                                                            form.setFieldValue("platformCode", derivePlatformCode(e.target.value));
                                                        }
                                                    }}
                                                />
                                            </Form.Item>
                                        ) : (
                                            // Keep platformName registered even when its visible input is hidden
                                            // (curated online pick auto-fills it). Without this Form.Item the
                                            // value set via setFieldsValue isn't picked up by validateFields.
                                            <Form.Item name="platformName" hidden>
                                                <Input />
                                            </Form.Item>
                                        )}

                                        <Form.Item
                                            name="platformCode"
                                            label={
                                                <span className="lset-form-label">
                                                    Code
                                                    <Tooltip title="Derived from name. Used internally to match this platform with leads — cannot be changed.">
                                                        <Info size={11} style={{ marginLeft: 6, color: "var(--text-slate-400)" }} />
                                                    </Tooltip>
                                                </span>
                                            }
                                        >
                                            <Input
                                                readOnly
                                                disabled
                                                placeholder="AUTO_FILLED"
                                                style={{ fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.04em" }}
                                            />
                                        </Form.Item>
                                    </div>
                                )}

                                {/* PLATFORM SECTION 3 — Branding & URL */}
                                {platformTypeWatch && (
                                    <div className="lset-section-card">
                                        <div className="lset-section-head">
                                            <span className="lset-section-step" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>03</span>
                                            <div>
                                                <div className="lset-section-row">
                                                    <ImageIcon size={13} color="#f59e0b" />
                                                    <span className="lset-section-title">Branding & URL</span>
                                                </div>
                                                <span className="lset-section-sub">How this source looks in the leads table and where it lives.</span>
                                            </div>
                                        </div>
                                        <Form.Item name="platformUrl" label={<span className="lset-form-label">URL</span>}>
                                            <Input prefix={<Link2 size={13} style={{ color: "var(--text-slate-400)" }} />} placeholder="https://…" />
                                        </Form.Item>
                                        <Form.Item
                                            name="platformLogo"
                                            label={<span className="lset-form-label">Logo</span>}
                                            valuePropName="value"
                                        >
                                            <PlatformLogoPicker
                                                platformKind={platformTypeWatch === "website" ? "website" : "online"}
                                                onError={(msg) => message.error(msg)}
                                            />
                                        </Form.Item>
                                        <Form.Item name="platformDescription" label={<span className="lset-form-label">Description</span>}>
                                            <Input.TextArea rows={3} placeholder="Short note about how this source feeds leads in." />
                                        </Form.Item>
                                    </div>
                                )}

                                {/* PLATFORM SECTION 4 — Visibility */}
                                {platformTypeWatch && (
                                    <div className="lset-section-card">
                                        <div className="lset-section-head">
                                            <span className="lset-section-step" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>04</span>
                                            <div>
                                                <div className="lset-section-row">
                                                    <ShieldCheck size={13} color="#10b981" />
                                                    <span className="lset-section-title">Status</span>
                                                </div>
                                                <span className="lset-section-sub">Hidden platforms won't appear in the lead source picker.</span>
                                            </div>
                                        </div>
                                        <div className="lset-toggle-row">
                                            <div className="lset-toggle-text">
                                                <span className="lset-toggle-title">
                                                    <Eye size={12} color="#10b981" />
                                                    Active
                                                </span>
                                                <span className="lset-toggle-sub">Available as a lead source</span>
                                            </div>
                                            <Form.Item name="isActive" valuePropName="checked" noStyle>
                                                <Switch />
                                            </Form.Item>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="lset-drawer-note">
                            <div className="lset-drawer-note-icon">
                                <Info size={13} />
                            </div>
                            <div className="lset-drawer-note-text">
                                Saved settings sync to every lead view and the public pipeline immediately.
                            </div>
                        </div>
                    </Form>
                </Drawer>

                <style dangerouslySetInnerHTML={{
                    __html: `
          .pp-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
            font-family: 'Inter', -apple-system, sans-serif;
          }

          /* ---------------- Sidebar ---------------- */
          .pp-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            padding: 14px 14px 0;
            position: sticky;
            top: 0;
            height: calc(100vh - 54px);
          }
          .pp-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .pp-side-logo {
            flex-shrink: 0; display: flex; align-items: center; justify-content: center;
          }
          .pp-side-logo svg { color: var(--text-slate-900) !important; }
          .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .pp-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .pp-create-btn {
            height: 36px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
            background: #3B82F6 !important;
            border: none !important; box-shadow: none !important;
            margin-bottom: 4px;
          }
          .pp-create-btn:hover { background: #2563EB !important; }
          .pp-create-btn .anticon { font-size: 12px !important; }
          .pp-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .pp-side-scroll::-webkit-scrollbar { width: 5px; }
          .pp-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .pp-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 6px; }
          .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
          .pp-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
          }
          .pp-view-item:hover { background: var(--bg-slate-50); }
          .pp-view-item.is-active { background: var(--bg-blue-50); }
          .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
          .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
          .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          .pp-view-count {
            font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
            min-width: 18px; text-align: right;
          }
          .pp-view-item.is-active .pp-view-count {
            color: #3B82F6; font-weight: 700;
            background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
          }
          .pp-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
          .pp-side-sd { border-radius: 8px !important; }
          .pp-side-select .ant-select-selector,
          .pp-side-range.ant-picker {
            border-radius: 8px !important; border-color: var(--border-slate-200) !important;
            background: var(--bg-pure-white) !important;
          }
          .pp-side-select { width: 100%; }
          .pp-side-select .ant-select-selector { height: 36px !important; padding: 0 11px !important; display: flex; align-items: center; }
          .pp-side-select .ant-select-selection-placeholder,
          .pp-side-select .ant-select-selection-item { font-size: 13px; line-height: 34px !important; }
          .pp-side-range { width: 100%; height: 36px; border-style: dashed !important; }
          .pp-side-range .ant-picker-input > input { font-size: 12.5px; }
          .pp-clear-filters {
            display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
            background: none; border: none; cursor: pointer; padding: 3px;
            font-size: 12px; font-weight: 600; color: #ef4444;
          }

          /* ---------------- Main ---------------- */
          .pp-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; }
          .pp-body { flex: 1 0 auto; }
          .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
          .pp-search-wrap {
            position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
            height: 32px; border-radius: 8px; background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200); padding: 0 10px;
          }
          .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
          .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
          .pp-search {
            flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
            font-size: 13px; color: var(--text-slate-900);
          }
          .pp-search::placeholder { color: var(--text-slate-400); }
          .pp-kbd {
            font-size: 10.5px; font-weight: 600; color: var(--text-slate-400);
            background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
            border-radius: 5px; padding: 1px 6px;
          }
          .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
          .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
          .pp-meta-dot { color: var(--text-slate-300); }
          .pp-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; display: inline-block; box-shadow: 0 0 0 3px rgba(16,185,129,0.18); margin-right: 5px; }
          .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
          .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
          .pp-segmented button {
            width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
            color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
          }
          .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }
          .pp-ghost-btn {
            width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .pp-ghost-btn:hover { color: #3B82F6; border-color: #bfdbfe; }

          .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 -18px 10px; }

          /* Stat cards */
          .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
          .pp-stat-card {
            background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
            border-radius: 0; padding: 12px 14px; min-height: 92px;
            display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
            box-shadow: 0 1px 2px rgba(15,23,42,0.04);
          }
          .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
          .pp-stat-left { display: flex; align-items: center; gap: 8px; }
          .pp-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
          .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
          .pp-stat-delta {
            display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
            color: #10b981; background: rgba(16,185,129,0.10); border-radius: 6px; padding: 1px 6px;
          }
          .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
          .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
          .pp-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
          .pp-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
          .pp-stat-spark { opacity: 0.95; }

          /* Table */
          .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
          .pp-table .ant-table { background: transparent; font-size: 12px; }
          .pp-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
            font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
            text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
            white-space: nowrap !important;
          }
          .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
          .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
          .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }
          .pp-table .ant-table-selection-column { padding-inline: 6px !important; }

          /* Lead settings table cells alignment and styles */
          .lset-drag {
            display: inline-flex; align-items: center; justify-content: center;
            width: 22px; height: 22px; border-radius: 6px;
            color: var(--text-slate-400); opacity: 0.6;
            transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
          }
          .pp-table .ant-table-tbody > tr:hover .lset-drag {
            opacity: 1; background: var(--bg-pure-white); color: #6366f1;
          }
          .lset-rank {
            display: inline-flex; align-items: center; gap: 3px;
            padding: 3px 9px;
            border-radius: 999px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            color: var(--text-slate-500);
            font-size: 11px; font-weight: 700;
          }
          .lset-rank svg { color: var(--text-slate-400); }

          .lset-status-cell { display: flex; align-items: center; gap: 14px; }
          .lset-color-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
          .lset-status-icon {
            width: 24px; height: 24px;
            border-radius: 7px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .lset-status-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
          .lset-pill {
            display: inline-flex; align-items: center;
            padding: 3px 10px; border-radius: 7px;
            font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
            width: fit-content;
          }
          .lset-status-meta {
            font-size: 11px; color: var(--text-slate-400);
            font-weight: 600;
            text-transform: lowercase;
            letter-spacing: 0.02em;
          }

          .lset-flag-row { display: flex; gap: 8px; }
          .lset-flag {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 4px 10px;
            border-radius: 7px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            color: var(--text-slate-500);
            font-size: 10.5px; font-weight: 700;
            cursor: pointer;
            transition: all 0.15s ease;
            user-select: none;
          }
          .lset-flag:hover { background: var(--bg-pure-white); border-color: var(--border-slate-200); }
          .lset-flag.is-on {
            background: rgba(245,158,11,0.08);
            border-color: rgba(245,158,11,0.28);
            color: #d97706;
          }
          .lset-flag.is-final {
            background: rgba(16,185,129,0.08);
            border-color: rgba(16,185,129,0.28);
            color: #059669;
          }

          .lset-visibility { display: inline-flex; align-items: center; gap: 8px; }
          .lset-vis-label { font-size: 11px; font-weight: 700; color: var(--text-slate-400); letter-spacing: 0.02em; }
          .lset-vis-label.is-on { color: #10b981; }

          .lset-row-actions { display: inline-flex; gap: 4px; align-items: center; justify-content: flex-end; }
          .lset-icon-btn {
            width: 28px; height: 28px;
            border-radius: 8px;
            background: transparent;
            border: 1px solid transparent;
            color: var(--text-slate-500);
            cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
            transition: all 0.15s ease;
          }
          .lset-icon-btn:hover { background: var(--bg-slate-50); border-color: var(--border-slate-100); color: #6366f1; }
          .lset-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .lset-icon-btn.lset-icon-danger:hover { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.2); color: #dc2626; }

          .lset-action-cell { display: flex; align-items: center; gap: 12px; }
          .lset-action-icon {
            width: 34px; height: 34px;
            border-radius: 10px;
            display: inline-flex; align-items: center; justify-content: center;
            flex-shrink: 0; font-size: 14px;
          }
          .lset-action-text { display: flex; flex-direction: column; gap: 2px; }
          .lset-action-name { font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
          .lset-action-meta { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }
          .lset-cat-pill {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 3px 10px;
            border-radius: 7px;
            background: rgba(99,102,241,0.08);
            color: #6366f1;
            border: 1px solid rgba(99,102,241,0.2);
            font-size: 11px; font-weight: 700;
            text-transform: capitalize;
          }
          .lset-meta-text { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }

          .lset-platform-cell { display: flex; align-items: center; gap: 10px; min-width: 0; }
          .lset-platform-logo {
            width: 28px; height: 28px;
            border-radius: 7px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            display: inline-flex; align-items: center; justify-content: center;
            color: var(--text-slate-400);
            flex-shrink: 0;
            overflow: hidden;
          }
          .lset-platform-logo img {
            width: 100%; height: 100%;
            object-fit: contain;
          }
          .lset-platform-id { display: flex; flex-direction: column; min-width: 0; }
          .lset-platform-name {
            font-weight: 700;
            font-size: 12.5px;
            color: var(--text-slate-900);
            line-height: 1.2;
          }
          .lset-platform-code {
            font-size: 10.5px;
            font-weight: 600;
            font-family: var(--font-mono, monospace);
            letter-spacing: 0.04em;
            color: var(--text-slate-400);
            margin-top: 1px;
          }

          .pp-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
          .pp-star { background: none; border: none; cursor: pointer; padding: 0; color: var(--text-slate-300); line-height: 0; flex-shrink: 0; }
          .pp-star:hover, .pp-star.is-on { color: #3B82F6; }
          .pp-star .anticon { font-size: 13px !important; }
          .pp-name-icon {
            width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center; color: #3B82F6;
            background: var(--bg-blue-50);
          }
          .pp-name-icon .anticon { font-size: 12px !important; }
          .pp-name-title { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .pp-tag {
            display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
            border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap;
          }
          .pp-tag--blue { background: var(--bg-blue-50); color: #3B82F6; }
          .pp-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
          .pp-add { font-size: 11.5px; color: var(--text-slate-400); cursor: default; }
          .pp-muted { color: var(--text-slate-400); }

          .pp-maillink {
            display: inline-flex; align-items: center; gap: 5px; background: none; border: none; cursor: pointer;
            font-size: 11.5px; font-weight: 700; color: #3B82F6; padding: 0;
          }
          .pp-maillink.is-sent { color: #10b981; }

          .pp-creator { display: flex; align-items: center; gap: 6px; }
          .pp-creator-name { font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; }
          .pp-date { display: flex; flex-direction: column; line-height: 1.25; }
          .pp-date-main { font-size: 11px; font-weight: 500; color: var(--text-slate-700); }
          .pp-date-sub { font-size: 9.5px; color: var(--text-slate-400); }

          .pp-vis-pill {
            display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
            border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
          }
          .pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }
          .pp-status-opt { display: inline-flex; align-items: center; gap: 8px; }
          .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
          .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

          /* Footer + pager */
          .pp-footer {
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
            padding: 0 14px; border-top: 1px solid var(--border-slate-200);
            height: 52px !important;
            box-sizing: border-box;
          }
          .pp-footer--sticky {
            position: sticky; bottom: 0; z-index: 30; margin: 8px -18px 0; padding: 0 18px;
            background: var(--bg-pure-white);
            box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
            height: 52px !important;
            box-sizing: border-box;
          }
          .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
          .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
          .pp-footer-sel { color: #3B82F6; font-weight: 600; }
          .pp-pager { display: flex; align-items: center; gap: 3px; }
          .pp-pager-btn, .pp-pager-num {
            min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
          .pp-pagesize { margin-left: 5px; }
          .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

          /* Empty + grid */
          .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
          .pp-empty-orb {
            width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
            background: var(--bg-blue-50); color: #3B82F6; margin-bottom: 16px;
          }
          .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
          .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
          .pp-btn-primary {
            background: #3B82F6 !important; border: none !important;
            border-radius: 0 !important; font-weight: 600 !important;
          }
          .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

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
            overflow: hidden;
          }
          .pc-avatar img { width: 100%; height: 100%; object-fit: contain; border-radius: inherit; }
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
          .pc-foot-val { font-size: 11.5px; color: var(--text-slate-700); }
          .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }

          /* Premium action dropdown */
          .pp-action-pop .ant-dropdown-menu {
            padding: 6px; border-radius: 0; min-width: 236px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          }
          .pp-action-pop .ant-dropdown-menu-item {
            padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
            transition: background .12s ease;
          }
          .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
          .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
          .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
          .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
          .pp-menu-ic {
            width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
          }
          .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
          .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
          .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
          .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
          .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
          .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
          .pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

          .pp-mobile-menu-btn { display: none !important; }

          @media (max-width: 700px) {
            .pp-grid { grid-template-columns: 1fr; }
            .pp-stats { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 1100px) {
            .pp-stats { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 820px) {
            .pp-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
            .pp-main { height: auto; overflow: visible; }
            .pp-body { overflow: visible; }
            .pp-sidebar {
              position: fixed; top: 0; left: -320px; bottom: 0; z-index: 1100;
              height: 100%; max-height: none; display: flex; flex-direction: column;
              align-items: stretch; background: var(--bg-pure-white); width: 280px;
              box-sizing: border-box; transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: 4px 0 24px rgba(0,0,0,0.08); display: flex !important;
            }
            .pp-sidebar.is-open { left: 0; }
            .pp-topbar { flex-direction: column; align-items: flex-start; gap: 12px; }
            .pp-topbar-actions { width: 100%; justify-content: flex-start; }
            .pp-topbar-meta { display: none; }
            .pp-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; color: var(--text-slate-700); }
            .pp-mobile-overlay {
              position: fixed; top: 0; left: 0; right: 0; bottom: 0;
              background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
            }
          }

          /* Dark Mode Refinements */
          [data-theme='dark'] .pp-shell {
            background: #0B0F1A !important;
          }
          [data-theme='dark'] .pp-sidebar {
            background: #0B0F1A !important;
            border-right-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-side-head {
            border-bottom-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-side-title {
            color: #FFFFFF !important;
          }
          [data-theme='dark'] .pp-view-item:hover {
            background: #161B22 !important;
          }
          [data-theme='dark'] .pp-view-item.is-active {
            background: rgba(59, 130, 246, 0.15) !important;
          }
          [data-theme='dark'] .pp-view-label {
            color: #94A3B8 !important;
          }
          [data-theme='dark'] .pp-view-item.is-active .pp-view-label {
            color: #FFFFFF !important;
          }
          [data-theme='dark'] .pp-search-wrap {
            background: #0B0F1A !important;
            border-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-search {
            color: #FFFFFF !important;
          }
          [data-theme='dark'] .pp-ghost-btn {
            background: #0B0F1A !important;
            border-color: #1F2937 !important;
            color: #94A3B8 !important;
          }
          [data-theme='dark'] .pp-divider {
            background: #1F2937 !important;
          }
          [data-theme='dark'] .pp-stat-card {
            background: #0B0F1A !important;
            border-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-stat-card:hover {
            border-color: #1F2937 !important;
            box-shadow: none !important;
          }
          [data-theme='dark'] .pp-stat-label {
            color: #94A3B8 !important;
          }
          [data-theme='dark'] .pp-stat-value {
            color: #FFFFFF !important;
          }
          [data-theme='dark'] .pp-table-wrap {
            background: #0B0F1A !important;
            border-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-table .ant-table-thead > tr > th {
            background: #0B0F1A !important;
            border-bottom-color: #1F2937 !important;
            color: #94A3B8 !important;
          }
          [data-theme='dark'] .pp-table .ant-table-tbody > tr > td {
            background: #0B0F1A !important;
            border-bottom-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td {
            background: #161B22 !important;
          }
          [data-theme='dark'] .pp-segmented {
            background: #0B0F1A !important;
            border-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-segmented button.is-active {
            background: #161B22 !important;
            color: #FFFFFF !important;
          }
          [data-theme='dark'] .pc-card {
            background: #0B0F1A !important;
            border-color: #1F2937 !important;
          }
          [data-theme='dark'] .pc-top {
            border-bottom-color: #1F2937 !important;
          }
          [data-theme='dark'] .pc-title {
            color: #FFFFFF !important;
          }
          [data-theme='dark'] .pc-client-val {
            color: #94A3B8 !important;
          }
          [data-theme='dark'] .pc-foot {
            background: #161B22 !important;
            border-top-color: #1F2937 !important;
          }
          [data-theme='dark'] .pc-foot-row {
            border-top-color: #1F2937 !important;
          }
          [data-theme='dark'] .pc-foot-val {
            color: #94A3B8 !important;
          }

          /* Dark theme pagination/footer overrides */
          [data-theme='dark'] .pp-footer {
            background: #0B0F1A !important;
            border-top-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-footer--sticky {
            background: #0B0F1A !important;
            border-top-color: #1F2937 !important;
          }
          [data-theme='dark'] .pp-footer-info strong { color: #ffffff; }
          [data-theme='dark'] .pp-pager-btn, [data-theme='dark'] .pp-pager-num {
            background: #161B22;
            border-color: #30363d;
            color: #8b949e;
          }

          /* Dark mode overrides for table cell content */
          [data-theme='dark'] .lset-status-meta { color: #8b949e !important; }
          [data-theme='dark'] .lset-rank { background: #161b22 !important; border-color: #30363d !important; color: #8b949e !important; }
          [data-theme='dark'] .lset-flag { background: #161b22 !important; border-color: #30363d !important; color: #8b949e !important; }
          [data-theme='dark'] .lset-flag:hover { background: #21262d !important; border-color: #8b949e !important; }
          [data-theme='dark'] .lset-vis-label { color: #8b949e !important; }
          [data-theme='dark'] .lset-vis-label.is-on { color: #58a6ff !important; }
          [data-theme='dark'] .lset-action-name { color: #f0f6fc !important; }
          [data-theme='dark'] .lset-action-meta { color: #8b949e !important; }
          [data-theme='dark'] .lset-platform-name { color: #f0f6fc !important; }
          [data-theme='dark'] .lset-platform-code { color: #8b949e !important; }

                    /* ============================================== */
                    /*  Drawer & Form custom styles from Leads settings*/
                    /* ============================================== */
                    .lset-drawer .ant-drawer-header { padding: 0 !important; border-bottom: 1px solid var(--border-slate-100); }
                    .lset-drawer .ant-drawer-header-title { padding: 12px 18px; }
                    .lset-drawer .ant-drawer-body { padding: 14px 18px; background: var(--bg-pure-white); }
                    .lset-drawer .ant-drawer-footer { padding: 0; border-top: 1px solid var(--border-slate-100); background: var(--bg-pure-white); }
                    .lset-drawer-bg {
                        position: absolute; inset: 0; pointer-events: none;
                        background:
                          radial-gradient(60% 80% at 100% 0%, rgba(139,92,246,0.08) 0%, transparent 55%),
                          radial-gradient(60% 60% at 0% 100%, rgba(99,102,241,0.06) 0%, transparent 60%);
                    }
                    .lset-drawer-icon {
                        width: 42px; height: 42px; border-radius: 12px;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: #fff; display: inline-flex; align-items: center; justify-content: center;
                        box-shadow: 0 6px 14px -4px rgba(99,102,241,0.45);
                        flex-shrink: 0;
                    }
                    .lset-drawer-title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.01em; }
                    .lset-drawer-sub { font-size: 11px; color: var(--text-slate-500); font-weight: 500; margin-top: 1px; }
                    .lset-drawer-icon { width: 32px !important; height: 32px !important; border-radius: 8px !important; }
                    .lset-drawer-icon svg { width: 14px; height: 14px; }
                    .lset-drawer-badge { font-size: 9.5px !important; padding: 2px 7px !important; }
                    .lset-drawer-badge {
                        display: inline-flex; align-items: center; gap: 4px;
                        padding: 3px 9px; border-radius: 999px;
                        background: rgba(99,102,241,0.1); color: #6366f1;
                        border: 1px solid rgba(99,102,241,0.22);
                        font-size: 9px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
                        flex-shrink: 0;
                    }
                    .lset-drawer-footer {
                        display: flex; align-items: center; justify-content: space-between; gap: 12px;
                        padding: 14px 24px;
                    }
                    .lset-drawer-footer-hint {
                        display: inline-flex; align-items: center; gap: 6px;
                        font-size: 11px; color: var(--text-slate-400); font-weight: 600;
                    }
                    .lset-drawer-footer-hint svg { color: #10b981; }
                    .lset-btn-cancel {
                        border-radius: 10px !important;
                        height: 31px !important;
                        font-weight: 700 !important;
                        font-size: 13px !important;
                        padding: 0 14px !important;
                    }

                    /* SECTION CARDS IN DRAWER */
                    .lset-section-card {
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 10px;
                        padding: 10px 12px 4px;
                        margin-bottom: 10px;
                        transition: border-color 0.15s ease;
                    }
                    .lset-section-card:hover { border-color: var(--border-slate-200); }
                    .lset-section-head {
                        display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px;
                    }
                    .lset-section-step {
                        width: 22px; height: 22px; border-radius: 6px;
                        display: inline-flex; align-items: center; justify-content: center;
                        font-size: 10px; font-weight: 800; flex-shrink: 0;
                    }
                    .lset-section-row { display: flex; align-items: center; gap: 5px; }
                    .lset-section-title { font-size: 11px; font-weight: 800; color: var(--text-slate-900); text-transform: uppercase; letter-spacing: 0.04em; }
                    .lset-section-sub { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; display: block; line-height: 1.35; margin-top: 1px; }

                    .lset-form-label { font-size: 11px; font-weight: 700; color: var(--text-slate-700); }
                    .lset-drawer-form .ant-form-item { margin-bottom: 10px; }
                    .lset-drawer-form .ant-form-item-label { padding-bottom: 4px !important; }
                    .lset-drawer-form .ant-form-item-label > label { height: auto !important; }
                    .lset-drawer-form .ant-input,
                    .lset-drawer-form .ant-input-affix-wrapper,
                    .lset-drawer-form .ant-select-selector,
                    .lset-drawer-form .ant-picker {
                        border-radius: 8px !important;
                        border-color: var(--border-slate-200) !important;
                        transition: border-color 0.15s ease, box-shadow 0.15s ease;
                    }
                    .lset-drawer-form .ant-input,
                    .lset-drawer-form .ant-input-affix-wrapper > input,
                    .lset-drawer-form .ant-select-selection-item,
                    .lset-drawer-form .ant-select-selection-placeholder {
                        font-size: 12.5px !important;
                    }
                    .lset-drawer-form .ant-input,
                    .lset-drawer-form .ant-input-affix-wrapper {
                        padding: 5px 10px !important;
                    }
                    .lset-drawer-form .ant-select-single .ant-select-selector {
                        height: 32px !important;
                    }
                    .lset-drawer-form .ant-select-single .ant-select-selector .ant-select-selection-item,
                    .lset-drawer-form .ant-select-single .ant-select-selector .ant-select-selection-placeholder {
                        line-height: 30px !important;
                    }
                    .lset-drawer-form .ant-segmented {
                        background: var(--bg-slate-50) !important;
                        padding: 3px !important;
                        border-radius: 8px !important;
                    }
                    .lset-drawer-form .ant-segmented .ant-segmented-item {
                        border-radius: 6px !important;
                    }
                    .lset-drawer-form .ant-input:focus,
                    .lset-drawer-form .ant-input-affix-wrapper-focused,
                    .lset-drawer-form .ant-select-focused .ant-select-selector,
                    .lset-drawer-form .ant-picker-focused {
                        border-color: #6366f1 !important;
                        box-shadow: 0 0 0 2px rgba(99,102,241,0.12) !important;
                    }
                    .lset-drawer-form .ant-color-picker-trigger { border-radius: 8px !important; }

                    .lset-toggle-row {
                        display: flex; justify-content: space-between; align-items: center;
                        padding: 8px 12px;
                        border-radius: 8px;
                        background: var(--bg-slate-50);
                        border: 1px solid var(--border-slate-100);
                        margin-bottom: 8px;
                    }
                    .lset-toggle-row:last-child { margin-bottom: 0; }
                    .lset-toggle-text { display: flex; flex-direction: column; gap: 1px; }
                    .lset-toggle-title { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 700; color: var(--text-slate-900); }
                    .lset-toggle-sub { font-size: 10.5px; color: var(--text-slate-500); font-weight: 500; }

                    .lset-drawer-note {
                        display: flex; gap: 8px; align-items: center;
                        padding: 8px 10px;
                        border-radius: 8px;
                        background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.04));
                        border: 1px solid rgba(99,102,241,0.18);
                        margin-top: 8px;
                    }
                    .lset-drawer-note-icon {
                        width: 20px; height: 20px; border-radius: 6px;
                        background: rgba(99,102,241,0.14); color: #6366f1;
                        display: inline-flex; align-items: center; justify-content: center;
                        flex-shrink: 0;
                    }
                    .lset-drawer-note-icon svg { width: 11px; height: 11px; }
                    .lset-drawer-note-text { font-size: 10.5px; color: var(--text-slate-700); line-height: 1.4; font-weight: 500; }

                    /* Logo picker */
                    .lset-logo-picker { display: flex; flex-direction: column; gap: 8px; }
                    .lset-logo-mode .ant-segmented {
                        background: var(--bg-slate-50) !important;
                        padding: 2px !important;
                        border-radius: 8px !important;
                    }
                    .lset-icon-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
                        gap: 6px;
                        padding: 8px;
                        background: var(--bg-slate-50);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 8px;
                    }
                    .lset-icon-tile {
                        all: unset;
                        position: relative;
                        height: 36px;
                        border: 1px solid var(--border-slate-100);
                        border-radius: 7px;
                        background: var(--bg-pure-white);
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: border-color .15s ease, transform .15s ease;
                    }
                    .lset-icon-tile:hover { border-color: var(--border-slate-200); transform: translateY(-1px); }
                    .lset-icon-tile.is-active { border-width: 1.5px; }
                    .lset-icon-tile-check {
                        position: absolute;
                        top: -4px; right: -4px;
                        width: 14px; height: 14px;
                        border-radius: 50%;
                        color: #fff;
                        display: inline-flex; align-items: center; justify-content: center;
                        border: 2px solid var(--bg-pure-white);
                    }
                    .lset-logo-dropzone .ant-upload {
                        padding: 8px 10px !important;
                        border-radius: 8px !important;
                    }
                    .lset-logo-drop-content {
                        display: flex; align-items: center; gap: 10px;
                        color: var(--text-slate-500);
                    }
                    .lset-logo-drop-title {
                        font-size: 11.5px;
                        font-weight: 700;
                        color: var(--text-slate-700);
                    }
                    .lset-logo-drop-sub {
                        font-size: 10px;
                        color: var(--text-slate-400);
                        margin-top: 1px;
                    }
                    .lset-logo-preview {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        padding: 6px 8px;
                        border-radius: 8px;
                        border: 1px solid var(--border-slate-100);
                        background: var(--bg-pure-white);
                    }
                    .lset-logo-preview img {
                        width: 34px; height: 34px;
                        border-radius: 6px;
                        object-fit: contain;
                        background: var(--bg-slate-50);
                        border: 1px solid var(--border-slate-100);
                    }
                    .lset-logo-preview-actions { display: flex; gap: 6px; margin-left: auto; }
                    .lset-logo-preview-actions .ant-btn { height: 24px !important; font-size: 11px !important; padding: 0 8px !important; }

                    .lset-platform-url {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        font-size: 12px;
                        color: #3b82f6;
                        text-decoration: none;
                        max-width: 260px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .lset-platform-url:hover { text-decoration: underline; }

                    [data-theme='dark'] .lset-drawer .ant-drawer-content { background: #161b22 !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-body { background: #161b22 !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-header { border-bottom-color: #30363d !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-footer { background: #161b22 !important; border-top-color: #30363d !important; }
                    [data-theme='dark'] .lset-drawer-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-form-label { color: #c9d1d9 !important; }
                    [data-theme='dark'] .lset-drawer-form .ant-input,
                    [data-theme='dark'] .lset-drawer-form .ant-input-affix-wrapper,
                    [data-theme='dark'] .lset-drawer-form .ant-select-selector,
                    [data-theme='dark'] .lset-drawer-form .ant-picker {
                        background: #0d1117 !important;
                        border-color: #30363d !important;
                        color: #c9d1d9 !important;
                    }
                    [data-theme='dark'] .lset-toggle-row { background: #161b22 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-toggle-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-toggle-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-drawer-note { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.2) !important; }
                    [data-theme='dark'] .lset-drawer-note-icon { background: rgba(99,102,241,0.2) !important; color: #818cf8 !important; }
                    [data-theme='dark'] .lset-drawer-note-text { color: #c9d1d9 !important; }
                    [data-theme='dark'] .lset-logo-preview { background: #161b22 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-logo-preview img { background: #0d1117 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-icon-tile { background: #161b22 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-icon-tile:hover { border-color: #3d444d !important; }
                    [data-theme='dark'] .lset-icon-tile-check { border-color: #161b22 !important; }
                    [data-theme='dark'] .lset-icon-grid { background: #0d1117 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-logo-mode .ant-segmented { background: #0d1117 !important; }
                    [data-theme='dark'] .lset-drawer-footer-hint { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-btn-cancel { background: #21262d !important; border-color: #30363d !important; color: #c9d1d9 !important; }

                    /* Autofill fix for dark mode */
                    [data-theme='dark'] input:-webkit-autofill,
                    [data-theme='dark'] input:-webkit-autofill:hover,
                    [data-theme='dark'] input:-webkit-autofill:focus,
                    [data-theme='dark'] textarea:-webkit-autofill,
                    [data-theme='dark'] textarea:-webkit-autofill:hover,
                    [data-theme='dark'] textarea:-webkit-autofill:focus,
                    [data-theme='dark'] select:-webkit-autofill,
                    [data-theme='dark'] select:-webkit-autofill:hover,
                    [data-theme='dark'] select:-webkit-autofill:focus {
                        -webkit-text-fill-color: #c9d1d9 !important;
                        -webkit-box-shadow: 0 0 0px 1000px #0d1117 inset !important;
                        transition: background-color 5000s ease-in-out 0s;
                    }

                    /* --- Responsiveness for Leads Settings Page --- */
                    @media (max-width: 987px) {
                        .lset-hero {
                            padding: 12px 24px !important;
                        }
                        .lset-hero-row {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                            gap: 12px !important;
                        }
                        .lset-hero-left {
                            width: 100% !important;
                        }
                        .lset-hero-title-row {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                            gap: 4px !important;
                        }
                        .lset-hero-divider {
                            display: none !important;
                        }
                        .lset-hero-actions {
                            width: 100% !important;
                            justify-content: flex-start !important;
                            gap: 8px !important;
                        }
                        .lset-search {
                            flex: 1 !important;
                            width: 100% !important;
                        }
                        .lset-cta-btn {
                            flex-shrink: 0 !important;
                        }
                        .lset-body-container {
                            padding: 16px 24px 0 !important;
                        }
                        .lset-table-head {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                            gap: 10px !important;
                            padding: 14px 24px !important;
                        }
                    }

                    @media (max-width: 560px) {
                        .lset-hero-actions {
                            flex-direction: column !important;
                            align-items: stretch !important;
                        }
                        .lset-cta-btn {
                            width: 100% !important;
                            justify-content: center !important;
                        }
                        .lset-segments {
                            flex-direction: column !important;
                            align-items: stretch !important;
                        }
                        .lset-segment {
                            width: 100% !important;
                            justify-content: center !important;
                        }
                    }
                    `,
                }} />
            </MainLayout>
        </ProtectedRoute>
    );
}
