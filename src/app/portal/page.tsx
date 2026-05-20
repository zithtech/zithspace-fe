"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Receipt,
  FileText,
  CalendarCheck,
  GitPullRequest,
  CheckSquare,
  LifeBuoy,
  Rocket,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X
} from "lucide-react";
import { Spin, Empty } from "antd";
import { useClientPortalAuth } from "@/context/ClientPortalAuthContext";

import { portalInvoiceService, PortalInvoiceListItem } from "@/services/portalInvoiceService";
import { portalSprintService, PortalSprintListItem } from "@/services/portalSprintService";
import { portalDocumentService, PortalDocument } from "@/services/portalDocumentService";
import { portalCrService, PortalCrListItem } from "@/services/portalCrService";
import { portalApprovalsService, PortalApprovalListItem } from "@/services/portalApprovalsService";
import { portalTicketService, PortalTicketListItem } from "@/services/portalTicketService";
import { portalReleaseService, PortalReleaseListItem } from "@/services/portalReleaseService";

const WidgetCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  href: string;
  children: React.ReactNode;
  loading: boolean;
  isEmpty: boolean;
}> = ({ title, icon, href, children, loading, isEmpty }) => (
  <div
    style={{
      background: "#ffffff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fafafa"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#0f172a" }}>
        {icon}
        {title}
      </div>
      <Link href={href} style={{ fontSize: 12, color: "#3b82f6", textDecoration: "none", fontWeight: 500 }}>
        View all &rarr;
      </Link>
    </div>
    <div style={{ flex: 1, padding: loading || isEmpty ? "32px 20px" : "0" }}>
      {loading ? (
        <div style={{ textAlign: "center" }}><Spin /></div>
      ) : isEmpty ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: "#94a3b8", fontSize: 13 }}>No recent {title.toLowerCase()}</span>} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      )}
    </div>
  </div>
);

const RowItem = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 20px",
      borderBottom: "1px solid #f1f5f9",
      textDecoration: "none",
      color: "inherit",
      transition: "background 120ms ease"
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
  >
    <div style={{ display: "flex", flex: 1, minWidth: 0, alignItems: "center", gap: 12 }}>
      {children}
    </div>
    <ChevronRight size={16} color="#cbd5e1" style={{ flexShrink: 0, marginLeft: 12 }} />
  </Link>
);

function InvoicesWidget() {
  const [data, setData] = useState<PortalInvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalInvoiceService.list({ limit: 5 }).then(res => setData(res.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="Invoices" icon={<Receipt size={16} color="#4338ca" />} href="/portal/invoices" loading={loading} isEmpty={data.length === 0}>
      {data.slice(0, 5).map((inv) => (
        <RowItem key={inv.id} href={`/portal/invoices/${inv.id}`}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{inv.invoiceNumber}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>${Number(inv.grandTotal || inv.subtotal).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: inv.isOverdue ? "#ef4444" : "#64748b", fontWeight: 500 }}>{inv.status}</div>
          </div>
        </RowItem>
      ))}
    </WidgetCard>
  );
}

function SprintsWidget() {
  const [data, setData] = useState<PortalSprintListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalSprintService.list({ limit: 5 }).then(res => setData(res.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="Sprint Progress" icon={<CalendarCheck size={16} color="#0d9488" />} href="/portal/sprints" loading={loading} isEmpty={data.length === 0}>
      {data.slice(0, 5).map((sprint) => (
        <RowItem key={sprint.id} href={`/portal/sprints/${sprint.id}`}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{sprint.version}</div>
            <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sprint.project?.name || "Project sprint"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{sprint.completionPercent}%</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>{sprint.status}</div>
          </div>
        </RowItem>
      ))}
    </WidgetCard>
  );
}

function DocumentsWidget() {
  const [data, setData] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalDocumentService.list({}).then(res => setData(res.data as PortalDocument[])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="Documents" icon={<FileText size={16} color="#b45309" />} href="/portal/documents" loading={loading} isEmpty={data.length === 0}>
      {data.slice(0, 5).map((doc) => (
        <RowItem key={doc.id} href={`/portal/documents`}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title || doc.fileName}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(doc.createdAt).toLocaleDateString()}</div>
          </div>
        </RowItem>
      ))}
    </WidgetCard>
  );
}

function ChangeRequestsWidget() {
  const [data, setData] = useState<PortalCrListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalCrService.list({ limit: 5 }).then(res => setData(res.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="Change Requests" icon={<GitPullRequest size={16} color="#7c2d12" />} href="/portal/change-requests" loading={loading} isEmpty={data.length === 0}>
      {data.slice(0, 5).map((cr) => (
        <RowItem key={cr.id} href={`/portal/change-requests/${cr.id}`}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cr.title}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{cr.crNumber}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#0f172a", padding: "2px 6px", background: "#f1f5f9", borderRadius: 4 }}>{cr.status}</div>
          </div>
        </RowItem>
      ))}
    </WidgetCard>
  );
}

function ApprovalsWidget() {
  const [data, setData] = useState<PortalApprovalListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalApprovalsService.list({ limit: 5 }).then(res => setData(res.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="Approvals" icon={<CheckSquare size={16} color="#1d4ed8" />} href="/portal/approvals" loading={loading} isEmpty={data.length === 0}>
      {data.slice(0, 5).map((app) => (
        <RowItem key={app.id} href={`/portal/approvals/${app.id}`}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{app.title}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(app.createdAt).toLocaleDateString()}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#0f172a", padding: "2px 6px", background: "#f1f5f9", borderRadius: 4 }}>{app.status}</div>
          </div>
        </RowItem>
      ))}
    </WidgetCard>
  );
}

function TicketsWidget() {
  const [data, setData] = useState<PortalTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalTicketService.list({ limit: 5 }).then(res => setData(res.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="Support Tickets" icon={<LifeBuoy size={16} color="#be123c" />} href="/portal/tickets" loading={loading} isEmpty={data.length === 0}>
      {data.slice(0, 5).map((ticket) => (
        <RowItem key={ticket.id} href={`/portal/tickets/${ticket.id}`}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ticket.subject}</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>{ticket.ticketNumber}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#0f172a", padding: "2px 6px", background: "#f1f5f9", borderRadius: 4 }}>{ticket.status}</div>
          </div>
        </RowItem>
      ))}
    </WidgetCard>
  );
}

function ReleasesWidget() {
  const [data, setData] = useState<PortalReleaseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portalReleaseService.list({ limit: 5 }).then(res => setData(res.data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  return (
    <WidgetCard title="Releases" icon={<Rocket size={16} color="#5b21b6" />} href="/portal/releases" loading={loading} isEmpty={data.length === 0}>
      {data.slice(0, 5).map((rel) => (
        <RowItem key={rel.id} href={`/portal/releases/${rel.id}`}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{rel.version}</div>
            <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rel.title}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{rel.releaseDate ? new Date(rel.releaseDate).toLocaleDateString() : "TBD"}</div>
          </div>
        </RowItem>
      ))}
    </WidgetCard>
  );
}

export default function PortalDashboardPage() {
  const { user } = useClientPortalAuth();

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ padding: "40px 48px 32px", maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            background: "#f4f5fa",
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#ede9fe",
                color: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Layers size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#1e293b",
                  marginBottom: 2,
                  letterSpacing: "-0.01em",
                }}
              >
                {user?.client?.companyName || "Your Workspace"}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                Welcome back, {user?.displayName || user?.username || "Guest"}!
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Masonry-style Grid Dashboard */}
      <div style={{ padding: "0 48px 48px", maxWidth: 1400, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 24,
            alignItems: "start"
          }}
        >
          <InvoicesWidget />
          <SprintsWidget />
          <ChangeRequestsWidget />
          <ApprovalsWidget />
          <TicketsWidget />
          <DocumentsWidget />
          <ReleasesWidget />
        </div>
      </div>
      <style jsx global>{`
        /* Empty state SVG path overrides to remove harsh black colors */
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
  );
}
