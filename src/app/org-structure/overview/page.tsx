"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  Card,
  Typography,
  Space,
  Tabs,
  Tag,
  notification,
  Row,
  Col,
  Spin,
  Tree,
} from "antd";
import { useRouter, usePathname } from "next/navigation";
import { useGrades } from "@/hooks/useGrades";
import { usePositions } from "@/hooks/usePositions";
import {
  BankOutlined,
  ClusterOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

export default function OverviewPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading: authLoading } = useAuth();
  const { canReadOrg } = usePermission();
  const [api, contextHolder] = notification.useNotification();
  const [activeStep, setActiveStep] = useState<string | null>(null);

  // Protect route - requires org.read permission
  useEffect(() => {
    if (!authLoading && !canReadOrg) {
      router.push('/dashboard');
    }
  }, [authLoading, canReadOrg, router]);

  // Show loading while auth is being checked
  if (authLoading) {
    return null;
  }

  // Don't render if no read permission
  if (!canReadOrg) {
    return null;
  }

  const { dataSource: grades, loading: gradesLoading } = useGrades();
  const { dataSource: positions, loading: positionsLoading } = usePositions();

  useEffect(() => {
    if (grades.length > 0) {
      const isValid = activeStep
        ? grades.some((g) => g.key === activeStep)
        : false;
      if (!activeStep || !isValid) {
        setActiveStep(grades[0].key);
      }
    }
  }, [grades, activeStep]);

  const getGradeStats = (gradeId: string) => {
    const gradePositions = positions.filter((p) => p.gradeId === gradeId);
    const deptIds = new Set(
      gradePositions.map((p) => p.departmentId).filter(Boolean),
    );
    const subDeptIds = new Set(
      gradePositions.map((p) => p.subDepartmentId).filter(Boolean),
    );
    return {
      positions: gradePositions.length,
      departments: deptIds.size,
      subDepartments: subDeptIds.size,
    };
  };

  const selectedGrade = grades.find((g) => g.key === activeStep);

  const treeData = useMemo(() => {
    if (!selectedGrade) return [];

    const showPositions = true;
    const showSubDepts = true;
    const showDepts = true;

    const gradePositions = positions.filter(
      (p) => p.gradeId === selectedGrade.key,
    );

    // Group by Dept
    const deptMap = new Map<
      string,
      {
        id: string;
        name: string;
        positions: any[];
        subDepts: Map<string, { name: string; positions: any[] }>;
      }
    >();

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

    const deptNodes = showDepts
      ? Array.from(deptMap.values()).map((d) => {
          const subDeptNodes = showSubDepts
            ? Array.from(d.subDepts.entries()).map(([sdId, sdData]) => {
                return {
                  title: (
                    <div style={{ padding: "10px 0" }}>
                      <Space>
                        <ClusterOutlined />
                        <Text>{sdData.name}</Text>
                        <Tag color="orange">Sub-Department</Tag>
                      </Space>
                    </div>
                  ),
                  key: `sd-${sdId}-${d.id}`,
                  children: showPositions
                    ? sdData.positions.map((p) => ({
                        title: (
                          <div style={{ padding: "10px 0" }}>
                            <Space>
                              <UserOutlined />
                              <Text style={{ fontSize: 16, fontWeight: 500 }}>
                                {p.title}
                              </Text>
                              <Tag color="magenta">Position</Tag>
                            </Space>
                          </div>
                        ),
                        key: `pos-${p.id}`,
                        isLeaf: true,
                      }))
                    : [],
                };
              })
            : [];

          const directPosNodes = showPositions
            ? d.positions.map((p) => ({
                title: (
                  <div style={{ padding: "10px 0" }}>
                    <Space>
                      <UserOutlined />
                      <Text style={{ fontSize: 16, fontWeight: 500 }}>
                        {p.title}
                      </Text>
                      <Tag color="magenta">Position</Tag>
                    </Space>
                  </div>
                ),
                key: `pos-${p.id}`,
                isLeaf: true,
              }))
            : [];

          return {
            title: (
              <div style={{ padding: "10px 0" }}>
                <Space>
                  <BankOutlined />
                  <Text strong>{d.name}</Text>
                  <Tag color="cyan">Department</Tag>
                </Space>
              </div>
            ),
            key: `dept-${d.id}`,
            children: [...subDeptNodes, ...directPosNodes],
          };
        })
      : [];

    return [
      {
        title: (
          <div style={{ padding: "10px 0" }}>
            <Space>
              <SafetyCertificateOutlined />
              <Text strong style={{ fontSize: 18 }}>
                {selectedGrade.name} ({selectedGrade.code})
              </Text>
              <Tag color="blue"> Grade</Tag>
            </Space>
          </div>
        ),
        key: `grade-${selectedGrade.key}`,
        children: deptNodes,
      },
    ];
  }, [selectedGrade, positions]);

  const handleTabChange = (key: string) => {
    router.push(key);
  };

  const treeKey = useMemo(() => {
    if (!selectedGrade) return "no-grade";
    const gradePositionsCount = positions.filter(
      (p) => p.gradeId === selectedGrade.key,
    ).length;
    return `${selectedGrade.key}-${gradePositionsCount}`;
  }, [selectedGrade, positions]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <style>{`
          .thin-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .thin-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .thin-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.15);
            border-radius: 10px;
          }
        `}</style>
        {contextHolder}
        <div style={{ padding: 24 }}>
          <Tabs
            activeKey={pathname}
            onChange={handleTabChange}
            items={[
              { key: "/org-structure/overview", label: "Overview" },
              { key: "/org-structure/grades", label: "Grades" },
              {
                key: "/org-structure/employment-types",
                label: "Employment Types",
              },
              { key: "/org-structure/departments", label: "Departments" },
              {
                key: "/org-structure/sub-departments",
                label: "Sub-Departments",
              },
              { key: "/org-structure/positions", label: "Positions" },
            ]}
          />
            <Row gutter={16} style={{ marginTop: 10 }}>
              {/* LEFT SIDE */}
              <Col
                span={8}
                className="thin-scrollbar"
                style={{
                  height: "calc(100vh - 180px)",
                  overflowY: "auto",
                  paddingRight: "10px",
                }}
              >
                <Space direction="vertical" size={14} style={{ width: "100%" }}>
                  {gradesLoading || positionsLoading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <Card
                          key={i}
                          loading
                          style={{
                            borderRadius: 14,
                            width: "100%",
                          }}
                        />
                      ))
                    : grades.map((item, i) => {
                    const active = activeStep === item.key;
                    const stats = getGradeStats(item.key);

                    return (
                      <Card
                        key={item.key}
                        hoverable
                        onClick={() => setActiveStep(item.key)}
                        bodyStyle={{ padding: 14 }}
                        style={{
                          cursor: "pointer",
                          borderRadius: 14,
                          border: active
                            ? "2px solid #1677ff"
                            : "1px solid #f0f0f0",
                          background: active
                            ? "linear-gradient(135deg,#e6f4ff,#ffffff)"
                            : "#ffffff",
                          boxShadow: active
                            ? "0 8px 22px rgba(0,0,0,0.08)"
                            : "0 3px 10px rgba(0,0,0,0.04)",
                          transition: "all 0.25s ease",
                          width: "100%",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 12,
                          }}
                        >
                          <div>
                            <Title level={5} style={{ margin: 0 }}>
                              {item.name}
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Code: {item.code}
                            </Text>
                          </div>
                          <Tag
                            color={item.status === "Active" ? "green" : "red"}
                          >
                            {item.status}
                          </Tag>
                        </div>

                        <div style={{ marginTop: 8 }}>
                          <Tag color="blue" style={{ borderRadius: 12 }}>
                            Total Depts: {stats.departments}
                          </Tag>
                          <Tag color="cyan" style={{ borderRadius: 12 }}>
                            Total Sub-Depts: {stats.subDepartments}
                          </Tag>
                          <Tag color="purple" style={{ borderRadius: 12 }}>
                            Total Positions: {stats.positions}
                          </Tag>
                        </div>
                      </Card>
                    );
                  })}
                </Space>
              </Col>

              {/* RIGHT SIDE */}
              <Col span={16}>
                <Card
                  loading={gradesLoading || positionsLoading}
                  style={{
                    borderRadius: 18,
                    height: "calc(100vh - 180px)",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
                    background: "linear-gradient(180deg,#ffffff,#fafcff)",
                    border: "1px solid #f0f0f0",
                  }}
                  bodyStyle={{ padding: 20, height: "100%", display: "flex", flexDirection: "column" }}
                >
                  {selectedGrade ? (
                    <>
                      {/* ✅ Header */}
                      <div
                        style={{
                          display: "flex",
                         // justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 16,
                        }}
                      >
                        <Space size={10}>
                          <SafetyCertificateOutlined
                            style={{ fontSize: 20, color: "#1677ff" }}
                          />
                          <Title level={4} style={{ margin: 0 }}>
                            Org Structure Model
                          </Title>
                        </Space>
                        <Tag
                          color="blue"
                          style={{ borderRadius: 12,left:10}}
                        >
                           {selectedGrade.code} - {selectedGrade.name}
                        </Tag>

                      {/* ✅ Legend */}
                     <div style={{ marginLeft: "auto" }}>
                        <Tag icon={<BankOutlined />} color="green">
                          Department
                        </Tag>
                        <Tag icon={<ClusterOutlined />} color="orange">
                          Sub-Department
                        </Tag>
                        <Tag icon={<UserOutlined />} color="purple">
                          Position
                        </Tag>
                        </div>
                      </div>

                      {/* ✅ Tree Container */}
                      <div
                        className="thin-scrollbar"
                        style={{
                          marginTop: 12,
                          padding: 16,
                          borderRadius: 14,
                          background: "#ffffff",
                          border: "1px solid #f0f0f0",
                          boxShadow: "inset 0 0 0 1px #fafafa",
                          flex: 1,
                          overflowY: "auto",
                        }}
                      >
                        <Tree
                          key={treeKey}
                          showLine
                          defaultExpandAll
                          treeData={treeData}
                        />
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        gap: 12,
                      }}
                    >
                      <SafetyCertificateOutlined
                        style={{ fontSize: 42, color: "#d9d9d9" }}
                      />
                      <Text type="secondary">
                        Select a grade from the left panel
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
