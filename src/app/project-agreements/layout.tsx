'use client';

/**
 * Project Agreements — the module shell.
 *
 * NO SIDEBAR OF ITS OWN. Agreements / Templates / Letterhead are children of
 * the "Project Agreements" item in the global nav (see navigationConfig.tsx),
 * so there is one place to navigate from rather than two stacked rails. What
 * survives here is the guard and the module's shared page chrome.
 *
 * The <style jsx global> block below is load-bearing for every page in the
 * module: styled-jsx only injects global rules while the declaring component
 * is mounted, so these classes live on the always-mounted layout rather than
 * in any one page.
 */

import React, { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';

/** See routes/index.ts — 'hrms' rides along until the catalogue row exists. */
const FEATURE = ['hrms_project_agreements', 'hrms'];

export default function ProjectAgreementsLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, hasAnySubscriptionFeature } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;

  /**
   * The surfaces this user may open, in nav order. Kept in step with the
   * children of the "Project Agreements" entry in navigationConfig.tsx — the
   * nav decides what is SHOWN, this decides what may be REACHED, and a
   * deep-linked URL has to be answered by the second.
   */
  const allowedPaths = useMemo(() => {
    const paths: string[] = [];
    if (perms.canReadAgreement) paths.push('/project-agreements/agreements');
    if (perms.canReadAgreementTemplate || perms.canReadAgreement) {
      paths.push('/project-agreements/templates');
    }
    if (perms.canReadAgreement || perms.canManageAgreements) {
      // The letterhead lives here now; /branding redirects into it and is
      // listed so the redirect is not bounced by this guard on its way through.
      paths.push('/project-agreements/settings');
      paths.push('/project-agreements/branding');
    }
    return paths;
  }, [perms.canReadAgreement, perms.canReadAgreementTemplate, perms.canManageAgreements]);

  useEffect(() => {
    if (isLoading || !pathname) return;

    if (allowedPaths.length === 0 || !hasAnySubscriptionFeature(...FEATURE)) {
      router.replace('/dashboard');
      return;
    }

    const allowed = allowedPaths.some(
      (href) => pathname === href || pathname.startsWith(href + '/')
    );
    if (!allowed) router.replace(allowedPaths[0]);
  }, [isLoading, pathname, allowedPaths, hasAnySubscriptionFeature, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="pa-shell">
          <main className="pa-main">
            <div className="pa-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .pa-shell {
            display: flex;
            margin: 0 -8px;
            height: calc(100vh - 64px);
            overflow: hidden;
            background: var(--bg-pure-white);
          }
          .pa-main {
            flex: 1; min-width: 0; min-height: 0; height: 100%;
            background: var(--bg-pure-white);
            overflow-y: auto; overflow-x: hidden;
            display: flex; flex-direction: column; position: relative;
          }
          .pa-content { display: flex; flex-direction: column; flex: 1; min-height: 0; min-width: 0; }

          /* ── Shared page chrome, used by every page in this module ─────── */
          .pa-header {
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
            padding: 0 16px; min-height: 53px;
            box-sizing: border-box;
            border-bottom: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            position: sticky; top: 0; z-index: 30;
          }
          .pa-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
          .pa-header-icon {
            width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
            background: rgba(59,130,246,0.10); color: #3b82f6;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .pa-header-title {
            font-size: 14px; font-weight: 700; color: var(--text-slate-900);
            letter-spacing: -0.02em; line-height: 1.15;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .pa-header-sub {
            font-size: 12.5px; color: var(--text-slate-600); margin-top: 2px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .pa-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

          .pa-body-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: 16px; }

          /* Buttons — blue primary, ash ghost, light red for destructive only. */
          .pa-btn {
            display: inline-flex; align-items: center; gap: 6px;
            height: 32px; padding: 0 12px; border-radius: 8px;
            font-size: 12.5px; font-weight: 600; cursor: pointer;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-700);
            transition: all 0.15s; white-space: nowrap;
          }
          .pa-btn:hover:not(:disabled) { border-color: #bfdbfe; color: #3b82f6; }
          .pa-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .pa-btn-primary {
            background: #3b82f6; border-color: #3b82f6; color: #fff;
          }
          .pa-btn-primary:hover:not(:disabled) { background: #2563eb; border-color: #2563eb; color: #fff; }
          .pa-btn-success { background: #16a34a; border-color: #16a34a; color: #fff; }
          .pa-btn-success:hover:not(:disabled) { background: #15803d; border-color: #15803d; color: #fff; }
          .pa-btn-danger { color: #ef4444; }
          .pa-btn-danger:hover:not(:disabled) { border-color: #fecaca; background: rgba(239,68,68,0.06); color: #ef4444; }

          .pa-chip {
            display: inline-flex; align-items: center; gap: 5px;
            height: 22px; padding: 0 8px; border-radius: 999px;
            font-size: 11px; font-weight: 700; letter-spacing: 0.01em;
          }

          .pa-field { display: flex; flex-direction: column; gap: 6px; }
          .pa-label {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.06em; color: var(--text-slate-500);
          }
          .pa-input, .pa-textarea {
            width: 100%; border-radius: 8px; padding: 8px 10px;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-900);
            font-size: 13px; font-family: inherit; outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
          }
          .pa-input:focus, .pa-textarea:focus {
            border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
          }
          .pa-textarea { resize: vertical; min-height: 76px; line-height: 1.5; }
          .pa-hint { font-size: 11.5px; color: var(--text-slate-500); }
          .pa-error { font-size: 11.5px; color: #ef4444; }

          .pa-card {
            border: 1px solid var(--border-slate-200);
            border-radius: 12px;
            background: var(--bg-pure-white);
          }
          .pa-card-head {
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
            padding: 12px 14px; border-bottom: 1px solid var(--border-slate-100);
          }
          .pa-card-title { font-size: 13px; font-weight: 700; color: var(--text-slate-900); }
          .pa-card-body { padding: 14px; }

          /* ── Split view: a form rail beside a document preview ──────────
           * Owned HERE, not in a page component. These classes are shared by
           * the composer, the letterhead editor and the saved-document view;
           * when they lived in one page's styled-jsx block the other pages
           * rendered completely unstyled, because styled-jsx only injects
           * global rules while the declaring component is mounted. */
          .pa-split {
            flex: 1; min-height: 0;
            display: grid;
            grid-template-columns: minmax(360px, 440px) 1fr;
          }
          .pa-split-form {
            overflow-y: auto;
            padding: 16px;
            display: flex; flex-direction: column; gap: 14px;
            border-right: 1px solid var(--border-slate-200);
          }
          .pa-split-form::-webkit-scrollbar { width: 6px; }
          .pa-split-form::-webkit-scrollbar-thumb {
            background: var(--border-slate-200); border-radius: 3px;
          }

          /* ── The preview pane ───────────────────────────────────────── */
          .pa-preview {
            min-width: 0; min-height: 0;
            display: flex; flex-direction: column;
            background: var(--bg-pure-white);
            /* Grid parents (.pa-split, .pa-detail) ignore this; the template
             * preview MODAL is a flex column, where without it the pane would
             * collapse to the height of its own toolbar. */
            flex: 1 1 auto;
          }
          .pa-preview-bar {
            display: flex; align-items: center; gap: 8px;
            height: 44px; padding: 0 10px 0 14px; flex-shrink: 0;
            border-bottom: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            color: var(--text-slate-400);
          }
          .pa-preview-label {
            font-size: 11px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-500);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .pa-preview-spinner { display: inline-flex; flex-shrink: 0; }
          .pa-preview-tools {
            margin-left: auto;
            display: flex; align-items: center; gap: 6px; flex-shrink: 0;
          }
          .pa-zoom {
            display: flex; align-items: center; gap: 1px;
            padding: 2px;
            border-radius: 9px;
            background: var(--bg-slate-50, #f8fafc);
            border: 1px solid var(--border-slate-200);
          }
          .pa-zoom-btn {
            width: 26px; height: 26px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center;
            border: none; border-radius: 7px;
            background: transparent; color: var(--text-slate-500);
            cursor: pointer; transition: background 0.15s, color 0.15s;
          }
          .pa-zoom-btn:hover:not(:disabled) {
            background: color-mix(in srgb, #3b82f6 10%, transparent);
            color: #3b82f6;
          }
          .pa-zoom-btn.is-on {
            background: color-mix(in srgb, #3b82f6 14%, transparent);
            color: #3b82f6;
          }
          .pa-zoom-btn:disabled { opacity: 0.35; cursor: not-allowed; }
          .pa-preview-tools > .pa-zoom-btn {
            border: 1px solid var(--border-slate-200);
            width: 32px; height: 32px; border-radius: 9px;
            background: var(--bg-slate-50, #f8fafc);
          }
          .pa-zoom-value {
            min-width: 40px; text-align: center;
            font-size: 11px; font-weight: 700;
            font-variant-numeric: tabular-nums;
            color: var(--text-slate-600);
            user-select: none;
          }

          /* The tray the sheet sits in. Horizontal scroll only: at any zoom the
           * frame is sized to land exactly on the stage, so the DOCUMENT
           * scrolls inside the paper rather than the paper inside the pane. */
          .pa-preview-stage {
            flex: 1; min-height: 0;
            overflow-x: auto; overflow-y: hidden;
            text-align: center;
            /* Flat, and the ONLY ground in the pane — the preview document sets
             * its own background to transparent so the sheet floats on this in
             * both themes. A gradient here showed as a band beside the frame
             * and nothing behind it. */
            background: var(--bg-slate-100, #f1f5f9);
          }
          /* Page-fit: the sheet is a sheet, centred with air around it, and the
             stage scrolls in both directions when a zoom outgrows the pane. */
          .pa-preview-stage.is-page {
            overflow: auto;
            display: flex; align-items: center; justify-content: center;
            padding: 12px;
          }
          .pa-preview-stage.is-page > .pa-preview-scaler {
            flex: none;
            border-radius: 2px;
            box-shadow: 0 2px 10px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.06);
          }
          .pa-preview-stage.is-page.is-pdf { display: block; padding: 0; overflow: hidden; }
          .pa-preview-stage::-webkit-scrollbar { height: 8px; }
          .pa-preview-stage::-webkit-scrollbar-thumb {
            background: var(--border-slate-200); border-radius: 4px;
          }
          /* inline-block + text-align centring rather than flex: a centred flex
           * item that overflows its container cannot be scrolled back to. */
          .pa-preview-scaler {
            display: inline-block; position: relative;
            vertical-align: top; overflow: hidden;
          }
          .pa-preview-frame { border: none; display: block; background: transparent; }
          /* PDF mode: the browser's viewer fills the pane and does its own
             scrolling, so the stage stops being a scroll container. */
          .pa-preview-stage.is-pdf { overflow: hidden; text-align: left; }
          .pa-preview-pdf { width: 100%; height: 100%; border: none; display: block; }
          .pa-pagecount {
            height: 32px; padding: 0 10px; border-radius: 9px;
            display: inline-flex; align-items: center;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50, #f8fafc);
            font-size: 11px; font-weight: 700;
            font-variant-numeric: tabular-nums;
            color: var(--text-slate-600);
          }

          .pa-preview-empty {
            height: 100%;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 12px;
            padding: 32px; text-align: center;
            font-size: 13px; color: var(--text-slate-500);
          }
          .pa-preview-empty p { margin: 0; max-width: 260px; line-height: 1.55; }
          .pa-preview-empty-icon {
            width: 46px; height: 46px; border-radius: 12px;
            display: grid; place-items: center;
            background: rgba(59,130,246,0.10); color: #3b82f6;
          }

          /* ── Composer: form rail | A4 editor | optional preview ───────── */
          .pa-compose {
            flex: 1; min-height: 0;
            display: grid;
            grid-template-columns: minmax(330px, 400px) 1fr;
          }
          .pa-compose.is-split {
            grid-template-columns: minmax(300px, 360px) minmax(0, 1.15fr) minmax(0, 1fr);
          }
          .pa-editor-pane {
            min-width: 0; min-height: 0;
            display: flex; flex-direction: column;
            border-left: 1px solid var(--border-slate-200);
            background: var(--bg-slate-100, #f1f5f9);
          }
          .pa-compose.is-split > .pa-preview {
            border-left: 1px solid var(--border-slate-200);
          }
          .pa-btn.is-on {
            background: color-mix(in srgb, #3b82f6 12%, transparent);
            border-color: #bfdbfe; color: #3b82f6;
          }
          /* The "this is your document now" notice under the template picker. */
          .pa-detached {
            display: flex; align-items: flex-start; gap: 8px;
            margin-top: 2px; padding: 9px 10px; border-radius: 9px;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50, #f8fafc);
            font-size: 11.5px; line-height: 1.45; color: var(--text-slate-600);
          }
          .pa-detached > svg { flex: none; margin-top: 1px; color: var(--text-slate-400); }
          .pa-detached > span { flex: 1; min-width: 0; }
          .pa-detached .pa-btn { flex: none; height: 26px; padding: 0 8px; font-size: 11.5px; }

          /* Currency picker + amount as one control. The picker takes the
             larger share because it carries a country name, not a code. */
          .pa-money { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); gap: 6px; align-items: start; }
          /* The figure-and-words line, shown where the hint would be. It wraps:
             a worded amount is a sentence, not a label. */
          .pa-money-preview {
            font-size: 11.5px; line-height: 1.5; color: var(--text-slate-600);
            font-weight: 600;
          }

          /* Which summary rows print. */
          .pa-rowpick { display: flex; flex-direction: column; gap: 2px; margin-top: 10px; }
          .pa-rowpick-item {
            display: grid;
            grid-template-columns: 16px minmax(0, auto) 1fr;
            align-items: center; gap: 8px;
            padding: 7px 8px; border-radius: 8px;
            cursor: pointer; transition: background 0.15s;
          }
          .pa-rowpick-item:hover { background: var(--bg-slate-50, #f8fafc); }
          .pa-rowpick-item input { width: 15px; height: 15px; accent-color: #3b82f6; cursor: pointer; }
          .pa-rowpick-label {
            font-size: 12.5px; font-weight: 600; color: var(--text-slate-500);
            white-space: nowrap;
          }
          .pa-rowpick-item.is-on .pa-rowpick-label { color: var(--text-slate-900); }
          .pa-rowpick-hint {
            font-size: 11.5px; color: var(--text-slate-400);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }

          /* A card-header on/off, for sections that print or don't. */
          .pa-switch {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 11.5px; font-weight: 600; color: var(--text-slate-500);
            cursor: pointer; user-select: none;
          }
          .pa-switch input { width: 15px; height: 15px; accent-color: #3b82f6; cursor: pointer; }

          /* One side of the sign-off, grouped so the two read as a pair. */
          .pa-signblock {
            padding: 10px; border-radius: 10px;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50, #f8fafc);
          }
          .pa-signblock-head {
            font-size: 11px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.06em; color: var(--text-slate-500);
            margin-bottom: 8px;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .pa-signblock .pa-input { background: var(--bg-pure-white); }

          .pa-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .pa-empty-note {
            display: flex; align-items: flex-start; gap: 8px;
            padding: 12px 14px; border-radius: 10px;
            border: 1px dashed var(--border-slate-200);
            background: var(--bg-slate-50, #f8fafc);
            font-size: 12.5px; line-height: 1.5; color: var(--text-slate-600);
          }

          /* Two-or-three-way choice, where a dropdown would be heavier than
             the decision: the document type's Active / Inactive. */
          .pa-seg {
            display: inline-flex; align-items: center; gap: 2px;
            padding: 2px; border-radius: 9px; align-self: flex-start;
            background: var(--bg-slate-50, #f8fafc);
            border: 1px solid var(--border-slate-200);
          }
          .pa-seg-btn {
            height: 28px; padding: 0 14px; border: none; border-radius: 7px;
            background: transparent; color: var(--text-slate-600);
            font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
            transition: background 0.15s, color 0.15s;
          }
          .pa-seg-btn.is-on {
            background: var(--bg-pure-white); color: #3b82f6;
            box-shadow: 0 1px 3px rgba(15,23,42,0.10);
          }
          [data-theme='dark'] .pa-seg-btn.is-on { background: #1e293b; }

          /* A machine name. Monospace because it is one — TEST_PROPOSAL reads
             as a handle rather than a phrase. */
          .pa-code, .pa-code-input {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 11.5px; letter-spacing: 0.02em;
          }
          .pa-code {
            display: inline-block; padding: 2px 7px; border-radius: 6px;
            background: var(--bg-slate-50, #f8fafc);
            border: 1px solid var(--border-slate-200);
            color: var(--text-slate-600); font-weight: 600;
          }
          .pa-code-input { font-size: 12.5px; text-transform: uppercase; }

          /* Actions sitting on the right of a section head. */
          .tl-sprint-actions {
            flex-shrink: 0; display: inline-flex; align-items: center; gap: 8px;
          }

          /* ══ List-page chrome ════════════════════════════════════════
           * The same vocabulary the Tickets list uses (tl-section-head,
           * tl-filter-row, pp-table, pp-footer, tl-action-pop), declared here
           * because styled-jsx global rules only live while their declaring
           * component is mounted — TicketList is not mounted on these routes.
           * Keep in step with src/components/projects/TicketList.tsx. */

          /* The band under the page header: what you are looking at, and the
             counts that describe it. */
          .tl-section-head {
            padding: 8px 12px;
            background: var(--bg-slate-50, #f8fafc);
            border-bottom: 1px solid var(--border-slate-200);
            flex-shrink: 0;
          }
          [data-theme='dark'] .tl-section-head {
            background: #0f1419;
            border-bottom-color: #1f2937;
          }
          .tl-sprint-row1 {
            display: flex; align-items: center; gap: 10px; min-width: 0;
          }
          .tl-sprint-title-block {
            display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1;
          }
          .tl-sprint-dot {
            width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
          }
          .tl-sprint-title {
            font-size: 12.5px; font-weight: 700; color: var(--text-slate-900);
            letter-spacing: -0.01em;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          [data-theme='dark'] .tl-sprint-title { color: #f1f5f9; }
          .tl-sprint-tags { display: inline-flex; flex-wrap: wrap; gap: 5px; }
          .tl-sprint-tag {
            display: inline-flex; align-items: center; gap: 5px;
            height: 21px; padding: 0 8px; border-radius: 6px;
            font-size: 10px; font-weight: 800; letter-spacing: 0.04em;
            text-transform: uppercase; white-space: nowrap;
            border: 1px solid transparent;
            font-variant-numeric: tabular-nums;
          }
          .tl-sprint-tag b { font-size: 11px; font-weight: 800; }
          .tl-sprint-row2 {
            display: flex; align-items: center; flex-wrap: wrap; gap: 14px;
            margin-top: 6px;
          }
          .tl-sprint-meta {
            display: inline-flex; align-items: center; gap: 5px;
            font-size: 11.5px; color: var(--text-slate-500);
          }
          .tl-sprint-meta b { color: var(--text-slate-900); font-weight: 700; }
          [data-theme='dark'] .tl-sprint-meta b { color: #f1f5f9; }

          /* The pill row: one pill per filter, a reset when any is set. */
          .tl-filter-row {
            display: flex; align-items: center; gap: 10px;
            padding: 8px 12px; flex-shrink: 0;
            background: var(--bg-slate-50, #f8fafc);
            border-bottom: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .tl-filter-row {
            background: #0f1419; border-bottom-color: #1f2937;
          }
          .tl-filter-row-label {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 10.5px; font-weight: 800; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--text-slate-500); flex-shrink: 0;
          }
          [data-theme='dark'] .tl-filter-row-label { color: #94a3b8; }
          .tl-filter-row-count {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 18px; height: 18px; padding: 0 6px;
            background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
            color: var(--text-slate-500); border-radius: 999px;
            font-size: 10px; font-weight: 800; letter-spacing: 0;
            font-variant-numeric: tabular-nums;
          }
          [data-theme='dark'] .tl-filter-row-count {
            background: #111720; border-color: #2d3748; color: #cbd5e1;
          }
          .tl-filter-row-pills {
            flex: 1 1 auto; min-width: 0;
            display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
          }
          .tl-filter-row-actions {
            flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px;
          }
          .tl-filter-row-reset {
            display: inline-flex; align-items: center; gap: 5px;
            height: 28px; padding: 0 10px;
            background: transparent; border: 1px dashed var(--border-slate-200);
            border-radius: 8px; font-family: inherit;
            font-size: 11px; font-weight: 700; color: var(--text-slate-500);
            cursor: pointer;
            transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
          }
          .tl-filter-row-reset:hover {
            color: #1d4ed8; border-color: rgba(59,130,246,0.45);
            background: rgba(59,130,246,0.06); border-style: solid;
          }
          [data-theme='dark'] .tl-filter-row-reset { border-color: #2d3748; color: #94a3b8; }
          /* The search box sits in the pill row and shares its height. */
          .tl-filter-search {
            display: flex; align-items: center; gap: 7px;
            flex: 0 1 300px; min-width: 190px; height: 28px; padding: 0 10px;
            border: 1px solid var(--border-slate-200); border-radius: 8px;
            background: var(--bg-pure-white); color: var(--text-slate-400);
          }
          .tl-filter-search:focus-within {
            border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
          }
          .tl-filter-search input {
            flex: 1; min-width: 0; border: none; outline: none; background: transparent;
            font-size: 12.5px; color: var(--text-slate-900); font-family: inherit;
          }
          [data-theme='dark'] .tl-filter-search { background: #111720; border-color: #2d3748; }

          /* The table owns the page's vertical scroll; the footer stays put. */
          .pp-table-wrap {
            background: var(--bg-pure-white);
            border-bottom: 1px solid var(--border-slate-200);
            flex: 1; min-height: 0;
            overflow-y: auto; overflow-x: auto;
            -ms-overflow-style: none; scrollbar-width: none;
          }
          .pp-table-wrap::-webkit-scrollbar { width: 0; height: 0; display: none; }
          [data-theme='dark'] .pp-table-wrap { background: #0f1419; border-color: #1f2937; }
          .pp-table .ant-table { background: transparent; font-size: 12px; }
          .pp-table .ant-table-thead > tr > th {
            background: var(--bg-slate-50, #f8fafc) !important;
            border-bottom: 1px solid var(--border-slate-200) !important;
            font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
            text-transform: uppercase; color: var(--text-slate-400) !important;
            padding: 8px 10px !important; white-space: nowrap !important;
            position: sticky !important; top: 0 !important; z-index: 2 !important;
          }
          [data-theme='dark'] .pp-table .ant-table-thead > tr > th {
            background: #0f1419 !important; border-bottom-color: #1f2937 !important;
            color: #94a3b8 !important;
          }
          .pp-table .ant-table-tbody > tr > td {
            border-bottom: 1px solid var(--border-slate-100) !important;
            padding: 8px 10px !important;
          }
          [data-theme='dark'] .pp-table .ant-table-tbody > tr > td { border-bottom-color: #1f2937 !important; }
          .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
          .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }
          .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50, #f8fafc) !important; }
          [data-theme='dark'] .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: #1e293b !important; }
          .pp-table .ant-table-pagination { display: none !important; }

          /* Leading cell: square icon, title, and the quiet line under it. */
          .pp-name-cell { display: flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; }
          .pp-name-icon {
            width: 24px; height: 24px; border-radius: 6px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center;
            color: #3b82f6; background: rgba(59,130,246,0.10);
          }
          [data-theme='dark'] .pp-name-icon { background: rgba(59,130,246,0.15); }
          .pp-name-text { display: flex; flex-direction: column; min-width: 0; }
          .pp-name-title {
            font-size: 12.5px; font-weight: 600; color: var(--text-slate-900);
            letter-spacing: -0.01em;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          [data-theme='dark'] .pp-name-title { color: #f1f5f9; }
          .pp-name-sub {
            font-size: 11px; color: var(--text-slate-400); margin-top: 1px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .pp-cell { font-size: 12px; color: var(--text-slate-700); }
          [data-theme='dark'] .pp-cell { color: #cbd5e1; }
          .pp-cell-muted { color: var(--text-slate-400); }
          .pp-vis-pill {
            display: inline-flex; align-items: center; gap: 5px;
            height: 23px; padding: 0 8px; border-radius: 6px;
            font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
          }
          .pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

          /* Pagination, hand-rolled so the count and the pager share a bar. */
          .pp-footer {
            display: flex; align-items: center; justify-content: space-between;
            flex-wrap: wrap; gap: 10px;
            padding: 8px 12px; flex-shrink: 0; box-sizing: border-box;
            background: var(--bg-pure-white);
            border-top: 1px solid var(--border-slate-200);
            box-shadow: 0 -4px 14px rgba(15,23,42,0.04);
          }
          [data-theme='dark'] .pp-footer { background: #0f1419; border-top-color: #1f2937; }
          .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
          .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
          [data-theme='dark'] .pp-footer-info strong { color: #f1f5f9; }
          .pp-pager { display: flex; align-items: center; gap: 3px; }
          .pp-pager-btn, .pp-pager-num {
            min-width: 28px; height: 28px; border-radius: 7px;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-600);
            cursor: pointer; font-size: 12.5px; font-weight: 600;
            display: inline-flex; align-items: center; justify-content: center;
          }
          [data-theme='dark'] .pp-pager-btn, [data-theme='dark'] .pp-pager-num {
            background: #1e293b; border-color: #334155; color: #cbd5e1;
          }
          .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .pp-pager-num.is-active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
          .pp-pagesize { margin-left: 5px; }
          .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

          /* Row actions: icon, title, and what the action actually does. */
          .tl-action-pop .ant-dropdown-menu {
            padding: 6px; border-radius: 0; min-width: 236px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-100);
            box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
          }
          .tl-action-pop .ant-dropdown-menu-item {
            padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
            transition: background 0.12s ease;
          }
          .tl-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50, #f8fafc) !important; }
          .tl-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
          .tl-action-pop .ant-dropdown-menu-item-divider { margin: 5px 4px !important; background: var(--border-slate-100); }
          .tl-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
          .tl-menu-ic {
            width: 30px; height: 30px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            background: var(--bg-slate-50, #f8fafc); color: var(--text-slate-500);
          }
          .tl-menu-text { display: flex; flex-direction: column; min-width: 0; }
          .tl-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
          .tl-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
          .tl-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
          .tl-action-pop .ant-dropdown-menu-item-danger .tl-menu-title { color: #ef4444; }
          .tl-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
          .tl-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }

          /* ══ Detail drawer ═══════════════════════════════════════════
           * Viewing an agreement or a template happens over the list, not
           * instead of it. antd owns the panel; these rules strip its padding
           * so the module's own header and split can sit flush inside. */
          .pa-drawer .ant-drawer-body {
            padding: 0 !important;
            display: flex; flex-direction: column;
            overflow: hidden;
            background: var(--bg-pure-white);
          }
          .pa-drawer .ant-drawer-content { background: var(--bg-pure-white); }
          [data-theme='dark'] .pa-drawer .ant-drawer-content,
          [data-theme='dark'] .pa-drawer .ant-drawer-body { background: #0f1419; }
          /* The header is sticky on a page; inside a drawer it is simply the
             top row, and sticky here fights the body's own overflow. */
          .pa-drawer .pa-header { position: static; }

          /* Details beside the document. Shared by the drawer and anything
             else that shows one record next to its rendered output. */
          .pa-detail {
            flex: 1; min-height: 0;
            display: grid;
            grid-template-columns: 300px minmax(0, 1fr);
          }
          .pa-detail-side {
            overflow-y: auto; padding: 16px;
            display: flex; flex-direction: column; gap: 14px;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50, #f8fafc);
          }
          [data-theme='dark'] .pa-detail-side {
            background: #0f1419; border-right-color: #1f2937;
          }
          .pa-detail-side::-webkit-scrollbar { width: 5px; }
          .pa-detail-side::-webkit-scrollbar-thumb {
            background: var(--border-slate-200); border-radius: 3px;
          }
          .pa-detail-side { gap: 0; padding: 14px; }

          /* ── The details column ───────────────────────────────────────
           * Grouped, because reading a contract is three separate questions
           * — who with, when, how much — and one flat stack makes you scan
           * all of it to answer any one. */
          .pa-dt-hero {
            padding: 12px 13px; border-radius: 11px; margin-bottom: 14px;
            border: 1px solid color-mix(in srgb, var(--hero, #3b82f6) 26%, transparent);
            background: color-mix(in srgb, var(--hero, #3b82f6) 9%, transparent);
          }
          .pa-dt-hero-eyebrow {
            font-size: 9.5px; font-weight: 800; letter-spacing: 0.09em;
            text-transform: uppercase;
            color: color-mix(in srgb, var(--hero, #3b82f6) 78%, var(--text-slate-900));
          }
          .pa-dt-hero-value {
            margin-top: 5px;
            font-size: 19px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15;
            color: var(--text-slate-900);
            font-variant-numeric: tabular-nums;
            overflow-wrap: anywhere;
          }
          [data-theme='dark'] .pa-dt-hero-value { color: #f1f5f9; }
          .pa-dt-hero-caption {
            margin-top: 5px;
            font-size: 11px; line-height: 1.5; font-weight: 600;
            color: var(--text-slate-500);
          }

          .pa-dt-section { padding: 12px 0; border-top: 1px solid var(--border-slate-200); }
          .pa-dt-section:first-of-type { border-top: none; padding-top: 0; }
          [data-theme='dark'] .pa-dt-section { border-top-color: #1f2937; }
          .pa-dt-section-title {
            display: flex; align-items: center; gap: 6px;
            font-size: 9.5px; font-weight: 800; letter-spacing: 0.09em;
            text-transform: uppercase; color: var(--text-slate-400);
            margin-bottom: 9px;
          }
          .pa-dt-section-count {
            display: inline-flex; align-items: center; justify-content: center;
            min-width: 16px; height: 16px; padding: 0 5px; border-radius: 999px;
            background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
            color: var(--text-slate-500); font-size: 9.5px; letter-spacing: 0;
          }
          .pa-dt-rows { display: flex; flex-direction: column; gap: 9px; }
          /* Icon | label | value, so the labels form a column the eye can run
             down instead of alternating with the values. */
          .pa-dt-row {
            display: grid;
            grid-template-columns: 16px 74px minmax(0, 1fr);
            align-items: start; gap: 8px;
          }
          .pa-dt-row > .pa-dt-label:first-child { grid-column: 2; }
          .pa-dt-icon {
            display: inline-flex; align-items: center; justify-content: center;
            color: var(--text-slate-400); margin-top: 1px;
          }
          .pa-dt-label {
            font-size: 11px; font-weight: 600; color: var(--text-slate-400);
            line-height: 1.45;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .pa-dt-value {
            display: flex; flex-direction: column; gap: 1px;
            font-size: 12.5px; font-weight: 600; line-height: 1.45;
            color: var(--text-slate-900); overflow-wrap: anywhere;
          }
          [data-theme='dark'] .pa-dt-value { color: #f1f5f9; }
          .pa-dt-value.is-mono {
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
            font-size: 11.5px;
          }
          .pa-dt-sub { font-size: 11px; font-weight: 500; color: var(--text-slate-500); }
          .pa-dt-note {
            margin: 0; font-size: 12px; line-height: 1.6;
            color: var(--text-slate-600); white-space: pre-wrap;
          }
          .pa-dt-foot {
            display: block; margin-top: 8px;
            font-size: 11px; color: var(--text-slate-400);
          }
          .pa-dt-link {
            display: inline-flex; align-items: center; gap: 6px;
            margin-top: 14px; padding: 8px 10px; border-radius: 8px;
            border: 1px dashed var(--border-slate-200);
            color: #3b82f6; font-size: 11.5px; font-weight: 700;
            text-decoration: none;
          }
          .pa-dt-link:hover {
            border-style: solid; border-color: #bfdbfe;
            background: rgba(59,130,246,0.06);
          }

          /* The fields a template will ask for. */
          .pa-token-list { display: flex; flex-wrap: wrap; gap: 5px; }
          .pa-token-chip {
            display: inline-flex; align-items: center; gap: 3px;
            padding: 3px 8px; border-radius: 999px;
            border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            color: var(--text-slate-600);
            font-size: 11px; font-weight: 600;
          }
          .pa-token-chip.is-required {
            border-color: rgba(59,130,246,0.35);
            background: rgba(59,130,246,0.08);
            color: #1d4ed8;
          }
          .pa-token-chip b { color: #ef4444; }
          [data-theme='dark'] .pa-token-chip { background: #111720; border-color: #2d3748; }

          @media (max-width: 1024px) {
            /* Stack: the document needs the width more than the metadata does. */
            .pa-detail { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
            .pa-detail-side {
              border-right: none;
              border-bottom: 1px solid var(--border-slate-200);
              max-height: 40vh;
            }
          }

          /* ══ The list rail ═══════════════════════════════════════════
           * A saved-view sidebar beside a list page. The rail scrolls on its
           * own and the table scrolls on its own, so a long list of document
           * types never pushes the pager off the screen. */
          .pa-list-split {
            flex: 1; min-height: 0;
            display: grid;
            grid-template-columns: 232px minmax(0, 1fr);
          }
          .pa-list-main {
            min-width: 0; min-height: 0;
            display: flex; flex-direction: column;
          }
          .pa-rail {
            min-height: 0;
            display: flex; flex-direction: column;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50, #f8fafc);
          }
          [data-theme='dark'] .pa-rail {
            background: #0f1419; border-right-color: #1f2937;
          }
          .pa-rail-scroll {
            flex: 1; min-height: 0; overflow-y: auto;
            padding: 12px 10px;
          }
          .pa-rail-scroll::-webkit-scrollbar { width: 5px; }
          .pa-rail-scroll::-webkit-scrollbar-thumb {
            background: var(--border-slate-200); border-radius: 3px;
          }
          .pa-rail-label {
            font-size: 10px; font-weight: 800; letter-spacing: 0.08em;
            text-transform: uppercase; color: var(--text-slate-400);
            padding: 0 8px; margin-bottom: 6px;
          }
          .pa-rail-list { display: flex; flex-direction: column; gap: 1px; }
          .pa-rail-item {
            display: flex; align-items: center; gap: 9px;
            width: 100%; padding: 7px 8px;
            border: none; border-radius: 8px; background: transparent;
            font-family: inherit; font-size: 12.5px; font-weight: 600;
            color: var(--text-slate-600); text-align: left; cursor: pointer;
            transition: background 0.12s, color 0.12s;
          }
          .pa-rail-item:hover {
            background: color-mix(in srgb, #3b82f6 8%, transparent);
            color: #3b82f6;
          }
          .pa-rail-item.is-on {
            position: relative;
            background: color-mix(in srgb, #3b82f6 13%, transparent);
            color: #3b82f6;
          }
          .pa-rail-item.is-on::before {
            content: ""; position: absolute; left: 0; top: 7px; bottom: 7px;
            width: 3px; border-radius: 0 3px 3px 0;
            background: linear-gradient(180deg, #3b82f6 0%, #6366f1 100%);
          }
          .pa-rail-icon {
            width: 18px; flex-shrink: 0;
            display: inline-flex; align-items: center; justify-content: center;
          }
          /* Two letters of the code, so a type is identifiable before you read
             its name — the same trick an avatar plays for a person. */
          .pa-rail-code {
            width: 18px; height: 18px; flex-shrink: 0; border-radius: 5px;
            display: inline-flex; align-items: center; justify-content: center;
            background: rgba(59,130,246,0.12); color: #3b82f6;
            font-size: 9px; font-weight: 800; letter-spacing: 0.02em;
          }
          .pa-rail-text {
            flex: 1; min-width: 0;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          /* A row with a second line — what the section is for, so Settings
             does not need a paragraph of explanation above it. */
          .pa-rail-item.is-stacked { align-items: flex-start; padding: 9px 8px; }
          .pa-rail-item.is-stacked .pa-rail-icon { margin-top: 1px; }
          .pa-rail-item.is-stacked .pa-rail-text {
            display: flex; flex-direction: column; gap: 2px; white-space: normal;
          }
          .pa-rail-hint {
            font-size: 10.5px; font-weight: 500; line-height: 1.35;
            color: var(--text-slate-400);
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          }
          .pa-rail-item.is-on .pa-rail-hint {
            color: color-mix(in srgb, #3b82f6 62%, var(--text-slate-500));
          }
          .pa-rail-count {
            flex-shrink: 0; min-width: 20px; padding: 0 6px; height: 18px;
            display: inline-flex; align-items: center; justify-content: center;
            border-radius: 999px;
            background: var(--bg-pure-white);
            border: 1px solid var(--border-slate-200);
            color: var(--text-slate-500);
            font-size: 10.5px; font-weight: 800;
            font-variant-numeric: tabular-nums;
          }
          [data-theme='dark'] .pa-rail-count { background: #111720; border-color: #2d3748; }
          .pa-rail-item.is-on .pa-rail-count {
            background: #3b82f6; border-color: #3b82f6; color: #fff;
          }
          .pa-rail-note {
            display: flex; align-items: center; gap: 7px;
            width: 100%; margin-top: 10px; padding: 8px 9px;
            border-radius: 8px; cursor: pointer; text-align: left;
            border: 1px solid rgba(245,158,11,0.35);
            background: rgba(245,158,11,0.08);
            color: #b45309; font-family: inherit;
            font-size: 11.5px; font-weight: 600; line-height: 1.35;
          }
          .pa-rail-note > svg { flex: none; }
          .pa-rail-empty {
            display: block; padding: 8px 9px;
            font-size: 11.5px; line-height: 1.4;
            color: var(--text-slate-400); text-decoration: none;
          }
          .pa-rail-empty:hover { color: #3b82f6; }
          .pa-rail-foot {
            flex-shrink: 0; padding: 8px 10px;
            border-top: 1px solid var(--border-slate-200);
          }
          [data-theme='dark'] .pa-rail-foot { border-top-color: #1f2937; }
          .pa-rail-clear {
            display: inline-flex; align-items: center; gap: 6px;
            width: 100%; height: 28px; padding: 0 9px;
            border: 1px dashed var(--border-slate-200); border-radius: 8px;
            background: transparent; color: var(--text-slate-500);
            font-family: inherit; font-size: 11px; font-weight: 700;
            cursor: pointer; text-decoration: none;
            transition: background 0.12s, border-color 0.12s, color 0.12s;
          }
          .pa-rail-clear:hover {
            color: #1d4ed8; border-style: solid;
            border-color: rgba(59,130,246,0.45);
            background: rgba(59,130,246,0.06);
          }
          @media (max-width: 1100px) {
            /* Below this the table needs every pixel; the rail's selections are
               all reachable from the filter pills above the table. */
            .pa-list-split { grid-template-columns: 1fr; }
            .pa-rail { display: none; }
            /* EXCEPT where the rail is the only way to switch section. Settings
               has no filter pills to fall back on, so it becomes a strip along
               the top instead of vanishing. */
            .pa-list-split.is-keep-rail {
              grid-template-columns: 1fr;
              grid-template-rows: auto minmax(0, 1fr);
            }
            .pa-list-split.is-keep-rail > .pa-rail {
              display: block;
              border-right: none;
              border-bottom: 1px solid var(--border-slate-200);
            }
            .pa-list-split.is-keep-rail .pa-rail-scroll {
              display: flex; align-items: center; gap: 8px;
              overflow-x: auto; overflow-y: hidden; padding: 8px 10px;
            }
            .pa-list-split.is-keep-rail .pa-rail-label { display: none; }
            .pa-list-split.is-keep-rail .pa-rail-list {
              flex-direction: row; gap: 6px;
            }
            .pa-list-split.is-keep-rail .pa-rail-item { width: auto; white-space: nowrap; }
            .pa-list-split.is-keep-rail .pa-rail-hint { display: none; }
          }

          /* A list page is header + bands + table + footer, and only the table
             scrolls — so the pager is always where you left it. */
          .pa-list-page {
            flex: 1; min-height: 0;
            display: flex; flex-direction: column;
          }

          .pa-editor-hint {
            font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
            color: var(--text-slate-400); text-transform: none;
          }
          @media (max-width: 1500px) {
            /* Not enough width for an A4 sheet AND a preview of one. The two
               SWAP rather than the preview vanishing — the toggle lives in the
               page header, so it stays reachable either way. */
            .pa-compose.is-split { grid-template-columns: minmax(300px, 360px) 1fr; }
            .pa-compose.is-split > .pa-editor-pane { display: none; }
          }
          @media (max-width: 1100px) {
            .pa-compose, .pa-compose.is-split { grid-template-columns: 1fr; }
            .pa-editor-pane { border-left: none; min-height: 70vh; }
            .pa-split { grid-template-columns: 1fr; }
            .pa-split-form {
              border-right: none;
              border-bottom: 1px solid var(--border-slate-200);
            }
            .pa-preview { min-height: 70vh; }
            .pa-grid-2 { grid-template-columns: 1fr; }
          }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
