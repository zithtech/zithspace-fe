"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Layout, App as AntApp } from "antd";
import LoadingSpinner from "../common/LoadingSpinner";
import TopNav from "./TopNav";
import SideNav from "./SideNav";
import { NAVIGATION_CONFIG, ModuleType } from "./navigationConfig";

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout, isLoading: authLoading } = useAuth();
  const { notification } = AntApp.useApp();

  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [activeModule, setActiveModule] = useState<ModuleType>("WORK");

  // Determine active module based on current path
  useEffect(() => {
    if (!pathname) return;

    // Find module that matches the path prefix
    const foundModule = NAVIGATION_CONFIG.find((module) =>
      module.pathPrefixes.some((prefix) => pathname.startsWith(prefix)),
    );

    if (foundModule) {
      setActiveModule(foundModule.key);
    }
  }, [pathname]);

  // Connect to user stream for global notifications
  useEffect(() => {
    if (user?.id) {
      const { streamClient } = require("@/services/streamClient");

      streamClient.connectUser(user.id);

      streamClient.onNotification((data: any) => {
        if (pathname.includes(`/chat/${data.channelId}`)) return;

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

  if (authLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <TopNav
        activeModule={activeModule}
        onModuleChange={(module) => setActiveModule(module)}
        user={user}
        handleLogout={handleLogout}
        collapsed={collapsed}
      />

      <Layout style={{ marginTop: 64 }}>
        <SideNav
          activeModule={activeModule}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />

        <Content
          style={{
            margin: 0,
            padding: 0,
            paddingLeft:22,
            // background: "#f5f5f5",
            background: "white",
            marginLeft: collapsed ? 60 : 240,
            transition: "all 0.2s",
            height: "calc(100vh - 64px)",
            overflow: "auto",
            position: "relative",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
