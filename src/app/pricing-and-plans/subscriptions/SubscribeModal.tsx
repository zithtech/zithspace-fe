"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Modal,
  Form,
  Select,
  InputNumber,
  message,
} from "antd";
import { ExternalLink, AlertTriangle, Receipt, Coins, Package, User } from "lucide-react";
import { plansService, PricingPlan } from "@/services/pricing/plansService";
import {
  planVariantsService,
  PlanVariant,
  BillingCycle,
} from "@/services/pricing/planVariantsService";
import {
  planVariantPricesService,
  PlanVariantPrice,
} from "@/services/pricing/planVariantPricesService";
import { pricingTenantsService, PricingTenant } from "@/services/pricing/pricingTenantsService";
import { subscriptionsService } from "@/services/pricing/subscriptionsService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  mode: "new" | "change-plan";
  tenantId?: string; // when fixed (e.g. opened from a tenant page)
}

interface FormValues {
  tenantId: string;
  planId: string;
  planVariantId: string;
  currencyCode: string;
  // Percent values 0-100. Converted to absolute amounts at submit time.
  discountPercent: number;
  taxPercent: number;
}

// Matches a percentage 0–100 with up to 2 decimal places:
//   "0", "0.5", "12.34", "100", "100.00"
// Rejects: negative, >100, more than 2 decimals, anything non-numeric.
const PERCENT_REGEX = /^(?:100(?:\.0{1,2})?|\d{1,2}(?:\.\d{1,2})?)$/;

function validatePercent(v: any): Promise<void> {
  if (v === undefined || v === null || v === "") return Promise.resolve();
  const s = String(v);
  if (!PERCENT_REGEX.test(s)) {
    return Promise.reject("Must be 0–100 with up to 2 decimals");
  }
  return Promise.resolve();
}

const CYCLE_LABEL: Record<BillingCycle, string> = {
  MONTHLY: "per month",
  QUARTERLY: "per quarter",
  YEARLY: "per year",
  ONE_TIME: "one-time",
};

function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default function SubscribeModal({ open, onClose, onSaved, mode, tenantId }: Props) {
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [tenants, setTenants] = useState<PricingTenant[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [variants, setVariants] = useState<PlanVariant[]>([]);
  const [prices, setPrices] = useState<PlanVariantPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);

  const planIdWatch = Form.useWatch("planId", form);
  const variantIdWatch = Form.useWatch("planVariantId", form);
  const currencyWatch = Form.useWatch("currencyCode", form);
  const discountPctWatch = Form.useWatch("discountPercent", form);
  const taxPctWatch = Form.useWatch("taxPercent", form);

  // ---- Load lookups on open ----
  useEffect(() => {
    if (!open) return;
    Promise.all([
      tenantId
        ? Promise.resolve(null)
        : pricingTenantsService.list({ limit: 500, isActive: true }),
      plansService.list({ limit: 200, status: "active" }),
    ])
      .then(([t, p]) => {
        if (t) setTenants(t.data);
        setPlans(p.data);
      })
      .catch((e) => message.error(e?.message || "Failed to load lookups"));
    form.resetFields();
    form.setFieldsValue({
      tenantId,
      currencyCode: undefined, // picked by user after seeing available currencies
      discountPercent: 0,
      taxPercent: 0,
    } as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ---- Load variants when plan changes ----
  useEffect(() => {
    if (!planIdWatch) {
      setVariants([]);
      form.setFieldValue("planVariantId", undefined);
      form.setFieldValue("currencyCode", undefined);
      return;
    }
    planVariantsService
      .list({ planId: planIdWatch, limit: 200, status: "active" })
      .then((r) => setVariants(r.data))
      .catch((e) => message.error(e?.message || "Failed to load variants"));
    form.setFieldValue("planVariantId", undefined);
    form.setFieldValue("currencyCode", undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planIdWatch]);

  // ---- Load prices when variant changes ----
  useEffect(() => {
    if (!variantIdWatch) {
      setPrices([]);
      form.setFieldValue("currencyCode", undefined);
      return;
    }
    setPricesLoading(true);
    planVariantPricesService
      .list({ planVariantId: variantIdWatch, limit: 50, status: "active" })
      .then((r) => {
        setPrices(r.data);
        // Auto-pick a default currency: USD if present, otherwise first available
        if (r.data.length > 0) {
          const usd = r.data.find((p) => p.currencyCode === "USD");
          const next = usd?.currencyCode || r.data[0].currencyCode;
          form.setFieldValue("currencyCode", next);
        } else {
          form.setFieldValue("currencyCode", undefined);
        }
      })
      .catch((e) => message.error(e?.message || "Failed to load prices"))
      .finally(() => setPricesLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantIdWatch]);

  const matchingPrice = useMemo(
    () => prices.find((p) => p.currencyCode === currencyWatch),
    [prices, currencyWatch]
  );

  const selectedVariant = useMemo(
    () => variants.find((v) => v.id === variantIdWatch),
    [variants, variantIdWatch]
  );

  // Convert percentage form values to absolute money amounts.
  // Convention: discount is taken off the base first, then tax is applied to the post-discount amount.
  const computed = useMemo(() => {
    if (!matchingPrice) return null;
    const base = matchingPrice.basePrice;
    const discountPct = clampPercent(discountPctWatch);
    const taxPct = clampPercent(taxPctWatch);
    const discountAmount = round2(base * (discountPct / 100));
    const taxableBase = Math.max(0, base - discountAmount);
    const taxAmount = round2(taxableBase * (taxPct / 100));
    const finalAmount = Math.max(0, round2(base - discountAmount + taxAmount));
    return { discountPct, taxPct, discountAmount, taxAmount, finalAmount };
  }, [matchingPrice, discountPctWatch, taxPctWatch]);

  async function submit() {
    try {
      const v = await form.validateFields();
      if (!matchingPrice || !computed) {
        message.error(
          "Pick a currency that has an active price for the selected variant"
        );
        return;
      }
      setSaving(true);
      // BE accepts absolute amounts. Percentages are FE-only.
      const payload = {
        tenantId: tenantId || v.tenantId,
        planVariantId: v.planVariantId,
        currencyCode: v.currencyCode,
        discountAmount: computed.discountAmount,
        taxAmount: computed.taxAmount,
      };
      if (mode === "change-plan") {
        await subscriptionsService.changePlan(payload);
        message.success("Plan changed. Old subscription canceled and new one created.");
      } else {
        await subscriptionsService.create(payload);
        message.success("Subscription created.");
      }
      onSaved();
      onClose();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.message || "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText={mode === "change-plan" ? "Change plan" : "Create subscription"}
      confirmLoading={saving}
      okButtonProps={{ disabled: !matchingPrice }}
      title={
        <div>
          <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            {mode === "change-plan" ? "Change tenant plan" : "New subscription"}
          </div>
          <div className="mt-0.5 text-[12px] font-normal text-slate-500 dark:text-slate-400">
            {mode === "change-plan"
              ? "The current subscription is canceled and a new one is created with a fresh feature snapshot."
              : "Pick a plan + variant + currency. Features and limits are snapshotted at this moment."}
          </div>
        </div>
      }
      destroyOnClose
      width={680}
    >
      <Form form={form} layout="vertical" requiredMark="optional" preserve={false}>
        {/* ──────── Tenant ──────── */}
        {!tenantId ? (
          <Section icon={<User size={13} />} label="Tenant">
            <Form.Item
              name="tenantId"
              rules={[{ required: true, message: "Tenant is required" }]}
              className="!mb-0"
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select a tenant"
                options={tenants.map((t) => ({
                  value: t.id,
                  label: (
                    <span>
                      {t.name}
                      <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {t.subdomain}
                      </span>
                    </span>
                  ),
                }))}
              />
            </Form.Item>
          </Section>
        ) : null}

        {/* ──────── Plan + Variant ──────── */}
        <Section icon={<Package size={13} />} label="Plan & variant">
          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              label="Plan"
              name="planId"
              rules={[{ required: true, message: "Plan is required" }]}
              className="!mb-0"
            >
              <Select
                showSearch
                optionFilterProp="label"
                options={plans.map((p) => ({
                  value: p.id,
                  label: (
                    <span>
                      {p.name}
                      <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {p.code}
                      </span>
                    </span>
                  ),
                }))}
                placeholder="Select a plan"
              />
            </Form.Item>
            <Form.Item
              label="Variant"
              name="planVariantId"
              rules={[{ required: true, message: "Variant is required" }]}
              className="!mb-0"
            >
              <Select
                disabled={!planIdWatch}
                showSearch
                optionFilterProp="label"
                options={variants.map((v) => ({
                  value: v.id,
                  label: (
                    <span>
                      {v.name}
                      <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                        {v.billingCycle}
                      </span>
                    </span>
                  ),
                }))}
                placeholder={planIdWatch ? "Select a variant" : "Pick a plan first"}
              />
            </Form.Item>
          </div>
        </Section>

        {/* ──────── Pricing ──────── */}
        {variantIdWatch ? (
          <Section icon={<Coins size={13} />} label="Pricing">
            {pricesLoading ? (
              <div className="text-[12.5px] text-slate-500 dark:text-slate-400">
                Loading prices…
              </div>
            ) : prices.length === 0 ? (
              <NoPricesState planId={planIdWatch} />
            ) : (
              <>
                {/* Currency chips */}
                <Form.Item name="currencyCode" hidden>
                  <input type="hidden" />
                </Form.Item>
                <div className="mb-2.5">
                  <div className="text-[11px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500 mb-1.5">
                    Currency
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {prices.map((p) => {
                      const active = p.currencyCode === currencyWatch;
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => form.setFieldValue("currencyCode", p.currencyCode)}
                          className={[
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[12px] font-medium font-mono transition-colors",
                            active
                              ? "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1827] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700",
                          ].join(" ")}
                        >
                          {p.currencyCode}
                          <span className="text-[10.5px] text-slate-400 dark:text-slate-500">
                            {p.basePrice.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Resolved price card */}
                {matchingPrice && selectedVariant ? (
                  <PriceCard price={matchingPrice} cycle={selectedVariant.billingCycle} />
                ) : (
                  <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 text-[12.5px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>Pick a currency above to see the resolved price.</span>
                  </div>
                )}
              </>
            )}
          </Section>
        ) : null}

        {/* ──────── Adjustments ──────── */}
        {matchingPrice && computed ? (
          <Section icon={<Receipt size={13} />} label="Adjustments">
            <div className="grid grid-cols-2 gap-3">
              <Form.Item
                label="Discount"
                name="discountPercent"
                initialValue={0}
                className="!mb-0"
                tooltip="Percent off the base price. Validated 0–100 with up to 2 decimals."
                rules={[{ validator: (_, v) => validatePercent(v) }]}
              >
                <PercentInput placeholder="0" />
              </Form.Item>
              <Form.Item
                label="Tax"
                name="taxPercent"
                initialValue={0}
                className="!mb-0"
                tooltip="Tax rate applied to the post-discount amount. Validated 0–100 with up to 2 decimals."
                rules={[{ validator: (_, v) => validatePercent(v) }]}
              >
                <PercentInput placeholder="0" />
              </Form.Item>
            </div>

            {/* Final amount summary */}
            <FinalSummary
              base={matchingPrice.basePrice}
              setupFee={matchingPrice.setupFee}
              discountPct={computed.discountPct}
              discountAmount={computed.discountAmount}
              taxPct={computed.taxPct}
              taxAmount={computed.taxAmount}
              final={computed.finalAmount}
              currency={matchingPrice.currencyCode}
              cycle={selectedVariant?.billingCycle as BillingCycle}
            />
          </Section>
        ) : null}
      </Form>
    </Modal>
  );
}

// ============================================================
// Visual atoms
// ============================================================

function Section({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
        <span className="text-slate-400 dark:text-slate-500">{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

function PriceCard({
  price,
  cycle,
}: {
  price: PlanVariantPrice;
  cycle: BillingCycle;
}) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/40 dark:to-[#0F1827] p-4">
      <div className="flex items-baseline gap-2">
        <div className="text-[32px] font-semibold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">
          {formatMoney(price.basePrice, price.currencyCode)}
        </div>
        <div className="text-[13px] text-slate-500 dark:text-slate-400">
          {CYCLE_LABEL[cycle] || cycle.toLowerCase()}
        </div>
      </div>
      {price.setupFee > 0 ? (
        <div className="mt-1 text-[12px] text-slate-500 dark:text-slate-400">
          plus one-time setup fee{" "}
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {formatMoney(price.setupFee, price.currencyCode)}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function NoPricesState({ planId }: { planId?: string }) {
  return (
    <div className="border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          size={16}
          className="mt-0.5 text-amber-600 dark:text-amber-500 shrink-0"
        />
        <div className="flex-1">
          <div className="text-[13px] font-medium text-amber-900 dark:text-amber-200">
            This variant has no prices yet
          </div>
          <div className="mt-1 text-[12.5px] text-amber-800 dark:text-amber-300">
            Add at least one price for this variant before subscribing a tenant.
          </div>
          {planId ? (
            <Link
              href={`/pricing-and-plans/plans/${planId}`}
              target="_blank"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-amber-900 dark:text-amber-200 underline underline-offset-2"
            >
              Open Prices tab <ExternalLink size={11} />
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FinalSummary({
  base,
  setupFee,
  discountPct,
  discountAmount,
  taxPct,
  taxAmount,
  final,
  currency,
  cycle,
}: {
  base: number;
  setupFee: number;
  discountPct: number;
  discountAmount: number;
  taxPct: number;
  taxAmount: number;
  final: number;
  currency: string;
  cycle?: BillingCycle;
}) {
  const hasAdjustments = discountAmount > 0 || taxAmount > 0;
  const cycleLabel = cycle ? CYCLE_LABEL[cycle] || cycle.toLowerCase() : "per cycle";
  return (
    <div className="mt-3 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
      <div className="space-y-1 text-[12.5px]">
        <SummaryRow label={`Base price (${cycleLabel})`} value={formatMoney(base, currency)} />
        {discountAmount > 0 ? (
          <SummaryRow
            label={
              <span>
                Discount{" "}
                <span className="text-slate-400 dark:text-slate-500 font-mono">
                  ({discountPct}%)
                </span>
              </span>
            }
            value={`− ${formatMoney(discountAmount, currency)}`}
            valueClass="text-rose-600 dark:text-rose-400"
          />
        ) : null}
        {taxAmount > 0 ? (
          <SummaryRow
            label={
              <span>
                Tax{" "}
                <span className="text-slate-400 dark:text-slate-500 font-mono">
                  ({taxPct}% of post-discount)
                </span>
              </span>
            }
            value={`+ ${formatMoney(taxAmount, currency)}`}
          />
        ) : null}
        {!hasAdjustments ? null : (
          <div className="border-t border-slate-200 dark:border-slate-800 my-1" />
        )}
        <SummaryRow
          label={
            <span className="font-medium text-slate-700 dark:text-slate-300">
              Final {cycleLabel}
            </span>
          }
          value={
            <span className="text-[15px] font-semibold tabular-nums text-slate-900 dark:text-slate-100">
              {formatMoney(final, currency)}
            </span>
          }
        />
      </div>
      {setupFee > 0 ? (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11.5px] text-slate-500 dark:text-slate-400">
          One-time setup fee of{" "}
          <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
            {formatMoney(setupFee, currency)}
          </span>{" "}
          billed once on first invoice.
        </div>
      ) : null}
    </div>
  );
}

// Percent input — renders the value as "10%" in the field, parses back to a number.
function PercentInput(props: {
  value?: number;
  onChange?: (v: number | null) => void;
  placeholder?: string;
}) {
  return (
    <InputNumber
      value={props.value}
      onChange={(v) => props.onChange?.(v === null || v === undefined ? null : Number(v))}
      min={0}
      max={100}
      step={1}
      precision={2}
      formatter={(v) =>
        v === undefined || v === null || v === "" ? "" : `${v}%`
      }
      parser={(v) => {
        if (!v) return 0 as unknown as number;
        // Strip everything that's not a digit or dot, then clamp 0..100
        const cleaned = String(v).replace(/[^\d.]/g, "");
        const n = Number(cleaned);
        if (!Number.isFinite(n)) return 0 as unknown as number;
        return Math.max(0, Math.min(100, n)) as unknown as number;
      }}
      className="!w-full"
      placeholder={props.placeholder}
    />
  );
}

// ============================================================
// Math helpers
// ============================================================
function clampPercent(v: any): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > 100) return 100;
  return n;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function SummaryRow({
  label,
  value,
  valueClass,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`tabular-nums font-mono ${valueClass || "text-slate-700 dark:text-slate-300"}`}>
        {value}
      </span>
    </div>
  );
}
