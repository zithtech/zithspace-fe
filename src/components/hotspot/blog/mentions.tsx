import React from 'react';
import { PALETTE } from '@/components/openings/ui';
import type { BlogUser } from '@/services/hotspotBlogService';

// Turning a plain-text body into mention chips.
//
// The body is exactly what the author typed — "Nice work @Priya Sharma!" — and
// the mention list from the server says who was actually tagged. That split is
// deliberate (see migration 003): the text is the source of truth for what is
// displayed, the table is the source of truth for who gets notified, and the
// server refuses to record a mention whose name is not in the text.
//
// Matching is longest-name-first so "@Priya Sharma" wins over "@Priya" when both
// are tagged; without that ordering the shorter name would match first and leave
// a stray " Sharma" outside the chip.

interface Segment {
  text: string;
  user: BlogUser | null;
}

export function splitMentions(body: string, mentions: BlogUser[]): Segment[] {
  if (!body) return [];
  if (mentions.length === 0) return [{ text: body, user: null }];

  const ordered = [...mentions].sort((a, b) => b.name.length - a.name.length);
  const segments: Segment[] = [];

  // `cursor` is the start of the plain run not yet emitted; `scan` walks ahead
  // looking for the next "@". They only meet again when a mention matches.
  let cursor = 0;
  let scan = 0;

  while (scan < body.length) {
    const at = body.indexOf('@', scan);
    if (at === -1) break;

    const match = ordered.find((u) => body.startsWith(`@${u.name}`, at));
    if (!match) {
      // A bare "@" that tags nobody — step past it rather than treating the
      // rest of the post as one chunk.
      scan = at + 1;
      continue;
    }

    if (at > cursor) segments.push({ text: body.slice(cursor, at), user: null });
    segments.push({ text: `@${match.name}`, user: match });
    scan = cursor = at + match.name.length + 1;
  }

  if (cursor < body.length) segments.push({ text: body.slice(cursor), user: null });
  return segments.length ? segments : [{ text: body, user: null }];
}

/** Match what the editor emits: a raw "&" in a name is "&amp;" in the HTML. */
function escapeForHtml(name: string): string {
  return name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Highlight mentions inside a post's HTML body.
 *
 * The markup never goes through a text replace — the document is split into
 * tags and text runs first, and only the TEXT runs are rewritten. Replacing
 * across the whole string would happily match inside an attribute (an "@" in a
 * link href, say) and produce a span in the middle of a tag.
 *
 * The HTML is already sanitised server-side, and the only thing inserted here
 * is a fixed <span class="hsb-mention">, so the result is safe to set as inner
 * HTML.
 */
export function highlightMentionsHtml(html: string, mentions: BlogUser[]): string {
  if (!html || mentions.length === 0) return html;

  const ordered = [...mentions]
    .map((u) => escapeForHtml(u.name))
    .sort((a, b) => b.length - a.length);

  return html
    .split(/(<[^>]*>)/)
    .map((part) => (part.startsWith('<') ? part : highlightRun(part, ordered)))
    .join('');
}

/** Same longest-name-first cursor walk as splitMentions, emitting HTML. */
function highlightRun(text: string, orderedNames: string[]): string {
  if (!text.includes('@')) return text;

  let out = '';
  let cursor = 0;
  let scan = 0;

  while (scan < text.length) {
    const at = text.indexOf('@', scan);
    if (at === -1) break;

    const match = orderedNames.find((n) => text.startsWith(`@${n}`, at));
    if (!match) {
      scan = at + 1;
      continue;
    }

    out += text.slice(cursor, at);
    out += `<span class="hsb-mention">@${match}</span>`;
    scan = cursor = at + match.length + 1;
  }

  return out + text.slice(cursor);
}

/**
 * Render a post body (sanitised HTML) with mention chips.
 *
 * `:global` throughout, because the markup comes from dangerouslySetInnerHTML
 * and styled-jsx cannot stamp its scope class onto nodes it never saw.
 */
export function MentionHtml({ body, mentions }: { body: string; mentions: BlogUser[] }) {
  return (
    // The style block is a SIBLING, not a child: React refuses an element that
    // has both children and dangerouslySetInnerHTML.
    <>
      <div
        className="hsb-html"
        dangerouslySetInnerHTML={{ __html: highlightMentionsHtml(body, mentions) }}
      />
      <style jsx>{`
        .hsb-html { overflow-wrap: anywhere; }
        .hsb-html :global(p) { margin: 0 0 8px; }
        .hsb-html :global(p:last-child) { margin-bottom: 0; }
        .hsb-html :global(ul),
        .hsb-html :global(ol) { margin: 0 0 8px; padding-left: 20px; }
        .hsb-html :global(li) { margin: 2px 0; }
        .hsb-html :global(h3) { font-size: 15px; font-weight: 700; margin: 0 0 6px; }
        .hsb-html :global(blockquote) {
          margin: 0 0 8px; padding-left: 12px;
          border-left: 3px solid var(--border-slate-200); color: var(--text-slate-600);
        }
        .hsb-html :global(a) { color: ${PALETTE.blue}; text-decoration: underline; }
        .hsb-html :global(img) { max-width: 100%; height: auto; border-radius: 8px; }
        .hsb-html :global(.hsb-mention) { color: ${PALETTE.blue}; font-weight: 600; }
      `}</style>
    </>
  );
}

/**
 * Render a PLAIN-TEXT body (comments) with mention chips and preserved line
 * breaks.
 *
 * Line breaks matter: people write comments as short lines, and collapsing them
 * into a paragraph changes the meaning of a list.
 */
export function MentionText({
  body,
  mentions,
}: {
  body: string;
  mentions: BlogUser[];
}) {
  const segments = splitMentions(body, mentions);

  return (
    <span className="hsb-text">
      {segments.map((segment, i) =>
        segment.user ? (
          <span key={i} className="hsb-mention" title={segment.user.designation ?? undefined}>
            {segment.text}
          </span>
        ) : (
          <React.Fragment key={i}>{segment.text}</React.Fragment>
        )
      )}
      <style jsx>{`
        .hsb-text {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }
        .hsb-mention {
          color: ${PALETTE.blue};
          font-weight: 600;
        }
      `}</style>
    </span>
  );
}
