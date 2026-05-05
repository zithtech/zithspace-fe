/**
 * All permission strings mirrored from the backend.
 * These are the canonical names returned in user.permissions[] from /api/auth/me.
 */
export const Permissions = {
  // Home
  DASHBOARD_READ: 'dashboard.read',
  INTEGRATION_READ: 'integration.read',
  INTEGRATION_MANAGE: 'integration.manage', // configure API keys, webhooks, and third-party connections

  // Users / Members
  USER_CREATE:   'user.create',
  USER_READ:     'user.read',
  USER_UPDATE:   'user.update',
  USER_DELETE:   'user.delete',
  USER_MANAGE:   'user.manage', // activate/deactivate, reset password, assign shift

  // Projects
  PROJECT_CREATE: 'project.create',
  PROJECT_READ:   'project.read',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  PROJECT_MANAGE: 'project.manage', // add/remove members, view all projects

  // Tickets
  TICKET_CREATE:  'ticket.create',
  TICKET_READ:    'ticket.read',
  TICKET_UPDATE:  'ticket.update',
  TICKET_DELETE:  'ticket.delete',
  TICKET_ASSIGN:  'ticket.assign',
  TICKET_ARCHIVE: 'ticket.archive',
  TICKET_MANAGE:  'ticket.manage', // bulk ops, workflow management

  // Attendance
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_READ:   'attendance.read',
  ATTENDANCE_UPDATE: 'attendance.update',
  ATTENDANCE_MANAGE: 'attendance.manage', // manual entries, admin overrides

  // Leaves
  LEAVE_CREATE:  'leave.create',
  LEAVE_READ:    'leave.read',
  LEAVE_UPDATE:  'leave.update',
  LEAVE_DELETE:  'leave.delete',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_MANAGE:  'leave.manage', // view all, configure types

  // Shifts
  SHIFT_CREATE: 'shift.create',
  SHIFT_READ:   'shift.read',
  SHIFT_UPDATE: 'shift.update',
  SHIFT_DELETE: 'shift.delete',
  SHIFT_MANAGE: 'shift.manage', // managing shift rotations, rosters, and global shift schedules

  // Invoices
  INVOICE_CREATE: 'invoice.create',
  INVOICE_READ:   'invoice.read',
  INVOICE_UPDATE: 'invoice.update',
  INVOICE_DELETE: 'invoice.delete',
  INVOICE_MANAGE: 'invoice.manage', // numbering, tax settings, and gateway configuration

  // Transactions
  TRANSACTION_CREATE: 'transaction.create',
  TRANSACTION_READ:   'transaction.read',
  TRANSACTION_UPDATE: 'transaction.update',
  TRANSACTION_DELETE: 'transaction.delete',
  TRANSACTION_MANAGE: 'transaction.manage', // bank accounts, chart of accounts, and financial periods

  // Clients
  CLIENT_CREATE: 'client.create',
  CLIENT_READ:   'client.read',
  CLIENT_UPDATE: 'client.update',
  CLIENT_DELETE: 'client.delete',
  CLIENT_MANAGE: 'client.manage', // bulk client imports, portal settings, and custom fields

  // Settings
  SETTINGS_READ:   'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_MANAGE: 'settings.manage', // global system preferences and core branding

  // Roles (RBAC management)
  ROLE_CREATE: 'role.create',
  ROLE_READ:   'role.read',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  ROLE_ASSIGN: 'role.assign',

  // Reports
  REPORT_READ:   'report.read',
  REPORT_MANAGE: 'report.manage', // global report templates and data export scheduling

  // Reimbursement
  REIMBURSEMENT_CREATE:  'reimbursement.create',
  REIMBURSEMENT_READ:    'reimbursement.read',
  REIMBURSEMENT_UPDATE:  'reimbursement.update',
  REIMBURSEMENT_APPROVE: 'reimbursement.approve',
  REIMBURSEMENT_MANAGE:  'reimbursement.manage', // expense category setup and reimbursement policies

  // Salary
  SALARY_READ:   'salary.read',
  SALARY_APPROVE: 'salary.approve',
  SALARY_MANAGE: 'salary.manage', // payroll cycle management, tax brackets, and compliance settings

  // Documents
  DOCUMENT_CREATE: 'document.create',
  DOCUMENT_READ:   'document.read',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_DELETE: 'document.delete',
  DOCUMENT_MANAGE: 'document.manage', // folder structure, version control, and access policies

  // Onboarding
  ONBOARDING_CREATE: 'onboarding.create',
  ONBOARDING_READ:   'onboarding.read',
  ONBOARDING_UPDATE: 'onboarding.update',
  ONBOARDING_MANAGE: 'onboarding.manage', // checklist templates, welcome docs, and workflow automation

  // Timesheet
  TIMESHEET_CREATE:  'timesheet.create',
  TIMESHEET_READ:    'timesheet.read',
  TIMESHEET_UPDATE:  'timesheet.update',
  TIMESHEET_APPROVE: 'timesheet.approve',
  TIMESHEET_MANAGE:  'timesheet.manage', // overriding timesheets, setting billing rates, and reporting

  // Org structure
  ORG_READ:   'org.read',
  ORG_MANAGE: 'org.manage', // departments, grades, positions, employment types

  // Daily updates
  DAILY_UPDATE_CREATE: 'daily_update.create',
  DAILY_UPDATE_READ:   'daily_update.read',
  DAILY_UPDATE_MANAGE: 'daily_update.manage', // update reminders, question templates, and compliance tracking

  // Leads & CRM
  LEAD_CREATE: 'lead.create',
  LEAD_READ:   'lead.read',
  LEAD_UPDATE: 'lead.update',
  LEAD_DELETE: 'lead.delete',
  LEAD_MANAGE: 'lead.manage', // lead distribution rules, source tracking, and conversion triggers

  // Proposals
  PROPOSAL_CREATE: 'proposal.create',
  PROPOSAL_READ:   'proposal.read',
  PROPOSAL_UPDATE: 'proposal.update',
  PROPOSAL_DELETE: 'proposal.delete',
  PROPOSAL_MANAGE: 'proposal.manage', // legal templates, e-signature settings, and contract automation

  // Vendors
  VENDOR_CREATE: 'vendor.create',
  VENDOR_READ:   'vendor.read',
  VENDOR_UPDATE: 'vendor.update',
  VENDOR_DELETE: 'vendor.delete',
  VENDOR_MANAGE: 'vendor.manage', // category management, compliance docs, and global vendor settings

  // Escalations
  ESCALATION_CREATE: 'escalation.create',
  ESCALATION_READ:   'escalation.read',
  ESCALATION_UPDATE: 'escalation.update',
  ESCALATION_DELETE: 'escalation.delete',
  ESCALATION_MANAGE: 'escalation.manage', // SLA policies, notification matrix, and rules engine

  // Squads
  SQUAD_CREATE: 'squad.create',
  SQUAD_READ:   'squad.read',
  SQUAD_UPDATE: 'squad.update',
  SQUAD_DELETE: 'squad.delete',
  SQUAD_MANAGE: 'squad.manage', // dissolving squads, changing squad leads, and cross-team settings

  // Performance
  PERFORMANCE_READ:   'performance.read',
  PERFORMANCE_MANAGE: 'performance.manage', // review cycle management, goal settings, and appraisal forms

  // Job Openings
  OPENING_CREATE: 'opening.create',
  OPENING_READ:   'opening.read',
  OPENING_UPDATE: 'opening.update',
  OPENING_DELETE: 'opening.delete',
  OPENING_MANAGE: 'opening.manage', // external career portal settings, hiring workflows, and ATS config

  // User Profile
  PROFILE_CREATE: 'profile.create',
  PROFILE_READ:   'profile.read',
  PROFILE_UPDATE: 'profile.update',
  PROFILE_DELETE: 'profile.delete',
  PROFILE_MANAGE: 'profile.manage', // profile templates, custom profile fields, and visibility rules

  // Employee Exit
  EXIT_CREATE: 'exit.create',
  EXIT_READ:   'exit.read',
  EXIT_UPDATE: 'exit.update',
  EXIT_MANAGE: 'exit.manage', // exit interview templates, clearing checklists, and separation data

  // System / General
  MAIL_CREATE:       'mail.create',
  MAIL_READ:         'mail.read',
  MAIL_UPDATE:       'mail.update',
  MAIL_DELETE:       'mail.delete',
  MAIL_MANAGE:       'mail.manage', // global email retention, organization-wide filters, and admin access

  CALENDAR_CREATE:   'calendar.create',
  CALENDAR_READ:     'calendar.read',
  CALENDAR_UPDATE:   'calendar.update',
  CALENDAR_DELETE:   'calendar.delete',
  CALENDAR_MANAGE:   'calendar.manage', // shared resource calendars, global holiday sync, and booking rules

  CHAT_CREATE:       'chat.create',
  CHAT_READ:         'chat.read',
  CHAT_UPDATE:       'chat.update',
  CHAT_DELETE:       'chat.delete',
  CHAT_MANAGE:       'chat.manage', // channel governance, data archiving, and moderation controls

  SKILLS_CREATE:     'skills.create',
  SKILLS_READ:       'skills.read',
  SKILLS_UPDATE:     'skills.update',
  SKILLS_DELETE:     'skills.delete',
  SKILLS_MANAGE:     'skills.manage', // competency matrix, training catalog, and certification tracking

  NOTIFICATION_READ: 'notification.read',
  BOOKMARK_READ:     'bookmark.read',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
