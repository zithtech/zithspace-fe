"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import { useTenant } from "@/context/TenantContext";
import { AuthService } from "@/services/authService";

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  connected: false,
});

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketUrl, setSocketUrl] = useState<string>("");
  const { user } = useAuth();
  const { tenantInfo } = useTenant();

  // Initialize URL once based on environment
  useEffect(() => {
    const defaultUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    setSocketUrl(defaultUrl);
  }, []);

  useEffect(() => {
    const token = AuthService.getAccessToken();
    
    if (!socketUrl) return;

    console.log("Socket: Connection State Check", { 
      hasToken: !!token, 
      tenantId: tenantInfo?.tenantId,
      userId: user?.id,
      url: socketUrl
    });

    if (!token || !tenantInfo) {
      if (socket) {
        console.log("Socket: Disconnecting (Auth/Tenant missing)");
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Use a ref-like check to avoid re-initializing if we already have an active socket
    if (socket?.connected) {
      console.log("Socket: Already connected, skipping init");
      return;
    }

    console.log("Socket: Initializing connection to", socketUrl);
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    newSocket.on("connect", () => {
      console.log("Socket: [CONNECTED] ID:", newSocket.id, "on", socketUrl);
      setConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket: [DISCONNECTED] Reason:", reason);
      setConnected(false);
    });

    newSocket.on("connect_error", (err: any) => {
      console.error(`Socket: [ERROR] on ${socketUrl}:`, err.message);
      
      if (socketUrl.includes("5001")) {
        console.log("Socket: Switching to fallback port 5000");
        setSocketUrl(socketUrl.replace("5001", "5000"));
      }
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      console.log("Socket: Cleaning up on unmount or URL change");
      newSocket.disconnect();
    };
  }, [user?.id, tenantInfo?.tenantId, socketUrl]); // Removed 'user' and 'connected' to prevent loops

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};
