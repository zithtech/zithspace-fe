"use client";

import React from "react";
import Link from "next/link";
import { Layers, Boxes, FileText, ToggleRight, Gauge, Package, Sparkles, Users } from "lucide-react";

const TILES = [
  {
    href: "/pricing-and-plans/catalog/sections",
    title: "Sections",
    desc: "Top-level navigation grouping.",
    icon: <Layers size={18} />,
  },
  {
    href: "/pricing-and-plans/catalog/modules",
    title: "Modules",
    desc: "Module-level groupings under sections.",
    icon: <Boxes size={18} />,
  },
  {
    href: "/pricing-and-plans/catalog/pages",
    title: "Pages",
    desc: "Routable pages inside modules.",
    icon: <FileText size={18} />,
  },
  {
    href: "/pricing-and-plans/catalog/features",
    title: "Features",
    desc: "Billable / controllable units.",
    icon: <ToggleRight size={18} />,
  },
  {
    href: "/pricing-and-plans/catalog/limits",
    title: "Limits",
    desc: "Metered usage limits catalog.",
    icon: <Gauge size={18} />,
  },
  {
    href: "/pricing-and-plans/plans",
    title: "Plans",
    desc: "Plan definitions and variants.",
    icon: <Package size={18} />,
  },
  {
    href: "/pricing-and-plans/addons",
    title: "Add-ons",
    desc: "Stand-alone purchasable extras.",
    icon: <Sparkles size={18} />,
  },
  {
    href: "/pricing-and-plans/subscriptions",
    title: "Subscriptions",
    desc: "Tenant subscriptions and overrides.",
    icon: <Users size={18} />,
  },
];

export default function PricingAndPlansOverview() {
  return (
    <div className="px-8 py-7">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pricing &amp; Plans</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Catalog of sections, modules, features, plans and tenant subscriptions for Zukvo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {TILES.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="block rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131B2D] p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400">{t.icon}</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.title}</span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-slate-500 dark:text-slate-400 leading-relaxed">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
