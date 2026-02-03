



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
  App,
  Divider
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
import { useMemo } from "react";


const { Title } = Typography;
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

import CustomerModal from "@/components/customer/CustomerModal";
import { CustomersService, Customer ,UpdateCustomerData} from "@/services/customersService";
import { useCustomers, useUpdateCustomer } from "@/hooks/use-customers";
import { message as antdMessage } from "antd";
import { InvoiceType } from "@/services/invoiceService";
import {  useActiveSettingsProfiles } from "@/hooks/useInvoiceSettings";
import { SettingsProfile } from "@/services/invoiceSettingsService";

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

interface Totals {
  subtotal: number;
  totalTax: number;
  totalBeforeDiscount: number;
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
  const [submitStatus, setSubmitStatus] = useState<"DRAFT" | "PENDING">("PENDING");
  const [showApplyModal, setShowApplyModal] = useState(false);

  const [actionLoading, setActionLoading] = useState<
  "DRAFT" | "PENDING" | null
>(null);
  
  // Use state to track tax inclusive
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  
  // Track discount separately to ensure it's captured
  const [discountValue, setDiscountValue] = useState<number>(0);
  
  const updateCustomerMutation = useUpdateCustomer();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const { data: activeProfiles = [], isLoading } = useActiveSettingsProfiles();
  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const customers = customersData?.data || [];

  const { data: invoiceDetail, isLoading: loadingInvoice } =
    useInvoice(editInvoiceId!, !!editInvoiceId);

  const { data: nextInvoice } = useNextInvoiceNumber(!editInvoiceId);

  // Use Form.useWatch to get real-time values for debugging
  const watchedDiscount = Form.useWatch('discount', form);
  const watchedTaxInclusive = Form.useWatch('tax_inclusive', form);
  const watchedItems = Form.useWatch('items', form);

  // Debug useEffect - this will show what the form actually has
  // useEffect(() => {
  //   console.log('🔍 FORM DEBUG - Current form values:');
  //   console.log('   - Discount from form:', watchedDiscount, 'Type:', typeof watchedDiscount);
  //   console.log('   - Discount state:', discountValue);
  //   console.log('   - Tax Inclusive:', watchedTaxInclusive, 'Type:', typeof watchedTaxInclusive);
  // }, [watchedDiscount, watchedTaxInclusive, discountValue]);

  useEffect(() => {
    if (!activeProfiles || activeProfiles.length === 0) return;

    // 1. Try to find the one explicitly marked active
    const activeProfile = activeProfiles.find(p => p.isActive);
    
    // 2. Fallback to the first one in the list if none are marked active
    const defaultProfile = activeProfile || activeProfiles[0];

    if (defaultProfile && !form.getFieldValue("settingsProfileId")) {
      form.setFieldsValue({
        settingsProfileId: defaultProfile.id,
      });
    }
  }, [activeProfiles, form]);



      const selectedProfileId = Form.useWatch("settingsProfileId", form);

const selectedProfile = activeProfiles.find(
  (p) => p.id === selectedProfileId
);

  useEffect(() => {
    // Only auto-fill if we are NOT in edit mode
    if (!editInvoiceId && nextInvoice?.invoiceNumber) {
      form.setFieldsValue({
        invoiceNumber: nextInvoice.invoiceNumber,
      });
    }
  }, [nextInvoice, editInvoiceId, form]);

  
  useEffect(() => {
    // 1. EDIT MODE: Wait for invoiceDetail to be available
    if (editInvoiceId) {
      if (invoiceDetail) {
        console.log('📝 Loading invoice detail:', {
          discount: invoiceDetail.discount,
          taxInclusive: invoiceDetail.taxInclusive
        });
        
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
          settingsProfileId: invoiceDetail.settingsProfileId,
          tax_inclusive: invoiceDetail.taxInclusive || false,
          discount: invoiceDetail.discount || 0,
          invoice_date: invoiceDetail.invoiceDate ? dayjs(invoiceDetail.invoiceDate) : null,
          due_date: invoiceDetail.dueDate ? dayjs(invoiceDetail.dueDate) : null,
          invoice_type: invoiceDetail.invoiceType?.toLowerCase(),
          items: mappedItems,
        });
        
        // Set the state
        setIsTaxInclusive(invoiceDetail.taxInclusive || false);
        setDiscountValue(Number(invoiceDetail.discount) || 0);
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
          tax_inclusive: false,
          discount: 0,
        });
        setIsTaxInclusive(false);
        setDiscountValue(0);
      }
    }
  }, [editInvoiceId, invoiceDetail, form]);



  const formatAddress = (address?: {
  building_name?: string;
  floor_no?: string;
  plot_no?: string;
  street?: string;
  area?: string;
  city?: string;
  pincode?: string;
  country?: string;
}) => {
  if (!address) return "";

  const line1 = [
    address.building_name,
    address.floor_no,
    address.plot_no,
    address.street,
  ].filter(Boolean).join(", ");

  const line2 = [
    address.area,
    address.city,
    address.pincode,
    address.country,
  ].filter(Boolean).join(", ");

  return [line1, line2].filter(Boolean).join(" • ");
};


  

  // Watch for tax_inclusive form field changes
  const formTaxInclusive = Form.useWatch("tax_inclusive", form);
  useEffect(() => {
    if (formTaxInclusive !== undefined) {
      setIsTaxInclusive(formTaxInclusive);
    }
  }, [formTaxInclusive]);

  // Watch for discount changes from form
  const formDiscount = Form.useWatch("discount", form);
  useEffect(() => {
    if (formDiscount !== undefined && formDiscount !== null) {
      const numValue = Number(formDiscount) || 0;
      setDiscountValue(numValue);
    }
  }, [formDiscount]);

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
  const items = Form.useWatch("items", form) || [];

  // Calculate totals with tax inclusive logic and discount
  const { subtotal, totalTax, totalBeforeDiscount, finalTotal } = useMemo(() => {
    const result = items.reduce(
      (acc: Totals & { lineTotals: number[] }, i: any, index: number) => {
        const q = Number(i?.qty || 0);
        const p = Number(i?.price || 0);
        const t = Number(i?.tax || 0);
        const linePrice = q * p;

        let lineSubtotal = 0;
        let lineTax = 0;
        let lineTotal = 0;

        if (isTaxInclusive && t > 0) {
          // TAX INCLUSIVE: price already includes tax
          // Line price = quantity × price (where price includes tax)
          lineTotal = linePrice;
          // Calculate the net amount (price without tax)
          const taxRate = t / 100;
          lineSubtotal = linePrice / (1 + taxRate);
          lineTax = lineTotal - lineSubtotal;
        } else {
          // TAX EXCLUSIVE: tax added on top OR tax inclusive with 0% tax
          lineSubtotal = linePrice;
          lineTax = linePrice * (t / 100);
          lineTotal = lineSubtotal + lineTax;
        }

        // Store individual line totals for display
        if (!acc.lineTotals) acc.lineTotals = [];
        acc.lineTotals[index] = lineTotal;

        acc.subtotal += lineSubtotal;
        acc.totalTax += lineTax;
        acc.totalBeforeDiscount += lineTotal;

        return acc;
      },
      { subtotal: 0, totalTax: 0, totalBeforeDiscount: 0, lineTotals: [] as number[] }
    );

    // Apply discount to the total before discount
    const discountAmount = discountValue;
    

    const finalTotal = Math.max(0, result.totalBeforeDiscount - discountAmount);

    return {
      subtotal: result.subtotal,
      totalTax: result.totalTax,
      totalBeforeDiscount: result.totalBeforeDiscount,
      finalTotal: finalTotal,
      discountAmount: discountAmount
    };
  }, [items, isTaxInclusive, discountValue]);

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


  const isEdit = Boolean(editInvoiceId || invoiceDetail?.id);

  const onFinish = async (values: any) => {
    // console.log("🟢 FRONTEND DEBUG - Form values on submit:");
    // console.log("   - values.discount:", values.discount, 'Type:', typeof values.discount);
    // console.log("   - values.tax_inclusive:", values.tax_inclusive, 'Type:', typeof values.tax_inclusive);
    
    // Get all form values for debugging
    const allValues = form.getFieldsValue();
    // console.log("🟢 ALL FORM VALUES:", allValues);
    // console.log("🟢 DISCOUNT STATE VALUE:", discountValue);
    
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
   // const finalStatus = values.status || submitStatus;
   const finalStatus = submitStatus;


    // Use the state value for discount since form might not be capturing it
    const finalDiscount = discountValue;
    
    // console.log("🟢 Processed discount:", finalDiscount, 'Using state value');

    const payload: any = {
      invoiceNumber: values.invoiceNumber,
      invoiceDate: values.invoice_date?.toISOString(),
      dueDate: values.due_date?.toISOString(),
      settingsProfileId: values.settingsProfileId,
      invoiceType: (values.invoice_type?.toUpperCase() || "STANDARD"),
      currency: values.currency || "USD",
      discount: finalDiscount, // Use the state value directly
      notes: values.notes || "",
      terms: values.terms || "",
      status: finalStatus,
      customerId: values.customer_id,
      taxInclusive: Boolean(values.tax_inclusive),
      customerSnapshot: finalSnapshot, 
      items: (values.items || []).map((item: any) => ({
        id: item.id,
        item: item.item || "Untitled Item",
        description: item.description || "",
        qty: Number(item.qty || 1),
        price: Number(item.price || 0),
        tax: Number(item.tax || 0),
      })),
    };

    // console.log("🟢 FRONTEND DEBUG - Payload being sent:");
    // console.log("   - payload.discount:", payload.discount, 'Type:', typeof payload.discount);
    // console.log("   - payload.taxInclusive:", payload.taxInclusive, 'Type:', typeof payload.taxInclusive);
    // console.log("   - Full payload:", JSON.stringify(payload, null, 2));

    try {
        if (isEdit) {
    const idToUpdate = editInvoiceId || invoiceDetail?.id;

    await updateInvoiceMutation.mutateAsync({
      id: idToUpdate!,
      data: payload,
    });
            antdMessage.success(
      submitStatus === "DRAFT"
        ? "Draft updated"
        : "Invoice submitted successfully"
    );
      } else {
       const created = await createInvoiceMutation.mutateAsync(payload);
        antdMessage.success(
          submitStatus === "DRAFT"
            ? "Invoice saved as draft"
            : "Invoice submitted for approval"
        );
         router.push(`/invoicepro/invoices?edit=${created.id}`);
         return;
      }
      
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

  // Function to calculate individual line total
  const calculateLineTotal = (item: any) => {
    if (!item) return 0;
    const q = Number(item.qty || 0);
    const p = Number(item.price || 0);
    const t = Number(item.tax || 0);
    
    if (isTaxInclusive && t > 0) {
      // For tax inclusive with tax > 0%, total = qty × price (price already includes tax)
      return q * p;
    } else {
      // For tax exclusive OR tax inclusive with 0% tax
      const subtotal = q * p;
      const tax = subtotal * (t / 100);
      return subtotal + tax;
    }
  };

  // Handle tax inclusive switch change
  const handleTaxInclusiveChange = (checked: boolean) => {
    // console.log('🔄 Tax inclusive switch changed to:', checked);
    setIsTaxInclusive(checked);
    
    // Set the form value
    form.setFieldsValue({
      tax_inclusive: checked,
    });
    
    antdMessage.info(`Tax Inclusive mode: ${checked ? "ON" : "OFF"}`);
  };

  // Handle discount input change
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // console.log('🎯 Discount input changed:', value);
    
    // Parse the value
    let numValue = 0;
    if (value !== '' && !isNaN(Number(value))) {
      numValue = Number(value);
      if (numValue < 0) numValue = 0;
    }
    
    // Update both form and state
    form.setFieldValue('discount', numValue);
    setDiscountValue(numValue);
    
    // console.log('🎯 Updated discount to:', numValue);
  };



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
              setActionLoading(null);
              console.log("Failed:", errorInfo);
              message.error("Please fill in all required fields");
            }}
            initialValues={{
              items: [{
                item: "",
                description: "",
                qty: 1,
                price: 0,
                tax: 0,
              }],
              invoice_type: "standard",
              currency: "USD",
              tax_inclusive: false,
              discount: 0,
            }}

          >
            {/* 🔹 Hidden snapshot without input */}
            <Form.Item name="customer_snapshot" hidden />
            <Form.Item name="status" hidden />
            <Form.Item name="tax_inclusive" hidden initialValue={false}>
              <Input type="hidden" />
            </Form.Item>

            {/* <Row gutter={[16, 16]}>
              
              <Col xs={24} md={6}>
                <Card 
                  title="Invoice Profile" 
                  size="small"
                  bodyStyle={{ padding: 12 }}
                  className="h-full"
                >
                  <Form.Item
                    name="settingsProfileId"
                    rules={[{ required: true, message: "Please select a profile" }]}
                  >
                    <Select 
                      placeholder={
                        activeProfiles.length === 0 
                          ? "No profiles found" 
                          : "Select profile"
                      } 
                      loading={isLoading}
                      size="middle"
                    >
                      {activeProfiles.map(profile => (
                        <Select.Option key={profile.id} value={profile.id}>
                          {profile.name} {profile.isActive ? "(Active)" : ""}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>  
                </Card>
              </Col>

             
              <Col xs={24} md={6}>
                <Card 
                  title="Customer" 
                  size="small"
                  bodyStyle={{ padding: 12 }}
                  className="h-full"
                >
                  <Form.Item name="customer_id" rules={[{ required: true }]}>
                    <Select
                      placeholder="Select customer"
                      loading={loadingCustomers}
                      showSearch
                      size="middle"
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
                        style={{ cursor: "pointer", marginTop: 6, padding: 8 }}
                      >
                        <b>{selectedCustomer.companyName}</b>
                        <div className="text-xs">{selectedCustomer.address}</div>
                        <div className="text-xs">{selectedCustomer.city}</div>
                        <div className="text-xs">{selectedCustomer.taxId}</div>
                      </Card>
                    </Tooltip>
                  )}
                </Card>
              </Col>



              







             
              <Col xs={24} md={12}>
                <Card 
                  title="Invoice Details" 
                  size="small"
                  bodyStyle={{ padding: 12 }}
                  className="h-full"
                >
                  <Row gutter={[12, 12]}>
                    
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Invoice No"
                        name="invoiceNumber"
                        rules={[{ required: true }]}
                      >
                        <Input readOnly className="bg-gray-100" size="middle" />
                      </Form.Item>
                    </Col>

                   
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Invoice Date"
                        name="invoice_date"
                        rules={[{ required: true }]}
                      >
                        <DatePicker className="w-full" size="middle" />
                      </Form.Item>
                    </Col>

                    
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Due Date"
                        name="due_date"
                        rules={[{ required: true }]}
                      >
                        <DatePicker className="w-full" size="middle" />
                      </Form.Item>
                    </Col>

                   
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Type"
                        name="invoice_type"
                        rules={[{ required: true }]}
                      >
                        <Select size="middle">
                          <Select.Option value="standard">Standard</Select.Option>
                          <Select.Option value="proforma">Proforma</Select.Option>
                          <Select.Option value="credit_note">Credit</Select.Option>
                          <Select.Option value="debit_note">Debit</Select.Option>
                          <Select.Option value="recurring">Recurring</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>

                    
                    <Col xs={24} md={8}>
                      <Form.Item
                        label="Currency"
                        name="currency"
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

                    
                    <Col xs={24} md={8}>
                      <Form.Item label="Recurring Invoice">
                        <Switch checked={isRecurring} onChange={setIsRecurring} />
                      </Form.Item>
                    </Col>



                   
                    {isRecurring && (
                      <Col xs={24} md={8}>
                        <Form.Item
                          name="recurring_frequency"
                          rules={[
                            {
                              required: isRecurring,
                              message: "Please select frequency",
                            },
                          ]}
                        >
                          <Select placeholder="Select frequency" size="middle">
                            <Select.Option value="weekly">Weekly</Select.Option>
                            <Select.Option value="monthly">Monthly</Select.Option>
                            <Select.Option value="yearly">Yearly</Select.Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                </Card>
              </Col>
            </Row> */}


            <Row gutter={[16, 16]}>
  {/* PROFILE + CUSTOMER COMBINED CARD */}


  <Col xs={24} md={12}>
  <Card
    title="Invoice & Customer"
    size="small"
    bodyStyle={{ padding: 16 }}
    className="h-full"
  >
    <Row gutter={16} align="stretch">
      {/* PROFILE */}
      <Col xs={24} md={11}>
        <Form.Item
          label="Invoice Profile"
          name="settingsProfileId"
          rules={[{ required: true, message: "Please select a profile" }]}
          style={{ marginBottom: 12 }}
        >
          <Select
            placeholder={
              activeProfiles.length === 0
                ? "No profiles found"
                : "Select profile"
            }
            loading={isLoading}
            size="middle"
          >
            {activeProfiles.map((profile) => (
              <Select.Option key={profile.id} value={profile.id}>
                {profile.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {selectedProfile && (
          <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
            {/* LOGO */}
            {selectedProfile.general?.companyLogo && (
              <div className="w-12 h-12 flex-shrink-0 rounded bg-white border flex items-center justify-center">
                <img
                  src={selectedProfile.general.companyLogo}
                  alt="logo"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {/* TEXT */}
            <div className="leading-snug">
              <div className="text-base font-medium text-gray-900">
                {selectedProfile.general?.companyName ||
                  selectedProfile.name}
              </div>

              {selectedProfile.general?.address && (
                <Typography.Text className="text-[12px] text-gray-500 block mt-1">
                  {formatAddress(selectedProfile.general.address)}
                </Typography.Text>
              )}
            </div>
          </div>
        )}
      </Col>

      {/* DIVIDER */}
      <Col md={2} className="hidden md:flex justify-center">
        <Divider type="vertical" style={{ height: "100%" }} />
      </Col>

      {/* CUSTOMER */}
      <Col xs={24} md={11}>
        <Form.Item
          label="Customer"
          name="customer_id"
          rules={[{ required: true }]}
          style={{ marginBottom: 12 }}
        >
          <Select
            placeholder="Select customer"
            loading={loadingCustomers}
            showSearch
            size="middle"
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
  <Tooltip title="Click to edit customer">
    <div
      onClick={() => setEditingCustomer(selectedCustomer)}
      className="rounded-lg bg-gray-50 p-3 cursor-pointer hover:bg-gray-100 transition"
    >
      <div className="text-base font-medium text-gray-900">
        {selectedCustomer.companyName}
      </div>

      <div className="text-[12px] text-gray-500 mt-1">
        {selectedCustomer.address}
      </div>

      <div className="text-[12px] text-gray-500">
        {selectedCustomer.city}
      </div>

      <div className="text-[12px] text-gray-500">
        {selectedCustomer.taxId}
      </div>
    </div>
  </Tooltip>
)}

      </Col>
    </Row>
  </Card>
</Col>


  {/* INVOICE DETAILS */}
  <Col xs={24} md={12}>
    <Card
      title="Invoice Details"
      size="small"
      bodyStyle={{ padding: 12 }}
      className="h-full"
    >
      <Row gutter={[8, 8]}>
        <Col xs={24} md={8}>
          <Form.Item label="Invoice No" name="invoiceNumber" rules={[{ required: true }]}>
            <Input readOnly size="small" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label="Invoice Date" name="invoice_date" rules={[{ required: true }]}>
            <DatePicker className="w-full" size="small" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label="Due Date" name="due_date" rules={[{ required: true }]}>
            <DatePicker className="w-full" size="small" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label="Type" name="invoice_type" rules={[{ required: true }]}>
            <Select size="small">
              <Select.Option value="standard">Standard</Select.Option>
              <Select.Option value="proforma">Proforma</Select.Option>
              <Select.Option value="credit_note">Credit</Select.Option>
              <Select.Option value="debit_note">Debit</Select.Option>
              <Select.Option value="recurring">Recurring</Select.Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label="Currency" name="currency" rules={[{ required: true }]}>
            <Select size="small">
              {currencyOptions.map((c) => (
                <Select.Option key={c.value} value={c.value}>
                  {c.symbol} {c.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        {/* <Col xs={24} md={8}>
          <Form.Item label="Recurring">
            <Switch checked={isRecurring} onChange={setIsRecurring} />
          </Form.Item>
        </Col> */}
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
                            {fields.map(({ key, name }) => {
                              const currentItem = items[name] || {};
                              const lineTotal = calculateLineTotal(currentItem);
                              
                              return (
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
                                      <Input 
                                        type="number" 
                                        min={1}
                                        onChange={() => {
                                          // Force recalculation when qty changes
                                          const currentItems = form.getFieldValue("items");
                                          form.setFieldsValue({
                                            items: [...currentItems]
                                          });
                                        }}
                                      />
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
                                        step="0.01"
                                        addonBefore={currencySymbol}
                                        onChange={() => {
                                          // Force recalculation when price changes
                                          const currentItems = form.getFieldValue("items");
                                          form.setFieldsValue({
                                            items: [...currentItems]
                                          });
                                        }}
                                      />
                                    </Form.Item>
                                  </td>

                                  <td className="p-2">
                                    <Form.Item
                                      name={[name, "tax"]}
                                      style={{ marginBottom: 0 }}
                                    >
                                      <Input 
                                        type="number" 
                                        addonAfter="%"
                                        onChange={() => {
                                          // Force recalculation when tax changes
                                          const currentItems = form.getFieldValue("items");
                                          form.setFieldsValue({
                                            items: [...currentItems]
                                          });
                                        }}
                                      />
                                    </Form.Item>
                                  </td>

                                  <td className="p-2 text-right font-medium">
                                    {currencySymbol} {lineTotal.toFixed(2)}
                                    <div className="text-xs text-gray-500">
                                      {isTaxInclusive && Number(currentItem.tax || 0) > 0 
                                        ? "(tax included)" 
                                        : ""}
                                    </div>
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
                              );
                            })}
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
                              {currencySymbol} {finalTotal.toFixed(2)}
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
  initialValue={0}
>
  <Input
    type="number"
    min={0}
    step="0.01"
    addonAfter={currencySymbol}
    style={{ width: 140 }}
    onChange={(e) => {
      const value = e.target.value;
      //console.log('🎯 Discount onChange:', value);
      
      // Handle empty string case
      if (value === '') {
        form.setFieldValue('discount', '');
        setDiscountValue(0);
      } else {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          form.setFieldValue('discount', numValue);
          setDiscountValue(numValue);
        }
      }
    }}
    onBlur={(e) => {
      const value = e.target.value;
      //console.log('🎯 Discount onBlur:', value);
      
      // Finalize the value on blur
      if (value === '') {
        form.setFieldValue('discount', 0);
        setDiscountValue(0);
      } else {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          form.setFieldValue('discount', numValue);
          setDiscountValue(numValue);
        }
      }
    }}
  />
</Form.Item>

                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-600">
                              Tax Inclusive
                            </span>
                            <Switch 
                              checked={isTaxInclusive}
                              onChange={handleTaxInclusiveChange}
                              key="tax-inclusive-switch"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </Form.List>
                </Card>
              </Col>
            </Row>

            {/* CALCULATION BREAKDOWN */}
            {/* <Row gutter={[16, 16]} className="mt-4">
              <Col span={24}>
                <Card size="small" title="Calculation Breakdown">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Tax Inclusive Mode:</span>
                      <span className={`font-semibold ${isTaxInclusive ? 'text-green-600' : 'text-gray-600'}`}>
                        {isTaxInclusive ? "ON" : "OFF"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal (before tax):</span>
                      <span>{currencySymbol} {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Tax:</span>
                      <span>{currencySymbol} {totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total Before Discount:</span>
                      <span className="font-medium">{currencySymbol} {totalBeforeDiscount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Discount:</span>
                      <span>-{currencySymbol} {discountValue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Grand Total:</span>
                      <span className="text-blue-600">
                        {currencySymbol} {finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row> */}



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


<Button
  type="primary"
  loading={actionLoading === "PENDING"}
  onClick={() => {
    setSubmitStatus("PENDING");
    setActionLoading("PENDING");
    form.setFieldValue("status", "PENDING"); 
    form.submit();
  }}
>
  Submit for Approval
</Button>




<Button
  loading={actionLoading === "DRAFT"}
  onClick={() => {
    setSubmitStatus("DRAFT");
    setActionLoading("DRAFT");
    form.setFieldValue("status", "DRAFT"); 
    form.submit();
  }}
>
  Save as Draft
</Button>



                  <Button
  danger
  onClick={() => {
    form.resetFields();           
    router.push("/invoices");   
  }}
>
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