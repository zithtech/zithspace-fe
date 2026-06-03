"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Spin, Tag, Empty, Button, Modal, message } from "antd";
import { X } from "lucide-react";
import {
  subscriptionsService,
  Subscription,
  SubscriptionDetail,
  SubscriptionStatus,
  SUBSCRIPTION_ACTIVE_STATUSES,
} from "@/services/pricing/subscriptionsService";

interface Props {
  tenantId: string;
  reloadKey?: number;
}

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  pending: "default",
  trialing: "blue",
  active: "green",
  past_due: "orange",
  canceled: "default",
  expired: "default",
};

function formatAmount(amount: number, currency: string): string {
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

function formatLimitValue(value: string): string {
  if (value === "UNLIMITED") return "Unlimited";
  if (/^\d+$/.test(value)) return Number(value).toLocaleString("en-US");
  return value;
}

export default function SubscriptionTab({ tenantId, reloadKey = 0 }: Props) {
  const [list, setList] = useState<Subscription[]>([]);
  const [detail, setDetail] = useState<SubscriptionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await subscriptionsService.list({ tenantId, limit: 50 });
      setList(res.data);
      // Active sub = first one in pending/trialing/active/past_due (UNIQUE index guarantees ≤ 1)
      const active = res.data.find((s) => SUBSCRIPTION_ACTIVE_STATUSES.has(s.status));
      if (active) {
        const d = await subscriptionsService.get(active.id);
        setDetail(d);
      } else {
        setDetail(null);
      }
    } catch (e: any) {
      message.error(e?.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, reloadKey]);

  const history = useMemo(
    () => list.filter((s) => !SUBSCRIPTION_ACTIVE_STATUSES.has(s.status)),
    [list]
  );

  function onCancel() {
    if (!detail) return;
    Modal.confirm({
      title: "Cancel subscription?",
      content: `Tenant will be moved to canceled status. The row stays for audit. They will need a new subscription to access features.`,
      okText: "Cancel subscription",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await subscriptionsService.cancel(detail.id);
          message.success("Subscription canceled");
          load();
        } catch (e: any) {
          message.error(e?.message || "Cancel failed");
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Spin />
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
          Active subscription
        </div>
        {!detail ? (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center">
            <Empty description="No active subscription. Click Change plan to subscribe." />
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                      {detail.planName} — {detail.variantName}
                    </span>
                    <Tag color={STATUS_COLORS[detail.status]} bordered={false}>
                      {detail.status}
                    </Tag>
                  </div>
                  <div className="mt-0.5 font-mono text-[11.5px] text-slate-400 dark:text-slate-500">
                    {detail.variantCode} · {detail.billingCycle}
                  </div>
                </div>
                <Button danger size="small" icon={<X size={13} />} onClick={onCancel}>
                  Cancel
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Amount</div>
                  <div className="mt-1 text-[15px] font-semibold text-slate-900 dark:text-slate-100 font-mono">
                    {formatAmount(detail.finalAmount, detail.currencyCode)}
                  </div>
                  {detail.discountAmount > 0 || detail.taxAmount > 0 ? (
                    <div className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                      base {formatAmount(detail.amount, detail.currencyCode)}
                      {detail.discountAmount > 0
                        ? ` − ${formatAmount(detail.discountAmount, detail.currencyCode)}`
                        : ""}
                      {detail.taxAmount > 0
                        ? ` + ${formatAmount(detail.taxAmount, detail.currencyCode)}`
                        : ""}
                    </div>
                  ) : null}
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Started</div>
                  <div className="mt-1 text-[13.5px] text-slate-700 dark:text-slate-300">
                    {new Date(detail.startsAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Ends</div>
                  <div className="mt-1 text-[13.5px] text-slate-700 dark:text-slate-300">
                    {detail.endsAt ? new Date(detail.endsAt).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800">
              <div className="p-5">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Entitled features
                  <span className="ml-1.5 text-slate-500 dark:text-slate-400">({detail.features.length})</span>
                </div>
                {detail.features.length === 0 ? (
                  <div className="text-[12.5px] text-slate-400 dark:text-slate-500">— no features —</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {detail.features.map((f) => (
                      <Tag
                        key={f.id}
                        bordered={false}
                        color={f.featureId ? "default" : "default"}
                        className="!font-mono !text-[11px]"
                      >
                        {f.featureCode}
                        {!f.featureId ? (
                          <span className="ml-1 text-orange-500" title="Catalog row deleted since snapshot">
                            ⚠
                          </span>
                        ) : null}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                  Limits
                  <span className="ml-1.5 text-slate-500 dark:text-slate-400">({detail.limits.length})</span>
                </div>
                {detail.limits.length === 0 ? (
                  <div className="text-[12.5px] text-slate-400 dark:text-slate-500">— no limits —</div>
                ) : (
                  <table className="w-full">
                    <tbody>
                      {detail.limits.map((l) => (
                        <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                          <td className="py-1.5 pr-2">
                            <div className="font-mono text-[11.5px] text-slate-700 dark:text-slate-300">
                              {l.limitCode}
                              {!l.limitId ? (
                                <span className="ml-1 text-orange-500" title="Catalog row deleted since snapshot">
                                  ⚠
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="py-1.5 text-right">
                            <span className="font-mono text-[12.5px] text-slate-900 dark:text-slate-100">
                              {formatLimitValue(l.limitValue)}
                            </span>
                            {l.limitUnit ? (
                              <span className="ml-1 text-[11px] text-slate-400 dark:text-slate-500">{l.limitUnit}</span>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="px-5 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Snapshot taken at{" "}
                {detail.features[0]?.snapshottedAt
                  ? new Date(detail.features[0].snapshottedAt).toLocaleString()
                  : new Date(detail.createdAt).toLocaleString()}
                . Plan catalog edits do not affect this subscription.
              </div>
            </div>
          </div>
        )}
      </div>

      {history.length > 0 ? (
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 px-1">
            History
            <span className="ml-1.5 text-slate-500 dark:text-slate-400 normal-case font-normal">({history.length})</span>
          </div>
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2">Variant</th>
                  <th className="text-left px-4 py-2">Status</th>
                  <th className="text-right px-4 py-2">Amount</th>
                  <th className="text-left px-4 py-2">Started</th>
                  <th className="text-left px-4 py-2">Ended</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 dark:border-slate-800/60">
                    <td className="px-4 py-2">
                      <div className="text-slate-800 dark:text-slate-200">{s.variantName}</div>
                      <div className="font-mono text-[10.5px] text-slate-400 dark:text-slate-500">{s.variantCode}</div>
                    </td>
                    <td className="px-4 py-2">
                      <Tag color={STATUS_COLORS[s.status]} bordered={false}>
                        {s.status}
                      </Tag>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-slate-800 dark:text-slate-200">
                      {formatAmount(s.finalAmount, s.currencyCode)}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                      {new Date(s.startsAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                      {s.endsAt ? new Date(s.endsAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
