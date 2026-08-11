"use client";

import React, { useEffect, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useState } from "react";
import { Tabs } from "antd";
import {
  User,
  Briefcase,
  CreditCard,
  History,
  Laptop,
  Camera,
  Clock,
  Calendar,
  UserCheck,
  MapPin,
} from "lucide-react";
import PersonalDetails from "@/components/new-profile/personaldetailes";
import BankAndPayroll from "@/components/new-profile/bankAndPayroll";
import EmployeeHistory from "@/components/new-profile/employeeHistory";
import EmploymentDetails from "@/components/new-profile/employmentDetails";
import Assets from "@/components/new-profile/assets";
import { useAuth } from "@/context/AuthContext";
import { AuthService } from "@/services/authService";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import { PositionService } from "@/services/positionService 3";
import ZukvoLoader from "@/components/common/ZukvoLoader";

const NewProfilePage = () => {
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

  useEffect(() => { }, [user]);

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

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

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

  const fullName =
    `${personal?.firstName || ""} ${personal?.lastName || ""}`.trim() || "—";
  const empCode = personal?.employee_code || currentUser?.employee_code || "—";
  const positionTitle =
    currentUser?.position?.title || employment?.designation || "—";
  const department = employment?.department || positions?.subDepartment?.name;
  const team = employment?.team;
  const joiningDate =
    employment?.employeeJoiningDate || employment?.joiningDate;

  const statCards = [
    {
      icon: <Clock size={16} />,
      label: "Experience",
      value: calculateExperience(joiningDate),
    },
    {
      icon: <Calendar size={16} />,
      label: "Date of Joining",
      value: joiningDate
        ? new Date(joiningDate).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          timeZone: "Asia/Kolkata",
        })
        : "—",
    },
    {
      icon: <UserCheck size={16} />,
      label: "Reports To",
      value: employment?.reportingManager || "—",
    },
    {
      icon: <MapPin size={16} />,
      label: "Work Location",
      value: employment?.workLocation || "—",
    },
  ];

  // While the employee record loads.
  if (loading) {
    return (
      <MainLayout>
        <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-slate-400)" }}>
          <ZukvoLoader size="lg" message="Loading your profile..." />
        </div>
      </MainLayout>
    );
  }

  // No employee record linked to this account (or it couldn't be loaded).
  if (!profile) {
    return (
      <MainLayout>
        <div
          style={{
            minHeight: "70vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 14,
            padding: 24,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              background: "var(--bg-slate-50)",
              border: "1px solid var(--border-slate-100)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-slate-300)",
            }}
          >
            <User size={32} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-slate-700)" }}>
            No information found
          </div>
          <div style={{ fontSize: 13, color: "var(--text-slate-400)", maxWidth: 380, lineHeight: 1.6 }}>
            There’s no employee profile linked to your account yet. If you believe this is a
            mistake, please contact your HR or admin.
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div
        style={{
          width: "calc(100% + 48px)",
          margin: "0 -24px",
          background: "var(--bg-slate-50)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {/* ── LEFT SIDEBAR ── */}
        <aside
          style={{
            width: 320,
            flexShrink: 0,
            alignSelf: "stretch",
            background: "var(--bg-pure-white)",
            borderRight: "1px solid var(--border-slate-100)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            position: "sticky",
            top: 0,
            minHeight: "100vh",
          }}
        >
          {/* Profile card */}
          <div
            style={{
              background: "var(--bg-pure-white)",
              border: "1px solid var(--border-slate-100)",
              borderRadius: 16,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
            }}
          >
            {/* Gradient band */}
            <div
              style={{
                height: 72,
                background:
                  "linear-gradient(120deg, #3B82F6 0%, #6366F1 55%, #8B5CF6 100%)",
              }}
            />
            <div style={{ padding: "0 16px 18px", textAlign: "center", marginTop: -44 }}>
              {/* Avatar */}
              <div
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: "relative",
                  width: 88,
                  height: 88,
                  margin: "0 auto",
                  borderRadius: "50%",
                  background: "var(--bg-pure-white)",
                  padding: 4,
                  boxShadow:
                    "0 4px 14px rgba(15,23,42,0.15), 0 0 0 4px var(--bg-pure-white)",
                  cursor: "pointer",
                }}
              >
                <img
                  src={image}
                  alt="Employee"
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 4,
                    borderRadius: "50%",
                    background: "rgba(15,23,42,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    opacity: isHover ? 1 : 0,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  <Camera size={20} />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>

              <h1 style={{ margin: "12px 0 2px", fontSize: 17, fontWeight: 800, color: "var(--text-slate-900)", lineHeight: 1.2 }}>
                {fullName}
              </h1>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-slate-400)" }}>{empCode}</div>

              {/* Badges */}
              <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
                {[positionTitle, department, team]
                  .filter((b) => b && b !== "—")
                  .map((b, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 600,
                        background: "var(--bg-blue-50)",
                        color: "var(--premium-blue)",
                      }}
                    >
                      {b}
                    </span>
                  ))}
              </div>

              {/* Active pill */}
              <div style={{ marginTop: 12 }}>
                <span
                  style={{
                    padding: "3px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    background: "rgba(16,185,129,0.12)",
                    color: "#10B981",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {statCards.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "var(--bg-pure-white)",
                  border: "1px solid var(--border-slate-100)",
                  borderRadius: 12,
                  boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 9,
                    background: "var(--bg-blue-50)",
                    color: "var(--premium-blue)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-slate-400)",
                      marginBottom: 2,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text-slate-900)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* ── RIGHT CONTENT ── */}
        <main style={{ flex: 1, minWidth: 0, padding: "24px 28px 40px" }}>
          <div style={{ marginBottom: 16 }}>
            <h1 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: "var(--text-slate-900)", letterSpacing: "-0.02em" }}>
              Employee Details
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-slate-400)" }}>
              Your personal, employment, payroll, history &amp; assets
            </p>
          </div>

          <div
            style={{
              background: "var(--bg-pure-white)",
              border: "1px solid var(--border-slate-100)",
              borderRadius: 16,
              padding: "16px 22px",
              boxShadow: "0 1px 3px rgba(15,23,42,0.05)",
            }}
          >
            <Tabs
              activeKey={selectedTab}
              onChange={(key) => setSelectedTab(key)}
              className="themed-profile-tabs"
              items={[
                {
                  key: "personal",
                  label: (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      <User size={15} />
                      Personal Details
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 4 }}>
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
                  key: "employment",
                  label: (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      <Briefcase size={15} />
                      Employment
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 4 }}>
                      <EmploymentDetails
                        employment={employment}
                        currentUser={currentUser}
                        positions={positions}
                      />
                    </div>
                  ),
                },
                {
                  key: "bank",
                  label: (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      <CreditCard size={15} />
                      Bank & Payroll
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 4 }}>
                      <BankAndPayroll profile={profile} employment={employment} />
                    </div>
                  ),
                },
                {
                  key: "history",
                  label: (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      <History size={15} />
                      History
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 4 }}>
                      <EmployeeHistory profile={profile} />
                    </div>
                  ),
                },
                {
                  key: "assets",
                  label: (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontWeight: 600,
                      }}
                    >
                      <Laptop size={15} />
                      Assets
                    </span>
                  ),
                  children: (
                    <div style={{ paddingTop: 4 }}>
                      <Assets assets={profile?.assets} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </main>

        <style jsx global>{`
          .themed-profile-tabs .ant-tabs-nav::before {
            border-bottom: 1px solid var(--border-slate-100) !important;
          }
          .themed-profile-tabs .ant-tabs-tab {
            padding: 10px 0 !important;
            margin: 0 28px 0 0 !important;
          }
          .themed-profile-tabs .ant-tabs-tab-btn {
            color: var(--text-slate-500) !important;
            font-weight: 600 !important;
          }
          .themed-profile-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: var(--premium-blue) !important;
          }
          .themed-profile-tabs .ant-tabs-ink-bar {
            height: 2.5px !important;
            background: var(--premium-blue) !important;
            border-radius: 2px 2px 0 0;
          }
        `}</style>
      </div>
    </MainLayout>
  );
};

export default NewProfilePage;
