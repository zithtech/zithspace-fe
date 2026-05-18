"use client";

import React from "react";
import { Modal } from "antd";

/**
 * Shared premium-feel modal chrome reused by all six "create" dialogs on the
 * client detail page (Portal Access · Meetings · Change Requests · Approvals ·
 * Environments · Team).
 *
 * Design rules:
 *  - No shadows, no glassmorphism (per project memory). Use borders + subtle
 *    surface-tone shifts for elevation.
 *  - 3px accent ribbon at the very top of the modal as branding.
 *  - Large header zone with a 44×44 icon tile, heavier title, descriptive
 *    subtitle.
 *  - Body scrolls; footer is sticky so the primary action is always visible
 *    on long forms.
 *  - Each modal groups fields into `ModalSection` cards with their own
 *    uppercase header + 1-line description.
 */

type Tone = {
  bg: string;
  border: string;
  text: string;
};

export interface PremiumPalette {
  surfaceElevated: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  textFaint: string;
  overlay: string;
  /**
   * Fallback ribbon color when `ribbonColor` isn't passed explicitly.
   * Some module palettes only expose `accentText`/`accentBg`/`accentBorder` —
   * those callers always pass `ribbonColor`, so this can be omitted.
   */
  accent?: string;
}

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  c: PremiumPalette;
  /**
   * Top ribbon + icon tile color. Defaults to accent blue when omitted.
   * Each module passes its own signature color (purple for CR, etc).
   */
  ribbonColor?: string;
  iconTile?: { bg: string; border: string; text: string };
  icon: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  /**
   * Renders inside the scrollable body. Use `ModalSection` to group fields.
   */
  children: React.ReactNode;
  /**
   * Footer content. Receives the modal in its open state; usually a
   * Cancel + primary submit pair plus an optional tip.
   */
  footer: React.ReactNode;
  /**
   * Optional one-line tip rendered above the footer buttons in a muted
   * card. Helps reinforce the modal's intent without cluttering fields.
   */
  tip?: React.ReactNode;
}

export function PremiumModal({
  open,
  onClose,
  width = 640,
  c,
  ribbonColor,
  iconTile,
  icon,
  title,
  subtitle,
  children,
  footer,
  tip,
}: PremiumModalProps) {
  const ribbon = ribbonColor || c.accent || "#3b82f6";
  const tile = iconTile || {
    bg: "rgba(59,130,246,0.12)",
    border: "rgba(59,130,246,0.35)",
    text: ribbon,
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      width={width}
      closable={false}
      styles={{
        mask: { backgroundColor: c.overlay },
        content: {
          background: c.surfaceElevated,
          border: `1px solid ${c.border}`,
          padding: 0,
          overflow: "hidden",
        },
        body: { padding: 0 },
      }}
    >
      {/* Top accent ribbon */}
      <div
        style={{
          height: 3,
          background: ribbon,
        }}
      />

      {/* Header */}
      <div
        style={{
          padding: "22px 26px 18px",
          borderBottom: `1px solid ${c.border}`,
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: tile.bg,
            color: tile.text,
            border: `1px solid ${tile.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16.5,
              fontWeight: 600,
              color: c.text,
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                marginTop: 4,
                fontSize: 12.5,
                color: c.textSubtle,
                lineHeight: 1.55,
                maxWidth: 520,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          padding: 22,
          maxHeight: "calc(80vh - 220px)",
          overflowY: "auto",
        }}
      >
        {children}
      </div>

      {/* Sticky footer */}
      <div
        style={{
          borderTop: `1px solid ${c.border}`,
          background: c.surfaceElevated,
          padding: "14px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {tip && (
          <div
            style={{
              padding: "8px 12px",
              background: c.surfaceMuted,
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              fontSize: 11.5,
              color: c.textSubtle,
              lineHeight: 1.5,
            }}
          >
            {tip}
          </div>
        )}
        {footer}
      </div>
    </Modal>
  );
}

/* --------------------------------------------------------------- */

interface ModalSectionProps {
  c: PremiumPalette;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  /**
   * When true, renders without the surface-muted background — useful for
   * the primary first section to feel uncluttered.
   */
  plain?: boolean;
  /**
   * Optional right-aligned slot in the section header (e.g. a "+ add" button
   * for repeater sections).
   */
  right?: React.ReactNode;
  children: React.ReactNode;
}

export function ModalSection({
  c,
  title,
  description,
  icon,
  plain,
  right,
  children,
}: ModalSectionProps) {
  return (
    <div
      style={{
        marginBottom: 14,
        ...(plain
          ? {}
          : {
              padding: 14,
              background: c.surfaceMuted,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
            }),
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: description ? 4 : 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: c.textSubtle,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {icon}
            {title}
          </div>
          {description && (
            <div
              style={{
                marginTop: 3,
                fontSize: 12,
                color: c.textFaint,
                lineHeight: 1.5,
                marginBottom: 8,
              }}
            >
              {description}
            </div>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

/* --------------------------------------------------------------- */

/**
 * Standard footer pattern: Cancel (ghost) + primary submit button with
 * optional keyboard hint. Buttons are app's standard <Button>; this is just
 * the wrapper that ensures consistent positioning + a subtle ⌘↵ hint.
 */
export function ModalFooterActions({
  c,
  kbdHint,
  children,
}: {
  c: PremiumPalette;
  kbdHint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: c.textFaint,
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, monospace, "Liberation Mono"',
        }}
      >
        {kbdHint}
      </span>
      <div style={{ display: "flex", gap: 8 }}>{children}</div>
    </div>
  );
}

/**
 * Small floating-label hint shown inside a field's label slot — used when a
 * field is optional or has a secondary detail (e.g. "· optional").
 */
export function FieldLabel({
  c,
  children,
  hint,
}: {
  c: PremiumPalette;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <span style={{ fontSize: 12.5, color: c.textMuted, fontWeight: 500 }}>
      {children}
      {hint && (
        <span
          style={{
            marginLeft: 6,
            fontSize: 11.5,
            color: c.textFaint,
            fontWeight: 400,
          }}
        >
          · {hint}
        </span>
      )}
    </span>
  );
}
