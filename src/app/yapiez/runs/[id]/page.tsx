"use client";

/**
 * One execution, step by step.
 *
 * For every API call QA sees the request, the response, the status code, how
 * long it took, which assertions passed, and what the step contributed to the
 * variable chain. A failed step can become a BugList entry from here — the
 * whole point of Yapiez living inside QA Space rather than beside it.
 */

import React, { useCallback, useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Drawer, Input, Typography, message } from "antd";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bug, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import {
  AssertionResults,
  CodeBlock,
  HeaderTable,
  MethodTag,
  StatusTag,
} from "@/components/yapiez/shared";
import { FlowRun, RunStep, YapiezService, formatDuration } from "@/services/yapiezService";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;

export default function RunDetailPage() {
  useActivitySource({ section: "WORK", module: "Yapiez", page: "RunDetail" });

  const params = useParams();
  const router = useRouter();
  const runId = String(params?.id ?? "");
  const { canCreateBug } = usePermission();

  const [run, setRun] = useState<FlowRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [bugStep, setBugStep] = useState<RunStep | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await YapiezService.getRun(runId);
      setRun(result);
      // Failures are what QA came to read — open those, collapse the rest.
      setExpanded(new Set((result.steps ?? []).filter((s) => s.status === "Fail").map((s) => s.id)));
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not load this run");
      router.push("/yapiez/runs");
    } finally {
      setLoading(false);
    }
  }, [runId, router]);

  useEffect(() => {
    if (runId) load();
  }, [runId, load]);

  const toggle = (stepId: string) => {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  };

  if (loading || !run) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <ZukvoLoader size="lg" />
        </div>
      </MainLayout>
    );
  }

  const variables = Object.entries(run.variables ?? {});

  return (
    <MainLayout>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 1080 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <Button type="text" icon={<ArrowLeft size={15} />} onClick={() => router.push("/yapiez/runs")} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Text style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>
                {run.flowName ?? "Flow"} <span style={{ color: "var(--text-secondary)" }}>#{run.runNumber}</span>
              </Text>
              <StatusTag status={run.status} />
            </div>
            <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {dayjs(run.startedAt).format("DD MMM YYYY, HH:mm:ss")} · {run.environmentName ?? "Default environment"}
              {run.scopeName ? ` · Test Scope: ${run.scopeName}` : ""} · {formatDuration(run.durationMs)}
            </Text>
          </div>
          <Button onClick={() => router.push(`/yapiez/flows/${run.flowId}`)}>Open flow</Button>
        </div>

        {/* Result summary */}
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            padding: 14,
            borderRadius: 10,
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
          }}
        >
          <Summary label="Total steps" value={run.totalSteps} />
          <Summary label="Passed" value={run.passedSteps} tone="pass" />
          <Summary label="Failed" value={run.failedSteps} tone="fail" />
          <Summary label="Skipped" value={run.skippedSteps} />
        </div>

        {run.error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: 12.5,
              color: "#b91c1c",
            }}
          >
            {run.error}
          </div>
        )}

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(run.steps ?? []).map((step, index) => {
            const isOpen = expanded.has(step.id);
            return (
              <div
                key={step.id}
                style={{
                  borderRadius: 10,
                  background: "var(--card-bg, #ffffff)",
                  border: `1px solid ${step.status === "Fail" ? "#fecaca" : "var(--border-color, #e2e8f0)"}`,
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ color: "#94a3b8", display: "flex" }}>
                    {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  </span>
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#475569",
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {index + 1}
                  </span>
                  {step.stepKind === "auth" ? (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#1d4ed8",
                        background: "#eff6ff",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      AUTH
                    </span>
                  ) : (
                    <MethodTag method={step.method} />
                  )}
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {step.stepName}
                    </span>
                    <span
                      style={{
                        display: "block",
                        fontSize: 11.5,
                        color: "var(--text-secondary)",
                        fontFamily: "ui-monospace, monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {step.resolvedUrl ?? "—"}
                    </span>
                  </span>
                  {step.statusCode !== null && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: step.statusCode >= 400 || step.statusCode === 0 ? "#b91c1c" : "#047857",
                      }}
                    >
                      {step.statusCode || "—"}
                    </span>
                  )}
                  <span style={{ fontSize: 11.5, color: "var(--text-secondary)", minWidth: 62, textAlign: "right" }}>
                    {formatDuration(step.durationMs)}
                  </span>
                  <StatusTag status={step.status} />
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: "0 14px 14px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 14,
                      borderTop: "1px solid var(--border-color, #e2e8f0)",
                      paddingTop: 14,
                    }}
                  >
                    {step.error && (
                      <div
                        style={{
                          padding: "9px 12px",
                          borderRadius: 8,
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          fontSize: 12,
                          color: "#b91c1c",
                        }}
                      >
                        {step.error}
                      </div>
                    )}

                    <Section title="Assertions">
                      <AssertionResults results={step.assertionResults ?? []} />
                    </Section>

                    {Object.keys(step.extracted ?? {}).length > 0 && (
                      <Section title="Values passed to later steps">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {Object.entries(step.extracted).map(([key, value]) => (
                            <span
                              key={key}
                              style={{
                                padding: "2px 8px",
                                borderRadius: 5,
                                fontSize: 11.5,
                                fontFamily: "ui-monospace, monospace",
                                color: "#047857",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                              }}
                            >
                              {`{{${key}}}`} = {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </span>
                          ))}
                        </div>
                      </Section>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
                      <Section title="Request headers">
                        <HeaderTable headers={step.requestHeaders} />
                      </Section>
                      <Section title="Response headers">
                        <HeaderTable headers={step.responseHeaders} />
                      </Section>
                    </div>

                    <Section title="Request payload">
                      <CodeBlock value={step.requestBody} />
                    </Section>

                    <Section title="Response payload">
                      <CodeBlock value={step.responseBody} />
                    </Section>

                    {step.status === "Fail" && step.stepKind === "api" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {step.bugId ? (
                          <Button
                            size="small"
                            icon={<ExternalLink size={13} />}
                            onClick={() => router.push("/qa-workspace/bug-list")}
                          >
                            {step.bugNumber ?? "Bug"} linked — open Bug List
                          </Button>
                        ) : (
                          canCreateBug && (
                            <Button
                              size="small"
                              danger
                              icon={<Bug size={13} />}
                              onClick={() => setBugStep(step)}
                            >
                              Raise a bug from this failure
                            </Button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {variables.length > 0 && (
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
            }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
              Variables at the end of the run
            </Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {variables.map(([key, value]) => (
                <span
                  key={key}
                  style={{
                    padding: "2px 8px",
                    borderRadius: 5,
                    fontSize: 11.5,
                    fontFamily: "ui-monospace, monospace",
                    color: "#475569",
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {key} = {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {bugStep && (
        <RaiseBugDrawer
          step={bugStep}
          onClose={() => setBugStep(null)}
          onRaised={async () => {
            setBugStep(null);
            await load();
          }}
        />
      )}
    </MainLayout>
  );
}

function Summary({ label, value, tone }: { label: string; value: number; tone?: "pass" | "fail" }) {
  const color = tone === "pass" ? "#047857" : tone === "fail" ? "#b91c1c" : "var(--text-primary)";
  return (
    <div style={{ minWidth: 110 }}>
      <Text style={{ fontSize: 11, color: "var(--text-secondary)", display: "block" }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: 700, color }}>{value}</Text>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Text style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", letterSpacing: 0.3 }}>
        {title.toUpperCase()}
      </Text>
      {children}
    </div>
  );
}

/**
 * Raise a bug from a failed step.
 *
 * The description is composed server-side from the actual request, response and
 * failed assertions — QA edits it rather than writing it, so a developer gets a
 * reproducible report without a round-trip.
 */
function RaiseBugDrawer({
  step,
  onClose,
  onRaised,
}: {
  step: RunStep;
  onClose: () => void;
  onRaised: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targets, setTargets] = useState<Array<{ id: string; name: string; sheets: Array<{ id: string; name: string }> }>>([]);
  const [folderId, setFolderId] = useState<string | undefined>();
  const [sheetId, setSheetId] = useState<string | undefined>();
  const [draft, setDraft] = useState<{ title: string; description: string; severity: string; bugType: string; module: string }>({
    title: "",
    description: "",
    severity: "major",
    bugType: "api",
    module: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const [bugDraft, bugTargets] = await Promise.all([
          YapiezService.bugDraft(step.id),
          YapiezService.bugTargets(),
        ]);
        setDraft({
          title: bugDraft.title,
          description: bugDraft.description,
          severity: bugDraft.severity,
          bugType: bugDraft.bugType,
          module: bugDraft.module ?? "",
        });
        setTargets(bugTargets);
        if (bugTargets.length === 1) {
          setFolderId(bugTargets[0].id);
          if (bugTargets[0].sheets.length === 1) setSheetId(bugTargets[0].sheets[0].id);
        }
      } catch (error: any) {
        message.error(error?.response?.data?.error || "Could not prepare the bug");
      } finally {
        setLoading(false);
      }
    })();
  }, [step.id]);

  const sheets = targets.find((folder) => folder.id === folderId)?.sheets ?? [];

  const submit = async () => {
    if (!folderId || !sheetId) {
      message.warning("Choose the folder and sheet this bug belongs in");
      return;
    }
    setSaving(true);
    try {
      const result = await YapiezService.raiseBug(step.id, {
        folderId,
        sheetId,
        title: draft.title,
        description: draft.description,
        severity: draft.severity,
        bugType: draft.bugType,
        module: draft.module,
      });
      message.success(`${result.bugNumber} created in the Bug List`);
      onRaised();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not raise this bug");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      {...commonDrawerProps}
      width={680}
      open
      onClose={onClose}
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
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: 700 }}>Raise a bug</Text>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" danger loading={saving} onClick={submit} disabled={loading}>
              Create bug
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <ZukvoLoader size="md" />
          </div>
        ) : !targets.length ? (
          <div style={{ padding: 30 }}>
            <Text style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              There are no Bug List folders and sheets yet. Create one in QA Space → Bug List first, then come
              back here.
            </Text>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>Folder</Text>
                <SearchableDropdown
                  value={folderId ?? null}
                  onChange={(value: string) => {
                    setFolderId(value);
                    setSheetId(undefined);
                  }}
                  options={targets.map((folder) => ({ value: folder.id, label: folder.name }))}
                  placeholder="Choose a folder"
                  itemNoun="folders"
                  width={300}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>Sheet</Text>
                <SearchableDropdown
                  value={sheetId ?? null}
                  onChange={(value: string) => setSheetId(value)}
                  options={sheets.map((sheet) => ({ value: sheet.id, label: sheet.name }))}
                  placeholder={folderId ? "Choose a sheet" : "Pick a folder first"}
                  disabled={!folderId}
                  itemNoun="sheets"
                  width={300}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Title</Text>
              <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>Severity</Text>
                <SearchableDropdown
                  value={draft.severity}
                  onChange={(severity: string) => setDraft({ ...draft, severity })}
                  options={[
                    { value: "blocker", label: "Blocker", description: "Stops testing entirely" },
                    { value: "critical", label: "Critical", description: "Major function broken" },
                    { value: "major", label: "Major", description: "Significant, has a workaround" },
                    { value: "minor", label: "Minor", description: "Cosmetic or low impact" },
                  ]}
                  allowClear={false}
                  hideAvatar
                  width={280}
                />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <Text style={{ fontSize: 12, fontWeight: 600 }}>Module</Text>
                <Input value={draft.module} onChange={(e) => setDraft({ ...draft, module: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Description</Text>
              <TextArea
                rows={16}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 12 }}
              />
              <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Prefilled from the actual request, response and failed assertions. Edit anything before creating.
              </Text>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
