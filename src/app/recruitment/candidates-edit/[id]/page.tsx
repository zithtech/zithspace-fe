"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermission } from "@/hooks/usePermission";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";

import { Row, Col, Typography, Button, Space, Form, Input, Select, Card, DatePicker, Switch, TimePicker, Upload, Checkbox, message, Empty } from "antd";
import { SaveOutlined, SendOutlined, ReloadOutlined, PlusOutlined, MinusCircleOutlined, UploadOutlined, FileOutlined, DeleteOutlined, ArrowLeftOutlined } from "@ant-design/icons";

import { useParams, useRouter } from "next/navigation";
import { Country, State, City } from "country-state-city";
import dayjs from "dayjs";
import { useCandidate } from "@/hooks/useCandidate";
import candidateService from "@/services/candidateService";
import { REGEX } from "@/utils/regex";
import moment from "moment-timezone";
import ZukvoLoader from "@/components/common/ZukvoLoader";


const { Title, Text } = Typography;

const PREDEFINED_SKILLS = [
  "Java", "Spring Boot", "React", "Microservices", "AWS", "Docker",
  "Kubernetes", "Python", "Angular", ".NET", "SQL", "MongoDB",
  "Node.js", "TypeScript", "GraphQL", "Terraform", "Jenkins",
  "Azure", "GCP", "Kafka"
];

const CANDIDATE_TAGS = [
  "Hot Candidate", "Remote Only", "Senior Level", "Lead", "Fullstack", "Backend"
];



const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
  });
};

const DocumentUploadCard = ({ fileList, onChange, title, multiple = false }: any) => {
  const currentFiles = fileList || [];
  const hasFile = currentFiles.length > 0;

  return (
    <div style={{ border: "1px solid #d9d9d9", borderRadius: "8px", padding: "16px", height: "250px", display: "flex", flexDirection: "column" }}>
      <Title level={5} style={{ marginBottom: 16, fontSize: "14px", flexShrink: 0 }}>{title}</Title>

      {(!hasFile || multiple) && (
        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
          {!hasFile && (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No file uploaded" style={{ marginBottom: 16 }} />
          )}
          <Upload
            beforeUpload={() => false}
            multiple={multiple}
            maxCount={multiple ? undefined : 1}
            fileList={currentFiles}
            onChange={onChange}
            showUploadList={false}
          >
            <Button icon={<UploadOutlined />}>Upload {title}</Button>
          </Upload>
        </div>
      )}

      {hasFile && (
        <div style={{ width: "100%", marginTop: (!hasFile || multiple) ? 16 : 0, overflowY: "auto", flex: 1, paddingRight: 4 }}>
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            {currentFiles.map((file: any) => (
              <div key={file.uid} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px", border: "1px solid #f0f0f0", borderRadius: "4px" }}>
                <FileOutlined style={{ fontSize: "20px", color: "#1890ff" }} />
                <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                  <Text ellipsis title={file.name} style={{ fontSize: "12px", fontWeight: 500, display: "block" }}>
                    {file.name}
                  </Text>
                  {file.size && (
                    <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  )}
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    const newFileList = currentFiles.filter((f: any) => f.uid !== file.uid);
                    onChange(newFileList);
                  }}
                />
              </div>
            ))}
          </Space>
        </div>
      )}
    </div>
  );
};

export default function CandidateEdit() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const { isLoading: authLoading } = useAuth();
  const { canManageLeaves } = usePermission();

  const [form] = Form.useForm();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("");
  const [availableToJoin, setAvailableToJoin] = useState<string>("");
  const [isFetching, setIsFetching] = useState(true);

  const { updateCandidate, isSubmitting } = useCandidate();

  useEffect(() => {
    if (candidateId) {
      setIsFetching(true);
      candidateService.getById(candidateId)
        .then(res => {
          if (res) {
            const data = res;

            // Pre-fill states to allow dependent dropdowns to work
            setSelectedCountry(data.country || "");
            setSelectedState(data.state || "");
            setAvailableToJoin(data.earliestAvailable || "");

            // Transform dates from strings back to dayjs objects for the form
            const formData = {
              ...data,
              visaValidityDate: data.visaValidityDate ? dayjs(data.visaValidityDate) : undefined,
              joiningDate: data.joiningDate ? dayjs(data.joiningDate) : undefined,
              workExperience: data.workExperiences?.map((exp: any) => ({
                ...exp,
                startDate: exp.startDate ? dayjs(exp.startDate) : undefined,
                endDate: exp.endDate ? dayjs(exp.endDate) : undefined
              })) || [],
              skillsMatrix: data.skills?.map((skill: any) => ({
                ...skill,
                lastUsedYear: skill.lastUsedYear ? dayjs(skill.lastUsedYear) : undefined
              })) || [],
              education: data.educations?.map((edu: any) => ({
                ...edu,
                startDate: edu.startDate ? dayjs(edu.startDate) : undefined,
                endDate: edu.endDate ? dayjs(edu.endDate) : undefined
              })) || [],
              interviewSlots: data.interviewSlots?.map((slot: any) => ({
                ...slot,
                interviewDate: slot.interviewDate ? dayjs(slot.interviewDate) : undefined,
                startTime: slot.startTime && slot.startTime !== "Invalid Date" ? dayjs(`2000-01-01T${slot.startTime}`) : undefined,
                endTime: slot.endTime && slot.endTime !== "Invalid Date" ? dayjs(`2000-01-01T${slot.endTime}`) : undefined,
                timezone: slot.timezone
              })) || [],
              // We assume confirmation is granted if editing an existing profile
              candidateConfirmation: true
            };

            form.setFieldsValue(formData);
          } else {
            message.error("Failed to load candidate details.");
            router.push("/recruitment/candidate-management");
          }
        })
        .catch(err => {
          console.error(err);
          message.error("Error loading candidate details.");
        })
        .finally(() => setIsFetching(false));
    }
  }, [candidateId, form, router]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    setSelectedState("");
    form.setFieldsValue({ state: undefined, city: undefined });
  };

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    form.setFieldsValue({ city: undefined });
  };

  const countries = Country.getAllCountries();
  const states = selectedCountry ? State.getStatesOfCountry(selectedCountry) : [];
  const cities = selectedState ? City.getCitiesOfState(selectedCountry, selectedState) : [];

  const zones = [
    "Asia/Kolkata",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
  ];
  const timezones = zones.map((zone) => ({
    label: moment().tz(zone).format("z"),
    value: zone
  }));

  const handleReset = () => {
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      // Validate the form
      const values = await form.validateFields();

      // Format dates (dayjs to ISO strings) to match the backend Prisma schema
      const payload = {
        ...values,
        visaValidityDate: values.visaValidityDate?.toISOString(),
        joiningDate: values.joiningDate?.toISOString(),
        workExperience: values.workExperience?.map((exp: any) => ({
          ...exp,
          startDate: exp.startDate?.toISOString(),
          endDate: exp.endDate?.toISOString()
        })),
        skillsMatrix: values.skillsMatrix?.map((skill: any) => ({
          ...skill,
          lastUsedYear: skill.lastUsedYear?.toISOString()
        })),
        education: values.education?.map((edu: any) => ({
          ...edu,
          startDate: edu.startDate?.toISOString(),
          endDate: edu.endDate?.toISOString()
        })),
        interviewSlots: values.interviewSlots?.map((slot: any) => ({
          ...slot,
          interviewDate: slot.interviewDate?.toISOString(),
          startTime: slot.startTime?.format("HH:mm"),
          endTime: slot.endTime?.format("HH:mm"),
          timezone: slot.timezone
        }))
      };

      const processFile = async (fileList: any) => {
        if (fileList && fileList.length > 0) {
          const file = fileList[0].originFileObj || fileList[0];
          if (file instanceof File) {
            const base64 = await fileToBase64(file as File);
            return { fileName: file.name, base64 };
          }
        }
        return null;
      };

      const processMultipleFiles = async (fileList: any) => {
        if (!fileList || fileList.length === 0) return [];
        const results = [];
        for (const f of fileList) {
          const file = f.originFileObj || f;
          if (file instanceof File) {
            const base64 = await fileToBase64(file as File);
            results.push({ fileName: file.name, base64 });
          }
        }
        return results;
      };

      const resumeData = await processFile(payload.resume);
      const passportData = await processFile(payload.passport);
      const drivingLicenseData = await processFile(payload.drivingLicense);
      const visaDocumentData = await processFile(payload.visaDocument);
      const identityProofData = await processFile(payload.identityProof);
      const certificationsData = await processMultipleFiles(payload.certifications);

      // Strip non-JSON serializable file lists & front-end only checkboxes
      const { resume, passport, drivingLicense, visaDocument, identityProof, certifications, candidateConfirmation, ...payloadWithoutFiles } = payload;

      const finalPayload = {
        ...payloadWithoutFiles,
        resume: resumeData,
        passport: passportData,
        drivingLicense: drivingLicenseData,
        visaDocument: visaDocumentData,
        identityProof: identityProofData,
        certifications: certificationsData
      };

      // Call the hook to update data
      await updateCandidate(candidateId, finalPayload);

    } catch (error) {
      console.error("Form validation failed:", error);
      message.error("Please fill in all required fields properly.");
    }
  };

  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e?.fileList;
  };
  const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const defaultTimezone =
    zones.includes(detectedZone) ? detectedZone : "Asia/Kolkata";
  return (
    <ProtectedRoute>
      <MainLayout>
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)", overflow: "hidden" }}>
          {/* Fixed Header Section */}

          <div
            style={{
              flexShrink: 0,
              zIndex: 1000,
              //backgroundColor: "#fff",
              padding: "16px 24px",
              // borderBottom: "1px solid #e8e8e8",
              // boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
            }}
          >
            <div>
              <Button icon={<ArrowLeftOutlined />} type="link" onClick={() => router.push("/recruitment/candidate-management")} style={{ marginBottom: 16, paddingLeft: 0 }}>
                Back to Candidates
              </Button>
            </div>
            <Row justify="space-between" align="middle">
              <Col>
                <Space direction="vertical" size={0}>
                  <Title level={2} style={{ margin: 0 }}>
                    Edit Candidate
                  </Title>
                  <Text type="secondary">
                    Update existing candidate information
                  </Text>
                </Space>
              </Col>
              <Col>
                <Space style={{ gap: 10 }}>
                  <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={isSubmitting} disabled={isFetching}>
                    Update Candidate
                  </Button>
                  <Button danger icon={<ReloadOutlined />} onClick={handleReset} disabled={isFetching}>
                    Reset Form
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* Candidate Form Area */}
          <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
            {isFetching ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <ZukvoLoader size="lg" />
              </div>
            ) : (
              <Form form={form} layout="vertical">
                <Card title="Personal Details" bordered={false}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item
                        label="Full Legal Name"
                        name="fullName"
                        normalize={(value) => value ? value.replace(/(^\w|\s\w)/g, (m: string) => m.toUpperCase()) : value}
                        rules={[
                          { required: true, message: "Please enter full legal name" }
                        ]}
                      >
                        <Input placeholder="Enter full legal name" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Email Address" name="email" rules={[
                        { required: true, message: "Please enter a valid email address" },
                        { pattern: REGEX.EMAIL, message: "Please enter a valid email address" }
                      ]}>
                        <Input placeholder="Enter email address" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Phone Number" name="phoneNumber" rules={[
                        { required: true, message: "Please enter phone number" }
                      ]}>
                        <Input placeholder="Enter phone number" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={6}>
                      <Form.Item label="Country" name="country">
                        <Select
                          placeholder="Select country"
                          onChange={handleCountryChange}
                          showSearch
                          optionFilterProp="children"
                        >
                          {countries.map((c) => (
                            <Select.Option key={c.isoCode} value={c.isoCode}>{c.name}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="State" name="state">
                        <Select
                          placeholder="Select state"
                          onChange={handleStateChange}
                          disabled={!selectedCountry}
                          showSearch
                          optionFilterProp="children"
                        >
                          {states.map((s) => (
                            <Select.Option key={s.isoCode} value={s.isoCode}>{s.name}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="City" name="city">
                        <Select
                          placeholder="Select city"
                          disabled={!selectedState}
                          showSearch
                          optionFilterProp="children"
                        >
                          {cities.map((c) => (
                            <Select.Option key={c.name} value={c.name}>{c.name}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item label="Timezone" name="timezone">
                        <Select
                          placeholder="Select timezone"
                          showSearch
                          options={timezones}
                          filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="LinkedIn Profile URL" name="linkedinUrl">
                        <Input placeholder="Enter LinkedIn URL" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="GitHub URL" name="githubUrl">
                        <Input placeholder="Enter GitHub URL" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Portfolio Website" name="portfolioUrl">
                        <Input placeholder="Enter portfolio website" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Preferred Contact Method" name="preferredContactMethod">
                        <Select placeholder="Select preferred contact method">
                          <Select.Option value="Call">Call</Select.Option>
                          <Select.Option value="Email">Email</Select.Option>
                          <Select.Option value="WhatsApp">WhatsApp</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Active Status" name="isActive" valuePropName="checked">
                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Career Summary" bordered={false} style={{ marginTop: 24 }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Current Role/Title" name="currentRole">
                        <Input placeholder="Enter current role or title" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Total Years of Experience" name="yearsOfExperience">
                        <Input type="number" placeholder="Enter total years of experience" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Primary Skills" name="primarySkills">
                        <Select mode="tags" placeholder="Select or type to add primary skills">
                          {PREDEFINED_SKILLS.map(skill => (
                            <Select.Option key={skill} value={skill}>{skill}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Secondary Skills" name="secondarySkills">
                        <Select mode="tags" placeholder="Select or type to add secondary skills">
                          {PREDEFINED_SKILLS.map(skill => (
                            <Select.Option key={skill} value={skill}>{skill}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label="Professional Summary" name="professionalSummary">
                        <Input.TextArea rows={4} placeholder="Enter a brief professional summary" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Work Experience" bordered={false} style={{ marginTop: 24 }}>
                  <Form.List name="workExperience">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Card
                            key={key}
                            type="inner"
                            title={`Experience ${name + 1}`}
                            extra={<MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red", fontSize: "16px" }} />}
                            style={{ marginBottom: 16, border: "1px solid #f0f0f0" }}
                          >
                            <Row gutter={16}>
                              <Col span={8}>
                                <Form.Item {...restField} label="Company Name" name={[name, "companyName"]} rules={[
                                  { required: true, message: "Please enter company name" }
                                ]}>
                                  <Input placeholder="Enter company name" />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item {...restField} label="Company Website" name={[name, "companyWebsite"]}>
                                  <Input placeholder="Enter company website" />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item {...restField} label="Job Title" name={[name, "jobTitle"]} rules={[
                                  { required: true, message: "Please enter job title" }
                                ]}>
                                  <Input placeholder="Enter job title" />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Row gutter={16}>
                              <Col span={6}>
                                <Form.Item {...restField} label="Start Date" name={[name, "startDate"]} rules={[{ required: true, message: "Please select start date" }]}>
                                  <DatePicker style={{ width: "100%" }} picker="month" placeholder="Select start date" />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item {...restField} label="End Date" name={[name, "endDate"]}>
                                  <DatePicker style={{ width: "100%" }} picker="month" placeholder="Select end date" />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item {...restField} label="Location" name={[name, "location"]}>
                                  <Input placeholder="Enter location" />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item {...restField} label="Employment Type" name={[name, "employmentType"]}>
                                  <Select placeholder="Select type">
                                    {["Full-time", "Part-time", "Contract", "Internship", "Freelance"].map(type => (
                                      <Select.Option key={type} value={type}>{type}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>

                            <Row gutter={16}>
                              <Col span={12}>
                                <Form.Item {...restField} label="Work Mode" name={[name, "workMode"]}>
                                  <Select placeholder="Select work mode">
                                    {["On-site", "Hybrid", "Remote"].map(mode => (
                                      <Select.Option key={mode} value={mode}>{mode}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item {...restField} label="Skills Used" name={[name, "skillsUsed"]}>
                                  <Select mode="tags" placeholder="Select or type to add skills used">
                                    {PREDEFINED_SKILLS.map(skill => (
                                      <Select.Option key={skill} value={skill}>{skill}</Select.Option>
                                    ))}
                                  </Select>
                                </Form.Item>
                              </Col>
                            </Row>

                            <Row gutter={16}>
                              <Col span={24}>
                                <Form.Item {...restField} label="Responsibilities" name={[name, "responsibilities"]}>
                                  <Input.TextArea rows={4} placeholder="Enter key responsibilities and achievements" />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        <Form.Item>
                          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            Add Work Experience
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Card>

                <Card title="Skill Experience Matrix" bordered={false} style={{ marginTop: 24 }}>
                  <Form.List name="skillsMatrix">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Row key={key} gutter={16} align="top">
                            <Col span={8}>
                              <Form.Item {...restField} label="Skill Name" name={[name, "skillName"]} rules={[{ required: true, message: "Please select or enter a skill" }]}>
                                <Select mode="tags" placeholder="Select or type to add skill">
                                  {PREDEFINED_SKILLS.map(skill => (
                                    <Select.Option key={skill} value={skill}>{skill}</Select.Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item {...restField} label="Years of Experience" name={[name, "yearsOfExperience"]} rules={[
                                { required: true, message: "Please enter years" }
                              ]}>
                                <Input type="number" placeholder="Enter years of experience" />
                              </Form.Item>
                            </Col>
                            <Col span={7}>
                              <Form.Item {...restField} label="Last Used Year" name={[name, "lastUsedYear"]} rules={[{ required: true, message: "Please select year" }]}>
                                <DatePicker picker="year" style={{ width: "100%" }} placeholder="Select last used year" />
                              </Form.Item>
                            </Col>
                            <Col span={1} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                              <Form.Item label=" " colon={false}>
                                <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red", fontSize: "16px", cursor: "pointer" }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        ))}
                        <Form.Item>
                          <Button type="dashed" onClick={() => add({ lastUsedYear: dayjs() })} block icon={<PlusOutlined />}>
                            Add Skill
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Card>

                <Card title="Education" bordered={false} style={{ marginTop: 24 }}>
                  <Form.List name="education">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Card
                            key={key}
                            type="inner"
                            title={`Education ${name + 1}`}
                            extra={<MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red", fontSize: "16px" }} />}
                            style={{ marginBottom: 16, border: "1px solid #f0f0f0" }}
                          >
                            <Row gutter={16}>
                              <Col span={8}>
                                <Form.Item {...restField} label="Degree Name" name={[name, "degreeName"]} rules={[
                                  { required: true, message: "Please enter degree name" }
                                ]}>
                                  <Input placeholder="Enter degree name (e.g. B.S. Computer Science)" />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item {...restField} label="Specialization" name={[name, "specialization"]}>
                                  <Input placeholder="Enter specialization" />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item {...restField} label="University / College" name={[name, "university"]} rules={[
                                  { required: true, message: "Please enter university/college name" }
                                ]}>
                                  <Input placeholder="Enter university or college" />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Row gutter={16}>
                              <Col span={8}>
                                <Form.Item {...restField} label="Location" name={[name, "location"]}>
                                  <Input placeholder="Enter location" />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item {...restField} label="Start Date" name={[name, "startDate"]} rules={[{ required: true, message: "Please select start date" }]}>
                                  <DatePicker style={{ width: "100%" }} picker="month" placeholder="Select start date" />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item {...restField} label="End Date" name={[name, "endDate"]}>
                                  <DatePicker style={{ width: "100%" }} picker="month" placeholder="Select end date" />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        <Form.Item>
                          <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                            Add Education
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Card>

                <Card title="Work Authorization" bordered={false} style={{ marginTop: 24 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Work Authorization Type" name="workAuthorizationType" rules={[{ required: true, message: "Please select work authorization type" }]}>
                        <Select placeholder="Select type">
                          <Select.Option value="US Citizen">US Citizen</Select.Option>
                          <Select.Option value="Green Card">Green Card</Select.Option>
                          <Select.Option value="H1B">H1B</Select.Option>
                          <Select.Option value="H4 EAD">H4 EAD</Select.Option>
                          <Select.Option value="L1">L1</Select.Option>
                          <Select.Option value="L2 EAD">L2 EAD</Select.Option>
                          <Select.Option value="OPT EAD">OPT EAD</Select.Option>
                          <Select.Option value="CPT">CPT</Select.Option>
                          <Select.Option value="TN Visa">TN Visa</Select.Option>
                          <Select.Option value="Other">Other</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Visa Validity Date" name="visaValidityDate">
                        <DatePicker style={{ width: "100%" }} placeholder="Select validity date" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Willing to Transfer Visa" name="willingToTransferVisa" valuePropName="checked">
                        <Switch checkedChildren="Yes" unCheckedChildren="No" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Employment Preferences" bordered={false} style={{ marginTop: 24 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Employment Type" name="preferredEmploymentType">
                        <Select placeholder="Select preferred type">
                          {["Full-time", "Part-time", "Contract", "Internship", "Freelance"].map(type => (
                            <Select.Option key={type} value={type}>{type}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Expected Rate" name="expectedRate">
                        <Input type="number" placeholder="Enter expected rate" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item label="Rate Unit" name="rateUnit">
                        <Select placeholder="Select unit">
                          <Select.Option value="Per Hour">Per Hour</Select.Option>
                          <Select.Option value="Per Year">Per Year</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="Willing to Relocate" name="willingToRelocate">
                        <Select placeholder="Select an option">
                          <Select.Option value="Yes">Yes</Select.Option>
                          <Select.Option value="No">No</Select.Option>
                          <Select.Option value="Open to Discuss">Open to Discuss</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="Preferred Work Mode" name="preferredWorkMode">
                        <Select placeholder="Select preferred work mode">
                          {["On-site", "Hybrid", "Remote"].map(mode => (
                            <Select.Option key={mode} value={mode}>{mode}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Availability" bordered={false} style={{ marginTop: 24 }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Form.Item label="Earliest Available to Join" name="earliestAvailable">
                        <Select placeholder="Select availability" onChange={(val) => setAvailableToJoin(val)}>
                          <Select.Option value="Immediate Joiner">Immediate Joiner</Select.Option>
                          <Select.Option value="Select Date">Select Date</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    {availableToJoin === "Select Date" && (
                      <Col span={8}>
                        <Form.Item label="Joining Date" name="joiningDate" rules={[{ required: true, message: "Please select a date" }]}>
                          <DatePicker style={{ width: "100%" }} placeholder="Select joining date" />
                        </Form.Item>
                      </Col>
                    )}
                    <Col span={8}>
                      <Form.Item label="Notice Period (Days)" name="noticePeriod">
                        <Input type="number" placeholder="Enter notice period in days" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Interview Availability" bordered={false} style={{ marginTop: 24 }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                    Add multiple interview time slots for the candidate.
                  </Text>
                  <Form.List name="interviewSlots">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => (
                          <Row key={key} gutter={16} align="top">
                            <Col span={6}>
                              <Form.Item {...restField} label="Interview Date" name={[name, "interviewDate"]} rules={[{ required: true, message: "Please select date" }]}>
                                <DatePicker style={{ width: "100%" }} placeholder="Select interview date" />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item {...restField} label="Start Time" name={[name, "startTime"]} rules={[{ required: true, message: "Please select start time" }]}>
                                <TimePicker format="HH:mm" style={{ width: "100%" }} placeholder="Select start time" />
                              </Form.Item>
                            </Col>
                            <Col span={5}>
                              <Form.Item {...restField} label="End Time" name={[name, "endTime"]} rules={[{ required: true, message: "Please select end time" }]}>
                                <TimePicker format="HH:mm" style={{ width: "100%" }} placeholder="Select end time" />
                              </Form.Item>
                            </Col>
                            <Col span={7}>
                              <Form.Item {...restField} label="Timezone" name={[name, "timezone"]} rules={[{ required: true, message: "Please select timezone" }]}>
                                <Select
                                  placeholder="Select timezone"
                                  showSearch
                                  options={timezones}
                                  filterOption={(input, option) => (option?.label ?? "").toLowerCase().includes(input.toLowerCase())}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={1} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                              <Form.Item label=" " colon={false}>
                                <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "red", fontSize: "16px", cursor: "pointer" }} />
                              </Form.Item>
                            </Col>
                          </Row>
                        ))}
                        <Form.Item>
                          <Button type="dashed" onClick={() => add({})} block icon={<PlusOutlined />}>
                            Add Interview Slot
                          </Button>
                        </Form.Item>
                      </>
                    )}
                  </Form.List>
                </Card>

                <Card title="Candidate Documents" bordered={false} style={{ marginTop: 24 }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <Form.Item name="resume" valuePropName="fileList" getValueFromEvent={normFile}>
                        <DocumentUploadCard title="Resume" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="passport" valuePropName="fileList" getValueFromEvent={normFile}>
                        <DocumentUploadCard title="Passport" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="drivingLicense" valuePropName="fileList" getValueFromEvent={normFile}>
                        <DocumentUploadCard title="Driving License" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="visaDocument" valuePropName="fileList" getValueFromEvent={normFile}>
                        <DocumentUploadCard title="Visa Document" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="identityProof" valuePropName="fileList" getValueFromEvent={normFile}>
                        <DocumentUploadCard title="Identity Proof" />
                      </Form.Item>
                    </Col>
                    <Col span={8}>
                      <Form.Item name="certifications" valuePropName="fileList" getValueFromEvent={normFile}>
                        <DocumentUploadCard title="Certifications" multiple={true} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Internal Recruiter Notes" bordered={false} style={{ marginTop: 24 }}>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label="Notes" name="internalNotes"><Input.TextArea rows={4} placeholder="Enter notes for internal recruiters" /></Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card title="Candidate Tags" bordered={false} style={{ marginTop: 24 }}>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Form.Item label="Candidate Tags" name="candidateTags">
                        <Select mode="multiple" placeholder="Select candidate tags">
                          {CANDIDATE_TAGS.map(tag => (
                            <Select.Option key={tag} value={tag}>{tag}</Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card bordered={false} style={{ marginTop: 24 }}>
                  <Form.Item
                    name="candidateConfirmation"
                    valuePropName="checked"
                    rules={[
                      {
                        validator: (_, value) =>
                          value ? Promise.resolve() : Promise.reject(new Error("You must confirm the provided information is accurate."))
                      },
                    ]}
                    style={{ marginBottom: 0 }}
                  >
                    <Checkbox>
                      Candidate confirms the provided information is accurate and can be shared with potential employers.
                    </Checkbox>
                  </Form.Item>
                </Card>

                <Row justify="space-between" style={{ marginTop: 24, marginBottom: 24 }}>
                  <Col></Col>
                  <Col>
                    <Button size="large" type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={isSubmitting}>
                      Update Candidate
                    </Button>
                  </Col>
                </Row>
              </Form>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}