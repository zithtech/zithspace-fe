import NoData from "@/components/common/NoData";
import React from "react";
import { Typography, Empty } from "antd";
import {
  BulbOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface InsightsPanelProps {
  insights: string[];
  height?: number | string;
}

const classify = (text: string) => {
  const t = text.toLowerCase();
  if (t.includes("behind") || t.includes("delay") || t.includes("risk") || t.includes("overdue")) {
    return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", icon: <WarningOutlined /> };
  }
  if (t.includes("imbalance") || t.includes("warning") || t.includes("watch")) {
    return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", icon: <ExclamationCircleOutlined /> };
  }
  if (t.includes("ahead") || t.includes("on track") || t.includes("good") || t.includes("complete")) {
    return { color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", icon: <CheckCircleOutlined /> };
  }
  return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", icon: <BulbOutlined /> };
};

const HEAD_TINT = "rgba(245, 158, 11, 0.10)";
const HEAD_COLOR = "#f59e0b";

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights, height = 292 }) => {
  return (
    <div className="po-panel" style={{ height }}>
      <div className="po-panel__head">
        <div className="po-panel__head-ic" style={{ background: HEAD_TINT, color: HEAD_COLOR }}>
          <BulbOutlined />
        </div>
        <Text className="po-panel__title">
          Insights
        </Text>
      </div>

      <div className="po-panel__body">
        {insights.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
            <NoData description={<Text style={{ fontSize: 12, color: "var(--text-slate-500)" }}>No insights yet</Text>} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {insights.map((item, idx) => {
              const c = classify(item);
              return (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: c.bg,
                    border: `1px solid ${c.color}20`,
                  }}
                >
                  <span style={{ color: c.color, fontSize: 14, marginTop: 1 }}>{c.icon}</span>
                  <Text style={{ fontSize: 12.5, color: "var(--text-slate-700)", lineHeight: 1.5 }}>
                    {item}
                  </Text>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
