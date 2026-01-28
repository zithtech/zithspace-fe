import { FC, useEffect, useState } from "react";
import { Form, Input, Button } from "antd";
import { InvoiceDraft } from "@/types/invoice";

interface InvoiceSettingProps {
  initialValues: InvoiceDraft;
  onSave: (data: InvoiceDraft) => void;
}

const InvoiceSetting: FC<InvoiceSettingProps> = ({ initialValues, onSave }) => {
  const [form] = Form.useForm();
  const [preview, setPreview] = useState("");

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  const generatePreview = (value: string): string => {
    if (!value) return "";
    const year = new Date().getFullYear();
    const shortYear = year.toString().slice(-2);
    return value
      .replace(/{YYYY}/g, year.toString())
      .replace(/{YY}/g, shortYear)
      .replace(/{###}/g, "001")
      .replace(/{####}/g, "0001");
  };

  const handleFinish = (values: InvoiceDraft) => {
    onSave(values); // ✅ send to parent
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onValuesChange={(_, values) => {
        onSave({ ...initialValues, ...values }); // MERGE!
      }}
    >
      <Form.Item
        label="Invoice Number Format"
        name="invoice_format"
        rules={[{ required: true, message: "Invoice format is required" }]}
      >
        <Input
          placeholder="e.g. INV-{YYYY}-{###}"
          onChange={(e) => setPreview(generatePreview(e.target.value))}
        />
      </Form.Item>

      {preview && <div className="text-blue-600 mt-1">Preview: {preview}</div>}
    </Form>
  );
};

export default InvoiceSetting;
