"use client";

import React, { useEffect, useState } from "react";
import { Drawer, Form, Input, Button, message, Tooltip } from "antd";
import {
  Mail,
  Send,
  Paperclip,
  X,
  FileText,
  CheckCircle2,
  User,
  Type,
} from "lucide-react";
import { useSendInvoiceEmail } from "@/hooks/useInvoices";

const { TextArea } = Input;

interface ComposeEmailDrawerProps {
  open: boolean;
  onClose: () => void;
  invoice: any;
}

export default function ComposeEmailDrawer({
  open,
  onClose,
  invoice,
}: ComposeEmailDrawerProps) {
  const [form] = Form.useForm();
  const { mutate: sendEmail, isPending } = useSendInvoiceEmail();

  const [messageLength, setMessageLength] = useState(0);

  useEffect(() => {
    if (open && invoice) {
      const customer = invoice.customerSnapshot || invoice.customer;
      const initialMessage = `Dear ${
        customer?.name || customer?.companyName || "Customer"
      },\n\nPlease find attached invoice ${
        invoice.invoiceNumber
      } for the amount of $${invoice.total ?? invoice.grandTotal ?? 0}.\n\nKind regards,\nAccounts Team`;

      form.setFieldsValue({
        to: customer?.email,
        subject: `Invoice ${invoice.invoiceNumber} from your Company Name`,
        message: initialMessage,
      });
      setMessageLength(initialMessage.length);
    }
  }, [open, invoice, form]);

  const onFinish = (values: any) => {
    const payload = {
      to: values.to,
      subject: values.subject,
      message: values.message,
      pdfUrl: invoice.pdfUrl,
    };

    sendEmail(
      { id: invoice.id, data: payload },
      {
        onSuccess: () => {
          message.success(`Email sent to ${values.to}`);
          onClose();
        },
        onError: (err: any) => {
          console.error("Send email failed:", err);
          message.error(err.message || "Failed to send email");
        },
      }
    );
  };

  const customer = invoice?.customerSnapshot || invoice?.customer || {};
  const customerInitial = (customer.name || customer.companyName || "C")
    .charAt(0)
    .toUpperCase();
  const hasAttachment =
    !!invoice?.pdfUrl ||
    (invoice?.attachments &&
      invoice.attachments.some(
        (a: any) =>
          a.fileName?.toLowerCase()?.endsWith(".pdf") ||
          a.fileUrl?.toLowerCase()?.endsWith(".pdf")
      ));

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

  const inputBase: React.CSSProperties = {
    height: 38,
    borderRadius: 8,
    background: "var(--bg-secondary)",
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  };

  return (
    <Drawer
      title={null}
      closable={false}
      placement="right"
      onClose={onClose}
      open={open}
      width={680}
      styles={{
        body: {
          padding: 0,
          background: "var(--customers-page-bg)",
          display: "flex",
          flexDirection: "column",
        },
        header: { display: "none" },
        wrapper: { boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.08)" },
        mask: {
          backdropFilter: "blur(2px)",
          background: "rgba(15, 23, 42, 0.35)",
        },
      }}
    >
      {/* HEADER */}
      <div
        className="sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
        style={{
          background:
            "color-mix(in oklab, var(--bg-secondary) 92%, transparent)",
          borderColor: "var(--border-color)",
        }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "var(--bg-blue-50)",
              color: "var(--text-blue-700)",
              border: "1px solid var(--border-blue-200)",
            }}
          >
            <Mail size={18} strokeWidth={2.25} />
          </div>
          <div className="min-w-0">
            <div
              className="text-[15px] font-semibold leading-tight truncate"
              style={{ color: "var(--text-primary)" }}
            >
              Send invoice
            </div>
            <div
              className="text-[12px] mt-0.5 truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              Compose an email for{" "}
              <span
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                {invoice?.invoiceNumber || "—"}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <X size={18} />
        </button>
      </div>

      {/* RECIPIENT STRIP */}
      {customer.email && (
        <div
          className="px-6 py-3 flex items-center gap-3 border-b"
          style={{
            background: "var(--bg-slate-50)",
            borderColor: "var(--border-color)",
          }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{
              background: "var(--bg-blue-50)",
              color: "var(--text-blue-700)",
              border: "1px solid var(--border-blue-200)",
            }}
          >
            {customerInitial}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-[13px] font-semibold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {customer.companyName || customer.name || "Customer"}
            </div>
            <div
              className="text-[11.5px] truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {customer.email}
            </div>
          </div>
          <div
            className="text-[10.5px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md"
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            Recipient
          </div>
        </div>
      )}

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-6 py-5 pb-24">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={isPending}
          className="space-y-4"
        >
          <Form.Item
            label={<FieldLabel required>To</FieldLabel>}
            name="to"
            rules={[
              { required: true, type: "email", message: "A valid email is required" },
            ]}
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={
                <User
                  size={14}
                  style={{
                    color: "var(--text-secondary)",
                    marginRight: 4,
                  }}
                />
              }
              placeholder="recipient@email.com"
              style={inputBase}
            />
          </Form.Item>

          <Form.Item
            label={<FieldLabel required>Subject</FieldLabel>}
            name="subject"
            rules={[{ required: true, message: "Subject is required" }]}
            style={{ marginBottom: 0 }}
          >
            <Input
              prefix={
                <Type
                  size={14}
                  style={{
                    color: "var(--text-secondary)",
                    marginRight: 4,
                  }}
                />
              }
              placeholder="Enter email subject"
              style={inputBase}
            />
          </Form.Item>

          <Form.Item
            label={
              <div className="flex items-center justify-between w-full">
                <FieldLabel required>Message</FieldLabel>
                <span
                  className="text-[10.5px] tabular-nums"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {messageLength.toLocaleString()} chars
                </span>
              </div>
            }
            name="message"
            rules={[
              { required: true, message: "Message cannot be empty" },
            ]}
            style={{ marginBottom: 0 }}
          >
            <TextArea
              rows={10}
              placeholder="Write your message here..."
              onChange={(e) => setMessageLength(e.target.value.length)}
              style={{
                borderRadius: 8,
                background: "var(--bg-secondary)",
                borderColor: "var(--border-color)",
                color: "var(--text-primary)",
                resize: "vertical",
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            />
          </Form.Item>

          {/* ATTACHMENT CARD */}
          <div
            className="rounded-xl p-3 flex items-center gap-3"
            style={{
              background: hasAttachment ? "#ecfdf5" : "var(--bg-blue-50)",
              border: `1px solid ${
                hasAttachment ? "#a7f3d0" : "var(--border-blue-200)"
              }`,
            }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "var(--bg-secondary)",
                color: hasAttachment ? "#047857" : "var(--text-blue-700)",
                border: `1px solid ${
                  hasAttachment ? "#a7f3d0" : "var(--border-blue-200)"
                }`,
              }}
            >
              {hasAttachment ? (
                <CheckCircle2 size={16} strokeWidth={2.25} />
              ) : (
                <Paperclip size={16} strokeWidth={2.25} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div
                className="text-[12.5px] font-semibold leading-tight"
                style={{
                  color: hasAttachment ? "#047857" : "var(--text-blue-700)",
                }}
              >
                {hasAttachment
                  ? "Attachment ready"
                  : "Auto-attached on send"}
              </div>
              <div
                className="text-[11px] mt-0.5 flex items-center gap-1.5"
                style={{
                  color: hasAttachment ? "#047857" : "var(--text-blue-700)",
                  opacity: 0.8,
                }}
              >
                <FileText size={10} />
                <span
                  className="truncate"
                  style={{
                    fontFamily:
                      "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  Invoice_{invoice?.invoiceNumber || "—"}.pdf
                </span>
              </div>
            </div>
            {hasAttachment && (
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--bg-secondary)",
                  color: "#047857",
                  border: "1px solid #a7f3d0",
                }}
              >
                PDF
              </span>
            )}
          </div>
        </Form>
      </div>

      {/* FOOTER */}
      <div
        className="absolute bottom-0 left-0 right-0 px-6 py-3 flex items-center justify-between gap-2 border-t backdrop-blur-md"
        style={{
          background:
            "color-mix(in oklab, var(--bg-secondary) 92%, transparent)",
          borderColor: "var(--border-color)",
        }}
      >
        <div
          className="text-[11.5px] flex items-center gap-1.5"
          style={{ color: "var(--text-secondary)" }}
        >
          <Tooltip title={hasAttachment ? "PDF will be attached" : "PDF will be auto-generated"}>
            <span className="inline-flex items-center gap-1">
              <Paperclip size={11} />
              1 attachment
            </span>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onClose}
            style={{ borderRadius: 8, height: 36 }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<Send size={14} />}
            loading={isPending}
            onClick={() => form.submit()}
            style={{
              borderRadius: 8,
              height: 36,
              fontWeight: 600,
              background: "#2563eb",
              padding: "0 18px",
            }}
          >
            Send email
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
