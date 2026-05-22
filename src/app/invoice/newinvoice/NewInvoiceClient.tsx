

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
  InputNumber,
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
import { RefreshCw, FileText, ChevronRight, ChevronLeft, User, Receipt, Building2, UserSquare2, ScrollText, Calculator, StickyNote } from "lucide-react";
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


const { Title, Text } = Typography;
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
  const {
    canCreateInvoice,
    canUpdateInvoice,
    canReadInvoiceTemplate,
    canReadInvoiceCustomer,
    canUpdateInvoiceCustomer,
    canReadInvoiceSetting
  } = usePermission();
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

      console.log('HYDRATING FORM WITH VALUES:', fv.invoiceNumber);

      // For edit mode, always ensure line items are properly set
      // Check if line items are missing or empty in the form
      const currentLineItems = form.getFieldValue("lineItems");
      const needsLineItemsUpdate = !currentLineItems ||
        currentLineItems.length === 0 ||
        (currentLineItems.length === 1 && !currentLineItems[0].itemName);

      // Update form if it's not ready, if invoice number is empty, or if line items need to be populated
      if (!isFormReady || form.getFieldValue("invoiceNumber") === "" || needsLineItemsUpdate) {
        console.log('Setting form values - Form ready:', !isFormReady, 'Empty invoice:', form.getFieldValue("invoiceNumber") === "", 'Needs line items:', needsLineItemsUpdate);
        form.setFieldsValue(fv);

        if (invoiceDetail.templateId) {
          setTemplateId(invoiceDetail.templateId);
        }

        form.validateFields();
        setIsFormReady(true);
      } else {
        console.log('Form already ready and line items exist, skipping overwrite to prevent data loss.');
        // Still ensure line items are properly set if they exist
        if (mappedItems.length > 0 && needsLineItemsUpdate) {
          console.log('Updating line items only');
          form.setFieldValue("lineItems", mappedItems);
        }
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
      <div
        style={{
          margin: "0 -24px",
          background: "var(--customers-page-bg)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* TOP BAR — refined breadcrumb + actions */}
        <div
          className="sticky top-0 z-40 backdrop-blur-md border-b"
          style={{
            background:
              "color-mix(in oklab, var(--customers-page-bg) 85%, transparent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => router.push("/invoice/invoices")}
                className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                aria-label="Back to invoices"
                style={{ color: "var(--text-secondary)" }}
              >
                <ChevronLeft size={18} />
              </button>
              <div
                className="flex items-center gap-2 text-[13px]"
                style={{ color: "var(--text-secondary)" }}
              >
                <span
                  className="cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                  onClick={() => router.push("/invoice/invoices")}
                >
                  Invoices
                </span>
                <ChevronRight size={12} />
                <span
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {editInvoiceId ? "Edit invoice" : "New invoice"}
                </span>
                {watchedInvoiceNumber && (
                  <span
                    className="ml-1 inline-flex items-center px-2 py-[3px] rounded-md text-[12px] font-mono font-semibold tabular-nums"
                    style={{
                      background: "var(--bg-blue-50)",
                      color: "var(--text-blue-700)",
                      border: "1px solid var(--border-blue-200)",
                    }}
                  >
                    {watchedInvoiceNumber}
                  </span>
                )}
                <span
                  className="ml-2 inline-flex items-center px-2 py-[3px] rounded-md text-[10px] font-semibold uppercase tracking-[0.08em]"
                  style={{
                    background: "var(--bg-slate-50)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full mr-1.5"
                    style={{ background: "#94a3b8" }}
                  />
                  Draft
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="template-pill flex items-center pl-2.5 pr-2 h-9 rounded-lg mr-1 transition-colors cursor-pointer"
                style={{
                  background: "var(--bg-slate-50)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "var(--bg-blue-50)",
                    color: "var(--text-blue-700)",
                    border: "1px solid var(--border-blue-200)",
                  }}
                >
                  <FileText size={12} strokeWidth={2.25} />
                </div>
                <span
                  className="ml-2 mr-1 text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Template
                </span>
                {canReadInvoiceTemplate && (
                  <Select
                    placeholder="None"
                    variant="borderless"
                    className="template-select-inline"
                    popupMatchSelectWidth={220}
                    style={{ width: 140 }}
                    loading={loadingTemplates}
                    value={templateId || undefined}
                    onChange={(val) => {
                      setTemplateId(val);
                      form.setFieldValue("templateId", val);
                    }}
                    allowClear
                    suffixIcon={
                      <ChevronRight
                        size={13}
                        style={{
                          color: "var(--text-secondary)",
                          transform: "rotate(90deg)",
                        }}
                      />
                    }
                  >
                    {templates.map((t) => (
                      <Select.Option key={t.id} value={t.id}>
                        {t.name}
                      </Select.Option>
                    ))}
                  </Select>
                )}
              </div>
              <div
                className="h-6 w-px"
                style={{ background: "var(--border-color)" }}
              />
              <Button
                icon={<EyeOutlined />}
                onClick={() => setIsPreviewVisible(true)}
                style={{ borderRadius: 8, height: 36 }}
              >
                Preview
              </Button>
              <Button
                loading={actionLoading === "DRAFT"}
                onClick={() => {
                  setSubmitStatus("DRAFT");
                  setActionLoading("DRAFT");
                  form.setFieldValue("status", "DRAFT");
                  form.submit();
                }}
                style={{ borderRadius: 8, height: 36 }}
              >
                Save draft
              </Button>
              <Button
                type="primary"
                loading={actionLoading === "PENDING"}
                onClick={() => {
                  setSubmitStatus("PENDING");
                  setActionLoading("PENDING");
                  form.setFieldValue("status", "PENDING");
                  form.submit();
                }}
                style={{
                  borderRadius: 8,
                  height: 36,
                  fontWeight: 600,
                  background: "#2563eb",
                }}
              >
                Submit for approval
              </Button>
              <Button
                type="text"
                onClick={() => {
                  form.resetFields();
                  router.push("/invoice/invoices");
                }}
                style={{
                  borderRadius: 8,
                  height: 36,
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
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
            lineItems: [
              {
                itemName: "",
                description: "",
                quantity: 1,
                rate: 0,
                taxRate: 0,
              },
            ],
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
          <Form.Item name="templateId" hidden />
          <Form.Item name="tax_inclusive" hidden initialValue={false}>
            <Input type="hidden" />
          </Form.Item>

          <div className="px-8 pt-6 pb-12 lg:pt-0 lg:pb-0">
            <div className="mx-auto max-w-[1600px] grid grid-cols-12 gap-6">
              {/* LEFT — meta sidebar (open layout, not a card) */}
              <aside
                className="col-span-12 lg:col-span-3 lg:border-r lg:pr-7"
                style={{ borderColor: "var(--border-color)" }}
              >
                <div className="lg:sticky lg:top-14 lg:pt-6 lg:pb-12 space-y-6">
                  {/* From */}
                  <div className="pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                        style={{
                          background: "var(--bg-blue-50)",
                          color: "var(--text-blue-700)",
                          border: "1px solid var(--border-blue-200)",
                        }}
                      >
                        <Building2 size={12} strokeWidth={2.25} />
                      </span>
                      <div
                        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        From
                      </div>
                    </div>
                    {canReadInvoiceSetting && (
                      <Form.Item
                        name="settingsProfileId"
                        rules={[{ required: true, message: "Please select a profile" }]}
                        style={{ marginBottom: 12, marginTop: 10 }}
                      >
                        <Select
                          placeholder="Select issuer profile"
                          loading={isLoading}
                          className="w-full custom-select-premium"
                        >
                          {activeProfiles.map((profile) => (
                            <Select.Option key={profile.id} value={profile.id}>
                              {profile.name}
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    )}
                    {selectedProfile && (
                      <div className="flex items-start gap-3 pt-1">
                        {selectedProfile.general?.companyLogo ? (
                          <div
                            className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden"
                            style={{
                              background: "var(--bg-slate-50)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            <img
                              src={selectedProfile.general.companyLogo}
                              alt="logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-10 h-10 flex-shrink-0 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{
                              background: "var(--bg-blue-50)",
                              color: "var(--text-blue-700)",
                              border: "1px solid var(--border-blue-200)",
                            }}
                          >
                            {(
                              selectedProfile.general?.companyName ||
                              selectedProfile.name ||
                              "Z"
                            ).charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div
                            className="text-sm font-semibold truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {selectedProfile.general?.companyName ||
                              selectedProfile.name}
                          </div>
                          {selectedProfile.general?.address && (
                            <div
                              className="text-[12px] mt-0.5 line-clamp-2"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {formatAddress(selectedProfile.general.address)}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* divider */}
                  <div
                    className="h-px"
                    style={{ background: "var(--border-color)" }}
                  />

                  {/* Bill to */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                        style={{
                          background: "rgba(16, 185, 129, 0.1)",
                          color: "#059669",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                        }}
                      >
                        <UserSquare2 size={12} strokeWidth={2.25} />
                      </span>
                      <div
                        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Bill to
                      </div>
                    </div>
                    {canReadInvoiceCustomer && (
                      <Form.Item
                        name="customer_id"
                        rules={[{ required: true, message: "Please select a customer" }]}
                        style={{ marginBottom: 12, marginTop: 10 }}
                      >
                        <Select
                          placeholder="Select customer"
                          loading={loadingCustomers}
                          showSearch
                          className="w-full custom-select-premium"
                          filterOption={(input, option) =>
                            String(option?.children ?? "")
                              .toLowerCase()
                              .includes(input.toLowerCase())
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
                          {customers
                            .filter((c) => c.isActive)
                            .map((c) => (
                              <Select.Option key={c.id} value={c.id}>
                                {c.companyName}
                              </Select.Option>
                            ))}
                        </Select>
                      </Form.Item>
                    )}
                    {selectedCustomer && (
                      <Tooltip title={canUpdateInvoiceCustomer ? "Click to edit customer details" : "Customer details"}>
                        <div
                          onClick={() => {
                            if (canUpdateInvoiceCustomer) {
                              setEditingCustomer(selectedCustomer);
                            }
                          }}
                          className={`${canUpdateInvoiceCustomer ? "cursor-pointer" : "cursor-default"} group flex items-start gap-3 pt-1`}
                        >
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                            style={{
                              background: "var(--bg-blue-50)",
                              color: "var(--text-blue-700)",
                              border: "1px solid var(--border-blue-200)",
                            }}
                          >
                            {(selectedCustomer.companyName || "U").charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-sm font-semibold truncate group-hover:underline"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {selectedCustomer.companyName}
                            </div>
                            <div
                              className="text-[12px] mt-0.5 line-clamp-2"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {[
                                selectedCustomer.address,
                                selectedCustomer.city,
                                selectedCustomer.country,
                              ]
                                .filter(Boolean)
                                .join(", ") || "Click to add address"}
                            </div>
                            {selectedCustomer.taxId && (
                              <div
                                className="text-[11px] mt-1"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                Tax ID ·{" "}
                                <span style={{ color: "var(--text-primary)" }}>
                                  {selectedCustomer.taxId}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Tooltip>
                    )}
                  </div>

                  {/* divider */}
                  <div
                    className="h-px"
                    style={{ background: "var(--border-color)" }}
                  />

                  {/* Details grid */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                        style={{
                          background: "rgba(168, 85, 247, 0.1)",
                          color: "#9333ea",
                          border: "1px solid rgba(168, 85, 247, 0.25)",
                        }}
                      >
                        <ScrollText size={12} strokeWidth={2.25} />
                      </span>
                      <div
                        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Details
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                      <Form.Item
                        label={
                          <span
                            className="text-[11px] font-medium uppercase tracking-wider"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Invoice no
                          </span>
                        }
                        name="invoiceNumber"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Input
                          readOnly
                          className="rounded-lg h-9 text-sm font-semibold"
                          style={{
                            background: "var(--bg-slate-50)",
                            color: "var(--text-primary)",
                            borderColor: "var(--border-color)",
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        label={
                          <span
                            className="text-[11px] font-medium uppercase tracking-wider"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Type
                          </span>
                        }
                        name="invoice_type"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select className="w-full custom-select-premium">
                          <Select.Option value="standard">Standard</Select.Option>
                          <Select.Option value="proforma">Proforma</Select.Option>
                          <Select.Option value="credit_note">Credit</Select.Option>
                          <Select.Option value="debit_note">Debit</Select.Option>
                          <Select.Option value="recurring">Recurring</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={
                          <span
                            className="text-[11px] font-medium uppercase tracking-wider"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Issue date
                          </span>
                        }
                        name="invoice_date"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <DatePicker
                          className="w-full rounded-lg h-9"
                          onChange={() => {
                            if (form.getFieldValue("due_date")) {
                              form.validateFields(["due_date"]);
                            }
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        label={
                          <span
                            className="text-[11px] font-medium uppercase tracking-wider"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Due date
                          </span>
                        }
                        name="due_date"
                        rules={[
                          { required: true, message: "Please select a due date" },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              const invoiceDate = getFieldValue("invoice_date");
                              if (
                                !value ||
                                !invoiceDate ||
                                value.isAfter(invoiceDate, "day")
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error("Due date must be after the invoice date")
                              );
                            },
                          }),
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <DatePicker
                          className="w-full rounded-lg h-9"
                          disabledDate={(current) => {
                            const invoiceDate = form.getFieldValue("invoice_date");
                            return (
                              invoiceDate &&
                              current &&
                              current.isSameOrBefore(invoiceDate, "day")
                            );
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        label={
                          <span
                            className="text-[11px] font-medium uppercase tracking-wider"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Currency
                          </span>
                        }
                        name="currency"
                        rules={[{ required: true }]}
                        className="col-span-2"
                        style={{ marginBottom: 0 }}
                      >
                        <Select
                          className="w-full custom-select-premium"
                          optionLabelProp="label"
                        >
                          {currencyOptions.map((c) => (
                            <Select.Option
                              key={c.value}
                              value={c.value}
                              label={
                                <span className="flex items-center gap-2">
                                  <span
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-semibold tabular-nums"
                                    style={{
                                      background: 'var(--bg-blue-50)',
                                      color: 'var(--text-blue-700)',
                                    }}
                                  >
                                    {c.symbol}
                                  </span>
                                  <span className="font-semibold tabular-nums">{c.value}</span>
                                  <span style={{ color: 'var(--text-secondary)' }}>· {c.label}</span>
                                </span>
                              }
                            >
                              <div className="flex items-center gap-2 py-0.5">
                                <span
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[12px] font-semibold tabular-nums"
                                  style={{
                                    background: 'var(--bg-slate-50)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)',
                                  }}
                                >
                                  {c.symbol}
                                </span>
                                <span className="font-semibold tabular-nums">{c.value}</span>
                                <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                                  {c.label}
                                </span>
                              </div>
                            </Select.Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </div>
                  </div>

                </div>
              </aside>

              {/* RIGHT — line items, summary, notes */}
              <section className="col-span-12 lg:col-span-9 space-y-5 lg:pt-6 lg:pb-12">
                {/* Line items */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
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
                    <div className="flex justify-center p-12">
                      <Spin size="large" />
                    </div>
                  )}
                </div>

                {/* Summary — running totals */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    className="px-6 py-3 flex items-center justify-between border-b"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                        style={{
                          background: "rgba(245, 158, 11, 0.1)",
                          color: "#d97706",
                          border: "1px solid rgba(245, 158, 11, 0.25)",
                        }}
                      >
                        <Calculator size={12} strokeWidth={2.25} />
                      </span>
                      <span
                        className="text-[14px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Summary
                      </span>
                      <span
                        className="h-4 w-px"
                        style={{ background: "var(--border-color)" }}
                      />
                      <span
                        className="text-[11px] uppercase tracking-[0.08em]"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Calculated from line items
                      </span>
                    </div>
                    <Tooltip title="When on, line rates are treated as inclusive of tax">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[12px] font-medium"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Tax inclusive
                        </span>
                        <Switch
                          checked={isTaxInclusive}
                          onChange={(checked) => {
                            setIsTaxInclusive(checked);
                            form.setFieldValue("tax_inclusive", checked);
                          }}
                          size="small"
                        />
                      </div>
                    </Tooltip>
                  </div>
                  <div className="px-6 py-5 grid grid-cols-12 gap-6">
                    <div className="col-span-12 sm:col-span-7 space-y-3">
                      <div className="flex items-center justify-between text-[13px]">
                        <span style={{ color: "var(--text-secondary)" }}>
                          Subtotal
                        </span>
                        <span
                          className="font-medium tabular-nums"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {currencySymbol}
                          {subtotal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[13px]">
                        <span style={{ color: "var(--text-secondary)" }}>Tax</span>
                        <span
                          className="font-medium tabular-nums"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {currencySymbol}
                          {totalTax.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className="text-[13px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          Discount
                        </span>
                        <Form.Item name="discount" style={{ marginBottom: 0 }}>
                          <InputNumber
                            min={0}
                            prefix={currencySymbol}
                            style={{ width: 160, borderRadius: 8 }}
                            controls={false}
                            onChange={(val) =>
                              setDiscountValue(Number(val) || 0)
                            }
                          />
                        </Form.Item>
                      </div>
                      <div
                        className="h-px"
                        style={{ background: "var(--border-color)" }}
                      />
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[13px] font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          Total
                        </span>
                        <span
                          className="text-xl font-bold tabular-nums"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {currencySymbol}
                          {finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div
                      className="col-span-12 sm:col-span-5 relative rounded-xl p-5 flex flex-col justify-center overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--bg-blue-50) 0%, var(--bg-slate-50) 100%)",
                        border: "1px solid var(--border-blue-200)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Receipt
                            size={13}
                            style={{ color: "var(--text-blue-700)" }}
                          />
                          <span
                            className="text-[10.5px] uppercase tracking-[0.1em] font-semibold"
                            style={{ color: "var(--text-blue-700)" }}
                          >
                            Amount due
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-mono font-semibold tabular-nums px-1.5 py-0.5 rounded"
                          style={{
                            background: "var(--bg-secondary)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          {currency || "USD"}
                        </span>
                      </div>
                      <div
                        className="text-[32px] font-bold tabular-nums leading-none tracking-tight"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {currencySymbol}
                        {finalTotal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div
                        className="text-[12px] mt-2.5 flex items-center gap-1.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {watchedDueDate ? (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "#10b981" }}
                            />
                            <span>
                              Due{" "}
                              <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                                {dayjs(watchedDueDate).format("MMM D, YYYY")}
                              </span>
                            </span>
                          </>
                        ) : (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: "#cbd5e1" }}
                            />
                            <span style={{ opacity: 0.75 }}>Awaiting due date</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes & terms */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    className="px-6 py-3 flex items-center gap-2.5 border-b"
                    style={{ borderColor: "var(--border-color)" }}
                  >
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-md"
                      style={{
                        background: "rgba(244, 114, 182, 0.1)",
                        color: "#db2777",
                        border: "1px solid rgba(244, 114, 182, 0.25)",
                      }}
                    >
                      <StickyNote size={12} strokeWidth={2.25} />
                    </span>
                    <span
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Notes & terms
                    </span>
                    <span
                      className="h-4 w-px"
                      style={{ background: "var(--border-color)" }}
                    />
                    <span
                      className="text-[11px] uppercase tracking-[0.08em]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Visible to your customer on the printed invoice
                    </span>
                  </div>
                  <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div
                        className="text-[11px] font-medium uppercase tracking-wider mb-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Customer notes
                      </div>
                      <Form.Item name="notes" style={{ marginBottom: 0 }}>
                        <Input.TextArea
                          rows={4}
                          placeholder="Add any notes for the customer..."
                          className="text-sm rounded-lg resize-none"
                        />
                      </Form.Item>
                    </div>
                    <div>
                      <div
                        className="text-[11px] font-medium uppercase tracking-wider mb-2"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Terms & conditions
                      </div>
                      <Form.Item name="terms" style={{ marginBottom: 0 }}>
                        <Input.TextArea
                          rows={4}
                          placeholder="Payment terms, late fees, etc..."
                          className="text-sm rounded-lg resize-none"
                        />
                      </Form.Item>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </Form>

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
            mask: { backdropFilter: "blur(4px)", background: "rgba(15, 23, 42, 0.4)" },
            content: { padding: 0, borderRadius: 20, overflow: "hidden" },
          }}
        >
          <div
            className="p-6 border-b"
            style={{
              background: "var(--bg-slate-50)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2.5 rounded-xl"
                style={{
                  background: "var(--bg-blue-50)",
                  color: "var(--text-blue-700)",
                  border: "1px solid var(--border-blue-200)",
                }}
              >
                <RefreshCw size={20} />
              </div>
              <div>
                <Title
                  level={4}
                  style={{ margin: 0, fontSize: 16, color: "var(--text-primary)" }}
                >
                  Apply information changes
                </Title>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, color: "var(--text-secondary)" }}
                >
                  You modified the customer details. Where should these apply?
                </Text>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 gap-3">
              <div
                onClick={() => {
                  if (!pendingCustomer) return;
                  applyToInvoiceOnly(pendingCustomer);
                  setShowApplyModal(false);
                  setPendingCustomer(null);
                }}
                className="group cursor-pointer p-4 rounded-xl transition-all duration-200 hover:border-blue-200"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: "var(--bg-slate-50)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Apply to this invoice only
                    </div>
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Saved with this invoice. The main client record stays unchanged.
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                    style={{ color: "var(--text-secondary)" }}
                  />
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
                className="group cursor-pointer p-4 rounded-xl transition-all duration-200"
                style={{
                  background: "var(--bg-blue-50)",
                  border: "1px solid var(--border-blue-200)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ background: "#2563eb", color: "white" }}
                  >
                    <User size={18} />
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-sm font-semibold line-clamp-1"
                      style={{ color: "var(--text-blue-700)" }}
                    >
                      Apply to customer record (global)
                    </div>
                    <div
                      className="text-[11px] mt-0.5"
                      style={{ color: "var(--text-blue-700)", opacity: 0.7 }}
                    >
                      Update the master record. Future invoices will use these details.
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                    style={{ color: "var(--text-blue-700)" }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                type="text"
                onClick={() => {
                  setShowApplyModal(false);
                  setPendingCustomer(null);
                }}
                style={{ color: "var(--text-secondary)" }}
              >
                Discard changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* CUSTOM SELECT STYLES */}
        <style jsx>{`
          :global(.custom-select-premium .ant-select-selector) {
            border-radius: 8px !important;
            border-color: var(--border-color) !important;
            height: 36px !important;
            padding: 0 12px !important;
            display: flex !important;
            align-items: center !important;
            background-color: var(--bg-secondary) !important;
            color: var(--text-primary) !important;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02) !important;
            transition: all 0.15s !important;
          }
          :global(.custom-select-premium .ant-select-selection-item) {
            color: var(--text-primary) !important;
          }
          :global(.custom-select-premium .ant-select-arrow) {
            color: var(--text-secondary) !important;
          }
          :global(.custom-select-premium .ant-select-selector:hover) {
            border-color: #93c5fd !important;
          }
          :global(.custom-select-premium.ant-select-focused .ant-select-selector) {
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15) !important;
          }

          /* Soften required-field asterisk — premium feel */
          :global(.ant-form-item-required::before) {
            color: var(--text-secondary) !important;
            opacity: 0.5 !important;
            font-size: 10px !important;
            margin-inline-end: 3px !important;
            position: relative;
            top: -1px;
          }

          /* Refine date picker height to match selects */
          :global(.ant-picker) {
            border-color: var(--border-color) !important;
            background: var(--bg-secondary) !important;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02) !important;
            transition: all 0.15s !important;
          }
          :global(.ant-picker:hover) {
            border-color: #93c5fd !important;
          }
          :global(.ant-picker-focused) {
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.15) !important;
          }

          /* Discount input refinement */
          :global(.ant-input-number) {
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.02) !important;
          }

          /* Template pill — fully unified Select inside container */
          :global(.template-pill) {
            transition: background 0.15s, border-color 0.15s !important;
          }
          :global(.template-pill:hover) {
            background: var(--bg-secondary) !important;
            border-color: #93c5fd !important;
          }
          :global(.template-select-inline .ant-select-selector) {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            height: 28px !important;
            display: flex !important;
            align-items: center !important;
          }
          :global(.template-select-inline .ant-select-selection-item),
          :global(.template-select-inline .ant-select-selection-placeholder) {
            color: var(--text-primary) !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            line-height: 28px !important;
            padding-inline-end: 18px !important;
          }
          :global(.template-select-inline .ant-select-selection-placeholder) {
            color: var(--text-secondary) !important;
            font-weight: 500 !important;
          }
          :global(.template-select-inline .ant-select-arrow) {
            inset-inline-end: 2px !important;
          }
          :global(.template-select-inline .ant-select-clear) {
            background: transparent !important;
            inset-inline-end: 2px !important;
          }
          :global(.template-select-inline.ant-select-focused .ant-select-selector) {
            box-shadow: none !important;
          }
        `}</style>

        <Drawer
          title={
            <div className="flex justify-between items-center pr-8">
              <Typography.Text strong className="text-lg">
                Live invoice preview
              </Typography.Text>
              <Typography.Text
                type="secondary"
                className="text-xs font-normal italic"
              >
                Real-time update as you type
              </Typography.Text>
            </div>
          }
          placement="right"
          width={850}
          onClose={() => setIsPreviewVisible(false)}
          open={isPreviewVisible}
          className="invoice-preview-drawer"
          styles={{ body: { padding: 0, backgroundColor: "var(--bg-primary)" } }}
        >
          <InvoicePreview
            data={form.getFieldsValue(true)}
            settings={
              activeProfiles.find(
                (p) => p.id === form.getFieldValue("settingsProfileId")
              ) || activeProfiles[0]
            }
            totals={{
              subtotal,
              totalTax,
              totalBeforeDiscount,
              finalTotal,
              discountAmount,
            }}
            currencySymbol={currencySymbol}
            activeColumns={activeColumns}
          />
        </Drawer>
      </div>
    </MainLayout>
  );
}