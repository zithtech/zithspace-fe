"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { PortalTokenManager } from "@/lib/portalAxios";
import { useClientPortalAuth } from "@/context/ClientPortalAuthContext";

interface PortalSocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const PortalSocketContext = createContext<PortalSocketContextType>({
  socket: null,
  connected: false,
});

export const usePortalSocket = () => useContext(PortalSocketContext);

export const PortalSocketProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { user } = useClientPortalAuth();

  useEffect(() => {
    const token = PortalTokenManager.getAccessToken();
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
      {
        auth: (cb) => cb({ token: PortalTokenManager.getAccessToken() }),
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      },
    );

    newSocket.on("connect", () => setConnected(true));
    newSocket.on("disconnect", () => setConnected(false));
    newSocket.on("connect_error", (err: any) => {
      if (
        err.message?.includes("Invalid token") ||
        err.message?.includes("Authentication error")
      ) {
        newSocket.disconnect();
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.tenantId, user?.clientId]);

  return (
    <PortalSocketContext.Provider value={{ socket, connected }}>
      {children}
    </PortalSocketContext.Provider>
  );
};
