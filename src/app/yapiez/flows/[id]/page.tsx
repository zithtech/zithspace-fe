"use client";

/**
 * The flow builder — where QA arranges catalog APIs into a journey and runs it.
 *
 * Three ideas share this screen, in the order they matter:
 *   Authentication  runs first on every execution, and stores the token
 *   Steps           the ordered APIs, each with its own extractions/assertions
 *   Run             executes the whole thing and shows what happened
 *
 * The chain that makes it a *flow* rather than a list is the extraction: a step
 * saves part of its response as {{userId}}, and the next step's URL uses it.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Drawer, Input, Switch, Tooltip, Typography, message } from "antd";
import { useParams, useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowLeft,
  GripVertical,
  KeyRound,
  Play,
  Plus,
  Settings2,
  Trash2,
  Workflow,
  Eye,
} from "lucide-react";
import { api as axios } from "@/lib/axios";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import {
  AssertionEditor,
  CodeBlock,
  ExtractionEditor,
  KeyValueEditor,
  MethodTag,
  SourceTag,
  StatusTag,
} from "@/components/yapiez/shared";
import {
  Assertion,
  BODY_TYPES,
  BodyType,
  Extraction,
  FlowRun,
  FlowStep,
  RunStep,
  YapiezApi,
  YapiezEnvironment,
  YapiezFlow,
  YapiezService,
  formatDuration,
} from "@/services/yapiezService";

const { Text } = Typography;
const { TextArea } = Input;

export default function FlowBuilderPage() {
  useActivitySource({ section: "WORK", module: "Yapiez", page: "FlowBuilder" });

  const params = useParams();
  const router = useRouter();
  const flowId = String(params?.id ?? "");
  const { canUpdateYapiezFlow, canExecuteYapiezFlow } = usePermission();

  const [flow, setFlow] = useState<YapiezFlow | null>(null);
  const [steps, setSteps] = useState<FlowStep[]>([]);
  const [apis, setApis] = useState<YapiezApi[]>([]);
  const [environments, setEnvironments] = useState<YapiezEnvironment[]>([]);
  const [scopes, setScopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<FlowRun | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addStepOpen, setAddStepOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = useCallback(async () => {
    try {
      const result = await YapiezService.getFlow(flowId);
      setFlow(result);
      setSteps(result.steps ?? []);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not load this flow");
      router.push("/yapiez/flows");
    } finally {
      setLoading(false);
    }
  }, [flowId, router]);

  useEffect(() => {
    if (flowId) load();
  }, [flowId, load]);

  useEffect(() => {
    // The whole catalog, so the step picker never has to paginate.
    YapiezService.listApis({ pageSize: 200 })
      .then((result) => setApis(result.data))
      .catch(() => setApis([]));
    YapiezService.listEnvironments()
      .then(setEnvironments)
      .catch(() => setEnvironments([]));
    axios
      .get("/api/v2/qa/test-scopes?limit=1000")
      .then((res: any) => setScopes(Array.isArray(res) ? res : res?.data?.data || res?.data || []))
      .catch(() => setScopes([]));
  }, []);

  const apiById = useMemo(() => new Map(apis.map((api) => [api.id, api])), [apis]);

  /** Variables a step can rely on: environment values plus everything the
   *  steps above it extract. Shown in the step editor so QA is not guessing. */
  const variablesAvailableAt = useCallback(
    (position: number): string[] => {
      const names = new Set<string>(["baseUrl"]);
      const environment = environments.find((e) => e.id === (flow?.environmentId ?? ""));
      for (const variable of environment?.variables ?? []) names.add(variable.key);
      if (flow?.authApiId && !flow.authConfig?.disabled) {
        names.add(flow.authConfig?.variableName || "accessToken");
      }
      for (const step of steps) {
        if (step.position >= position) break;
        for (const extraction of step.extractions ?? []) {
          if (extraction.variable) names.add(extraction.variable);
        }
      }
      return Array.from(names);
    },
    [environments, flow, steps]
  );

  const saveFlow = async (changes: Partial<YapiezFlow>) => {
    if (!flow) return;
    try {
      const updated = await YapiezService.updateFlow(flow.id, { ...flow, ...changes });
      setFlow({ ...updated, steps });
      message.success("Flow updated");
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not save the flow");
    }
  };

  const addStep = async (api: YapiezApi) => {
    try {
      await YapiezService.addStep(flowId, { apiId: api.id, stepName: api.name });
      setAddStepOpen(false);
      await load();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not add this step");
    }
  };

  const removeStep = async (step: FlowStep) => {
    try {
      await YapiezService.deleteStep(flowId, step.id);
      await load();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not remove this step");
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    // Move locally first so the list does not jump while the request is in
    // flight; the server's answer replaces it either way.
    const reordered = arrayMove(steps, oldIndex, newIndex);
    setSteps(reordered.map((step, index) => ({ ...step, position: index })));

    try {
      const saved = await YapiezService.reorderSteps(flowId, reordered.map((s) => s.id));
      setSteps(saved);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not save the new order");
      load();
    }
  };

  const run = async () => {
    setRunning(true);
    setLastRun(null);
    try {
      const result = await YapiezService.runFlow(flowId);
      setLastRun(result);
      if (result.status === "Passed") message.success(`Flow passed — ${result.passedSteps}/${result.totalSteps} steps`);
      else message.warning(`Flow failed — ${result.failedSteps} step(s) did not pass`);
      load();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "The flow could not be run");
    } finally {
      setRunning(false);
    }
  };

  if (loading || !flow) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <ZukvoLoader size="lg" />
        </div>
      </MainLayout>
    );
  }

  const authApi = flow.authApiId ? apiById.get(flow.authApiId) : null;
  const authDisabled = !!flow.authConfig?.disabled;

  return (
    <MainLayout>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16, maxWidth: 1080 }}>
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <Button type="text" icon={<ArrowLeft size={15} />} onClick={() => router.push("/yapiez/flows")} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Workflow size={17} style={{ color: "#047857" }} />
              <Text style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{flow.name}</Text>
            </div>
            <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {flow.environmentName ?? "Default environment"}
              {flow.scopeName ? ` · Test Scope: ${flow.scopeName}` : " · not linked to a Test Scope"}
              {flow.stopOnFailure ? " · stops on failure" : " · runs every step"}
            </Text>
          </div>
          <Button icon={<Settings2 size={14} />} onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          {canExecuteYapiezFlow && (
            <Button type="primary" icon={<Play size={14} />} loading={running} onClick={run} disabled={!steps.length}>
              Run flow
            </Button>
          )}
        </div>

        {/* ── Authentication ── */}
        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: authApi && !authDisabled ? "#eff6ff" : "var(--card-bg, #ffffff)",
            border: `1px solid ${authApi && !authDisabled ? "#bfdbfe" : "var(--border-color, #e2e8f0)"}`,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              background: authApi && !authDisabled ? "#dbeafe" : "#f1f5f9",
              color: authApi && !authDisabled ? "#1d4ed8" : "#64748b",
            }}
          >
            <KeyRound size={15} />
          </span>
          <div style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
              Authentication
            </Text>
            <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
              {authApi && !authDisabled
                ? `Runs ${authApi.name} first, stores the token as {{${flow.authConfig?.variableName || "accessToken"}}}, and attaches it to every step below.`
                : "No authentication step. Steps run without an Authorization header unless they set one themselves."}
            </Text>
          </div>
          <Button size="small" onClick={() => setSettingsOpen(true)}>
            Configure
          </Button>
        </div>

        {/* ── Steps ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            Steps ({steps.length})
          </Text>
          {canUpdateYapiezFlow && (
            <Button size="small" icon={<Plus size={13} />} onClick={() => setAddStepOpen(true)}>
              Add step
            </Button>
          )}
        </div>

        {!steps.length ? (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              borderRadius: 10,
              border: "1px dashed var(--border-color, #cbd5e1)",
            }}
          >
            <Text style={{ fontSize: 13, color: "var(--text-secondary)", display: "block" }}>
              No steps yet.
            </Text>
            <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Add the APIs in the order they should run — Create User, Get User, Update User, Delete User.
            </Text>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {steps.map((step, index) => (
                  <SortableStepRow
                    key={step.id}
                    step={step}
                    index={index}
                    api={apiById.get(step.apiId)}
                    canEdit={canUpdateYapiezFlow}
                    runStep={lastRun?.steps?.find((s) => s.stepId === step.id) ?? null}
                    onEdit={() => setEditingStep(step)}
                    onRemove={() => removeStep(step)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* ── Last run ── */}
        {lastRun && (
          <div
            style={{
              padding: 16,
              borderRadius: 10,
              background: "var(--card-bg, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <StatusTag status={lastRun.status} />
              <Text style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Run #{lastRun.runNumber}
              </Text>
              <Text style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                {lastRun.passedSteps} passed · {lastRun.failedSteps} failed · {lastRun.skippedSteps} skipped ·{" "}
                {formatDuration(lastRun.durationMs)}
              </Text>
              <span style={{ flex: 1 }} />
              <Button size="small" onClick={() => router.push(`/yapiez/runs/${lastRun.id}`)}>
                Full result
              </Button>
            </div>
            {lastRun.error && (
              <Text style={{ fontSize: 12, color: "#b91c1c" }}>{lastRun.error}</Text>
            )}
          </div>
        )}
      </div>

      <FlowSettingsDrawer
        open={settingsOpen}
        flow={flow}
        apis={apis}
        environments={environments}
        scopes={scopes}
        readOnly={!canUpdateYapiezFlow}
        onClose={() => setSettingsOpen(false)}
        onSave={async (changes) => {
          await saveFlow(changes);
          setSettingsOpen(false);
        }}
      />

      <AddStepDrawer open={addStepOpen} apis={apis} onClose={() => setAddStepOpen(false)} onPick={addStep} />

      {editingStep && (
        <StepEditorDrawer
          open
          flowId={flowId}
          step={editingStep}
          api={apiById.get(editingStep.apiId)}
          availableVariables={variablesAvailableAt(editingStep.position)}
          readOnly={!canUpdateYapiezFlow}
          onClose={() => setEditingStep(null)}
          onSaved={async () => {
            setEditingStep(null);
            await load();
          }}
        />
      )}
    </MainLayout>
  );
}

// ─── Step row ───────────────────────────────────────────────────────────────

function SortableStepRow({
  step,
  index,
  api,
  canEdit,
  runStep,
  onEdit,
  onRemove,
}: {
  step: FlowStep;
  index: number;
  api?: YapiezApi;
  canEdit: boolean;
  runStep: RunStep | null;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

  const extracted = (step.extractions ?? []).filter((e) => e.variable);
  const assertionCount = step.assertions?.length || api?.defaultAssertions?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 10,
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
      }}
    >
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: canEdit ? "grab" : "default", color: "#94a3b8", display: "flex" }}
        aria-label="Reorder step"
      >
        <GripVertical size={15} />
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

      <MethodTag method={step.method ?? api?.method} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: step.isEnabled ? "var(--text-primary)" : "var(--text-secondary)",
              textDecoration: step.isEnabled ? "none" : "line-through",
            }}
          >
            {step.stepName || api?.name || "Step"}
          </Text>
          {runStep && <StatusTag status={runStep.status} />}
        </div>
        <Text
          style={{
            fontSize: 11.5,
            color: "var(--text-secondary)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {step.overrides?.url || step.url || api?.url}
        </Text>
        {(extracted.length > 0 || assertionCount > 0) && (
          <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" }}>
            {extracted.map((extraction) => (
              <span
                key={extraction.variable}
                style={{
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10.5,
                  fontFamily: "ui-monospace, monospace",
                  color: "#047857",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                }}
              >
                → {`{{${extraction.variable}}}`}
              </span>
            ))}
            {assertionCount > 0 && (
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: 4,
                  fontSize: 10.5,
                  color: "#475569",
                  background: "#f1f5f9",
                  border: "1px solid #e2e8f0",
                }}
              >
                {assertionCount} assertion{assertionCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        )}
      </div>

      {canEdit && (
        <>
          <Tooltip title="Edit step">
            <Button size="small" type="text" icon={<Settings2 size={13} />} onClick={onEdit} />
          </Tooltip>
          <ConfirmDialog
            title="Remove this step?"
            description="The API definition stays in the catalog."
            tone="danger"
            confirmText="Remove"
            onConfirm={onRemove}
          >
            <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}

// ─── Flow settings ──────────────────────────────────────────────────────────

function FlowSettingsDrawer({
  open,
  flow,
  apis,
  environments,
  scopes,
  readOnly,
  onClose,
  onSave,
}: {
  open: boolean;
  flow: YapiezFlow;
  apis: YapiezApi[];
  environments: YapiezEnvironment[];
  scopes: any[];
  readOnly: boolean;
  onClose: () => void;
  onSave: (changes: Partial<YapiezFlow>) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Partial<YapiezFlow>>(flow);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(flow);
  }, [open, flow]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSave({
        ...draft,
        environmentId: draft.environmentId || null,
        scopeId: draft.scopeId || null,
        authApiId: draft.authApiId || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      {...commonDrawerProps}
      width={620}
      open={open}
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
          <Text style={{ fontSize: 15, fontWeight: 700 }}>Flow settings</Text>
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={submit} disabled={readOnly}>
              Save
            </Button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Labelled label="Flow name">
            <Input
              disabled={readOnly}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Labelled>

          <Labelled label="Description">
            <TextArea
              rows={2}
              disabled={readOnly}
              value={draft.description ?? ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Labelled>

          <Labelled label="Environment">
            <SearchableDropdown
              disabled={readOnly}
              value={draft.environmentId ?? null}
              onChange={(value: string) => setDraft({ ...draft, environmentId: value || null })}
              options={environments.map((environment) => ({
                value: environment.id,
                label: environment.name,
                description: environment.baseUrl,
              }))}
              placeholder="Use the default environment"
              itemNoun="environments"
              width={520}
            />
          </Labelled>

          <Labelled
            label="Test Scope"
            hint="Links these results into QA Space — the scope page and any QA Submission reporting on it."
          >
            <SearchableDropdown
              disabled={readOnly}
              value={draft.scopeId ?? null}
              onChange={(value: string) => setDraft({ ...draft, scopeId: value || null })}
              options={scopes.map((scope: any) => ({ value: scope.id, label: scope.name }))}
              placeholder="Not linked"
              itemNoun="scopes"
              width={520}
            />
          </Labelled>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Switch
              disabled={readOnly}
              checked={draft.stopOnFailure !== false}
              onChange={(checked) => setDraft({ ...draft, stopOnFailure: checked })}
            />
            <div>
              <Text style={{ fontSize: 12, fontWeight: 600, display: "block" }}>Stop on failure</Text>
              <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Remaining steps are recorded as Skipped once one fails.
              </Text>
            </div>
          </div>

          <div style={{ height: 1, background: "var(--border-color, #e2e8f0)" }} />

          <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Authentication</Text>
          <Text style={{ fontSize: 11.5, color: "var(--text-secondary)", marginTop: -10 }}>
            Runs before every other step. The token it returns is stored and attached to each subsequent
            request, so nobody copies it by hand.
          </Text>

          <Labelled label="Login API">
            <SearchableDropdown
              disabled={readOnly}
              value={draft.authApiId ?? null}
              onChange={(value: string) => setDraft({ ...draft, authApiId: value || null })}
              options={apis.map((api) => ({
                value: api.id,
                label: api.name,
                description: `${api.method} ${api.url}`,
              }))}
              placeholder="No authentication step"
              itemNoun="APIs"
              width={520}
            />
          </Labelled>

          {draft.authApiId && (
            <>
              <div style={{ display: "flex", gap: 12 }}>
                <Labelled label="Token path" hint="Where the token sits in the login response" style={{ flex: 1 }}>
                  <Input
                    disabled={readOnly}
                    placeholder="access_token"
                    value={draft.authConfig?.tokenPath ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, authConfig: { ...draft.authConfig, tokenPath: e.target.value } })
                    }
                    style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                  />
                </Labelled>
                <Labelled label="Stored as" style={{ flex: 1 }}>
                  <Input
                    disabled={readOnly}
                    placeholder="accessToken"
                    value={draft.authConfig?.variableName ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, authConfig: { ...draft.authConfig, variableName: e.target.value } })
                    }
                    style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                  />
                </Labelled>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <Labelled label="Header" style={{ flex: 1 }}>
                  <Input
                    disabled={readOnly}
                    placeholder="Authorization"
                    value={draft.authConfig?.headerName ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, authConfig: { ...draft.authConfig, headerName: e.target.value } })
                    }
                  />
                </Labelled>
                <Labelled label="Scheme" hint="Blank sends the token with no prefix" style={{ flex: 1 }}>
                  <Input
                    disabled={readOnly}
                    placeholder="Bearer"
                    value={draft.authConfig?.scheme ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, authConfig: { ...draft.authConfig, scheme: e.target.value } })
                    }
                  />
                </Labelled>
              </div>

              <Labelled
                label="Login payload override"
                hint="Leave blank to use the API's own payload. {{username}} and {{password}} come from the environment."
              >
                <TextArea
                  rows={4}
                  disabled={readOnly}
                  placeholder={'{\n  "email": "{{username}}",\n  "password": "{{password}}"\n}'}
                  value={draft.authConfig?.body ?? ""}
                  onChange={(e) => setDraft({ ...draft, authConfig: { ...draft.authConfig, body: e.target.value } })}
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                />
              </Labelled>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Switch
                  disabled={readOnly}
                  checked={!draft.authConfig?.disabled}
                  onChange={(checked) => setDraft({ ...draft, authConfig: { ...draft.authConfig, disabled: !checked } })}
                />
                <Text style={{ fontSize: 12, fontWeight: 600 }}>Authenticate on every run</Text>
              </div>
            </>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Add step ───────────────────────────────────────────────────────────────

function AddStepDrawer({
  open,
  apis,
  onClose,
  onPick,
}: {
  open: boolean;
  apis: YapiezApi[];
  onClose: () => void;
  onPick: (api: YapiezApi) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = apis.filter((api) => {
    if (api.isDeprecated) return false;
    if (!search.trim()) return true;
    const needle = search.toLowerCase();
    return api.name.toLowerCase().includes(needle) || api.url.toLowerCase().includes(needle);
  });

  return (
    <Drawer
      {...commonDrawerProps}
      width={520}
      open={open}
      onClose={onClose}
      styles={{ ...commonDrawerProps.styles, body: { padding: 0, background: "var(--card-bg, #ffffff)" } }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
          <Text style={{ fontSize: 15, fontWeight: 700, display: "block", marginBottom: 10 }}>Add a step</Text>
          <Input
            allowClear
            autoFocus
            placeholder="Search the catalog"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "10px 14px" }}>
          {!filtered.length ? (
            <div style={{ padding: 30, textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>
              Nothing matches. Define the API in the catalog first.
            </div>
          ) : (
            filtered.map((api) => (
              <button
                key={api.id}
                type="button"
                onClick={() => onPick(api)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 10px",
                  marginBottom: 4,
                  borderRadius: 8,
                  background: "transparent",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <MethodTag method={api.method} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      {api.name}
                    </span>
                    {/* Which tier this definition describes — worth seeing before
                        wiring it into a flow. */}
                    {api.sourceLabel && <SourceTag label={api.sourceLabel} color={api.sourceColor} />}
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
                    {api.url}
                  </span>
                </span>
                <Plus size={14} style={{ color: "#1d4ed8" }} />
              </button>
            ))
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Step editor ────────────────────────────────────────────────────────────

function StepEditorDrawer({
  open,
  flowId,
  step,
  api,
  availableVariables,
  readOnly,
  onClose,
  onSaved,
}: {
  open: boolean;
  flowId: string;
  step: FlowStep;
  api?: YapiezApi;
  availableVariables: string[];
  readOnly: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<FlowStep>(step);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewing, setPreviewing] = useState(false);
  const [tab, setTab] = useState<"chain" | "request">("chain");

  useEffect(() => {
    setDraft(step);
    setPreview(null);
    setTab("chain");
  }, [step]);

  const save = async () => {
    setSaving(true);
    try {
      await YapiezService.updateStep(flowId, step.id, {
        stepName: draft.stepName,
        description: draft.description,
        overrides: draft.overrides,
        extractions: draft.extractions,
        assertions: draft.assertions,
        continueOnFailure: draft.continueOnFailure,
        isEnabled: draft.isEnabled,
        delayMs: draft.delayMs,
      });
      message.success("Step saved");
      onSaved();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not save this step");
    } finally {
      setSaving(false);
    }
  };

  const runPreview = async () => {
    setPreviewing(true);
    try {
      setPreview(await YapiezService.previewStep(flowId, step.id));
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not build a preview");
    } finally {
      setPreviewing(false);
    }
  };

  const patchOverrides = (changes: Partial<FlowStep["overrides"]>) =>
    setDraft({ ...draft, overrides: { ...draft.overrides, ...changes } });

  return (
    <Drawer
      {...commonDrawerProps}
      width={780}
      open={open}
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
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <MethodTag method={api?.method} />
            <Text style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {draft.stepName || api?.name || "Step"}
            </Text>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button icon={<Eye size={14} />} loading={previewing} onClick={runPreview}>
              Preview
            </Button>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" loading={saving} onClick={save} disabled={readOnly}>
              Save step
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, padding: "0 22px", borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
          {(
            [
              ["chain", "Chaining & checks"],
              ["request", "Request overrides"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              style={{
                padding: "9px 14px",
                fontSize: 12.5,
                fontWeight: 600,
                background: "transparent",
                border: "none",
                borderBottom: `2px solid ${tab === key ? "#2563eb" : "transparent"}`,
                color: tab === key ? "#1d4ed8" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
          <Labelled label="Step name" hint="Defaults to the API's name">
            <Input
              disabled={readOnly}
              value={draft.stepName ?? ""}
              onChange={(e) => setDraft({ ...draft, stepName: e.target.value })}
              placeholder={api?.name}
            />
          </Labelled>

          {availableVariables.length > 0 && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
              <Text style={{ fontSize: 11.5, fontWeight: 700, color: "#334155", display: "block", marginBottom: 4 }}>
                Variables available at this point
              </Text>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {availableVariables.map((name) => (
                  <span
                    key={name}
                    style={{
                      padding: "1px 7px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: "ui-monospace, monospace",
                      color: "#1d4ed8",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                    }}
                  >
                    {`{{${name}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tab === "chain" && (
            <>
              <Labelled
                label="Pass values to later steps"
                hint="Create User returns an id — save it as {{userId}} and Get/Update/Delete can use it."
              >
                <ExtractionEditor
                  disabled={readOnly}
                  value={draft.extractions ?? []}
                  onChange={(extractions: Extraction[]) => setDraft({ ...draft, extractions })}
                />
              </Labelled>

              <Labelled
                label="Assertions"
                hint={
                  api?.defaultAssertions?.length
                    ? `Leave empty to inherit the ${api.defaultAssertions.length} assertion(s) on the API definition.`
                    : "Leave empty and any 2xx/3xx response counts as a pass."
                }
              >
                <AssertionEditor
                  disabled={readOnly}
                  value={draft.assertions ?? []}
                  onChange={(assertions: Assertion[]) => setDraft({ ...draft, assertions })}
                />
              </Labelled>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                <ToggleRow
                  label="Enabled"
                  hint="A disabled step is skipped entirely"
                  checked={draft.isEnabled}
                  disabled={readOnly}
                  onChange={(isEnabled) => setDraft({ ...draft, isEnabled })}
                />
                <ToggleRow
                  label="Continue if this fails"
                  hint="Overrides the flow's stop-on-failure for this step"
                  checked={draft.continueOnFailure}
                  disabled={readOnly}
                  onChange={(continueOnFailure) => setDraft({ ...draft, continueOnFailure })}
                />
              </div>

              <Labelled label="Delay before this step (ms)" hint="For endpoints that need a moment to settle">
                <Input
                  type="number"
                  disabled={readOnly}
                  value={draft.delayMs ?? 0}
                  onChange={(e) => setDraft({ ...draft, delayMs: Number(e.target.value) || 0 })}
                  style={{ maxWidth: 160 }}
                />
              </Labelled>
            </>
          )}

          {tab === "request" && (
            <>
              <Text style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                Anything left blank uses the API definition. Overrides apply to this step only — the shared
                definition is untouched.
              </Text>

              <Labelled label="URL override" hint={api ? `Definition: ${api.url}` : undefined}>
                <Input
                  disabled={readOnly}
                  placeholder={api?.url}
                  value={draft.overrides?.url ?? ""}
                  onChange={(e) => patchOverrides({ url: e.target.value || undefined })}
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                />
              </Labelled>

              <Labelled label="Additional headers">
                <KeyValueEditor
                  disabled={readOnly}
                  value={draft.overrides?.headers ?? []}
                  onChange={(headers) => patchOverrides({ headers })}
                  addLabel="Add header"
                />
              </Labelled>

              <Labelled label="Path parameters">
                <KeyValueEditor
                  disabled={readOnly}
                  value={draft.overrides?.pathParams ?? []}
                  onChange={(pathParams) => patchOverrides({ pathParams })}
                  keyPlaceholder="userId"
                  valuePlaceholder="{{userId}}"
                  addLabel="Add path param"
                />
              </Labelled>

              <Labelled label="Query parameters">
                <KeyValueEditor
                  disabled={readOnly}
                  value={draft.overrides?.queryParams ?? []}
                  onChange={(queryParams) => patchOverrides({ queryParams })}
                  addLabel="Add query param"
                />
              </Labelled>

              <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                <Labelled label="Body type" style={{ flex: "0 0 160px" }}>
                  <SearchableDropdown
                    disabled={readOnly}
                    value={draft.overrides?.bodyType ?? api?.bodyType ?? null}
                    onChange={(bodyType: BodyType) => patchOverrides({ bodyType })}
                    options={BODY_TYPES.map((t) => ({
                      value: t,
                      label: t === "none" ? "None" : t === "json" ? "JSON" : t === "form" ? "Form" : "Text",
                    }))}
                    allowClear={false}
                    hideAvatar
                    width={200}
                  />
                </Labelled>
                <ToggleRow
                  label="Skip flow authentication"
                  hint="Send this step without the flow's token"
                  checked={!!draft.overrides?.skipAuth}
                  disabled={readOnly}
                  onChange={(skipAuth) => patchOverrides({ skipAuth })}
                />
              </div>

              <Labelled label="Payload override">
                <TextArea
                  rows={8}
                  disabled={readOnly}
                  placeholder={api?.requestBody || "Uses the API definition's payload"}
                  value={draft.overrides?.body ?? ""}
                  onChange={(e) => patchOverrides({ body: e.target.value || undefined })}
                  style={{ fontFamily: "ui-monospace, monospace", fontSize: 12.5 }}
                />
              </Labelled>
            </>
          )}

          {preview && (
            <div
              style={{
                padding: 14,
                borderRadius: 10,
                background: "var(--input-bg, #f8fafc)",
                border: "1px solid var(--border-color, #e2e8f0)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <Text style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>
                What this step would send
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: "ui-monospace, monospace",
                  color: "var(--text-primary)",
                  wordBreak: "break-all",
                }}
              >
                {preview.method} {preview.url}
              </Text>
              {preview.unresolvedVariables?.length > 0 && (
                <div
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    fontSize: 11.5,
                    color: "#b91c1c",
                  }}
                >
                  Not yet resolved: {preview.unresolvedVariables.map((v: string) => `{{${v}}}`).join(", ")}. Values
                  extracted by earlier steps only exist during a real run — this is expected for those.
                </div>
              )}
              {preview.body && <CodeBlock value={preview.body} maxHeight={200} />}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

// ─── Small shared bits ──────────────────────────────────────────────────────

function Labelled({
  label,
  hint,
  children,
  style,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, ...style }}>
      <Text style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{label}</Text>
      {children}
      {hint && <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>{hint}</Text>}
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Switch size="small" disabled={disabled} checked={checked} onChange={onChange} />
      <div>
        <Text style={{ fontSize: 12, fontWeight: 600, display: "block" }}>{label}</Text>
        {hint && <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>{hint}</Text>}
      </div>
    </div>
  );
}
