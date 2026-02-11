import { Form, Input, Row, Col, Select } from "antd";
import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  use,
} from "react";

const BankPayroll = forwardRef(({ data }: any, ref: any) => {
  const [bankdetailes, setBankDetailes] = useState({});

  const [bankform] = Form.useForm();
  const [payrollform] = Form.useForm();

  // useEffect(() => {
  //   console.log("Bank Details:", bankdetailes);
  // }, [bankdetailes]);

  const bankDetailes = bankform.getFieldsValue();
  const payrollDetails = payrollform.getFieldsValue();

  console.log("Bank Details Form Data: ", bankDetailes);
  console.log("Payroll Details Form Data: ", payrollDetails);

  useEffect(() => {
    if (data) {
      setBankDetailes(data);
    }
  }, [data]);

  useImperativeHandle(ref, () => ({
    getData: () => {
      return {
        ...bankform.getFieldsValue(),
        ...payrollform.getFieldsValue(),
      };
    },
  }));

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "white",
        display: "flex",
        flexDirection: "row",
        padding: "16px",
        boxSizing: "border-box",
        gap: "10px",
        justifyContent: "space-evenly",
      }}
    >
      {/* first div */}
      <div
        style={{
          width: "45%",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e5e7eb",
          padding: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#1677ff",
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          🏦 Bank Details
        </div>

        <Form
          form={bankform}
          layout="vertical"
          onValuesChange={(_, allValues) =>
            setBankDetailes((prev) => ({
              ...prev,
              ...allValues,
            }))
          }
        >
          <Row gutter={[10, 6]}>
            {/* Bank Name */}

            <Col span={12}>
              <Form.Item
                name="bankName"
                label={<span style={{ fontSize: "12px" }}>Bank Name</span>}
              >
                <Input
                  placeholder="Enter Bank Name"
                  style={{ height: "37px", fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Account Holder Name */}
            <Col span={12}>
              <Form.Item
                name="accountHolderName"
                label={
                  <span style={{ fontSize: "12px" }}>Account Holder Name</span>
                }
              >
                <Input
                  placeholder="Account Holder Name"
                  style={{ height: "37px", fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Account Number */}
            <Col span={12}>
              <Form.Item
                name="accountNumber"
                label={
                  <span style={{ fontSize: "12px" }}>
                    Account Number <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Input
                  placeholder="Account Number"
                  style={{ height: "37px", fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* IFSC Code */}
            <Col span={12}>
              <Form.Item
                name="ifscCode"
                label={
                  <span style={{ fontSize: "12px" }}>
                    IFSC Code <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Input
                  placeholder="IFSC Code"
                  style={{ height: "37px", fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Branch Name */}
            <Col span={12}>
              <Form.Item
                name="branchName"
                label={
                  <span style={{ fontSize: "12px" }}>
                    Branch Name <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Input
                  placeholder="Branch Name"
                  style={{ height: "37px", fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Account Type */}
            <Col span={12}>
              <Form.Item
                name="accountType"
                label={
                  <span style={{ fontSize: "12px" }}>
                    Account Type <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Select
                  placeholder="Select Type"
                  style={{ height: "37px", fontSize: 12 }}
                >
                  <Select.Option value="savings">Savings</Select.Option>
                  <Select.Option value="current">Current</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
      {/* second div */}
      <div
        style={{
          width: "45%",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e5e7eb",
          padding: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "#1677ff",
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          💰 Payroll Identifiers
        </div>

        <Form
          form={payrollform}
          onValuesChange={(_, allValues) =>
            setBankDetailes((pre) => ({
              ...pre,
              ...allValues,
            }))
          }
          layout="vertical"
        >
          <Row gutter={[16, 12]}>
            {/* UAN Number */}
            <Col span={12}>
              <Form.Item
                name="uanNumber"
                label={
                  <span style={{ fontSize: "12px" }}>
                    UAN Number <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Input
                  placeholder="UAN Number"
                  style={{ height: "37px", fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* PF Number */}
            <Col span={12}>
              <Form.Item
                name="pfNumber"
                label={
                  <span style={{ fontSize: "12px" }}>
                    PF Number <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Input
                  placeholder="PF Number"
                  style={{ height: "37px", fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* ESI Number */}
            <Col span={12}>
              <Form.Item
                name="esiNumber"
                label={
                  <span style={{ fontSize: "12px" }}>
                    ESI Number <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Input
                  placeholder="ESI Number"
                  style={{ height: "37px", fontSize: 12 }}
                />
              </Form.Item>
            </Col>

            {/* Tax Regime */}
            <Col span={12}>
              <Form.Item
                name="taxRegime"
                label={
                  <span style={{ fontSize: "12px" }}>
                    Tax Regime <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Select
                  placeholder="Select Regime"
                  style={{ height: "37px", fontSize: 12 }}
                >
                  <Select.Option value="Old">Old Regime</Select.Option>
                  <Select.Option value="new">New Regime</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {/* Payment Type (Full Width Row Look) */}
            <Col span={12}>
              <Form.Item
                name="paymentType"
                label={
                  <span style={{ fontSize: "12px" }}>
                    Payment Type <span style={{ color: "red" }}>*</span>
                  </span>
                }
              >
                <Select
                  placeholder="Select Type"
                  style={{ height: "37px", fontSize: 12 }}
                >
                  <Select.Option value="bank">Bank Transfer</Select.Option>
                  <Select.Option value="cash">Cash</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
});
export default BankPayroll;
