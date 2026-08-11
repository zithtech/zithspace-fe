import React from 'react';
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  Megaphone,
  MessageSquare,
  PartyPopper,
  Tag,
} from 'lucide-react';
import { PALETTE, TINT } from '@/components/openings/ui';
import type {
  BuiltInCategory,
  CirculationCategory,
  CirculationCategoryItem,
} from '@/services/hotspotCirculationService';

// Category presentation, kept out of the components so the chip, the composer
// dropdown and the filter rail can never drift apart.
//
// The palette is deliberately narrow — blue, green, ash, light grey, with red
// reserved for destructive actions. Six categories cannot each get a hue under
// that rule, so meaning is carried by ICON + LABEL and the colour only groups:
// blue for "act on this", green for good news, ash for reference material.
export interface CategoryMeta {
  label: string;
  color: string;
  tint: string;
  icon: React.ReactNode;
}

export const CATEGORY_META: Record<BuiltInCategory, CategoryMeta> = {
  general: {
    label: 'General',
    color: PALETTE.ash,
    tint: TINT.ash,
    icon: <MessageSquare size={13} />,
  },
  announcement: {
    label: 'Announcement',
    color: PALETTE.blue,
    tint: TINT.blue,
    icon: <Megaphone size={13} />,
  },
  policy: {
    label: 'Policy',
    color: PALETTE.ash,
    tint: TINT.ash,
    icon: <FileText size={13} />,
  },
  event: {
    label: 'Event',
    color: PALETTE.blue,
    tint: TINT.blue,
    icon: <CalendarDays size={13} />,
  },
  celebration: {
    label: 'Celebration',
    color: PALETTE.green,
    tint: TINT.green,
    icon: <PartyPopper size={13} />,
  },
  alert: {
    label: 'Alert',
    color: PALETTE.blue,
    tint: TINT.blue,
    icon: <AlertTriangle size={13} />,
  },
};

/** Sentence-case a slug when nothing better is available ("town_hall" → "Town hall"). */
function humanizeSlug(key: string): string {
  const words = key.replace(/_/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : key;
}

/**
 * Presentation for any category — built-in or tenant-defined.
 *
 * Tenant categories share one look (ash + a tag icon) on purpose: the palette
 * is deliberately narrow, and giving user-created categories their own colours
 * would either exhaust it or need a colour picker nobody asked for. The label
 * carries the meaning; the icon says "this one is yours".
 */
export function categoryMetaFor(key: string, label?: string | null): CategoryMeta {
  const builtIn = CATEGORY_META[key as BuiltInCategory];
  if (builtIn) return builtIn;

  return {
    label: label?.trim() || humanizeSlug(key),
    color: PALETTE.ash,
    tint: TINT.ash,
    icon: <Tag size={13} />,
  };
}

/** Resolve a catalog entry for display — the server echoes the key for built-ins. */
export function categoryMetaForItem(item: CirculationCategoryItem): CategoryMeta {
  return categoryMetaFor(item.key, item.isBuiltIn ? null : item.label);
}

export function CategoryChip({
  category,
  label,
}: {
  category: CirculationCategory;
  /** Tenant-defined label; omit for built-ins. */
  label?: string | null;
}) {
  const meta = categoryMetaFor(category, label);
  return (
    <span
      className="hsc-chip"
      style={{ color: meta.color, background: meta.tint, border: `1px solid ${meta.color}22` }}
    >
      {meta.icon}
      {meta.label}
      <style jsx>{`
        .hsc-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 100px;
          white-space: nowrap;
        }
      `}</style>
    </span>
  );
}

/**
 * Relative timestamp for the feed.
 *
 * The shared `relativeDays` helper is day-granular, which collapses every
 * update posted today into "today" — useless ordering information on a
 * noticeboard where several land in one morning. Below a day, go finer.
 */
export function postedAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const seconds = Math.round((Date.now() - t) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.round(days / 7)}w ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(days > 365 ? { year: 'numeric' } : {}),
  });
}

/** Human-readable file size for the document list. */
export function fileSizeLabel(bytes?: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
