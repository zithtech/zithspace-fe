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
    Rocket
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
    Popconfirm,
    Switch,
    ColorPicker,
    Drawer,
    Tooltip,
    Upload,
    Tag,
    Segmented
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
} from "@ant-design/icons";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { useLeadSettings } from "@/hooks/useLeadSettings";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { useActivitySource } from "@/hooks/useActivitySource";

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
    { key: "upwork",        label: "Upwork",         brand: "#14a800", kinds: ["online"], render: (s) => <UpworkGlyph size={s} /> },
    { key: "linkedin",      label: "LinkedIn",       brand: "#0a66c2", kinds: ["online"], render: (s) => <Linkedin size={s} strokeWidth={2.4} /> },
    { key: "freelancer",    label: "Freelancer",     brand: "#29b2fe", kinds: ["online"], render: (s) => <FreelancerGlyph size={s} /> },
    { key: "fiverr",        label: "Fiverr",         brand: "#1dbf73", kinds: ["online"], render: (s) => <FiverrGlyph size={s} /> },
    { key: "toptal",        label: "Toptal",         brand: "#204ecf", kinds: ["online"], render: renderLetter("T") },
    { key: "guru",          label: "Guru",           brand: "#ff7a18", kinds: ["online"], render: renderLetter("G") },
    { key: "peopleperhour", label: "PeoplePerHour",  brand: "#ff7c00", kinds: ["online"], render: renderLetter("P") },
    { key: "hubstaff",      label: "Hubstaff",       brand: "#3aabea", kinds: ["online"], render: renderLetter("H") },
    { key: "indeed",        label: "Indeed",         brand: "#003a9b", kinds: ["online"], render: renderLetter("I") },

    // Own-website generic icons (5 common picks for marketing sites / contact forms)
    { key: "globe",         label: "Web presence",   brand: "#6366f1", kinds: ["website", "online"], render: (s) => <Globe size={s} strokeWidth={2.2} /> },
    { key: "sparkles",      label: "Marketing site", brand: "#8b5cf6", kinds: ["website"],            render: (s) => <Sparkles size={s} strokeWidth={2.2} /> },
    { key: "briefcase",     label: "Business site",  brand: "#475569", kinds: ["website", "online"], render: (s) => <Briefcase size={s} strokeWidth={2.2} /> },
    { key: "star",          label: "Featured / SaaS", brand: "#f59e0b", kinds: ["website"],            render: (s) => <Star size={s} strokeWidth={2.2} /> },
    { key: "zap",           label: "Launch / product", brand: "#ec4899", kinds: ["website"],          render: (s) => <Zap size={s} strokeWidth={2.2} /> },
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
            { name: "Call Attended",  icon: "phone", color: "#10b981" },
            { name: "Call Rejected",  icon: "close", color: "#ef4444" },
            { name: "Call Missed",    icon: "close", color: "#f59e0b" },
            { name: "Voicemail Left", icon: "phone", color: "#94a3b8" },
            { name: "SMS Sent",       icon: "message", color: "#3b82f6" },
            { name: "WhatsApp Sent",  icon: "message", color: "#25d366" },
        ],
    },
    {
        category: "Email",
        icon: "mail", color: "#8b5cf6",
        types: [
            { name: "Initial Outreach", icon: "send", color: "#3b82f6" },
            { name: "Follow-up Sent",   icon: "send", color: "#8b5cf6" },
            { name: "Reply Received",   icon: "mail", color: "#10b981" },
            { name: "Email Opened",     icon: "mail", color: "#3b82f6" },
            { name: "Email Bounced",    icon: "close", color: "#ef4444" },
            { name: "Unsubscribed",     icon: "close", color: "#94a3b8" },
        ],
    },
    {
        category: "Meetings",
        icon: "calendar", color: "#10b981",
        types: [
            { name: "Discovery Call Scheduled", icon: "phone",    color: "#3b82f6" },
            { name: "Demo Scheduled",           icon: "calendar", color: "#8b5cf6" },
            { name: "Demo Completed",           icon: "check",    color: "#10b981" },
            { name: "No-show",                  icon: "close",    color: "#f59e0b" },
            { name: "Rescheduled",              icon: "clock",    color: "#f59e0b" },
            { name: "Internal Sync",            icon: "team",     color: "#06b6d4" },
        ],
    },
    {
        category: "Documentation",
        icon: "file", color: "#f59e0b",
        types: [
            { name: "Proposal Sent",          icon: "send", color: "#6366f1" },
            { name: "Contract Sent",          icon: "file", color: "#f59e0b" },
            { name: "NDA Signed",             icon: "check", color: "#10b981" },
            { name: "Quote Generated",        icon: "file", color: "#06b6d4" },
            { name: "Invoice Sent",           icon: "send", color: "#10b981" },
            { name: "Onboarding Doc Shared",  icon: "link", color: "#3b82f6" },
        ],
    },
    {
        category: "Pipeline",
        icon: "send", color: "#ec4899",
        types: [
            { name: "Stage Advanced", icon: "send",  color: "#10b981" },
            { name: "Stage Reverted", icon: "link",  color: "#f59e0b" },
            { name: "Marked as Won",  icon: "check", color: "#10b981" },
            { name: "Marked as Lost", icon: "close", color: "#ef4444" },
            { name: "Disqualified",   icon: "close", color: "#94a3b8" },
            { name: "Reactivated",    icon: "check", color: "#3b82f6" },
        ],
    },
    {
        category: "Research",
        icon: "user", color: "#06b6d4",
        types: [
            { name: "LinkedIn Profile Reviewed", icon: "user", color: "#0a66c2" },
            { name: "Company Website Checked",   icon: "link", color: "#3b82f6" },
            { name: "Competitor Analysis",       icon: "user", color: "#8b5cf6" },
            { name: "Persona Mapped",            icon: "team", color: "#06b6d4" },
            { name: "BANT Qualification",        icon: "check", color: "#10b981" },
        ],
    },
    {
        category: "Notes",
        icon: "message", color: "#64748b",
        types: [
            { name: "Internal Note Added",       icon: "message", color: "#64748b" },
            { name: "Decision Logged",           icon: "check",   color: "#10b981" },
            { name: "Risk Flagged",              icon: "close",   color: "#ef4444" },
            { name: "Follow-up Reminder Set",    icon: "clock",   color: "#f59e0b" },
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
    { key: "flag",        label: "Milestone",   render: (s) => <Flag        size={s} strokeWidth={2.2} /> },
    { key: "target",      label: "Qualified",   render: (s) => <Target      size={s} strokeWidth={2.2} /> },
    { key: "compass",     label: "Discovery",   render: (s) => <Compass     size={s} strokeWidth={2.2} /> },
    { key: "sparkles",    label: "Opportunity", render: (s) => <Sparkles    size={s} strokeWidth={2.2} /> },
    { key: "megaphone",   label: "Outreach",    render: (s) => <Megaphone   size={s} strokeWidth={2.2} /> },
    { key: "handshake",   label: "Negotiation", render: (s) => <Handshake   size={s} strokeWidth={2.2} /> },
    { key: "rocket",      label: "Launch",      render: (s) => <Rocket      size={s} strokeWidth={2.2} /> },
    { key: "shield-check",label: "Verified",    render: (s) => <ShieldCheck size={s} strokeWidth={2.2} /> },
    { key: "trophy",      label: "Won",         render: (s) => <Trophy      size={s} strokeWidth={2.2} /> },
    { key: "award",       label: "Converted",   render: (s) => <Award       size={s} strokeWidth={2.2} /> },
];
const STATUS_ICON_BY_KEY: Record<string, StatusIconMeta> = STATUS_ICON_OPTIONS.reduce(
    (acc, i) => { acc[i.key] = i; return acc; }, {} as Record<string, StatusIconMeta>,
);
const renderStatusIcon = (key: string | undefined, size: number, color?: string) => {
    if (!key) return null;
    const meta = STATUS_ICON_BY_KEY[key];
    if (!meta) return null;
    return <span style={{ color, display: "inline-flex" }}>{meta.render(size)}</span>;
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
    { name: "Lead Captured",       category: "prospecting", color: "#94a3b8", icon: "flag" },
    { name: "Qualified",           category: "qualifying",  color: "#3b82f6", icon: "target" },
    { name: "Disqualified",        category: "qualifying",  color: "#94a3b8", icon: "target" },
    // Assignment / outreach
    { name: "Assigned",            category: "assignment",  color: "#6366f1", icon: "flag" },
    { name: "Contacted",           category: "outreach",    color: "#0ea5e9", icon: "megaphone" },
    { name: "Follow Up",           category: "outreach",    color: "#ec4899", icon: "megaphone" },
    // Meetings
    { name: "Discovery Call",      category: "meetings",    color: "#06b6d4", icon: "compass" },
    { name: "Demo Scheduled",      category: "meetings",    color: "#8b5cf6", icon: "compass" },
    { name: "Demo Completed",      category: "meetings",    color: "#10b981", icon: "shield-check" },
    // Proposal / negotiation
    { name: "Proposal Draft",      category: "proposal",    color: "#f59e0b", icon: "sparkles" },
    { name: "Proposal Sent",       category: "proposal",    color: "#8b5cf6", icon: "rocket" },
    { name: "Negotiation",         category: "negotiation", color: "#ec4899", icon: "handshake" },
    // Holding states
    { name: "On Hold",             category: "paused",      color: "#f59e0b", icon: "flag" },
    { name: "Nurturing",           category: "paused",      color: "#94a3b8", icon: "sparkles" },
    // Terminal
    { name: "Won",                 category: "closed_won",  color: "#10b981", icon: "trophy", isFinal: true },
    { name: "Lost",                category: "closed_lost", color: "#ef4444", icon: "flag",   isFinal: true },
    { name: "Converted Clients",   category: "converted",   color: "#06b6d4", icon: "award",  isFinal: true },
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

const renderPlatformLogo = (v: string | undefined, size: number, fallbackColor: string = "var(--text-slate-400)") => {
    const parsed = parseLogoValue(v);
    if (parsed.kind === "icon") {
        const meta = ICON_BY_KEY[parsed.iconKey!];
        if (meta) {
            return (
                <span style={{ color: meta.brand, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
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
                    { value: "icon",  label: <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5 }}><Sparkles size={11} /> Built-in icon</span> },
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
    const [form] = Form.useForm();
    const [activeTab, setActiveTab] = useState<"1" | "2" | "3">("1");
    const [editingId, setEditingId] = useState<string | null>(null);
    const { message } = App.useApp();
    const [searchText, setSearchText] = useState("");
    const [filterMode, setFilterMode] = useState<"all" | "active" | "hidden">("all");

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
            color: s.color,
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
            color: a.color,
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
            color: p.logo_url ? '#06b6d4' : undefined,
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
        { name: "Upwork",           url: "https://www.upwork.com",        brand: "#14a800", iconKey: "upwork" },
        { name: "LinkedIn",         url: "https://www.linkedin.com",      brand: "#0a66c2", iconKey: "linkedin" },
        { name: "Freelancer",       url: "https://www.freelancer.com",    brand: "#29b2fe", iconKey: "freelancer" },
        { name: "Fiverr",           url: "https://www.fiverr.com",        brand: "#1dbf73", iconKey: "fiverr" },
        { name: "Toptal",           url: "https://www.toptal.com",        brand: "#204ecf", iconKey: "toptal" },
        { name: "Guru",             url: "https://www.guru.com",          brand: "#ff7a18", iconKey: "guru" },
        { name: "PeoplePerHour",    url: "https://www.peopleperhour.com", brand: "#ff7c00", iconKey: "peopleperhour" },
        { name: "Hubstaff Talent",  url: "https://talent.hubstaff.com",   brand: "#3aabea", iconKey: "hubstaff" },
        { name: "Indeed",           url: "https://www.indeed.com",        brand: "#003a9b", iconKey: "indeed" },
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

    const categoryMeta = [
        { key: "1" as const, label: "Pipeline Statuses", icon: <Activity size={16} />,  accent: "#6366f1", description: "Stages your leads flow through — color, default and final markers." },
        { key: "2" as const, label: "Workflow Actions", icon: <Workflow size={16} />, accent: "#ec4899", description: "Operational triggers available across the lead workspace." },
        { key: "3" as const, label: "Platforms",        icon: <Globe size={16} />,    accent: "#06b6d4", description: "Sources leads come from — online gig platforms and your own websites." },
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
            title: "",
            key: "actions",
            align: "right" as const,
            width: 160,
            render: (_: any, record: any, index: number) => (
                <div className="lset-row-actions">
                    {canUpdateLeadSetting && (
                        <>
                            <Tooltip title="Move up">
                                <button className="lset-icon-btn" disabled={index === 0} onClick={() => moveRow(index, "up")} aria-label="Move up">
                                    <ArrowUp size={14} />
                                </button>
                            </Tooltip>
                            <Tooltip title="Move down">
                                <button className="lset-icon-btn" disabled={index === dataSource.length - 1} onClick={() => moveRow(index, "down")} aria-label="Move down">
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
                        <Popconfirm
                            title="Delete this status?"
                            description="Leads using this status may need reassignment."
                            onConfirm={async () => {
                                try {
                                    await deleteStatus(record.id);
                                    message.success("Status deleted successfully");
                                } catch (error) {
                                    message.error("Failed to delete status");
                                }
                            }}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <button className="lset-icon-btn lset-icon-danger" aria-label="Delete">
                                <Trash2 size={14} />
                            </button>
                        </Popconfirm>
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
                        <Popconfirm
                            title="Remove this action?"
                            onConfirm={async () => {
                                try {
                                    await deleteAction(record.id);
                                    message.success("Action removed successfully");
                                } catch (error) {
                                    message.error("Failed to remove action");
                                }
                            }}
                            okText="Remove"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                        >
                            <button className="lset-icon-btn lset-icon-danger" aria-label="Delete">
                                <Trash2 size={14} />
                            </button>
                        </Popconfirm>
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
                        <Popconfirm
                            title="Delete platform?"
                            description="This cannot be undone."
                            onConfirm={async () => {
                                try {
                                    await deletePlatform(record.id);
                                    message.success("Platform deleted");
                                } catch {
                                    message.error("Failed to delete platform");
                                }
                            }}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                        >
                            <button className="lset-icon-btn lset-icon-btn-danger" aria-label="Delete">
                                <Trash2 size={14} />
                            </button>
                        </Popconfirm>
                    )}
                </div>
            ),
        },
    ];

    const StatTile = ({
        icon,
        label,
        value,
        accent,
        sublabel,
    }: {
        icon: React.ReactNode;
        label: string;
        value: React.ReactNode;
        accent: string;
        sublabel?: string;
    }) => (
        <div className="lset-stat-tile">
            <div className="lset-stat-glow" style={{ background: `radial-gradient(120% 100% at 100% 0%, ${accent}10 0%, transparent 55%)` }} />
            <div className="lset-stat-row">
                <div className="lset-stat-text">
                    <span className="lset-stat-label">{label}</span>
                    <span className="lset-stat-value">{value}</span>
                    {sublabel && <span className="lset-stat-sub">{sublabel}</span>}
                </div>
                <div className="lset-stat-icon" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 6px 14px ${accent}33` }}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <ProtectedRoute>
            <MainLayout>
                <div className="lset-page">
                    <TimeTrackingHeader
                        icon={<Settings2 size={20} color="#6366f1" />}
                        title="Workflow Settings"
                        description="Configure pipeline statuses and lead actions"
                        style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 100,
                            borderBottom: '1px solid var(--border-slate-200)',
                            padding: '9.5px 32px',
                            marginBottom: 0,
                        }}
                    />

                    <div className="lset-shell">
                    {/* LEFT RAIL — category list */}
                    <aside className="lset-rail">
                        <div className="lset-rail-title">
                            <Settings2 size={13} />
                            <span>Workflow settings</span>
                        </div>
                        {categoryMeta.map(cat => {
                            const isActive = activeTab === cat.key;
                            const count = cat.key === "1" ? statuses.length : actions.length;
                            return (
                                <button
                                    key={cat.key}
                                    type="button"
                                    className={`lset-rail-card${isActive ? " is-active" : ""}`}
                                    style={isActive ? { borderColor: `${cat.accent}66`, background: `${cat.accent}12` } : {}}
                                    onClick={() => {
                                        setActiveTab(cat.key);
                                        setFilterMode("all");
                                    }}
                                >
                                    <span
                                        className="lset-rail-icon"
                                        style={{
                                            background: isActive ? `${cat.accent}26` : "var(--bg-slate-50)",
                                            color: isActive ? cat.accent : "var(--text-slate-500)",
                                        }}
                                    >
                                        {cat.icon}
                                    </span>
                                    <div className="lset-rail-text">
                                        <div className="lset-rail-label">{cat.label}</div>
                                        <div className="lset-rail-sub">{count} Definitions</div>
                                    </div>
                                </button>
                            );
                        })}
                    </aside>

                    {/* MAIN PANE */}
                    <main className="lset-pane">
                        {/* Hero */}
                        <header
                            className="lset-pane-hero"
                            style={{
                                background: `linear-gradient(135deg, ${currentCat.accent}14 0%, ${currentCat.accent}05 60%, transparent 100%)`,
                                borderColor: `${currentCat.accent}33`,
                            }}
                        >
                            <div className="lset-pane-hero-left">
                                <div
                                    className="lset-pane-hero-icon"
                                    style={{
                                        background: `linear-gradient(135deg, ${currentCat.accent} 0%, ${currentCat.accent}cc 100%)`,
                                        boxShadow: `0 10px 24px ${currentCat.accent}40`,
                                    }}
                                >
                                    {currentCat.icon}
                                </div>
                                <div className="lset-pane-hero-text">
                                    <div className="lset-pane-eyebrow">
                                        <span style={{ color: currentCat.accent }}>●</span>
                                        CONFIGURATION · {activeTab === "1" ? "STATUS" : activeTab === "2" ? "ACTION" : "PLATFORM"}
                                    </div>
                                    <div className="lset-pane-title-row">
                                        <h3 className="lset-pane-title">{currentCat.label}</h3>
                                        <span className="lset-pane-desc">{currentCat.description}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="lset-pane-hero-right">
                                <div className="lset-stat-chips">
                                    <div className="lset-stat-chip">
                                        <span className="lset-stat-chip-icon" style={{ background: `${currentCat.accent}1a`, color: currentCat.accent }}><BarChart3 size={11} /></span>
                                        <span className="lset-stat-chip-value">{currentItems.length}</span>
                                        <span className="lset-stat-chip-label">Total</span>
                                    </div>
                                    <div className="lset-stat-chip">
                                        <span className="lset-stat-chip-icon" style={{ background: "rgba(16,185,129,0.14)", color: "#10b981" }}><CheckCircle2 size={11} /></span>
                                        <span className="lset-stat-chip-value">{currentActive}</span>
                                        <span className="lset-stat-chip-label">Active</span>
                                    </div>
                                    <div className="lset-stat-chip">
                                        <span className="lset-stat-chip-icon" style={{ background: "rgba(148,163,184,0.18)", color: "#64748b" }}><Eye size={11} /></span>
                                        <span className="lset-stat-chip-value">{currentHidden}</span>
                                        <span className="lset-stat-chip-label">Hidden</span>
                                    </div>
                                    <div className="lset-stat-chip">
                                        <span className="lset-stat-chip-icon" style={{ background: "rgba(168,85,247,0.14)", color: "#a855f7" }}><Star size={11} /></span>
                                        <span className="lset-stat-chip-value">{currentThemed}</span>
                                        <span className="lset-stat-chip-label">Themed</span>
                                    </div>
                                </div>
                                <Button
                                    type="primary"
                                    icon={<Plus size={14} />}
                                    onClick={showDrawer}
                                    className="lset-cta-btn"
                                    disabled={!canCreateLeadSetting}
                                    style={{
                                        background: `linear-gradient(135deg, ${currentCat.accent} 0%, ${currentCat.accent}d9 100%)`,
                                        boxShadow: `0 6px 14px ${currentCat.accent}40`,
                                        border: "none",
                                    }}
                                >
                                    New Definition
                                </Button>
                            </div>
                        </header>

                        {/* Toolbar — search + filter chips */}
                        <div className="lset-toolbar">
                            <div className="lset-search-box">
                                <Search size={13} className="lset-search-icon" />
                                <input
                                    className="lset-search-input"
                                    placeholder={`Search ${currentCat.label.toLowerCase()} by label, key, or context…`}
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                                {searchText && (
                                    <button type="button" className="lset-search-clear" onClick={() => setSearchText("")}>Clear</button>
                                )}
                            </div>
                            <div className="lset-chips">
                                <button
                                    type="button"
                                    className={`lset-chip${filterMode === "all" ? " is-active" : ""}`}
                                    onClick={() => setFilterMode("all")}
                                >
                                    All
                                    <span className="lset-chip-count">{currentItems.length}</span>
                                </button>
                                <button
                                    type="button"
                                    className={`lset-chip${filterMode === "active" ? " is-active" : ""}`}
                                    onClick={() => setFilterMode("active")}
                                >
                                    <CheckCircle2 size={11} style={{ color: "#10b981" }} />
                                    Active
                                    <span className="lset-chip-count">{currentActive}</span>
                                </button>
                                <button
                                    type="button"
                                    className={`lset-chip${filterMode === "hidden" ? " is-active" : ""}`}
                                    onClick={() => setFilterMode("hidden")}
                                >
                                    <Eye size={11} style={{ color: "#94a3b8" }} />
                                    Hidden
                                    <span className="lset-chip-count">{currentHidden}</span>
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="lset-table-wrap">
                            <Table
                                loading={loading}
                                columns={(activeTab === "1" ? statusColumns : activeTab === "2" ? actionColumns : platformColumns) as any}
                                dataSource={activeTab === "1" ? filteredStatuses : activeTab === "2" ? filteredActions : filteredPlatforms}
                                pagination={false}
                                size="small"
                                scroll={{ x: "max-content" }}
                                className="lset-table"
                                rowClassName="lset-row"
                                locale={{
                                    emptyText: (
                                        <div className="lset-empty">
                                            <div className="lset-empty-icon">
                                                <Inbox size={26} />
                                            </div>
                                            <div className="lset-empty-title">
                                                {searchText || filterMode !== "all"
                                                    ? "No matches"
                                                    : activeTab === "1"
                                                        ? "No statuses yet"
                                                        : activeTab === "2"
                                                            ? "No actions yet"
                                                            : "No platforms yet"}
                                            </div>
                                            <div className="lset-empty-sub">
                                                {searchText || filterMode !== "all"
                                                    ? "Try a different keyword or clear the filter."
                                                    : activeTab === "1"
                                                        ? "Create your first pipeline stage to start organizing leads."
                                                        : activeTab === "2"
                                                            ? "Add your first workflow action to power lead operations."
                                                            : "Register an online platform or your own website as a lead source."}
                                            </div>
                                            <Button
                                                type="primary"
                                                icon={<Plus size={13} />}
                                                onClick={searchText || filterMode !== "all"
                                                    ? () => { setSearchText(""); setFilterMode("all"); }
                                                    : showDrawer}
                                                className="lset-empty-cta"
                                            >
                                                {searchText || filterMode !== "all"
                                                    ? "Clear filters"
                                                    : `Add ${activeTab === "1" ? "Status" : activeTab === "2" ? "Action" : "Platform"}`}
                                            </Button>
                                        </div>
                                    ),
                                }}
                            />
                        </div>
                    </main>
                </div>
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
                    width={520}
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
                                <Button onClick={handleCancel} className="lset-btn-cancel">Cancel</Button>
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
                                                getValueFromEvent={(e) => typeof e === "string" ? e : e?.toHexString?.() || e}
                                            >
                                                <ColorPicker showText style={{ width: "100%" }} />
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
                                                getValueFromEvent={(e) => typeof e === "string" ? e : e?.toHexString?.() || e}
                                            >
                                                <ColorPicker showText style={{ width: "100%" }} />
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
                                                rules={[{ required: true, message: "Required" }]}
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
                    /* ============================================== */
                    /*  New shell: left rail + main pane              */
                    /* ============================================== */
                    .lset-page {
                        margin: 0;
                        background: var(--bg-primary);
                        min-height: calc(100vh - 64px);
                        font-family: 'Inter', -apple-system, sans-serif;
                    }
                    .lset-shell {
                        margin: 0;
                        min-height: calc(100vh - 64px - 66px);
                        background: var(--bg-primary);
                        display: grid;
                        grid-template-columns: 264px minmax(0, 1fr);
                        gap: 0;
                    }
                    @media (max-width: 1100px) {
                        .lset-shell { grid-template-columns: 232px minmax(0, 1fr); }
                    }
                    @media (max-width: 820px) {
                        .lset-shell { grid-template-columns: 1fr; }
                    }

                    .lset-rail {
                        position: sticky;
                        top: 66px;
                        align-self: start;
                        height: calc(100vh - 64px - 66px);
                        background: var(--bg-secondary);
                        border-right: 1px solid var(--border-slate-100);
                        padding: 12px 12px 12px 14px;
                        display: flex;
                        flex-direction: column;
                        gap: 4px;
                        overflow-y: auto;
                    }
                    @media (max-width: 820px) {
                        .lset-rail {
                            position: static;
                            height: auto;
                            border-right: 0;
                            border-bottom: 1px solid var(--border-slate-100);
                            flex-direction: row;
                            flex-wrap: wrap;
                        }
                    }
                    .lset-rail-title {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        padding: 4px 8px 8px 8px;
                        font-size: 10px;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        color: var(--text-slate-400);
                    }
                    .lset-rail-card {
                        all: unset;
                        display: flex;
                        align-items: center;
                        gap: 9px;
                        padding: 8px 10px;
                        border-radius: 8px;
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        cursor: pointer;
                        transition: border-color .15s ease, background-color .15s ease;
                    }
                    .lset-rail-card:hover {
                        border-color: var(--border-slate-200);
                    }
                    .lset-rail-icon {
                        width: 26px; height: 26px;
                        border-radius: 7px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        flex-shrink: 0;
                    }
                    .lset-rail-icon svg { width: 12px; height: 12px; }
                    .lset-rail-text { display: flex; flex-direction: column; min-width: 0; }
                    .lset-rail-label {
                        font-size: 12.5px;
                        font-weight: 700;
                        color: var(--text-slate-900);
                        letter-spacing: -0.005em;
                        line-height: 1.2;
                    }
                    .lset-rail-sub {
                        font-size: 10.5px;
                        font-weight: 500;
                        color: var(--text-slate-500);
                        margin-top: 1px;
                    }

                    .lset-pane {
                        min-width: 0;
                        padding: 12px 18px 32px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .lset-pane-hero {
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        gap: 16px;
                        padding: 10px 12px;
                        border-radius: 10px;
                        border: 1px solid;
                        overflow: hidden;
                    }
                    .lset-pane-hero-left {
                        display: flex; align-items: center; gap: 10px; min-width: 0;
                    }
                    .lset-pane-hero-icon {
                        width: 32px; height: 32px;
                        border-radius: 9px;
                        color: #fff;
                        display: inline-flex; align-items: center; justify-content: center;
                        flex-shrink: 0;
                    }
                    .lset-pane-hero-icon svg { width: 14px; height: 14px; }
                    .lset-pane-hero-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
                    .lset-pane-eyebrow {
                        font-size: 9.5px;
                        font-weight: 800;
                        letter-spacing: 0.08em;
                        text-transform: uppercase;
                        color: var(--text-slate-500);
                        display: inline-flex; align-items: center; gap: 5px;
                    }
                    .lset-pane-title-row {
                        display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;
                    }
                    .lset-pane-title {
                        margin: 0;
                        font-size: 15px;
                        font-weight: 800;
                        color: var(--text-slate-900);
                        letter-spacing: -0.015em;
                        line-height: 1.2;
                    }
                    .lset-pane-desc {
                        font-size: 11.5px;
                        color: var(--text-slate-500);
                        font-weight: 500;
                    }

                    .lset-pane-hero-right {
                        display: flex; align-items: center; gap: 10px;
                        flex-shrink: 0;
                    }
                    .lset-stat-chips {
                        display: flex; align-items: center; gap: 6px;
                    }
                    .lset-stat-chip {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        padding: 3px 8px;
                        border-radius: 999px;
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        font-size: 11px;
                        height: 24px;
                    }
                    .lset-stat-chip-icon {
                        width: 14px; height: 14px;
                        border-radius: 5px;
                        display: inline-flex; align-items: center; justify-content: center;
                    }
                    .lset-stat-chip-value {
                        font-weight: 800;
                        font-variant-numeric: tabular-nums;
                        color: var(--text-slate-900);
                    }
                    .lset-stat-chip-label {
                        font-weight: 600;
                        color: var(--text-slate-500);
                    }
                    .lset-cta-btn.ant-btn {
                        height: 28px !important;
                        padding: 0 12px !important;
                        font-size: 12px !important;
                        font-weight: 700 !important;
                        border-radius: 7px !important;
                    }

                    .lset-toolbar {
                        display: flex; align-items: center; gap: 8px;
                        flex-wrap: wrap;
                    }
                    .lset-search-box {
                        flex: 1;
                        min-width: 220px;
                        display: flex; align-items: center; gap: 6px;
                        padding: 0 10px;
                        height: 30px;
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 8px;
                    }
                    .lset-search-box:focus-within {
                        border-color: #6366f1;
                        box-shadow: 0 0 0 2px rgba(99,102,241,0.10);
                    }
                    .lset-search-icon { color: var(--text-slate-400); flex-shrink: 0; }
                    .lset-search-input {
                        flex: 1; border: 0; outline: none; background: transparent;
                        font-size: 12px; color: var(--text-slate-900);
                        font-family: inherit;
                    }
                    .lset-search-input::placeholder { color: var(--text-slate-400); }
                    .lset-search-clear {
                        background: transparent; border: 0;
                        color: var(--text-slate-500);
                        font-size: 10.5px; font-weight: 700;
                        cursor: pointer;
                    }

                    .lset-chips {
                        display: flex; align-items: center; gap: 4px;
                    }
                    .lset-chip {
                        display: inline-flex; align-items: center; gap: 5px;
                        padding: 0 9px; height: 26px;
                        border-radius: 7px;
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        color: var(--text-slate-600);
                        font-size: 11.5px; font-weight: 600;
                        cursor: pointer;
                        transition: border-color .15s ease, color .15s ease;
                    }
                    .lset-chip:hover { border-color: var(--border-slate-200); color: var(--text-slate-900); }
                    .lset-chip.is-active {
                        background: rgba(99,102,241,0.10);
                        border-color: rgba(99,102,241,0.30);
                        color: #4f46e5;
                    }
                    .lset-chip-count {
                        font-variant-numeric: tabular-nums;
                        font-size: 10px;
                        font-weight: 800;
                        padding: 1px 5px;
                        border-radius: 999px;
                        background: var(--bg-slate-50);
                        color: var(--text-slate-500);
                    }
                    .lset-chip.is-active .lset-chip-count {
                        background: rgba(99,102,241,0.18);
                        color: #4f46e5;
                    }

                    .lset-table-wrap {
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 10px;
                        padding: 2px 2px 6px;
                        overflow: hidden;
                    }
                    .lset-table.ant-table-wrapper .ant-table-thead > tr > th {
                        font-size: 10.5px !important;
                        font-weight: 800 !important;
                        letter-spacing: 0.05em !important;
                        text-transform: uppercase !important;
                        color: var(--text-slate-400) !important;
                        padding: 8px 12px !important;
                    }
                    .lset-table.ant-table-wrapper .ant-table-tbody > tr > td {
                        padding: 6px 12px !important;
                        font-size: 12.5px !important;
                    }

                    /* Platform table cell */
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
                    .lset-platform-url {
                        display: inline-flex;
                        align-items: center;
                        gap: 5px;
                        font-size: 12px;
                        color: #4f46e5;
                        text-decoration: none;
                        max-width: 260px;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .lset-platform-url:hover { text-decoration: underline; }

                    /* Logo picker — mode toggle + icon grid + image dropzone */
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

                    /* Logo upload */
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

                    /* Dark theme refinements */
                    [data-theme='dark'] .lset-rail,
                    [data-theme='dark'] .lset-pane-hero,
                    [data-theme='dark'] .lset-rail-card,
                    [data-theme='dark'] .lset-stat-chip,
                    [data-theme='dark'] .lset-search-box,
                    [data-theme='dark'] .lset-chip,
                    [data-theme='dark'] .lset-table-wrap {
                        background: var(--bg-secondary);
                    }

                    /* ============================================== */
                    /*  Legacy classes (kept for the drawer/form etc) */
                    /* ============================================== */
                    .lset-canvas {
                        margin: 0 -24px;
                        padding: 0 0 60px;
                        min-height: calc(100vh - 64px);
                        background: var(--bg-pure-white);
                        font-family: 'Inter', -apple-system, sans-serif;
                    }
                    .lset-body-container {
                        padding: 20px 32px 0;
                    }

                    /* HERO */
                    .lset-hero {
                        position: sticky;
                        top: 0;
                        z-index: 100;
                        background: var(--bg-pure-white);
                        border-bottom: 1px solid var(--border-slate-200);
                        padding: 9.5px 32px;
                        margin-bottom: 0;
                        overflow: hidden;
                    }
                    .lset-hero-bg {
                        position: absolute; inset: 0; pointer-events: none;
                        background:
                          radial-gradient(40% 60% at 100% 0%, rgba(99,102,241,0.06) 0%, transparent 60%),
                          radial-gradient(40% 60% at 0% 100%, rgba(236,72,153,0.04) 0%, transparent 60%);
                    }
                    .lset-hero-row {
                        position: relative;
                        display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
                    }
                    .lset-hero-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
                    .lset-hero-icon {
                        width: 38px; height: 38px; border-radius: 11px;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6);
                        color: #fff; display: inline-flex; align-items: center; justify-content: center;
                        box-shadow: 0 6px 14px -3px rgba(99,102,241,0.45);
                        flex-shrink: 0;
                    }
                    .lset-hero-title-row {
                        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
                    }
                    .lset-hero-title {
                        margin: 0 !important; font-size: 18px !important; font-weight: 800 !important;
                        color: var(--text-slate-900) !important; letter-spacing: -0.015em !important;
                    }
                    .lset-hero-divider { width: 1px; height: 16px; background: var(--border-slate-200); }
                    .lset-hero-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; }
                    .lset-hero-actions { display: flex; gap: 8px; align-items: center; }
                    .lset-search {
                        width: 240px;
                        border-radius: 10px !important;
                        border: 1px solid var(--border-slate-100) !important;
                        background: var(--bg-slate-50) !important;
                        font-size: 13px;
                        height: 36px;
                    }
                    .lset-search:hover, .lset-search:focus { border-color: rgba(99,102,241,0.3) !important; background: var(--bg-pure-white) !important; }
                    .lset-cta-btn {
                        height: 36px !important;
                        border-radius: 10px !important;
                        padding: 0 14px !important;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
                        color: #fff !important;
                        border: none !important;
                        font-weight: 700 !important;
                        font-size: 13px;
                        box-shadow: 0 6px 16px -4px rgba(99,102,241,0.45) !important;
                        display: inline-flex !important; align-items: center; gap: 6px;
                        transition: transform 0.18s ease, box-shadow 0.18s ease;
                    }
                    .lset-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -6px rgba(99,102,241,0.55) !important; }

                    /* STATS */
                    .lset-stats { margin-bottom: 18px !important; }
                    .lset-stat-tile {
                        position: relative;
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 16px;
                        padding: 14px 16px;
                        overflow: hidden;
                        transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
                    }
                    .lset-stat-tile:hover {
                        transform: translateY(-2px);
                        border-color: var(--border-slate-200);
                        box-shadow: 0 8px 20px -10px rgba(15,23,42,0.08);
                    }
                    .lset-stat-glow { position: absolute; inset: 0; pointer-events: none; }
                    .lset-stat-row { position: relative; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
                    .lset-stat-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
                    .lset-stat-label { font-size: 10px; font-weight: 800; color: var(--text-slate-400); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
                    .lset-stat-value { font-size: 22px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.05; }
                    .lset-stat-text-ellipsis { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; }
                    .lset-stat-sub { font-size: 11px; color: var(--text-slate-500); font-weight: 600; margin-top: 6px; }
                    .lset-stat-icon {
                        width: 36px; height: 36px; border-radius: 11px;
                        display: inline-flex; align-items: center; justify-content: center;
                        color: #fff; flex-shrink: 0;
                    }

                    /* SEGMENT TABS */
                    .lset-segments {
                        display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap;
                    }
                    .lset-segment {
                        display: inline-flex; align-items: center; gap: 6px;
                        padding: 7px 14px;
                        border-radius: 999px;
                        border: 1px solid var(--border-slate-100);
                        background: var(--bg-pure-white);
                        color: var(--text-slate-500);
                        font-size: 12px; font-weight: 700; cursor: pointer;
                        transition: all 0.15s ease;
                    }
                    .lset-segment:hover:not(.is-active) {
                        background: var(--bg-slate-50);
                        border-color: var(--border-slate-200);
                        color: var(--text-slate-900);
                    }
                    .lset-segment.is-active { box-shadow: 0 1px 2px 0 rgba(15,23,42,0.04); }
                    .lset-segment-count {
                        display: inline-flex; align-items: center; justify-content: center;
                        min-width: 20px; height: 18px;
                        padding: 0 6px;
                        background: var(--bg-slate-50); color: var(--text-slate-500);
                        border-radius: 999px;
                        font-size: 10px; font-weight: 800;
                    }

                    /* TABLE CARD */
                    .lset-table-card {
                        background: var(--bg-pure-white);
                        border: 1px solid var(--border-slate-100);
                        border-radius: 18px;
                        overflow: hidden;
                        box-shadow: 0 1px 3px 0 rgba(15,23,42,0.02), 0 8px 24px -16px rgba(15,23,42,0.06);
                    }
                    /* Hide horizontal scrollbar but keep scroll functionality */
                    .lset-table.ant-table-wrapper .ant-table-content::-webkit-scrollbar,
                    .lset-table.ant-table-wrapper .ant-table-body::-webkit-scrollbar {
                        display: none !important;
                    }
                    .lset-table.ant-table-wrapper .ant-table-content,
                    .lset-table.ant-table-wrapper .ant-table-body {
                        -ms-overflow-style: none !important;
                        scrollbar-width: none !important;
                    }
                    .lset-table-head {
                        display: flex; align-items: center; justify-content: space-between;
                        gap: 12px; padding: 16px 22px;
                        border-bottom: 1px solid var(--border-slate-100);
                    }
                    .lset-table-head-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
                    .lset-table-icon {
                        width: 32px; height: 32px; border-radius: 9px;
                        display: inline-flex; align-items: center; justify-content: center;
                        flex-shrink: 0;
                    }
                    .lset-table-title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.005em; }
                    .lset-table-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 2px; font-weight: 500; line-height: 1.4; }
                    .lset-filter-chip {
                        display: inline-flex; align-items: center; gap: 8px;
                        padding: 4px 4px 4px 10px;
                        border-radius: 999px;
                        background: rgba(99,102,241,0.08);
                        color: #4f46e5;
                        border: 1px solid rgba(99,102,241,0.18);
                        font-size: 11px; font-weight: 700;
                    }
                    .lset-filter-chip button {
                        width: 18px; height: 18px;
                        border-radius: 50%;
                        background: rgba(99,102,241,0.18);
                        border: none; color: #4f46e5;
                        cursor: pointer; padding: 0;
                        display: inline-flex; align-items: center; justify-content: center;
                        font-size: 13px; line-height: 1; font-weight: 700;
                    }

                    /* TABLE CELLS */
                    .lset-table .ant-table { background: transparent; }
                    .lset-table .ant-table-thead > tr > th {
                        background: var(--bg-slate-50) !important;
                        color: var(--text-slate-400) !important;
                        font-size: 10px !important;
                        font-weight: 800 !important;
                        text-transform: uppercase !important;
                        letter-spacing: 0.06em !important;
                        border-bottom: 1px solid var(--border-slate-100) !important;
                        padding: 12px 18px !important;
                    }
                    .lset-table .ant-table-tbody > tr > td {
                        padding: 14px 18px !important;
                        border-bottom: 1px solid var(--bg-slate-50) !important;
                        transition: background 0.15s ease;
                    }
                    .lset-table .ant-table-tbody > tr:hover > td {
                        background: var(--bg-slate-50) !important;
                    }
                    .lset-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }

                    .lset-drag {
                        display: inline-flex; align-items: center; justify-content: center;
                        width: 22px; height: 22px; border-radius: 6px;
                        color: var(--text-slate-400); opacity: 0.6;
                        transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;
                    }
                    .lset-table .ant-table-tbody > tr:hover .lset-drag {
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

                    /* EMPTY */
                    .lset-empty {
                        padding: 56px 24px; text-align: center;
                        display: flex; flex-direction: column; align-items: center;
                    }
                    .lset-empty-icon {
                        width: 64px; height: 64px;
                        border-radius: 18px;
                        background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08));
                        color: #6366f1;
                        display: inline-flex; align-items: center; justify-content: center;
                        margin-bottom: 14px;
                    }
                    .lset-empty-title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); margin-bottom: 4px; }
                    .lset-empty-sub { font-size: 12.5px; color: var(--text-slate-500); margin-bottom: 16px; max-width: 320px; }
                    .lset-empty-cta {
                        height: 36px !important; border-radius: 10px !important; padding: 0 14px !important;
                        background: linear-gradient(135deg, #6366f1, #8b5cf6) !important; color: #fff !important;
                        border: none !important; font-weight: 700 !important;
                        box-shadow: 0 4px 12px -2px rgba(99,102,241,0.4) !important;
                    }

                    /* DRAWER */
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
                        height: 38px !important;
                        font-weight: 600 !important;
                        padding: 0 18px !important;
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

                    /* DARK */
                    [data-theme='dark'] .lset-canvas { background: #0d1117 !important; }
                    [data-theme='dark'] .lset-hero { background: var(--bg-pure-white) !important; border-bottom-color: var(--border-slate-200) !important; }
                    [data-theme='dark'] .lset-hero-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-hero-divider { background: #30363d !important; }
                    [data-theme='dark'] .lset-hero-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-search { background: #0d1117 !important; border-color: #30363d !important; color: #c9d1d9 !important; }
                    [data-theme='dark'] .lset-stat-tile { background: #161b22 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-stat-tile:hover { border-color: #3d444d !important; }
                    [data-theme='dark'] .lset-stat-value { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-stat-label { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-stat-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-segment { background: #161b22 !important; border-color: #30363d !important; color: #8b949e !important; }
                    [data-theme='dark'] .lset-segment:hover:not(.is-active) { background: #1c2128 !important; color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-segment-count { background: #0d1117 !important; color: #8b949e !important; }
                    [data-theme='dark'] .lset-table-card { background: #161b22 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-table-head { border-bottom-color: #30363d !important; }
                    [data-theme='dark'] .lset-table-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-table-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-table .ant-table-thead > tr > th { background: #0d1117 !important; color: #6e7681 !important; border-bottom-color: #30363d !important; }
                    [data-theme='dark'] .lset-table .ant-table-tbody > tr > td { border-bottom-color: #21262d !important; color: #c9d1d9 !important; }
                    [data-theme='dark'] .lset-table .ant-table-tbody > tr:hover > td { background: #1c2128 !important; }
                    [data-theme='dark'] .lset-rank { background: #0d1117 !important; border-color: #30363d !important; color: #8b949e !important; }
                    [data-theme='dark'] .lset-status-meta { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-flag { background: #0d1117 !important; border-color: #30363d !important; color: #8b949e !important; }
                    [data-theme='dark'] .lset-icon-btn { color: #8b949e !important; }
                    [data-theme='dark'] .lset-icon-btn:hover { background: #1c2128 !important; border-color: #30363d !important; color: #818cf8 !important; }
                    [data-theme='dark'] .lset-action-name { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-action-meta { color: #6e7681 !important; }
                    [data-theme='dark'] .lset-meta-text { color: #8b949e !important; }
                    [data-theme='dark'] .lset-empty-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-empty-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-content { background: #161b22 !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-body { background: #161b22 !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-header { border-bottom-color: #30363d !important; }
                    [data-theme='dark'] .lset-drawer .ant-drawer-footer { background: #161b22 !important; border-top-color: #30363d !important; }
                    [data-theme='dark'] .lset-drawer-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-drawer-sub { color: #8b949e !important; }
                    [data-theme='dark'] .lset-section-card { background: #0d1117 !important; border-color: #30363d !important; }
                    [data-theme='dark'] .lset-section-card:hover { border-color: #3d444d !important; }
                    [data-theme='dark'] .lset-section-title { color: #f0f6fc !important; }
                    [data-theme='dark'] .lset-section-sub { color: #6e7681 !important; }
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
                    [data-theme='dark'] .lset-drawer-note { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.25) !important; }
                    [data-theme='dark'] .lset-drawer-note-text { color: #c9d1d9 !important; }
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
