"use client";

/**
 * The form primitives the playbook author form is built from.
 *
 * They exist so the middle pane has one vertical rhythm and one way of showing
 * a label, a hint, a requirement and a count — rather than the ad-hoc inline
 * margins it grew the first time round. Presentational only: every one of these
 * is controlled by the caller.
 */

import React from "react";
import { Button } from "antd";
import { Plus, X } from "lucide-react";

/* ── Group card ──────────────────────────────────────────────────────────── */

export function FieldGroup({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pb-gcard">
      <div className="pb-gcard__head">
        <span className="pb-gcard__badge">{icon}</span>
        <div>
          <h4 className="pb-gcard__title">{title}</h4>
          {description && <p className="pb-gcard__desc">{description}</p>}
        </div>
      </div>
      <div className="pb-gcard__body">{children}</div>
    </section>
  );
}

/* ── Field ───────────────────────────────────────────────────────────────── */

export function Field({
  label,
  required,
  hint,
  /** Current length, shown against `max` once the author is close to it. */
  value,
  max,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  value?: string;
  max?: number;
  children: React.ReactNode;
}) {
  // Counting down from the start is noise; it earns its place near the limit.
  const showCount = typeof max === "number" && typeof value === "string" && value.length > max * 0.6;

  return (
    <div className="pb-field">
      <div className="pb-field__top">
        <span className="pb-field__name">{label}</span>
        {required && <span className="pb-field__req">Required</span>}
        {showCount && (
          <span className="pb-field__count">
            {value!.length}/{max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="pb-field__hint">{hint}</p>}
    </div>
  );
}

/* ── Chip picker ─────────────────────────────────────────────────────────── */

/**
 * For a closed set small enough to show at once — level and risk.
 *
 * A dropdown hides four options behind a click and gives no sense of the scale
 * they sit on. The selected chip also carries the exact colour the reader will
 * badge it with, so the author is picking the badge, not a string.
 */
export function ChipPicker({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="pb-chips" role="radiogroup">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={`pb-chip tone-${option.value || "auto"} ${value === option.value ? "is-on" : ""}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/* ── List editor ─────────────────────────────────────────────────────────── */

export function ListEditor({
  label,
  count,
  addLabel,
  onAdd,
  emptyText,
  hint,
  children,
}: {
  label: string;
  count: number;
  addLabel: string;
  onAdd: () => void;
  emptyText: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-field">
      <div className="pb-list">
        <div className="pb-list__head">
          <span className="pb-list__name">{label}</span>
          <span className="pb-list__count">{count}</span>
          <Button size="small" className="pb-list__add" icon={<Plus size={13} />} onClick={onAdd}>
            {addLabel}
          </Button>
        </div>
        {count === 0 ? (
          <div className="pb-list__empty">{emptyText}</div>
        ) : (
          <div className="pb-list__rows">{children}</div>
        )}
      </div>
      {hint && <p className="pb-field__hint">{hint}</p>}
    </div>
  );
}

/** One row inside a ListEditor: an optional number, the controls, a remove. */
export function ListRow({
  index,
  numbered,
  onRemove,
  children,
}: {
  index: number;
  numbered?: boolean;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pb-row">
      {numbered && <span className="pb-row__n">{index + 1}</span>}
      {children}
      <button
        type="button"
        className="pb-iconbtn is-danger"
        aria-label="Remove"
        onClick={onRemove}
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ── Body header ─────────────────────────────────────────────────────────── */

export function BodyHeader({
  crumbs,
  title,
  description,
  completeness,
  actions,
}: {
  crumbs: string[];
  title: string;
  description?: string;
  /** 0–1. Omitted where there is nothing meaningful to measure. */
  completeness?: { filled: number; total: number };
  actions?: React.ReactNode;
}) {
  const ratio = completeness ? completeness.filled / Math.max(1, completeness.total) : 0;
  const percent = Math.round(ratio * 100);

  return (
    <div className="pb-bhead">
      {crumbs.length > 0 && (
        <div className="pb-bhead__crumb">
          {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>›</span>}
              {i === crumbs.length - 1 ? <b>{crumb}</b> : <span>{crumb}</span>}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="pb-bhead__row">
        <h3 className="pb-bhead__title">{title}</h3>
        <div className="pb-bhead__actions">
          {completeness && (
            <div
              className="pb-meter"
              title={`${completeness.filled} of ${completeness.total} fields filled`}
            >
              <span className="pb-meter__bar">
                <span
                  className={`pb-meter__fill ${percent === 100 ? "is-full" : ""}`}
                  style={{ width: `${percent}%` }}
                />
              </span>
              <span className="pb-meter__label">{percent}% complete</span>
            </div>
          )}
          {actions}
        </div>
      </div>
      {description && <p className="pb-bhead__desc">{description}</p>}
    </div>
  );
}
