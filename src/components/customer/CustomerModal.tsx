import { Modal, Form, Input, Row, Col } from "antd";
import { Customer } from "@/types/invoice";
import { useEffect } from "react";

type Props = {
  open: boolean;
  loading: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSave: (values: any, id?: string) => void;
};

export default function CustomerModal({
  open,
  loading,
  customer,
  onClose,
  onSave,
}: Props) {
  const [form] = Form.useForm();

  // preload values when editing

  useEffect(() => {
    if (customer) {
      form.setFieldsValue(customer);
    } else {
      form.resetFields();
    }
  }, [customer, form]);

  return (
    <Modal
      title={customer ? "Edit Customer" : "Add Customer"}
      open={open}
      onCancel={onClose}
      okText="Save"
      //   onOk={() => {
      //     form.validateFields().then((values) => {
      //       onSave(values, customer?.id);
      //     });
      //   }}
      // ✅ FIXED: Proper async handling
      onOk={async () => {
        try {
          const values = await form.validateFields();
          onSave(values, customer?.id);
        } catch (error) {
          console.log("Validation failed:", error);
          // Modal stays open on validation error (correct behavior)
        }
      }}
      confirmLoading={loading}
      width={520}
      destroyOnClose
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="name"
          label="Company Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="email" label="Email" rules={[{ required: true }]}>
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

        <Form.Item name="taxid" label="Tax ID">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
