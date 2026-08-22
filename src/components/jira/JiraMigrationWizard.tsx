import React, { useState, useEffect } from "react";
import { Drawer, Steps, Button, Typography, Space, Progress, Table, Tag } from "antd";
import { api } from "@/lib/axios";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import SearchableDropdown from "@/components/common/SearchableDropdown";

const { Title, Text } = Typography;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function JiraMigrationWizard({ visible, onClose }: Props) {
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
      setZukvoStatuses((zStats as any) || []);
      const initialStatusMap: Record<string, string> = {};
      ((jStats as any) || []).forEach((s: any) => { initialStatusMap[s.id] = ""; });
      setStatusMapping(initialStatusMap);

      setJiraUsers((jUsers as any) || []);
      setZukvoUsers((zUsers as any) || []);
      const initialUserMap: Record<string, string> = {};
      ((jUsers as any) || []).forEach((u: any) => { initialUserMap[u.accountId] = ""; });
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

  const steps = [
    { title: "Projects" },
    { title: "Filters" },
    { title: "Preview" },
    { title: "Statuses" },
    { title: "Users" },
    { title: "Review" }
  ];

  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <Title level={4} style={{ marginBottom: 24 }}>Select Projects to Migrate</Title>
            <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Search Jira Projects</Text>
              <SearchableDropdown
                mode="multiple"
                style={{ width: '100%', marginBottom: 16 }}
                width="100%"
                value={selectedProjects}
                onChange={setSelectedProjects}
                options={projects.map(p => ({ label: `${p.name} (${p.key})`, value: p.key }))}
                placeholder="Search by project name or key..."
                allowClear
              />
              
              {selectedProjects.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px dashed var(--border-color)' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Selected ({selectedProjects.length})</Text>
                  <Space size={[8, 8]} wrap>
                    {selectedProjects.map(key => {
                      const p = projects.find(x => x.key === key);
                      return (
                        <Tag 
                          key={key} 
                          closable 
                          onClose={() => setSelectedProjects(prev => prev.filter(k => k !== key))}
                          style={{ padding: '4px 12px', fontSize: 13, borderRadius: 16, background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', color: 'var(--primary-color)' }}
                        >
                          {p?.name || key} ({key})
                        </Tag>
                      );
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
            <Title level={4} style={{ marginBottom: 24 }}>Advanced Filter Scope</Title>
            
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Saved Jira Filter</Text>
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

              <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Statuses</Text>
                <SearchableDropdown 
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }} 
                  width="100%"
                  placeholder="Any Status"
                  value={selectedStatuses} 
                  onChange={setSelectedStatuses}
                  options={jiraStatuses.map(s => ({ label: s.name, value: s.name }))}
                />
                {selectedStatuses.length > 0 && (
                  <Space size={[8, 8]} wrap style={{ marginTop: 12 }}>
                    {selectedStatuses.map(s => (
                      <Tag key={s} closable onClose={() => setSelectedStatuses(prev => prev.filter(x => x !== s))} color="blue" style={{ borderRadius: 12, padding: '2px 10px' }}>{s}</Tag>
                    ))}
                  </Space>
                )}
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Assignees</Text>
                <SearchableDropdown 
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }} 
                  width="100%"
                  placeholder="Any Assignee"
                  value={selectedUsers} 
                  onChange={setSelectedUsers}
                  options={jiraUsers.map(u => ({ label: `${u.displayName} (${u.emailAddress || 'No Email'})`, value: u.accountId }))}
                />
                {selectedUsers.length > 0 && (
                  <Space size={[8, 8]} wrap style={{ marginTop: 12 }}>
                    {selectedUsers.map(u => {
                      const user = jiraUsers.find(x => x.accountId === u);
                      return (
                        <Tag key={u} closable onClose={() => setSelectedUsers(prev => prev.filter(x => x !== u))} color="purple" style={{ borderRadius: 12, padding: '2px 10px' }}>
                          {user?.displayName || u}
                        </Tag>
                      );
                    })}
                  </Space>
                )}
              </div>

              <div style={{ background: 'var(--bg-elevated)', padding: 24, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                <Text strong style={{ display: 'block', marginBottom: 8, color: 'var(--text-primary)' }}>Sprints</Text>
                <SearchableDropdown 
                  mode="multiple"
                  allowClear
                  style={{ width: '100%' }} 
                  width="100%"
                  placeholder="Any Sprint"
                  value={selectedSprints} 
                  onChange={setSelectedSprints}
                  options={sprints.map(s => ({ 
                    label: `${s.name} (${s.state}) ${s.startDate ? new Date(s.startDate).toLocaleDateString() : ''}`, 
                    value: String(s.id) 
                  }))}
                />
                {selectedSprints.length > 0 && (
                  <Space size={[8, 8]} wrap style={{ marginTop: 12 }}>
                    {selectedSprints.map(s => {
                      const sprint = sprints.find(x => String(x.id) === String(s));
                      return (
                        <Tag key={s} closable onClose={() => setSelectedSprints(prev => prev.filter(x => x !== s))} color="cyan" style={{ borderRadius: 12, padding: '2px 10px' }}>
                          {sprint?.name || s}
                        </Tag>
                      );
                    })}
                  </Space>
                )}
              </div>
            </Space>
          </div>
        );
      case 2:
        return (
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <Title level={4} style={{ marginBottom: 24 }}>Preview Tickets ({previewTotal} total found)</Title>
            <div className="pp-table-wrap">
              <Table 
                dataSource={previewIssues} 
                rowKey="id"
                className="saas-table tl-table"
                pagination={{ 
                  current: previewPage, 
                  pageSize: PREVIEW_SIZE, 
                  total: previewTotal,
                  onChange: (page) => fetchPreview(page)
                }}
                columns={[
                  { title: "Key", dataIndex: "key", width: 120 },
                  { title: "Summary", dataIndex: ["fields", "summary"] },
                  { title: "Type", dataIndex: ["fields", "issuetype", "name"], width: 150 },
                  { title: "Status", dataIndex: ["fields", "status", "name"], width: 150 }
                ]}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={4}>Map Statuses</Title>
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Map your Jira workflow statuses to Zukvo statuses.</p>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <Space direction="vertical" style={{ width: '100%', maxHeight: 450, overflow: 'auto' }} size="middle">
                {jiraStatuses.map(js => (
                  <div key={js.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Tag color="blue">{js.name}</Tag>
                      <span style={{ color: 'var(--text-secondary)' }}>→</span>
                    </div>
                    <SearchableDropdown 
                      allowClear
                      placeholder="Select Zukvo Status"
                      style={{ width: 300 }}
                      width={300}
                      value={statusMapping[js.id]}
                      onChange={(v) => setStatusMapping(prev => ({...prev, [js.id]: v}))}
                      options={zukvoStatuses.map(zs => ({ label: zs.name, value: zs.id }))}
                    />
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
            <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Map Jira users to Zukvo employees to preserve assignees.</p>
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border-color)', padding: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
              <Space direction="vertical" style={{ width: '100%', maxHeight: 450, overflow: 'auto' }} size="middle">
                {jiraUsers.map(ju => (
                  <div key={ju.accountId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-base)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 12, marginRight: 24 }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong>{ju.displayName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{ju.emailAddress || 'No Email'}</Text>
                      </div>
                      <span style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }}>→</span>
                    </div>
                    <SearchableDropdown 
                      allowClear
                      placeholder="Select Zukvo Employee"
                      style={{ width: 300, flexShrink: 0 }}
                      width={300}
                      value={userMapping[ju.accountId]}
                      onChange={(v) => setUserMapping(prev => ({...prev, [ju.accountId]: v}))}
                      options={zukvoUsers.map(zu => ({ label: `${zu.name} (${zu.email})`, value: zu.id }))}
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
                  <Text type="secondary">Total tickets to import</Text>
                  <Text strong style={{ color: 'var(--primary-color)', fontSize: 18 }}>{previewTotal}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                  <Text type="secondary">Mapped statuses</Text>
                  <Text strong>{Object.values(statusMapping).filter(Boolean).length} of {jiraStatuses.length}</Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
                  <Text type="secondary">Mapped users</Text>
                  <Text strong>{Object.values(userMapping).filter(Boolean).length} of {jiraUsers.length}</Text>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}>
                  <Text type="secondary">Generated JQL</Text>
                  <code style={{ background: 'var(--bg-base)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {buildJql()}
                  </code>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const drawerFooter = !migrating ? (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '8px 16px' }}>
      {currentStep > 0 && <Button size="large" onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>}
      <Button size="large" type="primary" onClick={handleNext} disabled={currentStep === 0 && selectedProjects.length === 0} style={{ minWidth: 120 }}>
        {currentStep === 5 ? "Start Migration" : "Continue"}
      </Button>
    </div>
  ) : null;

  return (
    <Drawer
      title={migrating ? "Migration in Progress" : "Jira Migration Wizard"}
      open={visible}
      onClose={migrating ? undefined : onClose}
      width={1200}
      closable={!migrating}
      maskClosable={!migrating}
      bodyStyle={{ background: 'var(--bg-base)', padding: 0 }}
      headerStyle={{ borderBottom: '1px solid var(--border-color)' }}
      footer={drawerFooter}
    >
      {migrating ? (
        <div style={{ textAlign: "center", padding: "100px 0", height: '100%', background: 'var(--bg-base)' }}>
          <Progress type="circle" percent={progress} strokeColor="var(--primary-color)" />
          <Title level={4} style={{ marginTop: 32, color: 'var(--text-primary)' }}>Importing Jira data into Zukvo...</Title>
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
                style={{ maxWidth: 900, margin: '0 auto' }}
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
