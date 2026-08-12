import { PALETTE } from '@/components/openings/ui';
import type { BlogReaction, BlogUser } from '@/services/hotspotBlogService';

// Presentation for the reaction set, kept out of the components so the picker,
// the summary row and the "reacted by" list can never drift apart.
//
// Reactions are the one place the narrow blue/green/ash palette does not apply:
// an emoji IS the colour, and recolouring 🎉 to ash would make it unreadable.
// Everything around them — buttons, counts, borders — stays on-palette.

export interface ReactionMeta {
  key: BlogReaction;
  emoji: string;
  label: string;
  /** Used for the active pill's text, on-palette. */
  color: string;
}

export const REACTION_META: Record<BlogReaction, ReactionMeta> = {
  like: { key: 'like', emoji: '👍', label: 'Like', color: PALETTE.blue },
  celebrate: { key: 'celebrate', emoji: '🎉', label: 'Celebrate', color: PALETTE.green },
  support: { key: 'support', emoji: '🤝', label: 'Support', color: PALETTE.green },
  love: { key: 'love', emoji: '❤️', label: 'Love', color: PALETTE.blue },
  insightful: { key: 'insightful', emoji: '💡', label: 'Insightful', color: PALETTE.ash },
  funny: { key: 'funny', emoji: '😄', label: 'Funny', color: PALETTE.ash },
};

/** Picker order — most-used first, so the common case is the shortest reach. */
export const REACTION_ORDER: BlogReaction[] = [
  'like',
  'celebrate',
  'support',
  'love',
  'insightful',
  'funny',
];

/**
 * Relative timestamp for the feed. Finer than the shared day-granular helper,
 * because a feed where everything says "today" tells you nothing about order.
 */
export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const seconds = Math.round((Date.now() - t) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.round(days / 7)}w`;

  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(days > 365 ? { year: 'numeric' } : {}),
  });
}

/** "Priya, Alex and 3 others" — the summary line under a post. */
export function reactorSummary(names: string[], total: number): string {
  if (total === 0) return '';
  if (names.length === 0) return `${total}`;
  const [first, second] = names;
  const others = total - Math.min(names.length, 2);

  if (others <= 0) return second ? `${first} and ${second}` : first;
  if (second) return `${first}, ${second} and ${others} other${others === 1 ? '' : 's'}`;
  return `${first} and ${others} other${others === 1 ? '' : 's'}`;
}

/** Deterministic avatar colour, shared with the rest of the app's initials chips. */
export function displayName(user?: BlogUser | null): string {
  return user?.name?.trim() || 'Employee';
}
