import React from "react";
import { Typography } from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  RiseOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface TimeStatsBarProps {
  hoursLogged: number;
  daysWorked: number;
}

const Stat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent: string;
}> = ({ icon, label, value, hint, accent }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 10,
        background: `${accent}12`,
        color: accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <Text
        style={{
          display: "block",
          fontSize: 10.5,
          fontWeight: 600,
          color: "var(--text-slate-400)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </Text>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <Text style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-900)" }}>
          {value}
        </Text>
        {hint && (
          <Text style={{ fontSize: 11, color: "var(--text-slate-500)", fontWeight: 500 }}>
            {hint}
          </Text>
        )}
      </div>
    </div>
  </div>
);

export const TimeStatsBar: React.FC<TimeStatsBarProps> = ({ hoursLogged, daysWorked }) => {
  const avgPerDay = daysWorked > 0 ? (hoursLogged / daysWorked).toFixed(1) : "0";
  return (
    <div
      style={{
        margin: "16px 0",
        padding: "16px 20px",
        background: "var(--bg-pure-white)",
        borderRadius: 6,
        border: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <Stat
        icon={<ClockCircleOutlined />}
        label="Hours Logged"
        value={`${hoursLogged}h`}
        accent="#3b82f6"
      />
      <div style={{ width: 1, height: 36, background: "var(--border-color)" }} />
      <Stat
        icon={<CalendarOutlined />}
        label="Days Worked"
        value={`${daysWorked}d`}
        hint="6h / day"
        accent="#10b981"
      />
      <div style={{ width: 1, height: 36, background: "var(--border-color)" }} />
      <Stat
        icon={<RiseOutlined />}
        label="Avg / Day"
        value={`${avgPerDay}h`}
        accent="#8b5cf6"
      />
    </div>
  );
};
