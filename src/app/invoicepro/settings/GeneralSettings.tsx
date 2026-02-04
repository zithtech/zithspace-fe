


"use client";
import { FC, useEffect, useRef, useState } from "react";
import { Card, Form, Input, Upload, Row, Col, Select, message } from "antd";
import {
  UploadOutlined,
  ApartmentOutlined,
  FullscreenOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { currencyOptions } from "@/utils/currencyOptions";
import { GeneralDraft, Currency, DateFormat } from "@/types/invoice";

const { Option } = Select;

interface GeneralSettingsProps {
  initialValues: GeneralDraft;
  onSave: (data: GeneralDraft) => void;
}

const GeneralSettings: FC<GeneralSettingsProps> = ({
  initialValues,
  onSave,
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
    <div className="bg-gray-50 px-4 py-3">
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
      >
        <Row gutter={[24, 24]}>
          {/* ================= COMPANY INFO ================= */}
          <Col xs={24} md={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <ApartmentOutlined style={{color:"#1890ff"}} />
                  Company Information
                </span>
              }
            >
              <Row gutter={[12, 8]}>
                <Col span={12}>
                  <Form.Item
                    name="companyName"
                    label="Company Name"
                    rules={[{ required: true }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name={["address", "plot_no"]} label="Plot No">
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name={["address", "floor_no"]} label="Floor No">
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name={["address", "building_name"]}
                    label="Building Name"
                  >
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name={["address", "street"]} label="Street">
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name={["address", "area"]} label="Area">
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name={["address", "city"]} label="City">
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name={["address", "pincode"]} label="Pincode">
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name={["address", "country"]} label="Country">
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item label="Primary Color">
                    <div className="flex gap-2 items-center">
                      <Form.Item name="primaryColor" noStyle>
                        <Input type="color" />
                      </Form.Item>
                      <Input value={primaryColor} readOnly />
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* ================= REGIONAL + UPLOAD ================= */}
          <Col xs={24} md={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <FullscreenOutlined style={{color:"#1890ff"}} />
                  Regional Settings
                </span>
              }
            >
              <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
                <Select>
                  {currencyOptions.map((c) => (
                    <Option key={c.value} value={c.value}>
                      {c.symbol} {c.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="dateFormat" label="Date Format" rules={[{ required: true }]}>
                <Select>
                  <Option value={DateFormat.MM_DD_YYYY}>MM/DD/YYYY</Option>
                  <Option value={DateFormat.DD_MM_YYYY}>DD/MM/YYYY</Option>
                  <Option value={DateFormat.YYYY_MM_DD}>YYYY-MM-DD</Option>
                </Select>
              </Form.Item>
            </Card>

            <Row gutter={16} className="mt-4">
              <Col span={12}>
                <Card title={
                <span className="flex items-center gap-2">
                    <EditOutlined style={{color:"#1890ff"}}/> 
                    Signature
                  </span>
                } style={{height:"255px"}}>
                  <Upload
                    listType="picture-card"
                    fileList={signatureFileList}
                    beforeUpload={beforeUpload}
                    onChange={handleSignatureChange}
                    maxCount={1}
                  >
                    {signatureFileList.length === 0 && <UploadOutlined />}
                  </Upload>
                </Card>
              </Col>

              <Col span={12}>
                <Card title={
                  <span className="flex items-center gap-2">
                    <EditOutlined style={{color:"#1890ff"}}/> 
                    Company Logo
                  </span>
                  } style={{height:"255px"}}>
                  <Upload
                    listType="picture-card"
                    fileList={logoFileList}
                    beforeUpload={beforeUpload}
                    onChange={handleLogoChange}
                    maxCount={1}
                  >
                    {logoFileList.length === 0 && <UploadOutlined />}
                  </Upload>
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default GeneralSettings;


