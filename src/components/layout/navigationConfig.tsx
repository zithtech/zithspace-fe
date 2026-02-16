import React from "react";
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
} from "@ant-design/icons";

export type ModuleType = "HOME" | "WORK" | "HRMS" | "FINANCE" | "ADMIN";

export interface NavItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: NavItem[];
  disabled?: boolean;
}

export interface ModuleConfig {
  key: ModuleType;
  label: string;
  icon?: React.ReactNode; // Icon for TopNav display
  pathPrefixes: string[]; // URLs starting with these belong to this module
  items: NavItem[];
  defaultPath?: string; // Optional default path to navigate to when module is selected
}

export const NAVIGATION_CONFIG: ModuleConfig[] = [
  {
    key: "HOME",
    label: "HOME",
    icon: <HomeOutlined />,
    pathPrefixes: ["/dashboard"],
    defaultPath: "/dashboard",
    items: [
      {
        key: "/dashboard",
        label: "Dashboard",
        icon: <DashboardOutlined />,
        path: "/dashboard",
      },
    ],
  },
  {
    key: "WORK",
    label: "WORK",
    icon: <ProjectOutlined />,
    pathPrefixes: ["/projects", "/documenthub", "/timesheet", "/daily-updates"],
    defaultPath: "/projects",
    items: [
      {
        key: "projects-group",
        label: "Tickets",
        icon: <ProjectOutlined />,
        children: [
          {
            key: "/projects",
            label: "Overview",
            icon: <DashboardOutlined />,
            path: "/projects",
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
          },
          {
            key: "/projects/create",
            label: "Create Ticket",
            icon: <FormOutlined />,
            path: "/projects/create",
          },
          {
            key: "/projects/select",
            label: "Tickets",
            icon: <CheckSquareOutlined />,
            path: "/projects/select",
          },
          {
            key: "/projects/buckets",
            label: "Buckets",
            icon: <DatabaseOutlined />,
            path: "/projects/buckets",
          },
          {
            key: "/projects/settings",
            label: "Settings",
            icon: <ControlOutlined />,
            path: "/projects/settings",
          },
          {
            key: "/projects/trash",
            label: "Trash",
            icon: <DeleteOutlined />,
            path: "/projects/trash",
          },
          {
            key: "/projects/archived",
            label: "Archived",
            icon: <InboxOutlined />,
            path: "/projects/archived",
          },
        ],
      },
      {
            key: "/projects/manage",
            label: "Projects",
            icon: <FolderOutlined />,
            path: "/projects/manage",
          },
      {
        key: "timesheet",
        label: "Timesheet",
        icon: <ClockCircleOutlined />,
        path: "/timesheet",
      },
      {
        key: "daily-updates-group",
        label: "Daily Updates",
        icon: <ReconciliationOutlined />,
        children: [
          {
            key: "/daily-updates/submit",
            label: "Submit Update",
            icon: <EditOutlined />,
            path: "/daily-updates/submit",
          },
          {
            key: "/daily-updates/view",
            label: "View Updates",
            icon: <EyeOutlined />,
            path: "/daily-updates/view",
          },
        ],
      },
      {
        key: "documenthub",
        label: "Document Hub",
        icon: <FolderOpenOutlined />,
        path: "/documenthub",
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
    ],
    defaultPath: "/members",
    items: [
      {
        key: "/members",
        label: "Members",
        icon: <UsergroupAddOutlined />,
        path: "/members",
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
      },
      {
        key: "/leaves-dashboard",
        label: "Leave Management",
        icon: <CalendarOutlined />,
        path: "/leaves-dashboard",
      },
      {
        key: "orgstructure",
        icon: <ApartmentOutlined />,
        label: "Org-structure",
        children: [
          {
            key: "/org-structure/overview",
            icon: <EyeOutlined />,
            label: "Overview",
            path: "/org-structure/overview",
          },
          {
            key: "/org-structure/grades",
            icon: <SafetyOutlined />,
            label: "Grades",
            path: "/org-structure/grades",
          },
          {
            key: "/org-structure/employment-types",
            icon: <FileDoneOutlined />,
            label: "Employment Types",
            path: "/org-structure/employment-types",
          },
          {
            key: "/org-structure/departments",
            icon: <BankOutlined />,
            label: "Departments",
            path: "/org-structure/departments",
          },
          {
            key: "/org-structure/sub-departments",
            icon: <ApartmentOutlined />,
            label: "Sub Departments",
            path: "/org-structure/sub-departments",
          },
          {
            key: "/org-structure/positions",
            icon: <TeamOutlined />,
            label: "Positions",
            path: "/org-structure/positions",
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
    items: [
      {
        key: "/accounts",
        label: "Accounts",
        icon: <WalletOutlined />,
        path: "/accounts",
      },
      {
        key: "invoicepro",
        label: "InvoicePro",
        icon: <AccountBookOutlined />,
        children: [
          {
            key: "/invoicepro/dashboard",
            label: "Dashboard",
            icon: <BarChartOutlined />,
            path: "/invoicepro/dashboard",
          },
          {
            key: "/invoicepro/invoices",
            label: "Invoices",
            icon: <FileSyncOutlined />,
            path: "/invoicepro/invoices",
          },
          {
            key: "/invoicepro/newinvoice",
            label: "New Invoice",
            icon: <FileAddOutlined />,
            path: "/invoicepro/newinvoice",
          },
          {
            key: "/invoicepro/customers",
            label: "Customers",
            icon: <UserAddOutlined />,
            path: "/invoicepro/customers",
          },
          {
            key: "/invoicepro/settings",
            label: "Settings",
            icon: <SettingOutlined />,
            path: "/invoicepro/settings",
          },
        ],
      },
      {
        key: "/reimbursement",
        label: "Reimbursement",
        icon: <TransactionOutlined />,
        path: "/reimbursement",
      },
      {
        key: "salary",
        label: "Payroll",
        icon: <MoneyCollectOutlined />,
        children: [
          {
            key: "/salary/Create-payslip",
            label: "Create Payslip",
            icon: <FormOutlined />,
            path: "/salary/Create-payslip",
          },
          {
            key: "/salary/My-Payslip",
            label: "My Payslip",
            icon: <SolutionOutlined />,
            path: "/salary/My-Payslip",
          },
          {
            key: "/salary/Generate-payslip",
            label: "Generate Payslip",
            icon: <FileAddOutlined />,
            path: "/salary/Generate-payslip",
          },
          {
            key: "/salary/Payslips",
            label: "Payslips",
            icon: <SnippetsOutlined />,
            path: "/salary/Payslips",
          },
          {
            key: "/salary/Settings",
            label: "Settings",
            icon: <ControlOutlined />,
            path: "/salary/Settings",
          },
        ],
      },
    ],
  },
  {
    key: "ADMIN",
    label: "ADMIN",
    icon: <SettingOutlined />,
    pathPrefixes: ["/clients", "/settings", "/admin"],
    defaultPath: "/clients",
    items: [
      {
        key: "/clients",
        label: "Clients",
        icon: <UserAddOutlined />,
        path: "/clients",
      },
      {
        key: "/settings",
        label: "General Settings",
        icon: <ControlOutlined />,
        path: "/settings",
      },
    ],
  },
];
