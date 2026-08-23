"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { App, Modal } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import {
  Blocks,
  Search,
  X,
  RefreshCw,
  AlertCircle,
  Mail,
  Ticket as TicketIcon,
  FileText,
  Sparkles,
  ShieldCheck,
  PlugZap,
} from "lucide-react";

import MainLayout from "@/components/layout/MainLayout";
import ZukvoLoader from "@/components/common/ZukvoLoader";
import { useActivitySource } from "@/hooks/useActivitySource";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usePermission } from "@/hooks/usePermission";
import { CalendarService, CalendarProvider, CalendarStatus } from "@/services/calendarService";
import { LinearService } from "@/services/linearService";
import { NotionService, NotionStatus } from "@/services/notionService";
import {
  LinearMark,
  JiraMark,
  GithubMark,
  SlackMark,
  NotionMark,
  AzureMark,
  TrelloMark,
} from "@/components/projects/bug-list/ticket-flow";
import {
  GoogleMark,
  MicrosoftMark,
  ZohoMark,
  IntegrationCard,
  integrationStyles,
} from "./integrations-ui";

/* ────────────────────────── Catalogue ────────────────────────── */

interface ProviderConfig {
  key: CalendarProvider;
  name: string;
  mark: React.ReactNode;
  category: string;
  description: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    key: "GOOGLE",
    name: "Google Workspace",
    mark: <GoogleMark />,
    category: "Mail & calendar",
    description: "Sync Gmail threads and Google Calendar meetings straight into your Zukvo workspace.",
  },
  {
    key: "ZOHO",
    name: "Zoho Workspace",
    mark: <ZohoMark />,
    category: "Mail & calendar",
    description: "Read Zoho Mail and manage Zoho Calendar events without leaving Zukvo.",
  },
  {
    key: "MICROSOFT",
    name: "Microsoft 365",
    mark: <MicrosoftMark />,
    category: "Mail & calendar",
    description: "Bring Outlook mail and Microsoft 365 calendars into one unified schedule.",
  },
];

const SOON = [
  { key: "jira", name: "Jira", tagline: "Issues & epics", logo: <JiraMark /> },
  { key: "github", name: "GitHub", tagline: "Repo issues & PRs", logo: <GithubMark /> },
  { key: "slack", name: "Slack", tagline: "Channel notifications", logo: <SlackMark /> },
  { key: "azure", name: "Azure DevOps", tagline: "Work items", logo: <AzureMark /> },
  { key: "trello", name: "Trello", tagline: "Cards & lists", logo: <TrelloMark /> },
];

type TabKey = "all" | "connected" | "available";

function lastSyncLabel(iso?: string | null) {
  if (!iso) return "Never synced";
  const d = dayjs(iso);
  if (!d.isValid()) return "Never synced";
  const mins = dayjs().diff(d, "minute");
  if (mins < 1) return "Synced just now";
  if (mins < 60) return `Synced ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  return `Synced ${d.format("MMM D")}`;
}

/* ────────────────────────── Page ────────────────────────── */

function IntegrationContent() {
  useActivitySource({ section: "HOME", module: "Integrations", page: "IntegrationPage" });

  const { message: messageApi } = App.useApp();
  const { theme } = useTheme();
  const { canReadMail, canReadCalendar } = usePermission();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [statuses, setStatuses] = useState<Record<string, CalendarStatus | null>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [linearConnected, setLinearConnected] = useState(false);
  const [linearLoading, setLinearLoading] = useState(false);
  const [notion, setNotion] = useState<NotionStatus>({
    connected: false,
    workspaceName: null,
    connectedAt: null,
  });
  const [notionLoading, setNotionLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);

  const userName = user?.name || "You";
  const canManage = canReadMail || canReadCalendar;

  const fetchStatuses = useCallback(async () => {
    const newStatuses: Record<string, CalendarStatus | null> = {};
    for (const provider of PROVIDERS) {
      try {
        newStatuses[provider.key] = await CalendarService.getStatus(provider.key);
      } catch {
        newStatuses[provider.key] = { connected: false, provider: provider.key, lastSync: null };
      }
    }
    setStatuses(newStatuses);

    try {
      const linearStatus = await LinearService.getStatus();
      setLinearConnected(linearStatus.connected);
    } catch (error) {
      console.error("Failed to fetch Linear status:", error);
      setLinearConnected(false);
    }

    try {
      setNotion(await NotionService.getStatus());
    } catch (error) {
      console.error("Failed to fetch Notion status:", error);
      setNotion({ connected: false, workspaceName: null, connectedAt: null });
    }

    setLoadedOnce(true);
  }, []);

  useEffect(() => {
    if (canManage) fetchStatuses();
  }, [canManage, fetchStatuses]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchStatuses();
    } catch (error) {
      console.error("Failed to refresh statuses:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    const provider = searchParams.get("provider");

    if (success === "linear_connected") {
      messageApi.success("Successfully connected to Linear!");
      router.replace("/integrations");
    } else if (success === "true" && provider === "notion") {
      messageApi.success("Successfully connected to Notion!");
      router.replace("/integrations");
    } else if (error) {
      const label =
        error.startsWith("notion") || provider === "notion" ? "Notion" : "Linear";
      messageApi.error(`Failed to connect to ${label}: ${error}`);
      router.replace("/integrations");
    }
  }, [searchParams, messageApi, router]);

  const hasShownError = useRef(false);
  useEffect(() => {
    if (!authLoading && user && !canManage && !hasShownError.current) {
      messageApi.error(
        "Access Denied: You don't have the required permissions (Mail or Calendar) to manage integrations. Please contact your administrator."
      );
      hasShownError.current = true;
    }
  }, [canManage, authLoading, user, messageApi]);

  /* ── Actions (behaviour unchanged) ── */

  const performConnection = async (provider: CalendarProvider) => {
    setLoading((prev) => ({ ...prev, [provider]: true }));
    try {
      const url = await CalendarService.getConnectUrl(provider);
      window.location.href = url;
    } catch (error: any) {
      messageApi.error(error.message || `Failed to connect to ${provider}`);
      setLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleConnect = async (provider: CalendarProvider) => {
    if (!canReadCalendar && !canReadMail) {
      messageApi.error(
        "Permission Denied: You don't have the required permissions (Mail or Calendar) to connect this integration."
      );
      return;
    }
    if (!canReadCalendar) {
      messageApi.error("Calendar Permission Required: You don't have permission to connect calendars.");
      return;
    }
    const token = localStorage.getItem("accessToken");
    if (!token) {
      messageApi.warning("Please log in to connect your calendar");
      window.location.href = "/login?redirect=/integrations";
      return;
    }

    const anyConnected = Object.values(statuses).some((s) => s?.connected);
    if (statuses[provider]?.connected) {
      messageApi.info(`${provider} is already connected`);
      return;
    }

    if (anyConnected) {
      Modal.confirm({
        title: "Switch Calendar Provider?",
        content: "Connecting a new provider will disconnect the current one. Continue?",
        okText: "Yes, Switch",
        cancelText: "No",
        onOk: async () => performConnection(provider),
      });
    } else {
      performConnection(provider);
    }
  };

  const handleDisconnect = async (provider: CalendarProvider) => {
    if (!canReadCalendar && !canReadMail) {
      messageApi.error("Permission Denied: You don't have permission to manage integrations.");
      return;
    }
    setLoading((prev) => ({ ...prev, [provider]: true }));
    try {
      await CalendarService.disconnect(provider);
      messageApi.success(`${provider} disconnected successfully`);
      await fetchStatuses();
    } catch (error: any) {
      messageApi.error(error.message || `Failed to disconnect ${provider}`);
    } finally {
      setLoading((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const handleLinearConnect = async () => {
    setLinearLoading(true);
    try {
      const url = await LinearService.getConnectUrl();
      window.location.href = url;
    } catch (error: any) {
      messageApi.error(error.message || "Failed to connect to Linear");
      setLinearLoading(false);
    }
  };

  const handleLinearDisconnect = async () => {
    setLinearLoading(true);
    try {
      await LinearService.disconnect();
      messageApi.success("Linear disconnected successfully");
      await fetchStatuses();
    } catch (error: any) {
      messageApi.error(error.message || "Failed to disconnect Linear");
    } finally {
      setLinearLoading(false);
    }
  };

  const handleNotionConnect = async () => {
    setNotionLoading(true);
    try {
      const url = await NotionService.getConnectUrl("/integrations");
      window.location.href = url;
    } catch (error: any) {
      messageApi.error(error.message || "Failed to connect to Notion");
      setNotionLoading(false);
    }
  };

  const handleNotionDisconnect = async () => {
    setNotionLoading(true);
    try {
      await NotionService.disconnect();
      messageApi.success("Notion disconnected successfully");
      await fetchStatuses();
    } catch (error: any) {
      messageApi.error(error.message || "Failed to disconnect Notion");
    } finally {
      setNotionLoading(false);
    }
  };

  /* ── Derived ── */

  const q = searchText.trim().toLowerCase();
  const anyProviderConnected = Object.values(statuses).some((s) => s?.connected);
  const activeProvider = PROVIDERS.find((p) => statuses[p.key]?.connected) || null;

  const totalCount = PROVIDERS.length + 2;
  const connectedCount =
    Object.values(statuses).filter((s) => s?.connected).length +
    (linearConnected ? 1 : 0) +
    (notion.connected ? 1 : 0);
  const availableCount = totalCount - connectedCount;
  const pct = Math.round((connectedCount / totalCount) * 100);

  const matches = (name: string, desc: string, connected: boolean) => {
    const hit = !q || `${name} ${desc}`.toLowerCase().includes(q);
    if (activeTab === "connected") return hit && connected;
    if (activeTab === "available") return hit && !connected;
    return hit;
  };

  const mailProviders = useMemo(
    () => PROVIDERS.filter((p) => matches(p.name, p.description, !!statuses[p.key]?.connected)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, activeTab, statuses]
  );

  const LINEAR_DESC = "Push bugs into Linear as issues and keep status in sync both ways.";
  const showLinear = matches("Linear", LINEAR_DESC, linearConnected);

  const NOTION_DESC = "Import Notion pages and databases into a Document Hub, keeping the original structure.";
  const showNotion = matches("Notion", NOTION_DESC, notion.connected);

  const visibleSoon = useMemo(
    () =>
      activeTab === "connected"
        ? []
        : SOON.filter((s) => !q || `${s.name} ${s.tagline}`.toLowerCase().includes(q)),
    [q, activeTab]
  );

  const nothing = mailProviders.length === 0 && !showLinear && !showNotion && visibleSoon.length === 0;

  if (authLoading) {
    return (
      <MainLayout>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
          <ZukvoLoader size="lg" message="Loading permissions..." />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <style>{integrationStyles}</style>

      <div className={`intg ${theme === "dark" ? "intg-dark" : "intg-light"}`} style={{ margin: "0 -24px" }}>
        {/* ── Hero ── */}
        <header className="intg-hero">
          <div className="intg-hero-glow" aria-hidden />

          <div className="intg-hero-row">
            <span className="intg-hero-mark">
              <Blocks size={18} />
            </span>

            <div className="intg-hero-text">
              <div className="intg-eyebrow">
                <span className="intg-eyebrow-dot" />
                Workspace · Connections
              </div>
              <div className="intg-titlerow">
                <h1 className="intg-h1">Integrations</h1>
                <span className="intg-divider" aria-hidden />
                <p className="intg-lede">
                  Connect mail, calendars and issue trackers — kept in step automatically.
                </p>
              </div>
            </div>

            <div className="intg-hero-actions">
              <button
                className="intg-iconbtn"
                onClick={handleRefresh}
                disabled={refreshing || !canManage}
                aria-label="Refresh connection status"
                title="Refresh connection status"
              >
                <RefreshCw size={15} className={refreshing ? "intg-spin" : undefined} />
              </button>
            </div>
          </div>

          <div className="intg-summary">
            <div className="intg-summary-main">
              <div className="intg-summary-line">
                <span className="intg-summary-count">
                  {connectedCount}/{totalCount}
                </span>
                integrations connected
              </div>
              <div className="intg-summary-rail">
                <span style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="intg-summary-chips">
              {activeProvider ? (
                <span className="intg-chip is-ok">
                  <span className="intg-chip-logo">{activeProvider.mark}</span>
                  {activeProvider.name}
                </span>
              ) : (
                <span className="intg-chip">
                  <Mail size={12} />
                  No mail provider
                </span>
              )}

              <span className={`intg-chip ${linearConnected ? "is-ok" : ""}`}>
                <span className="intg-chip-logo">
                  <LinearMark size={12} />
                </span>
                Linear {linearConnected ? "connected" : "not connected"}
              </span>

              <span className={`intg-chip ${notion.connected ? "is-ok" : ""}`}>
                <span className="intg-chip-logo">
                  <NotionMark size={12} />
                </span>
                Notion {notion.connected ? "connected" : "not connected"}
              </span>

              <span className="intg-chip">
                <ShieldCheck size={12} />
                Signed in as {userName}
              </span>
            </div>
          </div>
        </header>

        {/* ── Permission banner ── */}
        {!canManage && (
          <div className="intg-banner" style={{ marginTop: 20 }}>
            <AlertCircle size={16} />
            <div>
              <div className="intg-banner-title">You can view this page, but not change anything</div>
              <div className="intg-banner-sub">
                Managing integrations needs Mail or Calendar permission. Ask an administrator to
                grant access if you need to connect a provider.
              </div>
            </div>
          </div>
        )}

        {/* ── Toolbar ── */}
        <div className="intg-toolbar">
          <label className="intg-search">
            <Search size={14} />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search integrations…"
              aria-label="Search integrations"
            />
            {searchText && (
              <button onClick={() => setSearchText("")} aria-label="Clear search">
                <X size={12} />
              </button>
            )}
          </label>

          <div className="intg-seg" role="tablist" aria-label="Filter integrations">
            {(
              [
                ["all", "All", totalCount],
                ["connected", "Connected", connectedCount],
                ["available", "Available", availableCount],
              ] as [TabKey, string, number][]
            ).map(([key, label, n]) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeTab === key}
                className={`intg-seg-btn ${activeTab === key ? "is-active" : ""}`}
                onClick={() => setActiveTab(key)}
              >
                {label}
                <span className="intg-seg-count">{n}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="intg-body">
          {canManage && !loadedOnce ? (
            <>
              <div className="intg-section">
                <span className="intg-section-icon">
                  <Mail size={12} />
                </span>
                <span className="intg-section-title">Mail & calendar</span>
              </div>
              <div className="intg-grid">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="intg-skel" />
                ))}
              </div>
            </>
          ) : (
            <>
              {mailProviders.length > 0 && (
                <>
                  <div className="intg-section">
                    <span className="intg-section-icon">
                      <Mail size={12} />
                    </span>
                    <span className="intg-section-title">Mail & calendar</span>
                    <span className="intg-section-count">{mailProviders.length}</span>
                    <span className="intg-section-hint">One provider at a time</span>
                  </div>

                  <div className="intg-grid">
                    {mailProviders.map((provider) => {
                      const status = statuses[provider.key];
                      const isConnected = !!status?.connected;
                      return (
                        <IntegrationCard
                          key={provider.key}
                          mark={provider.mark}
                          name={provider.name}
                          category={provider.category}
                          description={provider.description}
                          state={isConnected ? "connected" : anyProviderConnected ? "switchable" : "available"}
                          detail={lastSyncLabel(status?.lastSync)}
                          accountName={userName}
                          busy={!!loading[provider.key]}
                          onConnect={() => handleConnect(provider.key)}
                          onDisconnect={() => handleDisconnect(provider.key)}
                          disabled={!canManage}
                          disabledReason="Needs Mail or Calendar permission"
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {showLinear && (
                <>
                  <div className="intg-section">
                    <span className="intg-section-icon">
                      <TicketIcon size={12} />
                    </span>
                    <span className="intg-section-title">Issue tracking</span>
                    <span className="intg-section-count">1</span>
                    <span className="intg-section-hint">Powers ticket creation from the Bug List</span>
                  </div>

                  <div className="intg-grid">
                    <IntegrationCard
                      mark={<LinearMark size={20} />}
                      name="Linear"
                      category="Issue tracking"
                      description={LINEAR_DESC}
                      state={linearConnected ? "connected" : "available"}
                      detail="Two-way status sync"
                      accountName={userName}
                      busy={linearLoading}
                      onConnect={handleLinearConnect}
                      onDisconnect={handleLinearDisconnect}
                    />
                  </div>
                </>
              )}

              {showNotion && (
                <>
                  <div className="intg-section">
                    <span className="intg-section-icon">
                      <FileText size={12} />
                    </span>
                    <span className="intg-section-title">Docs & knowledge</span>
                    <span className="intg-section-count">1</span>
                    <span className="intg-section-hint">Powers imports in the Document Hub</span>
                  </div>

                  <div className="intg-grid">
                    <IntegrationCard
                      mark={<NotionMark size={20} />}
                      name="Notion"
                      category="Docs & knowledge"
                      description={NOTION_DESC}
                      state={notion.connected ? "connected" : "available"}
                      detail={
                        notion.workspaceName
                          ? `${notion.workspaceName} workspace`
                          : notion.connectedAt
                            ? `Linked ${dayjs(notion.connectedAt).format("MMM D, YYYY")}`
                            : "Pages & databases"
                      }
                      accountName={notion.workspaceName || userName}
                      busy={notionLoading}
                      onConnect={handleNotionConnect}
                      onDisconnect={handleNotionDisconnect}
                    />
                  </div>
                </>
              )}

              {visibleSoon.length > 0 && (
                <>
                  <div className="intg-section">
                    <span className="intg-section-icon">
                      <Sparkles size={12} />
                    </span>
                    <span className="intg-section-title">On the roadmap</span>
                    <span className="intg-section-count">{visibleSoon.length}</span>
                    <span className="intg-section-hint">Not available yet</span>
                  </div>

                  <div className="intg-mini-grid">
                    {visibleSoon.map((s) => (
                      <div key={s.key} className="intg-mini" aria-disabled>
                        <span className="intg-mini-logo">{s.logo}</span>
                        <div className="intg-mini-text">
                          <div className="intg-mini-name">{s.name}</div>
                          <div className="intg-mini-tag">{s.tagline}</div>
                        </div>
                        <span className="intg-mini-badge">Soon</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {nothing && (
                <div className="intg-empty">
                  <PlugZap size={22} />
                  <div className="intg-empty-title">
                    {q ? `No integration matches “${searchText}”` : "Nothing to show here"}
                  </div>
                  <div className="intg-empty-sub">
                    {activeTab === "connected"
                      ? "You haven't connected anything yet. Switch to All to see what's available."
                      : "Try a different search term, or clear the filters."}
                  </div>
                  <button
                    className="intg-empty-btn"
                    onClick={() => {
                      setSearchText("");
                      setActiveTab("all");
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

export default function IntegrationPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
            <ZukvoLoader size="lg" message="Loading..." />
          </div>
        </MainLayout>
      }
    >
      <IntegrationContent />
    </Suspense>
  );
}
