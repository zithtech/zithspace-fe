/**
 * Authoring helpers for the Yapiez API definition editor.
 *
 * Pure functions, no React — the drawer stays about layout and these carry the
 * thinking: parsing a pasted cURL, reading placeholders out of a URL, and
 * inferring a schema and a starting set of assertions from a sample response.
 */

import {
  Assertion,
  BodyType,
  HttpMethod,
  HTTP_METHODS,
  KeyValueEntry,
} from "./yapiezService";

// ─── cURL import ────────────────────────────────────────────────────────────

export interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: KeyValueEntry[];
  queryParams: KeyValueEntry[];
  body: string;
  bodyType: BodyType;
  /** Credentials found in the command, so the caller can offer to keep them. */
  basicAuth?: { username: string; password: string };
  /** Anything recognised but deliberately not imported. */
  warnings: string[];
}

/**
 * Split a shell command into argv, honouring single quotes, double quotes,
 * backslash escapes and `\`-newline continuations.
 *
 * Written by hand rather than with a regex because a JSON payload pasted inside
 * single quotes routinely contains spaces, double quotes and braces — the naive
 * `split(/\s+/)` that most snippets use mangles exactly the case that matters.
 */
export function tokenizeShell(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let started = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (quote) {
      if (char === "\\" && quote === '"' && i + 1 < input.length) {
        // Inside double quotes a backslash escapes the next character.
        current += input[++i];
        continue;
      }
      if (char === quote) {
        quote = null;
        continue;
      }
      current += char;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      started = true;
      continue;
    }

    // Windows "Copy as cURL (cmd)" continues lines with ^ rather than \.
    // Only at end-of-line — a caret anywhere else is an ordinary character
    // that appears in regexes and query values.
    if (char === "^" && (input[i + 1] === "\n" || input[i + 1] === "\r")) {
      const next = input[i + 1];
      i += next === "\r" && input[i + 2] === "\n" ? 2 : 1;
      continue;
    }

    if (char === "\\") {
      const next = input[i + 1];
      // A backslash before a newline is a line continuation, not an escape.
      if (next === "\n" || next === "\r") {
        i += next === "\r" && input[i + 2] === "\n" ? 2 : 1;
        continue;
      }
      if (next !== undefined) {
        current += next;
        i++;
        started = true;
        continue;
      }
    }

    if (/\s/.test(char)) {
      if (started || current) {
        tokens.push(current);
        current = "";
        started = false;
      }
      continue;
    }

    current += char;
    started = true;
  }

  if (started || current) tokens.push(current);
  return tokens;
}

/** `Name: value` → an enabled header row. */
function parseHeader(raw: string): KeyValueEntry | null {
  const index = raw.indexOf(":");
  if (index < 0) return null;
  const key = raw.slice(0, index).trim();
  if (!key) return null;
  return { key, value: raw.slice(index + 1).trim(), enabled: true };
}

const BODY_FLAGS = new Set([
  "-d",
  "--data",
  "--data-raw",
  "--data-binary",
  "--data-ascii",
  "--data-urlencode",
]);

/** Flags that take a value we do not import, so their argument is skipped too. */
const SKIPPED_VALUE_FLAGS = new Set([
  "--cacert",
  "--cert",
  "--key",
  "--proxy",
  "-x",
  "--connect-timeout",
  "--max-time",
  "-m",
  "-o",
  "--output",
  "-w",
  "--write-out",
  "-A",
  "--user-agent",
  "-e",
  "--referer",
  "--cookie-jar",
  "-c",
  "--retry",
  "--resolve",
  "--form-string",
]);

/**
 * Parse a cURL command into an API definition.
 *
 * Handles the shapes people actually paste: Chrome's "Copy as cURL", Postman's
 * export, and hand-written commands. Unknown flags are reported rather than
 * silently dropped, so nothing looks imported that was not.
 */
export function parseCurl(input: string): ParsedCurl | null {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return null;

  const tokens = tokenizeShell(trimmed);
  if (!tokens.length) return null;
  if (!/^curl$/i.test(tokens[0]) && !/curl(\.exe)?$/i.test(tokens[0])) {
    // Tolerate a leading `$ ` or a shell prompt, but insist the command is curl.
    const curlIndex = tokens.findIndex((t) => /^curl(\.exe)?$/i.test(t));
    if (curlIndex < 0) return null;
    tokens.splice(0, curlIndex);
  }

  const result: ParsedCurl = {
    method: "GET",
    url: "",
    headers: [],
    queryParams: [],
    body: "",
    bodyType: "none",
    warnings: [],
  };

  let explicitMethod: HttpMethod | null = null;
  let sawForm = false;
  const bodyParts: string[] = [];

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    if (token === "-X" || token === "--request") {
      const value = (tokens[++i] ?? "").toUpperCase();
      if ((HTTP_METHODS as readonly string[]).includes(value)) explicitMethod = value as HttpMethod;
      else result.warnings.push(`Method "${value}" is not one Yapiez executes — left as GET.`);
      continue;
    }

    if (token === "-H" || token === "--header") {
      const header = parseHeader(tokens[++i] ?? "");
      if (header) result.headers.push(header);
      continue;
    }

    if (BODY_FLAGS.has(token)) {
      bodyParts.push(tokens[++i] ?? "");
      continue;
    }

    if (token === "-F" || token === "--form") {
      sawForm = true;
      bodyParts.push(tokens[++i] ?? "");
      continue;
    }

    if (token === "-u" || token === "--user") {
      const value = tokens[++i] ?? "";
      const split = value.indexOf(":");
      result.basicAuth = {
        username: split < 0 ? value : value.slice(0, split),
        password: split < 0 ? "" : value.slice(split + 1),
      };
      continue;
    }

    if (token === "-b" || token === "--cookie") {
      result.headers.push({ key: "Cookie", value: tokens[++i] ?? "", enabled: true });
      continue;
    }

    if (SKIPPED_VALUE_FLAGS.has(token)) {
      result.warnings.push(`Ignored ${token} — Yapiez does not carry that setting.`);
      i++;
      continue;
    }

    // Valueless flags that change nothing we model.
    if (/^-[a-zA-Z]$/.test(token) || token.startsWith("--")) {
      if (!["-s", "--silent", "-L", "--location", "-k", "--insecure", "-i", "--include", "-v", "--verbose", "-g", "--globoff", "--compressed"].includes(token)) {
        result.warnings.push(`Ignored ${token}.`);
      }
      continue;
    }

    // A bare token is the URL. The first one wins.
    if (!result.url) result.url = token;
  }

  if (!result.url) return null;

  // Query string moves into the params table, so it is editable per step.
  //
  // The URL is only rewritten when there was actually a query to remove. Round
  // -tripping through URL.toString() normalises as it goes — `http://x` comes
  // back as `http://x/` — and silently editing what the author pasted is worse
  // than leaving a query-less URL exactly as typed.
  const questionMarkAt = result.url.indexOf("?");
  try {
    if (questionMarkAt < 0) throw new Error("no query");
    const parsed = new URL(result.url);
    for (const [key, value] of parsed.searchParams.entries()) {
      result.queryParams.push({ key, value, enabled: true });
    }
    parsed.search = "";
    result.url = parsed.toString().replace(/\?$/, "");
  } catch {
    // A relative URL (or one containing {{baseUrl}}) does not parse — split by
    // hand. Also the path taken when there is no query string at all, where the
    // loop below simply does nothing and the URL is left untouched.
    const questionMark = result.url.indexOf("?");
    if (questionMark >= 0) {
      const query = result.url.slice(questionMark + 1);
      result.url = result.url.slice(0, questionMark);
      for (const pair of query.split("&")) {
        if (!pair) continue;
        const equals = pair.indexOf("=");
        const key = equals < 0 ? pair : pair.slice(0, equals);
        const value = equals < 0 ? "" : pair.slice(equals + 1);
        try {
          result.queryParams.push({ key: decodeURIComponent(key), value: decodeURIComponent(value), enabled: true });
        } catch {
          result.queryParams.push({ key, value, enabled: true });
        }
      }
    }
  }

  const body = bodyParts.join(sawForm ? "\n" : "&");
  if (body) {
    result.body = body;
    const contentType =
      result.headers.find((h) => h.key.toLowerCase() === "content-type")?.value ?? "";
    if (sawForm || /x-www-form-urlencoded/i.test(contentType)) {
      result.bodyType = "form";
      // Yapiez's form editor is one `key=value` per line.
      if (!sawForm) result.body = body.split("&").join("\n");
    } else if (/json/i.test(contentType) || looksLikeJson(body)) {
      result.bodyType = "json";
    } else {
      result.bodyType = "text";
    }
  }

  // curl implies POST when a body is present and no method was given.
  result.method = explicitMethod ?? (body ? "POST" : "GET");
  return result;
}

function looksLikeJson(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

// ─── URL placeholders ───────────────────────────────────────────────────────

/**
 * Path placeholder names in a URL: `:userId`, `{userId}`.
 *
 * `{{userId}}` is deliberately excluded — that is a run variable resolved from
 * the environment or an earlier step, not something the definition must declare.
 */
export function pathPlaceholders(url: string): string[] {
  const found = new Set<string>();
  const withoutVariables = (url ?? "").replace(/\{\{[^}]*\}\}/g, "");

  for (const match of withoutVariables.matchAll(/:([A-Za-z_][A-Za-z0-9_]*)/g)) {
    // Skip the scheme separator in `https://…`.
    if (match.index !== undefined && withoutVariables.slice(match.index, match.index + 3) === "://") continue;
    found.add(match[1]);
  }
  for (const match of withoutVariables.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)) {
    found.add(match[1]);
  }
  return Array.from(found);
}

/** Placeholders in the URL that have no row in the path params table yet. */
export function missingPathParams(url: string, existing: KeyValueEntry[]): string[] {
  const declared = new Set((existing ?? []).map((entry) => entry.key));
  return pathPlaceholders(url).filter((name) => !declared.has(name));
}

// ─── Sample response inference ──────────────────────────────────────────────

type JsonKind = "string" | "number" | "boolean" | "object" | "array" | "null";

function kindOf(value: unknown): JsonKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value as JsonKind;
}

/**
 * A readable shape for a sample response — not full JSON Schema, just enough
 * for a developer to see what the endpoint returns at a glance.
 *
 * Nesting stops at depth 4 and arrays are described by their first element, so
 * a large sample cannot produce an unreadable schema.
 */
export function inferSchema(value: unknown, depth = 0): Record<string, any> {
  const kind = kindOf(value);

  if (depth >= 4) return { type: kind };

  if (kind === "array") {
    const array = value as unknown[];
    return {
      type: "array",
      items: array.length ? inferSchema(array[0], depth + 1) : {},
      sampleLength: array.length,
    };
  }

  if (kind === "object") {
    const properties: Record<string, any> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      properties[key] = inferSchema(child, depth + 1);
    }
    return { type: "object", properties };
  }

  return { type: kind };
}

const OPERATOR_FOR_KIND: Record<JsonKind, Assertion["operator"]> = {
  string: "isString",
  number: "isNumber",
  boolean: "isBoolean",
  array: "isArray",
  object: "exists",
  null: "exists",
};

/**
 * A starting set of assertions from a sample response.
 *
 * Deliberately conservative: it asserts the *shape* (this field exists and is a
 * number), never the sample's literal values. Asserting `id equals 101` from a
 * sample would fail on every real run, which is worse than no assertion at all.
 * QA tightens these afterwards.
 */
export function assertionsFromSample(
  sample: string,
  expectedStatus?: number | null
): { assertions: Assertion[]; error?: string } {
  const assertions: Assertion[] = [];

  if (expectedStatus) {
    assertions.push({
      source: "status",
      operator: "equals",
      expected: String(expectedStatus),
      name: `Status is ${expectedStatus}`,
    });
  }

  const trimmed = (sample ?? "").trim();
  if (!trimmed) {
    return assertions.length ? { assertions } : { assertions: [], error: "Paste a sample response first." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { assertions, error: "The sample response is not valid JSON, so no field assertions could be inferred." };
  }

  const MAX_FIELDS = 10;
  const root = Array.isArray(parsed) ? (parsed[0] as unknown) : parsed;
  const prefix = Array.isArray(parsed) ? "0." : "";

  if (Array.isArray(parsed)) {
    assertions.push({ source: "body", path: "", operator: "isArray", name: "Response is an array" });
  }

  if (root && typeof root === "object" && !Array.isArray(root)) {
    for (const [key, child] of Object.entries(root as Record<string, unknown>).slice(0, MAX_FIELDS)) {
      assertions.push({
        source: "body",
        path: `${prefix}${key}`,
        operator: OPERATOR_FOR_KIND[kindOf(child)],
        name: `${prefix}${key} is present`,
      });
    }
  }

  return { assertions };
}

// ─── Bulk key/value paste ───────────────────────────────────────────────────

/**
 * Parse pasted lines into key/value rows. Accepts `Name: value` (header style)
 * and `name=value` (query style), skipping blanks and `#` comments — so a block
 * copied straight out of documentation or a .env file lands intact.
 */
export function parseKeyValueBlock(text: string): KeyValueEntry[] {
  const rows: KeyValueEntry[] = [];

  for (const rawLine of (text ?? "").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) continue;

    const colon = line.indexOf(":");
    const equals = line.indexOf("=");
    // Whichever separator comes first wins, so `Authorization: Bearer a=b` and
    // `redirect=https://x/?a:b` both split where the author meant.
    const index =
      colon >= 0 && (equals < 0 || colon < equals) ? colon : equals;
    if (index < 0) {
      rows.push({ key: line, value: "", enabled: true });
      continue;
    }

    const key = line.slice(0, index).trim();
    if (!key) continue;
    rows.push({ key, value: line.slice(index + 1).trim(), enabled: true });
  }

  return rows;
}

/** Merge new rows over existing ones, matching keys case-insensitively. */
export function mergeKeyValues(existing: KeyValueEntry[], incoming: KeyValueEntry[]): KeyValueEntry[] {
  const out = [...(existing ?? [])];
  for (const row of incoming) {
    const index = out.findIndex((e) => e.key.toLowerCase() === row.key.toLowerCase());
    if (index >= 0) out[index] = { ...out[index], ...row };
    else out.push(row);
  }
  return out;
}

// ─── JSON helpers ───────────────────────────────────────────────────────────

export interface JsonState {
  valid: boolean;
  message?: string;
}

/** Validate a JSON string, reporting the parser's own message on failure. */
export function checkJson(value: string | null | undefined): JsonState {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { valid: true };
  try {
    JSON.parse(trimmed);
    return { valid: true };
  } catch (error: any) {
    return { valid: false, message: error?.message ?? "Invalid JSON" };
  }
}

/**
 * Pretty-print a JSON string.
 *
 * {{variables}} are quoted placeholders in a payload, so they survive the round
 * trip unchanged — formatting must never break a template.
 */
export function formatJson(value: string): { text: string; error?: string } {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { text: value };
  try {
    return { text: JSON.stringify(JSON.parse(trimmed), null, 2) };
  } catch (error: any) {
    return { text: value, error: error?.message ?? "Invalid JSON" };
  }
}

// ─── Pasted response import ─────────────────────────────────────────────────

export interface ParsedResponse {
  status: number | null;
  body: string;
  headers: KeyValueEntry[];
  /** Byte size of the body. Always derivable — it is just the payload measured. */
  byteSize: number;
  /**
   * Round-trip time, when the paste actually contains one. Usually it does
   * not: a response body carries no timing, so this is null unless a timing
   * header or a summary line was pasted along with it.
   */
  durationMs: number | null;
  /** Where the duration came from, so the UI can say rather than imply. */
  timeSource: string | null;
}

/**
 * Byte length of a string in the browser.
 *
 * `String.length` counts UTF-16 code units, so "José" would measure 4 when it
 * is 5 bytes and an emoji would measure 2 when it is 4. Anything non-ASCII
 * would under-report.
 */
export function byteLengthOf(text: string): number {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text ?? "").length;
  // Node without TextEncoder in scope (tests) — same answer.
  return Buffer.byteLength(text ?? "", "utf8");
}

/**
 * Pull a round-trip time out of whatever was pasted.
 *
 * A response body has no timing in it, so this only finds something when the
 * paste includes one of the places a server or a tool actually puts it:
 *
 *   Server-Timing: total;dur=84.2      the standard header
 *   X-Response-Time: 84ms              widely used by Node/Express middleware
 *   X-Runtime: 0.084                   Rails, in SECONDS
 *   200 OK  84 ms  1.2 KB              a summary line copied from a REST client
 *
 * Returns null rather than guessing when none of them is present — an invented
 * duration would end up in a response-time assertion and fail every run.
 */
export function extractDuration(
  headers: KeyValueEntry[],
  firstLine: string
): { durationMs: number | null; source: string | null } {
  const find = (name: string) =>
    headers.find((h) => h.key.toLowerCase() === name)?.value?.trim();

  const serverTiming = find("server-timing");
  if (serverTiming) {
    // Sum every dur= in the header: "app;dur=42, db;dur=30" is 72ms of work.
    const durations = [...serverTiming.matchAll(/dur=([\d.]+)/gi)].map((m) => Number(m[1]));
    const total = durations.filter((n) => Number.isFinite(n)).reduce((sum, n) => sum + n, 0);
    if (total > 0) return { durationMs: Math.round(total), source: "Server-Timing header" };
  }

  const responseTime = find("x-response-time");
  if (responseTime) {
    const match = responseTime.match(/([\d.]+)\s*(ms|s)?/i);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) {
        const ms = match[2]?.toLowerCase() === "s" ? value * 1000 : value;
        return { durationMs: Math.round(ms), source: "X-Response-Time header" };
      }
    }
  }

  const runtime = find("x-runtime");
  if (runtime) {
    const value = Number(runtime);
    // Rails reports seconds, so a bare number here is seconds not milliseconds.
    if (Number.isFinite(value)) return { durationMs: Math.round(value * 1000), source: "X-Runtime header" };
  }

  // A summary line copied out of a REST client, e.g. "200 OK  84 ms  1.2 KB".
  const summary = firstLine.match(/(\d+(?:\.\d+)?)\s*ms\b/i);
  if (summary) {
    const value = Number(summary[1]);
    if (Number.isFinite(value)) return { durationMs: Math.round(value), source: "pasted summary line" };
  }

  return { durationMs: null, source: null };
}

/**
 * A response-time assertion with headroom, from an observed duration.
 *
 * Asserting the observed time itself would fail on the very next run, so the
 * budget is a generous multiple rounded to something a human would have typed.
 * It is a starting point to tighten, not a measurement.
 */
export function responseTimeAssertion(durationMs: number): Assertion {
  const budget = Math.max(200, durationMs * 3);
  const rounded =
    budget <= 1000 ? Math.ceil(budget / 100) * 100 : Math.ceil(budget / 500) * 500;
  return {
    source: "responseTime",
    operator: "lessThan",
    expected: String(rounded),
    name: `Responds in under ${rounded} ms`,
  };
}

/**
 * Parse a pasted response into a status and a body.
 *
 * The fallback for when the API under test is not reachable from the server —
 * someone has the answer in front of them in Postman or a terminal and just
 * wants it in the definition. Three shapes are accepted:
 *
 *   1. A raw HTTP response  — `HTTP/1.1 201 Created`, headers, blank line, body
 *   2. A bare status line   — `201 Created` followed by the body
 *   3. Just the body        — the common case, status left for the author
 *
 * Anything unrecognised is treated as a body rather than rejected: refusing a
 * paste because it did not match a shape would be worse than importing it as
 * the payload, which is what it almost always is.
 */
export function parseResponsePaste(input: string): ParsedResponse {
  const text = (input ?? "").replace(/\r\n/g, "\n");
  const trimmed = text.trim();

  if (!trimmed) {
    return { status: null, body: "", headers: [], byteSize: 0, durationMs: null, timeSource: null };
  }

  // A body that starts with JSON is a body, whatever else it might resemble.
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return {
      status: null,
      body: trimmed,
      headers: [],
      byteSize: byteLengthOf(trimmed),
      durationMs: null,
      timeSource: null,
    };
  }

  const lines = text.split("\n");
  const first = lines[0].trim();

  const httpLine = first.match(/^HTTP\/[\d.]+\s+(\d{3})\b/i);
  const bareStatus = first.match(/^(\d{3})(\s|$)/);
  const status = httpLine ? Number(httpLine[1]) : bareStatus ? Number(bareStatus[1]) : null;

  if (status === null) {
    return {
      status: null,
      body: trimmed,
      headers: [],
      byteSize: byteLengthOf(trimmed),
      durationMs: null,
      timeSource: null,
    };
  }

  // Headers run until the first blank line; everything after it is the body.
  const headers: KeyValueEntry[] = [];
  let index = 1;
  for (; index < lines.length; index++) {
    const line = lines[index];
    if (!line.trim()) {
      index++;
      break;
    }
    const colon = line.indexOf(":");
    if (colon <= 0) break;
    headers.push({ key: line.slice(0, colon).trim(), value: line.slice(colon + 1).trim(), enabled: true });
  }

  const body = lines.slice(index).join("\n").trim();
  const timing = extractDuration(headers, first);

  return {
    status,
    body,
    headers,
    byteSize: byteLengthOf(body),
    durationMs: timing.durationMs,
    timeSource: timing.source,
  };
}

// ─── Offline sample generation ──────────────────────────────────────────────

/**
 * Derive a plausible response from the request itself — no network, no side
 * effects, nothing created.
 *
 * This is the route for a write endpoint you do NOT want to fire. A create
 * usually echoes back what it was given plus a server-assigned id, so the
 * payload is a reasonable starting shape.
 *
 * It is a GUESS, and the caller must say so. The value is that you end up
 * editing a structure instead of typing one from a blank box; every field is
 * expected to be corrected against the real contract.
 */
export function sampleFromRequest(input: {
  method: string;
  requestBody?: string | null;
  bodyType?: BodyType;
  expectedStatus?: number | null;
}): { status: number; body: string; note: string } {
  const method = (input.method || "GET").toUpperCase();

  // A delete typically answers with no content worth asserting on.
  if (method === "DELETE") {
    return {
      status: input.expectedStatus ?? 204,
      body: "",
      note: "A delete usually returns no body. Set a status assertion and leave the sample empty, or paste the real response if yours returns one.",
    };
  }

  let payload: Record<string, unknown> | null = null;
  if (input.bodyType === "json" && input.requestBody?.trim()) {
    try {
      const parsed = JSON.parse(input.requestBody);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        payload = parsed as Record<string, unknown>;
      }
    } catch {
      // Not parseable — fall through to the bare shape below.
    }
  }

  if (method === "POST" || method === "PUT" || method === "PATCH") {
    // Echo the payload back with a server-assigned id, which is what the
    // overwhelming majority of REST creates and updates do.
    const body: Record<string, unknown> = { id: 1 };
    for (const [key, value] of Object.entries(payload ?? {})) {
      // A template placeholder is not a value — show the type it stands for.
      body[key] = typeof value === "string" && /\{\{.*\}\}/.test(value) ? "string" : value;
    }
    if (!payload) body.name = "string";

    return {
      status: input.expectedStatus ?? (method === "POST" ? 201 : 200),
      body: JSON.stringify(body, null, 2),
      note: payload
        ? "Built from your request payload plus a server-assigned id. Correct anything the real endpoint returns differently."
        : "There is no JSON payload to derive from, so this is a bare placeholder. Replace it with the real shape.",
    };
  }

  // A read has nothing to echo, so only the outline can be offered.
  return {
    status: input.expectedStatus ?? 200,
    body: JSON.stringify({ id: 1, name: "string" }, null, 2),
    note: "A read cannot be derived from its request. This is a placeholder — send it (a GET is safe to repeat) or paste the real response.",
  };
}

/** Methods that change data on the server, so a Send is not repeatable. */
export const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function isWriteMethod(method?: string | null): boolean {
  return WRITE_METHODS.has((method ?? "GET").toUpperCase());
}

// ─── cURL sessions that include the response ────────────────────────────────

/**
 * Split a pasted terminal session into the command and whatever it printed.
 *
 * A cURL *command* carries no response — but a pasted *session* very often
 * does, and that is what people actually copy:
 *
 *   curl -i …      prints the status line and headers before the body
 *   curl -v …      prints them prefixed with "< ", the request with "> "
 *   curl -w …      prints exactly the fields the format string asked for
 *   curl …         prints the body on its own
 *
 * The command runs until its line continuations stop; everything after is
 * candidate output. Returning an empty `responseText` simply means the paste
 * was the command alone.
 */
export function splitCurlAndResponse(input: string): { command: string; responseText: string } {
  const lines = (input ?? "").replace(/\r\n/g, "\n").split("\n");

  const startIndex = lines.findIndex((line) => /(^|\s|\$)curl(\.exe)?(\s|$)/i.test(line));
  if (startIndex < 0) return { command: input ?? "", responseText: "" };

  // The command continues while its lines end with a continuation marker —
  // "\" on a POSIX shell, "^" from Windows "Copy as cURL (cmd)".
  let endIndex = startIndex;
  while (endIndex < lines.length && /[\\^]\s*$/.test(lines[endIndex])) endIndex++;

  const command = lines.slice(startIndex, endIndex + 1).join("\n");
  const rest = lines.slice(endIndex + 1);

  return { command, responseText: cleanCurlOutput(rest) };
}

/**
 * Strip the scaffolding curl prints around a response so the payload is left.
 *
 * `-v` marks response lines with "< ", the echoed request with "> " and its own
 * commentary with "* ". The progress meter is a block of columns that would
 * otherwise be mistaken for a body.
 */
function cleanCurlOutput(lines: string[]): string {
  const kept: string[] = [];
  let sawVerboseResponse = false;

  for (const raw of lines) {
    const line = raw.replace(/\r/g, "");

    // curl -v commentary and the echoed request are not the response.
    if (/^\s*\*/.test(line)) continue;
    if (/^\s*>/.test(line)) continue;
    // Progress meter: the header row and its numeric rows.
    if (/^\s*%\s*Total/.test(line)) continue;
    if (/--:--:--|\d+\s+\d+\s+\d+\s+\d+\s+\d+/.test(line) && !/[{}[\]":]/.test(line)) continue;
    // "{ [5 bytes data]" noise from -v.
    if (/^\s*[{}]\s*\[\d+\s+bytes data\]/.test(line)) continue;

    const responseLine = line.match(/^\s*<\s?(.*)$/);
    if (responseLine) {
      sawVerboseResponse = true;
      kept.push(responseLine[1]);
      continue;
    }

    kept.push(line);
  }

  // With -v the headers arrive prefixed and the body unprefixed, so a blank
  // line has to separate them for the response parser to find the boundary.
  if (sawVerboseResponse) {
    const headerEnd = kept.findIndex((line, index) => index > 0 && !line.trim());
    if (headerEnd < 0) kept.push("");
  }

  return kept.join("\n").trim();
}

/**
 * Read the fields `curl -w` was asked to print.
 *
 * The format string is author-defined, so only the documented variable names
 * are recognised — and only when written as `name: value`, which is the shape
 * every example in curl's own documentation uses. A bare number is deliberately
 * NOT treated as a status: it is far more likely to be part of the body.
 */
export function parseCurlWriteOut(text: string): {
  status: number | null;
  durationMs: number | null;
  sizeBytes: number | null;
} {
  const result: { status: number | null; durationMs: number | null; sizeBytes: number | null } = {
    status: null,
    durationMs: null,
    sizeBytes: null,
  };

  const httpCode = text.match(/\bhttp_code["\s:=]+(\d{3})\b/i);
  if (httpCode) result.status = Number(httpCode[1]);

  // curl reports every time_* variable in SECONDS.
  const timeTotal = text.match(/\btime_total["\s:=]+([\d.]+)/i);
  if (timeTotal) {
    const seconds = Number(timeTotal[1]);
    if (Number.isFinite(seconds)) result.durationMs = Math.round(seconds * 1000);
  }

  const sizeDownload = text.match(/\bsize_download["\s:=]+(\d+)/i);
  if (sizeDownload) result.sizeBytes = Number(sizeDownload[1]);

  return result;
}

export interface CurlSession {
  request: ParsedCurl | null;
  /** Present only when the paste included the command's output. */
  response: ParsedResponse | null;
}

/**
 * Parse a paste that may be a command, a command plus its output, or a
 * terminal session with curl's own scaffolding around it.
 *
 * This is what makes "paste one thing, get both halves" work: the request
 * fills the definition and the response fills the expected result, with no
 * second step and — crucially — without sending anything.
 */
export function parseCurlSession(input: string): CurlSession {
  const { command, responseText } = splitCurlAndResponse(input);
  const request = parseCurl(command);

  if (!responseText.trim()) return { request, response: null };

  const response = parseResponsePaste(responseText);
  const writeOut = parseCurlWriteOut(responseText);

  // -w values are explicit measurements and beat anything inferred.
  if (writeOut.status !== null) response.status = writeOut.status;
  if (writeOut.durationMs !== null) {
    response.durationMs = writeOut.durationMs;
    response.timeSource = "curl -w time_total";
  }
  if (writeOut.sizeBytes !== null) response.byteSize = writeOut.sizeBytes;

  // A response with neither a status nor a body is not a response.
  if (response.status === null && !response.body.trim()) return { request, response: null };

  return { request, response };
}

// ─── Literal credentials in an imported request ─────────────────────────────

export interface LiteralSecret {
  key: string;
  /** The variable this header should reference instead. */
  suggested: string;
  reason: string;
}

/** Header names whose value is a credential rather than a setting. */
const CREDENTIAL_HEADERS: Array<{ match: RegExp; variable: string; label: string }> = [
  { match: /^authorization$/i, variable: "accessToken", label: "an access token" },
  { match: /^x-api-key$|^api-key$|^apikey$/i, variable: "apiKey", label: "an API key" },
  { match: /^cookie$/i, variable: "sessionCookie", label: "a session cookie" },
  { match: /^x-auth-token$|^x-access-token$/i, variable: "accessToken", label: "an access token" },
];

/** True when a value is already a template rather than a real credential. */
function isTemplated(value: string): boolean {
  return /\{\{[^}]+\}\}/.test(value ?? "");
}

/**
 * Find credentials that were pasted in literally.
 *
 * A cURL command copied from a browser carries a real, live token. Saving it
 * into the catalog means the definition works today, breaks when the token
 * expires, and in the meantime a real credential is sitting in a shared record
 * that anyone with catalog read access can see. Both are worth catching before
 * the definition is written, not after.
 */
export function findLiteralSecrets(headers: KeyValueEntry[]): LiteralSecret[] {
  const found: LiteralSecret[] = [];

  for (const header of headers ?? []) {
    if (!header?.key || !header.value?.trim()) continue;
    if (isTemplated(header.value)) continue;

    const rule = CREDENTIAL_HEADERS.find((candidate) => candidate.match.test(header.key.trim()));
    if (!rule) continue;

    found.push({
      key: header.key,
      suggested: rule.variable,
      reason: `${header.key} carries ${rule.label} that will expire, and stores it in the shared catalog.`,
    });
  }

  return found;
}

/**
 * Swap literal credentials for {{variables}}, keeping the scheme.
 *
 * `Bearer eyJhb…` becomes `Bearer {{accessToken}}` rather than `{{accessToken}}`
 * — the scheme is part of the contract and the endpoint would reject the value
 * without it.
 */
export function templateSecrets(headers: KeyValueEntry[]): {
  headers: KeyValueEntry[];
  replaced: string[];
} {
  const secrets = findLiteralSecrets(headers);
  if (!secrets.length) return { headers, replaced: [] };

  const bySuggestion = new Map(secrets.map((secret) => [secret.key.toLowerCase(), secret.suggested]));
  const replaced: string[] = [];

  const next = (headers ?? []).map((header) => {
    const variable = bySuggestion.get(header.key?.toLowerCase() ?? "");
    if (!variable) return header;

    const scheme = header.value.match(/^(Bearer|Basic|Token|Digest)\s+/i)?.[1];
    replaced.push(header.key);
    return { ...header, value: scheme ? `${scheme} {{${variable}}}` : `{{${variable}}}` };
  });

  return { headers: next, replaced };
}

/** A worked example for the import box, so the accepted shape is obvious. */
export const CURL_EXAMPLE = `curl -i 'https://qa.example.com/api/users?notify=true' \\
  -X POST \\
  -H 'content-type: application/json' \\
  -H 'authorization: Bearer eyJhbGciOiJIUzI1NiJ9.example.token' \\
  --data-raw '{"name":"John","email":"john@test.com"}'
HTTP/1.1 201 Created
Content-Type: application/json
Server-Timing: app;dur=61, db;dur=23

{"id":101,"name":"John","email":"john@test.com","active":true}`;

/**
 * Rewrite a cURL command so its literal credentials become {{variables}}.
 *
 * The command TEXT is edited rather than the parsed result, so the import
 * review re-derives from it and the author sees exactly what changed before
 * committing. Both `-H` and `--header` are handled, in either quote style, and
 * the auth scheme is preserved because the endpoint would reject a bare token.
 */
export function templateSecretsInCommand(command: string, secrets: LiteralSecret[]): string {
  let next = command ?? "";

  for (const secret of secrets) {
    const name = secret.key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(
      new RegExp(
        `((?:-H|--header)\\s+(['"]))${name}(:\\s*)((?:Bearer|Basic|Token|Digest)\\s+)?[^'"]*\\2`,
        "gi"
      ),
      (_whole, lead, quote, colon, scheme) =>
        `${lead}${secret.key}${colon}${scheme ?? ""}{{${secret.suggested}}}${quote}`
    );
  }

  return next;
}
