import React, { useState, useMemo } from "react";
import { Typography, Avatar, Empty } from "antd";
import { TeamOutlined, SortAscendingOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface TeamMember {
  id: string;
  name: string;
  avatarUrl?: string;
  contribution: number;
  done: number;
  active: number;
  todo: number;
  assigned: number;
  totalHours: number;
}

interface TeamProgressTableProps {
  members: TeamMember[];
}

const SectionHeader: React.FC<{
  title: string;
  count?: number;
  icon: React.ReactNode;
  accent: string;
  extra?: React.ReactNode;
}> = ({ title, count, icon, accent, extra }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 18px",
      borderBottom: "1px solid var(--border-color)",
      flexShrink: 0,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${accent}12`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
        }}
      >
        {icon}
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
        {title}
      </Text>
      {count != null && (
        <span
          style={{
            padding: "1px 8px",
            borderRadius: 999,
            background: "var(--bg-secondary, #f1f5f9)",
            color: "var(--text-slate-600)",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {count}
        </span>
      )}
    </div>
    {extra}
  </div>
);

const StatChip: React.FC<{ label: string; value: number | string; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div
    style={{
      flex: 1,
      padding: "6px 8px",
      borderRadius: 8,
      background: "var(--bg-secondary, #f8fafc)",
      border: "1px solid var(--border-color)",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: 9,
        color: "var(--text-slate-400)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </div>
    <Text style={{ fontSize: 12, fontWeight: 700, color }}>{value}</Text>
  </div>
);

export const TeamProgressTable: React.FC<TeamProgressTableProps> = ({ members = [] }) => {
  const [sortDesc, setSortDesc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...members];
    copy.sort((a, b) =>
      sortDesc ? b.contribution - a.contribution : a.contribution - b.contribution
    );
    return copy;
  }, [members, sortDesc]);

  return (
    <div
      style={{
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-color)",
        borderRadius: 14,
        height: 600,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <SectionHeader
        title="Team Progress"
        count={members.length}
        icon={<TeamOutlined />}
        accent="#10b981"
        extra={
          <button
            onClick={() => setSortDesc((s) => !s)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text-slate-500)",
              background: "transparent",
              border: "1px solid var(--border-color)",
              cursor: "pointer",
            }}
          >
            <SortAscendingOutlined style={{ fontSize: 11, transform: sortDesc ? "scaleY(-1)" : "none" }} />
            Sort
          </button>
        }
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "0 18px" }}>
        {sorted.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>No team members</Text>}
            />
          </div>
        ) : (
          sorted.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "16px 0",
                borderBottom: "1px solid var(--border-color)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar
                    size={32}
                    src={item.avatarUrl}
                    style={{
                      backgroundColor: "var(--bg-secondary, #f1f5f9)",
                      color: "var(--text-slate-700)",
                      fontSize: 12,
                      border: "1px solid var(--border-color)",
                      fontWeight: 600,
                    }}
                  >
                    {item.name?.substring(0, 2).toUpperCase() || "UN"}
                  </Avatar>
                  <div style={{ minWidth: 0 }}>
                    <Text strong ellipsis style={{ fontSize: 13, color: "var(--text-slate-900)", display: "block" }}>
                      {item.name || "Unknown Member"}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: "var(--text-slate-400)", fontWeight: 500 }}>
                      Contributor
                    </Text>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <Text style={{ fontSize: 14, fontWeight: 700, color: "var(--text-slate-900)" }}>
                    {item.contribution || 0}%
                  </Text>
                  <div
                    style={{
                      fontSize: 9.5,
                      color: "var(--text-slate-400)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Contribution
                  </div>
                </div>
              </div>

              <div
                style={{
                  height: 4,
                  borderRadius: 999,
                  background: "var(--bg-secondary, #f1f5f9)",
                  overflow: "hidden",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: `${item.contribution || 0}%`,
                    height: "100%",
                    background: "#10b981",
                    opacity: 0.85,
                    borderRadius: 999,
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <StatChip label="Total" value={item.assigned || 0} color="#3b82f6" />
                <StatChip label="Done" value={item.done || 0} color="#10b981" />
                <StatChip label="Active" value={item.active || 0} color="#f59e0b" />
                <StatChip label="Hours" value={`${item.totalHours || 0}h`} color="var(--text-slate-700)" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
