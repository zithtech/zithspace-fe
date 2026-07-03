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
  Zap,
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
    pathPrefixes: ["/tickets", "/projects", "/documenthub", "/proposals", "/timesheet", "/daily-updates", "/escalations", "/leads", "/bidiq", "/squad", "/time-tracking"],
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
          // {
          //   key: "/projects/create",
          //   label: "Create Ticket",
          //   icon: I(FilePlus2),
          //   path: "/projects/create",
          //   requiredPermission: Permissions.TICKET_CREATE,
          // },
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
        key: "proposals-group",
        label: "Proposals",
        icon: I(FileSignature),
        requiredPermission: Permissions.PROPOSAL_READ,
        children: [
          {
            key: "/proposals",
            label: "All Proposals",
            icon: I(List),
            path: "/proposals",
            requiredPermission: Permissions.PROPOSAL_READ,
          },
          {
            key: "/proposals/builder",
            label: "Create Proposal",
            icon: I(FilePlus2),
            path: "/proposals/builder",
            requiredAnyPermission: [Permissions.PROPOSAL_CREATE, Permissions.PROPOSAL_UPDATE],
          },
          {
            key: "/proposals/sections",
            label: "Section Library",
            icon: I(LayoutGrid),
            path: "/proposals/sections",
            requiredPermission: Permissions.PROPOSAL_READ,
          },
          {
            key: "/proposals/templates",
            label: "Template Library",
            icon: I(Layers),
            path: "/proposals/templates",
            requiredPermission: Permissions.PROPOSAL_READ,
          },
          {
            key: "/proposals/trash",
            label: "Trash",
            icon: I(Trash2),
            path: "/proposals/trash",
            requiredPermission: Permissions.PROPOSAL_READ,
          },
        ],
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
          {
            key: "/escalations/trash",
            label: "Trash",
            icon: I(Trash2),
            path: "/escalations/trash",
            requiredPermission: Permissions.ESCALATION_READ,
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
        key: "/bidiq",
        label: "BidIq",
        icon: I(Zap),
        path: "/bidiq",
        requiredPermission: Permissions.BIDIQ_READ,
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
      "/members/trash",
      "/org-structure",
    ],
    defaultPath: "/clients-v2",
    requiredAnyPermission: [
      Permissions.CLIENT_READ,
      Permissions.SETTINGS_READ,
      Permissions.ROLE_READ,
      Permissions.USER_READ,
      Permissions.USER_TRASH_READ,
      Permissions.ORG_READ,
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
        key: "members-group",
        label: "Members",
        icon: I(Users),
        requiredAnyPermission: [
          Permissions.USER_READ,
          Permissions.USER_TRASH_READ,
        ],
        children: [
          {
            key: "/members",
            label: "Members",
            icon: I(Users),
            path: "/members",
            requiredPermission: Permissions.USER_READ,
          },
          {
            key: "/members/trash",
            label: "Trash",
            icon: I(Trash2),
            path: "/members/trash",
            requiredPermission: Permissions.USER_TRASH_READ,
          },
        ],
      },
      {
        key: "/roles",
        label: "Roles & Permissions",
        icon: I(KeyRound),
        path: "/roles",
        requiredPermission: Permissions.ROLE_READ,
      },
      {
        // Submodule navigation moved into the in-page left sidebar
        // (see src/app/org-structure/layout.tsx). Each submodule keeps its
        // own URL; this single entry opens the module on its Overview page.
        key: "/org-structure",
        icon: I(Network),
        label: "Org Structure",
        path: "/org-structure/overview",
        requiredPermission: Permissions.ORG_READ,
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
      "/leaves-v2",
      "/add-goverment-leaves",
      "/onboarding",
      "/employee-exit",
      "/performance",
      "/performance-report",
      "/opening-management",
    ],
    defaultPath: "/profile",
    requiredAnyPermission: [
      Permissions.PROFILE_READ,
      Permissions.ATTENDANCE_READ,
      Permissions.LEAVE_READ,
      Permissions.PERFORMANCE_REPORT_READ,
      Permissions.PERFORMANCE_REPORT_SETTING_READ,
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
        key: "/leaves-v2",
        label: "Leaves",
        icon: I(CalendarDays),
        path: "/leaves-v2",
        requiredAnyPermission: [
          Permissions.LEAVE_READ,
          Permissions.LEAVE_MANAGE,
        ],
      },
      {
        key: "/attendance",
        label: "Attendance",
        icon: I(CalendarCheck),
        path: "/attendance",
        requiredAnyPermission: [
          Permissions.ATTENDANCE_READ,
          Permissions.ATTENDANCE_DASHBOARD_READ,
          Permissions.ATTENDANCE_CLOCK_IN_OUT,
          Permissions.ATTENDANCE_CREATE,
          Permissions.ATTENDANCE_UPDATE,
          Permissions.ATTENDANCE_DELETE,
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
        key: "performance-report",
        icon: I(TrendingUp),
        label: "Performance Report",
        requiredAnyPermission: [
          Permissions.PERFORMANCE_REPORT_READ,
          Permissions.PERFORMANCE_REPORT_SETTING_READ,
          Permissions.PERFORMANCE_REPORT_SETTING_UPDATE,
        ],
        children: [
          {
            key: "/performance-report/reports",
            icon: I(Gauge),
            label: "Reports",
            path: "/performance-report/reports",
            requiredPermission: Permissions.PERFORMANCE_REPORT_READ,
          },
          {
            key: "/performance-report/settings",
            icon: I(SlidersHorizontal),
            label: "Settings",
            path: "/performance-report/settings",
            requiredPermission: Permissions.PERFORMANCE_REPORT_SETTING_READ,
          },
          {
            key: "/performance-report/generated",
            icon: I(Archive),
            label: "Generated Reports",
            path: "/performance-report/generated",
            requiredPermission: Permissions.PERFORMANCE_REPORT_GENERATED_READ,
          },
          {
            key: "/performance-report/my-reports",
            icon: I(CircleUser),
            label: "My Reports",
            path: "/performance-report/my-reports",
            requiredPermission: Permissions.PERFORMANCE_REPORT_MY_READ,
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
    pathPrefixes: ["/accounts", "/invoice", "/reimbursement", "/payouts", "/payroll-v2"],
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
      {
        key: "/payroll-v2",
        label: "Payroll 2.0",
        icon: I(Banknote),
        path: "/payroll-v2",
        requiredAnyPermission: [
          Permissions.PAYROLL_SETTING_READ,
          Permissions.PAYROLL_READ,
          Permissions.PAYROLL_MANAGE,
        ],
      },
    ],
  },
];
