
"use client";
import { FC, useEffect, useRef, useState } from "react";
import { Form, Input, Tooltip } from "antd";
import { EditOutlined, CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { InvoiceDraft } from "@/types/invoice";

interface InvoiceSettingProps {
  initialValues: InvoiceDraft;
  onSave: (data: InvoiceDraft) => void;
}

const InvoiceSetting: FC<InvoiceSettingProps> = ({ initialValues, onSave }) => {
  const [form] = Form.useForm();
  const inputRef = useRef<any>(null);

  const [editable, setEditable] = useState(false);
  const [preview, setPreview] = useState("");
  const [cachedValue, setCachedValue] = useState<string>("");

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setCachedValue(initialValues.format);
    setPreview(generatePreview(initialValues.format));
  }, [initialValues]);

  useEffect(() => {
    if (editable) inputRef.current?.focus();
  }, [editable]);

  const generatePreview = (value: string) => {
    if (!value) return "";
    const year = new Date().getFullYear();
    const shortYear = year.toString().slice(-2);
    return value
      .replace(/{YYYY}/g, year.toString())
      .replace(/{YY}/g, shortYear)
      .replace(/{###}/g, "001")
      .replace(/{####}/g, "0001");
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    onSave({ ...initialValues, ...values });
    setEditable(false);
    setCachedValue(values.format);
    setPreview(generatePreview(values.format));
  };

  const handleCancel = () => {
    form.setFieldValue("format", cachedValue);
    setPreview(generatePreview(cachedValue));
    setEditable(false);
  };

  const renderSuffix = () => {
    if (!editable)
      return (
        <Tooltip title="Edit">
          <EditOutlined style={{ cursor: "pointer", color: "#1677ff" }} onClick={() => setEditable(true)} />
        </Tooltip>
      );

    return (
      <div style={{ display: "flex", gap: 8 }}>
        <Tooltip title="Save">
          <CheckCircleFilled style={{ cursor: "pointer", color: "green" }} onClick={handleSave} />
        </Tooltip>
        <Tooltip title="Cancel">
          <CloseCircleFilled style={{ cursor: "pointer", color: "red" }} onClick={handleCancel} />
        </Tooltip>
      </div>
    );
  };

  return (
    <Form form={form} layout="vertical">
      <Form.Item
        label="Invoice Number Format"
        name="format"
        rules={[{ required: true, message: "Invoice format is required" }]}
      >
        <Input
          ref={inputRef}
          disabled={!editable}
          placeholder="e.g. INV-{YYYY}-{###}"
          onChange={(e) => setPreview(generatePreview(e.target.value))}
          suffix={renderSuffix()}
        />
      </Form.Item>

      {preview && <div className="text-blue-600 mt-1">Preview: {preview}</div>}
    </Form>
  );
};

export default InvoiceSetting;
