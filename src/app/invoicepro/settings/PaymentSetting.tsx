"use client";

import { FC, useEffect } from "react";
import { Card, Form, Input, Upload, Row, Col, Button } from "antd";
import {
  BankOutlined,
  QrcodeOutlined,
  UploadOutlined,
} from "@ant-design/icons";

export interface BankPaymentDraft {
  account_name: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  qr_code?: string | null; // base64
}

interface BankPaymentSettingsProps {
  initialValues: BankPaymentDraft;
  onSave: (data: BankPaymentDraft) => void;
}

const BankPaymentSettings: FC<BankPaymentSettingsProps> = ({
  initialValues,
  onSave,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  /** 🔥 Convert QR to Base64, store in form + parent */
  const handleQRUpload = (file: File) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64 = reader.result as string;

      // Update form (for preview)
      form.setFieldValue("qr_code", base64);

      // Update parent draft
      const values = form.getFieldsValue();
      onSave({
        ...values,
        qr_code: base64,
      });
    };

    reader.readAsDataURL(file);
  };

  // Watch QR for live preview
  const qrCode = Form.useWatch("qr_code", form);

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={(_, values) => {
          onSave({
            ...initialValues, // KEEP old fields
            ...values, // MERGE new fields
            qr_code: form.getFieldValue("qr_code") ?? initialValues.qr_code, // Keep QR intact
          });
        }}
      >
        {/* Hidden field to store QR */}
        <Form.Item name="qr_code" hidden>
          <Input />
        </Form.Item>

        <Row gutter={[24, 24]}>
          {/* BANK DETAILS */}
          <Col xs={24} md={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <BankOutlined style={{ color: "#1890ff", fontSize: 18 }} />
                  Bank Account Details
                </span>
              }
              className="rounded-xl shadow-sm h-full"
            >
              <Form.Item
                label="Account Holder Name"
                name="account_name"
                rules={[{ required: true }]}
              >
                <Input placeholder="John Doe" />
              </Form.Item>

              <Form.Item
                label="Account Number"
                name="account_number"
                rules={[{ required: true }]}
              >
                <Input placeholder="XXXXXXXXXXXX" />
              </Form.Item>

              <Form.Item
                label="IFSC Code"
                name="ifsc_code"
                rules={[{ required: true }]}
              >
                <Input placeholder="SBIN0001234" />
              </Form.Item>

              <Form.Item
                label="Branch Name"
                name="branch_name"
                rules={[{ required: true }]}
              >
                <Input placeholder="Chennai Main Branch" />
              </Form.Item>
            </Card>
          </Col>

          {/* QR CODE */}
          <Col xs={24} md={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <QrcodeOutlined style={{ color: "#1890ff", fontSize: 18 }} />
                  Payment QR Code
                </span>
              }
              className="rounded-xl shadow-sm h-full"
            >
              <Upload
                maxCount={1}
                listType="picture"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleQRUpload(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload QR</Button>
              </Upload>

              {/* LIVE PREVIEW */}
              {qrCode && (
                <div className="mt-4 flex justify-center">
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="w-44 rounded-xl border border-gray-200"
                  />
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default BankPaymentSettings;
