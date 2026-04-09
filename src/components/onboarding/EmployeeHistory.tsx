"use client";
import React, {
  useState,
  forwardRef,
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
  message,
  Row,
  Col,
  Tooltip,
  Empty,
  Typography,
} from "antd";

import {
  Plus,
  Trash2,
  FileText,
  Upload as UploadIcon,
  Eye,
  Pencil,
  X,
  Briefcase,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  Building2,
  FileCheck,
  FileOutput,
  LogOut,
  ShieldAlert,
  CreditCard,
  FileSearch,
} from "lucide-react";
import dayjs from "dayjs";

const { Text } = Typography;

const labelStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-slate-500)",
  marginBottom: "4px",
  display: "block"
};

const cardStyle: React.CSSProperties = {
  background: "var(--bg-pure-white)",
  border: "1px solid var(--border-slate-100)",
  borderRadius: "12px",
  padding: "20px",
  marginBottom: "16px",
  transition: "all 0.2s ease",
};

const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
    <div style={{ padding: "6px", background: "var(--bg-blue-50)", borderRadius: "8px", border: "1px solid var(--border-slate-100)" }}>
      <Icon size={16} style={{ color: "var(--premium-blue)" }} />
    </div>
    <div>
      <div style={{ fontWeight: 700, color: "var(--text-slate-900)", fontSize: "14px" }}>{title}</div>
      {subtitle && <div style={{ fontSize: "11px", color: "var(--text-slate-500)" }}>{subtitle}</div>}
    </div>
  </div>
);

const CustomInputField = ({ label, name, placeholder, rules, onKeyDown, onKeyPress, maxLength }: any) => (
  <Form.Item
    label={<span style={labelStyle}>{label}</span>}
    name={name}
    rules={rules}
    style={{ marginBottom: "12px" }}
  >
    <Input
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onKeyPress={onKeyPress}
      maxLength={maxLength}
      style={{
        height: "38px",
        borderRadius: "8px",
        border: "1px solid var(--border-slate-200)",
        fontSize: "13px",
        background: "var(--bg-pure-white)",
        color: "var(--text-slate-900)"
      }}
    />
  </Form.Item>
);

const CustomSelectField = ({ label, name, children, placeholder, rules }: any) => (
  <Form.Item
    label={<span style={labelStyle}>{label}</span>}
    name={name}
    rules={rules}
    style={{ marginBottom: "12px" }}
  >
    <Select
      placeholder={placeholder}
      style={{
        height: "38px",
        borderRadius: "8px",
        fontSize: "13px"
      }}
      dropdownStyle={{ borderRadius: "8px" }}
    >
      {children}
    </Select>
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
const MAX_SIZE = 5 * 1024 * 1024;

const DocumentBox = ({ label, name, icon: CustomIcon, isAdditional = false, onRemove }: any) => {
  const form = Form.useFormInstance();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [uploadDate, setUploadDate] = useState<string>("");

  useEffect(() => {
    const currentValue = form.getFieldValue(name);
    if (currentValue && currentValue.base64) {
      setFileUrl(currentValue.base64);
      setFileName(currentValue.fileName || "");
      setUploadDate(dayjs().format("MMM DD, YYYY"));
    }
  }, [form, name]);

  const handleFileSelect = async (file: File) => {
    if (file.size > MAX_SIZE) {
      message.error("File size should be less than 5MB");
      return Upload.LIST_IGNORE;
    }

    try {
      const previewUrl = URL.createObjectURL(file);
      setFileUrl(previewUrl);
      setFileName(file.name);
      setUploadDate(dayjs().format("MMM DD, YYYY"));

      const base64 = await getBase64(file);
      const fileData = {
        base64,
        fileName: file.name,
        fileType: file.type,
      };

      form.setFieldValue(name, fileData);
    } catch (error) {
      console.error("Error processing file:", error);
    }
    return false;
  };

  const handleRemove = () => {
    setFileUrl(null);
    setFileName("");
    form.setFieldValue(name, null);
    if (onRemove) onRemove();
  };

  return (
    <div
      style={{
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-slate-100)",
        borderRadius: "12px",
        padding: "20px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: "130px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-slate-900)" }}>{label}</span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {!fileUrl ? (
          <div style={{ textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: "var(--text-slate-400)", fontSize: "12px" }}>No file uploaded</span>}
              style={{ margin: "5px 0" }}
            />
            <Upload
              showUploadList={false}
              beforeUpload={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx"
            >
              <Button
                icon={<UploadIcon size={14} />}
                style={{
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#475569",
                  border: "1px dashed #cbd5e1",
                  height: "32px"
                }}
              >
                Attach or drag
              </Button>
            </Upload>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <div style={{
              width: "32px",
              height: "40px",
              background: "var(--bg-blue-50)",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid var(--border-slate-100)"
            }}>
              <FileText size={18} style={{ color: "var(--premium-blue)" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "13px", color: "var(--text-slate-900)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {fileName}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>
                {uploadDate}
              </div>

              <div style={{ marginTop: "8px", display: "flex", gap: "10px" }}>
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={13} />}
                  onClick={handleRemove}
                  style={{ padding: 0, height: "auto", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                >
                  Delete
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<Eye size={13} />}
                  onClick={() => window.open(fileUrl, "_blank")}
                  style={{ padding: 0, height: "auto", color: "var(--premium-blue)", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" }}
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdditionalDocItem = ({ field, companyIndex, adIdx, remove, form }: any) => {
  const docLabel = Form.useWatch(["previousCompanies", companyIndex, "additionalDocuments", field.name, "docLabel"], form);

  return (
    <Col span={8} key={field.key}>
      <div style={{
        background: "var(--bg-pure-white)",
        border: "1px solid var(--border-slate-100)",
        borderRadius: "10px",
        padding: "12px",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}>
        <Form.Item
          name={[field.name, "docLabel"]}
          label={<span style={{ ...labelStyle, fontSize: "11px", marginBottom: "2px" }}>Document Name</span>}
          rules={[{ required: false }]}
          style={{ marginBottom: "8px" }}
        >
          <Input placeholder="e.g. Portfolio" size="small" style={{ borderRadius: "6px", height: "30px" }} />
        </Form.Item>
        <div style={{ flex: 1 }}>
          <DocumentBox
            name={["previousCompanies", companyIndex, "additionalDocuments", field.name, "docFile"]}
            label={docLabel || "New Document"}
            onRemove={() => remove(adIdx)}
          />
        </div>
      </div>
    </Col>
  );
};

const ContactDetails = ({ contactIndex, companyIndex, form }: any) => {
  const role = Form.useWatch(
    ["previousCompanies", companyIndex, "contacts", contactIndex, "contactRole"],
    form
  );

  const roleLabelMap: any = {
    hr: "HR",
    manager: "Manager",
    teamLead: "Team Leader",
    reportingManager: "Reporting Manager",
  };

  const label = roleLabelMap[role] || "Contact";

  return (
    <div style={{ background: "var(--bg-pure-white)", padding: "16px", borderRadius: "10px", border: "1px solid var(--border-slate-100)", marginBottom: "12px" }}>
      <Row gutter={16}>
        <Col span={24}>
          <CustomSelectField
            name={["previousCompanies", companyIndex, "contacts", contactIndex, "contactRole"]}
            label="Contact Person Type"
            rules={[{ required: false }]}
            placeholder="Select role"
          >
            <Select.Option value="hr">HR</Select.Option>
            <Select.Option value="manager">Manager</Select.Option>
            <Select.Option value="teamLead">Team Leader</Select.Option>
            <Select.Option value="reportingManager">Reporting Manager</Select.Option>
          </CustomSelectField>
        </Col>
        <Col span={12}>
          <CustomInputField
            label={`${label} Name`}
            name={["previousCompanies", companyIndex, "contacts", contactIndex, "contactName"]}
            placeholder="Enter name"
            onKeyDown={(e: any) => {
              if (e.key.length > 1) return;
              if (!/^[A-Za-z\s-]$/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
        </Col>
        <Col span={12}>
          <CustomInputField
            label={`${label} Email`}
            name={["previousCompanies", companyIndex, "contacts", contactIndex, "contactEmail"]}
            placeholder="Enter email"
          />
        </Col>
        <Col span={24}>
          <CustomInputField
            label={`${label} Contact Number`}
            name={["previousCompanies", companyIndex, "contacts", contactIndex, "contactNumber"]}
            placeholder="Enter phone number"
            maxLength={10}
            onKeyPress={(e: any) => {
              if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                e.preventDefault();
              }
            }}
          />
        </Col>
      </Row>
    </div>
  );
};

const CompanyCard = ({ field, index, form, remove, length }: any) => {
  const companyName = Form.useWatch(["previousCompanies", index, "companyName"], form);
  const getLetter = (idx: number) => String.fromCharCode(65 + idx);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "40px", height: "40px", background: "var(--bg-blue-50)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--premium-blue)" }}>
            <Building2 size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-slate-900)" }}>
              {companyName || `Previous Company #${index + 1}`}
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-slate-500)" }}>Experience Details</span>
          </div>
        </div>
        {length > 1 && (
          <Button
            type="text"
            danger
            icon={<Trash2 size={18} />}
            onClick={() => remove(field.name)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          />
        )}
      </div>

      <Row gutter={24}>
        <Col span={24}>
          <div style={{ marginBottom: "24px" }}>
            <SectionHeader icon={Building2} title="Company Details" subtitle="Information about your previous employer" />
            <Row gutter={16}>
              <Col span={6}>
                <CustomInputField name={["previousCompanies", index, "companyName"]} label="Previous Company" placeholder="e.g. Google India" />
              </Col>
              <Col span={6}>
                <CustomInputField name={["previousCompanies", index, "location"]} label="Location" placeholder="e.g. Bangalore, India" />
              </Col>
              <Col span={6}>
                <CustomInputField name={["previousCompanies", index, "industry"]} label="Industry / Domain" placeholder="e.g. Fintech" />
              </Col>
              <Col span={6}>
                <CustomInputField name={["previousCompanies", index, "address"]} label="Company Address" placeholder="Full address" />
              </Col>
            </Row>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <SectionHeader icon={Calendar} title="Tenure Details" subtitle="Duration and role at the company" />
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name={["previousCompanies", index, "doj"]}
                  label={<span style={labelStyle}>Date of Joining</span>}
                >
                  <DatePicker style={{ width: "100%", height: "38px", borderRadius: "8px" }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={["previousCompanies", index, "lwd"]}
                  label={<span style={labelStyle}>Last Working Day</span>}
                >
                  <DatePicker style={{ width: "100%", height: "38px", borderRadius: "8px" }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <CustomInputField name={["previousCompanies", index, "designation"]} label="Designation" placeholder="e.g. SDE II" />
              </Col>
              <Col span={6}>
                <CustomSelectField name={["previousCompanies", index, "employmentType"]} label="Employment Type" placeholder="Select">
                  <Select.Option value="Full Time">Full Time</Select.Option>
                  <Select.Option value="Contract">Contract</Select.Option>
                  <Select.Option value="Internship">Intern</Select.Option>
                </CustomSelectField>
              </Col>
            </Row>
          </div>
        </Col>

        {/* Documents Section - Moved Below */}
        <Col span={24}>
          <div style={{ padding: "20px", background: "var(--bg-pure-white)", borderRadius: "12px", border: "1px solid var(--border-slate-100)", marginBottom: "20px" }}>
            <SectionHeader icon={FileSearch} title="Supportive Documents" subtitle="Upload relevant certificates and proof" />

            <Row gutter={[12, 12]}>
              <Col span={8}>
                <DocumentBox name={["previousCompanies", index, "experienceLetter"]} label="Experience Letter" />
              </Col>
              <Col span={8}>
                <DocumentBox name={["previousCompanies", index, "offerLetter"]} label="Offer Letter" />
              </Col>
              <Col span={8}>
                <DocumentBox name={["previousCompanies", index, "serviceLetter"]} label="Service Letter" />
              </Col>
              <Col span={8}>
                <DocumentBox name={["previousCompanies", index, "relievingLetter"]} label="Relieving Letter" />
              </Col>

              {/* Form 16 List */}
              <Form.List name={["previousCompanies", index, "form16"]}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, f16Idx) => (
                      <Col span={8} key={field.key}>
                        <DocumentBox
                          name={["previousCompanies", index, "form16", field.name]}
                          label={`Form 16 (${getLetter(f16Idx)})`}
                          onRemove={fields.length > 1 ? () => remove(f16Idx) : undefined}
                        />
                      </Col>
                    ))}
                    <Col span={8}>
                      <div
                        onClick={() => add(null)}
                        style={{
                          height: "100%",
                          minHeight: "130px",
                          border: "1px dashed var(--border-slate-200)",
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          background: "var(--bg-slate-50)",
                          color: "var(--text-slate-500)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Plus size={18} style={{ color: "var(--text-slate-400)" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "6px", color: "var(--text-slate-500)" }}>Add Form 16</span>
                      </div>
                    </Col>
                  </>
                )}
              </Form.List>

              {/* Payslips List */}
              <Form.List name={["previousCompanies", index, "payslips"]}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, pIdx) => (
                      <Col span={8} key={field.key}>
                        <DocumentBox
                          name={["previousCompanies", index, "payslips", field.name]}
                          label={`Payslip (${getLetter(pIdx)})`}
                          onRemove={fields.length > 1 ? () => remove(pIdx) : undefined}
                        />
                      </Col>
                    ))}
                    <Col span={8}>
                      <div
                        onClick={() => add(null)}
                        style={{
                          height: "100%",
                          minHeight: "130px",
                          border: "1px dashed var(--border-slate-200)",
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          background: "var(--bg-slate-50)",
                          color: "var(--text-slate-500)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Plus size={18} style={{ color: "var(--text-slate-400)" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "6px", color: "var(--text-slate-500)" }}>Add Payslip</span>
                      </div>
                    </Col>
                  </>
                )}
              </Form.List>

              {/* Additional Documents List - NEW FEATURE */}
              <Form.List name={["previousCompanies", index, "additionalDocuments"]}>
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, adIdx) => (
                      <AdditionalDocItem
                        key={field.key}
                        field={field}
                        companyIndex={index}
                        adIdx={adIdx}
                        remove={remove}
                        form={form}
                      />
                    ))}
                    <Col span={8}>
                      <div
                        onClick={() => add({})}
                        style={{
                          height: "100%",
                          minHeight: "180px",
                          border: "1px dashed var(--premium-blue)",
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          background: "var(--bg-blue-50)",
                          color: "var(--premium-blue)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        <Plus size={18} />
                        <span style={{ fontSize: "12px", fontWeight: 600, marginTop: "6px" }}>Add Other Document</span>
                      </div>
                    </Col>
                  </>
                )}
              </Form.List>
            </Row>
          </div>
        </Col>

        {/* Contact Details Section */}
        <Col span={24}>
          <div style={{ padding: "24px", borderTop: "1px solid var(--border-slate-100)" }}>
            <SectionHeader icon={User} title="Verification Contacts" subtitle="Professional references from this tenure" />
            <Form.List name={["previousCompanies", index, "contacts"]}>
              {(fields, { add, remove }) => (
                <Row gutter={[16, 16]}>
                  {fields.map((field, contactIndex) => (
                    <Col span={8} key={field.key}>
                      <div style={{ position: "relative" }}>
                        <ContactDetails contactIndex={field.name} companyIndex={index} form={form} />
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            size="small"
                            icon={<X size={14} />}
                            onClick={() => remove(field.name)}
                            style={{ position: "absolute", top: "10px", right: "10px" }}
                          />
                        )}
                      </div>
                    </Col>
                  ))}
                  <Col span={8}>
                    <div
                      onClick={() => add({})}
                      style={{
                        height: "100%",
                        minHeight: "180px",
                        border: "1px dashed var(--border-slate-200)",
                        borderRadius: "12px",
                        padding: "20px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        background: "var(--bg-slate-50)",
                        color: "var(--text-slate-500)",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <Plus size={20} style={{ color: "var(--text-slate-400)" }} />
                      <span style={{ fontSize: "13px", fontWeight: 600, marginTop: "8px" }}>Add Reference Contact</span>
                    </div>
                  </Col>
                </Row>
              )}
            </Form.List>
          </div>
        </Col>
        {/* Declaration */}
        <Col span={24}>
          <div style={{ marginTop: "16px", padding: "16px", borderTop: "1px solid var(--border-slate-100)" }}>
            <Checkbox style={{ fontSize: "13px", color: "var(--text-slate-500)" }}>
              I declare that the information provided above for this company is correct and verifiable.
            </Checkbox>
          </div>
        </Col>
      </Row>
    </div>
  );
};

const EmployeHistory = forwardRef(({ data }: any, ref: any) => {
  const [form] = Form.useForm();

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

  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        await form.validateFields();
        return true;
      } catch (error) {
        console.error("Validation failed:", error);
        return false;
      }
    },
    getData: () => {
      const allFormValues = form.getFieldsValue(true);
      const previousCompanies = allFormValues.previousCompanies || [];

      const processedData = previousCompanies.map((company: any) => ({
        ...company,
        doj: company?.doj ? company.doj.format("YYYY-MM-DD") : null,
        lwd: company?.lwd ? company.lwd.format("YYYY-MM-DD") : null,
      }));

      return processedData;
    },
  }));

  return (
    <div style={{ padding: "0 24px 24px", background: "transparent" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", padding: "16px 0", borderBottom: "1px solid var(--border-slate-100)" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "var(--text-slate-900)" }}>Employee History</h2>
          <p style={{ margin: "2px 0 0", fontSize: "14px", color: "var(--text-slate-500)" }}>Add your previous work experiences and relevant documents.</p>
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
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
              additionalDocuments: [],
            },
          ]}
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <CompanyCard
                  key={field.key}
                  field={field}
                  index={field.name}
                  form={form}
                  remove={remove}
                  length={fields.length}
                />
              ))}

              <Button
                type="dashed"
                block
                className="flex items-center justify-center gap-2"
                style={{
                  height: "56px",
                  borderRadius: "12px",
                  border: "2px dashed var(--border-slate-200)",
                  background: "var(--bg-slate-50)",
                  color: "var(--premium-blue)",
                  fontSize: "15px",
                  fontWeight: 600,
                  transition: "all 0.2s ease"
                }}
                onClick={() => {
                  add({
                    contacts: [{}],
                    form16: [null],
                    payslips: [null],
                  });
                }}
              >
                <Plus size={20} />
                Add Another Company Experience
              </Button>
            </>
          )}
        </Form.List>
      </Form>
    </div>
  );
});

EmployeHistory.displayName = "EmployeHistory";

export default EmployeHistory;
