import React from "react";
import { Typography, Empty } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface Sprint {
  id: string;
  name: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  progress: number;
  ticketCount: number;
  completedCount: number;
}

interface SprintProgressListProps {
  sprints: Sprint[];
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

export const SprintProgressList: React.FC<SprintProgressListProps> = ({ sprints }) => {
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
        title="Sprints"
        count={sprints.length}
        icon={<ThunderboltOutlined />}
        accent="#3b82f6"
      />

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 18px" }}>
        {sprints.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>No sprints yet</Text>}
            />
          </div>
        ) : (
          sprints.map((item) => {
            const isComplete = item.progress === 100;
            const accent = isComplete ? "#10b981" : "#3b82f6";
            return (
              <div
                key={item.id}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <Text
                    strong
                    style={{ fontSize: 13, color: "var(--text-slate-900)" }}
                    ellipsis
                  >
                    {item.name}
                  </Text>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "1px 8px",
                      borderRadius: 6,
                      background: `${accent}10`,
                    }}
                  >
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: accent }} />
                    <Text style={{ fontSize: 10, fontWeight: 600, color: accent, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {isComplete ? "Completed" : "Active"}
                    </Text>
                  </div>
                </div>

                <div
                  style={{
                    height: 4,
                    borderRadius: 999,
                    background: "var(--bg-secondary, #f1f5f9)",
                    overflow: "hidden",
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: `${item.progress}%`,
                      height: "100%",
                      background: accent,
                      opacity: 0.85,
                      borderRadius: 999,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: "var(--text-slate-500)", fontWeight: 500 }}>
                    {item.startDate ? dayjs(item.startDate).format("MMM D") : "—"} →{" "}
                    {item.endDate ? dayjs(item.endDate).format("MMM D") : "—"}
                  </Text>
                  <Text style={{ fontSize: 11, color: "var(--text-slate-600)", fontWeight: 600 }}>
                    {item.completedCount}/{item.ticketCount} tickets
                  </Text>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
