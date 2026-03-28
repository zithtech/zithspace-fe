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
        <div style={{ margin: "0 -24px", padding: "24px 32px", background: "#ffffff", minHeight: "calc(100vh - 64px)" }}>
          
          {/* Header Section */}
          <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
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

          <Row gutter={24}>
            {/* Grade Selector */}
            <Col span={8}>
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 11, color: "#94a3b8", textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grade Distribution</Text>
              </div>
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
                        style={{
                          cursor: "pointer",
                          padding: 16,
                          borderRadius: 12,
                          border: active ? "1px solid #1677ff" : "1px solid #f1f5f9",
                          background: active ? "#f0f7ff" : "#ffffff",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <Text strong style={{ display: "block", color: active ? "#1677ff" : "#1e293b", fontSize: 14 }}>{item.name}</Text>
                          <Text style={{ color: active ? "#3b82f6" : "#64748b", fontSize: 11 }}>CODE: {item.code}</Text>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                           <div style={{ textAlign: "center", minWidth: 28 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: active ? "#1e293b" : "#475569" }}>{stats.positions}</div>
                              <Text style={{ fontSize: 9, color: "#94a3b8" }}>POS</Text>
                           </div>
                           <Divider type="vertical" style={{ height: 24, margin: "auto 4px" }} />
                           <div style={{ textAlign: "center", minWidth: 28 }}>
                              <div style={{ fontWeight: 700, fontSize: 13, color: active ? "#1e293b" : "#475569" }}>{stats.departments}</div>
                              <Text style={{ fontSize: 9, color: "#94a3b8" }}>DEP</Text>
                           </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </Space>
            </Col>

            {/* Hierarchy Tree */}
            <Col span={16}>
              {selectedGrade ? (
                <div style={{ border: "1px solid #f1f5f9", borderRadius: 16, padding: 24, minHeight: "calc(100vh - 250px)" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
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
                   <div className="hierarchy-container">
                    <Tree
                      showLine={{ showLeafIcon: false }}
                      defaultExpandAll
                      treeData={treeData}
                      switcherIcon={<div style={{ color: "#94a3b8", fontSize: 10 }}>▼</div>}
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

        <style dangerouslySetInnerHTML={{ __html: `
          .org-node { display: flex; align-items: center; padding: 4px 0; border-radius: 0; }
          .node-icon-wrapper { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 12px; }
          .node-icon-wrapper.blue { background: rgba(22, 119, 255, 0.08); color: #1677ff; }
          .node-icon-wrapper.cyan { background: rgba(0, 184, 212, 0.08); color: #00b8d4; }
          .node-icon-wrapper.orange { background: rgba(255, 152, 0, 0.08); color: #ff9800; }
          .node-icon-wrapper.purple { background: rgba(156, 39, 176, 0.08); color: #9c27b0; }
          .node-content { display: flex; flex-direction: column; }
          .node-title { font-size: 13px; color: #1e293b; line-height: 1.2; }
          .node-main-title { font-size: 15px; color: #0f172a; font-weight: 700; }
          .node-tag { border: none !important; font-size: 9px !important; padding: 0 6px !important; border-radius: 4px !important; margin: 4px 0 0 0 !important; width: fit-content; text-transform: uppercase; font-weight: 700; height: 18px; line-height: 18px; }
          .node-tag.blue { background: #e0f2fe !important; color: #0369a1 !important; }
          .node-tag.cyan { background: #ecfeff !important; color: #0891b2 !important; }
          .node-tag.orange { background: #fff7ed !important; color: #c2410c !important; }
          .node-tag.purple { background: #faf5ff !important; color: #7e22ce !important; }
          .node-tag.mini { height: 16px; line-height: 16px; font-size: 8px !important; }

          .hierarchy-container .ant-tree .ant-tree-node-content-wrapper:hover { background-color: transparent !important; }
          .hierarchy-container .ant-tree .ant-tree-node-selected { background-color: rgba(22, 119, 255, 0.04) !important; color: #1677ff !important; }
          .hierarchy-container .ant-tree-switcher { display: flex !important; align-items: center !important; justify-content: center !important; }
          
          /* Force removal of any inherited shadows or hover effects if specified elsewhere */
          * { box-shadow: none !important; }
          .grade-card-hover:hover, .org-node:hover { transform: none !important; background: transparent !important; }
        `}} />
      </MainLayout>
    </ProtectedRoute>
  );
}
