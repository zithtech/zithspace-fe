"use client";

import React, { Suspense, useState, useMemo, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Tooltip, Result, Empty, Table, Tag, Row, Col, Typography, Checkbox, message, Modal, Input, Popconfirm, Form, Select, Drawer, Tabs, Dropdown } from "antd";
import { BugOutlined, InboxOutlined, PlusOutlined, SnippetsOutlined, FileTextOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, AppstoreOutlined, UnorderedListOutlined, EllipsisOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Menu, LayoutDashboard, Target, CheckSquare, Settings, FileText, Link2, Monitor, AlertCircle, CheckCircle, CheckCircle2, TrendingUp, ArrowRight, Plus, Pencil, Trash2 } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import TiptapViewer from "@/components/common/TiptapViewer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useTheme } from "@/context/ThemeContext";
import { Line } from "@ant-design/plots";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;

type TabKey = "dashboard" | "scopes" | "approvals" | "settings";

function initialsOf(name: string) {
  if (!name) return 'TS';
  const parts = name.split(' ').filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function hashCode(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

const CARD_ACCENTS = [
  ['#3b82f6', '#1d4ed8']
];

function accentFor(str: string) {
  const h = Math.abs(hashCode(str || 'default'));
  return CARD_ACCENTS[h % CARD_ACCENTS.length];
}

/* Stat tile */
const StatTile = ({ label, value, icon: Icon, color, bgColor, sub }: { label: string; value: string | number; icon: any; color: string; bgColor: string; sub?: string; }) => (
  <div className="pp-stat-card">
    <div className="pp-stat-top">
      <div className="pp-stat-left">
        <span className="pp-stat-icon" style={{ background: bgColor, color }}>
          <Icon size={14} />
        </span>
        <span className="pp-stat-label">{label}</span>
      </div>
    </div>
    <div className="pp-stat-bottom">
      <div className="pp-stat-value-wrap">
        <span className="pp-stat-value">{value}</span>
      </div>
      {sub && <span className="pp-stat-period">{sub}</span>}
    </div>
  </div>
);

/* Section header */
const SectionHeader = ({ icon: Icon, title, subtitle, right }: { icon: any; title: string; subtitle?: string; right?: React.ReactNode; }) => (
  <div className="px-4 py-2 flex items-center justify-between gap-3 border-b" style={{ borderColor: "var(--border-slate-200)", padding: '8px 16px', display: 'flex', borderBottom: '1px solid var(--border-slate-200)' }}>
    <div className="flex items-center gap-2.5 min-w-0" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.2)" }}>
        <Icon size={13} strokeWidth={2.25} />
      </div>
      <span className="text-[13px] font-semibold" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-slate-900)" }}>{title}</span>
      {subtitle && (
        <>
          <span className="h-3 w-px" style={{ width: 1, height: 12, background: "var(--border-slate-200)" }} />
          <span className="text-[10.5px] uppercase tracking-[0.08em]" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.08em', color: "var(--text-slate-500)" }}>{subtitle}</span>
        </>
      )}
    </div>
    {right}
  </div>
);

function TestScopeContent() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestScope" });

  const searchParams = useSearchParams();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>((searchParams.get("tab") as TabKey) || "dashboard");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [scopes, setScopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sprintsMap, setSprintsMap] = useState<Record<string, string>>({});
  const [previewFile, setPreviewFile] = useState<any>(null);

  const { canReadScope, canCreateScope } = usePermission();
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const tabParam = searchParams.get("tab") as TabKey;
    if (tabParam && ["dashboard", "scopes", "approvals", "settings"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && canReadScope) {
      fetchScopes();
      fetchScopeSettings();
      axios.get("/api/release-plans").then((res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        const map: Record<string, string> = {};
        data.forEach((s: any) => { if (s.id) map[s.id] = s.name; });
        setSprintsMap(map);
      }).catch(console.error);
    }
  }, [isLoading, canReadScope]);

  const fetchScopes = async () => {
    try {
      setLoading(true);
      const res: any = await axios.get("/api/v2/qa/test-scopes");
      setScopes(res.data?.data || res.data || res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this test scope?',
      content: 'This action cannot be undone.',
      okText: 'Yes, Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await axios.delete(`/api/v2/qa/test-scopes/${id}`);
          message.success('Test Scope deleted successfully');
          fetchScopes();
        } catch (error) {
          console.error(error);
          message.error('Failed to delete Test Scope');
        }
      }
    });
  };

  const performApprovalAction = async (record: any, newStatus: string) => {
    try {
      const payload = {
        ...record,
        status: newStatus,
        details: {
          ...(record.details || {}),
          approvalWorkflow: {
            ...(record.details?.approvalWorkflow || {}),
            status: newStatus === 'Approved' ? 'approved' : 'rejected'
          }
        }
      };
      await axios.put(`/api/v2/qa/test-scopes/${record.id}`, payload);
      message.success(`Test Scope ${newStatus === 'Approved' ? 'approved' : 'rejected'} successfully`);
      fetchScopes();
    } catch (error) {
      console.error(error);
      message.error(`Failed to ${newStatus === 'Approved' ? 'approve' : 'reject'} Test Scope`);
    }
  };

  // ── Settings State ──────────────────────────────────────────
  const [scopeSettings, setScopeSettings] = useState<any[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<any>(null);
  const [settingsActiveCategory, setSettingsActiveCategory] = useState<'scope_type' | 'priority' | 'status'>('scope_type');
  const [settingsForm] = Form.useForm();

  const CATEGORY_LABELS: Record<string, string> = { scope_type: 'Scope Type', priority: 'Priority', status: 'Status' };
  const COLOR_OPTIONS = [
    { value: 'default', label: 'Grey' }, { value: 'blue', label: 'Blue' }, { value: 'green', label: 'Green' },
    { value: 'orange', label: 'Orange' }, { value: 'red', label: 'Red' }, { value: 'purple', label: 'Purple' },
    { value: 'cyan', label: 'Cyan' }, { value: 'gold', label: 'Gold' },
  ];

  const fetchScopeSettings = async () => {
    setSettingsLoading(true);
    try {
      const res: any = await axios.get(`/api/v2/qa/test-scopes/settings?_t=${Date.now()}`);
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (Array.isArray(res?.data)) data = res.data;
      else if (Array.isArray(res?.data?.data)) data = res.data.data;

      console.log('Final extracted data:', data);
      setScopeSettings(data);
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally { setSettingsLoading(false); }
  };

  const openCreateSetting = () => {
    setEditingSetting(null);
    settingsForm.resetFields();
    settingsForm.setFieldsValue({ color: 'default' });
    setSettingsModalOpen(true);
  };

  const openEditSetting = (item: any) => {
    setEditingSetting(item);
    settingsForm.setFieldsValue({ value: item.value, label: item.label, color: item.color || 'default' });
    setSettingsModalOpen(true);
  };

  const handleSaveSetting = async () => {
    try {
      const values = await settingsForm.validateFields();
      if (editingSetting) {
        await axios.put(`/api/v2/qa/test-scopes/settings/${editingSetting.id}`, values);
        message.success('Updated successfully');
      } else {
        await axios.post('/api/v2/qa/test-scopes/settings', { ...values, category: settingsActiveCategory });
        message.success('Created successfully');
      }
      setSettingsModalOpen(false);
      fetchScopeSettings();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error('Failed to save');
    }
  };

  const handleDeleteSetting = async (id: string) => {
    try {
      await axios.delete(`/api/v2/qa/test-scopes/settings/${id}`);
      message.success('Deleted');
      fetchScopeSettings();
    } catch { message.error('Failed to delete'); }
  };

  useEffect(() => {
    if (activeTab === 'settings' && scopeSettings.length === 0) fetchScopeSettings();
  }, [activeTab]);

  /* Dashboard Chart Data */
  const currentYear = dayjs().year();
  const yearlyScopesMap: Record<string, number> = {};
  scopes.forEach((inv) => {
    if (!inv.created_at) return;
    const d = dayjs(inv.created_at);
    if (d.year() !== currentYear) return;
    const month = d.format("MMM");
    yearlyScopesMap[month] = (yearlyScopesMap[month] || 0) + 1;
  });
  const months = Array.from({ length: 12 }).map((_, i) => dayjs().month(i).format("MMM"));
  const yearlyScopesData = months.map((month) => ({
    month,
    scopes: yearlyScopesMap[month] || 0,
  }));

  const monthlyScopesConfig = useMemo(
    () => ({
      data: yearlyScopesData,
      xField: "month",
      yField: "scopes",
      smooth: true,
      theme: isDark ? "dark" : undefined,
      color: "#3B82F6",
      lineStyle: { lineWidth: 2.5 },
      point: {
        size: 3,
        style: {
          fill: isDark ? "#161B22" : "#fff",
          stroke: "#3B82F6",
          lineWidth: 2,
        },
      },
      area: {
        style: {
          fill: isDark
            ? "l(270) 0:rgba(59,130,246,0.25) 1:rgba(59,130,246,0.01)"
            : "l(270) 0:rgba(59,130,246,0.18) 1:rgba(59,130,246,0.02)",
        },
      },
      xAxis: {
        label: {
          style: {
            fill: isDark ? "#94a3b8" : "#64748b",
            fontSize: 11,
          },
        },
        grid: {
          line: {
            style: {
              stroke: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            },
          },
        },
      },
      yAxis: {
        label: {
          formatter: (v: string) => `${Number(v).toFixed(0)}`,
          style: {
            fill: isDark ? "#94a3b8" : "#64748b",
            fontSize: 11,
          },
        },
        grid: {
          line: {
            style: {
              stroke: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            },
          },
        },
      },
    }),
    [yearlyScopesData, isDark]
  );

  if (isLoading) return null;

  if (!canReadScope) {
    return (
      <MainLayout>
        <div style={{ padding: "100px 0", background: "var(--bg-pure-white)", minHeight: "calc(100vh - 64px)" }}>
          <Result
            status="403"
            title="403"
            subTitle="Sorry, you are not authorized to access this page."
            extra={<Button type="primary" onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>}
          />
        </div>
      </MainLayout>
    );
  }

  const columns = [
    { title: "Test Scope Name", dataIndex: "name", key: "name", render: (t: string) => <strong style={{ color: "var(--text-slate-800)" }}>{t}</strong> },
    { title: "Scope Type", dataIndex: "type", key: "type" },
    {
      title: "Status", dataIndex: "status", key: "status", render: (t: string) => {
        const s = scopeSettings.find(set => set.category === 'status' && set.value === t);
        const color = s?.color && s.color !== 'default' ? s.color : (t === 'Approved' ? 'green' : t === 'Rejected' ? 'red' : t === 'In Review' ? 'orange' : t === 'Draft' ? 'default' : 'blue');
        return <Tag color={color}>{t}</Tag>;
      }
    },
    { title: "QA Owner", dataIndex: "qa_owner", key: "qa_owner", render: (t: string) => t || '-' },
    { title: "Reviewer", key: "reviewer", render: (_: any, r: any) => r.details?.reviewer || '-' },
    { title: "Start Date", dataIndex: "start_date", key: "start_date", render: (d: any) => d ? new Date(d).toLocaleDateString() : '-' },
    { title: "End Date", dataIndex: "end_date", key: "end_date", render: (d: any) => d ? new Date(d).toLocaleDateString() : '-' },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <Tooltip title="Edit">
            <Button type="text" size="small" style={{ color: "var(--text-slate-600)" }} icon={<Pencil size={16} />} onClick={(e) => { e.stopPropagation(); router.push(`/qa-workspace/test-scope/edit/${r.id}`); }} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger size="small" icon={<Trash2 size={16} />} onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} />
          </Tooltip>
        </div>
      )
    }
  ];

  const approvalColumns = [
    { title: "Test Scope Name", dataIndex: "name", key: "name", render: (t: string) => <strong style={{ color: "var(--text-slate-800)" }}>{t}</strong> },
    { title: "Scope Type", dataIndex: "type", key: "type" },
    {
      title: "Status", dataIndex: "status", key: "status", render: (t: string) => {
        const s = scopeSettings.find(set => set.category === 'status' && set.value === t);
        const color = s?.color && s.color !== 'default' ? s.color : (t === 'Approved' ? 'green' : t === 'Rejected' ? 'red' : t === 'In Review' ? 'orange' : t === 'Draft' ? 'default' : 'blue');
        return <Tag color={color}>{t}</Tag>;
      }
    },
    { title: "QA Owner", dataIndex: "qa_owner", key: "qa_owner", render: (t: string) => t || '-' },
    { title: "Reviewer", key: "reviewer", render: (_: any, r: any) => r.details?.reviewer || '-' },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, r: any) => {
        const isProcessed = r.status === 'Approved' || r.status === 'Rejected';
        
        return (
          <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
            {isProcessed ? (
              <Button type="primary" size="small" disabled style={{ background: "var(--bg-slate-200)", borderColor: "transparent", color: "var(--text-slate-400)" }}>Approve</Button>
            ) : (
              <ConfirmDialog
                tone="success"
                title="Approve Test Scope?"
                description="Are you sure you want to approve this test scope?"
                confirmText="Approve"
                onConfirm={async () => { await performApprovalAction(r, 'Approved'); }}
              >
                <Button type="primary" size="small" style={{ background: "#10b981", borderColor: "#10b981" }}>Approve</Button>
              </ConfirmDialog>
            )}

            {isProcessed ? (
              <Button type="default" danger size="small" disabled>Reject</Button>
            ) : (
              <ConfirmDialog
                tone="danger"
                title="Reject Test Scope?"
                description="Are you sure you want to reject this test scope?"
                confirmText="Reject"
                onConfirm={async () => { await performApprovalAction(r, 'Rejected'); }}
              >
                <Button type="default" danger size="small">Reject</Button>
              </ConfirmDialog>
            )}
          </div>
        );
      }
    }
  ];

  const approvalScopes = scopes.filter(s => s.details?.approvalWorkflow?.user === user?.id && s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredScopes = scopes.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, bg: string) => (
    <div className="pp-menu-item" style={{ padding: 0 }}>
      <div className="pp-menu-ic" style={{ color, background: bg }}>{icon}</div>
      <div className="pp-menu-text">
        <div className="pp-menu-title" style={{ color }}>{title}</div>
        <div className="pp-menu-desc">{desc}</div>
      </div>
    </div>
  );

  const actionMenu = (r: any, isApprovalTab: boolean) => {
    const isProcessed = r.status === 'Approved' || r.status === 'Rejected';
    return {
      className: 'pp-action-menu',
      items: isApprovalTab ? [
        {
          key: 'approve',
          disabled: isProcessed,
          label: (
            <ConfirmDialog
              tone="success"
              title="Approve Test Scope?"
              description="Are you sure you want to approve this test scope?"
              confirmText="Approve"
              onConfirm={() => performApprovalAction(r, 'Approved')}
            >
              {menuLabel('Approve', 'Approve test scope', <CheckCircleOutlined />, '#10b981', 'rgba(16,185,129,0.12)')}
            </ConfirmDialog>
          )
        },
        {
          key: 'reject',
          disabled: isProcessed,
          danger: true,
          label: (
            <ConfirmDialog
              tone="danger"
              title="Reject Test Scope?"
              description="Are you sure you want to reject this test scope?"
              confirmText="Reject"
              onConfirm={() => performApprovalAction(r, 'Rejected')}
            >
              {menuLabel('Reject', 'Reject test scope', <CloseCircleOutlined />, '#ef4444', 'rgba(239,68,68,0.12)')}
            </ConfirmDialog>
          )
        }
      ] : [
        { key: 'edit', label: menuLabel('Edit', 'Edit test scope', <Pencil size={15} />, '#64748b', 'rgba(100,116,139,0.12)'), onClick: () => router.push(`/qa-workspace/test-scope/edit/${r.id}`) },
        { type: 'divider' as const },
        {
          key: 'delete',
          danger: true,
          label: (
            <ConfirmDialog
              tone="danger"
              title="Delete Test Scope?"
              description="Are you sure you want to delete this test scope?"
              confirmText="Delete"
              onConfirm={() => handleDelete(r.id)}
            >
              {menuLabel('Delete', 'Remove from list', <Trash2 size={15} />, '#ef4444', 'rgba(239,68,68,0.12)')}
            </ConfirmDialog>
          )
        }
      ]
    };
  };

  const renderScopeCard = (r: any, isApprovalTab: boolean) => {
    const accent = accentFor(r.name || r.id);
    const s = scopeSettings.find(set => set.category === 'status' && set.value === r.status);
    const color = s?.color && s.color !== 'default' ? s.color : (r.status === 'Approved' ? '#10b981' : r.status === 'Rejected' ? '#ef4444' : r.status === 'In Review' ? '#f59e0b' : r.status === 'Draft' ? '#64748b' : '#3b82f6');
    const isProcessed = r.status === 'Approved' || r.status === 'Rejected';

    return (
      <div key={r.id} className="pc-card" onClick={() => router.push(`/qa-workspace/test-scope/${r.id}`)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 100%)` }}>
            {initialsOf(r.name)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.name}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Type:</span>
              <span className="pc-client-val">{r.type || 'N/A'}</span>
            </div>
          </div>
          <Dropdown
            menu={actionMenu(r, isApprovalTab)}
            overlayClassName="pp-action-pop"
            trigger={['click']}
            placement="bottomRight"
          >
            <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
              <EllipsisOutlined />
            </button>
          </Dropdown>
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row">
            <span className="pc-foot-item">
              <span className="pc-foot-key">QA Owner:</span>
              <span className="pc-foot-val">{r.qa_owner || '—'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Reviewer:</span>
              <span className="pc-foot-val">{r.details?.reviewer || '—'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Start:</span>
              <span className="pc-foot-val">{r.start_date ? new Date(r.start_date).toLocaleDateString() : '—'}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">End:</span>
              <span className="pc-foot-val">{r.end_date ? new Date(r.end_date).toLocaleDateString() : '—'}</span>
            </span>
          </div>
          <div className="pc-foot-row" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="pc-foot-item">
                <span className="pc-foot-key">Status:</span>
                <span className="pc-status-tag" style={{ color, background: `${color}1A` }}>
                  {r.status}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: `
        .pp-detail-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
        }
        .pp-card-header {
          background: var(--bg-slate-50);
          padding: 12px 16px;
          font-weight: 600;
          font-size: 14px;
          color: var(--text-slate-800);
          border-bottom: 1px solid var(--border-slate-200);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pp-card-body {
          padding: 16px;
        }
        .ro-label {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 4px;
        }
        .ro-value {
          font-size: 13px;
          color: var(--text-slate-700);
        }
        
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
        
        /* Table Styles for Test Scope */
        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .ts-table .ant-table-tbody > tr:hover > td {
          background: rgba(255, 255, 255, 0.05) !important;
        }
      `}} />
      <div className="dh-shell">
        <div
          className={`dh-sidebar-backdrop ${mobileSidebarOpen ? 'is-open' : ''}`}
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden
        />

        <aside className={`dh-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo">
                <BugOutlined />
              </div>
              <div className="pp-side-head-text">
                <h1 className="pp-side-title">Scope</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>

            {canCreateScope && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/qa-workspace/test-scope/create')}
                block
                style={{ marginTop: 16, borderRadius: 6, fontWeight: 500, height: 38 }}
              >
                Create Scope
              </Button>
            )}
          </div>
          <div className="dh-sidebar-scroll">
            <button className={`pp-nav-item ${activeTab === 'dashboard' ? 'is-active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button className={`pp-nav-item ${activeTab === 'scopes' ? 'is-active' : ''}`} onClick={() => setActiveTab('scopes')}>
              <Target size={16} /> Scopes
            </button>
            <button className={`pp-nav-item ${activeTab === 'approvals' ? 'is-active' : ''}`} onClick={() => setActiveTab('approvals')}>
              <CheckSquare size={16} /> Approvals
            </button>
            <button className={`pp-nav-item ${activeTab === 'settings' ? 'is-active' : ''}`} onClick={() => setActiveTab('settings')}>
              <Settings size={16} /> Settings
            </button>
          </div>
        </aside>

        <main className="dh-main">
          <div className="dh-main-topbar" style={{ height: 'auto', minHeight: 64, padding: '12px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {activeTab === 'scopes' && (
                <>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                    All Scopes
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 2 }}>
                    Manage and track your QA test scopes
                  </span>
                </>
              )}
              {activeTab === 'settings' && (
                <>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>Settings</span>
                  <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 2 }}>Manage dropdown options for Scope Type, Priority, and Status</span>
                </>
              )}
              {activeTab === 'approvals' && (
                <>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
                    Pending Approvals
                  </span>
                  <span style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 2 }}>
                    Test scopes assigned to you for review and approval
                  </span>
                </>
              )}
              {!['scopes', 'approvals', 'settings'].includes(activeTab) && (
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-slate-800)", textTransform: 'capitalize' }}>
                  {activeTab}
                </span>
              )}
            </div>

            <div className="dh-main-controls">
              {activeTab === 'settings' && (
                <Button type="primary" icon={<Plus size={15} />} onClick={openCreateSetting}>Add Option</Button>
              )}
              {['scopes', 'approvals'].includes(activeTab) && (
                <>
                  <Input
                    placeholder="Search scopes..."
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
            {activeTab === 'scopes' && (
              <>


                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "Total Scopes", value: scopes.length, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", icon: <SnippetsOutlined style={{ fontSize: 14 }} /> },
                    { label: "In Draft", value: scopes.filter(s => s.status === 'Draft').length, color: "#64748b", tint: "rgba(100,116,139,0.10)", icon: <FileTextOutlined style={{ fontSize: 14 }} /> },
                    { label: "In Review", value: scopes.filter(s => s.status === 'In Review').length, color: "#3b82f6", tint: "rgba(59,130,246,0.10)", icon: <SendOutlined style={{ fontSize: 14 }} /> },
                    { label: "Approved", value: scopes.filter(s => s.status === 'Approved').length, color: "#10b981", tint: "rgba(16,185,129,0.10)", icon: <CheckCircleOutlined style={{ fontSize: 14 }} /> }
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', padding: '12px 16px', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: stat.tint, color: stat.color }}>{stat.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-500)' }}>{stat.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1 }}>{stat.value}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-slate-500)' }}>this week</span>
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
                      dataSource={filteredScopes}
                      columns={columns}
                      rowKey="id"
                      pagination={false}
                      loading={loading}
                      scroll={{ x: 'max-content' }}
                      onRow={(record) => ({
                        onClick: () => router.push(`/qa-workspace/test-scope/${record.id}`)
                      })}
                    />
                  </div>
                ) : (
                  <div className="pp-grid">
                    {loading ? (
                      <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>Loading...</div>
                    ) : filteredScopes.length === 0 ? (
                      <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>
                        <SnippetsOutlined style={{ fontSize: 24, marginBottom: 8 }} /><br/>
                        No scopes found
                      </div>
                    ) : (
                      filteredScopes.map(r => renderScopeCard(r, false))
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'approvals' && (
              <>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: "Approved", value: approvalScopes.filter(s => s.status === 'Approved').length, color: "#10b981", tint: "rgba(16,185,129,0.10)", icon: <CheckCircleOutlined style={{ fontSize: 14 }} /> },
                    { label: "Rejected", value: approvalScopes.filter(s => s.status === 'Rejected').length, color: "#ef4444", tint: "rgba(239,68,68,0.10)", icon: <CloseCircleOutlined style={{ fontSize: 14 }} /> },
                    { label: "Pending", value: approvalScopes.filter(s => s.status === 'In Review').length, color: "#f59e0b", tint: "rgba(245,158,11,0.10)", icon: <SendOutlined style={{ fontSize: 14 }} /> }
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', padding: '12px 16px', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, background: stat.tint, color: stat.color }}>{stat.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-slate-500)' }}>{stat.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-slate-900)', lineHeight: 1 }}>{stat.value}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-slate-500)' }}>this week</span>
                        </div>
                        <div style={{ width: 60, height: 2, background: stat.color, borderRadius: 2, opacity: 0.8 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {viewMode === 'list' ? (
                  <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 0, overflow: 'hidden' }}>
                    <Table
                      className="ts-table"
                      dataSource={approvalScopes}
                      columns={approvalColumns}
                      rowKey="id"
                      pagination={false}
                      loading={loading}
                      scroll={{ x: 'max-content' }}
                      onRow={(record) => ({
                        onClick: () => router.push(`/qa-workspace/test-scope/${record.id}`)
                      })}
                    />
                  </div>
                ) : (
                  <div className="pp-grid">
                    {loading ? (
                      <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>Loading...</div>
                    ) : approvalScopes.length === 0 ? (
                      <div className="pp-grid-loading" style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-slate-400)' }}>
                        <SendOutlined style={{ fontSize: 24, marginBottom: 8 }} /><br/>
                        No pending approvals
                      </div>
                    ) : (
                      approvalScopes.map(r => renderScopeCard(r, true))
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'dashboard' && (
              <>
                {/* STATS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
                  <StatTile label="Total Scopes" value={scopes.length} icon={FileTextOutlined} color="#3B82F6" bgColor="rgba(59,130,246,0.1)" sub="All-time" />
                  <StatTile label="Approved" value={scopes.filter(s => s.status === 'Approved').length} icon={CheckCircleOutlined} color="#10b981" bgColor="rgba(16,185,129,0.1)" sub="Completed" />
                  <StatTile label="In Review" value={scopes.filter(s => s.status === 'In Review').length} icon={SendOutlined} color="#f59e0b" bgColor="rgba(245,158,11,0.1)" sub="Pending approval" />
                  <StatTile label="In Draft" value={scopes.filter(s => s.status === 'Draft').length} icon={FileTextOutlined} color="#64748b" bgColor="rgba(100,116,139,0.1)" sub="Currently drafting" />
                </div>

                {/* CHART */}
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div className="rounded-none overflow-hidden" style={{ background: "transparent", border: "1px solid var(--border-slate-200)" }}>
                    <SectionHeader icon={TrendingUp} title="Monthly Scopes" subtitle={`Year ${currentYear}`} />
                    <div className="px-4 py-4">
                      <div style={{ height: 220 }}>
                        {loading ? (
                          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ color: 'var(--text-slate-400)' }}>Loading...</span></div>
                        ) : mounted && yearlyScopesData.length > 0 ? (
                          <Line key={theme} {...monthlyScopesConfig} />
                        ) : (
                          <div className="h-full flex items-center justify-center text-[12px]" style={{ color: "var(--text-slate-500)" }}>No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RECENT SCOPES */}
                <div className="rounded-none overflow-hidden" style={{ background: "transparent", border: "1px solid var(--border-slate-200)" }}>
                  <SectionHeader icon={FileText} title="Recent Scopes" subtitle="Latest 5" right={
                    <button type="button" onClick={() => setActiveTab('scopes')} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold transition-colors" style={{ color: "#3B82F6", background: 'none', border: 'none', cursor: 'pointer' }}>
                      View all <ArrowRight size={12} />
                    </button>
                  } />
                  <Table
                    className="dashboard-table ts-table"
                    columns={columns.filter(c => c.key !== 'actions')}
                    dataSource={scopes.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    scroll={{ x: "max-content" }}
                    onRow={(record) => ({ onClick: () => router.push(`/qa-workspace/test-scope/${record.id}`), style: { cursor: "pointer" } })}
                    locale={{
                      emptyText: (
                        <div className="py-10 text-center">
                          <FileText size={28} className="mx-auto mb-2" style={{ color: "var(--text-slate-400)" }} />
                          <div className="text-[13px] font-semibold" style={{ color: "var(--text-slate-900)" }}>No test scopes yet</div>
                          <div className="text-[11.5px] mt-1" style={{ color: "var(--text-slate-500)" }}>Create your first test scope to see it here</div>
                        </div>
                      )
                    }}
                  />
                </div>
              </>
            )}

            {activeTab === 'settings' && (
              <>
                {/* Category Tabs */}
                <Tabs
                  activeKey={settingsActiveCategory}
                  onChange={(key: any) => setSettingsActiveCategory(key as any)}
                  size="large"
                  type="line"
                  moreIcon={null}
                  tabBarStyle={{
                    background: 'transparent',
                    borderBottom: '1px solid var(--border-slate-200)',
                    padding: "0 4px",
                    marginBottom: 20
                  }}
                  items={(["scope_type", "priority", "status"] as const).map(cat => ({
                    key: cat,
                    label: (
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {CATEGORY_LABELS[cat]}
                        <Tag style={{ marginLeft: 8, fontSize: 10, padding: '0 6px', background: 'var(--bg-slate-100)', border: 'none', color: 'var(--text-slate-500)', borderRadius: 10 }}>
                          {scopeSettings.filter(s => s.category === cat).length}
                        </Tag>
                      </span>
                    )
                  }))}
                />

                {/* Table */}
                <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 0, overflow: 'hidden' }}>
                  {scopeSettings.filter(s => s.category === settingsActiveCategory).length === 0 && !settingsLoading ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-slate-400)' }}>
                      <Settings size={36} style={{ marginBottom: 12, opacity: 0.25 }} />
                      <p style={{ margin: 0, fontSize: 14 }}>No options yet for {CATEGORY_LABELS[settingsActiveCategory]}</p>
                      <p style={{ margin: '4px 0 16px', fontSize: 12, opacity: 0.7 }}>Click "Add Option" to create the first one</p>
                      <Button type="primary" icon={<Plus size={14} />} onClick={openCreateSetting}>Add Option</Button>
                    </div>
                  ) : (
                    <Table
                      className="ts-table"
                      dataSource={scopeSettings.filter(s => s.category === settingsActiveCategory)}
                      rowKey="id"
                      loading={settingsLoading}
                      pagination={false}
                      size="middle"
                      columns={[
                        {
                          title: 'Label',
                          dataIndex: 'label',
                          render: (label: string, record: any) => (
                            <Tag color={record.color || 'default'} style={{ fontSize: 13 }}>{label}</Tag>
                          ),
                        },
                        {
                          title: 'Value (Key)',
                          dataIndex: 'value',
                          render: (v: string) => <code style={{ fontSize: 12, opacity: 0.7 }}>{v}</code>,
                        },
                        {
                          title: 'Actions',
                          align: 'right' as const,
                          render: (_: any, record: any) => (
                            <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                              <Tooltip title="Edit">
                                <Button type="text" size="small" style={{ color: "var(--text-slate-500)" }} icon={<Pencil size={14} />} onClick={() => openEditSetting(record)} />
                              </Tooltip>
                              <Popconfirm title="Delete this option?" onConfirm={() => handleDeleteSetting(record.id)} okText="Delete" okButtonProps={{ danger: true }}>
                                <Tooltip title="Delete">
                                  <Button type="text" danger size="small" icon={<Trash2 size={14} />} />
                                </Tooltip>
                              </Popconfirm>
                            </span>
                          ),
                        },
                      ]}
                    />
                  )}
                </div>
              </>
            )}

            {!['dashboard', 'scopes', 'approvals', 'settings'].includes(activeTab) && (
              <div style={{ padding: 40, background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 8, textAlign: 'center' }}>
                <Empty description={`${activeTab} view coming soon`} />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <Modal
        title={editingSetting ? `Edit ${CATEGORY_LABELS[settingsActiveCategory]} Option` : `Add ${CATEGORY_LABELS[settingsActiveCategory]} Option`}
        open={settingsModalOpen}
        onCancel={() => setSettingsModalOpen(false)}
        onOk={handleSaveSetting}
        okText={editingSetting ? 'Save Changes' : 'Create'}
        width={440}
        destroyOnHidden
      >
        <Form form={settingsForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="label" label="Display Label" rules={[{ required: true, message: 'Please enter a label' }]}>
            <Input placeholder="e.g. Feature Release" />
          </Form.Item>
          <Form.Item name="value" label="Value (Key)" rules={[{ required: true, message: 'Please enter a value key' }]} extra="Can be same as label or snake_case.">
            <Input placeholder="e.g. feature_release" />
          </Form.Item>
          <Form.Item name="color" label="Badge Color">
            <Select options={COLOR_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!previewFile}
        footer={null}
        onCancel={() => setPreviewFile(null)}
        title={previewFile?.name}
        width={800}
        styles={{ body: { padding: 0 } }}
      >
        {previewFile?.url || previewFile?.thumbUrl ? (
          previewFile?.name?.toLowerCase().endsWith('.pdf') ? (
            <iframe src={previewFile.url || previewFile.thumbUrl} style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }} />
          ) : (
            <div style={{ padding: 20, background: 'var(--bg-slate-50)', display: 'flex', justifyContent: 'center' }}>
              <img src={previewFile.url || previewFile.thumbUrl} style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} alt="preview" />
            </div>
          )
        ) : (
          previewFile?.name?.toLowerCase().endsWith('.pdf') ? (
            <iframe src="data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjwwCiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCj4+Cj4+CiAgL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAogIC9UeXBlIC9Gb250CiAgL1N1YnR5cGUgL1R5cGUxCiAgL0Jhc2VGb250IC9UaW1lcy1Sb21hbgo+PgplbmRvYmoKCjUgMCBvYmoKPDwKICAvTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAo3MCA1MCBUZAovRjEgMTIgVGYKKER1bW15IFBERiBQcmV2aWV3KSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTAgMDAwMDAgbiAKMDAwMDAwMDA2MCAwMDAwMCBuIAowMDAwMDAwMTU3IDAwMDAwIG4gCjAwMDAwMDAyNTMgMDAwMDAgbiAKMDAwMDAwMDMzNiAwMDAwMCBuIAp0cmFpbGVyCjw8CiAgL1NpemUgNgogIC9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MzEKJSVFT0YK" style={{ width: '100%', height: '70vh', border: 'none', display: 'block' }} />
          ) : (
            <div style={{ padding: 60, textAlign: 'center', background: 'var(--bg-slate-50)', color: 'var(--text-slate-500)' }}>
              <InboxOutlined style={{ fontSize: 48, marginBottom: 16, color: 'var(--text-slate-300)' }} />
              <p style={{ margin: 0, fontSize: 16 }}>Image not available</p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>This file does not have a saved image URL.</p>
            </div>
          )
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .pp-stat-card {
          background: transparent; border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 10px 12px; min-height: 84px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 8px;
        }
        .pp-stat-top { display: flex; align-items: center; justify-content: space-between; }
        
        /* Grid and Segments */
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

        .pp-stat-left { display: flex; align-items: center; gap: 8px; }
        .pp-stat-icon { width: 26px; height: 26px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .pp-stat-label { font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); }
        .pp-stat-bottom { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
        .pp-stat-value-wrap { display: flex; align-items: baseline; gap: 6px; }
        .pp-stat-value { font-size: 18px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .pp-stat-period { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; }

        .dashboard-table .ant-table-thead > tr > th {
          background: transparent !important;
          color: var(--text-slate-500) !important;
          font-weight: 700 !important;
          font-size: 11px !important;
          padding: 10px 16px !important;
          letter-spacing: 0.05em !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          text-transform: uppercase !important;
        }
        .dashboard-table .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          font-size: 13px !important;
        }
        .dashboard-table .ant-table-row:hover > td {
          background: rgba(255,255,255,0.03) !important;
        }
        .dashboard-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
      `}} />
    </MainLayout>
  );
}

export default function TestScopePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20, textAlign: "center" }}>Loading test scopes...</div>}>
      <TestScopeContent />
    </Suspense>
  );
}
