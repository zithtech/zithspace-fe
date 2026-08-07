"use client";

import { Card, Row, Col, Typography } from "antd";
import { FaHome } from "react-icons/fa";

import ViewField from "@/components/common/ViewField";
import { useEffect } from "react";

const { Text } = Typography;

interface PersonalDetailsProps {
  profile: any;
  personal: any;
  employment: any;
  currentUser: any;
}

const formatDOB = (dobStr?: string) => {
  if (!dobStr) return "—";
  try {
    const date = new Date(dobStr);
    if (isNaN(date.getTime())) return dobStr;
    return date.toLocaleDateString("en-GB", {
      timeZone: "Asia/Kolkata",
    });
  } catch {
    return dobStr;
  }
};

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  profile,
  personal,
  employment,
  currentUser,
}) => {
  useEffect(() => {
    console.log("Profile Data:", profile);
  }, [profile]);

  const cardStyle = {
    borderRadius: 8,
    padding: 8,
    boxShadow: "none",
    border: "1px solid var(--border-slate-100)",
    background: "var(--bg-pure-white)",
  };

  const innerCardStyle = {
    borderRadius: 8,
    boxShadow: "none",
    border: "1px solid var(--border-slate-100)",
    background: "var(--bg-slate-50)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 🔹 Personal Details Card */}
      <Card bordered style={cardStyle}>
        <Row gutter={[16, 10]}>
          {" "}
          {/* reduced spacing */}
          <Col span={8}>
            <ViewField
              label="First Name"
              value={profile?.personal?.firstName || "—"}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Last Name"
              value={profile?.personal?.lastName || "-"}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Employee ID"
              value={profile?.personal?.employee_code || "—"}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Date of Birth"
              value={formatDOB(profile?.personal?.dob)}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Blood Group"
              value={profile?.personal?.bloodGroup || "—"}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Mobile Number"
              value={profile?.personal?.mobile || "—"}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Personal Email"
              value={profile?.personal?.personalEmail || "—"}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Work Email"
              value={profile?.personal?.workEmail || "—"}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
        </Row>
      </Card>

      {/* 🔹 Address Card */}
      <Card
        bordered
        style={{
          borderRadius: 8,
          boxShadow: "none",
          border: "1px solid var(--border-slate-100)",
          background: "var(--bg-pure-white)",
        }}
      >
        <Row gutter={24} align="stretch">
          {/* 🔹 LEFT SIDE - ADDRESSES */}
          <Col span={14}>
            {/* Current Address */}
            <Card
              bordered
              style={{
                ...innerCardStyle,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                <FaHome size={18} />
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Current Address
                </Text>
              </div>

              <Text>
                {[
                  profile?.personal?.address?.current?.c_flat || "-",
                  profile?.personal?.address?.current?.c_area || "-",
                  profile?.personal?.address?.current?.c_city || "-",
                  profile?.personal?.address?.current?.c_state || "-",
                  profile?.personal?.address?.current?.c_pincode || "-",
                  profile?.personal?.address?.current?.c_country || "-",
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </Text>
            </Card>

            {/* Permanent Address */}
            <Card bordered style={innerCardStyle}>
              <div style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                <FaHome size={18} />
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Permanent Address
                </Text>
              </div>
              <Text>
                {[
                  profile?.personal?.address?.permanent?.p_flat || "-",
                  profile?.personal?.address?.permanent?.p_area || "-",
                  profile?.personal?.address?.permanent?.p_city || "-",
                  profile?.personal?.address?.permanent?.p_state || "-",
                  profile?.personal?.address?.permanent?.p_pincode || "-",
                  profile?.personal?.address?.permanent?.p_country || "-",
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}
              </Text>
            </Card>
          </Col>

          {/* 🔹 RIGHT SIDE - RELATION (ONLY ONCE) */}
          <Col span={10}>
            <Card
              bordered
              style={{
                ...innerCardStyle,
                height: "100%",
              }}
            >
              <Text strong style={{ display: "block", marginBottom: 12 }}>
                Relation Details
              </Text>

              <div style={{ marginBottom: 10 }}>
                <Text type="secondary">Name</Text>
                <div>{profile?.personal.relationName || "-"}</div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <Text type="secondary">Type</Text>
                <div>{profile?.personal.relationship || "-"}</div>
              </div>

              <div>
                <Text type="secondary">Contact Number</Text>
                <div>{profile?.personal.relationMobile || "-"}</div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
      <style jsx global>{`
        .ant-col .ant-typography-secondary {
          color: var(--text-slate-400) !important;
        }
        .ant-typography {
          color: var(--text-slate-900) !important;
        }
      `}</style>
    </div>
  );
};

export default PersonalDetails;
