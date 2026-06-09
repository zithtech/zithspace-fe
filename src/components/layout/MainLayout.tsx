"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Layout, App as AntApp, theme } from "antd";
import LoadingSpinner from "../common/LoadingSpinner";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import { NAVIGATION_CONFIG, ModuleType, STANDALONE_PAGES } from "./navigationConfig";
import { useLayout } from "@/context/LayoutContext";
import { useTicketSocketEvents } from "@/hooks/useTicketSocketEvents";
import { useDocumentSocketEvents } from "@/hooks/useDocumentSocketEvents";
import { TimerSocketListener } from "../time-tracking/TimerSocketListener";
import { useSocket } from "@/providers/SocketProvider";

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export default function MainLayout({ children, noPadding }: MainLayoutProps) {
  const { token } = theme.useToken();
  const { user, logout, isLoading: authLoading, hasPermission, hasAnyPermission } = useAuth();
  const { notification } = AntApp.useApp();
  const { socket } = useSocket();

  const router = useRouter();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useLayout();
  const [activeModule, setActiveModule] = useState<ModuleType>("WORK");

  // Global socket event listeners
  useTicketSocketEvents();
  useDocumentSocketEvents();

  // Determine active module based on current path
  useEffect(() => {
    if (!pathname) return;

    // Find module that matches the path prefix
    const foundModule = NAVIGATION_CONFIG.find((module) =>
      module.pathPrefixes.some((prefix) => pathname.startsWith(prefix)),
    );

    if (foundModule) {
      // Check if user has permission for this module
      const hasAccess = !foundModule.requiredPermission && !foundModule.requiredAnyPermission
        ? true
        : foundModule.requiredPermission
          ? hasPermission(foundModule.requiredPermission)
          : foundModule.requiredAnyPermission ? hasAnyPermission(...foundModule.requiredAnyPermission) : true;

      if (foundModule.key !== "HOME" && !hasAccess && pathname !== "/dashboard") {
        router.push("/dashboard");
        return;
      }

      // Deep check for specific item permission
      const checkItemAccess = (items: any[]): boolean => {
        for (const item of items) {
          if (item.path && pathname.startsWith(item.path)) {
            const itemAccess = !item.requiredPermission && !item.requiredAnyPermission
              ? true
              : item.requiredPermission
                ? hasPermission(item.requiredPermission)
                : item.requiredAnyPermission ? hasAnyPermission(...item.requiredAnyPermission) : true;

            if (!itemAccess) return false;
          }
          if (item.children && !checkItemAccess(item.children)) {
            return false;
          }
        }
        return true;
      };

      if (!checkItemAccess(foundModule.items)) {
        router.push("/dashboard");
        return;
      }

      setActiveModule(foundModule.key);
    } else {
      // Check standalone pages
      const foundStandalone = STANDALONE_PAGES.find(p => pathname.startsWith(p.path));
      if (foundStandalone) {
        if (!hasPermission(foundStandalone.requiredPermission)) {
          router.push("/dashboard");
          return;
        }
      }
    }
  }, [pathname, user, hasPermission, hasAnyPermission]);

  // Listen for service worker messages to play custom notification sounds in-tab
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "PLAY_SOUND") {
        const audio = new Audio("/notification.mp3");
        audio.play().catch((err) => {
          console.warn("[MainLayout] Custom sound playback failed or blocked by browser autoplay policy:", err);
        });
      }
    };

    navigator.serviceWorker.addEventListener("message", handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, []);

  // Connect to user stream for global notifications and web push notifications
  useEffect(() => {
    if (user?.id) {
      // Register for system-level background push notifications
      try {
        const { registerPushNotifications } = require("@/utils/pushNotificationHelper");
        registerPushNotifications();
      } catch (err) {
        console.error("Error registering web push:", err);
      }

      const { streamClient } = require("@/services/streamClient");

      streamClient.connectUser(user.id);

      streamClient.onNotification((data: any) => {
        if (pathname.includes(`/chat/${data.channelId}`)) return;

        // Play custom notification sound in-tab
        const audio = new Audio("/notification.mp3");
        audio.play().catch((err) => {
          console.warn("[MainLayout] Custom sound playback failed or blocked by browser autoplay policy:", err);
        });

        const key = `notification-${Date.now()}`;
        notification.info({
          key,
          message: `New message from ${data.senderName}`,
          description:
            data.content.substring(0, 50) +
            (data.content.length > 50 ? "..." : ""),
          placement: "topRight",
          duration: 4.5,
          onClick: () => {
            notification.destroy(key);
            router.push(`/chat/${data.channelId}`);
          },
          style: { cursor: "pointer" },
        });
      });

      return () => {
        streamClient.disconnectUser();
      };
    }
  }, [user?.id, pathname, router, notification]);


  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Synchronous permission check to prevent flash of unauthorized content
  let isAuthorized = true;
  if (user && pathname) {
    const foundModule = NAVIGATION_CONFIG.find((module) =>
      module.pathPrefixes.some((prefix) => pathname.startsWith(prefix)),
    );

    if (foundModule) {
      const hasAccess = !foundModule.requiredPermission && !foundModule.requiredAnyPermission
        ? true
        : foundModule.requiredPermission
          ? hasPermission(foundModule.requiredPermission)
          : foundModule.requiredAnyPermission ? hasAnyPermission(...foundModule.requiredAnyPermission) : true;

      if (foundModule.key !== "HOME" && !hasAccess && pathname !== "/dashboard") {
        isAuthorized = false;
      }

      // Deep check for specific item permission
      const checkItemAccess = (items: any[]): boolean => {
        for (const item of items) {
          if (item.path && pathname.startsWith(item.path)) {
            const itemAccess = !item.requiredPermission && !item.requiredAnyPermission
              ? true
              : item.requiredPermission
                ? hasPermission(item.requiredPermission)
                : item.requiredAnyPermission ? hasAnyPermission(...item.requiredAnyPermission) : true;

            if (!itemAccess) return false;
          }
          if (item.children && !checkItemAccess(item.children)) {
            return false;
          }
        }
        return true;
      };

      if (!checkItemAccess(foundModule.items)) {
        isAuthorized = false;
      }
    } else {
      // Check standalone pages
      const foundStandalone = STANDALONE_PAGES.find(p => pathname.startsWith(p.path));
      if (foundStandalone) {
        if (!hasPermission(foundStandalone.requiredPermission)) {
          isAuthorized = false;
        }
      }
    }
  }

  if (authLoading) {
    return <LoadingSpinner message="Verifying session..." />;
  }

  if (!user) {
    router.push("/login");
    return <LoadingSpinner message="Redirecting to login..." />;
  }

  if (!isAuthorized) {
    return <LoadingSpinner message="Access restricted. Redirecting..." />;
  }

  return (
    <Layout style={{ height: "100vh", overflow: "hidden", background: 'var(--bg-pure-white)' }}>
      <TopNav
        activeModule={activeModule}
        onModuleChange={(module) => setActiveModule(module)}
        user={user}
        handleLogout={handleLogout}
        collapsed={collapsed}
      />

      <Layout style={{ marginTop: 64, background: 'var(--bg-pure-white)' }}>
        <SideNav
          activeModule={activeModule}
          collapsed={collapsed}
          onCollapse={toggleCollapsed}
        />

        <Content
          className="fade-in"
          style={{
            margin: 0,
            paddingLeft: noPadding ? 0 : "8px",
            paddingRight: noPadding ? 0 : "8px",
            // background: "#f5f5f5",
            background: 'var(--bg-pure-white)',
            marginLeft: collapsed ? 65 : 200,
            transition: "all 0.2s",
            height: "calc(100vh - 64px)",
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
          }}
        >
          {children}
        </Content>
        <TimerSocketListener />
      </Layout>
    </Layout>
  );
}
