"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Popover, Checkbox } from "antd";
import { Search, Check, X as XIcon, ChevronDown } from "lucide-react";

export interface FilterPillOption {
  value: string;
  label: string;
  description?: string;
  badge?: React.ReactNode;
  /** Avatar image URL — used when showAvatar=true on the pill */
  avatarUrl?: string | null;
}

interface TicketFilterPillProps {
  icon?: React.ReactNode;
  label: string;
  values: string[];
  options: FilterPillOption[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Suffix in footer ("4 statuses"). */
  itemNoun?: string;
  width?: number;
  disabled?: boolean;
  /** Show a colored avatar circle next to each option label */
  showAvatar?: boolean;
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

const avatarColorFor = (str: string): string => {
  const COLORS = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
    '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
  ];
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
};

export const TicketFilterPill: React.FC<TicketFilterPillProps> = ({
  icon,
  label,
  values,
  options,
  onChange,
  placeholder,
  searchPlaceholder,
  itemNoun = "items",
  width = 260,
  disabled = false,
  showAvatar = false,
}) => {
  const [open, setOpen] = useState(false);
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

  const valueSet = useMemo(() => new Set(values), [values]);

  const toggle = (val: string) => {
    const next = new Set(valueSet);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange(Array.from(next));
  };

  const overlay = (
    <div className="fp-overlay" onClick={(e) => e.stopPropagation()} style={{ width }}>
      <div className="fp-search-box">
        <Search size={13} className="fp-search-icon" />
        <input
          ref={inputRef}
          className="fp-search-input"
          type="text"
          placeholder={searchPlaceholder || `Search ${label.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <XIcon
            size={13}
            className="fp-search-clear"
            onClick={() => setSearch("")}
          />
        )}
      </div>
      <div className="fp-list">
        {filtered.length === 0 ? (
          <div className="fp-empty">No matches</div>
        ) : (
          filtered.map((opt) => {
            const checked = valueSet.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className={`fp-option ${checked ? "is-selected" : ""}`}
                onClick={() => toggle(opt.value)}
              >
                <Checkbox checked={checked} onChange={() => toggle(opt.value)} onClick={(e) => e.stopPropagation()} />
                {showAvatar ? (
                  <div
                    className="fp-option-avatar"
                    style={opt.badge ? undefined : {
                      backgroundColor: opt.avatarUrl ? 'transparent' : avatarColorFor(opt.value || opt.label),
                      color: opt.avatarUrl ? undefined : '#fff',
                      borderColor: opt.avatarUrl ? undefined : 'transparent',
                    }}
                  >
                    {opt.badge
                      ? opt.badge
                      : opt.avatarUrl
                        ? <img src={opt.avatarUrl} alt={initialsFor(opt.label)} className="fp-option-avatar-img" />
                        : initialsFor(opt.label)
                    }
                  </div>
                ) : (
                  opt.badge && <span className="fp-option-badge">{opt.badge}</span>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: '1 1 auto', minWidth: 0, lineHeight: 1.2 }}>
                  <span className="fp-option-label" style={{ flex: 'none', width: '100%', textAlign: 'left' }}>{opt.label}</span>
                  {opt.description && (
                    <span className="fp-option-desc" style={{ flex: 'none', width: '100%', textAlign: 'left', marginTop: 2 }}>{opt.description}</span>
                  )}
                </div>
                {checked && <Check size={13} className="fp-option-check" />}
              </button>
            );
          })
        )}
      </div>
      <div className="fp-footer">
        <span className="fp-footer-count">
          {filtered.length} {itemNoun}
        </span>
        {values.length > 0 && (
          <button
            type="button"
            className="fp-footer-clear"
            onClick={() => onChange([])}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );

  const active = values.length > 0;

  return (
    <Popover
      content={overlay}
      trigger="click"
      open={disabled ? false : open}
      onOpenChange={(v) => !disabled && setOpen(v)}
      placement="bottomLeft"
      overlayClassName="fp-overlay-popover"
      destroyTooltipOnHide
    >
      <button
        type="button"
        className={`fp-trigger ${active ? "is-active" : ""} ${open ? "is-open" : ""}`}
        disabled={disabled}
      >
        {icon && <span className="fp-trigger-icon">{icon}</span>}
        <span className="fp-trigger-label">{label}</span>
        {active ? (
          <span className="fp-trigger-count">{values.length}</span>
        ) : placeholder ? (
          <span className="fp-trigger-placeholder">{placeholder}</span>
        ) : null}
        <ChevronDown size={12} className={`fp-trigger-chevron ${open ? "is-open" : ""}`} />
      </button>
      <style dangerouslySetInnerHTML={{ __html: TICKET_FILTER_PILL_CSS }} />
    </Popover>
  );
};

const TICKET_FILTER_PILL_CSS = `
/* ── Trigger pill ───────────────────────────────────────── */
.fp-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px 0 10px;
  background: var(--bg-pure-white);
  border: 1px solid var(--border-slate-200);
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-slate-700);
  letter-spacing: -0.005em;
  transition: background 0.12s ease, border-color 0.12s ease, color 0.12s ease;
  white-space: nowrap;
}
.fp-trigger:hover:not(:disabled) {
  background: var(--bg-slate-50);
  border-color: var(--text-slate-400);
  color: var(--text-slate-900);
}
[data-theme='dark'] .fp-trigger {
  background: #111720;
  border-color: #2d3748;
  color: #cbd5e1;
}
[data-theme='dark'] .fp-trigger:hover:not(:disabled) {
  background: #1c232e;
  border-color: #475569;
  color: #f1f5f9;
}
.fp-trigger.is-active {
  background: rgba(59,130,246,0.08);
  border-color: rgba(59,130,246,0.32);
  color: #1d4ed8;
}
.fp-trigger.is-open {
  background: rgba(59,130,246,0.10);
  border-color: rgba(59,130,246,0.45);
  color: #1d4ed8;
}
[data-theme='dark'] .fp-trigger.is-active,
[data-theme='dark'] .fp-trigger.is-open {
  background: rgba(59,130,246,0.18);
  border-color: rgba(59,130,246,0.40);
  color: #93c5fd;
}
.fp-trigger:disabled { opacity: 0.45; cursor: not-allowed; }
.fp-trigger-icon { display: inline-flex; align-items: center; opacity: 0.7; }
.fp-trigger.is-active .fp-trigger-icon,
.fp-trigger.is-open .fp-trigger-icon { opacity: 1; }
.fp-trigger-label { font-weight: 700; }
.fp-trigger-placeholder {
  font-weight: 500;
  color: var(--text-slate-400);
  font-size: 11.5px;
}
.fp-trigger-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  background: rgba(59,130,246,0.16);
  border: 1px solid rgba(59,130,246,0.32);
  color: #1d4ed8;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
[data-theme='dark'] .fp-trigger-count {
  background: rgba(59,130,246,0.25);
  border-color: rgba(59,130,246,0.45);
  color: #93c5fd;
}
.fp-trigger-chevron {
  transition: transform 0.15s ease;
  color: currentColor;
  opacity: 0.6;
}
.fp-trigger-chevron.is-open {
  transform: rotate(180deg);
  opacity: 1;
}

/* ── Overlay panel ──────────────────────────────────────── */
.fp-overlay-popover .ant-popover-inner {
  padding: 0 !important;
  border-radius: 12px !important;
  border: 1px solid var(--border-slate-200) !important;
  box-shadow: none !important;
  background: var(--bg-pure-white) !important;
}
[data-theme='dark'] .fp-overlay-popover .ant-popover-inner {
  background: #0f1419 !important;
  border-color: #2d3748 !important;
}
.fp-overlay-popover .ant-popover-arrow { display: none !important; }
.fp-overlay {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
}

.fp-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border-slate-200);
}
[data-theme='dark'] .fp-search-box { border-bottom-color: #1f2937; }
.fp-search-icon { color: var(--text-slate-400); flex-shrink: 0; }
.fp-search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  outline: 0;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-slate-900);
  letter-spacing: -0.01em;
}
.fp-search-input::placeholder { color: var(--text-slate-400); font-weight: 500; }
[data-theme='dark'] .fp-search-input { color: #f1f5f9; }
.fp-search-clear {
  color: var(--text-slate-400);
  cursor: pointer;
  flex-shrink: 0;
}
.fp-search-clear:hover { color: var(--text-slate-700); }

.fp-list {
  max-height: 280px;
  overflow-y: auto;
  padding: 4px 4px;
}
.fp-list::-webkit-scrollbar { width: 6px; }
.fp-list::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 999px; }
.fp-empty {
  padding: 18px 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-slate-400);
  font-style: italic;
}
.fp-option {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  padding: 6px 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  color: var(--text-slate-700);
  transition: background 0.12s ease;
}
.fp-option:hover { background: var(--bg-slate-50); }
[data-theme='dark'] .fp-option { color: #cbd5e1; }
[data-theme='dark'] .fp-option:hover { background: #1c232e; }
.fp-option.is-selected {
  background: rgba(59,130,246,0.06);
  color: #1d4ed8;
}
[data-theme='dark'] .fp-option.is-selected {
  background: rgba(59,130,246,0.14);
  color: #93c5fd;
}
.fp-option-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: var(--bg-slate-100);
  font-size: 10px;
  font-weight: 800;
  flex-shrink: 0;
}
.fp-option-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  font-size: 9.5px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.02em;
  border: 1px solid var(--border-slate-200);
  overflow: hidden;
  user-select: none;
}
.fp-option-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
[data-theme='dark'] .fp-option-avatar {
  background: #2e354f;
  border-color: #27273a;
  color: #94a3b8;
}
.fp-option-label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fp-option-desc {
  font-size: 11px;
  color: var(--text-slate-500);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
}
.fp-option-check {
  flex-shrink: 0;
  color: #1d4ed8;
}

.fp-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--border-slate-200);
  background: var(--bg-slate-50);
}
[data-theme='dark'] .fp-footer {
  background: #0f1419;
  border-top-color: #1f2937;
}
.fp-footer-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-slate-500);
  letter-spacing: 0;
}
.fp-footer-clear {
  background: transparent;
  border: 0;
  font-family: inherit;
  font-size: 11px;
  font-weight: 700;
  color: #3b82f6;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.12s ease;
}
.fp-footer-clear:hover { background: rgba(59,130,246,0.08); }
`;

export default TicketFilterPill;
