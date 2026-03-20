// services/managerReimbursementService.ts
import { api, ApiError } from "@/lib/axios";

/* ================================
   TYPES
================================ */

export interface ManagerApprovalItem {
  id: string;
  category: string;
  date: string;
  billNo: string;
  amount: number;
  description: string | null;
}

export interface ManagerApprovalResponse {
  id: string;                   // approver ID
  reimbursementId: string;      // reimbursement ID
  level: number;
  employeeName: string;
  employeeCode: string;
  employeeEmail: string;
  totalAmount: number;
  submittedAt: string | null;
  items: ManagerApprovalItem[];
}

export interface ApproveRejectResponse {
  success: boolean;
  message: string;
  data: any;
}

/* ================================
   SERVICE
================================ */

export class ManagerReimbursementService {
  
  /**
   * GET MANAGER APPROVALS
   * Get all pending approvals for the logged-in manager
   */
  static async getApprovals(): Promise<ManagerApprovalResponse[]> {
    try {
      const response = await api.get("/api/manager/reimbursements/approval");
      
      console.log('📦 Manager approvals response:', response);
      
      // Case 1: response.data is directly the array
      if (Array.isArray(response.data)) {
        console.log('✅ Case 1: response.data is array');
        return response.data as ManagerApprovalResponse[];
      }
      
      // Case 2: response.data has success and data properties
      if (response.data && response.data.success === true) {
        if (Array.isArray(response.data.data)) {
          console.log('✅ Case 2: response.data.data is array');
          return response.data.data as ManagerApprovalResponse[];
        }
      }
      
      // Case 3: response.data has data property that is array
      if (response.data && Array.isArray(response.data.data)) {
        console.log('✅ Case 3: response.data.data is array');
        return response.data.data as ManagerApprovalResponse[];
      }
      
      console.log('⚠️ No valid data found, returning empty array');
      return [];
      
    } catch (error: any) {
      console.error("Get manager approvals error:", error);
      return [];
    }
  }

  /**
   * APPROVE REIMBURSEMENT
   */
  static async approveReimbursement(
    approverId: string, 
    reimbursementId: string, 
    comments?: string
  ): Promise<ApproveRejectResponse> {
    try {
      const response = await api.put(
        `/api/manager/reimbursements/approve/${approverId}/${reimbursementId}`, 
        { comments }
      );
      
      return response.data;
      
    } catch (error: any) {
      console.error("Approve error:", error);
      throw new Error(error?.response?.data?.error || "Failed to approve");
    }
  }

  /**
   * REJECT REIMBURSEMENT
   */
  static async rejectReimbursement(
    approverId: string, 
    reimbursementId: string, 
    rejectionReason: string,
    comments?: string
  ): Promise<ApproveRejectResponse> {
    try {
      const response = await api.put(
        `/api/manager/reimbursements/reject/${approverId}/${reimbursementId}`, 
        { rejectionReason, comments }
      );
      
      return response.data;
      
    } catch (error: any) {
      console.error("Reject error:", error);
      throw new Error(error?.response?.data?.error || "Failed to reject");
    }
  }

  /**
   * GET APPROVAL HISTORY
   */
  static async getApprovalHistory(reimbursementId: string): Promise<any[]> {
    try {
      const response = await api.get(`/api/manager/reimbursements/history/${reimbursementId}`);
      
      if (response.data && response.data.success === true) {
        return response.data.data || [];
      }
      
      return [];
      
    } catch (error: any) {
      console.error("Get approval history error:", error);
      return [];
    }
  }
}