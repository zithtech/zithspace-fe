"use client";
import React, {
  useState,
  useRef,
  forwardRef,
  use,
  useImperativeHandle,
  useEffect,
} from "react";

import {
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Checkbox,
  Collapse,
  Badge,
  Tag,
  Divider as Divder,
} from "antd";

import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  CloseOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

const { Panel } = Collapse;

const labelStyle = { fontSize: 12, fontWeight: 500 };
const inputStyle = { height: 25, fontSize: 12 };
const cardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 12,
};

const Section = ({ title }: { title: string }) => (
  <div
    style={{
      margin: "6px 0 4px",
      fontWeight: 600,
      color: "#1677ff",
      fontSize: 13,
    }}
  >
    {title}
  </div>
);

const InputField = ({ label, name }: any) => (
  <Form.Item
    label={<span style={labelStyle}>{label}</span>}
    name={name}
    style={{ marginBottom: 6 }}
  >
    <Input style={inputStyle} />
  </Form.Item>
);

const SelectField = ({ label, name, children }: any) => (
  <Form.Item
    label={<span style={labelStyle}>{label}</span>}
    name={name}
    style={{ marginBottom: 6 }}
  >
    <Select style={inputStyle}>{children}</Select>
  </Form.Item>
);

const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const UploadField = ({ label, name }: any) => {
  const form = Form.useFormInstance();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  // ✅ Load existing file data on mount and when form values change
  useEffect(() => {
    const currentValue = form.getFieldValue(name);
    console.log(
      "📂 UploadField useEffect - name:",
      name,
      "currentValue:",
      currentValue,
    );
    if (currentValue && currentValue.base64) {
      setFileUrl(currentValue.base64);
      setFileName(currentValue.fileName || "");
    }
  }, [form, name]);

  const handleFileSelect = async (file: File) => {
    try {
      const previewUrl = URL.createObjectURL(file);
      setFileUrl(previewUrl);
      setFileName(file.name);

      const base64 = await getBase64(file);
      const fileData = {
        base64,
        fileName: file.name,
        fileType: file.type,
      };

      // ✅ CRITICAL: Log BEFORE setting
      console.log(
        "🔥 BEFORE setFieldValue - name:",
        name,
        "fileData:",
        fileData,
      );

      form.setFieldValue(name, fileData);

      // ✅ CRITICAL: Log AFTER setting to verify it was stored
      const verifyValue = form.getFieldValue(name);
      console.log(
        "✅ AFTER setFieldValue - name:",
        name,
        "stored value:",
        verifyValue,
      );

      // ✅ Also log ALL form values to see the complete structure
      const allValues = form.getFieldsValue(true);
      console.log("📦 ALL FORM VALUES after upload:", allValues);
    } catch (error) {
      console.error("Error processing file:", error);
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
        marginBottom: 6,
      }}
    >
      {label && <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>}
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {fileName && (
          <span style={{ fontSize: 11, color: "#52c41a", marginRight: 4 }}>
            ✓
          </span>
        )}
        {!fileUrl ? (
          <Upload
            showUploadList={false}
            beforeUpload={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
          >
            <UploadOutlined style={{ fontSize: 18, cursor: "pointer" }} />
          </Upload>
        ) : (
          <>
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => window.open(fileUrl, "_blank")}
            />
            <Upload showUploadList={false} beforeUpload={handleFileSelect}>
              <Button size="small" icon={<EditOutlined />} />
            </Upload>
            <Button
              size="small"
              danger
              icon={<CloseOutlined />}
              onClick={handleRemove}
            />
          </>
        )}
      </div>
    </div>
  );
};

/* ================= CONTACT DETAILS BLOCK ================= */
/* ================= CONTACT DETAILS BLOCK ================= */
const ContactDetails = ({ contactIndex, companyIndex, form }: any) => {
  const role = Form.useWatch(
    ["previousCompanies", companyIndex, "contacts", contactIndex, "contactRole"],
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
    <>
      {/* CONTACT ROLE */}
      <Form.Item
        name={[
          "previousCompanies",
          companyIndex,
          "contacts",
          contactIndex,
          "contactRole",
        ]}
        label={<span style={labelStyle}>Contact Person Type</span>}
        rules={[{ required: true, message: "Select contact type" }]}
        style={{ marginBottom: 6 }}
      >
        <Select placeholder="Select role">
          <Select.Option value="hr">HR</Select.Option>
          <Select.Option value="manager">Manager</Select.Option>
          <Select.Option value="teamLead">Team Leader</Select.Option>
          <Select.Option value="reportingManager">
            Reporting Manager
          </Select.Option>
        </Select>
      </Form.Item>

      {/* CONTACT NAME */}
      <InputField
        label={`${label} Name`}
        name={[
          "previousCompanies",
          companyIndex,
          "contacts",
          contactIndex,
          "contactName",
        ]}
      />

      {/* CONTACT NUMBER */}
      <InputField
        label={`${label} Contact Number`}
        name={[
          "previousCompanies",
          companyIndex,
          "contacts",
          contactIndex,
          "contactNumber",
        ]}
      />
    </>
  );
};

/* ================= COMPANY FORM BLOCK ================= */

const CompanyFormBlock = ({ index, form }: any) => {
  const getLetter = (idx: number) => String.fromCharCode(65 + idx);

  // ✅ Debug: Log the index being used
  console.log("🏢 CompanyFormBlock rendered with index:", index);

  return (
    <div style={{ display: "flex", gap: 10 }}>
      {/* LEFT */}
      <div style={{ width: "25%", ...cardStyle }}>
        <Section title="🏢 Company Details" />
        <InputField
          name={["previousCompanies", index, "companyName"]}
          label="Previous Company"
        />
        <InputField
          name={["previousCompanies", index, "location"]}
          label="Location"
        />
        <InputField
          name={["previousCompanies", index, "industry"]}
          label="Industry / Domain"
        />
        <InputField
          name={["previousCompanies", index, "address"]}
          label="Company Address"
        />
      </div>

      {/* MIDDLE */}
      <div style={{ width: "25%", ...cardStyle }}>
        <Section title="📅 Tenure Details" />
        <Form.Item
          name={["previousCompanies", index, "doj"]}
          label={<span style={labelStyle}>Date of Joining</span>}
        >
          <DatePicker style={{ width: "100%", height: 25 }} />
        </Form.Item>
        <Form.Item
          name={["previousCompanies", index, "lwd"]}
          label={<span style={labelStyle}>Last Working Day</span>}
        >
          <DatePicker style={{ width: "100%", height: 25 }} />
        </Form.Item>
        <InputField
          name={["previousCompanies", index, "designation"]}
          label="Designation"
        />
        <SelectField
          name={["previousCompanies", index, "employmentType"]}
          label="Employment Type"
        >
          <Select.Option value="fulltime">Full Time</Select.Option>
          <Select.Option value="contract">Contract</Select.Option>
          <Select.Option value="intern">Intern</Select.Option>
        </SelectField>
      </div>

      {/* RIGHT - DOCUMENTS */}
      <div style={{ width: "25%", ...cardStyle, overflow: "auto" }}>
        <Section title="📎 Documents" />

        {/* ✅ These should now work */}
        <UploadField
          name={["previousCompanies", index, "experienceLetter"]}
          label="Experience Letter"
        />
        <UploadField
          name={["previousCompanies", index, "offerLetter"]}
          label="Offer Letter"
        />
        <UploadField
          name={["previousCompanies", index, "serviceLetter"]}
          label="Service Letter"
        />
        <UploadField
          name={["previousCompanies", index, "relievingLetter"]}
          label="Relieving Letter"
        />

        <div style={{ display: "flex", gap: "10px", flexDirection: "column" }}>
          {/* FORM 16 */}
          <Collapse
            bordered={false}
            style={{
              background: "#f9fafb",
              border: "1px solid #adc6ff",
              borderRadius: 8,
              marginTop: 10,
            }}
          >
            <Panel
              key="form16"
              header={
                <span style={{ fontWeight: 600, fontSize: 14, color: "black" }}>
                  Form 16
                </span>
              }
            >
              <Form.List name={["previousCompanies", index, "form16"]}>
                {(fields, { add, remove }) => (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        Uploaded Form 16
                      </span>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add(null)}
                        size="small"
                      >
                        Add
                      </Button>
                    </div>

                    {fields.map((field, form16Index) => (
                      <div
                        key={field.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                          padding: "6px 8px",
                          border: "1px solid #d6e4ff",
                          borderRadius: 6,
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {fields.length > 1 && (
                            <Button
                              type="text"
                              danger
                              icon={<CloseOutlined />}
                              size="small"
                              style={{ padding: 0, minWidth: 18 }}
                              onClick={() => remove(form16Index)}
                            />
                          )}
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: "black",
                            }}
                          >
                            Form 16 {getLetter(form16Index)}
                          </span>
                        </div>

                        <UploadField
                          name={[
                            "previousCompanies",
                            index,
                            "form16",
                            field.name,
                          ]}
                          label={null}
                        />
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            </Panel>
          </Collapse>

          {/* PAYSLIPS */}
          <Collapse
            bordered={false}
            style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
            }}
          >
            <Panel
              key="payslips"
              header={
                <span style={{ fontWeight: 500, fontSize: 14 }}>Payslips</span>
              }
            >
              <Form.List name={["previousCompanies", index, "payslips"]}>
                {(fields, { add, remove }) => (
                  <>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        Uploaded Payslips
                      </span>
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={() => add(null)}
                        size="small"
                      >
                        Add
                      </Button>
                    </div>

                    {fields.map((field, payslipIndex) => (
                      <div
                        key={field.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 8,
                          padding: "6px 8px",
                          border: "1px solid #d6e4ff",
                          borderRadius: 6,
                          background: "#ffffff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {fields.length > 1 && (
                            <Button
                              type="text"
                              danger
                              icon={<CloseOutlined />}
                              size="small"
                              style={{ padding: 0, minWidth: 18 }}
                              onClick={() => remove(payslipIndex)}
                            />
                          )}
                          <span style={{ fontSize: 14, fontWeight: 500 }}>
                            Payslip {payslipIndex + 1}
                          </span>
                        </div>

                        <UploadField
                          name={[
                            "previousCompanies",
                            index,
                            "payslips",
                            field.name,
                          ]}
                          label={null}
                        />
                      </div>
                    ))}
                  </>
                )}
              </Form.List>
            </Panel>
          </Collapse>
        </div>
      </div>

      {/* CONTACTS */}
      <div style={{ width: "25%", ...cardStyle }}>
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <Form.List name={["previousCompanies", index, "contacts"]}>
            {(fields, { add, remove }) => (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>Contact Details</span>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={() => add({})}
                  >
                    Add
                  </Button>
                </div>

                <Collapse accordion bordered={false}>
                  {fields.map((field, contactIndex) => (
                    <Panel
                      key={field.key}
                      header={`Contact ${contactIndex + 1}`}
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
                    >
                      <ContactDetails
                        contactIndex={field.name}
                        companyIndex={index}
                        form={form}
                      />
                      <Checkbox style={{ fontSize: 12, marginTop: 8 }}>
                        I declare the above information is correct
                      </Checkbox>
                    </Panel>
                  ))}
                </Collapse>
              </>
            )}
          </Form.List>
        </div>
      </div>
    </div>
  );
};

const CompanyPanelHeader = ({ index, form }: { index: number; form: any }) => {
  const companyName = Form.useWatch(
    ["previousCompanies", index, "companyName"],
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
      <span>Previous Company #{index + 1}</span>

      <Tag
        color="blue"
        style={{
          fontSize: 15,
          fontWeight: 400,
          color: "white",
          background: "#1677ff",
          border: "1px solid #1677ff",
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {companyName || ""}
      </Tag>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

const EmployeHistory = forwardRef(({ data }: any, ref: any) => {
  const [form] = Form.useForm();
  const [activeKey, setActiveKey] = useState("0");

  // ✅ Load initial data into form
  useEffect(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      const formattedData = data.map((company: any) => ({
        ...company,
        doj: company?.doj ? dayjs(company.doj) : null,
        lwd: company?.lwd ? dayjs(company.lwd) : null,
      }));
      form.setFieldsValue({
        previousCompanies: formattedData,
      });
    }
  }, [data, form]);

  // ✅ Get data from form
  useImperativeHandle(ref, () => ({
    getData: () => {
      const allFormValues = form.getFieldsValue(true);
      console.log("🔍 RAW FORM VALUES:", allFormValues);

      const previousCompanies = allFormValues.previousCompanies || [];

      const processedData = previousCompanies.map((company: any) => ({
        ...company,
        doj: company?.doj ? company.doj.format("YYYY-MM-DD") : null,
        lwd: company?.lwd ? company.lwd.format("YYYY-MM-DD") : null,
      }));

      console.log("📦 FINAL PROCESSED DATA:", processedData);
      return processedData;
    },
  }));

  return (
    <Form
      form={form}
      layout="vertical"
      style={{ padding: 15 }}
      onFinish={(values) => {
        console.log("FINAL SUBMIT 👉", values.previousCompanies);
      }}
    >
      <Form.List
        name="previousCompanies"
        initialValue={[
          {
            contacts: [{}],
            form16: [null],
            payslips: [null],
          },
        ]}
      >
        {(fields, { add, remove }) => (
          <>
            <div
              style={{
                marginBottom: 15,
                justifyContent: "space-between",
                display: "flex",
              }}
            >
              <Button type="primary" htmlType="submit">
                Submit All Companies
              </Button>

              <Badge
                style={{ background: "#1677ff", color: "white" }}
                count={fields.length}
                showZero
              >
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    add({
                      contacts: [{}],
                      form16: [null],
                      payslips: [null],
                    });
                    setTimeout(() => {
                      const nextIndex = fields.length;
                      setActiveKey(nextIndex.toString());
                    }, 0);
                  }}
                >
                  Add New Company
                </Button>
              </Badge>
            </div>

            <Collapse
              accordion
              activeKey={activeKey}
              onChange={(key) =>
                setActiveKey(Array.isArray(key) ? (key[0] ?? "") : key)
              }
            >
              {fields.map((field, arrayIndex) => (
                <Panel
                  key={field.key}
                  header={<CompanyPanelHeader index={field.name} form={form} />}
                  extra={
                    arrayIndex !== 0 && (
                      <DeleteOutlined
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(field.name);
                          setActiveKey("0");
                        }}
                        style={{ color: "red" }}
                      />
                    )
                  }
                >
                  {/* ✅ Use field.name consistently */}
                  <CompanyFormBlock index={field.name} form={form} />
                </Panel>
              ))}
            </Collapse>
          </>
        )}
      </Form.List>
    </Form>
  );
});

export default EmployeHistory;
