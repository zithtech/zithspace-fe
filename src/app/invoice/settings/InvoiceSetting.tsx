
"use client";
import { FC, useEffect, useRef, useState } from "react";
import { Form, Input, Tooltip } from "antd";
import { ReceiptText, CheckCircle2, Info, Edit2, XCircle } from "lucide-react";
import { InvoiceDraft } from "@/types/invoice";

interface InvoiceSettingProps {
  initialValues: InvoiceDraft;
  onSave: (data: InvoiceDraft) => void;
}

const SectionTitle = ({ icon: Icon, title }: any) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
      <Icon size={18} />
    </div>
    <h3 className="text-sm font-bold text-slate-800 m-0 uppercase tracking-wider">{title}</h3>
  </div>
);

const InvoiceSetting: FC<InvoiceSettingProps> = ({ initialValues, onSave }) => {
  const [form] = Form.useForm();
  const inputRef = useRef<any>(null);

  const [editable, setEditable] = useState(false);
  const [preview, setPreview] = useState("");
  const [cachedValue, setCachedValue] = useState("");

  useEffect(() => {
    form.setFieldsValue(initialValues);
    setPreview(generatePreview(initialValues.format));
  }, [initialValues]);

  useEffect(() => {
    if (editable) {
      setCachedValue(form.getFieldValue("format"));
      inputRef.current?.focus();
    }
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

  const handleValuesChange = (_: any, values: any) => {
    const capsFormat = values.format?.toUpperCase();
    if (capsFormat !== values.format) {
      form.setFieldsValue({ format: capsFormat });
    }
    setPreview(generatePreview(capsFormat));
    onSave({ ...initialValues, ...values, format: capsFormat });
  };

  const handleCancel = () => {
    form.setFieldValue("format", cachedValue);
    setPreview(generatePreview(cachedValue));
    setEditable(false);
  };

  return (
    <div className="bg-white">
      <SectionTitle icon={ReceiptText} title="Invoice Numbering" />
      <Form 
        form={form} 
        layout="vertical" 
        onValuesChange={handleValuesChange}
        requiredMark={false}
      >
        <div style={{ maxWidth: 500 }}>
          <Form.Item
            label={<span className="text-slate-500 font-medium">Auto-generation Format</span>}
            name="format"
            rules={[{ required: true, message: "Invoice format is required" }]}
            extra={
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <div className="flex gap-2 items-center text-slate-500 mb-2">
                  <Info size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Available Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <code className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-blue-600 font-bold">{`{YYYY}`}</code>
                  <code className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-blue-600 font-bold">{`{YY}`}</code>
                  <code className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-blue-600 font-bold">{`{###}`}</code>
                </div>
              </div>
            }
          >
            <Input
              ref={inputRef}
              size="large"
              disabled={!editable}
              placeholder="e.g. INV-{YYYY}-{###}"
              className={`rounded-xl border-slate-200 font-mono ${!editable ? 'bg-slate-50 opacity-100 text-slate-500 cursor-not-allowed' : ''}`}
              suffix={
                !editable ? (
                  <Tooltip title="Unlock to Edit">
                    <Edit2 
                      size={18} 
                      className="text-blue-500 cursor-pointer hover:scale-110 transition-transform" 
                      onClick={() => setEditable(true)} 
                    />
                  </Tooltip>
                ) : (
                  <div className="flex items-center gap-2">
                    <Tooltip title="Save">
                      <CheckCircle2 
                        size={18} 
                        className="text-green-500 cursor-pointer hover:scale-110 transition-transform" 
                        onClick={() => setEditable(false)} 
                      />
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <XCircle 
                        size={18} 
                        className="text-red-400 cursor-pointer hover:scale-110 transition-transform" 
                        onClick={handleCancel} 
                      />
                    </Tooltip>
                  </div>
                )
              }
            />
          </Form.Item>

          {preview && (
            <div className="mt-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Live Preview</p>
                <p className="text-xl font-mono font-bold text-blue-700 m-0">{preview}</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-100">
                <CheckCircle2 className="text-blue-500" size={24} />
              </div>
            </div>
          )}
        </div>
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

export default InvoiceSetting;
