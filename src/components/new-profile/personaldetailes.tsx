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

const PersonalDetails: React.FC<PersonalDetailsProps> = ({
  profile,
  personal,
  employment,
  currentUser,
}) => {
  useEffect(() => {
    console.log("Profile Data:", profile);
  }, [profile]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 🔹 Personal Details Card */}
      <Card
        style={{
          borderRadius: 12,
          padding: 16,
          // reduced from default
        }}
      >
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
              value={
                profile?.personal?.dob
                  ? new Date(profile.personal.dob).toLocaleDateString("en-GB")
                  : "—"
              }
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
      <Card style={{ borderRadius: 12 }}>
        <Row gutter={24} align="stretch">
          {/* 🔹 LEFT SIDE - ADDRESSES */}
          <Col span={14}>
            {/* Current Address */}
            <Card
              style={{
                marginBottom: 16,
                borderRadius: 8,
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
            <Card style={{ borderRadius: 8 }}>
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
              style={{
                borderRadius: 8,
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
    </div>
  );
};

export default PersonalDetails;
