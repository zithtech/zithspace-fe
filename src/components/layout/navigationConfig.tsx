import React from 'react';
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
} from '@ant-design/icons';
import { Network, Star, IdCard, Combine, Share2, Proportions, TableOfContents } from 'lucide-react';

export type ModuleType = 'HOME' | 'WORK' | 'HRMS' | 'FINANCE' | 'ADMIN';

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
    pathPrefixes: string[]; // URLs starting with these belong to this module
    items: NavItem[];
    defaultPath?: string; // Optional default path to navigate to when module is selected
}

export const NAVIGATION_CONFIG: ModuleConfig[] = [
    {
        key: 'HOME',
        label: 'HOME',
        pathPrefixes: ['/dashboard'],
        defaultPath: '/dashboard',
        items: [
            {
                key: '/dashboard',
                label: 'Dashboard',
                icon: <DashboardOutlined />,
                path: '/dashboard',
            },
        ],
    },
    {
        key: 'WORK',
        label: 'WORK',
        pathPrefixes: ['/projects', '/documenthub', '/timesheet', '/daily-updates'],
        defaultPath: '/projects',
        items: [
            {
                key: 'projects-group',
                label: 'Projects & Tickets',
                icon: <ProjectOutlined />,
                children: [
                    { key: '/projects', label: 'Overview', icon: <ProjectOutlined />, path: '/projects' },
                    { key: '/projects/manage', label: 'Projects', icon: <ProjectOutlined />, path: '/projects/manage' },
                    { key: '/projects/plans', label: 'Plans', icon: <CalendarOutlined />, path: '/projects/plans' },
                    { key: '/projects/create', label: 'Create Ticket', icon: <PlusCircleOutlined />, path: '/projects/create' },
                    { key: '/projects/select', label: 'Tickets', icon: <UnorderedListOutlined />, path: '/projects/select' },
                    { key: '/projects/buckets', label: 'Buckets', icon: <InboxOutlined />, path: '/projects/buckets' },
                    { key: '/projects/settings', label: 'Settings', icon: <ControlOutlined />, path: '/projects/settings' },
                    { key: '/projects/trash', label: 'Trash', icon: <DeleteOutlined />, path: '/projects/trash' },
                    { key: '/projects/archived', label: 'Archived', icon: <FolderOpenOutlined />, path: '/projects/archived' },
                ],
            },
            {
                key: 'timesheet',
                label: 'Timesheet',
                icon: <ClockCircleOutlined />,
                path: '/timesheet',
            },
            {
                key: 'daily-updates-group',
                label: 'Daily Updates',
                icon: <FileTextOutlined />,
                children: [
                    { key: '/daily-updates/submit', label: 'Submit Update', icon: <PlusCircleOutlined />, path: '/daily-updates/submit' },
                    { key: '/daily-updates/view', label: 'View Updates', icon: <UnorderedListOutlined />, path: '/daily-updates/view' },
                ],
            },
            {
                key: 'documenthub',
                label: 'Document Hub',
                icon: <FileZipOutlined />,
                path: '/documenthub',
            },
        ],
    },
    {
        key: 'HRMS',
        label: 'HRMS',
        pathPrefixes: ['/members', '/profile', '/attendance', '/leaves', '/org-structure'],
        defaultPath: '/members',
        items: [
            {
                key: '/members',
                label: 'Members',
                icon: <TeamOutlined />,
                path: '/members',
            },
            {
                key: '/profile',
                label: 'My Profile',
                icon: <UserOutlined />,
                path: '/profile',
            },
            {
                key: '/attendance',
                label: 'Attendance',
                icon: <ClockCircleOutlined />,
                path: '/attendance',
            },
            {
                key: '/leaves-dashboard',
                label: 'Leave Management',
                icon: <FileTextOutlined />,
                path: '/leaves-dashboard',
            },
            {
                key: 'orgstructure',
                icon: <Network size={18} />,
                label: 'Org-structure',
                children: [
                    { key: '/org-structure/overview', icon: <TableOfContents size={14} />, label: 'Overview', path: '/org-structure/overview' },
                    { key: '/org-structure/grades', icon: <IdCard size={14} />, label: 'Grades', path: '/org-structure/grades' },
                    { key: '/org-structure/employment-types', icon: <Star size={14} />, label: 'Employment Types', path: '/org-structure/employment-types' },
                    { key: '/org-structure/departments', icon: <Combine size={14} />, label: 'Departments', path: '/org-structure/departments' },
                    { key: '/org-structure/sub-departments', icon: <Share2 size={14} />, label: 'Sub Departments', path: '/org-structure/sub-departments' },
                    { key: '/org-structure/positions', icon: <Proportions size={14} />, label: 'Positions', path: '/org-structure/positions' },
                ],
            },
        ],
    },
    {
        key: 'FINANCE',
        label: 'FINANCE',
        pathPrefixes: ['/accounts', '/invoicepro', '/reimbursement', '/salary'],
        defaultPath: '/accounts',
        items: [
            {
                key: '/accounts',
                label: 'Accounts',
                icon: <DollarOutlined />,
                path: '/accounts',
            },
            {
                key: 'invoicepro',
                label: 'InvoicePro',
                icon: <AccountBookOutlined />,
                children: [
                    { key: '/invoicepro/dashboard', label: 'Dashboard', icon: <BarChartOutlined />, path: '/invoicepro/dashboard' },
                    { key: '/invoicepro/invoices', label: 'Invoices', icon: <FileTextOutlined />, path: '/invoicepro/invoices' },
                    { key: '/invoicepro/newinvoice', label: 'New Invoice', icon: <PlusCircleOutlined />, path: '/invoicepro/newinvoice' },
                    { key: '/invoicepro/customers', label: 'Customers', icon: <TeamOutlined />, path: '/invoicepro/customers' },
                    { key: '/invoicepro/settings', label: 'Settings', icon: <SettingOutlined />, path: '/invoicepro/settings' },
                ],
            },
            {
                key: '/reimbursement',
                label: 'Reimbursement',
                icon: <TransactionOutlined />,
                path: '/reimbursement',
            },
            {
                key: 'salary',
                label: 'Payroll',
                icon: <MoneyCollectOutlined />,
                children: [
                    { key: '/salary/Create-payslip', label: 'Create Payslip', icon: <FileAddOutlined />, path: '/salary/Create-payslip' },
                    { key: '/salary/My-Payslip', label: 'My Payslip', icon: <ProfileOutlined />, path: '/salary/My-Payslip' },
                    { key: '/salary/Generate-payslip', label: 'Generate Payslip', icon: <FileAddOutlined />, path: '/salary/Generate-payslip' },
                    { key: '/salary/Payslips', label: 'Payslips', icon: <SnippetsOutlined />, path: '/salary/Payslips' },
                    { key: '/salary/Settings', label: 'Settings', icon: <SettingOutlined />, path: '/salary/Settings' },
                ],
            },
        ],
    },
    {
        key: 'ADMIN',
        label: 'ADMIN',
        pathPrefixes: ['/clients', '/settings', '/admin'],
        defaultPath: '/clients',
        items: [
            {
                key: '/clients',
                label: 'Clients',
                icon: <UserOutlined />,
                path: '/clients',
            },
            {
                key: '/settings',
                label: 'General Settings',
                icon: <SettingOutlined />,
                path: '/settings',
            },
        ],
    },
];
