// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { ReimbursementService } from '@/services/reimbursementConfig';
// import {
//   CreateReimbursementConfigData,
//   UpdateReimbursementConfigData,
// } from '@/services/reimbursementConfig';

// /* ==================== QUERIES ==================== */

// /** Get all reimbursement configs */
// export const useReimbursementConfigs = () => {
//   return useQuery({
//     queryKey: ['reimbursements'],
//     queryFn: () => ReimbursementService.getConfigs(),
//     staleTime: 2 * 60 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };

// /** Get single config by ID */
// export const useReimbursementConfigById = (id?: string) => {
//   return useQuery({
//     queryKey: ['reimbursement', id],
//     queryFn: () => ReimbursementService.getConfigById(id!),
//     enabled: !!id,
//     staleTime: 2 * 60 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };


// /* ==================== MUTATIONS ==================== */

// /** Create config */
// export const useCreateReimbursementConfig = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: CreateReimbursementConfigData) =>
//       ReimbursementService.createConfig(data),

//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
//     },
//   });
// };

// /** Update config */
// export const useUpdateReimbursementConfig = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       id,
//       data,
//     }: {
//       id: string;
//       data: UpdateReimbursementConfigData;
//     }) => ReimbursementService.updateConfig(id, data),

//     onSuccess: (_, { id }) => {
//       queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
//       queryClient.invalidateQueries({ queryKey: ['reimbursement', id] });
//     },
//   });
// };

// /** Delete config */
// export const useDeleteReimbursementConfig = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: string) =>
//       ReimbursementService.deleteConfig(id),

//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['reimbursements'] });
//     },
//   });
// };


// /* ==================== COMBINED HOOK ==================== */

// /** Fetch single reimbursement config (wrapper like timesheet) */
// export const useReimbursementConfigData = (id?: string) => {
//   const reimbursement = useReimbursementConfigById(id);

//   return {
//     reimbursement,
//     isLoading: reimbursement.isLoading,
//     isError: reimbursement.isError,
//   };
// };



// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { ReimbursementService } from '@/services/reimbursementConfig';

// import type {
//   CreateReimbursementPolicyData,
//   UpdateReimbursementPolicyData,
//   ReimbursementPolicy,
// } from '@/services/reimbursementConfig';

// /* ======================================================
//    QUERY KEYS
// ====================================================== */

// const QUERY_KEYS = {
//   all: ['reimbursements'] as const,
//   single: (id: string) => ['reimbursement', id] as const,
// };

// /* ======================================================
//    QUERIES
// ====================================================== */

// /**
//  * Get all reimbursement policies
//  */
// export const useReimbursementPolicies = () => {
//   return useQuery<ReimbursementPolicy[]>({
//     queryKey: QUERY_KEYS.all,
//     queryFn: () => ReimbursementService.getConfigs(),
//     staleTime: 2 * 60 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };

// /**
//  * Get single reimbursement policy by ID
//  */
// export const useReimbursementPolicyById = (id?: string) => {
//   return useQuery<ReimbursementPolicy>({
//     queryKey: id ? QUERY_KEYS.single(id) : [],
//     queryFn: () => ReimbursementService.getConfigById(id!),
//     enabled: !!id,
//     staleTime: 2 * 60 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };

// /* ======================================================
//    MUTATIONS
// ====================================================== */

// /**
//  * Create reimbursement policy (nested)
//  */
// export const useCreateReimbursementPolicy = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: CreateReimbursementPolicyData) =>
//       ReimbursementService.createConfig(data),

//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
//     },
//   });
// };

// /**
//  * Update reimbursement policy
//  */
// export const useUpdateReimbursementPolicy = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       id,
//       data,
//     }: {
//       id: string;
//       data: UpdateReimbursementPolicyData;
//     }) => ReimbursementService.updateConfig(id, data),

//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
//       queryClient.invalidateQueries({
//         queryKey: QUERY_KEYS.single(variables.id),
//       });
//     },
//   });
// };

// /**
//  * Delete reimbursement policy
//  */
// export const useDeleteReimbursementPolicy = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: string) =>
//       ReimbursementService.deleteConfig(id),

//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
//     },
//   });
// };

// /* ======================================================
//    WRAPPER HOOK (Like Timesheet Pattern)
// ====================================================== */

// export const useReimbursementPolicyData = (id?: string) => {
//   const reimbursement = useReimbursementPolicyById(id);

//   return {
//     reimbursement,
//     isLoading: reimbursement.isLoading,
//     isError: reimbursement.isError,
//   };
// };



// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { ReimbursementService } from '@/services/reimbursementConfig';
// import { notification } from 'antd';

// import type {
//   CreateReimbursementPolicyData,
//   UpdateReimbursementPolicyData,
//   ReimbursementConfig,
// } from '@/services/reimbursementConfig';

// /* ======================================================
//    QUERY KEYS
// ====================================================== */

// const QUERY_KEYS = {
//   all: ['reimbursements'] as const,
//   single: (id: string) => ['reimbursement', id] as const,
//   byOrigin: (origin: string, subOrigin: string) => 
//     ['reimbursements', origin, subOrigin] as const,
// };

// /* ======================================================
//    QUERIES
// ====================================================== */

// /**
//  * Get all reimbursement configurations (flattened for UI)
//  */
// export const useReimbursementConfigs = () => {
//   return useQuery<ReimbursementConfig[]>({
//     queryKey: QUERY_KEYS.all,
//     queryFn: async () => {
//       try {
//         const data = await ReimbursementService.getConfigs();
//         return data;
//       } catch (error: any) {
//         notification.error({
//           message: 'Failed to fetch configurations',
//           description: error.message,
//         });
//         throw error;
//       }
//     },
//     staleTime: 2 * 60 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };

// /**
//  * Get single reimbursement configuration by ID
//  */
// export const useReimbursementConfigById = (id?: string) => {
//   return useQuery<ReimbursementConfig>({
//     queryKey: id ? QUERY_KEYS.single(id) : [],
//     queryFn: async () => {
//       try {
//         return await ReimbursementService.getConfigById(id!);
//       } catch (error: any) {
//         notification.error({
//           message: 'Failed to fetch configuration',
//           description: error.message,
//         });
//         throw error;
//       }
//     },
//     enabled: !!id,
//     staleTime: 2 * 60 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };

// /* ======================================================
//    MUTATIONS
// ====================================================== */

// /**
//  * Create single reimbursement configuration
//  */
// export const useCreateReimbursementConfig = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (data: CreateReimbursementPolicyData) => {
//       return await ReimbursementService.createConfig(data);
//     },

//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      
//       if (data) {
//         queryClient.invalidateQueries({ 
//           queryKey: QUERY_KEYS.byOrigin(data.origin, data.subOriginId) 
//         });
//       }

//       notification.success({
//         message: 'Success',
//         description: 'Configuration created successfully',
//       });
//     },

//     onError: (error: any) => {
//       notification.error({
//         message: 'Error',
//         description: error.message || 'Failed to create configuration',
//       });
//     },
//   });
// };

// /**
//  * Create multiple reimbursement configurations in one request
//  */
// export const useCreateBulkReimbursementConfigs = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (configs: CreateReimbursementPolicyData[]) => {
//       return await ReimbursementService.createBulkConfigs(configs);
//     },

//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      
//       if (data && data.length > 0) {
//         queryClient.invalidateQueries({ 
//           queryKey: QUERY_KEYS.byOrigin(data[0].origin, data[0].subOriginId) 
//         });
//       }

//       notification.success({
//         message: 'Success',
//         description: 'Configurations created successfully',
//       });
//     },

//     onError: (error: any) => {
//       notification.error({
//         message: 'Error',
//         description: error.message || 'Failed to create configurations',
//       });
//     },
//   });
// };

// /**
//  * Update reimbursement configuration
//  */
// export const useUpdateReimbursementConfig = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async ({
//       id,
//       data,
//     }: {
//       id: string;
//       data: CreateReimbursementPolicyData;
//     }) => {
//       return await ReimbursementService.updateConfig(id, data);
//     },

//     onSuccess: (data, variables) => {
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
//       queryClient.invalidateQueries({
//         queryKey: QUERY_KEYS.single(variables.id),
//       });
      
//       if (data) {
//         queryClient.invalidateQueries({ 
//           queryKey: QUERY_KEYS.byOrigin(data.origin, data.subOriginId) 
//         });
//       }

//       notification.success({
//         message: 'Success',
//         description: 'Configuration updated successfully',
//       });
//     },

//     onError: (error: any) => {
//       notification.error({
//         message: 'Error',
//         description: error.message || 'Failed to update configuration',
//       });
//     },
//   });
// };

// /**
//  * Delete reimbursement configuration
//  */
// export const useDeleteReimbursementConfig = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (id: string) => {
//       return await ReimbursementService.deleteConfig(id);
//     },

//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });

//       notification.success({
//         message: 'Success',
//         description: 'Configuration deleted successfully',
//       });
//     },

//     onError: (error: any) => {
//       notification.error({
//         message: 'Error',
//         description: error.message || 'Failed to delete configuration',
//       });
//     },
//   });
// };

// /* ======================================================
//    WRAPPER HOOK
// ====================================================== */

// export const useReimbursementConfigData = (id?: string) => {
//   const configsQuery = useReimbursementConfigs();
//   const configQuery = useReimbursementConfigById(id);

//   return {
//     configs: configsQuery.data,
//     config: configQuery.data,
//     isLoading: configsQuery.isLoading || configQuery.isLoading,
//     isError: configsQuery.isError || configQuery.isError,
//     refetch: configsQuery.refetch,
//   };
// };












import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ReimbursementConfigurationService } from "@/services/reimbursementConfig";
import {
  CreateReimbursementConfigurationData,
  UpdateReimbursementConfigurationData,
} from "@/services/reimbursementConfig";


/* ==================== QUERIES ==================== */

/** Get all */
// export const useReimbursementConfigurations = () => {
//   return useQuery({
//     queryKey: ["reimbursement-configurations"],
//     queryFn: () =>
//       ReimbursementConfigurationService.getConfigurations(),
//     staleTime: 2 * 60 * 1000,
//     gcTime: 5 * 60 * 1000,
//   });
// };
export const useReimbursementConfigurations = () => {
  return useQuery({
    queryKey: ['reimbursement-configurations'],
    queryFn: async () => {
      const data = await ReimbursementConfigurationService.getConfigurations();
      console.log('Hook received data:', data); // Debug log
      return data;
    },
  });
  
};

/** Get by ID */
export const useReimbursementConfigurationById = (id?: string) => {
  return useQuery({
    queryKey: ["reimbursement-configuration", id],
    queryFn: () =>
      ReimbursementConfigurationService.getConfigurationById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

/* ==================== MUTATIONS ==================== */

/** Create */
export const useCreateReimbursementConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReimbursementConfigurationData) =>
      ReimbursementConfigurationService.createConfiguration(data),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reimbursement-configurations"],
      });
    },
  });
};

/** Update */
export const useUpdateReimbursementConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReimbursementConfigurationData;
    }) =>
      ReimbursementConfigurationService.updateConfiguration(id, data),

    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["reimbursement-configurations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["reimbursement-configuration", id],
      });
    },
  });
};

/** Delete */
export const useDeleteReimbursementConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      ReimbursementConfigurationService.deleteConfiguration(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reimbursement-configurations"],
      });
    },
  });
};

/* ==================== WRAPPER ==================== */

export const useReimbursementConfigurationData = (id?: string) => {
  const configuration = useReimbursementConfigurationById(id);

  return {
    configuration,
    isLoading: configuration.isLoading,
    isError: configuration.isError,
  };
};



