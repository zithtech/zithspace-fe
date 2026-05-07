import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";
import { useAuth } from "@/context/AuthContext";
import { App } from "antd";

export const useDocumentSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  const { message } = App.useApp();

  useEffect(() => {
    if (!socket || !connected) return;

    // Document Hub events
    const handleHubCreated = (hub: any) => {
      console.log("Socket: Document Hub Created", hub);
      queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
      if (hub.createdById !== user?.id) {
        message.success(`New document hub created: ${hub.name}`);
      }
    };

    const handleHubUpdated = (hub: any) => {
      console.log("Socket: Document Hub Updated", hub);
      queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
      queryClient.invalidateQueries({ queryKey: ["documentHub", hub.id] });
    };

    const handleHubDeleted = ({ id }: { id: string }) => {
      console.log("Socket: Document Hub Deleted", id);
      queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
      queryClient.removeQueries({ queryKey: ["documentHub", id] });
    };

    const handleHubRestored = (hub: any) => {
      console.log("Socket: Document Hub Restored", hub);
      queryClient.invalidateQueries({ queryKey: ["documentHubs"] });
    };

    // Tree Node events
    const handleNodeCreated = (node: any) => {
      console.log("Socket: Tree Node Created", node);
      queryClient.invalidateQueries({ queryKey: ["documentHub", node.documentHubId] });
    };

    const handleNodeUpdated = (node: any) => {
      console.log("Socket: Tree Node Updated", node);
      queryClient.invalidateQueries({ queryKey: ["documentHub", node.documentHubId] });
    };

    const handleNodeDeleted = ({ id, documentHubId }: { id: string, documentHubId?: string }) => {
      console.log("Socket: Tree Node Deleted", id);
      if (documentHubId) {
        queryClient.invalidateQueries({ queryKey: ["documentHub", documentHubId] });
      } else {
        // If we don't have hubId, we might need to invalidate all hubs or rely on the sender
        queryClient.invalidateQueries({ queryKey: ["documentHub"] });
      }
    };

    const handleNodeRestored = ({ id, documentHubId }: { id: string, documentHubId: string }) => {
      console.log("Socket: Tree Node Restored", id);
      queryClient.invalidateQueries({ queryKey: ["documentHub", documentHubId] });
    };

    // Document content events
    const handleDocumentUpdated = (doc: any) => {
      console.log("Socket: Document Updated", doc);
      // Invalidate the specific document content
      queryClient.invalidateQueries({ queryKey: ["document", doc.id] });
      // Also invalidate the hub to reflect any title/metadata changes in the tree
      if (doc.documentHubId) {
        queryClient.invalidateQueries({ queryKey: ["documentHub", doc.documentHubId] });
      }
    };

    const handleDocumentDeleted = ({ id }: { id: string }) => {
      console.log("Socket: Document Deleted", id);
      queryClient.removeQueries({ queryKey: ["document", id] });
      queryClient.removeQueries({ queryKey: ["documentHistory", id] });
      queryClient.invalidateQueries({ queryKey: ["documentHub"] });
    };

    const handleDocumentRestored = ({ id }: { id: string }) => {
      console.log("Socket: Document Restored", id);
      queryClient.invalidateQueries({ queryKey: ["documentHub"] });
    };

    socket.on("documenthub:created", handleHubCreated);
    socket.on("documenthub:updated", handleHubUpdated);
    socket.on("documenthub:deleted", handleHubDeleted);
    socket.on("documenthub:restored", handleHubRestored);

    socket.on("documenthub:node_created", handleNodeCreated);
    socket.on("documenthub:node_updated", handleNodeUpdated);
    socket.on("documenthub:node_deleted", handleNodeDeleted);
    socket.on("documenthub:node_restored", handleNodeRestored);

    socket.on("documenthub:document_updated", handleDocumentUpdated);
    socket.on("documenthub:document_deleted", handleDocumentDeleted);
    socket.on("documenthub:document_restored", handleDocumentRestored);

    return () => {
      socket.off("documenthub:created", handleHubCreated);
      socket.off("documenthub:updated", handleHubUpdated);
      socket.off("documenthub:deleted", handleHubDeleted);
      socket.off("documenthub:restored", handleHubRestored);

      socket.off("documenthub:node_created", handleNodeCreated);
      socket.off("documenthub:node_updated", handleNodeUpdated);
      socket.off("documenthub:node_deleted", handleNodeDeleted);
      socket.off("documenthub:node_restored", handleNodeRestored);

      socket.off("documenthub:document_updated", handleDocumentUpdated);
      socket.off("documenthub:document_deleted", handleDocumentDeleted);
      socket.off("documenthub:document_restored", handleDocumentRestored);
    };
  }, [socket, connected, queryClient, user?.id, message]);
};
