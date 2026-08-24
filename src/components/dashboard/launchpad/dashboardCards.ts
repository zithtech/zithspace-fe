/**
 * Single source of truth for the dashboard card catalogue.
 *
 * Both the dashboard settings page and the launchpad's left panel read from
 * here, so a card added in one place shows up in the other automatically.
 */
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  Users,
  LayoutDashboard,
  Zap,
  Ticket,
  FileText,
  CalendarDays,
  CalendarClock,
  Gift,
  Folder,
  Activity,
  History,
} from "lucide-react";

export type DashboardSegment = "me" | "organization";

export interface DashboardCardDef {
  /** Key stored in DashboardSettings.visibleCards. */
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  /** Card is hidden unless the tenant has at least one of these features. */
  requiredFeatures?: string[];
}

export const ME_METRICS: DashboardCardDef[] = [
  {
    name: "metricDailyUpdates",
    requiredFeatures: ["work_daily_updates"],
    title: "Daily Updates",
    description: "Overview of BOD and EOD submission status.",
    icon: Zap,
    color: "#3B82F6",
  },
  {
    name: "metricAvgHours",
    requiredFeatures: ["work_time_tracking"],
    title: "Avg Hours",
    description: "Average working hours over the last 5 days.",
    icon: Clock,
    color: "#10B981",
  },
  {
    name: "metricMyTickets",
    requiredFeatures: ["work_projects"],
    title: "My Tickets",
    description: "Your open and closed tickets progress.",
    icon: Ticket,
    color: "#F59E0B",
  },
  {
    name: "metricTeamToday",
    requiredFeatures: ["hrms_attendance", "my_hub_my_hub_general_attendance"],
    title: "Team Today",
    description: "Quick look at team members on leave or working today.",
    icon: Users,
    color: "#8B5CF6",
  },
];

export const ME_CARDS: DashboardCardDef[] = [
  {
    name: "heroSection",
    title: "Hero Section",
    description: "Display a personalized greeting and live pulse.",
    icon: LayoutDashboard,
    color: "#8B5CF6",
  },
  {
    name: "dailyAttendanceCard",
    requiredFeatures: ["hrms_attendance", "my_hub_my_hub_general_attendance"],
    title: "Daily Attendance",
    description: "Time tracker and daily attendance logs.",
    icon: CalendarClock,
    color: "#3B82F6",
  },
  {
    name: "quickActions",
    title: "Quick Actions",
    description:
      "Shortcuts for clocking in, submitting updates, or creating tickets.",
    icon: Zap,
    color: "#EC4899",
  },
  {
    name: "recentTickets",
    requiredFeatures: ["work_projects"],
    title: "Recent Tickets",
    description: "Ticket resolution times, volume, and customer satisfaction.",
    icon: Ticket,
    color: "#F43F5E",
  },
  {
    name: "myTicketsProgress",
    requiredFeatures: ["work_projects"],
    title: "My Tickets",
    description: "Your open and closed tickets progress.",
    icon: Ticket,
    color: "#F59E0B",
  },
  {
    name: "calendar",
    requiredFeatures: ["home_home_general_calendar"],
    title: "Calendar",
    description: "Upcoming meetings and calendar schedule.",
    icon: CalendarDays,
    color: "#6366F1",
  },
  {
    name: "cardSalarySlip",
    requiredFeatures: ["hrms_payroll_v2", "hrms_payroll"],
    title: "Salary Slip",
    description: "Download your monthly salary slips.",
    icon: FileText,
    color: "#10B981",
  },
];

export const ORG_METRICS: DashboardCardDef[] = [
  {
    name: "metricTotalMembers",
    requiredFeatures: ["hrms_directory", "home_home_general_people"],
    title: "Total Members",
    description: "Number of active team members in the organization.",
    icon: Users,
    color: "#3B82F6",
  },
  {
    name: "metricActiveProjects",
    requiredFeatures: ["work_projects"],
    title: "Active Projects",
    description: "Number of currently active projects.",
    icon: Folder,
    color: "#F59E0B",
  },
  {
    name: "metricOrgTickets",
    requiredFeatures: ["work_projects"],
    title: "Tickets",
    description: "Overview of open and resolved tickets.",
    icon: Ticket,
    color: "#10B981",
  },
  {
    name: "metricOrgTeamToday",
    requiredFeatures: ["hrms_attendance", "my_hub_my_hub_general_attendance"],
    title: "Team Today",
    description: "Quick look at team members on leave or working today.",
    icon: Users,
    color: "#8B5CF6",
  },
];

export const ORG_CARDS: DashboardCardDef[] = [
  {
    name: "cardProjectPulse",
    requiredFeatures: ["work_projects"],
    title: "Project Pulse",
    description: "Real-time tracking of project health and velocity.",
    icon: Activity,
    color: "#0EA5E9",
  },
  {
    name: "upcomingBirthdays",
    title: "Upcoming Birthdays",
    description: "Track upcoming birthdays across the organization.",
    icon: Gift,
    color: "#F59E0B",
  },
  {
    name: "cardTodayLeaves",
    requiredFeatures: ["hrms_leaves", "my_hub_my_hub_general_leaves"],
    title: "Today's Leaves",
    description: "See who is on leave or working from home today.",
    icon: CalendarClock,
    color: "#EC4899",
  },
  {
    name: "cardRecentActivities",
    title: "Recent Activities",
    description: "Log of recent actions across the organization.",
    icon: History,
    color: "#6366F1",
  },
];

/** Everything defaults to visible until the tenant saves otherwise. */
export const DEFAULT_SETTINGS: Record<string, boolean> = {
  heroSection: true,
  quickActions: true,
  dailyAttendanceCard: true,
  recentTickets: true,
  calendar: true,
  upcomingBirthdays: true,
  cardTodayLeaves: true,
  cardSalarySlip: true,
  metricDailyUpdates: true,
  metricAvgHours: true,
  metricMyTickets: true,
  metricTeamToday: true,
  metricTotalMembers: true,
  metricActiveProjects: true,
  metricOrgTickets: true,
  metricOrgTeamToday: true,
  cardProjectPulse: true,
  cardTodaysPulse: true,
  cardOrgUpcomingBirthdays: true,
  cardTeamInsights: true,
  cardRecentActivities: true,
  myTicketsProgress: true,
};

/** The two card families each segment is split into, in display order. */
export const SEGMENT_SECTIONS: Record<
  DashboardSegment,
  Array<{ label: string; cards: DashboardCardDef[] }>
> = {
  me: [
    { label: "Status Cards", cards: ME_METRICS },
    { label: "Dashboard Cards", cards: ME_CARDS },
  ],
  organization: [
    { label: "Status Cards", cards: ORG_METRICS },
    { label: "Dashboard Cards", cards: ORG_CARDS },
  ],
};
