"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Drawer, Empty, Table, Tooltip, Modal, Input, Tabs, Upload, message } from "antd";
import { ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Ban, CalendarX, CheckCircle2, Clock, DollarSign,
  Eye, EyeOff, FileSignature, LayoutGrid, List as ListIcon,
  Search, X, FileText, Download, ExternalLink,
  Layers, Hash, Building2, User, Mail, Phone, CalendarCheck
} from "lucide-react";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import DocumentPreview from "@/components/project-agreements/DocumentPreview";
import PasswordUnlockModal from "@/components/project-agreements/PasswordUnlockModal";
import { DetailHero, DetailSection, DetailRow } from "@/components/project-agreements/detailChrome";


import {
  portalAgreementService,
  PortalAgreementDetail,
  PortalAgreementListItem,
  PortalAgreementStats,
} from "@/services/portalAgreementService";
import {
  isPasswordLockError,
  getLockScope,
  unlockAgreement,
} from "@/services/projectAgreementsService";
import {
  PORTAL_PALETTE, PORTAL_TONES, PortalTone,
  PortalFilterBar, PortalFilterOption,
} from "../_components/PortalPageUI";

const p = PORTAL_PALETTE;

const STATUS_META: Record<string, { label: string; tone: PortalTone; icon: any }> = {
  pending:    { label: "Pending",    tone: "warning", icon: Clock        },
  active:     { label: "Active",     tone: "success", icon: CheckCircle2 },
  expired:    { label: "Expired",    tone: "neutral", icon: CalendarX    },
  terminated: { label: "Terminated", tone: "danger",  icon: Ban          },
};

function Chip({ tone, icon: Icon, children }: { tone: PortalTone; icon?: any; children: React.ReactNode }) {
  const t = PORTAL_TONES[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, height: 22, padding: "0 8px", borderRadius: 999, background: t.bg, border: `1px solid ${t.border}`, color: t.text, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>
      {Icon && <Icon size={11} />}{children}
    </span>
  );
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  const d = m ? new Date(`${m[0]}T00:00:00`) : new Date(v);
  if (isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
}
function fmtMoney(v?: string | null, cur?: string | null) {
  if (!v) return "";
  const n = Number(v);
  if (!isFinite(n)) return "";
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: cur || "USD", maximumFractionDigits: 2 }).format(n); }
  catch { return `${cur || ""} ${n.toLocaleString()}`.trim(); }
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function PortalAgreementsPage() {
  const [items, setItems]               = useState<PortalAgreementListItem[]>([]);
  const [stats, setStats]               = useState<PortalAgreementStats>({ total: 0, pending: 0, active: 0, notViewed: 0 });
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [search, setSearch]             = useState("");
  const [filter, setFilter]             = useState("ALL");
  const [viewMode, setViewMode]         = useState<"card" | "table">("card");
  const [openId, setOpenId]             = useState<string | null>(null);
  const [detail, setDetail]             = useState<PortalAgreementDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isLocked, setIsLocked]         = useState(false);
  const [isUnlocked, setIsUnlocked]     = useState(false);
  const [lockScope, setLockScope]       = useState<'TENANT' | 'AGREEMENT' | 'TEMPLATE'>('TENANT');
  
  const [signModalOpen, setSignModalOpen] = useState(false);
  const [signMode, setSignMode] = useState<"text" | "upload">("text");
  const [signatureText, setSignatureText] = useState("");
  const [signatureFont, setSignatureFont] = useState("Caveat");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  
  const fonts = ["Caveat", "Dancing Script", "Pacifico", "Great Vibes", "Satisfy"];

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await portalAgreementService.list();
      setItems(data.items ?? []);
      setStats(data.stats ?? { total: 0, pending: 0, active: 0, notViewed: 0 });
    } catch (err: any) {
      setError(err?.message || "Could not load agreements");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    setOpenId(id); setDetailLoading(true); setDetail(null);
    setSignatureText(""); setSignatureImage(null);
    try {
      const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem(`pa_unlock_${id}`) : null;
      const rec = await portalAgreementService.detail(id, storedToken || undefined);
      setDetail(rec);
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, portalViewedAt: rec.portalViewedAt, viewStatus: rec.viewStatus, viewStatusLabel: rec.viewStatusLabel } : i));
      setIsLocked(false);
      setIsUnlocked(true);
    } catch (err: any) {
      if (isPasswordLockError(err)) {
        setIsLocked(true);
        setIsUnlocked(false);
        setLockScope(getLockScope(err));
      } else {
        setError(err?.message || "Could not open"); setOpenId(null); setIsUnlocked(false);
      }
    }
    finally { setDetailLoading(false); }
  };

  const handleUnlock = async (password: string) => {
    if (!openId) return;
    try {
      const result = await portalAgreementService.unlock(openId, password);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`pa_unlock_${openId}`, result.unlockToken);
      }
      await openDetail(openId);
    } catch (err: any) {
      if (isPasswordLockError(err)) {
        setIsLocked(true);
        setIsUnlocked(false);
        setLockScope(getLockScope(err));
      } else {
        message.error(err?.message || err?.error || "Incorrect password");
      }
    }
  };

  const notViewedCount = items.filter((i) => i.viewStatus === "NOT_VIEWED").length;
  const activeCount    = items.filter((i) => i.status === "active").length;
  const pendingCount   = items.filter((i) => i.status === "pending").length;
  const expiredCount   = items.filter((i) => i.status === "expired").length;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (filter === "NOT_VIEWED" && i.viewStatus !== "NOT_VIEWED") return false;
      if (filter !== "ALL" && filter !== "NOT_VIEWED" && i.status !== filter) return false;
      if (!q) return true;
      return [i.title, i.documentNumber, i.documentTypeName, i.projectName].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [items, search, filter]);

  const activeFilterLabel = filter === "ALL" ? "All agreements" : filter === "NOT_VIEWED" ? "Not viewed" : STATUS_META[filter]?.label ?? filter;

  const filterOptions: PortalFilterOption[] = [
    { key: "ALL",        label: "All",        count: items.length },
    { key: "pending",    label: "Pending",    count: pendingCount },
    { key: "active",     label: "Active",     count: activeCount  },
    { key: "NOT_VIEWED", label: "Not viewed", count: notViewedCount },
    { key: "expired",    label: "Expired",    count: expiredCount },
  ];

  const columns = [
    {
      title: "Document", key: "title",
      render: (_: unknown, a: PortalAgreementListItem) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, display: "grid", placeItems: "center", background: p.accentBg, color: p.accentText }}>
            <FileSignature size={15} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: p.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</div>
            <div style={{ fontSize: 11, color: p.textSubtle, marginTop: 1 }}>{[a.documentTypeName, a.documentNumber, a.projectName].filter(Boolean).join("  ·  ") || "No reference"}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Status", key: "status", width: 220,
      render: (_: unknown, a: PortalAgreementListItem) => {
        const meta = STATUS_META[a.status] ?? { label: a.status, tone: "neutral" as PortalTone, icon: FileSignature };
        const viewed = a.viewStatus === "VIEWED";
        return (
          <span style={{ display: "inline-flex", gap: 6 }}>
            <Chip tone={meta.tone} icon={meta.icon}>{meta.label}</Chip>
            <Chip tone={viewed ? "neutral" : "accent"} icon={viewed ? Eye : EyeOff}>{viewed ? "Viewed" : "Not viewed"}</Chip>
          </span>
        );
      },
    },
    {
      title: "Value", key: "value", width: 140,
      render: (_: unknown, a: PortalAgreementListItem) => (
        <span style={{ fontSize: 13, fontWeight: 600, color: p.text }}>{fmtMoney(a.totalValue, a.valueCurrency) || "—"}</span>
      ),
    },
    {
      title: "Effective", key: "effectiveDate", width: 175,
      render: (_: unknown, a: PortalAgreementListItem) => (
        <span style={{ fontSize: 12, color: p.textMuted }}>
          {a.effectiveDate ? `From ${fmtDate(a.effectiveDate)}` : "—"}
          {a.expiryDate ? ` → ${fmtDate(a.expiryDate)}` : ""}
        </span>
      ),
    },
  ];

  /* ── inline ViewToggle (no external CSS dependency) ── */
  const ViewBtn = ({ mode, Icon, title }: { mode: "card" | "table"; Icon: any; title: string }) => (
    <button
      type="button"
      title={title}
      onClick={() => setViewMode(mode)}
      style={{
        width: 32, height: 32, display: "grid", placeItems: "center",
        border: "none", background: viewMode === mode ? "#eff6ff" : "transparent",
        color: viewMode === mode ? "#1d4ed8" : "#94a3b8",
        cursor: "pointer", transition: "all .12s",
      }}
    >
      <Icon size={14} />
    </button>
  );

  /* ── inline stat tag ── */
  const Tag = ({ color, children }: { color: string; children: React.ReactNode }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, height: 20, padding: "0 8px", borderRadius: 5, background: color === "blue" ? "#eff6ff" : color === "amber" ? "#fffbeb" : "#f1f5f9", color: color === "blue" ? "#1d4ed8" : color === "amber" ? "#92400e" : "#475569", fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em" }}>
      {children}
    </span>
  );

  return (
    <div style={{ height: "100vh", overflowY: "auto", backgroundColor: "#fff", display: "flex", flexDirection: "column", width: "100%" }}>

      {/* ── Header toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0 16px", height: 52, flexShrink: 0,
        borderBottom: `1px solid ${p.border}`,
        background: p.surface,
      }}>
        {/* Icon + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
          <span style={{ width: 28, height: 28, borderRadius: 7, display: "grid", placeItems: "center", background: p.accentBg, color: p.accentText, flexShrink: 0 }}>
            <FileSignature size={15} />
          </span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: p.text, lineHeight: 1.2 }}>Agreements</div>
            <div style={{ fontSize: 9.5, fontWeight: 700, color: p.textFaint, textTransform: "uppercase", letterSpacing: "0.07em" }}>OVERSEE AGREEMENTS &amp; DOCUMENTS</div>
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6, flex: "1 1 0", maxWidth: 320,
          height: 32, padding: "0 10px", borderRadius: 8,
          border: `1px solid ${p.border}`, background: "#f8fafc", marginLeft: 16,
        }}>
          <Search size={13} style={{ color: p.textFaint, flexShrink: 0 }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Quick search agreement name…"
            style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontSize: 12.5, color: p.text, fontFamily: "inherit" }}
          />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* View toggle */}
        <div style={{ display: "inline-flex", border: `1px solid ${p.border}`, borderRadius: 8, overflow: "hidden" }}>
          <ViewBtn mode="card" Icon={ListIcon} title="Card view" />
          <div style={{ width: 1, background: p.border }} />
          <ViewBtn mode="table" Icon={LayoutGrid} title="Table view" />
        </div>

        {/* Refresh */}
        <Tooltip title="Refresh">
          <Button
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={() => load(true)}
            disabled={loading}
            style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${p.border}` }}
          />
        </Tooltip>
      </div>

      {/* ── Filter pills ── */}
      <div style={{ padding: "8px 16px", borderBottom: `1px solid ${p.border}`, background: p.surface, flexShrink: 0 }}>
        <PortalFilterBar options={filterOptions} active={filter} onChange={setFilter} />
      </div>

      {/* ── Summary banner ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        padding: "9px 16px", borderBottom: `1px solid ${p.border}`,
        background: "#fafbfc", flexShrink: 0,
      }}>
        {/* Left: title + tags */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#6366f1", boxShadow: "0 0 0 3px rgba(99,102,241,0.2)", flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: p.text }}>
              Agreements — {activeFilterLabel}
            </span>
          </div>
          <Tag color="slate">{stats.total} TOTAL</Tag>
          {activeCount > 0   && <Tag color="blue">{activeCount} ACTIVE</Tag>}
          {pendingCount > 0  && <Tag color="amber">{pendingCount} PENDING</Tag>}
        </div>

        {/* Right: meta stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "results", value: visible.length },
            { label: "active",  value: activeCount    },
            { label: "not viewed", value: notViewedCount },
            { label: "expired", value: expiredCount   },
          ].map(({ label, value }) => (
            <span key={label} style={{ fontSize: 12, color: p.textMuted }}>
              <b style={{ color: p.text, fontWeight: 700 }}>{value}</b> {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ flex: "1 0 auto" }}>
        {loading ? (
          <div style={{ padding: 60, textAlign: "center" }}><ZukvoLoader size="md" /></div>
        ) : error ? (
          <div style={{ padding: "14px 16px", margin: 16, borderRadius: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: 13 }}>{error}</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: 56, textAlign: "center" }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: p.textSubtle }}>{items.length === 0 ? "No agreements have been shared with you yet." : "Nothing matches that search."}</span>} />
          </div>
        ) : viewMode === "table" ? (
          <div style={{ background: "#fff", overflowX: "auto" }}>
            <Table
              rowKey="id"
              size="small"
              className="portal-agr-table"
              columns={columns as any}
              dataSource={visible}
              pagination={visible.length > 20 ? { pageSize: 20, size: "small" } : false}
              onRow={(rec) => ({ onClick: () => openDetail(rec.id), style: { cursor: "pointer" } })}
              scroll={{ x: "max-content" }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {visible.map((a) => {
              const meta = STATUS_META[a.status] ?? { label: a.status, tone: "neutral" as PortalTone, icon: FileSignature };
              const viewed = a.viewStatus === "VIEWED";
              const money = fmtMoney(a.totalValue, a.valueCurrency);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => openDetail(a.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    width: "100%", padding: "13px 16px",
                    cursor: "pointer", textAlign: "left",
                    background: p.surface, border: "none",
                    borderBottom: `1px solid ${p.border}`,
                    transition: "background .12s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = p.surface; }}
                >
                  <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, display: "grid", placeItems: "center", background: p.accentBg, color: p.accentText }}>
                    <FileSignature size={17} />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: p.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.title}</span>
                    <span style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap", alignItems: "center" }}>
                      {[a.documentTypeName, a.documentNumber, a.projectName].filter(Boolean).map((v, i) => (
                        <span key={i} style={{ fontSize: 11.5, color: p.textSubtle }}>{v}</span>
                      ))}
                      {money && <span style={{ fontSize: 11.5, color: p.textSubtle, display: "inline-flex", alignItems: "center", gap: 3 }}><DollarSign size={10} />{money}</span>}
                      {a.effectiveDate && <span style={{ fontSize: 11.5, color: p.textSubtle }}>{fmtDate(a.effectiveDate)}</span>}
                    </span>
                  </span>
                  <span style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <Chip tone={meta.tone} icon={meta.icon}>{meta.label}</Chip>
                    <Chip tone={viewed ? "neutral" : "accent"} icon={viewed ? Eye : EyeOff}>{viewed ? "Viewed" : "Not viewed"}</Chip>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      <Drawer
        open={Boolean(openId) && isUnlocked}
        onClose={() => { setOpenId(null); setDetail(null); setSignatureText(""); setSignatureImage(null); }}
        placement="right" width="min(1180px, 95vw)"
        closable={false} destroyOnHidden
        rootClassName="pa-drawer"
        styles={{ body: { padding: 0, display: "flex", flexDirection: "column" } }}
        title={null}
      >
        <div className="pa-header">
          <div className="pa-header-about">
            <button
              type="button"
              className="pa-btn"
              style={{ width: 32, padding: 0, justifyContent: "center" }}
              onClick={() => { setOpenId(null); setDetail(null); }}
              aria-label="Close"
            >
              <X size={15} />
            </button>
            <div style={{ minWidth: 0 }}>
              <div className="pa-header-title">{detail?.title || "Agreement"}</div>
              <div className="pa-header-sub">
                {detail
                  ? [
                      detail.documentTypeName,
                      detail.documentNumber || "No reference",
                      detail.projectName,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")
                  : "Loading…"}
              </div>
            </div>
          </div>
          
          {detail && (
            <div className="pa-header-actions">
              <span className="pa-chip" style={{ background: STATUS_META[detail.status]?.tone === "success" ? "#ecfdf5" : "#fffbeb", color: STATUS_META[detail.status]?.tone === "success" ? "#047857" : "#b45309" }}>
                {STATUS_META[detail.status]?.label ?? detail.status}
              </span>
              <button
                type="button"
                className="pa-btn"
                onClick={() => { 
                  if (detail.clientSignatoryName) {
                    setSignatureText(detail.clientSignatoryName);
                  }
                  setSignatureImage(null);
                  setSignMode("text");
                  setSignModalOpen(true); 
                }}
                style={{ background: "#10b981", color: "#fff", border: "none" }}
                title="Digitally sign this agreement"
              >
                <FileSignature size={14} /> Sign Agreement
              </button>
              <button
                type="button"
                className="pa-btn"
                onClick={async () => {
                  if (detail.pdfUrl) {
                    const a = document.createElement("a");
                    a.href = detail.pdfUrl;
                    a.download = `${detail.title.replace(/[^a-zA-Z0-9.-]/g, "-")}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    return;
                  }
                  
                  setIsDownloadingPdf(true);
                  try {
                    const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem(`pa_unlock_${detail.id}`) : null;
                    await portalAgreementService.downloadPdf(detail.id, detail.title || "agreement", storedToken || undefined);
                  } catch (err) {
                    console.error("Failed to download PDF", err);
                  } finally {
                    setIsDownloadingPdf(false);
                  }
                }}
                disabled={isDownloadingPdf}
                title="Download this document as a PDF"
              >
                {isDownloadingPdf ? <ZukvoLoader size="sm" /> : <Download size={14} />} 
                {isDownloadingPdf ? "Downloading..." : "Download"}
              </button>
            </div>
          )}
        </div>

        {detailLoading || !detail ? (
          <div style={{ flex: 1, display: "grid", placeItems: "center" }}><ZukvoLoader size="md" /></div>
        ) : (
          <div className="pa-detail">
            <aside className="pa-detail-side">
              <DetailHero
                eyebrow="Total project value"
                value={fmtMoney(detail.totalValue, detail.valueCurrency)}
                caption={detail.totalValue ? "Total value agreed" : ""}
                tint={STATUS_META[detail.status]?.tone === "success" ? "#047857" : "#3b82f6"}
              />

              <DetailSection title="Document">
                <DetailRow
                  icon={<Layers size={13} />}
                  label="Type"
                  value={detail.documentTypeName}
                  sub={(detail as any).documentTypeCode}
                />
                <DetailRow
                  icon={<Hash size={13} />}
                  label="Reference"
                  value={detail.documentNumber}
                  mono
                />
                <DetailRow
                  icon={<FileText size={13} />}
                  label="Project"
                  value={detail.projectName}
                  sub={(detail as any).projectCode}
                />
              </DetailSection>

              <DetailSection title="Counterparty">
                <DetailRow
                  icon={<Building2 size={13} />}
                  label="Company"
                  value={(detail as any).clientCompany}
                />
                <DetailRow
                  icon={<User size={13} />}
                  label="Contact"
                  value={(detail as any).partyName}
                />
                <DetailRow
                  icon={<Mail size={13} />}
                  label="Email"
                  value={(detail as any).partyEmail}
                />
                <DetailRow
                  icon={<Phone size={13} />}
                  label="Phone"
                  value={(detail as any).partyPhone}
                />
              </DetailSection>

              <DetailSection title="Dates">
                <DetailRow
                  icon={<CalendarCheck size={13} />}
                  label="Effective"
                  value={fmtDate(detail.effectiveDate)}
                />
                <DetailRow
                  icon={<CalendarX size={13} />}
                  label="Expires"
                  value={fmtDate(detail.expiryDate)}
                />
                <DetailRow
                  icon={<Clock size={13} />}
                  label="Kick-off"
                  value={fmtDate((detail as any).kickoffDate)}
                />
              </DetailSection>

              <DetailSection title="Sign-off">
                <DetailRow
                  icon={<FileSignature size={13} />}
                  label="Our side"
                  value={(detail as any).signatoryName}
                  sub={[(detail as any).signatoryPosition, (detail as any).signatoryCompany].filter(Boolean).join(" · ")}
                />
                <DetailRow
                  icon={<FileSignature size={13} />}
                  label="Their side"
                  value={(detail as any).clientSignatoryName}
                  sub={[
                    (detail as any).clientSignatoryPosition,
                    (detail as any).clientSignatoryCompany || (detail as any).clientCompany,
                  ].filter(Boolean).join(" · ")}
                />
              </DetailSection>
            </aside>

            <DocumentPreview
              html={detail.contentHtml}
              pdfUrl={detail.pdfUrl}
              fit="page"
              label="Pages"
              title={detail.title}
              loading={detailLoading}
            />
          </div>
        )}
      </Drawer>

      <style>{`
        /* Portal table styles */
        .portal-agr-table .ant-table-thead > tr > th {
          background: #f8fafc !important; font-size: 10.5px !important; font-weight: 700 !important;
          text-transform: uppercase !important; letter-spacing: 0.06em !important;
          color: #64748b !important; border-bottom: 1px solid #e2e8f0 !important; padding: 8px 14px !important;
        }
        .portal-agr-table .ant-table-thead > tr > th::before { display: none !important; }
        .portal-agr-table .ant-table-tbody > tr > td { border-bottom: 1px solid #f1f5f9 !important; padding: 11px 14px !important; }
        .portal-agr-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .portal-agr-table .ant-table-tbody > tr:hover > td { background: #f8fafc !important; }

        /* Project Agreements Drawer & Preview Styles */
        .pa-header {
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          padding: 0 16px; min-height: 53px;
          box-sizing: border-box;
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
          background: var(--bg-pure-white, #fff);
          position: sticky; top: 0; z-index: 30;
        }
        .pa-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .pa-header-title {
          font-size: 14px; font-weight: 700; color: var(--text-slate-900, #0f172a);
          letter-spacing: -0.02em; line-height: 1.15;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pa-header-sub {
          font-size: 12.5px; color: var(--text-slate-600, #475569); margin-top: 2px;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pa-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .pa-btn {
          display: inline-flex; align-items: center; gap: 6px;
          height: 32px; padding: 0 12px; border-radius: 8px;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          border: 1px solid var(--border-slate-200, #e2e8f0);
          background: var(--bg-pure-white, #fff); color: var(--text-slate-700, #334155);
          transition: all 0.15s; white-space: nowrap;
        }
        .pa-btn:hover:not(:disabled) { border-color: #bfdbfe; color: #3b82f6; }
        .pa-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .pa-chip {
          display: inline-flex; align-items: center; gap: 5px;
          height: 22px; padding: 0 8px; border-radius: 999px;
          font-size: 11px; font-weight: 700; letter-spacing: 0.01em;
        }

        .pa-drawer .ant-drawer-body {
          padding: 0 !important;
          display: flex; flex-direction: column;
          overflow: hidden;
          background: var(--bg-pure-white, #fff);
        }
        .pa-drawer .pa-header { position: static; }

        .pa-detail {
          flex: 1; min-height: 0;
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
        }
        .pa-detail-side {
          overflow-y: auto; padding: 14px;
          display: flex; flex-direction: column; gap: 0;
          border-right: 1px solid var(--border-slate-200, #e2e8f0);
          background: var(--bg-slate-50, #f8fafc);
        }
        .pa-detail-side::-webkit-scrollbar { width: 5px; }
        .pa-detail-side::-webkit-scrollbar-thumb {
          background: var(--border-slate-200, #e2e8f0); border-radius: 3px;
        }

        .pa-dt-hero {
          padding: 12px 13px; border-radius: 11px; margin-bottom: 14px;
          border: 1px solid color-mix(in srgb, var(--hero, #3b82f6) 26%, transparent);
          background: color-mix(in srgb, var(--hero, #3b82f6) 9%, transparent);
        }
        .pa-dt-hero-eyebrow {
          font-size: 9.5px; font-weight: 800; letter-spacing: 0.09em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--hero, #3b82f6) 78%, var(--text-slate-900, #0f172a));
        }
        .pa-dt-hero-value {
          margin-top: 5px;
          font-size: 19px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15;
          color: var(--text-slate-900, #0f172a);
          font-variant-numeric: tabular-nums;
          overflow-wrap: anywhere;
        }
        .pa-dt-hero-caption {
          margin-top: 5px;
          font-size: 11px; line-height: 1.5; font-weight: 600;
          color: var(--text-slate-500, #64748b);
        }

        .pa-dt-section { padding: 12px 0; border-top: 1px solid var(--border-slate-200, #e2e8f0); }
        .pa-dt-section:first-of-type { border-top: none; padding-top: 0; }
        .pa-dt-section-title {
          display: flex; align-items: center; gap: 6px;
          font-size: 9.5px; font-weight: 800; letter-spacing: 0.09em;
          text-transform: uppercase; color: var(--text-slate-400, #94a3b8);
          margin-bottom: 9px;
        }
        .pa-dt-rows { display: flex; flex-direction: column; gap: 9px; }
        .pa-dt-row {
          display: grid;
          grid-template-columns: 16px 74px minmax(0, 1fr);
          align-items: start; gap: 8px;
        }
        .pa-dt-row > .pa-dt-label:first-child { grid-column: 2; }
        .pa-dt-icon {
          display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-slate-400, #94a3b8); margin-top: 1px;
        }
        .pa-dt-label {
          font-size: 11px; font-weight: 600; color: var(--text-slate-400, #94a3b8);
          line-height: 1.45;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .pa-dt-value {
          display: flex; flex-direction: column; gap: 1px;
          font-size: 12.5px; font-weight: 600; line-height: 1.45;
          color: var(--text-slate-900, #0f172a); overflow-wrap: anywhere;
        }
        .pa-dt-value.is-mono {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 11.5px;
        }
        .pa-dt-sub { font-size: 11px; font-weight: 500; color: var(--text-slate-500, #64748b); }

        .pa-preview {
          min-width: 0; min-height: 0;
          display: flex; flex-direction: column;
          background: var(--bg-pure-white, #fff);
          flex: 1 1 auto;
        }
        .pa-preview-bar {
          display: flex; align-items: center; gap: 8px;
          height: 44px; padding: 0 10px 0 14px; flex-shrink: 0;
          border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
          background: var(--bg-pure-white, #fff);
          color: var(--text-slate-400, #94a3b8);
        }
        .pa-preview-label {
          font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-500, #64748b);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pa-preview-spinner { display: inline-flex; flex-shrink: 0; }
        .pa-preview-tools {
          margin-left: auto;
          display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }
        .pa-zoom {
          display: flex; align-items: center; gap: 1px;
          padding: 2px; border-radius: 9px;
          background: var(--bg-slate-50, #f8fafc);
          border: 1px solid var(--border-slate-200, #e2e8f0);
        }
        .pa-zoom-btn {
          width: 26px; height: 26px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          border: none; border-radius: 7px;
          background: transparent; color: var(--text-slate-500, #64748b);
          cursor: pointer; transition: background 0.15s, color 0.15s;
        }
        .pa-zoom-btn:hover:not(:disabled) {
          background: color-mix(in srgb, #3b82f6 10%, transparent); color: #3b82f6;
        }
        .pa-zoom-btn.is-on {
          background: color-mix(in srgb, #3b82f6 14%, transparent); color: #3b82f6;
        }
        .pa-zoom-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pa-preview-tools > .pa-zoom-btn {
          border: 1px solid var(--border-slate-200, #e2e8f0);
          width: 32px; height: 32px; border-radius: 9px;
          background: var(--bg-slate-50, #f8fafc);
        }
        .pa-zoom-value {
          min-width: 40px; text-align: center;
          font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums;
          color: var(--text-slate-600, #475569); user-select: none;
        }

        .pa-preview-stage {
          flex: 1; min-height: 0;
          overflow-x: auto; overflow-y: hidden;
          text-align: center;
          background: var(--bg-slate-100, #f1f5f9);
        }
        .pa-preview-stage.is-page {
          overflow: auto; padding: 12px;
        }
        .pa-preview-stage.is-page > .pa-preview-scaler {
          flex: none; border-radius: 2px;
          box-shadow: 0 2px 10px rgba(15,23,42,0.14), 0 0 0 1px rgba(15,23,42,0.06);
        }
        .pa-preview-stage.is-page.is-pdf { display: block; padding: 0; overflow: hidden; }
        .pa-preview-stage::-webkit-scrollbar { height: 8px; }
        .pa-preview-stage::-webkit-scrollbar-thumb {
          background: var(--border-slate-200, #e2e8f0); border-radius: 4px;
        }
        .pa-preview-scaler {
          display: inline-block; position: relative;
          vertical-align: top; overflow: hidden;
        }
        .pa-preview-frame { border: none; display: block; background: transparent; }
        .pa-preview-stage.is-pdf { overflow: hidden; text-align: left; }
        .pa-preview-pdf { width: 100%; height: 100%; border: none; display: block; }

        @media (max-width: 1024px) {
          .pa-detail { grid-template-columns: 1fr; grid-template-rows: auto minmax(0, 1fr); }
          .pa-detail-side {
            border-right: none;
            border-bottom: 1px solid var(--border-slate-200, #e2e8f0);
            max-height: 40vh;
          }
        }
      `}</style>
      
      <Modal
        title={null}
        open={signModalOpen}
        onCancel={() => {
          setSignModalOpen(false);
          setSignatureText("");
          setSignatureImage(null);
        }}
        width={520}
        zIndex={2000}
        styles={{ body: { padding: '16px 20px' } }}
        closeIcon={<X size={18} color="#64748b" />}
        footer={[
          <div key="footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'left', flex: 1, paddingRight: 12, lineHeight: 1.2 }}>
              By clicking "Sign & Accept", you agree to be legally bound by this document.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={() => setSignModalOpen(false)} style={{ borderRadius: 6 }}>Cancel</Button>
              <Button 
                type="primary" 
                style={{ background: "#10b981", borderRadius: 6, fontWeight: 600 }}
                loading={isSigning} 
                disabled={(signMode === "text" && !signatureText.trim()) || (signMode === "upload" && !signatureImage)} 
                onClick={async () => {
                  if (!detail) return;
                  setIsSigning(true);
                  try {
                    let finalUrl: string | undefined = undefined;

                    if (signMode === "upload") {
                      finalUrl = signatureImage || undefined;
                    } else if (signMode === "text" && signatureText.trim()) {
                      const canvas = document.createElement("canvas");
                      canvas.width = 600;
                      canvas.height = 160;
                      const ctx = canvas.getContext("2d");
                      if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.font = `64px "${signatureFont}", cursive`;
                        ctx.fillStyle = "black";
                        ctx.textBaseline = "middle";
                        ctx.textAlign = "center";
                        ctx.fillText(signatureText.trim(), canvas.width / 2, canvas.height / 2);
                        
                        finalUrl = canvas.toDataURL("image/png");
                      }
                    }

                    const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem(`pa_unlock_${detail.id}`) : null;
                    await portalAgreementService.sign(
                      detail.id,
                      {
                        signatureUrl: finalUrl,
                        signatureText: signMode === "text" ? signatureText.trim() : undefined,
                      },
                      storedToken || undefined
                    );
                    setSignModalOpen(false);
                    openDetail(detail.id);
                    load();
                  } catch (err) {
                    console.error("Sign failed", err);
                    message.error("Could not sign the agreement");
                  } finally {
                    setIsSigning(false);
                  }
                }}
              >
                Sign & Accept
              </Button>
            </div>
          </div>
        ]}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ display: 'inline-flex', padding: 8, background: '#ecfdf5', borderRadius: '50%', marginBottom: 12 }}>
            <FileSignature size={24} color="#10b981" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: '#0f172a' }}>Sign Agreement</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>
            Please provide your signature to securely accept and finalize this agreement.
          </p>
        </div>

        <Tabs 
          activeKey={signMode} 
          onChange={k => setSignMode(k as "text" | "upload")}
          centered
          size="small"
          items={[
            {
              key: "text",
              label: "Type Signature",
              children: (
                <div style={{ padding: "4px 0" }}>
                  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Dancing+Script:wght@600&family=Pacifico&family=Great+Vibes&family=Satisfy&display=swap" rel="stylesheet" />
                  
                  <div style={{ position: 'relative', margin: '12px auto 24px', maxWidth: 350 }}>
                    <Input 
                      placeholder="Type your full name" 
                      value={signatureText}
                      onChange={e => setSignatureText(e.target.value)}
                      style={{ 
                        fontFamily: `"${signatureFont}", cursive`, 
                        fontSize: 36, 
                        textAlign: "center", 
                        padding: "0 12px 8px",
                        border: 'none',
                        borderBottom: '2px dashed #cbd5e1',
                        borderRadius: 0,
                        background: 'transparent',
                        boxShadow: 'none',
                        color: '#0f172a'
                      }}
                      autoFocus
                    />
                    <div style={{ position: 'absolute', bottom: -20, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 600 }}>Sign Here</div>
                  </div>
                  
                  <div style={{ marginTop: 20 }}>
                    <p style={{ fontSize: 11, color: '#64748b', marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, textAlign: 'center' }}>Choose Your Style</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
                      {fonts.map(font => (
                        <div 
                          key={font}
                          onClick={() => setSignatureFont(font)}
                          style={{ 
                            padding: "10px 8px", 
                            border: `2px solid ${signatureFont === font ? "#10b981" : "#f1f5f9"}`, 
                            borderRadius: 8, 
                            cursor: "pointer", 
                            fontFamily: `"${font}", cursive`,
                            fontSize: 22,
                            textAlign: 'center',
                            background: signatureFont === font ? "#ecfdf5" : "#f8fafc",
                            color: signatureFont === font ? "#047857" : "#475569",
                            transition: "all 0.15s ease",
                            boxShadow: signatureFont === font ? "0 2px 8px rgba(16, 185, 129, 0.1)" : "none",
                            lineHeight: 1.2,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {signatureText || "Signature"}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: "upload",
              label: "Upload Image",
              children: (
                <div style={{ padding: "12px 0 8px", textAlign: "center" }}>
                  {!signatureImage ? (
                    <Upload.Dragger
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={file => {
                        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/svg+xml';
                        if (!isJpgOrPng) {
                          message.error('You can only upload JPG/PNG/SVG files!');
                          return false;
                        }
                        const reader = new FileReader();
                        reader.onload = e => {
                          setSignatureImage(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                        return false; 
                      }}
                      style={{ background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 8, padding: '24px 16px' }}
                    >
                      <p className="ant-upload-drag-icon" style={{ color: '#94a3b8', marginBottom: 12 }}>
                        <UploadOutlined style={{ fontSize: 28 }} />
                      </p>
                      <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                        Click or drag image to this area
                      </p>
                      <p className="ant-upload-hint" style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
                        Upload a clear image of your signature (PNG, JPG).
                      </p>
                    </Upload.Dragger>
                  ) : (
                    <div style={{ background: '#f8fafc', border: "2px dashed #cbd5e1", padding: "24px 16px", borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <img src={signatureImage} alt="Signature Preview" style={{ maxHeight: 80, maxWidth: "100%", objectFit: "contain", mixBlendMode: 'multiply' }} />
                      <div style={{ marginTop: 16 }}>
                        <Button size="small" danger onClick={() => setSignatureImage(null)} style={{ borderRadius: 4, fontWeight: 600 }}>Remove</Button>
                      </div>
                    </div>
                  )}
                </div>
              )
            }
          ]}
        />
      </Modal>

      <PasswordUnlockModal
        open={isLocked}
        documentTitle={items.find((i) => i.id === openId)?.title || 'Agreement'}
        documentNumber={items.find((i) => i.id === openId)?.documentNumber}
        scope={lockScope}
        onUnlock={handleUnlock}
        onCancel={() => {
          setIsLocked(false);
          setOpenId(null);
        }}
      />
    </div>
  );
}
