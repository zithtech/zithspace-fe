"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import {
  LayoutDashboard,
  Layers,
  Boxes,
  FileText,
  ToggleRight,
  Gauge,
  Package,
  Sparkles,
  Users,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ReactNode };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/pricing-and-plans",
        label: "Overview",
        icon: <LayoutDashboard size={16} />,
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        href: "/pricing-and-plans/catalog/sections",
        label: "Sections",
        icon: <Layers size={16} />,
      },
      {
        href: "/pricing-and-plans/catalog/modules",
        label: "Modules",
        icon: <Boxes size={16} />,
      },
      {
        href: "/pricing-and-plans/catalog/pages",
        label: "Pages",
        icon: <FileText size={16} />,
      },
      {
        href: "/pricing-and-plans/catalog/features",
        label: "Features",
        icon: <ToggleRight size={16} />,
      },
      {
        href: "/pricing-and-plans/catalog/limits",
        label: "Limits",
        icon: <Gauge size={16} />,
      },
    ],
  },
  {
    title: "Plans",
    items: [
      {
        href: "/pricing-and-plans/plans",
        label: "Plans",
        icon: <Package size={16} />,
      },
      {
        href: "/pricing-and-plans/addons",
        label: "Add-ons",
        icon: <Sparkles size={16} />,
      },
    ],
  },
  {
    title: "Tenants",
    items: [
      {
        href: "/pricing-and-plans/subscriptions",
        label: "Subscriptions",
        icon: <Users size={16} />,
      },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/pricing-and-plans") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function PricingAndPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="flex h-full min-h-[calc(100vh-64px)] bg-white dark:bg-[#131B2D]">
          <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
            <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Zukvo
              </div>
              <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                Pricing &amp; Plans
              </div>
            </div>
            <nav className="px-2 py-3 space-y-5">
              {NAV.map((group) => (
                <div key={group.title}>
                  <div className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {group.title}
                  </div>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const active = isActive(pathname || "", item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={[
                              "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-colors",
                              active
                                ? "bg-white dark:bg-[#131B2D] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 font-medium"
                                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 border border-transparent",
                            ].join(" ")}
                          >
                            <span
                              className={
                                active ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
                              }
                            >
                              {item.icon}
                            </span>
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>
          <main className="flex-1 min-w-0 overflow-auto">{children}</main>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
