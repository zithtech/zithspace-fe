// hooks/useManagerReimbursement.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { 
  ManagerReimbursementService, 
  ManagerApprovalResponse 
} from "@/services/managerReimbursementService";

/* ==================== QUERIES ==================== */

/**
 * Hook to get manager approvals list
 */
export const useManagerApprovals = () => {
  return useQuery<ManagerApprovalResponse[], Error>({
    queryKey: ["manager-approvals"],
    queryFn: () => ManagerReimbursementService.getApprovals(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
  });
};

/**
 * Hook to get approval history for a specific reimbursement
 */
export const useApprovalHistory = (reimbursementId?: string) => {
  return useQuery<any[], Error>({
    queryKey: ["approval-history", reimbursementId],
    queryFn: () => ManagerReimbursementService.getApprovalHistory(reimbursementId!),
    enabled: !!reimbursementId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/* ==================== MUTATIONS ==================== */

/**
 * Hook to approve a reimbursement
 */
export const useApproveReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      approverId, 
      reimbursementId, 
      comments 
    }: { 
      approverId: string; 
      reimbursementId: string; 
      comments?: string;
    }) => ManagerReimbursementService.approveReimbursement(approverId, reimbursementId, comments),
    
    onSuccess: (data) => {
      // Invalidate approvals list
      queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
      
      // Show success message
      message.success(data.message || 'Approved successfully');
    },
    
    onError: (error: Error) => {
      message.error(error.message || 'Failed to approve');
    },
  });
};

/**
 * Hook to reject a reimbursement
 */
export const useRejectReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      approverId, 
      reimbursementId, 
      rejectionReason,
      comments 
    }: { 
      approverId: string; 
      reimbursementId: string; 
      rejectionReason: string;
      comments?: string;
    }) => ManagerReimbursementService.rejectReimbursement(
      approverId, 
      reimbursementId, 
      rejectionReason, 
      comments
    ),
    
    onSuccess: (data) => {
      // Invalidate approvals list
      queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
      
      // Show success message
      message.success(data.message || 'Rejected successfully');
    },
    
    onError: (error: Error) => {
      message.error(error.message || 'Failed to reject');
    },
  });
};

/* ==================== COMBINED HOOK ==================== */

/**
 * Combined hook for manager approval page
 */
export const useManagerApprovalPage = () => {
  const approvals = useManagerApprovals();
  const approve = useApproveReimbursement();
  const reject = useRejectReimbursement();

  return {
    // Data
    approvals: approvals.data || [],
    isLoading: approvals.isLoading,
    error: approvals.error,
    
    // Actions
    refresh: approvals.refetch,
    approve: approve.mutateAsync,
    reject: reject.mutateAsync,
    isProcessing: approve.isPending || reject.isPending,
  };
};