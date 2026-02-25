"use client";

import React, { useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { Segmented, Card, Tabs } from "antd";
import PersonalDetails from "@/components/new-profile/personaldetailes";
import BankAndPayroll from "@/components/new-profile/bankAndPayroll";
import EmployeeHistory from "@/components/new-profile/employeeHistory";
import { ProfileService } from "@/services/newProfile";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/authService";

const NewProfilePage = () => {
  //const [name, setName] = useState("");
  const [selectedTab, setSelectedTab] = useState("personal");
  const { user, isLoading } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await AuthService.getProfile();
        setProfile(data);
        console.log("Profile data:", data);
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const color = {
    primary: "#1677ff",
    primaryLight: "#e6f4ff",
    primaryHover: "#0958d9",
    border: "#d9d9d9",
    borderLight: "#f0f0f0",
    bg: "#f5f5f5",
    bgCard: "#ffffff",
    text: "#262626",
    textSecondary: "#595959",
    textMuted: "#8c8c8c",
    textLight: "#bfbfbf",
    danger: "#ff4d4f",
    green: "#52c41a",
    purple: "#722ed1",
    purpleLight: "#f9f0ff",
  };

  const radius = { sm: "6px", md: "8px", lg: "12px", full: "9999px" };

  const shadow = {
    card: "0 1px 2px 0 rgba(0,0,0,0.03),0 1px 6px -1px rgba(0,0,0,0.02),0 2px 4px 0 rgba(0,0,0,0.02)",
    float:
      "0 6px 16px 0 rgba(0,0,0,0.08),0 3px 6px -4px rgba(0,0,0,0.12),0 9px 28px 8px rgba(0,0,0,0.05)",
    input: "0 0 0 2px rgba(22,119,255,0.2)",
  };

  interface InfoCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
  }

  const InfoCard: React.FC<InfoCardProps> = ({ icon, label, value }) => {
    const [hover, setHover] = useState(false);

    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px", // 👈 Reduced padding
          borderRadius: "8px", // 👈 Smaller radius
          background: "#f5f5f5",
          border: "1px solid #e5e5e5",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: hover
            ? "0 4px 10px rgba(0,0,0,0.06)"
            : "0 1px 2px rgba(0,0,0,0.03)",
          transform: hover ? "translateY(-2px)" : "translateY(0px)",
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px", // 👈 Reduced
              height: "24px", // 👈 Reduced
              borderRadius: "6px",
              background: "#e6f0ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px", // 👈 Smaller icon
            }}
          >
            {icon}
          </div>

          <span
            style={{
              fontSize: "13px", // 👈 Reduced
              fontWeight: 500,
              color: "#595959",
            }}
          >
            {label}
          </span>
        </div>

        {/* Right */}
        <span
          style={{
            fontSize: "12px", // 👈 Reduced
            background: "#f0f0f0",
            padding: "3px 8px", // 👈 Reduced
            borderRadius: "4px",
            fontWeight: 600,
            color: "#262626",
          }}
        >
          {value}
        </span>
      </div>
    );
  };

  return (
    <MainLayout>
      {" "}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          // padding: "10px",
          gap: "10px",
          position: "relative",
          height: "100vh",
          width: "100%",
          background: "#f5f5f5",
          overflow: "hidden",
        }}
      >
        {/* left Side Div */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "20%", // 👈 Reduced from 25%
            height: "100vh",
            background: "white",
            position: "fixed",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <h2
              style={{
                paddingTop: "20px",
                margin: "0 0 4px",
                fontSize: "17px", // 👈 Slightly reduced
                fontWeight: 600,
                color: color.text,
              }}
            >
              Employee Profile
            </h2>
            <p style={{ margin: 0, fontSize: "14px", color: color.textMuted }}>
              Employee personal information
            </p>
          </div>

          {/* Profile Card */}
          <div
            style={{
              background: color.bgCard,
              borderRadius: radius.md,
              border: `1px solid ${color.border}`,
              boxShadow: shadow.card,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              width: "75%", // 👈 Reduced from 85%
              height: "280px", // 👈 Reduced from 320px
              //gap: "6px",
            }}
          >
            {/* Cover Image */}
            <div
              style={{
                height: "55%", // 👈 Slightly reduced
                width: "100%",
                overflow: "hidden",
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e"
                alt="Employee"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            {/* Content */}
            <div
              style={{
                height: "45%",
                //padding: "12px", // 👈 Reduced padding
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textAlign: "center",
              }}
            >
              <div>
                <h1
                  style={{
                    margin: "0 0 3px",
                    fontSize: "14px", // 👈 Smaller font
                    fontWeight: 600,
                    color: color.text,
                  }}
                >
                  Alex Morgan
                </h1>

                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "10px",
                    color: color.textMuted,
                    fontWeight: 500,
                  }}
                >
                  EMP-2024-892
                </p>

                {/* Badges */}
                <div
                  style={{
                    display: "flex",
                    gap: "4px",
                    flexWrap: "wrap",
                    marginBottom: "6px",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "9px",
                      fontWeight: 500,
                      background: color.primaryLight,
                      color: color.primary,
                    }}
                  >
                    Senior Developer
                  </span>

                  <span
                    style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      fontSize: "9px",
                      fontWeight: 500,
                      background: "#f5f5f5",
                      color: color.textSecondary,
                    }}
                  >
                    4 Years Exp
                  </span>
                </div>
              </div>

              {/* Dept / Location */}
              <div
                style={{
                  borderTop: `1px solid ${color.borderLight}`,

                  paddingBottom: "6px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      margin: "0 0 3px",
                      fontSize: "8px",
                      textTransform: "uppercase",
                      color: color.textLight,
                      fontWeight: 600,
                    }}
                  >
                    Department
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      fontWeight: 500,
                      color: color.textSecondary,
                    }}
                  >
                    Engineering
                  </p>
                </div>

                <div
                  style={{
                    textAlign: "center",
                    borderLeft: `1px solid ${color.borderLight}`,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 3px",
                      fontSize: "8px",
                      textTransform: "uppercase",
                      color: color.textLight,
                      fontWeight: 600,
                    }}
                  >
                    Location
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "11px",
                      fontWeight: 500,
                      color: color.textSecondary,
                    }}
                  >
                    New York, USA
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Cards */}
          <div
            style={{
              display: "flex",
              paddingTop: "40px",
              gap: "17px",
              flexDirection: "column",
              width: "85%",
            }}
          >
            <InfoCard icon="📅" label="Date of Joining" value="12 Jan 2020" />
            <InfoCard icon="🏢" label="Department" value="Engineering" />
          </div>
        </div>

        {/* right Side div */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            background: "white",
            width: "80%",
            height: "100vh",
            marginLeft: "22%",
            padding: "10px",
            gap: "12px",
          }}
        >
          {/* 🔹 Header */}
          <div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: "18px",
                fontWeight: 700,
                color: color.text,
              }}
            >
              Employee Details
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: color.textMuted }}>
              View employee information...!
            </p>
          </div>

          {/* 🔹 Segmented + Content Wrapper */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              overflow: "auto",
            }}
          >
            <Tabs
              activeKey={selectedTab}
              onChange={(key) => setSelectedTab(key)}
              items={[
                {
                  key: "personal",
                  label: "Personal Details",
                  children: (
                    <div
                      style={{
                        height: "100%",
                        overflowY: "auto",
                        paddingRight: "6px",
                      }}
                    >
                      <PersonalDetails />
                    </div>
                  ),
                },
                {
                  key: "bank",
                  label: "Bank & Payroll",
                  children: (
                    <div
                      style={{
                        height: "100%",
                        overflowY: "auto",
                        paddingRight: "6px",
                      }}
                    >
                      <BankAndPayroll />
                    </div>
                  ),
                },
                {
                  key: "history",
                  label: "History",
                  children: (
                    <div
                      style={{
                        height: "100%",
                        overflowY: "auto",
                        paddingRight: "6px",
                      }}
                    >
                      <EmployeeHistory />
                    </div>
                  ),
                },
              ]}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>{" "}
    </MainLayout>
  );
};
export default NewProfilePage;
