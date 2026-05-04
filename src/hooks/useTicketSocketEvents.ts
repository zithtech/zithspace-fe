import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";
import { ticketKeys } from "./useTickets";
import { Ticket } from "@/services/ticketService";
import { message } from "antd";

export const useTicketSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    const handleTicketCreated = (ticket: Ticket) => {
      console.log("Socket: Ticket Created", ticket);
      // Invalidate all ticket-related queries (lists, kanban, stats)
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      message.info(`New ticket created: ${ticket.ticketNumber}`);
    };

    const handleTicketUpdated = (updatedTicket: Ticket) => {
      console.log("Socket: Ticket Updated", updatedTicket);
      
      // Update detail view immediately
      queryClient.setQueryData(ticketKeys.detail(updatedTicket.id), updatedTicket);

      // Invalidate all ticket-related queries to reflect status/content changes
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    };

    const handleTicketDeleted = ({ id }: { id: string }) => {
      console.log("Socket: Ticket Deleted", id);
      
      // Remove from detail view cache if present (or just invalidate)
      queryClient.removeQueries({ queryKey: ticketKeys.detail(id) });
      
      // Invalidate all ticket-related queries
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
    };

    socket.on("ticket:created", handleTicketCreated);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:deleted", handleTicketDeleted);

    return () => {
      socket.off("ticket:created", handleTicketCreated);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:deleted", handleTicketDeleted);
    };
  }, [socket, connected, queryClient]);
};
