import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import InvoiceService, {
  Invoice,
  CreateInvoiceData,
  UpdateInvoiceData,
  InvoiceStatus,
  InvoiceListParams,
} from "@/services/invoiceService";
import type { 
  PaymentTransaction, 
  PaymentHistoryData,
  PaymentStatus,
  PaymentMethod 
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

  payments: (invoiceId: string) =>
    [...invoiceKeys.detail(invoiceId), "payments"] as const,
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
// export const useNextInvoiceNumber = (enabled: boolean = true) => {
//   return useQuery({
//     queryKey: invoiceKeys.nextNumber(),
//     queryFn: InvoiceService.getNextInvoiceNumber,
//     staleTime: 5 * 60 * 1000,
//     enabled,
//   });
// };

// ==================== Mutations ====================

export const useNextInvoiceNumber = (enabled: boolean = true, profileId?: string) => {
  return useQuery({
    queryKey: [...invoiceKeys.nextNumber(), profileId], // Add profileId to queryKey
    queryFn: () => InvoiceService.getNextInvoiceNumber(profileId),
    staleTime: 0, // Always fetch fresh when profile changes
    enabled: enabled && !!profileId, // Only enable when profileId exists
  });
};





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

  type StatusPayload = {
    id: string;
    status: InvoiceStatus;
    // For payment statuses (PAID, PARTIALLY_PAID)
    payment?: {
      amount: number;
      method: string;
      description?: string;
      date?: string;
    };
    // For other statuses (like APPROVED, etc.)
    description?: string;
    // Legacy fields for backward compatibility
    paidAmount?: number;
    paidAt?: string | Date;
  };

  return useMutation({
    mutationFn: async (payload: StatusPayload) => {
      // Prepare data for API
      const apiData: any = { 
        status: payload.status === 'APPROVED' ? 'APPROVAL' : payload.status 
      };

      // For payment statuses
      if (payload.status === 'PAID' || payload.status === 'PARTIALLY_PAID') {
        if (payload.payment) {
          apiData.payment = payload.payment;
        } else if (payload.paidAmount !== undefined) {
          // Handle legacy format
          apiData.payment = {
            amount: payload.paidAmount,
            method: 'BANK_TRANSFER', // default
            description: payload.description || '',
            date: payload.paidAt ? 
              (typeof payload.paidAt === 'string' ? payload.paidAt : payload.paidAt.toISOString()) 
              : new Date().toISOString()
          };
        }
      } 
      // For other statuses with description
      else if (payload.description) {
        apiData.description = payload.description;
      }

      return InvoiceService.updateInvoiceStatus(payload.id, apiData);
    },

    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: invoiceKeys.all });
      
      // Optimistically update cache
      const previousInvoice = queryClient.getQueryData<Invoice>(invoiceKeys.detail(payload.id));
      
      if (previousInvoice) {
        const updatedInvoice = {
          ...previousInvoice,
          status: payload.status,
          updatedAt: new Date().toISOString()
        };
        
        // Update payment amounts for PAID/PARTIALLY_PAID
        if (payload.status === 'PAID' || payload.status === 'PARTIALLY_PAID') {
          const paymentAmount = payload.payment?.amount || payload.paidAmount || 0;
          updatedInvoice.paidAmount = (previousInvoice.paidAmount || 0) + paymentAmount;
          updatedInvoice.balanceDue = Math.max(0, previousInvoice.balanceDue - paymentAmount);
        }
        
        queryClient.setQueryData(invoiceKeys.detail(payload.id), updatedInvoice);
      }
      
      return { previousInvoice };
    },

    onSuccess: (updatedInvoice) => {
      queryClient.setQueryData(invoiceKeys.detail(updatedInvoice.id), updatedInvoice);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      message.success("Invoice status updated");
    },

    onError: (error, payload, context) => {
      // Revert optimistic update on error
      if (context?.previousInvoice) {
        queryClient.setQueryData(invoiceKeys.detail(payload.id), context.previousInvoice);
      }
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

/**
 * Hook for Downloading/Generating Invoice PDF
 */



export const useDownloadInvoice = () => {
  return useMutation({
    mutationFn: (id: string) => InvoiceService.downloadInvoice(id),
    onError: (error: any) => {
      message.error(error.message || "Failed to download invoice");
    },
  });
};



/**
 * Send Invoice Email
 */
export const useSendInvoiceEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      InvoiceService.sendInvoiceEmail(id, data),

    onSuccess: (_data, variables) => {
      // 1. Invalidate queries to show the "SENT" status in the UI
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });

      message.success("Email sent successfully");
    },

    onError: (error: any) => {
      message.error(error.message || "Failed to send email");
    },
  });
};










      



// export const useInvoicePaymentHistory = (
//   invoiceId?: string,
//   enabled: boolean = true
// ) => {
//   const queryClient = useQueryClient();

//   const query = useQuery({
//     queryKey: ["invoicePayments", invoiceId],
//     queryFn: async () => {
//       // Don't throw - return empty data instead
//       if (!invoiceId) {
//         console.log('No invoice ID provided, returning empty payment history');
//         return {
//           transactions: [],
//           totalAmount: 0,
//           totalPaid: 0,
//           balance: 0
//         };
//       }
      
//       try {
//         // 1. Fetch the raw data from API
//         const rawData = await InvoiceService.getPaymentHistory(invoiceId);
//         console.log('Raw payment history data:', rawData);
        
//         // 2. Check what format we got
//         // If it's already in the correct format, return it
//         if (rawData && typeof rawData === 'object' && 'transactions' in rawData) {
//           console.log('Data is already in correct format');
//           return rawData;
//         }
        
//         // 3. If it's an array, transform it
//         if (Array.isArray(rawData)) {
//           console.log('Data is array, transforming...');
          
//           const totalPaid = rawData.reduce((sum: number, transaction: any) => {
//             return sum + (Number(transaction.amount) || 0);
//           }, 0);
          
//           return {
//             transactions: rawData,
//             totalAmount: 0,
//             totalPaid: totalPaid,
//             balance: 0
//           };
//         }
        
//         // 4. Default fallback
//         return {
//           transactions: [],
//           totalAmount: 0,
//           totalPaid: 0,
//           balance: 0
//         };
//       } catch (error) {
//         console.error('Error fetching payment history:', error);
//         // Return empty data on error instead of throwing
//         return {
//           transactions: [],
//           totalAmount: 0,
//           totalPaid: 0,
//           balance: 0
//         };
//       }
//     },
//     enabled: enabled && !!invoiceId,
//     staleTime: 2 * 60 * 1000,
//     retry: 1, // Limit retries
//     retryDelay: 1000,
//   });

//   const refetch = () => {
//     if (invoiceId) {
//       queryClient.invalidateQueries({
//         queryKey: ["invoicePayments", invoiceId],
//       });
//     }
//   };

//   return { ...query, refetch };
// };


export const useInvoicePaymentHistory = (
  invoiceId?: string,
  enabled: boolean = true
) => {
  const queryClient = useQueryClient();

  const query = useQuery<PaymentHistoryData | null>({
    queryKey: invoiceId ? invoiceKeys.payments(invoiceId) : ["invoicePayments", "empty"],
    queryFn: async (): Promise<PaymentHistoryData | null> => {
      if (!invoiceId) {
        return null;
      }
      
      try {
        const response = await InvoiceService.getPaymentHistory(invoiceId);
        console.log('Payment history API response:', response);
        
        // Extract data from response structure
        if (response?.success) {
          // If response has data property
          if (response.data) {
            console.log('Using response.data:', response.data);
            return response.data as PaymentHistoryData;
          }
          // If response is the data itself
          else if (response.payments) {
            console.log('Using response directly:', response);
            return response as PaymentHistoryData;
          }
        }
        
        // If response doesn't have success property but has data
        if (response?.data) {
          console.log('Using response.data (no success):', response.data);
          return response.data as PaymentHistoryData;
        }
        
        console.log('No valid data found in response');
        return null;
      } catch (error) {
        console.error('Error fetching payment history:', error);
        return null;
      }
    },
    enabled: enabled && !!invoiceId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const refetch = () => {
    if (invoiceId) {
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.payments(invoiceId),
      });
    }
  };

  return { ...query, refetch };
};





