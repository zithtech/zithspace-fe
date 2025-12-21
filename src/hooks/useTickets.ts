import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import TicketService, { 
  Ticket, 
  TicketFormData, 
  TicketListResponse 
} from "@/services/ticketService";
import { message } from "antd";

// Query Keys
export const ticketKeys = {
  all: ["tickets"] as const,
  lists: () => [...ticketKeys.all, "list"] as const,
  list: (params: any) => [...ticketKeys.lists(), params] as const,
  details: () => [...ticketKeys.all, "detail"] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
  my: (params: any) => [...ticketKeys.all, "my", params] as const,
};

// --- Queries ---

export const useTickets = (params: any) => {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: () => TicketService.getTickets(params),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new page
  });
};

export const useTicket = (id: string) => {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => TicketService.getTicketById(id),
    enabled: !!id,
  });
};

// --- Mutations ---

export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TicketFormData) => TicketService.createTicket(data),
    onMutate: async (newTicketData) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: ticketKeys.all });
  
        // Snapshot the previous value
        const previousTickets = queryClient.getQueryData<TicketListResponse>(ticketKeys.lists());
  
        // Create an optimistic ticket object
        const tempId = `temp-${Date.now()}`;
        const optimisticTicket: Ticket = {
            id: tempId,
            ticketNumber: "T-" + Math.floor(Math.random() * 1000), // temp number
            title: newTicketData.title,
            description: newTicketData.description || "",
            platform: newTicketData.platform || "",
            // Use provided project string as ID for optimistic update
            project: { id: newTicketData.project, name: "Loading...", code: "..." }, 
            priority: newTicketData.priority || "MEDIUM",
            taskLevel: newTicketData.taskLevel || "",
            type: newTicketData.type || "TASK",
            status: newTicketData.status || "NOT_STARTED",
            assignee: { id: newTicketData.assignee || "", name: "...", email: "" },
            reportTo: "",
            createdBy: { id: "current-user", name: "Me", email: "" }, // Placeholder
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
  
        // Optimistically update to the new value
        // We use setQueriesData to update ALL valid list queries (fuzzy match)
        queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
            if (!oldData) return { data: [optimisticTicket], pagination: {} }; // Initialize if empty
            if (!oldData.data) return oldData;
            return {
                ...oldData,
                data: [optimisticTicket, ...oldData.data],
            };
        });
  
        // Return a context object with the snapshotted value
        return { previousTickets };
      },
      onError: (err, newTodo, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousTickets) {
             queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, context.previousTickets);
        }
      },
    onSuccess: (savedTicket, variables, context) => {
        // Replace the optimistic ticket with the real one
        queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
            if (!oldData?.data) return oldData;
             return {
                ...oldData,
                data: oldData.data.map((ticket: Ticket) => 
                     ticket.id.startsWith('temp-') && ticket.title === savedTicket.title 
                        ? savedTicket 
                        : ticket
                ),
            };
        });
      // Invalidate list to ensure consistency and trigger refetch
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TicketFormData> }) =>
      TicketService.updateTicket(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });

      // Snapshot the previous value
      const previousTickets = queryClient.getQueryData<TicketListResponse>(ticketKeys.lists());
      const previousTicket = queryClient.getQueryData<Ticket>(ticketKeys.detail(id));

      // Optimistically update to the new value
      if (previousTickets) {
        // Iterate over all ticket lists in cache
        queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
            if (!oldData?.data) return oldData;
            return {
                ...oldData,
                data: oldData.data.map((ticket: Ticket) => 
                    ticket.id === id ? { ...ticket, ...data } : ticket
                ),
            };
        });
      }

       // Update detail view if exists
       if (previousTicket) {
        queryClient.setQueryData(ticketKeys.detail(id), (old: any) => ({ ...old, ...data }));
      }

      // Return a context object with the snapshotted value
      return { previousTickets, previousTicket };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTicket) {
          queryClient.setQueryData(ticketKeys.detail(newTodo.id), context.previousTicket);
      }
      // Reverting lists is harder without exact keys, but invalidation handles it mostly
      // For now we just invalidate on error
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TicketService.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};
