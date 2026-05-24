"use client";

import React from "react";
import { Typography, Tooltip, Skeleton } from "antd";

const { Text } = Typography;

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
  subtle?: string;
  loading?: boolean;
  chart?: React.ReactNode;
}

export const OrgStatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  accent,
  subtle,
  loading,
  chart,
}) => (
  <div className="orgx-stat-card" style={{ ['--orgx-accent' as any]: accent }}>
    <div className="orgx-stat-head">
      <div
        className="orgx-stat-icon"
        style={{
          background: `${accent}14`,
          color: accent,
          boxShadow: `inset 0 0 0 1px ${accent}26`,
        }}
      >
        {icon}
      </div>
      <Text className="orgx-stat-label">{label}</Text>
      <div className="orgx-stat-value-wrap">
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 56, height: 22 }} />
        ) : (
          <span className="orgx-stat-value">{value}</span>
        )}
      </div>
    </div>
    {subtle && <Text className="orgx-stat-subtle">{subtle}</Text>}
    {chart && <div className="orgx-stat-chart">{chart}</div>}
    <span
      className="orgx-stat-accent"
      style={{ background: `linear-gradient(90deg, ${accent} 0%, transparent 80%)` }}
    />
  </div>
);

interface MiniBarProps {
  segments: { value: number; color: string; label: string }[];
}

export const OrgMiniBar: React.FC<MiniBarProps> = ({ segments }) => {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="orgx-minibar">
      <div className="orgx-minibar-track">
        {segments.map((s, i) => (
          <Tooltip key={i} title={`${s.label}: ${s.value}`}>
            <span
              className="orgx-minibar-seg"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            />
          </Tooltip>
        ))}
      </div>
      <div className="orgx-minibar-legend">
        {segments.map((s, i) => (
          <span key={i} className="orgx-minibar-legend-item">
            <span className="orgx-minibar-dot" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
};
