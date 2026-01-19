import { FC, useEffect, useRef, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Upload,
  Row,
  Col,
  Select,
  message,
} from "antd";
import {
  UploadOutlined,
  ApartmentOutlined,
  FullscreenOutlined,
  EditOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { currencyOptions } from "@/utils/currencyOptions";
import { GeneralDraft } from "@/types/invoice";

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

  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const prevLogoRef = useRef<string | null>(null);
  const prevSignatureRef = useRef<string | null>(null);

  const primaryColor = Form.useWatch("primary_color", form);

  /* ---------------- INIT FORM ---------------- */
  useEffect(() => {
    if (initialValues && !initialized) {
      form.setFieldsValue(initialValues);
      setInitialized(true);
    }
  }, [initialValues, initialized, form]);

  /* ---------------- INIT LOGO ---------------- */
  useEffect(() => {
    if (prevLogoRef.current !== initialValues.company_logo) {
      setLogoFileList(
        initialValues.company_logo
          ? [
              {
                uid: "-1",
                name: "company-logo",
                status: "done",
                url: initialValues.company_logo.startsWith("data:image")
                  ? initialValues.company_logo
                  : `data:image/jpeg;base64,${initialValues.company_logo}`,
              },
            ]
          : [],
      );
      prevLogoRef.current = initialValues.company_logo || null;
    }
  }, [initialValues.company_logo]);

  /* ---------------- INIT SIGNATURE ---------------- */
  useEffect(() => {
    if (prevSignatureRef.current !== initialValues.company_signature) {
      setSignatureFileList(
        initialValues.company_signature
          ? [
              {
                uid: "-2",
                name: "company-signature",
                status: "done",
                url: initialValues.company_signature.startsWith("data:image")
                  ? initialValues.company_signature
                  : `data:image/jpeg;base64,${initialValues.company_signature}`,
              },
            ]
          : [],
      );
      prevSignatureRef.current = initialValues.company_signature || null;
    }
  }, [initialValues.company_signature]);

  /* ---------------- HELPERS ---------------- */
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

  /* ---------------- REALTIME SAVE ---------------- */
  const handleValuesChange = (changed: Partial<GeneralDraft>) => {
    onSave({
      ...initialValues,
      ...changed,
      company_logo: logoFileList[0]?.url || null,
      company_signature: signatureFileList[0]?.url || null,
    });
  };

  /* ---------------- LOGO UPLOAD ---------------- */
  const handleLogoChange: UploadProps["onChange"] = async ({ fileList }) => {
    setLogoFileList(fileList);

    let base64 = fileList[0]?.url || null;
    if (fileList[0]?.originFileObj) {
      base64 = await fileToBase64(fileList[0].originFileObj as File);
    }

    onSave({
      ...form.getFieldsValue(),
      company_logo: base64,
      company_signature: signatureFileList[0]?.url || null, // preserve signature
    });
  };

  /* ---------------- SIGNATURE UPLOAD ---------------- */
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
      company_logo: logoFileList[0]?.url || null, // preserve logo
      company_signature: base64,
    });
  };

  return (
    <div className="bg-gray-50 p-6">
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Row gutter={[24, 24]}>
          {/* LEFT COLUMN */}
          <Col xs={24} md={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <ApartmentOutlined />
                  Company Information
                </span>
              }
            >
              <Form.Item
                name="company_name"
                label="Company Name"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>

              <Form.Item name="company_address" label="Company Address">
                <Input.TextArea rows={3} />
              </Form.Item>

              <Form.Item label="Primary Color">
                <div className="flex gap-3">
                  <Form.Item name="primary_color" noStyle>
                    <Input type="color" style={{ width: 60 }} />
                  </Form.Item>
                  <Input value={primaryColor} readOnly />
                </div>
              </Form.Item>

              <Form.Item label="Company Logo">
                <Upload
                  listType="picture-card"
                  fileList={logoFileList}
                  beforeUpload={beforeUpload}
                  onChange={handleLogoChange}
                  maxCount={1}
                >
                  {logoFileList.length === 0 && <UploadOutlined />}
                </Upload>
                <p className="text-xs text-gray-500">
                  Recommended: Square logo, max 2MB, PNG or JPG format
                </p>
              </Form.Item>
            </Card>
          </Col>

          {/* RIGHT COLUMN (STACKED) */}
          <Col xs={24} md={12}>
            <div className="flex flex-col gap-7">
              <Card
                title={
                  <span className="flex items-center gap-2">
                    <FullscreenOutlined />
                    Regional Settings
                  </span>
                }
              >
                <Form.Item
                  name="currency_code"
                  label="Currency"
                  rules={[{ required: true }]}
                >
                  <Select>
                    {currencyOptions.map((c) => (
                      <Option key={c.value} value={c.value}>
                        {c.symbol} {c.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="date_format"
                  label="Date Format"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="MM/DD/YYYY">MM/DD/YYYY</Option>
                    <Option value="DD/MM/YYYY">DD/MM/YYYY</Option>
                    <Option value="YYYY-MM-DD">YYYY-MM-DD</Option>
                  </Select>
                </Form.Item>
              </Card>

              <Card
                title={
                  <span className="flex items-center gap-2">
                    <EditOutlined />
                    Signature Settings
                  </span>
                }
              >
                <Form.Item label="Authorized Signature">
                  <Upload
                    listType="picture-card"
                    fileList={signatureFileList}
                    beforeUpload={beforeUpload}
                    onChange={handleSignatureChange}
                    maxCount={1}
                  >
                    {signatureFileList.length === 0 && <UploadOutlined />}
                  </Upload>
                  <p className="text-xs text-gray-500">
                    Upload PNG/JPG, max 2MB
                  </p>
                </Form.Item>
              </Card>
            </div>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default GeneralSettings;
