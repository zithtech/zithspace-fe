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
  // WORK – QA Space
  Target,
  ClipboardList,
  Boxes,
  PlayCircle,
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
  Chrome,
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
  Mail,
  Folder,
  ReceiptText,
  MessageSquare,
  Palette,
} from "lucide-react";

const I = (Comp: React.ComponentType<any>) => (
  <Comp size={16} strokeWidth={1.75} className="nav-lucide-icon" />
);

export type ModuleType = "MY_HUB" | "HOME" | "WORK" | "HRMS" | "FINANCE" | "ADMIN" | "REC_SUITE";

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
  /** Show if user has this exact role (e.g. 'super_admin') */
  requiredRole?: string;
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
  /**
   * Controls ONLY whether the top-nav chip is shown (decoupled from route
   * access, which stays on requiredAnyPermission). Use this to hide a module's
   * chip from normal users while keeping its routes reachable via shortcuts
   * (e.g. My Hub deep-links). If present, it takes precedence for chip
   * visibility; if absent, chip visibility falls back to requiredAnyPermission.
   */
  requiredChipAnyPermission?: string[];
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
      {
        key: "/dashboard/settings",
        label: "Dashboard Settings",
        icon: I(Settings2),
        path: "/dashboard/settings",
        requiredRole: "super_admin",
      },
    ],
  },
  {
    key: "WORK",
    label: "WORK",
    icon: I(Briefcase),
    pathPrefixes: ["/tickets", "/projects", "/documenthub", "/proposals", "/timesheet", "/daily-updates", "/escalations", "/leads", "/bidiq", "/squad", "/time-tracking", "/qa-workspace"],
    defaultPath: "/tickets/select",
    requiredAnyPermission: [
      Permissions.PROJECT_READ,
      Permissions.PROJECT_TRASH_READ,
      Permissions.TICKET_READ,
      Permissions.TICKET_CREATE,
      Permissions.TICKET_PLAN_READ,
      Permissions.TICKET_BUCKET_READ,
      Permissions.BUG_READ,
      Permissions.QA_SCOPE_READ,
      Permissions.QA_CASE_READ,
      Permissions.QA_SUITE_READ,
      Permissions.QA_RUN_READ,
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
        key: "qa-workspace",
        label: "QA Space",
        icon: I(Bug),
        requiredAnyPermission: [
          Permissions.QA_SCOPE_READ,
          Permissions.QA_CASE_READ,
          Permissions.QA_SUITE_READ,
          Permissions.QA_RUN_READ,
          Permissions.BUG_READ,
        ],
        children: [
          {
            key: "/qa-workspace/test-scope",
            label: "Scope",
            icon: I(Target),
            path: "/qa-workspace/test-scope",
            requiredPermission: Permissions.QA_SCOPE_READ,
          },
          {
            key: "/qa-workspace/test-cases",
            label: "Cases",
            icon: I(ClipboardList),
            path: "/qa-workspace/test-cases",
            requiredPermission: Permissions.QA_CASE_READ,
          },
          {
            key: "/qa-workspace/test-suites",
            label: "Suites",
            icon: I(Boxes),
            path: "/qa-workspace/test-suites",
            requiredPermission: Permissions.QA_SUITE_READ,
          },
          {
            key: "/qa-workspace/test-runs",
            label: "Runs",
            icon: I(PlayCircle),
            path: "/qa-workspace/test-runs",
            requiredPermission: Permissions.QA_RUN_READ,
          },
          {
            key: "/qa-workspace/bug-list",
            label: "Bug List",
            icon: I(Bug),
            path: "/qa-workspace/bug-list",
            requiredPermission: Permissions.BUG_READ,
          },
          {
            key: "/qa-workspace/settings",
            label: "Settings",
            icon: I(Settings),
            path: "/qa-workspace/settings",
            requiredPermission: Permissions.BUG_READ,
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
      {
        key: "timesheet-group",
        label: "Timesheet",
        icon: I(CalendarClock),
        requiredAnyPermission: [
          Permissions.TIMESHEET_READ,
          Permissions.TIMESHEET_CREATE,
          Permissions.TIMESHEET_APPROVE,
        ],
        children: [
          {
            key: "/timesheet/dashboard",
            label: "Dashboard",
            icon: I(Gauge),
            path: "/timesheet/dashboard",
            requiredPermission: Permissions.TIMESHEET_READ,
          },
          {
            key: "/timesheet",
            label: "My Timesheets",
            icon: I(FileClock),
            path: "/timesheet",
            requiredPermission: Permissions.TIMESHEET_READ,
          },
          {
            key: "/timesheet/submit",
            label: "Submit Timesheet",
            icon: I(Send),
            path: "/timesheet/submit",
            requiredPermission: Permissions.TIMESHEET_CREATE,
          },
          {
            key: "/timesheet/teams",
            label: "Teams",
            icon: I(Users),
            path: "/timesheet/teams",
            requiredPermission: Permissions.TIMESHEET_APPROVE,
          },
          {
            key: "/timesheet/approval",
            label: "Approval",
            icon: I(CheckCircle2),
            path: "/timesheet/approval",
            requiredPermission: Permissions.TIMESHEET_APPROVE,
          },
        ],
      },
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
            key: "/proposals/themes",
            label: "Cover Themes",
            icon: I(Palette),
            path: "/proposals/themes",
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
      {
        key: "/settings/chrome-extension",
        label: "Chrome Extension",
        icon: I(Chrome),
        path: "/settings/chrome-extension",
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
      "/openings",
      "/letters-docs",
      "/pipeline",
    ],
    defaultPath: "/profile",
    requiredAnyPermission: [
      Permissions.PROFILE_READ,
      Permissions.ATTENDANCE_READ,
      Permissions.LEAVE_READ,
      Permissions.PERFORMANCE_REPORT_READ,
      Permissions.PERFORMANCE_REPORT_SETTING_READ,
      Permissions.PERFORMANCE_REPORT_MY_READ,
      Permissions.OPENING_READ,
      Permissions.EXIT_READ,
      Permissions.ONBOARDING_READ,
      Permissions.LETTER_TEMPLATE_READ,
      Permissions.LETTER_READ,
      Permissions.RECRUITMENT_READ,
    ],
    // Chip shown only to managers/HR — normal users reach their own profile,
    // attendance, leaves, etc. via My Hub. Route access still uses the broader
    // requiredAnyPermission above, so nobody is locked out of the routes.
    requiredChipAnyPermission: [
      Permissions.LEAVE_MANAGE,
      Permissions.ATTENDANCE_DASHBOARD_READ,
      Permissions.PERFORMANCE_REPORT_READ,
      Permissions.PERFORMANCE_REPORT_SETTING_READ,
      Permissions.ONBOARDING_READ,
      Permissions.EXIT_READ,
      Permissions.OPENING_READ,
      Permissions.LETTER_TEMPLATE_READ,
      Permissions.LETTER_READ,
      Permissions.RECRUITMENT_READ,
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
        key: "/onboarding/onboarded",
        icon: I(UserPlus),
        label: "Onboarding",
        path: "/onboarding/onboarded",
        requiredAnyPermission: [
          Permissions.ONBOARDING_READ,
          Permissions.ONBOARDING_CREATE,
          Permissions.ONBOARDING_UPDATE,
          Permissions.ONBOARDING_DELETE,
        ],
      },

      {
        key: "/performance-report/reports",
        icon: I(TrendingUp),
        label: "Performance Report",
        path: "/performance-report/reports",
        requiredAnyPermission: [
          Permissions.PERFORMANCE_REPORT_READ,
          Permissions.PERFORMANCE_REPORT_SETTING_READ,
          Permissions.PERFORMANCE_REPORT_SETTING_UPDATE,
        ],
      },
      {
        key: "/letters-docs",
        icon: I(FileText),
        label: "Doc Suite",
        path: "/letters-docs/templates",
        requiredAnyPermission: [
          Permissions.LETTER_TEMPLATE_READ,
          Permissions.LETTER_READ,
        ],
      },
      {
        key: "/pipeline",
        icon: I(Users),
        label: "Recruitment Pipeline",
        path: "/pipeline/candidates",
        requiredAnyPermission: [
          Permissions.RECRUITMENT_READ,
        ],
      },
      {
        key: "/openings",
        icon: I(Megaphone),
        label: "Openings",
        path: "/openings/dashboard",
        requiredAnyPermission: [
          Permissions.OPENING_READ,
          Permissions.OPENING_MANAGE,
        ],
      },

      /* {
              key: "employee-exit",
              label: "Employee Exit",
              icon: I(LogOut),
              path: "/employee-exit/my-requests",
              requiredAnyPermission: [
                Permissions.EXIT_MANAGE,
                Permissions.EXIT_READ,
                Permissions.EXIT_CONFIG_READ
              ],
            },
            {
              key: "/opening-management",
              label: "Opening Management",
              icon: I(Megaphone),
              path: "/opening-management",
              requiredPermission: Permissions.OPENING_READ,
            }, */
    ],
  },
  {
    key: "FINANCE",
    label: "FINANCE",
    icon: I(Wallet),
    pathPrefixes: ["/accounts", "/invoice", "/reimbursement", "/reimbursement-v2", "/payouts", "/payroll-v2"],
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
      Permissions.REIMBURSEMENT_READ,
      Permissions.REIMBURSEMENT_CONFIG_READ,
      Permissions.REIMBURSEMENT_DASHBOARD_READ,
      Permissions.REIMBURSEMENT_APPROVE,
      Permissions.REIMBURSEMENT_PAY,
      Permissions.REIMBURSEMENT_MANAGE,
      Permissions.PAYROLL_MY_PAYSLIPS_READ,
    ],
    // Chip shown only to finance/managers — normal users get "My Payslips" via
    // My Hub. Excludes self-service perms (salary.read, payroll.my_payslips.read)
    // so a normal user with only their own payslip access won't see this chip.
    requiredChipAnyPermission: [
      Permissions.ACCOUNT_READ,
      Permissions.INVOICE_READ,
      Permissions.INVOICE_DASHBOARD_READ,
      Permissions.INVOICE_MANAGE,
      Permissions.PAYROLL_READ,
      Permissions.PAYROLL_MANAGE,
      Permissions.PAYROLL_SETTING_READ,
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
      {
        key: "/reimbursement-v2",
        label: "Reimbursement 2.0",
        icon: I(HandCoins),
        path: "/reimbursement-v2",
        requiredAnyPermission: [
          Permissions.REIMBURSEMENT_READ,
          Permissions.REIMBURSEMENT_CONFIG_READ,
          Permissions.REIMBURSEMENT_DASHBOARD_READ,
          Permissions.REIMBURSEMENT_APPROVE,
          Permissions.REIMBURSEMENT_PAY,
          Permissions.REIMBURSEMENT_MANAGE,
        ],
      },
      {
        key: "/payroll-v2",
        label: "Payroll 2.0",
        icon: I(Banknote),
        path: "/payroll-v2",
        requiredAnyPermission: [
          Permissions.PAYROLL_SETTING_READ,
          Permissions.PAYROLL_READ,
          Permissions.PAYROLL_MANAGE,
          // Lets a normal user reach /payroll-v2/my-payslips via My Hub without
          // being redirected by MainLayout's item-access gate. The page itself
          // scopes what a self-service user actually sees.
          Permissions.PAYROLL_MY_PAYSLIPS_READ,
        ],
      },
    ],
  },
  {
    key: "MY_HUB",
    label: "My Hub",
    icon: I(LayoutGrid),
    pathPrefixes: ["/my-hub"],
    defaultPath: "/my-hub",
    // Gated by the dedicated My Hub permissions (one per page). These are
    // auto-granted to every role, so My Hub is visible to everyone by default.
    requiredAnyPermission: [
      Permissions.MY_HUB_OVERVIEW_READ,
      Permissions.MY_HUB_APPLY_LEAVE_READ,
      Permissions.MY_HUB_ATTENDANCE_READ,
      Permissions.MY_HUB_ESCALATION_READ,
      Permissions.MY_HUB_PERFORMANCE_READ,
      Permissions.MY_HUB_PAYSLIPS_READ,
      Permissions.MY_HUB_PROFILE_READ,
      Permissions.MY_HUB_CLAIMS_READ,
      Permissions.MY_HUB_DOCUMENTS_READ,
    ],
    items: [
      {
        key: "/my-hub",
        label: "Overview",
        icon: I(LayoutGrid),
        path: "/my-hub",
        requiredPermission: Permissions.MY_HUB_OVERVIEW_READ,
      },
      {
        key: "/my-hub/profile",
        label: "My Profile",
        icon: I(CircleUser),
        path: "/my-hub/profile",
        requiredPermission: Permissions.MY_HUB_PROFILE_READ,
      },
      {
        key: "/my-hub/apply-leave",
        label: "Apply Leave",
        icon: I(CalendarPlus),
        path: "/my-hub/apply-leave",
        requiredPermission: Permissions.MY_HUB_APPLY_LEAVE_READ,
      },
      {
        key: "/my-hub/attendance",
        label: "Attendance",
        icon: I(CalendarCheck),
        path: "/my-hub/attendance",
        requiredPermission: Permissions.MY_HUB_ATTENDANCE_READ,
      },
      {
        // Escalations targeting me (not the ones I raised) — the page locks to
        // this personal view when under /my-hub.
        key: "/my-hub/escalations",
        label: "Escalations",
        icon: I(Siren),
        path: "/my-hub/escalations",
        requiredPermission: Permissions.MY_HUB_ESCALATION_READ,
      },
      {
        key: "/my-hub/performance",
        label: "Performance Report",
        icon: I(TrendingUp),
        path: "/my-hub/performance",
        requiredPermission: Permissions.MY_HUB_PERFORMANCE_READ,
      },
      {
        key: "/my-hub/payslips",
        label: "My Payslips",
        icon: I(Banknote),
        path: "/my-hub/payslips",
        requiredPermission: Permissions.MY_HUB_PAYSLIPS_READ,
      },
      {
        key: "/my-hub/claims",
        label: "My Claims",
        icon: I(ReceiptText),
        path: "/my-hub/claims",
        requiredPermission: Permissions.MY_HUB_CLAIMS_READ,
      },
      {
        key: "/my-hub/documents",
        label: "My Documents",
        icon: I(Folder),
        path: "/my-hub/documents",
        requiredPermission: Permissions.MY_HUB_DOCUMENTS_READ,
      },
    ],
  },
];
