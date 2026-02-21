"use client";

import { Card, Row, Col, Typography } from "antd";
import { FaHome } from "react-icons/fa";

import ViewField from "@/components/common/ViewField";

const { Text } = Typography;

const PersonalDetails = () => {
  const data = {
    personalDetails: {
      firstName: "Alex",
      lastName: "Morgan",
      employeeId: "EMP-2024-892",
      dob: "12-05-1998",
      bloodGroup: "O+",
      mobile: "+91 9876543210",
      personalEmail: "alex.m@gmail.com",
      workEmail: "alex.morgan@company.com",
      panNumber: "ABCDE1234F",
    },
    address: {
      currentAddress: {
        flatNo: "123",
        area: "Main Street",
        city: "New York",
        state: "NY",
        pincode: "10001",
        country: "USA",
      },
      permanentAddress: {
        flatNo: "456",
        area: "Second Street",
        city: "Los Angeles",
        state: "CA",
        pincode: "90001",
        country: "USA",
      },
    },
    relation: {
      name: "Emily Morgan",
      type: "Spouse",
      contactNumber: "+91 9876543210",
    },
  };

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
              value={data.personalDetails.firstName}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Last Name"
              value={data.personalDetails.lastName}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Employee ID"
              value={data.personalDetails.employeeId}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Date of Birth"
              value={data.personalDetails.dob}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Blood Group"
              value={data.personalDetails.bloodGroup}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Mobile Number"
              value={data.personalDetails.mobile}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Personal Email"
              value={data.personalDetails.personalEmail}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="Work Email"
              value={data.personalDetails.workEmail}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
          <Col span={8}>
            <ViewField
              label="PAN Number"
              value={data.personalDetails.panNumber}
              labelStyle={{ fontSize: 12 }}
              valueStyle={{ fontSize: 13 }}
            />
          </Col>
        </Row>
      </Card>

      {/* 🔹 Address Card */}
      <Card style={{ borderRadius: 12, padding: 20 }}>
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
                  data.address.currentAddress.flatNo,
                  data.address.currentAddress.area,
                  data.address.currentAddress.city,
                  data.address.currentAddress.state,
                  data.address.currentAddress.pincode,
                  data.address.currentAddress.country,
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
                  data.address.permanentAddress.flatNo,
                  data.address.permanentAddress.area,
                  data.address.permanentAddress.city,
                  data.address.permanentAddress.state,
                  data.address.permanentAddress.pincode,
                  data.address.permanentAddress.country,
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
                <div>{data.relation?.name || "-"}</div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <Text type="secondary">Type</Text>
                <div>{data.relation?.type || "-"}</div>
              </div>

              <div>
                <Text type="secondary">Contact Number</Text>
                <div>{data.relation?.contactNumber || "-"}</div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PersonalDetails;
