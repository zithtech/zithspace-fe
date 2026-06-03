"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  App,
  Table,
  Select,
  Input,
  Tag,
  Empty,
  Modal,
  Button,
  Checkbox,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Search, Plus, X } from "lucide-react";
import {
  featuresService,
  PricingFeature,
  FeatureType,
  FEATURE_TYPES,
  featureTypeLabel,
} from "@/services/pricing/featuresService";
import { planFeaturesService } from "@/services/pricing/planFeaturesService";

interface Props {
  planId: string;
}

const TYPE_COLORS: Record<FeatureType, string> = {
  MODULE: "blue",
  PAGE: "cyan",
  ACTION: "geekblue",
  AI: "magenta",
  AUTOMATION: "purple",
  LIMIT: "gold",
  INTEGRATION: "green",
  ADDON: "orange",
};

export default function PlanFeaturesTab({ planId }: Props) {
  // App.useApp() returns a modal instance bound to the AntD App context.
  // Static Modal.confirm() can fail silently when an <App> wrapper is in the tree.
  const { modal } = App.useApp();

  const [features, setFeatures] = useState<PricingFeature[]>([]);
  const [entitledMap, setEntitledMap] = useState<Map<string, string>>(new Map()); // featureId -> entitlement.id

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FeatureType | undefined>();

  // Per-row pending state so the unmap button shows loading while the API call is in flight
  const [pending, setPending] = useState<Set<string>>(new Set());

  // Bulk multi-select modal state
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [mapSelection, setMapSelection] = useState<Set<string>>(new Set());
  const [mapSearch, setMapSearch] = useState("");
  const [mapTypeFilter, setMapTypeFilter] = useState<FeatureType | undefined>();
  const [mapSaving, setMapSaving] = useState(false);

  async function loadFeatures() {
    try {
      const res = await featuresService.list({ limit: 1000, status: "active" });
      setFeatures(res.data);
    } catch (e: any) {
      message.error(e?.message || "Failed to load features");
    }
  }
  async function loadEntitled() {
    try {
      const list = await planFeaturesService.list({ planId });
      const m = new Map<string, string>();
      list.forEach((e) => m.set(e.featureId, e.id));
      setEntitledMap(m);
    } catch (e: any) {
      message.error(e?.message || "Failed to load entitlements");
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadFeatures(), loadEntitled()]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  const markPending = (id: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  function openMapModal() {
    // Pre-select currently mapped features so the modal opens in "edit mapping" mode
    setMapSelection(new Set(entitledMap.keys()));
    setMapSearch("");
    setMapTypeFilter(undefined);
    setMapModalOpen(true);
  }

  async function saveMapping() {
    const initial = new Set(entitledMap.keys());
    const toAdd: string[] = [];
    const toRemove: string[] = [];
    mapSelection.forEach((id) => {
      if (!initial.has(id)) toAdd.push(id);
    });
    initial.forEach((id) => {
      if (!mapSelection.has(id)) toRemove.push(id);
    });

    if (toAdd.length === 0 && toRemove.length === 0) {
      setMapModalOpen(false);
      return;
    }

    setMapSaving(true);
    const errors: string[] = [];
    try {
      // Add and remove in parallel — small N, safe to fan out.
      await Promise.all([
        ...toAdd.map((featureId) =>
          planFeaturesService
            .add({ planId, featureId })
            .catch((e) => errors.push(`add ${featureId}: ${e?.message || e}`))
        ),
        ...toRemove.map((featureId) =>
          planFeaturesService
            .removeByPair({ planId, featureId })
            .catch((e) => errors.push(`remove ${featureId}: ${e?.message || e}`))
        ),
      ]);
      if (errors.length) {
        message.warning(
          `Saved with ${errors.length} error(s). Reloading current state.`
        );
      } else {
        const summary = [
          toAdd.length ? `${toAdd.length} added` : null,
          toRemove.length ? `${toRemove.length} removed` : null,
        ]
          .filter(Boolean)
          .join(", ");
        message.success(`Features updated — ${summary}`);
      }
      setMapModalOpen(false);
      loadEntitled();
    } finally {
      setMapSaving(false);
    }
  }

  async function toggle(feature: PricingFeature, checked: boolean) {
    markPending(feature.id, true);
    // Optimistic update
    setEntitledMap((prev) => {
      const next = new Map(prev);
      if (checked) next.set(feature.id, "__pending__");
      else next.delete(feature.id);
      return next;
    });
    try {
      if (checked) {
        const created = await planFeaturesService.add({
          planId,
          featureId: feature.id,
        });
        setEntitledMap((prev) => {
          const next = new Map(prev);
          next.set(feature.id, created.id);
          return next;
        });
      } else {
        await planFeaturesService.removeByPair({
          planId,
          featureId: feature.id,
        });
      }
    } catch (e: any) {
      // Roll back optimistic update + re-fetch truth
      message.error(e?.message || (checked ? "Failed to entitle" : "Failed to remove"));
      loadEntitled();
    } finally {
      markPending(feature.id, false);
    }
  }

  // Tab shows ONLY mapped features (the "what's actually in this plan" view).
  // The full catalog (mapped + unmapped) lives inside the "Map features" modal.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features.filter((f) => {
      if (!entitledMap.has(f.id)) return false;
      if (typeFilter && f.featureType !== typeFilter) return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.code.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [features, typeFilter, search, entitledMap]);

  const columns: ColumnsType<PricingFeature> = useMemo(
    () => [
      {
        title: "Code",
        dataIndex: "code",
        width: 240,
        render: (v: string) => (
          <span className="font-mono text-[12.5px] text-slate-800 dark:text-slate-200">{v}</span>
        ),
      },
      { title: "Name", dataIndex: "name" },
      {
        title: "Type",
        dataIndex: "featureType",
        width: 130,
        render: (v: FeatureType) => (
          <Tag color={TYPE_COLORS[v]} bordered={false} className="!text-[11px]">
            {featureTypeLabel(v)}
          </Tag>
        ),
      },
      {
        title: "Scope",
        width: 260,
        render: (_: any, row) => {
          const parts: string[] = [];
          if (row.sectionName) parts.push(row.sectionName);
          if (row.moduleName) parts.push(row.moduleName);
          if (row.pageName) parts.push(row.pageName);
          if (!parts.length)
            return <span className="text-slate-400 dark:text-slate-500">— global —</span>;
          return (
            <span className="text-[12.5px] text-slate-600 dark:text-slate-400">
              {parts.join(" › ")}
            </span>
          );
        },
      },
      {
        title: "",
        key: "unmap",
        width: 60,
        align: "right" as const,
        render: (_: any, row) => (
          <Button
            type="text"
            size="small"
            icon={<X size={14} />}
            loading={pending.has(row.id)}
            onClick={() => {
              modal.confirm({
                title: "Unmap feature?",
                content: (
                  <span>
                    <span className="font-medium">{row.name}</span> (
                    <span className="font-mono text-[12px]">{row.code}</span>) will no
                    longer be included for new subscribers to this plan. Existing
                    subscriptions keep the feature snapshot taken at subscribe time.
                  </span>
                ),
                okText: "Unmap",
                okButtonProps: { danger: true },
                onOk: () => toggle(row, false),
              });
            }}
            title="Unmap from plan"
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entitledMap, pending]
  );

  const entitledCount = entitledMap.size;
  const totalAvailable = features.length;

  return (
    <div className="py-4">
      <div className="flex items-start justify-between mb-3 px-1 gap-3 flex-wrap">
        <div>
          <div className="text-[13px] text-slate-600 dark:text-slate-400">
            Map features to this plan. All variants under this plan inherit the same feature set.
          </div>
          <div className="mt-1 text-[12.5px] text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-800 dark:text-slate-200">{entitledCount}</span>
            <span className="text-slate-400 dark:text-slate-500"> / {totalAvailable}</span> mapped
          </div>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={openMapModal}
          disabled={features.length === 0}
          className="!flex !items-center !gap-1"
        >
          Map features
        </Button>
      </div>

      {entitledMap.size > 0 && (
        <div className="flex items-center justify-end gap-2 mb-3 px-1 flex-wrap">
          <Input
            allowClear
            prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
            placeholder="Search mapped features"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!max-w-[220px]"
          />
          <Select
            allowClear
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All types"
            options={FEATURE_TYPES.map((t) => ({ value: t, label: featureTypeLabel(t) }))}
            className="!min-w-[140px]"
          />
        </div>
      )}

      <Table<PricingFeature>
        rowKey="id"
        loading={loading}
        dataSource={filtered}
        columns={columns}
        size="middle"
        pagination={
          entitledMap.size > 25 ? { pageSize: 25, showSizeChanger: true } : false
        }
        locale={{
          emptyText: (
            <Empty
              description={
                entitledMap.size === 0
                  ? 'No features mapped yet. Click "Map features" to add some.'
                  : "No mapped features match these filters."
              }
            />
          ),
        }}
      />

      <div className="mt-3 px-1 text-[12px] text-slate-400 dark:text-slate-500">
        Plan-level features apply to every variant. Changes only affect new subscribers — existing
        subscriptions keep the feature snapshot taken at subscribe time.
      </div>

      <Modal
        open={mapModalOpen}
        onCancel={() => setMapModalOpen(false)}
        onOk={saveMapping}
        okText="Save mapping"
        confirmLoading={mapSaving}
        title={
          <div>
            <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              Map features
            </div>
            <div className="mt-0.5 text-[12px] font-normal text-slate-500 dark:text-slate-400">
              Pick what's included in this plan. All variants inherit the same set.
            </div>
          </div>
        }
        destroyOnClose
        width={680}
      >
        {(() => {
          const filteredFeatures = features.filter((f) =>
            featureMatchesModalFilters(f, mapSearch, mapTypeFilter)
          );
          // Live diff vs the saved (entitled) state
          let toAdd = 0;
          let toRemove = 0;
          mapSelection.forEach((id) => {
            if (!entitledMap.has(id)) toAdd++;
          });
          entitledMap.forEach((_, id) => {
            if (!mapSelection.has(id)) toRemove++;
          });
          return (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Input
                  allowClear
                  prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
                  placeholder="Search features"
                  value={mapSearch}
                  onChange={(e) => setMapSearch(e.target.value)}
                  className="!max-w-[260px]"
                />
                <Select
                  allowClear
                  value={mapTypeFilter}
                  onChange={setMapTypeFilter}
                  placeholder="All types"
                  options={FEATURE_TYPES.map((t) => ({
                    value: t,
                    label: featureTypeLabel(t),
                  }))}
                  className="!min-w-[140px]"
                />
                <div className="flex-1" />
                <Button
                  size="small"
                  type="link"
                  className="!px-1"
                  onClick={() => {
                    const visibleIds = filteredFeatures.map((f) => f.id);
                    setMapSelection((prev) => {
                      const next = new Set(prev);
                      visibleIds.forEach((id) => next.add(id));
                      return next;
                    });
                  }}
                >
                  Select visible
                </Button>
                <Button
                  size="small"
                  type="link"
                  className="!px-1"
                  onClick={() => {
                    const visibleIds = filteredFeatures.map((f) => f.id);
                    setMapSelection((prev) => {
                      const next = new Set(prev);
                      visibleIds.forEach((id) => next.delete(id));
                      return next;
                    });
                  }}
                >
                  Clear visible
                </Button>
              </div>

              {/* Counter strip */}
              <div className="mb-2 flex items-center justify-between text-[11.5px] text-slate-500 dark:text-slate-400">
                <span>
                  Showing{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {filteredFeatures.length}
                  </span>{" "}
                  of {features.length}
                </span>
                <span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {mapSelection.size}
                  </span>{" "}
                  selected
                </span>
              </div>

              {/* Feature list */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg max-h-[420px] overflow-auto">
                {filteredFeatures.map((f) => {
                  const checked = mapSelection.has(f.id);
                  const wasEntitled = entitledMap.has(f.id);
                  const scopeParts: string[] = [];
                  if (f.sectionName) scopeParts.push(f.sectionName);
                  if (f.moduleName) scopeParts.push(f.moduleName);
                  if (f.pageName) scopeParts.push(f.pageName);
                  // Mark adds / removes vs saved state
                  let badge: { color: string; label: string } | null = null;
                  if (checked && !wasEntitled)
                    badge = {
                      color:
                        "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50",
                      label: "+ add",
                    };
                  else if (!checked && wasEntitled)
                    badge = {
                      color:
                        "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50",
                      label: "− remove",
                    };
                  return (
                    <label
                      key={f.id}
                      className="flex items-start gap-3 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <Checkbox
                        checked={checked}
                        onChange={(e) => {
                          const c = e.target.checked;
                          setMapSelection((prev) => {
                            const next = new Set(prev);
                            if (c) next.add(f.id);
                            else next.delete(f.id);
                            return next;
                          });
                        }}
                        className="!mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] text-slate-800 dark:text-slate-200 font-medium">
                            {f.name}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                            {f.code}
                          </span>
                          <Tag
                            color={TYPE_COLORS[f.featureType as FeatureType]}
                            bordered={false}
                            className="!text-[10.5px]"
                          >
                            {featureTypeLabel(f.featureType)}
                          </Tag>
                          {badge ? (
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10.5px] font-medium ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                          ) : null}
                        </div>
                        {scopeParts.length > 0 ? (
                          <div className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                            {scopeParts.join(" › ")}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  );
                })}
                {filteredFeatures.length === 0 && (
                  <div className="px-3 py-10 text-center text-[12.5px] text-slate-400 dark:text-slate-500">
                    No features match these filters.
                  </div>
                )}
              </div>

              {/* Diff footer */}
              {toAdd === 0 && toRemove === 0 ? (
                <div className="mt-3 text-[12px] text-slate-400 dark:text-slate-500 italic">
                  No changes — selection matches what's currently mapped.
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-3 text-[12px]">
                  {toAdd > 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-medium tabular-nums">{toAdd}</span> to add
                    </span>
                  ) : null}
                  {toRemove > 0 ? (
                    <span className="inline-flex items-center gap-1 text-rose-700 dark:text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="font-medium tabular-nums">{toRemove}</span> to remove
                    </span>
                  ) : null}
                </div>
              )}
            </>
          );
        })()}
      </Modal>
    </div>
  );
}

function featureMatchesModalFilters(
  f: PricingFeature,
  search: string,
  typeFilter: FeatureType | undefined
): boolean {
  if (typeFilter && f.featureType !== typeFilter) return false;
  const q = search.trim().toLowerCase();
  if (q && !f.name.toLowerCase().includes(q) && !f.code.toLowerCase().includes(q)) {
    return false;
  }
  return true;
}
