"use client";

import React, { useEffect, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { Segmented, Card, Tabs, message } from "antd";
import PersonalDetails from "@/components/new-profile/personaldetailes";
import BankAndPayroll from "@/components/new-profile/bankAndPayroll";
import EmployeeHistory from "@/components/new-profile/employeeHistory";
import { ProfileService } from "@/services/newProfile";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/authService";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import EditOutlined from "@ant-design/icons/lib/icons/EditOutlined";
import { EmployeeService } from "@/services/employeeServices";
import { PositionService } from "@/services/positionService 3";

const NewProfilePage = () => {
  //const [name, setName] = useState("");
  const defaultImage = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTab, setSelectedTab] = useState("personal");
  const { user, isLoading } = useAuth();

  console.log("Authenticated User 👉", user);

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [image, setImage] = useState<string>(defaultImage);
  const [positions, setPositions] = useState<any>(null);

  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     try {
  //       setLoading(true);

  //       // ✅ 1. Get logged in user
  //       const userRes = await AuthService.getProfile();
  //       // const userData = userRes?.data?.data || userRes?.data || userRes;
  //       const userData =
  //         (userRes as any)?.data?.data || (userRes as any)?.data || userRes;

  //       setCurrentUser(userData);

  //       if (!userData?.employeeId) return;

  //       // ✅ 2. Get employee by ID
  //       const empRes = await EmployeeOnboardingService.getEmployeeById(
  //         userData.employeeId,
  //       );

  //       const employeeData = empRes?.data?.data || empRes?.data || empRes;

  //       if (!employeeData) return;

  //       setProfile(employeeData);
  //       // Set image from fetched profile
  //       if (employeeData.personal?.profile_pic) {
  //         setImage(employeeData.personal.profile_pic);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchProfile();
  // }, []);

  useEffect(() => {}, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        // 1️⃣ Get logged-in user
        const userRes = await AuthService.getProfile();
        const userData =
          (userRes as any)?.data?.data || (userRes as any)?.data || userRes;
        setCurrentUser(userData);

        const positionData = async () => {
          if (userData?.position) {
            try {
              const positions = await PositionService.getById(
                userData.position.id as any,
              );
              setPositions(positions);
              console.log("Positions 👉", positions);
            } catch (error) {
              console.error("Error fetching positions:", error);
            }
          }
        };

        positionData();

        if (!userData?.employeeId) return;

        // 2️⃣ Get employee by ID
        const empRes = await EmployeeOnboardingService.getEmployeeById(
          userData.employeeId,
        );
        const employeeData = empRes?.data?.data || empRes?.data || empRes;

        if (!employeeData) return;

        setProfile(employeeData);

        // 3️⃣ Set the image for display
        const profileImage =
          employeeData.personal?.profilePic ||
          employeeData.personal?.profile_pic;

        if (profileImage) {
          setImage(profileImage);
        } else {
          setImage(defaultImage); // fallback if no profile image exists
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const personal = profile?.personal;
  const employment = profile?.employment;

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

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   try {
  //     const base64 = await getBase64(file);

  //     console.log("Base64 Image:", base64);
  //     setImage(base64);
  //   } catch (error) {
  //     console.error("Error converting image:", error);
  //   }
  // };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1️⃣ Convert to base64

      const base64 = await getBase64(file);

      // 2️⃣ Preview update
      setImage(base64);

      // 3️⃣ Direct backend call
      await EmployeeOnboardingService.updateEmployee(currentUser?.employeeId, {
        personal: {
          profilePic: base64, // 👈 direct send
        },
      });

      console.log("Profile image updated successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const calculateExperience = (joiningDate?: string) => {
    if (!joiningDate) return "-";

    const start = new Date(joiningDate);
    const end = new Date();

    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();

    // If current day less than joining day, reduce month
    if (end.getDate() < start.getDate()) {
      months -= 1;
    }

    // Adjust if months negative
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return `${years} Years ${months} Months`;
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
              width: "75%",
              height: "300px",
            }}
          >
            {/* 🔥 IMAGE SECTION - 65% */}

            <div
              style={{
                height: "60%",
                width: "100%",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <img
                src={image}
                alt="Employee"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {/* 🔥 DETAILS SECTION - 35% */}
            <div
              style={{
                flex: "0 0 35%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                textAlign: "center",
              }}
            >
              <div>
                <h1
                  style={{
                    margin: "6px 0 2px",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: color.text,
                  }}
                >
                  {personal?.firstName} {personal?.lastName}
                </h1>

                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: "10px",
                    color: color.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {personal?.employee_code}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "4px",
                    flexWrap: "wrap",
                    flexDirection: "row",
                  }}
                >
                  <span
                    style={{
                      padding: "2px 4px",
                      borderRadius: "4px",
                      fontSize: "9px",
                      fontWeight: 500,
                      background: color.primaryLight,
                      color: color.primary,
                    }}
                  >
                    {currentUser?.positionTitle}{" "}
                    {positions?.subDepartment?.name}
                  </span>
                </div>
              </div>

              {/* Department / Location */}
              <div
                style={{
                  borderTop: `1px solid ${color.borderLight}`,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  padding: "6px 0",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontSize: "9px",
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
                    {employment?.department}
                  </p>
                </div>

                <div
                  style={{
                    borderLeft: `1px solid ${color.borderLight}`,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 2px",
                      fontSize: "9px",
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
                    {employment?.workLocation}
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
            <InfoCard
              icon="🏢"
              label="Reports To"
              value={`${profile?.employment?.reportingManager}`}
            />

            <InfoCard
              icon="⏳"
              label="Experience"
              value={calculateExperience(employment?.employeeJoiningDate)}
            />

            <InfoCard
              icon="📅"
              label="Date of Joining"
              value={
                employment?.employeeJoiningDate
                  ? new Date(employment.employeeJoiningDate).toLocaleDateString(
                      "en-IN", // Indian format DD/MM/YYYY
                      { day: "2-digit", month: "short", year: "numeric" },
                    )
                  : "-"
              }
            />
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
                  label: (
                    <span style={{ fontWeight: 600 }}>Personal Details</span>
                  ),
                  children: (
                    <div
                      style={{
                        height: "100%",
                        overflowY: "hidden", // ❌ No scroll
                      }}
                    >
                      <PersonalDetails
                        profile={profile}
                        personal={personal}
                        employment={employment}
                        currentUser={currentUser}
                      />
                    </div>
                  ),
                },
                {
                  key: "bank",
                  label: (
                    <span style={{ fontWeight: 600 }}>Bank & Payroll</span>
                  ),
                  children: (
                    <div
                      style={{
                        height: "100%",
                        overflowY: "hidden", // ❌ No scroll
                      }}
                    >
                      <BankAndPayroll
                        profile={profile}
                        employment={employment}
                      />
                    </div>
                  ),
                },
                {
                  key: "history",
                  label: <span style={{ fontWeight: 600 }}>History</span>,
                  children: (
                    <div
                      style={{
                        height: "100%",
                        overflowY: "auto",
                        paddingRight: "6px",
                      }}
                    >
                      <EmployeeHistory profile={profile} />
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
