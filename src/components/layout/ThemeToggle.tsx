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
        className="nav-action-btn"
        icon={theme === "light" ? <MoonOutlined /> : <SunOutlined />}
        onClick={toggleTheme}
        style={{ fontSize: "16px" }}
      />
    </Tooltip>
  );
};

export default ThemeToggle;
