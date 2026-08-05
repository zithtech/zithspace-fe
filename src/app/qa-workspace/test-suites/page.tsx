"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Dropdown, message, Input, Modal, Select, Checkbox, Row, Col, Typography, Drawer, Form } from "antd";
import { PlusOutlined, SnippetsOutlined, CheckCircleOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, EllipsisOutlined, FolderOutlined, InfoCircleOutlined, CloseOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { Layers, Trash2, Pencil, Folder } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import dayjs from "dayjs";

const { Text } = Typography;
type TabKey = "suites";

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const CARD_ACCENTS = [
  ['#3b82f6', '#1d4ed8'],
  ['#8b5cf6', '#6d28d9'],
  ['#10b981', '#047857'],
  ['#f59e0b', '#b45309']
];

function accentFor(str: string) {
  const h = Math.abs(hashCode(str || 'default'));
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
}

function initialsOf(name: string) {
  if (!name) return 'TS';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TestSuitesPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestSuites" });

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("suites");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [suites, setSuites] = useState<any[]>([]);
  const [parents, setParents] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ test_case_ids: [], parent_test_case_id: undefined });
  const [childTestCases, setChildTestCases] = useState<any[]>([]);
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  const { canReadSuite, canCreateSuite } = usePermission();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [suitesRes, parentsRes, modRes] = await Promise.all([
        axios.get("/api/v2/qa/suites/all"),
        axios.get("/api/v2/qa/parents"),
        axios.get("/api/v2/qa/modules")
      ]);
      setSuites(Array.isArray(suitesRes) ? suitesRes : (suitesRes?.data?.data || suitesRes?.data || []));
      setParents(Array.isArray(parentsRes) ? parentsRes : (parentsRes?.data?.data || parentsRes?.data || []));
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
    } catch (error) {
      message.error("Failed to fetch test suites data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadSuite) {
      fetchData();
    }
  }, [canReadSuite]);

  // Fetch child test cases when parent_test_case_id or module_id is selected
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
        // Fallback for legacy suites without a parent_test_case_id set yet
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
    fetchCases();
  }, [formData.parent_test_case_id, formData.module_id]);

  const openCreateModal = async (record?: any) => {
    setCaseSearchTerm("");
    if (record) {
      setEditingSuite(record);
      try {
        const res: any = await axios.get(`/api/v2/qa/suites/${record.id}`);
        const data = res?.data || res;
        setFormData({
          ...record,
          parent_test_case_id: record.parent_test_case_id || undefined,
          module_id: record.module_id,
          test_case_ids: data?.test_cases?.map((tc: any) => tc.id) || []
        });
      } catch (e) {
        message.error("Failed to fetch suite details");
        return;
      }
    } else {
      setEditingSuite(null);
      setFormData({ test_case_ids: [], parent_test_case_id: undefined });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSuite(null);
    setFormData({ test_case_ids: [], parent_test_case_id: undefined });
    setCaseSearchTerm("");
  };

  const handleSaveSuite = async () => {
    try {
      if (!formData.suite_name) return message.error("Suite Name is required");
      if (!formData.parent_test_case_id && !formData.module_id) return message.error("An Associated Test Case is required");

      // Auto-inherit module_id from Parent Test Case if parent is chosen
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
      if (editingSuite) {
        await axios.put(`/api/v2/qa/suites/${editingSuite.id}`, payload);
        message.success("Test Suite updated successfully");
      } else {
        await axios.post("/api/v2/qa/suites", payload);
        message.success("Test Suite created successfully");
      }
      closeModal();
      fetchData();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Failed to save suite");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSuite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/v2/qa/suites/${id}`);
      message.success("Test Suite deleted");
      fetchData();
    } catch (error) {
      message.error("Failed to delete suite");
    }
  };

  const filteredModalCases = useMemo(() => {
    if (!caseSearchTerm) return childTestCases;
    const s = caseSearchTerm.toLowerCase();
    return childTestCases.filter(tc =>
      tc.name?.toLowerCase().includes(s) ||
      tc.test_case_id?.toLowerCase().includes(s)
    );
  }, [childTestCases, caseSearchTerm]);

  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      const allIds = Array.from(new Set([...(formData.test_case_ids || []), ...filteredModalCases.map(tc => tc.id)]));
      setFormData({ ...formData, test_case_ids: allIds });
    } else {
      const filteredIds = new Set(filteredModalCases.map(tc => tc.id));
      const remaining = (formData.test_case_ids || []).filter((id: string) => !filteredIds.has(id));
      setFormData({ ...formData, test_case_ids: remaining });
    }
  };

  if (!canReadSuite) return null;

  const filteredSuites = suites.filter(s =>
    s.suite_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.module_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.parent_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLinkedCases = suites.reduce((acc, curr) => acc + (parseInt(curr.case_count || '0', 10)), 0);
  const uniqueScenarios = new Set(suites.map(s => s.parent_test_case_id).filter(Boolean)).size;


  const columns = [
    {
      title: "SUITE NAME",
      dataIndex: "suite_name",
      key: "suite_name",
      render: (t: string, record: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <strong style={{ color: "var(--text-slate-900)", fontSize: 14 }}>{t}</strong>
          {record.description && <span style={{ fontSize: 12, color: "var(--text-slate-500)" }}>{record.description}</span>}
        </div>
      )
    },
    {
      title: "BUSINESS SCENARIO",
      dataIndex: "parent_test_case_id",
      key: "parent_test_case_id",
      render: (id: string, record: any) => {
        const parent = parents.find(p => p.id === id || p.id === record.parent_test_case_id);
        const title = record.parent_title || parent?.title || "—";
        if (title === "—") return <span style={{ color: "var(--text-slate-400)" }}>—</span>;
        return (
          <Tag color="geekblue" style={{ fontWeight: 600, fontSize: 12.5, padding: '2px 10px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <FolderOutlined /> {title}
          </Tag>
        );
      }
    },
    {
      title: "MODULE",
      dataIndex: "module_id",
      key: "module_id",
      render: (id: string, record: any) => {
        const mod = modules.find(m => m.id === id || m.id === record.module_id);
        const name = record.module_name || mod?.module_name || mod?.name || 'Unassigned';
        return <Tag color="blue" style={{ fontWeight: 500 }}>{name}</Tag>;
      }
    },
    {
      title: "LINKED CHILD CASES",
      dataIndex: "case_count",
      key: "case_count",
      render: (t: number) => <Tag color="purple" style={{ fontWeight: 700, fontSize: 12.5, padding: '2px 10px', borderRadius: 12 }}>{t || 0} Cases</Tag>
    },
    {
      title: "LAST UPDATED",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (t: string) => <span style={{ color: "var(--text-slate-500)", fontSize: 12.5 }}>{t ? dayjs(t).format("MMM DD, YYYY") : '—'}</span>
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 90,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
          <Button
            type="text"
            size="small"
            icon={<Pencil size={15} />}
            onClick={(e) => {
              e.stopPropagation();
              openCreateModal(record);
            }}
            style={{ color: "var(--text-slate-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            title="Edit Suite"
          />
          <ConfirmDialog
            tone="danger"
            title="Delete Test Suite?"
            description="Are you sure you want to delete this test suite? Associated test cases will remain untouched."
            confirmText="Delete"
            onConfirm={() => handleDeleteSuite(record.id)}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 size={15} />}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title="Delete Suite"
            />
          </ConfirmDialog>
        </div>
      )
    }
  ];

  const renderSuiteCard = (r: any) => {
    const accent = accentFor(r.suite_name || r.id);
    const parent = parents.find(p => p.id === r.parent_test_case_id);
    const parentTitle = r.parent_title || parent?.title || "Unassigned Scenario";

    return (
      <div key={r.id} className="pc-card" onClick={() => router.push("/qa-workspace/test-suites/" + r.id)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
            {initialsOf(r.suite_name)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.suite_name}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Scenario:</span>
              <span className="pc-client-val">{parentTitle}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            <Button
              type="text"
              size="small"
              icon={<Pencil size={15} />}
              onClick={(e) => {
                e.stopPropagation();
                openCreateModal(r);
              }}
              style={{ color: "var(--text-slate-500)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title="Edit Suite"
            />
            <ConfirmDialog
              tone="danger"
              title="Delete Test Suite?"
              description="Are you sure you want to delete this test suite? Associated test cases will remain untouched."
              confirmText="Delete"
              onConfirm={() => handleDeleteSuite(r.id)}
            >
              <Button
                type="text"
                size="small"
                icon={<Trash2 size={15} />}
                onClick={(e) => e.stopPropagation()}
                style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title="Delete Suite"
              />
            </ConfirmDialog>
          </div>
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row">
            <span className="pc-foot-item">
              <span className="pc-foot-key">Module:</span>
              <span className="pc-foot-val">{r.module_name || 'Unassigned'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Cases:</span>
              <span className="pc-foot-val">{r.case_count || 0} Linked</span>
            </span>
          </div>
          <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
            <span className="pc-foot-item">
              <span className="pc-foot-key">Updated:</span>
              <span className="pc-foot-val">{r.updated_at ? dayjs(r.updated_at).format("MMM DD") : '—'}</span>
            </span>
            <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>Suite</Tag>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: `
        .dh-shell { display: flex; height: calc(100vh - 64px); background: transparent; overflow: hidden; position: relative; }
        .dh-sidebar { width: 240px; background: transparent; border-right: 1px solid var(--border-slate-200); display: flex; flex-direction: column; z-index: 10; flex-shrink: 0; }
        .dh-sidebar-top { padding: 18px 14px 10px; flex-shrink: 0; }
        .pp-side-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .pp-side-logo { width: 34px; height: 34px; border-radius: 8px; background: var(--bg-blue-50); color: #3B82F6; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .pp-side-title { font-size: 15px; font-weight: 700; color: var(--text-slate-900); line-height: 1.2; margin: 0; }
        .pp-side-subtitle { font-size: 11.5px; color: var(--text-slate-500); font-weight: 500; margin: 0; }
        
        .dh-sidebar-scroll { flex: 1; overflow-y: auto; padding: 0 14px 20px; }
        .pp-nav-item {
          display: flex; align-items: center; gap: 10px; width: 100%; height: 36px; padding: 0 12px;
          border-radius: 6px; border: none; background: transparent; color: var(--text-slate-600);
          font-size: 13px; font-weight: 500; cursor: pointer; text-align: left; transition: all 0.15s ease;
        }
        .pp-nav-item:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .pp-nav-item.is-active { background: var(--bg-blue-50); color: #3B82F6; font-weight: 600; }
        
        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar { height: 56px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; padding: 0 18px; justify-content: space-between; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 24px; background: transparent; }
        
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); margin-left: 12px; }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }

        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
        @media (max-width: 1024px) { .pp-grid { grid-template-columns: 1fr; } }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 8px; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 4px 14px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 14px; flex: 1; }
        .pc-avatar { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 800; font-size: 13px; }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 4px; flex: 1; }
        .pc-title { font-size: 15px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3; }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 12px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-actions { border: none; background: transparent; cursor: pointer; color: var(--text-slate-400); font-size: 16px; padding: 4px; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 11px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 12px; background: #cbd5e1; }
        
        .ts-table .ant-table-thead > tr > th {
          background: transparent !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important; color: var(--text-slate-500) !important;
          padding: 12px 16px !important;
        }
        .ts-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 14px 16px !important; }
        .ts-table, .ts-table .ant-table { background: transparent !important; }
        .ts-table .ant-table-tbody > tr:hover > td { background: rgba(59, 130, 246, 0.04) !important; }
        `}} />

      <div className="dh-shell">
        <aside className="dh-sidebar">
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo"><SnippetsOutlined /></div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Suites</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateSuite && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openCreateModal()}
                block
                style={{ marginTop: 16, borderRadius: 8, fontWeight: 600, height: 38 }}
              >
                Create Suite
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll">
            <button className="pp-nav-item is-active" onClick={() => setActiveTab("suites")}>
              <Layers size={16} /> Suites
            </button>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar" style={{ height: 'auto', minHeight: 64, padding: '12px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>All Test Suites</span>
              <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 2 }}>Organize child test cases from your business scenarios into executable suites</span>
            </div>

            <div className="dh-main-controls" style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                placeholder="Search test suites..."
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: 260, borderRadius: 6 }}
              />
              <div className="pp-segmented">
                <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} title="List View"><UnorderedListOutlined /></button>
                <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} title="Grid View"><AppstoreOutlined /></button>
              </div>
            </div>
          </div>

          <div className="dh-main-scroll">
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Suites", value: suites.length, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", icon: <SnippetsOutlined style={{ fontSize: 15 }} /> },
                { label: "Scenarios Covered", value: uniqueScenarios, color: "#10b981", tint: "rgba(16,185,129,0.10)", icon: <Folder style={{ width: 16, height: 16 }} /> },
                { label: "Total Linked Cases", value: totalLinkedCases, color: "#8b5cf6", tint: "rgba(139,92,246,0.10)", icon: <Layers size={16} /> },
                { label: "Active Modules", value: modules.length, color: "#f59e0b", tint: "rgba(245,158,11,0.10)", icon: <CheckCircleOutlined style={{ fontSize: 15 }} /> }
              ].map((stat) => (
                <div key={stat.label} style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', padding: '14px 18px', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 0, background: stat.tint, color: stat.color }}>{stat.icon}</span>
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

            {/* Table or Grid */}
            {viewMode === 'list' ? (
              <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 0, overflow: 'hidden' }}>
                <Table
                  className="ts-table"
                  dataSource={filteredSuites}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  loading={loading}
                  scroll={{ x: 'max-content' }}
                  onRow={(record) => ({
                    onClick: () => router.push("/qa-workspace/test-suites/" + record.id),
                    style: { cursor: 'pointer', background: 'transparent' }
                  })}
                  locale={{ emptyText: <div style={{ padding: 40, color: 'var(--text-slate-400)' }}>No test suites found. Click "Create Suite" to create your first suite.</div> }}
                />
              </div>
            ) : (
              <div className="pp-grid">
                {loading ? (
                  <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>Loading suites...</div>
                ) : filteredSuites.length === 0 ? (
                  <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>No test suites found.</div>
                ) : (
                  filteredSuites.map(r => renderSuiteCard(r))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create / Edit Suite Drawer */}
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
                  borderRadius: 0,
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
                  {editingSuite ? "Edit Test Suite" : "Create Test Suite"}
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                  {editingSuite ? "Update test suite details and module case selection" : "Configure a new test suite and link module cases"}
                </span>
              </div>
            </div>

            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={closeModal}
              style={{ color: "var(--text-slate-400)" }}
            />
          </div>

          {/* Drawer Body */}
          <div
            className="dh-main-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 24px",
              background: "transparent",
            }}
          >
            <Form layout="vertical" className="customer-drawer-form">
              {/* STEP 1: Suite Information */}
              <SectionCard
                step="STEP 1"
                icon={<InfoCircleOutlined />}
                title="Suite Information"
                subtitle="Define the test suite name, associated test case, and description"
              >
                <Form.Item label="Suite Name" required style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="E.g. Smoke Test Suite, Regression Sprint 14"
                    value={formData.suite_name}
                    onChange={(e) => setFormData({ ...formData, suite_name: e.target.value })}
                    size="large"
                    style={{ borderRadius: 0 }}
                  />
                </Form.Item>

                <Form.Item label="Associated Test Case" required style={{ marginBottom: 16 }}>
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
                      } else if (typeof val === "string" && val.startsWith("module-")) {
                        setFormData({ ...formData, module_id: val.replace("module-", ""), parent_test_case_id: undefined, test_case_ids: [] });
                      } else {
                        const selectedParent = parents.find((p: any) => p.id === val);
                        setFormData({
                          ...formData,
                          parent_test_case_id: val,
                          module_id: selectedParent ? selectedParent.module_id : formData.module_id,
                          test_case_ids: [],
                        });
                      }
                    }}
                    placeholder="Select a Test Case to load its module cases"
                    style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                  />
                </Form.Item>

                <Form.Item label="Description" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    placeholder="Describe the goals and coverage of this test suite..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    style={{ borderRadius: 0 }}
                  />
                </Form.Item>
              </SectionCard>

              {/* STEP 2: Module Test Cases */}
              {(formData.parent_test_case_id || formData.module_id) && (
                <SectionCard
                  step="STEP 2"
                  icon={<CheckCircleOutlined />}
                  title="Link Module Test Cases"
                  subtitle="Select the specific module test cases to include in this test suite"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border-slate-100)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Text strong style={{ color: "var(--text-slate-800)", fontSize: 13.5 }}>
                        Select Module Cases
                      </Text>
                      <Tag color="purple" style={{ borderRadius: 0, fontWeight: 700, margin: 0 }}>
                        {formData.test_case_ids?.length || 0} of {childTestCases.length} selected
                      </Tag>
                    </div>

                    <Checkbox
                      onChange={handleSelectAll}
                      checked={filteredModalCases.length > 0 && filteredModalCases.every((tc: any) => formData.test_case_ids?.includes(tc.id))}
                      style={{ fontWeight: 600, color: "var(--text-slate-700)" }}
                    >
                      Select All
                    </Checkbox>
                  </div>

                  <Input
                    placeholder="Search module cases by name or ID..."
                    prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                    value={caseSearchTerm}
                    onChange={(e) => setCaseSearchTerm(e.target.value)}
                    style={{ marginBottom: 12, borderRadius: 0 }}
                    allowClear
                  />

                  {childTestCases.length === 0 ? (
                    <div style={{ color: "var(--text-slate-400)", textAlign: "center", padding: 24, border: "1px dashed var(--border-slate-200)", borderRadius: 0 }}>
                      No module test cases found for this test case. Add module cases first.
                    </div>
                  ) : filteredModalCases.length === 0 ? (
                    <div style={{ color: "var(--text-slate-400)", textAlign: "center", padding: 24 }}>
                      No matching module test cases found for your search.
                    </div>
                  ) : (
                    <div style={{ maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                      <Checkbox.Group
                        style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}
                        value={formData.test_case_ids}
                        onChange={(vals) => setFormData({ ...formData, test_case_ids: vals })}
                      >
                        {filteredModalCases.map((tc: any) => (
                          <div
                            key={tc.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "10px 12px",
                              background: formData.test_case_ids?.includes(tc.id) ? "rgba(59, 130, 246, 0.06)" : "transparent",
                              borderRadius: 0,
                              border: `1px solid ${formData.test_case_ids?.includes(tc.id) ? "rgba(59, 130, 246, 0.3)" : "var(--border-slate-100)"}`,
                              transition: "all 0.15s",
                            }}
                          >
                            <Checkbox value={tc.id} style={{ width: "100%" }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                <Tag color="blue" style={{ fontFamily: "monospace", margin: 0, fontWeight: 700, fontSize: 11, borderRadius: 0 }}>
                                  {tc.test_case_id || "TC"}
                                </Tag>
                                <span style={{ fontWeight: 600, color: "var(--text-slate-900)" }}>{tc.name}</span>
                                {tc.priority && (
                                  <Tag color={tc.priority === "Critical" ? "red" : tc.priority === "High" ? "orange" : "default"} style={{ fontSize: 10.5, margin: 0, padding: "0 6px", borderRadius: 0 }}>
                                    {tc.priority}
                                  </Tag>
                                )}
                              </span>
                            </Checkbox>
                          </div>
                        ))}
                      </Checkbox.Group>
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
              {formData.test_case_ids?.length || 0} cases selected
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
                {editingSuite ? "Save Changes" : "Create Suite"}
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </MainLayout>
  );
}
