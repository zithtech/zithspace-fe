"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Typography } from "antd";
import {
  CalendarPlus,
  CalendarCheck,
  Siren,
  TrendingUp,
  Banknote,
  CircleUser,
  ChevronRight,
} from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Permissions } from "@/types/permissions";

const { Title, Text } = Typography;

interface HubCard {
  key: string;
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
  accent: string;
  /** Show the card if the user has ANY of these permissions. */
  anyPermission: string[];
}

// Employee-centric shortcuts. These deep-link into the existing feature routes —
// My Hub is a launcher, not a set of duplicated pages. Keep this list in sync
// with the MY_HUB module items in navigationConfig.tsx.
const HUB_CARDS: HubCard[] = [
  {
    key: "profile",
    label: "My Profile",
    description: "Personal details & settings",
    path: "/my-hub/profile",
    icon: <CircleUser size={22} strokeWidth={1.75} />,
    accent: "#ec4899",
    anyPermission: [Permissions.MY_HUB_PROFILE_READ],
  },
  {
    key: "apply-leave",
    label: "Apply Leave",
    description: "Request time off & track balances",
    path: "/my-hub/apply-leave",
    icon: <CalendarPlus size={22} strokeWidth={1.75} />,
    accent: "#8b5cf6",
    anyPermission: [Permissions.MY_HUB_APPLY_LEAVE_READ],
  },
  {
    key: "attendance",
    label: "Attendance",
    description: "Clock in / out & view your log",
    path: "/my-hub/attendance",
    icon: <CalendarCheck size={22} strokeWidth={1.75} />,
    accent: "#10b981",
    anyPermission: [Permissions.MY_HUB_ATTENDANCE_READ],
  },
  {
    key: "escalations",
    label: "Escalations",
    description: "Escalations raised against me",
    path: "/my-hub/escalations",
    icon: <Siren size={22} strokeWidth={1.75} />,
    accent: "#ef4444",
    anyPermission: [Permissions.MY_HUB_ESCALATION_READ],
  },
  {
    key: "performance",
    label: "Performance Report",
    description: "See your generated reports",
    path: "/my-hub/performance",
    icon: <TrendingUp size={22} strokeWidth={1.75} />,
    accent: "#f59e0b",
    anyPermission: [Permissions.MY_HUB_PERFORMANCE_READ],
  },
  {
    key: "payslips",
    label: "My Payslips",
    description: "Download your salary slips",
    path: "/my-hub/payslips",
    icon: <Banknote size={22} strokeWidth={1.75} />,
    accent: "#0ea5e9",
    anyPermission: [Permissions.MY_HUB_PAYSLIPS_READ],
  },
];

export default function MyHubPage() {
  const router = useRouter();
  const { user, hasAnyPermission } = useAuth();

  const cards = useMemo(
    () => HUB_CARDS.filter((c) => hasAnyPermission(...c.anyPermission)),
    [hasAnyPermission]
  );

  const firstName = (user?.name || "there").trim().split(" ")[0];

  return (
    <MainLayout>
      <div className="mh-wrap">
        <header className="mh-head">
          <Title level={3} className="mh-title" style={{ margin: 0 }}>
            Welcome back, {firstName} 👋
          </Title>
          <Text className="mh-subtitle">Your personal space — everything you need in one place.</Text>
        </header>

        <div className="mh-grid">
          {cards.map((card) => (
            <button
              key={card.key}
              className="mh-card"
              onClick={() => router.push(card.path)}
            >
              <span className="mh-card-icon" style={{ background: `${card.accent}1a`, color: card.accent }}>
                {card.icon}
              </span>
              <span className="mh-card-body">
                <span className="mh-card-label">{card.label}</span>
                <span className="mh-card-desc">{card.description}</span>
              </span>
              <span className="mh-card-chevron">
                <ChevronRight size={18} strokeWidth={2} />
              </span>
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .mh-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 24px 48px;
        }
        .mh-head {
          margin-bottom: 28px;
        }
        .mh-title {
          color: var(--text-slate-900) !important;
          letter-spacing: -0.02em;
        }
        .mh-subtitle {
          display: block;
          margin-top: 6px;
          font-size: 14px;
          color: var(--text-slate-500);
        }
        .mh-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .mh-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 18px;
          border-radius: 14px;
          border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }
        .mh-card:hover {
          border-color: var(--border-slate-300);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
        }
        .mh-card-icon {
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          border-radius: 11px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .mh-card-body {
          display: flex;
          flex-direction: column;
          min-width: 0;
          flex: 1;
        }
        .mh-card-label {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-slate-900);
          letter-spacing: -0.01em;
        }
        .mh-card-desc {
          margin-top: 2px;
          font-size: 12.5px;
          color: var(--text-slate-500);
        }
        .mh-card-chevron {
          flex-shrink: 0;
          color: var(--text-slate-400);
          display: inline-flex;
        }
      `}</style>
    </MainLayout>
  );
}
