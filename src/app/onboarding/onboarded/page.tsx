"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  Modal,
  Divider,
  Tag,
  Space,
  Input,
  Popconfirm,
  Form,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  message,
  Spin,
  Drawer,
  Checkbox,
  Card,
  Image,
  Typography,
  Upload,
  Switch,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  LaptopOutlined,
  HistoryOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
  HomeOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ApartmentOutlined,
  ProjectOutlined,
  TrophyOutlined,
  IdcardOutlined,
  EyeOutlined,
  CloseCircleTwoTone,
  CheckCircleTwoTone,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
import { MembersService } from "@/services/membersService";
import { EmployeeOnboardingService } from "@/services/onboardingService";
import EmployeeHistoryEditForm from "./Employeehistoryeditform";
import EmployeeHistoryView from "./EmployeeHistoryViews";
import router from "next/dist/shared/lib/router/router";
import { useRouter } from "next/dist/client/components/navigation";

const { Option } = Select;

/* ---------------- HELPERS ---------------- */
const labelize = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

// Enhanced RowItem component for better view display
const RowItem = ({ label, value, icon }: any) => (
  <div
    style={{
      display: "flex",
      alignItems: "flex-start",
      marginBottom: "12px",
      padding: "8px 0",
      borderBottom: "1px solid #f0f0f0",
    }}
  >
    {icon && (
      <div style={{ marginRight: "8px", color: "#1890ff", marginTop: "2px" }}>
        {icon}
      </div>
    )}
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: "11px", color: "#8c8c8c", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "14px", color: "#262626", fontWeight: 500 }}>
        {value !== null && value !== undefined && value !== "" ? (
          typeof value === "object" ? (
            JSON.stringify(value)
          ) : (
            value
          )
        ) : (
          <span style={{ color: "#1677ff" }}>--</span>
        )}
      </div>
    </div>
  </div>
);

// Shared label and input styles for compact forms
const labelStyle = { fontSize: "11px", fontWeight: 500 };
const inputStyle = { height: 25, fontSize: 12 };

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
/* ---------------- EDIT FORM COMPONENTS ---------------- */

// Personal Details Edit Form
const PersonalDetailsEditForm = ({ form, initialData }: any) => {
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  useEffect(() => {
    if (initialData) {
      // Clear form first to prevent stale data
      form.resetFields();

      // Extract address data with better null handling
      const addressData = initialData.address || {};
      const currentAddr = addressData.current || addressData;
      const permanentAddr = addressData.permanent || addressData;

      // Set form values with proper defaults
      form.setFieldsValue({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        gender: initialData.gender || "",
        dob: initialData.dob ? dayjs(initialData.dob) : null,
        bloodGroup: initialData.bloodGroup || "",
        mobile: initialData.mobile || initialData.phone || "",
        personalEmail: initialData.personalEmail || initialData.email || "",
        workEmail: initialData.workEmail || "",
        pan: initialData.pan || "",
        aadhaar: initialData.aadhaar || "",
        // Current Address
        c_flat: currentAddr.c_flat || "",
        c_area: currentAddr.c_area || "",
        c_city: currentAddr.c_city || "",
        c_state: currentAddr.c_state || "",
        c_pincode: currentAddr.c_pincode || "",
        c_country: currentAddr.c_country || "",
        // Permanent Address
        p_flat: permanentAddr.p_flat || "",
        p_area: permanentAddr.p_area || "",
        p_city: permanentAddr.p_city || "",
        p_state: permanentAddr.p_state || "",
        p_pincode: permanentAddr.p_pincode || "",
        p_country: permanentAddr.p_country || "",
      });
    }
  }, [initialData, form]);

  const onSameAddressChange = (e: any) => {
    setSameAsCurrent(e.target.checked);
    if (e.target.checked) {
      const currentValues = form.getFieldsValue([
        "c_flat",
        "c_area",
        "c_city",
        "c_state",
        "c_pincode",
        "c_country",
      ]);
      form.setFieldsValue({
        p_flat: currentValues.c_flat,
        p_area: currentValues.c_area,
        p_city: currentValues.c_city,
        p_state: currentValues.c_state,
        p_pincode: currentValues.c_pincode,
        p_country: currentValues.c_country,
      });
    }
  };

  return (
    <div style={{ display: "flex", gap: "16px", flexDirection: "column" }}>
      {/* Basic Information */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          border: "1px solid rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <UserOutlined style={{ color: "#1677ff", marginRight: 8 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1677ff" }}>
            Basic Information
          </span>
        </div>

        <Row gutter={[12, 8]}>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>First Name</span>}
              name="firstName"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="First Name" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Last Name</span>}
              name="lastName"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Last Name" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Gender</span>}
              name="gender"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select" style={inputStyle}>
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Date of Birth</span>}
              name="dob"
              rules={[{ required: true, message: "Required" }]}
            >
              <DatePicker style={{ width: "100%", ...inputStyle }} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Blood Group</span>}
              name="bloodGroup"
              rules={[{ required: true, message: "Required" }]}
            >
              <Select placeholder="Select" style={inputStyle}>
                <Option value="A+">A+</Option>
                <Option value="A-">A-</Option>
                <Option value="B+">B+</Option>
                <Option value="B-">B-</Option>
                <Option value="O+">O+</Option>
                <Option value="O-">O-</Option>
                <Option value="AB+">AB+</Option>
                <Option value="AB-">AB-</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Mobile Number</span>}
              name="mobile"
              rules={[
                { required: true, message: "Required" },
                { pattern: /^[0-9]{10}$/, message: "Invalid mobile" },
              ]}
            >
              <Input placeholder="Mobile" maxLength={10} style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Personal Email</span>}
              name="personalEmail"
              rules={[
                { required: true, message: "Required" },
                { type: "email", message: "Invalid email" },
              ]}
            >
              <Input placeholder="Personal Email" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Work Email</span>}
              name="workEmail"
              rules={[
                { required: true, message: "Required" },
                { type: "email", message: "Invalid email" },
              ]}
            >
              <Input placeholder="Work Email" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>PAN Number</span>}
              name="pan"
            >
              <Input placeholder="PAN Number" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col style={{ flex: "0 0 20%", maxWidth: "20%" }}>
            <Form.Item
              label={<span style={labelStyle}>Aadhaar Number</span>}
              name="aadhaar"
            >
              <Input placeholder="Aadhaar Number" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Address Information */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          border: "1px solid rgba(0, 0, 0, 0.04)",
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <HomeOutlined style={{ color: "#1677ff", marginRight: 8 }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1677ff" }}>
            Address Information
          </span>
        </div>

        {/* Current Address */}
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
          Current Address
        </div>
        <Row gutter={[12, 8]}>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>Flat / Door No</span>}
              name="c_flat"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Flat No" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>Area</span>}
              name="c_area"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Area" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>City</span>}
              name="c_city"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="City" style={inputStyle} />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>State</span>}
              name="c_state"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="State" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>Pincode</span>}
              name="c_pincode"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Pincode" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label={<span style={labelStyle}>Country</span>}
              name="c_country"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Country" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>

        <Checkbox
          checked={sameAsCurrent}
          onChange={onSameAddressChange}
          style={{ fontSize: 11, marginBottom: 12, marginTop: 8 }}
        >
          Same as current address
        </Checkbox>

        {/* Permanent Address */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 12,
            marginTop: 16,
          }}
        >
          Permanent Address
        </div>
        <Row gutter={[12, 8]}>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>Flat / Door No</span>}
              name="p_flat"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Flat No" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>Area</span>}
              name="p_area"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Area" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>City</span>}
              name="p_city"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="City" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>State</span>}
              name="p_state"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="State" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>Pincode</span>}
              name="p_pincode"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Pincode" style={inputStyle} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label={<span style={labelStyle}>Country</span>}
              name="p_country"
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="Country" style={inputStyle} />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </div>
  );
};

// Employment Edit Form
const EmploymentEditForm = ({ form, initialData }: any) => {
  const workType = Form.useWatch("workType", form);
  const hybridMode = Form.useWatch("hybridMode", form);
  const fixedDays = Form.useWatch("fixedDays", form) || [];
  const generalDays = Form.useWatch("totalDays", form);
  const generalHours = Form.useWatch("totalHours", form);

  const [isHybridModalOpen, setIsHybridModalOpen] = useState(false);
  const [tempSelectedDays, setTempSelectedDays] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const { Title, Text } = Typography;

  useEffect(() => {
    if (initialData) {
      // Clear form first
      form.resetFields();

      // Normalize workType to match Select options
      let wType = initialData.workType;
      if (wType === "Work From Home") wType = "wfh";
      if (wType === "Work From Office") wType = "wfo";
      if (wType === "Hybrid") wType = "hybrid";

      form.setFieldsValue({
        department: initialData.department || "",
        team: initialData.team || "",
        employeeType: initialData.employeeType || "",
        workLocation: initialData.workLocation || "",
        workShift: initialData.workShift || "",
        joiningDate: initialData.joiningDate
          ? dayjs(initialData.joiningDate)
          : null,
        trainingCompletion: initialData.trainingCompletion
          ? dayjs(initialData.trainingCompletion)
          : null,
        projects: initialData.projects || [],
        reportingManager: initialData.reportingManager || "",
        promotionStatus: initialData.promotionStatus || "",
        employeeGrade: initialData.employeeGrade || "",
        workType: wType || undefined,
        employeeJoiningDate: initialData.employeeJoiningDate
          ? dayjs(initialData.employeeJoiningDate)
          : null, // Hybrid fields
        hybridMode: initialData.hybridMode || "General",
        fixedDays: initialData.fixedDays || [],
        totalDays: initialData.totalDays || null,
        totalHours: initialData.totalHours || null,
      });
      setTempSelectedDays(initialData.fixedDays || []);
    }
  }, [initialData, form]);

  useEffect(() => {
    const fetchMembersForSelect = async () => {
      try {
        const data = await MembersService.getMembersForSelect();
        setMembers(data);
        setTotalMembers(data?.length || 0);
      } catch (error) {
        message.error("Failed to load members");
      }
    };

    fetchMembersForSelect();
  }, []);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <TeamOutlined style={{ color: "#52c41a", marginRight: 8 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#52c41a" }}>
          Employment Details
        </span>
      </div>

      <Row gutter={[12, 8]}>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Department</span>}
            name="department"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Department" style={inputStyle}>
              <Option value="engineering">Engineering</Option>
              <Option value="hr">HR</Option>
              <Option value="finance">Finance</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Team</span>}
            name="team"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Team" style={inputStyle}>
              <Option value="frontend">Frontend</Option>
              <Option value="backend">Backend</Option>
              <Option value="design">Design</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Employee Type</span>}
            name="employeeType"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Type" style={inputStyle}>
              <Option value="fulltime">Full Time</Option>
              <Option value="parttime">Part Time</Option>
              <Option value="intern">Intern</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Work Location</span>}
            name="workLocation"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Enter Location" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Work Shift</span>}
            name="workShift"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Shift" style={inputStyle}>
              <Option value="day">Day Shift</Option>
              <Option value="night">Night Shift</Option>
              <Option value="rotational">Rotational</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Work Type</span>}
            name="workType"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select
              placeholder="Select Work Type"
              style={inputStyle}
              onChange={(value) => {
                if (value !== "hybrid") {
                  form.setFieldsValue({
                    hybridMode: null,
                    fixedDays: [],
                    totalDays: null,
                    totalHours: null,
                  });
                } else {
                  form.setFieldsValue({ hybridMode: "General" });
                }
              }}
            >
              <Option value="wfh">Work From Home</Option>
              <Option value="wfo">Work From Office</Option>
              <Option value="hybrid">Hybrid</Option>
            </Select>
          </Form.Item>
        </Col>

        {workType === "hybrid" && (
          <Col span={24}>
            <Form.Item name="fixedDays" hidden>
              <Select mode="multiple" />
            </Form.Item>
            <Divider style={{ margin: "0 0 8px" }} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 500 }}>Hybrid Mode:</div>
              <Form.Item name="hybridMode" noStyle>
                <Switch
                  checkedChildren="Fixed"
                  unCheckedChildren="General"
                  checked={hybridMode === "Fixed"}
                  onChange={(checked) => {
                    const mode = checked ? "Fixed" : "General";
                    form.setFieldsValue({ hybridMode: mode });
                    if (mode === "Fixed") {
                      setTempSelectedDays(
                        form.getFieldValue("fixedDays") || [],
                      );
                      setIsHybridModalOpen(true);
                      form.setFieldsValue({
                        totalDays: null,
                        totalHours: null,
                      });
                    } else {
                      form.setFieldsValue({
                        fixedDays: [],
                        totalDays: null,
                        totalHours: null,
                      });
                    }
                  }}
                />
              </Form.Item>

              {hybridMode === "Fixed" && fixedDays.length > 0 && (
                <div style={{ fontSize: 11, display: "flex", gap: 16 }}>
                  <span>Days: {fixedDays.join(", ").toUpperCase()}</span>
                  <span>
                    Total: {fixedDays.length} days / {fixedDays.length * 8} hrs
                  </span>
                </div>
              )}

              {hybridMode === "General" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Form.Item name="totalDays" noStyle>
                    <Input
                      type="number"
                      placeholder="Days"
                      onChange={(e) => {
                        const days = Number(e.target.value);
                        form.setFieldsValue({
                          totalDays: days,
                          totalHours: days * 8,
                        });
                      }}
                      style={{ fontSize: 11, height: 28, width: 80 }}
                    />
                  </Form.Item>
                  <Form.Item name="totalHours" noStyle>
                    <Input
                      type="number"
                      placeholder="Hrs"
                      addonAfter="hrs"
                      onChange={(e) => {
                        form.setFieldsValue({
                          totalHours: Number(e.target.value),
                        });
                      }}
                      style={{ fontSize: 11, height: 28, width: 100 }}
                    />
                  </Form.Item>
                </div>
              )}
            </div>
            <Divider style={{ margin: "8px 0 0" }} />
          </Col>
        )}

        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Work Joining Date</span>}
            name="employeeJoiningDate"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%", ...inputStyle }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Joining Date</span>}
            name="joiningDate"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%", ...inputStyle }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Training Completion</span>}
            name="trainingCompletion"
            rules={[{ required: true, message: "Required" }]}
          >
            <DatePicker style={{ width: "100%", ...inputStyle }} />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Projects</span>}
            name="projects"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Select Projects"
              style={inputStyle}
              maxTagCount="responsive"
            >
              <Option value="hrms">HRMS</Option>
              <Option value="crm">CRM</Option>
              <Option value="mobile-app">Mobile App</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Reporting Manager</span>}
            name="reportingManager"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select
              showSearch
              placeholder="Select Manager"
              style={inputStyle}
              optionFilterProp="children"
            >
              {members?.map((member) => (
                <Select.Option key={member.id} value={member.label}>
                  {member.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Promotion Status</span>}
            name="promotionStatus"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Status" style={inputStyle}>
              <Option value="eligible">Eligible</Option>
              <Option value="not-eligible">Not Eligible</Option>
              <Option value="promoted">Promoted</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item
            label={<span style={labelStyle}>Employee Grade</span>}
            name="employeeGrade"
            rules={[{ required: true, message: "Required" }]}
          >
            <Select placeholder="Select Grade" style={inputStyle}>
              <Option value="A">Grade A</Option>
              <Option value="B">Grade B</Option>
              <Option value="C">Grade C</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined style={{ color: "#1677ff" }} />
            <span>Configure Hybrid Working Days</span>
          </div>
        }
        open={isHybridModalOpen}
        onCancel={() => setIsHybridModalOpen(false)}
        onOk={() => {
          form.setFieldsValue({ fixedDays: tempSelectedDays });
          setIsHybridModalOpen(false);
        }}
        okText="Save"
        centered
      >
        <Card
          bordered={false}
          style={{
            background: "#fafafa",
            borderRadius: 10,
          }}
        >
          <Title level={5} style={{ marginBottom: 15 }}>
            Select Working Days
          </Title>

          <Checkbox.Group
            style={{ width: "100%" }}
            value={tempSelectedDays}
            onChange={(checkedValues: any) => {
              setTempSelectedDays(checkedValues);
            }}
          >
            <Row gutter={[12, 12]}>
              {[
                { label: "Mon", value: "Mon" },
                { label: "Tue", value: "Tue" },
                { label: "Wed", value: "Wed" },
                { label: "Thu", value: "Thu" },
                { label: "Fri", value: "Fri" },
                { label: "Sat", value: "Sat" },
                { label: "Sun", value: "Sun" },
              ].map((day) => (
                <Col span={8} key={day.value}>
                  <Checkbox value={day.value}>{day.label}</Checkbox>
                </Col>
              ))}
            </Row>
          </Checkbox.Group>

          <Divider />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
            }}
          >
            <Text strong>Total Days: {tempSelectedDays.length}</Text>
            <Text strong>Total Hours: {tempSelectedDays.length * 8} hrs</Text>
          </div>
        </Card>
      </Modal>
    </div>
  );
};

// Bank & Payroll Edit Form
const BankPayrollEditForm = ({ form, initialData }: any) => {
  useEffect(() => {
    if (initialData) {
      // Clear form first
      form.resetFields();

      form.setFieldsValue({
        bankName: initialData.bankName || "",
        accountNumber: initialData.accountNumber || "",
        ifscCode: initialData.ifscCode || "",
        salary: initialData.salary || "",
        pfNumber: initialData.pfNumber || "",
        esiNumber: initialData.esiNumber || "",
        uanNumber: initialData.uanNumber || "",
        branchName: initialData.branchName || initialData.bankBranch || "",
        accountHolderName: initialData.accountHolderName || "",
      });
    }
  }, [initialData, form]);

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <BankOutlined style={{ color: "#722ed1", marginRight: 8 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#722ed1" }}>
          Bank & Payroll Information
        </span>
      </div>
      <Row gutter={[12, 8]}>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>Bank Name</span>}
            name="bankName"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Bank Name" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>Account Holder Name</span>}
            name="accountHolderName"
          >
            <Input placeholder="Account Holder Name" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>Account Number</span>}
            name="accountNumber"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="Account Number" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>IFSC Code</span>}
            name="ifscCode"
            rules={[{ required: true, message: "Required" }]}
          >
            <Input placeholder="IFSC Code" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>Bank Branch</span>}
            name="branchName"
          >
            <Input placeholder="Branch Name" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>PF Number</span>}
            name="pfNumber"
          >
            <Input placeholder="PF Number" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>UAN Number</span>}
            name="uanNumber"
          >
            <Input placeholder="UAN Number" style={inputStyle} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={<span style={labelStyle}>ESI Number</span>}
            name="esiNumber"
          >
            <Input placeholder="ESI Number" style={inputStyle} />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

// Assets Edit Form
const AssetsEditForm = ({ form, initialData }: any) => {
  useEffect(() => {
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      // Clear form first
      form.resetFields();

      form.setFieldsValue({
        assets: initialData.map((item: any) => ({
          item: item.item || "",
          brand: item.brand || "",
          model: item.model || "",
          modelNumber: item.modelNumber || "",
          image: item.image
            ? Array.isArray(item.image)
              ? item.image
              : [
                  {
                    uid: "-1",
                    name: "image.png",
                    status: "done",
                    url: item.image,
                  },
                ]
            : [],
        })),
      });
    } else {
      form.setFieldsValue({ assets: [{}] });
    }
  }, [initialData, form]);

  const handleBeforeUpload = (file: any) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
    }
    return isImage && isLt5M ? false : Upload.LIST_IGNORE;
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
        border: "1px solid rgba(0, 0, 0, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
        <LaptopOutlined style={{ color: "#f5222d", marginRight: 8 }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "#f5222d" }}>
          Assigned Assets
        </span>
      </div>
      <Form.List name="assets" initialValue={[{}]}>
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name, ...restField }, index) => (
              <div
                key={key}
                style={{
                  marginBottom: 16,
                  padding: "12px",
                  background: "#fafafa",
                  borderRadius: "8px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 12,
                    color: "#f5222d",
                  }}
                >
                  Asset {index + 1}
                </div>
                {fields.length > 1 && (
                  <Button
                    type="link"
                    danger
                    onClick={() => remove(name)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      padding: 0,
                    }}
                  >
                    Remove
                  </Button>
                )}
                <Row gutter={[12, 8]}>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Item Name</span>}
                      name={[name, "item"]}
                      rules={[
                        { required: true, message: "Please select an item" },
                      ]}
                    >
                      <Select placeholder="Select item" style={inputStyle}>
                        <Option value="Mobile">Mobile</Option>
                        <Option value="Laptop">Laptop</Option>
                        <Option value="Tab">Tab</Option>
                        <Option value="Monitor">Monitor</Option>
                        <Option value="Keyboard">Keyboard</Option>
                        <Option value="Mouse">Mouse</Option>
                        <Option value="Bag">Bag</Option>
                        <Option value="Headphone">Head phone</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Brand Name</span>}
                      name={[name, "brand"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Brand Name" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Model Name</span>}
                      name={[name, "model"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Model Name" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Model Number</span>}
                      name={[name, "modelNumber"]}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input placeholder="Model Number" style={inputStyle} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      {...restField}
                      label={<span style={labelStyle}>Upload Image</span>}
                      name={[name, "image"]}
                      valuePropName="fileList"
                      getValueFromEvent={(e) => {
                        if (Array.isArray(e)) {
                          return e;
                        }
                        return e?.fileList || [];
                      }}
                    >
                      <Upload
                        listType="picture-card"
                        beforeUpload={handleBeforeUpload}
                        maxCount={1}
                      >
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      </Upload>
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ))}
            <Button
              type="dashed"
              onClick={() => add()}
              block
              style={{ marginTop: 8 }}
            >
              + Add Asset
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

/* ---------------- VIEW COMPONENTS ---------------- */

const PersonalDetailsView = ({ data }: any) => {
  if (!data) return <div>No data available</div>;

  const formatAddress = (addr: any, type: "current" | "permanent") => {
    if (!addr) return null;

    const prefix = type === "current" ? "c_" : "p_";
    const parts = [
      addr[`${prefix}flat`],
      addr[`${prefix}area`],
      addr[`${prefix}city`],
      addr[`${prefix}state`],
      addr[`${prefix}pincode`],
      addr[`${prefix}country`],
    ];

    const filtered = parts.filter((p) => p && p.toString().trim() !== "");
    return filtered.length > 0 ? filtered.join(", ") : null;
  };

  const currentAddress = formatAddress(
    data.address?.current || data.address,
    "current",
  );
  const permanentAddress = formatAddress(
    data.address?.permanent || data.address,
    "permanent",
  );

  return (
    <div>
      <Card
        title={
          <span>
            <UserOutlined style={{ marginRight: 8 }} />
            Basic Information
          </span>
        }
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <RowItem
              label="First Name"
              value={data.firstName}
              icon={<UserOutlined />}
            />
          </Col>
          <Col span={12}>
            <RowItem label="Last Name" value={data.lastName} />
          </Col>
          <Col span={12}>
            <RowItem label="Gender" value={data.gender} />
          </Col>
          <Col span={12}>
            <RowItem
              label="Date of Birth"
              value={data.dob ? dayjs(data.dob).format("DD MMM YYYY") : null}
              icon={<CalendarOutlined />}
            />
          </Col>
          <Col span={12}>
            <RowItem label="Blood Group" value={data.bloodGroup} />
          </Col>
          <Col span={12}>
            <RowItem
              label="Mobile Number"
              value={data.mobile || data.phone}
              icon={<PhoneOutlined />}
            />
          </Col>
          <Col span={12}>
            <RowItem
              label="Personal Email"
              value={data.personalEmail || data.email}
              icon={<MailOutlined />}
            />
          </Col>
          <Col span={12}>
            <RowItem
              label="Work Email"
              value={data.workEmail}
              icon={<MailOutlined />}
            />
          </Col>
          <Col span={12}>
            <RowItem
              label="PAN Number"
              value={data.pan}
              icon={<IdcardOutlined />}
            />
          </Col>
          <Col span={12}>
            <RowItem
              label="Aadhaar Number"
              value={data.aadhaar}
              icon={<IdcardOutlined />}
            />
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <span>
            <HomeOutlined style={{ marginRight: 8 }} />
            Address Information
          </span>
        }
        size="small"
      >
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#1890ff",
              marginBottom: 8,
            }}
          >
            Current Address
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#262626",
              padding: "12px",
              background: "#f5f5f5",
              borderRadius: "6px",
              lineHeight: "1.6",
            }}
          >
            {currentAddress || (
              <span style={{ color: "red" }}>Not Verified</span>
            )}
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#1890ff",
              marginBottom: 8,
            }}
          >
            Permanent Address
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#262626",
              padding: "12px",
              background: "#f5f5f5",
              borderRadius: "6px",
              lineHeight: "1.6",
            }}
          >
            {permanentAddress || (
              <span style={{ color: "red" }}>Not Verified</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

const EmploymentView = ({ data }: any) => {
  if (!data) return <div>No data available</div>;

  return (
    <Card
      title={
        <span>
          <TeamOutlined style={{ marginRight: 8 }} />
          Employment Details
        </span>
      }
      size="small"
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <RowItem
            label="Department"
            value={data.department}
            icon={<BankOutlined />}
          />
        </Col>

        <Col span={12}>
          <RowItem label="Team" value={data.team} />
        </Col>

        <Col span={12}>
          <RowItem label="Employee Type" value={data.employeeType} />
        </Col>

        <Col span={12}>
          <RowItem label="Work Location" value={data.workLocation} />
        </Col>

        <Col span={12}>
          <RowItem label="Work Shift" value={data.workShift} />
        </Col>

        <Col span={12}>
          <RowItem
            label="Work Joining Date"
            value={
              data.employeeJoiningDate
                ? dayjs(data.employeeJoiningDate).format("DD MMM YYYY")
                : null
            }
            icon={<CalendarOutlined />}
          />
        </Col>

        {/* ✅ Work Type */}
        <Col span={12}>
          <RowItem
            label="Work Type"
            value={
              data.workType === "wfh"
                ? "Work From Home"
                : data.workType === "wfo"
                  ? "Work From Office"
                  : data.workType === "hybrid" || data.workType === "Hybrid"
                    ? "Hybrid"
                    : data.workType
            }
          />
        </Col>

        {/* ✅ Hybrid Type (Only if Hybrid selected) */}
        {(data.workType === "hybrid" || data.workType === "Hybrid") && (
          <>
            <Col span={12}>
              <RowItem
                label="Hybrid Type"
                value={
                  data.hybridMode === "general" || data.hybridMode === "General"
                    ? "General"
                    : data.hybridMode === "fixed" || data.hybridMode === "Fixed"
                      ? "Fixed"
                      : null
                }
              />
            </Col>

            {/* ✅ If Hybrid Type = General */}
            {(data.hybridMode === "general" ||
              data.hybridMode === "General") && (
              <>
                <Col span={12}>
                  <RowItem label="Total Days" value={data.totalDays} />
                </Col>

                <Col span={12}>
                  <RowItem label="Total Hours" value={data.totalHours} />
                </Col>
              </>
            )}

            {/* ✅ If Hybrid Type = Fixed */}
            {(data.hybridMode === "Fixed" || data.hybridMode === "fixed") && (
              <Col span={12}>
                <RowItem
                  label="Fixed Days"
                  value={
                    data.fixedDays && data.fixedDays.length > 0
                      ? data.fixedDays.join(", ")
                      : null
                  }
                />
              </Col>
            )}
          </>
        )}

        <Col span={12}>
          <RowItem
            label="Joining Date"
            value={
              data.joiningDate
                ? dayjs(data.joiningDate).format("DD MMM YYYY")
                : null
            }
            icon={<CalendarOutlined />}
          />
        </Col>

        <Col span={12}>
          <RowItem
            label="Training Completion"
            value={
              data.trainingCompletion
                ? dayjs(data.trainingCompletion).format("DD MMM YYYY")
                : null
            }
            icon={<CalendarOutlined />}
          />
        </Col>

        <Col span={12}>
          <RowItem
            label="Projects"
            value={
              data.projects && data.projects.length > 0
                ? data.projects.join(", ")
                : null
            }
            icon={<ProjectOutlined />}
          />
        </Col>

        <Col span={12}>
          <RowItem label="Reporting Manager" value={data.reportingManager} />
        </Col>

        <Col span={12}>
          <RowItem
            label="Promotion Status"
            value={data.promotionStatus}
            icon={<TrophyOutlined />}
          />
        </Col>

        <Col span={12}>
          <RowItem label="Employee Grade" value={data.employeeGrade} />
        </Col>
      </Row>
    </Card>
  );
};

const BankPayrollView = ({ data }: any) => {
  if (!data) return <div>No data available</div>;

  return (
    <Card
      title={
        <span>
          <BankOutlined style={{ marginRight: 8 }} />
          Bank & Payroll Information
        </span>
      }
      size="small"
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <RowItem label="Bank Name" value={data.bankName} />
        </Col>
        <Col span={12}>
          <RowItem label="Account Holder Name" value={data.accountHolderName} />
        </Col>
        <Col span={12}>
          <RowItem label="Account Number" value={data.accountNumber} />
        </Col>
        <Col span={12}>
          <RowItem label="IFSC Code" value={data.ifscCode} />
        </Col>
        <Col span={12}>
          <RowItem
            label="Bank Branch"
            value={data.branchName || data.bankBranch}
          />
        </Col>
        <Col span={12}>
          <RowItem label="PF Number" value={data.pfNumber} />
        </Col>
        <Col span={12}>
          <RowItem label="UAN Number" value={data.uanNumber} />
        </Col>
        <Col span={12}>
          <RowItem label="ESI Number" value={data.esiNumber} />
        </Col>
      </Row>
    </Card>
  );
};

const AssetsView = ({ data }: any) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ textAlign: "center", color: "#999", padding: "40px" }}>
        <LaptopOutlined style={{ fontSize: 48, marginBottom: 16 }} />
        <div>No assets assigned</div>
      </div>
    );
  }

  return (
    <div>
      {data.map((item: any, idx: number) => (
        <Card
          key={idx}
          title={`Asset ${idx + 1}: ${item.brand || "Unnamed Asset"}`}
          style={{ marginBottom: 16 }}
          size="small"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <RowItem
                label="Item Name"
                value={item.item}
                icon={<LaptopOutlined />}
              />
            </Col>
            <Col span={12}>
              <RowItem label="Brand Name" value={item.brand} />
            </Col>
            <Col span={12}>
              <RowItem label="Model Name" value={item.model} />
            </Col>
            <Col span={12}>
              <RowItem label="Model Number" value={item.modelNumber} />
            </Col>
            {item.image && (
              <Col span={24}>
                <div style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#8c8c8c",
                      marginBottom: 8,
                    }}
                  >
                    Asset Image
                  </div>
                  <Image
                    src={item.image}
                    alt="Asset"
                    width={150}
                    height={150}
                    style={{
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #f0f0f0",
                    }}
                  />
                </div>
              </Col>
            )}
          </Row>
        </Card>
      ))}
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */
const Onboarded = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<any>(null);
  const [section, setSection] = useState("");
  const [edit, setEdit] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Separate forms for each section
  const [personalDetailsForm] = Form.useForm();
  const [employmentForm] = Form.useForm();
  const [bankPayrollForm] = Form.useForm();
  const [companyHistoryForm] = Form.useForm();
  const [assetsForm] = Form.useForm();

  // Map section to form
  const sectionFormMap: any = {
    personalDetails: personalDetailsForm,
    employment: employmentForm,
    bankAndPayroll: bankPayrollForm,
    previousCompanyDetails: companyHistoryForm,
    assets: assetsForm,
  };
  const router = useRouter();

  // ✅ Fetch All Employees
  const fetchEmployees = async (background = false) => {
    if (!background) setLoading(true);
    try {
      const res = await EmployeeOnboardingService.getAllEmployees();
      setTotalMembers(res?.length || 0);
      let employees = [];

      // Handle different response structures
      if (res?.data?.success) {
        employees = res.data.data || [];
      } else if (res?.success) {
        employees = res.data || [];
      } else if (Array.isArray(res?.data)) {
        employees = res.data;
      } else if (Array.isArray(res)) {
        employees = res;
      }

      const mappedData = employees.map((employee: any) => {
        // Handle both nested and flat data structures
        const personal = employee.personal || employee;

        return {
          id: employee.id || employee._id,
          personalDetails: {
            firstName: personal.firstName || employee.firstName || "",
            lastName: personal.lastName || employee.lastName || "",
            email:
              personal.email ||
              personal.personalEmail ||
              employee.email ||
              employee.personalEmail ||
              "",
            phone:
              personal.phone ||
              personal.mobile ||
              employee.phone ||
              employee.mobile ||
              "",
          },
          _rawData: employee,
        };
      });

      setData(mappedData);
      if (mappedData.length === 0) {
        message.info("No employees found");
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      message.error("Failed to fetch employees");
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ✅ Fetch Full Details for View/Edit - FIXED
  const fetchFullDetails = async (id: string) => {
    try {
      const res = await EmployeeOnboardingService.getEmployeeById(id);
      let employeeData = null;

      // Handle different response structures
      if (res?.data?.success) {
        employeeData = res.data.data;
      } else if (res?.success) {
        employeeData = res.data;
      } else if (res?.data) {
        employeeData = res.data;
      } else {
        employeeData = res;
      }

      if (!employeeData) {
        message.error("Employee data not found");
        return null;
      }

      // Comprehensive data extraction with fallbacks
      const personal = employeeData.personal || employeeData;
      const employment = employeeData.employment || employeeData;
      const bank =
        employeeData.bank || employeeData.bankAndPayroll || employeeData;

      return {
        id: id,
        personalDetails: {
          firstName: personal.firstName || "",
          lastName: personal.lastName || "",
          email: personal.email || personal.personalEmail || "",
          personalEmail: personal.personalEmail || personal.email || "",
          phone: personal.phone || personal.mobile || "",
          mobile: personal.mobile || personal.phone || "",
          dob: personal.dateOfBirth || personal.dob || "",
          gender: personal.gender || "",
          bloodGroup: personal.bloodGroup || "",
          workEmail: personal.workEmail || employeeData.workEmail || "",
          address: personal.address || {},
          pan: personal.pan || "",
          aadhaar: personal.aadhaar || "",
        },
        employment: {
          department: employment.department || "",
          team: employment.team || "",
          employeeType:
            employment.employeeType || employment.employmentType || "",
          workLocation: employment.workLocation || "",
          workShift: employment.workShift || "",
          joiningDate: employment.joiningDate || "",
          trainingCompletion: employment.trainingCompletion || "",
          projects: employment.projects || [],
          reportingManager: employment.reportingManager || "",
          promotionStatus: employment.promotionStatus || "",
          employeeGrade: employment.employeeGrade || "",
          workType: employment.workType || null,
          hybridMode: employment.hybridMode || null,
          fixedDays: employment.fixedDays || [],
          totalDays: employment.totalDays || null,
          totalHours: employment.totalHours || null,
          employeeJoiningDate: employment.employeeJoiningDate || null,
        },
        bankAndPayroll: {
          bankName: bank.bankName || "",
          accountNumber: bank.accountNumber || "",
          ifscCode: bank.ifscCode || "",
          salary: bank.salary || "",
          pfNumber: bank.pfNumber || "",
          esiNumber: bank.esiNumber || "",
          uanNumber: bank.uanNumber || "",
          branchName: bank.branchName || bank.bankBranch || "",
          bankBranch: bank.bankBranch || bank.branchName || "",
          accountHolderName: bank.accountHolderName || "",
        },
        previousCompanyDetails:
          employeeData.history || employeeData.previousCompanyDetails || [],
        assets: employeeData.assets || [],
      };
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      message.error("Failed to fetch employee details");
      return null;
    }
  };

  // ✅ Filter employees
  const filtered = data.filter((e: any) => {
    const firstName = e.personalDetails?.firstName || "";
    const lastName = e.personalDetails?.lastName || "";
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const openView = async (emp: any, sec: string) => {
    setSection(sec);
    //setView({ id: emp.id });
    setIsDrawerOpen(true);
    setViewLoading(true);
    const fullDetails = await fetchFullDetails(emp.id);
    if (fullDetails) {
      setView(fullDetails);
    }
    setViewLoading(false);
  };

  const handleStatusChange = (id: string, checked: boolean) => {
    const updatedData: any = data.map((item: any) =>
      item.id === id ? { ...item, status: checked } : item,
    );

    setData(updatedData);
  };

  const handleLoginAccess = (id: string) => {
    const updated: any = data.map((item: any) =>
      item.id === id ? { ...item, loginAccess: !item.loginAccess } : item,
    );

    setData(updated);
  };

  const openEdit = async (emp: any, sec: string) => {
    setEdit(false); // Close any existing edit modal first
    setViewLoading(true);
    const fullDetails = await fetchFullDetails(emp.id);
    if (fullDetails) {
      setView(fullDetails);
      setSection(sec);

      // Small delay to ensure state is updated before opening edit modal
      // setTimeout(() => {
      setEdit(true);
      setViewLoading(false);
      // }, 100);
    } else {
      setViewLoading(false);
    }
  };
  const handleLoginClick = (record: any) => {
    setSelectedUser(record);
    setIsModalOpen(true);
  };

  const saveEdit = async () => {
    setUpdateLoading(true);

    try {
      const currentForm = sectionFormMap[section];
      const values = await currentForm.validateFields();

      const sectionBackendMap: any = {
        personalDetails: "personal",
        employment: "employment",
        bankAndPayroll: "bank",
        previousCompanyDetails: "history",
        assets: "assets",
      };

      const backendKey = sectionBackendMap[section];
      let payload: any = {};

      // -------- SECTION LOGIC --------
      if (section === "employment") {
        const existingData = view?.[section] || {};
        const formValues = Object.fromEntries(
          Object.entries(values).map(([k, v]: any) => [
            k,
            dayjs.isDayjs(v) ? v.format("YYYY-MM-DD") : v,
          ]),
        );
        const newEmploymentData = { ...existingData, ...formValues };
        if (formValues.workType === "hybrid") {
          if (formValues.hybridMode === "Fixed") {
            newEmploymentData.totalDays =
              newEmploymentData.fixedDays?.length || 0;
            newEmploymentData.totalHours = newEmploymentData.totalDays * 8;
          } else {
            // General mode
            newEmploymentData.fixedDays = [];
          }
        } else {
          newEmploymentData.hybridMode = null;
          newEmploymentData.fixedDays = [];
          newEmploymentData.totalDays = null;
          newEmploymentData.totalHours = null;
        }
        payload[backendKey] = newEmploymentData;
      } else if (section === "personalDetails") {
        // Destructure address fields to restructure them
        const {
          c_flat,
          c_area,
          c_city,
          c_state,
          c_pincode,
          c_country,
          p_flat,
          p_area,
          p_city,
          p_state,
          p_pincode,
          p_country,
          ...rest
        } = values;

        payload[backendKey] = {
          ...rest,
          dob: dayjs.isDayjs(values.dob)
            ? values.dob.format("YYYY-MM-DD")
            : values.dob,
          address: {
            current: { c_flat, c_area, c_city, c_state, c_pincode, c_country },
            permanent: {
              p_flat,
              p_area,
              p_city,
              p_state,
              p_pincode,
              p_country,
            },
          },
        };
      } else if (section === "assets") {
        const processedAssets = await Promise.all(
          (values.assets || []).map(async (item: any) => {
            let imageUrl = item.image?.[0]?.url || "";

            if (item.image?.[0]?.originFileObj) {
              imageUrl = await fileToBase64(item.image[0].originFileObj);
            }

            return {
              item: item.item,
              brand: item.brand,
              model: item.model,
              modelNumber: item.modelNumber,
              image: imageUrl,
            };
          }),
        );

        payload[backendKey] = processedAssets;
      } else if (section === "previousCompanyDetails") {
        const previousCompanies = values.previousCompanies || [];
        const processedData = previousCompanies.map((company: any) => ({
          ...company,
          doj: company?.doj ? company.doj.format("YYYY-MM-DD") : null,
          lwd: company?.lwd ? company.lwd.format("YYYY-MM-DD") : null,
          form16: (company.form16 || []).map((item: any) => item.file || item),
          payslips: (company.payslips || []).map(
            (item: any) => item.file || item,
          ),
        }));
        payload[backendKey] = processedData;
      } else {
        payload[backendKey] = Object.fromEntries(
          Object.entries(values).map(([k, v]: any) => [
            k,
            dayjs.isDayjs(v) ? v.format("YYYY-MM-DD") : v,
          ]),
        );
      }

      // -------- API CALL --------
      const res = await EmployeeOnboardingService.updateEmployee(
        view.id,
        payload,
      );

      console.log("after update", res);

      if (!res) {
        throw new Error("Failed to update");
      }

      // -------- SUCCESS --------
      message.success("Employee updated successfully");

      const updatedDetails = await fetchFullDetails(view.id);

      if (updatedDetails) {
        setView(updatedDetails);
      }

      await fetchEmployees(true);

      // ✅ CLOSE MODAL AFTER SUCCESS
      setEdit(false);

      // reset form after close
      currentForm.resetFields();
    } catch (error: any) {
      console.error("Update failed:", error);
      message.error(error?.message || "Failed to update employee");
    } finally {
      setUpdateLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await EmployeeOnboardingService.deleteEmployee(id);

      // Try different response structures
      const success = res?.data?.success || res?.success || res?.status === 200;

      if (success) {
        message.success("Employee deleted successfully");
        setData((prev) => prev.filter((e: any) => e.id !== id));
        await fetchEmployees(true);
        fetchEmployees(true);
      } else {
        // If API doesn't support delete, try update with isDeleted flag
        const updateRes = await EmployeeOnboardingService.updateEmployee(id, {
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        });

        const updateSuccess = updateRes?.data?.success || updateRes?.success;
        if (updateSuccess) {
          message.success("Employee marked as deleted successfully");
          setData((prev) => prev.filter((e: any) => e.id !== id));
          await fetchEmployees(true);
          fetchEmployees(true);
        } else {
          message.error("Failed to delete employee");
        }
      }
    } catch (error: any) {
      console.error("Delete failed:", error);
      message.error(error?.message || "Failed to delete employee");
    }
  };

  // ✅ Table columns
  const columns = [
    {
      title: "Employee Name",
      render: (_: any, r: any) => {
        const firstName = r.personalDetails?.firstName || "";
        const lastName = r.personalDetails?.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        return fullName || <span style={{ color: "red" }}>Not Verified</span>;
      },
    },
    ...[
      ["Personal Details", "personalDetails", "blue"],
      ["Employment", "employment", "green"],
      ["Bank & Payroll", "bankAndPayroll", "purple"],
      ["Employee History", "previousCompanyDetails", "orange"],
      ["Assets", "assets", "red"],
    ].map(([t, k, c]: any) => ({
      title: t,
      render: (_: any, r: any) => (
        <Space>
          <Tag style={{ cursor: "pointer" }} onClick={() => openView(r, k)}>
            <EyeOutlined />
          </Tag>
          <EditOutlined
            style={{ cursor: "pointer" }}
            onClick={() => openEdit(r, k)}
          />
        </Space>
      ),
    })),

    {
      title: "Login Access",
      dataIndex: "loginAccess",
      key: "loginAccess",
      render: (_: any, record: any) =>
        record.loginAccess ? (
          <CheckCircleTwoTone
            twoToneColor="#52c41a"
            style={{ fontSize: 18, cursor: "pointer" }}
            // onClick={() => handleLoginAccess(record.id)}
          />
        ) : (
          <CloseCircleTwoTone
            twoToneColor="#ff4d4f"
            style={{ fontSize: 18, cursor: "pointer" }}
            // onClick={() => handleLoginAccess(record.id)}
          />
        ),
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (_: any, record: any) => (
        <Switch
          size="small"
          checked={record.status}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          style={{
            backgroundColor: record.status ? "#52c41a" : "#ff4d4f",
            minWidth: 36,
          }}
          onChange={(checked) => handleStatusChange(record.id, checked)}
        />
      ),
    },

    {
      title: "Login Status",
      key: "loginStatus",
      render: (_: any, record: any) =>
        record.loginAccess ? (
          <Typography.Text
            style={{ color: "#1677ff", cursor: "pointer" }}
            onClick={() => handleLoginClick(record)}
          >
            Login
          </Typography.Text>
        ) : (
          <span
            style={{
              color: "#1677ff",
              fontWeight: 600,
              cursor: "pointer",
            }}
            onClick={() => handleLoginClick(record)}
          >
            Connect
          </span>
        ),
    },
  ];

  const sectionIconMap: any = {
    personalDetails: <UserOutlined style={{ marginRight: 8 }} />,
    employment: <TeamOutlined style={{ marginRight: 8 }} />,
    bankAndPayroll: <BankOutlined style={{ marginRight: 8 }} />,
    previousCompanyDetails: <HistoryOutlined style={{ marginRight: 8 }} />,
    assets: <LaptopOutlined style={{ marginRight: 8 }} />,
  };

  const sectionSubTitleMap: Record<string, string> = {
    personalDetails: "Personal information provided by the employee",
    employment: "Employment and company related details",
    bankAndPayroll: "Bank and salary related information",
    previousCompanyDetails: "Previous company and experience details",
    assets: "Assets assigned to the employee",
  };

  // Render appropriate edit form based on section
  const renderEditForm = () => {
    const currentForm = sectionFormMap[section];
    const sectionData = view?.[section];

    switch (section) {
      case "personalDetails":
        return (
          <PersonalDetailsEditForm
            form={currentForm}
            initialData={sectionData}
          />
        );
      case "employment":
        return (
          <EmploymentEditForm form={currentForm} initialData={sectionData} />
        );
      case "bankAndPayroll":
        return (
          <BankPayrollEditForm form={currentForm} initialData={sectionData} />
        );
      case "previousCompanyDetails":
        return (
          <EmployeeHistoryEditForm
            form={currentForm}
            initialData={sectionData}
          />
        );
      case "assets":
        return <AssetsEditForm form={currentForm} initialData={sectionData} />;
      default:
        return null;
    }
  };

  // Render appropriate view based on section
  const renderView = () => {
    const sectionData = view?.[section];

    switch (section) {
      case "personalDetails":
        return <PersonalDetailsView data={sectionData} />;
      case "employment":
        return <EmploymentView data={sectionData} />;
      case "bankAndPayroll":
        return <BankPayrollView data={sectionData} />;
      case "previousCompanyDetails":
        return <EmployeeHistoryView data={sectionData} />;
      case "assets":
        return <AssetsView data={sectionData} />;
      default:
        return <div>No data available</div>;
    }
  };

  const handleCancelEdit = () => {
    const currentForm = sectionFormMap[section];
    currentForm?.resetFields(); // reset form
    setEdit(false); // close modal
  };

  return (
    <MainLayout>
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          background: "white",
          gap: "15px",
        }}
      >
        {/* <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            padding: 24,
          }}
        > */}
        {/* 🔹 Header Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 20,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {/* Left Side - Title + Description */}
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <ApartmentOutlined style={{ color: "#1677ff" }} />
              Employee Management
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#8c8c8c",
                fontSize: 13,
              }}
            >
              Managing employee records and activities.
            </p>
            <div
              style={{
                marginTop: 6,
                display: "flex",
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Tag
                // size="small"
                //  icon={<UserOutlined style={{ fontSize: 12 }} />}
                style={{
                  background: "#e6f4ff",
                  color: "#1677ff",
                  border: "1px solid #91caff",
                  borderRadius: 16,
                  fontSize: 12,
                  padding: "0 8px",
                  lineHeight: "20px",
                }}
              >
                Total Members : {totalMembers}
              </Tag>

              <Tag
                //size="small"
                style={{
                  background: "#f6ffed",
                  color: "#52c41a",
                  border: "1px solid #b7eb8f",
                  borderRadius: 20,
                  fontSize: 12,
                  padding: "0 10px",
                }}
              >
                Active : 0
              </Tag>

              {/* Inactive */}
              <Tag
                // size="small"
                style={{
                  background: "#fff1f0",
                  color: "#ff4d4f",
                  border: "1px solid #ffa39e",
                  borderRadius: 20,
                  fontSize: 12,
                  padding: "0 10px",
                }}
              >
                Inactive : 0
              </Tag>
            </div>
          </div>

          {/* Right Side - Search + Count + Button */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            {/* Search */}
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search employees..."
              style={{
                borderRadius: 8,
                width: 240,
                height: 36,
              }}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Add Button */}
            <Button
              type="primary"
              style={{
                height: 36,
                borderRadius: 8,
                padding: "0 18px",
              }}
              onClick={() => router.push("/onboarding/create")}
            >
              + Add Employee
            </Button>
          </div>
        </div>

        {/* 🔹 Table Section */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={filtered}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
        {/* </Card> */}

        {/* VIEW DRAWER */}
        <Drawer
          //open={!!view && !edit}
          open={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false);
            setView(null);
            setSection("");
          }}
          title={
            <span>
              {sectionIconMap[section]}
              {labelize(section)}
            </span>
          }
          width={700}
        >
          {sectionSubTitleMap[section] && (
            <div
              style={{
                marginBottom: 16,
                color: "#666",
                fontSize: 13,
                padding: "8px 12px",
                background: "#f0f5ff",
                borderRadius: "6px",
                borderLeft: "3px solid #1890ff",
              }}
            >
              {sectionSubTitleMap[section]}
            </div>
          )}
          <Spin spinning={viewLoading}>{renderView()}</Spin>
        </Drawer>

        {/* EDIT MODAL */}
        <Modal
          open={edit}
          onCancel={() => {
            setEdit(false);
            sectionFormMap[section]?.resetFields();
            setSection("");
          }}
          onOk={saveEdit}
          title={`Edit ${labelize(section)}`}
          width={section === "previousCompanyDetails" ? 1400 : 900}
          okText="Save Changes"
          confirmLoading={updateLoading}
          cancelText="Cancel"
          destroyOnClose
        >
          <Form layout="vertical" form={sectionFormMap[section]}>
            {renderEditForm()}
          </Form>
        </Modal>

        <Modal
          title="Connect User"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
        >
          <Form layout="vertical">
            <Form.Item
              label="Username"
              name="username"
              rules={[{ required: true, message: "Please enter username" }]}
            >
              <Input placeholder="Enter username" />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Please enter password" }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block>
              Submit
            </Button>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
};

export default Onboarded;
