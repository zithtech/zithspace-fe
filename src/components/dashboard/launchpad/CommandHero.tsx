"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Plus, LayoutDashboard, Plug2, SlidersHorizontal } from "lucide-react";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { CalendarService, CalendarProvider } from "@/services/calendarService";
import { DashboardSegment } from "./dashboardCards";
import { VisibleCard } from "./CardsPanel";
import { CardValues } from "./useCardValues";

interface CommandHeroProps {
  segment: DashboardSegment;
  cards: VisibleCard[];
  values: CardValues;
  query: string;
  onQueryChange: (value: string) => void;
  /** First card matching the query, or undefined when nothing matches. */
  topMatch?: VisibleCard;
  onCardExpand: (card: VisibleCard) => void;
  onOpenDashboard: () => void;
  onOpenIntegrations: () => void;
  onOpenSettings: () => void;
}

const PROVIDER_LABEL: Record<CalendarProvider, string> = {
  GOOGLE: "Google Workspace",
  ZOHO: "Zoho Workspace",
  MICROSOFT: "Microsoft 365",
};

export default function CommandHero({
  segment,
  cards,
  values,
  query,
  onQueryChange,
  topMatch,
  onCardExpand,
  onOpenDashboard,
  onOpenIntegrations,
  onOpenSettings,
}: CommandHeroProps) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [connected, setConnected] = useState<CalendarProvider | null>(null);
  const [checkingProvider, setCheckingProvider] = useState(true);

  // Same probe the classic dashboard used — first connected provider wins.
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      const providers: CalendarProvider[] = ["GOOGLE", "ZOHO", "MICROSOFT"];
      for (const provider of providers) {
        try {
          const status = await CalendarService.getStatus(provider);
          if (cancelled) return;
          if (status?.connected) {
            setConnected(provider);
            break;
          }
        } catch {
          // A provider that errors is simply not connected.
        }
      }
      if (!cancelled) setCheckingProvider(false);
    };

    probe();
    return () => {
      cancelled = true;
    };
  }, []);

  // Focus the composer on mount so the page is keyboard-ready.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const hour = dayjs().hour();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || user?.name || "there";

  const visibleCount = useMemo(
    () => cards.filter((c) => c.visible).length,
    [cards],
  );

  const submit = () => {
    if (topMatch) onCardExpand(topMatch);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
    if (e.key === "Escape") onQueryChange("");
  };

  const segmentLabel = segment === "me" ? "Me" : "Organization";

  return (
    <div className="lp-hero">
      <h1 className="lp-hero-title">
        {greeting}, {firstName}.
      </h1>
      <p className="lp-hero-sub">
        {cards.length
          ? `${visibleCount} of ${cards.length} cards are live on your ${segmentLabel} dashboard. Search them on the left, or jump straight in.`
          : "Set up your dashboard cards to get started."}
      </p>

      <div className="lp-composer">
        <textarea
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder="e.g. attendance, tickets, calendar, salary slip"
          aria-label="Search your dashboard cards"
        />

        <div className="lp-composer-bar">
          <button
            type="button"
            className="lp-icon-btn"
            onClick={onOpenSettings}
            aria-label="Add or hide cards"
            title="Add or hide cards"
          >
            <Plus size={17} strokeWidth={2} />
          </button>

          <button
            type="button"
            className="lp-status-chip"
            onClick={onOpenIntegrations}
          >
            <span className={`lp-dot${connected ? " is-on" : ""}`} />
            {connected
              ? `${PROVIDER_LABEL[connected]} connected`
              : checkingProvider
                ? "Checking integrations..."
                : "Connect a workspace"}
          </button>

          <button
            type="button"
            className={`lp-send${topMatch ? " is-ready" : ""}`}
            onClick={submit}
            disabled={!topMatch}
            aria-label={
              topMatch ? `Expand ${topMatch.title}` : "Type to search"
            }
          >
            <ArrowRight size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      <div className="lp-chips">
        <button type="button" className="lp-chip" onClick={onOpenDashboard}>
          <LayoutDashboard size={15} strokeWidth={1.9} />
          Open {segmentLabel} dashboard
        </button>
        <button type="button" className="lp-chip" onClick={onOpenSettings}>
          <SlidersHorizontal size={15} strokeWidth={1.9} />
          Customize cards
        </button>
        <button type="button" className="lp-chip" onClick={onOpenIntegrations}>
          <Plug2 size={15} strokeWidth={1.9} />
          Integrations
        </button>
      </div>

      <div className="lp-hint">
        {topMatch ? (
          <>
            <kbd>Enter</kbd> expands <strong>{topMatch.title}</strong> ·{" "}
            {(values[topMatch.name] || []).length || 0} value
            {(values[topMatch.name] || []).length === 1 ? "" : "s"}
          </>
        ) : query.trim() ? (
          <>No card matched — try “tickets”, “leave” or “calendar”.</>
        ) : (
          <>
            Press <kbd>Enter</kbd> to expand the top match
          </>
        )}
      </div>
    </div>
  );
}
