"use client";

import React from "react";
import {
  Receipt,
  FileText,
  CalendarCheck,
  GitPullRequest,
  CheckSquare,
  LifeBuoy,
  Rocket,
  LucideIcon,
} from "lucide-react";
import { useClientPortalAuth } from "@/context/ClientPortalAuthContext";

const QUICK_CARDS: {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  accent: string;
}[] = [
  {
    title: "Invoices",
    description: "Review payment status, download PDFs, upload payment proof.",
    icon: Receipt,
    href: "/portal/invoices",
    accent: "#4338ca",
  },
  {
    title: "Sprint progress",
    description: "Planned vs delivered, burndown, demo links and staging URLs.",
    icon: CalendarCheck,
    href: "/portal/sprints",
    accent: "#0d9488",
  },
  {
    title: "Documents",
    description: "Agreements, SOWs, architecture docs, release notes.",
    icon: FileText,
    href: "/portal/documents",
    accent: "#b45309",
  },
  {
    title: "Change requests",
    description: "Submit and track scope changes with impact and estimates.",
    icon: GitPullRequest,
    href: "/portal/change-requests",
    accent: "#7c2d12",
  },
  {
    title: "Approvals",
    description: "Sign off on designs, UAT, releases, and CRs.",
    icon: CheckSquare,
    href: "/portal/approvals",
    accent: "#1d4ed8",
  },
  {
    title: "Support tickets",
    description: "Raise issues, track SLAs, monitor resolution timelines.",
    icon: LifeBuoy,
    href: "/portal/tickets",
    accent: "#be123c",
  },
  {
    title: "Releases",
    description: "Deployment history, what changed, downtime notices.",
    icon: Rocket,
    href: "/portal/releases",
    accent: "#5b21b6",
  },
];

export default function PortalHomePage() {
  const { user } = useClientPortalAuth();

  return (
    <div style={{ padding: "40px 48px", maxWidth: 1200 }}>
      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 8,
          }}
        >
          Zukvo · Welcome back
        </div>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 600,
            color: "#0f172a",
            margin: 0,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          {user?.displayName || user?.username}
        </h1>
        <div style={{ marginTop: 6, color: "#475569", fontSize: 14 }}>
          {user?.client?.companyName
            ? `Workspace · ${user.client.companyName}`
            : "Your client workspace"}
        </div>
      </div>

      {/* Quick access grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {QUICK_CARDS.map(({ title, description, icon: Icon, href, accent }) => (
          <a
            key={href}
            href={href}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              padding: 18,
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 120ms ease, transform 120ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e5e7eb";
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: `${accent}14`,
                color: accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${accent}33`,
              }}
            >
              <Icon size={18} />
            </div>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 600,
                color: "#0f172a",
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              {description}
            </div>
          </a>
        ))}
      </div>

      {/* Phase note — visible only because Phase 2/3 modules aren't built yet */}
      <div
        style={{
          marginTop: 36,
          padding: 16,
          background: "#ffffff",
          border: "1px dashed #cbd5e1",
          borderRadius: 10,
          color: "#475569",
          fontSize: 13,
          lineHeight: 1.55,
        }}
      >
        Module pages are coming online over the next two releases. Auth and the
        client workspace shell are live in this phase.
      </div>
    </div>
  );
}
