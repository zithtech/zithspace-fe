// @/hooks/useInvoiceSettings.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  InvoiceSettingsService, 
  SettingsListParams, 
  CreateSettingsData, 
  UpdateSettingsData,
  SettingsProfile
} from "@/services/invoiceSettingsService";
import { App } from "antd"; // Replace with your toast library (antd, hot-toast, etc.)

// ==================== Query Keys ====================

export const settingsKeys = {
  all: ["invoice-settings"] as const,
  lists: () => [...settingsKeys.all, "list"] as const,
  list: (filters: SettingsListParams) => [...settingsKeys.lists(), filters] as const,
  details: () => [...settingsKeys.all, "detail"] as const,
  detail: (id: string) => [...settingsKeys.details(), id] as const,
  active: () => [...settingsKeys.all, 'active'] as const,
};

// ==================== Queries ====================

/**
 * Hook to fetch all settings profiles (paginated/filtered)
 */
export const useSettingsProfiles = (filters: SettingsListParams = {}) => {
  return useQuery({
    queryKey: settingsKeys.list(filters),
    queryFn: () => InvoiceSettingsService.getProfiles(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single settings profile
 */
export const useSettingsProfile = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: settingsKeys.detail(id),
    queryFn: () => InvoiceSettingsService.getProfile(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

// ==================== Mutations ====================

/**
 * Hook to create a new settings profile
 */
export const useCreateSettingsProfile = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

 return useMutation({
    mutationFn: (data: CreateSettingsData) => {
      // --- ADD DEFAULT HERE ---
      const payloadWithTenant = {
        ...data,
      };
      
      return InvoiceSettingsService.createProfile(payloadWithTenant);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() });
      message.success({content:"Settings profile created successfully",duration:5});
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create profile");
    },
  });

};

/**
 * Hook to update an existing settings profile
 */
export const useUpdateSettingsProfile = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSettingsData }) =>
      InvoiceSettingsService.updateProfile(id, data),
    onSuccess: (updatedProfile) => {
      // Update both the list and the specific detail view
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() });
      queryClient.setQueryData(settingsKeys.detail(updatedProfile.id), updatedProfile);
      message.success({content:"Settings updated successfully",duration:5});
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update profile");
    },
  });
};

/**
 * Hook to activate a profile
 * Note: Invalidates the entire 'all' key because activating one 
 * profile deactivates others in the backend.
 */



// export const useActivateSettingsProfile = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     // Receive an object containing id and the new boolean state
//     mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
//       InvoiceSettingsService.activateProfile(id, isActive),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: settingsKeys.all });
//     },
//     onError: (error: Error) => {
//       message.error(error.message || "Failed to update profile");
//     },
//   });
// };


export const useActivateSettingsProfile = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      InvoiceSettingsService.activateProfile(id, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      message.success({content :variables.isActive ? "Profile activated" : "Profile deactivated",duration:5});
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || error.message || "Failed to update profile status");
    },
  });
};



export const useActiveSettingsProfiles = () => {
  return useQuery({
    // Add the parentheses here to execute the function!
    queryKey: settingsKeys.active(), 
    queryFn: () => InvoiceSettingsService.getActiveProfiles(),
  });
};



export const useDeleteSettingsProfile = () => {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  return useMutation({
    // 1. Ensure this service call matches the Hard Delete route
    mutationFn: (id: string) => InvoiceSettingsService.deleteProfile(id), 

    onSuccess: () => {
      // 2. Invalidate everything under "invoice-settings" to be safe
      queryClient.invalidateQueries({
        queryKey: settingsKeys.all,
      });
      message.success({
        content: "Profile deleted permanently",
      duration:5});
    },
    onError: (error: any) => {
      console.error("Delete Hook Error:", error);
      message.error(error.response?.data?.error || "Failed to delete profile");
    },
  });
};