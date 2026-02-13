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
} from "antd";
import {
  SearchOutlined,
  CheckCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  LaptopOutlined,
  HistoryOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import MainLayout from "@/components/layout/MainLayout";
import { EmployeeOnboardingService } from "@/services/onboardingService";

/* ---------------- HELPERS ---------------- */
const labelize = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

const RowItem = ({ label, value }: any) => (
  <Row gutter={16} style={{ marginBottom: 8 }}>
    <Col span={10} style={{ fontWeight: 500 }}>
      {label}
    </Col>
    <Col span={14}>
      :{" "}
      {typeof value === "object" && value !== null
        ? JSON.stringify(value)
        : value || "-"}
    </Col>
  </Row>
);

/* ---------------- MAIN ---------------- */
const Onboarded = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<any>(null);
  const [section, setSection] = useState("");
  const [edit, setEdit] = useState(false);
  const [form] = Form.useForm();
  const [viewLoading, setViewLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // ✅ Fetch All Employees - FIXED
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await EmployeeOnboardingService.getAllEmployees();

      // ✅ Handle different response structures
      let employees = [];

      if (res?.data?.success) {
        employees = res.data.data || [];
      } else if (res?.success) {
        employees = res.data || [];
      } else if (Array.isArray(res?.data)) {
        employees = res.data;
      } else if (Array.isArray(res)) {
        employees = res;
      }

      console.log("Fetched employees:", employees); // Debug log

      // ✅ Map backend data properly
      const mappedData = employees.map((employee: any) => ({
        id: employee.id || employee._id,
        personalDetails: {
          firstName: employee.firstName || employee.personal?.firstName || "",
          lastName: employee.lastName || employee.personal?.lastName || "",
          email: employee.email || employee.personal?.email || "",
          phone: employee.phone || employee.personal?.phone || "",
        },
        // Store full employee data for later use
        _rawData: employee,
      }));

      console.log("Mapped data:", mappedData); // Debug log
      setData(mappedData);

      if (mappedData.length === 0) {
        message.info("No employees found");
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      message.error(
        "Failed to fetch employees. Please check console for details.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ✅ Fetch Full Details for View/Edit - FIXED
  const fetchFullDetails = async (id: string) => {
    try {
      const res = await EmployeeOnboardingService.getEmployeeById(id);

      // ✅ Handle different response structures
      let employeeData = null;

      if (res?.data?.success) {
        employeeData = res.data.data;
      } else if (res?.success) {
        employeeData = res.data;
      } else if (res?.data) {
        employeeData = res.data;
      } else {
        employeeData = res;
      }

      console.log("Fetched employee details:", employeeData); // Debug log

      if (!employeeData) {
        message.error("Employee data not found");
        return null;
      }

      // ✅ Map to expected structure
      return {
        id: id,
        personalDetails: employeeData.personal || {
          firstName: employeeData.firstName,
          lastName: employeeData.lastName,
          email: employeeData.email,
          phone: employeeData.phone,
          dateOfBirth: employeeData.dateOfBirth,
          gender: employeeData.gender,
          address: employeeData.address,
          city: employeeData.city,
          state: employeeData.state,
          zipCode: employeeData.zipCode,
          country: employeeData.country,
        },
        employment: employeeData.employment || {
          employeeId: employeeData.employeeId,
          department: employeeData.department,
          designation: employeeData.designation,
          joiningDate: employeeData.joiningDate,
          employmentType: employeeData.employmentType,
          reportingManager: employeeData.reportingManager,
        },
        bankAndPayroll: employeeData.bank || {
          bankName: employeeData.bankName,
          accountNumber: employeeData.accountNumber,
          ifscCode: employeeData.ifscCode,
          panNumber: employeeData.panNumber,
          salary: employeeData.salary,
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

  // ✅ Filter employees - FIXED
  const filtered = data.filter((e) => {
    const firstName = e.personalDetails?.firstName || "";
    const lastName = e.personalDetails?.lastName || "";
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  const openView = async (emp: any, sec: string) => {
    setSection(sec);
    setView({ id: emp.id }); // Open drawer immediately with partial data
    setViewLoading(true);

    const fullDetails = await fetchFullDetails(emp.id);
    if (fullDetails) {
      setView(fullDetails);
    }
    setViewLoading(false);
  };

  const openEdit = async (emp: any, sec: string) => {
    const fullDetails = await fetchFullDetails(emp.id);
    if (fullDetails) {
      setView(fullDetails);
      setSection(sec);
      if (sec === "assets") {
        form.setFieldsValue({ assets: fullDetails.assets || [] });
      } else {
        const sectionData = (fullDetails as any)[sec] || {};
        form.setFieldsValue(
          Object.fromEntries(
            Object.entries(sectionData).map(([k, v]: any) => [
              k,
              typeof v === "string" && k.toLowerCase().includes("date") && v
                ? dayjs(v)
                : v,
            ]),
          ),
        );
      }
      setEdit(true);
    }
  };

  const saveEdit = async () => {
    setUpdateLoading(true);
    try {
      const values = await form.validateFields();
      const sectionMap: any = {
        personalDetails: "personal",
        employment: "employment",
        bankAndPayroll: "bank",
        previousCompanyDetails: "history",
        assets: "assets",
      };
      const backendKey = sectionMap[section];

      let payload: any = {};
      if (section === "assets") {
        payload[backendKey] = values.assets;
      } else {
        payload[backendKey] = Object.fromEntries(
          Object.entries(values).map(([k, v]: any) => [
            k,
            dayjs.isDayjs(v) ? v.format("YYYY-MM-DD") : v,
          ]),
        );
      }

      const res = await EmployeeOnboardingService.updateEmployee(
        view.id,
        payload,
      );

      // ✅ Handle response
      const success = res?.data?.success || res?.success;

      if (success) {
        message.success("Employee updated successfully");
        // Refresh view data
        const updatedDetails = await fetchFullDetails(view.id);
        if (updatedDetails) {
          setView(updatedDetails);
          // Update list data locally to reflect changes
          setData((prev) =>
            prev.map((e) =>
              e.id === view.id
                ? { ...e, personalDetails: updatedDetails.personalDetails }
                : e,
            ),
          );
        }
        fetchEmployees();
        setEdit(false);
      } else {
        message.error("Failed to update employee");
      }
    } catch (error) {
      console.error("Update failed:", error);
      message.error("Failed to update employee");
    } finally {
      setUpdateLoading(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await EmployeeOnboardingService.deleteEmployee(id);
      const success = res?.data?.success || res?.success;

      if (success) {
        message.success("Employee deleted successfully");
        setData((prev) => prev.filter((e) => e.id !== id));
        fetchEmployees();
      } else {
        message.error("Failed to delete employee");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      message.error("Failed to delete employee");
    }
  };

  // ✅ Table columns - FIXED
  const columns = [
    {
      title: "Employee Name",
      render: (_: any, r: any) => {
        const firstName = r.personalDetails?.firstName || "";
        const lastName = r.personalDetails?.lastName || "";
        return `${firstName} ${lastName}`.trim() || "N/A";
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
          <Tag
            color={c}
            style={{ cursor: "pointer" }}
            onClick={() => openView(r, k)}
          >
            View
          </Tag>
          <EditOutlined
            style={{ cursor: "pointer" }}
            onClick={() => openEdit(r, k)}
          />
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
    personalDetails: "Personal information provided by the employee",
    employment: "Employment and company related details",
    bankAndPayroll: "Bank and salary related information",
    previousCompanyDetails: "Previous company and experience details",
    assets: "Assets assigned to the employee",
  };

  const formatAddress = (addr: any) => {
    if (!addr || Object.keys(addr).length === 0) return "N/A";
    const parts = [
      addr.c_flat || addr.p_flat,
      addr.c_area || addr.p_area,
      addr.c_city || addr.p_city,
      addr.c_state || addr.p_state,
      addr.c_pincode || addr.p_pincode,
      addr.c_country || addr.p_country,
    ];
    return parts.filter(Boolean).join(", ");
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

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <Spin size="large" />
            </div>
          ) : (
            <>
              {filtered.length === 0 && !loading && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "#999",
                  }}
                >
                  No employees found
                </div>
              )}
              <Table
                rowKey="id"
                columns={columns}
                dataSource={filtered}
                pagination={{ pageSize: 10 }}
              />
            </>
          )}

          {/* VIEW DRAWER */}
          <Drawer
            open={!!view && !edit}
            onClose={() => setView(null)}
            title={
              <Space align="center">
                {sectionIconMap[section]}
                <span style={{ fontWeight: 600 }}>{labelize(section)}</span>
              </Space>
            }
            width={700}
          >
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

            <Spin spinning={viewLoading}>
              <Divider />

              {/* ASSETS SECTION */}
              {section === "assets" ? (
                view?.assets?.length ? (
                  view.assets.map((item: any, idx: number) => (
                    <div key={idx}>
                      <h3 style={{ fontWeight: "700", marginBottom: 12 }}>
                        Item {idx + 1}
                      </h3>
                      <RowItem label="Item Name" value={item.item} />
                      <RowItem label="Brand Name" value={item.brand} />
                      <RowItem label="Model Name" value={item.model} />
                      <RowItem label="Model Number" value={item.modelNumber} />
                      {idx < view.assets.length - 1 && <Divider />}
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#999" }}>No assets assigned</p>
                )
              ) : (
                /* OTHER SECTIONS */
                view &&
                (Array.isArray(view[section]) ? (
                  // Handle Array Data (previousCompanyDetails)
                  view[section].length > 0 ? (
                    view[section].map((item: any, idx: number) => (
                      <div key={idx}>
                        <Divider orientation="left">
                          {labelize(section)} #{idx + 1}
                        </Divider>
                        {Object.entries(item).map(([k, v]: any) =>
                          typeof v !== "object" ? (
                            <RowItem key={k} label={labelize(k)} value={v} />
                          ) : null,
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: "#999" }}>No history available</p>
                  )
                ) : (
                  // Handle Object Data
                  Object.entries(view[section] || {}).map(([k, v]: any) =>
                    typeof v === "object" && !Array.isArray(v) ? (
                      <div key={k}>
                        <Divider orientation="left">
                          <span
                            style={{
                              background:
                                "linear-gradient(90deg, #1677ff 0%, #00d2ff 100%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              fontWeight: "bold",
                              fontSize: "15px",
                            }}
                          >
                            {labelize(k)}
                          </span>
                        </Divider>
                        {Object.entries(v).map(([a, b]: any) =>
                          typeof b === "object" && b !== null ? (
                            <div
                              key={a}
                              style={{
                                marginBottom: 12,
                                padding: 12,
                                background: "#f5f7fa",
                                borderRadius: 8,
                                border: "1px solid #e5e7eb",
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: "#1677ff",
                                  marginBottom: 8,
                                  textTransform: "capitalize",
                                }}
                              >
                                {labelize(a)}
                              </div>
                              {Object.entries(b).map(([subK, subV]: any) => (
                                <RowItem
                                  key={subK}
                                  label={labelize(subK)}
                                  value={subV}
                                />
                              ))}
                            </div>
                          ) : (
                            <RowItem key={a} label={labelize(a)} value={b} />
                          ),
                        )}
                      </div>
                    ) : (
                      <RowItem key={k} label={labelize(k)} value={v} />
                    ),
                  )
                ))
              )}
            </Spin>
          </Drawer>

          {/* EDIT MODAL */}
          <Modal
            open={edit}
            onCancel={() => {
              setEdit(false);
              form.resetFields();
            }}
            onOk={saveEdit}
            title={`Edit ${labelize(section)}`}
            width={700}
            okText="Save"
            confirmLoading={updateLoading}
            cancelText="Cancel"
          >
            {section === "assets" ? (
              <Form form={form} layout="horizontal">
                <Form.List name="assets">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name }) => (
                        <div
                          key={key}
                          style={{
                            border: "1px solid #eee",
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 12,
                            position: "relative",
                          }}
                        >
                          <DeleteOutlined
                            style={{
                              position: "absolute",
                              top: 10,
                              right: 10,
                              color: "red",
                              cursor: "pointer",
                            }}
                            onClick={() => remove(name)}
                          />
                          <Row gutter={12}>
                            <Col span={12}>
                              <Form.Item
                                name={[name, "item"]}
                                label="Item Name"
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                name={[name, "brand"]}
                                label="Brand Name"
                              >
                                <Input />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                name={[name, "model"]}
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
                      <Button type="dashed" onClick={() => add()} block>
                        + Add Asset
                      </Button>
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
                        <DatePicker
                          style={{ width: "100%" }}
                          format="YYYY-MM-DD"
                        />
                      ) : k === "gender" ? (
                        <Select
                          options={[
                            { value: "Male", label: "Male" },
                            { value: "Female", label: "Female" },
                            { value: "Others", label: "Others" },
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
