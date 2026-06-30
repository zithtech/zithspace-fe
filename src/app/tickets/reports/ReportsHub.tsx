"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Table,
  Button,
  Select,
  Tooltip,
  Avatar,
  Dropdown,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  RiseOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  EllipsisOutlined,
  EyeOutlined,
  ReloadOutlined as RegenOutlined,
  RightOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { SprintReportExportRunner } from "./[sprintId]/SprintReportView";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectService } from "@/services/projectService";
import {
  SprintReportsService,
  SprintReportListItem,
} from "@/services/sprintReportsService";

type ProjectOption = {
  value: string;
  label: string;
  code: string;
  description?: string;
};

const PAGE_SIZE_OPTIONS = [10, 20, 25, 50, 100];

const initialsOf = (name: string) =>
  (name || "—")
    .split(/[\s-]+/)
    .map((s: string) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

// Smooth area sparkline used inside the stat cards (mirrors proposals page).
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
  const line = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const gid = `spk-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true" style={{ display: "block" }}>
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

const HEALTH_META: Record<string, { color: string; bg: string }> = {
  Healthy: { color: "#10b981", bg: "rgba(16,185,129,0.10)" },
  "Moderate Risk": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  "High Risk": { color: "#ff8c42", bg: "rgba(255,140,66,0.12)" },
  "Critical Sprint": { color: "#ef4444", bg: "rgba(239,68,68,0.10)" },
};

const CARD_ACCENTS: [string, string][] = [
  ["#3b82f6", "#2563eb"],
  ["#10b981", "#059669"],
  ["#64748b", "#475569"],
];
const accentFor = (key: string): [string, string] => {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
};

/**
 * Sprint Reports v2 — proposals-style workspace.
 * Left sidebar = projects. Main = generated reports for the selected project,
 * with the same topbar / stat cards / table+grid / sticky pagination structure
 * as the Proposals main page.
 */
export default function ReportsHub() {
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [projectQuery, setProjectQuery] = useState("");
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [reports, setReports] = useState<SprintReportListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(20);

  const searchRef = useRef<HTMLInputElement>(null);

  // ── ⌘K focuses search ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Load projects ──
  useEffect(() => {
    let cancelled = false;
    setProjectsLoading(true);
    ProjectService.getUserProjectsForTickets()
      .then((rows) => {
        if (cancelled) return;
        setProjects(rows);
        if (rows.length > 0) setProjectId(rows[0].value);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? "Failed to load projects");
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchReports = async (pid: string) => {
    if (!pid) {
      setReports([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rows = await SprintReportsService.list(pid);
      setReports(rows);
    } catch (err: any) {
      setError(err?.message ?? "Failed to load sprint reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (!projectId) {
      setReports([]);
      return;
    }
    setLoading(true);
    setError(null);
    SprintReportsService.list(projectId)
      .then((rows) => {
        if (!cancelled) setReports(rows);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message ?? "Failed to load sprint reports");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    setTablePage(1);
  }, [projectId, searchText]);

  const filteredProjects = useMemo(() => {
    if (!projectQuery.trim()) return projects;
    const q = projectQuery.trim().toLowerCase();
    return projects.filter(
      (p) =>
        p.label.toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [projects, projectQuery]);

  const selectedProject = projects.find((p) => p.value === projectId);

  const filteredReports = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter(
      (r) =>
        (r.sprintName || "").toLowerCase().includes(q) ||
        (r.sprintGoal || "").toLowerCase().includes(q)
    );
  }, [reports, searchText]);

  const generatedCount = reports.filter((r) => r.hasReport).length;

  // ── Stats ──
  const statCells = useMemo(() => {
    const gen = reports.filter((r) => r.hasReport);
    const avgHealth =
      gen.length === 0
        ? 0
        : Math.round(
          gen.reduce((s, r) => s + (r.healthScore ?? 0), 0) / gen.length
        );
    const avgCompletion =
      gen.length === 0
        ? 0
        : Math.round(
          gen.reduce((s, r) => s + (r.completionPct ?? 0), 0) / gen.length
        );
    const ticketsShipped = gen.reduce((s, r) => s + (r.completedTickets ?? 0), 0);

    // 7-day trend of reports generated per day.
    const days: Date[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const buckets = Object.fromEntries(days.map((d) => [dayKey(d), 0])) as Record<string, number>;
    gen.forEach((r) => {
      if (!r.generatedAt) return;
      const k = dayKey(new Date(r.generatedAt));
      if (k in buckets) buckets[k] += 1;
    });
    const genTrend = days.map((d) => buckets[dayKey(d)]);
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

    return [
      { key: "total", title: "Generated Reports", value: gen.length, suffix: "", icon: <FileDoneOutlined />, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", trend: genTrend, delta: sum(genTrend) },
      { key: "health", title: "Avg Health", value: avgHealth, suffix: "", icon: <HeartOutlined />, color: "#10b981", tint: "rgba(16,185,129,0.10)", trend: genTrend, delta: 0 },
      { key: "completion", title: "Avg Completion", value: avgCompletion, suffix: "%", icon: <CheckCircleOutlined />, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", trend: genTrend, delta: 0 },
      { key: "shipped", title: "Tickets Shipped", value: ticketsShipped, suffix: "", icon: <ThunderboltOutlined />, color: "#64748b", tint: "rgba(100,116,139,0.10)", trend: genTrend, delta: 0 },
    ];
  }, [reports]);

  const handleGenerate = async (sprintId: string) => {
    setGenerating((g) => ({ ...g, [sprintId]: true }));
    try {
      const summary = await SprintReportsService.generate(sprintId);
      setReports((prev) =>
        prev.map((r) =>
          r.sprintId === sprintId
            ? {
              ...r,
              hasReport: true,
              healthScore: summary.healthScore,
              healthBand: summary.healthBand,
              completionPct: summary.completionPct,
              totalTickets: summary.totalTickets,
              completedTickets: summary.completedTickets,
              generatedAt: summary.generatedAt,
              generatedById: summary.generatedById,
            }
            : r
        )
      );
    } catch (err: any) {
      setError(err?.message ?? "Failed to generate report");
    } finally {
      setGenerating((g) => {
        const next = { ...g };
        delete next[sprintId];
        return next;
      });
    }
  };

  const openReport = (r: SprintReportListItem) => {
    if (r.hasReport) router.push(`/tickets/reports/${r.sprintId}`);
  };

  // ── Download (PDF / DOCX) without leaving the list ──
  const [exportTarget, setExportTarget] = useState<{
    sprintId: string;
    format: "pdf" | "docx";
  } | null>(null);
  const hideExportMsg = useRef<(() => void) | null>(null);

  const handleDownload = (sprintId: string, format: "pdf" | "docx") => {
    if (exportTarget) return; // one export at a time
    hideExportMsg.current = message.loading(
      `Preparing ${format === "pdf" ? "PDF" : "Word"} report…`,
      0
    );
    setExportTarget({ sprintId, format });
  };

  const handleExportDone = (ok: boolean) => {
    hideExportMsg.current?.();
    hideExportMsg.current = null;
    if (ok) message.success("Report downloaded");
    else message.error("Couldn't generate the report file");
    setExportTarget(null);
  };

  // Action menu shared by the table rows and the grid cards.
  const reportMenu = (r: SprintReportListItem) => ({
    items: [
      { key: "view", label: "Open report", icon: <EyeOutlined /> },
      {
        key: "pdf",
        label: "Download PDF",
        icon: <FilePdfOutlined />,
        disabled: !!exportTarget,
      },
      {
        key: "docx",
        label: "Download Word",
        icon: <FileWordOutlined />,
        disabled: !!exportTarget,
      },
      { type: "divider" as const },
      { key: "regen", label: "Regenerate", icon: <RegenOutlined /> },
    ],
    onClick: ({ key, domEvent }: { key: string; domEvent: any }) => {
      domEvent.stopPropagation();
      if (key === "view") openReport(r);
      else if (key === "pdf") handleDownload(r.sprintId, "pdf");
      else if (key === "docx") handleDownload(r.sprintId, "docx");
      else if (key === "regen") handleGenerate(r.sprintId);
    },
  });

  // Download-only menu (PDF / Word) for the inline download icon.
  const downloadMenu = (r: SprintReportListItem) => ({
    items: [
      { key: "pdf", label: "Download PDF", icon: <FilePdfOutlined />, disabled: !!exportTarget },
      { key: "docx", label: "Download Word", icon: <FileWordOutlined />, disabled: !!exportTarget },
    ],
    onClick: ({ key, domEvent }: { key: string; domEvent: any }) => {
      domEvent.stopPropagation();
      handleDownload(r.sprintId, key as "pdf" | "docx");
    },
  });

  const healthPill = (band: string | null, score: number | null) => {
    const meta = (band && HEALTH_META[band]) || { color: "#64748b", bg: "rgba(100,116,139,0.10)" };
    return (
      <span className="pp-vis-pill" style={{ color: meta.color, background: meta.bg, borderColor: "transparent" }}>
        <span className="pp-vis-dot" style={{ background: meta.color }} />
        {band ?? "—"}
        {score != null ? <span style={{ marginLeft: 2, opacity: 0.8 }}>{score}</span> : null}
      </span>
    );
  };

  const completionBar = (r: SprintReportListItem) => {
    const pct =
      r.completionPct != null
        ? Math.round(r.completionPct)
        : r.totalTickets && r.totalTickets > 0
          ? Math.round(((r.completedTickets ?? 0) / r.totalTickets) * 100)
          : 0;
    return (
      <div className="rh-bar-wrap">
        <div className="rh-bar-track">
          <div className="rh-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <span className="rh-bar-pct">{pct}%</span>
      </div>
    );
  };

  // ── Table columns ──
  const columns: ColumnsType<SprintReportListItem> = [
    {
      title: "SPRINT",
      dataIndex: "sprintName",
      key: "sprintName",
      width: 360,
      fixed: "left" as const,
      render: (_: any, r) => (
        <div className="pp-name-cell">
          <div className="pp-name-icon"><FileTextOutlined style={{ fontSize: 14 }} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="pp-name-title">{r.sprintName || "Untitled sprint"}</div>
            {r.sprintGoal ? <div className="rh-sub">{r.sprintGoal}</div> : null}
          </div>
        </div>
      ),
    },
    {
      title: "HEALTH",
      key: "health",
      width: 150,
      render: (_: any, r) =>
        r.hasReport ? healthPill(r.healthBand, r.healthScore) : <span className="pp-muted">—</span>,
    },
    {
      title: "COMPLETION",
      key: "completion",
      width: 190,
      render: (_: any, r) => (r.hasReport ? completionBar(r) : <span className="pp-muted">—</span>),
    },
    {
      title: "TICKETS",
      key: "tickets",
      width: 110,
      render: (_: any, r) =>
        r.hasReport ? (
          <span className="rh-tickets">
            <strong>{r.completedTickets ?? 0}</strong>
            <span className="pp-muted"> / {r.totalTickets ?? 0}</span>
          </span>
        ) : (
          <span className="pp-muted">—</span>
        ),
    },
    {
      title: "GENERATED",
      key: "generated",
      width: 150,
      render: (_: any, r) =>
        r.hasReport && r.generatedAt ? (
          <div className="pp-date">
            <span className="pp-date-main">{fmtDate(r.generatedAt)}</span>
            <span className="pp-date-sub">{r.generatedByName || "—"}</span>
          </div>
        ) : (
          <div className="pp-date">
            <span className="pp-date-main">Completed</span>
            <span className="pp-date-sub">{fmtDate(r.completedAt)}</span>
          </div>
        ),
    },
    {
      title: "ACTION",
      key: "actions",
      align: "right" as const,
      width: 160,
      fixed: "right" as const,
      render: (_: any, r) =>
        r.hasReport ? (
          <div className="rh-actions">
            <Button
              size="small"
              className="rh-act-btn"
              icon={<RegenOutlined spin={!!generating[r.sprintId]} />}
              disabled={!!generating[r.sprintId]}
              onClick={(e) => {
                e.stopPropagation();
                handleGenerate(r.sprintId);
              }}
            >
              Regenerate
            </Button>
            <Dropdown menu={downloadMenu(r)} trigger={["click"]} placement="bottomRight">
              <Tooltip title="Download">
                <Button
                  size="small"
                  className="pp-icon-btn"
                  icon={<DownloadOutlined />}
                  loading={exportTarget?.sprintId === r.sprintId}
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Dropdown>
          </div>
        ) : (
          <Button
            type="primary"
            size="small"
            className="rh-gen-btn"
            loading={!!generating[r.sprintId]}
            icon={!generating[r.sprintId] ? <ThunderboltOutlined /> : undefined}
            onClick={(e) => {
              e.stopPropagation();
              handleGenerate(r.sprintId);
            }}
          >
            Generate
          </Button>
        ),
    },
  ];

  const total = filteredReports.length;
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(tablePage * tablePageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pagedReports = filteredReports.slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize);

  const emptyState = (
    <div className="pp-empty">
      <div className="pp-empty-orb"><Sparkles size={26} /></div>
      <div className="pp-empty-title">No reports yet</div>
      <div className="pp-empty-sub">
        Reports appear here once a sprint in this project is completed.
      </div>
    </div>
  );

  return (
    <div className="pp-shell">
      {exportTarget ? (
        <SprintReportExportRunner
          sprintId={exportTarget.sprintId}
          format={exportTarget.format}
          onDone={handleExportDone}
        />
      ) : null}
      {/* ============================ SIDEBAR ============================ */}
      <aside className="pp-sidebar">
        <div className="pp-side-head">
          <div className="pp-side-logo"><FileDoneOutlined /></div>
          <div className="pp-side-head-text">
            <div className="pp-side-title">Sprint Reports</div>
            <div className="pp-side-subtitle">Projects · reports</div>
          </div>
        </div>

        <div className="rh-proj-search">
          <SearchOutlined className="rh-proj-search-icon" />
          <input
            value={projectQuery}
            onChange={(e) => setProjectQuery(e.target.value)}
            placeholder="Search projects…"
          />
        </div>

        <div className="pp-side-scroll">
          <div className="pp-side-section-label">Projects</div>
          <div className="pp-side-list">
            {projectsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rh-proj-skel" />
              ))
            ) : filteredProjects.length === 0 ? (
              <div className="pp-recents-empty">
                {projects.length === 0 ? "No projects available." : "No projects match."}
              </div>
            ) : (
              filteredProjects.map((p) => {
                const active = p.value === projectId;
                return (
                  <button
                    key={p.value}
                    type="button"
                    className={`pp-view-item ${active ? "is-active" : ""}`}
                    onClick={() => setProjectId(p.value)}
                  >
                    <span className={`rh-proj-badge ${active ? "is-active" : ""}`}>
                      {(p.code || p.label).slice(0, 2).toUpperCase()}
                    </span>
                    <span className="pp-view-label">{p.label}</span>
                    {p.code ? <span className="rh-proj-code">{p.code}</span> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="pp-trash" style={{ cursor: "default" }}>
          <FolderCountIcon /> {projects.length} project{projects.length === 1 ? "" : "s"}
        </div>
      </aside>

      {/* ============================ MAIN ============================ */}
      <main className="pp-main">
        {/* Project context header */}
        <div className="rh-main-head">
          <div className="rh-main-title-row">
            <h1 className="rh-main-title">{selectedProject?.label ?? "Select a project"}</h1>
            {selectedProject?.code ? <span className="rh-main-code">{selectedProject.code}</span> : null}
          </div>
          <p className="rh-main-desc">
            Reports are generated when a sprint is completed. Open one for a full delivery,
            scope, and quality breakdown.
          </p>
        </div>

        {/* Topbar */}
        <div className="pp-topbar">
          <div className="pp-search-wrap">
            <SearchOutlined className="pp-search-icon" />
            <input
              ref={searchRef}
              className="pp-search"
              placeholder="Search sprints, reports…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <span className="pp-kbd">⌘K</span>
          </div>

          <div className="pp-topbar-meta">
            <span className="pp-meta-item"><span className="pp-pulse" /><strong>{generatedCount}</strong> generated</span>
            <span className="pp-meta-dot">·</span>
            <span className="pp-meta-item"><strong>{reports.length}</strong> completed sprints</span>
          </div>

          <div className="pp-topbar-actions">
            <div className="pp-segmented">
              <button type="button" className={view === "list" ? "is-active" : ""} onClick={() => setView("list")} aria-label="List view"><UnorderedListOutlined /></button>
              <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")} aria-label="Grid view"><AppstoreOutlined /></button>
            </div>
            <Tooltip title="Refresh">
              <button type="button" className="pp-ghost-btn" onClick={() => fetchReports(projectId)}><ReloadOutlined spin={loading} /></button>
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
                {s.delta > 0 && (
                  <span className="pp-stat-delta"><RiseOutlined style={{ fontSize: 9 }} />+{s.delta}</span>
                )}
              </div>
              <div className="pp-stat-bottom">
                <div className="pp-stat-value-wrap">
                  <span className="pp-stat-value">{s.value}{s.suffix}</span>
                </div>
                <div className="pp-stat-spark"><AreaSparkline values={s.trend} color={s.color} /></div>
              </div>
            </div>
          ))}
        </div>

        {error ? <div className="rh-error">{error}</div> : null}

        {/* Body */}
        <div className="pp-body">
          {view === "list" ? (
            <div className="pp-table-wrap">
              <Table
                columns={columns}
                dataSource={pagedReports}
                loading={loading}
                rowKey="sprintId"
                size="small"
                className="pp-table"
                scroll={{ x: 1120 }}
                pagination={false}
                locale={{ emptyText: emptyState }}
                onRow={(record) => ({
                  onClick: (e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest("button, .ant-dropdown-trigger")) return;
                    openReport(record);
                  },
                  className: record.hasReport ? "pp-row" : "rh-row-locked",
                })}
              />
            </div>
          ) : (
            <div className="pp-grid">
              {loading ? (
                <div className="pp-grid-loading">Loading…</div>
              ) : filteredReports.length === 0 ? (
                <div style={{ gridColumn: "1 / -1" }}>{emptyState}</div>
              ) : (
                pagedReports.map((r) => {
                  const accent = accentFor(r.sprintId);
                  const pct =
                    r.completionPct != null ? Math.round(r.completionPct) : 0;
                  return (
                    <div
                      key={r.sprintId}
                      className="pc-card"
                      style={{ cursor: r.hasReport ? "pointer" : "default" }}
                      onClick={() => openReport(r)}
                    >
                      <div className="pc-top">
                        <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
                          {initialsOf(r.sprintName || "S")}
                        </div>
                        <div className="pc-identity-body">
                          <div className="pc-title">{r.sprintName || "Untitled sprint"}</div>
                          <div className="pc-client-line">
                            <span className="pc-client-key">
                              {r.hasReport && r.generatedAt ? "Generated:" : "Completed:"}
                            </span>
                            <span className="pc-client-val">
                              {fmtDate(r.hasReport ? r.generatedAt : r.completedAt)}
                            </span>
                          </div>
                        </div>
                        {r.hasReport ? (
                          <Dropdown menu={reportMenu(r)} trigger={["click"]} placement="bottomRight">
                            <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
                              <EllipsisOutlined />
                            </button>
                          </Dropdown>
                        ) : null}
                      </div>

                      <div className="pc-foot">
                        <div className="pc-foot-row">
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Health</span>
                            {r.hasReport ? healthPill(r.healthBand, r.healthScore) : <span className="pp-muted">—</span>}
                          </span>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Tickets</span>
                            <span className="pc-foot-val">{r.hasReport ? `${r.completedTickets ?? 0} / ${r.totalTickets ?? 0}` : "—"}</span>
                          </span>
                        </div>
                        <div className="pc-foot-row">
                          {r.hasReport ? (
                            <>
                              <span className="pc-foot-item" style={{ flex: 1, minWidth: 0 }}>
                                <span className="pc-foot-key">Completion</span>
                                <span className="rh-bar-wrap" style={{ flex: 1 }}>
                                  <span className="rh-bar-track">
                                    <span className="rh-bar-fill" style={{ width: `${Math.min(100, pct)}%` }} />
                                  </span>
                                  <span className="rh-bar-pct">{pct}%</span>
                                </span>
                              </span>
                              <span className="pc-foot-div" />
                              <button
                                type="button"
                                className="pc-foot-item pc-view-btn"
                                onClick={(e) => { e.stopPropagation(); openReport(r); }}
                              >
                                <EyeOutlined />
                                View report
                                <RightOutlined style={{ fontSize: 9 }} />
                              </button>
                            </>
                          ) : (
                            <Button
                              type="primary"
                              size="small"
                              className="rh-gen-btn"
                              loading={!!generating[r.sprintId]}
                              icon={!generating[r.sprintId] ? <ThunderboltOutlined /> : undefined}
                              onClick={(e) => { e.stopPropagation(); handleGenerate(r.sprintId); }}
                            >
                              Generate report
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
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
                <button key={p} type="button" className={`pp-pager-num ${p === tablePage ? "is-active" : ""}`} onClick={() => setTablePage(p)}>{p}</button>
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

      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0 -8px;
          height: 100%;
          overflow: hidden;
          background: var(--bg-pure-white);
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
        .rh-proj-search {
          display: flex; align-items: center; gap: 8px; height: 34px; margin: 8px 0 2px;
          border: 1px solid var(--border-slate-200); border-radius: 8px; padding: 0 10px;
          background: var(--bg-pure-white);
        }
        .rh-proj-search:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .rh-proj-search-icon { color: var(--text-slate-400); font-size: 13px; }
        .rh-proj-search input { flex: 1; border: none; outline: none; background: transparent; font-size: 12.5px; color: var(--text-slate-900); }
        .rh-proj-search input::placeholder { color: var(--text-slate-400); }
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
        .rh-proj-code { font-size: 10px; font-family: ui-monospace, monospace; color: var(--text-slate-400); flex-shrink: 0; }
        .rh-proj-skel { height: 40px; border-radius: 8px; background: var(--bg-slate-100); margin: 1px 0; animation: rh-pulse 1.2s ease-in-out infinite; }
        @keyframes rh-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        .pp-recents-empty { font-size: 11px; color: var(--text-slate-400); padding: 6px 8px; }
        .pp-trash {
          display: flex; align-items: center; gap: 10px; flex-shrink: 0; text-align: left;
          margin: 0 -14px; padding: 0 22px; height: 52px !important;
          border-top: 1px solid var(--border-slate-200);
          background: transparent; color: var(--text-slate-600); font-size: 13px; font-weight: 500;
          box-sizing: border-box;
        }
        .pp-trash .anticon { font-size: 15px; }

        /* ---------------- Main ---------------- */
        .pp-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; height: 100%; }
        .pp-body { flex: 1 0 auto; }
        .rh-main-head { padding: 6px 0 10px; }
        .rh-main-title-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .rh-main-title { font-size: 22px; font-weight: 800; letter-spacing: -0.025em; color: var(--text-slate-900); line-height: 1.1; margin: 0; }
        .rh-main-code {
          display: inline-flex; align-items: center; padding: 1px 8px; border-radius: 6px;
          border: 1px solid var(--border-slate-200); background: var(--bg-slate-50);
          font-size: 11px; font-family: ui-monospace, monospace; color: var(--text-slate-500);
        }
        .rh-main-desc { margin: 6px 0 0; font-size: 13px; color: var(--text-slate-500); max-width: 820px; }

        .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .pp-search-wrap {
          position: relative; flex: 1; max-width: 520px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
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
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 8px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }

        .pp-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .pp-name-icon {
          width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; color: #3B82F6;
          background: var(--bg-blue-50);
        }
        .pp-name-icon .anticon { font-size: 12px !important; }
        .pp-name-title { font-size: 12.5px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rh-sub { font-size: 10.5px; color: var(--text-slate-400); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; margin-top: 1px; }

        .pp-muted { color: var(--text-slate-400); }
        .pp-date { display: flex; flex-direction: column; line-height: 1.25; }
        .pp-date-main { font-size: 11px; font-weight: 500; color: var(--text-slate-700); }
        .pp-date-sub { font-size: 9.5px; color: var(--text-slate-400); }
        .rh-tickets { font-size: 12px; color: var(--text-slate-700); }
        .rh-tickets strong { font-weight: 700; }

        .pp-vis-pill {
          display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
        }
        .pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }
        .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        .rh-bar-wrap { display: flex; align-items: center; gap: 8px; min-width: 120px; }
        .rh-bar-track { flex: 1; height: 6px; background: var(--bg-slate-100); border-radius: 99px; overflow: hidden; }
        .rh-bar-fill { display: block; height: 100%; border-radius: 99px; background: #10b981; }
        .rh-bar-pct { font-size: 11px; font-weight: 700; color: var(--text-slate-700); min-width: 32px; text-align: right; font-variant-numeric: tabular-nums; }

        .rh-gen-btn { background: #3b82f6 !important; border: none !important; border-radius: 8px !important; font-weight: 600 !important; box-shadow: none !important; }
        .rh-gen-btn:hover { background: #2563eb !important; }
        .rh-actions { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
        .rh-act-btn {
          border-radius: 8px !important; border: 1px solid var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important; color: var(--text-slate-700) !important;
          font-weight: 600 !important; font-size: 12px !important; box-shadow: none !important;
        }
        .rh-act-btn:not(:disabled):hover { color: #4f46e5 !important; border-color: #c7d2fe !important; }
        .rh-error {
          margin-bottom: 12px; padding: 10px 12px; border-radius: 8px;
          border: 1px solid rgba(239,68,68,0.25); background: rgba(239,68,68,0.06); color: #b91c1c; font-size: 13px;
        }

        /* Footer + pager */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 0 14px; border-top: 1px solid var(--border-slate-200); height: 52px !important; box-sizing: border-box;
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30; margin: 8px -18px 0; padding: 0 18px;
          background: var(--bg-pure-white); box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 52px !important; box-sizing: border-box;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
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
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; text-align: center; max-width: 360px; }
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .pp-grid-loading { padding: 40px; text-align: center; color: var(--text-slate-400); grid-column: 1 / -1; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }
        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 12px;
        }
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
        .pc-foot-val { font-weight: 600; }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
        .pc-view-btn { background: none; border: none; cursor: pointer; padding: 0; color: #3B82F6; font-weight: 700; font-size: 11.5px; }
        .pc-view-btn .anticon { font-size: 12px; }
        .pc-view-btn:hover { text-decoration: underline; }

        @media (max-width: 700px) { .pp-grid { grid-template-columns: 1fr; } }
        @media (max-width: 1100px) { .pp-stats { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 820px) {
          .pp-sidebar { display: none; }
          .pp-topbar-meta { display: none; }
        }
      `}</style>
    </div>
  );
}

function fmtDate(d?: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function FolderCountIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}
