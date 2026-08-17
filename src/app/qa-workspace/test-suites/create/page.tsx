"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Checkbox, Tooltip, Modal, Dropdown, message } from "antd";
import {
  ArrowLeftOutlined, SearchOutlined, CloseOutlined, LoadingOutlined, FileTextOutlined,
} from "@ant-design/icons";
import {
  Check, ClipboardList, ListChecks, Save, Sparkles, SpellCheck, Wand2, Zap, Copy, ChevronDown, Filter,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { api as axios } from "@/lib/axios";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * The standard testing types, kept identical to the Test Scope page so both
 * places name the same kinds of testing. Teams also invent their own, so the
 * picker accepts free text and remembers anything already in use.
 */
const TESTING_TYPES = [
  "Smoke Testing", "Sanity Testing", "Functional Testing", "GUI Testing",
  "UI Testing", "Positive Testing", "Negative Testing", "Validation Testing",
  "Data Verification Testing", "Integration Testing", "System Testing",
  "End-to-End Testing", "Regression Testing", "Retesting", "Exploratory Testing",
  "Compatibility Testing", "Cross-Browser Testing", "User Acceptance Testing",
  "Performance Testing", "Security Testing",
];

const SECTIONS = [
  { id: "sec-suite", label: "Suite Information", icon: ClipboardList, required: true },
  { id: "sec-cases", label: "Link Module Test Cases", icon: ListChecks, required: true },
];

/** Module cases stream in a page at a time, straight off the server. */
const CASE_PAGE_SIZE = 20;

/** Starter instructions offered in the Zai drawer for the suite description. */
const ZAI_SUGGESTIONS = [
  { title: "Coverage Summary", icon: "📋", body: "Summarise what this suite covers, which user journeys it exercises, and what a passing run proves." },
  { title: "Regression Focus", icon: "🔁", body: "Describe this suite as a regression pack: what it guards against and when the team should run it before a release." },
  { title: "Risk Framing", icon: "⚠️", body: "Describe the suite with an emphasis on the riskiest areas it validates and what could break in production if it is skipped." },
  { title: "Stakeholder Brief", icon: "🤝", body: "Write a short, non-technical description a product owner can read in one pass to understand what this suite verifies." },
];

/** Nearest scrollable ancestor, or null when the window scrolls. */
function getScrollParent(node: Element | null): HTMLElement | null {
  let el = node?.parentElement ?? null;
  while (el) {
    const oy = getComputedStyle(el).overflowY;
    if ((oy === "auto" || oy === "scroll" || oy === "overlay") && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return null;
}

/** Returns the id of the section currently sitting below the sticky header. */
function useScrollSpy(ids: string[], offset: number, root: HTMLElement | null): string {
  const [active, setActive] = useState(ids[0] ?? "");
  const key = ids.join(",");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive((visible[0].target as HTMLElement).id);
      },
      { root, rootMargin: `-${Math.round(offset)}px 0px -60% 0px`, threshold: 0 }
    );
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el != null);
    els.forEach((el) => observer.observe(el));

    const handleScroll = () => {
      const scrollHeight = root ? root.scrollHeight : document.documentElement.scrollHeight;
      const clientHeight = root ? root.clientHeight : window.innerHeight;
      const scrollTop = root ? root.scrollTop : window.scrollY;
      if (Math.ceil(scrollTop + clientHeight) >= scrollHeight - 2) {
        const lastId = ids[ids.length - 1];
        if (lastId) setActive(lastId);
      }
    };

    const target: any = root ?? window;
    target.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      target.removeEventListener("scroll", handleScroll);
    };
  }, [key, offset, root]); // eslint-disable-line react-hooks/exhaustive-deps

  return active;
}

/* ── Presentational primitives, shared vocabulary with Create Test Scope ───── */

function SectionCard({
  id, icon: Icon, index, title, description, badge, action, children,
}: {
  id: string;
  icon: React.ElementType;
  index: number;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="ts-card scroll-mt-40">
      <header className="ts-card__head">
        <span className="ts-card__icon"><Icon size={16} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="ts-card__step">{String(index).padStart(2, "0")}</span>
            <h3 className="ts-card__title">{title}</h3>
            {badge}
          </div>
          {description ? <p className="ts-card__desc">{description}</p> : null}
        </div>
        {action ? <div className="flex items-center gap-2 flex-shrink-0">{action}</div> : null}
      </header>
      <div className="ts-card__body">{children}</div>
    </section>
  );
}

function Field({
  label, required, hint, error, className, children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="ts-label">
        {label}
        {required && <span className="ts-req">*</span>}
      </label>
      {children}
      {error ? <p className="ts-error">{error}</p> : hint ? <p className="ts-hint">{hint}</p> : null}
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-[68px] h-[68px] flex-shrink-0">
      <svg width="68" height="68" viewBox="0 0 68 68" className="-rotate-90">
        <circle cx="34" cy="34" r={r} fill="none" strokeWidth="5" className="ts-ring__track" />
        <circle
          cx="34" cy="34" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          className="ts-ring__bar"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[15px] font-semibold ts-text">{value}%</span>
      </div>
    </div>
  );
}

function CreateTestSuiteContent() {
  useActivitySource({ section: "WORK", module: "QA", page: "TestSuites" });

  const router = useRouter();
  const searchParams = useSearchParams();
  /** Present when the page is editing an existing suite rather than creating one. */
  const editingId = searchParams.get("id");

  const { canReadSuite, canCreateSuite, canUpdateSuite } = usePermission();

  const [formData, setFormData] = useState<any>({ test_case_ids: [], parent_test_case_id: undefined });
  const [parents, setParents] = useState<any[]>([]);
  const [suites, setSuites] = useState<any[]>([]);
  const [loadingSuite, setLoadingSuite] = useState(!!editingId);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [scopeError, setScopeError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  /* ── Page chrome: sticky height + scroll spy ────────────────────────────── */
  const stickyRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [stickyH, setStickyH] = useState(96);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const activeSection = useScrollSpy(SECTIONS.map((s) => s.id), stickyH + 8, scrollRoot);

  useEffect(() => {
    const el = stickyRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStickyH(el.offsetHeight));
    ro.observe(el);
    setStickyH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setScrollRoot(getScrollParent(rootRef.current));
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const root = scrollRoot;
    if (root) {
      const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - stickyH - 16;
      root.scrollTo({ top, behavior: "smooth" });
    } else {
      window.scrollTo({ top: el.offsetTop - stickyH - 16, behavior: "smooth" });
    }
  };

  /* ── Link Module Test Cases: server-paged list ──────────────────────────── */
  const [childTestCases, setChildTestCases] = useState<any[]>([]);
  const [caseSearchTerm, setCaseSearchTerm] = useState("");
  const [caseSearchQuery, setCaseSearchQuery] = useState("");   // debounced, hits the API
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [typeFacets, setTypeFacets] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);      // first page / new filter
  const [casesLoadingMore, setCasesLoadingMore] = useState(false);
  const [casesTotal, setCasesTotal] = useState(0);
  const [casesHasMore, setCasesHasMore] = useState(false);
  const [selectingAll, setSelectingAll] = useState(false);
  /** Guards against an older page landing after a newer query. */
  const caseReqRef = useRef(0);
  /** Offset currently being fetched, so one page is never requested twice. */
  const inFlightOffsetRef = useRef<number | null>(null);

  /* ── Zai description assistant ──────────────────────────────────────────── */
  const [aiBusy, setAiBusy] = useState<"generate" | "grammar" | null>(null);
  const [zaiOpen, setZaiOpen] = useState(false);
  const [zaiView, setZaiView] = useState<"prompt" | "preview">("prompt");
  const [zaiPrompt, setZaiPrompt] = useState("");
  const [zaiDraft, setZaiDraft] = useState("");

  // For dynamic parent test case search beyond the initial 1000
  const [parentSearchTerm, setParentSearchTerm] = useState("");
  const debouncedParentSearch = useDebounce(parentSearchTerm, 500);

  useEffect(() => {
    if (!debouncedParentSearch || debouncedParentSearch.trim().length < 2) return;
    const searchParents = async () => {
      try {
        const res = await axios.get("/api/v2/qa/parents", {
          params: { search: debouncedParentSearch, limit: 50 }
        });
        const fetched = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setParents((prev: any[]) => {
          const map = new Map(prev.map(p => [p.id, p]));
          fetched.forEach((p: any) => map.set(p.id, p));
          return Array.from(map.values());
        });
      } catch (e) {}
    };
    searchParents();
  }, [debouncedParentSearch]);

  const patch = (next: Record<string, any>) => {
    setIsDirty(true);
    setFormData((prev: any) => ({ ...prev, ...next }));
  };

  /* ── Reference data ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!canReadSuite) return;
    (async () => {
      try {
        const [parentsRes, suitesRes]: any[] = await Promise.all([
          axios.get("/api/v2/qa/parents?limit=1000"),
          axios.get("/api/v2/qa/suites/all?limit=1000"),
        ]);
        const unwrap = (r: any) => (Array.isArray(r) ? r : (r?.data?.data || r?.data || []));
        setParents(unwrap(parentsRes));
        setSuites(unwrap(suitesRes));
      } catch {
        message.error("Failed to load test scenarios");
      }
    })();
  }, [canReadSuite]);

  /* Editing — pull the suite and the cases already linked to it. */
  useEffect(() => {
    if (!editingId || !canReadSuite) return;
    (async () => {
      try {
        setLoadingSuite(true);
        const res: any = await axios.get(`/api/v2/qa/suites/${editingId}`);
        const data = res?.data || res;
        setFormData({
          ...data,
          parent_test_case_id: data?.parent_test_case_id || undefined,
          module_id: data?.module_id,
          test_case_ids: data?.test_cases?.map((tc: any) => tc.id) || [],
        });
        setIsDirty(false);
      } catch {
        message.error("Failed to load the test suite");
        router.replace("/qa-workspace/test-suites");
      } finally {
        setLoadingSuite(false);
      }
    })();
  }, [editingId, canReadSuite]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Standard types plus any custom one already saved on a suite, so a type
   * somebody invented last week is a pick this week rather than retyping it.
   */
  const testingTypeOptions = useMemo(() => {
    const standard = new Set(TESTING_TYPES.map((t) => t.toLowerCase()));
    const custom = Array.from(
      new Set(
        suites
          .map((s: any) => (s.testing_type || "").trim())
          .filter((t: string) => t && !standard.has(t.toLowerCase())),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return [
      ...custom.map((t) => ({ value: t, label: t, description: "Custom type" })),
      ...TESTING_TYPES.map((t) => ({ value: t, label: t })),
    ];
  }, [suites]);

  const hasScope = !!(formData.parent_test_case_id || formData.module_id);

  /** Query the case list is scoped to — scenario first, module as fallback. */
  const caseScopeParams = useCallback(() => {
    const params: Record<string, any> = {};
    if (formData.parent_test_case_id) params.parent_id = formData.parent_test_case_id;
    else if (formData.module_id) params.module_id = formData.module_id;
    if (caseSearchQuery) params.search = caseSearchQuery;
    if (typeFilter) params.test_type = typeFilter;
    return params;
  }, [formData.parent_test_case_id, formData.module_id, caseSearchQuery, typeFilter]);

  /**
   * One page of module cases. `offset === 0` replaces the list (new scope,
   * search or type); anything else appends, which is what scrolling asks for.
   */
  const loadCasePage = async (offset: number) => {
    if (!hasScope) {
      setChildTestCases([]);
      setCasesTotal(0);
      setCasesHasMore(false);
      return;
    }
    // Scroll fires far faster than React commits `casesLoadingMore`, so the
    // state flag alone lets two handlers request the same page. The ref flips
    // synchronously and is what actually keeps pages from doubling up. Only
    // appends are guarded — an offset of 0 means the query itself changed and
    // must always re-run, whatever is in flight.
    if (offset > 0 && inFlightOffsetRef.current === offset) return;
    inFlightOffsetRef.current = offset;

    const reqId = ++caseReqRef.current;
    if (offset === 0) setCasesLoading(true); else setCasesLoadingMore(true);

    try {
      const res: any = await axios.get("/api/v2/qa", {
        params: { ...caseScopeParams(), paginated: true, limit: CASE_PAGE_SIZE, offset },
      });
      if (reqId !== caseReqRef.current) return; // a newer request already won

      const items = res?.items || (Array.isArray(res) ? res : res?.data?.items || []);
      const total = res?.total ?? items.length;
      const hasMore = res?.hasMore ?? (offset + items.length < total);

      setChildTestCases((prev) => {
        if (offset === 0) return items;
        // A case already on screen is never appended twice, whatever the
        // server sends back for an overlapping page.
        const seen = new Set(prev.map((c: any) => c.id));
        return [...prev, ...items.filter((c: any) => !seen.has(c.id))];
      });
      setCasesTotal(total);
      setCasesHasMore(!!hasMore);
    } catch {
      if (reqId === caseReqRef.current) message.error("Failed to fetch module test cases");
    } finally {
      if (inFlightOffsetRef.current === offset) inFlightOffsetRef.current = null;
      if (reqId === caseReqRef.current) {
        setCasesLoading(false);
        setCasesLoadingMore(false);
      }
    }
  };

  // Typing waits a beat before hitting the server
  useEffect(() => {
    const t = setTimeout(() => setCaseSearchQuery(caseSearchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [caseSearchTerm]);

  // Scope, search or type changed — start again from the first page
  useEffect(() => {
    loadCasePage(0);
  }, [formData.parent_test_case_id, formData.module_id, caseSearchQuery, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * The testing types the cases in this scope actually carry, with counts. Only
   * these are offered, so every option in the filter selects something.
   */
  useEffect(() => {
    if (!hasScope) {
      setTypeFacets([]);
      return;
    }
    let active = true;
    (async () => {
      try {
        const params: Record<string, any> = {};
        if (formData.parent_test_case_id) params.parent_id = formData.parent_test_case_id;
        else if (formData.module_id) params.module_id = formData.module_id;
        if (caseSearchQuery) params.search = caseSearchQuery;
        const res: any = await axios.get("/api/v2/qa/testing-types", { params });
        if (active) setTypeFacets(Array.isArray(res) ? res : (res?.data || []));
      } catch {
        if (active) setTypeFacets([]);
      }
    })();
    return () => { active = false; };
  }, [hasScope, formData.parent_test_case_id, formData.module_id, caseSearchQuery]);

  /* A type that no longer matches anything is dropped rather than left showing
     an empty list the QA has to work out how to escape. */
  useEffect(() => {
    if (!typeFilter || typeFacets.length === 0) return;
    const still = typeFacets.some((f: any) => (f.test_type || "").toLowerCase() === typeFilter.toLowerCase());
    if (!still) setTypeFilter(undefined);
  }, [typeFacets]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Pulls the next 20 once the list is scrolled near its end. */
  const handleCaseListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!casesHasMore || casesLoading || casesLoadingMore) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight <= 60) {
      loadCasePage(childTestCases.length);
    }
  };

  /** Every loaded case is ticked — the affordance flips to "clear" at that point. */
  const allLoadedSelected =
    childTestCases.length > 0 &&
    childTestCases.every((tc: any) => formData.test_case_ids?.includes(tc.id));

  /**
   * Selects every case matching the current scope, search and testing type —
   * including the pages nobody has scrolled to. This is the point of the type
   * filter: pick "Functional", select all, done.
   */
  const selectAllMatching = async () => {
    if (selectingAll) return;
    setSelectingAll(true);
    try {
      const res: any = await axios.get("/api/v2/qa", {
        params: { ...caseScopeParams(), ids_only: true },
      });
      const rows = Array.isArray(res) ? res : (res?.data || []);
      const ids = rows.map((r: any) => r.id);
      setIsDirty(true);
      setFormData((prev: any) => ({
        ...prev,
        test_case_ids: Array.from(new Set([...(prev.test_case_ids || []), ...ids])),
      }));
      message.success(`${ids.length} case${ids.length === 1 ? "" : "s"} selected`);
    } catch {
      message.error("Failed to select all matching cases");
    } finally {
      setSelectingAll(false);
    }
  };

  /** Unticks only what the current filter matches, leaving other picks alone. */
  const clearMatching = async () => {
    if (!typeFilter && !caseSearchQuery) {
      setIsDirty(true);
      setFormData((prev: any) => ({ ...prev, test_case_ids: [] }));
      return;
    }
    try {
      const res: any = await axios.get("/api/v2/qa", {
        params: { ...caseScopeParams(), ids_only: true },
      });
      const rows = Array.isArray(res) ? res : (res?.data || []);
      const drop = new Set(rows.map((r: any) => r.id));
      setIsDirty(true);
      setFormData((prev: any) => ({
        ...prev,
        test_case_ids: (prev.test_case_ids || []).filter((id: string) => !drop.has(id)),
      }));
    } catch {
      message.error("Failed to clear the matching cases");
    }
  };

  /* ── Zai ────────────────────────────────────────────────────────────────── */
  const runSuiteAi = async (mode: "generate" | "grammar", userPrompt?: string) => {
    if (aiBusy) return null;
    setAiBusy(mode);
    try {
      const parent = parents.find((p: any) => p.id === formData.parent_test_case_id);
      const res: any = await axios.post("/api/v2/qa/suites/ai-text", {
        mode,
        text: formData.description || "",
        suiteName: formData.suite_name,
        scenarioTitle: parent?.title,
        moduleName: parent?.module_name,
        caseCount: formData.test_case_ids?.length || 0,
        userPrompt: userPrompt || "",
      });
      const next = (res?.text ?? res?.data?.text ?? "").trim();
      if (!next) {
        message.error("Zai returned an empty response.");
        return null;
      }
      if (mode === "grammar") {
        if (next === (formData.description || "").trim()) {
          message.info("Already looks good");
          return null;
        }
        patch({ description: next });
        message.success("Grammar polished");
      }
      return next;
    } catch (err: any) {
      console.error(err);
      message.error(err?.response?.data?.error || "Failed to generate text");
      return null;
    } finally {
      setAiBusy(null);
    }
  };

  const openZai = () => {
    setZaiPrompt("");
    setZaiDraft("");
    setZaiView("prompt");
    setZaiOpen(true);
  };

  const submitZaiPrompt = async () => {
    if (!zaiPrompt.trim() || aiBusy) return;
    const next = await runSuiteAi("generate", zaiPrompt.trim());
    if (next) {
      setZaiDraft(next);
      setZaiView("preview");
    }
  };

  const applyZaiDraft = (action: "replace" | "append") => {
    const current = (formData.description || "").trim();
    const next = action === "replace" || !current ? zaiDraft : `${current}\n\n${zaiDraft}`;
    patch({ description: next });
    setZaiOpen(false);
    message.success("Description updated");
  };

  /* ── Save ───────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    setNameError(null);
    setScopeError(null);

    if (!formData.suite_name?.trim()) {
      setNameError("Give the suite a name");
      scrollToSection("sec-suite");
      return message.error("Suite Name is required");
    }
    if (!hasScope) {
      setScopeError("Pick the test case this suite belongs to");
      scrollToSection("sec-suite");
      return message.error("An Associated Test Case is required");
    }

    // Auto-inherit module_id from the parent test case when one is chosen
    let chosenModuleId = formData.module_id;
    if (formData.parent_test_case_id) {
      const p = parents.find((x: any) => x.id === formData.parent_test_case_id);
      if (p && p.module_id) chosenModuleId = p.module_id;
    }

    try {
      setSaving(true);
      const payload = { ...formData, module_id: chosenModuleId };
      if (editingId) {
        await axios.put(`/api/v2/qa/suites/${editingId}`, payload);
        message.success("Test Suite updated successfully");
      } else {
        await axios.post("/api/v2/qa/suites", payload);
        message.success("Test Suite created successfully");
      }
      setIsDirty(false);
      router.push("/qa-workspace/test-suites");
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Failed to save suite");
    } finally {
      setSaving(false);
    }
  };

  // ⌘S / Ctrl+S saves, the same as on Create Test Scope
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const completion: Record<string, boolean> = {
    "sec-suite": !!(formData.suite_name?.trim() && hasScope),
    "sec-cases": (formData.test_case_ids?.length || 0) > 0,
  };
  const doneCount = SECTIONS.filter((s) => completion[s.id]).length;
  const progress = Math.round((doneCount / SECTIONS.length) * 100);

  const selectedCount = formData.test_case_ids?.length || 0;
  const filtersActive = !!(caseSearchQuery || typeFilter);

  if (!canReadSuite) return null;
  if (editingId ? !canUpdateSuite : !canCreateSuite) return null;

  return (
    <MainLayout>
      <style dangerouslySetInnerHTML={{
        __html: `
        .ts-create {
          --ts-page: #F4F7FB;
          --ts-surface: #FFFFFF;
          --ts-surface-soft: #F8FAFC;
          --ts-border: #E4EAF2;
          --ts-border-soft: #EDF1F7;
          --ts-text: #0F172A;
          --ts-text-2: #475569;
          --ts-text-3: #94A3B8;
          --ts-blue: #3B82F6;
          --ts-blue-strong: #2563EB;
          --ts-blue-soft: #EFF6FF;
          --ts-blue-border: #BFDBFE;
          --ts-green: #10B981;
          --ts-green-soft: #ECFDF5;
          --ts-red: #EF4444;
          --ts-red-soft: #FEF2F2;
          background: var(--ts-page);
          min-height: 100%;
          /* cancel MainLayout's 8px gutters so the workspace runs edge to edge */
          margin: 0 -8px;
          width: calc(100% + 16px);
        }
        [data-theme='dark'] .ts-create {
          --ts-page: #0B0F1A;
          --ts-surface: #121826;
          --ts-surface-soft: #161E2E;
          --ts-border: #232C3D;
          --ts-border-soft: #1C2434;
          --ts-text: #E9EEF6;
          --ts-text-2: #A8B3C4;
          --ts-text-3: #6E7A8C;
          --ts-blue-soft: rgba(59,130,246,0.14);
          --ts-blue-border: rgba(59,130,246,0.38);
          --ts-green-soft: rgba(16,185,129,0.14);
          --ts-red-soft: rgba(239,68,68,0.12);
        }
        .ts-create .ts-text { color: var(--ts-text); }

        /* ── Sticky page chrome ─────────────────────────────────────── */
        .ts-create .ts-topbar {
          background: var(--ts-page);
          background: color-mix(in srgb, var(--ts-page) 88%, transparent);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--ts-border);
        }
        .ts-create .ts-crumb {
          font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
          font-weight: 600; color: var(--ts-text-3);
          display: inline-flex; align-items: center; gap: 6px;
        }
        .ts-create .ts-crumb button { color: inherit; }
        .ts-create .ts-crumb button:hover { color: var(--ts-blue); }
        .ts-create .ts-title {
          font-size: 20px; line-height: 1.2; font-weight: 700;
          letter-spacing: -0.02em; color: var(--ts-text); margin: 0;
        }
        .ts-create .ts-dirty {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 600; padding: 4px 10px; border-radius: 999px;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
          border: 1px solid var(--ts-blue-border);
        }
        [data-theme='dark'] .ts-create .ts-dirty { color: #93C5FD; }
        .ts-create .ts-dirty__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
        .ts-create .ts-progressbar { height: 3px; background: var(--ts-border-soft); }
        .ts-create .ts-progressbar span {
          display: block; height: 100%;
          background: linear-gradient(90deg, var(--ts-blue), var(--ts-green));
          transition: width .35s cubic-bezier(.4,0,.2,1);
        }

        /* ── Left rail ──────────────────────────────────────────────── */
        .ts-create .ts-rail {
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(15,23,42,.04);
          overflow: hidden;
        }
        .ts-create .ts-rail__top {
          display: flex; align-items: center; gap: 14px;
          padding: 16px; border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-create .ts-ring__track { stroke: var(--ts-border); }
        .ts-create .ts-ring__bar { stroke: var(--ts-blue); transition: stroke-dashoffset .4s cubic-bezier(.4,0,.2,1); }
        .ts-create .ts-rail__nav { padding: 8px; display: flex; flex-direction: column; gap: 2px; }
        .ts-create .ts-navitem {
          display: flex; align-items: center; gap: 9px;
          width: 100%; padding: 7px 10px; border-radius: 9px;
          font-size: 12.5px; font-weight: 500; color: var(--ts-text-2);
          text-align: left; transition: background .15s, color .15s;
        }
        .ts-create .ts-navitem:hover { background: var(--ts-surface-soft); color: var(--ts-text); }
        .ts-create .ts-navitem--active { background: var(--ts-blue-soft); color: var(--ts-blue-strong); font-weight: 600; }
        [data-theme='dark'] .ts-create .ts-navitem--active { color: #93C5FD; }
        .ts-create .ts-navitem__tick {
          margin-left: auto; width: 15px; height: 15px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1.5px solid var(--ts-border); color: transparent; flex-shrink: 0;
        }
        .ts-create .ts-navitem__tick--done { background: var(--ts-green); border-color: var(--ts-green); color: #fff; }
        .ts-create .ts-railfoot {
          padding: 12px 16px; border-top: 1px solid var(--ts-border-soft);
          background: var(--ts-surface-soft);
        }
        .ts-create .ts-railfoot__n { font-size: 20px; font-weight: 750; color: var(--ts-text); line-height: 1; }
        .ts-create .ts-railfoot__l { font-size: 11.5px; color: var(--ts-text-3); margin-top: 3px; }

        /* ── Section cards ──────────────────────────────────────────── */
        .ts-create .ts-card {
          background: var(--ts-surface);
          border: 1px solid var(--ts-border);
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(15,23,42,.04);
          overflow: hidden;
        }
        .ts-create .ts-card__head {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 14px 20px;
          background: var(--ts-surface-soft);
          border-bottom: 1px solid var(--ts-border-soft);
        }
        .ts-create .ts-card__icon {
          width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
          border: 1px solid var(--ts-blue-border);
        }
        [data-theme='dark'] .ts-create .ts-card__icon { color: #93C5FD; }
        .ts-create .ts-card__step {
          font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
          color: var(--ts-text-3); font-variant-numeric: tabular-nums;
        }
        .ts-create .ts-card__title { margin: 0; font-size: 14.5px; font-weight: 650; color: var(--ts-text); letter-spacing: -0.01em; }
        .ts-create .ts-card__desc { margin: 2px 0 0; font-size: 12px; color: var(--ts-text-3); }
        .ts-create .ts-card__body { padding: 20px; }
        .ts-create .ts-count {
          font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px;
          background: var(--ts-green-soft); color: #047857; border: 1px solid transparent;
        }
        [data-theme='dark'] .ts-create .ts-count { color: #6EE7B7; }

        /* ── Fields ─────────────────────────────────────────────────── */
        .ts-create .ts-label {
          display: block; margin-bottom: 6px; font-size: 12px; font-weight: 600;
          color: var(--ts-text-2); letter-spacing: .005em;
        }
        .ts-create .ts-req { color: var(--ts-red); margin-left: 3px; }
        .ts-create .ts-hint { margin: 5px 0 0; font-size: 11.5px; color: var(--ts-text-3); }
        .ts-create .ts-error { margin: 5px 0 0; font-size: 11.5px; color: var(--ts-red); font-weight: 500; }

        .ts-create input.ant-input:not(.ant-input-sm),
        .ts-create .ant-input-affix-wrapper:not(.ant-input-affix-wrapper-sm),
        .ts-create .sd-trigger {
          min-height: 40px !important;
          border-radius: 10px !important;
        }
        .ts-create input.ant-input:not(.ant-input-sm),
        .ts-create .sd-trigger {
          height: 40px !important;
          display: flex; align-items: center;
        }
        .ts-create .ant-input-affix-wrapper input.ant-input { height: auto !important; min-height: 0 !important; }
        .ts-create textarea.ant-input { min-height: 84px; border-radius: 10px !important; padding: 10px 12px; }
        .ts-create .ant-btn { border-radius: 9px; }

        /* Label row with the Zai actions parked at the right end */
        .ts-create .ts-labelrow {
          display: flex; align-items: center; justify-content: space-between;
          gap: 10px; margin-bottom: 6px;
        }
        .ts-create .ts-labelrow .ts-label { margin-bottom: 0; }
        .ts-create .ts-labelrow__actions { display: flex; align-items: center; gap: 6px; }
        .ts-create .ts-mini {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 600; padding: 4px 9px; border-radius: 8px;
          color: var(--ts-text-2); border: 1px solid var(--ts-border); background: var(--ts-surface);
          transition: all .15s ease; white-space: nowrap;
        }
        .ts-create .ts-mini:hover:not(:disabled) { color: var(--ts-blue-strong); border-color: var(--ts-blue-border); background: var(--ts-blue-soft); }
        .ts-create .ts-mini--ai { color: var(--ts-blue-strong); border-color: var(--ts-blue-border); background: var(--ts-blue-soft); }
        [data-theme='dark'] .ts-create .ts-mini--ai { color: #93C5FD; }
        .ts-create .ts-mini:disabled { opacity: .55; cursor: not-allowed; }

        /* ── Link Module Test Cases ─────────────────────────────────── */
        .ts-create .lk-summary {
          padding: 10px 12px; margin-bottom: 10px; border-radius: 10px;
          background: var(--ts-surface-soft); border: 1px solid var(--ts-border-soft);
        }
        .ts-create .lk-summary__row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
        .ts-create .lk-summary__count { font-size: 12px; color: var(--ts-text-3); }
        .ts-create .lk-summary__count strong { font-size: 13.5px; font-weight: 800; color: var(--ts-text); }
        .ts-create .lk-summary__actions { display: flex; align-items: center; gap: 8px; }
        .ts-create .lk-link {
          font-size: 11.5px; font-weight: 600; color: var(--ts-blue-strong);
          background: none; border: none; cursor: pointer; padding: 1px 0;
        }
        .ts-create .lk-link:hover:not(:disabled) { text-decoration: underline; }
        .ts-create .lk-link:disabled { color: var(--ts-text-3); cursor: not-allowed; }
        .ts-create .lk-dot { width: 3px; height: 3px; border-radius: 999px; background: var(--ts-border); }
        .ts-create .lk-bar { height: 3px; margin-top: 9px; border-radius: 999px; background: var(--ts-border); overflow: hidden; }
        .ts-create .lk-bar > span { display: block; height: 100%; background: var(--ts-blue); transition: width .25s ease; }

        /* Filter row — search, then the testing type it is narrowed to */
        .ts-create .lk-filters {
          display: flex; align-items: center; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;
        }
        .ts-create .lk-search {
          display: flex; align-items: center; gap: 8px;
          flex: 1 1 260px; min-width: 220px;
          height: 38px; padding: 0 8px 0 7px;
          border-radius: 10px; box-sizing: border-box;
          background: var(--ts-surface-soft); border: 1px solid var(--ts-border);
          transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
        }
        .ts-create .lk-search:hover { border-color: var(--ts-blue-border); }
        .ts-create .lk-search:focus-within {
          background: var(--ts-surface); border-color: var(--ts-blue);
          box-shadow: 0 0 0 3px rgba(59,130,246,.12);
        }
        .ts-create .lk-search__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 24px; height: 24px; border-radius: 7px; font-size: 12px;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
          transition: background .15s ease, color .15s ease;
        }
        .ts-create .lk-search.is-filled .lk-search__icon { background: var(--ts-blue); color: #fff; }
        .ts-create .lk-search__input {
          flex: 1; min-width: 0; height: 100%;
          border: none; outline: none; background: transparent;
          font-size: 12.5px; color: var(--ts-text);
        }
        .ts-create .lk-search__input::placeholder { color: var(--ts-text-3); }
        .ts-create .lk-search__spin { flex-shrink: 0; font-size: 12px; color: var(--ts-blue); }
        .ts-create .lk-search__clear {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 22px; height: 22px; border-radius: 6px; font-size: 10px;
          border: none; background: transparent; cursor: pointer;
          color: var(--ts-text-3); transition: all .15s ease;
        }
        .ts-create .lk-search__clear:hover { background: var(--ts-border-soft); color: var(--ts-text-2); }

        /* The type filter keeps a fixed slot so the row never reflows */
        .ts-create .lk-type { flex: 0 0 234px; max-width: 234px; }
        .ts-create .lk-type .sd-trigger { height: 38px !important; min-height: 38px !important; border-radius: 10px !important; }
        .ts-create .lk-reset {
          display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
          height: 38px; padding: 0 11px; border-radius: 10px;
          font-size: 11.5px; font-weight: 600;
          color: var(--ts-text-2); background: var(--ts-surface); border: 1px solid var(--ts-border);
          transition: all .15s ease;
        }
        .ts-create .lk-reset:hover { color: var(--ts-blue-strong); border-color: var(--ts-blue-border); background: var(--ts-blue-soft); }

        /* Active-filter read-out, so the count below is never a mystery */
        .ts-create .lk-scope {
          display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
          margin-bottom: 9px; font-size: 11.5px; color: var(--ts-text-3);
        }
        .ts-create .lk-scope__pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 2px 9px; border-radius: 999px; font-weight: 650;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
          border: 1px solid var(--ts-blue-border);
        }
        [data-theme='dark'] .ts-create .lk-scope__pill { color: #93C5FD; }

        .ts-create .lk-list {
          display: flex; flex-direction: column; gap: 6px;
          max-height: 420px; overflow-y: auto; padding-right: 3px;
          overscroll-behavior: contain;
        }
        .ts-create .lk-list::-webkit-scrollbar { width: 6px; }
        .ts-create .lk-list::-webkit-scrollbar-thumb { background: var(--ts-border); border-radius: 999px; }
        .ts-create .lk-list--loading {
          align-items: center; justify-content: center;
          min-height: 200px; overflow: hidden;
        }

        .ts-create .lk-item {
          display: flex; align-items: flex-start; gap: 10px; cursor: pointer;
          padding: 9px 11px; border-radius: 10px;
          border: 1px solid var(--ts-border-soft); background: var(--ts-surface);
          transition: border-color .15s ease, background .15s ease;
        }
        .ts-create .lk-item:hover { border-color: var(--ts-blue-border); background: var(--ts-surface-soft); }
        .ts-create .lk-item.is-on { border-color: var(--ts-blue-border); background: var(--ts-blue-soft); }
        .ts-create .lk-item .ant-checkbox-wrapper { margin-top: 1px; }
        .ts-create .lk-item__body { display: flex; flex-direction: column; gap: 5px; min-width: 0; flex: 1; }
        .ts-create .lk-item__top { display: flex; align-items: center; gap: 8px; min-width: 0; }
        .ts-create .lk-item__id {
          flex-shrink: 0; font-size: 10.5px; font-weight: 700; letter-spacing: .02em;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          padding: 2px 6px; border-radius: 5px;
          background: var(--ts-blue-soft); color: var(--ts-blue-strong);
        }
        [data-theme='dark'] .ts-create .lk-item__id { color: #93C5FD; }
        .ts-create .lk-item__name {
          font-size: 12.5px; font-weight: 600; color: var(--ts-text);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;
        }
        .ts-create .lk-item__meta { display: flex; flex-wrap: wrap; gap: 5px; }
        .ts-create .lk-chip {
          font-size: 10.5px; font-weight: 600; padding: 1px 7px; border-radius: 999px;
          background: var(--ts-surface-soft); border: 1px solid var(--ts-border);
          color: var(--ts-text-3);
        }
        .ts-create .lk-item.is-on .lk-chip { background: var(--ts-surface); }
        /* The type the list is filtered by is called out on every row */
        .ts-create .lk-chip--type {
          background: var(--ts-green-soft); border-color: transparent; color: #047857;
        }
        [data-theme='dark'] .ts-create .lk-chip--type { color: #6EE7B7; }

        .ts-create .lk-more {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 9px 10px; margin-top: 1px; border-radius: 9px;
          font-size: 11.5px; font-weight: 600; color: var(--ts-text-3);
        }
        .ts-create .lk-more--btn {
          width: 100%; cursor: pointer; color: var(--ts-blue-strong);
          background: var(--ts-blue-soft); border: 1px dashed var(--ts-blue-border);
          transition: all .15s ease;
        }
        .ts-create .lk-more--btn:hover { border-style: solid; }
        .ts-create .lk-more--end { color: var(--ts-text-3); font-weight: 500; }

        .ts-create .lk-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 34px 20px; border-radius: 12px; text-align: center;
          border: 1px dashed var(--ts-border); background: var(--ts-surface-soft);
        }
        .ts-create .lk-empty__icon { font-size: 22px; color: var(--ts-text-3); margin-bottom: 10px; }
        .ts-create .lk-empty__title { margin: 0; font-size: 13px; font-weight: 650; color: var(--ts-text-2); }
        .ts-create .lk-empty__desc { margin: 4px 0 0; font-size: 12px; color: var(--ts-text-3); }
      `}} />

      <div className="ts-create" ref={rootRef}>
        {/* ── Sticky header ─────────────────────────────────────────── */}
        <div ref={stickyRef} className="ts-topbar sticky top-0 z-30">
          <div className="mx-auto max-w-[1560px] px-5 xl:px-7 pt-3 pb-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-2.5 min-w-0">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push("/qa-workspace/test-suites")}
                  className="mt-0.5 flex-shrink-0"
                />
                <div className="min-w-0">
                  <div className="ts-crumb">
                    <button onClick={() => router.push("/qa-workspace/test-scope")}>QA Workspace</button>
                    <span>›</span>
                    <button onClick={() => router.push("/qa-workspace/test-suites")}>Test Suites</button>
                    <span>›</span>
                    <span style={{ color: "var(--ts-text-2)" }}>{editingId ? "Edit" : "New"}</span>
                  </div>
                  <h1 className="ts-title mt-1.5">
                    {formData.suite_name?.trim() || (editingId ? "Edit Test Suite" : "Create Test Suite")}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                {isDirty && (
                  <span className="ts-dirty hidden sm:inline-flex">
                    <span className="ts-dirty__dot" />Unsaved changes
                  </span>
                )}
                <Button onClick={() => router.push("/qa-workspace/test-suites")}>Cancel</Button>
                <Tooltip title="⌘S / Ctrl+S">
                  <Button type="primary" icon={<Save size={15} />} onClick={handleSave} loading={saving}>
                    {editingId ? "Save changes" : "Create suite"}
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
          <div className="ts-progressbar"><span style={{ width: `${progress}%` }} /></div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-[1560px] px-5 xl:px-7 py-6">
          <div className="flex items-start gap-6">

            {/* Left rail */}
            <aside
              className="hidden xl:block w-[252px] flex-shrink-0 self-start"
              style={{ position: "sticky", top: stickyH + 20 }}
            >
              <div className="ts-rail">
                <div className="ts-rail__top">
                  <ProgressRing value={progress} />
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold ts-text">Suite readiness</div>
                    <div className="text-[11.5px]" style={{ color: "var(--ts-text-3)" }}>
                      {doneCount}/{SECTIONS.length} sections complete
                    </div>
                  </div>
                </div>
                <nav className="ts-rail__nav">
                  {SECTIONS.map((s) => {
                    const Icon = s.icon;
                    const done = completion[s.id];
                    return (
                      <button
                        key={s.id}
                        onClick={() => scrollToSection(s.id)}
                        className={`ts-navitem${activeSection === s.id ? " ts-navitem--active" : ""}`}
                      >
                        <Icon size={14} className="flex-shrink-0" />
                        <span className="truncate">{s.label}</span>
                        {s.required && !done ? <span className="ts-req ml-auto">*</span> : null}
                        <span className={`ts-navitem__tick${done ? " ts-navitem__tick--done" : ""}`}>
                          <Check size={9} strokeWidth={4} />
                        </span>
                      </button>
                    );
                  })}
                </nav>
                <div className="ts-railfoot">
                  <div className="ts-railfoot__n">{selectedCount}</div>
                  <div className="ts-railfoot__l">
                    case{selectedCount === 1 ? "" : "s"} will run in this suite
                  </div>
                </div>
              </div>
            </aside>

            {/* Form column */}
            <main className="flex-1 min-w-0 flex flex-col gap-5 pb-24">

              {/* 01 — Suite Information */}
              <SectionCard
                id="sec-suite"
                index={1}
                icon={ClipboardList}
                title="Suite Information"
                description="Name the suite, say how it tests, and pick the test case it belongs to."
              >
                <div className="grid grid-cols-1 md:grid-cols-10 gap-x-5 gap-y-4 mb-4">
                  <Field label="Suite Name" required className="md:col-span-7" error={nameError || undefined}>
                    <Input
                      placeholder="e.g. Smoke Test Suite, Regression Sprint 14"
                      value={formData.suite_name || ""}
                      status={nameError ? "error" : undefined}
                      onChange={(e) => { setNameError(null); patch({ suite_name: e.target.value }); }}
                    />
                  </Field>
                  <Field
                    label="Testing Type"
                    className="md:col-span-3"
                    hint="Type your own to add one"
                  >
                    <SearchableDropdown
                      /* freeText lets the typed value be submitted as-is, which is
                         how a custom type gets created — no separate "add" step. */
                      freeText
                      options={testingTypeOptions}
                      value={formData.testing_type || undefined}
                      onChange={(val: any) => patch({ testing_type: val || undefined })}
                      placeholder="Select a type"
                      searchPlaceholder="Search or add a testing type…"
                      itemNoun="types"
                      hideAvatar
                      allowClear
                      style={{ width: "100%" }}
                    />
                  </Field>
                </div>

                <Field
                  label="Associated Test Case"
                  required
                  className="mb-4"
                  error={scopeError || undefined}
                  hint="The parent case whose module cases this suite draws from."
                >
                  <SearchableDropdown
                    options={parents.map((p: any) => ({
                      value: p.id,
                      label: p.title,
                      description: [
                        p.module_name && p.module_name !== "Unassigned" ? p.module_name : null,
                        p.feature,
                        `${p.child_count ?? 0} case${Number(p.child_count) === 1 ? "" : "s"}`,
                      ].filter(Boolean).join(" · "),
                    }))}
                    value={formData.parent_test_case_id || undefined}
                    onChange={(val: any) => {
                      setScopeError(null);
                      setTypeFilter(undefined);
                      setCaseSearchTerm("");
                      if (!val) {
                        patch({ parent_test_case_id: undefined, module_id: undefined, test_case_ids: [] });
                      } else {
                        const selected = parents.find((p: any) => p.id === val);
                        patch({
                          parent_test_case_id: val,
                          module_id: selected ? selected.module_id : formData.module_id,
                          test_case_ids: [],
                        });
                      }
                    }}
                    placeholder="Select a test case to load its module cases"
                    onSearch={(val) => setParentSearchTerm(val)}
                    allowClear
                    style={{ width: "100%" }}
                  />
                </Field>

                <div>
                  <div className="ts-labelrow">
                    <label className="ts-label">Description</label>
                    <div className="ts-labelrow__actions">
                      <button
                        type="button"
                        className="ts-mini ts-mini--ai"
                        disabled={aiBusy === "generate"}
                        onClick={openZai}
                      >
                        <Sparkles size={11} /> {aiBusy === "generate" ? "Drafting…" : "Create with Zai"}
                      </button>
                      <Tooltip title={!formData.description?.trim() ? "Write something first" : "Fix grammar & typos — keeps your wording"}>
                        <button
                          type="button"
                          className="ts-mini"
                          disabled={aiBusy === "grammar" || !formData.description?.trim()}
                          onClick={() => runSuiteAi("grammar")}
                        >
                          <SpellCheck size={11} /> {aiBusy === "grammar" ? "Polishing…" : "Grammar"}
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <Input.TextArea
                    placeholder="Describe the goals and coverage of this test suite…"
                    value={formData.description || ""}
                    onChange={(e) => patch({ description: e.target.value })}
                    autoSize={{ minRows: 3 }}
                  />
                </div>
              </SectionCard>

              {/* 02 — Link Module Test Cases */}
              <SectionCard
                id="sec-cases"
                index={2}
                icon={ListChecks}
                title="Link Module Test Cases"
                description="Filter by testing type, then select the cases this suite runs."
                badge={selectedCount > 0 ? <span className="ts-count">{selectedCount} linked</span> : undefined}
              >
                {!hasScope ? (
                  <div className="lk-empty">
                    <FileTextOutlined className="lk-empty__icon" />
                    <p className="lk-empty__title">Pick an associated test case first</p>
                    <p className="lk-empty__desc">Its module cases will load here, ready to filter and link.</p>
                  </div>
                ) : (
                  <>
                    {/* Selection summary + coverage bar */}
                    <div className="lk-summary">
                      <div className="lk-summary__row">
                        <span className="lk-summary__count">
                          <strong>{selectedCount}</strong> selected · {casesTotal} case{casesTotal === 1 ? "" : "s"}
                          {filtersActive ? " match the filter" : " in this scope"}
                        </span>
                        <div className="lk-summary__actions">
                          <button
                            type="button"
                            className="lk-link"
                            onClick={selectAllMatching}
                            disabled={casesTotal === 0 || selectingAll || (allLoadedSelected && !casesHasMore)}
                          >
                            {selectingAll ? "Selecting…" : `Select ${filtersActive ? "all matches" : "all"}`}
                          </button>
                          <span className="lk-dot" />
                          <button
                            type="button"
                            className="lk-link"
                            onClick={clearMatching}
                            disabled={!selectedCount}
                          >
                            {filtersActive ? "Clear matches" : "Clear"}
                          </button>
                        </div>
                      </div>
                      <div className="lk-bar">
                        <span style={{ width: `${casesTotal ? Math.min(100, (selectedCount / casesTotal) * 100) : 0}%` }} />
                      </div>
                    </div>

                    {/* Search + testing type, both server-side so they span every
                        case in the scope rather than the loaded page. */}
                    <div className="lk-filters">
                      <div className={`lk-search${caseSearchTerm ? " is-filled" : ""}`}>
                        <span className="lk-search__icon"><SearchOutlined /></span>
                        <input
                          className="lk-search__input"
                          placeholder="Search module cases by name or ID…"
                          value={caseSearchTerm}
                          onChange={(e) => setCaseSearchTerm(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") setCaseSearchTerm(""); }}
                        />
                        {casesLoading && caseSearchTerm ? (
                          <span className="lk-search__spin"><LoadingOutlined /></span>
                        ) : null}
                        {caseSearchTerm ? (
                          <button
                            type="button"
                            className="lk-search__clear"
                            onClick={() => setCaseSearchTerm("")}
                            aria-label="Clear search"
                          >
                            <CloseOutlined />
                          </button>
                        ) : null}
                      </div>

                      {/* Only the types these cases actually carry — every option
                          here selects something. */}
                      <div className="lk-type">
                        <SearchableDropdown
                          options={typeFacets.map((f: any) => ({
                            value: f.test_type,
                            label: f.test_type,
                            description: `${f.count} case${Number(f.count) === 1 ? "" : "s"}`,
                          }))}
                          value={typeFilter}
                          onChange={(val: any) => setTypeFilter(val || undefined)}
                          placeholder={typeFacets.length ? "All testing types" : "No types recorded"}
                          searchPlaceholder="Search testing types…"
                          itemNoun="types"
                          hideAvatar
                          allowClear
                          disabled={typeFacets.length === 0}
                          style={{ width: "100%" }}
                        />
                      </div>

                      {filtersActive && (
                        <button
                          type="button"
                          className="lk-reset"
                          onClick={() => { setCaseSearchTerm(""); setTypeFilter(undefined); }}
                        >
                          <CloseOutlined style={{ fontSize: 9 }} /> Reset
                        </button>
                      )}
                    </div>

                    {filtersActive && (
                      <div className="lk-scope">
                        <Filter size={11} />
                        <span>Showing</span>
                        {typeFilter && <span className="lk-scope__pill">{typeFilter}</span>}
                        {caseSearchQuery && <span className="lk-scope__pill">“{caseSearchQuery}”</span>}
                        <span>· {casesTotal} case{casesTotal === 1 ? "" : "s"}</span>
                      </div>
                    )}

                    {casesLoading ? (
                      <div className="lk-list lk-list--loading">
                        <ZukvoLoader size="md" message="Loading module cases…" />
                      </div>
                    ) : childTestCases.length === 0 ? (
                      filtersActive ? (
                        <div className="lk-empty">
                          <SearchOutlined className="lk-empty__icon" />
                          <p className="lk-empty__title">No cases match this filter</p>
                          <p className="lk-empty__desc">Try another testing type, or clear the search.</p>
                        </div>
                      ) : (
                        <div className="lk-empty">
                          <FileTextOutlined className="lk-empty__icon" />
                          <p className="lk-empty__title">No module cases in this test case</p>
                          <p className="lk-empty__desc">Add module cases to it first, then link them here.</p>
                        </div>
                      )
                    ) : (
                      <div className="lk-list" onScroll={handleCaseListScroll}>
                        {childTestCases.map((tc: any) => {
                          const checked = formData.test_case_ids?.includes(tc.id);
                          const isFilteredType =
                            !!typeFilter && (tc.test_type || "").toLowerCase() === typeFilter.toLowerCase();
                          return (
                            <label key={tc.id} className={`lk-item${checked ? " is-on" : ""}`}>
                              <Checkbox
                                checked={checked}
                                onChange={(e) => {
                                  const current: string[] = formData.test_case_ids || [];
                                  patch({
                                    test_case_ids: e.target.checked
                                      ? [...current, tc.id]
                                      : current.filter((id: string) => id !== tc.id),
                                  });
                                }}
                              />
                              <span className="lk-item__body">
                                <span className="lk-item__top">
                                  <code className="lk-item__id">{tc.test_case_id || "TC"}</code>
                                  <span className="lk-item__name" title={tc.name}>{tc.name}</span>
                                </span>
                                <span className="lk-item__meta">
                                  {tc.test_type && (
                                    <span className={`lk-chip${isFilteredType ? " lk-chip--type" : ""}`}>{tc.test_type}</span>
                                  )}
                                  {tc.priority && <span className="lk-chip">{tc.priority}</span>}
                                  {tc.severity && <span className="lk-chip">{tc.severity}</span>}
                                  {tc.status && <span className="lk-chip">{tc.status}</span>}
                                </span>
                              </span>
                            </label>
                          );
                        })}

                        {/* Tail of the list: loads the next 20 as it comes into view */}
                        {casesLoadingMore ? (
                          <div className="lk-more"><ZukvoLoader size="sm" message="Loading more cases…" /></div>
                        ) : casesHasMore ? (
                          <button
                            type="button"
                            className="lk-more lk-more--btn"
                            onClick={() => loadCasePage(childTestCases.length)}
                          >
                            Load {Math.min(CASE_PAGE_SIZE, casesTotal - childTestCases.length)} more
                          </button>
                        ) : childTestCases.length > CASE_PAGE_SIZE ? (
                          <div className="lk-more lk-more--end">All {casesTotal} cases loaded</div>
                        ) : null}
                      </div>
                    )}
                  </>
                )}
              </SectionCard>
            </main>
          </div>
        </div>
      </div>

      {/* Create with Zai — prompt, preview, then apply to the description */}
      <Modal
        title={null}
        open={zaiOpen}
        onCancel={() => setZaiOpen(false)}
        width={720}
        footer={null}
        destroyOnHidden
        centered
        closable={false}
        zIndex={1200}
        wrapClassName="zai-modal-wrap"
        styles={{
          mask: { backdropFilter: "blur(8px)", background: "rgba(8, 12, 24, 0.55)" },
          content: { padding: 0, borderRadius: 22, overflow: "hidden", background: "transparent", boxShadow: "0 30px 80px rgba(8,12,24,0.45)" },
          body: { padding: 0 },
        }}
      >
        <div className="zai-modal">
          <div className="zai-hero">
            <div className="zai-hero__bg" />
            <div className="zai-hero__content">
              <div className="zai-hero__brand">
                <div className="zai-orb"><Sparkles size={20} /></div>
                <div className="zai-hero__title-wrap">
                  <div className="zai-hero__eyebrow">
                    <span className="zai-pill"><Zap size={10} strokeWidth={2.5} />ZAI · Smart Generation</span>
                  </div>
                  <h2 className="zai-hero__title">Create with <span className="zai-grad">Zai</span></h2>
                  <p className="zai-hero__sub">
                    Tell Zai what this suite&apos;s description should say. It already knows the suite name,
                    scenario, module and how many cases are linked.
                  </p>
                </div>
              </div>
              <button className="zai-close" onClick={() => setZaiOpen(false)} aria-label="Close">×</button>
            </div>
          </div>

          <div className="zai-body">
            {zaiView === "prompt" ? (
              <div className="zai-prompt">
                <div className="zai-prompt__label">
                  <Wand2 size={14} />
                  <span>Instruction</span>
                </div>
                <div className="zai-prompt__row">
                  <Input.TextArea
                    rows={2}
                    placeholder="e.g. Explain what this suite covers for the checkout flow and when to run it."
                    value={zaiPrompt}
                    onChange={(e) => setZaiPrompt(e.target.value)}
                    className="zai-textarea"
                    variant="borderless"
                  />
                  <Button
                    type="primary"
                    onClick={submitZaiPrompt}
                    loading={aiBusy === "generate"}
                    disabled={!zaiPrompt.trim()}
                    className="zai-cta"
                    icon={aiBusy === "generate" ? null : <Sparkles size={14} />}
                  >
                    {aiBusy === "generate" ? "Zai is thinking…" : "Generate Content"}
                  </Button>
                </div>

                <div className="zai-template-list" style={{ marginTop: 24 }}>
                  <div className="zai-template-list__heading">
                    <span className="zai-suggestions__label">Try one of these</span>
                  </div>
                  <div className="zai-template-grid">
                    {ZAI_SUGGESTIONS.map((t) => {
                      const active = zaiPrompt === t.body;
                      return (
                        <button
                          key={t.title}
                          type="button"
                          className={`zai-template-card ${active ? "zai-template-card--active" : ""}`}
                          onClick={() => setZaiPrompt(t.body)}
                        >
                          <div className="zai-template-card__head">
                            <span className="zai-template-card__icon">{t.icon}</span>
                            <span className="zai-template-card__title">{t.title}</span>
                            <span className="zai-template-card__use">{active ? "Selected" : "Use this"}</span>
                          </div>
                          <p className="zai-template-card__body">{t.body}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="zai-compare">
                  <div className="zai-pane zai-pane--new" style={{ width: "100%" }}>
                    <div className="zai-pane__head" style={{ justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="zai-pane__dot zai-pane__dot--new" />
                        <span className="zai-pane__title zai-pane__title--new">Zai&apos;s Draft</span>
                        <span className="zai-pane__badge">Ready</span>
                      </div>
                      <Button type="link" size="small" onClick={() => setZaiView("prompt")} style={{ padding: 0 }}>
                        Edit Prompt
                      </Button>
                    </div>
                    <div
                      className="zai-pane__body zai-pane__body--new"
                      style={{ minHeight: 160, maxHeight: 340, overflowY: "auto", padding: 24, whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.65 }}
                    >
                      {zaiDraft}
                    </div>
                  </div>
                </div>

                <div className="zai-footer">
                  <div className="zai-footer__hint">
                    Review the draft — replace what&apos;s in the field, or add it to the end.
                  </div>
                  <div className="zai-footer__actions">
                    <Button
                      icon={<Copy size={14} />}
                      className="zai-btn-ghost"
                      onClick={() => { navigator.clipboard.writeText(zaiDraft); message.success("Copied to clipboard"); }}
                    >
                      Copy
                    </Button>
                    <Button onClick={submitZaiPrompt} loading={aiBusy === "generate"} className="zai-btn-ghost">
                      Regenerate
                    </Button>
                    <Dropdown menu={{ items: [{ key: "append", label: "Append to end", onClick: () => applyZaiDraft("append") }] }}>
                      <Button type="primary" onClick={() => applyZaiDraft("replace")} className="zai-btn-apply">
                        Use this description <ChevronDown size={14} style={{ marginLeft: 4 }} />
                      </Button>
                    </Dropdown>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      {loadingSuite && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <ZukvoLoader size="md" message="Loading test suite…" />
        </div>
      )}
    </MainLayout>
  );
}

export default function CreateTestSuitePage() {
  return (
    <Suspense fallback={<ZukvoLoader size="lg" fullscreen message="Loading test suite…" />}>
      <CreateTestSuiteContent />
    </Suspense>
  );
}
