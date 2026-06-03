"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Typography, Tag, Row, Col, Spin, Tree, Tooltip, Skeleton, Input } from "antd";
import {
  Layout,
  Building2,
  Layers,
  User,
  ShieldCheck,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useGrades } from "@/hooks/useGrades";
import { usePositions } from "@/hooks/usePositions";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useActivitySource } from "@/hooks/useActivitySource";

const { Text } = Typography;

/* -------------------------------------------------------------------------- */
/*                              Premium StatCard                              */
/* -------------------------------------------------------------------------- */

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
  subtle?: string;
  loading?: boolean;
  chart?: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accent,
  subtle,
  loading,
  chart,
}) => (
  <div className="org-ov-stat-card" style={{ ['--ov-accent' as any]: accent }}>
    <div className="org-ov-stat-head">
      <div
        className="org-ov-stat-icon"
        style={{
          background: `${accent}14`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}26`,
        }}
      >
        {icon}
      </div>
      <Text className="org-ov-stat-label">{label}</Text>
      <div className="org-ov-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="org-ov-stat-value">{value}</span>
        )}
      </div>
    </div>
    {subtle && <Text className="org-ov-stat-subtle">{subtle}</Text>}
    {chart && <div className="org-ov-stat-chart">{chart}</div>}
    <span
      className="org-ov-stat-accent"
      style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
    />
  </div>
);

interface MiniBarProps {
  segments: { value: number; color: string; label: string }[];
}
const MiniBar: React.FC<MiniBarProps> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="org-ov-minibar">
      <div className="org-ov-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="org-ov-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="org-ov-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="org-ov-minibar-legend-item">
            <span className="org-ov-minibar-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function OverviewPage() {
  useActivitySource({ section: "WORK", module: "OrgStructure", page: "OrgStructureOverview" });
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrgDashboard } = usePermission();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [treeSearch, setTreeSearch] = useState<string>('');

  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { dataSource: positions, loading: positionsLoading } = usePositions();
  const loading = gradesLoading || positionsLoading;

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

    const deptNodes = Array.from(deptMap.values()).map((d) => {
      const subDeptNodes = Array.from(d.subDepts.entries()).map(([sdId, sdData]) => ({
        title: (
          <div className="org-ov-node is-sub">
            <div className="org-ov-node__icon is-orange">
              <Layers size={14} />
            </div>
            <div className="org-ov-node__text">
              <span className="org-ov-node__title">{sdData.name}</span>
              <span className="org-ov-node__tag is-orange">Sub-Department</span>
            </div>
            <span className="org-ov-node__count">{sdData.positions.length}</span>
          </div>
        ),
        key: `sd-${sdId}-${d.id}`,
        children: sdData.positions.map((p) => ({
          title: (
            <div className="org-ov-node is-pos">
              <div className="org-ov-node__icon is-purple">
                <User size={12} />
              </div>
              <div className="org-ov-node__text">
                <span className="org-ov-node__title is-small">{p.title}</span>
              </div>
            </div>
          ),
          key: `pos-${p.id}`,
          isLeaf: true,
        })),
      }));

      const directPosNodes = d.positions.map((p) => ({
        title: (
          <div className="org-ov-node is-pos">
            <div className="org-ov-node__icon is-purple">
              <User size={12} />
            </div>
            <div className="org-ov-node__text">
              <span className="org-ov-node__title is-small">{p.title}</span>
            </div>
          </div>
        ),
        key: `pos-${p.id}`,
        isLeaf: true,
      }));

      const childCount = d.positions.length + Array.from(d.subDepts.values()).reduce((s, sd) => s + sd.positions.length, 0);

      return {
        title: (
          <div className="org-ov-node is-dept">
            <div className="org-ov-node__icon is-cyan">
              <Building2 size={16} />
            </div>
            <div className="org-ov-node__text">
              <span className="org-ov-node__title">{d.name}</span>
              <span className="org-ov-node__tag is-cyan">Department</span>
            </div>
            <span className="org-ov-node__count">{childCount}</span>
          </div>
        ),
        key: `dept-${d.id}`,
        children: [...subDeptNodes, ...directPosNodes],
      };
    });

    return [
      {
        title: (
          <div className="org-ov-node is-grade-root">
            <div className="org-ov-node__icon is-blue">
              <ShieldCheck size={18} />
            </div>
            <div className="org-ov-node__text">
              <span className="org-ov-node__title is-main">
                <span>{selectedGrade.name}</span>
                <span className="org-ov-node__code">{selectedGrade.code}</span>
              </span>
              <span className="org-ov-node__tag is-blue is-premium">Grade Level</span>
            </div>
            <span className="org-ov-node__count is-strong">{filteredPositions.length}</span>
          </div>
        ),
        key: `grade-${selectedGrade.key}`,
        children: deptNodes,
      },
    ];
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
      <ProtectedRoute>
        <MainLayout>
          <div className="org-ov-shell" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Spin size="large" tip="Loading Organization View..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrgDashboard) return null;

  const filteredCount = treeData[0]?.children
    ? treeData[0].children.reduce((acc: number, dept: any) => {
        const subPositions = dept.children
          ? dept.children.reduce(
              (s: number, c: any) => s + (c.isLeaf ? 1 : c.children?.length || 0),
              0,
            )
          : 0;
        return acc + subPositions;
      }, 0)
    : 0;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="org-ov-shell">
          <TimeTrackingHeader
            icon={<Layout size={20} color="#3b82f6" />}
            title="Organization Overview"
            description="Visualize the organizational hierarchy, reporting lines, and grade distributions."
            style={{
              borderBottom: '1px solid var(--border-slate-200)',
              padding: '8.5px 32px',
              marginBottom: 20,
            }}
            extra={
              <Tag className="org-ov-header-chip">
                <ShieldCheck size={12} />
                {grades.length} GRADE LEVEL{grades.length === 1 ? '' : 'S'}
              </Tag>
            }
          />

          <div className="org-ov-content">
            {/* Stats overview */}
            <div className="org-ov-stat-grid">
              <StatCard
                label="Grades"
                value={orgStats.grades}
                icon={<ShieldCheck size={14} />}
                accent="#3b82f6"
                subtle={
                  orgStats.topGrade
                    ? `Top: ${orgStats.topGrade.name} (${orgStats.topGrade.count} pos)`
                    : 'No grades yet'
                }
                loading={loading && orgStats.grades === 0}
              />

              <StatCard
                label="Departments"
                value={orgStats.departments}
                icon={<Building2 size={14} />}
                accent="#0891b2"
                subtle="Top-level org units"
                loading={loading && orgStats.departments === 0}
              />

              <StatCard
                label="Sub-Departments"
                value={orgStats.subDepartments}
                icon={<Layers size={14} />}
                accent="#f97316"
                subtle="Nested business units"
                loading={loading && orgStats.subDepartments === 0}
              />

              <StatCard
                label="Positions"
                value={orgStats.positions}
                icon={<User size={14} />}
                accent="#8b5cf6"
                subtle={
                  orgStats.positions > 0
                    ? `${orgStats.positionsWithSubDept} in sub-depts, ${orgStats.positionsDirect} direct`
                    : 'No positions yet'
                }
                loading={loading && orgStats.positions === 0}
                chart={
                  orgStats.positions > 0 ? (
                    <MiniBar
                      segments={[
                        {
                          value: orgStats.positionsWithSubDept,
                          color: '#f97316',
                          label: `${orgStats.positionsWithSubDept} in sub-depts`,
                        },
                        {
                          value: orgStats.positionsDirect,
                          color: '#8b5cf6',
                          label: `${orgStats.positionsDirect} direct`,
                        },
                      ]}
                    />
                  ) : null
                }
              />
            </div>

            {/* Body — two columns */}
            <Row gutter={20} className="org-ov-body">
              {/* Grade Selector */}
              <Col xs={24} lg={9} xl={8}>
                <div className="org-ov-panel">
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
                  <div className="org-ov-panel">
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
                        <Tree
                          className="org-ov-tree"
                          showLine={{ showLeafIcon: false }}
                          expandedKeys={expandedKeys}
                          onExpand={(keys) => setExpandedKeys(keys)}
                          treeData={treeData}
                          switcherIcon={<span className="org-ov-tree__switcher">▾</span>}
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
      </MainLayout>
    </ProtectedRoute>
  );
}
