"use client";

import { InboxOutlined } from "@ant-design/icons";
import { Tag, Badge, Upload } from "antd";
const PersonalDetails = () => {
  const { Dragger } = Upload;
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "20px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        {/* BASIC INFORMATION */}
        <Badge.Ribbon
          text="Basic Information"
          placement="end"
          style={{
            color: "#1677ff", // text color (blue)
            backgroundColor: "#1677ff",

            border: "1px solid rgba(22, 119, 255, 0.4)", // mirror effect
            backdropFilter: "blur(6px)", // glass / mirror feel (optional)
            fontSize: "12px",

            fontWeight: 600,
          }}
        >
          <div
            style={{
              ...cardStyle,
              position: "relative", // 👈 REQUIRED
              overflow: "visible", // 👈 REQUIRED (corner overflow)
            }}
          >
            <div style={gridTwo}>
              <Info label="FULL NAME" value="Abinash" />
              <Info label="EMPLOYEE ID" value="EMP1023" />
              <Info label="GENDER" value="Male" />
              <Info label="DATE OF BIRTH" value="10-09-2002" />
              <Info
                label="BLOOD GROUP"
                value={
                  <Tag
                    style={{
                      background: "rgba(255, 99, 71, 0.15)",
                      color: "#fa541c",
                      border: "1px solid rgba(255, 99, 71, 0.4)",
                      borderRadius: "8px",
                      fontWeight: "600",
                      padding: "2px 10px",
                    }}
                  >
                    O+
                  </Tag>
                }
              />
              <Info label="NATIONALITY" value="Indian" />
            </div>
          </div>
        </Badge.Ribbon>

        {/* ADDRESS */}
        <Badge.Ribbon
          text="Address"
          placement="end"
          style={{
            color: "#1677ff", // text color (blue)
            backgroundColor: "#1677ff",

            border: "1px solid rgba(22, 119, 255, 0.4)", // mirror effect
            backdropFilter: "blur(6px)", // glass / mirror feel (optional)
            fontSize: "12px",

            fontWeight: 600,
          }}
        >
          <div style={{ height: "5px" }}></div>
          <div style={cardStyle}>
            {/* <h4 style={titleStyle}>
            <Badge
              count="Address "
              style={{
                display: "inline-flex", // ✅ IMPORTANT
                alignItems: "center", // vertical center
                justifyContent: "center", // horizontal center
                backgroundColor: "rgba(22, 119, 255, 0.15)",
                color: "#1677ff",
                border: "1px solid rgba(22, 119, 255, 0.4)",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "14px",
                padding: "4px 12px",
                boxShadow: "none",
                lineHeight: 1.2, // 🔥 helps vertical centering
              }}
            />
          </h4> */}

            <div style={addressCardBlue}>
              <p style={addressTitle}>Current Address</p>
              <p style={textStyle}>
                Flat 402, Crystal Heights, Sector 45, Gurugram, Haryana – 122003
              </p>
            </div>

            <div style={{ height: "12px" }} />

            <div style={addressCardWhite}>
              <p style={addressTitle}>Permanent Address</p>
              <p style={textStyle}>
                123, Model Town, Jalandhar, Punjab – 144001
              </p>
            </div>
          </div>
        </Badge.Ribbon>

        {/* CONTACT INFORMATION */}
        <Badge.Ribbon
          text="Contact Information"
          placement="end"
          style={{
            color: "#1677ff", // text color (blue)
            backgroundColor: "#1677ff",

            border: "1px solid rgba(22, 119, 255, 0.4)", // mirror effect
            backdropFilter: "blur(6px)", // glass / mirror feel (optional)
            fontSize: "12px",

            fontWeight: 600,
          }}
        >
          <div style={cardStyle}>
            <Info label="PERSONAL EMAIL" value="arjun@gmail.com" />
            <Info label="MOBILE" value="+91 98765 43210" />
            <Info label="WORK EMAIL" value="arjun@company.com" />
          </div>
        </Badge.Ribbon>
        {/* EMERGENCY CONTACT */}
        <Badge.Ribbon
          text="EMERGENCY CONTACT"
          placement="end"
          style={{
            color: "#1677ff", // text color (blue)
            backgroundColor: "#1677ff",

            border: "1px solid rgba(22, 119, 255, 0.4)", // mirror effect
            backdropFilter: "blur(6px)", // glass / mirror feel (optional)
            fontSize: "12px",

            fontWeight: 600,
          }}
        >
          <div style={cardStyle}>
            {/* <h4 style={titleStyle}>
            <Badge
              count="Emergency Contact"
              style={{
                display: "inline-flex", // ✅ IMPORTANT
                alignItems: "center", // vertical center
                justifyContent: "center", // horizontal center
                backgroundColor: "rgba(22, 119, 255, 0.15)",
                color: "#1677ff",
                border: "1px solid rgba(22, 119, 255, 0.4)",
                borderRadius: "10px",
                fontWeight: "600",
                fontSize: "14px",
                padding: "4px 12px",
                boxShadow: "none",
                lineHeight: 1.2, // 🔥 helps vertical centering
              }}
            />
          </h4> */}

            <Info label="NAME" value="Kaviya" />
            <Info label="RELATION" value="Spouse" />
            <Info label="PHONE" value="+91 98765 12345" />
          </div>
        </Badge.Ribbon>

        {/* IDENTITY DOCUMENTS */}
        <Badge.Ribbon
          text="Identity Documents"
          placement="end"
          style={{
            color: "#1677ff",
            backgroundColor: "#1677ff",
            border: "1px solid rgba(22, 119, 255, 0.4)",
            backdropFilter: "blur(6px)",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {/* 🔥 Wrapper to prevent overlap */}
          <div
            style={{
              paddingTop: "22px", // ✅ THIS FIXES OVERLAY
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                borderRadius: "16px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                padding: "16px 20px",
                background: "#fff",
                justifyContent: "space-between",
              }}
            >
              <Info label="AADHAAR" value="2577 6554 1234" />
              <Info label="PAN" value="GJ5654J234F" />
              <Info label="PASSPORT" value="J1234567" />
            </div>
          </div>
        </Badge.Ribbon>

        {/* UPLOAD DOCUMENT (FULL WIDTH) */}
        <Badge.Ribbon
          text="UPLOAD DOCUMENT"
          placement="end"
          style={{
            color: "#1677ff",
            backgroundColor: "#1677ff",
            border: "1px solid rgba(22, 119, 255, 0.4)",
            backdropFilter: "blur(6px)",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {/* 🔥 Wrapper to avoid ribbon overlap */}
          <div
            style={{
              paddingTop: "22px",
            }}
          >
            <div
              style={{
                ...cardStyle,
                padding: "10px",
                textAlign: "center",
                justifyContent: "center",
              }}
            >
              {/* ✅ AntD Upload Dragger */}
              <Dragger
                multiple={false}
                showUploadList={false}
                style={{
                  padding: "18px 12px", // keeps same visual height
                  borderRadius: "14px",
                }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: "#1677ff" }} />
                </p>
                <p
                  className="ant-upload-text"
                  style={{ fontWeight: 600, fontSize: "14px" }}
                >
                  Upload ID Proof
                </p>
                <p
                  className="ant-upload-hint"
                  style={{ fontSize: "12px", color: "#64748b" }}
                >
                  PDF, JPG, PNG
                </p>
              </Dragger>
            </div>
          </div>
        </Badge.Ribbon>
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div style={{ marginBottom: "12px" }}>
    <div
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "#6b7280",
        marginBottom: "4px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: "14px",
        fontWeight: 500,
        color: "#0f172a",
      }}
    >
      {value}
    </div>
  </div>
);

/* ---------- STYLES ---------- */

const cardStyle = {
  background: "#ffffff",
  padding: "18px",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const titleStyle = {
  fontSize: "15px",
  fontWeight: 600,
  marginBottom: "14px",
  color: "#0f172a",
};

const textStyle = {
  fontSize: "13px",
  color: "#475569",
  lineHeight: "1.6",
};

const gridTwo = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px 20px",
};

const addressTitle = {
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "6px",
  color: "#0f172a",
};

const addressCardBlue = {
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.4)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const addressCardWhite = {
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.4)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

export default PersonalDetails;
