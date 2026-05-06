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
    canUpdateReimbursement:  hasPermission(Permissions.REIMBURSEMENT_UPDATE),
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
    canCreateOnboarding: hasPermission(Permissions.ONBOARDING_CREATE),
    canReadOnboarding:   hasPermission(Permissions.ONBOARDING_READ),
    canUpdateOnboarding: hasPermission(Permissions.ONBOARDING_UPDATE),
    canManageOnboarding: hasPermission(Permissions.ONBOARDING_MANAGE),

    // ─── Timesheet ──────────────────────────────────────────────────
    canCreateTimesheet:  hasPermission(Permissions.TIMESHEET_CREATE),
    canReadTimesheet:    hasPermission(Permissions.TIMESHEET_READ),
    canUpdateTimesheet:  hasPermission(Permissions.TIMESHEET_UPDATE),
    canApproveTimesheet: hasPermission(Permissions.TIMESHEET_APPROVE),
    canManageTimesheets: hasPermission(Permissions.TIMESHEET_MANAGE),

    // ─── Org structure ──────────────────────────────────────────────
    canReadOrg:   hasPermission(Permissions.ORG_READ),
    canManageOrg: hasPermission(Permissions.ORG_MANAGE),

    // ─── Daily updates ──────────────────────────────────────────────
    canCreateDailyUpdate: hasPermission(Permissions.DAILY_UPDATE_CREATE),
    canReadDailyUpdate:   hasPermission(Permissions.DAILY_UPDATE_READ),
    canManageDailyUpdates: hasPermission(Permissions.DAILY_UPDATE_MANAGE),

    // ─── Leads & CRM ────────────────────────────────────────────────
    canCreateLead: hasPermission(Permissions.LEAD_CREATE),
    canReadLead:   hasPermission(Permissions.LEAD_READ),
    canUpdateLead: hasPermission(Permissions.LEAD_UPDATE),
    canDeleteLead: hasPermission(Permissions.LEAD_DELETE),
    canManageLeads: hasPermission(Permissions.LEAD_MANAGE),

    // ─── Proposals ──────────────────────────────────────────────────
    canCreateProposal: hasPermission(Permissions.PROPOSAL_CREATE),
    canReadProposal:   hasPermission(Permissions.PROPOSAL_READ),
    canUpdateProposal: hasPermission(Permissions.PROPOSAL_UPDATE),
    canDeleteProposal: hasPermission(Permissions.PROPOSAL_DELETE),
    canManageProposals: hasPermission(Permissions.PROPOSAL_MANAGE),

    // ─── Vendors ────────────────────────────────────────────────────
    canCreateVendor: hasPermission(Permissions.VENDOR_CREATE),
    canReadVendor:   hasPermission(Permissions.VENDOR_READ),
    canUpdateVendor: hasPermission(Permissions.VENDOR_UPDATE),
    canDeleteVendor: hasPermission(Permissions.VENDOR_DELETE),
    canManageVendors: hasPermission(Permissions.VENDOR_MANAGE),

    // ─── Escalations ────────────────────────────────────────────────
    canCreateEscalation: hasPermission(Permissions.ESCALATION_CREATE),
    canReadEscalation:   hasPermission(Permissions.ESCALATION_READ),
    canUpdateEscalation: hasPermission(Permissions.ESCALATION_UPDATE),
    canDeleteEscalation: hasPermission(Permissions.ESCALATION_DELETE),
    canManageEscalations: hasPermission(Permissions.ESCALATION_MANAGE),

    // ─── Employee Exit ──────────────────────────────────────────────
    canCreateExit: hasPermission(Permissions.EXIT_CREATE),
    canReadExit:   hasPermission(Permissions.EXIT_READ),
    canUpdateExit: hasPermission(Permissions.EXIT_UPDATE),
    canManageExits: hasPermission(Permissions.EXIT_MANAGE),

    // ─── Performance ────────────────────────────────────────────────
    canReadPerformance:   hasPermission(Permissions.PERFORMANCE_READ),
    canManagePerformance: hasPermission(Permissions.PERFORMANCE_MANAGE),

    // ─── Job Openings ───────────────────────────────────────────────
    canCreateOpening: hasPermission(Permissions.OPENING_CREATE),
    canReadOpening:   hasPermission(Permissions.OPENING_READ),
    canUpdateOpening: hasPermission(Permissions.OPENING_UPDATE),
    canDeleteOpening: hasPermission(Permissions.OPENING_DELETE),
    canManageOpenings: hasPermission(Permissions.OPENING_MANAGE),

    // ─── User Profile ───────────────────────────────────────────────
    canCreateProfile: hasPermission(Permissions.PROFILE_CREATE),
    canReadProfile:   hasPermission(Permissions.PROFILE_READ),
    canUpdateProfile: hasPermission(Permissions.PROFILE_UPDATE),
    canDeleteProfile: hasPermission(Permissions.PROFILE_DELETE),
    canManageProfile: hasPermission(Permissions.PROFILE_MANAGE),

    // ─── Squads ─────────────────────────────────────────────────────
    canCreateSquad: hasPermission(Permissions.SQUAD_CREATE),
    canReadSquad:   hasPermission(Permissions.SQUAD_READ),
    canUpdateSquad: hasPermission(Permissions.SQUAD_UPDATE),
    canDeleteSquad: hasPermission(Permissions.SQUAD_DELETE),
    canManageSquads: hasPermission(Permissions.SQUAD_MANAGE),

    // ─── System / General ───────────────────────────────────────────
    canCreateMail:   hasPermission(Permissions.MAIL_CREATE),
    canReadMail:     hasPermission(Permissions.MAIL_READ),
    canUpdateMail:   hasPermission(Permissions.MAIL_UPDATE),
    canDeleteMail:   hasPermission(Permissions.MAIL_DELETE),
    canManageMail:   hasPermission(Permissions.MAIL_MANAGE),

    canCreateCalendar: hasPermission(Permissions.CALENDAR_CREATE),
    canReadCalendar:   hasPermission(Permissions.CALENDAR_READ),
    canUpdateCalendar: hasPermission(Permissions.CALENDAR_UPDATE),
    canDeleteCalendar: hasPermission(Permissions.CALENDAR_DELETE),
    canManageCalendar: hasPermission(Permissions.CALENDAR_MANAGE),

    canCreateChat: hasPermission(Permissions.CHAT_CREATE),
    canReadChat:   hasPermission(Permissions.CHAT_READ),
    canUpdateChat: hasPermission(Permissions.CHAT_UPDATE),
    canDeleteChat: hasPermission(Permissions.CHAT_DELETE),
    canManageChat: hasPermission(Permissions.CHAT_MANAGE),

    canCreateSkills: hasPermission(Permissions.SKILLS_CREATE),
    canReadSkills:   hasPermission(Permissions.SKILLS_READ),
    canUpdateSkills: hasPermission(Permissions.SKILLS_UPDATE),
    canDeleteSkills: hasPermission(Permissions.SKILLS_DELETE),
    canManageSkills: hasPermission(Permissions.SKILLS_MANAGE),

    canReadNotification: hasPermission(Permissions.NOTIFICATION_READ),
    canReadBookmark:     hasPermission(Permissions.BOOKMARK_READ),

    canCreateTimeTracking: hasPermission(Permissions.TIME_TRACKING_CREATE),
    canReadTimeTracking:   hasPermission(Permissions.TIME_TRACKING_READ),
    canUpdateTimeTracking: hasPermission(Permissions.TIME_TRACKING_UPDATE),
    canDeleteTimeTracking: hasPermission(Permissions.TIME_TRACKING_DELETE),
    canManageTimeTracking: hasPermission(Permissions.TIME_TRACKING_MANAGE),

    // ─── Raw helpers ─────────────────────────────────────────────────
    /** Check a single permission string */
    can:    hasPermission,
    /** Check if user has ANY of the permissions */
    canAny: hasAnyPermission,
    /** Check if user has ALL of the permissions */
    canAll: hasAllPermissions,
  };
};
