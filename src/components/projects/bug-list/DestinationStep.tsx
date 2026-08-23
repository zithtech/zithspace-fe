"use client";

/**
 * Wizard step 1 — "Choose Destination".
 *
 * Body only: the surrounding modal, wizard bar and step rail belong to
 * CreateTicketWizard, so this never unmounts the popup when you move on.
 */

import React, { useMemo, useState } from "react";
import {
  Search,
  Check,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  X,
  Bug as BugIcon,
} from "lucide-react";
import {
  ZukvoLogo,
  LinearMark,
  JiraMark,
  GithubMark,
  SlackMark,
  NotionMark,
  AzureMark,
  TrelloMark,
  TicketFlowHeader,
  TicketFlowCard,
} from "./ticket-flow";

type SoonDest = { key: string; name: string; tagline: string; logo: React.ReactNode };

const SOON_DESTINATIONS: SoonDest[] = [
  { key: "jira", name: "Jira", tagline: "Issues & epics", logo: <JiraMark /> },
  { key: "github", name: "GitHub", tagline: "Repo issues", logo: <GithubMark /> },
  { key: "slack", name: "Slack", tagline: "Channel digest", logo: <SlackMark /> },
  { key: "azure", name: "Azure DevOps", tagline: "Work items", logo: <AzureMark /> },
  { key: "trello", name: "Trello", tagline: "Cards & lists", logo: <TrelloMark /> },
  { key: "notion", name: "Notion", tagline: "Database rows", logo: <NotionMark /> },
];

type FilterKey = "all" | "connected" | "soon";

export interface DestinationStepProps {
  /** How many bugs are queued up. */
  count: number;
  /** Advance to the method step with the chosen destination. */
  onPick: (destination: "zukvo" | "linear") => void;
  /** Jump straight to AI drafting for a destination. */
  onPickAi: (destination: "zukvo" | "linear") => void;
  onClose: () => void;
  onManageIntegrations?: () => void;
}

export default function DestinationStep({
  count,
  onPick,
  onPickAi,
  onClose,
  onManageIntegrations,
}: DestinationStepProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const q = query.trim().toLowerCase();
  const showConnected = filter !== "soon";
  const showSoon = filter !== "connected";

  const connected = useMemo(() => {
    const all = [
      { key: "zukvo", hay: "zukvo tickets native workspace" },
      { key: "linear", hay: "linear issues sync team project" },
    ];
    return new Set(all.filter((d) => !q || d.hay.includes(q)).map((d) => d.key));
  }, [q]);

  const soon = useMemo(
    () =>
      SOON_DESTINATIONS.filter(
        (d) => !q || `${d.name} ${d.tagline}`.toLowerCase().includes(q)
      ),
    [q]
  );

  const zukvoVisible = showConnected && connected.has("zukvo");
  const linearVisible = showConnected && connected.has("linear");
  const soonVisible = showSoon && soon.length > 0;
  const nothing = !zukvoVisible && !linearVisible && !soonVisible;
  const connectedCount = (zukvoVisible ? 1 : 0) + (linearVisible ? 1 : 0);

  const bugLabel = `${count} bug${count === 1 ? "" : "s"}`;

  return (
    <>
      <TicketFlowHeader
        mark={<ZukvoLogo size={22} />}
        eyebrow="Step 1 · Destination"
        title="Where should these tickets land?"
        chips={[
          { icon: <BugIcon size={12} />, label: `${bugLabel} selected`, tone: "accent" },
          { icon: <ShieldCheck size={12} />, label: "Nothing is sent until you confirm" },
        ]}
      />

      <div className="tf-toolbar">
        <label className="tf-search">
          <Search size={14} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations…"
            aria-label="Search destinations"
          />
          {query && (
            <button
              className="tf-search-clear"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </label>

        <div className="tf-seg" role="tablist" aria-label="Filter destinations">
          {(
            [
              ["all", "All"],
              ["connected", "Connected"],
              ["soon", "Coming soon"],
            ] as [FilterKey, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              className={`tf-seg-btn ${filter === key ? "is-active" : ""}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="tf-body">
        {connectedCount > 0 && (
          <>
            <div className="tf-section">
              Connected
              <span className="tf-section-count">{connectedCount}</span>
            </div>

            <div className="tf-grid" style={{ ["--tf-cols" as string]: connectedCount }}>
              {zukvoVisible && (
                <TicketFlowCard
                  mark={<ZukvoLogo size={22} />}
                  plate
                  tone="blue"
                  badge={{ label: "Native", tone: "ok", dot: true }}
                  name="Zukvo Tickets"
                  sub="Create tickets inside this workspace — no external account, no sync lag."
                  feats={[
                    "Instant, built-in tracking",
                    "Bug context carried over",
                    "Assignees, severity & due dates",
                  ]}
                  cta="Continue to Zukvo"
                  onClick={() => onPick("zukvo")}
                />
              )}

              {linearVisible && (
                <TicketFlowCard
                  mark={<LinearMark size={22} />}
                  plate
                  tone="blue"
                  badge={{ label: "Connected", tone: "ok", dot: true }}
                  name="Linear"
                  sub="Push issues straight into your connected Linear workspace and keep both sides in step."
                  feats={[
                    "Map to Teams & Projects",
                    "Two-way status sync",
                    "Labels & priority mapping",
                  ]}
                  cta="Continue to Linear"
                  onClick={() => onPick("linear")}
                />
              )}
            </div>

            {!q && (
              <div className="tf-quick">
                <div className="tf-quick-label">
                  <Sparkles size={13} />
                  Skip ahead — let AI draft the tickets
                </div>
                <div className="tf-quick-actions">
                  <button className="tf-quick-btn" onClick={() => onPickAi("zukvo")}>
                    <ZukvoLogo size={13} />
                    Draft in Zukvo
                  </button>
                  <button className="tf-quick-btn" onClick={() => onPickAi("linear")}>
                    <LinearMark size={13} />
                    Draft in Linear
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {soonVisible && (
          <>
            <div className="tf-section">
              More destinations
              <span className="tf-section-count">{soon.length}</span>
              <span className="tf-section-hint">Coming soon</span>
            </div>

            <div className="tf-mini-grid">
              {soon.map((d) => (
                <div key={d.key} className="tf-mini" aria-disabled>
                  <span className="tf-logo-soon">{d.logo}</span>
                  <div className="tf-mini-text">
                    <div className="tf-mini-name">{d.name}</div>
                    <div className="tf-mini-tag">{d.tagline}</div>
                  </div>
                  <span className="tf-badge tf-badge-muted">Soon</span>
                </div>
              ))}
            </div>
          </>
        )}

        {nothing && (
          <div className="tf-empty">
            <Search size={22} />
            <div className="tf-empty-title">No destination matches “{query}”</div>
            <div className="tf-empty-sub">Try a different name, or clear the filters.</div>
            <button
              className="tf-empty-btn"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <footer className="tf-foot">
        <button
          className="tf-ghost"
          onClick={onManageIntegrations}
          disabled={!onManageIntegrations}
        >
          <SlidersHorizontal size={13} />
          Manage integrations
        </button>

        <div className="tf-foot-right">
          <span className="tf-foot-note">
            <Check size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            {bugLabel} ready
          </span>
          <button className="tf-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </footer>
    </>
  );
}
