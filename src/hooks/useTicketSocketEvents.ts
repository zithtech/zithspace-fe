import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";
import { useAuth } from "@/context/AuthContext";
import { ticketKeys } from "./useTickets";
import { trashKeys } from "./useTrash";
import { bucketKeys } from "./useBuckets";
import { Ticket } from "@/services/ticketService";
import { App } from "antd";

export const useTicketSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const { message } = App.useApp();

  useEffect(() => {
    if (!socket || !connected) return;

    const handleTicketCreated = (ticket: Ticket) => {
      console.log("Socket: Ticket Created", ticket);
      // Invalidate ALL ticket-related queries
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      
      // Invalidate sprint completion if assigned to a sprint
      if (ticket.sprintPlanId) {
        queryClient.invalidateQueries({ queryKey: ["sprint-completion"] });
      }

      // Only show notification if the ticket was NOT created by the current user
      if (ticket.createdBy?.id !== user?.id) {
        message.success(`New ticket created: ${ticket.ticketNumber}`);
      }
    };

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      console.log("Socket: Ticket Updated", updatedTicket);

      // 1. Update detail view immediately for snappy single-ticket updates
      queryClient.setQueryData(ticketKeys.detail(updatedTicket.id), updatedTicket);

      // 2. Invalidate ALL ticket-related queries (lists, kanban, my tickets, etc.)
      // This is the safest way to ensure all views across the app are in sync.
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });

      // 3. Invalidate sprint completion data
      // Status changes directly affect the "Pending" section in the Sprint Completion modal.
      queryClient.invalidateQueries({ queryKey: ["sprint-completion"] });
      
      // 4. Invalidate buckets if assignment might have changed
      if (updatedTicket.bucketId) {
        queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      }
    };

    const handleTicketDeleted = ({ id }: { id: string }) => {
      console.log("Socket: Ticket Deleted", id);

      // Remove from detail view cache
      queryClient.removeQueries({ queryKey: ticketKeys.detail(id) });

      // Invalidate ALL ticket-related queries and trash
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      
      // Invalidate sprint completion as a ticket might have been removed
      queryClient.invalidateQueries({ queryKey: ["sprint-completion"] });
    };

    const handleTicketRestored = ({ id }: { id: string }) => {
      console.log("Socket: Ticket Restored", id);
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    };

    const handleTicketPermanentlyDeleted = ({ id }: { id: string }) => {
      console.log("Socket: Ticket Permanently Deleted", id);
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    };

    const handleBucketChanged = (data: any) => {
      console.log("Socket: Bucket Changed", data);
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    };

    const handlePlanChanged = (data: any) => {
      console.log("Socket: Plan Changed", data);
      // Dispatch custom event for components not using React Query (like SprintPlan.tsx)
      window.dispatchEvent(new CustomEvent("zith:plan_changed", { detail: data }));
      
      // Invalidate queries for those that DO use React Query
      queryClient.invalidateQueries({ queryKey: ["release-plans"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    };

    const handleSprintTicketsResolved = (data: any) => {
      console.log("Socket: Sprint Tickets Resolved", data);
      // Invalidate the summary for the specific sprint
      queryClient.invalidateQueries({ queryKey: ["sprint-completion"] });
      // Invalidate tickets and buckets as they've been moved
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
    };

    const handleSprintCompleted = (data: any) => {
      console.log("Socket: Sprint Completed", data);
      queryClient.invalidateQueries({ queryKey: ["sprint-completion"] });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["release-plans"] });
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:deleted", handleTicketDeleted);
    socket.on("ticket:restored", handleTicketRestored);
    socket.on("ticket:permanently_deleted", handleTicketPermanentlyDeleted);
    socket.on("bucket:created", handleBucketChanged);
    socket.on("bucket:updated", handleBucketChanged);
    socket.on("bucket:deleted", handleBucketChanged);
    socket.on("plan:created", handlePlanChanged);
    socket.on("plan:updated", handlePlanChanged);
    socket.on("plan:deleted", handlePlanChanged);
    socket.on("sprint:tickets_resolved", handleSprintTicketsResolved);
    socket.on("sprint:completed", handleSprintCompleted);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:deleted", handleTicketDeleted);
      socket.off("ticket:restored", handleTicketRestored);
      socket.off("ticket:permanently_deleted", handleTicketPermanentlyDeleted);
      socket.off("bucket:created", handleBucketChanged);
      socket.off("bucket:updated", handleBucketChanged);
      socket.off("bucket:deleted", handleBucketChanged);
      socket.off("plan:created", handlePlanChanged);
      socket.off("plan:updated", handlePlanChanged);
      socket.off("plan:deleted", handlePlanChanged);
      socket.off("sprint:tickets_resolved", handleSprintTicketsResolved);
      socket.off("sprint:completed", handleSprintCompleted);
    };
  }, [socket, connected, queryClient]);
};
