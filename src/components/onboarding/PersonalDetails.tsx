import { Form, Input, Select, DatePicker, Row, Col, Checkbox } from "antd";
import { UserOutlined, HomeOutlined } from "@ant-design/icons";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
const { Option } = Select;

const PersonalDetails = forwardRef(({ data }: any, ref: any) => {
  const [basicForm] = Form.useForm();
  const [addressForm] = Form.useForm();
  const [emergencyInfoForm] = Form.useForm();
  const [identityForm] = Form.useForm();
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  // all information
  const [formData, setFormData] = useState<any>({
    address: {
      current: {},
      permanent: {},
    },
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  // useImperativeHandle(ref, () => ({
  //   getData: () => {
  //     console.log("formData1", formData);
  //     return formData;
  //   },
  // }));
  useImperativeHandle(ref, () => ({
    getData: () => {
      return {
        ...formData,
        dob: formData?.dob ? formData.dob.format("YYYY-MM-DD") : null,
      };
    },
  }));

  const onSameAddressChange = (e: any) => {
    const checked = e.target.checked;
    setSameAsCurrent(checked);
    console.log("Checked:", checked);
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

      // ✅ UI update
      addressForm.setFieldsValue(permanent);

      // ✅ STATE update (IMPORTANT 🔥)
      setFormData((prev: any) => ({
        ...prev,
        address: {
          ...prev.address,
          permanent: {
            ...permanent,
          },
        },
      }));
    }
  };
  const labelStyle = { fontSize: 11 };
  const inputStyle = { height: 25, fontSize: 11 };

  console.log("formData", formData);

  return (
    <div
      style={{
        padding: "10px",
        display: "flex",
        flexDirection: "row",
        gap: "10px",
      }}
    >
      {/* first div */}
      <div style={{ width: "30%", background: "white" }}>
        <Form
          form={basicForm}
          layout="vertical"
          requiredMark={false}
          size="small"
          onValuesChange={(_, allValues) => setFormData(allValues)} // ✅ store in state
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.06)", // soft elevation
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
          <Row gutter={[8, 4]}>
            <Col span={12}>
              <Form.Item
                label={
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    First Name
                  </span>
                }
                name="firstName"
                rules={[{ required: true, message: "Enter your name " }]}
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
                label={
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    Last Name
                  </span>
                }
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
                label={
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    Gender
                  </span>
                }
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
                label={
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    Date of Birth
                  </span>
                }
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
                label={
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    Blood Group
                  </span>
                }
                name="bloodGroup"
                rules={[{ required: true }]}
                style={{ marginBottom: 6 }}
              >
                <Select
                  placeholder="Select"
                  style={{ height: 25, fontSize: 12 }}
                >
                  <Option value="A+">A+</Option>
                  <Option value="B+">B+</Option>
                  <Option value="O+">O+</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label={
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    Mobile
                  </span>
                }
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
                label={
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    Personal Email
                  </span>
                }
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
                label={
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>
                    Work Email
                  </span>
                }
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
      {/* second div */}
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
          }} // ✅ store in state
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

          {/* CHECKBOX */}
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
      {/* third div */}
      <div
        style={{
          width: "30%",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <Form
          layout="vertical"
          form={emergencyInfoForm}
          size="small"
          requiredMark={false}
          onValuesChange={(_, allValues) =>
            setFormData((pre: any) => {
              return { ...pre, ...allValues };
            })
          } // ✅ store in statee
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
          {/* Relationship */}
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

          {/* Name */}
          <Form.Item
            label={<span style={{ fontSize: 11 }}>Name</span>}
            name="relationName"
            rules={[{ required: true, message: "Required" }]}
            style={{ marginBottom: 10 }}
          >
            <Input placeholder="Name" style={{ height: 25, fontSize: 11 }} />
          </Form.Item>

          {/* Mobile */}
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

        <Form
          layout="vertical"
          size="small"
          form={identityForm}
          requiredMark={false}
          onValuesChange={(_, allValues) =>
            setFormData((pre: any) => {
              return { ...pre, ...allValues };
            })
          } // ✅ store in state
          style={{
            width: "90%",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "12px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          {/* Aadhaar Number */}
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

          {/* PAN Number */}
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

          {/* Passport (Optional) */}
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
        </Form>
      </div>
    </div>
  );
});
export default PersonalDetails;
