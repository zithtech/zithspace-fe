import NoData from "@/components/common/NoData";
import React from "react";
import { Typography, Empty } from "antd";
import { HistoryOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
const { Text } = Typography;

interface Activity {
  id: string;
  action: string;
  userName: string;
  ticketNumber: string;
  ticketTitle: string;
  timestamp: Date;
}

interface RecentActivitiesPanelProps {
  activities: Activity[];
  height?: number | string;
}

const ACTION_COLOR: Record<string, string> = {
  created: "#3b82f6",
  updated: "#f59e0b",
  completed: "#10b981",
  closed: "#10b981",
  deleted: "#ef4444",
  assigned: "#8b5cf6",
};

const colorForAction = (action: string) => {
  const k = (action || "").toLowerCase();
  for (const key of Object.keys(ACTION_COLOR)) {
    if (k.includes(key)) return ACTION_COLOR[key];
  }
  return "#94a3b8";
};

export const RecentActivitiesPanel: React.FC<RecentActivitiesPanelProps> = ({ activities, height = 292 }) => {
  return (
    <div
      style={{
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-color)",
        borderRadius: 0,
        height,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-color)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "rgba(139, 92, 246, 0.10)",
            color: "#8b5cf6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
          }}
        >
          <HistoryOutlined />
        </div>
        <Text
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-slate-900)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Recent Activity
        </Text>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
        {activities.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <NoData description={<Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>No recent activity</Text>} />
          </div>
        ) : (
          <div style={{ position: "relative", paddingLeft: 16 }}>
            {/* Vertical line */}
            <div
              style={{
                position: "absolute",
                top: 6,
                bottom: 6,
                left: 5,
                width: 1,
                background: "var(--border-color)",
              }}
            />

            {activities.map((item) => {
              const dot = colorForAction(item.action);
              return (
                <div key={item.id} style={{ position: "relative", marginBottom: 14 }}>
                  <span
                    style={{
                      position: "absolute",
                      left: -16,
                      top: 4,
                      width: 11,
                      height: 11,
                      borderRadius: "50%",
                      background: dot,
                      boxShadow: `0 0 0 3px var(--bg-pure-white), 0 0 0 4px ${dot}30`,
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <Text strong style={{ fontSize: 12, color: "var(--text-slate-900)" }}>
                        {item.userName}
                      </Text>
                      <Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>
                        {item.action.toLowerCase()}
                      </Text>
                      <Text style={{ fontSize: 12, fontWeight: 700, color: "var(--premium-blue)" }}>
                        {item.ticketNumber}
                      </Text>
                    </div>
                    <Text
                      ellipsis
                      style={{ fontSize: 11.5, color: "var(--text-slate-600)", maxWidth: "100%" }}
                    >
                      {item.ticketTitle}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: "var(--text-slate-400)", fontWeight: 500 }}>
                      {dayjs(item.timestamp).fromNow()}
                    </Text>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
