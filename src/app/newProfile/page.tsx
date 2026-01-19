"use client";
import PersonalDetails from "./PersonalDetails";
import Employment from "./Employment";
import BankAndPayroll from "./BankAndPayroll";
import Settings from "./Settings";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Tabs, Segmented, Button, Badge } from "antd";

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
  RiseOutlined,
  FieldTimeOutlined,
  HeatMapOutlined,
  DeploymentUnitOutlined,
  CodeSandboxOutlined,
  SettingOutlined,
  LogoutOutlined,
  LeftOutlined,
  RightOutlined,
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState("https://i.pravatar.cc/300");
  const segmentRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    segmentRef.current?.scrollBy({
      left: -470,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    segmentRef.current?.scrollBy({
      left: 470,
      behavior: "smooth",
    });
  };

  // Image picker
  const handleClick = () => {
    fileInputRef.current?.click(); // 🔥 open file manager
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(URL.createObjectURL(file)); // preview image
    }
  };
  const segments = [
    {
      key: "personal",
      label: "Personal Details",
      icon: <UserOutlined style={{ fontSize: "14px" }} />,
    },
    { key: "employment", label: "Employment", icon: <BankOutlined /> },
    { key: "bank", label: "Bank & Payroll", icon: <DollarOutlined /> },
    { key: "setting", label: "Settings", icon: <SettingOutlined /> },
    { key: "compensation", label: "Compensation", icon: <GiftOutlined /> },
    { key: "documents", label: "Documents", icon: <FileTextOutlined /> },
    { key: "assets", label: "Assets", icon: <LaptopOutlined /> },
    {
      key: "leave&Attendance",
      label: "Leave & Attendance",
      icon: <HeatMapOutlined />,
    },
    { key: "performance", label: "Performance", icon: <RiseOutlined /> },
    { key: "timeLine", label: "Time Line", icon: <FieldTimeOutlined /> },
    { key: "skills", label: "Skills", icon: <DeploymentUnitOutlined /> },
    { key: "compliance", label: "Compliance", icon: <CodeSandboxOutlined /> },
    { key: "exit", label: "Exit", icon: <LogoutOutlined /> },
  ];

  // const tabItems = segments.map((item) => ({
  //   key: item.key,
  //   label: (
  //     <div
  //       style={{
  //         display: "flex",
  //         alignItems: "center",
  //         gap: "8px",
  //         fontSize: "12px",
  //         whiteSpace: "nowrap", // 🔥 important
  //       }}
  //     >
  //       <span style={{ fontSize: "14px" }}>{item.icon}</span>
  //       <span>{item.label}</span>
  //     </div>
  //   ),
  // }));

  const segmentOptions = segments.map((item) => ({
    value: item.key,
    label: (
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontWeight: "400",
          color: active === item.key ? "#1677ff" : "#000", // 👈 ACTIVE BLUE
        }}
      >
        {item.icon}
        {item.label}
      </span>
    ),
  }));

  return (
    <MainLayout>
      <div
        style={{
          display: "flex",
          height: "100%",
          gap: "20px",
          background: "white",
        }}
      >
        {/* left Side  */}

        <div style={{ width: "20%" }}>
          <Badge.Ribbon
            text="Active"
            placement="end"
            style={{
              color: "#white",
              backgroundColor: " #34eb40",
              boxShadow: "6px 0 12px rgba(0, 0, 0, 0.15)",
              border: "1px solid rgba(22, 119, 255, 0.4)",
              fontSize: "12px",
              fontWeight: 600,
              zIndex: 1100, // 👈 VERY IMPORTANT
            }}
          >
            {/* ✅ Wrapper div */}
            <div
              style={{
                position: "fixed", // 👈 REQUIRED
                overflow: "visible", // 👈 REQUIRED
                height: "100vh",
              }}
            >
              {/* ❌ fixed removed here */}
              <div
                style={{
                  width: "280px",
                  height: "100vh",
                  padding: "14px",
                  background: "#ffffff",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
                  fontFamily: "Inter, sans-serif",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  zIndex: 1000,
                }}
              >
                {/* Profile Image */}

                <div
                  onClick={handleClick}
                  style={{
                    width: "clamp(130px, 10vw, 160px)",
                    height: "clamp(130px, 10vw, 160px)",
                    borderRadius: "50%",
                    background: "#1677ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    margin: "0 auto 10px",
                    cursor: "pointer", // 👆 clickable feel
                  }}
                >
                  <img
                    src={image}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: "none" }} // 🔥 hidden
                />

                <div>
                  <h2
                    style={{
                      margin: "0",
                      fontSize: "17px",
                      fontWeight: "700",
                    }}
                  >
                    {employeeData.personalDetails.fullName}
                  </h2>

                  <p
                    style={{
                      margin: "2px 0",
                      fontSize: "12px",
                    }}
                  >
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(22, 119, 255, 0.12)", // transparent #1677ff
                        color: "#1677ff",
                        border: "1px solid rgba(22, 119, 255, 0.35)",
                        fontWeight: 500,
                      }}
                    >
                      {employeeData.personalDetails.employeeId}
                    </span>
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

                  <p
                    style={{ margin: "0", color: "#6b7280", fontSize: "12px" }}
                  >
                    Engineering
                  </p>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
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
                        // borderRight: "4px solid #2563eb",
                        borderLeft: "4px solid #2563eb",
                      }}
                    >
                      {/* Icon Box */}
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          // borderRadius: "10px",
                          background: "white",
                          display: "flex",
                          //border: "1px solid #1677ff",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {item.icon && (
                          <span style={{ fontSize: "14px", color: "#1677ff" }}>
                            {item.icon}
                          </span>
                        )}
                      </div>

                      {/* Text */}
                      <div style={{ textAlign: "left" }}>
                        <p
                          style={{
                            margin: "0",
                            fontSize: "10px",
                            color: "#6b7280",
                          }}
                        >
                          {item.label}
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontWeight: "600",
                            fontSize: "11px",
                          }}
                        >
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ columnGap: "30px" }}>
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
          </Badge.Ribbon>
        </div>

        {/* Right Side  */}
        <div style={{ flex: 1, height: "100vh" }}>
          <div
            style={{
              padding: "14px",
              //flex: 1,
              width: "74%",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              background: "#ffff",
              position: "fixed",
              // top: 70, // 🔥 MUST
              left: "26%",
              overflow: "auto", // 🔥 sticky-ku hidden venam
              zIndex: 10,
            }}
          >
            {/* Segments with arrows */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {/* Left Arrow */}
              <Button
                icon={<LeftOutlined style={{ color: "1677ff" }} />}
                onClick={scrollLeft}
                style={{
                  // borderRadius: "50%",
                  flexShrink: 0,
                }}
              />

              {/* Scrollable Segmented */}
              <div
                ref={segmentRef}
                style={{
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  scrollbarWidth: "none",
                  flex: 1,
                }}
              >
                <Segmented
                  value={active}
                  onChange={(val) => setActive(val)}
                  options={segmentOptions}
                  style={{
                    fontSize: "13px",
                    fontWeight: "500",
                    minWidth: "max-content", // 🔥 IMPORTANT
                    background: "white",
                  }}
                />
              </div>

              {/* Right Arrow */}
              <Button
                icon={<RightOutlined />}
                onClick={scrollRight}
                style={{
                  // borderRadius: "50%",
                  flexShrink: 0,
                }}
              />
            </div>

            {/* segments */}
            <div
              style={{
                flex: 1,
                overflowY: "scroll",
                padding: "14px",
                maxHeight: "80%",
                //height: "100vh",
                marginTop: "12px",
              }}
            >
              {active === "personal" && <PersonalDetails />}
              {active === "employment" && <Employment data={employeeData} />}
              {active === "bank" && <BankAndPayroll />}
              {active === "setting" && <Settings />}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
export default NewProfilePage;
