import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InvoiceService, {
  Invoice,
  CreateInvoiceData,
  UpdateInvoiceData,
  InvoiceStatus,
  InvoiceListParams,
} from "@/services/invoiceService";
import { message } from "antd";

/**
 * React Query Hooks for Invoice Management
 *
 * Includes optimistic updates, pagination support,
 * and automatic cache invalidation
 */

// ==================== Query Keys ====================

export const invoiceKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoiceKeys.all, "list"] as const,
  list: (params?: InvoiceListParams) =>
    [...invoiceKeys.lists(), params ?? {}] as const,
  details: () => [...invoiceKeys.all, "detail"] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
  nextNumber: () => [...invoiceKeys.all, "next-number"] as const,
};

// ==================== Queries ====================

/**
 * Fetch invoices with filters & pagination
 */
export const useInvoices = (
  params?: InvoiceListParams,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => InvoiceService.getInvoices(params),
    staleTime: 2 * 60 * 1000,
    enabled,
    placeholderData: (previousData) => previousData,
  });
};


/**
 * Fetch single invoice
 */
export const useInvoice = (invoiceId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: invoiceKeys.detail(invoiceId),
    queryFn: () => InvoiceService.getInvoiceById(invoiceId),
    staleTime: 5 * 60 * 1000,
    enabled: enabled && !!invoiceId,
  });
};

/**
 * Get next invoice number (pre-fill)
 */
export const useNextInvoiceNumber = (enabled: boolean = true) => {
  return useQuery({
    queryKey: invoiceKeys.nextNumber(),
    queryFn: InvoiceService.getNextInvoiceNumber,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
};

// ==================== Mutations ====================

/**
 * Create Invoice
 * Optimistic insert into invoice list
 */
export const useCreateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceData) =>
      InvoiceService.createInvoice(data),

    onMutate: async (newInvoice) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.lists() });

      const previousLists = queryClient.getQueriesData({
        queryKey: invoiceKeys.lists(),
      });

      const tempId = `temp-${Date.now()}`;

      const optimisticInvoice: Partial<Invoice> = {
        id: tempId,
        invoiceNumber: "Generating…",
        status: "DRAFT",
        currency: newInvoice.currency,
        invoiceDate: newInvoice.invoiceDate,
        dueDate: newInvoice.dueDate,
        subtotal: 0,
        taxTotal: 0,
        total: 0,
        balanceDue: 0,
        items: newInvoice.items,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      previousLists.forEach(([queryKey, oldData]: [any, any]) => {
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: [optimisticInvoice, ...old.data],
          };
        });
      });

      return { previousLists };
    },

    onError: (_err, _variables, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error("Failed to create invoice");
    },

    onSuccess: (savedInvoice) => {
      queryClient.setQueriesData(
        { queryKey: invoiceKeys.lists() },
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((inv: Invoice) =>
              inv.id?.startsWith("temp-") ? savedInvoice : inv
            ),
          };
        }
      );

      message.success("Invoice created successfully");
    },
  });
};

/**
 * Update Invoice
 * Optimistic update for list & detail
 */
export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceData }) =>
      InvoiceService.updateInvoice(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.all });

      const previousLists = queryClient.getQueriesData({
        queryKey: invoiceKeys.lists(),
      });
      const previousDetail = queryClient.getQueryData<Invoice>(
        invoiceKeys.detail(id)
      );

      queryClient.setQueriesData(
        { queryKey: invoiceKeys.lists() },
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.map((inv: Invoice) =>
              inv.id === id
                ? { ...inv, ...data, updatedAt: new Date().toISOString() }
                : inv
            ),
          };
        }
      );

      if (previousDetail) {
        queryClient.setQueryData(invoiceKeys.detail(id), {
          ...previousDetail,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousLists, previousDetail };
    },

    onError: (_err, variables, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(
          invoiceKeys.detail(variables.id),
          context.previousDetail
        );
      }
      message.error("Failed to update invoice");
    },

    onSuccess: (savedInvoice) => {
      queryClient.setQueryData(
        invoiceKeys.detail(savedInvoice.id),
        savedInvoice
      );
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      message.success("Invoice updated successfully");
    },
  });
};

/**
 * Update Invoice Status
 */
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      InvoiceService.updateInvoiceStatus(id, status),

    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(
        invoiceKeys.detail(updatedInvoice.id),
        updatedInvoice
      );
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      message.success("Invoice status updated");
    },

    onError: () => {
      message.error("Failed to update invoice status");
    },
  });
};

/**
 * Delete Invoice
 * Optimistic removal
 */
export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => InvoiceService.deleteInvoice(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.lists() });

      const previousLists = queryClient.getQueriesData({
        queryKey: invoiceKeys.lists(),
      });

      queryClient.setQueriesData(
        { queryKey: invoiceKeys.lists() },
        (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((inv: Invoice) => inv.id !== id),
          };
        }
      );

      return { previousLists };
    },

    onError: (_err, _id, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      message.error("Failed to delete invoice");
    },

    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(id) });
      message.success("Invoice deleted successfully");
    },
  });
};
