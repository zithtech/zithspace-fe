// @/hooks/useInvoiceSettings.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  InvoiceSettingsService, 
  SettingsListParams, 
  CreateSettingsData, 
  UpdateSettingsData,
  SettingsProfile
} from "@/services/invoiceSettingsService";
import { message} from "antd"; // Replace with your toast library (antd, hot-toast, etc.)

// ==================== Query Keys ====================

export const settingsKeys = {
  all: ["invoice-settings"] as const,
  lists: () => [...settingsKeys.all, "list"] as const,
  list: (filters: SettingsListParams) => [...settingsKeys.lists(), filters] as const,
  details: () => [...settingsKeys.all, "detail"] as const,
  detail: (id: string) => [...settingsKeys.details(), id] as const,
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
      message.success("Settings profile created successfully");
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSettingsData }) =>
      InvoiceSettingsService.updateProfile(id, data),
    onSuccess: (updatedProfile) => {
      // Update both the list and the specific detail view
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() });
      queryClient.setQueryData(settingsKeys.detail(updatedProfile.id), updatedProfile);
      message.success("Settings updated successfully");
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
export const useActivateSettingsProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => InvoiceSettingsService.activateProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all });
      message.success("Profile activated");
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to activate profile");
    },
  });
};






export const useDeleteSettingsProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 1. Ensure this service call matches the Hard Delete route
    mutationFn: (id: string) => InvoiceSettingsService.deleteProfile(id), 

    onSuccess: () => {
      // 2. Invalidate everything under "invoice-settings" to be safe
      queryClient.invalidateQueries({
        queryKey: settingsKeys.all,
      });
      message.success("Profile deleted permanently");
    },
    onError: (error: any) => {
      console.error("Delete Hook Error:", error);
      message.error(error.response?.data?.error || "Failed to delete profile");
    },
  });
};