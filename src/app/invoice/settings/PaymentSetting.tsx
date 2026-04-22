

"use client";
import { FC, useEffect } from "react";
import { Card, Form, Input, Row, Col, Upload, Button } from "antd";
import { CreditCard, QrCode, UploadCloud, Building, Info, Landmark } from "lucide-react";
import { Draft } from "@/types/invoice";

interface BankPaymentSettingsProps {
  initialValues: Draft["payment"];
  onSave: (data: Draft["payment"]) => void;
}

const SectionTitle = ({ icon: Icon, title }: any) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-[var(--customers-header-icon-bg)] text-[var(--customers-header-icon-color)] rounded-lg">
      <Icon size={18} />
    </div>
    <h3 className="text-sm font-bold text-[var(--text-primary)] m-0 uppercase tracking-wider">{title}</h3>
  </div>
);

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
    <div className="bg-transparent">
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
        requiredMark={false}
      >
        <Form.Item name="qrCode" hidden>
          <Input />
        </Form.Item>

        <Row gutter={[32, 24]}>
          {/* BANK DETAILS */}
          <Col xs={24} lg={12}>
            <SectionTitle icon={Landmark} title="Bank Account" />
            
            <Form.Item label={<span className="text-[var(--text-secondary)] font-medium">Bank Name</span>} name="bankName">
              <Input size="large" placeholder="e.g. HDFC Bank" className="rounded-xl border-[var(--border-color)] bg-[var(--bg-secondary)]" />
            </Form.Item>

            <Form.Item 
              label={<span className="text-[var(--text-secondary)] font-medium">Account Number</span>} 
              name="accountNumber"
              rules={[
                { pattern: /^[0-9]{9,18}$/, message: "Invalid Account Number (9-18 digits)" }
              ]}
            >
              <Input 
                size="large" 
                placeholder="XXXXXXXXXXXX" 
                className="rounded-xl border-[var(--border-color)] bg-[var(--bg-secondary)] font-mono" 
                maxLength={18}
                onInput={(e: any) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, "");
                }}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  label={<span className="text-[var(--text-secondary)] font-medium">IFSC Code</span>} 
                  name="ifscCode"
                  rules={[
                    { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: "Invalid IFSC format (e.g. ABCD0123456)" }
                  ]}
                >
                  <Input 
                    size="large" 
                    placeholder="IFSC0001234" 
                    className="rounded-xl border-[var(--border-color)] bg-[var(--bg-secondary)] font-mono" 
                    maxLength={11}
                    onInput={(e: any) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={<span className="text-[var(--text-secondary)] font-medium">Branch</span>} name="branchName">
                  <Input size="large" placeholder="Branch location" className="rounded-xl border-[var(--border-color)] bg-[var(--bg-secondary)]" />
                </Form.Item>
              </Col>
            </Row>

            <div className="mt-6 p-3 bg-[var(--bg-slate-50)] rounded-2xl border border-[var(--border-color)] flex gap-3">
              <div className="text-[var(--customers-header-icon-color)] mt-1"><Info size={16} /></div>
              <p className="text-xs text-[var(--text-secondary)] opacity-80 leading-relaxed m-0 italic">
                These details will be printed on the invoice for bank transfer payments.
              </p>
            </div>
          </Col>

          {/* QR CODE */}
          <Col xs={24} lg={12}>
            <SectionTitle icon={QrCode} title="Payment QR" />
            
            <div className="p-6 bg-[var(--bg-slate-50)] rounded-3xl border border-dashed border-[var(--border-color)] flex flex-col items-center">
              {qrCode ? (
                <div className="relative group">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48 rounded-2xl border border-[var(--border-color)] shadow-lg pointer-events-none" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                    <Button 
                      danger 
                      type="text" 
                      className="bg-white hover:bg-red-50" 
                      onClick={() => {
                        form.setFieldValue("qrCode", undefined);
                        onSave({ ...form.getFieldsValue(), qrCode: undefined });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Upload
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleQRUpload(file);
                    return false;
                  }}
                  className="w-full"
                >
                  <div className="flex flex-col items-center py-4 px-8 cursor-pointer hover:bg-[var(--bg-slate-50)] opacity-80 transition-colors w-full rounded-2xl">
                    <div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-color)] flex items-center justify-center mb-4 text-[var(--text-secondary)]">
                      <UploadCloud size={32} />
                    </div>
                    <p className="font-bold text-[var(--text-primary)] m-0">Upload QR Image</p>
                    <p className="text-[var(--text-secondary)] opacity-60 text-xs mt-1">PNG, JPG or SVG up to 2MB</p>
                  </div>
                </Upload>
              )}
            </div>

            <div className="mt-6 p-3 bg-[var(--bg-blue-50)] rounded-2xl border border-[var(--border-blue-200)] flex gap-3">
              <div className="text-[var(--customers-header-icon-color)] mt-1"><QrCode size={16} /></div>
              <p className="text-xs text-[var(--text-blue-700)] font-medium leading-relaxed m-0">
                A QR code makes it easier for customers to pay via UPI or mobile apps instantly.
              </p>
            </div>
          </Col>
        </Row>
      </Form>
      <style dangerouslySetInnerHTML={{ __html: `
        .ant-form-item-label {
          padding-bottom: 4px !important;
        }
        .ant-form-item {
          margin-bottom: 16px !important;
        }
      `}} />
    </div>
  );
};

export default BankPaymentSettings;

