import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";
import { globalDataKeys } from "@/hooks/useGlobalData";
import { message } from "antd";

/**
 * Hook to listen for Document Hub socket events.
 * Handles real-time updates for Hubs, Documents, and Tree structures.
 */
export const useDocumentSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    // HUB EVENTS
    const handleHubCreated = () => {
      queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.all });
      message.info("New Document Hub created");
    };

    const handleHubUpdated = (data: any) => {
      console.log("Socket: Hub Updated", data);
      queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.all });
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.detail(data.id) });
      }
    };

    const handleHubDeleted = () => {
      queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.all });
      queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.trash });
    };

    const handleHubRestored = (data: any) => {
      queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.all });
      queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.trash });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.detail(data.id) });
      }
    };

    // DOCUMENT & TREE EVENTS
    const handleTreeUpdated = (data: any) => {
      console.log("Socket: Tree Updated", data);
      if (data.documentHubId) {
        queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.detail(data.documentHubId) });
      }
      // If it was a deletion or restoration, also refresh trash
      if (data.action && (data.action.includes('deleted') || data.action.includes('restored'))) {
        queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.trash });
      }
    };

    const handleDocumentUpdated = (data: any) => {
      console.log("Socket: Document Updated", data);
      if (data.id) {
        queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.document(data.id) });
      }
      if (data.documentHubId) {
        queryClient.invalidateQueries({ queryKey: globalDataKeys.documentHub.detail(data.documentHubId) });
      }
    };

    // Subscriptions
    socket.on("documenthub:created", handleHubCreated);
    socket.on("documenthub:updated", handleHubUpdated);
    socket.on("documenthub:deleted", handleHubDeleted);
    socket.on("documenthub:restored", handleHubRestored);
    socket.on("documenthub:tree_updated", handleTreeUpdated);
    socket.on("document:updated", handleDocumentUpdated);

    return () => {
      socket.off("documenthub:created", handleHubCreated);
      socket.off("documenthub:updated", handleHubUpdated);
      socket.off("documenthub:deleted", handleHubDeleted);
      socket.off("documenthub:restored", handleHubRestored);
      socket.off("documenthub:tree_updated", handleTreeUpdated);
      socket.off("document:updated", handleDocumentUpdated);
    };
  }, [socket, connected, queryClient]);
};
