"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Input, Select, Checkbox, Row, Col, Upload, DatePicker, message, Modal } from "antd";
import { Target, CheckSquare, FileText, Link2, Monitor, AlertCircle, CheckCircle, CheckCircle2 } from "lucide-react";
import { InboxOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { api as axios } from "@/lib/axios";
import { useActivitySource } from "@/hooks/useActivitySource";
import TiptapEditor from "@/components/common/TiptapEditor";
import { MembersService } from "@/services/membersService";

const { TextArea } = Input;
const { Dragger } = Upload;

export default function CreateScopePage() {
  useActivitySource({ section: "WORK", module: "QA", page: "CreateTestScope" });

  const router = useRouter();
  const { canReadBug } = usePermission();
  const { isLoading } = useAuth();
  const [loadingSprints, setLoadingSprints] = useState(false);
  const [sprints, setSprints] = useState<any[]>([]);
  const [positionsList, setPositionsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [newDepName, setNewDepName] = useState('');
  const [newDepStatus, setNewDepStatus] = useState('pending');
  const [newAc, setNewAc] = useState('');
  const [newAcInput, setNewAcInput] = useState('');
  const [isAcModalVisible, setIsAcModalVisible] = useState(false);

  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'Feature Release',
    priority: 'Medium',
    status: 'Draft',
    qa_owner: '',
    start_date: null,
    end_date: null,
    details: {
      description: '',
      reviewer: '',
      product: 'Zukvo',
      modules: [],
      features: [],
      sprint: undefined,
      releaseVersion: '',
      reqReferences: {
        prd: '',
        figma: '',
        apiDoc: '',
        userStory: '',
        epic: '',
        devTicket: '',
        additionalDocs: []
      },
      inScope: '',
      outScope: '',
      testingTypes: [],
      environment: {
        type: undefined,
        buildVersion: '',
        apiVersion: '',
        database: undefined,
        browser: [],
        os: [],
        device: []
      },
      dependencies: [],
      acceptanceCriteria: [],
      exitCriteria: [],
      linkedItems: {
        testSuites: { name: '', link: '' },
        testCases: { name: '', link: '' },
        bugSheets: { name: '', link: '' },
        devTickets: { name: '', link: '' },
        sprints: { name: '', link: '' }
      },
      attachments: {
        screenshots: [],
        designFiles: [],
        sampleData: [],
        excelFiles: [],
        pdfs: []
      },
      approvalWorkflow: { position: undefined, user: undefined, status: 'pending' }
    }
  });

  useEffect(() => {
    if (!isLoading && canReadBug) {
      fetchSprints();
      fetchPositionsAndUsers();
    }
  }, [isLoading, canReadBug]);

  const fetchPositionsAndUsers = async () => {
    try {
      const posRes: any = await axios.get('/api/positions');
      setPositionsList(posRes.data || posRes || []);

      const membersRes = await MembersService.getMembers({ limit: 500 });
      setUsersList(membersRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSprints = async () => {
    try {
      setLoadingSprints(true);
      const res: any = await axios.get("/api/release-plans");
      // The custom axios client returns response.data.data directly on success
      const fetchedSprints = Array.isArray(res) ? res : (res.data || []);
      setSprints(fetchedSprints.slice(0, 5));
    } catch (err) {
      console.error("Failed to fetch sprints:", err);
    } finally {
      setLoadingSprints(false);
    }
  };

  if (isLoading) return null;
  if (!canReadBug) return <div>Unauthorized</div>;

  const updateRoot = (field: string, val: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: val }));
  };

  const updateDetail = (field: string, val: any) => {
    setFormData((prev: any) => ({
      ...prev,
      details: { ...prev.details, [field]: val }
    }));
  };

  const updateReqRef = (field: string, val: any) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        reqReferences: {
          ...prev.details.reqReferences,
          [field]: val
        }
      }
    }));
  };

  const updateEnvironment = (field: string, val: any) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        environment: {
          ...(prev.details.environment || {}),
          [field]: val
        }
      }
    }));
  };

  const updateLinkedItem = (field: string, prop: 'name' | 'link', val: string) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        linkedItems: {
          ...(prev.details.linkedItems || {}),
          [field]: {
            ...(prev.details.linkedItems?.[field] || {}),
            [prop]: val
          }
        }
      }
    }));
  };

  const updateAttachmentFiles = async (field: string, info: any) => {
    const processFile = (file: any) => {
      return new Promise((resolve) => {
        if (file.url || file.thumbUrl) {
          resolve(file);
        } else if (file.originFileObj) {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = () => {
            resolve({ ...file, url: reader.result, status: 'done' });
          };
          reader.onerror = () => resolve(file);
        } else {
          resolve(file);
        }
      });
    };

    const processedFiles = await Promise.all(info.fileList.map(processFile));

    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        attachments: {
          ...(prev.details.attachments || {}),
          [field]: processedFiles
        }
      }
    }));
  };

  const handleSave = async (status: string) => {
    if (!formData.name) {
      message.error("Test Scope Name is required");
      return;
    }
    
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        status,
        start_date: formData.start_date ? formData.start_date.format('YYYY-MM-DD') : null,
        end_date: formData.end_date ? formData.end_date.format('YYYY-MM-DD') : null,
      };

      await axios.post("/api/v2/qa/test-scopes", payload);
      message.success(`Scope ${status === 'Draft' ? 'saved as draft' : 'published'} successfully`);
      router.push("/qa-workspace/test-scope");
    } catch (error) {
      console.error(error);
      message.error("Failed to save Test Scope");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <style dangerouslySetInnerHTML={{ __html: `
        .pp-detail-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
          margin-bottom: 20px;
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
          padding: 20px;
        }
        .form-label {
          display: block;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-slate-600);
        }
        .create-scope-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px;
        }
        .header-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
      `}} />

      <div className="create-scope-container">
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-slate-900)' }}>Create Test Scope</h2>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button type="primary" onClick={() => handleSave('In Review')} loading={submitting}>Publish Scope</Button>
          </div>
        </div>

        {/* Basic Information Block */}
        <div className="pp-detail-card">
          <div className="pp-card-header">Basic Information</div>
          <div className="pp-card-body">
            <Row gutter={[24, 20]}>
              <Col span={12}>
                <span className="form-label">Test Scope Name <span style={{ color: 'red' }}>*</span></span>
                <Input placeholder="Enter name" value={formData.name} onChange={(e) => updateRoot('name', e.target.value)} />
              </Col>
              <Col span={12}>
                <span className="form-label">Description</span>
                <Input placeholder="Brief description" value={formData.details.description} onChange={(e) => updateDetail('description', e.target.value)} />
              </Col>
              <Col span={8}>
                <span className="form-label">Scope Type</span>
                <Select 
                  style={{ width: '100%' }} 
                  value={formData.type} 
                  onChange={(v) => updateRoot('type', v)}
                  options={[{ value: 'Feature Release', label: 'Feature Release' }, { value: 'Integration', label: 'Integration' }, { value: 'Bug Fix', label: 'Bug Fix' }]}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">Priority</span>
                <Select 
                  style={{ width: '100%' }} 
                  value={formData.priority} 
                  onChange={(v) => updateRoot('priority', v)}
                  options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Critical', label: 'Critical' }]}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">QA Owner</span>
                <Input placeholder="e.g. Sarah Chen" value={formData.qa_owner} onChange={(e) => updateRoot('qa_owner', e.target.value)} />
              </Col>
              <Col span={8}>
                <span className="form-label">Reviewer</span>
                <Input placeholder="e.g. Mike Ross" value={formData.details.reviewer} onChange={(e) => updateDetail('reviewer', e.target.value)} />
              </Col>
              <Col span={8}>
                <span className="form-label">Planned Start Date</span>
                <DatePicker style={{ width: '100%' }} value={formData.start_date} onChange={(v) => updateRoot('start_date', v)} />
              </Col>
              <Col span={8}>
                <span className="form-label">Planned End Date</span>
                <DatePicker style={{ width: '100%' }} value={formData.end_date} onChange={(v) => updateRoot('end_date', v)} />
              </Col>
            </Row>
          </div>
        </div>

        {/* 1. Product Information */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><Target size={16} /> 1. Product Information</div>
          <div className="pp-card-body">
            <Row gutter={[24, 20]}>
              <Col span={8}>
                <span className="form-label">Product</span>
                <Select
                  style={{ width: '100%' }}
                  options={[{ value: 'Zukvo', label: 'Zukvo' }]}
                  value={formData.details.product}
                  onChange={(v) => updateDetail('product', v)}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">Module</span>
                <Select
                  mode="multiple"
                  placeholder="Select Modules"
                  style={{ width: '100%' }}
                  options={[
                    { value: 'Home', label: 'Home' },
                    { value: 'Work', label: 'Work' },
                    { value: 'Admin', label: 'Admin' },
                    { value: 'HRMS', label: 'HRMS' },
                    { value: 'Finance', label: 'Finance' },
                    { value: 'My Hub', label: 'My Hub' }
                  ]}
                  value={formData.details.modules}
                  onChange={(v) => updateDetail('modules', v)}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">Features</span>
                <Select
                  mode="tags"
                  placeholder="Select Features"
                  style={{ width: '100%' }}
                  options={
                    (formData.details.modules || []).flatMap((mod: string) => {
                      const featuresMap: Record<string, string[]> = {
                        'Home': ['Dashboard', 'Announcements', 'Quick Links'],
                        'Work': ['Tasks', 'Projects', 'Time Tracking', 'Sprint Planning'],
                        'Admin': ['User Management', 'Roles & Permissions', 'Global Settings', 'Audit Logs'],
                        'HRMS': ['Leaves', 'Attendance', 'Payroll', 'Employee Directory'],
                        'Finance': ['Invoices', 'Expenses', 'Financial Reports', 'Budgeting'],
                        'My Hub': ['Profile', 'Preferences', 'My Tasks', 'My Requests']
                      };
                      return (featuresMap[mod] || []).map(f => ({ value: f, label: f }));
                    })
                  }
                  value={formData.details.features}
                  onChange={(v) => updateDetail('features', v)}
                  disabled={!(formData.details.modules && formData.details.modules.length > 0)}
                  notFoundContent="Please select a Module first"
                />
              </Col>
              <Col span={12}>
                <span className="form-label">Sprint</span>
                <Select
                  placeholder="Select Sprint"
                  style={{ width: '100%' }}
                  loading={loadingSprints}
                  options={sprints.map(s => ({ value: s.id || s.name, label: s.name }))}
                  value={formData.details.sprint}
                  onChange={(v) => updateDetail('sprint', v)}
                />
              </Col>
              <Col span={12}>
                <span className="form-label">Release Version</span>
                <Input 
                  placeholder="e.g. v2.1.0" 
                  value={formData.details.releaseVersion}
                  onChange={(e) => updateDetail('releaseVersion', e.target.value)}
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* 2. Requirement References */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><Link2 size={16} /> 2. Requirement References</div>
          <div className="pp-card-body">
            <span className="form-label" style={{ marginBottom: 16 }}>Everything QA needs to understand the feature.</span>
            <Row gutter={[24, 20]}>
              <Col span={12}>
                <span className="form-label">PRD</span>
                <Input placeholder="Paste PRD link" value={formData.details.reqReferences?.prd} onChange={e => updateReqRef('prd', e.target.value)} />
              </Col>
              <Col span={12}>
                <span className="form-label">Figma</span>
                <Input placeholder="Paste Figma link" value={formData.details.reqReferences?.figma} onChange={e => updateReqRef('figma', e.target.value)} />
              </Col>
              <Col span={12}>
                <span className="form-label">API Documentation</span>
                <Input placeholder="Paste API Documentation link" value={formData.details.reqReferences?.apiDoc} onChange={e => updateReqRef('apiDoc', e.target.value)} />
              </Col>
              <Col span={12}>
                <span className="form-label">User Story</span>
                <Input placeholder="Paste User Story link" value={formData.details.reqReferences?.userStory} onChange={e => updateReqRef('userStory', e.target.value)} />
              </Col>
              <Col span={12}>
                <span className="form-label">Epic</span>
                <Input placeholder="Paste Epic link" value={formData.details.reqReferences?.epic} onChange={e => updateReqRef('epic', e.target.value)} />
              </Col>
              <Col span={12}>
                <span className="form-label">Dev Ticket</span>
                <Input placeholder="Paste Dev Ticket link" value={formData.details.reqReferences?.devTicket} onChange={e => updateReqRef('devTicket', e.target.value)} />
              </Col>
              <Col span={24}>
                <span className="form-label">Additional Documents</span>
                <div style={{ marginTop: 8 }}>
                  <Dragger>
                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                  </Dragger>
                </div>
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
                <span className="form-label">In Scope</span>
                <TiptapEditor 
                  content={formData.details.inScope} 
                  onChange={html => updateDetail('inScope', html)} 
                  minHeight={150} 
                  maxHeight={300} 
                />
              </Col>
              <Col span={12}>
                <span className="form-label">Out of Scope</span>
                <TiptapEditor 
                  content={formData.details.outScope} 
                  onChange={html => updateDetail('outScope', html)} 
                  minHeight={150} 
                  maxHeight={300} 
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* 4. Testing Types */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><CheckSquare size={16} /> 4. Testing Types</div>
          <div className="pp-card-body">
            <Checkbox.Group style={{ width: '100%' }} value={formData.details.testingTypes} onChange={v => updateDetail('testingTypes', v)}>
              <Row gutter={[16, 16]}>
                {[
                  "Functional", "Regression", "Smoke", "Sanity", 
                  "UI", "API", "Performance", "Security", 
                  "Accessibility", "Cross Browser", "Mobile", "Automation",
                  "Integration", "UAT", "Usability", "Localization",
                  "Exploratory", "End-to-End", "Compatibility", "Database"
                ].map(type => (
                  <Col span={6} key={type}>
                    <Checkbox value={type}>{type}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </div>
        </div>

        {/* 5. Environment Details */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><Monitor size={16} /> 5. Environment Details</div>
          <div className="pp-card-body">
            <Row gutter={[24, 20]}>
              <Col span={8}>
                <span className="form-label">Environment</span>
                <Select style={{ width: '100%' }} placeholder="Select Env" options={[{label: 'Dev', value: 'Dev'}, {label: 'Staging', value: 'Staging'}, {label: 'Beta', value: 'Beta'}, {label: 'Production', value: 'Production'}]} value={formData.details.environment?.type} onChange={v => updateEnvironment('type', v)} />
              </Col>
              <Col span={8}>
                <span className="form-label">Build Version</span>
                <Input placeholder="e.g. v1.0.45" value={formData.details.environment?.buildVersion} onChange={e => updateEnvironment('buildVersion', e.target.value)} />
              </Col>
              <Col span={8}>
                <span className="form-label">API Version</span>
                <Input placeholder="e.g. v2" value={formData.details.environment?.apiVersion} onChange={e => updateEnvironment('apiVersion', e.target.value)} />
              </Col>
              <Col span={8}>
                <span className="form-label">Database</span>
                <Select style={{ width: '100%' }} placeholder="Select DB" allowClear options={[{label: 'MySQL', value: 'MySQL'}, {label: 'PostgreSQL', value: 'PostgreSQL'}, {label: 'MongoDB', value: 'MongoDB'}, {label: 'Redis', value: 'Redis'}]} value={formData.details.environment?.database} onChange={v => updateEnvironment('database', v)} />
              </Col>
              <Col span={8}>
                <span className="form-label">Browser</span>
                <Select mode="multiple" style={{ width: '100%' }} placeholder="Select Browsers" options={[{label: 'Chrome', value: 'Chrome'}, {label: 'Firefox', value: 'Firefox'}, {label: 'Safari', value: 'Safari'}, {label: 'Edge', value: 'Edge'}]} value={formData.details.environment?.browser} onChange={v => updateEnvironment('browser', v)} />
              </Col>
              <Col span={8}>
                <span className="form-label">OS</span>
                <Select mode="multiple" style={{ width: '100%' }} placeholder="Select OS" options={[{label: 'Windows', value: 'Windows'}, {label: 'macOS', value: 'macOS'}, {label: 'Linux', value: 'Linux'}, {label: 'iOS', value: 'iOS'}, {label: 'Android', value: 'Android'}]} value={formData.details.environment?.os} onChange={v => updateEnvironment('os', v)} />
              </Col>
              <Col span={24}>
                <span className="form-label">Device</span>
                <Select mode="tags" style={{ width: '100%' }} placeholder="Select or type devices (e.g. iPhone 14, Galaxy S23)" options={[{label: 'Desktop', value: 'Desktop'}, {label: 'Mobile', value: 'Mobile'}, {label: 'Tablet', value: 'Tablet'}]} value={formData.details.environment?.device} onChange={v => updateEnvironment('device', v)} />
              </Col>
            </Row>
          </div>
        </div>

        {/* 6. Dependencies */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><AlertCircle size={16} /> 6. Dependencies</div>
          <div className="pp-card-body">
            <span className="form-label">Things that must be ready before testing.</span>
            {formData.details.dependencies.map((dep: any, idx: number) => (
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }} key={idx}>
                <Input value={dep.name} readOnly style={{ flex: 1 }} />
                <Select value={dep.status} disabled style={{ width: 150 }} />
                <Button danger onClick={() => {
                  const newDeps = [...formData.details.dependencies];
                  newDeps.splice(idx, 1);
                  updateDetail('dependencies', newDeps);
                }}>Remove</Button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 12 }}>
              <Input placeholder="Dependency name" value={newDepName} onChange={(e) => setNewDepName(e.target.value)} style={{ flex: 1 }} />
              <Select placeholder="Status" value={newDepStatus} onChange={(val) => setNewDepStatus(val)} style={{ width: 150 }} options={[
                { value: 'ready', label: 'Ready' },
                { value: 'pending', label: 'Pending' },
                { value: 'blocked', label: 'Blocked' },
              ]} />
              <Button onClick={() => {
                if (newDepName.trim()) {
                  updateDetail('dependencies', [...(formData.details.dependencies || []), { name: newDepName.trim(), status: newDepStatus }]);
                  setNewDepName('');
                  setNewDepStatus('pending');
                }
              }}>Add</Button>
            </div>
          </div>
        </div>

        {/* 7. Acceptance Criteria */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><CheckCircle size={16} /> 7. Acceptance Criteria</div>
          <div className="pp-card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(formData.details.acceptanceCriteria || []).map((ac: any, idx: number) => {
                const text = typeof ac === 'string' ? ac : ac.text;
                const checked = typeof ac === 'object' ? !!ac.checked : false;
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Checkbox
                      checked={checked}
                      onChange={(e) => {
                        const updated = [...(formData.details.acceptanceCriteria || [])].map((item: any, i: number) =>
                          i === idx ? { text: typeof item === 'string' ? item : item.text, checked: e.target.checked } : item
                        );
                        updateDetail('acceptanceCriteria', updated);
                      }}
                    >
                      <span style={{ fontSize: 13, textDecoration: checked ? 'line-through' : 'none', color: checked ? 'var(--text-slate-400)' : 'var(--text-slate-800)' }}>{text}</span>
                    </Checkbox>
                    <Button
                      type="text"
                      size="small"
                      danger
                      style={{ marginLeft: 'auto', padding: '0 6px', fontSize: 15, lineHeight: 1, opacity: 0.5 }}
                      onClick={() => {
                        const updated = [...(formData.details.acceptanceCriteria || [])];
                        updated.splice(idx, 1);
                        updateDetail('acceptanceCriteria', updated);
                      }}
                    >×</Button>
                  </div>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, paddingTop: (formData.details.acceptanceCriteria || []).length > 0 ? 8 : 0, borderTop: (formData.details.acceptanceCriteria || []).length > 0 ? '1px dashed var(--border-slate-200)' : 'none' }}>
                <Checkbox disabled style={{ opacity: 0.3 }} />
                <Input
                  placeholder="Type a criterion and press Enter..."
                  value={newAcInput}
                  onChange={(e) => setNewAcInput(e.target.value)}
                  onPressEnter={() => {
                    if (newAcInput.trim()) {
                      updateDetail('acceptanceCriteria', [...(formData.details.acceptanceCriteria || []), { text: newAcInput.trim(), checked: false }]);
                      setNewAcInput('');
                    }
                  }}
                  style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 0', fontSize: 13 }}
                  variant="borderless"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 8. Exit Criteria */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><CheckCircle2 size={16} /> 8. Exit Criteria</div>
          <div className="pp-card-body">
            <span className="form-label">When is testing considered complete?</span>
            <Checkbox.Group style={{ width: '100%' }} value={formData.details.exitCriteria} onChange={v => updateDetail('exitCriteria', v)}>
              <Row gutter={[16, 16]}>
                {["All Critical Tests Passed", "No Critical Bugs", "No High Severity Bugs", "Regression Passed", "Product Owner Approved"].map(type => (
                  <Col span={8} key={type}>
                    <Checkbox value={type}>{type}</Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </div>
        </div>

        {/* 9. Linked Items */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><Link2 size={16} /> 9. Linked Items</div>
          <div className="pp-card-body">
            <span className="form-label" style={{ marginBottom: 16 }}>Link related tickets, epics, or documentation</span>
            <Row gutter={[24, 20]}>
              {[
                { key: 'testSuites', label: 'Linked Test Suites' },
                { key: 'testCases', label: 'Linked Test Cases' },
                { key: 'bugSheets', label: 'Linked Bug Sheets' },
                { key: 'devTickets', label: 'Linked Development Tickets' },
                { key: 'sprints', label: 'Linked Sprints' }
              ].map((field) => (
                <Col span={12} key={field.key}>
                  <span className="form-label">{field.label}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input placeholder="Name" style={{ width: '40%' }} value={formData.details.linkedItems?.[field.key]?.name} onChange={e => updateLinkedItem(field.key, 'name', e.target.value)} />
                    <Input placeholder="Link URL" style={{ width: '60%' }} value={formData.details.linkedItems?.[field.key]?.link} onChange={e => updateLinkedItem(field.key, 'link', e.target.value)} />
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* 10. Attachments */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><InboxOutlined style={{ marginRight: 8 }} /> 10. Attachments</div>
          <div className="pp-card-body">
            <Row gutter={[24, 20]}>
              {[
                { key: 'screenshots', label: 'Screenshots' },
                { key: 'designFiles', label: 'Design Files' },
                { key: 'sampleData', label: 'Sample Data' },
                { key: 'excelFiles', label: 'Excel Files' },
                { key: 'pdfs', label: 'PDFs' }
              ].map((field) => (
                <Col span={12} key={field.key}>
                  <span className="form-label">{field.label}</span>
                  <div style={{ marginTop: 8 }}>
                    <Dragger 
                      fileList={formData.details.attachments?.[field.key] || []}
                      onChange={info => updateAttachmentFiles(field.key, info)}
                      beforeUpload={() => false}
                      multiple
                    >
                      <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                      <p className="ant-upload-text">Click or drag {field.label.toLowerCase()} here</p>
                    </Dragger>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* 11. Approval Workflow */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><CheckSquare size={16} /> 11. Approval Workflow</div>
          <div className="pp-card-body">
            <div style={{ display: "flex", gap: 12 }}>
              <Select 
                placeholder="Position" 
                style={{ width: 200 }} 
                options={positionsList.map(p => ({ label: p.title, value: p.id }))} 
                value={formData.details.approvalWorkflow?.position}
                onChange={(val) => {
                  setFormData((prev: any) => {
                    const newDetails = { ...prev.details };
                    newDetails.approvalWorkflow = { ...newDetails.approvalWorkflow, position: val };
                    
                    const userForPosition = usersList.find(u => u.position?.id === val || u.positionId === val);
                    if (userForPosition) {
                      newDetails.approvalWorkflow.user = userForPosition.id;
                    } else {
                      newDetails.approvalWorkflow.user = undefined;
                    }
                    
                    return { ...prev, details: newDetails };
                  });
                }}
              />
              <Select 
                placeholder="Approver" 
                style={{ flex: 1 }} 
                options={usersList.map(u => ({ label: u.name, value: u.id }))} 
                value={formData.details.approvalWorkflow?.user}
                onChange={(val) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    details: {
                      ...prev.details,
                      approvalWorkflow: {
                        ...(prev.details.approvalWorkflow || {}),
                        user: val
                      }
                    }
                  }));
                }}
              />
              <Select 
                placeholder="Status" 
                style={{ width: 150 }} 
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' }
                ]} 
                value={formData.details.approvalWorkflow?.status}
                onChange={(val) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    details: {
                      ...prev.details,
                      approvalWorkflow: {
                        ...(prev.details.approvalWorkflow || {}),
                        status: val
                      }
                    }
                  }));
                }}
              />
              <Button type="primary">Request Approval</Button>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}
