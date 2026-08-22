"use client";

/**
 * Shared Yapiez presentation pieces.
 *
 * Palette note: blue for informational and read operations, green for success,
 * ash/light-grey for neutral chrome, and light red reserved for failure and
 * destructive actions only — the same discipline the rest of the app follows.
 */

import React from "react";
import { Input, Modal, Switch, Tooltip, Typography } from "antd";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import {
  ClipboardPaste,
  Plus,
  Trash2,
  Check,
  X,
  Laptop,
  Code2,
  FlaskConical,
  Rocket,
  Globe,
  Layers,
  Boxes,
} from "lucide-react";
import {
  Assertion,
  AssertionOperator,
  AssertionResult,
  ASSERTION_OPERATORS,
  DEFAULT_SOURCE_COLOR,
  ASSERTION_SOURCES,
  AssertionSource,
  Extraction,
  EXTRACTION_SOURCES,
  ExtractionSource,
  HttpMethod,
  KeyValueEntry,
  METHOD_COLORS,
  OPERATOR_LABELS,
  OPERATORS_NEEDING_VALUE,
  prettyJson,
  RunStatus,
  runStatusColor,
  StepStatus,
} from "@/services/yapiezService";
import { mergeKeyValues, parseKeyValueBlock } from "@/services/yapiezAuthoring";

const { Text } = Typography;

/** The coloured verb chip used everywhere an endpoint is listed. */
export function MethodTag({ method, size = "sm" }: { method?: string | null; size?: "sm" | "md" }) {
  const key = (method ?? "GET").toUpperCase() as HttpMethod;
  const colors = METHOD_COLORS[key] ?? METHOD_COLORS.GET;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: size === "md" ? 62 : 54,
        padding: size === "md" ? "3px 10px" : "2px 8px",
        borderRadius: 6,
        fontSize: size === "md" ? 11 : 10,
        fontWeight: 800,
        letterSpacing: 0.4,
        color: colors.text,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {key}
    </span>
  );
}

/**
 * An icon for a deployment tier.
 *
 * Sources are tenant-defined, so this matches on the stable `key` (and falls
 * back to the label) rather than assuming the four seeded tiers exist. Anything
 * unrecognised gets a neutral Layers glyph — a custom tier must still look like
 * a tier, not like a broken one.
 *
 * Matching is substring-based so "pre-prod", "production" and "prod" all land
 * on the same icon, which is what someone naming their own tiers expects.
 */
export function sourceIcon(source?: { key?: string | null; label?: string | null } | null): any {
  const needle = `${source?.key ?? ""} ${source?.label ?? ""}`.toLowerCase();

  // Order matters: "pre-prod" contains "prod", and the more specific staging
  // and development checks must win over a bare substring hit.
  if (/local|localhost|machine/.test(needle)) return Laptop;
  if (/dev(elop)?/.test(needle)) return Code2;
  if (/stag|qa|test|sit/.test(needle)) return FlaskConical;
  if (/beta|uat|preview|canary|early/.test(needle)) return Rocket;
  if (/prod|live|release/.test(needle)) return Globe;
  return Layers;
}

/** The icon standing for "every tier". */
export const ALL_SOURCES_ICON = Boxes;

/**
 * The deployment tier chip — local / staging / beta / prod.
 *
 * Tinted from the source's own colour rather than a fixed palette, since tiers
 * are tenant-defined and a tenant may add its own beyond the four defaults.
 */
export function SourceTag({
  label,
  color,
  size = "sm",
}: {
  label?: string | null;
  color?: string | null;
  size?: "sm" | "md";
}) {
  if (!label) {
    return (
      <span style={{ fontSize: size === "md" ? 12 : 11, color: "var(--text-secondary)" }}>—</span>
    );
  }
  const tint = color || DEFAULT_SOURCE_COLOR;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: size === "md" ? "2px 10px" : "1px 8px",
        borderRadius: 999,
        fontSize: size === "md" ? 11.5 : 10.5,
        fontWeight: 700,
        letterSpacing: 0.2,
        color: tint,
        // Derived from the tier's own colour so a custom tier styles itself.
        background: `${tint}14`,
        border: `1px solid ${tint}40`,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: 999, background: tint }} />
      {label}
    </span>
  );
}

export function StatusTag({ status }: { status?: RunStatus | StepStatus | null }) {
  const colors = runStatusColor(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: colors.text,
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      {status ?? "—"}
    </span>
  );
}

/** Product-standard stat tile, matching the QA Space pages. */
export function StatTile({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  sub,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bgColor: string;
  sub?: string;
}) {
  return (
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
}

/** Monospace block for a request or response payload. */
export function CodeBlock({ value, maxHeight = 320 }: { value?: string | null; maxHeight?: number }) {
  if (!value) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic", padding: "8px 0" }}>
        No content
      </div>
    );
  }
  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        maxHeight,
        overflow: "auto",
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.55,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        background: "var(--input-bg, #f8fafc)",
        border: "1px solid var(--border-color, #e2e8f0)",
        color: "var(--text-primary)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {prettyJson(value)}
    </pre>
  );
}

export function HeaderTable({ headers }: { headers: Record<string, string> }) {
  const entries = Object.entries(headers ?? {});
  if (!entries.length) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>None</div>
    );
  }
  return (
    <div style={{ border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 8, overflow: "hidden" }}>
      {entries.map(([key, value], index) => (
        <div
          key={key}
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(120px, 220px) 1fr",
            gap: 12,
            padding: "6px 10px",
            fontSize: 12,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            borderTop: index === 0 ? "none" : "1px solid var(--border-color, #e2e8f0)",
          }}
        >
          <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{key}</span>
          <span style={{ color: "var(--text-primary)", wordBreak: "break-all" }}>{value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * The headers / query / path param editor.
 *
 * `enabled` is a real column rather than an implicit "delete it if unused": a
 * developer documenting an optional header wants it visible to QA without it
 * being sent on every call.
 */
export function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = "Name",
  valuePlaceholder = "Value",
  addLabel = "Add row",
  showSecret = false,
  disabled = false,
  bulkPasteLabel,
  bulkPasteHint,
}: {
  value: KeyValueEntry[];
  onChange: (next: KeyValueEntry[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
  showSecret?: boolean;
  disabled?: boolean;
  /** Enables the bulk-paste affordance. Omit to hide it entirely. */
  bulkPasteLabel?: string;
  bulkPasteHint?: string;
}) {
  const rows = value ?? [];
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [bulkText, setBulkText] = React.useState("");

  const patch = (index: number, changes: Partial<KeyValueEntry>) => {
    const next = rows.map((row, i) => (i === index ? { ...row, ...changes } : row));
    onChange(next);
  };

  /** Merge pasted rows over what is already there, matching keys case-insensitively. */
  const applyBulk = () => {
    const parsed = parseKeyValueBlock(bulkText);
    if (!parsed.length) {
      setBulkOpen(false);
      return;
    }
    onChange(mergeKeyValues(rows, parsed));
    setBulkText("");
    setBulkOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((row, index) => (
        <div key={index} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Tooltip title={row.enabled === false ? "Documented but not sent" : "Sent with the request"}>
            <span>
              <Switch
                size="small"
                disabled={disabled}
                checked={row.enabled !== false}
                onChange={(checked) => patch(index, { enabled: checked })}
              />
            </span>
          </Tooltip>
          <Input
            size="small"
            disabled={disabled}
            placeholder={keyPlaceholder}
            value={row.key}
            onChange={(e) => patch(index, { key: e.target.value })}
            style={{ flex: "0 0 200px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}
          />
          <Input
            size="small"
            disabled={disabled}
            placeholder={valuePlaceholder}
            value={row.value}
            onChange={(e) => patch(index, { value: e.target.value })}
            style={{ flex: 1, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
          />
          {showSecret && (
            <Tooltip title="Mask this value in run records">
              <span>
                <Switch
                  size="small"
                  disabled={disabled}
                  checked={!!row.secret}
                  onChange={(checked) => patch(index, { secret: checked })}
                />
              </span>
            </Tooltip>
          )}
          <button
            type="button"
            disabled={disabled}
            aria-label="Remove row"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: 6,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange([...rows, { key: "", value: "", enabled: true }])}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 600,
            borderRadius: 6,
            border: "1px dashed var(--border-color, #cbd5e1)",
            background: "transparent",
            color: "#1d4ed8",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          <Plus size={13} /> {addLabel}
        </button>

        {bulkPasteLabel && !disabled && (
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 6,
              border: "1px dashed var(--border-color, #cbd5e1)",
              background: "transparent",
              color: "#475569",
              cursor: "pointer",
            }}
          >
            <ClipboardPaste size={13} /> {bulkPasteLabel}
          </button>
        )}
      </div>

      <Modal
        open={bulkOpen}
        title="Paste rows"
        okText="Add rows"
        onOk={applyBulk}
        onCancel={() => setBulkOpen(false)}
        width={560}
        destroyOnHidden
      >
        <Text style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 8 }}>
          {bulkPasteHint ?? "One per line. Both `Name: value` and `name=value` are understood; blank lines and # comments are skipped."}
        </Text>
        <Input.TextArea
          rows={8}
          autoFocus
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"Accept: application/json\nX-Tenant-Id: {{tenantId}}"}
          style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12.5 }}
        />
        <Text style={{ fontSize: 11, color: "var(--text-secondary)", display: "block", marginTop: 8 }}>
          A pasted key that already exists replaces its value rather than adding a duplicate.
        </Text>
      </Modal>
    </div>
  );
}

const SOURCE_LABELS: Record<AssertionSource, string> = {
  status: "Status code",
  body: "Response body",
  header: "Response header",
  responseTime: "Response time (ms)",
};

/** Assertion rows: "user.id should exist", "status equals 201". */
export function AssertionEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: Assertion[];
  onChange: (next: Assertion[]) => void;
  disabled?: boolean;
}) {
  const rows = value ?? [];

  const patch = (index: number, changes: Partial<Assertion>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((row, index) => {
        const needsPath = row.source === "body" || row.source === "header";
        const needsValue = OPERATORS_NEEDING_VALUE.has(row.operator);
        return (
          <div key={index} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <SearchableDropdown
              disabled={disabled}
              value={row.source}
              onChange={(source: AssertionSource) => patch(index, { source })}
              options={ASSERTION_SOURCES.map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
              allowClear={false}
              hideAvatar
              width={190}
              style={{ width: 158 }}
            />
            {needsPath && (
              <Input
                size="small"
                disabled={disabled}
                placeholder={row.source === "header" ? "content-type" : "user.id"}
                value={row.path}
                onChange={(e) => patch(index, { path: e.target.value })}
                style={{ width: 170, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
              />
            )}
            <SearchableDropdown
              disabled={disabled}
              value={row.operator}
              onChange={(operator: AssertionOperator) => patch(index, { operator })}
              options={ASSERTION_OPERATORS.map((o) => ({ value: o, label: OPERATOR_LABELS[o] }))}
              allowClear={false}
              hideAvatar
              searchPlaceholder="Find an operator"
              width={210}
              style={{ width: 158 }}
            />
            {needsValue && (
              <Input
                size="small"
                disabled={disabled}
                placeholder="Expected value — {{variables}} allowed"
                value={row.expected}
                onChange={(e) => patch(index, { expected: e.target.value })}
                style={{ flex: 1, minWidth: 160, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
              />
            )}
            <button
              type="button"
              disabled={disabled}
              aria-label="Remove assertion"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 26,
                height: 26,
                borderRadius: 6,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...rows, { source: "status", operator: "equals", expected: "200" }])}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 6,
          border: "1px dashed var(--border-color, #cbd5e1)",
          background: "transparent",
          color: "#1d4ed8",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Plus size={13} /> Add assertion
      </button>

      {!rows.length && (
        <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
          With no assertions, any 2xx or 3xx response counts as a pass.
        </Text>
      )}
    </div>
  );
}

const EXTRACTION_LABELS: Record<ExtractionSource, string> = {
  body: "Response body",
  header: "Response header",
  status: "Status code",
};

/** "Store response.id as {{userId}}" — how one step feeds the next. */
export function ExtractionEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: Extraction[];
  onChange: (next: Extraction[]) => void;
  disabled?: boolean;
}) {
  const rows = value ?? [];

  const patch = (index: number, changes: Partial<Extraction>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map((row, index) => (
        <div key={index} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>Save</span>
          <SearchableDropdown
            disabled={disabled}
            value={row.source}
            onChange={(source: ExtractionSource) => patch(index, { source })}
            options={EXTRACTION_SOURCES.map((s) => ({ value: s, label: EXTRACTION_LABELS[s] }))}
            allowClear={false}
            hideAvatar
            width={190}
            style={{ width: 158 }}
          />
          {row.source !== "status" && (
            <Input
              size="small"
              disabled={disabled}
              placeholder={row.source === "header" ? "x-request-id" : "data.id"}
              value={row.path}
              onChange={(e) => patch(index, { path: e.target.value })}
              style={{ width: 170, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
            />
          )}
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>as</span>
          <Input
            size="small"
            disabled={disabled}
            placeholder="userId"
            value={row.variable}
            onChange={(e) => patch(index, { variable: e.target.value })}
            prefix={<span style={{ fontSize: 11, color: "#94a3b8" }}>{"{{"}</span>}
            suffix={<span style={{ fontSize: 11, color: "#94a3b8" }}>{"}}"}</span>}
            style={{ width: 180, fontFamily: "ui-monospace, monospace", fontSize: 12 }}
          />
          <Tooltip title="Fail the step if this value is missing">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <Switch
                size="small"
                disabled={disabled}
                checked={!!row.required}
                onChange={(checked) => patch(index, { required: checked })}
              />
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Required</span>
            </span>
          </Tooltip>
          <button
            type="button"
            disabled={disabled}
            aria-label="Remove extraction"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              borderRadius: 6,
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange([...rows, { variable: "", source: "body", path: "" }])}
        style={{
          alignSelf: "flex-start",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 10px",
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 6,
          border: "1px dashed var(--border-color, #cbd5e1)",
          background: "transparent",
          color: "#1d4ed8",
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <Plus size={13} /> Pass a value to later steps
      </button>
    </div>
  );
}

/** The pass/fail list shown under an executed step. */
export function AssertionResults({ results }: { results: AssertionResult[] }) {
  if (!results?.length) {
    return (
      <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>
        No assertions were evaluated.
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {results.map((result, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "6px 10px",
            borderRadius: 6,
            fontSize: 12,
            background: result.passed ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${result.passed ? "#a7f3d0" : "#fecaca"}`,
          }}
        >
          <span style={{ color: result.passed ? "#047857" : "#b91c1c", marginTop: 1 }}>
            {result.passed ? <Check size={13} /> : <X size={13} />}
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{result.name}</span>
            {!result.passed && (
              <span style={{ display: "block", color: "#b91c1c", marginTop: 2 }}>{result.message}</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
