


import { Customer } from "@/services/customersService";
import { Modal, Form, Input, Row, Col } from "antd";

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
    });
  } else {
    form.resetFields();
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
          rules={[{ required: true, message: "Company name is required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          
        >
          <Input />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
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
            <Form.Item name="gstin" label="GSTIN">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="pan" label="PAN">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}
