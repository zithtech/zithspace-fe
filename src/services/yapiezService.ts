import { apiClient } from "@/lib/axios";

/**
 * API Hub — the endpoint catalog that feeds QA Space.
 *
 * Developers publish an API definition once (method, URL, headers, payload,
 * sample data, expected response) and QA reads it from its own screens rather
 * than retyping any of it. Definitions are filed Project → Module → Collection,
 * the same taxonomy bugs and test cases use.
 *
 * API Hub is a sibling of QA Space, not a page inside it: it has its own
 * permissions and its own mount. The transport names below are unchanged —
 * the module was called Yapiez before it was called API Hub, and renaming a
 * live route and its permission keys would log every user out of the feature
 * for the sake of a URL.
 */

const BASE = "/api/v2/yapiez";

// ─── Vocabulary ─────────────────────────────────────────────────────────────

export const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type HttpMethod = (typeof HTTP_METHODS)[number];

/** Method colours. Blue for reads, green for creates, ash for mutations, light
 *  red reserved for DELETE — the destructive verb, matching the app's palette. */
export const METHOD_COLORS: Record<HttpMethod, { text: string; bg: string; border: string }> = {
  GET: { text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  POST: { text: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
  PUT: { text: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  PATCH: { text: "#475569", bg: "#f1f5f9", border: "#cbd5e1" },
  DELETE: { text: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
};

export const BODY_TYPES = ["none", "json", "form", "text"] as const;
export type BodyType = (typeof BODY_TYPES)[number];

export const AUTH_TYPES = ["inherit", "none", "bearer", "basic", "api_key"] as const;
export type AuthType = (typeof AUTH_TYPES)[number];

export const AUTH_TYPE_LABELS: Record<AuthType, string> = {
  inherit: "Inherit from flow",
  none: "No authentication",
  bearer: "Bearer token",
  basic: "Basic auth",
  api_key: "API key",
};

export const AUTH_TYPE_HELP: Record<AuthType, string> = {
  inherit: "Use the flow's authentication token (the usual choice).",
  none: "Send no credentials — for public endpoints and the login call itself.",
  bearer: "Send a specific bearer token defined on this API.",
  basic: "Send HTTP Basic credentials defined on this API.",
  api_key: "Send an API key header defined on this API.",
};

export const ASSERTION_SOURCES = ["status", "body", "header", "responseTime"] as const;
export type AssertionSource = (typeof ASSERTION_SOURCES)[number];

export const ASSERTION_OPERATORS = [
  "equals",
  "notEquals",
  "exists",
  "notExists",
  "contains",
  "notContains",
  "matches",
  "greaterThan",
  "lessThan",
  "isNumber",
  "isString",
  "isBoolean",
  "isArray",
  "isEmpty",
  "isNotEmpty",
] as const;
export type AssertionOperator = (typeof ASSERTION_OPERATORS)[number];

export const OPERATOR_LABELS: Record<AssertionOperator, string> = {
  equals: "equals",
  notEquals: "does not equal",
  exists: "exists",
  notExists: "does not exist",
  contains: "contains",
  notContains: "does not contain",
  matches: "matches regex",
  greaterThan: "is greater than",
  lessThan: "is less than",
  isNumber: "is a number",
  isString: "is a string",
  isBoolean: "is a boolean",
  isArray: "is an array",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
};

/** Operators that compare against a value the author types. */
export const OPERATORS_NEEDING_VALUE = new Set<AssertionOperator>([
  "equals",
  "notEquals",
  "contains",
  "notContains",
  "matches",
  "greaterThan",
  "lessThan",
]);

export const EXTRACTION_SOURCES = ["body", "header", "status"] as const;
export type ExtractionSource = (typeof EXTRACTION_SOURCES)[number];

export type RunStatus = "Running" | "Passed" | "Failed" | "Aborted";
export type StepStatus = "Pass" | "Fail" | "Skipped";

/** The marker the server sends instead of a secret value. Leave it untouched
 *  on save and the stored secret is preserved. */
export const SECRET_MASK = "__YAPIEZ_SECRET__";

// ─── Shapes ─────────────────────────────────────────────────────────────────

export interface KeyValueEntry {
  key: string;
  value: string;
  description?: string;
  enabled?: boolean;
  required?: boolean;
  secret?: boolean;
}

export interface Assertion {
  id?: string;
  name?: string;
  source: AssertionSource;
  path?: string;
  operator: AssertionOperator;
  expected?: string;
}

export interface AssertionResult {
  name: string;
  source: AssertionSource;
  path?: string;
  operator: AssertionOperator;
  expected?: string;
  actual?: string;
  passed: boolean;
  message: string;
}

export interface Extraction {
  variable: string;
  source: ExtractionSource;
  path?: string;
  required?: boolean;
}

export interface StepOverrides {
  url?: string;
  headers?: KeyValueEntry[];
  queryParams?: KeyValueEntry[];
  pathParams?: KeyValueEntry[];
  body?: string;
  bodyType?: BodyType;
  timeoutMs?: number;
  skipAuth?: boolean;
}

/**
 * A deployment tier — local, staging, beta, prod — sitting above collections:
 *
 *   Source → Collection → API definition
 *
 * A Source is NOT an Environment. An Environment is a run target (base URL,
 * credentials) chosen when a flow executes; a Source is a catalogue label
 * saying which tier a set of definitions describes. Nothing in a Source is
 * resolved at run time, which is why the same flow can run any tier's
 * collection against any environment.
 */
export interface YapiezSource {
  id: string;
  /** Stable machine name, kept across renames. */
  key: string;
  label: string;
  description: string | null;
  color: string | null;
  sort: number;
  isDefault: boolean;
  collectionCount?: number;
  apiCount?: number;
  createdAt: string;
  updatedAt: string;
}

/** Fallback tint for a tier with no colour set. */
export const DEFAULT_SOURCE_COLOR = "#64748b";

export interface YapiezCollection {
  id: string;
  name: string;
  /** The module this collection sits inside — its parent in the catalog tree. */
  moduleName: string | null;
  projectId: string | null;
  projectName?: string | null;
  sourceId: string | null;
  sourceLabel?: string | null;
  sourceColor?: string | null;
  description: string | null;
  color: string | null;
  apiCount?: number;
  /** APIs by HTTP method, e.g. { GET: 4, POST: 2 } — drives the card's mix bar. */
  methodCounts?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface YapiezApi {
  id: string;
  collectionId: string | null;
  collectionName?: string | null;
  /**
   * The project this definition belongs to. Null means shared — available from
   * every project rather than unassigned.
   */
  projectId: string | null;
  projectName?: string | null;
  /**
   * The QA module this endpoint belongs to, from QA Space → Settings → Modules.
   * Stored as the module's NAME, the same value bugs and test cases carry, so
   * renaming or re-creating a module never orphans a definition.
   */
  moduleName: string | null;
  /** The deployment tier the definition describes. */
  sourceId?: string | null;
  sourceLabel?: string | null;
  sourceColor?: string | null;
  name: string;
  description: string | null;
  method: HttpMethod;
  url: string;
  headers: KeyValueEntry[];
  queryParams: KeyValueEntry[];
  pathParams: KeyValueEntry[];
  bodyType: BodyType;
  requestBody: string | null;
  sampleData: Record<string, unknown>;
  authType: AuthType;
  authConfig: Record<string, any>;
  expectedStatus: number | null;
  expectedResponse: string | null;
  responseSchema: Record<string, unknown>;
  defaultAssertions: Assertion[];
  timeoutMs: number | null;
  tags: string[];
  ownerId: string | null;
  notes: string | null;
  isDeprecated: boolean;
  usedInFlows?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * The module filter value meaning "definitions filed under no module".
 *
 * A sentinel rather than a second control, so the one module dropdown can
 * offer it alongside the real names.
 */
export const UNFILED_MODULE = "__unfiled__";

/** What one module holds, for the catalog's module cards. */
export interface YapiezModuleSummary {
  /** Null is the unfiled bucket. */
  moduleName: string | null;
  apiCount: number;
  /** Collections inside this module — the level between it and the APIs. */
  collectionCount: number;
  /** APIs by HTTP method, e.g. { GET: 4, POST: 2 } — drives the card's mix. */
  methodCounts: Record<string, number>;
  updatedAt: string | null;
}

/** One thrown-away definition or collection, as the trash lists it. */
export interface YapiezTrashEntry {
  kind: "api" | "collection";
  id: string;
  name: string;
  /** An endpoint's method and URL; both null for a collection. */
  method: string | null;
  url: string | null;
  description: string | null;
  moduleName: string | null;
  collectionName: string | null;
  projectName: string | null;
  /** For a collection: how many live endpoints come back with it. */
  itemCount: number;
  deletedAt: string;
}

export interface EnvVariable {
  key: string;
  value: string;
  secret?: boolean;
}

export interface YapiezEnvironment {
  id: string;
  name: string;
  /** Null means shared across every project. */
  projectId: string | null;
  baseUrl: string;
  description: string | null;
  variables: EnvVariable[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlowStep {
  id: string;
  flowId: string;
  apiId: string;
  apiName?: string;
  method?: HttpMethod;
  url?: string;
  position: number;
  stepName: string | null;
  description: string | null;
  overrides: StepOverrides;
  extractions: Extraction[];
  assertions: Assertion[];
  continueOnFailure: boolean;
  isEnabled: boolean;
  delayMs: number;
}

export interface FlowAuthConfig {
  tokenPath?: string;
  variableName?: string;
  headerName?: string;
  scheme?: string;
  body?: string;
  disabled?: boolean;
}

export interface YapiezFlow {
  id: string;
  name: string;
  description: string | null;
  scopeId: string | null;
  scopeName?: string | null;
  projectId: string | null;
  environmentId: string | null;
  environmentName?: string | null;
  authApiId: string | null;
  authApiName?: string | null;
  authConfig: FlowAuthConfig;
  stopOnFailure: boolean;
  status: "Active" | "Draft" | "Archived";
  tags: string[];
  stepCount?: number;
  lastRunId: string | null;
  lastRunStatus: RunStatus | null;
  lastRunAt: string | null;
  steps?: FlowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface RunStep {
  id: string;
  runId: string;
  stepId: string | null;
  apiId: string | null;
  position: number;
  stepName: string;
  stepKind: "auth" | "api";
  method: string | null;
  resolvedUrl: string | null;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  statusCode: number | null;
  responseHeaders: Record<string, string>;
  responseBody: string | null;
  responseSize: number | null;
  durationMs: number | null;
  status: StepStatus;
  assertionResults: AssertionResult[];
  extracted: Record<string, unknown>;
  error: string | null;
  bugId: string | null;
  bugNumber?: string | null;
}

export interface FlowRun {
  id: string;
  flowId: string;
  flowName?: string | null;
  environmentId: string | null;
  environmentName?: string | null;
  scopeId: string | null;
  scopeName?: string | null;
  runNumber: number;
  runName: string | null;
  status: RunStatus;
  triggerSource: string;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  durationMs: number | null;
  variables: Record<string, unknown>;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  triggeredBy: string | null;
  steps?: RunStep[];
}

/** A real response this API produced during a past flow run. */
export interface CapturedResponse {
  runStepId: string;
  statusCode: number | null;
  body: string | null;
  durationMs: number | null;
  status: StepStatus;
  stepName: string;
  flowName: string | null;
  runNumber: number | null;
  capturedAt: string;
}

/** What "Send" returns from the definition editor. */
export interface TryApiResult {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string | null;
  };
  /** Null when the call never produced an HTTP response. */
  response: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    size: number;
    durationMs: number;
  } | null;
  error?: string;
  unresolvedVariables: string[];
  auth: {
    applied: boolean;
    via: "none" | "login" | "definition";
    error?: string;
  };
}

export interface YapiezStats {
  apis: number;
  collections: number;
  sources: number;
  flows: number;
  environments: number;
  runs: number;
  failed_runs: number;
}

// ─── Case payloads ──────────────────────────────────────────────────────────
//
// The request bodies QA keeps against a module test case, so a tester opening
// that case already has the body that should work and the ones that should not,
// rather than writing each one at the keyboard.

export const PAYLOAD_TYPES = ["Positive", "Negative", "Valid", "Invalid"] as const;
export type PayloadType = (typeof PAYLOAD_TYPES)[number];

/** What each type is for, shown under the picker so the choice is not a guess. */
export const PAYLOAD_TYPE_HELP: Record<PayloadType, string> = {
  Positive: "Happy path — every field populated with a realistic value. Should succeed.",
  Valid: "The minimum the API accepts — required fields only. Should succeed.",
  Negative: "Well-formed but breaks a business rule. Should be rejected with intent.",
  Invalid: "Malformed against the contract — wrong types, missing fields. Should fail validation.",
};

/**
 * Tone per type. Green and blue for the two that should succeed, two weights of
 * ash for the two that should not — light red stays reserved for destructive
 * actions, so a payload that is merely expected to fail never wears it.
 */
export const PAYLOAD_TYPE_TONE: Record<PayloadType, { text: string; bg: string; border: string }> = {
  Positive: { text: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
  Valid: { text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  Negative: { text: "#475569", bg: "#f8fafc", border: "#e2e8f0" },
  Invalid: { text: "#334155", bg: "#f1f5f9", border: "#cbd5e1" },
};

export interface CasePayload {
  id: string;
  /** Null once the definition it was drafted from has been retired. */
  apiId: string | null;
  /** Snapshot of the endpoint at the moment the payload was confirmed. */
  apiName: string | null;
  apiMethod: string | null;
  apiUrl: string | null;
  /** Null while the case it belongs to is still being drafted in the drawer. */
  testCaseId: string | null;
  parentTestCaseId: string | null;
  projectId: string | null;
  moduleName: string | null;
  payloadType: PayloadType;
  name: string;
  /** { body?, query?, pathParams? } — only the parts the method uses. */
  payload: Record<string, unknown>;
  expectedStatus: number | null;
  notes: string | null;
  /** ai | structure | manual — which generator produced it. */
  generatedBy: string;
  createdBy: string | null;
  createdByName?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** A draft, not yet stored. Nothing is written until the tester confirms it. */
export interface DraftedPayload {
  payload: Record<string, unknown>;
  expectedStatus: number | null;
  notes: string;
  generatedBy: string;
  apiId: string;
  apiName: string;
  apiMethod: string;
  apiUrl: string;
  payloadType: PayloadType;
  suggestedName: string;
}

export interface Paged<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Envelope<T> {
  success: boolean;
  data: T;
}

interface ListEnvelope<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Client ─────────────────────────────────────────────────────────────────

export class YapiezService {
  // Overview
  static async stats(): Promise<YapiezStats> {
    const res = await apiClient.get<Envelope<YapiezStats>>(`${BASE}/stats`);
    return res.data.data;
  }

  // Sources (the tier above collections)
  /**
   * Seeds local/staging/beta/prod on a tenant's first read.
   *
   * `projectId` narrows the collection and API counts to that project, which
   * is what the catalog sidebar shows beside each tier.
   */
  static async listSources(params: { projectId?: string } = {}): Promise<YapiezSource[]> {
    const res = await apiClient.get<Envelope<YapiezSource[]>>(`${BASE}/sources`, { params });
    return res.data.data;
  }

  static async createSource(input: Partial<YapiezSource>): Promise<YapiezSource> {
    const res = await apiClient.post<Envelope<YapiezSource>>(`${BASE}/sources`, input);
    return res.data.data;
  }

  static async updateSource(id: string, input: Partial<YapiezSource>): Promise<YapiezSource> {
    const res = await apiClient.put<Envelope<YapiezSource>>(`${BASE}/sources/${id}`, input);
    return res.data.data;
  }

  /** Collections under it survive as unfiled; the count says how many. */
  static async deleteSource(id: string): Promise<{ orphanedCollections: number }> {
    const res = await apiClient.delete<Envelope<{ orphanedCollections: number }>>(`${BASE}/sources/${id}`);
    return res.data.data;
  }

  // Collections
  static async listCollections(
    params: {
      sourceId?: string;
      projectId?: string;
      /** A module name, or UNFILED_MODULE for collections filed under none. */
      moduleName?: string;
      includeUnfiled?: boolean;
    } = {}
  ): Promise<YapiezCollection[]> {
    const res = await apiClient.get<Envelope<YapiezCollection[]>>(`${BASE}/collections`, { params });
    return res.data.data;
  }

  static async createCollection(input: Partial<YapiezCollection>): Promise<YapiezCollection> {
    const res = await apiClient.post<Envelope<YapiezCollection>>(`${BASE}/collections`, input);
    return res.data.data;
  }

  static async updateCollection(id: string, input: Partial<YapiezCollection>): Promise<YapiezCollection> {
    const res = await apiClient.put<Envelope<YapiezCollection>>(`${BASE}/collections/${id}`, input);
    return res.data.data;
  }

  static async deleteCollection(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/collections/${id}`);
  }

  // Trash
  //
  // Deleting a definition or a collection sets a timestamp rather than
  // removing the row, so everything here is recoverable until it is purged.

  static async listTrash(params: { projectId?: string | null } = {}): Promise<YapiezTrashEntry[]> {
    const res = await apiClient.get<Envelope<YapiezTrashEntry[]>>(`${BASE}/trash`, { params });
    return res.data.data;
  }

  static async restoreFromTrash(input: { kind: "api" | "collection"; id: string }): Promise<void> {
    await apiClient.post(`${BASE}/trash/restore`, input);
  }

  /** Irreversible. Refused for a definition something still references. */
  static async purgeFromTrash(params: { kind: "api" | "collection"; id: string }): Promise<void> {
    await apiClient.delete(`${BASE}/trash/item`, { params });
  }

  static async emptyTrash(params: { projectId?: string | null } = {}): Promise<{
    apis: number;
    collections: number;
  }> {
    const res = await apiClient.delete<Envelope<{ apis: number; collections: number }>>(`${BASE}/trash`, {
      params,
    });
    return res.data.data;
  }

  // Modules
  //
  // A module is a NAME on the collections and definitions filed under it, not
  // a row of its own — the curated list belongs to QA Settings, and renaming
  // there cascades into the catalog on the server. This only unfiles a name
  // the catalog still holds, which is the case settings knows nothing about.

  /** Clear the module from everything under it. Nothing is deleted. */
  static async unfileModule(params: {
    projectId?: string | null;
    name: string;
  }): Promise<{ apis: number; collections: number }> {
    const res = await apiClient.delete<Envelope<{ apis: number; collections: number }>>(
      `${BASE}/modules`,
      { params }
    );
    return res.data.data;
  }

  // API definitions
  static async listApis(params: {
    search?: string;
    collectionId?: string;
    sourceId?: string;
    /** A module name, or UNFILED_MODULE for the definitions filed under none. */
    moduleName?: string;
    /** Only definitions sitting directly under a module, in no collection. */
    unfiledOnly?: boolean;
    method?: string;
    /** inherit | none | bearer | basic | api_key */
    authType?: string;
    /** Show ONLY the deprecated ones — the opposite of includeDeprecated. */
    deprecatedOnly?: boolean;
    /** recent (default) | created | name | method */
    sort?: string;
    projectId?: string;
    /** Comma-separated ids the caller may see; shared definitions always show. */
    allowedProjects?: string;
    includeDeprecated?: boolean;
    page?: number;
    pageSize?: number;
  } = {}): Promise<Paged<YapiezApi>> {
    const res = await apiClient.get<ListEnvelope<YapiezApi>>(`${BASE}/apis`, { params });
    return {
      data: res.data.data,
      total: res.data.total,
      page: res.data.page,
      pageSize: res.data.pageSize,
      totalPages: res.data.totalPages,
    };
  }

  /**
   * What each module holds, for the catalog's module cards.
   *
   * Only covers modules that actually have definitions — merge it with the
   * curated list from QA Settings to show the empty ones too.
   */
  static async listModuleSummaries(
    params: {
      projectId?: string;
      sourceId?: string;
      allowedProjects?: string;
      includeDeprecated?: boolean;
    } = {}
  ): Promise<YapiezModuleSummary[]> {
    const res = await apiClient.get<Envelope<YapiezModuleSummary[]>>(`${BASE}/apis/module-summary`, {
      params,
    });
    return res.data.data;
  }

  static async getApi(id: string): Promise<YapiezApi> {
    const res = await apiClient.get<Envelope<YapiezApi>>(`${BASE}/apis/${id}`);
    return res.data.data;
  }

  static async createApi(input: Partial<YapiezApi>): Promise<YapiezApi> {
    const res = await apiClient.post<Envelope<YapiezApi>>(`${BASE}/apis`, input);
    return res.data.data;
  }

  static async updateApi(id: string, input: Partial<YapiezApi>): Promise<YapiezApi> {
    const res = await apiClient.put<Envelope<YapiezApi>>(`${BASE}/apis/${id}`, input);
    return res.data.data;
  }

  /**
   * Fix spelling and grammar in a description, changing nothing else.
   *
   * Endpoint paths, {{variables}}, header names and JSON keys are explicitly
   * protected in the prompt — a "correction" must never quietly break a
   * definition.
   */
  static async fixGrammar(text: string): Promise<{ text: string; changed: boolean }> {
    const res = await apiClient.post<Envelope<{ text: string; changed: boolean }>>(`${BASE}/ai/grammar`, { text });
    return res.data.data;
  }

  /**
   * Real responses this API has already produced inside a flow.
   *
   * The non-destructive way to fill in an expected result: the request already
   * happened, so reading it back creates nothing. Only available for a saved
   * definition — a brand-new draft has no history.
   */
  static async capturedResponses(apiId: string): Promise<CapturedResponse[]> {
    const res = await apiClient.get<Envelope<CapturedResponse[]>>(`${BASE}/apis/${apiId}/captured-responses`);
    return res.data.data;
  }

  /**
   * Send a draft definition once and return the real response.
   *
   * Works on an UNSAVED draft — the author is mid-definition. Nothing is
   * persisted: no run row, no catalog entry. A 4xx/5xx from the target API is a
   * successful call and arrives as data; only a transport failure sets `error`.
   */
  static async tryApi(input: {
    definition: Partial<YapiezApi> & { url: string };
    environmentId?: string | null;
    /** Resolve a relative URL against this; wins over any environment. */
    baseUrl?: string | null;
    variables?: Record<string, string>;
    authApiId?: string | null;
    authConfig?: FlowAuthConfig;
  }): Promise<TryApiResult> {
    const res = await apiClient.post<Envelope<TryApiResult>>(`${BASE}/apis/try`, input, {
      // A slow endpoint under test should not look like an API Hub failure.
      timeout: 2 * 60 * 1000,
    });
    return res.data.data;
  }

  static async deleteApi(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/apis/${id}`);
  }

  // Environments
  /** Returns the project's environments plus the shared (project-less) ones. */
  static async listEnvironments(params: { projectId?: string } = {}): Promise<YapiezEnvironment[]> {
    const res = await apiClient.get<Envelope<YapiezEnvironment[]>>(`${BASE}/environments`, { params });
    return res.data.data;
  }

  static async createEnvironment(input: Partial<YapiezEnvironment>): Promise<YapiezEnvironment> {
    const res = await apiClient.post<Envelope<YapiezEnvironment>>(`${BASE}/environments`, input);
    return res.data.data;
  }

  static async updateEnvironment(id: string, input: Partial<YapiezEnvironment>): Promise<YapiezEnvironment> {
    const res = await apiClient.put<Envelope<YapiezEnvironment>>(`${BASE}/environments/${id}`, input);
    return res.data.data;
  }

  static async deleteEnvironment(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/environments/${id}`);
  }

  // Flows
  static async listFlows(params: {
    search?: string;
    scopeId?: string;
    projectId?: string;
    status?: string;
    environmentId?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<Paged<YapiezFlow>> {
    const res = await apiClient.get<ListEnvelope<YapiezFlow>>(`${BASE}/flows`, { params });
    return {
      data: res.data.data,
      total: res.data.total,
      page: res.data.page,
      pageSize: res.data.pageSize,
      totalPages: res.data.totalPages,
    };
  }

  static async getFlow(id: string): Promise<YapiezFlow> {
    const res = await apiClient.get<Envelope<YapiezFlow>>(`${BASE}/flows/${id}`);
    return res.data.data;
  }

  static async createFlow(input: Partial<YapiezFlow>): Promise<YapiezFlow> {
    const res = await apiClient.post<Envelope<YapiezFlow>>(`${BASE}/flows`, input);
    return res.data.data;
  }

  static async updateFlow(id: string, input: Partial<YapiezFlow>): Promise<YapiezFlow> {
    const res = await apiClient.put<Envelope<YapiezFlow>>(`${BASE}/flows/${id}`, input);
    return res.data.data;
  }

  static async deleteFlow(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/flows/${id}`);
  }

  static async duplicateFlow(id: string, name: string): Promise<YapiezFlow> {
    const res = await apiClient.post<Envelope<YapiezFlow>>(`${BASE}/flows/${id}/duplicate`, { name });
    return res.data.data;
  }

  // Steps
  static async addStep(flowId: string, input: Partial<FlowStep> & { apiId: string }): Promise<FlowStep> {
    const res = await apiClient.post<Envelope<FlowStep>>(`${BASE}/flows/${flowId}/steps`, input);
    return res.data.data;
  }

  static async updateStep(flowId: string, stepId: string, input: Partial<FlowStep>): Promise<FlowStep> {
    const res = await apiClient.put<Envelope<FlowStep>>(`${BASE}/flows/${flowId}/steps/${stepId}`, input);
    return res.data.data;
  }

  static async deleteStep(flowId: string, stepId: string): Promise<void> {
    await apiClient.delete(`${BASE}/flows/${flowId}/steps/${stepId}`);
  }

  static async reorderSteps(flowId: string, stepIds: string[]): Promise<FlowStep[]> {
    const res = await apiClient.put<Envelope<FlowStep[]>>(`${BASE}/flows/${flowId}/steps/reorder`, { stepIds });
    return res.data.data;
  }

  /** What this step would send, without sending it. */
  static async previewStep(
    flowId: string,
    stepId: string,
    environmentId?: string
  ): Promise<{
    method: string;
    url: string;
    headers: Record<string, string>;
    query: Record<string, string>;
    body: string | null;
    bodyType: BodyType;
    unresolvedVariables: string[];
    environment: { id: string; name: string } | null;
  }> {
    const res = await apiClient.get<Envelope<any>>(`${BASE}/flows/${flowId}/steps/${stepId}/preview`, {
      params: environmentId ? { environmentId } : {},
    });
    return res.data.data;
  }

  // Execution
  /**
   * Runs the flow and resolves with the finished run.
   *
   * This waits for every step, so give the request a generous timeout — a flow
   * of ten calls against a slow environment legitimately takes a while.
   */
  static async runFlow(
    flowId: string,
    input: { environmentId?: string | null; variables?: Record<string, string>; runName?: string; onlyStepIds?: string[] } = {}
  ): Promise<FlowRun> {
    const res = await apiClient.post<Envelope<FlowRun>>(`${BASE}/flows/${flowId}/run`, input, {
      timeout: 5 * 60 * 1000,
    });
    return res.data.data;
  }

  static async listRuns(params: {
    flowId?: string;
    scopeId?: string;
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<Paged<FlowRun>> {
    const res = await apiClient.get<ListEnvelope<FlowRun>>(`${BASE}/runs`, { params });
    return {
      data: res.data.data,
      total: res.data.total,
      page: res.data.page,
      pageSize: res.data.pageSize,
      totalPages: res.data.totalPages,
    };
  }

  static async getRun(id: string): Promise<FlowRun> {
    const res = await apiClient.get<Envelope<FlowRun>>(`${BASE}/runs/${id}`);
    return res.data.data;
  }

  static async deleteRun(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/runs/${id}`);
  }

  // QA Space integration
  /** Every flow attached to a Test Scope, with its latest result. */
  static async scopeSummary(scopeId: string): Promise<{
    scopeId: string;
    flows: number;
    totalSteps: number;
    passedSteps: number;
    failedSteps: number;
    skippedSteps: number;
    failingFlows: number;
    runs: FlowRun[];
  }> {
    const res = await apiClient.get<Envelope<any>>(`${BASE}/scopes/${scopeId}/summary`);
    return res.data.data;
  }

  static async bugTargets(projectId?: string): Promise<Array<{ id: string; name: string; sheets: Array<{ id: string; name: string }> }>> {
    const res = await apiClient.get<Envelope<any[]>>(`${BASE}/runs/bug-targets`, {
      params: projectId ? { projectId } : {},
    });
    return res.data.data;
  }

  /** The prefilled bug a failed step would produce. */
  static async bugDraft(stepId: string): Promise<{
    title: string;
    description: string;
    module: string | null;
    bugType: string;
    severity: string;
    alreadyLinked: { id: string; bugNumber?: string | null } | null;
  }> {
    const res = await apiClient.get<Envelope<any>>(`${BASE}/run-steps/${stepId}/bug-draft`);
    return res.data.data;
  }

  static async raiseBug(
    stepId: string,
    input: {
      folderId: string;
      sheetId: string;
      title?: string;
      description: string;
      severity?: string;
      bugType?: string;
      module?: string;
      assigneeId?: string | null;
    }
  ): Promise<{ id: string; bugNumber: string }> {
    const res = await apiClient.post<Envelope<{ id: string; bugNumber: string }>>(
      `${BASE}/run-steps/${stepId}/bug`,
      input
    );
    return res.data.data;
  }

  static async linkExistingBug(stepId: string, bugId: string): Promise<void> {
    await apiClient.post(`${BASE}/run-steps/${stepId}/link-bug`, { bugId });
  }

  // Case payloads
  //
  // Drafting and storing are two calls on purpose: the tester regenerates until
  // the body looks right, and nothing is written until they confirm it.

  /** Draft a payload from an API definition. Writes nothing. */
  static async generatePayload(input: {
    apiId: string;
    payloadType: PayloadType;
    /** Optional steer, e.g. "an order with no line items". */
    hint?: string;
  }): Promise<DraftedPayload> {
    const res = await apiClient.post<Envelope<DraftedPayload>>(`${BASE}/payloads/generate`, input);
    return res.data.data;
  }

  static async listPayloads(
    params: {
      testCaseId?: string;
      parentTestCaseId?: string;
      apiId?: string;
      moduleName?: string;
      projectId?: string;
      payloadType?: PayloadType;
      /** Only drafts no case has adopted yet. */
      unlinkedOnly?: boolean;
    } = {}
  ): Promise<CasePayload[]> {
    const res = await apiClient.get<Envelope<CasePayload[]>>(`${BASE}/payloads`, { params });
    return res.data.data;
  }

  /** Payloads for many cases at once, keyed by case id — one call for a list. */
  static async payloadsForCases(caseIds: string[]): Promise<Record<string, CasePayload[]>> {
    if (!caseIds.length) return {};
    const res = await apiClient.get<Envelope<Record<string, CasePayload[]>>>(
      `${BASE}/payloads/for-cases`,
      { params: { caseIds: caseIds.join(",") } }
    );
    return res.data.data;
  }

  /** Store a confirmed payload. Omit testCaseId while the case is still a draft. */
  static async createPayload(input: {
    apiId: string;
    payloadType: PayloadType;
    name: string;
    payload: Record<string, unknown>;
    expectedStatus?: number | null;
    notes?: string | null;
    generatedBy?: string;
    testCaseId?: string | null;
    parentTestCaseId?: string | null;
  }): Promise<CasePayload> {
    const res = await apiClient.post<Envelope<CasePayload>>(`${BASE}/payloads`, input);
    return res.data.data;
  }

  static async updatePayload(
    id: string,
    input: {
      payloadType?: PayloadType;
      name?: string;
      payload?: Record<string, unknown>;
      expectedStatus?: number | null;
      notes?: string | null;
    }
  ): Promise<CasePayload> {
    const res = await apiClient.put<Envelope<CasePayload>>(`${BASE}/payloads/${id}`, input);
    return res.data.data;
  }

  /** Adopt the drafts confirmed before the case existed, once it is saved. */
  static async linkPayloads(testCaseId: string, payloadIds: string[]): Promise<{ linked: number }> {
    const res = await apiClient.post<Envelope<{ linked: number }>>(`${BASE}/payloads/link`, {
      testCaseId,
      payloadIds,
    });
    return res.data.data;
  }

  static async deletePayload(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/payloads/${id}`);
  }
}

// ─── Presentation helpers ───────────────────────────────────────────────────

export function runStatusColor(status: RunStatus | StepStatus | null | undefined): {
  text: string;
  bg: string;
  border: string;
} {
  switch (status) {
    case "Passed":
    case "Pass":
      return { text: "#047857", bg: "#ecfdf5", border: "#a7f3d0" };
    case "Failed":
    case "Fail":
      return { text: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
    case "Running":
      return { text: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" };
    default:
      return { text: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" };
  }
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)} s`;
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.round((ms % 60_000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/** Pretty-print a JSON body for display, leaving non-JSON text alone. */
export function prettyJson(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

/** Every {{variable}} referenced by an API definition — what a flow must supply. */
export function variablesUsedBy(api: Pick<YapiezApi, "url" | "headers" | "queryParams" | "pathParams" | "requestBody">): string[] {
  const found = new Set<string>();
  const scan = (text?: string | null) => {
    for (const match of (text ?? "").matchAll(/\{\{\s*([^{}\s]+)\s*\}\}/g)) found.add(match[1]);
  };
  scan(api.url);
  scan(api.requestBody);
  for (const entry of [...(api.headers ?? []), ...(api.queryParams ?? []), ...(api.pathParams ?? [])]) {
    scan(entry.key);
    scan(entry.value);
  }
  return Array.from(found);
}
