import { Form, Input, Row, Col, Select, Card } from "antd";
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

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
      <div style={{ background: "transparent", border: "1px solid var(--border-slate-100)", borderRadius: "0px" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-slate-100)", fontSize: "16px", fontWeight: 600 }}>
          <span style={{ fontWeight: 600, color: "var(--premium-blue)" }}>🏦 Bank Details</span>
        </div>
        <div style={{ padding: "24px 40px" }}>
        <Form
          form={bankform}
          layout="vertical"
          onValuesChange={(_, allValues) =>
            setBankDetailes((prev) => ({ ...prev, ...allValues }))
          }
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="bankName"
                label={<span style={{ fontWeight: 500 }}>Bank Name</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }
                ]}
              >
                <Input placeholder="Enter Bank Name" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="accountHolderName"
                label={<span style={{ fontWeight: 500 }}>Account Holder Name</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[A-Za-z\s-]+$/, message: "Only letters allowed" }
                ]}
              >
                <Input placeholder="Account Holder Name" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="accountNumber"
                label={<span style={{ fontWeight: 500 }}>Account Number</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]{9,18}$/, message: "Account number must be 9-18 digits" }
                ]}
              >
                <Input
                  placeholder="Account Number"
                  maxLength={18}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="ifscCode"
                label={<span style={{ fontWeight: 500 }}>IFSC Code</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid IFSC Code format" }
                ]}
              >
                <Input placeholder="IFSC Code" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="branchName"
                label={<span style={{ fontWeight: 500 }}>Branch Name</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[A-Za-z0-9\s.,/-]+$/, message: "No special characters allowed" }
                ]}
              >
                <Input placeholder="Branch Name" onKeyDown={(e) => {
                  if (e.key.length > 1) return;
                  if (!/^[A-Za-z\s-]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="accountType"
                label={<span style={{ fontWeight: 500, color: "var(--text-slate-500)" }}>Account Type</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <SearchableDropdown
                  style={{ height: '40px', minHeight: '40px' }}
                  placeholder="Select Type"
                  options={[
                    { label: "Savings", value: "savings" },
                    { label: "Current", value: "current" }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        </div>
      </div>

      {/* Payroll Identifiers */}
      <div style={{ background: "transparent", border: "1px solid var(--border-slate-100)", borderRadius: "0px" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border-slate-100)", fontSize: "16px", fontWeight: 600 }}>
          <span style={{ fontWeight: 600, color: "var(--premium-blue)" }}>💰 Payroll Identifiers</span>
        </div>
        <div style={{ padding: "24px 40px" }}>
        <Form
          form={payrollform}
          onValuesChange={(_, allValues) =>
            setBankDetailes((prev) => ({ ...prev, ...allValues }))
          }
          layout="vertical"
        >
          <Row gutter={24}>
            <Col xs={24} md={8}>
              <Form.Item
                name="uanNumber"
                label={<span style={{ fontWeight: 500 }}>UAN Number</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]{12}$/, message: "UAN must be 12 digits" }
                ]}
              >
                <Input
                  placeholder="UAN Number"
                  maxLength={12}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="pfNumber"
                label={<span style={{ fontWeight: 500 }}>PF Number</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[A-Za-z]{5}[0-9]{17}$/, message: "Invalid PF format (e.g. MHBAN00000640000000123)" }
                ]}
              >
                <Input
                  placeholder="PF Number"
                  maxLength={22}
                  style={{ textTransform: "uppercase" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="esiNumber"
                label={<span style={{ fontWeight: 500 }}>ESI Number</span>}
                rules={[
                  { required: true, message: "Required" },
                  { pattern: /^[0-9]{17}$/, message: "ESI must be 17 digits" }
                ]}
              >
                <Input
                  placeholder="ESI Number"
                  maxLength={17}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key) && e.key.length === 1) {
                      e.preventDefault();
                    }
                  }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="taxRegime"
                label={<span style={{ fontWeight: 500 }}>Tax Regime</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <SearchableDropdown
                  style={{ height: '40px', minHeight: '40px' }}
                  placeholder="Select Regime"
                  options={[
                    { label: "Old Regime", value: "Old" },
                    { label: "New Regime", value: "new" }
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="paymentType"
                label={<span style={{ fontWeight: 500, color: "var(--text-slate-500)" }}>Payment Type</span>}
                rules={[{ required: true, message: "Required" }]}
              >
                <SearchableDropdown
                  style={{ height: '40px', minHeight: '40px' }}
                  placeholder="Select Type"
                  options={[
                    { label: "Bank Transfer", value: "bank" },
                    { label: "Cash", value: "cash" }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
        </div>
      </div>
    </div>
  );
});

export default BankPayroll;
