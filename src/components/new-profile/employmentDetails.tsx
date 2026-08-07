"use client";

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Tag, Space, Typography, Divider } from "antd";
import { ProjectService } from "@/services/projectService";
import {
  Briefcase,
  Building2,
  Users,
  Zap,
  MapPin,
  Calendar,
  Clock,
  Laptop,
  User,
  Award,
  TrendingUp,
  GraduationCap,
  Timer,
} from "lucide-react";

const { Text } = Typography;

interface EmploymentDetailsProps {
  employment: any;
  currentUser: any;
  positions: any;
}

const formatDate = (d?: string) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return d;
  }
};

const cardStyle: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid var(--border-slate-100)",
  background: "var(--bg-pure-white)",
  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
};

const SectionTitle = ({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) => (
  <div
    style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}
  >
    <span
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        background: "var(--bg-blue-50)",
        color: "var(--premium-blue)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </span>
    <span
      style={{
        fontSize: 15,
        fontWeight: 700,
        color: "var(--text-slate-900)",
      }}
    >
      {text}
    </span>
  </div>
);

const FieldItem = ({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "10px 12px",
      background: "var(--bg-slate-50)",
      borderRadius: 10,
      border: "1px solid var(--border-slate-100)",
      height: "100%",
    }}
  >
    <span
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        background: "var(--bg-pure-white)",
        color: "var(--premium-blue)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        border: "1px solid var(--border-slate-100)",
      }}
    >
      {icon}
    </span>
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "var(--text-slate-400)",
          marginBottom: 1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--text-slate-900)",
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </div>
    </div>
  </div>
);

const EmploymentDetails: React.FC<EmploymentDetailsProps> = ({
  employment,
  currentUser,
  positions,
}) => {
  const e = employment || {};
  const [projectMap, setProjectMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const selectList = await ProjectService.getProjectsForSelect();
        const map: Record<string, string> = {};
        if (Array.isArray(selectList)) {
          selectList.forEach((p) => {
            if (p.value) map[p.value] = p.label || p.value;
          });
        }
        const res = await ProjectService.getProjects({ limit: 1000 });
        const data = res?.data || (Array.isArray(res) ? res : []);
        if (Array.isArray(data)) {
          data.forEach((p: any) => {
            if (p.id) map[p.id] = p.name || p.title || map[p.id];
          });
        }
        setProjectMap(map);
      } catch (err) {
        console.error("Failed to fetch projects in EmploymentDetails:", err);
      }
    };
    loadProjects();
  }, []);

  const positionTitle =
    currentUser?.position?.title ||
    e.position?.title ||
    positions?.title ||
    e.designation ||
    "—";

  const projects: any[] = Array.isArray(e.projects) ? e.projects : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Role & Org */}
      <Card bordered style={cardStyle}>
        <SectionTitle icon={<Briefcase size={16} />} text="Role & Organization" />
        <Row gutter={[14, 14]}>
          <Col span={8}>
            <FieldItem
              label="Position"
              value={positionTitle}
              icon={<Briefcase size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Department"
              value={e.department}
              icon={<Building2 size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem label="Team" value={e.team} icon={<Users size={15} />} />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Employee Type"
              value={e.employeeType}
              icon={<Zap size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Employee Grade"
              value={e.employeeGrade}
              icon={<Award size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Reporting Manager"
              value={e.reportingManager}
              icon={<User size={15} />}
            />
          </Col>
        </Row>
      </Card>

      {/* Work Setup */}
      <Card bordered style={cardStyle}>
        <SectionTitle icon={<Laptop size={16} />} text="Work Setup" />
        <Row gutter={[14, 14]}>
          <Col span={8}>
            <FieldItem
              label="Work Location"
              value={e.workLocation}
              icon={<MapPin size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Work Type"
              value={e.workType}
              icon={<Laptop size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Hybrid Mode"
              value={e.hybridMode}
              icon={<Zap size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Total Days / Week"
              value={e.totalDays?.toString?.() ?? e.totalDays}
              icon={<Calendar size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Total Hours / Day"
              value={e.totalHours?.toString?.() ?? e.totalHours}
              icon={<Timer size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Notice Period"
              value={e.noticePeriod}
              icon={<Clock size={15} />}
            />
          </Col>
        </Row>
      </Card>

      {/* Tenure & Milestones */}
      <Card bordered style={cardStyle}>
        <SectionTitle
          icon={<Calendar size={16} />}
          text="Tenure & Milestones"
        />
        <Row gutter={[14, 14]}>
          <Col span={8}>
            <FieldItem
              label="Joining Date"
              value={formatDate(e.employeeJoiningDate || e.joiningDate)}
              icon={<Calendar size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Promotion Status"
              value={e.promotionStatus}
              icon={<TrendingUp size={15} />}
            />
          </Col>
          <Col span={8}>
            <FieldItem
              label="Training Completion"
              value={formatDate(e.trainingCompletion)}
              icon={<GraduationCap size={15} />}
            />
          </Col>
        </Row>

        <Divider style={{ margin: "20px 0 16px" }} />

        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-slate-500)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Assigned Projects
          </span>
        </div>
        <Space wrap size={8}>
          {projects.length > 0 ? (
            projects.map((p: any, i: number) => (
              <Tag
                key={i}
                style={{
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontWeight: 600,
                  fontSize: 12,
                  border: "none",
                  background: "var(--bg-blue-50)",
                  color: "var(--premium-blue)",
                }}
              >
                {typeof p === "string" ? (projectMap[p] || p) : p?.name || p?.title || p?.label || "Project"}
              </Tag>
            ))
          ) : (
            <Text type="secondary" style={{ fontSize: 13 }}>
              No projects assigned yet.
            </Text>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default EmploymentDetails;
