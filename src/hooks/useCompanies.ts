import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { CompanyService } from "@/services/companyService";
import type {
  Company,
  CreateCompanyData,
  UpdateCompanyData,
  CompanyFilters,
  PaginatedCompanyResponse,
} from "@/types/company";

/* =======================
   Query Keys
======================= */

export const companyKeys = {
  all: ["companies"] as const,

  lists: () => [...companyKeys.all, "list"] as const,
  list: (filters: CompanyFilters) =>
    [...companyKeys.lists(), filters] as const,

  details: () => [...companyKeys.all, "detail"] as const,
  detail: (id: number) => [...companyKeys.details(), id] as const,

  active: () => [...companyKeys.all, "active"] as const,
};

/* =======================
   Queries
======================= */

/**
 * Get all companies (paginated)
 */
export const useCompanies = (filters: CompanyFilters = {}) => {
  return useQuery<PaginatedCompanyResponse>({
    queryKey: companyKeys.list(filters),
    queryFn: () => CompanyService.getAll(filters),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
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


//other page use 

export const useAllCompanies = () => {
  return useQuery<Company[]>({
    queryKey: ["companies", "all"], // unique key
    queryFn: async () => {
      const response = await CompanyService.getAll({ limit: 1000 }); // fetch all
      return response.data; // only return the array of companies
    },
    staleTime: 5 * 60 * 1000, // cache for 5 min
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

/* =======================
   Mutations
======================= */

/**
 * Create company
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCompanyData) =>
      CompanyService.create(data),

    onSuccess: (newCompany) => {
      queryClient.invalidateQueries({
        queryKey: companyKeys.lists(),
      });

      queryClient.setQueryData(
        companyKeys.detail(newCompany.id),
        newCompany
      );

      message.success("Company created successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to create company");
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
      queryClient.setQueryData(
        companyKeys.detail(updatedCompany.id),
        updatedCompany
      );

     
     
      queryClient.invalidateQueries({
        queryKey: companyKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: companyKeys.active(),
      });

      message.success("Company updated successfully");
    },

    onError: (error: Error) => {
      message.error(error.message || "Failed to update company");
    },
  });
};

/**
 * Toggle company active status
 * (Allows multiple active companies)
 */
export const useToggleActiveCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      CompanyService.toggleActive(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: companyKeys.lists(),
      });

      const previousLists = queryClient.getQueriesData<PaginatedCompanyResponse>({
        queryKey: companyKeys.lists(),
      });

      queryClient.setQueriesData<PaginatedCompanyResponse>(
        { queryKey: companyKeys.lists() },
        (old) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.map((company) =>
              company.id === id
                ? { ...company, isActive: !company.isActive }
                : company
            ),
          };
        }
      );

      return { previousLists };
    },

    onError: (error: Error, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      message.error(error.message || "Failed to update company status");
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: companyKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: companyKeys.active(),
      });
    },

    onSuccess: (updatedCompany) => {
      message.success(
        updatedCompany.isActive
          ? "Company activated successfully"
          : "Company deactivated successfully"
      );
    },
  });
};

/**
 * Delete company
 */
export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      CompanyService.delete(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: companyKeys.lists(),
      });

      const previousLists =
        queryClient.getQueriesData<PaginatedCompanyResponse>({
          queryKey: companyKeys.lists(),
        });

      queryClient.setQueriesData<PaginatedCompanyResponse>(
        { queryKey: companyKeys.lists() },
        (old) => {
          if (!old?.data) return old;

          return {
            ...old,
            data: old.data.filter(
              (company) => company.id !== id
            ),
            pagination: {
              ...old.pagination,
              total: old.pagination.total - 1,
              totalPages: Math.ceil(
                (old.pagination.total - 1) /
                  old.pagination.pageSize
              ),
            },
          };
        }
      );

      queryClient.removeQueries({
        queryKey: companyKeys.detail(id),
      });

      return { previousLists };
    },

    onError: (error: Error, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      message.error(error.message || "Failed to delete company");
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: companyKeys.lists(),
      });

      queryClient.invalidateQueries({
        queryKey: companyKeys.active(),
      });
    },

    onSuccess: () => {
      message.success("Company deleted successfully");
    },
  });
};
