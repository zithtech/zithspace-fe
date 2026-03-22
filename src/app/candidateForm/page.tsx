"use client";

import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Switch,
  Upload,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  Tooltip,
  Tag,
  App as AntApp,
  Empty,
} from "antd";
import {
  SaveOutlined,
  SendOutlined,
  ReloadOutlined,
  PlusOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  FileOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  UserOutlined,
  FileTextOutlined,
  LinkOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import AttachmentUploader from "@/components/common/AttachmentUploader";
import { Country, State, City } from "country-state-city";
import dayjs from "dayjs";
import axios from "axios";
import { api } from "@/lib/axios";
import { useTenant } from "@/context/TenantContext";
import MainLayout from "@/components/layout/MainLayout";

const { Title, Text } = Typography;
const { TextArea } = Input;

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const CandidateForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [joiningDateVisible, setJoiningDateVisible] = useState(false);
  const { notification, message, modal } = AntApp.useApp();
  const { tenantId, tenantInfo, isLoading } = useTenant();
  const [documents, setDocuments] = useState<Record<string, { base64: string; fileName: string }>>({});

  // Cascading Dropdowns Data
  const [selectedCountry, setSelectedCountry] = useState("IN");
  const [selectedState, setSelectedState] = useState("");

  const countries = [
    { label: "India", value: "IN" },
    { label: "USA", value: "US" },
    { label: "Russia", value: "RU" },
  ];

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedState("");
    form.setFieldsValue({ state: undefined, city: undefined });
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    form.setFieldsValue({ city: undefined });
  };


  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        personalInfo: {
          fullName: values.fullName,
          email: values.email,
          contactNumber: values.contactNumber,
          addressLine1: values.addressLine1,
          addressLine2: values.addressLine2,
          city: values.city,
          state: values.state,
          zipCode: values.zipCode,
          country: countries.find(c => c.value === values.country)?.label || values.country,
        },
        currentEmployer: {
          reportingManagerName: values.managerName,
          reportingManagerEmail: values.managerEmail,
          reportingManagerPhone: values.managerPhone,
          employerCompanyWebsite: values.companyWebsite,
          currentEmployerCompanyName: values.companyName,
        },
        workAuth: {
          workAuthorizationType: values.visaType,
          visaValidityDate: values.visaValidity ? dayjs(values.visaValidity).format("YYYY-MM-DD") : null,
          willingToTransferVisa: values.willingToTransfer,
          ssnNumber: values.ssn,
          passportNumber: values.passport,
        },
        availability: {
          earliestAvailable: values.availabilityStatus,
          joiningDate: values.joiningDate ? dayjs(values.joiningDate).format("YYYY-MM-DD") : null,
          noticePeriod: values.noticePeriod,
        },
        interviewAvailability: values.interviewSlots?.map((slot: any) => ({
          interviewDate: dayjs(slot.date).format("YYYY-MM-DD"),
          startTime: slot.startTime ? dayjs(slot.startTime).format("HH:mm") : null,
          endTime: slot.endTime ? dayjs(slot.endTime).format("HH:mm") : null,
        })),
        professionalProfiles: {
          linkedinUrl: values.linkedin,
          githubUrl: values.github,
          portfolioWebsite: values.portfolio,
        },
        documents,
        internalNotes: values.notes,
      };

      const response = await api.post("/api/candidate-form", payload);

      notification.success({
        message: "Submission Successful",
        description: "Candidate details have been saved to the database.",
        placement: "topRight",
      });
      form.resetFields();
      setDocuments({});
    } catch (error: any) {
      console.error("Submission failed:", error);
      notification.error({
        message: "Submission Failed",
        description: error.response?.data?.message || "Failed to submit form",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setDocuments({});
    message.info("Form reset complete.");
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <ReloadOutlined spin style={{ fontSize: "32px", color: "#1677ff" }} />
      </div>
    );
  }

  return (
    <MainLayout>
      <div style={{ background: "#fff", minHeight: "100%" }}>
        {/* 🧱 Header Section (Fixed within content) */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#fff",
            padding: "16px 24px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                background: "#1677ff",
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "#fff",
                fontSize: "24px",
              }}
            >
              <FileTextOutlined />
            </div>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Candidate Details Collection Form
              </Title>
              <Text type="secondary">Collect candidate information for job submissions</Text>
            </div>
          </div>
          <Space>
            <Button icon={<SaveOutlined />} onClick={() => message.info("Draft feature coming soon!")}>
              Save Draft
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={loading}
              onClick={() => form.submit()}
            >
              Submit Candidate
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset Form
            </Button>
          </Space>
        </div>

        {/* 📦 Form Content (Scrollable due to parent Layout.Content) */}
        <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              country: "IN",
              availabilityStatus: "Immediate Joiner",
              interviewSlots: [{}],
            }}
          >
            {/* 1️⃣ Personal Information */}
            <Card
              title={
                <Space>
                  <UserOutlined /> Personal Information
                </Space>
              }
              style={{ marginBottom: "24px", borderRadius: "8px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "15px" }}
            >
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="Full Name"
                    name="fullName"
                    rules={[{ required: true, message: "Please enter full name" }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="e.g. John Doe" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[
                      { required: true, message: "Please enter email" },
                      { type: "email", message: "Invalid email format" },
                    ]}
                  >
                    <Input placeholder="e.g. john@example.com" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Contact Number"
                    name="contactNumber"
                    rules={[
                      { required: true, message: "Please enter contact number" },
                      { pattern: /^\d+$/, message: "Numbers only" },
                    ]}
                  >
                    <Input placeholder="e.g. 9876543210" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="Address Line 1"
                    name="addressLine1"
                    rules={[{ required: true, message: "Required" }]}
                  >
                    <Input placeholder="House No, Street, Area" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Address Line 2" name="addressLine2">
                    <Input placeholder="Landmark, Locality (Optional)" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={6}>
                  <Form.Item label="Country" name="country" rules={[{ required: true }]}>
                    <Select onChange={handleCountryChange} options={countries} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="State" name="state" rules={[{ required: true }]}>
                    <Select
                      placeholder="Search State"
                      showSearch
                      onChange={handleStateChange}
                      options={State.getStatesOfCountry(selectedCountry).map((s) => ({
                        label: s.name,
                        value: s.isoCode,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="City" name="city" rules={[{ required: true }]}>
                    <Select
                      placeholder="Search City"
                      showSearch
                      options={City.getCitiesOfState(selectedCountry, selectedState).map((c) => ({
                        label: c.name,
                        value: c.name,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Zip Code" name="zipCode" rules={[{ required: true }]}>
                    <Input placeholder="e.g. 10001" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 2️⃣ Current Employer Contact */}
            <Card
              title={
                <Space>
                  <EnvironmentOutlined /> Current Employer Contact
                </Space>
              }
              style={{ marginBottom: "24px", borderRadius: "8px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "15px" }}
            >
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="Reporting Manager Name" name="managerName">
                    <Input placeholder="Name" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Reporting Manager Email"
                    name="managerEmail"
                    rules={[{ type: "email", message: "Invalid email" }]}
                  >
                    <Input placeholder="Email" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Reporting Manager Phone"
                    name="managerPhone"
                    rules={[{ pattern: /^\d+$/, message: "Numbers only" }]}
                  >
                    <Input placeholder="Phone" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Company Website" name="companyWebsite">
                    <Input prefix={<GlobalOutlined />} placeholder="https://company.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Employer Company Name" name="companyName">
                    <Input placeholder="Company Name" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 3️⃣ Work Authorization */}
            <Card
              title={
                <Space>
                  <SafetyCertificateOutlined /> Work Authorization
                </Space>
              }
              style={{ marginBottom: "24px", borderRadius: "8px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "15px" }}
            >
              <Row gutter={24} align="bottom">
                <Col span={6}>
                  <Form.Item label="Work Authorization Type" name="visaType">
                    <Select
                      options={[
                        { label: "US Citizen", value: "US Citizen" },
                        { label: "Green Card", value: "Green Card" },
                        { label: "H1B", value: "H1B" },
                        { label: "H4 EAD", value: "H4 EAD" },
                        { label: "OPT", value: "OPT" },
                        { label: "CPT", value: "CPT" },
                        { label: "L2 EAD", value: "L2 EAD" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="Visa Validity Date" name="visaValidity">
                    <DatePicker style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item
                    label="Willing to Transfer Visa"
                    name="willingToTransfer"
                    valuePropName="checked"
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="SSN Number" name="ssn">
                    <Input.Password
                      placeholder="XXX-XX-XXXX"
                      iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Passport Number" name="passport">
                    <Input.Password
                      placeholder="Passport No."
                      iconRender={(visible) => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 4️⃣ Availability */}
            <Card
              title={
                <Space>
                  <CalendarOutlined /> Availability
                </Space>
              }
              style={{ marginBottom: "24px", borderRadius: "8px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "15px" }}
            >
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item label="Earliest Available to Join" name="availabilityStatus">
                    <Select
                      onChange={(val) => setJoiningDateVisible(val === "Select Date")}
                      options={[
                        { label: "Immediate Joiner", value: "Immediate Joiner" },
                        { label: "Select Date", value: "Select Date" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                {joiningDateVisible && (
                  <Col span={8}>
                    <Form.Item label="Joining Date" name="joiningDate">
                      <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                  </Col>
                )}
                <Col span={8}>
                  <Form.Item label="Notice Period (Days)" name="noticePeriod">
                    <Input placeholder="e.g. 30" suffix="Days" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 5️⃣ Interview Availability */}
            <Card
              title={
                <Space>
                  <CalendarOutlined /> Interview Availability
                </Space>
              }
              style={{ marginBottom: "24px", borderRadius: "8px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "15px" }}
            >
              <Form.List name="interviewSlots">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={16} key={key} align="bottom" style={{ marginBottom: "8px" }}>
                        <Col span={7}>
                          <Form.Item
                            {...restField}
                            label={name === 0 ? "Interview Date" : ""}
                            name={[name, "date"]}
                            rules={[{ required: true, message: "Required" }]}
                          >
                            <DatePicker style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item
                            {...restField}
                            label={name === 0 ? "Start Time" : ""}
                            name={[name, "startTime"]}
                            rules={[{ required: true, message: "Required" }]}
                          >
                            <DatePicker picker="time" format="HH:mm" style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col span={7}>
                          <Form.Item
                            {...restField}
                            label={name === 0 ? "End Time" : ""}
                            name={[name, "endTime"]}
                            rules={[{ required: true, message: "Required" }]}
                          >
                            <DatePicker picker="time" format="HH:mm" style={{ width: "100%" }} />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item>
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              onClick={() => remove(name)}
                              disabled={fields.length === 1}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Slot
                    </Button>
                  </>
                )}
              </Form.List>
            </Card>

            {/* 6️⃣ Professional Profiles */}
            <Card
              title={
                <Space>
                  <LinkOutlined /> Professional Profiles
                </Space>
              }
              style={{ marginBottom: "24px", borderRadius: "8px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "15px" }}
            >
              <Row gutter={24}>
                <Col span={8}>
                  <Form.Item
                    label="LinkedIn URL"
                    name="linkedin"
                    rules={[{ type: "url", message: "Invalid URL" }]}
                  >
                    <Input placeholder="https://linkedin.com/in/..." />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="GitHub URL"
                    name="github"
                    rules={[{ type: "url", message: "Invalid URL" }]}
                  >
                    <Input placeholder="https://github.com/..." />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label="Portfolio Website"
                    name="portfolio"
                    rules={[{ type: "url", message: "Invalid URL" }]}
                  >
                    <Input placeholder="https://myportfolio.com" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* 7️⃣ Candidate Documents */}
            <Card
              title={
                <Space>
                  <FileTextOutlined /> Candidate Documents
                </Space>
              }
              style={{ marginBottom: "24px", borderRadius: "8px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "15px" }}
            >
              <Row gutter={[16, 16]}>
                {[
                  { label: "Resume", key: "resume" },
                  { label: "Passport", key: "passport" },
                  { label: "Driving License", key: "driving_license" },
                  { label: "Visa Document", key: "visa_document" },
                  { label: "Identity Proof", key: "identity_proof" },
                  { label: "Additional Attachments", key: "additional_attachments" },
                ].map((doc) => {
                  const attachment = documents[doc.key];

                  return (
                    <Col span={8} key={doc.key}>
                      <div
                        style={{
                          border: "1px solid #d9d9d9",
                          borderRadius: "8px",
                          padding: "16px",
                          height: "220px",
                          display: "flex",
                          flexDirection: "column",
                          background: "#fafafa"
                        }}
                      >
                        <Title level={5} style={{ marginBottom: 16 }}>
                          {doc.label}
                        </Title>

                        {attachment ? (
                          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                              <div
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "8px",
                                  background: "#e6f7ff",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <FileOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Text
                                  strong
                                  ellipsis
                                  title={attachment.fileName}
                                  style={{ fontSize: "13px", display: "block", marginBottom: 4 }}
                                >
                                  {attachment.fileName}
                                </Text>
                                <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                                  Uploaded on {dayjs().format("MMM DD, YYYY")}
                                </Text>
                              </div>
                            </div>
                            <Button
                              type="link"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              style={{ padding: 0, textAlign: "left", width: "fit-content", marginTop: 8 }}
                              onClick={() => {
                                const newDocs = { ...documents };
                                delete newDocs[doc.key];
                                setDocuments(newDocs);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : (
                          <div
                            style={{
                              flex: 1,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              textAlign: "center",
                            }}
                          >
                            <Empty
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                              description="No file uploaded"
                              style={{ marginBottom: 16 }}
                            />
                            <AttachmentUploader
                              onUpload={async (file: string, fileName: string) => {
                                setDocuments((prev) => ({
                                  ...prev,
                                  [doc.key]: {
                                    base64: file,
                                    fileName: fileName,
                                  },
                                }));
                              }}
                              accept="*"
                              style={{ width: "100%" }}
                            />
                          </div>
                        )}
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card>

            {/* 8️⃣ Internal Recruiter Notes */}
            <Card
              title={
                <Space>
                  <FileTextOutlined /> Internal Candidate Notes
                </Space>
              }
              style={{ marginBottom: "24px", borderRadius: "8px", border: "1px solid #f0f0f0" }}
              bodyStyle={{ padding: "15px" }}
            >
              <Form.Item name="notes">
                <TextArea
                  rows={6}
                  placeholder="Enter any internal notes or feedback about the candidate..."
                  style={{ fontSize: "14px" }}
                />
              </Form.Item>
            </Card>
          </Form>
        </div>
      </div>
    </MainLayout>
  );
};

const CandidateApp = () => (
  <AntApp>
    <CandidateForm />
  </AntApp>
);

export default CandidateApp;