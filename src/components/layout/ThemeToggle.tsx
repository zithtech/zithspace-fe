"use client";

import React from "react";
import { Button, Tooltip } from "antd";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useTheme } from "@/context/ThemeContext";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Tooltip title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
      <Button
        type="text"
        icon={theme === "light" ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          width: "36px",
          height: "36px",
          borderRadius: "8px",
          transition: "all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1)",
        }}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
