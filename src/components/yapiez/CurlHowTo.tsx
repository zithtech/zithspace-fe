"use client";

/**
 * "Where do I get a cURL command?" — the three clicks, drawn.
 *
 * Built from styled elements rather than an image or SVG: it is a mock of a
 * browser menu, so real text in real theme colours reads correctly at any zoom
 * and in dark mode, which a screenshot would not.
 *
 * Collapsed by default. Anyone who already knows this should never see it.
 */

import React, { useState } from "react";
import { Typography } from "antd";
import { ChevronDown, ChevronRight, MousePointerClick, Check } from "lucide-react";

const { Text } = Typography;

/** One line of a mocked browser context menu. */
function MenuItem({
  label,
  submenu,
  highlighted,
  dimmed,
}: {
  label: string;
  submenu?: boolean;
  highlighted?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "3px 9px",
        fontSize: 10.5,
        borderRadius: 3,
        whiteSpace: "nowrap",
        background: highlighted ? "#2563eb" : "transparent",
        color: highlighted ? "#ffffff" : dimmed ? "var(--text-secondary)" : "var(--text-primary)",
        fontWeight: highlighted ? 600 : 400,
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {submenu && <ChevronRight size={10} style={{ opacity: 0.65, flexShrink: 0 }} />}
      {highlighted && <Check size={10} style={{ flexShrink: 0 }} />}
    </div>
  );
}

function MenuPanel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 4,
        borderRadius: 6,
        minWidth: 132,
        background: "var(--card-bg, #ffffff)",
        border: "1px solid var(--border-color, #e2e8f0)",
        boxShadow: "0 4px 14px rgba(15, 23, 42, 0.10)",
      }}
    >
      {children}
    </div>
  );
}

function Step({ n, title, detail }: { n: number; title: string; detail: string }) {
  return (
    <div style={{ display: "flex", gap: 8, flex: "1 1 150px", minWidth: 0 }}>
      <span
        style={{
          width: 17,
          height: 17,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          fontSize: 9.5,
          fontWeight: 800,
          color: "#1d4ed8",
          background: "rgba(59,130,246,0.12)",
          marginTop: 1,
        }}
      >
        {n}
      </span>
      <span style={{ minWidth: 0 }}>
        <Text style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", display: "block" }}>
          {title}
        </Text>
        <Text style={{ fontSize: 10.5, color: "var(--text-secondary)", display: "block", lineHeight: 1.5 }}>
          {detail}
        </Text>
      </span>
    </div>
  );
}

export function CurlHowTo() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: 0,
          border: "none",
          background: "transparent",
          color: "#1d4ed8",
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Where do I get one?
      </button>

      {open && (
        <div
          style={{
            marginTop: 9,
            padding: "13px 14px",
            borderRadius: 9,
            background: "var(--input-bg, #f8fafc)",
            border: "1px solid var(--border-color, #e2e8f0)",
            display: "flex",
            flexDirection: "column",
            gap: 13,
          }}
        >
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Step n={1} title="Open DevTools" detail="F12, or ⌘⌥I on a Mac. Go to the Network tab." />
            <Step n={2} title="Trigger the request" detail="Use the page so the call appears in the list." />
            <Step n={3} title="Right-click it" detail="Copy → Copy as cURL, then paste it above." />
          </div>

          {/* The two menus, side by side, with the target highlighted. */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
            <MenuPanel>
              <MenuItem label="Open in new tab" dimmed />
              <MenuItem label="Clear browser cache" dimmed />
              <div style={{ height: 1, background: "var(--border-color, #e2e8f0)", margin: "3px 5px" }} />
              <MenuItem label="Copy" submenu />
              <MenuItem label="Save all as HAR" dimmed />
            </MenuPanel>

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                color: "#94a3b8",
                marginTop: 44,
                flexShrink: 0,
              }}
            >
              <MousePointerClick size={13} />
            </span>

            <MenuPanel>
              <MenuItem label="Copy request headers" dimmed />
              <MenuItem label="Copy response" dimmed />
              <MenuItem label="Copy as fetch" dimmed />
              <MenuItem label="Copy as cURL" highlighted />
            </MenuPanel>
          </div>

          <Text style={{ fontSize: 10.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            On Windows the menu offers <strong>Copy as cURL (bash)</strong> and <strong>(cmd)</strong> — either
            works. Note that this copies the <strong>request only</strong>; to fill the expected result as well,
            run the command in a terminal with <code>-i</code> and paste the whole session.
          </Text>
        </div>
      )}
    </div>
  );
}
