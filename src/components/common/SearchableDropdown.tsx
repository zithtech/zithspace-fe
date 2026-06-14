"use client";

/**
 * SearchableDropdown — the project's default dropdown pattern.
 *
 * Born from the activity-page filter widget (CustomFilterDropdown) so the
 * styling/behaviour stays consistent across the app. Use this instead of
 * antd's <Select> / <AutoComplete> for any "pick one from a list with search"
 * affordance.
 *
 * Highlights:
 *  - value / onChange wiring so it drops straight into <Form.Item>.
 *  - `triggerLabel` renders the small uppercase eyebrow above the value
 *    (activity-page style). Leave it undefined for an inline Select-style
 *    trigger you'd put under a Form.Item label.
 *  - `freeText` allows the search input itself to be submitted as the value,
 *    replacing antd's <AutoComplete> for "pick or type" UX.
 *  - Options support description text, custom `badge` (replaces the auto
 *    initials avatar), and optional right-aligned `meta`.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Popover } from "antd";
import { Search, ChevronDown, Check, X as XIcon, Plus } from "lucide-react";

export interface SearchableDropdownOption {
  value: string;
  label: string;
  description?: string;
  badge?: React.ReactNode;
  meta?: React.ReactNode;
  disabled?: boolean;
  /** Avatar image URL — renders an image instead of initials when provided. */
  avatarUrl?: string | null;
}

export interface SearchableDropdownProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  options: SearchableDropdownOption[];
  placeholder?: string;
  /** Small uppercase eyebrow above the value in the trigger (activity-page style). */
  triggerLabel?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  /** Allow the search input value itself to be submitted as the chosen value. */
  freeText?: boolean;
  /** Suffix for the footer count, e.g. "categories" → "12 categories". */
  itemNoun?: string;
  /** Overlay width (default 290). */
  width?: number | string;
  /** Show a trailing X when a value is set. Default true. */
  allowClear?: boolean;
  /** Hide the leading avatar/initials chip on each option (e.g. for month/year lists). */
  hideAvatar?: boolean;
  className?: string;
  /** Forwarded onto the trigger element so consumers can size it themselves. */
  style?: React.CSSProperties;
  /** Open the overlay on mount — useful for inline-edit / modal flows. */
  defaultOpen?: boolean;
  /** Notified whenever the overlay opens/closes (e.g. for click-outside cancel). */
  onOpenChange?: (open: boolean) => void;
}

const initialsFor = (s: string): string => {
  if (!s) return "?";
  const parts = s
    .replace(/[_\-]/g, " ")
    .split(/(?=[A-Z])|\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
};

/** Deterministic color from string so the same person always gets the same color */
const avatarColorFor = (str: string): string => {
  const COLORS = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select…",
  triggerLabel,
  searchPlaceholder,
  loading,
  disabled,
  freeText,
  itemNoun = "items",
  width = 290,
  allowClear = true,
  hideAvatar = false,
  className,
  style,
  defaultOpen = false,
  onOpenChange,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setSearch("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, search]);

  const exactMatch = useMemo(
    () => options.find((o) => o.value.toLowerCase() === search.trim().toLowerCase()),
    [options, search],
  );
  const showFreeTextRow =
    freeText && search.trim().length > 0 && !exactMatch;

  const displayLabel = useMemo(() => {
    if (!value) return placeholder;
    const opt = options.find((o) => o.value === value);
    return opt ? opt.label : value;
  }, [value, options, placeholder]);

  const commit = (next: string | undefined) => {
    onChange?.(next);
    setOpen(false);
  };

  const overlay = (
    <div className="sd-overlay" onClick={(e) => e.stopPropagation()} style={{ width }}>
      <div className="sd-search-box">
        <Search size={14} className="sd-search-icon" />
        <input
          ref={inputRef}
          className="sd-search-input"
          type="text"
          placeholder={searchPlaceholder || "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) {
                commit(filtered[0].value);
              } else if (showFreeTextRow) {
                commit(search.trim());
              }
            }
          }}
        />
      </div>
      <div className="sd-list">
        {loading ? (
          <div className="sd-empty">Loading…</div>
        ) : filtered.length === 0 && !showFreeTextRow ? (
          <div className="sd-empty">No matches</div>
        ) : (
          <>
            {filtered.map((opt) => {
              const isSelected = value === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  className={`sd-option ${isSelected ? "is-selected" : ""}`}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (opt.disabled) return;
                    commit(isSelected ? undefined : opt.value);
                  }}
                >
                  {!hideAvatar && (
                    <div
                      className="sd-option-avatar"
                      style={opt.badge ? undefined : {
                        backgroundColor: opt.avatarUrl ? 'transparent' : avatarColorFor(opt.value || opt.label),
                        color: opt.avatarUrl ? undefined : '#fff',
                        borderColor: opt.avatarUrl ? undefined : 'transparent',
                      }}
                    >
                      {opt.badge
                        ? opt.badge
                        : opt.avatarUrl
                          ? <img src={opt.avatarUrl} alt={initialsFor(opt.label)} />
                          : initialsFor(opt.label)
                      }
                    </div>
                  )}
                  <div className="sd-option-content">
                    <span className="sd-option-name">{opt.label}</span>
                    {opt.description && (
                      <span className="sd-option-desc">{opt.description}</span>
                    )}
                  </div>
                  {opt.meta && <span className="sd-option-meta">{opt.meta}</span>}
                  {isSelected && (
                    <Check className="sd-option-check" size={14} strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
            {showFreeTextRow && (
              <button
                type="button"
                className="sd-option sd-option-freetext"
                onClick={() => commit(search.trim())}
              >
                <div className="sd-option-avatar sd-option-avatar-add">
                  <Plus size={13} strokeWidth={2.4} />
                </div>
                <div className="sd-option-content">
                  <span className="sd-option-name">
                    Use “{search.trim()}”
                  </span>
                  <span className="sd-option-desc">Custom value — not in the list</span>
                </div>
              </button>
            )}
          </>
        )}
      </div>
      <div className="sd-footer">
        <span className="sd-footer-count">
          {filtered.length} {itemNoun}
        </span>
      </div>
    </div>
  );

  const triggerClasses = [
    "sd-trigger",
    value ? "is-active" : "",
    open ? "is-open" : "",
    disabled ? "is-disabled" : "",
    triggerLabel ? "" : "is-compact",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Popover
      content={overlay}
      trigger="click"
      open={disabled ? false : open}
      onOpenChange={(v) => {
        if (disabled) return;
        setOpen(v);
        onOpenChange?.(v);
      }}
      placement="bottomLeft"
      overlayClassName="sd-overlay-popover"
      destroyOnHidden
    >
      <div className={triggerClasses} style={style}>
        <div className="sd-trigger-content">
          {triggerLabel && (
            <span className="sd-trigger-label">{triggerLabel}</span>
          )}
          <span className="sd-trigger-value">{displayLabel}</span>
        </div>
        {allowClear && value ? (
          <XIcon
            className="sd-trigger-clear"
            size={14}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onChange?.(undefined);
            }}
          />
        ) : (
          <ChevronDown
            className={`sd-trigger-chevron ${open ? "is-open" : ""}`}
            size={14}
          />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: SEARCHABLE_DROPDOWN_CSS }} />
    </Popover>
  );
};

const SEARCHABLE_DROPDOWN_CSS = `
.sd-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bg-pure-white, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  padding: 5px 12px;
  height: 42px;
  min-width: 150px;
  width: 100%;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
  user-select: none;
}
.sd-trigger.is-compact {
  height: 36px;
  padding: 4px 10px;
}
.sd-trigger:hover {
  border-color: var(--text-slate-400, #cbd5e1);
  background: var(--bg-slate-50, #f8fafc);
}
.sd-trigger.is-active {
  border-color: #3b82f6;
  background: #faf9ff;
}
.sd-trigger.is-open {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(68, 131, 232, 0.12);
}
.sd-trigger.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
  background: var(--bg-slate-50, #f8fafc);
}
.sd-trigger-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.2;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.sd-trigger.is-compact .sd-trigger-content {
  flex-direction: row;
  align-items: center;
}
.sd-trigger-label {
  font-size: 8.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-slate-400, #94a3b8);
}
.sd-trigger-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-slate-800, #1e293b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.sd-trigger.is-active .sd-trigger-value {
  color: var(--text-slate-900, #0f172a);
}
.sd-trigger-chevron {
  color: var(--text-slate-400, #94a3b8);
  transition: transform .2s ease, color .2s ease;
  margin-left: 6px;
  flex-shrink: 0;
}
.sd-trigger-chevron.is-open {
  transform: rotate(180deg);
  color: #2563eb;
}
.sd-trigger-clear {
  color: var(--text-slate-400, #94a3b8);
  transition: color .15s ease;
  margin-left: 6px;
  flex-shrink: 0;
}
.sd-trigger-clear:hover { color: #b91c1c; }

[data-theme='dark'] .sd-trigger {
  background: rgba(255,255,255,0.02);
  border-color: var(--border-slate-800, #1f2937);
}
[data-theme='dark'] .sd-trigger:hover {
  background: rgba(255,255,255,0.04);
  border-color: var(--border-slate-700, #374151);
}
[data-theme='dark'] .sd-trigger.is-active {
  background: rgba(37, 99, 235,0.06);
  border-color: rgba(96, 165, 250,0.3);
}
[data-theme='dark'] .sd-trigger.is-open {
  border-color: rgba(96, 165, 250,0.45);
  box-shadow: 0 0 0 2px rgba(37, 99, 235,0.2);
}
[data-theme='dark'] .sd-trigger-value { color: #e2e8f0; }
[data-theme='dark'] .sd-trigger.is-active .sd-trigger-value { color: #f8fafc; }

.sd-overlay-popover.ant-popover { padding-top: 4px; }
.sd-overlay-popover .ant-popover-content {
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  overflow: hidden;
}
.sd-overlay-popover .ant-popover-inner {
  padding: 0 !important;
  background: var(--bg-pure-white, #ffffff) !important;
  border-radius: 12px;
}
[data-theme='dark'] .sd-overlay-popover .ant-popover-content { border-color: #27273a; }
[data-theme='dark'] .sd-overlay-popover .ant-popover-inner { background: #181824 !important; }

.sd-overlay {
  display: flex;
  flex-direction: column;
  max-height: 380px;
}
.sd-search-box {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color, #f0f0f0);
  gap: 8px;
}
[data-theme='dark'] .sd-search-box { border-bottom-color: #27273a; }
.sd-search-icon { color: var(--text-slate-400, #94a3b8); flex-shrink: 0; }
.sd-search-input {
  flex: 1;
  background: var(--bg-slate-50, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 12px;
  color: var(--text-slate-800, #1e293b);
  outline: none;
  transition: border-color .15s ease, background .15s ease;
}
.sd-search-input:focus {
  border-color: #2563eb;
  background: var(--bg-pure-white, #ffffff);
}
[data-theme='dark'] .sd-search-input {
  background: #1f2937;
  border-color: #27273a;
  color: #e2e8f0;
}
[data-theme='dark'] .sd-search-input:focus {
  border-color: #60a5fa;
  background: #181824;
}

.sd-list {
  flex: 1;
  overflow-y: auto;
  max-height: 260px;
  padding: 4px;
}
.sd-empty {
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--text-slate-400, #94a3b8);
}

.sd-option {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  box-sizing: border-box;
  transition: background .15s ease, color .15s ease;
  user-select: none;
}
.sd-option:hover { background: var(--bg-slate-50, #f8fafc); }
.sd-option.is-selected { background: #eff6ff; }
.sd-option:disabled { opacity: 0.5; cursor: not-allowed; }
[data-theme='dark'] .sd-option:hover { background: rgba(255,255,255,0.04); }
[data-theme='dark'] .sd-option.is-selected { background: rgba(37, 99, 235,0.12); }

.sd-option-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--bg-slate-100, #f1f5f9);
  color: var(--text-slate-600, #475569);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  flex-shrink: 0;
  border: 1px solid var(--border-color, #e2e8f0);
  overflow: hidden;
}
.sd-option-avatar > img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.sd-option-avatar-add {
  background: rgba(37, 99, 235,0.08);
  border-color: rgba(37, 99, 235,0.25);
  color: #2563eb;
}
.sd-option.is-selected .sd-option-avatar {
  background: #dbeafe;
  color: #2563eb;
  border-color: #bfdbfe;
}
[data-theme='dark'] .sd-option-avatar {
  background: #2e354f;
  border-color: #27273a;
  color: #94a3b8;
}
[data-theme='dark'] .sd-option.is-selected .sd-option-avatar {
  background: rgba(37, 99, 235,0.2);
  color: #93c5fd;
  border-color: rgba(96, 165, 250,0.3);
}

.sd-option-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}
.sd-option-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-slate-800, #1e293b);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sd-option.is-selected .sd-option-name { color: var(--text-slate-900, #0f172a); }
[data-theme='dark'] .sd-option-name { color: #cbd5e1; }
[data-theme='dark'] .sd-option.is-selected .sd-option-name { color: #f8fafc; }

.sd-option-desc {
  font-size: 10.5px;
  color: var(--text-slate-400, #94a3b8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sd-option.is-selected .sd-option-desc { color: #2563eb; }
[data-theme='dark'] .sd-option.is-selected .sd-option-desc { color: #60a5fa; }

.sd-option-meta {
  font-size: 11px;
  color: var(--text-slate-500, #64748b);
  font-weight: 600;
  margin-left: auto;
  white-space: nowrap;
}

.sd-option-check {
  color: #2563eb;
  flex-shrink: 0;
  margin-left: auto;
}
.sd-option-meta + .sd-option-check { margin-left: 6px; }
[data-theme='dark'] .sd-option-check { color: #60a5fa; }

.sd-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-top: 1px solid var(--border-color, #f0f0f0);
  background: var(--bg-slate-50, #f8fafc);
  font-size: 10.5px;
  color: var(--text-slate-400, #94a3b8);
}
[data-theme='dark'] .sd-footer {
  border-top-color: #27273a;
  background: rgba(0,0,0,0.15);
}
.sd-footer-count { font-weight: 600; }
`;

export default SearchableDropdown;
