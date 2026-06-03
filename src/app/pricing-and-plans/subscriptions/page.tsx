"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  Button,
  Input,
  Tag,
  Select,
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { Plus, Search, ChevronRight } from "lucide-react";
import {
  subscriptionsService,
  Subscription,
  SubscriptionStatus,
  SUBSCRIPTION_STATUSES,
} from "@/services/pricing/subscriptionsService";
import SubscribeModal from "./SubscribeModal";

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

export default function SubscriptionsPage() {
  const [rows, setRows] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await subscriptionsService.list({
        page,
        limit: pageSize,
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setRows(res.data);
      setTotal(res.pagination.total);
    } catch (e: any) {
      message.error(e?.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns: ColumnsType<Subscription> = useMemo(
    () => [
      {
        title: "Tenant",
        width: 280,
        render: (_: any, row) => (
          <Link
            href={`/pricing-and-plans/subscriptions/${row.tenantId}`}
            className="inline-flex items-center gap-1 group"
          >
            <span>
              <span className="text-slate-900 dark:text-slate-100 font-medium">{row.tenantName || row.tenantId}</span>
              {row.tenantSubdomain ? (
                <span className="ml-1.5 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                  {row.tenantSubdomain}
                </span>
              ) : null}
            </span>
            <ChevronRight
              size={14}
              className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors"
            />
          </Link>
        ),
      },
      {
        title: "Plan / Variant",
        width: 280,
        render: (_: any, row) => (
          <div>
            <div className="text-[13px] text-slate-800 dark:text-slate-200">
              {row.planName} <span className="text-slate-400 dark:text-slate-500">·</span> {row.variantName}
            </div>
            <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
              {row.variantCode} · {row.billingCycle}
            </div>
          </div>
        ),
      },
      {
        title: "Amount",
        width: 160,
        align: "right" as const,
        render: (_: any, row) => (
          <div>
            <div className="font-mono text-[12.5px] text-slate-900 dark:text-slate-100">
              {formatAmount(row.finalAmount, row.currencyCode)}
            </div>
            {row.discountAmount > 0 || row.taxAmount > 0 ? (
              <div className="text-[11px] text-slate-400 dark:text-slate-500">
                base {formatAmount(row.amount, row.currencyCode)}
                {row.discountAmount > 0 ? ` − ${formatAmount(row.discountAmount, row.currencyCode)}` : ""}
                {row.taxAmount > 0 ? ` + ${formatAmount(row.taxAmount, row.currencyCode)}` : ""}
              </div>
            ) : null}
          </div>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        width: 120,
        render: (v: SubscriptionStatus) => (
          <Tag color={STATUS_COLORS[v]} bordered={false}>
            {v}
          </Tag>
        ),
      },
      {
        title: "Started",
        dataIndex: "startsAt",
        width: 130,
        render: (v: string) =>
          v ? (
            <span className="text-[12.5px] text-slate-600 dark:text-slate-400">
              {new Date(v).toLocaleDateString()}
            </span>
          ) : null,
      },
      {
        title: "Ends",
        dataIndex: "endsAt",
        width: 130,
        render: (v: string | null) =>
          v ? (
            <span className="text-[12.5px] text-slate-600 dark:text-slate-400">
              {new Date(v).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          ),
      },
    ],
    []
  );

  return (
    <div className="px-8 py-7">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Subscriptions</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tenant subscriptions. Plan changes append a new row; old rows stay for audit.
          </p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={15} />}
          onClick={() => setModalOpen(true)}
          className="!flex !items-center !gap-1"
        >
          New subscription
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            allowClear
            prefix={<Search size={14} className="text-slate-400 dark:text-slate-500" />}
            placeholder="Search tenant or variant"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!max-w-xs"
          />
          <Select
            allowClear
            value={statusFilter}
            onChange={(v) => {
              setPage(1);
              setStatusFilter(v);
            }}
            placeholder="All statuses"
            options={SUBSCRIPTION_STATUSES.map((s) => ({ value: s, label: s }))}
            className="!min-w-[160px]"
          />
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#131B2D] overflow-hidden">
        <Table<Subscription>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          size="middle"
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          locale={{ emptyText: <Empty description="No subscriptions yet" /> }}
        />
      </div>

      <SubscribeModal
        open={modalOpen}
        mode="new"
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}
