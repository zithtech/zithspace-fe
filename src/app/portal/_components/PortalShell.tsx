"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Receipt,
  FileText,
  CalendarCheck,
  GitPullRequest,
  CheckSquare,
  Flag,
  LifeBuoy,
  Rocket,
  Server,
  Users,
  ClipboardList,
  ChevronDown,
  LogOut,
  KeyRound,
  LucideIcon,
} from "lucide-react";
import { Dropdown, Spin } from "antd";
import { useClientPortalAuth } from "@/context/ClientPortalAuthContext";
import ChangePasswordModal from "./ChangePasswordModal";

const NAV: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: "/portal", label: "Home", icon: Home },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/mom", label: "Meetings", icon: ClipboardList },
  { href: "/portal/documents", label: "Documents", icon: FileText },
  { href: "/portal/sprints", label: "Sprints", icon: CalendarCheck },
  { href: "/portal/milestones", label: "Milestones", icon: Flag },
  { href: "/portal/change-requests", label: "Change Requests", icon: GitPullRequest },
  { href: "/portal/approvals", label: "Approvals", icon: CheckSquare },
  { href: "/portal/tickets", label: "Support", icon: LifeBuoy },
  { href: "/portal/releases", label: "Releases", icon: Rocket },
  { href: "/portal/environments", label: "Environments", icon: Server },
  { href: "/portal/team", label: "Team", icon: Users },
];

export default function PortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useClientPortalAuth();
  const [changePwOpen, setChangePwOpen] = useState(false);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafafa",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  if (!user) return null;

  const initials = (user.displayName || user.username || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", display: "flex" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 248,
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Brand */}
        <div
          style={{
            padding: "18px 18px 16px",
            borderBottom: "1px solid #f1f5f9",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#0f172a",
                color: "#f8fafc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                fontFamily:
                  'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              Z
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                }}
              >
                Zukvo
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: "#64748b",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                Client Portal
              </div>
            </div>
          </div>
          {user.client?.companyName && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 10px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "#0f172a",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={user.client.companyName}
            >
              {user.client.companyName}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: 12,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/portal" ? pathname === "/portal" : pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: active ? "#111827" : "#475569",
                  background: active ? "#f1f5f9" : "transparent",
                  border: active
                    ? "1px solid #e2e8f0"
                    : "1px solid transparent",
                  textDecoration: "none",
                  transition: "background 120ms ease",
                }}
              >
                <Icon size={16} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User block */}
        <div
          style={{
            padding: 12,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <Dropdown
            placement="topLeft"
            menu={{
              items: [
                {
                  key: "change-password",
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <KeyRound size={14} /> Change password
                    </span>
                  ),
                  onClick: () => setChangePwOpen(true),
                },
                { type: "divider" },
                {
                  key: "logout",
                  label: (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <LogOut size={14} /> Sign out
                    </span>
                  ),
                  onClick: logout,
                },
              ],
            }}
          >
            <button
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: "#eef2ff",
                  color: "#3730a3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #e0e7ff",
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.displayName || user.username}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "#6b7280",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </div>
              </div>
              <ChevronDown size={14} color="#94a3b8" />
            </button>
          </Dropdown>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, minWidth: 0 }}>{children}</main>

      <ChangePasswordModal
        open={changePwOpen}
        onClose={() => setChangePwOpen(false)}
      />
    </div>
  );
}
