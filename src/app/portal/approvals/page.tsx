"use client";
import ZukvoLoader from "@/components/common/ZukvoLoader";


import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input, Empty, Pagination, Switch, Row as AntRow, Col, Divider, Typography } from "antd";
import { CheckSquareOutlined } from "@ant-design/icons";
import {
  CheckSquare,
  ChevronRight,
  Search,
  Hourglass,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Calendar,
} from "lucide-react";

const { Title, Text } = Typography;
import {
  portalApprovalsService,
  PortalApprovalListItem,
  PortalApprovalMeta,
} from "@/services/portalApprovalsService";
import {
  p,
  TONE,
  STATUS_META,
  SUBJECT_LABEL,
  fmtDate,
  fmtRelative,
} from "./_ui";

const FILTER_TABS = [
  { key: "ALL", label: "All" },
  { key: "open", label: "Open" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

/* --------------------------------------------------------------- */

export default function PortalApprovalsListPage() {
  const [items, setItems] = useState<PortalApprovalListItem[]>([]);
  const [meta, setMeta] = useState<PortalApprovalMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    try {
      const res = await portalApprovalsService.list({
        page,
        limit,
        status: status === "ALL" ? undefined : status,
        mine,
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
  }, [page, status, mine]);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.approvalNumber.toLowerCase().includes(q) ||
        (a.subjectLabel || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const summary = useMemo(() => {
    const c = meta?.counts || ({} as Record<string, number>);
    return {
      open: c.open || 0,
      approved: c.approved || 0,
      rejected: c.rejected || 0,
      total: meta?.total || 0,
    };
  }, [meta]);

  return (
    <div style={{ height: "100vh", overflowY: "auto", backgroundColor: "#ffffff" }}>
      {/* Workstation Header */}
      <div
        className="saas-header-container portal-mom-header-container"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
          padding: "20px 40px 20px 40px",
          marginBottom: 0,
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <AntRow justify="space-between" align="middle" gutter={[16, 16]}>
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
                  <CheckSquareOutlined style={{ fontSize: 18, color: "#3b82f6" }} />
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
                  Sign-offs
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
                  Designs, requirements, UAT, production releases — anything we need your formal approval on.
                </Text>
              </div>
            </div>
          </Col>
        </AntRow>
      </div>

      <div style={{ padding: "32px 40px 56px", maxWidth: 1180 }}>

      {/* Summary */}
      {summary.total > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <SummaryCard
            label="Waiting on you"
            value={summary.open}
            tone="warning"
            icon={Hourglass}
          />
          <SummaryCard
            label="Approved"
            value={summary.approved}
            tone="success"
            icon={CheckCircle2}
          />
          <SummaryCard
            label="Rejected"
            value={summary.rejected}
            tone="danger"
            icon={XCircle}
          />
          <SummaryCard
            label="Total"
            value={summary.total}
            tone="neutral"
            icon={CheckSquare}
          />
        </div>
      )}

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {FILTER_TABS.map((tab) => {
            const active = status === tab.key;
            const count =
              tab.key === "ALL" ? meta?.total : meta?.counts?.[tab.key as never];
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setStatus(tab.key);
                  setPage(1);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  background: active ? "#4f46e5" : p.surfaceElevated,
                  color: active ? "#ffffff" : p.textMuted,
                  border: `1px solid ${active ? "#4f46e5" : p.border}`,
                  borderRadius: 999,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "1px 7px",
                      borderRadius: 999,
                      background: active
                        ? "rgba(255,255,255,0.15)"
                        : p.neutralBg,
                      color: active ? "#ffffff" : p.textSubtle,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span
            style={{
              fontSize: 12,
              color: p.textSubtle,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Switch
              size="small"
              checked={mine}
              onChange={(v) => {
                setMine(v);
                setPage(1);
              }}
            />
            Only approvals where I&apos;m an approver
          </span>
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={14} color={p.textFaint} />}
            placeholder="Search…"
            style={{ width: 240 }}
          />
        </div>
      </div>

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
          <ZukvoLoader size="md" />
        </div>
      ) : filtered.length === 0 ? (
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
                  ? `No approvals match "${search}".`
                  : mine
                  ? "Nothing waiting on your decision."
                  : "No approvals raised yet."}
              </span>
            }
          />
        </div>
      ) : (
        <div
          style={{
            background: p.surfaceElevated,
            border: `1px solid ${p.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {filtered.map((a, i) => (
            <Row key={a.id} a={a} first={i === 0} />
          ))}
        </div>
      )}

      {meta && meta.total > limit && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <Pagination
            current={page}
            pageSize={limit}
            total={meta.total}
            onChange={setPage}
            showSizeChanger={false}
          />
        </div>
      )}

        <style jsx global>{`
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
          
          /* Form Inputs and Select elements styling overrides */
          .ant-input, .ant-select-selector, .ant-input-affix-wrapper {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
          .ant-input::placeholder, .ant-select-selection-placeholder {
            color: #94a3b8 !important;
          }
          .ant-select-selection-item {
            color: #0f172a !important;
          }
          .ant-input-affix-wrapper .ant-input {
            background-color: transparent !important;
            color: #0f172a !important;
          }
          .ant-input-affix-wrapper:hover, .ant-input:hover, .ant-select-selector:hover {
            border-color: #cbd5e1 !important;
          }
          .ant-input-affix-wrapper-focused, .ant-input-focused, .ant-select-focused .ant-select-selector {
            border-color: #4f46e5 !important;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1) !important;
          }
          .ant-select-arrow {
            color: #94a3b8 !important;
          }
          
          /* Empty state SVG path overrides to force light colors */
          .ant-empty-img-simple path,
          .ant-empty-image svg path,
          .ant-empty-image path {
            fill: #f8fafc !important;
            stroke: #cbd5e1 !important;
          }
          .ant-empty-img-simple ellipse,
          .ant-empty-image svg ellipse,
          .ant-empty-image ellipse {
            fill: #e2e8f0 !important;
            stroke: #cbd5e1 !important;
          }
          .ant-empty-img-simple g,
          .ant-empty-image svg g,
          .ant-empty-image g {
            stroke: #cbd5e1 !important;
          }
          
          /* Target specific nested elements inside simple image for fine tuning */
          .ant-empty-img-simple [fill="#434343"],
          .ant-empty-image [fill="#434343"],
          .ant-empty-img-simple [fill="#1f1f1f"],
          .ant-empty-image [fill="#1f1f1f"] {
            fill: #f1f5f9 !important;
          }
          .ant-empty-img-simple [stroke="#434343"],
          .ant-empty-image [stroke="#434343"] {
            stroke: #cbd5e1 !important;
          }
        `}</style>
    </div>
    </div>
  );
}

/* --------------------------------------------------------------- */

function SummaryCard({
  label,
  value,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  tone: "warning" | "success" | "danger" | "neutral";
  icon: any;
}) {
  const t = TONE[tone];
  return (
    <div
      style={{
        padding: "16px 18px",
        background: p.surfaceElevated,
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        display: "flex",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: t.bg,
          color: t.text,
          border: `1px solid ${t.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: p.text,
            letterSpacing: "-0.01em",
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function Row({
  a,
  first,
}: {
  a: PortalApprovalListItem;
  first: boolean;
}) {
  const [hover, setHover] = useState(false);
  const st = STATUS_META[a.status] || STATUS_META.open;
  const StIcon = st.icon;
  const needsMyDecision = a.status === "open" && !a.myDecision;

  const progress =
    a.requiredCount > 0
      ? `${a.approvedCount}/${a.requiredCount} signed off`
      : "—";

  return (
    <Link
      href={`/portal/approvals/${a.id}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "44px minmax(0, 1.6fr) 140px 130px 130px 30px",
        gap: 14,
        padding: "16px 18px",
        borderTop: first ? "none" : `1px solid ${p.border}`,
        background: hover ? p.surfaceMuted : "transparent",
        textDecoration: "none",
        color: "inherit",
        transition: "background 120ms ease",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: needsMyDecision ? p.warningBg : p.accentBg,
          border: `1px solid ${
            needsMyDecision ? p.warningBorder : p.accentBorder
          }`,
          color: needsMyDecision ? p.warningText : p.accentText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CheckSquare size={16} />
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
              fontSize: 11.5,
              padding: "1px 7px",
              background: p.surfaceMuted,
              border: `1px solid ${p.border}`,
              borderRadius: 6,
              color: p.textMuted,
            }}
          >
            {a.approvalNumber}
          </span>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: p.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {a.title}
          </span>
          {needsMyDecision && (
            <span
              style={{
                padding: "1px 7px",
                fontSize: 10.5,
                fontWeight: 600,
                background: p.warningBg,
                border: `1px solid ${p.warningBorder}`,
                color: p.warningText,
                borderRadius: 999,
              }}
            >
              Needs your decision
            </span>
          )}
          {a.myDecision === "approved" && (
            <span
              style={{
                padding: "1px 7px",
                fontSize: 10.5,
                fontWeight: 600,
                background: p.successBg,
                border: `1px solid ${p.successBorder}`,
                color: p.successText,
                borderRadius: 999,
              }}
            >
              You approved
            </span>
          )}
          {a.myDecision === "rejected" && (
            <span
              style={{
                padding: "1px 7px",
                fontSize: 10.5,
                fontWeight: 600,
                background: p.dangerBg,
                border: `1px solid ${p.dangerBorder}`,
                color: p.dangerText,
                borderRadius: 999,
              }}
            >
              You rejected
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: p.textSubtle,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              padding: "1px 7px",
              background: p.purpleBg,
              border: `1px solid ${p.purpleBorder}`,
              color: p.purpleText,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {SUBJECT_LABEL[a.subjectType] || a.subjectType}
          </span>
          {a.subjectLabel && <span>{a.subjectLabel}</span>}
          {a.projectName && (
            <>
              <span style={{ color: p.textFaint }}>·</span>
              <span>{a.projectName}</span>
            </>
          )}
        </div>
      </div>
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "3px 9px",
            background: TONE[st.tone].bg,
            border: `1px solid ${TONE[st.tone].border}`,
            color: TONE[st.tone].text,
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 500,
          }}
        >
          <StIcon size={11} />
          {st.label}
        </span>
      </div>
      <div
        style={{
          fontSize: 12,
          color: p.textMuted,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Users size={11} />
        {progress}
      </div>
      <div
        style={{
          fontSize: 12,
          color:
            a.dueDate && new Date(a.dueDate) < new Date() && a.status === "open"
              ? p.dangerText
              : p.textSubtle,
          fontWeight:
            a.dueDate && new Date(a.dueDate) < new Date() && a.status === "open"
              ? 600
              : 400,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        {a.dueDate ? (
          <>
            <Calendar size={11} />
            Due {fmtRelative(a.dueDate)}
          </>
        ) : (
          <>
            <Clock size={11} />
            {fmtRelative(a.lastActivityAt)}
          </>
        )}
      </div>
      <ChevronRight size={16} color={p.textFaint} />
    </Link>
  );
}
