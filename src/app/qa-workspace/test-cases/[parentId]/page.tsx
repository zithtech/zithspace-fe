"use client";

import NoData from "@/components/common/NoData";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Table, Tag, Dropdown, message, Drawer, Input, Select, Row, Col, Typography, Form, Tooltip, Popover, Space, Divider } from "antd";
import { PlusOutlined, EllipsisOutlined, ArrowLeftOutlined, SaveOutlined, InfoCircleOutlined, FileTextOutlined, BugOutlined, CheckCircleOutlined, LinkOutlined, SnippetsOutlined, CloseOutlined, SearchOutlined, SortAscendingOutlined, SortDescendingOutlined, FilterOutlined, ExpandAltOutlined, ReloadOutlined, ThunderboltOutlined, AppstoreOutlined, CopyOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useParams } from "next/navigation";
import { Target, Trash2, Pencil, Folder, ShieldCheck, User, UserPlus, Zap, Activity, Layers, Sparkles, CalendarDays, RotateCw, Braces, ChevronDown, ChevronRight, Copy, Plug } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios, apiClient } from "@/lib/axios";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { useDebounce } from "@/hooks/useDebounce";
import { useQaOptions } from "@/hooks/useQaOptions";
import TicketFilterPill from "@/components/projects/TicketFilterPill";
import ModuleCaseFilters from "./ModuleCaseFilters";
import {
  YapiezService,
  PAYLOAD_TYPES,
  PAYLOAD_TYPE_HELP,
  PAYLOAD_TYPE_TONE,
  METHOD_COLORS,
  type YapiezApi,
  type CasePayload,
  type DraftedPayload,
  type PayloadType,
  type HttpMethod,
} from "@/services/yapiezService";

const { TextArea } = Input;

/** Maps a lifecycle status onto the restricted pill palette. */
const statusTone = (s?: string) =>
  (s === 'Active' || s === 'Ready') ? 'green'
    : s === 'Deprecated' ? 'red'
      : s === 'Draft' ? 'ash' : 'blue';

const PRIORITY_LEVEL: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

/** Priority as filled steps — rank without extra accent colours. */
const PriorityMeter = ({ priority }: { priority?: string }) => {
  const level = PRIORITY_LEVEL[priority || ''] || 0;
  if (!level) return <span className="sc-muted">—</span>;
  return (
    <Tooltip title={`${priority} priority`}>
      <span className="sc-prio">
        <span className="sc-prio__bars">
          {[1, 2, 3, 4].map(i => (
            <span key={i} className={`sc-prio__bar${i <= level ? ' is-on' : ''}${level === 4 ? ' is-max' : ''}`} />
          ))}
        </span>
        <span className="sc-prio__label">{priority}</span>
      </span>
    </Tooltip>
  );
};

const fmtDate = (d?: string) => {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * One line of the scenario summary in the rail. `loading` swaps the value for a
 * shimmer so the card keeps its shape while the scenario is being fetched.
 */
const PayloadRow = ({ payload, onDelete }: { payload: CasePayload; onDelete?: () => void }) => {
  const [open, setOpen] = useState(false);
  const tone = PAYLOAD_TYPE_TONE[payload.payloadType] ?? PAYLOAD_TYPE_TONE.Positive;
  const json = JSON.stringify(payload.payload ?? {}, null, 2);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      message.success('Payload copied');
    } catch {
      message.error('Could not copy — select the text and copy it by hand');
    }
  };

  return (
    <div className="pl-row">
      <div className="pl-row__head">
        <button type="button" className="pl-row__toggle" onClick={() => setOpen(!open)}>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        <span
          className="pl-tag"
          style={{ color: tone.text, background: tone.bg, borderColor: tone.border }}
        >
          {payload.payloadType}
        </span>
        <span className="pl-row__name" title={payload.name}>{payload.name}</span>
        {payload.expectedStatus && <span className="pl-row__status">{payload.expectedStatus}</span>}
        <Tooltip title="Copy payload">
          <button type="button" className="pl-row__act" onClick={copy} aria-label="Copy payload">
            <Copy size={13} />
          </button>
        </Tooltip>
        {onDelete && (
          <ConfirmDialog
            tone="danger"
            title="Remove this payload?"
            description={`"${payload.name}" will be deleted from this test case.`}
            confirmText="Remove"
            onConfirm={onDelete}
          >
            <button type="button" className="pl-row__act pl-row__act--danger" aria-label="Remove payload">
              <Trash2 size={13} />
            </button>
          </ConfirmDialog>
        )}
      </div>

      {payload.apiMethod && (
        <div className="pl-row__api">
          <span className="pl-row__method">{payload.apiMethod}</span>
          <span className="pl-row__url" title={payload.apiUrl || undefined}>{payload.apiUrl}</span>
        </div>
      )}

      {open && (
        <>
          {payload.notes && <p className="pl-row__notes">{payload.notes}</p>}
          <pre className="pl-row__json">{json}</pre>
        </>
      )}
    </div>
  );
};


export default function ParentTestCaseDetailsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestCaseDetails" });

  const router = useRouter();
  const params = useParams();
  const parentId = params?.parentId as string;
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isFilterRowOpen, setIsFilterRowOpen] = useState(false);

  const [parentData, setParentData] = useState<any>(null);
  const [childCases, setChildCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [suitesDrawerOpen, setSuitesDrawerOpen] = useState(false);
  const [selectedCaseForSuites, setSelectedCaseForSuites] = useState<any>(null);

  // Read-only case view, opened by clicking a row
  const [viewOpen, setViewOpen] = useState(false);
  const [viewCase, setViewCase] = useState<any>(null);

  // Filters + pagination for the module case list
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, typeFilter, priorityFilter, statusFilter, sortOrder]);

  // Drawer state for Create / Edit Child Test Case
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [newStepInput, setNewStepInput] = useState("");

  // "Create with Zai" — drafts the case from a plain-language description
  const [zaiOpen, setZaiOpen] = useState(true);
  const [zaiPrompt, setZaiPrompt] = useState("");
  const [zaiGenerating, setZaiGenerating] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    preconditions: string;
    steps_to_reproduce: string[];
    expected_result: string;
    priority: string;
    severity: string;
    test_type?: string;
    automation: string;
    status: string;
  }>({
    name: "",
    description: "",
    preconditions: "",
    steps_to_reproduce: [],
    expected_result: "",
    priority: "Medium",
    severity: "Major",
    test_type: undefined,
    automation: "Manual",
    status: "Active"
  });

  /* ── Advanced: API request payloads ──────────────────────────────────────
     The tester picks an endpoint from THIS case's module, picks which of the
     four shapes they want, and the server drafts a body from the definition.
     Nothing is stored until they confirm it — a draft is disposable, and the
     table should only ever hold payloads somebody chose. */
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [moduleApis, setModuleApis] = useState<YapiezApi[]>([]);
  const [apisLoading, setApisLoading] = useState(false);
  const [apisLoaded, setApisLoaded] = useState(false);
  const [payloadApiId, setPayloadApiId] = useState<string | undefined>();
  const [payloadType, setPayloadType] = useState<PayloadType>("Positive");
  const [payloadHint, setPayloadHint] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<DraftedPayload | null>(null);
  /* The draft as editable text, so a tester can correct a value the model got
     wrong without regenerating the whole body. Parsed back on confirm. */
  const [draftText, setDraftText] = useState("");
  const [draftName, setDraftName] = useState("");
  const [confirming, setConfirming] = useState(false);
  /** Payloads already confirmed — the case's own when editing, plus this session's. */
  const [casePayloads, setCasePayloads] = useState<CasePayload[]>([]);
  /** Confirmed before the case existed; adopted by it the moment it is saved. */
  const [pendingPayloadIds, setPendingPayloadIds] = useState<string[]>([]);
  /** Payloads on the case the read-only view is showing. */
  const [viewPayloads, setViewPayloads] = useState<CasePayload[]>([]);
  const [viewPayloadsLoading, setViewPayloadsLoading] = useState(false);

  const { canReadCase, canCreateCase } = usePermission();
  // Priority / severity / type come from QA Settings
  const { priorityOptions, severityOptions, testTypeOptions } = useQaOptions();

  const parseSteps = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val.map(String);
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch (e) {}
    if (typeof val === "string") {
      return val
        .split("\n")
        .map((s) => s.replace(/^\d+\.\s*/, "").trim())
        .filter(Boolean);
    }
    return [];
  };

  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async () => {
    if (!parentId) return;
    try {
      setLoading(true);
      const [parentRes, childRes] = await Promise.all([
        axios.get(`/api/v2/qa/parents/${parentId}`),
        apiClient.get(`/api/v2/qa`, {
          params: { 
            parent_id: parentId, 
            page, 
            pageSize,
            search: debouncedSearch || undefined,
            test_type: typeFilter || undefined,
            priority: priorityFilter || undefined,
            status: statusFilter || undefined,
            sort: sortOrder || 'position_asc'
          }
        })
      ]);
      setParentData(parentRes?.data?.data || parentRes?.data || parentRes || null);
      
      const body = (childRes as any).data;
      setChildCases(body?.data || []);
      setTotalItems(body?.pagination?.total || 0);
    } catch (error) {
      message.error("Failed to load test scenario details");
      router.push("/qa-workspace/test-cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadCase && parentId) {
      fetchData();
    }
  }, [canReadCase, parentId, page, pageSize, debouncedSearch, typeFilter, priorityFilter, statusFilter, sortOrder]);

  /**
   * Draft the case from the tester's description. Only fills fields the user
   * hasn't already written in, so a partly-filled form is never clobbered.
   */
  const handleZaiGenerate = async () => {
    const prompt = zaiPrompt.trim();
    if (!prompt || zaiGenerating) return;
    setZaiGenerating(true);
    try {
      const res: any = await axios.post('/api/v2/qa/generate-ai', {
        prompt,
        scenarioTitle: parentData?.title,
        moduleName: parentData?.module_name,
        feature: parentData?.feature,
      });
      const d = res?.data?.data ?? res?.data ?? res;
      if (!d?.name && !(d?.steps_to_reproduce?.length)) {
        message.error('Zai returned nothing usable. Try describing the case in more detail.');
        return;
      }

      setFormData(prev => ({
        ...prev,
        name: prev.name.trim() || d.name || prev.name,
        description: prev.description.trim() || d.description || prev.description,
        preconditions: prev.preconditions.trim() || d.preconditions || prev.preconditions,
        steps_to_reproduce: prev.steps_to_reproduce.length ? prev.steps_to_reproduce : (d.steps_to_reproduce || []),
        expected_result: prev.expected_result.trim() || d.expected_result || prev.expected_result,
        test_type: prev.test_type || d.test_type || prev.test_type,
        priority: d.priority || prev.priority,
        severity: d.severity || prev.severity,
      }));

      setZaiOpen(false);
      message.success('Zai drafted the case — review it before saving.');
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || 'Failed to draft the test case');
    } finally {
      setZaiGenerating(false);
    }
  };

  /* ── Advanced payload handlers ───────────────────────────────────────── */

  /** Clear the draft, keeping the API and type the tester already chose. */
  const resetPayloadDraft = () => {
    setDraft(null);
    setDraftText("");
    setDraftName("");
    setPayloadHint("");
  };

  /**
   * The endpoints this case can be written against.
   *
   * Scoped to the scenario's module, because that is the taxonomy the API
   * catalog files under too — a case about Billing should not be offered the
   * Auth endpoints. A scenario with no module falls back to the project's
   * definitions rather than an empty list, and the field says which it is.
   */
  const loadModuleApis = async () => {
    if (apisLoading) return;
    setApisLoading(true);
    try {
      const moduleName = String(parentData?.module_name || "").trim();
      const res = await YapiezService.listApis({
        moduleName: moduleName && moduleName !== "Unassigned" ? moduleName : undefined,
        projectId: parentData?.project_id || undefined,
        sort: "name",
        pageSize: 200,
      });
      setModuleApis(res.data || []);
      setApisLoaded(true);
    } catch (err: any) {
      // A tester without API Hub access still gets the rest of the drawer.
      setModuleApis([]);
      setApisLoaded(true);
      if (err?.response?.status !== 403) {
        message.error(err?.response?.data?.error || "Failed to load APIs for this module");
      }
    } finally {
      setApisLoading(false);
    }
  };

  /** Draft a payload. Writes nothing — the tester confirms before it is stored. */
  const handleGeneratePayload = async () => {
    if (!payloadApiId) {
      message.error("Pick an API first");
      return;
    }
    setDrafting(true);
    try {
      const drafted = await YapiezService.generatePayload({
        apiId: payloadApiId,
        payloadType,
        hint: payloadHint.trim() || undefined,
      });
      setDraft(drafted);
      setDraftText(JSON.stringify(drafted.payload, null, 2));
      setDraftName(drafted.suggestedName);
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to generate the payload");
    } finally {
      setDrafting(false);
    }
  };

  /**
   * Store the drafted payload against this case.
   *
   * While the case is still being created there is no id to attach it to, so it
   * is parented to the scenario and picked up by `handleSaveChildCase`.
   */
  const handleConfirmPayload = async () => {
    if (!draft || !payloadApiId) return;
    if (!draftName.trim()) {
      message.error("Give the payload a name");
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(draftText);
    } catch {
      message.error("The payload is not valid JSON — fix it before confirming");
      return;
    }

    setConfirming(true);
    try {
      const saved = await YapiezService.createPayload({
        apiId: payloadApiId,
        payloadType,
        name: draftName.trim(),
        payload: parsed,
        expectedStatus: draft.expectedStatus,
        notes: draft.notes || null,
        generatedBy: draft.generatedBy,
        testCaseId: editingCaseId || null,
        parentTestCaseId: parentId,
      });
      setCasePayloads((prev) => [...prev, saved]);
      if (!editingCaseId) setPendingPayloadIds((prev) => [...prev, saved.id]);
      resetPayloadDraft();
      message.success(`${payloadType} payload saved`);
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to save the payload");
    } finally {
      setConfirming(false);
    }
  };

  const handleDeletePayload = async (id: string) => {
    try {
      await YapiezService.deletePayload(id);
      setCasePayloads((prev) => prev.filter((p) => p.id !== id));
      setPendingPayloadIds((prev) => prev.filter((pid) => pid !== id));
      setViewPayloads((prev) => prev.filter((p) => p.id !== id));
      message.success("Payload removed");
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to remove the payload");
    }
  };

  /**
   * Close the create/edit drawer, throwing away payloads confirmed for a case
   * that was never saved. They belong to nothing once the drawer is abandoned,
   * and leaving them would fill the table with bodies no case ever reads.
   */
  const closeCaseDrawer = () => {
    const orphans = pendingPayloadIds;
    setDrawerOpen(false);
    setPendingPayloadIds([]);
    if (orphans.length) {
      Promise.all(orphans.map((id) => YapiezService.deletePayload(id).catch(() => null)));
    }
  };

  /** Open the read-only view, pulling in the payloads the case carries. */
  const openCaseView = async (record: any) => {
    setViewCase(record);
    setViewOpen(true);
    setViewPayloads([]);
    setViewPayloadsLoading(true);
    try {
      setViewPayloads(await YapiezService.listPayloads({ testCaseId: record.id }));
    } catch {
      // The case still reads without them; no toast for a side panel.
      setViewPayloads([]);
    } finally {
      setViewPayloadsLoading(false);
    }
  };

  const handleOpenCreateDrawer = () => {
    setEditingCaseId(null);
    setNewStepInput("");
    setZaiPrompt("");
    setZaiGenerating(false);
    setZaiOpen(true);
    setFormData({
      name: "",
      description: "",
      preconditions: "",
      steps_to_reproduce: [],
      expected_result: "",
      priority: "Medium",
      severity: "Major",
      test_type: undefined,
      automation: parentData?.automation || "Manual",
      status: "Active"
    });
    setAdvancedOpen(false);
    setPayloadApiId(undefined);
    setPayloadType("Positive");
    setCasePayloads([]);
    setPendingPayloadIds([]);
    resetPayloadDraft();
    setDrawerOpen(true);
  };

  const handleOpenEditDrawer = (record: any) => {
    setEditingCaseId(record.id);
    setNewStepInput("");
    setZaiPrompt("");
    setZaiGenerating(false);
    setZaiOpen(false); // editing starts from existing content, not a blank draft
    setFormData({
      name: record.name || "",
      description: record.description || "",
      preconditions: record.preconditions || "",
      steps_to_reproduce: parseSteps(record.steps_to_reproduce),
      expected_result: record.expected_result || "",
      priority: record.priority || "Medium",
      severity: record.severity || "Major",
      test_type: record.test_type || undefined,
      automation: record.automation || "Manual",
      status: record.status || "Active"
    });
    setAdvancedOpen(false);
    setPayloadApiId(undefined);
    setPayloadType("Positive");
    setPendingPayloadIds([]);
    resetPayloadDraft();
    // Payloads already on this case, so the section opens showing what exists
    // rather than looking empty until the tester generates something.
    setCasePayloads([]);
    YapiezService.listPayloads({ testCaseId: record.id })
      .then(setCasePayloads)
      .catch(() => setCasePayloads([]));
    setDrawerOpen(true);
  };

  const handleSaveChildCase = async (addAnother: boolean = false) => {
    if (!formData.name.trim()) {
      message.error("Please enter a Test Case Name");
      return;
    }
    try {
      setSubmitting(true);
      const finalSteps = [...(formData.steps_to_reproduce || [])];
      if (newStepInput.trim()) {
        finalSteps.push(newStepInput.trim());
        setNewStepInput("");
      }
      const payload = {
        ...formData,
        steps_to_reproduce: JSON.stringify(finalSteps),
        parent_test_case_id: parentId,
        module_id: parentData?.module_id || null,
        feature: parentData?.feature || null
      };

      if (editingCaseId) {
        await axios.put(`/api/v2/qa/${editingCaseId}`, payload);
        message.success("Test case updated successfully!");
        setDrawerOpen(false);
      } else {
        const created: any = await axios.post(`/api/v2/qa`, payload);
        const newCaseId = created?.data?.data?.id || created?.data?.id;
        // Payloads confirmed before the case existed are adopted by it now.
        // A failure here must not read as a failed save — the case is written,
        // and the payloads are still recoverable from the scenario.
        if (newCaseId && pendingPayloadIds.length) {
          try {
            await YapiezService.linkPayloads(newCaseId, pendingPayloadIds);
          } catch {
            message.warning("Test case saved, but its API payloads could not be attached.");
          }
          setPendingPayloadIds([]);
        }
        message.success("Module Test Case created successfully!");
        if (addAnother) {
          setNewStepInput("");
          setCasePayloads([]);
          setPayloadApiId(undefined);
          resetPayloadDraft();
          // Reset form for next entry without closing drawer or losing context
          setFormData({
            name: "",
            description: "",
            preconditions: "",
            steps_to_reproduce: [],
            expected_result: "",
            priority: "Medium",
            severity: "Major",
            test_type: undefined,
            automation: parentData?.automation || "Manual",
            status: "Active"
          });
        } else {
          setDrawerOpen(false);
        }
      }
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to save test case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChild = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await axios.delete(`/api/v2/qa/${id}`);
      message.success("Test case deleted successfully");
      fetchData();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Failed to delete test case");
    }
  };


  /* Columns mirror the Ticket List: a copyable ID, the title, then the
     one-glance attributes, with row actions pinned to the right. */
  const childColumns = [
    {
      title: "ID",
      dataIndex: "test_case_id",
      key: "test_case_id",
      width: 118,
      render: (t: string, record: any) => {
        const label = t || String(record.id || '').slice(0, 8).toUpperCase();
        return (
          <span
            className="pp-case-id"
            onClick={(e) => { e.stopPropagation(); openCaseView(record); }}
            title={label}
          >
            {label}
            <CopyOutlined
              style={{ fontSize: 10, opacity: 0.6 }}
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(label);
                message.success("Case ID copied!");
              }}
            />
          </span>
        );
      },
    },
    {
      title: "Title",
      dataIndex: "name",
      key: "name",
      width: 340,
      ellipsis: true,
      // Single line by design — the expected result lives in the view drawer
      render: (t: string) => (
        <div className="pp-name-cell" title={t || 'Untitled case'}>
          <span className="pp-name-icon"><FileTextOutlined /></span>
          <span className="pp-name-title">{t || 'Untitled case'}</span>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (t: string) => {
        const v = t || 'Active';
        const color = (v === 'Active' || v === 'Ready') ? '#10b981'
          : v === 'Deprecated' ? '#ef4444'
          : v === 'Draft' ? '#64748b' : '#3b82f6';
        return (
          <span className="pp-vis-pill" style={{ color, background: `${color}1A`, borderColor: `${color}40` }}>
            <span className="pp-vis-dot" style={{ background: color }} />
            {v}
          </span>
        );
      }
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 130,
      render: (t: string) => <PriorityMeter priority={t || 'Medium'} />
    },
    {
      title: "Type",
      dataIndex: "test_type",
      key: "test_type",
      width: 130,
      render: (t: string) => <span className="pp-vis-pill pp-vis-pill--ash">{t || 'Functional'}</span>
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 110,
      render: (t: string) => <span className="pp-plain">{t || 'Major'}</span>
    },
    {
      title: "Suites",
      dataIndex: "suite_count",
      key: "suite_count",
      width: 100,
      render: (_: any, record: any) => {
        const count = record.test_suites?.length || record.suite_count || 0;
        if (!count) return <span className="sc-muted">—</span>;
        return (
          <button
            type="button"
            className="tc-suites"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCaseForSuites(record);
              setSuitesDrawerOpen(true);
            }}
            title="View linked Test Suites"
          >
            <LinkOutlined />
            <span>{count}</span>
          </button>
        );
      }
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      align: "right" as const,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <div className="sc-rowactions" onClick={e => e.stopPropagation()}>
          <Tooltip title="Edit">
            <button onClick={(e) => { e.stopPropagation(); handleOpenEditDrawer(record); }} aria-label="Edit">
              <Pencil size={15} />
            </button>
          </Tooltip>
          <ConfirmDialog
            tone="danger"
            title="Delete Module Test Case?"
            description={`Are you sure you want to delete "${record.name}" (${record.test_case_id})?`}
            confirmText="Delete"
            onConfirm={() => handleDeleteChild(record.id)}
          >
            <Tooltip title="Delete">
              <button className="is-danger" onClick={(e) => e.stopPropagation()} aria-label="Delete">
                <Trash2 size={15} />
              </button>
            </Tooltip>
          </ConfirmDialog>
        </div>
      )
    }
  ];

  // ── Derived: stats, filters, pagination ──────────────────────────────────
  const activeCount = childCases.filter(t => t.status === 'Active' || t.status === 'Ready').length;
  const automatedCount = childCases.filter(t => t.automation === 'Automated').length;
  const highPriorityCount = childCases.filter(t => t.priority === 'High' || t.priority === 'Critical').length;

  const filteredCases = childCases;

  const uniqueSorted = (values: any[]) =>
    Array.from(new Set(values.filter(Boolean)))
      .sort((a, b) => String(a).localeCompare(String(b)))
      .map(v => ({ value: String(v), label: String(v) }));

  const typeFilterOptions = uniqueSorted(childCases.map(c => c.test_type || 'Functional'));
  const statusFilterOptions = uniqueSorted(childCases.map(c => c.status || 'Active'));

  const activeFilterCount = (searchTerm.trim() ? 1 : 0) + (typeFilter ? 1 : 0) + (priorityFilter ? 1 : 0) +
    (statusFilter ? 1 : 0);
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter(undefined);
    setPriorityFilter(undefined);
    setStatusFilter(undefined);
    setSortOrder("asc");
  };



  /* ── Banner figures ───────────────────────────────────────────────────
     The Ticket List's sprint head reads a sprint's completion; here the same
     three rows read how much of this scenario is active. */
  const activePct = childCases.length > 0 ? Math.round((activeCount / childCases.length) * 100) : 0;
  const bannerAccent =
    parentData?.status === 'Deprecated' ? '#ef4444'
      : activePct >= 60 ? '#10b981'
        : activePct > 0 ? '#3b82f6' : '#64748b';

  /** The shared NoData illustration, carrying this table's own words. */
  const renderEmpty = () => (
    <NoData
      description={
        <div className="sc-empty">
          <FileTextOutlined className="sc-empty__icon" />
          <p className="sc-empty__title">
            {activeFilterCount > 0 ? 'No cases match these filters' : 'No module test cases yet'}
          </p>
          <p className="sc-empty__desc">
            {activeFilterCount > 0
              ? 'Try widening your search or clearing the filters.'
              : 'Add the testing instructions, steps and expected behaviour for this scenario.'}
          </p>
          {activeFilterCount > 0
            ? <Button size="small" onClick={clearFilters}>Clear filters</Button>
            : canCreateCase && <Button type="primary" size="small" icon={<PlusOutlined />} onClick={handleOpenCreateDrawer}>Create module case</Button>}
        </div>
      }
    />
  );

  const pageCount = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, totalItems);
  const pagedCases = childCases;

  // Same gate the sibling QA pages use — the fetch above already sits behind
  // canReadCase, so without this an unpermitted user would get empty chrome.
  if (!canReadCase) return null;

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: `
        .dh-shell { display: flex; height: calc(100vh - 64px); background: transparent; overflow: hidden; position: relative; }
        .dh-sidebar {
          width: 220px; background: transparent; border-right: 1px solid var(--border-slate-200);
          display: flex; flex-direction: column; z-index: 10; flex-shrink: 0;
        }
        .dh-sidebar-top { padding: 12px 10px 10px; flex-shrink: 0; border-bottom: 1px solid var(--border-slate-100); }
        .pp-side-head { display: flex; align-items: center; gap: 9px; margin-bottom: 0; padding: 0 2px; }
        .pp-side-logo {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: var(--bg-blue-50, rgba(59,130,246,0.1)); color: #3B82F6;
          display: flex; align-items: center; justify-content: center; font-size: 15px;
          border: 1px solid rgba(59,130,246,.16);
        }
        .pp-side-title { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.15; margin: 0; }
        .pp-side-subtitle { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; margin: 1px 0 0; letter-spacing: .02em; }
        .pp-side-cta { margin-top: 12px; height: 34px !important; border-radius: 8px !important; font-size: 12.5px; font-weight: 600; }

        .dh-sidebar-scroll { flex: 1; overflow-y: auto; padding: 12px 8px 16px; }
        .pp-nav-caption {
          display: block; padding: 0 8px; margin: 0 0 6px;
          font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .pp-nav-item {
          position: relative;
          display: flex; align-items: center; gap: 9px; width: 100%; height: 33px; padding: 0 9px;
          border-radius: 7px; border: none; background: transparent; color: var(--text-slate-600);
          font-size: 12.5px; font-weight: 500; cursor: pointer; text-align: left;
          transition: background .15s ease, color .15s ease; margin-bottom: 2px;
        }
        .pp-nav-icon { flex-shrink: 0; color: var(--text-slate-400); font-size: 14px; transition: color .15s ease; }
        .pp-nav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pp-nav-count {
          flex-shrink: 0; min-width: 20px; padding: 1px 6px; border-radius: 999px;
          font-size: 10.5px; font-weight: 700; text-align: center;
          background: var(--bg-slate-50); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-100); transition: all .15s ease;
        }
        .pp-nav-item:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .pp-nav-item:hover .pp-nav-icon { color: var(--text-slate-600); }
        .pp-nav-item.is-active { background: var(--bg-blue-50, rgba(59,130,246,0.1)); color: #3B82F6; font-weight: 650; }
        .pp-nav-item.is-active .pp-nav-icon { color: #3B82F6; }
        .pp-nav-item.is-active .pp-nav-count { background: rgba(59,130,246,.14); color: #2563eb; border-color: transparent; }
        .pp-nav-item.is-active::before {
          content: ''; position: absolute; left: -8px; top: 7px; bottom: 7px;
          width: 3px; border-radius: 0 3px 3px 0; background: #3B82F6;
        }

        /* ── Scenario summary card in the rail ─────────────────────── */
        .cd-side-caption { margin-top: 18px !important; }
        .cd-side {
          margin: 0; overflow: hidden;
          border: 1px solid var(--border-slate-200); border-radius: 10px;
          background: transparent;
        }
        .cd-fact {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 9px 10px;
          transition: background .15s ease;
        }
        .cd-fact + .cd-fact { border-top: 1px solid var(--border-slate-100); }
        .cd-fact:hover { background: var(--bg-slate-50); }
        .cd-fact__ic {
          width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0; margin-top: 1px;
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-slate-400); background: var(--bg-slate-50);
          border: 1px solid var(--border-slate-100);
          transition: color .15s ease, background .15s ease, border-color .15s ease;
        }
        .cd-fact--accent .cd-fact__ic {
          color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.2);
        }
        .cd-fact:hover .cd-fact__ic { color: var(--text-slate-600); }
        .cd-fact--accent:hover .cd-fact__ic { color: #2563eb; }
        .cd-fact__body { display: flex; flex-direction: column; gap: 3px; min-width: 0; flex: 1; }
        .cd-fact__label {
          font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--text-slate-400); line-height: 1;
        }
        .cd-fact__val { display: block; min-width: 0; font-size: 12px; line-height: 1.35; }
        /* Values wrap to a second line rather than being cut mid-word. */
        .cd-fact__text {
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; overflow-wrap: anywhere;
          font-weight: 600; color: var(--text-slate-800);
        }
        .cd-fact__text.is-muted { font-weight: 500; color: var(--text-slate-400); }
        .cd-fact__unit { font-weight: 500; color: var(--text-slate-400); }
        .cd-fact .sc-pill { font-size: 10.5px; padding: 2px 8px; }
        .cd-fact .sc-person { max-width: 100%; }
        .cd-fact .sc-person__av--ash { background: rgba(100,116,139,.12); color: #64748b; }

        /* Placeholder line while the scenario loads */
        .cd-skel {
          display: block; height: 12px; width: 70%; border-radius: 4px;
          background: linear-gradient(90deg, var(--bg-slate-50) 25%, var(--border-slate-100) 37%, var(--bg-slate-50) 63%);
          background-size: 400% 100%; animation: cd-shimmer 1.4s ease infinite;
        }
        .cd-fact:nth-child(even) .cd-skel { width: 55%; }
        @keyframes cd-shimmer {
          0% { background-position: 100% 50%; }
          100% { background-position: 0 50%; }
        }

        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar { height: auto; min-height: 64px; border-bottom: 1px solid var(--border-slate-200); background: transparent; display: flex; align-items: center; justify-content: space-between; padding: 12px 24px; }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px; background: transparent; }

        /* ── Topbar: one line ───────────────────────────────────────── */
        .sc-topbar { min-height: 52px !important; padding: 8px 20px !important; }
        .sc-topbar__title { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
        .sc-topbar__h1 { font-size: 15px; font-weight: 700; color: var(--text-slate-900); }
        .sc-topbar__div { width: 1px; height: 14px; background: var(--border-slate-200); flex-shrink: 0; }
        .cd-back { flex-shrink: 0; }
        .cd-crumb {
          font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 600;
          color: var(--text-slate-400); white-space: nowrap; flex-shrink: 0;
        }
        .cd-crumb--strong { color: var(--text-slate-600); max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
        .cd-sep { color: var(--border-slate-200); flex-shrink: 0; }
        .cd-title { min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sc-topbar .dh-main-controls { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .sc-topbar .dh-main-controls .ant-btn { height: 32px !important; border-radius: 8px; }
        @media (max-width: 900px) { .cd-crumb, .cd-sep, .sc-topbar__div { display: none; } }

        /* ── Stat tiles ─────────────────────────────────────────────── */
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
        .sc-stat-hit { cursor: pointer; outline: none; }
        .sc-stat-hit .pp-stat-card { transition: border-color .15s ease, background .15s ease; }
        .sc-stat-hit:hover .pp-stat-card { border-color: #bfdbfe; background: var(--bg-slate-50); }
        .sc-stat-hit.is-active .pp-stat-card { border-color: #3b82f6; box-shadow: inset 0 -2px 0 #3b82f6; }
        .sc-stat-hit:focus-visible .pp-stat-card { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }

        /* ── Filter row ─────────────────────────────────────────────── */
        .sc-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
        .sc-filters__search { width: 240px; }
        .sc-filters .ant-input-affix-wrapper { height: 32px !important; border-radius: 8px; }
        .sc-filters__field { min-width: 150px; }
        .sc-filters .sd-trigger, .sc-filters .ant-select-selector { height: 32px !important; min-height: 32px !important; border-radius: 8px !important; padding-block: 0 !important; align-items: center; }
        .sc-clear {
          height: 32px; display: inline-flex; align-items: center;
          font-size: 12px; font-weight: 600; color: #3b82f6;
          padding: 0 11px; border-radius: 8px;
          border: 1px solid var(--border-slate-200); background: transparent;
          cursor: pointer; transition: all .15s ease;
        }
        .sc-clear:hover { background: var(--bg-blue-50); border-color: #bfdbfe; }
        .sc-sort-btn {
          height: 32px; width: 32px; display: inline-flex; align-items: center; justify-content: center;
          border-radius: 8px; border: 1px solid var(--border-slate-200); background: transparent;
          color: var(--text-slate-600); cursor: pointer; transition: all .15s ease; font-size: 16px;
        }
        .sc-sort-btn:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }

        /* ── Table cells ────────────────────────────────────────────── */
        .sc-tablewrap { background: transparent; border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .sc-table, .sc-table.ant-table-wrapper, .sc-table .ant-table, .sc-table .ant-table-container, .sc-table .ant-table-content, .sc-table .ant-table-header, .sc-table .ant-table-body { border-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th, .sc-table .ant-table-thead > tr > td { border-radius: 0 !important; border-start-start-radius: 0 !important; border-start-end-radius: 0 !important; }
        .sc-table .ant-table-thead > tr > th { background: var(--bg-slate-50) !important; padding: 8px 14px !important; letter-spacing: .06em !important; }
        .sc-table .ant-table-tbody > tr > td { padding: 8px 14px !important; }
        .sc-table .ant-table-tbody > tr { cursor: pointer; }
        .sc-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .sc-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .sc-table .ant-table-tbody > tr > td:last-child { padding-right: 12px !important; }

        .sc-name { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .sc-name__badge {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 27px; height: 27px; border-radius: 7px;
          background: rgba(59,130,246,.1); color: #2563eb;
          font-size: 10px; font-weight: 700; letter-spacing: .02em;
        }
        .sc-name__title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
        .cd-plain { font-size: 12.5px; color: var(--text-slate-700); }
        .sc-muted { color: var(--text-slate-400); }

        .sc-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 3px 10px; border-radius: 999px; white-space: nowrap;
          font-size: 11.5px; font-weight: 600;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-600);
        }
        .sc-pill__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
        .sc-pill--blue { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.22); }
        .sc-pill--green { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.24); }
        .sc-pill--red { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.22); }
        .sc-pill--ash { color: #64748b; background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.2); }

        .sc-prio { display: inline-flex; align-items: center; gap: 8px; }
        .sc-prio__bars { display: inline-flex; align-items: flex-end; gap: 2px; }
        .sc-prio__bar { width: 4px; height: 12px; border-radius: 2px; background: var(--border-slate-200); }
        .sc-prio__bar.is-on { background: #60a5fa; }
        .sc-prio__bar.is-on.is-max { background: #2563eb; }
        .sc-prio__label { font-size: 12px; font-weight: 500; color: var(--text-slate-600); }

        .sc-person { display: inline-flex; align-items: center; gap: 7px; min-width: 0; }
        .sc-person__av {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 20px; height: 20px; border-radius: 999px;
          background: rgba(59,130,246,.12); color: #2563eb; font-size: 8.5px; font-weight: 700;
        }
        .sc-person__name { font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; text-overflow: ellipsis; }

        .tc-suites {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 10px; border-radius: 999px; cursor: pointer;
          font-size: 11.5px; font-weight: 600;
          color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.22);
          transition: all .15s ease;
        }
        .tc-suites:hover { background: rgba(59,130,246,.18); }

        .sc-rowactions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
        .sc-rowactions button {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 7px; cursor: pointer;
          border: 1px solid transparent; background: transparent; color: var(--text-slate-400);
          transition: all .15s ease;
        }
        .sc-rowactions button:hover { color: #2563eb; background: var(--bg-blue-50); border-color: #bfdbfe; }
        .sc-rowactions button.is-danger:hover { color: #dc2626; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); }

        .sc-empty { padding: 44px 24px; text-align: center; }
        .sc-empty__icon { font-size: 26px; color: var(--border-slate-200); display: inline-block; }
        .sc-empty__title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: var(--text-slate-700); }
        .sc-empty__desc { margin: 0 auto 14px; max-width: 340px; font-size: 12.5px; color: var(--text-slate-400); }

        /* ── Case view drawer (compact, read-only) ──────────────────── */
        .cv { display: flex; flex-direction: column; height: 100%; background: var(--bg-pure-white); }
        .cv__head {
          display: flex; align-items: center; gap: 9px;
          padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50); flex-shrink: 0;
        }
        .cv__id {
          font-size: 11px; font-weight: 700; letter-spacing: .06em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          padding: 3px 8px; border-radius: 6px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-600);
        }
        .cv__close {
          margin-left: auto; display: inline-flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 7px; font-size: 12px;
          color: var(--text-slate-400); background: none; border: none; cursor: pointer;
          transition: all .15s ease;
        }
        .cv__close:hover { color: var(--text-slate-900); background: var(--border-slate-100); }

        .cv__body { flex: 1; overflow-y: auto; padding: 18px 20px; }
        .cv__titlerow { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 14px; }
        .cv__titleicon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 28px; height: 28px; border-radius: 8px; font-size: 13px; margin-top: 1px;
          background: rgba(59,130,246,.1); color: #2563eb; border: 1px solid rgba(59,130,246,.18);
        }
        .cv__title {
          margin: 0; font-size: 15.5px; font-weight: 700; line-height: 1.4;
          color: var(--text-slate-900); letter-spacing: -.01em;
        }
        .cv__facts {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
          background: var(--border-slate-100); border: 1px solid var(--border-slate-100);
          border-radius: 10px; overflow: hidden; margin-bottom: 20px;
        }
        @media (max-width: 620px) { .cv__facts { grid-template-columns: repeat(2, 1fr); } }
        .cv__fact {
          display: flex; flex-direction: column; gap: 4px;
          padding: 9px 11px; background: var(--bg-pure-white);
        }
        .cv__fact-key { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-400); }
        .cv__fact-val { font-size: 12.5px; font-weight: 600; color: var(--text-slate-700); }

        .cv__sec { margin-bottom: 20px; }
        .cv__sec-title {
          display: flex; align-items: center; gap: 8px; margin: 0 0 9px;
          font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--text-slate-500);
        }
        .cv__sec-icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 20px; height: 20px; border-radius: 6px; font-size: 11px;
          background: var(--bg-slate-50); color: var(--text-slate-400);
          border: 1px solid var(--border-slate-100);
        }
        .cv__sec-icon--ok { background: rgba(16,185,129,.1); color: #059669; border-color: rgba(16,185,129,.2); }
        /* Dotted rule fills the rest of the heading line */
        .cv__rule { flex: 1; min-width: 16px; border-top: 1px dashed var(--border-slate-200); }
        .cv__count {
          min-width: 18px; padding: 0 6px; border-radius: 999px; letter-spacing: 0;
          font-size: 10px; font-weight: 700; text-align: center;
          background: var(--bg-slate-50); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-100);
        }
        .cv__text { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-slate-700); white-space: pre-wrap; }
        .cv__empty { margin: 0; font-size: 12.5px; color: var(--text-slate-400); font-style: italic; }
        .cv__steps { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
        .cv__steps li {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 8px 10px; border-radius: 8px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
          font-size: 12.5px; line-height: 1.5; color: var(--text-slate-700);
        }
        .cv__step-n {
          flex-shrink: 0; width: 18px; height: 18px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; margin-top: 1px;
          background: rgba(59,130,246,.12); color: #2563eb;
        }
        .cv__expected {
          margin: 0; padding: 10px 12px; border-radius: 8px;
          font-size: 12.5px; line-height: 1.55; white-space: pre-wrap;
          background: rgba(16,185,129,.07); border: 1px solid rgba(16,185,129,.22);
          color: #065f46;
        }
        .cv__foot {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
          padding: 12px 16px; border-top: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50);
        }
        .cv__foot .ant-btn { height: 32px; border-radius: 8px; font-size: 12.5px; }

        /* ── Create with Zai panel (drawer) ─────────────────────────── */
        .zai-draft {
          margin-bottom: 18px; padding: 12px 14px; border-radius: 12px;
          border: 1px solid rgba(59,130,246,.28); background: rgba(59,130,246,.05);
        }
        .zai-draft__head { display: flex; align-items: flex-start; gap: 10px; }
        .zai-draft__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 26px; height: 26px; border-radius: 8px;
          background: rgba(59,130,246,.14); color: #2563eb;
        }
        .zai-draft__title { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); }
        .zai-draft__sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 1px; line-height: 1.4; }
        .zai-draft__toggle {
          margin-left: auto; flex-shrink: 0; font-size: 11.5px; font-weight: 600; color: #2563eb;
          background: none; border: none; cursor: pointer; padding: 2px 4px;
        }
        .zai-draft__input {
          margin-top: 10px !important; border-radius: 8px !important;
          background: var(--bg-pure-white) !important; font-size: 12.5px;
        }
        .zai-draft__row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-top: 10px; flex-wrap: wrap;
        }
        .zai-draft__chips { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; min-width: 0; }
        .zai-draft__chip {
          font-size: 11px; padding: 3px 9px; border-radius: 999px; cursor: pointer;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500); transition: all .15s ease;
          max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .zai-draft__chip:hover { color: #2563eb; border-color: rgba(59,130,246,.4); }
        .zai-draft__reopen {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
          font-size: 11.5px; font-weight: 600; color: #2563eb;
          background: none; border: none; cursor: pointer; padding: 0;
        }

        /* ── Advanced: API payloads (drawer + case view) ─────────────── */
        .pl-adv {
          border: 1px solid var(--border-color); border-radius: 0;
          margin-bottom: 16px; overflow: hidden; background: transparent;
        }
        .pl-adv__head {
          display: flex; align-items: flex-start; gap: 12px; width: 100%;
          padding: 14px 18px; text-align: left; cursor: pointer;
          background: var(--bg-slate-50); border: none; border-bottom: 1px solid transparent;
        }
        .pl-adv__head:hover { background: var(--bg-slate-100, #f1f5f9); }
        .pl-adv__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(59,130,246,.12); color: #2563eb;
        }
        .pl-adv__headtext { display: flex; flex-direction: column; min-width: 0; flex: 1; }
        .pl-adv__title { font-size: 12.5px; font-weight: 700; color: var(--text-slate-900); }
        .pl-adv__sub { font-size: 11.5px; color: var(--text-slate-500); margin-top: 2px; line-height: 1.45; }
        .pl-adv__count {
          flex-shrink: 0; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; background: rgba(16,185,129,.12); color: #047857;
        }
        .pl-adv__chev { flex-shrink: 0; color: var(--text-slate-400); display: inline-flex; }
        .pl-adv__body { padding: 16px 18px 18px; border-top: 1px solid var(--border-color); }

        .pl-method, .pl-row__method {
          display: inline-flex; align-items: center; padding: 1px 6px; border-radius: 4px;
          border: 1px solid transparent; font-size: 10px; font-weight: 700; letter-spacing: .03em;
        }
        .pl-row__method { background: var(--bg-slate-100, #f1f5f9); color: var(--text-slate-500); }

        .pl-types { display: flex; flex-wrap: wrap; gap: 8px; }
        .pl-type {
          padding: 6px 14px; border-radius: 999px; cursor: pointer; font-size: 12px; font-weight: 600;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-500); transition: all .15s ease;
        }
        .pl-type:hover { border-color: var(--border-slate-300, #cbd5e1); color: var(--text-slate-800); }
        .pl-type.is-on { font-weight: 700; }
        .pl-typehelp {
          margin: 8px 0 0; font-size: 11.5px; line-height: 1.5; color: var(--text-slate-500);
        }

        .pl-genrow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .pl-genrow__note { font-size: 11.5px; color: var(--text-slate-400); }

        .pl-draft {
          margin-top: 16px; padding: 14px; border-radius: 10px;
          border: 1px solid rgba(59,130,246,.28); background: rgba(59,130,246,.04);
        }
        .pl-draft__head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
        .pl-draft__api {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11.5px; color: var(--text-slate-500);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;
        }
        .pl-draft__src { margin-left: auto; font-size: 11px; color: var(--text-slate-400); }
        .pl-draft__notes {
          margin: 0 0 12px; font-size: 11.5px; line-height: 1.5; color: var(--text-slate-500);
        }
        .pl-draft__foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .pl-draft__status { font-size: 11.5px; color: var(--text-slate-500); }
        .pl-json {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace !important;
          font-size: 12px !important; line-height: 1.55 !important; border-radius: 8px !important;
          background: var(--bg-pure-white) !important;
        }

        .pl-tag {
          display: inline-flex; align-items: center; flex-shrink: 0;
          padding: 1px 9px; border-radius: 999px; border: 1px solid transparent;
          font-size: 10.5px; font-weight: 700; letter-spacing: .02em;
        }

        .pl-saved { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
        .pl-saved--view { margin-top: 0; }
        .pl-saved__title {
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
          font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
          color: var(--text-slate-500);
        }
        .pl-saved__count {
          min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 10.5px; font-weight: 700; background: rgba(59,130,246,.12); color: #2563eb;
        }
        .pl-saved__hint { text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--text-slate-400); }

        .pl-row {
          border: 1px solid var(--border-slate-200); border-radius: 8px;
          padding: 10px 12px; background: var(--bg-pure-white);
        }
        .pl-row__head { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .pl-row__toggle {
          display: inline-flex; flex-shrink: 0; padding: 0; border: none; cursor: pointer;
          background: none; color: var(--text-slate-400);
        }
        .pl-row__name {
          flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-800);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pl-row__status {
          flex-shrink: 0; font-size: 10.5px; font-weight: 700; padding: 1px 7px; border-radius: 999px;
          background: var(--bg-slate-100, #f1f5f9); color: var(--text-slate-500);
        }
        .pl-row__act {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 24px; height: 24px; border-radius: 6px; cursor: pointer;
          border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
          color: var(--text-slate-500); transition: all .15s ease;
        }
        .pl-row__act:hover { color: #2563eb; border-color: rgba(59,130,246,.4); }
        .pl-row__act--danger:hover { color: #ef4444; border-color: rgba(239,68,68,.4); background: #fef2f2; }
        .pl-row__api { display: flex; align-items: center; gap: 6px; margin-top: 6px; padding-left: 22px; min-width: 0; }
        .pl-row__url {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px; color: var(--text-slate-400);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pl-row__notes {
          margin: 8px 0 0; padding-left: 22px; font-size: 11.5px; line-height: 1.5;
          color: var(--text-slate-500);
        }
        .pl-row__json {
          margin: 8px 0 0; padding: 10px 12px; border-radius: 8px; overflow-x: auto;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11.5px; line-height: 1.55; color: var(--text-slate-800);
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200);
        }

        .pl-empty { padding: 18px 16px; text-align: center; color: var(--text-slate-400); }
        .pl-empty__title { margin: 8px 0 2px; font-size: 12.5px; font-weight: 700; color: var(--text-slate-800); }
        .pl-empty__text { margin: 0; font-size: 11.5px; line-height: 1.5; color: var(--text-slate-500); }
        .pl-empty__btn {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 10px;
          padding: 4px 12px; border-radius: 6px; cursor: pointer;
          font-size: 11.5px; font-weight: 600; color: #2563eb;
          background: var(--bg-pure-white); border: 1px solid rgba(59,130,246,.35);
        }

        /* ── Pager pinned to the bottom ─────────────────────────────── */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; gap: 10px;
          padding: 0 20px; border-top: 1px solid var(--border-slate-200);
          height: 52px; min-height: 52px; box-sizing: border-box; flex-shrink: 0;
          background: var(--bg-pure-white); box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer;
          font-size: 12.5px; font-weight: 600;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        .ts-table .ant-table-thead > tr > th {
          background: transparent !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 11px !important; font-weight: 700 !important;
          text-transform: uppercase !important; color: var(--text-slate-500) !important;
          white-space: nowrap !important;
          padding: 12px 16px !important;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid var(--border-slate-100) !important;
          padding: 12px 16px !important;
        }
        .ts-table, .ts-table .ant-table, .ts-table .ant-table-container {
          background: transparent !important;
          border-radius: 0px !important;
        }
        .ts-table .ant-table-tbody > tr:hover > td {
          background: rgba(59, 130, 246, 0.04) !important;
        }

        .form-label { display: block; font-weight: 600; font-size: 13px; color: var(--text-slate-800); margin-bottom: 6px; }

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
        ${formStyles}

        .dh-mobile-menu-btn { display: none !important; }

        @media (max-width: 820px) {
          .dh-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
          .dh-main { height: auto; overflow: visible; width: 100%; }
          .dh-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; margin-right: 8px; color: var(--text-slate-600); }
          .dh-mobile-menu-btn:hover { background: var(--bg-slate-100); }

          .dh-sidebar-backdrop {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
            display: block !important;
          }
          .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }

          .dh-sidebar {
            position: fixed; top: 0; left: -320px; bottom: 0;
            z-index: 1100; height: 100%; max-height: none;
            border-right: 1px solid var(--border-slate-200); border-bottom: 0;
            display: flex; flex-direction: column; align-items: stretch;
            background: var(--bg-pure-white); width: 280px; box-sizing: border-box;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.08);
          }
          .dh-sidebar.is-mobile-open { left: 0; }

          /* Stats grid → 2 columns on mobile */
          .dh-main-scroll { padding: 12px 14px !important; }
          .grid.grid-cols-2.lg\:grid-cols-4 { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }

          /* Filter bar: full-width search, other filters wrap */
          .sc-filters { gap: 6px; }
          .sc-filters__search { width: 100% !important; min-width: 0; }
          .sc-filters__field { min-width: 130px; flex: 1 1 130px; }

          /* Table: horizontal scroll */
          .sc-tablewrap { overflow-x: auto !important; }
          .sc-table .ant-table { min-width: 640px; }

          /* Topbar: compress controls */
          .sc-topbar { padding: 8px 14px !important; }

          /* Footer: wrap on small screens */
          .pp-footer { flex-wrap: wrap; height: auto; min-height: 44px; padding: 8px 14px; gap: 6px; }
        }

        @media (max-width: 480px) {
          .grid.grid-cols-2.lg\:grid-cols-4 { grid-template-columns: 1fr !important; }
          .sc-topbar__sub, .sc-topbar__div { display: none !important; }
          .pp-footer-info { font-size: 11px; }
        }
        `}} />

      <style dangerouslySetInnerHTML={{ __html: CASE_DETAIL_SHELL_STYLES }} />

      <div className="tl-shell-wrap">
        <div className="tl-shell">
          <div className="tl-main">

            {/* ── Header row — back, breadcrumb, search, filters, controls ── */}
            <div className="saas-header-container sc-header">
              <Tooltip title="Back to Cases">
                <Button
                  type="text"
                  size="small"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/qa-workspace/test-cases")}
                  className="cd-back"
                  aria-label="Back to Cases"
                />
              </Tooltip>

              <Divider type="vertical" style={{ height: 24, margin: 0, opacity: 0.5 }} />

              {/* The scenario's place in the tree sits where the list pages put
                  their project switcher. */}
              <div className="cd-crumbs">
                <button type="button" className="cd-crumb" onClick={() => router.push("/qa-workspace/test-cases")}>Cases</button>
                {parentData?.module_name && (
                  <>
                    <span className="cd-sep">›</span>
                    <span className="cd-crumb cd-crumb--strong">{parentData.module_name}</span>
                  </>
                )}
                <span className="cd-sep">›</span>
                <span className="cd-title" title={parentData?.title}>{parentData?.title || "Loading scenario…"}</span>
              </div>

              <div className="sc-header-controls">
                <Input
                  placeholder="Quick search cases, steps, results..."
                  prefix={<SearchOutlined style={{ color: 'var(--text-slate-400)', fontSize: 12 }} />}
                  className="saas-input"
                  style={{ maxWidth: 240, borderRadius: 8, height: 30, background: 'transparent', fontSize: 12 }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  allowClear
                />

                <Space.Compact className="ticket-filter-group">
                  <Popover
                    content={
                      <ModuleCaseFilters
                        filters={{ typeFilter, priorityFilter, statusFilter }}
                        onFilterChange={(key, val) => {
                          if (key === 'typeFilter') setTypeFilter(val || undefined);
                          if (key === 'priorityFilter') setPriorityFilter(val || undefined);
                          if (key === 'statusFilter') setStatusFilter(val || undefined);
                        }}
                        onReset={clearFilters}
                        typeOptions={typeFilterOptions}
                        priorityOptions={priorityOptions}
                        statusOptions={statusFilterOptions}
                      />
                    }
                    trigger="click"
                    open={isFilterPanelOpen}
                    onOpenChange={setIsFilterPanelOpen}
                    placement="bottomLeft"
                    overlayClassName="tf-popover-overlay"
                    styles={{ body: { padding: 0 } }}
                  >
                    <Button
                      icon={<FilterOutlined />}
                      className={activeFilterCount > 0 ? 'saas-tag-blue' : ''}
                      style={{ height: 30, fontWeight: 600, fontSize: 12 }}
                    >
                      Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
                    </Button>
                  </Popover>
                  <Button
                    icon={<ExpandAltOutlined />}
                    style={{ height: 30 }}
                    aria-label="Expand filters"
                    onClick={() => setIsFilterRowOpen(prev => !prev)}
                  />
                </Space.Compact>
              </div>

              <Space size={10} className="sc-header-right">
                <Tooltip title={sortOrder === 'asc' ? 'Sort Descending' : 'Sort Ascending'}>
                  <Button
                    icon={sortOrder === 'asc' ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Toggle sort order"
                  />
                </Tooltip>

                <Tooltip title="Refresh view">
                  <Button
                    icon={<ReloadOutlined spin={loading} />}
                    onClick={fetchData}
                    disabled={loading}
                    style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  />
                </Tooltip>

                {canCreateCase && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreateDrawer}
                    style={{ height: 36, borderRadius: 8, fontWeight: 700 }}
                  >
                    Create Module Case
                  </Button>
                )}
              </Space>
            </div>

            {/* ── Inline filter row — the pill strip the Ticket List uses ── */}
            {isFilterRowOpen && (
              <div className="tl-filter-row">
                <div className="tl-filter-row-label">
                  <FilterOutlined style={{ fontSize: 11 }} />
                  <span>Filters</span>
                  <span className="tl-filter-row-count">{activeFilterCount > 0 ? activeFilterCount : '0'}</span>
                </div>
                <div className="tl-filter-row-pills">
                  <TicketFilterPill
                    icon={<AppstoreOutlined style={{ fontSize: 11 }} />}
                    label="Type"
                    value={typeFilter || ""}
                    options={typeFilterOptions}
                    onChange={(val) => setTypeFilter(val || undefined)}
                    itemNoun="types"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<ThunderboltOutlined style={{ fontSize: 11 }} />}
                    label="Priority"
                    value={priorityFilter || ""}
                    options={priorityOptions}
                    onChange={(val) => setPriorityFilter(val || undefined)}
                    itemNoun="levels"
                    multiple={false}
                  />
                  <TicketFilterPill
                    icon={<CheckCircleOutlined style={{ fontSize: 11 }} />}
                    label="Status"
                    value={statusFilter || ""}
                    options={statusFilterOptions}
                    onChange={(val) => setStatusFilter(val || undefined)}
                    itemNoun="statuses"
                    multiple={false}
                  />
                </div>
                <div className="tl-filter-row-actions">
                  {activeFilterCount > 0 && (
                    <button type="button" className="tl-filter-row-reset" onClick={clearFilters}>
                      <ReloadOutlined style={{ fontSize: 10 }} />
                      Reset
                    </button>
                  )}
                  <button
                    type="button"
                    className="tl-filter-row-close"
                    onClick={() => setIsFilterRowOpen(false)}
                    aria-label="Close filters"
                    title="Close filters"
                  >
                    <CloseOutlined style={{ fontSize: 10 }} />
                  </button>
                </div>
              </div>
            )}

            <div className="tl-section">
              {/* ── Scenario banner — the Ticket List's sprint head, carrying
                   the facts the left rail used to hold. ─────────────────── */}
              <div className="tl-section-head tl-sprint-head-v2 tl-section-head--static">
                <div className="tl-sprint-row1">
                  <div className="tl-sprint-title-block">
                    <span
                      className="tl-sprint-dot"
                      style={{ background: bannerAccent, boxShadow: `0 0 0 3px ${bannerAccent}33` }}
                    />
                    <Typography.Text
                      className="tl-sprint-title"
                      ellipsis={{ tooltip: parentData?.title || 'Loading scenario…' }}
                    >
                      {parentData?.title || 'Loading scenario…'}
                    </Typography.Text>
                    <span className="tl-sprint-tags">
                      {parentData?.status && (
                        <span className={`tl-sprint-tag tl-sprint-tag--${statusTone(parentData.status)}`}>
                          {parentData.status}
                        </span>
                      )}
                      <span className={`tl-sprint-tag tl-sprint-tag--${parentData?.automation === 'Automated' ? 'blue' : 'ash'}`}>
                        {parentData?.automation || 'Manual'}
                      </span>
                      <span className="tl-sprint-tag tl-sprint-tag--ash">{childCases.length} CASES</span>
                    </span>
                  </div>
                  <div className="tl-sprint-actions">
                    <Button
                      type="default"
                      size="small"
                      icon={<Layers size={13} />}
                      onClick={() => router.push('/qa-workspace/test-suites')}
                      className="saas-button-item tl-sprint-burndown-btn"
                    >
                      Test Suites{Number(parentData?.suite_count) ? ` (${parentData.suite_count})` : ''}
                    </Button>
                  </div>
                </div>

                {/* Row 2: the scenario facts the sidebar used to list */}
                <div className="tl-sprint-row2">
                  <span className="tl-sprint-meta" title={parentData?.module_name}>
                    <Folder size={11} />
                    <span>Module</span>
                    <b>{parentData?.module_name || 'Unassigned'}</b>
                  </span>
                  <span className="tl-sprint-meta" title={parentData?.feature}>
                    <Target size={11} />
                    <span>Feature</span>
                    <b>{parentData?.feature || 'Not set'}</b>
                  </span>
                  <span className="tl-sprint-meta" title={parentData?.owner_name || parentData?.qa_owner}>
                    <User size={11} />
                    <span>Owner</span>
                    <b>{parentData?.owner_name || (parentData?.qa_owner && parentData.qa_owner !== '—' ? parentData.qa_owner : 'Unassigned')}</b>
                  </span>
                  <span className="tl-sprint-meta" title={parentData?.creator_name}>
                    <UserPlus size={11} />
                    <span>Created by</span>
                    <b>{parentData?.creator_name || 'Unknown'}</b>
                  </span>
                  <span className="tl-sprint-meta">
                    <CalendarDays size={11} />
                    <span>{fmtDate(parentData?.created_at) || '—'}</span>
                  </span>
                  <span className="tl-sprint-meta">
                    <Zap size={11} />
                    <b>{highPriorityCount}</b> high / critical
                  </span>
                  <span className="tl-sprint-meta">
                    <Activity size={11} />
                    <b>{automatedCount}</b> automated
                  </span>
                </div>

                {/* Row 3: how much of the scenario is active, plus the split */}
                <div className="tl-sprint-row3">
                  <div className="tl-sprint-progress-bar">
                    <div className="tl-sprint-progress-fill" style={{ width: `${Math.min(100, activePct)}%` }} />
                  </div>
                  <span className="tl-sprint-progress-pct">{activePct}%</span>
                </div>
              </div>

              <div className="tl-section-body">
                {/* Only the results blur, so the filters above stay usable
                    while a search refetches. */}
                <ZukvoLoadingOverlay loading={loading} message="Loading module cases…">
                  <div className="pp-table-wrap">
                    <Table
                      className="saas-table tl-table pp-table"
                      dataSource={pagedCases}
                      columns={childColumns}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      scroll={{ x: 'max-content' }}
                      onRow={(record) => ({
                        className: 'pp-row',
                        onClick: (e) => {
                          const t = e.target as HTMLElement;
                          if (t.closest('button, a, .ant-dropdown-trigger, .sc-rowactions, .pp-case-id, .tc-suites')) return;
                          openCaseView(record);
                        },
                      })}
                      locale={{
                        /* Holding the height beats claiming "no cases" mid-fetch. */
                        emptyText: loading ? <div style={{ minHeight: 220 }} /> : renderEmpty()
                      }}
                    />
                  </div>
                </ZukvoLoadingOverlay>

                {/* Pager sits outside the scroll area so it stays pinned to the
                    bottom of the pane whether or not the list overflows. */}
                {filteredCases.length > 0 && (
                  <div className="pp-footer">
                    <div className="pp-footer-info">
                      Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{totalItems}</strong>
                    </div>
                    <div className="pp-pager">
                      <button type="button" className="pp-pager-btn" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
                      {Array.from({ length: pageCount }, (_, i) => i + 1)
                        .slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 5)
                        .map((p) => (
                          <button key={p} type="button" className={`pp-pager-num ${p === safePage ? 'is-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                        ))}
                      <button type="button" className="pp-pager-btn" disabled={safePage >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))}>›</button>
                      <Select
                        className="pp-pagesize"
                        value={pageSize}
                        onChange={(v) => { setPageSize(v); setPage(1); }}
                        options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
                        popupMatchSelectWidth={120}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Test Case Drawer */}
      <Drawer
        {...commonDrawerProps}
        open={drawerOpen}
        onClose={closeCaseDrawer}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-primary, #ffffff)" }}>
          {/* Drawer Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
                  background: "rgba(37, 99, 235, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  flexShrink: 0,
                  fontSize: 20,
                }}
              >
                <BugOutlined />
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
                  {editingCaseId ? "Edit Module Test Case" : "New Module Test Case"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary, var(--text-slate-500))", fontWeight: 500, marginTop: 2 }}>
                  {editingCaseId ? "Modify module test case details & steps" : "Add specific testing instructions, steps, and expected behaviors"}
                </div>
              </div>
            </div>
            <Button
              type="text"
              shape="circle"
              icon={<CloseOutlined />}
              onClick={closeCaseDrawer}
              style={{ color: "var(--text-slate-500)" }}
            />
          </div>

          {/* Drawer Body */}
          <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
            {/* Describe the case in plain language and let Zai draft it */}
            <div className="zai-draft">
              <div className="zai-draft__head">
                <span className="zai-draft__icon"><Sparkles size={14} /></span>
                <div className="min-w-0">
                  <div className="zai-draft__title">Create with Zai</div>
                  <div className="zai-draft__sub">Describe the case — Zai fills in the name, steps and expected result.</div>
                </div>
                {zaiOpen && (
                  <button type="button" className="zai-draft__toggle" onClick={() => setZaiOpen(false)}>Hide</button>
                )}
              </div>

              {zaiOpen ? (
                <>
                  <TextArea
                    rows={2}
                    placeholder="e.g. user able to type mail and password with validation"
                    value={zaiPrompt}
                    onChange={(e) => setZaiPrompt(e.target.value)}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) { e.preventDefault(); handleZaiGenerate(); }
                    }}
                    className="zai-draft__input"
                  />
                  <div className="zai-draft__row">
                    <div className="zai-draft__chips">
                      {[
                        'user able to type mail and password with validation',
                        'invalid credentials show an inline error',
                        'session expires after inactivity',
                      ].map(s => (
                        <button key={s} type="button" className="zai-draft__chip" onClick={() => setZaiPrompt(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="primary"
                      size="small"
                      loading={zaiGenerating}
                      disabled={!zaiPrompt.trim()}
                      icon={!zaiGenerating ? <Sparkles size={13} /> : undefined}
                      onClick={handleZaiGenerate}
                    >
                      {zaiGenerating ? 'Zai is drafting…' : 'Generate'}
                    </Button>
                  </div>
                </>
              ) : (
                <button type="button" className="zai-draft__reopen" onClick={() => setZaiOpen(true)}>
                  <Sparkles size={12} /> Draft another with Zai
                </button>
              )}
            </div>

            <Form layout="vertical" className="customer-drawer-form">
              {/* STEP 1: Basic Information */}
              <SectionCard
                step="STEP 1"
                icon={<InfoCircleOutlined />}
                title="Basic Information"
                subtitle="Test case name, module, priority, and severity"
              >

                <Form.Item label="Module" style={{ marginTop: -10, marginBottom: 16 }}>
                  <Input
                    value={parentData?.module_name || "Unassigned"}
                    disabled
                    readOnly
                    size="large"
                    style={{ borderRadius: 6, cursor: "not-allowed", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 600 }}
                  />
                </Form.Item>

                <Form.Item label="Test Case Name" required style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="e.g., Verify successful login with valid credentials"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    size="large"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Priority" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={priorityOptions}
                        value={formData.priority}
                        onChange={(val: any) => setFormData({ ...formData, priority: val })}
                        placeholder="Select Priority"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item label="Severity" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={severityOptions}
                        value={formData.severity}
                        onChange={(val: any) => setFormData({ ...formData, severity: val })}
                        placeholder="Select Severity"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={8}>
                    <Form.Item label="Status" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Draft", label: "Draft" },
                          { value: "Active", label: "Active" },
                          { value: "Deprecated", label: "Deprecated" },
                        ]}
                        value={formData.status}
                        onChange={(val: any) => setFormData({ ...formData, status: val })}
                        placeholder="Select Status"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item label="Test Type" style={{ marginBottom: 0 }}>
                      <SearchableDropdown
                        options={testTypeOptions}
                        value={formData.test_type || undefined}
                        onChange={(val: any) => setFormData({ ...formData, test_type: val })}
                        placeholder="Select Test Type"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Automation" style={{ marginBottom: 0 }}>
                      <SearchableDropdown
                        options={[
                          { value: "Manual", label: "Manual" },
                          { value: "Automated", label: "Automated" },
                        ]}
                        value={formData.automation}
                        onChange={(val: any) => setFormData({ ...formData, automation: val })}
                        placeholder="Select Automation"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </SectionCard>

              {/* STEP 2: Execution & Steps */}
              <SectionCard
                step="STEP 2"
                icon={<SnippetsOutlined />}
                title="Execution & Steps"
                subtitle="Preconditions, steps to reproduce, and expected results"
              >
                <Form.Item label="Preconditions" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={2}
                    placeholder="State any setup required before testing (e.g., User must be logged out, Test user created with Admin role)..."
                    value={formData.preconditions}
                    onChange={(e) => setFormData({ ...formData, preconditions: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Form.Item label="Steps to Reproduce" style={{ marginBottom: 16 }}>
                  <div style={{ border: '1px solid var(--border-slate-300, #cbd5e1)', borderRadius: 8, padding: '12px 14px', background: 'var(--bg-pure-white, #ffffff)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(formData.steps_to_reproduce || []).map((step: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {idx + 1}
                          </div>
                          <span style={{ fontSize: 13, color: 'var(--text-slate-800)', flex: 1, wordBreak: 'break-word' }}>{step}</span>
                          <Button
                            type="text"
                            size="small"
                            danger
                            style={{ padding: '0 6px', fontSize: 15, lineHeight: 1, opacity: 0.8 }}
                            onClick={() => {
                              const updated = [...(formData.steps_to_reproduce || [])];
                              updated.splice(idx, 1);
                              setFormData({ ...formData, steps_to_reproduce: updated });
                            }}
                          >×</Button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: (formData.steps_to_reproduce || []).length > 0 ? 4 : 0, paddingTop: (formData.steps_to_reproduce || []).length > 0 ? 8 : 0, borderTop: (formData.steps_to_reproduce || []).length > 0 ? '1px dashed var(--border-slate-300, #cbd5e1)' : 'none' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                          +
                        </div>
                        <Input
                          placeholder="Type a step to reproduce and press Enter..."
                          value={newStepInput}
                          onChange={(e) => setNewStepInput(e.target.value)}
                          onPressEnter={(e) => {
                            e.preventDefault();
                            if (newStepInput.trim()) {
                              setFormData({ ...formData, steps_to_reproduce: [...(formData.steps_to_reproduce || []), newStepInput.trim()] });
                              setNewStepInput('');
                            }
                          }}
                          style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 0', fontSize: 13 }}
                          variant="borderless"
                        />
                        <Button
                          type="primary"
                          size="small"
                          style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#3b82f6' }}
                          onClick={() => {
                            if (newStepInput.trim()) {
                              setFormData({ ...formData, steps_to_reproduce: [...(formData.steps_to_reproduce || []), newStepInput.trim()] });
                              setNewStepInput('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                </Form.Item>

                <Form.Item label="Expected Result" style={{ marginBottom: 16 }}>
                  <TextArea
                    rows={3}
                    placeholder="Describe clearly what should happen when steps are executed (e.g., User is redirected to dashboard with success message)..."
                    value={formData.expected_result}
                    onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Form.Item label="Additional Description / Notes" style={{ marginBottom: 0 }}>
                  <TextArea
                    rows={2}
                    placeholder="Optional background info, tickets, or references..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </SectionCard>

              {/* STEP 3: Advanced — API request payloads
                  Optional, and collapsed by default: a manual UI case has no
                  endpoint behind it and should not be asked about one. */}
              <div className="pl-adv">
                <button
                  type="button"
                  className="pl-adv__head"
                  onClick={() => {
                    const next = !advancedOpen;
                    setAdvancedOpen(next);
                    if (next && !apisLoaded) loadModuleApis();
                  }}
                >
                  <span className="pl-adv__icon"><Braces size={14} /></span>
                  <span className="pl-adv__headtext">
                    <span className="pl-adv__title">Advanced · API payloads</span>
                    <span className="pl-adv__sub">
                      Pick an endpoint from {parentData?.module_name && parentData.module_name !== "Unassigned"
                        ? `the ${parentData.module_name} module`
                        : "this project"}, generate the request body to test with, and keep it on this case.
                    </span>
                  </span>
                  {casePayloads.length > 0 && (
                    <span className="pl-adv__count">{casePayloads.length}</span>
                  )}
                  <span className="pl-adv__chev">
                    {advancedOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                </button>

                {advancedOpen && (
                  <div className="pl-adv__body">
                    <Form.Item label="API" style={{ marginBottom: 14 }}>
                      <SearchableDropdown
                        options={moduleApis.map((a) => ({
                          value: a.id,
                          label: a.name,
                          description: a.url,
                          badge: (
                            <span
                              className="pl-method"
                              style={{
                                color: METHOD_COLORS[a.method as HttpMethod]?.text,
                                background: METHOD_COLORS[a.method as HttpMethod]?.bg,
                                borderColor: METHOD_COLORS[a.method as HttpMethod]?.border,
                              }}
                            >
                              {a.method}
                            </span>
                          ),
                        }))}
                        value={payloadApiId}
                        onChange={(val: any) => {
                          setPayloadApiId(val || undefined);
                          // A body drafted for another endpoint means nothing here.
                          resetPayloadDraft();
                        }}
                        placeholder={apisLoading ? "Loading APIs…" : moduleApis.length ? "Select an API" : "No APIs available"}
                        searchPlaceholder="Search endpoints…"
                        itemNoun="APIs"
                        loading={apisLoading}
                        hideAvatar
                        width="100%"
                        style={{ width: "100%", height: 40, padding: "6px 12px", borderRadius: 8 }}
                        emptyComponent={
                          <div className="pl-empty">
                            <Plug size={18} />
                            <p className="pl-empty__title">No APIs for this module yet</p>
                            <p className="pl-empty__text">
                              Publish an endpoint in API Hub under{" "}
                              <strong>{parentData?.module_name || "this module"}</strong>, then reopen this drawer.
                            </p>
                            <button type="button" className="pl-empty__btn" onClick={loadModuleApis}>
                              <RotateCw size={12} /> Refresh
                            </button>
                          </div>
                        }
                      />
                    </Form.Item>

                    <Form.Item label="Payload type" style={{ marginBottom: 14 }}>
                      <div className="pl-types">
                        {PAYLOAD_TYPES.map((t) => {
                          const tone = PAYLOAD_TYPE_TONE[t];
                          const on = payloadType === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              className={`pl-type${on ? " is-on" : ""}`}
                              style={on ? { color: tone.text, background: tone.bg, borderColor: tone.border } : undefined}
                              onClick={() => {
                                setPayloadType(t);
                                // The type IS the payload — keeping the old body
                                // under a new label would be a lie.
                                resetPayloadDraft();
                              }}
                            >
                              {t}
                            </button>
                          );
                        })}
                      </div>
                      <p className="pl-typehelp">{PAYLOAD_TYPE_HELP[payloadType]}</p>
                    </Form.Item>

                    <Form.Item label="Extra instruction (optional)" style={{ marginBottom: 14 }}>
                      <Input
                        placeholder="e.g. an order with no line items, or a user already registered"
                        value={payloadHint}
                        onChange={(e) => setPayloadHint(e.target.value)}
                        onPressEnter={(e) => { e.preventDefault(); handleGeneratePayload(); }}
                        style={{ borderRadius: 6 }}
                      />
                    </Form.Item>

                    <div className="pl-genrow">
                      <Button
                        type="primary"
                        loading={drafting}
                        disabled={!payloadApiId}
                        icon={!drafting ? <Sparkles size={13} /> : undefined}
                        onClick={handleGeneratePayload}
                        style={{ borderRadius: 8, fontWeight: 600, background: "#2563eb", borderColor: "#2563eb" }}
                      >
                        {drafting ? "Generating…" : draft ? `Regenerate ${payloadType.toLowerCase()} payload` : `Generate ${payloadType.toLowerCase()} payload`}
                      </Button>
                      <span className="pl-genrow__note">Nothing is saved until you confirm it.</span>
                    </div>

                    {draft && (
                      <div className="pl-draft">
                        <div className="pl-draft__head">
                          <span
                            className="pl-tag"
                            style={{
                              color: PAYLOAD_TYPE_TONE[payloadType].text,
                              background: PAYLOAD_TYPE_TONE[payloadType].bg,
                              borderColor: PAYLOAD_TYPE_TONE[payloadType].border,
                            }}
                          >
                            {payloadType}
                          </span>
                          <span className="pl-draft__api">{draft.apiMethod} {draft.apiUrl}</span>
                          <span className="pl-draft__src">
                            {draft.generatedBy === "ai" ? "drafted by Zai" : "drafted from the API structure"}
                          </span>
                        </div>

                        {draft.notes && <p className="pl-draft__notes">{draft.notes}</p>}

                        <Form.Item label="Payload name" style={{ marginBottom: 10 }}>
                          <Input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="What a tester will see in the list"
                            style={{ borderRadius: 6 }}
                          />
                        </Form.Item>

                        <Form.Item label="Request payload (JSON)" style={{ marginBottom: 10 }}>
                          <TextArea
                            rows={12}
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            className="pl-json"
                            spellCheck={false}
                          />
                        </Form.Item>

                        <div className="pl-draft__foot">
                          {draft.expectedStatus && (
                            <span className="pl-draft__status">Expects <strong>{draft.expectedStatus}</strong></span>
                          )}
                          <div style={{ flex: 1 }} />
                          <Button
                            size="small"
                            onClick={resetPayloadDraft}
                            style={{ borderRadius: 6, fontWeight: 600 }}
                          >
                            Discard
                          </Button>
                          <Button
                            type="primary"
                            size="small"
                            loading={confirming}
                            icon={!confirming ? <CheckCircleOutlined /> : undefined}
                            onClick={handleConfirmPayload}
                            style={{ borderRadius: 6, fontWeight: 600, background: "#10b981", borderColor: "#10b981" }}
                          >
                            Confirm &amp; save payload
                          </Button>
                        </div>
                      </div>
                    )}

                    {casePayloads.length > 0 && (
                      <div className="pl-saved">
                        <div className="pl-saved__title">
                          Saved payloads
                          <span className="pl-saved__count">{casePayloads.length}</span>
                          {!editingCaseId && (
                            <span className="pl-saved__hint">attached when you save this case</span>
                          )}
                        </div>
                        {casePayloads.map((pl) => (
                          <PayloadRow key={pl.id} payload={pl} onDelete={() => handleDeletePayload(pl.id)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Form>
          </div>

          {/* Drawer Footer */}
          <div
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
              {editingCaseId ? "Changes take effect immediately" : "Fill required fields to save test case"}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <Button onClick={closeCaseDrawer} style={{ borderRadius: 8, fontWeight: 600, padding: "0 18px", height: 36 }}>
                Cancel
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveChildCase(false)}
                loading={submitting && !editingCaseId}
                style={{ borderRadius: 8, fontWeight: 600, padding: "0 20px", height: 36, background: "#2563eb", borderColor: "#2563eb" }}
              >
                Save & Close
              </Button>
              {!editingCaseId && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleSaveChildCase(true)}
                  loading={submitting}
                  style={{ borderRadius: 8, fontWeight: 600, padding: "0 20px", height: 36, background: "#10b981", borderColor: "#10b981" }}
                >
                  Save & Add Another
                </Button>
              )}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Read-only case view — compact, opens on row click */}
      <Drawer
        {...commonDrawerProps}
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        width={640}
      >
        {viewCase && (
          <div className="cv">
            <div className="cv__head">
              <span className="cv__id">{viewCase.test_case_id || 'CASE'}</span>
              <span className={`sc-pill sc-pill--${statusTone(viewCase.status || 'Active')}`}>
                <span className="sc-pill__dot" />{viewCase.status || 'Active'}
              </span>
              <button className="cv__close" onClick={() => setViewOpen(false)} aria-label="Close">
                <CloseOutlined />
              </button>
            </div>

            <div className="cv__body">
              <div className="cv__titlerow">
                <span className="cv__titleicon"><FileTextOutlined /></span>
                <h2 className="cv__title">{viewCase.name || 'Untitled case'}</h2>
              </div>

              <div className="cv__facts">
                <div className="cv__fact">
                  <span className="cv__fact-key">Priority</span>
                  <PriorityMeter priority={viewCase.priority || 'Medium'} />
                </div>
                <div className="cv__fact">
                  <span className="cv__fact-key">Severity</span>
                  <span className="cv__fact-val">{viewCase.severity || 'Major'}</span>
                </div>
                <div className="cv__fact">
                  <span className="cv__fact-key">Type</span>
                  <span className="cv__fact-val">{viewCase.test_type || 'Functional'}</span>
                </div>
                <div className="cv__fact">
                  <span className="cv__fact-key">Automation</span>
                  <span className="cv__fact-val">{viewCase.automation || 'Manual'}</span>
                </div>
              </div>

              {viewCase.description && (
                <section className="cv__sec">
                  <h3 className="cv__sec-title">
                    <span className="cv__sec-icon"><InfoCircleOutlined /></span>
                    <span>Description</span>
                    <span className="cv__rule" />
                  </h3>
                  <p className="cv__text">{viewCase.description}</p>
                </section>
              )}

              {viewCase.preconditions && (
                <section className="cv__sec">
                  <h3 className="cv__sec-title">
                    <span className="cv__sec-icon"><ShieldCheck size={12} /></span>
                    <span>Preconditions</span>
                    <span className="cv__rule" />
                  </h3>
                  <p className="cv__text">{viewCase.preconditions}</p>
                </section>
              )}

              <section className="cv__sec">
                <h3 className="cv__sec-title">
                  <span className="cv__sec-icon"><Activity size={12} /></span>
                  <span>Steps to Reproduce</span>
                  {parseSteps(viewCase.steps_to_reproduce).length > 0 && (
                    <span className="cv__count">{parseSteps(viewCase.steps_to_reproduce).length}</span>
                  )}
                  <span className="cv__rule" />
                </h3>
                {parseSteps(viewCase.steps_to_reproduce).length === 0 ? (
                  <p className="cv__empty">No steps recorded.</p>
                ) : (
                  <ol className="cv__steps">
                    {parseSteps(viewCase.steps_to_reproduce).map((s, i) => (
                      <li key={i}><span className="cv__step-n">{i + 1}</span><span>{s}</span></li>
                    ))}
                  </ol>
                )}
              </section>

              <section className="cv__sec">
                <h3 className="cv__sec-title">
                  <span className="cv__sec-icon cv__sec-icon--ok"><CheckCircleOutlined /></span>
                  <span>Expected Result</span>
                  <span className="cv__rule" />
                </h3>
                {viewCase.expected_result
                  ? <p className="cv__expected">{viewCase.expected_result}</p>
                  : <p className="cv__empty">Not recorded.</p>}
              </section>

              {/* What a tester actually runs this case with — the bodies are
                  here so the page they visit IS the page they copy from. */}
              <section className="cv__sec">
                <h3 className="cv__sec-title">
                  <span className="cv__sec-icon"><Braces size={12} /></span>
                  <span>API Payloads</span>
                  {viewPayloads.length > 0 && <span className="cv__count">{viewPayloads.length}</span>}
                  <span className="cv__rule" />
                </h3>
                {viewPayloadsLoading ? (
                  <p className="cv__empty">Loading payloads…</p>
                ) : viewPayloads.length === 0 ? (
                  <p className="cv__empty">No API payloads saved on this case.</p>
                ) : (
                  <div className="pl-saved pl-saved--view">
                    {viewPayloads.map((pl) => (
                      <PayloadRow key={pl.id} payload={pl} />
                    ))}
                  </div>
                )}
              </section>

              <section className="cv__sec">
                <h3 className="cv__sec-title">
                  <span className="cv__sec-icon"><Layers size={12} /></span>
                  <span>Linked Suites</span>
                  <span className="cv__rule" />
                </h3>
                {(viewCase.test_suites?.length || viewCase.suite_count || 0) === 0 ? (
                  <p className="cv__empty">Not linked to any suite.</p>
                ) : (
                  <button
                    type="button"
                    className="tc-suites"
                    onClick={() => { setSelectedCaseForSuites(viewCase); setSuitesDrawerOpen(true); }}
                  >
                    <LinkOutlined />
                    <span>{viewCase.test_suites?.length || viewCase.suite_count} linked</span>
                  </button>
                )}
              </section>
            </div>

            <div className="cv__foot">
              <ConfirmDialog
                tone="danger"
                title="Delete Module Test Case?"
                description={`Are you sure you want to delete "${viewCase.name}" (${viewCase.test_case_id})?`}
                confirmText="Delete"
                onConfirm={async () => { await handleDeleteChild(viewCase.id); setViewOpen(false); }}
              >
                <Button danger icon={<Trash2 size={14} />}>Delete</Button>
              </ConfirmDialog>
              <div style={{ flex: 1 }} />
              <Button onClick={() => setViewOpen(false)}>Close</Button>
              <Button
                type="primary"
                icon={<Pencil size={14} />}
                onClick={() => { setViewOpen(false); handleOpenEditDrawer(viewCase); }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Linked Suites Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Layers size={20} color="#3b82f6" />
            <span style={{ fontWeight: 600, color: 'var(--text-slate-900)' }}>Associated Test Suites</span>
          </div>
        }
        open={suitesDrawerOpen}
        onClose={() => {
          setSuitesDrawerOpen(false);
          setSelectedCaseForSuites(null);
        }}
        width={500}
        styles={{
          header: { borderBottom: '1px solid var(--border-slate-200)', padding: '16px 24px' },
          body: { padding: '20px 24px', background: 'var(--bg-pure-white)' }
        }}
      >
        {selectedCaseForSuites && (
          <div>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 16, fontSize: 14 }}>
              Test Case <strong style={{ color: 'var(--text-slate-900)' }}>{selectedCaseForSuites.name}</strong> is linked to the following test suites:
            </Typography.Paragraph>

            {(!selectedCaseForSuites.test_suites || selectedCaseForSuites.test_suites.length === 0) ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-slate-400)', border: '1px dashed var(--border-slate-200)', borderRadius: 8 }}>
                No test suites are currently linked to this test case.
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

/* ────────────────────────────────────────────────────────────────────────────
   Styles — the Ticket List's shell, header, banner, table and pager. The
   drawer, case-view and payload rules stay in the block above.
   ──────────────────────────────────────────────────────────────────────── */
const CASE_DETAIL_SHELL_STYLES = `
/* ── Shell: one column, no rail ───────────────────────────────────────── */
.tl-shell-wrap {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  overflow: hidden;
}
.tl-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  height: 100%;
  overflow: hidden;
}
.tl-main {
  min-width: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  overflow: hidden;
}

/* ── Header row ───────────────────────────────────────────────────────── */
.sc-header {
  position: sticky;
  top: 0;
  z-index: 100;
  margin: 0;
  padding: 9.7px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  background: var(--bg-pure-white);
  border-bottom: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
.sc-header-controls { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.sc-header-right { flex-shrink: 0; }

.sc-owner-seg .ant-segmented-item-label { padding: 0 4px; }
.sc-owner-opt { display: inline-flex; align-items: center; gap: 6px; height: 100%; }
.sc-owner-opt__label { font-size: 12px; font-weight: 600; white-space: nowrap; }
.sc-owner-opt__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 17px; padding: 0 5px;
  border-radius: 999px; background: var(--bg-slate-100); color: var(--text-slate-500);
  font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
}
.ant-segmented-item-selected .sc-owner-opt__count { background: var(--bg-blue-50); color: #3B82F6; }
[data-theme='dark'] .sc-owner-opt__count { background: #1e293b; color: #94a3b8; }

/* ── Section + scope banner (Ticket List sprint head) ─────────────────── */
.tl-section {
  background: var(--bg-pure-white);
  border-top: 1px solid var(--border-slate-200);
  border-bottom: 1px solid var(--border-slate-200);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
[data-theme='dark'] .tl-section {
  background: transparent;
  border-top-color: #1f2937;
  border-bottom-color: #1f2937;
}
.tl-section-head {
  padding: 6px 12px;
  background: var(--bg-slate-50);
  border-bottom: 1px solid var(--border-slate-200);
  position: relative;
  flex-shrink: 0;
}
[data-theme='dark'] .tl-section-head {
  background: #0f1419;
  border-bottom-color: #1f2937;
}
.tl-section-body {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
/* The loading overlay is a plain wrapper — it has to grow like the table would. */
.tl-section-body > .zlo,
.tl-section-body > .zlo > .zlo__content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.tl-sprint-head-v2 { display: flex !important; flex-direction: column; gap: 6px; padding: 10px 12px !important; }
.tl-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.tl-sprint-title-block { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 auto; }
.tl-sprint-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.tl-sprint-title {
  font-size: 14px !important; font-weight: 800 !important; color: var(--text-slate-900) !important;
  letter-spacing: -0.01em; max-width: 460px;
}
[data-theme='dark'] .tl-sprint-title { color: #f1f5f9 !important; }
.tl-sprint-tags { display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0; }
.tl-sprint-tag {
  display: inline-flex; align-items: center; height: 18px; padding: 0 6px;
  font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px;
  border: 1px solid transparent; text-transform: uppercase; line-height: 1;
}
.tl-sprint-tag-active { background: transparent; color: #10b981; border-color: rgba(16, 185, 129, 0.32); }
.tl-sprint-tag-delayed { background: transparent; color: #ef4444; border-color: rgba(239, 68, 68, 0.32); }
[data-theme='dark'] .tl-sprint-tag-active { color: #34d399; }
[data-theme='dark'] .tl-sprint-tag-delayed { color: #fca5a5; }

.tl-sprint-actions { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }
.tl-sprint-burndown-btn.ant-btn { height: 28px; font-size: 12px; font-weight: 600; border-radius: 6px; }
.tl-sprint-complete-btn.ant-btn.ant-btn-primary {
  height: 28px; font-size: 12px; font-weight: 700;
  background: #10b981; border-color: #10b981; border-radius: 6px;
}
.tl-sprint-complete-btn.ant-btn.ant-btn-primary:hover {
  background: #059669 !important; border-color: #059669 !important;
}

.tl-sprint-row2 { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding-left: 15px; }
.tl-sprint-meta {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em;
}
.tl-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
[data-theme='dark'] .tl-sprint-meta { color: #94a3b8 !important; }
[data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9 !important; }

.tl-sprint-row3 { display: flex; align-items: center; gap: 12px; padding-left: 15px; }
.tl-sprint-progress-bar {
  flex: 1 1 auto; position: relative; height: 6px;
  background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px;
}
[data-theme='dark'] .tl-sprint-progress-bar { background: #1f2937 !important; }
.tl-sprint-progress-fill {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 999px; transition: width 0.4s ease;
}
.tl-sprint-progress-pct {
  flex-shrink: 0; font-size: 12px; font-weight: 800; color: var(--text-slate-900);
  font-variant-numeric: tabular-nums; min-width: 36px; text-align: right;
}
[data-theme='dark'] .tl-sprint-progress-pct { color: #f1f5f9 !important; }

/* ── Inline filter row ────────────────────────────────────────────────── */
.tl-filter-row {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px;
  background: var(--bg-slate-50); border-bottom: 1px solid var(--border-slate-200);
  flex-shrink: 0;
}
[data-theme='dark'] .tl-filter-row { background: #0f1419; border-bottom-color: #1f2937; }
.tl-filter-row-label {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 800; color: var(--text-slate-500);
  text-transform: uppercase; letter-spacing: 0.08em; flex-shrink: 0;
}
[data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
.tl-filter-row-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 6px;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  color: var(--text-slate-500); border-radius: 999px;
  font-size: 10px; font-weight: 800; font-variant-numeric: tabular-nums;
}
[data-theme='dark'] .tl-filter-row-count { background: #111720; border-color: #2d3748; color: #cbd5e1; }
.tl-filter-row-pills { flex: 1 1 auto; min-width: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.tl-filter-row-actions { flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px; }
.tl-filter-row-reset {
  display: inline-flex; align-items: center; gap: 5px; height: 28px; padding: 0 10px;
  background: transparent; border: 1px dashed var(--border-slate-200); border-radius: 8px;
  font-family: inherit; font-size: 11px; font-weight: 700; color: var(--text-slate-500); cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
}
.tl-filter-row-reset:hover {
  color: #1d4ed8; border-color: rgba(59,130,246,0.45);
  background: rgba(59,130,246,0.06); border-style: solid;
}
.tl-filter-row-close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; background: transparent;
  border: 1px solid var(--border-slate-200); border-radius: 8px;
  color: var(--text-slate-500); cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}
.tl-filter-row-close:hover { color: var(--text-slate-900); background: var(--bg-pure-white); border-color: var(--text-slate-400); }
[data-theme='dark'] .tl-filter-row-reset,
[data-theme='dark'] .tl-filter-row-close { border-color: #2d3748; color: #94a3b8; }

/* ── Table shell + rows ───────────────────────────────────────────────── */
.pp-table-wrap {
  background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  border-left: none; border-right: none; border-radius: 0;
  flex: 1; min-height: 0; overflow-y: auto; overflow-x: auto; margin: 0;
  -ms-overflow-style: none; scrollbar-width: none;
}
.pp-table-wrap::-webkit-scrollbar,
.pp-table-wrap .ant-table-body::-webkit-scrollbar,
.pp-table-wrap .ant-table-content::-webkit-scrollbar { width: 0; height: 0; display: none; }
.pp-table-wrap .ant-table-body,
.pp-table-wrap .ant-table-content { -ms-overflow-style: none; scrollbar-width: none; }
[data-theme='dark'] .pp-table-wrap { background: #0f1419; border-color: #1f2937; }

.pp-table .ant-table { background: transparent; font-size: 12px; }
.pp-table .ant-table-thead > tr > th {
  background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
  font-size: 10px !important; font-weight: 800 !important; letter-spacing: 0.04em;
  text-transform: uppercase; color: var(--text-slate-400) !important; padding: 5px 10px !important;
  white-space: nowrap !important; position: sticky !important; top: 0 !important; z-index: 2 !important;
}
[data-theme='dark'] .pp-table .ant-table-thead > tr > th {
  background: #0f1419 !important; border-bottom-color: #1f2937 !important; color: #94a3b8 !important;
}
.pp-table .ant-table-tbody > tr > td {
  border-bottom: 1px solid var(--border-slate-100) !important;
  padding: 6px 10px !important; font-size: 11.5px !important; line-height: 1.35 !important;
}
[data-theme='dark'] .pp-table .ant-table-tbody > tr > td { border-bottom-color: #1f2937 !important; }
.pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
.pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }
.pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
[data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: #1e293b !important; }
.pp-table .ant-table-pagination { display: none !important; }
.pp-table .ant-table-cell-fix-right { background: var(--bg-pure-white) !important; }
[data-theme='dark'] .pp-table .ant-table-cell-fix-right { background: #0f1419 !important; }
.pp-table .ant-table-tbody > tr.pp-row:hover > td.ant-table-cell-fix-right { background: var(--bg-slate-50) !important; }
[data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td.ant-table-cell-fix-right { background: #1e293b !important; }
.pp-table .ant-table-row-expand-icon-cell { padding-inline: 6px !important; width: 34px; }

/* ── Cells ────────────────────────────────────────────────────────────── */
.pp-scope-id {
  cursor: pointer; color: var(--premium-blue, #3B82F6); font-weight: 700; font-size: 11px;
  font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em;
  padding: 2px 6px; background: var(--bg-blue-50); border-radius: 4px;
  border: 1px solid var(--border-blue-200); white-space: nowrap;
  display: inline-flex; align-items: center; gap: 4px;
  transition: opacity .15s ease;
}
.pp-scope-id:hover { opacity: 0.8; }

.pp-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; overflow: hidden; }
.pp-name-icon {
  width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #3B82F6; background: var(--bg-blue-50);
}
[data-theme='dark'] .pp-name-icon { background: rgba(59,130,246,0.15); }
.pp-name-icon .anticon { font-size: 12px !important; }
.pp-name-title {
  flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: var(--text-slate-900);
  letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
[data-theme='dark'] .pp-name-title { color: #f1f5f9; }

.pp-vis-pill {
  display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
  border-radius: 6px; font-size: 11px; font-weight: 600;
  border: 1px solid transparent; white-space: nowrap;
}
.pp-vis-pill--ash { color: #64748b; background: rgba(100,116,139,0.10); border-color: rgba(100,116,139,0.25); }
.pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }

.pp-creator { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
.pp-creator-name {
  font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; font-weight: 500;
  overflow: hidden; text-overflow: ellipsis;
}
[data-theme='dark'] .pp-creator-name { color: #cbd5e1; }

.pp-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 22px; height: 20px; padding: 0 6px; border-radius: 5px;
  background: var(--bg-blue-50); color: #3B82F6;
  font-size: 11px; font-weight: 800; font-variant-numeric: tabular-nums;
}
.pp-count.is-zero { background: var(--bg-slate-100); color: var(--text-slate-400); }
[data-theme='dark'] .pp-count { background: rgba(59,130,246,0.15); }
[data-theme='dark'] .pp-count.is-zero { background: #1e293b; color: #64748b; }

.sc-muted { color: var(--text-slate-400); }

.sc-prio { display: inline-flex; align-items: center; gap: 8px; }
.sc-prio__bars { display: inline-flex; align-items: flex-end; gap: 2px; }
.sc-prio__bar { width: 4px; height: 12px; border-radius: 2px; background: var(--border-slate-200); }
.sc-prio__bar.is-on { background: #60a5fa; }
.sc-prio__bar.is-on.is-max { background: #2563eb; }
.sc-prio__label { font-size: 11.5px; font-weight: 500; color: var(--text-slate-600); }
[data-theme='dark'] .sc-prio__bar { background: #1f2937; }
[data-theme='dark'] .sc-prio__label { color: #94a3b8; }

.sc-person__av {
  width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(59,130,246,.12); color: #2563eb; font-size: 9px; font-weight: 800;
}
.sc-person__av.is-muted { background: rgba(100,116,139,.12); color: #64748b; }

.sc-timeline { display: flex; flex-direction: column; line-height: 1.3; }
.sc-timeline__range { font-size: 11.5px; color: var(--text-slate-700); font-variant-numeric: tabular-nums; white-space: nowrap; }
.sc-timeline__hint { font-size: 10px; color: var(--text-slate-400); }
.sc-timeline__hint.is-late { color: #dc2626; font-weight: 600; }
[data-theme='dark'] .sc-timeline__range { color: #cbd5e1; }

.sc-rowactions { display: flex; align-items: center; justify-content: flex-end; gap: 4px; }
.sc-rowactions button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid transparent; background: transparent;
  color: var(--text-slate-400); cursor: pointer;
  transition: color .15s ease, background .15s ease, border-color .15s ease;
}
.sc-rowactions button:hover { color: #2563eb; background: var(--bg-blue-50); border-color: #bfdbfe; }
.sc-rowactions button.is-danger:hover { color: #dc2626; background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); }

/* ── Expander + linked-items child row ────────────────────────────────── */
.sc-expand {
  display: inline-flex; align-items: center; justify-content: center;
  width: 22px; height: 22px; border-radius: 6px;
  border: 1px solid var(--border-slate-200); background: transparent;
  color: var(--text-slate-400); cursor: pointer; font-size: 10px;
  transition: transform .18s ease, color .15s ease, border-color .15s ease;
}
.sc-expand:hover { color: #2563eb; border-color: #bfdbfe; }
.sc-expand.is-open { transform: rotate(90deg); color: #2563eb; border-color: #bfdbfe; }
.sc-linked {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px; padding: 12px 14px; background: var(--bg-slate-50);
}
[data-theme='dark'] .sc-linked { background: #111720; }
.sc-linked__col { min-width: 0; }
.sc-linked__head { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; color: var(--text-slate-400); }
.sc-linked__label { font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .07em; }
.sc-linked__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 16px; height: 16px; padding: 0 4px; border-radius: 999px;
  background: var(--bg-slate-100); color: var(--text-slate-500); font-size: 9.5px; font-weight: 800;
}
.sc-linked__items { display: flex; flex-wrap: wrap; gap: 5px; }
.sc-linked__chip {
  display: inline-flex; align-items: center; gap: 5px; max-width: 100%;
  height: 22px; padding: 0 8px; border-radius: 6px;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
  font-size: 11.5px; color: var(--text-slate-700);
}
.sc-linked__chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sc-linked__chip-ext { flex-shrink: 0; opacity: 0; transition: opacity .15s ease; }
.sc-linked__chip.is-link { cursor: pointer; text-decoration: none; }
.sc-linked__chip.is-link:hover { color: #2563eb; border-color: #bfdbfe; background: var(--bg-blue-50); }
.sc-linked__chip.is-link:hover .sc-linked__chip-ext { opacity: 1; }
.sc-linked__chip.is-link:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(59,130,246,.16); }
.sc-linked__none { font-size: 11.5px; color: var(--text-slate-300); }
.sc-linked__empty { padding: 10px 14px; font-size: 12.5px; color: var(--text-slate-400); background: var(--bg-slate-50); }
[data-theme='dark'] .sc-linked__empty { background: #111720; }

/* ── Footer + pager ───────────────────────────────────────────────────── */
.pp-footer {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px; padding: 8px 12px;
  background: var(--bg-pure-white); border-top: 1px solid var(--border-slate-200);
  box-sizing: border-box; flex-shrink: 0;
  box-shadow: 0 -4px 14px rgba(15,23,42,0.04); margin: 0;
}
[data-theme='dark'] .pp-footer { background: #0f1419; border-top-color: #1f2937; }
.pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
.pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
[data-theme='dark'] .pp-footer-info strong { color: #f1f5f9; }
.pp-pager { display: flex; align-items: center; gap: 3px; }
.pp-pager-btn, .pp-pager-num {
  min-width: 28px; height: 28px; border-radius: 7px;
  border: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
  color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
}
[data-theme='dark'] .pp-pager-btn, [data-theme='dark'] .pp-pager-num {
  background: #1e293b; border-color: #334155; color: #cbd5e1;
}
.pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
.pp-pagesize { margin-left: 5px; }
.pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

/* ── Grid view ────────────────────────────────────────────────────────── */
.sc-gridwrap { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 16px 16px; }
.pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (max-width: 1024px) { .pp-grid { grid-template-columns: 1fr; } }

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
.pc-actions {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid transparent;
  background: transparent; color: var(--text-slate-400); cursor: pointer; flex-shrink: 0;
}
.pc-actions:hover { color: #2563eb; background: var(--bg-blue-50); border-color: #bfdbfe; }
.pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
.pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; }
.pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
.pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
.pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
.pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
.pc-status-tag {
  display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px;
  border-radius: 5px; font-size: 10.5px; font-weight: 700;
}

/* ── Row action menu (grid card kebab) ────────────────────────────────── */
.pp-action-pop .ant-dropdown-menu {
  padding: 6px; border-radius: 0 !important; min-width: 236px; overflow: hidden !important;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-100);
  box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
}
.pp-action-pop .ant-dropdown-menu-item { padding: 7px 9px !important; border-radius: 0 !important; margin: 1px 0; transition: background .12s ease; }
.pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
.pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
.pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
.pp-menu-item { display: flex; align-items: center; gap: 11px; }
.pp-menu-ic { width: 30px; height: 30px; border-radius: 0; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; }
.pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
.pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
.pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
.pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
.pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
.pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
.pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
[data-theme='dark'] .pp-action-pop .ant-dropdown-menu { background: #0B0F1A !important; border: 1px solid #1E293B !important; }
[data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item:hover { background: #161B22 !important; }
[data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item-divider { background: #1E293B !important; }
[data-theme='dark'] .pp-menu-title { color: #cbd5e1 !important; }
[data-theme='dark'] .pp-menu-desc { color: #64748b !important; }

/* ── Empty + project picker ───────────────────────────────────────────── */
.sc-pickerwrap { flex: 1; min-height: 0; overflow-y: auto; padding: 16px 20px; }
.sc-empty { padding: 44px 24px; text-align: center; }
.sc-empty__icon { font-size: 26px; color: var(--border-slate-200); }
.sc-empty__title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: var(--text-slate-700); }
.sc-empty__desc { margin: 0 auto 14px; max-width: 340px; font-size: 12.5px; color: var(--text-slate-400); }

/* ── Responsive ───────────────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .sc-owner-opt__label { display: none; }
}
@media (max-width: 900px) {
  .sc-header { padding: 8px 12px; }
  .sc-header-controls { order: 3; flex-basis: 100%; }
  .sc-header-right { margin-left: auto; }
  .tl-sprint-row2 { gap: 12px; }
}
@media (max-width: 640px) {
  .tl-shell-wrap { height: auto; min-height: calc(100vh - 64px); overflow: visible; }
  .tl-main { height: auto; overflow: visible; }
  .tl-section { overflow: visible; }
  .tl-section-body { overflow: visible; }
  .pp-table-wrap { overflow-x: auto !important; }
  .sc-linked { grid-template-columns: 1fr; }
  .pp-footer { flex-wrap: wrap; height: auto; min-height: 44px; padding: 8px 14px; gap: 6px; }
  .pp-footer-info { font-size: 11px; }
  .tl-filter-row-label { display: none; }
}
/* ── Cases-specific cells ─────────────────────────────────────────────── */
.pp-case-id {
  cursor: pointer; color: var(--premium-blue, #3B82F6); font-weight: 700; font-size: 11px;
  font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em;
  padding: 2px 6px; background: var(--bg-blue-50); border-radius: 4px;
  border: 1px solid var(--border-blue-200); white-space: nowrap;
  display: inline-flex; align-items: center; gap: 4px;
  transition: opacity .15s ease;
}
.pp-case-id:hover { opacity: 0.8; }

.pp-plain { font-size: 11.5px; color: var(--text-slate-700); }
[data-theme='dark'] .pp-plain { color: #cbd5e1; }

.tc-suites {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 999px; cursor: pointer;
  font-size: 11.5px; font-weight: 600;
  color: #2563eb; background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.22);
  transition: background .15s ease;
}
.tc-suites:hover { background: rgba(59,130,246,.18); }

/* The module a case is filed under, when the list is narrowed to one. */
.tl-sprint-tag-module { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }

.sc-empty__icon { display: inline-block; }
/* ── Detail-page header: breadcrumb in the project-switcher slot ──────── */
.cd-back {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex !important; align-items: center; justify-content: center;
  color: var(--text-slate-500);
}
.cd-back:hover { background: var(--bg-slate-100); color: #2563eb; }
.cd-crumbs { display: flex; align-items: center; gap: 6px; min-width: 0; max-width: 46%; }
.cd-crumb {
  font-size: 12px; font-weight: 600; color: var(--text-slate-500);
  background: none; border: none; padding: 0; cursor: pointer; white-space: nowrap;
  font-family: inherit;
}
button.cd-crumb:hover { color: #2563eb; text-decoration: underline; }
.cd-crumb--strong { color: var(--text-slate-700); cursor: default; }
.cd-sep { color: var(--text-slate-300); font-size: 11px; flex-shrink: 0; }
.cd-title {
  font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em;
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
[data-theme='dark'] .cd-title { color: #f1f5f9; }
[data-theme='dark'] .cd-crumb--strong { color: #cbd5e1; }

/* Banner tag tones — the restricted palette, no new hues. */
.tl-sprint-tag--green { background: transparent; color: #10b981; border-color: rgba(16,185,129,0.32); }
.tl-sprint-tag--blue  { background: transparent; color: #3b82f6; border-color: rgba(59,130,246,0.32); }
.tl-sprint-tag--ash   { background: transparent; color: #64748b; border-color: rgba(100,116,139,0.32); }
.tl-sprint-tag--red   { background: transparent; color: #ef4444; border-color: rgba(239,68,68,0.32); }
[data-theme='dark'] .tl-sprint-tag--green { color: #34d399; }
[data-theme='dark'] .tl-sprint-tag--red { color: #fca5a5; }

/* Row 2 reads "Label value" pairs here rather than bare counts. */
.tl-sprint-row2 .tl-sprint-meta > span { color: var(--text-slate-400); font-weight: 600; }
.tl-sprint-row2 .tl-sprint-meta b { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.pp-case-id {
  cursor: pointer; color: var(--premium-blue, #3B82F6); font-weight: 700; font-size: 11px;
  font-family: 'JetBrains Mono', monospace; letter-spacing: -0.02em;
  padding: 2px 6px; background: var(--bg-blue-50); border-radius: 4px;
  border: 1px solid var(--border-blue-200); white-space: nowrap;
  display: inline-flex; align-items: center; gap: 4px;
  transition: opacity .15s ease;
}
.pp-case-id:hover { opacity: 0.8; }
.pp-plain { font-size: 11.5px; color: var(--text-slate-700); }
[data-theme='dark'] .pp-plain { color: #cbd5e1; }

@media (max-width: 900px) {
  .cd-crumbs { max-width: 100%; }
  .cd-crumb, .cd-sep { display: none; }
  .cd-title { display: block; }
}
`;

