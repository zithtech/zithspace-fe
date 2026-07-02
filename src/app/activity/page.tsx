"use client";

import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import {
  Select,
  DatePicker,
  Input,
  Button,
  Empty,
  Tag,
  Typography,
  Avatar,
  Tooltip,
  Skeleton,
  Pagination,
  Popover,
} from "antd";
import {
  History,
  RotateCw,
  Search,
  X as XIcon,
  ChevronRight,
  ChevronDown,
  Check,
  Compass,
  Boxes,
  FileText,
  Zap,
  Tag as TagIcon,
  User as UserIcon,
  Calendar as CalendarIcon,
  SlidersHorizontal,
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import MainLayout from "@/components/layout/MainLayout";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useTransactionHistoryPaged } from "@/hooks/useTransactionHistoryPaged";
import {
  TransactionHistoryService,
  TransactionHistoryFilters,
  TransactionRow,
} from "@/services/transactionHistoryService";
import { usePermission } from "@/hooks/usePermission";
import { useMembersSelect } from "@/hooks/useMembersSelect";
import { useSocket } from "@/providers/SocketProvider";
import ActivityDiff, { InlineDiff } from "@/components/common/ActivityDiff";

dayjs.extend(relativeTime);
dayjs.extend(isToday);
dayjs.extend(isYesterday);

const { RangePicker } = DatePicker;
const { Text } = Typography;

const ACTION_COLOR: Record<string, string> = {
  create: "green",
  update: "blue",
  delete: "red",
  archive: "orange",
  restore: "cyan",
  permanent_delete: "red",
  status_change: "purple",
  move: "geekblue",
  convert: "magenta",
  verify: "green",
  reopen: "orange",
  start: "green",
  complete: "blue",
  generate_ai: "purple",
  apply: "blue",
  approve: "green",
  reject: "red",
  cancel: "orange",
  run: "purple",
  revoke: "red",
  activate: "green",
  submit: "blue",
};

function actionColor(action: string): string {
  if (ACTION_COLOR[action]) return ACTION_COLOR[action];
  if (action.startsWith("bulk_")) return "geekblue";
  return "default";
}

function initials(name?: string | null, email?: string | null): string {
  const src = name?.trim() || email?.trim() || "";
  if (!src) return "?";
  const parts = src.split(/\s+|@/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || src[0].toUpperCase();
}

function groupLabel(d: dayjs.Dayjs): string {
  if (d.isToday()) return "Today";
  if (d.isYesterday()) return "Yesterday";
  const diffDays = dayjs().startOf("day").diff(d.startOf("day"), "day");
  if (diffDays < 7) return d.format("dddd");
  if (d.year() === dayjs().year()) return d.format("MMM D");
  return d.format("MMM D, YYYY");
}

interface FilterState {
  section?: string;
  module?: string;
  page?: string;
  action?: string;
  entityType?: string;
  actorId?: string;
  search?: string;
  range?: [Dayjs, Dayjs] | null;
}

const datePresets: { key: string; label: string; days: number | null }[] = [
  { key: "24h", label: "24h", days: 1 },
  { key: "7d", label: "7d", days: 7 },
  { key: "30d", label: "30d", days: 30 },
  { key: "all", label: "All", days: null },
];

function chipIcon(key: string): React.ReactNode {
  const props = { size: 11, strokeWidth: 1.75 };
  switch (key) {
    case "section": return <Compass {...props} />;
    case "module": return <Boxes {...props} />;
    case "page": return <FileText {...props} />;
    case "action": return <Zap {...props} />;
    case "entityType": return <TagIcon {...props} />;
    case "actorId": return <UserIcon {...props} />;
    case "range": return <CalendarIcon {...props} />;
    case "search": return <Search {...props} />;
    default: return null;
  }
}

function FilterPill({
  icon,
  active,
  children,
  style,
}: {
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`ax-pill ${active ? "ax-pill-on" : ""}`} style={style}>
      <span className="ax-pill-icon">{icon}</span>
      <div className="ax-pill-control">{children}</div>
    </div>
  );
}

/** Two-letter initials for the option avatar (max 2 chars). */
function optInitials(s: string): string {
  if (!s) return "?";
  // Try split on word boundary or _ - first
  const parts = s
    .replace(/[_\-]/g, " ")
    .split(/(?=[A-Z])|\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return s.slice(0, 2).toUpperCase();
}

function humanize(s: string): string {
  return s
    .replace(/[_-]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/** Shared dropdown row: avatar badge + label + optional code tag + optional sub + check */
function OptionRow({
  initials: i,
  label,
  code,
  sub,
  selected,
}: {
  initials: string;
  label: string;
  code?: string;
  sub?: string;
  selected: boolean;
}) {
  return (
    <div className="ax-opt">
      <div className="ax-opt-avatar">{i}</div>
      <div className="ax-opt-body">
        <div className="ax-opt-row">
          <span className="ax-opt-name">{label}</span>
          {code && <span className="ax-opt-code">{code}</span>}
        </div>
        {sub && <div className="ax-opt-sub">{sub}</div>}
      </div>
      {selected && (
        <svg
          className="ax-opt-check"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>
  );
}

interface DropdownOption {
  value: string;
  label: string;
  description?: string;
  badge?: string | React.ReactNode;
}

interface CustomFilterDropdownProps {
  label: string;
  value?: string;
  placeholder: string;
  options: DropdownOption[];
  onSelect: (value?: string) => void;
  searchPlaceholder?: string;
  footerText?: string;
  footerSummary?: string;
  loading?: boolean;
}

function CustomFilterDropdown({
  label,
  value,
  placeholder,
  options,
  onSelect,
  searchPlaceholder,
  footerText,
  footerSummary,
  loading,
}: CustomFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setSearchText("");
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return options;
    const q = searchText.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.description?.toLowerCase().includes(q)
    );
  }, [options, searchText]);

  const displayValue = useMemo(() => {
    if (!value) return placeholder;
    const opt = options.find((o) => o.value === value);
    return opt ? opt.label : value;
  }, [value, options, placeholder]);

  const dropdownContent = (
    <div className="cf-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="cf-search-box">
        <Search size={14} className="cf-search-icon" />
        <input
          ref={inputRef}
          className="cf-search-input"
          type="text"
          placeholder={searchPlaceholder || "Search..."}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <div className="cf-options-list">
        {loading ? (
          <div className="cf-no-options">Loading options...</div>
        ) : filteredOptions.length === 0 ? (
          <div className="cf-no-options">No items found</div>
        ) : (
          filteredOptions.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <div
                key={opt.value}
                className={`cf-option ${isSelected ? "cf-option-selected" : ""}`}
                onClick={() => {
                  if (isSelected) {
                    onSelect(undefined); // Deselect
                  } else {
                    onSelect(opt.value);
                  }
                  setOpen(false);
                }}
              >
                <div className="cf-option-avatar">
                  {opt.badge || optInitials(opt.label)}
                </div>
                <div className="cf-option-content">
                  <span className="cf-option-name">{opt.label}</span>
                  {opt.description && (
                    <span className="cf-option-desc">{opt.description}</span>
                  )}
                </div>
                {isSelected && (
                  <Check className="cf-option-check" size={14} strokeWidth={2.5} />
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="cf-footer">
        <span className="cf-footer-count">
          {filteredOptions.length} {footerSummary || "items"}
        </span>
        {footerText && <span className="cf-footer-tip">{footerText}</span>}
      </div>
    </div>
  );

  return (
    <Popover
      content={dropdownContent}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      overlayClassName="cf-overlay-popover"
      destroyOnHidden
    >
      <div
        className={`cf-trigger ${value ? "cf-trigger-active" : ""} ${
          open ? "cf-trigger-open" : ""
        }`}
      >
        <div className="cf-trigger-content">
          <span className="cf-trigger-label">{label}</span>
          <div className="cf-trigger-value-row">
            <span className="cf-trigger-value">{displayValue}</span>
          </div>
        </div>
        {value ? (
          <XIcon
            className="cf-trigger-clear-btn"
            size={14}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(undefined);
            }}
          />
        ) : (
          <ChevronDown
            className={`cf-trigger-chevron ${open ? "cf-trigger-chevron-open" : ""}`}
            size={14}
          />
        )}
      </div>
    </Popover>
  );
}

export default function ActivityPage() {
  const { canReadActivityLogAll } = usePermission();
  const { users: members, loading: membersLoading } = useMembersSelect();
  const [filterOpts, setFilterOpts] = useState<TransactionHistoryFilters | null>(null);
  const [filters, setFilters] = useState<FilterState>(() => ({
    range: [dayjs().subtract(1, "day"), dayjs()],
  }));
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [dateOpen, setDateOpen] = useState(false);

  // Local state for debouncing search input
  const [searchVal, setSearchVal] = useState(filters.search || "");

  // Sync searchVal with filters.search when filters.search changes externally
  useEffect(() => {
    setSearchVal(filters.search || "");
  }, [filters.search]);

  // Debounce search input changes to setFilters
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((p) => {
        if (p.search === searchVal) return p;
        return { ...p, search: searchVal || undefined };
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [searchVal]);

  // Reset to page 1 whenever filters change
  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setPageNum(1);
  }, [filterKey]);

  // Absolute total number of records in the database (completely unfiltered)
  const [dbTotal, setDbTotal] = useState<number | null>(null);

  const loadDbTotal = useCallback(() => {
    if (!canReadActivityLogAll) return;
    TransactionHistoryService.listPaged({ pageNum: 1, limit: 1 })
      .then((res) => setDbTotal(res.total))
      .catch(() => {});
  }, [canReadActivityLogAll]);

  useEffect(() => {
    loadDbTotal();
  }, [loadDbTotal]);



  useEffect(() => {
    if (!canReadActivityLogAll) return;
    TransactionHistoryService.filters()
      .then(setFilterOpts)
      .catch(() => {});
  }, [canReadActivityLogAll]);

  const params = useMemo(
    () => ({
      section: filters.section,
      module: filters.module,
      page: filters.page,
      action: filters.action,
      entityType: filters.entityType,
      actorId: filters.actorId,
      search: filters.search,
      from: filters.range?.[0]?.startOf("day")?.toISOString(),
      to: filters.range?.[1]?.endOf("day")?.toISOString(),
    }),
    [filters]
  );

  const { rows, total, loading, refresh, error } = useTransactionHistoryPaged({
    ...params,
    pageNum,
    limit: pageSize,
    enabled: canReadActivityLogAll,
  });

  // Realtime updates — refetch page 1, accumulate a counter on deeper pages
  // so the user can opt-in by clicking the "N new" pill.
  const { socket } = useSocket();
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!socket || !canReadActivityLogAll) return;
    const handler = () => {
      if (pageNum === 1) {
        refresh();
      } else {
        setNewCount((c) => c + 1);
      }
      loadDbTotal();
    };
    socket.on("transaction:created", handler);
    return () => {
      socket.off("transaction:created", handler);
    };
  }, [socket, canReadActivityLogAll, pageNum, refresh, loadDbTotal]);

  // Clear the badge once the user returns to page 1
  useEffect(() => {
    if (pageNum === 1) setNewCount(0);
  }, [pageNum]);

  const jumpToTop = () => {
    setNewCount(0);
    setPageNum(1);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, TransactionRow[]>();
    for (const row of rows) {
      const label = groupLabel(dayjs(row.createdAt));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(row);
    }
    return Array.from(map.entries());
  }, [rows]);

  const activeFilters = useMemo(() => {
    const a: { key: keyof FilterState; label: string; value: string }[] = [];
    if (filters.section) a.push({ key: "section", label: "Section", value: filters.section });
    if (filters.module) a.push({ key: "module", label: "Module", value: filters.module });
    if (filters.page) a.push({ key: "page", label: "Page", value: filters.page });
    if (filters.action) a.push({ key: "action", label: "Action", value: filters.action });
    if (filters.entityType) a.push({ key: "entityType", label: "Entity", value: filters.entityType });
    if (filters.actorId) {
      const m = members.find((u) => u.value === filters.actorId);
      a.push({ key: "actorId", label: "Member", value: m?.label ?? filters.actorId });
    }
    if (filters.search) a.push({ key: "search", label: "Search", value: filters.search });
    if (filters.range)
      a.push({
        key: "range",
        label: "Date",
        value: `${filters.range[0].format("MMM D")} – ${filters.range[1].format("MMM D")}`,
      });
    return a;
  }, [filters, members]);

  // Date-range presets
  const applyPreset = (key: string) => {
    const preset = datePresets.find((p) => p.key === key);
    if (!preset) return;
    if (preset.days === null) {
      setFilters((p) => ({ ...p, range: null }));
    } else {
      const to = dayjs();
      const from = to.subtract(preset.days, "day");
      setFilters((p) => ({ ...p, range: [from, to] }));
    }
  };

  const activePresetKey = useMemo(() => {
    if (!filters.range) return "all";
    const [from, to] = filters.range;
    const days = to.diff(from, "day");
    // Allow a 1-day fuzz since to=now isn't exactly aligned
    const match = datePresets.find((p) => p.days !== null && Math.abs(p.days - days) <= 1);
    return match?.key ?? null;
  }, [filters.range]);

  const clearAll = () =>
    setFilters({
      range: [dayjs().subtract(1, "day"), dayjs()],
    });
  const clearOne = (key: keyof FilterState) =>
    setFilters((p) => {
      const next = { ...p };
      if (key === "section") {
        next.section = undefined;
        next.module = undefined;
        next.page = undefined;
      } else if (key === "module") {
        next.module = undefined;
        next.page = undefined;
      } else {
        next[key] = undefined as any;
      }
      return next;
    });

  // Reverse lookups so module/page rows can show their parent in the description.
  // Declared above the early return so the hook order stays stable across renders.
  const sectionOf = useMemo(() => {
    const map = new Map<string, string>();
    filterOpts?.modules.forEach((m) => map.set(m.module, m.section));
    return map;
  }, [filterOpts?.modules]);

  const moduleOf = useMemo(() => {
    const map = new Map<string, string>();
    filterOpts?.pages.forEach((p) => map.set(p.page, p.module));
    return map;
  }, [filterOpts?.pages]);

  if (!canReadActivityLogAll) {
    return (
      <MainLayout>
        <div style={{ padding: 40 }}>
          <Empty description="You don't have permission to view activity history." />
        </div>
      </MainLayout>
    );
  }

  const modulesForSection = filters.section
    ? filterOpts?.modules.filter((m) => m.section === filters.section).map((m) => m.module)
    : filterOpts?.modules.map((m) => m.module);

  const pagesForModule = filters.module
    ? filterOpts?.pages.filter((p) => p.module === filters.module).map((p) => p.page)
    : filterOpts?.pages.map((p) => p.page);

  return (
    <MainLayout>
      <ActivityStyles />

      <TimeTrackingHeader
        icon={<History size={18} strokeWidth={1.75} style={{ color: "#8b5cf6" }} />}
        title="Activity"
        description={
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap", verticalAlign: "middle" }}>
            <span style={{ color: "var(--text-slate-500, #64748b)", fontWeight: 500 }}>
              All <span style={{ color: "#10b981", fontWeight: 600 }}>create</span>,{" "}
              <span style={{ color: "#3b82f6", fontWeight: 600 }}>update</span>, and{" "}
              <span style={{ color: "#ef4444", fontWeight: 600 }}>delete</span> actions
            </span>
            <span className="ax-header-badge">
              {dbTotal !== null
                ? `${total.toLocaleString()} out of ${dbTotal.toLocaleString()}`
                : `${total.toLocaleString()} total`}
            </span>
          </span>
        }
        searchQuery={searchVal}
        onSearchChange={setSearchVal}
        searchPlaceholder="Search logs..."
        extra={
          <Button
            icon={<RotateCw size={13} />}
            onClick={() => {
              refresh();
              loadDbTotal();
            }}
            size="middle"
            style={{ borderRadius: 6, fontWeight: 600, height: 36 }}
          >
            Refresh
          </Button>
        }
      />

      <div className="ax-shell">
        {/* ─── Filter rail ─────────────────────────────────────── */}
        <div className="ax-filter-card">
          <div className="ax-filter-head">
            <div className="ax-filter-head-left">
              <SlidersHorizontal size={13} strokeWidth={1.75} />
              <span>Filters</span>
              {activeFilters.length > 0 && (
                <span className="ax-active-badge">{activeFilters.length}</span>
              )}
            </div>
            <div className="ax-filter-head-right">
              {datePresets.map((p) => (
                <button
                  key={p.key}
                  className={`ax-preset ${activePresetKey === p.key ? "ax-preset-on" : ""}`}
                  onClick={() => applyPreset(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="ax-filter-grid">
            <CustomFilterDropdown
              label="Section"
              value={filters.section}
              placeholder="All Sections"
              options={filterOpts?.sections.map((s) => ({
                value: s,
                label: s,
                description: "Top navbar section",
              })) ?? []}
              onSelect={(section) => setFilters((p) => ({ ...p, section, module: undefined, page: undefined }))}
              searchPlaceholder="Search sections..."
              footerText="Switch section to view its modules"
              footerSummary="sections"
            />

            <CustomFilterDropdown
              label="Module"
              value={filters.module}
              placeholder="All Modules"
              options={
                Array.from(new Set(modulesForSection ?? [])).map((m) => {
                  const section = sectionOf.get(m);
                  return {
                    value: m,
                    label: m,
                    description: section ? `Module in ${section}` : "Module",
                  };
                }) ?? []
              }
              onSelect={(m) => setFilters((p) => ({ ...p, module: m, page: undefined }))}
              searchPlaceholder="Search modules..."
              footerText="Switch module to view its pages"
              footerSummary="modules"
            />

            <CustomFilterDropdown
              label="Page"
              value={filters.page}
              placeholder="All Pages"
              options={
                Array.from(new Set(pagesForModule ?? [])).map((p) => {
                  const mod = moduleOf.get(p);
                  return {
                    value: p,
                    label: p,
                    description: mod ? `Page in ${mod}` : "Page",
                  };
                }) ?? []
              }
              onSelect={(page) => setFilters((p) => ({ ...p, page }))}
              searchPlaceholder="Search pages..."
              footerText="Filter activity log by page"
              footerSummary="pages"
            />

            <CustomFilterDropdown
              label="Action"
              value={filters.action}
              placeholder="All Actions"
              options={
                filterOpts?.actions.map((a) => ({
                  value: a,
                  label: humanize(a),
                  description: `Action type: ${a}`,
                })) ?? []
              }
              onSelect={(action) => setFilters((p) => ({ ...p, action }))}
              searchPlaceholder="Search actions..."
              footerText="Filter by database action type"
              footerSummary="actions"
            />

            <CustomFilterDropdown
              label="Entity"
              value={filters.entityType}
              placeholder="All Entities"
              options={
                filterOpts?.entityTypes.map((e) => ({
                  value: e,
                  label: humanize(e),
                  description: `Database entity: ${e}`,
                })) ?? []
              }
              onSelect={(entityType) => setFilters((p) => ({ ...p, entityType }))}
              searchPlaceholder="Search entities..."
              footerText="Filter by database model type"
              footerSummary="entities"
            />

            <CustomFilterDropdown
              label="Member"
              value={filters.actorId}
              placeholder="All Members"
              options={
                members.map((u) => ({
                  value: u.value,
                  label: u.label,
                  description: u.email,
                  badge: initials(u.label, u.email),
                })) ?? []
              }
              onSelect={(actorId) => setFilters((p) => ({ ...p, actorId }))}
              searchPlaceholder="Search team members..."
              footerText="Filter logs by member activity"
              footerSummary="members"
              loading={membersLoading}
            />

            <div style={{ position: "relative" }}>
              <div
                className={`cf-trigger ${filters.range ? "cf-trigger-active" : ""}`}
                onClick={() => setDateOpen(true)}
                style={{ minWidth: 160 }}
              >
                <div className="cf-trigger-content">
                  <span className="cf-trigger-label">Date Range</span>
                  <span className="cf-trigger-value">
                    {filters.range
                      ? `${filters.range[0].format("MMM D")} – ${filters.range[1].format("MMM D")}`
                      : "All Time"}
                  </span>
                </div>
                {filters.range ? (
                  <XIcon
                    className="cf-trigger-clear-btn"
                    size={14}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters((p) => ({ ...p, range: null }));
                    }}
                  />
                ) : (
                  <ChevronDown className="cf-trigger-chevron" size={14} />
                )}
              </div>
              <RangePicker
                open={dateOpen}
                onOpenChange={setDateOpen}
                value={filters.range ?? undefined}
                onChange={(range) => setFilters((p) => ({ ...p, range: range as any }))}
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  pointerEvents: "none",
                }}
              />
            </div>

            {activeFilters.length > 0 && (
              <button className="ax-clear-btn" onClick={clearAll}>
                <XIcon size={11} strokeWidth={2} />
                Clear all
              </button>
            )}
          </div>

          {activeFilters.length > 0 && (
            <div className="ax-chip-row">
              {activeFilters.map((f) => (
                <span key={f.key} className="ax-chip">
                  <span className="ax-chip-icon">
                    {chipIcon(f.key)}
                  </span>
                  <span className="ax-chip-label">{f.label}</span>
                  <span className="ax-chip-value">{f.value}</span>
                  <button
                    className="ax-chip-x"
                    onClick={() => clearOne(f.key)}
                    aria-label={`Remove ${f.label} filter`}
                  >
                    <XIcon size={10} strokeWidth={2} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ─── Feed ─── */}
        <div className="ax-feed-wrapper">
          {newCount > 0 && pageNum > 1 && (
            <button className="ax-new-pill" onClick={jumpToTop}>
              <span className="ax-new-dot" />
              {newCount} new {newCount === 1 ? "activity" : "activities"} · jump to top
            </button>
          )}
          {loading && rows.length === 0 ? (
            <div className="ax-feed-card">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="ax-row">
                  <Skeleton.Avatar active size={26} />
                  <div style={{ flex: 1 }}>
                    <Skeleton
                      active
                      paragraph={{ rows: 1, width: ["55%", "30%"] }}
                      title={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="ax-feed-card ax-empty">
              <Empty description={error} />
            </div>
          ) : rows.length === 0 ? (
            <div className="ax-feed-card ax-empty">
              <Empty description="No activity matches these filters." />
            </div>
          ) : (
            <>
              {grouped.map(([label, items]) => (
                <div key={label} className="ax-group">
                  <div className="ax-group-header">
                    <span className="ax-group-label">{label}</span>
                    <span className="ax-group-count">
                      {`${items.length} out of ${total}`}
                    </span>
                    <div className="ax-group-rule" />
                  </div>
                  <div className="ax-feed-card">
                    {items.map((row, idx) => (
                      <ActivityRow
                        key={row.id}
                        row={row}
                        isLast={idx === items.length - 1}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="ax-pager">
                <Pagination
                  current={pageNum}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  pageSizeOptions={[10, 20, 25, 50, 100]}
                  showTotal={(t, [from, to]) =>
                    `${from.toLocaleString()}–${to.toLocaleString()} of ${t.toLocaleString()}`
                  }
                  onChange={(p, size) => {
                    setPageNum(p);
                    if (size !== pageSize) setPageSize(size);
                  }}
                  size="small"
                  disabled={loading}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function ActivityRow({ row, isLast }: { row: TransactionRow; isLast: boolean }) {
  const created = dayjs(row.createdAt);
  const singleField =
    row.changedFields && row.changedFields.length === 1 ? row.changedFields[0] : null;
  // When inlining a single-field diff, strip the redundant "(fieldName)" suffix
  // the BE appends to action_label so the line doesn't say the field twice.
  const displayLabel = singleField
    ? (row.actionLabel || row.action).replace(/\s*\(.*?\)\s*$/, "")
    : row.actionLabel || row.action;

  return (
    <div className={`ax-row ${isLast ? "ax-row-last" : ""}`}>
      <Tooltip title={created.format("dddd, MMM D, YYYY · HH:mm:ss")}>
        <span className="ax-time-col">
          <span className="ax-time-date">{created.format("MMM D")}</span>
          <span className="ax-time-clock">{created.format("HH:mm")}</span>
        </span>
      </Tooltip>
      <Avatar size={26} className="ax-avatar">
        {initials(row.actor?.name, row.actor?.email)}
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ax-row-head">
          <Text strong className="ax-actor">
            {row.actor?.name || row.actor?.email || "Unknown"}
          </Text>
          <Tag color={actionColor(row.action)} className="ax-action-tag">
            {row.action}
          </Tag>
          <span className="ax-crumb">
            <span className="ax-crumb-section">{row.section}</span>
            <ChevronRight size={10} className="ax-crumb-sep" strokeWidth={2} />
            <span>{row.module}</span>
            {row.page && (
              <>
                <ChevronRight size={10} className="ax-crumb-sep" strokeWidth={2} />
                <span>{row.page}</span>
              </>
            )}
          </span>
          <Tooltip title={created.format("dddd, MMM D, YYYY · HH:mm:ss")}>
            <Text type="secondary" className="ax-time-rel">
              {created.format("MMM D, HH:mm")} · {created.fromNow()}
            </Text>
          </Tooltip>
        </div>
        <div className="ax-row-body">
          <Text className="ax-action-label">{displayLabel}</Text>
          {row.entityLabel && (
            <>
              <span className="ax-row-dot">·</span>
              <Text type="secondary" className="ax-entity-label">{row.entityLabel}</Text>
            </>
          )}
          {singleField && (
            <>
              <span className="ax-row-dot">·</span>
              <span className="ax-inline-diff">
                <InlineDiff row={row} field={singleField} />
              </span>
            </>
          )}
        </div>
        {!singleField && <ActivityDiff row={row} maxLines={4} />}
      </div>
    </div>
  );
}

/* Static styles — no JS interpolation, avoids SWC compile-loop. */
function ActivityStyles() {
  return (
    <style>{`
      .ax-header-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 700;
        border-radius: 999px;
        background: #ede9fe;
        color: #7c3aed;
        border: 1px solid #ddd6fe;
        margin-left: 6px;
        font-variant-numeric: tabular-nums;
        line-height: 1.4;
      }
      [data-theme='dark'] .ax-header-badge {
        background: rgba(139, 92, 246, 0.15);
        color: #c4b5fd;
        border-color: rgba(167, 139, 250, 0.25);
      }

      .saas-header-container {
        position: sticky !important;
        top: 0 !important;
        z-index: 1000 !important;
        margin: 0 -8px 14px -8px !important;
        padding: 8.5px 32px !important;
      }

      .ax-shell {
        padding: 0 24px 32px;
      }

      /* ─── Filter rail ────────────────────────── */
      .ax-filter-card {
        background: var(--bg-pure-white, #ffffff);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 12px;
        padding: 12px 14px;
        margin-bottom: 14px;
      }
      .ax-filter-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-color, #f0f0f0);
      }
      .ax-filter-head-left {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-slate-500, #64748b);
      }
      .ax-active-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 18px;
        height: 18px;
        padding: 0 6px;
        background: #ede9fe;
        color: #7c3aed;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0;
      }
      .ax-filter-head-right {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 2px;
        background: var(--bg-slate-50, #f8fafc);
        border-radius: 8px;
        border: 1px solid var(--border-color, #e2e8f0);
      }
      .ax-preset {
        background: transparent;
        border: none;
        font-size: 11px;
        font-weight: 600;
        color: var(--text-slate-500, #64748b);
        cursor: pointer;
        padding: 4px 10px;
        border-radius: 6px;
        line-height: 1.4;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .ax-preset:hover {
        color: var(--text-slate-900, #0f172a);
        background: var(--bg-pure-white, #ffffff);
      }
      .ax-preset-on {
        background: var(--bg-pure-white, #ffffff) !important;
        color: #7c3aed !important;
        border: 1px solid #ddd6fe;
        padding: 3px 9px;
      }

      .ax-filter-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      /* Premium pill wrapper around each filter control */
      .ax-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: var(--bg-pure-white, #ffffff);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 8px;
        padding: 0 4px 0 10px;
        height: 32px;
        min-width: 140px;
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      .ax-pill:hover {
        border-color: var(--text-slate-300, #cbd5e1);
      }
      .ax-pill-on {
        border-color: #c4b5fd;
        background: #faf9ff;
      }
      .ax-pill-icon {
        display: inline-flex;
        align-items: center;
        color: var(--text-slate-400, #94a3b8);
        flex-shrink: 0;
      }
      .ax-pill-on .ax-pill-icon {
        color: #7c3aed;
      }
      .ax-pill-control { flex: 1; min-width: 0; }
      .ax-pill-control .ant-select,
      .ax-pill-control .ant-picker {
        width: 100%;
      }
      .ax-pill-control .ant-select-selector,
      .ax-pill-control .ant-picker {
        background: transparent !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        height: 30px !important;
      }
      .ax-pill-control .ant-select-selection-item,
      .ax-pill-control .ant-select-selection-placeholder {
        font-size: 12px !important;
        font-weight: 600 !important;
        line-height: 30px !important;
      }
      .ax-pill-on .ant-select-selection-item {
        color: var(--text-slate-900, #0f172a) !important;
      }
      .ax-pill-control .ant-picker-input > input {
        font-size: 12px;
        font-weight: 600;
      }
      .ax-pill-control .ant-select-clear,
      .ax-pill-control .ant-picker-clear {
        background: transparent !important;
      }

      .ax-clear-btn {
        margin-left: auto;
        background: transparent;
        border: 1px dashed var(--border-color, #e2e8f0);
        font-size: 11px;
        font-weight: 700;
        color: var(--text-slate-500, #64748b);
        cursor: pointer;
        padding: 0 10px;
        height: 32px;
        border-radius: 8px;
        transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .ax-clear-btn:hover {
        color: #b91c1c;
        border-color: #fecaca;
        background: #fef2f2;
      }

      .ax-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px dashed var(--border-color, #e2e8f0);
      }
      .ax-chip {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 2px 6px 2px 7px;
        background: #faf9ff;
        border: 1px solid #ddd6fe;
        border-radius: 999px;
        font-size: 10.5px;
        line-height: 1.4;
      }
      .ax-chip-icon {
        display: inline-flex;
        align-items: center;
        color: #7c3aed;
        margin-right: 1px;
      }
      .ax-chip-label {
        font-weight: 700;
        color: #7c3aed;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        font-size: 9.5px;
      }
      .ax-chip-value {
        color: var(--text-slate-900, #0f172a);
        font-weight: 600;
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ax-chip-x {
        background: transparent;
        border: none;
        color: #a78bfa;
        cursor: pointer;
        padding: 0;
        display: inline-flex;
        align-items: center;
        line-height: 0;
        border-radius: 999px;
        width: 14px;
        height: 14px;
        justify-content: center;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .ax-chip-x:hover {
        background: #ede9fe;
        color: #6d28d9;
      }

      /* ─── Feed groups ────────────────────────── */
      .ax-feed-wrapper { display: flex; flex-direction: column; gap: 10px; }
      .ax-group-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 2px 4px;
      }
      .ax-group-label {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-slate-600, #475569);
      }
      .ax-group-count {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-slate-500, #64748b);
        background: var(--bg-slate-50, #f8fafc);
        border: 1px solid var(--border-color, #e2e8f0);
        padding: 0 6px;
        border-radius: 999px;
        font-variant-numeric: tabular-nums;
        line-height: 1.5;
      }
      .ax-group-rule {
        flex: 1;
        height: 1px;
        background: var(--border-color, #e2e8f0);
      }
      .ax-feed-card {
        background: var(--bg-pure-white, #ffffff);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 10px;
        overflow: hidden;
      }
      .ax-empty {
        padding: 40px 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* ─── Row (dense) ────────────────────────── */
      .ax-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 8px 14px;
        border-bottom: 1px solid var(--border-color, #f0f0f0);
        transition: background 0.1s ease;
        font-size: 12.5px;
        line-height: 1.45;
      }
      .ax-row:hover { background: var(--bg-slate-50, #f8fafc); }
      .ax-row-last { border-bottom: none; }
      .ax-time-col {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        font-variant-numeric: tabular-nums;
        color: var(--text-slate-400, #94a3b8);
        font-weight: 600;
        padding-top: 3px;
        flex-shrink: 0;
        width: 52px;
        line-height: 1.25;
        cursor: help;
      }
      .ax-time-date {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-slate-500, #64748b);
      }
      .ax-time-clock {
        font-size: 11px;
        color: var(--text-slate-700, #334155);
      }
      .ax-avatar {
        background-color: #ede9fe !important;
        color: #7c3aed !important;
        font-weight: 700 !important;
        font-size: 11px !important;
        flex-shrink: 0;
        margin-top: 1px;
      }
      .ax-row-head {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }
      .ax-actor.ant-typography {
        font-size: 12.5px;
        color: var(--text-slate-900, #0f172a);
      }
      .ax-action-tag.ant-tag {
        margin: 0;
        text-transform: uppercase;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.05em;
        padding: 0 6px;
        line-height: 16px;
        border-radius: 3px;
      }
      .ax-crumb {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        font-size: 10.5px;
        color: var(--text-slate-500, #64748b);
        font-weight: 600;
      }
      .ax-crumb-section { color: var(--text-slate-700, #334155); }
      .ax-crumb-sep { color: var(--text-slate-300, #cbd5e1); }
      .ax-time-rel.ant-typography {
        margin-left: auto;
        font-size: 10.5px;
        white-space: nowrap;
      }
      .ax-row-body {
        margin-top: 2px;
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 5px;
      }
      .ax-action-label.ant-typography {
        font-size: 12px;
        color: var(--text-slate-900, #0f172a);
      }
      .ax-row-dot { color: var(--text-slate-300, #cbd5e1); font-size: 11px; }
      .ax-entity-label.ant-typography { font-size: 11.5px; }
      .ax-inline-diff { font-size: 11.5px; line-height: 1.5; }
      .ax-new-pill {
        align-self: center;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: #faf5ff;
        border: 1px solid #ddd6fe;
        color: #6d28d9;
        font-size: 12px;
        font-weight: 600;
        padding: 6px 14px;
        border-radius: 999px;
        cursor: pointer;
        margin-bottom: 4px;
        transition: background 0.15s ease, border-color 0.15s ease;
      }
      .ax-new-pill:hover {
        background: #f3e8ff;
        border-color: #c4b5fd;
      }
      .ax-new-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #7c3aed;
        animation: ax-pulse 1.6s ease-in-out infinite;
        box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.5);
      }
      @keyframes ax-pulse {
        0%   { box-shadow: 0 0 0 0    rgba(124, 58, 237, 0.45); }
        70%  { box-shadow: 0 0 0 7px  rgba(124, 58, 237, 0);    }
        100% { box-shadow: 0 0 0 0    rgba(124, 58, 237, 0);    }
      }
      [data-theme='dark'] .ax-new-pill {
        background: rgba(124, 58, 237, 0.12);
        border-color: rgba(167, 139, 250, 0.30);
        color: #c4b5fd;
      }
      [data-theme='dark'] .ax-new-pill:hover {
        background: rgba(124, 58, 237, 0.20);
        border-color: rgba(167, 139, 250, 0.45);
      }
      [data-theme='dark'] .ax-new-dot { background: #a78bfa; }

      .ax-pager {
        position: sticky;
        bottom: 0;
        z-index: 100;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(8px);
        border-top: 1px solid var(--border-color, #e2e8f0);
        padding: 14px 24px;
        margin: 16px -24px -32px -24px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        box-shadow: 0 -4px 12px -4px rgba(0, 0, 0, 0.05);
      }
      .ax-pager .ant-pagination {
        margin: 0;
      }
      .ax-pager .ant-pagination-total-text {
        font-size: 11.5px;
        color: var(--text-slate-500, #64748b);
        font-weight: 600;
        margin-right: 12px;
      }

      /* Dark mode override for sticky pagination */
      [data-theme='dark'] .ax-pager {
        background: rgba(15, 21, 36, 0.95);
        border-top-color: var(--border-slate-800, #1f2937);
        box-shadow: 0 -4px 12px -4px rgba(0, 0, 0, 0.2);
      }

      /* ─── Dark mode overrides ─── */
      [data-theme='dark'] .ax-filter-card {
        background: var(--bg-slate-900, #0f1524);
        border-color: var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .ax-filter-head {
        border-bottom-color: var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .ax-filter-head-right {
        background: rgba(255, 255, 255, 0.03);
        border-color: var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .ax-preset:hover {
        background: rgba(255, 255, 255, 0.05);
      }
      [data-theme='dark'] .ax-preset-on {
        background: rgba(124, 58, 237, 0.15) !important;
        border-color: rgba(167, 139, 250, 0.30);
        color: #c4b5fd !important;
      }
      [data-theme='dark'] .ax-active-badge {
        background: rgba(124, 58, 237, 0.20);
        color: #c4b5fd;
      }

      [data-theme='dark'] .ax-pill {
        background: rgba(255, 255, 255, 0.02);
        border-color: var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .ax-pill:hover {
        border-color: rgba(255, 255, 255, 0.15);
      }
      [data-theme='dark'] .ax-pill-on {
        background: rgba(124, 58, 237, 0.10);
        border-color: rgba(167, 139, 250, 0.35);
      }
      [data-theme='dark'] .ax-pill-icon {
        color: var(--text-slate-500, #64748b);
      }
      [data-theme='dark'] .ax-pill-on .ax-pill-icon {
        color: #a78bfa;
      }
      [data-theme='dark'] .ax-pill-on .ant-select-selection-item {
        color: #e6e8ee !important;
      }

      [data-theme='dark'] .ax-clear-btn {
        border-color: var(--border-slate-800, #1f2937);
        color: var(--text-slate-400, #94a3b8);
      }
      [data-theme='dark'] .ax-clear-btn:hover {
        color: #fca5a5;
        border-color: rgba(248, 113, 113, 0.30);
        background: rgba(248, 113, 113, 0.08);
      }

      [data-theme='dark'] .ax-chip {
        background: rgba(124, 58, 237, 0.10);
        border-color: rgba(167, 139, 250, 0.30);
      }
      [data-theme='dark'] .ax-chip-icon,
      [data-theme='dark'] .ax-chip-label {
        color: #c4b5fd;
      }
      [data-theme='dark'] .ax-chip-value {
        color: #e6e8ee;
      }
      [data-theme='dark'] .ax-chip-x {
        color: #a78bfa;
      }
      [data-theme='dark'] .ax-chip-x:hover {
        background: rgba(124, 58, 237, 0.25);
        color: #ddd6fe;
      }

      [data-theme='dark'] .ax-feed-card {
        background: var(--bg-slate-900, #0f1524);
        border-color: var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .ax-row {
        border-bottom-color: var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .ax-row:hover {
        background: rgba(255, 255, 255, 0.02);
      }
      [data-theme='dark'] .ax-avatar {
        background-color: rgba(124, 58, 237, 0.20) !important;
        color: #c4b5fd !important;
      }
      [data-theme='dark'] .ax-group-count {
        background: rgba(255, 255, 255, 0.03);
        border-color: var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .ax-time-date { color: var(--text-slate-500, #64748b); }
      [data-theme='dark'] .ax-time-clock { color: #e6e8ee; }

      /* ─── Rich dropdown rows ─── */
      .ax-opt {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 4px 2px;
        min-height: 38px;
      }
      .ax-opt-avatar {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        background: var(--bg-slate-100, #f1f5f9);
        color: var(--text-slate-600, #475569);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.02em;
        flex-shrink: 0;
        border: 1px solid var(--border-color, #e2e8f0);
      }
      .ax-opt-body { flex: 1; min-width: 0; line-height: 1.3; }
      .ax-opt-row {
        display: flex;
        align-items: baseline;
        gap: 8px;
        min-width: 0;
      }
      .ax-opt-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-slate-900, #0f172a);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ax-opt-code {
        font-size: 9.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--text-slate-500, #64748b);
        background: var(--bg-slate-100, #f1f5f9);
        border-radius: 4px;
        padding: 1px 6px;
        line-height: 1.5;
        flex-shrink: 0;
      }
      .ax-opt-sub {
        font-size: 11px;
        color: var(--text-slate-500, #64748b);
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ax-opt-check {
        color: #7c3aed;
        flex-shrink: 0;
        margin-left: auto;
      }
      .ax-dropdown.ant-select-dropdown {
        padding: 4px;
        border-radius: 10px;
      }
      .ax-dropdown .ant-select-item {
        border-radius: 8px;
        padding: 4px 8px;
      }
      .ax-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
        background: #faf9ff;
      }
      .ax-dropdown .ant-select-item-option-selected .ax-opt-avatar {
        background: #ede9fe;
        border-color: #ddd6fe;
        color: #7c3aed;
      }

      [data-theme='dark'] .ax-dropdown.ant-select-dropdown {
        background: var(--bg-slate-900, #0f1524);
        border: 1px solid var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .ax-opt-avatar {
        background: rgba(255, 255, 255, 0.04);
        border-color: var(--border-slate-800, #1f2937);
        color: var(--text-slate-400, #94a3b8);
      }
      [data-theme='dark'] .ax-opt-name { color: #e6e8ee; }
      [data-theme='dark'] .ax-opt-code {
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-slate-400, #94a3b8);
      }
      [data-theme='dark'] .ax-opt-sub { color: var(--text-slate-500, #64748b); }
      [data-theme='dark'] .ax-opt-check { color: #a78bfa; }
      [data-theme='dark'] .ax-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
        background: rgba(124, 58, 237, 0.12);
      }
      [data-theme='dark'] .ax-dropdown .ant-select-item-option-selected .ax-opt-avatar {
        background: rgba(124, 58, 237, 0.20);
        border-color: rgba(167, 139, 250, 0.30);
        color: #c4b5fd;
      }
      [data-theme='dark'] .ax-dropdown .ant-select-item-option-active:not(.ant-select-item-option-disabled) {
        background: rgba(255, 255, 255, 0.04);
      }

      /* ─── Custom Filter Dropdowns ──────────────── */
      .cf-trigger {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        background: var(--bg-pure-white, #ffffff);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 8px;
        padding: 5px 12px;
        height: 42px;
        min-width: 150px;
        cursor: pointer;
        transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        user-select: none;
      }
      .cf-trigger:hover {
        border-color: var(--text-slate-400, #cbd5e1);
        background: var(--bg-slate-50, #f8fafc);
      }
      .cf-trigger-active {
        border-color: #7c3aed;
        background: #faf9ff;
      }
      .cf-trigger-open {
        border-color: #7c3aed;
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.12);
      }
      .cf-trigger-content {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        line-height: 1.2;
        gap: 1px;
        flex: 1;
        min-width: 0;
      }
      .cf-trigger-label {
        font-size: 8.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-slate-400, #94a3b8);
      }
      .cf-trigger-value-row {
        display: flex;
        align-items: center;
        gap: 6px;
        width: 100%;
        min-width: 0;
      }
      .cf-trigger-value {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-slate-800, #1e293b);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .cf-trigger-active .cf-trigger-value {
        color: var(--text-slate-900, #0f172a);
      }
      .cf-trigger-chevron {
        color: var(--text-slate-400, #94a3b8);
        transition: transform 0.2s ease, color 0.2s ease;
        margin-left: 6px;
        flex-shrink: 0;
      }
      .cf-trigger-chevron-open {
        transform: rotate(180deg);
        color: #7c3aed;
      }
      .cf-trigger-clear-btn {
        color: var(--text-slate-400, #94a3b8);
        transition: color 0.15s ease;
        margin-left: 6px;
        flex-shrink: 0;
      }
      .cf-trigger-clear-btn:hover {
        color: #b91c1c;
      }

      /* Dark mode triggers */
      [data-theme='dark'] .cf-trigger {
        background: rgba(255, 255, 255, 0.02);
        border-color: var(--border-slate-800, #1f2937);
      }
      [data-theme='dark'] .cf-trigger:hover {
        background: rgba(255, 255, 255, 0.04);
        border-color: var(--border-slate-700, #374151);
      }
      [data-theme='dark'] .cf-trigger-active {
        background: rgba(124, 58, 237, 0.06);
        border-color: rgba(167, 139, 250, 0.3);
      }
      [data-theme='dark'] .cf-trigger-open {
        border-color: rgba(167, 139, 250, 0.45);
        box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
      }
      [data-theme='dark'] .cf-trigger-value {
        color: #e2e8f0;
      }
      [data-theme='dark'] .cf-trigger-active .cf-trigger-value {
        color: #f8fafc;
      }

      /* Dropdown Overlay / Content Card */
      .cf-overlay-popover.ant-popover {
        padding-top: 4px;
      }
      .cf-overlay-popover .ant-popover-content {
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        border: 1px solid var(--border-color, #e2e8f0);
        overflow: hidden;
      }
      .cf-overlay-popover .ant-popover-inner {
        padding: 0 !important;
        background: var(--bg-pure-white, #ffffff) !important;
        border-radius: 12px;
      }
      [data-theme='dark'] .cf-overlay-popover .ant-popover-content {
        border-color: #27273a;
      }
      [data-theme='dark'] .cf-overlay-popover .ant-popover-inner {
        background: #181824 !important;
      }

      .cf-overlay {
        display: flex;
        flex-direction: column;
        width: 290px;
        max-height: 380px;
      }
      
      /* Search Box */
      .cf-search-box {
        display: flex;
        align-items: center;
        padding: 8px 10px;
        border-bottom: 1px solid var(--border-color, #f0f0f0);
        gap: 8px;
      }
      [data-theme='dark'] .cf-search-box {
        border-bottom-color: #27273a;
      }
      .cf-search-icon {
        color: var(--text-slate-400, #94a3b8);
        flex-shrink: 0;
      }
      .cf-search-input {
        flex: 1;
        background: var(--bg-slate-50, #f8fafc);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 6px;
        padding: 5px 8px;
        font-size: 12px;
        color: var(--text-slate-800, #1e293b);
        outline: none;
        transition: border-color 0.15s ease, background 0.15s ease;
      }
      .cf-search-input:focus {
        border-color: #7c3aed;
        background: var(--bg-pure-white, #ffffff);
      }
      [data-theme='dark'] .cf-search-input {
        background: #1f2937;
        border-color: #27273a;
        color: #e2e8f0;
      }
      [data-theme='dark'] .cf-search-input:focus {
        border-color: #a78bfa;
        background: #181824;
      }

      /* Options List */
      .cf-options-list {
        flex: 1;
        overflow-y: auto;
        max-height: 240px;
        padding: 4px;
      }
      .cf-no-options {
        padding: 24px;
        text-align: center;
        font-size: 12px;
        color: var(--text-slate-400, #94a3b8);
      }
      
      /* Option Row */
      .cf-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s ease, color 0.15s ease;
        user-select: none;
      }
      .cf-option:hover {
        background: var(--bg-slate-50, #f8fafc);
      }
      .cf-option-selected {
        background: #faf9ff;
      }
      [data-theme='dark'] .cf-option:hover {
        background: rgba(255, 255, 255, 0.04);
      }
      [data-theme='dark'] .cf-option-selected {
        background: rgba(124, 58, 237, 0.12);
      }

      /* Option Avatar/Badge */
      .cf-option-avatar {
        width: 32px;
        height: 32px;
        border-radius: 6px;
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
      }
      .cf-option-selected .cf-option-avatar {
        background: #ede9fe;
        color: #7c3aed;
        border-color: #ddd6fe;
      }
      [data-theme='dark'] .cf-option-avatar {
        background: #2e354f;
        border-color: #27273a;
        color: #94a3b8;
      }
      [data-theme='dark'] .cf-option-selected .cf-option-avatar {
        background: rgba(124, 58, 237, 0.2);
        color: #c4b5fd;
        border-color: rgba(167, 139, 250, 0.3);
      }

      .cf-option-content {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        line-height: 1.35;
      }
      .cf-option-name {
        font-size: 12.5px;
        font-weight: 600;
        color: var(--text-slate-800, #1e293b);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .cf-option-selected .cf-option-name {
        color: var(--text-slate-900, #0f172a);
      }
      [data-theme='dark'] .cf-option-name {
        color: #cbd5e1;
      }
      [data-theme='dark'] .cf-option-selected .cf-option-name {
        color: #f8fafc;
      }

      .cf-option-desc {
        font-size: 10.5px;
        color: var(--text-slate-400, #94a3b8);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .cf-option-selected .cf-option-desc {
        color: #7c3aed;
      }
      [data-theme='dark'] .cf-option-selected .cf-option-desc {
        color: #a78bfa;
      }

      .cf-option-check {
        color: #7c3aed;
        flex-shrink: 0;
        margin-left: auto;
      }
      [data-theme='dark'] .cf-option-check {
        color: #a78bfa;
      }

      /* Footer */
      .cf-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-top: 1px solid var(--border-color, #f0f0f0);
        background: var(--bg-slate-50, #f8fafc);
        font-size: 10.5px;
        color: var(--text-slate-400, #94a3b8);
      }
      [data-theme='dark'] .cf-footer {
        border-top-color: #27273a;
        background: rgba(0, 0, 0, 0.15);
      }
      .cf-footer-count {
        font-weight: 600;
      }
      .cf-footer-tip {
        font-style: italic;
      }
    `}</style>
  );
}
