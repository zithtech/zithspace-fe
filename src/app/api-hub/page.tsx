"use client";

/**
 * API Hub — the endpoint catalog QA Space builds on.
 *
 * One definition per endpoint: method, URL, headers, query and path params,
 * payload, sample data, auth, expected response and the assertions QA inherits
 * by default. QA never retypes any of it; a flow step just points here.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Button,
  Dropdown,
  Input,
  Modal,
  Segmented,
  Switch,
  Tooltip,
  Typography,
  message,
} from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  Plug2,
  Trash2,
  Pencil,
  Copy,
  TerminalSquare,
  Wand2,
  Braces,
  CheckCircle2,
  AlertCircle,
  FolderPlus,
  Layers3,
  LayoutGrid,
  Send,
  ClipboardPaste,
  Download,
  History,
  Sparkles,
  ShieldAlert,
  Boxes,
  Briefcase,
  ChevronRight,
  List as ListIcon,
  Link as LinkIcon,
  Route,
  FileJson2,
  FileText,
  Timer,
  Info,
  SpellCheck,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronsDownUp,
  RotateCcw,
  X,
  KeyRound,
  ShieldCheck,
  Settings2,
  Check,
  Minus,
  FolderKanban,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { deleteQaModule, useProjectQaModules } from "@/hooks/useQaOptions";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import TiptapEditor from "@/components/common/TiptapEditor";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import type { SearchableDropdownOption } from "@/components/common/SearchableDropdown";
import { ModuleModal, MODULE_SETTINGS_STYLES } from "@/components/qa/ModuleSettingsSection";
import { SETTINGS_MODAL_STYLES } from "@/components/qa/ScopeSettingsSection";
import { ProjectService } from "@/services/projectService";
import {
  AssertionEditor,
  KeyValueEditor,
  MethodTag,
  StatusTag,
  sourceIcon,
} from "@/components/yapiez/shared";
import { CaptureHelpButton, CaptureHelpModal } from "@/components/yapiez/CaptureHelp";
import { CurlHowTo } from "@/components/yapiez/CurlHowTo";
import {
  Assertion,
  AUTH_TYPES,
  AUTH_TYPE_HELP,
  AUTH_TYPE_LABELS,
  AuthType,
  BODY_TYPES,
  BodyType,
  HTTP_METHODS,
  HttpMethod,
  YapiezApi,
  YapiezCollection,
  YapiezService,
  YapiezSource,
  YapiezTrashEntry,
  METHOD_COLORS,
  TryApiResult,
  CapturedResponse,
  formatDuration,
  variablesUsedBy,
  UNFILED_MODULE,
} from "@/services/yapiezService";
import {
  assertionsFromSample,
  checkJson,
  formatJson,
  inferSchema,
  missingPathParams,
  parseCurlSession,
  parseResponsePaste,
  findLiteralSecrets,
  templateSecretsInCommand,
  CURL_EXAMPLE,
  sampleFromRequest,
  isWriteMethod,
  responseTimeAssertion,
  byteLengthOf,
} from "@/services/yapiezAuthoring";

dayjs.extend(relativeTime);

const { Text } = Typography;
const { TextArea } = Input;

/** The "Capture a real response" panel in the API drawer, hidden for now. */
const SHOW_CAPTURE_PANEL = false;

/**
 * What each body type is, said once.
 *
 * The placeholder used to be JSON whatever you picked, which quietly taught
 * the wrong shape to anyone writing a form body for the first time.
 */
const BODY_TYPE_META: Record<BodyType, { label: string; placeholder: string; hint: string }> = {
  none: { label: "None", placeholder: "", hint: "" },
  json: {
    label: "JSON",
    placeholder: '{\n  "name": "John",\n  "email": "john@test.com"\n}',
    hint: "",
  },
  form: {
    label: "Form",
    placeholder: "name=John\nemail=john@test.com",
    hint: "One key=value per line, sent as application/x-www-form-urlencoded.",
  },
  text: {
    label: "Text",
    placeholder: "Anything the endpoint accepts as a raw body.",
    hint: "Sent verbatim as text/plain.",
  },
};

/** Shapes the cURL import understands, and what each one adds. */
const CURL_FORMATS = [
  { label: "Chrome — Copy as cURL", detail: "Request only — no response is in that clipboard" },
  { label: "curl -i", detail: "Adds the status line and response headers" },
  { label: "curl -v", detail: "Adds the status and headers, prefixed with <" },
  { label: "curl -w", detail: "Adds exact timing and download size" },
];

/** Where the chosen project is remembered, matching the Bug List's own key. */
const PROJECT_STORAGE_KEY = "yapiez_selected_project";

/**
 * The base URL a send resolves relative paths against, kept per project.
 *
 * No longer typed in the send bar — that is one field holding the whole URL —
 * but a project that had one remembered still uses it, and the capture panel
 * sets it when that panel is switched back on.
 */
const BASE_URL_STORAGE_PREFIX = "api_hub_base_url:";

/**
 * The "Create new module" row pinned to the bottom of every module picker.
 *
 * It opens QA Settings' own module modal in place rather than sending the
 * reader to that screen — the picker sits inside a half-written definition,
 * and navigating away would throw that draft out.
 */
const CREATE_MODULE = "__create_module__";

/** How many projects the empty-state picker shows before "Show more". */
const PROJECT_PICKER_PREVIEW = 6;

/** The tree column, and the range dragging it is allowed to reach. */
const SIDEBAR_DEFAULT_WIDTH = 288;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 460;

/** Stable per-project tint for the switcher's code badge, as the Bug List does. */
const stringToHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

/** A blank definition. Bearer-style auth is inherited from the flow by default,
 *  which is what almost every endpoint behind a login wants. */
const emptyApi = (): Partial<YapiezApi> => ({
  name: "",
  method: "GET",
  url: "",
  description: "",
  headers: [],
  queryParams: [],
  pathParams: [],
  bodyType: "none",
  requestBody: "",
  sampleData: {},
  authType: "inherit",
  authConfig: {},
  moduleName: null,
  expectedStatus: null,
  expectedResponse: "",
  responseSchema: {},
  defaultAssertions: [],
  tags: [],
  notes: "",
  isDeprecated: false,
});

function ApiCatalogContent() {
  useActivitySource({ section: "WORK", module: "API Hub", page: "ApiCatalog" });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreateYapiezApi, canUpdateYapiezApi, canDeleteYapiezApi } = usePermission();

  const [collections, setCollections] = useState<YapiezCollection[]>([]);
  const [sources, setSources] = useState<YapiezSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /** One box, filtering the whole tree — the only narrowing Postman offers. */
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  /**
   * The project the whole page is scoped to, remembered between visits the way
   * the Bug List remembers its own. Null means nobody has chosen yet, which is
   * the empty state rather than "show everything" — a catalog spanning every
   * project is the pile this page exists to break up.
   */
  const [projectId, setProjectId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(PROJECT_STORAGE_KEY) || null;
  });
  /** The empty-state picker shows a first page of projects. */
  const [showAllPickerProjects, setShowAllPickerProjects] = useState(false);
  /**
   * Every endpoint in the project, held in one place.
   *
   * The sidebar is a tree, and a tree cannot be paginated — you would be
   * unable to open the branch whose contents fell on page two. Catalogs are
   * small enough that one fetch is cheaper than lazy-loading each branch, and
   * it makes search instant instead of a round trip per keystroke.
   */
  const [allApis, setAllApis] = useState<YapiezApi[]>([]);
  /** Which branches are open. Names for modules, ids for collections. */
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [openCollections, setOpenCollections] = useState<Set<string>>(new Set());
  /** The endpoint the workspace is showing. */
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  /**
   * What the right pane is for right now.
   *
   * The trash is a place, not a dialog: you go and look at it, restore a few
   * things, and come back. A modal would make you close it to check whether
   * the thing you restored actually landed where you expected.
   */
  const [showTrash, setShowTrash] = useState(false);
  const [trash, setTrash] = useState<YapiezTrashEntry[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  /** The tree holds long names, so its column is draggable like Postman's. */
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [projects, setProjects] = useState<
    { value: string; label: string; code?: string; description?: string }[]
  >([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  // Editing a collection, from its card.
  const [collectionEdit, setCollectionEdit] = useState<YapiezCollection | null>(null);
  const [collectionDraft, setCollectionDraft] = useState<Partial<YapiezCollection>>({});
  const [savingCollection, setSavingCollection] = useState(false);

  // Creating a collection, either from the tree or from the open definition.
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  /**
   * Which module the new collection lands in.
   *
   * Set explicitly when the tree starts it, because the click already said
   * where; left null when the editor starts it, and the definition's own
   * module answers instead.
   */
  const [newCollectionModule, setNewCollectionModule] = useState<string | null>(null);
  const [creatingCollection, setCreatingCollection] = useState(false);

  /** True while an endpoint is open in the workspace, new or existing. */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<YapiezApi>>(emptyApi());
  const [activeTab, setActiveTab] = useState<"request" | "response" | "auth">("request");

  // cURL import.
  const [curlOpen, setCurlOpen] = useState(false);
  const [curlText, setCurlText] = useState("");

  /**
   * Send — execute the draft and capture the real response.
   *
   * A base URL typed here is all a one-off "does this endpoint answer" needs,
   * and it is remembered per project so you type each host once rather than
   * once per definition.
   */
  const [sendBaseUrl, setSendBaseUrl] = useState("");
  const [sendAuthApiId, setSendAuthApiId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const [tryResult, setTryResult] = useState<TryApiResult | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [captureHelpOpen, setCaptureHelpOpen] = useState(false);
  const [fixingGrammar, setFixingGrammar] = useState(false);
  // Headers are the longest table and the one you revisit least once written,
  // so it is the one that collapses.
  const [headersOpen, setHeadersOpen] = useState(true);

  /**
   * The most recent real measurement for this endpoint, from whichever route
   * produced it. Held in one place so the Request tab can show it without
   * caring whether it came from a send, a cURL session, a paste or history.
   *
   * `durationMs` stays null when the source genuinely had no timing — an
   * offline-generated sample has no time, and a paste only has one if it
   * carried a timing header.
   */
  const [lastCapture, setLastCapture] = useState<{
    status: number | null;
    durationMs: number | null;
    byteSize: number | null;
    source: string;
  } | null>(null);

  // Sending a write method really creates/updates/deletes data, and does so
  // again on every click. It is therefore opt-in per drawer session rather
  // than something you can trigger by reflex.
  const [allowWriteSend, setAllowWriteSend] = useState(false);
  const [history, setHistory] = useState<CapturedResponse[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Creating a deployment tier without leaving the definition either.
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [newSourceLabel, setNewSourceLabel] = useState("");
  const [creatingSource, setCreatingSource] = useState(false);

  const load = useCallback(async () => {
    // Nothing is in scope until a project is chosen — the picker is showing.
    if (!projectId) {
      setAllApis([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Deprecated definitions are included and then shown struck through:
      // hiding them would leave a gap in the tree with no explanation for it.
      const result = await YapiezService.listApis({
        projectId,
        sourceId: sourceFilter,
        pageSize: 1000,
        sort: "name",
        includeDeprecated: true,
      });
      setAllApis(result.data);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not load the API catalog");
    } finally {
      setLoading(false);
    }
  }, [projectId, sourceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  /** Remember the project, so coming back lands where you left off. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (projectId) localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
    else localStorage.removeItem(PROJECT_STORAGE_KEY);
  }, [projectId]);

  /**
   * The module list and the collections both hang off the project, so they are
   * refetched with it — the tree cannot be built from one without the others.
   */
  useEffect(() => {
    if (!projectId) return;
    YapiezService.listSources({ projectId })
      .then(setSources)
      .catch(() => setSources([]));
    YapiezService.listCollections({ projectId })
      .then(setCollections)
      .catch(() => setCollections([]));
  }, [projectId]);

  useEffect(() => {
    // Sources seed themselves on first read, so this also bootstraps the four
    // default tiers for a tenant that has never opened API Hub.
    YapiezService.listSources()
      .then(setSources)
      .catch(() => setSources([]));
    // The projects this user is on. Everything in the catalog is scoped by
    // project, the same way test scopes and bug folders are.
    ProjectService.getUserProjects(true)
      .then((res: any) => {
        const list: any[] = Array.isArray(res) ? res : res?.data ?? [];
        setProjects(
          list
            .map((project: any) => ({
              value: String(project.value ?? project.id ?? ""),
              label: String(project.label ?? project.name ?? ""),
              code: project.code || undefined,
              description: project.code || undefined,
            }))
            .filter((option) => option.value && option.label)
        );
      })
      .catch(() => setProjects([]))
      .finally(() => setProjectsLoading(false));
  }, []);

  // Deep link from the overview's empty state.
  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreateYapiezApi && projectId) {
      openCreate();
      router.replace("/api-hub");
    }
    // openCreate is stable enough for this one-shot deep link; re-running it on
    // every render of that function would reopen the editor under the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, canCreateYapiezApi, router, projectId]);

  /** The send base URL is per project — a host belongs to one, not to a user. */
  useEffect(() => {
    if (typeof window === "undefined" || !projectId) return;
    setSendBaseUrl(localStorage.getItem(`${BASE_URL_STORAGE_PREFIX}${projectId}`) ?? "");
  }, [projectId]);

  useEffect(() => {
    if (typeof window === "undefined" || !projectId) return;
    if (sendBaseUrl.trim()) localStorage.setItem(`${BASE_URL_STORAGE_PREFIX}${projectId}`, sendBaseUrl.trim());
    else localStorage.removeItem(`${BASE_URL_STORAGE_PREFIX}${projectId}`);
  }, [sendBaseUrl, projectId]);

  /**
   * Send the draft once and keep the response for the author to capture.
   *
   * The definition does not need to be saved first — you are usually still
   * writing it when you want to know what the endpoint actually returns.
   */
  const sendDraft = async () => {
    if (!editing.url?.trim()) {
      message.warning("Give the API a URL first");
      return;
    }

    // The bar holds the whole URL now, so a relative path has nothing to
    // resolve against unless this project already had a base URL remembered.
    if (!/^https?:\/\//i.test(editing.url.trim()) && !sendBaseUrl.trim()) {
      message.warning("This URL is relative and there is no base URL to resolve it against — give it a full URL.");
      return;
    }

    // The guard that matters: a write method genuinely creates, updates or
    // deletes data, and does it again on every click. Nothing about this is
    // undoable from here, so it cannot be reached by reflex.
    if (isWriteMethod(editing.method) && !allowWriteSend) {
      message.warning(
        `${editing.method} changes real data. Use a previous run, paste, or generate — or tick "Allow write requests" if you really mean to send it.`
      );
      return;
    }

    setSending(true);
    setTryResult(null);
    try {
      const result = await YapiezService.tryApi({
        definition: {
          method: editing.method,
          url: editing.url,
          headers: editing.headers,
          queryParams: editing.queryParams,
          pathParams: editing.pathParams,
          bodyType: editing.bodyType,
          requestBody: editing.requestBody,
          authType: editing.authType,
          authConfig: editing.authConfig,
          timeoutMs: editing.timeoutMs,
        },
        baseUrl: sendBaseUrl.trim() || null,
        authApiId: sendAuthApiId ?? null,
      });
      setTryResult(result);
      setActiveTab("response");
      if (result.response) {
        setLastCapture({
          status: result.response.statusCode,
          durationMs: result.response.durationMs,
          byteSize: result.response.size,
          source: "live send",
        });
      }

      if (result.error) message.error(result.error);
      else if (result.auth.error) message.warning(result.auth.error);
      else if (result.response && result.response.statusCode >= 400) {
        message.warning(`The API responded ${result.response.statusCode}.`);
      } else {
        message.success(`${result.response?.statusCode} in ${formatDuration(result.response?.durationMs)}`);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not send this request");
    } finally {
      setSending(false);
    }
  };

  /**
   * Copy a captured response into the definition as the expected result.
   *
   * Assertions and the schema are regenerated from it in the same step —
   * capturing a real response and then hand-writing checks against it is the
   * work this whole affordance exists to remove.
   */
  const captureAsExpected = (statusCode: number | null, rawBody: string, durationMs?: number | null) => {
    const { text } = formatJson(rawBody);
    const next: Partial<YapiezApi> = {
      ...editing,
      expectedStatus: statusCode ?? editing.expectedStatus ?? null,
      expectedResponse: text,
    };

    const { assertions } = assertionsFromSample(text, next.expectedStatus);
    // A known duration becomes a budget with headroom, never the observed time
    // itself — that would fail on the very next run.
    if (durationMs) assertions.push(responseTimeAssertion(durationMs));
    next.defaultAssertions = assertions;
    try {
      next.responseSchema = inferSchema(JSON.parse(text));
    } catch {
      // Not JSON — keep the sample, skip the schema. checkJson already says so.
    }

    setEditing(next);
    setActiveTab("response");
    message.success(
      `Captured as the expected result${assertions.length ? ` with ${assertions.length} assertion${assertions.length === 1 ? "" : "s"}` : ""}`
    );
  };

  /**
   * Real responses this API already produced inside a flow.
   *
   * The best non-destructive route: the request happened once, during a run
   * that was going to happen anyway, so reading it back costs nothing.
   */
  const openHistory = async () => {
    if (!editing.id) {
      message.info("Save this API first — recorded responses are kept against a saved definition.");
      return;
    }
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      setHistory(await YapiezService.capturedResponses(editing.id));
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not load past responses");
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  /**
   * Fix spelling and grammar in the description, changing nothing else.
   *
   * The server prompt protects endpoint paths, {{variables}}, header names and
   * anything in backticks, so a correction cannot quietly break a definition.
   */
  const fixDescriptionGrammar = async () => {
    const text = (editing.description ?? "").trim();
    if (!text) {
      message.warning("Write a description first");
      return;
    }

    setFixingGrammar(true);
    try {
      const result = await YapiezService.fixGrammar(text);
      if (!result.changed) {
        message.success("Nothing to correct — it already reads well");
        return;
      }
      setEditing((previous) => ({ ...previous, description: result.text }));
      message.success("Description corrected");
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not correct the text");
    } finally {
      setFixingGrammar(false);
    }
  };

  /**
   * Derive a shape from the request itself — no network, nothing created.
   *
   * A guess, and labelled as one: the point is to end up correcting a
   * structure rather than typing one into an empty box.
   */
  const generateOffline = () => {
    const sample = sampleFromRequest({
      method: editing.method ?? "GET",
      requestBody: editing.requestBody,
      bodyType: editing.bodyType,
      expectedStatus: editing.expectedStatus,
    });
    captureAsExpected(sample.status, sample.body);
    // Generated offline: the shape is a guess and there is no timing at all,
    // so the strip must not imply a measurement was taken.
    setLastCapture({
      status: sample.status,
      durationMs: null,
      byteSize: byteLengthOf(sample.body),
      source: "generated offline",
    });
    message.info(sample.note, 6);
  };

  /** The fallback when the API is not reachable from the server. */
  /** What the current paste would yield, recomputed as it is typed. */
  const pastePreview = useMemo(() => parseResponsePaste(pasteText), [pasteText]);

  const importPastedResponse = () => {
    if (!pastePreview.body && pastePreview.status === null) {
      message.warning("Nothing to import");
      return;
    }
    captureAsExpected(pastePreview.status, pastePreview.body, pastePreview.durationMs);
    setLastCapture({
      status: pastePreview.status,
      durationMs: pastePreview.durationMs,
      byteSize: pastePreview.byteSize,
      source: "pasted response",
    });
    setPasteText("");
    setPasteOpen(false);
  };

  /**
   * Create a deployment tier from inside the drawer and select it.
   *
   * The key is derived server-side from the label so it stays stable if the
   * tier is later renamed.
   */
  const createSource = async () => {
    const label = newSourceLabel.trim();
    if (!label) {
      message.warning("Give the source a name");
      return;
    }
    if (sources.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      message.warning("A source with that name already exists");
      return;
    }

    setCreatingSource(true);
    try {
      const created = await YapiezService.createSource({ label });
      setSources((previous) => [...previous, created].sort((a, b) => a.sort - b.sort));
      // Moving tier invalidates the chosen collection, which lives under the
      // old one — clear it rather than file the API somewhere unexpected.
      setEditing((previous) => ({ ...previous, sourceId: created.id, collectionId: null }));
      setNewSourceLabel("");
      setSourceModalOpen(false);
      message.success(`Source "${created.label}" created`);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not create this source");
    } finally {
      setCreatingSource(false);
    }
  };

  /** Everything the catalog shows for one project, refetched together. */
  const reloadCatalog = useCallback(() => {
    if (!projectId) return;
    YapiezService.listCollections({ projectId })
      .then(setCollections)
      .catch(() => setCollections([]));
    YapiezService.listSources({ projectId })
      .then(setSources)
      .catch(() => setSources([]));
    load();
  }, [projectId, load]);

  /**
   * Delete a module — the module, not what is filed under it.
   *
   * Settings goes first again, and it refuses while a test scope, case or
   * suite still names the module. That refusal has to stop the whole thing:
   * unfiling the catalog anyway would strip the endpoints of a module those
   * QA records still point at.
   */
  const deleteModule = async (card: ModuleCard) => {
    try {
      if (card.qaModuleId) {
        await deleteQaModule(card.qaModuleId);
      }
      const freed = await YapiezService.unfileModule({ projectId, name: card.name });
      await refetchModules();
      setOpenModules((previous) => {
        const nextOpen = new Set(previous);
        nextOpen.delete(card.key);
        return nextOpen;
      });
      reloadCatalog();
      message.success(
        `Module deleted — ${freed.collections} collection${freed.collections === 1 ? "" : "s"} and ${
          freed.apis
        } endpoint${freed.apis === 1 ? "" : "s"} are now unfiled`
      );
    } catch (error: any) {
      message.error(error?.response?.data?.error || error?.message || "Could not delete this module");
    }
  };

  /** Save the collection being edited from its card. */
  const saveCollection = async () => {
    if (!collectionEdit) return;
    const name = (collectionDraft.name ?? "").trim();
    if (!name) {
      message.warning("Give the collection a name");
      return;
    }

    setSavingCollection(true);
    try {
      await YapiezService.updateCollection(collectionEdit.id, {
        name,
        description: collectionDraft.description ?? null,
        moduleName: collectionDraft.moduleName ?? null,
        sourceId: collectionDraft.sourceId ?? null,
        projectId: collectionEdit.projectId,
      });
      setCollectionEdit(null);
      reloadCatalog();
      message.success("Collection updated");
    } catch (error: any) {
      message.error(error?.response?.data?.error || error?.message || "Could not save this collection");
    } finally {
      setSavingCollection(false);
    }
  };

  const removeCollection = async (collection: YapiezCollection) => {
    try {
      await YapiezService.deleteCollection(collection.id);
      setOpenCollections((previous) => {
        const nextOpen = new Set(previous);
        nextOpen.delete(collection.id);
        return nextOpen;
      });
      if (editing.collectionId === collection.id) {
        setEditing((current) => ({ ...current, collectionId: null }));
      }
      reloadCatalog();
      message.success(`"${collection.name}" moved to trash — its endpoints are ungrouped until it is restored`);
      loadTrash();
    } catch (error: any) {
      message.error(error?.response?.data?.error || error?.message || "Could not delete this collection");
    }
  };

  /**
   * Create a collection from inside the definition drawer and select it.
   *
   * The alternative — leaving to a settings page and coming back — loses the
   * definition being written, so this is the only sane place for it. The new
   * collection lands inside the module the definition is currently set to,
   * which is the only thing the author could have meant.
   */
  /**
   * Where a new collection will land — the tree row that opened the modal, or
   * failing that the module the open definition is filed under.
   */
  const collectionTargetModule = newCollectionModule ?? editing.moduleName?.trim() ?? null;

  const closeCollectionModal = () => {
    setCollectionModalOpen(false);
    setNewCollectionName("");
    setNewCollectionModule(null);
  };

  const createCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) {
      message.warning("Give the collection a name");
      return;
    }
    // Names are unique within a project, a module AND a source, so the check
    // must match all three — a global check would refuse a legitimate "Users"
    // under a second module, which is precisely what the tree is for.
    const targetModule = collectionTargetModule;
    const moduleKey = targetModule?.toLowerCase() ?? "";
    const clash = collections.some(
      (c) =>
        c.name.toLowerCase() === name.toLowerCase() &&
        (c.moduleName ?? "").toLowerCase() === moduleKey &&
        (c.sourceId ?? null) === (editing.sourceId ?? null) &&
        (c.projectId ?? null) === (editing.projectId ?? null)
    );
    if (clash) {
      message.warning("A collection with that name already exists in this module and source");
      return;
    }

    setCreatingCollection(true);
    try {
      const created = await YapiezService.createCollection({
        name,
        moduleName: targetModule,
        // Started from the tree, the collection belongs to the project the
        // tree is showing rather than to whatever happens to be open.
        sourceId: newCollectionModule ? null : editing.sourceId ?? null,
        projectId: newCollectionModule ? projectId : editing.projectId ?? null,
      });
      setCollections((previous) =>
        [...previous, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      // Only select it into the definition when the definition asked for it.
      if (!newCollectionModule) {
        setEditing((previous) => ({ ...previous, collectionId: created.id }));
      } else {
        setOpenCollections((previous) => new Set(previous).add(created.id));
      }
      closeCollectionModal();
      message.success(`Collection "${created.name}" created`);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not create this collection");
    } finally {
      setCreatingCollection(false);
    }
  };

  /**
   * Replace the request half of the definition from a pasted cURL command.
   *
   * Name, description, expected response and assertions are left alone: those
   * are the parts a person writes, and an import should not silently discard
   * them when someone re-imports to fix a URL.
   */
  const importCurl = () => {
    const { request: parsed, response } = parseCurlSession(curlText);
    if (!parsed) {
      message.error("That does not look like a cURL command with a URL in it.");
      return;
    }

    setEditing((previous) => ({
      ...previous,
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers,
      queryParams: parsed.queryParams,
      requestBody: parsed.body || previous.requestBody,
      bodyType: parsed.bodyType,
      // Credentials in the command become an explicit Basic auth config rather
      // than being dropped — but never a literal password left in a header.
      ...(parsed.basicAuth
        ? {
            authType: "basic" as AuthType,
            authConfig: { username: parsed.basicAuth.username, password: parsed.basicAuth.password },
          }
        : {}),
    }));

    setCurlText("");
    setCurlOpen(false);

    // If the paste was a terminal session rather than a bare command, its
    // output is the expected result — captured without sending anything.
    if (response && (response.status !== null || response.body.trim())) {
      captureAsExpected(response.status, response.body, response.durationMs);
      setLastCapture({
        status: response.status,
        durationMs: response.durationMs,
        byteSize: response.byteSize,
        source: "cURL session",
      });
      message.success(
        `Imported the request and captured its response${response.status ? ` (${response.status})` : ""}`
      );
      return;
    }

    setActiveTab("request");
    if (parsed.warnings.length) {
      message.warning(`Imported. ${parsed.warnings.join(" ")}`);
    } else {
      message.success("Imported from cURL — send it or paste a response to fill the expected result");
    }
  };

  /**
   * Start a new definition, filed wherever it was started from.
   *
   * "+ New" beside a collection in the tree means "in this collection", and
   * beside a module means "in this module" — the click already said where it
   * belongs, so the form does not ask again.
   */
  const openCreate = (where: { moduleName?: string | null; collectionId?: string | null } = {}) => {
    // Start in the tenant's default tier (Staging out of the box) rather than
    // unfiled — an API almost always belongs to one, and picking the common
    // case beats making every author choose.
    const defaultSource = sources.find((source) => source.isDefault) ?? sources[0];
    // The unfiled bucket is a view, not a module you can file something in.
    const moduleName = where.moduleName === UNFILED_MODULE ? null : where.moduleName ?? null;
    setEditing({
      ...emptyApi(),
      projectId,
      sourceId: sourceFilter ?? defaultSource?.id ?? null,
      moduleName,
      collectionId: where.collectionId ?? null,
    });
    setSelectedApiId(null);
    setShowTrash(false);
    setActiveTab("request");
    setTryResult(null);
    setLastCapture(null);
    setEditorOpen(true);
  };

  const openEdit = async (api: YapiezApi) => {
    try {
      // Refetch so the drawer edits the current definition, not a stale list row.
      const fresh = await YapiezService.getApi(api.id);
      setEditing(fresh);
      setSelectedApiId(fresh.id);
      setShowTrash(false);
      setActiveTab("request");
      setTryResult(null);
      setLastCapture(null);
      setEditorOpen(true);

      // Seed the metrics strip from the newest recorded run, so it says
      // something useful on open rather than only after you act. Failure is
      // silent — an absent measurement is not worth an error toast.
      YapiezService.capturedResponses(fresh.id)
        .then((entries) => {
          const newest = entries[0];
          if (!newest) return;
          setLastCapture({
            status: newest.statusCode,
            durationMs: newest.durationMs,
            byteSize: newest.body ? byteLengthOf(newest.body) : null,
            source: newest.flowName ? `${newest.flowName} #${newest.runNumber}` : "previous run",
          });
        })
        .catch(() => {});
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not open this API");
    }
  };

  /**
   * Open a new definition prefilled from an existing one. The server-owned
   * fields (id, timestamps, usage counts) are dropped so this saves as a
   * create; sourceId is kept so the copy lands in the same tier.
   */
  const duplicate = (api: YapiezApi) => {
    const copy: Partial<YapiezApi> = { ...api, name: `${api.name} (copy)` };
    delete copy.id;
    delete copy.createdAt;
    delete copy.updatedAt;
    delete copy.usedInFlows;
    delete copy.collectionName;
    delete copy.sourceLabel;
    delete copy.sourceColor;
    setEditing(copy);
    // A copy is a new, unsaved definition — nothing in the tree is selected
    // until it has been saved and has an id of its own.
    setSelectedApiId(null);
    setActiveTab("request");
    setTryResult(null);
    setLastCapture(null);
    setEditorOpen(true);
  };

  const save = async () => {
    if (!editing.name?.trim()) {
      message.warning("Give the API a name");
      return;
    }
    if (!editing.url?.trim()) {
      message.warning("Give the API a URL");
      return;
    }

    // Validate the payload here rather than letting a run fail on it later.
    if (editing.bodyType === "json" && editing.requestBody?.trim()) {
      try {
        JSON.parse(editing.requestBody);
      } catch {
        message.warning("The request payload is not valid JSON. Fix it, or switch the body type to Text.");
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        ...editing,
        // Empty strings are not valid uuids for the optional relations.
        collectionId: editing.collectionId || null,
        sourceId: editing.sourceId || null,
        // A module is a name, and a blank one means unfiled rather than "".
        moduleName: editing.moduleName?.trim() || null,
        expectedStatus: editing.expectedStatus || null,
      };
      // The workspace stays open on what you just saved, the way an editor
      // does — closing it would throw away the place you were working in.
      if (editing.id) {
        const updated = await YapiezService.updateApi(editing.id, payload);
        setEditing(updated);
        setSelectedApiId(updated.id);
        message.success("API updated");
      } else {
        const created = await YapiezService.createApi(payload);
        setEditing(created);
        setSelectedApiId(created.id);
        // Open the branch it landed in, so the tree shows where it went.
        if (created.collectionId) {
          setOpenCollections((previous) => new Set(previous).add(created.collectionId as string));
        }
        if (created.moduleName) {
          setOpenModules((previous) => new Set(previous).add(created.moduleName as string));
        }
        message.success("API added to the catalog");
      }
      reloadCatalog();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not save this API");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (api: YapiezApi) => {
    try {
      await YapiezService.deleteApi(api.id);
      // Deleting what the workspace was showing leaves it showing nothing.
      if (selectedApiId === api.id) closeEditor();
      message.success("Moved to trash");
      load();
      loadTrash();
    } catch (error: any) {
      // The server refuses to delete a definition a flow still uses, and names
      // them — surface that message rather than a generic failure.
      message.error(error?.response?.data?.error || "Could not delete this API");
    }
  };

  /** What the current cURL paste would yield, recomputed as it is typed. */
  const curlPreview = useMemo(
    () => (curlText.trim() ? parseCurlSession(curlText) : null),
    [curlText]
  );

  /** Credentials pasted in literally, which should be variables instead. */
  const curlSecrets = useMemo(
    () => (curlPreview?.request ? findLiteralSecrets(curlPreview.request.headers) : []),
    [curlPreview]
  );

  /**
   * Rewrite the pasted command so its credentials become {{variables}}.
   *
   * The command text is edited rather than the parsed result, so the review
   * above re-derives from it and the author sees exactly what changed before
   * importing. The rewriting itself lives in the authoring service, where it is
   * covered by tests — a regex loose enough to mangle a payload would be a bad
   * thing to discover in production.
   */
  const replaceCurlSecrets = () => {
    if (!curlSecrets.length) return;
    setCurlText(templateSecretsInCommand(curlText, curlSecrets));
    message.success(`Replaced with ${curlSecrets.map((secret) => `{{${secret.suggested}}}`).join(", ")}`);
  };

  /**
   * The header the current auth choice would actually put on the request.
   *
   * Auth is the setting whose effect is least visible, so it is spelled out
   * rather than described — a wrong header is the usual cause of a 401 that
   * nobody can explain.
   */
  const authPreview = useMemo(() => {
    const config = (editing.authConfig ?? {}) as Record<string, string>;
    switch (editing.authType) {
      case "none":
        return "No credential header";
      case "bearer":
        return `Authorization: Bearer ${config.token || "…"}`;
      case "basic":
        return `Authorization: Basic base64(${config.username || "…"}:${config.password ? "••••" : "…"})`;
      case "api_key":
        return `${config.headerName || "X-API-Key"}: ${config.value || "…"}`;
      case "inherit":
      default:
        return "Authorization: Bearer {{accessToken}}   — supplied by the login API on the send bar";
    }
  }, [editing.authType, editing.authConfig]);

  /** Every {{variable}} this definition expects to be supplied at run time. */
  const variablesInUse = useMemo(
    () =>
      variablesUsedBy({
        url: editing.url ?? "",
        headers: editing.headers ?? [],
        queryParams: editing.queryParams ?? [],
        pathParams: editing.pathParams ?? [],
        requestBody: editing.requestBody ?? "",
      }),
    [editing.url, editing.headers, editing.queryParams, editing.pathParams, editing.requestBody]
  );

  /** Live JSON validity for the payload — surfaced as you type, not on save. */
  const payloadJson = useMemo(
    () => (editing.bodyType === "json" ? checkJson(editing.requestBody) : { valid: true }),
    [editing.bodyType, editing.requestBody]
  );

  const sampleJson = useMemo(() => checkJson(editing.expectedResponse), [editing.expectedResponse]);

  /** URL placeholders with no row in the path params table yet. */
  const undeclaredPathParams = useMemo(
    () => missingPathParams(editing.url ?? "", editing.pathParams ?? []),
    [editing.url, editing.pathParams]
  );

  /**
   * The modules of the selected project, from QA Space → Settings → Modules —
   * the same list bugs, scopes and test cases are filed under. The catalog
   * does not curate a second one.
   */
  const {
    modules: projectModules,
    options: projectModuleOptions,
    refetch: refetchModules,
  } = useProjectQaModules(projectId);

  /**
   * The modules offered for the definition being written.
   *
   * Keyed off the definition's own project rather than the page's, so an
   * endpoint left shared across every project is offered the shared modules
   * instead of one project's private list.
   */
  const { options: drawerModuleOptions } = useProjectQaModules(editing.projectId ?? projectId);

  /** QA Settings' own "New module" modal, opened from the picker's pinned row. */
  const [moduleModalOpen, setModuleModalOpen] = useState(false);

  /**
   * Module names already on this project's endpoints but no longer in settings.
   *
   * A module deleted or renamed there must not silently empty the field on
   * every definition filed under it, so the old name stays selectable — the
   * same thing the Bug List does with its own module pills.
   */
  const legacyModules = useMemo(() => {
    const known = new Set(projectModuleOptions.map((option) => option.value.toLowerCase()));
    const found = new Map<string, string>();
    const note = (value: string | null | undefined) => {
      const name = value?.trim();
      if (name && !known.has(name.toLowerCase())) found.set(name.toLowerCase(), name);
    };
    allApis.forEach((api) => note(api.moduleName));
    collections.forEach((collection) => note(collection.moduleName));
    return Array.from(found.values()).sort((a, b) => a.localeCompare(b));
  }, [allApis, collections, projectModuleOptions]);

  /** The search term, matched the same way against every kind of node. */
  const needle = debouncedSearch.trim().toLowerCase();

  /** Does this endpoint match what was typed? Name, URL, and method all count. */
  const apiMatches = useCallback(
    (api: YapiezApi) =>
      !needle ||
      api.name.toLowerCase().includes(needle) ||
      api.url.toLowerCase().includes(needle) ||
      (api.method ?? "").toLowerCase().includes(needle) ||
      // The description is HTML now, so its tags are stripped before matching
      // — otherwise typing "strong" or "li" would hit every formatted one.
      (api.description ?? "")
        .replace(/<[^>]*>/g, " ")
        .toLowerCase()
        .includes(needle),
    [needle]
  );

  /**
   * The sidebar tree: every module, its collections, and the endpoints in each.
   *
   * Built here in one pass rather than fetched per branch, so opening a folder
   * is instant and searching does not go near the network. A branch survives
   * the search when it matches by name OR when anything inside it does — a
   * collection whose endpoints match is exactly what you were looking for.
   */
  const tree = useMemo(() => {
    const keyOf = (value: string | null | undefined) => (value ?? "").trim().toLowerCase();

    // Every module the project knows about, curated first, then names that
    // only exist on data, then the bucket for everything filed nowhere.
    const moduleNames: { key: string; name: string; curated: boolean; qaModuleId: string | null; description: string | null }[] = [
      ...projectModules
        .map((module: any) => ({
          key: String(module.module_name ?? module.name ?? ""),
          name: String(module.module_name ?? module.name ?? ""),
          curated: true,
          qaModuleId: String(module.id),
          description: module.description || null,
        }))
        .filter((entry) => entry.key)
        .sort((a, b) => a.name.localeCompare(b.name)),
      ...legacyModules.map((name) => ({
        key: name,
        name,
        curated: false,
        qaModuleId: null,
        description: "Not in Settings → Modules",
      })),
    ];

    const hasUnfiled =
      allApis.some((api) => !api.moduleName?.trim()) ||
      collections.some((collection) => !collection.moduleName?.trim());
    if (hasUnfiled) {
      moduleNames.push({
        key: UNFILED_MODULE,
        name: "Unfiled",
        curated: false,
        qaModuleId: null,
        description: "Not filed under any module",
      });
    }

    return moduleNames
      .map((module) => {
        const inThisModule = (value: string | null | undefined) =>
          module.key === UNFILED_MODULE ? !value?.trim() : keyOf(value) === keyOf(module.key);

        const moduleApis = allApis.filter((api) => inThisModule(api.moduleName));
        const moduleCollections = collections.filter((collection) => inThisModule(collection.moduleName));

        const children = moduleCollections
          .map((collection) => {
            const apis = moduleApis.filter((api) => api.collectionId === collection.id);
            const nameHit = !needle || collection.name.toLowerCase().includes(needle);
            const matched = nameHit ? apis : apis.filter(apiMatches);
            return { collection, apis, matched, visible: nameHit || matched.length > 0 };
          })
          .filter((entry) => entry.visible)
          .sort((a, b) => a.collection.name.localeCompare(b.collection.name));

        // Endpoints in this module but in no collection — a real place things
        // land, so it gets a node of its own rather than being hidden.
        const looseApis = moduleApis.filter(
          (api) => !api.collectionId || !moduleCollections.some((c) => c.id === api.collectionId)
        );
        const matchedLoose = looseApis.filter(apiMatches);

        // A module earns a row once something is actually filed under it.
        // Listing every curated module up front buried the two or three
        // holding endpoints under a wall of empty branches, so an empty one
        // stays out of the tree until an endpoint or collection lands in it.
        const hasContent = moduleApis.length > 0 || moduleCollections.length > 0;
        const nameHit = !needle || module.name.toLowerCase().includes(needle);
        const visible = hasContent && (nameHit || children.length > 0 || matchedLoose.length > 0);

        return {
          ...module,
          collections: children,
          looseApis: nameHit ? looseApis : matchedLoose,
          apiCount: moduleApis.length,
          collectionCount: moduleCollections.length,
          visible,
        };
      })
      .filter((module) => module.visible);
  }, [projectModules, legacyModules, allApis, collections, needle, apiMatches]);

  /**
   * Modules offered while writing a definition.  /**
   * Modules offered while writing a definition.
   *
   * The curated list, plus the value already on this definition even when
   * settings no longer lists it — otherwise opening an old endpoint would
   * quietly blank its module the moment you saved.
   */
  const moduleOptions = useMemo(() => {
    const options: SearchableDropdownOption[] = drawerModuleOptions.map((option) => ({
      value: option.value,
      label: option.value,
      description: option.description,
    }));
    const current = editing.moduleName?.trim();
    if (current && !options.some((option) => option.value.toLowerCase() === current.toLowerCase())) {
      options.unshift({
        value: current,
        label: current,
        description: "Not in Settings → Modules",
      });
    }
    // Pinned, so it stays reachable when the list is long and is the only
    // thing on offer when the project has no modules at all.
    options.push({
      value: CREATE_MODULE,
      label: "Create new module",
      description: "Add one without leaving this definition",
      badge: <Boxes size={13} />,
      pinned: true,
    });
    return options;
  }, [drawerModuleOptions, editing.moduleName]);

  /** Switching project empties the tree and closes whatever was open in it. */
  const chooseProject = (id: string | null) => {
    setProjectId(id);
    setSourceFilter(undefined);
    setSearch("");
    setOpenModules(new Set());
    setOpenCollections(new Set());
    setSelectedApiId(null);
    setEditorOpen(false);
    setShowTrash(false);
  };

  const toggleModule = (key: string) =>
    setOpenModules((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleCollection = (id: string) =>
    setOpenCollections((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /**
   * While searching, every surviving branch is open.
   *
   * A search that leaves you clicking folders open to find out whether the hit
   * is inside them has not finished the job it started.
   */
  const isModuleOpen = (key: string) => Boolean(needle) || openModules.has(key);
  const isCollectionOpen = (id: string) => Boolean(needle) || openCollections.has(id);

  /**
   * Drag the tree column wider.
   *
   * Listeners go on the window, not the handle: the pointer routinely leaves a
   * 6px strip mid-drag, and a handle-bound listener would drop the drag the
   * moment it did.
   */
  const startResizing = (event: React.MouseEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sidebarWidth;

    const onMove = (move: MouseEvent) => {
      const next = startWidth + (move.clientX - startX);
      setSidebarWidth(Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, next)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.userSelect = "";
    };

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /** What is in the trash for this project. */
  const loadTrash = useCallback(async () => {
    if (!projectId) {
      setTrash([]);
      return;
    }
    setTrashLoading(true);
    try {
      setTrash(await YapiezService.listTrash({ projectId }));
    } catch {
      setTrash([]);
    } finally {
      setTrashLoading(false);
    }
  }, [projectId]);

  // Kept current even while the tree is what you are looking at, so the count
  // beside "Trash" is right the moment something lands in it.
  useEffect(() => {
    loadTrash();
  }, [loadTrash]);

  const restoreFromTrash = async (entry: YapiezTrashEntry) => {
    try {
      await YapiezService.restoreFromTrash({ kind: entry.kind, id: entry.id });
      message.success(`"${entry.name}" restored`);
      loadTrash();
      reloadCatalog();
    } catch (error: any) {
      message.error(error?.response?.data?.error || error?.message || "Could not restore this");
    }
  };

  const purgeFromTrash = async (entry: YapiezTrashEntry) => {
    try {
      await YapiezService.purgeFromTrash({ kind: entry.kind, id: entry.id });
      message.success(`"${entry.name}" deleted for good`);
      loadTrash();
    } catch (error: any) {
      message.error(error?.response?.data?.error || error?.message || "Could not delete this");
    }
  };

  const emptyTrash = async () => {
    try {
      const removed = await YapiezService.emptyTrash({ projectId });
      message.success(
        `Trash emptied — ${removed.apis} endpoint${removed.apis === 1 ? "" : "s"} and ${
          removed.collections
        } collection${removed.collections === 1 ? "" : "s"} gone for good`
      );
      loadTrash();
    } catch (error: any) {
      message.error(error?.response?.data?.error || error?.message || "Could not empty the trash");
    }
  };

  /** Put the workspace back to its empty state without touching the tree. */
  const closeEditor = () => {
    setEditorOpen(false);
    setSelectedApiId(null);
    setTryResult(null);
    setLastCapture(null);
  };

  /** Modules offered when moving a collection, with what each already holds. */
  const moduleChoices = useMemo(
    () =>
      tree
        .filter((module) => module.key !== UNFILED_MODULE)
        .map((module) => ({
          value: module.name,
          label: module.name,
          description: `${module.collectionCount} collection${
            module.collectionCount === 1 ? "" : "s"
          } · ${module.apiCount} API${module.apiCount === 1 ? "" : "s"}`,
        })),
    [tree]
  );

  const pickerProjects = projects;
  const visiblePickerProjects = showAllPickerProjects
    ? pickerProjects
    : pickerProjects.slice(0, PROJECT_PICKER_PREVIEW);
  const hiddenPickerCount = Math.max(0, pickerProjects.length - PROJECT_PICKER_PREVIEW);

  /** Deployment tiers, with a pinned "create" row. */
  const sourceOptions = useMemo(
    () => [
      ...sources.map((source) => {
        // Same glyph the rail uses, so a tier looks like itself everywhere.
        const Icon = sourceIcon(source);
        return {
          value: source.id,
          label: source.label,
          description:
            source.description || `${source.apiCount ?? 0} API${source.apiCount === 1 ? "" : "s"}`,
          badge: (
            <span style={{ display: "inline-flex", color: source.color || "#64748b" }}>
              <Icon size={13} />
            </span>
          ),
        };
      }),
      {
        value: "__create_new__",
        label: "Create new source",
        description: "Add a deployment tier",
        badge: <Layers3 size={13} />,
        pinned: true,
      },
    ],
    [sources]
  );

  /**
   * Collections offered for the module and tier the definition is set to.
   *
   * Unfiled collections — no module, or no tier — are always offered: one is
   * still a legitimate place to file an API, and hiding them would strand
   * data that already exists.
   */
  const collectionOptions = useMemo(() => {
    const inScope = collections.filter((collection) => {
      const moduleOk =
        !editing.moduleName ||
        !collection.moduleName ||
        collection.moduleName.trim().toLowerCase() === editing.moduleName.trim().toLowerCase();
      const sourceOk =
        !editing.sourceId || collection.sourceId === editing.sourceId || !collection.sourceId;
      // A shared collection (no project) is valid under any project.
      const projectOk =
        !editing.projectId || collection.projectId === editing.projectId || !collection.projectId;
      return moduleOk && sourceOk && projectOk;
    });

    return [
      ...inScope.map((collection) => ({
        value: collection.id,
        label: collection.name,
        description: collection.moduleName
          ? `${collection.moduleName} · ${collection.apiCount ?? 0} API${collection.apiCount === 1 ? "" : "s"}`
          : `No module · ${collection.apiCount ?? 0} API${collection.apiCount === 1 ? "" : "s"}`,
      })),
      {
        value: "__create_new__",
        label: "Create new collection",
        description: editing.moduleName
          ? `Added inside ${editing.moduleName}`
          : "Add one without leaving this definition",
        badge: <FolderPlus size={13} />,
        pinned: true,
      },
    ];
  }, [collections, editing.moduleName, editing.sourceId, editing.projectId]);

  const onProjectChange = (value: string) => {
    const next = value || null;
    if (next === (editing.projectId ?? null)) return;
    // Modules belong to a project, so the one currently selected cannot be
    // assumed to exist in the new one. Clearing it and asking again beats
    // filing the endpoint under a name the new project has never heard of —
    // and the collection goes with it, since it lived inside that module.
    setEditing({ ...editing, projectId: next, moduleName: null, collectionId: null });
  };

  const onSourceChange = (value: string) => {
    if (value === "__create_new__") {
      setSourceModalOpen(true);
      return;
    }
    // The selected collection belongs to the old tier, so it cannot survive a
    // tier change — clear it unless it is an unfiled collection, which is
    // valid under any tier.
    const current = collections.find((c) => c.id === editing.collectionId);
    const keepCollection = !current || !current.sourceId || current.sourceId === value;
    setEditing({
      ...editing,
      sourceId: value || null,
      collectionId: keepCollection ? editing.collectionId : null,
    });
  };

  const onModuleChange = (value: string) => {
    if (value === CREATE_MODULE) {
      setModuleModalOpen(true);
      return;
    }
    const next = value || null;
    // A collection lives inside one module, so it cannot follow the definition
    // into another — kept only when it is unfiled, which belongs anywhere.
    const current = collections.find((c) => c.id === editing.collectionId);
    const keepCollection =
      !current ||
      !current.moduleName ||
      (next && current.moduleName.trim().toLowerCase() === next.trim().toLowerCase());
    setEditing({
      ...editing,
      moduleName: next,
      collectionId: keepCollection ? editing.collectionId : null,
    });
  };

  /**
   * Files the definition under the module that was just created.
   *
   * Same contract as the New collection modal: what you just added is
   * selected for the open definition straight away, so the picker you came
   * from is answered rather than left for you to reopen.
   */
  const onModuleCreated = async (saved?: { module_name?: string; project_id?: string | null }) => {
    await refetchModules();
    const name = saved?.module_name?.trim();
    if (!name) return;
    // Filed on another project, it is not on offer here — selecting it would
    // put a name on the definition that this project's picker cannot show.
    const target = editing.projectId ?? projectId;
    if (saved?.project_id && target && String(saved.project_id) !== String(target)) return;
    onModuleChange(name);
  };

  const onCollectionChange = (value: string) => {
    if (value === "__create_new__") {
      setCollectionModalOpen(true);
      return;
    }
    // Picking a collection settles the module and the tier too — an API's
    // place in the tree IS its collection's, so the pickers must never
    // disagree. An unfiled collection settles nothing, so it leaves them be.
    const picked = collections.find((c) => c.id === value);
    setEditing({
      ...editing,
      collectionId: value || null,
      moduleName: picked?.moduleName ?? editing.moduleName ?? null,
      sourceId: picked?.sourceId ?? editing.sourceId ?? null,
      projectId: picked?.projectId ?? editing.projectId ?? null,
    });
  };

  /**
   * Fill the response schema and a starting set of assertions from the sample.
   *
   * The generated assertions check shape, never the sample's literal values —
   * asserting `id equals 101` from a sample would fail on every real run.
   */
  const generateFromSample = () => {
    const trimmed = (editing.expectedResponse ?? "").trim();
    if (!trimmed) {
      message.warning("Paste a sample response first");
      return;
    }

    const { assertions, error } = assertionsFromSample(trimmed, editing.expectedStatus);
    let responseSchema = editing.responseSchema ?? {};
    try {
      responseSchema = inferSchema(JSON.parse(trimmed));
    } catch {
      // checkJson already tells the author the sample is not JSON; keep the
      // existing schema rather than replacing it with nonsense.
    }

    setEditing({ ...editing, defaultAssertions: assertions, responseSchema });

    if (error) message.warning(error);
    else message.success(`Generated ${assertions.length} assertion${assertions.length === 1 ? "" : "s"} and a response schema`);
  };

  // The catalog is one project's catalog. Until one is chosen there is nothing
  // honest to show, so the page is the picker rather than an empty table.
  if (!projectId) {
    return (
      <MainLayout>
        <ProjectPicker
          projects={visiblePickerProjects}
          loading={projectsLoading}
          allOptions={pickerProjects}
          hiddenCount={hiddenPickerCount}
          expanded={showAllPickerProjects}
          onToggleExpanded={() => setShowAllPickerProjects((value) => !value)}
          onChoose={chooseProject}
        />
      </MainLayout>
    );
  }

  return (
    // A workspace fills its frame: the layout's 8px gutter would leave a
    // pale strip between the app's nav rail and this sidebar.
    <MainLayout noPadding>
      {/* ── The workspace ──
             Sidebar on the left holding the whole catalog as one tree —
             Module → Collection → endpoint — and the endpoint you picked
             filling everything to the right of it. Two panes, no navigation
             between them: clicking a leaf swaps what the right pane shows and
             nothing else moves. */}
      <div className="ph-shell">
        <aside className="ph-side" style={{ width: sidebarWidth }}>
          <div className="ph-side-head">
            <span className="ph-brand-mark">
              <Plug2 size={16} />
            </span>
            <span className="ph-brand-text">
              <span className="ph-brand-name">API Hub</span>
              <span className="ph-brand-sub">Endpoint catalog</span>
            </span>
            {canCreateYapiezApi && (
              <Tooltip
                title={<ActionTip label="New endpoint" detail="Unfiled — pick its module and collection as you write it" />}
                overlayClassName="ph-tip"
                mouseEnterDelay={0.3}
              >
                <button type="button" className="ph-new-btn" onClick={() => openCreate()} aria-label="New endpoint">
                  <Plus size={15} />
                </button>
              </Tooltip>
            )}
          </div>

          <div className="ph-side-scope">
            <ProjectSwitcher projects={projects} projectId={projectId} onChoose={chooseProject} />
          </div>

          <div className="ph-side-filters">
            <Input
              allowClear
              prefix={<Search size={14} style={{ color: "#94a3b8", marginRight: 1 }} />}
              placeholder="Search this catalog"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ph-search"
            />
            <SearchableDropdown
              value={sourceFilter ?? null}
              onChange={(value: string) => setSourceFilter(value || undefined)}
              options={sources.map((source) => ({
                value: source.id,
                label: source.label,
                description: source.description ?? undefined,
              }))}
              placeholder="All sources"
              itemNoun="sources"
              width={sidebarWidth - 24}
              style={{ width: "100%" }}
            />
          </div>

          {/* The tree's own header: what it is, and the two controls that act
              on the whole of it rather than on any one branch. */}
          <div className="ph-tree-bar">
            <span className="ph-tree-bar-label">Catalog</span>
            <span className="ph-tree-bar-count">
              {allApis.length} endpoint{allApis.length === 1 ? "" : "s"}
            </span>
            <Tooltip
              title={<ActionTip label="Expand all" detail="Open every module and collection" />}
              overlayClassName="ph-tip"
              mouseEnterDelay={0.3}
            >
              <button
                type="button"
                className="ph-tree-bar-btn"
                aria-label="Expand all"
                onClick={() => {
                  setOpenModules(new Set(tree.map((module) => module.key)));
                  setOpenCollections(
                    new Set(tree.flatMap((module) => module.collections.map((entry) => entry.collection.id)))
                  );
                }}
              >
                <ChevronsUpDown size={13} />
              </button>
            </Tooltip>
            <Tooltip
              title={<ActionTip label="Collapse all" detail="Back to the module list" />}
              overlayClassName="ph-tip"
              mouseEnterDelay={0.3}
            >
              <button
                type="button"
                className="ph-tree-bar-btn"
                aria-label="Collapse all"
                onClick={() => {
                  setOpenModules(new Set());
                  setOpenCollections(new Set());
                }}
              >
                <ChevronsDownUp size={13} />
              </button>
            </Tooltip>
          </div>

          <div className="ph-tree">
            {loading && !allApis.length ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
                <ZukvoLoader size="md" />
              </div>
            ) : !tree.length ? (
              <div className="ph-tree-empty">
                <Text style={{ fontSize: 12, color: "var(--text-secondary)", display: "block" }}>
                  {needle ? "Nothing matches that." : "Nothing filed in this catalog yet."}
                </Text>
                {!needle && (
                  <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    A module appears here once an endpoint or collection is filed under it.
                  </Text>
                )}
              </div>
            ) : (
              tree.map((module) => (
                <ModuleBranch
                  key={module.key}
                  module={module}
                  open={isModuleOpen(module.key)}
                  onToggle={() => toggleModule(module.key)}
                  isCollectionOpen={isCollectionOpen}
                  onToggleCollection={toggleCollection}
                  selectedApiId={selectedApiId}
                  onSelectApi={openEdit}
                  canCreate={canCreateYapiezApi}
                  canUpdate={canUpdateYapiezApi}
                  canDelete={canDeleteYapiezApi}
                  onNewApi={openCreate}
                  onNewCollection={(moduleName) => {
                    setNewCollectionModule(moduleName === UNFILED_MODULE ? null : moduleName);
                    setNewCollectionName("");
                    setCollectionModalOpen(true);
                  }}
                  onManageModules={() => router.push("/qa-workspace/settings")}
                  onDeleteModule={deleteModule}
                  onEditCollection={(collection) => {
                    setCollectionEdit(collection);
                    setCollectionDraft({ ...collection });
                  }}
                  onDeleteCollection={removeCollection}
                  onDuplicateApi={duplicate}
                  onDeleteApi={remove}
                />
              ))
            )}
          </div>

          {/* Pinned below the tree: the trash never scrolls away, because the
              moment you want it is the moment you have just deleted something
              and are looking at the wrong end of a long list. */}
          <button
            type="button"
            className={`ph-trash-row${showTrash ? " is-active" : ""}`}
            onClick={() => setShowTrash((open) => !open)}
            aria-pressed={showTrash}
          >
            <Trash2 size={14} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, textAlign: "left" }}>Trash</span>
            {trash.length > 0 && <span className="ph-trash-count">{trash.length}</span>}
          </button>

          <div
            className="ph-side-resizer"
            role="separator"
            aria-orientation="vertical"
            onMouseDown={startResizing}
          />
        </aside>

        <section className="ph-main">
          {showTrash ? (
            <TrashPane
              entries={trash}
              loading={trashLoading}
              canRestore={canUpdateYapiezApi}
              canPurge={canDeleteYapiezApi}
              onRestore={restoreFromTrash}
              onPurge={purgeFromTrash}
              onEmpty={emptyTrash}
              onClose={() => setShowTrash(false)}
            />
          ) : !editorOpen ? (
            <WorkspaceEmpty canCreate={canCreateYapiezApi} onCreate={() => openCreate()} />
          ) : (
            <>
              {/* ── Request bar: what this endpoint is, and the one button
                     that actually calls it. Everything below is detail. ── */}
              <div className="ph-reqbar">
                <div className="ph-reqbar-top">
                  <span className="ph-crumbs">
                    <span>{editing.moduleName || "Unfiled"}</span>
                    <span className="ph-crumb-sep">/</span>
                    <span>{collections.find((c) => c.id === editing.collectionId)?.name ?? "Ungrouped"}</span>
                  </span>
                  <span style={{ flex: 1 }} />
                  {/* Leaving comes first: it is the one control here that is
                      about this panel rather than about the endpoint in it. */}
                  <Button size="small" icon={<X size={13} />} onClick={closeEditor}>
                    Close
                  </Button>
                  <Tooltip title="Paste a cURL command — from your browser's network tab, Postman, or by hand">
                    <Button size="small" icon={<TerminalSquare size={13} />} onClick={() => setCurlOpen(true)}>
                      Import cURL
                    </Button>
                  </Tooltip>
                  <Button size="small" type="primary" loading={saving} onClick={save}>
                    {editing.id ? "Save" : "Save to catalog"}
                  </Button>
                </div>

                <input
                  className="ph-name-input"
                  placeholder="Untitled endpoint"
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />

                <div className="ph-urlbar">
                  <SearchableDropdown
                    value={editing.method ?? "GET"}
                    onChange={(method: HttpMethod) => setEditing({ ...editing, method })}
                    options={HTTP_METHODS.map((m) => ({
                      value: m,
                      label: m,
                      badge: (
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: METHOD_COLORS[m].text,
                            display: "inline-block",
                          }}
                        />
                      ),
                    }))}
                    allowClear={false}
                    width={180}
                    customTrigger={
                      <button type="button" aria-label="HTTP method" className="ph-method-trigger">
                        <span style={{ color: METHOD_COLORS[(editing.method ?? "GET") as HttpMethod].text }}>
                          {editing.method ?? "GET"}
                        </span>
                        <ChevronDown size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      </button>
                    }
                  />
                  <span className="ph-urlbar-sep" />
                  {/* One field, holding the whole URL. A relative path still
                      works — it resolves against the environment's base URL
                      at run time, the same way {{baseUrl}} does. */}
                  <input
                    className="ph-url-input"
                    placeholder="https://staging.example.com/api/users/{userId}"
                    value={editing.url ?? ""}
                    onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                    title="The full URL. A relative path resolves against the base URL of whatever environment runs it."
                  />
                  {isWriteMethod(editing.method) && (
                    <Tooltip
                      title={`${editing.method} changes real data, and does it again on every click. Nothing here can undo that.`}
                    >
                      <label className="ph-write-guard">
                        <Switch size="small" checked={allowWriteSend} onChange={setAllowWriteSend} />
                        <span>Allow writes</span>
                      </label>
                    </Tooltip>
                  )}
                  <Tooltip
                    title={
                      isWriteMethod(editing.method) && !allowWriteSend
                        ? `${editing.method} is blocked — it would change real data. Tick "Allow writes" if you really mean to send it.`
                        : "Send this request and capture the real status and response"
                    }
                  >
                    <span>
                      <Button
                        type="primary"
                        danger={isWriteMethod(editing.method) && allowWriteSend}
                        icon={<Send size={13} />}
                        loading={sending}
                        disabled={isWriteMethod(editing.method) && !allowWriteSend}
                        onClick={sendDraft}
                        className="ph-send"
                      >
                        Send
                      </Button>
                    </span>
                  </Tooltip>
                </div>
              </div>

              <div className="ph-body" style={{ padding: "16px 20px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
            {/* ── Where it is filed ──
                   The name, the method and the URL are the request bar's, up
                   in the header where they stay visible while you work. This
                   block is only the filing. ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field
                label="Project"
                icon={FolderKanban}
                info="Scopes the definition the way it scopes test scopes and bug folders. Leave it blank to share the endpoint with every project."
              >
                <SearchableDropdown
                  value={editing.projectId ?? null}
                  onChange={onProjectChange}
                  options={projects}
                  placeholder="Shared across all projects"
                  itemNoun="projects"
                  width={420}
                />
              </Field>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Field
                  label="Source"
                  style={{ flex: "1 1 220px" }}
                  icon={Layers3}
                  info="The deployment tier this definition describes — Local, Staging, Prod."
                >
                  <SearchableDropdown
                    value={editing.sourceId ?? null}
                    onChange={onSourceChange}
                    options={sourceOptions}
                    placeholder="No source"
                    itemNoun="sources"
                    width={320}
                  />
                </Field>
                <Field
                  label="Module"
                  style={{ flex: "1 1 220px" }}
                  icon={Boxes}
                  info="The area of the product. Curated in QA Space → Settings → Modules, so the catalog and the bug list file work under the same names."
                >
                  <SearchableDropdown
                    value={editing.moduleName ?? null}
                    onChange={onModuleChange}
                    options={moduleOptions}
                    placeholder={drawerModuleOptions.length ? "Unfiled" : "No modules in this project yet"}
                    itemNoun="modules"
                    width={320}
                  />
                </Field>
                <Field
                  label="Collection"
                  style={{ flex: "1 1 220px" }}
                  icon={FolderPlus}
                  info="A group of related endpoints inside the module — Users, Invoices, Webhooks."
                >
                  <SearchableDropdown
                    value={editing.collectionId ?? null}
                    onChange={onCollectionChange}
                    options={collectionOptions}
                    placeholder="Ungrouped"
                    itemNoun="collections"
                    width={320}
                  />
                </Field>
              </div>
              <Field
                label="Description"
                icon={FileText}
                action={
                  <Tooltip title="Fix spelling and grammar. Endpoint paths, {{variables}} and header names are left untouched.">
                    <Button
                      size="small"
                      type="text"
                      icon={<SpellCheck size={13} />}
                      loading={fixingGrammar}
                      disabled={!editing.description?.trim()}
                      onClick={fixDescriptionGrammar}
                      style={{ fontSize: 11.5, color: "#1d4ed8" }}
                    >
                      Grammar correction
                    </Button>
                  </Tooltip>
                }
              >
                {/* A description is the one field here that is prose rather
                    than a value — the place someone explains a quirk, lists a
                    precondition, links the ticket. A plain textarea made all
                    of that one grey paragraph. */}
                <TiptapEditor
                  content={editing.description ?? ""}
                  onChange={(html) => setEditing((previous) => ({ ...previous, description: html }))}
                  placeholder="What this endpoint does, and anything QA needs to know before calling it."
                  minHeight={130}
                  maxHeight={420}
                />
              </Field>

              {/* A flag, not a field — it earns an inline row, not a column. */}
              <label style={{ display: "inline-flex", alignItems: "center", gap: 9, cursor: "pointer" }}>
                <Switch
                  size="small"
                  checked={!!editing.isDeprecated}
                  onChange={(checked) => setEditing({ ...editing, isDeprecated: checked })}
                />
                <span>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Deprecated</Text>
                  <Text style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 7 }}>
                    Hidden from the default catalog view
                  </Text>
                </span>
              </label>
            </div>

            <SectionDivider />

            {/* ── Tabs ── */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-color)" }}>
              {(
                [
                  ["request", "Request"],
                  ["response", "Expected response"],
                  ["auth", "Authentication"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: "7px 14px",
                    fontSize: 12.5,
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${activeTab === key ? "#2563eb" : "transparent"}`,
                    color: activeTab === key ? "#1d4ed8" : "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "request" && (
              <>
                <RequestMetrics
                  payloadBytes={
                    editing.bodyType !== "none" && editing.requestBody
                      ? byteLengthOf(editing.requestBody)
                      : 0
                  }
                  lastCapture={lastCapture}
                  onOpenCapture={() => setActiveTab("response")}
                />

                <Field
                  label="Headers"
                  icon={ListIcon}
                  hint={headersOpen ? "Toggle a row off to document it without sending it" : undefined}
                  action={
                    <Button
                      size="small"
                      type="text"
                      onClick={() => setHeadersOpen((previous) => !previous)}
                      style={{ fontSize: 11.5, color: "var(--text-secondary)" }}
                      icon={headersOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    >
                      {headersOpen
                        ? "Hide"
                        : `Show${(editing.headers ?? []).length ? ` (${(editing.headers ?? []).length})` : ""}`}
                    </Button>
                  }
                >
                  {headersOpen ? (
                    <KeyValueEditor
                      value={editing.headers ?? []}
                      onChange={(headers) => setEditing({ ...editing, headers })}
                      keyPlaceholder="Content-Type"
                      valuePlaceholder="application/json"
                      addLabel="Add header"
                      bulkPasteLabel="Paste headers"
                      bulkPasteHint="One header per line, as `Name: value`. Paste a block straight from your docs or browser."
                    />
                  ) : (
                    /* Collapsed: still say what is in there, so hiding the table
                       never hides the fact that headers are being sent. */
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {(editing.headers ?? []).length === 0 ? (
                        <Text style={{ fontSize: 11.5, color: "var(--text-secondary)", fontStyle: "italic" }}>
                          No headers
                        </Text>
                      ) : (
                        (editing.headers ?? []).map((header, index) => (
                          <span
                            key={`${header.key}-${index}`}
                            style={{
                              padding: "1px 8px",
                              borderRadius: 5,
                              fontSize: 11,
                              fontFamily: "ui-monospace, monospace",
                              color: header.enabled === false ? "var(--text-secondary)" : "#1d4ed8",
                              background: header.enabled === false ? "var(--bg-slate-50)" : "var(--bg-blue-50)",
                              border: `1px solid ${
                                header.enabled === false ? "var(--border-color)" : "var(--border-blue-200)"
                              }`,
                              textDecoration: header.enabled === false ? "line-through" : "none",
                            }}
                          >
                            {header.key || "(unnamed)"}
                          </span>
                        ))
                      )}
                    </div>
                  )}
                </Field>

                <DottedDivider />

                <Field label="Query parameters" icon={Search}>
                  <KeyValueEditor
                    value={editing.queryParams ?? []}
                    onChange={(queryParams) => setEditing({ ...editing, queryParams })}
                    keyPlaceholder="page"
                    valuePlaceholder="1"
                    addLabel="Add query param"
                    bulkPasteLabel="Paste params"
                    bulkPasteHint="One per line, as `name=value` or `name: value`."
                  />
                </Field>

                <DottedDivider />

                <Field
                  label="Path parameters"
                  icon={Route}
                  hint="Names match the placeholders in the URL — :userId, {userId} and {{userId}} all work"
                >
                  {/* The URL is the source of truth for which placeholders exist,
                      so an undeclared one is offered rather than left to be noticed. */}
                  {undeclaredPathParams.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        flexWrap: "wrap",
                        padding: "8px 10px",
                        marginBottom: 8,
                        borderRadius: 8,
                        background: "var(--bg-blue-50)",
                        border: "1px solid var(--border-blue-200)",
                      }}
                    >
                      <Text style={{ fontSize: 11.5, color: "#1e40af" }}>
                        The URL uses{" "}
                        <strong>{undeclaredPathParams.join(", ")}</strong> but{" "}
                        {undeclaredPathParams.length === 1 ? "it has" : "they have"} no row here.
                      </Text>
                      <Button
                        size="small"
                        type="primary"
                        onClick={() =>
                          setEditing({
                            ...editing,
                            pathParams: [
                              ...(editing.pathParams ?? []),
                              // Default each to the run variable of the same name —
                              // the overwhelmingly common case in a flow.
                              ...undeclaredPathParams.map((key) => ({
                                key,
                                value: `{{${key}}}`,
                                enabled: true,
                              })),
                            ],
                          })
                        }
                      >
                        Add {undeclaredPathParams.length === 1 ? "it" : "them"}
                      </Button>
                    </div>
                  )}
                  <KeyValueEditor
                    value={editing.pathParams ?? []}
                    onChange={(pathParams) => setEditing({ ...editing, pathParams })}
                    keyPlaceholder="userId"
                    valuePlaceholder="{{userId}}"
                    addLabel="Add path param"
                  />
                </Field>

                <DottedDivider />

                {/* ── Body ──
                       Header strip and payload are one panel, not a settings
                       row followed by an unrelated field. The type you pick
                       decides what the box below is, so putting a border
                       between them made you look in two places to answer one
                       question. ── */}
                <div className="ph-body-panel">
                  <div className="ph-body-head">
                    <span className="ph-body-title">
                      <span className="ph-body-icon">
                        <FileJson2 size={12} />
                      </span>
                      Body
                    </span>

                    <Segmented
                      size="small"
                      value={editing.bodyType}
                      onChange={(bodyType) => setEditing({ ...editing, bodyType: bodyType as BodyType })}
                      className="ph-body-seg"
                      options={BODY_TYPES.map((type) => ({
                        value: type,
                        label: (
                          <span className="ph-body-seg-item">
                            {BODY_TYPE_META[type].label}
                            {/* A body that will not parse is the one thing you
                                need to know without opening the tab. */}
                            {type === "json" &&
                              editing.bodyType === "json" &&
                              !!editing.requestBody?.trim() &&
                              !payloadJson.valid && <span className="ph-body-seg-dot" />}
                          </span>
                        ),
                      }))}
                    />

                    <span style={{ flex: 1, minWidth: 4 }} />

                    <span className="ph-body-title">
                      <span className="ph-body-icon is-muted">
                        <Timer size={12} />
                      </span>
                      Timeout
                    </span>
                    <Input
                      size="small"
                      type="number"
                      placeholder="30000"
                      value={editing.timeoutMs ?? ""}
                      onChange={(e) =>
                        setEditing({ ...editing, timeoutMs: e.target.value ? Number(e.target.value) : null })
                      }
                      suffix={<span style={{ fontSize: 10.5, color: "var(--text-secondary)" }}>ms</span>}
                      style={{ width: 116 }}
                    />
                    <Tooltip title="Blank uses the server default (30s), capped at 120s.">
                      <span style={{ display: "inline-flex", color: "#94a3b8", cursor: "help" }}>
                        <Info size={13} />
                      </span>
                    </Tooltip>
                  </div>

                  {editing.bodyType === "none" ? (
                    <div className="ph-body-empty">
                      <Minus size={15} style={{ color: "#94a3b8" }} />
                      <Text style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                        This request sends no body
                      </Text>
                      <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                        Pick JSON, Form or Text above to add one.
                      </Text>
                    </div>
                  ) : (
                    <>
                      <TextArea
                        variant="borderless"
                        autoSize={{ minRows: 9, maxRows: 24 }}
                        value={editing.requestBody ?? ""}
                        onChange={(e) => setEditing({ ...editing, requestBody: e.target.value })}
                        placeholder={BODY_TYPE_META[(editing.bodyType ?? "json") as BodyType].placeholder}
                        className="ph-body-input"
                      />

                      <div className="ph-body-foot">
                        {editing.bodyType === "json" ? (
                          <JsonBar
                            state={payloadJson}
                            hasContent={!!editing.requestBody?.trim()}
                            onFormat={() => {
                              const { text, error } = formatJson(editing.requestBody ?? "");
                              if (error) message.warning(`Cannot format: ${error}`);
                              else setEditing({ ...editing, requestBody: text });
                            }}
                          />
                        ) : (
                          <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                            {BODY_TYPE_META[(editing.bodyType ?? "text") as BodyType].hint}
                          </Text>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {editing.bodyType !== "none" && (
                  <Text style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: -10 }}>
                    {"{{variables}}"} are substituted at run time — {"{{userId}}"}, {"{{accessToken}}"},
                    anything a previous step saved.
                  </Text>
                )}

                {variablesInUse.length > 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "var(--bg-blue-50)",
                      border: "1px solid var(--border-blue-200)",
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: 700, color: "#1e3a8a", display: "block" }}>
                      Variables this API expects
                    </Text>
                    <Text style={{ fontSize: 11.5, color: "#1e40af" }}>
                      {variablesInUse.map((v) => `{{${v}}}`).join("  ")} — {"{{baseUrl}}"} comes from the
                      environment a run uses, and {"{{accessToken}}"} from the login API picked for the send.
                      Anything else has to be supplied by whatever calls this endpoint.
                    </Text>
                  </div>
                )}
              </>
            )}

            {activeTab === "response" && (
              <>
                {/* Hidden for now — the "Capture a real response" panel is kept in place,
                    flip SHOW_CAPTURE_PANEL back to true to bring it back. */}
                {SHOW_CAPTURE_PANEL && (
                  <>
                  {/* Capture the expected result from reality rather than memory. */}
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      background: "var(--bg-slate-50)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Text style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>
                          Capture a real response
                        </Text>
                        <CaptureHelpButton onClick={() => setCaptureHelpOpen(true)} />
                      </span>
                      <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                        Send this request once and fill the expected status, sample response, assertions and schema
                        from what actually comes back.
                      </Text>
                    </div>

                    {/* Four routes to the same result. The three above the rule
                        cost nothing; only the last one touches the API. */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <RouteButton
                        icon={History}
                        label="From a previous run"
                        hint={editing.id ? "A real response, already recorded" : "Available once this API is saved"}
                        disabled={!editing.id}
                        onClick={openHistory}
                      />
                      <RouteButton
                        icon={ClipboardPaste}
                        label="Paste a response"
                        hint="You already have it in front of you"
                        onClick={() => setPasteOpen(true)}
                      />
                      <RouteButton
                        icon={Sparkles}
                        label="Generate from payload"
                        hint="Derived offline — a shape to correct"
                        onClick={generateOffline}
                      />
                    </div>

                    <div style={{ height: 1, background: "var(--border-color)" }} />

                    {/* The live route, gated for anything that changes data. */}
                    {isWriteMethod(editing.method) && (
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: allowWriteSend ? "rgba(220,38,38,0.09)" : "var(--bg-pure-white)",
                          border: `1px solid ${
                            allowWriteSend ? "rgba(220,38,38,0.32)" : "var(--border-color)"
                          }`,
                        }}
                      >
                        <span style={{ color: allowWriteSend ? "#b91c1c" : "#b45309", flexShrink: 0, marginTop: 1 }}>
                          <ShieldAlert size={15} />
                        </span>
                        <div style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11.5, color: "var(--text-primary)", display: "block", lineHeight: 1.6 }}>
                            Sending <strong>{editing.method}</strong> changes real data at the base URL below,
                            and does it again on every click — two sends of a create make two records. Nothing here
                            can undo that.
                          </Text>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 7, marginTop: 7, cursor: "pointer" }}>
                            <Switch size="small" checked={allowWriteSend} onChange={setAllowWriteSend} />
                            <Text style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-primary)" }}>
                              Allow write requests
                            </Text>
                          </label>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <Input
                        prefix={<LinkIcon size={13} style={{ color: "#94a3b8" }} />}
                        placeholder="https://staging.example.com"
                        value={sendBaseUrl}
                        onChange={(e) => setSendBaseUrl(e.target.value)}
                        style={{ width: 260, fontSize: 12.5 }}
                      />
                      <SearchableDropdown
                        value={sendAuthApiId ?? null}
                        onChange={(value: string) => setSendAuthApiId(value || undefined)}
                        options={allApis
                          .filter((api) => api.id !== editing.id)
                          .map((api) => ({
                            value: api.id,
                            label: api.name,
                            description: `${api.method} ${api.url}`,
                          }))}
                        placeholder="No authentication"
                        itemNoun="APIs"
                        width={280}
                      />
                      <Tooltip
                        title={
                          isWriteMethod(editing.method) && !allowWriteSend
                            ? `${editing.method} is blocked — it would change real data. Use one of the routes above, or allow write requests.`
                            : "Send this request and capture the real status and response"
                        }
                      >
                        <span>
                          <Button
                            type="primary"
                            danger={isWriteMethod(editing.method) && allowWriteSend}
                            icon={<Send size={13} />}
                            loading={sending}
                            disabled={isWriteMethod(editing.method) && !allowWriteSend}
                            onClick={sendDraft}
                          >
                            Send {editing.method}
                          </Button>
                        </span>
                      </Tooltip>
                    </div>

                    {!sendBaseUrl.trim() && !/^https?:\/\//i.test(editing.url ?? "") && (
                      <Text style={{ fontSize: 11.5, color: "#b45309" }}>
                        This URL is relative and there is no base URL to resolve it against. Type one above — it is
                        remembered for this project — or give the endpoint an absolute URL.
                      </Text>
                    )}

                    {sendAuthApiId && (
                      <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                        That login runs first and its token is attached to this request, so an endpoint behind a
                        session can be sent without pasting a token by hand.
                      </Text>
                    )}

                    {tryResult && <TryResultPanel result={tryResult} onCapture={captureAsExpected} />}
                  </div>
                  </>
                )}

                <Field label="Expected status" hint="Used as the default assertion when none is authored">
                  <Input
                    type="number"
                    placeholder="201"
                    value={editing.expectedStatus ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, expectedStatus: e.target.value ? Number(e.target.value) : null })
                    }
                    style={{ maxWidth: 160 }}
                  />
                </Field>

                <Field label="Sample response" hint="What a successful call returns — QA reads this when writing assertions">
                  <TextArea
                    rows={8}
                    value={editing.expectedResponse ?? ""}
                    onChange={(e) => setEditing({ ...editing, expectedResponse: e.target.value })}
                    placeholder={'{\n  "id": 101,\n  "name": "John",\n  "email": "john@test.com"\n}'}
                    style={{
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                      fontSize: 12.5,
                      borderColor: sampleJson.valid ? undefined : "#fca5a5",
                    }}
                  />
                  <JsonBar
                    state={sampleJson}
                    hasContent={!!editing.expectedResponse?.trim()}
                    onFormat={() => {
                      const { text, error } = formatJson(editing.expectedResponse ?? "");
                      if (error) message.warning(`Cannot format: ${error}`);
                      else setEditing({ ...editing, expectedResponse: text });
                    }}
                    extra={
                      <Button size="small" icon={<Wand2 size={13} />} onClick={generateFromSample}>
                        Generate assertions & schema
                      </Button>
                    }
                  />
                </Field>

                {/* The inferred shape, shown so the author can see what was read
                    out of the sample rather than trusting it blindly. */}
                {Object.keys(editing.responseSchema ?? {}).length > 0 && (
                  <Field label="Response structure" hint="Inferred from the sample — regenerate after changing it">
                    <pre
                      style={{
                        margin: 0,
                        padding: 12,
                        maxHeight: 220,
                        overflow: "auto",
                        borderRadius: 8,
                        fontSize: 11.5,
                        lineHeight: 1.55,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        background: "var(--bg-slate-50)",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {JSON.stringify(editing.responseSchema, null, 2)}
                    </pre>
                  </Field>
                )}

                <Field
                  label="Default assertions"
                  hint="What a correct response looks like — the contract QA checks this endpoint against"
                >
                  <AssertionEditor
                    value={editing.defaultAssertions ?? []}
                    onChange={(defaultAssertions: Assertion[]) => setEditing({ ...editing, defaultAssertions })}
                  />
                </Field>

                <Field label="Notes">
                  <TextArea
                    rows={3}
                    value={editing.notes ?? ""}
                    onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                    placeholder="Rate limits, side effects, anything a tester should know."
                  />
                </Field>
              </>
            )}

            {activeTab === "auth" && (
              <>
                {/* How this endpoint is authenticated, chosen from cards rather
                    than a dropdown: it is five mutually exclusive modes with
                    real consequences, and the difference between them is the
                    part that needs explaining. */}
                <Field label="Authentication" icon={KeyRound}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
                    {AUTH_TYPES.map((type) => {
                      const selected = (editing.authType ?? "inherit") === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setEditing({ ...editing, authType: type })}
                          style={{
                            textAlign: "left",
                            padding: "10px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            background: selected ? "var(--bg-blue-50)" : "var(--bg-pure-white)",
                            border: `1px solid ${selected ? "var(--border-blue-200)" : "var(--border-color)"}`,
                            boxShadow: selected ? "inset 0 0 0 1px var(--border-blue-200)" : "none",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                            <span
                              style={{
                                width: 15,
                                height: 15,
                                borderRadius: 999,
                                border: `1.5px solid ${selected ? "#2563eb" : "var(--border-color)"}`,
                                background: selected ? "#2563eb" : "transparent",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              {selected && (
                                <span style={{ width: 5, height: 5, borderRadius: 999, background: "#ffffff" }} />
                              )}
                            </span>
                            <span
                              style={{
                                fontSize: 12.5,
                                fontWeight: 700,
                                color: selected ? "#1e3a8a" : "var(--text-primary)",
                              }}
                            >
                              {AUTH_TYPE_LABELS[type]}
                            </span>
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: 11,
                              lineHeight: 1.55,
                              color: selected ? "#1e40af" : "var(--text-secondary)",
                              paddingLeft: 22,
                            }}
                          >
                            {AUTH_TYPE_HELP[type]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* What the chosen mode will actually put on the wire. The
                    whole point of this tab is the header that ends up on the
                    request, so show it rather than leaving it to be inferred. */}
                <div
                  style={{
                    display: "flex",
                    gap: 11,
                    padding: "11px 13px",
                    borderRadius: 9,
                    background: "var(--bg-slate-50)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <span style={{ color: "#475569", flexShrink: 0, marginTop: 1 }}>
                    <ShieldCheck size={15} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--text-secondary)", display: "block" }}>
                      WHAT GETS SENT
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        color: "var(--text-primary)",
                        wordBreak: "break-all",
                        display: "block",
                        marginTop: 3,
                      }}
                    >
                      {authPreview}
                    </Text>
                  </div>
                </div>

                <DottedDivider />

                {editing.authType === "inherit" && (
                  <Text style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    Nothing to configure here. The credential comes from whatever calls this endpoint — on the
                    send bar that is the login API you pick, so the definition never has to carry a token of its
                    own and none is stored with it.
                  </Text>
                )}

                {editing.authType === "none" && (
                  <Text style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    No credential is attached. This is the right choice for a public endpoint and for the login
                    call itself — a login that inherited its own token would be circular.
                  </Text>
                )}

                {editing.authType === "bearer" && (
                  <Field label="Token" icon={KeyRound} hint="Usually a {{variable}} rather than a literal — a token pasted here is stored with the definition">
                    <Input
                      placeholder="{{serviceToken}}"
                      value={(editing.authConfig as any)?.token ?? ""}
                      onChange={(e) =>
                        setEditing({ ...editing, authConfig: { ...editing.authConfig, token: e.target.value } })
                      }
                      style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 }}
                    />
                  </Field>
                )}

                {editing.authType === "basic" && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Field label="Username" style={{ flex: "1 1 200px" }}>
                      <Input
                        placeholder="{{username}}"
                        value={(editing.authConfig as any)?.username ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, authConfig: { ...editing.authConfig, username: e.target.value } })
                        }
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                      />
                    </Field>
                    <Field
                      label="Password"
                      style={{ flex: "1 1 200px" }}
                      hint="Point this at a secret environment variable rather than typing the password in"
                    >
                      <Input
                        placeholder="{{password}}"
                        value={(editing.authConfig as any)?.password ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, authConfig: { ...editing.authConfig, password: e.target.value } })
                        }
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                      />
                    </Field>
                  </div>
                )}

                {editing.authType === "api_key" && (
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Field label="Header name" style={{ flex: "0 0 220px" }}>
                      <Input
                        placeholder="X-API-Key"
                        value={(editing.authConfig as any)?.headerName ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, authConfig: { ...editing.authConfig, headerName: e.target.value } })
                        }
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                      />
                    </Field>
                    <Field label="Value" style={{ flex: "1 1 200px" }} hint="A {{variable}} keeps the key out of the definition">
                      <Input
                        placeholder="{{apiKey}}"
                        value={(editing.authConfig as any)?.value ?? ""}
                        onChange={(e) =>
                          setEditing({ ...editing, authConfig: { ...editing.authConfig, value: e.target.value } })
                        }
                        style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                      />
                    </Field>
                  </div>
                )}
              </>
            )}
              </div>
            </>
          )}
        </section>
      </div>

      <style jsx global>{`
        /* MainLayout's Content is already exactly this tall and scrolls; the
           shell fills it so the two panes scroll independently instead of the
           whole page scrolling as one. */
        .ph-shell {
          display: flex;
          align-items: stretch;
          height: 100%;
          min-height: 0;
          background: var(--bg-pure-white);
        }
        .ph-side {
          position: relative;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          min-height: 0;
          border-right: 1px solid var(--border-color);
          background: var(--bg-slate-50);
        }
        .ph-side-head {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 12px 11px;
        }
        .ph-brand-mark {
          width: 32px;
          height: 32px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          color: #ffffff;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          box-shadow: 0 2px 7px rgba(29, 78, 216, 0.3);
        }
        .ph-brand-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .ph-brand-name {
          font-size: 14.5px;
          font-weight: 700;
          letter-spacing: -0.2px;
          line-height: 1.2;
          color: var(--text-primary);
          white-space: nowrap;
        }
        .ph-brand-sub {
          font-size: 10.5px;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .ph-new-btn {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: none;
          color: #ffffff;
          background: #2563eb;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.35);
          transition: background 120ms ease, transform 120ms ease;
        }
        .ph-new-btn:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        /* ── Project card ── */
        .ph-side-scope {
          padding: 0 12px 9px;
        }
        .ph-proj {
          display: flex;
          align-items: center;
          gap: 9px;
          width: 100%;
          padding: 7px 9px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-pure-white);
          cursor: pointer;
          user-select: none;
          transition: border-color 130ms ease, box-shadow 130ms ease;
        }
        .ph-proj:hover {
          border-color: rgba(59, 130, 246, 0.45);
          box-shadow: 0 1px 6px rgba(15, 23, 42, 0.08);
        }
        .ph-proj-code {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.2px;
        }
        .ph-proj-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .ph-proj-name {
          font-size: 12.5px;
          font-weight: 650;
          line-height: 1.25;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ph-proj-meta {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2px;
          text-transform: uppercase;
          color: var(--text-secondary);
          white-space: nowrap;
        }
        .ph-proj-caret {
          flex-shrink: 0;
          color: #94a3b8;
          transition: color 130ms ease;
        }
        .ph-proj:hover .ph-proj-caret {
          color: #2563eb;
        }

        /* ── Search + source ── */
        .ph-side-filters {
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 0 12px 11px;
          border-bottom: 1px solid var(--border-color);
        }
        /* The sidebar is already --bg-slate-50, so a field filled with the
           same token and a transparent border is invisible against it. It
           takes the card surface and a real border, like the two controls it
           sits between. */
        .ph-search.ant-input-affix-wrapper {
          height: 34px;
          border-radius: 9px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-color);
        }
        .ph-search.ant-input-affix-wrapper input {
          background: transparent;
          font-size: 12.5px;
        }
        .ph-search.ant-input-affix-wrapper:hover {
          border-color: rgba(59, 130, 246, 0.45);
        }
        .ph-search.ant-input-affix-wrapper:focus-within {
          background: var(--bg-pure-white);
          border-color: rgba(59, 130, 246, 0.55);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.16);
        }

        /* ── Tree section bar ── */
        .ph-tree-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 12px 4px;
        }
        .ph-tree-bar-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.7px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .ph-tree-bar-count {
          flex: 1;
          min-width: 0;
          font-size: 10.5px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ph-tree-bar-btn {
          width: 22px;
          height: 22px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #94a3b8;
          cursor: pointer;
          transition: background 110ms ease, color 110ms ease;
        }
        .ph-tree-bar-btn:hover {
          background: rgba(148, 163, 184, 0.18);
          color: #1d4ed8;
        }

        /* ── Action tooltips ──
           Two lines, so an icon can say what it does AND what that means to
           the node under it. Dark and narrow: it appears over a dense tree and
           has to read as an overlay rather than as more of the page. */
        .ph-tip .ant-tooltip-inner {
          padding: 8px 11px;
          border-radius: 9px;
          background: #0f172a;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.24);
          min-width: 0;
          min-height: 0;
        }
        .ph-tip .ant-tooltip-arrow::before,
        .ph-tip .ant-tooltip-arrow::after {
          background: #0f172a;
        }
        .ph-tip-body {
          display: flex;
          flex-direction: column;
          gap: 3px;
          max-width: 216px;
        }
        .ph-tip-label {
          font-size: 11.5px;
          font-weight: 650;
          letter-spacing: 0.1px;
          color: #f8fafc;
        }
        .ph-tip-detail {
          font-size: 10.5px;
          line-height: 1.5;
          color: #94a3b8;
        }
        .ph-tree {
          flex: 1;
          min-height: 0;
          overflow: auto;
          padding: 6px 8px 24px;
        }
        .ph-tree-empty {
          padding: 28px 12px;
          text-align: center;
        }
        /* ── Trash ── */
        .ph-trash-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          width: calc(100% - 16px);
          margin: 0 8px 8px;
          padding: 8px 9px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: var(--text-secondary);
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
        }
        .ph-trash-row:hover {
          background: rgba(148, 163, 184, 0.16);
          color: var(--text-primary);
        }
        .ph-trash-row.is-active {
          background: rgba(59, 130, 246, 0.13);
          border-color: rgba(59, 130, 246, 0.28);
          color: #1d4ed8;
        }
        .ph-trash-count {
          flex-shrink: 0;
          min-width: 20px;
          padding: 0 6px;
          border-radius: 999px;
          font-size: 10.5px;
          font-weight: 700;
          line-height: 17px;
          text-align: center;
          color: var(--text-secondary);
          background: rgba(148, 163, 184, 0.22);
        }
        .ph-trash-row.is-active .ph-trash-count {
          color: #1d4ed8;
          background: rgba(59, 130, 246, 0.18);
        }
        .ph-trash-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 13px;
          border: 1px solid var(--border-color);
          border-radius: 10px;
          background: var(--bg-pure-white);
        }
        .ph-trash-kind {
          width: 30px;
          height: 30px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
        }
        .ph-trash-tag {
          flex-shrink: 0;
          padding: 1px 7px;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-slate-50);
          border: 1px solid var(--border-color);
        }
        .ph-trash-where {
          display: flex;
          flex-direction: column;
          gap: 1px;
          width: 180px;
          flex-shrink: 0;
          min-width: 0;
        }
        .ph-trash-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          padding: 70px 20px;
          text-align: center;
        }
        .ph-trash-empty-mark {
          width: 52px;
          height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: var(--bg-slate-50);
          border: 1px solid var(--border-color);
          color: #94a3b8;
        }

        .ph-side-resizer {
          position: absolute;
          top: 0;
          right: -3px;
          width: 6px;
          height: 100%;
          cursor: col-resize;
          z-index: 2;
        }
        .ph-side-resizer:hover {
          background: rgba(59, 130, 246, 0.18);
        }

        /* ── Tree rows ── */
        .ph-node {
          display: flex;
          align-items: center;
          gap: 5px;
          width: 100%;
          padding: 5px 4px 5px 5px;
          border: none;
          border-radius: 7px;
          background: transparent;
          cursor: pointer;
          text-align: left;
          color: var(--text-primary);
          transition: background 110ms ease;
        }
        .ph-node:hover {
          background: rgba(148, 163, 184, 0.14);
        }
        .ph-node.is-selected {
          background: rgba(59, 130, 246, 0.13);
        }
        .ph-node.is-selected .ph-node-label {
          color: #1d4ed8;
          font-weight: 650;
        }
        .ph-node-caret {
          width: 13px;
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: transform 130ms ease;
        }
        .ph-node-caret.is-open {
          transform: rotate(90deg);
        }
        .ph-node-label {
          flex: 1;
          min-width: 0;
          font-size: 12.5px;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* Fixed width, always present. Hiding it on hover would hand its space
           to the label and resize the text under the pointer — a row that
           reflows as you reach for it is a row you misclick. */
        .ph-node-count {
          flex-shrink: 0;
          min-width: 20px;
          text-align: right;
          font-size: 10.5px;
          font-variant-numeric: tabular-nums;
          color: var(--text-secondary);
          padding-right: 2px;
        }
        /* Always on. A control you have to discover by hovering is a control
           half the people using this will never find — the cost is a little
           more ink on every row, which is cheaper than a hidden feature. */
        .ph-node-actions {
          display: flex;
          gap: 0;
          flex-shrink: 0;
          align-items: center;
        }
        .ph-node-actions .ant-btn {
          width: 22px;
          min-width: 22px;
          height: 22px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          transition: color 110ms ease, background 110ms ease;
        }
        .ph-node-actions .ant-btn:hover {
          color: #1d4ed8;
          background: rgba(59, 130, 246, 0.12);
        }
        .ph-node-actions .ant-btn-dangerous {
          color: #cbd5e1;
        }
        .ph-node-actions .ant-btn-dangerous:hover {
          color: #dc2626;
          background: rgba(220, 38, 38, 0.10);
        }

        .ph-node.is-deprecated .ph-node-label {
          text-decoration: line-through;
          color: var(--text-secondary);
        }

        /* ── Main pane ── */
        .ph-main {
          flex: 1;
          min-width: 0;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .ph-reqbar {
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 20px 14px;
          border-bottom: 1px solid var(--border-color);
        }
        .ph-reqbar-top {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ph-crumbs {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          font-size: 11.5px;
          color: var(--text-secondary);
        }
        .ph-crumb-sep {
          color: #cbd5e1;
        }
        .ph-name-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: var(--text-primary);
          padding: 0;
        }
        .ph-name-input::placeholder {
          color: #cbd5e1;
        }
        .ph-urlbar {
          display: flex;
          align-items: stretch;
          gap: 8px;
        }
        .ph-method-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          width: 104px;
          height: 36px;
          padding: 0 11px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-pure-white);
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 800;
          letter-spacing: 0.3px;
        }
        .ph-urlbar-sep {
          display: none;
        }
        .ph-url-input {
          height: 36px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0 11px;
          background: var(--bg-pure-white);
          color: var(--text-primary);
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12.5px;
          outline: none;
        }
        .ph-url-input {
          flex: 1;
          min-width: 0;
        }
        /* The "goes into" chip in the New collection modal. */
        .ph-dest {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 6px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 12.5px;
          font-weight: 650;
          white-space: nowrap;
        }
        .ph-dest-note {
          flex: 1;
          min-width: 0;
          font-size: 11.5px;
          line-height: 1.4;
          color: var(--text-secondary);
        }
        .ph-url-input:focus {
          border-color: rgba(59, 130, 246, 0.55);
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.16);
        }
        .ph-write-guard {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
          padding: 0 10px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid rgba(220, 38, 38, 0.32);
          background: rgba(220, 38, 38, 0.09);
          color: #dc2626;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
        }
        .ph-send {
          height: 36px;
          flex-shrink: 0;
          border-radius: 8px;
          font-weight: 600;
        }
        .ph-body {
          flex: 1;
          min-height: 0;
          overflow: auto;
        }

        /* ── Body panel ── */
        .ph-body-panel {
          border: 1px solid var(--border-color);
          border-radius: 10px;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .ph-body-head {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          padding: 9px 11px;
          background: var(--bg-slate-50);
          border-bottom: 1px solid var(--border-color);
        }
        .ph-body-title {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          flex-shrink: 0;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .ph-body-icon {
          width: 20px;
          height: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          background: rgba(59, 130, 246, 0.12);
          color: #2563eb;
        }
        .ph-body-icon.is-muted {
          background: rgba(100, 116, 139, 0.14);
          color: var(--text-secondary);
        }
        .ph-body-seg .ant-segmented-item-label {
          padding: 0 11px;
        }
        .ph-body-seg-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-weight: 600;
        }
        .ph-body-seg-dot {
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: #dc2626;
          flex-shrink: 0;
        }
        .ph-body-input.ant-input {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 12.5px;
          line-height: 1.65;
          padding: 12px 13px;
          background: transparent;
          resize: none;
        }
        .ph-body-foot {
          padding: 7px 11px;
          border-top: 1px solid var(--border-color);
          background: var(--bg-slate-50);
        }
        /* JsonBar carries its own top margin for the field layout it was
           written for; inside this footer that margin is a gap to nothing. */
        .ph-body-foot > div {
          margin-top: 0 !important;
        }
        .ph-body-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 34px 20px;
          text-align: center;
        }
      `}</style>

      {/* Edit a collection from its card. */}
      <Modal
        open={!!collectionEdit}
        title="Edit collection"
        okText="Save changes"
        confirmLoading={savingCollection}
        onOk={saveCollection}
        onCancel={() => setCollectionEdit(null)}
        width={520}
        destroyOnHidden
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Name" required icon={FolderPlus}>
            <Input
              autoFocus
              placeholder="Users"
              value={collectionDraft.name ?? ""}
              onChange={(e) => setCollectionDraft({ ...collectionDraft, name: e.target.value })}
            />
          </Field>

          <Field label="Description" icon={FileText}>
            <TextArea
              rows={2}
              placeholder="What these endpoints have in common."
              value={collectionDraft.description ?? ""}
              onChange={(e) => setCollectionDraft({ ...collectionDraft, description: e.target.value })}
            />
          </Field>

          <Field
            label="Module"
            icon={Boxes}
            hint="Moving a collection moves every endpoint inside it to the same module."
          >
            <SearchableDropdown
              value={collectionDraft.moduleName ?? null}
              onChange={(value: string) =>
                setCollectionDraft({ ...collectionDraft, moduleName: value || null })
              }
              options={moduleChoices}
              placeholder="Unfiled"
              itemNoun="modules"
              width={440}
            />
          </Field>

          <Field label="Source" icon={Layers3}>
            <SearchableDropdown
              value={collectionDraft.sourceId ?? null}
              onChange={(value: string) =>
                setCollectionDraft({
                  ...collectionDraft,
                  sourceId: value === "__create_new__" ? collectionDraft.sourceId : value || null,
                })
              }
              options={sourceOptions.filter((option) => option.value !== "__create_new__")}
              placeholder="No source"
              itemNoun="sources"
              width={440}
            />
          </Field>
        </div>
      </Modal>

      {/* Curate a module without losing the definition being written. QA
          Settings owns this modal, so both screens create modules the same
          way — and its CSS travels with it. */}
      <style dangerouslySetInnerHTML={{ __html: SETTINGS_MODAL_STYLES + MODULE_SETTINGS_STYLES }} />
      <ModuleModal
        open={moduleModalOpen}
        editing={null}
        defaultProjectId={editing.projectId ?? projectId}
        onClose={() => setModuleModalOpen(false)}
        onSaved={onModuleCreated}
      />

      {/* New collection — from the tree, or from the open definition. It wears
          the same chrome as QA Settings' modals, so every creator in this
          drawer is recognisably the same object. */}
      <Modal
        open={collectionModalOpen}
        title={null}
        footer={null}
        closable={false}
        onCancel={closeCollectionModal}
        width={480}
        destroyOnHidden
        centered
        styles={{
          content: { padding: 0, borderRadius: 16, overflow: "hidden" },
          body: { padding: 0 },
          mask: { backdropFilter: "blur(3px)", background: "rgba(15,23,42,0.45)" },
        }}
      >
        <div className="so-modal">
          <div className="so-head">
            <span className="so-head__icon"><FolderPlus size={17} /></span>
            <div className="so-head__text">
              <div className="so-head__title">New collection</div>
              <div className="so-head__sub">
                Groups related endpoints inside a module — Users, Invoices, Webhooks.
              </div>
            </div>
            <button className="so-head__close" onClick={closeCollectionModal} aria-label="Close">
              <X size={14} />
            </button>
          </div>

          {/* Where it lands, stated before you name it — the answer is already
              settled by the tree row or the definition you came from. */}
          <div className="so-preview">
            <span className="so-preview__label">Goes into</span>
            <span className="ph-dest">
              <Boxes size={12} />
              {collectionTargetModule ?? "Unfiled"}
            </span>
            <span className="ph-dest-note">
              {collectionTargetModule
                ? "Only offered under this module."
                : "Unfiled, so it is offered under every module."}
            </span>
          </div>

          <div className="so-form">
            <div style={{ marginBottom: 16 }}>
              <label className="so-label" htmlFor="ph-new-collection" style={{ display: "block", marginBottom: 6 }}>
                Name <span className="so-req">*</span>
              </label>
              <Input
                id="ph-new-collection"
                autoFocus
                maxLength={120}
                placeholder="Users"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onPressEnter={createCollection}
              />
              <span className="so-extra" style={{ display: "block", marginTop: 6 }}>
                {newCollectionModule
                  ? "Opens in the tree as soon as it is created."
                  : "Selected for the open definition straight away."}
              </span>
            </div>
          </div>

          <div className="so-foot">
            <Button onClick={closeCollectionModal}>Cancel</Button>
            <Button
              type="primary"
              onClick={createCollection}
              loading={creatingCollection}
              disabled={!newCollectionName.trim()}
            >
              Create collection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create a deployment tier without losing the definition being written. */}
      <Modal
        open={sourceModalOpen}
        title="New source"
        okText="Create"
        confirmLoading={creatingSource}
        onOk={createSource}
        onCancel={() => {
          setSourceModalOpen(false);
          setNewSourceLabel("");
        }}
        width={440}
        destroyOnHidden
      >
        <Text style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
          A source is the deployment tier a set of definitions describes — Local, Staging, Beta, Prod. It sits
          above modules, so the same module can hold endpoints under more than one tier.
        </Text>
        <Input
          autoFocus
          placeholder="Pre-prod"
          value={newSourceLabel}
          onChange={(e) => setNewSourceLabel(e.target.value)}
          onPressEnter={createSource}
        />
        <Text style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginTop: 10 }}>
          This is a catalogue label, not a run target — it says which tier a definition describes. The host a
          request actually goes to is the Base URL on the send bar.
        </Text>
      </Modal>

      <CaptureHelpModal open={captureHelpOpen} onClose={() => setCaptureHelpOpen(false)} />

      <HistoryPicker
        open={historyOpen}
        loading={historyLoading}
        history={history}
        onClose={() => setHistoryOpen(false)}
        onPick={(status, body, durationMs) => {
          captureAsExpected(status, body, durationMs);
          setLastCapture({
            status,
            durationMs: durationMs ?? null,
            byteSize: byteLengthOf(body ?? ""),
            source: "previous run",
          });
          setHistoryOpen(false);
        }}
      />

      {/* Paste a response you already have, for an API the server cannot reach. */}
      <Modal
        open={pasteOpen}
        title="Paste a response"
        okText="Use as expected result"
        onOk={importPastedResponse}
        onCancel={() => {
          setPasteOpen(false);
          setPasteText("");
        }}
        width={640}
        destroyOnHidden
      >
        <Text style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
          Paste the response body on its own, or a whole raw HTTP response with its status line — both are
          understood. Assertions and the response schema are generated from it.
        </Text>
        <Input.TextArea
          rows={11}
          autoFocus
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={'HTTP/1.1 201 Created\nContent-Type: application/json\nServer-Timing: total;dur=84\n\n{\n  "id": 101,\n  "name": "John"\n}'}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 }}
        />

        {/* What the paste actually yields, recomputed as it is typed. */}
        {pasteText.trim() && (
          <div
            style={{
              marginTop: 10,
              padding: "9px 12px",
              borderRadius: 8,
              background: "var(--bg-slate-50)",
              border: "1px solid var(--border-color)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Metric
              label="Status"
              value={pastePreview.status ?? "—"}
              note={pastePreview.status === null ? "not in the paste" : undefined}
            />
            <Metric label="Size" value={`${pastePreview.byteSize} B`} />
            <Metric
              label="Time"
              value={pastePreview.durationMs !== null ? formatDuration(pastePreview.durationMs) : "—"}
              note={pastePreview.timeSource ?? "not in the paste"}
            />
          </div>
        )}

        {pasteText.trim() && pastePreview.durationMs === null && (
          <Text style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginTop: 8, lineHeight: 1.6 }}>
            Size is measured from the body, so it is always exact. Timing is not carried in a response payload —
            it only appears if the paste includes a <code>Server-Timing</code>, <code>X-Response-Time</code> or{" "}
            <code>X-Runtime</code> header, or a summary line like <code>200 OK 84 ms</code>. Without one, no
            response-time assertion is generated rather than a made-up number.
          </Text>
        )}
      </Modal>

      {/* cURL import — a review of what will land, not just a text box. */}
      <Modal
        open={curlOpen}
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <TerminalSquare size={16} style={{ color: "#1d4ed8" }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Import from cURL</span>
          </span>
        }
        okText={curlPreview?.response ? "Import request & response" : "Import"}
        okButtonProps={{ disabled: !curlPreview?.request }}
        onOk={importCurl}
        onCancel={() => {
          setCurlOpen(false);
          setCurlText("");
        }}
        width={840}
        destroyOnHidden
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
          {/* What the box accepts, stated up front rather than discovered. */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>Understands</Text>
            {CURL_FORMATS.map((format) => (
              <Tooltip key={format.label} title={format.detail}>
                <span
                  style={{
                    padding: "1px 8px",
                    borderRadius: 999,
                    fontSize: 10.5,
                    fontWeight: 600,
                    fontFamily: "ui-monospace, monospace",
                    color: "#475569",
                    background: "var(--bg-slate-50)",
                    border: "1px solid var(--border-color)",
                    cursor: "help",
                  }}
                >
                  {format.label}
                </span>
              </Tooltip>
            ))}
          </div>

          <div style={{ position: "relative" }}>
            <Input.TextArea
              rows={10}
              autoFocus
              value={curlText}
              onChange={(e) => setCurlText(e.target.value)}
              placeholder={"curl 'https://qa.example.com/api/users' \\\n  -H 'content-type: application/json' \\\n  --data-raw '{\"name\":\"John\"}'"}
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 12.5,
                lineHeight: 1.6,
                paddingBottom: 28,
              }}
            />
            <div style={{ position: "absolute", left: 10, bottom: 9, display: "flex", alignItems: "center", gap: 10 }}>
              {curlText.trim() ? (
                <Text style={{ fontSize: 10.5, color: "var(--text-secondary)" }}>
                  {curlText.split("\n").length} lines · {byteLengthOf(curlText)} B
                </Text>
              ) : (
                <Button
                  size="small"
                  type="text"
                  onClick={() => setCurlText(CURL_EXAMPLE)}
                  style={{ fontSize: 11, color: "#1d4ed8", height: 20, padding: "0 6px" }}
                >
                  Use an example
                </Button>
              )}
            </div>
          </div>

          {curlText.trim() && !curlPreview?.request && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(220,38,38,0.09)",
                border: "1px solid rgba(220,38,38,0.32)",
                fontSize: 11.5,
                color: "#b91c1c",
              }}
            >
              No cURL command found — the paste needs a <code>curl</code> invocation with a URL in it.
            </div>
          )}

          {curlPreview?.request && (
            <div
              style={{
                borderRadius: 9,
                border: "1px solid var(--border-color)",
                background: "var(--bg-slate-50)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 13px",
                  borderBottom: "1px solid var(--border-color)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: "var(--text-secondary)" }}>
                  WHAT WILL BE IMPORTED
                </Text>
                <span style={{ flex: 1 }} />
                {curlPreview.response ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#047857" }}>
                    <CheckCircle2 size={12} /> Request &amp; response
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Request only</span>
                )}
              </div>

              <div style={{ padding: "4px 13px 10px" }}>
                <ImportRow label="Method" value={<MethodTag method={curlPreview.request.method} />} />
                <ImportRow label="URL" value={curlPreview.request.url} mono />
                <ImportRow
                  label="Headers"
                  value={
                    curlPreview.request.headers.length
                      ? curlPreview.request.headers.map((h) => h.key).join(", ")
                      : "none"
                  }
                  muted={!curlPreview.request.headers.length}
                  mono={!!curlPreview.request.headers.length}
                />
                <ImportRow
                  label="Query"
                  value={
                    curlPreview.request.queryParams.length
                      ? curlPreview.request.queryParams.map((q) => q.key).join(", ")
                      : "none"
                  }
                  muted={!curlPreview.request.queryParams.length}
                  mono={!!curlPreview.request.queryParams.length}
                />
                <ImportRow
                  label="Payload"
                  value={
                    curlPreview.request.body
                      ? `${curlPreview.request.bodyType.toUpperCase()} · ${byteLengthOf(curlPreview.request.body)} B`
                      : "none"
                  }
                  muted={!curlPreview.request.body}
                />
                <ImportRow
                  label="Response"
                  value={
                    curlPreview.response ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontWeight: 800,
                            color: (curlPreview.response.status ?? 0) >= 400 ? "#b91c1c" : "#047857",
                          }}
                        >
                          {curlPreview.response.status ?? "no status"}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {curlPreview.response.byteSize} B
                          {curlPreview.response.durationMs !== null
                            ? ` · ${formatDuration(curlPreview.response.durationMs)}`
                            : ""}
                        </span>
                        <span style={{ fontSize: 10.5, color: "#047857", fontWeight: 600 }}>
                          fills the expected result too
                        </span>
                      </span>
                    ) : (
                      "not in this paste"
                    )
                  }
                  muted={!curlPreview.response}
                />
              </div>
            </div>
          )}

          {/* A credential copied from a browser is live: it expires, and until
              it does it sits in a record the whole tenant can read. */}
          {curlSecrets.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 11,
                padding: "11px 13px",
                borderRadius: 9,
                background: "rgba(245,158,11,0.10)",
                border: "1px solid rgba(245,158,11,0.32)",
              }}
            >
              <span style={{ color: "#d97706", flexShrink: 0, marginTop: 1 }}>
                <ShieldAlert size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 12, fontWeight: 700, color: "#78350f", display: "block" }}>
                  {curlSecrets.length === 1 ? "A live credential" : `${curlSecrets.length} live credentials`} in this
                  command
                </Text>
                {curlSecrets.map((secret) => (
                  <Text key={secret.key} style={{ fontSize: 11, color: "#92400e", display: "block", lineHeight: 1.6 }}>
                    {secret.reason}
                  </Text>
                ))}
                <Button
                  size="small"
                  onClick={replaceCurlSecrets}
                  style={{ marginTop: 7, fontSize: 11 }}
                  icon={<ShieldCheck size={12} />}
                >
                  Use {curlSecrets.map((secret) => `{{${secret.suggested}}}`).join(", ")} instead
                </Button>
              </div>
            </div>
          )}

          {/* Collapsed by default — anyone who already knows this never sees it. */}
          <CurlHowTo />

          {curlPreview?.request && !curlPreview.response && (
            <Text style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Paste the whole terminal session to fill the expected result too — <code>curl -i</code>,{" "}
              <code>curl -v</code> and <code>curl -w</code> all print the response. Nothing is sent, so this works
              for a create or a delete.
            </Text>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
}

/**
 * Size and timing at a glance, above the request being edited.
 *
 * Two different kinds of number sit here deliberately:
 *   Payload   what THIS definition would send, recomputed as you type.
 *   Response  what was last actually observed, from whichever route produced
 *             it — a send, a cURL session, a paste or a recorded run.
 *
 * The source is always named. A figure with no provenance invites being read
 * as a measurement when it might be a guess, and the offline generator
 * genuinely has no timing to report.
 */
function RequestMetrics({
  payloadBytes,
  lastCapture,
  onOpenCapture,
}: {
  payloadBytes: number;
  lastCapture: { status: number | null; durationMs: number | null; byteSize: number | null; source: string } | null;
  onOpenCapture: () => void;
}) {
  const isError = (lastCapture?.status ?? 0) >= 400;
  const generated = lastCapture?.source === "generated offline";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 22,
        padding: "10px 14px",
        borderRadius: 9,
        background: "var(--bg-slate-50)",
        border: "1px solid var(--border-color)",
      }}
    >
      <Metric
        label="Payload"
        value={payloadBytes ? `${payloadBytes} B` : "—"}
        note={payloadBytes ? "this request" : "no body"}
      />

      <span style={{ width: 1, alignSelf: "stretch", background: "var(--border-color)" }} />

      {lastCapture ? (
        <>
          <Metric
            label="Status"
            value={
              <span style={{ color: lastCapture.status === null ? "var(--text-secondary)" : isError ? "#b91c1c" : "#047857" }}>
                {lastCapture.status ?? "—"}
              </span>
            }
            note={lastCapture.status === null ? "not recorded" : undefined}
          />
          <Metric
            label="Time taken"
            value={lastCapture.durationMs !== null ? formatDuration(lastCapture.durationMs) : "—"}
            note={lastCapture.durationMs === null ? (generated ? "nothing was sent" : "not recorded") : undefined}
          />
          <Metric
            label="Response size"
            value={lastCapture.byteSize !== null ? `${lastCapture.byteSize} B` : "—"}
          />
          <span style={{ flex: 1 }} />
          <Text style={{ fontSize: 10.5, color: "var(--text-secondary)" }}>
            from {lastCapture.source}
          </Text>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
            No response measured yet — size and time appear here once one is captured.
          </Text>
          <span style={{ flex: 1 }} />
          <Button size="small" type="text" onClick={onOpenCapture} style={{ color: "#1d4ed8", fontSize: 11.5 }}>
            Capture one
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * The body of an action tooltip: what the control does, and what that means.
 *
 * A bare verb ("Delete") on an icon in a tree of three node types is not
 * enough — deleting a collection and deleting an endpoint are very different
 * acts. The second line says which one you are about to reach for, while the
 * icon stays an icon.
 */
function ActionTip({ label, detail }: { label: string; detail?: string }) {
  return (
    <span className="ph-tip-body">
      <span className="ph-tip-label">{label}</span>
      {detail && <span className="ph-tip-detail">{detail}</span>}
    </span>
  );
}

/** Every action tooltip in the tree, with the same delay and the same skin. */
function ActionButton({
  label,
  detail,
  icon: Icon,
  danger,
  onClick,
}: {
  label: string;
  detail?: string;
  icon: any;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <Tooltip
      title={<ActionTip label={label} detail={detail} />}
      overlayClassName="ph-tip"
      mouseEnterDelay={0.3}
      placement="top"
    >
      <Button
        size="small"
        type="text"
        danger={danger}
        aria-label={label}
        icon={<Icon size={12.5} />}
        onClick={onClick}
      />
    </Tooltip>
  );
}

/**
 * Edit and delete for one node.
 *
 * Both are optional: a node the viewer cannot write to renders neither, and a
 * module renders only the delete — its name belongs to QA Settings.
 */
function CardActions({
  onEdit,
  onDelete,
  deleteTitle,
  deleteDescription,
  editLabel = "Edit",
  editDetail,
  deleteLabel = "Delete",
  deleteDetail,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  deleteTitle: string;
  deleteDescription: string;
  editLabel?: string;
  editDetail?: string;
  deleteLabel?: string;
  deleteDetail?: string;
}) {
  if (!onEdit && !onDelete) return null;

  return (
    <span style={{ display: "inline-flex", gap: 0 }}>
      {onEdit && <ActionButton label={editLabel} detail={editDetail} icon={Pencil} onClick={onEdit} />}
      {onDelete && (
        <ConfirmDialog
          title={deleteTitle}
          description={deleteDescription}
          tone="danger"
          confirmText="Delete"
          onConfirm={onDelete}
        >
          {/* The dialog owns the click, so the button below takes none. */}
          <span>
            <ActionButton label={deleteLabel} detail={deleteDetail} icon={Trash2} danger />
          </span>
        </ConfirmDialog>
      )}
    </span>
  );
}


/** One module's subtree, as the sidebar builds it. */
interface TreeModule {
  key: string;
  name: string;
  curated: boolean;
  qaModuleId: string | null;
  description: string | null;
  collections: { collection: YapiezCollection; apis: YapiezApi[]; matched: YapiezApi[] }[];
  looseApis: YapiezApi[];
  apiCount: number;
  collectionCount: number;
}

/** Where a new endpoint should land, when the tree is the one asking. */
type NewApiTarget = { moduleName?: string | null; collectionId?: string | null };

/**
 * A module and everything under it.
 *
 * Three levels rendered by indentation alone — no cards, no counts competing
 * for the eye. The whole point of a tree is that the shape of the thing is the
 * navigation, so anything that is not structure stays out of the way until you
 * hover the row it belongs to.
 */
function ModuleBranch({
  module,
  open,
  onToggle,
  isCollectionOpen,
  onToggleCollection,
  selectedApiId,
  onSelectApi,
  canCreate,
  canUpdate,
  canDelete,
  onNewApi,
  onNewCollection,
  onManageModules,
  onDeleteModule,
  onEditCollection,
  onDeleteCollection,
  onDuplicateApi,
  onDeleteApi,
}: {
  module: TreeModule;
  open: boolean;
  onToggle: () => void;
  isCollectionOpen: (id: string) => boolean;
  onToggleCollection: (id: string) => void;
  selectedApiId: string | null;
  onSelectApi: (api: YapiezApi) => void;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onNewApi: (where: NewApiTarget) => void;
  onNewCollection: (moduleName: string) => void;
  /** Modules are curated in QA Settings; this is the way there. */
  onManageModules: () => void;
  onDeleteModule: (card: ModuleCard) => void;
  onEditCollection: (collection: YapiezCollection) => void;
  onDeleteCollection: (collection: YapiezCollection) => void;
  onDuplicateApi: (api: YapiezApi) => void;
  onDeleteApi: (api: YapiezApi) => void;
}) {
  // "Unfiled" is a view of what has no module, not a module — there is nothing
  // to rename, nothing to delete, and nothing to file a new collection under.
  const isUnfiled = module.key === UNFILED_MODULE;
  const card: ModuleCard = {
    key: module.key,
    name: module.name,
    description: module.description,
    curated: module.curated,
    qaModuleId: module.qaModuleId,
  };

  return (
    <div style={{ marginBottom: 1 }}>
      <div className="ph-node" role="button" tabIndex={0} onClick={onToggle}>
        <span className={`ph-node-caret${open ? " is-open" : ""}`}>
          <ChevronRight size={13} />
        </span>
        <span style={{ display: "inline-flex", flexShrink: 0, color: isUnfiled ? "#94a3b8" : "#3b82f6" }}>
          <Boxes size={13.5} />
        </span>
        <span className="ph-node-label" style={{ fontWeight: 650 }} title={module.name}>
          {module.name}
        </span>
        {!module.curated && !isUnfiled && (
          <Tooltip title="Not in QA Settings → Modules — kept so existing endpoints stay filed">
            <span style={{ display: "inline-flex", color: "#f59e0b", flexShrink: 0 }}>
              <AlertCircle size={11} />
            </span>
          </Tooltip>
        )}
        <span className="ph-node-count">{module.apiCount}</span>
        <span className="ph-node-actions" onClick={(event) => event.stopPropagation()}>
          {canCreate && !isUnfiled && (
            <ActionButton
              label="New collection"
              detail={`A group of related endpoints inside ${module.name}`}
              icon={FolderPlus}
              onClick={() => onNewCollection(module.key)}
            />
          )}
          {canCreate && (
            <ActionButton
              label="New endpoint"
              detail={`Filed under ${module.name}, in no collection`}
              icon={Plus}
              onClick={() => onNewApi({ moduleName: module.key })}
            />
          )}
          {!isUnfiled && module.curated && (
            <ActionButton
              label="Manage in QA Settings"
              detail="Module names are curated there and shared with bugs and test cases, so they are renamed in one place rather than per screen."
              icon={Settings2}
              onClick={onManageModules}
            />
          )}
          {!isUnfiled && (
            <CardActions
              onDelete={canDelete ? () => onDeleteModule(card) : undefined}
              deleteLabel="Delete module"
              deleteDetail="Keeps everything filed under it"
              deleteTitle={`Delete "${module.name}"?`}
              deleteDescription={
                module.curated
                  ? "The module goes from QA Settings, and everything filed under it — collections and endpoints — becomes unfiled. Nothing is deleted with it. Refused while a test scope, case or suite still names it."
                  : "This name is not in QA Settings, so only the catalog changes: everything filed under it becomes unfiled. Nothing is deleted."
              }
            />
          )}
        </span>
      </div>

      {open && (
        <div style={{ paddingLeft: 11 }}>
          {module.collections.map(({ collection, apis, matched }) => {
            const collectionOpen = isCollectionOpen(collection.id);
            return (
              <div key={collection.id}>
                <div
                  className="ph-node"
                  role="button"
                  tabIndex={0}
                  onClick={() => onToggleCollection(collection.id)}
                >
                  <span className={`ph-node-caret${collectionOpen ? " is-open" : ""}`}>
                    <ChevronRight size={13} />
                  </span>
                  <span style={{ display: "inline-flex", flexShrink: 0, color: collection.sourceColor || "#64748b" }}>
                    <FolderPlus size={13} />
                  </span>
                  <span className="ph-node-label" title={collection.name}>
                    {collection.name}
                  </span>
                  <span className="ph-node-count">{apis.length}</span>
                  <span className="ph-node-actions" onClick={(event) => event.stopPropagation()}>
                    {canCreate && (
                      <ActionButton
                        label="New endpoint"
                        detail={`Filed inside ${collection.name}`}
                        icon={Plus}
                        onClick={() => onNewApi({ moduleName: module.key, collectionId: collection.id })}
                      />
                    )}
                    <CardActions
                      editLabel="Edit collection"
                      editDetail="Name, description, module and source"
                      deleteLabel="Delete collection"
                      deleteDetail="Its endpoints stay and become ungrouped"
                      onEdit={canUpdate ? () => onEditCollection(collection) : undefined}
                      onDelete={canDelete ? () => onDeleteCollection(collection) : undefined}
                      deleteTitle={`Delete "${collection.name}"?`}
                      deleteDescription={`The collection goes; its ${apis.length} endpoint${
                        apis.length === 1 ? "" : "s"
                      } stay and become ungrouped under the same module.`}
                    />
                  </span>
                </div>

                {collectionOpen && (
                  <div style={{ paddingLeft: 11 }}>
                    {matched.length ? (
                      matched.map((api) => (
                        <ApiLeaf
                          key={api.id}
                          api={api}
                          selected={selectedApiId === api.id}
                          canDuplicate={canCreate}
                          canDelete={canDelete}
                          onSelect={onSelectApi}
                          onDuplicate={onDuplicateApi}
                          onDelete={onDeleteApi}
                        />
                      ))
                    ) : (
                      <div className="ph-node" style={{ cursor: "default", paddingLeft: 42 }}>
                        <span className="ph-node-label" style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                          Empty
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Endpoints in this module but in no collection. Shown flat at the
              module's own level, because that is literally where they are. */}
          {module.looseApis.map((api) => (
            <ApiLeaf
              key={api.id}
              api={api}
              selected={selectedApiId === api.id}
              canDuplicate={canCreate}
              canDelete={canDelete}
              onSelect={onSelectApi}
              onDuplicate={onDuplicateApi}
              onDelete={onDeleteApi}
            />
          ))}

          {!module.collections.length && !module.looseApis.length && (
            <div className="ph-node" style={{ cursor: "default", paddingLeft: 26 }}>
              <span className="ph-node-label" style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                Nothing here yet
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** One endpoint in the tree: its verb, its name, and nothing else. */
function ApiLeaf({
  api,
  selected,
  canDuplicate,
  canDelete,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  api: YapiezApi;
  selected: boolean;
  canDuplicate: boolean;
  canDelete: boolean;
  onSelect: (api: YapiezApi) => void;
  onDuplicate: (api: YapiezApi) => void;
  onDelete: (api: YapiezApi) => void;
}) {
  const method = (api.method ?? "GET") as HttpMethod;

  return (
    <div
      className={`ph-node${selected ? " is-selected" : ""}${api.isDeprecated ? " is-deprecated" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(api)}
      title={`${api.method} ${api.url}`}
    >
      {/* No caret placeholder — a leaf has nothing to open, and reserving the
          space for one pushes every endpoint a column further from its own
          name than the folders above it. The method takes that slot instead,
          right-aligned so the verbs still line up. */}
      <span
        style={{
          width: 36,
          flexShrink: 0,
          fontSize: 9.5,
          fontWeight: 800,
          letterSpacing: 0.2,
          textAlign: "right",
          color: METHOD_COLORS[method]?.text ?? "var(--text-secondary)",
        }}
      >
        {method}
      </span>
      <span className="ph-node-label">{api.name}</span>
      <span className="ph-node-actions" onClick={(event) => event.stopPropagation()}>
        {canDuplicate && (
          <ActionButton
            label="Duplicate"
            detail="Opens an unsaved copy of this endpoint"
            icon={Copy}
            onClick={() => onDuplicate(api)}
          />
        )}
        {canDelete && (
          <ConfirmDialog
            title="Delete this API?"
            description={
              api.usedInFlows
                ? "Something still references this definition, so deleting is refused — mark it deprecated instead."
                : "This removes the definition from the catalog."
            }
            tone="danger"
            confirmText="Delete"
            onConfirm={() => onDelete(api)}
          >
            <span>
              <ActionButton label="Delete endpoint" detail="Removes the definition from the catalog" icon={Trash2} danger />
            </span>
          </ConfirmDialog>
        )}
      </span>
    </div>
  );
}


/**
 * The trash, as a place in the workspace.
 *
 * Every row says what the thing WAS — an endpoint keeps its method and path, a
 * collection says how many endpoints come back with it — because "Users" on
 * its own is not enough to decide whether you meant to throw it away.
 */
function TrashPane({
  entries,
  loading,
  canRestore,
  canPurge,
  onRestore,
  onPurge,
  onEmpty,
  onClose,
}: {
  entries: YapiezTrashEntry[];
  loading: boolean;
  canRestore: boolean;
  canPurge: boolean;
  onRestore: (entry: YapiezTrashEntry) => void;
  onPurge: (entry: YapiezTrashEntry) => void;
  onEmpty: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="ph-reqbar">
        <div className="ph-reqbar-top">
          <span className="ph-crumbs">Deleted from this project</span>
          <span style={{ flex: 1 }} />
          <Button size="small" icon={<X size={13} />} onClick={onClose}>
            Close
          </Button>
          {canPurge && entries.length > 0 && (
            <ConfirmDialog
              title="Empty the trash?"
              description={`All ${entries.length} item${
                entries.length === 1 ? "" : "s"
              } will be deleted for good. This cannot be undone.`}
              tone="danger"
              confirmText="Delete everything"
              onConfirm={onEmpty}
            >
              <Button size="small" danger icon={<Trash2 size={13} />}>
                Empty trash
              </Button>
            </ConfirmDialog>
          )}
        </div>

        <span className="ph-name-input" style={{ display: "block" }}>
          Trash
        </span>
        <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Deleted endpoints and collections stay here until you empty it. Restoring one puts it back exactly
          where it was.
        </Text>
      </div>

      <div className="ph-body" style={{ padding: "16px 20px 40px" }}>
        {loading && !entries.length ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <ZukvoLoader size="lg" />
          </div>
        ) : !entries.length ? (
          <div className="ph-trash-empty">
            <span className="ph-trash-empty-mark">
              <Trash2 size={20} />
            </span>
            <Text style={{ fontSize: 13.5, fontWeight: 650, color: "var(--text-primary)" }}>
              The trash is empty
            </Text>
            <Text style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 360, lineHeight: 1.6 }}>
              Deleting an endpoint or a collection sends it here first, so nothing in this catalog is lost by
              one click.
            </Text>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((entry) => {
              const isApi = entry.kind === "api";
              const method = (entry.method ?? "GET") as HttpMethod;
              const tint = isApi ? METHOD_COLORS[method]?.text ?? "#64748b" : "#64748b";

              return (
                <div key={`${entry.kind}:${entry.id}`} className="ph-trash-item">
                  <span className="ph-trash-kind" style={{ color: tint, background: `${tint}1a` }}>
                    {isApi ? <Plug2 size={13} /> : <FolderPlus size={13} />}
                  </span>

                  <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1, gap: 2 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      {isApi && <MethodTag method={entry.method} />}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: 650,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {entry.name}
                      </Text>
                      {!isApi && (
                        <span className="ph-trash-tag">
                          {entry.itemCount} endpoint{entry.itemCount === 1 ? "" : "s"} inside
                        </span>
                      )}
                    </span>
                    <Text
                      style={{
                        fontSize: 11.5,
                        color: "var(--text-secondary)",
                        fontFamily: isApi ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {isApi ? entry.url : entry.description || "No description"}
                    </Text>
                  </span>

                  <span className="ph-trash-where">
                    <Text style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-secondary)" }}>
                      Was in
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                      {entry.moduleName || "Unfiled"}
                      {isApi && entry.collectionName ? ` / ${entry.collectionName}` : ""}
                    </Text>
                  </span>

                  <Text style={{ fontSize: 11.5, color: "var(--text-secondary)", width: 92, flexShrink: 0 }}>
                    {dayjs(entry.deletedAt).fromNow()}
                  </Text>

                  <span style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    {canRestore && (
                      <Tooltip
                        title={
                          <ActionTip
                            label="Restore"
                            detail={
                              isApi
                                ? "Back into its module and collection"
                                : "Its endpoints are grouped under it again"
                            }
                          />
                        }
                        overlayClassName="ph-tip"
                        mouseEnterDelay={0.3}
                      >
                        <Button size="small" icon={<RotateCcw size={13} />} onClick={() => onRestore(entry)}>
                          Restore
                        </Button>
                      </Tooltip>
                    )}
                    {canPurge && (
                      <ConfirmDialog
                        title={`Delete "${entry.name}" for good?`}
                        description={
                          isApi
                            ? "The definition and everything authored on it — headers, payload, assertions — go permanently. This cannot be undone."
                            : "The collection goes permanently. Its endpoints are not deleted; they stay ungrouped."
                        }
                        tone="danger"
                        confirmText="Delete for good"
                        onConfirm={() => onPurge(entry)}
                      >
                        <Button size="small" danger type="text" icon={<Trash2 size={13} />} />
                      </ConfirmDialog>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * The right pane before anything is picked.
 *
 * Quiet on purpose: the tree beside it is the thing to read, and a loud panel
 * here would compete with the one instruction that matters.
 */
function WorkspaceEmpty({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 40,
        textAlign: "center",
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          background: "rgba(59,130,246,0.10)",
          color: "#1d4ed8",
        }}
      >
        <Plug2 size={22} />
      </span>
      <Text style={{ fontSize: 14.5, fontWeight: 650, color: "var(--text-primary)" }}>
        Pick an endpoint to open it
      </Text>
      <Text style={{ fontSize: 12.5, color: "var(--text-secondary)", maxWidth: 380, lineHeight: 1.6 }}>
        The tree on the left is the whole catalog — modules hold collections, collections hold endpoints.
        Open one to read or edit its request, authentication and expected response.
      </Text>
      {canCreate && (
        <Button type="primary" icon={<Plus size={14} />} onClick={onCreate} style={{ marginTop: 6, borderRadius: 8 }}>
          New endpoint
        </Button>
      )}
    </div>
  );
}

/** One module card's identity, before its counts are looked up. */
interface ModuleCard {
  key: string;
  name: string;
  description: string | null;
  /** False for a name still on endpoints but no longer in QA settings. */
  curated: boolean;
  /** The QA Settings row's id — absent for a legacy name and for Unfiled. */
  qaModuleId?: string | null;
}

/**
 * The project this page is about, and the way to change it.
 *
 * Sits in the page's own header rather than among the filters: it is not a
 * filter that narrows a list, it is the thing the list is *of*. Same gesture
 * as the Bug List, so switching project is one habit across QA Space rather
 * than one per screen.
 */
function ProjectSwitcher({
  projects,
  projectId,
  onChoose,
}: {
  projects: { value: string; label: string; code?: string }[];
  projectId: string | null;
  onChoose: (id: string | null) => void;
}) {
  const current = projects.find((project) => project.value === projectId);
  const hue = stringToHash(current?.code || "PRJ") % 360;

  return (
    <Dropdown
        trigger={["click"]}
        menu={{
          items: [
            {
              key: "header",
              disabled: true,
              label: (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: 0.6,
                      textTransform: "uppercase",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Projects
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--text-secondary)",
                      background: "var(--bg-slate-50)",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {projects.length} Total
                  </span>
                </div>
              ),
            },
            { type: "divider" as const },
            ...projects.map((project) => {
              const active = project.value === projectId;
              const hue = stringToHash(project.code || "PRJ") % 360;
              return {
                key: project.value,
                label: (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 0" }}>
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 7,
                        fontSize: 10,
                        fontWeight: 800,
                        flexShrink: 0,
                        background: active ? "#3b82f6" : `hsla(${hue}, 70%, 50%, 0.10)`,
                        color: active ? "#ffffff" : `hsl(${hue}, 70%, 50%)`,
                      }}
                    >
                      {(project.code || "PRJ").substring(0, 3).toUpperCase()}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: active ? 700 : 600,
                          color: active ? "#1d4ed8" : "var(--text-primary)",
                        }}
                      >
                        {project.label}
                      </span>
                      <span style={{ fontSize: 10.5, color: "var(--text-secondary)" }}>
                        #{project.code || "N/A"}
                      </span>
                    </span>
                  </div>
                ),
                onClick: () => onChoose(project.value),
              };
            }),
            { type: "divider" as const },
            {
              key: "__all__",
              label: (
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#1d4ed8" }}>
                  <LayoutGrid size={13} />
                  Show all projects
                </span>
              ),
              onClick: () => onChoose(null),
            },
          ],
        }}
      >
        <div className="ph-proj" role="button" tabIndex={0} aria-label="Switch project">
          <span
            className="ph-proj-code"
            style={{
              background: current ? `hsla(${hue}, 68%, 48%, 0.12)` : "var(--bg-slate-50)",
              color: current ? `hsl(${hue}, 68%, 42%)` : "#94a3b8",
            }}
          >
            {(current?.code || "—").substring(0, 3).toUpperCase()}
          </span>
          <span className="ph-proj-text">
            <span className="ph-proj-name">{current?.label ?? "Select a project"}</span>
            <span className="ph-proj-meta">
              <Briefcase size={9.5} style={{ flexShrink: 0 }} />
              {current?.code ? `#${current.code}` : "Switch project"}
            </span>
          </span>
          <ChevronDown size={14} className="ph-proj-caret" />
        </div>
    </Dropdown>
  );
}

/**
 * The whole page until a project is chosen.
 *
 * Pointing at the switcher and leaving the catalog blank would make the reader
 * hunt for the one control that does anything, so the choice is put where the
 * content would have been — the same move the Bug List makes.
 */
function ProjectPicker({
  projects,
  allOptions,
  loading,
  hiddenCount,
  expanded,
  onToggleExpanded,
  onChoose,
}: {
  projects: { value: string; label: string; code?: string }[];
  allOptions: { value: string; label: string; code?: string }[];
  loading: boolean;
  hiddenCount: number;
  expanded: boolean;
  onToggleExpanded: () => void;
  onChoose: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "56px 22px" }}>
      <div style={{ width: "100%", maxWidth: 640 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <span
            style={{
              width: 44,
              height: 44,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: "rgba(59,130,246,0.10)",
              color: "#1d4ed8",
            }}
          >
            <Briefcase size={20} />
          </span>
          <Text
            style={{
              display: "block",
              marginTop: 12,
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Choose a project
          </Text>
          <Text style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            Endpoints, modules and collections all live inside a project. Pick one to open its catalog.
          </Text>
        </div>

        <SearchableDropdown
          options={allOptions.map((project) => ({
            value: project.value,
            label: project.label,
            description: project.code ? `#${project.code}` : undefined,
          }))}
          value={undefined}
          onChange={(value: string) => value && onChoose(value)}
          placeholder={loading ? "Loading projects…" : "Search all projects"}
          searchPlaceholder="Type a project name or code…"
          itemNoun="projects"
          loading={loading}
          allowClear={false}
          style={{ width: "100%" }}
        />

        {projects.length > 0 && (
          <>
            <Text
              style={{
                display: "block",
                margin: "22px 0 10px",
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: "var(--text-secondary)",
              }}
            >
              {expanded ? "All projects" : "Recent projects"}
            </Text>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
              {projects.map((project) => {
                const hue = stringToHash(project.code || "PRJ") % 360;
                return (
                  <button
                    key={project.value}
                    type="button"
                    onClick={() => onChoose(project.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "11px 12px",
                      borderRadius: 10,
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-pure-white)",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{
                        width: 30,
                        height: 30,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 8,
                        fontSize: 10.5,
                        fontWeight: 800,
                        flexShrink: 0,
                        background: `hsla(${hue}, 70%, 50%, 0.10)`,
                        color: `hsl(${hue}, 70%, 50%)`,
                      }}
                    >
                      {(project.code || "PRJ").substring(0, 3).toUpperCase()}
                    </span>
                    <span style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: 12.5,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {project.label}
                      </span>
                      <span style={{ fontSize: 10.5, color: "var(--text-secondary)" }}>
                        #{project.code || "N/A"}
                      </span>
                    </span>
                    <ChevronRight size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>

            {hiddenCount > 0 && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <Button size="small" type="text" onClick={onToggleExpanded} style={{ fontSize: 11.5, color: "#1d4ed8" }}>
                  {expanded ? "Show less" : `Show ${hiddenCount} more`}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** One line of the "what will be imported" review. */
function ImportRow({
  label,
  value,
  mono,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        padding: "5px 0",
        borderTop: "1px dotted var(--border-color)",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, width: 96, flexShrink: 0 }}>
        <span style={{ color: muted ? "#cbd5e1" : "#10b981", display: "inline-flex" }}>
          {muted ? <Minus size={11} /> : <Check size={11} />}
        </span>
        <Text style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>{label}</Text>
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 11.5,
          color: muted ? "var(--text-secondary)" : "var(--text-primary)",
          fontStyle: muted ? "italic" : "normal",
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined,
          wordBreak: "break-all",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** A labelled figure, with an optional note explaining where it came from. */
function Metric({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div>
      <Text style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-secondary)", display: "block" }}>
        {label}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{value}</Text>
      {note && (
        <Text style={{ fontSize: 10.5, color: "var(--text-secondary)", display: "block", marginTop: 1 }}>{note}</Text>
      )}
    </div>
  );
}

/** One way of obtaining the expected result, presented as a card not a button. */
function RouteButton({
  icon: Icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: any;
  label: string;
  hint: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: "1 1 190px",
        display: "flex",
        alignItems: "flex-start",
        gap: 9,
        padding: "10px 12px",
        borderRadius: 8,
        textAlign: "left",
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-color)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <span style={{ color: "#1d4ed8", flexShrink: 0, marginTop: 1 }}>
        <Icon size={14} />
      </span>
      <span>
        <span style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{hint}</span>
      </span>
    </button>
  );
}

/**
 * Pick one of the real responses this API produced during a past flow run.
 *
 * Nothing is sent — these already happened, which is what makes this the safe
 * route for a create or a delete.
 */
function HistoryPicker({
  open,
  loading,
  history,
  onClose,
  onPick,
}: {
  open: boolean;
  loading: boolean;
  history: CapturedResponse[];
  onClose: () => void;
  onPick: (status: number | null, body: string, durationMs?: number | null) => void;
}) {
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={680} title="Use a response from a previous run" destroyOnHidden>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <ZukvoLoader size="md" />
        </div>
      ) : !history.length ? (
        <Text style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
          This API has not run inside a flow yet, so there is no recorded response to reuse. Paste one, generate a
          shape from the payload, or add the API to a flow and run it.
        </Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 460, overflow: "auto" }}>
          <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
            These already happened during a flow run — reusing one sends nothing and creates nothing.
          </Text>
          {history.map((entry) => (
            <button
              key={entry.runStepId}
              type="button"
              onClick={() => onPick(entry.statusCode, entry.body ?? "", entry.durationMs)}
              style={{
                textAlign: "left",
                padding: 11,
                borderRadius: 8,
                background: "var(--bg-pure-white)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 800,
                    color: (entry.statusCode ?? 0) >= 400 ? "#b91c1c" : "#047857",
                  }}
                >
                  {entry.statusCode}
                </span>
                <StatusTag status={entry.status} />
                <span style={{ fontSize: 11.5, color: "var(--text-secondary)", flex: 1 }}>
                  {entry.flowName ?? "Flow"}
                  {entry.runNumber ? ` #${entry.runNumber}` : ""} · {formatDuration(entry.durationMs)} ·{" "}
                  {dayjs(entry.capturedAt).format("DD MMM YYYY, HH:mm")}
                </span>
              </span>
              <ResponseBlock value={entry.body ?? ""} maxHeight={130} />
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

/**
 * What came back from a Send, and the one action that matters: turn it into the
 * expected result.
 *
 * A 4xx/5xx is shown as a normal outcome rather than an error — capturing the
 * expected 404 of a "not found" case is a legitimate thing to want.
 */
function TryResultPanel({
  result,
  onCapture,
}: {
  result: TryApiResult;
  onCapture: (status: number | null, body: string, durationMs?: number | null) => void;
}) {
  const [showRequest, setShowRequest] = useState(false);
  const response = result.response;
  const failed = !!result.error;
  const status = response?.statusCode ?? 0;
  const isError = status >= 400;

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${failed || isError ? "rgba(220,38,38,0.32)" : "rgba(16,185,129,0.32)"}`,
        background: failed || isError ? "rgba(220,38,38,0.09)" : "rgba(16,185,129,0.09)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", flexWrap: "wrap" }}>
        {failed ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c" }}>Request failed</span>
        ) : (
          <>
            <span style={{ fontSize: 13, fontWeight: 800, color: isError ? "#b91c1c" : "#047857" }}>
              {status}
            </span>
            <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
              {formatDuration(response?.durationMs)} · {response?.size ?? 0} bytes
            </span>
          </>
        )}
        <span style={{ flex: 1 }} />
        <Button size="small" type="text" onClick={() => setShowRequest((previous) => !previous)}>
          {showRequest ? "Hide request" : "Show request"}
        </Button>
        {!failed && (
          <Button
            size="small"
            type="primary"
            icon={<Download size={12} />}
            onClick={() => onCapture(status, response!.body, response!.durationMs)}
          >
            Use as expected result
          </Button>
        )}
      </div>

      {result.error && (
        <div style={{ padding: "0 12px 10px", fontSize: 11.5, color: "#b91c1c" }}>{result.error}</div>
      )}
      {result.auth.error && (
        <div style={{ padding: "0 12px 10px", fontSize: 11.5, color: "#b45309" }}>{result.auth.error}</div>
      )}
      {result.unresolvedVariables.length > 0 && (
        <div style={{ padding: "0 12px 10px", fontSize: 11.5, color: "#b45309" }}>
          Unresolved: {result.unresolvedVariables.map((v) => `{{${v}}}`).join(", ")} — the request was sent with
          the placeholder text still in it.
        </div>
      )}

      {showRequest && (
        <div style={{ padding: "0 12px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
          <Text
            style={{
              fontSize: 11.5,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              wordBreak: "break-all",
              color: "var(--text-primary)",
            }}
          >
            {result.request.method} {result.request.url}
          </Text>
          {Object.entries(result.request.headers).map(([key, value]) => (
            <Text
              key={key}
              style={{ fontSize: 11, fontFamily: "ui-monospace, monospace", color: "var(--text-secondary)" }}
            >
              {key}: {value}
            </Text>
          ))}
          {result.request.body && <ResponseBlock value={result.request.body} maxHeight={140} />}
        </div>
      )}

      {response && (
        <div style={{ padding: "0 12px 12px" }}>
          <ResponseBlock value={response.body} />
        </div>
      )}
    </div>
  );
}

/** Monospace block for a captured payload. */
function ResponseBlock({ value, maxHeight = 240 }: { value: string; maxHeight?: number }) {
  const { text } = formatJson(value);
  return (
    <pre
      style={{
        margin: 0,
        padding: 10,
        maxHeight,
        overflow: "auto",
        borderRadius: 6,
        fontSize: 11.5,
        lineHeight: 1.55,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-color)",
        color: "var(--text-primary)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {text || "(empty response)"}
    </pre>
  );
}

/**
 * The status line under a JSON editor: validity, a Format action, and room for
 * one extra action. Validity is live rather than on save, because a payload
 * that will not parse is worth knowing about while you are still looking at it.
 */
function JsonBar({
  state,
  hasContent,
  onFormat,
  extra,
}: {
  state: { valid: boolean; message?: string };
  hasContent: boolean;
  onFormat: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
      {hasContent &&
        (state.valid ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#047857" }}>
            <CheckCircle2 size={12} /> Valid JSON
          </span>
        ) : (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "#b91c1c" }}>
            <AlertCircle size={12} /> {state.message}
          </span>
        ))}
      <span style={{ flex: 1 }} />
      {extra}
      <Button size="small" icon={<Braces size={13} />} onClick={onFormat} disabled={!hasContent || !state.valid}>
        Format
      </Button>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  info,
  icon: Icon,
  action,
  children,
  style,
}: {
  label: string;
  required?: boolean;
  /** A short line under the field. Use `info` for anything longer. */
  hint?: string;
  /**
   * The explanation, behind an (i) on the label.
   *
   * A row of fields whose meanings you learn once should not carry a paragraph
   * about them forever — after the first read it is furniture between you and
   * the controls. A tooltip keeps the answer one hover away and the form short.
   */
  info?: React.ReactNode;
  /** Shown before the label — used to make the request sub-sections scannable. */
  icon?: any;
  /** Right-aligned control on the label row (collapse, grammar, …). */
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {Icon && (
          <span
            style={{
              width: 20,
              height: 20,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 5,
              background: "rgba(59,130,246,0.10)",
              color: "#1d4ed8",
              flexShrink: 0,
            }}
          >
            <Icon size={12} />
          </span>
        )}
        <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
          {label}
          {required && <span style={{ color: "#b91c1c", marginLeft: 3 }}>*</span>}
        </Text>
        {info && (
          <Tooltip title={info}>
            <span style={{ display: "inline-flex", color: "#94a3b8", cursor: "help", flexShrink: 0 }}>
              <Info size={12} />
            </span>
          </Tooltip>
        )}
        {action && (
          <>
            <span style={{ flex: 1 }} />
            {action}
          </>
        )}
      </span>
      {children}
      {hint && (
        <Text style={{ fontSize: 11, color: "var(--text-secondary)", paddingLeft: Icon ? 26 : 0 }}>{hint}</Text>
      )}
    </div>
  );
}

/**
 * A dotted rule between the request's sub-sections.
 *
 * Dotted rather than solid on purpose: these blocks belong to one another
 * (they all describe the same request), so the separator should read as a
 * breath rather than the hard break that closes a whole section.
 */
function DottedDivider() {
  return (
    <div
      role="presentation"
      style={{
        height: 0,
        margin: "2px 0",
        borderTop: "1px dotted var(--border-color)",
        opacity: 0.9,
      }}
    />
  );
}

/** The hard break that closes a section. */
function SectionDivider() {
  return (
    <div
      role="presentation"
      style={{ height: 1, background: "var(--border-color)", margin: "2px 0" }}
    />
  );
}

export default function ApiCatalogPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
            <ZukvoLoader size="lg" />
          </div>
        </MainLayout>
      }
    >
      <ApiCatalogContent />
    </Suspense>
  );
}
