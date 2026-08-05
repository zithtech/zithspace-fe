"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Progress, Dropdown, message, Input, Modal, Drawer, Select, Row, Col, Typography, Space } from "antd";
import { PlusOutlined, PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, StopOutlined, MinusCircleOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, EllipsisOutlined, SnippetsOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayCircle, LayoutDashboard, Target, Activity, Trash2, Play } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import dayjs from "dayjs";

const { Text } = Typography;

type TabKey = "dashboard" | "runs";

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const CARD_ACCENTS = [
  ['#3b82f6', '#1d4ed8'],
  ['#10b981', '#047857'],
  ['#8b5cf6', '#6d28d9'],
  ['#f59e0b', '#b45309']
];

function accentFor(str: string) {
  const h = Math.abs(hashCode(str || 'default'));
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
}

function initialsOf(name: string) {
  if (!name) return 'TR';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function TestRunsContent() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestRuns" });

  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>((searchParams.get("tab") as TabKey) || "runs");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  const [runs, setRuns] = useState<any[]>([]);
  const [suites, setSuites] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const filteredSuites = useMemo(() => {
    if (!formData?.module_id) return suites;
    return suites.filter((s: any) => s.module_id === formData.module_id);
  }, [suites, formData?.module_id]);

  // Execute Drawer State
  const [executeDrawerOpen, setExecuteDrawerOpen] = useState(false);
  const [activeRun, setActiveRun] = useState<any>(null);
  const [executing, setExecuting] = useState(false);

  const { canReadRun, canCreateRun } = usePermission();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [runsRes, suitesRes, modRes] = await Promise.all([
        axios.get("/api/v2/qa/runs/all"),
        axios.get("/api/v2/qa/suites/all"),
        axios.get("/api/v2/qa/modules")
      ]);
      setRuns(Array.isArray(runsRes) ? runsRes : (runsRes?.data?.data || runsRes?.data || []));
      setSuites(Array.isArray(suitesRes) ? suitesRes : (suitesRes?.data?.data || suitesRes?.data || []));
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
    } catch (error) {
      message.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadRun) {
      fetchData();
    }
  }, [canReadRun]);

  const openCreateModal = () => {
    setFormData({});
    setModalOpen(true);
  };

  const handleCreateRun = async () => {
    try {
      if (!formData.run_name) return message.error("Run Name is required");
      if (!formData.suite_id) return message.error("Test Suite is required");

      setSaving(true);
      await axios.post("/api/v2/qa/runs", formData);
      message.success("Test Run created successfully");
      setModalOpen(false);
      fetchData();
    } catch (error) {
      message.error("Failed to create test run");
    } finally {
      setSaving(false);
    }
  };

  const openExecuteDrawer = async (record: any) => {
    try {
      setExecuting(true);
      const res: any = await axios.get(`/api/v2/qa/runs/${record.id}`);
      const data = res?.data || res;
      setActiveRun(data);
      setExecuteDrawerOpen(true);
    } catch (error) {
      message.error("Failed to fetch run details");
    } finally {
      setExecuting(false);
    }
  };

  const handleDeleteRun = async (id: string) => {
    try {
      await axios.delete(`/api/v2/qa/runs/${id}`);
      message.success("Test Run deleted");
      fetchData();
    } catch (error) {
      message.error("Failed to delete run");
    }
  };

  const handleUpdateStatus = async (resultId: string, status: string) => {
    try {
      await axios.put(`/api/v2/qa/runs/${activeRun.id}/results/${resultId}`, { status });
      message.success(`Status updated to ${status}`);
      // Optimistically update UI
      setActiveRun((prev: any) => ({
        ...prev,
        results: prev.results.map((r: any) => r.id === resultId ? { ...r, status } : r)
      }));
      // Update background list
      fetchData();
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pass': return 'green';
      case 'Fail': return 'red';
      case 'Blocked': return 'orange';
      default: return 'default';
    }
  };

  if (!canReadRun) return null;

  const filteredRuns = runs.filter(r => r.run_name?.toLowerCase().includes(searchTerm.toLowerCase()));


  const columns = [
    {
      title: "RUN NAME",
      dataIndex: "run_name",
      key: "run_name",
      render: (t: string) => <strong style={{ color: "var(--text-slate-900)", fontSize: 13 }}>{t}</strong>
    },
    {
      title: "SUITE",
      dataIndex: "suite_id",
      key: "suite_id",
      render: (id: string, record: any) => {
        const suite = suites.find(s => s.id === id || s.id === record.suite_id);
        const name = record.suite_name || suite?.suite_name || 'Unassigned';
        return <Tag color="blue">{name}</Tag>;
      }
    },
    {
      title: "MODULE",
      dataIndex: "suite_id",
      key: "module_id",
      render: (id: string, record: any) => {
        const suite = suites.find(s => s.id === id || s.id === record.suite_id);
        const mod = modules.find(m => m.id === suite?.module_id);
        return <Tag color="purple">{mod?.module_name || mod?.name || 'Unassigned'}</Tag>;
      }
    },
    {
      title: "PROGRESS",
      key: "progress",
      width: 200,
      render: (_: any, record: any) => {
        const total = parseInt(record.total_cases) || 0;
        const executed = total - (parseInt(record.not_executed_count) || 0);
        const percent = total > 0 ? Math.round((executed / total) * 100) : 0;
        return <Progress percent={percent} size="small" />;
      }
    },
    {
      title: "STARTED",
      dataIndex: "started_at",
      key: "started_at",
      render: (t: string) => <span style={{ color: "var(--text-slate-500)" }}>{t ? dayjs(t).format("MMM DD, HH:mm") : '—'}</span>
    },
    {
      title: "ACTIONS",
      key: "actions",
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }} onClick={e => e.stopPropagation()}>
          <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={() => openExecuteDrawer(record)}>
            Execute
          </Button>
          <ConfirmDialog
            tone="danger"
            title="Delete Test Run?"
            description="Are you sure you want to delete this test run and all its execution records?"
            confirmText="Delete"
            onConfirm={() => handleDeleteRun(record.id)}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 size={15} />}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title="Delete Test Run"
            />
          </ConfirmDialog>
        </div>
      )
    }
  ];

  const renderRunCard = (r: any) => {
    const accent = accentFor(r.run_name || r.id);
    const suite = suites.find(s => s.id === r.suite_id);
    const suiteName = r.suite_name || suite?.suite_name || 'Unassigned';
    
    const total = parseInt(r.total_cases) || 0;
    const executed = total - (parseInt(r.not_executed_count) || 0);
    const percent = total > 0 ? Math.round((executed / total) * 100) : 0;

    return (
      <div key={r.id} className="pc-card" onClick={() => openExecuteDrawer(r)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
            {initialsOf(r.run_name)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.run_name}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Suite:</span>
              <span className="pc-client-val">{suiteName}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }} onClick={e => e.stopPropagation()}>
            <ConfirmDialog
              tone="danger"
              title="Delete Test Run?"
              description="Are you sure you want to delete this test run and all its execution records?"
              confirmText="Delete"
              onConfirm={() => handleDeleteRun(r.id)}
            >
              <Button
                type="text"
                size="small"
                icon={<Trash2 size={15} />}
                onClick={(e) => e.stopPropagation()}
                style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title="Delete Test Run"
              />
            </ConfirmDialog>
          </div>
        </div>

        <div style={{ padding: '4px 16px 12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-slate-500)', marginBottom: 4 }}>
            <span>Execution Progress</span>
            <strong style={{ color: 'var(--text-slate-800)' }}>{executed} / {total} Cases ({percent}%)</strong>
          </div>
          <Progress percent={percent} size="small" showInfo={false} />
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
            <span className="pc-foot-item">
              <span className="pc-foot-key">Module:</span>
              <Tag color="purple" style={{ margin: 0 }}>
                {(() => {
                  const s = suites.find(suite => suite.id === r.suite_id);
                  const mod = modules.find(m => m.id === s?.module_id);
                  return mod?.module_name || mod?.name || 'Unassigned';
                })()}
              </Tag>
            </span>
            <span className="pc-foot-item">
              <span className="pc-foot-key">Started:</span>
              <span className="pc-foot-val">{r.started_at ? dayjs(r.started_at).format("MMM DD, HH:mm") : '—'}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Calculate quick stats
  const totalRuns = runs.length;
  const activeRuns = runs.filter(r => {
    const total = parseInt(r.total_cases) || 0;
    const executed = total - (parseInt(r.not_executed_count) || 0);
    return total === 0 || executed < total;
  }).length;
  const completedRuns = totalRuns - activeRuns;
  const totalExecutedCases = runs.reduce((acc, r) => {
    const total = parseInt(r.total_cases) || 0;
    const unexec = parseInt(r.not_executed_count) || 0;
    return acc + Math.max(0, total - unexec);
  }, 0);

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: `
        .dh-shell { display: flex; height: calc(100vh - 64px); background: transparent; overflow: hidden; position: relative; }
        .dh-sidebar { width: 240px; background: transparent; border-right: 1px solid var(--border-slate-200); display: flex; flex-direction: column; z-index: 10; flex-shrink: 0; }
        .dh-sidebar-top { padding: 18px 14px 10px; flex-shrink: 0; }
        .pp-side-head { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
        .pp-side-logo { width: 34px; height: 34px; border-radius: 8px; background: var(--bg-blue-50); color: #3B82F6; display: flex; align-items: center; justify-content: center; }
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
        .pp-nav-item.is-active { background: var(--bg-blue-50); color: #3B82F6; font-weight: 600; }
        
        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar { height: auto; min-height: 64px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; padding: 12px 24px; justify-content: space-between; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 24px; background: transparent; }
        
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); margin-left: 12px; }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3B82F6; }

        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 12px; }
        @media (max-width: 1024px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 12px; flex: 1; }
        .pc-avatar {
          width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 13px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 4px; flex: 1; }
        .pc-title {
          font-size: 14px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }

        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0 !important; min-width: 220px;
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

        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
        }
        .ts-table, .ts-table .ant-table { background: transparent !important; }
        .ts-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; }
        .ts-table .ant-table-tbody > tr:hover > td { background: rgba(255, 255, 255, 0.05) !important; }
        `}} />

      <div className="dh-shell">
        <aside className="dh-sidebar">
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo">
                <PlayCircle size={18} />
              </div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Runs</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateRun && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                block
                style={{ marginTop: 16, borderRadius: 8, fontWeight: 500, height: 38 }}
              >
                Create Test Run
              </Button>
            )}
          </div>
          
          <div className="dh-sidebar-scroll">
            <button className={`pp-nav-item ${activeTab === 'runs' ? 'is-active' : ''}`} onClick={() => setActiveTab('runs')}>
              <PlayCircle size={16} /> Runs
            </button>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar">
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {activeTab === 'runs' && (
                <>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>All Test Runs</span>
                  <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 2 }}>Execute test suites and track real-time QA test results</span>
                </>
              )}
              {activeTab === 'dashboard' && (
                <>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>Dashboard</span>
                  <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 2 }}>Overview of test runs and pass/fail execution progress</span>
                </>
              )}
            </div>

            <div className="dh-main-controls">
              {activeTab === 'runs' && (
                <>
                  <Input
                    placeholder="Search test runs..."
                    prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 250, borderRadius: 6 }}
                  />
                  <div className="pp-segmented">
                    <button type="button" className={viewMode === 'grid' ? 'is-active' : ''} onClick={() => setViewMode('grid')} aria-label="Grid view"><AppstoreOutlined /></button>
                    <button type="button" className={viewMode === 'list' ? 'is-active' : ''} onClick={() => setViewMode('list')} aria-label="List view"><UnorderedListOutlined /></button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="dh-main-scroll">
            {activeTab === 'runs' && (
              <>
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "Total Runs", value: totalRuns, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", icon: <SnippetsOutlined style={{ fontSize: 14 }} /> },
                    { label: "Active Executions", value: activeRuns, color: "#f59e0b", tint: "rgba(245,158,11,0.10)", icon: <Activity size={14} /> },
                    { label: "Completed Runs", value: completedRuns, color: "#10b981", tint: "rgba(16,185,129,0.10)", icon: <CheckCircleOutlined style={{ fontSize: 14 }} /> },
                    { label: "Executed Cases", value: totalExecutedCases, color: "#8b5cf6", tint: "rgba(139,92,246,0.10)", icon: <Target size={14} /> }
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', padding: '12px 16px', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: stat.tint, color: stat.color }}>{stat.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-500)' }}>{stat.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1 }}>{stat.value}</span>
                        </div>
                        <div style={{ width: 60, height: 2, background: stat.color, borderRadius: 2, opacity: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table or Grid */}
                {viewMode === 'list' ? (
                  <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 0, overflow: 'hidden' }}>
                    <Table
                      className="ts-table"
                      dataSource={filteredRuns}
                      columns={columns}
                      rowKey="id"
                      pagination={false}
                      loading={loading}
                      scroll={{ x: 'max-content' }}
                      onRow={(record) => ({
                        onClick: () => openExecuteDrawer(record),
                        style: { cursor: 'pointer', background: 'transparent' }
                      })}
                    />
                  </div>
                ) : (
                  <div className="pp-grid">
                    {loading ? (
                      <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>Loading...</div>
                    ) : filteredRuns.length === 0 ? (
                      <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>
                        No test runs found.
                      </div>
                    ) : (
                      filteredRuns.map(r => renderRunCard(r))
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'dashboard' && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-slate-500)' }}>
                Test Runs Dashboard Content
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Test Run Modal */}
      <Modal
        title={<span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-slate-900)" }}>Create New Test Run</span>}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleCreateRun}
        confirmLoading={saving}
        okText="Start Run"
        width={500}
        destroyOnClose
        style={{ top: 60 }}
      >
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Text strong style={{ color: "var(--text-slate-800)" }}>Run Name <span style={{ color: "red" }}>*</span></Text>
            <Input 
              placeholder="E.g. Release v2.1 Smoke" 
              value={formData.run_name} 
              onChange={(e) => setFormData({ ...formData, run_name: e.target.value })} 
              style={{ marginTop: 6, borderRadius: 0 }}
            />
          </Col>
          
          <Col span={24}>
            <Text strong style={{ color: "var(--text-slate-800)" }}>Module</Text>
            <div style={{ marginTop: 6 }}>
              <SearchableDropdown
                options={modules.map(m => ({ value: m.id, label: m.module_name || m.name || "Unnamed Module" }))}
                value={formData.module_id}
                onChange={(val) => setFormData({ ...formData, module_id: val, suite_id: undefined })}
                placeholder="Select a module to filter test suites"
                style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
              />
            </div>
          </Col>

          <Col span={24}>
            <Text strong style={{ color: "var(--text-slate-800)" }}>Suite Name <span style={{ color: "red" }}>*</span></Text>
            <div style={{ marginTop: 6 }}>
              <SearchableDropdown
                options={filteredSuites.map(s => ({ value: s.id, label: s.suite_name }))}
                value={formData.suite_id}
                onChange={(val) => setFormData({ ...formData, suite_id: val })}
                placeholder="Select a suite to execute"
                style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
              />
            </div>
          </Col>
        </Row>
      </Modal>

      {/* Execute Drawer */}
      <Drawer
        title={<span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-slate-900)" }}>Executing: {activeRun?.run_name || ''}</span>}
        onClose={() => setExecuteDrawerOpen(false)}
        open={executeDrawerOpen}
        {...commonDrawerProps}
        width={750}
      >
        {activeRun && (
          <div>
            {/* Progress Summary */}
            <div style={{ background: 'var(--bg-slate-50)', padding: 16, borderRadius: 0, marginBottom: 24, border: '1px solid var(--border-slate-200)' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text style={{ color: 'var(--text-slate-500)' }}>Total Cases</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--text-slate-900)' }}>{activeRun.results?.length || 0}</div>
                </Col>
                <Col span={6}>
                  <Text style={{ color: 'var(--text-slate-500)' }}>Passed</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                    {activeRun.results?.filter((r: any) => r.status === 'Pass').length || 0}
                  </div>
                </Col>
                <Col span={6}>
                  <Text style={{ color: 'var(--text-slate-500)' }}>Failed</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ef4444' }}>
                    {activeRun.results?.filter((r: any) => r.status === 'Fail').length || 0}
                  </div>
                </Col>
                <Col span={6}>
                  <Text style={{ color: 'var(--text-slate-500)' }}>Blocked</Text>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e0b' }}>
                    {activeRun.results?.filter((r: any) => r.status === 'Blocked').length || 0}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Cases List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeRun.results?.map((result: any) => (
                <div key={result.id} style={{ border: '1px solid var(--border-slate-200)', borderRadius: 0, padding: 16, background: 'var(--bg-pure-white)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Text strong style={{ fontSize: 15, color: 'var(--text-slate-900)' }}>{result.name}</Text>
                      </div>
                      <Space size={6}>
                        {result.priority && <Tag style={{ margin: 0, borderRadius: 0 }}>{result.priority}</Tag>}
                        {result.test_type && <Tag style={{ margin: 0, borderRadius: 0 }}>{result.test_type}</Tag>}
                        <Tag color={getStatusColor(result.status)} style={{ margin: 0, fontWeight: 600, borderRadius: 0 }}>{result.status || 'Not Executed'}</Tag>
                      </Space>
                    </div>
                    
                    <Space size={6} style={{ flexWrap: 'wrap' }}>
                      <Button 
                        size="small"
                        type={result.status === 'Pass' ? 'primary' : 'default'}
                        icon={<CheckCircleOutlined />} 
                        onClick={() => handleUpdateStatus(result.id, 'Pass')}
                        style={{ background: result.status === 'Pass' ? '#10b981' : undefined, borderColor: result.status === 'Pass' ? '#10b981' : undefined }}
                      >
                        Pass
                      </Button>
                      <Button 
                        size="small"
                        type={result.status === 'Fail' ? 'primary' : 'default'}
                        danger={result.status === 'Fail'}
                        icon={<CloseCircleOutlined />} 
                        onClick={() => handleUpdateStatus(result.id, 'Fail')}
                      >
                        Fail
                      </Button>
                      <Button 
                        size="small"
                        type={result.status === 'Blocked' ? 'primary' : 'default'}
                        icon={<StopOutlined />} 
                        onClick={() => handleUpdateStatus(result.id, 'Blocked')}
                        style={{ background: result.status === 'Blocked' ? '#f59e0b' : undefined, borderColor: result.status === 'Blocked' ? '#f59e0b' : undefined, color: result.status === 'Blocked' ? '#fff' : undefined }}
                      >
                        Blocked
                      </Button>
                      <Button 
                        size="small"
                        type="text"
                        icon={<MinusCircleOutlined />} 
                        onClick={() => handleUpdateStatus(result.id, 'Not Executed')}
                        disabled={!result.status || result.status === 'Not Executed'}
                      >
                        Reset
                      </Button>
                    </Space>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Drawer>
    </MainLayout>
  );
}

export default function TestRunsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading test runs...</div>}>
      <TestRunsContent />
    </Suspense>
  );
}
