"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Empty, Spin, Pagination, Select, DatePicker, Typography, Row, Col, Divider, Button } from "antd";
import { CalendarOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  Search,
  Calendar,
  ChevronRight,
  Users,
  CheckSquare,
  Video,
  Clock,
  Lightbulb,
  Paperclip,
  FileText,
  Link2,
  ExternalLink,
  LayoutGrid,
  List,
} from "lucide-react";
import {
  portalMomService,
  PortalMomListItem,
  PortalMomListAttachment,
  PortalMomMeta,
} from "@/services/portalMomService";

const p = {
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

/* --------------------------------------------------------------- */

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/* --------------------------------------------------------------- */

export default function PortalMomPage() {
  const router = useRouter();
  const [items, setItems] = useState<PortalMomListItem[]>([]);
  const [meta, setMeta] = useState<PortalMomMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [limit, setLimit] = useState(20);

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalMomService.list({
        page,
        limit,
        projectId,
        search: search || undefined,
      });
      setItems(res.data);
      setMeta(res.meta);
    } catch {
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, projectId, limit]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filteredItems = useMemo(() => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return items;
    }
    const [start, end] = dateRange;
    return items.filter((m) => {
      if (!m.meetingDate) return false;
      const d = dayjs(m.meetingDate);
      return (
        (d.isAfter(start, "day") || d.isSame(start, "day")) &&
        (d.isBefore(end, "day") || d.isSame(end, "day"))
      );
    });
  }, [items, dateRange]);

  const totals = useMemo(() => {
    const totalOpen = filteredItems.reduce((s, m) => s + m.openActionCount, 0);
    return { totalOpen };
  }, [filteredItems]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      {/* Workstation Header */}
      <div
        className="saas-header-container portal-mom-header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          padding: "20px 40px 20px 40px",
          marginBottom: 24,
        }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col flex="1 1 auto" style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(37, 99, 235, 0.08))",
                    color: "#3b82f6",
                  }}
                >
                  <CalendarOutlined style={{ fontSize: 18, color: "#3b82f6" }} />
                </div>
                <Title
                  level={4}
                  className="portal-mom-header-title"
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    color: "var(--text-slate-900)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Minutes of meeting
                </Title>
              </div>

              <Divider
                type="vertical"
                style={{
                  height: 20,
                  borderColor: "rgba(0, 0, 0, 0.08)",
                  margin: "0 12px",
                }}
              />

              <div>
                <Text
                  className="portal-mom-header-desc"
                  style={{
                    fontSize: 12,
                    color: "var(--text-slate-600)",
                    fontWeight: 600,
                  }}
                >
                  Every meeting summary, decision logged, and action item — shared back from your account team.
                </Text>
              </div>
            </div>
          </Col>
          <Col flex="0 0 auto">
            <Button
              className="portal-mom-reload-btn"
              icon={<ReloadOutlined spin={loading} />}
              onClick={load}
              style={{ height: 36, fontWeight: 600, borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            />
          </Col>
        </Row>
      </div>

      {/* Content Container */}
      <div style={{ padding: "24px 40px 56px", width: "100%", boxSizing: "border-box" }}>

        {/* Filters & Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          {/* Left side: Filters */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {/* Date range picker */}
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              popupClassName="portal-mom-datepicker-dropdown"
              dropdownClassName="portal-mom-datepicker-dropdown"
              style={{
                height: 38,
                borderRadius: 8,
                borderColor: "#e2e8f0",
              }}
              placeholder={["Start Date", "End Date"]}
            />

            {/* Project dropdown */}
            {meta && meta.projects && meta.projects.length > 0 && (
              <Select
                allowClear
                placeholder="Filter by Project"
                style={{ width: 220, height: 38 }}
                value={projectId}
                popupClassName="portal-mom-select-dropdown"
                dropdownClassName="portal-mom-select-dropdown"
                onChange={(v) => {
                  setProjectId(v);
                  setPage(1);
                }}
                dropdownStyle={{ borderRadius: 8 }}
                options={meta.projects.map((proj) => ({
                  value: proj.id,
                  label: proj.name,
                }))}
              />
            )}

            {/* Search input */}
            <Input
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<Search size={14} color="#64748b" />}
              placeholder="Search meetings..."
              className="portal-mom-search-input"
              style={{
                width: 260,
                height: 38,
                borderRadius: 8,
              }}
            />

            {/* View Toggle beside Search */}
            <div
              style={{
                display: "inline-flex",
                background: "#f1f5f9",
                padding: 3,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                height: 38,
                boxSizing: "border-box",
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setViewMode("list")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "0 12px",
                  height: 30,
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: viewMode === "list" ? "#ffffff" : "transparent",
                  color: viewMode === "list" ? p.text : p.textSubtle,
                  boxShadow: viewMode === "list" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <List size={14} />
                List
              </button>
              <button
                onClick={() => setViewMode("card")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "0 12px",
                  height: 30,
                  fontSize: 12.5,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: viewMode === "card" ? "#ffffff" : "transparent",
                  color: viewMode === "card" ? p.text : p.textSubtle,
                  boxShadow: viewMode === "card" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <LayoutGrid size={14} />
                Cards
              </button>
            </div>
          </div>
        </div>

        <style>{`
            .portal-mom-header-container,
            [data-theme='dark'] .portal-mom-header-container,
            [data-theme='dark'] .saas-header-container.portal-mom-header-container,
            .saas-header-container.portal-mom-header-container {
              background: #ffffff !important;
              border-bottom: 1px solid #e2e8f0 !important;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
            }
            .portal-mom-header-title {
              color: #0f172a !important;
            }
            .portal-mom-header-desc {
              color: #475569 !important;
            }
            .portal-mom-reload-btn {
              background-color: #ffffff !important;
              border-color: #e2e8f0 !important;
              color: #475569 !important;
            }
            .portal-mom-reload-btn:hover {
              color: #3b82f6 !important;
              border-color: #3b82f6 !important;
              background-color: #eff6ff !important;
            }
            .ant-picker {
              background-color: #ffffff !important;
              border-color: #e2e8f0 !important;
            }
            .ant-picker .ant-picker-input > input {
              color: #0f172a !important;
            }
            .ant-picker .ant-picker-input > input::placeholder {
              color: #94a3b8 !important;
            }
            .ant-picker .ant-picker-suffix,
            .ant-picker .ant-picker-separator {
              color: #64748b !important;
            }
            
            /* Force MOM Date Picker Dropdown to adapt to white theme (even when global data-theme is dark) */
            html body .portal-mom-datepicker-dropdown .ant-picker-panel-container,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-panel-container,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-panel-container {
              background: #ffffff !important;
              border: 1px solid #e2e8f0 !important;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-header,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-header,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-header {
              color: #0f172a !important;
              border-bottom: 1px solid #f1f5f9 !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-header-view,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-header-view,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-header-view {
              color: #0f172a !important;
              font-weight: 700 !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-header button,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-header button,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-header button {
              color: #64748b !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-header button:hover,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-header button:hover,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-header button:hover {
              color: #3b82f6 !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-content th,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-content th,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-content th {
              color: #475569 !important;
              font-weight: 600 !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-cell .ant-picker-cell-inner,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell .ant-picker-cell-inner,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell .ant-picker-cell-inner {
              color: #94a3b8 !important; /* disabled/muted dates */
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view .ant-picker-cell-inner,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view .ant-picker-cell-inner,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view .ant-picker-cell-inner {
              color: #334155 !important; /* active dates */
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-today .ant-picker-cell-inner::before {
              border-color: #3b82f6 !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner,
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-start .ant-picker-cell-inner,
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-end .ant-picker-cell-inner,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-start .ant-picker-cell-inner,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-end .ant-picker-cell-inner,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-start .ant-picker-cell-inner,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-end .ant-picker-cell-inner {
              background: #3b82f6 !important;
              color: #ffffff !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-in-range::before,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-in-range::before,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-in-range::before {
              background: #eff6ff !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover-start::before,
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover-end::before,
            html body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover::before,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover-start::before,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover-end::before,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover::before,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover-start::before,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover-end::before,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-cell-in-view.ant-picker-cell-range-hover::before {
              background: rgba(59, 130, 246, 0.08) !important;
            }
            html body .portal-mom-datepicker-dropdown .ant-picker-footer,
            html[data-theme='dark'] body .portal-mom-datepicker-dropdown .ant-picker-footer,
            [data-theme='dark'] .portal-mom-datepicker-dropdown .ant-picker-footer {
              background: #ffffff !important;
              border-top: 1px solid #f1f5f9 !important;
            }
            .ant-picker .ant-picker-active-bar {
              background: #3b82f6 !important;
            }
            .ant-picker:hover,
            .ant-picker-focused {
              border-color: #3b82f6 !important;
            }
            .ant-select:not(.ant-select-customize-input) .ant-select-selector {
              background-color: #ffffff !important;
              border: 1px solid #e2e8f0 !important;
              color: #0f172a !important;
            }
            .ant-select .ant-select-selection-placeholder {
              color: #94a3b8 !important;
            }
            .ant-select-arrow {
              color: #64748b !important;
            }
            
            /* Force MOM Select dropdown list to adapt to white theme */
            html body .portal-mom-select-dropdown,
            html[data-theme='dark'] body .portal-mom-select-dropdown,
            [data-theme='dark'] .portal-mom-select-dropdown {
              background-color: #ffffff !important;
              border: 1px solid #e2e8f0 !important;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08) !important;
              padding: 4px !important;
            }
            html body .portal-mom-select-dropdown .ant-select-item,
            html[data-theme='dark'] body .portal-mom-select-dropdown .ant-select-item,
            [data-theme='dark'] .portal-mom-select-dropdown .ant-select-item {
              color: #0f172a !important;
              background-color: transparent !important;
              border-radius: 6px !important;
              margin: 2px 0 !important;
              font-size: 13.5px !important;
              font-weight: 500 !important;
            }
            html body .portal-mom-select-dropdown .ant-select-item-option-active,
            html[data-theme='dark'] body .portal-mom-select-dropdown .ant-select-item-option-active,
            [data-theme='dark'] .portal-mom-select-dropdown .ant-select-item-option-active {
              background-color: #f1f5f9 !important;
              color: #0f172a !important;
            }
            html body .portal-mom-select-dropdown .ant-select-item-option-selected,
            html[data-theme='dark'] body .portal-mom-select-dropdown .ant-select-item-option-selected,
            [data-theme='dark'] .portal-mom-select-dropdown .ant-select-item-option-selected {
              background-color: #eff6ff !important;
              color: #3b82f6 !important;
              font-weight: 600 !important;
            }
            .portal-mom-search-input.ant-input-affix-wrapper {
              background-color: #ffffff !important;
              border-color: #e2e8f0 !important;
              color: #0f172a !important;
            }
            .portal-mom-search-input .ant-input {
              background-color: #ffffff !important;
              color: #0f172a !important;
            }
            .portal-mom-search-input .ant-input::placeholder {
              color: #94a3b8 !important;
            }
            .mom-table {
              width: 100%;
              border-collapse: collapse;
              text-align: left;
            }
            .mom-table th {
              padding: 14px 18px;
              font-size: 12px;
              font-weight: 600;
              color: #475569;
              background-color: #f8fafc;
              border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            }
            .mom-table td {
              padding: 16px 18px;
              font-size: 13.5px;
              color: #0f172a;
              border-bottom: 1px solid rgba(0, 0, 0, 0.05);
              vertical-align: middle;
            }
            .mom-table-row {
              transition: all 0.2s ease;
              cursor: pointer;
            }
            .mom-table-row:hover {
              background-color: rgba(99, 102, 241, 0.02);
            }
            .mom-table-row:hover .mom-table-title {
              color: #4f46e5 !important;
            }
            .mom-table-row:hover .mom-table-action-btn {
              color: #4f46e5 !important;
              transform: translateX(2px);
            }

            /* Pagination overrides to ensure light-theme background and blue border */
            .ant-pagination-item {
              background-color: #ffffff !important;
              border-color: #e2e8f0 !important;
            }
            .ant-pagination-item a {
              color: #475569 !important;
            }
            .ant-pagination-item-active {
              background-color: #ffffff !important;
              border-color: #3b82f6 !important;
            }
            .ant-pagination-item-active a {
              color: #3b82f6 !important;
            }
            .ant-pagination-prev .ant-pagination-item-link,
            .ant-pagination-next .ant-pagination-item-link {
              background-color: #ffffff !important;
              border-color: #e2e8f0 !important;
              color: #475569 !important;
            }
            .ant-select-dropdown {
              background-color: #ffffff !important;
            }
            .ant-select-item-option-selected {
              background-color: #f1f5f9 !important;
            }
            .ant-select-item-option-active {
              background-color: #f8fafc !important;
            }
            .ant-select-item {
              color: #0f172a !important;
            }
          `}</style>

        {/* Body */}
        {loading ? (
          <div
            style={{
              padding: 80,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px solid ${p.border}`,
              borderRadius: 12,
            }}
          >
            <Spin />
          </div>
        ) : filteredItems.length === 0 ? (
          <div
            style={{
              padding: 64,
              textAlign: "center",
              background: p.surfaceElevated,
              border: `1px dashed ${p.border}`,
              borderRadius: 12,
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span style={{ color: p.textSubtle, fontSize: 13 }}>
                  {search
                    ? `No meetings match "${search}".`
                    : "No meeting minutes shared yet."}
                </span>
              }
            />
          </div>
        ) : viewMode === "list" ? (
          <div
            style={{
              background: p.surfaceElevated,
              border: "1px solid rgba(0, 0, 0, 0.065)",
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table className="mom-table">
                <thead>
                  <tr>
                    <th style={{ width: 120 }}>MOM #</th>
                    <th>Title</th>
                    <th>Date & Time</th>
                    <th>Project</th>
                    <th>Summary & Action Items</th>
                    <th style={{ width: 60, textAlign: "right" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((m) => (
                    <tr
                      key={m.id}
                      className="mom-table-row"
                      onClick={() => router.push(`/portal/mom/${m.id}`)}
                    >
                      <td>
                        <span
                          style={{
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: "2px 8px",
                            background: "rgba(99, 102, 241, 0.07)",
                            border: "1px solid rgba(99, 102, 241, 0.15)",
                            borderRadius: 6,
                            color: "#4f46e5",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {m.momNumber}
                        </span>
                      </td>
                      <td>
                        <div
                          className="mom-table-title"
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: p.text,
                            transition: "color 0.2s ease",
                          }}
                        >
                          {m.title}
                        </div>
                        {m.summaryPreview && (
                          <div
                            style={{
                              fontSize: 12,
                              color: p.textSubtle,
                              marginTop: 4,
                              maxWidth: 320,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={m.summaryPreview}
                          >
                            {m.summaryPreview}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <span style={{ fontSize: 13, color: p.text, display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Clock size={12} color="#6366f1" style={{ opacity: 0.85 }} />
                            {fmtDateTime(m.meetingDate)}
                          </span>
                          {m.durationMinutes && (
                            <span style={{ fontSize: 11.5, color: p.textSubtle, marginLeft: 17 }}>
                              {m.durationMinutes} min
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {m.projectName ? (
                          <span
                            style={{
                              background: "rgba(15, 23, 42, 0.04)",
                              padding: "3px 8px",
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 500,
                              color: "#334155",
                              border: "1px solid rgba(15, 23, 42, 0.06)",
                            }}
                          >
                            {m.projectName}
                          </span>
                        ) : (
                          <span style={{ color: p.textFaint }}>—</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                          <MiniChip
                            icon={Users}
                            value={m.attendeeCount}
                            label="attendees"
                            tone="neutral"
                          />
                          <MiniChip
                            icon={Lightbulb}
                            value={m.decisionCount}
                            label="decisions"
                            tone="purple"
                          />
                          <MiniChip
                            icon={CheckSquare}
                            value={m.actionCount}
                            label={`actions${m.openActionCount > 0 ? ` (${m.openActionCount} open)` : ""
                              }`}
                            tone={m.openActionCount > 0 ? "warning" : "success"}
                          />
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            borderRadius: 6,
                            color: p.textFaint,
                            transition: "all 0.2s ease",
                          }}
                          className="mom-table-action-btn"
                          aria-label="View Details"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Unified Footer Pagination inside the table container! */}
            {meta && meta.total > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                  borderTop: "1px solid rgba(0, 0, 0, 0.05)",
                  padding: "16px 24px",
                  background: "#ffffff",
                }}
              >
                {/* Left side: Open action items (if any) */}
                <div
                  style={{
                    fontSize: 12.5,
                    color: p.textSubtle,
                    fontWeight: 500,
                  }}
                >
                  {totals.totalOpen > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#eab308" }} />
                      <span style={{ color: p.warningText, fontWeight: 600 }}>{totals.totalOpen} open action item{totals.totalOpen === 1 ? "" : "s"}</span> remaining
                    </span>
                  )}
                </div>

                {/* Right side: Native Ant Design Pagination with total & size changer */}
                <div>
                  <Pagination
                    current={page}
                    pageSize={limit}
                    total={meta.total}
                    onChange={(p, s) => {
                      setPage(p);
                      if (s && s !== limit) {
                        setLimit(s);
                        setPage(1);
                      }
                    }}
                    showSizeChanger={true}
                    pageSizeOptions={["10", "20", "50"]}
                    showTotal={(total, range) => (
                      <span style={{ fontSize: 13, color: "#475569", marginRight: 8 }}>
                        <strong style={{ fontWeight: 600, color: "#0f172a" }}>{range[0]}-{range[1]}</strong> of{" "}
                        <strong style={{ fontWeight: 600, color: "#0f172a" }}>{total}</strong> meetings
                      </span>
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 16,
            }}
          >
            {filteredItems.map((m) => (
              <MeetingGridCard key={m.id} mom={m} />
            ))}
          </div>
        )}

        {/* Standalone Bottom bar for Card view ONLY */}
        {viewMode === "card" && meta && meta.total > limit && (
          <div
            style={{
              marginTop: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              borderTop: "1px solid rgba(0, 0, 0, 0.05)",
              paddingTop: 16,
            }}
          >
            {/* Left side: Open action items */}
            <div
              style={{
                fontSize: 12.5,
                color: p.textSubtle,
                fontWeight: 500,
              }}
            >
              {totals.totalOpen > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#eab308" }} />
                  <span style={{ color: p.warningText, fontWeight: 600 }}>{totals.totalOpen} open action item{totals.totalOpen === 1 ? "" : "s"}</span> remaining
                </span>
              )}
            </div>

            {/* Right side: Native Ant Design Pagination with total & size changer */}
            <div>
              <Pagination
                current={page}
                pageSize={limit}
                total={meta.total}
                onChange={(p, s) => {
                  setPage(p);
                  if (s && s !== limit) {
                    setLimit(s);
                    setPage(1);
                  }
                }}
                showSizeChanger={true}
                pageSizeOptions={["10", "20", "50"]}
                showTotal={(total, range) => (
                  <span style={{ fontSize: 13, color: "#475569", marginRight: 8 }}>
                    <strong style={{ fontWeight: 600, color: "#0f172a" }}>{range[0]}-{range[1]}</strong> of{" "}
                    <strong style={{ fontWeight: 600, color: "#0f172a" }}>{total}</strong> meetings
                  </span>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function MeetingCard({ mom }: { mom: PortalMomListItem }) {
  const router = useRouter();
  const [hover, setHover] = useState(false);
  const attachments = mom.attachments ?? [];
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/portal/mom/${mom.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/portal/mom/${mom.id}`);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: "20px 22px",
        background: hover ? "rgba(99, 102, 241, 0.02)" : "transparent",
        border: `1px solid ${hover ? "#818cf8" : "#e2e8f0"}`,
        borderRadius: 16,
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", minWidth: 0 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: hover
                ? "linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)"
                : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: hover
                ? "0 4px 14px -2px rgba(79, 70, 229, 0.35)"
                : "0 4px 10px -2px rgba(99, 102, 241, 0.2)",
              transition: "all 0.25s ease",
            }}
          >
            <Calendar size={20} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 10.5,
                  fontWeight: 600,
                  padding: "2px 8px",
                  background: "rgba(99, 102, 241, 0.07)",
                  border: "1px solid rgba(99, 102, 241, 0.15)",
                  borderRadius: 6,
                  color: "#4f46e5",
                  letterSpacing: "0.02em",
                }}
              >
                {mom.momNumber}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: hover ? "#4f46e5" : "#0f172a",
                  letterSpacing: "-0.015em",
                  transition: "color 0.2s ease",
                }}
              >
                {mom.title}
              </span>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12.5,
                color: "#64748b",
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                <Clock size={12} color="#6366f1" style={{ opacity: 0.85 }} />
                {fmtDateTime(mom.meetingDate)}
              </span>
              {mom.durationMinutes && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#cbd5e1" }}></span>
                  <span style={{ fontWeight: 500 }}>{mom.durationMinutes} min</span>
                </>
              )}
              {mom.projectName && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#cbd5e1" }}></span>
                  <span style={{
                    background: "rgba(15, 23, 42, 0.04)",
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: "#334155"
                  }}>{mom.projectName}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <ChevronRight
          size={18}
          color={hover ? "#4f46e5" : "#94a3b8"}
          style={{
            flexShrink: 0,
            transform: hover ? "translateX(3px)" : "translateX(0)",
            transition: "all 0.2s ease"
          }}
        />
      </div>

      {mom.summaryPreview && (
        <div
          style={{
            fontSize: 13,
            color: "#475569",
            lineHeight: 1.6,
            marginLeft: 60,
            padding: "8px 14px",
            background: hover ? "rgba(241, 245, 249, 0.5)" : "rgba(248, 250, 252, 0.6)",
            borderLeft: hover ? "3px solid #6366f1" : "3px solid #cbd5e1",
            borderRadius: "0 8px 8px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            transition: "all 0.2s ease",
          }}
        >
          {mom.summaryPreview}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          paddingLeft: 60,
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <MiniChip
          icon={Users}
          value={mom.attendeeCount}
          label="attendees"
          tone="neutral"
        />
        <MiniChip
          icon={Lightbulb}
          value={mom.decisionCount}
          label="decisions"
          tone="purple"
        />
        <MiniChip
          icon={CheckSquare}
          value={mom.actionCount}
          label={`actions${mom.openActionCount > 0 ? ` (${mom.openActionCount} open)` : ""
            }`}
          tone={mom.openActionCount > 0 ? "warning" : "success"}
        />
        {mom.recordingUrl && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4.5,
              padding: "3px 10px",
              background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(37, 99, 235, 0.04)",
            }}
          >
            <Video size={11.5} color="#2563eb" />
            Recording
          </span>
        )}
        {attachments.length > 0 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            <Paperclip size={12} color="#64748b" style={{ marginLeft: 4 }} />
            {attachments.map((a) => (
              <AttachmentChip key={a.id} attachment={a} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function MeetingGridCard({ mom }: { mom: PortalMomListItem }) {
  const router = useRouter();
  const [hover, setHover] = useState(false);
  const attachments = mom.attachments ?? [];
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/portal/mom/${mom.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/portal/mom/${mom.id}`);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 16,
        padding: "20px",
        background: hover ? "rgba(99, 102, 241, 0.02)" : "transparent",
        border: `1px solid ${hover ? "#818cf8" : "#e2e8f0"}`,
        borderRadius: 16,
        cursor: "pointer",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <span
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 10.5,
              fontWeight: 600,
              padding: "2px 8px",
              background: "rgba(99, 102, 241, 0.07)",
              border: "1px solid rgba(99, 102, 241, 0.15)",
              borderRadius: 6,
              color: "#4f46e5",
              letterSpacing: "0.02em",
            }}
          >
            {mom.momNumber}
          </span>
          {mom.projectName && (
            <span style={{
              background: "rgba(15, 23, 42, 0.04)",
              padding: "1px 6px",
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
              color: "#334155"
            }}>{mom.projectName}</span>
          )}
        </div>

        <h3
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: hover ? "#4f46e5" : "#0f172a",
            margin: "12px 0 6px",
            lineHeight: 1.4,
            transition: "color 0.2s ease",
          }}
        >
          {mom.title}
        </h3>

        <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
          <Clock size={12} color="#6366f1" style={{ opacity: 0.85 }} />
          {fmtDateTime(mom.meetingDate)}
          {mom.durationMinutes && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: "50%", backgroundColor: "#cbd5e1" }}></span>
              <span>{mom.durationMinutes} min</span>
            </>
          )}
        </div>

        {mom.summaryPreview && (
          <div
            style={{
              fontSize: 12.5,
              color: "#475569",
              lineHeight: 1.5,
              padding: "8px 12px",
              background: hover ? "rgba(241, 245, 249, 0.5)" : "rgba(248, 250, 252, 0.6)",
              borderLeft: hover ? "3px solid #6366f1" : "3px solid #cbd5e1",
              borderRadius: "0 8px 8px 0",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            {mom.summaryPreview}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <MiniChip
            icon={Users}
            value={mom.attendeeCount}
            label="attendees"
            tone="neutral"
          />
          <MiniChip
            icon={Lightbulb}
            value={mom.decisionCount}
            label="decisions"
            tone="purple"
          />
          <MiniChip
            icon={CheckSquare}
            value={mom.actionCount}
            label={`actions${mom.openActionCount > 0 ? ` (${mom.openActionCount} open)` : ""}`}
            tone={mom.openActionCount > 0 ? "warning" : "success"}
          />
        </div>

        {mom.recordingUrl && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4.5,
                padding: "2px 8px",
                background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
                border: "1px solid #bfdbfe",
                color: "#1d4ed8",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Video size={11} color="#2563eb" />
              Recording
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function looksLikeRealUrl(s: string | null | undefined): boolean {
  if (!s) return false;
  try {
    const u = new URL(s.trim());
    return (
      (u.protocol === "http:" || u.protocol === "https:") &&
      u.hostname.includes(".")
    );
  } catch {
    return false;
  }
}

function resolveAttachmentUrl(a: PortalMomListAttachment): string | null {
  if (a.kind === "file") return a.fileUrl ?? null;
  if (looksLikeRealUrl(a.linkUrl)) return a.linkUrl;
  if (looksLikeRealUrl(a.linkLabel)) return a.linkLabel;
  return a.linkUrl ?? null;
}

function AttachmentChip({
  attachment,
}: {
  attachment: PortalMomListAttachment;
}) {
  const url = resolveAttachmentUrl(attachment);
  const isFile = attachment.kind === "file";
  const label = isFile
    ? attachment.fileName || "File"
    : attachment.linkLabel || attachment.linkUrl || "Link";

  const [attHover, setAttHover] = useState(false);

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setAttHover(true)}
      onMouseLeave={() => setAttHover(false)}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        maxWidth: 220,
        padding: "3px 10px",
        background: attHover ? "rgba(37, 99, 235, 0.06)" : "transparent",
        border: attHover ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
        borderRadius: 999,
        color: attHover ? "#2563eb" : "#475569",
        textDecoration: "none",
        fontSize: 11.5,
        fontWeight: 500,
        transition: "all 0.2s ease",
      }}
    >
      {isFile ? (
        <FileText size={11.5} color={attHover ? "#2563eb" : "#64748b"} />
      ) : (
        <Link2 size={11.5} color={attHover ? "#2563eb" : "#64748b"} />
      )}
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
      >
        {label}
      </span>
      <ExternalLink size={9.5} color={attHover ? "#2563eb" : "#94a3b8"} />
    </a>
  );
}

function MiniChip({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: any;
  value: number;
  label: string;
  tone: "neutral" | "purple" | "warning" | "success";
}) {
  if (value === 0) return null;
  const map = {
    neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
    purple: { bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText },
    warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
    success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  }[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        background: map.bg,
        border: `1px solid ${map.border}`,
        color: map.text,
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      <Icon size={11} />
      {value} {label}
    </span>
  );
}
