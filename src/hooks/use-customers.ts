import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import {
  CustomersService,
  Customer,
  CreateCustomerData,
  UpdateCustomerData,
  CustomersFilters,
  CustomerSelectOption,
} from "@/services/customersService";
import { PaginatedResponse } from "@/lib/axios";

/* =======================
   Query Keys
======================= */

export const customerKeys = {
  all: ["customers"] as const,

  lists: () => [...customerKeys.all, "list"] as const,
  list: (filters: CustomersFilters) =>
    [...customerKeys.lists(), filters] as const,

  details: () => [...customerKeys.all, "detail"] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,

  select: () => [...customerKeys.all, "select"] as const,
};

/* =======================
   Queries
======================= */

/**
 * Get customers (paginated list)
 */
export const useCustomers = (filters: CustomersFilters = {}) => {
  return useQuery<PaginatedResponse<Customer>>({
    queryKey: customerKeys.list(filters),
    queryFn: () => CustomersService.getCustomers(filters),
    staleTime: 5 * 60 * 1000,

    // ✅ v5 replacement for keepPreviousData
    placeholderData: (previousData) => previousData,
  });
};


/**
 * Get single customer
 */
export const useCustomer = (id: string, enabled = true) => {
  return useQuery<Customer>({
    queryKey: customerKeys.detail(id),
    queryFn: () => CustomersService.getCustomer(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Customers for Select / Dropdown
 */
export const useCustomerSelect = () => {
  return useQuery<CustomerSelectOption[]>({
    queryKey: customerKeys.select(),
    queryFn: () => CustomersService.getCustomersForSelect(),
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * OPTIONAL: derive select from full list using `select`
 * (Use this if you don’t want `/customers/select` API)
 */
export const useCustomerSelectFromList = () => {
  return useQuery({
    queryKey: customerKeys.list({ page: 1, limit: 1000 }),
    queryFn: () => CustomersService.getCustomers({ page: 1, limit: 1000 }),
    staleTime: 10 * 60 * 1000,
    select: (data: PaginatedResponse<Customer>): CustomerSelectOption[] =>
      data.data.map((c) => ({
        value: c.id,
        label: c.companyName,
        email: c.email ?? null,
      })),
  });
};


/* =======================
   Mutations
======================= */

/**
 * Create customer
 */
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerData) =>
      CustomersService.createCustomer(data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.select() });
      message.success("Customer created successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};

/**
 * Update customer
 */
// export const useUpdateCustomer = () => {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({
//       id,
//       data,
//     }: {
//       id: string;
//       data: UpdateCustomerData;
//     }) => CustomersService.updateCustomer(id, data),

//     onSuccess: (updatedCustomer) => {
//       queryClient.setQueryData(
//         customerKeys.detail(updatedCustomer.id),
//         updatedCustomer
//       );

//       queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: customerKeys.select() });

//       message.success("Customer updated successfully");
//     },

//     onError: (error: Error) => {
//       message.error(error.message);
//     },
//   });
// };


/**
 * Update customer with optimistic cache update
 */
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCustomerData;
    }) => CustomersService.updateCustomer(id, data),

    // Optimistic update
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: customerKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: customerKeys.lists() });
      await queryClient.cancelQueries({ queryKey: customerKeys.select() });

      const previousCustomer = queryClient.getQueryData<Customer>(customerKeys.detail(id));

      // Update the detail cache immediately
      queryClient.setQueryData<Customer>(customerKeys.detail(id), (old) => ({
        ...old!,
        ...data,
      }));

      // Optionally update list cache for immediate UI feedback
      queryClient.setQueryData<any>(customerKeys.lists(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((c: Customer) =>
            c.id === id ? { ...c, ...data } : c
          ),
        };
      });

      return { previousCustomer };
    },

    onError: (err, variables, context) => {
      // Rollback if mutation fails
      if (context?.previousCustomer) {
        queryClient.setQueryData(customerKeys.detail(variables.id), context.previousCustomer);
        queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
        queryClient.invalidateQueries({ queryKey: customerKeys.select() });
      }
      message.error((err as Error).message);
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.select() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
    },

    onSuccess: () => {
      message.success("Customer updated successfully");
    },
  });
};

/**
 * Delete customer
 */
export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CustomersService.deleteCustomer(id),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.select() });
      message.success("Customer deleted successfully");
    },

    onError: (error: Error) => {
      message.error(error.message);
    },
  });
};
