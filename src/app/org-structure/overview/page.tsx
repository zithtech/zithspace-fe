"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Card, Typography, Space, Tag, notification, Row, Col, Spin, Tree, Divider } from "antd";
import { Layout, Building2, Layers, User, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useGrades } from "@/hooks/useGrades";
import { usePositions } from "@/hooks/usePositions";

const { Text, Title } = Typography;

export default function OverviewPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrg } = usePermission();
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);

  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  useEffect(() => {
    if (!authLoading && !canReadOrg) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadOrg, router]);

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

  const selectedGrade = grades.find((g) => g.key === activeStep);

  const treeData = useMemo(() => {
    if (!selectedGrade) return [];

    const gradePositions = positions.filter((p) => p.gradeId === selectedGrade.key);

    const deptMap = new Map<string, {
      id: string;
      name: string;
      positions: any[];
      subDepts: Map<string, { name: string; positions: any[] }>;
    }>();

    gradePositions.forEach((pos) => {
      const deptId = pos.departmentId;
      if (!deptId) return;

      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, {
          id: deptId,
          name: pos.departmentName || "Unknown Dept",
          positions: [],
          subDepts: new Map(),
        });
      }
      const deptEntry = deptMap.get(deptId)!;

      if (pos.subDepartmentId) {
        if (!deptEntry.subDepts.has(pos.subDepartmentId)) {
          deptEntry.subDepts.set(pos.subDepartmentId, {
            name: pos.subDepartmentName || "Unknown Sub-Dept",
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
          <div className="org-node sub-dept-node">
            <div className="node-icon-wrapper orange"><Layers size={14} /></div>
            <div className="node-content">
              <Text strong className="node-title">{sdData.name}</Text>
              <Tag className="node-tag orange">Sub-Department</Tag>
            </div>
          </div>
        ),
        key: `sd-${sdId}-${d.id}`,
        children: sdData.positions.map((p) => ({
          title: (
            <div className="org-node position-node">
              <div className="node-icon-wrapper purple"><User size={12} /></div>
              <div className="node-content">
                <Text className="node-title">{p.title}</Text>
                <Tag className="node-tag purple mini">Position</Tag>
              </div>
            </div>
          ),
          key: `pos-${p.id}`,
          isLeaf: true,
        })),
      }));

      const directPosNodes = d.positions.map((p) => ({
        title: (
          <div className="org-node position-node">
            <div className="node-icon-wrapper purple"><User size={12} /></div>
            <div className="node-content">
              <Text className="node-title">{p.title}</Text>
              <Tag className="node-tag purple mini">Position</Tag>
            </div>
          </div>
        ),
        key: `pos-${p.id}`,
        isLeaf: true,
      }));

      return {
        title: (
          <div className="org-node dept-node">
            <div className="node-icon-wrapper cyan"><Building2 size={16} /></div>
            <div className="node-content">
              <Text strong className="node-title">{d.name}</Text>
              <Tag className="node-tag cyan">Department</Tag>
            </div>
          </div>
        ),
        key: `dept-${d.id}`,
        children: [...subDeptNodes, ...directPosNodes],
      };
    });

    return [{
      title: (
        <div className="org-node grade-root-node">
          <div className="node-icon-wrapper blue"><ShieldCheck size={18} /></div>
          <div className="node-content">
            <Text strong className="node-main-title">{selectedGrade.name} ({selectedGrade.code})</Text>
            <Tag className="node-tag blue premium">Grade Level</Tag>
          </div>
        </div>
      ),
      key: `grade-${selectedGrade.key}`,
      children: deptNodes,
    }];
  }, [selectedGrade, positions]);

  // Auto-expand tree when data changes
  useEffect(() => {
    if (treeData && treeData.length > 0) {
      const getAllKeys = (nodes: any[]): React.Key[] => {
        let keys: React.Key[] = [];
        nodes.forEach(node => {
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
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#ffffff' }}>
            <Spin size="large" tip="Loading Organization View..." />
          </div>
        </MainLayout>
      </ProtectedRoute>
    );
  }

  if (!canReadOrg) return null;

  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ padding: "24px 32px", background: "#ffffff", height: "calc(100vh - 64px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header Section */}
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flex: "0 0 auto" }}>
            <div style={{ flex: 1 }}>
              <Space size={12} align="center">
                <div style={{ background: "rgba(22, 119, 255, 0.08)", padding: 10, borderRadius: 12, color: "#1677ff", display: "flex" }}>
                  <Layout size={24} />
                </div>
                <div>
                  <Typography.Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>Organization Overview</Typography.Title>
                  <Text style={{ color: "#64748b", fontSize: 15 }}>Visualize the organizational hierarchy, reporting lines, and grade distributions.</Text>
                </div>
              </Space>
            </div>
            <div>
              <Tag style={{ borderRadius: 6, padding: "4px 12px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 600 }}>
                {grades.length} GRADE LEVELS
              </Tag>
            </div>
          </div>

          <Row gutter={24} style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
            {/* Grade Selector */}
            <Col span={8} style={{ height: "100%", overflow: "hidden", paddingRight: 12, paddingBottom: 24, display: "flex", flexDirection: "column" }}>
              <div className="hierarchy-viz-card" style={{ borderRadius: 20, padding: "32px 0 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f1f5f9", paddingRight: 32, flex: "0 0 auto" }}>
                  <Text strong style={{ fontSize: 15, color: "#1e293b" }}>Grade Distribution</Text>
                  <div style={{ fontSize: 11, color: "#64748b" }}>Overview of {grades.length} organizational levels</div>
                </div>
                <div className="custom-scrollbar" style={{ flex: 1, overflowY: "auto", paddingRight: 32 }}>
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    {gradesLoading || positionsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => <Card key={i} loading style={{ borderRadius: 12, border: "1px solid #f1f5f9" }} />)
                    ) : (
                      grades.map((item) => {
                        const active = activeStep === item.key;
                        const stats = getGradeStats(item.key);
                        return (
                          <div
                            key={item.key}
                            onClick={() => setActiveStep(item.key)}
                            className={`grade-selector-card ${active ? "active" : ""}`}
                            style={{
                              cursor: "pointer",
                              padding: "16px 20px",
                              borderRadius: 16,
                              border: active ? "1px solid #2563eb" : "1px solid #e2e8f0",
                              background: active ? "#eff6ff" : "#ffffff",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 8,
                              position: "relative",
                              transition: "all 0.3s ease"
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <Text strong style={{
                                display: "block",
                                color: active ? "#1e40af" : "#1e293b",
                                fontSize: 15,
                                marginBottom: 2
                              }}>
                                {item.name}
                              </Text>
                              <Space size={4}>
                                <Tag style={{
                                  margin: 0,
                                  fontSize: 9,
                                  fontWeight: 700,
                                  background: active ? "#dbeafe" : "#f1f5f9",
                                  color: active ? "#1e40af" : "#64748b",
                                  border: "none",
                                  borderRadius: 4
                                }}>
                                  {item.code}
                                </Tag>
                              </Space>
                            </div>
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                              <div className="selector-stat-group">
                                <div className={`selector-stat-value ${active ? "active" : ""}`}>{stats.positions}</div>
                                <div className="selector-stat-label">POS</div>
                              </div>
                              <div className="selector-stat-group">
                                <div className={`selector-stat-value ${active ? "active" : ""}`}>{stats.departments}</div>
                                <div className="selector-stat-label">DEPT</div>
                              </div>
                              <div className="selector-stat-group">
                                <div className={`selector-stat-value ${active ? "active" : ""}`}>{stats.subDepartments}</div>
                                <div className="selector-stat-label">SUB</div>
                              </div>
                            </div>
                            {active && <div style={{
                              position: "absolute",
                              left: 0,
                              top: 12,
                              bottom: 12,
                              width: 4,
                              background: "#2563eb",
                              borderRadius: "0 4px 4px 0"
                            }} />}
                          </div>
                        );
                      })
                    )}
                  </Space>
                </div>
              </div>
            </Col>

            {/* Hierarchy Tree */}
            <Col span={16} style={{ height: "100%", overflow: "hidden", paddingLeft: 12, paddingBottom: 24, display: "flex", flexDirection: "column" }}>
              {selectedGrade ? (
                <div className="hierarchy-viz-card" style={{ borderRadius: 20, padding: "32px 0 32px 32px", height: "100%", display: "flex", flexDirection: "column" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f1f5f9", paddingRight: 32, flex: "0 0 auto" }}>
                    <Space size={12}>
                      <div style={{ background: "rgba(22, 119, 255, 0.08)", padding: 8, borderRadius: 10, color: "#1677ff", display: "flex" }}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 15, color: "#1e293b" }}>Hierarchy Visualization</Text>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Deep structural mapping for <Text strong style={{ color: "#1677ff" }}>{selectedGrade.name}</Text></div>
                      </div>
                    </Space>
                    <div style={{ display: "flex", gap: 16 }}>
                      <Space size={6}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#00b8d4" }} /><Text style={{ fontSize: 10, color: "#64748b" }}>DEPT</Text></Space>
                      <Space size={6}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#ff9800" }} /><Text style={{ fontSize: 10, color: "#64748b" }}>SUB-DEPT</Text></Space>
                      <Space size={6}><div style={{ width: 8, height: 8, borderRadius: 2, background: "#9c27b0" }} /><Text style={{ fontSize: 10, color: "#64748b" }}>POSITION</Text></Space>
                    </div>
                  </div>
                  <div className="hierarchy-container custom-scrollbar" style={{ flex: 1, overflowY: "auto", paddingRight: 32 }}>
                    <Tree
                      showLine={{ showLeafIcon: false }}
                      expandedKeys={expandedKeys}
                      onExpand={(keys) => setExpandedKeys(keys)}
                      treeData={treeData}
                      switcherIcon={<div style={{ color: "#94a3b8", fontSize: 12 }}>▼</div>}
                      style={{ background: 'transparent' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ border: "1px dashed #e2e8f0", borderRadius: 16, height: 400, display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 12 }}>
                  <Layout size={48} style={{ color: "#94a3b8" }} />
                  <Text style={{ color: "#64748b" }}>Select a grade level to visualize the hierarchy</Text>
                </div>
              )}
            </Col>
          </Row>
        </div>

        <style dangerouslySetInnerHTML={{
          __html: `
          .org-node { 
            display: flex; 
            align-items: center; 
            padding: 10px 0; 
            border-radius: 8px;
            transition: all 0.2s ease;
          }
          .node-icon-wrapper { 
            width: 44px; 
            height: 44px; 
            border-radius: 12px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-right: 16px;
            border: 1px solid transparent;
          }
          .node-icon-wrapper.blue { background: rgba(30, 64, 175, 0.08); color: #1e40af; border-color: rgba(30, 64, 175, 0.1); }
          .node-icon-wrapper.cyan { background: rgba(8, 145, 178, 0.08); color: #0891b2; border-color: rgba(8, 145, 178, 0.1); }
          .node-icon-wrapper.orange { background: rgba(194, 65, 12, 0.08); color: #c2410c; border-color: rgba(194, 65, 12, 0.1); }
          .node-icon-wrapper.purple { background: rgba(126, 34, 206, 0.08); color: #7e22ce; border-color: rgba(126, 34, 206, 0.1); }
          
          .node-content { display: flex; flex-direction: column; gap: 2px; }
          .node-title { font-size: 15px; color: #1e293b; line-height: 1.4; font-weight: 600; }
          .node-main-title { font-size: 18px; color: #0f172a; font-weight: 700; letter-spacing: -0.01em; }
          
          .node-tag { 
            border: 1px solid transparent !important; 
            font-size: 10px !important; 
            padding: 2px 8px !important; 
            border-radius: 6px !important; 
            margin: 4px 0 0 0 !important; 
            width: fit-content; 
            text-transform: uppercase; 
            font-weight: 700; 
            height: auto; 
            line-height: normal; 
          }
          .node-tag.blue { background: #eff6ff !important; color: #1e40af !important; border-color: #dbeafe !important; }
          .node-tag.cyan { background: #ecfeff !important; color: #0891b2 !important; border-color: #cffafe !important; }
          .node-tag.orange { background: #fff7ed !important; color: #c2410c !important; border-color: #ffedd5 !important; }
          .node-tag.purple { background: #faf5ff !important; color: #7e22ce !important; border-color: #f3e8ff !important; }
          
          .node-tag.premium { 
             background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
             box-shadow: 0 2px 4px rgba(30, 64, 175, 0.05);
          }

          .node-tag.mini { height: 18px; line-height: 18px; font-size: 9px !important; }

          .custom-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .custom-scrollbar {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }

          .hierarchy-container .ant-tree .ant-tree-node-content-wrapper {
            padding: 4px 8px !important;
            border-radius: 12px !important;
            transition: background-color 0.2s ease;
          }
          .hierarchy-container .ant-tree .ant-tree-node-content-wrapper:hover { 
            background-color: #f8fafc !important; 
          }
          .hierarchy-container .ant-tree .ant-tree-node-selected { 
            background-color: #f1f5f9 !important; 
          }
          .hierarchy-container .ant-tree-switcher { 
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important; 
            width: 32px !important;
          }
          
          .hierarchy-container .ant-tree-indent-unit {
             width: 32px !important;
          }
          
          /* Custom hierarchy container styling */
          .hierarchy-viz-card {
            border: 1px solid #e2e8f0 !important;
            background: linear-gradient(to bottom right, #ffffff, #fcfdff) !important;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
          }

          .grade-selector-card:hover {
            border-color: #cbd5e1 !important;
            transform: translateX(4px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
          }
          .grade-selector-card.active {
            box-shadow: 0 8px 16px rgba(37, 99, 235, 0.08) !important;
          }
          
          .selector-stat-group {
            text-align: center;
            min-width: 32px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
          }
          .selector-stat-value {
            font-weight: 800;
            font-size: 14px;
            color: #475569;
            line-height: 1;
            transition: all 0.3s ease;
          }
          .selector-stat-value.active {
            color: #1e40af;
            transform: scale(1.1);
          }
          .selector-stat-label {
            font-size: 8px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          /* Ensure no heavy shadows but allow subtle ones for depth */
          .grade-card-hover:hover { transform: translateY(-2px); }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
