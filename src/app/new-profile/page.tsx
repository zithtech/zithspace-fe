"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";

const NewProfilePage = () => {
  //const [name, setName] = useState("");

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

  const InfoCard = ({
    icon,
    label,
    value,
  }: {
    icon: any;
    label: any;
    value: any;
  }) => {
    const [hover, setHover] = useState(false);

    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 20px",
          borderRadius: "12px",
          background: "#f5f5f5",
          border: "1px solid #e5e5e5",
          cursor: "pointer",
          transition: "all 0.3s ease",
          boxShadow: hover
            ? "0 8px 20px rgba(0,0,0,0.08)"
            : "0 1px 3px rgba(0,0,0,0.04)",
          transform: hover ? "translateY(-4px)" : "translateY(0px)",
        }}
      >
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#e6f0ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            {icon}
          </div>

          <span
            style={{
              fontSize: "16px",
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
            fontSize: "16px",
            background: "#f0f0f0",
            padding: "4px 12px",
            borderRadius: "6px",
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
            width: "25%",
            height: "100vh",
            background: "white",
            position: "fixed",
            //padding: "20px",
            gap: "12px",
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <h2
              style={{
                margin: "0 0 4px",
                fontSize: "21px",
                fontWeight: 600,
                color: color.text,
              }}
            >
              Employee Profile
            </h2>
            <p style={{ margin: 0, fontSize: "18px", color: color.textMuted }}>
              Manage your personal information
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
              width: "80%",

              height: "370px",
              gap: "12px", // 👈 Fixed height
            }}
          >
            {/* 🔥 Top 40% Cover Image */}
            <div
              style={{
                height: "70%",
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

            {/* 🔥 Bottom 60% Content */}
            <div
              style={{
                height: "30%",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textAlign: "center",
              }}
            >
              <div>
                <h1
                  style={{
                    margin: "0 0 4px",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: color.text,
                  }}
                >
                  Alex Morgan
                </h1>

                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: "12px",
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
                    gap: "6px",
                    flexWrap: "wrap",
                    marginBottom: "12px",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 500,
                      background: color.primaryLight,
                      color: color.primary,
                      border: `1px solid #bae0ff`,
                    }}
                  >
                    Senior Developer
                  </span>
                  <span
                    style={{
                      padding: "2px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 500,
                      background: "#f5f5f5",
                      color: color.textSecondary,
                      border: `1px solid ${color.borderLight}`,
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
                  paddingTop: "12px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: color.textLight,
                      fontWeight: 600,
                    }}
                  >
                    Department
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
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
                      margin: "0 0 4px",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: color.textLight,
                      fontWeight: 600,
                    }}
                  >
                    Location
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
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
          {/* date of joining card */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexDirection: "column",
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
            background: "white",
            // width: "75%",
            height: "100vh",
            marginLeft: "26%",
            width: "calc(100% - 25%)",
            padding: "20px",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: "22px",
                fontWeight: 700,
                color: color.text,
                display: "flex",
                gap: "6px",
              }}
            >
              Employee Details
            </h1>
            <p style={{ margin: 0, fontSize: "16px", color: color.textMuted }}>
              View employee information...!
            </p>
          </div>

          {/* end div */}
        </div>
      </div>{" "}
    </MainLayout>
  );
};
export default NewProfilePage;
