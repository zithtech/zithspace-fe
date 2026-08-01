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
    canReadUserTrash:    hasPermission(Permissions.USER_TRASH_READ),
    canRestoreUserTrash: hasPermission(Permissions.USER_TRASH_RESTORE),
    canDeleteUserTrash:  hasPermission(Permissions.USER_TRASH_DELETE),

    // ─── Projects ───────────────────────────────────────────────────
    canCreateProject:  hasPermission(Permissions.PROJECT_CREATE),
    canReadProject:    hasPermission(Permissions.PROJECT_READ),
    canUpdateProject:  hasPermission(Permissions.PROJECT_UPDATE),
    canDeleteProject:  hasPermission(Permissions.PROJECT_DELETE),
    canReadProjectTrash:    hasPermission(Permissions.PROJECT_TRASH_READ),
    canRestoreProjectTrash: hasPermission(Permissions.PROJECT_TRASH_RESTORE),
    canDeleteProjectTrash:  hasPermission(Permissions.PROJECT_TRASH_DELETE),
    canManageProjects: hasPermission(Permissions.PROJECT_MANAGE),

    // ─── Tickets ────────────────────────────────────────────────────
    canCreateTicket: hasPermission(Permissions.TICKET_CREATE),
    canReadTicket:   hasPermission(Permissions.TICKET_READ),
    canUpdateTicket: hasPermission(Permissions.TICKET_UPDATE),
    canDeleteTicket: hasPermission(Permissions.TICKET_DELETE),
    canAssignTicket: hasPermission(Permissions.TICKET_ASSIGN),
    canReadTicketBucket:   hasPermission(Permissions.TICKET_BUCKET_READ),
    canCreateTicketBucket: hasPermission(Permissions.TICKET_BUCKET_CREATE),
    canUpdateTicketBucket: hasPermission(Permissions.TICKET_BUCKET_UPDATE),
    canDeleteTicketBucket: hasPermission(Permissions.TICKET_BUCKET_DELETE),
    canReadTicketSetting:   hasPermission(Permissions.TICKET_SETTING_READ),
    canCreateTicketSetting: hasPermission(Permissions.TICKET_SETTING_CREATE),
    canUpdateTicketSetting: hasPermission(Permissions.TICKET_SETTING_UPDATE),
    canDeleteTicketSetting: hasPermission(Permissions.TICKET_SETTING_DELETE),
    canReadTicketTrash:    hasPermission(Permissions.TICKET_TRASH_READ),
    canRestoreTicketTrash: hasPermission(Permissions.TICKET_TRASH_RESTORE),
    canDeleteTicketTrash:  hasPermission(Permissions.TICKET_TRASH_DELETE),
    canReadTicketArchive:    hasPermission(Permissions.TICKET_ARCHIVE_READ),
    canRestoreTicketArchive: hasPermission(Permissions.TICKET_ARCHIVE_RESTORE),
    canCreateTicketPlan: hasPermission(Permissions.TICKET_PLAN_CREATE),
    canReadTicketPlan:   hasPermission(Permissions.TICKET_PLAN_READ),
    canUpdateTicketPlan: hasPermission(Permissions.TICKET_PLAN_UPDATE),
    canDeleteTicketPlan: hasPermission(Permissions.TICKET_PLAN_DELETE),
    canManageTickets: hasPermission(Permissions.TICKET_MANAGE),

    // ─── Attendance ─────────────────────────────────────────────────
    canCreateAttendance: hasPermission(Permissions.ATTENDANCE_CREATE),
    canReadAttendance:   hasPermission(Permissions.ATTENDANCE_READ),
    canUpdateAttendance: hasPermission(Permissions.ATTENDANCE_UPDATE),
    canDeleteAttendance: hasPermission(Permissions.ATTENDANCE_DELETE),
    canManageAttendance: hasAnyPermission(
      Permissions.ATTENDANCE_CREATE,
      Permissions.ATTENDANCE_READ,
      Permissions.ATTENDANCE_UPDATE,
      Permissions.ATTENDANCE_DELETE
    ),
    canReadAttendanceDashboard: hasPermission(Permissions.ATTENDANCE_DASHBOARD_READ),
    canClockInOut: hasPermission(Permissions.ATTENDANCE_CLOCK_IN_OUT),
    // My Hub self-service — granted via my_hub.attendance.read in RBAC
    canReadMyHubAttendance: hasPermission(Permissions.MY_HUB_ATTENDANCE_READ),

    // ─── Leaves ─────────────────────────────────────────────────────
    canCreateLeave:  hasPermission(Permissions.LEAVE_CREATE),
    canReadLeave:    hasPermission(Permissions.LEAVE_READ),
    canUpdateLeave:  hasPermission(Permissions.LEAVE_UPDATE),
    canDeleteLeave:  hasPermission(Permissions.LEAVE_DELETE),
    canApproveLeave: hasPermission(Permissions.LEAVE_APPROVE),
    canManageLeaves: hasPermission(Permissions.LEAVE_MANAGE),
    // My Hub self-service — granted via my_hub.apply_leave.read in RBAC
    canReadMyHubApplyLeave: hasPermission(Permissions.MY_HUB_APPLY_LEAVE_READ),
    canReadLeaveDashboard: hasPermission(Permissions.LEAVE_DASHBOARD_READ),
    canReadLeaveType:      hasPermission(Permissions.LEAVE_TYPE_READ),
    canCreateLeaveType:    hasPermission(Permissions.LEAVE_TYPE_CREATE),
    canUpdateLeaveType:    hasPermission(Permissions.LEAVE_TYPE_UPDATE),
    canDeleteLeaveType:    hasPermission(Permissions.LEAVE_TYPE_DELETE),
    canReadLeavePolicy:    hasPermission(Permissions.LEAVE_POLICY_READ),
    canCreateLeavePolicy:  hasPermission(Permissions.LEAVE_POLICY_CREATE),
    canUpdateLeavePolicy:  hasPermission(Permissions.LEAVE_POLICY_UPDATE),
    canDeleteLeavePolicy:  hasPermission(Permissions.LEAVE_POLICY_DELETE),
    canReadLeaveAdjustment: hasPermission(Permissions.LEAVE_ADJUSTMENT_READ),
    canCreateLeaveAdjustment: hasPermission(Permissions.LEAVE_ADJUSTMENT_CREATE),
    canUpdateLeaveAdjustment: hasPermission(Permissions.LEAVE_ADJUSTMENT_UPDATE),
    canDeleteLeaveAdjustment: hasPermission(Permissions.LEAVE_ADJUSTMENT_DELETE),
    canReadLeaveHoliday:   hasPermission(Permissions.LEAVE_HOLIDAY_READ),
    canCreateLeaveHoliday: hasPermission(Permissions.LEAVE_HOLIDAY_CREATE),
    canUpdateLeaveHoliday: hasPermission(Permissions.LEAVE_HOLIDAY_UPDATE),
    canDeleteLeaveHoliday: hasPermission(Permissions.LEAVE_HOLIDAY_DELETE),
    canReadLeaveTrash:     hasPermission(Permissions.LEAVE_TRASH_READ),
    canRestoreLeaveTrash:  hasPermission(Permissions.LEAVE_TRASH_RESTORE),
    canDeleteLeaveTrash:   hasPermission(Permissions.LEAVE_TRASH_DELETE),

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
    
    // Granular Invoice
    canReadInvoiceDashboard: hasPermission(Permissions.INVOICE_DASHBOARD_READ),
    canCreateInvoiceTemplate: hasPermission(Permissions.INVOICE_TEMPLATE_CREATE),
    canReadInvoiceTemplate:   hasPermission(Permissions.INVOICE_TEMPLATE_READ),
    canUpdateInvoiceTemplate: hasPermission(Permissions.INVOICE_TEMPLATE_UPDATE),
    canDeleteInvoiceTemplate: hasPermission(Permissions.INVOICE_TEMPLATE_DELETE),
    canCreateInvoiceCustomer: hasPermission(Permissions.INVOICE_CUSTOMER_CREATE),
    canReadInvoiceCustomer:   hasPermission(Permissions.INVOICE_CUSTOMER_READ),
    canUpdateInvoiceCustomer: hasPermission(Permissions.INVOICE_CUSTOMER_UPDATE),
    canDeleteInvoiceCustomer: hasPermission(Permissions.INVOICE_CUSTOMER_DELETE),
    canCreateInvoiceSetting:  hasPermission(Permissions.INVOICE_SETTING_CREATE),
    canReadInvoiceSetting:    hasPermission(Permissions.INVOICE_SETTING_READ),
    canUpdateInvoiceSetting:  hasPermission(Permissions.INVOICE_SETTING_UPDATE),
    canDeleteInvoiceSetting:  hasPermission(Permissions.INVOICE_SETTING_DELETE),
    canReadInvoiceTrash:      hasPermission(Permissions.INVOICE_TRASH_READ),
    canUpdateInvoiceTrash:    hasPermission(Permissions.INVOICE_TRASH_UPDATE),
    canRestoreInvoiceTrash:   hasPermission(Permissions.INVOICE_TRASH_UPDATE),
    canDeleteInvoiceTrash:    hasPermission(Permissions.INVOICE_TRASH_DELETE),
    canReadInvoiceHistory:    hasPermission(Permissions.INVOICE_HISTORY_READ),
    canSendInvoiceMail:       hasPermission(Permissions.INVOICE_MAIL_SEND),
    canUpdateInvoiceStatus:   hasPermission(Permissions.INVOICE_STATUS_UPDATE),
    canReadInvoiceReport:    hasPermission(Permissions.REPORT_READ),

    // ─── Accounts ───────────────────────────────────────────────
    canReadAccountDashboard: hasPermission(Permissions.ACCOUNT_READ),
    canCreateAccount:        hasPermission(Permissions.ACCOUNT_CREATE),
    canReadAccount:          hasPermission(Permissions.ACCOUNT_READ),
    canUpdateAccount:        hasPermission(Permissions.ACCOUNT_UPDATE),
    canDeleteAccount:        hasPermission(Permissions.ACCOUNT_DELETE),
    canCreateAccountConfig:  hasPermission(Permissions.ACCOUNT_SETTING_CREATE),
    canReadAccountConfig:    hasPermission(Permissions.ACCOUNT_SETTING_READ),
    canUpdateAccountConfig:  hasPermission(Permissions.ACCOUNT_SETTING_UPDATE),
    canDeleteAccountConfig:  hasPermission(Permissions.ACCOUNT_SETTING_DELETE),
    canCreateAccountSetting:  hasPermission(Permissions.ACCOUNT_SETTING_CREATE),
    canReadAccountSetting:    hasPermission(Permissions.ACCOUNT_SETTING_READ),
    canUpdateAccountSetting:  hasPermission(Permissions.ACCOUNT_SETTING_UPDATE),
    canDeleteAccountSetting:  hasPermission(Permissions.ACCOUNT_SETTING_DELETE),


    // ─── Clients ────────────────────────────────────────────────────
    canCreateClient: hasPermission(Permissions.CLIENT_CREATE),
    canReadClient:   hasPermission(Permissions.CLIENT_READ),
    canUpdateClient: hasPermission(Permissions.CLIENT_UPDATE),
    canDeleteClient: hasPermission(Permissions.CLIENT_DELETE),
    canManageClients: hasPermission(Permissions.CLIENT_MANAGE),

    // ─── Settings ───────────────────────────────────────────────────
    canReadSettings:   hasPermission(Permissions.SETTINGS_READ),
    canUpdateSettings: hasPermission(Permissions.SETTINGS_UPDATE),
    canDeleteSettings: hasPermission(Permissions.SETTINGS_DELETE),
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
    canReadReimbursementDashboard: hasPermission(Permissions.REIMBURSEMENT_DASHBOARD_READ),
    canCreateReimbursement:  hasPermission(Permissions.REIMBURSEMENT_CREATE),
    canReadReimbursement:    hasPermission(Permissions.REIMBURSEMENT_READ),
    canUpdateReimbursement:  hasPermission(Permissions.REIMBURSEMENT_UPDATE),
    canDeleteReimbursement:  hasPermission(Permissions.REIMBURSEMENT_DELETE),
    canApproveReimbursement: hasPermission(Permissions.REIMBURSEMENT_APPROVE),
    canPayReimbursement:     hasPermission(Permissions.REIMBURSEMENT_PAY),
    canReadReimbursementMy:   hasPermission(Permissions.REIMBURSEMENT_READ),
    canReadReimbursementApproval: hasPermission(Permissions.REIMBURSEMENT_APPROVE),
    canReadReimbursementSetting:  hasPermission(Permissions.REIMBURSEMENT_SETTING_READ),
    canReadReimbursementPolicy:   hasPermission(Permissions.REIMBURSEMENT_CATEGORY_READ),
    canReadReimbursementConfig: hasPermission(Permissions.REIMBURSEMENT_CONFIG_READ),
    canUpdateReimbursementConfig: hasPermission(Permissions.REIMBURSEMENT_CONFIG_UPDATE),
    canReadReimbursementTrash: hasPermission(Permissions.REIMBURSEMENT_TRASH_READ),
    canUpdateReimbursementTrash: hasPermission(Permissions.REIMBURSEMENT_TRASH_UPDATE),
    canRestoreReimbursementTrash: hasPermission(Permissions.REIMBURSEMENT_TRASH_UPDATE),
    canDeleteReimbursementTrash: hasPermission(Permissions.REIMBURSEMENT_TRASH_DELETE),
    canManageReimbursements: hasPermission(Permissions.REIMBURSEMENT_MANAGE),

    // ─── Payroll ────────────────────────────────────────────────────
    canReadPayrollDashboard: hasPermission(Permissions.PAYROLL_DASHBOARD_READ),
    canCreatePayroll:        hasPermission(Permissions.PAYROLL_CREATE),
    canReadPayroll:          hasPermission(Permissions.PAYROLL_READ),
    canUpdatePayroll:        hasPermission(Permissions.PAYROLL_UPDATE),
    canDeletePayroll:        hasPermission(Permissions.PAYROLL_DELETE),
    canProcessPayroll:       hasPermission(Permissions.PAYROLL_PROCESS),
    canPayPayroll:           hasPermission(Permissions.PAYROLL_PAY),
    canCreatePayslip:        hasPermission(Permissions.PAYROLL_PAYSLIP_CREATE),
    canReadPayslip:          hasPermission(Permissions.PAYROLL_PAYSLIP_READ),
    canDeletePayslip:        hasPermission(Permissions.PAYROLL_PAYSLIP_DELETE),
    canSendPayslip:          hasPermission(Permissions.PAYROLL_PAYSLIP_SEND),
    canReadPayrollSetting:   hasPermission(Permissions.PAYROLL_SETTING_READ),
    canCreatePayrollSetting: hasPermission(Permissions.PAYROLL_SETTING_CREATE),
    canUpdatePayrollSetting: hasPermission(Permissions.PAYROLL_SETTING_UPDATE),
    canDeletePayrollSetting: hasPermission(Permissions.PAYROLL_SETTING_DELETE),
    canReadPayrollStructure: hasPermission(Permissions.PAYROLL_STRUCTURE_READ),
    canCreatePayrollStructure: hasPermission(Permissions.PAYROLL_STRUCTURE_CREATE),
    canUpdatePayrollStructure: hasPermission(Permissions.PAYROLL_STRUCTURE_UPDATE),
    canDeletePayrollStructure: hasPermission(Permissions.PAYROLL_STRUCTURE_DELETE),
    canReadPayrollTrash:     hasPermission(Permissions.PAYROLL_TRASH_READ),
    canUpdatePayrollTrash:   hasPermission(Permissions.PAYROLL_TRASH_UPDATE),
    canRestorePayrollTrash:  hasPermission(Permissions.PAYROLL_TRASH_UPDATE),
    canDeletePayrollTrash:   hasPermission(Permissions.PAYROLL_TRASH_DELETE),
    canManagePayroll:        hasPermission(Permissions.PAYROLL_MANAGE),

    // ─── Payroll 2.0 — page-based (12 pages) ────────────────────────
    canReadPayrollSettings:   hasPermission(Permissions.PAYROLL_SETTINGS_READ),
    canUpdatePayrollSettings: hasPermission(Permissions.PAYROLL_SETTINGS_UPDATE),
    canReadPayrollComponents:   hasPermission(Permissions.PAYROLL_COMPONENTS_READ),
    canCreatePayrollComponents: hasPermission(Permissions.PAYROLL_COMPONENTS_CREATE),
    canUpdatePayrollComponents: hasPermission(Permissions.PAYROLL_COMPONENTS_UPDATE),
    canDeletePayrollComponents: hasPermission(Permissions.PAYROLL_COMPONENTS_DELETE),
    canReadPayrollStructures:   hasPermission(Permissions.PAYROLL_STRUCTURES_READ),
    canCreatePayrollStructures: hasPermission(Permissions.PAYROLL_STRUCTURES_CREATE),
    canUpdatePayrollStructures: hasPermission(Permissions.PAYROLL_STRUCTURES_UPDATE),
    canDeletePayrollStructures: hasPermission(Permissions.PAYROLL_STRUCTURES_DELETE),
    canReadPayrollSchedules:   hasPermission(Permissions.PAYROLL_SCHEDULES_READ),
    canCreatePayrollSchedules: hasPermission(Permissions.PAYROLL_SCHEDULES_CREATE),
    canUpdatePayrollSchedules: hasPermission(Permissions.PAYROLL_SCHEDULES_UPDATE),
    canDeletePayrollSchedules: hasPermission(Permissions.PAYROLL_SCHEDULES_DELETE),
    canReadPayrollStatutory:   hasPermission(Permissions.PAYROLL_STATUTORY_READ),
    canUpdatePayrollStatutory: hasPermission(Permissions.PAYROLL_STATUTORY_UPDATE),
    canReadPayrollStateStatutory:   hasPermission(Permissions.PAYROLL_STATE_STATUTORY_READ),
    canCreatePayrollStateStatutory: hasPermission(Permissions.PAYROLL_STATE_STATUTORY_CREATE),
    canUpdatePayrollStateStatutory: hasPermission(Permissions.PAYROLL_STATE_STATUTORY_UPDATE),
    canDeletePayrollStateStatutory: hasPermission(Permissions.PAYROLL_STATE_STATUTORY_DELETE),
    canReadPayrollWorkflows:   hasPermission(Permissions.PAYROLL_WORKFLOWS_READ),
    canCreatePayrollWorkflows: hasPermission(Permissions.PAYROLL_WORKFLOWS_CREATE),
    canUpdatePayrollWorkflows: hasPermission(Permissions.PAYROLL_WORKFLOWS_UPDATE),
    canDeletePayrollWorkflows: hasPermission(Permissions.PAYROLL_WORKFLOWS_DELETE),
    canReadPayrollPayslipBank:   hasPermission(Permissions.PAYROLL_PAYSLIP_BANK_READ),
    canUpdatePayrollPayslipBank: hasPermission(Permissions.PAYROLL_PAYSLIP_BANK_UPDATE),
    canReadPayrollEmployees:   hasPermission(Permissions.PAYROLL_EMPLOYEES_READ),
    canCreatePayrollEmployees: hasPermission(Permissions.PAYROLL_EMPLOYEES_CREATE),
    canUpdatePayrollEmployees: hasPermission(Permissions.PAYROLL_EMPLOYEES_UPDATE),
    canDeletePayrollEmployees: hasPermission(Permissions.PAYROLL_EMPLOYEES_DELETE),
    canReadPayrollRun:     hasPermission(Permissions.PAYROLL_RUN_READ),
    canCreatePayrollRun:   hasPermission(Permissions.PAYROLL_RUN_CREATE),
    canProcessPayrollRun:  hasPermission(Permissions.PAYROLL_RUN_PROCESS),
    canApprovePayrollRun:  hasPermission(Permissions.PAYROLL_RUN_APPROVE),
    canFinalizePayrollRun: hasPermission(Permissions.PAYROLL_RUN_FINALIZE),
    canPayPayrollRun:      hasPermission(Permissions.PAYROLL_RUN_PAY),
    canGeneratePayrollPayslips: hasPermission(Permissions.PAYROLL_RUN_PAYSLIPS),
    canDeletePayrollRun:   hasPermission(Permissions.PAYROLL_RUN_DELETE),
    canReadPayrollReports:   hasPermission(Permissions.PAYROLL_REPORTS_READ),
    canExportPayrollReports: hasPermission(Permissions.PAYROLL_REPORTS_EXPORT),
    canReadMyPayslips:       hasPermission(Permissions.PAYROLL_MY_PAYSLIPS_READ),

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
    canDeleteOnboarding: hasPermission(Permissions.ONBOARDING_DELETE),
    canReadOnboardingSetting: hasPermission(Permissions.ONBOARDING_SETTING_READ),
    canUpdateOnboardingSetting: hasPermission(Permissions.ONBOARDING_SETTING_UPDATE),

    // ─── Timesheet ──────────────────────────────────────────────────
    canCreateTimesheet:  hasPermission(Permissions.TIMESHEET_CREATE),
    canReadTimesheet:    hasPermission(Permissions.TIMESHEET_READ),
    canUpdateTimesheet:  hasPermission(Permissions.TIMESHEET_UPDATE),
    canDeleteTimesheet:  hasPermission(Permissions.TIMESHEET_DELETE),
    canApproveTimesheet: hasPermission(Permissions.TIMESHEET_APPROVE),
    canManageTimesheets: hasPermission(Permissions.TIMESHEET_MANAGE),

    // ─── Org structure ──────────────────────────────────────────────
    canReadOrg:   hasPermission(Permissions.ORG_READ),
    canManageOrg: hasPermission(Permissions.ORG_MANAGE),
    canReadOrgDashboard: hasPermission(Permissions.ORG_DASHBOARD_READ),
    canReadOrgDepartment:   hasPermission(Permissions.ORG_DEPARTMENT_READ),
    canCreateOrgDepartment: hasPermission(Permissions.ORG_DEPARTMENT_CREATE),
    canUpdateOrgDepartment: hasPermission(Permissions.ORG_DEPARTMENT_UPDATE),
    canDeleteOrgDepartment: hasPermission(Permissions.ORG_DEPARTMENT_DELETE),
    canReadOrgGrade:   hasPermission(Permissions.ORG_GRADE_READ),
    canCreateOrgGrade: hasPermission(Permissions.ORG_GRADE_CREATE),
    canUpdateOrgGrade: hasPermission(Permissions.ORG_GRADE_UPDATE),
    canDeleteOrgGrade: hasPermission(Permissions.ORG_GRADE_DELETE),
    canReadOrgPosition:   hasPermission(Permissions.ORG_POSITION_READ),
    canCreateOrgPosition: hasPermission(Permissions.ORG_POSITION_CREATE),
    canUpdateOrgPosition: hasPermission(Permissions.ORG_POSITION_UPDATE),
    canDeleteOrgPosition: hasPermission(Permissions.ORG_POSITION_DELETE),
    canReadOrgEmploymentType:   hasPermission(Permissions.ORG_EMPLOYMENT_TYPE_READ),
    canCreateOrgEmploymentType: hasPermission(Permissions.ORG_EMPLOYMENT_TYPE_CREATE),
    canUpdateOrgEmploymentType: hasPermission(Permissions.ORG_EMPLOYMENT_TYPE_UPDATE),
    canDeleteOrgEmploymentType: hasPermission(Permissions.ORG_EMPLOYMENT_TYPE_DELETE),

    // ─── Daily updates ──────────────────────────────────────────────
    canCreateDailyUpdate: hasPermission(Permissions.DAILY_UPDATE_CREATE),
    canReadDailyUpdate:   hasPermission(Permissions.DAILY_UPDATE_READ),
    canUpdateDailyUpdate: hasPermission(Permissions.DAILY_UPDATE_UPDATE),
    canDeleteDailyUpdate: hasPermission(Permissions.DAILY_UPDATE_DELETE),
    canManageDailyUpdateTime: hasPermission(Permissions.DAILY_UPDATE_MANAGE_TIME),

    // ─── Leads & CRM ────────────────────────────────────────────────
    canCreateLead: hasPermission(Permissions.LEAD_CREATE),
    canReadLead:   hasPermission(Permissions.LEAD_READ),
    canUpdateLead: hasPermission(Permissions.LEAD_UPDATE),
    canDeleteLead: hasPermission(Permissions.LEAD_DELETE),
    canReadLeadSetting:   hasPermission(Permissions.LEAD_SETTING_READ),
    canCreateLeadSetting: hasPermission(Permissions.LEAD_SETTING_CREATE),
    canUpdateLeadSetting: hasPermission(Permissions.LEAD_SETTING_UPDATE),
    canDeleteLeadSetting: hasPermission(Permissions.LEAD_SETTING_DELETE),
    canReadLeadTrash:     hasPermission(Permissions.LEAD_TRASH_READ),
    canRestoreLeadTrash:  hasPermission(Permissions.LEAD_TRASH_RESTORE),
    canDeleteLeadTrash:   hasPermission(Permissions.LEAD_TRASH_DELETE),
    canManageLeads: hasPermission(Permissions.LEAD_MANAGE),

    // ─── BidIq (AI lead intelligence) ───────────────────────────────
    canReadBidiq:   hasPermission(Permissions.BIDIQ_READ),
    canCreateBidiq: hasPermission(Permissions.BIDIQ_CREATE),

    // ─── Proposals ──────────────────────────────────────────────────
    canCreateProposal: hasPermission(Permissions.PROPOSAL_CREATE),
    canReadProposal:   hasPermission(Permissions.PROPOSAL_READ),
    canUpdateProposal: hasPermission(Permissions.PROPOSAL_UPDATE),
    canDeleteProposal: hasPermission(Permissions.PROPOSAL_DELETE),

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
    // My Hub self-service — granted via my_hub.escalation.read in RBAC
    canReadMyHubEscalation: hasPermission(Permissions.MY_HUB_ESCALATION_READ),

    // ─── Pipeline ───────────────────────────────────────────────────
    canCreatePipeline:  hasPermission(Permissions.PIPELINE_CREATE),
    canReadPipeline:    hasPermission(Permissions.PIPELINE_READ),
    canUpdatePipeline:  hasPermission(Permissions.PIPELINE_UPDATE),
    canDeletePipeline:  hasPermission(Permissions.PIPELINE_DELETE),
    canManagePipeline:  hasPermission(Permissions.PIPELINE_MANAGE),
    canReadPipelineBoard:    hasPermission(Permissions.PIPELINE_BOARD_READ),
    canCreatePipelineBoard:  hasPermission(Permissions.PIPELINE_BOARD_CREATE),
    canUpdatePipelineBoard:  hasPermission(Permissions.PIPELINE_BOARD_UPDATE),
    canDeletePipelineBoard:  hasPermission(Permissions.PIPELINE_BOARD_DELETE),
    canReadDeals:            hasPermission(Permissions.PIPELINE_DEALS_READ),
    canCreateDeals:          hasPermission(Permissions.PIPELINE_DEALS_CREATE),
    canUpdateDeals:          hasPermission(Permissions.PIPELINE_DEALS_UPDATE),
    canDeleteDeals:          hasPermission(Permissions.PIPELINE_DEALS_DELETE),
    canReadPipelineForecast: hasPermission(Permissions.PIPELINE_FORECAST_READ),
    canReadPipelineSetting:  hasPermission(Permissions.PIPELINE_SETTING_READ),
    canUpdatePipelineSetting: hasPermission(Permissions.PIPELINE_SETTING_UPDATE),

    // ─── Recruitment / ATS ──────────────────────────────────────────
    canCreateRecruitment: hasPermission(Permissions.RECRUITMENT_CREATE),
    canReadRecruitment:   hasPermission(Permissions.RECRUITMENT_READ),
    canUpdateRecruitment: hasPermission(Permissions.RECRUITMENT_UPDATE),
    canDeleteRecruitment: hasPermission(Permissions.RECRUITMENT_DELETE),
    canManageRecruitment: hasPermission(Permissions.RECRUITMENT_MANAGE),
    canReadRecruitmentSetting: hasPermission(Permissions.RECRUITMENT_SETTING_READ),

    // ─── Employee Exit ──────────────────────────────────────────────
    canCreateExit: hasPermission(Permissions.EXIT_CREATE),
    canReadExit:   hasPermission(Permissions.EXIT_READ),
    canUpdateExit: hasPermission(Permissions.EXIT_UPDATE),
    canManageExits: hasPermission(Permissions.EXIT_MANAGE),
    canReadExitConfig: hasPermission(Permissions.EXIT_CONFIG_READ),
    canUpdateExitConfig: hasPermission(Permissions.EXIT_CONFIG_UPDATE),

    // ─── Performance Report ─────────────────────────────────────────
    canReadPerformanceReport:         hasPermission(Permissions.PERFORMANCE_REPORT_READ),
    canReadPerformanceReportSetting:   hasPermission(Permissions.PERFORMANCE_REPORT_SETTING_READ),
    canUpdatePerformanceReportSetting: hasPermission(Permissions.PERFORMANCE_REPORT_SETTING_UPDATE),
    canReadGeneratedPerformanceReport: hasPermission(Permissions.PERFORMANCE_REPORT_GENERATED_READ),
    canReadMyPerformanceReport: hasPermission(Permissions.PERFORMANCE_REPORT_MY_READ),
    // My Hub self-service — granted via my_hub.performance.read in RBAC
    canReadMyHubPerformance: hasPermission(Permissions.MY_HUB_PERFORMANCE_READ),

    // My Hub self-service — granted via my_hub.claims.read in RBAC
    canReadMyHubClaims: hasPermission(Permissions.MY_HUB_CLAIMS_READ),

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

    // ─── Bug List (QA workspace; converts to tickets) ────────────────
    canCreateBug: hasPermission(Permissions.BUG_CREATE),
    canReadBug:   hasPermission(Permissions.BUG_READ),
    canUpdateBug: hasPermission(Permissions.BUG_UPDATE),
    canDeleteBug: hasPermission(Permissions.BUG_DELETE),
    canReadBugTrash:    hasPermission(Permissions.BUG_TRASH_READ),
    canRestoreBugTrash: hasPermission(Permissions.BUG_TRASH_RESTORE),
    canDeleteBugTrash:  hasPermission(Permissions.BUG_TRASH_DELETE),
    canReadBugArchive:    hasPermission(Permissions.BUG_ARCHIVE_READ),
    canRestoreBugArchive: hasPermission(Permissions.BUG_ARCHIVE_RESTORE),
    canManageBugs: hasPermission(Permissions.BUG_MANAGE),

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

    // ─── Notifications ──────────────────────────────────────────────
    canCreateNotification: hasPermission(Permissions.NOTIFICATION_CREATE),
    canReadNotification:   hasPermission(Permissions.NOTIFICATION_READ),
    canUpdateNotification: hasPermission(Permissions.NOTIFICATION_UPDATE),
    canDeleteNotification: hasPermission(Permissions.NOTIFICATION_DELETE),

    // ─── Bookmarks ──────────────────────────────────────────────────
    canCreateBookmark: hasPermission(Permissions.BOOKMARK_CREATE),
    canReadBookmark:   hasPermission(Permissions.BOOKMARK_READ),
    canUpdateBookmark: hasPermission(Permissions.BOOKMARK_UPDATE),
    canDeleteBookmark: hasPermission(Permissions.BOOKMARK_DELETE),

    canCreateTimeTracking: hasPermission(Permissions.TIME_TRACKING_CREATE),
    canReadTimeTracking:   hasPermission(Permissions.TIME_TRACKING_READ),
    canDeleteTimeTracking: hasPermission(Permissions.TIME_TRACKING_DELETE),
    canReadTimeTrackingTeam: hasPermission(Permissions.TIME_TRACKING_TEAM_READ),
    canManageTimeTrackingTime: hasPermission(Permissions.TIME_TRACKING_MANAGE_TIME),

    // ─── Activity Log (transaction history) ─────────────────────────
    canReadActivityLog:    hasPermission(Permissions.ACTIVITY_LOG_READ),
    canReadActivityLogAll: hasPermission(Permissions.ACTIVITY_LOG_READ_ALL),

    // ─── Raw helpers ─────────────────────────────────────────────────
    /** Check a single permission string */
    can:    hasPermission,
    /** Check if user has ANY of the permissions */
    canAny: hasAnyPermission,
    /** Check if user has ALL of the permissions */
    canAll: hasAllPermissions,
  };
};
