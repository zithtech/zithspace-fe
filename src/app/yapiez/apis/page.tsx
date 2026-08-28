"use client";

/**
 * The API catalog — the developer-facing half of Yapiez.
 *
 * One definition per endpoint: method, URL, headers, query and path params,
 * payload, sample data, auth, expected response and the assertions QA inherits
 * by default. QA never retypes any of it; a flow step just points here.
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Button,
  Drawer,
  Input,
  Modal,
  Segmented,
  Switch,
  Table,
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
  Send,
  ClipboardPaste,
  Download,
  History,
  Sparkles,
  ShieldAlert,
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
  KeyRound,
  ShieldCheck,
  Check,
  Minus,
  FolderKanban,
  LayoutGrid,
  ArrowLeft,
} from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import EntityCard from "@/components/common/EntityCard";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ProjectService } from "@/services/projectService";
import {
  ALL_SOURCES_ICON,
  AssertionEditor,
  KeyValueEditor,
  MethodTag,
  SourceTag,
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
  YapiezEnvironment,
  METHOD_COLORS,
  TryApiResult,
  CapturedResponse,
  formatDuration,
  variablesUsedBy,
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

/** Shapes the cURL import understands, and what each one adds. */
const CURL_FORMATS = [
  { label: "Chrome — Copy as cURL", detail: "Request only — no response is in that clipboard" },
  { label: "curl -i", detail: "Adds the status line and response headers" },
  { label: "curl -v", detail: "Adds the status and headers, prefixed with <" },
  { label: "curl -w", detail: "Adds exact timing and download size" },
];

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
  expectedStatus: null,
  expectedResponse: "",
  responseSchema: {},
  defaultAssertions: [],
  tags: [],
  notes: "",
  isDeprecated: false,
});

function ApiCatalogContent() {
  useActivitySource({ section: "WORK", module: "Yapiez", page: "ApiCatalog" });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { canCreateYapiezApi, canUpdateYapiezApi, canDeleteYapiezApi } = usePermission();

  const [apis, setApis] = useState<YapiezApi[]>([]);
  const [collections, setCollections] = useState<YapiezCollection[]>([]);
  const [sources, setSources] = useState<YapiezSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [methodFilter, setMethodFilter] = useState<string | undefined>();
  const [collectionFilter, setCollectionFilter] = useState<string | undefined>();
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  const [projectFilter, setProjectFilter] = useState<string | undefined>();
  /** Collections is the default: it is how people think about a catalog. */
  const [viewMode, setViewMode] = useState<"collections" | "apis">("collections");
  /** Set when a collection card is opened, showing just its endpoints. */
  const [openCollection, setOpenCollection] = useState<YapiezCollection | null>(null);
  /**
   * The true number of APIs in the current project.
   *
   * NOT the sum of the tier counts: a tier is reached through a collection, so
   * an API filed nowhere belongs to no tier and would be missing from that sum.
   * "All" must agree with what the list actually shows.
   */
  const [totalInScope, setTotalInScope] = useState(0);
  const [projects, setProjects] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<YapiezApi>>(emptyApi());
  const [activeTab, setActiveTab] = useState<"request" | "response" | "auth">("request");

  // Creating a collection without leaving the definition you are writing.
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [creatingCollection, setCreatingCollection] = useState(false);

  // cURL import.
  const [curlOpen, setCurlOpen] = useState(false);
  const [curlText, setCurlText] = useState("");

  // Send — execute the draft and capture the real response.
  const [environments, setEnvironments] = useState<YapiezEnvironment[]>([]);
  const [sendEnvironmentId, setSendEnvironmentId] = useState<string | undefined>();
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
    setLoading(true);
    try {
      const result = await YapiezService.listApis({
        search: debouncedSearch || undefined,
        method: methodFilter,
        collectionId: openCollection?.id ?? collectionFilter,
        sourceId: sourceFilter,
        projectId: projectFilter,
        // Without an explicit project the list is still bounded to the
        // projects this user is on — shared definitions always come through.
        allowedProjects: !projectFilter && projects.length ? projects.map((p) => p.value).join(",") : undefined,
        page,
        pageSize,
        includeDeprecated: true,
      });
      setApis(result.data);
      setTotal(result.total);
      // With no tier or search narrowing it, this list IS the project total.
      if (!sourceFilter && !collectionFilter && !openCollection && !methodFilter && !debouncedSearch) {
        setTotalInScope(result.total);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not load the API catalog");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, methodFilter, collectionFilter, openCollection, sourceFilter, projectFilter, projects, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Collections and source counts both depend on the selected project, so they
   * are refetched with it rather than filtered client-side — the counts in the
   * sidebar have to match what the list actually shows.
   */
  useEffect(() => {
    YapiezService.listSources({ projectId: projectFilter })
      .then(setSources)
      .catch(() => setSources([]));
    YapiezService.listCollections({ projectId: projectFilter })
      .then(setCollections)
      .catch(() => setCollections([]));
    // One cheap call for the honest total, unaffected by search or method.
    YapiezService.listApis({ projectId: projectFilter, pageSize: 1, includeDeprecated: true })
      .then((result) => setTotalInScope(result.total))
      .catch(() => setTotalInScope(0));
  }, [projectFilter]);

  // Opening a collection is a drill-down, not a filter that should survive a
  // change of project or tier.
  useEffect(() => {
    setOpenCollection(null);
  }, [projectFilter, sourceFilter, viewMode]);

  useEffect(() => {
    // Sources seed themselves on first read, so this also bootstraps the four
    // default tiers for a tenant that has never opened Yapiez.
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
              description: project.code || undefined,
            }))
            .filter((option) => option.value && option.label)
        );
      })
      .catch(() => setProjects([]));

    // Sending needs an environment to resolve {{baseUrl}} and any credentials.
    YapiezService.listEnvironments()
      .then((list) => {
        setEnvironments(list);
        setSendEnvironmentId((previous) => previous ?? list.find((e) => e.isDefault)?.id ?? list[0]?.id);
      })
      .catch(() => setEnvironments([]));
  }, []);

  // Deep link from the overview's empty state.
  useEffect(() => {
    if (searchParams.get("create") === "1" && canCreateYapiezApi) {
      const defaultSource = sources.find((source) => source.isDefault) ?? sources[0];
      setEditing({ ...emptyApi(), sourceId: defaultSource?.id ?? null });
      setDrawerOpen(true);
      router.replace("/yapiez/apis");
    }
  }, [searchParams, canCreateYapiezApi, router, sources]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, methodFilter, collectionFilter, sourceFilter, projectFilter]);

  // Narrowing the tier can strand a collection filter that belongs to another
  // one, which would silently return nothing. Clear it rather than leave a
  // filter the user cannot see the effect of.
  useEffect(() => {
    if (!sourceFilter || !collectionFilter) return;
    const collection = collections.find((c) => c.id === collectionFilter);
    if (collection && collection.sourceId && collection.sourceId !== sourceFilter) {
      setCollectionFilter(undefined);
    }
  }, [sourceFilter, collectionFilter, collections]);

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
        environmentId: sendEnvironmentId ?? null,
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
      message.info("Save this API once and run it in a flow — then its real responses appear here.");
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

  /**
   * Create a collection from inside the definition drawer and select it.
   *
   * The alternative — leaving to a settings page and coming back — loses the
   * definition being written, so this is the only sane place for it.
   */
  const createCollection = async () => {
    const name = newCollectionName.trim();
    if (!name) {
      message.warning("Give the collection a name");
      return;
    }
    // Names are unique within a source, not across the tenant — checking
    // globally here would refuse a legitimate "Users" under a second tier.
    // Names are unique within a project AND a source, so the check must match
    // both — a global check would refuse a legitimate "Users" in a second
    // project, which is precisely what project scoping is for.
    const clash = collections.some(
      (c) =>
        c.name.toLowerCase() === name.toLowerCase() &&
        (c.sourceId ?? null) === (editing.sourceId ?? null) &&
        (c.projectId ?? null) === (editing.projectId ?? null)
    );
    if (clash) {
      message.warning("A collection with that name already exists in this project and source");
      return;
    }

    setCreatingCollection(true);
    try {
      // The new collection lands in the tier the definition is currently set
      // to, which is the only thing the author could have meant.
      const created = await YapiezService.createCollection({
        name,
        sourceId: editing.sourceId ?? null,
        projectId: editing.projectId ?? null,
      });
      setCollections((previous) =>
        [...previous, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditing((previous) => ({ ...previous, collectionId: created.id }));
      setNewCollectionName("");
      setCollectionModalOpen(false);
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

  const openCreate = () => {
    // Start in the tenant's default tier (Staging out of the box) rather than
    // unfiled — an API almost always belongs to one, and picking the common
    // case beats making every author choose.
    // Inherit the sidebar's scope. Someone who has narrowed to a project and a
    // tier has already said where the new definition belongs; asking again
    // would be asking a question they just answered.
    const defaultSource = sources.find((source) => source.isDefault) ?? sources[0];
    setEditing({
      ...emptyApi(),
      projectId: projectFilter ?? null,
      sourceId: sourceFilter ?? defaultSource?.id ?? null,
      collectionId: openCollection?.id ?? null,
    });
    setActiveTab("request");
    setTryResult(null);
    setLastCapture(null);
    setDrawerOpen(true);
  };

  const openEdit = async (api: YapiezApi) => {
    try {
      // Refetch so the drawer edits the current definition, not a stale list row.
      const fresh = await YapiezService.getApi(api.id);
      setEditing(fresh);
      setActiveTab("request");
      setTryResult(null);
      setLastCapture(null);
      setDrawerOpen(true);

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
    setActiveTab("request");
    setTryResult(null);
    setLastCapture(null);
    setDrawerOpen(true);
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
        expectedStatus: editing.expectedStatus || null,
      };
      if (editing.id) {
        await YapiezService.updateApi(editing.id, payload);
        message.success("API updated");
      } else {
        await YapiezService.createApi(payload);
        message.success("API added to the catalog");
      }
      setDrawerOpen(false);
      load();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not save this API");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (api: YapiezApi) => {
    try {
      await YapiezService.deleteApi(api.id);
      message.success("API deleted");
      load();
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
        return "Authorization: Bearer {{accessToken}}   — supplied by the flow at run time";
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
   * Collections under the current rail scope, filtered by the search box.
   *
   * The project is applied server-side (the list is refetched with it), so
   * only the tier and the search term are narrowed here.
   */
  const visibleCollections = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return collections.filter((collection) => {
      // A collection with no tier belongs to all of them.
      const tierOk = !sourceFilter || collection.sourceId === sourceFilter || !collection.sourceId;
      const searchOk =
        !needle ||
        collection.name.toLowerCase().includes(needle) ||
        (collection.description ?? "").toLowerCase().includes(needle);
      return tierOk && searchOk;
    });
  }, [collections, sourceFilter, debouncedSearch]);

  /** True when a filter in the bar (not the rail) is hiding something. */
  const isNarrowed = Boolean(debouncedSearch.trim() || methodFilter || collectionFilter);

  const clearFilters = () => {
    setSearch("");
    setMethodFilter(undefined);
    setCollectionFilter(undefined);
  };

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
            source.description ||
            `${source.collectionCount ?? 0} collection${source.collectionCount === 1 ? "" : "s"}`,
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
   * Collections offered for the currently selected tier.
   *
   * Unfiled collections are always offered: a collection with no tier is still
   * a legitimate place to file an API, and hiding it would strand existing data.
   */
  const collectionOptions = useMemo(() => {
    const inScope = collections.filter((collection) => {
      const sourceOk =
        !editing.sourceId || collection.sourceId === editing.sourceId || !collection.sourceId;
      // A shared collection (no project) is valid under any project.
      const projectOk =
        !editing.projectId || collection.projectId === editing.projectId || !collection.projectId;
      return sourceOk && projectOk;
    });

    return [
      ...inScope.map((collection) => ({
        value: collection.id,
        label: collection.name,
        description: collection.sourceLabel
          ? `${collection.sourceLabel} · ${collection.apiCount ?? 0} API${collection.apiCount === 1 ? "" : "s"}`
          : `Unfiled · ${collection.apiCount ?? 0} API${collection.apiCount === 1 ? "" : "s"}`,
      })),
      {
        value: "__create_new__",
        label: "Create new collection",
        description: editing.sourceId
          ? `Added under ${sources.find((s) => s.id === editing.sourceId)?.label ?? "this source"}`
          : "Add one without leaving this definition",
        badge: <FolderPlus size={13} />,
        pinned: true,
      },
    ];
  }, [collections, editing.sourceId, editing.projectId, sources]);

  const onProjectChange = (value: string) => {
    // A collection belonging to the old project cannot survive the move; a
    // shared one (no project) is valid anywhere and is kept.
    const current = collections.find((c) => c.id === editing.collectionId);
    const keepCollection = !current || !current.projectId || current.projectId === value;
    setEditing({
      ...editing,
      projectId: value || null,
      collectionId: keepCollection ? editing.collectionId : null,
    });
  };

  const onSourceChange = (value: string) => {
    if (value === "__create_new__") {
      setSourceModalOpen(true);
      return;
    }
    // The selected collection belongs to the old tier, so it cannot survive a
    // tier change — clear it unless it is an unfiled collection, which is valid
    // under any tier.
    const current = collections.find((c) => c.id === editing.collectionId);
    const keepCollection = !current || !current.sourceId || current.sourceId === value;
    setEditing({
      ...editing,
      sourceId: value || null,
      collectionId: keepCollection ? editing.collectionId : null,
    });
  };

  const onCollectionChange = (value: string) => {
    if (value === "__create_new__") {
      setCollectionModalOpen(true);
      return;
    }
    // Picking a collection settles the tier too — the API's tier IS its
    // collection's tier, so the two pickers must never disagree.
    const picked = collections.find((c) => c.id === value);
    setEditing({
      ...editing,
      collectionId: value || null,
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

  const columns = [
    {
      title: "Method",
      dataIndex: "method",
      width: 90,
      render: (method: HttpMethod) => <MethodTag method={method} />,
    },
    {
      title: "API",
      dataIndex: "name",
      render: (_: string, record: YapiezApi) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {record.name}
            {record.isDeprecated && (
              <span
                style={{
                  marginLeft: 8,
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#475569",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                }}
              >
                DEPRECATED
              </span>
            )}
          </span>
          <span
            style={{
              fontSize: 11.5,
              color: "var(--text-secondary)",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            }}
          >
            {record.url}
          </span>
        </div>
      ),
    },
    {
      title: "Project",
      dataIndex: "projectName",
      width: 140,
      render: (name: string | null) =>
        name ? (
          <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 500 }}>{name}</span>
        ) : (
          <Tooltip title="Shared — available from every project">
            <span style={{ fontSize: 11.5, color: "var(--text-secondary)", fontStyle: "italic" }}>Shared</span>
          </Tooltip>
        ),
    },
    {
      title: "Source",
      dataIndex: "sourceLabel",
      width: 120,
      render: (_: string | null, record: YapiezApi) => (
        <SourceTag label={record.sourceLabel} color={record.sourceColor} />
      ),
    },
    {
      title: "Collection",
      dataIndex: "collectionName",
      width: 150,
      render: (name: string | null) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{name || "—"}</span>
      ),
    },
    {
      title: "Used in flows",
      dataIndex: "usedInFlows",
      width: 110,
      align: "center" as const,
      render: (count: number) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: count ? "#1d4ed8" : "var(--text-secondary)" }}>
          {count ?? 0}
        </span>
      ),
    },
    {
      title: "",
      width: 120,
      align: "right" as const,
      render: (_: any, record: YapiezApi) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          {canUpdateYapiezApi && (
            <Tooltip title="Edit">
              <Button size="small" type="text" icon={<Pencil size={13} />} onClick={() => openEdit(record)} />
            </Tooltip>
          )}
          {canCreateYapiezApi && (
            <Tooltip title="Duplicate">
              <Button size="small" type="text" icon={<Copy size={13} />} onClick={() => duplicate(record)} />
            </Tooltip>
          )}
          {canDeleteYapiezApi && (
            <ConfirmDialog
              title="Delete this API?"
              description={
                record.usedInFlows
                  ? `It is used by ${record.usedInFlows} flow step(s). Deleting is refused while that is true — mark it deprecated instead.`
                  : "This removes the definition from the catalog."
              }
              tone="danger"
              confirmText="Delete"
              onConfirm={() => remove(record)}
            >
              <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
            </ConfirmDialog>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div style={{ display: "flex", alignItems: "stretch", minHeight: "calc(100vh - 64px)" }}>
        {/* ── Left rail: the scope everything else obeys ── */}
        <aside
          style={{
            width: 236,
            flexShrink: 0,
            padding: "18px 14px",
            borderRight: "1px solid var(--border-color, #e2e8f0)",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <RailLabel>Project</RailLabel>
            <SearchableDropdown
              value={projectFilter ?? null}
              onChange={(value: string) => setProjectFilter(value || undefined)}
              options={projects}
              placeholder="All projects"
              itemNoun="projects"
              width={230}
              style={{ width: "100%" }}
            />
            <Text style={{ fontSize: 10.5, color: "var(--text-secondary)", display: "block", marginTop: 6, lineHeight: 1.5 }}>
              {projectFilter
                ? "New definitions land in this project."
                : "Showing every project you are on, plus shared endpoints."}
            </Text>
          </div>

          <div>
            <RailLabel>Sources</RailLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <RailItem
                label="All"
                icon={ALL_SOURCES_ICON}
                color="#2563eb"
                count={totalInScope}
                active={!sourceFilter}
                onClick={() => setSourceFilter(undefined)}
              />
              {sources.map((source) => (
                <RailItem
                  key={source.id}
                  label={source.label}
                  icon={sourceIcon(source)}
                  color={source.color}
                  count={source.apiCount ?? 0}
                  active={sourceFilter === source.id}
                  onClick={() => setSourceFilter(source.id)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ── Right: the catalog itself ── */}
        <section style={{ flex: 1, minWidth: 0, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* ── Header: identity, current scope, and the two actions ── */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              paddingBottom: 14,
              borderBottom: "1px solid var(--border-color, #e2e8f0)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span
                  style={{
                    width: 30,
                    height: 30,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 9,
                    background: "rgba(59,130,246,0.10)",
                    color: "#1d4ed8",
                  }}
                >
                  <Plug2 size={16} />
                </span>
                <div>
                  <Text style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", display: "block", lineHeight: 1.25 }}>
                    API Catalog
                  </Text>
                  {/* The rail's scope, restated — a filter you cannot see the
                      effect of is a filter you forget you set. */}
                  <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 3 }}>
                    <ScopeChip
                      label={projects.find((p) => p.value === projectFilter)?.label ?? "All projects"}
                      icon={FolderKanban}
                    />
                    <span style={{ color: "#cbd5e1", fontSize: 11 }}>/</span>
                    <ScopeChip
                      label={sources.find((source) => source.id === sourceFilter)?.label ?? "All sources"}
                      icon={Layers3}
                      color={sources.find((source) => source.id === sourceFilter)?.color}
                    />
                    {/* No counts here — the view toggle carries them, and a
                        number stated twice is a number you have to reconcile. */}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ViewToggle
                value={viewMode}
                onChange={setViewMode}
                collectionCount={visibleCollections.length}
                apiCount={totalInScope}
              />
              {canCreateYapiezApi && (
                <Button type="primary" icon={<Plus size={14} />} onClick={openCreate}>
                  Define API
                </Button>
              )}
            </div>
          </div>

          {/* Drilling into a card swaps the header for a way back out. */}
          {openCollection && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Button size="small" icon={<ArrowLeft size={13} />} onClick={() => setOpenCollection(null)}>
                All collections
              </Button>
              <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                {openCollection.name}
              </Text>
              {openCollection.sourceLabel && (
                <SourceTag label={openCollection.sourceLabel} color={openCollection.sourceColor} />
              )}
              <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                {openCollection.projectName ?? "Shared across all projects"}
              </Text>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Input
              allowClear
              prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
              placeholder={viewMode === "collections" && !openCollection ? "Search collections" : "Search by name, URL or description"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 300 }}
            />
            {(viewMode === "apis" || openCollection) && (
              <>
                <SearchableDropdown
                  value={methodFilter ?? null}
                  onChange={(value: string) => setMethodFilter(value || undefined)}
                  options={HTTP_METHODS.map((m) => ({ value: m, label: m }))}
                  placeholder="All methods"
                  width={200}
                  hideAvatar
                />
                {!openCollection && (
                  <SearchableDropdown
                    value={collectionFilter ?? null}
                    onChange={(value: string) => setCollectionFilter(value || undefined)}
                    options={visibleCollections.map((c) => ({
                      value: c.id,
                      label: c.name,
                      description: `${c.sourceLabel ?? "Unfiled"} · ${c.apiCount ?? 0} API${c.apiCount === 1 ? "" : "s"}`,
                    }))}
                    placeholder="All collections"
                    itemNoun="collections"
                    width={240}
                  />
                )}
              </>
            )}
            <span style={{ flex: 1 }} />
            {/* Only speak up when a filter is actually hiding something. */}
            {isNarrowed && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                  {viewMode === "collections" && !openCollection
                    ? `${visibleCollections.length} of ${collections.length} collections`
                    : `${total} of ${totalInScope} APIs`}
                </Text>
                <Button size="small" type="text" onClick={clearFilters} style={{ fontSize: 11, color: "#1d4ed8" }}>
                  Clear
                </Button>
              </span>
            )}
          </div>

          {viewMode === "collections" && !openCollection ? (
            <CollectionGrid
              collections={visibleCollections}
              loading={loading}
              onOpen={(collection) => setOpenCollection(collection)}
            />
          ) : (
            <Table
              rowKey="id"
              size="small"
              columns={columns as any}
              dataSource={apis}
              loading={{ spinning: loading, indicator: <ZukvoLoader size="md" /> }}
              onRow={(record) => ({
                onClick: () => canUpdateYapiezApi && openEdit(record),
                style: { cursor: canUpdateYapiezApi ? "pointer" : "default" },
              })}
              pagination={{
                current: page,
                pageSize,
                total,
                showSizeChanger: true,
                onChange: (nextPage, nextSize) => {
                  setPage(nextPage);
                  setPageSize(nextSize);
                },
              }}
            />
          )}
        </section>
      </div>

      <Drawer
        {...commonDrawerProps}
        width={860}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ ...commonDrawerProps.styles, body: { padding: 0, background: "var(--card-bg, #ffffff)" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid var(--border-color, #e2e8f0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {editing.id ? "Edit API" : "Define API"}
            </Text>
            <div style={{ display: "flex", gap: 8 }}>
              <Tooltip title="Paste a cURL command — from your browser's network tab, Postman, or by hand">
                <Button icon={<TerminalSquare size={14} />} onClick={() => setCurlOpen(true)}>
                  Import cURL
                </Button>
              </Tooltip>
              <Tooltip title="Send this request and capture the real status and response">
                <Button icon={<Send size={14} />} loading={sending} onClick={sendDraft}>
                  Send
                </Button>
              </Tooltip>
              <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button type="primary" loading={saving} onClick={save}>
                {editing.id ? "Save changes" : "Add to catalog"}
              </Button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
            {/* ── Identity ── */}
            {/* ── Definition: what this endpoint IS. One block, closed by a
                   rule, so the tabs below read as detail rather than more of
                   the same. ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="API name" required icon={Plug2}>
                <Input
                  placeholder="Create User"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                />
              </Field>

              {/* The request line, kept as one unit — a method without its URL
                  says nothing, so they share a row and a border. */}
              <Field
                label="Endpoint"
                required
                icon={LinkIcon}
                hint="A relative path resolves against the environment's Base URL; an absolute URL is used as-is."
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    borderRadius: 7,
                    border: "1px solid var(--border-color, #d9d9d9)",
                    overflow: "hidden",
                  }}
                >
                  {/* The shared dropdown with a custom trigger, so the method
                      keeps its colour inside the composed control instead of
                      looking like a plain select bolted on. */}
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
                      <button
                        type="button"
                        aria-label="HTTP method"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 6,
                          width: 108,
                          height: 32,
                          padding: "0 10px",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            letterSpacing: 0.3,
                            color: METHOD_COLORS[(editing.method ?? "GET") as HttpMethod].text,
                          }}
                        >
                          {editing.method ?? "GET"}
                        </span>
                        <ChevronDown size={13} style={{ color: "#94a3b8", flexShrink: 0 }} />
                      </button>
                    }
                  />
                  <span style={{ width: 1, background: "var(--border-color, #e2e8f0)" }} />
                  <Input
                    variant="borderless"
                    placeholder="/api/users/{userId}"
                    value={editing.url}
                    onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                    style={{ flex: 1, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 }}
                  />
                </div>
              </Field>

              <Field label="Project" icon={FolderKanban}>
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
                <Field label="Source" style={{ flex: "1 1 220px" }} icon={Layers3}>
                  <SearchableDropdown
                    value={editing.sourceId ?? null}
                    onChange={onSourceChange}
                    options={sourceOptions}
                    placeholder="No source"
                    itemNoun="sources"
                    width={320}
                  />
                </Field>
                <Field label="Collection" style={{ flex: "1 1 220px" }} icon={FolderPlus}>
                  <SearchableDropdown
                    value={editing.collectionId ?? null}
                    onChange={onCollectionChange}
                    options={collectionOptions}
                    placeholder="Unfiled"
                    itemNoun="collections"
                    width={320}
                  />
                </Field>
              </div>
              <Text style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: -8, lineHeight: 1.6 }}>
                Project scopes the definition the way it scopes test scopes and bug folders — leave it blank to
                share the endpoint with every project. Source is the deployment tier it describes, and the
                collection groups related endpoints inside both.
              </Text>

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
                <TextArea
                  rows={3}
                  placeholder="What this endpoint does, and anything QA needs to know before calling it."
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
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
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
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
                              background: header.enabled === false ? "#f1f5f9" : "#eff6ff",
                              border: `1px solid ${header.enabled === false ? "#e2e8f0" : "#bfdbfe"}`,
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
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
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

                {/* Body type and timeout are settings for the request as a
                    whole, not another table — so they sit on one line together
                    rather than pretending to be two more fields. */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    flexWrap: "wrap",
                    padding: "11px 13px",
                    borderRadius: 9,
                    background: "var(--input-bg, #f8fafc)",
                    border: "1px solid var(--border-color, #e2e8f0)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
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
                      }}
                    >
                      <FileJson2 size={12} />
                    </span>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Body</Text>
                    <Segmented
                      size="small"
                      value={editing.bodyType}
                      onChange={(bodyType) => setEditing({ ...editing, bodyType: bodyType as BodyType })}
                      options={BODY_TYPES.map((t) => ({
                        value: t,
                        label: t === "none" ? "None" : t === "json" ? "JSON" : t === "form" ? "Form" : "Text",
                      }))}
                    />
                  </span>

                  <span style={{ flex: 1 }} />

                  <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 5,
                        background: "rgba(100,116,139,0.12)",
                        color: "#475569",
                      }}
                    >
                      <Timer size={12} />
                    </span>
                    <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Timeout</Text>
                    <Input
                      size="small"
                      type="number"
                      placeholder="30000"
                      value={editing.timeoutMs ?? ""}
                      onChange={(e) =>
                        setEditing({ ...editing, timeoutMs: e.target.value ? Number(e.target.value) : null })
                      }
                      suffix={<span style={{ fontSize: 10.5, color: "var(--text-secondary)" }}>ms</span>}
                      style={{ width: 128 }}
                    />
                    <Tooltip title="Blank uses the server default (30s), capped at 120s.">
                      <span style={{ display: "inline-flex", color: "#94a3b8", cursor: "help" }}>
                        <Info size={13} />
                      </span>
                    </Tooltip>
                  </span>
                </div>

                {editing.bodyType !== "none" && (
                  <Field
                    label="Request payload"
                    hint="{{variables}} are substituted at run time — {{userId}}, {{accessToken}}, anything a previous step saved"
                  >
                    <TextArea
                      rows={8}
                      value={editing.requestBody ?? ""}
                      onChange={(e) => setEditing({ ...editing, requestBody: e.target.value })}
                      placeholder={'{\n  "name": "John",\n  "email": "john@test.com"\n}'}
                      style={{
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 12.5,
                        borderColor: payloadJson.valid ? undefined : "#fca5a5",
                      }}
                    />
                    {editing.bodyType === "json" && (
                      <JsonBar
                        state={payloadJson}
                        hasContent={!!editing.requestBody?.trim()}
                        onFormat={() => {
                          const { text, error } = formatJson(editing.requestBody ?? "");
                          if (error) message.warning(`Cannot format: ${error}`);
                          else setEditing({ ...editing, requestBody: text });
                        }}
                      />
                    )}
                  </Field>
                )}

                {variablesInUse.length > 0 && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    <Text style={{ fontSize: 11.5, fontWeight: 700, color: "#1e3a8a", display: "block" }}>
                      Variables this API expects
                    </Text>
                    <Text style={{ fontSize: 11.5, color: "#1e40af" }}>
                      {variablesInUse.map((v) => `{{${v}}}`).join("  ")} — each must come from an environment
                      variable or an earlier step&apos;s extraction.
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
                      background: "var(--input-bg, #f8fafc)",
                      border: "1px solid var(--border-color, #e2e8f0)",
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
                        hint={editing.id ? "A real response, already recorded" : "Available once this API has run in a flow"}
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

                    <div style={{ height: 1, background: "var(--border-color, #e2e8f0)" }} />

                    {/* The live route, gated for anything that changes data. */}
                    {isWriteMethod(editing.method) && (
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 8,
                          background: allowWriteSend ? "#fef2f2" : "var(--card-bg, #ffffff)",
                          border: `1px solid ${allowWriteSend ? "#fecaca" : "var(--border-color, #e2e8f0)"}`,
                        }}
                      >
                        <span style={{ color: allowWriteSend ? "#b91c1c" : "#b45309", flexShrink: 0, marginTop: 1 }}>
                          <ShieldAlert size={15} />
                        </span>
                        <div style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11.5, color: "var(--text-primary)", display: "block", lineHeight: 1.6 }}>
                            Sending <strong>{editing.method}</strong> changes real data in the selected environment,
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
                      <SearchableDropdown
                        value={sendEnvironmentId ?? null}
                        onChange={(value: string) => setSendEnvironmentId(value || undefined)}
                        options={environments.map((environment) => ({
                          value: environment.id,
                          label: environment.name,
                          description: environment.baseUrl,
                        }))}
                        placeholder="Environment"
                        itemNoun="environments"
                        width={260}
                      />
                      <SearchableDropdown
                        value={sendAuthApiId ?? null}
                        onChange={(value: string) => setSendAuthApiId(value || undefined)}
                        options={apis
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

                    {!environments.length && (
                      <Text style={{ fontSize: 11.5, color: "#b45309" }}>
                        No environments yet — a relative URL has no {"{{baseUrl}}"} to resolve against. Add one under
                        Yapiez → Environments, or give this API an absolute URL.
                      </Text>
                    )}

                    {sendAuthApiId && (
                      <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                        That login runs first and its token is attached to this request — the same way a flow does it.
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
                        background: "var(--input-bg, #f8fafc)",
                        border: "1px solid var(--border-color, #e2e8f0)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {JSON.stringify(editing.responseSchema, null, 2)}
                    </pre>
                  </Field>
                )}

                <Field
                  label="Default assertions"
                  hint="Every flow step using this API inherits these unless it writes its own"
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
                            background: selected ? "#eff6ff" : "var(--card-bg, #ffffff)",
                            border: `1px solid ${selected ? "#bfdbfe" : "var(--border-color, #e2e8f0)"}`,
                            boxShadow: selected ? "inset 0 0 0 1px #bfdbfe" : "none",
                          }}
                        >
                          <span style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                            <span
                              style={{
                                width: 15,
                                height: 15,
                                borderRadius: 999,
                                border: `1.5px solid ${selected ? "#2563eb" : "var(--border-color, #cbd5e1)"}`,
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
                    background: "var(--input-bg, #f8fafc)",
                    border: "1px solid var(--border-color, #e2e8f0)",
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
                    Nothing to configure here. The flow authenticates once at the start of every run and attaches
                    the token it gets back — that is why a step never has to carry a credential of its own. A
                    single step can still opt out under the flow builder&apos;s step settings.
                  </Text>
                )}

                {editing.authType === "none" && (
                  <Text style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.65 }}>
                    No credential is attached. This is the right choice for a public endpoint and for the login
                    call itself — a login that inherited the flow&apos;s token would be circular.
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
        </div>
      </Drawer>

      {/* Create a collection without losing the definition being written. */}
      <Modal
        open={collectionModalOpen}
        title="New collection"
        okText="Create"
        confirmLoading={creatingCollection}
        onOk={createCollection}
        onCancel={() => {
          setCollectionModalOpen(false);
          setNewCollectionName("");
        }}
        width={440}
        destroyOnHidden
      >
        <Text style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
          A collection groups related endpoints — Users, Billing, Auth. The new one is selected for this API
          straight away.
        </Text>
        <Text style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 10 }}>
          {editing.sourceId ? (
            <>
              It will be created under{" "}
              <strong>{sources.find((s) => s.id === editing.sourceId)?.label}</strong>.
            </>
          ) : (
            "No source is selected, so it will be created unfiled and available under every tier."
          )}
        </Text>
        <Input
          autoFocus
          placeholder="Users"
          value={newCollectionName}
          onChange={(e) => setNewCollectionName(e.target.value)}
          onPressEnter={createCollection}
        />
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
          above collections, so the same collection name can exist under more than one tier.
        </Text>
        <Input
          autoFocus
          placeholder="Pre-prod"
          value={newSourceLabel}
          onChange={(e) => setNewSourceLabel(e.target.value)}
          onPressEnter={createSource}
        />
        <Text style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginTop: 10 }}>
          This is a catalogue label, not a run target — the base URL and credentials a flow actually uses come
          from its Environment.
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
              background: "var(--input-bg, #f8fafc)",
              border: "1px solid var(--border-color, #e2e8f0)",
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
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
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
                background: "#fef2f2",
                border: "1px solid #fecaca",
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
                border: "1px solid var(--border-color, #e2e8f0)",
                background: "var(--input-bg, #f8fafc)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "8px 13px",
                  borderBottom: "1px solid var(--border-color, #e2e8f0)",
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
                background: "#fffbeb",
                border: "1px solid #fde68a",
              }}
            >
              <span style={{ color: "#b45309", flexShrink: 0, marginTop: 1 }}>
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
        background: "var(--input-bg, #f8fafc)",
        border: "1px solid var(--border-color, #e2e8f0)",
      }}
    >
      <Metric
        label="Payload"
        value={payloadBytes ? `${payloadBytes} B` : "—"}
        note={payloadBytes ? "this request" : "no body"}
      />

      <span style={{ width: 1, alignSelf: "stretch", background: "var(--border-color, #e2e8f0)" }} />

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

/** Small uppercase heading in the left rail. */
function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        display: "block",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        color: "var(--text-secondary)",
        marginBottom: 7,
      }}
    >
      {children}
    </Text>
  );
}

/**
 * A selectable tier in the rail: icon, label, API count.
 *
 * The icon carries the tier's own colour so the rail is scannable by glyph and
 * hue together — a custom tier reads as a tier rather than as an anomaly.
 */
function RailItem({
  label,
  count,
  color,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color?: string | null;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  const tint = color || "#64748b";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "100%",
        padding: "6px 9px",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: active ? "rgba(59,130,246,0.10)" : "transparent",
        color: active ? "#1d4ed8" : "var(--text-primary)",
        fontWeight: active ? 700 : 500,
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 6,
          background: active ? `${tint}24` : `${tint}14`,
          color: tint,
        }}
      >
        <Icon size={12.5} />
      </span>
      <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.3 }}>{label}</span>
      <span style={{ fontSize: 11, color: active ? "#1d4ed8" : "var(--text-secondary)", fontWeight: 600 }}>
        {count}
      </span>
    </button>
  );
}

/**
 * The Collections / API list switch.
 *
 * Hand-built rather than antd's Segmented for two reasons: a lucide SVG sits on
 * the text baseline inside a Segmented item, so the icons rendered a couple of
 * pixels low against their labels; and a bare toggle says nothing about what
 * you are switching to. Carrying the counts makes the choice informed.
 */
function ViewToggle({
  value,
  onChange,
  collectionCount,
  apiCount,
}: {
  value: "collections" | "apis";
  onChange: (next: "collections" | "apis") => void;
  collectionCount: number;
  apiCount: number;
}) {
  const OPTIONS = [
    { key: "collections" as const, label: "Collections", icon: LayoutGrid, count: collectionCount },
    { key: "apis" as const, label: "API list", icon: ListIcon, count: apiCount },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Catalog view"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 3,
        height: 32,
        borderRadius: 8,
        background: "var(--input-bg, #f1f5f9)",
        border: "1px solid var(--border-color, #e2e8f0)",
      }}
    >
      {OPTIONS.map((option) => {
        const active = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 24,
              padding: "0 10px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              fontSize: 12.5,
              fontWeight: active ? 700 : 500,
              color: active ? "#1d4ed8" : "var(--text-secondary)",
              background: active ? "var(--card-bg, #ffffff)" : "transparent",
              boxShadow: active ? "0 1px 2px rgba(15,23,42,0.10)" : "none",
              transition: "background 140ms ease, color 140ms ease",
              // Flex centring is what actually fixes the icon baseline issue.
              lineHeight: 1,
            }}
          >
            <option.icon size={13} style={{ flexShrink: 0 }} />
            {option.label}
            <span
              style={{
                minWidth: 18,
                padding: "0 5px",
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                lineHeight: "16px",
                textAlign: "center",
                color: active ? "#1d4ed8" : "var(--text-secondary)",
                background: active ? "rgba(59,130,246,0.12)" : "var(--card-bg, #ffffff)",
              }}
            >
              {option.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A small chip stating one dimension of the current scope. */
function ScopeChip({ label, icon: Icon, color }: { label: string; icon: any; color?: string | null }) {
  const tint = color || "#64748b";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "1px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: tint,
        background: `${tint}14`,
        border: `1px solid ${tint}33`,
      }}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}

/** Initials for a collection, so a wall of cards is scannable by shape. */
function initialsOf(name: string): string {
  const parts = (name ?? "").split(/[\s_-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (name ?? "?").slice(0, 2).toUpperCase();
}

/**
 * The proportions of a collection's verbs, inline.
 *
 * A count says how big a collection is; the mix says what it does — mostly
 * reads, or something that writes and deletes. Rendered as coloured dots with
 * counts so it sits on one line inside the card's fact row.
 */
function MethodMix({ counts, total }: { counts: Record<string, number>; total: number }) {
  const entries = HTTP_METHODS.map((method) => [method, counts?.[method] ?? 0] as const).filter(
    ([, n]) => n > 0
  );

  if (!total || !entries.length) {
    return <span style={{ fontSize: 11.5, color: "var(--text-slate-400)" }}>—</span>;
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      {entries.map(([method, n]) => (
        <span key={method} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span
            title={`${n} ${method}`}
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: METHOD_COLORS[method].text,
              display: "inline-block",
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-slate-700)" }}>
            {n} {method}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * Collections as cards — the default view, because a catalog is navigated by
 * area before it is navigated by endpoint. Clicking one drills into its
 * endpoints rather than opening a dialog.
 *
 * Uses the shared EntityCard so the catalog matches the project list rather
 * than inventing a second card language two screens apart.
 */
function CollectionGrid({
  collections,
  loading,
  onOpen,
}: {
  collections: YapiezCollection[];
  loading: boolean;
  onOpen: (collection: YapiezCollection) => void;
}) {
  if (loading && !collections.length) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <ZukvoLoader size="lg" />
      </div>
    );
  }

  if (!collections.length) {
    return (
      <div
        style={{
          padding: 44,
          textAlign: "center",
          borderRadius: 10,
          border: "1px dashed var(--border-color, #cbd5e1)",
        }}
      >
        <Text style={{ fontSize: 13, color: "var(--text-secondary)", display: "block" }}>
          No collections here yet.
        </Text>
        <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          A collection groups related endpoints — Users, Billing, Auth. Create one while defining an API.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
      {collections.map((collection) => {
        const tint = collection.sourceColor || "#3b82f6";
        const count = collection.apiCount ?? 0;

        return (
          <EntityCard
            key={collection.id}
            initials={initialsOf(collection.name)}
            accent={tint}
            title={collection.name}
            metaLabel="Project:"
            metaValue={collection.projectName ?? "Shared"}
            status={collection.sourceLabel?.toUpperCase() ?? null}
            description={collection.description}
            onClick={() => onOpen(collection)}
            facts={[
              { label: "APIs:", value: count },
              {
                label: "Methods:",
                // The verb mix is what distinguishes two collections of the
                // same size, so it earns a place among the facts.
                value: <MethodMix counts={collection.methodCounts ?? {}} total={count} />,
              },
              {
                label: "Updated:",
                value: collection.updatedAt ? dayjs(collection.updatedAt).fromNow() : "—",
              },
            ]}
          />
        );
      })}
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
        borderTop: "1px dotted var(--border-color, #e2e8f0)",
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
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
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
                background: "var(--card-bg, #ffffff)",
                border: "1px solid var(--border-color, #e2e8f0)",
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
        border: `1px solid ${failed || isError ? "#fecaca" : "#a7f3d0"}`,
        background: failed || isError ? "#fef2f2" : "#ecfdf5",
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
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
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
  icon: Icon,
  action,
  children,
  style,
}: {
  label: string;
  required?: boolean;
  hint?: string;
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
        borderTop: "1px dotted var(--border-color, #cbd5e1)",
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
      style={{ height: 1, background: "var(--border-color, #e2e8f0)", margin: "2px 0" }}
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
