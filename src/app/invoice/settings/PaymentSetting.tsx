"use client";
import { FC, useEffect } from "react";
import { Form, Input, Upload, Button, Tooltip, message } from "antd";
import {
  QrCode,
  UploadCloud,
  Info,
  Landmark,
  Trash2,
} from "lucide-react";
import { Draft } from "@/types/invoice";
import jsQR from "jsqr";

interface BankPaymentSettingsProps {
  initialValues: Draft["payment"];
  onSave: (data: Draft["payment"]) => void;
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

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span
    className="text-[11px] font-semibold uppercase tracking-[0.08em]"
    style={{ color: "var(--text-secondary)" }}
  >
    {children}
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

const BankPaymentSettings: FC<BankPaymentSettingsProps> = ({
  initialValues,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues]);

  const validateAndDecodeQR = async (file: File): Promise<{ upiId?: string; error?: string }> => {
    try {
      // 1. File Type and Extension check
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ["png", "jpg", "jpeg"];
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      
      const isAllowedType = allowedTypes.includes(file.type);
      const isAllowedExt = allowedExtensions.includes(fileExt || "");

      if (!isAllowedType && !isAllowedExt) {
        return { error: "Unsupported file type. Please upload a valid JPG, JPEG, or PNG image." };
      }

      // 2. File Size check (2MB)
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        return { error: "Image must be smaller than 2MB" };
      }

      // 3. Decode QR Code using ImageBitmap (or fallback)
      let imageData: ImageData;
      try {
        if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
          const imgBitmap = await window.createImageBitmap(file);
          const canvas = document.createElement("canvas");
          canvas.width = imgBitmap.width;
          canvas.height = imgBitmap.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            return { error: "Could not initialize canvas context." };
          }
          ctx.drawImage(imgBitmap, 0, 0);
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          imgBitmap.close();
        } else {
          throw new Error("createImageBitmap not supported");
        }
      } catch (bitmapError) {
        console.warn("createImageBitmap failed or not supported, using FileReader fallback:", bitmapError);
        
        const base64 = await new Promise<string>((resolveImg, rejectImg) => {
          const reader = new FileReader();
          reader.onload = () => resolveImg(reader.result as string);
          reader.onerror = () => rejectImg(new Error("FileReader failed"));
          reader.readAsDataURL(file);
        });

        imageData = await new Promise<ImageData>((resolveImg, rejectImg) => {
          const img = new window.Image();
          img.onload = () => {
            try {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) return rejectImg(new Error("Could not get canvas context"));
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              resolveImg(ctx.getImageData(0, 0, canvas.width, canvas.height));
            } catch (err) {
              rejectImg(err);
            }
          };
          img.onerror = () => rejectImg(new Error("Image failed to load"));
          img.src = base64;
        });
      }

      // 4. Decode QR
      const decodeQR = typeof jsQR === "function" ? jsQR : (jsQR as any).default;
      if (typeof decodeQR !== "function") {
        console.error("jsQR is not loaded correctly on the client side.");
        return { error: "Invalid QR Code image. Please upload a valid payment QR code." };
      }

      const code = decodeQR(imageData.data, imageData.width, imageData.height);
      if (!code || !code.data) {
        return { error: "Invalid QR Code image. Please upload a valid payment QR code." };
      }

      const payload = code.data.trim();

      // Validation of payment QR: UPI or EMVCo (Bharat QR)
      const isUpi = payload.startsWith("upi://pay?");
      const isEmvCo = payload.startsWith("000201");

      let isValidPayment = isUpi;
      if (isEmvCo) {
        const hasUpiNCPIRegistry = payload.includes("org.npci.upi") || payload.includes("org.npci.bharatqr");
        if (hasUpiNCPIRegistry) {
          isValidPayment = true;
        }
      }

      if (!isValidPayment) {
        return { error: "Invalid QR Code image. Please upload a valid payment QR code." };
      }

      return { upiId: payload };
    } catch (err) {
      console.error("validateAndDecodeQR failed:", err);
      return { error: "Invalid QR Code image. Please upload a valid payment QR code." };
    }
  };

  const handleQRUpload = async (file: File) => {
    try {
      const result = await validateAndDecodeQR(file);
      if (result.error) {
        messageApi.error(result.error);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        form.setFieldValue("qrCode", base64);
        const values = form.getFieldsValue();
        onSave({ ...values, qrCode: base64 });
      };
      reader.onerror = () => {
        messageApi.error("Failed to read file.");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error("Error in handleQRUpload:", err);
      messageApi.error("An unexpected error occurred during QR upload.");
    }
  };

  const qrCode = Form.useWatch("qrCode", form);

  return (
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
      className="grid grid-cols-1 lg:grid-cols-2 gap-5"
    >
      {contextHolder}
      <Form.Item name="qrCode" hidden>
        <Input />
      </Form.Item>

      {/* BANK ACCOUNT */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        <SectionHeader
          icon={Landmark}
          title="Bank account"
          subtitle="Wire & ACH details"
        />
        <div className="px-5 py-5 space-y-4">
          <Form.Item
            label={<FieldLabel>Bank name</FieldLabel>}
            name="bankName"
            style={{ marginBottom: 0 }}
          >
            <Input placeholder="e.g. HDFC Bank" style={inputBase} />
          </Form.Item>

          <Form.Item
            label={<FieldLabel>Account number</FieldLabel>}
            name="accountNumber"
            rules={[
              {
                pattern: /^[0-9]{9,18}$/,
                message: "9–18 digits required",
              },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Input
              placeholder="—"
              style={monoInput}
              maxLength={18}
              onInput={(e: any) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, "");
              }}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label={<FieldLabel>IFSC code</FieldLabel>}
              name="ifscCode"
              rules={[
                {
                  pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                  message: "Format: ABCD0123456",
                },
              ]}
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="ABCD0123456"
                style={{ ...monoInput, textTransform: "uppercase" }}
                maxLength={11}
                onInput={(e: any) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
              />
            </Form.Item>
            <Form.Item
              label={<FieldLabel>Branch</FieldLabel>}
              name="branchName"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="Branch location" style={inputBase} />
            </Form.Item>
          </div>

          <div
            className="rounded-lg p-3 flex items-start gap-2"
            style={{
              background: "var(--bg-blue-50)",
              border: "1px solid var(--border-blue-200)",
            }}
          >
            <Info
              size={13}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "var(--text-blue-700)" }}
            />
            <span
              className="text-[11.5px] leading-relaxed"
              style={{ color: "var(--text-blue-700)" }}
            >
              These details print on the invoice for bank-transfer payments.
            </span>
          </div>
        </div>
      </div>

      {/* PAYMENT QR */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
        }}
      >
        <SectionHeader
          icon={QrCode}
          title="Payment QR"
          subtitle="UPI / mobile-app pay"
        />
        <div className="px-5 py-5 space-y-4">
          <div
            className="rounded-xl p-5 flex flex-col items-center justify-center"
            style={{
              background: "var(--bg-slate-50)",
              border: "1px dashed var(--border-color)",
              minHeight: 240,
            }}
          >
            {qrCode ? (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-44 h-44 rounded-xl p-2 flex items-center justify-center"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="w-full h-full object-contain rounded-md"
                  />
                </div>
                <Tooltip title="Remove QR code">
                  <Button
                    danger
                    icon={<Trash2 size={13} />}
                    onClick={() => {
                      form.setFieldValue("qrCode", undefined);
                      onSave({ ...form.getFieldsValue(), qrCode: undefined });
                    }}
                    style={{
                      borderRadius: 8,
                      height: 32,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Remove
                  </Button>
                </Tooltip>
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
                <div className="flex flex-col items-center cursor-pointer w-full py-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: "var(--bg-blue-50)",
                      color: "var(--text-blue-700)",
                      border: "1px solid var(--border-blue-200)",
                    }}
                  >
                    <UploadCloud size={20} strokeWidth={2.25} />
                  </div>
                  <div
                    className="text-[14px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Upload QR image
                  </div>
                  <div
                    className="text-[11.5px] mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    PNG, JPG or SVG · up to 2MB
                  </div>
                </div>
              </Upload>
            )}
          </div>

          <div
            className="rounded-lg p-3 flex items-start gap-2"
            style={{
              background: "var(--bg-blue-50)",
              border: "1px solid var(--border-blue-200)",
            }}
          >
            <QrCode
              size={13}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "var(--text-blue-700)" }}
            />
            <span
              className="text-[11.5px] leading-relaxed"
              style={{ color: "var(--text-blue-700)" }}
            >
              A QR code lets customers pay instantly via UPI or mobile apps.
            </span>
          </div>
        </div>
      </div>

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

export default BankPaymentSettings;
