"use client";

import { Typography } from "antd";

const { Text } = Typography;

const ViewField = ({
  label,
  value,
  labelStyle,
  valueStyle,
}: {
  label: string;
  value: string;
  labelStyle?: React.CSSProperties;
  valueStyle?: React.CSSProperties;
}) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ color: "#888", ...labelStyle }}>{label}</div>
    <div style={{ fontWeight: 500, ...valueStyle }}>{value || "-"}</div>
  </div>
);

export default ViewField;
