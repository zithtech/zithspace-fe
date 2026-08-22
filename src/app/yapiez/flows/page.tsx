"use client";

/**
 * Flows — QA's reusable, ordered compositions of catalog APIs.
 *
 * A flow carries three things this list surfaces: the environment it runs
 * against, the Test Scope it reports to in QA Space, and the result of the last
 * time anyone ran it.
 */

import React, { useCallback, useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Drawer, Input, Switch, Table, Tooltip, Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { Plus, Search, Workflow, Trash2, Copy } from "lucide-react";
import { api as axios } from "@/lib/axios";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import { commonDrawerProps } from "@/components/common/DrawerSection";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ProjectService } from "@/services/projectService";
import { StatusTag } from "@/components/yapiez/shared";
import { YapiezEnvironment, YapiezFlow, YapiezService } from "@/services/yapiezService";
import dayjs from "dayjs";

const { Text } = Typography;
const { TextArea } = Input;

export default function FlowsPage() {
  useActivitySource({ section: "WORK", module: "Yapiez", page: "Flows" });

  const router = useRouter();
  const { canCreateYapiezFlow, canDeleteYapiezFlow } = usePermission();

  const [flows, setFlows] = useState<YapiezFlow[]>([]);
  const [environments, setEnvironments] = useState<YapiezEnvironment[]>([]);
  const [scopes, setScopes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [scopeFilter, setScopeFilter] = useState<string | undefined>();
  const [projectFilter, setProjectFilter] = useState<string | undefined>();
  const [projects, setProjects] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<YapiezFlow>>({
    name: "",
    description: "",
    stopOnFailure: true,
    status: "Active",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await YapiezService.listFlows({
        search: debouncedSearch || undefined,
        scopeId: scopeFilter,
        projectId: projectFilter,
        page,
        pageSize,
      });
      setFlows(result.data);
      setTotal(result.total);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not load flows");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, scopeFilter, projectFilter, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    YapiezService.listEnvironments()
      .then(setEnvironments)
      .catch(() => setEnvironments([]));
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
    // Scopes come from QA Space — a flow reports against one, the same way a
    // manual Test Run does.
    axios
      .get("/api/v2/qa/test-scopes?limit=1000")
      .then((res: any) => setScopes(Array.isArray(res) ? res : res?.data?.data || res?.data || []))
      .catch(() => setScopes([]));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, scopeFilter, projectFilter]);

  const create = async () => {
    if (!draft.name?.trim()) {
      message.warning("Give the flow a name");
      return;
    }
    setSaving(true);
    try {
      const flow = await YapiezService.createFlow({
        ...draft,
        environmentId: draft.environmentId || null,
        scopeId: draft.scopeId || null,
        projectId: draft.projectId || null,
      });
      message.success("Flow created — now add the APIs it runs");
      setDrawerOpen(false);
      router.push(`/yapiez/flows/${flow.id}`);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not create this flow");
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async (flow: YapiezFlow) => {
    try {
      const copy = await YapiezService.duplicateFlow(flow.id, `${flow.name} (copy)`);
      message.success("Flow duplicated");
      router.push(`/yapiez/flows/${copy.id}`);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not duplicate this flow");
    }
  };

  const remove = async (flow: YapiezFlow) => {
    try {
      await YapiezService.deleteFlow(flow.id);
      message.success("Flow deleted");
      load();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not delete this flow");
    }
  };

  const columns = [
    {
      title: "Flow",
      dataIndex: "name",
      render: (_: string, record: YapiezFlow) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{record.name}</span>
          <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
            {record.stepCount ?? 0} step{record.stepCount === 1 ? "" : "s"}
            {record.authApiName ? ` · authenticates with ${record.authApiName}` : " · no authentication step"}
          </span>
        </div>
      ),
    },
    {
      title: "Test Scope",
      dataIndex: "scopeName",
      width: 190,
      render: (name: string | null) =>
        name ? (
          <span style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>{name}</span>
        ) : (
          <Tooltip title="Link a scope so these results reach QA Space">
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Not linked</span>
          </Tooltip>
        ),
    },
    {
      title: "Environment",
      dataIndex: "environmentName",
      width: 140,
      render: (name: string | null) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{name || "Default"}</span>
      ),
    },
    {
      title: "Last run",
      width: 190,
      render: (_: any, record: YapiezFlow) =>
        record.lastRunAt ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusTag status={record.lastRunStatus} />
            <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
              {dayjs(record.lastRunAt).format("DD MMM, HH:mm")}
            </span>
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Never run</span>
        ),
    },
    {
      title: "",
      width: 100,
      align: "right" as const,
      render: (_: any, record: YapiezFlow) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          {canCreateYapiezFlow && (
            <Tooltip title="Duplicate">
              <Button size="small" type="text" icon={<Copy size={13} />} onClick={() => duplicate(record)} />
            </Tooltip>
          )}
          {canDeleteYapiezFlow && (
            <ConfirmDialog
              title="Delete this flow?"
              description="Its execution history is deleted with it."
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
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Workflow size={18} style={{ color: "#047857" }} />
              <Text style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Flows</Text>
            </div>
            <Text style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
              Order catalog APIs into a real journey. Values from one response feed the next.
            </Text>
          </div>
          {canCreateYapiezFlow && (
            <Button type="primary" icon={<Plus size={14} />} onClick={() => setDrawerOpen(true)}>
              New flow
            </Button>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Input
            allowClear
            prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
            placeholder="Search flows"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <SearchableDropdown
            value={projectFilter ?? null}
            onChange={(value: string) => setProjectFilter(value || undefined)}
            options={projects}
            placeholder="All projects"
            itemNoun="projects"
            width={240}
          />
          <SearchableDropdown
            value={scopeFilter ?? null}
            onChange={(value: string) => setScopeFilter(value || undefined)}
            options={scopes.map((scope: any) => ({ value: scope.id, label: scope.name }))}
            placeholder="All test scopes"
            itemNoun="scopes"
            width={280}
          />
        </div>

        <Table
          rowKey="id"
          size="small"
          columns={columns as any}
          dataSource={flows}
          loading={{ spinning: loading, indicator: <ZukvoLoader size="md" /> }}
          onRow={(record) => ({
            onClick: () => router.push(`/yapiez/flows/${record.id}`),
            style: { cursor: "pointer" },
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
      </div>

      <Drawer
        {...commonDrawerProps}
        width={560}
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
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>New flow</Text>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button type="primary" loading={saving} onClick={create}>
                Create
              </Button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Flow name</Text>
              <Input
                placeholder="User CRUD Flow"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Description</Text>
              <TextArea
                rows={2}
                placeholder="What this journey covers."
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Project</Text>
              <SearchableDropdown
                value={draft.projectId ?? null}
                onChange={(value: string) => setDraft({ ...draft, projectId: value || null })}
                options={projects}
                placeholder="Shared across all projects"
                itemNoun="projects"
                width={480}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Environment</Text>
              <SearchableDropdown
                value={draft.environmentId ?? null}
                onChange={(value: string) => setDraft({ ...draft, environmentId: value || null })}
                options={environments.map((environment) => ({
                  value: environment.id,
                  label: environment.name,
                  description: environment.baseUrl,
                }))}
                placeholder="Use the default environment"
                itemNoun="environments"
                width={480}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>Test Scope</Text>
              <SearchableDropdown
                value={draft.scopeId ?? null}
                onChange={(value: string) => setDraft({ ...draft, scopeId: value || null })}
                options={scopes.map((scope: any) => ({ value: scope.id, label: scope.name }))}
                placeholder="Not linked to QA Space"
                itemNoun="scopes"
                width={480}
              />
              <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                Linking a scope is what carries these results into QA Space — the scope page and any QA
                Submission reporting on it.
              </Text>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Switch
                checked={draft.stopOnFailure !== false}
                onChange={(checked) => setDraft({ ...draft, stopOnFailure: checked })}
              />
              <div>
                <Text style={{ fontSize: 12, fontWeight: 600, display: "block" }}>Stop on failure</Text>
                <Text style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                  Later steps are skipped once one fails. Turn off to run every step regardless.
                </Text>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </MainLayout>
  );
}
