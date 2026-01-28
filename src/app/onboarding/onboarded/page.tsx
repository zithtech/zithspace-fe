"use client";

import React, { useState } from "react";
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
} from "antd";
import {
  SearchOutlined,
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  LaptopOutlined,
  HistoryOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/MainLayout";

/* ---------------- HELPERS ---------------- */
const labelize = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const RowItem = ({ label, value }: any) => (
  <Row gutter={16} style={{ marginBottom: 8 }}>
    <Col span={10} style={{ fontWeight: 500 }}>
      {label}
    </Col>
    <Col span={14}>: {value || "-"}</Col>
  </Row>
);

/* ---------------- DUMMY DATA ---------------- */
const employeFullData = [
  {
    id: 1,
    personalDetails: {
      firstName: "Arun",
      lastName: "Kumar",
      gender: "Male",
      dob: "1998-05-14",
      bloodGroup: "O+",
      personalMail: "arunkumar@gmail.com",
      workMail: "arun.kumar@company.com",
      aadhaarNumber: "1234-5678-9012",
      panNumber: "ABCDE1234F",
      passportNumber: "N1234567",
      currentAddress: {
        flatNo: "12B",
        area: "Anna Nagar",
        city: "Chennai",
        address: "2nd Street",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600040",
      },
      permanentAddress: {
        flatNo: "45",
        area: "Gandhi Nagar",
        city: "Madurai",
        address: "Main Road",
        state: "Tamil Nadu",
        country: "India",
        pincode: "625020",
      },
      emergencyContact: {
        relationType: "Father",
        relationName: "Ravi Kumar",
        relationMobileNumber: "9876543210",
      },
    },
    employment: {
      department: "Engineering",
      team: "Frontend",
      employeeType: "Full Time",
      workLocation: "Chennai",
      workShift: "General",
      joiningDate: "2024-06-10",
      confirmationDate: "2024-12-10",
      reportingManager: "Suresh Kumar",
      promotionStatus: "Not Promoted",
      employeeGrade: "E2",
    },
    bankAndPayroll: {
      bankName: "HDFC Bank",
      holderName: "Arun Kumar",
      accountNumber: "123456789012",
      ifscCode: "HDFC0001234",
      branchName: "Anna Nagar",
      accountType: "Savings",
      uanNumber: "100200300400",
      pfNumber: "TN/CH/12345",
      esiNumber: "1234567890",
      taxRegime: "New",
      paymentMethod: "Bank Transfer",
    },
    previousCompanyDetails: {
      companyName: "Tech Solutions Pvt Ltd",
      location: "Bangalore",
      domain: "IT Services",
      companyAddress: "Whitefield",
      dateOfJoining: "2021-07-01",
      lastWorkingDate: "2024-05-31",
      designation: "Junior Engineer",
      employeeType: "Full Time",
      contactDetails: {
        contactPersonName: "Manoj",
        contactNumber: "9123456789",
      },
    },
    assets: [
      {
        itemName: "Laptop",
        brandName: "Dell",
        modelName: "Latitude",
        modelNumber: "DL5420",
      },
    ],
  },
  {
    id: 2,
    personalDetails: {
      firstName: "Priya",
      lastName: "Sharma",
      gender: "Female",
      dob: "1999-08-21",
      bloodGroup: "B+",
      personalMail: "priya@gmail.com",
      workMail: "priya@company.com",
    },
    employment: {
      department: "Design",
      team: "UI/UX",
      employeeType: "Contract",
      workLocation: "Bangalore",
      workShift: "General",
      joiningDate: "2024-07-01",
    },
    bankAndPayroll: {
      bankName: "ICICI",
      accountNumber: "987654321",
      ifscCode: "ICIC00001",
      paymentMethod: "Bank Transfer",
    },
    previousCompanyDetails: {
      companyName: "Creative Studio",
      designation: "Designer",
    },
    assets: [
      {
        itemName: "Mobile",
        brandName: "Redmi Note8 pro",
        modelName: "Latitude",
        modelNumber: "DL5420",
      },
    ],
  },
];

/* ---------------- MAIN ---------------- */
const Onboarded = () => {
  const [data, setData] = useState(employeFullData);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<any>(null);
  const [section, setSection] = useState("");
  const [edit, setEdit] = useState(false);
  const [form] = Form.useForm();

  const filtered = data.filter((e) =>
    `${e.personalDetails.firstName} ${e.personalDetails.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const openView = (emp: any, sec: string) => {
    setView(emp);
    setSection(sec);
  };

  const openEdit = (emp: any, sec: string) => {
    setView(emp);
    setSection(sec);
    if (sec === "assets") {
      form.setFieldsValue({ assets: emp.assets });
    } else {
      form.setFieldsValue(
        Object.fromEntries(
          Object.entries(emp[sec] || {}).map(([k, v]: any) => [
            k,
            typeof v === "string" && k.toLowerCase().includes("date")
              ? dayjs(v)
              : v,
          ]),
        ),
      );
    }
    setEdit(true);
  };


const saveEdit = () => {
  form.validateFields().then((values) => {
    setData((prev) =>
      prev.map((e) =>
        e.id === view.id
          ? {
              ...e,
              [section]:
                section === "assets"
                  ? values.assets
                  : Object.fromEntries(
                      Object.entries(values).map(([k, v]: any) => [
                        k,
                        dayjs.isDayjs(v) ? v.format("YYYY-MM-DD") : v,
                      ]),
                    ),
            }
          : e,
      ),
    );

    setEdit(false);
  });
};

  const remove = (id: number) =>
    setData((prev) => prev.filter((e) => e.id !== id));

  const columns = [
    {
      title: "Employee Name",
      render: (_: any, r: any) =>
        `${r.personalDetails.firstName} ${r.personalDetails.lastName}`,
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
          <CheckCircleOutlined style={{ color: "green" }} />
          <Tag color={c} onClick={() => openView(r, k)}>
            View
          </Tag>
          <EditOutlined onClick={() => openEdit(r, k)} />
        </Space>
      ),
    })),
    {
      title: "Actions",
      render: (_: any, r: any) => (
        <Popconfirm title="Delete employee?" onConfirm={() => remove(r.id)}>
          <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
        </Popconfirm>
      ),
    },
  ];

  const sectionIconMap: any = {
    personalDetails: (
      <UserOutlined style={{ color: "#29272b", fontSize: 18 }} />
    ),
    employment: <TeamOutlined style={{ color: "#29272b", fontSize: 18 }} />,
    bankAndPayroll: <BankOutlined style={{ color: "#29272b", fontSize: 18 }} />,
    previousCompanyDetails: (
      <HistoryOutlined style={{ color: "#29272b", fontSize: 18 }} />
    ),
    assets: <LaptopOutlined style={{ color: "#29272b", fontSize: 18 }} />,
  };
  const sectionSubTitleMap: Record<string, string> = {
    personalDetailes: "Personal information provided by the employee",
    employment: "Employment and company related details",
    bankAndPayroll: "Bank and salary related information",
    previousCompanyDetails: "Bank and salary related information",
    assets: "Assets assigned to the employee",
  };

  return (
    <MainLayout>
      <div style={{ width: "100%", height: "100%", background: "white" }}>
        <div
          style={{
            background: "#fff",
            padding: 20,
            gap: 16,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <h1 style={{ fontSize: "20px", fontWeight: "700" }}>
            Employee Management
          </h1>
          <Input
            placeholder="Search by name"
            prefix={<SearchOutlined />}
            style={{ width: 300, marginBottom: 16 }}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Table rowKey="id" columns={columns} dataSource={filtered} />

          {/* VIEW */}
          
          <Modal
            open={!!view}
            footer={null}
            onCancel={() => setView(null)}
            
            title={
              <Space align="center">
                {sectionIconMap[section]}
                <span style={{ fontWeight: 600 }}>{labelize(section)}</span>
              </Space>
            }
          >
            {/* ✅ COMMON SUB TITLE */}
            {sectionSubTitleMap[section] && (
              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                  marginBottom: 8,
                }}
              >
                {sectionSubTitleMap[section]}
              </div>
            )}

            <Divider />

            {/* ✅ ASSETS */}
            {section === "assets" ? (
              view?.assets?.length ? (
                view.assets.map((item: any, idx: number) => (
                  <div key={idx}>
                    <h1 style={{fontWeight:"700"}}>Item {idx + 1}</h1>
                    <RowItem label="Item Name" value={item.itemName} />
                    <RowItem label="Brand Name" value={item.brandName} />
                    <RowItem label="Model Name" value={item.modelName} />
                    <RowItem label="Model Number" value={item.modelNumber} />
                    <Divider></Divider>
                  </div>
                ))
              ) : (
                <p>No assets assigned</p>
              )
            ) : (
              /*  OTHER SECTIONS */
              view &&
              Object.entries(view[section] || {}).map(([k, v]: any) =>
                typeof v === "object" && !Array.isArray(v) ? (
                  <div key={k}>
                    <Divider orientation="left">{labelize(k)}</Divider>
                    {Object.entries(v).map(([a, b]: any) => (
                      <RowItem key={a} label={labelize(a)} value={b} />
                    ))}
                    <Divider></Divider>
                  </div>
                ) : (
                  <RowItem key={k} label={labelize(k)} value={v} />
                ),
              )
            )}
          </Modal>

          {/* EDIT */}
          <Modal
            open={edit}
            onCancel={() => setEdit(false)}
            onOk={saveEdit}
            title={`Edit ${labelize(section)}`}
            width={700}
          >
            {section === "assets" ? (
              <Form form={form} layout="vertical">
                <Form.List name="assets">
                  {(fields) => (
                    <>
                      {fields.map(({ key, name }) => (
                        <div
                          key={key}
                          style={{
                            border: "1px solid #eee",
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 12,
                          }}
                        >
                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item
                                name={[name, "itemName"]}
                                label="Item Name"
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                name={[name, "brandName"]}
                                label="Brand Name"
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                name={[name, "modelName"]}
                                label="Model Name"
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                name={[name, "modelNumber"]}
                                label="Model Number"
                              >
                                <Input />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      ))}
                    </>
                  )}
                </Form.List>
              </Form>
            ) : (
              <Form form={form} layout="vertical">
                {view &&
                  Object.keys(view[section] || {}).map((k) => (
                    <Form.Item key={k} name={k} label={labelize(k)}>
                      {k.toLowerCase().includes("date") ? (
                        <DatePicker style={{ width: "100%" }} />
                      ) : k === "gender" ? (
                        <Select
                          options={[
                            { value: "Male" },
                            { value: "Female" },
                            { value: "Others" },
                          ]}
                        />
                      ) : (
                        <Input />
                      )}
                    </Form.Item>
                  ))}
              </Form>
            )}
          </Modal>
        </div>
      </div>
    </MainLayout>
  );
};

export default Onboarded;
