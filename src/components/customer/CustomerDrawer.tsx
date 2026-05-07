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
        className="w-7 h-7 rounded-lg flex items-center justify-center"
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
    textTransform: "uppercase" as const,
  };

  return (
    <Drawer
      title={null}
      closable={false}
      placement="right"
      onClose={onClose}
      open={open}
      width={560}
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
          layout="vertical"
          form={form}
          requiredMark={false}
          className="flex flex-col gap-5"
        >
          {/* COMPANY */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <SectionHeader
              icon={Building2}
              title="Company"
              subtitle="Identify the customer"
            />
            <div className="px-5 py-5 space-y-4">
              <Form.Item
                name="companyName"
                label={<FieldLabel>Company / Client name</FieldLabel>}
                rules={[
                  { required: true, message: "Company name is required" },
                  {
                    pattern: /^[A-Za-z0-9\s\-.'&]+$/,
                    message: "No special characters allowed",
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Acme Corp" style={inputBase} />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="email"
                  label={<FieldLabel>Email address</FieldLabel>}
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
                  />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label={<FieldLabel>Phone number</FieldLabel>}
                  normalize={(value) =>
                    (value || "").replace(/[^0-9+\-\s()]/g, "")
                  }
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
                    style={inputBase}
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* ADDRESS */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <SectionHeader
              icon={MapPin}
              title="Billing address"
              subtitle="Where invoices are sent"
            />
            <div className="px-5 py-5 space-y-4">
              <Form.Item
                name="address"
                label={<FieldLabel>Street address</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="123 Business Avenue, Suite 400"
                  style={inputBase}
                />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="city"
                  label={<FieldLabel>City / district</FieldLabel>}
                  style={{ marginBottom: 0 }}
                >
                  <Input placeholder="New York" style={inputBase} />
                </Form.Item>
                <Form.Item
                  name="country"
                  label={<FieldLabel>Country</FieldLabel>}
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
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* TAX */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <SectionHeader
              icon={IdCard}
              title="Tax identifiers"
              subtitle="Used on printed invoices"
            />
            <div className="px-5 py-5 space-y-4">
              <Form.Item
                name="taxId"
                label={<FieldLabel>Tax ID number</FieldLabel>}
                style={{ marginBottom: 0 }}
              >
                <Input style={monoInput} placeholder="—" />
              </Form.Item>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="gstin"
                  label={<FieldLabel>GSTIN</FieldLabel>}
                  rules={[
                    { len: 15, message: "Exactly 15 characters required" },
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <Input
                    maxLength={15}
                    style={monoInput}
                    placeholder="22ABCDE1234F1Z5"
                  />
                </Form.Item>
                <Form.Item
                  name="pan"
                  label={<FieldLabel>PAN</FieldLabel>}
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
                  />
                </Form.Item>
              </div>
            </div>
          </div>

          {/* STATUS */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <SectionHeader
              icon={FileText}
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
        className="absolute bottom-0 left-0 right-0 px-6 py-3 flex items-center justify-end gap-2 border-t"
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
  );
}
