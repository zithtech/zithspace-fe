

"use client";
import { FC, useEffect } from "react";
import { Card, Form, Input, Row, Col, Upload, Button } from "antd";
import { BankOutlined, QrcodeOutlined, UploadOutlined } from "@ant-design/icons";
import { Draft } from "@/types/invoice";

interface BankPaymentSettingsProps {
  initialValues: Draft["payment"];
  onSave: (data: Draft["payment"]) => void;
}

const BankPaymentSettings: FC<BankPaymentSettingsProps> = ({ initialValues, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  const handleQRUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      form.setFieldValue("qrCode", base64);
      const values = form.getFieldsValue();
      onSave({ ...values, qrCode: base64 });
    };
    reader.readAsDataURL(file);
  };

  const qrCode = Form.useWatch("qrCode", form);

  return (
    <div className="bg-gray-50 p-4 md:p-6">
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onValuesChange={(_, values) => {
          onSave({
            ...initialValues,
            ...values,
            qrCode: form.getFieldValue("qrCode") ?? initialValues.qrCode,
          });
        }}
      >
        <Form.Item name="qrCode" hidden>
          <Input />
        </Form.Item>

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card
              title={<span className="flex items-center gap-2"><BankOutlined style={{ color: "#1890ff", fontSize: 18 }} />Bank Account Details</span>}
              className="rounded-xl shadow-sm h-full"
            >
              <Form.Item label="Bank Name" name="bankName" rules={[{ required: true }]}>
                <Input placeholder="xxxxx" />
              </Form.Item>

              <Form.Item label="Account Number" name="accountNumber" rules={[{ required: true }]}>
                <Input placeholder="XXXXXXXXXXXX" />
              </Form.Item>

              <Form.Item label="IFSC Code" name="ifscCode" rules={[{ required: true }]}>
                <Input placeholder="SBIN0001234" />
              </Form.Item>

              <Form.Item label="Branch Name" name="branchName" rules={[{ required: true }]}>
                <Input placeholder="Chennai Main Branch" />
              </Form.Item>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card
              title={<span className="flex items-center gap-2"><QrcodeOutlined style={{ color: "#1890ff", fontSize: 18 }} />Payment QR Code</span>}
              className="rounded-xl shadow-sm h-full"
            >
              <Upload
  maxCount={1}
  listType="picture"
  showUploadList={{
    showPreviewIcon: false,
    showRemoveIcon: true,
  }}
  // 1. Clear the form and state when the user deletes the image
  onRemove={() => {
    form.setFieldValue("qrCode", undefined);
    const values = form.getFieldsValue();
    onSave({ ...values, qrCode: undefined });
  }}
  beforeUpload={(file) => {
    handleQRUpload(file);
    return false; // Prevent auto-upload to server
  }}
>
  <Button icon={<UploadOutlined />}>Upload QR</Button>
</Upload>


              {qrCode && (
                <div className="mt-4 flex justify-center">
                  <img src={qrCode} alt="QR Code" className="w-44 rounded-xl border border-gray-200" />
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

