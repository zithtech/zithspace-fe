"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Drawer, Button } from "antd";
import { ChevronRight, ExternalLink } from "lucide-react";
import dayjs from "dayjs";
import { CalendarService, CalendarProvider } from "@/services/calendarService";
import { LinearService } from "@/services/linearService";
import { NotionService } from "@/services/notionService";
import {
  GoogleMark,
  MicrosoftMark,
  ZohoMark,
} from "@/app/integrations/integrations-ui";
import {
  LinearMark,
  NotionMark,
  JiraMark,
  GithubMark,
  SlackMark,
  AzureMark,
  TrelloMark,
} from "@/components/projects/bug-list/ticket-flow";

interface IntegrationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CALENDAR_PROVIDERS: Array<{
  key: CalendarProvider;
  name: string;
  tagline: string;
  mark: React.ReactNode;
}> = [
  {
    key: "GOOGLE",
    name: "Google Workspace",
    tagline: "Gmail threads and Google Calendar",
    mark: <GoogleMark />,
  },
  {
    key: "ZOHO",
    name: "Zoho Workspace",
    tagline: "Zoho Mail and Zoho Calendar",
    mark: <ZohoMark />,
  },
  {
    key: "MICROSOFT",
    name: "Microsoft 365",
    tagline: "Outlook mail and Microsoft calendars",
    mark: <MicrosoftMark />,
  },
];

const SOON = [
  { key: "jira", name: "Jira", tagline: "Issues & epics", mark: <JiraMark /> },
  { key: "github", name: "GitHub", tagline: "Repo issues & PRs", mark: <GithubMark /> },
  { key: "slack", name: "Slack", tagline: "Channel notifications", mark: <SlackMark /> },
  { key: "azure", name: "Azure DevOps", tagline: "Work items", mark: <AzureMark /> },
  { key: "trello", name: "Trello", tagline: "Cards & lists", mark: <TrelloMark /> },
];

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

export default function IntegrationsDrawer({
  open,
  onClose,
}: IntegrationsDrawerProps) {
  const router = useRouter();
  const [calendar, setCalendar] = useState<
    Record<string, { connected: boolean; lastSync: string | null }>
  >({});
  const [linear, setLinear] = useState(false);
  const [notion, setNotion] = useState<{ connected: boolean; workspaceName: string | null }>({
    connected: false,
    workspaceName: null,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);

    // Each probe is independent — one failing provider must not blank the rest.
    const calendarEntries = await Promise.all(
      CALENDAR_PROVIDERS.map(async (p) => {
        try {
          const status = await CalendarService.getStatus(p.key);
          return [p.key, { connected: !!status?.connected, lastSync: status?.lastSync ?? null }] as const;
        } catch {
          return [p.key, { connected: false, lastSync: null }] as const;
        }
      }),
    );
    setCalendar(Object.fromEntries(calendarEntries));

    try {
      const status = await LinearService.getStatus();
      setLinear(!!status?.connected);
    } catch {
      setLinear(false);
    }

    try {
      const status = await NotionService.getStatus();
      setNotion({
        connected: !!status?.connected,
        workspaceName: status?.workspaceName ?? null,
      });
    } catch {
      setNotion({ connected: false, workspaceName: null });
    }

    setLoading(false);
  }, []);

  // Only fetch while the drawer is actually open.
  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const row = (
    key: string,
    mark: React.ReactNode,
    name: string,
    detail: string,
    state: "connected" | "available" | "soon",
  ) => (
    <button
      key={key}
      type="button"
      className="lp-row"
      disabled={state === "soon"}
      onClick={() => {
        if (state === "soon") return;
        onClose();
        router.push("/integrations");
      }}
    >
      <span className="lp-row-icon lp-row-icon--plain">{mark}</span>
      <span className="lp-row-body">
        <span className="lp-row-title">
          <span>{name}</span>
          {state === "connected" && (
            <span className="lp-badge lp-badge--on">Connected</span>
          )}
          {state === "soon" && <span className="lp-badge">Coming soon</span>}
        </span>
        <span className="lp-row-trail">{detail}</span>
      </span>
      {state !== "soon" && (
        <ChevronRight size={15} strokeWidth={1.75} className="lp-chevron" />
      )}
    </button>
  );

  const connectedCount =
    Object.values(calendar).filter((c) => c.connected).length +
    (linear ? 1 : 0) +
    (notion.connected ? 1 : 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      title="Integrations"
      styles={{ body: { padding: 0 } }}
      extra={
        <Button
          type="text"
          size="small"
          icon={<ExternalLink size={14} />}
          onClick={() => {
            onClose();
            router.push("/integrations");
          }}
        >
          Full page
        </Button>
      }
    >
      <div className="lp-drawer">
        <div className="lp-drawer-sub">
          {loading
            ? "Checking connections..."
            : `${connectedCount} connected · ${SOON.length} coming soon`}
        </div>

        <div className="lp-group-label">Mail &amp; calendar</div>
        {CALENDAR_PROVIDERS.map((p) => {
          const status = calendar[p.key];
          return row(
            p.key,
            p.mark,
            p.name,
            status?.connected ? lastSyncLabel(status.lastSync) : p.tagline,
            status?.connected ? "connected" : "available",
          );
        })}

        <div className="lp-group-label">Project tools</div>
        {row(
          "linear",
          <LinearMark size={20} />,
          "Linear",
          linear ? "Issues syncing with Zukvo tickets" : "Sync Linear issues with tickets",
          linear ? "connected" : "available",
        )}
        {row(
          "notion",
          <NotionMark />,
          "Notion",
          notion.connected
            ? `Workspace: ${notion.workspaceName || "connected"}`
            : "Link Notion pages to your docs",
          notion.connected ? "connected" : "available",
        )}

        <div className="lp-group-label">Coming soon</div>
        {SOON.map((s) => row(s.key, s.mark, s.name, s.tagline, "soon"))}
      </div>
    </Drawer>
  );
}
