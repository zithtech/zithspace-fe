import React from "react";
import { Card, Typography, Avatar } from "antd";
import { TeamOutlined, ProfileOutlined, CrownOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

interface ProjectInfoCardProps {
  projectHead: string;
  avatarUrl?: string;
  teamCount: number;
  description: string | null;
}

const SectionLabel: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
    <span style={{ color: "var(--text-slate-400)", fontSize: 11, display: "inline-flex" }}>{icon}</span>
    <Text
      style={{
        fontSize: 10.5,
        fontWeight: 600,
        color: "var(--text-slate-400)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </Text>
  </div>
);

export const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({
  projectHead,
  avatarUrl,
  teamCount,
  description,
}) => {
  return (
    <Card
      style={{
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-color)",
        borderRadius: 6,
        height: "100%",
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
        {/* Top row: lead + members */}
        <div style={{ display: "flex", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SectionLabel icon={<CrownOutlined />}>Project Lead</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <Avatar
                size={36}
                src={avatarUrl}
                style={{
                  backgroundColor: "var(--bg-secondary, #f1f5f9)",
                  color: "var(--text-slate-700)",
                  border: "1px solid var(--border-color)",
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {projectHead?.substring(0, 1).toUpperCase()}
              </Avatar>
              <Text
                strong
                ellipsis
                style={{ fontSize: 14, color: "var(--text-slate-900)", minWidth: 0 }}
              >
                {projectHead || "Unassigned"}
              </Text>
            </div>
          </div>

          <div style={{ width: 1, background: "var(--border-color)" }} />

          <div style={{ minWidth: 110 }}>
            <SectionLabel icon={<TeamOutlined />}>Members</SectionLabel>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <Text style={{ fontSize: 22, fontWeight: 700, color: "var(--text-slate-900)" }}>
                {teamCount}
              </Text>
              <Text style={{ fontSize: 12, color: "var(--text-slate-500)", fontWeight: 500 }}>
                {teamCount === 1 ? "person" : "people"}
              </Text>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <SectionLabel icon={<ProfileOutlined />}>Description</SectionLabel>
          <div
            style={{
              background: "var(--bg-secondary, #f8fafc)",
              padding: 12,
              borderRadius: 8,
              border: "1px solid var(--border-color)",
              flex: 1,
            }}
          >
            <Paragraph
              ellipsis={{ rows: 4, expandable: true, symbol: "more" }}
              style={{ fontSize: 12.5, margin: 0, color: "var(--text-slate-600)", lineHeight: 1.55 }}
            >
              {description || "No description provided for this project."}
            </Paragraph>
          </div>
        </div>
      </div>
    </Card>
  );
};
