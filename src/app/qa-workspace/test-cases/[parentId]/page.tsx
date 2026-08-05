"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Dropdown, message, Drawer, Input, Select, Breadcrumb, Row, Col, Typography, Form } from "antd";
import { PlusOutlined, EllipsisOutlined, ArrowLeftOutlined, SaveOutlined, InfoCircleOutlined, FileTextOutlined, BugOutlined, CheckCircleOutlined, LinkOutlined, SnippetsOutlined, CloseOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useParams } from "next/navigation";
import { Target, Trash2, Pencil, Folder, ShieldCheck, User, Zap, Activity, Layers } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

const { TextArea } = Input;

export default function ParentTestCaseDetailsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestCaseDetails" });

  const router = useRouter();
  const params = useParams();
  const parentId = params?.parentId as string;

  const [parentData, setParentData] = useState<any>(null);
  const [childCases, setChildCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suitesDrawerOpen, setSuitesDrawerOpen] = useState(false);
  const [selectedCaseForSuites, setSelectedCaseForSuites] = useState<any>(null);

  // Drawer state for Create / Edit Child Test Case
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newStepInput, setNewStepInput] = useState("");
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    preconditions: string;
    steps_to_reproduce: string[];
    expected_result: string;
    priority: string;
    severity: string;
    test_type?: string;
    automation: string;
    status: string;
  }>({
    name: "",
    description: "",
    preconditions: "",
    steps_to_reproduce: [],
    expected_result: "",
    priority: "Medium",
    severity: "Major",
    test_type: undefined,
    automation: "Manual",
    status: "Active"
  });

  const { canReadCase, canCreateCase } = usePermission();

  const parseSteps = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {}
    if (typeof val === "string") {
      return val
        .split("\n")
        .map((s) => s.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
    }
    return [];
  };

  const fetchData = async () => {
    if (!parentId) return;
    try {
      setLoading(true);
      const [parentRes, childRes] = await Promise.all([
        axios.get(`/api/v2/qa/parents/${parentId}`),
        axios.get(`/api/v2/qa?parent_id=${parentId}`)
      ]);
      setParentData(parentRes?.data?.data || parentRes?.data || parentRes || null);
      setChildCases(Array.isArray(childRes) ? childRes : (childRes?.data?.data || childRes?.data || []));
    } catch (error) {
      message.error("Failed to load test scenario details");
      router.push("/qa-workspace/test-cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadCase && parentId) {
      fetchData();
    }
  }, [canReadCase, parentId]);

  const handleOpenCreateDrawer = () => {
    setEditingCaseId(null);
    setNewStepInput("");
    setFormData({
      name: "",
      description: "",
      preconditions: "",
      steps_to_reproduce: [],
      expected_result: "",
      priority: "Medium",
      severity: "Major",
      test_type: undefined,
      automation: parentData?.automation || "Manual",
      status: "Active"
    });
    setDrawerOpen(true);
  };

  const handleOpenEditDrawer = (record: any) => {
    setEditingCaseId(record.id);
    setNewStepInput("");
    setFormData({
      name: record.name || "",
      description: record.description || "",
      preconditions: record.preconditions || "",
      steps_to_reproduce: parseSteps(record.steps_to_reproduce),
      expected_result: record.expected_result || "",
      priority: record.priority || "Medium",
      severity: record.severity || "Major",
      test_type: record.test_type || undefined,
      automation: record.automation || "Manual",
      status: record.status || "Active"
    });
    setDrawerOpen(true);
  };

  const handleSaveChildCase = async (addAnother: boolean = false) => {
    if (!formData.name.trim()) {
      message.error("Please enter a Test Case Name");
      return;
    }
    try {
      setSubmitting(true);
      const finalSteps = [...(formData.steps_to_reproduce || [])];
      if (newStepInput.trim()) {
        finalSteps.push(newStepInput.trim());
        setNewStepInput("");
      }
      const payload = {
        ...formData,
        steps_to_reproduce: JSON.stringify(finalSteps),
        parent_test_case_id: parentId,
        module_id: parentData?.module_id || null,
        feature: parentData?.feature || null
      };

      if (editingCaseId) {
        await axios.put(`/api/v2/qa/${editingCaseId}`, payload);
        message.success("Test case updated successfully!");
        setDrawerOpen(false);
      } else {
        await axios.post(`/api/v2/qa`, payload);
        message.success("Module Test Case created successfully!");
        if (addAnother) {
          setNewStepInput("");
          // Reset form for next entry without closing drawer or losing context
          setFormData({
            name: "",
            description: "",
            preconditions: "",
            steps_to_reproduce: [],
            expected_result: "",
            priority: "Medium",
            severity: "Major",
            test_type: undefined,
            automation: parentData?.automation || "Manual",
            status: "Active"
          });
        } else {
          setDrawerOpen(false);
        }
      }
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to save test case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChild = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/v2/qa/${id}`);
      message.success("Test case deleted successfully");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to delete test case");
    }
  };


  const childColumns = [
    {
      title: "Test Case Name",
      dataIndex: "name",
      key: "name",
      render: (t: string, record: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <strong style={{ color: "var(--text-slate-900)", fontSize: 14.5, cursor: "pointer", transition: "color 0.15s" }} onClick={() => handleOpenEditDrawer(record)}>
            {t}
          </strong>
          {record.expected_result && (
            <span style={{ fontSize: 12, color: "var(--text-slate-500)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              <span style={{ fontWeight: 600, color: "#10b981" }}>Expected:</span> {record.expected_result}
            </span>
          )}
        </div>
      )
    },
    {
      title: "Test Type",
      dataIndex: "test_type",
      key: "test_type",
      width: 130,
      render: (t: string) => <span style={{ color: "var(--text-slate-700)", fontWeight: 500 }}>{t || 'Functional'}</span>
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 110,
      render: (t: string) => <Tag color={t === 'Critical' ? 'red' : t === 'High' ? 'orange' : t === 'Medium' ? 'blue' : 'default'} style={{ fontWeight: 600 }}>{t || 'Medium'}</Tag>
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 110,
      render: (t: string) => <Tag style={{ fontWeight: 500 }}>{t || 'Major'}</Tag>
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (t: string) => <Tag color={t === 'Active' ? 'green' : t === 'Deprecated' ? 'red' : 'default'} style={{ fontWeight: 600 }}>{t || 'Active'}</Tag>
    },
    {
      title: "Linked Suites",
      dataIndex: "suite_count",
      key: "suite_count",
      width: 140,
      render: (_: any, record: any) => {
        const count = record.test_suites?.length || record.suite_count || 0;
        return (
          <Tag
            color="purple"
            style={{ cursor: "pointer", fontWeight: 600, padding: "2px 10px", display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCaseForSuites(record);
              setSuitesDrawerOpen(true);
            }}
            title="Click to view linked Test Suites"
          >
            <LinkOutlined style={{ fontSize: 12 }} />
            <span>{count}</span>
          </Tag>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      width: 90,
      align: "center" as const,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
          <Button
            type="text"
            size="small"
            icon={<Pencil size={15} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditDrawer(record);
            }}
            style={{ color: "var(--text-slate-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            title="Edit Case"
          />
          <ConfirmDialog
            tone="danger"
            title="Delete Module Test Case?"
            description={`Are you sure you want to delete "${record.name}" (${record.test_case_id})?`}
            confirmText="Delete"
            onConfirm={() => handleDeleteChild(record.id)}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 size={15} />}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title="Delete Case"
            />
          </ConfirmDialog>
        </div>
      )
    }
  ];

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: `
        .dh-shell { display: flex; height: calc(100vh - 64px); background: transparent; overflow: hidden; position: relative; }
        .dh-sidebar { width: 240px; background: transparent; border-right: 1px solid var(--border-slate-200); display: flex; flex-direction: column; z-index: 10; flex-shrink: 0; }
        .dh-sidebar-top { padding: 18px 14px 10px; flex-shrink: 0; }
        .pp-side-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .pp-side-logo { width: 34px; height: 34px; border-radius: 8px; background: var(--bg-blue-50, rgba(59,130,246,0.1)); color: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .pp-side-title { font-size: 15px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; margin: 0; }
        .pp-side-subtitle { font-size: 11.5px; color: var(--text-slate-500); font-weight: 500; margin: 0; }
        .dh-sidebar-scroll { flex: 1; overflow-y: auto; padding: 0 14px 20px; }
        .pp-nav-item {
          display: flex; align-items: center; gap: 10px; width: 100%; height: 36px; padding: 0 12px;
          border-radius: 6px; border: none; background: transparent; color: var(--text-slate-600);
          font-size: 13px; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.15s ease;
          margin-bottom: 4px;
        }
        .pp-nav-item:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .pp-nav-item.is-active { background: var(--bg-blue-50, rgba(59,130,246,0.1)); color: #3B82F6; font-weight: 600; }

        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar { height: auto; min-height: 64px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 24px; background: transparent; }

        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
          padding: 12px 16px !important;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 12px 16px !important;
        }
        .ts-table, .ts-table .ant-table, .ts-table .ant-table-container {
          background: transparent !important;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr:hover > td {
          background: rgba(59, 130, 246, 0.04) !important;
        }

        .form-label { display: block; font-weight: 600; font-size: 13px; color: var(--text-slate-800); margin-bottom: 6px; }

        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0 !important; min-width: 236px;
          overflow: hidden !important;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 7px 9px !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; }
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

        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu {
          background: #0B0F1A !important;
          border-radius: 0 !important;
          overflow: hidden !important;
          border: 1px solid #1E293B !important;
        }
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item:hover {
          background: #161B22 !important;
        }
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item-divider {
          background: #1E293B !important;
        }
        [data-theme='dark'] .pp-menu-title {
          color: #cbd5e1 !important;
        }
        [data-theme='dark'] .pp-menu-desc {
          color: #64748b !important;
        }
        ${formStyles}
        `}} />

      <div className="dh-shell">
        <aside className="dh-sidebar">
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo">
                <BugOutlined />
              </div>
              <div>
                <h1 className="pp-side-title">Cases</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateCase && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreateDrawer}
                block
                style={{ marginTop: 16, borderRadius: 8, fontWeight: 500, height: 38 }}
              >
                Create Module Case
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll">
            <button className="pp-nav-item is-active">
              <FileTextOutlined style={{ fontSize: 15 }} /> Module Test Cases
            </button>

            {/* Parent Scenario Details Side Panel */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-slate-400, #94a3b8)' }}>
                  Scenario Details
                </span>
                {parentData?.status && (
                  <Tag color={parentData.status === 'Ready' || parentData.status === 'Active' ? 'success' : parentData.status === 'Deprecated' ? 'error' : 'processing'} style={{ fontSize: 11, fontWeight: 600, margin: 0 }}>
                    {parentData.status}
                  </Tag>
                )}
              </div>

              {/* Title / Scenario Name */}
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary, #f8fafc)', marginBottom: 16, lineHeight: 1.4, wordBreak: 'break-word' }}>
                {parentData?.title || "—"}
              </div>

              {/* Metadata Key-Value List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-slate-400, #94a3b8)', fontWeight: 500 }}>Module</span>
                  <Tag color="blue" style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
                    {parentData?.module_name || "Unassigned"}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-slate-400, #94a3b8)', fontWeight: 500 }}>Feature</span>
                  <span style={{ color: 'var(--text-primary, #f1f5f9)', fontWeight: 600, textAlign: 'right' }}>
                    {parentData?.feature || "—"}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-slate-400, #94a3b8)', fontWeight: 500 }}>Automation</span>
                  <Tag color={parentData?.automation === 'Automated' ? 'purple' : 'default'} style={{ margin: 0, fontWeight: 600 }}>
                    {parentData?.automation || "Manual"}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-slate-400, #94a3b8)', fontWeight: 500 }}>Owner</span>
                  <span style={{ color: 'var(--text-primary, #f1f5f9)', fontWeight: 600, textAlign: 'right' }}>
                    {parentData?.owner_name || parentData?.qa_owner || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="dh-main">
          {/* Topbar with scenario title & back button */}
          <div className="dh-main-topbar">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => router.push("/qa-workspace/test-cases")} style={{ marginRight: 2 }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  {parentData?.title || "Loading Scenario..."}
                </span>
                {parentData?.status && (
                  <Tag color={parentData.status === 'Ready' || parentData.status === 'Active' ? 'green' : 'blue'} style={{ fontSize: 11, fontWeight: 700, margin: 0 }}>
                    {parentData.status}
                  </Tag>
                )}
              </div>
              <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginLeft: 34 }}>
                Module test executions and structured steps under this Business Scenario
              </span>
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Module Cases", value: childCases.length, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", icon: <FileTextOutlined style={{ fontSize: 15 }} /> },
                { label: "Active Cases", value: childCases.filter(t => t.status === 'Active' || t.status === 'Ready').length, color: "#10b981", tint: "rgba(16,185,129,0.10)", icon: <CheckCircleOutlined style={{ fontSize: 15 }} /> },
                { label: "Automated Cases", value: childCases.filter(t => t.automation === 'Automated').length, color: "#8b5cf6", tint: "rgba(139,92,246,0.10)", icon: <BugOutlined style={{ fontSize: 15 }} /> },
                { label: "High/Critical Priority", value: childCases.filter(t => t.priority === 'High' || t.priority === 'Critical').length, color: "#ef4444", tint: "rgba(239,68,68,0.10)", icon: <Zap style={{ width: 15, height: 15 }} /> }
              ].map((stat) => (
                <div key={stat.label} style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', padding: '14px 18px', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 0, background: stat.tint, color: stat.color }}>{stat.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-500)' }}>{stat.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1 }}>{stat.value}</span>
                    </div>
                    <div style={{ width: 60, height: 3, background: stat.color, borderRadius: 2, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Module Test Cases Table Section (Border radius 0px) */}
            <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: '0px', overflow: 'hidden' }}>
              <Table
                className="ts-table"
                dataSource={childCases}
                columns={childColumns}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                  onClick: () => handleOpenEditDrawer(record),
                  style: { cursor: 'pointer', background: 'transparent' }
                })}
                locale={{
                  emptyText: (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                      <div style={{ fontSize: 40, color: 'var(--text-slate-300)', marginBottom: 12 }}><FileTextOutlined /></div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-700)', margin: 0 }}>No module test cases added yet</h3>
                      <p style={{ color: 'var(--text-slate-400)', fontSize: 13, maxWidth: 380, margin: '8px auto 20px' }}>
                        Click "Create Module Case" in the sidebar to add specific testing instructions, steps, and expected behaviors for this scenario.
                      </p>
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateDrawer} style={{ borderRadius: 8 }}>
                        Create First Module Test Case
                      </Button>
                    </div>
                  )
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Module Test Case Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-primary, #ffffff)" }}>
          {/* Drawer Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  background: "rgba(37, 99, 235, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  flexShrink: 0,
                  fontSize: 20,
                }}
              >
                <BugOutlined />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary, var(--text-slate-900))",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {editingCaseId ? "Edit Module Test Case" : "New Module Test Case"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary, var(--text-slate-500))", fontWeight: 500, marginTop: 2 }}>
                  {editingCaseId ? "Modify module test case details & steps" : "Add specific testing instructions, steps, and expected behaviors"}
                </div>
              </div>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => setDrawerOpen(false)}
              style={{ color: "var(--text-slate-500)" }}
            />
          </div>

          {/* Drawer Body */}
          <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
            <Form layout="vertical" className="customer-drawer-form">
              {/* STEP 1: Basic Information */}
              <SectionCard
                step="STEP 1"
                icon={<InfoCircleOutlined />}
                title="Basic Information"
                subtitle="Test case name, module, priority, and severity"
              >

                <Form.Item label="Module" style={{ marginTop: -10, marginBottom: 16 }}>
                  <Input
                    value={parentData?.module_name || "Unassigned"}
                    disabled
                    readOnly
                    size="large"
                    style={{ borderRadius: 6, cursor: "not-allowed", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 600 }}
                  />
                </Form.Item>

                <Form.Item label="Test Case Name" required style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="e.g., Verify successful login with valid credentials"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    size="large"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Priority" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Low", label: "Low" },
                          { value: "Medium", label: "Medium" },
                          { value: "High", label: "High" },
                          { value: "Critical", label: "Critical" },
                        ]}
                        value={formData.priority}
                        onChange={(val: any) => setFormData({ ...formData, priority: val })}
                        placeholder="Select Priority"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item label="Severity" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Blocker", label: "Blocker" },
                          { value: "Critical", label: "Critical" },
                          { value: "Major", label: "Major" },
                          { value: "Minor", label: "Minor" },
                          { value: "Trivial", label: "Trivial" },
                        ]}
                        value={formData.severity}
                        onChange={(val: any) => setFormData({ ...formData, severity: val })}
                        placeholder="Select Severity"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item label="Status" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Draft", label: "Draft" },
                          { value: "Active", label: "Active" },
                          { value: "Deprecated", label: "Deprecated" },
                        ]}
                        value={formData.status}
                        onChange={(val: any) => setFormData({ ...formData, status: val })}
                        placeholder="Select Status"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Test Type" style={{ marginBottom: 0 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Functional", label: "Functional" },
                          { value: "Regression", label: "Regression" },
                          { value: "Integration", label: "Integration" },
                          { value: "Smoke", label: "Smoke" },
                          { value: "Performance", label: "Performance" },
                          { value: "Security", label: "Security" },
                        ]}
                        value={formData.test_type || undefined}
                        onChange={(val: any) => setFormData({ ...formData, test_type: val })}
                        placeholder="Select Test Type"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Automation" style={{ marginBottom: 0 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Manual", label: "Manual" },
                          { value: "Automated", label: "Automated" },
                        ]}
                        value={formData.automation}
                        onChange={(val: any) => setFormData({ ...formData, automation: val })}
                        placeholder="Select Automation"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              {/* STEP 2: Execution & Steps */}
              <SectionCard
                step="STEP 2"
                icon={<SnippetsOutlined />}
                title="Execution & Steps"
                subtitle="Preconditions, steps to reproduce, and expected results"
              >
                <Form.Item label="Preconditions" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={2}
                    placeholder="State any setup required before testing (e.g., User must be logged out, Test user created with Admin role)..."
                    value={formData.preconditions}
                    onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Form.Item label="Steps to Reproduce" style={{ marginBottom: 16 }}>
                  <div style={{ border: '1px solid var(--border-slate-300, #cbd5e1)', borderRadius: 8, padding: '12px 14px', background: 'var(--bg-pure-white, #ffffff)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(formData.steps_to_reproduce || []).map((step: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontSize: 13, color: 'var(--text-slate-800)', flex: 1, wordBreak: 'break-word' }}>{step}</span>
                          <Button
                            type="text"
                            size="small"
                            danger
                            style={{ padding: '0 6px', fontSize: 15, lineHeight: 1, opacity: 0.8 }}
                            onClick={() => {
                              const updated = [...(formData.steps_to_reproduce || [])];
                              updated.splice(idx, 1);
                              setFormData({ ...formData, steps_to_reproduce: updated });
                            }}
                          >×</Button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: (formData.steps_to_reproduce || []).length > 0 ? 4 : 0, paddingTop: (formData.steps_to_reproduce || []).length > 0 ? 8 : 0, borderTop: (formData.steps_to_reproduce || []).length > 0 ? '1px dashed var(--border-slate-300, #cbd5e1)' : 'none' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                          +
                        </div>
                        <Input
                          placeholder="Type a step to reproduce and press Enter..."
                          value={newStepInput}
                          onChange={(e) => setNewStepInput(e.target.value)}
                          onPressEnter={(e) => {
                            e.preventDefault();
                            if (newStepInput.trim()) {
                              setFormData({ ...formData, steps_to_reproduce: [...(formData.steps_to_reproduce || []), newStepInput.trim()] });
                              setNewStepInput('');
                            }
                          }}
                          style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 0', fontSize: 13 }}
                          variant="borderless"
                        />
                        <Button
                          type="primary"
                          size="small"
                          style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#3b82f6' }}
                          onClick={() => {
                            if (newStepInput.trim()) {
                              setFormData({ ...formData, steps_to_reproduce: [...(formData.steps_to_reproduce || []), newStepInput.trim()] });
                              setNewStepInput('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form.Item>

                <Form.Item label="Expected Result" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={3}
                    placeholder="Describe clearly what should happen when steps are executed (e.g., User is redirected to dashboard with success message)..."
                    value={formData.expected_result}
                    onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Form.Item label="Additional Description / Notes" style={{ marginBottom: 0 }}>
                  <TextArea
                    rows={2}
                    placeholder="Optional background info, tickets, or references..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </SectionCard>
            </Form>
          </div>

          {/* Drawer Footer */}
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              bottom: 0,
              background: "var(--bg-primary, #fff)",
              zIndex: 10,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-slate-400)", fontWeight: 500 }}>
              {editingCaseId ? "Changes take effect immediately" : "Fill required fields to save test case"}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={() => setDrawerOpen(false)} style={{ borderRadius: 8, fontWeight: 600, padding: "0 18px", height: 36 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveChildCase(false)}
                loading={submitting && !editingCaseId}
                style={{ borderRadius: 8, fontWeight: 600, padding: "0 20px", height: 36, background: "#2563eb", borderColor: "#2563eb" }}
              >
                Save & Close
              </Button>
              {!editingCaseId && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleSaveChildCase(true)}
                  loading={submitting}
                  style={{ borderRadius: 8, fontWeight: 600, padding: "0 20px", height: 36, background: "#10b981", borderColor: "#10b981" }}
                >
                  Save & Add Another
                </Button>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Linked Suites Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={20} color="#3b82f6" />
            <span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Associated Test Suites</span>
          </div>
        }
        open={suitesDrawerOpen}
        onClose={() => {
          setSuitesDrawerOpen(false);
          setSelectedCaseForSuites(null);
        }}
        width={500}
        styles={{
          header: { borderBottom: '1px solid var(--border-slate-200)', padding: '16px 24px' },
          body: { padding: '20px 24px', background: 'var(--bg-pure-white)' }
        }}
      >
        {selectedCaseForSuites && (
          <div>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 14 }}>
              Test Case <strong style={{ color: 'var(--text-slate-900)' }}>{selectedCaseForSuites.name}</strong> is linked to the following test suites:
            </Typography.Paragraph>

            {(!selectedCaseForSuites.test_suites || selectedCaseForSuites.test_suites.length === 0) ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-slate-400)', border: '1px dashed var(--border-slate-200)', borderRadius: 8 }}>
                No test suites are currently linked to this test case.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {selectedCaseForSuites.test_suites.map((suite: any) => (
                  <div
                    key={suite.id}
                    style={{
                      border: '1px solid var(--border-slate-200)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onClick={() => router.push(`/qa-workspace/test-suites/${suite.id}`)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SnippetsOutlined style={{ fontSize: 18 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-slate-900)', fontSize: 15 }}>{suite.suite_name || 'Unnamed Suite'}</span>
                        <span style={{ color: 'var(--text-slate-500)', fontSize: 13 }}>{suite.description || 'No description provided'}</span>
                      </div>
                    </div>
                    <Tag color="blue" style={{ margin: 0 }}>View Suite</Tag>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Drawer>
    </MainLayout>
  );
}
