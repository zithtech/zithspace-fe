"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Input, Select, Checkbox, Typography, message, Drawer, Form } from "antd";
import { PlusOutlined, ArrowLeftOutlined, SearchOutlined, SnippetsOutlined, FileTextOutlined, CheckCircleOutlined, BugOutlined, CloseOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useParams } from "next/navigation";
import { Layers, Zap, Pencil, Trash2 } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

const { Text } = Typography;

export default function TestSuiteDetailsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestSuiteDetails" });

  const router = useRouter();
  const params = useParams();
  const suiteId = params?.suiteId as string;

  const [suite, setSuite] = useState<any>(null);
  const [parents, setParents] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States for Add / Manage Test Cases in Suite
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({ test_case_ids: [], parent_test_case_id: undefined });
  const [childTestCases, setChildTestCases] = useState<any[]>([]);
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  const { canReadSuite, canUpdateSuite } = usePermission();

  const fetchSuiteData = async () => {
    if (!suiteId) return;
    try {
      setLoading(true);
      const [suiteRes, parentsRes, modRes] = await Promise.all([
        axios.get(`/api/v2/qa/suites/${suiteId}`),
        axios.get("/api/v2/qa/parents"),
        axios.get("/api/v2/qa/modules")
      ]);
      
      const suiteData = suiteRes?.data || suiteRes || null;
      setSuite(suiteData);

      setParents(Array.isArray(parentsRes) ? parentsRes : (parentsRes?.data?.data || parentsRes?.data || []));
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
    } catch (error) {
      message.error("Failed to fetch test suite details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadSuite && suiteId) {
      fetchSuiteData();
    }
  }, [canReadSuite, suiteId]);

  // Fetch child test cases when parent_test_case_id or module_id is selected inside modal
  useEffect(() => {
    const fetchCases = async () => {
      if (formData.parent_test_case_id) {
        try {
          const res: any = await axios.get(`/api/v2/qa?parent_id=${formData.parent_test_case_id}`);
          const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
          setChildTestCases(list);
        } catch (e) {
          message.error("Failed to fetch child test cases for scenario");
        }
      } else if (formData.module_id) {
        try {
          const res: any = await axios.get(`/api/v2/qa?module_id=${formData.module_id}`);
          const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
          setChildTestCases(list);
        } catch (e) {
          message.error("Failed to fetch test cases for module");
        }
      } else {
        setChildTestCases([]);
      }
    };
    if (modalOpen) {
      fetchCases();
    }
  }, [formData.parent_test_case_id, formData.module_id, modalOpen]);

  const openEditModal = () => {
    setCaseSearchTerm("");
    if (suite) {
      setFormData({
        ...suite,
        parent_test_case_id: suite.parent_test_case_id || undefined,
        module_id: suite.module_id,
        test_case_ids: suite.test_cases?.map((tc: any) => tc.id) || []
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCaseSearchTerm("");
  };

  const handleSaveSuite = async () => {
    try {
      if (!formData.suite_name) return message.error("Suite Name is required");
      if (!formData.parent_test_case_id && !formData.module_id) return message.error("Parent Business Scenario is required");

      let chosenModuleId = formData.module_id;
      if (formData.parent_test_case_id) {
        const p = parents.find(x => x.id === formData.parent_test_case_id);
        if (p && p.module_id) chosenModuleId = p.module_id;
      }

      const payload = {
        ...formData,
        module_id: chosenModuleId
      };

      setSaving(true);
      await axios.put(`/api/v2/qa/suites/${suiteId}`, payload);
      message.success("Test Suite updated successfully");
      closeModal();
      fetchSuiteData();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Failed to update suite");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveCaseFromSuite = async (caseId: string) => {
    try {
      const remainingIds = (suite.test_cases || []).map((tc: any) => tc.id).filter((id: string) => id !== caseId);
      await axios.put(`/api/v2/qa/suites/${suiteId}`, {
        ...suite,
        test_case_ids: remainingIds
      });
      message.success("Test case removed from suite");
      fetchSuiteData();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Failed to remove test case");
    }
  };

  const linkedCases: any[] = suite?.test_cases || [];

  const unlinkedChildCases = useMemo(() => {
    const existingIds = new Set(linkedCases.map((tc: any) => tc.id));
    return childTestCases.filter((tc: any) => !existingIds.has(tc.id));
  }, [childTestCases, linkedCases]);

  const filteredModalCases = useMemo(() => {
    if (!caseSearchTerm) return unlinkedChildCases;
    const s = caseSearchTerm.toLowerCase();
    return unlinkedChildCases.filter(tc =>
      tc.name?.toLowerCase().includes(s) ||
      tc.test_case_id?.toLowerCase().includes(s)
    );
  }, [unlinkedChildCases, caseSearchTerm]);

  const newlySelectedCount = useMemo(() => {
    const existingIds = new Set(linkedCases.map((tc: any) => tc.id));
    return (formData.test_case_ids || []).filter((id: string) => !existingIds.has(id)).length;
  }, [formData.test_case_ids, linkedCases]);

  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      const existing = new Set(formData.test_case_ids || []);
      filteredModalCases.forEach(tc => existing.add(tc.id));
      setFormData({ ...formData, test_case_ids: Array.from(existing) });
    } else {
      const removed = new Set(filteredModalCases.map(tc => tc.id));
      const remaining = (formData.test_case_ids || []).filter((id: string) => !removed.has(id));
      setFormData({ ...formData, test_case_ids: remaining });
    }
  };

  const handleToggleCase = (id: string, checked: boolean) => {
    const existing = new Set(formData.test_case_ids || []);
    if (checked) {
      existing.add(id);
    } else {
      existing.delete(id);
    }
    setFormData({ ...formData, test_case_ids: Array.from(existing) });
  };

  const columns = [
    {
      title: "Test Case Name",
      dataIndex: "name",
      key: "name",
      render: (t: string, record: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <strong style={{ color: "var(--text-slate-900)", fontSize: 14.5 }}>
            {t || "Unnamed Case"}
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
      width: 140,
      render: (t: string) => <span style={{ color: "var(--text-slate-700)", fontWeight: 500 }}>{t || 'Functional'}</span>
    },
    {
      title: "Automation",
      dataIndex: "automation",
      key: "automation",
      width: 140,
      render: (t: string) => (
        <Tag color={t === 'Automated' ? 'purple' : 'default'} style={{ fontWeight: 600 }}>
          {t || 'Manual'}
        </Tag>
      )
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (t: string) => (
        <Tag color={t === 'Critical' ? 'red' : t === 'High' ? 'orange' : t === 'Medium' ? 'blue' : 'default'} style={{ fontWeight: 600 }}>
          {t || 'Medium'}
        </Tag>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (t: string) => (
        <Tag color={t === 'Active' || t === 'Ready' ? 'green' : t === 'Deprecated' ? 'red' : 'default'} style={{ fontWeight: 600 }}>
          {t || 'Active'}
        </Tag>
      )
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
              const targetId = record.parent_test_case_id || record.parent_id || suite?.parent_test_case_id || record.id;
              router.push(`/qa-workspace/test-cases/${targetId}`);
            }}
            style={{ color: "var(--text-slate-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            title="Edit Case"
          />
          <ConfirmDialog
            tone="danger"
            title="Remove from Suite?"
            description={`Are you sure you want to remove "${record.name || 'this case'}" from this test suite?`}
            confirmText="Remove"
            onConfirm={() => handleRemoveCaseFromSuite(record.id)}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 size={15} />}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title="Remove Case"
            />
          </ConfirmDialog>
        </div>
      )
    }
  ];

  const parentScenario = parents.find(p => p.id === suite?.parent_test_case_id);
  const moduleItem = modules.find(m => m.id === suite?.module_id);

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
        .dh-sidebar-scroll { flex: 1; overflow-y: auto; padding: 4px 14px 18px; display: flex; flex-direction: column; }
        .pp-nav-item { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px 12px; font-size: 13px; font-weight: 600; color: var(--text-slate-600); background: transparent; border: none; border-radius: 6px; text-align: left; cursor: pointer; transition: all 0.15s; margin-bottom: 2px; }
        .pp-nav-item:hover { background: var(--bg-slate-100, #f1f5f9); color: var(--text-slate-900); }
        .pp-nav-item.is-active { background: #3B82F6; color: #ffffff; }

        .dh-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: transparent; }
        .dh-main-topbar { height: 68px; padding: 0 24px; border-bottom: 1px solid var(--border-slate-200); display: flex; align-items: center; justify-content: space-between; background: transparent; flex-shrink: 0; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 24px; }

        .ts-table .ant-table {
          background: transparent !important;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-thead > tr > th {
          background: rgba(248, 250, 252, 0.6) !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
          color: var(--text-slate-400);
          letter-spacing: 0.04em;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-200) !important;
          padding: 12px 16px;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr:hover > td {
          background: rgba(59, 130, 246, 0.04) !important;
        }
      `}} />

      <div className="dh-shell">
        <aside className="dh-sidebar">
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo">
                <Layers />
              </div>
              <div>
                <h1 className="pp-side-title">Suites</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canUpdateSuite && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openEditModal}
                block
                style={{ marginTop: 16, borderRadius: 8, fontWeight: 500, height: 38 }}
              >
                Add Test Case
              </Button>
            )}
          </div>

          <div className="dh-sidebar-scroll">
            {/* Test Suite Details Side Panel */}
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-slate-400, #94a3b8)' }}>
                  Suite Details
                </span>
                <Tag color="blue" style={{ fontSize: 11, fontWeight: 600, margin: 0, borderRadius: 0 }}>
                  Suite
                </Tag>
              </div>

              {/* Suite Name */}
              <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary, #f8fafc)', marginBottom: 16, lineHeight: 1.4, wordBreak: 'break-word' }}>
                {suite?.suite_name || "Loading Suite..."}
              </div>

              {/* Metadata Key-Value List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-slate-400, #94a3b8)', fontWeight: 500 }}>Scenario</span>
                  <span style={{ color: 'var(--text-primary, #f1f5f9)', fontWeight: 600, textAlign: 'right', wordBreak: 'break-word' }}>
                    {suite?.parent_title || parentScenario?.title || "—"}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-slate-400, #94a3b8)', fontWeight: 500 }}>Module</span>
                  <Tag color="blue" style={{ fontSize: 12, fontWeight: 600, margin: 0, borderRadius: 0 }}>
                    {suite?.module_name || moduleItem?.module_name || "Unassigned"}
                  </Tag>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-slate-400, #94a3b8)', fontWeight: 500 }}>Linked Cases</span>
                  <Tag color="purple" style={{ fontSize: 12, fontWeight: 700, margin: 0, borderRadius: 0 }}>
                    {linkedCases.length} Cases
                  </Tag>
                </div>

                {suite?.description && (
                  <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px dashed var(--border-color, rgba(255, 255, 255, 0.08))' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-slate-400, #94a3b8)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                      Description
                    </span>
                    <p style={{ fontSize: 12.5, color: 'var(--text-slate-300, #cbd5e1)', margin: 0, lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {suite.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="dh-main">
          {/* Topbar */}
          <div className="dh-main-topbar">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => router.push("/qa-workspace/test-suites")} style={{ marginRight: 2 }} />
                <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  {suite?.suite_name || "Loading Suite..."}
                </span>
                <Tag color="purple" style={{ fontSize: 11, fontWeight: 700, margin: 0, borderRadius: 0 }}>
                  {linkedCases.length} Cases Linked
                </Tag>
              </div>
              <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginLeft: 34 }}>
                Review and execute test cases associated with this suite
              </span>
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Stats Cards (0px border-radius) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Linked Cases", value: linkedCases.length, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", icon: <FileTextOutlined style={{ fontSize: 15 }} /> },
                { label: "Active Cases", value: linkedCases.filter(t => t.status === 'Active' || t.status === 'Ready').length, color: "#10b981", tint: "rgba(16,185,129,0.10)", icon: <CheckCircleOutlined style={{ fontSize: 15 }} /> },
                { label: "Automated Cases", value: linkedCases.filter(t => t.automation === 'Automated').length, color: "#8b5cf6", tint: "rgba(139,92,246,0.10)", icon: <BugOutlined style={{ fontSize: 15 }} /> },
                { label: "High/Critical Priority", value: linkedCases.filter(t => t.priority === 'High' || t.priority === 'Critical').length, color: "#ef4444", tint: "rgba(239,68,68,0.10)", icon: <Zap style={{ width: 15, height: 15 }} /> }
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
                    <div style={{ width: 60, height: 3, background: stat.color, borderRadius: 0, opacity: 0.8 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Test Cases Table Section (Border radius 0px) */}
            <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 0, overflow: 'hidden' }}>
              <Table
                className="ts-table"
                dataSource={linkedCases}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 'max-content' }}
                locale={{
                  emptyText: (
                    <div style={{ padding: 48, textAlign: 'center' }}>
                      <div style={{ fontSize: 40, color: 'var(--text-slate-300)', marginBottom: 12 }}><FileTextOutlined /></div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-slate-700)', margin: 0 }}>No test cases linked to this suite yet</h3>
                      <p style={{ color: 'var(--text-slate-400)', fontSize: 13, maxWidth: 380, margin: '8px auto 20px' }}>
                        Click "Add Test Case" above to select and map test cases from the Business Scenario into this test suite.
                      </p>
                      <Button type="primary" icon={<PlusOutlined />} onClick={openEditModal} style={{ borderRadius: 8 }}>
                        Add Test Case
                      </Button>
                    </div>
                  )
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Add Test Case Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={modalOpen}
        onClose={closeModal}
      >
        <style>{formStyles}</style>

        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          {/* Drawer Header */}
          <div
            className="customer-drawer-header"
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-slate-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-pure-white)",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3b82f6",
                }}
              >
                <SnippetsOutlined style={{ fontSize: 20 }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)" }}>
                  Add Test Cases to Suite
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                  Select available test cases to link to this suite
                </span>
              </div>
            </div>

            <Button
              type="text"
              icon={<CloseOutlined style={{ fontSize: 16, color: "var(--text-slate-400)" }} />}
              onClick={closeModal}
              style={{ width: 32, height: 32, borderRadius: 16 }}
            />
          </div>

          {/* Drawer Body */}
          <div className="dh-sidebar-scroll" style={{ flex: 1, padding: "24px", overflowY: "auto", background: "var(--bg-slate-50)" }}>
            <Form layout="vertical" className="customer-drawer-form">
              <SectionCard
                step="STEP 1"
                icon={<FileTextOutlined />}
                title="Suite Information"
                subtitle="Review or update core details for this suite"
              >
                <Form.Item label="Suite Name" required style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="E.g. Smoke Test Suite"
                    value={formData.suite_name}
                    onChange={(e) => setFormData({ ...formData, suite_name: e.target.value })}
                    size="large"
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item label="Associated Test Case (Business Scenario)" required style={{ marginBottom: 16 }}>
                  <SearchableDropdown
                    options={parents.map((p: any) => ({
                      value: p.id,
                      label: `${p.title} (${p.module_name || "No Module"})`,
                      description: p.module_name ? `Module: ${p.module_name}` : "No Module assigned",
                    }))}
                    value={formData.parent_test_case_id || (formData.module_id && !formData.parent_test_case_id ? `module-${formData.module_id}` : undefined)}
                    onChange={(val: any) => {
                      if (!val) {
                        setFormData({ ...formData, parent_test_case_id: undefined, module_id: undefined, test_case_ids: [] });
                      } else if (typeof val === 'string' && val.startsWith('module-')) {
                        setFormData({ ...formData, module_id: val.replace('module-', ''), parent_test_case_id: undefined, test_case_ids: [] });
                      } else {
                        const selectedParent = parents.find(p => p.id === val);
                        setFormData({
                          ...formData,
                          parent_test_case_id: val,
                          module_id: selectedParent ? selectedParent.module_id : formData.module_id,
                          test_case_ids: []
                        });
                      }
                    }}
                    placeholder="Select a Business Scenario to load its test cases"
                    style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item label="Description" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    placeholder="Describe the goals and coverage of this test suite..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </SectionCard>

              {(formData.parent_test_case_id || formData.module_id) && (
                <SectionCard
                  step="STEP 2"
                  icon={<CheckCircleOutlined />}
                  title="Select Cases to Add"
                  subtitle="Choose from remaining available test cases in this scenario"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Tag color="purple" style={{ borderRadius: 8, fontWeight: 700, margin: 0, padding: "2px 10px" }}>
                      {newlySelectedCount} of {unlinkedChildCases.length} selected to add
                    </Tag>

                    <Checkbox
                      onChange={handleSelectAll}
                      checked={filteredModalCases.length > 0 && filteredModalCases.every((tc: any) => formData.test_case_ids?.includes(tc.id))}
                      style={{ fontWeight: 600, color: "var(--text-slate-700)" }}
                    >
                      Select All
                    </Checkbox>
                  </div>

                  <Input
                    placeholder="Search available cases by name or ID..."
                    prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                    value={caseSearchTerm}
                    onChange={(e) => setCaseSearchTerm(e.target.value)}
                    style={{ marginBottom: 12, borderRadius: 8 }}
                    allowClear
                  />

                  {childTestCases.length === 0 ? (
                    <div style={{ color: "var(--text-slate-400)", textAlign: "center", padding: 24, border: "1px dashed var(--border-slate-200)", borderRadius: 8 }}>
                      No test cases found for this scenario. Add cases inside the Business Scenario first.
                    </div>
                  ) : unlinkedChildCases.length === 0 ? (
                    <div style={{ color: "var(--text-slate-400)", textAlign: "center", padding: 24, border: "1px dashed var(--border-slate-200)", borderRadius: 8 }}>
                      All test cases from this scenario have already been added to this test suite.
                    </div>
                  ) : filteredModalCases.length === 0 ? (
                    <div style={{ color: "var(--text-slate-400)", textAlign: "center", padding: 24 }}>
                      No matching available test cases found for your search.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {filteredModalCases.map((tc: any) => (
                          <div
                            key={tc.id}
                            onClick={() => handleToggleCase(tc.id, !formData.test_case_ids?.includes(tc.id))}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "10px 12px",
                              background: formData.test_case_ids?.includes(tc.id) ? "rgba(59, 130, 246, 0.06)" : "transparent",
                              borderRadius: 8,
                              border: `1px solid ${formData.test_case_ids?.includes(tc.id) ? "rgba(59, 130, 246, 0.3)" : "var(--border-slate-100)"}`,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            <Checkbox
                              checked={formData.test_case_ids?.includes(tc.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleToggleCase(tc.id, e.target.checked);
                              }}
                              style={{ width: "100%" }}
                            >
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <Tag color="blue" style={{ fontFamily: "monospace", margin: 0, fontWeight: 700, fontSize: 11, borderRadius: 4 }}>
                                  {tc.test_case_id || "TC"}
                                </Tag>
                                <span style={{ fontWeight: 600, color: "var(--text-slate-900)" }}>{tc.name}</span>
                                {tc.priority && (
                                  <Tag color={tc.priority === "Critical" ? "red" : tc.priority === "High" ? "orange" : "default"} style={{ fontSize: 10.5, margin: 0, padding: "0 6px", borderRadius: 4 }}>
                                    {tc.priority}
                                  </Tag>
                                )}
                              </span>
                              {tc.expected_result && (
                                <div style={{ fontSize: 12, color: "var(--text-slate-500)", marginTop: 2, paddingLeft: 2 }}>
                                  Expected: {tc.expected_result}
                                </div>
                              )}
                            </Checkbox>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>
              )}
            </Form>
          </div>

          {/* Drawer Footer */}
          <div
            className="customer-drawer-footer"
            style={{
              padding: "14px 24px",
              borderTop: "1px solid var(--border-slate-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--bg-pure-white)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
              {newlySelectedCount > 0 ? `Adding ${newlySelectedCount} new cases (${formData.test_case_ids?.length || 0} total)` : `${formData.test_case_ids?.length || 0} total cases in suite`}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={closeModal} style={{ borderRadius: 8, fontWeight: 600, padding: "0 18px", height: 36 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                loading={saving}
                onClick={handleSaveSuite}
                style={{ borderRadius: 8, fontWeight: 600, padding: "0 22px", height: 36, background: "#3B82F6" }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </MainLayout>
  );
}
