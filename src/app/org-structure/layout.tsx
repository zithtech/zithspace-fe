"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Permissions } from "@/types/permissions";
import {
  Network,
  Eye,
  Award,
  BadgeInfo,
  Building,
  Building2,
  Briefcase,
  Menu,
  X,
} from "lucide-react";

/**
 * Org-structure shell.
 *
 * The six org-structure submodules (Overview, Grades, Employment Types,
 * Departments, Sub Departments, Positions) used to live as a collapsible
 * group in the global SideNav. They now navigate through this in-page left
 * sidebar — modelled on the Proposals main page — while each submodule keeps
 * its own distinct URL.
 */

interface OrgNavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  /** Visible if the user holds ANY of these permissions. */
  anyPermission: string[];
}

const ORG_NAV_ITEMS: OrgNavItem[] = [
  {
    key: "overview",
    label: "Overview",
    path: "/org-structure/overview",
    icon: <Eye size={15} strokeWidth={1.75} />,
    anyPermission: [Permissions.ORG_READ],
  },
  {
    key: "grades",
    label: "Grades",
    path: "/org-structure/grades",
    icon: <Award size={15} strokeWidth={1.75} />,
    anyPermission: [Permissions.ORG_GRADE_READ, Permissions.ORG_MANAGE],
  },
  {
    key: "employment-types",
    label: "Employment Types",
    path: "/org-structure/employment-types",
    icon: <BadgeInfo size={15} strokeWidth={1.75} />,
    anyPermission: [Permissions.ORG_EMPLOYMENT_TYPE_READ, Permissions.ORG_MANAGE],
  },
  {
    key: "departments",
    label: "Departments",
    path: "/org-structure/departments",
    icon: <Building size={15} strokeWidth={1.75} />,
    anyPermission: [Permissions.ORG_DEPARTMENT_READ, Permissions.ORG_MANAGE],
  },
  {
    key: "sub-departments",
    label: "Sub Departments",
    path: "/org-structure/sub-departments",
    icon: <Building2 size={15} strokeWidth={1.75} />,
    anyPermission: [Permissions.ORG_DEPARTMENT_READ, Permissions.ORG_MANAGE],
  },
  {
    key: "positions",
    label: "Positions",
    path: "/org-structure/positions",
    icon: <Briefcase size={15} strokeWidth={1.75} />,
    anyPermission: [Permissions.ORG_POSITION_READ, Permissions.ORG_MANAGE],
  },
];

export default function OrgStructureLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasAnyPermission } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  const visibleItems = ORG_NAV_ITEMS.filter((item) => hasAnyPermission(...item.anyPermission));

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="osx-shell">
          {/* ============================ SIDEBAR ============================ */}
          {mobileSidebarOpen && (
            <div className="osx-sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />
          )}
          <aside className={`osx-sidebar ${mobileSidebarOpen ? "is-open" : ""}`}>
            <div className="osx-side-head">
              <div className="osx-side-logo"><Network size={22} strokeWidth={1.9} /></div>
              <div className="osx-side-head-text">
                <div className="osx-side-title">Org Structure</div>
                <div className="osx-side-subtitle">Company hierarchy</div>
              </div>
              <button
                className="osx-sidebar-close"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="osx-side-scroll">
              <div className="osx-side-section-label">Modules</div>
              <div className="osx-side-list">
                {visibleItems.map((item) => {
                  const active = pathname?.startsWith(item.path) ?? false;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      className={`osx-nav-item ${active ? "is-active" : ""}`}
                      onClick={() => router.push(item.path)}
                    >
                      <span className="osx-nav-icon">{item.icon}</span>
                      <span className="osx-nav-label">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="osx-main">
            <div className="osx-mobile-header">
              <button
                className="osx-mobile-toggle"
                onClick={() => setMobileSidebarOpen(true)}
              >
                <Menu size={20} />
              </button>
              <div className="osx-mobile-title">Org Structure</div>
            </div>
            {children}
          </main>
        </div>

        <style jsx global>{`
          .osx-shell {
            display: flex;
            margin: 0 -8px;
            height: 100%;
            background: var(--bg-pure-white);
            overflow: hidden;
          }
          /* The submodule pages keep their own .orgx-shell wrapper, which was
             authored with a -24px full-bleed for when it sat directly in the
             page Content. Inside this flex layout that bleed overflows to the
             right — neutralise it so content stays within the main column, and
             make it a column so the scaffold fills the height (sticky footer
             reaches the viewport bottom instead of floating mid-page). */
          .osx-main .orgx-shell { margin: 0; display: flex; flex-direction: column; min-height: 100%; }
          .osx-main .orgx-shell > .omx-main { flex: 1 1 auto; min-height: 0; }

          /* ---------------- Sidebar ---------------- */
          .osx-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            padding: 14px 14px 0;
            height: 100%;
          }
          .osx-side-head {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 2px 2px 14px;
            margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .osx-side-logo {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-slate-900);
          }
          .osx-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .osx-side-title {
            font-size: 16px;
            font-weight: 800;
            color: var(--text-slate-900);
            letter-spacing: -0.025em;
            line-height: 1.1;
          }
          .osx-side-subtitle {
            font-size: 10.5px;
            color: var(--text-slate-400);
            font-weight: 700;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.07em;
          }
          .osx-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .osx-side-scroll::-webkit-scrollbar { width: 5px; }
          .osx-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .osx-side-section-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.07em;
            color: var(--text-slate-400);
            padding: 0 8px;
            margin: 16px 0 6px;
          }
          .osx-side-scroll > .osx-side-section-label:first-child { margin-top: 6px; }
          .osx-side-list { display: flex; flex-direction: column; gap: 2px; }

          .osx-nav-item {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 9px 10px;
            border: none;
            background: transparent;
            border-radius: 10px;
            cursor: pointer;
            text-align: left;
            color: var(--text-slate-600, #475569);
            font-size: 13px;
            font-weight: 600;
            transition: background 0.15s, color 0.15s;
          }
          .osx-nav-item:hover {
            background: color-mix(in srgb, #3b82f6 8%, transparent);
            color: #3b82f6;
          }
          .osx-nav-icon { display: inline-flex; align-items: center; color: var(--text-slate-400); flex-shrink: 0; }
          .osx-nav-label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

          .osx-nav-item.is-active {
            position: relative;
            background: color-mix(in srgb, #3b82f6 14%, transparent);
            color: #3b82f6;
            box-shadow: 0 2px 8px -3px color-mix(in srgb, #3b82f6 50%, transparent);
          }
          .osx-nav-item.is-active .osx-nav-icon { color: #3b82f6; }
          .osx-nav-item.is-active::before {
            content: "";
            position: absolute;
            left: 0;
            top: 9px;
            bottom: 9px;
            width: 3px;
            border-radius: 0 3px 3px 0;
            background: linear-gradient(180deg, #3b82f6 0%, #6366f1 100%);
          }

          .osx-main {
            flex: 1;
            min-width: 0;
            height: 100%;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
          }
          .osx-main .saas-header-container {
            position: sticky !important;
            top: 0 !important;
            z-index: 100 !important;
            background: var(--bg-pure-white) !important;
            border-bottom: 1px solid var(--border-slate-200) !important;
            padding: 9.5px 32px !important;
          }
          .osx-main .saas-header-container .ant-row {
            flex-wrap: wrap !important;
          }
          [data-theme='dark'] .osx-main .saas-header-container {
            background: var(--bg-pure-white) !important;
            border-bottom-color: var(--border-slate-100) !important;
          }

          [data-theme="dark"] .osx-nav-item.is-active {
            background: color-mix(in srgb, #3b82f6 22%, transparent);
            color: #93c5fd;
          }
          [data-theme="dark"] .osx-nav-item.is-active .osx-nav-icon { color: #93c5fd; }
          [data-theme="dark"] .osx-nav-item:hover {
            background: rgba(59, 130, 246, 0.14);
            color: #e2e8f0;
          }

          /* ---------------- Responsive Styles ---------------- */
          .osx-sidebar-backdrop {
            display: none;
          }
          .osx-sidebar-close {
            display: none;
            background: transparent;
            border: none;
            color: var(--text-slate-500);
            cursor: pointer;
            padding: 4px;
            margin-left: auto;
          }
          .osx-mobile-header {
            display: none;
            align-items: center;
            gap: 12px;
            padding: 6px 16px 10px;
            margin-bottom: 8px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .osx-mobile-toggle {
            background: transparent;
            border: none;
            color: var(--text-slate-700);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            margin-left: -4px;
          }
          .osx-mobile-title {
            font-size: 16px;
            font-weight: 700;
            color: var(--text-slate-900);
          }

          @media (max-width: 1024px) {
            .osx-sidebar {
              position: fixed;
              left: 0;
              top: 0;
              height: 100vh;
              z-index: 1000;
              transform: translateX(-100%);
              transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
              box-shadow: none;
            }
            .osx-sidebar.is-open {
              transform: translateX(0);
              box-shadow: 4px 0 24px rgba(0, 0, 0, 0.15);
            }
            .osx-sidebar-backdrop {
              display: block;
              position: fixed;
              inset: 0;
              background: rgba(15, 23, 42, 0.4);
              z-index: 999;
              backdrop-filter: blur(2px);
            }
            .osx-sidebar-close {
              display: flex;
            }
            .osx-mobile-header {
              display: flex;
            }
            .osx-main .saas-header-container {
              padding: 9px 16px !important;
            }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
