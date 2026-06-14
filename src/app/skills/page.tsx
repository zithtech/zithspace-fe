"use client";

import React, { useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
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
    const currentRole = (experience || []).find((e: any) => e.current_job);
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
            <Popconfirm
              title="Delete this skill?"
              description="This action can't be undone."
              onConfirm={() => deleteSkill(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <button className="skl-icon-btn skl-icon-danger" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </Popconfirm>
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
            <Popconfirm
              title="Delete this experience?"
              description="This action can't be undone."
              onConfirm={() => deleteExperience(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <button className="skl-icon-btn skl-icon-danger" aria-label="Delete">
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

        <div className="skl-canvas">
          {/* HEADER */}
          <div className="skl-header">
            <div className="skl-header-left">
              <div className="skl-header-icon">
                <Zap size={18} />
              </div>
              <div className="skl-header-text">
                <Title level={4} className="skl-header-title">
                  Skills & Experience
                </Title>
                <Text className="skl-header-sub">
                  Curate your professional portfolio and technical competencies
                </Text>
              </div>
            </div>
            <div className="skl-header-actions">
              <Input
                placeholder={`Search ${activeTab === "1" ? "skills" : "experience"}...`}
                prefix={<Search size={13} style={{ color: "var(--text-slate-400)" }} />}
                className="skl-search"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {canCreateSkills && (
                <Button
                  type="primary"
                  icon={<Plus size={14} />}
                  onClick={showDrawer}
                  className="skl-cta-btn"
                >
                  {activeTab === "1" ? "New Skill" : "New Experience"}
                  <ArrowUpRight size={13} />
                </Button>
              )}
            </div>
          </div>

          {/* STATS */}
          <Row gutter={[16, 16]} className="skl-stats">
            <Col xs={24} sm={12} xl={6}>
              <StatTile
                icon={<Award size={17} />}
                label="Total Skills"
                value={stats.skillCount}
                accent="#6366f1"
                sublabel={`${stats.expertSkills} expert · ${stats.activeSkills} visible`}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatTile
                icon={<Layers size={17} />}
                label="Top Category"
                value={<span className="skl-stat-text-ellipsis">{stats.topCategory}</span>}
                accent="#8b5cf6"
                sublabel="Most-represented domain"
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatTile
                icon={<Briefcase size={17} />}
                label="Career Span"
                value={
                  stats.totalYears || stats.totalMonths
                    ? `${stats.totalYears}y${stats.totalMonths ? ` ${stats.totalMonths}m` : ""}`
                    : "—"
                }
                accent="#10b981"
                sublabel={`${stats.experienceCount} role${stats.experienceCount === 1 ? "" : "s"} logged`}
              />
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <StatTile
                icon={<Activity size={17} />}
                label="Currently"
                value={<span className="skl-stat-text-ellipsis">{stats.currentRole}</span>}
                accent="#ec4899"
                sublabel={stats.currentCompany || "Set a current role"}
              />
            </Col>
          </Row>

          {/* SEGMENT TABS */}
          <div className="skl-segments">
            {(
              [
                { key: "1", label: "Skills", icon: <Award size={13} />, count: stats.skillCount, accent: "#6366f1" },
                { key: "2", label: "Experience", icon: <Briefcase size={13} />, count: stats.experienceCount, accent: "#ec4899" },
              ] as const
            ).map((seg) => {
              const isActive = activeTab === seg.key;
              return (
                <button
                  key={seg.key}
                  onClick={() => setActiveTab(seg.key)}
                  className={`skl-segment ${isActive ? "is-active" : ""}`}
                  style={
                    isActive
                      ? { borderColor: seg.accent, background: `${seg.accent}10`, color: seg.accent }
                      : {}
                  }
                >
                  {seg.icon}
                  {seg.label}
                  <span
                    className="skl-segment-count"
                    style={isActive ? { background: seg.accent, color: "#fff" } : {}}
                  >
                    {seg.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* TABLE CARD */}
          <div className="skl-table-card">
            <div className="skl-table-head">
              <div className="skl-table-head-left">
                <span
                  className="skl-table-icon"
                  style={{
                    background: activeTab === "1" ? "rgba(99,102,241,0.1)" : "rgba(236,72,153,0.1)",
                    color: activeTab === "1" ? "#6366f1" : "#ec4899",
                  }}
                >
                  {activeTab === "1" ? <Award size={14} /> : <Briefcase size={14} />}
                </span>
                <div>
                  <div className="skl-table-title">
                    {activeTab === "1" ? "Technical Skills" : "Professional Experience"}
                  </div>
                  <div className="skl-table-sub">
                    {activeTab === "1"
                      ? "Showcase your expertise with proficiency levels and certifications"
                      : "Document your career journey and notable accomplishments"}
                  </div>
                </div>
              </div>
              {searchText && (
                <span className="skl-filter-chip">
                  Filter: "{searchText}"
                  <button onClick={() => setSearchText("")} aria-label="Clear search">
                    ×
                  </button>
                </span>
              )}
            </div>

            <Table
              rowKey="id"
              loading={loading}
              columns={(activeTab === "1" ? skillColumns : expColumns) as any}
              dataSource={activeTab === "1" ? filteredSkills : filteredExperience}
              pagination={{ pageSize: 10, position: ["bottomRight"], hideOnSinglePage: true }}
              scroll={{ x: "max-content" }}
              size="middle"
              className="skl-table"
              rowClassName="skl-row"
              onRow={(record) => ({
                onClick: () => {
                  handleView(record);
                },
                style: { cursor: "pointer" }
              })}
              locale={{
                emptyText: (
                  <div className="skl-empty">
                    <div className="skl-empty-icon">
                      <Inbox size={26} />
                    </div>
                    <div className="skl-empty-title">
                      {searchText
                        ? "No matches"
                        : activeTab === "1"
                          ? "No skills yet"
                          : "No experience yet"}
                    </div>
                    <div className="skl-empty-sub">
                      {searchText
                        ? "Try a different keyword or clear the filter."
                        : activeTab === "1"
                          ? "Add your first skill to begin building your portfolio."
                          : "Capture your first role to start your career timeline."}
                    </div>
                    {(searchText || canCreateSkills) && (
                      <Button
                        type="primary"
                        icon={<Plus size={13} />}
                        onClick={searchText ? () => setSearchText("") : showDrawer}
                        className="skl-empty-cta"
                      >
                        {searchText
                          ? "Clear search"
                          : `Add ${activeTab === "1" ? "Skill" : "Experience"}`}
                      </Button>
                    )}
                  </div>
                ),
              }}
            />
          </div>
        </div>

        {/* DRAWER */}
        <Drawer
          title={
            <div
              className="skl-drawer-head"
              style={{
                margin: "-16px -24px",
                padding: "20px 24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div className="skl-drawer-bg" aria-hidden />
              <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
                <div className="skl-drawer-icon" style={{
                  background: activeTab === "1" ? "rgba(99,102,241,0.08)" : "rgba(236,72,153,0.08)",
                  color: activeTab === "1" ? "#6366f1" : "#ec4899",
                }}>
                  {activeTab === "1" ? <Award size={20} /> : <Briefcase size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="skl-drawer-title">
                    {isViewMode
                      ? `${activeTab === "1" ? "Skill" : "Experience"} Details`
                      : editingId
                        ? `Edit ${activeTab === "1" ? "Skill" : "Experience"}`
                        : `New ${activeTab === "1" ? "Skill" : "Experience"}`}
                  </div>
                  <div className="skl-drawer-sub">
                    {isViewMode
                      ? `Overview of your logged ${activeTab === "1" ? "skill competency" : "professional role"}`
                      : activeTab === "1"
                        ? "Define expertise, level, and certifications"
                        : "Capture role details and accomplishments"}
                  </div>
                </div>
                <span className="skl-drawer-badge" style={{
                  background: activeTab === "1" ? "rgba(99,102,241,0.08)" : "rgba(236,72,153,0.08)",
                  color: activeTab === "1" ? "#6366f1" : "#ec4899",
                }}>
                  <Sparkles size={10} />
                  {activeTab === "1" ? "Skill" : "Role"}
                </span>
              </div>
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
                /* EXPERIENCE VIEW */
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* HERO HEADER CARD */}
                  <div 
                    className="skl-view-hero-card" 
                    style={{
                      borderColor: "rgba(236,72,153,0.15)",
                      background: "radial-gradient(135deg, rgba(236,72,153,0.06) 0%, rgba(236,72,153,0.02) 100%), var(--bg-slate-50)",
                    }}
                  >
                    <div className="skl-view-hero-logo" style={{
                      borderColor: "rgba(236,72,153,0.22)",
                      boxShadow: "0 8px 24px -6px rgba(236,72,153,0.2)",
                      background: "var(--bg-pure-white)"
                    }}>
                      <Briefcase size={26} color="#ec4899" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <h3 className="skl-view-main-name" style={{ margin: 0 }}>{viewedRecord.job_title}</h3>
                        <span className="skl-view-status-badge" style={{
                          background: viewedRecord.current_job ? "rgba(16,185,129,0.08)" : "var(--bg-slate-100)",
                          color: viewedRecord.current_job ? "#10b981" : "var(--text-slate-400)",
                          borderColor: viewedRecord.current_job ? "rgba(16,185,129,0.2)" : "var(--border-slate-100)"
                        }}>
                          <span className="skl-view-status-dot" style={{
                            background: viewedRecord.current_job ? "#10b981" : "#cbd5e1"
                          }} />
                          {viewedRecord.current_job ? "Current Role" : "Previous Role"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        <span className="skl-view-category-tag" style={{ background: "rgba(236,72,153,0.06)", color: "#ec4899", border: "1px solid rgba(236,72,153,0.18)" }}>
                          {viewedRecord.company_name}
                        </span>
                        {viewedRecord.employment_type && (
                          <span className="skl-type-pill" style={{ margin: 0 }}>
                            <Layers size={10} /> {viewedRecord.employment_type.replace("-", " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* STATS GRID */}
                  <div className="skl-view-grid">
                    {/* Timeline Card */}
                    <div className="skl-view-card skl-view-card-premium" style={{ borderLeftColor: "#f59e0b" }}>
                      <div>
                        <span className="skl-view-card-label">Timeline & Tenure</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: "13px", color: "var(--text-slate-800)" }}>
                            <Calendar size={13} color="#f59e0b" />
                            {formatDateRange(viewedRecord.start_date, viewedRecord.end_date, viewedRecord.current_job)}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "11px", color: "var(--text-slate-500)", fontWeight: 500 }}>
                            {viewedRecord.current_job ? <Activity size={10} /> : <Clock size={10} />}{" "}
                            {formatTenure(tenureMonths(viewedRecord.start_date, viewedRecord.end_date, viewedRecord.current_job))}
                            {viewedRecord.current_job && " (Active)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Location Card */}
                    <div className="skl-view-card skl-view-card-premium" style={{ borderLeftColor: "#3b82f6" }}>
                      <div>
                        <span className="skl-view-card-label">Location</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                          <div className="skl-view-card-icon-box" style={{ background: "rgba(59,130,246,0.08)", color: "#3b82f6" }}>
                            <MapPin size={12} />
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-slate-800)" }}>
                            {viewedRecord.location || "Remote / —"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {viewedRecord.description && (
                    <div className="skl-view-section-box">
                      <h4 className="skl-view-section-title" style={{ borderLeftColor: "#ec4899" }}>Job Description</h4>
                      <p className="skl-view-desc-paragraph" style={{ whiteSpace: "pre-line" }}>
                        {viewedRecord.description}
                      </p>
                    </div>
                  )}

                  {viewedRecord.responsibilities && viewedRecord.responsibilities.length > 0 && (
                    <div className="skl-view-section-box">
                      <h4 className="skl-view-section-title" style={{ borderLeftColor: "#ec4899" }}>Key Responsibilities</h4>
                      <ul style={{ paddingLeft: 18, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {viewedRecord.responsibilities.map((resp: string, idx: number) => (
                          <li key={idx} className="skl-view-list-item">
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewedRecord.achievements && viewedRecord.achievements.length > 0 && (
                    <div className="skl-view-section-box">
                      <h4 className="skl-view-section-title" style={{ borderLeftColor: "#ec4899" }}>Notable Achievements</h4>
                      <ul style={{ paddingLeft: 18, marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                        {viewedRecord.achievements.map((ach: string, idx: number) => (
                          <li key={idx} className="skl-view-list-item">
                            {ach}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {viewedRecord.skills_used && viewedRecord.skills_used.length > 0 && (
                    <div className="skl-view-section-box">
                      <h4 className="skl-view-section-title" style={{ borderLeftColor: "#6366f1" }}>Skills Used</h4>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                        {viewedRecord.skills_used.map((skill: string, idx: number) => (
                          <span key={idx} className="skl-type-pill" style={{ background: "rgba(99,102,241,0.06)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.15)", margin: 0, padding: "4px 10px" }}>
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
          .skl-canvas {
            margin: 0 -24px;
            padding: 24px 32px 60px;
            min-height: calc(100vh - 64px);
            background: var(--bg-secondary);
            font-family: 'Inter', -apple-system, sans-serif;
          }

          /* HEADER */
          .skl-header {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            display: flex; align-items: center; justify-content: space-between;
            gap: 16px; flex-wrap: wrap;
            padding: 10px 32px;
            margin: -24px -32px 24px;
            border-bottom: 1px solid var(--border-slate-100);
            box-shadow: 0 2px 8px rgba(0,0,0,0.02);
          }
          .skl-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
          .skl-header-icon {
            width: 36px; height: 36px; border-radius: 10px;
            background: rgba(99,102,241,0.08);
            color: #6366f1;
            display: inline-flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .skl-header-text { display: flex; flex-direction: column; min-width: 0; }
          .skl-header-title {
            margin: 0 !important; font-size: 18px !important; font-weight: 800 !important;
            color: var(--text-slate-900) !important; letter-spacing: -0.015em !important;
            line-height: 1.2 !important;
          }
          .skl-header-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; margin-top: 2px; }
          .skl-header-actions { display: flex; gap: 8px; align-items: center; }
          .skl-search {
            width: 240px;
            border-radius: 10px !important;
            border: 1px solid var(--border-slate-100) !important;
            background: var(--bg-slate-50) !important;
            font-size: 13px;
            height: 36px;
          }
          .skl-search:hover, .skl-search:focus { border-color: rgba(99,102,241,0.3) !important; background: var(--bg-pure-white) !important; }
          .skl-cta-btn {
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
          .skl-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -6px rgba(99,102,241,0.55) !important; }

          /* STATS */
          .skl-stats { margin-bottom: 18px !important; }
          .skl-stat-tile {
            position: relative;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            border-radius: 16px;
            padding: 14px 16px;
            overflow: hidden;
            transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
          }
          .skl-stat-tile:hover {
            transform: translateY(-2px);
            border-color: var(--border-slate-200);
            box-shadow: 0 8px 20px -10px rgba(15,23,42,0.08);
          }
          .skl-stat-glow { position: absolute; inset: 0; pointer-events: none; }
          .skl-stat-row { position: relative; display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
          .skl-stat-text { display: flex; flex-direction: column; min-width: 0; flex: 1; }
          .skl-stat-label { font-size: 10px; font-weight: 800; color: var(--text-slate-400); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
          .skl-stat-value { font-size: 22px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.05; }
          .skl-stat-text-ellipsis { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 16px; }
          .skl-stat-sub { font-size: 11px; color: var(--text-slate-500); font-weight: 600; margin-top: 6px; }
          .skl-stat-icon {
            width: 36px; height: 36px; border-radius: 11px;
            display: inline-flex; align-items: center; justify-content: center;
            color: #fff; flex-shrink: 0;
          }

          /* SEGMENTS */
          .skl-segments { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
          .skl-segment {
            display: inline-flex; align-items: center; gap: 6px;
            padding: 7px 14px;
            border-radius: 999px;
            border: 1px solid var(--border-slate-100);
            background: var(--bg-pure-white);
            color: var(--text-slate-500);
            font-size: 12px; font-weight: 700; cursor: pointer;
            transition: all 0.15s ease;
          }
          .skl-segment:hover:not(.is-active) {
            background: var(--bg-slate-50);
            border-color: var(--border-slate-200);
            color: var(--text-slate-900);
          }
          .skl-segment.is-active { box-shadow: 0 1px 2px 0 rgba(15,23,42,0.04); }
          .skl-segment-count {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 20px; height: 18px;
            padding: 0 6px;
            background: var(--bg-slate-50); color: var(--text-slate-500);
            border-radius: 999px;
            font-size: 10px; font-weight: 800;
          }

          /* TABLE CARD */
          .skl-table-card {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 1px 3px 0 rgba(15,23,42,0.02), 0 8px 24px -16px rgba(15,23,42,0.06);
          }
          .skl-table-head {
            display: flex; align-items: center; justify-content: space-between;
            gap: 12px; padding: 16px 22px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .skl-table-head-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
          .skl-table-icon {
            width: 32px; height: 32px; border-radius: 9px;
            display: inline-flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .skl-table-title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.005em; }
          .skl-table-sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 2px; font-weight: 500; line-height: 1.4; }
          .skl-filter-chip {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 4px 4px 4px 10px;
            border-radius: 999px;
            background: rgba(99,102,241,0.08);
            color: #4f46e5;
            border: 1px solid rgba(99,102,241,0.18);
            font-size: 11px; font-weight: 700;
          }
          .skl-filter-chip button {
            width: 18px; height: 18px;
            border-radius: 50%;
            background: rgba(99,102,241,0.18);
            border: none; color: #4f46e5;
            cursor: pointer; padding: 0;
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 13px; line-height: 1; font-weight: 700;
          }

          /* TABLE CELLS */
          .skl-table .ant-table { background: transparent; }
          .skl-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50) !important;
            color: var(--text-slate-400) !important;
            font-size: 10px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.06em !important;
            border-bottom: 1px solid var(--border-slate-100) !important;
            padding: 12px 18px !important;
          }
          .skl-table .ant-table-tbody > tr > td {
            padding: 14px 18px !important;
            border-bottom: 1px solid var(--bg-slate-50) !important;
            transition: background 0.15s ease;
          }
          .skl-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
          .skl-table .ant-table-cell-fix-right { background: var(--bg-pure-white) !important; transition: background 0.15s ease !important; }
          .skl-table .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: var(--bg-slate-50) !important; }
          .skl-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }

          .skl-skill-cell { display: flex; align-items: center; gap: 12px; }
          .skl-skill-icon {
            width: 36px; height: 36px; border-radius: 10px;
            background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06));
            border: 1px solid rgba(99,102,241,0.16);
            display: inline-flex; align-items: center; justify-content: center;
            color: #6366f1;
            flex-shrink: 0; padding: 6px;
            overflow: hidden;
          }
          .skl-skill-icon img { width: 100%; height: 100%; object-fit: contain; }
          .skl-exp-icon {
            width: 36px; height: 36px; border-radius: 10px;
            background: linear-gradient(135deg, rgba(236,72,153,0.08), rgba(244,114,182,0.06));
            border: 1px solid rgba(236,72,153,0.16);
            display: inline-flex; align-items: center; justify-content: center;
            color: #ec4899;
            flex-shrink: 0;
          }
          .skl-skill-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
          .skl-skill-name {
            font-size: 13px; font-weight: 700; color: var(--text-slate-900);
            display: inline-flex; align-items: center; gap: 6px;
          }
          .skl-skill-meta {
            font-size: 11px; color: var(--text-slate-400);
            font-weight: 600;
            display: inline-flex; align-items: center; gap: 4px;
          }
          .skl-now-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: #10b981; position: relative; flex-shrink: 0;
            box-shadow: 0 0 0 2px rgba(16,185,129,0.18);
          }
          .skl-now-pulse {
            position: absolute; inset: -4px; border-radius: 50%;
            background: rgba(16,185,129,0.35);
            animation: sklPulse 1.6s ease-out infinite;
          }
          @keyframes sklPulse {
            0% { transform: scale(0.8); opacity: 0.7; }
            70% { transform: scale(1.6); opacity: 0; }
            100% { transform: scale(1.6); opacity: 0; }
          }

          .skl-prof-cell { display: flex; flex-direction: column; gap: 6px; }
          .skl-prof-pill {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 3px 9px; border-radius: 7px;
            font-size: 10.5px; font-weight: 800;
            letter-spacing: 0.03em; width: fit-content;
            text-transform: uppercase;
          }
          .skl-prof-bar {
            width: 100%; height: 4px; border-radius: 999px;
            background: var(--bg-slate-50);
            overflow: hidden;
          }
          .skl-prof-bar-fill {
            height: 100%; border-radius: 999px;
            transition: width 0.4s ease;
          }

          .skl-years-pill, .skl-cert-pill, .skl-loc-pill, .skl-type-pill {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 3px 9px;
            border-radius: 7px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
            color: var(--text-slate-600);
            font-size: 11px; font-weight: 700;
            text-transform: capitalize;
          }
          .skl-cert-pill {
            background: rgba(16,185,129,0.08);
            color: #059669;
            border-color: rgba(16,185,129,0.22);
          }
          .skl-loc-pill { background: rgba(99,102,241,0.06); color: #4f46e5; border-color: rgba(99,102,241,0.18); }
          .skl-type-pill { background: rgba(139,92,246,0.06); color: #7c3aed; border-color: rgba(139,92,246,0.18); }
          .skl-meta-text { font-size: 12px; color: var(--text-slate-400); font-weight: 500; }

          .skl-timeline-cell { display: flex; flex-direction: column; gap: 4px; }
          .skl-timeline-range {
            display: inline-flex; align-items: center; gap: 5px;
            font-size: 12px; font-weight: 600; color: var(--text-slate-700);
          }
          .skl-timeline-range svg { color: var(--text-slate-400); }
          .skl-timeline-tenure {
            display: inline-flex; align-items: center; gap: 4px;
            font-size: 10.5px; font-weight: 700;
            color: var(--text-slate-500);
            text-transform: uppercase; letter-spacing: 0.03em;
          }
          .skl-timeline-tenure.is-active { color: #059669; }

          .skl-visibility { display: inline-flex; align-items: center; gap: 8px; }
          .skl-vis-label { font-size: 11px; font-weight: 700; color: var(--text-slate-400); letter-spacing: 0.02em; }
          .skl-vis-label.is-on { color: #10b981; }

          .skl-row-actions { display: inline-flex; gap: 4px; align-items: center; justify-content: flex-end; }
          .skl-icon-btn {
            width: 28px; height: 28px; border-radius: 8px;
            background: transparent; border: 1px solid transparent;
            color: var(--text-slate-500);
            cursor: pointer;
            display: inline-flex; align-items: center; justify-content: center;
            transition: all 0.15s ease;
          }
          .skl-icon-btn:hover { background: var(--bg-slate-50); border-color: var(--border-slate-100); color: #6366f1; }
          .skl-icon-btn.skl-icon-danger:hover { background: rgba(239, 68, 68, 0.08); border-color: rgba(239, 68, 68, 0.2); color: #dc2626; }

          /* EMPTY */
          .skl-empty {
            padding: 56px 24px; text-align: center;
            display: flex; flex-direction: column; align-items: center;
          }
          .skl-empty-icon {
            width: 64px; height: 64px;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08));
            color: #6366f1;
            display: inline-flex; align-items: center; justify-content: center;
            margin-bottom: 14px;
          }
          .skl-empty-title { font-size: 14px; font-weight: 800; color: var(--text-slate-900); margin-bottom: 4px; }
          .skl-empty-sub { font-size: 12.5px; color: var(--text-slate-500); margin-bottom: 16px; max-width: 340px; }
          .skl-empty-cta {
            height: 36px !important; border-radius: 10px !important; padding: 0 14px !important;
            background: linear-gradient(135deg, #6366f1, #8b5cf6) !important; color: #fff !important;
            border: none !important; font-weight: 700 !important;
            box-shadow: 0 4px 12px -2px rgba(99,102,241,0.4) !important;
          }

          /* DRAWER */
          .skl-drawer .ant-drawer-header { padding: 0 !important; border-bottom: 1px solid var(--border-slate-100); }
          .skl-drawer .ant-drawer-header-title { padding: 16px 24px; }
          .skl-drawer .ant-drawer-body { padding: 22px 24px; background: var(--bg-pure-white); }
          .skl-drawer .ant-drawer-footer { padding: 0; border-top: 1px solid var(--border-slate-100); background: var(--bg-pure-white); }
          .skl-drawer-bg {
            position: absolute; inset: 0; pointer-events: none;
            background:
              radial-gradient(60% 80% at 100% 0%, rgba(139,92,246,0.08) 0%, transparent 55%),
              radial-gradient(60% 60% at 0% 100%, rgba(236,72,153,0.06) 0%, transparent 60%);
          }
          .skl-drawer-icon {
            width: 42px; height: 42px; border-radius: 12px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff; display: inline-flex; align-items: center; justify-content: center;
            box-shadow: 0 6px 14px -4px rgba(99,102,241,0.45);
            flex-shrink: 0;
          }
          .skl-drawer-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.01em; }
          .skl-drawer-sub { font-size: 12px; color: var(--text-slate-500); font-weight: 500; margin-top: 2px; }
          .skl-drawer-badge {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 3px 9px; border-radius: 999px;
            background: rgba(99,102,241,0.1); color: #6366f1;
            border: 1px solid rgba(99,102,241,0.22);
            font-size: 9px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;
            flex-shrink: 0;
          }
          .skl-drawer-footer {
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
            padding: 14px 24px;
          }
          .skl-drawer-footer-hint {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 11px; color: var(--text-slate-400); font-weight: 600;
          }
          .skl-drawer-footer-hint svg { color: #10b981; }
          .skl-btn-cancel {
            border-radius: 10px !important;
            height: 38px !important;
            font-weight: 600 !important;
            padding: 0 18px !important;
          }

          /* SECTION CARDS */
          .skl-section-card {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 14px;
            transition: border-color 0.15s ease;
          }
          .skl-section-card:hover { border-color: var(--border-slate-200); }
          .skl-section-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
          .skl-section-step {
            width: 28px; height: 28px; border-radius: 8px;
            display: inline-flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 800; flex-shrink: 0;
          }
          .skl-section-row { display: flex; align-items: center; gap: 6px; }
          .skl-section-title { font-size: 12.5px; font-weight: 800; color: var(--text-slate-900); text-transform: uppercase; letter-spacing: 0.04em; }
          .skl-section-sub { font-size: 11px; color: var(--text-slate-400); font-weight: 500; display: block; line-height: 1.4; }

          .skl-form-label { font-size: 12px; font-weight: 700; color: var(--text-slate-700); }
          .skl-drawer-form .ant-input,
          .skl-drawer-form .ant-input-affix-wrapper,
          .skl-drawer-form .ant-input-number,
          .skl-drawer-form .ant-select-selector,
          .skl-drawer-form .ant-picker {
            border-radius: 10px !important;
            border-color: var(--border-slate-200) !important;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
          }
          .skl-drawer-form .ant-input:focus,
          .skl-drawer-form .ant-input-affix-wrapper-focused,
          .skl-drawer-form .ant-select-focused .ant-select-selector,
          .skl-drawer-form .ant-picker-focused {
            border-color: #6366f1 !important;
            box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important;
          }

          .skl-toggle-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 14px;
            border-radius: 10px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
          }
          .skl-toggle-text { display: flex; flex-direction: column; gap: 2px; }
          .skl-toggle-title { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
          .skl-toggle-sub { font-size: 11px; color: var(--text-slate-500); font-weight: 500; }

          .skl-drawer-note {
            display: flex; gap: 10px; align-items: center;
            padding: 12px 14px;
            border-radius: 10px;
            background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.04));
            border: 1px solid rgba(99,102,241,0.18);
            margin-top: 14px;
          }
          .skl-drawer-note-icon {
            width: 26px; height: 26px; border-radius: 8px;
            background: rgba(99,102,241,0.14); color: #6366f1;
            display: inline-flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .skl-drawer-note-text { font-size: 11.5px; color: var(--text-slate-700); line-height: 1.5; font-weight: 500; }

          /* ENHANCED VIEW DETAILS */
          .skl-view-hero-card {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 16px 20px;
            border-radius: 14px;
            border: 1px solid var(--border-slate-100);
            box-shadow: 0 4px 20px rgba(0,0,0,0.01);
          }
          .skl-view-hero-logo {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            border: 1px solid var(--border-slate-100);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .skl-view-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            border: 1px solid transparent;
          }
          .skl-view-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            display: inline-block;
          }
          .skl-view-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .skl-view-card {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 106px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.01);
            transition: border-color 0.2s ease;
            --dot-inactive: var(--border-slate-100);
          }
          .skl-view-card:hover {
            border-color: var(--border-slate-200);
          }
          .skl-view-card-label {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-slate-400);
          }
          .skl-view-card-premium {
            border-left: 3px solid #ddd;
          }
          .skl-view-card-icon-box {
            width: 24px;
            height: 24px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .skl-view-segments {
            display: flex;
            gap: 6px;
            width: 100%;
          }
          .skl-view-segment-dot {
            flex: 1;
            height: 6px;
            border-radius: 999px;
            transition: background-color 0.2s ease;
          }
          .skl-view-certs-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 10px;
            margin-top: 10px;
          }
          .skl-view-cert-card {
            display: flex;
            gap: 12px;
            align-items: flex-start;
            padding: 12px;
            border-radius: 10px;
            background: var(--bg-slate-50);
            border: 1px solid var(--border-slate-100);
          }
          .skl-view-section-box {
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            border-radius: 12px;
            padding: 18px;
            margin-bottom: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          }
          .skl-view-section-title {
            font-size: 12px;
            font-weight: 800;
            color: var(--text-slate-800);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding-left: 8px;
            border-left: 3px solid #6366f1;
            margin: 0 0 12px 0;
            line-height: 1.2;
          }
          .skl-view-desc-paragraph {
            font-size: 13px;
            color: var(--text-slate-600);
            line-height: 1.6;
            margin: 0;
          }
          .skl-view-list-item {
            color: var(--text-slate-700);
            font-size: 13px;
            line-height: 1.55;
          }
          .skl-view-cert-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(16,185,129,0.08);
            color: #10b981;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .skl-view-cert-name {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-slate-800);
            line-height: 1.4;
          }
          .skl-view-cert-badge {
            font-size: 10px;
            font-weight: 600;
            color: #10b981;
            background: rgba(16,185,129,0.06);
            padding: 1px 6px;
            border-radius: 4px;
            display: inline-block;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
          .skl-view-empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 20px;
            color: var(--text-slate-400);
            font-size: 12px;
            font-weight: 500;
            border: 1px dashed var(--border-slate-100);
            border-radius: 10px;
            margin-top: 10px;
          }

          /* RESPONSIVE */
          @media (max-width: 1024px) {
            .skl-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;
            }
            .skl-header-left {
              width: 100%;
            }
            .skl-header-actions {
              width: 100%;
              justify-content: flex-start;
              gap: 10px;
            }
            .skl-view-grid {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            .skl-table-head {
              flex-direction: column;
              align-items: flex-start;
              gap: 10px;
              padding: 14px 16px;
            }
            .skl-table-head-left {
              width: 100%;
            }
          }

          @media (max-width: 768px) {
            .skl-canvas {
              margin: 0 -16px;
              padding: 24px 16px 40px;
            }
            .skl-header {
              padding: 16px;
              margin: -24px -16px 14px;
            }
          }

          @media (max-width: 576px) {
            .skl-header-actions {
              flex-direction: column;
              align-items: stretch;
              gap: 8px;
            }
            .skl-search {
              width: 100% !important;
            }
            .skl-cta-btn {
              width: 100% !important;
              justify-content: center !important;
            }
            .skl-drawer .ant-drawer-content-wrapper {
              width: 100% !important;
            }
            .skl-drawer .ant-drawer-body {
              padding: 16px !important;
            }
            .skl-drawer .ant-drawer-footer {
              padding: 12px 16px !important;
            }
            .skl-view-hero-card {
              padding: 12px 14px !important;
              gap: 12px !important;
            }
            .skl-view-hero-logo {
              width: 48px !important;
              height: 48px !important;
            }
            .skl-view-main-name {
              font-size: 16px !important;
            }
          }

          /* DARK */
          [data-theme='dark'] .skl-canvas { background: #0d1117 !important; }
          [data-theme='dark'] .skl-header { border-bottom-color: #30363d !important; background: rgba(13, 17, 23, 0.85) !important; }
          [data-theme='dark'] .skl-header-title { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-header-sub { color: #8b949e !important; }
          [data-theme='dark'] .skl-header-icon { background: rgba(99,102,241,0.14) !important; color: #818cf8 !important; }
          [data-theme='dark'] .skl-search { background: #0d1117 !important; border-color: #30363d !important; color: #c9d1d9 !important; }
          [data-theme='dark'] .skl-stat-tile { background: #161b22 !important; border-color: #30363d !important; }
          [data-theme='dark'] .skl-stat-tile:hover { border-color: #3d444d !important; }
          [data-theme='dark'] .skl-stat-value { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-stat-label { color: #6e7681 !important; }
          [data-theme='dark'] .skl-stat-sub { color: #8b949e !important; }
          [data-theme='dark'] .skl-segment { background: #161b22 !important; border-color: #30363d !important; color: #8b949e !important; }
          [data-theme='dark'] .skl-segment:hover:not(.is-active) { background: #1c2128 !important; color: #f0f6fc !important; }
          [data-theme='dark'] .skl-segment-count { background: #0d1117 !important; color: #8b949e !important; }
          [data-theme='dark'] .skl-table-card { background: #161b22 !important; border-color: #30363d !important; }
          [data-theme='dark'] .skl-table-head { border-bottom-color: #30363d !important; }
          [data-theme='dark'] .skl-table-title { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-table-sub { color: #8b949e !important; }
          [data-theme='dark'] .skl-table .ant-table-thead > tr > th { background: #0d1117 !important; color: #6e7681 !important; border-bottom-color: #30363d !important; }
          [data-theme='dark'] .skl-table .ant-table-tbody > tr > td { border-bottom-color: #21262d !important; color: #c9d1d9 !important; }
          [data-theme='dark'] .skl-table .ant-table-tbody > tr:hover > td { background: #1c2128 !important; }
          [data-theme='dark'] .skl-table .ant-table-cell-fix-right { background: #161b22 !important; }
          [data-theme='dark'] .skl-table .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #1c2128 !important; }
          [data-theme='dark'] .skl-skill-name { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-skill-meta { color: #6e7681 !important; }
          [data-theme='dark'] .skl-skill-icon { background: rgba(99,102,241,0.12) !important; border-color: rgba(99,102,241,0.28) !important; color: #818cf8 !important; }
          [data-theme='dark'] .skl-exp-icon { background: rgba(236,72,153,0.12) !important; border-color: rgba(236,72,153,0.28) !important; color: #f472b6 !important; }
          [data-theme='dark'] .skl-prof-bar { background: #0d1117 !important; }
          [data-theme='dark'] .skl-years-pill, [data-theme='dark'] .skl-type-pill, [data-theme='dark'] .skl-loc-pill { background: #0d1117 !important; border-color: #30363d !important; color: #c9d1d9 !important; }
          [data-theme='dark'] .skl-meta-text { color: #6e7681 !important; }
          [data-theme='dark'] .skl-timeline-range { color: #c9d1d9 !important; }
          [data-theme='dark'] .skl-icon-btn { color: #8b949e !important; }
          [data-theme='dark'] .skl-icon-btn:hover { background: #1c2128 !important; border-color: #30363d !important; color: #818cf8 !important; }
          [data-theme='dark'] .skl-empty-title { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-empty-sub { color: #8b949e !important; }
          [data-theme='dark'] .skl-drawer .ant-drawer-content { background: #161b22 !important; }
          [data-theme='dark'] .skl-drawer .ant-drawer-body { background: #161b22 !important; }
          [data-theme='dark'] .skl-drawer .ant-drawer-header { border-bottom-color: #30363d !important; }
          [data-theme='dark'] .skl-drawer .ant-drawer-footer { background: #161b22 !important; border-top-color: #30363d !important; }
          [data-theme='dark'] .skl-drawer-title { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-drawer-sub { color: #8b949e !important; }
          [data-theme='dark'] .skl-section-card { background: #0d1117 !important; border-color: #30363d !important; }
          [data-theme='dark'] .skl-section-card:hover { border-color: #3d444d !important; }
          [data-theme='dark'] .skl-section-title { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-section-sub { color: #6e7681 !important; }
          [data-theme='dark'] .skl-form-label { color: #c9d1d9 !important; }
          [data-theme='dark'] .skl-drawer-form .ant-input,
          [data-theme='dark'] .skl-drawer-form .ant-input-affix-wrapper,
          [data-theme='dark'] .skl-drawer-form .ant-input-number,
          [data-theme='dark'] .skl-drawer-form .ant-select-selector,
          [data-theme='dark'] .skl-drawer-form .ant-picker {
            background: #0d1117 !important;
            border-color: #30363d !important;
            color: #c9d1d9 !important;
          }
          [data-theme='dark'] .skl-toggle-row { background: #161b22 !important; border-color: #30363d !important; }
          [data-theme='dark'] .skl-toggle-title { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-toggle-sub { color: #8b949e !important; }
          [data-theme='dark'] .skl-drawer-note { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.25) !important; }
          [data-theme='dark'] .skl-drawer-note-text { color: #c9d1d9 !important; }
          [data-theme='dark'] .skl-drawer-footer-hint { color: #6e7681 !important; }
          [data-theme='dark'] .skl-btn-cancel { background: #21262d !important; border-color: #30363d !important; color: #c9d1d9 !important; }
          
          /* Dark mode overrides for enhanced Skill Details */
          [data-theme='dark'] .skl-view-card { background: #161b22 !important; border-color: #30363d !important; --dot-inactive: #30363d !important; }
          [data-theme='dark'] .skl-view-card:hover { border-color: #3d444d !important; }
          [data-theme='dark'] .skl-view-card-label { color: #6e7681 !important; }
          [data-theme='dark'] .skl-view-card-value { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-view-hero-card { background: #161b22 !important; border-color: #30363d !important; }
          [data-theme='dark'] .skl-view-hero-logo { background: #0d1117 !important; border-color: #30363d !important; }
          [data-theme='dark'] .skl-view-cert-card { background: #161b22 !important; border-color: #30363d !important; }
          [data-theme='dark'] .skl-view-cert-name { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-view-empty-state { border-color: #30363d !important; color: #6e7681 !important; }
          [data-theme='dark'] .skl-view-section-box { background: #161b22 !important; border-color: #30363d !important; }
          [data-theme='dark'] .skl-view-section-title { color: #f0f6fc !important; }
          [data-theme='dark'] .skl-view-desc-paragraph { color: #c9d1d9 !important; }
          [data-theme='dark'] .skl-view-list-item { color: #c9d1d9 !important; }
          `,
        }} />
      </MainLayout>
    </ProtectedRoute>
  );
}
