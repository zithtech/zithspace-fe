"use client";
import { Form, Input, Select, DatePicker } from "antd";
import {
  BankOutlined,
  CalendarOutlined,
  ProjectOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useState,useEffect } from "react";

export default function EmploymentDetails() {
  // Employement data
 const [employmentData, setEmploymentData] = useState({});

   const [workForm] = Form.useForm();
   const [empoyeeTimelineForm] = Form.useForm();
  const { Option } = Select;
  
  // const workDetails = workForm.getFieldsValue();
  // console.log("Work Details Form Data: ", workDetails);

  // const employeeTimeline = empoyeeTimelineForm.getFieldsValue();
  // console.log("Employee Timeline Form Data: ", employeeTimeline);
  
  useEffect(() => {
  console.log("Employment Data:", employmentData);
}, [employmentData]);

  
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
        padding: "10px",
      }}
    >
      {/* first div */}
      <div style={{ width: "35%" }}>
        <Form
          layout="vertical"
          size="small"
          form={workForm}
          requiredMark={false}
          onValuesChange={(_, allValues) => setEmploymentData((pre)=>{
            return {...pre,...allValues};
           })}
          style={{
            width: "100%",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e6f0ff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              color: "#1677ff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <BankOutlined />
            Work Details
          </div>

          {/* Department */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Department</span>}
            name="department"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              placeholder="Select Department"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="engineering">Engineering</Option>
              <Option value="hr">HR</Option>
              <Option value="finance">Finance</Option>
            </Select>
          </Form.Item>

          {/* Team */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Team</span>}
            name="team"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              placeholder="Select Team"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="frontend">Frontend</Option>
              <Option value="backend">Backend</Option>
              <Option value="design">Design</Option>
            </Select>
          </Form.Item>

          {/* Employee Type */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Employee Type</span>}
            name="employeeType"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              placeholder="Select Type"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="fulltime">Full Time</Option>
              <Option value="parttime">Part Time</Option>
              <Option value="intern">Intern</Option>
            </Select>
          </Form.Item>

          {/* Work Location */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Work Location</span>}
            name="workLocation"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Input
              placeholder="Enter Location"
              style={{ height: 25, fontSize: 11 }}
            />
          </Form.Item>

          {/* Work Shift */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Work Shift</span>}
            name="workShift"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Select Shift"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="day">Day Shift</Option>
              <Option value="night">Night Shift</Option>
              <Option value="rotational">Rotational</Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
      {/* second div */}
      <div style={{ width: "35%" }}>
        <Form
          layout="vertical"
          size="small"
           form={empoyeeTimelineForm}
          requiredMark={false}
          onValuesChange={(_, allValues) => setEmploymentData((pre)=>{
            return {...pre,...allValues};
           })}
          style={{
            width: "100%",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e6f0ff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* ===== Employee Timeline ===== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              color: "#1677ff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <CalendarOutlined />
            Employee Timeline
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Form.Item
              label={<span style={{ fontSize: 11 }}>* Joining Date</span>}
              name="joiningDate"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1, marginBottom: 12 }}
            >
              <DatePicker
                placeholder="Select date"
                style={{ width: "100%", height: 25, fontSize: 11 }}
              />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ fontSize: 11 }}>* Training Completion</span>
              }
              name="trainingCompletion"
              rules={[{ required: true, message: "Required" }]}
              style={{ flex: 1, marginBottom: 12 }}
            >
              <DatePicker
                placeholder="Select date"
                style={{ width: "100%", height: 25, fontSize: 11 }}
              />
            </Form.Item>
          </div>

          {/* ===== Project Details ===== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              marginTop: 4,
              color: "#1677ff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <ProjectOutlined />
            Project Details
          </div>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Projects</span>}
            name="projects"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              mode="multiple" // ✅ enable multi select
              allowClear
              placeholder="Select Projects"
              style={{
                width: "100%",
                height: 25,
                fontSize: 11,
              }}
              maxTagCount="responsive" // keeps UI clean
            >
              <Option value="hrms">HRMS</Option>
              <Option value="crm">CRM</Option>
              <Option value="mobile-app">Mobile App</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Reporting Manager</span>}
            name="reportingManager"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Select Manager"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="manager1">Manager 1</Option>
              <Option value="manager2">Manager 2</Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
      {/* third div */}
      <div style={{ width: "30%" }}>
        <Form
          layout="vertical"
          size="small"
          form={workForm}
          requiredMark={false}
          onValuesChange={(_, allValues) => setEmploymentData((pre)=>{
            return {...pre,...allValues};
           })}
          style={{
            width: "100%",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            border: "1px solid #e6f0ff",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          {/* Title */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
              color: "#1677ff",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <TrophyOutlined />
            Additional Details
          </div>

          {/* Promotion Status */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Promotion Status</span>}
            name="promotionStatus"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              placeholder="Select Status"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="eligible">Eligible</Option>
              <Option value="not-eligible">Not Eligible</Option>
              <Option value="promoted">Promoted</Option>
            </Select>
          </Form.Item>

          {/* Employee Grade */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>* Employee Grade</span>}
            name="employeeGrade"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 0 }}
          >
            <Select
              placeholder="Select Grade"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="A">Grade A</Option>
              <Option value="B">Grade B</Option>
              <Option value="C">Grade C</Option>
            </Select>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
