


"use client";
import { FC, useEffect, useRef, useState } from "react";
import { Card, Form, Input, Upload, Row, Col, Select, message, Divider } from "antd";
import { 
  Building2, 
  MapPin, 
  Globe, 
  Palette, 
  Image as ImageIcon, 
  PenTool, 
  Upload as UploadIcon,
  BadgePercent
} from "lucide-react";
import type { UploadFile, UploadProps } from "antd";
import { currencyOptions } from "@/utils/currencyOptions";
import { GeneralDraft, Currency, DateFormat } from "@/types/invoice";

const { Option } = Select;

interface GeneralSettingsProps {
  initialValues: GeneralDraft;
  onSave: (data: GeneralDraft) => void;
  formRef?: any;
}

const SectionTitle = ({ icon: Icon, title }: any) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
      <Icon size={18} />
    </div>
    <h3 className="text-sm font-bold text-slate-800 m-0 uppercase tracking-wider">{title}</h3>
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

  /* ====================== SYNC FORM ON EDIT ====================== */
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


  /* ====================== INIT LOGO ====================== */
  useEffect(() => {
    const companyLogo = initialValues.companyLogo ?? null;

    if (prevLogoRef.current !== companyLogo) {
      setLogoFileList(
        companyLogo
          ? [
              {
                uid: "-1",
                name: "company-logo",
                status: "done",
                url: companyLogo,
              },
            ]
          : []
      );

      prevLogoRef.current = companyLogo;
    }
  }, [initialValues.companyLogo]);


  /* ====================== INIT SIGNATURE ====================== */
  useEffect(() => {
    const signature = initialValues.signature ?? null;

    if (prevSignatureRef.current !== signature) {
      setSignatureFileList(
        signature
          ? [
              {
                uid: "-2",
                name: "signature",
                status: "done",
                url: signature,
              },
            ]
          : []
      );

      prevSignatureRef.current = signature;
    }
  }, [initialValues.signature]);


  /* ====================== HELPERS ====================== */
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

  /* ====================== FORM CHANGE ====================== */
  const handleValuesChange = () => {
    onSave({
      ...form.getFieldsValue(),
      companyLogo: logoFileList[0]?.url ?? null,
      signature: signatureFileList[0]?.url ?? null,
    });
  };


  /* ====================== LOGO UPLOAD ====================== */
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

  /* ====================== SIGNATURE UPLOAD ====================== */
  const handleSignatureChange: UploadProps["onChange"] = async ({
    fileList,
  }) => {
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
    <div className="bg-white">
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={initialValues}
        requiredMark={false}
      >
        <Row gutter={[32, 24]}>
          {/* LEFT COLUMN: PRIMARY INFO */}
          <Col xs={24} lg={12}>
            {/* COMPANY INFO */}
            <SectionTitle icon={Building2} title="Company Information" />
            <Row gutter={[16, 0]}>
              <Col span={24}>
                <Form.Item
                  name="companyName"
                  label={<span className="text-slate-500 font-medium">Company Name</span>}
                  rules={[{ required: true, message: "Company name is required" }]}
                >
                  <Input size="large" placeholder="Enter company name" className="rounded-xl border-slate-200" />
                </Form.Item>
              </Col>
            </Row>

            <Divider className="my-6" />

            {/* ADDRESS */}
            <SectionTitle icon={MapPin} title="Business Address" />
            <Row gutter={[16, 0]}>
              <Col span={8}>
                <Form.Item name={["address", "plot_no"]} label={<span className="text-slate-500 font-medium">Plot No</span>}>
                  <Input placeholder="Plot #" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={["address", "floor_no"]} label={<span className="text-slate-500 font-medium">Floor No</span>}>
                  <Input placeholder="Floor #" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={["address", "building_name"]} label={<span className="text-slate-500 font-medium">Building</span>}>
                  <Input placeholder="Building Name" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name={["address", "street"]} label={<span className="text-slate-500 font-medium">Street / Area</span>}>
                  <Input placeholder="Street name and locality" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={["address", "city"]} label={<span className="text-slate-500 font-medium">City</span>}>
                  <Input placeholder="City" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={["address", "pincode"]} label={<span className="text-slate-500 font-medium">Pincode</span>}>
                  <Input placeholder="######" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item name={["address", "country"]} label={<span className="text-slate-500 font-medium">Country</span>}>
                  <Input placeholder="Enter country" className="rounded-xl" />
                </Form.Item>
              </Col>
            </Row>
          </Col>

          {/* RIGHT COLUMN: BRANDING & REGIONAL */}
          <Col xs={24} lg={12}>
            {/* BRANDING */}
            <SectionTitle icon={Palette} title="Branding" />
            <Row gutter={[16, 0]}>
              <Col span={24}>
                <div className="flex gap-4 mb-6 bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Logo</p>
                    <Upload
                      listType="picture-card"
                      fileList={logoFileList}
                      beforeUpload={beforeUpload}
                      onChange={handleLogoChange}
                      maxCount={1}
                      className="logo-uploader"
                    >
                      {logoFileList.length === 0 && (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <ImageIcon size={20} />
                          <span className="text-[10px]">Upload</span>
                        </div>
                      )}
                    </Upload>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Signature</p>
                    <Upload
                      listType="picture-card"
                      fileList={signatureFileList}
                      beforeUpload={beforeUpload}
                      onChange={handleSignatureChange}
                      maxCount={1}
                    >
                      {signatureFileList.length === 0 && (
                        <div className="flex flex-col items-center gap-1 text-slate-400">
                          <PenTool size={20} />
                          <span className="text-[10px]">Sign</span>
                        </div>
                      )}
                    </Upload>
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <Form.Item label={<span className="text-slate-500 font-medium">Brand Primary Color</span>} style={{ marginBottom: 0 }}>
                  <div className="flex gap-3 items-center">
                    <Form.Item name="primaryColor" noStyle>
                      <Input 
                        type="color" 
                        style={{ width: 60, height: 40, padding: 0, border: 'none' }} 
                        className="rounded-lg cursor-pointer overflow-hidden" 
                      />
                    </Form.Item>
                    <Input value={primaryColor} readOnly className="rounded-xl border-slate-200 font-mono text-sm" />
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Divider className="my-6" />

            {/* REGIONAL */}
            <SectionTitle icon={Globe} title="Regional & Tax" />
            <Row gutter={[16, 0]}>
              <Col span={12}>
                <Form.Item name="currency" label={<span className="text-slate-500 font-medium">Currency</span>} rules={[{ required: true }]}>
                  <Select size="large" className="rounded-xl">
                    {currencyOptions.map((c) => (
                      <Option key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className="text-blue-500 font-bold">{c.symbol}</span>
                          {c.label}
                        </span>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dateFormat" label={<span className="text-slate-500 font-medium">Date Format</span>} rules={[{ required: true }]}>
                  <Select size="large" className="rounded-xl">
                    <Option value={DateFormat.MM_DD_YYYY}>MM/DD/YYYY</Option>
                    <Option value={DateFormat.DD_MM_YYYY}>DD/MM/YYYY</Option>
                    <Option value={DateFormat.YYYY_MM_DD}>YYYY-MM-DD</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="gstin" label={<span className="text-slate-500 font-medium">GSTIN</span>}>
                  <Input placeholder="Optional" className="rounded-xl" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="pan" label={<span className="text-slate-500 font-medium">PAN</span>}>
                  <Input placeholder="Optional" className="rounded-xl" />
                </Form.Item>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>

      <style dangerouslySetInnerHTML={{ __html: `
        .logo-uploader .ant-upload.ant-upload-select {
          border-radius: 16px !important;
          border-style: dashed !important;
        }
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

export default GeneralSettings;


