import React, { useState, useEffect } from "react";
import { Drawer, Steps, Button, Typography, Space, Progress, Tag, Table, Tooltip } from "antd";
import {
  ThunderboltOutlined,
  CheckCircleFilled,
  RightOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import {
  Zap,
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
  Check,
  X,
  Sliders,
  FolderGit2,
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

export default function LinearMigrationWizard({ visible, onClose }: Props) {
  const { manifest } = useProduct();
  const brandName = manifest?.name || "Zukvo";

  const [currentStep, setCurrentStep] = useState(0);
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Data State
  const [projects, setProjects] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [selectedCycles, setSelectedCycles] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [previewIssues, setPreviewIssues] = useState<any[]>([]);
  const [previewCursor, setPreviewCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const [linearStatuses, setLinearStatuses] = useState<any[]>([]);
  const [zukvoStatuses, setZukvoStatuses] = useState<any[]>([]);

  const [linearUsers, setLinearUsers] = useState<any[]>([]);
  const [zukvoUsers, setZukvoUsers] = useState<any[]>([]);

  // Selection State
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  const [statusMapping, setStatusMapping] = useState<Record<string, string>>({});
  const [userMapping, setUserMapping] = useState<Record<string, string>>({});

  // Loading States
  const [loading, setLoading] = useState(false);
  const [migrationId, setMigrationId] = useState<string | null>(null);

  useEffect(() => {
    if (visible && currentStep === 0) {
      fetchInitialData();
    }
  }, [visible]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [projRes, teamRes, cycleRes, stateRes, userRes] = await Promise.all([
        api.get("/api/integrations/linear/projects"),
        api.get("/api/integrations/linear/teams"),
        api.get("/api/integrations/linear/cycles"),
        api.get("/api/integrations/linear/states"),
        api.get("/api/integrations/linear/users")
      ]);
      setProjects(projRes || []);
      setTeams(teamRes || []);
      setCycles(cycleRes || []);
      setLinearStatuses(stateRes || []);
      setLinearUsers(userRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMappingsData = async () => {
    setLoading(true);
    try {
      const [zStats, zUsers] = await Promise.all([
        api.get("/api/integrations/jira/zukvo/statuses"),
        api.get("/api/integrations/jira/zukvo/users")
      ]);

      setZukvoStatuses(zStats || []);
      const zStatsArr = zStats || [];
      const initialStatusMap: Record<string, string> = {};
      (linearStatuses || []).forEach((s: any) => {
        const match = zStatsArr.find((zs: any) => zs.name && s.name && zs.name.toLowerCase() === s.name.toLowerCase());
        initialStatusMap[s.id] = match ? match.id : "";
      });
      setStatusMapping(initialStatusMap);

      setZukvoUsers(zUsers || []);
      const zUsersArr = zUsers || [];
      const initialUserMap: Record<string, string> = {};
      (linearUsers || []).forEach((u: any) => {
        const match = zUsersArr.find((zu: any) => zu.email && u.email && zu.email.toLowerCase() === u.email.toLowerCase());
        initialUserMap[u.id] = match ? match.id : "";
      });
      setUserMapping(initialUserMap);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreview = async (cursor: string | null = null) => {
    setLoading(true);
    try {
      const res: any = await api.post("/api/integrations/linear/tickets/preview", {
        projectIds: selectedProjects,
        teamIds: selectedTeams,
        cycleIds: selectedCycles,
        stateIds: selectedStates,
        userIds: selectedUsers,
        cursor
      });
      const data = res.data || res;
      const newIssues = data.nodes || [];
      if (cursor) {
        setPreviewIssues(prev => [...prev, ...newIssues]);
      } else {
        setPreviewIssues(newIssues);
      }
      setHasNextPage(data.pageInfo?.hasNextPage || false);
      setPreviewCursor(data.pageInfo?.endCursor || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startMigration = async () => {
    setMigrating(true);
    try {
      const status: any = await api.get('/api/integrations/linear/status');
      const integrationId = status?.integrationId || status?.id;

      const res: any = await api.post("/api/integrations/linear/migrations", {
        integrationId,
        projectIds: selectedProjects,
        teamIds: selectedTeams,
        cycleIds: selectedCycles,
        stateIds: selectedStates,
        userIds: selectedUsers,
        statusMapping,
        userMapping
      });
      if (res?.migrationId) {
        setMigrationId(res.migrationId);
        pollProgress(res.migrationId);
      }
    } catch (err) {
      console.error(err);
      setMigrating(false);
    }
  };

  const pollProgress = (id: string) => {
    const interval = setInterval(async () => {
      try {
        const res: any = await api.get(`/api/integrations/linear/migrations/${id}`);
        if (res?.progress !== undefined) {
          setProgress(res.progress);
        }
        if (res?.status === 'COMPLETED' || res?.progress === 100) {
          clearInterval(interval);
          setProgress(100);
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      setCurrentStep(1);
    } else if (currentStep === 1) {
      await fetchPreview(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      await fetchMappingsData();
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    } else if (currentStep === 5) {
      startMigration();
    }
  };

  const steps = [
    { title: 'Teams', icon: <Users size={14} /> },
    { title: 'Filters', icon: <Sliders size={14} /> },
    { title: 'Preview', icon: <Eye size={14} /> },
    { title: 'Statuses', icon: <LucideTag size={14} /> },
    { title: 'Users', icon: <Users size={14} /> },
    { title: 'Review', icon: <CheckCircle2 size={14} /> }
  ];

  const autoMatchedUsersCount = Object.values(userMapping).filter(Boolean).length;
  const autoMatchedStatusesCount = Object.values(statusMapping).filter(Boolean).length;

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(94, 106, 210, 0.08) 0%, rgba(147, 51, 234, 0.04) 100%)',
              borderRadius: 20,
              padding: '28px 32px',
              border: '1px solid rgba(94, 106, 210, 0.18)',
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
                    background: 'linear-gradient(135deg, #5E6AD2 0%, #4c51bf 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
                  }}>
                    <Zap size={20} />
                  </div>
                  <Title level={4} style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Select Linear Teams
                  </Title>
                </div>
                <Text style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  Choose which Linear teams you want to import workspace data from.
                </Text>
              </div>

              {selectedTeams.length > 0 && (
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
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                  <Text strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>
                    {selectedTeams.length} {selectedTeams.length === 1 ? 'Team' : 'Teams'} Selected
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
                    Linear Teams
                  </Text>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Selecting a team will pull issues, cycles, and states related to it.
                  </Text>
                </div>
                {teams.length > 0 && (
                  <Tag color="purple" style={{ borderRadius: 12, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                    {teams.length} Available
                  </Tag>
                )}
              </div>

              <SearchableDropdown
                mode="multiple"
                style={{ width: '100%' }}
                width="100%"
                value={selectedTeams}
                onChange={setSelectedTeams}
                options={teams.map(t => ({ label: t.name, value: t.id }))}
                placeholder="Search by team name..."
                allowClear
              />

              {selectedTeams.length > 0 ? (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Selected Teams ({selectedTeams.length})
                    </Text>
                    <Button type="link" size="small" onClick={() => setSelectedTeams([])} style={{ padding: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                      Clear all
                    </Button>
                  </div>

                  <Space size={[8, 10]} wrap>
                    {selectedTeams.map(id => {
                      const t = teams.find(team => team.id === id);
                      return t ? (
                        <div
                          key={id}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 14px',
                            background: 'rgba(94, 106, 210, 0.08)',
                            border: '1px solid rgba(94, 106, 210, 0.25)',
                            borderRadius: 20,
                            fontSize: 13,
                            fontWeight: 500,
                            color: '#5E6AD2',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <Zap size={14} style={{ color: '#5E6AD2' }} />
                          <span>{t.name}</span>
                          <button
                            onClick={() => setSelectedTeams(prev => prev.filter(tid => tid !== id))}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: 2,
                              borderRadius: '50%',
                              color: '#5E6AD2',
                              opacity: 0.7
                            }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : null;
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
                  <Users size={28} style={{ color: 'var(--text-secondary)', marginBottom: 8, opacity: 0.5 }} />
                  <Text type="secondary" style={{ display: 'block', fontSize: 13 }}>
                    Please select at least one Linear team to proceed.
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
                Fine-tune which issues are imported using Projects, Cycles, Statuses, or Assignees.
              </Text>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              {/* Projects */}
              <div style={{
                background: 'var(--bg-base)',
                borderRadius: 16,
                border: '1px solid var(--border-color)',
                padding: 24,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #5E6AD2, #8b5cf6)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(94, 106, 210, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5E6AD2' }}>
                    <FolderGit2 size={16} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>Projects</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Filter by specific Linear projects</Text>
                  </div>
                </div>
                <SearchableDropdown
                  mode="multiple"
                  style={{ width: '100%' }}
                  width="100%"
                  value={selectedProjects}
                  onChange={setSelectedProjects}
                  options={projects.map(p => ({ label: p.name, value: p.id }))}
                  placeholder="All Projects (Default)..."
                  allowClear
                />
                {selectedProjects.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="purple" style={{ borderRadius: 10, padding: '2px 8px' }}>
                      {selectedProjects.length} Filtered
                    </Tag>
                  </div>
                )}
              </div>

              {/* Cycles */}
              <div style={{
                background: 'var(--bg-base)',
                borderRadius: 16,
                border: '1px solid var(--border-color)',
                padding: 24,
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #06b6d4, #3b82f6)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                    <Repeat size={16} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>Cycles / Sprints</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Filter by active or past cycles</Text>
                  </div>
                </div>
                <SearchableDropdown
                  mode="multiple"
                  style={{ width: '100%' }}
                  width="100%"
                  value={selectedCycles}
                  onChange={setSelectedCycles}
                  options={cycles.map(c => ({ label: c.name || `Cycle ${c.number}`, value: c.id }))}
                  placeholder="All Cycles (Default)..."
                  allowClear
                />
                {selectedCycles.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="cyan" style={{ borderRadius: 10, padding: '2px 8px' }}>
                      {selectedCycles.length} Filtered
                    </Tag>
                  </div>
                )}
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
                    <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>Statuses (States)</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>e.g. In Progress, Done, Backlog</Text>
                  </div>
                </div>
                <SearchableDropdown
                  mode="multiple"
                  style={{ width: '100%' }}
                  width="100%"
                  value={selectedStates}
                  onChange={setSelectedStates}
                  options={linearStatuses.map(s => ({ label: s.name, value: s.id }))}
                  placeholder="All States (Default)..."
                  allowClear
                />
                {selectedStates.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="green" style={{ borderRadius: 10, padding: '2px 8px' }}>
                      {selectedStates.length} Filtered
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
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                    <Users size={16} />
                  </div>
                  <div>
                    <Text strong style={{ fontSize: 14, color: 'var(--text-primary)', display: 'block' }}>Assignees</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>Filter by assigned team members</Text>
                  </div>
                </div>
                <SearchableDropdown
                  mode="multiple"
                  style={{ width: '100%' }}
                  width="100%"
                  value={selectedUsers}
                  onChange={setSelectedUsers}
                  options={linearUsers.map(u => ({ label: u.name, value: u.id }))}
                  placeholder="All Assignees (Default)..."
                  allowClear
                />
                {selectedUsers.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <Tag color="gold" style={{ borderRadius: 10, padding: '2px 8px' }}>
                      {selectedUsers.length} Filtered
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
              <div>
                <Title level={4} style={{ marginBottom: 2, color: 'var(--text-primary)', fontWeight: 700 }}>
                  Preview Issues
                </Title>
                <Text style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  These Linear issues match your filter criteria and will be imported into {brandName}.
                </Text>
              </div>

              <div style={{
                background: 'rgba(94, 106, 210, 0.08)',
                border: '1px solid rgba(94, 106, 210, 0.2)',
                padding: '6px 14px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <FileText size={15} style={{ color: '#5E6AD2' }} />
                <Text strong style={{ color: '#5E6AD2', fontSize: 13 }}>
                  {previewIssues.length} Issues Loaded
                </Text>
              </div>
            </div>

            <div style={{
              background: 'var(--bg-base)',
              borderRadius: 16,
              border: '1px solid var(--border-color)',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Table
                size="middle"
                dataSource={previewIssues}
                rowKey="id"
                pagination={false}
                scroll={{ y: 360 }}
                columns={[
                  {
                    title: "Identifier",
                    dataIndex: "identifier",
                    width: 140,
                    render: (text) => (
                      <Tag color="purple" style={{ borderRadius: 8, padding: '3px 10px', fontWeight: 600, fontSize: 12 }}>
                        {text}
                      </Tag>
                    )
                  },
                  {
                    title: "Title",
                    dataIndex: "title",
                    render: (text) => <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13 }}>{text}</span>
                  },
                  {
                    title: "State",
                    dataIndex: ["state", "name"],
                    width: 160,
                    render: (state) => (
                      <Tag style={{ borderRadius: 12, padding: '2px 10px', fontSize: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        {state || 'Backlog'}
                      </Tag>
                    )
                  },
                  {
                    title: "Project",
                    dataIndex: ["project", "name"],
                    width: 180,
                    render: (proj) => proj ? (
                      <Text type="secondary" style={{ fontSize: 13 }}>{proj}</Text>
                    ) : <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>No Project</Text>
                  }
                ]}
              />

              {hasNextPage && (
                <div style={{ textAlign: 'center', padding: '14px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-base)', flexShrink: 0 }}>
                  <Button type="default" shape="round" onClick={() => fetchPreview(previewCursor)} loading={loading}>
                    Load More Issues
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(94, 106, 210, 0.06) 100%)',
              borderRadius: 16,
              padding: '20px 24px',
              border: '1px solid rgba(59, 130, 246, 0.2)',
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
                  Match your Linear workflow states to corresponding {brandName} statuses.
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
                {linearStatuses.map(ls => (
                  <div
                    key={ls.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      background: 'var(--bg-elevated)',
                      borderRadius: 14,
                      border: '1px solid var(--border-color)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Tag color="purple" style={{ padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
                        {ls.name}
                      </Tag>
                      <ArrowRight size={16} style={{ color: 'var(--text-secondary)' }} />
                    </div>

                    {(ls.type === 'backlog' || ls.name.toLowerCase() === 'backlog') ? (
                      <div style={{
                        padding: '6px 14px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        borderRadius: 10,
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <Text style={{ fontSize: 13, color: '#10b981', fontWeight: 500 }}>
                          Added to {brandName} Backlog
                        </Text>
                      </div>
                    ) : (
                      <SearchableDropdown
                        allowClear
                        placeholder={`Select ${brandName} Status...`}
                        style={{ width: 280 }}
                        width={280}
                        value={statusMapping[ls.id]}
                        onChange={(v) => setStatusMapping(prev => ({ ...prev, [ls.id]: v }))}
                        options={zukvoStatuses.map(zs => ({ label: zs.name, value: zs.id }))}
                      />
                    )}
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
              background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.08) 0%, rgba(94, 106, 210, 0.06) 100%)',
              borderRadius: 16,
              padding: '20px 24px',
              border: '1px solid rgba(147, 51, 234, 0.2)',
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
                  Assign Linear authors and assignees to matching team members in {brandName}.
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
                {linearUsers.map(lu => (
                  <div
                    key={lu.id}
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
                        background: 'linear-gradient(135deg, #5E6AD2 0%, #8b5cf6 100%)',
                        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 600, fontSize: 14
                      }}>
                        {lu.name ? lu.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{lu.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{lu.email || 'No email specified'}</Text>
                      </div>
                      <ArrowRight size={16} style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }} />
                    </div>

                    <SearchableDropdown
                      allowClear
                      placeholder={`Select ${brandName} User...`}
                      style={{ width: 280, flexShrink: 0 }}
                      width={280}
                      value={userMapping[lu.id]}
                      onChange={(v) => setUserMapping(prev => ({ ...prev, [lu.id]: v }))}
                      options={zukvoUsers.map(zu => ({ label: zu.name ? `${zu.name} (${zu.email})` : zu.email, value: zu.id }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', marginBottom: 16
              }}>
                <Sparkles size={32} />
              </div>
              <Title level={3} style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: 800 }}>
                Ready to Import Linear Data!
              </Title>
              <Text style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                Review your migration summary below before initiating the import process.
              </Text>
            </div>

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
                  Teams Selected
                </Text>
                <Title level={2} style={{ margin: '6px 0 0 0', color: '#5E6AD2', fontWeight: 700 }}>
                  {selectedTeams.length}
                </Title>
              </div>

              <div style={{
                background: 'var(--bg-base)', padding: '20px 24px', borderRadius: 16,
                border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
              }}>
                <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                  Projects Filtered
                </Text>
                <Title level={2} style={{ margin: '6px 0 0 0', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {selectedProjects.length > 0 ? selectedProjects.length : 'All Projects'}
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
                  {Object.values(statusMapping).filter(Boolean).length} / {linearStatuses.length}
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
                  {Object.values(userMapping).filter(Boolean).length} / {linearUsers.length}
                </Title>
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
          disabled={(currentStep === 0 && selectedTeams.length === 0) || migrating}
          style={{
            minWidth: 140,
            background: currentStep === 5 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #5E6AD2 0%, #4c51bf 100%)',
            borderColor: 'transparent',
            boxShadow: '0 4px 14px rgba(94, 106, 210, 0.3)'
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
            background: 'linear-gradient(135deg, #5E6AD2 0%, #312e81 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 2px 10px rgba(94, 106, 210, 0.3)'
          }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {migrating ? "Migration in Progress" : "Linear Import Wizard"}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 400 }}>
              Seamlessly import your Linear workspace issues into {brandName}
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
                '0%': '#5E6AD2',
                '100%': '#10b981',
              }}
              strokeWidth={8}
            />
          </div>

          <Title level={4} style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontWeight: 700 }}>
            Importing Linear Data into {brandName}...
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
                            ? 'linear-gradient(135deg, #5E6AD2 0%, #4c51bf 100%)'
                            : isCompleted
                            ? 'rgba(16, 185, 129, 0.08)'
                            : 'var(--bg-elevated)',
                          border: isActive
                            ? '1px solid #5E6AD2'
                            : isCompleted
                            ? '1px solid rgba(16, 185, 129, 0.25)'
                            : '1px solid var(--border-color)',
                          boxShadow: isActive
                            ? '0 4px 14px rgba(94, 106, 210, 0.35)'
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
                  background: 'linear-gradient(90deg, #5E6AD2, #10b981)',
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
