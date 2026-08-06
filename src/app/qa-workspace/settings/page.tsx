"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { BugOutlined } from "@ant-design/icons";
import { usePermission } from "@/hooks/usePermission";
import { useActivitySource } from "@/hooks/useActivitySource";
import BugListConfigManager from "@/components/projects/BugListConfigManager";

export default function QaSettingsPage() {
  useActivitySource({ section: "WORK", module: "QA", page: "QaSettings" });

  const { canReadBug } = usePermission();
  if (!canReadBug) return null;

  return (
    <MainLayout noPadding>
      <style dangerouslySetInnerHTML={{
        __html: `
        .qs-page {
          height: calc(100vh - 64px);
          display: flex; flex-direction: column;
          background: transparent; overflow: hidden;
        }

        .qs-topbar {
          min-height: 52px; padding: 8px 20px; flex-shrink: 0;
          border-bottom: 1px solid var(--border-slate-200);
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
        }
        .qs-topbar__title { display: flex; align-items: center; gap: 10px; min-width: 0; }
        .qs-topbar__h1 { font-size: 15px; font-weight: 700; color: var(--text-slate-900); white-space: nowrap; }
        .qs-topbar__div { width: 1px; height: 14px; background: var(--border-slate-200); flex-shrink: 0; }
        .qs-topbar__sub {
          font-size: 12px; color: var(--text-slate-500);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        @media (max-width: 860px) { .qs-topbar__div, .qs-topbar__sub { display: none; } }

        .qs-secthead {
          display: flex; align-items: center; gap: 11px; flex-shrink: 0;
          padding: 12px 20px; border-bottom: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50);
        }
        .qs-secthead__icon {
          display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 32px; height: 32px; border-radius: 9px; font-size: 15px;
          background: rgba(59,130,246,.1); color: #3B82F6; border: 1px solid rgba(59,130,246,.18);
        }
        .qs-secthead__title { font-size: 13.5px; font-weight: 700; color: var(--text-slate-900); }
        .qs-secthead__desc { margin-top: 2px; font-size: 11.5px; line-height: 1.45; color: var(--text-slate-500); }

        .qs-content { flex: 1; min-height: 0; overflow: hidden; }
      `}} />

      <div className="qs-page">
        <div className="qs-topbar">
          <div className="qs-topbar__title">
            <span className="qs-topbar__h1">QA Settings</span>
            <span className="qs-topbar__div" />
            <span className="qs-topbar__sub">Options that drive the dropdowns across the QA workspace</span>
          </div>
        </div>

        <div className="qs-secthead">
          <span className="qs-secthead__icon"><BugOutlined /></span>
          <div className="min-w-0">
            <div className="qs-secthead__title">Bug List configuration</div>
            <div className="qs-secthead__desc">
              Options available when logging a bug — severities, bug types and workflow statuses.
            </div>
          </div>
        </div>

        <div className="qs-content">
          <BugListConfigManager />
        </div>
      </div>
    </MainLayout>
  );
}
