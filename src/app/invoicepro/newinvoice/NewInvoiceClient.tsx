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
  App
} from "antd";
import {
  SubnodeOutlined,
  DeleteOutlined,
 
} from "@ant-design/icons";
import { currencyOptions } from "@/utils/currencyOptions";
import {
  useInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useNextInvoiceNumber,
  useInvoice,
  
} from "@/hooks/useInvoices";




const { Title } = Typography;


import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

import CustomerModal from "@/components/customer/CustomerModal";
import { CustomersService, Customer ,UpdateCustomerData} from "@/services/customersService";
import { useCustomers, useUpdateCustomer } from "@/hooks/use-customers";
import { message as antdMessage } from "antd";
import { InvoiceType } from "@/services/invoiceService";




interface CustomerDraft {
  id: string;
  companyName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxId?: string | null;
}




export default function InvoiceproNewinvoicePage() {
  const router = useRouter();

  const searchParams = useSearchParams();

const editInvoiceId = searchParams.get("edit");


  const [form] = Form.useForm();
  const customerSnapshot = Form.useWatch("customer_snapshot", form);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const { message } = App.useApp();

  const [isRecurring, setIsRecurring] = useState(false);
  const [pendingCustomer, setPendingCustomer] = useState<CustomerDraft | null>(null);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);


const updateCustomerMutation = useUpdateCustomer();
const createInvoiceMutation = useCreateInvoice();
const updateInvoiceMutation = useUpdateInvoice();



const { data: customersData, isLoading: loadingCustomers } = useCustomers();
const customers = customersData?.data || [];

// const { data: invoicesData, isLoading: loadingInvoices } = useInvoices();
// const invoices = invoicesData?.data || [];

const { data: invoiceDetail, isLoading: loadingInvoice } =
  useInvoice(editInvoiceId!, !!editInvoiceId);


// Ensure you are destructuring 'data' and naming it 'nextInvoice'
const { data: nextInvoice } = useNextInvoiceNumber(!editInvoiceId);



  const DRAFT_KEY = "invoice_draft";






useEffect(() => {
  // Only auto-fill if we are NOT in edit mode
  if (!editInvoiceId && nextInvoice?.invoiceNumber) {
    form.setFieldsValue({
      invoiceNumber: nextInvoice.invoiceNumber,
    });
  }
}, [nextInvoice, editInvoiceId, form]);






// useEffect(() => {
//   if (!editInvoiceId || !invoices.length) return;

//   const invoice = invoices.find((inv) => inv.id === editInvoiceId);
//   if (!invoice) return;

//   if (!invoice.items || invoice.items.length === 0) {
//   form.setFieldsValue({
//     items: [{ item: "", description: "", qty: 1, price: 0, tax: 0 }],
//   });
// }

//   form.setFieldsValue({
//     invoiceNumber: invoice.invoiceNumber,
//     invoice_date: invoice.invoiceDate ? dayjs(invoice.invoiceDate) : null,
//     due_date: invoice.dueDate ? dayjs(invoice.dueDate) : null,
//     invoice_type: invoice.invoiceType?.toLowerCase(),
//     currency: invoice.currency,
//     discount: invoice.discount ?? 0,
//     notes: invoice.notes,
//     terms: invoice.terms,

//     customer_id: invoice.customerId,
//     customer_snapshot: invoice.customerSnapshot,

//     // ✅ THIS IS THE IMPORTANT PART
//     items: invoice.items?.map((i: any) => ({
//       item: i.item,
//       description: i.description,
//       qty: i.qty,
//       price: i.price,
//       tax: i.tax,
//     })) || [],
//   });

//   setIsRecurring(!!invoice.recurringFrequency);
// }, [editInvoiceId, invoices, form]);

// useEffect(() => {
//   if (!editInvoiceId || !invoiceDetail) return;

// const mappedItems =
//   invoiceDetail.items?.length > 0
//     ? invoiceDetail.items.map((i) => ({
//         id: i.id,                 // ✅ REQUIRED
//         item: i.item,
//         description: i.description,
//         qty: i.qty,
//         price: i.price,
//         tax: i.tax,
//       }))
//     : [{ item: "", description: "", qty: 1, price: 0, tax: 0 }];


//   console.log("MAPPED ITEMS:", mappedItems);

//   form.setFieldsValue({
//     invoiceNumber: invoiceDetail.invoiceNumber,
//     invoice_date: invoiceDetail.invoiceDate
//       ? dayjs(invoiceDetail.invoiceDate)
//       : null,
//     due_date: invoiceDetail.dueDate
//       ? dayjs(invoiceDetail.dueDate)
//       : null,

//     customer_id: invoiceDetail.customerId,
//     customer_snapshot: invoiceDetail.customerSnapshot,
//     currency: invoiceDetail.currency,
//     discount: invoiceDetail.discount ?? 0,
//     notes: invoiceDetail.notes,
//     terms: invoiceDetail.terms,

//     // 🔥 THIS
//     items: mappedItems,
//   });
// }, [editInvoiceId, invoiceDetail, form]);

useEffect(() => {
  // 1. EDIT MODE: Wait for invoiceDetail to be available
  if (editInvoiceId) {
    if (invoiceDetail) {
      const mappedItems = invoiceDetail.items?.length > 0
        ? invoiceDetail.items.map((i) => ({
            id: i.id,
            item: i.item,
            description: i.description,
            qty: i.qty,
            price: i.price,
            tax: i.tax,
          }))
        : [{ item: "", description: "", qty: 1, price: 0, tax: 0 }];

      form.setFieldsValue({
        ...invoiceDetail, // Spreads basic fields like notes, terms, etc.
    customer_id: invoiceDetail.customerId,
    customer_snapshot: invoiceDetail.customerSnapshot,
        invoice_date: invoiceDetail.invoiceDate ? dayjs(invoiceDetail.invoiceDate) : null,
        due_date: invoiceDetail.dueDate ? dayjs(invoiceDetail.dueDate) : null,
        invoice_type: invoiceDetail.invoiceType?.toLowerCase(),
        items: mappedItems,
      });
    }
  } 
  // 2. CREATE MODE: Explicitly set the default row
  else {
    // Check if we already have items (e.g. from a draft or user input) 
    // to prevent overwriting user progress
    const currentItems = form.getFieldValue("items");
    if (!currentItems || currentItems.length === 0) {
      form.setFieldsValue({
        items: [{ item: "", description: "", qty: 1, price: 0, tax: 0 }],
        invoice_type: "standard",
        currency: "USD",
      });
    }
  }
}, [editInvoiceId, invoiceDetail, form]);

const sanitizeCustomerPayload = (
  values: any
): UpdateCustomerData => ({
  companyName: values.companyName,
  email: values.email ?? undefined,
  phone: values.phone ?? undefined,
  address: values.address ?? undefined,
  city: values.city ?? undefined,
  country: values.country ?? undefined,
  taxId: values.taxId ?? undefined,
});





  
  
  






  /* ---------------- Currency ---------------- */
  const currency = Form.useWatch("currency", form);
  const currencySymbol =
    currencyOptions.find((c) => c.value === currency)?.symbol || "$";

  /* ---------------- Line Items ---------------- */
/* ---------------- Line Items ---------------- */
const items = Form.useWatch("items", form) || [];
const discount = Number(Form.useWatch("discount", form) || 0);

// Calculate subtotal
const subtotal = items.reduce(
  (sum: number, i: any) => sum + (Number(i.qty || 0) * Number(i.price || 0)),
  0
);

// Calculate tax total
const taxTotal = items.reduce((sum: number, i: any) => {
  const lineTotal = Number(i.qty || 0) * Number(i.price || 0);
  return sum + (lineTotal * (Number(i.tax || 0) / 100));
}, 0);

// Total after tax and discount
const total = subtotal + taxTotal - discount;

// Paid and balance
const paid = 0;
const balanceDue = total - paid;


  /* ---------------- Customer apply helpers ---------------- */


 
const applyToInvoiceOnly = (updatedCustomer: CustomerDraft) => {
  form.setFieldsValue({
    customer_snapshot: {
      id: updatedCustomer.id,
      companyName: updatedCustomer.companyName,
      email: updatedCustomer.email ?? undefined,
      phone: updatedCustomer.phone ?? undefined,
      address: updatedCustomer.address ?? undefined,
      city: updatedCustomer.city ?? undefined,
      country: updatedCustomer.country ?? undefined,
      taxId: updatedCustomer.taxId ?? undefined,
    },
  });

  antdMessage.success("Applied to invoice snapshot");
};











const applyToCustomerAndInvoice = async (draft: CustomerDraft) => {
  const payload: UpdateCustomerData = {
    companyName: draft.companyName,
    email: draft.email ?? undefined,
    phone: draft.phone ?? undefined,
    address: draft.address ?? undefined,
    city: draft.city ?? undefined,
    country: draft.country ?? undefined,
    taxId: draft.taxId ?? undefined,
  };

  try {
    const savedCustomer = await updateCustomerMutation.mutateAsync({
      id: draft.id,
      data: payload,
    });

    form.setFieldsValue({
      customer_snapshot: {
        id: savedCustomer.id,
        companyName: savedCustomer.companyName,
        email: savedCustomer.email,
        phone: savedCustomer.phone,
        address: savedCustomer.address,
        city: savedCustomer.city,
        country: savedCustomer.country,
        taxId: savedCustomer.taxId,
      },
    });

    antdMessage.success("Customer record and invoice updated");
  } catch {
    antdMessage.error("Failed to update customer database");
  }
};

 











const onFinish = async (values: any) => {
  // Map "credit_note" from UI to "CREDIT" for Prisma Enum

  let finalSnapshot = values.customer_snapshot;
  if (!finalSnapshot && values.customer_id) {
    const c = customers.find((x: any) => x.id === values.customer_id);
    if (c) {
      finalSnapshot = {
        id: c.id,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        address: c.address,
        city: c.city,
        country: c.country,
        taxId: c.taxId,
      };
    }
  }
  const mappedType = values.invoice_type?.toUpperCase().replace("_NOTE", "") as InvoiceType;

 const payload: any = {
    invoiceNumber: values.invoiceNumber,
    invoiceDate: values.invoice_date?.toISOString(),
    dueDate: values.due_date?.toISOString(),
    invoiceType: (values.invoice_type?.toUpperCase().replace("_NOTE", "") || "STANDARD"),
    currency: values.currency || "USD",
    discount: Number(values.discount || 0),
    notes: values.notes || "",
    terms: values.terms || "",
    
    customerId: values.customer_id,
    // Change "customerData" to "customerSnapshot" to match your Interface/DB
    customerSnapshot: finalSnapshot, 

 items: (values.items || []).map((item: any) => ({
  id: item.id,                 // ✅ KEEP ID
  item: item.item || "Untitled Item",
  description: item.description || "",
  qty: Number(item.qty || 1),
  price: Number(item.price || 0),
  tax: Number(item.tax || 0),
}))
,
  };

  try {
    if (editInvoiceId) {
      await updateInvoiceMutation.mutateAsync({ 
        id: editInvoiceId, 
        data: payload 
      });
      antdMessage.success("Invoice updated successfully");
    } else {
      await createInvoiceMutation.mutateAsync(payload);
      antdMessage.success("Invoice created successfully");
    }
    
    localStorage.removeItem(DRAFT_KEY);
    router.push("/invoicepro/invoices");
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message || "Submission Failed";
    console.error("Submission Error:", error);
    antdMessage.error(errorMsg);
  }
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
                {editInvoiceId ? "Edit Invoice" : "New Invoice"}
              </Title>
            </Space>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            onFinishFailed={(errorInfo) => {
    console.log("Failed:", errorInfo);
    message.error("Please fill in all required fields");
  }}
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
              if (editInvoiceId) return;

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
                      loading={loadingCustomers}
                      showSearch
                      optionFilterProp="children"
      //                 onChange={(id) => {
      //                   const c = customers.find((x) => x.id === id);
      //                   if (!c) return;

      //                       form.setFieldsValue({
      //   customer_id: id,
      //   customer_snapshot: {
      //     id: c.id,
      //     companyName: c.companyName,
      //     email: c.email,
      //     phone: c.phone,
      //     address: c.address,
      //     city: c.city,
      //     country: c.country,
      //     taxId: c.taxId,
      //   },
      // });
      //                 }}
       onSelect={(id) => {
      const c = customers.find((x) => x.id === id);
      if (c) {
        form.setFieldsValue({
          customer_snapshot: {
            id: c.id,
            companyName: c.companyName,
            email: c.email,
            phone: c.phone,
            address: c.address,
            city: c.city,
            country: c.country,
            taxId: c.taxId,
          },
        });
        antdMessage.info(`Snapshot captured for ${c.companyName}`);
      }
    }}
                    >
                      {customers.map((c) => (
                        <Select.Option key={c.id} value={c.id}>
                          {c.companyName}
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
                        <b>{selectedCustomer.companyName}</b>
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
  name="invoiceNumber" // Change from invoice_number to invoiceNumber
  rules={[{ required: true }]}
>
  <Input readOnly className="bg-gray-100" />
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
                            Credit 
                          </Select.Option>
                          <Select.Option value="credit_note">
                            Tax
                          </Select.Option>
                          <Select.Option value="credit_note">
                            Debit
                          </Select.Option>
                          <Select.Option value="credit_note">
                            Recurring
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
                  <Form.List name="items" key={editInvoiceId || "new"}>
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
                  <Button type="primary" size="middle" htmlType="submit"
                  loading={
    createInvoiceMutation.isPending ||
    updateInvoiceMutation.isPending
  }
                  >
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

       

 <CustomerModal
  open={!!editingCustomer}
  customer={editingCustomer}
  loading={updateCustomerMutation.status === "pending"}
  onClose={() => setEditingCustomer(null)}



  onSave={async (values, id) => {
  if (!id) return;

  // 1️⃣ Build a pending customer object
 setPendingCustomer({
  id,
  companyName: values.companyName,
  email: values.email ?? null,
  phone: values.phone ?? null,
  address: values.address ?? null,
  city: values.city ?? null,
  country: values.country ?? null,
  taxId: values.taxId ?? null,
});


  // 2️⃣ Show the confirmation modal
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

        applyToInvoiceOnly(pendingCustomer);

        setShowApplyModal(false);
        setPendingCustomer(null);
      }}
    >
      Invoice only
    </Button>,


<Button
  key="both"
  type="primary"
  onClick={async () => {
    if (!pendingCustomer) return;

    await applyToCustomerAndInvoice(pendingCustomer);

    setShowApplyModal(false);
    setPendingCustomer(null);
    setEditingCustomer(null);
  }}
>
  Apply to customer
</Button>


  ]}
>
  <p>Apply these changes to customer record?</p>
</Modal>
      </div>
    </MainLayout>
  );
}
