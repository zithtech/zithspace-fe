"use client";

/**
 * Execution history — every flow run, newest first.
 *
 * This is the evidence trail QA Space reports on: a run knows the Test Scope it
 * belongs to, so a QA Submission can cite it, and a failed step inside it can
 * become a BugList entry.
 */

import React, { Suspense, useCallback, useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button, Input, Table, Typography, message } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayCircle, Search, Trash2 } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useDebounce } from "@/hooks/useDebounce";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { StatusTag } from "@/components/yapiez/shared";
import { FlowRun, YapiezService, formatDuration } from "@/services/yapiezService";
import dayjs from "dayjs";

const { Text } = Typography;

const STATUSES = ["Running", "Passed", "Failed", "Aborted"];

function RunsContent() {
  useActivitySource({ section: "WORK", module: "Yapiez", page: "Runs" });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { canDeleteYapiezRun } = usePermission();

  const [runs, setRuns] = useState<FlowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Deep-linkable so a Test Scope can send QA straight to its own runs.
  const flowId = searchParams.get("flowId") ?? undefined;
  const scopeId = searchParams.get("scopeId") ?? undefined;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await YapiezService.listRuns({
        search: debouncedSearch || undefined,
        status: statusFilter,
        flowId,
        scopeId,
        page,
        pageSize,
      });
      setRuns(result.data);
      setTotal(result.total);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not load executions");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, flowId, scopeId, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const remove = async (run: FlowRun) => {
    try {
      await YapiezService.deleteRun(run.id);
      message.success("Run deleted");
      load();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Could not delete this run");
    }
  };

  const columns = [
    {
      title: "Status",
      dataIndex: "status",
      width: 100,
      render: (status: FlowRun["status"]) => <StatusTag status={status} />,
    },
    {
      title: "Flow",
      dataIndex: "flowName",
      render: (_: string, record: FlowRun) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
            {record.flowName ?? "Flow"}{" "}
            <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>#{record.runNumber}</span>
          </span>
          <span style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
            {record.environmentName ?? "Default environment"}
            {record.scopeName ? ` · ${record.scopeName}` : ""}
          </span>
        </div>
      ),
    },
    {
      title: "Steps",
      width: 190,
      render: (_: any, record: FlowRun) => (
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 11.5 }}>
          <Pill value={record.passedSteps} label="pass" tone="pass" />
          <Pill value={record.failedSteps} label="fail" tone="fail" />
          {record.skippedSteps > 0 && <Pill value={record.skippedSteps} label="skip" tone="neutral" />}
        </div>
      ),
    },
    {
      title: "Duration",
      dataIndex: "durationMs",
      width: 100,
      render: (ms: number | null) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{formatDuration(ms)}</span>
      ),
    },
    {
      title: "Started",
      dataIndex: "startedAt",
      width: 150,
      render: (value: string) => (
        <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          {dayjs(value).format("DD MMM YYYY, HH:mm")}
        </span>
      ),
    },
    {
      title: "",
      width: 50,
      align: "right" as const,
      render: (_: any, record: FlowRun) =>
        canDeleteYapiezRun ? (
          <div onClick={(e) => e.stopPropagation()}>
            <ConfirmDialog
              title="Delete this run?"
              description="The request and response records go with it."
              tone="danger"
              confirmText="Delete"
              onConfirm={() => remove(record)}
            >
              <Button size="small" type="text" danger icon={<Trash2 size={13} />} />
            </ConfirmDialog>
          </div>
        ) : null,
    },
  ];

  return (
    <MainLayout>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlayCircle size={18} style={{ color: "#475569" }} />
            <Text style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Executions</Text>
          </div>
          <Text style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            Every flow run, with the request and response of each step kept as evidence.
          </Text>
        </div>

        {(flowId || scopeId) && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Text style={{ fontSize: 12, color: "#1e40af" }}>
              Filtered to {flowId ? "one flow" : "one Test Scope"}.
            </Text>
            <Button size="small" onClick={() => router.push("/yapiez/runs")}>
              Show all
            </Button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Input
            allowClear
            prefix={<Search size={14} style={{ color: "#94a3b8" }} />}
            placeholder="Search by flow or run name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <SearchableDropdown
            value={statusFilter ?? null}
            onChange={(value: string) => setStatusFilter(value || undefined)}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
            placeholder="All statuses"
            width={200}
            hideAvatar
          />
        </div>

        <Table
          rowKey="id"
          size="small"
          columns={columns as any}
          dataSource={runs}
          loading={{ spinning: loading, indicator: <ZukvoLoader size="md" /> }}
          onRow={(record) => ({
            onClick: () => router.push(`/yapiez/runs/${record.id}`),
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
    </MainLayout>
  );
}

function Pill({ value, label, tone }: { value: number; label: string; tone: "pass" | "fail" | "neutral" }) {
  const palette =
    tone === "pass"
      ? { color: "#047857", background: "#ecfdf5", border: "#a7f3d0" }
      : tone === "fail"
        ? { color: "#b91c1c", background: "#fef2f2", border: "#fecaca" }
        : { color: "#475569", background: "#f1f5f9", border: "#e2e8f0" };

  return (
    <span
      style={{
        padding: "1px 7px",
        borderRadius: 999,
        fontWeight: 700,
        color: palette.color,
        background: palette.background,
        border: `1px solid ${palette.border}`,
      }}
    >
      {value} {label}
    </span>
  );
}

export default function RunsPage() {
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
      <RunsContent />
    </Suspense>
  );
}
