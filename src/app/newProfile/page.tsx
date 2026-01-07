
"use client";
import PersonalDetails from "./personalDetails";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Tabs } from "antd";

import MainLayout from "@/components/layout/MainLayout";

import {
  EnvironmentOutlined,
  DashboardOutlined,
  UserOutlined,
  LaptopOutlined,
  FileTextOutlined,
  GiftOutlined,
  DollarOutlined,
  EditOutlined,
  BankOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { icons } from "antd/es/image/PreviewGroup";

const employeeData = {
  personalDetails: {
    fullName: "Abinash .A",
    employeeId: "EMP1001",
    gender: "Male",
    dateOfBirth: "1998-06-15",
    bloodGroup: "O+",
    maritalStatus: "Single",
    nationality: "Indian",
    personalEmail: "abinash.personal@gmail.com",
    mobileNumber: "+91 9876543210",
    workEmail: "abinash@company.com",
  },

  emergencyContact: {
    contactName: "Ravi Kumar",
    relationship: "Father",
    phoneNumber: "+91 9123456789",
  },

  address: {
    currentAddress: "No 12, Anna Nagar, Chennai, Tamil Nadu - 600040",
    permanentAddress: "No 45, MG Road, Madurai, Tamil Nadu - 625001",
  },

  identityDocuments: {
    aadharNumber: "1234 5678 9012",
    panNumber: "ABCDE1234F",
    passportNumber: "N1234567",
  },

  jobInformation: {
    designation: "Senior Software Developer",
    department: "Engineering",
    team: "Platform",
    employeeType: "Full Time",
    workLocation: "Chennai",
    workShift: "General (9:00 AM - 6:00 PM)",
    dateOfJoining: "2023-07-01",
    confirmationDate: "2024-01-01",
    reportingManager: "Smith",
  },

  employmentStatus: {
    currentStatus: "Active",
    probationStatus: "Completed",
    noticePeriod: "30 Days",
    gradeLevel: "L5",
  },

  bankAndPayroll: {
    uanNumber: "100200300400",
    pfNumber: "PF12345678",
    esiNumber: "ESI98765432",
    taxRegime: "New",
    paymentMode: "Bank Account",
  },
};

const NewProfilePage = () => {
  const [active, setActive] = React.useState("personal");

  const segments = [
    { key: "personal", label: "Personal Details", icon: <UserOutlined /> },
    { key: "employment", label: "Employment", icon: <BankOutlined /> },
    { key: "bank", label: "Bank & Payroll", icon: <DollarOutlined /> },
    { key: "compensation", label: "Compensation", icon: <GiftOutlined /> },
    { key: "documents", label: "Documents", icon: <FileTextOutlined /> },
    { key: "assets", label: "Assets", icon: <LaptopOutlined /> },
    {
      key: "leave&Attendance",
      label: "Leave & Attendance",
      icon: <LaptopOutlined />,
    },
    // { key: "performance", label: "Performance", icon: <LaptopOutlined /> },
    // { key: "timeLine", label: "Time Line", icon: <LaptopOutlined /> },
    // { key: "skills", label: "Skills", icon: <LaptopOutlined /> },
    // { key: "compliance", label: "Compliance", icon: <LaptopOutlined /> },
    // { key: "exit", label: "Exit", icon: <LaptopOutlined /> },
    // { key: "setting", label: "Settings", icon: <LaptopOutlined /> },
  ];

  const tabItems = segments.map((item) => ({
    key: item.key,
    label: (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          paddingBottom: "8px",
          fontSize: "15px",
        }}
      >
        <span style={{ fontSize: "18px" }}>{item.icon}</span>
        <span>{item.label}</span>
      </div>
    ),
  }));

  return (
    <MainLayout>
      <div style={{ display: "flex", gap: "30px" }}>
        {/* left Side  */}

        <div style={{ width: "25%" }}>
          <div style={{ width: "100%" }}>
            <div
              style={{
                width: "360px",
                height: "100vh", // ✅ device full height
                position: "fixed", // 🔥 important
                padding: "14px",
                background: "#ffffff",
                borderRadius: " 18px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                fontFamily: "Inter, sans-serif",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                overflow: "hidden", // ❌ no scroll
                zIndex: 1000, // stay above
              }}
            >
              {/* Profile Image */}
              <div
                style={{
                  width: "clamp(130px, 20vw, 160px)",
                  height: "clamp(130px, 20vw, 160px)",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1677ff, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "clamp(36px, 6vw, 46px)",
                  fontWeight: "700",
                  margin: "0 auto 10px", // ⬅ reduced
                }}
              >
                AB
              </div>

              <div
                style={{
                  //display: "flex",
                  alignItems: "center",
                  // justifyContent: "space-between",
                  gap: "10px", // ⬅ reduced
                  width: "100%",
                }}
              >
                <h2
                  style={{
                    margin: "0",
                    fontSize: "17px",
                    fontWeight: "700",
                  }}
                >
                  {employeeData.personalDetails.fullName}
                </h2>

                <span
                  style={{
                    padding: "3px 12px",
                    borderRadius: "999px",
                    backgroundColor: "#e8f9ee",
                    color: "#16a34a",
                    fontWeight: "600",
                    fontSize: "11px",
                    whiteSpace: "nowrap",
                  }}
                >
                  Active
                </span>
              </div>

              <p
                style={{ margin: "2px 0", color: "#6b7280", fontSize: "12px" }}
              >
                {employeeData.personalDetails.employeeId}
              </p>

              <p
                style={{
                  margin: "6px 0 0",
                  fontWeight: "600",
                  fontSize: "13px",
                }}
              >
                Senior Software Engineer
              </p>

              <p style={{ margin: "0", color: "#6b7280", fontSize: "12px" }}>
                Engineering
              </p>

              <div style={{ display: "grid", gap: "10px" }}>
                {[
                  {
                    label: "Work Location",
                    value: employeeData.jobInformation.workLocation,
                    icon: <EnvironmentOutlined />,
                  },
                  {
                    label: "Employment Type",
                    value: "Full-Time",
                    icon: <DashboardOutlined />,
                  },
                  {
                    label: "Reporting Manager",
                    value: "Saroja ",
                    icon: <UserOutlined />,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px",
                      borderRadius: "12px",
                      background: "#f9fafb",
                      borderRight: "4px solid #2563eb",
                    }}
                  >
                    {/* Icon Box */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background:
                          "linear-gradient(135deg, #1677ff, #3d79d9ff)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon && (
                        <span style={{ fontSize: "18px", color: "#fff" }}>
                          {item.icon}
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <div style={{ textAlign: "left" }}>
                      <p
                        style={{
                          margin: "0",
                          fontSize: "12px",
                          color: "#6b7280",
                        }}
                      >
                        {item.label}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontWeight: "600",
                          fontSize: "13px",
                        }}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ columnGap: "20px" }}>
                <button
                  style={{
                    width: "100%",
                    padding: "9px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #1677ff, #2c79edff)",
                    color: "#fff",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  <EditOutlined /> Edit Profile
                </button>

                <button
                  style={{
                    marginTop: "6px",
                    width: "100%",
                    padding: "9px",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    fontWeight: "600",
                    fontSize: "13px",
                  }}
                >
                  <DownloadOutlined /> Download Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side  */}
        <div style={{ width: "75%", background: "white" }}>
          <div
            style={{
              width: "100%",
              padding: "14px",
              minHeight: "100vh",
              overflowY: "auto",
              //position: "fixed",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%", // 🔥 NOT 100vh
                display: "flex",
                flexDirection: "column",
                overflow: "hidden", // 🔥 stop parent scroll
              }}
            >
              {/* 🔹 Tabs Section (FIXED) */}
              <Tabs
                activeKey={active}
                onChange={(key) => setActive(key)}
                items={tabItems}
                tabBarStyle={{
                  marginLeft: "-1px",
                  display: "flex",
                  alignItems: "center",
                  gap: "28px",
                  padding: "0 24px",
                  height: "64px",
                  width: "100%",
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  background: "#ffffff",
                  borderRadius: "18px",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
                  flexShrink: 0, // 🔥 tabs never shrink
                }}
                tabBarGutter={28}
                animated
              />

              {/* 🔹 Content Section (ONLY SCROLL HERE ✅) */}
              <div
                style={{
                  flex: 1, // 🔥 takes remaining height
                  overflowY: "auto", // 🔥 single scroll
                  padding: "14px",
                  marginTop: "12px",
                }}
              >
                {active === "personal" && <PersonalDetails />}
                {/* {active === "employment" && <Employment />} */}
                {/* {active === "bank" && <Bank />} */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
export default NewProfilePage;
