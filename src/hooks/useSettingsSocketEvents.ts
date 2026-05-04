import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/providers/SocketProvider";
import { globalDataKeys } from "./useGlobalData";
import { message } from "antd";

export const useSettingsSocketEvents = () => {
  const queryClient = useQueryClient();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected) return;

    const handleConfigUpdated = (data: any) => {
      console.log("Socket: Ticket Configuration Updated", data);
      
      // Invalidate ticket configuration cache
      queryClient.invalidateQueries({ queryKey: globalDataKeys.ticketConfig });
      
      // Also invalidate dropdown options if specific hook is used
      queryClient.invalidateQueries({ queryKey: globalDataKeys.dropdownOptions });
      
      message.info(`System configuration updated real-time`);
    };

    const handleTenantUpdated = (data: any) => {
      console.log("Socket: Tenant Settings Updated", data);
      queryClient.invalidateQueries({ queryKey: ["tenantSettings"] });
      message.info(`Workspace settings updated`);
    };

    socket.on("settings:ticket_config_updated", handleConfigUpdated);
    socket.on("settings:tenant_updated", handleTenantUpdated);

    return () => {
      socket.off("settings:ticket_config_updated", handleConfigUpdated);
      socket.off("settings:tenant_updated", handleTenantUpdated);
    };
  }, [socket, connected, queryClient]);
};
