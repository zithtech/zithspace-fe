"use client";

import MainLayout from "@/components/layout/MainLayout";
import {
  Space,
  Typography,
  Card,
  Form,
  Select,
  Input,
  Button,
  Row,
  Col,
  DatePicker,
  Switch,
  Tooltip,
  Modal,
  Checkbox,
  message,
} from "antd";
import {
  SubnodeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { currencyOptions } from "@/utils/currencyOptions";

const { Option } = Select;
const { Title } = Typography;

import { useCustomers } from "@/context/CustomerContext";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Customer } from "@/types/invoice";
import CustomerModal from "@/components/customer/CustomerModal";

interface CustomerSnapshot {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxid?: string;
}

interface Invoice {
  invoice_number: string;
  customer_id: string;
  customer_snapshot?: Customer;
  invoice_date?: string;
  due_date?: string;
  recurring_frequency?: string;
  items?: Array<{
    item?: string;
    description?: string;
    qty?: number;
    price?: number;
    tax?: number;
  }>;
  [key: string]: any; // For other dynamic fields
}

export default function InvoiceproNewinvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editInvoiceNumber = searchParams.get("edit");
  const [form] = Form.useForm();
  const customerSnapshot = Form.useWatch("customer_snapshot", form);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { customers, updateCustomer } = useCustomers();
  const [isRecurring, setIsRecurring] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState<Customer | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const DRAFT_KEY = "invoice_draft";

  useEffect(() => {
    if (!customers) return;

    // Clear form first
    form.resetFields();

    if (editInvoiceNumber) {
      const invoices: Invoice[] = JSON.parse(
        localStorage.getItem("invoices") || "[]",
      );

      const invoice = invoices.find(
        (inv) => inv.invoice_number === editInvoiceNumber,
      );

      if (!invoice) {
        message.error("Invoice not found");
        return;
      }

      form.setFieldsValue({
        ...invoice,
        invoice_date: invoice.invoice_date ? dayjs(invoice.invoice_date) : null,
        due_date: invoice.due_date ? dayjs(invoice.due_date) : null,
        customer_id: invoice.customer_id,
        customer_snapshot: invoice.customer_snapshot,
      });

      setIsRecurring(!!invoice.recurring_frequency);
    } else {
      // NEW INVOICE: Set default values
      const defaultValues = {
        invoice_type: "standard",
        currency: "USD",
        items: [
          {
            item: "",
            description: "",
            qty: 1,
            price: 0,
            tax: 0,
          },
        ],
      };

      // Clear any existing items first
      form.setFieldsValue({ items: [] });

      setTimeout(() => {
        form.setFieldsValue(defaultValues);
      }, 0);
    }
  }, [editInvoiceNumber, customers, form]);
  /* ---------------- Currency ---------------- */
  const currency = Form.useWatch("currency", form);
  const currencySymbol =
    currencyOptions.find((c) => c.value === currency)?.symbol || "$";

  /* ---------------- Line Items ---------------- */
  const items = Form.useWatch("items", form) || [];

  const subtotal = items.reduce(
    (sum: number, i: any) => sum + (i?.qty || 0) * (i?.price || 0),
    0,
  );

  const taxTotal = items.reduce((sum: number, i: any) => {
    const line = (i?.qty || 0) * (i?.price || 0);
    return sum + (line * (i?.tax || 0)) / 100;
  }, 0);

  const total = subtotal + taxTotal;
  const paid = 0;
  const balanceDue = total - paid;

  /* ---------------- Customer apply helpers ---------------- */
  const applyToInvoiceOnly = (updatedCustomer: Customer) => {
    form.setFieldsValue({
      customer_snapshot: { ...updatedCustomer },
    });
  };

  const applyToCustomerAndInvoice = (updatedCustomer: Customer) => {
    updateCustomer(updatedCustomer.id, updatedCustomer);
    applyToInvoiceOnly(updatedCustomer);
  };

  const onFinish = (values: any) => {
    // 1️⃣ Get existing invoices
    const invoices: Invoice[] = JSON.parse(
      localStorage.getItem("invoices") || "[]",
    );

    // 2️⃣ Find selected customer from CONTEXT
    const selectedCustomer = customers.find((c) => c.id === values.customer_id);

    // 3️⃣ Safety check (THIS WAS MISSING)
    if (!selectedCustomer) {
      message.error("Customer not found");
      return;
    }

    // 4️⃣ Build invoice object
    const invoicePayload: Invoice = {
      ...values,
      customer_id: selectedCustomer.id,
      customer_snapshot: {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        address: selectedCustomer.address,
        city: selectedCustomer.city,
        country: selectedCustomer.country,
        taxid: selectedCustomer.taxid,
      },
    };

    // 5️⃣ EDIT MODE
    if (editInvoiceNumber) {
      const updatedInvoices = invoices.map((inv) =>
        inv.invoice_number === editInvoiceNumber
          ? { ...inv, ...invoicePayload }
          : inv,
      );

      localStorage.setItem("invoices", JSON.stringify(updatedInvoices));
    }
    // 6️⃣ NEW INVOICE MODE
    else {
      invoices.push(invoicePayload);
      localStorage.setItem("invoices", JSON.stringify(invoices));
    }

    // 7️⃣ Cleanup + redirect
    localStorage.removeItem("invoice_draft");
    message.success("Invoice saved successfully");
    router.push("/invoicepro/invoices");
  };

  const selectedCustomerId = Form.useWatch("customer_id", form);

  const selectedCustomer =
    customerSnapshot || customers.find((c) => c.id === selectedCustomerId);

  return (
    <MainLayout>
      <div className="pt-2 px-4 md:px-6 lg:px-8 pb-6 bg-gray-50 min-h-screen">
        <div className="max-w-[1400px] mx-auto">
          {/* HEADER */}
          <div className="mb-3">
            <Space align="center">
              <SubnodeOutlined style={{ fontSize: 40, color: "#1677ff" }} />
              <Title level={3}>
                {editInvoiceNumber ? "Edit Invoice" : "New Invoice"}
              </Title>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              items: [
                {
                  item: "",
                  description: "",
                  qty: 1,
                  price: 0,
                  tax: 0,
                },
              ],
              invoice_type: "standard",
              currency: "USD",
            }}
            onValuesChange={(_, allValues) => {
              if (editInvoiceNumber) return;

              localStorage.setItem(
                DRAFT_KEY,
                JSON.stringify({
                  ...allValues,
                  invoice_date: allValues.invoice_date?.toISOString?.(),
                  due_date: allValues.due_date?.toISOString?.(),
                }),
              );
            }}
          >
            {/* 🔹 Hidden snapshot without input */}
            <Form.Item name="customer_snapshot" hidden />

            <Row gutter={[16, 16]}>
              {/* CUSTOMER */}
              <Col xs={24} lg={12}>
                <Card title="Customer" style={{ height: "250px" }}>
                  <Form.Item name="customer_id" rules={[{ required: true }]}>
                    <Select
                      placeholder="Select customer"
                      showSearch
                      optionFilterProp="children"
                      onChange={(id) => {
                        const c = customers.find((x) => x.id === id);
                        if (!c) return;

                        form.setFieldsValue({
                          customer_id: id,
                          customer_snapshot: { ...c },
                        });
                      }}
                    >
                      {customers.map((c) => (
                        <Select.Option key={c.id} value={c.id}>
                          {c.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {selectedCustomer && (
                    <Tooltip title="Click to edit">
                      <Card
                        size="small"
                        onClick={() => setEditingCustomer(selectedCustomer)}
                        style={{ cursor: "pointer" }}
                      >
                        <b>{selectedCustomer.name}</b>
                        <div>{selectedCustomer.address}</div>
                        <div>{selectedCustomer.city}</div>
                        <div>{selectedCustomer.taxId}</div>
                      </Card>
                    </Tooltip>
                  )}
                </Card>
              </Col>

              {/* INVOICE DETAILS */}
              <Col xs={24} lg={12}>
                <Card
                  title="Invoice Details"
                  className="rounded-xl shadow-md border border-gray-200"
                  bodyStyle={{ padding: 16 }}
                  style={{ height: 250 }}
                >
                  <Row gutter={[12, 12]}>
                    <Col xs={24} md={12} lg={6}>
                      <Form.Item
                        label="Invoice No"
                        name="invoice_number"
                        rules={[{ required: true }]}
                      >
                        <Input disabled={!!editInvoiceNumber} size="middle" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                      <Form.Item
                        label="Invoice Date"
                        name="invoice_date"
                        rules={[{ required: true }]}
                      >
                        <DatePicker size="middle" className="w-full" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                      <Form.Item
                        label="Due Date"
                        name="due_date"
                        rules={[{ required: true }]}
                      >
                        <DatePicker size="middle" className="w-full" />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                      <Form.Item
                        label="Type"
                        name="invoice_type"
                        rules={[{ required: true }]}
                      >
                        <Select size="middle">
                          <Select.Option value="standard">
                            Standard
                          </Select.Option>
                          <Select.Option value="proforma">
                            Proforma
                          </Select.Option>
                          <Select.Option value="credit_note">
                            Credit Note
                          </Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                      <Form.Item
                        label="Currency"
                        name="currency"
                        //initialValue="USD"
                        rules={[{ required: true }]}
                      >
                        <Select size="middle">
                          {currencyOptions.map((c) => (
                            <Select.Option key={c.value} value={c.value}>
                              {c.symbol} {c.label}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12} lg={6}>
                      <Form.Item label="Recurring Invoice">
                        <Switch
                          checked={isRecurring}
                          onChange={setIsRecurring}
                        />
                      </Form.Item>
                    </Col>

                    {isRecurring && (
                      <Col xs={24} md={12} lg={6}>
                        <Form.Item
                          name="recurring_frequency"
                          rules={[
                            {
                              required: isRecurring,
                              message: "Please select recurring frequency",
                            },
                          ]}
                        >
                          <Select size="middle" placeholder="Select frequency">
                            <Select.Option value="weekly">Weekly</Select.Option>
                            <Select.Option value="monthly">
                              Monthly
                            </Select.Option>
                            <Select.Option value="yearly">Yearly</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* LINE ITEMS */}
            <Row gutter={[16, 16]} className="mt-6">
              <Col span={24}>
                <Card
                  title="Line Items"
                  className="rounded-xl shadow-md border border-gray-200"
                  bodyStyle={{ padding: 0 }}
                >
                  <Form.List name="items">
                    {(fields, { add, remove }) => (
                      <>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-3 text-left">Item</th>
                              <th className="p-3 text-left">Description</th>
                              <th className="p-3 text-center">Qty</th>
                              <th className="p-3 text-center">
                                Price ({currencySymbol})
                              </th>
                              <th className="p-3 text-center">Tax %</th>
                              <th className="p-3 text-right">
                                Total ({currencySymbol})
                              </th>
                              <th className="w-12"></th>
                            </tr>
                          </thead>

                          <tbody>
                            {fields.map(({ key, name }) => (
                              <tr
                                key={key}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="p-2">
                                  <Form.Item
                                    name={[name, "item"]}
                                    rules={[{ required: true }]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input />
                                  </Form.Item>
                                </td>

                                <td className="p-2">
                                  <Form.Item
                                    name={[name, "description"]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input />
                                  </Form.Item>
                                </td>

                                <td className="p-2">
                                  <Form.Item
                                    name={[name, "qty"]}
                                    rules={[{ required: true }]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input type="number" min={1} />
                                  </Form.Item>
                                </td>

                                <td className="p-2">
                                  <Form.Item
                                    name={[name, "price"]}
                                    rules={[{ required: true }]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input
                                      type="number"
                                      addonBefore={currencySymbol}
                                    />
                                  </Form.Item>
                                </td>

                                <td className="p-2">
                                  <Form.Item
                                    name={[name, "tax"]}
                                    style={{ marginBottom: 0 }}
                                  >
                                    <Input type="number" addonAfter="%" />
                                  </Form.Item>
                                </td>

                                <td className="p-2 text-right font-medium">
                                  {currencySymbol}{" "}
                                  {(
                                    (form.getFieldValue([
                                      "items",
                                      name,
                                      "qty",
                                    ]) || 0) *
                                    (form.getFieldValue([
                                      "items",
                                      name,
                                      "price",
                                    ]) || 0) *
                                    (1 +
                                      (form.getFieldValue([
                                        "items",
                                        name,
                                        "tax",
                                      ]) || 0) /
                                        100)
                                  ).toFixed(2)}
                                </td>

                                <td className="text-center">
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={fields.length === 1}
                                    onClick={() => remove(name)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="flex justify-between m-3">
                          <div>
                            <Button
                              type="dashed"
                              size="large"
                              onClick={() =>
                                add({ item: "", qty: 1, price: 0, tax: 0 })
                              }
                            >
                              + Add Item
                            </Button>
                          </div>
                          <div className="font-semibold text-lg">
                            Total:{" "}
                            <span className="text-blue-600">
                              {currencySymbol} {total.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="border-t px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">
                              Global Discount
                            </span>
                            <Form.Item
                              name="discount"
                              style={{ marginBottom: 0 }}
                            >
                              <Input
                                type="number"
                                min={0}
                                addonAfter={currencySymbol}
                                placeholder="0"
                                style={{ width: 140 }}
                              />
                            </Form.Item>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">
                              Tax Inclusive
                            </span>
                            <Form.Item
                              name="tax_inclusive"
                              valuePropName="checked"
                              style={{ marginBottom: 0 }}
                            >
                              <Switch />
                            </Form.Item>
                          </div>
                        </div>
                      </>
                    )}
                  </Form.List>
                </Card>
              </Col>
            </Row>

            {/* NOTES */}
            <Row gutter={[16, 16]} className="mt-6">
              <Col span={24}>
                <Card
                  title="Notes & Terms"
                  className="rounded-xl shadow-md border border-gray-200"
                  bodyStyle={{ padding: 16 }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="Notes" name="notes">
                        <Input.TextArea rows={3} />
                      </Form.Item>
                    </Col>

                    <Col xs={24} md={12}>
                      <Form.Item label="Terms & Conditions" name="terms">
                        <Input.TextArea rows={3} />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <div className="pb-28" />

            <div className="sticky bottom-0 border-t bg-white z-30">
              <div
                className="max-w-[1500px] mx-auto flex items-center justify-end
     px-6 py-3 text-base"
              >
                <div className="flex gap-3">
                  <Button type="primary" size="middle" htmlType="submit">
                    Submit for Approval
                  </Button>
                  <Button
                    size="middle"
                    onClick={() => {
                      const values = form.getFieldsValue(true);
                      localStorage.setItem(
                        DRAFT_KEY,
                        JSON.stringify({
                          ...values,
                          invoice_date: values.invoice_date?.toISOString?.(),
                          due_date: values.due_date?.toISOString?.(),
                        }),
                      );
                      message.success("Draft saved");
                    }}
                  >
                    Save as Draft
                  </Button>

                  <Button danger size="middle" htmlType="button">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Form>
        </div>

        {/* CUSTOMER EDIT MODAL */}
        <CustomerModal
          open={!!editingCustomer}
          customer={editingCustomer}
          loading={false}
          onClose={() => setEditingCustomer(null)}
          onSave={(values, id) => {
            if (!id || !editingCustomer) return;

            const updatedCustomer = { ...editingCustomer, ...values };
            const pref = localStorage.getItem("customer_update_preference");

            if (pref === "apply_both") {
              applyToCustomerAndInvoice(updatedCustomer);
              setEditingCustomer(null);
              return;
            }

            if (pref === "invoice_only") {
              applyToInvoiceOnly(updatedCustomer);
              setEditingCustomer(null);
              return;
            }

            setPendingCustomer(updatedCustomer);
            setShowApplyModal(true);
          }}
        />

        <Modal
          open={showApplyModal}
          title="Apply changes to customer?"
          onCancel={() => {
            setShowApplyModal(false);
            setPendingCustomer(null);
          }}
          footer={[
            <Button
              key="invoice"
              onClick={() => {
                if (!pendingCustomer) return;
                if (rememberChoice)
                  localStorage.setItem(
                    "customer_update_preference",
                    "invoice_only",
                  );
                applyToInvoiceOnly(pendingCustomer);
                setShowApplyModal(false);
                setEditingCustomer(null);
              }}
            >
              Invoice only
            </Button>,
            <Button
              key="both"
              type="primary"
              onClick={() => {
                if (!pendingCustomer) return;
                if (rememberChoice)
                  localStorage.setItem(
                    "customer_update_preference",
                    "apply_both",
                  );
                applyToCustomerAndInvoice(pendingCustomer);
                setShowApplyModal(false);
                setEditingCustomer(null);
              }}
            >
              Apply to customer
            </Button>,
          ]}
        >
          <p>Apply these changes to customer record?</p>
          <Checkbox
            checked={rememberChoice}
            onChange={(e) => setRememberChoice(e.target.checked)}
          >
            Remember my choice
          </Checkbox>
        </Modal>
      </div>
    </MainLayout>
  );
}
