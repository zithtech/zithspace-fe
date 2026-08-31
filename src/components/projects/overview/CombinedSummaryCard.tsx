import React from "react";
import { Card, Typography } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  AppstoreOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Text, Title } = Typography;

interface SummaryStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
}

interface CombinedSummaryCardProps {
  sprintSummary: SummaryStats;
  ticketSummary: SummaryStats;
}

const ROWS = [
  { key: "completed", label: "Completed", icon: <CheckCircleOutlined />, color: "#10b981" },
  { key: "inProgress", label: "In Progress", icon: <ClockCircleOutlined />, color: "#f59e0b" },
  { key: "notStarted", label: "Not Started", icon: <InfoCircleOutlined />, color: "#94a3b8" },
] as const;

const Segment = ({
  title,
  stats,
  icon,
  accent,
}: {
  title: string;
  stats: SummaryStats;
  icon: React.ReactNode;
  accent: string;
}) => {
  const completionPct =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: `${accent}12`,
              color: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
            }}
          >
            {icon}
          </div>
          <div>
            <Text
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--text-slate-400)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              {title}
            </Text>
            <Text style={{ fontSize: 11, color: "var(--text-slate-500)", fontWeight: 500 }}>
              {completionPct}% completion
            </Text>
          </div>
        </div>
        <Title level={3} style={{ margin: 0, fontWeight: 700, color: "var(--text-slate-900)" }}>
          {stats.total}
        </Title>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          borderRadius: 999,
          background: "var(--bg-secondary, #f1f5f9)",
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: `${completionPct}%`,
            height: "100%",
            background: accent,
            opacity: 0.85,
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      {/* Rows */}
      <div>
        {ROWS.map((row, idx) => (
          <div
            key={row.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 0",
              borderBottom: idx < ROWS.length - 1 ? "1px solid var(--border-color)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: row.color, fontSize: 12, display: "inline-flex" }}>{row.icon}</span>
              <Text style={{ fontSize: 12.5, color: "var(--text-slate-600)", fontWeight: 500 }}>
                {row.label}
              </Text>
            </div>
            <Text style={{ fontSize: 13, color: "var(--text-slate-900)", fontWeight: 700 }}>
              {stats[row.key]}
            </Text>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CombinedSummaryCard: React.FC<CombinedSummaryCardProps> = ({
  sprintSummary,
  ticketSummary,
}) => {
  return (
    <Card
      bordered={false}
      className="po-panel"
      style={{ height: "100%" }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: "flex", alignItems: "stretch", gap: 32 }}>
        <Segment
          title="Sprint Summary"
          stats={sprintSummary}
          icon={<AppstoreOutlined />}
          accent="#3b82f6"
        />
        <div style={{ width: 1, background: "var(--border-color)", flexShrink: 0 }} />
        <Segment
          title="Ticket Summary"
          stats={ticketSummary}
          icon={<BarChartOutlined />}
          accent="#8b5cf6"
        />
      </div>
    </Card>
  );
};
