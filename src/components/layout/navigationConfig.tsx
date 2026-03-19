import React from "react";
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
} from "@ant-design/icons";
import { IoSettingsOutline } from "react-icons/io5";

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
    pathPrefixes: ["/dashboard","/integrations"],
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
    requiredAnyPermission: [Permissions.PROJECT_READ, Permissions.TICKET_READ, Permissions.TIMESHEET_READ, Permissions.DAILY_UPDATE_READ, Permissions.DOCUMENT_READ],
    items: [
      {
        key: "projects-group",
        label: "Tickets",
        icon: <ProjectOutlined />,
        requiredAnyPermission: [Permissions.PROJECT_READ, Permissions.TICKET_READ],
        children: [
          {
            key: "/projects",
            label: "Overview",
            icon: <DashboardOutlined />,
            path: "/projects",
            requiredAnyPermission: [Permissions.PROJECT_READ, Permissions.TICKET_READ],
          },
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
            requiredAnyPermission: [Permissions.PROJECT_MANAGE, Permissions.TICKET_MANAGE],
          },
          {
            key: "/projects/archived",
            label: "Archived",
            icon: <InboxOutlined />,
            path: "/projects/archived",
            requiredAnyPermission: [Permissions.PROJECT_READ, Permissions.TICKET_READ],
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
        key: "timesheet",
        label: "Timesheet",
        icon: <ClockCircleOutlined />,
        path: "/timesheet",
        requiredPermission: Permissions.TIMESHEET_READ,
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
    key: "HRMS",
    label: "HRMS",
    icon: <TeamOutlined />,
    pathPrefixes: [
      "/members",
      "/profile",
      "/attendance",
      "/leaves",
      "/org-structure",
      "/onboarding",
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
        key: "/attendance",
        label: "Attendance",
        icon: <ClockCircleOutlined />,
        path: "/attendance",
        requiredPermission: Permissions.ATTENDANCE_READ,
      },
      {
        key: "/leaves-dashboard",
        label: "Leave Management",
        icon: <CalendarOutlined />,
        path: "/leaves-dashboard",
        requiredPermission: Permissions.LEAVE_READ,
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
            key: "/onbording/create",
            icon: <SafetyOutlined />,
            label: "Onborded",
            path: "/onboarding/onboarded",
            requiredPermission: Permissions.ONBOARDING_READ,
          },
          {
            key: "/onbording/create",
            icon: <IoSettingsOutline />,
            label: "Settings",
            path: "/onboarding/settings",
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
    ],
  },
  {
    key: "FINANCE",
    label: "FINANCE",
    icon: <WalletOutlined />,
    pathPrefixes: ["/accounts", "/clients-v2", "/invoicepro", "/reimbursement", "/salary"],
    defaultPath: "/accounts",
    requiredAnyPermission: [Permissions.TRANSACTION_READ, Permissions.INVOICE_READ, Permissions.SALARY_READ],
    items: [
      {
        key: "/accounts",
        label: "Accounts",
        icon: <WalletOutlined />,
        path: "/accounts",
      },
      {
        key: "/clients-v2",
        label: "Client Management",
        icon: <TeamOutlined />,
        path: "/clients-v2",
      },
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
  {
    key: "ADMIN",
    label: "ADMIN",
    icon: <SettingOutlined />,
    pathPrefixes: ["/clients", "/clients-v2", "/settings", "/admin", "/roles"],
    defaultPath: "/clients-v2",
    requiredAnyPermission: [Permissions.CLIENT_READ, Permissions.SETTINGS_READ, Permissions.ROLE_READ],
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
        key: "/roles",
        label: "Roles & Permissions",
        icon: <SafetyOutlined />,
        path: "/roles",
        requiredPermission: Permissions.ROLE_READ,
      },
    ],
  },
];
