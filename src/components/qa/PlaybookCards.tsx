"use client";

/**
 * The pieces of a playbook as the reader draws them.
 *
 * These live here rather than inside the reader page because the author form's
 * live preview renders the SAME components from its draft state. That is what
 * makes the preview exact: there is one implementation of a recommendation
 * card, so the preview cannot drift from what a reader will actually see. If
 * you change a card, change it here and both surfaces move together.
 */

import React, { useMemo } from "react";
import { Checkbox, Tooltip } from "antd";
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Info,
  Layers,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";
import dayjs from "dayjs";

import ConfirmDialog from "@/components/common/ConfirmDialog";

import {
  LEVEL_LABELS,
  LEVEL_ORDER,
  REFERENCE_TYPES,
  RISK_LABELS,
  VISIBILITY_LABELS,
  priceLabel,
  type DraftItem,
  type PlaybookItem,
  type PlaybookSummary,
} from "@/components/qa/playbookShared";

/* ── Overview ────────────────────────────────────────────────────────────── */

/**
 * The overview is authored as light markdown. Rather than add a renderer
 * dependency for a few paragraphs, this handles exactly what the field
 * supports: fenced code blocks, bullet lists, `inline code` and **bold**.
 */
export function PlaybookOverview({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const out: { type: "p" | "ul" | "pre"; lines: string[] }[] = [];
    let inCode = false;

    for (const rawLine of text.split("\n")) {
      const line = rawLine.trimEnd();

      if (line.trimStart().startsWith("```")) {
        if (inCode) {
          inCode = false;
        } else {
          inCode = true;
          out.push({ type: "pre", lines: [] });
        }
        continue;
      }
      if (inCode) {
        out[out.length - 1].lines.push(rawLine);
        continue;
      }
      if (!line.trim()) continue;

      if (line.trimStart().startsWith("- ")) {
        const last = out[out.length - 1];
        if (last?.type === "ul") last.lines.push(line.trimStart().slice(2));
        else out.push({ type: "ul", lines: [line.trimStart().slice(2)] });
        continue;
      }
      out.push({ type: "p", lines: [line] });
    }
    return out;
  }, [text]);

  const inline = (value: string, key: React.Key) => {
    const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
    return (
      <React.Fragment key={key}>
        {parts.map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith("`") && part.endsWith("`")) {
            return <code key={i}>{part.slice(1, -1)}</code>;
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </React.Fragment>
    );
  };

  return (
    <div className="pb-overview">
      {blocks.map((block, i) => {
        if (block.type === "pre") {
          return (
            <pre className="pb-pre" key={i}>
              {block.lines.join("\n")}
            </pre>
          );
        }
        if (block.type === "ul") {
          return (
            <ul key={i}>
              {block.lines.map((line, j) => (
                <li key={j}>{inline(line, j)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(block.lines[0], 0)}</p>;
      })}
    </div>
  );
}

/* ── Recommendation card ─────────────────────────────────────────────────── */

interface ItemCardProps {
  item: PlaybookItem;
  categoryLabels: Record<string, string>;
  /** Omit both to render the card without its selection checkbox (preview). */
  picked?: boolean;
  onToggle?: (id: string) => void;
}

function PlaybookItemCardBase({ item, categoryLabels, picked, onToggle }: ItemCardProps) {
  const applies = Object.entries(item.appliesWhen ?? {}).filter(([key]) => key);
  const selectable = typeof onToggle === "function";

  return (
    <article className={`pb-item ${picked ? "is-picked" : ""}`}>
      <div className="pb-item__head">
        {selectable && <Checkbox checked={picked} onChange={() => onToggle!(item.id)} />}
        <h4 className="pb-item__title">{item.title || "Untitled recommendation"}</h4>
        <div className="pb-item__tags">
          <span className={`pb-level pb-level--${item.level}`}>
            {LEVEL_LABELS[item.level] ?? item.level}
          </span>
          <span className="pb-tag">{categoryLabels[item.category] ?? item.category}</span>
          <Tooltip title={RISK_LABELS[item.risk] ?? item.risk}>
            <span className={`pb-tag pb-tag--risk-${item.risk}`}>{item.risk}</span>
          </Tooltip>
        </div>
      </div>

      <div className="pb-item__body">
        {item.whatToTest && (
          <div>
            <span className="pb-field__label">What to test</span>
            <p className="pb-field__value">{item.whatToTest}</p>
          </div>
        )}

        {item.preconditions?.length > 0 && (
          /* Straight after the check it belongs to: you read what is being
             tested, then what has to be true before you can test it. Kept out of
             "what to test" itself, where setup gets skimmed past. */
          <div>
            <span className="pb-field__label">Preconditions</span>
            <ul className="pb-pre-list">
              {item.preconditions.map((pre, i) => (
                <li key={i}>{pre}</li>
              ))}
            </ul>
          </div>
        )}

        {item.steps?.length > 0 && (
          <div>
            <span className="pb-field__label">Steps</span>
            <ol className="pb-steps">
              {item.steps.map((step, i) => (
                <li key={i}>
                  <span className="pb-steps__n">{i + 1}</span>
                  <span className="pb-steps__text">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {item.examples?.length > 0 && (
          <div>
            <span className="pb-field__label">Examples</span>
            <div className="pb-examples">
              {item.examples.map((example, i) =>
                typeof example === "string" ? (
                  <div className="pb-example" key={i}>
                    <span className="pb-example__in">{example}</span>
                  </div>
                ) : (
                  <div className="pb-example" key={i}>
                    <span className="pb-example__in">{example.input}</span>
                    <span className="pb-example__verdict">→ {example.verdict}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {item.expected && (
          <div>
            <span className="pb-field__label">Expected</span>
            <p className="pb-field__value">{item.expected}</p>
          </div>
        )}

        {item.edgeCases?.length > 0 && (
          <div>
            <span className="pb-field__label">Edge cases</span>
            {/* One per line with its own tick: an edge case is something to go
                and check off, not a tag. */}
            <ul className="pb-edges">
              {item.edgeCases.map((edge, i) => (
                <li className="pb-edge" key={i}>
                  <CheckCircle2 size={14} />
                  <span>{edge}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.whyItMatters && (
          <div>
            <span className="pb-field__label">Why it matters</span>
            <p className="pb-why">{item.whyItMatters}</p>
          </div>
        )}

        {item.references?.length > 0 && (
          /* Where this came from, and where to read more. Typed, because a QA
             guide, the security standard and a live app to try it on are
             different answers to the same question. */
          <div>
            <span className="pb-field__label">Reference / learn more</span>
            <div className="pb-refs">
              {item.references.map((ref, i) => {
                const meta = REFERENCE_TYPES[ref.type] ?? REFERENCE_TYPES.qa_guide;
                const body = (
                  <>
                    <span className="pb-ref__type" title={meta.label}>
                      <span aria-hidden>{meta.emoji}</span>
                      {meta.label}
                    </span>
                    <span className="pb-ref__text">
                      <b>{ref.name}</b>
                      {ref.description ? <em>{ref.description}</em> : null}
                    </span>
                    {ref.url ? <ExternalLink size={13} className="pb-ref__go" /> : null}
                  </>
                );
                return ref.url ? (
                  <a
                    key={i}
                    className="pb-ref is-link"
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {body}
                  </a>
                ) : (
                  <span key={i} className="pb-ref">
                    {body}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {applies.length > 0 && (
          <span className="pb-applies">
            <Info size={12} />
            Applies when {applies.map(([k, v]) => `${k}: ${(v ?? []).join(", ")}`).join("; ")}
          </span>
        )}
      </div>
    </article>
  );
}

/**
 * Memoised because the author form renders every card in the playbook live.
 * The editor updates its draft with structural sharing, so an untouched card
 * keeps its exact props and skips re-rendering while someone types in another.
 */
export const PlaybookItemCard = React.memo(PlaybookItemCardBase);

/* ── Catalog card ────────────────────────────────────────────────────────── */

interface CatalogCardProps {
  playbook: PlaybookSummary;
  /** Omit to render a non-interactive card (preview). */
  onOpen?: () => void;
  /** Both omitted on a playbook this caller may not manage. */
  onEdit?: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function PlaybookCatalogCard({
  playbook,
  onOpen,
  onEdit,
  onDelete,
  deleting,
}: CatalogCardProps) {
  const interactive = typeof onOpen === "function";
  const manageable = typeof onEdit === "function" || typeof onDelete === "function";

  /* A div rather than a button when the card carries its own actions: nesting
     Edit and Delete inside a button is invalid markup, and a click on either
     would activate the card as well. The div keeps the whole surface clickable
     and stays keyboard reachable through role/tabIndex. */
  const Tag: any = interactive && !manageable ? "button" : "div";
  const asDiv = interactive && manageable;

  return (
    <Tag
      {...(interactive && !manageable ? { type: "button", onClick: onOpen } : {})}
      {...(asDiv
        ? {
            role: "button",
            tabIndex: 0,
            onClick: onOpen,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.();
              }
            },
          }
        : {})}
      className={`pb-card ${playbook.locked ? "is-locked" : ""} ${interactive ? "" : "is-static"}`}
    >
      <div className="pb-card__top">
        <span className="pb-card__av">
          {playbook.locked ? <Lock size={15} /> : <BookOpen size={16} />}
        </span>
        <div className="pb-card__id">
          <span className="pb-card__name">{playbook.name || "Untitled playbook"}</span>
          <span className="pb-card__meta">
            v{playbook.version}
            {playbook.lastUpdatedAt
              ? ` · updated ${dayjs(playbook.lastUpdatedAt).format("D MMM YYYY")}`
              : ""}
          </span>
        </div>
        {manageable ? (
          <span
            className="pb-card__actions"
            /* The actions are a click target inside a click target, so every
               event stops here rather than opening the playbook underneath. */
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <Tooltip title="Edit">
                <button type="button" className="pb-iconbtn" onClick={onEdit} aria-label="Edit">
                  <Pencil size={14} />
                </button>
              </Tooltip>
            )}
            {onDelete && (
              /* The product's own confirmation card, so deleting a playbook
                 asks the same way deleting anything else does. */
              <ConfirmDialog
                tone="danger"
                title="Delete this playbook?"
                description={`"${playbook.name}" and every section and recommendation in it are removed. Test cases already generated from it are untouched.`}
                confirmText="Delete"
                onConfirm={() => onDelete()}
              >
                <Tooltip title="Delete">
                  <button
                    type="button"
                    className="pb-iconbtn is-danger"
                    aria-label="Delete"
                    disabled={deleting}
                  >
                    <Trash2 size={14} />
                  </button>
                </Tooltip>
              </ConfirmDialog>
            )}
          </span>
        ) : (
          <span className="pb-card__go">
            <ArrowUpRight size={16} />
          </span>
        )}
      </div>

      <p className="pb-card__summary">{playbook.summary}</p>

      <div className="pb-card__foot">
        <span className="pb-card__total">
          <Layers size={13} />
          {playbook.itemCount} recommendations
        </span>

        {playbook.locked ? (
          <span className="pb-card__price">
            <Lock size={12} />
            {priceLabel(playbook)}
          </span>
        ) : (
          <span className="pb-levels">
            {LEVEL_ORDER.map((level) => {
              const count = playbook.levelCounts?.[level] ?? 0;
              if (!count) return null;
              return (
                <Tooltip key={level} title={`${count} ${LEVEL_LABELS[level]} recommendations`}>
                  <span className={`pb-level pb-level--${level}`}>
                    {LEVEL_LABELS[level].slice(0, 1)}
                    <b>{count}</b>
                  </span>
                </Tooltip>
              );
            })}
          </span>
        )}
      </div>

      <div className="pb-item__tags">
        <span className={`pb-tier pb-tier--${playbook.visibility}`}>
          {VISIBILITY_LABELS[playbook.visibility]}
        </span>
        {playbook.status !== "published" && (
          <span className="pb-tier pb-tier--draft">{playbook.status}</span>
        )}
      </div>
    </Tag>
  );
}

/**
 * Mapped results are cached against the draft object itself.
 *
 * Without this the memo above would never hit: a fresh object every render is
 * a fresh prop. The editor's structural sharing keeps an untouched draft
 * referentially stable, so a WeakMap keyed on it is exactly the right lifetime —
 * entries disappear when the draft does.
 */
const itemCache = new WeakMap<DraftItem, { id: string; mapped: PlaybookItem }>();

/**
 * A draft carries the API's snake_case field names and has no database ids yet.
 * Mapping it here — rather than teaching the card two shapes — keeps the card
 * itself unaware that a preview exists.
 */
export function draftToItem(draft: DraftItem, id = "preview"): PlaybookItem {
  const cached = itemCache.get(draft);
  // The id encodes position, so a moved item must be re-mapped even though its
  // content is untouched.
  if (cached && cached.id === id) return cached.mapped;

  const mapped = buildItem(draft, id);
  itemCache.set(draft, { id, mapped });
  return mapped;
}

function buildItem(draft: DraftItem, id: string): PlaybookItem {
  return {
    id,
    key: draft.key ?? id,
    sectionId: "preview",
    title: draft.title,
    whatToTest: draft.what_to_test,
    examples: draft.examples,
    expected: draft.expected,
    steps: draft.steps,
    level: draft.level,
    category: draft.category,
    risk: draft.risk,
    whyItMatters: draft.why_it_matters,
    preconditions: draft.preconditions ?? [],
    edgeCases: draft.edge_cases ?? [],
    references: draft.references ?? [],
    appliesWhen: draft.applies_when,
  };
}
