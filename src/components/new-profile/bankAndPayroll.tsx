import { Card, Row, Col, Input } from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import { PiBankLight } from "react-icons/pi";

interface BankAndPayrollProps {
  profile: any;
  employment: any;
}

const bankAndPayroll = ({ profile, employment }: BankAndPayrollProps) => {
  const bank = profile?.bank || {};

  return (
    <Card
      bordered
      style={{
        borderRadius: 14,
        background: "var(--bg-pure-white)",
        padding: "20px 24px",
        maxWidth: 1100,
        boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
        border: "1px solid var(--border-slate-100)",
      }}
    >
      {/* Title */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 22 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "var(--bg-blue-50)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
            color: "var(--premium-blue)",
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          <PiBankLight />
        </div>

        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text-slate-900)",
          }}
        >
          Financial Information
        </span>
      </div>

      {/* Main Fields */}
      <Row gutter={[24, 18]}>
        <Col span={8}>
          <ViewBox label="Bank Name" value={bank.bankName || "—"} />
        </Col>

        <Col span={8}>
          <ViewBox
            label="Account Holder Name"
            value={bank.accountHolderName || "—"}
          />
        </Col>

        <Col span={8}>
          <MaskedViewBox
            label="Account Number"
            value={bank.accountNumber || "—"}
          />
        </Col>

        <Col span={8}>
          <MaskedViewBox label="IFSC Code" value={bank.ifscCode || "—"} />
        </Col>

        <Col span={8}>
          <ViewBox label="Branch Name" value={bank.branchName || "—"} />
        </Col>

        <Col span={8}>
          <ViewBox label="Account Type" value={bank.accountType || "—"} />
        </Col>
      </Row>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid var(--border-slate-100)",
          margin: "26px 0",
        }}
      />

      {/* Statutory Details */}
      <div
        style={{
          marginBottom: 18,
          fontWeight: 700,
          fontSize: 14,
          color: "var(--text-slate-900)",
        }}
      >
        Statutory & Payroll Details
      </div>

      <Row gutter={[24, 18]}>
        <Col span={8}>
          <MaskedViewBox label="UAN Number" value={bank.uanNumber || "—"} />
        </Col>

        <Col span={8}>
          <MaskedViewBox label="PF Number" value={bank.pfNumber || "—"} />
        </Col>

        <Col span={8}>
          <MaskedViewBox label="ESI Number" value={bank.esiNumber || "—"} />
        </Col>

        <Col span={8}>
          <ViewBox label="Tax Regime" value={bank.taxRegime || "—"} />
        </Col>

        <Col span={8}>
          <ViewBox label="Payment Type" value={bank.paymentType || "—"} />
        </Col>
      </Row>
    </Card>
  );
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "var(--text-slate-400)",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  fontWeight: 600,
  borderRadius: 8,
  background: "var(--bg-slate-50)",
  borderColor: "var(--border-slate-100)",
  color: "var(--text-slate-900)",
};

const ViewBox = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <Input style={inputStyle} value={value} readOnly />
  </div>
);

const MaskedViewBox = ({ label, value }: { label: string; value: string }) => {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <Input.Password
        style={inputStyle}
        value={value}
        readOnly
      />
    </div>
  );
};

export default bankAndPayroll;
