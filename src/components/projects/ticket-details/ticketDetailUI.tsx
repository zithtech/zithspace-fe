"use client";

import React from "react";
import { Avatar, Typography } from "antd";

const { Text } = Typography;

/* ------------------------------------------------------------------ */
/* Tone system                                                         */
/* Palette is deliberately narrow: blue = active/primary, green =       */
/* complete/positive, ash = neutral metadata. Red is reserved for       */
/* destructive actions only.                                            */
/* ------------------------------------------------------------------ */

export type Tone = "ash" | "blue" | "green";

export const statusTone = (status?: string): Tone => {
  const s = (status || "").toLowerCase().replace(/ /g, "_");
  if (s === "completed" || s === "live") return "green";
  if (s === "not_started" || s === "pause" || s === "") return "ash";
  return "blue";
};

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

interface PillProps {
  tone?: Tone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  mono?: boolean;
  strong?: boolean;
}

export function Pill({ tone = "ash", icon, children, mono, strong }: PillProps) {
  return (
    <span className={`tdx-pill tdx-pill--${tone}${mono ? " tdx-pill--mono" : ""}${strong ? " tdx-pill--strong" : ""}`}>
      {icon && <span className="tdx-pill__icon">{icon}</span>}
      {children}
    </span>
  );
}

/** Priority as signal strength — keeps severity legible without leaving the palette. */
export function PriorityMeter({ priority }: { priority?: string }) {
  const level = priority === "P1" ? 3 : priority === "P2" ? 2 : priority === "P3" ? 1 : 0;

  return (
    <span className="tdx-priority" title={priority ? `Priority ${priority}` : "No priority"}>
      <span className="tdx-priority__bars">
        {[1, 2, 3].map((bar) => (
          <i key={bar} className={bar <= level ? "is-on" : ""} style={{ height: 4 + bar * 2 }} />
        ))}
      </span>
      <span className="tdx-priority__label">{priority || "None"}</span>
    </span>
  );
}

interface SectionCardProps {
  title: string;
  icon?: React.ReactNode;
  count?: number | string;
  action?: React.ReactNode;
  children: React.ReactNode;
  flush?: boolean;
  className?: string;
}

export function SectionCard({ title, icon, count, action, children, flush, className }: SectionCardProps) {
  return (
    <section className={`tdx-card${className ? ` ${className}` : ""}`}>
      <header className="tdx-card__head">
        <div className="tdx-card__title">
          {icon && <span className="tdx-card__icon">{icon}</span>}
          <span>{title}</span>
          {count !== undefined && count !== null && <span className="tdx-card__count">{count}</span>}
        </div>
        {action && <div className="tdx-card__action">{action}</div>}
      </header>
      <div className={flush ? "tdx-card__body tdx-card__body--flush" : "tdx-card__body"}>{children}</div>
    </section>
  );
}

export function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="tdx-prop">
      <span className="tdx-prop__label">{label}</span>
      <span className="tdx-prop__value">{children}</span>
    </div>
  );
}

interface PersonChipProps {
  name?: string;
  role?: string;
  avatarUrl?: string;
  fallbackLabel?: string;
}

export function PersonChip({ name, role, avatarUrl, fallbackLabel = "Unassigned" }: PersonChipProps) {
  if (!name) {
    return (
      <span className="tdx-person tdx-person--empty">
        <span className="tdx-person__ghost" />
        <span className="tdx-person__name">{fallbackLabel}</span>
      </span>
    );
  }

  return (
    <span className="tdx-person">
      <Avatar size={26} src={avatarUrl} className="tdx-person__avatar">
        {name.charAt(0).toUpperCase()}
      </Avatar>
      <span className="tdx-person__text">
        <span className="tdx-person__name">{name}</span>
        {role && <span className="tdx-person__role">{role}</span>}
      </span>
    </span>
  );
}

export function EmptyState({ icon, title, hint }: { icon?: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="tdx-empty">
      {icon && <span className="tdx-empty__icon">{icon}</span>}
      <Text className="tdx-empty__title">{title}</Text>
      {hint && <Text className="tdx-empty__hint">{hint}</Text>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Styles — one global sheet shared by every ticket-detail surface.     */
/* ------------------------------------------------------------------ */

export function TicketDetailStyles() {
  return (
    <style jsx global>{`
      .tdx {
        --tdx-accent: #3b82f6;
        --tdx-accent-hover: #2563eb;
        --tdx-accent-soft: rgba(59, 130, 246, 0.09);
        --tdx-accent-line: rgba(59, 130, 246, 0.22);
        --tdx-done: #10b981;
        --tdx-done-soft: rgba(16, 185, 129, 0.1);
        --tdx-done-line: rgba(16, 185, 129, 0.24);
        --tdx-surface: var(--bg-secondary);
        --tdx-canvas: var(--bg-primary);
        --tdx-inset: #f8fafc;
        --tdx-line: var(--border-slate-200);
        --tdx-line-soft: var(--border-slate-100);
        --tdx-ink: var(--text-slate-900);
        --tdx-ink-2: var(--text-slate-600);
        --tdx-ink-3: var(--text-slate-400);
        --tdx-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.05);
        --tdx-shadow-lg: 0 12px 28px -12px rgba(15, 23, 42, 0.16);
        --tdx-radius: 14px;
      }

      [data-theme="dark"] .tdx {
        --tdx-accent: #60a5fa;
        --tdx-accent-hover: #93c5fd;
        --tdx-accent-soft: rgba(96, 165, 250, 0.12);
        --tdx-accent-line: rgba(96, 165, 250, 0.28);
        --tdx-done: #34d399;
        --tdx-done-soft: rgba(52, 211, 153, 0.13);
        --tdx-done-line: rgba(52, 211, 153, 0.28);
        --tdx-inset: #0f141f;
        --tdx-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3);
        --tdx-shadow-lg: 0 12px 28px -12px rgba(0, 0, 0, 0.6);
      }

      /* ---------- Pills ---------- */
      .tdx-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 24px;
        padding: 0 9px;
        border-radius: 7px;
        font-size: 12px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: 0.005em;
        white-space: nowrap;
        border: 1px solid transparent;
        background: var(--tdx-inset);
        color: var(--tdx-ink-2);
        border-color: var(--tdx-line-soft);
      }
      .tdx-pill--mono {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 11.5px;
        letter-spacing: 0.02em;
      }
      .tdx-pill--strong {
        font-weight: 600;
      }
      .tdx-pill--blue {
        background: var(--tdx-accent-soft);
        color: var(--tdx-accent);
        border-color: var(--tdx-accent-line);
      }
      .tdx-pill--green {
        background: var(--tdx-done-soft);
        color: var(--tdx-done);
        border-color: var(--tdx-done-line);
      }
      .tdx-pill__icon {
        display: inline-flex;
        opacity: 0.85;
      }

      /* ---------- Priority meter ---------- */
      .tdx-priority {
        display: inline-flex;
        align-items: center;
        gap: 7px;
      }
      .tdx-priority__bars {
        display: inline-flex;
        align-items: flex-end;
        gap: 2px;
        height: 10px;
      }
      .tdx-priority__bars i {
        width: 3px;
        border-radius: 1px;
        background: var(--tdx-line);
        display: block;
      }
      .tdx-priority__bars i.is-on {
        background: var(--tdx-accent);
      }
      .tdx-priority__label {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--tdx-ink);
      }

      /* ---------- Card ---------- */
      .tdx-card {
        background: var(--tdx-surface);
        border: 1px solid var(--tdx-line-soft);
        border-radius: var(--tdx-radius);
        box-shadow: var(--tdx-shadow);
        overflow: hidden;
      }
      .tdx-card__head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--tdx-line-soft);
        min-height: 48px;
      }
      .tdx-card__title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        color: var(--tdx-ink-2);
      }
      .tdx-card__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: var(--tdx-accent-soft);
        color: var(--tdx-accent);
      }
      .tdx-card__count {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        height: 18px;
        padding: 0 6px;
        border-radius: 5px;
        background: var(--tdx-inset);
        border: 1px solid var(--tdx-line-soft);
        color: var(--tdx-ink-3);
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .tdx-card__body {
        padding: 16px;
      }
      .tdx-card__body--flush {
        padding: 0;
      }

      /* ---------- Property rows ---------- */
      .tdx-props {
        display: flex;
        flex-direction: column;
      }
      .tdx-prop {
        display: grid;
        grid-template-columns: 116px minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        padding: 9px 16px;
        border-radius: 8px;
        min-height: 40px;
        transition: background 0.15s ease;
      }
      .tdx-prop:hover {
        background: var(--tdx-inset);
      }
      .tdx-prop__label {
        font-size: 12px;
        font-weight: 500;
        color: var(--tdx-ink-3);
      }
      .tdx-prop__value {
        font-size: 13px;
        font-weight: 500;
        color: var(--tdx-ink);
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      /* ---------- Person ---------- */
      .tdx-person {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .tdx-person__avatar {
        flex-shrink: 0;
        background: var(--tdx-accent-soft) !important;
        color: var(--tdx-accent) !important;
        font-size: 11px !important;
        font-weight: 700;
        border: 1px solid var(--tdx-accent-line);
      }
      .tdx-person__ghost {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        border: 1px dashed var(--tdx-line);
        flex-shrink: 0;
      }
      .tdx-person__text {
        display: flex;
        flex-direction: column;
        line-height: 1.25;
        min-width: 0;
      }
      .tdx-person__name {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--tdx-ink);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tdx-person--empty .tdx-person__name {
        color: var(--tdx-ink-3);
        font-weight: 500;
      }
      .tdx-person__role {
        font-size: 10.5px;
        color: var(--tdx-ink-3);
        letter-spacing: 0.01em;
      }

      /* ---------- Empty state ---------- */
      .tdx-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 26px 16px;
        border: 1px dashed var(--tdx-line);
        border-radius: 10px;
        background: var(--tdx-inset);
        text-align: center;
      }
      .tdx-empty__icon {
        display: inline-flex;
        color: var(--tdx-ink-3);
        opacity: 0.7;
      }
      .tdx-empty__title {
        font-size: 12.5px !important;
        font-weight: 600 !important;
        color: var(--tdx-ink-2) !important;
      }
      .tdx-empty__hint {
        font-size: 11.5px !important;
        color: var(--tdx-ink-3) !important;
      }

      /* ---------- Ghost / quiet buttons ---------- */
      .tdx-btn-quiet.ant-btn {
        height: 28px;
        padding: 0 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--tdx-accent);
        border: 1px solid transparent;
        background: transparent;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .tdx-btn-quiet.ant-btn:hover {
        background: var(--tdx-accent-soft) !important;
        color: var(--tdx-accent-hover) !important;
        border-color: var(--tdx-accent-line) !important;
      }
    `}</style>
  );
}
