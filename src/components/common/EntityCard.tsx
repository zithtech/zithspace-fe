"use client";

/**
 * EntityCard — the project-list card, extracted so other modules can use it.
 *
 * The visual language is lifted verbatim from the Projects → Manage list
 * (`.pm2-list-card` and friends): square corners, avatar + title + meta line in
 * the header, a tinted status pill, and a shaded footer carrying a clamped
 * description above a row of key/value facts.
 *
 * Class names are namespaced `zc-` rather than reusing `pm2-`. Those rules live
 * in a `<style jsx global>` block inside the Projects page, so they exist only
 * while that page is mounted — borrowing the names would mean a card that looks
 * right or wrong depending on which page you had visited previously. The values
 * below are copied from that block so the two render identically.
 */

import React from "react";
import { Typography } from "antd";

const { Paragraph } = Typography;

export interface EntityCardFact {
  /** Small grey label, e.g. "Manager:". */
  label: string;
  value: React.ReactNode;
}

export interface EntityCardProps {
  /** Two-letter block shown in the avatar. */
  initials: string;
  /** Drives the avatar and the status pill tint. */
  accent?: string;
  title: React.ReactNode;
  /** The `key: value` line under the title. */
  metaLabel?: string;
  metaValue?: React.ReactNode;
  /** Small uppercase pill at the end of the meta line. */
  status?: string | null;
  description?: string | null;
  /** Footer facts, rendered with hairline dividers between them. */
  facts?: EntityCardFact[];
  /** Right-aligned control in the header (a menu, usually). */
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export default function EntityCard({
  initials,
  accent = "#3b82f6",
  title,
  metaLabel,
  metaValue,
  status,
  description,
  facts = [],
  actions,
  onClick,
  className,
}: EntityCardProps) {
  const clickable = typeof onClick === "function";

  return (
    <article className={`zc-card${className ? ` ${className}` : ""}`}>
      <header className="zc-card-head">
        <div
          className="zc-card-row"
          role={clickable ? "button" : undefined}
          tabIndex={clickable ? 0 : undefined}
          onClick={onClick}
          onKeyDown={(event) => {
            // A div given role="button" has to answer to the keyboard itself.
            if (!clickable) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onClick?.();
            }
          }}
          style={{ cursor: clickable ? "pointer" : "default" }}
        >
          <div
            className="zc-card-avatar"
            style={{ background: accent, borderColor: `${accent}66`, color: "#ffffff" }}
          >
            <span className="zc-card-avatar-letter">{initials}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
            <span className="zc-card-title">{title}</span>
            {(metaLabel || metaValue || status) && (
              <span className="zc-card-meta">
                {metaLabel && <span className="zc-card-meta-key">{metaLabel}</span>}
                {metaValue && <span className="zc-card-meta-val">{metaValue}</span>}
                {status && (
                  <span
                    className="zc-card-status"
                    style={{ background: `${accent}12`, borderColor: `${accent}30`, color: accent }}
                  >
                    {status}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {actions && (
          <div className="zc-card-more" onClick={(event) => event.stopPropagation()}>
            {actions}
          </div>
        )}
      </header>

      <div className="zc-card-foot">
        <div className="zc-card-foot-row">
          <Paragraph
            style={{ fontSize: 12.5, color: "var(--text-slate-500)", margin: 0, lineHeight: 1.5, minHeight: 36 }}
            ellipsis={{ rows: 2 }}
          >
            {description || "No description provided."}
          </Paragraph>
        </div>

        {facts.length > 0 && (
          <div className="zc-card-foot-row">
            {facts.map((fact, index) => (
              <React.Fragment key={fact.label}>
                {index > 0 && <span className="zc-card-foot-div" />}
                <span className="zc-card-foot-item">
                  <span className="zc-card-foot-key">{fact.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-slate-700)" }}>
                    {fact.value}
                  </span>
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .zc-card {
          position: relative;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200);
          border-radius: 0px;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
          overflow: hidden;
          transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
        }
        [data-theme="dark"] .zc-card {
          background: #0b0f1a;
          border-color: #374151;
        }
        .zc-card:hover {
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.06);
          border-color: #cbd5e1;
        }
        [data-theme="dark"] .zc-card:hover {
          background: #0b0f1a;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
          border-color: #cbd5e1;
        }

        .zc-card-head {
          display: flex;
          align-items: center;
          padding: 8px 12px;
        }
        .zc-card-row {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .zc-card-row:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .zc-card-avatar {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: 1px solid;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: -0.025em;
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }
        .zc-card-avatar::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 75% 0%, rgba(255, 255, 255, 0.2), transparent 55%),
            radial-gradient(circle at 0% 100%, rgba(0, 0, 0, 0.06), transparent 55%);
          pointer-events: none;
        }
        .zc-card-avatar-letter {
          position: relative;
          z-index: 1;
          line-height: 1;
        }

        .zc-card-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 2px;
        }
        .zc-card-meta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          min-width: 0;
        }
        .zc-card-meta-key {
          color: var(--text-slate-400);
          font-weight: 600;
          flex-shrink: 0;
        }
        .zc-card-meta-val {
          color: var(--text-slate-700);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .zc-card-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 9px;
          border-radius: 0px;
          border: 1px solid;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }

        .zc-card-more {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: 8px;
        }

        .zc-card-foot {
          display: flex;
          flex-direction: column;
          padding: 0;
          border-top: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50);
          margin-top: auto;
        }
        [data-theme="dark"] .zc-card-foot {
          border-top-color: #374151;
          background: rgba(255, 255, 255, 0.02);
        }
        .zc-card-foot-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          padding: 8px 12px;
        }
        .zc-card-foot-row + .zc-card-foot-row {
          border-top: 1px solid var(--border-slate-200);
        }
        [data-theme="dark"] .zc-card-foot-row + .zc-card-foot-row {
          border-top-color: #374151;
        }
        .zc-card-foot-item {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: var(--text-slate-700);
        }
        .zc-card-foot-key {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-slate-400);
        }
        .zc-card-foot-div {
          width: 1px;
          height: 11px;
          background: var(--border-slate-300, #cbd5e1);
        }
      `}</style>
    </article>
  );
}
