"use client";
import React, { useState } from "react";

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
  Tag
} from "antd";

import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

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

const UploadField = ({ label, name }: any) => (
  <Form.Item name={name} style={{ marginBottom: 6 }}>
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ fontSize: 12, fontWeight: 500 }}>{label}</span>
      <Upload>
        <Button size="small" icon={<UploadOutlined />}>
          Upload
        </Button>
      </Upload>
    </div>
  </Form.Item>
);

/* ================= CONTACT DETAILS BLOCK ================= */
const RoleSelectField = ({ index }: any) => (
  <Form.Item
    name={[index, "contactRole"]}
    label={<span style={labelStyle}>Contact Person Type</span>}
    rules={[{ required: true, message: "Select contact type" }]}
    style={{ marginBottom: 6 }}
  >
    <Select placeholder="Select role">
      <Select.Option value="hr">HR</Select.Option>
      <Select.Option value="manager">Manager</Select.Option>
      <Select.Option value="teamLead">Team Leader</Select.Option>
      <Select.Option value="reportingManager">Reporting Manager</Select.Option>
    </Select>
  </Form.Item>
);

const ContactDetails = ({ index, form }: any) => {
  const role = Form.useWatch(["previousCompanies", index, "contactRole"], form);

  const roleLabelMap: any = {
    hr: "HR",
    manager: "Manager",
    teamLead: "Team Leader",
    reportingManager: "Reporting Manager",
  };

  const label = roleLabelMap[role] || "Contact Person";

  return (
    <>
      <Section title="📞 Contact Details" />

      <RoleSelectField index={index} />

      <InputField name={[index, "contactName"]} label={`${label} Name`} />

      <InputField name={[index, "contactNumber"]} label={`${label} Contact`} />
    </>
  );
};


/* ================= COMPANY FORM BLOCK ================= */
const CompanyFormBlock = ({ index, form }: any) => (
  <div style={{ display: "flex", gap: 10 }}>
    {/* LEFT */}
    <div style={{ width: "35%", ...cardStyle }}>
      <Section title="🏢 Company Details" />
      <InputField name={[index, "companyName"]} label="Previous Company" />
      <InputField name={[index, "location"]} label="Location" />
      <InputField name={[index, "industry"]} label="Industry / Domain" />
      <InputField name={[index, "address"]} label="Company Address" />
    </div>

    {/* MIDDLE */}
    <div style={{ width: "35%", ...cardStyle }}>
      <Section title="📅 Tenure Details" />
      <Form.Item
        name={[index, "doj"]}
        label={<span style={labelStyle}>Date of Joining</span>}
      >
        <DatePicker style={{ width: "100%", height: 25 }} />
      </Form.Item>
      <Form.Item
        name={[index, "lwd"]}
        label={<span style={labelStyle}>Last Working Day</span>}
      >
        <DatePicker style={{ width: "100%", height: 25 }} />
      </Form.Item>
      <InputField name={[index, "designation"]} label="Designation" />
      <SelectField name={[index, "employmentType"]} label="Employment Type">
        <Select.Option value="fulltime">Full Time</Select.Option>
        <Select.Option value="contract">Contract</Select.Option>
        <Select.Option value="intern">Intern</Select.Option>
      </SelectField>
    </div>

    {/* RIGHT */}
    {/* <div style={{ width: "30%", ...cardStyle }}>
      <Section title="📎 Documents" />
      <UploadField
        name={[index, "experienceLetter"]}
        label="Experience Letter"
      />
      <UploadField name={[index, "offerLetter"]} label="Offer Letter" />
      <UploadField name={[index, "payslips"]} label="Payslips" />

      <Section title="📞 HR Contact" />
      <InputField name={[index, "hrName"]} label="HR Name" />
      <InputField name={[index, "hrContact"]} label="HR Contact" />

      <Checkbox style={{ fontSize: 12 }}>
        I declare the above information is correct
      </Checkbox>
    </div> */}
    {/* RIGHT */}
    <div style={{ width: "30%", ...cardStyle }}>
      <Section title="📎 Documents" />
      <UploadField
        name={[index, "experienceLetter"]}
        label="Experience Letter"
      />
      <UploadField name={[index, "offerLetter"]} label="Offer Letter" />
      <UploadField name={[index, "payslips"]} label="Payslips" />

      <ContactDetails index={index} form={form} />

      <Checkbox style={{ fontSize: 12 }}>
        I declare the above information is correct
      </Checkbox>
    </div>
  </div>
);

const CompanyPanelHeader = ({
  index,
  form,
}: {
  index: number;
  form: any;
}) => {
  const companyName = Form.useWatch(
    ["previousCompanies", index, "companyName"],
    form
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
export default function EmployeHistory() {
  const [companyData, setCompanyData] = useState<any[]>([{}]);

  const [form] = Form.useForm();
  const [activeKey, setActiveKey] = useState("0");

  const onFinish = (values: any) => {
    console.log("ALL PREVIOUS COMPANIES 👉", values.previousCompanies);
  };

  console.log( "all company data",companyData);

  return (
  <Form
  form={form}
  layout="vertical"
  style={{ padding: 15 }}
  onValuesChange={(_, allValues) => {
    // 🔥 previousCompanies always array of objects
    setCompanyData(allValues.previousCompanies || []);
  }}
  onFinish={(values) => {
    console.log("FINAL SUBMIT 👉", values.previousCompanies);
  }}
>

      <Form.List name="previousCompanies" initialValue={[{}]}>
        {(fields, { add, remove }) => (
          <>
            {/* 🔼 ADD BUTTON AT TOP */}
            <div
              style={{
                marginBottom: 15,
                justifyContent: "space-between",
                display: "flex",
              }}
            >
              {/* SUBMIT */}
              <Button
                type="primary"
                htmlType="submit"
              >
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
                    add({});
                    setTimeout(() => {
                      const nextIndex = fields.length;
                      setActiveKey(nextIndex.toString());
                    }, 0);
                  }}
                >
                  Add New Company
                </Button>
              </Badge>
              {/* <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({})}
                >
                  Add New Company{" "}
                  <span style={{ fontSize: 12, color: "#555" }}>
                    <b>{fields.length}</b>
                  </span>
                </Button>

                <span style={{ fontSize: 12, color: "#555" }}>
                  Total Companies: <b>{fields.length}</b>
                </span>
              </div> */}
            </div>

            {/* COLLAPSE VIEW */}
            <Collapse
              accordion
              activeKey={activeKey}
              onChange={(key) =>
                setActiveKey(Array.isArray(key) ? (key[0] ?? "") : key)
              }
            >
              {fields.map((field, index) => (
                
                <Panel
                  key={index.toString()}
                  // header={`Previous Company #${index + 1}`}
                  header={<CompanyPanelHeader index={index} form={form} />}
                  extra={
                    index !== 0 && (
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
                  <CompanyFormBlock index={index} form={form} />
                </Panel>
              ))}

              {/* {fields.map((field, index) => {
                const companyName = Form.useWatch([index, "companyName"], form);

                return (
                  <Panel
                    key={index.toString()}
                    header={
                      companyName
                        ? companyName
                        : `Previous Company #${index + 1}`
                    }
                    extra={
                      index !== 0 && (
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
                    <CompanyFormBlock index={index} form={form} />
                  </Panel>
                );
              })} */}
            </Collapse>
          </>
        )}
      </Form.List>
    </Form>
  );
}
