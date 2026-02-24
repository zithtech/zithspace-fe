"use client";
import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Collapse,
  Tag,
  message,
  Modal,
  Row,
  Col,
  Divider,
  Space,
  Popconfirm,
} from "antd";
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
  EyeOutlined,
  EditOutlined,
  HistoryOutlined,
  FileTextOutlined,
  UserOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Panel } = Collapse;
const { Option } = Select;

// Styles
const labelStyle = { fontSize: 11, fontWeight: 500 };
const inputStyle = { height: 28, fontSize: 12 };

const cardStyle = {
  background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: 16,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
};

const sectionHeaderStyle = {
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 12,
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "linear-gradient(90deg, #1677ff 0%, #4096ff 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

// Utility to convert R2 URLs to standard format
const normalizeFileUrl = (url: string) => {
  if (!url) return null;

  // If it's already a data URL (base64), return as is
  if (url.startsWith("data:")) return url;

  // If it's an R2 URL, ensure it's publicly accessible
  if (url.includes("r2.cloudflarestorage.com") || url.includes("r2.dev")) {
    // Extract the key and reconstruct a public URL
    const parts = url.split("/");
    const fileName = parts[parts.length - 1];
    return url; // Return the R2 URL directly for now
  }

  return url;
};

// File upload helper
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const MAX_SIZE = 5 * 1024 * 1024;

/* ================= UPLOAD FIELD COMPONENT ================= */
const UploadField = ({ label, name, form }: any) => {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  useEffect(() => {
    const currentValue = form.getFieldValue(name);
    if (currentValue) {
      if (typeof currentValue === "string") {
        // Handle R2 URL
        setFileUrl(normalizeFileUrl(currentValue));
        setFileName(currentValue.split("/").pop() || "");
      } else if (currentValue.base64) {
        // Handle base64 object
        setFileUrl(currentValue.base64);
        setFileName(currentValue.fileName || "");
      } else if (currentValue.url) {
        // Handle URL object
        setFileUrl(normalizeFileUrl(currentValue.url));
        setFileName(
          currentValue.fileName || currentValue.url.split("/").pop() || "",
        );
      }
    }
  }, [form, name]);

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_SIZE) {
      message.error("File size should be less than 5MB");
      return Upload.LIST_IGNORE;
    }

    try {
      const base64 = await fileToBase64(file);
      const fileData = {
        base64,
        fileName: file.name,
        fileType: file.type,
        isNew: true, // Flag to indicate this is a new upload
      };

      setFileUrl(base64);
      setFileName(file.name);
      form.setFieldValue(name, fileData);
    } catch (error) {
      console.error("Error processing file:", error);
      message.error("Failed to upload file");
    }

    return false;
  };

  const handleRemove = () => {
    setFileUrl(null);
    setFileName("");
    form.setFieldValue(name, null);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        padding: "8px",
        background: "#f8fafc",
        borderRadius: 8,
        border: "1px solid #e2e8f0",
      }}
    >
      {label && (
        <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>
          {label}
        </span>
      )}
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {fileName && (
          <span style={{ fontSize: 10, color: "#10b981", fontWeight: 500 }}>
            ✓{" "}
            {fileName.length > 20
              ? fileName.substring(0, 20) + "..."
              : fileName}
          </span>
        )}
        {!fileUrl ? (
          <Upload
            showUploadList={false}
            beforeUpload={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
          >
            <Button
              size="small"
              icon={<UploadOutlined />}
              style={{
                fontSize: 11,
                height: 24,
                background: "#1677ff",
                color: "white",
                border: "none",
              }}
            >
              Upload
            </Button>
          </Upload>
        ) : (
          <>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(fileUrl, "_blank")}
              style={{ fontSize: 11, height: 24 }}
            />
            <Upload showUploadList={false} beforeUpload={handleFileSelect}>
              <Button
                size="small"
                icon={<EditOutlined />}
                style={{ fontSize: 11, height: 24 }}
              />
            </Upload>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={handleRemove}
              style={{ fontSize: 11, height: 24 }}
            />
          </>
        )}
      </div>
    </div>
  );
};

/* ================= CONTACT DETAILS COMPONENT ================= */
const ContactDetails = ({ contactIndex, companyIndex, form }: any) => {
  const role = Form.useWatch(
    [
      "previousCompanies",
      companyIndex,
      "contacts",
      contactIndex,
      "contactRole",
    ],
    form,
  );

  const roleLabelMap: any = {
    hr: "HR",
    manager: "Manager",
    teamLead: "Team Leader",
    reportingManager: "Reporting Manager",
  };

  const label = roleLabelMap[role] || "Contact Person";

  return (
    <div style={{ padding: "8px 0" }}>
      <Form.Item
        name={[contactIndex, "contactRole"]}
        label={<span style={labelStyle}>Contact Type</span>}
        rules={[{ required: true, message: "Required" }]}
        style={{ marginBottom: 8 }}
      >
        <Select placeholder="Select role" style={inputStyle}>
          <Option value="hr">HR</Option>
          <Option value="manager">Manager</Option>
          <Option value="teamLead">Team Leader</Option>
          <Option value="reportingManager">Reporting Manager</Option>
        </Select>
      </Form.Item>

      <Form.Item
        name={[contactIndex, "contactName"]}
        label={<span style={labelStyle}>{label} Name</span>}
        rules={[{ required: true, message: "Required" }]}
        style={{ marginBottom: 8 }}
      >
        <Input placeholder="Name" style={inputStyle} />
      </Form.Item>

      <Form.Item
        name={[contactIndex, "contactNumber"]}
        label={<span style={labelStyle}>{label} Contact</span>}
        rules={[
          { required: true, message: "Required" },
          { pattern: /^[0-9]{10}$/, message: "Invalid number" },
        ]}
        style={{ marginBottom: 8 }}
      >
        <Input placeholder="Contact Number" maxLength={10} style={inputStyle} />
      </Form.Item>

      <Form.Item
        name={[contactIndex, "contactEmail"]}
        label={<span style={labelStyle}>{label} Email</span>}
        rules={[
          { type: "email", message: "Invalid email" },
          { required: false },
        ]}
        style={{ marginBottom: 8 }}
      >
        <Input placeholder="Email Address" style={inputStyle} />
      </Form.Item>
    </div>
  );
};

/* ================= COMPANY FORM BLOCK ================= */
const CompanyFormBlock = ({ index, form }: any) => {
  const [activeContactKey, setActiveContactKey] = useState<string | string[]>([
    "0",
  ]);

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {/* Company Details */}
      <div style={{ flex: "1 1 23%", minWidth: 250, ...cardStyle }}>
        <div style={sectionHeaderStyle}>
          <EnvironmentOutlined />
          Company Details
        </div>
        <Form.Item
          name={[index, "companyName"]}
          label={<span style={labelStyle}>Company Name</span>}
          rules={[{ required: true, message: "Required" }]}
          style={{ marginBottom: 8 }}
        >
          <Input placeholder="Company Name" style={inputStyle} />
        </Form.Item>
        <Form.Item
          name={[index, "location"]}
          label={<span style={labelStyle}>Location</span>}
          style={{ marginBottom: 8 }}
        >
          <Input placeholder="Location" style={inputStyle} />
        </Form.Item>
        <Form.Item
          name={[index, "industry"]}
          label={<span style={labelStyle}>Industry</span>}
          style={{ marginBottom: 8 }}
        >
          <Input placeholder="Industry" style={inputStyle} />
        </Form.Item>
        <Form.Item
          name={[index, "address"]}
          label={<span style={labelStyle}>Address</span>}
          style={{ marginBottom: 8 }}
        >
          <Input.TextArea
            placeholder="Company Address"
            rows={2}
            style={{ fontSize: 12 }}
          />
        </Form.Item>
      </div>

      {/* Tenure Details */}
      <div style={{ flex: "1 1 23%", minWidth: 250, ...cardStyle }}>
        <div style={sectionHeaderStyle}>
          <HistoryOutlined />
          Tenure Details
        </div>
        <Form.Item
          name={[index, "doj"]}
          label={<span style={labelStyle}>Date of Joining</span>}
          rules={[{ required: true, message: "Required" }]}
          style={{ marginBottom: 8 }}
        >
          <DatePicker style={{ width: "100%", ...inputStyle }} />
        </Form.Item>
        <Form.Item
          name={[index, "lwd"]}
          label={<span style={labelStyle}>Last Working Day</span>}
          rules={[{ required: true, message: "Required" }]}
          style={{ marginBottom: 8 }}
        >
          <DatePicker style={{ width: "100%", ...inputStyle }} />
        </Form.Item>
        <Form.Item
          name={[index, "designation"]}
          label={<span style={labelStyle}>Designation</span>}
          rules={[{ required: true, message: "Required" }]}
          style={{ marginBottom: 8 }}
        >
          <Input placeholder="Designation" style={inputStyle} />
        </Form.Item>
        <Form.Item
          name={[index, "employmentType"]}
          label={<span style={labelStyle}>Employment Type</span>}
          rules={[{ required: true, message: "Required" }]}
          style={{ marginBottom: 8 }}
        >
          <Select placeholder="Select type" style={inputStyle}>
            <Option value="fulltime">Full Time</Option>
            <Option value="contract">Contract</Option>
            <Option value="intern">Intern</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name={[index, "reasonForLeaving"]}
          label={<span style={labelStyle}>Reason for Leaving</span>}
          style={{ marginBottom: 8 }}
        >
          <Input.TextArea
            placeholder="Reason"
            rows={2}
            style={{ fontSize: 12 }}
          />
        </Form.Item>
      </div>

      {/* Documents */}
      <div style={{ flex: "1 1 23%", minWidth: 250, ...cardStyle }}>
        <div style={sectionHeaderStyle}>
          <FileTextOutlined />
          Documents
        </div>

        <UploadField
          name={["previousCompanies", index, "experienceLetter"]}
          label="Experience Letter"
          form={form}
        />
        <UploadField
          name={["previousCompanies", index, "offerLetter"]}
          label="Offer Letter"
          form={form}
        />
        <UploadField
          name={["previousCompanies", index, "serviceLetter"]}
          label="Service Letter"
          form={form}
        />
        <UploadField
          name={["previousCompanies", index, "relievingLetter"]}
          label="Relieving Letter"
          form={form}
        />

        {/* Form 16 */}
        <Collapse
          bordered={false}
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            borderRadius: 8,
            marginTop: 12,
            border: "1px solid #93c5fd",
          }}
        >
          <Panel
            key="form16"
            header={
              <span style={{ fontWeight: 600, fontSize: 12, color: "#1e40af" }}>
                📋 Form 16
              </span>
            }
          >
            <Form.List name={[index, "form16"]}>
              {(fields, { add, remove }) => (
                <>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({})}
                    size="small"
                    block
                    style={{ marginBottom: 8, fontSize: 11 }}
                  >
                    Add Form 16
                  </Button>
                  {fields.map((field, form16Index) => (
                    <div
                      key={field.key}
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        background: "white",
                        borderRadius: 8,
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 600 }}>
                          Form 16 #{form16Index + 1}
                        </span>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => remove(form16Index)}
                          />
                        )}
                      </div>
                      <UploadField
                        name={[
                          "previousCompanies",
                          index,
                          "form16",
                          field.name,
                          "file",
                        ]}
                        label={null}
                        form={form}
                      />
                    </div>
                  ))}
                </>
              )}
            </Form.List>
          </Panel>
        </Collapse>

        {/* Payslips */}
        <Collapse
          bordered={false}
          style={{
            background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
            borderRadius: 8,
            marginTop: 12,
            border: "1px solid #86efac",
          }}
        >
          <Panel
            key="payslips"
            header={
              <span style={{ fontWeight: 600, fontSize: 12, color: "#166534" }}>
                💰 Payslips
              </span>
            }
          >
            <Form.List name={[index, "payslips"]}>
              {(fields, { add, remove }) => (
                <>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({})}
                    size="small"
                    block
                    style={{ marginBottom: 8, fontSize: 11 }}
                  >
                    Add Payslip
                  </Button>
                  {fields.map((field, payslipIndex) => (
                    <div
                      key={field.key}
                      style={{
                        marginBottom: 8,
                        padding: 8,
                        background: "white",
                        borderRadius: 8,
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 600 }}>
                          Payslip #{payslipIndex + 1}
                        </span>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={() => remove(payslipIndex)}
                          />
                        )}
                      </div>
                      <UploadField
                        name={[
                          "previousCompanies",
                          index,
                          "payslips",
                          field.name,
                          "file",
                        ]}
                        label={null}
                        form={form}
                      />
                    </div>
                  ))}
                </>
              )}
            </Form.List>
          </Panel>
        </Collapse>
      </div>

      {/* Contact Details */}
      <div style={{ flex: "1 1 23%", minWidth: 250, ...cardStyle }}>
        <div style={sectionHeaderStyle}>
          <UserOutlined />
          Contact Details
        </div>
        <Form.List name={[index, "contacts"]}>
          {(fields, { add, remove }) => (
            <>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                size="small"
                onClick={() => {
                  add({});
                  setActiveContactKey([fields.length.toString()]);
                }}
                block
                style={{ marginBottom: 12, fontSize: 11 }}
              >
                Add Contact
              </Button>

              <Collapse
                accordion
                bordered={false}
                activeKey={activeContactKey}
                onChange={setActiveContactKey}
                style={{
                  background: "transparent",
                }}
              >
                {fields.map((field, contactIndex) => (
                  <Panel
                    key={contactIndex.toString()}
                    header={
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        <PhoneOutlined style={{ marginRight: 6 }} />
                        Contact {contactIndex + 1}
                      </span>
                    }
                    extra={
                      contactIndex !== 0 && (
                        <DeleteOutlined
                          style={{ color: "red" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(contactIndex);
                          }}
                        />
                      )
                    }
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <ContactDetails
                      contactIndex={field.name}
                      companyIndex={index}
                      form={form}
                    />
                  </Panel>
                ))}
              </Collapse>
            </>
          )}
        </Form.List>
      </div>
    </div>
  );
};

/* ================= COMPANY PANEL HEADER ================= */
const CompanyPanelHeader = ({ index, form }: { index: number; form: any }) => {
  const companyName = Form.useWatch(
    ["previousCompanies", index, "companyName"],
    form,
  );
  const designation = Form.useWatch(
    ["previousCompanies", index, "designation"],
    form,
  );

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
      }}
    >
      <span style={{ fontWeight: 600, fontSize: 14 }}>
        🏢 Company #{index + 1}
      </span>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {designation && (
          <Tag
            color="green"
            style={{
              fontSize: 11,
              padding: "2px 8px",
            }}
          >
            {designation}
          </Tag>
        )}
        {companyName && (
          <Tag
            style={{
              fontSize: 12,
              fontWeight: 500,
              background: "linear-gradient(90deg, #1677ff 0%, #4096ff 100%)",
              color: "white",
              border: "none",
              padding: "4px 12px",
            }}
          >
            {companyName}
          </Tag>
        )}
      </div>
    </div>
  );
};

/* ================= MAIN EXPORT COMPONENT ================= */
export const EmployeeHistoryEditForm = ({ form, initialData }: any) => {
  const [activeKey, setActiveKey] = useState("0");

  useEffect(() => {
    if (initialData && Array.isArray(initialData) && initialData.length > 0) {
      const formattedData = initialData.map((company: any) => ({
        ...company,
        doj: company?.doj ? dayjs(company.doj) : null,
        lwd: company?.lwd ? dayjs(company.lwd) : null,
        contacts: company.contacts || [{}],
        form16: (company.form16 || []).map((f: any) => ({ file: f })),
        payslips: (company.payslips || []).map((p: any) => ({ file: p })),
      }));
      form.setFieldsValue({
        previousCompanies: formattedData,
      });
    } else {
      // Initialize with one empty company
      form.setFieldsValue({
        previousCompanies: [
          {
            contacts: [{}],
            form16: [],
            payslips: [],
          },
        ],
      });
    }
  }, [initialData, form]);

  return (
    <div style={{ padding: "16px" }}>
      <Form.List
        name="previousCompanies"
        initialValue={[
          {
            contacts: [{}],
            form16: [],
            payslips: [],
          },
        ]}
      >
        {(fields, { add, remove }) => (
          <>
            <div
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 600, color: "#1f2937" }}>
                <HistoryOutlined style={{ marginRight: 8 }} />
                Previous Employment History
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  add({
                    contacts: [{}],
                    form16: [],
                    payslips: [],
                  });
                  setTimeout(() => {
                    setActiveKey(fields.length.toString());
                  }, 0);
                }}
                style={{
                  background:
                    "linear-gradient(90deg, #1677ff 0%, #4096ff 100%)",
                  border: "none",
                }}
              >
                Add Company
              </Button>
            </div>

            <Collapse
              accordion
              activeKey={activeKey}
              onChange={(key) =>
                setActiveKey(Array.isArray(key) ? (key[0] ?? "") : key)
              }
              style={{
                background: "transparent",
                border: "none",
              }}
            >
              {fields.map((field, arrayIndex) => (
                <Panel
                  key={field.key}
                  header={<CompanyPanelHeader index={field.name} form={form} />}
                  extra={
                    arrayIndex !== 0 && (
                      <Popconfirm
                        title="Delete this company?"
                        onConfirm={(e) => {
                          e?.stopPropagation();
                          remove(field.name);
                          setActiveKey("0");
                        }}
                        onCancel={(e) => e?.stopPropagation()}
                        okText="Yes"
                        cancelText="No"
                      >
                        <DeleteOutlined
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: "red" }}
                        />
                      </Popconfirm>
                    )
                  }
                  style={{
                    background: "white",
                    borderRadius: 12,
                    marginBottom: 16,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <CompanyFormBlock index={field.name} form={form} />
                </Panel>
              ))}
            </Collapse>

            {/* The save button is now in the parent Modal footer */}
          </>
        )}
      </Form.List>
    </div>
  );
};

export default EmployeeHistoryEditForm;
