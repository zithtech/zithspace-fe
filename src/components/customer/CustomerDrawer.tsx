import { Customer } from "@/services/customersService";
import { Drawer, Form, Input, Row, Col, Switch, Button, Typography } from "antd";
import { useEffect } from "react";
import { Building2, Mail, Phone, MapPin, Globe, FileText, CheckCircle2, UserPlus, X } from "lucide-react";

const { Title, Text } = Typography;

type Props = {
  open: boolean;
  loading: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSave: (values: Omit<Customer, "id" | "tenantId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">, id?: string) => void;
};

export default function CustomerDrawer({ open, loading, customer, onClose, onSave }: Props) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (!open) return; // only trigger on open

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

  return (
    <Drawer
      title={null}
      closable={false}
      placement="right"
      onClose={onClose}
      open={open}
      width={480}
      styles={{
        body: { padding: 0, backgroundColor: 'var(--customers-page-bg)', display: 'flex', flexDirection: 'column' }
      }}
      destroyOnClose
    >
      {/* HEADER */}
      <div className="px-6 py-5 shadow-sm" style={{ backgroundColor: 'var(--customers-card-bg)', borderBottom: '1px solid var(--customers-card-border)', zIndex: 10 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center border" style={{ backgroundColor: 'var(--customers-header-icon-color)', borderColor: 'var(--customers-header-icon-color)' }}>
              {customer ? <Building2 size={20} className="text-white" /> : <UserPlus size={20} className="text-white" />}
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>
                {customer ? "Edit Profile" : "Add Customer"}
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {customer ? `Updating details for ${customer.companyName}` : "Create a new client profile"}
              </Text>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors border-none"
            style={{ backgroundColor: 'var(--bg-slate-50)', color: 'var(--text-slate-400)' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto px-6 py-6" style={{ backgroundColor: 'var(--bg-slate-50)' }}>
        <Form layout="vertical" form={form} requiredMark={false}>
          
          {/* GENERAL INFO BLOCK */}
          <div className="p-5 rounded-2xl border shadow-sm mb-5" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-1 rounded-md" style={{ backgroundColor: 'var(--bg-blue-50)', color: 'var(--text-sky-500)' }}>
                <Building2 size={14} />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-slate-400)' }}>Basic Information</span>
            </div>

            <Form.Item
              name="companyName"
              label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Company / Client Name</span>}
              rules={[
                { required: true, message: "Company name is required" },
                { pattern: /^[A-Za-z0-9\s\-.'&]+$/, message: "No special characters allowed" }
              ]}
              className="mb-4"
            >
              <Input placeholder="Acme Corp" className="h-10 rounded-xl" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Email Address</span>}
                  rules={[{ type: 'email', message: 'Invalid email' }]}
                  className="mb-0"
                >
                  <Input prefix={<Mail size={14} style={{ color: 'var(--text-slate-400)', marginRight: 4 }} />} placeholder="client@example.com" className="h-10 rounded-xl" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="phone" 
                  label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Phone Number</span>}
                  normalize={(value) => (value || '').replace(/[^0-9+-\s()]/g, '')}
                  className="mb-0"
                >
                  <Input prefix={<Phone size={14} style={{ color: 'var(--text-slate-400)', marginRight: 4 }} />} placeholder="+1 234 567 890" className="h-10 rounded-xl" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* ADDRESS BLOCK */}
          <div className="p-5 rounded-2xl border shadow-sm mb-5" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-1 rounded-md" style={{ backgroundColor: 'var(--drawer-icon-bg-indigo)', color: 'var(--drawer-icon-text-indigo)' }}>
                <MapPin size={14} />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-slate-400)' }}>Location Settings</span>
            </div>

            <Form.Item name="address" label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Street Address</span>} className="mb-4">
              <Input placeholder="123 Business Avenue, Suite 400" className="h-10 rounded-xl" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="city" label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>City / District</span>} className="mb-0">
                  <Input placeholder="New York" className="h-10 rounded-xl" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="country" label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Country</span>} className="mb-0">
                  <Input prefix={<Globe size={14} style={{ color: 'var(--text-slate-400)', marginRight: 4 }} />} placeholder="USA" className="h-10 rounded-xl" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* TAX INFO BLOCK */}
          <div className="p-5 rounded-2xl border shadow-sm mb-5" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="p-1 rounded-md" style={{ backgroundColor: 'var(--accounts-emerald-bg)', color: 'var(--accounts-emerald-text)' }}>
                <FileText size={14} />
              </div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--text-slate-400)' }}>Tax Identifiers</span>
            </div>

            <Form.Item name="taxId" label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Tax ID Number</span>} className="mb-4">
              <Input className="h-10 rounded-xl font-mono text-sm uppercase" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item 
                  name="gstin" 
                  label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>GSTIN</span>}
                  rules={[{ len: 15, message: "Exactly 15 characters required" }]}
                  className="mb-0"
                >
                  <Input maxLength={15} className="h-10 rounded-xl font-mono text-sm uppercase" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item 
                  name="pan" 
                  label={<span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>PAN</span>}
                  rules={[
                    { len: 10, message: "Exactly 10 characters" },
                    { pattern: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, message: "Format: ABCDE1234F" }
                  ]}
                  className="mb-0"
                >
                  <Input maxLength={10} className="h-10 rounded-xl font-mono text-sm uppercase" style={{ backgroundColor: 'var(--bg-slate-50)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* STATUS BLOCK */}
          <div className="p-4 rounded-2xl border shadow-sm flex items-center justify-between" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)' }}>
            <div>
              <span className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>Account Status</span>
              <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Enable or disable client profile</span>
            </div>
            <Form.Item 
              name="isActive" 
              valuePropName="checked"
              className="mb-0"
            >
              <Switch checkedChildren={<CheckCircle2 size={12} />} unCheckedChildren="OFF" />
            </Form.Item>
          </div>

        </Form>
      </div>

      {/* FOOTER */}
      <div className="px-6 py-4 border-t flex justify-end gap-3 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)]" style={{ backgroundColor: 'var(--customers-card-bg)', borderColor: 'var(--customers-card-border)', zIndex: 10 }}>
        <Button 
          onClick={onClose}
          className="h-11 px-6 rounded-xl font-semibold border-none"
          style={{ backgroundColor: 'var(--bg-slate-100)', color: 'var(--text-secondary)' }}
        >
          Cancel
        </Button>
        <Button 
          type="primary" 
          onClick={handleSave}
          loading={loading}
          className="h-11 px-8 rounded-xl font-semibold border-none"
          style={{ backgroundColor: 'var(--customers-header-icon-color)' }}
        >
          {customer ? "Save Changes" : "Add Customer"}
        </Button>
      </div>

    </Drawer>
  );
}
