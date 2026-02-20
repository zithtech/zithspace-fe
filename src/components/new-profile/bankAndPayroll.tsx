import { Card, Row, Col, Input } from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import { PiBankLight } from "react-icons/pi";

const bankAndPayroll = () => {
  const [showAccount, setShowAccount] = useState(false);

  // 🔹 Hardcoded Data
  const data = {
    bankName: "HDFC Bank",
    accountHolderName: "Alex Morgan",
    accountNumber: "1234567890123456",
    ifscCode: "HDFC0001234",
    branchName: "Main Branch, NY",
    pfNumber: "MH/BAN/0000000/000",
    uanNumber: "100000000000",
    esiNumber: "00-00-000000-000-0000",
  };

  return (
    <Card
      style={{
        borderRadius: 12,
        background: "#fafafa",
        padding: 20,
        maxWidth: 1000,
      }}
    >
      {/* 🔹 Title */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: "#e6f0ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
            color: "#1677ff",
            fontWeight: 600,
          }}
        >
          <PiBankLight />
        </div>

        <span style={{ fontSize: 20, fontWeight: 600 }}>
          Financial Information
        </span>
      </div>

      {/* 🔹 Main Fields */}
      <Row gutter={[24, 16]}>
        <Col span={8}>
          <ViewBox label="Bank Name" value={data.bankName} />
        </Col>

        <Col span={8}>
          <ViewBox label="Account Holder Name" value={data.accountHolderName} />
        </Col>

        <Col span={8}>
          <div>
            <label style={labelStyle}>Account Number</label>
            <Input
              value={data.accountNumber}
              readOnly
              type={showAccount ? "text" : "password"}
              suffix={
                showAccount ? (
                  <EyeOutlined onClick={() => setShowAccount(false)} />
                ) : (
                  <EyeInvisibleOutlined onClick={() => setShowAccount(true)} />
                )
              }
            />
          </div>
        </Col>

        <Col span={8}>
          <ViewBox label="IFSC Code" value={data.ifscCode} />
        </Col>

        <Col span={8}>
          <ViewBox label="Branch Name" value={data.branchName} />
        </Col>
      </Row>

      {/* 🔹 Divider */}
      <div style={{ borderTop: "1px solid #f0f0f0", margin: "24px 0" }} />

      {/* 🔹 Statutory Details */}
      <div style={{ marginBottom: 16, fontWeight: 500 }}>Statutory Details</div>

      <Row gutter={[24, 16]}>
        <Col span={8}>
          <ViewBox label="PF Number" value={data.pfNumber} />
        </Col>

        <Col span={8}>
          <ViewBox label="UAN Number" value={data.uanNumber} />
        </Col>

        <Col span={8}>
          <ViewBox label="ESI Number" value={data.esiNumber} />
        </Col>
      </Row>
    </Card>
  );
};

const labelStyle = {
  display: "block",
  fontSize: 13,
  color: "#555",
  marginBottom: 6,
};

const ViewBox = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <Input value={value} readOnly />
  </div>
);

export default bankAndPayroll;
