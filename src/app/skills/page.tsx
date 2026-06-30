"use client";

import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Typography,
  Button,
  Table,
  Input,
  Form,
  Drawer,
  Popconfirm,
  notification,
  Select,
  Switch,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  Award,
  Briefcase,
  Plus,
  Search,
  Trash2,
  Sparkles,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Inbox,
  Edit2,
  GraduationCap,
  Calendar,
  MapPin,
  TrendingUp,
  Flame,
  Star,
  Layers,
  Activity,
  Info,
  Clock,
  Building2,
  List,
  LayoutGrid,
} from "lucide-react";

import { useSkills } from "@/hooks/useSkills";
import SkillsAutocomplete from "@/components/SkillsAutocomplete";
import { searchSkills } from "@/data/skillsData";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { usePermission } from "@/hooks/usePermission";

const { Title, Text } = Typography;

const PROFICIENCY_META: Record<string, { label: string; accent: string; icon: React.ReactNode; weight: number }> = {
  beginner: { label: "Beginner", accent: "#94a3b8", icon: <GraduationCap size={11} />, weight: 25 },
  intermediate: { label: "Intermediate", accent: "#3b82f6", icon: <TrendingUp size={11} />, weight: 50 },
  advanced: { label: "Advanced", accent: "#8b5cf6", icon: <Star size={11} />, weight: 75 },
  expert: { label: "Expert", accent: "#10b981", icon: <Flame size={11} />, weight: 100 },
};

const formatDateRange = (start?: string, end?: string, current?: boolean) => {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const startTxt = start ? fmt(start) : "—";
  const endTxt = current ? "Present" : end ? fmt(end) : "—";
  return `${startTxt} → ${endTxt}`;
};

const tenureMonths = (start?: string, end?: string, current?: boolean) => {
  if (!start) return 0;
  const s = new Date(start);
  const e = current || !end ? new Date() : new Date(end);
  return Math.max(0, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()));
};

const formatTenure = (months: number) => {
  if (!months) return "—";
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y && m) return `${y}y ${m}m`;
  if (y) return `${y}y`;
  return `${m}m`;
};

const getProficiencyBlocks = (level: string) => {
  if (level === "beginner") return 1;
  if (level === "intermediate") return 2;
  if (level === "advanced") return 3;
  if (level === "expert") return 4;
  return 1;
};

const getExperienceBlocks = (yrs?: number) => {
  if (!yrs) return 0;
  if (yrs <= 1) return 1;
  if (yrs <= 3) return 2;
  if (yrs <= 6) return 3;
  return 4;
};

export default function SkillsPage() {
  const {
    skills,
    experience,
    loading,
    fetchSkills,
    fetchExperience,
    createSkill,
    updateSkill,
    deleteSkill,
    createExperience,
    updateExperience,
    deleteExperience,
  } = useSkills();

  const { canCreateSkills, canUpdateSkills, canDeleteSkills, canManageSkills } = usePermission();

  const [activeTab, setActiveTab] = useState<"1" | "2">("1");
  const [view, setView] = useState<"list" | "grid">("list");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const isCurrent = Form.useWatch("current_job", form);

  const [isViewMode, setIsViewMode] = useState(false);
  const [viewedRecord, setViewedRecord] = useState<any | null>(null);

  useEffect(() => {
    fetchSkills();
    fetchExperience();
  }, []);

  const showDrawer = () => {
    setIsViewMode(false);
    setViewedRecord(null);
    setEditingId(null);
    form.resetFields();
    setIsDrawerOpen(true);
  };

  const handleEdit = (record: any) => {
    setIsViewMode(false);
    setViewedRecord(record);
    setEditingId(record.id);
    const formattedRecord = { ...record };
    if (record.start_date) {
      const date = new Date(record.start_date);
      formattedRecord.start_date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    if (record.end_date) {
      const date = new Date(record.end_date);
      formattedRecord.end_date = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
    form.setFieldsValue(formattedRecord);
    setIsDrawerOpen(true);
  };

  const handleView = (record: any) => {
    setViewedRecord(record);
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setIsViewMode(false);
      setViewedRecord(null);
      setEditingId(null);
    }, 300);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setIsSaving(true);
      if (activeTab === "1") {
        if (editingId) await updateSkill(editingId, values);
        else await createSkill(values);
      } else {
        if (editingId) await updateExperience(editingId, values);
        else await createExperience(values);
      }
      api.success({
        message: "Saved",
        description: `${activeTab === "1" ? "Skill" : "Experience"} ${editingId ? "updated" : "created"} successfully`,
        placement: "topRight",
      });
      setIsDrawerOpen(false);
      setEditingId(null);
      form.resetFields();
    } catch (err: any) {
      api.error({
        message: "Save failed",
        description: err?.message || "An unexpected error occurred",
        placement: "topRight",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSkills = useMemo(
    () =>
      (skills || []).filter((s: any) =>
        [s.name, s.category, s.description]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(searchText.toLowerCase()))
      ),
    [skills, searchText]
  );

  const filteredExperience = useMemo(
    () =>
      (experience || []).filter((e: any) =>
        [e.job_title, e.company_name, e.location]
          .filter(Boolean)
          .some((v: string) => v.toLowerCase().includes(searchText.toLowerCase()))
      ),
    [experience, searchText]
  );

  const stats = useMemo(() => {
    const expertSkills = (skills || []).filter((s: any) => s.proficiency_level === "expert").length;
    const activeSkills = (skills || []).filter((s: any) => s.is_active !== false).length;
    const totalMonths = (experience || []).reduce(
      (acc: number, e: any) => acc + tenureMonths(e.start_date, e.end_date, e.current_job),
      0
    );
    const sortedExp = [...(experience || [])].sort((a: any, b: any) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    const currentRole = sortedExp.find((e: any) => e.current_job) || sortedExp[0];
    const topCategory =
      Object.entries(
        (skills || []).reduce((acc: Record<string, number>, s: any) => {
          const k = s.category || "General";
          acc[k] = (acc[k] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => (b[1] as number) - (a[1] as number))[0]?.[0] || "—";

    return {
      skillCount: (skills || []).length,
      expertSkills,
      activeSkills,
      experienceCount: (experience || []).length,
      totalYears: Math.floor(totalMonths / 12),
      totalMonths: totalMonths % 12,
      currentRole: currentRole?.job_title || "—",
      currentCompany: currentRole?.company_name || "",
      topCategory,
    };
  }, [skills, experience]);

  // ================= SKILL COLUMNS =================
  const skillColumns = [
    {
      title: "Skill",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => {
        const matched = searchSkills(name);
        const skill = matched.find((s: any) => s.name.toLowerCase() === name?.toLowerCase());
        return (
          <div className="skl-skill-cell">
            <span className="skl-skill-icon">
              {skill ? (
                <img
                  src={skill.logo}
                  alt={skill.name}
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              ) : (
                <Award size={15} />
              )}
            </span>
            <div className="skl-skill-text">
              <span className="skl-skill-name">{name}</span>
              <span className="skl-skill-meta">{record.category || "General"}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Proficiency",
      dataIndex: "proficiency_level",
      key: "proficiency_level",
      width: 220,
      render: (level: string) => {
        const meta = PROFICIENCY_META[level] || PROFICIENCY_META.beginner;
        return (
          <div className="skl-prof-cell">
            <span
              className="skl-prof-pill"
              style={{
                background: `${meta.accent}14`,
                color: meta.accent,
                border: `1px solid ${meta.accent}33`,
              }}
            >
              {meta.icon} {meta.label}
            </span>
            <div className="skl-prof-bar">
              <div
                className="skl-prof-bar-fill"
                style={{
                  width: `${meta.weight}%`,
                  background: `linear-gradient(90deg, ${meta.accent}, ${meta.accent}cc)`,
                }}
              />
            </div>
          </div>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (desc: string) => (
        desc ? (
          <Tooltip title={desc}>
            <span style={{ 
              display: "block", 
              maxWidth: 250, 
              whiteSpace: "nowrap", 
              overflow: "hidden", 
              textOverflow: "ellipsis",
              color: "var(--text-slate-500)",
              fontSize: "12.5px"
            }}>
              {desc}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: "var(--text-slate-400)", fontSize: "12.5px" }}>—</span>
        )
      )
    },
    {
      title: "Experience",
      dataIndex: "years_of_experience",
      key: "years_of_experience",
      width: 130,
      render: (val: number) =>
        val ? (
          <span className="skl-years-pill">
            <Clock size={11} /> {val} {val === 1 ? "year" : "years"}
          </span>
        ) : (
          <span className="skl-meta-text">—</span>
        ),
    },
    {
      title: "Certifications",
      dataIndex: "certifications",
      key: "certifications",
      width: 160,
      render: (certs: string[]) => {
        const list = Array.isArray(certs) ? certs : [];
        if (list.length === 0) return <span className="skl-meta-text">None</span>;
        return (
          <span className="skl-cert-pill">
            <ShieldCheck size={11} /> {list.length}
          </span>
        );
      },
    },
    {
      title: "Visibility",
      dataIndex: "is_active",
      key: "is_active",
      width: 130,
      render: (val: boolean, record: any) => (
        <div className="skl-visibility" onClick={(e) => e.stopPropagation()}>
          <Switch
            size="small"
            disabled={!canUpdateSkills}
            checked={val !== false}
            onChange={async (checked) => {
              try {
                await updateSkill(record.id, { ...record, is_active: checked });
                api.success({ message: "Skill updated", placement: "topRight" });
              } catch {
                api.error({ message: "Failed to update", placement: "topRight" });
              }
            }}
          />
          <span className={`skl-vis-label ${val !== false ? "is-on" : ""}`}>
            {val !== false ? "Visible" : "Hidden"}
          </span>
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <div className="skl-row-actions" onClick={(e) => e.stopPropagation()}>
          {canUpdateSkills && (
            <Tooltip title="Edit">
              <button className="skl-icon-btn" onClick={() => handleEdit(record)} aria-label="Edit">
                <Edit2 size={14} />
              </button>
            </Tooltip>
          )}
          {canDeleteSkills && (
            <ConfirmDialog
              tone="danger"
              icon={<Trash2 size={16} />}
              title="Delete this skill?"
              description="This action can't be undone."
              onConfirm={() => deleteSkill(record.id)}
              confirmText="Delete"
              cancelText="Cancel"
              placement="bottomRight"
            >
              <button className="skl-icon-btn skl-icon-danger" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  // ================= EXPERIENCE COLUMNS =================
  const expColumns = [
    {
      title: "Role",
      dataIndex: "job_title",
      key: "job_title",
      render: (title: string, record: any) => (
        <div className="skl-skill-cell">
          <span className="skl-exp-icon">
            <Briefcase size={15} />
          </span>
          <div className="skl-skill-text">
            <span className="skl-skill-name">
              {title}
              {record.current_job && (
                <span className="skl-now-dot" aria-hidden>
                  <span className="skl-now-pulse" />
                </span>
              )}
            </span>
            <span className="skl-skill-meta">
              <Building2 size={10} /> {record.company_name}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      width: 180,
      render: (loc: string) =>
        loc ? (
          <span className="skl-loc-pill">
            <MapPin size={11} /> {loc}
          </span>
        ) : (
          <span className="skl-meta-text">Remote / —</span>
        ),
    },
    {
      title: "Type",
      dataIndex: "employment_type",
      key: "employment_type",
      width: 140,
      render: (t: string) =>
        t ? (
          <span className="skl-type-pill">
            <Layers size={10} /> {t.replace("-", " ")}
          </span>
        ) : (
          <span className="skl-meta-text">—</span>
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 250,
      render: (desc: string) => (
        desc ? (
          <Tooltip title={desc}>
            <span style={{ 
              display: "block", 
              maxWidth: 250, 
              whiteSpace: "nowrap", 
              overflow: "hidden", 
              textOverflow: "ellipsis",
              color: "var(--text-slate-500)",
              fontSize: "12.5px"
            }}>
              {desc}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: "var(--text-slate-400)", fontSize: "12.5px" }}>—</span>
        )
      )
    },
    {
      title: "Timeline",
      key: "timeline",
      width: 220,
      render: (_: any, record: any) => {
        const months = tenureMonths(record.start_date, record.end_date, record.current_job);
        return (
          <div className="skl-timeline-cell">
            <span className="skl-timeline-range">
              <Calendar size={11} />
              {formatDateRange(record.start_date, record.end_date, record.current_job)}
            </span>
            <span className={`skl-timeline-tenure ${record.current_job ? "is-active" : ""}`}>
              {record.current_job ? <Activity size={10} /> : <Clock size={10} />}{" "}
              {formatTenure(months)} {record.current_job ? "(active)" : "tenure"}
            </span>
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 100,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <div className="skl-row-actions" onClick={(e) => e.stopPropagation()}>
          {canUpdateSkills && (
            <Tooltip title="Edit">
              <button className="skl-icon-btn" onClick={() => handleEdit(record)} aria-label="Edit">
                <Edit2 size={14} />
              </button>
            </Tooltip>
          )}
          {canDeleteSkills && (
            <ConfirmDialog
              tone="danger"
              icon={<Trash2 size={16} />}
              title="Delete this experience?"
              description="This action can't be undone."
              onConfirm={() => deleteExperience(record.id)}
              confirmText="Delete"
              cancelText="Cancel"
              placement="bottomRight"
            >
              <button className="skl-icon-btn skl-icon-danger" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </ConfirmDialog>
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
    <div className="skl-stat-tile">
      <div
        className="skl-stat-glow"
        style={{ background: `radial-gradient(120% 100% at 100% 0%, ${accent}10 0%, transparent 55%)` }}
      />
      <div className="skl-stat-row">
        <div className="skl-stat-text">
          <span className="skl-stat-label">{label}</span>
          <span className="skl-stat-value">{value}</span>
          {sublabel && <span className="skl-stat-sub">{sublabel}</span>}
        </div>
        <div
          className="skl-stat-icon"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            boxShadow: `0 6px 14px ${accent}33`,
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <MainLayout>
        {contextHolder}

        
        <div className="pp-shell">
          {/* ============================ SIDEBAR ============================ */}
          <aside className="pp-sidebar">
            <div className="pp-side-head">
              <div className="pp-side-logo"><Award size={20} /></div>
              <div className="pp-side-head-text">
                <div className="pp-side-title">Skills & Experience</div>
                <div className="pp-side-subtitle">Portfolio · profile</div>
              </div>
            </div>

            <div className="pp-side-scroll">
              <div className="pp-side-section-label">Categories</div>
              <div className="pp-side-list">
                <button
                  type="button"
                  className={`pp-view-item ${activeTab === "1" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("1")}
                >
                  <span className={`rh-proj-badge ${activeTab === "1" ? "is-active" : ""}`}>SK</span>
                  <span className="pp-view-label">Technical Skills</span>
                </button>
                <button
                  type="button"
                  className={`pp-view-item ${activeTab === "2" ? "is-active" : ""}`}
                  onClick={() => setActiveTab("2")}
                >
                  <span className={`rh-proj-badge ${activeTab === "2" ? "is-active" : ""}`} style={activeTab === "2" ? { background: "rgba(236,72,153,0.16)", color: "#ec4899" } : {}}>EX</span>
                  <span className="pp-view-label">Professional Experience</span>
                </button>
              </div>
            </div>
            
            <div className="pp-trash" style={{ cursor: "default" }}>
               <Info size={14} /> {stats.skillCount + stats.experienceCount} entries
            </div>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="pp-main">
            {/* ── SINGLE HEADER ROW: title + search + toggle + create ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>

              {/* Title */}
              <h1 className="rh-main-title" style={{ margin: 0, flexShrink: 0 }}>
                {activeTab === "1" ? "Technical Skills" : "Professional Experience"}
              </h1>

              {/* Search */}
              <div className="pp-search-wrap" style={{ flex: "1 1 180px", minWidth: 160, maxWidth: 260 }}>
                <Search className="pp-search-icon" size={14} />
                <input
                  className="pp-search"
                  placeholder={`Search ${activeTab === "1" ? "skills" : "experience"}...`}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* Meta stats */}
              <div className="pp-topbar-meta" style={{ flexShrink: 0 }}>
                <span className="pp-meta-item"><strong>{activeTab === "1" ? stats.expertSkills : (stats.totalYears || 0)}</strong> {activeTab === "1" ? "expert" : "years"}</span>
                <span className="pp-meta-dot">·</span>
                <span className="pp-meta-item"><strong>{activeTab === "1" ? stats.skillCount : stats.experienceCount}</strong> total</span>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* View toggle + Create */}
              <div className="pp-topbar-actions" style={{ flexShrink: 0 }}>
                <div className="pp-segmented">
                  <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label="List view"><List size={14} /></button>
                  <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><LayoutGrid size={14} /></button>
                </div>
                {canCreateSkills && (
                  <Button
                    type="primary"
                    icon={<Plus size={13} />}
                    onClick={showDrawer}
                    className="skl-cta-btn"
                    style={{ marginLeft: 8 }}
                  >
                    {activeTab === "1" ? "New Skill" : "New Experience"}
                  </Button>
                )}
              </div>
            </div>

            <div className="pp-divider" />

            {/* Stat cards */}
            <div className="pp-stats">
              {activeTab === "1" ? (
                <>
                  <div className="pp-stat-card">
                    <div className="pp-stat-top">
                      <div className="pp-stat-left">
                        <span className="pp-stat-icon" style={{ background: "#6366f11a", color: "#6366f1" }}><Award size={14} /></span>
                        <span className="pp-stat-label">Total Skills</span>
                      </div>
                    </div>
                    <div className="pp-stat-bottom">
                      <div className="pp-stat-value-wrap">
                        <span className="pp-stat-value">{stats.skillCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pp-stat-card">
                    <div className="pp-stat-top">
                      <div className="pp-stat-left">
                        <span className="pp-stat-icon" style={{ background: "#f59e0b1a", color: "#f59e0b" }}><Star size={14} /></span>
                        <span className="pp-stat-label">Expert Level</span>
                      </div>
                    </div>
                    <div className="pp-stat-bottom">
                      <div className="pp-stat-value-wrap">
                        <span className="pp-stat-value">{stats.expertSkills}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pp-stat-card">
                    <div className="pp-stat-top">
                      <div className="pp-stat-left">
                        <span className="pp-stat-icon" style={{ background: "#10b9811a", color: "#10b981" }}><Activity size={14} /></span>
                        <span className="pp-stat-label">Active Skills</span>
                      </div>
                    </div>
                    <div className="pp-stat-bottom">
                      <div className="pp-stat-value-wrap">
                        <span className="pp-stat-value">{stats.activeSkills}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pp-stat-card">
                    <div className="pp-stat-top">
                      <div className="pp-stat-left">
                        <span className="pp-stat-icon" style={{ background: "#8b5cf61a", color: "#8b5cf6" }}><Layers size={14} /></span>
                        <span className="pp-stat-label">Top Category</span>
                      </div>
                    </div>
                    <div className="pp-stat-bottom">
                      <div className="pp-stat-value-wrap">
                        <span className="pp-stat-value" style={{ fontSize: '18px' }}>{stats.topCategory}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="pp-stat-card">
                    <div className="pp-stat-top">
                      <div className="pp-stat-left">
                        <span className="pp-stat-icon" style={{ background: "#6366f11a", color: "#6366f1" }}><Briefcase size={14} /></span>
                        <span className="pp-stat-label">Total Roles</span>
                      </div>
                    </div>
                    <div className="pp-stat-bottom">
                      <div className="pp-stat-value-wrap">
                        <span className="pp-stat-value">{stats.experienceCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pp-stat-card">
                    <div className="pp-stat-top">
                      <div className="pp-stat-left">
                        <span className="pp-stat-icon" style={{ background: "#10b9811a", color: "#10b981" }}><Calendar size={14} /></span>
                        <span className="pp-stat-label">Career Span</span>
                      </div>
                    </div>
                    <div className="pp-stat-bottom">
                      <div className="pp-stat-value-wrap">
                        <span className="pp-stat-value">
                          {stats.totalYears || stats.totalMonths ? `${stats.totalYears}y ${stats.totalMonths ? `${stats.totalMonths}m` : ""}` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pp-stat-card">
                    <div className="pp-stat-top">
                      <div className="pp-stat-left">
                        <span className="pp-stat-icon" style={{ background: "#ec48991a", color: "#ec4899" }}><Activity size={14} /></span>
                        <span className="pp-stat-label">Current Role</span>
                      </div>
                    </div>
                    <div className="pp-stat-bottom">
                      <div className="pp-stat-value-wrap">
                        <span className="pp-stat-value" style={{ fontSize: '18px' }}>{stats.currentRole}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pp-stat-card">
                    <div className="pp-stat-top">
                      <div className="pp-stat-left">
                        <span className="pp-stat-icon" style={{ background: "#f59e0b1a", color: "#f59e0b" }}><MapPin size={14} /></span>
                        <span className="pp-stat-label">Current Company</span>
                      </div>
                    </div>
                    <div className="pp-stat-bottom">
                      <div className="pp-stat-value-wrap">
                        <span className="pp-stat-value" style={{ fontSize: '18px' }}>{stats.currentCompany || "—"}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="pp-body">
              {view === "list" ? (
                <div className="pp-table-wrap">
                  <Table
                    rowKey="id"
                    loading={loading}
                    columns={(activeTab === "1" ? skillColumns : expColumns) as any}
                    dataSource={activeTab === "1" ? filteredSkills : filteredExperience}
                    pagination={{ pageSizeOptions: [10, 20, 25, 50, 100], pageSize: 10, position: ["bottomRight"], hideOnSinglePage: true }}
                    scroll={{ x: "max-content" }}
                    size="small"
                    className="pp-table"
                    rowClassName="pp-row"
                    onRow={(record) => ({
                      onClick: () => handleView(record),
                      style: { cursor: "pointer" }
                    })}
                    locale={{
                      emptyText: (
                        <div className="pp-empty">
                          <div className="pp-empty-orb"><Inbox size={26} /></div>
                          <div className="pp-empty-title">
                            {searchText ? "No matches" : activeTab === "1" ? "No skills yet" : "No experience yet"}
                          </div>
                          <div className="pp-empty-sub">
                            {searchText ? "Try a different keyword." : "Add your first entry."}
                          </div>
                        </div>
                      )
                    }}
                  />
                </div>
              ) : (
                <div className="pp-grid">
                  {loading ? (
                    <div style={{ padding: 20 }}>Loading...</div>
                  ) : (activeTab === "1" && filteredSkills.length === 0) || (activeTab === "2" && filteredExperience.length === 0) ? (
                    <div className="pp-empty" style={{ gridColumn: "1 / -1" }}>
                      <div className="pp-empty-orb"><Inbox size={26} /></div>
                      <div className="pp-empty-title">
                        {searchText ? "No matches" : activeTab === "1" ? "No skills yet" : "No experience yet"}
                      </div>
                      <div className="pp-empty-sub">
                        {searchText ? "Try a different keyword." : "Add your first entry."}
                      </div>
                    </div>
                  ) : activeTab === "1" ? (
                    filteredSkills.map(skill => (
                      <div key={skill.id} className="pc-card" onClick={() => handleView(skill)}>
                        <div className="pc-top">
                          <div className="pc-head">
                            <span className="pc-type-badge">
                              {skill.category || "General"}
                            </span>
                          </div>
                          <h3 className="pc-title">{skill.name}</h3>
                          <div className="pc-desc" style={{ WebkitLineClamp: 2 }}>{skill.description || "No description provided."}</div>
                        </div>
                        <div className="pc-foot">
                          <div className="pc-foot-meta">
                            <Award size={13} style={{ color: "var(--text-slate-400)" }} />
                            <span>{skill.proficiency_level}</span>
                          </div>
                          {skill.years_of_experience ? (
                            <div className="pc-foot-meta">
                              <Clock size={13} style={{ color: "var(--text-slate-400)" }} />
                              <span>{skill.years_of_experience}y</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    filteredExperience.map(exp => (
                      <div key={exp.id} className="pc-card" onClick={() => handleView(exp)}>
                        <div className="pc-top">
                          <div className="pc-head">
                            <span className="pc-type-badge">
                              {exp.company_name}
                            </span>
                          </div>
                          <h3 className="pc-title">{exp.job_title}</h3>
                          <div className="pc-desc">{exp.employment_type} {exp.location ? `· ${exp.location}` : ""}</div>
                        </div>
                        <div className="pc-foot">
                          <div className="pc-foot-meta">
                            <Calendar size={13} style={{ color: "var(--text-slate-400)" }} />
                            <span>
                              {new Date(exp.start_date).getFullYear()} - {exp.current_job ? "Present" : exp.end_date ? new Date(exp.end_date).getFullYear() : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* DRAWER */}
        <Drawer
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "15px", fontWeight: 700, color: "var(--text-slate-900)" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 6,
                background: activeTab === "1" ? "rgba(99,102,241,0.10)" : "rgba(236,72,153,0.10)",
                color: activeTab === "1" ? "#6366f1" : "#ec4899",
                flexShrink: 0,
              }}>
                {activeTab === "1" ? <Award size={15} /> : <Briefcase size={15} />}
              </span>
              <span>
                {isViewMode
                  ? `${activeTab === "1" ? "Skill" : "Experience"} Details`
                  : editingId
                    ? `Edit ${activeTab === "1" ? "Skill" : "Experience"}`
                    : `New ${activeTab === "1" ? "Skill" : "Experience"}`}
              </span>
            </div>
          }
          width={560}
          open={isDrawerOpen}
          onClose={handleCloseDrawer}
          className="skl-drawer"
          closable={!isSaving}
          footer={
            <div className="skl-drawer-footer">
              <span className="skl-drawer-footer-hint">
                <ShieldCheck size={12} /> {isViewMode ? "View mode" : "Saved instantly to your profile"}
              </span>
              <div style={{ display: "flex", gap: 10 }}>
                <Button onClick={handleCloseDrawer} className="skl-btn-cancel">
                  {isViewMode ? "Close" : "Cancel"}
                </Button>
                {isViewMode ? (
                  (activeTab === "1" ? canUpdateSkills : canUpdateSkills) && (
                    <Button
                      type="primary"
                      onClick={() => {
                        setIsViewMode(false);
                        handleEdit(viewedRecord);
                      }}
                      className="skl-cta-btn"
                      style={{ minWidth: 150 }}
                    >
                      Edit {activeTab === "1" ? "Skill" : "Experience"}
                      <Edit2 size={13} style={{ marginLeft: 6 }} />
                    </Button>
                  )
                ) : (
                  <Button
                    type="primary"
                    loading={isSaving}
                    onClick={handleOk}
                    className="skl-cta-btn"
                    style={{ minWidth: 180 }}
                  >
                    {editingId ? "Update" : "Create"} {activeTab === "1" ? "Skill" : "Experience"}
                    <ArrowUpRight size={13} />
                  </Button>
                )}
              </div>
            </div>
          }
        >
          {isViewMode && viewedRecord ? (
            <div className="skl-view-details">
              {activeTab === "1" ? (
                /* SKILL VIEW */
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {(() => {
                    const matched = searchSkills(viewedRecord.name);
                    const skill = matched.find((s: any) => s.name.toLowerCase() === viewedRecord.name?.toLowerCase());
                    const meta = PROFICIENCY_META[viewedRecord.proficiency_level] || PROFICIENCY_META.beginner;
                    const accentColor = meta.accent;
                    
                    return (
                      <>
                        {/* HERO HEADER CARD */}
                        <div 
                          className="skl-view-hero-card" 
                          style={{
                            borderColor: `${accentColor}26`,
                            background: `radial-gradient(135deg, ${accentColor}08 0%, ${accentColor}02 100%), var(--bg-slate-50)`,
                          }}
                        >
                          <div className="skl-view-hero-logo" style={{
                            borderColor: `${accentColor}33`,
                            boxShadow: `0 8px 24px -6px ${accentColor}26`,
                            background: "var(--bg-pure-white)"
                          }}>
                            {skill ? (
                              <img
                                src={skill.logo}
                                alt={skill.name}
                                style={{ width: 36, height: 36, objectFit: "contain" }}
                                onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                              />
                            ) : (
                              <Award size={26} color={accentColor} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <h3 className="skl-view-main-name" style={{ margin: 0 }}>{viewedRecord.name}</h3>
                              <span className="skl-view-status-badge" style={{
                                background: viewedRecord.is_active !== false ? "rgba(16,185,129,0.08)" : "var(--bg-slate-100)",
                                color: viewedRecord.is_active !== false ? "#10b981" : "var(--text-slate-400)",
                                borderColor: viewedRecord.is_active !== false ? "rgba(16,185,129,0.2)" : "var(--border-slate-100)"
                              }}>
                                <span className="skl-view-status-dot" style={{
                                  background: viewedRecord.is_active !== false ? "#10b981" : "#cbd5e1"
                                }} />
                                {viewedRecord.is_active !== false ? "Active & Visible" : "Hidden"}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                              <span className="skl-view-category-tag">{viewedRecord.category || "General"}</span>
                            </div>
                          </div>
                        </div>

                        {/* STATS GRID */}
                        <div className="skl-view-grid">
                          {/* Proficiency Card */}
                          <div className="skl-view-card skl-view-card-premium" style={{ borderLeftColor: accentColor }}>
                            <div>
                              <span className="skl-view-card-label">Expertise Level</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                                <span
                                  className="skl-prof-pill"
                                  style={{
                                    margin: 0,
                                    background: `${accentColor}14`,
                                    color: accentColor,
                                    border: `1px solid ${accentColor}33`,
                                  }}
                                >
                                  {meta.icon} {meta.label}
                                </span>
                              </div>
                            </div>
                            
                            <div className="skl-view-segments" style={{ marginTop: 12 }}>
                              {[1, 2, 3, 4].map((i) => {
                                const activeCount = getProficiencyBlocks(viewedRecord.proficiency_level);
                                return (
                                  <div
                                    key={i}
                                    className={`skl-view-segment-dot ${i <= activeCount ? "is-active" : ""}`}
                                    style={{
                                      backgroundColor: i <= activeCount ? accentColor : "var(--dot-inactive)",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          {/* Experience Card */}
                          <div className="skl-view-card skl-view-card-premium" style={{ borderLeftColor: "#6366f1" }}>
                            <div>
                              <span className="skl-view-card-label">Experience Span</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                                <div className="skl-view-card-icon-box" style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}>
                                  <Clock size={12} />
                                </div>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-slate-800)" }}>
                                  {viewedRecord.years_of_experience
                                    ? `${viewedRecord.years_of_experience} ${viewedRecord.years_of_experience === 1 ? "year" : "years"}`
                                    : "—"}
                                </span>
                              </div>
                            </div>

                            <div className="skl-view-segments" style={{ marginTop: 12 }}>
                              {[1, 2, 3, 4].map((i) => {
                                const activeCount = getExperienceBlocks(viewedRecord.years_of_experience);
                                return (
                                  <div
                                    key={i}
                                    className={`skl-view-segment-dot ${i <= activeCount ? "is-active" : ""}`}
                                    style={{
                                      backgroundColor: i <= activeCount ? "#6366f1" : "var(--dot-inactive)",
                                    }}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* DESCRIPTION BOX */}
                        {viewedRecord.description && (
                          <div className="skl-view-section-box">
                            <h4 className="skl-view-section-title" style={{ borderLeftColor: accentColor }}>Description</h4>
                            <p className="skl-view-desc-paragraph" style={{ whiteSpace: "pre-line" }}>
                              {viewedRecord.description}
                            </p>
                          </div>
                        )}

                        {/* CERTIFICATIONS BOX */}
                        <div className="skl-view-section-box">
                          <h4 className="skl-view-section-title" style={{ borderLeftColor: "#10b981" }}>Certifications & Credentials</h4>
                          {viewedRecord.certifications && viewedRecord.certifications.length > 0 ? (
                            <div className="skl-view-certs-grid">
                              {viewedRecord.certifications.map((cert: string, idx: number) => (
                                <div key={idx} className="skl-view-cert-card">
                                  <div className="skl-view-cert-icon">
                                    <ShieldCheck size={16} />
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="skl-view-cert-name">{cert}</div>
                                    <div className="skl-view-cert-badge">Verified Credential</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="skl-view-empty-state">
                              <ShieldCheck size={18} style={{ opacity: 0.5 }} />
                              <span>No verified certifications logged for this skill</span>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* EXPERIENCE VIEW — ENHANCED */
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                  {/* ── HERO CARD ── */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    padding: "20px",
                    background: "var(--bg-pure-white)",
                    border: "1px solid rgba(236,72,153,0.2)",
                    borderRadius: 12,
                    borderLeft: "4px solid #ec4899",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                    marginBottom: 0,
                  }}>
                    {/* avatar */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                      background: "rgba(236,72,153,0.08)",
                      border: "1.5px solid rgba(236,72,153,0.18)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Briefcase size={22} color="#ec4899" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-slate-900)", lineHeight: 1.3 }}>
                          {viewedRecord.job_title}
                        </h2>
                        {viewedRecord.current_job && (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: "10.5px", fontWeight: 600,
                            background: "rgba(16,185,129,0.08)", color: "#10b981",
                            border: "1px solid rgba(16,185,129,0.2)", borderRadius: 20, padding: "2px 8px",
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                            Current
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Building2 size={12} color="var(--text-slate-400)" />
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-slate-600)" }}>
                          {viewedRecord.company_name}
                        </span>
                        {viewedRecord.employment_type && (
                          <>
                            <span style={{ color: "var(--border-slate-200, #e2e8f0)", fontSize: 10 }}>•</span>
                            <span style={{
                              fontSize: "11px", fontWeight: 500, color: "#ec4899",
                              background: "rgba(236,72,153,0.06)",
                              border: "1px solid rgba(236,72,153,0.15)", borderRadius: 20, padding: "2px 8px",
                            }}>
                              {viewedRecord.employment_type.replace("-", " ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── STAT STRIP ── */}
                  <div style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                    background: "var(--bg-pure-white)",
                    border: "1px solid var(--border-slate-100)",
                    borderRadius: 12, overflow: "hidden",
                    marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                  }}>
                    <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border-slate-100)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <Calendar size={12} color="#f59e0b" />
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-slate-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Period</span>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-slate-900)", lineHeight: 1.3 }}>
                        {formatDateRange(viewedRecord.start_date, viewedRecord.end_date, viewedRecord.current_job)}
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px", borderRight: "1px solid var(--border-slate-100)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {viewedRecord.current_job ? <Activity size={12} color="#10b981" /> : <Clock size={12} color="#6366f1" />}
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-slate-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Tenure</span>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-slate-900)" }}>
                        {formatTenure(tenureMonths(viewedRecord.start_date, viewedRecord.end_date, viewedRecord.current_job)) || "—"}
                        {viewedRecord.current_job && <span style={{ marginLeft: 4, fontSize: "10px", color: "#10b981", fontWeight: 600 }}>(active)</span>}
                      </div>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <MapPin size={12} color="#3b82f6" />
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-slate-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Location</span>
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-slate-900)" }}>
                        {viewedRecord.location || "Remote / —"}
                      </div>
                    </div>
                  </div>

                  {/* ── DESCRIPTION ── */}
                  {viewedRecord.description && (
                    <div style={{ padding: "16px", borderRadius: 10, background: "var(--bg-slate-50, #f8fafc)", border: "1px solid var(--border-slate-100, #f1f5f9)", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 3, height: 16, borderRadius: 2, background: "#ec4899", flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-slate-600, #475569)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Job Description</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--text-slate-600, #475569)", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                        {viewedRecord.description}
                      </p>
                    </div>
                  )}

                  {/* ── RESPONSIBILITIES ── */}
                  {viewedRecord.responsibilities && viewedRecord.responsibilities.length > 0 && (
                    <div style={{ padding: "16px", borderRadius: 10, background: "var(--bg-slate-50, #f8fafc)", border: "1px solid var(--border-slate-100, #f1f5f9)", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <div style={{ width: 3, height: 16, borderRadius: 2, background: "#ec4899", flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-slate-600, #475569)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Key Responsibilities</span>
                      </div>
                      <ul style={{ paddingLeft: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
                        {viewedRecord.responsibilities.map((resp: string, idx: number) => (
                          <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "13px", color: "var(--text-slate-700, #334155)", lineHeight: 1.5 }}>
                            <span style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(236,72,153,0.08)", color: "#ec4899", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                              {idx + 1}
                            </span>
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewedRecord.achievements && viewedRecord.achievements.length > 0 && (
                    <div style={{ padding: "16px", borderRadius: 10, background: "var(--bg-slate-50, #f8fafc)", border: "1px solid var(--border-slate-100, #f1f5f9)", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <div style={{ width: 3, height: 16, borderRadius: 2, background: "#f59e0b", flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-slate-600, #475569)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Notable Achievements</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {viewedRecord.achievements.map((ach: string, idx: number) => (
                          <div key={idx} style={{
                            display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px",
                            background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.12)",
                            borderRadius: 8, fontSize: "13px", color: "var(--text-slate-700, #334155)", lineHeight: 1.5,
                          }}>
                            <Zap size={13} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
                            {ach}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewedRecord.skills_used && viewedRecord.skills_used.length > 0 && (
                    <div style={{ padding: "16px", borderRadius: 10, background: "var(--bg-slate-50, #f8fafc)", border: "1px solid var(--border-slate-100, #f1f5f9)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <div style={{ width: 3, height: 16, borderRadius: 2, background: "#6366f1", flexShrink: 0 }} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-slate-600, #475569)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Skills Used</span>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {viewedRecord.skills_used.map((skill: string, idx: number) => (
                          <span key={idx} style={{
                            display: "inline-flex", alignItems: "center", gap: 5, fontSize: "11.5px", fontWeight: 600,
                            background: "rgba(99,102,241,0.06)", color: "#6366f1",
                            border: "1px solid rgba(99,102,241,0.15)", borderRadius: 20, padding: "4px 10px",
                          }}>
                            <Sparkles size={10} />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Form
              form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ is_active: true, current_job: false, proficiency_level: "intermediate" }}
            className="skl-drawer-form"
          >
            {activeTab === "1" ? (
              <>
                {/* IDENTITY */}
                <div className="skl-section-card">
                  <div className="skl-section-head">
                    <span
                      className="skl-section-step"
                      style={{
                        background: "rgba(99,102,241,0.08)",
                        color: "#6366f1",
                        border: "1px solid rgba(99,102,241,0.2)",
                      }}
                    >
                      01
                    </span>
                    <div>
                      <div className="skl-section-row">
                        <Award size={13} color="#6366f1" />
                        <span className="skl-section-title">Identity</span>
                      </div>
                      <span className="skl-section-sub">Name, category, and short description</span>
                    </div>
                  </div>
                  <Form.Item
                    name="name"
                    label={<span className="skl-form-label">Skill Name</span>}
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <SkillsAutocomplete />
                  </Form.Item>
                  <Form.Item name="category" label={<span className="skl-form-label">Category</span>}>
                    <Input placeholder="e.g. Frontend, DevOps, Design" />
                  </Form.Item>
                  <Form.Item
                    name="description"
                    label={<span className="skl-form-label">Description</span>}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Briefly describe your experience with this skill..."
                    />
                  </Form.Item>
                </div>

                {/* PROFICIENCY */}
                <div className="skl-section-card">
                  <div className="skl-section-head">
                    <span
                      className="skl-section-step"
                      style={{
                        background: "rgba(139,92,246,0.08)",
                        color: "#8b5cf6",
                        border: "1px solid rgba(139,92,246,0.2)",
                      }}
                    >
                      02
                    </span>
                    <div>
                      <div className="skl-section-row">
                        <TrendingUp size={13} color="#8b5cf6" />
                        <span className="skl-section-title">Proficiency</span>
                      </div>
                      <span className="skl-section-sub">Level of mastery and years of experience</span>
                    </div>
                  </div>
                  <Row gutter={12}>
                    <Col xs={24} sm={14}>
                      <Form.Item
                        name="proficiency_level"
                        label={<span className="skl-form-label">Level</span>}
                      >
                        <Select
                          options={Object.entries(PROFICIENCY_META).map(([value, m]) => ({
                            value,
                            label: (
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <span style={{ color: m.accent, display: "inline-flex" }}>{m.icon}</span>
                                {m.label}
                              </span>
                            ),
                          }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                      <Form.Item
                        name="years_of_experience"
                        label={<span className="skl-form-label">Years</span>}
                      >
                        <Input type="number" min={0} placeholder="0" suffix="yrs" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* CREDENTIALS */}
                <div className="skl-section-card">
                  <div className="skl-section-head">
                    <span
                      className="skl-section-step"
                      style={{
                        background: "rgba(16,185,129,0.08)",
                        color: "#10b981",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }}
                    >
                      03
                    </span>
                    <div>
                      <div className="skl-section-row">
                        <ShieldCheck size={13} color="#10b981" />
                        <span className="skl-section-title">Credentials</span>
                      </div>
                      <span className="skl-section-sub">
                        Add certifications and toggle visibility
                      </span>
                    </div>
                  </div>
                  <Form.Item
                    name="certifications"
                    label={<span className="skl-form-label">Certifications</span>}
                  >
                    <Select
                      mode="tags"
                      placeholder="e.g. AWS Certified Solutions Architect (press Enter)"
                      style={{ width: "100%" }}
                      tokenSeparators={[","]}
                    />
                  </Form.Item>

                  <div className="skl-toggle-row">
                    <div className="skl-toggle-text">
                      <span className="skl-toggle-title">
                        <Activity size={12} color="#10b981" /> Visible on profile
                      </span>
                      <span className="skl-toggle-sub">Show this skill on your public portfolio</span>
                    </div>
                    <Form.Item name="is_active" valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* ROLE */}
                <div className="skl-section-card">
                  <div className="skl-section-head">
                    <span
                      className="skl-section-step"
                      style={{
                        background: "rgba(236,72,153,0.08)",
                        color: "#ec4899",
                        border: "1px solid rgba(236,72,153,0.2)",
                      }}
                    >
                      01
                    </span>
                    <div>
                      <div className="skl-section-row">
                        <Briefcase size={13} color="#ec4899" />
                        <span className="skl-section-title">Role</span>
                      </div>
                      <span className="skl-section-sub">Position, employer, and location</span>
                    </div>
                  </div>
                  <Form.Item
                    name="job_title"
                    label={<span className="skl-form-label">Job Title</span>}
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g. Senior Software Engineer" />
                  </Form.Item>
                  <Form.Item
                    name="company_name"
                    label={<span className="skl-form-label">Company</span>}
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="e.g. Acme Corp" />
                  </Form.Item>
                  <Row gutter={12}>
                    <Col xs={24} sm={14}>
                      <Form.Item
                        name="location"
                        label={<span className="skl-form-label">Location</span>}
                      >
                        <Input placeholder="City, State or Remote" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={10}>
                      <Form.Item
                        name="employment_type"
                        label={<span className="skl-form-label">Type</span>}
                      >
                        <Select
                          placeholder="Select"
                          options={[
                            { value: "full-time", label: "Full-time" },
                            { value: "part-time", label: "Part-time" },
                            { value: "contract", label: "Contract" },
                            { value: "freelance", label: "Freelance" },
                            { value: "internship", label: "Internship" },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* TIMELINE */}
                <div className="skl-section-card">
                  <div className="skl-section-head">
                    <span
                      className="skl-section-step"
                      style={{
                        background: "rgba(245,158,11,0.08)",
                        color: "#f59e0b",
                        border: "1px solid rgba(245,158,11,0.2)",
                      }}
                    >
                      02
                    </span>
                    <div>
                      <div className="skl-section-row">
                        <Calendar size={13} color="#f59e0b" />
                        <span className="skl-section-title">Timeline</span>
                      </div>
                      <span className="skl-section-sub">When you held this position</span>
                    </div>
                  </div>

                  <div className="skl-toggle-row" style={{ marginBottom: 12 }}>
                    <div className="skl-toggle-text">
                      <span className="skl-toggle-title">
                        <Activity size={12} color="#10b981" /> Current Position
                      </span>
                      <span className="skl-toggle-sub">I'm working here now</span>
                    </div>
                    <Form.Item name="current_job" valuePropName="checked" noStyle>
                      <Switch />
                    </Form.Item>
                  </div>

                  <Row gutter={12}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="start_date"
                        label={<span className="skl-form-label">Start Date</span>}
                      >
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="end_date"
                        label={<span className="skl-form-label">End Date</span>}
                      >
                        <Input type="date" disabled={!!isCurrent} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>

                {/* DETAILS */}
                <div className="skl-section-card">
                  <div className="skl-section-head">
                    <span
                      className="skl-section-step"
                      style={{
                        background: "rgba(99,102,241,0.08)",
                        color: "#6366f1",
                        border: "1px solid rgba(99,102,241,0.2)",
                      }}
                    >
                      03
                    </span>
                    <div>
                      <div className="skl-section-row">
                        <Sparkles size={13} color="#6366f1" />
                        <span className="skl-section-title">Details & Impact</span>
                      </div>
                      <span className="skl-section-sub">Highlights, achievements, and skills used</span>
                    </div>
                  </div>
                  <Form.Item
                    name="description"
                    label={<span className="skl-form-label">Description</span>}
                  >
                    <Input.TextArea
                      rows={3}
                      placeholder="Describe your role and responsibilities..."
                    />
                  </Form.Item>
                  <Form.Item
                    name="responsibilities"
                    label={<span className="skl-form-label">Key Responsibilities</span>}
                  >
                    <Select
                      mode="tags"
                      placeholder="Add responsibilities (press Enter)"
                      style={{ width: "100%" }}
                      tokenSeparators={[","]}
                    />
                  </Form.Item>
                  <Form.Item
                    name="achievements"
                    label={<span className="skl-form-label">Notable Achievements</span>}
                  >
                    <Select
                      mode="tags"
                      placeholder="Add achievements (press Enter)"
                      style={{ width: "100%" }}
                      tokenSeparators={[","]}
                    />
                  </Form.Item>
                  <Form.Item
                    name="skills_used"
                    label={<span className="skl-form-label">Skills Used</span>}
                  >
                    <Select
                      mode="tags"
                      placeholder="Add skills (press Enter)"
                      style={{ width: "100%" }}
                      tokenSeparators={[","]}
                    />
                  </Form.Item>
                </div>
              </>
            )}

            <div className="skl-drawer-note">
              <div className="skl-drawer-note-icon">
                <Info size={13} />
              </div>
              <div className="skl-drawer-note-text">
                Updates sync to your portfolio and recruitment workflows immediately.
              </div>
            </div>
          </Form>
          )}
        </Drawer>

        <style dangerouslySetInnerHTML={{
          __html: `
        /* =========================================================
           SHELL & SIDEBAR (Matching Proposals/ReportsHub)
        ========================================================= */
        .pp-shell {
          display: flex;
          margin: 0 -8px;
          height: 100%;
          overflow: hidden;
          background: var(--bg-pure-white);
        }

        .pp-sidebar {
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0;
          position: relative;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
        }
        .pp-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .pp-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .pp-side-logo .anticon { font-size: 24px !important; color: var(--text-slate-900) !important; }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        
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
        .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        
        .rh-proj-badge {
          width: 26px; height: 26px; border-radius: 7px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10.5px; font-weight: 800; font-variant-numeric: tabular-nums;
          background: var(--bg-slate-100); color: var(--text-slate-600);
        }
        .rh-proj-badge.is-active { background: rgba(59,130,246,0.16); color: #3B82F6; }
        
        .pp-trash {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-align: left;
          margin: 0 -14px; padding: 0 22px; height: 52px !important;
          border-top: 1px solid var(--border-slate-200);
          background: transparent; color: var(--text-slate-600); font-size: 13px; font-weight: 500;
          box-sizing: border-box;
        }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; height: 100%; }
        .pp-body { flex: 1 0 auto; margin-bottom: 20px; }
        .rh-main-head { padding: 6px 0 10px; }
        .rh-main-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rh-main-title { font-size: 22px; font-weight: 800; letter-spacing: -0.025em; color: var(--text-slate-900); line-height: 1.1; margin: 0; }
        .rh-main-desc { margin: 6px 0 0; font-size: 13px; color: var(--text-slate-500); max-width: 820px; }

        .pp-topbar { display: flex; align-items: center; gap: 16px; margin-top: 14px; padding-bottom: 12px; }
        .pp-search-wrap {
          flex: 1; max-width: 340px; display: flex; align-items: center; height: 36px;
          border: 1px solid var(--border-slate-200); border-radius: 9px; padding: 0 12px;
          background: var(--bg-pure-white); transition: all 0.2s;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .pp-search::placeholder { color: var(--text-slate-400); }
        
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
        
        .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 -18px 10px; }

        /* Stat cards */
        .pp-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .pp-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0px; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.02);
        }
        .pp-stat-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon {
          width: 24px; height: 24px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center; font-size: 12px;
        }
        .pp-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-500); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
        .pp-stat-value { font-size: 22px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1; }

        /* Grid */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pc-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0px; padding: 16px; cursor: pointer; transition: all 0.2s;
          display: flex; flex-direction: column; gap: 12px; position: relative;
        }
        .pc-card:hover { border-color: var(--border-slate-300); box-shadow: 0 4px 12px rgba(15,23,42,0.03); transform: translateY(-1px); }
        .pc-top { display: flex; flex-direction: column; gap: 8px; }
        .pc-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px; }
        .pc-type-badge {
          display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 5px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
          background: var(--bg-slate-100); color: var(--text-slate-600);
        }
        .pc-title { font-size: 15px; font-weight: 700; color: var(--text-slate-900); line-height: 1.3; margin: 0; }
        .pc-desc {
          font-size: 13px; color: var(--text-slate-500); line-height: 1.5; margin: 0;
          display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-foot { display: flex; align-items: center; gap: 12px; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-slate-100); }
        .pc-foot-meta { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-slate-500); font-weight: 500; }

        /* Dark theme overrides for Proposal card style */
        [data-theme='dark'] .pc-card { background: #0B0F1A; border-color: #1e293b; }
        [data-theme='dark'] .pc-card:hover { border-color: #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
        [data-theme='dark'] .pc-type-badge { background: #1e293b; color: #cbd5e1; }
        [data-theme='dark'] .pc-title { color: #ffffff; }
        [data-theme='dark'] .pc-desc, [data-theme='dark'] .pc-foot-meta { color: #94a3b8; }
        [data-theme='dark'] .pc-foot { border-top-color: #1e293b; }

        /* Empty state */
        .pp-empty { text-align: center; padding: 60px 20px; background: var(--bg-slate-50); border: 1px dashed var(--border-slate-200); border-radius: 12px; }
        .pp-empty-orb { width: 56px; height: 56px; border-radius: 16px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); display: flex; align-items: center; justify-content: center; color: var(--text-slate-400); margin: 0 auto 16px; }
        .pp-empty-title { font-size: 15px; font-weight: 700; color: var(--text-slate-900); margin-bottom: 6px; }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-500); }

        /* Table */
        .pp-table-wrap {
          border: 1px solid var(--border-slate-200);
          border-radius: 0px; overflow: hidden;
          background: var(--bg-pure-white);
        }
        .pp-table .ant-table { background: transparent; font-size: 13px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-200);
          color: var(--text-slate-600);
          font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 16px;
        }
        .pp-table .ant-table-tbody > tr > td { padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100); }
        .pp-table .pp-row { transition: background 0.2s; cursor: pointer; }
        .pp-table .pp-row:hover { background: var(--bg-slate-50); }

        /* Existing Skl table cell overrides */
        .skl-skill-cell { display: flex; align-items: center; gap: 12px; min-width: 200px; }
        .skl-skill-icon {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-500);
        }
        .skl-skill-icon img { width: 18px; height: 18px; object-fit: contain; }
        .skl-skill-text { display: flex; flex-direction: column; min-width: 0; }
        .skl-skill-name { font-size: 14px; font-weight: 600; color: var(--text-slate-900); display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .skl-skill-meta { font-size: 12px; color: var(--text-slate-500); display: flex; align-items: center; gap: 4px; }
        
        .skl-prof-cell { display: flex; flex-direction: column; gap: 6px; }
        .skl-prof-pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; width: fit-content; text-transform: uppercase; letter-spacing: 0.03em; }
        .skl-prof-bar { height: 4px; background: var(--bg-slate-100); border-radius: 2px; overflow: hidden; width: 140px; }
        .skl-prof-bar-fill { height: 100%; border-radius: 2px; }

        .skl-exp-icon {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(236,72,153,0.1); border: 1px solid rgba(236,72,153,0.2); color: #ec4899;
        }

        .skl-years-pill, .skl-type-pill, .skl-loc-pill {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-700);
        }
        .skl-cert-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 600; color: #10b981; }
        
        .skl-meta-text { color: var(--text-slate-400); font-size: 12.5px; }

        .skl-visibility { display: flex; align-items: center; gap: 8px; }
        .skl-vis-label { font-size: 12px; font-weight: 500; color: var(--text-slate-400); }
        .skl-vis-label.is-on { color: var(--text-slate-700); }

        .skl-row-actions { display: flex; align-items: center; gap: 4px; justify-content: flex-end; }
        .skl-icon-btn {
          width: 28px; height: 28px; border-radius: 6px; border: 1px solid transparent; background: transparent;
          color: var(--text-slate-400); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;
        }
        .skl-icon-btn:hover { background: var(--bg-slate-50); border-color: var(--border-slate-200); color: var(--text-slate-700); }
        .skl-icon-danger:hover { background: #fef2f2; border-color: #fca5a5; color: #ef4444; }

        .skl-timeline-cell { display: flex; flex-direction: column; gap: 4px; }
        .skl-timeline-range { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .skl-timeline-tenure { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--text-slate-400); text-transform: uppercase; letter-spacing: 0.05em; }
        .skl-timeline-tenure.is-active { color: #10b981; }

        .skl-now-dot { display: inline-flex; align-items: center; justify-content: center; margin-left: 6px; width: 6px; height: 6px; }
        .skl-now-pulse { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); animation: sklPulse 2s infinite; }
        @keyframes sklPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(16,185,129,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }

        /* ---------------- Drawer Styles ---------------- */
        .skl-drawer .ant-drawer-content { background: var(--bg-pure-white); }
        .skl-drawer .ant-drawer-header { border-bottom: none; padding: 0; }
        .skl-drawer .ant-drawer-body { padding: 24px; background: var(--bg-slate-50); }
        .skl-drawer .ant-drawer-close { display: none; }
        
        .skl-drawer-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(99,102,241,0.05), transparent 60%); }
        .skl-drawer-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .skl-drawer-title { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.2; }
        .skl-drawer-sub { font-size: 13px; color: var(--text-slate-500); margin-top: 2px; }
        .skl-drawer-badge {
          display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 20px;
          font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
        }

        .skl-drawer-footer { display: flex; align-items: center; justify-content: space-between; width: 100%; }
        .skl-drawer-footer-hint { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-slate-400); font-weight: 500; }
        
        .skl-btn-cancel { height: 36px; border-radius: 8px; font-weight: 600; color: var(--text-slate-600); border-color: var(--border-slate-200); }
        .skl-btn-cancel:hover { background: var(--bg-slate-50); color: var(--text-slate-900); border-color: var(--border-slate-300); }
        
        .skl-cta-btn {
          height: 36px; border-radius: 8px; font-weight: 600; font-size: 13px;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          box-shadow: 0 2px 4px rgba(59,130,246,0.15) !important;
        }

        .skl-section-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 20px; margin-bottom: 16px;
        }
        .skl-section-title { font-size: 14px; font-weight: 700; color: var(--text-slate-900); display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .skl-section-sub { font-size: 12.5px; color: var(--text-slate-500); margin-bottom: 20px; }
        
        .skl-form-label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); margin-bottom: 6px; display: block; }
        
        .skl-drawer-form .ant-input,
        .skl-drawer-form .ant-input-affix-wrapper,
        .skl-drawer-form .ant-input-number,
        .skl-drawer-form .ant-select-selector,
        .skl-drawer-form .ant-picker {
          border-radius: 8px;
        }

        .skl-toggle-row {
          display: flex; align-items: center; justify-content: space-between; padding: 16px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; margin-bottom: 16px;
        }
        .skl-toggle-info { flex: 1; padding-right: 16px; }
        .skl-toggle-title { font-size: 14px; font-weight: 600; color: var(--text-slate-900); margin-bottom: 2px; }
        .skl-toggle-sub { font-size: 12.5px; color: var(--text-slate-500); }
        
        /* View specific details in drawer */
        .skl-view-details { padding-bottom: 16px; }
        .skl-view-section-box { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 12px; padding: 20px; }
        .skl-view-section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-slate-900); margin-bottom: 12px; }
        .skl-view-desc-paragraph { font-size: 14px; color: var(--text-slate-700); line-height: 1.6; margin: 0; }
        .skl-view-list-item { font-size: 14px; color: var(--text-slate-700); padding: 8px 0; border-bottom: 1px solid var(--border-slate-100); display: flex; align-items: center; gap: 10px; }
        .skl-view-list-item:last-child { border-bottom: none; padding-bottom: 0; }
        .skl-view-empty-state { text-align: center; padding: 20px; color: var(--text-slate-500); font-size: 13px; font-style: italic; border: 1px dashed var(--border-slate-200); border-radius: 8px; }

        /* Zero border-radius for drawer inputs and section cards */
        .ant-input, .ant-input-affix-wrapper, .ant-select-selector,
        .ant-picker, .ant-input-number, .ant-input-textarea { border-radius: 0 !important; }
        .skl-section-card { border-radius: 0 !important; }
        .skl-view-section-box { border-radius: 0 !important; }
        .skl-view-empty-state { border-radius: 0 !important; }
        .ant-btn { border-radius: 8px !important; }
        
        `
        }} />
      </MainLayout>
    </ProtectedRoute>
  );
}
