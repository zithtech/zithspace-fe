

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
  Spin,
  Drawer
} from "antd";
import {
  SnippetsOutlined,
  DeleteOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { RefreshCw,FileText,ChevronRight,User,Text} from "lucide-react";
import { currencyOptions } from "@/utils/currencyOptions";
import {
  useInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useNextInvoiceNumber,
  useInvoice,
} from "@/hooks/useInvoices";
import { useInvoiceTemplates } from "@/hooks/useInvoiceTemplates";
import { useMemo } from "react";


const { Title } = Typography;
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(isSameOrBefore);

import CustomerModal from "@/components/customer/CustomerModal";
import { CustomersService, Customer, UpdateCustomerData } from "@/services/customersService";
import { useCustomers, useUpdateCustomer } from "@/hooks/use-customers";
import { message as antdMessage } from "antd";
import { InvoiceType } from "@/services/invoiceService";
import { useActiveSettingsProfiles } from "@/hooks/useInvoiceSettings";
import { SettingsProfile } from "@/services/invoiceSettingsService";
import DynamicLineItems, { Column } from "./DynamicLineItems";
import InvoicePreview from "./InvoicePreview";

interface CustomerDraft {
  id: string;
  companyName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxId?: string | null;
  gstin?: string | null;
  pan?: string | null;
}

interface Totals {
  subtotal: number;
  totalTax: number;
  totalBeforeDiscount: number;
}

export default function InvoiceNewinvoicePage() {
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
  const [isFormReady, setIsFormReady] = useState(!editInvoiceId);

  const [actionLoading, setActionLoading] = useState<
    "DRAFT" | "PENDING" | null
  >(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const { data: templates = [], isLoading: loadingTemplates } = useInvoiceTemplates();
  // We use explicit state for templateId to ensure reliable prop updates to children
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);
  const [activeColumns, setActiveColumns] = useState<Column[]>([]);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

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




  // Reset isFormReady when moving to a different invoice to prevent stale data hydration
  useEffect(() => {
    setIsFormReady(false);
  }, [editInvoiceId]);

  // Handle templateId from query params (for direct selection from templates page)
  useEffect(() => {
    const tId = searchParams.get("templateId");
    if (!editInvoiceId && tId) {
      console.log('🎯 APPLYING TEMPLATE FROM URL:', tId);
      form.setFieldValue("templateId", tId);
      setTemplateId(tId);
    }
  }, [searchParams, editInvoiceId, form]);

  // Handle auto-selection of default template for new invoices
  useEffect(() => {
    // Only auto-select if:
    // 1. We are creating a new invoice (not editing)
    // 2. No template was specifically requested in the URL
    // 3. We haven't already set a templateId in this session
    // 4. Templates have been loaded
    if (!editInvoiceId && !searchParams.get("templateId") && !templateId && templates.length > 0) {
      const defaultTemplate = templates.find((t: any) => t.isDefault);
      if (defaultTemplate) {
        console.log('✨ AUTO-SELECTING DEFAULT TEMPLATE:', defaultTemplate.name);
        form.setFieldValue("templateId", defaultTemplate.id);
        setTemplateId(defaultTemplate.id);
      }
    }
  }, [templates, editInvoiceId, searchParams, form, templateId]);

  const {
    data: nextInvoice,
    isLoading: loadingNext,
    refetch: refetchNextNumber
  } = useNextInvoiceNumber(!editInvoiceId, selectedProfileId);

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

  // When invoice data is loaded, set local templateId state for the header selector
  useEffect(() => {
    if (invoiceDetail?.templateId) {
      setTemplateId(invoiceDetail.templateId);
    }
  }, [invoiceDetail]);

  useEffect(() => {
    console.log('Invoice detail loaded:', invoiceDetail);
    console.log('Items to set:', invoiceDetail?.lineItems);

    if (editInvoiceId && invoiceDetail) {
      // Prepare mapped items with proper numeric values
      const mappedItems = invoiceDetail.lineItems?.length > 0
        ? invoiceDetail.lineItems.map((i: any) => ({
          id: i.id,
          itemName: i.itemName || "",
          description: i.description || "",
          projectId: i.projectId || null,
          quantity: Number(i.quantity) || 1,
          rate: Number(i.rate) || 0,
          taxRate: Number(i.taxRate) || 0,
          extraFields: Object.fromEntries(
            Object.entries(i.extraFields || {}).filter(([key]) => key !== 'projectName')
          ),
          projectName: i.projectName || i.extraFields?.projectName || null,
        }))
        : [{ itemName: "", description: "", quantity: 1, rate: 0, taxRate: 0 }];

      console.log('Mapped items:', mappedItems);

      const fv = {
        invoiceNumber: invoiceDetail.invoiceNumber || "",
        customer_id: invoiceDetail.customerId || "",
        customer_snapshot: invoiceDetail.customerSnapshot || null,
        settingsProfileId: invoiceDetail.settingsProfileId || "",
        tax_inclusive: invoiceDetail.taxInclusive || false,
        discount: invoiceDetail.discountTotal || invoiceDetail.discount || 0,
        invoice_date: invoiceDetail.invoiceDate ? dayjs(invoiceDetail.invoiceDate) : null,
        due_date: invoiceDetail.dueDate ? dayjs(invoiceDetail.dueDate) : null,
        invoice_type: invoiceDetail.invoiceType?.toLowerCase() || "standard",
        currency: invoiceDetail.currency || "USD",
        templateId: invoiceDetail.templateId || "",
        notes: invoiceDetail.notes || "",
        terms: invoiceDetail.terms || "",
        lineItems: mappedItems,
        columnOrder: invoiceDetail.metadata?.columnOrder || null,
        columnLabels: invoiceDetail.metadata?.columnLabels || null,
      };

      console.log('🚀 HYDRATING FORM WITH VALUES:', fv.invoiceNumber);

      // Only set fields if the form isn't ready or if the underlying data changed significantly (like invoice number)
      // This prevents overwriting the user's active typing during background refetches
      if (!isFormReady || form.getFieldValue("invoiceNumber") === "") {
        console.log('💧 First time hydration or empty form, setting values.');
        form.setFieldsValue(fv);

        if (invoiceDetail.templateId) {
          setTemplateId(invoiceDetail.templateId);
        }

        form.validateFields();
        setIsFormReady(true);
      } else {
        console.log('💧 Form already ready, skipping overwrite to prevent data loss.');
      }

      setIsTaxInclusive(invoiceDetail.taxInclusive || false);
      setDiscountValue(Number(invoiceDetail.discountTotal || invoiceDetail.discount) || 0);
    } else if (!editInvoiceId) {
      // Logic for NEW invoices only
      const currentItems = form.getFieldValue("lineItems");
      if (!currentItems || currentItems.length === 0) {
        form.setFieldsValue({
          lineItems: [{ itemName: "", description: "", quantity: 1, rate: 0, taxRate: 0 }],
          invoice_type: "standard",
          currency: "USD",
          tax_inclusive: false,
          discount: 0,
        });
        setIsTaxInclusive(false);
        setDiscountValue(0);
      }
      setIsFormReady(true);
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
    gstin: values.gstin ?? undefined,
    pan: values.pan ?? undefined,
  });

  const currency = Form.useWatch("currency", form);
  const currencySymbol =
    currencyOptions.find((c) => c.value === currency)?.symbol || "$";

  const items = Form.useWatch("lineItems", form) || [];
  const watchedNotes = Form.useWatch("notes", form);
  const watchedTerms = Form.useWatch("terms", form);
  const watchedInvoiceNumber = Form.useWatch("invoiceNumber", form);
  const watchedInvoiceDate = Form.useWatch("invoice_date", form);
  const watchedDueDate = Form.useWatch("due_date", form);
  const watchedCustomerId = Form.useWatch("customer_id", form);

  const { subtotal, totalTax, totalBeforeDiscount, finalTotal, discountAmount } = useMemo(() => {
    const getVal = (obj: any, keys: string[]) => {
      if (!obj) return 0;
      for (const k of keys) {
        const val = obj[k] ?? obj[k.toLowerCase()] ?? obj[k.charAt(0).toUpperCase() + k.slice(1).toLowerCase()];
        if (val !== undefined && val !== null && val !== '') return Number(val);
      }
      return 0;
    };

    const result = items.reduce(
      (acc: Totals & { lineTotals: number[] }, i: any, index: number) => {
        const q = Number(i?.quantity || 0);
        const p = Number(i?.rate || 0);

        // 💡 Check standard fields then extraFields for tax
        const extraTax = getVal(i?.extraFields, ['taxRate', 'tax', 'tax_rate', 'VAT', 'GST']);
        const t = Number(i?.taxRate || i?.tax || extraTax || 0);

        // 💡 Check for line-item discount in extraFields
        const extraDiscount = getVal(i?.extraFields, ['discount', 'dis', 'disc']);
        const d = Number(extraDiscount || 0);

        const linePrice = (q * p);

        let lineSubtotal = 0;
        let lineTax = 0;
        let lineTotal = 0;

        const discountedBase = Math.max(0, linePrice - d);

        if (isTaxInclusive && t > 0) {
          lineTotal = discountedBase;
          const taxRate = t / 100;
          lineSubtotal = discountedBase / (1 + taxRate);
          lineTax = lineTotal - lineSubtotal;
        } else {
          lineSubtotal = discountedBase;
          lineTax = discountedBase * (t / 100);
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

    const discountValueNow = discountValue;
    const finalTotalValue = Math.max(0, result.totalBeforeDiscount - discountValueNow);

    return {
      subtotal: result.subtotal,
      totalTax: result.totalTax,
      totalBeforeDiscount: result.totalBeforeDiscount,
      finalTotal: finalTotalValue,
      discountAmount: discountValueNow
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
        gstin: updatedCustomer.gstin ?? undefined,
        pan: updatedCustomer.pan ?? undefined,
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
      gstin: draft.gstin ?? undefined,
      pan: draft.pan ?? undefined,
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
          gstin: savedCustomer.gstin,
          pan: savedCustomer.pan,
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
          gstin: c.gstin,
          pan: c.pan,
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
      templateId: values.templateId || form.getFieldValue('templateId'),
      customerSnapshot: finalSnapshot,
      metadata: {
        ...(invoiceDetail?.metadata || {}),
        columnOrder: values.columnOrder || [],
        columnLabels: values.columnLabels || {},
        columnTypes: values.columnTypes || {},
        columnOptions: values.columnOptions || {}
      },
      items: (values.lineItems || []).map((item: any, index: number) => {
        // Collect all extra fields properly
        const stdKeys = ['id', 'itemName', 'description', 'quantity', 'qty', 'rate', 'price', 'taxRate', 'tax', 'projectId', 'projectName', 'extraFields'];
        const additionalExtraFields: any = {};
        Object.keys(item).forEach(key => {
          if (!stdKeys.includes(key) && item[key] !== undefined) {
            additionalExtraFields[key] = item[key];
          }
        });

        return {
          id: item.id,
          item: item.itemName || "Untitled Item",
          description: item.description || "",
          quantity: Number(item.quantity || item.qty || 1),
          rate: Number(item.rate || item.price || 0),
          taxRate: Number(item.taxRate || item.tax || 0),
          projectId: item.projectId?.value || (typeof item.projectId === 'string' ? item.projectId : null),
          projectName: item.projectId?.label || item.projectName || null,
          extraFields: { ...(item.extraFields || {}), ...additionalExtraFields },
          rowNumber: index + 1
        };
      }),
    };

    console.log('🚀 SUBMITTING INVOICE PAYLOAD:', JSON.stringify(payload, null, 2));

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
        router.push(`/invoice/invoices?edit=${created.id}`);
        return;
      }

      router.push("/invoice/invoices");
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
    const getVal = (obj: any, keys: string[]) => {
      if (!obj) return 0;
      for (const k of keys) {
        const val = obj[k] ?? obj[k.toLowerCase()] ?? obj[k.charAt(0).toUpperCase() + k.slice(1).toLowerCase()];
        if (val !== undefined && val !== null && val !== '') return Number(val);
      }
      return 0;
    };

    const q = Number(item.qty || item.quantity || 0);
    const p = Number(item.price || item.rate || 0);

    // 💡 Check extraFields for tax
    const extraTax = getVal(item.extraFields, ['taxRate', 'tax', 'tax_rate', 'VAT', 'GST']);
    const t = Number(item.tax || item.taxRate || extraTax || 0);

    // 💡 Check extraFields for discount
    const extraDiscount = getVal(item.extraFields, ['discount', 'dis', 'disc']);
    const d = Number(extraDiscount || 0);

    const discountedBase = Math.max(0, (q * p) - d);

    if (isTaxInclusive && t > 0) {
      return discountedBase;
    } else {
      const subtotal = discountedBase;
      const tax = discountedBase * (t / 100);
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
      <div style={{
        margin: "0 -24px",
        padding: "24px 32px",
        background: "#ffffff",
        minHeight: "calc(100vh - 64px)"
      }}>
        {/* FIXED HEADER */}
        <div className="sticky top-0 bg-white z-40 border-b shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SnippetsOutlined style={{ fontSize: 28, color: "#2563eb" }} />
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>
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

              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Apply Template:</span>
                <Select
                  placeholder="Select..."
                  style={{ width: 180 }}
                  loading={loadingTemplates}
                  value={templateId || undefined}
                  onChange={(val) => {
                    setTemplateId(val);
                    form.setFieldValue('templateId', val);
                  }}
                  className="rounded-lg h-9"
                  dropdownStyle={{ borderRadius: '12px' }}
                >
                  {templates.map(t => (
                    <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                  ))}
                </Select>
                <div className="h-6 w-[1px] bg-gray-200 mx-1" />
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
                  style={{ borderRadius: 10, background: "#2563eb", fontWeight: 600, height: 40 }}
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
                  style={{ borderRadius: 10, height: 40 }}
                >
                  Save as Draft
                </Button>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => setIsPreviewVisible(true)}
                  style={{ borderRadius: 10, height: 40 }}
                  size="large"
                >
                  Preview
                </Button>
                <Button
                  danger
                  onClick={() => {
                    form.resetFields();
                    router.push("/invoice/invoices");
                  }}
                  style={{ borderRadius: 10, height: 40 }}
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
              lineItems: [{
                itemName: "",
                description: "",
                quantity: 1,
                rate: 0,
                taxRate: 0,
              }],
              invoice_type: "standard",
              currency: "USD",
              tax_inclusive: false,
              discount: 0,
            }}
          >
            <Form.Item name="customer_snapshot" hidden />
            <Form.Item name="status" hidden />
            <Form.Item name="columnOrder" hidden />
            <Form.Item name="columnLabels" hidden />
            <Form.Item name="tax_inclusive" hidden initialValue={false}>
              <Input type="hidden" />
            </Form.Item>

            {/* MAIN CONTENT - SPLIT LAYOUT WITH ANIMATION */}
            <div className="flex h-[calc(100vh-80px)] overflow-hidden relative">
              {/* LEFT COLUMN - Collapsible with smooth animation */}
              <div
                className={`
                  transition-all duration-500 ease-in-out flex-shrink-0
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
                      className="border-none shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] mb-4 rounded-xl transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]"
                      bodyStyle={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}
                    >
                      {/* Card Header - Modern White Style */}
                      <div className="px-5 py-4 border-b border-slate-100 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5">
                            <Title level={5} style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
                              Invoice Information
                            </Title>
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Configure your invoice setup</span>
                          </div>

                          {/* TOGGLE BUTTON INSIDE INVOICE INFORMATION CARD - Eye icon to hide */}
                          {!isLeftPanelCollapsed && (
                            <Tooltip title="Hide invoice details">
                              <Button
                                type="text"
                                icon={<EyeInvisibleOutlined style={{ fontSize: 20 }} />}
                                onClick={toggleLeftPanel}
                                size="middle"
                                className="hover:bg-gray-200"
                                style={{ color: "#1677ff" }}
                              />
                            </Tooltip>
                          )}
                        </div>
                      </div>

                      {/* Card Body with 3 sections - NO COLORS */}
                      <div className="p-4 space-y-4">
                        {/* INVOICE PROFILE SECTION - NO COLORS */}
                        <div className="bg-white rounded-xl border border-slate-50 p-4 hover:bg-slate-50/30 transition-colors duration-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Profile</span>
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
                              className="w-full custom-select-premium"
                            >
                              {activeProfiles.map((profile) => (
                                <Select.Option key={profile.id} value={profile.id}>
                                  {profile.name}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>

                          {selectedProfile && (
                            <div className="flex items-start gap-3 rounded-xl bg-[#fcfdfe] p-4 border border-slate-100 shadow-sm hover:border-blue-200 hover:bg-white transition-all duration-300">
                              {selectedProfile.general?.companyLogo && (
                                <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm">
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
                        <div className="bg-white rounded-xl border border-slate-50 p-4 hover:bg-slate-50/30 transition-colors duration-200">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Customer</span>
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
                              filterOption={(input, option) =>
                                String(option?.children ?? "").toLowerCase().includes(input.toLowerCase())
                              }
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
                                      gstin: c.gstin,
                                      pan: c.pan,
                                    },
                                  });
                                }
                              }}
                            >
                              {customers.filter(c => c.isActive).map((c) => (
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
                                className="rounded-xl bg-[#fcfdfe] p-4 border border-slate-100 shadow-sm cursor-pointer hover:border-blue-200 hover:bg-white transition-all duration-300 group"
                              >
                                <div className="flex items-center gap-3 mb-3 min-w-0">
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-sm font-bold border border-blue-100 group-hover:scale-105 transition-transform duration-300">
                                    {(selectedCustomer.companyName || "U").charAt(0)}
                                  </div>
                                  <div className="min-w-0 overflow-hidden">
                                    <div className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                      {selectedCustomer.companyName}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Verified Client</div>
                                  </div>
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
                        <div className="bg-white rounded-xl border border-slate-50 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice Details</span>
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
                                  className="bg-[#f8fafc] text-sm font-bold border-slate-200 rounded-lg h-9 text-slate-600 shadow-sm shadow-black/[0.01]"
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
                                <Select size="middle" className="w-full custom-select-premium">
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
                                <DatePicker 
                                  className="w-full rounded-lg h-9 border-slate-200 hover:border-blue-300 focus:border-blue-400 shadow-sm shadow-black/[0.01]" 
                                  size="middle" 
                                  onChange={() => {
                                    // Trigger re-validation of due_date when invoice_date changes
                                    if (form.getFieldValue("due_date")) {
                                      form.validateFields(["due_date"]);
                                    }
                                  }}
                                />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                label="Due Date"
                                name="due_date"
                                rules={[
                                  { required: true, message: "Please select a due date" },
                                  ({ getFieldValue }) => ({
                                    validator(_, value) {
                                      const invoiceDate = getFieldValue("invoice_date");
                                      if (!value || !invoiceDate || value.isAfter(invoiceDate, 'day')) {
                                        return Promise.resolve();
                                      }
                                      return Promise.reject(new Error("Due date must be after the invoice date"));
                                    },
                                  }),
                                ]}
                                style={{ marginBottom: 0 }}
                              >
                                <DatePicker 
                                  className="w-full rounded-lg h-9 border-slate-200 hover:border-blue-300 focus:border-blue-400 shadow-sm shadow-black/[0.01]" 
                                  size="middle" 
                                  disabledDate={(current) => {
                                    const invoiceDate = form.getFieldValue("invoice_date");
                                    // Disable dates on or before invoice_date
                                    return invoiceDate && current && current.isSameOrBefore(invoiceDate, 'day');
                                  }}
                                />
                              </Form.Item>
                            </Col>

                            <Col span={12}>
                              <Form.Item
                                label="Currency"
                                name="currency"
                                rules={[{ required: true }]}
                                style={{ marginBottom: 0 }}
                              >
                                <Select size="middle" className="w-full custom-select-premium">
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
                transition-all duration-500 ease-in-out min-w-0
                ${isLeftPanelCollapsed ? 'flex-1 ml-0' : 'flex-1'}
              `}>
                <div className="h-full flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-2 pt-2 pb-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {/* LINE ITEMS CARD - NO COLORS */}
                    <Card
                      className="border-none shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] mb-4 rounded-xl transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]"
                      bodyStyle={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}
                    >
                      {isFormReady ? (
                        <DynamicLineItems
                          form={form}
                          currencySymbol={currencySymbol}
                          isTaxInclusive={isTaxInclusive}
                          calculateLineTotal={calculateLineTotal}
                          templateId={templateId}
                          templates={templates}
                          loadingTemplates={loadingTemplates}
                          activeColumns={activeColumns}
                          setActiveColumns={setActiveColumns}
                        />
                      ) : (
                        <div className="flex justify-center p-8">
                          <Spin size="large" />
                        </div>
                      )}
                    </Card>

                    {/* NOTES & TERMS CARD - SIDE BY SIDE LAYOUT */}
                    <Card
                      className="border-none shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)] mb-4 rounded-xl transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]"
                      bodyStyle={{ padding: 0, borderRadius: 12, overflow: 'hidden' }}
                    >
                      {/* Card Header - Modern White Style */}
                      <div className="px-5 py-4 border-b border-slate-100 bg-white">
                        <div className="flex flex-col gap-0.5">
                          <Title level={5} style={{ margin: 0, fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
                            Notes & Terms
                          </Title>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Additional details for your customer</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <Row gutter={[24, 0]}>
                          <Col span={12}>
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Customer Notes</div>
                              <Form.Item name="notes" style={{ marginBottom: 0 }}>
                                <Input.TextArea
                                  rows={4}
                                  placeholder="Add any notes for the customer..."
                                  className="text-sm resize-none rounded-xl border-slate-200 hover:border-blue-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 bg-white shadow-sm shadow-black/[0.01]"
                                  size="middle"
                                />
                              </Form.Item>
                            </div>
                          </Col>
                          <Col span={12}>
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Terms & Conditions</div>
                              <Form.Item name="terms" style={{ marginBottom: 0 }}>
                                <Input.TextArea
                                  rows={4}
                                  placeholder="Add terms and conditions..."
                                  className="text-sm resize-none rounded-xl border-slate-200 hover:border-blue-300 focus:border-blue-400 focus:ring-4 focus:ring-blue-50/50 bg-white shadow-sm shadow-black/[0.01]"
                                  size="middle"
                                />
                              </Form.Item>
                            </div>
                          </Col>
                        </Row>
                      </div>
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
            setEditingCustomer(null);
          }}
        />

        {/* APPLY CHANGES MODAL */}
        <Modal
          open={showApplyModal}
          onCancel={() => {
            setShowApplyModal(false);
            setPendingCustomer(null);
          }}
          footer={null}
          width={480}
          styles={{
            mask: { backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.4)' },
            content: { padding: 0, borderRadius: 24, overflow: 'hidden' }
          }}
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <RefreshCw size={20} />
              </div>
              <div>
                <Title level={4} style={{ margin: 0, fontSize: 16 }}>Apply Information Changes</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>You have modified the customer details. Where should these apply?</Text>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div 
                onClick={() => {
                  if (!pendingCustomer) return;
                  applyToInvoiceOnly(pendingCustomer);
                  setShowApplyModal(false);
                  setPendingCustomer(null);
                }}
                className="group cursor-pointer p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:bg-blue-50/30 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 text-slate-400 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-800">Apply to This Invoice Only</div>
                    <div className="text-[11px] text-slate-500">Changes will be saved for this instance and won't affect the main client record.</div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              <div 
                onClick={async () => {
                  if (!pendingCustomer) return;
                  await applyToCustomerAndInvoice(pendingCustomer);
                  setShowApplyModal(false);
                  setPendingCustomer(null);
                  setEditingCustomer(null);
                }}
                className="group cursor-pointer p-4 rounded-2xl border border-blue-100 bg-blue-50/20 hover:bg-blue-50/40 transition-all duration-200 shadow-sm shadow-blue-100/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 text-white rounded-lg">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-blue-900 line-clamp-1">Apply to Customer Record (Global)</div>
                    <div className="text-[11px] text-blue-600/80">Update the master database so these details appear on all future invoices for this client.</div>
                  </div>
                  <ChevronRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button 
                type="text" 
                onClick={() => {
                  setShowApplyModal(false);
                  setPendingCustomer(null);
                }}
                className="text-slate-400 font-medium hover:text-red-500"
              >
                Discard Changes
              </Button>
            </div>
          </div>
        </Modal>

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
          :global(.custom-select-premium .ant-select-selector) {
            border-radius: 8px !important;
            border-color: #e2e8f0 !important;
            height: 36px !important;
            padding: 0 12px !important;
            display: flex !important;
            align-items: center !important;
            background-color: #ffffff !important;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02) !important;
            transition: all 0.2s !important;
          }
          :global(.custom-select-premium .ant-select-selector:hover) {
            border-color: #93c5fd !important;
          }
          :global(.custom-select-premium.ant-select-focused .ant-select-selector) {
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 4px rgba(239, 246, 255, 0.5) !important;
          }
        `}</style>

        <Drawer
          title={
            <div className="flex justify-between items-center pr-8">
              <Typography.Text strong className="text-lg">Live Invoice Preview</Typography.Text>
              <Typography.Text type="secondary" className="text-xs font-normal italic">Real-time update as you type</Typography.Text>
            </div>
          }
          placement="right"
          width={850}
          onClose={() => setIsPreviewVisible(false)}
          open={isPreviewVisible}
          className="invoice-preview-drawer"
          styles={{ body: { padding: 0, backgroundColor: '#f9fafb' } }}
        >
          <InvoicePreview
            data={form.getFieldsValue(true)}
            settings={activeProfiles.find(p => p.id === form.getFieldValue('settingsProfileId')) || activeProfiles[0]}
            totals={{ subtotal, totalTax, totalBeforeDiscount, finalTotal, discountAmount }}
            currencySymbol={currencySymbol}
            activeColumns={activeColumns}
          />
        </Drawer>
      </div>
    </MainLayout>
  );
}