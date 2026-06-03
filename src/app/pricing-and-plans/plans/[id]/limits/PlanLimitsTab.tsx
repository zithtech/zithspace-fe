"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  Select,
  Input,
  Switch,
  Tag,
  Empty,
  Alert,
  Button,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Search, X } from "lucide-react";
import { planVariantsService, PlanVariant } from "@/services/pricing/planVariantsService";
import { limitsService, PricingLimit } from "@/services/pricing/limitsService";
import {
  planLimitsService,
  PlanLimitAssignment,
  LIMIT_UNLIMITED_SENTINEL,
} from "@/services/pricing/planLimitsService";

interface Props {
  planId: string;
}

interface RowState {
  inputValue: string; // What's currently in the input box (as user sees it)
  isUnlimited: boolean;
  saving: boolean;
}

function parseLimitValue(stored: string | undefined): { isUnlimited: boolean; numeric: string } {
  if (!stored) return { isUnlimited: false, numeric: "" };
  if (stored === LIMIT_UNLIMITED_SENTINEL) return { isUnlimited: true, numeric: "" };
  return { isUnlimited: false, numeric: stored };
}

function formatNumeric(s: string): string {
  if (!s || !/^\d+$/.test(s)) return s;
  return Number(s).toLocaleString("en-US");
}

export default function PlanLimitsTab({ planId }: Props) {
  const [variants, setVariants] = useState<PlanVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [catalog, setCatalog] = useState<PricingLimit[]>([]);
  const [assigned, setAssigned] = useState<Map<string, PlanLimitAssignment>>(new Map());
  const [rowState, setRowState] = useState<Map<string, RowState>>(new Map());

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "assigned" | "unassigned">("all");

  async function loadVariants() {
    try {
      const res = await planVariantsService.list({ planId, limit: 200, status: "active" });
      setVariants(res.data);
      if (res.data.length && !selectedVariantId) {
        setSelectedVariantId(res.data[0].id);
      }
    } catch (e: any) {
      message.error(e?.message || "Failed to load variants");
    }
  }
  async function loadCatalog() {
    try {
      const res = await limitsService.list({ limit: 500, status: "active" });
      setCatalog(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load limits catalog");
    }
  }
  async function loadAssigned(variantId: string) {
    try {
      const list = await planLimitsService.list({ planVariantId: variantId });
      const m = new Map<string, PlanLimitAssignment>();
      list.forEach((a) => m.set(a.limitId, a));
      setAssigned(m);
      // Reset rowState to match assigned values
      const rs = new Map<string, RowState>();
      list.forEach((a) => {
        const parsed = parseLimitValue(a.limitValue);
        rs.set(a.limitId, {
          inputValue: parsed.numeric,
          isUnlimited: parsed.isUnlimited,
          saving: false,
        });
      });
      setRowState(rs);
    } catch (e: any) {
      message.error(e?.message || "Failed to load plan limits");
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadVariants(), loadCatalog()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  useEffect(() => {
    if (selectedVariantId) loadAssigned(selectedVariantId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVariantId]);

  const setRow = (limitId: string, patch: Partial<RowState>) => {
    setRowState((prev) => {
      const next = new Map(prev);
      const current = next.get(limitId) || { inputValue: "", isUnlimited: false, saving: false };
      next.set(limitId, { ...current, ...patch });
      return next;
    });
  };

  async function saveRow(limit: PricingLimit) {
    if (!selectedVariantId) return;
    const state = rowState.get(limit.id) || {
      inputValue: "",
      isUnlimited: false,
      saving: false,
    };
    const valueToSave = state.isUnlimited
      ? LIMIT_UNLIMITED_SENTINEL
      : state.inputValue.trim();

    const existing = assigned.get(limit.id);

    // Empty + not unlimited = remove (if assigned) or no-op
    if (!valueToSave) {
      if (!existing) return;
      setRow(limit.id, { saving: true });
      try {
        await planLimitsService.removeByPair({
          planVariantId: selectedVariantId,
          limitId: limit.id,
        });
        message.success(`${limit.name}: removed`);
        loadAssigned(selectedVariantId);
      } catch (e: any) {
        message.error(e?.message || "Remove failed");
        setRow(limit.id, { saving: false });
      }
      return;
    }

    // No-op if value hasn't changed
    if (existing && existing.limitValue === valueToSave) return;

    // Validate (the BE validates too, but pre-empt UX)
    if (!state.isUnlimited && !/^\d+$/.test(valueToSave)) {
      message.error("Value must be a non-negative integer");
      return;
    }

    setRow(limit.id, { saving: true });
    try {
      await planLimitsService.upsert({
        planVariantId: selectedVariantId,
        limitId: limit.id,
        limitValue: valueToSave,
      });
      loadAssigned(selectedVariantId);
    } catch (e: any) {
      message.error(e?.message || "Save failed");
      setRow(limit.id, { saving: false });
    }
  }

  async function explicitRemove(limit: PricingLimit) {
    if (!selectedVariantId) return;
    if (!assigned.has(limit.id)) return;
    setRow(limit.id, { saving: true });
    try {
      await planLimitsService.removeByPair({
        planVariantId: selectedVariantId,
        limitId: limit.id,
      });
      message.success(`${limit.name}: removed`);
      loadAssigned(selectedVariantId);
    } catch (e: any) {
      message.error(e?.message || "Remove failed");
      setRow(limit.id, { saving: false });
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((l) => {
      if (q && !l.name.toLowerCase().includes(q) && !l.code.toLowerCase().includes(q)) {
        return false;
      }
      const isAssigned = assigned.has(l.id);
      if (scope === "assigned" && !isAssigned) return false;
      if (scope === "unassigned" && isAssigned) return false;
      return true;
    });
  }, [catalog, search, scope, assigned]);

  const columns: ColumnsType<PricingLimit> = useMemo(
    () => [
      {
        title: "Limit",
        width: 320,
        render: (_: any, row) => (
          <div>
            <div className="text-[13px] text-slate-800 dark:text-slate-200">{row.name}</div>
            <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{row.code}</div>
          </div>
        ),
      },
      {
        title: "Unit",
        dataIndex: "unit",
        width: 110,
        render: (v: string) => (
          <Tag color="default" bordered className="!font-mono !text-[11px]">
            {v}
          </Tag>
        ),
      },
      {
        title: "Value",
        width: 220,
        render: (_: any, row) => {
          const state = rowState.get(row.id) || {
            inputValue: "",
            isUnlimited: false,
            saving: false,
          };
          return (
            <Input
              size="small"
              value={state.inputValue}
              placeholder={state.isUnlimited ? "—" : "0"}
              disabled={state.isUnlimited || state.saving}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d]/g, "");
                setRow(row.id, { inputValue: v });
              }}
              onBlur={() => saveRow(row)}
              onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
              suffix={
                state.inputValue && !state.isUnlimited ? (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {formatNumeric(state.inputValue)}
                  </span>
                ) : null
              }
            />
          );
        },
      },
      {
        title: "Unlimited",
        width: 110,
        align: "center" as const,
        render: (_: any, row) => {
          const state = rowState.get(row.id) || {
            inputValue: "",
            isUnlimited: false,
            saving: false,
          };
          return (
            <Switch
              size="small"
              checked={state.isUnlimited}
              loading={state.saving}
              onChange={(checked) => {
                setRow(row.id, { isUnlimited: checked });
                // Auto-save when toggling unlimited
                setTimeout(() => saveRow(row), 0);
              }}
            />
          );
        },
      },
      {
        title: "Status",
        width: 110,
        render: (_: any, row) => {
          const a = assigned.get(row.id);
          if (!a) return <Tag color="default" bordered={false}>not set</Tag>;
          if (a.limitValue === LIMIT_UNLIMITED_SENTINEL) {
            return <Tag color="purple" bordered={false}>unlimited</Tag>;
          }
          return (
            <Tag color="green" bordered={false}>
              = {formatNumeric(a.limitValue)}
            </Tag>
          );
        },
      },
      {
        title: "",
        key: "actions",
        width: 60,
        render: (_: any, row) => {
          const a = assigned.get(row.id);
          if (!a) return null;
          return (
            <Button
              type="text"
              size="small"
              icon={<X size={14} />}
              onClick={() => explicitRemove(row)}
              title="Remove assignment"
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowState, assigned]
  );

  if (variants.length === 0 && !loading) {
    return (
      <div className="py-6 px-1">
        <Alert
          type="info"
          showIcon
          message="No active variants"
          description="Create a variant on the Variants tab before assigning limits."
        />
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-3 px-1 gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-[12px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium">
            Variant
          </label>
          <Select
            value={selectedVariantId}
            onChange={setSelectedVariantId}
            options={variants.map((v) => ({
              value: v.id,
              label: (
                <span>
                  {v.name}
                  <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">{v.code}</span>
                </span>
              ),
            }))}
            className="!min-w-[260px]"
          />
          {selectedVariantId && (
            <span className="text-[12.5px] text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">{assigned.size}</span>
              <span className="text-slate-400 dark:text-slate-500"> / {catalog.length}</span> assigned
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            allowClear
            prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
            placeholder="Search limits"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!max-w-[220px]"
          />
          <Select
            value={scope}
            onChange={(v) => setScope(v as "all" | "assigned" | "unassigned")}
            options={[
              { value: "all", label: "All" },
              { value: "assigned", label: "Assigned only" },
              { value: "unassigned", label: "Not assigned" },
            ]}
            className="!min-w-[140px]"
          />
        </div>
      </div>

      <Table<PricingLimit>
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        columns={columns}
        size="middle"
        pagination={{ pageSize: 25, showSizeChanger: true }}
        locale={{
          emptyText: (
            <Empty
              description={
                catalog.length === 0
                  ? "No active limits in the catalog yet."
                  : "No limits match these filters."
              }
            />
          ),
        }}
      />

      <div className="mt-3 px-1 text-[12px] text-slate-400 dark:text-slate-500">
        Values save on blur (or Enter). Toggle <em>Unlimited</em> for no cap. Empty + not unlimited removes the assignment.
      </div>
    </div>
  );
}
