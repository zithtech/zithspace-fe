"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Input, message, Tooltip, Drawer, Form, Row, Col, Modal, Checkbox, Pagination } from "antd";
import {
  PlayCircleOutlined, ArrowLeftOutlined, SearchOutlined, CheckCircleOutlined,
  CloseCircleOutlined, StopOutlined, MinusCircleOutlined, FileTextOutlined, DownOutlined,
  PlusOutlined, CloseOutlined, InfoCircleOutlined, SnippetsOutlined, BugOutlined,
  PaperClipOutlined, LinkOutlined, UploadOutlined,
} from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useRouter, useParams } from "next/navigation";
import { PlayCircle, SpellCheck, Loader2, Sparkles } from "lucide-react";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { commonDrawerProps, SectionCard, drawerFormStyles as formStyles } from "@/components/common/DrawerSection";
import BugListService from "@/services/bugListService";
import { useQaOptions } from "@/hooks/useQaOptions";
import dayjs from "dayjs";

const { TextArea } = Input;

/** Statuses that require the tester to say what went wrong. */
const NEEDS_NOTE = ["Fail", "Blocked"];

/** Steps are stored as a JSON array, a newline string, or already an array. */
const parseSteps = (val: any): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* fall through to newline splitting */
  }
  if (typeof val === "string") {
    return val.split("\n").map(s => s.replace(/^\d+[.)]\s*/, "").trim()).filter(Boolean);
  }
  return [];
};

const STATUS_TONE: Record<string, string> = {
  Pass: "green",
  Fail: "red",
  Blocked: "amber",
};

/* Product-standard stat tile */
const StatTile = ({ label, value, icon: Icon, color, bgColor, sub }: { label: string; value: string | number; icon: any; color: string; bgColor: string; sub?: string; }) => (
  <div className="pp-stat-card">
    <div className="pp-stat-top">
      <div className="pp-stat-left">
        <span className="pp-stat-icon" style={{ background: bgColor, color }}>
          <Icon size={14} style={{ fontSize: 14 }} />
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

export default function TestRunExecutionPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestRunExecution" });

  const router = useRouter();
  const params = useParams();
  const runId = params?.runId as string;

  const { canReadRun } = usePermission();
  // Priority / severity / type come from QA Settings
  const { priorityOptions, severityOptions, testTypeOptions, defaultPriority, defaultSeverity, defaultTestType, toSeverityKey, toBugTypeKey } = useQaOptions();

  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // "What happened" drafts, keyed by result id, so typing never blocks on the API
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [polishingId, setPolishingId] = useState<string | null>(null);

  // ── Attachments on failure notes ─────────────────────────────────────────
  const [attachOpen, setAttachOpen] = useState<Record<string, boolean>>({});
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [linkDrafts, setLinkDrafts] = useState<Record<string, { url: string; name: string }>>({});

  /** Which cases have their details panel expanded. Collapsed is the default. */
  const [openDetails, setOpenDetails] = useState<Record<string, boolean>>({});
  const toggleDetails = (id: string) =>
    setOpenDetails(prev => ({ ...prev, [id]: !prev[id] }));

  const [searchTerm, setSearchTerm] = useState("");
  /** Search hits the server, so wait for a pause in typing. */
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // ── Server-side pagination ───────────────────────────────────────────────
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  /** Paging should land at the top of the list, not mid-scroll. */
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // "Add to Buglist" — file failed cases into a bug sheet
  const [bugOpen, setBugOpen] = useState(false);
  const [bugSaving, setBugSaving] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [sheets, setSheets] = useState<any[]>([]);
  const [bugFolderId, setBugFolderId] = useState<string | undefined>();
  const [bugSheetId, setBugSheetId] = useState<string | undefined>();
  const [selectedBugIds, setSelectedBugIds] = useState<string[]>([]);
  /** Logged this session — prevents filing the same failure twice by accident. */
  const [loggedBugIds, setLoggedBugIds] = useState<string[]>([]);

  /**
   * Every failed case in the run — not just the current page, so paging never
   * hides a failure from the bug modal. Loaded when the modal opens.
   */
  const [failedCases, setFailedCases] = useState<any[]>([]);
  const [failedLoading, setFailedLoading] = useState(false);

  /**
   * A case counts as filed when the run itself carries the link (`bug_logged`,
   * set server-side and still valid — a trashed bug releases the case) or when
   * it was filed a moment ago in this session.
   */
  const isBugLogged = (c: any) => !!c?.bug_logged || loggedBugIds.includes(c?.id);
  const selectableBugCases = failedCases.filter((c: any) => !isBugLogged(c));

  /** Stamp the freshly-filed bugs onto both lists, so nothing needs a refetch. */
  const markCasesLogged = (ids: string[], bugNumbers: Record<string, string>) => {
    if (!ids.length) return;
    const stamp = (r: any) =>
      ids.includes(r.id)
        ? { ...r, bug_logged: true, bug_number: bugNumbers[r.id] || r.bug_number || null }
        : r;
    setLoggedBugIds(prev => [...prev, ...ids]);
    setSelectedBugIds(prev => prev.filter(id => !ids.includes(id)));
    setFailedCases(prev => prev.map(stamp));
    setRun((prev: any) => {
      if (!prev) return prev;
      const counts = { ...(prev.counts || {}) };
      // Keep the "Add to Buglist" badge honest without a refetch
      counts.fail_unfiled = Math.max(0, Number(counts.fail_unfiled ?? counts.fail ?? 0) - ids.length);
      return { ...prev, counts, results: (prev.results || []).map(stamp) };
    });
  };

  // Inline creation, so a tester never has to leave the run to file a bug
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newSheetOpen, setNewSheetOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [creatingSheet, setCreatingSheet] = useState(false);

  const createFolderInline = async () => {
    const name = newFolderName.trim();
    if (!name || creatingFolder) return;
    setCreatingFolder(true);
    try {
      // Stamp the run's project, otherwise the bug list (which filters by
      // folder.project_id) will never show bugs filed here.
      const folder: any = await BugListService.createFolder({
        name,
        ...(run?.project_id ? { projectId: run.project_id } : {}),
      });
      setFolders(prev => [...prev, folder]);
      setBugFolderId(folder.id);
      setBugSheetId(undefined);
      setNewFolderOpen(false);
      setNewFolderName("");
      // A brand-new folder has no sheets, so go straight to naming one
      setNewSheetOpen(true);
      message.success(`Folder "${folder.name}" created`);
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "Couldn't create the folder");
    } finally {
      setCreatingFolder(false);
    }
  };

  const createSheetInline = async () => {
    const name = newSheetName.trim();
    if (!name || !bugFolderId || creatingSheet) return;
    setCreatingSheet(true);
    try {
      const sheet: any = await BugListService.createSheet({ folderId: bugFolderId, name });
      setSheets(prev => [...prev, sheet]);
      setBugSheetId(sheet.id);
      setNewSheetOpen(false);
      setNewSheetName("");
      message.success(`Sheet "${sheet.name}" created`);
    } catch (err: any) {
      console.error(err);
      message.error(err?.message || "Couldn't create the sheet");
    } finally {
      setCreatingSheet(false);
    }
  };

  const openBugModal = async () => {
    setNewFolderOpen(false);
    setNewSheetOpen(false);
    setNewFolderName("");
    setNewSheetName("");
    setBugOpen(true);

    // Pull every failure in the run, independent of the page being viewed
    setFailedLoading(true);
    try {
      const res: any = await axios.get(`/api/v2/qa/runs/${runId}`, {
        params: { status: "Fail", pageSize: 500, page: 1 },
      });
      const data = res?.data?.data || res?.data || res;
      const cases = data?.results || [];
      setFailedCases(cases);
      // Cases that already carry a bug start unselected — they can't be re-filed
      setSelectedBugIds(cases.filter((c: any) => !isBugLogged(c)).map((c: any) => c.id));
    } catch (err) {
      console.error(err);
      message.error("Couldn't load the failed cases");
    } finally {
      setFailedLoading(false);
    }

    if (folders.length) return;
    try {
      // Scope folders to the run's project so bugs land where the bug list looks
      const list = await BugListService.getFolders(run?.project_id || undefined);
      setFolders(list || []);
      if (list?.length === 1) setBugFolderId(list[0].id);
    } catch (err) {
      console.error(err);
      message.error("Couldn't load bug list folders");
    }
  };

  // Sheets depend on the chosen folder
  useEffect(() => {
    if (!bugFolderId) { setSheets([]); return; }
    let active = true;
    BugListService.getSheets(bugFolderId)
      .then((list: any[]) => { if (active) { setSheets(list || []); if (list?.length === 1) setBugSheetId(list[0].id); } })
      .catch((err: any) => { console.error(err); if (active) setSheets([]); });
    return () => { active = false; };
  }, [bugFolderId]);

  const submitBugs = async () => {
    if (!bugSheetId || !bugFolderId || selectedBugIds.length === 0 || bugSaving) return;
    setBugSaving(true);
    // A case that already carries a bug is never re-filed, whatever is selected
    const chosen = failedCases.filter((c: any) => selectedBugIds.includes(c.id) && !isBugLogged(c));
    const succeeded: string[] = [];
    const linked: Record<string, string> = {};
    try {
      for (const c of chosen) {
        // Description is what the tester observed. The case definition is NOT
        // copied here — the bug drawer reads it live from the linked test case.
        const description = (c.notes || "").trim()
          || `Test case failed during run "${run?.run_name || ""}".`;

        // Carry the evidence over; the server copies each file into the bug's storage
        const attachments = (c.attachments || [])
          .filter((a: any) => a.kind === "file" && a.url)
          .map((a: any) => ({
            fileName: a.name || "attachment",
            fileUrl: a.url,
            fileType: a.fileType || "application/octet-stream",
            fileSize: a.fileSize,
            isNew: true,
            sourceUrl: a.url,
          }));

        // Links attached to the failure travel as external links
        const externalLinks = (c.attachments || [])
          .filter((a: any) => a.kind === "link" && a.url)
          .map((a: any) => ({ label: a.name || a.url, url: a.url }));

        // The server rejects keys the tenant hasn't configured, so only send
        // severity/type when they resolve against the current option lists.
        const severityKey = toSeverityKey(c.severity);
        const bugTypeKey = toBugTypeKey(c.test_type);

        const bug: any = await BugListService.createBug({
          folderId: bugFolderId,
          sheetId: bugSheetId,
          title: c.name || "Failed test case",
          description,
          module: run?.suite_name || undefined,
          ...(severityKey ? { severity: severityKey } : {}),
          ...(bugTypeKey ? { bugType: bugTypeKey } : {}),
          attachments: attachments.length ? attachments : undefined,
          externalLinks: externalLinks.length ? externalLinks : undefined,
          testCaseId: c.test_case_id || null,
          testCaseRef: c.tc_ref_id || null,
        });
        succeeded.push(c.id);

        // Record the link on the run itself — this is what survives a reload
        // and stops the same failure being filed a second time.
        if (bug?.id) {
          try {
            const res: any = await axios.post(
              `/api/v2/qa/runs/${runId}/results/${c.id}/bug-link`,
              { bugId: bug.id },
            );
            const data = res?.data?.data || res?.data || res;
            linked[c.id] = data?.bug_number || bug.bugNumber || bug.bug_number || "";
          } catch (linkErr) {
            // The bug exists either way — don't fail the batch over the link
            console.error("Couldn't link the bug to the run result", linkErr);
            linked[c.id] = bug.bugNumber || bug.bug_number || "";
          }
        }
      }
      markCasesLogged(succeeded, linked);
      setSelectedBugIds([]);
      setBugOpen(false);
      message.success(`${succeeded.length} bug${succeeded.length === 1 ? "" : "s"} added to the bug list`);
    } catch (err: any) {
      console.error(err);
      // Keep whatever did get through, so a retry doesn't duplicate them
      markCasesLogged(succeeded, linked);
      setSelectedBugIds(prev => prev.filter(id => !succeeded.includes(id)));
      message.error(
        succeeded.length
          ? `Added ${succeeded.length}, then failed — the rest are still selected.`
          : (err?.response?.data?.error || "Failed to add bugs")
      );
    } finally {
      setBugSaving(false);
    }
  };

  // "Add Case" — for defects the suite doesn't cover yet
  const EMPTY_CASE = {
    name: "", description: "", preconditions: "", expected_result: "",
    priority: defaultPriority, severity: defaultSeverity, test_type: defaultTestType,
    automation: "Manual", status: "Active",
    steps: [] as string[],
  };
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [newCase, setNewCase] = useState(EMPTY_CASE);
  const [stepDraft, setStepDraft] = useState("");

  // "Create with Zai" — drafts the case from a plain-language description
  const [zaiOpen, setZaiOpen] = useState(true);
  const [zaiPrompt, setZaiPrompt] = useState("");
  const [zaiGenerating, setZaiGenerating] = useState(false);

  const openAddCase = () => {
    setNewCase(EMPTY_CASE);
    setStepDraft("");
    setZaiPrompt("");
    setZaiGenerating(false);
    setZaiOpen(true);
    setAddOpen(true);
  };

  /** Draft the case from the tester's description; never overwrites typed input. */
  const handleZaiGenerate = async () => {
    const prompt = zaiPrompt.trim();
    if (!prompt || zaiGenerating) return;
    setZaiGenerating(true);
    try {
      const res: any = await axios.post('/api/v2/qa/generate-ai', {
        prompt,
        scenarioTitle: run?.run_name,
        moduleName: run?.suite_name,
      });
      const d = res?.data?.data ?? res?.data ?? res;
      if (!d?.name && !(d?.steps_to_reproduce?.length)) {
        message.error('Zai returned nothing usable. Try describing it in more detail.');
        return;
      }
      setNewCase(prev => ({
        ...prev,
        name: prev.name.trim() || d.name || prev.name,
        description: prev.description.trim() || d.description || prev.description,
        preconditions: prev.preconditions.trim() || d.preconditions || prev.preconditions,
        steps: prev.steps.length ? prev.steps : (d.steps_to_reproduce || []),
        expected_result: prev.expected_result.trim() || d.expected_result || prev.expected_result,
        test_type: d.test_type || prev.test_type,
        priority: d.priority || prev.priority,
        severity: d.severity || prev.severity,
      }));
      setZaiOpen(false);
      message.success('Zai drafted the case — review it before adding.');
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || 'Failed to draft the test case');
    } finally {
      setZaiGenerating(false);
    }
  };

  const addStep = () => {
    const s = stepDraft.trim();
    if (!s) return;
    setNewCase(prev => ({ ...prev, steps: [...prev.steps, s] }));
    setStepDraft("");
  };

  /**
   * Creates the case, links it to the run's suite and appends the new result
   * row — all server-side in one transaction, so the run can't end up with a
   * case that isn't in its suite.
   */
  const submitNewCase = async () => {
    if (!newCase.name.trim() || addSaving) return;
    setAddSaving(true);
    try {
      const res: any = await axios.post(`/api/v2/qa/runs/${runId}/cases`, {
        name: newCase.name.trim(),
        description: newCase.description || null,
        preconditions: newCase.preconditions || null,
        expected_result: newCase.expected_result || null,
        steps_to_reproduce: newCase.steps.length ? newCase.steps : null,
        priority: newCase.priority,
        severity: newCase.severity,
        test_type: newCase.test_type,
        automation: newCase.automation,
      });
      const created = res?.data?.data || res?.data || res;
      if (!created?.id) throw new Error("Malformed response");

      setNoteDrafts(prev => ({ ...prev, [created.id]: "" }));
      setAddOpen(false);
      message.success(`${created.tc_ref_id || "Case"} added to this run and the suite`);
      // The new case belongs on whichever page its ID sorts into — reload
      // rather than tacking an eleventh row onto this one.
      fetchRun();
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || "Failed to add the test case");
    } finally {
      setAddSaving(false);
    }
  };

  /** Only the newest request may write to state — typing races otherwise. */
  const fetchSeq = React.useRef(0);

  const fetchRun = async () => {
    const seq = ++fetchSeq.current;
    try {
      setLoading(true);
      const res: any = await axios.get(`/api/v2/qa/runs/${runId}`, {
        params: {
          page,
          pageSize: PAGE_SIZE,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });
      if (seq !== fetchSeq.current) return;
      const data = res?.data?.data || res?.data || res;
      setRun(data);
      // Seed drafts for this page, keeping drafts typed on pages already seen
      setNoteDrafts(prev => {
        const next = { ...prev };
        (data?.results || []).forEach((r: any) => { next[r.id] = r.notes || ""; });
        return next;
      });
    } catch (error) {
      if (seq === fetchSeq.current) message.error("Failed to load the test run");
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  };

  // Debounce the search box before it becomes a request
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // A new filter means a new result set — page 3 of the old one is meaningless
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (canReadRun && runId) fetchRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReadRun, runId, page, debouncedSearch, statusFilter]);

  // Paging past the end (the last case on a page got filtered away) — go back
  useEffect(() => {
    if (!loading && page > 1 && (run?.results || []).length === 0) setPage(1);
  }, [loading, page, run]);

  if (!canReadRun) return null;

  const results: any[] = run?.results || [];

  // Counts come from the server and cover the whole run, so the tiles and the
  // progress bar stay put while paging.
  const counts = {
    total: Number(run?.counts?.total ?? 0),
    pass: Number(run?.counts?.pass ?? 0),
    fail: Number(run?.counts?.fail ?? 0),
    blocked: Number(run?.counts?.blocked ?? 0),
    /** Failures that don't have a bug yet — the only ones worth filing. */
    failUnfiled: Number(run?.counts?.fail_unfiled ?? run?.counts?.fail ?? 0),
  };
  const executed = counts.pass + counts.fail + counts.blocked;
  const percent = counts.total ? Math.round((executed / counts.total) * 100) : 0;

  const totalMatching = Number(run?.pagination?.total ?? 0);
  const isFiltered = !!debouncedSearch || !!statusFilter;

  /** Details toggles apply to the cases currently on screen. */
  const anyOpen = results.some(r => openDetails[r.id]);
  const toggleAllDetails = () => {
    if (anyOpen) { setOpenDetails({}); return; }
    const next: Record<string, boolean> = {};
    results.forEach(r => { next[r.id] = true; });
    setOpenDetails(next);
  };

  /** Persist a status and/or note for one case. */
  const saveResult = async (resultId: string, patch: { status?: string; notes?: string }) => {
    try {
      setSavingId(resultId);
      await axios.put(`/api/v2/qa/runs/${runId}/results/${resultId}`, patch);
      setRun((prev: any) => {
        if (!prev) return prev;
        const before = (prev.results || []).find((r: any) => r.id === resultId);
        // Counts are server-wide, so nudge them here instead of refetching the
        // whole run on every click.
        let counts = prev.counts;
        if (patch.status !== undefined && before) {
          const bucket = (s?: string) =>
            s === "Pass" ? "pass" : s === "Fail" ? "fail" : s === "Blocked" ? "blocked" : null;
          counts = { ...(prev.counts || {}) };
          const from = bucket(before.status);
          const to = bucket(patch.status);
          if (from) counts[from] = Math.max(0, Number(counts[from] || 0) - 1);
          if (to) counts[to] = Number(counts[to] || 0) + 1;
        }
        return {
          ...prev,
          counts,
          results: (prev.results || []).map((r: any) => (r.id === resultId ? { ...r, ...patch } : r)),
        };
      });
    } catch (error) {
      message.error("Failed to save — your change wasn't recorded");
    } finally {
      setSavingId(null);
    }
  };

  const handleStatus = (result: any, status: string) => {
    const next = result.status === status ? "Not Executed" : status;
    // A pass needs nothing more from the tester, so collapse it and keep the
    // list scannable. Fail and Blocked owe an explanation — open the panel so
    // the note and its attachments are right there.
    setOpenDetails(prev => ({ ...prev, [result.id]: NEEDS_NOTE.includes(next) }));
    saveResult(result.id, { status: next });
  };

  /** Save the note only when it actually changed. */
  const commitNote = (result: any) => {
    const draft = noteDrafts[result.id] ?? "";
    if (draft === (result.notes || "")) return;
    saveResult(result.id, { notes: draft });
  };

  /** Replace one result's attachment list in place. */
  const setAttachments = (resultId: string, attachments: any[]) => {
    setRun((prev: any) => ({
      ...prev,
      results: prev.results.map((r: any) => (r.id === resultId ? { ...r, attachments } : r)),
    }));
  };

  const uploadAttachment = async (result: any, file: File, label?: string) => {
    if (uploadingId) return;
    if (file.size > 10 * 1024 * 1024) {
      message.error("Files must be 10MB or smaller");
      return;
    }
    setUploadingId(result.id);
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read the file"));
        reader.readAsDataURL(file);
      });

      const res: any = await axios.post(`/api/v2/qa/runs/${runId}/results/${result.id}/attachments`, {
        base64,
        fileName: file.name || "attachment",
        name: label || file.name,
      });
      const data = res?.data?.data || res?.data || res;
      setAttachments(result.id, data.attachments || []);
      setAttachOpen(prev => ({ ...prev, [result.id]: true }));
      message.success("Attachment uploaded");
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || "Failed to upload the attachment");
    } finally {
      setUploadingId(null);
    }
  };

  /** Pasting an image into the note uploads it instead of dropping it. */
  const handleNotePaste = (result: any, e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    e.preventDefault();
    const stamped = new File([file], `pasted-${Date.now()}.${(file.type.split("/")[1] || "png")}`, { type: file.type });
    uploadAttachment(result, stamped, "Pasted screenshot");
  };

  const addLinkAttachment = async (result: any) => {
    const draft = linkDrafts[result.id] || { url: "", name: "" };
    const url = draft.url.trim();
    if (!url) return;
    try {
      const res: any = await axios.post(`/api/v2/qa/runs/${runId}/results/${result.id}/attachments`, {
        url,
        name: draft.name.trim() || url,
      });
      const data = res?.data?.data || res?.data || res;
      setAttachments(result.id, data.attachments || []);
      setLinkDrafts(prev => ({ ...prev, [result.id]: { url: "", name: "" } }));
      message.success("Link attached");
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || "Failed to attach the link");
    }
  };

  const removeAttachment = async (result: any, attachmentId: string) => {
    try {
      const res: any = await axios.delete(`/api/v2/qa/runs/${runId}/results/${result.id}/attachments/${attachmentId}`);
      const data = res?.data?.data || res?.data || res;
      setAttachments(result.id, data.attachments || []);
    } catch (err: any) {
      console.error(err);
      message.error("Failed to remove the attachment");
    }
  };

  const polishNote = async (result: any) => {
    const text = (noteDrafts[result.id] || "").trim();
    if (!text || polishingId) return;
    setPolishingId(result.id);
    try {
      const res: any = await axios.post("/api/v2/qa/runs/note-grammar", { text });
      const corrected = (res?.data?.data?.text ?? res?.data?.text ?? "").trim();
      if (!corrected) {
        message.error("Zai returned an empty response.");
        return;
      }
      if (corrected === text) {
        message.info("Already looks good");
        return;
      }
      setNoteDrafts(prev => ({ ...prev, [result.id]: corrected }));
      await saveResult(result.id, { notes: corrected });
      message.success("Grammar polished");
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || "Couldn't polish the note");
    } finally {
      setPolishingId(null);
    }
  };

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
        .pp-side-head { display: flex; align-items: center; gap: 9px; padding: 0 2px; }
        .pp-side-logo {
          width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
          background: var(--bg-blue-50); color: #3B82F6;
          display: flex; align-items: center; justify-content: center;
          border: 1px solid rgba(59,130,246,.16);
        }
        .pp-side-title { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); line-height: 1.15; margin: 0; }
        .pp-side-subtitle { font-size: 10.5px; color: var(--text-slate-400); font-weight: 500; margin: 1px 0 0; letter-spacing: .02em; }

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
          border: 1px solid var(--border-slate-100);
        }
        .pp-nav-item:hover { background: var(--bg-slate-50); color: var(--text-slate-900); }
        .pp-nav-item:hover .pp-nav-icon { color: var(--text-slate-600); }
        .pp-nav-item.is-active { background: var(--bg-blue-50); color: #3B82F6; font-weight: 650; }
        .pp-nav-item.is-active .pp-nav-icon { color: #3B82F6; }
        .pp-nav-item.is-active .pp-nav-count { background: rgba(59,130,246,.14); color: #2563eb; border-color: transparent; }
        .pp-nav-item.is-active::before {
          content: ''; position: absolute; left: -8px; top: 7px; bottom: 7px;
          width: 3px; border-radius: 0 3px 3px 0; background: #3B82F6;
        }

        /* Run summary card in the rail */
        .cd-side {
          margin: 2px 0 0; padding: 11px 10px;
          border: 1px solid var(--border-slate-200); border-radius: 10px; background: var(--bg-slate-50);
        }
        .cd-side__title { font-size: 12.5px; font-weight: 650; color: var(--text-slate-900); line-height: 1.4; word-break: break-word; }
        .cd-meta { margin: 12px 0 0; display: flex; flex-direction: column; gap: 9px; }
        .cd-meta__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0; }
        .cd-meta__row dt { font-size: 11px; color: var(--text-slate-400); font-weight: 500; flex-shrink: 0; }
        .cd-meta__row dd {
          margin: 0; font-size: 11.5px; font-weight: 600; color: var(--text-slate-700);
          text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .dh-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: transparent; }
        .dh-main-topbar {
          min-height: 52px; padding: 8px 20px; border-bottom: 1px solid var(--border-slate-200);
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0;
        }
        .dh-main-scroll { flex: 1; overflow-y: auto; padding: 16px 20px 24px; }

        .sc-topbar__title { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
        .sc-topbar__h1 { font-size: 15px; font-weight: 700; color: var(--text-slate-900); }
        .sc-topbar__div { width: 1px; height: 14px; background: var(--border-slate-200); flex-shrink: 0; }
        .cd-crumb {
          font-size: 11px; text-transform: uppercase; letter-spacing: .12em; font-weight: 600;
          color: var(--text-slate-400); white-space: nowrap; flex-shrink: 0;
        }
        /* Suite names are long — give the crumb room before it ellipses */
        .cd-crumb--strong { color: var(--text-slate-600); max-width: min(38vw, 420px); overflow: hidden; text-overflow: ellipsis; }
        .cd-sep { color: var(--border-slate-200); flex-shrink: 0; }
        .cd-title { min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
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

        /* ── Search + result filters, all on one row ────────────────── */
        .ex-searchrow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .ex-search { width: 260px; flex-shrink: 0; }
        .ex-search.ant-input-affix-wrapper {
          height: 36px !important; border-radius: 9px; padding: 0 12px;
          background: var(--bg-pure-white); transition: all .15s ease;
        }
        .ex-search.ant-input-affix-wrapper:hover { border-color: #bfdbfe; }
        .ex-search.ant-input-affix-wrapper-focused { border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
        .ex-search .ant-input { font-size: 13px; }
        .ex-search .ant-input-prefix { margin-inline-end: 9px; font-size: 14px; }

        .ex-filters__field { min-width: 160px; flex-shrink: 0; }
        .ex-searchrow .sd-trigger {
          height: 36px !important; min-height: 36px !important;
          border-radius: 9px !important; padding: 0 12px !important;
        }

        .sc-count { margin-left: auto; font-size: 11.5px; color: var(--text-slate-500); white-space: nowrap; }
        .sc-count strong { color: var(--text-slate-900); font-weight: 700; }

        .ex-tab {
          display: inline-flex; align-items: center; gap: 7px; cursor: pointer; flex-shrink: 0;
          height: 36px; padding: 0 12px; border-radius: 9px;
          font-size: 12.5px; font-weight: 600; color: var(--text-slate-600);
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          transition: all .15s ease;
        }
        .ex-tab:hover { border-color: var(--text-slate-300); color: var(--text-slate-900); }
        .ex-tab__dot { width: 7px; height: 7px; border-radius: 999px; flex-shrink: 0; }
        .ex-tab--pass .ex-tab__dot { background: #10b981; }
        .ex-tab--fail .ex-tab__dot { background: #ef4444; }
        .ex-tab__count {
          min-width: 20px; padding: 1px 7px; border-radius: 999px;
          font-size: 11px; font-weight: 700; text-align: center;
          background: var(--bg-slate-50); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-100); transition: all .15s ease;
        }
        /* Active state takes the tone of the status it filters */
        .ex-tab.is-active { color: #fff; }
        .ex-tab.is-active .ex-tab__dot { background: rgba(255,255,255,.85); }
        .ex-tab.is-active .ex-tab__count { background: rgba(255,255,255,.22); color: #fff; border-color: transparent; }
        .ex-tab--pass.is-active { background: #10b981; border-color: #10b981; }
        .ex-tab--fail.is-active { background: #ef4444; border-color: #ef4444; }

        /* Expand / collapse every case on the page */
        .ex-tab--toggle { gap: 6px; }
        .ex-tab--toggle:disabled { opacity: .5; cursor: not-allowed; }
        .ex-tab--toggle .ex-caret { transition: transform .18s ease; }
        .ex-tab--toggle.is-open { background: var(--bg-blue-50); border-color: #bfdbfe; color: #2563eb; }
        .ex-tab--toggle.is-open .ex-caret { transform: rotate(180deg); }

        /* ── Pagination, pinned to the bottom of the run ─────────────── */
        .ex-pagebar {
          flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; padding: 9px 20px;
          border-top: 1px solid var(--border-slate-200); background: var(--bg-pure-white);
        }
        .ex-pagebar__info {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 11.5px; color: var(--text-slate-500); white-space: nowrap;
        }
        .ex-pagebar__info strong { color: var(--text-slate-900); font-weight: 700; }
        .ex-pagebar__dot { width: 3px; height: 3px; border-radius: 999px; background: var(--border-slate-200); }
        .ex-pagebar .ant-pagination { margin: 0; }
        .ex-pagebar .ant-pagination-item,
        .ex-pagebar .ant-pagination-prev,
        .ex-pagebar .ant-pagination-next { border-radius: 7px; }
        .ex-pagebar .ant-pagination-item-active { border-color: #3B82F6; }
        .ex-pagebar .ant-pagination-item-active a { color: #3B82F6; font-weight: 700; }

        .ex-buglist-btn.ant-btn {
          height: 36px; border-radius: 9px; font-size: 12.5px; font-weight: 600;
          display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0;
        }
        .ex-buglist-btn__n {
          min-width: 18px; padding: 0 6px; border-radius: 999px;
          font-size: 10.5px; font-weight: 700; line-height: 17px;
          background: rgba(239,68,68,.12); color: #dc2626;
        }

        /* ── Add to Buglist modal ───────────────────────────────────── */
        .bl { display: flex; flex-direction: column; max-height: 82vh; background: var(--bg-pure-white); }
        .bl__head {
          display: flex; align-items: flex-start; gap: 11px; flex-shrink: 0;
          padding: 14px 18px; border-bottom: 1px solid var(--border-slate-100);
        }
        .bl__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 34px; height: 34px; border-radius: 10px; font-size: 15px;
          background: rgba(239,68,68,.1); color: #dc2626; border: 1px solid rgba(239,68,68,.2);
        }
        .bl__headtext { flex: 1; min-width: 0; }
        .bl__title { margin: 0; font-size: 15px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em; }
        .bl__sub { display: block; margin-top: 2px; font-size: 12px; line-height: 1.45; color: var(--text-slate-500); }
        .bl__close {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 28px; height: 28px; border-radius: 8px; font-size: 12px;
          color: var(--text-slate-400); background: none; border: none; cursor: pointer;
          transition: all .15s ease;
        }
        .bl__close:hover { color: var(--text-slate-900); background: var(--bg-slate-50); }

        .bl__warn {
          display: flex; flex-direction: column; gap: 2px; flex-shrink: 0;
          padding: 10px 18px; background: rgba(245,158,11,.08);
          border-bottom: 1px solid rgba(245,158,11,.25);
        }
        .bl__warn-title { font-size: 12px; font-weight: 700; color: #b45309; }
        .bl__warn-desc { font-size: 11.5px; line-height: 1.45; color: var(--text-slate-600); }

        .bl__dest {
          display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; flex-shrink: 0;
          padding: 12px 18px; background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-slate-100);
        }
        .bl__destfield { flex: 1; min-width: 220px; }
        .bl__labelrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
        .bl__label { display: block; font-size: 11.5px; font-weight: 600; color: var(--text-slate-600); }
        .bl__new {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 11px; font-weight: 600; color: #2563eb;
          background: none; border: none; cursor: pointer; padding: 1px 0;
        }
        .bl__new:hover:not(:disabled) { text-decoration: underline; }
        .bl__new:disabled { color: var(--text-slate-300); cursor: not-allowed; }
        .bl__newrow { display: flex; gap: 6px; }
        .bl__newrow .ant-input { height: 34px; border-radius: 8px; font-size: 12.5px; }
        .bl__newrow .ant-btn { height: 34px; border-radius: 8px; font-size: 12.5px; font-weight: 600; flex-shrink: 0; }
        .bl__dest .sd-trigger { height: 34px !important; min-height: 34px !important; border-radius: 8px !important; padding: 0 12px !important; }
        .bl__destsummary { display: flex; align-items: baseline; gap: 6px; padding-bottom: 6px; white-space: nowrap; }
        .bl__destcount { font-size: 20px; font-weight: 800; color: var(--text-slate-900); line-height: 1; }
        .bl__destlabel { font-size: 11.5px; color: var(--text-slate-500); }

        .bl__body { flex: 1; overflow-y: auto; padding: 12px 18px 16px; }
        .bl__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
        .bl__toolbarlabel {
          font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .bl__toolbaractions { display: flex; align-items: center; gap: 8px; }
        .bl__link {
          font-size: 11.5px; font-weight: 600; color: #2563eb;
          background: none; border: none; cursor: pointer; padding: 1px 0;
        }
        .bl__link:hover:not(:disabled) { text-decoration: underline; }
        .bl__link:disabled { color: var(--text-slate-300); cursor: not-allowed; }
        .bl__dot { width: 3px; height: 3px; border-radius: 999px; background: var(--border-slate-200); }

        .bl__list { display: flex; flex-direction: column; gap: 7px; }
        .bl__item {
          display: flex; align-items: flex-start; gap: 11px; cursor: pointer;
          padding: 10px 12px; border-radius: 10px;
          border: 1px solid var(--border-slate-100); background: var(--bg-pure-white);
          transition: border-color .15s ease, background .15s ease;
        }
        .bl__item:hover { border-color: #bfdbfe; background: var(--bg-slate-50); }
        .bl__item.is-on { border-color: rgba(239,68,68,.32); background: rgba(239,68,68,.04); }
        .bl__item.is-done { opacity: .6; cursor: default; }
        .bl__item.is-done:hover { border-color: var(--border-slate-100); background: var(--bg-pure-white); }
        .bl__itembody { flex: 1; min-width: 0; }
        .bl__itemtop { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .bl__itemid {
          flex-shrink: 0; font-size: 10.5px; font-weight: 700;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          padding: 2px 6px; border-radius: 5px;
          background: rgba(239,68,68,.1); color: #dc2626;
        }
        .bl__itemname { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .bl__badge {
          font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 999px;
          background: rgba(16,185,129,.12); color: #047857;
        }
        .bl__itemmeta { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; }
        .bl__chip {
          font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-500);
        }
        .bl__itemnote {
          margin: 7px 0 0; font-size: 12px; line-height: 1.5; color: var(--text-slate-600);
          white-space: pre-wrap; word-break: break-word;
        }
        .bl__itemnote--missing { color: var(--text-slate-400); font-style: italic; }

        .bl__empty { padding: 40px 20px; text-align: center; }
        .bl__empty-icon { font-size: 24px; color: var(--border-slate-200); }
        .bl__empty-title { margin: 10px 0 3px; font-size: 13.5px; font-weight: 600; color: var(--text-slate-700); }
        .bl__empty-desc { margin: 0; font-size: 12px; color: var(--text-slate-400); }

        .bl__foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0;
          padding: 12px 18px; border-top: 1px solid var(--border-slate-100); background: var(--bg-slate-50);
        }
        .bl__foothint { font-size: 11.5px; color: var(--text-slate-400); }
        .bl__footactions { display: flex; gap: 8px; }
        .bl__foot .ant-btn { height: 34px; border-radius: 8px; font-size: 12.5px; font-weight: 600; padding: 0 16px; }

        /* ── Execution progress strip ───────────────────────────────── */
        .ex-progress {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; margin-bottom: 12px; border-radius: 10px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-100);
        }
        .ex-progress__bar { flex: 1; height: 6px; border-radius: 999px; background: var(--border-slate-200); overflow: hidden; display: flex; }
        .ex-progress__bar span { display: block; height: 100%; transition: width .3s ease; }
        .ex-progress__bar .is-pass { background: #10b981; }
        .ex-progress__bar .is-fail { background: #ef4444; }
        .ex-progress__bar .is-blocked { background: #f59e0b; }
        .ex-progress__label { font-size: 12px; font-weight: 600; color: var(--text-slate-700); white-space: nowrap; font-variant-numeric: tabular-nums; }

        /* ── Case rows ──────────────────────────────────────────────── */
        .ex-list { display: flex; flex-direction: column; gap: 8px; }
        .ex-case {
          border: 1px solid var(--border-slate-200); border-radius: 10px;
          background: var(--bg-pure-white); overflow: hidden;
          transition: border-color .15s ease;
        }
        .ex-case:hover { border-color: #bfdbfe; }
        .ex-case.is-fail { border-color: rgba(239,68,68,.35); }
        .ex-case.is-blocked { border-color: rgba(245,158,11,.4); }
        .ex-case.is-pass { border-color: rgba(16,185,129,.32); }
        .ex-case__row {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px; flex-wrap: wrap;
        }
        .ex-case__id {
          flex-shrink: 0; font-size: 10.5px; font-weight: 700; letter-spacing: .02em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          padding: 2px 7px; border-radius: 5px;
          background: rgba(59,130,246,.1); color: #2563eb;
        }
        .ex-case__body { flex: 1; min-width: 180px; cursor: pointer; border-radius: 6px; outline: none; }
        .ex-case__body:hover .ex-case__name { color: #2563eb; }
        .ex-case__body:focus-visible { box-shadow: 0 0 0 2px rgba(59,130,246,.35); }
        .ex-case__name { font-size: 13px; font-weight: 600; color: var(--text-slate-900); line-height: 1.4; }
        .ex-case__meta { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 4px; }
        .ex-chip {
          font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
          background: var(--bg-slate-50); border: 1px solid var(--border-slate-200); color: var(--text-slate-500);
        }
        .ex-chip--warn { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.3); color: #dc2626; }
        .ex-chip--bug {
          display: inline-flex; align-items: center; gap: 4px;
          background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.3); color: #475569;
        }
        .ex-chip--note {
          display: inline-flex; align-items: center; gap: 4px;
          background: var(--bg-blue-50); border-color: #bfdbfe; color: #2563eb;
        }

        .ex-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .ex-btn {
          display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
          height: 28px; padding: 0 10px; border-radius: 7px;
          font-size: 11.5px; font-weight: 600;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-600); transition: all .15s ease;
        }
        .ex-btn:hover { border-color: var(--text-slate-300); color: var(--text-slate-900); }
        .ex-btn.is-on--pass { background: rgba(16,185,129,.12); border-color: #10b981; color: #047857; }
        .ex-btn.is-on--fail { background: rgba(239,68,68,.1); border-color: #ef4444; color: #dc2626; }
        .ex-btn.is-on--blocked { background: rgba(245,158,11,.12); border-color: #f59e0b; color: #b45309; }
        .ex-btn--reset { width: 28px; padding: 0; justify-content: center; color: var(--text-slate-400); }
        .ex-btn:disabled { opacity: .45; cursor: not-allowed; }

        .ex-btn--details { color: var(--text-slate-500); }
        .ex-btn--details.is-open { background: var(--bg-blue-50); border-color: #bfdbfe; color: #2563eb; }
        .ex-caret { font-size: 9px; transition: transform .18s ease; }
        .ex-btn--details.is-open .ex-caret { transform: rotate(180deg); }
        .ex-divider { width: 1px; height: 18px; background: var(--border-slate-200); margin: 0 2px; }

        /* ── Case details panel ─────────────────────────────────────── */
        .ex-details {
          padding: 12px 14px 14px;
          border-top: 1px dashed var(--border-slate-200);
          background: var(--bg-slate-50);
        }
        .ex-details__facts {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
          background: var(--border-slate-100); border: 1px solid var(--border-slate-100);
          border-radius: 9px; overflow: hidden; margin-bottom: 14px;
        }
        @media (max-width: 700px) { .ex-details__facts { grid-template-columns: repeat(2, 1fr); } }
        .ex-fact { display: flex; flex-direction: column; gap: 3px; padding: 8px 10px; background: var(--bg-pure-white); }
        .ex-fact__key { font-size: 9.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-slate-400); }
        .ex-fact__val { font-size: 12px; font-weight: 600; color: var(--text-slate-700); }

        .ex-sec { margin-bottom: 14px; }
        .ex-sec__title {
          display: flex; align-items: center; gap: 8px; margin: 0 0 6px;
          font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
          color: var(--text-slate-500);
        }
        .ex-rule { flex: 1; min-width: 16px; border-top: 1px dashed var(--border-slate-200); }
        .ex-count {
          min-width: 17px; padding: 0 6px; border-radius: 999px; letter-spacing: 0;
          font-size: 9.5px; font-weight: 700; text-align: center;
          background: var(--bg-pure-white); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-200);
        }
        .ex-text { margin: 0; font-size: 12.5px; line-height: 1.55; color: var(--text-slate-700); white-space: pre-wrap; }
        .ex-empty { margin: 0; font-size: 12px; color: var(--text-slate-400); font-style: italic; }
        .ex-steps { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 5px; }
        .ex-steps li {
          display: flex; align-items: flex-start; gap: 9px;
          padding: 7px 10px; border-radius: 8px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-100);
          font-size: 12.5px; line-height: 1.5; color: var(--text-slate-700);
        }
        .ex-step-n {
          flex-shrink: 0; width: 17px; height: 17px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 9.5px; font-weight: 700; margin-top: 1px;
          background: rgba(59,130,246,.12); color: #2563eb;
        }
        .ex-expected {
          margin: 0; padding: 9px 11px; border-radius: 8px;
          font-size: 12.5px; line-height: 1.55; white-space: pre-wrap;
          background: rgba(16,185,129,.07); border: 1px solid rgba(16,185,129,.22); color: #065f46;
        }

        /* ── "What happened" note ───────────────────────────────────── */
        .ex-note {
          padding: 11px 12px 12px;
          border-top: 1px dashed var(--border-slate-200);
          background: var(--bg-slate-50);
        }
        .ex-note__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
        .ex-note__label {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
          color: var(--text-slate-500);
        }
        .ex-note__req { color: #dc2626; font-weight: 700; }
        .ex-note__mini {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 7px;
          color: #2563eb; background: var(--bg-pure-white);
          border: 1px solid #bfdbfe; cursor: pointer; transition: all .15s ease;
        }
        .ex-note__mini:hover:not(:disabled) { background: var(--bg-blue-50); }
        .ex-note__mini:disabled { opacity: .5; cursor: not-allowed; }
        .ex-note textarea.ant-input { border-radius: 8px !important; font-size: 12.5px; background: var(--bg-pure-white); }
        .ex-note__foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 6px; }
        .ex-note__hint { font-size: 11px; color: var(--text-slate-400); }
        .ex-note__saving { font-size: 11px; color: #2563eb; font-weight: 600; }
        /* ── Attachments on a failure note ──────────────────────────── */
        .ex-att { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border-slate-200); }
        .ex-att__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .ex-att__count {
          min-width: 17px; padding: 0 6px; border-radius: 999px; letter-spacing: 0;
          font-size: 10px; font-weight: 700; text-align: center;
          background: var(--bg-pure-white); color: var(--text-slate-500);
          border: 1px solid var(--border-slate-200);
        }
        .ex-att__list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .ex-att__chip {
          display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
          padding: 3px 5px 3px 9px; border-radius: 999px;
          font-size: 11.5px; font-weight: 600;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          color: var(--text-slate-600);
        }
        .ex-att__chip--file { border-color: rgba(59,130,246,.3); color: #2563eb; background: rgba(59,130,246,.06); }
        .ex-att__chip--link { border-color: rgba(100,116,139,.3); }
        .ex-att__chip a {
          color: inherit; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ex-att__chip a:hover { text-decoration: underline; }
        .ex-att__chip button {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 16px; height: 16px; border-radius: 999px; font-size: 9px;
          color: inherit; background: none; border: none; cursor: pointer; opacity: .6;
          transition: all .15s ease;
        }
        .ex-att__chip button:hover { opacity: 1; color: #dc2626; background: rgba(239,68,68,.12); }

        .ex-att__panel {
          margin-top: 9px; padding: 10px; border-radius: 9px;
          background: var(--bg-pure-white); border: 1px dashed var(--border-slate-200);
          display: flex; flex-direction: column; gap: 8px;
        }
        .ex-att__row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ex-att__file { display: none; }
        .ex-att__upload {
          display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
          height: 32px; padding: 0 12px; border-radius: 8px;
          font-size: 12px; font-weight: 600; color: #2563eb;
          background: var(--bg-blue-50); border: 1px dashed #bfdbfe;
          transition: all .15s ease;
        }
        .ex-att__upload:hover { background: rgba(59,130,246,.14); }
        .ex-att__or { font-size: 11.5px; color: var(--text-slate-400); }
        .ex-att__url { flex: 1; min-width: 200px; }
        .ex-att__name { width: 170px; flex-shrink: 0; }
        .ex-att__panel .ant-input { height: 32px; border-radius: 8px; font-size: 12.5px; }
        .ex-att__panel .ant-btn { height: 32px; border-radius: 8px; font-size: 12px; font-weight: 600; flex-shrink: 0; }

        .spin { animation: ex-spin 1s linear infinite; }
        @keyframes ex-spin { to { transform: rotate(360deg); } }

        .ex-topactions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ex-topactions .ant-btn { height: 32px; border-radius: 8px; }

        /* ── Add Case drawer ────────────────────────────────────────── */
        .ac { display: flex; flex-direction: column; height: 100%; background: var(--bg-pure-white); }
        .ac__head {
          display: flex; align-items: flex-start; gap: 10px; flex-shrink: 0;
          padding: 12px 16px; border-bottom: 1px solid var(--border-slate-100);
        }
        .ac__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 32px; height: 32px; border-radius: 9px; font-size: 14px;
          background: rgba(59,130,246,.1); color: #3B82F6; border: 1px solid rgba(59,130,246,.18);
        }
        .ac__headtext { flex: 1; min-width: 0; }
        .ac__title { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -.01em; }
        .ac__sub { display: block; margin-top: 2px; font-size: 11.5px; line-height: 1.45; color: var(--text-slate-500); }
        .ac__sub strong { color: var(--text-slate-700); font-weight: 650; }
        .ac__close {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 28px; height: 28px; border-radius: 8px; font-size: 12px;
          color: var(--text-slate-400); background: none; border: none; cursor: pointer;
          transition: all .15s ease;
        }
        .ac__close:hover { color: var(--text-slate-900); background: var(--bg-slate-50); }

        /* Create with Zai panel, matching the module case drawer */
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

        .ac__foot {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0;
          padding: 10px 16px; border-top: 1px solid var(--border-slate-100); background: var(--bg-slate-50);
        }
        .ac__foothint { font-size: 11px; color: var(--text-slate-400); }
        .ac__footactions { display: flex; gap: 8px; }
        .ac__foot .ant-btn { height: 32px; border-radius: 8px; font-size: 12.5px; font-weight: 600; padding: 0 14px; }

        .sc-empty { padding: 44px 24px; text-align: center; }
        .sc-empty__icon { font-size: 26px; color: var(--border-slate-200); display: inline-block; }
        .sc-empty__title { margin: 12px 0 4px; font-size: 14px; font-weight: 600; color: var(--text-slate-700); }
        .sc-empty__desc { margin: 0 auto 14px; max-width: 340px; font-size: 12.5px; color: var(--text-slate-400); }
      `}} />

      <div className="dh-shell">
        <aside className="dh-sidebar">
          <div className="dh-sidebar-top">
            <div className="pp-side-head">
              <div className="pp-side-logo"><PlayCircle size={16} /></div>
              <div>
                <h1 className="pp-side-title">Runs</h1>
                <p className="pp-side-subtitle">QA Space</p>
              </div>
            </div>
          </div>

          <div className="dh-sidebar-scroll">
            <span className="pp-nav-caption">Workspace</span>
            <button className="pp-nav-item" onClick={() => router.push('/qa-workspace/test-runs')}>
              <PlayCircle size={15} className="pp-nav-icon" />
              <span className="pp-nav-label">All Runs</span>
            </button>
            <button className="pp-nav-item is-active">
              <FileTextOutlined className="pp-nav-icon" />
              <span className="pp-nav-label">Execution</span>
              {counts.total > 0 && <span className="pp-nav-count">{counts.total}</span>}
            </button>

            <span className="pp-nav-caption" style={{ marginTop: 18 }}>Run</span>
            <div className="cd-side">
              <div className="cd-side__title">{run?.run_name || "Loading run…"}</div>
              <dl className="cd-meta">
                <div className="cd-meta__row">
                  <dt>Suite</dt>
                  <dd title={run?.suite_name}>{run?.suite_name || "—"}</dd>
                </div>
                <div className="cd-meta__row">
                  <dt>Started</dt>
                  <dd>{run?.started_at ? dayjs(run.started_at).format("D MMM, HH:mm") : "—"}</dd>
                </div>
                <div className="cd-meta__row">
                  <dt>Executed</dt>
                  <dd>{executed} / {counts.total}</dd>
                </div>
              </dl>
            </div>
          </div>
        </aside>

        <main className="dh-main">
          {/* Back · breadcrumb · run name */}
          <div className="dh-main-topbar">
            <div className="sc-topbar__title">
              <Button
                type="text"
                size="small"
                icon={<ArrowLeftOutlined />}
                onClick={() => router.push("/qa-workspace/test-runs")}
              />
              <span className="sc-topbar__div" />
              <span className="cd-crumb">Runs</span>
              {run?.suite_name && (
                <>
                  <span className="cd-sep">›</span>
                  <span className="cd-crumb cd-crumb--strong" title={run.suite_name}>{run.suite_name}</span>
                </>
              )}
              <span className="cd-sep">›</span>
              <h1 className="sc-topbar__h1 cd-title">{run?.run_name || "Loading run…"}</h1>
            </div>

            <div className="ex-topactions">
              <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAddCase}>
                Add Case
              </Button>
            </div>
          </div>

          <div className="dh-main-scroll" ref={scrollRef}>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <StatTile label="Total Cases" value={counts.total} icon={FileTextOutlined} color="#3B82F6" bgColor="rgba(59,130,246,0.1)" sub={`${counts.total - executed} not executed`} />
              <StatTile label="Passed" value={counts.pass} icon={CheckCircleOutlined} color="#10b981" bgColor="rgba(16,185,129,0.1)" sub={`${counts.total ? Math.round((counts.pass / counts.total) * 100) : 0}% of the run`} />
              <StatTile label="Failed" value={counts.fail} icon={CloseCircleOutlined} color="#ef4444" bgColor="rgba(239,68,68,0.1)" sub="need a defect note" />
              <StatTile label="Blocked" value={counts.blocked} icon={StopOutlined} color="#64748b" bgColor="rgba(100,116,139,0.1)" sub="could not be executed" />
            </div>

            {/* Progress */}
            <div className="ex-progress">
              <div className="ex-progress__bar">
                <span className="is-pass" style={{ width: `${counts.total ? (counts.pass / counts.total) * 100 : 0}%` }} />
                <span className="is-fail" style={{ width: `${counts.total ? (counts.fail / counts.total) * 100 : 0}%` }} />
                <span className="is-blocked" style={{ width: `${counts.total ? (counts.blocked / counts.total) * 100 : 0}%` }} />
              </div>
              <span className="ex-progress__label">{percent}% executed · {executed}/{counts.total}</span>
            </div>

            {/* Search, result filter and the two most-used shortcuts — one row */}
            <div className="ex-searchrow">
              <Input
                className="ex-search"
                placeholder="Search by case name, ID, type or note…"
                prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
              />

              <SearchableDropdown
                options={[
                  { value: "pending", label: "Not executed" },
                  { value: "Pass", label: "Passed" },
                  { value: "Fail", label: "Failed" },
                  { value: "Blocked", label: "Blocked" },
                ]}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v)}
                placeholder="All results"
                hideAvatar
                itemNoun="results"
                className="ex-filters__field"
              />

              {[
                { key: "Pass", label: "Passed", count: counts.pass, tone: "pass" },
                { key: "Fail", label: "Failed", count: counts.fail, tone: "fail" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === tab.key ? undefined : tab.key)}
                  className={`ex-tab ex-tab--${tab.tone}${statusFilter === tab.key ? " is-active" : ""}`}
                >
                  <span className="ex-tab__dot" />
                  <span>{tab.label}</span>
                  <span className="ex-tab__count">{tab.count}</span>
                </button>
              ))}

              <Tooltip title={anyOpen ? "Hide every case's details" : "Show every case's details on this page"}>
                <button
                  type="button"
                  className={`ex-tab ex-tab--toggle${anyOpen ? " is-open" : ""}`}
                  onClick={toggleAllDetails}
                  disabled={results.length === 0}
                  aria-expanded={anyOpen}
                >
                  <DownOutlined className="ex-caret" />
                  <span>{anyOpen ? "Collapse all" : "Expand all"}</span>
                </button>
              </Tooltip>

              <span className="sc-count">
                {loading ? "Loading…" : <>Showing <strong>{results.length}</strong> of {isFiltered ? `${totalMatching} matching` : counts.total}</>}
              </span>

              <Tooltip
                title={
                  counts.fail === 0
                    ? "No failed cases to log yet"
                    : counts.failUnfiled === 0
                      ? "Every failed case is already in the bug list"
                      : `${counts.failUnfiled} failed case${counts.failUnfiled === 1 ? "" : "s"} not filed yet`
                }
              >
                <Button
                  icon={<BugOutlined />}
                  onClick={openBugModal}
                  disabled={counts.fail === 0}
                  className="ex-buglist-btn"
                >
                  Add to Buglist
                  {counts.failUnfiled > 0 && <span className="ex-buglist-btn__n">{counts.failUnfiled}</span>}
                </Button>
              </Tooltip>
            </div>

            {/* Cases */}
            {loading ? (
              <div className="sc-empty"><p className="sc-empty__desc">Loading cases…</p></div>
            ) : results.length === 0 ? (
              <div className="sc-empty">
                <FileTextOutlined className="sc-empty__icon" />
                <p className="sc-empty__title">
                  {counts.total === 0 ? "This run has no cases" : "No cases match these filters"}
                </p>
                <p className="sc-empty__desc">
                  {counts.total === 0
                    ? "The suite had no linked cases when this run was created."
                    : "Try a different search or result filter."}
                </p>
                {counts.total > 0 && (
                  <Button size="small" onClick={() => { setSearchTerm(""); setStatusFilter(undefined); }}>Clear filters</Button>
                )}
              </div>
            ) : (
              <div className="ex-list">
                {results.map((result) => {
                  const tone = STATUS_TONE[result.status] || "";
                  const needsNote = NEEDS_NOTE.includes(result.status);
                  const draft = noteDrafts[result.id] ?? "";
                  const isSaving = savingId === result.id;
                  const isOpen = !!openDetails[result.id];
                  return (
                    <div key={result.id} className={`ex-case${tone ? ` is-${result.status.toLowerCase()}` : ""}`}>
                      <div className="ex-case__row">
                        <span className="ex-case__id">{result.tc_ref_id || "TC"}</span>
                        {/* The whole title block acts as the accordion header */}
                        <div
                          className="ex-case__body"
                          role="button"
                          tabIndex={0}
                          aria-expanded={isOpen}
                          onClick={() => toggleDetails(result.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleDetails(result.id); }
                          }}
                        >
                          <div className="ex-case__name">{result.name || "Unnamed case"}</div>
                          <div className="ex-case__meta">
                            {result.priority && <span className="ex-chip">{result.priority}</span>}
                            {result.test_type && <span className="ex-chip">{result.test_type}</span>}
                            <span className="ex-chip">{result.status || "Not Executed"}</span>
                            {/* Already in the bug list — it won't be filed twice */}
                            {isBugLogged(result) && (
                              <span className="ex-chip ex-chip--bug">
                                <BugOutlined /> {result.bug_number || "Filed"}
                              </span>
                            )}
                            {/* The note and its evidence live behind Details — say so here */}
                            {needsNote && !draft.trim() && (
                              <span className="ex-chip ex-chip--warn">Needs a note</span>
                            )}
                            {needsNote && !!draft.trim() && !isOpen && (
                              <span className="ex-chip ex-chip--note">
                                <SnippetsOutlined /> Note
                              </span>
                            )}
                            {(result.attachments?.length || 0) > 0 && !isOpen && (
                              <span className="ex-chip ex-chip--note">
                                <PaperClipOutlined /> {result.attachments.length}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="ex-actions">
                          <button
                            className={`ex-btn ex-btn--details${isOpen ? " is-open" : ""}`}
                            onClick={() => toggleDetails(result.id)}
                            aria-expanded={isOpen}
                          >
                            <DownOutlined className="ex-caret" /> Details
                          </button>
                          <span className="ex-divider" />
                          <button
                            className={`ex-btn${result.status === "Pass" ? " is-on--pass" : ""}`}
                            onClick={() => handleStatus(result, "Pass")}
                            disabled={isSaving}
                          >
                            <CheckCircleOutlined /> Pass
                          </button>
                          <button
                            className={`ex-btn${result.status === "Fail" ? " is-on--fail" : ""}`}
                            onClick={() => handleStatus(result, "Fail")}
                            disabled={isSaving}
                          >
                            <CloseCircleOutlined /> Fail
                          </button>
                          <button
                            className={`ex-btn${result.status === "Blocked" ? " is-on--blocked" : ""}`}
                            onClick={() => handleStatus(result, "Blocked")}
                            disabled={isSaving}
                          >
                            <StopOutlined /> Blocked
                          </button>
                          <Tooltip title="Reset to not executed">
                            <button
                              className="ex-btn ex-btn--reset"
                              onClick={() => saveResult(result.id, { status: "Not Executed" })}
                              disabled={isSaving || !result.status || result.status === "Not Executed"}
                              aria-label="Reset"
                            >
                              <MinusCircleOutlined />
                            </button>
                          </Tooltip>
                        </div>
                      </div>

                      {/* What the tester needs to know to run this case */}
                      {isOpen && (
                        <div className="ex-details">
                          <div className="ex-details__facts">
                            <div className="ex-fact">
                              <span className="ex-fact__key">Priority</span>
                              <span className="ex-fact__val">{result.priority || "—"}</span>
                            </div>
                            <div className="ex-fact">
                              <span className="ex-fact__key">Severity</span>
                              <span className="ex-fact__val">{result.severity || "—"}</span>
                            </div>
                            <div className="ex-fact">
                              <span className="ex-fact__key">Type</span>
                              <span className="ex-fact__val">{result.test_type || "—"}</span>
                            </div>
                            <div className="ex-fact">
                              <span className="ex-fact__key">Automation</span>
                              <span className="ex-fact__val">{result.automation || "Manual"}</span>
                            </div>
                          </div>

                          {result.description && (
                            <section className="ex-sec">
                              <h4 className="ex-sec__title"><span>Description</span><span className="ex-rule" /></h4>
                              <p className="ex-text">{result.description}</p>
                            </section>
                          )}

                          {result.preconditions && (
                            <section className="ex-sec">
                              <h4 className="ex-sec__title"><span>Preconditions</span><span className="ex-rule" /></h4>
                              <p className="ex-text">{result.preconditions}</p>
                            </section>
                          )}

                          <section className="ex-sec">
                            <h4 className="ex-sec__title">
                              <span>Steps to Reproduce</span>
                              {parseSteps(result.steps_to_reproduce).length > 0 && (
                                <span className="ex-count">{parseSteps(result.steps_to_reproduce).length}</span>
                              )}
                              <span className="ex-rule" />
                            </h4>
                            {parseSteps(result.steps_to_reproduce).length === 0 ? (
                              <p className="ex-empty">No steps recorded on this case.</p>
                            ) : (
                              <ol className="ex-steps">
                                {parseSteps(result.steps_to_reproduce).map((s, i) => (
                                  <li key={i}><span className="ex-step-n">{i + 1}</span><span>{s}</span></li>
                                ))}
                              </ol>
                            )}
                          </section>

                          <section className="ex-sec" style={{ marginBottom: 0 }}>
                            <h4 className="ex-sec__title"><span>Expected Result</span><span className="ex-rule" /></h4>
                            {result.expected_result
                              ? <p className="ex-expected">{result.expected_result}</p>
                              : <p className="ex-empty">Not recorded.</p>}
                          </section>
                        </div>
                      )}

                      {/* Fail and Blocked need an explanation — inside the accordion */}
                      {isOpen && needsNote && (
                        <div className="ex-note">
                          <div className="ex-note__head">
                            <span className="ex-note__label">
                              What happened
                              {!draft.trim() && <span className="ex-note__req">*</span>}
                            </span>
                            <Tooltip title={!draft.trim() ? "Write something first" : "Fix grammar & typos — keeps your wording"}>
                              <button
                                type="button"
                                className="ex-note__mini"
                                disabled={!draft.trim() || polishingId === result.id}
                                onClick={() => polishNote(result)}
                              >
                                {polishingId === result.id
                                  ? <><Loader2 size={11} className="spin" /> Polishing…</>
                                  : <><SpellCheck size={11} /> Grammar</>}
                              </button>
                            </Tooltip>
                          </div>

                          <TextArea
                            autoSize={{ minRows: 2 }}
                            placeholder={result.status === "Blocked"
                              ? "What blocked this case? Note the dependency, environment or data that wasn't ready."
                              : "What went wrong? Note the steps, the expected vs actual result and any error message."}
                            value={draft}
                            onChange={(e) => setNoteDrafts(prev => ({ ...prev, [result.id]: e.target.value }))}
                            onBlur={() => commitNote(result)}
                            onPaste={(e) => handleNotePaste(result, e)}
                          />

                          <div className="ex-note__foot">
                            <span className="ex-note__hint">
                              Saved automatically when you click away. Paste a screenshot straight into the box above.
                            </span>
                            {isSaving && <span className="ex-note__saving">Saving…</span>}
                          </div>

                          {/* Evidence */}
                          <div className="ex-att">
                            <div className="ex-att__head">
                              <span className="ex-note__label">
                                <PaperClipOutlined /> Attachments
                                {(result.attachments?.length || 0) > 0 && (
                                  <span className="ex-att__count">{result.attachments.length}</span>
                                )}
                              </span>
                              <button
                                type="button"
                                className="ex-note__mini"
                                onClick={() => setAttachOpen(prev => ({ ...prev, [result.id]: !prev[result.id] }))}
                              >
                                <PlusOutlined /> {attachOpen[result.id] ? "Close" : "Add attachment"}
                              </button>
                            </div>

                            {(result.attachments?.length || 0) > 0 && (
                              <div className="ex-att__list">
                                {result.attachments.map((att: any) => (
                                  <span key={att.id} className={`ex-att__chip ex-att__chip--${att.kind}`}>
                                    {att.kind === "link" ? <LinkOutlined /> : <PaperClipOutlined />}
                                    <a href={att.url} target="_blank" rel="noreferrer" title={att.url}>{att.name}</a>
                                    <button
                                      type="button"
                                      onClick={() => removeAttachment(result, att.id)}
                                      aria-label={`Remove ${att.name}`}
                                    >
                                      <CloseOutlined />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}

                            {attachOpen[result.id] && (
                              <div className="ex-att__panel">
                                <div className="ex-att__row">
                                  <input
                                    type="file"
                                    id={`att-file-${result.id}`}
                                    className="ex-att__file"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) uploadAttachment(result, file);
                                      e.target.value = "";
                                    }}
                                  />
                                  <label htmlFor={`att-file-${result.id}`} className="ex-att__upload">
                                    {uploadingId === result.id
                                      ? <><Loader2 size={12} className="spin" /> Uploading…</>
                                      : <><UploadOutlined /> Choose a file</>}
                                  </label>
                                  <span className="ex-att__or">or paste an image with ⌘V</span>
                                </div>

                                <div className="ex-att__row">
                                  <Input
                                    placeholder="Paste a link (https://…)"
                                    value={linkDrafts[result.id]?.url || ""}
                                    onChange={(e) => setLinkDrafts(prev => ({
                                      ...prev, [result.id]: { ...(prev[result.id] || { name: "" }), url: e.target.value },
                                    }))}
                                    className="ex-att__url"
                                  />
                                  <Input
                                    placeholder="Name (optional)"
                                    value={linkDrafts[result.id]?.name || ""}
                                    onChange={(e) => setLinkDrafts(prev => ({
                                      ...prev, [result.id]: { ...(prev[result.id] || { url: "" }), name: e.target.value },
                                    }))}
                                    onPressEnter={() => addLinkAttachment(result)}
                                    className="ex-att__name"
                                  />
                                  <Button
                                    onClick={() => addLinkAttachment(result)}
                                    disabled={!(linkDrafts[result.id]?.url || "").trim()}
                                  >
                                    Add link
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pinned to the bottom of the run — never scrolls with the cases */}
          {totalMatching > 0 && (
            <div className="ex-pagebar">
              <span className="ex-pagebar__info">
                Page <strong>{page}</strong> of {Math.max(1, Math.ceil(totalMatching / PAGE_SIZE))}
                <span className="ex-pagebar__dot" />
                {totalMatching} {isFiltered ? "matching" : ""} case{totalMatching === 1 ? "" : "s"}
              </span>
              <Pagination
                current={page}
                pageSize={PAGE_SIZE}
                total={totalMatching}
                onChange={(p) => {
                  setPage(p);
                  scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                }}
                showSizeChanger={false}
                size="small"
                hideOnSinglePage={false}
              />
            </div>
          )}
        </main>
      </div>

      {/* Log failed cases into a bug sheet */}
      <Modal
        open={bugOpen}
        onCancel={() => setBugOpen(false)}
        footer={null}
        closable={false}
        width={920}
        destroyOnHidden
        centered
        styles={{
          content: { padding: 0, borderRadius: 14, overflow: "hidden" },
          body: { padding: 0 },
          mask: { backdropFilter: "blur(3px)", background: "rgba(15,23,42,0.45)" },
        }}
      >
        <div className="bl">
          <div className="bl__head">
            <span className="bl__icon"><BugOutlined /></span>
            <div className="bl__headtext">
              <h3 className="bl__title">Add failed cases to a bug list</h3>
              <span className="bl__sub">
                Each selected case becomes a bug — its name is the title and its
                &ldquo;What happened&rdquo; note becomes the description.
              </span>
            </div>
            <button className="bl__close" onClick={() => setBugOpen(false)} aria-label="Close"><CloseOutlined /></button>
          </div>

          {/* Without a project the bug list can't surface these bugs */}
          {!run?.project_id && (
            <div className="bl__warn">
              <span className="bl__warn-title">This run isn&apos;t linked to a project</span>
              <span className="bl__warn-desc">
                Bugs filed here may not appear in a project-scoped bug list. Set a
                Project on the test case to fix this for future runs.
              </span>
            </div>
          )}

          {/* Destination — folders and sheets can be created right here */}
          <div className="bl__dest">
            <div className="bl__destfield">
              <div className="bl__labelrow">
                <label className="bl__label">Folder</label>
                <button
                  type="button"
                  className="bl__new"
                  onClick={() => { setNewFolderOpen(o => !o); setNewFolderName(""); }}
                >
                  <PlusOutlined /> {newFolderOpen ? "Cancel" : "New folder"}
                </button>
              </div>
              {newFolderOpen ? (
                <div className="bl__newrow">
                  <Input
                    autoFocus
                    placeholder="Folder name…"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onPressEnter={createFolderInline}
                  />
                  <Button
                    type="primary"
                    loading={creatingFolder}
                    disabled={!newFolderName.trim()}
                    onClick={createFolderInline}
                  >
                    Create
                  </Button>
                </div>
              ) : (
                <SearchableDropdown
                  options={folders.map((f: any) => ({ value: f.id, label: f.name }))}
                  value={bugFolderId}
                  onChange={(v) => { setBugFolderId(v); setBugSheetId(undefined); }}
                  placeholder={folders.length ? "Select a folder" : "No folders yet — create one"}
                  itemNoun="folders"
                />
              )}
            </div>

            <div className="bl__destfield">
              <div className="bl__labelrow">
                <label className="bl__label">Sheet</label>
                <button
                  type="button"
                  className="bl__new"
                  disabled={!bugFolderId}
                  onClick={() => { setNewSheetOpen(o => !o); setNewSheetName(""); }}
                >
                  <PlusOutlined /> {newSheetOpen ? "Cancel" : "New sheet"}
                </button>
              </div>
              {newSheetOpen ? (
                <div className="bl__newrow">
                  <Input
                    autoFocus
                    placeholder="Sheet name…"
                    value={newSheetName}
                    onChange={(e) => setNewSheetName(e.target.value)}
                    onPressEnter={createSheetInline}
                  />
                  <Button
                    type="primary"
                    loading={creatingSheet}
                    disabled={!newSheetName.trim()}
                    onClick={createSheetInline}
                  >
                    Create
                  </Button>
                </div>
              ) : (
                <SearchableDropdown
                  options={sheets.map((s: any) => ({ value: s.id, label: s.name }))}
                  value={bugSheetId}
                  onChange={(v) => setBugSheetId(v)}
                  placeholder={!bugFolderId ? "Pick a folder first" : sheets.length ? "Select a sheet" : "No sheets yet — create one"}
                  disabled={!bugFolderId}
                  itemNoun="sheets"
                />
              )}
            </div>

            <div className="bl__destsummary">
              <span className="bl__destcount">{selectedBugIds.length}</span>
              <span className="bl__destlabel">
                of {selectableBugCases.length} unfiled selected
                {failedCases.length - selectableBugCases.length > 0 && (
                  <> · {failedCases.length - selectableBugCases.length} already filed</>
                )}
              </span>
            </div>
          </div>

          {/* Failed cases */}
          <div className="bl__body">
            <div className="bl__toolbar">
              <span className="bl__toolbarlabel">Failed cases in this run</span>
              <div className="bl__toolbaractions">
                <button
                  type="button"
                  className="bl__link"
                  onClick={() => setSelectedBugIds(selectableBugCases.map((c: any) => c.id))}
                  disabled={selectableBugCases.length === 0 || selectedBugIds.length === selectableBugCases.length}
                >
                  Select all
                </button>
                <span className="bl__dot" />
                <button
                  type="button"
                  className="bl__link"
                  onClick={() => setSelectedBugIds([])}
                  disabled={selectedBugIds.length === 0}
                >
                  Clear
                </button>
              </div>
            </div>

            {failedLoading ? (
              <div className="bl__empty">
                <Loader2 size={20} className="spin" style={{ color: "var(--text-slate-400)" }} />
                <p className="bl__empty-title">Loading failed cases…</p>
                <p className="bl__empty-desc">Collecting every failure in this run, not just this page.</p>
              </div>
            ) : failedCases.length === 0 ? (
              <div className="bl__empty">
                <BugOutlined className="bl__empty-icon" />
                <p className="bl__empty-title">No failed cases yet</p>
                <p className="bl__empty-desc">Mark a case as Failed and it will show up here.</p>
              </div>
            ) : (
              <div className="bl__list">
                {failedCases.map((c: any) => {
                  const alreadyLogged = isBugLogged(c);
                  const checked = selectedBugIds.includes(c.id);
                  const note = (c.notes || "").trim();
                  return (
                    <label key={c.id} className={`bl__item${checked ? " is-on" : ""}${alreadyLogged ? " is-done" : ""}`}>
                      <Checkbox
                        checked={checked}
                        disabled={alreadyLogged}
                        onChange={(e) => setSelectedBugIds(prev =>
                          e.target.checked ? [...prev, c.id] : prev.filter(id => id !== c.id)
                        )}
                      />
                      <div className="bl__itembody">
                        <div className="bl__itemtop">
                          <code className="bl__itemid">{c.tc_ref_id || "TC"}</code>
                          <span className="bl__itemname">{c.name}</span>
                          {alreadyLogged && (
                            <span className="bl__badge">
                              <BugOutlined /> {c.bug_number ? `Filed as ${c.bug_number}` : "Already filed"}
                            </span>
                          )}
                        </div>
                        <div className="bl__itemmeta">
                          {c.severity && <span className="bl__chip">{c.severity}</span>}
                          {c.priority && <span className="bl__chip">{c.priority}</span>}
                          {c.test_type && <span className="bl__chip">{c.test_type}</span>}
                        </div>
                        {note
                          ? <p className="bl__itemnote">{note}</p>
                          : <p className="bl__itemnote bl__itemnote--missing">No &ldquo;What happened&rdquo; note — the bug will use the expected result instead.</p>}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bl__foot">
            <span className="bl__foothint">
              {!bugSheetId ? "Choose a folder and sheet to file these under." : "Bugs are created in the selected sheet."}
            </span>
            <div className="bl__footactions">
              <Button onClick={() => setBugOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                icon={<BugOutlined />}
                loading={bugSaving}
                disabled={!bugSheetId || selectedBugIds.length === 0}
                onClick={submitBugs}
              >
                Add {selectedBugIds.length || ""} to bug list
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Add a case discovered mid-run — same drawer as New Module Test Case */}
      <Drawer
        {...commonDrawerProps}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        width={720}
      >
        <style>{formStyles}</style>
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-primary, #ffffff)" }}>
          {/* Drawer Header */}
          <div className="ac__head">
            <span className="ac__icon"><BugOutlined /></span>
            <div className="ac__headtext">
              <h3 className="ac__title">New Module Test Case</h3>
              <span className="ac__sub">
                Created under this run&apos;s scenario, linked to <strong>{run?.suite_name || "the suite"}</strong>, and added to this run
              </span>
            </div>
            <button className="ac__close" onClick={() => setAddOpen(false)} aria-label="Close"><CloseOutlined /></button>
          </div>

          {/* Drawer Body */}
          <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto" }}>
            {/* Describe the case in plain language and let Zai draft it */}
            <div className="zai-draft">
              <div className="zai-draft__head">
                <span className="zai-draft__icon"><Sparkles size={14} /></span>
                <div style={{ minWidth: 0 }}>
                  <div className="zai-draft__title">Create with Zai</div>
                  <div className="zai-draft__sub">Describe the defect — Zai fills in the name, steps and expected result.</div>
                </div>
                {zaiOpen && (
                  <button type="button" className="zai-draft__toggle" onClick={() => setZaiOpen(false)}>Hide</button>
                )}
              </div>

              {zaiOpen ? (
                <>
                  <TextArea
                    rows={2}
                    placeholder="e.g. error message not shown when email format is invalid"
                    value={zaiPrompt}
                    onChange={(e) => setZaiPrompt(e.target.value)}
                    onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleZaiGenerate(); } }}
                    className="zai-draft__input"
                  />
                  <div className="zai-draft__row">
                    <div className="zai-draft__chips">
                      {[
                        'validation message missing on invalid input',
                        'page crashes when the list is empty',
                        'session expires without warning',
                      ].map(s => (
                        <button key={s} type="button" className="zai-draft__chip" onClick={() => setZaiPrompt(s)}>{s}</button>
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
                subtitle="Test case name, priority, severity and type"
              >
                <Form.Item label="Suite" style={{ marginTop: -10, marginBottom: 16 }}>
                  <Input
                    value={run?.suite_name || "Unassigned"}
                    disabled
                    readOnly
                    size="large"
                    style={{ borderRadius: 6, cursor: "not-allowed", backgroundColor: "#f1f5f9", color: "#475569", fontWeight: 600 }}
                  />
                </Form.Item>

                <Form.Item label="Test Case Name" required style={{ marginBottom: 16 }}>
                  <Input
                    autoFocus
                    placeholder="e.g., Verify error shown when email format is invalid"
                    value={newCase.name}
                    onChange={(e) => setNewCase({ ...newCase, name: e.target.value })}
                    size="large"
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Priority" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={priorityOptions}
                        value={newCase.priority}
                        onChange={(val: any) => setNewCase({ ...newCase, priority: val || "Medium" })}
                        placeholder="Select Priority"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Severity" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={severityOptions}
                        value={newCase.severity}
                        onChange={(val: any) => setNewCase({ ...newCase, severity: val || "Major" })}
                        placeholder="Select Severity"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Status" style={{ marginBottom: 16 }}>
                      <SearchableDropdown
                        options={["Draft", "Active", "Deprecated"].map(v => ({ value: v, label: v }))}
                        value={newCase.status}
                        onChange={(val: any) => setNewCase({ ...newCase, status: val || "Active" })}
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
                        value={newCase.test_type}
                        onChange={(val: any) => setNewCase({ ...newCase, test_type: val || "Functional" })}
                        placeholder="Select Test Type"
                        style={{ width: '100%', height: 40, padding: '6px 12px', borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Automation" style={{ marginBottom: 0 }}>
                      <SearchableDropdown
                        options={["Manual", "Automated"].map(v => ({ value: v, label: v }))}
                        value={newCase.automation}
                        onChange={(val: any) => setNewCase({ ...newCase, automation: val || "Manual" })}
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
                    placeholder="State any setup required before testing (e.g., User must be logged out)…"
                    value={newCase.preconditions}
                    onChange={(e) => setNewCase({ ...newCase, preconditions: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Form.Item label="Steps to Reproduce" style={{ marginBottom: 16 }}>
                  <div style={{ border: '1px solid var(--border-slate-300, #cbd5e1)', borderRadius: 8, padding: '12px 14px', background: 'var(--bg-pure-white, #ffffff)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {newCase.steps.map((step: string, idx: number) => (
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
                            onClick={() => setNewCase({ ...newCase, steps: newCase.steps.filter((_, i) => i !== idx) })}
                          >×</Button>
                        </div>
                      ))}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: newCase.steps.length > 0 ? 4 : 0, paddingTop: newCase.steps.length > 0 ? 8 : 0, borderTop: newCase.steps.length > 0 ? '1px dashed var(--border-slate-300, #cbd5e1)' : 'none' }}>
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                          +
                        </div>
                        <Input
                          placeholder="Type a step to reproduce and press Enter..."
                          value={stepDraft}
                          onChange={(e) => setStepDraft(e.target.value)}
                          onPressEnter={(e) => { e.preventDefault(); addStep(); }}
                          style={{ flex: 1, border: 'none', background: 'transparent', boxShadow: 'none', padding: '4px 0', fontSize: 13 }}
                          variant="borderless"
                        />
                        <Button
                          type="primary"
                          size="small"
                          style={{ borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#3b82f6' }}
                          onClick={addStep}
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
                    placeholder="Describe clearly what should happen when steps are executed…"
                    value={newCase.expected_result}
                    onChange={(e) => setNewCase({ ...newCase, expected_result: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>

                <Form.Item label="Additional Description / Notes" style={{ marginBottom: 0 }}>
                  <TextArea
                    rows={2}
                    placeholder="Optional background info, tickets, or references…"
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                    style={{ borderRadius: 6 }}
                  />
                </Form.Item>
              </SectionCard>
            </Form>
          </div>

          {/* Drawer Footer */}
          <div className="ac__foot">
            <span className="ac__foothint">Also added to the suite, so future runs include it.</span>
            <div className="ac__footactions">
              <Button onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="primary" loading={addSaving} disabled={!newCase.name.trim()} onClick={submitNewCase}>
                Add to run
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </MainLayout>
  );
}
