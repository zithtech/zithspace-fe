"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Tag,
  Input,
  Button,
  message,
  Switch,
  Dropdown,
  Tooltip,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  MoreVertical,
  RotateCw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/OnboardingGuard";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";

// ── Module palette: blue / green / red / grey only ──────────────────────────
const PALETTE = {
  blue: "#3B82F6",
  green: "#10B981",
  red: "#EF4444",
  grey: "#94A3B8",
} as const;
const TINT = {
  blue: "rgba(59,130,246,0.10)",
  green: "rgba(16,185,129,0.10)",
  red: "rgba(239,68,68,0.10)",
  grey: "rgba(148,163,184,0.12)",
} as const;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/* ---------------- MAIN COMPONENT ---------------- */

const Onboarded = () => {
  const { isLoading: authLoading } = useAuth();
  const {
    canReadOnboarding,
    canCreateOnboarding,
    canUpdateOnboarding,
    canDeleteOnboarding,
  } = usePermission();
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !canReadOnboarding) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOnboarding, router]);

  // ✅ Fetch All Employees
  const fetchEmployees = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await EmployeeOnboardingService.getAllEmployees();
      let employees = [];

      if (res?.data?.success) {
        employees = res.data.data || [];
      } else if (res?.success) {
        employees = res.data || [];
      } else if (Array.isArray(res?.data)) {
        employees = res.data;
      } else if (Array.isArray(res)) {
        employees = res;
      }

      setData(employees);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      message.error("Failed to fetch employees");
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    if (canReadOnboarding) {
      fetchEmployees();
    }
  }, [canReadOnboarding]);

  // ✅ Status Toggle
  const handleStatusChange = async (id: string, checked: boolean) => {
    try {
      await EmployeeOnboardingService.updateEmployee(id, { status: checked });
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: checked } : item))
      );
      message.success(
        `Employee ${checked ? "activated" : "deactivated"} successfully`
      );
    } catch (error) {
      message.error("Failed to update status");
    }
  };

  // ✅ Delete Employee
  const handleDelete = async (id: string) => {
    try {
      const res = await EmployeeOnboardingService.deleteEmployee(id);
      const success = res?.data?.success || res?.success || res?.status === 200;

      if (success) {
        message.success("Employee removed successfully");
        setData((prev) => prev.filter((e) => e.id !== id));
      } else {
        message.error("Failed to delete employee");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      message.error("Failed to remove employee");
    }
  };

  // ✅ Filter Employees
  const filteredData = data.filter((e: any) => {
    const personal = e.personal || e;
    const fullName = `${personal.firstName || ""} ${personal.lastName || ""}`.toLowerCase();
    const code = (e.employee_code || e.employeeCode || "").toLowerCase();
    return (
      fullName.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase())
    );
  });

  const activeCount = data.filter((item: any) => item.status).length;
  const totalCount = data.length;
  const inactiveCount = totalCount - activeCount;

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const statCells = [
    {
      key: "total",
      title: "Total Employees",
      value: totalCount,
      caption: "onboarded",
      icon: <Users size={14} />,
      color: PALETTE.blue,
      tint: TINT.blue,
    },
    {
      key: "active",
      title: "Active",
      value: activeCount,
      caption: `of ${totalCount}`,
      icon: <CheckCircle2 size={14} />,
      color: PALETTE.green,
      tint: TINT.green,
    },
    {
      key: "inactive",
      title: "Inactive",
      value: inactiveCount,
      caption: `of ${totalCount}`,
      icon: <XCircle size={14} />,
      color: PALETTE.grey,
      tint: TINT.grey,
    },
    {
      key: "verified",
      title: "Verified",
      value: "100%",
      caption: "identity",
      icon: <ShieldCheck size={14} />,
      color: PALETTE.blue,
      tint: TINT.blue,
    },
  ];

  // ── Pagination (sticky footer) ────────────────────────────────────────────
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  const total = filteredData.length;
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const pagedRows = filteredData.slice(
    (tablePage - 1) * tablePageSize,
    tablePage * tablePageSize
  );

  useEffect(() => {
    setTablePage(1);
  }, [search, tablePageSize]);

  useEffect(() => {
    if (tablePage > pageCount) setTablePage(pageCount);
  }, [pageCount, tablePage]);

  // ✅ Table Columns
  const columns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "Employee",
        key: "employee",
        render: (_: any, record: any) => {
          const personal = record.personal || record;
          const firstName = personal.firstName || "";
          const lastName = personal.lastName || "";
          const fallbackName = record.name || "";
          const initials =
            `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() ||
            fallbackName?.[0]?.toUpperCase() ||
            "?";
          const code = record.employee_code || record.employeeCode || "No Code";
          return (
            <div
              className="onb-emp-cell"
              onClick={() => router.push(`/onboarding/onboarded/${record.id}`)}
              title="View details"
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            >
              <span className="onb-avatar">{initials}</span>
              <div style={{ minWidth: 0 }}>
                <div className="onb-emp-name">
                  {firstName || lastName
                    ? `${firstName} ${lastName}`.trim()
                    : fallbackName || "—"}
                </div>
                <div className="onb-emp-code">{code}</div>
              </div>
            </div>
          );
        },
      },
      {
        title: "Contact Details",
        key: "contact",
        render: (_: any, record: any) => {
          const personal = record.personal || record;
          return (
            <div>
              <div className="onb-contact-primary">
                {personal.workEmail || personal.personalEmail || "N/A"}
              </div>
              <div className="onb-contact-secondary">
                {personal.mobile || personal.phone || "N/A"}
              </div>
            </div>
          );
        },
      },
      {
        title: "Designation",
        key: "designation",
        render: (_: any, record: any) => {
          const employment = record.employment || record;
          const label =
            record.positionTitle ||
            employment.designation ||
            employment.position?.title ||
            "Staff";
          return (
            <span className="onb-desig-tag">{label}</span>
          );
        },
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (status: boolean, record: any) => (
          <Switch
            size="small"
            checked={status}
            onChange={(checked) => handleStatusChange(record.id, checked)}
            disabled={!canUpdateOnboarding}
          />
        ),
      },
      {
        title: "",
        key: "action",
        width: 60,
        align: "right" as const,
        render: (_: any, record: any) => {
          const items: any[] = [
            {
              key: "view",
              label: "View Details",
              icon: <Eye size={14} />,
              onClick: () =>
                router.push(`/onboarding/onboarded/${record.id}`),
            },
          ];
          if (canUpdateOnboarding) {
            items.push({
              key: "edit",
              label: "Edit Info",
              icon: <Edit2 size={14} />,
              onClick: () =>
                router.push(`/onboarding/create?id=${record.id}`),
            });
          }
          if (canDeleteOnboarding) {
            items.push({ type: "divider" as const });
            items.push({
              key: "delete",
              danger: true,
              icon: <Trash2 size={14} />,
              label: (
                <ConfirmDialog
                  tone="danger"
                  icon={<Trash2 size={14} />}
                  title="Delete this record?"
                  description="This action cannot be undone."
                  confirmText="Delete"
                  placement="bottomRight"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <span style={{ display: "block", width: "100%" }}>
                    Delete Record
                  </span>
                </ConfirmDialog>
              ),
            });
          }
          return (
            <Dropdown menu={{ items }} trigger={["click"]}>
              <Button
                type="text"
                size="small"
                icon={
                  <MoreVertical size={16} style={{ color: PALETTE.grey }} />
                }
              />
            </Dropdown>
          );
        },
      },
    ],
    [canUpdateOnboarding, canDeleteOnboarding, router]
  );

  if (authLoading || !canReadOnboarding) return null;

  return (
    <div className="onb">
      {/* ── 1) HEADER: about + search + add ─────────────────────────────────── */}
      <div className="onb-header">
        <div className="onb-header-about">
          <div className="onb-header-icon">
            <Users size={18} />
          </div>
          <div>
            <div className="onb-header-title">Onboarded Members</div>
            <div className="onb-header-sub">
              Manage and review employees who have successfully onboarded.
            </div>
          </div>
        </div>
        <div className="onb-header-actions">
          <div className="onb-search-wrap">
            <Search className="onb-search-icon" size={14} />
            <input
              className="onb-search"
              placeholder="Search employees…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tooltip title="Refresh">
            <button
              type="button"
              className="onb-ghost-btn"
              onClick={() => fetchEmployees()}
            >
              <RotateCw size={14} className={loading ? "onb-spin" : ""} />
            </button>
          </Tooltip>
          {canCreateOnboarding && (
            <Button
              type="primary"
              icon={<Plus size={16} />}
              onClick={() => router.push("/onboarding/create")}
              className="onb-add-btn"
            >
              Hire Employee
            </Button>
          )}
        </div>
      </div>

      {/* ── 2) STAT CARDS (square) ───────────────────────────────────────────── */}
      <div className="onb-stats">
        {statCells.map((s) => (
          <div key={s.key} className="onb-stat-card">
            <div className="onb-stat-top">
              <div className="onb-stat-left">
                <span
                  className="onb-stat-icon"
                  style={{ background: s.tint, color: s.color }}
                >
                  {s.icon}
                </span>
                <span className="onb-stat-label">{s.title}</span>
              </div>
            </div>
            <div className="onb-stat-bottom">
              <span className="onb-stat-value">{s.value}</span>
              <span className="onb-stat-period">{s.caption}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3) TABLE ─────────────────────────────────────────────────────────── */}
      <div className="onb-table-wrap">
        <Table
          rowKey="id"
          size="small"
          className="onb-table"
          loading={loading}
          columns={columns}
          dataSource={pagedRows}
          pagination={false}
          onRow={() => ({ className: "onb-row" })}
        />
      </div>

      {/* Sticky footer pager */}
      {total > 0 && (
        <div className="onb-footer onb-footer--sticky">
          <div className="onb-footer-info">
            Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong>
          </div>
          <div className="onb-pager">
            <button
              type="button"
              className="onb-pager-btn"
              disabled={tablePage <= 1}
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .slice(Math.max(0, tablePage - 3), Math.max(0, tablePage - 3) + 5)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`onb-pager-num ${p === tablePage ? "is-active" : ""}`}
                  onClick={() => setTablePage(p)}
                >
                  {p}
                </button>
              ))}
            <button
              type="button"
              className="onb-pager-btn"
              disabled={tablePage >= pageCount}
              onClick={() => setTablePage((p) => Math.min(pageCount, p + 1))}
            >
              ›
            </button>
            <Select
              className="onb-pagesize"
              size="small"
              value={tablePageSize}
              onChange={(v) => {
                setTablePageSize(v);
                setTablePage(1);
              }}
              options={PAGE_SIZE_OPTIONS.map((n) => ({
                value: n,
                label: `${n} / page`,
              }))}
              popupMatchSelectWidth={120}
            />
          </div>
        </div>
      )}

      <style jsx global>{`
        .onb { display: flex; flex-direction: column; flex: 1; min-height: 0; }

        /* 1) Header */
        .onb-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--border-slate-200);
        }
        .onb-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .onb-header-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: ${TINT.blue}; color: ${PALETTE.blue};
          display: inline-flex; align-items: center; justify-content: center;
        }
        .onb-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
        .onb-header-sub { font-size: 12.5px; color: var(--text-slate-500); margin-top: 2px; }
        .onb-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .onb-search-wrap {
          position: relative; display: flex; align-items: center; height: 34px; width: 240px;
          border-radius: 8px; background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .onb-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .onb-search-icon { color: var(--text-slate-400); }
        .onb-search { flex: 1; border: none; outline: none; background: transparent; margin-left: 9px; font-size: 13px; color: var(--text-slate-900); }
        .onb-search::placeholder { color: var(--text-slate-400); }
        .onb-ghost-btn {
          width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .onb-ghost-btn:hover { color: ${PALETTE.blue}; border-color: #bfdbfe; }
        .onb-spin { animation: onb-spin 0.8s linear infinite; }
        @keyframes onb-spin { to { transform: rotate(360deg); } }
        .onb-add-btn { height: 34px !important; border-radius: 8px !important; font-weight: 600 !important; display: inline-flex !important; align-items: center !important; }

        /* 2) Stat cards — square */
        .onb-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 14px; }
        .onb-stat-card {
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200);
          border-radius: 0; padding: 12px 14px; min-height: 92px;
          display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
          box-shadow: 0 1px 2px rgba(15,23,42,0.04);
        }
        .onb-stat-top { display: flex; align-items: center; justify-content: space-between; }
        .onb-stat-left { display: flex; align-items: center; gap: 8px; }
        .onb-stat-icon { width: 26px; height: 26px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; }
        .onb-stat-label { font-size: 12px; font-weight: 600; color: var(--text-slate-600); }
        .onb-stat-bottom { display: flex; align-items: baseline; gap: 6px; }
        .onb-stat-value { font-size: 23px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1; }
        .onb-stat-period { font-size: 11px; color: var(--text-slate-400); font-weight: 500; }

        /* 3) Table */
        .onb-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .onb-table .ant-table { background: transparent; font-size: 12px; }
        .onb-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important;
        }
        .onb-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 9px 12px !important; }
        .onb-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .onb-table .ant-table-tbody > tr.onb-row:hover > td { background: var(--bg-slate-50) !important; }

        /* Employee cell */
        .onb-avatar {
          width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
          background: ${TINT.blue}; color: ${PALETTE.blue};
          display: inline-flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 12px;
        }
        .onb-emp-name { font-size: 13px; font-weight: 600; color: var(--text-slate-900); line-height: 1.2; transition: color .12s ease; }
        .onb-emp-code { font-size: 11px; color: var(--text-slate-400); font-family: monospace; margin-top: 1px; }
        .onb-emp-cell:hover .onb-emp-name { color: #3B82F6; }
        .onb-emp-cell:hover .onb-avatar { background: rgba(59,130,246,0.18); }

        /* Contact cell */
        .onb-contact-primary { font-size: 12.5px; color: var(--text-slate-700); }
        .onb-contact-secondary { font-size: 11.5px; color: var(--text-slate-400); margin-top: 1px; }

        /* Designation tag */
        .onb-desig-tag {
          display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px;
          background: ${TINT.blue}; color: ${PALETTE.blue}; font-size: 11.5px; font-weight: 600;
        }

        /* Sticky footer pager */
        .onb-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          height: 52px; box-sizing: border-box;
        }
        .onb-footer--sticky {
          position: sticky; bottom: 0; z-index: 20; margin-top: auto; padding: 0 14px;
          background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-top: none;
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
        }
        .onb-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .onb-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .onb-pager { display: flex; align-items: center; gap: 3px; }
        .onb-pager-btn, .onb-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .onb-pager-btn:hover:not(:disabled), .onb-pager-num:hover { border-color: #93c5fd; color: ${PALETTE.blue}; }
        .onb-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .onb-pager-num.is-active { background: ${PALETTE.blue}; border-color: ${PALETTE.blue}; color: #fff; }
        .onb-pagesize { margin-left: 5px; }
        .onb-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
      `}</style>
    </div>
  );
};

export default function OnboardedPage() {
  // Shell (ProtectedRoute + MainLayout + sidebar) is provided by
  // src/app/onboarding/layout.tsx. This page renders only its content.
  return (
    <OnboardingGuard itemKey="employees">
      <Onboarded />
    </OnboardingGuard>
  );
}
