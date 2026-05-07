"use client";
import { FC, useEffect, useRef, useState } from "react";
import { Form, Input, Tooltip } from "antd";
import {
  ReceiptText,
  CheckCircle2,
  Info,
  Edit2,
  XCircle,
  Eye,
} from "lucide-react";
import { InvoiceDraft } from "@/types/invoice";

interface InvoiceSettingProps {
  initialValues: InvoiceDraft;
  onSave: (data: InvoiceDraft) => void;
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

const FieldLabel = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <span
    className="text-[11px] font-semibold uppercase tracking-[0.08em]"
    style={{ color: "var(--text-secondary)" }}
  >
    {children}
    {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
  </span>
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

  const Tag = ({ children }: { children: string }) => (
    <code
      className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold"
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-blue-700)",
        border: "1px solid var(--border-blue-200)",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
      {children}
    </code>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      requiredMark={false}
      className="flex flex-col gap-5"
    >
      {/* FORMAT */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        <SectionHeader
          icon={ReceiptText}
          title="Invoice numbering"
          subtitle="Auto-generation pattern"
        />
        <div className="px-5 py-5 max-w-2xl">
          <Form.Item
            label={<FieldLabel required>Auto-generation format</FieldLabel>}
            name="format"
            rules={[{ required: true, message: "Invoice format is required" }]}
            style={{ marginBottom: 0 }}
          >
            <Input
              ref={inputRef}
              disabled={!editable}
              placeholder="e.g. INV-{YYYY}-{###}"
              style={{
                height: 40,
                borderRadius: 8,
                background: editable ? "var(--bg-secondary)" : "var(--bg-slate-50)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 13,
                textTransform: "uppercase",
              }}
              suffix={
                !editable ? (
                  <Tooltip title="Unlock to edit">
                    <button
                      type="button"
                      onClick={() => setEditable(true)}
                      className="p-1 rounded-md transition-colors hover:bg-[var(--bg-secondary)]"
                      style={{ color: "var(--text-blue-700)" }}
                    >
                      <Edit2 size={14} strokeWidth={2.25} />
                    </button>
                  </Tooltip>
                ) : (
                  <div className="flex items-center gap-1">
                    <Tooltip title="Save">
                      <button
                        type="button"
                        onClick={handleSave}
                        className="p-1 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                        style={{ color: "#10b981" }}
                      >
                        <CheckCircle2 size={14} strokeWidth={2.25} />
                      </button>
                    </Tooltip>
                    <Tooltip title="Cancel">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="p-1 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                        style={{ color: "#ef4444" }}
                      >
                        <XCircle size={14} strokeWidth={2.25} />
                      </button>
                    </Tooltip>
                  </div>
                )
              }
            />
          </Form.Item>

          {/* Available tags */}
          <div
            className="mt-4 rounded-xl p-3.5"
            style={{
              background: "var(--bg-slate-50)",
              border: "1px dashed var(--border-color)",
            }}
          >
            <div
              className="flex items-center gap-1.5 mb-2 text-[10.5px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "var(--text-secondary)" }}
            >
              <Info size={12} />
              Available tags
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Tag>{`{YYYY}`}</Tag>
              <Tag>{`{YY}`}</Tag>
              <Tag>{`{###}`}</Tag>
              <Tag>{`{####}`}</Tag>
            </div>
            <div
              className="text-[11.5px] mt-2.5 leading-relaxed"
              style={{ color: "var(--text-secondary)" }}
            >
              Combine literal text and tags. Example: <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "var(--text-primary)", fontWeight: 500 }}>INV-{`{YYYY}`}-{`{###}`}</span> →{" "}
              <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "var(--text-primary)", fontWeight: 500 }}>
                INV-{new Date().getFullYear()}-001
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE PREVIEW */}
      {preview && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          <SectionHeader
            icon={Eye}
            title="Live preview"
            subtitle="Next invoice number"
          />
          <div className="px-5 py-5 max-w-2xl">
            <div
              className="rounded-xl p-5 flex items-center justify-between gap-4"
              style={{
                background: "var(--bg-blue-50)",
                border: "1px solid var(--border-blue-200)",
              }}
            >
              <div>
                <div
                  className="text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1"
                  style={{ color: "var(--text-blue-700)", opacity: 0.75 }}
                >
                  Generated number
                </div>
                <div
                  className="text-2xl font-bold tabular-nums"
                  style={{
                    color: "var(--text-blue-700)",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {preview}
                </div>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "var(--bg-secondary)",
                  color: "var(--text-blue-700)",
                  border: "1px solid var(--border-blue-200)",
                }}
              >
                <CheckCircle2 size={20} strokeWidth={2.25} />
              </div>
            </div>
          </div>
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ant-form-item-label {
          padding-bottom: 6px !important;
        }
      `,
        }}
      />
    </Form>
  );
};

export default InvoiceSetting;
