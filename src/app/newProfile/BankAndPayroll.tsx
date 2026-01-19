"use-client";
import { SafetyOutlined, SyncOutlined } from "@ant-design/icons";
import { Button, Badge } from "antd";

const BankAndPayroll = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          width: "100%",
          background: "#ffffff",
          borderRadius: "18px",
          padding: "20px 26px",
          border: "1px solid #1677ff",
          boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "#1677ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "20px",
            flexShrink: 0,
          }}
        >
          <SafetyOutlined />
        </div>

        {/* Text */}
        <div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "4px",
            }}
          >
            Secure Banking Information
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#6b7280",
              lineHeight: 1.6,
            }}
          >
            Your banking details are encrypted and protected. Any changes
            require verification and approval.
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        {/* second section */}
        <Badge.Ribbon
          text=" Bank Account Details"
          placement="start"
          style={{
            color: "#1677ff",
            backgroundColor: "#1677ff",
            border: "1px solid rgba(22, 119, 255, 0.4)",
            backdropFilter: "blur(6px)",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          <div
            style={{
              width: "100%",
              background: "#ffffff",
              borderRadius: "20px",
              padding: "28px 32px",
              boxShadow: "0 10px 28px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            {/* Button Row */}
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: "12px", // ✅ controlled small gap
              }}
            >
              <button
                style={{
                  padding: "9px",
                  borderRadius: "12px",
                  border: "none",
                  background:
                    "linear-gradient(135deg, #1677ff, rgba(44, 108, 237, 1))",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "10px",
                  height: "30px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <SyncOutlined /> Request Changes
              </button>
            </div>

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "28px 40px",
                marginTop: "0px", // ✅ no extra vertical gap
              }}
            >
              <Info label="Bank Name" value="HDFC Bank" />
              <Info label=" Holder Name" value="Abinash" />
              <Info label="Acc Number" value="......431" />
              <Info label="IFSC Code" value="HDFC0001234" />
              <Info label="Branch Name" value="Gurugram Sector 45" />
              <Info label="Account Type" value="Savings" />
            </div>

            {/* Status Box */}
            <div
              style={{
                width: "100%",
                marginTop: "24px",
                backgroundColor: "#eaf7ef",
                border: "1px solid #b7e3c6",
                borderRadius: "14px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  color: "#16a34a",
                  fontWeight: 500,
                  fontSize: "12px",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    border: "2px solid #16a34a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  ✓
                </div>
                <p style={{ fontSize: "10px" }}>Bank Account Verified</p>
              </div>

              <div
                style={{
                  fontSize: "10px",
                  color: "#6b7280",
                  fontWeight: 500,
                }}
              >
                Last verified: 15 Jan 2024
              </div>
            </div>
          </div>
        </Badge.Ribbon>
        {/* Payroll Identifiers */}
        <Badge.Ribbon
          text="Payroll Identifiers "
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
          <div
            style={{
              width: "100%",
              background: "#ffffff",
              borderRadius: "22px",
              padding: "28px 30px",
              boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              border: "1px solid #e5e7eb",
            }}
          >
            

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
              }}
            >
              {/* UAN */}
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "16px",
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  UAN NUMBER
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex", // ✅ needed
                      alignItems: "center",
                      padding: "3px 8px", // 🔽 reduced size
                      borderRadius: "6px", // 🔽 smaller radius
                      fontSize: "11px", // 🔽 smaller text
                      fontWeight: 500,
                      lineHeight: 1, // ✅ single-line height
                      whiteSpace: "nowrap", // ✅ force single line
                      color: "#1677ff",
                      background: "rgba(22, 119, 255, 0.12)",
                      border: "1px solid rgba(22, 119, 255, 0.35)",
                    }}
                  >
                    1001-2345-6789
                  </span>

                  {/* <span style={{ fontSize: "18px", color: "#6b7280" }}>🔒</span> */}
                </div>
              </div>

              {/* PF */}
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "16px",
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  PF NUMBER
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "16px",
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex", // ✅ needed
                      alignItems: "center",
                      padding: "3px 8px", // 🔽 reduced size
                      borderRadius: "6px", // 🔽 smaller radius
                      fontSize: "11px", // 🔽 smaller text
                      fontWeight: 500,
                      lineHeight: 1, // ✅ single-line height
                      whiteSpace: "nowrap", // ✅ force single line
                      color: "#1677ff",
                      background: "rgba(22, 119, 255, 0.12)",
                      border: "1px solid rgba(22, 119, 255, 0.35)",
                    }}
                  >
                    HR/GGN/12345/12345
                  </span>

                  {/* <span style={{ fontSize: "18px", color: "#6b7280" }}>🔒</span> */}
                </div>
              </div>

              {/* ESI */}
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "16px",
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  ESI
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "16px",
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex", // ✅ needed
                      alignItems: "center",
                      padding: "3px 8px", // 🔽 reduced size
                      borderRadius: "6px", // 🔽 smaller radius
                      fontSize: "11px", // 🔽 smaller text
                      fontWeight: 500,
                      lineHeight: 1, // ✅ single-line height
                      whiteSpace: "nowrap", // ✅ force single line
                      color: "#1677ff",
                      background: "rgba(22, 119, 255, 0.12)",
                      border: "1px solid rgba(22, 119, 255, 0.35)",
                    }}
                  >
                    N/A
                  </span>
                  {/* <span style={{ fontSize: "18px", color: "#6b7280" }}>🔒</span> */}
                </div>
              </div>

              {/* Tax Regime */}
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "16px",
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  TAX REGIME
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  New Regime
                  {/* <span style={{ fontSize: "18px", color: "#6b7280" }}>🔒</span> */}
                </div>
              </div>

              {/* Payment Mode */}
              <div
                style={{
                  background: "#fafafa",
                  borderRadius: "16px",
                  padding: "18px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  PAYMENT MODE
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  Bank Transfer
                  {/* <span style={{ fontSize: "18px", color: "#6b7280" }}>🔒</span> */}
                </div>
              </div>
            </div>
          </div>
        </Badge.Ribbon>
      </div>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <div
      style={{
        fontSize: "12px",
        fontWeight: 600,
        color: "#6b7280",
        marginBottom: "6px",
        letterSpacing: "0.6px",
      }}
    >
      {label}
    </div>

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
        fontWeight: 600,
        color: "#111827",
      }}
    >
      {value}
      {/* <LockOutlined style={{ fontSize: "14px", color: "#9ca3af" }} /> */}
    </div>

    <div></div>
  </div>
);
export default BankAndPayroll;
