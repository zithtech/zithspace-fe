


import { Customer } from "@/services/customersService";
import { Modal, Form, Input, Row, Col, Switch } from "antd";

import { useEffect } from "react";

type Props = {
  open: boolean;
  loading: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSave: (values: Omit<Customer, "id" | "tenantId" | "createdBy" | "updatedBy" | "createdAt" | "updatedAt">, id?: string) => void;
};

export default function CustomerModal({ open, loading, customer, onClose, onSave }: Props) {
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





  return (
    <Modal
      title={customer ? "Edit Customer" : "Add Customer"}
      open={open}
      onCancel={onClose}
      okText="Save"
      onOk={async () => {
        try {
          const values = await form.validateFields();
          onSave(values, customer?.id);
        } catch (error) {
          console.log("Validation failed:", error);
        }
      }}
      confirmLoading={loading}
      width={520}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="companyName"
          label="Company Name"
          rules={[
            { required: true, message: "Company name is required" },
            { pattern: /^[A-Za-z0-9\s\-.'&]+$/, message: "Name can only contain letters, numbers, and standard characters" }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Please enter a valid email address' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item 
          name="phone" 
          label="Phone"
          normalize={(value) => (value || '').replace(/[^0-9]/g, '')}
          rules={[
            { pattern: /^[0-9]+$/, message: "Phone number can only contain numeric values" }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="city" label="City">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="country" label="Country">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="taxId" label="Tax ID">
          <Input />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="gstin" 
              label="GSTIN"
              rules={[{ len: 15, message: "GSTIN must be exactly 15 characters" }]}
            >
              <Input maxLength={15} style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="pan" 
              label="PAN"
              rules={[
                { len: 10, message: "PAN must be exactly 10 characters" },
                { pattern: /^[A-Za-z]{5}[0-9]{4}[A-Za-z]{1}$/, message: "Invalid PAN format (e.g. ABCDE1234F)" }
              ]}
            >
              <Input maxLength={10} style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item 
          name="isActive" 
          label="Status" 
          valuePropName="checked"
          className="mb-0"
        >
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Inactive" 
            className="bg-slate-200"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
