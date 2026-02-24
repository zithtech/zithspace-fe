import { Form, Input, Select, DatePicker, Row, Col, Checkbox } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import dayjs from "dayjs";

const { Option } = Select;

const PersonalDetails = forwardRef(({ data }: any, ref: any) => {
  const [basicForm] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [emergencyInfoForm] = Form.useForm();
  const [identityForm] = Form.useForm();
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  const [formData, setFormData] = useState<any>({
    address: {
      current: {},
      permanent: {},
    },
  });

  /* =====================================================
    Repopulate all 4 form instances when `data` prop arrives.
    This fires when the user clicks "Previous" and comes back
    to this step — allData.personal is passed as `data` and
    we restore every field exactly as the user left it.
  ====================================================== */
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setFormData(data);

      // ── Basic form fields ──────────────────────────────
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

      // ── Address form fields ────────────────────────────
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

      // ── Emergency Info form fields ─────────────────────
      emergencyInfoForm.setFieldsValue({
        relationship: data.relationship,
        relationName: data.relationName,
        relationMobile: data.relationMobile,
      });

      // ── Identity form fields ───────────────────────────
      identityForm.setFieldsValue({
        aadhaar: data.aadhaar,
        pan: data.pan,
        passport: data.passport,
      });
    }
  }, [data]);

  /* =====================================================
    getData() — called by the parent (Onboarding) when the
    user clicks Continue / Previous / Submit.
    We read live values from all 4 form instances and merge
    them into one object so nothing is missed.
  ====================================================== */
  useImperativeHandle(ref, () => ({
    getData: () => {
      // Pull live values straight from every form instance
      const basicValues = basicForm.getFieldsValue();
      const addressValues = addressForm.getFieldsValue();
      const emergencyValues = emergencyInfoForm.getFieldsValue();
      const identityValues = identityForm.getFieldsValue();

      return {
        // Basic
        ...basicValues,
        dob: basicValues?.dob
          ? typeof basicValues.dob === "string"
            ? basicValues.dob
            : basicValues.dob.format("YYYY-MM-DD")
          : null,

        // Address (structured)
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

        // Emergency
        ...emergencyValues,

        // Identity
        ...identityValues,
      };
    },
  }));

  /* =====================================================
    "Same as current address" checkbox handler
  ====================================================== */
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

      // Update the UI
      addressForm.setFieldsValue(permanent);

      // Update local state so getData() also returns the copied values
      setFormData((prev: any) => ({
        ...prev,
        address: {
          ...prev.address,
          permanent,
        },
      }));
    }
  };

  const labelStyle = { fontSize: 11 };
  const inputStyle = { height: 25, fontSize: 11 };

  return (
    <div
      style={{
        padding: "10px",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
      }}
    >
      {/* ── COLUMN 1 : Basic Information ─────────────────── */}
      <div style={{ width: "30%", background: "white" }}>
        <Form
          form={basicForm}
          layout="vertical"
          requiredMark={false}
          size="small"
          /* 
            BUG FIX: Previously this did setFormData(allValues) which
            completely replaced formData (including the `address` key).
            Now we merge with spread so address is never wiped out.
          */
          onValuesChange={(_, allValues) =>
            setFormData((prev: any) => ({ ...prev, ...allValues }))
          }
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)",
            border: "1px solid rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
          >
            <HomeOutlined style={{ color: "#1677ff", marginRight: 6 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1677ff" }}>
              Basic Information
            </span>
          </div>

          {/* <Row gutter={[8, 4]}>
            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>First Name</span>}
                name="firstName"
                rules={[{ required: true, message: "Enter your name" }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="First Name"
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Last Name</span>}
                name="lastName"
                rules={[{ required: true, message: "Required" }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="Last Name"
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Gender</span>}
                name="gender"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <Select
                  placeholder="Select"
                  style={{ height: 25, fontSize: 12 }}
                >
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Date of Birth</span>}
                name="dob"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <DatePicker
                  style={{ width: "100%", height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Blood Group</span>}
                name="bloodGroup"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <Select
                  placeholder="Select"
                  style={{ height: 25, fontSize: 12 }}
                >
                  <Option value="A+">A+</Option>
                  <Option value="A-">A-</Option>
                  <Option value="B+">B+</Option>
                  <Option value="B-">B-</Option>
                  <Option value="AB+">AB+</Option>
                  <Option value="AB-">AB-</Option>
                  <Option value="O+">O+</Option>
                  <Option value="O-">O-</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Mobile Number</span>}
                name="mobile"
                rules={[
                  { required: true },
                  { pattern: /^[0-9]{10}$/, message: "Invalid" },
                ]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="Mobile"
                  maxLength={10}
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Personal Email</span>}
                name="personalEmail"
                rules={[{ required: true, type: "email" }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="Personal Email"
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Work Email</span>}
                name="workEmail"
                rules={[{ required: true, type: "email" }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="Work Email"
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>
          </Row> */}

          <Row gutter={[8, 4]}>
            {/* First Name - Full Width */}
            <Col span={24}>
              <Form.Item
                label={<span style={labelStyle}>First Name</span>}
                name="firstName"
                rules={[{ required: true, message: "Enter your name" }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="First Name"
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Last Name - Full Width */}
            <Col span={24}>
              <Form.Item
                label={<span style={labelStyle}>Last Name</span>}
                name="lastName"
                rules={[{ required: true, message: "Required" }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="Last Name"
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Gender - Full Width */}
            <Col span={24}>
              <Form.Item
                label={<span style={labelStyle}>Gender</span>}
                name="gender"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <Select
                  placeholder="Select"
                  style={{ height: 25, fontSize: 12 }}
                >
                  <Option value="male">Male</Option>
                  <Option value="female">Female</Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Date of Birth - Full Width */}
            <Col span={24}>
              <Form.Item
                label={<span style={labelStyle}>Date of Birth</span>}
                name="dob"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <DatePicker
                  style={{ width: "100%", height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Blood Group | Mobile Number */}
            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Blood Group</span>}
                name="bloodGroup"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <Select
                  placeholder="Select"
                  style={{ height: 25, fontSize: 12 }}
                >
                  <Option value="A+">A+</Option>
                  <Option value="A-">A-</Option>
                  <Option value="B+">B+</Option>
                  <Option value="B-">B-</Option>
                  <Option value="AB+">AB+</Option>
                  <Option value="AB-">AB-</Option>
                  <Option value="O+">O+</Option>
                  <Option value="O-">O-</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Mobile Number</span>}
                name="mobile"
                rules={[
                  { required: true },
                  { pattern: /^[0-9]{10}$/, message: "Invalid" },
                ]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="Mobile"
                  maxLength={10}
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Personal Email | Work Email */}
            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Personal Email</span>}
                name="personalEmail"
                rules={[{ required: true, type: "email" }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="Personal Email"
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={<span style={labelStyle}>Work Email</span>}
                name="workEmail"
                rules={[{ required: true, type: "email" }]}
                style={{ marginBottom: 6 }}
              >
                <Input
                  placeholder="Work Email"
                  style={{ height: 25, fontSize: 12 }}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* ── COLUMN 2 : Address Information ───────────────── */}
      <div style={{ width: "40%" }}>
        <Form
          form={addressForm}
          layout="vertical"
          size="small"
          requiredMark={false}
          onValuesChange={(_, allValues) => {
            setFormData((prev: any) => ({
              ...prev,
              address: {
                current: {
                  c_flat: allValues.c_flat,
                  c_area: allValues.c_area,
                  c_city: allValues.c_city,
                  c_state: allValues.c_state,
                  c_pincode: allValues.c_pincode,
                  c_country: allValues.c_country,
                },
                permanent: {
                  p_flat: allValues.p_flat,
                  p_area: allValues.p_area,
                  p_city: allValues.p_city,
                  p_state: allValues.p_state,
                  p_pincode: allValues.p_pincode,
                  p_country: allValues.p_country,
                },
              },
            }));
          }}
          style={{
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
            border: "1px solid rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
          >
            <HomeOutlined style={{ color: "#1677ff", marginRight: 6 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1677ff" }}>
              Address Information
            </span>
          </div>

          {/* CURRENT ADDRESS */}
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
            Current Address
          </div>
          <Row gutter={8}>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Flat / Door No</span>}
                name="c_flat"
                rules={[{ required: true }]}
              >
                <Input placeholder="Flat No" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Area</span>}
                name="c_area"
                rules={[{ required: true }]}
              >
                <Input placeholder="Area" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>City</span>}
                name="c_city"
                rules={[{ required: true }]}
              >
                <Input placeholder="City" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>State</span>}
                name="c_state"
                rules={[{ required: true }]}
              >
                <Input placeholder="State" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Pincode</span>}
                name="c_pincode"
                rules={[{ required: true }]}
              >
                <Input placeholder="Pincode" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Country</span>}
                name="c_country"
                rules={[{ required: true }]}
              >
                <Input placeholder="Country" style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>

          <Checkbox
            checked={sameAsCurrent}
            onChange={onSameAddressChange}
            style={{ fontSize: 11, marginBottom: 12 }}
          >
            Same as current
          </Checkbox>

          {/* PERMANENT ADDRESS */}
          <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
            Permanent Address
          </div>
          <Row gutter={8}>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Flat / Door No</span>}
                name="p_flat"
              >
                <Input placeholder="Flat No" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Area</span>}
                name="p_area"
              >
                <Input placeholder="Area" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>City</span>}
                name="p_city"
              >
                <Input placeholder="City" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>State</span>}
                name="p_state"
              >
                <Input placeholder="State" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Pincode</span>}
                name="p_pincode"
              >
                <Input placeholder="Pincode" style={inputStyle} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={<span style={labelStyle}>Country</span>}
                name="p_country"
              >
                <Input placeholder="Country" style={inputStyle} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>

      {/* ── COLUMN 3 : Emergency + Identity ──────────────── */}
      <div
        style={{
          width: "30%",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Emergency Information */}
        <Form
          layout="vertical"
          form={emergencyInfoForm}
          size="small"
          requiredMark={false}
          onValuesChange={(_, allValues) =>
            setFormData((prev: any) => ({ ...prev, ...allValues }))
          }
          style={{
            width: "90%",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
          >
            <HomeOutlined style={{ color: "#1677ff", marginRight: 6 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1677ff" }}>
              Emergency Information
            </span>
          </div>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>Relationship</span>}
            name="relationship"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Select
              placeholder="Select relationship"
              style={{ height: 25, fontSize: 11 }}
            >
              <Option value="father">Father</Option>
              <Option value="mother">Mother</Option>
              <Option value="spouse">Spouse</Option>
              <Option value="guardian">Guardian</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>Name</span>}
            name="relationName"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Input placeholder="Name" style={{ height: 25, fontSize: 11 }} />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>Mobile</span>}
            name="relationMobile"
            rules={[
              { required: true, message: "Required" },
              {
                pattern: /^[0-9]{10}$/,
                message: "Enter valid 10-digit number",
              },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="Mobile Number"
              maxLength={10}
              style={{ height: 25, fontSize: 11 }}
            />
          </Form.Item>
        </Form>

        {/* Identity Information */}
        <Form
          layout="vertical"
          size="small"
          form={identityForm}
          requiredMark={false}
          onValuesChange={(_, allValues) =>
            setFormData((prev: any) => ({ ...prev, ...allValues }))
          }
          style={{
            width: "90%",
            background: "#ffffff",
            padding: "13px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 12 }}
          >
            <HomeOutlined style={{ color: "#1677ff", marginRight: 6 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#1677ff" }}>
              Identity Information
            </span>
          </div>

          <Form.Item
            label={<span style={{ fontSize: 11 }}>Aadhaar Number</span>}
            name="aadhaar"
            rules={[
              { required: true, message: "Aadhaar is required" },
              {
                pattern: /^[0-9]{12}$/,
                message: "Enter valid 12-digit Aadhaar",
              },
            ]}
            style={{ marginBottom: 10 }}
          >
            <Input
              placeholder="Aadhaar Number"
              maxLength={12}
              style={{ height: 25, fontSize: 11 }}
            />
          </Form.Item>

          <div
            style={{
              display: "flex",
              //alignItems: "",
              flexDirection: "row",
              gap: "10px",
            }}
          >
            <Form.Item
              label={<span style={{ fontSize: 11 }}>PAN Number</span>}
              name="pan"
              rules={[
                { required: true, message: "PAN is required" },
                {
                  pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                  message: "Enter valid PAN (ABCDE1234F)",
                },
              ]}
              style={{ marginBottom: 10 }}
            >
              <Input
                placeholder="PAN Number"
                style={{ height: 25, fontSize: 11, textTransform: "uppercase" }}
              />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ fontSize: 11 }}>Passport Number (Optional)</span>
              }
              name="passport"
              rules={[
                {
                  required: true,
                  pattern: /^[A-Z]{1}[0-9]{7}$/,
                  message: "Enter valid Passport number",
                },
              ]}
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="Passport Number"
                style={{ height: 25, fontSize: 11, textTransform: "uppercase" }}
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
});

export default PersonalDetails;
