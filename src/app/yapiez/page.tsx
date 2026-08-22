"use client";

/**
 * Yapiez overview — what the module is, what this tenant has in it, and the
 * two doors in: the developer's catalog and QA's flows.
 */

import React, { useEffect, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Typography, message } from "antd";
import { useRouter } from "next/navigation";
import { Plug2, Workflow, PlayCircle, Layers, AlertTriangle, ArrowRight } from "lucide-react";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { StatTile, StatusTag } from "@/components/yapiez/shared";
import { FlowRun, YapiezService, YapiezStats, formatDuration } from "@/services/yapiezService";
import dayjs from "dayjs";

const { Text, Title } = Typography;

/** The pipeline Yapiez sits in, drawn once so the module explains itself. */
const PIPELINE = [
  { label: "Developer defines the API", href: "/yapiez/apis" },
  { label: "QA builds a flow", href: "/yapiez/flows" },
  { label: "Yapiez runs it", href: "/yapiez/runs" },
  { label: "Results reach QA Space", href: "/qa-workspace/test-scope" },
  { label: "Failures become bugs", href: "/qa-workspace/bug-list" },
];

export default function YapiezOverviewPage() {
  useActivitySource({ section: "WORK", module: "Yapiez", page: "Overview" });

  const router = useRouter();
  const { canReadYapiezApi, canReadYapiezFlow, canCreateYapiezApi, canCreateYapiezFlow } = usePermission();

  const [stats, setStats] = useState<YapiezStats | null>(null);
  const [recentRuns, setRecentRuns] = useState<FlowRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsResult, runsResult] = await Promise.all([
          YapiezService.stats(),
          YapiezService.listRuns({ pageSize: 8 }),
        ]);
        if (cancelled) return;
        setStats(statsResult);
        setRecentRuns(runsResult.data);
      } catch (error: any) {
        if (!cancelled) message.error(error?.response?.data?.error || "Could not load Yapiez");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <ZukvoLoader size="lg" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0, color: "var(--text-primary)" }}>
            Yapiez
          </Title>
          <Text style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Developers define each API once. QA arranges them into reusable flows, runs them against an
            environment, and the results become QA Space evidence.
          </Text>
        </div>

        {/* The pipeline, so the module's place in QA Space is legible on arrival. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            padding: "14px 16px",
            borderRadius: 10,
            background: "var(--card-bg, #ffffff)",
            border: "1px solid var(--border-color, #e2e8f0)",
          }}
        >
          {PIPELINE.map((stage, index) => (
            <React.Fragment key={stage.label}>
              <button
                type="button"
                onClick={() => router.push(stage.href)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  color: index < 3 ? "#1d4ed8" : "#475569",
                  background: index < 3 ? "#eff6ff" : "#f1f5f9",
                  border: `1px solid ${index < 3 ? "#bfdbfe" : "#e2e8f0"}`,
                  cursor: "pointer",
                }}
              >
                {stage.label}
              </button>
              {index < PIPELINE.length - 1 && <ArrowRight size={13} style={{ color: "#94a3b8" }} />}
            </React.Fragment>
          ))}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}
        >
          <StatTile label="API definitions" value={stats?.apis ?? 0} icon={Plug2} color="#1d4ed8" bgColor="#eff6ff" />
          <StatTile label="Flows" value={stats?.flows ?? 0} icon={Workflow} color="#047857" bgColor="#ecfdf5" />
          <StatTile label="Executions" value={stats?.runs ?? 0} icon={PlayCircle} color="#475569" bgColor="#f1f5f9" />
          <StatTile label="Environments" value={stats?.environments ?? 0} icon={Layers} color="#475569" bgColor="#f1f5f9" />
          <StatTile
            label="Failed runs"
            value={stats?.failed_runs ?? 0}
            icon={AlertTriangle}
            color="#b91c1c"
            bgColor="#fef2f2"
          />
        </div>

        {/* First-run guidance, shown only while the tenant genuinely has nothing. */}
        {!stats?.apis && canCreateYapiezApi && (
          <div
            style={{
              padding: 20,
              borderRadius: 10,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: 700, color: "#1e3a8a", display: "block" }}>
              Start with one API
            </Text>
            <Text style={{ fontSize: 12, color: "#1e40af", display: "block", marginTop: 4 }}>
              Add your login endpoint first — a flow authenticates before anything else, and every later step
              reuses the token automatically.
            </Text>
            <button
              type="button"
              onClick={() => router.push("/yapiez/apis?create=1")}
              style={{
                marginTop: 12,
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#ffffff",
                background: "#2563eb",
                border: "none",
                cursor: "pointer",
              }}
            >
              Define an API
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {canReadYapiezApi && (
            <DoorCard
              icon={Plug2}
              title="API Catalog"
              body="Method, URL, headers, payload, sample data and the expected response — defined once by the team that owns the endpoint."
              action={canCreateYapiezApi ? "Define an API" : "Browse the catalog"}
              onClick={() => router.push("/yapiez/apis")}
            />
          )}
          {canReadYapiezFlow && (
            <DoorCard
              icon={Workflow}
              title="Flows"
              body="Order the APIs into a real journey — Login, Create User, Get User, Update User, Delete User — passing values from one response into the next."
              action={canCreateYapiezFlow ? "Build a flow" : "Browse flows"}
              onClick={() => router.push("/yapiez/flows")}
            />
          )}
        </div>

        <div>
          <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 8 }}>
            Recent executions
          </Text>
          {!recentRuns.length ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                borderRadius: 10,
                border: "1px dashed var(--border-color, #cbd5e1)",
                color: "var(--text-secondary)",
                fontSize: 12,
              }}
            >
              Nothing has run yet.
            </div>
          ) : (
            <div
              style={{
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid var(--border-color, #e2e8f0)",
                background: "var(--card-bg, #ffffff)",
              }}
            >
              {recentRuns.map((run, index) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => router.push(`/yapiez/runs/${run.id}`)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    borderTop: index === 0 ? "none" : "1px solid var(--border-color, #e2e8f0)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <StatusTag status={run.status} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    {run.flowName ?? "Flow"} <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>#{run.runNumber}</span>
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {run.passedSteps}/{run.totalSteps} passed
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 70, textAlign: "right" }}>
                    {formatDuration(run.durationMs)}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 110, textAlign: "right" }}>
                    {dayjs(run.startedAt).format("DD MMM, HH:mm")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function DoorCard({
  icon: Icon,
  title,
  body,
  action,
  onClick,
}: {
  icon: any;
  title: string;
  body: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div
      style={{
        padding: 18,
        borderRadius: 10,
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "#eff6ff",
          color: "#1d4ed8",
        }}
      >
        <Icon size={16} />
      </span>
      <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</Text>
      <Text style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>{body}</Text>
      <button
        type="button"
        onClick={onClick}
        style={{
          alignSelf: "flex-start",
          marginTop: 4,
          padding: "5px 12px",
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600,
          color: "#1d4ed8",
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          cursor: "pointer",
        }}
      >
        {action}
      </button>
    </div>
  );
}
