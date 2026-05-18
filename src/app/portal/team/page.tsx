"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Empty, Spin, Input } from "antd";
import {
  Users,
  Mail,
  Phone,
  Crown,
  Search,
  Briefcase,
} from "lucide-react";
import {
  portalTeamService,
  PortalTeamMember,
} from "@/services/portalTeamService";

const p = {
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
  success: "#059669",
  successBg: "#ecfdf5",
  successBorder: "#a7f3d0",
  successText: "#047857",
  warning: "#d97706",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e",
  danger: "#dc2626",
  dangerBg: "#fef2f2",
  dangerBorder: "#fecaca",
  dangerText: "#b91c1c",
  purpleBg: "#f5f3ff",
  purpleBorder: "#ddd6fe",
  purpleText: "#6d28d9",
  pinkBg: "#fdf2f8",
  pinkBorder: "#fbcfe8",
  pinkText: "#be185d",
  neutralBg: "#f1f5f9",
  neutralBorder: "#e2e8f0",
  neutralText: "#475569",
};

const TONE = {
  accent: { bg: p.accentBg, border: p.accentBorder, text: p.accentText },
  success: { bg: p.successBg, border: p.successBorder, text: p.successText },
  warning: { bg: p.warningBg, border: p.warningBorder, text: p.warningText },
  danger: { bg: p.dangerBg, border: p.dangerBorder, text: p.dangerText },
  purple: { bg: p.purpleBg, border: p.purpleBorder, text: p.purpleText },
  pink: { bg: p.pinkBg, border: p.pinkBorder, text: p.pinkText },
  neutral: { bg: p.neutralBg, border: p.neutralBorder, text: p.neutralText },
};

const DISCIPLINE_META: Record<
  string,
  { label: string; tone: keyof typeof TONE }
> = {
  engineering: { label: "Engineering", tone: "accent" },
  design: { label: "Design", tone: "pink" },
  qa: { label: "QA", tone: "purple" },
  pm: { label: "PM", tone: "warning" },
  account: { label: "Account", tone: "success" },
  devops: { label: "DevOps", tone: "accent" },
  data: { label: "Data", tone: "purple" },
  support: { label: "Support", tone: "accent" },
  other: { label: "Other", tone: "neutral" },
};

const AVAILABILITY_META: Record<
  string,
  { label: string; dot: string; text: string }
> = {
  available: { label: "Available", dot: "#10b981", text: p.successText },
  limited: { label: "Limited capacity", dot: "#f59e0b", text: p.warningText },
  away: { label: "Away", dot: "#94a3b8", text: p.textSubtle },
  unavailable: { label: "Unavailable", dot: "#ef4444", text: p.dangerText },
};

function initials(name: string): string {
  return (name || "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/* --------------------------------------------------------------- */

export default function PortalTeamPage() {
  const [items, setItems] = useState<PortalTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await portalTeamService.list();
        if (!cancel) setItems(data || []);
      } catch {
        if (!cancel) setItems([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.roleLabel.toLowerCase().includes(q) ||
        (m.contactEmail || "").toLowerCase().includes(q) ||
        (m.discipline || "").toLowerCase().includes(q),
    );
  }, [items, search]);

  const primaries = filtered.filter((m) => m.isPrimaryContact);
  const others = filtered.filter((m) => !m.isPrimaryContact);

  return (
    <div style={{ padding: "32px 40px 56px", maxWidth: 1180 }}>
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: p.textSubtle,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 6,
          }}
        >
          Zukvo · People
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: p.text,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          Your team
        </h1>
        <div style={{ marginTop: 6, fontSize: 13.5, color: p.textMuted }}>
          The people working on your account — who to contact for what, and
          when they&apos;re available.
        </div>
      </div>

      {/* Search bar (only when there's data) */}
      {items.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Input
            allowClear
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<Search size={14} color={p.textFaint} />}
            placeholder="Search name, role, email…"
            style={{ width: 300 }}
          />
        </div>
      )}

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
      ) : items.length === 0 ? (
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
                No team members published yet. Your account manager will add
                them soon.
              </span>
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            background: p.surfaceElevated,
            border: `1px dashed ${p.border}`,
            borderRadius: 12,
            color: p.textSubtle,
            fontSize: 13,
          }}
        >
          No team members match &ldquo;{search}&rdquo;.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {primaries.length > 0 && (
            <Section title="Primary contacts" subtitle="Your go-to people">
              <Grid>
                {primaries.map((m) => (
                  <TeamCard key={m.id} m={m} primary />
                ))}
              </Grid>
            </Section>
          )}
          {others.length > 0 && (
            <Section
              title={
                primaries.length > 0 ? "Wider team" : `${others.length} team members`
              }
            >
              <Grid>
                {others.map((m) => (
                  <TeamCard key={m.id} m={m} />
                ))}
              </Grid>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 600,
            color: p.text,
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <span style={{ fontSize: 12, color: p.textSubtle }}>{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

function TeamCard({
  m,
  primary,
}: {
  m: PortalTeamMember;
  primary?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const disc = m.discipline ? DISCIPLINE_META[m.discipline] : null;
  const avail = AVAILABILITY_META[m.availabilityStatus] || AVAILABILITY_META.available;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: p.surfaceElevated,
        border: `1px solid ${
          primary ? p.warningBorder : hover ? p.borderStrong : p.border
        }`,
        borderRadius: 14,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "border-color 120ms ease",
      }}
    >
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Avatar m={m} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: p.text,
                lineHeight: 1.25,
                letterSpacing: "-0.005em",
              }}
            >
              {m.displayName}
            </div>
            {primary && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  padding: "1px 7px",
                  background: p.warningBg,
                  border: `1px solid ${p.warningBorder}`,
                  color: p.warningText,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 600,
                }}
              >
                <Crown size={10} />
                Primary
              </span>
            )}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 12.5,
              color: p.textMuted,
              lineHeight: 1.4,
            }}
          >
            {m.roleLabel}
          </div>
          {disc && (
            <div style={{ marginTop: 6 }}>
              <span
                style={{
                  padding: "1px 8px",
                  background: TONE[disc.tone].bg,
                  border: `1px solid ${TONE[disc.tone].border}`,
                  color: TONE[disc.tone].text,
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {disc.label}
              </span>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          fontSize: 12.5,
          color: p.textMuted,
        }}
      >
        {m.contactEmail && (
          <a
            href={`mailto:${m.contactEmail}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.accentText,
              textDecoration: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <Mail size={11} color={p.textSubtle} />
            {m.contactEmail}
          </a>
        )}
        {m.contactPhone && (
          <a
            href={`tel:${m.contactPhone}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: p.accentText,
              textDecoration: "none",
            }}
          >
            <Phone size={11} color={p.textSubtle} />
            {m.contactPhone}
          </a>
        )}
        {m.projectName && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Briefcase size={11} color={p.textSubtle} />
            <span>{m.projectName}</span>
          </div>
        )}
      </div>

      {m.bio && (
        <div
          style={{
            fontSize: 12.5,
            color: p.textSubtle,
            lineHeight: 1.55,
            padding: "10px 12px",
            background: p.surfaceMuted,
            border: `1px solid ${p.border}`,
            borderRadius: 8,
          }}
        >
          {m.bio}
        </div>
      )}

      <div
        style={{
          marginTop: "auto",
          paddingTop: 10,
          borderTop: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: avail.dot,
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: 11.5,
            color: avail.text,
            fontWeight: 500,
          }}
        >
          {avail.label}
        </span>
        {m.availabilityNote && (
          <span style={{ fontSize: 11.5, color: p.textFaint }}>
            · {m.availabilityNote}
          </span>
        )}
      </div>
    </div>
  );
}

function Avatar({ m }: { m: PortalTeamMember }) {
  const size = 46;
  if (m.avatarUrl) {
    return (
      <img
        src={m.avatarUrl}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: size / 4,
          objectFit: "cover",
          border: `1px solid ${p.border}`,
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: p.accentBg,
        border: `1px solid ${p.accentBorder}`,
        color: p.accentText,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials(m.displayName)}
    </div>
  );
}
