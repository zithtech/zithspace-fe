"use client";
import { FC, useEffect, useRef, useState } from "react";
import { Form, Input, Upload, Select, message } from "antd";
import {
  Building2,
  MapPin,
  Globe,
  Palette,
  Image as ImageIcon,
  PenTool,
  IdCard,
} from "lucide-react";
import type { UploadFile, UploadProps } from "antd";
import { currencyOptions } from "@/utils/currencyOptions";
import { GeneralDraft, DateFormat } from "@/types/invoice";

const { Option } = Select;

interface GeneralSettingsProps {
  initialValues: GeneralDraft;
  onSave: (data: GeneralDraft) => void;
  formRef?: any;
}

const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle?: string;
}) => (
  <div
    className="px-5 py-3 flex items-center gap-2.5 border-b"
    style={{ borderColor: "var(--border-color)" }}
  >
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{
        background: "var(--bg-blue-50)",
        color: "var(--text-blue-700)",
        border: "1px solid var(--border-blue-200)",
      }}
    >
      <Icon size={13} strokeWidth={2.25} />
    </div>
    <span
      className="text-[13px] font-semibold"
      style={{ color: "var(--text-primary)" }}
    >
      {title}
    </span>
    {subtitle && (
      <>
        <span
          className="h-3.5 w-px"
          style={{ background: "var(--border-color)" }}
        />
        <span
          className="text-[11px] uppercase tracking-[0.08em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {subtitle}
        </span>
      </>
    )}
  </div>
);

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <span
    className="text-[11px] font-semibold uppercase tracking-[0.08em]"
    style={{ color: "var(--text-secondary)" }}
  >
    {children}
    {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
  </span>
);

const inputBase: React.CSSProperties = {
  height: 38,
  borderRadius: 8,
  background: "var(--bg-secondary)",
  borderColor: "var(--border-color)",
  color: "var(--text-primary)",
};

const monoInput: React.CSSProperties = {
  ...inputBase,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 13,
};

const Card = ({ children }: { children: React.ReactNode }) => (
  <div
    className="rounded-2xl overflow-hidden"
    style={{
      background: "var(--bg-secondary)",
      border: "1px solid var(--border-color)",
    }}
  >
    {children}
  </div>
);

const GeneralSettings: FC<GeneralSettingsProps> = ({
  initialValues,
  onSave,
  formRef,
}) => {
  const [form] = Form.useForm();
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [signatureFileList, setSignatureFileList] = useState<UploadFile[]>([]);

  const prevLogoRef = useRef<string | null>(null);
  const prevSignatureRef = useRef<string | null>(null);

  const primaryColor = Form.useWatch("primaryColor", form);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  useEffect(() => {
    if (formRef) {
      formRef.current = form;
    }
  }, [formRef, form]);

  useEffect(() => {
    const companyLogo = initialValues.companyLogo ?? null;
    if (prevLogoRef.current !== companyLogo) {
      setLogoFileList(
        companyLogo
          ? [{ uid: "-1", name: "company-logo", status: "done", url: companyLogo }]
          : []
      );
      prevLogoRef.current = companyLogo;
    }
  }, [initialValues.companyLogo]);

  useEffect(() => {
    const signature = initialValues.signature ?? null;
    if (prevSignatureRef.current !== signature) {
      setSignatureFileList(
        signature
          ? [{ uid: "-2", name: "signature", status: "done", url: signature }]
          : []
      );
      prevSignatureRef.current = signature;
    }
  }, [initialValues.signature]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) message.error("Only image files allowed");
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) message.error("Image must be smaller than 2MB");
    return isImage && isLt2M;
  };

  const handleValuesChange = () => {
    onSave({
      ...form.getFieldsValue(),
      companyLogo: logoFileList[0]?.url ?? null,
      signature: signatureFileList[0]?.url ?? null,
    });
  };

  const handleLogoChange: UploadProps["onChange"] = async ({ fileList }) => {
    setLogoFileList(fileList);
    let base64 = fileList[0]?.url || null;
    if (fileList[0]?.originFileObj) {
      base64 = await fileToBase64(fileList[0].originFileObj as File);
    }
    onSave({
      ...form.getFieldsValue(),
      companyLogo: base64 ?? null,
      signature: signatureFileList[0]?.url ?? null,
    });
  };

  const handleSignatureChange: UploadProps["onChange"] = async ({ fileList }) => {
    setSignatureFileList(fileList);
    let base64 = fileList[0]?.url || null;
    if (fileList[0]?.originFileObj) {
      base64 = await fileToBase64(fileList[0].originFileObj as File);
    }
    onSave({
      ...form.getFieldsValue(),
      companyLogo: logoFileList[0]?.url ?? null,
      signature: base64 ?? null,
    });
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      initialValues={initialValues}
      requiredMark={false}
      className="flex flex-col gap-5"
    >
      {/* COMPANY */}
      <Card>
        <SectionHeader
          icon={Building2}
          title="Company"
          subtitle="Identify the entity"
        />
        <div className="px-5 py-5">
          <Form.Item
            name="companyName"
            label={<FieldLabel required>Company name</FieldLabel>}
            rules={[{ required: true, message: "Company name is required" }]}
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="Enter company name" style={inputBase} />
          </Form.Item>
        </div>
      </Card>

      {/* ADDRESS */}
      <Card>
        <SectionHeader
          icon={MapPin}
          title="Business address"
          subtitle="Where the business is located"
        />
        <div className="px-5 py-5 grid grid-cols-12 gap-4">
          <Form.Item
            className="col-span-4"
            name={["address", "plot_no"]}
            label={<FieldLabel>Plot no</FieldLabel>}
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="Plot #" style={inputBase} />
          </Form.Item>
          <Form.Item
            className="col-span-4"
            name={["address", "floor_no"]}
            label={<FieldLabel>Floor</FieldLabel>}
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="Floor #" style={inputBase} />
          </Form.Item>
          <Form.Item
            className="col-span-4"
            name={["address", "building_name"]}
            label={<FieldLabel>Building</FieldLabel>}
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="Building name" style={inputBase} />
          </Form.Item>
          <Form.Item
            className="col-span-12"
            name={["address", "street"]}
            label={<FieldLabel>Street / area</FieldLabel>}
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="Street name and locality" style={inputBase} />
          </Form.Item>
          <Form.Item
            className="col-span-6"
            name={["address", "city"]}
            label={<FieldLabel>City</FieldLabel>}
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="City" style={inputBase} />
          </Form.Item>
          <Form.Item
            className="col-span-6"
            name={["address", "pincode"]}
            label={<FieldLabel>Pincode</FieldLabel>}
            rules={[{ pattern: /^[0-9]{6}$/, message: "Must be 6 digits" }]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="######"
              style={monoInput}
              maxLength={6}
              onInput={(e: any) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "");
              }}
            />
          </Form.Item>
          <Form.Item
            className="col-span-12"
            name={["address", "country"]}
            label={<FieldLabel>Country</FieldLabel>}
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="Enter country" style={inputBase} />
          </Form.Item>
        </div>
      </Card>

      {/* BRANDING */}
      <Card>
        <SectionHeader
          icon={Palette}
          title="Branding"
          subtitle="Logo, signature & accent color"
        />
        <div className="px-5 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            {/* Logo upload */}
            <div>
              <div className="mb-2">
                <FieldLabel>Company logo</FieldLabel>
              </div>
              <div
                className="rounded-xl p-4 flex items-center justify-center"
                style={{
                  background: "var(--bg-slate-50)",
                  border: "1px dashed var(--border-color)",
                  minHeight: 120,
                }}
              >
                <Upload
                  listType="picture-card"
                  fileList={logoFileList}
                  beforeUpload={beforeUpload}
                  onChange={handleLogoChange}
                  maxCount={1}
                  className="premium-uploader"
                >
                  {logoFileList.length === 0 && (
                    <div
                      className="flex flex-col items-center gap-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <ImageIcon size={18} />
                      <span className="text-[10.5px] font-semibold">Upload</span>
                    </div>
                  )}
                </Upload>
              </div>
              <div
                className="text-[11px] mt-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                PNG, JPG or SVG · up to 2MB
              </div>
            </div>

            {/* Signature upload */}
            <div>
              <div className="mb-2">
                <FieldLabel>Authorized signature</FieldLabel>
              </div>
              <div
                className="rounded-xl p-4 flex items-center justify-center"
                style={{
                  background: "var(--bg-slate-50)",
                  border: "1px dashed var(--border-color)",
                  minHeight: 120,
                }}
              >
                <Upload
                  listType="picture-card"
                  fileList={signatureFileList}
                  beforeUpload={beforeUpload}
                  onChange={handleSignatureChange}
                  maxCount={1}
                  className="premium-uploader"
                >
                  {signatureFileList.length === 0 && (
                    <div
                      className="flex flex-col items-center gap-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <PenTool size={18} />
                      <span className="text-[10.5px] font-semibold">Sign</span>
                    </div>
                  )}
                </Upload>
              </div>
              <div
                className="text-[11px] mt-1.5"
                style={{ color: "var(--text-secondary)" }}
              >
                Transparent PNG works best
              </div>
            </div>
          </div>

          {/* Brand color */}
          <Form.Item
            label={<FieldLabel>Brand primary color</FieldLabel>}
            style={{ marginBottom: 0 }}
          >
            <div className="flex items-center gap-2">
              <Form.Item name="primaryColor" noStyle>
                <Input
                  type="color"
                  style={{
                    width: 44,
                    height: 38,
                    padding: 2,
                    borderRadius: 8,
                    borderColor: "var(--border-color)",
                    cursor: "pointer",
                  }}
                />
              </Form.Item>
              <Input
                value={primaryColor}
                readOnly
                style={{
                  ...monoInput,
                  flex: 1,
                  textTransform: "uppercase",
                }}
              />
            </div>
          </Form.Item>
        </div>
      </Card>

      {/* REGIONAL */}
      <Card>
        <SectionHeader
          icon={Globe}
          title="Regional"
          subtitle="Currency & date format"
        />
        <div className="px-5 py-5 grid grid-cols-2 gap-4">
          <Form.Item
            name="currency"
            label={<FieldLabel required>Currency</FieldLabel>}
            rules={[{ required: true }]}
            style={{ marginBottom: 0 }}
          >
            <Select className="custom-select-template" style={{ height: 38 }}>
              {currencyOptions.map((c) => (
                <Option key={c.value} value={c.value}>
                  <span className="flex items-center gap-2">
                    <span
                      className="font-bold"
                      style={{ color: "var(--text-blue-700)" }}
                    >
                      {c.symbol}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {c.label}
                    </span>
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="dateFormat"
            label={<FieldLabel required>Date format</FieldLabel>}
            rules={[{ required: true }]}
            style={{ marginBottom: 0 }}
          >
            <Select className="custom-select-template" style={{ height: 38 }}>
              <Option value={DateFormat.MM_DD_YYYY}>MM/DD/YYYY</Option>
              <Option value={DateFormat.DD_MM_YYYY}>DD/MM/YYYY</Option>
              <Option value={DateFormat.YYYY_MM_DD}>YYYY-MM-DD</Option>
            </Select>
          </Form.Item>
        </div>
      </Card>

      {/* TAX IDENTIFIERS */}
      <Card>
        <SectionHeader
          icon={IdCard}
          title="Tax identifiers"
          subtitle="Used on printed invoices"
        />
        <div className="px-5 py-5 grid grid-cols-2 gap-4">
          <Form.Item
            name="gstin"
            label={<FieldLabel>GSTIN</FieldLabel>}
            rules={[
              {
                pattern:
                  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                message: "Format: 22ABCDE1234F1Z5",
              },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="22ABCDE1234F1Z5"
              style={{ ...monoInput, textTransform: "uppercase" }}
              maxLength={15}
              onInput={(e: any) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </Form.Item>
          <Form.Item
            name="pan"
            label={<FieldLabel>PAN</FieldLabel>}
            rules={[
              {
                pattern: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                message: "Format: ABCDE1234F",
              },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="ABCDE1234F"
              style={{ ...monoInput, textTransform: "uppercase" }}
              maxLength={10}
              onInput={(e: any) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </Form.Item>
        </div>
      </Card>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .premium-uploader .ant-upload.ant-upload-select {
          border-radius: 12px !important;
          border-style: dashed !important;
          border-color: var(--border-color) !important;
          background: var(--bg-secondary) !important;
        }
        .premium-uploader .ant-upload-list-item {
          border-radius: 12px !important;
          border-color: var(--border-color) !important;
        }
        .custom-select-template .ant-select-selector {
          border-radius: 8px !important;
          height: 38px !important;
          padding: 0 12px !important;
          display: flex; align-items: center;
          border-color: var(--border-color) !important;
          background: var(--bg-secondary) !important;
        }
        .custom-select-template .ant-select-selection-item {
          color: var(--text-primary) !important;
        }
        .ant-form-item-label {
          padding-bottom: 6px !important;
        }
      `,
        }}
      />
    </Form>
  );
};

export default GeneralSettings;
