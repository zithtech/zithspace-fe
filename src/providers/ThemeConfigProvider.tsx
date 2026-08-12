"use client";

import React from "react";
import { ConfigProvider, theme as antdTheme } from "antd";
import { useTheme } from "@/context/ThemeContext";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const ThemeConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { theme } = useTheme();

  return (
    <ConfigProvider
      spin={{ indicator: <ZukvoLoader size="md" /> }}
      theme={{
        algorithm:
          theme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          // Primary colors (Vivid SaaS Blue)
          colorPrimary: "#3B82F6",
          colorSuccess: "#10B981",
          colorWarning: "#F59E0B",
          colorError: "#EF4444",
          colorInfo: "#3B82F6",

          // Backgrounds & Surface
          colorBgContainer: theme === "dark" ? "#0B0F1A" : "#ffffff",
          colorBgLayout: theme === "dark" ? "#0B0F1A" : "#ffffff",

          // Borders
          colorBorder: theme === "dark" ? "#1E293B" : "#E2E8F0",

          colorBorderSecondary: theme === "dark" ? "#1E293B" : "#E8E8E8",

          // Layout
          borderRadius: 12,
          wireframe: false,

          // Typography
          fontSize: 14,
          colorText: theme === "dark" ? "#F1F5F9" : "#1E293B",
          colorTextSecondary: theme === "dark" ? "#94A3B8" : "#64748B",
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

          // Spacing
          padding: 16,
          paddingXS: 4,
          paddingSM: 8,
          paddingLG: 24,

          // Shadows (Luxury multi-layered)
          boxShadow:
            theme === "dark"
              ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.05)"
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          boxShadowSecondary:
            theme === "dark"
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
              : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        },
        components: {
          Table: {
            headerBg: theme === "dark" ? "#1E293B" : "#ffffff",
            headerColor: theme === "dark" ? "#F1F5F9" : "#1E293B",
            rowHoverBg: theme === "dark" ? "#1E293B" : "#f5f5f5",
            cellPaddingBlock: 12,
          },
          Form: {
            itemMarginBottom: 20,
          },
          Button: {
            borderRadius: 10,
            fontWeight: 600,
            controlHeight: 38,
          },
          Input: {
            borderRadius: 10,
            controlHeight: 38,
            activeBorderColor: "#3B82F6",
          },
          Modal: {
            borderRadiusLG: 16,
            contentBg: theme === "dark" ? "#131B2D" : "#ffffff",
            headerBg: "transparent",
            footerBg: "transparent",
          },
          Card: {
            borderRadiusLG: 16,
            headerBg: theme === "dark" ? "#131B2D" : "#ffffff",
          },
          Tooltip: {
            colorBgSpotlight: theme === "dark" ? "rgba(15, 23, 42, 0.96)" : "#ffffff",
            colorTextLightSolid: theme === "dark" ? "#F1F5F9" : "#1E293B",
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ThemeConfigProvider;
