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
  PROJECT_TRASH_READ:    'project.trash.read',
  PROJECT_TRASH_RESTORE: 'project.trash.restore',
  PROJECT_TRASH_DELETE:  'project.trash.delete',
  PROJECT_MANAGE: 'project.manage', // add/remove members, view all projects

  // Tickets
  TICKET_CREATE:  'ticket.create',
  TICKET_READ:    'ticket.read',
  TICKET_UPDATE:  'ticket.update',
  TICKET_DELETE:  'ticket.delete',
  TICKET_ASSIGN:  'ticket.assign',
  TICKET_BUCKET_READ:   'ticket.bucket.read',
  TICKET_BUCKET_CREATE: 'ticket.bucket.create',
  TICKET_BUCKET_UPDATE: 'ticket.bucket.update',
  TICKET_BUCKET_DELETE: 'ticket.bucket.delete',
  TICKET_SETTING_READ:   'ticket.setting.read',
  TICKET_SETTING_CREATE: 'ticket.setting.create',
  TICKET_SETTING_UPDATE: 'ticket.setting.update',
  TICKET_SETTING_DELETE: 'ticket.setting.delete',
  TICKET_TRASH_READ:    'ticket.trash.read',
  TICKET_TRASH_RESTORE: 'ticket.trash.restore',
  TICKET_TRASH_DELETE:  'ticket.trash.delete',
  TICKET_ARCHIVE_READ:    'ticket.archive.read',
  TICKET_ARCHIVE_RESTORE: 'ticket.archive.restore',
  TICKET_PLAN_CREATE: 'ticket.plan.create',
  TICKET_PLAN_READ:   'ticket.plan.read',
  TICKET_PLAN_UPDATE: 'ticket.plan.update',
  TICKET_PLAN_DELETE: 'ticket.plan.delete',
  TICKET_MANAGE:  'ticket.manage', // bulk ops, workflow management

  // Bug List (QA workspace; converts to tickets)
  BUG_CREATE: 'bug.create',
  BUG_READ:   'bug.read',
  BUG_UPDATE: 'bug.update',
  BUG_DELETE: 'bug.delete',
  BUG_TRASH_READ:    'bug.trash.read',
  BUG_TRASH_RESTORE: 'bug.trash.restore',
  BUG_TRASH_DELETE:  'bug.trash.delete',
  BUG_ARCHIVE_READ:    'bug.archive.read',
  BUG_ARCHIVE_RESTORE: 'bug.archive.restore',
  BUG_MANAGE: 'bug.manage',

  // Attendance
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_READ:   'attendance.read',
  ATTENDANCE_UPDATE: 'attendance.update',
  ATTENDANCE_DELETE: 'attendance.delete',
  ATTENDANCE_DASHBOARD_READ: 'attendance.dashboard.read',
  ATTENDANCE_CLOCK_IN_OUT:   'attendance.clock.in_out',

  // Leaves
  LEAVE_DASHBOARD_READ: 'leave.dashboard.read',
  LEAVE_CREATE:  'leave.create',
  LEAVE_READ:    'leave.read',
  LEAVE_UPDATE:  'leave.update',
  LEAVE_DELETE:  'leave.delete',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_TYPE_READ:   'leave.type.read',
  LEAVE_TYPE_CREATE: 'leave.type.create',
  LEAVE_TYPE_UPDATE: 'leave.type.update',
  LEAVE_TYPE_DELETE: 'leave.type.delete',
  LEAVE_POLICY_READ:   'leave.policy.read',
  LEAVE_POLICY_CREATE: 'leave.policy.create',
  LEAVE_POLICY_UPDATE: 'leave.policy.update',
  LEAVE_POLICY_DELETE: 'leave.policy.delete',
  LEAVE_ADJUSTMENT_READ: 'leave.adjustment.read',
  LEAVE_ADJUSTMENT_CREATE: 'leave.adjustment.create',
  LEAVE_ADJUSTMENT_UPDATE: 'leave.adjustment.update',
  LEAVE_ADJUSTMENT_DELETE: 'leave.adjustment.delete',
  LEAVE_HOLIDAY_READ: 'leave.holiday.read',
  LEAVE_HOLIDAY_CREATE: 'leave.holiday.create',
  LEAVE_HOLIDAY_UPDATE: 'leave.holiday.update',
  LEAVE_HOLIDAY_DELETE: 'leave.holiday.delete',
  LEAVE_TRASH_READ:    'leave.trash.read',
  LEAVE_TRASH_RESTORE: 'leave.trash.restore',
  LEAVE_TRASH_DELETE:  'leave.trash.delete',
  LEAVE_MANAGE:  'leave.manage', // view all, configure types

  // Shifts
  SHIFT_CREATE: 'shift.create',
  SHIFT_READ:   'shift.read',
  SHIFT_UPDATE: 'shift.update',
  SHIFT_DELETE: 'shift.delete',
  SHIFT_MANAGE: 'shift.manage', // managing shift rotations, rosters, and global shift schedules

  // Invoices
  INVOICE_DASHBOARD_READ: 'invoice.dashboard.read',
  INVOICE_CREATE:         'invoice.create',
  INVOICE_READ:           'invoice.read',
  INVOICE_UPDATE:         'invoice.update',
  INVOICE_DELETE:         'invoice.delete',
  INVOICE_MANAGE:         'invoice.manage',
  INVOICE_TEMPLATE_READ:   'invoice.template.read',
  INVOICE_TEMPLATE_CREATE: 'invoice.template.create',
  INVOICE_TEMPLATE_UPDATE: 'invoice.template.update',
  INVOICE_TEMPLATE_DELETE: 'invoice.template.delete',
  INVOICE_CUSTOMER_READ:   'invoice.customer.read',
  INVOICE_CUSTOMER_CREATE: 'invoice.customer.create',
  INVOICE_CUSTOMER_UPDATE: 'invoice.customer.update',
  INVOICE_CUSTOMER_DELETE: 'invoice.customer.delete',
  INVOICE_SETTING_READ:    'invoice.setting.read',
  INVOICE_SETTING_CREATE:  'invoice.setting.create',
  INVOICE_SETTING_UPDATE:  'invoice.setting.update',
  INVOICE_SETTING_DELETE:  'invoice.setting.delete',
  INVOICE_TRASH_READ:      'invoice.trash.read',
  INVOICE_TRASH_CREATE:    'invoice.trash.create',
  INVOICE_TRASH_UPDATE:    'invoice.trash.update',
  INVOICE_TRASH_DELETE:    'invoice.trash.delete',
  INVOICE_HISTORY_READ:    'invoice.history.read',
  INVOICE_MAIL_SEND:       'invoice.mail.send',
  INVOICE_STATUS_UPDATE:   'invoice.status.update',

  // Accounts
  ACCOUNT_READ:           'account.read',
  ACCOUNT_CREATE:         'account.create',
  ACCOUNT_UPDATE:         'account.update',
  ACCOUNT_DELETE:         'account.delete',
  ACCOUNT_MANAGE:         'account.manage',
  ACCOUNT_SETTING_READ:    'account.setting.read',
  ACCOUNT_SETTING_CREATE:  'account.setting.create',
  ACCOUNT_SETTING_UPDATE:  'account.setting.update',
  ACCOUNT_SETTING_DELETE:  'account.setting.delete',

  // Clients
  CLIENT_CREATE: 'client.create',
  CLIENT_READ:   'client.read',
  CLIENT_UPDATE: 'client.update',
  CLIENT_DELETE: 'client.delete',
  CLIENT_MANAGE: 'client.manage', // bulk client imports, portal settings, and custom fields

  // Settings
  SETTINGS_READ:   'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_DELETE: 'settings.delete',
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
  REIMBURSEMENT_DASHBOARD_READ: 'reimbursement.dashboard.read',
  REIMBURSEMENT_READ:           'reimbursement.read',
  REIMBURSEMENT_CREATE:         'reimbursement.create',
  REIMBURSEMENT_UPDATE:         'reimbursement.update',
  REIMBURSEMENT_DELETE:         'reimbursement.delete',
  REIMBURSEMENT_APPROVE:        'reimbursement.approve',
  REIMBURSEMENT_PAY:            'reimbursement.pay',
  REIMBURSEMENT_CATEGORY_READ:   'reimbursement.category.read',
  REIMBURSEMENT_CATEGORY_CREATE: 'reimbursement.category.create',
  REIMBURSEMENT_CATEGORY_UPDATE: 'reimbursement.category.update',
  REIMBURSEMENT_CATEGORY_DELETE: 'reimbursement.category.delete',
  REIMBURSEMENT_SETTING_READ:    'reimbursement.setting.read',
  REIMBURSEMENT_SETTING_CREATE:  'reimbursement.setting.create',
  REIMBURSEMENT_SETTING_UPDATE:  'reimbursement.setting.update',
  REIMBURSEMENT_SETTING_DELETE:  'reimbursement.setting.delete',
  REIMBURSEMENT_TRASH_READ:      'reimbursement.trash.read',
  REIMBURSEMENT_TRASH_CREATE:    'reimbursement.trash.create',
  REIMBURSEMENT_TRASH_UPDATE:    'reimbursement.trash.update',
  REIMBURSEMENT_TRASH_DELETE:    'reimbursement.trash.delete',
  REIMBURSEMENT_CONFIG_READ:     'reimbursement.config.read',
  REIMBURSEMENT_CONFIG_UPDATE:   'reimbursement.config.update',
  REIMBURSEMENT_MANAGE:          'reimbursement.manage',

  // Payroll
  PAYROLL_DASHBOARD_READ: 'payroll.dashboard.read',
  PAYROLL_READ:           'payroll.read',
  PAYROLL_CREATE:         'payroll.create',
  PAYROLL_UPDATE:         'payroll.update',
  PAYROLL_DELETE:         'payroll.delete',
  PAYROLL_APPROVE:        'payroll.approve',
  PAYROLL_PAY:            'payroll.pay',
  PAYROLL_PAYSLIP_READ:   'payroll.payslip.read',
  PAYROLL_PAYSLIP_CREATE: 'payroll.payslip.create',
  PAYROLL_PAYSLIP_DELETE: 'payroll.payslip.delete',
  PAYROLL_PAYSLIP_SEND:   'payroll.payslip.send',
  PAYROLL_STRUCTURE_READ:   'payroll.structure.read',
  PAYROLL_STRUCTURE_CREATE: 'payroll.structure.create',
  PAYROLL_STRUCTURE_UPDATE: 'payroll.structure.update',
  PAYROLL_STRUCTURE_DELETE: 'payroll.structure.delete',
  PAYROLL_SETTING_READ:    'payroll.setting.read',
  PAYROLL_SETTING_CREATE:  'payroll.setting.create',
  PAYROLL_SETTING_UPDATE:  'payroll.setting.update',
  PAYROLL_SETTING_DELETE:  'payroll.setting.delete',
  PAYROLL_TRASH_READ:      'payroll.trash.read',
  PAYROLL_TRASH_CREATE:    'payroll.trash.create',
  PAYROLL_TRASH_UPDATE:    'payroll.trash.update',
  PAYROLL_TRASH_DELETE:    'payroll.trash.delete',
  PAYROLL_PROCESS:         'payroll.process',
  PAYROLL_MANAGE:          'payroll.manage',
  SALARY_READ:             'salary.read',
  SALARY_APPROVE:          'salary.approve',
  SALARY_MANAGE:           'salary.manage',

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
  ONBOARDING_DELETE: 'onboarding.delete',
  ONBOARDING_SETTING_READ:   'onboarding.setting.read',
  ONBOARDING_SETTING_UPDATE: 'onboarding.setting.update',

  // Timesheet
  TIMESHEET_CREATE:  'timesheet.create',
  TIMESHEET_READ:    'timesheet.read',
  TIMESHEET_UPDATE:  'timesheet.update',
  TIMESHEET_DELETE:  'timesheet.delete',
  TIMESHEET_APPROVE: 'timesheet.approve',
  TIMESHEET_MANAGE:  'timesheet.manage', // overriding timesheets, setting billing rates, and reporting

  // Org structure
  ORG_DASHBOARD_READ: 'org.dashboard.read',
  ORG_READ:   'org.read',
  ORG_DEPARTMENT_READ:   'org.department.read',
  ORG_DEPARTMENT_CREATE: 'org.department.create',
  ORG_DEPARTMENT_UPDATE: 'org.department.update',
  ORG_DEPARTMENT_DELETE: 'org.department.delete',
  ORG_GRADE_READ:   'org.grade.read',
  ORG_GRADE_CREATE: 'org.grade.create',
  ORG_GRADE_UPDATE: 'org.grade.grade.update',
  ORG_GRADE_DELETE: 'org.grade.delete',
  ORG_POSITION_READ:   'org.position.read',
  ORG_POSITION_CREATE: 'org.position.create',
  ORG_POSITION_UPDATE: 'org.position.update',
  ORG_POSITION_DELETE: 'org.position.delete',
  ORG_EMPLOYMENT_TYPE_READ:   'org.employment_type.read',
  ORG_EMPLOYMENT_TYPE_CREATE: 'org.employment_type.create',
  ORG_EMPLOYMENT_TYPE_UPDATE: 'org.employment_type.update',
  ORG_EMPLOYMENT_TYPE_DELETE: 'org.employment_type.delete',
  ORG_MANAGE: 'org.manage', // departments, grades, positions, employment types

  // Daily updates
  DAILY_UPDATE_CREATE: 'daily_update.create',
  DAILY_UPDATE_READ:   'daily_update.read',
  DAILY_UPDATE_UPDATE: 'daily_update.update',
  DAILY_UPDATE_DELETE: 'daily_update.delete',
  DAILY_UPDATE_MANAGE_TIME: 'daily_update.manage_time', // update reminders, question templates, and compliance tracking

  // Leads & CRM
  LEAD_CREATE: 'lead.create',
  LEAD_READ:   'lead.read',
  LEAD_UPDATE: 'lead.update',
  LEAD_DELETE: 'lead.delete',
  LEAD_SETTING_READ:   'lead.setting.read',
  LEAD_SETTING_CREATE: 'lead.setting.create',
  LEAD_SETTING_UPDATE: 'lead.setting.update',
  LEAD_SETTING_DELETE: 'lead.setting.delete',
  LEAD_TRASH_READ:     'lead.trash.read',
  LEAD_TRASH_RESTORE:  'lead.trash.restore',
  LEAD_TRASH_DELETE:   'lead.trash.delete',
  LEAD_MANAGE: 'lead.manage', // lead distribution rules, source tracking, and conversion triggers
  PROPOSAL_CREATE: 'proposal.create',
  PROPOSAL_READ:   'proposal.read',
  PROPOSAL_UPDATE: 'proposal.update',
  PROPOSAL_DELETE: 'proposal.delete',

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
  
  // Pipeline
  PIPELINE_CREATE: 'pipeline.create',
  PIPELINE_READ:   'pipeline.read',
  PIPELINE_UPDATE: 'pipeline.update',
  PIPELINE_DELETE: 'pipeline.delete',
  PIPELINE_MANAGE: 'pipeline.manage', // pipeline stages, automation rules, and global sales workflows
  PIPELINE_BOARD_READ:    'pipeline.board.read',
  PIPELINE_BOARD_CREATE:  'pipeline.board.create',
  PIPELINE_BOARD_UPDATE:  'pipeline.board.update',
  PIPELINE_BOARD_DELETE:  'pipeline.board.delete',
  PIPELINE_DEALS_READ:    'pipeline.deals.read',
  PIPELINE_DEALS_CREATE:  'pipeline.deals.create',
  PIPELINE_DEALS_UPDATE:  'pipeline.deals.update',
  PIPELINE_DEALS_DELETE:  'pipeline.deals.delete',
  PIPELINE_FORECAST_READ: 'pipeline.forecast.read',
  PIPELINE_SETTING_READ:   'pipeline.setting.read',
  PIPELINE_SETTING_UPDATE: 'pipeline.setting.update',

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
  EXIT_CONFIG_READ:   'exit.config.read',
  EXIT_CONFIG_UPDATE: 'exit.config.update',

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

  NOTIFICATION_CREATE: 'notification.create',
  NOTIFICATION_READ:   'notification.read',
  NOTIFICATION_UPDATE: 'notification.update',
  NOTIFICATION_DELETE: 'notification.delete',

  BOOKMARK_CREATE: 'bookmark.create',
  BOOKMARK_READ:   'bookmark.read',
  BOOKMARK_UPDATE: 'bookmark.update',
  BOOKMARK_DELETE: 'bookmark.delete',

  // Time Tracking
  TIME_TRACKING_CREATE: 'time_tracking.create',
  TIME_TRACKING_READ:   'time_tracking.read',
  TIME_TRACKING_DELETE: 'time_tracking.delete',
  TIME_TRACKING_TEAM_READ: 'time_tracking.team.read',
  TIME_TRACKING_MANAGE_TIME: 'time_tracking.manage_time',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
