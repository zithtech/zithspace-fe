"use client";

import React, { useState, useMemo, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Tooltip, Result, Empty, Table, Tag, Row, Col, Typography, Checkbox, message, Modal, Input } from "antd";
import { BugOutlined, InboxOutlined, PlusOutlined, SnippetsOutlined, FileTextOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Menu, LayoutDashboard, Target, CheckSquare, Settings, FileText, Link2, Monitor, AlertCircle, CheckCircle, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import TiptapViewer from "@/components/common/TiptapViewer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useTheme } from "@/context/ThemeContext";
import { Line } from "@ant-design/plots";
import dayjs from "dayjs";

const { Text, Paragraph } = Typography;

type TabKey = "dashboard" | "scopes" | "approvals" | "settings";

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

export default function TestScopePage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestScope" });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("scopes");
  const [scopes, setScopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sprintsMap, setSprintsMap] = useState<Record<string, string>>({});
  const [previewFile, setPreviewFile] = useState<any>(null);

  const { canReadBug } = usePermission();
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && canReadBug) {
      fetchScopes();
      axios.get("/api/release-plans").then((res: any) => {
        const data = Array.isArray(res) ? res : (res.data || []);
        const map: Record<string, string> = {};
        data.forEach((s: any) => { if(s.id) map[s.id] = s.name; });
        setSprintsMap(map);
      }).catch(console.error);
    }
  }, [isLoading, canReadBug]);

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

  if (!canReadBug) {
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
    { title: "Description", key: "description", render: (_: any, r: any) => r.details?.description || '-' },
    { title: "Scope Type", dataIndex: "type", key: "type" },
    { title: "Priority", dataIndex: "priority", key: "priority", render: (t: string) => <Tag color={t === 'Critical' ? 'red' : t === 'High' ? 'orange' : 'blue'}>{t}</Tag> },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "QA Owner", dataIndex: "qa_owner", key: "qa_owner", render: (t: string) => t || '-' },
    { title: "Reviewer", key: "reviewer", render: (_: any, r: any) => r.details?.reviewer || '-' },
    { title: "Planned Start Date", dataIndex: "start_date", key: "start_date", render: (d: any) => d ? new Date(d).toLocaleDateString() : '-' },
    { title: "Planned End Date", dataIndex: "end_date", key: "end_date", render: (d: any) => d ? new Date(d).toLocaleDateString() : '-' },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="link" size="small" style={{ padding: 0 }} onClick={(e) => { e.stopPropagation(); router.push(`/qa-workspace/test-scope/edit/${r.id}`); }}>Edit</Button>
          <Button type="link" danger size="small" style={{ padding: 0 }} onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}>Delete</Button>
        </div>
      )
    }
  ];

  const approvalColumns = [
    { title: "Test Scope Name", dataIndex: "name", key: "name", render: (t: string) => <strong style={{ color: "var(--text-slate-800)" }}>{t}</strong> },
    { title: "Description", key: "description", render: (_: any, r: any) => r.details?.description || '-' },
    { title: "Scope Type", dataIndex: "type", key: "type" },
    { title: "Priority", dataIndex: "priority", key: "priority", render: (t: string) => <Tag color={t === 'Critical' ? 'red' : t === 'High' ? 'orange' : 'blue'}>{t}</Tag> },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "QA Owner", dataIndex: "qa_owner", key: "qa_owner", render: (t: string) => t || '-' },
    { title: "Reviewer", key: "reviewer", render: (_: any, r: any) => r.details?.reviewer || '-' },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, r: any) => {
        if (r.status === 'Approved') {
          return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', fontSize: 13, fontWeight: 500 }}>
              <CheckCircleOutlined style={{ fontSize: 14 }} /> Approved
            </div>
          );
        }
        if (r.status === 'Rejected') {
          return (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: 13, fontWeight: 500 }}>
              <CloseCircleOutlined style={{ fontSize: 14 }} /> Rejected
            </div>
          );
        }
        return (
          <div style={{ display: 'flex', gap: 12 }} onClick={(e) => e.stopPropagation()}>
            <ConfirmDialog
              tone="success"
              title="Approve Test Scope?"
              description="Are you sure you want to approve this test scope?"
              confirmText="Approve"
              onConfirm={async () => { await performApprovalAction(r, 'Approved'); }}
            >
              <Button type="primary" size="small">Approve</Button>
            </ConfirmDialog>

            <ConfirmDialog
              tone="danger"
              title="Reject Test Scope?"
              description="Are you sure you want to reject this test scope?"
              confirmText="Reject"
              onConfirm={async () => { await performApprovalAction(r, 'Rejected'); }}
            >
              <Button type="primary" danger size="small">Reject</Button>
            </ConfirmDialog>
          </div>
        );
      }
    }
  ];

  const approvalScopes = scopes.filter(s => s.details?.approvalWorkflow?.user === user?.id && s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredScopes = scopes.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const expandedRowRender = (record: any) => {
    const d = record.details || {};
    return (
      <div style={{ padding: "16px 24px", background: "var(--bg-slate-50)", borderTop: "1px solid var(--border-slate-200)", borderBottom: "1px solid var(--border-slate-200)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 1000, margin: "0 auto" }}>

          {/* 1. Product Information */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><Target size={16} /> 1. Product Information</div>
            <div className="pp-card-body">
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <div className="ro-label">Product</div>
                  <div className="ro-value">{d.product || '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">Modules</div>
                  <div className="ro-value">{d.modules?.length ? d.modules.join(', ') : '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">Features</div>
                  <div className="ro-value">{d.features?.length ? d.features.join(', ') : '-'}</div>
                </Col>
                <Col span={12}>
                  <div className="ro-label">Sprint</div>
                  <div className="ro-value">{d.sprint ? (sprintsMap[d.sprint] || d.sprint) : '-'}</div>
                </Col>
                <Col span={12}>
                  <div className="ro-label">Release Version</div>
                  <div className="ro-value">{d.releaseVersion || '-'}</div>
                </Col>
              </Row>
            </div>
          </div>

          {/* 2. Requirement References */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><Link2 size={16} /> 2. Requirement References</div>
            <div className="pp-card-body">
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <div className="ro-label">PRD</div>
                  <div className="ro-value">{d.reqReferences?.prd ? <a href={d.reqReferences.prd} target="_blank" rel="noreferrer">View PRD</a> : '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">Figma</div>
                  <div className="ro-value">{d.reqReferences?.figma ? <a href={d.reqReferences.figma} target="_blank" rel="noreferrer">View Figma</a> : '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">API Documentation</div>
                  <div className="ro-value">{d.reqReferences?.apiDoc ? <a href={d.reqReferences.apiDoc} target="_blank" rel="noreferrer">View API Doc</a> : '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">User Story</div>
                  <div className="ro-value">{d.reqReferences?.userStory ? <a href={d.reqReferences.userStory} target="_blank" rel="noreferrer">View User Story</a> : '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">Epic</div>
                  <div className="ro-value">{d.reqReferences?.epic ? <a href={d.reqReferences.epic} target="_blank" rel="noreferrer">View Epic</a> : '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">Dev Ticket</div>
                  <div className="ro-value">{d.reqReferences?.devTicket ? <a href={d.reqReferences.devTicket} target="_blank" rel="noreferrer">View Ticket</a> : '-'}</div>
                </Col>
              </Row>
            </div>
          </div>

          {/* 3. Scope Definition */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><FileText size={16} /> 3. Scope Definition</div>
            <div className="pp-card-body">
              <Row gutter={24}>
                <Col span={12}>
                  <div className="ro-label" style={{ marginBottom: 8 }}>In Scope</div>
                  <div className="ro-value">
                    {d.inScope ? <TiptapViewer content={d.inScope} /> : '-'}
                  </div>
                </Col>
                <Col span={12}>
                  <div className="ro-label" style={{ marginBottom: 8 }}>Out of Scope</div>
                  <div className="ro-value">
                    {d.outScope ? <TiptapViewer content={d.outScope} /> : '-'}
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          {/* 4. Testing Types */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><CheckSquare size={16} /> 4. Testing Types</div>
            <div className="pp-card-body">
              <div className="ro-value">
                {d.testingTypes?.length ? d.testingTypes.map((t: string) => <Tag color="blue" key={t}>{t}</Tag>) : '-'}
              </div>
            </div>
          </div>

          {/* 5. Environment Details */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><Monitor size={16} /> 5. Environment Details</div>
            <div className="pp-card-body">
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <div className="ro-label">Environment</div>
                  <div className="ro-value">{d.environment?.type || '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">Build Version</div>
                  <div className="ro-value">{d.environment?.buildVersion || '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">API Version</div>
                  <div className="ro-value">{d.environment?.apiVersion || '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">Database</div>
                  <div className="ro-value">{d.environment?.database || '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">Browser</div>
                  <div className="ro-value">{d.environment?.browser?.length ? d.environment.browser.join(', ') : '-'}</div>
                </Col>
                <Col span={8}>
                  <div className="ro-label">OS</div>
                  <div className="ro-value">{d.environment?.os?.length ? d.environment.os.join(', ') : '-'}</div>
                </Col>
                <Col span={24}>
                  <div className="ro-label">Device</div>
                  <div className="ro-value">{d.environment?.device?.length ? d.environment.device.join(', ') : '-'}</div>
                </Col>
              </Row>
            </div>
          </div>

          {/* 6. Dependencies */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><AlertCircle size={16} /> 6. Dependencies</div>
            <div className="pp-card-body">
              {d.dependencies?.length ? (
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {d.dependencies.map((dep: any, i: number) => (
                    <li key={i} className="ro-value">
                      <strong>{dep.name}</strong> — <Tag color={dep.status === 'ready' ? 'green' : dep.status === 'blocked' ? 'red' : 'orange'}>{dep.status}</Tag>
                    </li>
                  ))}
                </ul>
              ) : '-'}
            </div>
          </div>

          {/* 7. Acceptance Criteria */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><CheckCircle size={16} /> 7. Acceptance Criteria</div>
            <div className="pp-card-body">
              {d.acceptanceCriteria?.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {d.acceptanceCriteria.map((ac: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <Checkbox disabled />
                      <span className="ro-value" style={{ marginTop: 2, lineHeight: 1.4 }}>{ac}</span>
                    </div>
                  ))}
                </div>
              ) : '-'}
            </div>
          </div>

          {/* 8. Exit Criteria */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><CheckCircle2 size={16} /> 8. Exit Criteria</div>
            <div className="pp-card-body">
              <div className="ro-value">
                {d.exitCriteria?.length ? d.exitCriteria.map((t: string) => <Tag color="purple" key={t}>{t}</Tag>) : '-'}
              </div>
            </div>
          </div>

          {/* 9. Linked Items */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><Link2 size={16} /> 9. Linked Items</div>
            <div className="pp-card-body">
              <Row gutter={[24, 16]}>
                {[
                  { key: 'testSuites', label: 'Linked Test Suites' },
                  { key: 'testCases', label: 'Linked Test Cases' },
                  { key: 'bugSheets', label: 'Linked Bug Sheets' },
                  { key: 'devTickets', label: 'Linked Development Tickets' },
                  { key: 'sprints', label: 'Linked Sprints' }
                ].map(field => {
                  const item = d.linkedItems?.[field.key];
                  if (!item?.link && !item?.name) return null;
                  return (
                    <Col span={8} key={field.key}>
                      <div className="ro-label">{field.label}</div>
                      <div className="ro-value">
                        {item.link ? <a href={item.link} target="_blank" rel="noreferrer">{item.name || item.link}</a> : item.name}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>

          {/* 10. Attachments */}
          <div className="pp-detail-card">
            <div className="pp-card-header"><InboxOutlined style={{ marginRight: 8 }} /> 10. Attachments</div>
            <div className="pp-card-body">
              <Row gutter={[24, 16]}>
                {[
                  { key: 'screenshots', label: 'Screenshots' },
                  { key: 'designFiles', label: 'Design Files' },
                  { key: 'sampleData', label: 'Sample Data' },
                  { key: 'excelFiles', label: 'Excel Files' },
                  { key: 'pdfs', label: 'PDFs' }
                ].map(field => {
                  const files = d.attachments?.[field.key];
                  if (!files || !Array.isArray(files) || files.length === 0) return null;
                  return (
                    <Col span={8} key={field.key}>
                      <div className="ro-label">{field.label}</div>
                      <div className="ro-value" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {files.map((f: any, i: number) => (
                          <div key={i} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <InboxOutlined style={{ color: 'var(--text-slate-400)' }} />
                            <a 
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewFile(f); }} 
                              style={{ cursor: 'pointer', color: '#3b82f6', textDecoration: 'none' }}
                            >
                              {f.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    </Col>
                  );
                })}
              </Row>
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
                <h1 className="pp-side-title">Test Scope</h1>
                <p className="pp-side-subtitle">QA Workspace</p>
              </div>
            </div>

            {canReadBug && (
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
              {!['scopes', 'approvals'].includes(activeTab) && (
                <span style={{ fontSize: 16, fontWeight: 600, color: "var(--text-slate-800)", textTransform: 'capitalize' }}>
                  {activeTab}
                </span>
              )}
            </div>

            <div className="dh-main-controls">
              {['scopes', 'approvals'].includes(activeTab) && (
                <Input
                  placeholder="Search scopes..."
                  prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250, borderRadius: 6 }}
                />
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

                {/* Table */}
                <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 0, overflow: 'hidden' }}>
                  <Table
                    className="ts-table"
                    dataSource={filteredScopes}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                      expandedRowRender,
                      expandRowByClick: true,
                    }}
                  />
                </div>
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

                <div style={{ background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 0, overflow: 'hidden' }}>
                  <Table
                    className="ts-table"
                    dataSource={approvalScopes}
                    columns={approvalColumns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                    scroll={{ x: 'max-content' }}
                    expandable={{
                      expandedRowRender,
                      expandRowByClick: true,
                    }}
                  />
                </div>
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
                    onRow={(record) => ({ onClick: () => router.push(`/qa-workspace/test-scope/edit/${record.id}`), style: { cursor: "pointer" } })}
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

            {!['dashboard', 'scopes', 'approvals'].includes(activeTab) && (
              <div style={{ padding: 40, background: 'transparent', border: '1px solid var(--border-slate-200)', borderRadius: 8, textAlign: 'center' }}>
                <Empty description={`${activeTab} view coming soon`} />
              </div>
            )}
          </div>
        </main>
      </div>

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
