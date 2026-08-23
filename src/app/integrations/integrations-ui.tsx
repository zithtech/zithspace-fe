"use client";

/**
 * Presentation layer for the Integrations page — brand marks, the connection
 * card, and the scoped stylesheet. All wiring stays in page.tsx.
 *
 * Palette: blue (primary), green (connected), ash/gray (neutral), light red
 * for disconnect only. Vendor logos keep their own colours.
 */

import React from "react";
import { Check, Plug, RefreshCw, Repeat2, Unplug, Users } from "lucide-react";

/* ────────────────────────── Brand marks ────────────────────────── */

export function GoogleMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export function MicrosoftMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  );
}

export function ZohoMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#E42527"
        d="M5.4 4.6h11.2c.6 0 .95.68.6 1.17L9.86 16.1h6.9c.44 0 .8.36.8.8v1.7c0 .44-.36.8-.8.8H5.2c-.6 0-.95-.68-.6-1.17L11.94 7.1H5.4a.8.8 0 0 1-.8-.8V5.4c0-.44.36-.8.8-.8z"
      />
      <rect x="4.6" y="20.4" width="3.4" height="1.5" rx=".5" fill="#226DB4" />
      <rect x="9.1" y="20.4" width="3.4" height="1.5" rx=".5" fill="#F9B21D" />
      <rect x="13.6" y="20.4" width="3.4" height="1.5" rx=".5" fill="#089949" />
    </svg>
  );
}

/* ────────────────────────── Card ────────────────────────── */

export type CardState = "connected" | "available" | "switchable";

export interface IntegrationCardProps {
  mark: React.ReactNode;
  name: string;
  category: string;
  description: string;
  state: CardState;
  /** e.g. "Synced 4m ago" */
  detail?: React.ReactNode;
  /** Name of the account holding the connection. */
  accountName?: string | null;
  busy?: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  disabled?: boolean;
  disabledReason?: string;
}

export function IntegrationCard({
  mark,
  name,
  category,
  description,
  state,
  detail,
  accountName,
  busy,
  onConnect,
  onDisconnect,
  disabled,
  disabledReason,
}: IntegrationCardProps) {
  const connected = state === "connected";

  return (
    <article className={`intg-card ${connected ? "is-connected" : ""}`}>
      <span className="intg-card-sheen" aria-hidden />

      <header className="intg-card-top">
        <span className="intg-logo">{mark}</span>

        <div className="intg-card-id">
          <div className="intg-card-name">{name}</div>
          <div className="intg-card-cat">{category}</div>
        </div>

        <span className={`intg-pill ${connected ? "is-ok" : "is-idle"}`}>
          {connected && <span className="intg-pill-dot" />}
          {connected ? "Connected" : "Available"}
        </span>
      </header>

      <p className="intg-card-desc">{description}</p>

      <div className="intg-card-meta">
        {connected ? (
          <>
            <span className="intg-meta-item">
              <Users size={12} />
              {accountName || "1 account"}
            </span>
            {detail && (
              <span className="intg-meta-item">
                <RefreshCw size={12} />
                {detail}
              </span>
            )}
          </>
        ) : (
          <span className="intg-meta-item is-muted">
            <Plug size={12} />
            No account linked
          </span>
        )}
      </div>

      <footer className="intg-card-foot">
        {connected ? (
          <>
            <span className="intg-ok">
              <Check size={12} />
              Active
            </span>
            <button
              className="intg-btn is-danger"
              onClick={onDisconnect}
              disabled={busy}
              title={`Disconnect ${name}`}
            >
              <Unplug size={13} />
              {busy ? "Working…" : "Disconnect"}
            </button>
          </>
        ) : (
          <>
            <span className="intg-hint">
              {disabled ? disabledReason : state === "switchable" ? "Replaces the active provider" : "Takes about a minute"}
            </span>
            <button
              className={`intg-btn ${state === "switchable" ? "" : "is-primary"}`}
              onClick={onConnect}
              disabled={busy || disabled}
              title={disabled ? disabledReason : `Connect ${name}`}
            >
              {state === "switchable" ? <Repeat2 size={13} /> : <Plug size={13} />}
              {busy ? "Working…" : state === "switchable" ? "Switch" : "Connect"}
            </button>
          </>
        )}
      </footer>
    </article>
  );
}

/* ────────────────────────── Styles ────────────────────────── */

export const integrationStyles = `
.intg {
  --i-bg: #0B0F1A;
  --i-panel: #10151F;
  --i-soft: #141A26;
  --i-hover: #1A2231;
  --i-border: #1F2937;
  --i-border-strong: #2C3849;
  --i-text: #F1F5F9;
  --i-text-soft: #94A3B8;
  --i-text-muted: #64748B;
  --i-accent: #3B82F6;
  --i-accent-soft: rgba(59,130,246,0.14);
  --i-success: #10B981;
  --i-success-soft: rgba(16,185,129,0.14);
  --i-danger: #EF4444;
  --i-plate: #FFFFFF;
  --i-shadow: 0 18px 40px rgba(8,12,24,0.28);

  min-height: calc(100vh - 64px);
  background: var(--i-bg);
  color: var(--i-text);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  letter-spacing: -0.01em;
}
.intg-light.intg {
  --i-bg: #FFFFFF;
  --i-panel: #FFFFFF;
  --i-soft: #F8FAFC;
  --i-hover: #F1F5F9;
  --i-border: #E5E7EB;
  --i-border-strong: #CBD5E1;
  --i-text: #0F172A;
  --i-text-soft: #475569;
  --i-text-muted: #94A3B8;
  --i-accent: #2563EB;
  --i-accent-soft: rgba(37,99,235,0.10);
  --i-success-soft: rgba(16,185,129,0.10);
  --i-plate: #F1F5F9;
  --i-shadow: 0 14px 34px rgba(15,23,42,0.10);
}

/* ── Hero ── */
.intg-hero {
  position: relative;
  padding: 13px 26px 11px;
  border-bottom: 1px solid var(--i-border);
  overflow: hidden;
}
.intg-hero-glow {
  position: absolute; inset: 0;
  background:
    radial-gradient(60% 130% at 92% -30%, rgba(59,130,246,0.18) 0%, transparent 62%),
    radial-gradient(46% 120% at 3% 130%, rgba(16,185,129,0.13) 0%, transparent 62%);
  pointer-events: none;
}
.intg-light .intg-hero-glow { opacity: 0.55; }

.intg-hero-row {
  position: relative;
  display: flex; align-items: flex-start; gap: 12px; flex-wrap: wrap;
}
.intg-hero-mark {
  width: 34px; height: 34px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 14px;
  background: var(--i-accent-soft);
  border: 1px solid color-mix(in oklab, var(--i-accent) 32%, transparent);
  color: var(--i-accent);
}
.intg-hero-text { flex: 1; min-width: 260px; }
.intg-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--i-accent);
  margin-bottom: 5px;
}
.intg-eyebrow-dot {
  width: 5px; height: 5px; border-radius: 999px;
  background: var(--i-accent);
  box-shadow: 0 0 0 3px var(--i-accent-soft);
}
/* Title and lede share one line, split by a hairline divider. */
.intg-titlerow {
  display: flex; align-items: center; gap: 13px;
  flex-wrap: wrap; row-gap: 4px;
}
.intg-h1 {
  margin: 0;
  font-size: 18.5px; font-weight: 650; line-height: 1.2;
  letter-spacing: -0.03em; color: var(--i-text);
}
.intg-divider {
  width: 1px; height: 16px; flex-shrink: 0;
  background: var(--i-border-strong);
}
.intg-lede {
  margin: 0;
  font-size: 12px; line-height: 1.45; color: var(--i-text-muted);
  max-width: 68ch;
}
.intg-hero-actions { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }

.intg-iconbtn {
  width: 32px; height: 32px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: var(--i-soft);
  border: 1px solid var(--i-border);
  color: var(--i-text-soft);
  cursor: pointer;
  transition: background 130ms ease, color 130ms ease, border-color 130ms ease;
}
.intg-iconbtn:hover:not(:disabled) {
  background: var(--i-hover); color: var(--i-text); border-color: var(--i-border-strong);
}
.intg-iconbtn:disabled { opacity: 0.6; cursor: default; }
.intg-spin { animation: intg-spin 900ms linear infinite; }
@keyframes intg-spin { to { transform: rotate(360deg); } }

/* ── Progress summary ── */
.intg-summary {
  position: relative;
  display: flex; align-items: center; gap: 18px; flex-wrap: wrap;
  margin-top: 10px;
  padding: 9px 12px;
  border-radius: 12px;
  border: 1px solid var(--i-border);
  background: var(--i-soft);
}
.intg-summary-main { display: flex; flex-direction: column; gap: 7px; min-width: 220px; flex: 1; }
.intg-summary-line {
  display: flex; align-items: baseline; gap: 8px;
  font-size: 12.5px; color: var(--i-text-muted);
}
.intg-summary-count {
  font-size: 16px; font-weight: 650; color: var(--i-text);
  font-variant-numeric: tabular-nums;
}
.intg-summary-rail {
  height: 5px; border-radius: 999px;
  background: color-mix(in oklab, var(--i-text-muted) 22%, transparent);
  overflow: hidden;
}
.intg-summary-rail span {
  display: block; height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--i-accent), var(--i-success));
  transition: width 300ms cubic-bezier(.4,0,.2,1);
}
.intg-summary-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.intg-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 9px;
  border-radius: 999px;
  border: 1px solid var(--i-border);
  background: var(--i-panel);
  color: var(--i-text-soft);
  font-size: 11px; font-weight: 500;
  white-space: nowrap;
}
.intg-chip svg { color: var(--i-text-muted); flex-shrink: 0; }
.intg-chip.is-ok {
  border-color: color-mix(in oklab, var(--i-success) 36%, transparent);
  background: var(--i-success-soft);
  color: var(--i-success);
  font-weight: 600;
}
.intg-chip.is-ok svg { color: var(--i-success); }
.intg-chip-logo {
  width: 16px; height: 16px;
  display: inline-flex; align-items: center; justify-content: center;
}

/* ── Toolbar ── */
.intg-toolbar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 26px;
  border-bottom: 1px solid var(--i-border);
  background: var(--i-soft);
  position: sticky; top: 0; z-index: 5;
}
.intg-search {
  flex: 1; min-width: 220px; max-width: 420px;
  display: flex; align-items: center; gap: 8px;
  height: 32px; padding: 0 10px;
  border-radius: 9px;
  border: 1px solid var(--i-border);
  background: var(--i-panel);
  color: var(--i-text-muted);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.intg-search:focus-within {
  border-color: var(--i-accent);
  box-shadow: 0 0 0 3px var(--i-accent-soft);
}
.intg-search input {
  flex: 1; min-width: 0;
  border: none; outline: none; background: transparent;
  color: var(--i-text); font-size: 13px;
}
.intg-search input::placeholder { color: var(--i-text-muted); }
.intg-search button {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px;
  border: none; border-radius: 999px;
  background: var(--i-hover); color: var(--i-text-soft);
  cursor: pointer;
}

.intg-seg {
  display: inline-flex; gap: 2px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--i-border);
  background: var(--i-panel);
}
.intg-seg-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px;
  border: none; border-radius: 7px;
  background: transparent;
  color: var(--i-text-muted);
  font-size: 12px; font-weight: 550;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.intg-seg-btn:hover { color: var(--i-text); }
.intg-seg-btn.is-active { background: var(--i-accent); color: #FFFFFF; }
.intg-seg-count {
  min-width: 17px; padding: 0 5px;
  border-radius: 999px;
  background: var(--i-soft);
  color: var(--i-text-muted);
  font-size: 10px; font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.intg-seg-btn.is-active .intg-seg-count { background: rgba(255,255,255,0.24); color: #FFFFFF; }

/* ── Body ── */
.intg-body { padding: 18px 26px 30px; }

.intg-section {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.intg-section:not(:first-child) { margin-top: 24px; }
.intg-section-icon {
  width: 22px; height: 22px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--i-accent-soft);
  color: var(--i-accent);
  border: 1px solid color-mix(in oklab, var(--i-accent) 26%, transparent);
}
.intg-section-title {
  font-size: 11px; font-weight: 650;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--i-text-soft);
}
.intg-section-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 17px; height: 17px; padding: 0 5px;
  border-radius: 999px;
  background: var(--i-soft);
  border: 1px solid var(--i-border);
  color: var(--i-text-muted);
  font-size: 10.5px; font-weight: 650;
}
.intg-section-hint {
  margin-left: auto;
  font-size: 11.5px; color: var(--i-text-muted);
}

.intg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(272px, 1fr));
  gap: 12px;
}

/* ── Card ── */
.intg-card {
  position: relative;
  display: flex; flex-direction: column; gap: 8px;
  padding: 14px;
  border-radius: 13px;
  border: 1px solid var(--i-border);
  background: var(--i-panel);
  overflow: hidden;
  transition: transform 150ms cubic-bezier(.4,0,.2,1), border-color 150ms ease, box-shadow 180ms ease;
}
.intg-light .intg-card { background: #FFFFFF; }
.intg-card-sheen {
  position: absolute; inset: 0;
  background: radial-gradient(120% 90% at 100% 0%, var(--i-accent-soft) 0%, transparent 58%);
  opacity: 0; transition: opacity 180ms ease; pointer-events: none;
}
.intg-card.is-connected .intg-card-sheen {
  background: radial-gradient(120% 90% at 100% 0%, var(--i-success-soft) 0%, transparent 58%);
  opacity: 1;
}
.intg-card:hover {
  transform: translateY(-3px);
  border-color: var(--i-border-strong);
  box-shadow: var(--i-shadow);
}
.intg-card:hover .intg-card-sheen { opacity: 1; }
.intg-card.is-connected {
  border-color: color-mix(in oklab, var(--i-success) 30%, var(--i-border));
}

.intg-card-top { position: relative; display: flex; align-items: center; gap: 10px; }
.intg-logo {
  width: 36px; height: 36px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: var(--i-plate);
  border: 1px solid var(--i-border-strong);
  box-shadow: 0 4px 14px rgba(8,12,24,0.18);
}
.intg-light .intg-logo { box-shadow: 0 2px 8px rgba(15,23,42,0.07); }
.intg-card-id { flex: 1; min-width: 0; }
.intg-card-name {
  font-size: 13.5px; font-weight: 620; color: var(--i-text);
  letter-spacing: -0.015em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.intg-card-cat {
  font-size: 10.5px; color: var(--i-text-muted);
  margin-top: 1px;
}
.intg-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px; font-weight: 650;
  letter-spacing: 0.08em; text-transform: uppercase;
  white-space: nowrap; flex-shrink: 0;
}
.intg-pill.is-ok {
  background: var(--i-success-soft);
  border: 1px solid color-mix(in oklab, var(--i-success) 34%, transparent);
  color: var(--i-success);
}
.intg-pill.is-idle {
  background: var(--i-soft);
  border: 1px solid var(--i-border);
  color: var(--i-text-muted);
}
.intg-pill-dot { width: 5px; height: 5px; border-radius: 999px; background: currentColor; }

.intg-card-desc {
  position: relative; margin: 0;
  font-size: 11.5px; line-height: 1.5; color: var(--i-text-soft);
  min-height: 34px;
}
.intg-card-meta {
  position: relative;
  display: flex; flex-wrap: wrap; gap: 6px;
}
.intg-meta-item {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--i-soft);
  border: 1px solid var(--i-border);
  color: var(--i-text-soft);
  font-size: 10.5px;
}
.intg-meta-item svg { color: var(--i-text-muted); }
.intg-meta-item.is-muted { color: var(--i-text-muted); }

.intg-card-foot {
  position: relative;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  margin-top: auto; padding-top: 9px;
  border-top: 1px solid var(--i-border);
}
.intg-ok {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--i-success);
}
.intg-hint { font-size: 11px; color: var(--i-text-muted); }

.intg-btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--i-border-strong);
  background: var(--i-soft);
  color: var(--i-text);
  font-size: 11.5px; font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 130ms ease, border-color 130ms ease, filter 130ms ease, transform 130ms ease;
}
.intg-btn:hover:not(:disabled) { background: var(--i-hover); transform: translateY(-1px); }
.intg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.intg-btn.is-primary {
  background: var(--i-accent); border-color: var(--i-accent); color: #FFFFFF;
}
.intg-btn.is-primary:hover:not(:disabled) { filter: brightness(1.08); background: var(--i-accent); }
.intg-btn.is-danger {
  background: rgba(239,68,68,0.10);
  border-color: rgba(239,68,68,0.30);
  color: var(--i-danger);
}
.intg-btn.is-danger:hover:not(:disabled) { background: rgba(239,68,68,0.16); }

/* ── Coming soon rail ── */
.intg-mini-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(186px, 1fr));
  gap: 8px;
}
.intg-mini {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--i-border);
  background: var(--i-soft);
  cursor: not-allowed;
  transition: border-color 140ms ease, background 140ms ease;
}
.intg-mini:hover { border-color: var(--i-border-strong); background: var(--i-hover); }
.intg-mini-logo {
  width: 28px; height: 28px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: var(--i-plate);
  border: 1px solid var(--i-border);
  filter: grayscale(1); opacity: 0.72;
  transition: filter 160ms ease, opacity 160ms ease;
}
.intg-mini:hover .intg-mini-logo { filter: grayscale(0); opacity: 1; }
.intg-mini-text { flex: 1; min-width: 0; }
.intg-mini-name {
  font-size: 12.5px; font-weight: 600; color: var(--i-text-soft);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.intg-mini-tag {
  font-size: 11px; color: var(--i-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.intg-mini-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--i-panel);
  border: 1px solid var(--i-border);
  color: var(--i-text-muted);
  font-size: 9.5px; font-weight: 650;
  letter-spacing: 0.08em; text-transform: uppercase;
}

/* ── Banner ── */
.intg-banner {
  display: flex; align-items: flex-start; gap: 11px;
  margin: 0 26px 14px;
  padding: 10px 13px;
  border-radius: 11px;
  border: 1px solid rgba(239,68,68,0.30);
  background: rgba(239,68,68,0.08);
}
.intg-banner svg { color: var(--i-danger); flex-shrink: 0; margin-top: 1px; }
.intg-banner-title { font-size: 13px; font-weight: 620; color: var(--i-text); margin-bottom: 2px; }
.intg-banner-sub { font-size: 12px; color: var(--i-text-soft); line-height: 1.5; }

/* ── Empty ── */
.intg-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 70px 20px; text-align: center;
  color: var(--i-text-muted);
}
.intg-empty > svg { margin-bottom: 4px; }
.intg-empty-title { font-size: 14px; font-weight: 600; color: var(--i-text-soft); }
.intg-empty-sub { font-size: 12.5px; max-width: 44ch; line-height: 1.55; }
.intg-empty-btn {
  margin-top: 12px; height: 32px; padding: 0 15px;
  border-radius: 9px;
  border: 1px solid var(--i-border-strong);
  background: var(--i-panel);
  color: var(--i-text);
  font-size: 12.5px; font-weight: 550;
  cursor: pointer;
}
.intg-empty-btn:hover { background: var(--i-hover); }

/* ── Skeleton ── */
.intg-skel {
  height: 150px;
  border-radius: 13px;
  border: 1px solid var(--i-border);
  background: linear-gradient(100deg, var(--i-soft) 30%, var(--i-hover) 50%, var(--i-soft) 70%);
  background-size: 220% 100%;
  animation: intg-shimmer 1.4s linear infinite;
}
@keyframes intg-shimmer { to { background-position: -220% 0; } }

/* ── Responsive ── */
@media (max-width: 720px) {
  .intg-divider { display: none; }
  .intg-hero, .intg-toolbar, .intg-body { padding-left: 16px; padding-right: 16px; }
  .intg-banner { margin-left: 16px; margin-right: 16px; }
  .intg-grid { grid-template-columns: 1fr; }
  .intg-seg { width: 100%; }
  .intg-seg-btn { flex: 1; justify-content: center; }
}
`;
