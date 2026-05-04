import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";
import { ticketKeys } from "./useTickets";

// Note: Assuming planKeys exists or using general invalidation if not.
// Usually planning involves the ReleasePlan model.
const planKeys = {
  all: ['releasePlans'],
  lists: () => [...planKeys.all, 'list'],
  detail: (id: string) => [...planKeys.all, 'detail', id],
};

/**
 * usePlanSocketEvents
 * 
 * Hook to listen for sprint and release plan socket events.
 * Keeps the Planning board and Sprints in sync.
 */
export const usePlanSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    const handlePlanUpdated = (data: any) => {
      console.log("Socket: Plan Updated", data);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      // Plans affect ticket assignments across all views
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    };

    const handleSprintAction = (data: any) => {
      console.log("Socket: Sprint Action", data);
      queryClient.invalidateQueries({ queryKey: planKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: planKeys.detail(data.id) });
      }
    };

    // Plan lifecycle
    socket.on("plan:created", handlePlanUpdated);
    socket.on("plan:updated", handlePlanUpdated);
    socket.on("plan:deleted", handlePlanUpdated);

    // Sprint actions
    socket.on("sprint:started", handleSprintAction);
    socket.on("sprint:completed", handleSprintAction);

    return () => {
      socket.off("plan:created", handlePlanUpdated);
      socket.off("plan:updated", handlePlanUpdated);
      socket.off("plan:deleted", handlePlanUpdated);
      socket.off("sprint:started", handleSprintAction);
      socket.off("sprint:completed", handleSprintAction);
    };
  }, [socket, connected, queryClient]);
};
