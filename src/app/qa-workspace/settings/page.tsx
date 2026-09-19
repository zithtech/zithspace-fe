"use client";

import React, { Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { BugOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import BugListConfigManager from "@/components/projects/BugListConfigManager";

import { QA_SUBMISSION_STYLES } from "../qa-submissions/shared";

export default function QaSettingsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "QaSettings" });

  // Bug definitions need bug.manage, the test scope option lists need qa.manage.
  // Either grant is enough to reach the screen; the sidebar shows only the
  // groups the viewer can actually configure.
  const { canManageBugs, canManageQa } = usePermission();
  if (!canManageBugs && !canManageQa) return null;

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{ __html: QA_SUBMISSION_STYLES + `
        .dh-mobile-menu-btn { display: none !important; }

        @media (max-width: 820px) {
          .dh-shell { flex-direction: column; height: auto; min-height: calc(100vh - 64px); overflow: visible; }
          .dh-main { height: auto; overflow: visible; width: 100%; }
          .dh-mobile-menu-btn { display: flex !important; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 8px; margin-right: 8px; color: var(--text-slate-600); }
          .dh-mobile-menu-btn:hover { background: var(--bg-slate-100); }

          .dh-sidebar-backdrop {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(2px); z-index: 1099;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
            display: block !important;
          }
          .dh-sidebar-backdrop.is-open { opacity: 1; pointer-events: auto; }

          .dh-sidebar {
            position: fixed; top: 0; left: -320px; bottom: 0;
            z-index: 1100; height: 100%; max-height: none;
            border-right: 1px solid var(--border-slate-200); border-bottom: 0;
            display: flex; flex-direction: column; align-items: stretch;
            background: var(--bg-pure-white); width: 280px; box-sizing: border-box;
            transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 4px 0 24px rgba(0,0,0,0.08);
          }
          .dh-sidebar.is-mobile-open { left: 0; }
          
          /* Topbar: compress controls */
          .sc-topbar { padding: 8px 14px !important; }
        }
        
        @media (max-width: 480px) {
          .sc-topbar__sub, .sc-topbar__div { display: none !important; }
        }
      `}} />
      {/* The manager reads ?section= to open straight onto a pane, and
          useSearchParams needs a boundary to render under. */}
      <div style={{ height: '100%', width: '100%' }}>
        <Suspense fallback={null}>
          <BugListConfigManager />
        </Suspense>
      </div>
    </MainLayout>
  );
}
