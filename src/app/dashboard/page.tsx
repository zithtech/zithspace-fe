"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import CardsPanel, {
  filterCards,
  useSegmentCards,
  VisibleCard,
} from "@/components/dashboard/launchpad/CardsPanel";
import CommandHero from "@/components/dashboard/launchpad/CommandHero";
import IntegrationsDrawer from "@/components/dashboard/launchpad/IntegrationsDrawer";
import DashboardSettingsDrawer from "@/components/dashboard/launchpad/DashboardSettingsDrawer";
import { useCardValues } from "@/components/dashboard/launchpad/useCardValues";
import {
  DEFAULT_SETTINGS,
  DashboardSegment,
} from "@/components/dashboard/launchpad/dashboardCards";
import { dashboardService } from "@/services/dashboardService";
import { useAuth } from "@/context/AuthContext";
import "@/components/dashboard/launchpad/launchpad.css";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [segment, setSegment] = useState<DashboardSegment>("me");
  const [query, setQuery] = useState("");
  const [settings, setSettings] =
    useState<Record<string, boolean>>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [integrationsOpen, setIntegrationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { values, actions, loading: valuesLoading } = useCardValues();

  // Card visibility comes from the same endpoint the settings page writes to,
  // so hiding a card there greys it out here too.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const data = await dashboardService.getSettings();
        if (cancelled) return;
        setSettings({ ...DEFAULT_SETTINGS, ...(data?.visibleCards || {}) });
      } catch (error) {
        console.error("Failed to fetch dashboard settings", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const cards = useSegmentCards(segment, settings);

  // One ranking feeds both panes: the card the panel lists first is the card
  // the hero's Enter expands.
  const topMatch = useMemo<VisibleCard | undefined>(
    () => (query.trim() ? filterCards(cards, query, values)[0] : undefined),
    [cards, query, values],
  );

  const toggleExpand = useCallback((name: string) => {
    setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const expandCard = useCallback((card: VisibleCard) => {
    setExpanded((prev) => ({ ...prev, [card.name]: true }));
  }, []);

  const openOverview = useCallback(() => {
    router.push(`/dashboard/overview?view=${segment}`);
  }, [router, segment]);

  return (
    <MainLayout hideSideNav noPadding>
      <div className="lp-shell">
        <CardsPanel
          segment={segment}
          onSegmentChange={setSegment}
          query={query}
          onQueryChange={setQuery}
          settings={settings}
          values={values}
          actions={actions}
          loading={loading}
          valuesLoading={valuesLoading}
          expanded={expanded}
          onToggleExpand={toggleExpand}
          onOpenIntegrations={() => setIntegrationsOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="lp-right">
          <CommandHero
            segment={segment}
            cards={cards}
            values={values}
            query={query}
            onQueryChange={setQuery}
            topMatch={topMatch}
            onCardExpand={expandCard}
            onOpenDashboard={openOverview}
            onOpenIntegrations={() => setIntegrationsOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </main>
      </div>

      <IntegrationsDrawer
        open={integrationsOpen}
        onClose={() => setIntegrationsOpen(false)}
      />

      <DashboardSettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        segment={segment}
        onSegmentChange={setSegment}
        onSaved={setSettings}
      />
    </MainLayout>
  );
}
