"use client";

/**
 * EntityCard — the Projects → Manage card, extracted so other modules can use it.
 *
 * The visual language is lifted from `.pm2-card`: an accent stripe along the
 * top edge, a tinted initials badge with a status pill opposite it, a one-line
 * title over a dot-separated meta line, an optional four-bar meter, and a
 * footer split between a people cluster and a right-aligned date.
 *
 * Class names are namespaced `zc-` rather than reusing `pm2-`. Those rules live
 * in a `<style jsx global>` block inside the Projects page, so they exist only
 * while that page is mounted — borrowing the names would mean a card that looks
 * right or wrong depending on which page you had visited previously. The values
 * below are copied from that block so the two render identically.
 */

import React from "react";

export interface EntityCardProps {
  /** Two-letter block in the tinted badge. */
  initials: string;
  /** Drives the stripe, the badge, the status pill and the meter. */
  accent?: string;
  title: React.ReactNode;
  /** The muted line under the title. Strings are joined with " · ". */
  meta?: React.ReactNode | Array<string | null | undefined | false>;
  /** Small pill opposite the badge. */
  status?: string | null;
  /**
   * The four-bar gauge. Projects read "% elapsed" here; anything with a
   * denominator reads the same way. Omit it and the row is dropped.
   */
  meter?: { percent: number; label: React.ReactNode };
  /** Footer, split left and right. Omit both and the footer is dropped. */
  footLeft?: React.ReactNode;
  footRight?: React.ReactNode;
  /** Right of the status pill — a menu or a couple of icon buttons. */
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function EntityCard({
  initials,
  accent = "#3b82f6",
  title,
  meta,
  status,
  meter,
  footLeft,
  footRight,
  actions,
  onClick,
  className,
}: EntityCardProps) {
  const clickable = typeof onClick === "function";
  const metaText = Array.isArray(meta) ? meta.filter(Boolean).join(" · ") : meta;

  return (
    <article
      className={`zc-card${className ? ` ${className}` : ""}`}
      style={{ ["--card-accent" as any]: accent }}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        // An article given role="button" has to answer to the keyboard itself.
        if (!clickable) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick?.();
        }
      }}
    >
      <span className="zc-card__stripe" />

      <div className="zc-card__top">
        <span className="zc-card__badge">{initials}</span>
        {status && (
          <span className="zc-card__status">
            <span className="zc-card__status-dot" />
            {status}
          </span>
        )}
        {actions && (
          <span className="zc-card__more" onClick={(event) => event.stopPropagation()}>
            {actions}
          </span>
        )}
      </div>

      <h3 className="zc-card__title" title={typeof title === "string" ? title : undefined}>
        {title}
      </h3>

      <p className="zc-card__meta">{metaText}</p>

      {meter && (
        <div className="zc-card__gauge">
          <span className="zc-card__bars">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`zc-card__bar${meter.percent >= i * 25 ? " is-on" : ""}`}
              />
            ))}
          </span>
          <span className="zc-card__gauge-label">{meter.label}</span>
        </div>
      )}

      {(footLeft || footRight) && (
        <div className="zc-card__foot">
          <span className="zc-card__footside">{footLeft}</span>
          <span className="zc-card__footside zc-card__footside--end">{footRight}</span>
        </div>
      )}

      <style jsx global>{`
        .zc-card {
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 10px;
          cursor: pointer;
          overflow: hidden;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .zc-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
        }
        .zc-card:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.16);
        }
        [data-theme='dark'] .zc-card {
          background: #0f1419;
          border-color: #1f2937;
        }
        [data-theme='dark'] .zc-card:hover { border-color: #334155; }

        /* The state reads twice: as a stripe along the top edge and as a pill. */
        .zc-card__stripe {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--card-accent, #3b82f6);
        }

        .zc-card__top { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
        .zc-card__badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: color-mix(in srgb, var(--card-accent, #3b82f6) 12%, transparent);
          color: var(--card-accent, #3b82f6);
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }
        .zc-card__status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-left: auto;
          height: 22px;
          padding: 0 9px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--card-accent, #3b82f6) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--card-accent, #3b82f6) 24%, transparent);
          color: var(--card-accent, #3b82f6);
          font-size: 11px;
          font-weight: 700;
          text-transform: capitalize;
          white-space: nowrap;
        }
        .zc-card__status-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        /* Without a status pill the actions still belong at the right edge. */
        .zc-card__status + .zc-card__more { margin-left: 0; }
        .zc-card__more { flex-shrink: 0; display: inline-flex; align-items: center; margin-left: auto; }

        .zc-card__title {
          margin: 0 0 4px;
          font-size: 14.5px;
          font-weight: 700;
          line-height: 1.3;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        [data-theme='dark'] .zc-card__title { color: #f1f5f9; }
        .zc-card__meta {
          margin: 0 0 12px;
          font-size: 12px;
          line-height: 1.45;
          color: var(--text-slate-500);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 34px;
        }

        .zc-card__gauge { display: flex; align-items: center; gap: 8px; padding-bottom: 12px; }
        .zc-card__bars { display: inline-flex; align-items: flex-end; gap: 2px; }
        .zc-card__bar { width: 4px; height: 12px; border-radius: 2px; background: var(--border-slate-200); }
        .zc-card__bar.is-on { background: var(--card-accent, #3b82f6); }
        [data-theme='dark'] .zc-card__bar { background: #1f2937; }
        .zc-card__gauge-label { font-size: 12px; font-weight: 500; color: var(--text-slate-600); }
        [data-theme='dark'] .zc-card__gauge-label { color: #94a3b8; }

        .zc-card__foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin: auto -14px 0;
          padding: 10px 14px;
          border-top: 1px solid var(--border-slate-100);
        }
        [data-theme='dark'] .zc-card__foot { border-top-color: #1f2937; }
        .zc-card__footside {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          font-size: 12px;
          color: var(--text-slate-600);
        }
        .zc-card__footside--end { justify-content: flex-end; text-align: right; white-space: nowrap; }

        /* Helpers the pages compose their footer out of. */
        .zc-av {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--bg-slate-100);
          color: var(--text-slate-600);
          border: 2px solid var(--bg-pure-white);
          font-size: 9.5px;
          font-weight: 800;
        }
        [data-theme='dark'] .zc-av { border-color: #0f1419; background: #1e293b; color: #cbd5e1; }
        .zc-foot-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-700);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-theme='dark'] .zc-foot-name { color: #cbd5e1; }
        .zc-foot-date {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-slate-700);
          font-variant-numeric: tabular-nums;
        }
        [data-theme='dark'] .zc-foot-date { color: #cbd5e1; }
        .zc-foot-note { font-size: 11px; color: var(--text-slate-400); }
      `}</style>
    </article>
  );
}
