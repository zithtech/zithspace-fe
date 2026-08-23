import React, { useState, useEffect } from "react";
import { Drawer, Steps, Button, Typography, Space, Progress, Tag, Table } from "antd";
import { api } from "@/lib/axios";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import SearchableDropdown from "@/components/common/SearchableDropdown";

const { Title, Text } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function LinearMigrationWizard({ visible, onClose }: Props) {
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
      const initialStatusMap: Record<string, string> = {};
      (linearStatuses || []).forEach((s: any) => { initialStatusMap[s.id] = ""; });
      setStatusMapping(initialStatusMap);

      setZukvoUsers(zUsers || []);
      const initialUserMap: Record<string, string> = {};
      (linearUsers || []).forEach((u: any) => { initialUserMap[u.id] = ""; });
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
            window.location.reload();
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
    { title: 'Teams' },
    { title: 'Advanced Filters' },
    { title: 'Preview' },
    { title: 'Map Statuses' },
    { title: 'Map Users' },
    { title: 'Confirm' }
  ];

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={4}>Select Linear Teams</Title>
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Choose which teams you want to import data from.</p>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-primary)' }}>Search Linear Teams</Text>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Selecting a team will limit the import to issues from that team.</Text>
              <SearchableDropdown
                mode="multiple"
                style={{ width: '100%', marginBottom: 16 }}
                width="100%"
                value={selectedTeams}
                onChange={setSelectedTeams}
                options={teams.map(t => ({ label: t.name, value: t.id }))}
                placeholder="Search by team name..."
                allowClear
              />
              {selectedTeams.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border-color)' }}>
                  <Space size={[8, 8]} wrap>
                    {selectedTeams.map(id => {
                      const t = teams.find(team => team.id === id);
                      return t ? (
                        <Tag key={id} closable onClose={() => setSelectedTeams(prev => prev.filter(tid => tid !== id))} style={{ padding: '4px 10px', borderRadius: 16 }}>
                          <span style={{ fontWeight: 500 }}>{t.name}</span>
                        </Tag>
                      ) : null;
                    })}
                  </Space>
                </div>
              )}
            </div>
          </div>
        );
      case 1:
        return (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={4}>Advanced Filters</Title>
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Refine which issues to import using Projects, Cycles, Statuses, or Assignees.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Projects</Text>
                <SearchableDropdown mode="multiple" style={{ width: '100%' }} width="100%" value={selectedProjects} onChange={setSelectedProjects} options={projects.map(p => ({ label: p.name, value: p.id }))} placeholder="Filter by projects..." allowClear />
              </div>
              
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Cycles / Sprints</Text>
                <SearchableDropdown mode="multiple" style={{ width: '100%' }} width="100%" value={selectedCycles} onChange={setSelectedCycles} options={cycles.map(c => ({ label: c.name || `Cycle ${c.number}`, value: c.id }))} placeholder="Filter by cycles..." allowClear />
              </div>
              
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Statuses (States)</Text>
                <SearchableDropdown mode="multiple" style={{ width: '100%' }} width="100%" value={selectedStates} onChange={setSelectedStates} options={linearStatuses.map(s => ({ label: s.name, value: s.id }))} placeholder="Filter by states (e.g. Done, In Progress)..." allowClear />
              </div>

              <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Assignees</Text>
                <SearchableDropdown mode="multiple" style={{ width: '100%' }} width="100%" value={selectedUsers} onChange={setSelectedUsers} options={linearUsers.map(u => ({ label: u.name, value: u.id }))} placeholder="Filter by assignees..." allowClear />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={4}>Preview Tickets</Title>
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>These are the issues that match your filters and will be imported.</p>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24 }}>
              <Table 
                dataSource={previewIssues}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: "Identifier", dataIndex: "identifier", width: 120 },
                  { title: "Title", dataIndex: "title" },
                  { title: "State", dataIndex: ["state", "name"], width: 150 },
                  { title: "Project", dataIndex: ["project", "name"], width: 150 }
                ]}
              />
              {hasNextPage && (
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <Button onClick={() => fetchPreview(previewCursor)}>Load More</Button>
                </div>
              )}
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={4}>Map Statuses</Title>
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Map your Linear workflow states to Zukvo statuses.</p>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <Space direction="vertical" style={{ width: '100%', maxHeight: 450, overflow: 'auto' }} size="middle">
                {linearStatuses.map(ls => (
                  <div key={ls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Tag color="blue">{ls.name}</Tag>
                      <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    </div>
                    {(ls.type === 'backlog' || ls.name.toLowerCase() === 'backlog') ? (
                      <div style={{ width: 350, textAlign: 'right', paddingRight: 12 }}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>These tickets will be automatically added to the Zukvo Backlog.</Text>
                      </div>
                    ) : (
                      <SearchableDropdown 
                        allowClear
                        placeholder="Select Zukvo Status"
                        style={{ width: 300 }}
                        width={300}
                        value={statusMapping[ls.id]}
                        onChange={(v) => setStatusMapping(prev => ({...prev, [ls.id]: v}))}
                        options={zukvoStatuses.map(zs => ({ label: zs.name, value: zs.id }))}
                      />
                    )}
                  </div>
                ))}
              </Space>
            </div>
          </div>
        );
      case 4:
        return (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={4}>Map Users</Title>
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Map Linear users to Zukvo users to preserve assignees and reporters.</p>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <Space direction="vertical" style={{ width: '100%', maxHeight: 450, overflow: 'auto' }} size="middle">
                {linearUsers.map(lu => (
                  <div key={lu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Tag color="purple">{lu.name}</Tag>
                      <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    </div>
                    <SearchableDropdown 
                      allowClear
                      placeholder="Select Zukvo User"
                      style={{ width: 300 }}
                      width={300}
                      value={userMapping[lu.id]}
                      onChange={(v) => setUserMapping(prev => ({...prev, [lu.id]: v}))}
                      options={zukvoUsers.map(zu => ({ label: zu.name || zu.email, value: zu.id }))}
                    />
                  </div>
                ))}
              </Space>
            </div>
          </div>
        );
      case 5:
        return (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Title level={4} style={{ marginBottom: 24, textAlign: 'center' }}>Ready to Migrate!</Title>
            <div style={{ background: 'var(--bg-elevated)', padding: 32, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                  <Text type="secondary">Projects selected</Text>
                  <Text strong>{selectedProjects.length}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                  <Text type="secondary">Teams filtered</Text>
                  <Text strong>{selectedTeams.length}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                  <Text type="secondary">Mapped statuses</Text>
                  <Text strong>{Object.values(statusMapping).filter(Boolean).length} of {linearStatuses.length}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                  <Text type="secondary">Mapped users</Text>
                  <Text strong>{Object.values(userMapping).filter(Boolean).length} of {linearUsers.length}</Text>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const drawerFooter = !migrating ? (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '8px 16px' }}>
      {currentStep > 0 && <Button size="large" onClick={() => setCurrentStep(currentStep - 1)} disabled={migrating}>Back</Button>}
      <Button size="large" type="primary" onClick={handleNext} disabled={(currentStep === 0 && selectedTeams.length === 0) || migrating} style={{ minWidth: 120 }}>
        {currentStep === 5 ? "Start Migration" : "Continue"}
      </Button>
    </div>
  ) : null;

  return (
    <Drawer
      title={migrating ? "Migration in Progress" : "Linear Migration Wizard"}
      open={visible}
      onClose={migrating ? undefined : onClose}
      width={1000}
      closable={!migrating}
      maskClosable={!migrating}
      bodyStyle={{ background: 'var(--bg-base)', padding: 0 }}
      headerStyle={{ borderBottom: '1px solid var(--border-color)' }}
      footer={drawerFooter}
    >
      {migrating ? (
        <div style={{ textAlign: "center", padding: "100px 0", height: '100%', background: 'var(--bg-base)' }}>
          <Progress type="circle" percent={progress} strokeColor="var(--primary-color)" />
          <Title level={4} style={{ marginTop: 32, color: 'var(--text-primary)' }}>Importing Linear data into Zukvo...</Title>
          <Text type="secondary">This may take a few minutes depending on the volume of tickets.</Text>
        </div>
      ) : (
        <ZukvoLoadingOverlay loading={loading} message="">
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '24px 40px', borderBottom: '1px solid var(--border-color)' }}>
              <Steps 
                size="small" 
                current={currentStep} 
                items={steps} 
                style={{ maxWidth: 800, margin: '0 auto' }}
              />
            </div>
            
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
              {renderContent()}
            </div>
          </div>
        </ZukvoLoadingOverlay>
      )}
    </Drawer>
  );
}
