"use client";

import { useAuth } from "@/context/AuthContext";
import { Permissions } from "@/types/permissions";

/**
 * usePermission — the single hook for all permission checks in the UI.
 *
 * Returns named boolean flags for every permission as well as raw helpers:
 *   can(permission)         — single permission check
 *   canAny(...permissions)  — any one of these
 *   canAll(...permissions)  — all of these
 *
 * Usage:
 *   const { canCreateUser, canManageRoles, can } = usePermission();
 *   if (!canCreateUser) return <AccessDenied />;
 *   <Can permission="user.create"><Button>Add</Button></Can>
 */
export const usePermission = () => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  return {
    // ─── Users / Members ────────────────────────────────────────────
    canCreateUser:   hasPermission(Permissions.USER_CREATE),
    canReadUser:     hasPermission(Permissions.USER_READ),
    canUpdateUser:   hasPermission(Permissions.USER_UPDATE),
    canDeleteUser:   hasPermission(Permissions.USER_DELETE),
    canManageUsers:  hasPermission(Permissions.USER_MANAGE),

    // ─── Projects ───────────────────────────────────────────────────
    canCreateProject:  hasPermission(Permissions.PROJECT_CREATE),
    canReadProject:    hasPermission(Permissions.PROJECT_READ),
    canUpdateProject:  hasPermission(Permissions.PROJECT_UPDATE),
    canDeleteProject:  hasPermission(Permissions.PROJECT_DELETE),
    canManageProjects: hasPermission(Permissions.PROJECT_MANAGE),

    // ─── Tickets ────────────────────────────────────────────────────
    canCreateTicket:  hasPermission(Permissions.TICKET_CREATE),
    canReadTicket:    hasPermission(Permissions.TICKET_READ),
    canUpdateTicket:  hasPermission(Permissions.TICKET_UPDATE),
    canDeleteTicket:  hasPermission(Permissions.TICKET_DELETE),
    canAssignTicket:  hasPermission(Permissions.TICKET_ASSIGN),
    canArchiveTicket: hasPermission(Permissions.TICKET_ARCHIVE),
    canManageTickets: hasPermission(Permissions.TICKET_MANAGE),

    // ─── Attendance ─────────────────────────────────────────────────
    canCreateAttendance: hasPermission(Permissions.ATTENDANCE_CREATE),
    canReadAttendance:   hasPermission(Permissions.ATTENDANCE_READ),
    canUpdateAttendance: hasPermission(Permissions.ATTENDANCE_UPDATE),
    canManageAttendance: hasPermission(Permissions.ATTENDANCE_MANAGE),

    // ─── Leaves ─────────────────────────────────────────────────────
    canCreateLeave:  hasPermission(Permissions.LEAVE_CREATE),
    canReadLeave:    hasPermission(Permissions.LEAVE_READ),
    canUpdateLeave:  hasPermission(Permissions.LEAVE_UPDATE),
    canDeleteLeave:  hasPermission(Permissions.LEAVE_DELETE),
    canApproveLeave: hasPermission(Permissions.LEAVE_APPROVE),
    canManageLeaves: hasPermission(Permissions.LEAVE_MANAGE),

    // ─── Shifts ─────────────────────────────────────────────────────
    canCreateShift: hasPermission(Permissions.SHIFT_CREATE),
    canReadShift:   hasPermission(Permissions.SHIFT_READ),
    canUpdateShift: hasPermission(Permissions.SHIFT_UPDATE),
    canDeleteShift: hasPermission(Permissions.SHIFT_DELETE),
    canManageShifts: hasPermission(Permissions.SHIFT_MANAGE),

    // ─── Invoices ───────────────────────────────────────────────────
    canCreateInvoice: hasPermission(Permissions.INVOICE_CREATE),
    canReadInvoice:   hasPermission(Permissions.INVOICE_READ),
    canUpdateInvoice: hasPermission(Permissions.INVOICE_UPDATE),
    canDeleteInvoice: hasPermission(Permissions.INVOICE_DELETE),
    canManageInvoices: hasPermission(Permissions.INVOICE_MANAGE),

    // ─── Transactions ───────────────────────────────────────────────
    canCreateTransaction: hasPermission(Permissions.TRANSACTION_CREATE),
    canReadTransaction:   hasPermission(Permissions.TRANSACTION_READ),
    canUpdateTransaction: hasPermission(Permissions.TRANSACTION_UPDATE),
    canDeleteTransaction: hasPermission(Permissions.TRANSACTION_DELETE),
    canManageTransactions: hasPermission(Permissions.TRANSACTION_MANAGE),

    // ─── Clients ────────────────────────────────────────────────────
    canCreateClient: hasPermission(Permissions.CLIENT_CREATE),
    canReadClient:   hasPermission(Permissions.CLIENT_READ),
    canUpdateClient: hasPermission(Permissions.CLIENT_UPDATE),
    canDeleteClient: hasPermission(Permissions.CLIENT_DELETE),
    canManageClients: hasPermission(Permissions.CLIENT_MANAGE),

    // ─── Settings ───────────────────────────────────────────────────
    canReadSettings:   hasPermission(Permissions.SETTINGS_READ),
    canUpdateSettings: hasPermission(Permissions.SETTINGS_UPDATE),
    canManageSettings: hasPermission(Permissions.SETTINGS_MANAGE),

    // ─── Roles (RBAC) ───────────────────────────────────────────────
    canCreateRole: hasPermission(Permissions.ROLE_CREATE),
    canReadRole:   hasPermission(Permissions.ROLE_READ),
    canUpdateRole: hasPermission(Permissions.ROLE_UPDATE),
    canDeleteRole: hasPermission(Permissions.ROLE_DELETE),
    canAssignRole: hasPermission(Permissions.ROLE_ASSIGN),
    canManageRoles: hasAnyPermission(
      Permissions.ROLE_CREATE,
      Permissions.ROLE_UPDATE,
      Permissions.ROLE_DELETE,
    ),

    // ─── Reports ────────────────────────────────────────────────────
    canReadReport:   hasPermission(Permissions.REPORT_READ),
    canManageReports: hasPermission(Permissions.REPORT_MANAGE),

    // ─── Reimbursement ──────────────────────────────────────────────
    canCreateReimbursement:  hasPermission(Permissions.REIMBURSEMENT_CREATE),
    canReadReimbursement:    hasPermission(Permissions.REIMBURSEMENT_READ),
    canApproveReimbursement: hasPermission(Permissions.REIMBURSEMENT_APPROVE),
    canManageReimbursements: hasPermission(Permissions.REIMBURSEMENT_MANAGE),

    // ─── Salary ─────────────────────────────────────────────────────
    canReadSalary:   hasPermission(Permissions.SALARY_READ),
    canManageSalary: hasPermission(Permissions.SALARY_MANAGE),

    // ─── Documents ──────────────────────────────────────────────────
    canCreateDocument: hasPermission(Permissions.DOCUMENT_CREATE),
    canReadDocument:   hasPermission(Permissions.DOCUMENT_READ),
    canUpdateDocument: hasPermission(Permissions.DOCUMENT_UPDATE),
    canDeleteDocument: hasPermission(Permissions.DOCUMENT_DELETE),
    canManageDocuments: hasPermission(Permissions.DOCUMENT_MANAGE),

    // ─── Onboarding ─────────────────────────────────────────────────
    canReadOnboarding:   hasPermission(Permissions.ONBOARDING_READ),
    canManageOnboarding: hasPermission(Permissions.ONBOARDING_MANAGE),

    // ─── Timesheet ──────────────────────────────────────────────────
    canCreateTimesheet:  hasPermission(Permissions.TIMESHEET_CREATE),
    canReadTimesheet:    hasPermission(Permissions.TIMESHEET_READ),
    canApproveTimesheet: hasPermission(Permissions.TIMESHEET_APPROVE),
    canManageTimesheets: hasPermission(Permissions.TIMESHEET_MANAGE),

    // ─── Org structure ──────────────────────────────────────────────
    canReadOrg:   hasPermission(Permissions.ORG_READ),
    canManageOrg: hasPermission(Permissions.ORG_MANAGE),

    // ─── Daily updates ──────────────────────────────────────────────
    canCreateDailyUpdate: hasPermission(Permissions.DAILY_UPDATE_CREATE),
    canReadDailyUpdate:   hasPermission(Permissions.DAILY_UPDATE_READ),
    canManageDailyUpdates: hasPermission(Permissions.DAILY_UPDATE_MANAGE),

    // ─── Raw helpers ─────────────────────────────────────────────────
    /** Check a single permission string */
    can:    hasPermission,
    /** Check if user has ANY of the permissions */
    canAny: hasAnyPermission,
    /** Check if user has ALL of the permissions */
    canAll: hasAllPermissions,
  };
};
