"use client";

/**
 * Shared chrome for the Create-Ticket flow — the destination picker and every
 * follow-up popup after it (mode picker, Linear composer, …).
 *
 * One header, one card language, one footer, one set of tokens, so the whole
 * chain reads as a single guided flow instead of four unrelated dialogs.
 *
 * Palette stays blue / green / ash / gray. The only colour that escapes it is
 * a vendor's own logo mark, and those desaturate when the integration is not
 * available yet.
 */

import React from "react";
import Image from "next/image";
import ZukvoMark from "@/assets/logo/Zukvologo.png";
import { X } from "lucide-react";

/* ────────────────────────── Brand marks ────────────────────────── */

export function ZukvoLogo({ size = 22 }: { size?: number }) {
  return <Image src={ZukvoMark} alt="" width={size} height={size} unoptimized />;
}

export function LinearMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="#5E6AD2" aria-hidden>
      <path d="M1.22541 61.5228c-.2225-.9485.90748-1.5459 1.59638-.857L39.3342 97.1782c.6889.6889.0915 1.8189-.857 1.5964C20.0515 94.4522 5.54779 79.9485 1.22541 61.5228Z" />
      <path d="M.00189135 46.8891c-.01764375.2833.08887215.5599.28957165.7606L52.3503 99.7085c.2007.2007.4773.3072.7606.2896 2.3692-.1476 4.6938-.46 6.9624-.9259.7645-.157 1.0301-1.0963.4782-1.6481L2.57595 39.4485c-.55186-.5518-1.49117-.2863-1.648174.4782-.465915 2.2686-.77832 4.5932-.92588465 6.9624Z" />
      <path d="M4.21093 29.7054c-.16649.3738-.08169.8106.20765 1.1l64.77602 64.776c.2894.2894.7262.3742 1.1.2077 1.7861-.7956 3.5171-1.6927 5.1855-2.684.5521-.3281.6373-1.0884.1832-1.5425L8.43566 24.3367c-.45409-.4541-1.21437-.3689-1.54248.1832-.99132 1.6684-1.88843 3.3994-2.68425 5.1855Z" />
      <path d="M12.6587 18.074c-.3701-.3701-.3997-.9611-.0576-1.3575C21.7715 6.06915 35.0552 0 50 0 77.6142 0 100 22.3858 100 50c0 14.9448-6.0692 28.2285-16.7165 37.3989-.3964.3421-.9874.3125-1.3575-.0576L12.6587 18.074Z" />
    </svg>
  );
}

export function JiraMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#2684FF" aria-hidden>
      <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.001A1.001 1.001 0 0 0 23.013 0z" />
    </svg>
  );
}

export function GithubMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="#181717" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  );
}

export function SlackMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
      <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
      <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
      <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

export function NotionMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.727l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" fill="#000000" />
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933z" fill="#FFFFFF" />
    </svg>
  );
}

export function AzureMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0078D7" aria-hidden>
      <path d="M0 8.877L2.247 5.91l8.405-3.416V.022l7.37 5.393L2.966 8.338v8.225L0 15.707zm24-4.45v14.651l-5.753 4.9-9.303-3.057v3.056l-5.978-7.416 15.057 1.798V5.415z" />
    </svg>
  );
}

export function TrelloMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0052CC" aria-hidden>
      <path d="M21.147 0H2.853A2.86 2.86 0 0 0 0 2.853v18.294A2.86 2.86 0 0 0 2.853 24h18.294A2.86 2.86 0 0 0 24 21.147V2.853A2.86 2.86 0 0 0 21.147 0zM10.34 17.287a.953.953 0 0 1-.953.953h-4a.954.954 0 0 1-.954-.953V5.38a.953.953 0 0 1 .954-.953h4a.954.954 0 0 1 .953.953zm9.233-5.467a.944.944 0 0 1-.947.947h-4a.947.947 0 0 1-.947-.947V5.38a.953.953 0 0 1 .947-.953h4a.954.954 0 0 1 .947.953z" />
    </svg>
  );
}

/** The three stages every create-ticket branch walks through. */
export const TICKET_FLOW_STEPS = ["Destination", "Method", "Compose"];

/* ────────────────────────── Shell pieces ────────────────────────── */

export interface TicketFlowChip {
  icon?: React.ReactNode;
  label: React.ReactNode;
  tone?: "default" | "accent" | "ok";
}

export interface TicketFlowHeaderProps {
  /** Logo mark or icon shown in the plate at the top-left. */
  mark: React.ReactNode;
  /** Small uppercase breadcrumb above the title. */
  eyebrow: React.ReactNode;
  title: React.ReactNode;
  chips?: TicketFlowChip[];
  onClose?: () => void;
  /** Renders the mark on a white plate — use for dark logos like Zukvo. */
  plate?: boolean;
  /** Step labels for the wizard rail, e.g. ["Destination", "Method", "Compose"]. */
  steps?: string[];
  /** Zero-based index of the step this popup represents. */
  current?: number;
  /** Jump back to an already-completed step. Only completed steps are clickable. */
  onStepClick?: (index: number) => void;
  /** Go back one step. Renders a back button to the left of the mark. */
  onBack?: () => void;
}

export function TicketFlowHeader({
  mark,
  eyebrow,
  title,
  chips,
  onClose,
  plate = true,
  steps,
  current = 0,
  onStepClick,
  onBack,
}: TicketFlowHeaderProps) {
  return (
    <header className="tf-head">
      <div className="tf-head-glow" aria-hidden />

      <div className="tf-head-row">
        {onBack && (
          <button className="tf-back" onClick={onBack} aria-label="Back to previous step">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M19 12H5M11 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <div className={`tf-mark ${plate ? "tf-mark-plate" : ""}`}>{mark}</div>

        <div className="tf-head-text">
          <div className="tf-eyebrow">
            <span className="tf-eyebrow-dot" />
            {eyebrow}
          </div>
          <h2 className="tf-title">{title}</h2>
        </div>

        {!!chips?.length && (
          <div className="tf-head-meta">
            <span className="tf-head-divider" aria-hidden />
            <div className="tf-chips">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className={`tf-chip ${c.tone === "accent" ? "tf-chip-accent" : ""} ${
                    c.tone === "ok" ? "tf-chip-ok" : ""
                  }`}
                >
                  {c.icon}
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {onClose && (
          <button className="tf-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        )}
      </div>

      {!!steps?.length && (
        <nav className="tf-steps" aria-label="Progress">
          {steps.map((label, i) => {
            const done = i < current;
            const isCurrent = i === current;
            const clickable = done && !!onStepClick;
            return (
              <React.Fragment key={label}>
                {i > 0 && <span className={`tf-step-bar ${done || isCurrent ? "is-done" : ""}`} />}
                <button
                  type="button"
                  className={`tf-step ${done ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
                  onClick={clickable ? () => onStepClick(i) : undefined}
                  disabled={!clickable}
                  aria-current={isCurrent ? "step" : undefined}
                  title={clickable ? `Back to ${label}` : undefined}
                >
                  <span className="tf-step-dot">
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path
                          d="M20 6 9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="3.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </span>
                  {label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
      )}
    </header>
  );
}

export interface TicketFlowCardProps {
  mark: React.ReactNode;
  /** White plate behind the mark — for brand logos rather than line icons. */
  plate?: boolean;
  /** Accent colour for the tile, CTA and hover glow. */
  tone?: "blue" | "green" | "ash";
  badge?: { label: string; tone?: "ok" | "accent" | "muted"; dot?: boolean };
  name: React.ReactNode;
  sub: React.ReactNode;
  feats?: React.ReactNode[];
  cta: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

export function TicketFlowCard({
  mark,
  plate = false,
  tone = "blue",
  badge,
  name,
  sub,
  feats,
  cta,
  onClick,
  disabled,
}: TicketFlowCardProps) {
  return (
    <button
      className={`tf-card tf-tone-${tone}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      <span className="tf-card-sheen" aria-hidden />

      <div className="tf-card-top">
        <span className={`tf-logo ${plate ? "tf-logo-plate" : "tf-logo-tint"}`}>{mark}</span>
        <div className="tf-card-name">{name}</div>
        {badge && (
          <span
            className={`tf-badge ${
              badge.tone === "muted"
                ? "tf-badge-muted"
                : badge.tone === "accent"
                  ? "tf-badge-accent"
                  : "tf-badge-ok"
            }`}
          >
            {badge.dot && <span className="tf-badge-dot" />}
            {badge.label}
          </span>
        )}
      </div>

      <div className="tf-card-sub">{sub}</div>

      {!!feats?.length && (
        <ul className="tf-feats">
          {feats.map((f, i) => (
            <li key={i}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M20 6 9 17l-5-5"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      )}

      <div className="tf-card-cta">
        {cta}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  );
}

export interface TicketFlowBarProps {
  /** Brand mark for the destination currently in play. */
  mark: React.ReactNode;
  label: React.ReactNode;
  steps: string[];
  current: number;
  /** Jump to an already-completed step. */
  onStepClick?: (index: number) => void;
  onBack?: () => void;
  onClose: () => void;
}

/**
 * The one piece of chrome that never unmounts: it stays put while the body
 * below it swaps from step to step, so the popup never feels like it closed
 * and reopened.
 */
export function TicketFlowBar({
  mark,
  label,
  steps,
  current,
  onStepClick,
  onBack,
  onClose,
}: TicketFlowBarProps) {
  return (
    <div className="tf-bar">
      <div className="tf-bar-left">
        {onBack ? (
          <button className="tf-back" onClick={onBack} aria-label="Back one step">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M19 12H5M11 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : (
          <span className="tf-bar-mark">{mark}</span>
        )}
        <span className="tf-bar-label">{label}</span>
      </div>

      <nav className="tf-steps tf-steps-bar" aria-label="Progress">
        {steps.map((stepLabel, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const clickable = done && !!onStepClick;
          return (
            <React.Fragment key={stepLabel}>
              {i > 0 && <span className={`tf-step-bar ${done || isCurrent ? "is-done" : ""}`} />}
              <button
                type="button"
                className={`tf-step ${done ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
                onClick={clickable ? () => onStepClick(i) : undefined}
                disabled={!clickable}
                aria-current={isCurrent ? "step" : undefined}
                title={clickable ? `Back to ${stepLabel}` : undefined}
              >
                <span className="tf-step-dot">
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M20 6 9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                {stepLabel}
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      <button className="tf-close" onClick={onClose} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}


/* ────────────────────────── Modal defaults ────────────────────────── */

/** Shared antd Modal props so every popup in the flow frames identically. */
export const ticketFlowModalProps = {
  footer: null as null,
  closable: false,
  destroyOnHidden: true,
  centered: true,
  styles: {
    mask: { backdropFilter: "blur(10px)", background: "rgba(11,15,26,0.62)" },
    content: {
      padding: 0,
      borderRadius: 20,
      overflow: "hidden",
      background: "transparent",
      boxShadow: "0 40px 100px rgba(8,12,24,0.5)",
    },
    body: { padding: 0 },
  },
};

/**
 * Theme classes for the modal wrapper.
 *
 * Steps 1 and 2 are pure `tf-*` and only need `tf-dark` / `tf-light`. Step 3
 * embeds the older workspaces, which read their tokens from `.hb-btm-*`,
 * `.hb-aimodal-*` and `.hb-light/.hb-dark` — classes those components used to
 * get from their own Modal. The wrapper has to carry all of them, or the
 * embedded bodies render dark tokens under a light theme.
 */
export const tfWrapClass = (theme?: string) => {
  const dark = theme === "dark";
  return [
    "tf-wrap",
    dark ? "tf-dark" : "tf-light",
    dark ? "hb-dark" : "hb-light",
    dark ? "hb-btm-dark" : "hb-btm-light",
    dark ? "hb-aimodal-dark" : "hb-aimodal-light",
  ].join(" ");
};

/* ────────────────────────── Styles ────────────────────────── */

export const ticketFlowStyles = `
.tf-wrap .ant-modal-content { background: transparent !important; }

.tf {
  --t-bg: #0B0F1A;
  --t-panel: #10151F;
  --t-soft: #141A26;
  --t-hover: #1A2231;
  --t-border: #1F2937;
  --t-border-strong: #2C3849;
  --t-text: #F1F5F9;
  --t-text-soft: #94A3B8;
  --t-text-muted: #64748B;
  --t-accent: #3B82F6;
  --t-accent-soft: rgba(59,130,246,0.14);
  --t-success: #10B981;
  --t-success-soft: rgba(16,185,129,0.14);
  --t-danger: #EF4444;
  --t-plate: #FFFFFF;
  --t-shadow: 0 20px 44px rgba(8,12,24,0.30);

  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--t-bg);
  color: var(--t-text);
  border: 1px solid var(--t-border);
  border-radius: 20px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
  letter-spacing: -0.01em;
}
.tf-light .tf {
  --t-bg: #FFFFFF;
  --t-panel: #FFFFFF;
  --t-soft: #F8FAFC;
  --t-hover: #F1F5F9;
  --t-border: #E5E7EB;
  --t-border-strong: #CBD5E1;
  --t-text: #0F172A;
  --t-text-soft: #475569;
  --t-text-muted: #94A3B8;
  --t-accent: #2563EB;
  --t-accent-soft: rgba(37,99,235,0.10);
  --t-success-soft: rgba(16,185,129,0.10);
  --t-plate: #F1F5F9;
  --t-shadow: 0 18px 38px rgba(15,23,42,0.12);
}

.tf-plain { display: flex; flex-direction: column; min-height: 0; }

/* Per-card tone */
.tf-tone-blue  { --t-tone: var(--t-accent); --t-tone-soft: var(--t-accent-soft); }
.tf-tone-green { --t-tone: var(--t-success); --t-tone-soft: var(--t-success-soft); }
.tf-tone-ash   { --t-tone: var(--t-text-soft); --t-tone-soft: rgba(100,116,139,0.14); }

/* ── Header ── */
.tf-head {
  position: relative;
  flex-shrink: 0;
  padding: 14px 20px;
  border-bottom: 1px solid var(--t-border);
  overflow: hidden;
}
.tf-head-glow {
  position: absolute; inset: 0;
  background:
    radial-gradient(70% 130% at 88% -10%, rgba(59,130,246,0.20) 0%, transparent 62%),
    radial-gradient(52% 110% at 4% 110%, rgba(16,185,129,0.14) 0%, transparent 62%);
  pointer-events: none;
}
.tf-light .tf-head-glow { opacity: 0.5; }

.tf-head-row {
  position: relative;
  display: flex; align-items: center; gap: 12px;
}
.tf-mark {
  width: 36px; height: 36px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: var(--t-accent-soft);
  border: 1px solid color-mix(in oklab, var(--t-accent) 34%, transparent);
  color: var(--t-accent);
}
.tf-mark-plate {
  background: #FFFFFF;
  border-color: var(--t-border-strong);
  box-shadow: 0 8px 22px rgba(8,12,24,0.28);
}
.tf-light .tf-mark-plate { box-shadow: 0 3px 10px rgba(15,23,42,0.10); }

.tf-head-text { flex: 1; min-width: 0; }
.tf-eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.13em; text-transform: uppercase;
  color: var(--t-accent);
  margin-bottom: 3px;
}
.tf-eyebrow-dot {
  width: 5px; height: 5px; border-radius: 999px;
  background: var(--t-accent);
  box-shadow: 0 0 0 3px var(--t-accent-soft);
}
.tf-title {
  margin: 0;
  font-size: 16px; font-weight: 650; line-height: 1.25;
  letter-spacing: -0.025em;
  color: var(--t-text);
}
.tf-close {
  width: 28px; height: 28px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: transparent;
  border: 1px solid var(--t-border);
  color: var(--t-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.tf-close:hover {
  background: var(--t-hover); color: var(--t-text); border-color: var(--t-border-strong);
}

.tf-head-meta {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  margin-left: auto;
  min-width: 0; max-width: 58%;
}
.tf-head-divider {
  width: 1px; align-self: stretch; min-height: 26px;
  background: var(--t-border);
  flex-shrink: 0;
}
.tf-chips {
  display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px;
  min-width: 0;
}
.tf-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  border: 1px solid var(--t-border);
  background: var(--t-soft);
  color: var(--t-text-soft);
  font-size: 11px; font-weight: 500;
  white-space: nowrap;
}
.tf-chip svg { color: var(--t-text-muted); flex-shrink: 0; }
.tf-chip-accent {
  border-color: color-mix(in oklab, var(--t-accent) 40%, transparent);
  background: var(--t-accent-soft);
  color: var(--t-accent);
  font-weight: 600;
}
.tf-chip-accent svg { color: var(--t-accent); }
.tf-chip-ok {
  border-color: color-mix(in oklab, var(--t-success) 40%, transparent);
  background: var(--t-success-soft);
  color: var(--t-success);
  font-weight: 600;
}
.tf-chip-ok svg { color: var(--t-success); }

.tf-back {
  width: 28px; height: 28px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: var(--t-soft);
  border: 1px solid var(--t-border);
  color: var(--t-text-soft);
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease, transform 120ms ease;
}
.tf-back:hover {
  background: var(--t-hover); color: var(--t-text);
  border-color: var(--t-border-strong);
  transform: translateX(-2px);
}

/* Persistent wizard bar */
.tf-bar {
  position: relative; z-index: 2;
  display: flex; align-items: center; gap: 14px;
  flex-shrink: 0;
  padding: 8px 14px 8px 12px;
  border-bottom: 1px solid var(--t-border);
  background: var(--t-soft);
}
.tf-bar-left { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
.tf-bar-mark {
  width: 26px; height: 26px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: #FFFFFF;
  border: 1px solid var(--t-border-strong);
}
.tf-bar-label {
  font-size: 12.5px; font-weight: 620; color: var(--t-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tf-steps-bar { margin: 0 auto; flex-wrap: nowrap; }
.tf-bar .tf-close { margin-left: auto; }


/* Wizard rail */
.tf-steps {
  position: relative;
  display: flex; align-items: center; gap: 5px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.tf-step {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 10px 3px 4px;
  border-radius: 999px;
  border: 1px solid var(--t-border);
  background: var(--t-soft);
  color: var(--t-text-muted);
  font-size: 11px; font-weight: 550;
  white-space: nowrap;
  cursor: default;
  transition: background 130ms ease, border-color 130ms ease, color 130ms ease, transform 130ms ease;
}
.tf-step-dot {
  width: 17px; height: 17px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  background: var(--t-panel);
  border: 1px solid var(--t-border);
  font-size: 10px; font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.tf-step.is-done {
  border-color: color-mix(in oklab, var(--t-success) 38%, transparent);
  background: var(--t-success-soft);
  color: var(--t-success);
  cursor: pointer;
}
.tf-step.is-done .tf-step-dot {
  background: var(--t-success); border-color: var(--t-success); color: #FFFFFF;
}
.tf-step.is-done:hover { transform: translateY(-1px); filter: brightness(1.05); }
.tf-step.is-current {
  border-color: color-mix(in oklab, var(--t-accent) 45%, transparent);
  background: var(--t-accent-soft);
  color: var(--t-accent);
  font-weight: 650;
}
.tf-step.is-current .tf-step-dot {
  background: var(--t-accent); border-color: var(--t-accent); color: #FFFFFF;
}
.tf-step:disabled { cursor: default; }
.tf-step-bar {
  width: 14px; height: 2px; border-radius: 999px;
  background: var(--t-border);
  flex-shrink: 0;
}
.tf-step-bar.is-done { background: color-mix(in oklab, var(--t-success) 55%, transparent); }

/* ── Toolbar ── */
.tf-toolbar {
  display: flex; align-items: center; gap: 10px;
  flex-shrink: 0;
  padding: 9px 20px;
  border-bottom: 1px solid var(--t-border);
  background: var(--t-soft);
}
.tf-search {
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 8px;
  height: 30px; padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--t-border);
  background: var(--t-panel);
  color: var(--t-text-muted);
  transition: border-color 120ms ease, box-shadow 120ms ease;
}
.tf-search:focus-within {
  border-color: var(--t-accent);
  box-shadow: 0 0 0 3px var(--t-accent-soft);
}
.tf-search input {
  flex: 1; min-width: 0;
  border: none; outline: none; background: transparent;
  color: var(--t-text);
  font-size: 12.5px;
}
.tf-search input::placeholder { color: var(--t-text-muted); }
.tf-search-clear {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px;
  border: none; border-radius: 999px;
  background: var(--t-hover);
  color: var(--t-text-soft);
  cursor: pointer;
}

.tf-seg {
  display: inline-flex; gap: 2px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--t-border);
  background: var(--t-panel);
  flex-shrink: 0;
}
.tf-seg-btn {
  padding: 4px 11px;
  border: none; border-radius: 7px;
  background: transparent;
  color: var(--t-text-muted);
  font-size: 12px; font-weight: 550;
  cursor: pointer;
  transition: background 120ms ease, color 120ms ease;
}
.tf-seg-btn:hover { color: var(--t-text); }
.tf-seg-btn.is-active { background: var(--t-accent); color: #FFFFFF; }

/* ── Body ── */
.tf-body {
  padding: 14px 20px 16px;
  min-height: 0;
  max-height: min(60vh, 540px);
  overflow-y: auto;
}
.tf-body::-webkit-scrollbar { width: 8px; }
.tf-body::-webkit-scrollbar-thumb { background: var(--t-border-strong); border-radius: 999px; }

.tf-section {
  display: flex; align-items: center; gap: 8px;
  font-size: 10.5px; font-weight: 650;
  letter-spacing: 0.13em; text-transform: uppercase;
  color: var(--t-text-muted);
  margin-bottom: 9px;
}
.tf-section:not(:first-child) { margin-top: 16px; }
.tf-section-count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px;
  border-radius: 999px;
  background: var(--t-soft);
  border: 1px solid var(--t-border);
  color: var(--t-text-soft);
  font-size: 10px; letter-spacing: 0;
}
.tf-section-hint {
  margin-left: auto;
  font-size: 10px; font-weight: 550; letter-spacing: 0.08em;
  color: var(--t-text-muted); text-transform: none;
}

/* ── Cards ── */
.tf-grid {
  display: grid;
  grid-template-columns: repeat(var(--tf-cols, 2), minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}
.tf-card {
  position: relative;
  display: flex; flex-direction: column; gap: 7px;
  text-align: left;
  padding: 14px;
  border-radius: 13px;
  background: var(--t-panel);
  border: 1px solid var(--t-border);
  cursor: pointer;
  overflow: hidden;
  transition: transform 150ms cubic-bezier(.4,0,.2,1), border-color 150ms ease,
              box-shadow 180ms ease, background 150ms ease;
}
.tf-light .tf-card { background: #FFFFFF; }
.tf-card-sheen {
  position: absolute; inset: 0;
  background: radial-gradient(120% 90% at 100% 0%, var(--t-tone-soft, var(--t-accent-soft)) 0%, transparent 58%);
  opacity: 0;
  transition: opacity 180ms ease;
  pointer-events: none;
}
.tf-card:hover:not(:disabled) {
  transform: translateY(-3px);
  border-color: color-mix(in oklab, var(--t-tone, var(--t-accent)) 45%, var(--t-border));
  box-shadow: var(--t-shadow);
}
.tf-card:hover:not(:disabled) .tf-card-sheen { opacity: 1; }
.tf-card:focus-visible {
  outline: none;
  border-color: var(--t-tone, var(--t-accent));
  box-shadow: 0 0 0 3px var(--t-tone-soft, var(--t-accent-soft));
}
.tf-card:disabled { opacity: 0.55; cursor: not-allowed; }

.tf-card-top {
  position: relative;
  display: flex; align-items: center; gap: 10px;
}
.tf-logo {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px;
  border-radius: 10px;
  flex-shrink: 0;
}
.tf-logo-plate {
  background: var(--t-plate);
  border: 1px solid var(--t-border-strong);
  box-shadow: 0 4px 14px rgba(8,12,24,0.20);
}
.tf-light .tf-logo-plate { box-shadow: 0 2px 8px rgba(15,23,42,0.08); }
.tf-logo-tint {
  background: var(--t-tone-soft, var(--t-accent-soft));
  color: var(--t-tone, var(--t-accent));
  border: 1px solid color-mix(in oklab, var(--t-tone, var(--t-accent)) 30%, transparent);
}

.tf-badge {
  display: inline-flex; align-items: center; gap: 5px;
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10px; font-weight: 650;
  letter-spacing: 0.08em; text-transform: uppercase;
  white-space: nowrap;
}
.tf-badge-ok {
  background: var(--t-success-soft);
  color: var(--t-success);
  border: 1px solid color-mix(in oklab, var(--t-success) 34%, transparent);
}
.tf-badge-accent {
  background: var(--t-accent-soft);
  color: var(--t-accent);
  border: 1px solid color-mix(in oklab, var(--t-accent) 34%, transparent);
}
.tf-badge-muted {
  background: var(--t-soft);
  color: var(--t-text-muted);
  border: 1px solid var(--t-border);
}
.tf-badge-dot { width: 5px; height: 5px; border-radius: 999px; background: currentColor; }

.tf-card-name {
  position: relative;
  flex: 1; min-width: 0;
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 620; color: var(--t-text);
  letter-spacing: -0.015em;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tf-card-sub { position: relative; font-size: 12px; line-height: 1.45; color: var(--t-text-soft); }
.tf-feats {
  position: relative;
  list-style: none; margin: 2px 0 0; padding: 0;
  display: flex; flex-direction: column; gap: 4px;
}
.tf-feats li {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; color: var(--t-text-muted);
}
.tf-feats svg { color: var(--t-success); flex-shrink: 0; }
.tf-card-cta {
  position: relative;
  margin-top: auto; padding-top: 10px;
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 620;
  color: var(--t-tone, var(--t-accent));
}
.tf-card-cta svg { transition: transform 160ms ease; }
.tf-card:hover:not(:disabled) .tf-card-cta svg { transform: translateX(3px); }

/* ── Quick-action strip ── */
.tf-quick {
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 10px;
  margin-top: 10px; padding: 9px 12px;
  border-radius: 10px;
  border: 1px dashed var(--t-border-strong);
  background: var(--t-soft);
}
.tf-quick-label {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 550; color: var(--t-text-soft);
}
.tf-quick-label svg { color: var(--t-accent); }
.tf-quick-actions { display: inline-flex; gap: 8px; flex-wrap: wrap; }
.tf-quick-btn {
  display: inline-flex; align-items: center; gap: 7px;
  height: 28px; padding: 0 11px;
  border-radius: 8px;
  border: 1px solid var(--t-border);
  background: var(--t-panel);
  color: var(--t-text);
  font-size: 11.5px; font-weight: 550;
  cursor: pointer;
  transition: border-color 130ms ease, background 130ms ease, transform 130ms ease;
}
.tf-quick-btn:hover {
  border-color: var(--t-accent); background: var(--t-hover); transform: translateY(-1px);
}

/* ── Compact rail (coming soon / secondary items) ── */
.tf-mini-grid {
  display: grid;
  grid-template-columns: repeat(var(--tf-mini-cols, 3), minmax(0, 1fr));
  gap: 8px;
}
.tf-mini {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--t-border);
  background: var(--t-soft);
  cursor: not-allowed;
  transition: border-color 140ms ease, background 140ms ease;
}
.tf-mini:hover { border-color: var(--t-border-strong); background: var(--t-hover); }
.tf-logo-soon {
  width: 28px; height: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: var(--t-plate);
  border: 1px solid var(--t-border);
  filter: grayscale(1);
  opacity: 0.72;
  flex-shrink: 0;
  transition: filter 160ms ease, opacity 160ms ease;
}
.tf-mini:hover .tf-logo-soon { filter: grayscale(0); opacity: 1; }
.tf-mini-text { flex: 1; min-width: 0; }
.tf-mini-name {
  font-size: 12px; font-weight: 600; color: var(--t-text-soft);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tf-mini-tag {
  font-size: 11px; color: var(--t-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

/* ── Empty ── */
.tf-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 30px 20px; text-align: center;
  color: var(--t-text-muted);
}
.tf-empty > svg { color: var(--t-text-muted); margin-bottom: 4px; }
.tf-empty-title { font-size: 13.5px; font-weight: 600; color: var(--t-text-soft); }
.tf-empty-sub { font-size: 12px; }
.tf-empty-btn {
  margin-top: 10px; height: 30px; padding: 0 14px;
  border-radius: 8px;
  border: 1px solid var(--t-border-strong);
  background: var(--t-panel);
  color: var(--t-text);
  font-size: 12px; font-weight: 550;
  cursor: pointer;
}
.tf-empty-btn:hover { background: var(--t-hover); }

/* ── Form ── */
.tf-form { display: flex; flex-direction: column; gap: 12px; }
.tf-fieldset {
  border: 1px solid var(--t-border);
  border-radius: 12px;
  background: var(--t-panel);
  padding: 13px;
}
.tf-light .tf-fieldset { background: #FFFFFF; }
.tf-fieldset-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 11px;
  font-size: 10.5px; font-weight: 650;
  letter-spacing: 0.13em; text-transform: uppercase;
  color: var(--t-text-muted);
}
.tf-fieldset-head svg { color: var(--t-accent); }
.tf-fieldset-hint {
  margin-left: auto;
  font-size: 10.5px; font-weight: 500; letter-spacing: 0;
  text-transform: none; color: var(--t-text-muted);
}
.tf-fields {
  display: grid;
  grid-template-columns: repeat(var(--tf-fcols, 2), minmax(0, 1fr));
  gap: 12px;
}
.tf-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.tf-field-full { grid-column: 1 / -1; }
.tf-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; font-weight: 600; color: var(--t-text-soft);
}
.tf-req { color: var(--t-danger); font-size: 12px; line-height: 1; }
.tf-optional {
  margin-left: auto;
  font-size: 10.5px; font-weight: 500; color: var(--t-text-muted);
}
.tf-hint { font-size: 11px; color: var(--t-text-muted); }
.tf-err { font-size: 11px; color: var(--t-danger); }

.tf .tf-input,
.tf .tf-textarea {
  width: 100%;
  border-radius: 9px;
  border: 1px solid var(--t-border);
  background: var(--t-soft);
  color: var(--t-text);
  font-size: 13px;
  font-family: inherit;
  padding: 8px 11px;
  outline: none;
  transition: border-color 120ms ease, box-shadow 120ms ease, background 120ms ease;
}
.tf .tf-input { height: 34px; }
.tf .tf-textarea { resize: vertical; min-height: 78px; line-height: 1.5; }
.tf .tf-input::placeholder,
.tf .tf-textarea::placeholder { color: var(--t-text-muted); }
.tf .tf-input:focus,
.tf .tf-textarea:focus {
  border-color: var(--t-accent);
  background: var(--t-panel);
  box-shadow: 0 0 0 3px var(--t-accent-soft);
}
.tf .tf-input.is-error,
.tf .tf-textarea.is-error { border-color: var(--t-danger); }

/* antd Form dropped into the flow */
.tf .ant-form-item { margin-bottom: 0; }
.tf .ant-form-item-label { padding-bottom: 5px !important; }
.tf .ant-form-item-label > label {
  height: auto !important;
  font-size: 11.5px !important;
  font-weight: 600 !important;
  color: var(--t-text-soft) !important;
}
.tf .ant-form-item-label > label::after { display: none !important; }
.tf .ant-form-item-explain-error { font-size: 11px; margin-top: 4px; }
.tf .ant-input,
.tf .ant-input-affix-wrapper,
.tf textarea.ant-input {
  border-radius: 9px !important;
  background: var(--t-soft) !important;
  border-color: var(--t-border) !important;
  color: var(--t-text) !important;
  font-size: 13px !important;
}
.tf .ant-input::placeholder,
.tf textarea.ant-input::placeholder { color: var(--t-text-muted) !important; }
.tf .ant-input:focus,
.tf .ant-input-focused,
.tf .ant-input-affix-wrapper:focus-within {
  border-color: var(--t-accent) !important;
  box-shadow: 0 0 0 3px var(--t-accent-soft) !important;
}

/* antd controls dropped into the flow */
.tf .ant-select .ant-select-selector,
.tf .ant-picker {
  border-radius: 9px !important;
  border-color: var(--t-border) !important;
  background: var(--t-soft) !important;
  min-height: 34px !important;
}
.tf .ant-select-single .ant-select-selector { height: 34px !important; }
.tf .ant-select-single .ant-select-selection-item,
.tf .ant-select-single .ant-select-selection-search-input { line-height: 32px !important; }
.tf .ant-select-selection-placeholder { color: var(--t-text-muted) !important; }
.tf .ant-select-focused .ant-select-selector {
  border-color: var(--t-accent) !important;
  box-shadow: 0 0 0 3px var(--t-accent-soft) !important;
}

/* ── Footer ── */
.tf-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  flex-shrink: 0;
  padding: 9px 20px;
  border-top: 1px solid var(--t-border);
  background: var(--t-soft);
}
.tf-foot-left, .tf-foot-right { display: inline-flex; align-items: center; gap: 12px; min-width: 0; }
.tf-foot-note { font-size: 11.5px; color: var(--t-text-muted); }
.tf-ghost {
  display: inline-flex; align-items: center; gap: 7px;
  height: 30px; padding: 0 11px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--t-text-soft);
  font-size: 12.5px; font-weight: 550;
  cursor: pointer;
  transition: background 130ms ease, color 130ms ease, border-color 130ms ease;
}
.tf-ghost:hover:not(:disabled) {
  background: var(--t-hover); color: var(--t-text); border-color: var(--t-border);
}
.tf-ghost:disabled { opacity: 0.45; cursor: default; }
.tf-secondary {
  height: 30px; padding: 0 15px;
  border-radius: 8px;
  border: 1px solid var(--t-border-strong);
  background: var(--t-panel);
  color: var(--t-text);
  font-size: 12.5px; font-weight: 550;
  cursor: pointer;
  transition: background 130ms ease, border-color 130ms ease;
}
.tf-secondary:hover { background: var(--t-hover); }
.tf-primary {
  display: inline-flex; align-items: center; gap: 7px;
  height: 30px; padding: 0 16px;
  border-radius: 8px;
  border: 1px solid var(--t-accent);
  background: var(--t-accent);
  color: #FFFFFF;
  font-size: 12.5px; font-weight: 600;
  cursor: pointer;
  transition: filter 130ms ease, transform 130ms ease, opacity 130ms ease;
}
.tf-primary:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.tf-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.tf-spin { animation: tf-spin 900ms linear infinite; }
@keyframes tf-spin { to { transform: rotate(360deg); } }

/* ── Responsive ── */
@media (max-width: 900px) {
  .tf-grid { --tf-cols: 2; }
  .tf-mini-grid { --tf-mini-cols: 2; }
}
@media (max-width: 720px) {
  .tf-grid { --tf-cols: 1; }
  .tf-fields { --tf-fcols: 1; }
}
@media (max-width: 760px) {
  .tf-bar { flex-wrap: wrap; }
  .tf-steps-bar { order: 3; width: 100%; margin: 4px 0 0; flex-wrap: wrap; }
}
@media (max-width: 900px) {
  .tf-head-row { flex-wrap: wrap; }
  .tf-head-meta { width: 100%; margin-left: 0; }
  .tf-head-divider { display: none; }
  .tf-chips { justify-content: flex-start; }
}
@media (max-width: 560px) {
  .tf-head, .tf-toolbar, .tf-body, .tf-foot { padding-left: 14px; padding-right: 14px; }
  .tf-toolbar { flex-direction: column; align-items: stretch; }
  .tf-seg { justify-content: space-between; }
  .tf-mini-grid { --tf-mini-cols: 1; }
  .tf-foot { flex-direction: column-reverse; align-items: stretch; }
  .tf-foot-right { justify-content: space-between; }
}
`;
