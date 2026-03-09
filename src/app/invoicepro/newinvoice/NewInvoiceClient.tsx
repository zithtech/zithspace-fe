

"use client";

import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  Divider,
  Spin
} from "antd";
import {
  SnippetsOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
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
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";

import CustomerModal from "@/components/customer/CustomerModal";
import { CustomersService, Customer ,UpdateCustomerData} from "@/services/customersService";
import { useCustomers, useUpdateCustomer } from "@/hooks/use-customers";
import { message as antdMessage } from "antd";
import { InvoiceType } from "@/services/invoiceService";
import { useActiveSettingsProfiles } from "@/hooks/useInvoiceSettings";
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
  const { canCreateInvoice, canUpdateInvoice } = usePermission();
  const { isLoading: authLoading } = useAuth();
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
  
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(0);
  
  // State for left panel collapse
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  
  const updateCustomerMutation = useUpdateCustomer();
  const createInvoiceMutation = useCreateInvoice();
  const updateInvoiceMutation = useUpdateInvoice();
  const { data: activeProfiles = [], isLoading } = useActiveSettingsProfiles();
  const { data: customersData, isLoading: loadingCustomers } = useCustomers();
  const customers = customersData?.data || [];

  const { data: invoiceDetail, isLoading: loadingInvoice } =
    useInvoice(editInvoiceId!, !!editInvoiceId);

  // const { data: nextInvoice } = useNextInvoiceNumber(!editInvoiceId);



  // useEffect(() => {
  //   if (!activeProfiles || activeProfiles.length === 0) return;

  //   const activeProfile = activeProfiles.find(p => p.isActive);
  //   const defaultProfile = activeProfile || activeProfiles[0];

  //   if (defaultProfile && !form.getFieldValue("settingsProfileId")) {
  //     form.setFieldsValue({
  //       settingsProfileId: defaultProfile.id,
  //     });
  //   }
  // }, [activeProfiles, form]);


  

  const selectedProfileId = Form.useWatch("settingsProfileId", form);




  // Fetch next invoice number with profile ID

  const { data: nextInvoice, refetch: refetchNextNumber } = useNextInvoiceNumber(
  !editInvoiceId && !!selectedProfileId, 
  selectedProfileId 
);

useEffect(() => {
  if (!editInvoiceId && selectedProfileId) {
    refetchNextNumber();
  }
}, [selectedProfileId, editInvoiceId, refetchNextNumber]);



  const selectedProfile = activeProfiles.find(
    (p) => p.id === selectedProfileId
  );

  // useEffect(() => {
  //   if (!editInvoiceId && nextInvoice?.invoiceNumber) {
  //     form.setFieldsValue({
  //       invoiceNumber: nextInvoice.invoiceNumber,
  //     });
  //   }
  // }, [nextInvoice, editInvoiceId, form]);


  useEffect(() => {
  if (!editInvoiceId && nextInvoice?.invoiceNumber) {
    form.setFieldsValue({
      invoiceNumber: nextInvoice.invoiceNumber,
    });
  }
}, [nextInvoice, editInvoiceId, form]);


useEffect(() => {
  if (!activeProfiles || activeProfiles.length === 0) return;

  const activeProfile = activeProfiles.find(p => p.isActive);
  const defaultProfile = activeProfile || activeProfiles[0];

  if (defaultProfile && !form.getFieldValue("settingsProfileId")) {
    form.setFieldsValue({
      settingsProfileId: defaultProfile.id,
    });
    
    // ✅ ADD THIS LINE
    setTimeout(() => refetchNextNumber(), 100);
  }
}, [activeProfiles, form, refetchNextNumber]); // ✅ Add refetchNextNumber to dependency array


  
  useEffect(() => {
    console.log('Invoice detail loaded:', invoiceDetail);
    console.log('Items to set:', invoiceDetail?.items);
    
    if (editInvoiceId && invoiceDetail) {
      // Reset form first
      form.resetFields();
      
      // Prepare mapped items with proper numeric values
      const mappedItems = invoiceDetail.items?.length > 0
        ? invoiceDetail.items.map((i) => ({
            id: i.id,
            item: i.item || "",
            description: i.description || "",
            qty: i.qty || 1,
            price: i.price || 0,
            tax: i.tax || 0,
          }))
        : [{ item: "", description: "", qty: 1, price: 0, tax: 0 }];

      console.log('Mapped items:', mappedItems);

      // Use setTimeout to ensure form is reset before setting values
      setTimeout(() => {
        form.setFieldsValue({
          invoiceNumber: invoiceDetail.invoiceNumber || "",
          customer_id: invoiceDetail.customerId || "",
          customer_snapshot: invoiceDetail.customerSnapshot || null,
          settingsProfileId: invoiceDetail.settingsProfileId || "",
          tax_inclusive: invoiceDetail.taxInclusive || false,
          discount: invoiceDetail.discount || 0,
          invoice_date: invoiceDetail.invoiceDate ? dayjs(invoiceDetail.invoiceDate) : null,
          due_date: invoiceDetail.dueDate ? dayjs(invoiceDetail.dueDate) : null,
          invoice_type: invoiceDetail.invoiceType?.toLowerCase() || "standard",
          currency: invoiceDetail.currency || "USD",
          notes: invoiceDetail.notes || "",
          terms: invoiceDetail.terms || "",
          items: mappedItems,
        });
        
        // Force update form values
        form.validateFields();
      }, 0);
      
      setIsTaxInclusive(invoiceDetail.taxInclusive || false);
      setDiscountValue(Number(invoiceDetail.discount) || 0);
    } else {
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

  const formTaxInclusive = Form.useWatch("tax_inclusive", form);
  useEffect(() => {
    if (formTaxInclusive !== undefined) {
      setIsTaxInclusive(formTaxInclusive);
    }
  }, [formTaxInclusive]);

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

  const currency = Form.useWatch("currency", form);
  const currencySymbol =
    currencyOptions.find((c) => c.value === currency)?.symbol || "$";

  const items = Form.useWatch("items", form) || [];

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
          lineTotal = linePrice;
          const taxRate = t / 100;
          lineSubtotal = linePrice / (1 + taxRate);
          lineTax = lineTotal - lineSubtotal;
        } else {
          lineSubtotal = linePrice;
          lineTax = linePrice * (t / 100);
          lineTotal = lineSubtotal + lineTax;
        }

        if (!acc.lineTotals) acc.lineTotals = [];
        acc.lineTotals[index] = lineTotal;

        acc.subtotal += lineSubtotal;
        acc.totalTax += lineTax;
        acc.totalBeforeDiscount += lineTotal;

        return acc;
      },
      { subtotal: 0, totalTax: 0, totalBeforeDiscount: 0, lineTotals: [] as number[] }
    );

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

   const finalStatus = submitStatus;
   const finalDiscount = discountValue;
    
    const payload: any = {
      invoiceNumber: values.invoiceNumber,
      invoiceDate: values.invoice_date?.toISOString(),
      dueDate: values.due_date?.toISOString(),
      settingsProfileId: values.settingsProfileId,
      invoiceType: (values.invoice_type?.toUpperCase() || "STANDARD"),
      currency: values.currency || "USD",
      discount: finalDiscount,
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

  const calculateLineTotal = (item: any) => {
    if (!item) return 0;
    const q = Number(item.qty || 0);
    const p = Number(item.price || 0);
    const t = Number(item.tax || 0);
    
    if (isTaxInclusive && t > 0) {
      return q * p;
    } else {
      const subtotal = q * p;
      const tax = subtotal * (t / 100);
      return subtotal + tax;
    }
  };

  const handleTaxInclusiveChange = (checked: boolean) => {
    setIsTaxInclusive(checked);
    form.setFieldValue('tax_inclusive', checked);
    antdMessage.info(`Tax Inclusive mode: ${checked ? "ON" : "OFF"}`);
  };

  // Toggle left panel
  const toggleLeftPanel = () => {
    setIsLeftPanelCollapsed(!isLeftPanelCollapsed);
  };

  return (
    <MainLayout>
      <div className="bg-gray-50 min-h-screen">
        {/* FIXED HEADER */}
        <div className="sticky top-0 bg-white z-40 border-b shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SnippetsOutlined style={{ fontSize: 32 ,color:"#1677ff"}} />
                <Title level={3} style={{ margin: 0 ,}}>
                  {editInvoiceId ? "Edit Invoice" : "New Invoice"}
                </Title>
                
                {/* VIEW ICON BESIDE NEW INVOICE - Blue icon with smaller circle blink */}
{/* VIEW ICON BESIDE NEW INVOICE - Blue icon with smaller circle blink */}
{isLeftPanelCollapsed && (
  <div className="relative ml-2">
    <Tooltip title="Show invoice details">
      <Button
        type="text"
        icon={<EyeOutlined style={{ color: '#1677ff' }} />}
        onClick={toggleLeftPanel}
        size="large"
        className="relative"
      />
    </Tooltip>
    {/* Clickable blinking circle */}
    <span 
      className="absolute -inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-75 cursor-pointer"
      onClick={toggleLeftPanel}
    ></span>
    {/* Clickable static circle */}
    <span 
      className="absolute -inset-0 rounded-full border-2 border-blue-500 cursor-pointer"
      onClick={toggleLeftPanel}
    ></span>
  </div>
)}
              </div>
              
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
                  size="large"
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
                  size="large"
                >
                  Save as Draft
                </Button>

                <Button
                  danger
                  onClick={() => {
                    form.resetFields();           
                     router.push("/invoicepro/invoices");   
                  }}
                  size="large"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-0">
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
            <Form.Item name="customer_snapshot" hidden />
            <Form.Item name="status" hidden />
            <Form.Item name="tax_inclusive" hidden initialValue={false}>
              <Input type="hidden" />
            </Form.Item>

            {/* MAIN CONTENT - SPLIT LAYOUT WITH ANIMATION */}
            <div className="flex h-[calc(100vh-80px)] overflow-hidden relative">
              {/* LEFT COLUMN - Collapsible with smooth animation */}
              <div 
                className={`
                  transition-all duration-500 ease-in-out
                  ${isLeftPanelCollapsed 
                    ? 'w-0 opacity-0 overflow-hidden' 
                    : 'w-[27%] opacity-100 border-r border-gray-200'
                  }
                `}
              >
                <div className={`
                  h-full flex flex-col
                  ${isLeftPanelCollapsed ? 'invisible' : 'visible'}
                  transition-opacity duration-300
                `}>
                  <div className="flex-1 overflow-y-auto px-2 pt-2 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {/* SINGLE COMMON CARD - NO COLORS */}
                    <Card 
                      className="border border-gray-200 shadow-sm mb-4 transition-all duration-300 hover:shadow-md"
                      bodyStyle={{ padding: 0 }}
                    >
                      {/* Card Header - NO COLORS with TOGGLE BUTTON */}
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <Title level={5} style={{ margin: 0 }}>
                            Invoice Information
                          </Title>
                          
                          {/* TOGGLE BUTTON INSIDE INVOICE INFORMATION CARD - Eye icon to hide */}
                          {!isLeftPanelCollapsed && (
                            <Tooltip title="Hide invoice details">
                              <Button
                                type="text"
                                icon={<EyeInvisibleOutlined style={{ fontSize: 20 }} />}
                                onClick={toggleLeftPanel}
                                size="middle"
                                className="hover:bg-gray-200"
                                style={{color:"#1677ff"}}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Card Body with 3 sections - NO COLORS */}
                      <div className="p-4 space-y-4">
                        {/* INVOICE PROFILE SECTION - NO COLORS */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors duration-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold text-gray-800">Invoice Profile</span>
                          </div>
                          <Form.Item
                            name="settingsProfileId"
                            rules={[{ required: true, message: "Please select a profile" }]}
                            style={{ marginBottom: 12 }}
                          >
                            <Select
                              placeholder="Select profile"
                              loading={isLoading}
                              size="middle"
                              className="w-full"
                            >
                              {activeProfiles.map((profile) => (
                                <Select.Option key={profile.id} value={profile.id}>
                                  {profile.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>

                          {selectedProfile && (
                            <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3 border border-gray-200 hover:border-gray-300 transition-all duration-200">
                              {selectedProfile.general?.companyLogo && (
                                <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                                  <img
                                    src={selectedProfile.general.companyLogo}
                                    alt="logo"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              )}

                              <div className="leading-snug flex-1 min-w-0">
                                <div className="text-base font-semibold text-gray-900 truncate">
                                  {selectedProfile.general?.companyName ||
                                    selectedProfile.name}
                                </div>

                                {selectedProfile.general?.address && (
                                  <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {formatAddress(selectedProfile.general.address)}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CUSTOMER SECTION - NO COLORS */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors duration-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold text-gray-800">Customer</span>
                          </div>
                          <Form.Item
                            name="customer_id"
                            rules={[{ required: true, message: "Please select a customer" }]}
                            style={{ marginBottom: 12 }}
                          >
                            <Select
                              placeholder="Select customer"
                              loading={loadingCustomers}
                              showSearch
                              size="middle"
                              className="w-full"
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
                                className="rounded-lg bg-gray-50 p-3 border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                              >
                                <div className="text-base font-semibold text-gray-900 mb-1">
                                  {selectedCustomer.companyName}
                                </div>
                                
                                {selectedCustomer.taxId && (
                                  <div className="text-sm text-gray-600 mb-1">
                                    <span className="font-medium">Tax ID:</span> {selectedCustomer.taxId}
                                  </div>
                                )}
                                
                                {selectedCustomer.address && (
                                  <div className="text-sm text-gray-600 mb-1">
                                    {selectedCustomer.address}
                                  </div>
                                )}
                                
                                {selectedCustomer.city && (
                                  <div className="text-sm text-gray-600">
                                    {selectedCustomer.city}
                                    {selectedCustomer.country && `, ${selectedCustomer.country}`}
                                  </div>
                                )}
                              </div>
                            </Tooltip>
                          )}
                        </div>

                        {/* INVOICE DETAILS SECTION - NO COLORS */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors duration-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold text-gray-800">Invoice Details</span>
                          </div>
                          <Row gutter={[12, 12]}>
                            <Col span={12}>
                              <Form.Item 
                                label="Invoice No" 
                                name="invoiceNumber" 
                                rules={[{ required: true }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Input 
                                  readOnly 
                                  size="middle" 
                                  className="bg-gray-50 text-base" 
                                />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                label="Type"
                                name="invoice_type"
                                rules={[{ required: true }]}
                                style={{ marginBottom: 0 }}
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

                            <Col span={12}>
                              <Form.Item
                                label="Invoice Date"
                                name="invoice_date"
                                rules={[{ required: true }]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker className="w-full" size="middle" />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                label="Due Date"
                                name="due_date"
                                rules={[{ required: true }]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker className="w-full" size="middle" />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                label="Currency"
                                name="currency"
                                rules={[{ required: true }]}
                                style={{ marginBottom: 0 }}
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
                          </Row>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN - Expand when left is collapsed */}
              <div className={`
                transition-all duration-500 ease-in-out
                ${isLeftPanelCollapsed ? 'flex-1 ml-0' : 'flex-1'}
              `}>
                <div className="h-full flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-2 pt-2 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {/* LINE ITEMS CARD - NO COLORS */}
                    <Card
                      title="Line Items"
                      className="border border-gray-200 shadow-sm mb-4 transition-all duration-300 hover:shadow-md"
                      
                    >
                      <Divider style={{ margin: 0 }} />
                      
                      <Form.List name="items">
                        {(fields, { add, remove }) => {
                          // Get current form values for all items
                          const formItems = form.getFieldValue('items') || [];
                          
                          return (
                            <>
                              <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                  <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                      <th className="p-3 text-left font-medium text-gray-700 text-sm">Item</th>
                                      <th className="p-3 text-left font-medium text-gray-700 text-sm">Description</th>
                                      <th className="p-3 text-center font-medium text-gray-700 text-sm">Qty</th>
                                      <th className="p-3 text-center font-medium text-gray-700 text-sm">
                                        Price ({currencySymbol})
                                      </th>
                                      <th className="p-3 text-center font-medium text-gray-700 text-sm">Tax %</th>
                                      <th className="p-3 text-right font-medium text-gray-700 text-sm">
                                        Total ({currencySymbol})
                                      </th>
                                      <th className="w-12 p-3"></th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {fields.map(({ key, name }) => {
                                      const currentItem = formItems[name] || {};
                                      const lineTotal = calculateLineTotal(currentItem);
                                      
                                      return (
                                        <tr
                                          key={key}
                                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                                        >
                                          <td className="p-3 align-middle">
                                            <Form.Item
                                              name={[name, "item"]}
                                              rules={[{ required: true, message: "" }]}
                                              style={{ marginBottom: 0 }}
                                            >
                                              <Input 
                                                placeholder="Item name" 
                                                size="middle"
                                                className="text-base w-full"
                                              />
                                            </Form.Item>
                                          </td>

                                          <td className="p-3 align-middle">
                                            <Form.Item
                                              name={[name, "description"]}
                                              style={{ marginBottom: 0 }}
                                            >
                                              <Input 
                                                placeholder="Description" 
                                                size="middle"
                                                className="text-base w-full"
                                              />
                                            </Form.Item>
                                          </td>

                                          <td className="p-3 align-middle">
                                            <Form.Item
                                              name={[name, "qty"]}
                                              rules={[{ required: true, message: "" }]}
                                              style={{ marginBottom: 0 }}
                                            >
                                              <Input 
                                                type="number" 
                                                min={1}
                                                size="middle"
                                                className="w-14 text-center text-base"
                                                value={currentItem?.qty}
                                                onChange={(e) => {
                                                  const value = e.target.value;
                                                  form.setFieldValue(['items', name, 'qty'], value === '' ? '' : Number(value));
                                                }}
                                              />
                                            </Form.Item>
                                          </td>

                                          <td className="p-3 align-middle">
                                            <Form.Item
                                              name={[name, "price"]}
                                              rules={[{ required: true, message: "" }]}
                                              style={{ marginBottom: 0 }}
                                            >
                                              <div className="flex items-center">
                                                <span className="text-gray-500 mr-1 text-sm">{currencySymbol}</span>
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  size="middle"
                                                  className="text-sm flex-1 min-w-0"
                                                  value={currentItem?.price}
                                                  onChange={(e) => {
                                                    const value = e.target.value;
                                                    form.setFieldValue(['items', name, 'price'], value === '' ? '' : Number(value));
                                                  }}
                                                />
                                              </div>
                                            </Form.Item>
                                          </td>

                                          <td className="p-3 align-middle">
                                            <Form.Item
                                              name={[name, "tax"]}
                                              style={{ marginBottom: 0 }}
                                            >
                                              <div className="flex items-center justify-center">
                                                <Input 
                                                  type="number" 
                                                  size="middle"
                                                  className="w-14 text-center text-base"
                                                  value={currentItem?.tax}
                                                  onChange={(e) => {
                                                    const value = e.target.value;
                                                    form.setFieldValue(['items', name, 'tax'], value === '' ? '' : Number(value));
                                                  }}
                                                />
                                                <span className="text-gray-500 ml-1 text-sm">%</span>
                                              </div>
                                            </Form.Item>
                                          </td>

                                          <td className="p-3 align-middle text-right">
                                            <div className="font-medium text-gray-900 text-sm truncate max-w-[120px] ml-auto">
                                              {currencySymbol} {lineTotal.toFixed(2)}
                                            </div>
                                          </td>

                                          <td className="p-3 align-middle text-center">
                                            <Button
                                              type="text"
                                              size="middle"
                                              danger
                                              icon={<DeleteOutlined />}
                                              disabled={fields.length === 1}
                                              onClick={() => remove(name)}
                                              className="opacity-60 hover:opacity-100"
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              <div className="p-3 border-t border-gray-200">
                                <Button
                                  type="dashed"
                                  onClick={() =>
                                    add({ item: "", description: "", qty: 1, price: 0, tax: 0 })
                                  }
                                  className="w-full text-base"
                                  size="middle"
                                >
                                  + Add Item
                                </Button>
                              </div>

                              <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="text-base font-medium text-gray-700 whitespace-nowrap">
                                    Global Discount:
                                  </span>
                                  <Form.Item name="discount" initialValue={0} style={{ margin: 0 }}>
                                    <div className="flex items-center">
                                      <span className="text-gray-500 mr-1 text-base">{currencySymbol}</span>
                                      <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        size="middle"
                                        style={{ width: 140 }}
                                        className="text-base"
                                        value={discountValue}
                                        onChange={(e) => {
                                          const value = e.target.value;
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
                                      />
                                    </div>
                                  </Form.Item>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="text-base font-medium text-gray-700 whitespace-nowrap">
                                    Tax Inclusive:
                                  </span>
                                  <Switch 
                                    checked={isTaxInclusive}
                                    onChange={handleTaxInclusiveChange}
                                  />
                                </div>
                              </div>

                              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-gray-800 text-lg">Total Amount:</span>
                                  <span className="text-xl font-bold text-gray-900 truncate max-w-[200px]">
                                    {currencySymbol} {finalTotal.toLocaleString(undefined, {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </span>
                                </div>
                              </div>
                            </>
                          );
                        }}
                      </Form.List>
                    </Card>

                    {/* NOTES & TERMS CARD - SIDE BY SIDE LAYOUT */}
                    <Card
                      title="Notes & Terms"
                      className="border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md"
                      bodyStyle={{ padding: 16 }}
                    >
                      <Row gutter={[24, 0]}>
                        <Col span={12}>
                          <div>
                            <div className="mb-2 text-base font-medium text-gray-700">Notes</div>
                            <Form.Item name="notes" style={{ marginBottom: 0 }}>
                              <Input.TextArea 
                                rows={4} 
                                placeholder="Add any notes for the customer..." 
                                className="text-base resize-none"
                                size="middle"
                              />
                            </Form.Item>
                          </div>
                        </Col>
                        
                        <Col span={12}>
                          <div>
                            <div className="mb-2 text-base font-medium text-gray-700">Terms & Conditions</div>
                            <Form.Item name="terms" style={{ marginBottom: 0 }}>
                              <Input.TextArea 
                                rows={4} 
                                placeholder="Add terms and conditions..." 
                                className="text-base resize-none"
                                size="middle"
                              />
                            </Form.Item>
                          </div>
                        </Col>
                      </Row>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </div>

        {/* CUSTOMER MODAL */}
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

        {/* APPLY CHANGES MODAL */}
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
              size="large"
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
              size="large"
            >
              Apply to customer
            </Button>
          ]}
        >
          <p>Apply these changes to customer record?</p>
        </Modal>
      </div>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </MainLayout>
  );
}