"use client";

/**
 * Test Scope approvals — the scopes routed to the signed-in approver.
 *
 * This used to be a tab on the Test Scope page. It lives here now so an
 * approver has a single queue to work through: submissions and scopes are both
 * decisions waiting on them, and they were previously two separate screens.
 */

import React, { useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Input, Select, Table, Tooltip, message } from "antd";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EllipsisOutlined,
  SearchOutlined,
  SendOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { Menu, RotateCw } from "lucide-react";
import { useRouter } from "next/navigation";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { usePermission } from "@/hooks/usePermission";
import { api as axios, apiClient } from "@/lib/axios";
import { ProjectService } from "@/services/projectService";
import { StatTile } from "../qa-submissions/shared";

function initialsOf(name: string) {
  if (!name) return "TS";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const STATUS_TONE: Record<string, string> = {
  Approved: "green",
  Rejected: "red",
  "In Review": "blue",
  Draft: "ash",
};

/** Status as a dotted pill — reads faster than a solid tag in a dense table. */
const StatusPill = ({ status }: { status?: string }) => {
  const tone = STATUS_TONE[status || ""] || "blue";
  return (
    <span className={`sc-pill sc-pill--${tone}`}>
      <span className="sc-pill__dot" />
      {status || "—"}
    </span>
  );
};

const PRIORITY_LEVEL: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

/** Priority as filled steps — conveys rank without adding accent colours. */
const PriorityMeter = ({ priority }: { priority?: string }) => {
  const level = PRIORITY_LEVEL[priority || ""] || 0;
  if (!level) return <span className="sc-muted">—</span>;
  return (
    <Tooltip title={`${priority} priority`}>
      <span className="sc-prio">
        <span className="sc-prio__bars">
          {[1, 2, 3, 4].map(i => (
            <span key={i} className={`sc-prio__bar${i <= level ? " is-on" : ""}${level === 4 ? " is-max" : ""}`} />
          ))}
        </span>
        <span className="sc-prio__label">{priority}</span>
      </span>
    </Tooltip>
  );
};

/** Initials avatar + name; falls back to a dash when unassigned. */
const PersonChip = ({ name, muted }: { name?: string; muted?: boolean }) => {
  if (!name) return <span className="sc-muted">—</span>;
  return (
    <span className="sc-person">
      <span className={`sc-person__av${muted ? " is-muted" : ""}`}>{initialsOf(name)}</span>
      <span className="sc-person__name">{name}</span>
    </span>
  );
};

export default function ScopeApprovals({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const router = useRouter();
  const { canApproveScope } = usePermission();

  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const [stats, setStats] = useState<any>({ approved: 0, rejected: 0, pendingApprovals: 0 });
  const [scopeSettings, setScopeSettings] = useState<any[]>([]);
  const [userProjects, setUserProjects] = useState<{ value: string; label: string }[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [projectFilter, setProjectFilter] = useState<string | undefined>();

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, projectFilter]);

  const fetchScopes = async () => {
    try {
      setLoading(true);
      // apiClient (raw axios) so the pagination envelope survives
      const res: any = await apiClient.get("/api/v2/qa/test-scopes", {
        params: {
          page,
          pageSize,
          search: debouncedSearch || undefined,
          status: statusFilter || undefined,
          ...(projectFilter ? { product: projectFilter } : {}),
          ...(userProjects.length > 0 ? { allowed_products: userProjects.map(p => p.label).join(",") } : {}),
          sortBy: "created_at",
          sortOrder: "desc",
          isApproval: "true",
        },
      });
      const body = res.data;
      setRows(body?.data || []);
      setTotal(body?.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res: any = await axios.get("/api/v2/qa/test-scopes/stats");
      if (res && res.totalScopes !== undefined) setStats(res);
    } catch (err) {
      console.error("fetchStats error:", err);
    }
  };

  useEffect(() => {
    if (!canApproveScope) return;
    fetchScopes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canApproveScope, page, pageSize, debouncedSearch, statusFilter, projectFilter, userProjects]);

  useEffect(() => {
    if (!canApproveScope) return;
    fetchStats();
    axios
      .get(`/api/v2/qa/test-scopes/settings?_t=${Date.now()}`)
      .then((res: any) => {
        const data = Array.isArray(res) ? res : res?.data?.data || res?.data || [];
        setScopeSettings(Array.isArray(data) ? data : []);
      })
      .catch(() => { /* falls back to the built-in status list */ });
    ProjectService.getUserProjects(true)
      .then((projects: any) => {
        const list = Array.isArray(projects) ? projects : projects?.data ?? [];
        setUserProjects(
          list
            .map((p: any) => ({ value: String(p.label ?? p.name ?? ""), label: String(p.label ?? p.name ?? "") }))
            .filter((p: any) => p.value),
        );
      })
      .catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canApproveScope]);

  const handleRefresh = async () => {
    try {
      await Promise.all([fetchScopes(), fetchStats()]);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const performApprovalAction = async (record: any, newStatus: string) => {
    try {
      const payload = {
        ...record,
        status: newStatus,
        details: {
          ...(record.details || {}),
          approvalWorkflow: {
            ...(record.details?.approvalWorkflow || {}),
            status: newStatus === "Approved" ? "approved" : "rejected",
          },
        },
      };
      await axios.put(`/api/v2/qa/test-scopes/${record.id}`, payload);
      message.success(`Test Scope ${newStatus === "Approved" ? "approved" : "rejected"} successfully`);
      await Promise.all([fetchScopes(), fetchStats()]);
    } catch (error) {
      console.error(error);
      message.error(`Failed to ${newStatus === "Approved" ? "approve" : "reject"} Test Scope`);
    }
  };

  const statusOptions = useMemo(() => {
    const fromSettings = scopeSettings
      .filter(s => s.category === "status")
      .map(s => ({ value: s.value, label: s.label }));
    return fromSettings.length > 0
      ? fromSettings
      : ["Draft", "In Review", "Approved", "Rejected", "On Hold", "Archived"].map(v => ({ value: v, label: v }));
  }, [scopeSettings]);

  const activeFilterCount = (searchTerm.trim() ? 1 : 0) + (statusFilter ? 1 : 0) + (projectFilter ? 1 : 0);
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter(undefined);
    setProjectFilter(undefined);
  };

  const columns = [
    {
      title: "Test Scope", dataIndex: "name", key: "name", width: 320,
      render: (t: string, r: any) => (
        <div className="sc-name">
          <span className="sc-name__badge">{initialsOf(t || "")}</span>
          <span className="sc-name__text">
            <span className="sc-name__title">{t || "Untitled scope"}</span>
            {r.type ? <span className="sc-name__meta">{r.type}</span> : null}
          </span>
        </div>
      ),
    },
    {
      title: "Status", dataIndex: "status", key: "status", width: 130,
      render: (t: string) => <StatusPill status={t} />,
    },
    {
      title: "Priority", dataIndex: "priority", key: "priority", width: 120,
      render: (t: string) => <PriorityMeter priority={t} />,
    },
    {
      title: "QA Owner", dataIndex: "qa_owner", key: "qa_owner", width: 170,
      render: (t: string) => <PersonChip name={t} />,
    },
    {
      title: "Decision",
      key: "actions",
      render: (_: any, r: any) => {
        const isProcessed = r.status === "Approved" || r.status === "Rejected";
        return (
          <div style={{ display: "flex", gap: 8 }} onClick={(e) => e.stopPropagation()}>
            {isProcessed ? (
              <Button type="primary" size="small" disabled style={{ background: "var(--bg-slate-200)", borderColor: "transparent", color: "var(--text-slate-400)" }}>Approve</Button>
            ) : (
              <ConfirmDialog
                tone="success"
                title="Approve Test Scope?"
                description="Are you sure you want to approve this test scope?"
                confirmText="Approve"
                onConfirm={async () => { await performApprovalAction(r, "Approved"); }}
              >
                <Button type="primary" size="small" style={{ background: "#10b981", borderColor: "#10b981" }}>Approve</Button>
              </ConfirmDialog>
            )}

            {isProcessed ? (
              <Button type="default" danger size="small" disabled>Reject</Button>
            ) : (
              <ConfirmDialog
                tone="danger"
                title="Reject Test Scope?"
                description="Are you sure you want to reject this test scope?"
                confirmText="Reject"
                onConfirm={async () => { await performApprovalAction(r, "Rejected"); }}
              >
                <Button type="default" danger size="small">Reject</Button>
              </ConfirmDialog>
            )}
          </div>
        );
      },
    },
  ];

  const menuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, bg: string) => (
    <div className="pp-menu-item" style={{ padding: 0 }}>
      <div className="pp-menu-ic" style={{ color, background: bg }}>{icon}</div>
      <div className="pp-menu-text">
        <div className="pp-menu-title" style={{ color }}>{title}</div>
        <div className="pp-menu-desc">{desc}</div>
      </div>
    </div>
  );

  const actionMenu = (r: any) => {
    const isProcessed = r.status === "Approved" || r.status === "Rejected";
    return {
      className: "pp-action-menu",
      items: [
        {
          key: "approve",
          disabled: isProcessed,
          label: (
            <ConfirmDialog
              tone="success"
              title="Approve Test Scope?"
              description="Are you sure you want to approve this test scope?"
              confirmText="Approve"
              onConfirm={() => performApprovalAction(r, "Approved")}
            >
              {menuLabel("Approve", "Approve test scope", <CheckCircleOutlined />, "#10b981", "rgba(16,185,129,0.12)")}
            </ConfirmDialog>
          ),
        },
        {
          key: "reject",
          disabled: isProcessed,
          danger: true,
          label: (
            <ConfirmDialog
              tone="danger"
              title="Reject Test Scope?"
              description="Are you sure you want to reject this test scope?"
              confirmText="Reject"
              onConfirm={() => performApprovalAction(r, "Rejected")}
            >
              {menuLabel("Reject", "Reject test scope", <CloseCircleOutlined />, "#ef4444", "rgba(239,68,68,0.12)")}
            </ConfirmDialog>
          ),
        },
      ],
    };
  };

  const renderScopeCard = (r: any) => {
    const s = scopeSettings.find(set => set.category === "status" && set.value === r.status);
    const color = s?.color && s.color !== "default"
      ? s.color
      : r.status === "Approved" ? "#10b981"
      : r.status === "Rejected" ? "#ef4444"
      : r.status === "In Review" ? "#f59e0b"
      : r.status === "Draft" ? "#64748b" : "#3b82f6";

    return (
      <div key={r.id} className="pc-card" onClick={() => router.push(`/qa-workspace/test-scope/${r.id}`)}>
        <div className="pc-top">
          <div className="pc-avatar" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" }}>
            {initialsOf(r.name)}
          </div>
          <div className="pc-identity-body">
            <div className="pc-title">{r.name}</div>
            <div className="pc-client-line">
              <span className="pc-client-key">Type:</span>
              <span className="pc-client-val">{r.type || "N/A"}</span>
            </div>
          </div>
          <Dropdown menu={actionMenu(r)} overlayClassName="pp-action-pop" trigger={["click"]} placement="bottomRight">
            <button type="button" className="pc-actions" onClick={(e) => e.stopPropagation()}>
              <EllipsisOutlined />
            </button>
          </Dropdown>
        </div>

        <div className="pc-foot">
          <div className="pc-foot-row">
            <span className="pc-foot-item">
              <span className="pc-foot-key">QA Owner:</span>
              <span className="pc-foot-val">{r.qa_owner || "—"}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">Reviewer:</span>
              <span className="pc-foot-val">{r.details?.reviewer || "—"}</span>
            </span>
            <span className="pc-foot-div" />
            <span className="pc-foot-item">
              <span className="pc-foot-key">End:</span>
              <span className="pc-foot-val">{r.end_date ? new Date(r.end_date).toLocaleDateString() : "—"}</span>
            </span>
          </div>
          <div className="pc-foot-row">
            <span className="pc-foot-item">
              <span className="pc-foot-key">Status:</span>
              <span className="pc-status-tag" style={{ color, background: `${color}1A` }}>{r.status}</span>
            </span>
          </div>
        </div>
      </div>
    );
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, total);

  if (!canApproveScope) {
    return (
      <>
        <div className="dh-main-topbar sc-topbar">
          <div className="sc-topbar__title" style={{ display: "flex", alignItems: "center" }}>
            <Button className="dh-mobile-menu-btn" type="text" icon={<Menu size={18} />} onClick={onOpenSidebar} />
            <span className="sc-topbar__h1">Test Scopes</span>
          </div>
        </div>
        <div className="dh-main-scroll">
          <div className="sc-empty">
            <SendOutlined className="sc-empty__icon" />
            <p className="sc-empty__title">You don&apos;t have access to scope approvals</p>
            <p className="sc-empty__desc">Ask a workspace admin for the QA scope approval permission.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SCOPE_APPROVAL_STYLES }} />

      <div className="dh-main-topbar sc-topbar">
        <div className="sc-topbar__title" style={{ display: "flex", alignItems: "center" }}>
          <Button className="dh-mobile-menu-btn" type="text" icon={<Menu size={18} />} onClick={onOpenSidebar} />
          <span className="sc-topbar__h1">Test Scopes</span>
          <span className="sc-topbar__div" />
          <span className="sc-topbar__sub">Scopes routed to you for review — approve, or reject them back to QA</span>
        </div>
        <div className="dh-main-controls">
          <Button
            type="default"
            icon={<RotateCw size={14} className={loading ? "animate-spin" : ""} />}
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, padding: 0 }}
          />
          <div className="pp-segmented">
            <button type="button" className={viewMode === "grid" ? "is-active" : ""} onClick={() => setViewMode("grid")} aria-label="Grid view"><AppstoreOutlined /></button>
            <button type="button" className={viewMode === "list" ? "is-active" : ""} onClick={() => setViewMode("list")} aria-label="List view"><UnorderedListOutlined /></button>
          </div>
        </div>
      </div>

      <div className="dh-main-scroll">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <StatTile label="Approved" value={stats.approved ?? 0} icon={CheckCircleOutlined} color="#10b981" bgColor="rgba(16,185,129,0.1)" sub="signed off by you" />
          <StatTile label="Rejected" value={stats.rejected ?? 0} icon={CloseCircleOutlined} color="#ef4444" bgColor="rgba(239,68,68,0.1)" sub="sent back for rework" />
          <StatTile label="Pending" value={stats.pendingApprovals ?? 0} icon={SendOutlined} color="#3B82F6" bgColor="rgba(59,130,246,0.1)" sub="waiting on you" />
        </div>

        <div className="sc-filters">
          <Input
            className="sc-filters__search"
            placeholder="Search scopes…"
            prefix={<SearchOutlined style={{ color: "var(--text-slate-400)" }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            allowClear
          />
          <SearchableDropdown
            options={userProjects}
            value={projectFilter}
            onChange={(v) => setProjectFilter(v)}
            placeholder="Any project"
            hideAvatar
            itemNoun="projects"
            className="sc-filters__field"
          />
          <SearchableDropdown
            options={statusOptions}
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            placeholder="All statuses"
            itemNoun="statuses"
            className="sc-filters__field"
          />
          {activeFilterCount > 0 && (
            <button type="button" className="sc-clear" onClick={clearFilters}>
              Clear ({activeFilterCount})
            </button>
          )}
        </div>

        <ZukvoLoadingOverlay loading={loading} message="Loading approvals…" minHeight={loading ? 320 : undefined}>
          {viewMode === "list" ? (
            <div className="sc-tablewrap">
              <Table
                className="ts-table sc-table"
                dataSource={rows}
                columns={columns}
                rowKey="id"
                pagination={false}
                scroll={{ x: "max-content" }}
                onRow={(record) => ({ onClick: () => router.push(`/qa-workspace/test-scope/${record.id}`) })}
                locale={{
                  emptyText: loading ? (
                    <div style={{ minHeight: 240 }} />
                  ) : (
                    <div className="sc-empty">
                      <SendOutlined className="sc-empty__icon" />
                      <p className="sc-empty__title">
                        {activeFilterCount > 0 ? "No scopes match these filters" : "No pending approvals"}
                      </p>
                      <p className="sc-empty__desc">
                        {activeFilterCount > 0
                          ? "Try widening your search or clearing the filters."
                          : "Scopes appear here once QA routes them to you for review."}
                      </p>
                      {activeFilterCount > 0 && <Button size="small" onClick={clearFilters}>Clear filters</Button>}
                    </div>
                  ),
                }}
              />
            </div>
          ) : (
            <div className="pp-grid">
              {loading ? null : rows.length === 0 ? (
                <div className="sc-empty" style={{ gridColumn: "1 / -1" }}>
                  <SendOutlined className="sc-empty__icon" />
                  <p className="sc-empty__title">
                    {activeFilterCount > 0 ? "No scopes match these filters" : "No pending approvals"}
                  </p>
                  <p className="sc-empty__desc">
                    {activeFilterCount > 0
                      ? "Try widening your search or clearing the filters."
                      : "Scopes appear here once QA routes them to you for review."}
                  </p>
                </div>
              ) : (
                rows.map(renderScopeCard)
              )}
            </div>
          )}
        </ZukvoLoadingOverlay>
      </div>

      {total > 0 && (
        <div className="pp-footer">
          <div className="pp-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="pp-pager">
            <button type="button" className="pp-pager-btn" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>‹</button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .slice(Math.max(0, safePage - 3), Math.max(0, safePage - 3) + 5)
              .map((p) => (
                <button key={p} type="button" className={`pp-pager-num ${p === safePage ? "is-active" : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
            <button type="button" className="pp-pager-btn" disabled={safePage >= pageCount} onClick={() => setPage(p => Math.min(pageCount, p + 1))}>›</button>
            <Select
              className="pp-pagesize"
              value={pageSize}
              onChange={(v) => { setPageSize(v); setPage(1); }}
              options={[10, 20, 25, 50, 100].map((n) => ({ value: n, label: `${n} / page` }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Only the primitives the submission queue doesn't already style — pills, the
 * priority meter, the person chip and the card view.
 */
const SCOPE_APPROVAL_STYLES = `
.sc-muted { color: var(--text-slate-400); }

.sc-pill {
  display: inline-flex; align-items: center; gap: 6px;
  height: 22px; padding: 0 9px; border-radius: 999px;
  font-size: 11.5px; font-weight: 600; white-space: nowrap;
  border: 1px solid transparent;
}
.sc-pill__dot { width: 6px; height: 6px; border-radius: 999px; background: currentColor; }
.sc-pill--blue { color: #2563eb; background: rgba(59,130,246,.1); border-color: rgba(59,130,246,.22); }
.sc-pill--green { color: #047857; background: rgba(16,185,129,.12); border-color: rgba(16,185,129,.24); }
.sc-pill--red { color: #dc2626; background: rgba(239,68,68,.1); border-color: rgba(239,68,68,.22); }
.sc-pill--ash { color: #64748b; background: rgba(100,116,139,.1); border-color: rgba(100,116,139,.2); }

.sc-prio { display: inline-flex; align-items: center; gap: 8px; }
.sc-prio__bars { display: inline-flex; align-items: flex-end; gap: 2px; }
.sc-prio__bar { width: 4px; height: 12px; border-radius: 2px; background: var(--border-slate-200); }
.sc-prio__bar.is-on { background: #60a5fa; }
.sc-prio__bar.is-on.is-max { background: #2563eb; }
.sc-prio__label { font-size: 12px; font-weight: 500; color: var(--text-slate-600); }

.sc-person { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
.sc-person__av {
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  width: 24px; height: 24px; border-radius: 7px;
  font-size: 10.5px; font-weight: 700;
  background: rgba(59,130,246,.1); color: #2563eb;
}
.sc-person__av.is-muted { background: rgba(100,116,139,.12); color: #64748b; }
.sc-person__name {
  font-size: 12.5px; color: var(--text-slate-700);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── Card view ──────────────────────────────────────────────── */
.pc-card {
  border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
  cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
  transition: box-shadow .15s ease, border-color .15s ease;
}
.pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }
.pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 12px; flex: 1; }
.pc-avatar {
  width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 800; font-size: 13px;
}
.pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 4px; flex: 1; }
.pc-title {
  font-size: 14px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
.pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
.pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pc-actions {
  width: 26px; height: 26px; flex-shrink: 0; border: none; background: transparent; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px; color: var(--text-slate-400);
}
.pc-actions:hover { background: var(--bg-slate-50); color: var(--text-slate-700); }
.pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
.pc-foot-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 12px; }
.pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
.pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
.pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
.pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }
.pc-status-tag { display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px; border-radius: 5px; font-size: 10.5px; font-weight: 700; }

.pp-action-pop .ant-dropdown-menu {
  padding: 6px; border-radius: 0 !important; min-width: 236px; overflow: hidden !important;
  background: var(--bg-pure-white); border: 1px solid var(--border-slate-100);
  box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
}
.pp-action-pop .ant-dropdown-menu-item { padding: 7px 9px !important; border-radius: 0 !important; margin: 1px 0; transition: background .12s ease; }
.pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
.pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
.pp-menu-item { display: flex; align-items: center; gap: 11px; }
.pp-menu-ic { width: 30px; height: 30px; border-radius: 0; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; }
.pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
.pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; }
.pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }
.pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
.pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
.pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
.pp-action-pop .ant-dropdown-menu-item-disabled:hover { background: transparent !important; }
`;
