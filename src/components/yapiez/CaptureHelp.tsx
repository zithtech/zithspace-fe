"use client";

/**
 * "How capturing a response works" — the in-product explanation behind the
 * info icon on the Capture panel.
 *
 * The diagram is inline SVG rather than an image so it stays crisp, themes
 * with the rest of the app, and can be edited as code. Box fills are a hex
 * tint at low opacity over the page background, which reads correctly in both
 * light and dark without a second palette.
 */

import React from "react";
import { Modal, Typography } from "antd";
import { Info, History, ClipboardPaste, Sparkles, ShieldAlert, AlertCircle } from "lucide-react";

const { Text } = Typography;

const BLUE = "#3b82f6";
const GREEN = "#10b981";
const ASH = "#64748b";
const RED = "#ef4444";

/** The info affordance itself — a quiet icon button, not a competing action. */
export function CaptureHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="How capturing a response works"
      title="How does this work?"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 20,
        height: 20,
        padding: 0,
        borderRadius: 999,
        border: "none",
        background: "transparent",
        color: BLUE,
        cursor: "pointer",
        flexShrink: 0,
      }}
    >
      <Info size={14} />
    </button>
  );
}

// ─── Diagram primitives ─────────────────────────────────────────────────────

function Box({
  x,
  y,
  w,
  h,
  tint,
  dashed,
  title,
  sub,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  tint: string;
  dashed?: boolean;
  title: string;
  sub?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill={tint}
        fillOpacity={0.1}
        stroke={tint}
        strokeOpacity={0.45}
        strokeWidth={1.25}
        strokeDasharray={dashed ? "5 4" : undefined}
      />
      <text
        x={x + w / 2}
        y={sub ? y + h / 2 - 4 : y + h / 2 + 4}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="var(--text-primary, #1E293B)"
      >
        {title}
      </text>
      {sub && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 13}
          textAnchor="middle"
          fontSize={10.5}
          fill="var(--text-secondary, #64748b)"
        >
          {sub}
        </text>
      )}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  dashed,
  color = ASH,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
  color?: string;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeOpacity={0.55}
      strokeWidth={1.5}
      strokeDasharray={dashed ? "5 4" : undefined}
      markerEnd={`url(#yz-arrow-${dashed ? "dashed" : "solid"})`}
    />
  );
}

function Caption({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={10} fill="var(--text-secondary, #64748b)">
      {children}
    </text>
  );
}

/**
 * The pipeline, drawn once.
 *
 * Top row is the send path; the bottom fan-out is what a capture actually
 * fills in. The dashed entries are the two optional routes — a login step, and
 * the paste fallback for an API the server cannot reach.
 */
export function CaptureDiagram() {
  const OUT = [
    { label: "Expected status", sub: "201" },
    { label: "Sample response", sub: "pretty-printed" },
    { label: "Assertions", sub: "generated" },
    { label: "Response schema", sub: "inferred" },
  ];

  return (
    <svg
      viewBox="0 0 720 316"
      width="100%"
      role="img"
      aria-label="Four routes fill the expected result: reusing a response from a previous run, pasting a response, generating one offline from the payload, or sending a live request. The first three cost nothing; only sending touches the API, and it creates, updates or deletes data on every click. All four routes fill the expected status, sample response, assertions and response schema."
      style={{ display: "block", maxWidth: "100%" }}
    >
      <defs>
        <marker id="yz-arrow-solid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={ASH} fillOpacity={0.55} />
        </marker>
        <marker id="yz-arrow-dashed" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={ASH} fillOpacity={0.45} />
        </marker>
      </defs>

      {/* ── Four routes in, only one of which touches the API ── */}
      <text x={16} y={18} fontSize={10.5} fontWeight={700} fill="var(--text-secondary, #64748b)">
        FOUR WAYS TO GET IT — THREE COST NOTHING
      </text>

      <Box x={16} y={28} w={158} h={44} tint={GREEN} title="From a previous run" sub="already happened" />
      <Box x={16} y={80} w={158} h={44} tint={GREEN} title="Paste a response" sub="you already have it" />
      <Box x={16} y={132} w={158} h={44} tint={GREEN} title="Generate from payload" sub="offline guess" />
      <Box x={16} y={190} w={158} h={44} tint={RED} title="Send it live" sub="a real request" />

      {/* The three safe routes converge; the live one is drawn apart. */}
      <path
        d="M 176 50 L 210 50 L 210 124 M 176 102 L 210 102 M 176 154 L 210 154 L 210 124 M 210 124 L 244 124"
        stroke={GREEN}
        strokeOpacity={0.5}
        strokeWidth={1.5}
        fill="none"
        markerEnd="url(#yz-arrow-solid)"
      />
      <Arrow x1={176} y1={212} x2={244} y2={212} color={RED} />

      <Box x={246} y={100} w={150} h={46} tint={GREEN} title="Capture" />
      <Box x={246} y={190} w={150} h={44} tint={RED} title="Yapiez engine" sub="creates / updates / deletes" />
      <Arrow x1={321} y1={188} x2={321} y2={150} color={RED} />
      <Caption x={321} y={262}>every click fires it again</Caption>

      {/* ── Fan-out to the four fields it fills ── */}
      <Arrow x1={398} y1={123} x2={430} y2={123} color={GREEN} />
      <path
        d={`M 432 123 L 452 123 M 452 44 L 452 202`}
        stroke={GREEN}
        strokeOpacity={0.45}
        strokeWidth={1.5}
        fill="none"
      />
      {OUT.map((item, index) => (
        <g key={item.label}>
          <Arrow x1={452} y1={44 + index * 53} x2={484} y2={44 + index * 53} color={GREEN} />
          <Box x={486} y={22 + index * 53} w={218} h={44} tint={GREEN} title={item.label} sub={item.sub} />
        </g>
      ))}

      <text x={360} y={300} textAnchor="middle" fontSize={10.5} fill="var(--text-secondary, #64748b)">
        All four fields are filled in one step, whichever route you take.
      </text>
    </svg>
  );
}

// ─── Point cards ────────────────────────────────────────────────────────────

const POINTS: Array<{ icon: any; tint: string; title: string; body: string }> = [
  {
    icon: History,
    tint: GREEN,
    title: "From a previous run",
    body:
      "If this API has ever run inside a flow, its genuine response is already recorded. Reusing it sends nothing — the request happened once, during a run that was going to happen anyway. The best route for a create or a delete.",
  },
  {
    icon: ClipboardPaste,
    tint: GREEN,
    title: "Paste a response — or a whole cURL session",
    body:
      "A bare JSON body, a raw HTTP response with its status line, or the entire terminal session: curl -i, curl -v and curl -w all print the response, and the import reads the status, payload, size and timing straight out of it.",
  },
  {
    icon: Sparkles,
    tint: GREEN,
    title: "Generate from payload",
    body:
      "Derived offline from the request itself — a create usually echoes back what it was given plus an id. It is a guess, and the point is that you correct a structure instead of typing one into an empty box.",
  },
  {
    icon: ShieldAlert,
    tint: RED,
    title: "Send it live",
    body:
      "A real request. For GET that is harmless and repeatable. For POST, PUT, PATCH and DELETE it changes real data and does so again on every click — two sends of a create make two records — so it is switched off until you explicitly allow it.",
  },
];

export function CaptureHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Info size={16} style={{ color: BLUE }} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>How capturing a response works</span>
        </span>
      }
      destroyOnHidden
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 4 }}>
        <Text style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65 }}>
          The expected status, sample response, assertions and schema are filled in one step. Three of the four
          routes cost nothing at all; only <strong>Send</strong> touches the API — and for a create, update or
          delete it really does change data, every time you click it.
        </Text>

        <div
          style={{
            padding: "14px 10px 6px",
            borderRadius: 10,
            background: "var(--input-bg, #f8fafc)",
            border: "1px solid var(--border-color, #e2e8f0)",
            overflowX: "auto",
          }}
        >
          <CaptureDiagram />
        </div>

        <div>
          <Text style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", display: "block", marginBottom: 10 }}>
            The four routes
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {POINTS.map((point) => (
              <div
                key={point.title}
                style={{
                  padding: 13,
                  borderRadius: 9,
                  background: "var(--card-bg, #ffffff)",
                  border: "1px solid var(--border-color, #e2e8f0)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 7,
                    background: `${point.tint}1a`,
                    color: point.tint,
                  }}
                >
                  <point.icon size={14} />
                </span>
                <Text style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>{point.title}</Text>
                <Text style={{ fontSize: 11.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{point.body}</Text>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 11,
            padding: 13,
            borderRadius: 9,
            background: "#fef2f2",
            border: "1px solid #fecaca",
          }}
        >
          <span style={{ color: "#b91c1c", flexShrink: 0, marginTop: 1 }}>
            <ShieldAlert size={15} />
          </span>
          <div>
            <Text style={{ fontSize: 12.5, fontWeight: 700, color: "#7f1d1d", display: "block" }}>
              Send is not repeatable for write methods
            </Text>
            <Text style={{ fontSize: 11.5, color: "#991b1b", lineHeight: 1.6 }}>
              There is no dry run. Two sends of <code>POST /api/users</code> create two users; a{" "}
              <code>DELETE</code> really deletes. Nothing in Yapiez can undo it, which is why write methods stay
              disabled behind an explicit switch and the three routes above exist. If you have already run the
              command in a terminal, paste the whole session instead — the response is right there.
            </Text>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 11,
            padding: 13,
            borderRadius: 9,
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <span style={{ color: "#1d4ed8", flexShrink: 0, marginTop: 1 }}>
            <AlertCircle size={15} />
          </span>
          <Text style={{ fontSize: 11.5, color: "#1e40af", lineHeight: 1.6 }}>
            A 4xx or 5xx is shown as a normal outcome, not an error. Capturing the expected 404 of a
            &quot;not found&quot; case is a legitimate thing to want, so nothing stops you doing it.
          </Text>
        </div>
      </div>
    </Modal>
  );
}
