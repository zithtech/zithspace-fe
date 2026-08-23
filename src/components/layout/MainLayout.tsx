"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Layout, App as AntApp, theme } from "antd";
import ZukvoLoader from "../common/ZukvoLoader";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import { ModuleType, standalonePagesFor } from "./navigationConfig";
import { useProduct } from "@/context/ProductContext";
import { useProductNavigation } from "@/hooks/useProductNavigation";
import { useLayout } from "@/context/LayoutContext";
import { useTicketSocketEvents } from "@/hooks/useTicketSocketEvents";
import { useDocumentSocketEvents } from "@/hooks/useDocumentSocketEvents";
import { TimerSocketListener } from "../time-tracking/TimerSocketListener";
import { useSocket } from "@/providers/SocketProvider";

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
  hideSideNav?: boolean;
}

export default function MainLayout({ children, noPadding, hideSideNav }: MainLayoutProps) {
  const { token } = theme.useToken();
  const { user, logout, isLoading: authLoading, hasPermission, hasAnyPermission, hasAnySubscriptionFeature } = useAuth();
  const { notification } = AntApp.useApp();
  const { socket } = useSocket();

  const router = useRouter();
  const pathname = usePathname();
  const { collapsed, toggleCollapsed } = useLayout();
  const { manifest } = useProduct();
  const { modules: navigation, standalonePages, deniedPrefixes } = useProductNavigation();

  /**
   * Is this path excluded on this surface?
   *
   * Deny only when the path matches an excluded prefix AND no allowed one — an
   * excluded prefix can legitimately be a prefix of something still reachable,
   * and rejecting on the exclusion alone would lock people out of pages they do
   * have. Presentation only: the API enforces the same boundary independently.
   */
  const isDeniedPath = React.useCallback(
    (path: string): boolean => {
      const matches = (p: string) => path === p || path.startsWith(`${p}/`);
      if (!deniedPrefixes.some(matches)) return false;

      const allowed =
        navigation.some((m) => m.pathPrefixes.some(matches)) ||
        standalonePages.some((p) => matches(p.path));
      return !allowed;
    },
    [deniedPrefixes, navigation, standalonePages],
  );

  // "WORK" is the right landing module for Zukvo but may not exist on every
  // surface, so seed from whatever this one actually renders first.
  const [activeModule, setActiveModule] = useState<ModuleType>(
    () => (navigation.find((m) => m.key === "WORK") ?? navigation[0])?.key ?? "HOME",
  );

  // Global socket event listeners
  useTicketSocketEvents();
  useDocumentSocketEvents();

  // Determine active module based on current path
  useEffect(() => {
    if (!pathname) return;
    if (authLoading || !user) return;

    // Excluded on this surface — checked FIRST and independently of the module
    // lookup below, which only ever sees routes this surface still has.
    if (isDeniedPath(pathname)) {
      router.replace(manifest.homeRoute);
      return;
    }

    // Find module that matches the path prefix
    const foundModule = navigation.find((module) =>
      module.pathPrefixes.some((prefix) => pathname.startsWith(prefix)),
    );

    if (foundModule) {
      // Check if user has permission and subscription for this module
      const hasSubAccess = foundModule.requiredSubscriptionFeature
        ? hasAnySubscriptionFeature(...foundModule.requiredSubscriptionFeature)
        : true;

      const hasPermAccess = !foundModule.requiredPermission && !foundModule.requiredAnyPermission
        ? true
        : foundModule.requiredPermission
          ? hasPermission(foundModule.requiredPermission)
          : foundModule.requiredAnyPermission ? hasAnyPermission(...foundModule.requiredAnyPermission) : true;

      const hasAccess = hasSubAccess && hasPermAccess;

      if (foundModule.key !== "HOME" && !hasAccess && pathname !== manifest.homeRoute) {
        router.push(manifest.homeRoute);
        return;
      }

      // Deep check for specific item permission, inheriting parent denial
      const checkItemAccess = (items: any[], isParentDenied = false): boolean => {
        for (const item of items) {
          const hasItemSubAccess = item.requiredSubscriptionFeature
            ? hasAnySubscriptionFeature(...item.requiredSubscriptionFeature)
            : true;

          const hasItemPermAccess = !item.requiredPermission && !item.requiredAnyPermission
            ? true
            : item.requiredPermission
              ? hasPermission(item.requiredPermission)
              : item.requiredAnyPermission ? hasAnyPermission(...item.requiredAnyPermission) : true;

          const itemAccess = hasItemSubAccess && hasItemPermAccess;
          const isCurrentlyDenied = isParentDenied || !itemAccess;

          // If this is a routable leaf node and matches the current path
          if (item.path && pathname.startsWith(item.path)) {
            if (isCurrentlyDenied) return false;
          }

          // Recurse into children
          if (item.children && !checkItemAccess(item.children, isCurrentlyDenied)) {
            return false;
          }
        }
        return true;
      };

      if (!checkItemAccess(foundModule.items)) {
        router.push(manifest.homeRoute);
        return;
      }

      setActiveModule(foundModule.key);
    } else {
      // Check standalone pages
      const foundStandalone = standalonePages.find(p => pathname.startsWith(p.path));
      if (foundStandalone) {
        const hasSubAccess = foundStandalone.requiredSubscriptionFeature 
          ? hasAnySubscriptionFeature(...foundStandalone.requiredSubscriptionFeature)
          : true;
        const hasPermAccess = !foundStandalone.requiredPermission && !foundStandalone.requiredAnyPermission
          ? true
          : foundStandalone.requiredPermission
            ? hasPermission(foundStandalone.requiredPermission)
            : foundStandalone.requiredAnyPermission ? hasAnyPermission(...foundStandalone.requiredAnyPermission) : true;
        
        if (!hasSubAccess || !hasPermAccess) {
          router.push(manifest.homeRoute);
          return;
        }
      }
    }
  }, [pathname, user, authLoading, hasPermission, hasAnyPermission, hasAnySubscriptionFeature, navigation, manifest, standalonePages, isDeniedPath, router]);

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
    // Surface exclusion, checked synchronously for the same reason the rest of
    // this block exists: the effect above redirects, but not before React has
    // already painted a frame of a page this surface should not show.
    if (isDeniedPath(pathname)) {
      isAuthorized = false;
    }

    const foundModule = navigation.find((module) =>
      module.pathPrefixes.some((prefix) => pathname.startsWith(prefix)),
    );

    if (foundModule) {
      const hasSubAccess = foundModule.requiredSubscriptionFeature
        ? hasAnySubscriptionFeature(...foundModule.requiredSubscriptionFeature)
        : true;

      const hasPermAccess = !foundModule.requiredPermission && !foundModule.requiredAnyPermission
        ? true
        : foundModule.requiredPermission
          ? hasPermission(foundModule.requiredPermission)
          : foundModule.requiredAnyPermission ? hasAnyPermission(...foundModule.requiredAnyPermission) : true;

      const hasAccess = hasSubAccess && hasPermAccess;

      if (foundModule.key !== "HOME" && !hasAccess && pathname !== manifest.homeRoute) {
        isAuthorized = false;
      }

      // Deep check for specific item permission, inheriting parent denial
      const checkItemAccess = (items: any[], isParentDenied = false): boolean => {
        for (const item of items) {
          const hasItemSubAccess = item.requiredSubscriptionFeature
            ? hasAnySubscriptionFeature(...item.requiredSubscriptionFeature)
            : true;

          const hasItemPermAccess = !item.requiredPermission && !item.requiredAnyPermission
            ? true
            : item.requiredPermission
              ? hasPermission(item.requiredPermission)
              : item.requiredAnyPermission ? hasAnyPermission(...item.requiredAnyPermission) : true;

          const itemAccess = hasItemSubAccess && hasItemPermAccess;
          const isCurrentlyDenied = isParentDenied || !itemAccess;

          // If this is a routable leaf node and matches the current path
          if (item.path && pathname.startsWith(item.path)) {
            if (isCurrentlyDenied) return false;
          }

          // Recurse into children
          if (item.children && !checkItemAccess(item.children, isCurrentlyDenied)) {
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
      const foundStandalone = standalonePages.find(p => pathname.startsWith(p.path));
      if (foundStandalone) {
        const hasSubAccess = foundStandalone.requiredSubscriptionFeature 
          ? hasAnySubscriptionFeature(...foundStandalone.requiredSubscriptionFeature)
          : true;
        const hasPermAccess = !foundStandalone.requiredPermission && !foundStandalone.requiredAnyPermission
          ? true
          : foundStandalone.requiredPermission
            ? hasPermission(foundStandalone.requiredPermission)
            : foundStandalone.requiredAnyPermission ? hasAnyPermission(...foundStandalone.requiredAnyPermission) : true;
        
        if (!hasSubAccess || !hasPermAccess) {
          isAuthorized = false;
        }
      }
    }
  }

  // These three render before the app chrome exists, so they fill the whole
  // viewport rather than the content area beneath the header.
  if (authLoading) {
    return <ZukvoLoader size="lg" fullscreen="viewport" message="Verifying session…" />;
  }

  if (!user) {
    router.push("/login");
    return <ZukvoLoader size="lg" fullscreen="viewport" message="Redirecting to login…" />;
  }

  if (!isAuthorized) {
    return <ZukvoLoader size="lg" fullscreen="viewport" message="Access restricted. Redirecting…" />;
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

      <Layout style={{ marginTop: 60, background: 'var(--bg-pure-white)' }}>
        {!hideSideNav && (
          <SideNav
            activeModule={activeModule}
            collapsed={collapsed}
            onCollapse={toggleCollapsed}
          />
        )}

        <Content
          className="fade-in"
          style={{
            margin: 0,
            paddingLeft: noPadding ? 0 : "8px",
            paddingRight: noPadding ? 0 : "8px",
            // background: "#f5f5f5",
            background: 'var(--bg-pure-white)',
            marginLeft: hideSideNav ? 0 : collapsed ? 52 : 200,
            transition: "all 0.2s",
            height: "calc(100vh - 60px)",
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
