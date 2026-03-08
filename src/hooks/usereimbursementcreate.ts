


// hooks/useReimbursement.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ReimbursementService,
  ReimbursementResponse,
  CreateReimbursementData,
  UpdateReimbursementData,
} from "@/services/reimbursementcreateService";
import { useMemo } from "react"; // 👈 Add this import

import { useReimbursementConfigurations } from "@/hooks/usereimbursementconfig";
/* ==================== QUERIES ==================== */

/** Get all reimbursements */
export const useAllReimbursements = () => {
  return useQuery<ReimbursementResponse[], Error>({
    queryKey: ["reimbursements"],
    queryFn: () => ReimbursementService.getAllReimbursements(),
    staleTime: 2 * 60 * 1000, // 2 min
    gcTime: 5 * 60 * 1000,
  });
};

/** Get reimbursement by ID */
export const useReimbursementById = (id?: string) => {
  return useQuery<ReimbursementResponse, Error>({
    queryKey: ["reimbursement", id],
    queryFn: () => ReimbursementService.getReimbursementById(id!),
    enabled: !!id, // only fetch if ID exists
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/* ==================== MUTATIONS ==================== */

/** Create reimbursement */
export const useCreateReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReimbursementData) =>
      ReimbursementService.createReimbursement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
    },
  });
};

/** Update reimbursement (status, items, files) */
export const useUpdateReimbursement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data, files }: { id: string; data: any; files?: File[] }) => 
      ReimbursementService.updateReimbursement(id, { ...data, files }),
    onSuccess: (data, variables) => {
      // Invalidate the specific reimbursement query
      queryClient.invalidateQueries({ 
        queryKey: ['reimbursement', variables.id] 
      });
      // Also invalidate the list
      queryClient.invalidateQueries({ 
        queryKey: ['reimbursements'] 
      });
    },
  });
};

/** Delete reimbursement */
export const useDeleteReimbursement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ReimbursementService.deleteReimbursement(id),
    onSuccess: () => {
      // Invalidate the reimbursements list to refresh the data
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      
    },
  });
};

/* ==================== COMBINED HOOK ==================== */

/** Fetch single reimbursement and track loading/error */
export const useReimbursementData = (id?: string) => {
  const reimbursement = useReimbursementById(id);

  return {
    reimbursement,
    isLoading: reimbursement.isLoading,
    isError: reimbursement.isError,
  };
};


export const useManagerApprovals = () => {
  return useQuery<ReimbursementResponse[], Error>({
    queryKey: ["manager-approvals"],
    queryFn: () => ReimbursementService.getApprovalList(),
    staleTime: 0,           // 🔴 Always fetch fresh data
    gcTime: 5 * 60 * 1000,  // Keep in cache for 5 mins (optional)
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};












export const useApproveItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reimbursementItemId: string) =>
      ReimbursementService.approveItem(reimbursementItemId),
    onSuccess: () => {
      console.log('✅ Approve mutation succeeded, invalidating queries...');
      // Invalidate both lists to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ["manager-approvals"],
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["reimbursements"],
        refetchType: 'active' 
      });
    },
    onError: (error) => {
      console.error('❌ Approve mutation error:', error);
    }
  });
};

export const useRejectItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, remarks }: { id: string; remarks?: string }) =>
      ReimbursementService.rejectItem(id, remarks),
    onSuccess: () => {
      console.log('✅ Reject mutation succeeded, invalidating queries...');
      // Invalidate both lists to refresh data
      queryClient.invalidateQueries({ 
        queryKey: ["manager-approvals"],
        refetchType: 'active' 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["reimbursements"],
        refetchType: 'active' 
      });
    },
    onError: (error) => {
      console.error('❌ Reject mutation error:', error);
    }
  });
};



export const useFinanceItems = () => {
  return useQuery({
    queryKey: ["finance-items"],
    queryFn: async () => {
      console.log('📤 Calling getFinanceItems...');
      const data = await ReimbursementService.getFinanceItems();
      console.log('📥 Hook received data:', data);
      console.log('📥 Data type:', typeof data);
      console.log('📥 Is array?', Array.isArray(data));
      
      // Ensure we always return an array
      if (Array.isArray(data)) {
        return data;
      }
      
      console.warn('⚠️ Data is not an array, returning empty array');
      return [];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};



export const useMarkAsPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reimbursementItemId: string) =>
      ReimbursementService.markAsPaid(reimbursementItemId),

    onSuccess: () => {
      console.log("✅ Paid mutation succeeded, refreshing queries...");

      // Refresh finance reimbursement list
      queryClient.invalidateQueries({ queryKey: ["finance-reimbursements"] });

      // Refresh manager approval list
      queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });

      // Refresh employee reimbursement list
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
    },

    onError: (error: any) => {
      console.error("❌ Paid mutation error:", error);
    },
  });
};




export const useApproverTypeForCategory = (category: string) => {
  const { data: configurations } = useReimbursementConfigurations();
  
  return useMemo(() => {
    if (!configurations || !category) return null;
    
    // Find configuration matching this category
    const config = configurations.find(
      (c: any) => c.categoryType?.toLowerCase() === category.toLowerCase()
    );
    
    if (config?.approvers && config.approvers.length > 0) {
      // Return the first approver type (you can modify logic based on level)
      return config.approvers[0].approverType;
    }
    
    return null;
  }, [configurations, category]);
};

// Hook to get all approver types mapped to categories
export const useApproverTypeMap = () => {
  const { data: configurations } = useReimbursementConfigurations();
  
  return useMemo(() => {
    const map = new Map();
    
    if (configurations) {
      configurations.forEach((config: any) => {
        if (config.categoryType && config.approvers && config.approvers.length > 0) {
          // Store the first approver type for this category
          map.set(config.categoryType.toLowerCase(), config.approvers[0].approverType);
        }
      });
    }
    
    return map;
  }, [configurations]);
};


