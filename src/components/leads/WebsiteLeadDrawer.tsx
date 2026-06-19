"use client";

import React, { useEffect, useState } from "react";
import { Drawer, Button, Spin, Empty, Tooltip, message } from "antd";
import {
  X,
  Calendar,
  ExternalLink,
  Layers,
  FileEdit,
  Zap,
  FileText,
  UserPlus,
  FolderPlus,
  Send,
  Activity,
  Globe,
  Sparkles,
  Mail,
  Phone,
  MapPin,
  Building2,
  Users,
  MessageSquare,
  Tag,
} from "lucide-react";
import dayjs from "dayjs";
import { apiClient } from "@/lib/axios";
import { Lead } from "@/services/leadService";

interface Status {
  id: string;
  name: string;
  color: string;
  is_default?: boolean;
}

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  configStatuses: Status[];
}

type Tab = "details" | "timeline" | "notes" | "emails" | "meetings";

const SOURCE_PALETTE: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
  Zukvo:    { bg: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)", icon: <Sparkles size={11} strokeWidth={2.2} /> },
  Zithtech: { bg: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)", icon: <Layers size={11} strokeWidth={2.2} /> },
  Website:  { bg: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)", icon: <Globe size={11} strokeWidth={2.2} /> },
  Upwork:   { bg: "rgba(16, 185, 129, 0.1)",   color: "#34d399", border: "rgba(16, 185, 129, 0.3)",   icon: <Globe size={11} strokeWidth={2.2} /> },
};

const getInitials = (name?: string) => {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ACTION_META: Record<string, { label: string; icon: React.ReactNode }> = {
  CREATED_LEAD:     { label: "Lead created",      icon: <UserPlus size={13} /> },
  UPDATED_LEAD:     { label: "Lead updated",      icon: <FileEdit size={13} /> },
  CREATED_BIDIQ:    { label: "BidIQ analyzed",    icon: <Zap size={13} /> },
  CREATED_PROPOSAL: { label: "Proposal created",  icon: <FileText size={13} /> },
  CLIENT_CREATED:   { label: "Client created",    icon: <UserPlus size={13} /> },
  PROJECT_CREATED:  { label: "Project created",   icon: <FolderPlus size={13} /> },
  MAIL_SENT:        { label: "Email sent",        icon: <Send size={13} /> },
};

const relativeShort = (ts: string) => {
  const d = dayjs(ts);
  const now = dayjs();
  const diffMin = now.diff(d, "minute");
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = now.diff(d, "hour");
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = now.diff(d, "day");
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.round(diffDay / 7)}w ago`;
  return d.format("MMM D, YYYY");
};

const nextFollowUpLabel = (lead: Lead): string => {
  if (!lead.timeline_end) return "—";
  const d = dayjs(lead.timeline_end);
  const now = dayjs();
  if (d.isSame(now, "day")) return "Today";
  if (d.isSame(now.add(1, "day"), "day")) return "Tomorrow";
  if (d.isBefore(now, "day")) return `${d.format("MMM D")} (overdue)`;
  return d.format("MMM D");
};

const parseDealValue = (lead: Lead): string => {
  const raw = lead.budget || (lead.hour_based_amount ? `${lead.hour_based_amount}/hr` : "");
  if (!raw) return "—";
  const isHourly = String(raw).includes("/hr");
  if (isHourly) return `$${String(raw).replace("/hr", "")}/hr`;
  const num = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(num)) return String(raw);
  if (num >= 1000) return `$${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k`;
  return `$${num}`;
};

export const WebsiteLeadDrawer: React.FC<Props> = ({
  lead,
  open,
  onClose,
  configStatuses,
}) => {
  const [tab, setTab] = useState<Tab>("details");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [tlLoading, setTlLoading] = useState(false);
  const [mails, setMails] = useState<any[]>([]);
  const [mailsLoading, setMailsLoading] = useState(false);
  const [mailsFetched, setMailsFetched] = useState(false);

  const fetchMails = async (leadId: string) => {
    setMailsLoading(true);
    try {
      const res = await apiClient.get(`/api/leads/${leadId}/mails`);
      setMails(res.data?.data || []);
    } catch {
      message.error('Failed to load mailing history');
    } finally {
      setMailsLoading(false);
      setMailsFetched(true);
    }
  };

  useEffect(() => {
    if (!open || !lead?.id) return;
    setTab("details");
    setMails([]);
    setMailsFetched(false);
    setTlLoading(true);
    apiClient
      .get(`/api/leads/${lead.id}/timeline`)
      .then((res) => setTimeline(res.data?.data || []))
      .catch(() => message.error("Failed to load timeline"))
      .finally(() => setTlLoading(false));
  }, [open, lead?.id]);

  // Lazy-load mails when tab is opened for the first time
  useEffect(() => {
    if (tab === 'emails' && !mailsFetched && lead?.id) {
      fetchMails(lead.id);
    }
  }, [tab, mailsFetched, lead?.id]);

  if (!lead) return null;

  const source = lead.platform || "Website";
  const srcMeta = SOURCE_PALETTE[source] || SOURCE_PALETTE.Website;
  const status = configStatuses.find((s) => s.name === lead.status);
  const statusColor = status?.color || "#94a3b8";
  const leadId = `L-${String(lead.id).slice(0, 4).toUpperCase()}`;

  const creatorName =
    (lead as any).created_by_name ||
    (lead as any).created_by ||
    (lead as any).creator_name ||
    (lead as any).owner_name ||
    "System";
  const createdAt = lead.created_at ? dayjs(lead.created_at) : null;
  const createdAtLabel = createdAt ? createdAt.format("DD MMM YYYY, hh:mm A") : "—";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={540}
      closable={false}
      placement="right"
      className="wld-drawer"
      styles={{
        body: { padding: 0, background: "var(--bg-secondary)" },
        header: { display: "none" },
      }}
    >
      {/* Header */}
      <div className="wld-header">
        <div className="wld-header-top">
          <div className="wld-avatar" aria-hidden>{getInitials(lead.client_name)}</div>
          <div className="wld-id-block">
            <div
              className="wld-eyebrow"
              style={{ color: srcMeta.color }}
            >
              <span className="wld-eyebrow-icon" aria-hidden>{srcMeta.icon}</span>
              <span>Website inquiry from <strong>{source}</strong></span>
            </div>
            <div className="wld-id-line">
              <span className="wld-name">{lead.client_name || "—"}</span>
            </div>
            <div className="wld-id-sub">
              {lead.company && (
                <>
                  <span className="wld-company">
                    {lead.company}
                    {lead.company_domain && (
                      <Tooltip title={lead.company_domain}>
                        <a
                          href={`https://${lead.company_domain.replace(/^https?:\/\//, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="wld-company-link"
                        >
                          <ExternalLink size={11} />
                        </a>
                      </Tooltip>
                    )}
                  </span>
                  <span className="wld-sub-sep">·</span>
                </>
              )}
              <span className="wld-leadid">{leadId}</span>
              {lead.client_mail && (
                <>
                  <span className="wld-sub-sep">·</span>
                  <a href={`mailto:${lead.client_mail}`} className="wld-email">{lead.client_mail}</a>
                </>
              )}
            </div>
            <div className="wld-meta">
              <span className="wld-meta-chip">
                <UserPlus size={11} />
                <span>Created by <strong>{creatorName}</strong></span>
              </span>
              <span className="wld-meta-chip">
                <Calendar size={11} />
                <span>{createdAtLabel}</span>
              </span>
            </div>
          </div>
          <button type="button" className="wld-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="wld-stats">
        <div className="wld-stat">
          <span className="wld-stat-label">Stage</span>
          <span
            className="wld-stat-stage"
            style={{
              color: statusColor,
              background: `${statusColor}1a`,
              border: `1px solid ${statusColor}33`,
            }}
          >
            <span className="wld-stat-dot" style={{ background: statusColor }} />
            {lead.status || "—"}
          </span>
        </div>
        <div className="wld-stat">
          <span className="wld-stat-label">Deal value</span>
          <span className="wld-stat-value">{parseDealValue(lead)}</span>
        </div>
        <div className="wld-stat">
          <span className="wld-stat-label">Next follow-up</span>
          <span className="wld-stat-value wld-stat-value-muted">{nextFollowUpLabel(lead)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="wld-tabs">
        {(["details", "timeline", "notes", "emails", "meetings"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`wld-tab${tab === t ? " is-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div className="wld-body">
        {tab === "details" && (
          <div className="wld-details">
            {/* Two-column contact + company grid */}
            <div className="wld-details-grid">
              {/* Left column — Contact */}
              <div className="wld-details-col">
                <div className="wld-details-section-head">
                  <div className="wld-details-section-icon" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                    <Mail size={12} strokeWidth={2.5} />
                  </div>
                  <span className="wld-details-section-title">Contact</span>
                </div>
                <dl className="wld-details-dl">
                  <div className="wld-details-row">
                    <dt><Mail size={12} />Email</dt>
                    <dd>
                      {lead.client_mail
                        ? <a href={`mailto:${lead.client_mail}`} className="wld-details-link">{lead.client_mail}</a>
                        : <span className="wld-details-empty">—</span>}
                    </dd>
                  </div>
                  <div className="wld-details-row">
                    <dt><Phone size={12} />Phone</dt>
                    <dd>
                      {lead.client_phone
                        ? <a href={`tel:${lead.client_phone}`} className="wld-details-link">{lead.client_phone}</a>
                        : <span className="wld-details-empty">—</span>}
                    </dd>
                  </div>
                  <div className="wld-details-row">
                    <dt><MapPin size={12} />Location</dt>
                    <dd>{lead.client_location || <span className="wld-details-empty">—</span>}</dd>
                  </div>
                </dl>
              </div>

              {/* Right column — Company */}
              <div className="wld-details-col">
                <div className="wld-details-section-head">
                  <div className="wld-details-section-icon" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                    <Building2 size={12} strokeWidth={2.5} />
                  </div>
                  <span className="wld-details-section-title">Company</span>
                </div>
                <dl className="wld-details-dl">
                  <div className="wld-details-row">
                    <dt><Building2 size={12} />Name</dt>
                    <dd>{lead.company || <span className="wld-details-empty">—</span>}</dd>
                  </div>
                  <div className="wld-details-row">
                    <dt><Globe size={12} />Domain</dt>
                    <dd>
                      {lead.company_domain
                        ? (
                          <a
                            href={`https://${lead.company_domain.replace(/^https?:\/\//, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="wld-details-link wld-details-link-ext"
                          >
                            {lead.company_domain}
                            <ExternalLink size={10} />
                          </a>
                        )
                        : <span className="wld-details-empty">—</span>}
                    </dd>
                  </div>
                  <div className="wld-details-row">
                    <dt><Users size={12} />Team size</dt>
                    <dd>{lead.company_size || <span className="wld-details-empty">—</span>}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Inquiry meta row */}
            <div className="wld-details-meta-row">
              <div className="wld-details-meta-item">
                <Tag size={11} />
                <span className="wld-details-meta-label">Subject</span>
                <span className="wld-details-meta-value">{lead.title || "—"}</span>
              </div>
              <div className="wld-details-meta-sep" />
              <div className="wld-details-meta-item">
                <Globe size={11} />
                <span className="wld-details-meta-label">Source</span>
                <span className="wld-details-meta-value">{lead.website_source || lead.platform || "—"}</span>
              </div>
            </div>

            {/* Message card */}
            {lead.inquiry_message ? (
              <div className="wld-details-msg-card">
                <div className="wld-details-msg-head">
                  <MessageSquare size={13} strokeWidth={2.2} />
                  <span>Inquiry message</span>
                </div>
                <p className="wld-details-msg-body">{lead.inquiry_message}</p>
              </div>
            ) : (
              <div className="wld-details-msg-empty">
                <MessageSquare size={20} strokeWidth={1.5} />
                <span>No inquiry message recorded</span>
              </div>
            )}
          </div>
        )}

        {tab === "timeline" && (
          tlLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}><Spin /></div>
          ) : timeline.length === 0 ? (
            <Empty description={<span style={{ color: "var(--text-slate-500)" }}>No activity yet</span>} />
          ) : (
            <ol className="wld-timeline">
              {timeline.map((item: any, idx: number) => {
                const meta = ACTION_META[item.action] || { label: item.action, icon: <Activity size={13} /> };
                const who = item.performedByUser?.name || item.performedByUser?.email || "System";
                return (
                  <li className="wld-tl-item" key={item.id || idx}>
                    <div className="wld-tl-icon" aria-hidden>{meta.icon}</div>
                    <div className="wld-tl-body">
                      <div className="wld-tl-head">
                        <span className="wld-tl-who">{who}</span>
                        <span className="wld-tl-when">{relativeShort(item.createdAt)}</span>
                      </div>
                      <div className="wld-tl-text">
                        {meta.label}
                        {item.metadata?.subject && ` · ${item.metadata.subject}`}
                        {item.metadata?.title && ` · ${item.metadata.title}`}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )
        )}

        {tab === "notes" && (
          <Empty description={<span style={{ color: "var(--text-slate-500)" }}>Inline notes are coming soon. Use the timeline for now.</span>} />
        )}
        {tab === "emails" && (
          mailsLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}><Spin /></div>
          ) : mails.length === 0 ? (
            <div className="wld-mails-empty">
              <Send size={22} strokeWidth={1.4} />
              <span>No emails sent yet</span>
            </div>
          ) : (
            <ol className="wld-mails-list">
              {mails.map((mail: any) => (
                <li key={mail.id} className="wld-mail-item">
                  <div className="wld-mail-header">
                    <span className="wld-mail-subject">{mail.subject || "(no subject)"}</span>
                    <span className="wld-mail-date">
                      {mail.sent_at ? dayjs(mail.sent_at).format("MMM D, YYYY · h:mm A") : "—"}
                    </span>
                  </div>
                  <div className="wld-mail-to">
                    <Mail size={11} />
                    <span>{mail.recipient_email || "—"}</span>
                  </div>
                  {mail.body && (
                    <div className="wld-mail-excerpt">
                      {mail.body.replace(/<[^>]*>?/gm, "").slice(0, 160)}
                      {mail.body.replace(/<[^>]*>?/gm, "").length > 160 ? "…" : ""}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )
        )}
        {tab === "meetings" && (
          <Empty description={<span style={{ color: "var(--text-slate-500)" }}>Meeting log coming soon.</span>} />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .wld-drawer .ant-drawer-content {
          background: var(--bg-secondary);
        }
        .wld-header {
          padding: 18px 22px 14px;
          border-bottom: 1px solid var(--border-slate-100);
          background: var(--bg-secondary);
        }
        .wld-header-top {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .wld-avatar {
          width: 44px; height: 44px;
          border-radius: 4px;
          background: #3b82f6;
          color: #fff;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.04em;
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .wld-id-block { flex: 1; min-width: 0; }
        .wld-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .wld-eyebrow strong { font-weight: 800; }
        .wld-eyebrow-icon { display: inline-flex; }
        .wld-id-line {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        }
        .wld-name {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.015em;
          line-height: 1.2;
        }
        .wld-id-sub {
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
          margin-top: 4px;
          font-size: 12px;
          color: var(--text-slate-500);
        }
        .wld-company {
          display: inline-flex; align-items: center; gap: 5px;
          color: var(--text-slate-700);
          font-weight: 600;
        }
        .wld-company-link {
          display: inline-flex;
          color: var(--text-slate-400);
        }
        .wld-company-link:hover { color: #3b82f6; }
        .wld-sub-sep { color: var(--text-slate-300); }
        .wld-leadid {
          font-variant-numeric: tabular-nums;
          font-weight: 600;
        }
        .wld-email {
          color: var(--text-slate-500);
          text-decoration: none;
        }
        .wld-email:hover { color: #3b82f6; }
        .wld-close {
          border: none;
          background: transparent;
          color: var(--text-slate-400);
          cursor: pointer;
          padding: 4px;
          margin: -4px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .wld-close:hover { color: var(--text-slate-700); background: var(--bg-slate-50); }

        .wld-meta {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .wld-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-slate-500);
        }
        .wld-meta-chip strong {
          color: var(--text-slate-800);
          font-weight: 700;
        }
        .wld-meta-chip svg { color: var(--text-slate-400); }

        .wld-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-bottom: 1px solid var(--border-slate-100);
        }
        .wld-stat {
          padding: 14px 22px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-right: 1px solid var(--border-slate-100);
        }
        .wld-stat:last-child { border-right: 0; }
        .wld-stat-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .wld-stat-value {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
          font-variant-numeric: tabular-nums;
        }
        .wld-stat-value-muted { color: var(--text-slate-400); font-weight: 700; }
        .wld-stat-stage {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          align-self: flex-start;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
        }
        .wld-stat-dot {
          width: 6px; height: 6px; border-radius: 50%;
        }

        .wld-tabs {
          display: flex;
          gap: 8px;
          padding: 0 22px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .wld-tab {
          border: none;
          background: transparent;
          padding: 12px 4px;
          margin: 0 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-500);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
        }
        .wld-tab:first-child { margin-left: 0; }
        .wld-tab:hover { color: var(--text-slate-700); }
        .wld-tab.is-active {
          color: var(--text-slate-900);
          border-bottom-color: var(--text-slate-900);
        }

        .wld-body {
          padding: 16px 22px 22px;
          min-height: 320px;
        }

        .wld-timeline {
          list-style: none;
          padding: 0; margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .wld-tl-item {
          display: flex;
          gap: 14px;
          padding: 12px 0;
          position: relative;
        }
        .wld-tl-item::before {
          content: '';
          position: absolute;
          left: 14px;
          top: 32px;
          bottom: -8px;
          width: 1px;
          background: var(--border-slate-100);
        }
        .wld-tl-item:last-child::before { display: none; }
        .wld-tl-icon {
          width: 28px; height: 28px;
          border-radius: 50%;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          color: var(--text-slate-500);
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }
        .wld-tl-body { flex: 1; min-width: 0; padding-top: 2px; }
        .wld-tl-head {
          display: flex; align-items: baseline; gap: 8px;
        }
        .wld-tl-who {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-slate-800);
        }
        .wld-tl-when {
          font-size: 11px;
          color: var(--text-slate-400);
          font-weight: 500;
        }
        .wld-tl-text {
          font-size: 12.5px;
          color: var(--text-slate-500);
          margin-top: 2px;
          line-height: 1.45;
        }

        /* ── Emails tab ── */
        .wld-mails-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 40px;
          color: var(--text-slate-300);
          font-size: 12.5px;
          font-weight: 500;
        }
        .wld-mails-list {
          list-style: none;
          padding: 0; margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .wld-mail-item {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          border-radius: 4px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .wld-mail-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        .wld-mail-subject {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-slate-900);
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .wld-mail-date {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-slate-400);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .wld-mail-to {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11.5px;
          color: var(--text-slate-500);
          font-weight: 500;
        }
        .wld-mail-to svg { color: var(--text-slate-400); }
        .wld-mail-excerpt {
          font-size: 12.5px;
          color: var(--text-slate-500);
          line-height: 1.5;
          border-top: 1px solid var(--border-slate-100);
          padding-top: 8px;
          margin-top: 2px;
        }

        /* ── Details tab ── */
        .wld-details {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .wld-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .wld-details-col {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          border-radius: 4px;
          padding: 14px 16px;
        }
        .wld-details-section-head {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .wld-details-section-icon {
          width: 22px; height: 22px;
          border-radius: 4px;
          display: inline-flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .wld-details-section-title {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--text-slate-500);
        }
        .wld-details-dl {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin: 0; padding: 0;
        }
        .wld-details-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .wld-details-row dt {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-slate-400);
        }
        .wld-details-row dt svg { flex-shrink: 0; }
        .wld-details-row dd {
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-slate-800);
          word-break: break-word;
          padding-left: 17px;
        }
        .wld-details-empty {
          color: var(--text-slate-300);
          font-weight: 500;
        }
        .wld-details-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 600;
        }
        .wld-details-link:hover { text-decoration: underline; }
        .wld-details-link-ext {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .wld-details-meta-row {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          border-radius: 4px;
          overflow: hidden;
        }
        .wld-details-meta-item {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 16px;
          min-width: 0;
        }
        .wld-details-meta-item svg { color: var(--text-slate-400); flex-shrink: 0; }
        .wld-details-meta-sep {
          width: 1px;
          align-self: stretch;
          background: var(--border-slate-100);
          flex-shrink: 0;
        }
        .wld-details-meta-label {
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-slate-400);
          white-space: nowrap;
        }
        .wld-details-meta-value {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-slate-800);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wld-details-msg-card {
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          border-radius: 4px;
          padding: 14px 16px;
        }
        .wld-details-msg-head {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-slate-500);
          margin-bottom: 10px;
        }
        .wld-details-msg-head svg { color: var(--text-slate-400); }
        .wld-details-msg-body {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--text-slate-700);
          white-space: pre-wrap;
          word-break: break-word;
        }
        .wld-details-msg-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 28px;
          border: 1px dashed var(--border-slate-100);
          border-radius: 4px;
          color: var(--text-slate-300);
          font-size: 12.5px;
          font-weight: 500;
        }
      `}} />
    </Drawer>
  );
};
