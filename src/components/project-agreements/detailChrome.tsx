'use client';

/**
 * The details column in a detail drawer.
 *
 * A record is not a flat list of fields. Reading a contract you ask three
 * separate questions — who is it with, when does it run, what is it worth —
 * and a single undifferentiated stack of label/value pairs makes you scan all
 * of it to answer any one of them. These group it, lead with the two things
 * that decide whether you keep reading, and drop a row that has nothing to
 * say rather than printing an em-dash nobody needed.
 */

import React from 'react';

/** A titled group of rows. Renders nothing when every row inside is empty. */
export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // An all-empty section would otherwise leave a heading over nothing.
  const hasContent = React.Children.toArray(children).some(Boolean);
  if (!hasContent) return null;
  return (
    <section className="pa-dt-section">
      <div className="pa-dt-section-title">{title}</div>
      <div className="pa-dt-rows">{children}</div>
    </section>
  );
}

/**
 * One fact.
 *
 * Returns null when there is no value: an empty row in a reading surface is
 * noise, and the reader learns nothing from "Expires —" that they would not
 * learn from the row simply not being there.
 */
export function DetailRow({
  icon,
  label,
  value,
  sub,
  mono,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
  sub?: string | null;
  /** For machine names — codes, references. */
  mono?: boolean;
}) {
  if (!value || !String(value).trim()) return null;
  return (
    <div className="pa-dt-row">
      {icon && <span className="pa-dt-icon">{icon}</span>}
      <span className="pa-dt-label">{label}</span>
      <span className={`pa-dt-value ${mono ? 'is-mono' : ''}`}>
        {value}
        {sub ? <span className="pa-dt-sub">{sub}</span> : null}
      </span>
    </div>
  );
}

/**
 * The headline block at the top of the column.
 *
 * One number and one sentence, given room. On an agreement that is the
 * contract value and the same figure in words — the pair a reader checks
 * against each other before anything else on the page.
 */
export function DetailHero({
  eyebrow,
  value,
  caption,
  tint = '#3b82f6',
}: {
  eyebrow: string;
  value?: string | null;
  caption?: string | null;
  tint?: string;
}) {
  if (!value || !String(value).trim()) return null;
  return (
    <div className="pa-dt-hero" style={{ ['--hero' as any]: tint }}>
      <div className="pa-dt-hero-eyebrow">{eyebrow}</div>
      <div className="pa-dt-hero-value">{value}</div>
      {caption && <div className="pa-dt-hero-caption">{caption}</div>}
    </div>
  );
}

/** Free text that needs its line breaks kept — internal notes, a description. */
export function DetailNote({
  title,
  text,
}: {
  title: string;
  text?: string | null;
}) {
  if (!text || !text.trim()) return null;
  return (
    <section className="pa-dt-section">
      <div className="pa-dt-section-title">{title}</div>
      <p className="pa-dt-note">{text}</p>
    </section>
  );
}
