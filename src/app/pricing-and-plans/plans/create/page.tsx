"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Steps,
  Form,
  Input,
  InputNumber,
  Segmented,
  Button,
  Checkbox,
  Select,
  Tag,
  Switch,
  Empty,
  Spin,
  message,
  Alert,
  AutoComplete,
  Tooltip,
} from "antd";
import { ArrowLeft, Save, ArrowRight, Search } from "lucide-react";

import { plansService, PricingPlan, PlanInput } from "@/services/pricing/plansService";
import {
  featuresService,
  PricingFeature,
  FeatureType,
  FEATURE_TYPES,
  featureTypeLabel,
} from "@/services/pricing/featuresService";
import { limitsService, PricingLimit } from "@/services/pricing/limitsService";
import {
  planFeaturesService,
} from "@/services/pricing/planFeaturesService";
import {
  planVariantsService,
  BillingCycle,
  BILLING_CYCLES,
  PlanVariant,
} from "@/services/pricing/planVariantsService";
import {
  planVariantPricesService,
} from "@/services/pricing/planVariantPricesService";
import {
  planLimitsService,
  LIMIT_UNLIMITED_SENTINEL,
} from "@/services/pricing/planLimitsService";
import { slugifyCode } from "@/lib/codeSlugify";

type Step = 0 | 1 | 2;

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

const COMMON_CURRENCIES = ["USD", "EUR", "INR", "GBP", "CAD", "AUD", "SGD", "AED", "JPY", "CHF"];

interface PlanInfoState {
  name: string;
  code: string;
  description: string;
  displayOrder: number;
  status: "active" | "archived";
}

interface VariantConfig {
  cycle: BillingCycle;
  selected: boolean;
  active: boolean;
  currency: string;
  basePrice: number;
  setupFee: number;
  // limitCode -> { value, isUnlimited }
  limits: Map<string, { value: string; isUnlimited: boolean }>;
  // Filled in after save for re-entry handling
  variantId?: string;
}

export default function CreatePlanWizardPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>(0);
  const [planId, setPlanId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);

  // ---------- Step 1: plan info ----------
  const [info, setInfo] = useState<PlanInfoState>({
    name: "",
    code: "",
    description: "",
    displayOrder: 0,
    status: "active",
  });

  // ---------- Step 2: features ----------
  const [features, setFeatures] = useState<PricingFeature[]>([]);
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<Set<string>>(new Set());
  const [initialFeatureIds, setInitialFeatureIds] = useState<Set<string>>(new Set());
  const [featSearch, setFeatSearch] = useState("");
  const [featTypeFilter, setFeatTypeFilter] = useState<FeatureType | undefined>();

  // ---------- Step 3: variants ----------
  const [limitsCatalog, setLimitsCatalog] = useState<PricingLimit[]>([]);
  const [variants, setVariants] = useState<VariantConfig[]>(() =>
    BILLING_CYCLES.map((cycle) => emptyVariantConfig(cycle))
  );
  const [existingVariants, setExistingVariants] = useState<Set<BillingCycle>>(new Set());

  // ---------- Auto-fill code from name (Step 1) ----------
  useEffect(() => {
    // Code is uneditable — always synced to name
    const auto = slugifyCode(info.name || "");
    if (info.code !== auto) {
      setInfo((s) => ({ ...s, code: auto }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.name]);

  // ---------- Load lookups for steps 2 + 3 (once) ----------
  useEffect(() => {
    (async () => {
      try {
        const [f, l] = await Promise.all([
          featuresService.list({ limit: 1000, status: "active" }),
          limitsService.list({ limit: 500, status: "active" }),
        ]);
        setFeatures(f.data);
        setLimitsCatalog(l.data);
      } catch (e: any) {
        message.error(e?.message || "Failed to load catalog");
      }
    })();
  }, []);

  // ---------- Re-entry: when planId becomes set, refresh features + variants from BE ----------
  useEffect(() => {
    if (!planId) return;
    refreshFromBackend(planId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  async function refreshFromBackend(pid: string) {
    setPageLoading(true);
    try {
      const [mappedFeats, existingVars] = await Promise.all([
        planFeaturesService.list({ planId: pid }),
        planVariantsService.list({ planId: pid, limit: 200 }),
      ]);

      const mapped = new Set(mappedFeats.map((m) => m.featureId));
      setSelectedFeatureIds(mapped);
      setInitialFeatureIds(new Set(mapped));

      const cyclesAlreadyMade = new Set(existingVars.data.map((v) => v.billingCycle));
      setExistingVariants(cyclesAlreadyMade);

      // Mark variants that already exist as locked + populate variantId
      setVariants((prev) =>
        prev.map((v) => {
          const existing = existingVars.data.find((x) => x.billingCycle === v.cycle);
          if (existing) {
            return { ...v, selected: true, variantId: existing.id };
          }
          return v;
        })
      );
    } catch (e: any) {
      message.error(e?.message || "Failed to refresh");
    } finally {
      setPageLoading(false);
    }
  }

  // ============================================================
  // Saving — each step has its own save action
  // ============================================================

  async function saveStep1(continueToNext: boolean): Promise<boolean> {
    if (!info.name.trim()) {
      message.error("Name is required");
      return false;
    }
    if (!info.code) {
      message.error("Code couldn't be generated from the name");
      return false;
    }
    setSaving(true);
    try {
      let savedId = planId;
      if (!planId) {
        const created = await plansService.create(toPlanInput(info));
        savedId = created.id;
        setPlanId(savedId);
        message.success("Plan created");
      } else {
        await plansService.update(planId, {
          name: info.name,
          description: info.description || null,
          displayOrder: info.displayOrder,
          status: info.status,
          // Note: code intentionally NOT sent — it's immutable for existing plans
        });
        message.success("Plan updated");
      }
      if (continueToNext) {
        setStep(1);
      } else {
        router.push(`/pricing-and-plans/plans/${savedId}`);
      }
      return true;
    } catch (e: any) {
      const msg = e?.message || "Save failed";
      if (msg.toLowerCase().includes("code already exists")) {
        message.error(`Code "${info.code}" already exists — pick a different plan name`);
      } else {
        message.error(msg);
      }
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveStep2(continueToNext: boolean): Promise<boolean> {
    if (!planId) {
      message.error("Save step 1 first");
      return false;
    }
    setSaving(true);
    try {
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      selectedFeatureIds.forEach((id) => {
        if (!initialFeatureIds.has(id)) toAdd.push(id);
      });
      initialFeatureIds.forEach((id) => {
        if (!selectedFeatureIds.has(id)) toRemove.push(id);
      });

      await Promise.all([
        ...toAdd.map((featureId) => planFeaturesService.add({ planId, featureId })),
        ...toRemove.map((featureId) =>
          planFeaturesService.removeByPair({ planId, featureId })
        ),
      ]);
      setInitialFeatureIds(new Set(selectedFeatureIds));
      const summary = [
        toAdd.length ? `${toAdd.length} added` : null,
        toRemove.length ? `${toRemove.length} removed` : null,
        !toAdd.length && !toRemove.length ? "no changes" : null,
      ]
        .filter(Boolean)
        .join(", ");
      message.success(`Features saved (${summary})`);
      if (continueToNext) {
        setStep(2);
      } else {
        router.push(`/pricing-and-plans/plans/${planId}`);
      }
      return true;
    } catch (e: any) {
      message.error(e?.message || "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveStep3(): Promise<boolean> {
    if (!planId) {
      message.error("Save step 1 first");
      return false;
    }
    const toCreate = variants.filter((v) => v.selected && !v.variantId);
    if (toCreate.length === 0) {
      // Nothing new — just finish
      router.push(`/pricing-and-plans/plans/${planId}`);
      return true;
    }
    // Validate
    for (const v of toCreate) {
      if (v.basePrice === null || v.basePrice === undefined || v.basePrice < 0) {
        message.error(`${v.cycle}: price must be ≥ 0`);
        return false;
      }
      if (!/^[A-Z]{3}$/.test(v.currency)) {
        message.error(`${v.cycle}: currency must be a 3-letter ISO code`);
        return false;
      }
    }

    setSaving(true);
    try {
      for (const v of toCreate) {
        const planCode = info.code;
        const variantCode = `${planCode}_${v.cycle}`;
        const variantName = `${info.name} ${v.cycle.replace("_", " ").toLowerCase()}`;
        // 1. Variant
        const created = await planVariantsService.create({
          planId,
          code: variantCode,
          name: variantName,
          billingCycle: v.cycle,
          status: v.active ? "active" : "archived",
        });
        // 2. Price
        await planVariantPricesService.create({
          planVariantId: created.id,
          currencyCode: v.currency,
          basePrice: v.basePrice,
          setupFee: v.setupFee || 0,
          status: "active",
        });
        // 3. Limits — only the ones the user filled in
        for (const [limitCode, lv] of v.limits) {
          const limitObj = limitsCatalog.find((l) => l.code === limitCode);
          if (!limitObj) continue;
          const value = lv.isUnlimited
            ? LIMIT_UNLIMITED_SENTINEL
            : (lv.value || "").trim();
          if (!value) continue;
          await planLimitsService.upsert({
            planVariantId: created.id,
            limitId: limitObj.id,
            limitValue: value,
          });
        }
      }
      message.success(`${toCreate.length} variant(s) created`);
      router.push(`/pricing-and-plans/plans/${planId}`);
      return true;
    } catch (e: any) {
      message.error(e?.message || "Save failed");
      // Refresh so the wizard reflects partial success
      if (planId) refreshFromBackend(planId);
      return false;
    } finally {
      setSaving(false);
    }
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="px-8 py-7 max-w-[1100px]">
      <Link
        href="/pricing-and-plans/plans"
        className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <ArrowLeft size={13} /> Back to plans
      </Link>

      <div className="mt-3 mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {planId ? "Edit plan" : "New plan"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Walk through plan info → features → variants. You can save and exit at any step.
        </p>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#131B2D] p-6">
        <Steps
          current={step}
          className="!mb-7"
          items={[
            { title: "Plan info" },
            { title: "Features" },
            { title: "Variants" },
          ]}
        />

        {pageLoading ? (
          <div className="py-14 flex justify-center">
            <Spin />
          </div>
        ) : (
          <>
            {step === 0 && (
              <Step1PlanInfo info={info} setInfo={setInfo} isExisting={!!planId} />
            )}
            {step === 1 && (
              <Step2Features
                features={features}
                selected={selectedFeatureIds}
                setSelected={setSelectedFeatureIds}
                search={featSearch}
                setSearch={setFeatSearch}
                typeFilter={featTypeFilter}
                setTypeFilter={setFeatTypeFilter}
              />
            )}
            {step === 2 && (
              <Step3Variants
                variants={variants}
                setVariants={setVariants}
                limitsCatalog={limitsCatalog}
                existingCycles={existingVariants}
                planName={info.name}
                planCode={info.code}
              />
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <Button
            disabled={step === 0 || saving}
            onClick={() => setStep((step - 1) as Step)}
            icon={<ArrowLeft size={14} />}
            className="!flex !items-center !gap-1.5"
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                if (step === 0) saveStep1(false);
                else if (step === 1) saveStep2(false);
                else if (step === 2) saveStep3();
              }}
              disabled={saving}
              icon={<Save size={14} />}
              className="!flex !items-center !gap-1.5"
            >
              {step === 2 ? "Save & finish" : "Save"}
            </Button>
            {step < 2 && (
              <Button
                type="primary"
                onClick={() => {
                  if (step === 0) saveStep1(true);
                  else if (step === 1) saveStep2(true);
                }}
                loading={saving}
                className="!flex !items-center !gap-1.5"
              >
                Save & continue <ArrowRight size={14} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Step 1 — Plan info
// ============================================================
function Step1PlanInfo({
  info,
  setInfo,
  isExisting,
}: {
  info: PlanInfoState;
  setInfo: React.Dispatch<React.SetStateAction<PlanInfoState>>;
  isExisting: boolean;
}) {
  return (
    <div className="max-w-[640px]">
      <Form layout="vertical" requiredMark="optional">
        <Form.Item label="Name" required>
          <Input
            placeholder="e.g. Starter, Growth, Pro"
            value={info.name}
            onChange={(e) => setInfo((s) => ({ ...s, name: e.target.value }))}
            autoFocus
          />
        </Form.Item>
        <Form.Item
          label="Code"
          tooltip="Auto-generated from the name in UPPER_SNAKE_CASE. Immutable once the plan is saved."
        >
          <Input value={info.code} disabled placeholder="STARTER" />
        </Form.Item>
        <Form.Item label="Description">
          <Input.TextArea
            rows={3}
            placeholder="What this plan is for, who it targets."
            value={info.description}
            onChange={(e) => setInfo((s) => ({ ...s, description: e.target.value }))}
          />
        </Form.Item>
        <div className="grid grid-cols-2 gap-3">
          <Form.Item label="Display order">
            <InputNumber
              min={0}
              value={info.displayOrder}
              onChange={(v) => setInfo((s) => ({ ...s, displayOrder: v ?? 0 }))}
              className="!w-full"
            />
          </Form.Item>
          <Form.Item label="Status">
            <Segmented
              value={info.status}
              onChange={(v) => setInfo((s) => ({ ...s, status: v as "active" | "archived" }))}
              options={[
                { label: "Active", value: "active" },
                { label: "Archived", value: "archived" },
              ]}
            />
          </Form.Item>
        </div>
        {isExisting && (
          <Alert
            type="info"
            showIcon
            className="!mt-2"
            message="Plan is already saved"
            description="Name, description, order and status can still be edited. The code is locked once the plan exists."
          />
        )}
      </Form>
    </div>
  );
}

// ============================================================
// Step 2 — Features multi-select
// ============================================================
function Step2Features({
  features,
  selected,
  setSelected,
  search,
  setSearch,
  typeFilter,
  setTypeFilter,
}: {
  features: PricingFeature[];
  selected: Set<string>;
  setSelected: React.Dispatch<React.SetStateAction<Set<string>>>;
  search: string;
  setSearch: (s: string) => void;
  typeFilter: FeatureType | undefined;
  setTypeFilter: (t: FeatureType | undefined) => void;
}) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features.filter((f) => {
      if (typeFilter && f.featureType !== typeFilter) return false;
      if (q && !f.name.toLowerCase().includes(q) && !f.code.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [features, search, typeFilter]);

  const visibleIds = useMemo(() => filtered.map((f) => f.id), [filtered]);

  function setAllVisible(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleIds.forEach((id) => (checked ? next.add(id) : next.delete(id)));
      return next;
    });
  }

  return (
    <div>
      <div className="mb-2 text-[13px] text-slate-600 dark:text-slate-400">
        Pick the features included in this plan. All variants under the plan inherit the same set.
      </div>
      <div className="mb-1 text-[12.5px] text-slate-500 dark:text-slate-400">
        <span className="font-medium text-slate-800 dark:text-slate-200">{selected.size}</span>
        <span className="text-slate-400 dark:text-slate-500"> / {features.length}</span> selected
      </div>

      <div className="flex items-center gap-2 my-3 flex-wrap">
        <Input
          allowClear
          prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
          placeholder="Search features"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="!max-w-[260px]"
        />
        <Select
          allowClear
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All types"
          options={FEATURE_TYPES.map((t) => ({ value: t, label: featureTypeLabel(t) }))}
          className="!min-w-[140px]"
        />
        <Button size="small" type="link" onClick={() => setAllVisible(true)}>
          Select visible
        </Button>
        <Button size="small" type="link" onClick={() => setAllVisible(false)}>
          Clear visible
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-md max-h-[480px] overflow-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-10 text-center">
            <Empty
              description={
                features.length === 0
                  ? "No active features in the catalog yet. Add some via the Features catalog page."
                  : "No features match these filters."
              }
            />
          </div>
        ) : (
          filtered.map((f) => {
            const checked = selected.has(f.id);
            const scopeParts: string[] = [];
            if (f.sectionName) scopeParts.push(f.sectionName);
            if (f.moduleName) scopeParts.push(f.moduleName);
            if (f.pageName) scopeParts.push(f.pageName);
            return (
              <label
                key={f.id}
                className="flex items-start gap-3 px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <Checkbox
                  checked={checked}
                  onChange={(e) => {
                    const c = e.target.checked;
                    setSelected((prev) => {
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
                  </div>
                  {scopeParts.length > 0 ? (
                    <div className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">
                      {scopeParts.join(" › ")}
                    </div>
                  ) : null}
                </div>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

// ============================================================
// Step 3 — Variants + prices + limits
// ============================================================
function Step3Variants({
  variants,
  setVariants,
  limitsCatalog,
  existingCycles,
  planName,
  planCode,
}: {
  variants: VariantConfig[];
  setVariants: React.Dispatch<React.SetStateAction<VariantConfig[]>>;
  limitsCatalog: PricingLimit[];
  existingCycles: Set<BillingCycle>;
  planName: string;
  planCode: string;
}) {
  function updateVariant(cycle: BillingCycle, patch: Partial<VariantConfig>) {
    setVariants((prev) => prev.map((v) => (v.cycle === cycle ? { ...v, ...patch } : v)));
  }
  function setVariantLimit(
    cycle: BillingCycle,
    limitCode: string,
    patch: Partial<{ value: string; isUnlimited: boolean }>
  ) {
    setVariants((prev) =>
      prev.map((v) => {
        if (v.cycle !== cycle) return v;
        const nextLimits = new Map(v.limits);
        const current = nextLimits.get(limitCode) || { value: "", isUnlimited: false };
        nextLimits.set(limitCode, { ...current, ...patch });
        return { ...v, limits: nextLimits };
      })
    );
  }

  const selectableCount = variants.filter((v) => v.selected && !existingCycles.has(v.cycle)).length;

  return (
    <div>
      <div className="mb-2 text-[13px] text-slate-600 dark:text-slate-400">
        Pick the billing cycles you want to sell this plan in. Each variant gets its own price and
        limits.
      </div>

      <div className="my-3">
        <div className="text-[11px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500 mb-2">
          Cycles
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {variants.map((v) => {
            const isExisting = existingCycles.has(v.cycle);
            return (
              <Tooltip
                key={v.cycle}
                title={isExisting ? "Already created — manage from the Variants tab" : ""}
              >
                <label
                  className={[
                    "inline-flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer text-[13px] transition-colors",
                    v.selected
                      ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-slate-900 dark:text-slate-100"
                      : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700",
                    isExisting ? "opacity-70 cursor-not-allowed" : "",
                  ].join(" ")}
                >
                  <Checkbox
                    checked={v.selected}
                    disabled={isExisting}
                    onChange={(e) => updateVariant(v.cycle, { selected: e.target.checked })}
                  />
                  <span className="font-mono text-[12px]">{v.cycle}</span>
                  {isExisting ? (
                    <Tag color="default" bordered={false} className="!text-[10.5px] !ml-1">
                      saved
                    </Tag>
                  ) : null}
                </label>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {selectableCount === 0 && (
        <Alert
          type="info"
          showIcon
          className="!my-4"
          message="No new variants selected"
          description={
            existingCycles.size > 0
              ? "All variants for this plan have been created. Save & finish to return to the plan page."
              : "Pick at least one cycle above to configure a variant."
          }
        />
      )}

      <div className="space-y-4 mt-4">
        {variants
          .filter((v) => v.selected && !existingCycles.has(v.cycle))
          .map((v) => (
            <VariantCard
              key={v.cycle}
              v={v}
              limitsCatalog={limitsCatalog}
              planName={planName}
              planCode={planCode}
              onUpdate={(patch) => updateVariant(v.cycle, patch)}
              onLimit={(limitCode, patch) => setVariantLimit(v.cycle, limitCode, patch)}
            />
          ))}
      </div>
    </div>
  );
}

function VariantCard({
  v,
  limitsCatalog,
  planName,
  planCode,
  onUpdate,
  onLimit,
}: {
  v: VariantConfig;
  limitsCatalog: PricingLimit[];
  planName: string;
  planCode: string;
  onUpdate: (patch: Partial<VariantConfig>) => void;
  onLimit: (
    limitCode: string,
    patch: Partial<{ value: string; isUnlimited: boolean }>
  ) => void;
}) {
  const variantCode = `${planCode}_${v.cycle}`;
  const variantName = `${planName} ${v.cycle.replace("_", " ").toLowerCase()}`;

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-[#0F1827]">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Tag bordered={false} className="!font-mono !text-[11px] !m-0" color="blue">
            {v.cycle}
          </Tag>
          <span className="text-[13px] text-slate-800 dark:text-slate-200 font-medium">
            {variantName}
          </span>
          <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {variantCode}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-slate-500 dark:text-slate-400">Active</span>
          <Switch
            size="small"
            checked={v.active}
            onChange={(checked) => onUpdate({ active: checked })}
          />
        </div>
      </div>

      <div className="p-4 grid grid-cols-3 gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500 mb-1">
            Base price
          </div>
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            value={v.basePrice}
            onChange={(val) => onUpdate({ basePrice: Number(val) || 0 })}
            className="!w-full"
            placeholder="0.00"
          />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500 mb-1">
            Currency
          </div>
          <AutoComplete
            value={v.currency}
            onChange={(val) => onUpdate({ currency: (val || "").toUpperCase() })}
            options={COMMON_CURRENCIES.map((c) => ({ value: c }))}
            placeholder="USD"
            className="!w-full"
          />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500 mb-1">
            Setup fee
          </div>
          <InputNumber
            min={0}
            step={0.01}
            precision={2}
            value={v.setupFee}
            onChange={(val) => onUpdate({ setupFee: Number(val) || 0 })}
            className="!w-full"
            placeholder="0.00"
          />
        </div>
      </div>

      {limitsCatalog.length > 0 && (
        <div className="px-4 pb-4">
          <div className="text-[11px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500 mb-2">
            Limits — leave blank to skip
          </div>
          <div className="border border-slate-200 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800/60">
            {limitsCatalog.map((l) => {
              const lv = v.limits.get(l.code) || { value: "", isUnlimited: false };
              return (
                <div
                  key={l.id}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-slate-800 dark:text-slate-200">
                      {l.name}
                      <span className="ml-1.5 font-mono text-[10.5px] text-slate-400 dark:text-slate-500">
                        {l.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      unit: <span className="font-mono">{l.unit}</span>
                    </div>
                  </div>
                  <Input
                    size="small"
                    value={lv.value}
                    disabled={lv.isUnlimited}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "");
                      onLimit(l.code, { value: val });
                    }}
                    placeholder={lv.isUnlimited ? "—" : "0"}
                    className="!max-w-[120px]"
                  />
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Switch
                      size="small"
                      checked={lv.isUnlimited}
                      onChange={(checked) => onLimit(l.code, { isUnlimited: checked })}
                    />
                    Unlimited
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function toPlanInput(info: PlanInfoState): PlanInput {
  return {
    code: info.code,
    name: info.name,
    description: info.description || null,
    displayOrder: info.displayOrder,
    status: info.status,
  };
}

function emptyVariantConfig(cycle: BillingCycle): VariantConfig {
  return {
    cycle,
    selected: false,
    active: true,
    currency: "USD",
    basePrice: 0,
    setupFee: 0,
    limits: new Map(),
  };
}
