
"use client";
import { LockOutlined } from "@ant-design/icons";


const PersonalDetails = () => {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "68%",
        overflow:"auto"
      }}
    >
      {/* Basic Information */}
      <div
        style={{
          background: "#fff",
          padding: "24px",
          borderRadius: "16px",
          gap: "20px",
        }}
      >
        <h3 style={{ marginBottom: "16px" }}>Basic Information</h3>
        {/* Basic Information */}
        <div style={{ display: "flex", flexDirection: "column", gap: "35px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {/* FULL NAME */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                FULL NAME
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "16px" }}>
                Arjun Mehta
              </div>
            </div>

            {/* EMPLOYEE ID */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                EMPLOYEE ID
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "16px" }}>
                EMP-2024-001
                {/* Uncomment if you want the lock icon */}
                {/* <LockOutlined /> */}
              </div>
            </div>

            {/* GENDER */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                GENDER
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "16px" }}>
                Male
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {/* Date of birth */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Date of Birth
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "16px" }}>
                15 March 1992
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Blood Group
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "16px" }}>
                O+
                {/* Uncomment if you want the lock icon */}
                {/* <LockOutlined /> */}
              </div>
            </div>

            {/* GENDER */}
            <div>
              <div
                style={{
                  fontSize: "13px",
                  color: "#6b7280",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                Marital Status
              </div>
              <div style={{ display: "flex", gap: "8px", fontSize: "16px" }}>
                Married
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Contact Information */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "140px",
          padding: "24px 32px",
          borderRadius: "16px",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>
          Contact Information
        </h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "40px",
          }}
        >
          <div style={{ width: "33.33%" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              PERSONAL EMAIL
            </div>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>
              arjun.mehta@gmail.com
            </div>
          </div>

          <div style={{ width: "33.33%" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              MOBILE NUMBER
            </div>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>
              +91 98765 43210
            </div>
          </div>

          <div style={{ width: "33.33%" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>WORK EMAIL</div>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>
              arjun.mehta@company.com
            </div>
          </div>
        </div>
      </div>
      {/* Emergency Contact */}
      <div
        style={{
          width: "100%",
          maxWidth: "1200px",
          height: "150px",
          padding: "26px 32px",
          borderRadius: "18px",
          backgroundColor: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h3 style={{ marginBottom: "18px", fontSize: "18px" }}>
          Emergency Contact
        </h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "40px",
          }}
        >
          <div style={{ width: "33.33%" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              CONTACT NAME
            </div>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>Priya Mehta</div>
          </div>

          <div style={{ width: "33.33%" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              RELATIONSHIP
            </div>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>Spouse</div>
          </div>

          <div style={{ width: "33.33%" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              PHONE NUMBER
            </div>
            <div style={{ fontSize: "16px", fontWeight: 500 }}>
              +91 98765 12345
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PersonalDetails;













