"use client";

import { Drawer, Empty, Spin, Tag, Typography, Button, Collapse, Avatar, Tooltip } from "antd";
import { History, User } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect } from "react";
import { useTransactionHistory } from "@/hooks/useTransactionHistory";
import { TransactionRow } from "@/services/transactionHistoryService";
import { useSocket } from "@/providers/SocketProvider";
import ActivityDiff, { InlineDiff } from "@/components/common/ActivityDiff";

dayjs.extend(relativeTime);

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  entityType?: string;
  entityId?: string;
  section?: string;
  module?: string;
  /** Override title; defaults to "Activity history" */
  title?: string;
  /** Tag the entity label (e.g. "TKT-123 — login broken") shown under the title */
  subtitle?: string;
  zIndex?: number;
}

const ACTION_COLOR: Record<string, string> = {
  create: "green",
  update: "blue",
  delete: "red",
  archive: "orange",
  restore: "cyan",
  permanent_delete: "red",
  status_change: "purple",
  move: "geekblue",
  convert: "magenta",
  verify: "green",
  reopen: "orange",
  start: "green",
  complete: "blue",
  generate_ai: "purple",
};

function actionColor(action: string): string {
  if (ACTION_COLOR[action]) return ACTION_COLOR[action];
  if (action.startsWith("bulk_")) return "geekblue";
  return "default";
}

function initials(name?: string | null, email?: string | null): string {
  const src = name?.trim() || email?.trim() || "";
  if (!src) return "?";
  const parts = src.split(/\s+|@/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || src[0].toUpperCase();
}

function HistoryRow({ row }: { row: TransactionRow }) {
  const created = dayjs(row.createdAt);
  const hasRaw =
    (row.beforeData && Object.keys(row.beforeData).length > 0) ||
    (row.afterData && Object.keys(row.afterData).length > 0) ||
    (row.metadata && Object.keys(row.metadata).length > 0);
  const singleField =
    row.changedFields && row.changedFields.length === 1 ? row.changedFields[0] : null;
  const displayLabel = singleField
    ? (row.actionLabel || row.action).replace(/\s*\(.*?\)\s*$/, "")
    : row.actionLabel || row.action;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "12px 0",
        borderBottom: "1px solid var(--border-color, #f0f0f0)",
      }}
    >
      <Avatar size={32} style={{ backgroundColor: "#e6f4ff", color: "#1677ff", flexShrink: 0 }}>
        {initials(row.actor?.name, row.actor?.email)}
      </Avatar>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <Text strong>{row.actor?.name || row.actor?.email || "Unknown"}</Text>
          <Tag color={actionColor(row.action)} style={{ marginRight: 0 }}>
            {row.action}
          </Tag>
          <Tooltip title={created.format("YYYY-MM-DD HH:mm:ss")}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {created.fromNow()}
            </Text>
          </Tooltip>
        </div>
        <div style={{ marginTop: 2, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "baseline" }}>
          <Text>{displayLabel}</Text>
          {singleField && (
            <>
              <span style={{ color: "var(--text-slate-300, #cbd5e1)" }}>·</span>
              <span style={{ fontSize: 12 }}>
                <InlineDiff row={row} field={singleField} />
              </span>
            </>
          )}
        </div>
        {!singleField && <ActivityDiff row={row} />}
        {hasRaw && (
          <Collapse
            ghost
            size="small"
            style={{ marginTop: 4 }}
            items={[
              {
                key: "1",
                label: <Text type="secondary" style={{ fontSize: 11 }}>Show raw</Text>,
                children: (
                  <div style={{ fontSize: 11, lineHeight: 1.5 }}>
                    {row.beforeData && Object.keys(row.beforeData).length > 0 && (
                      <pre style={preStyle}>
                        <Text type="secondary">before: </Text>
                        {JSON.stringify(row.beforeData, null, 2)}
                      </pre>
                    )}
                    {row.afterData && Object.keys(row.afterData).length > 0 && (
                      <pre style={preStyle}>
                        <Text type="secondary">after: </Text>
                        {JSON.stringify(row.afterData, null, 2)}
                      </pre>
                    )}
                    {row.metadata && Object.keys(row.metadata).length > 0 && (
                      <pre style={preStyle}>
                        <Text type="secondary">metadata: </Text>
                        {JSON.stringify(row.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}

const preStyle: React.CSSProperties = {
  background: "var(--neutral-50, #fafafa)",
  border: "1px solid var(--border-color, #f0f0f0)",
  borderRadius: 6,
  padding: 8,
  marginTop: 4,
  overflow: "auto",
  fontSize: 11,
};

export default function TransactionHistoryDrawer({
  open,
  onClose,
  entityType,
  entityId,
  section,
  module,
  title = "Activity history",
  subtitle,
  zIndex = 1000,
}: Props) {
  const { rows, loading, loadingMore, hasMore, error, loadMore, refresh } = useTransactionHistory({
    entityType,
    entityId,
    section,
    module,
    enabled: open,
    limit: 20,
  });

  // Realtime: when a new transaction arrives for this entity while the drawer
  // is open, pull a fresh page so the user sees it without closing/reopening.
  const { socket } = useSocket();
  useEffect(() => {
    if (!socket || !open) return;
    const handler = (row: any) => {
      if (
        (entityType && entityId && row?.entityType === entityType && row?.entityId === entityId) ||
        (!entityId && module && row?.module === module) ||
        (!entityId && !module && section && row?.section === section)
      ) {
        refresh();
      }
    };
    socket.on("transaction:created", handler);
    return () => {
      socket.off("transaction:created", handler);
    };
  }, [socket, open, entityType, entityId, section, module, refresh]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      zIndex={zIndex}
      width={480}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <History size={16} strokeWidth={1.75} />
          <span>{title}</span>
        </div>
      }
      extra={
        subtitle ? (
          <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
            {subtitle}
          </Text>
        ) : null
      }
      styles={{ body: { padding: "8px 20px" } }}
    >
      {loading && rows.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48 }}>
          <Spin />
        </div>
      ) : error ? (
        <Empty
          image={<User size={32} strokeWidth={1.5} style={{ color: "var(--text-secondary, #8c8c8c)" }} />}
          description={error}
        />
      ) : rows.length === 0 ? (
        <Empty description="No activity yet" />
      ) : (
        <>
          {rows.map((row) => (
            <HistoryRow key={row.id} row={row} />
          ))}
          {hasMore && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <Button onClick={loadMore} loading={loadingMore} block>
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
