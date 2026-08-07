"use client";

/**
 * QA links on a ticket.
 *
 * QA attaches the test scope, business scenarios (parent test cases) and test
 * runs that cover this ticket; PMs then open any of them in a new tab straight
 * from the drawer, without hunting through the QA workspace.
 *
 * The pickers only appear for users who can both edit the ticket and read the
 * corresponding QA list — everyone else gets the read-only linked list, which
 * is served with names denormalized so it needs no QA permission.
 */

import React, { useMemo, useState } from "react";
import { Typography, Button, Tag, Spin, message } from "antd";
import {
  ExportOutlined,
  DeleteOutlined,
  ExperimentOutlined,
  FileSearchOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { api as axios } from "@/lib/axios";
import SearchableDropdown, {
  SearchableDropdownOption,
} from "@/components/common/SearchableDropdown";
import { usePermission } from "@/hooks/usePermission";
import type { QaEntityType, TicketQaLink } from "@/services/ticketService";

const { Text } = Typography;

interface QaGroup {
  type: QaEntityType;
  /** Tab-level label, e.g. "Scope" */
  label: string;
  /** Empty-state / picker wording, e.g. "test scope" */
  noun: string;
  endpoint: string;
  /** Field on the QA record holding its display name. */
  nameKey: string;
  /** Secondary field shown under the name in the picker. */
  subKey: string;
  href: (id: string) => string;
  color: string;
  tint: string;
  icon: React.ReactNode;
}

const QA_GROUPS: QaGroup[] = [
  {
    type: "scope",
    label: "Scope",
    noun: "test scope",
    endpoint: "/api/v2/qa/test-scopes",
    nameKey: "name",
    subKey: "type",
    href: (id) => `/qa-workspace/test-scope/${id}`,
    color: "#1890ff",
    tint: "#e6f7ff",
    icon: <FileSearchOutlined />,
  },
  {
    type: "case",
    label: "Cases",
    noun: "test case",
    endpoint: "/api/v2/qa/parents",
    nameKey: "title",
    subKey: "module_name",
    href: (id) => `/qa-workspace/test-cases/${id}`,
    color: "#52c41a",
    tint: "#f6ffed",
    icon: <ExperimentOutlined />,
  },
  {
    type: "run",
    label: "Runs",
    noun: "test run",
    endpoint: "/api/v2/qa/runs/all",
    nameKey: "run_name",
    subKey: "suite_name",
    href: (id) => `/qa-workspace/test-runs/${id}`,
    color: "#64748b",
    tint: "#f1f5f9",
    icon: <PlayCircleOutlined />,
  },
];

interface QaLinksSectionProps {
  qaLinks: TicketQaLink[];
  isLoading: boolean;
  /** Ticket-update permission — gates the pickers and the remove buttons. */
  canEdit: boolean;
  onLink: (entityType: QaEntityType, entityId: string) => Promise<void>;
  onUnlink: (linkId: string) => Promise<void>;
  isLinking: boolean;
  isUnlinking: boolean;
}

/** Picker options for one QA list; skipped entirely when the user can't add. */
const useQaOptionsFor = (group: QaGroup, enabled: boolean) => {
  return useQuery({
    queryKey: ["qa-picker", group.type],
    queryFn: async () => {
      // The api helper unwraps { success, data } for us, but QA endpoints are
      // also hit through the raw client elsewhere — stay tolerant of both.
      const res: any = await axios.get(group.endpoint);
      return (Array.isArray(res) ? res : res?.data?.data || res?.data || []) as any[];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export default function QaLinksSection({
  qaLinks,
  isLoading,
  canEdit,
  onLink,
  onUnlink,
  isLinking,
  isUnlinking,
}: QaLinksSectionProps) {
  const { canReadScope, canReadCase, canReadRun, canManageQa } = usePermission();
  const [pendingType, setPendingType] = useState<QaEntityType | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const canPick: Record<QaEntityType, boolean> = {
    scope: canEdit && (canReadScope || canManageQa),
    case: canEdit && (canReadCase || canManageQa),
    run: canEdit && (canReadRun || canManageQa),
  };
  const showPickers = canPick.scope || canPick.case || canPick.run;

  const scopeOptions = useQaOptionsFor(QA_GROUPS[0], canPick.scope);
  const caseOptions = useQaOptionsFor(QA_GROUPS[1], canPick.case);
  const runOptions = useQaOptionsFor(QA_GROUPS[2], canPick.run);
  const optionQueries = {
    scope: scopeOptions,
    case: caseOptions,
    run: runOptions,
  } as const;

  const linksByType = useMemo(() => {
    const grouped: Record<QaEntityType, TicketQaLink[]> = { scope: [], case: [], run: [] };
    (qaLinks || []).forEach((l) => grouped[l.entity_type]?.push(l));
    return grouped;
  }, [qaLinks]);

  const handleLink = async (group: QaGroup, entityId: string) => {
    if (!entityId) return;
    setPendingType(group.type);
    try {
      await onLink(group.type, entityId);
      message.success(`${group.label} linked`);
    } catch (error) {
      console.error("Failed to link QA record:", error);
      message.error(`Failed to link ${group.noun}`);
    } finally {
      setPendingType(null);
    }
  };

  const handleUnlink = async (linkId: string) => {
    setRemovingId(linkId);
    try {
      await onUnlink(linkId);
      message.success("QA link removed");
    } catch (error) {
      console.error("Failed to remove QA link:", error);
      message.error("Failed to remove QA link");
    } finally {
      setRemovingId(null);
    }
  };

  const buildOptions = (group: QaGroup, rows: any[] | undefined): SearchableDropdownOption[] => {
    const linkedIds = new Set(linksByType[group.type].map((l) => l.entity_id));
    return (rows || [])
      .filter((r) => !linkedIds.has(r.id))
      .map((r) => ({
        value: r.id,
        label: r[group.nameKey] || "Untitled",
        description: [r[group.subKey], r.status].filter(Boolean).join(" • ") || undefined,
      }));
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Typography.Title level={5} style={{ fontSize: 13, margin: 0, color: "#595959" }}>
          QA Coverage
          <span style={{ fontSize: 12, color: "#bfbfbf", fontWeight: 400, marginLeft: 6 }}>
            • {qaLinks.length} linked
          </span>
        </Typography.Title>
      </div>

      {/* Pickers — one per QA record type */}
      {showPickers && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            padding: 12,
            marginBottom: 14,
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: 12,
          }}
        >
          {QA_GROUPS.filter((g) => canPick[g.type]).map((group) => {
            const query = optionQueries[group.type];
            return (
              <div key={group.type} style={{ flex: "1 1 180px", minWidth: 170 }}>
                <SearchableDropdown
                  value={null}
                  onChange={(val: string) => handleLink(group, val)}
                  options={buildOptions(group, query.data)}
                  triggerLabel={group.label}
                  placeholder={`Link ${group.noun}`}
                  searchPlaceholder={`Search ${group.label.toLowerCase()}`}
                  itemNoun={group.label.toLowerCase()}
                  loading={query.isLoading || (isLinking && pendingType === group.type)}
                  allowClear={false}
                  hideAvatar
                  width={300}
                  style={{ width: "100%" }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Linked records, grouped by type */}
      {isLoading ? (
        <div style={{ padding: "24px 0", textAlign: "center" }}>
          <Spin size="small" />
        </div>
      ) : qaLinks.length === 0 ? (
        <div
          style={{
            padding: "24px 0",
            textAlign: "center",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: 8,
            border: "1px dashed var(--border-color)",
          }}
        >
          <Text type="secondary" style={{ fontSize: 13 }}>
            {showPickers ? "No QA records linked yet" : "QA hasn't linked anything to this ticket"}
          </Text>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {QA_GROUPS.map((group) => {
            const items = linksByType[group.type];
            if (items.length === 0) return null;

            return (
              <div key={group.type}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#8c8c8c",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  {group.label} ({items.length})
                </Text>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.map((link) => (
                    <div
                      key={link.id}
                      className="qa-link-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "10px 12px",
                        backgroundColor: "var(--bg-secondary)",
                        border: "1px solid var(--border-color)",
                        borderRadius: 12,
                        transition: "all 0.2s",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: group.tint,
                          color: group.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {group.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <a
                          href={group.href(link.entity_id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="qa-link-title"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontWeight: 600,
                            fontSize: 13,
                            color: "#1890ff",
                            lineHeight: 1.4,
                          }}
                        >
                          <span style={{ wordBreak: "break-word" }}>
                            {link.name || "Untitled"}
                          </span>
                          <ExportOutlined style={{ fontSize: 11, color: "#bfbfbf", flexShrink: 0 }} />
                        </a>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          {link.status && (
                            <Tag
                              style={{
                                margin: 0,
                                fontSize: 10,
                                lineHeight: "16px",
                                padding: "0 6px",
                                borderRadius: 4,
                                color: group.color,
                                backgroundColor: group.tint,
                                border: "none",
                              }}
                            >
                              {link.status}
                            </Tag>
                          )}
                          {link.subtitle && (
                            <Text
                              type="secondary"
                              style={{ fontSize: 11, color: "#8c8c8c", wordBreak: "break-word" }}
                            >
                              {link.subtitle}
                            </Text>
                          )}
                        </div>
                      </div>

                      {canEdit && (
                        <div className="qa-link-actions" style={{ opacity: 0, transition: "opacity 0.2s" }}>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                            loading={isUnlinking && removingId === link.id}
                            onClick={() => handleUnlink(link.id)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .qa-link-card:hover {
          border-color: #1890ff40 !important;
          filter: brightness(0.98);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
          transform: translateY(-1px);
        }
        .qa-link-card:hover .qa-link-actions {
          opacity: 1 !important;
        }
        .qa-link-title:hover {
          color: #1890ff !important;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
