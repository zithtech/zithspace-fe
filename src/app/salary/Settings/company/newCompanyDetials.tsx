"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Typography,
  Input,
  Space,
  Button,
  Row,
  Col,
  message,
  Upload,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import { CompanyService } from "@/services/salarySettings.service";
import { Company } from "@/types/salary";

const { Title, Text } = Typography;
const { TextArea } = Input;

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });

interface Props {
  mode: "create" | "edit";
  editingId: number | null;
  onBack: () => void;
  onSaveSuccess: () => void;
  onPreview: (type: "company", data: any) => void;
}

export default function NewCompanyDetails({
  mode,
  editingId,
  onBack,
  onSaveSuccess,
  onPreview,
}: Props) {
  const isEditMode = mode === "edit";

  const [company, setCompany] = useState<Company>({
    id: Date.now(),

    name: "",
    email: "",
    phone: "",

    plotNo: "",
    floorNo: "",
    buildingName: "",
    street: "",
    area: "",
    city: "",
    pincode: "",
    country: "",

    cin: "",
    gst: "",

    isActive: false,
    logo: "",
  });

  useEffect(() => {
    if (isEditMode && editingId) {
      CompanyService.getById(editingId).then((existing) => {
        if (existing) setCompany(existing);
      });
    }
  }, [editingId, isEditMode]);

  const handleSave = async () => {
    if (!company.name) {
      // || !company.email
      message.error("Please enter Company Name and Email");
      return;
    }

    if (isEditMode) {
      await CompanyService.update(editingId!, company);
    } else {
      await CompanyService.create(company);
    }

    onSaveSuccess();
    onBack();
  };

  return (
    <Space direction="vertical" size={24} style={{ width: "100%" }}>
      <Card>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Space align="center" size={12}>
            <ArrowLeftOutlined
              style={{ fontSize: 20, color: "#1677ff", cursor: "pointer" }}
              onClick={onBack}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Title level={4} style={{ margin: 0, lineHeight: 1.2 }}>
                {isEditMode ? "Edit Company" : "Create Company"}
              </Title>
              <Text type="secondary">Configure company details</Text>
            </div>
          </Space>

          <Space>
            <Button
              icon={<EyeOutlined />}
              onClick={() => onPreview("company", company)}
            >
              Preview
            </Button>

            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
              Save
            </Button>
          </Space>
        </div>

        <Row gutter={16} align="stretch">
          {/* Logo */}
          <Col xs={24} sm={8}>
            <Card
              title="Company Logo"
              style={{
                height: "100%",
                border: "1px solid #b9b8b8ff",
                marginTop: 16,
              }}
            >
              <Upload
                listType="picture-card"
                maxCount={1}
                showUploadList={false}
                beforeUpload={async (file) => {
                  const base64 = await toBase64(file);
                  setCompany((prev) => ({ ...prev, logo: base64 }));
                  return false;
                }}
              >
                {company.logo ? (
                  <img
                    src={company.logo}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div>
                    <UploadOutlined />
                    <div>Upload Logo</div>
                  </div>
                )}
              </Upload>
              <Text type="secondary">PNG, JPG (Max 2MB)</Text>
            </Card>
          </Col>

          {/* Basic Info */}
          <Col xs={24} sm={16}>
            <Card
              title="Basic Information"
              style={{
                height: "100%",
                border: "1px solid #b9b8b8ff",
                marginTop: 16,
              }}
            >
              {/* Company Name & Email */}
              <Row gutter={16}>
                <Col span={12}>
                  <Input
                    placeholder="Company Name"
                    value={company.name}
                    onChange={(e) =>
                      setCompany({ ...company, name: e.target.value })
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="Email"
                    value={company.email}
                    onChange={(e) =>
                      setCompany({ ...company, email: e.target.value })
                    }
                  />
                </Col>
              </Row>

              {/* Phone */}
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Input
                    placeholder="Phone Number"
                    value={company.phone}
                    onChange={(e) =>
                      setCompany({ ...company, phone: e.target.value })
                    }
                  />
                </Col>
              </Row>

              {/* REGISTERED ADDRESS TITLE */}
              <div style={{ marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
                Registered Address
              </div>

              {/* Plot & Floor */}
              <Row gutter={16}>
                <Col span={12}>
                  <Input
                    placeholder="Plot / Door No"
                    value={company.plotNo}
                    onChange={(e) =>
                      setCompany({ ...company, plotNo: e.target.value })
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="Floor No"
                    value={company.floorNo}
                    onChange={(e) =>
                      setCompany({ ...company, floorNo: e.target.value })
                    }
                  />
                </Col>
              </Row>

              {/* Building & Street */}
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Input
                    placeholder="Building Name"
                    value={company.buildingName}
                    onChange={(e) =>
                      setCompany({ ...company, buildingName: e.target.value })
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="Street Name"
                    value={company.street}
                    onChange={(e) =>
                      setCompany({ ...company, street: e.target.value })
                    }
                  />
                </Col>
              </Row>

              {/* Area & City */}
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Input
                    placeholder="Area / Locality"
                    value={company.area}
                    onChange={(e) =>
                      setCompany({ ...company, area: e.target.value })
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="City"
                    value={company.city}
                    onChange={(e) =>
                      setCompany({ ...company, city: e.target.value })
                    }
                  />
                </Col>
              </Row>

              {/* Pincode & Country */}
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Input
                    placeholder="Pincode"
                    value={company.pincode}
                    onChange={(e) =>
                      setCompany({ ...company, pincode: e.target.value })
                    }
                  />
                </Col>
                <Col span={12}>
                  <Input
                    placeholder="Country"
                    value={company.country}
                    onChange={(e) =>
                      setCompany({ ...company, country: e.target.value })
                    }
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Tax Info */}
        <Card
          title="Tax & Registration Details"
          style={{ border: "1px solid #b9b8b8ff", marginTop: 30 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Input
                placeholder="CIN Number"
                value={company.cin}
                onChange={(e) =>
                  setCompany({ ...company, cin: e.target.value })
                }
              />
            </Col>
            <Col span={12}>
              <Input
                placeholder="GST Number"
                value={company.gst}
                onChange={(e) =>
                  setCompany({ ...company, gst: e.target.value })
                }
              />
            </Col>
          </Row>
        </Card>
      </Card>
    </Space>
  );
}
