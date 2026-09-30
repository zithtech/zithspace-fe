import React, { useState, useEffect } from "react";
import { Drawer, Steps, Button, Typography, Space, Progress, Table, Tag, Tooltip, Pagination, message } from "antd";
import {
  SyncOutlined,
  CheckCircleFilled,
  CopyOutlined,
  CheckOutlined,
  RightOutlined
} from '@ant-design/icons';
import {
  Blocks,
  Users,
  Layers,
  Repeat,
  CheckCircle2,
  Filter,
  Eye,
  ArrowRight,
  Sparkles,
  Database,
  FileText,
  Copy,
  Check,
  X,
  Sliders,
  FolderGit2,
  Terminal,
  Tag as LucideTag
} from "lucide-react";
import { api } from "@/lib/axios";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import SearchableDropdown from "@/components/common/SearchableDropdown";
import { useProduct } from "@/context/ProductContext";

const { Title, Text } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function JiraMigrationWizard({ visible, onClose }: Props) {
  const { manifest } = useProduct();
  const brandName = manifest?.name || "Zukvo";

  const [currentStep, setCurrentStep] = useState(0);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Data State
  const [projects, setProjects] = useState<any[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [previewIssues, setPreviewIssues] = useState<any[]>([]);
  const [previewTotal, setPreviewTotal] = useState(0);

  const [jiraStatuses, setJiraStatuses] = useState<any[]>([]);
  const [zukvoStatuses, setZukvoStatuses] = useState<any[]>([]);

  const [jiraUsers, setJiraUsers] = useState<any[]>([]);
  const [zukvoUsers, setZukvoUsers] = useState<any[]>([]);

  // Selection State
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedSprints, setSelectedSprints] = useState<string[]>([]);

  const [statusMapping, setStatusMapping] = useState<Record<string, string>>({});
  const [userMapping, setUserMapping] = useState<Record<string, string>>({});

  // UI state
  const [copiedJql, setCopiedJql] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const PREVIEW_SIZE = 10;

  useEffect(() => {
    if (visible && currentStep === 0) {
      fetchProjects();
    }
  }, [visible]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res: any = await api.get("/api/integrations/jira/projects");
      setProjects(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    setLoading(true);
    try {
      const [fRes, jStats, zStats, jUsers, zUsers, sRes] = await Promise.all([
        api.get("/api/integrations/jira/filters"),
        api.get("/api/integrations/jira/statuses"),
        api.get("/api/integrations/jira/zukvo/statuses"),
        api.get("/api/integrations/jira/users"),
        api.get("/api/integrations/jira/zukvo/users"),
        api.post("/api/integrations/jira/sprints", { projectKeys: selectedProjects })
      ]);
      setFilters((fRes as any)?.values || []);

      setJiraStatuses((jStats as any) || []);
      const zStatsArr = (zStats as any) || [];
      setZukvoStatuses(zStatsArr);

      const initialStatusMap: Record<string, string> = {};
      ((jStats as any) || []).forEach((s: any) => {
        const match = zStatsArr.find((zs: any) => zs.name && s.name && zs.name.toLowerCase() === s.name.toLowerCase());
        initialStatusMap[s.id] = match ? match.id : "";
      });
      setStatusMapping(initialStatusMap);

      setJiraUsers((jUsers as any) || []);
      setZukvoUsers((zUsers as any) || []);
      const zUsersArr = (zUsers as any) || [];
      const initialUserMap: Record<string, string> = {};
      ((jUsers as any) || []).forEach((u: any) => {
        const match = zUsersArr.find((zu: any) => zu.email && u.emailAddress && zu.email.toLowerCase() === u.emailAddress.toLowerCase());
        initialUserMap[u.accountId] = match ? match.id : "";
      });
      setUserMapping(initialUserMap);

      setSprints(Array.isArray(sRes) ? sRes : (sRes as any)?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const buildJql = () => {
    const jqlParts = [];
    if (selectedProjects.length > 0) {
      jqlParts.push(`project IN (${selectedProjects.map(p => `"${p}"`).join(',')})`);
    }
    if (selectedFilter !== "ALL") {
      jqlParts.push(`filter = ${selectedFilter}`);
    }
    if (selectedStatuses.length > 0) {
      jqlParts.push(`status IN (${selectedStatuses.map(s => `"${s}"`).join(',')})`);
    }
    if (selectedUsers.length > 0) {
      jqlParts.push(`assignee IN (${selectedUsers.map(u => `"${u}"`).join(',')})`);
    }
    if (selectedSprints.length > 0) {
      jqlParts.push(`sprint IN (${selectedSprints.join(',')})`);
    }
    return jqlParts.join(" AND ");
  };

  const fetchPreview = async (page = 1) => {
    setLoading(true);
    try {
      const res: any = await api.post("/api/integrations/jira/tickets/preview", {
        jql: buildJql(),
        startAt: (page - 1) * PREVIEW_SIZE,
        maxResults: PREVIEW_SIZE
      });
      setPreviewIssues(res.data?.issues || res.issues || []);
      setPreviewTotal(res.data?.total || res.total || 0);
      setPreviewPage(page);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0 && selectedProjects.length === 0) return;

    if (currentStep === 0) await fetchFilters();
    if (currentStep === 1) await fetchPreview(1);

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      startMigration();
    }
  };

  const startMigration = async () => {
    setMigrating(true);
    setProgress(0);
    try {
      const res: any = await api.post("/api/integrations/jira/migrations", {
        projectKeys: selectedProjects,
        jql: buildJql(),
        statusMapping,
        userMapping
      });

      const migrationId = res.migrationId;

      const interval = setInterval(async () => {
        try {
          const progressRes: any = await api.get(`/api/integrations/jira/migrations/${migrationId}`);
          if (progressRes) {
            setProgress(progressRes.progress);
            if (progressRes.status === 'COMPLETED' || progressRes.progress >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setMigrating(false);
                setProgress(0);
                onClose();
                setCurrentStep(0);
              }, 1000);
            }
          }
        } catch (err) { console.error(err); }
      }, 2000);
    } catch (error) {
      console.error(error);
      setMigrating(false);
    }
  };

  const handleCopyJql = () => {
    navigator.clipboard.writeText(buildJql());
    setCopiedJql(true);
    message.success("JQL copied to clipboard!");
    setTimeout(() => setCopiedJql(false), 2000);
  };

  const steps = [
    { title: "Projects", icon: <FolderGit2 size={14} /> },
    { title: "Filters", icon: <Sliders size={14} /> },
    { title: "Preview", icon: <Eye size={14} /> },
    { title: "Statuses", icon: <LucideTag size={14} /> },
    { title: "Users", icon: <Users size={14} /> },
    { title: "Review", icon: <CheckCircle2 size={14} /> }
  ];

  const autoMatchedUsersCount = Object.values(userMapping).filter(Boolean).length;
  const autoMatchedStatusesCount = Object.values(statusMapping).filter(Boolean).length;

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.08) 0%, rgba(7, 71, 166, 0.04) 100%)',
              borderRadius: 20,
              padding: '28px 32px',
              border: '1px solid rgba(0, 82, 204, 0.18)',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'linear-gradient(135deg, #0052CC 0%, #0747A6 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                  }}>
                    <Blocks size={20} />
                  </div>
                  <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Select Jira Projects
                  </Title>
                </div>
                <Text style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Choose which Jira projects you want to import data from into {brandName}.
                </Text>
              </div>

              {selectedProjects.length > 0 && (
                <div style={{
                  background: 'var(--bg-base)',
                  padding: '8px 16px',
                  borderRadius: 20,
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0052CC' }} />
                  <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {selectedProjects.length} {selectedProjects.length === 1 ? 'Project' : 'Projects'} Selected
                  </Text>
                </div>
              )}
            </div>

            <div style={{
              background: 'var(--bg-base)',
              borderRadius: 20,
              border: '1px solid var(--border-color)',
              padding: 32,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text strong style={{ display: 'block', fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
                    Jira Projects
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Selecting a project will scope tickets, sprints, and custom fields to it.
                  </Text>
                </div>
                {projects.length > 0 && (
                  <Tag color="blue" style={{ borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                    {projects.length} Available
                  </Tag>
                )}
              </div>

              <SearchableDropdown
                mode="multiple"
                style={{ width: '100%' }}
                width="100%"
                value={selectedProjects}
                onChange={setSelectedProjects}
                options={projects.map(p => ({ label: `${p.name} (${p.key})`, value: p.key }))}
                placeholder="Search by project name or key..."
                allowClear
              />

              {selectedProjects.length > 0 ? (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Selected Projects ({selectedProjects.length})
                    </Text>
                    <Button type="link" size="small" onClick={() => setSelectedProjects([])} style={{ padding: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                      Clear all
                    </Button>
                  </div>

                  <Space size={[8, 10]} wrap>
                    {selectedProjects.map(key => {
                      const p = projects.find(x => x.key === key);
                      return (
                        <div
                          key={key}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 14px',
                            background: 'rgba(0, 82, 204, 0.08)',
                            border: '1px solid rgba(0, 82, 204, 0.25)',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#0052CC',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <FolderGit2 size={14} style={{ color: '#0052CC' }} />
                          <span>{p?.name || key} <strong>({key})</strong></span>
                          <button
                            onClick={() => setSelectedProjects(prev => prev.filter(k => k !== key))}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: 2,
                              borderRadius: '50%',
                              color: '#0052CC',
                              opacity: 0.7
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </Space>
                </div>
              ) : (
                <div style={{
                  marginTop: 24,
                  padding: '24px',
                  borderRadius: 14,
                  background: 'var(--bg-elevated)',
                  border: '1px dashed var(--border-color)',
                  textAlign: 'center'
                }}>
                  <Blocks size={28} style={{ color: 'var(--text-secondary)', marginBottom: 8, opacity: 0.5 }} />
                  <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                    Please select at least one Jira project to continue.
                  </Text>
                </div>
              )}
            </div>
          </div>
        );
      case 1:
        return (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ marginBottom: 24 }}>
              <Title level={4} style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                Advanced Scope & Filters
              </Title>
              <Text style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Refine ticket import parameters using Saved Filters, Statuses, Assignees, or Sprints.
              </Text>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {/* Saved Jira Filter */}
              <div style={{
                background: 'var(--bg-base)',
                borderRadius: 16,
                border: '1px solid var(--border-color)',
                padding: 24,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #0052CC, #2563eb)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0, 82, 204, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0052CC' }}>
                    <Filter size={16} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>Saved Jira Filter</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Use existing saved Jira search filter</Text>
                  </div>
                </div>
                <SearchableDropdown
                  style={{ width: '100%' }}
                  width="100%"
                  value={selectedFilter}
                  onChange={setSelectedFilter}
                  options={[
                    { label: "All Issues in Selected Projects", value: "ALL" },
                    ...filters.map(f => ({ label: f.name, value: f.id }))
                  ]}
                />
              </div>

              {/* Statuses */}
              <div style={{
                background: 'var(--bg-base)',
                borderRadius: 16,
                border: '1px solid var(--border-color)',
                padding: 24,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #10b981, #059669)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <LucideTag size={16} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>Statuses</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Filter by Jira workflow status</Text>
                  </div>
                </div>
                <SearchableDropdown
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  width="100%"
                  placeholder="Any Status (Default)..."
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                  options={jiraStatuses.map(s => ({ label: s.name, value: s.name }))}
                />
                {selectedStatuses.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="green" style={{ borderRadius: 10, padding: '2px 8px' }}>
                      {selectedStatuses.length} Statuses Selected
                    </Tag>
                  </div>
                )}
              </div>

              {/* Assignees */}
              <div style={{
                background: 'var(--bg-base)',
                borderRadius: 16,
                border: '1px solid var(--border-color)',
                padding: 24,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #8b5cf6, #7c3aed)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                    <Users size={16} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>Assignees</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Filter by Jira assignees</Text>
                  </div>
                </div>
                <SearchableDropdown
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  width="100%"
                  placeholder="Any Assignee (Default)..."
                  value={selectedUsers}
                  onChange={setSelectedUsers}
                  options={jiraUsers.map(u => ({ label: `${u.displayName} (${u.emailAddress || 'No Email'})`, value: u.accountId }))}
                />
                {selectedUsers.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="purple" style={{ borderRadius: 10, padding: '2px 8px' }}>
                      {selectedUsers.length} Assignees Selected
                    </Tag>
                  </div>
                )}
              </div>

              {/* Sprints */}
              <div style={{
                background: 'var(--bg-base)',
                borderRadius: 16,
                border: '1px solid var(--border-color)',
                padding: 24,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #06b6d4, #0891b2)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                    <Repeat size={16} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>Sprints</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Filter by Jira sprint cycles</Text>
                  </div>
                </div>
                <SearchableDropdown
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }}
                  width="100%"
                  placeholder="Any Sprint (Default)..."
                  value={selectedSprints}
                  onChange={setSelectedSprints}
                  options={sprints.map(s => ({
                    label: `${s.name} (${s.state}) ${s.startDate ? new Date(s.startDate).toLocaleDateString() : ''}`,
                    value: String(s.id)
                  }))}
                />
                {selectedSprints.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="cyan" style={{ borderRadius: 10, padding: '2px 8px' }}>
                      {selectedSprints.length} Sprints Selected
                    </Tag>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ maxWidth: 980, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header Info Banner */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
              <div>
                <Title level={4} style={{ marginBottom: 2, color: 'var(--text-primary)', fontWeight: 700 }}>
                  Preview Jira Tickets
                </Title>
                <Text style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Review the tickets returned by your JQL scope query before importing.
                </Text>
              </div>

              <div style={{
                background: 'rgba(0, 82, 204, 0.08)',
                border: '1px solid rgba(0, 82, 204, 0.2)',
                padding: '6px 16px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FileText size={15} style={{ color: '#0052CC' }} />
                <Text strong style={{ color: '#0052CC', fontSize: 13 }}>
                  Total Found: {previewTotal}
                </Text>
              </div>
            </div>

            {/* Container Card with Fixed Table Header & Fixed Bottom Pagination */}
            <div style={{
              background: 'var(--bg-base)',
              borderRadius: 16,
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {/* Table with Sticky Header & Scrollable Body */}
              <Table
                size="middle"
                dataSource={previewIssues}
                rowKey="id"
                pagination={false}
                scroll={{ y: 360 }}
                columns={[
                  {
                    title: "Key",
                    dataIndex: "key",
                    width: 140,
                    render: (key) => (
                      <Tag color="blue" style={{ borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>
                        {key}
                      </Tag>
                    )
                  },
                  {
                    title: "Summary",
                    dataIndex: ["fields", "summary"],
                    render: (text) => <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{text}</span>
                  },
                  {
                    title: "Type",
                    dataIndex: ["fields", "issuetype", "name"],
                    width: 140,
                    render: (type) => {
                      const typeLower = (type || '').toLowerCase();
                      const color = typeLower.includes('bug') ? 'red' : typeLower.includes('epic') ? 'purple' : typeLower.includes('story') ? 'green' : 'blue';
                      return (
                        <Tag color={color} style={{ borderRadius: 10, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                          {type || 'Task'}
                        </Tag>
                      );
                    }
                  },
                  {
                    title: "Status",
                    dataIndex: ["fields", "status", "name"],
                    width: 160,
                    render: (status) => (
                      <Tag style={{ borderRadius: 12, padding: '2px 10px', fontSize: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        {status || 'To Do'}
                      </Tag>
                    )
                  }
                ]}
              />

              {/* Fixed Bottom Pagination Bar */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border-color)',
                background: 'var(--bg-base)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexShrink: 0
              }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Showing <strong>{previewTotal > 0 ? (previewPage - 1) * PREVIEW_SIZE + 1 : 0}</strong> - <strong>{Math.min(previewPage * PREVIEW_SIZE, previewTotal)}</strong> of <strong>{previewTotal}</strong> tickets
                </Text>

                <Pagination
                  size="small"
                  current={previewPage}
                  pageSize={PREVIEW_SIZE}
                  total={previewTotal}
                  onChange={(page) => fetchPreview(page)}
                  showSizeChanger={false}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.08) 0%, rgba(37, 99, 235, 0.06) 100%)',
              borderRadius: 16,
              padding: '20px 24px',
              border: '1px solid rgba(0, 82, 204, 0.2)',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <Title level={4} style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                  Map Workflow Statuses
                </Title>
                <Text style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Map your Jira workflow statuses to corresponding {brandName} statuses.
                </Text>
              </div>

              {autoMatchedStatusesCount > 0 && (
                <Tag color="blue" style={{ borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  ✓ {autoMatchedStatusesCount} Auto-Matched
                </Tag>
              )}
            </div>

            <div style={{
              background: 'var(--bg-base)',
              borderRadius: 20,
              border: '1px solid var(--border-color)',
              padding: 24,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                {jiraStatuses.map(js => (
                  <div
                    key={js.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 14,
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Tag color="blue" style={{ padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                        {js.name}
                      </Tag>
                      <ArrowRight size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>

                    <SearchableDropdown
                      allowClear
                      placeholder={`Select ${brandName} Status...`}
                      style={{ width: 280 }}
                      width={280}
                      value={statusMapping[js.id]}
                      onChange={(v) => setStatusMapping(prev => ({ ...prev, [js.id]: v }))}
                      options={zukvoStatuses.map(zs => ({ label: zs.name, value: zs.id }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(0, 82, 204, 0.06) 100%)',
              borderRadius: 16,
              padding: '20px 24px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <Title level={4} style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                  Map User Accounts
                </Title>
                <Text style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Map Jira users to {brandName} users to preserve ticket assignees & reporters.
                </Text>
              </div>

              {autoMatchedUsersCount > 0 && (
                <Tag color="purple" style={{ borderRadius: 16, padding: '4px 12px', fontSize: 12, fontWeight: 600 }}>
                  🎉 {autoMatchedUsersCount} Auto-Matched by Email
                </Tag>
              )}
            </div>

            <div style={{
              background: 'var(--bg-base)',
              borderRadius: 20,
              border: '1px solid var(--border-color)',
              padding: 24,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.03)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
                {jiraUsers.map(ju => (
                  <div
                    key={ju.accountId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 20px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 14,
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, marginRight: 24 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0052CC 0%, #2563eb 100%)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: 14
                      }}>
                        {ju.displayName ? ju.displayName.charAt(0).toUpperCase() : 'J'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{ju.displayName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{ju.emailAddress || 'No email specified'}</Text>
                      </div>
                      <ArrowRight size={16} style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }} />
                    </div>

                    <SearchableDropdown
                      allowClear
                      placeholder={`Select ${brandName} User...`}
                      style={{ width: 280, flexShrink: 0 }}
                      width={280}
                      value={userMapping[ju.accountId]}
                      onChange={(v) => setUserMapping(prev => ({ ...prev, [ju.accountId]: v }))}
                      options={zukvoUsers.map(zu => ({ label: `${zu.name} (${zu.email})`, value: zu.id }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'linear-gradient(135deg, #0052CC 0%, #2563eb 100%)',
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 82, 204, 0.3)', marginBottom: 16
              }}>
                <Sparkles size={32} />
              </div>
              <Title level={3} style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: 800 }}>
                Ready to Import Jira Data!
              </Title>
              <Text style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                Double check your migration parameters below before launching the import process.
              </Text>
            </div>

            {/* Metrics Dashboard */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{
                background: 'var(--bg-base)', padding: '20px 24px', borderRadius: 16,
                border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Selected Projects
                </Text>
                <Title level={2} style={{ margin: '6px 0 0 0', color: '#0052CC', fontWeight: 700 }}>
                  {selectedProjects.length}
                </Title>
              </div>

              <div style={{
                background: 'var(--bg-base)', padding: '20px 24px', borderRadius: 16,
                border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Total Tickets to Import
                </Text>
                <Title level={2} style={{ margin: '6px 0 0 0', color: 'var(--primary-color)', fontWeight: 700 }}>
                  {previewTotal}
                </Title>
              </div>

              <div style={{
                background: 'var(--bg-base)', padding: '20px 24px', borderRadius: 16,
                border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Statuses Mapped
                </Text>
                <Title level={2} style={{ margin: '6px 0 0 0', color: '#10b981', fontWeight: 700 }}>
                  {Object.values(statusMapping).filter(Boolean).length} / {jiraStatuses.length}
                </Title>
              </div>

              <div style={{
                background: 'var(--bg-base)', padding: '20px 24px', borderRadius: 16,
                border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Users Mapped
                </Text>
                <Title level={2} style={{ margin: '6px 0 0 0', color: '#8b5cf6', fontWeight: 700 }}>
                  {Object.values(userMapping).filter(Boolean).length} / {jiraUsers.length}
                </Title>
              </div>
            </div>

            {/* Generated JQL Box */}
            <div style={{
              background: 'var(--bg-base)',
              borderRadius: 16,
              border: '1px solid var(--border-color)',
              padding: '20px 24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={16} style={{ color: '#0052CC' }} />
                  <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>Generated JQL Scope Query</Text>
                </div>
                <Button
                  size="small"
                  type="text"
                  icon={copiedJql ? <CheckOutlined style={{ color: '#10b981' }} /> : <CopyOutlined />}
                  onClick={handleCopyJql}
                  style={{ fontSize: 12 }}
                >
                  {copiedJql ? "Copied!" : "Copy JQL"}
                </Button>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid var(--border-color)',
                fontFamily: 'monospace',
                fontSize: 13,
                color: 'var(--text-primary)',
                wordBreak: 'break-all'
              }}>
                {buildJql() || 'SELECT ALL ISSUES'}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const drawerFooter = !migrating ? (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 28px',
      background: 'var(--bg-base)',
      borderTop: '1px solid var(--border-color)'
    }}>
      <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
        Step {currentStep + 1} of {steps.length}
      </Text>

      <div style={{ display: 'flex', gap: 12 }}>
        {currentStep > 0 && (
          <Button
            size="large"
            shape="round"
            onClick={() => setCurrentStep(currentStep - 1)}
            disabled={migrating}
            style={{ padding: '0 24px' }}
          >
            Back
          </Button>
        )}

        <Button
          size="large"
          shape="round"
          type="primary"
          onClick={handleNext}
          disabled={(currentStep === 0 && selectedProjects.length === 0) || migrating}
          style={{
            minWidth: 140,
            background: currentStep === 5 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #0052CC 0%, #0747A6 100%)',
            borderColor: 'transparent',
            boxShadow: '0 4px 14px rgba(0, 82, 204, 0.3)'
          }}
        >
          {currentStep === 5 ? "Start Migration 🚀" : "Continue →"}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #0052CC 0%, #0747A6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 2px 10px rgba(0, 82, 204, 0.3)'
          }}>
            <Blocks size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {migrating ? "Migration in Progress" : "Jira Import Wizard"}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
              Import Jira projects, tickets, and assignees into {brandName}
            </div>
          </div>
        </div>
      }
      open={visible}
      onClose={migrating ? undefined : onClose}
      width={960}
      closable={!migrating}
      maskClosable={!migrating}
      bodyStyle={{ background: 'var(--bg-layout)', padding: 0 }}
      headerStyle={{ borderBottom: '1px solid var(--border-color)', padding: '16px 28px', background: 'var(--bg-base)' }}
      footerStyle={{ borderTop: 'none', padding: 0 }}
      footer={drawerFooter}
    >
      {migrating ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', padding: '60px 20px', background: 'var(--bg-base)', textAlign: 'center'
        }}>
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <Progress
              type="circle"
              percent={progress}
              size={140}
              strokeColor={{
                '0%': '#0052CC',
                '100%': '#10b981',
              }}
              strokeWidth={8}
            />
          </div>

          <Title level={4} style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: 700 }}>
            Importing Jira Data into {brandName}...
          </Title>
          <Text type="secondary" style={{ fontSize: 14, maxWidth: 450 }}>
            Please wait while we transfer tickets, mapping states, and user assignees.
          </Text>
        </div>
      ) : (
        <ZukvoLoadingOverlay loading={loading} message="">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Enhanced Custom Stepper Header Bar */}
            <div style={{
              background: 'var(--bg-base)',
              padding: '24px 32px 20px 32px',
              borderBottom: '1px solid var(--border-color)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                maxWidth: 900,
                margin: '0 auto'
              }}>
                {steps.map((s, idx) => {
                  const isActive = currentStep === idx;
                  const isCompleted = currentStep > idx;
                  const isNavigable = isCompleted;

                  return (
                    <React.Fragment key={idx}>
                      <div
                        onClick={() => {
                          if (isNavigable && !migrating) {
                            setCurrentStep(idx);
                          }
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '10px 12px',
                          borderRadius: 14,
                          cursor: isNavigable ? 'pointer' : 'default',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          background: isActive
                            ? 'linear-gradient(135deg, #0052CC 0%, #0747A6 100%)'
                            : isCompleted
                            ? 'rgba(16, 185, 129, 0.08)'
                            : 'var(--bg-elevated)',
                          border: isActive
                            ? '1px solid #0052CC'
                            : isCompleted
                            ? '1px solid rgba(16, 185, 129, 0.25)'
                            : '1px solid var(--border-color)',
                          boxShadow: isActive
                            ? '0 4px 14px rgba(0, 82, 204, 0.35)'
                            : 'none',
                          transform: isActive ? 'scale(1.02)' : 'none',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          background: isActive
                            ? 'rgba(255, 255, 255, 0.25)'
                            : isCompleted
                            ? '#10b981'
                            : 'var(--bg-base)',
                          color: isActive
                            ? '#ffffff'
                            : isCompleted
                            ? '#ffffff'
                            : 'var(--text-secondary)',
                          border: !isActive && !isCompleted ? '1px solid var(--border-color)' : 'none',
                          flexShrink: 0
                        }}>
                          {isCompleted ? <Check size={12} strokeWidth={3} /> : idx + 1}
                        </div>

                        <span style={{
                          fontSize: 13,
                          fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                          color: isActive
                            ? '#ffffff'
                            : isCompleted
                            ? '#059669'
                            : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          letterSpacing: '-0.01em'
                        }}>
                          {s.title}
                        </span>
                      </div>

                      {idx < steps.length - 1 && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: currentStep > idx ? '#10b981' : 'var(--border-color)',
                          opacity: 0.6,
                          flexShrink: 0
                        }}>
                          <RightOutlined style={{ fontSize: 10 }} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Animated Progress Bar under Steps */}
              <div style={{
                maxWidth: 900,
                margin: '16px auto 0 auto',
                height: 4,
                background: 'var(--bg-elevated)',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{
                  height: '100%',
                  width: `${((currentStep) / (steps.length - 1)) * 100}%`,
                  background: 'linear-gradient(90deg, #0052CC, #10b981)',
                  borderRadius: 4,
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            </div>

            {/* Step Content */}
            <div style={{ flex: 1, padding: '36px', overflowY: 'auto' }}>
              {renderContent()}
            </div>
          </div>
        </ZukvoLoadingOverlay>
      )}
    </Drawer>
  );
}
