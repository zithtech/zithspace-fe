// "use client";
// import React, { useState, useEffect, Suspense } from "react";
// import MainLayout from "@/components/layout/MainLayout";
// import { useRouter } from "next/navigation";
// import { useSearchParams } from "next/navigation";
// import dayjs from "dayjs";
// import { Card, Typography, Form, Select, Divider, Input, message } from "antd";
// import {
//   FileTextOutlined,
//   EyeOutlined,
//   FileProtectOutlined,
// } from "@ant-design/icons";
// import ExpenseBuilder, {
//   ExpenseItem,
//   Mode,
// } from "@/components/reimbursement/ExpenseBuilder";
// import {
//   useCreateRequest,
//   useUpdateRequest,
//   useRequest,
// } from "@/hooks/useCategories";
// import { useAuth } from "@/context/AuthContext";

// const { Title } = Typography;

// function ReimburseCreateContent() {
//   const router = useRouter();
//   const [form] = Form.useForm();

//   const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
//   const [expenseMode, setExpenseMode] = useState<Mode>("empty");
//   const [previewData, setPreviewData] = useState<any>({});

//   /* ===== EDIT MODE STATE ===== */
//   const { user } = useAuth();
//   const searchParams = useSearchParams();
//   const editId = searchParams.get("id");
//   const isEditMode = !!editId;

//   // Hooks

//   const { mutateAsync: createRequest, isPending: isCreating } =
//     useCreateRequest();
//   const { mutateAsync: updateRequest, isPending: isUpdating } =
//     useUpdateRequest();
//   const { data: requestData, isLoading } = useRequest(editId || "");

//   /* ===== LOAD DATA FOR EDIT ===== */
//   useEffect(() => {
//     if (isEditMode && requestData) {
//       // requestData might be { success: true, data: ... } depending on service return
//       const data = (requestData as any).data || requestData;

//       if (data) {
//         // Populate Form
//         form.setFieldsValue({
//           category: data.category,
//           department: data.department,
//           policy: data.policy || "default", // Check if policy exists in type
//         });

//         // Populate Items
//         // Transform service items back to builder items
//         const items = (data.expenseItems || []).map((i: any) => ({
//           date: i.date ? dayjs(i.date) : undefined, // parsing helpful if dayjs available, else string
//           amount: i.amount,
//           description: i.title,
//           files: i.attachments || [],
//           category: data.category,
//           department: data.department,
//         }));

//         setExpenseItems(items as any[]);
//         setExpenseMode("list");
//         setPreviewData(form.getFieldsValue());
//       }
//     }
//   }, [isEditMode, requestData, form]);

//   const total = expenseItems.reduce(
//     (sum: number, i: any) => sum + (Number(i.amount) || 0),
//     0,
//   );
//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();

//       console.log("📦 Expense Items with files:", expenseItems);

//       // Check if files have URLs
//       expenseItems.forEach((item, idx) => {
//         console.log(`Item ${idx + 1} files:`, item.files);
//         console.log(
//           `Item ${idx + 1} URLs:`,
//           item.files?.map((f) => f.url),
//         );
//       });

//       const payload: any = {
//         category: values.category,
//         department: values.department,
//         policy: values.policy,
//         amount: total,
//         status: "PENDING_APPROVAL",
//         items: expenseItems.map((i) => ({
//           title: i.description || "Expense Item",
//           date: i.date ? i.date.toISOString() : new Date().toISOString(),
//           amount: Number(i.amount),
//           billNo: i.billNo,
//           description: i.description,
//           // ✅ CORRECT - Send URL, not just filename!
//           attachments: (i.files || []).map((f: any) => ({
//             url: f.url || f.fileUrl, // 🔥 URL is must!
//             name: f.name || f.fileName, // optional
//           })),
//         })),
//       };

//       console.log("📤 Submitting payload:", JSON.stringify(payload, null, 2));

//       if (isEditMode && editId) {
//         await updateRequest({ id: editId, data: payload });
//       } else {
//         await createRequest(payload);
//       }

//       message.success("Expense submitted successfully!");
//       router.push("/reimbursement");
//     } catch (e) {
//       console.error("❌ Submit error:", e);
//       message.error("Failed to submit expense");
//     }
//   };

//   const handleCancelAll = () => {
//     form.resetFields();
//     setExpenseItems([]);
//     setExpenseMode("empty");
//     setPreviewData({});
//   };

//   const resetCategoryAndPolicy = () => {
//     form.resetFields(["category", "policy"]);
//     setPreviewData(form.getFieldsValue());
//   };

//   const handleSaveDraft = async () => {
//     try {
//       const values = form.getFieldsValue();

//       console.log("📝 Saving draft with files:", expenseItems);

//       const draftPayload: any = {
//         category: values.category || "Uncategorized",
//         department: values.department,
//         policy: values.policy,
//         amount: total || 0,
//         status: "DRAFT",
//         items: expenseItems.map((i) => ({
//           title: i.description || "Expense Item",
//           date: i.date ? i.date.toISOString() : new Date().toISOString(),
//           amount: Number(i.amount) || 0,
//           billNo: i.billNo,
//           description: i.description,
//           // ✅ CORRECT - Send URL for draft too!
//           attachments: (i.files || []).map((f: any) => ({
//             url: f.url || f.fileUrl, // 🔥 URL is must!
//             name: f.name || f.fileName,
//           })),
//         })),
//       };

//       console.log("📝 Draft payload:", JSON.stringify(draftPayload, null, 2));

//       await createRequest(draftPayload);
//       message.success("Draft saved successfully!");
//       router.push("/reimbursement");
//     } catch (error) {
//       console.error("❌ Save draft failed:", error);
//       message.error("Failed to save draft");
//     }
//   };

//   const handleCancel = () => {
//     router.push("/reimbursement");
//   };

//   return (
//     <>
//       <div className="min-h-screen bg-gray-50 p-3">
//         {/* ===== MAIN CONTENT - NO SCROLL ===== */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
//           {/* LEFT: FORM */}
//           <div className="lg:col-span-2">
//             <Card
//               className="
//                 rounded-lg
//                 border border-gray-200
//                 bg-white
//                 shadow-sm
//                 p-0
//                 min-h-[470px]
//               "
//               title={
//                 <div className="flex items-center justify-between p-0">
//                   <div className="flex items-center gap-2">
//                     <div
//                       className="
//                       flex items-center justify-center 
//                       w-6 h-6 
//                       rounded-md 
//                       bg-blue-50
//                       border border-blue-100
//                     "
//                     >
//                       <FileProtectOutlined className="text-xs text-blue-600" />
//                     </div>
//                     <div>
//                       <h3 className="text-xs font-bold text-gray-900">
//                         {isEditMode
//                           ? "Edit Reimbursement"
//                           : "Create Reimbursement"}
//                       </h3>

//                       <p className="text-xs text-gray-500">
//                         {isEditMode
//                           ? "Update existing reimbursement request"
//                           : "Enter required details"}
//                       </p>
//                     </div>
//                   </div>
//                   <span
//                     className={`
//     text-[10px] font-bold px-2 py-0.5 rounded border
//     ${
//       isEditMode
//         ? "bg-amber-50 text-amber-700 border-amber-200"
//         : "bg-blue-50 text-blue-600 border-blue-100"
//     }
//   `}
//                   >
//                     {isEditMode ? "EDIT" : "CREATE"}
//                   </span>
//                 </div>
//               }
//               headStyle={{
//                 borderBottom: "1px solid #f0f0f0",
//                 padding: "12px",
//                 minHeight: "auto",
//               }}
//               bodyStyle={{ padding: "12px" }}
//             >
//               <Form
//                 form={form}
//                 layout="vertical"
//                 size="small"
//                 className="space-y-2"
//                 onValuesChange={(_, allValues) => setPreviewData(allValues)}
//               >
//                 {/* Category & Policy - COMPACT */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//                   <Form.Item
//                     label={
//                       <span className="text-xs font-semibold text-gray-700">
//                         Expense Category *
//                       </span>
//                     }
//                     name="category"
//                     rules={[{ required: true, message: "Required" }]}
//                   >
//                     <Select
//                       showSearch
//                       placeholder="Select category"
//                       className="w-full text-xs h-7"
//                       size="small"
//                       options={[
//                         { label: "Travel", value: "travel" },
//                         { label: "Food & Meals", value: "food" },
//                         { label: "Internet", value: "internet" },
//                         { label: "Mobile", value: "mobile" },
//                         { label: "Medical", value: "medical" },
//                         { label: "Office Supplies", value: "office" },
//                         { label: "Other", value: "other" },
//                       ]}
//                     />
//                   </Form.Item>

//                   <Form.Item
//                     label={
//                       <span className="text-xs font-semibold text-gray-700">
//                         Department <span className="text-red-500">*</span>
//                       </span>
//                     }
//                     name="department"
//                     rules={[
//                       { required: true, message: "Department is required" },
//                     ]}
//                   >
//                     <Input
//                       placeholder="Enter a Department"
//                       size="small"
//                       className="text-xs rounded-md"
//                     />
//                   </Form.Item>
//                 </div>

//                 <Divider className="my-2 border-gray-200" />

//                 {/* Expense Builder - COMPACT */}
//                 <div>
//                   <div className="mb-2">
//                     <h4 className="text-xs font-bold text-gray-900">
//                       Expense Items
//                     </h4>
//                     <p className="text-xs text-gray-500">
//                       Add expense items below
//                     </p>
//                   </div>

//                   <div
//                     className="
//                     rounded-lg
//                     border border-gray-200
//                     bg-gray-50
//                     p-2
//                   "
//                   >
//                     <ExpenseBuilder
//                       items={expenseItems}
//                       setItems={setExpenseItems}
//                       mode={expenseMode}
//                       setMode={setExpenseMode}
//                       onSubmit={handleSubmit}
//                       onCancelAll={handleCancelAll}
//                       onResetMainForm={resetCategoryAndPolicy}
//                       onSaveDraft={handleSaveDraft}
//                       onCancel={handleCancel}
//                       submitting={isCreating || isUpdating}
//                       currentCategory={previewData.category}
//                       currentDepartment={previewData.department}
//                       onEdit={(item) => {
//                         form.setFieldsValue({
//                           category: item.category,
//                           department: item.department,
//                         });
//                         setPreviewData(form.getFieldsValue());
//                       }}
//                     />
//                   </div>
//                 </div>
//               </Form>
//             </Card>
//           </div>

//           {/* RIGHT: PREVIEW */}
//           <div className="lg:col-span-1">
//             <Card
//               className="
//                 rounded-lg
//                 border border-gray-200
//                 bg-white
//                 shadow-sm
//                 p-0
//                 min-h-[470px]
//               "
//               title={
//                 <div className="flex items-center justify-between p-0">
//                   <div className="flex items-center gap-2">
//                     <div
//                       className="
//                       flex items-center justify-center 
//                       w-6 h-6 
//                       rounded-md 
//                       bg-purple-50
//                       border border-purple-100
//                     "
//                     >
//                       <EyeOutlined className="text-xs text-purple-600" />
//                     </div>
//                     <div>
//                       <h3 className="text-xs font-bold text-gray-900">
//                         Live Preview
//                       </h3>
//                       <p className="text-xs text-gray-500">
//                         Review before submit
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex justify-end items-center gap-2">
//                     <span
//                       className="
//       text-[10px] font-bold
//       bg-purple-50
//       text-purple-600
//       px-2 py-0.5
//       rounded
//       border border-purple-100
//     "
//                     >
//                       PREVIEW
//                     </span>

//                     <button
//                       type="button"
//                       onClick={handleCancel}
//                       className="
//       px-3 py-1.5 text-xs font-medium
//       text-gray-700
//       border border-gray-300
//       rounded-md
//       hover:bg-gray-50
//       transition
//     "
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               }
//               headStyle={{
//                 borderBottom: "1px solid #f0f0f0",
//                 padding: "12px",
//                 minHeight: "auto",
//               }}
//               bodyStyle={{ padding: "12px" }}
//             >
//               {/* Category & Policy Preview */}
//               <div className="space-y-2 mb-3">
//                 <div
//                   className="
//                   flex justify-between items-center
//                   p-2
//                   rounded-md
//                   bg-gray-50
//                   border border-gray-200
//                 "
//                 >
//                   <div className="flex items-center gap-1">
//                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
//                     <span className="text-xs font-semibold text-gray-700">
//                       Category
//                     </span>
//                   </div>
//                   <span className="text-xs font-bold text-gray-900">
//                     {previewData.category || "—"}
//                   </span>
//                 </div>

//                 <div
//                   className="
//                   flex justify-between items-center
//                   p-2
//                   rounded-md
//                   bg-gray-50
//                   border border-gray-200
//                 "
//                 >
//                   <div className="flex items-center gap-1">
//                     <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
//                     <span className="text-xs font-semibold text-gray-700">
//                       Department
//                     </span>
//                   </div>
//                   <span className="text-xs font-bold text-gray-900">
//                     {previewData.department || "—"}
//                   </span>
//                 </div>
//               </div>
//               {/* Expense Items Preview */}
//               <div>
//                 <div
//                   className="
//                   flex items-center justify-between
//                   p-1
//                   rounded-md
//                   bg-gray-50
//                   border border-gray-200
//                   mb-2
//                 "
//                 >
//                   <div className="flex items-center gap-1">
//                     <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
//                     <span className="text-xs font-bold text-gray-700">
//                       Expense Details
//                     </span>
//                   </div>

//                   <span
//                     className="
//   text-[10px] font-semibold
//   uppercase tracking-wide
//   px-2 py-0.5
//   rounded-md
//   bg-slate-50
//   text-slate-600
//   border border-slate-200
// "
//                   >
//                     {expenseMode}
//                   </span>
//                 </div>

//                 {expenseItems.length === 0 ? (
//                   <div
//                     className="
//     flex flex-col items-center justify-center
//     py-6
//     rounded-lg
//     border border-dashed border-gray-300
//     bg-white
//   "
//                   >
//                     {/* ICON */}
//                     <div
//                       className="
//       w-9 h-9
//       flex items-center justify-center
//       rounded-md
//       bg-gray-50
//       border border-gray-200
//       mb-2
//     "
//                     >
//                       <span className="text-gray-400 text-sm">📁</span>
//                     </div>

//                     {/* TITLE */}
//                     <p className="text-xs font-semibold text-gray-700">
//                       No Expense Items
//                     </p>

//                     {/* SUB TEXT */}
//                     <p className="text-[11px] text-gray-500 mt-0.5 text-center">
//                       Add expense details to proceed
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-1.5">
//                     {expenseItems.map((item, idx) => (
//                       <div
//                         key={idx}
//                         className="
//                           p-2
//                           rounded-md
//                           border border-gray-200
//                           bg-white
//                         "
//                       >
//                         <div className="flex justify-between items-start mb-1">
//                           <div className="flex items-center gap-1">
//                             <span
//                               className="
//                               text-2xs font-semibold 
//                               text-gray-500 
//                               bg-gray-100 
//                               px-1 py-0.5 
//                               rounded
//                             "
//                             >
//                               #{idx + 1}
//                             </span>
//                             <span className="text-xs font-medium text-gray-700">
//                               {item.date?.format("DD MMM") || "—"}
//                             </span>
//                           </div>
//                           <span
//                             className="
//                             flex items-center gap-0.5
//                             text-2xs font-medium
//                             text-emerald-600
//                             bg-emerald-50
//                             px-1 py-0.5
//                             rounded-full
//                           "
//                           >
//                             📎 {item.files?.length || 0}
//                           </span>
//                         </div>

//                         <div className="flex justify-between items-center">
//                           <span className="text-xs text-gray-600">Amount</span>
//                           <span className="text-xs font-bold text-gray-900">
//                             ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
//                           </span>
//                         </div>

//                         {item.description && (
//                           <div
//                             className="
//                             mt-1 pt-1
//                             border-t border-gray-100
//                             text-xs text-gray-700
//                           "
//                           >
//                             {item.description}
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {expenseItems.length > 0 && (
//                   <>
//                     <Divider className="my-2 border-gray-200" />

//                     <div
//                       className="
//   flex justify-between items-center
//   px-3 py-2
//   rounded-md
//   bg-gray-50
//   border border-gray-200
// "
//                     >
//                       <span className="text-[11px] font-semibold text-gray-600 uppercase">
//                         Total Amount
//                       </span>

//                       <span className="text-sm font-bold text-gray-900">
//                         ₹{total.toLocaleString("en-IN")}
//                       </span>
//                     </div>
//                   </>
//                 )}

//                 {expenseMode === "review" && (
//                   <div className="mt-2">
//                     <div
//                       className="
//                       flex items-center justify-center gap-1
//                       p-2
//                       rounded-md
//                       bg-emerald-50
//                       border border-emerald-200
//                     "
//                     >
//                       <span
//                         className="
//                         flex items-center justify-center 
//                         w-4 h-4 
//                         rounded-full 
//                         bg-emerald-500 
//                         text-white 
//                         text-2xs
//                       "
//                       >
//                         ✓
//                       </span>
//                       <span className="text-xs font-bold text-emerald-700">
//                         Ready to submit
//                       </span>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

// export default function ReimburseCreatePage() {
//   return (
//     <MainLayout>
//       <Suspense
//         fallback={
//           <div className="flex h-[calc(100vh-64px)] items-center justify-center p-10">
//             <div className="text-gray-500">
//               Loading reimbursement details...
//             </div>
//           </div>
//         }
//       >
//         <ReimburseCreateContent />
//       </Suspense>
//     </MainLayout>
//   );
// }

"use client";
import React, { useState, useEffect, Suspense } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { Card, Typography, Form, Select, Divider, Input, message } from "antd";
import {
  FileTextOutlined,
  EyeOutlined,
  FileProtectOutlined,
} from "@ant-design/icons";
import ExpenseBuilder, {
  ExpenseItem,
  Mode,
} from "@/components/reimbursement/ExpenseBuilder";
import {
  useCreateRequest,
  useUpdateRequest,
  useRequest,
} from "@/hooks/useCategories";
import { useAuth } from "@/context/AuthContext";

const { Title } = Typography;

function ReimburseCreateContent() {
  const router = useRouter();
  const [form] = Form.useForm();

  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [expenseMode, setExpenseMode] = useState<Mode>("empty");
  const [previewData, setPreviewData] = useState<any>({});

  /* ===== EDIT MODE STATE ===== */
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = !!editId;

  // Hooks
  const { mutateAsync: createRequest, isPending: isCreating } =
    useCreateRequest();
  const { mutateAsync: updateRequest, isPending: isUpdating } =
    useUpdateRequest();
  const { data: requestData, isLoading } = useRequest(editId || "");

  /* ===== LOAD DATA FOR EDIT ===== */
  useEffect(() => {
    if (isEditMode && requestData) {
      // requestData might be { success: true, data: ... } depending on service return
      const data = (requestData as any).data || requestData;

      if (data) {
        // Populate Form
        form.setFieldsValue({
          category: data.category,
          department: data.department,
          policy: data.policy || "default", // Check if policy exists in type
        });

        // Populate Items
        // Transform service items back to builder items
        const items = (data.expenseItems || []).map((i: any) => ({
          date: i.date ? dayjs(i.date) : undefined, // parsing helpful if dayjs available, else string
          amount: i.amount,
          description: i.title,
          files: i.attachments || [],
          category: data.category,
          department: data.department,
        }));

        setExpenseItems(items as any[]);
        setExpenseMode("list");
        setPreviewData(form.getFieldsValue());
      }
    }
  }, [isEditMode, requestData, form]);

  const total = expenseItems.reduce(
    (sum: number, i: any) => sum + (Number(i.amount) || 0),
    0,
  );
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      console.log("📦 Expense Items with files:", expenseItems);

      // Check if files have URLs
      expenseItems.forEach((item, idx) => {
        console.log(`Item ${idx + 1} files:`, item.files);
        console.log(
          `Item ${idx + 1} URLs:`,
          item.files?.map((f) => f.url),
        );
      });

      const payload: any = {
        category: values.category,
        department: values.department,
        policy: values.policy,
        amount: total,
        status: "PENDING_APPROVAL",
        items: expenseItems.map((i) => ({
          title: i.description || "Expense Item",
          date: i.date ? i.date.toISOString() : new Date().toISOString(),
          amount: Number(i.amount),
          billNo: i.billNo,
          description: i.description,
          // ✅ CORRECT - Send URL, not just filename!
          attachments: (i.files || []).map((f: any) => ({
            url: f.url || f.fileUrl, // 🔥 URL is must!
            name: f.name || f.fileName, // optional
          })),
        })),
      };

      console.log("📤 Submitting payload:", JSON.stringify(payload, null, 2));

      if (isEditMode && editId) {
        await updateRequest({ id: editId, data: payload });
      } else {
        await createRequest(payload);
      }

      message.success("Expense submitted successfully!");
      router.push("/reimbursement");
    } catch (e) {
      console.error("❌ Submit error:", e);
      message.error("Failed to submit expense");
    }
  };

  const handleCancelAll = () => {
    form.resetFields();
    setExpenseItems([]);
    setExpenseMode("empty");
    setPreviewData({});
  };

  const resetCategoryAndPolicy = () => {
    form.resetFields(["category", "policy"]);
    setPreviewData(form.getFieldsValue());
  };

  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue();

      console.log("📝 Saving draft with files:", expenseItems);

      const draftPayload: any = {
        category: values.category || "Uncategorized",
        department: values.department,
        policy: values.policy,
        amount: total || 0,
        status: "DRAFT",
        items: expenseItems.map((i) => ({
          title: i.description || "Expense Item",
          date: i.date ? i.date.toISOString() : new Date().toISOString(),
          amount: Number(i.amount) || 0,
          billNo: i.billNo,
          description: i.description,
          // ✅ CORRECT - Send URL for draft too!
          attachments: (i.files || []).map((f: any) => ({
            url: f.url || f.fileUrl, // 🔥 URL is must!
            name: f.name || f.fileName,
          })),
        })),
      };

      console.log("📝 Draft payload:", JSON.stringify(draftPayload, null, 2));

      await createRequest(draftPayload);
      message.success("Draft saved successfully!");
      router.push("/reimbursement");
    } catch (error) {
      console.error("❌ Save draft failed:", error);
      message.error("Failed to save draft");
    }
  };

  const handleCancel = () => {
    router.push("/reimbursement");
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* ===== MAIN CONTENT - MEDIUM SIZED ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: FORM */}
          <div className="lg:col-span-2">
            <Card
              className="
                rounded-xl
                border border-gray-200
                bg-white
                shadow-md
                p-0
                min-h-[550px]
              "
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Cancel button inside card at top left */}
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="
                        flex items-center gap-1
                        px-3 py-1.5 text-sm font-medium
                        text-gray-600
                        border border-gray-200
                        rounded-lg
                        hover:bg-gray-50
                        hover:text-gray-900
                        transition-colors
                        mr-2
                      "
                    >
                      <span>←</span> Cancel
                    </button>
                    
                    <div
                      className="
                      flex items-center justify-center 
                      w-10 h-10 
                      rounded-lg 
                      bg-blue-50
                      border border-blue-200
                    "
                    >
                      <FileProtectOutlined className="text-lg text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        {isEditMode
                          ? "Edit Reimbursement"
                          : "Create Reimbursement"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {isEditMode
                          ? "Update existing reimbursement request"
                          : "Enter required details"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`
                      text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap
                      ${
                        isEditMode
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-blue-50 text-blue-600 border-blue-200"
                      }
                    `}
                  >
                    {isEditMode ? "EDIT MODE" : "CREATE NEW"}
                  </span>
                </div>
              }
              headStyle={{
                borderBottom: "1px solid #f0f0f0",
                padding: "16px 20px",
                minHeight: "auto",
              }}
              bodyStyle={{ padding: "20px" }}
            >
              <Form
                form={form}
                layout="vertical"
                size="middle"
                className="space-y-4"
                onValuesChange={(_, allValues) => setPreviewData(allValues)}
              >
                {/* Category & Policy - MEDIUM SIZED */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label={
                      <span className="text-sm font-semibold text-gray-700">
                        Expense Category <span className="text-red-500">*</span>
                      </span>
                    }
                    name="category"
                    rules={[{ required: true, message: "Category is required" }]}
                  >
                    <Select
                      showSearch
                      placeholder="Select expense category"
                      className="w-full"
                      size="middle"
                      options={[
                        { label: "Travel", value: "travel" },
                        { label: "Food & Meals", value: "food" },
                        { label: "Internet", value: "internet" },
                        { label: "Mobile", value: "mobile" },
                        { label: "Medical", value: "medical" },
                        { label: "Office Supplies", value: "office" },
                        { label: "Other", value: "other" },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="text-sm font-semibold text-gray-700">
                        Department <span className="text-red-500">*</span>
                      </span>
                    }
                    name="department"
                    rules={[
                      { required: true, message: "Department is required" },
                    ]}
                  >
                    <Input
                      placeholder="Enter department name"
                      size="middle"
                      className="text-sm rounded-lg"
                    />
                  </Form.Item>
                </div>

                <Divider className="my-4 border-gray-200" />

                {/* Expense Builder - MEDIUM SIZED */}
                <div>
                  <div className="mb-4">
                    <h4 className="text-base font-bold text-gray-900">
                      Expense Items
                    </h4>
                    <p className="text-sm text-gray-500">
                      Add and manage expense items below
                    </p>
                  </div>

                  <div
                    className="
                    rounded-xl
                    border border-gray-200
                    bg-gray-50
                    p-4
                  "
                  >
                    <ExpenseBuilder
                      items={expenseItems}
                      setItems={setExpenseItems}
                      mode={expenseMode}
                      setMode={setExpenseMode}
                      onSubmit={handleSubmit}
                      onCancelAll={handleCancelAll}
                      onResetMainForm={resetCategoryAndPolicy}
                      onSaveDraft={handleSaveDraft}
                      onCancel={handleCancel}
                      submitting={isCreating || isUpdating}
                      currentCategory={previewData.category}
                      currentDepartment={previewData.department}
                      onEdit={(item) => {
                        form.setFieldsValue({
                          category: item.category,
                          department: item.department,
                        });
                        setPreviewData(form.getFieldsValue());
                      }}
                    />
                  </div>
                </div>
              </Form>
            </Card>
          </div>

          {/* RIGHT: PREVIEW */}
          <div className="lg:col-span-1">
            <Card
              className="
                rounded-xl
                border border-gray-200
                bg-white
                shadow-md
                p-0
                min-h-[550px]
              "
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-shrink">
                    <div
                      className="
                        flex items-center justify-center 
                        w-10 h-10 
                        rounded-lg 
                        bg-purple-50
                        border border-purple-200
                        flex-shrink-0
                      "
                    >
                      <EyeOutlined className="text-lg text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">
                        Live Preview
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        Review before submission
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="
                        text-xs font-bold
                        bg-purple-50
                        text-purple-600
                        px-2 py-1
                        rounded-full
                        border border-purple-200
                        whitespace-nowrap
                      "
                    >
                      PREVIEW
                    </span>

                    {/* Cancel button in preview card header */}
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="
                        px-3 py-1.5 text-sm font-medium
                        text-gray-700
                        border border-gray-300
                        rounded-lg
                        hover:bg-gray-50
                        transition-colors
                        whitespace-nowrap
                      "
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              }
              headStyle={{
                borderBottom: "1px solid #f0f0f0",
                padding: "16px 20px",
                minHeight: "auto",
              }}
              bodyStyle={{ padding: "20px" }}
            >
              {/* Category & Policy Preview */}
              <div className="space-y-3 mb-4">
                <div
                  className="
                    flex justify-between items-center
                    p-3
                    rounded-lg
                    bg-gray-50
                    border border-gray-200
                  "
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-semibold text-gray-700">
                      Category
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {previewData.category ? 
                      previewData.category.charAt(0).toUpperCase() + previewData.category.slice(1) 
                      : "—"}
                  </span>
                </div>

                <div
                  className="
                    flex justify-between items-center
                    p-3
                    rounded-lg
                    bg-gray-50
                    border border-gray-200
                  "
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-semibold text-gray-700">
                      Department
                    </span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {previewData.department || "—"}
                  </span>
                </div>
              </div>
              
              {/* Expense Items Preview */}
              <div>
                <div
                  className="
                    flex items-center justify-between
                    p-2
                    rounded-lg
                    bg-gray-50
                    border border-gray-200
                    mb-3
                  "
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                    <span className="text-sm font-bold text-gray-700">
                      Expense Details
                    </span>
                  </div>

                  <span
                    className="
                      text-xs font-semibold
                      uppercase tracking-wide
                      px-3 py-1
                      rounded-full
                      bg-slate-50
                      text-slate-600
                      border border-slate-200
                      whitespace-nowrap
                    "
                  >
                    {expenseMode === "empty" ? "No Items" : expenseMode}
                  </span>
                </div>

                {expenseItems.length === 0 ? (
                  <div
                    className="
                      flex flex-col items-center justify-center
                      py-10
                      rounded-xl
                      border border-dashed border-gray-300
                      bg-white
                    "
                  >
                    {/* ICON */}
                    <div
                      className="
                        w-14 h-14
                        flex items-center justify-center
                        rounded-xl
                        bg-gray-50
                        border border-gray-200
                        mb-3
                      "
                    >
                      <span className="text-gray-400 text-2xl">📋</span>
                    </div>

                    {/* TITLE */}
                    <p className="text-base font-semibold text-gray-700">
                      No Expense Items
                    </p>

                    {/* SUB TEXT */}
                    <p className="text-sm text-gray-500 mt-1 text-center max-w-[200px]">
                      Add expense items using the form on the left
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {expenseItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="
                          p-4
                          rounded-xl
                          border border-gray-200
                          bg-white
                          hover:shadow-sm transition-shadow
                        "
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="
                                text-xs font-semibold 
                                text-gray-600 
                                bg-gray-100 
                                px-2 py-1 
                                rounded-md
                                whitespace-nowrap
                              "
                            >
                              Item #{idx + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-700">
                              {item.date?.format("DD MMM YYYY") || "Date not set"}
                            </span>
                          </div>
                          <span
                            className="
                              flex items-center gap-1
                              text-xs font-medium
                              text-emerald-600
                              bg-emerald-50
                              px-2 py-1
                              rounded-full
                              whitespace-nowrap
                            "
                          >
                            <span>📎</span> {item.files?.length || 0}
                          </span>
                        </div>

                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Amount</span>
                          <span className="text-base font-bold text-gray-900">
                            ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {item.description && (
                          <div
                            className="
                              mt-2 pt-2
                              border-t border-gray-100
                              text-sm text-gray-700
                            "
                          >
                            <span className="font-medium text-gray-500">Description: </span>
                            {item.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {expenseItems.length > 0 && (
                  <>
                    <Divider className="my-4 border-gray-200" />

                    <div
                      className="
                        flex justify-between items-center
                        px-4 py-3
                        rounded-xl
                        bg-gray-50
                        border border-gray-200
                      "
                    >
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                        Total Amount
                      </span>
                      <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                )}

                {expenseMode === "review" && expenseItems.length > 0 && (
                  <div className="mt-4">
                    <div
                      className="
                        flex items-center justify-center gap-2
                        p-3
                        rounded-xl
                        bg-emerald-50
                        border border-emerald-200
                      "
                    >
                      <span
                        className="
                          flex items-center justify-center 
                          w-6 h-6 
                          rounded-full 
                          bg-emerald-500 
                          text-white 
                          text-sm
                          flex-shrink-0
                        "
                      >
                        ✓
                      </span>
                      <span className="text-base font-bold text-emerald-700 whitespace-nowrap">
                        Ready to submit
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ReimburseCreatePage() {
  return (
    <MainLayout>
      <Suspense
        fallback={
          <div className="flex h-[calc(100vh-64px)] items-center justify-center">
            <div className="text-gray-500 text-lg">
              Loading reimbursement details...
            </div>
          </div>
        }
      >
        <ReimburseCreateContent />
      </Suspense>
    </MainLayout>
  );
}