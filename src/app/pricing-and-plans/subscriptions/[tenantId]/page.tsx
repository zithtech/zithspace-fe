"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Tabs, Spin, Button, Tag, message } from "antd";
import { ArrowLeft, Repeat } from "lucide-react";
import { pricingTenantsService, PricingTenant } from "@/services/pricing/pricingTenantsService";
import SubscriptionTab from "./subscription/SubscriptionTab";
import TenantAddonsTab from "./addons/TenantAddonsTab";
import OverridesTab from "./overrides/OverridesTab";
import SubscribeModal from "../SubscribeModal";

const PLACEHOLDER_TAB = (title: string, hint: string) => (
  <div className="py-12 px-6 text-center">
    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</div>
    <div className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">{hint}</div>
  </div>
);

export default function TenantSubscriptionDetailPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params?.tenantId as string;

  const [tenant, setTenant] = useState<PricingTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("subscription");
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const t = await pricingTenantsService.get(tenantId);
      setTenant(t);
    } catch (e: any) {
      message.error(e?.message || "Failed to load tenant");
      setTenant(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tenantId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  if (loading) {
    return (
      <div className="px-8 py-12 flex justify-center">
        <Spin />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="px-8 py-12">
        <Link
          href="/pricing-and-plans/subscriptions"
          className="inline-flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <ArrowLeft size={14} /> Back to subscriptions
        </Link>
        <div className="mt-6 text-sm text-slate-600 dark:text-slate-400">Tenant not found.</div>
      </div>
    );
  }

  return (
    <div className="px-8 py-7">
      <Link
        href="/pricing-and-plans/subscriptions"
        className="inline-flex items-center gap-1 text-[12.5px] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
      >
        <ArrowLeft size={13} /> Back to subscriptions
      </Link>

      <div className="mt-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{tenant.name}</h1>
            <span className="font-mono text-[12.5px] text-slate-400 dark:text-slate-500">{tenant.subdomain}</span>
            {!tenant.isActive && <Tag color="default" bordered={false}>inactive</Tag>}
            {tenant.isTrial && <Tag color="blue" bordered={false}>trial</Tag>}
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tenant ID <span className="font-mono">{tenant.id}</span>
          </p>
        </div>
        <Button
          icon={<Repeat size={14} />}
          onClick={() => setModalOpen(true)}
          className="!flex !items-center !gap-1.5"
        >
          Change plan
        </Button>
      </div>

      <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-[#131B2D]">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="px-4"
          items={[
            {
              key: "subscription",
              label: "Subscription",
              children: <SubscriptionTab tenantId={tenant.id} reloadKey={reloadKey} />,
            },
            {
              key: "addons",
              label: "Add-ons",
              children: <TenantAddonsTab tenantId={tenant.id} />,
            },
            {
              key: "overrides",
              label: "Overrides",
              children: <OverridesTab tenantId={tenant.id} />,
            },
          ]}
        />
      </div>

      <SubscribeModal
        open={modalOpen}
        mode="change-plan"
        tenantId={tenant.id}
        onClose={() => setModalOpen(false)}
        onSaved={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
}
