import React from "react";
import { Typography, Tag, Tooltip, Button, Space } from "antd";
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ProjectOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface OverviewHeaderProps {
  name: string;
  code?: string;
  status: string;
  startDate: string | Date;
  endDate: string | Date | null;
  progress: number;
  projectId: string;
  onEdit?: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  active: "#10b981",
  planning: "#3b82f6",
  "on-hold": "#f59e0b",
  completed: "#8b5cf6",
  cancelled: "#ef4444",
};

export const OverviewHeader: React.FC<OverviewHeaderProps> = ({
  name,
  code,
  status,
  startDate,
  endDate,
  progress,
  projectId,
  onEdit,
}) => {
  const router = useRouter();
  const accentColor = STATUS_COLOR[status?.toLowerCase()] || "#3b82f6";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      style={{
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-color)",
        borderRadius: 14,
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        {/* Left: back + identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <Tooltip title="Back to projects">
            <Button
              type="text"
              shape="circle"
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/projects/manage")}
              style={{ color: "var(--text-slate-500)" }}
            />
          </Tooltip>

          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: `${accentColor}12`,
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "0.02em",
              flexShrink: 0,
            }}
          >
            {initials || <ProjectOutlined />}
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Title
                level={4}
                style={{
                  margin: 0,
                  fontWeight: 700,
                  color: "var(--text-slate-900)",
                  letterSpacing: "-0.01em",
                }}
              >
                {name}
              </Title>
              {code && (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--text-slate-500)",
                    background: "var(--bg-secondary, #f1f5f9)",
                    padding: "2px 8px",
                    borderRadius: 6,
                  }}
                >
                  #{code}
                </Text>
              )}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: `${accentColor}10`,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: accentColor }} />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: accentColor,
                    textTransform: "capitalize",
                  }}
                >
                  {status?.replace("-", " ")}
                </Text>
              </div>
            </div>

            <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <Space size={6}>
                <CalendarOutlined style={{ fontSize: 11, color: "var(--text-slate-400)" }} />
                <Text style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
                  {dayjs(startDate).format("MMM D, YYYY")} —{" "}
                  {endDate ? dayjs(endDate).format("MMM D, YYYY") : "Ongoing"}
                </Text>
              </Space>
            </div>
          </div>
        </div>

        {/* Right: progress + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ minWidth: 200 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--text-slate-400)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Overall Progress
              </Text>
              <Text style={{ fontSize: 13, fontWeight: 700, color: "var(--text-slate-900)" }}>{progress}%</Text>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "var(--bg-secondary, #f1f5f9)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: accentColor,
                  opacity: 0.9,
                  borderRadius: 999,
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          <Space size={6}>
            <Tooltip title="Edit project">
              <Button
                type="primary"
                icon={<EditOutlined />}
                style={{ height: 36, borderRadius: 8, fontWeight: 600 }}
                onClick={() => (onEdit ? onEdit() : router.push(`/projects/manage?edit=${projectId}`))}
              >
                Edit
              </Button>
            </Tooltip>
          </Space>
        </div>
      </div>
    </div>
  );
};
