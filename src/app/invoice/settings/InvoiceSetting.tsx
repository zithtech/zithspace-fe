
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
    <div className="p-2 bg-[var(--customers-header-icon-bg)] text-[var(--customers-header-icon-color)] rounded-lg">
      <Icon size={18} />
    </div>
    <h3 className="text-sm font-bold text-[var(--text-primary)] m-0 uppercase tracking-wider">{title}</h3>
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
    const rawFormat = values.format || "";
    setPreview(generatePreview(rawFormat.toUpperCase()));
    // Pass the uppercase value to parent/preview, but don't force it back into 
    // the form input immediately to avoid cursor jumping
    onSave({ ...initialValues, ...values, format: rawFormat.toUpperCase() });
  };

  const handleCancel = () => {
    form.setFieldValue("format", cachedValue);
    setPreview(generatePreview(cachedValue));
    setEditable(false);
  };

  const handleSave = () => {
    const format = form.getFieldValue("format") || "";
    form.setFieldsValue({ format: format.toUpperCase() });
    setEditable(false);
  };

  return (
    <div className="bg-transparent">
      <SectionTitle icon={ReceiptText} title="Invoice Numbering" />
      <Form 
        form={form} 
        layout="vertical" 
        onValuesChange={handleValuesChange}
        requiredMark={false}
      >
        <div style={{ maxWidth: 500 }}>
          <Form.Item
            label={<span className="text-[var(--text-secondary)] font-medium">Auto-generation Format</span>}
            name="format"
            rules={[{ required: true, message: "Invoice format is required" }]}
            extra={
              <div className="mt-3 p-3 bg-[var(--bg-slate-50)] rounded-xl border border-[var(--border-color)] border-dashed">
                <div className="flex gap-2 items-center text-[var(--text-secondary)] mb-2">
                  <Info size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Available Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <code className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[10px] text-[var(--customers-header-icon-color)] font-bold">{`{YYYY}`}</code>
                  <code className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[10px] text-[var(--customers-header-icon-color)] font-bold">{`{YY}`}</code>
                  <code className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[10px] text-[var(--customers-header-icon-color)] font-bold">{`{###}`}</code>
                </div>
              </div>
            }
          >
            <Input
              ref={inputRef}
              size="large"
              disabled={!editable}
              placeholder="e.g. INV-{YYYY}-{###}"
              style={{ textTransform: 'uppercase' }}
              className={`rounded-xl border-[var(--border-color)] bg-[var(--bg-secondary)] font-mono ${!editable ? 'bg-[var(--bg-slate-50)] opacity-100 text-[var(--text-secondary)] cursor-not-allowed' : ''}`}
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
                        onClick={handleSave} 
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
            <div className="mt-6 p-4 bg-[var(--bg-blue-50)] rounded-2xl border border-[var(--border-blue-200)] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[var(--text-blue-700)] opacity-70 uppercase tracking-widest mb-1">Live Preview</p>
                <p className="text-xl font-mono font-bold text-[var(--text-blue-700)] m-0">{preview}</p>
              </div>
              <div className="p-3 bg-[var(--bg-secondary)] rounded-xl shadow-sm border border-[var(--border-blue-200)]">
                <CheckCircle2 className="text-[var(--customers-header-icon-color)]" size={24} />
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
