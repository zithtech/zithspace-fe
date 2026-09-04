"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";

import React, { useState, useMemo, useEffect } from "react";
import { Typography, Tag, Row, Col, Tooltip, Skeleton, Input, Space, Button } from "antd";
import {
  Layout,
  Building2,
  Layers,
  User,
  ShieldCheck,
  Search,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import { useGrades } from "@/hooks/useGrades";
import { usePositions } from "@/hooks/usePositions";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useActivitySource } from "@/hooks/useActivitySource";
import { History } from "lucide-react";
import TransactionHistoryDrawer from "@/components/common/TransactionHistoryDrawer";

const { Text } = Typography;

/* -------------------------------------------------------------------------- */
/*                  Document-Hub style StatCard + Sparkline                    */
/* -------------------------------------------------------------------------- */

const OvSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const width = 72;
  const height = 26;
  const pad = 4;
  const min = Math.min(...data);
  const max = Math.max(...data, min + 1);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * width;
    const y = height - pad - ((d - min) / range) * (height - pad - 2);
    return { x, y };
  });
  let path = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) path += ` L ${pts[i].x},${pts[i].y}`;
  const fill = `${path} L ${width},${height} L 0,${height} Z`;
  const gid = `ovspark-${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <stop offset="100%" stopColor={color} stopOpacity={0.04} />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gid})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// Stylized 7-pt trend scaled to the value, so the sparkline reads well without
// per-day backend data (mirrors the Document Hub dashboard).
const stylizedTrend = (shape: number[], total: number) =>
  total <= 0 ? [0, 0, 0, 0, 0, 0, 0] : shape.map((r) => r * total);

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  trend: number[];
  highlight?: boolean;
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, highlight, loading }) => (
  <div className="org-ov-dh-card">
    <div className="org-ov-dh-top">
      <span className={`org-ov-dh-icon${highlight ? " is-accent" : ""}`}>{icon}</span>
      <span className="org-ov-dh-label">{label}</span>
    </div>
    <div className="org-ov-dh-bottom">
      <div className="org-ov-dh-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 48, height: 22 }} />
        ) : (
          <>
            <span className="org-ov-dh-value">{value}</span>
            <span className="org-ov-dh-period">total</span>
          </>
        )}
      </div>
      <div className="org-ov-dh-spark">
        <OvSparkline data={trend} color={highlight ? "#10b981" : "#cbd5e1"} />
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                       Premium Hierarchy Visualization                      */
/* -------------------------------------------------------------------------- */

type HxType = "grade" | "dept" | "sub" | "pos";

interface HxNodeData {
  key: string;
  type: HxType;
  name: string;
  code?: string;
  count?: number;
  leaf?: boolean;
  children?: HxNodeData[];
}

const HX_META: Record<
  HxType,
  { color: string; tint: string; label: string; icon: (s: number) => React.ReactNode }
> = {
  grade: { color: "#3b82f6", tint: "rgba(59,130,246,0.12)", label: "Grade level", icon: (s) => <ShieldCheck size={s} /> },
  dept: { color: "#06b6d4", tint: "rgba(6,182,212,0.12)", label: "Department", icon: (s) => <Building2 size={s} /> },
  sub: { color: "#f97316", tint: "rgba(249,115,22,0.12)", label: "Sub-department", icon: (s) => <Layers size={s} /> },
  pos: { color: "#8b5cf6", tint: "rgba(139,92,246,0.12)", label: "Position", icon: (s) => <User size={s} /> },
};

const HxNode: React.FC<{
  node: HxNodeData;
  expanded: React.Key[];
  onToggle: (key: string) => void;
}> = ({ node, expanded, onToggle }) => {
  const meta = HX_META[node.type];
  const hasChildren = !!node.children?.length;
  const isOpen = expanded.includes(node.key);
  return (
    <div className="hx-node">
      <div
        className={`hx-row is-${node.type}${hasChildren ? " is-clickable" : ""}`}
        onClick={hasChildren ? () => onToggle(node.key) : undefined}
      >
        <span className={`hx-twist${hasChildren ? "" : " is-empty"}`}>
          {hasChildren && <ChevronRight size={14} className={isOpen ? "is-open" : ""} />}
        </span>
        <span className="hx-ico" style={{ color: meta.color, background: meta.tint }}>
          {meta.icon(node.type === "pos" ? 13 : 15)}
        </span>
        <span className="hx-body">
          <span className="hx-name">{node.name}</span>
          {node.type !== "pos" && (
            <span className="hx-type" style={{ color: meta.color, background: meta.tint }}>
              {meta.label}
            </span>
          )}
        </span>
        {node.code && <span className="hx-code">{node.code}</span>}
        {node.count != null && <span className={`hx-count is-${node.type}`}>{node.count}</span>}
      </div>
      {hasChildren && isOpen && (
        <div className="hx-children">
          {node.children!.map((c) => (
            <HxNode key={c.key} node={c} expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  );
};

const HierarchyTree: React.FC<{
  nodes: HxNodeData[];
  expanded: React.Key[];
  onToggle: (key: string) => void;
}> = ({ nodes, expanded, onToggle }) => (
  <div className="hx">
    {nodes.map((n) => (
      <HxNode key={n.key} node={n} expanded={expanded} onToggle={onToggle} />
    ))}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function OverviewPage() {
  useActivitySource({ section: "ADMIN", module: "OrgStructure", page: "OrgStructureOverview" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrgDashboard, canReadActivityLog } = usePermission();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [treeSearch, setTreeSearch] = useState<string>('');
  const [historyOpen, setHistoryOpen] = useState(false);

  const { allGrades: grades = [], loading: gradesLoading, fetchGrades } = useGrades();
  const { allPositions: positions, loading: positionsLoading, refresh: refreshPositions } = usePositions();
  const [refreshing, setRefreshing] = useState(false);
  const loading = gradesLoading || positionsLoading || refreshing;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchGrades(), refreshPositions()]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !canReadOrgDashboard) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadOrgDashboard, router]);

  useEffect(() => {
    if (grades.length > 0 && !activeStep) {
      setActiveStep(grades[0].key);
    }
  }, [grades, activeStep]);

  const getGradeStats = (gradeId: string) => {
    const gradePositions = positions.filter((p) => p.gradeId === gradeId);
    const deptIds = new Set(gradePositions.map((p) => p.departmentId).filter(Boolean));
    const subDeptIds = new Set(gradePositions.map((p) => p.subDepartmentId).filter(Boolean));
    return {
      positions: gradePositions.length,
      departments: deptIds.size,
      subDepartments: subDeptIds.size,
    };
  };

  // Org-wide stats
  const orgStats = useMemo(() => {
    const deptIds = new Set(positions.map((p) => p.departmentId).filter(Boolean));
    const subDeptIds = new Set(positions.map((p) => p.subDepartmentId).filter(Boolean));
    const positionsWithSubDept = positions.filter((p) => p.subDepartmentId).length;
    const positionsDirect = positions.length - positionsWithSubDept;

    // Grade with most positions
    const gradeCounts = grades.map((g) => ({
      name: g.name,
      count: positions.filter((p) => p.gradeId === g.key).length,
    }));
    const topGrade = gradeCounts.sort((a, b) => b.count - a.count)[0];

    return {
      grades: grades.length,
      departments: deptIds.size,
      subDepartments: subDeptIds.size,
      positions: positions.length,
      positionsWithSubDept,
      positionsDirect,
      topGrade,
    };
  }, [grades, positions]);

  const selectedGrade = grades.find((g) => g.key === activeStep);

  const treeData = useMemo(() => {
    if (!selectedGrade) return [];

    const gradePositions = positions.filter((p) => p.gradeId === selectedGrade.key);

    // Apply search filter at the position level
    const q = treeSearch.trim().toLowerCase();
    const filteredPositions = q
      ? gradePositions.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.departmentName || '').toLowerCase().includes(q) ||
          (p.subDepartmentName || '').toLowerCase().includes(q),
      )
      : gradePositions;

    const deptMap = new Map<
      string,
      {
        id: string;
        name: string;
        positions: any[];
        subDepts: Map<string, { name: string; positions: any[] }>;
      }
    >();

    filteredPositions.forEach((pos) => {
      const deptId = pos.departmentId;
      if (!deptId) return;

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          id: deptId,
          name: pos.departmentName || 'Unknown Dept',
          positions: [],
          subDepts: new Map(),
        });
      }
      const deptEntry = deptMap.get(deptId)!;

      if (pos.subDepartmentId) {
        if (!deptEntry.subDepts.has(pos.subDepartmentId)) {
          deptEntry.subDepts.set(pos.subDepartmentId, {
            name: pos.subDepartmentName || 'Unknown Sub-Dept',
            positions: [],
          });
        }
        deptEntry.subDepts.get(pos.subDepartmentId)!.positions.push(pos);
      } else {
        deptEntry.positions.push(pos);
      }
    });

    const deptNodes: HxNodeData[] = Array.from(deptMap.values()).map((d) => {
      const subDeptNodes: HxNodeData[] = Array.from(d.subDepts.entries()).map(([sdId, sdData]) => ({
        key: `sd-${sdId}-${d.id}`,
        type: "sub",
        name: sdData.name,
        count: sdData.positions.length,
        children: sdData.positions.map((p) => ({
          key: `pos-${p.id}`,
          type: "pos" as const,
          name: p.title,
          leaf: true,
        })),
      }));

      const directPosNodes: HxNodeData[] = d.positions.map((p) => ({
        key: `pos-${p.id}`,
        type: "pos",
        name: p.title,
        leaf: true,
      }));

      const childCount = d.positions.length + Array.from(d.subDepts.values()).reduce((s, sd) => s + sd.positions.length, 0);

      return {
        key: `dept-${d.id}`,
        type: "dept",
        name: d.name,
        count: childCount,
        children: [...subDeptNodes, ...directPosNodes],
      };
    });

    return [
      {
        key: `grade-${selectedGrade.key}`,
        type: "grade",
        name: selectedGrade.name,
        code: selectedGrade.code,
        count: filteredPositions.length,
        children: deptNodes,
      },
    ] as HxNodeData[];
  }, [selectedGrade, positions, treeSearch]);

  // Auto-expand tree when data changes
  useEffect(() => {
    if (treeData && treeData.length > 0) {
      const getAllKeys = (nodes: any[]): React.Key[] => {
        let keys: React.Key[] = [];
        nodes.forEach((node) => {
          keys.push(node.key);
          if (node.children) {
            keys.push(...getAllKeys(node.children));
          }
        });
        return keys;
      };
      setExpandedKeys(getAllKeys(treeData));
    }
  }, [treeData]);

  if (authLoading) {
    return (
      <div className="org-ov-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ZukvoLoader size="lg" message="Loading Organization View..." />
      </div>
    );
  }

  if (!canReadOrgDashboard) return null;

  const countPositions = (nodes: HxNodeData[]): number =>
    nodes.reduce((acc, n) => acc + (n.type === "pos" ? 1 : countPositions(n.children || [])), 0);
  const filteredCount = treeData[0] ? countPositions(treeData[0].children || []) : 0;

  return (
    <>
      <div className="org-ov-shell">
        <TimeTrackingHeader
          icon={<Layout size={20} color="#3b82f6" />}
          title="Organization Overview"
          description="View company hierarchy, reporting lines, and grades."
          onRefresh={handleRefresh}
          refreshing={loading}
          style={{
            borderBottom: '1px solid var(--border-slate-200)',
            padding: '9px 32px',
            marginBottom: 14,
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
          extra={
            <Space size={12} align="center">
              {canReadActivityLog && (
                <Button
                  icon={<History size={15} />}
                  onClick={() => setHistoryOpen(true)}
                  style={{ borderRadius: 10, height: 38, fontWeight: 600, color: "var(--text-secondary)" }}
                >
                  History
                </Button>
              )}
              <Tag className="org-ov-header-chip" style={{ margin: 0 }}>
                <ShieldCheck size={12} />
                {grades.length} GRADE LEVEL{grades.length === 1 ? '' : 'S'}
              </Tag>
            </Space>
          }
        />

        <div className="org-ov-content">
          {/* Stats overview */}
          <div className="org-ov-stat-grid" data-tour="org-overview-stats">
            <StatCard
              label="Grades"
              value={orgStats.grades}
              icon={<ShieldCheck size={15} />}
              trend={stylizedTrend([0.0, 0.05, 0.25, 0.45, 0.45, 0.7, 1.0], orgStats.grades)}
              loading={loading && orgStats.grades === 0}
            />
            <StatCard
              label="Departments"
              value={orgStats.departments}
              icon={<Building2 size={15} />}
              trend={stylizedTrend([0.0, 0.2, 0.4, 0.55, 0.75, 0.85, 1.0], orgStats.departments)}
              loading={loading && orgStats.departments === 0}
            />
            <StatCard
              label="Sub-Departments"
              value={orgStats.subDepartments}
              icon={<Layers size={15} />}
              trend={stylizedTrend([0.0, 0.3, 0.25, 0.5, 0.65, 0.8, 1.0], orgStats.subDepartments)}
              loading={loading && orgStats.subDepartments === 0}
            />
            <StatCard
              label="Positions"
              value={orgStats.positions}
              icon={<User size={15} />}
              trend={stylizedTrend([0.0, 0.05, 0.25, 0.45, 0.45, 0.7, 1.0], orgStats.positions)}
              highlight
              loading={loading && orgStats.positions === 0}
            />
          </div>

          {/* Body — two columns */}
          <Row gutter={20} className="org-ov-body">
            {/* Grade Selector */}
            <Col xs={24} lg={9} xl={8}>
              <div className="org-ov-panel" data-tour="org-overview-grades-list">
                <div className="org-ov-panel__header">
                  <div className="org-ov-panel__icon is-blue">
                    <ShieldCheck size={14} />
                  </div>
                  <div className="org-ov-panel__text">
                    <div className="org-ov-panel__title">Grade Distribution</div>
                    <div className="org-ov-panel__sub">
                      Overview of {grades.length} organizational level{grades.length === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                <div className="org-ov-panel__body org-ov-scroll">
                  {gradesLoading || positionsLoading ? (
                    <div style={{ padding: 16 }}>
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} active paragraph={{ rows: 1 }} style={{ marginBottom: 16 }} />
                      ))}
                    </div>
                  ) : grades.length === 0 ? (
                    <div className="org-ov-empty">
                      <ShieldCheck size={28} className="org-ov-empty__icon" />
                      <div className="org-ov-empty__title">No grades defined</div>
                      <div className="org-ov-empty__sub">
                        Add grade levels in the Grades configuration page.
                      </div>
                    </div>
                  ) : (
                    <div className="org-ov-grade-list">
                      {grades.map((item) => {
                        const isActive = activeStep === item.key;
                        const stats = getGradeStats(item.key);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setActiveStep(item.key)}
                            className={`org-ov-grade${isActive ? ' is-active' : ''}`}
                          >
                            <span className="org-ov-grade__accent" />
                            <div className="org-ov-grade__name-block">
                              <span className="org-ov-grade__name">{item.name}</span>
                              <span className="org-ov-grade__code">{item.code}</span>
                            </div>
                            <div className="org-ov-grade__stats">
                              <span className="org-ov-grade__stat">
                                <span className="org-ov-grade__stat-value">{stats.positions}</span>
                                <span className="org-ov-grade__stat-label">POS</span>
                              </span>
                              <span className="org-ov-grade__stat">
                                <span className="org-ov-grade__stat-value">{stats.departments}</span>
                                <span className="org-ov-grade__stat-label">DEPT</span>
                              </span>
                              <span className="org-ov-grade__stat">
                                <span className="org-ov-grade__stat-value">{stats.subDepartments}</span>
                                <span className="org-ov-grade__stat-label">SUB</span>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Col>

            {/* Hierarchy Tree */}
            <Col xs={24} lg={15} xl={16}>
              {selectedGrade ? (
                <div className="org-ov-panel" data-tour="org-overview-tree">
                  <div className="org-ov-panel__header">
                    <div className="org-ov-panel__icon is-purple">
                      <ShieldCheck size={14} />
                    </div>
                    <div className="org-ov-panel__text">
                      <div className="org-ov-panel__title">Hierarchy Visualization</div>
                      <div className="org-ov-panel__sub">
                        Mapping for <strong>{selectedGrade.name}</strong> · {filteredCount} position
                        {filteredCount === 1 ? '' : 's'}
                        {treeSearch && ` matching "${treeSearch}"`}
                      </div>
                    </div>
                    <div className="org-ov-legend">
                      <span className="org-ov-legend__item">
                        <span className="org-ov-legend__dot is-cyan" />
                        DEPT
                      </span>
                      <span className="org-ov-legend__item">
                        <span className="org-ov-legend__dot is-orange" />
                        SUB
                      </span>
                      <span className="org-ov-legend__item">
                        <span className="org-ov-legend__dot is-purple" />
                        POS
                      </span>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="org-ov-panel__toolbar">
                    <Input
                      className="org-ov-search"
                      prefix={
                        <Search size={14} color="var(--text-slate-400)" style={{ marginRight: 4 }} />
                      }
                      placeholder="Search position, department, or sub-department…"
                      value={treeSearch}
                      onChange={(e) => setTreeSearch(e.target.value)}
                      allowClear
                    />
                  </div>

                  <div className="org-ov-panel__body org-ov-scroll org-ov-tree-wrap">
                    {treeData.length > 0 && treeData[0]?.children?.length === 0 ? (
                      <div className="org-ov-empty">
                        <Search size={28} className="org-ov-empty__icon" />
                        <div className="org-ov-empty__title">
                          {treeSearch ? 'No matches' : 'No structure yet'}
                        </div>
                        <div className="org-ov-empty__sub">
                          {treeSearch
                            ? 'Try a different keyword or clear the filter.'
                            : 'No departments or positions assigned to this grade.'}
                        </div>
                      </div>
                    ) : (
                      <HierarchyTree
                        nodes={treeData}
                        expanded={expandedKeys}
                        onToggle={(key) =>
                          setExpandedKeys((prev) =>
                            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
                          )
                        }
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="org-ov-panel">
                  <div className="org-ov-empty org-ov-empty--full">
                    <Layout size={40} className="org-ov-empty__icon" />
                    <div className="org-ov-empty__title">Select a grade level</div>
                    <div className="org-ov-empty__sub">
                      Pick a grade from the left to visualize its hierarchy.
                    </div>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </div>
      </div>
      <TransactionHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        module="OrgStructure"
      />
      <style jsx global>{`
        /* Document-Hub style stat cards (minimal, mostly grey, one accent) */
        .org-ov-dh-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0;
          padding: 12px 14px;
          height: 80px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .org-ov-dh-card:hover {
          border-color: var(--border-slate-300, #cbd5e1);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
        }
        .org-ov-dh-top { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .org-ov-dh-icon {
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-slate-400); flex-shrink: 0; font-size: 15px;
        }
        .org-ov-dh-icon.is-accent {
          width: 26px; height: 26px; border-radius: 6px;
          color: #10b981; background: rgba(16, 185, 129, 0.11);
        }
        .org-ov-dh-label {
          font-size: 12.5px; font-weight: 500; color: var(--text-slate-500);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .org-ov-dh-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .org-ov-dh-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .org-ov-dh-value {
          font-size: 24px; font-weight: 700; color: var(--text-slate-800);
          letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums;
        }
        .org-ov-dh-period { font-size: 11px; font-weight: 500; color: var(--text-slate-400); }
        .org-ov-dh-spark { flex-shrink: 0; margin-bottom: 2px; }

        /* ---------- Premium Hierarchy Visualization ---------- */
        .hx { display: flex; flex-direction: column; gap: 1px; padding: 2px; }
        .hx-node { display: flex; flex-direction: column; }
        .hx-row {
          display: flex; align-items: center; gap: 9px;
          min-height: 38px; padding: 4px 12px 4px 6px;
          border-radius: 9px; position: relative;
          transition: background 0.15s ease, box-shadow 0.15s ease;
        }
        .hx-row.is-clickable { cursor: pointer; }
        .hx-row:hover { background: var(--bg-slate-50); }

        /* Grade root — premium accent card */
        .hx-row.is-grade {
          min-height: 50px;
          margin-bottom: 4px;
          background: rgba(59, 130, 246, 0.07);
          border: 1px solid rgba(59, 130, 246, 0.18);
          box-shadow: 0 6px 16px -12px rgba(37, 99, 235, 0.4);
        }
        .hx-row.is-grade:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        /* Expand chevron */
        .hx-twist {
          width: 18px; height: 18px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-slate-400); border-radius: 5px;
        }
        .hx-twist svg { transition: transform 0.18s ease; }
        .hx-twist svg.is-open { transform: rotate(90deg); }
        .hx-row.is-clickable:hover .hx-twist { color: var(--text-slate-600); }

        /* Typed icon chip */
        .hx-ico {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
        }
        .hx-row.is-grade .hx-ico { width: 34px; height: 34px; border-radius: 10px; }
        .hx-row.is-pos .hx-ico { width: 26px; height: 26px; border-radius: 7px; }

        /* Label block */
        .hx-body { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
        .hx-name {
          font-size: 13px; font-weight: 600; color: var(--text-slate-800);
          letter-spacing: -0.005em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .hx-row.is-grade .hx-name { font-size: 15px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.01em; }
        .hx-row.is-pos .hx-name { font-weight: 500; color: var(--text-slate-600); }
        .hx-type {
          flex-shrink: 0; font-size: 9px; font-weight: 700; letter-spacing: 0.06em;
          text-transform: uppercase; padding: 2px 7px; border-radius: 5px; line-height: 1.3;
        }

        /* Grade code chip */
        .hx-code {
          flex-shrink: 0; font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 10px; font-weight: 700; letter-spacing: 0.04em; padding: 2px 7px;
          border-radius: 5px; background: rgba(59, 130, 246, 0.12); color: #1d4ed8;
        }

        /* Count chip */
        .hx-count {
          flex-shrink: 0; margin-left: 4px; min-width: 26px; height: 22px; padding: 0 8px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 7px; font-size: 11.5px; font-weight: 700; font-variant-numeric: tabular-nums;
          background: var(--bg-slate-100); color: var(--text-slate-600);
        }
        .hx-count.is-grade { background: rgba(59, 130, 246, 0.14); color: #1d4ed8; }

        /* Nesting + indent guide rail */
        .hx-children { position: relative; margin-left: 21px; padding-left: 16px; }
        .hx-children::before {
          content: ""; position: absolute; left: 0; top: 3px; bottom: 6px; width: 1.5px;
          background: var(--border-slate-200); border-radius: 2px;
        }
      `}</style>
    </>
  );
}
