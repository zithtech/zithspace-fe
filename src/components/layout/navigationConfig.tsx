import React from "react";
export const NAV_MOBILE_BREAKPOINT = 700;
import { Permissions } from "@/types/permissions";
import {
  DashboardOutlined,
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  SettingOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  CalendarOutlined,
  ControlOutlined,
  MoneyCollectOutlined,
  ProfileOutlined,
  FileAddOutlined,
  SnippetsOutlined,
  InboxOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  AccountBookOutlined,
  BarChartOutlined,
  FileZipOutlined,
  TransactionOutlined,
  EyeOutlined,
  FolderOutlined,
  RocketOutlined,
  FormOutlined,
  CheckSquareOutlined,
  DatabaseOutlined,
  ReconciliationOutlined,
  FileDoneOutlined,
  WalletOutlined,
  UserAddOutlined,
  SafetyOutlined,
  SolutionOutlined,
  ApartmentOutlined,
  BankOutlined,
  FileSyncOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  CalendarTwoTone,
  UsergroupAddOutlined,
  HomeOutlined,
  PlusOutlined,
  AppstoreOutlined,
  CheckCircleOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import { IoSettingsOutline } from "react-icons/io5";
import { BsPersonWorkspace } from "react-icons/bs";
import { ImProfile } from "react-icons/im";


import { TiGroup } from "react-icons/ti";
import { BsGridFill } from "react-icons/bs";
import { TiGroupOutline } from "react-icons/ti";
import { BsPersonFillCheck } from "react-icons/bs";
export type ModuleType = "HOME" | "WORK" | "HRMS" | "FINANCE" | "ADMIN";

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

export const NAVIGATION_CONFIG: ModuleConfig[] = [
  {
    key: "HOME",
    label: "HOME",
    icon: <HomeOutlined />,
    pathPrefixes: ["/dashboard", "/integrations"],
    defaultPath: "/dashboard",
    // Dashboard should be accessible to all authenticated users - no permission required
    items: [
      {
        key: "/dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined />,
        path: "/dashboard",
        // Dashboard accessible to all users - no permission required
      },
      {
        key: "/integrations",
        label: "Integrations",
        icon: <DashboardOutlined />,
        path: "/integrations",
      },
    ],
  },
  {
    key: "WORK",
    label: "WORK",
    icon: <ProjectOutlined />,
    pathPrefixes: ["/projects", "/documenthub", "/timesheet", "/daily-updates"],
    defaultPath: "/projects/select",
    requiredAnyPermission: [
      Permissions.PROJECT_READ,
      Permissions.TICKET_READ,
      Permissions.TIMESHEET_READ,
      Permissions.DAILY_UPDATE_READ,
      Permissions.DOCUMENT_READ,
    ],
    items: [
      {
        key: "projects-group",
        label: "Tickets",
        icon: <ProjectOutlined />,
        requiredAnyPermission: [
          Permissions.PROJECT_READ,
          Permissions.TICKET_READ,
        ],
        children: [
          // {
          //   key: "/projects",
          //   label: "Overview",
          //   icon: <DashboardOutlined />,
          //   path: "/projects",
          //   requiredAnyPermission: [
          //     Permissions.PROJECT_READ,
          //     Permissions.TICKET_READ,
          //   ],
          // },
          //   {
          //     key: "/projects/manage",
          //     label: "Projects",
          //     icon: <FolderOutlined />,
          //     path: "/projects/manage",
          //   },
          {
            key: "/projects/plans",
            label: "Plans",
            icon: <RocketOutlined />,
            path: "/projects/plans",
            requiredPermission: Permissions.PROJECT_READ,
          },
          {
            key: "/projects/create",
            label: "Create Ticket",
            icon: <FormOutlined />,
            path: "/projects/create",
            requiredPermission: Permissions.TICKET_CREATE,
          },
          {
            key: "/projects/select",
            label: "Tickets",
            icon: <CheckSquareOutlined />,
            path: "/projects/select",
            requiredPermission: Permissions.TICKET_READ,
          },
          {
            key: "/projects/buckets",
            label: "Buckets",
            icon: <DatabaseOutlined />,
            path: "/projects/buckets",
            requiredPermission: Permissions.PROJECT_READ,
          },
          {
            key: "/projects/settings",
            label: "Settings",
            icon: <ControlOutlined />,
            path: "/projects/settings",
            requiredPermission: Permissions.PROJECT_MANAGE,
          },
          {
            key: "/projects/trash",
            label: "Trash",
            icon: <DeleteOutlined />,
            path: "/projects/trash",
            requiredAnyPermission: [
              Permissions.PROJECT_MANAGE,
              Permissions.TICKET_MANAGE,
            ],
          },
          {
            key: "/projects/archived",
            label: "Archived",
            icon: <InboxOutlined />,
            path: "/projects/archived",
            requiredAnyPermission: [
              Permissions.PROJECT_READ,
              Permissions.TICKET_READ,
            ],
          },
        ],
      },
      {
        key: "/projects/manage",
        label: "Projects",
        icon: <FolderOutlined />,
        path: "/projects/manage",
        requiredPermission: Permissions.PROJECT_READ,
      },
      {
        key: "timesheet-group",
        label: "Timesheet",
        icon: <ClockCircleOutlined />,
        requiredPermission: Permissions.TIMESHEET_READ,
        children: [
          {
            key: "/timesheet/dashboard",
            label: "Dashboard",
            icon: <DashboardOutlined />,
            path: "/timesheet/dashboard",
          },
          {
            key: "/timesheet",
            label: "My Timesheets",
            icon: <FileTextOutlined />,
            path: "/timesheet",
          },
          {
            key: "/timesheet/submit",
            label: "Submit Timesheet",
            icon: <EditOutlined />,
            path: "/timesheet/submit",
            requiredPermission: Permissions.TIMESHEET_CREATE,
          },
          {
            key: "/timesheet/teams",
            label: "Teams",
            icon: <TeamOutlined />,
            path: "/timesheet/teams",
            requiredPermission: Permissions.TIMESHEET_APPROVE,
          },
        ],
      },
      {
        key: "time-tracking",
        label: "Time Tracking",
        icon: <ClockCircleOutlined />,
        children: [
          {
            key: "/time-tracking/my",
            label: "My Time Tracking",
            icon: <UserOutlined />,
            path: "/time-tracking/my",
          },
          {
            key: "/time-tracking/team",
            label: "Team View",
            icon: <TeamOutlined />,
            path: "/time-tracking/team",
          },
        ],
      },
      {
        key: "daily-updates-group",
        label: "Daily Updates",
        icon: <ReconciliationOutlined />,
        requiredPermission: Permissions.DAILY_UPDATE_READ,
        children: [
          {
            key: "/daily-updates/submit",
            label: "Submit Update",
            icon: <EditOutlined />,
            path: "/daily-updates/submit",
            requiredPermission: Permissions.DAILY_UPDATE_CREATE,
          },
          {
            key: "/daily-updates/view",
            label: "View Updates",
            icon: <EyeOutlined />,
            path: "/daily-updates/view",
            requiredPermission: Permissions.DAILY_UPDATE_READ,
          },
        ],
      },
      {
        key: "documenthub",
        label: "Document Hub",
        icon: <FolderOpenOutlined />,
        path: "/documenthub",
        requiredPermission: Permissions.DOCUMENT_READ,
      },
      {
        key: "squadManagement",
        label: "Squad Management",
        icon: <TiGroup />,
        path: "/squad",
        requiredPermission: Permissions.DOCUMENT_READ,
      },
      {
        key: "candidateForm",
        label: "Candidate Form",
        icon: <BsPersonWorkspace />,
        path: "/candidateForm",
        requiredPermission: Permissions.DOCUMENT_READ,
      },
      {
        key: "releasenotes",
        icon: <FileTextOutlined />,
        label: "Release Notes",
        requiredPermission: Permissions.PROJECT_READ,
        children: [
          {
            key: "/releasenotes/dashboard",
            path: "/releasenotes/dashboard",
            icon: <AppstoreOutlined />,
            label: "Dashboard",
            requiredPermission: Permissions.PROJECT_READ,
          },
          {
            key: "/releasenotes",
            path: "/releasenotes",
            icon: <FileTextOutlined />,
            label: "Release",
            requiredPermission: Permissions.PROJECT_READ,
          },
          {
            key: "/releasenotes/settings",
            path: "/releasenotes/settings",
            icon: <SettingOutlined />,
            label: "Settings",
            requiredPermission: Permissions.PROJECT_MANAGE,
          },
        ],
      },
    ],
  },
  {
    key: "ADMIN",
    label: "ADMIN",
    icon: <SettingOutlined />,
    pathPrefixes: [
      "/clients",
      "/clients-v2",
      "/settings",
      "/admin",
      "/roles",
      "/recruitment-client",
      "/implementation-partner",
      "/vendor",
    ],
    defaultPath: "/clients-v2",
    requiredAnyPermission: [
      Permissions.CLIENT_READ,
      Permissions.SETTINGS_READ,
      Permissions.ROLE_READ,
    ],
    items: [
      {
        key: "/clients",
        label: "Clients (Legacy)",
        icon: <UserAddOutlined />,
        path: "/clients",
      },
      {
        key: "/clients-v2",
        label: "Clients V2",
        icon: <ApartmentOutlined />,
        path: "/clients-v2",
      },
      {
        key: "/settings",
        label: "General Settings",
        icon: <ControlOutlined />,
        path: "/settings",
        requiredPermission: Permissions.SETTINGS_READ,
      },
      {
        key: "/implementation-partner",
        label: "Implementations",
        icon: <BsGridFill />,
        path: "/implementation-partner",
        requiredPermission: Permissions.SETTINGS_READ,
      },
      {
        key: "/recruitment-client",
        label: "Recruitment Client",
        icon: <TiGroupOutline />,
        path: "/recruitment-client",
        requiredPermission: Permissions.SETTINGS_READ,
      },
      {
        key: "/vendor",
        label: "Vendor",
        icon: <BsPersonFillCheck />,
        path: "/vendor",
        requiredPermission: Permissions.SETTINGS_READ,
      },
      {
        key: "pipeline-group",
        label: "Pipeline",
        icon: <ProjectOutlined />,
        requiredPermission: Permissions.SETTINGS_READ,
        children: [
          {
            key: "/admin/pipeline-settings",
            label: "Settings",
            icon: <SettingOutlined />,
            path: "/admin/pipeline-settings",
          },
          {
            key: "/admin/deals",
            label: "Deals",
            icon: <AccountBookOutlined />,
            path: "/admin/deals",
          },
          {
            key: "/admin/deals/forecast",
            label: "Forecast",
            icon: <BarChartOutlined />,
            path: "/admin/deals/forecast",
          },
          {
            key: "/admin/deals/board",
            label: "Board",
            icon: <AppstoreOutlined />,
            path: "/admin/deals/board",
          },
        ],
      },
      {
        key: "/roles",
        label: "Roles & Permissions",
        icon: <SafetyOutlined />,
        path: "/roles",
        requiredPermission: Permissions.ROLE_READ,
      },
    ],
  },

  {
    key: "HRMS",
    label: "HRMS",
    icon: <TeamOutlined />,
    pathPrefixes: [
      "/members",
      "/profile",
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
      "/org-structure",
      "/onboarding",
      "/recruitment",
      "/employee-exit",
      "/performance",
    ],
    defaultPath: "/members",
    requiredPermission: Permissions.USER_READ,
    items: [
      {
        key: "/members",
        label: "Members",
        icon: <UsergroupAddOutlined />,
        path: "/members",
        requiredPermission: Permissions.USER_READ,
      },
      {
        key: "/profile",
        label: "My Profile",
        icon: <SolutionOutlined />,
        path: "/profile",
      },
      {
        key: "/new-profile",
        label: "Profile 2.0",
        icon: <ImProfile />,
        path: "/new-profile",
      },
      {
        key: "attendance-group",
        label: "Attendance",
        icon: <ClockCircleOutlined />,
        requiredPermission: Permissions.ATTENDANCE_READ,
        children: [
          {
            key: "/attendance/dashboard",
            label: "Dashboard",
            icon: <DashboardOutlined />,
            path: "/attendance/dashboard",
          },
          {
            key: "/attendance/clock-in-out",
            label: "Clock In/Out",
            icon: <ClockCircleOutlined />,
            path: "/attendance/clock-in-out",
          },
          {
            key: "/attendance/manage",
            label: "Manage Attendance",
            icon: <TeamOutlined />,
            path: "/attendance/manage",
            requiredPermission: Permissions.ATTENDANCE_MANAGE,
          },
        ],
      },
      {
        key: "leave-management-group",
        label: "Leave Management",
        icon: <CalendarOutlined />,
        requiredPermission: Permissions.LEAVE_READ,
        children: [
          {
            key: "/leaves-dashboard",
            label: "Dashboard",
            icon: <AppstoreOutlined />,
            path: "/leaves-dashboard",
            requiredPermission: Permissions.LEAVE_READ,
          },
          {
            key: "/apply-leave",
            label: "Apply Leave",
            icon: <PlusOutlined />,
            path: "/apply-leave",
            requiredPermission: Permissions.LEAVE_READ,
          },
          {
            key: "/leave-approvals",
            label: "Approvals",
            icon: <CheckSquareOutlined />,
            path: "/leave-approvals",
            requiredAnyPermission: [
              Permissions.LEAVE_MANAGE,
              Permissions.LEAVE_APPROVE,
            ],
          },
          {
            key: "/government-holidays",
            label: "Government Holidays",
            icon: <ScheduleOutlined />,
            path: "/government-holidays",
            requiredPermission: Permissions.LEAVE_READ,
          },
          {
            key: "/leave-adjustments",
            label: "Leave Adjustment",
            icon: <EditOutlined />,
            path: "/leave-adjustments",
            requiredPermission: Permissions.LEAVE_MANAGE,
          },
          {
            key: "/leave-type",
            label: "Leave Type",
            icon: <SettingOutlined />,
            path: "/leave-type",
            requiredPermission: Permissions.LEAVE_MANAGE,
          },
          {
            key: "/leave-policy",
            label: "Leave Policy",
            icon: <ApartmentOutlined />,
            path: "/leave-policy",
            requiredPermission: Permissions.LEAVE_MANAGE,
          },
          {
            key: "/add-goverment-leaves",
            label: "Add Govt Leaves",
            icon: <PlusOutlined />,
            path: "/add-goverment-leaves",
            requiredPermission: Permissions.LEAVE_MANAGE,
          },
        ],
      },

      {
        key: "Onbording",
        icon: <PlusOutlined />,
        label: "Onbording",
        requiredPermission: Permissions.ONBOARDING_READ,
        children: [
          {
            key: "/onbording/create",
            icon: <EyeOutlined />,
            label: "Create",
            path: "/onboarding/create",
            requiredPermission: Permissions.ONBOARDING_CREATE,
          },
          {
            key: "/onbording/onboarded",
            icon: <SafetyOutlined />,
            label: "Onborded",
            path: "/onboarding/onboarded",
            requiredPermission: Permissions.ONBOARDING_READ,
          },
          {
            key: "/onbording/settings",
            icon: <IoSettingsOutline />,
            label: "Settings",
            path: "/onboarding/settings",
          },
        ],
      },

      {
        key: "employee-exit",
        icon: <UserOutlined />,
        label: "Employee Exit",
        // No specific permission required initially based on requirements
        children: [
          {
            key: "/employee-exit/management",
            label: "Employee Exit Management",
            path: "/employee-exit/management",
          },
          {
            key: "/employee-exit/configuration",
            label: "Configuration",
            path: "/employee-exit/configuration",
          },
        ],
      },
      {
        key: "orgstructure",
        icon: <ApartmentOutlined />,
        label: "Org-structure",
        requiredPermission: Permissions.ORG_READ,
        children: [
          {
            key: "/org-structure/overview",
            icon: <EyeOutlined />,
            label: "Overview",
            path: "/org-structure/overview",
            requiredPermission: Permissions.ORG_READ,
          },
          {
            key: "/org-structure/grades",
            icon: <SafetyOutlined />,
            label: "Grades",
            path: "/org-structure/grades",
            requiredPermission: Permissions.ORG_MANAGE,
          },
          {
            key: "/org-structure/employment-types",
            icon: <FileDoneOutlined />,
            label: "Employment Types",
            path: "/org-structure/employment-types",
            requiredPermission: Permissions.ORG_MANAGE,
          },
          {
            key: "/org-structure/departments",
            icon: <BankOutlined />,
            label: "Departments",
            path: "/org-structure/departments",
            requiredPermission: Permissions.ORG_MANAGE,
          },
          {
            key: "/org-structure/sub-departments",
            icon: <ApartmentOutlined />,
            label: "Sub Departments",
            path: "/org-structure/sub-departments",
            requiredPermission: Permissions.ORG_MANAGE,
          },
          {
            key: "/org-structure/positions",
            icon: <TeamOutlined />,
            label: "Positions",
            path: "/org-structure/positions",
            requiredPermission: Permissions.ORG_MANAGE,
          },
        ],
      },
      // {
      //   key: "/recruitment-settings",
      //   label: "Status & Actions",
      //   icon: <SolutionOutlined />,
      //   path: "/recruitment-settings",
      // },
      {
        key: "/performance",
        label: "Performance View",
        icon: <BarChartOutlined />,
        path: "/perfomance-management",
        requiredPermission: Permissions.USER_READ,
      },
      {
        key: "recruitment-group",
        icon: <TeamOutlined />,
        label: "Recruitment",
        children: [
          {
            key: "/recruitment/job-requisitions",
            label: "Job Requisitions",
            icon: <ProjectOutlined />,
            path: "/recruitment/job-requisitions",
          },
          {
            key: "/recruitment/candidate-management",
            label: "Candidate Management",
            icon: <UserAddOutlined />,
            path: "/recruitment/candidate-management",
          },
          {
            key: "/recruitment-settings",
            label: "Status & Actions",
            icon: <SolutionOutlined />,
            path: "/recruitment-settings",
          },
        ],
      },
    ],
  },
  {
    key: "FINANCE",
    label: "FINANCE",
    icon: <WalletOutlined />,
    pathPrefixes: ["/accounts", "/invoicepro", "/reimbursement", "/salary"],
    defaultPath: "/accounts",
    requiredAnyPermission: [
      Permissions.TRANSACTION_READ,
      Permissions.INVOICE_READ,
      Permissions.SALARY_READ,
    ],
    items: [
      {
        key: "/accounts",
        label: "Accounts",
        icon: <WalletOutlined />,
        path: "/accounts",
      },
      // {
      //   key: "/clients-v2",
      //   label: "Client Management",
      //   icon: <TeamOutlined />,
      //   path: "/clients-v2",
      // },
      {
        key: "invoicepro",
        label: "Invoice",
        icon: <AccountBookOutlined />,
        requiredPermission: Permissions.INVOICE_READ,
        children: [
          {
            key: "/invoicepro/dashboard",
            label: "Dashboard",
            icon: <BarChartOutlined />,
            path: "/invoicepro/dashboard",
            requiredPermission: Permissions.INVOICE_READ,
          },
          {
            key: "/invoicepro/invoices",
            label: "Invoices",
            icon: <FileSyncOutlined />,
            path: "/invoicepro/invoices",
            requiredPermission: Permissions.INVOICE_READ,
          },
          {
            key: "/invoicepro/newinvoice",
            label: "New Invoice",
            icon: <FileAddOutlined />,
            path: "/invoicepro/newinvoice",
            requiredPermission: Permissions.INVOICE_CREATE,
          },
          {
            key: "/invoicepro/templates",
            label: "Template",
            icon: <FileAddOutlined />,
            path: "/invoicepro/templates",
            requiredPermission: Permissions.INVOICE_CREATE,
          },

          {
            key: "/invoicepro/customers",
            label: "Customers",
            icon: <UserAddOutlined />,
            path: "/invoicepro/customers",
            requiredPermission: Permissions.INVOICE_READ,
          },
          {
            key: "/invoicepro/settings",
            label: "Settings",
            icon: <SettingOutlined />,
            path: "/invoicepro/settings",
            requiredPermission: Permissions.SETTINGS_UPDATE,
          },
          {
            key: "/invoicepro/trash",
            label: "Trash",
            icon: <DeleteOutlined />,
            path: "/invoicepro/trash",
            requiredPermission: Permissions.INVOICE_READ,
          },
        ],
      },
      {
        key: "/reimbursement",
        label: "Reimbursement",
        icon: <TransactionOutlined />,
        path: "/reimbursement",
        requiredPermission: Permissions.REIMBURSEMENT_READ,
      },
      {
        key: "salary",
        label: "Payroll",
        icon: <MoneyCollectOutlined />,
        requiredPermission: Permissions.SALARY_READ,
        children: [
          {
            key: "/salary/Create-payslip",
            label: "Create Payslip",
            icon: <FormOutlined />,
            path: "/salary/Create-payslip",
            requiredPermission: Permissions.SALARY_MANAGE,
          },
          {
            key: "/salary/salarypreview",
            label: "Salary Preview",
            icon: <SnippetsOutlined />,
            path: "/salary/salarypreview",
            requiredPermission: Permissions.SALARY_READ,
          },
          {
            key: "/salary/My-Payslip",
            label: "My Payslip",
            icon: <SolutionOutlined />,
            path: "/salary/My-Payslip",
            requiredPermission: Permissions.SALARY_READ,
          },
          {
            key: "/salary/Generate-payslip",
            label: "Generate Payslip",
            icon: <FileAddOutlined />,
            path: "/salary/Generate-payslip",
            requiredPermission: Permissions.SALARY_MANAGE,
          },
          {
            key: "/salary/Payslips",
            label: "Payslips",
            icon: <SnippetsOutlined />,
            path: "/salary/Payslips",
            requiredPermission: Permissions.SALARY_READ,
          },
          {
            key: "/salary/Settings",
            label: "Settings",
            icon: <ControlOutlined />,
            path: "/salary/Settings",
            requiredPermission: Permissions.SALARY_MANAGE,
          },
        ],
      },
    ],
  },
];
