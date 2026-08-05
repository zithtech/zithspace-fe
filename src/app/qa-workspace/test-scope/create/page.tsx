"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Input, Checkbox, Row, Col, Upload, DatePicker, Modal, Dropdown, Drawer, Tag, App } from "antd";
import { Target, CheckSquare, FileText, Link2, Monitor, AlertCircle, CheckCircle, CheckCircle2, Sparkles, Copy, ChevronDown, Maximize, Zap, Wand2, ArrowRight, UploadCloud, File as FileIcon, Image as ImageIcon, Trash2, Eye, Download, X, ZoomIn } from "lucide-react";
import { InboxOutlined, ArrowLeftOutlined, CloseOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { api as axios } from "@/lib/axios";
import { useActivitySource } from "@/hooks/useActivitySource";
import TiptapEditor, { TiptapEditorRef } from "@/components/common/TiptapEditor";
import TiptapViewer from "@/components/common/TiptapViewer";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { MembersService } from "@/services/membersService";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import debounce from "lodash/debounce";

const { Dragger } = Upload;

function ImageModal({ src, name, onClose }: { src: string; name: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-zinc-900/95 px-4 py-2.5">
          <span className="text-sm font-medium text-zinc-200 truncate max-w-[60vw]">{name}</span>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="bg-zinc-950 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            className="max-w-[90vw] max-h-[80vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}

export default function CreateScopePage() {
  const { message } = App.useApp();
  useActivitySource({ section: "WORK", module: "QA", page: "CreateTestScope" });

  const router = useRouter();
  const { canReadBug } = usePermission();
  const { user, isLoading } = useAuth();
  const { theme } = useTheme();

  const [generatingInScope, setGeneratingInScope] = useState(false);
  const [generatingOutScope, setGeneratingOutScope] = useState(false);
  const [isZaiModalVisible, setIsZaiModalVisible] = useState(false);
  const [zaiPrompt, setZaiPrompt] = useState("");
  const [zaiTargetField, setZaiTargetField] = useState<'inScope' | 'outScope' | null>(null);
  const [zaiView, setZaiView] = useState<'prompt' | 'preview'>('prompt');
  const [zaiGeneratedContent, setZaiGeneratedContent] = useState('');

  const [isExpandDrawerVisible, setIsExpandDrawerVisible] = useState(false);
  const [expandDrawerField, setExpandDrawerField] = useState<'inScope' | 'outScope' | null>(null);
  const [expandDrawerTitle, setExpandDrawerTitle] = useState('');
  const [previewImg, setPreviewImg] = useState<{ src: string; name: string } | null>(null);


  const inScopeRef = React.useRef<TiptapEditorRef>(null);
  const outScopeRef = React.useRef<TiptapEditorRef>(null);

  const [loadingSprints, setLoadingSprints] = useState(false);
  const [sprints, setSprints] = useState<any[]>([]);
  const [loadingDevTickets, setLoadingDevTickets] = useState(false);
  const [devTickets, setDevTickets] = useState<any[]>([]);
  const [loadingBugSheets, setLoadingBugSheets] = useState(false);
  const [bugSheets, setBugSheets] = useState<any[]>([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [testCases, setTestCases] = useState<any[]>([]);

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
        devTickets: [],
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
      fetchSprintsSearch("");
      fetchDevTicketsSearch("");
      fetchBugSheetsSearch("");
      fetchPositionsAndUsers();
      fetchScopeSettings();
    }
  }, [isLoading, canReadBug]);

  const fetchScopeSettings = async () => {
    try {
      const res = await axios.get('/api/v2/qa/test-scopes/settings');
      let data: any[] = [];
      if (Array.isArray(res)) data = res;
      else if (Array.isArray(res?.data)) data = res.data;
      else if (Array.isArray(res?.data?.data)) data = res.data.data;
      setScopeSettings(data);
    } catch (err) {
      // Silently fall back to empty
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

  // --- Dynamic Search Handlers ---
  const fetchSprintsSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingSprints(true);
        const res: any = await axios.get("/api/release-plans", { params: { search, limit: 10 } });
        const fetchedSprints = Array.isArray(res) ? res : (res.data || []);
        setSprints(fetchedSprints);
      } catch (err) {
        console.error("Failed to fetch sprints:", err);
      } finally {
        setLoadingSprints(false);
      }
    }, 400),
    []
  );

  const fetchDevTicketsSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingDevTickets(true);
        const res: any = await axios.get("/api/tickets", { params: { search, limit: 10 } });
        const data = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
        setDevTickets(data);
      } catch (err) {
        console.error("Failed to fetch dev tickets:", err);
      } finally {
        setLoadingDevTickets(false);
      }
    }, 400),
    []
  );

  const fetchBugSheetsSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingBugSheets(true);
        const res: any = await axios.get("/api/bug-list/sheets/all", { params: { search, limit: 10 } });
        const data = Array.isArray(res) ? res : (res?.data?.data || res?.data || []);
        setBugSheets(data);
      } catch (err) {
        console.error("Failed to fetch bug sheets:", err);
      } finally {
        setLoadingBugSheets(false);
      }
    }, 400),
    []
  );

  const fetchTestCasesSearch = React.useCallback(
    debounce(async (search: string) => {
      try {
        setLoadingTestCases(true);
        // Mock data since backend API does not exist yet
        const mockData = [
          { id: 'tc-1', name: 'Login Authentication Tests' },
          { id: 'tc-2', name: 'Checkout Flow Tests' },
          { id: 'tc-3', name: 'User Profile Updates' },
          { id: 'tc-4', name: 'Payment Gateway Integration' },
          { id: 'tc-5', name: 'Dashboard Analytics' }
        ].filter(tc => tc.name.toLowerCase().includes((search || '').toLowerCase()));
        
        setTestCases(mockData);
      } catch (err) {
        console.error("Failed to fetch test cases:", err);
      } finally {
        setLoadingTestCases(false);
      }
    }, 400),
    []
  );

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

  const handleExpandContent = (field: 'inScope' | 'outScope') => {
    setExpandDrawerField(field);
    setExpandDrawerTitle(field === 'inScope' ? 'In Scope' : 'Out of Scope');
    setIsExpandDrawerVisible(true);
  };

  // ── ZAI helpers (defined AFTER updateDetail so the closure is live) ──────────
  const handleGenerateScopeWithAI = (field: 'inScope' | 'outScope') => {
    setZaiTargetField(field);
    setZaiPrompt("");
    setZaiView('prompt');
    setZaiGeneratedContent("");
    setIsZaiModalVisible(true);
  };

  const submitZaiPrompt = async () => {
    if (!zaiTargetField || !zaiPrompt.trim()) return;

    const field = zaiTargetField;
    if (field === 'inScope') setGeneratingInScope(true);
    else setGeneratingOutScope(true);

    try {
      const payload = {
        field,
        projectOverview: formData.details.projectOverview,
        modules: formData.details.modules,
        testingTypes: formData.details.testingTypes,
        userPrompt: zaiPrompt,
      };
      const res = await axios.post('/api/v2/qa/test-scopes/generate-ai', payload);

      let htmlContent = '';
      let isSuccess = false;

      if (typeof res === 'string') {
        htmlContent = res;
        isSuccess = true;
      } else if (res && typeof res === 'object') {
        isSuccess = res.success === true || res.status === 200 || true;
        if (typeof res.data === 'string') {
          htmlContent = res.data;
        } else if (typeof res.data?.data === 'string') {
          htmlContent = res.data.data;
        }
      }

      if (isSuccess && htmlContent.trim().length > 0) {
        const safeHtml = htmlContent.replace(/<\/?(section|div|article|main|aside)[^>]*>/gi, '');
        setZaiGeneratedContent(safeHtml);
        setZaiView('preview');
      } else {
        message.error('Failed to generate scope content: AI returned empty or invalid format.');
      }
    } catch (err: any) {
      console.error(err);
      message.error(err.response?.data?.error || 'Failed to generate scope via ZAI');
    } finally {
      if (field === 'inScope') setGeneratingInScope(false);
      else setGeneratingOutScope(false);
    }
  };

  const handleZaiInsert = (action: 'replace' | 'append' | 'insert') => {
    if (!zaiTargetField) return;

    if (action === 'replace') {
      updateDetail(zaiTargetField, zaiGeneratedContent);
    } else if (action === 'append') {
      const current = formData.details[zaiTargetField] || '';
      updateDetail(zaiTargetField, current + (current ? '<br/>' : '') + zaiGeneratedContent);
    } else if (action === 'insert') {
      const ref = zaiTargetField === 'inScope' ? inScopeRef : outScopeRef;
      if (ref.current) {
        ref.current.insertContentAtCursor(zaiGeneratedContent);
      } else {
        // Fallback to append if ref is somehow missing
        const current = formData.details[zaiTargetField] || '';
        updateDetail(zaiTargetField, current + (current ? '<br/>' : '') + zaiGeneratedContent);
      }
    }

    message.success(`${zaiTargetField === 'inScope' ? 'In Scope' : 'Out of Scope'} updated successfully.`);
    setIsZaiModalVisible(false);
  };

  const handleZaiCopy = () => {
    navigator.clipboard.writeText(zaiGeneratedContent);
    message.success('Copied to clipboard!');
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

  const updateLinkedItemArray = (field: string, val: any[]) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        linkedItems: {
          ...(prev.details.linkedItems || {}),
          [field]: val
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

  const handleRemoveAttachment = (field: string, uid: string) => {
    setFormData((prev: any) => {
      const currentFiles = prev.details.attachments?.[field] || [];
      return {
        ...prev,
        details: {
          ...prev.details,
          attachments: {
            ...(prev.details.attachments || {}),
            [field]: currentFiles.filter((f: any) => f.uid !== uid)
          }
        }
      };
    });
  };

  const updateAdditionalDocs = async (info: any) => {
    const processFile = (file: any) => {
      return new Promise((resolve) => {
        if (file.url || file.thumbUrl) {
          resolve(file);
        } else if (file.originFileObj) {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = () => resolve({ ...file, url: reader.result, status: 'done' });
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
        reqReferences: {
          ...prev.details.reqReferences,
          additionalDocs: processedFiles
        }
      }
    }));
  };

  const handleRemoveAdditionalDoc = (uid: string) => {
    setFormData((prev: any) => {
      const currentFiles = prev.details.reqReferences?.additionalDocs || [];
      return {
        ...prev,
        details: {
          ...prev.details,
          reqReferences: {
            ...prev.details.reqReferences,
            additionalDocs: currentFiles.filter((f: any) => f.uid !== uid)
          }
        }
      };
    });
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

      await axios.post("/api/v2/qa/test-scopes", payload);
      message.success(`Scope published successfully`);
      router.push("/qa-workspace/test-scope?tab=scopes");
    } catch (error) {
      console.error(error);
      message.error("Failed to save Test Scope");
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

  const selectedApproverPosition = formData.details.approvalWorkflow?.position;
  const filteredUsersList = selectedApproverPosition 
    ? usersList.filter(u => u.position?.id === selectedApproverPosition || u.positionId === selectedApproverPosition)
    : usersList;

  const userOptions = filteredUsersList.map(u => ({
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

  const browserListOptions = [
    'Chrome', 'Firefox', 'Edge', 'Safari', 'Opera', 'Brave', 'Arc', 'Vivaldi',
    'Internet Explorer', 'Samsung Internet', 'UC Browser', 'Yandex', 'Tor Browser'
  ].map(b => ({ label: b, value: b }));

  const osListOptions = [
    'Windows 11', 'Windows 10', 'Windows 8', 'Windows 7', 'macOS', 'Ubuntu', 'Debian',
    'Fedora', 'CentOS', 'Red Hat', 'Linux Mint', 'Android', 'iOS', 'iPadOS', 'ChromeOS'
  ].map(o => ({ label: o, value: o }));

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <MainLayout>
      {previewImg && (
        <ImageModal src={previewImg.src} name={previewImg.name} onClose={() => setPreviewImg(null)} />
      )}
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
        .custom-upload-dragger .ant-upload-drag {
          border: none !important;
          background: transparent !important;
        }
        .custom-upload-dragger .ant-upload {
          padding: 0 !important;
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
        /* Uniform input heights */
        .create-scope-container input.ant-input:not(.ant-input-sm),
        .create-scope-container .ant-picker,
        .create-scope-container .sd-trigger {
          min-height: 40px !important;
          height: 40px !important;
          display: flex;
          align-items: center;
        }
        /* Allow textarea to resize freely */
        .create-scope-container textarea.ant-input {
          min-height: 80px;
        }
      `}} />

      <div className="create-scope-container">
        <div className="header-actions">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => router.back()} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-slate-900)' }}>Create Test Scope</h2>
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
                <span className="form-label">Scope Type</span>
                <SearchableDropdown
                  options={scopeTypeOpts}
                  value={formData.type}
                  onChange={v => updateRoot('type', v)}
                  placeholder="Select Type"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={24}>
                <span className="form-label">Description</span>
                <textarea className="ant-input" rows={3} placeholder="Brief description" value={formData.details.description} onChange={(e) => updateDetail('description', e.target.value)} style={{ resize: 'vertical', width: '100%' }} />
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
                <SearchableDropdown
                  options={userOptions.map(opt => ({ ...opt, value: opt.label }))}
                  value={formData.qa_owner}
                  onChange={(val) => updateRoot('qa_owner', val)}
                  placeholder="Select QA Owner"
                  showSelectedAvatar
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <span className="form-label">Reviewer</span>
                <SearchableDropdown
                  options={userOptions.map(opt => ({ ...opt, value: opt.label }))}
                  value={formData.details.reviewer}
                  onChange={(val) => updateDetail('reviewer', val)}
                  placeholder="Select Reviewer"
                  showSelectedAvatar
                  style={{ width: '100%' }}
                />
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
                  onSearch={fetchSprintsSearch}
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
                <span className="form-label">Development Tickets</span>
                <SearchableDropdown
                  mode="multiple"
                  freeText
                  options={devTickets.map(t => ({
                    label: `${t.ticketNumber || t.id.substring(0, 8)} - ${t.title}`,
                    value: String(t.id),
                    description: t.status || '',
                    badge: <span style={{ background: '#8b5cf6', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>T</span>
                  }))}
                  onSearch={fetchDevTicketsSearch}
                  placeholder="Search or paste Tickets..."
                  value={
                    Array.isArray(formData.details.reqReferences?.devTicket)
                      ? formData.details.reqReferences.devTicket.map((t: any) => typeof t === 'string' ? t : String(t.link || t.id))
                      : formData.details.reqReferences?.devTicket
                        ? [String(formData.details.reqReferences.devTicket)]
                        : undefined
                  }
                  onChange={v => {
                    if (!v || v.length === 0) {
                      updateReqRef('devTicket', []);
                    } else {
                      const updated = v.map((idVal: string) => {
                        const selected = devTickets.find(t => String(t.id) === idVal);
                        if (selected) {
                          return {
                            name: `${selected.ticketNumber || selected.id.substring(0, 8)} - ${selected.title}`,
                            link: String(selected.id)
                          };
                        }
                        return { name: idVal, link: idVal };
                      });
                      updateReqRef('devTicket', updated);
                    }
                  }}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={24}>
                <span className="form-label">Additional Documents</span>
                <div style={{ marginTop: 8 }}>
                  <Dragger
                    className="custom-upload-dragger"
                    fileList={formData.details.reqReferences?.additionalDocs || []}
                    onChange={updateAdditionalDocs}
                    beforeUpload={() => false}
                    multiple
                    showUploadList={false}
                  >
                    <div className="group relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-400 transition-colors cursor-pointer text-center p-8">
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-500 group-hover:scale-110 transition-transform">
                          <UploadCloud size={24} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            <span className="text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Additional Documents (max 50MB)</p>
                        </div>
                      </div>
                    </div>
                  </Dragger>

                  {(formData.details.reqReferences?.additionalDocs || []).length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      {(formData.details.reqReferences?.additionalDocs || []).map((file: any) => (
                        <div key={file.uid} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                              <FileIcon size={18} className="text-slate-400" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                {file.size && <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
                                {file.status === 'uploading' && <span className="text-indigo-500">Uploading...</span>}
                                {file.status === 'done' && <span className="text-emerald-500">Ready</span>}
                                {(!file.status || file.status === 'error') && <span className="text-slate-400">Ready</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="text"
                              icon={<Download size={16} />}
                              size="small"
                              onClick={() => {
                                if (file.url) {
                                  const a = document.createElement('a');
                                  a.href = file.url;
                                  a.download = file.name;
                                  a.click();
                                }
                              }}
                              className="text-slate-500 hover:text-indigo-600"
                            />
                            <Button
                              type="text"
                              danger
                              icon={<Trash2 size={16} />}
                              size="small"
                              onClick={() => handleRemoveAdditionalDoc(file.uid)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<Maximize size={14} />}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExpandContent('inScope'); }}
                      style={{ padding: 0 }}
                    >
                      Expand
                    </Button>
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
                </div>
                <TiptapEditor
                  ref={inScopeRef}
                  content={formData.details.inScope}
                  onChange={html => updateDetail('inScope', html)}
                  minHeight={150}
                  maxHeight={300}
                />
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className="form-label" style={{ margin: 0 }}>Out of Scope</span>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <Button
                      type="link"
                      size="small"
                      icon={<Maximize size={14} />}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleExpandContent('outScope'); }}
                      style={{ padding: 0 }}
                    >
                      Expand
                    </Button>
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
                </div>
                <TiptapEditor
                  ref={outScopeRef}
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
                  options={browserListOptions}
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
                  options={osListOptions}
                  value={formData.details.environment?.os}
                  onChange={v => updateEnvironment('os', v)}
                  placeholder="Select OS"
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={12}>
                <span className="form-label">Device</span>
                <SearchableDropdown
                  mode="multiple"
                  options={[{ label: 'Desktop', value: 'Desktop' }, { label: 'Mobile', value: 'Mobile' }, { label: 'Tablet', value: 'Tablet' }]}
                  value={formData.details.environment?.device}
                  onChange={v => updateEnvironment('device', v)}
                  placeholder="Select or type devices"
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
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--brand-500)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text-slate-800)', flex: 1, wordBreak: 'break-word' }}>{text}</span>
                    <Button
                      type="text"
                      size="small"
                      danger
                      style={{ padding: '0 6px', fontSize: 15, lineHeight: 1, opacity: 0.5 }}
                      onClick={() => {
                        const updated = [...(formData.details.acceptanceCriteria || [])];
                        updated.splice(idx, 1);
                        updateDetail('acceptanceCriteria', updated);
                      }}
                    >×</Button>
                  </div>
                );
              })}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingTop: (formData.details.acceptanceCriteria || []).length > 0 ? 8 : 0, borderTop: (formData.details.acceptanceCriteria || []).length > 0 ? '1px dashed var(--border-slate-200)' : 'none' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--border-slate-300)', flexShrink: 0 }} />
                <Input
                  placeholder="Type a criterion and press Enter..."
                  value={newAcInput}
                  onChange={(e) => setNewAcInput(e.target.value)}
                  onPressEnter={() => {
                    if (newAcInput.trim()) {
                      updateDetail('acceptanceCriteria', [...(formData.details.acceptanceCriteria || []), newAcInput.trim()]);
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

              {/* Top 4 Fields side-by-side (50% each) */}
              <Col span={12}>
                <span className="form-label">Linked Bug Sheets</span>
                <SearchableDropdown
                  options={bugSheets.map(b => ({
                    label: b.name,
                    value: String(b.id),
                    description: b.folderName || 'Bug Sheet',
                    badge: <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>B</span>
                  }))}
                  value={formData.details.linkedItems?.bugSheets?.link ? String(formData.details.linkedItems.bugSheets.link) : undefined}
                  onChange={v => {
                    if (!v) {
                      updateLinkedItem('bugSheets', 'name', '');
                      updateLinkedItem('bugSheets', 'link', '');
                    } else {
                      const selected = bugSheets.find(b => String(b.id) === v);
                      if (selected) {
                        updateLinkedItem('bugSheets', 'name', selected.name);
                        updateLinkedItem('bugSheets', 'link', String(selected.id));
                      }
                    }
                  }}
                  onSearch={fetchBugSheetsSearch}
                  placeholder="Search Bug Sheets..."
                  style={{ width: '100%' }}
                />
              </Col>

              <Col span={12}>
                <span className="form-label">Linked Development Tickets</span>
                <SearchableDropdown
                  mode="multiple"
                  freeText
                  options={devTickets.map(t => ({
                    label: `${t.ticketNumber || t.id.substring(0, 8)} - ${t.title}`,
                    value: String(t.id),
                    description: t.status || '',
                    badge: <span style={{ background: '#8b5cf6', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>T</span>
                  }))}
                  value={
                    Array.isArray(formData.details.linkedItems?.devTickets)
                      ? formData.details.linkedItems.devTickets.map((t: any) => String(t.link))
                      : formData.details.linkedItems?.devTickets?.link
                        ? [String(formData.details.linkedItems.devTickets.link)]
                        : undefined
                  }
                  onChange={(v: string[]) => {
                    if (!v || v.length === 0) {
                      updateLinkedItemArray('devTickets', []);
                    } else {
                      const updated = v.map((idVal) => {
                        const selected = devTickets.find(t => String(t.id) === idVal);
                        if (selected) {
                          return {
                            name: `${selected.ticketNumber || selected.id.substring(0, 8)} - ${selected.title}`,
                            link: String(selected.id)
                          };
                        }
                        return { name: idVal, link: idVal };
                      });
                      updateLinkedItemArray('devTickets', updated);
                    }
                  }}
                  onSearch={fetchDevTicketsSearch}
                  placeholder="Search Dev Tickets..."
                  style={{ width: '100%' }}
                />
              </Col>

              <Col span={12}>
                <span className="form-label">Linked Sprints</span>
                <SearchableDropdown
                  options={sprints.map(s => ({
                    label: s.name,
                    value: String(s.id || s.name),
                    description: s.description || '',
                    badge: <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>S</span>
                  }))}
                  value={formData.details.linkedItems?.sprints?.link ? String(formData.details.linkedItems.sprints.link) : undefined}
                  onChange={v => {
                    if (!v) {
                      updateLinkedItem('sprints', 'name', '');
                      updateLinkedItem('sprints', 'link', '');
                    } else {
                      const selected = sprints.find(s => String(s.id || s.name) === v);
                      if (selected) {
                        updateLinkedItem('sprints', 'name', selected.name);
                        updateLinkedItem('sprints', 'link', String(selected.id || selected.name));
                      }
                    }
                  }}
                  onSearch={fetchSprintsSearch}
                  placeholder="Search Sprints..."
                  style={{ width: '100%' }}
                />
              </Col>

              <Col span={12}>
                <span className="form-label">Linked Test Cases</span>
                <SearchableDropdown
                  options={testCases.map(tc => ({
                    label: tc.name || tc.title || tc.id,
                    value: String(tc.id),
                    description: tc.status || '',
                    badge: <span style={{ background: '#10b981', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>TC</span>
                  }))}
                  value={formData.details.linkedItems?.testCases?.link ? String(formData.details.linkedItems.testCases.link) : undefined}
                  onChange={v => {
                    if (!v) {
                      updateLinkedItem('testCases', 'name', '');
                      updateLinkedItem('testCases', 'link', '');
                    } else {
                      const selected = testCases.find(tc => String(tc.id) === v);
                      if (selected) {
                        updateLinkedItem('testCases', 'name', selected.name || selected.title || selected.id);
                        updateLinkedItem('testCases', 'link', String(selected.id));
                      }
                    }
                  }}
                  onSearch={fetchTestCasesSearch}
                  placeholder="Search Test Cases..."
                  style={{ width: '100%' }}
                />
              </Col>

              <Col span={24}>
                <span className="form-label">Linked Test Suites</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input placeholder="Name" style={{ width: '40%' }} value={formData.details.linkedItems?.testSuites?.name} onChange={e => updateLinkedItem('testSuites', 'name', e.target.value)} />
                  <Input placeholder="Link URL" style={{ width: '60%' }} value={formData.details.linkedItems?.testSuites?.link} onChange={e => updateLinkedItem('testSuites', 'link', e.target.value)} />
                </div>
              </Col>

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
              ].map((field) => {
                const files = formData.details.attachments?.[field.key] || [];
                return (
                  <Col span={12} key={field.key}>
                    <span className="form-label">{field.label}</span>
                    <div style={{ marginTop: 8 }}>
                      <Dragger
                        className="custom-upload-dragger"
                        fileList={files}
                        onChange={info => updateAttachmentFiles(field.key, info)}
                        beforeUpload={() => false}
                        multiple
                        showUploadList={false}
                      >
                        <div className="group relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-400 transition-colors cursor-pointer text-center p-8">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 rounded-full bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 text-indigo-500 group-hover:scale-110 transition-transform">
                              <UploadCloud size={24} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                <span className="text-indigo-600 dark:text-indigo-400">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{field.label} (max 50MB)</p>
                            </div>
                          </div>
                        </div>
                      </Dragger>

                      {files.length > 0 && (
                        <div className="mt-4 flex flex-col gap-2">
                          {files.map((file: any) => (
                            <div key={file.uid} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm group hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                                  {field.key === 'screenshots' && (file.url || file.thumbUrl) ? (
                                    <>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={file.url || file.thumbUrl} alt={file.name} className="w-full h-full object-cover" />
                                    </>
                                  ) : field.key === 'screenshots' ? (
                                    <ImageIcon size={18} className="text-slate-400" />
                                  ) : field.key === 'pdfs' ? (
                                    <FileText size={18} className="text-red-400" />
                                  ) : (
                                    <FileIcon size={18} className="text-slate-400" />
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</span>
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    {file.size && <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>}
                                    {file.status === 'uploading' && <span className="text-indigo-500">Uploading...</span>}
                                    {file.status === 'done' && <span className="text-emerald-500">Ready</span>}
                                    {(!file.status || file.status === 'error') && <span className="text-slate-400">Ready</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {(field.key === 'screenshots' && (file.url || file.thumbUrl)) && (
                                  <Button
                                    type="text"
                                    icon={<Eye size={16} />}
                                    size="small"
                                    onClick={() => setPreviewImg({ src: file.url || file.thumbUrl, name: file.name })}
                                    className="text-slate-500 hover:text-indigo-600"
                                  />
                                )}
                                <Button
                                  type="text"
                                  icon={<Download size={16} />}
                                  size="small"
                                  onClick={() => {
                                    if (file.url) {
                                      const a = document.createElement('a');
                                      a.href = file.url;
                                      a.download = file.name;
                                      a.click();
                                    }
                                  }}
                                  className="text-slate-500 hover:text-indigo-600"
                                />
                                <Button
                                  type="text"
                                  danger
                                  icon={<Trash2 size={16} />}
                                  size="small"
                                  onClick={() => handleRemoveAttachment(field.key, file.uid)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Col>
                )
              })}
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
                    newDetails.approvalWorkflow = { ...newDetails.approvalWorkflow, position: val, user: undefined };
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

      <Drawer
        {...commonDrawerProps}
        onClose={() => { setIsExpandDrawerVisible(false); setExpandDrawerField(null); }}
        open={isExpandDrawerVisible}
        width={800}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-slate-100)' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: 'var(--text-slate-900)' }}>{expandDrawerTitle}</h2>
          <Button type="text" icon={<CloseOutlined />} onClick={() => setIsExpandDrawerVisible(false)} />
        </div>
        <div style={{ padding: '24px', height: 'calc(100vh - 65px)', overflowY: 'auto' }}>
          {expandDrawerField && (
            <TiptapEditor
              content={expandDrawerField === 'inScope' ? formData.details.inScope : formData.details.outScope}
              onChange={html => updateDetail(expandDrawerField, html)}
              minHeight={500}
            />
          )}
        </div>
      </Drawer>

      <Modal
        title={null}
        open={isZaiModalVisible}
        onCancel={() => setIsZaiModalVisible(false)}
        width={800}
        footer={null}
        destroyOnHidden
        centered
        closable={false}
        styles={{
          mask: { backdropFilter: 'blur(8px)', background: 'rgba(8, 12, 24, 0.55)' },
          content: { padding: 0, borderRadius: 22, overflow: 'hidden', background: 'transparent', boxShadow: '0 30px 80px rgba(8,12,24,0.45)' },
          body: { padding: 0 },
        }}
        wrapClassName="zai-modal-wrap"
      >
        <div className="zai-modal">
          {/* Hero */}
          <div className="zai-hero">
            <div className="zai-hero__bg" />
            <div className="zai-hero__content">
              <div className="zai-hero__brand">
                <div className="zai-orb">
                  <Sparkles size={20} />
                </div>
                <div className="zai-hero__title-wrap">
                  <div className="zai-hero__eyebrow">
                    <span className="zai-pill"><Zap size={10} strokeWidth={2.5} />ZAI · Smart Generation</span>
                  </div>
                  <h2 className="zai-hero__title">
                    Create with <span className="zai-grad">Zai</span>
                  </h2>
                  <p className="zai-hero__sub">
                    Describe what you want ZAI to generate for the {zaiTargetField === 'inScope' ? 'In Scope' : 'Out of Scope'} section.
                  </p>
                </div>
              </div>
              <button className="zai-close" onClick={() => setIsZaiModalVisible(false)} aria-label="Close">×</button>
            </div>
          </div>

          {/* Body */}
          <div className="zai-body">
            {zaiView === 'prompt' ? (
              <>
                <div className="zai-prompt">
                  <div className="zai-prompt__label">
                    <Wand2 size={14} />
                    <span>Instruction</span>
                  </div>
                  <div className="zai-prompt__row">
                    <Input.TextArea
                      rows={2}
                      placeholder="e.g. Generate a bulleted list of features targeting the login workflow..."
                      value={zaiPrompt}
                      onChange={(e) => setZaiPrompt(e.target.value)}
                      className="zai-textarea"
                      bordered={false}
                    />
                    <Button
                      type="primary"
                      onClick={submitZaiPrompt}
                      loading={zaiTargetField === 'inScope' ? generatingInScope : generatingOutScope}
                      className="zai-cta"
                      icon={!(zaiTargetField === 'inScope' ? generatingInScope : generatingOutScope) ? <Sparkles size={14} /> : null}
                    >
                      {(zaiTargetField === 'inScope' ? generatingInScope : generatingOutScope) ? 'Zai is thinking…' : 'Generate Content'}
                    </Button>
                  </div>

                  <div className="zai-template-list" style={{ marginTop: 24 }}>
                    <div className="zai-template-list__heading">
                      <span className="zai-suggestions__label">Try one of these</span>
                    </div>
                    <div className="zai-template-grid">
                      {[
                        { title: "Edge Cases", body: "Generate a comprehensive bulleted list of edge cases for the login workflow, focusing on invalid inputs, timeout scenarios, and concurrent session handling.", icon: '📋' },
                        { title: "Performance", body: "Define performance boundaries and limits, including expected response times under peak load, database query optimization targets, and acceptable API latency thresholds.", icon: '⚡' },
                        { title: "Standard Workflows", body: "Outline standard login workflows, covering successful authentication paths, password reset flows, MFA integration steps, and SSO provider redirection sequences.", icon: '🔐' },
                        { title: "Security Requirements", body: "List security testing requirements focusing on vulnerability assessments, penetration testing for API endpoints, data encryption standards, and role-based access control.", icon: '🛡️' }
                      ].map((t) => {
                        const active = zaiPrompt === t.body;
                        return (
                          <button
                            key={t.title}
                            type="button"
                            className={`zai-template-card ${active ? 'zai-template-card--active' : ''}`}
                            onClick={() => setZaiPrompt(t.body)}
                          >
                            <div className="zai-template-card__head">
                              <span className="zai-template-card__icon">{t.icon}</span>
                              <span className="zai-template-card__title">{t.title}</span>
                              <span className="zai-template-card__use">{active ? 'Selected' : 'Use this'}</span>
                            </div>
                            <p className="zai-template-card__body">{t.body}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="zai-compare">
                  <div className="zai-pane zai-pane--new" style={{ width: '100%' }}>
                    <div className="zai-pane__head" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="zai-pane__dot zai-pane__dot--new" />
                        <span className="zai-pane__title zai-pane__title--new">Zai's Generation</span>
                        <span className="zai-pane__badge">Ready</span>
                      </div>
                      <Button type="link" size="small" onClick={() => setZaiView('prompt')} style={{ padding: 0 }}>
                        Edit Prompt
                      </Button>
                    </div>
                    <div className="zai-pane__body zai-pane__body--new" style={{ minHeight: 200, maxHeight: 400, overflowY: 'auto', padding: 24 }}>
                      <TiptapViewer content={zaiGeneratedContent} />
                    </div>
                  </div>
                </div>

                <div className="zai-footer">
                  <div className="zai-footer__hint">
                    Review the generated content. You can replace, append, or insert at cursor.
                  </div>
                  <div className="zai-footer__actions">
                    <Button icon={<Copy size={14} />} onClick={handleZaiCopy} className="zai-btn-ghost">Copy</Button>
                    <Button onClick={() => submitZaiPrompt()} loading={zaiTargetField === 'inScope' ? generatingInScope : generatingOutScope} className="zai-btn-ghost">
                      Regenerate
                    </Button>
                    <Dropdown menu={{
                      items: [
                        { key: 'append', label: 'Append to end', onClick: () => handleZaiInsert('append') },
                        { key: 'insert', label: 'Insert at cursor', onClick: () => handleZaiInsert('insert') }
                      ]
                    }}>
                      <Button
                        type="primary"
                        onClick={() => handleZaiInsert('replace')}
                        className="zai-btn-apply"
                      >
                        Replace Content <ChevronDown size={14} style={{ marginLeft: 4 }} />
                      </Button>
                    </Dropdown>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
