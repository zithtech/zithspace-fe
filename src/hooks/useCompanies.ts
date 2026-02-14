
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { CompanyService } from "@/services/companyService";
import type {
  Company,
  CreateCompanyData,
  UpdateCompanyData,
  CompanyFilters,
  PaginatedCompanyResponse
} from "@/types/company";


export const companyKeys = {
  all: ["companies"] as const,
  lists: () => [...companyKeys.all, "list"] as const,
  list: (filters: CompanyFilters) => [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, "detail"] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,
  active: () => [...companyKeys.all, "active"] as const,
};

/**
 * Get all companies with pagination and filters
 */
export const useCompanies = (filters: CompanyFilters = {}) => {
  return useQuery<PaginatedCompanyResponse>({
    queryKey: companyKeys.list(filters),
    queryFn: () => CompanyService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData,
  });
};

/**
 * Get company by ID
 */
export const useCompany = (id: number | null, enabled = true) => {
  return useQuery<Company>({
    queryKey: companyKeys.detail(id!),
    queryFn: () => CompanyService.getById(id!),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Get active company
 */
export const useActiveCompany = () => {
  return useQuery<Company | null>({
    queryKey: companyKeys.active(),
    queryFn: () => CompanyService.getActive(),
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Create company
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyData) => CompanyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.active() });
      message.success("Company created successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};

/**
 * Update company
 */
export const useUpdateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCompanyData }) =>
      CompanyService.update(id, data),
    onSuccess: (updatedCompany) => {
      // Update detail cache
      queryClient.setQueryData(companyKeys.detail(updatedCompany.id), updatedCompany);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.active() });
      
      message.success("Company updated successfully");
    },
    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};

/**
 * Set company as active
 */
export const useSetActiveCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => CompanyService.setActive(id),
    onMutate: async (id: number) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: companyKeys.lists() });
      await queryClient.cancelQueries({ queryKey: companyKeys.active() });

      // Snapshot previous values
      const previousCompanies = queryClient.getQueryData(companyKeys.lists());
      const previousActive = queryClient.getQueryData(companyKeys.active());

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: companyKeys.lists() },
        (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((company: Company) => ({
              ...company,
              isActive: company.id === id,
            })),
          };
        }
      );

      // Set new active company
      const companiesData = queryClient.getQueryData<PaginatedCompanyResponse>(companyKeys.list({}));
      const newActive = companiesData?.data.find(c => c.id === id) || null;
      queryClient.setQueryData(companyKeys.active(), newActive);

      return { previousCompanies, previousActive };
    },
    onError: (error: Error, id, context) => {
      // Revert on error
      if (context?.previousCompanies) {
        queryClient.setQueryData(companyKeys.lists(), context.previousCompanies);
      }
      if (context?.previousActive) {
        queryClient.setQueryData(companyKeys.active(), context.previousActive);
      }
      message.error(error.message);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.active() });
    },
    onSuccess: () => {
      message.success("Company set as active");
    },
  });
};


/**
 * Delete company
 */
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => CompanyService.delete(id),

    onSuccess: () => {
      // company list refresh
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      queryClient.invalidateQueries({ queryKey: companyKeys.active() });

      message.success("Company deleted successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};
