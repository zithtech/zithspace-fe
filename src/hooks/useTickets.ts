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
      const previousKanbanData = queryClient.getQueriesData({ queryKey: ['tickets', 'kanban'] });

      // Snapshot parent ticket if this is a subtask
      let previousParentTicket: Ticket | undefined;
      if (newTicketData.parentId) {
        previousParentTicket = queryClient.getQueryData<Ticket>(ticketKeys.detail(newTicketData.parentId));
      }

      // Create an optimistic ticket object
      const tempId = `temp-${Date.now()}`;
      const optimisticTicket: Ticket = {
        id: tempId,
        ticketNumber: "T-...", // temp number
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
        // Carry over parentId for subtasks
        metadata: { parentId: newTicketData.parentId }
      };

      // Optimistically update to the new value (Lists) - ONLY IF NOT A SUBTASK
      if (!newTicketData.parentId) {
        queryClient.setQueriesData({ queryKey: ticketKeys.lists() }, (oldData: any) => {
          if (!oldData) return { data: [optimisticTicket], pagination: {} };
          if (!oldData.data) return oldData;
          return {
            ...oldData,
            data: [optimisticTicket, ...oldData.data],
          };
        });

        // Optimistically update to the new value (Kanban) - ONLY IF NOT A SUBTASK
        queryClient.setQueriesData({ queryKey: ['tickets', 'kanban'] }, (oldData: any) => {
          if (!oldData?.columns) return oldData;
          const updatedColumns = { ...oldData.columns };
          const status = optimisticTicket.status;

          if (updatedColumns[status]) {
            updatedColumns[status] = {
              ...updatedColumns[status],
              tickets: [optimisticTicket, ...updatedColumns[status].tickets],
              total: updatedColumns[status].total + 1
            };
          }
          return { ...oldData, columns: updatedColumns };
        });
      } else {
        // OPTIMISTIC UPDATE FOR SUBTASK IN PARENT
        if (previousParentTicket) {
          queryClient.setQueryData(ticketKeys.detail(newTicketData.parentId), (oldParent: any) => {
            if (!oldParent) return oldParent;
            return {
              ...oldParent,
              subTasks: [...(oldParent.subTasks || []), optimisticTicket]
            };
          });
        }
      }

      // Return a context object with the snapshotted value
      return { previousTicketLists, previousKanbanData, previousParentTicket, isSubtask: !!newTicketData.parentId, parentId: newTicketData.parentId };
    },
    onError: (err, newTodo, context) => {
      // Rollback List
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
      // Rollback Parent Ticket
      if (context?.isSubtask && context.parentId && context.previousParentTicket) {
        queryClient.setQueryData(ticketKeys.detail(context.parentId), context.previousParentTicket);
      }

      message.error("Failed to create ticket");
    },
    onSuccess: (savedTicket, variables, context) => {
      if (!context?.isSubtask) {
        // Replace the optimistic ticket with the real one (Lists)
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

        // Replace the optimistic ticket with the real one (Kanban)
        queryClient.setQueriesData({ queryKey: ['tickets', 'kanban'] }, (oldData: any) => {
          if (!oldData?.columns) return oldData;
          const updatedColumns = { ...oldData.columns };
          const status = savedTicket.status;

          if (updatedColumns[status]) {
            updatedColumns[status] = {
              ...updatedColumns[status],
              tickets: updatedColumns[status].tickets.map((t: Ticket) =>
                t.id.startsWith('temp-') && t.title === savedTicket.title
                  ? savedTicket
                  : t
              ),
            };
          }
          return { ...oldData, columns: updatedColumns };
        });
      } else if (context.parentId) {
        // Replace optimistic subtask in parent
        queryClient.setQueryData(ticketKeys.detail(context.parentId), (oldParent: any) => {
          if (!oldParent || !oldParent.subTasks) return oldParent;
          return {
            ...oldParent,
            subTasks: oldParent.subTasks.map((t: Ticket) =>
              t.id.startsWith('temp-') && t.title === savedTicket.title ? savedTicket : t
            )
          };
        });

        // Also Invalidate the parent query to be safe
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(context.parentId) });
      }

      // Invalidate list to ensure consistency and trigger refetch
      // queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    },
  });
};

export const useUpdateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data, parentId }: { id: string; data: Partial<TicketFormData>; optimisticData?: any; parentId?: string }) =>
      TicketService.updateTicket(id, data),
    onMutate: async ({ id, data, optimisticData, parentId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });

      // Snapshot previous values
      const previousTicketLists = queryClient.getQueriesData({ queryKey: ticketKeys.lists() });
      const previousKanbanData = queryClient.getQueriesData({ queryKey: ['tickets', 'kanban'] });
      let previousTicket = queryClient.getQueryData<Ticket>(ticketKeys.detail(id));

      // FALLBACK: Find ticket in lists if not in detail
      if (!previousTicket && previousTicketLists) {
        for (const [key, listData] of previousTicketLists) {
          const list = (listData as any)?.data as Ticket[];
          if (list) {
            const found = list.find(t => t.id === id);
            if (found) {
              previousTicket = found;
              break;
            }
          }
        }
      }

      // Prepare payload
      const cacheUpdatePayload = optimisticData || data;

      // Define targetParentId for subtask updates
      const targetParentId = parentId || (previousTicket && previousTicket.parentId);

      try {
        // Optimistically update LISTS
        previousTicketLists.forEach(([queryKey, oldData]: [any, any]) => {
          if (!oldData?.data) return;

          // GUARD: Subtasks should NEVER appear in main lists (Backlog/Sprint)
          // If the ticket has a parentId, it is a subtask. Skip list updates.
          if (targetParentId) return;

          const listParams = queryKey[2] || {};
          const isBacklogList = listParams.sprintId === 'null';
          const isActiveSprintList = listParams.sprintId === 'active';
          const isReleasePlanUpdate = 'releasePlan' in cacheUpdatePayload || 'sprintPlan' in cacheUpdatePayload;

          let newData = [...oldData.data];
          let total = oldData.pagination?.total || newData.length;

          if (isReleasePlanUpdate) {
            const newReleasePlan = cacheUpdatePayload.releasePlan !== undefined ? cacheUpdatePayload.releasePlan : cacheUpdatePayload.sprintPlan;
            const isMovingToBacklog = newReleasePlan === null || newReleasePlan === 'null';
            const isMovingToSprint = typeof newReleasePlan === 'string' && newReleasePlan !== 'null' && newReleasePlan !== '';
            const exists = newData.find((t: Ticket) => t.id === id);

            if (isBacklogList && isMovingToSprint) {
              if (exists) { newData = newData.filter((t: Ticket) => t.id !== id); total = Math.max(0, total - 1); }
            } else if (isActiveSprintList && isMovingToBacklog) {
              if (exists) { newData = newData.filter((t: Ticket) => t.id !== id); total = Math.max(0, total - 1); }
            } else if (isBacklogList && isMovingToBacklog) {
              if (!exists && previousTicket) { const newTicket = { ...previousTicket, ...cacheUpdatePayload }; newData = [newTicket, ...newData]; total = total + 1; }
            } else if (isActiveSprintList && isMovingToSprint) {
              if (!exists && previousTicket) { const newTicket = { ...previousTicket, ...cacheUpdatePayload }; newData = [newTicket, ...newData]; total = total + 1; }
            }
          }

          newData = newData.map((ticket: Ticket) => ticket.id === id ? { ...ticket, ...cacheUpdatePayload } : ticket);

          queryClient.setQueryData(queryKey, { ...oldData, data: newData, pagination: { ...oldData.pagination, total } });
        });

        // Optimistically update KANBAN
        previousKanbanData.forEach(([queryKey, oldData]: [any, any]) => {
          if (!oldData?.columns) return;
          const updatedColumns = { ...oldData.columns };
          Object.keys(updatedColumns).forEach(status => {
            updatedColumns[status] = {
              ...updatedColumns[status],
              tickets: updatedColumns[status].tickets.map((t: Ticket) => t.id === id ? { ...t, ...cacheUpdatePayload } : t)
            };
          });
          queryClient.setQueryData(queryKey, { ...oldData, columns: updatedColumns });
        });

        // Optimistically Update PARENT (Subtasks)
        if (targetParentId) {
          queryClient.setQueryData(ticketKeys.detail(targetParentId), (oldParent: any) => {
            if (!oldParent || !oldParent.subTasks) return oldParent;
            return {
              ...oldParent,
              subTasks: oldParent.subTasks.map((t: Ticket) =>
                t.id === id ? { ...t, ...cacheUpdatePayload } : t
              )
            };
          });
        }

      } catch (e) {
        console.error("Optimistic update failed", e);
      }

      if (previousTicket) {
        queryClient.setQueryData(ticketKeys.detail(id), (old: any) => ({ ...old, ...cacheUpdatePayload }));
      }

      return { previousTicketLists, previousKanbanData, previousTicket, parentId: targetParentId };
    },
    onError: (err, variables, context) => {
      // Rollback logic...
      if (context?.previousTicket) {
        queryClient.setQueryData(ticketKeys.detail(variables.id), context.previousTicket);
        // Rollback parent subtask if needed
        if (context.previousTicket.parentId) {
          queryClient.invalidateQueries({ queryKey: ticketKeys.detail(context.previousTicket.parentId) });
        }
      }
      if (context?.previousTicketLists) {
        context.previousTicketLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousKanbanData) {
        context.previousKanbanData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (savedTicket) => {
      // Update detail
      queryClient.setQueryData(ticketKeys.detail(savedTicket.id), savedTicket);

      // Iterate lists to update
      const ticketLists = queryClient.getQueriesData({ queryKey: ticketKeys.lists() });
      ticketLists.forEach(([queryKey, oldData]: [any, any]) => {
        if (!oldData?.data) return;

        const listParams = queryKey[2] || {};
        const isBacklogList = listParams.sprintId === 'null';
        const isActiveSprintList = listParams.sprintId === 'active';

        let newData = [...oldData.data];

        const inSprint = !!savedTicket.sprintPlanId;
        const inBacklog = !savedTicket.sprintPlanId;

        if (isBacklogList && inSprint) {
          newData = newData.filter(t => t.id !== savedTicket.id);
        }
        else if (isActiveSprintList && inBacklog) {
          newData = newData.filter(t => t.id !== savedTicket.id);
        }
        else if ((isBacklogList && inBacklog) || (isActiveSprintList && inSprint)) {
          const exists = newData.find(t => t.id === savedTicket.id);
          if (exists) {
            newData = newData.map((ticket: Ticket) =>
              ticket.id === savedTicket.id ? savedTicket : ticket
            );
          } else {
            newData = [savedTicket, ...newData];
          }
        }

        queryClient.setQueryData(queryKey, { ...oldData, data: newData });
      });

      // Iterate Kanban to update
      const kanbanData = queryClient.getQueriesData({ queryKey: ['tickets', 'kanban'] });
      kanbanData.forEach(([queryKey, oldData]: [any, any]) => {
        if (!oldData?.columns) return;

        const kanbanParams = queryKey[2] || {};
        const isBacklogBoard = kanbanParams.sprintId === 'null';
        const isActiveSprintBoard = kanbanParams.sprintId === 'active';

        const inSprint = !!savedTicket.sprintPlanId;
        const inBacklog = !savedTicket.sprintPlanId;

        const updatedColumns = { ...oldData.columns };

        const removeIdFromBoard = () => {
          Object.keys(updatedColumns).forEach(status => {
            updatedColumns[status] = {
              ...updatedColumns[status],
              tickets: updatedColumns[status].tickets.filter((t: Ticket) => t.id !== savedTicket.id),
              loaded: Math.max(0, updatedColumns[status].tickets.filter((t: Ticket) => t.id !== savedTicket.id).length)
            };
          });
        };

        if (isBacklogBoard && inSprint) removeIdFromBoard();
        if (isActiveSprintBoard && inBacklog) removeIdFromBoard();

        // If valid for this board
        if ((isBacklogBoard && inBacklog) || (isActiveSprintBoard && inSprint) || (!isBacklogBoard && !isActiveSprintBoard)) {
          let ticketFound = false;
          let oldStatus: string | null = null;

          Object.keys(updatedColumns).forEach(status => {
            const ticketIndex = updatedColumns[status].tickets.findIndex((t: Ticket) => t.id === savedTicket.id);
            if (ticketIndex !== -1) {
              ticketFound = true;
              oldStatus = status;
            }
          });

          if (ticketFound && oldStatus) {
            if (savedTicket.status !== oldStatus) {
              updatedColumns[oldStatus] = {
                ...updatedColumns[oldStatus],
                tickets: updatedColumns[oldStatus].tickets.filter((t: Ticket) => t.id !== savedTicket.id),
                loaded: updatedColumns[oldStatus].loaded - 1
              };
              if (updatedColumns[savedTicket.status]) {
                updatedColumns[savedTicket.status] = {
                  ...updatedColumns[savedTicket.status],
                  tickets: [savedTicket, ...updatedColumns[savedTicket.status].tickets],
                  loaded: updatedColumns[savedTicket.status].loaded + 1
                };
              }
            } else {
              updatedColumns[oldStatus] = {
                ...updatedColumns[oldStatus],
                tickets: updatedColumns[oldStatus].tickets.map((t: Ticket) =>
                  t.id === savedTicket.id ? savedTicket : t
                )
              };
            }
          } else {
            if (updatedColumns[savedTicket.status]) {
              updatedColumns[savedTicket.status] = {
                ...updatedColumns[savedTicket.status],
                tickets: [savedTicket, ...updatedColumns[savedTicket.status].tickets],
                loaded: updatedColumns[savedTicket.status].loaded + 1,
                total: updatedColumns[savedTicket.status].total + 1
              };
            }
          }
        }

        queryClient.setQueryData(queryKey, { ...oldData, columns: updatedColumns });
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
    onSuccess: (data, variables, context) => {
      // We generally can't guess the parentId easily here unless we fetched the ticket first or passed it.
      // But invalidating all details is expensive. 
      // Best effort: if we have the parentId in our context or can guess it, otherwise invalidate logic.
      // Actually, let's just invalidate all details for safety, or we can improve this later.
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
};
