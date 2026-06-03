import React from "react";
export const NAV_MOBILE_BREAKPOINT = 720;
import { Permissions } from "@/types/permissions";
import {
  // Modules
  Home,
  Briefcase,
  ShieldCheck,
  UsersRound,
  Wallet,
  // HOME
  LayoutDashboard,
  Plug2,
  // WORK – Tickets
  Ticket,
  Map,
  FilePlus2,
  ListChecks,
  LayoutGrid,
  SlidersHorizontal,
  Trash2,
  Archive,
  FolderKanban,
  Bug,
  // Timesheet / Time tracking
  CalendarClock,
  Gauge,
  FileClock,
  Send,
  Users,
  Timer,
  UserCog,
  UsersRound as UsersRound2,
  // Daily updates
  NotebookPen,
  PenLine,
  Eye,
  // Document / proposals / squads
  FolderOpen,
  FileSignature,
  Users2,
  // Escalations
  Siren,
  List,
  PlusCircle,
  Gavel,
  Cog,
  // Leads
  Megaphone,
  Sparkles,
  Settings2,
  // ADMIN
  Building2,
  Settings,
  Workflow,
  Handshake,
  TrendingUp,
  KeyRound,
  // HRMS
  CircleUser,
  IdCard,
  CalendarCheck,
  Clock,
  UserCheck,
  CalendarDays,
  CalendarPlus,
  BadgeCheck,
  Landmark,
  CalendarCog,
  Tag,
  BookOpen,
  CalendarHeart,
  UserPlus,
  UserPlus2,
  LogOut,
  UserMinus,
  Sliders,
  Network,
  Award,
  BadgeInfo,
  Building,
  // FINANCE
  Receipt,
  LineChart,
  Files,
  FilePlus,
  LayoutTemplate,
  Contact,
  HandCoins,
  Banknote,
  FileSearch,
  CheckCheck,
  FileText,
  CheckCircle2,
  FileCog,
  Layers,
  PieChart,
  BarChart3,
} from "lucide-react";

const I = (Comp: React.ComponentType<any>) => (
  <Comp size={16} strokeWidth={1.75} className="nav-lucide-icon" />
);

export type ModuleType = "HOME" | "WORK" | "HRMS" | "FINANCE" | "ADMIN" | "REC_SUITE";

export interface NavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: NavItem[];
  disabled?: boolean;
  /** Permission required to see this item. If absent, item is always visible. */
  requiredPermission?: string;
  /** Show if user has ANY of these permissions. */
  requiredAnyPermission?: string[];
}

export interface ModuleConfig {
  key: ModuleType;
  label: string;
  icon?: React.ReactNode;
  pathPrefixes: string[];
  items: NavItem[];
  defaultPath?: string;
  /** Permission required to see this module in the top nav. */
  requiredPermission?: string;
  /** Show module if user has ANY of these permissions. */
  requiredAnyPermission?: string[];
}

/** Pages that aren't part of a specific module group but still need protection. */
export interface StandalonePage {
  path: string;
  requiredPermission: string;
}

export const STANDALONE_PAGES: StandalonePage[] = [
  { path: "/mail", requiredPermission: Permissions.MAIL_READ },
  { path: "/calendar", requiredPermission: Permissions.CALENDAR_READ },
  { path: "/chat", requiredPermission: Permissions.CHAT_READ },
  { path: "/skills", requiredPermission: Permissions.SKILLS_READ },
];

export const NAVIGATION_CONFIG: ModuleConfig[] = [
  {
    key: "HOME",
    label: "HOME",
    icon: I(Home),
    pathPrefixes: ["/dashboard", "/integrations"],
    defaultPath: "/dashboard",
    requiredAnyPermission: [
      Permissions.DASHBOARD_READ,
      Permissions.INTEGRATION_READ,
    ],
    items: [
      {
        key: "/dashboard",
        label: "Dashboard",
        icon: I(LayoutDashboard),
        path: "/dashboard",
        requiredPermission: Permissions.DASHBOARD_READ,
      },
      {
        key: "/integrations",
        label: "Integrations",
        icon: I(Plug2),
        path: "/integrations",
        requiredPermission: Permissions.INTEGRATION_READ,
      },
    ],
  },
  {
    key: "WORK",
    label: "WORK",
    icon: I(Briefcase),
    pathPrefixes: ["/tickets", "/projects", "/documenthub", "/proposals", "/timesheet", "/daily-updates", "/escalations", "/leads", "/squad", "/time-tracking", "/org-structure"],
    defaultPath: "/tickets/select",
    requiredAnyPermission: [
      Permissions.PROJECT_READ,
      Permissions.PROJECT_TRASH_READ,
      Permissions.TICKET_READ,
      Permissions.TICKET_CREATE,
      Permissions.TICKET_PLAN_READ,
      Permissions.TICKET_BUCKET_READ,
      Permissions.BUG_READ,
      Permissions.TICKET_SETTING_READ,
      Permissions.TICKET_TRASH_READ,
      Permissions.TICKET_ARCHIVE_READ,
      Permissions.TIMESHEET_READ,
      Permissions.TIMESHEET_CREATE,
      Permissions.TIMESHEET_APPROVE,
      Permissions.TIME_TRACKING_READ,
      Permissions.TIME_TRACKING_TEAM_READ,
      Permissions.DAILY_UPDATE_READ,
      Permissions.DAILY_UPDATE_CREATE,
      Permissions.DOCUMENT_READ,
      Permissions.PROPOSAL_READ,
      Permissions.SQUAD_READ,
      Permissions.ESCALATION_READ,
      Permissions.ESCALATION_CREATE,
      Permissions.ESCALATION_MANAGE,
      Permissions.LEAD_READ,
      Permissions.LEAD_SETTING_READ,
      Permissions.LEAD_TRASH_READ,
      Permissions.ORG_READ,
    ],
    items: [
      {
        key: "projects-group",
        label: "Tickets",
        icon: I(Ticket),
        requiredAnyPermission: [
          Permissions.PROJECT_READ,
          Permissions.TICKET_READ,
          Permissions.TICKET_PLAN_READ,
          Permissions.TICKET_BUCKET_READ,
          Permissions.BUG_READ,
          Permissions.TICKET_SETTING_READ,
          Permissions.TICKET_TRASH_READ,
          Permissions.TICKET_ARCHIVE_READ,
        ],
        children: [
          {
            key: "/tickets/plans",
            label: "Plans",
            icon: I(Map),
            path: "/tickets/plans",
            requiredPermission: Permissions.TICKET_PLAN_READ,
          },
          {
            key: "/tickets/create",
            label: "Create Ticket",
            icon: I(FilePlus2),
            path: "/tickets/create",
            requiredPermission: Permissions.TICKET_CREATE,
          },
          {
            key: "/tickets/select",
            label: "Tickets",
            icon: I(ListChecks),
            path: "/tickets/select",
            requiredPermission: Permissions.TICKET_READ,
          },
          {
            key: "/tickets/buckets",
            label: "Buckets",
            icon: I(LayoutGrid),
            path: "/tickets/buckets",
            requiredPermission: Permissions.TICKET_BUCKET_READ,
          },
          {
            key: "/tickets/bug-list",
            label: "Bug List",
            icon: I(Bug),
            path: "/tickets/bug-list",
            requiredPermission: Permissions.BUG_READ,
          },
          {
            key: "/tickets/reports",
            label: "Reports",
            icon: I(BarChart3),
            path: "/tickets/reports",
            requiredPermission: Permissions.TICKET_READ,
          },
          {
            key: "/tickets/settings",
            label: "Settings",
            icon: I(SlidersHorizontal),
            path: "/tickets/settings",
            requiredPermission: Permissions.TICKET_SETTING_READ,
          },
          {
            key: "/tickets/trash",
            label: "Trash",
            icon: I(Trash2),
            path: "/tickets/trash",
            requiredPermission: Permissions.TICKET_TRASH_READ,
          },
          {
            key: "/tickets/archived",
            label: "Archived",
            icon: I(Archive),
            path: "/tickets/archived",
            requiredPermission: Permissions.TICKET_ARCHIVE_READ,
          },
        ],
      },
      {
        key: "projects-manage-group",
        label: "Projects",
        icon: I(FolderKanban),
        children: [
          {
            key: "/projects/manage",
            label: "Projects",
            icon: I(ListChecks),
            path: "/projects/manage",
            requiredPermission: Permissions.PROJECT_READ,
          },
          {
            key: "/projects/project-trash",
            label: "Trash",
            icon: I(Trash2),
            path: "/projects/project-trash",
            requiredPermission: Permissions.PROJECT_TRASH_READ,
          },
        ]
      },
      // {
      //   key: "timesheet-group",
      //   label: "Timesheet",
      //   icon: I(CalendarClock),
      //   requiredAnyPermission: [
      //     Permissions.TIMESHEET_READ,
      //     Permissions.TIMESHEET_CREATE,
      //     Permissions.TIMESHEET_APPROVE,
      //   ],
      //   children: [
      //     {
      //       key: "/timesheet/dashboard",
      //       label: "Dashboard",
      //       icon: I(Gauge),
      //       path: "/timesheet/dashboard",
      //       requiredPermission: Permissions.TIMESHEET_READ,
      //     },
      //     {
      //       key: "/timesheet",
      //       label: "My Timesheets",
      //       icon: I(FileClock),
      //       path: "/timesheet",
      //       requiredPermission: Permissions.TIMESHEET_READ,
      //     },
      //     {
      //       key: "/timesheet/submit",
      //       label: "Submit Timesheet",
      //       icon: I(Send),
      //       path: "/timesheet/submit",
      //       requiredPermission: Permissions.TIMESHEET_CREATE,
      //     },
      //     {
      //       key: "/timesheet/teams",
      //       label: "Teams",
      //       icon: I(Users),
      //       path: "/timesheet/teams",
      //       requiredPermission: Permissions.TIMESHEET_APPROVE,
      //     },
      //   ],
      // },
      {
        key: "time-tracking",
        label: "Time Tracking",
        icon: I(Timer),
        requiredAnyPermission: [
          Permissions.TIME_TRACKING_READ,
          Permissions.TIME_TRACKING_TEAM_READ,
        ],
        children: [
          {
            key: "/time-tracking/my",
            label: "My Tracking",
            icon: I(UserCog),
            path: "/time-tracking/my",
            requiredPermission: Permissions.TIME_TRACKING_READ,
          },
          {
            key: "/time-tracking/team",
            label: "Team Tracking",
            icon: I(UsersRound2),
            path: "/time-tracking/team",
            requiredPermission: Permissions.TIME_TRACKING_TEAM_READ,
          },
        ],
      },
      {
        key: "daily-updates-group",
        label: "Daily Updates",
        icon: I(NotebookPen),
        requiredAnyPermission: [
          Permissions.DAILY_UPDATE_READ,
          Permissions.DAILY_UPDATE_CREATE,
        ],
        children: [
          {
            key: "/daily-updates/submit",
            label: "Submit Update",
            icon: I(PenLine),
            path: "/daily-updates/submit",
            requiredPermission: Permissions.DAILY_UPDATE_CREATE,
          },
          {
            key: "/daily-updates/view",
            label: "View Updates",
            icon: I(Eye),
            path: "/daily-updates/view",
            requiredPermission: Permissions.DAILY_UPDATE_READ,
          },
        ],
      },
      {
        key: "documenthub",
        label: "Document Hub",
        icon: I(FolderOpen),
        path: "/documenthub",
        requiredPermission: Permissions.DOCUMENT_READ,
      },
      {
        key: "/proposals",
        label: "Proposals",
        icon: I(FileSignature),
        path: "/proposals",
        requiredPermission: Permissions.PROPOSAL_READ,
      },
      {
        key: "squadManagement",
        label: "Squads",
        icon: I(Users2),
        path: "/squad",
        requiredPermission: Permissions.SQUAD_READ,
      },
      {
        key: "escalations-group",
        label: "Escalations",
        icon: I(Siren),
        requiredAnyPermission: [
          Permissions.ESCALATION_READ,
          Permissions.ESCALATION_CREATE,
          Permissions.ESCALATION_MANAGE,
        ],
        children: [
          {
            key: "/escalations",
            label: "Escalation List",
            icon: I(List),
            path: "/escalations",
            requiredPermission: Permissions.ESCALATION_READ,
          },
          // {
          //   key: "/escalations/create",
          //   label: "Create Escalation",
          //   icon: I(PlusCircle),
          //   path: "/escalations/create",
          //   requiredPermission: Permissions.ESCALATION_CREATE,
          // },
          // {
          //   key: "/escalations/sla-rules",
          //   label: "SLA & Rules Engine",
          //   icon: I(Gavel),
          //   path: "/escalations/sla-rules",
          //   requiredPermission: Permissions.ESCALATION_MANAGE,
          // },
          {
            key: "/escalations/settings",
            label: "Settings",
            icon: I(Cog),
            path: "/escalations/settings",
            requiredPermission: Permissions.ESCALATION_MANAGE,
          },
        ],
      },
      {
        key: "leads-group",
        label: "Lead Management",
        icon: I(Megaphone),
        requiredAnyPermission: [
          Permissions.LEAD_READ,
          Permissions.LEAD_SETTING_READ,
          Permissions.LEAD_TRASH_READ,
        ],
        children: [
          {
            key: "/leads",
            label: "Leads",
            icon: I(Sparkles),
            path: "/leads",
            requiredPermission: Permissions.LEAD_READ,
          },
          {
            key: "/leads/settings",
            label: "Settings",
            icon: I(Settings2),
            path: "/leads/settings",
            requiredPermission: Permissions.LEAD_SETTING_READ,
          },
          {
            key: "/leads/trash",
            label: "Trash",
            icon: I(Trash2),
            path: "/leads/trash",
            requiredPermission: Permissions.LEAD_TRASH_READ,
          },
        ],
      },
      {
        key: "orgstructure",
        icon: I(Network),
        label: "Org-structure",
        requiredPermission: Permissions.ORG_READ,
        children: [
          {
            key: "/org-structure/overview",
            icon: I(Eye),
            label: "Overview",
            path: "/org-structure/overview",
            requiredPermission: Permissions.ORG_READ,
          },
          {
            key: "/org-structure/grades",
            icon: I(Award),
            label: "Grades",
            path: "/org-structure/grades",
            requiredAnyPermission: [Permissions.ORG_GRADE_READ, Permissions.ORG_MANAGE],
          },
          {
            key: "/org-structure/employment-types",
            icon: I(BadgeInfo),
            label: "Employment Types",
            path: "/org-structure/employment-types",
            requiredAnyPermission: [Permissions.ORG_EMPLOYMENT_TYPE_READ, Permissions.ORG_MANAGE],
          },
          {
            key: "/org-structure/departments",
            icon: I(Building),
            label: "Departments",
            path: "/org-structure/departments",
            requiredAnyPermission: [Permissions.ORG_DEPARTMENT_READ, Permissions.ORG_MANAGE],
          },
          {
            key: "/org-structure/sub-departments",
            icon: I(Building2),
            label: "Sub Departments",
            path: "/org-structure/sub-departments",
            requiredAnyPermission: [Permissions.ORG_DEPARTMENT_READ, Permissions.ORG_MANAGE],
          },
          {
            key: "/org-structure/positions",
            icon: I(Briefcase),
            label: "Positions",
            path: "/org-structure/positions",
            requiredAnyPermission: [Permissions.ORG_POSITION_READ, Permissions.ORG_MANAGE],
          },
        ],
      },
    ],
  },
  {
    key: "ADMIN",
    label: "ADMIN",
    icon: I(ShieldCheck),
    pathPrefixes: [
      "/clients",
      "/clients-v2",
      "/settings",
      "/admin",
      "/roles",
      "/members",
    ],
    defaultPath: "/clients-v2",
    requiredAnyPermission: [
      Permissions.CLIENT_READ,
      Permissions.SETTINGS_READ,
      Permissions.ROLE_READ,
      Permissions.USER_READ,
    ],
    items: [
      {
        key: "/clients-v2",
        label: "Clients V2",
        icon: I(Building2),
        path: "/clients-v2",
        requiredPermission: Permissions.CLIENT_READ,
      },
      {
        key: "/settings",
        label: "General Settings",
        icon: I(Settings),
        path: "/settings",
        requiredPermission: Permissions.SETTINGS_READ,
      },
      // {
      //   key: "pipeline-group",
      //   label: "Pipeline",
      //   icon: I(Workflow),
      //   requiredAnyPermission: [
      //     Permissions.PIPELINE_READ,
      //     Permissions.PIPELINE_SETTING_READ,
      //     Permissions.PIPELINE_DEALS_READ,
      //     Permissions.PIPELINE_BOARD_READ,
      //     Permissions.PIPELINE_FORECAST_READ
      //   ],
      //   children: [
      //     {
      //       key: "/admin/pipeline-settings",
      //       label: "Settings",
      //       icon: I(SlidersHorizontal),
      //       path: "/admin/pipeline-settings",
      //       requiredPermission: Permissions.PIPELINE_SETTING_READ,
      //     },
      //     {
      //       key: "/admin/deals",
      //       label: "Deals",
      //       icon: I(Handshake),
      //       path: "/admin/deals",
      //       requiredAnyPermission: [Permissions.PIPELINE_READ, Permissions.PIPELINE_DEALS_READ],
      //     },
      //     {
      //       key: "/admin/deals/forecast",
      //       label: "Forecast",
      //       icon: I(TrendingUp),
      //       path: "/admin/deals/forecast",
      //       requiredAnyPermission: [Permissions.PIPELINE_READ, Permissions.PIPELINE_FORECAST_READ],
      //     },
      //     {
      //       key: "/admin/deals/board",
      //       label: "Board",
      //       icon: I(LayoutGrid),
      //       path: "/admin/deals/board",
      //       requiredAnyPermission: [Permissions.PIPELINE_READ, Permissions.PIPELINE_BOARD_READ],
      //     },
      //   ],
      // },
      {
        key: "/members",
        label: "Members",
        icon: I(Users),
        path: "/members",
        requiredPermission: Permissions.USER_READ,
      },
      {
        key: "/roles",
        label: "Roles & Permissions",
        icon: I(KeyRound),
        path: "/roles",
        requiredPermission: Permissions.ROLE_READ,
      },
    ],
  },

  {
    key: "HRMS",
    label: "HRMS",
    icon: I(UsersRound),
    pathPrefixes: [
      "/profile",
      "/new-profile",
      "/attendance",
      "/leaves",
      "/leaves-dashboard",
      "/apply-leave",
      "/leave-approvals",
      "/government-holidays",
      "/leave-adjustments",
      "/leave-type",
      "/leave-policy",
      "/leave-configuration",
      "/leave",
      "/add-goverment-leaves",
      "/onboarding",
      "/employee-exit",
      "/performance",
      "/perfomance-management",
      "/opening-management",
    ],
    defaultPath: "/profile",
    requiredAnyPermission: [
      Permissions.PROFILE_READ,
      Permissions.ATTENDANCE_READ,
      Permissions.LEAVE_READ,
      Permissions.PERFORMANCE_READ,
      Permissions.OPENING_READ,
      Permissions.EXIT_READ,
      Permissions.ONBOARDING_READ,
    ],

    items: [
      {
        key: "/profile",
        label: "My Profile",
        icon: I(CircleUser),
        path: "/profile",
        requiredPermission: Permissions.PROFILE_READ,
      },
      {
        key: "/new-profile",
        label: "Profile 2.0",
        icon: I(IdCard),
        path: "/new-profile",
        requiredPermission: Permissions.PROFILE_READ,
      },
      {
        key: "attendance-group",
        label: "Attendance",
        icon: I(CalendarCheck),
        requiredAnyPermission: [
          Permissions.ATTENDANCE_READ,
          Permissions.ATTENDANCE_DASHBOARD_READ,
          Permissions.ATTENDANCE_CLOCK_IN_OUT,
          Permissions.ATTENDANCE_CREATE,
          Permissions.ATTENDANCE_UPDATE,
          Permissions.ATTENDANCE_DELETE,
        ],
        children: [
          {
            key: "/attendance/dashboard",
            label: "Dashboard",
            icon: I(Gauge),
            path: "/attendance/dashboard",
            requiredPermission: Permissions.ATTENDANCE_DASHBOARD_READ,
          },
          {
            key: "/attendance/clock-in-out",
            label: "Clock In/Out",
            icon: I(Clock),
            path: "/attendance/clock-in-out",
            requiredPermission: Permissions.ATTENDANCE_CLOCK_IN_OUT,
          },
          {
            key: "/attendance/manage",
            label: "Manage Attendance",
            icon: I(UserCheck),
            path: "/attendance/manage",
            requiredAnyPermission: [
              Permissions.ATTENDANCE_CREATE,
              Permissions.ATTENDANCE_UPDATE,
              Permissions.ATTENDANCE_READ,
              Permissions.ATTENDANCE_DELETE,
            ],
          },
        ],
      },
      {
        key: "leave-management-group",
        label: "Leave Management",
        icon: I(CalendarDays),
        requiredAnyPermission: [
          Permissions.LEAVE_READ,
          Permissions.LEAVE_DASHBOARD_READ,
          Permissions.LEAVE_HOLIDAY_READ,
          Permissions.LEAVE_ADJUSTMENT_READ,
          Permissions.LEAVE_TYPE_READ,
          Permissions.LEAVE_POLICY_READ,
          Permissions.LEAVE_APPROVE,
          Permissions.LEAVE_MANAGE,
        ],
        children: [
          {
            key: "/leaves-dashboard",
            label: "Dashboard",
            icon: I(LayoutDashboard),
            path: "/leaves-dashboard",
            requiredAnyPermission: [
              Permissions.LEAVE_READ,
              Permissions.LEAVE_DASHBOARD_READ,
            ],
          },
          {
            key: "/apply-leave",
            label: "Apply Leave",
            icon: I(CalendarPlus),
            path: "/apply-leave",
            requiredPermission: Permissions.LEAVE_READ,
          },
          {
            key: "/leave-approvals",
            label: "Approvals",
            icon: I(BadgeCheck),
            path: "/leave-approvals",
            requiredAnyPermission: [
              Permissions.LEAVE_MANAGE,
              Permissions.LEAVE_APPROVE,
            ],
          },
          {
            key: "/government-holidays",
            label: "Government Holidays",
            icon: I(Landmark),
            path: "/government-holidays",
            requiredAnyPermission: [
              Permissions.LEAVE_HOLIDAY_READ,
              Permissions.LEAVE_MANAGE,
            ],
          },
          {
            key: "/leave-adjustments",
            label: "Leave Adjustment",
            icon: I(CalendarCog),
            path: "/leave-adjustments",
            requiredAnyPermission: [
              Permissions.LEAVE_MANAGE,
              Permissions.LEAVE_ADJUSTMENT_READ,
            ],
          },
          {
            key: "/leave-type",
            label: "Leave Type",
            icon: I(Tag),
            path: "/leave-type",
            requiredAnyPermission: [
              Permissions.LEAVE_MANAGE,
              Permissions.LEAVE_TYPE_READ,
            ],
          },
          {
            key: "/leave-policy",
            label: "Leave Policy",
            icon: I(BookOpen),
            path: "/leave-policy",
            requiredAnyPermission: [
              Permissions.LEAVE_MANAGE,
              Permissions.LEAVE_POLICY_READ,
            ],
          },
          {
            key: "/add-goverment-leaves",
            label: "Add Govt Leaves",
            icon: I(CalendarHeart),
            path: "/add-goverment-leaves",
            requiredAnyPermission: [
              Permissions.LEAVE_MANAGE,
              Permissions.LEAVE_HOLIDAY_READ,
            ],
          },
        ],
      },

      {
        key: "Onbording",
        icon: I(UserPlus),
        label: "Onbording",
        requiredAnyPermission: [
          Permissions.ONBOARDING_READ,
          Permissions.ONBOARDING_CREATE,
          Permissions.ONBOARDING_UPDATE,
          Permissions.ONBOARDING_DELETE,
        ],
        children: [
          {
            key: "/onbording/create",
            icon: I(UserPlus2),
            label: "Create",
            path: "/onboarding/create",
            requiredPermission: Permissions.ONBOARDING_CREATE,
          },
          {
            key: "/onbording/onboarded",
            icon: I(UserCheck),
            label: "Onborded",
            path: "/onboarding/onboarded",
            requiredPermission: Permissions.ONBOARDING_READ,
          },
          {
            key: "/onbording/settings",
            icon: I(Settings),
            label: "Settings",
            path: "/onboarding/settings",
            requiredPermission: Permissions.ONBOARDING_SETTING_READ,
          },
        ],
      },

      {
        key: "employee-exit",
        icon: I(LogOut),
        label: "Employee Exit",
        requiredPermission: Permissions.EXIT_READ,
        children: [
          {
            key: "/employee-exit/management",
            label: "Employee Exit Management",
            icon: I(UserMinus),
            path: "/employee-exit/management",
            requiredPermission: Permissions.EXIT_READ,
          },
          {
            key: "/employee-exit/configuration",
            label: "Configuration",
            icon: I(Sliders),
            path: "/employee-exit/configuration",
            requiredPermission: Permissions.EXIT_MANAGE,
          },
        ],
      },
      {
        key: "/performance",
        label: "Performance View",
        icon: I(TrendingUp),
        path: "/perfomance-management",
        requiredPermission: Permissions.PERFORMANCE_READ,
      },
      {
        key: "/opening-management",
        label: "Opening Management",
        icon: I(Megaphone),
        path: "/opening-management",
        requiredPermission: Permissions.OPENING_READ,
      },
    ],
  },
  {
    key: "FINANCE",
    label: "FINANCE",
    icon: I(Wallet),
    pathPrefixes: ["/accounts", "/invoice", "/reimbursement", "/salary", "/payouts"],
    defaultPath: "/accounts/accounts-dashboard",
    requiredAnyPermission: [
      Permissions.ACCOUNT_READ,
      Permissions.INVOICE_READ,
      Permissions.INVOICE_DASHBOARD_READ,
      Permissions.INVOICE_HISTORY_READ,
      Permissions.INVOICE_TEMPLATE_READ,
      Permissions.INVOICE_CUSTOMER_READ,
      Permissions.INVOICE_TRASH_READ,
      Permissions.INVOICE_MANAGE,
      Permissions.SALARY_READ,
    ],
    items: [
      {
        key: "/accounts",
        label: "Accounts",
        icon: I(Landmark),
        requiredPermission: Permissions.ACCOUNT_READ,
        children: [
          {
            key: "/accounts",
            label: "Dashboard",
            icon: I(BarChart3),
            path: "/accounts/accounts-dashboard",
            requiredPermission: Permissions.ACCOUNT_READ,
          },
          {
            key: "/accounts/settings",
            label: "Settings",
            icon: I(Settings),
            path: "/accounts/settings",
            requiredPermission: Permissions.ACCOUNT_SETTING_READ,
          },

        ],
      },
      {
        key: "invoice",
        label: "Invoice",
        icon: I(Receipt),
        requiredAnyPermission: [
          Permissions.INVOICE_READ,
          Permissions.INVOICE_DASHBOARD_READ,
          Permissions.INVOICE_HISTORY_READ,
          Permissions.INVOICE_TEMPLATE_READ,
          Permissions.INVOICE_CUSTOMER_READ,
          Permissions.INVOICE_TRASH_READ,
          Permissions.INVOICE_MANAGE,
        ],
        children: [
          {
            key: "/invoice/",
            label: "Dashboard",
            icon: I(LineChart),
            path: "/invoice/dashboard",
            requiredAnyPermission: [
              Permissions.INVOICE_DASHBOARD_READ,
            ],
          },
          {
            key: "/invoice/invoices",
            label: "Invoices",
            icon: I(Files),
            path: "/invoice/invoices",
            requiredAnyPermission: [
              Permissions.INVOICE_READ,
            ],
          },
          {
            key: "/invoice/newinvoice",
            label: "New Invoice",
            icon: I(FilePlus),
            path: "/invoice/newinvoice",
            requiredAnyPermission: [
              Permissions.INVOICE_CREATE,
            ],
          },
          {
            key: "/invoice/templates",
            label: "Template",
            icon: I(LayoutTemplate),
            path: "/invoice/templates",
            requiredAnyPermission: [
              Permissions.INVOICE_TEMPLATE_READ,
            ],
          },
          {
            key: "/invoice/customers",
            label: "Customers",
            icon: I(Contact),
            path: "/invoice/customers",
            requiredAnyPermission: [
              Permissions.INVOICE_CUSTOMER_READ,
              Permissions.INVOICE_MANAGE,
            ],
          },
          {
            key: "/invoice/settings",
            label: "Settings",
            icon: I(Settings2),
            path: "/invoice/settings",
            requiredAnyPermission: [
              Permissions.INVOICE_SETTING_READ,
              Permissions.INVOICE_MANAGE,
            ],
          },
          {
            key: "/invoice/trash",
            label: "Trash",
            icon: I(Trash2),
            path: "/invoice/trash",
            requiredAnyPermission: [
              Permissions.INVOICE_TRASH_READ,
              Permissions.INVOICE_MANAGE,
            ],
          },
        ],
      },
      // {
      //   key: "/reimbursement",
      //   label: "Reimbursement",
      //   icon: I(HandCoins),
      //   path: "/reimbursement",
      //   requiredPermission: Permissions.REIMBURSEMENT_READ,
      // },
      // {
      //   key: "salary",
      //   label: "Payroll",
      //   icon: I(Banknote),
      //   requiredPermission: Permissions.SALARY_READ,
      //   children: [
      //     {
      //       key: "/salary/Create-payslip",
      //       label: "Create Payslip",
      //       icon: I(FilePlus),
      //       path: "/salary/Create-payslip",
      //       requiredPermission: Permissions.SALARY_MANAGE,
      //     },
      //     {
      //       key: "/salary/salarypreview",
      //       label: "Salary Preview",
      //       icon: I(FileSearch),
      //       requiredPermission: Permissions.SALARY_READ,
      //       children: [
      //         {
      //           key: "/salary/salarypreview/preview",
      //           label: "Preview",
      //           icon: I(Eye),
      //           path: "/salary/salarypreview/preview",
      //           requiredPermission: Permissions.SALARY_READ,
      //         },
      //         {
      //           key: "/salary/salarypreview/bulk-preview",
      //           label: "Bulk Preview",
      //           icon: I(Files),
      //           path: "/salary/salarypreview/bulk-preview",
      //           requiredPermission: Permissions.SALARY_READ,
      //         },
      //         {
      //           key: "/salary/salarypreview/approvals",
      //           label: "Approvals",
      //           icon: I(CheckCheck),
      //           path: "/salary/salarypreview/approvals",
      //           requiredPermission: Permissions.SALARY_APPROVE,
      //         },
      //       ],
      //     },
      //     {
      //       key: "/salary/My-Payslip",
      //       label: "My Payslip",
      //       icon: I(FileText),
      //       path: "/salary/My-Payslip",
      //       requiredPermission: Permissions.SALARY_READ,
      //     },
      //     {
      //       key: "/salary/Generate-payslip",
      //       label: "Generate Payslip",
      //       icon: I(Sparkles),
      //       path: "/salary/Generate-payslip",
      //       requiredPermission: Permissions.SALARY_MANAGE,
      //     },
      //     {
      //       key: "/salary/approved-payouts",
      //       label: "Approved Payrolls",
      //       icon: I(CheckCircle2),
      //       path: "/salary/approved-payouts",
      //       requiredPermission: Permissions.SALARY_READ,
      //     },
      //     {
      //       key: "/salary/Payslips",
      //       label: "Payslips",
      //       icon: I(FileClock),
      //       path: "/salary/Payslips",
      //       requiredPermission: Permissions.SALARY_READ,
      //     },
      //     {
      //       key: "salary-settings",
      //       label: "Settings",
      //       icon: I(SlidersHorizontal),
      //       requiredPermission: Permissions.SALARY_MANAGE,
      //       children: [
      //         {
      //           key: "/salary/Settings/company",
      //           label: "Company Configuration",
      //           icon: I(Building2),
      //           path: "/salary/Settings/company",
      //         },
      //         {
      //           key: "/salary/Settings/payslip",
      //           label: "Payslip Configuration",
      //           icon: I(FileCog),
      //           path: "/salary/Settings/payslip",
      //         },
      //         {
      //           key: "/salary/Settings/employee",
      //           label: "Employee Details",
      //           icon: I(IdCard),
      //           path: "/salary/Settings/employee",
      //         },
      //         {
      //           key: "/salary/Settings/salaryStructure",
      //           label: "Salary Structure",
      //           icon: I(Layers),
      //           path: "/salary/Settings/salaryStructure",
      //         },
      //         {
      //           key: "/salary/Settings/allowance",
      //           label: "Salary Component",
      //           icon: I(PieChart),
      //           path: "/salary/Settings/allowance",
      //         },
      //         {
      //           key: "/salary/Settings/employeeAssignment",
      //           label: "Assign Structure",
      //           icon: I(UserPlus),
      //           path: "/salary/Settings/employeeAssignment",
      //         },
      //         {
      //           key: "/salary/Settings/salary-approver",
      //           label: "Salary Approvers",
      //           icon: I(UserCheck),
      //           path: "/salary/Settings/salary-approver",
      //         },
      //       ],
      //     },
      //   ],
      // },
    ],
  },
];
