import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";
import { trashKeys } from "./useTrash";
import { ticketKeys } from "./useTickets";

/**
 * useTrashSocketEvents
 * 
 * Hook to listen for trash-related socket events and invalidate React Query caches.
 * Ensures the Trash Management page stays in sync across different users and tabs.
 */
export const useTrashSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) {
      console.log("Socket: Trash listener waiting for connection... Connected:", connected);
      return;
    }

    // DEBUG: Log EVERY event that comes in to see what the backend is actually sending
    socket.onAny((eventName, ...args) => {
      console.log(`Socket DEBUG: Received [${eventName}]`, args);
    });

    // This handles when a ticket is soft-deleted (moved to trash)
    const handleTicketMovedToTrash = (data: any) => {
      console.log("Socket: Ticket Deleted/Moved-to-Trash event received", data);
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    };

    // This handles when a ticket is updated
    const handleTicketUpdated = (ticket: any) => {
      console.log("Socket: Ticket Updated event received in Trash", ticket);
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
    };

    // Handle ticket restoration or permanent deletion
    const handleTrashUpdated = (data: any) => {
      console.log("Socket: Trash Change event received", data);
      queryClient.invalidateQueries({ queryKey: trashKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    };

    // Listen to a broad set of events
    socket.on("ticket:deleted", handleTicketMovedToTrash);
    socket.on("ticket:updated", handleTicketUpdated);
    socket.on("ticket:restored", handleTrashUpdated);
    socket.on("ticket:permanently_deleted", handleTrashUpdated);
    socket.on("trash:updated", handleTrashUpdated);
    socket.on("trash:emptied", handleTrashUpdated);

    return () => {
      socket.offAny();
      socket.off("ticket:deleted", handleTicketMovedToTrash);
      socket.off("ticket:updated", handleTicketUpdated);
      socket.off("ticket:restored", handleTrashUpdated);
      socket.off("ticket:permanently_deleted", handleTrashUpdated);
      socket.off("trash:updated", handleTrashUpdated);
      socket.off("trash:emptied", handleTrashUpdated);
    };
  }, [socket, connected, queryClient]);
};
