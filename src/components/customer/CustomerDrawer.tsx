import { Customer } from "@/services/customersService";
import { Drawer, Form, Input, Switch, Button } from "antd";
import { useEffect } from "react";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  UserPlus,
  X,
  IdCard,
} from "lucide-react";

type Props = {
  open: boolean;
  loading: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSave: (
    values: Omit<
      Customer,
      "id" | "tenantId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt"
    >,
    id?: string
  ) => void;
};

export default function CustomerDrawer({
  open,
  loading,
  customer,
  onClose,
  onSave,
}: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return;

    if (customer) {
      form.setFieldsValue({
        companyName: customer.companyName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        country: customer.country,
        taxId: customer.taxId,
        gstin: customer.gstin,
        pan: customer.pan,
        isActive: customer.isActive ?? true,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
  }, [open, customer, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave(values, customer?.id);
    } catch (error) {
      console.log("Validation failed:", error);
    }
  };

  const SectionHeader = ({
    num,
    title,
    subtitle,
  }: {
    num: string;
    title: string;
    subtitle?: string;
  }) => (
    <div
      className="mx-5 pt-4 pb-3 flex items-start gap-3 mb-2"
      style={{ borderBottom: "1px dashed var(--border-color)" }}
    >
      <div
        className="w-7 h-7 flex-shrink-0 rounded-lg flex items-center justify-center text-[11px] font-extrabold"
        style={{
          background: "rgba(59,130,246,0.10)",
          color: "#3b82f6",
          border: "1px solid rgba(59,130,246,0.22)",
        }}
      >
        {num}
      </div>
      <div>
        <div
          className="text-[13px] font-bold leading-tight"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className="text-[11px] font-medium mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
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
    textTransform: "uppercase" as const,
  };

  return (
    <>
      <style>{`
        .customer-drawer-form .ant-form-item-label > label {
          font-size: 11.5px !important;
          font-weight: 600 !important;
          color: var(--text-slate-400, #94a3b8) !important;
          letter-spacing: .02em;
          height: 18px !important;
        }
        [data-theme='dark'] .customer-drawer-card {
          background: transparent !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .customer-drawer-card > div:first-child {
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .customer-drawer-root .ant-drawer-content,
        [data-theme='dark'] .customer-drawer-root .ant-drawer-body {
          background: #020617 !important;
        }
        [data-theme='dark'] .customer-drawer-header,
        [data-theme='dark'] .customer-drawer-footer {
          background: #0b0f19 !important;
          border-color: #1f2937 !important;
        }
        [data-theme='dark'] .customer-drawer-form .ant-input {
          background: transparent !important;
          border-color: #1f2937 !important;
          color: #f3f4f6 !important;
        }
      `}</style>
      <Drawer
      rootClassName="customer-drawer-root"
      title={null}
      closable={false}
      placement="right"
      onClose={onClose}
      open={open}
      width={720}
      styles={{
        body: {
          padding: 0,
          background: "var(--customers-page-bg)",
          display: "flex",
          flexDirection: "column",
        },
        wrapper: { boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.08)" },
        mask: {
          backdropFilter: "blur(2px)",
          background: "rgba(15, 23, 42, 0.35)",
        },
      }}
      destroyOnHidden
    >
      {/* HEADER */}
      <div
        className="customer-drawer-header sticky top-0 z-10 px-6 py-4 flex items-start justify-between gap-3 border-b backdrop-blur-md"
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
            {customer ? (
              <Building2 size={18} strokeWidth={2.25} />
            ) : (
              <UserPlus size={18} strokeWidth={2.25} />
            )}
          </div>
          <div className="min-w-0">
            <div
              className="text-[15px] font-semibold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {customer ? "Edit customer" : "Add customer"}
            </div>
            <div
              className="text-[12px] mt-0.5 truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {customer
                ? `Updating details for ${customer.companyName}`
                : "Create a new client profile"}
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

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <Form
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          colon={false}
          form={form}
          requiredMark={false}
          className="customer-drawer-form flex flex-col gap-5"
          autoComplete="off"
        >
          {/* COMPANY */}
          <div
            className="customer-drawer-card rounded-none overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <SectionHeader
              num="01"
              title="Company"
              subtitle="Identify the customer"
            />
            <div className="px-5 py-5 space-y-4">
              <Form.Item
                name="companyName"
                label="Company / Client name"
                rules={[
                  { required: true, message: "Company name is required" },
                  {
                    pattern: /^[A-Za-z0-9\s\-.'&]+$/,
                    message: "No special characters allowed",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Acme Corp" style={inputBase} autoComplete="off" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email address"
                rules={[{ type: "email", message: "Invalid email" }]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  prefix={
                    <Mail
                      size={14}
                      style={{
                        color: "var(--text-secondary)",
                        marginRight: 4,
                      }}
                    />
                  }
                  placeholder="client@example.com"
                  style={inputBase}
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                name="phone"
                label="Phone number"
                normalize={(value) =>
                  (value || "").replace(/[^0-9+\-]/g, "")
                }
                rules={[
                  {
                    pattern: /^[+]?[0-9][0-9\-]{5,18}$/,
                    message: "Enter a valid phone number (digits and + or - only)",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  prefix={
                    <Phone
                      size={14}
                      style={{
                        color: "var(--text-secondary)",
                        marginRight: 4,
                      }}
                    />
                  }
                  placeholder="+1 234 567 890"
                  maxLength={20}
                  style={inputBase}
                  autoComplete="off"
                />
              </Form.Item>
            </div>
          </div>

          {/* ADDRESS */}
          <div
            className="customer-drawer-card rounded-none overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <SectionHeader
              num="02"
              title="Billing address"
              subtitle="Where invoices are sent"
            />
            <div className="px-5 py-5 space-y-4">
              <Form.Item
                name="address"
                label="Street address"
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="123 Business Avenue, Suite 400"
                  style={inputBase}
                  autoComplete="off"
                />
              </Form.Item>

              <Form.Item
                name="city"
                label="City / district"
                rules={[
                  {
                    pattern: /^[A-Za-z\s\-'.]+$/,
                    message: "City must contain only letters",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="New York" style={inputBase} autoComplete="off" />
              </Form.Item>
              <Form.Item
                name="country"
                label="Country"
                rules={[
                  {
                    pattern: /^[A-Za-z\s\-'.]+$/,
                    message: "Country must contain only letters",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  prefix={
                    <Globe
                      size={14}
                      style={{
                        color: "var(--text-secondary)",
                        marginRight: 4,
                      }}
                    />
                  }
                  placeholder="USA"
                  style={inputBase}
                  autoComplete="off"
                />
              </Form.Item>
            </div>
          </div>

          {/* TAX */}
          <div
            className="customer-drawer-card rounded-none overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <SectionHeader
              num="03"
              title="Tax identifiers"
              subtitle="Used on printed invoices"
            />
            <div className="px-5 py-5 space-y-4">
              <Form.Item
                name="taxId"
                label="Tax ID number"
                normalize={(value) =>
                  (value || "").replace(/[^A-Za-z0-9\-]/g, "").toUpperCase()
                }
                rules={[
                  {
                    pattern: /^[A-Za-z0-9\-]{1,30}$/,
                    message: "Tax ID must be alphanumeric (max 30 characters, no special characters)",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input style={monoInput} placeholder="—" maxLength={30} autoComplete="off" />
              </Form.Item>

              <Form.Item
                name="gstin"
                label="GSTIN"
                normalize={(value) =>
                  (value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                }
                rules={[
                  { len: 15, message: "GSTIN must be exactly 15 characters" },
                  {
                    pattern: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                    message: "Invalid GSTIN format (e.g. 22ABCDE1234F1Z5)",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  maxLength={15}
                  style={monoInput}
                  placeholder="22ABCDE1234F1Z5"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                name="pan"
                label="PAN"
                normalize={(value) =>
                  (value || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                }
                rules={[
                  { len: 10, message: "Exactly 10 characters" },
                  {
                    pattern: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/,
                    message: "Format: ABCDE1234F",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  maxLength={10}
                  style={monoInput}
                  placeholder="ABCDE1234F"
                  autoComplete="off"
                />
              </Form.Item>
            </div>
          </div>

          {/* STATUS */}
          <div
            className="customer-drawer-card rounded-none overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <SectionHeader
              num="04"
              title="Visibility"
              subtitle="Profile state"
            />
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <div
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Active customer
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Available when creating new invoices
                </div>
              </div>
              <Form.Item
                name="isActive"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch size="small" />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>

      {/* FOOTER */}
      <div
        className="customer-drawer-footer absolute bottom-0 left-0 right-0 px-6 py-3 flex items-center justify-end gap-2 border-t"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border-color)",
        }}
      >
        <Button
          onClick={onClose}
          style={{ borderRadius: 8, height: 36 }}
        >
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={handleSave}
          loading={loading}
          style={{
            borderRadius: 8,
            height: 36,
            fontWeight: 600,
            background: "#2563eb",
            padding: "0 18px",
          }}
        >
          {customer ? "Save changes" : "Add customer"}
        </Button>
      </div>
    </Drawer>
    </>
  );
}
