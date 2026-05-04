import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";

// Assuming projectKeys pattern
const projectKeys = {
  all: ['projects'],
  lists: () => [...projectKeys.all, 'list'],
  detail: (id: string) => [...projectKeys.all, 'detail', id],
  select: () => [...projectKeys.all, 'select'],
};

/**
 * useProjectSocketEvents
 * 
 * Hook to listen for project-level socket events.
 * Keeps the project list and project settings in sync.
 */
export const useProjectSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    const handleProjectUpdated = (data: any) => {
      console.log("Socket: Project Updated", data);
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    };

    const handleProjectCreated = (data: any) => {
      console.log("Socket: Project Created", data);
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.select() });
    };

    socket.on("project:created", handleProjectCreated);
    socket.on("project:updated", handleProjectUpdated);
    socket.on("project:deleted", handleProjectUpdated);

    return () => {
      socket.off("project:created", handleProjectCreated);
      socket.off("project:updated", handleProjectUpdated);
      socket.off("project:deleted", handleProjectUpdated);
    };
  }, [socket, connected, queryClient]);
};
