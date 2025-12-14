import { apiClient } from '@/lib/axios';

export interface Leave {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationType: string;
  reason: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  attachments: any[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    workEmail: string;
    position: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    position: string;
  };
}

export interface ApplyLeaveData {
  type: string;
  startDate: string;
  endDate: string;
  duration: number;
  durationType: string;
  reason: string;
  attachments?: any[];
}

export interface LeaveListResponse {
  success: boolean;
  data: Leave[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class LeaveService {
  /**
   * Apply for leave
   */
  static async applyLeave(data: ApplyLeaveData): Promise<Leave> {
    try {
      const response = await apiClient.post('/api/leaves', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Error applying for leave:', error);
      const errorMessage = error.response?.data?.error || 'Failed to apply for leave';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get my leaves
   */
  static async getMyLeaves(params?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<LeaveListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = queryParams.toString() 
        ? `/api/leaves/my-leaves?${queryParams.toString()}`
        : '/api/leaves/my-leaves';

      const response = await apiClient.get(url);
      return {
        success: response.data.success,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error('Error fetching my leaves:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch leaves';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get pending approvals
   */
  static async getPendingApprovals(): Promise<Leave[]> {
    try {
      const response = await apiClient.get('/api/leaves/pending-approvals');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching pending approvals:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch pending approvals';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get leave by ID
   */
  static async getLeaveById(id: string): Promise<Leave> {
    try {
      const response = await apiClient.get(`/api/leaves/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching leave:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch leave';
      throw new Error(errorMessage);
    }
  }

  /**
   * Approve leave
   */
  static async approveLeave(id: string): Promise<Leave> {
    try {
      const response = await apiClient.put(`/api/leaves/${id}/approve`, {});
      return response.data.data;
    } catch (error: any) {
      console.error('Error approving leave:', error);
      const errorMessage = error.response?.data?.error || 'Failed to approve leave';
      throw new Error(errorMessage);
    }
  }

  /**
   * Reject leave
   */
  static async rejectLeave(id: string, rejectionReason: string): Promise<Leave> {
    try {
      const response = await apiClient.put(`/api/leaves/${id}/reject`, { rejectionReason });
      return response.data.data;
    } catch (error: any) {
      console.error('Error rejecting leave:', error);
      const errorMessage = error.response?.data?.error || 'Failed to reject leave';
      throw new Error(errorMessage);
    }
  }

  /**
   * Cancel leave
   */
  static async cancelLeave(id: string): Promise<Leave> {
    try {
      const response = await apiClient.put(`/api/leaves/${id}/cancel`, {});
      return response.data.data;
    } catch (error: any) {
      console.error('Error cancelling leave:', error);
      const errorMessage = error.response?.data?.error || 'Failed to cancel leave';
      throw new Error(errorMessage);
    }
  }

  /**
   * Get all leaves (admin only)
   */
  static async getAllLeaves(params?: {
    status?: string;
    type?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<LeaveListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = queryParams.toString() 
        ? `/api/leaves?${queryParams.toString()}`
        : '/api/leaves';

      const response = await apiClient.get(url);
      return {
        success: response.data.success,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error('Error fetching all leaves:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch leaves';
      throw new Error(errorMessage);
    }
  }
}

export const leaveService = LeaveService;
export default LeaveService;
