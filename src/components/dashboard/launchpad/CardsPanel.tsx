"use client";

import React, { useMemo } from "react";
import { Search, X, Plug2, SlidersHorizontal, ChevronRight, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  SEGMENT_SECTIONS,
  DashboardSegment,
  DashboardCardDef,
} from "./dashboardCards";
import { CardValue, CardValues, CardActions } from "./useCardValues";

/** How many value lines a card shows before "Show more" is offered. */
export const INLINE_LIMIT = 2;

export interface VisibleCard extends DashboardCardDef {
  section: string;
  visible: boolean;
}

interface CardsPanelProps {
  segment: DashboardSegment;
  onSegmentChange: (segment: DashboardSegment) => void;
  query: string;
  onQueryChange: (value: string) => void;
  settings: Record<string, boolean>;
  values: CardValues;
  actions: CardActions;
  loading: boolean;
  valuesLoading: boolean;
  expanded: Record<string, boolean>;
  onToggleExpand: (name: string) => void;
  onOpenIntegrations: () => void;
  onOpenSettings: () => void;
}

const norm = (s: string) => s.toLowerCase().trim();

/** Cards of the active segment the tenant's plan actually includes. */
export function useSegmentCards(
  segment: DashboardSegment,
  settings: Record<string, boolean>,
) {
  const { hasAnySubscriptionFeature } = useAuth();

  return useMemo(() => {
    const out: VisibleCard[] = [];
    for (const section of SEGMENT_SECTIONS[segment]) {
      for (const card of section.cards) {
        if (
          card.requiredFeatures &&
          !hasAnySubscriptionFeature(...card.requiredFeatures)
        ) {
          continue;
        }
        out.push({
          ...card,
          section: section.label,
          visible: settings[card.name] !== false,
        });
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segment, settings]);
}

/** Search matches the title, the description, and the live values themselves. */
export function filterCards(
  cards: VisibleCard[],
  query: string,
  values: CardValues,
): VisibleCard[] {
  const q = norm(query);
  if (!q) return cards;

  return cards.filter((c) => {
    if (norm(c.title).includes(q) || norm(c.description).includes(q)) return true;
    return (values[c.name] || []).some(
      (v) => norm(v.label).includes(q) || norm(v.value).includes(q),
    );
  });
}

export default function CardsPanel({
  segment,
  onSegmentChange,
  query,
  onQueryChange,
  settings,
  values,
  actions,
  loading,
  valuesLoading,
  expanded,
  onToggleExpand,
  onOpenIntegrations,
  onOpenSettings,
}: CardsPanelProps) {
  const cards = useSegmentCards(segment, settings);
  const matches = useMemo(
    () => filterCards(cards, query, values),
    [cards, query, values],
  );
  const isSearching = query.trim().length > 0;

  // Preserve the Status / Dashboard split, dropping sections search emptied out.
  const sections = useMemo(() => {
    const order = SEGMENT_SECTIONS[segment].map((s) => s.label);
    return order
      .map((label) => ({
        label,
        cards: matches.filter((c) => c.section === label),
      }))
      .filter((s) => s.cards.length > 0);
  }, [matches, segment]);

  /* Values sit on one line; `.lp-val + .lp-val` draws the "|" between them. */
  const renderValue = (line: CardValue, key: string) => (
    <span className="lp-val" key={key}>
      {line.label && <span className="lp-val-label">{line.label}:</span>}
      <span className="lp-val-value">{line.value}</span>
    </span>
  );

  const renderCard = (card: VisibleCard) => {
    const Icon = card.icon;
    const lines = values[card.name] || [];
    const action = actions[card.name];
    const isOpen = !!expanded[card.name];
    const overflow = Math.max(0, lines.length - INLINE_LIMIT);
    const shown = isOpen ? lines : lines.slice(0, INLINE_LIMIT);

    return (
      <div
        key={`${card.section}:${card.name}`}
        className={`lp-card${card.visible ? "" : " is-off"}`}
      >
        <div className="lp-card-head">
          <span
            className="lp-row-icon"
            style={{
              background: `${card.color}1A`,
              borderColor: `${card.color}33`,
              color: card.color,
            }}
          >
            <Icon size={16} strokeWidth={2} />
          </span>
          <span className="lp-row-body">
            <span className="lp-row-title">
              <span>{card.title}</span>
              {!card.visible && <span className="lp-badge">Hidden</span>}
            </span>

            <span className="lp-vals">
              {shown.length ? (
                shown.map((line, i) => renderValue(line, `${card.name}:${i}`))
              ) : (
                <span className="lp-val">
                  <span className="lp-val-value">
                    {valuesLoading ? "Loading..." : card.description}
                  </span>
                </span>
              )}

              {/* Buttons are wrapped, not themselves `.lp-val` — otherwise the
                  "|" pseudo-element would render inside the button's own box. */}
              {action && (
                <span className="lp-val">
                  <button
                    type="button"
                    className="lp-act"
                    disabled={action.loading}
                    onClick={action.onClick}
                  >
                    {action.loading ? "Working..." : action.label}
                  </button>
                </span>
              )}

              {overflow > 0 && (
                <span className="lp-val">
                  <button
                    type="button"
                    className="lp-more"
                    aria-expanded={isOpen}
                    onClick={() => onToggleExpand(card.name)}
                  >
                    {isOpen ? (
                      <>
                        <ChevronDown size={12} strokeWidth={2.2} />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronRight size={12} strokeWidth={2.2} />
                        Show {overflow} more
                      </>
                    )}
                  </button>
                </span>
              )}
            </span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <aside className="lp-left">
      <div className="lp-search">
        <Search size={15} strokeWidth={1.9} color="#94A3B8" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search cards..."
          aria-label="Search dashboard cards"
        />
        {isSearching && (
          <button
            type="button"
            className="lp-icon-btn"
            style={{ width: 20, height: 20 }}
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
          >
            <X size={13} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="lp-seg" role="tablist" aria-label="Dashboard view">
        {(["me", "organization"] as DashboardSegment[]).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={segment === key}
            className={`lp-seg-item${segment === key ? " is-active" : ""}`}
            onClick={() => onSegmentChange(key)}
          >
            {key === "me" ? "Me" : "Organization"}
          </button>
        ))}
      </div>

      <div className="lp-list">
        {loading ? (
          <div className="lp-empty">Loading your cards...</div>
        ) : sections.length ? (
          sections.map((section) => (
            <div key={section.label}>
              <div className="lp-group-label">{section.label}</div>
              {section.cards.map(renderCard)}
            </div>
          ))
        ) : (
          <div className="lp-empty">
            {isSearching
              ? `No card matches “${query.trim()}”.`
              : "No cards available for this view."}
          </div>
        )}
      </div>

      <div className="lp-foot">
        <button type="button" className="lp-row" onClick={onOpenIntegrations}>
          <span className="lp-row-icon">
            <Plug2 size={16} strokeWidth={2} />
          </span>
          <span className="lp-row-body">
            <span className="lp-row-title">
              <span>Integrations</span>
            </span>
            <span className="lp-row-trail">Connected apps and data sources</span>
          </span>
          <ChevronRight size={15} strokeWidth={1.75} className="lp-chevron" />
        </button>

        <button type="button" className="lp-row" onClick={onOpenSettings}>
          <span className="lp-row-icon">
            <SlidersHorizontal size={16} strokeWidth={2} />
          </span>
          <span className="lp-row-body">
            <span className="lp-row-title">
              <span>Dashboard settings</span>
            </span>
            <span className="lp-row-trail">Choose which cards are visible</span>
          </span>
          <ChevronRight size={15} strokeWidth={1.75} className="lp-chevron" />
        </button>
      </div>
    </aside>
  );
}
