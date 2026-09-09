"use client";

/**
 * A collection's icon, resolved from the name stored on the row.
 *
 * `icon` is a plain string in the database, so an unknown or missing value has
 * to land somewhere sensible rather than crash the shelf. The allow-list is
 * also what the form offers, so the two cannot drift into a collection wearing
 * an icon the picker cannot set.
 */

import React from "react";
import {
  BookOpen,
  Boxes,
  Building2,
  Compass,
  Globe,
  GraduationCap,
  HeartPulse,
  Landmark,
  Layers,
  Plug2,
  Rocket,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Users,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<any>> = {
  Landmark,
  ShoppingCart,
  GraduationCap,
  HeartPulse,
  Users,
  Building2,
  Rocket,
  ShieldCheck,
  Compass,
  Layers,
  Boxes,
  Globe,
  Smartphone,
  Plug2,
  BookOpen,
};

/** The names a collection may carry. The form's picker renders from this. */
export const COLLECTION_ICON_NAMES = Object.keys(ICONS);

export function CollectionIcon({ name, size = 17 }: { name: string | null; size?: number }) {
  const Comp = (name && ICONS[name]) || Layers;
  return <Comp size={size} />;
}

export default CollectionIcon;
