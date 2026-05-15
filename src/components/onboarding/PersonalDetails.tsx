import { Form, Input, Select, DatePicker, Row, Col, Checkbox, Card, Divider, Space } from "antd";
import { UserOutlined, EnvironmentOutlined, PhoneOutlined, IdcardOutlined } from "@ant-design/icons";
import { Users } from "lucide-react";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import dayjs from "dayjs";

const { Option } = Select;

const PersonalDetails = forwardRef(({ data }: any, ref: any) => {
  const [basicForm] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [emergencyInfoForm] = Form.useForm();
  const [identityForm] = Form.useForm();
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formData, setFormData] = useState<any>({
    address: {
      current: {},
      permanent: {},
    },
  });

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFormData(data);

      basicForm.setFieldsValue({
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dob: data.dob ? dayjs(data.dob) : null,
        bloodGroup: data.bloodGroup,
        mobile: data.mobile,
        personalEmail: data.personalEmail,
        workEmail: data.workEmail,
      });

      const cur = data.address?.current || {};
      const per = data.address?.permanent || {};
      addressForm.setFieldsValue({
        c_flat: cur.c_flat,
        c_area: cur.c_area,
        c_city: cur.c_city,
        c_state: cur.c_state,
        c_pincode: cur.c_pincode,
        c_country: cur.c_country,
        p_flat: per.p_flat,
        p_area: per.p_area,
        p_city: per.p_city,
        p_state: per.p_state,
        p_pincode: per.p_pincode,
        p_country: per.p_country,
      });

      emergencyInfoForm.setFieldsValue({
        relationship: data.relationship,
        relationName: data.relationName,
        relationMobile: data.relationMobile,
      });

      identityForm.setFieldsValue({
        aadhaar: data.aadhaar,
        pan: data.pan,
        passport: data.passport,
      });
    }
  }, [data, basicForm, addressForm, emergencyInfoForm, identityForm]);

  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        await Promise.all([
          basicForm.validateFields(),
          addressForm.validateFields(),
          emergencyInfoForm.validateFields(),
          identityForm.validateFields(),
        ]);
        return true;
      } catch (error) {
        console.error("Validation failed:", error);
        return false;
      }
    },
    getData: () => {
      const basicValues = basicForm.getFieldsValue();
      const addressValues = addressForm.getFieldsValue();
      const emergencyValues = emergencyInfoForm.getFieldsValue();
      const identityValues = identityForm.getFieldsValue();

      return {
        ...basicValues,
        dob: basicValues?.dob
          ? typeof basicValues.dob === "string"
            ? basicValues.dob
            : basicValues.dob.format("YYYY-MM-DD")
          : null,

        address: {
          current: {
            c_flat: addressValues.c_flat,
            c_area: addressValues.c_area,
            c_city: addressValues.c_city,
            c_state: addressValues.c_state,
            c_pincode: addressValues.c_pincode,
            c_country: addressValues.c_country,
          },
          permanent: {
            p_flat: addressValues.p_flat,
            p_area: addressValues.p_area,
            p_city: addressValues.p_city,
            p_state: addressValues.p_state,
            p_pincode: addressValues.p_pincode,
            p_country: addressValues.p_country,
          },
        },
        ...emergencyValues,
        ...identityValues,
      };
    },
  }));

  const onSameAddressChange = (e: any) => {
    const checked = e.target.checked;
    setSameAsCurrent(checked);

    if (checked) {
      const current = addressForm.getFieldsValue([
        "c_flat",
        "c_area",
        "c_city",
        "c_state",
        "c_pincode",
        "c_country",
      ]);

      const permanent = {
        p_flat: current.c_flat,
        p_area: current.c_area,
        p_city: current.c_city,
        p_state: current.c_state,
        p_pincode: current.c_pincode,
        p_country: current.c_country,
      };

      addressForm.setFieldsValue(permanent);
      setFormData((prev: any) => ({
        ...prev,
        address: {
          ...prev.address,
          permanent,
        },
      }));
    }
  };

  const labelStyle = { fontSize: 12, fontWeight: 500, color: "var(--text-slate-500)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "24px" }}>
      {/* Basic Information */}
      <Card
        title={<Space><UserOutlined style={{ color: "var(--premium-blue)" }} /> <span style={{ color: "var(--text-slate-900)" }}>Basic Information</span></Space>}
        bordered={false}
        style={{ background: "transparent", border: "none" }}
        styles={{ body: { padding: "24px 40px" } }}
      >
        <Form
          form={basicForm}
          layout="vertical"
          requiredMark={false}
          onValuesChange={(_, allValues) =>
            setFormData((prev: any) => ({ ...prev, ...allValues }))
          }
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>First Name</span>}
                name="firstName"
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }
                ]}
              >
                <Input
                  placeholder="First Name"
                  onKeyDown={(e) => {
                    if (e.key.length > 1) return;
                    if (!/^[A-Za-z\s-]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Last Name</span>}
                name="lastName"
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }
                ]}
              >
                <Input placeholder="Last Name" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Gender</span>}
                name="gender"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Gender">
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Date of Birth</span>}
                name="dob"
                rules={[{ required: true, message: "Required" }]}
              >
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Blood Group</span>}
                name="bloodGroup"
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Blood Group">
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                    <Option key={bg} value={bg}>{bg}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Mobile Number</span>}
                name="mobile"
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]{10}$/, message: "Invalid format (10 digits)" },
                ]}
              >
                <Input
                  placeholder="Mobile Number"
                  maxLength={10}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Personal Email</span>}
                name="personalEmail"
                rules={[{ required: true, type: "email", message: "Invalid email" }]}
              >
                <Input placeholder="Personal Email" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Work Email</span>}
                name="workEmail"
                rules={[{ required: true, type: "email", message: "Invalid email" }]}
              >
                <Input placeholder="Work Email" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Address Information */}
      <Card
        title={<Space><EnvironmentOutlined style={{ color: "var(--premium-blue)" }} /> <span style={{ color: "var(--text-slate-900)" }}>Address Information</span></Space>}
        bordered={false}
        style={{ background: "transparent", border: "none" }}
        styles={{ body: { padding: "24px 40px" } }}
      >
        <Form
          form={addressForm}
          layout="vertical"
          requiredMark={false}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--premium-blue)" }}>
            Current Address
          </div>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label={<span style={labelStyle}>Flat / Door No</span>} name="c_flat" rules={[{ required: true }]}>
                <Input placeholder="Flat No" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={labelStyle}>Area</span>} name="c_area" rules={[{ required: true }]}>
                <Input placeholder="Area" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>City</span>}
                name="c_city"
                rules={[
                  { required: true },
                  { pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }
                ]}
              >
                <Input placeholder="City" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>State</span>}
                name="c_state"
                rules={[
                  { required: true },
                  { pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }
                ]}
              >
                <Input placeholder="State" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Pincode</span>}
                name="c_pincode"
                rules={[
                  { required: true },
                  { pattern: /^[0-9]{6}$/, message: "Invalid pincode" }
                ]}
              >
                <Input
                  placeholder="Pincode"
                  maxLength={6}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Country</span>}
                name="c_country"
                rules={[
                  { required: true },
                  { pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }
                ]}
              >
                <Input placeholder="Country" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: "16px 0", borderColor: "var(--border-slate-100)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--premium-blue)" }}>
              Permanent Address
            </div>
            <Checkbox checked={sameAsCurrent} onChange={onSameAddressChange}>
              Same as current address
            </Checkbox>
          </div>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label={<span style={labelStyle}>Flat / Door No</span>} name="p_flat">
                <Input placeholder="Flat No" disabled={sameAsCurrent} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={<span style={labelStyle}>Area</span>} name="p_area">
                <Input placeholder="Area" disabled={sameAsCurrent} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>City</span>}
                name="p_city"
                rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}
              >
                <Input placeholder="City" disabled={sameAsCurrent} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>State</span>}
                name="p_state"
                rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}
              >
                <Input placeholder="State" disabled={sameAsCurrent} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Pincode</span>}
                name="p_pincode"
                rules={[{ pattern: /^[0-9]{6}$/, message: "Invalid pincode" }]}
              >
                <Input
                  placeholder="Pincode"
                  disabled={sameAsCurrent}
                  maxLength={6}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Country</span>}
                name="p_country"
                rules={[{ pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }]}
              >
                <Input placeholder="Country" disabled={sameAsCurrent} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row gutter={24}>
        <Col span={12}>
          {/* Relationship & Emergency Contact */}
          <Card
            title={<Space><Users size={18} style={{ color: "#ec4899" }} /> <span>Relationship & Emergency Contact</span></Space>}
            bordered={false}
            style={{ height: "100%", background: "transparent", border: "none" }}
            styles={{ body: { padding: "24px 40px" } }}
          >
            <Form form={emergencyInfoForm} layout="vertical" requiredMark={false}>
              <Form.Item label={<span style={labelStyle}>Relationship</span>} name="relationship" rules={[{ required: true }]}>
                <Select placeholder="Select Relationship">
                  <Option value="father">Father</Option>
                  <Option value="mother">Mother</Option>
                  <Option value="spouse">Spouse</Option>
                  <Option value="guardian">Guardian</Option>
                </Select>
              </Form.Item>
              <Form.Item
                label={<span style={labelStyle}>Name</span>}
                name="relationName"
                rules={[
                  { required: true },
                  { pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }
                ]}
              >
                <Input placeholder="Name" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
              <Form.Item
                label={<span style={labelStyle}>Mobile</span>}
                name="relationMobile"
                rules={[
                  { required: true },
                  { pattern: /^[0-9]{10}$/, message: "Invalid format (10 digits)" }
                ]}
              >
                <Input
                  placeholder="Mobile Number"
                  maxLength={10}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          {/* Identity Information */}
          <Card
            title={<Space><IdcardOutlined style={{ color: "var(--premium-blue)" }} /> <span style={{ color: "var(--text-slate-900)" }}>Identity Information</span></Space>}
            bordered={false}
            style={{ height: "100%", background: "transparent", border: "none" }}
            styles={{ body: { padding: "24px 40px" } }}
          >
            <Form form={identityForm} layout="vertical" requiredMark={false}>
              <Form.Item
                label={<span style={labelStyle}>Aadhaar Number</span>}
                name="aadhaar"
                rules={[
                  { required: true, len: 12, message: "Aadhaar must be 12 digits" },
                  { pattern: /^[0-9]{12}$/, message: "Only numeric values allowed" }
                ]}
              >
                <Input
                  placeholder="Aadhaar Number"
                  maxLength={12}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label={<span style={labelStyle}>PAN Number</span>} name="pan" rules={[{ required: true }]}>
                    <Input placeholder="PAN" style={{ textTransform: "uppercase" }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={<span style={labelStyle}>Passport (Optional)</span>} name="passport">
                    <Input placeholder="Passport" style={{ textTransform: "uppercase" }} />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
});

PersonalDetails.displayName = "PersonalDetails";

export default PersonalDetails;
