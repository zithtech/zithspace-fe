"use client";
import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useEmployeeSetting } from "@/hooks/use-employee-settings";

const Settings = () => {
  const [employeePrefix, setEmployeePrefix] = useState("EMP");
  const [isSaved, setIsSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Destructure setting and saveSetting from the hook
  const { setting, saveSetting, loading } = useEmployeeSetting();

  // Sync local state when settings are fetched from backend
  useEffect(() => {
    if (setting?.employeeCodePrefix) {
      setEmployeePrefix(setting.employeeCodePrefix);
      setIsSaved(true);
      setIsEditing(false);
    }
  }, [setting]);

  const handleSave = async () => {
    const data = { employeeCodePrefix: employeePrefix };
    // Use saveSetting which handles both Create and Update logic automatically
    const result = await saveSetting(data);

    if (result) {
      console.log("Saved Prefix:", data.employeeCodePrefix);

      setIsSaved(true);
      setIsEditing(false);
    } else {
      // You can add error handling here if needed
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <MainLayout>
      <div
        style={{
          width: "100%",
          minHeight: "100vh",
          background: "var(--bg-secondary)",
          padding: "30px",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "30px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, color: "var(--text-slate-900)" }}>
            Settings
          </h1>
          <p style={{ color: "var(--text-slate-500)", marginTop: "6px" }}>
            Manage your Employee onboarding process
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--bg-pure-white)",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "var(--shadow-premium-sm)",
            border: "1px solid var(--border-slate-100)",
            maxWidth: "900px",
          }}
        >
          <div style={{ marginBottom: "25px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-slate-900)" }}>
              Employee Code Settings
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-slate-500)" }}>
              Set a dynamic prefix for employee codes.
            </p>
          </div>

          {/* Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            {/* Label */}
            <div
              style={{
                fontSize: "15px",
                fontWeight: 600,
                minWidth: "150px",
                color: "var(--text-slate-900)"
              }}
            >
              Employee Code
            </div>

            {/* Input */}
            <input
              type="text"
              value={employeePrefix}
              placeholder="Enter Prefix (Eg: EMP)"
              disabled={(isSaved && !isEditing) || loading}
              onChange={(e) => setEmployeePrefix(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "10px",
                border: "1px solid var(--border-slate-200)",
                fontSize: "14px",
                background: isSaved && !isEditing ? "var(--bg-slate-50)" : "var(--bg-pure-white)",
                color: "var(--text-slate-900)",
                cursor: isSaved && !isEditing ? "not-allowed" : "text",
              }}
            />

            {/* Buttons */}
            {!isSaved && (
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: "12px 22px",
                  background: "var(--premium-blue)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            )}

            {isSaved && !isEditing && (
              <button
                onClick={handleEdit}
                disabled={loading}
                style={{
                  padding: "12px 22px",
                  background: "var(--premium-blue)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Edit
              </button>
            )}

            {isSaved && isEditing && (
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: "12px 22px",
                  background: "var(--premium-blue)",
                  color: "white",
                  border: "none",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Updating..." : "Update"}
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
