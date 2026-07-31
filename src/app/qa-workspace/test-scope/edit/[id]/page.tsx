"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Input, Checkbox, Row, Col, Upload, DatePicker, message, Modal } from "antd";
import { Target, CheckSquare, FileText, Link2, Monitor, AlertCircle, CheckCircle, CheckCircle2, Sparkles } from "lucide-react";
import { InboxOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { api as axios } from "@/lib/axios";
import { useActivitySource } from "@/hooks/useActivitySource";
import TiptapEditor from "@/components/common/TiptapEditor";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { MembersService } from "@/services/membersService";

import dayjs from "dayjs";
import { useParams } from "next/navigation";

const { Dragger } = Upload;

export default function EditScopePage() {
  useActivitySource({ section: "WORK", module: "QA", page: "EditTestScope" });
  const params = useParams();
  const id = params?.id as string;

  const router = useRouter();
  const { canReadBug } = usePermission();
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  const [generatingInScope, setGeneratingInScope] = useState(false);
  const [generatingOutScope, setGeneratingOutScope] = useState(false);
  const [isZaiModalVisible, setIsZaiModalVisible] = useState(false);
  const [zaiPrompt, setZaiPrompt] = useState("");
  const [zaiTargetField, setZaiTargetField] = useState<'inScope' | 'outScope' | null>(null);

  const [loadingSprints, setLoadingSprints] = useState(false);
  const [sprints, setSprints] = useState<any[]>([]);
  const [positionsList, setPositionsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [newDepName, setNewDepName] = useState('');
  const [newDepStatus, setNewDepStatus] = useState('pending');
  const [newAcInput, setNewAcInput] = useState('');
  const [newModule, setNewModule] = useState('');
  const [newFeature, setNewFeature] = useState('');
  const [scopeSettings, setScopeSettings] = useState<any[]>([]);

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
        sprints: { name: '', link: '' },
        custom: []
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
      fetchScopeSettings();
      if (id) {
        fetchScopeDetails();
      }
    }
  }, [isLoading, canReadBug, id]);

  const fetchScopeSettings = async () => {
    try {
      const res = await axios.get('/api/v2/qa/test-scopes/settings');
      let data = [];
      if (Array.isArray(res)) data = res;
      else if (Array.isArray(res?.data)) data = res.data;
      else if (Array.isArray(res?.data?.data)) data = res.data.data;
      setScopeSettings(data);
    } catch (err) {
      // Silently fall back to empty
    }
  };

  const fetchScopeDetails = async () => {
    try {
      const res: any = await axios.get('/api/v2/qa/test-scopes');
      const allScopes = res.data?.data || res.data || res || [];
      const scope = allScopes.find((s: any) => s.id === id);

      if (scope) {
        setFormData({
          name: scope.name || '',
          type: scope.type || 'Feature Release',
          priority: scope.priority || 'Medium',
          status: scope.status || 'Draft',
          qa_owner: scope.qa_owner || '',
          start_date: scope.start_date ? dayjs(scope.start_date) : null,
          end_date: scope.end_date ? dayjs(scope.end_date) : null,
          details: scope.details || {}
        });
      }
    } catch (e) {
      console.error(e);
      message.error("Failed to load Test Scope");
    }
  };

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

  // ── ZAI helpers (defined AFTER updateDetail so the closure is live) ──────────
  const handleGenerateScopeWithAI = (field: 'inScope' | 'outScope') => {
    setZaiTargetField(field);
    setZaiPrompt("");
    setIsZaiModalVisible(true);
  };

  const submitZaiPrompt = async () => {
    if (!zaiTargetField) return;

    const field = zaiTargetField;
    if (field === 'inScope') setGeneratingInScope(true);
    else setGeneratingOutScope(true);

    setIsZaiModalVisible(false);

    try {
      const payload = {
        field,
        projectOverview: formData.details.projectOverview,
        modules: formData.details.modules,
        testingTypes: formData.details.testingTypes,
        userPrompt: zaiPrompt,
      };
      const res = await axios.post('/api/v2/qa/test-scopes/generate-ai', payload);

      // The api wrapper returns response.data.data directly on success.
      // So 'res' is actually the HTML string itself, or an object if the backend structure differs.
      let htmlContent = '';
      let isSuccess = false;

      if (typeof res === 'string') {
        htmlContent = res;
        isSuccess = true;
      } else if (res && typeof res === 'object') {
        isSuccess = res.success === true || res.status === 200 || true; // if it didn't throw, it's a success
        if (typeof res.data === 'string') {
          htmlContent = res.data;
        } else if (typeof res.data?.data === 'string') {
          htmlContent = res.data.data;
        }
      }

      console.log('ZAI parsed htmlContent:', { isSuccess, htmlContent: htmlContent.substring(0, 50) + '...' });

      if (isSuccess && htmlContent.trim().length > 0) {
        const safeHtml = htmlContent.replace(/<\/?(section|div|article|main|aside)[^>]*>/gi, '');
        console.log('ZAI updating field:', field, 'with HTML length:', safeHtml.length);
        updateDetail(field, safeHtml);
        message.success(`${field === 'inScope' ? 'In Scope' : 'Out of Scope'} generated successfully via ZAI.`);
      } else {
        message.error('Failed to generate scope content: AI returned empty or invalid format.');
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || 'Failed to generate scope via ZAI');
    } finally {
      if (field === 'inScope') setGeneratingInScope(false);
      else setGeneratingOutScope(false);
      setZaiTargetField(null);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────────

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

  const updateCustomLink = (idx: number, prop: string, val: string) => {
    setFormData((prev: any) => {
      const custom = [...(prev.details.linkedItems?.custom || [])];
      custom[idx] = { ...custom[idx], [prop]: val };
      return {
        ...prev,
        details: {
          ...prev.details,
          linkedItems: {
            ...prev.details.linkedItems,
            custom
          }
        }
      };
    });
  };

  const addCustomLink = () => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        linkedItems: {
          ...prev.details.linkedItems,
          custom: [...(prev.details.linkedItems?.custom || []), { label: '', name: '', link: '' }]
        }
      }
    }));
  };

  const removeCustomLink = (idx: number) => {
    setFormData((prev: any) => {
      const custom = [...(prev.details.linkedItems?.custom || [])];
      custom.splice(idx, 1);
      return {
        ...prev,
        details: {
          ...prev.details,
          linkedItems: {
            ...prev.details.linkedItems,
            custom
          }
        }
      };
    });
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

  const handleSave = async () => {
    if (!formData.name) {
      message.error("Test Scope Name is required");
      return;
    }
    if (!formData.status) {
      message.error("Status is required");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        start_date: formData.start_date ? formData.start_date.format('YYYY-MM-DD') : null,
        end_date: formData.end_date ? formData.end_date.format('YYYY-MM-DD') : null,
      };

      await axios.put(`/api/v2/qa/test-scopes/${id}`, payload);
      message.success(`Scope updated successfully`);
      router.push("/qa-workspace/test-scope");
    } catch (error) {
      console.error(error);
      message.error("Failed to update Test Scope");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived option lists ──────────────────────────────────────────────────────
  const scopeTypeOpts = scopeSettings.filter(s => s.category === 'scope_type').length > 0
    ? scopeSettings.filter(s => s.category === 'scope_type').map(s => ({ value: s.value, label: s.label }))
    : [{ value: 'Feature Release', label: 'Feature Release' }, { value: 'Integration', label: 'Integration' }, { value: 'Bug Fix', label: 'Bug Fix' }];

  const priorityOpts = scopeSettings.filter(s => s.category === 'priority').length > 0
    ? scopeSettings.filter(s => s.category === 'priority').map(s => ({ value: s.value, label: s.label }))
    : [{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Critical', label: 'Critical' }];

  const scopeStatusOpts = scopeSettings.filter(s => s.category === 'status').map(s => ({ value: s.value, label: s.label }));

  const userOptions = usersList.map(u => ({
    value: u.id,
    label: u.name || u.full_name || `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(),
    avatarUrl: u.avatarUrl || u.avatar || u.profile_picture || u.profilePicture || null,
  }));

  const positionOptions = positionsList.map(p => ({ value: p.id, label: p.title }));

  const sprintOptions = sprints.map(s => ({ value: s.id || s.name, label: s.name }));

  const moduleOpts = [
    { value: 'Home', label: 'Home' }, { value: 'Work', label: 'Work' },
    { value: 'Admin', label: 'Admin' }, { value: 'HRMS', label: 'HRMS' },
    { value: 'Finance', label: 'Finance' }, { value: 'My Hub', label: 'My Hub' }
  ];
  const customModules = (formData.details.modules || []).filter((m: string) => !moduleOpts.find(o => o.value === m)).map((m: string) => ({ value: m, label: m }));
  const allModuleOpts = [...moduleOpts, ...customModules];

  const featuresMap: Record<string, string[]> = {
    'Home': ['Dashboard', 'Announcements', 'Quick Links'],
    'Work': ['Tasks', 'Projects', 'Time Tracking', 'Sprint Planning'],
    'Admin': ['User Management', 'Roles & Permissions', 'Global Settings', 'Audit Logs'],
    'HRMS': ['Leaves', 'Attendance', 'Payroll', 'Employee Directory'],
    'Finance': ['Invoices', 'Expenses', 'Financial Reports', 'Budgeting'],
    'My Hub': ['Profile', 'Preferences', 'My Tasks', 'My Requests']
  };
  const featureOpts = (formData.details.modules || []).flatMap((mod: string) =>
    (featuresMap[mod] || []).map(f => ({ value: f, label: f }))
  );
  const customFeatures = (formData.details.features || []).filter((f: string) => !featureOpts.find((o: { value: string; }) => o.value === f)).map((f: string) => ({ value: f, label: f }));
  const allFeatureOpts = [...featureOpts, ...customFeatures];

  const statusOptions = [
    { value: 'ready', label: 'Ready', badge: <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} /> },
    { value: 'pending', label: 'Pending', badge: <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} /> },
    { value: 'blocked', label: 'Blocked', badge: <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} /> }
  ];

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      <style dangerouslySetInnerHTML={{
        __html: `
        .pp-detail-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15,23,42,0.03);
          margin-bottom: 20px;
        }
        .ant-checkbox-wrapper .ant-checkbox + span {
          padding-left: 8px !important;
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
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-slate-900)' }}>Edit Test Scope</h2>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button type="primary" onClick={handleSave} loading={submitting}>Save Scope</Button>
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
                <SearchableDropdown
                  options={scopeTypeOpts}
                  value={formData.type}
                  onChange={v => updateRoot('type', v)}
                  placeholder="Select Type"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">Priority</span>
                <SearchableDropdown
                  options={priorityOpts}
                  value={formData.priority}
                  onChange={v => updateRoot('priority', v)}
                  placeholder="Select Priority"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">Status <span style={{ color: 'red' }}>*</span></span>
                <SearchableDropdown
                  options={scopeStatusOpts}
                  value={formData.status}
                  onChange={v => updateRoot('status', v)}
                  placeholder="Select Status"
                  style={{ width: '100%' }}
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
                <SearchableDropdown
                  options={[{ value: 'Zukvo', label: 'Zukvo' }]}
                  value={formData.details.product}
                  onChange={v => updateDetail('product', v)}
                  placeholder="Select Product"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">Module</span>
                <SearchableDropdown
                  mode="multiple"
                  options={allModuleOpts}
                  value={formData.details.modules}
                  onChange={v => updateDetail('modules', v)}
                  placeholder="Select or type Modules"
                  freeText={true}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Input size="small" placeholder="Custom module..." value={newModule} onChange={e => setNewModule(e.target.value)} onPressEnter={() => {
                    if (newModule.trim()) {
                      const current = formData.details.modules || [];
                      if (!current.includes(newModule.trim())) updateDetail('modules', [...current, newModule.trim()]);
                      setNewModule('');
                    }
                  }} />
                  <Button size="small" onClick={() => {
                    if (newModule.trim()) {
                      const current = formData.details.modules || [];
                      if (!current.includes(newModule.trim())) updateDetail('modules', [...current, newModule.trim()]);
                      setNewModule('');
                    }
                  }}>Add</Button>
                </div>
              </Col>
              <Col span={8}>
                <span className="form-label">Features</span>
                <SearchableDropdown
                  mode="multiple"
                  options={allFeatureOpts}
                  value={formData.details.features}
                  onChange={v => updateDetail('features', v)}
                  placeholder={!(formData.details.modules?.length > 0) ? "Select a Module first" : "Select or type Features"}
                  disabled={!(formData.details.modules?.length > 0)}
                  freeText={true}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <Input size="small" placeholder="Custom feature..." value={newFeature} onChange={e => setNewFeature(e.target.value)} disabled={!(formData.details.modules?.length > 0)} onPressEnter={() => {
                    if (newFeature.trim() && formData.details.modules?.length > 0) {
                      const current = formData.details.features || [];
                      if (!current.includes(newFeature.trim())) updateDetail('features', [...current, newFeature.trim()]);
                      setNewFeature('');
                    }
                  }} />
                  <Button size="small" disabled={!(formData.details.modules?.length > 0)} onClick={() => {
                    if (newFeature.trim() && formData.details.modules?.length > 0) {
                      const current = formData.details.features || [];
                      if (!current.includes(newFeature.trim())) updateDetail('features', [...current, newFeature.trim()]);
                      setNewFeature('');
                    }
                  }}>Add</Button>
                </div>
              </Col>
              <Col span={12}>
                <span className="form-label">Sprint</span>
                <SearchableDropdown
                  options={sprintOptions}
                  value={formData.details.sprint}
                  onChange={v => updateDetail('sprint', v)}
                  placeholder="Select Sprint"
                  loading={loadingSprints}
                  style={{ width: '100%' }}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="form-label" style={{ margin: 0 }}>In Scope</span>
                  <Button
                    type="link"
                    size="small"
                    icon={<Sparkles size={14} />}
                    loading={generatingInScope}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGenerateScopeWithAI('inScope'); }}
                    style={{ color: '#8b5cf6', padding: 0 }}
                  >
                    Create with ZAI
                  </Button>
                </div>
                <TiptapEditor
                  content={formData.details.inScope}
                  onChange={html => updateDetail('inScope', html)}
                  minHeight={150}
                  maxHeight={300}
                />
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="form-label" style={{ margin: 0 }}>Out of Scope</span>
                  <Button
                    type="link"
                    size="small"
                    icon={<Sparkles size={14} />}
                    loading={generatingOutScope}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleGenerateScopeWithAI('outScope'); }}
                    style={{ color: '#8b5cf6', padding: 0 }}
                  >
                    Create with ZAI
                  </Button>
                </div>
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
                <SearchableDropdown
                  options={[{ label: 'Dev', value: 'Dev' }, { label: 'Staging', value: 'Staging' }, { label: 'Beta', value: 'Beta' }, { label: 'Production', value: 'Production' }]}
                  value={formData.details.environment?.type}
                  onChange={v => updateEnvironment('type', v)}
                  placeholder="Select Environment"
                  style={{ width: '100%' }}
                />
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
                <SearchableDropdown
                  options={[{ label: 'MySQL', value: 'MySQL' }, { label: 'PostgreSQL', value: 'PostgreSQL' }, { label: 'MongoDB', value: 'MongoDB' }, { label: 'Redis', value: 'Redis' }]}
                  value={formData.details.environment?.database}
                  onChange={v => updateEnvironment('database', v)}
                  placeholder="Select Database"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">Browser</span>
                <SearchableDropdown
                  mode="multiple"
                  options={[{ label: 'Chrome', value: 'Chrome' }, { label: 'Firefox', value: 'Firefox' }, { label: 'Safari', value: 'Safari' }, { label: 'Edge', value: 'Edge' }]}
                  value={formData.details.environment?.browser}
                  onChange={v => updateEnvironment('browser', v)}
                  placeholder="Select Browsers"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">OS</span>
                <SearchableDropdown
                  mode="multiple"
                  options={[{ label: 'Windows', value: 'Windows' }, { label: 'macOS', value: 'macOS' }, { label: 'Linux', value: 'Linux' }, { label: 'iOS', value: 'iOS' }, { label: 'Android', value: 'Android' }]}
                  value={formData.details.environment?.os}
                  onChange={v => updateEnvironment('os', v)}
                  placeholder="Select OS"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={24}>
                <span className="form-label">Device</span>
                <SearchableDropdown
                  mode="multiple"
                  options={[{ label: 'Desktop', value: 'Desktop' }, { label: 'Mobile', value: 'Mobile' }, { label: 'Tablet', value: 'Tablet' }]}
                  value={formData.details.environment?.device}
                  onChange={v => updateEnvironment('device', v)}
                  placeholder="Select or type devices (e.g. iPhone 14, Galaxy S23)"
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
          </div>
        </div>

        {/* 6. Dependencies */}
        <div className="pp-detail-card">
          <div className="pp-card-header"><AlertCircle size={16} /> 6. Dependencies</div>
          <div className="pp-card-body">
            <span className="form-label">Things that must be ready before testing.</span>
            {(formData.details.dependencies || []).map((dep: any, idx: number) => (
              <div style={{ display: "flex", gap: 12, marginBottom: 12 }} key={idx}>
                <Input value={dep.name} readOnly style={{ flex: 1 }} />
                <SearchableDropdown
                  options={statusOptions}
                  value={dep.status}
                  disabled
                  style={{ width: 150 }}
                  placeholder="Status"
                />
                <Button danger onClick={() => {
                  const newDeps = [...(formData.details.dependencies || [])];
                  newDeps.splice(idx, 1);
                  updateDetail('dependencies', newDeps);
                }}>Remove</Button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 12 }}>
              <Input placeholder="Dependency name" value={newDepName} onChange={(e) => setNewDepName(e.target.value)} style={{ flex: 1 }} />
              <SearchableDropdown
                options={statusOptions}
                value={newDepStatus}
                onChange={val => setNewDepStatus(val)}
                placeholder="Status"
                style={{ width: 150 }}
              />
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
                <Col span={24} key={field.key}>
                  <span className="form-label">{field.label}</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input placeholder="Name" style={{ width: '40%' }} value={formData.details.linkedItems?.[field.key]?.name} onChange={e => updateLinkedItem(field.key, 'name', e.target.value)} />
                    <Input placeholder="Link URL" style={{ width: '60%' }} value={formData.details.linkedItems?.[field.key]?.link} onChange={e => updateLinkedItem(field.key, 'link', e.target.value)} />
                  </div>
                </Col>
              ))}

              {(formData.details.linkedItems?.custom || []).map((item: any, idx: number) => (
                <Col span={24} key={`custom-${idx}`}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ width: '40%' }}>
                      <span className="form-label">Custom Label</span>
                      <Input placeholder="e.g. Wiki Page" value={item.label} onChange={e => updateCustomLink(idx, 'label', e.target.value)} />
                    </div>
                    <div style={{ width: '30%' }}>
                      <span className="form-label">Name</span>
                      <Input placeholder="Name" value={item.name} onChange={e => updateCustomLink(idx, 'name', e.target.value)} />
                    </div>
                    <div style={{ width: '30%', display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <span className="form-label">Link URL</span>
                        <Input placeholder="URL" value={item.link} onChange={e => updateCustomLink(idx, 'link', e.target.value)} />
                      </div>
                      <Button danger onClick={() => removeCustomLink(idx)} style={{ alignSelf: 'flex-end' }}>Remove</Button>
                    </div>
                  </div>
                </Col>
              ))}

              <Col span={24}>
                <Button type="dashed" block onClick={addCustomLink}>+ Add Custom Link</Button>
              </Col>
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
            <div style={{ display: "flex", gap: 12, flexWrap: 'wrap' }}>
              <SearchableDropdown
                options={positionOptions}
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
                placeholder="Select Position"
                style={{ width: 200 }}
              />
              <div style={{ flex: 1, minWidth: 180 }}>
                <SearchableDropdown
                  options={userOptions}
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
                  placeholder="Select Approver"
                  showSelectedAvatar
                  style={{ width: '100%' }}
                />
              </div>
              <SearchableDropdown
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
                placeholder="Status"
                hideAvatar
                style={{ width: 150 }}
              />
              <Button type="primary">Request Approval</Button>
            </div>
          </div>
        </div>

      </div>

      <Modal
        title="Create with ZAI"
        open={isZaiModalVisible}
        onOk={submitZaiPrompt}
        onCancel={() => setIsZaiModalVisible(false)}
        okText="Generate"
        cancelText="Cancel"
      >
        <p style={{ marginBottom: 8 }}>Describe what you want ZAI to generate for the {zaiTargetField === 'inScope' ? 'In Scope' : 'Out of Scope'} section:</p>
        <Input.TextArea
          rows={4}
          placeholder="e.g. Generate a bulleted list of features targeting the login workflow..."
          value={zaiPrompt}
          onChange={(e) => setZaiPrompt(e.target.value)}
        />
      </Modal>
    </MainLayout>
  );
}
