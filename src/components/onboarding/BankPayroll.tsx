import { Form, Input, Row, Col, Select, Card } from "antd";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";

const BankPayroll = forwardRef(({ data }: any, ref: any) => {
  const [bankdetailes, setBankDetailes] = useState({});

  const [bankform] = Form.useForm();
  const [payrollform] = Form.useForm();

  /* =====================================================
    Repopulate both forms when `data` prop arrives.
    This fires when the user clicks "Previous" and comes back
    to this step — allData.bank is passed as `data`.

    BUG FIX: The original code had NO useEffect to restore
    form values, so going back always showed empty fields.
  ====================================================== */
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setBankDetailes(data);

      // Bank Details fields
      bankform.setFieldsValue({
        bankName: data.bankName,
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        branchName: data.branchName,
        accountType: data.accountType,
      });

      // Payroll Identifier fields
      payrollform.setFieldsValue({
        uanNumber: data.uanNumber,
        pfNumber: data.pfNumber,
        esiNumber: data.esiNumber,
        taxRegime: data.taxRegime,
        paymentType: data.paymentType,
      });
    }
  }, [data]);

  /* =====================================================
    getData() — reads live values from both form instances
    and merges them into one flat object (same payload
    format as before).
  ====================================================== */
  useImperativeHandle(ref, () => ({
    validate: async () => {
      try {
        await Promise.all([
          bankform.validateFields(),
          payrollform.validateFields(),
        ]);
        return true;
      } catch (error) {
        console.error("Validation failed:", error);
        return false;
      }
    },
    getData: () => {
      return {
        ...bankform.getFieldsValue(),
        ...payrollform.getFieldsValue(),
      };
    },
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%", padding: "24px", background: "transparent" }}>
      {/* Bank Details */}
      <Card
        title={<span style={{ fontWeight: 600, color: "var(--premium-blue)" }}>🏦 Bank Details</span>}
        bordered={false}
        style={{ background: "transparent", border: "none" }}
        styles={{ body: { padding: "24px 40px" } }}
      >
        <Form
          form={bankform}
          layout="vertical"
          onValuesChange={(_, allValues) =>
            setBankDetailes((prev) => ({ ...prev, ...allValues }))
          }
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="bankName"
                label={<span style={{ fontWeight: 500 }}>Bank Name</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="Enter Bank Name" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="accountHolderName"
                label={<span style={{ fontWeight: 500 }}>Account Holder Name</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="Account Holder Name" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="accountNumber"
                label={<span style={{ fontWeight: 500 }}>Account Number</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]+$/, message: "Only numeric values allowed" }
                ]}
              >
                <Input
                  placeholder="Account Number"
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
                name="ifscCode"
                label={<span style={{ fontWeight: 500 }}>IFSC Code</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="IFSC Code" />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="branchName"
                label={<span style={{ fontWeight: 500 }}>Branch Name</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="Branch Name" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="accountType"
                label={<span style={{ fontWeight: 500, color: "var(--text-slate-500)" }}>Account Type</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Type">
                  <Select.Option value="savings">Savings</Select.Option>
                  <Select.Option value="current">Current</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Payroll Identifiers */}
      <Card
        title={<span style={{ fontWeight: 600, color: "var(--premium-blue)" }}>💰 Payroll Identifiers</span>}
        bordered={false}
        style={{ background: "transparent", border: "none" }}
        styles={{ body: { padding: "24px 40px" } }}
      >
        <Form
          form={payrollform}
          onValuesChange={(_, allValues) =>
            setBankDetailes((prev) => ({ ...prev, ...allValues }))
          }
          layout="vertical"
        >
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="uanNumber"
                label={<span style={{ fontWeight: 500 }}>UAN Number</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]+$/, message: "Only numeric values allowed" }
                ]}
              >
                <Input
                  placeholder="UAN Number"
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
                name="pfNumber"
                label={<span style={{ fontWeight: 500 }}>PF Number</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]+$/, message: "Only numeric values allowed" }
                ]}
              >
                <Input
                  placeholder="PF Number"
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
                name="esiNumber"
                label={<span style={{ fontWeight: 500 }}>ESI Number</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]+$/, message: "Only numeric values allowed" }
                ]}
              >
                <Input
                  placeholder="ESI Number"
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
                name="taxRegime"
                label={<span style={{ fontWeight: 500 }}>Tax Regime</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Regime">
                  <Select.Option value="Old">Old Regime</Select.Option>
                  <Select.Option value="new">New Regime</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col span={8}>
              <Form.Item
                name="paymentType"
                label={<span style={{ fontWeight: 500, color: "var(--text-slate-500)" }}>Payment Type</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <Select placeholder="Select Type">
                  <Select.Option value="bank">Bank Transfer</Select.Option>
                  <Select.Option value="cash">Cash</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
});

export default BankPayroll;
