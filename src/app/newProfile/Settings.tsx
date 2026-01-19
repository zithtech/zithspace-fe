"use client";
import {
  SettingOutlined,
  LockOutlined,
  MobileOutlined,
  SafetyOutlined,
  LaptopOutlined,
  HeatMapOutlined,
  CheckCircleOutlined,
  BellOutlined,
  MailOutlined,
  MessageOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import { Switch, Button } from "antd";
import { LuMonitorCog } from "react-icons/lu";
import React, { useState } from "react";

const Settings = () => {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          borderRadius: "16px",
          border: "1.5px solid #1677ff",
          padding: "16px 18px",
          display: "flex",
          alignItems: "flex-start",
          gap: "14px",
          background: "#ffffff",
          boxSizing: "border-box",
        }}
      >
        {/* Icon */}
        <div
          style={{
            minWidth: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "#1677ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: "20px",
          }}
        >
          <SafetyOutlined />
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#111827",
              marginBottom: "4px",
            }}
          >
            Secure Banking Information
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              lineHeight: "1.5",
            }}
          >
            Your banking details are encrypted and protected. Any changes
            require verification and approval.
          </div>
        </div>
      </div>
      {/* top div */}
      <div style={{ display: "flex", gap: "20px" }}>
        {/* left side  */}
        <div
          style={{
            width: "50%",
            background: "#ffffff",
            borderRadius: "18px",
            padding: "16px",

            /* Elevation */
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06)",

            /* Optional border for premium look */
            border: "1px solid #e5e7eb",

            /* Smooth look */
            transition: "all 0.3s ease",
          }}
        >
          {/* head */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",

              padding: "16px 18px",
              background: "#ffffff",
              borderRadius: "16px",

              boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
              width: "100%",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#white",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              <LuMonitorCog style={{ color: "#1677ff" }} />
            </div>

            {/* Text */}
            <div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: "2px",
                }}
              >
                App Access
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#6b7280",
                }}
              >
                Control application access
              </div>
            </div>
          </div>

          {/* items */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              justifyContent: "space-between",
              padding: "16px 18px",
              background: "#ffffff",

              width: "100%",
            }}
          >
            {/* Icon */}
            <div style={{ display: "flex" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4f46e5",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                <MobileOutlined style={{ color: "#1677ff" }} />
              </div>
              {/* Text */}
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "2px",
                  }}
                >
                  Mobile App
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  Access via iOS/Android app
                </div>
              </div>
            </div>

            <Switch size="default" />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              justifyContent: "space-between",
              padding: "16px 18px",
              background: "#ffffff",

              width: "100%",
            }}
          >
            {/* Icon */}
            <div style={{ display: "flex" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4f46e5",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                <LaptopOutlined style={{ color: "#1677ff" }} />
              </div>
              {/* Text */}
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "2px",
                  }}
                >
                  Web Application
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  Browser-based access
                </div>
              </div>
            </div>

            <Switch />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              justifyContent: "space-between",
              padding: "16px 18px",
              background: "#ffffff",

              width: "100%",
            }}
          >
            {/* Icon */}
            <div style={{ display: "flex" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4f46e5",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                <HeatMapOutlined style={{ color: "#1677ff" }} />
              </div>
              {/* Text */}
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: "2px",
                  }}
                >
                  API Access
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                  }}
                >
                  Developer API integration
                </div>
              </div>
            </div>

            <Switch />
          </div>
        </div>

        {/* right side */}
        <div
          style={{
            width: "50%",
            background: "#ffffff",
            borderRadius: "18px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",

            /* Elevation */
            boxShadow:
              "0 4px 12px rgba(0,0,0,0.08), 0 12px 30px rgba(0,0,0,0.06)",

            /* Optional border for premium look */
            border: "1px solid #e5e7eb",

            /* Smooth look */
            transition: "all 0.3s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 18px",
              background: "#ffffff",
              borderRadius: "18px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
              width: "100%",
            }}
          >
            {/* Icon Box */}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "14px",
                background:
                  "linear-gradient(135deg, rgba(22,119,255,0.15), rgba(22,119,255,0.05))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#1677ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
              </svg>
            </div>

            {/* Text Content */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                Role & Permissions
              </span>
              <span
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                }}
              >
                Your access level
              </span>
            </div>
          </div>
          <span
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#1677ff",
              background:
                "linear-gradient(135deg, rgba(22,119,255,0.18), rgba(22,119,255,0.06))",
              border: "1px solid rgba(22,119,255,0.25)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              //boxShadow: "0 6px 18px rgba(22,119,255,0.15)",
            }}
          >
            Senior Software Engineer
          </span>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "12px" }}>View Employee Directory</p>
            <CheckCircleOutlined style={{ color: "green" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "12px" }}>Edit Own Profile</p>
            <CheckCircleOutlined style={{ color: "green" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "12px" }}>Submit Leave Requests</p>
            <CheckCircleOutlined style={{ color: "green" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "12px" }}>View Team Dashboard</p>
            <CheckCircleOutlined style={{ color: "green" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "12px" }}>Access Reports</p>
            <CheckCircleOutlined style={{ color: "green" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "12px" }}>Manage Team Members</p>
            <CheckCircleOutlined style={{ color: "green" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ fontSize: "12px" }}>Approve Expenses</p>
            <CheckCircleOutlined style={{ color: "green" }} />
          </div>
        </div>
      </div>

      {/* second div */}
      <div
        style={{
          display: "flex",
          gap: "24px",

          background: "#white",
        }}
      >
        {/* LEFT – Notifications */}
        <div
          style={{
            width: "50%",
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginBottom: "4px", fontWeight: "600" }}>
            Notifications
          </h3>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            Manage alert preferences
          </p>

          <p style={{ fontSize: "13px", fontWeight: 600, color: "#6b7280" }}>
            EMAIL NOTIFICATIONS
          </p>

          {/* Leave Request */}
          <div style={rowStyle}>
            <div>
              <div style={titleStyle}>Leave Request Updates</div>
              <div style={descStyle}>
                Get notified when your leave is approved or rejected
              </div>
            </div>
            <Switch />
          </div>

          {/* Payroll */}
          <div style={rowStyle}>
            <div>
              <div style={titleStyle}>Payroll Notifications</div>
              <div style={descStyle}>
                Salary credit and payslip availability
              </div>
            </div>
            <Switch />
          </div>

          {/* Policy */}
          <div style={rowStyle}>
            <div>
              <div style={titleStyle}>Policy Updates</div>
              <div style={descStyle}>
                New policies and compliance requirements
              </div>
            </div>
            <Switch />
          </div>

          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#6b7280",
              marginTop: "28px",
            }}
          >
            PUSH NOTIFICATIONS
          </p>

          {/* Messages */}
          <div style={rowStyle}>
            <div>
              <div style={titleStyle}>Direct Messages</div>
              <div style={descStyle}>
                Messages from team members and managers
              </div>
            </div>
            <Switch />
          </div>

          {/* Meetings */}
          <div style={rowStyle}>
            <div>
              <div style={titleStyle}>Meeting Reminders</div>
              <div style={descStyle}>Upcoming meetings and calendar events</div>
            </div>
            <Switch />
          </div>

          {/* Tasks */}
          <div style={rowStyle}>
            <div>
              <div style={titleStyle}>Task Assignments</div>
              <div style={descStyle}>New tasks and deadline reminders</div>
            </div>
            <Switch />
          </div>
        </div>

        {/* RIGHT – Security */}
        <div
          style={{
            width: "50%",
            background: "#fff",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <h3 style={{ marginBottom: "4px", fontWeight: "600" }}>Security</h3>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            Account security settings
          </p>

          <Button
            block
            style={{
              height: "48px",
              textAlign: "left",
              marginBottom: "12px",
              borderRadius: "10px",
              fontWeight: 500,
            }}
          >
            Change Password
          </Button>

          <Button
            block
            style={{
              height: "48px",
              textAlign: "left",
              borderRadius: "10px",
              fontWeight: 500,
            }}
          >
            Enable Two-Factor Authentication
          </Button>

          <hr style={{ margin: "24px 0", borderColor: "#e5e7eb" }} />

          <p style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>
            ACTIVE SESSIONS
          </p>

          {/* Session 1 */}
          <div style={sessionStyle}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "12px" }}>
                MacBook Pro
              </div>
              <div style={descStyle}>Chrome · Gurugram, India</div>
            </div>
            <span style={badgeStyle}>Current</span>
          </div>

          {/* Session 2 */}
          <div style={sessionStyle}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "12px" }}>
                iPhone 15 Pro
              </div>
              <div style={descStyle}>Safari iOS · Gurugram, India</div>
            </div>
            <span style={{ color: "#6b7280", fontSize: "12px" }}>
              2 hours ago
            </span>
          </div>
        </div>
      </div>

      {/* down div */}
      <div
        style={{
          width: "100%",
          background: "#whie",
          borderRadius: "18px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
        }}
      >
        {/* LEFT SIDE */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* ICON */}
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "#E6F9F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              color: "#10B981",
            }}
          >
            ✓
          </div>

          {/* TEXT */}
          <div>
            <div style={{ fontSize: "16px", fontWeight: 600 }}>
              Account Status
            </div>
            <div style={{ fontSize: "13px", color: "#6B7280" }}>
              Your account is active and in good standing
            </div>
          </div>
        </div>

        {/* RIGHT SIDE BADGE */}
        <div
          style={{
            background: "#E6F9F0",
            color: "#059669",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Active
        </div>
      </div>
    </div>
  );
};

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 0",
  borderBottom: "1px solid #f1f1f1",
};

const titleStyle = {
  fontWeight: 600,
  fontSize: "12px",
};

const descStyle = {
  fontSize: "11px",
  color: "#6b7280",
};

const switchStyle = {
  width: "42px",
  height: "22px",
};

const sessionStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 0",
};

const badgeStyle = {
  background: "#d1fae5",
  color: "#047857",
  fontSize: "12px",
  padding: "4px 10px",
  borderRadius: "20px",
};

export default Settings;
