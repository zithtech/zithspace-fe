"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Tabs,
  Button,
  Spin,
  Dropdown,
  Modal,
  Form,
  Input,
  InputNumber,
  Segmented,
  App,
  message,
} from "antd";
import {
  ArrowLeft,
  Pencil,
  MoreHorizontal,
  Archive,
  RotateCcw,
  Trash2,
  Layers,
  Package,
  ToggleRight,
  Gauge,
  CircleDot,
} from "lucide-react";
import {
  plansService,
  PricingPlan,
  PlanInput,
} from "@/services/pricing/plansService";
import { planVariantsService } from "@/services/pricing/planVariantsService";
import { planFeaturesService } from "@/services/pricing/planFeaturesService";
import { planVariantPricesService } from "@/services/pricing/planVariantPricesService";
import { planLimitsService } from "@/services/pricing/planLimitsService";

import PlanVariantsTab from "./variants/PlanVariantsTab";
import PlanPricesTab from "./prices/PlanPricesTab";
import PlanFeaturesTab from "./features/PlanFeaturesTab";
import PlanLimitsTab from "./limits/PlanLimitsTab";

// ============================================================
// Page
// ============================================================
export default function PlanDetailPage() {
  const { modal } = App.useApp();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  const [plan, setPlan] = useState<PricingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("features");

  // Stats — refetched alongside the plan so the hero + tabs stay in sync
  const [variantCount, setVariantCount] = useState<number | null>(null);
  const [featureCount, setFeatureCount] = useState<number | null>(null);
  const [priceCount, setPriceCount] = useState<number | null>(null);
  const [limitCount, setLimitCount] = useState<number | null>(null);

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm<Omit<PlanInput, "code">>();
  const [editSaving, setEditSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const p = await plansService.get(id);
      setPlan(p);
      loadStats(id);
    } catch (e: any) {
      message.error(e?.message || "Failed to load plan");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(planId: string) {
    try {
      const [variants, features, prices, limits] = await Promise.all([
        planVariantsService.list({ planId, limit: 200 }),
        planFeaturesService.list({ planId }),
        planVariantPricesService.list({ planId, limit: 200 }),
        planLimitsService.list({ planId }),
      ]);
      setVariantCount(variants.pagination.total);
      setFeatureCount(features.length);
      setPriceCount(prices.pagination.total);
      setLimitCount(limits.length);
    } catch {
      // Silent — stats are non-critical
    }
  }

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function openEdit() {
    if (!plan) return;
    editForm.setFieldsValue({
      name: plan.name,
      description: plan.description ?? "",
      displayOrder: plan.displayOrder,
      status: plan.status,
    });
    setEditOpen(true);
  }

  async function submitEdit() {
    if (!plan) return;
    try {
      const v = await editForm.validateFields();
      setEditSaving(true);
      await plansService.update(plan.id, v);
      message.success("Plan updated");
      setEditOpen(false);
      load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Save failed");
    } finally {
      setEditSaving(false);
    }
  }

  async function onArchiveOrRestore() {
    if (!plan) return;
    const archiving = plan.status === "active";
    try {
      if (archiving) await plansService.archive(plan.id);
      else await plansService.restore(plan.id);
      message.success(archiving ? "Plan archived" : "Plan restored");
      load();
    } catch (e: any) {
      message.error(e?.message || "Action failed");
    }
  }

  function onDelete() {
    if (!plan) return;
    modal.confirm({
      title: "Delete plan?",
      content: (
        <span>
          <span className="font-medium">{plan.name}</span> will be permanently removed.
          This fails if any variants exist — archive first.
        </span>
      ),
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await plansService.remove(plan.id);
          message.success("Plan deleted");
          router.push("/pricing-and-plans/plans");
        } catch (e: any) {
          message.error(e?.message || "Delete failed");
        }
      },
    });
  }

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="px-8 py-14 flex justify-center">
        <Spin />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="px-8 py-12">
        <Link
          href="/pricing-and-plans/plans"
          className="inline-flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft size={14} /> Back to plans
        </Link>
        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">Plan not found.</div>
      </div>
    );
  }

  const isArchived = plan.status === "archived";

  return (
    <div className="px-8 py-7 max-w-[1280px]">
      {/* Breadcrumb */}
      <Link
        href="/pricing-and-plans/plans"
        className="inline-flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <ArrowLeft size={12} /> Plans
      </Link>

      {/* ──────── Hero ──────── */}
      <div className="mt-3 flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[26px] leading-tight font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {plan.name}
            </h1>
            <StatusPill status={plan.status} />
          </div>
          <div className="mt-2 flex items-center gap-2.5 text-[12px] text-slate-500 dark:text-slate-400 flex-wrap">
            <CodeChip code={plan.code} />
            <MetaDot />
            <span>
              Display order <span className="font-mono">{plan.displayOrder}</span>
            </span>
            <MetaDot />
            <span>Updated {formatDate(plan.updatedAt)}</span>
            <MetaDot />
            <span>Created {formatDate(plan.createdAt)}</span>
          </div>
          {plan.description ? (
            <p className="mt-3.5 text-[13.5px] text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {plan.description}
            </p>
          ) : (
            <p className="mt-3.5 text-[12.5px] italic text-slate-400 dark:text-slate-500">
              No description.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="primary"
            icon={<Pencil size={14} />}
            onClick={openEdit}
            className="!flex !items-center !gap-1.5"
          >
            Edit plan
          </Button>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                isArchived
                  ? {
                      key: "restore",
                      label: (
                        <span className="flex items-center gap-2">
                          <RotateCcw size={14} /> Restore
                        </span>
                      ),
                      onClick: onArchiveOrRestore,
                    }
                  : {
                      key: "archive",
                      label: (
                        <span className="flex items-center gap-2">
                          <Archive size={14} /> Archive
                        </span>
                      ),
                      onClick: onArchiveOrRestore,
                    },
                { type: "divider" as const },
                {
                  key: "delete",
                  danger: true,
                  label: (
                    <span className="flex items-center gap-2">
                      <Trash2 size={14} /> Delete plan…
                    </span>
                  ),
                  onClick: onDelete,
                },
              ],
            }}
          >
            <Button icon={<MoreHorizontal size={16} />} />
          </Dropdown>
        </div>
      </div>

      {/* ──────── Stats row ──────── */}
      <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={<ToggleRight size={16} />}
          label="Features mapped"
          value={featureCount}
          accent="blue"
        />
        <StatCard
          icon={<Package size={16} />}
          label="Variants"
          value={variantCount}
          accent="violet"
        />
        <StatCard
          icon={<Layers size={16} />}
          label="Prices"
          value={priceCount}
          accent="amber"
          sub="across all variants"
        />
        <StatCard
          icon={<Gauge size={16} />}
          label="Limits"
          value={limitCount}
          accent="emerald"
          sub="assigned to variants"
        />
      </div>

      {/* ──────── Tabs ──────── */}
      <div className="mt-7 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#131B2D]">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="!px-5 plan-detail-tabs"
          // Order matches the recommended build flow: features first (plan-wide),
          // then variants, then per-variant pricing and limits.
          items={[
            {
              key: "features",
              label: (
                <TabLabel
                  icon={<ToggleRight size={14} />}
                  text="Features"
                  count={featureCount}
                />
              ),
              children: <PlanFeaturesTab planId={plan.id} />,
            },
            {
              key: "variants",
              label: (
                <TabLabel
                  icon={<Package size={14} />}
                  text="Variants"
                  count={variantCount}
                />
              ),
              children: <PlanVariantsTab planId={plan.id} planCode={plan.code} />,
            },
            {
              key: "prices",
              label: (
                <TabLabel icon={<Layers size={14} />} text="Prices" count={priceCount} />
              ),
              children: <PlanPricesTab planId={plan.id} />,
            },
            {
              key: "limits",
              label: <TabLabel icon={<Gauge size={14} />} text="Limits" count={limitCount} />,
              children: <PlanLimitsTab planId={plan.id} />,
            },
          ]}
        />
      </div>

      {/* ──────── Edit modal ──────── */}
      <Modal
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={submitEdit}
        okText="Save changes"
        confirmLoading={editSaving}
        title={
          <div>
            <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
              Edit plan
            </div>
            <div className="mt-0.5 text-[12px] font-normal text-slate-500 dark:text-slate-400">
              Code <span className="font-mono">{plan.code}</span> is locked once the plan exists.
            </div>
          </div>
        }
        destroyOnClose
        width={560}
      >
        <Form form={editForm} layout="vertical" requiredMark="optional" preserve={false}>
          <Form.Item label="Name" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="What this plan is for, who it targets." />
          </Form.Item>
          <div className="grid grid-cols-2 gap-3">
            <Form.Item label="Display order" name="displayOrder">
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
            <Form.Item label="Status" name="status">
              <Segmented
                options={[
                  { label: "Active", value: "active" },
                  { label: "Archived", value: "archived" },
                ]}
              />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}

// ============================================================
// Visual atoms
// ============================================================

function MetaDot() {
  return <span className="text-slate-300 dark:text-slate-700">·</span>;
}

function CodeChip({ code }: { code: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 font-mono text-[11px] text-slate-700 dark:text-slate-300">
      {code}
    </span>
  );
}

function StatusPill({ status }: { status: "active" | "archived" }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 text-[11.5px] font-medium text-emerald-700 dark:text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-[11.5px] font-medium text-slate-600 dark:text-slate-400">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
      Archived
    </span>
  );
}

type Accent = "blue" | "violet" | "amber" | "emerald";
const ACCENT_TEXT: Record<Accent, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
};
const ACCENT_BG: Record<Accent, string> = {
  blue: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50",
  violet: "bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/50",
  amber: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50",
  emerald: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50",
};

function StatCard({
  icon,
  label,
  value,
  sub,
  accent = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string | null;
  sub?: string;
  accent?: Accent;
}) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#131B2D] p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div
          className={`w-7 h-7 rounded-md flex items-center justify-center border ${ACCENT_BG[accent]} ${ACCENT_TEXT[accent]}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-2 text-[22px] font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value === null ? "—" : value}
      </div>
      {sub ? (
        <div className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400">{sub}</div>
      ) : null}
    </div>
  );
}

function TabLabel({
  icon,
  text,
  count,
}: {
  icon: React.ReactNode;
  text: string;
  count?: number | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="opacity-70">{icon}</span>
      <span>{text}</span>
      {typeof count === "number" ? (
        <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10.5px] font-medium text-slate-600 dark:text-slate-400 tabular-nums">
          {count}
        </span>
      ) : null}
    </span>
  );
}

function formatDate(d: string | Date): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
