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
  kanban: (params: any) => [...ticketKeys.all, "kanban", params] as const,
};

// --- Queries ---

export const useKanbanTickets = (params: any, options?: any) => {
  return useQuery({
    queryKey: ticketKeys.kanban(params),
    queryFn: () => TicketService.getKanbanTickets(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!params, // Only fetch when params are ready
    ...options, // Spread additional options for dual query strategy
  });
};

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
  
        // Snapshot the previous value (handle all variations of lists)
        const previousTicketLists = queryClient.getQueriesData({ queryKey: ticketKeys.lists() });
  
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
            type: newTicketData.type || "Task",
            status: newTicketData.status || "not_started",
            assignee: { id: newTicketData.assignee || "", name: "...", email: "" },
            reportTo: "",
            createdBy: { id: "current-user", name: "Me", email: "" }, // Placeholder
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            storyPoint: 0, 
        };
  
        // Optimistically update to the new value
        queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
            if (!oldData) return { data: [optimisticTicket], pagination: {} }; 
            if (!oldData.data) return oldData;
            return {
                ...oldData,
                data: [optimisticTicket, ...oldData.data],
            };
        });
  
        // Return a context object with the snapshotted value
        return { previousTicketLists };
      },
      onError: (err, newTodo, context) => {
        // Rollback
        if (context?.previousTicketLists) {
             context.previousTicketLists.forEach(([queryKey, data]) => {
                  queryClient.setQueryData(queryKey, data);
             });
        }
        message.error("Failed to create ticket");
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
      // queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TicketFormData>; optimisticData?: any }) =>
      TicketService.updateTicket(id, data),
    onMutate: async ({ id, data, optimisticData }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });

      // Snapshot the previous values (lists, kanban, detail)
      const previousTicketLists = queryClient.getQueriesData({ queryKey: ticketKeys.lists() });
      const previousKanbanData = queryClient.getQueriesData({ queryKey: ['tickets', 'kanban'] });
      const previousTicket = queryClient.getQueryData<Ticket>(ticketKeys.detail(id));

      // Determine what data to put in the cache (prefer optimisticData for complex objects like assignee)
      const cacheUpdatePayload = optimisticData || data;

      // Optimistically update all lists
      queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
            if (!oldData?.data) return oldData;
            return {
                ...oldData,
                data: oldData.data.map((ticket: Ticket) => 
                    ticket.id === id ? { ...ticket, ...cacheUpdatePayload } : ticket
                ),
            };
      });

      // Optimistically update Kanban caches
      queryClient.setQueriesData({ queryKey: ['tickets', 'kanban'] }, (oldData: any) => {
        if (!oldData?.columns) return oldData;
        
        const updatedColumns = { ...oldData.columns };
        
        // Find and update the ticket in its current column
        Object.keys(updatedColumns).forEach(status => {
          const ticketIndex = updatedColumns[status].tickets.findIndex((t: Ticket) => t.id === id);
          if (ticketIndex !== -1) {
            // Check if status is changing
            if (cacheUpdatePayload.status && cacheUpdatePayload.status !== status) {
              // Remove from old column
              const ticketToMove = { ...updatedColumns[status].tickets[ticketIndex], ...cacheUpdatePayload };
              updatedColumns[status] = {
                ...updatedColumns[status],
                tickets: updatedColumns[status].tickets.filter((t: Ticket) => t.id !== id),
                loaded: updatedColumns[status].loaded - 1
              };
              
              // Add to new column
              if (updatedColumns[cacheUpdatePayload.status]) {
                updatedColumns[cacheUpdatePayload.status] = {
                  ...updatedColumns[cacheUpdatePayload.status],
                  tickets: [ticketToMove, ...updatedColumns[cacheUpdatePayload.status].tickets],
                  loaded: updatedColumns[cacheUpdatePayload.status].loaded + 1
                };
              }
            } else {
              // Update in same column
              updatedColumns[status].tickets[ticketIndex] = {
                ...updatedColumns[status].tickets[ticketIndex],
                ...cacheUpdatePayload
              };
            }
          }
        });

        return {
          ...oldData,
          columns: updatedColumns
        };
      });

      // Update detail view if exists
      if (previousTicket) {
        queryClient.setQueryData(ticketKeys.detail(id), (old: any) => ({ ...old, ...cacheUpdatePayload }));
      }

      // Return a context object with the snapshotted values
      return { previousTicketLists, previousKanbanData, previousTicket };
    },
    onError: (err, variables, context) => {
      // Rollback detail
      if (context?.previousTicket) {
          queryClient.setQueryData(ticketKeys.detail(variables.id), context.previousTicket);
      }
      // Rollback lists
      if (context?.previousTicketLists) {
          context.previousTicketLists.forEach(([queryKey, data]) => {
               queryClient.setQueryData(queryKey, data);
          });
      }
      // Rollback Kanban
      if (context?.previousKanbanData) {
          context.previousKanbanData.forEach(([queryKey, data]) => {
               queryClient.setQueryData(queryKey, data);
          });
      }
      message.error("Failed to update ticket");
    },
    onSuccess: (savedTicket) => {
        // Update detail view
        queryClient.setQueryData(ticketKeys.detail(savedTicket.id), savedTicket);

        // Update all lists
        queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
            if (!oldData?.data) return oldData;
            return {
                ...oldData,
                data: oldData.data.map((ticket: Ticket) => 
                    ticket.id === savedTicket.id ? savedTicket : ticket
                ),
            };
        });

        // Update Kanban caches with server response
        queryClient.setQueriesData({ queryKey: ['tickets', 'kanban'] }, (oldData: any) => {
          if (!oldData?.columns) return oldData;
          
          const updatedColumns = { ...oldData.columns };
          let ticketFound = false;
          let oldStatus: string | null = null;
          
          // Find ticket in current column
          Object.keys(updatedColumns).forEach(status => {
            const ticketIndex = updatedColumns[status].tickets.findIndex((t: Ticket) => t.id === savedTicket.id);
            if (ticketIndex !== -1) {
              ticketFound = true;
              oldStatus = status;
            }
          });

          if (ticketFound && oldStatus) {
            // Check if status changed
            if (savedTicket.status !== oldStatus) {
              // Remove from old column
              updatedColumns[oldStatus] = {
                ...updatedColumns[oldStatus],
                tickets: updatedColumns[oldStatus].tickets.filter((t: Ticket) => t.id !== savedTicket.id),
                loaded: updatedColumns[oldStatus].loaded - 1
              };
              
              // Add to new column
              if (updatedColumns[savedTicket.status]) {
                updatedColumns[savedTicket.status] = {
                  ...updatedColumns[savedTicket.status],
                  tickets: [savedTicket, ...updatedColumns[savedTicket.status].tickets],
                  loaded: updatedColumns[savedTicket.status].loaded + 1
                };
              }
            } else {
              // Update in same column
              updatedColumns[oldStatus] = {
                ...updatedColumns[oldStatus],
                tickets: updatedColumns[oldStatus].tickets.map((t: Ticket) =>
                  t.id === savedTicket.id ? savedTicket : t
                )
              };
            }
          }

          return {
            ...oldData,
            columns: updatedColumns
          };
        });
    },
  });
};

export const useDeleteTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => TicketService.deleteTicket(id),
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });

      // Snapshot the previous value
      const previousTicketLists = queryClient.getQueriesData({ queryKey: ticketKeys.lists() });

      // Optimistically delete the ticket from the list
      queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
          if (!oldData?.data) return oldData;
          return {
              ...oldData,
              data: oldData.data.filter((ticket: Ticket) => ticket.id !== id),
              pagination: {
                  ...oldData.pagination,
                  total: Math.max(0, (oldData.pagination?.total || 0) - 1)
              }
          };
      });

      // Return context
      return { previousTicketLists };
    },
    onError: (err, id, context) => {
      // Rollback on error
      if (context?.previousTicketLists) {
          context.previousTicketLists.forEach(([queryKey, data]) => {
               queryClient.setQueryData(queryKey, data);
          });
      }
      message.error("Failed to delete ticket");
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      // queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};
