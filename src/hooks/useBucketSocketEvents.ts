import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";
import { bucketKeys } from "./useBuckets";
import { ticketKeys } from "./useTickets";

/**
 * useBucketSocketEvents
 * 
 * Hook to listen for bucket-related socket events and invalidate React Query caches.
 * Ensures the Bucket Management page stays in sync across different users and tabs.
 */
export const useBucketSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    const handleBucketUpdated = (data: any) => {
      console.log("Socket: Bucket Updated", data);
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      // Many bucket actions also affect ticket lists
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
    };

    const handleBucketTicketsChanged = (data: any) => {
      console.log("Socket: Bucket Tickets Changed", data);
      queryClient.invalidateQueries({ queryKey: bucketKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      if (data.bucketId) {
        queryClient.invalidateQueries({ queryKey: bucketKeys.detail(data.bucketId) });
      }
    };

    // Listen for bucket lifecycle events
    socket.on("bucket:created", handleBucketUpdated);
    socket.on("bucket:updated", handleBucketUpdated);
    socket.on("bucket:deleted", handleBucketUpdated);

    // Listen for ticket movement within buckets
    socket.on("bucket:tickets_assigned", handleBucketTicketsChanged);
    socket.on("bucket:tickets_unassigned", handleBucketTicketsChanged);
    socket.on("bucket:moved_to_sprint", handleBucketTicketsChanged);
    socket.on("bucket:moved_to_backlog", handleBucketTicketsChanged);

    return () => {
      socket.off("bucket:created", handleBucketUpdated);
      socket.off("bucket:updated", handleBucketUpdated);
      socket.off("bucket:deleted", handleBucketUpdated);
      socket.off("bucket:tickets_assigned", handleBucketTicketsChanged);
      socket.off("bucket:tickets_unassigned", handleBucketTicketsChanged);
      socket.off("bucket:moved_to_sprint", handleBucketTicketsChanged);
      socket.off("bucket:moved_to_backlog", handleBucketTicketsChanged);
    };
  }, [socket, connected, queryClient]);
};
