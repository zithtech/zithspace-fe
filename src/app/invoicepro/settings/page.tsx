
"use client";
import { useState, useRef, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Space,
  Typography,
  Button,
  Card,
  Row,
  Col,
  Steps,
  Dropdown,
  Modal,
  Badge,
  Tag,
  message,
  Divider,
  Spin
} from "antd";

import {
  SettingOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  MoreOutlined,
 

} from "@ant-design/icons";
import GeneralSettings from "./GeneralSettings";
import InvoiceSetting from "./InvoiceSetting";
import { useActivateSettingsProfile } from "@/hooks/useInvoiceSettings";


import {
  InvoiceDraft,
  GeneralDraft,
  Draft,
  Currency,
  DateFormat

} from "@/types/invoice";

import BankPaymentSettings from "./PaymentSetting";
import {  useSettingsProfiles ,useDeleteSettingsProfile,useCreateSettingsProfile,useUpdateSettingsProfile} from "@/hooks/useInvoiceSettings";
import MiniCard from "@/components/customer/MiniCard";


const { Title, Paragraph} = Typography;

const DEFAULT_DRAFT: Draft = {
  general: {
    companyName: "",
    address: {
      plot_no: "",
      floor_no: "",
      building_name: "",
      street: "",
      area: "",
      city: "",
      pincode: "",
      country: "",
    },
    primaryColor: "#1890ff",
    companyLogo: null,
    currency: Currency.USD,
    dateFormat: DateFormat.MM_DD_YYYY,
    signature: null,
  },
  invoice: {
    format: "INV-{YYYY}-{###}",
    // padding: 3,
    // nextNumber: 1,
    // resetYearly: true,
    // lastResetYear: new Date().getFullYear(),
  },
  payment: {
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    qrCode: null,
  },
};


export default function InvoiceproSettingPage() {
  const router = useRouter();
  const { canUpdateSettings } = usePermission();
  const { isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !canUpdateSettings) {
      router.push('/dashboard');
    }
  }, [authLoading, canUpdateSettings, router]);

  const [mode, setMode] = useState<"view" | "create">("view");
  const { data: savedSettingsData, isLoading, refetch} = useSettingsProfiles();

  if (authLoading) return <MainLayout><Spin tip="Loading..." /></MainLayout>;
  if (!canUpdateSettings) return null;


  const [currentStep, setCurrentStep] = useState(0);
  const createMutation = useCreateSettingsProfile();
  const updateMutation = useUpdateSettingsProfile();
  const deleteMutation = useDeleteSettingsProfile();
  const activateMutation = useActivateSettingsProfile();


  const settingsList = savedSettingsData?.data || [];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
const [deleteId, setDeleteId] = useState<string | null>(null);
const [expanded, setExpanded] = useState(false);
const generalFormRef = useRef<any>(null);



  

const [draft, setDraft] = useState<Draft>({
  general: {
    companyName: "",
    address: {
      plot_no: "",
      floor_no: "",
      building_name: "",
      street: "",
      area: "",
      city: "",
      pincode: "",
      country: "",
    },
    primaryColor: "#1890ff",
    companyLogo: null,
    currency: Currency.USD,           
    dateFormat: DateFormat.MM_DD_YYYY, 
    signature: null,
  },
  invoice: {
    format: "INV-{YYYY}-{###}",      
    // padding: 3,
    // nextNumber: 1,
    // resetYearly: true,
    // lastResetYear:new Date().getFullYear(),
  },
  payment: {
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    branchName: "",
    qrCode: null,
  },
});

// const handleEdit = (id: string) => {
//   const settingToEdit = settingsList.find((s) => s.id === id);
//   if (!settingToEdit) return;

//   setDraft({
//     general: {
//       ...settingToEdit.general,
//       companyLogo: settingToEdit.general.companyLogo ?? null,
//       signature: settingToEdit.general.signature ?? null,
//     },
//     invoice: { ...settingToEdit.invoice },
//     payment: { ...settingToEdit.payment },
//   });

//   setEditingId(id); // mark as editing
//   setMode("create"); // switch to create/edit mode
//   setCurrentStep(0); // start from General tab
// };

const handleEdit = (id: string) => {
  const s = settingsList.find((s) => s.id === id);
  if (!s) return;

  // Manually map the data to exclude DB internal fields like 'id', 'createdAt', 'tenantId'
  setDraft({
    general: {
      companyName: s.general.companyName,
      address: s.general.address, // Assuming this is your JSON object
      primaryColor: s.general.primaryColor,
      currency: s.general.currency,
      dateFormat: s.general.dateFormat,
      companyLogo: s.general.companyLogo,
      signature: s.general.signature,
    },
    invoice: {
      format: s.invoice.format,
      // nextNumber: s.invoice.nextNumber, // Add if you want to edit sequence
    },
    payment: {
      bankName: s.payment.bankName,
      accountNumber: s.payment.accountNumber,
      ifscCode: s.payment.ifscCode,
      branchName: s.payment.branchName,
      qrCode: s.payment.qrCode,
    },
  });

  setEditingId(id); 
  setMode("create");
  setCurrentStep(0); 
};

const activeSettingsCount = settingsList.filter(
  (s) => s.isActive
).length;





const resetDraft = () => {
  setDraft(JSON.parse(JSON.stringify(DEFAULT_DRAFT))); // reset draft
  setEditingId(null); // no editing
  setCurrentStep(0);  // start from first step
};





const handleDelete = (id: string) => {
  setDeleteId(id);
  setDeleteModalOpen(true);
};


if (isLoading) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Typography.Text>Loading settings...</Typography.Text>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      
      <div style={{ padding: 10 }}>

      <Card className="shadow-sm border-gray-200 h-full flex flex-col pb-40">


        {/* HEADER */}

        {/* <div className="flex items-center justify-between mb-6">
          <Space align="center">
            {mode === "create" && (
              <Button
                icon={<ArrowLeftOutlined />}
                type="text"
                onClick={() => setMode("view")}
              >
                Back
              </Button>
            )}

           
            <Space align="center" style={{ display: "flex", alignItems: "center", gap: 8 }}>
  <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
  <Title level={3} style={{ margin: 0, lineHeight: 1 }}>
    Settings
  </Title>
</Space>



          </Space>

          {mode === "view" && (

   <div className="flex items-center gap-4">
    
  <Tag
  style={{
    backgroundColor: "#E0F7FA", 
    color: "#1890ff",           
    padding: "4px 12px",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px"
  }}
>
  Total Settings: {settingsList.length}
</Tag>



    
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => {
        resetDraft();
        setMode("create");
      }}
    >
      Create New
    </Button>
  </div>
          )}
        </div> */}

<div className="flex flex-row items-center justify-between gap-4 mb-3 flex-nowrap">
  {/* LEFT */}
  <div className="flex flex-col shrink-0">
    <div className="flex items-center gap-3">
      {/* BACK BUTTON – only in create mode */}
      {mode === "create" && (
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            resetDraft();
            setMode("view");
          }}
          className="px-0"
        >
          Back
        </Button>
      )}

      {/* ICON + TITLE */}
      <SettingOutlined style={{ fontSize: 24, color: "#1677ff" }} />
      <Title level={3} className="!mb-0 !text-gray-900">
        Settings
      </Title>
    </div>

    {/* DESCRIPTION */}
    {mode === "view" && (
    <Paragraph type="secondary" className=" mt-1 !mb-0">
      Manage invoice configuration, formats, currency, and payment details.
    </Paragraph>
    )}

    {/* TAG */}
    {mode === "view" && (
      <div className=" mt-2">
        <Tag color="pink">
    Total Setting: <strong>{settingsList.length}</strong>
  </Tag>
        <Tag color="purple">
          Active Settings: <strong>{activeSettingsCount}</strong>
        </Tag>
        
      </div>
    )}
  </div>

  {/* RIGHT */}
  {mode === "view" && (
    <Button
      type="primary"
      icon={<PlusOutlined />}
      onClick={() => {
        resetDraft();
        setMode("create");
      }}
      className="h-11 shrink-0"
    >
      Create New
    </Button>
  )}
</div>

{mode === "view" && (
  <Divider  style={{marginTop:"0"}}/>
)}




        {/* VIEW MODE */}
        {mode === "view" && (
          <>
            {settingsList.length === 0 ? (
              <div className="min-h-[60vh] flex items-center justify-center">
                <div
                  onClick={() => setMode("create")}
                  className="group relative w-full max-w-lg cursor-pointer rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white p-10 text-center shadow-sm transition-all duration-300 hover:border-blue-400 hover:shadow-lg"
                >
                  {/* Icon */}
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 transition group-hover:scale-105">
                    <SettingOutlined className="text-4xl text-blue-500" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-800">
                    No Invoice Settings
                  </h3>

                  {/* Description */}
                  <p className="mt-1 text-sm text-gray-500">
                    Create a configuration to start generating invoices
                  </p>

                  {/* CTA */}
                  <div className="mt-6">
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      size="large"
                      onClick={(e) => {
                        e.stopPropagation();
                        setMode("create");
                      }}
                    >
                      Create Settings
                    </Button>
                  </div>

                  {/* Hover hint */}
                  <span className="pointer-events-none absolute bottom-4 right-4 text-xs text-gray-400 opacity-0 transition group-hover:opacity-100">
                    Click anywhere to create
                  </span>
                </div>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {settingsList.map((setting) => (
                  <Col xs={24} sm={12} md={8} lg={6} xl={6} key={setting.id}>
                    
                    <Badge.Ribbon
    text="Active"
    color="green"
    style={{ display: setting.isActive ? "block" : "none" ,zIndex: 1,}}
  >
                    <Card
                      hoverable
                      className="rounded-xl shadow-lg hover:shadow-xl transition-all duration-300  border border-gray-100 bg-white"
                    >
                      <div className="absolute top-8 right-2 z-20">
                        <Dropdown
                        menu={{
    items: [
      {
        key: "edit",
        label: "Edit",
        onClick: () => handleEdit(setting.id),
      },
      // {
      //   key: "activate",
      //   label: setting.isActive ? "Inactive" : " Set AS Active",
      //   disabled: setting.isActive,
      //   onClick: () => {
      //     activateMutation.mutate(setting.id);
      //   },
      // },
      {
  key: "activate",
  // 1. Label flips based on current state
  label: setting.isActive ? "Deactivate" : "Set As Active",
  
  // 2. Remove "disabled: setting.isActive" so it's always clickable
  
  onClick: () => {
    // 3. Mutate with the OPPOSITE value of setting.isActive
    activateMutation.mutate({ 
      id: setting.id, 
      isActive: !setting.isActive 
    });
  },
},
      {
        key: "delete",
        label: "Delete",
        danger: true,
        onClick: () => handleDelete(setting.id),
      },
    ],
  }}
                          trigger={["click"]}
                          placement="bottomRight"
                        >
                          <Button
                            type="text"
                            icon={<MoreOutlined />}
                            size="small"
                            className="bg-gray-100 hover:bg-gray-200 rounded-md"
                          />
                        </Dropdown>
                      </div>

                      {/* ================= COMPANY INFO ================= */}
<div className="flex items-start gap-4">
  {/* Logo */}
  {setting.general.companyLogo && (
    <div className="w-16 h-16 p-1.5 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
      <img
        src={setting.general.companyLogo}
        alt="Company Logo"
        className="w-full h-full object-contain"
      />
    </div>
  )}

  {/* Right Side */}
  <div className="flex flex-col gap-2 flex-1 min-w-0 mt-3">
    {/* Company Name */}
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase">
        Company Name
      </p>
<p className="text-gray-900 text-lg font-bold">
  {setting.general.companyName || "—"}
</p>
    </div>

    
     
    
  </div>
  
</div>

     
<div>
  {/* Company Address */}
      <p className="text-xs font-semibold text-gray-500 uppercase m-2 ">
        Company Address
      </p>
      <div className="text-gray-700 text-[11px] leading-snug m-2">

        <p>
          {[
            setting.general.address.plot_no,
            setting.general.address.floor_no,
            setting.general.address.building_name,
          ]
            .filter(Boolean)
            .join(", ") || "—"}
        </p>

        {setting.general.address.street && (
          <p>{setting.general.address.street}</p>
        )}

        <p>
          {[
            setting.general.address.area,
            setting.general.address.city,
            setting.general.address.pincode,
            setting.general.address.country,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
      </div>

</div>
      








                    

                      {/* ================= GRID SECTIONS ================= */}
                      <div className="space-y-2 mt-3">
  {/* REGION */}
  <MiniCard title="REGIONAL">
    <div className="flex justify-between">
      <span>Currency</span>
      <span className="font-medium">
        {setting.general.currency}
      </span>
    </div>
    <div className="flex justify-between">
      <span>Date</span>
      <span className="font-medium">
        {setting.general.dateFormat || "MM/DD/YYYY"}
      </span>
    </div>
  </MiniCard>

  {/* INVOICE */}
  <MiniCard title="INVOICE FORMATE">
    <div className="flex justify-between">
      <span>Format</span>
      <span className="font-medium">
        {setting.invoice.format}
      </span>
    </div>
  </MiniCard>

  {/* BANK */}

  

<MiniCard title="BANK DETAILS">
  <div className="flex items-center justify-between gap-4">
    {/* LEFT: DETAILS */}
    <div className="grid grid-cols-[90px_1fr] gap-x-3 gap-y-1 text-xs">
      <span className="text-gray-500">Bank</span>
      <span className="font-medium text-gray-800">
        {setting.payment?.bankName || "—"}
      </span>

      <span className="text-gray-500">Account</span>
      <span className="font-medium text-gray-800">
        {setting.payment?.accountNumber || "—"}
      </span>

      <span className="text-gray-500">IFSC</span>
      <span className="font-medium text-gray-800">
        {setting.payment?.ifscCode || "—"}
      </span>

      <span className="text-gray-500">Branch</span>
      <span className="font-medium text-gray-800 leading-snug">
        {setting.payment?.branchName || "—"}
      </span>
    </div>

    {/* RIGHT: QR */}
    {setting.payment?.qrCode && (
      <div className="flex flex-col items-center">
        <img
          src={setting.payment.qrCode}
          alt="Payment QR"
          className="w-16 h-16 object-contain opacity-90"
        />
        <span className="text-[10px] text-gray-400 mt-1">
          Scan
        </span>
      </div>
    )}
  </div>
</MiniCard>


  {/* SIGNATURE */}
  <MiniCard title="SIGNATURE">
    {setting.general.signature ? (
      <img
        src={setting.general.signature}
        alt="Signature"
        className="h-10 object-contain border rounded"
      />
    ) : (
      <span className="text-gray-400">No signature</span>
    )}
  </MiniCard>

  <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-gray-700 uppercase">
        Primary Color
      </p>
      
    </div>

    <div className="flex items-center gap-2">
      <span className="text-gray-700 font-mono text-xs">
        {setting.general.primaryColor || "—"}
      </span>
      <div
        className="w-5 h-5 rounded-md border border-gray-300"
        style={{ backgroundColor: setting.general.primaryColor }}
      />
    </div>
  </div>
</div>

</div>
                      



                    </Card>
                    </Badge.Ribbon>
                  </Col>
                ))}
              </Row>

  



  
            )}
          </>
        )}

        {/* CREATE MODE */}
        {mode === "create" && (
          <>
            <Steps
              current={currentStep}
              className="mb-8"
              items={[
                { title: "General" },
                { title: "Invoice" },
                { title: "Payment" },
              ]}
            />

            <div className="mt-6">
              {currentStep === 0 && (
  <GeneralSettings
    formRef={generalFormRef}
    initialValues={draft.general}
    onSave={(data) => setDraft((prev) => ({ ...prev, general: data }))}
  />
)}


              {currentStep === 1 && (
  <InvoiceSetting

    initialValues={draft.invoice}
    onSave={(data) => setDraft((prev) => ({ ...prev, invoice: data }))}
  />
)}

             {currentStep === 2 && (
  <BankPaymentSettings

    initialValues={draft.payment}
    onSave={(data) => setDraft((prev) => ({ ...prev, payment: data }))}
  />
)}
            </div>

            <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-between items-center z-50">
              {/* BACK */}
              <div style={{ paddingLeft: "7%" }}>
                <Button
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep((s) => s - 1)}
                >
                  Back
                </Button>
              </div>

              {/* NEXT / SAVE */}
              {currentStep < 2 ? (
                // <Button
                //   type="primary"
                //   onClick={() => setCurrentStep((s) => s + 1)}
                // >
                //   Next
                // </Button>

                <Button
  type="primary"
  onClick={async () => {
    if (currentStep === 0) {
      try {
        await generalFormRef.current?.validateFields();
        setCurrentStep(1);
      } catch {
        message.error("Please fill required fields");
      }
    } else {
      setCurrentStep((s) => s + 1);
    }
  }}
>
  Next
</Button>






              ) : (
                
               
               




<Button
  type="primary"
  loading={createMutation.isPending || updateMutation.isPending}
  onClick={async() => {
    // if (!draft.general.companyName) {
    //   alert("Please enter a company name in the General tab.");
    //   setCurrentStep(0);
    //   return;
    // }
    try {
    await generalFormRef.current?.validateFields();
  } catch {
    setCurrentStep(0);
    message.error("Please fix errors in General tab");
    return;
  }

    const payload = {
      name: draft.general.companyName || "Untitled",
      general: draft.general,
      invoice: draft.invoice,
      payment: draft.payment,
    };

    if (editingId) {
      // Update existing
      updateMutation.mutate(
        { id: editingId, data: payload },
        {
          onSuccess: () => {
            message.success("Settings updated successfully!");
            refetch();
            resetDraft();
            setMode("view");
          },
          // onError: (err) => console.error(err),
          onError: (err: any) => {
        // This will show you exactly what the backend complained about
        message.error(err?.response?.data?.error || "Update failed");
      },
        }
      );
    } else {
      // Create new
      createMutation.mutate(payload, {
        onSuccess: () => {
          refetch();
          resetDraft();
          setMode("view");
        },
        onError: (err) => console.error(err),
      });
    }
  }}
>
  {editingId ? "Update" : "Save All"}
</Button>


              )}
            </div>
          </>
        )}


        </Card>
      </div>

      

  
 

<Modal
  title="Confirm Permanent Deletion"
  open={deleteModalOpen}
  onCancel={() => setDeleteModalOpen(false)}
  onOk={() => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => {
          setDeleteModalOpen(false); // Close modal on success
          setDeleteId(null);
        }
      });
    }
  }}
  okText="Delete"
  okButtonProps={{ 
    danger: true, 
    loading: deleteMutation.isPending 
  }}
>
  <p>Are you sure? This will delete the profile and all associated <strong>General, Invoice, and Payment</strong> settings permanently.</p>
</Modal>

    </MainLayout>
  );
}


