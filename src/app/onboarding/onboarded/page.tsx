"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Tag,
  Input,
  Button,
  message,
  Switch,
  Popover,
  Tooltip,
  Select,
  Pagination,
  Typography,
} from "antd";
const { Text } = Typography;
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
  Menu,
} from "lucide-react";
import { useRouter } from "next/navigation";
import OnboardingGuard from "@/components/onboarding/OnboardingGuard";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

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

/* ---------------- ISOLATED ACTION CELL ---------------- */
const ActionCell = ({ record, canUpdate, canDelete, onDelete, router, menuLabelHelper }: any) => {
  const [open, setOpen] = useState(false);

  const actionContent = (
    <div className="ant-dropdown-menu">
      <button
        className="ant-dropdown-menu-item"
        style={{ width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
        onClick={() => {
          setOpen(false);
          router.push(`/onboarding/onboarded/${record.id}`);
        }}
      >
        {menuLabelHelper("View Details", "Open full employee profile", <Eye size={14} />, "#64748b", "rgba(100,116,139,0.10)")}
      </button>
      {canUpdate && (
        <button
          className="ant-dropdown-menu-item"
          style={{ width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
          onClick={() => {
            setOpen(false);
            router.push(`/onboarding/create?id=${record.id}`);
          }}
        >
          {menuLabelHelper("Edit Info", "Modify employee information", <Edit2 size={14} />, "#3b82f6", "rgba(59,130,246,0.10)")}
        </button>
      )}
      {canDelete && (
        <>
          <div className="ant-dropdown-menu-item-divider" />
          <ConfirmDialog
            tone="danger"
            icon={<Trash2 size={14} />}
            title="Delete this record?"
            description="This action cannot be undone."
            confirmText="Delete"
            placement="bottomRight"
            onConfirm={() => {
              setOpen(false);
              onDelete(record.id);
            }}
          >
            <button
              className="ant-dropdown-menu-item ant-dropdown-menu-item-danger"
              style={{ width: "100%", textAlign: "left", border: "none", background: "none", cursor: "pointer" }}
            >
              {menuLabelHelper("Delete Record", "Permanently remove this record", <Trash2 size={14} />, "#ef4444", "rgba(239,68,68,0.10)")}
            </button>
          </ConfirmDialog>
        </>
      )}
    </div>
  );

  return (
    <Popover
      content={actionContent}
      trigger="click"
      placement="bottomRight"
      overlayClassName="pp-action-pop"
      open={open}
      onOpenChange={setOpen}
    >
      <Button type="text" size="small" icon={<MoreVertical size={16} style={{ color: PALETTE.grey }} />} />
    </Popover>
  );
};

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
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  useEffect(() => {
    if (!authLoading && !canReadOnboarding) {
      router.push("/dashboard");
    }
  }, [authLoading, canReadOnboarding, router]);

  // ✅ Fetch All Employees
  const fetchEmployees = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await EmployeeOnboardingService.getAllEmployees({
        search,
        limit: tablePageSize,
        offset: (tablePage - 1) * tablePageSize,
      });

      let employees = [];

      if (res?.data?.success) {
        employees = res.data.data || [];
        setTotal(res.data.total || 0);
        if (res.data.stats) setStats(res.data.stats);
      } else if (res?.success) {
        employees = res.data || [];
        setTotal(res.total || 0);
        if (res.stats) setStats(res.stats);
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
  }, [canReadOnboarding, search, tablePage, tablePageSize]);

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

  const activeCount = stats.active;
  const totalCount = stats.total;
  const inactiveCount = stats.inactive;

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
  const pageCount = Math.max(1, Math.ceil(total / tablePageSize));
  const pageStart = total === 0 ? 0 : (tablePage - 1) * tablePageSize + 1;
  const pageEnd = Math.min(total, tablePage * tablePageSize);
  const pagedRows = data;

  useEffect(() => {
    setTablePage(1);
  }, [search, tablePageSize]);

  useEffect(() => {
    if (tablePage > pageCount && pageCount > 0) setTablePage(pageCount);
  }, [pageCount, tablePage]);

  // ✅ Premium Menu Label Helper
  const onbMenuLabel = (title: string, desc: string, icon: React.ReactNode, color: string, bg: string) => (
    <div className="pp-menu-item">
      <div className="pp-menu-ic" style={{ color, background: bg }}>
        {icon}
      </div>
      <div className="pp-menu-text">
        <span className="pp-menu-title">{title}</span>
        <span className="pp-menu-desc">{desc}</span>
      </div>
    </div>
  );

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
          return (
            <ActionCell
              record={record}
              canUpdate={canUpdateOnboarding}
              canDelete={canDeleteOnboarding}
              onDelete={handleDelete}
              router={router}
              menuLabelHelper={onbMenuLabel}
            />
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
          <button
            className="ob-mobile-menu-btn"
            onClick={() => window.dispatchEvent(new Event('open-ob-sidebar'))}
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
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
        <ZukvoLoadingOverlay loading={loading} message="">
          <Table
            rowKey="id"
            size="small"
            className="onb-table"
            columns={columns}
            dataSource={pagedRows}
            pagination={false}
            onRow={() => ({ className: "onb-row" })}
            scroll={{ x: 'max-content' }}
          />
        </ZukvoLoadingOverlay>
      </div>

      {/* Sticky footer pager */}
      {total > 0 && (
        <div className="bd2-pagination">
          <Text className="bd2-pagination-meta">
            <b>{pageStart}</b>–
            <b>{pageEnd}</b> of{' '}
            <b>{total}</b>{' '}
            {total === 1 ? 'employee' : 'employees'}
          </Text>
          <Pagination
            current={tablePage}
            pageSize={tablePageSize}
            total={total}
            onChange={(p, s) => {
              setTablePage(p);
              if (s) setTablePageSize(s);
            }}
            showSizeChanger
            pageSizeOptions={[10, 20, 25, 50, 100]}
            size="small"
          />
        </div>
      )}

      <style jsx global>{`
        .onb { display: flex; flex-direction: column; flex: 1; min-height: 0; }

        /* 1) Header */
        .onb-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          margin: -12px -22px 14px; padding: 12px 24px 14px 28px; border-bottom: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          position: sticky; top: 0; z-index: 30;
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
        .onb-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0px; overflow: hidden; }
        .onb-table .ant-table,
        .onb-table .ant-table-container { background: transparent; font-size: 12px; border-radius: 0 !important; }
        .onb-table .ant-pagination { margin: 12px 12px 8px !important; }

        @media (max-width: 900px) {
          .onb-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 14px 16px;
            gap: 12px;
          }
          .onb-header-actions {
            width: 100%;
            justify-content: space-between;
          }
          .onb-search-wrap {
            width: 100%;
          }
          .onb-stats {
            grid-template-columns: 1fr;
          }
        }
        .onb-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 8px 12px !important;
          white-space: nowrap !important; border-radius: 0 !important;
        }
        [data-theme='dark'] .onb-table .ant-table-thead > tr > th {
          background: #161b22 !important;
          border-bottom-color: #1f2937 !important;
          color: #94A3B8 !important;
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

        /* Sticky pagination */
        .bd2-pagination {
          position: sticky;
          bottom: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: auto -22px 0;
          padding: 6px 28px;
          background: var(--bg-pure-white);
          border-top: 1px solid var(--border-slate-100);
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.02);
        }
        [data-theme='dark'] .bd2-pagination {
          background: #0d1117 !important;
          border-top-color: #1f2937 !important;
        }
        .bd2-pagination-meta {
          font-size: 11.5px !important;
          font-weight: 500 !important;
          color: var(--text-slate-500) !important;
          letter-spacing: -0.005em;
        }
        .bd2-pagination-meta b {
          color: var(--text-slate-900);
          font-weight: 800;
        }
        [data-theme='dark'] .bd2-pagination-meta b {
          color: #f1f5f9 !important;
        }

        /* Premium action dropdown — matches Proposal page */
        .pp-action-pop .ant-popover-inner {
          padding: 0 !important;
          border-radius: 0px !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0px !important; width: 220px;
          overflow: hidden !important;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06), 0 0 0 1px rgba(15,23,42,0.03);
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0px !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-action-pop .ant-dropdown-menu-item-divider { margin: 5px 8px !important; background: var(--border-slate-100); }
        .pp-action-pop .ant-dropdown-menu-title-content { line-height: 1.2; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; flex: 1; overflow: hidden; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pp-action-pop .ant-dropdown-menu-item-danger:hover { background: rgba(239,68,68,0.08) !important; }
        .pp-action-pop .ant-dropdown-menu-item-danger .pp-menu-title { color: #ef4444; }
        .pp-action-pop .ant-dropdown-menu-item-disabled { opacity: 0.45; }
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu {
          background: #0B0F1A !important; border-color: #1E293B !important;
        }
        [data-theme='dark'] .pp-action-pop .ant-dropdown-menu-item:hover { background: #161B22 !important; }
        [data-theme='dark'] .pp-menu-title { color: #cbd5e1 !important; }
        [data-theme='dark'] .pp-menu-desc { color: #64748b !important; }
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
