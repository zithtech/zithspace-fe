"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Dropdown, message, Modal, List, Typography, Input, Select, Form, Drawer } from "antd";
import { BugOutlined, PlusOutlined, CheckCircleOutlined, SnippetsOutlined, AppstoreOutlined, UnorderedListOutlined, EllipsisOutlined, SearchOutlined, LinkOutlined, InfoCircleOutlined, UserOutlined, ClockCircleOutlined, CloseOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "next/navigation";
import { Target, Trash2, Pencil, Layers, Folder } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { MembersService } from "@/services/membersService";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

type TabKey = "cases";

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
  if (!name) return 'TC';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function TestCasesPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestCases" });

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("cases");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const [parentCases, setParentCases] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [suitesModalVisible, setSuitesModalVisible] = useState(false);
  const [selectedCaseForSuites, setSelectedCaseForSuites] = useState<any>(null);

  // Drawer State for Create/Edit Parent Case
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    module_id: undefined as string | undefined,
    feature: "",
    automation: "Manual",
    status: "Draft",
    owner: undefined as string | undefined
  });

  const { canReadCase, canCreateCase } = usePermission();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [parentsRes, modRes, memRes] = await Promise.all([
        axios.get("/api/v2/qa/parents"),
        axios.get("/api/v2/qa/modules"),
        MembersService.getMembers({ limit: 500 }).catch(() => ({ data: [] }))
      ]);
      setParentCases(Array.isArray(parentsRes) ? parentsRes : (parentsRes?.data?.data || parentsRes?.data || []));
      setModules(Array.isArray(modRes) ? modRes : (modRes?.data?.data || modRes?.data || []));
      setUsersList((memRes as any)?.data || []);
    } catch (error) {
      message.error("Failed to fetch test cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadCase) {
      fetchData();
    }
  }, [canReadCase]);

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setEditingRecord(null);
    setFormData({
      title: "",
      module_id: undefined,
      feature: "",
      automation: "Manual",
      status: "Draft",
      owner: undefined
    });
    setDrawerVisible(true);
  };

  const handleOpenEditModal = (r: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(r.id);
    setEditingRecord(r);
    setFormData({
      title: r.title || "",
      module_id: r.module_id || undefined,
      feature: r.feature || "",
      automation: r.automation || "Manual",
      status: r.status || "Draft",
      owner: r.owner || r.created_by || undefined
    });
    setDrawerVisible(true);
  };

  const handleSaveParent = async () => {
    if (!formData.title.trim()) {
      message.error("Please enter a Test Case Title");
      return;
    }
    try {
      setSubmitting(true);
      if (editingId) {
        await axios.put(`/api/v2/qa/parents/${editingId}`, formData);
        message.success("Test Case updated successfully!");
      } else {
        await axios.post(`/api/v2/qa/parents`, formData);
        message.success("Test Case created successfully!");
      }
      setDrawerVisible(false);
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to save Test Case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/v2/qa/parents/${id}`);
      message.success("Test Case deleted successfully");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to delete test case");
    }
  };


  const filteredData = parentCases.filter(p => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(s) ||
      p.module_name?.toLowerCase().includes(s) ||
      p.feature?.toLowerCase().includes(s) ||
      p.qa_owner?.toLowerCase().includes(s)
    );
  });

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (t: string, record: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <strong style={{ color: "var(--text-slate-900)", fontSize: 14 }}>{t || "Unnamed Test Case"}</strong>
          <span style={{ fontSize: 11.5, color: "var(--text-slate-500)" }}>
            {record.child_count || 0} Test Case{(record.child_count || 0) !== 1 ? 's' : ''}
          </span>
        </div>
      )
    },
    {
      title: "Module",
      dataIndex: "module_name",
      key: "module_name",
      render: (t: string) => <Tag style={{ fontWeight: 500 }}>{t || "Unassigned"}</Tag>
    },
    {
      title: "Feature",
      dataIndex: "feature",
      key: "feature",
      render: (t: string) => <span style={{ color: "var(--text-slate-700)" }}>{t || "—"}</span>
    },
    {
      title: "Automation",
      dataIndex: "automation",
      key: "automation",
      render: (t: string) => <Tag color={t === 'Automated' ? 'purple' : 'default'} style={{ fontWeight: 600 }}>{t || 'Manual'}</Tag>
    },
    {
      title: "Owner",
      dataIndex: "qa_owner",
      key: "qa_owner",
      render: (_: any, record: any) => {
        const name = record.owner_name || record.qa_owner || record.creator_name || record.owner;
        return <span style={{ fontWeight: 500, color: "var(--text-slate-800)" }}>{(name && typeof name === 'string' && !/^[0-9a-fA-F]{8}-/.test(name)) ? name : "—"}</span>;
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (t: string) => <Tag color={t === 'Ready' || t === 'Active' ? 'green' : t === 'Deprecated' ? 'red' : 'blue'} style={{ fontWeight: 600 }}>{t || 'Draft'}</Tag>
    },
    {
      title: "Linked Suites",
      key: "linked_suites",
      render: (_: any, record: any) => {
        const suites = record.test_suites || [];
        const count = suites.length || parseInt(record.suite_count || '0', 10);
        if (count === 0) return <span style={{ color: "var(--text-slate-400)", fontSize: 13 }}>0</span>;
        return (
          <Tag
            color="geekblue"
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, borderRadius: 12, padding: '2px 10px', fontWeight: 600, fontSize: 12 }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCaseForSuites(record);
              setSuitesModalVisible(true);
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
      title: "Last Updated",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (t: string) => <span style={{ color: "var(--text-slate-500)", fontSize: 12 }}>{t ? new Date(t).toISOString().split('T')[0] : '—'}</span>
    },
    {
      title: "Actions",
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
              handleOpenEditModal(record, e);
            }}
            style={{ color: "var(--text-slate-600)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            title="Edit Test Case"
          />
          <ConfirmDialog
            tone="danger"
            title="Delete Test Case?"
            description="Are you sure you want to delete this Test Case and all associated test cases?"
            confirmText="Delete"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              icon={<Trash2 size={15} />}
              onClick={(e) => e.stopPropagation()}
              style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title="Delete Test Case"
            />
          </ConfirmDialog>
        </div>
      )
    }
  ];

  const renderCaseCard = (r: any) => {
    const accent = accentFor(r.title || r.id);
    const color = r.status === 'Ready' || r.status === 'Active' ? '#10b981' : r.status === 'Deprecated' ? '#ef4444' : '#3b82f6';

    return (
      <div key={r.id} className="pc-card" onClick={() => router.push(`/qa-workspace/test-cases/${r.id}`)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
            {initialsOf(r.title)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.title}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Module:</span>
              <span className="pc-client-val">{r.module_name || 'Unassigned'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
            <Button
              type="text"
              size="small"
              icon={<Pencil size={15} />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(r, e);
              }}
              style={{ color: "var(--text-slate-500)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
              title="Edit Test Case"
            />
            <ConfirmDialog
              tone="danger"
              title="Delete Test Case?"
              description="Are you sure you want to delete this Test Case and all associated test cases?"
              confirmText="Delete"
              onConfirm={() => handleDelete(r.id)}
            >
              <Button
                type="text"
                size="small"
                icon={<Trash2 size={15} />}
                onClick={(e) => e.stopPropagation()}
                style={{ color: "#ef4444", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                title="Delete Test Case"
              />
            </ConfirmDialog>
          </div>
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row">
            <span className="pc-foot-item">
              <span className="pc-foot-key">Feature:</span>
              <span className="pc-foot-val">{r.feature || '—'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Automation:</span>
              <span className="pc-foot-val">{r.automation || 'Manual'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Test Cases:</span>
              <span className="pc-foot-val">{r.child_count || 0}</span>
            </span>
          </div>
          <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
            <span className="pc-foot-item">
              <span className="pc-foot-key">Owner:</span>
              <span className="pc-foot-val">{r.owner_name || r.qa_owner || '—'}</span>
            </span>
            <span className="pc-status-tag" style={{ color, background: `${color}1A` }}>
              {r.status || 'Draft'}
            </span>
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
          margin-bottom: 4px;
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
        @media (max-width: 1024px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 6px; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 12px; flex: 1; }
        .pc-avatar {
          width: 34px; height: 34px; border-radius: 6px; flex-shrink: 0;
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

        .pc-actions { border: none; background: transparent; cursor: pointer; color: var(--text-slate-400); font-size: 16px; padding: 4px; }

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
        
        .pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }
        
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

        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
          padding: 12px 16px !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 12px 16px !important;
        }
        .ts-table, .ts-table .ant-table {
          background: transparent !important;
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
                <BugOutlined />
              </div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Cases</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateCase && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleOpenCreateModal}
                block
                style={{ marginTop: 16, borderRadius: 8, fontWeight: 500, height: 38 }}
              >
                Create Test Case
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll">
            <button className="pp-nav-item is-active" onClick={() => setActiveTab("cases")}>
              <Target size={16} /> Cases
            </button>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar" style={{ height: 'auto', minHeight: 64, padding: '12px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                Cases
              </span>
              <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 2 }}>
                High-level testing scenarios and test cases for your QA Space
              </span>
            </div>

            <div className="dh-main-controls" style={{ display: 'flex', alignItems: 'center' }}>
              <Input
                placeholder="Search test cases or features..."
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
                { label: "Total Test Cases", value: parentCases.length, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", icon: <Folder style={{ width: 15, height: 15 }} /> },
                { label: "Ready Test Cases", value: parentCases.filter(t => t.status === 'Ready' || t.status === 'Active').length, color: "#10b981", tint: "rgba(16,185,129,0.10)", icon: <CheckCircleOutlined style={{ fontSize: 14 }} /> },
                { label: "Automated Test Cases", value: parentCases.filter(t => t.automation === 'Automated').length, color: "#8b5cf6", tint: "rgba(139,92,246,0.10)", icon: <BugOutlined style={{ fontSize: 14 }} /> },
                { label: "Total Module Cases", value: parentCases.reduce((acc, curr) => acc + (parseInt(curr.child_count || '0', 10)), 0), color: "#f59e0b", tint: "rgba(245,158,11,0.10)", icon: <Target style={{ width: 15, height: 15 }} /> }
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

            {/* Table or Grid */}
            {viewMode === 'list' ? (
              <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 0, overflow: 'hidden' }}>
                <Table
                  className="ts-table"
                  dataSource={filteredData}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  loading={loading}
                  scroll={{ x: 'max-content' }}
                  onRow={(record) => ({
                    onClick: () => router.push(`/qa-workspace/test-cases/${record.id}`),
                    style: { cursor: 'pointer', background: 'transparent' }
                  })}
                  locale={{ emptyText: <div style={{ padding: 40, color: 'var(--text-slate-400)' }}>No Test Cases found. Click "Create Test Case" to add your first test case.</div> }}
                />
              </div>
            ) : (
              <div className="pp-grid">
                {loading ? (
                  <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>Loading test cases...</div>
                ) : filteredData.length === 0 ? (
                  <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>
                    No Test Cases found.
                  </div>
                ) : (
                  filteredData.map(r => renderCaseCard(r))
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create / Edit Parent Test Case Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        maskClosable={!submitting}
      >
        <style>{formStyles}</style>
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Drawer Header */}
          <div
            className="customer-drawer-header"
            style={{
              padding: "16px 24px 12px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 0,
                  background: editingId ? "rgba(245, 158, 11, 0.10)" : "rgba(59, 130, 246, 0.10)",
                  color: editingId ? "#f59e0b" : "var(--premium-blue, #2563eb)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {editingId ? <Pencil size={20} /> : <PlusOutlined style={{ fontSize: 20 }} />}
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
                  {editingId ? "Edit Test Case" : "Create Test Case"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary, var(--text-slate-500))", fontWeight: 500, marginTop: 2 }}>
                  {editingId
                    ? `Update test case details & ownership`
                    : "Configure a new Test Case and assign ownership"}
                </div>
              </div>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={() => setDrawerVisible(false)}
              style={{ color: "var(--text-slate-500)" }}
            />
          </div>

          {/* Drawer Body */}
          <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
            <Form
              layout="vertical"
              className="customer-drawer-form"
            >
              {/* STEP 1: Scenario Information */}
              <SectionCard
                step="STEP 1"
                icon={<InfoCircleOutlined />}
                title="Test Case Information"
                subtitle="Define the test case title, target module, and feature area"
              >
                <Form.Item
                  label="Title (Test Case)"
                  required
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    placeholder="e.g., Todo Management, Authentication Flow, Billing Setup"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    size="large"
                    style={{ borderRadius: 0 }}
                  />
                </Form.Item>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Form.Item label="Module (Business Module)" style={{ marginBottom: 0 }}>
                    <SearchableDropdown
                      options={modules.map((mod: any) => ({
                        value: mod.id,
                        label: mod.module_name || mod.name || "Module",
                      }))}
                      value={formData.module_id}
                      onChange={(val: any) => setFormData({ ...formData, module_id: val })}
                      placeholder="Select business module"
                      style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                    />
                  </Form.Item>

                  <Form.Item label="Feature (Feature Name)" style={{ marginBottom: 0 }}>
                    <Input
                      placeholder="e.g., Login, Dashboard, Task Creation"
                      value={formData.feature}
                      onChange={(e) => setFormData({ ...formData, feature: e.target.value })}
                      size="large"
                      style={{ borderRadius: 0 }}
                    />
                  </Form.Item>
                </div>
              </SectionCard>

              {/* STEP 2: Ownership & Status */}
              <SectionCard
                step="STEP 2"
                icon={<UserOutlined />}
                title="Ownership & Status"
                subtitle="Specify the assigned QA owner, execution method, and active state"
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <Form.Item label="Automation (Manual / Automated)" style={{ marginBottom: 0 }}>
                    <SearchableDropdown
                      options={[
                        { value: "Manual", label: "Manual" },
                        { value: "Automated", label: "Automated" },
                      ]}
                      value={formData.automation}
                      onChange={(val: any) => setFormData({ ...formData, automation: val })}
                      placeholder="Select automation method"
                      style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                    />
                  </Form.Item>

                  <Form.Item label="Status" style={{ marginBottom: 0 }}>
                    <SearchableDropdown
                      options={[
                        { value: "Draft", label: "Draft" },
                        { value: "Ready", label: "Ready" },
                        { value: "Active", label: "Active" },
                        { value: "Deprecated", label: "Deprecated" },
                      ]}
                      value={formData.status}
                      onChange={(val: any) => setFormData({ ...formData, status: val })}
                      placeholder="Select status"
                      style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                    />
                  </Form.Item>
                </div>

                <Form.Item label="Owner (Assigned QA)" style={{ marginBottom: 0 }}>
                  <SearchableDropdown
                    options={usersList.map((u: any) => ({
                      value: u.id,
                      label: u.name || u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || 'User',
                      avatarUrl: u.avatarUrl || u.avatar || u.profile_picture || u.profilePicture || null,
                    }))}
                    value={formData.owner}
                    onChange={(val: any) => setFormData({ ...formData, owner: val })}
                    placeholder="Select Assigned QA Owner"
                    showSelectedAvatar
                    style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 0 }}
                  />
                </Form.Item>
              </SectionCard>
            </Form>
          </div>

          {/* Drawer Footer */}
          <div
            className="customer-drawer-footer"
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
              {editingId ? "Changes reflect immediately across test cases" : "Fill required fields to create test case"}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button
                onClick={() => setDrawerVisible(false)}
                style={{ borderRadius: 8, fontWeight: 600, padding: "0 18px", height: 36 }}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                loading={submitting}
                onClick={handleSaveParent}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  padding: "0 22px",
                  height: 36,
                  background: "#2563eb",
                  borderColor: "#2563eb",
                }}
              >
                {editingId ? "Save Changes" : "Create Test Case"}
              </Button>
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
        open={suitesModalVisible}
        onClose={() => {
          setSuitesModalVisible(false);
          setSelectedCaseForSuites(null);
        }}
        {...commonDrawerProps}
        width={500}
      >
        {selectedCaseForSuites && (
          <div style={{ padding: '20px 24px' }}>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 14 }}>
              Test Case <strong style={{ color: 'var(--text-slate-900)' }}>{selectedCaseForSuites.title}</strong> is currently included in the following test suites:
            </Typography.Paragraph>

            {(!selectedCaseForSuites.test_suites || selectedCaseForSuites.test_suites.length === 0) ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-slate-400)', border: '1px dashed var(--border-slate-200)', borderRadius: 8 }}>
                No detailed suite records found for this test case.
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
