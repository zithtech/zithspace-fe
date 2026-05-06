/**
 * All permission strings mirrored from the backend.
 * These are the canonical names returned in user.permissions[] from /api/auth/me.
 */
export const Permissions = {
  // Users / Members
  USER_CREATE:   'user.create',
  USER_READ:     'user.read',
  USER_UPDATE:   'user.update',
  USER_DELETE:   'user.delete',
  USER_MANAGE:   'user.manage',

  // Projects
  PROJECT_CREATE: 'project.create',
  PROJECT_READ:   'project.read',
  PROJECT_UPDATE: 'project.update',
  PROJECT_DELETE: 'project.delete',
  PROJECT_MANAGE: 'project.manage',

  // Tickets
  TICKET_CREATE:  'ticket.create',
  TICKET_READ:    'ticket.read',
  TICKET_UPDATE:  'ticket.update',
  TICKET_DELETE:  'ticket.delete',
  TICKET_ASSIGN:  'ticket.assign',
  TICKET_ARCHIVE: 'ticket.archive',
  TICKET_MANAGE:  'ticket.manage',

  // Bug List (QA workspace; converts to tickets)
  BUG_CREATE: 'bug.create',
  BUG_READ:   'bug.read',
  BUG_UPDATE: 'bug.update',
  BUG_DELETE: 'bug.delete',
  BUG_MANAGE: 'bug.manage',

  // Attendance
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_READ:   'attendance.read',
  ATTENDANCE_UPDATE: 'attendance.update',
  ATTENDANCE_MANAGE: 'attendance.manage',

  // Leaves
  LEAVE_CREATE:  'leave.create',
  LEAVE_READ:    'leave.read',
  LEAVE_UPDATE:  'leave.update',
  LEAVE_DELETE:  'leave.delete',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_MANAGE:  'leave.manage',

  // Shifts
  SHIFT_CREATE: 'shift.create',
  SHIFT_READ:   'shift.read',
  SHIFT_UPDATE: 'shift.update',
  SHIFT_DELETE: 'shift.delete',
  SHIFT_MANAGE: 'shift.manage',

  // Invoices
  INVOICE_CREATE: 'invoice.create',
  INVOICE_READ:   'invoice.read',
  INVOICE_UPDATE: 'invoice.update',
  INVOICE_DELETE: 'invoice.delete',
  INVOICE_MANAGE: 'invoice.manage',

  // Transactions
  TRANSACTION_CREATE: 'transaction.create',
  TRANSACTION_READ:   'transaction.read',
  TRANSACTION_UPDATE: 'transaction.update',
  TRANSACTION_DELETE: 'transaction.delete',
  TRANSACTION_MANAGE: 'transaction.manage',

  // Clients
  CLIENT_CREATE: 'client.create',
  CLIENT_READ:   'client.read',
  CLIENT_UPDATE: 'client.update',
  CLIENT_DELETE: 'client.delete',
  CLIENT_MANAGE: 'client.manage',

  // Settings
  SETTINGS_READ:   'settings.read',
  SETTINGS_UPDATE: 'settings.update',
  SETTINGS_MANAGE: 'settings.manage',

  // Roles (RBAC management)
  ROLE_CREATE: 'role.create',
  ROLE_READ:   'role.read',
  ROLE_UPDATE: 'role.update',
  ROLE_DELETE: 'role.delete',
  ROLE_ASSIGN: 'role.assign',

  // Reports
  REPORT_READ:   'report.read',
  REPORT_MANAGE: 'report.manage',

  // Reimbursement
  REIMBURSEMENT_CREATE:  'reimbursement.create',
  REIMBURSEMENT_READ:    'reimbursement.read',
  REIMBURSEMENT_UPDATE:  'reimbursement.update',
  REIMBURSEMENT_APPROVE: 'reimbursement.approve',
  REIMBURSEMENT_MANAGE:  'reimbursement.manage',

  // Salary
  SALARY_READ:   'salary.read',
  SALARY_MANAGE: 'salary.manage',

  // Documents
  DOCUMENT_CREATE: 'document.create',
  DOCUMENT_READ:   'document.read',
  DOCUMENT_UPDATE: 'document.update',
  DOCUMENT_DELETE: 'document.delete',
  DOCUMENT_MANAGE: 'document.manage',

  // Onboarding
  ONBOARDING_CREATE: 'onboarding.create',
  ONBOARDING_READ:   'onboarding.read',
  ONBOARDING_UPDATE: 'onboarding.update',
  ONBOARDING_MANAGE: 'onboarding.manage',

  // Timesheet
  TIMESHEET_CREATE:  'timesheet.create',
  TIMESHEET_READ:    'timesheet.read',
  TIMESHEET_UPDATE:  'timesheet.update',
  TIMESHEET_APPROVE: 'timesheet.approve',
  TIMESHEET_MANAGE:  'timesheet.manage',

  // Org structure
  ORG_READ:   'org.read',
  ORG_MANAGE: 'org.manage',

  // Daily updates
  DAILY_UPDATE_CREATE: 'daily_update.create',
  DAILY_UPDATE_READ:   'daily_update.read',
  DAILY_UPDATE_MANAGE: 'daily_update.manage',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];
