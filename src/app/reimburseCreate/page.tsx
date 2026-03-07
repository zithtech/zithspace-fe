// "use client";

// import React, { useState, useEffect, Suspense } from "react";
// import MainLayout from "@/components/layout/MainLayout";
// import { useRouter } from "next/navigation";
// import { useSearchParams } from "next/navigation";
// import dayjs from "dayjs";
// import {
//   Card,
//   Typography,
//   Form,
//   Select,
//   Divider,
//   Input,
//   message,
//   Button,
//   Row,
//   Col,
//   DatePicker,
//   Upload,
//   Tag,
//   InputNumber,
// } from "antd";
// import {
//   FileTextOutlined,
//   EyeOutlined,
//   FileProtectOutlined,
//   ArrowLeftOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   UploadOutlined,
//   EditOutlined,
//   CheckCircleOutlined,
// } from "@ant-design/icons";
// import {
//   useCreateRequest,
//   useUpdateRequest,
//   useRequest,
// } from "@/hooks/useCategories";
// import { useAuth } from "@/context/AuthContext";
// import { useUploadFile } from "@/hooks/useCategories";
// import AttachmentUploader from "@/components/common/AttachmentUploader";
// import AttachmentList from "@/components/common/AttachmentList";

// const { Title,Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// export type ExpenseItem = {
//   date?: any;
//   amount?: number;
//   billNo?: string;
//   description?: string;
//   files?: any[];
//   category?: string;
//   department?: string;
// };

// export type Mode = "empty" | "form" | "list" | "review";

// function ReimburseCreateContent() {
//   const router = useRouter();
//   const [form] = Form.useForm();
//   const { mutateAsync: uploadFile } = useUploadFile();

//   const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
//   const [previewData, setPreviewData] = useState<any>({});
//   const [mode, setMode] = useState<Mode>("empty");
//   const [activeIndex, setActiveIndex] = useState<number>(-1);
//   const [showError, setShowError] = useState(false);

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
//       const data = (requestData as any).data || requestData;

//       if (data) {
//         form.setFieldsValue({
//           category: data.category,
//           department: data.department,
//           policy: data.policy || "default",
//         });

//         const items = (data.expenseItems || []).map((i: any) => ({
//           date: i.date ? dayjs(i.date) : undefined,
//           amount: i.amount,
//           description: i.title,
//           files: i.attachments || [],
//           category: data.category,
//           department: data.department,
//           billNo: i.billNo,
//         }));

//         setExpenseItems(items as any[]);
//         setMode(items.length > 0 ? "list" : "empty");
//         setPreviewData(form.getFieldsValue());
//       }
//     }
//   }, [isEditMode, requestData, form]);

//   const total = expenseItems.reduce(
//     (sum: number, i: any) => sum + (Number(i.amount) || 0),
//     0,
//   );

//   const isItemValid = (item: ExpenseItem) => {
//     return !!item.date && !!item.amount && Number(item.amount) > 0;
//   };

//   const startAdd = () => {
//     if (expenseItems.length > 0) {
//       form.resetFields(["category", "policy"]);
//     }
//     setExpenseItems((prev) => [...prev, {}]);
//     setActiveIndex(expenseItems.length);
//     setMode("form");
//   };

//   const updateItem = (key: keyof ExpenseItem, value: any) => {
//     if (activeIndex === -1 || !expenseItems[activeIndex]) return;
//     const copy = [...expenseItems];
//     copy[activeIndex] = { ...copy[activeIndex], [key]: value };
//     setExpenseItems(copy);
//   };

//   const deleteItem = (index: number) => {
//     const updated = expenseItems.filter((_, i) => i !== index);
//     setExpenseItems(updated);
//     setMode(updated.length === 0 ? "empty" : "list");
//     setActiveIndex(-1);
//   };

//   const handleSaveExpense = () => {
//     const item = expenseItems[activeIndex];
//     if (!isItemValid(item)) {
//       setShowError(true);
//       return;
//     }

//     const values = form.getFieldsValue();
//     const updatedItem = {
//       ...item,
//       category: values.category,
//       department: values.department,
//     };
//     const copy = [...expenseItems];
//     copy[activeIndex] = updatedItem;
//     setExpenseItems(copy);

//     setShowError(false);
//     setMode("list");
//     form.resetFields(["date", "amount", "description", "billNo", "files"]);
//   };

//   const handleUpload = async (file: string, fileName: string) => {
//     try {
//       const res = await fetch(file);
//       const blob = await res.blob();
//       const fileObj = new File([blob], fileName);

//       const resData = await uploadFile(fileObj);

//       if (resData.success && resData.url) {
//         setExpenseItems((prev) => {
//           const copy = [...prev];
//           if (activeIndex >= 0 && activeIndex < copy.length) {
//             const currentItem = copy[activeIndex];
//             const existingFiles = currentItem.files || [];

//             const fileData = {
//               url: resData.url,
//               name: fileName,
//               uploadedAt: new Date().toISOString(),
//             };

//             copy[activeIndex] = {
//               ...currentItem,
//               files: [...existingFiles, fileData],
//             };
//           }
//           return copy;
//         });

//         message.success("Attachment uploaded successfully");
//       }
//     } catch (error) {
//       console.error("Upload error:", error);
//       message.error("Failed to upload attachment");
//     }
//   };

//   const handleDeleteAttachment = async (attachmentId: string) => {
//     const index = parseInt(attachmentId);
//     setExpenseItems((prev) => {
//       const copy = [...prev];
//       const currentItem = copy[activeIndex];
//       const newFiles = (currentItem.files || []).filter((_, i) => i !== index);
//       copy[activeIndex] = { ...currentItem, files: newFiles };
//       return copy;
//     });
//   };

//   const handleSubmit = async () => {
//     try {
//       const values = await form.validateFields();

//       console.log("📦 Expense Items with files:", expenseItems);

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
//           attachments: (i.files || []).map((f: any) => ({
//             url: f.url || f.fileUrl,
//             name: f.name || f.fileName,
//           })),
//         })),
//       };

//       console.log("📤 Submitting payload:", JSON.stringify(payload, null, 2));

//       if (isEditMode && editId) {
//         await updateRequest({ id: editId, data: payload });
//         message.success("Expense updated successfully!");
//       } else {
//         await createRequest(payload);
//         message.success("Expense submitted successfully!");
//       }

//       router.push("/reimbursement");
//     } catch (e) {
//       console.error("❌ Submit error:", e);
//       message.error("Failed to submit expense");
//     }
//   };

//   const handleSaveDraft = async () => {
//     try {
//       const values = form.getFieldsValue();

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
//           attachments: (i.files || []).map((f: any) => ({
//             url: f.url || f.fileUrl,
//             name: f.name || f.fileName,
//           })),
//         })),
//       };

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

//   const handleBack = () => {
//     router.push("/reimbursement");
//   };

//   const handleCancelAll = () => {
//     form.resetFields();
//     setExpenseItems([]);
//     setMode("empty");
//     setPreviewData({});
//     setActiveIndex(-1);
//   };

//   const resetCategoryAndPolicy = () => {
//     form.resetFields(["category", "policy"]);
//     setPreviewData(form.getFieldsValue());
//   };

//   const renderCompactExpense = (item: ExpenseItem, index: number) => {
//     if (!item?.date || !item?.amount) return null;

//     return (
//       <div
//         key={index}
//         className="mb-2 px-3 py-2 rounded border border-gray-200 bg-gray-50 flex justify-between items-center text-xs"
//       >
//         <div className="flex items-center gap-2">
//           <span className="font-bold text-blue-700">#{index + 1}</span>
//           <span className="text-gray-700">{item.date?.format("DD MMM")}</span>
//           <span className="font-bold text-gray-900">
//             ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
//           </span>
//         </div>

//         <div className="flex items-center gap-1">
//           <Button
//             type="text"
//             size="small"
//             icon={<EditOutlined className="text-xs" />}
//             onClick={() => {
//               setActiveIndex(index);
//               setMode("form");
//               form.setFieldsValue({
//                 category: item.category,
//                 department: item.department,
//               });
//             }}
//             className="h-4 w-4 p-0 min-w-0 text-blue-600"
//           />
//           <Button
//             type="text"
//             danger
//             size="small"
//             icon={<DeleteOutlined className="text-xs" />}
//             onClick={() => deleteItem(index)}
//             className="h-4 w-4 p-0 min-w-0"
//           />
//         </div>
//       </div>
//     );
//   };

//   const renderFormMode = () => {
//     if (activeIndex === -1 || !expenseItems[activeIndex]) return null;
//     const item = expenseItems[activeIndex];

//     return (
//       <div className="space-y-3">
//         {/* Show other expenses compact */}
//         {expenseItems.map((item, idx) => {
//           if (idx === activeIndex) return null;
//           return renderCompactExpense(item, idx);
//         })}

//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-1">
//             <div className="w-4 h-4 flex items-center justify-center rounded bg-blue-100">
//               <span className="text-xs font-bold text-blue-700">
//                 {activeIndex + 1}
//               </span>
//             </div>
//             <span className="text-xs font-bold text-gray-900">
//               Expense Item {activeIndex + 1}
//             </span>
//           </div>

//           <button
//             type="button"
//             onClick={() => {
//               const item = expenseItems[activeIndex];
//               if (
//                 item &&
//                 !item.date &&
//                 !item.amount &&
//                 !item.billNo &&
//                 !item.description &&
//                 (!item.files || item.files.length === 0)
//               ) {
//                 setExpenseItems((prev) => {
//                   const copy = [...prev];
//                   copy.splice(activeIndex, 1);
//                   return copy;
//                 });
//               }
//               setActiveIndex(-1);
//               setMode(expenseItems.length - 1 <= 0 ? "empty" : "list");
//             }}
//             className="px-2 py-0.5 text-[11px] font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition"
//           >
//             Cancel
//           </button>
//         </div>

//         {showError && (
//           <div className="p-1 rounded bg-red-50 border border-red-200">
//             <Text className="text-red-600 text-xs">Fill required fields</Text>
//           </div>
//         )}

//         <Row gutter={[6, 6]} className="mt-1">
//           <Col span={8}>
//             <label className="text-[11px] text-gray-600 block mb-0.5">
//               Date *
//             </label>
//             <DatePicker
//               size="small"
//               className="w-full text-xs h-6"
//               value={item.date}
//               onChange={(v) => {
//                 updateItem("date", v);
//                 setShowError(false);
//               }}
//             />
//           </Col>

//           <Col span={8}>
//             <label className="text-[11px] text-gray-600 block mb-0.5">
//               Amount *
//             </label>
//             <InputNumber
//               size="small"
//               className="w-full text-xs h-6"
//               style={{ width: "100%" }}
//               prefix="₹"
//               placeholder="0"
//               value={item.amount}
//               onChange={(v) => {
//                 updateItem("amount", v);
//                 setShowError(false);
//               }}
//               min={0}
//               precision={2}
//               controls={true}
//             />
//           </Col>

//           <Col span={8}>
//             <label className="text-[11px] text-gray-600 block mb-0.5">
//               Bill No
//             </label>
//             <Input
//               size="small"
//               className="w-full text-xs h-6"
//               value={item.billNo}
//               onChange={(e) => {
//                 updateItem("billNo", e.target.value);
//                 setShowError(false);
//               }}
//               placeholder="e.g., INV-001"
//             />
//           </Col>
//         </Row>

//         <div>
//           <label className="text-xs text-gray-600 block mb-0.5">
//             Description
//           </label>
//           <TextArea
//             rows={2}
//             className="w-full text-xs"
//             placeholder="Brief description..."
//             value={item.description}
//             onChange={(e) => updateItem("description", e.target.value)}
//           />
//         </div>

//         <div>
//           <div className="mb-2">
//             <AttachmentUploader
//               style={{ fontSize: "12px" }}
//               onUpload={handleUpload}
//               maxSize={5}
//             />
//           </div>
//           <div className="h-10 overflow-y-auto">
//             <AttachmentList
//               attachments={(item.files || []).map((f: any, i: number) => ({
//                 id: String(i),
//                 fileName: f.fileName || f.name || "file",
//                 fileUrl: f.fileUrl || f.url,
//                 fileSize: f.fileSize || f.size || 0,
//                 fileType: f.fileType || f.type || "unknown",
//                 uploadedAt: f.uploadedAt || new Date().toISOString(),
//                 uploadedBy: f.uploadedBy || {
//                   id: "current",
//                   name: "You",
//                 },
//               }))}
//               onDelete={handleDeleteAttachment}
//               loading={false}
//             />
//           </div>
//         </div>

//         <div className="flex items-center pt-1 border-t border-gray-200">
//           <Button
//             size="small"
//             onClick={handleCancelAll}
//             className="text-xs h-5 px-2"
//           >
//             Cancel All
//           </Button>

//           <div className="ml-auto flex items-center gap-2">
//             <Button
//               type="primary"
//               size="small"
//               onClick={handleSaveExpense}
//               disabled={!isItemValid(item)}
//               className="text-xs h-5 px-3 bg-blue-600 border-none"
//             >
//               Save
//             </Button>

//             <button
//               type="button"
//               onClick={handleSaveDraft}
//               disabled={isCreating}
//               className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
//             >
//               {isCreating ? "Saving..." : "Save Draft"}
//             </button>

//             <button
//               type="button"
//               onClick={handleCancel}
//               className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition"
//             >
//               Cancel
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderListMode = () => {
//     return (
//       <div className="space-y-2">
//         <div className="flex items-center justify-between">
//           <div>
//             <span className="text-xs font-bold text-gray-900">
//               Expense Items
//             </span>
//             <p className="text-2xs text-gray-500">
//               {expenseItems.length} item(s) added
//             </p>
//           </div>
//           <Tag color="blue" className="text-2xs">
//             {expenseItems.length} ITEMS
//           </Tag>
//         </div>

//         <div className="space-y-1.5">
//           {expenseItems.map((item, idx) => (
//             <div
//               key={idx}
//               className="p-2 rounded border border-gray-200 bg-white"
//             >
//               <div className="flex justify-between items-start mb-1">
//                 <div className="flex items-center gap-1">
//                   <span className="text-2xs font-bold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">
//                     #{idx + 1}
//                   </span>
//                   <span className="text-xs text-gray-700">
//                     {item.date?.format("DD MMM")}
//                   </span>
//                 </div>
//                 <div className="flex items-center gap-1">
//                   <Button
//                     type="text"
//                     danger
//                     size="small"
//                     icon={<DeleteOutlined className="text-xs" />}
//                     onClick={() => deleteItem(idx)}
//                     className="h-4 w-4 p-0 min-w-0"
//                   />
//                   <Button
//                     type="text"
//                     size="small"
//                     icon={<EditOutlined className="text-xs" />}
//                     onClick={() => {
//                       setActiveIndex(idx);
//                       setMode("form");
//                       form.setFieldsValue({
//                         category: item.category,
//                         department: item.department,
//                       });
//                     }}
//                     className="h-4 w-4 p-0 min-w-0 text-blue-600"
//                   />
//                 </div>
//               </div>
//               <div className="flex justify-between items-center">
//                 <span className="text-xs text-gray-600">Amount</span>
//                 <span className="text-xs font-bold text-gray-900">
//                   ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>

//         <Button
//           type="dashed"
//           block
//           size="small"
//           icon={<PlusOutlined />}
//           onClick={startAdd}
//           className="text-xs h-7 border-dashed"
//         >
//           Add Another Expense
//         </Button>

//         {expenseItems.length > 0 && (
//           <div className="flex justify-between items-center px-4 py-3 rounded-lg border border-gray-200 bg-white shadow-sm">
//             <div>
//               <div className="text-[11px] text-gray-500 uppercase tracking-wide">
//                 Total Amount
//               </div>
//               <div className="text-xs text-gray-400">
//                 {expenseItems.length} item{expenseItems.length !== 1 ? "s" : ""}
//               </div>
//             </div>
//             <div className="text-right">
//               <div className="text-lg font-semibold text-gray-900">
//                 ₹{total.toLocaleString("en-IN")}
//               </div>
//             </div>
//           </div>
//         )}

//         {expenseItems.length > 0 && (
//           <div className="flex justify-between items-center pt-2 border-t border-gray-200">
//             <Button
//               size="small"
//               onClick={() => {
//                 if (activeIndex === -1 && expenseItems.length > 0) {
//                   setActiveIndex(expenseItems.length - 1);
//                 }
//                 setMode("form");
//               }}
//               className="text-xs h-6 px-2"
//             >
//               Back to Form
//             </Button>
//             <Button
//               type="primary"
//               size="small"
//               icon={<CheckCircleOutlined />}
//               onClick={() => setMode("review")}
//               className="text-xs h-6 px-3 bg-blue-600 border-none"
//             >
//               Review & Submit
//             </Button>
//           </div>
//         )}
//       </div>
//     );
//   };

//   const renderReviewMode = () => {
//     return (
//       <div className="space-y-2">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-1">
//             <div className="w-5 h-5 flex items-center justify-center rounded-md bg-emerald-100">
//               <CheckCircleOutlined className="text-xs text-emerald-600" />
//             </div>
//             <span className="text-xs font-bold text-gray-900">
//               Review & Submit
//             </span>
//             <Tag color="green" className="text-2xs ml-1">
//               READY
//             </Tag>
//           </div>
//           <Button
//             size="small"
//             icon={<ArrowLeftOutlined />}
//             onClick={() => setMode("list")}
//             className="text-xs h-6 px-2"
//           >
//             Back
//           </Button>
//         </div>

//         <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
//           <div className="flex justify-between items-center">
//             <div>
//               <span className="text-xs font-bold text-gray-900">Summary</span>
//               <p className="text-2xs text-gray-600">
//                 {expenseItems.length} item(s)
//               </p>
//             </div>
//             <div className="text-right">
//               <span className="text-xs font-bold text-gray-900">
//                 ₹{total.toLocaleString("en-IN")}
//               </span>
//             </div>
//           </div>
//         </div>

//         <div className="space-y-1">
//           {expenseItems.map((item, idx) => (
//             <div
//               key={idx}
//               className="p-1.5 rounded border border-gray-200 bg-white"
//             >
//               <div className="flex justify-between items-center">
//                 <div className="flex items-center gap-1">
//                   <span className="text-2xs font-bold text-blue-700 bg-blue-100 px-1 py-0.5 rounded">
//                     #{idx + 1}
//                   </span>
//                   <span className="text-xs text-gray-700">
//                     {item.date?.format("DD MMM")}
//                   </span>
//                 </div>
//                 <span className="text-xs font-bold text-gray-900">
//                   ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="flex justify-between items-center pt-2 border-t border-gray-200">
//           <Button
//             size="small"
//             onClick={() => setMode("list")}
//             className="text-xs h-6 px-2"
//           >
//             Back
//           </Button>
//           <Button
//             type="primary"
//             size="small"
//             icon={<CheckCircleOutlined />}
//             loading={isCreating || isUpdating}
//             disabled={isCreating || isUpdating}
//             onClick={handleSubmit}
//             className="text-xs h-6 px-3 bg-emerald-600 border-none font-bold"
//           >
//             Submit
//           </Button>
//         </div>
//       </div>
//     );
//   };

//   const renderEmptyMode = () => {
//     return (
//       <div className="text-center py-3">
//         <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-50 border-2 border-dashed border-blue-200 mx-auto mb-2">
//           <PlusOutlined className="text-lg text-blue-500" onClick={startAdd} />
//         </div>
//         <Text className="text-xs text-gray-700 mb-2 block">
//           No expense items added yet
//         </Text>
//         <Button
//           type="primary"
//           size="small"
//           icon={<PlusOutlined />}
//           onClick={startAdd}
//           className="px-3 h-7 text-xs bg-blue-600 border-none"
//         >
//           Add First Expense
//         </Button>
//       </div>
//     );
//   };

//   const renderContent = () => {
//     switch (mode) {
//       case "form":
//         return renderFormMode();
//       case "list":
//         return renderListMode();
//       case "review":
//         return renderReviewMode();
//       default:
//         return renderEmptyMode();
//     }
//   };

//   return (
//     <>
//       <div className="min-h-screen bg-gray-50 p-6">
//         <div className="mb-4">
//           <button
//             onClick={handleBack}
//             className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm"
//           >
//             <ArrowLeftOutlined className="text-base" />
//             <span>Back</span>
//           </button>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//           {/* LEFT: FORM */}
//           <div className="lg:col-span-2">
//             <Card
//               className="rounded-xl border border-gray-200 bg-white shadow-md p-0"
//               title={
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 border border-blue-200">
//                       <FileProtectOutlined className="text-lg text-blue-600" />
//                     </div>
//                     <div>
//                       <h3 className="text-base font-bold text-gray-900">
//                         {isEditMode ? "Edit Reimbursement" : "Create Reimbursement"}
//                       </h3>
//                       <p className="text-sm text-gray-500">
//                         {isEditMode ? "Update existing request" : "Enter required details"}
//                       </p>
//                     </div>
//                   </div>
//                   <span
//                     className={`text-xs font-bold px-3 py-1 rounded-full border whitespace-nowrap ${
//                       isEditMode
//                         ? "bg-amber-50 text-amber-700 border-amber-200"
//                         : "bg-blue-50 text-blue-600 border-blue-200"
//                     }`}
//                   >
//                     {isEditMode ? "EDIT MODE" : "CREATE NEW"}
//                   </span>
//                 </div>
//               }
//               headStyle={{
//                 borderBottom: "1px solid #f0f0f0",
//                 padding: "16px 20px",
//               }}
//               bodyStyle={{ padding: "20px" }}
//             >
//               <Form
//                 form={form}
//                 layout="vertical"
//                 onValuesChange={(_, allValues) => setPreviewData(allValues)}
//               >
//                 <Form.Item
//                   label="Category"
//                   name="category"
//                   rules={[{ required: true, message: "Category is required" }]}
//                 >
//                   <Select placeholder="Select category" size="middle">
//                     <Option value="travel">Travel</Option>
//                     <Option value="food">Food & Meals</Option>
//                     <Option value="internet">Internet</Option>
//                     <Option value="mobile">Mobile</Option>
//                     <Option value="medical">Medical</Option>
//                     <Option value="office">Office Supplies</Option>
//                     <Option value="other">Other</Option>
//                   </Select>
//                 </Form.Item>

//                 <Form.Item
//                   label="Department"
//                   name="department"
//                   rules={[{ required: true, message: "Department is required" }]}
//                 >
//                   <Select placeholder="Select department" size="middle">
//                     <Option value="engineering">Engineering</Option>
//                     <Option value="sales">Sales</Option>
//                     <Option value="finance">Finance</Option>
//                     <Option value="hr">HR</Option>
//                   </Select>
//                 </Form.Item>

//                 <Form.Item name="policy" hidden>
//                   <Input />
//                 </Form.Item>
//               </Form>

//               <Divider className="my-4" />

//               {/* Expense Builder Section */}
//               <div>{renderContent()}</div>
//             </Card>
//           </div>

//           {/* RIGHT: PREVIEW */}
//           <div className="lg:col-span-1">
//             <Card
//               className="rounded-xl border border-gray-200 bg-white shadow-md p-0 min-h-[550px]"
//               title={
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3 min-w-0 flex-shrink">
//                     <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex-shrink-0">
//                       <EyeOutlined className="text-lg text-purple-600" />
//                     </div>
//                     <div className="min-w-0">
//                       <h3 className="text-base font-bold text-gray-900 truncate">
//                         Live Preview
//                       </h3>
//                       <p className="text-sm text-gray-500 truncate">
//                         Review before submission
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2 flex-shrink-0">
//                     <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-full border border-purple-200 whitespace-nowrap">
//                       PREVIEW
//                     </span>
//                   </div>
//                 </div>
//               }
//               headStyle={{
//                 borderBottom: "1px solid #f0f0f0",
//                 padding: "16px 20px",
//                 minHeight: "auto",
//               }}
//               bodyStyle={{ padding: "20px" }}
//             >
//               <div className="space-y-3 mb-4">
//                 <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
//                   <div className="flex items-center gap-2">
//                     <div className="w-2 h-2 rounded-full bg-blue-500"></div>
//                     <span className="text-sm font-semibold text-gray-700">
//                       Category
//                     </span>
//                   </div>
//                   <span className="text-sm font-bold text-gray-900">
//                     {previewData.category
//                       ? previewData.category.charAt(0).toUpperCase() +
//                         previewData.category.slice(1)
//                       : "—"}
//                   </span>
//                 </div>

//                 <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
//                   <div className="flex items-center gap-2">
//                     <div className="w-2 h-2 rounded-full bg-orange-500"></div>
//                     <span className="text-sm font-semibold text-gray-700">
//                       Department
//                     </span>
//                   </div>
//                   <span className="text-sm font-bold text-gray-900">
//                     {previewData.department || "—"}
//                   </span>
//                 </div>
//               </div>

//               <div>
//                 <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200 mb-3">
//                   <div className="flex items-center gap-2">
//                     <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
//                     <span className="text-sm font-bold text-gray-700">
//                       Expense Details
//                     </span>
//                   </div>
//                   <span className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full bg-slate-50 text-slate-600 border border-slate-200 whitespace-nowrap">
//                     {expenseItems.length === 0 ? "No Items" : `${expenseItems.length} Items`}
//                   </span>
//                 </div>

//                 {expenseItems.length === 0 ? (
//                   <div className="flex flex-col items-center justify-center py-10 rounded-xl border border-dashed border-gray-300 bg-white">
//                     <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-200 mb-3">
//                       <span className="text-gray-400 text-2xl">📋</span>
//                     </div>
//                     <p className="text-base font-semibold text-gray-700">
//                       No Expense Items
//                     </p>
//                     <p className="text-sm text-gray-500 mt-1 text-center max-w-[200px]">
//                       Add expense items using the form on the left
//                     </p>
//                   </div>
//                 ) : (
//                   <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
//                     {expenseItems.map((item, idx) => (
//                       <div
//                         key={idx}
//                         className="p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-shadow"
//                       >
//                         <div className="flex justify-between items-start mb-2">
//                           <div className="flex items-center gap-2">
//                             <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap">
//                               Item #{idx + 1}
//                             </span>
//                             <span className="text-sm font-medium text-gray-700">
//                               {item.date?.format("DD MMM YYYY") || "Date not set"}
//                             </span>
//                           </div>
//                           <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full whitespace-nowrap">
//                             <span>📎</span> {item.files?.length || 0}
//                           </span>
//                         </div>

//                         <div className="flex justify-between items-center mb-2">
//                           <span className="text-sm text-gray-600">Amount</span>
//                           <span className="text-base font-bold text-gray-900">
//                             ₹{Number(item.amount ?? 0).toLocaleString("en-IN")}
//                           </span>
//                         </div>

//                         {item.description && (
//                           <div className="mt-2 pt-2 border-t border-gray-100 text-sm text-gray-700">
//                             <span className="font-medium text-gray-500">
//                               Description:{" "}
//                             </span>
//                             {item.description}
//                           </div>
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {expenseItems.length > 0 && (
//                   <>
//                     <Divider className="my-4 border-gray-200" />
//                     <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
//                       <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
//                         Total Amount
//                       </span>
//                       <span className="text-xl font-bold text-gray-900 whitespace-nowrap">
//                         ₹{total.toLocaleString("en-IN")}
//                       </span>
//                     </div>
//                   </>
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
//           <div className="flex h-[calc(100vh-64px)] items-center justify-center">
//             <div className="text-gray-500 text-lg">
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

// "use client";

// import React, { useState } from "react";
// import {
//   Card,
//   Form,
//   Button,
//   Select,
//   Input,
//   Space,
//   Typography,
//   notification,
//   DatePicker,
//   Row,
//   Col,
// } from "antd";
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   SaveOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import MainLayout from "@/components/layout/MainLayout";
// import LoadingSpinner from "@/components/common/LoadingSpinner";
// import AttachmentUploader from "@/components/common/AttachmentUploader";
// import AttachmentList from "@/components/common/AttachmentList";
// import dayjs from "dayjs";

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// // Reimbursement Categories
// const CATEGORY_OPTIONS = [
//   { label: "Travel", value: "travel" },
//   { label: "Food & Dining", value: "food" },
//   { label: "Office Supplies", value: "office_supplies" },
//   { label: "Software & Tools", value: "software" },
//   { label: "Hardware", value: "hardware" },
//   { label: "Training & Education", value: "training" },
//   { label: "Client Entertainment", value: "entertainment" },
//   { label: "Fuel", value: "fuel" },
//   { label: "Accommodation", value: "accommodation" },
//   { label: "Other", value: "other" },
// ];

// // Reimbursement Item Interface
// interface ReimbursementItem {
//   id: string;
//   category: string;
//   date: string | null;
//   billNo: string;
//   amount: number | null;
//   description: string;
//   attachments: Attachment[];
// }

// interface Attachment {
//   id: string;
//   fileName: string;
//   fileUrl: string;
//   fileSize: number;
//   fileType: string;
//   uploadedAt: string;
//   uploadedBy: {
//     id: string;
//     name: string;
//     workEmail: string;
//     position: string;
//   };
// }

// export default function CreateReimbursementPage() {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <MainLayout>
//         <LoadingSpinner message="Loading..." />
//       </MainLayout>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return (
//     <MainLayout>
//       <CreateReimbursementContent user={user} />
//     </MainLayout>
//   );
// }

// interface CreateReimbursementContentProps {
//   user: any;
// }

// function CreateReimbursementContent({ user }: CreateReimbursementContentProps) {
//   const router = useRouter();
//   const [form] = Form.useForm();
//   const [api, contextHolder] = notification.useNotification();
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);

//   // State for multiple reimbursement items
//   const [reimbursementItems, setReimbursementItems] = useState<ReimbursementItem[]>([
//     {
//       id: `item_${Date.now()}_0`,
//       category: "",
//       date: null,
//       billNo: "",
//       amount: null,
//       description: "",
//       attachments: [],
//     },
//   ]);

//   // Handle Add Item
//   const handleAddItem = () => {
//     setReimbursementItems([
//       ...reimbursementItems,
//       {
//         id: `item_${Date.now()}_${reimbursementItems.length}`,
//         category: "",
//         date: null,
//         billNo: "",
//         amount: null,
//         description: "",
//         attachments: [],
//       },
//     ]);
//   };

//   // Handle Remove Item
//   const handleRemoveItem = (index: number) => {
//     if (reimbursementItems.length === 1) {
//       api.warning({
//         message: "Warning",
//         description: "At least one reimbursement item is required",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return;
//     }
//     const newItems = reimbursementItems.filter((_, i) => i !== index);
//     setReimbursementItems(newItems);
//   };

//   // Handle Field Change
//   const handleItemChange = (
//     index: number,
//     field: keyof ReimbursementItem,
//     value: any
//   ) => {
//     const newItems = [...reimbursementItems];
//     (newItems[index][field] as any) = value;
//     setReimbursementItems(newItems);
//   };

//   // Handle File Upload
//   const handleFileUpload = async (index: number, base64File: string, fileName: string) => {
//     try {
//       const newAttachment: Attachment = {
//         id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
//         fileName: fileName,
//         fileUrl: base64File,
//         fileSize: Math.round((base64File.length * 3) / 4),
//         fileType: fileName.split('.').pop() || 'unknown',
//         uploadedAt: new Date().toISOString(),
//         uploadedBy: {
//           id: user?.id || 'unknown',
//           name: user?.name || 'Current User',
//           workEmail: user?.email || '',
//           position: user?.position || 'Employee',
//         },
//       };

//       const newItems = [...reimbursementItems];
//       newItems[index].attachments.push(newAttachment);
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File uploaded successfully",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     } catch (error) {
//       api.error({
//         message: "Error",
//         description: "Failed to upload file",
//         placement: "bottomRight",
//         duration: 4,
//       });
//     }
//   };

//   // Handle Delete Attachment
//   const handleDeleteAttachment = async (itemIndex: number, attachmentId: string) => {
//     try {
//       const newItems = [...reimbursementItems];
//       newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
//         (att) => att.id !== attachmentId
//       );
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File deleted successfully",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     } catch (error) {
//       api.error({
//         message: "Error",
//         description: "Failed to delete file",
//         placement: "bottomRight",
//         duration: 4,
//       });
//     }
//   };

//   // Validate Form
//   const validateForm = () => {
//     for (let i = 0; i < reimbursementItems.length; i++) {
//       const item = reimbursementItems[i];

//       if (!item.category) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a category`,
//           placement: "bottomRight",
//           duration: 4,
//         });
//         return false;
//       }

//       if (!item.date) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a date`,
//           placement: "bottomRight",
//           duration: 4,
//         });
//         return false;
//       }

//       if (!item.billNo?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter bill number`,
//           placement: "bottomRight",
//           duration: 4,
//         });
//         return false;
//       }

//       if (!item.amount || item.amount <= 0) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a valid amount`,
//           placement: "bottomRight",
//           duration: 4,
//         });
//         return false;
//       }

//       if (!item.description?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a description`,
//           placement: "bottomRight",
//           duration: 4,
//         });
//         return false;
//       }
//     }

//     return true;
//   };

//   // Handle Save (Draft)
//   const handleSave = async () => {
//     try {
//       setSaving(true);

//       // Here you would implement save draft logic
//       console.log("Saving draft:", reimbursementItems);

//       api.success({
//         message: "Success",
//         description: "Reimbursement saved as draft",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     } catch (error) {
//       api.error({
//         message: "Error",
//         description: "Failed to save draft",
//         placement: "bottomRight",
//         duration: 4,
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Handle Submit
//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     try {
//       setLoading(true);

//       const formData = {
//         items: reimbursementItems,
//         submittedAt: new Date().toISOString(),
//         submittedBy: user?.id,
//       };

//       console.log("Submitting reimbursement:", formData);

//       api.success({
//         message: "Success",
//         description: "Reimbursement submitted successfully!",
//         placement: "bottomRight",
//         duration: 3,
//       });

//       setTimeout(() => {
//         router.push("/reimbursements/view");
//       }, 1200);

//     } catch (error: any) {
//       let errorMessage = "Failed to submit reimbursement";
//       if (error?.message) errorMessage = error.message;

//       api.error({
//         message: "Error",
//         description: errorMessage,
//         placement: "bottomRight",
//         duration: 4,
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Calculate Total Amount
//   const getTotalAmount = () => {
//     return reimbursementItems.reduce(
//       (sum, item) => sum + (item.amount || 0),
//       0
//     );
//   };

//   return (
//     <div
//       style={{
//         maxWidth: 900,
//         margin: "0 auto",
//         padding: "24px 16px",
//         minHeight: "calc(100vh - 64px)",
//       }}
//     >
//       {contextHolder}

//       {/* Header - Date only */}
//       <div style={{ marginBottom: 16 }}>
//         <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
//           Create Reimbursement Request
//         </Title>
//         <Text type="secondary" style={{ fontSize: 13 }}>
//           {new Date().toLocaleDateString("en-US", {
//             weekday: "long",
//             month: "long",
//             day: "numeric",
//             year: "numeric",
//           })}
//         </Text>
//       </div>

//       {/* Form Card */}
//       <Card
//         style={{
//           boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//           borderRadius: 8,
//           border: "1px solid #e8e8e8",
//           position: "relative",
//         }}
//         bodyStyle={{ padding: 24 }}
//       >
//         {/* Save Button - Top Right Corner */}
//         <div style={{ position: "absolute", top: 24, right: 24, zIndex: 1 }}>
//           <Button
//             type="default"
//             icon={<SaveOutlined />}
//             onClick={handleSave}
//             loading={saving}
//             size="middle"
//           >
//             Save
//           </Button>
//         </div>

//         <Form form={form} layout="vertical">
//           {/* Reimbursement Items Section */}
//           <div style={{ marginBottom: 24 }}>
//             <Text
//               strong
//               style={{ fontSize: 15, display: "block", marginBottom: 16 }}
//             >
//               Reimbursement Items
//             </Text>

//             {reimbursementItems.map((item, index) => (
//               <div
//                 key={item.id}
//                 style={{
//                   border: "1px solid #e8e8e8",
//                   borderRadius: 8,
//                   padding: 20,
//                   marginBottom: 20,
//                   backgroundColor: "#fafafa",
//                   position: "relative",
//                 }}
//               >
//                 {/* Item Header */}
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginBottom: 20,
//                   }}
//                 >
//                   <Text strong style={{ fontSize: 14 }}>
//                     Expense Item #{index + 1}
//                   </Text>
//                   {reimbursementItems.length > 1 && (
//                     <Button
//                       type="text"
//                       danger
//                       size="small"
//                       icon={<DeleteOutlined />}
//                       onClick={() => handleRemoveItem(index)}
//                     >
//                       Remove
//                     </Button>
//                   )}
//                 </div>

//                 {/* Row 1: Category and Date */}
//                 <Row gutter={16} style={{ marginBottom: 16 }}>
//                   <Col span={12}>
//                     <Form.Item
//                       label={
//                         <span style={{ fontSize: 13 }}>
//                           Category <span style={{ color: "#ff4d4f" }}>*</span>
//                         </span>
//                       }
//                       required={false}
//                       validateStatus={!item.category ? "error" : "success"}
//                       help={!item.category && "Please select a category"}
//                       style={{ marginBottom: 0 }}
//                     >
//                       <Select
//                         placeholder="Select category"
//                         value={item.category || undefined}
//                         onChange={(value) =>
//                           handleItemChange(index, "category", value)
//                         }
//                         options={CATEGORY_OPTIONS}
//                         style={{ width: "100%" }}
//                         showSearch
//                         filterOption={(input, option) =>
//                           (option?.label ?? "")
//                             .toLowerCase()
//                             .includes(input.toLowerCase())
//                         }
//                       />
//                     </Form.Item>
//                   </Col>
//                   <Col span={12}>
//                     <Form.Item
//                       label={
//                         <span style={{ fontSize: 13 }}>
//                           Date <span style={{ color: "#ff4d4f" }}>*</span>
//                         </span>
//                       }
//                       required={false}
//                       validateStatus={!item.date ? "error" : "success"}
//                       help={!item.date && "Please select a date"}
//                       style={{ marginBottom: 0 }}
//                     >
//                       <DatePicker
//                         style={{ width: "100%" }}
//                         placeholder="Select date"
//                         value={item.date ? dayjs(item.date) : null}
//                         onChange={(date) =>
//                           handleItemChange(index, "date", date ? date.toISOString() : null)
//                         }
//                         format="DD-MM-YYYY"
//                         disabledDate={(current) =>
//                           current && current > dayjs().endOf("day")
//                         }
//                       />
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 {/* Row 2: Bill No and Amount */}
//                 <Row gutter={16} style={{ marginBottom: 16 }}>
//                   <Col span={12}>
//                     <Form.Item
//                       label={
//                         <span style={{ fontSize: 13 }}>
//                           Bill / Invoice No <span style={{ color: "#ff4d4f" }}>*</span>
//                         </span>
//                       }
//                       required={false}
//                       validateStatus={!item.billNo ? "error" : "success"}
//                       help={!item.billNo && "Please enter bill number"}
//                       style={{ marginBottom: 0 }}
//                     >
//                       <Input
//                         placeholder="Enter bill/invoice number"
//                         value={item.billNo}
//                         onChange={(e) =>
//                           handleItemChange(index, "billNo", e.target.value)
//                         }
//                       />
//                     </Form.Item>
//                   </Col>
//                   <Col span={12}>
//                     <Form.Item
//                       label={
//                         <span style={{ fontSize: 13 }}>
//                           Amount (₹) <span style={{ color: "#ff4d4f" }}>*</span>
//                         </span>
//                       }
//                       required={false}
//                       validateStatus={!item.amount ? "error" : "success"}
//                       help={!item.amount && "Please enter amount"}
//                       style={{ marginBottom: 0 }}
//                     >
//                       <Input
//                         type="number"
//                         placeholder="Enter amount"
//                         value={item.amount || undefined}
//                         onChange={(e) =>
//                           handleItemChange(
//                             index,
//                             "amount",
//                             e.target.value ? parseFloat(e.target.value) : null
//                           )
//                         }
//                         prefix="₹"
//                         min={0}
//                         step={0.01}
//                       />
//                     </Form.Item>
//                   </Col>
//                 </Row>

//                 {/* Row 3: Description (Full Width) */}
//                 <Form.Item
//                   label={
//                     <span style={{ fontSize: 13 }}>
//                       Description <span style={{ color: "#ff4d4f" }}>*</span>
//                     </span>
//                   }
//                   required={false}
//                   validateStatus={!item.description ? "error" : "success"}
//                   help={!item.description && "Please enter a description"}
//                   style={{ marginBottom: 16 }}
//                 >
//                   <TextArea
//                     rows={3}
//                     placeholder="Describe the expense details..."
//                     value={item.description}
//                     onChange={(e) =>
//                       handleItemChange(index, "description", e.target.value)
//                     }
//                   />
//                 </Form.Item>

//                 {/* Row 4: Attachments */}
//                 <Form.Item
//                   label={
//                     <span style={{ fontSize: 13 }}>
//                       Attachments{" "}
//                       <Text type="secondary" style={{ fontSize: 12 }}>
//                         (Optional - Upload bills/invoices)
//                       </Text>
//                     </span>
//                   }
//                   style={{ marginBottom: 0 }}
//                 >
//                   <Space direction="vertical" size={16} style={{ width: "100%" }}>
//                     <AttachmentUploader
//                       onUpload={(base64File, fileName) =>
//                         handleFileUpload(index, base64File, fileName)
//                       }
//                       maxSize={10}
//                       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
//                     />

//                     {item.attachments.length > 0 && (
//                       <AttachmentList
//                         attachments={item.attachments}
//                         onDelete={(attachmentId) =>
//                           handleDeleteAttachment(index, attachmentId)
//                         }
//                         currentUserId={user?.id}
//                       />
//                     )}
//                   </Space>
//                 </Form.Item>
//               </div>
//             ))}

//             {/* Add Item Button */}
//             <Button
//               type="dashed"
//               icon={<PlusOutlined />}
//               onClick={handleAddItem}
//               style={{ width: "100%", marginTop: 8 }}
//             >
//               Add Another Expense Item
//             </Button>
//           </div>

//           {/* Total Amount Display */}
//           <div
//             style={{
//               padding: 16,
//               backgroundColor: "#f0f5ff",
//               borderRadius: 6,
//               marginBottom: 24,
//               border: "1px solid #adc6ff",
//               display: "flex",
//               justifyContent: "space-between",
//               alignItems: "center",
//             }}
//           >
//             <Text strong style={{ fontSize: 14 }}>
//               Total Reimbursement Amount:
//             </Text>
//             <Text style={{ color: "#1890ff", fontSize: 20, fontWeight: 600 }}>
//               ₹{getTotalAmount().toFixed(2)}
//             </Text>
//           </div>

//           {/* Footer with Cancel and Submit buttons */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: "12px",
//               borderTop: "1px solid #e8e8e8",
//               paddingTop: 24,
//               marginTop: 8,
//             }}
//           >
//             <Button
//               onClick={() => router.push("/reimbursements")}
//               size="large"
//             >
//               Cancel
//             </Button>
//             <Button
//               type="primary"
//               onClick={handleSubmit}
//               loading={loading}
//               size="large"
//             >
//               Submit Reimbursement
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </div>
//   );
// }

// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   Form,
//   Button,
//   Select,
//   Input,
//   Space,
//   Typography,
//   notification,
//   DatePicker,
//   Row,
//   Col,
// } from "antd";
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   SaveOutlined,
//   EyeOutlined,
//   LoadingOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import MainLayout from "@/components/layout/MainLayout";
// import LoadingSpinner from "@/components/common/LoadingSpinner";
// import AttachmentUploader from "@/components/common/AttachmentUploader";
// import dayjs from "dayjs";
// import { useCreateReimbursement } from "@/hooks/usereimbursementcreate";

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// // Reimbursement Categories (matching backend enum expectations)
// const CATEGORY_OPTIONS = [
//   { label: "Travel", value: "travel" },
//   { label: "Food & Dining", value: "food" },
//   { label: "Office Supplies", value: "office_supplies" },
//   { label: "Software & Tools", value: "software" },
//   { label: "Hardware", value: "hardware" },
//   { label: "Training & Education", value: "training" },
//   { label: "Client Entertainment", value: "entertainment" },
//   { label: "Fuel", value: "fuel" },
//   { label: "Accommodation", value: "accommodation" },
//   { label: "Other", value: "other" },
// ];

// // Status enum matching backend
// const REIMBURSEMENT_STATUS = {
//   DRAFT: "DRAFT",
//   SUBMITTED: "SUBMITTED",
//   APPROVED: "APPROVED",
//   REJECTED: "REJECTED",
// } as const;

// // File interface for preview
// interface UploadedFile {
//   base64: string;
//   fileName: string;
//   fileType: string;
//   file?: File; // Store actual File object for upload
// }

// // Reimbursement Item Interface (matching backend schema)
// interface ReimbursementItem {
//   id: string;
//   category: string;
//   date: string | null;
//   billNo: string;
//   amount: number | null;
//   description: string;
//   attachments: UploadedFile[];
// }

// export default function CreateReimbursementPage() {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <MainLayout>
//         <LoadingSpinner message="Loading..." />
//       </MainLayout>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return (
//     <MainLayout>
//       <CreateReimbursementContent user={user} />
//     </MainLayout>
//   );
// }

// interface CreateReimbursementContentProps {
//   user: any;
// }

// function CreateReimbursementContent({ user }: CreateReimbursementContentProps) {
//   const router = useRouter();
//   const [form] = Form.useForm();
//   const [api, contextHolder] = notification.useNotification();

//   // Use the create mutation hook
//   const createMutation = useCreateReimbursement();

//   // State for multiple reimbursement items
//   const [reimbursementItems, setReimbursementItems] = useState<ReimbursementItem[]>([
//     {
//       id: `item_${Date.now()}_0`,
//       category: "",
//       date: null,
//       billNo: "",
//       amount: null,
//       description: "",
//       attachments: [],
//     },
//   ]);

//   // Track all files for upload (backend expects multipart/form-data)
//   const [allFiles, setAllFiles] = useState<File[]>([]);

//   // In your reimbursement create page component

//   // Handle Add Item
//   const handleAddItem = () => {
//     setReimbursementItems([
//       ...reimbursementItems,
//       {
//         id: `item_${Date.now()}_${reimbursementItems.length}`,
//         category: "",
//         date: null,
//         billNo: "",
//         amount: null,
//         description: "",
//         attachments: [],
//       },
//     ]);
//   };

//   // Handle Remove Item
//   const handleRemoveItem = (index: number) => {
//     if (reimbursementItems.length === 1) {
//       api.warning({
//         message: "Warning",
//         description: "At least one reimbursement item is required",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return;
//     }

//     // Remove files associated with this item from allFiles
//     const itemToRemove = reimbursementItems[index];
//     const filesToRemove = itemToRemove.attachments.map(att => att.fileName);
//     setAllFiles(prev => prev.filter(file => !filesToRemove.includes(file.name)));

//     const newItems = reimbursementItems.filter((_, i) => i !== index);
//     setReimbursementItems(newItems);
//   };

//   // Handle Field Change
//   const handleItemChange = (
//     index: number,
//     field: keyof ReimbursementItem,
//     value: any
//   ) => {
//     const newItems = [...reimbursementItems];
//     (newItems[index][field] as any) = value;
//     setReimbursementItems(newItems);
//   };

//   // Handle File Upload - Store files for actual upload and preview
//   const handleFileUpload = async (index: number, base64File: string, fileName: string) => {
//     try {
//       // Convert base64 to File object for actual upload
//       const response = await fetch(base64File);
//       const blob = await response.blob();
//       const file = new File([blob], fileName, { type: blob.type });

//       // Store in allFiles for multipart upload
//       setAllFiles(prev => [...prev, file]);

//       // Create preview object
//       const newFile: UploadedFile = {
//         base64: base64File,
//         fileName: fileName,
//         fileType: fileName.split('.').pop() || 'unknown',
//         file: file, // Store the File object
//       };

//       const newItems = [...reimbursementItems];
//       newItems[index].attachments.push(newFile);
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File uploaded successfully",
//         placement: "bottomRight",
//         duration: 2,
//       });
//     } catch (error) {
//       console.error("File upload error:", error);
//       api.error({
//         message: "Error",
//         description: "Failed to upload file",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Handle Delete Attachment
//   const handleDeleteAttachment = async (itemIndex: number, fileToDelete: UploadedFile) => {
//     try {
//       // Remove from allFiles if it exists
//       if (fileToDelete.file) {
//         setAllFiles(prev => prev.filter(f => f.name !== fileToDelete.fileName));
//       }

//       // Remove from attachments
//       const newItems = [...reimbursementItems];
//       newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
//         (file) => file.fileName !== fileToDelete.fileName
//       );
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File deleted successfully",
//         placement: "bottomRight",
//         duration: 2,
//       });
//     } catch (error) {
//       console.error("File delete error:", error);
//       api.error({
//         message: "Error",
//         description: "Failed to delete file",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Validate Form
//   const validateForm = () => {
//     // Check if at least one file is uploaded (backend requirement)
//     const totalAttachments = reimbursementItems.reduce(
//       (sum, item) => sum + item.attachments.length,
//       0
//     );

//     if (totalAttachments === 0) {
//       api.error({
//         message: "Validation Error",
//         description: "Please upload at least one attachment",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return false;
//     }

//     for (let i = 0; i < reimbursementItems.length; i++) {
//       const item = reimbursementItems[i];

//       if (!item.category) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a category`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.date) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a date`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.billNo?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter bill number`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.amount || item.amount <= 0) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a valid amount`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.description?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a description`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }
//     }

//     return true;
//   };

//   // Transform items to match backend format
//   const transformItemsForBackend = () => {
//     return reimbursementItems.map(item => ({
//       category: item.category,
//       date: item.date, // Already in ISO string format
//       billNo: item.billNo,
//       amount: item.amount,
//       description: item.description,
//       // Note: attachments are handled separately via files
//     }));
//   };

//   // Handle Save (Draft)
//   const handleSaveDraft = async () => {
//     if (!validateForm()) return;

//     try {
//       const itemsData = transformItemsForBackend();

//       // Create FormData for multipart upload
//       const formData = new FormData();

//       // Append each item as a separate field (backend expects array in body)
//       // Since backend expects req.body to be the array directly, we need to
//       // stringify and append as a special field that your API route will handle
//       formData.append('items', JSON.stringify(itemsData));

//       // Append all files
//       allFiles.forEach((file, index) => {
//         formData.append('files', file);
//       });

//       // Submit with DRAFT status
//       await createMutation.mutateAsync({
//         items: itemsData,
//         files: allFiles,
//         status: REIMBURSEMENT_STATUS.DRAFT
//       });

//       api.success({
//         message: "Success",
//         description: "Reimbursement saved as draft",
//         placement: "bottomRight",
//         duration: 2,
//       });

//       // Navigate to view page after short delay
//       setTimeout(() => {
//         router.push("/reimbursements/view");
//       }, 1000);

//     } catch (error: any) {
//       console.error("Save draft error:", error);
//       api.error({
//         message: "Error",
//         description: error?.message || "Failed to save draft",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Handle Submit

// const handleSubmit = async () => {
//   if (!validateForm()) return;

//   try {
//     const itemsData = transformItemsForBackend();

//     // 🔍 CONSOLE LOG - Payload inspection
//     console.log('📦 REIMBURSEMENT PAYLOAD:');
//     console.log('Items:', JSON.stringify(itemsData, null, 2));
//     console.log('Files:', allFiles.map(f => ({
//       name: f.name,
//       size: f.size,
//       type: f.type
//     })));
//     console.log('Status:', REIMBURSEMENT_STATUS.SUBMITTED);

//     // FormData inspection
//     const formData = new FormData();
//     formData.append('items', JSON.stringify(itemsData));
//     allFiles.forEach((file) => {
//       formData.append('files', file);
//     });

//     console.log('📋 FormData contents:');
//     for (let pair of formData.entries()) {
//       if (pair[0] === 'items') {
//         console.log('items field:', JSON.parse(pair[1] as string));
//       } else {
//         console.log('file field:', (pair[1] as File).name);
//       }
//     }

//     await createMutation.mutateAsync({
//       items: itemsData,
//       files: allFiles,
//       status: REIMBURSEMENT_STATUS.SUBMITTED
//     });

//   } catch (error: any) {
//     console.error('❌ Submit error:', error);
//   }
// };

//   // Calculate Total Amount
//   const getTotalAmount = () => {
//     return reimbursementItems.reduce(
//       (sum, item) => sum + (item.amount || 0),
//       0
//     );
//   };

//   // Helper to view file
//   const handleViewFile = (file: UploadedFile) => {
//     if (file.base64) {
//       window.open(file.base64, '_blank');
//     }
//   };

//   // Check if mutation is loading
//   const isLoading = createMutation.isPending;

//   return (
//     <div
//       style={{
//         maxWidth: 900,
//         margin: "0 auto",
//         padding: "24px 16px",
//         height: "calc(100vh - 64px)",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       {contextHolder}

//       {/* Header */}
//       <div style={{ marginBottom: 16, flexShrink: 0 }}>
//         <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
//           Create Reimbursement Request
//         </Title>
//         <Text type="secondary" style={{ fontSize: 13 }}>
//           {new Date().toLocaleDateString("en-US", {
//             weekday: "long",
//             month: "long",
//             day: "numeric",
//             year: "numeric",
//           })}
//         </Text>
//       </div>

//       {/* Form Card */}
//       <Card
//         style={{
//           boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//           borderRadius: 8,
//           border: "1px solid #e8e8e8",
//           flex: 1,
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}
//         styles={{ body: {
//           padding: "16px 20px",
//           flex: 1,
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//           }}
//         >
//           {/* Scrollable Content Area */}
//           <div style={{
//             flex: 1,
//             overflowY: "auto",
//             paddingRight: 8,
//             marginBottom: 16,
//           }}>
//             {/* Reimbursement Items Section */}
//             <div style={{ marginBottom: 16 }}>
//               <Text
//                 strong
//                 style={{ fontSize: 15, display: "block", marginBottom: 12 }}
//               >
//                 Reimbursement Items
//               </Text>

//               {reimbursementItems.map((item, index) => (
//                 <div
//                   key={item.id}
//                   style={{
//                     border: "1px solid #e8e8e8",
//                     borderRadius: 6,
//                     padding: "12px 14px",
//                     marginBottom: 12,
//                     backgroundColor: "#fafafa",
//                     position: "relative",
//                   }}
//                 >
//                   {/* Item Header */}
//                   <div
//                     style={{
//                       display: "flex",
//                       justifyContent: "space-between",
//                       alignItems: "center",
//                       marginBottom: 12,
//                     }}
//                   >
//                     <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
//                       Expense #{index + 1}
//                     </Text>
//                     {reimbursementItems.length > 1 && (
//                       <Button
//                         type="text"
//                         danger
//                         size="small"
//                         icon={<DeleteOutlined />}
//                         onClick={() => handleRemoveItem(index)}
//                         disabled={isLoading}
//                       >
//                         Remove
//                       </Button>
//                     )}
//                   </div>

//                   {/* Row 1: Category and Date */}
//                   <Row gutter={12} style={{ marginBottom: 10 }}>
//                     <Col span={12}>
//                       <Form.Item
//                         label={
//                           <span style={{ fontSize: 12 }}>
//                             Category <span style={{ color: "#ff4d4f" }}>*</span>
//                           </span>
//                         }
//                         required={false}
//                         style={{ marginBottom: 0 }}
//                       >
//                         <Select
//                           placeholder="Select"
//                           value={item.category || undefined}
//                           onChange={(value) =>
//                             handleItemChange(index, "category", value)
//                           }
//                           options={CATEGORY_OPTIONS}
//                           style={{ width: "100%" }}
//                           size="small"
//                           disabled={isLoading}
//                           showSearch
//                           filterOption={(input, option) =>
//                             (option?.label ?? "")
//                               .toLowerCase()
//                               .includes(input.toLowerCase())
//                           }
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         label={
//                           <span style={{ fontSize: 12 }}>
//                             Date <span style={{ color: "#ff4d4f" }}>*</span>
//                           </span>
//                         }
//                         required={false}
//                         style={{ marginBottom: 0 }}
//                       >
//                         <DatePicker
//                           style={{ width: "100%" }}
//                           placeholder="Select"
//                           value={item.date ? dayjs(item.date) : null}
//                           onChange={(date) =>
//                             handleItemChange(index, "date", date ? date.toISOString() : null)
//                           }
//                           format="DD-MM-YYYY"
//                           size="small"
//                           disabled={isLoading}
//                           disabledDate={(current) =>
//                             current && current > dayjs().endOf("day")
//                           }
//                         />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   {/* Row 2: Bill No and Amount */}
//                   <Row gutter={12} style={{ marginBottom: 10 }}>
//                     <Col span={12}>
//                       <Form.Item
//                         label={
//                           <span style={{ fontSize: 12 }}>
//                             Bill No <span style={{ color: "#ff4d4f" }}>*</span>
//                           </span>
//                         }
//                         required={false}
//                         style={{ marginBottom: 0 }}
//                       >
//                         <Input
//                           placeholder="Enter bill no"
//                           value={item.billNo}
//                           onChange={(e) =>
//                             handleItemChange(index, "billNo", e.target.value)
//                           }
//                           size="small"
//                           disabled={isLoading}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         label={
//                           <span style={{ fontSize: 12 }}>
//                             Amount (₹) <span style={{ color: "#ff4d4f" }}>*</span>
//                           </span>
//                         }
//                         required={false}
//                         style={{ marginBottom: 0 }}
//                       >
//                         <Input
//                           type="number"
//                           placeholder="Enter amount"
//                           value={item.amount || undefined}
//                           onChange={(e) =>
//                             handleItemChange(
//                               index,
//                               "amount",
//                               e.target.value ? parseFloat(e.target.value) : null
//                             )
//                           }
//                           prefix="₹"
//                           min={0}
//                           step={0.01}
//                           size="small"
//                           disabled={isLoading}
//                         />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   {/* Row 3: Description */}
//                   <Form.Item
//                     label={
//                       <span style={{ fontSize: 12 }}>
//                         Description <span style={{ color: "#ff4d4f" }}>*</span>
//                       </span>
//                     }
//                     required={false}
//                     style={{ marginBottom: 10 }}
//                   >
//                     <TextArea
//                       rows={2}
//                       placeholder="Describe expense details..."
//                       value={item.description}
//                       onChange={(e) =>
//                         handleItemChange(index, "description", e.target.value)
//                       }
//                       size="small"
//                       disabled={isLoading}
//                     />
//                   </Form.Item>

//                   {/* Row 4: Attachments */}
//                   <Form.Item
//                     label={
//                       <span style={{ fontSize: 12 }}>
//                         Attachments
//                         <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
//                           (Required - at least one)
//                         </Text>
//                       </span>
//                     }
//                     style={{ marginBottom: 0 }}
//                   >
//                     <Space direction="vertical" size={8} style={{ width: "100%" }}>
//                       <AttachmentUploader
//                         onUpload={(base64File, fileName) =>
//                           handleFileUpload(index, base64File, fileName)
//                         }
//                         maxSize={5}
//                         accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
//                         disabled={isLoading}
//                       />

//                       {item.attachments.length > 0 && (
//                         <div style={{ marginTop: 8 }}>
//                           {item.attachments.map((file, fileIndex) => (
//                             <div
//                               key={`${file.fileName}_${fileIndex}`}
//                               style={{
//                                 display: "flex",
//                                 alignItems: "center",
//                                 justifyContent: "space-between",
//                                 padding: "4px 8px",
//                                 border: "1px solid #e8e8e8",
//                                 borderRadius: 4,
//                                 marginBottom: 4,
//                                 backgroundColor: "#fff",
//                               }}
//                             >
//                               <span style={{ fontSize: 12 }}>{file.fileName}</span>
//                               <Space size={4}>
//                                 <Button
//                                   size="small"
//                                   type="text"
//                                   icon={<EyeOutlined />}
//                                   onClick={() => handleViewFile(file)}
//                                   disabled={isLoading}
//                                 />
//                                 <Button
//                                   size="small"
//                                   type="text"
//                                   danger
//                                   icon={<DeleteOutlined />}
//                                   onClick={() => handleDeleteAttachment(index, file)}
//                                   disabled={isLoading}
//                                 />
//                               </Space>
//                             </div>
//                           ))}
//                         </div>
//                       )}
//                     </Space>
//                   </Form.Item>
//                 </div>
//               ))}

//               {/* Add Item Button */}
//               <Button
//                 type="dashed"
//                 icon={<PlusOutlined />}
//                 onClick={handleAddItem}
//                 style={{ width: "100%", marginTop: 4 }}
//                 size="small"
//                 disabled={isLoading}
//               >
//                 Add Another Expense
//               </Button>
//             </div>

//             {/* Total Amount Display */}
//             <div
//               style={{
//                 padding: "10px 14px",
//                 backgroundColor: "#f0f5ff",
//                 borderRadius: 6,
//                 border: "1px solid #adc6ff",
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text strong style={{ fontSize: 13 }}>
//                 Total Amount:
//               </Text>
//               <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: 600 }}>
//                 ₹{getTotalAmount().toFixed(2)}
//               </Text>
//             </div>
//           </div>

//           {/* Fixed Footer */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: "12px",
//               borderTop: "1px solid #e8e8e8",
//               paddingTop: 16,
//               flexShrink: 0,
//               backgroundColor: "#fff",
//             }}
//           >
//             <Button
//               onClick={handleSaveDraft}
//               loading={isLoading}
//               icon={<SaveOutlined />}
//               size="middle"
//               disabled={isLoading}
//             >
//               Save Draft
//             </Button>
//             <Button
//               onClick={() => router.push("/reimbursements")}
//               size="middle"
//               disabled={isLoading}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="primary"
//               onClick={handleSubmit}
//               loading={isLoading}
//               size="middle"
//             >
//               Submit
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </div>
//   );
// }

// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   Form,
//   Button,
//   Select,
//   Input,
//   Space,
//   Typography,
//   notification,
//   DatePicker,
//   Row,
//   Col,
//   Alert,
// } from "antd";
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   SaveOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import MainLayout from "@/components/layout/MainLayout";
// import LoadingSpinner from "@/components/common/LoadingSpinner";
// import AttachmentUploader from "@/components/common/AttachmentUploader";
// import dayjs from "dayjs";
// import { useCreateReimbursement } from "@/hooks/usereimbursementcreate";
// import { ReimbursementService, CategoryLimit } from "@/services/reimbursementcreateService";

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// // Status enum matching backend
// const REIMBURSEMENT_STATUS = {
//   DRAFT: "DRAFT",
//   SUBMITTED: "SUBMITTED",
//   // APPROVED: "APPROVED",
//   // REJECTED: "REJECTED",
// } as const;

// // File interface for preview
// interface UploadedFile {
//   base64: string;
//   fileName: string;
//   fileType: string;
//   file?: File;
// }

// // Reimbursement Item Interface
// interface ReimbursementItem {
//   id: string;
//   category: string;
//   date: string | null;
//   billNo: string;
//   amount: number | null;
//   description: string;
//   attachments: UploadedFile[];
// }

// // Category option with limit info
// interface CategoryOption {
//   value: string;
//   label: string;
//   maxAmount: number;
//   periodType: string;
// }

// export default function CreateReimbursementPage() {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <MainLayout>
//         <LoadingSpinner message="Loading..." />
//       </MainLayout>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return (
//     <MainLayout>
//       <CreateReimbursementContent user={user} />
//     </MainLayout>
//   );
// }

// interface CreateReimbursementContentProps {
//   user: any;
// }

// function CreateReimbursementContent({ user }: CreateReimbursementContentProps) {
//   const router = useRouter();
//   const [form] = Form.useForm();
//   const [api, contextHolder] = notification.useNotification();

//   // ===== NEW: Category limits state =====
//   const [loadingLimits, setLoadingLimits] = useState(true);
//   const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryError, setCategoryError] = useState<string | null>(null);

//   // Use the create mutation hook
//   const createMutation = useCreateReimbursement();

//   // State for multiple reimbursement items
//   const [reimbursementItems, setReimbursementItems] = useState<ReimbursementItem[]>([
//     {
//       id: `item_${Date.now()}_0`,
//       category: "",
//       date: null,
//       billNo: "",
//       amount: null,
//       description: "",
//       attachments: [],
//     },
//   ]);

//   // Track all files for upload
//   const [allFiles, setAllFiles] = useState<File[]>([]);

//   // ===== NEW: Load category limits on page load =====
//   useEffect(() => {
//     loadCategoryLimits();
//   }, []);

//   // const loadCategoryLimits = async () => {
//   //   try {
//   //     setLoadingLimits(true);
//   //     setCategoryError(null);

//   //     // ONE CALL - Get category limits based on user's position
//   //     const limits = await ReimbursementService.getUserCategoryLimits();

//   //     console.log('✅ Loaded category limits:', limits);
//   //     setCategoryLimits(limits);

//   //     // Transform limits into category options with labels
//   //     // Note: You'll need to fetch category names from your categories API
//   //     // For now, using placeholder names - replace with actual API call
//   //     const options: CategoryOption[] = limits.map(limit => ({
//   //       value: limit.categoryId,
//   //       label: limit.categoryId, // This will be replaced with actual category name
//   //       maxAmount: limit.maxAmount,
//   //       periodType: limit.periodType
//   //     }));

//   //     setCategoryOptions(options);

//   //     // If you have a categories API, fetch names here
//   //     await loadCategoryNames(limits);

//   //   } catch (error: any) {
//   //     console.error('Failed to load category limits:', error);
//   //     setCategoryError(error.message || 'Failed to load category limits');
//   //   } finally {
//   //     setLoadingLimits(false);
//   //   }
//   // };

//   // NEW: Load category names from your categories API
//   // In your page component
// // In your page component
// const loadCategoryLimits = async () => {
//   try {
//     setLoadingLimits(true);
//     setCategoryError(null);

//     // This now returns the array directly from the service
//     const limits = await ReimbursementService.getUserCategoryLimits();

//     console.log('✅ Loaded category limits:', limits);

//     if (limits && limits.length > 0) {
//       setCategoryLimits(limits);

//       // Transform limits into category options
//       const options: CategoryOption[] = limits.map(limit => ({
//         value: limit.categoryId,
//         label: limit.categoryId, // Will be replaced with actual names if available
//         maxAmount: limit.maxAmount,
//         periodType: limit.periodType
//       }));

//       setCategoryOptions(options);

//       // Try to load category names if you have that API
//       if (limits.length > 0) {
//         await loadCategoryNames(limits);
//       }
//     } else {
//       console.log('No category limits found for this user');
//       setCategoryLimits([]);
//       setCategoryOptions([]);

//       // Optional: Show a message to user
//       api.info({
//         message: "No Limits Found",
//         description: "No reimbursement policies are configured for your position",
//         placement: "bottomRight",
//         duration: 4,
//       });
//     }

//   } catch (error: any) {
//     console.error('Failed to load category limits:', error);
//     setCategoryError(error.message || 'Failed to load category limits');
//     setCategoryLimits([]);
//     setCategoryOptions([]);
//   } finally {
//     setLoadingLimits(false);
//   }
// };

//   const loadCategoryNames = async (limits: CategoryLimit[]) => {
//     try {
//       const categoryIds = limits.map(limit => limit.categoryId);

//       // Replace this with your actual categories API endpoint
//       const response = await fetch('/api/reimbursement-categories/by-ids', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ids: categoryIds })
//       });

//       const result = await response.json();

//       if (result.success) {
//         const categories = result.data;

//         // Update options with actual names
//         const options: CategoryOption[] = limits.map(limit => {
//           const category = categories.find((c: any) => c.id === limit.categoryId);
//           return {
//             value: limit.categoryId,
//             label: category?.name || limit.categoryId,
//             maxAmount: limit.maxAmount,
//             periodType: limit.periodType
//           };
//         });

//         setCategoryOptions(options);
//       }
//     } catch (error) {
//       console.error('Failed to load category names:', error);
//       // Continue with placeholder names
//     }
//   };

//   // NEW: Get max amount for a category
//   const getMaxAmountForCategory = (categoryId: string): number => {
//     const option = categoryOptions.find(opt => opt.value === categoryId);
//     return option?.maxAmount || 0;
//   };

//   // NEW: Get period type for a category
//   const getPeriodTypeForCategory = (categoryId: string): string => {
//     const option = categoryOptions.find(opt => opt.value === categoryId);
//     return option?.periodType || 'MONTH';
//   };

//   // NEW: Validate amount against category limit
//   const validateAmount = (categoryId: string, amount: number | null): string | null => {
//     if (!categoryId || !amount) return null;

//     const maxAmount = getMaxAmountForCategory(categoryId);
//     if (amount > maxAmount) {
//       const periodType = getPeriodTypeForCategory(categoryId).toLowerCase();
//       return `Amount exceeds limit of ₹${maxAmount} per ${periodType}`;
//     }
//     return null;
//   };

//   // Handle Add Item
//   const handleAddItem = () => {
//     setReimbursementItems([
//       ...reimbursementItems,
//       {
//         id: `item_${Date.now()}_${reimbursementItems.length}`,
//         category: "",
//         date: null,
//         billNo: "",
//         amount: null,
//         description: "",
//         attachments: [],
//       },
//     ]);
//   };

//   // Handle Remove Item
//   const handleRemoveItem = (index: number) => {
//     if (reimbursementItems.length === 1) {
//       api.warning({
//         message: "Warning",
//         description: "At least one reimbursement item is required",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return;
//     }

//     const itemToRemove = reimbursementItems[index];
//     const filesToRemove = itemToRemove.attachments.map(att => att.fileName);
//     setAllFiles(prev => prev.filter(file => !filesToRemove.includes(file.name)));

//     const newItems = reimbursementItems.filter((_, i) => i !== index);
//     setReimbursementItems(newItems);
//   };

//   // Handle Field Change
//   const handleItemChange = (
//     index: number,
//     field: keyof ReimbursementItem,
//     value: any
//   ) => {
//     const newItems = [...reimbursementItems];
//     (newItems[index][field] as any) = value;
//     setReimbursementItems(newItems);
//   };

//   // Handle File Upload
//   const handleFileUpload = async (index: number, base64File: string, fileName: string) => {
//     try {
//       const response = await fetch(base64File);
//       const blob = await response.blob();
//       const file = new File([blob], fileName, { type: blob.type });

//       setAllFiles(prev => [...prev, file]);

//       const newFile: UploadedFile = {
//         base64: base64File,
//         fileName: fileName,
//         fileType: fileName.split('.').pop() || 'unknown',
//         file: file,
//       };

//       const newItems = [...reimbursementItems];
//       newItems[index].attachments.push(newFile);
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File uploaded successfully",
//         placement: "bottomRight",
//         duration: 2,
//       });
//     } catch (error) {
//       console.error("File upload error:", error);
//       api.error({
//         message: "Error",
//         description: "Failed to upload file",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Handle Delete Attachment
//   const handleDeleteAttachment = async (itemIndex: number, fileToDelete: UploadedFile) => {
//     try {
//       if (fileToDelete.file) {
//         setAllFiles(prev => prev.filter(f => f.name !== fileToDelete.fileName));
//       }

//       const newItems = [...reimbursementItems];
//       newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
//         (file) => file.fileName !== fileToDelete.fileName
//       );
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File deleted successfully",
//         placement: "bottomRight",
//         duration: 2,
//       });
//     } catch (error) {
//       console.error("File delete error:", error);
//       api.error({
//         message: "Error",
//         description: "Failed to delete file",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Validate Form
//   const validateForm = () => {
//     const totalAttachments = reimbursementItems.reduce(
//       (sum, item) => sum + item.attachments.length,
//       0
//     );

//     if (totalAttachments === 0) {
//       api.error({
//         message: "Validation Error",
//         description: "Please upload at least one attachment",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return false;
//     }

//     for (let i = 0; i < reimbursementItems.length; i++) {
//       const item = reimbursementItems[i];

//       if (!item.category) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a category`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.date) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a date`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.billNo?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter bill number`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.amount || item.amount <= 0) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a valid amount`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       // NEW: Validate against category limit
//       const amountError = validateAmount(item.category, item.amount);
//       if (amountError) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: ${amountError}`,
//           placement: "bottomRight",
//           duration: 4,
//         });
//         return false;
//       }

//       if (!item.description?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a description`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }
//     }

//     return true;
//   };

//   // Transform items to match backend format
//   const transformItemsForBackend = () => {
//     return reimbursementItems.map(item => ({
//       category: item.category,
//       date: item.date,
//       billNo: item.billNo,
//       amount: item.amount,
//       description: item.description,
//     }));
//   };

//   // Handle Save Draft
//   const handleSaveDraft = async () => {
//     if (!validateForm()) return;

//     try {
//       const itemsData = transformItemsForBackend();

//       await createMutation.mutateAsync({
//         items: itemsData,
//         files: allFiles,
//         status: REIMBURSEMENT_STATUS.DRAFT
//       });

//       api.success({
//         message: "Success",
//         description: "Reimbursement saved as draft",
//         placement: "bottomRight",
//         duration: 2,
//       });

//       setTimeout(() => {
//         router.push("/reimbursements/view");
//       }, 1000);

//     } catch (error: any) {
//       console.error("Save draft error:", error);
//       api.error({
//         message: "Error",
//         description: error?.message || "Failed to save draft",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Handle Submit
//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     try {
//       const itemsData = transformItemsForBackend();

//       console.log('📦 REIMBURSEMENT PAYLOAD:');
//       console.log('Items:', JSON.stringify(itemsData, null, 2));
//       console.log('Files:', allFiles.map(f => ({
//         name: f.name,
//         size: f.size,
//         type: f.type
//       })));
//       console.log('Status:', REIMBURSEMENT_STATUS.SUBMITTED);

//       await createMutation.mutateAsync({
//         items: itemsData,
//         files: allFiles,
//         status: REIMBURSEMENT_STATUS.SUBMITTED
//       });

//       api.success({
//         message: "Success",
//         description: "Reimbursement submitted successfully!",
//         placement: "bottomRight",
//         duration: 2,
//       });

//       // setTimeout(() => {
//       //   router.push("/reimbursements/view");
//       // }, 1000);

//     } catch (error: any) {
//       console.error('❌ Submit error:', error);
//       api.error({
//         message: "Error",
//         description: error?.message || "Failed to submit reimbursement",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Calculate Total Amount
//   const getTotalAmount = () => {
//     return reimbursementItems.reduce(
//       (sum, item) => sum + (item.amount || 0),
//       0
//     );
//   };

//   // Helper to view file
//   const handleViewFile = (file: UploadedFile) => {
//     if (file.base64) {
//       window.open(file.base64, '_blank');
//     }
//   };

//   const isLoading = createMutation.isPending || loadingLimits;

//   return (
//     <div
//       style={{
//         maxWidth: 900,
//         margin: "0 auto",
//         padding: "24px 16px",
//         height: "calc(100vh - 64px)",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       {contextHolder}

//       {/* Header */}
//       <div style={{ marginBottom: 16, flexShrink: 0 }}>
//         <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
//           Create Reimbursement Request
//         </Title>
//         <Text type="secondary" style={{ fontSize: 13 }}>
//           {new Date().toLocaleDateString("en-US", {
//             weekday: "long",
//             month: "long",
//             day: "numeric",
//             year: "numeric",
//           })}
//         </Text>
//       </div>

//       {/* NEW: Category Limits Summary */}
//       {!loadingLimits && categoryOptions.length > 0 && (
//         <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <Text strong>Your Reimbursement Limits:</Text>
//             <Space size={16} wrap>
//               {categoryOptions.map(opt => (
//                 <Text key={opt.value} style={{ fontSize: 12 }}>
//                   {opt.label}: ₹{opt.maxAmount}/{opt.periodType.toLowerCase()}
//                 </Text>
//               ))}
//             </Space>
//           </div>
//         </Card>
//       )}

//       {/* NEW: Error Alert */}
//       {categoryError && (
//         <Alert
//           message="Error Loading Limits"
//           description={categoryError}
//           type="error"
//           showIcon
//           style={{ marginBottom: 16 }}
//         />
//       )}

//       {/* Form Card */}
//       <Card
//         style={{
//           boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//           borderRadius: 8,
//           border: "1px solid #e8e8e8",
//           flex: 1,
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}
//         styles={{ body: {
//           padding: "16px 20px",
//           flex: 1,
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//           }}
//         >
//           {/* Scrollable Content Area */}
//           <div style={{
//             flex: 1,
//             overflowY: "auto",
//             paddingRight: 8,
//             marginBottom: 16,
//           }}>
//             {/* Reimbursement Items Section */}
//             <div style={{ marginBottom: 16 }}>
//               <Text
//                 strong
//                 style={{ fontSize: 15, display: "block", marginBottom: 12 }}
//               >
//                 Reimbursement Items
//               </Text>

//               {reimbursementItems.map((item, index) => {
//                 // NEW: Check if amount exceeds limit for this item
//                 const amountError = item.category && item.amount
//                   ? validateAmount(item.category, item.amount)
//                   : null;

//                 return (
//                   <div
//                     key={item.id}
//                     style={{
//                       border: "1px solid #e8e8e8",
//                       borderRadius: 6,
//                       padding: "12px 14px",
//                       marginBottom: 12,
//                       backgroundColor: "#fafafa",
//                       position: "relative",
//                     }}
//                   >
//                     {/* Item Header */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
//                         Expense #{index + 1}
//                       </Text>
//                       {reimbursementItems.length > 1 && (
//                         <Button
//                           type="text"
//                           danger
//                           size="small"
//                           icon={<DeleteOutlined />}
//                           onClick={() => handleRemoveItem(index)}
//                           disabled={isLoading}
//                         >
//                           Remove
//                         </Button>
//                       )}
//                     </div>

//                     {/* Row 1: Category and Date */}
//                     <Row gutter={12} style={{ marginBottom: 10 }}>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Category <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <Select
//                             placeholder={loadingLimits ? "Loading categories..." : "Select"}
//                             value={item.category || undefined}
//                             onChange={(value) => {
//                               handleItemChange(index, "category", value);
//                               // Clear amount error when category changes
//                               if (item.amount) {
//                                 const error = validateAmount(value, item.amount);
//                                 if (error) {
//                                   api.warning({
//                                     message: "Limit Warning",
//                                     description: error,
//                                     placement: "bottomRight",
//                                     duration: 3,
//                                   });
//                                 }
//                               }
//                             }}
//                             options={categoryOptions}
//                             style={{ width: "100%" }}
//                             size="small"
//                             disabled={isLoading || loadingLimits}
//                             showSearch
//                             filterOption={(input, option) =>
//                               (option?.label ?? "")
//                                 .toLowerCase()
//                                 .includes(input.toLowerCase())
//                             }
//                             loading={loadingLimits}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Date <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <DatePicker
//                             style={{ width: "100%" }}
//                             placeholder="Select"
//                             value={item.date ? dayjs(item.date) : null}
//                             onChange={(date) =>
//                               handleItemChange(index, "date", date ? date.toISOString() : null)
//                             }
//                             format="DD-MM-YYYY"
//                             size="small"
//                             disabled={isLoading}
//                             disabledDate={(current) =>
//                               current && current > dayjs().endOf("day")
//                             }
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     {/* Row 2: Bill No and Amount */}
//                     <Row gutter={12} style={{ marginBottom: 10 }}>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Bill No <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <Input
//                             placeholder="Enter bill no"
//                             value={item.billNo}
//                             onChange={(e) =>
//                               handleItemChange(index, "billNo", e.target.value)
//                             }
//                             size="small"
//                             disabled={isLoading}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Amount (₹) <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                           validateStatus={amountError ? "error" : undefined}
//                           help={amountError}
//                         >
//                           <Input
//                             type="number"
//                             placeholder="Enter amount"
//                             value={item.amount || undefined}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 index,
//                                 "amount",
//                                 e.target.value ? parseFloat(e.target.value) : null
//                               )
//                             }
//                             prefix="₹"
//                             min={0}
//                             step={0.01}
//                             size="small"
//                             disabled={isLoading}
//                             status={amountError ? "error" : undefined}
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     {/* Row 3: Description */}
//                     <Form.Item
//                       label={
//                         <span style={{ fontSize: 12 }}>
//                           Description <span style={{ color: "#ff4d4f" }}>*</span>
//                         </span>
//                       }
//                       required={false}
//                       style={{ marginBottom: 10 }}
//                     >
//                       <TextArea
//                         rows={2}
//                         placeholder="Describe expense details..."
//                         value={item.description}
//                         onChange={(e) =>
//                           handleItemChange(index, "description", e.target.value)
//                         }
//                         size="small"
//                         disabled={isLoading}
//                       />
//                     </Form.Item>

//                     {/* Row 4: Attachments */}
//                     <Form.Item
//                       label={
//                         <span style={{ fontSize: 12 }}>
//                           Attachments
//                           <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
//                             (Required - at least one)
//                           </Text>
//                         </span>
//                       }
//                       style={{ marginBottom: 0 }}
//                     >
//                       <Space direction="vertical" size={8} style={{ width: "100%" }}>
//                         <AttachmentUploader
//                           onUpload={(base64File, fileName) =>
//                             handleFileUpload(index, base64File, fileName)
//                           }
//                           maxSize={5}
//                           accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
//                           disabled={isLoading}
//                         />

//                         {item.attachments.length > 0 && (
//                           <div style={{ marginTop: 8 }}>
//                             {item.attachments.map((file, fileIndex) => (
//                               <div
//                                 key={`${file.fileName}_${fileIndex}`}
//                                 style={{
//                                   display: "flex",
//                                   alignItems: "center",
//                                   justifyContent: "space-between",
//                                   padding: "4px 8px",
//                                   border: "1px solid #e8e8e8",
//                                   borderRadius: 4,
//                                   marginBottom: 4,
//                                   backgroundColor: "#fff",
//                                 }}
//                               >
//                                 <span style={{ fontSize: 12 }}>{file.fileName}</span>
//                                 <Space size={4}>
//                                   <Button
//                                     size="small"
//                                     type="text"
//                                     icon={<EyeOutlined />}
//                                     onClick={() => handleViewFile(file)}
//                                     disabled={isLoading}
//                                   />
//                                   <Button
//                                     size="small"
//                                     type="text"
//                                     danger
//                                     icon={<DeleteOutlined />}
//                                     onClick={() => handleDeleteAttachment(index, file)}
//                                     disabled={isLoading}
//                                   />
//                                 </Space>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </Space>
//                     </Form.Item>
//                   </div>
//                 );
//               })}

//               {/* Add Item Button */}
//               <Button
//                 type="dashed"
//                 icon={<PlusOutlined />}
//                 onClick={handleAddItem}
//                 style={{ width: "100%", marginTop: 4 }}
//                 size="small"
//                 disabled={isLoading}
//               >
//                 Add Another Expense
//               </Button>
//             </div>

//             {/* Total Amount Display */}
//             <div
//               style={{
//                 padding: "10px 14px",
//                 backgroundColor: "#f0f5ff",
//                 borderRadius: 6,
//                 border: "1px solid #adc6ff",
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text strong style={{ fontSize: 13 }}>
//                 Total Amount:
//               </Text>
//               <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: 600 }}>
//                 ₹{getTotalAmount().toFixed(2)}
//               </Text>
//             </div>
//           </div>

//           {/* Fixed Footer */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: "12px",
//               borderTop: "1px solid #e8e8e8",
//               paddingTop: 16,
//               flexShrink: 0,
//               backgroundColor: "#fff",
//             }}
//           >
//             <Button
//               onClick={handleSaveDraft}
//               loading={isLoading}
//               icon={<SaveOutlined />}
//               size="middle"
//               disabled={isLoading}
//             >
//               Save Draft
//             </Button>
//             <Button
//               onClick={() => router.push("/reimbursements")}
//               size="middle"
//               disabled={isLoading}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="primary"
//               onClick={handleSubmit}
//               loading={isLoading}
//               size="middle"
//             >
//               Submit
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </div>
//   );
// }///working without

// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   Form,
//   Button,
//   Select,
//   Input,
//   Space,
//   Typography,
//   notification,
//   DatePicker,
//   Row,
//   Col,
//   Alert,
//   Tag
// } from "antd";
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   SaveOutlined,
//   EyeOutlined,
// } from "@ant-design/icons";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import MainLayout from "@/components/layout/MainLayout";
// import LoadingSpinner from "@/components/common/LoadingSpinner";
// import AttachmentUploader from "@/components/common/AttachmentUploader";
// import dayjs from "dayjs";
// import {
//   useCreateReimbursement,
//   useReimbursementById,
//   useUpdateReimbursement
// } from "@/hooks/usereimbursementcreate";
// import { ReimbursementService, CategoryLimit } from "@/services/reimbursementcreateService";

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// // Status enum matching backend
// const REIMBURSEMENT_STATUS = {
//   DRAFT: "DRAFT",
//   SUBMITTED: "SUBMITTED",
// } as const;

// // File interface for preview
// interface UploadedFile {
//   base64: string;
//   fileName: string;
//   fileType: string;
//   file?: File;
// }

// // Reimbursement Item Interface
// interface ReimbursementItem {
//   id: string;
//   category: string;
//   date: string | null;
//   billNo: string;
//   amount: number | null;
//   description: string;
//   attachments: UploadedFile[];
// }

// // Category option with limit info
// interface CategoryOption {
//   value: string;
//   label: string;
//   maxAmount: number;
//   periodType: string;
// }

// export default function CreateReimbursementPage() {
//   const { user, isLoading } = useAuth();
//   const searchParams = useSearchParams();
//   const reimbursementId = searchParams.get('id');

//   if (isLoading) {
//     return (
//       <MainLayout>
//         <LoadingSpinner message="Loading..." />
//       </MainLayout>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return (
//     <MainLayout>
//       <CreateReimbursementContent user={user} reimbursementId={reimbursementId} />
//     </MainLayout>
//   );
// }

// interface CreateReimbursementContentProps {
//   user: any;
//   reimbursementId: string | null;
// }

// // function CreateReimbursementContent({ user, reimbursementId }: CreateReimbursementContentProps) {
// //   const router = useRouter();
// //   const [form] = Form.useForm();
// //   const [api, contextHolder] = notification.useNotification();

// //   // State for loading existing reimbursement
// //   const [loadingReimbursement, setLoadingReimbursement] = useState(!!reimbursementId);

// //   // ===== Category limits state =====
// //   const [loadingLimits, setLoadingLimits] = useState(true);
// //   const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
// //   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
// //   const [categoryError, setCategoryError] = useState<string | null>(null);

// //   // Use the create and update mutation hooks
// //   const createMutation = useCreateReimbursement();
// //   const updateMutation = useUpdateReimbursement();

// //   // Fetch reimbursement data if editing
// //   const {
// //     data: existingReimbursement,
// //     isLoading: fetchingReimbursement,
// //     refetch: refetchReimbursement
// //   } = useReimbursementById(reimbursementId || '');

// //   // State for multiple reimbursement items
// //   const [reimbursementItems, setReimbursementItems] = useState<ReimbursementItem[]>([
// //     {
// //       id: `item_${Date.now()}_0`,
// //       category: "",
// //       date: null,
// //       billNo: "",
// //       amount: null,
// //       description: "",
// //       attachments: [],
// //     },
// //   ]);

// //   // Track all files for upload
// //   const [allFiles, setAllFiles] = useState<File[]>([]);

// //   // ===== Load category limits on page load =====
// //   useEffect(() => {
// //     loadCategoryLimits();
// //   }, []);

// //   // ===== Load existing reimbursement data when editing =====
// //   useEffect(() => {
// //     if (existingReimbursement && reimbursementId) {
// //       console.log('📝 Loading existing reimbursement:', existingReimbursement);
// //       loadReimbursementData(existingReimbursement);
// //       setLoadingReimbursement(false);
// //     }
// //   }, [existingReimbursement, reimbursementId]);

// //   const loadReimbursementData = (data: any) => {
// //     console.log('Loading reimbursement data:', data);

// //     if (!data || !data.items || data.items.length === 0) {
// //       console.log('No items found in reimbursement data');
// //       return;
// //     }

// //     // Transform the API response to match our component state
// //     const items: ReimbursementItem[] = data.items.map((item: any, index: number) => {
// //       console.log(`Processing item ${index}:`, item);

// //       return {
// //         id: `item_${Date.now()}_${index}`,
// //         category: item.category || '',
// //         date: item.date || null,
// //         billNo: item.billNo || '',
// //         amount: item.amount || null,
// //         description: item.description || '',
// //         attachments: [], // Attachments will need to be handled separately
// //       };
// //     });

// //     console.log('Transformed items:', items);
// //     setReimbursementItems(items);

// //     // If you have attachments, you'll need to load them here
// //     // This depends on how your API returns attachments
// //     if (data.attachments && data.attachments.length > 0) {
// //       console.log('Attachments found:', data.attachments);
// //       // Handle attachments if your API returns them
// //       // You'll need to convert them to UploadedFile format
// //     }
// //   };

// //   const loadCategoryLimits = async () => {
// //     try {
// //       setLoadingLimits(true);
// //       setCategoryError(null);

// //       const limits = await ReimbursementService.getUserCategoryLimits();

// //       console.log('✅ Loaded category limits:', limits);

// //       if (limits && limits.length > 0) {
// //         setCategoryLimits(limits);

// //         const options: CategoryOption[] = limits.map(limit => ({
// //           value: limit.categoryId,
// //           label: limit.categoryId,
// //           maxAmount: limit.maxAmount,
// //           periodType: limit.periodType
// //         }));

// //         setCategoryOptions(options);

// //         if (limits.length > 0) {
// //           await loadCategoryNames(limits);
// //         }
// //       } else {
// //         console.log('No category limits found for this user');
// //         setCategoryLimits([]);
// //         setCategoryOptions([]);

// //         api.info({
// //           message: "No Limits Found",
// //           description: "No reimbursement policies are configured for your position",
// //           placement: "bottomRight",
// //           duration: 4,
// //         });
// //       }

// //     } catch (error: any) {
// //       console.error('Failed to load category limits:', error);
// //       setCategoryError(error.message || 'Failed to load category limits');
// //       setCategoryLimits([]);
// //       setCategoryOptions([]);
// //     } finally {
// //       setLoadingLimits(false);
// //     }
// //   };

// //   const loadCategoryNames = async (limits: CategoryLimit[]) => {
// //     try {
// //       const categoryIds = limits.map(limit => limit.categoryId);

// //       const response = await fetch('/api/reimbursement-categories/by-ids', {
// //         method: 'POST',
// //         headers: { 'Content-Type': 'application/json' },
// //         body: JSON.stringify({ ids: categoryIds })
// //       });

// //       const result = await response.json();

// //       if (result.success) {
// //         const categories = result.data;

// //         const options: CategoryOption[] = limits.map(limit => {
// //           const category = categories.find((c: any) => c.id === limit.categoryId);
// //           return {
// //             value: limit.categoryId,
// //             label: category?.name || limit.categoryId,
// //             maxAmount: limit.maxAmount,
// //             periodType: limit.periodType
// //           };
// //         });

// //         setCategoryOptions(options);
// //       }
// //     } catch (error) {
// //       console.error('Failed to load category names:', error);
// //     }
// //   };

// //   // Get max amount for a category
// //   const getMaxAmountForCategory = (categoryId: string): number => {
// //     const option = categoryOptions.find(opt => opt.value === categoryId);
// //     return option?.maxAmount || 0;
// //   };

// //   // Get period type for a category
// //   const getPeriodTypeForCategory = (categoryId: string): string => {
// //     const option = categoryOptions.find(opt => opt.value === categoryId);
// //     return option?.periodType || 'MONTH';
// //   };

// //   // Validate amount against category limit
// //   const validateAmount = (categoryId: string, amount: number | null): string | null => {
// //     if (!categoryId || !amount) return null;

// //     const maxAmount = getMaxAmountForCategory(categoryId);
// //     if (amount > maxAmount) {
// //       const periodType = getPeriodTypeForCategory(categoryId).toLowerCase();
// //       return `Amount exceeds limit of ₹${maxAmount} per ${periodType}`;
// //     }
// //     return null;
// //   };

// //   // Handle Add Item
// //   const handleAddItem = () => {
// //     setReimbursementItems([
// //       ...reimbursementItems,
// //       {
// //         id: `item_${Date.now()}_${reimbursementItems.length}`,
// //         category: "",
// //         date: null,
// //         billNo: "",
// //         amount: null,
// //         description: "",
// //         attachments: [],
// //       },
// //     ]);
// //   };

// //   // Handle Remove Item
// //   const handleRemoveItem = (index: number) => {
// //     if (reimbursementItems.length === 1) {
// //       api.warning({
// //         message: "Warning",
// //         description: "At least one reimbursement item is required",
// //         placement: "bottomRight",
// //         duration: 3,
// //       });
// //       return;
// //     }

// //     const itemToRemove = reimbursementItems[index];
// //     const filesToRemove = itemToRemove.attachments.map(att => att.fileName);
// //     setAllFiles(prev => prev.filter(file => !filesToRemove.includes(file.name)));

// //     const newItems = reimbursementItems.filter((_, i) => i !== index);
// //     setReimbursementItems(newItems);
// //   };

// //   // Handle Field Change
// //   // const handleItemChange = (
// //   //   index: number,
// //   //   field: keyof ReimbursementItem,
// //   //   value: any
// //   // ) => {
// //   //   const newItems = [...reimbursementItems];
// //   //   (newItems[index][field] as any) = value;
// //   //   setReimbursementItems(newItems);
// //   // };
// // const handleItemChange = (
// //   index: number,
// //   field: keyof ReimbursementItem,
// //   value: any
// // ) => {
// //   const newItems = [...reimbursementItems];

// //   // If field is 'amount', ensure it's stored as a number
// //   if (field === 'amount') {
// //     (newItems[index][field] as any) = value ? Number(value) : null;
// //   } else {
// //     (newItems[index][field] as any) = value;
// //   }

// //   setReimbursementItems(newItems);
// // };
// //   // Handle File Upload
// //   const handleFileUpload = async (index: number, base64File: string, fileName: string) => {
// //     try {
// //       const response = await fetch(base64File);
// //       const blob = await response.blob();
// //       const file = new File([blob], fileName, { type: blob.type });

// //       setAllFiles(prev => [...prev, file]);

// //       const newFile: UploadedFile = {
// //         base64: base64File,
// //         fileName: fileName,
// //         fileType: fileName.split('.').pop() || 'unknown',
// //         file: file,
// //       };

// //       const newItems = [...reimbursementItems];
// //       newItems[index].attachments.push(newFile);
// //       setReimbursementItems(newItems);

// //       api.success({
// //         message: "Success",
// //         description: "File uploaded successfully",
// //         placement: "bottomRight",
// //         duration: 2,
// //       });
// //     } catch (error) {
// //       console.error("File upload error:", error);
// //       api.error({
// //         message: "Error",
// //         description: "Failed to upload file",
// //         placement: "bottomRight",
// //         duration: 3,
// //       });
// //     }
// //   };

// //   // Handle Delete Attachment
// //   const handleDeleteAttachment = async (itemIndex: number, fileToDelete: UploadedFile) => {
// //     try {
// //       if (fileToDelete.file) {
// //         setAllFiles(prev => prev.filter(f => f.name !== fileToDelete.fileName));
// //       }

// //       const newItems = [...reimbursementItems];
// //       newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
// //         (file) => file.fileName !== fileToDelete.fileName
// //       );
// //       setReimbursementItems(newItems);

// //       api.success({
// //         message: "Success",
// //         description: "File deleted successfully",
// //         placement: "bottomRight",
// //         duration: 2,
// //       });
// //     } catch (error) {
// //       console.error("File delete error:", error);
// //       api.error({
// //         message: "Error",
// //         description: "Failed to delete file",
// //         placement: "bottomRight",
// //         duration: 3,
// //       });
// //     }
// //   };

// //   // Validate Form
// //   const validateForm = () => {
// //     const totalAttachments = reimbursementItems.reduce(
// //       (sum, item) => sum + item.attachments.length,
// //       0
// //     );

// //     // Only validate attachments for new submissions or when adding new attachments
// //     // For editing existing ones, we might not have attachments in the state
// //     if (!reimbursementId && totalAttachments === 0) {
// //       api.error({
// //         message: "Validation Error",
// //         description: "Please upload at least one attachment",
// //         placement: "bottomRight",
// //         duration: 3,
// //       });
// //       return false;
// //     }

// //     for (let i = 0; i < reimbursementItems.length; i++) {
// //       const item = reimbursementItems[i];

// //       if (!item.category) {
// //         api.error({
// //           message: "Validation Error",
// //           description: `Item #${i + 1}: Please select a category`,
// //           placement: "bottomRight",
// //           duration: 3,
// //         });
// //         return false;
// //       }

// //       if (!item.date) {
// //         api.error({
// //           message: "Validation Error",
// //           description: `Item #${i + 1}: Please select a date`,
// //           placement: "bottomRight",
// //           duration: 3,
// //         });
// //         return false;
// //       }

// //       if (!item.billNo?.trim()) {
// //         api.error({
// //           message: "Validation Error",
// //           description: `Item #${i + 1}: Please enter bill number`,
// //           placement: "bottomRight",
// //           duration: 3,
// //         });
// //         return false;
// //       }

// //       if (!item.amount || item.amount <= 0) {
// //         api.error({
// //           message: "Validation Error",
// //           description: `Item #${i + 1}: Please enter a valid amount`,
// //           placement: "bottomRight",
// //           duration: 3,
// //         });
// //         return false;
// //       }

// //       const amountError = validateAmount(item.category, item.amount);
// //       if (amountError) {
// //         api.error({
// //           message: "Validation Error",
// //           description: `Item #${i + 1}: ${amountError}`,
// //           placement: "bottomRight",
// //           duration: 4,
// //         });
// //         return false;
// //       }

// //       if (!item.description?.trim()) {
// //         api.error({
// //           message: "Validation Error",
// //           description: `Item #${i + 1}: Please enter a description`,
// //           placement: "bottomRight",
// //           duration: 3,
// //         });
// //         return false;
// //       }
// //     }

// //     return true;
// //   };

// //   // Transform items to match backend format
// //   // const transformItemsForBackend = () => {
// //   //   return reimbursementItems.map(item => ({
// //   //     category: item.category,
// //   //     date: item.date,
// //   //     billNo: item.billNo,
// //   //     amount: item.amount,
// //   //     description: item.description,
// //   //   }));
// //   // };
// //   const transformItemsForBackend = () => {
// //   return reimbursementItems.map(item => ({
// //     category: item.category,
// //     date: item.date,
// //     billNo: item.billNo,
// //     amount: item.amount ? Number(item.amount) : 0, // Ensure it's a number
// //     description: item.description,
// //   }));
// // };

// //   // Handle Save Draft
// //   const handleSaveDraft = async () => {
// //     if (!validateForm()) return;

// //     try {
// //       const itemsData = transformItemsForBackend();

// //       if (reimbursementId) {
// //         // Update existing draft
// //         await updateMutation.mutateAsync({
// //           id: reimbursementId,
// //           data: {
// //             items: itemsData,
// //             status: REIMBURSEMENT_STATUS.DRAFT
// //           },
// //           files: allFiles
// //         });

// //         api.success({
// //           message: "Success",
// //           description: "Draft updated successfully",
// //           placement: "bottomRight",
// //           duration: 2,
// //         });
// //       } else {
// //         // Create new draft
// //         await createMutation.mutateAsync({
// //           items: itemsData,
// //           files: allFiles,
// //           status: REIMBURSEMENT_STATUS.DRAFT
// //         });

// //         api.success({
// //           message: "Success",
// //           description: "Reimbursement saved as draft",
// //           placement: "bottomRight",
// //           duration: 2,
// //         });
// //       }

// //       setTimeout(() => {
// //         router.push("/reimbursements/view");
// //       }, 1000);

// //     } catch (error: any) {
// //       console.error("Save draft error:", error);
// //       api.error({
// //         message: "Error",
// //         description: error?.message || "Failed to save draft",
// //         placement: "bottomRight",
// //         duration: 3,
// //       });
// //     }
// //   };

// //   // Handle Submit
// // //   const handleSubmit = async () => {
// // //     if (!validateForm()) return;

// // //     try {
// // //       const itemsData = transformItemsForBackend();

// // //       console.log('📦 REIMBURSEMENT PAYLOAD:');
// // //       console.log('Items:', JSON.stringify(itemsData, null, 2));
// // //       console.log('Files:', allFiles.map(f => ({
// // //         name: f.name,
// // //         size: f.size,
// // //         type: f.type
// // //       })));
// // //       console.log('Status:', REIMBURSEMENT_STATUS.SUBMITTED);

// // //       // if (reimbursementId) {
// // //       //   // Update existing and submit
// // //       //   await updateMutation.mutateAsync({
// // //       //     id: reimbursementId,
// // //       //     data: {
// // //       //       items: itemsData,
// // //       //       status: REIMBURSEMENT_STATUS.SUBMITTED
// // //       //     },
// // //       //     files: allFiles
// // //       //   });

// // //       //   api.success({
// // //       //     message: "Success",
// // //       //     description: "Reimbursement updated and submitted successfully!",
// // //       //     placement: "bottomRight",
// // //       //     duration: 2,
// // //       //   });
// // //       // } else {
// // //       //   // Create new and submit
// // //       //   await createMutation.mutateAsync({
// // //       //     items: itemsData,
// // //       //     files: allFiles,
// // //       //     status: REIMBURSEMENT_STATUS.SUBMITTED
// // //       //   });

// // //       //   api.success({
// // //       //     message: "Success",
// // //       //     description: "Reimbursement submitted successfully!",
// // //       //     placement: "bottomRight",
// // //       //     duration: 2,
// // //       //   });
// // //       // }

// // //       // setTimeout(() => {
// // //       //   router.push("/reimbursements/view");
// // //       // }, 1000);
// // // // In handleSubmit, after successful update
// // // if (reimbursementId) {
// // //   await updateMutation.mutateAsync({
// // //     id: reimbursementId,
// // //     data: {
// // //       items: itemsData,
// // //       status: REIMBURSEMENT_STATUS.SUBMITTED
// // //     },
// // //     files: allFiles
// // //   });

// // //   // Refetch the updated data
// // //   await refetchReimbursement();

// // //   api.success({
// // //     message: "Success",
// // //     description: "Reimbursement updated and submitted successfully!",
// // //     placement: "bottomRight",
// // //     duration: 2,
// // //   });
// // // }
// // //     } catch (error: any) {
// // //       console.error('❌ Submit error:', error);
// // //       api.error({
// // //         message: "Error",
// // //         description: error?.message || "Failed to submit reimbursement",
// // //         placement: "bottomRight",
// // //         duration: 3,
// // //       });
// // //     }
// // //   };

// // // In your page component
// // const handleSubmit = async () => {
// //   if (!validateForm()) return;

// //   try {
// //     const itemsData = transformItemsForBackend();

// //     console.log('📦 REIMBURSEMENT PAYLOAD:');
// //     console.log('Items:', JSON.stringify(itemsData, null, 2));
// //     console.log('Files:', allFiles.map(f => ({
// //       name: f.name,
// //       size: f.size,
// //       type: f.type
// //     })));
// //     console.log('Status:', REIMBURSEMENT_STATUS.SUBMITTED);

// //     let result;
// //     if (reimbursementId) {
// //       // Update existing and submit
// //       result = await updateMutation.mutateAsync({
// //         id: reimbursementId,
// //         data: {
// //           items: itemsData,
// //           status: REIMBURSEMENT_STATUS.SUBMITTED
// //         },
// //         files: allFiles
// //       });

// //       // Update local state with the mutation result
// //       if (result) {
// //         console.log('✅ Update successful, updating local state with:', result);
// //         loadReimbursementData(result);
// //       }

// //       api.success({
// //         message: "Success",
// //         description: "Reimbursement updated and submitted successfully!",
// //         placement: "bottomRight",
// //         duration: 2,
// //       });
// //     } else {
// //       // Create new and submit
// //       result = await createMutation.mutateAsync({
// //         items: itemsData,
// //         files: allFiles,
// //         status: REIMBURSEMENT_STATUS.SUBMITTED
// //       });

// //       api.success({
// //         message: "Success",
// //         description: "Reimbursement submitted successfully!",
// //         placement: "bottomRight",
// //         duration: 2,
// //       });
// //     }

// //     // Don't navigate immediately, let the user see the success message
// //     // setTimeout(() => {
// //     //   router.push("/reimbursements/view");
// //     // }, 1000);

// //   } catch (error: any) {
// //     console.error('❌ Submit error:', error);
// //     api.error({
// //       message: "Error",
// //       description: error?.message || "Failed to submit reimbursement",
// //       placement: "bottomRight",
// //       duration: 3,
// //     });
// //   }
// // };

// //   // Calculate Total Amount
// //   // const getTotalAmount = () => {
// //   //   return reimbursementItems.reduce(
// //   //     (sum, item) => sum + (item.amount || 0),
// //   //     0
// //   //   );
// //   // };
// // //   const getTotalAmount = () => {
// // //   return reimbursementItems.reduce((sum, item) => {
// // //     // Ensure amount is treated as a number, default to 0 if invalid
// // //     const amount = typeof item.amount === 'number' && !isNaN(item.amount)
// // //       ? item.amount
// // //       : 0;
// // //     return sum + amount;
// // //   }, 0);
// // // };
// // const getTotalAmount = () => {
// //   return reimbursementItems.reduce((sum, item) => {
// //     // Handle both string and number amounts
// //     const amount = typeof item.amount === 'string'
// //       ? parseFloat(item.amount) || 0
// //       : (typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0);
// //     return sum + amount;
// //   }, 0);
// // };

// //   // Helper to view file
// //   const handleViewFile = (file: UploadedFile) => {
// //     if (file.base64) {
// //       window.open(file.base64, '_blank');
// //     }
// //   };

// //   const isLoading = createMutation.isPending || updateMutation.isPending || loadingLimits || loadingReimbursement || fetchingReimbursement;

// //   // Show loading spinner while fetching data
// //   if (fetchingReimbursement && reimbursementId) {
// //     return (
// //       <MainLayout>
// //         <LoadingSpinner message="Loading reimbursement data..." />
// //       </MainLayout>
// //     );
// //   }

// //   return (
// //     <div
// //       style={{
// //         maxWidth: 900,
// //         margin: "0 auto",
// //         padding: "24px 16px",
// //         height: "calc(100vh - 64px)",
// //         display: "flex",
// //         flexDirection: "column",
// //       }}
// //     >
// //       {contextHolder}

// //       {/* Header */}
// //       <div style={{ marginBottom: 16, flexShrink: 0 }}>
// //         <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
// //           {reimbursementId ? 'Edit Reimbursement Request' : 'Create Reimbursement Request'}
// //         </Title>
// //         <Text type="secondary" style={{ fontSize: 13 }}>
// //           {new Date().toLocaleDateString("en-US", {
// //             weekday: "long",
// //             month: "long",
// //             day: "numeric",
// //             year: "numeric",
// //           })}
// //         </Text>
// //         {reimbursementId && existingReimbursement && (
// //           <div style={{ marginTop: 8 }}>
// //             <Tag color={existingReimbursement.status === 'DRAFT' ? 'default' : 'blue'}>
// //               Status: {existingReimbursement.status}
// //             </Tag>
// //           </div>
// //         )}
// //       </div>

// //       {/* Category Limits Summary */}
// //       {!loadingLimits && categoryOptions.length > 0 && (
// //         <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
// //           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// //             <Text strong>Your Reimbursement Limits:</Text>
// //             <Space size={16} wrap>
// //               {categoryOptions.map(opt => (
// //                 <Text key={opt.value} style={{ fontSize: 12 }}>
// //                   {opt.label}: ₹{opt.maxAmount}/{opt.periodType.toLowerCase()}
// //                 </Text>
// //               ))}
// //             </Space>
// //           </div>
// //         </Card>
// //       )}

// //       {/* Error Alert */}
// //       {categoryError && (
// //         <Alert
// //           message="Error Loading Limits"
// //           description={categoryError}
// //           type="error"
// //           showIcon
// //           style={{ marginBottom: 16 }}
// //         />
// //       )}

// //       {/* Form Card */}
// //       <Card
// //         style={{
// //           boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
// //           borderRadius: 8,
// //           border: "1px solid #e8e8e8",
// //           flex: 1,
// //           display: "flex",
// //           flexDirection: "column",
// //           overflow: "hidden",
// //         }}
// //         styles={{ body: {
// //           padding: "16px 20px",
// //           flex: 1,
// //           display: "flex",
// //           flexDirection: "column",
// //           overflow: "hidden",
// //         }}}
// //       >
// //         <Form
// //           form={form}
// //           layout="vertical"
// //           style={{
// //             display: "flex",
// //             flexDirection: "column",
// //             height: "100%",
// //           }}
// //         >
// //           {/* Scrollable Content Area */}
// //           <div style={{
// //             flex: 1,
// //             overflowY: "auto",
// //             paddingRight: 8,
// //             marginBottom: 16,
// //           }}>
// //             {/* Reimbursement Items Section */}
// //             <div style={{ marginBottom: 16 }}>
// //               <Text
// //                 strong
// //                 style={{ fontSize: 15, display: "block", marginBottom: 12 }}
// //               >
// //                 Reimbursement Items
// //               </Text>

// //               {reimbursementItems.map((item, index) => {
// //                 const amountError = item.category && item.amount
// //                   ? validateAmount(item.category, item.amount)
// //                   : null;

// //                 return (
// //                   <div
// //                     key={item.id}
// //                     style={{
// //                       border: "1px solid #e8e8e8",
// //                       borderRadius: 6,
// //                       padding: "12px 14px",
// //                       marginBottom: 12,
// //                       backgroundColor: "#fafafa",
// //                       position: "relative",
// //                     }}
// //                   >
// //                     {/* Item Header */}
// //                     <div
// //                       style={{
// //                         display: "flex",
// //                         justifyContent: "space-between",
// //                         alignItems: "center",
// //                         marginBottom: 12,
// //                       }}
// //                     >
// //                       <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
// //                         Expense #{index + 1}
// //                       </Text>
// //                       {reimbursementItems.length > 1 && (
// //                         <Button
// //                           type="text"
// //                           danger
// //                           size="small"
// //                           icon={<DeleteOutlined />}
// //                           onClick={() => handleRemoveItem(index)}
// //                           disabled={isLoading}
// //                         >
// //                           Remove
// //                         </Button>
// //                       )}
// //                     </div>

// //                     {/* Row 1: Category and Date */}
// //                     <Row gutter={12} style={{ marginBottom: 10 }}>
// //                       <Col span={12}>
// //                         <Form.Item
// //                           label={
// //                             <span style={{ fontSize: 12 }}>
// //                               Category <span style={{ color: "#ff4d4f" }}>*</span>
// //                             </span>
// //                           }
// //                           required={false}
// //                           style={{ marginBottom: 0 }}
// //                         >
// //                           <Select
// //                             placeholder={loadingLimits ? "Loading categories..." : "Select"}
// //                             value={item.category || undefined}
// //                             onChange={(value) => {
// //                               handleItemChange(index, "category", value);
// //                               if (item.amount) {
// //                                 const error = validateAmount(value, item.amount);
// //                                 if (error) {
// //                                   api.warning({
// //                                     message: "Limit Warning",
// //                                     description: error,
// //                                     placement: "bottomRight",
// //                                     duration: 3,
// //                                   });
// //                                 }
// //                               }
// //                             }}
// //                             options={categoryOptions}
// //                             style={{ width: "100%" }}
// //                             size="small"
// //                             disabled={isLoading || loadingLimits}
// //                             showSearch
// //                             filterOption={(input, option) =>
// //                               (option?.label ?? "")
// //                                 .toLowerCase()
// //                                 .includes(input.toLowerCase())
// //                             }
// //                             loading={loadingLimits}
// //                           />
// //                         </Form.Item>
// //                       </Col>
// //                       <Col span={12}>
// //                         <Form.Item
// //                           label={
// //                             <span style={{ fontSize: 12 }}>
// //                               Date <span style={{ color: "#ff4d4f" }}>*</span>
// //                             </span>
// //                           }
// //                           required={false}
// //                           style={{ marginBottom: 0 }}
// //                         >
// //                           <DatePicker
// //                             style={{ width: "100%" }}
// //                             placeholder="Select"
// //                             value={item.date ? dayjs(item.date) : null}
// //                             onChange={(date) =>
// //                               handleItemChange(index, "date", date ? date.toISOString() : null)
// //                             }
// //                             format="DD-MM-YYYY"
// //                             size="small"
// //                             disabled={isLoading}
// //                             disabledDate={(current) =>
// //                               current && current > dayjs().endOf("day")
// //                             }
// //                           />
// //                         </Form.Item>
// //                       </Col>
// //                     </Row>

// //                     {/* Row 2: Bill No and Amount */}
// //                     <Row gutter={12} style={{ marginBottom: 10 }}>
// //                       <Col span={12}>
// //                         <Form.Item
// //                           label={
// //                             <span style={{ fontSize: 12 }}>
// //                               Bill No <span style={{ color: "#ff4d4f" }}>*</span>
// //                             </span>
// //                           }
// //                           required={false}
// //                           style={{ marginBottom: 0 }}
// //                         >
// //                           <Input
// //                             placeholder="Enter bill no"
// //                             value={item.billNo}
// //                             onChange={(e) =>
// //                               handleItemChange(index, "billNo", e.target.value)
// //                             }
// //                             size="small"
// //                             disabled={isLoading}
// //                           />
// //                         </Form.Item>
// //                       </Col>
// //                       <Col span={12}>
// //                         <Form.Item
// //                           label={
// //                             <span style={{ fontSize: 12 }}>
// //                               Amount (₹) <span style={{ color: "#ff4d4f" }}>*</span>
// //                             </span>
// //                           }
// //                           required={false}
// //                           style={{ marginBottom: 0 }}
// //                           validateStatus={amountError ? "error" : undefined}
// //                           help={amountError}
// //                         >
// //                           <Input
// //                             type="number"
// //                             placeholder="Enter amount"
// //                             value={item.amount || undefined}
// //                             onChange={(e) =>
// //                               handleItemChange(
// //                                 index,
// //                                 "amount",
// //                                 e.target.value ? parseFloat(e.target.value) : null
// //                               )
// //                             }
// //                             prefix="₹"
// //                             min={0}
// //                             step={0.01}
// //                             size="small"
// //                             disabled={isLoading}
// //                             status={amountError ? "error" : undefined}
// //                           />
// //                         </Form.Item>
// //                       </Col>
// //                     </Row>

// //                     {/* Row 3: Description */}
// //                     <Form.Item
// //                       label={
// //                         <span style={{ fontSize: 12 }}>
// //                           Description <span style={{ color: "#ff4d4f" }}>*</span>
// //                         </span>
// //                       }
// //                       required={false}
// //                       style={{ marginBottom: 10 }}
// //                     >
// //                       <TextArea
// //                         rows={2}
// //                         placeholder="Describe expense details..."
// //                         value={item.description}
// //                         onChange={(e) =>
// //                           handleItemChange(index, "description", e.target.value)
// //                         }
// //                         size="small"
// //                         disabled={isLoading}
// //                       />
// //                     </Form.Item>

// //                     {/* Row 4: Attachments */}
// //                     <Form.Item
// //                       label={
// //                         <span style={{ fontSize: 12 }}>
// //                           Attachments
// //                           <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
// //                             {!reimbursementId ? "(Required - at least one)" : "(Optional - add new attachments)"}
// //                           </Text>
// //                         </span>
// //                       }
// //                       style={{ marginBottom: 0 }}
// //                     >
// //                       <Space direction="vertical" size={8} style={{ width: "100%" }}>
// //                         <AttachmentUploader
// //                           onUpload={(base64File, fileName) =>
// //                             handleFileUpload(index, base64File, fileName)
// //                           }
// //                           maxSize={5}
// //                           accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
// //                           disabled={isLoading}
// //                         />

// //                         {item.attachments.length > 0 && (
// //                           <div style={{ marginTop: 8 }}>
// //                             <Text type="secondary" style={{ fontSize: 11 }}>
// //                               New attachments added:
// //                             </Text>
// //                             {item.attachments.map((file, fileIndex) => (
// //                               <div
// //                                 key={`${file.fileName}_${fileIndex}`}
// //                                 style={{
// //                                   display: "flex",
// //                                   alignItems: "center",
// //                                   justifyContent: "space-between",
// //                                   padding: "4px 8px",
// //                                   border: "1px solid #e8e8e8",
// //                                   borderRadius: 4,
// //                                   marginBottom: 4,
// //                                   backgroundColor: "#fff",
// //                                 }}
// //                               >
// //                                 <span style={{ fontSize: 12 }}>{file.fileName}</span>
// //                                 <Space size={4}>
// //                                   <Button
// //                                     size="small"
// //                                     type="text"
// //                                     icon={<EyeOutlined />}
// //                                     onClick={() => handleViewFile(file)}
// //                                     disabled={isLoading}
// //                                   />
// //                                   <Button
// //                                     size="small"
// //                                     type="text"
// //                                     danger
// //                                     icon={<DeleteOutlined />}
// //                                     onClick={() => handleDeleteAttachment(index, file)}
// //                                     disabled={isLoading}
// //                                   />
// //                                 </Space>
// //                               </div>
// //                             ))}
// //                           </div>
// //                         )}

// //                         {/* Show message for existing attachments */}
// //                         {reimbursementId && item.attachments.length === 0 && (
// //                           <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
// //                             Existing attachments are preserved. Upload new files to add more.
// //                           </Text>
// //                         )}
// //                       </Space>
// //                     </Form.Item>
// //                   </div>
// //                 );
// //               })}

// //               {/* Add Item Button */}
// //               <Button
// //                 type="dashed"
// //                 icon={<PlusOutlined />}
// //                 onClick={handleAddItem}
// //                 style={{ width: "100%", marginTop: 4 }}
// //                 size="small"
// //                 disabled={isLoading}
// //               >
// //                 Add Another Expense
// //               </Button>
// //             </div>

// //             {/* Total Amount Display */}
// //             <div
// //               style={{
// //                 padding: "10px 14px",
// //                 backgroundColor: "#f0f5ff",
// //                 borderRadius: 6,
// //                 border: "1px solid #adc6ff",
// //                 display: "flex",
// //                 justifyContent: "space-between",
// //                 alignItems: "center",
// //               }}
// //             >
// //               <Text strong style={{ fontSize: 13 }}>
// //                 Total Amount:
// //               </Text>
// //               {/* <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: 600 }}>
// //                 ₹{getTotalAmount().toFixed(2)}
// //               </Text> */}
// //               <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: 600 }}>
// //   ₹{(() => {
// //     const total = getTotalAmount();
// //     return Number(total).toFixed(2);
// //   })()}
// // </Text>
// //             </div>
// //           </div>

// //           {/* Fixed Footer */}
// //           <div
// //             style={{
// //               display: "flex",
// //               justifyContent: "flex-end",
// //               gap: "12px",
// //               borderTop: "1px solid #e8e8e8",
// //               paddingTop: 16,
// //               flexShrink: 0,
// //               backgroundColor: "#fff",
// //             }}
// //           >
// //             <Button
// //               onClick={handleSaveDraft}
// //               loading={isLoading}
// //               icon={<SaveOutlined />}
// //               size="middle"
// //               disabled={isLoading}
// //             >
// //               {reimbursementId ? 'Update Draft' : 'Save Draft'}
// //             </Button>
// //             <Button
// //               onClick={() => router.push("/reimbursements/view")}
// //               size="middle"
// //               disabled={isLoading}
// //             >
// //               Cancel
// //             </Button>
// //             <Button
// //               type="primary"
// //               onClick={handleSubmit}
// //               loading={isLoading}
// //               size="middle"
// //             >
// //               {reimbursementId ? 'Update & Submit' : 'Submit'}
// //             </Button>
// //           </div>
// //         </Form>
// //       </Card>
// //     </div>
// //   );
// // }
// function CreateReimbursementContent({ user, reimbursementId }: CreateReimbursementContentProps) {
//   const router = useRouter();
//   const [form] = Form.useForm();
//   const [api, contextHolder] = notification.useNotification();

//   // State for loading existing reimbursement
//   const [loadingReimbursement, setLoadingReimbursement] = useState(!!reimbursementId);

//   // ===== Category limits state =====
//   const [loadingLimits, setLoadingLimits] = useState(true);
//   const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryError, setCategoryError] = useState<string | null>(null);

//   // Use the create and update mutation hooks
//   const createMutation = useCreateReimbursement();
//   const updateMutation = useUpdateReimbursement();

//   // Fetch reimbursement data if editing
//   const {
//     data: existingReimbursement,
//     isLoading: fetchingReimbursement,
//     refetch: refetchReimbursement
//   } = useReimbursementById(reimbursementId || '');

//   // State for multiple reimbursement items
//   const [reimbursementItems, setReimbursementItems] = useState<ReimbursementItem[]>([
//     {
//       id: `item_${Date.now()}_0`,
//       category: "",
//       date: null,
//       billNo: "",
//       amount: null,
//       description: "",
//       attachments: [],
//     },
//   ]);

//   // Track all files for upload
//   const [allFiles, setAllFiles] = useState<File[]>([]);

//   // Track existing attachments to preserve them
//   const [existingAttachments, setExistingAttachments] = useState<Map<string, any[]>>(new Map());

//   // ===== Load category limits on page load =====
//   useEffect(() => {
//     loadCategoryLimits();
//   }, []);
//   // In your useEffect that loads the reimbursement
// useEffect(() => {
//   if (existingReimbursement && reimbursementId) {
//     console.log('📝 RAW existingReimbursement:', JSON.stringify(existingReimbursement, null, 2));
//     console.log('📎 Items with attachments:', existingReimbursement.items?.map((item: any) => ({
//       category: item.category,
//       attachments: item.attachments
//     })));

//     loadReimbursementData(existingReimbursement);
//     setLoadingReimbursement(false);
//   }
// }, [existingReimbursement, reimbursementId]);

//   // ===== Load existing reimbursement data when editing =====
//   useEffect(() => {
//     if (existingReimbursement && reimbursementId) {
//       console.log('📝 Loading existing reimbursement:', existingReimbursement);
//       loadReimbursementData(existingReimbursement);
//       setLoadingReimbursement(false);
//     }
//   }, [existingReimbursement, reimbursementId]);

//   // const loadReimbursementData = (data: any) => {
//   //   console.log('Loading reimbursement data:', data);

//   //   if (!data || !data.items || data.items.length === 0) {
//   //     console.log('No items found in reimbursement data');
//   //     return;
//   //   }

//   //   // Create a map of existing attachments by item ID
//   //   const attachmentsMap = new Map();

//   //   // Transform the API response to match our component state
//   //   const items: ReimbursementItem[] = data.items.map((item: any, index: number) => {
//   //     console.log(`Processing item ${index}:`, item);

//   //     // Store existing attachments in the map
//   //     if (item.attachments && item.attachments.length > 0) {
//   //       attachmentsMap.set(item.id, item.attachments);
//   //     }

//   //     return {
//   //       id: `item_${Date.now()}_${index}`,
//   //       category: item.category || '',
//   //       date: item.date || null,
//   //       billNo: item.billNo || '',
//   //       amount: item.amount || null,
//   //       description: item.description || '',
//   //       attachments: [], // Start with empty attachments for new uploads
//   //     };
//   //   });

//   //   console.log('Transformed items:', items);
//   //   setReimbursementItems(items);
//   //   setExistingAttachments(attachmentsMap);

//   //   // Update form fields
//   //   form.setFieldsValue({
//   //     items: items
//   //   });
//   // };
// const loadReimbursementData = (data: any) => {
//   console.log('Loading reimbursement data:', data);

//   if (!data || !data.items || data.items.length === 0) {
//     console.log('No items found in reimbursement data');
//     return;
//   }

//   // Transform the API response to match our component state
//   const items: ReimbursementItem[] = data.items.map((item: any, index: number) => {
//     console.log(`Processing item ${index}:`, item);

//     // Convert existing attachments to UploadedFile format
//     const existingFiles: UploadedFile[] = (item.attachments || []).map((att: any) => ({
//       base64: att.fileUrl, // Use fileUrl for preview
//       fileName: att.fileName,
//       fileType: att.fileType || att.fileName.split('.').pop() || 'unknown',
//       file: undefined, // No File object for existing attachments
//     }));

//     return {
//       id: `item_${Date.now()}_${index}`,
//       category: item.category || '',
//       date: item.date || null,
//       billNo: item.billNo || '',
//       amount: item.amount || null,
//       description: item.description || '',
//       attachments: existingFiles, // ✅ Load existing attachments here!
//     };
//   });

//   console.log('Transformed items with attachments:', items);
//   setReimbursementItems(items);

//   // Update form fields
//   form.setFieldsValue({
//     items: items
//   });
// };
//   const loadCategoryLimits = async () => {
//     try {
//       setLoadingLimits(true);
//       setCategoryError(null);

//       const limits = await ReimbursementService.getUserCategoryLimits();

//       console.log('✅ Loaded category limits:', limits);

//       if (limits && limits.length > 0) {
//         setCategoryLimits(limits);

//         const options: CategoryOption[] = limits.map(limit => ({
//           value: limit.categoryId,
//           label: limit.categoryId,
//           maxAmount: limit.maxAmount,
//           periodType: limit.periodType
//         }));

//         setCategoryOptions(options);

//         if (limits.length > 0) {
//           await loadCategoryNames(limits);
//         }
//       } else {
//         console.log('No category limits found for this user');
//         setCategoryLimits([]);
//         setCategoryOptions([]);

//         api.info({
//           message: "No Limits Found",
//           description: "No reimbursement policies are configured for your position",
//           placement: "bottomRight",
//           duration: 4,
//         });
//       }

//     } catch (error: any) {
//       console.error('Failed to load category limits:', error);
//       setCategoryError(error.message || 'Failed to load category limits');
//       setCategoryLimits([]);
//       setCategoryOptions([]);
//     } finally {
//       setLoadingLimits(false);
//     }
//   };

//   const loadCategoryNames = async (limits: CategoryLimit[]) => {
//     try {
//       const categoryIds = limits.map(limit => limit.categoryId);

//       const response = await fetch('/api/reimbursement-categories/by-ids', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ ids: categoryIds })
//       });

//       const result = await response.json();

//       if (result.success) {
//         const categories = result.data;

//         const options: CategoryOption[] = limits.map(limit => {
//           const category = categories.find((c: any) => c.id === limit.categoryId);
//           return {
//             value: limit.categoryId,
//             label: category?.name || limit.categoryId,
//             maxAmount: limit.maxAmount,
//             periodType: limit.periodType
//           };
//         });

//         setCategoryOptions(options);
//       }
//     } catch (error) {
//       console.error('Failed to load category names:', error);
//     }
//   };

//   // Get max amount for a category
//   const getMaxAmountForCategory = (categoryId: string): number => {
//     const option = categoryOptions.find(opt => opt.value === categoryId);
//     return option?.maxAmount || 0;
//   };

//   // Get period type for a category
//   const getPeriodTypeForCategory = (categoryId: string): string => {
//     const option = categoryOptions.find(opt => opt.value === categoryId);
//     return option?.periodType || 'MONTH';
//   };

//   // Validate amount against category limit
//   const validateAmount = (categoryId: string, amount: number | null): string | null => {
//     if (!categoryId || !amount) return null;

//     const maxAmount = getMaxAmountForCategory(categoryId);
//     if (amount > maxAmount) {
//       const periodType = getPeriodTypeForCategory(categoryId).toLowerCase();
//       return `Amount exceeds limit of ₹${maxAmount} per ${periodType}`;
//     }
//     return null;
//   };

//   // Handle Add Item
//   const handleAddItem = () => {
//     setReimbursementItems([
//       ...reimbursementItems,
//       {
//         id: `item_${Date.now()}_${reimbursementItems.length}`,
//         category: "",
//         date: null,
//         billNo: "",
//         amount: null,
//         description: "",
//         attachments: [],
//       },
//     ]);
//   };

//   // Handle Remove Item
//   const handleRemoveItem = (index: number) => {
//     if (reimbursementItems.length === 1) {
//       api.warning({
//         message: "Warning",
//         description: "At least one reimbursement item is required",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return;
//     }

//     const itemToRemove = reimbursementItems[index];
//     const filesToRemove = itemToRemove.attachments.map(att => att.fileName);
//     setAllFiles(prev => prev.filter(file => !filesToRemove.includes(file.name)));

//     const newItems = reimbursementItems.filter((_, i) => i !== index);
//     setReimbursementItems(newItems);
//   };

//   // Handle Field Change
//   const handleItemChange = (
//     index: number,
//     field: keyof ReimbursementItem,
//     value: any
//   ) => {
//     const newItems = [...reimbursementItems];

//     // If field is 'amount', ensure it's stored as a number
//     if (field === 'amount') {
//       (newItems[index][field] as any) = value ? Number(value) : null;
//     } else {
//       (newItems[index][field] as any) = value;
//     }

//     setReimbursementItems(newItems);
//   };

//   // Handle File Upload
//   const handleFileUpload = async (index: number, base64File: string, fileName: string) => {
//     try {
//       const response = await fetch(base64File);
//       const blob = await response.blob();
//       const file = new File([blob], fileName, { type: blob.type });

//       setAllFiles(prev => [...prev, file]);

//       const newFile: UploadedFile = {
//         base64: base64File,
//         fileName: fileName,
//         fileType: fileName.split('.').pop() || 'unknown',
//         file: file,
//       };

//       const newItems = [...reimbursementItems];
//       newItems[index].attachments.push(newFile);
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File uploaded successfully",
//         placement: "bottomRight",
//         duration: 2,
//       });
//     } catch (error) {
//       console.error("File upload error:", error);
//       api.error({
//         message: "Error",
//         description: "Failed to upload file",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Handle Delete Attachment
//   const handleDeleteAttachment = async (itemIndex: number, fileToDelete: UploadedFile) => {
//     try {
//       if (fileToDelete.file) {
//         setAllFiles(prev => prev.filter(f => f.name !== fileToDelete.fileName));
//       }

//       const newItems = [...reimbursementItems];
//       newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
//         (file) => file.fileName !== fileToDelete.fileName
//       );
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File deleted successfully",
//         placement: "bottomRight",
//         duration: 2,
//       });
//     } catch (error) {
//       console.error("File delete error:", error);
//       api.error({
//         message: "Error",
//         description: "Failed to delete file",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Validate Form
//   const validateForm = () => {
//     const totalAttachments = reimbursementItems.reduce(
//       (sum, item) => sum + item.attachments.length,
//       0
//     );

//     // For new submissions, require at least one attachment
//     if (!reimbursementId && totalAttachments === 0) {
//       api.error({
//         message: "Validation Error",
//         description: "Please upload at least one attachment",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return false;
//     }

//     for (let i = 0; i < reimbursementItems.length; i++) {
//       const item = reimbursementItems[i];

//       if (!item.category) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a category`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.date) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a date`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.billNo?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter bill number`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.amount || item.amount <= 0) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a valid amount`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       const amountError = validateAmount(item.category, item.amount);
//       if (amountError) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: ${amountError}`,
//           placement: "bottomRight",
//           duration: 4,
//         });
//         return false;
//       }

//       if (!item.description?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a description`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }
//     }

//     return true;
//   };

//   // Transform items to match backend format
//   const transformItemsForBackend = () => {
//     return reimbursementItems.map(item => ({
//       category: item.category,
//       date: item.date,
//       billNo: item.billNo,
//       amount: item.amount ? Number(item.amount) : 0,
//       description: item.description,
//     }));
//   };

//   // Handle Save Draft
//   const handleSaveDraft = async () => {
//     if (!validateForm()) return;

//     try {
//       const itemsData = transformItemsForBackend();

//       if (reimbursementId) {
//         // Update existing draft
//         await updateMutation.mutateAsync({
//           id: reimbursementId,
//           data: {
//             items: itemsData,
//             status: REIMBURSEMENT_STATUS.DRAFT
//           },
//           files: allFiles
//         });

//         api.success({
//           message: "Success",
//           description: "Draft updated successfully",
//           placement: "bottomRight",
//           duration: 2,
//         });
//       } else {
//         // Create new draft
//         await createMutation.mutateAsync({
//           items: itemsData,
//           files: allFiles,
//           status: REIMBURSEMENT_STATUS.DRAFT
//         });

//         api.success({
//           message: "Success",
//           description: "Reimbursement saved as draft",
//           placement: "bottomRight",
//           duration: 2,
//         });
//       }

//       setTimeout(() => {
//         router.push("/reimbursements/view");
//       }, 1000);

//     } catch (error: any) {
//       console.error("Save draft error:", error);
//       api.error({
//         message: "Error",
//         description: error?.message || "Failed to save draft",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Handle Submit
//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     try {
//       const itemsData = transformItemsForBackend();

//       console.log('📦 REIMBURSEMENT PAYLOAD:');
//       console.log('Items:', JSON.stringify(itemsData, null, 2));
//       console.log('New Files:', allFiles.map(f => ({
//         name: f.name,
//         size: f.size,
//         type: f.type
//       })));
//       console.log('Status:', REIMBURSEMENT_STATUS.SUBMITTED);

//       let result;
//       if (reimbursementId) {
//         // Update existing and submit
//         result = await updateMutation.mutateAsync({
//           id: reimbursementId,
//           data: {
//             items: itemsData,
//             status: REIMBURSEMENT_STATUS.SUBMITTED
//           },
//           files: allFiles
//         });

//         console.log('✅ Update successful, result:', result);

//         api.success({
//           message: "Success",
//           description: "Reimbursement updated and submitted successfully!",
//           placement: "bottomRight",
//           duration: 2,
//         });
//       } else {
//         // Create new and submit
//         result = await createMutation.mutateAsync({
//           items: itemsData,
//           files: allFiles,
//           status: REIMBURSEMENT_STATUS.SUBMITTED
//         });

//         api.success({
//           message: "Success",
//           description: "Reimbursement submitted successfully!",
//           placement: "bottomRight",
//           duration: 2,
//         });
//       }

//     } catch (error: any) {
//       console.error('❌ Submit error:', error);
//       api.error({
//         message: "Error",
//         description: error?.message || "Failed to submit reimbursement",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Calculate Total Amount
//   const getTotalAmount = () => {
//     return reimbursementItems.reduce((sum, item) => {
//       const amount = typeof item.amount === 'string'
//         ? parseFloat(item.amount) || 0
//         : (typeof item.amount === 'number' && !isNaN(item.amount) ? item.amount : 0);
//       return sum + amount;
//     }, 0);
//   };

//   // Helper to view file
//   const handleViewFile = (file: UploadedFile) => {
//     if (file.base64) {
//       window.open(file.base64, '_blank');
//     }
//   };

//   const isLoading = createMutation.isPending || updateMutation.isPending || loadingLimits || loadingReimbursement || fetchingReimbursement;

//   // Show loading spinner while fetching data
//   if (fetchingReimbursement && reimbursementId) {
//     return (
//       <MainLayout>
//         <LoadingSpinner message="Loading reimbursement data..." />
//       </MainLayout>
//     );
//   }

//   return (
//     <div
//       style={{
//         maxWidth: 900,
//         margin: "0 auto",
//         padding: "24px 16px",
//         height: "calc(100vh - 64px)",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       {contextHolder}

//       {/* Header */}
//       <div style={{ marginBottom: 16, flexShrink: 0 }}>
//         <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
//           {reimbursementId ? 'Edit Reimbursement Request' : 'Create Reimbursement Request'}
//         </Title>
//         <Text type="secondary" style={{ fontSize: 13 }}>
//           {new Date().toLocaleDateString("en-US", {
//             weekday: "long",
//             month: "long",
//             day: "numeric",
//             year: "numeric",
//           })}
//         </Text>
//         {reimbursementId && existingReimbursement && (
//           <div style={{ marginTop: 8 }}>
//             <Tag color={existingReimbursement.status === 'DRAFT' ? 'default' : 'blue'}>
//               Status: {existingReimbursement.status}
//             </Tag>
//           </div>
//         )}
//       </div>

//       {/* Category Limits Summary */}
//       {!loadingLimits && categoryOptions.length > 0 && (
//         <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
//           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//             <Text strong>Your Reimbursement Limits:</Text>
//             <Space size={16} wrap>
//               {categoryOptions.map(opt => (
//                 <Text key={opt.value} style={{ fontSize: 12 }}>
//                   {opt.label}: ₹{opt.maxAmount}/{opt.periodType.toLowerCase()}
//                 </Text>
//               ))}
//             </Space>
//           </div>
//         </Card>
//       )}

//       {/* Error Alert */}
//       {categoryError && (
//         <Alert
//           message="Error Loading Limits"
//           description={categoryError}
//           type="error"
//           showIcon
//           style={{ marginBottom: 16 }}
//         />
//       )}

//       {/* Form Card */}
//       <Card
//         style={{
//           boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//           borderRadius: 8,
//           border: "1px solid #e8e8e8",
//           flex: 1,
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}
//         styles={{ body: {
//           padding: "16px 20px",
//           flex: 1,
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//           }}
//         >
//           {/* Scrollable Content Area */}
//           <div style={{
//             flex: 1,
//             overflowY: "auto",
//             paddingRight: 8,
//             marginBottom: 16,
//           }}>
//             {/* Reimbursement Items Section */}
//             <div style={{ marginBottom: 16 }}>
//               <Text
//                 strong
//                 style={{ fontSize: 15, display: "block", marginBottom: 12 }}
//               >
//                 Reimbursement Items
//               </Text>

//               {reimbursementItems.map((item, index) => {
//                 const amountError = item.category && item.amount
//                   ? validateAmount(item.category, item.amount)
//                   : null;

//                 // Get existing attachments for this item (if any)
//                 const existingItemAttachments = existingReimbursement?.items[index]?.attachments || [];

//                 return (
//                   <div
//                     key={item.id}
//                     style={{
//                       border: "1px solid #e8e8e8",
//                       borderRadius: 6,
//                       padding: "12px 14px",
//                       marginBottom: 12,
//                       backgroundColor: "#fafafa",
//                       position: "relative",
//                     }}
//                   >
//                     {/* Item Header */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
//                         Expense #{index + 1}
//                       </Text>
//                       {reimbursementItems.length > 1 && (
//                         <Button
//                           type="text"
//                           danger
//                           size="small"
//                           icon={<DeleteOutlined />}
//                           onClick={() => handleRemoveItem(index)}
//                           disabled={isLoading}
//                         >
//                           Remove
//                         </Button>
//                       )}
//                     </div>

//                     {/* Row 1: Category and Date */}
//                     <Row gutter={12} style={{ marginBottom: 10 }}>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Category <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <Select
//                             placeholder={loadingLimits ? "Loading categories..." : "Select"}
//                             value={item.category || undefined}
//                             onChange={(value) => {
//                               handleItemChange(index, "category", value);
//                               if (item.amount) {
//                                 const error = validateAmount(value, item.amount);
//                                 if (error) {
//                                   api.warning({
//                                     message: "Limit Warning",
//                                     description: error,
//                                     placement: "bottomRight",
//                                     duration: 3,
//                                   });
//                                 }
//                               }
//                             }}
//                             options={categoryOptions}
//                             style={{ width: "100%" }}
//                             size="small"
//                             disabled={isLoading || loadingLimits}
//                             showSearch
//                             filterOption={(input, option) =>
//                               (option?.label ?? "")
//                                 .toLowerCase()
//                                 .includes(input.toLowerCase())
//                             }
//                             loading={loadingLimits}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Date <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <DatePicker
//                             style={{ width: "100%" }}
//                             placeholder="Select"
//                             value={item.date ? dayjs(item.date) : null}
//                             onChange={(date) =>
//                               handleItemChange(index, "date", date ? date.toISOString() : null)
//                             }
//                             format="DD-MM-YYYY"
//                             size="small"
//                             disabled={isLoading}
//                             disabledDate={(current) =>
//                               current && current > dayjs().endOf("day")
//                             }
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     {/* Row 2: Bill No and Amount */}
//                     <Row gutter={12} style={{ marginBottom: 10 }}>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Bill No <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <Input
//                             placeholder="Enter bill no"
//                             value={item.billNo}
//                             onChange={(e) =>
//                               handleItemChange(index, "billNo", e.target.value)
//                             }
//                             size="small"
//                             disabled={isLoading}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Amount (₹) <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                           validateStatus={amountError ? "error" : undefined}
//                           help={amountError}
//                         >
//                           <Input
//                             type="number"
//                             placeholder="Enter amount"
//                             value={item.amount || undefined}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 index,
//                                 "amount",
//                                 e.target.value ? parseFloat(e.target.value) : null
//                               )
//                             }
//                             prefix="₹"
//                             min={0}
//                             step={0.01}
//                             size="small"
//                             disabled={isLoading}
//                             status={amountError ? "error" : undefined}
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     {/* Row 3: Description */}
//                     <Form.Item
//                       label={
//                         <span style={{ fontSize: 12 }}>
//                           Description <span style={{ color: "#ff4d4f" }}>*</span>
//                         </span>
//                       }
//                       required={false}
//                       style={{ marginBottom: 10 }}
//                     >
//                       <TextArea
//                         rows={2}
//                         placeholder="Describe expense details..."
//                         value={item.description}
//                         onChange={(e) =>
//                           handleItemChange(index, "description", e.target.value)
//                         }
//                         size="small"
//                         disabled={isLoading}
//                       />
//                     </Form.Item>

//                     {/* Row 4: Attachments */}
//                     {/* <Form.Item
//                       label={
//                         <span style={{ fontSize: 12 }}>
//                           Attachments
//                           <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
//                             {!reimbursementId ? "(Required - at least one)" : "(Optional - add new attachments)"}
//                           </Text>
//                         </span>
//                       }
//                       style={{ marginBottom: 0 }}
//                     >
//                       <Space direction="vertical" size={8} style={{ width: "100%" }}>
//                         <AttachmentUploader
//                           onUpload={(base64File, fileName) =>
//                             handleFileUpload(index, base64File, fileName)
//                           }
//                           maxSize={5}
//                           accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
//                           disabled={isLoading}
//                         />

//                         {existingItemAttachments.length > 0 && (
//                           <div style={{ marginTop: 8 }}>
//                             <Text type="secondary" style={{ fontSize: 11 }}>
//                               Existing attachments:
//                             </Text>
//                             {existingItemAttachments.map((file: any, fileIndex: number) => (
//                               <div
//                                 key={`existing_${file.id}`}
//                                 style={{
//                                   display: "flex",
//                                   alignItems: "center",
//                                   justifyContent: "space-between",
//                                   padding: "4px 8px",
//                                   border: "1px solid #e8e8e8",
//                                   borderRadius: 4,
//                                   marginBottom: 4,
//                                   backgroundColor: "#f9f9f9",
//                                 }}
//                               >
//                                 <span style={{ fontSize: 12 }}>{file.fileName}</span>
//                                 <Button
//                                   size="small"
//                                   type="text"
//                                   icon={<EyeOutlined />}
//                                   onClick={() => window.open(file.fileUrl, '_blank')}
//                                   disabled={isLoading}
//                                 />
//                               </div>
//                             ))}
//                           </div>
//                         )}

//                         {item.attachments.length > 0 && (
//                           <div style={{ marginTop: 8 }}>
//                             <Text type="secondary" style={{ fontSize: 11 }}>
//                               New attachments added:
//                             </Text>
//                             {item.attachments.map((file, fileIndex) => (
//                               <div
//                                 key={`${file.fileName}_${fileIndex}`}
//                                 style={{
//                                   display: "flex",
//                                   alignItems: "center",
//                                   justifyContent: "space-between",
//                                   padding: "4px 8px",
//                                   border: "1px solid #e8e8e8",
//                                   borderRadius: 4,
//                                   marginBottom: 4,
//                                   backgroundColor: "#fff",
//                                 }}
//                               >
//                                 <span style={{ fontSize: 12 }}>{file.fileName}</span>
//                                 <Space size={4}>
//                                   <Button
//                                     size="small"
//                                     type="text"
//                                     icon={<EyeOutlined />}
//                                     onClick={() => handleViewFile(file)}
//                                     disabled={isLoading}
//                                   />
//                                   <Button
//                                     size="small"
//                                     type="text"
//                                     danger
//                                     icon={<DeleteOutlined />}
//                                     onClick={() => handleDeleteAttachment(index, file)}
//                                     disabled={isLoading}
//                                   />
//                                 </Space>
//                               </div>
//                             ))}
//                           </div>
//                         )}
//                       </Space>
//                     </Form.Item> */}
//                     {/* Row 4: Attachments */}
// <Form.Item
//   label={
//     <span style={{ fontSize: 12 }}>
//       Attachments
//       <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
//         {!reimbursementId ? "(Required - at least one)" : "(Upload new files to add more)"}
//       </Text>
//     </span>
//   }
//   style={{ marginBottom: 0 }}
// >
//   <Space direction="vertical" size={8} style={{ width: "100%" }}>
//     <AttachmentUploader
//       onUpload={(base64File, fileName) =>
//         handleFileUpload(index, base64File, fileName)
//       }
//       maxSize={5}
//       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
//       disabled={isLoading}
//     />

//     {/* Show ALL attachments (existing + new) */}
//     {item.attachments.length > 0 && (
//       <div style={{ marginTop: 8 }}>
//         <Text type="secondary" style={{ fontSize: 11 }}>
//           {reimbursementId ? 'Current Attachments:' : 'Attachments:'}
//         </Text>
//         {item.attachments.map((file, fileIndex) => {
//           // Check if this is an existing attachment (no file object) or new one
//           const isExisting = !file.file;

//           return (
//             <div
//               key={`${file.fileName}_${fileIndex}_${isExisting ? 'existing' : 'new'}`}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "4px 8px",
//                 border: "1px solid #e8e8e8",
//                 borderRadius: 4,
//                 marginBottom: 4,
//                 backgroundColor: isExisting ? "#f9f9f9" : "#fff",
//               }}
//             >
//               <span style={{ fontSize: 12 }}>{file.fileName}</span>
//               <Space size={4}>
//                 <Button
//                   size="small"
//                   type="text"
//                   icon={<EyeOutlined />}
//                   onClick={() => {
//                     if (isExisting) {
//                       // For existing attachments, open the URL
//                       window.open(file.base64, '_blank');
//                     } else {
//                       // For new attachments, open the base64
//                       handleViewFile(file);
//                     }
//                   }}
//                   disabled={isLoading}
//                 />
//                 {!isExisting && ( // Only show delete for new attachments
//                   <Button
//                     size="small"
//                     type="text"
//                     danger
//                     icon={<DeleteOutlined />}
//                     onClick={() => handleDeleteAttachment(index, file)}
//                     disabled={isLoading}
//                   />
//                 )}
//               </Space>
//             </div>
//           );
//         })}
//       </div>
//     )}
//   </Space>
// </Form.Item>
//                   </div>
//                 );
//               })}

//               {/* Add Item Button */}
//               <Button
//                 type="dashed"
//                 icon={<PlusOutlined />}
//                 onClick={handleAddItem}
//                 style={{ width: "100%", marginTop: 4 }}
//                 size="small"
//                 disabled={isLoading}
//               >
//                 Add Another Expense
//               </Button>
//             </div>

//             {/* Total Amount Display */}
//             <div
//               style={{
//                 padding: "10px 14px",
//                 backgroundColor: "#f0f5ff",
//                 borderRadius: 6,
//                 border: "1px solid #adc6ff",
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text strong style={{ fontSize: 13 }}>
//                 Total Amount:
//               </Text>
//               <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: 600 }}>
//                 ₹{(() => {
//                   const total = getTotalAmount();
//                   return Number(total).toFixed(2);
//                 })()}
//               </Text>
//             </div>
//           </div>

//           {/* Fixed Footer */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: "12px",
//               borderTop: "1px solid #e8e8e8",
//               paddingTop: 16,
//               flexShrink: 0,
//               backgroundColor: "#fff",
//             }}
//           >
//             <Button
//               onClick={handleSaveDraft}
//               loading={isLoading}
//               icon={<SaveOutlined />}
//               size="middle"
//               disabled={isLoading}
//             >
//               {reimbursementId ? 'Update Draft' : 'Save Draft'}
//             </Button>
//             <Button
//               onClick={() => router.push("/reimbursements/view")}
//               size="middle"
//               disabled={isLoading}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="primary"
//               onClick={handleSubmit}
//               loading={isLoading}
//               size="middle"
//             >
//               {reimbursementId ? 'Update & Submit' : 'Submit'}
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </div>
//   );
// }

// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Card,
//   Form,
//   Button,
//   Select,
//   Input,
//   Space,
//   Typography,
//   notification,
//   DatePicker,
//   Row,
//   Col,
//   Alert,
//   Tag,
// } from "antd";
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   SaveOutlined,
//   EyeOutlined,
//   ArrowLeftOutlined,
// } from "@ant-design/icons";
// import { useRouter, useSearchParams } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import MainLayout from "@/components/layout/MainLayout";
// import LoadingSpinner from "@/components/common/LoadingSpinner";
// import AttachmentUploader from "@/components/common/AttachmentUploader";
// import dayjs from "dayjs";
// import {
//   useCreateReimbursement,
//   useReimbursementById,
//   useUpdateReimbursement,
// } from "@/hooks/usereimbursementcreate";
// import {
//   ReimbursementService,
//   CategoryLimit,
// } from "@/services/reimbursementcreateService";

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// // Status enum matching backend
// const REIMBURSEMENT_STATUS = {
//   DRAFT: "DRAFT",
//   SUBMITTED: "SUBMITTED",
// } as const;

// // File interface for preview
// interface UploadedFile {
//   base64: string;
//   fileName: string;
//   fileType: string;
//   file?: File;
// }

// // Reimbursement Item Interface
// interface ReimbursementItem {
//   id: string;
//   category: string;
//   date: string | null;
//   billNo: string;
//   amount: number | null;
//   description: string;
//   attachments: UploadedFile[];
// }

// // Category option with limit info
// interface CategoryOption {
//   value: string;
//   label: string;
//   maxAmount: number;
//   periodType: string;
// }

// export default function CreateReimbursementPage() {
//   const { user, isLoading } = useAuth();
//   const searchParams = useSearchParams();
//   const reimbursementId = searchParams.get("id");

//   if (isLoading) {
//     return (
//       <MainLayout>
//         <LoadingSpinner message="Loading..." />
//       </MainLayout>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return (
//     <MainLayout>
//       <CreateReimbursementContent
//         user={user}
//         reimbursementId={reimbursementId}
//       />
//     </MainLayout>
//   );
// }

// interface CreateReimbursementContentProps {
//   user: any;
//   reimbursementId: string | null;
// }

// function CreateReimbursementContent({
//   user,
//   reimbursementId,
// }: CreateReimbursementContentProps) {
//   const router = useRouter();
//   const [form] = Form.useForm();
//   const [api, contextHolder] = notification.useNotification();

//   // State for loading existing reimbursement
//   const [loadingReimbursement, setLoadingReimbursement] =
//     useState(!!reimbursementId);

//   // ===== Category limits state =====
//   const [loadingLimits, setLoadingLimits] = useState(true);
//   const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
//   const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
//   const [categoryError, setCategoryError] = useState<string | null>(null);

//   // Use the create and update mutation hooks
//   const createMutation = useCreateReimbursement();
//   const updateMutation = useUpdateReimbursement();

//   // Fetch reimbursement data if editing
//   const {
//     data: existingReimbursement,
//     isLoading: fetchingReimbursement,
//     refetch: refetchReimbursement,
//   } = useReimbursementById(reimbursementId || "");

//   // State for multiple reimbursement items
//   const [reimbursementItems, setReimbursementItems] = useState<
//     ReimbursementItem[]
//   >([
//     {
//       id: `item_${Date.now()}_0`,
//       category: "",
//       date: null,
//       billNo: "",
//       amount: null,
//       description: "",
//       attachments: [],
//     },
//   ]);

//   // Track all files for upload
//   const [allFiles, setAllFiles] = useState<File[]>([]);

//   // Track which button is loading
//   const [actionLoading, setActionLoading] = useState<{
//     saveDraft: boolean;
//     submit: boolean;
//   }>({
//     saveDraft: false,
//     submit: false,
//   });

//   // ===== Load category limits on page load =====
//   useEffect(() => {
//     loadCategoryLimits();
//   }, []);

//   // ===== Load existing reimbursement data when editing =====
//   useEffect(() => {
//     if (existingReimbursement && reimbursementId) {
//       console.log("📝 Loading existing reimbursement:", existingReimbursement);
//       loadReimbursementData(existingReimbursement);
//       setLoadingReimbursement(false);
//     }
//   }, [existingReimbursement, reimbursementId]);

//   // const loadReimbursementData = (data: any) => {
//   //   console.log("Loading reimbursement data:", data);

//   //   if (!data || !data.items || data.items.length === 0) {
//   //     console.log("No items found in reimbursement data");
//   //     return;
//   //   }

//   //   // Transform the API response to match our component state
//   //   const items: ReimbursementItem[] = data.items.map(
//   //     (item: any, index: number) => {
//   //       console.log(`Processing item ${index}:`, item);

//   //       // Convert existing attachments to UploadedFile format
//   //       const existingFiles: UploadedFile[] = (item.attachments || []).map(
//   //         (att: any) => ({
//   //           base64: att.fileUrl, // Use fileUrl for preview
//   //           fileName: att.fileName,
//   //           fileType:
//   //             att.fileType || att.fileName.split(".").pop() || "unknown",
//   //           file: undefined, // No File object for existing attachments
//   //         }),
//   //       );

//   //       return {
//   //         id: `item_${Date.now()}_${index}`,
//   //         category: item.category || "",
//   //         date: item.date || null,
//   //         billNo: item.billNo || "",
//   //         amount: item.amount || null,
//   //         description: item.description || "",
//   //         attachments: existingFiles, // Load existing attachments here!
//   //       };
//   //     },
//   //   );

//   //   console.log("Transformed items with attachments:", items);
//   //   setReimbursementItems(items);

//   //   // Update form fields
//   //   form.setFieldsValue({
//   //     items: items,
//   //   });
//   // };
// const loadReimbursementData = (data: any) => {
//   console.log("Loading reimbursement data:", data);

//   if (!data || !data.items || data.items.length === 0) {
//     console.log("No items found in reimbursement data");
//     return;
//   }

//   // Full API response structure check
//   console.log("Full data object:", JSON.stringify(data, null, 2));

//   // Transform the API response to match our component state
//   const items: ReimbursementItem[] = data.items.map(
//     (item: any, index: number) => {
//       console.log(`Processing item ${index}:`, item);

//       // Check all possible attachment locations
//       console.log(`Item ${index} attachments:`, item.attachments);
//       console.log(`Item ${index} files:`, item.files);
//       console.log(`Item ${index} documents:`, item.documents);
//       console.log(`Item ${index} receipts:`, item.receipts);

//       // Try different possible attachment field names
//       const attachmentsData = item.attachments || item.files || item.documents || item.receipts || [];

//       console.log(`Item ${index} attachments data found:`, attachmentsData);

//       // Convert existing attachments to UploadedFile format
//       const existingFiles: UploadedFile[] = attachmentsData.map(
//         (att: any) => {
//           console.log(`Processing attachment:`, att);
//           return {
//             base64: att.fileUrl || att.url || att.path || '',
//             fileName: att.fileName || att.name || att.originalName || 'unknown',
//             fileType: att.fileType || att.mimeType || att.type || 'unknown',
//             file: undefined,
//           };
//         },
//       );

//       console.log(`Item ${index} attachments processed:`, existingFiles);

//       return {
//         id: `item_${Date.now()}_${index}`,
//         category: item.category || "",
//         date: item.date || null,
//         billNo: item.billNo || "",
//         amount: item.amount || null,
//         description: item.description || "",
//         attachments: existingFiles,
//       };
//     },
//   );

//   console.log("Transformed items with attachments:", items);
//   setReimbursementItems(items);

//   // Update form fields
//   form.setFieldsValue({
//     items: items,
//   });
// };
//   const loadCategoryLimits = async () => {
//     try {
//       setLoadingLimits(true);
//       setCategoryError(null);

//       const limits = await ReimbursementService.getUserCategoryLimits();

//       console.log("✅ Loaded category limits:", limits);

//       if (limits && limits.length > 0) {
//         setCategoryLimits(limits);

//         const options: CategoryOption[] = limits.map((limit) => ({
//           value: limit.categoryId,
//           label: limit.categoryId,
//           maxAmount: limit.maxAmount,
//           periodType: limit.periodType,
//         }));

//         setCategoryOptions(options);

//         if (limits.length > 0) {
//           await loadCategoryNames(limits);
//         }
//       } else {
//         console.log("No category limits found for this user");
//         setCategoryLimits([]);
//         setCategoryOptions([]);

//         api.info({
//           message: "No Limits Found",
//           description:
//             "No reimbursement policies are configured for your position",
//           placement: "bottomRight",
//           duration: 4,
//         });
//       }
//     } catch (error: any) {
//       console.error("Failed to load category limits:", error);
//       setCategoryError(error.message || "Failed to load category limits");
//       setCategoryLimits([]);
//       setCategoryOptions([]);
//     } finally {
//       setLoadingLimits(false);
//     }
//   };

//   const loadCategoryNames = async (limits: CategoryLimit[]) => {
//     try {
//       const categoryIds = limits.map((limit) => limit.categoryId);

//       const response = await fetch("/api/reimbursement-categories/by-ids", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ids: categoryIds }),
//       });

//       const result = await response.json();

//       if (result.success) {
//         const categories = result.data;

//         const options: CategoryOption[] = limits.map((limit) => {
//           const category = categories.find(
//             (c: any) => c.id === limit.categoryId,
//           );
//           return {
//             value: limit.categoryId,
//             label: category?.name || limit.categoryId,
//             maxAmount: limit.maxAmount,
//             periodType: limit.periodType,
//           };
//         });

//         setCategoryOptions(options);
//       }
//     } catch (error) {
//       console.error("Failed to load category names:", error);
//     }
//   };

//   // Get max amount for a category
//   const getMaxAmountForCategory = (categoryId: string): number => {
//     const option = categoryOptions.find((opt) => opt.value === categoryId);
//     return option?.maxAmount || 0;
//   };

//   // Get period type for a category
//   const getPeriodTypeForCategory = (categoryId: string): string => {
//     const option = categoryOptions.find((opt) => opt.value === categoryId);
//     return option?.periodType || "MONTH";
//   };

//   // Validate amount against category limit
//   const validateAmount = (
//     categoryId: string,
//     amount: number | null,
//   ): string | null => {
//     if (!categoryId || !amount) return null;

//     const maxAmount = getMaxAmountForCategory(categoryId);
//     if (amount > maxAmount) {
//       const periodType = getPeriodTypeForCategory(categoryId).toLowerCase();
//       return `Amount exceeds limit of ₹${maxAmount} per ${periodType}`;
//     }
//     return null;
//   };

//   // Handle Add Item
//   const handleAddItem = () => {
//     setReimbursementItems([
//       ...reimbursementItems,
//       {
//         id: `item_${Date.now()}_${reimbursementItems.length}`,
//         category: "",
//         date: null,
//         billNo: "",
//         amount: null,
//         description: "",
//         attachments: [],
//       },
//     ]);
//   };

//   // Handle Remove Item
//   const handleRemoveItem = (index: number) => {
//     if (reimbursementItems.length === 1) {
//       api.warning({
//         message: "Warning",
//         description: "At least one reimbursement item is required",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return;
//     }

//     const itemToRemove = reimbursementItems[index];
//     const filesToRemove = itemToRemove.attachments.map((att) => att.fileName);
//     setAllFiles((prev) =>
//       prev.filter((file) => !filesToRemove.includes(file.name)),
//     );

//     const newItems = reimbursementItems.filter((_, i) => i !== index);
//     setReimbursementItems(newItems);
//   };

//   // Handle Field Change
//   const handleItemChange = (
//     index: number,
//     field: keyof ReimbursementItem,
//     value: any,
//   ) => {
//     const newItems = [...reimbursementItems];

//     // If field is 'amount', ensure it's stored as a number
//     if (field === "amount") {
//       (newItems[index][field] as any) = value ? Number(value) : null;
//     } else {
//       (newItems[index][field] as any) = value;
//     }

//     setReimbursementItems(newItems);
//   };

//   // Handle File Upload
//   const handleFileUpload = async (
//     index: number,
//     base64File: string,
//     fileName: string,
//   ) => {
//     try {
//       const response = await fetch(base64File);
//       const blob = await response.blob();
//       const file = new File([blob], fileName, { type: blob.type });

//       setAllFiles((prev) => [...prev, file]);

//       const newFile: UploadedFile = {
//         base64: base64File,
//         fileName: fileName,
//         fileType: fileName.split(".").pop() || "unknown",
//         file: file,
//       };

//       const newItems = [...reimbursementItems];
//       newItems[index].attachments.push(newFile);
//       setReimbursementItems(newItems);

//       api.success({
//         message: "Success",
//         description: "File uploaded successfully",
//         placement: "bottomRight",
//         duration: 2,
//       });
//     } catch (error) {
//       console.error("File upload error:", error);
//       api.error({
//         message: "Error",
//         description: "Failed to upload file",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     }
//   };

//   // Handle Delete Attachment
//   // const handleDeleteAttachment = async (
//   //   itemIndex: number,
//   //   fileToDelete: UploadedFile,
//   // ) => {
//   //   try {
//   //     if (fileToDelete.file) {
//   //       setAllFiles((prev) =>
//   //         prev.filter((f) => f.name !== fileToDelete.fileName),
//   //       );
//   //     }

//   //     const newItems = [...reimbursementItems];
//   //     newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
//   //       (file) => file.fileName !== fileToDelete.fileName,
//   //     );
//   //     setReimbursementItems(newItems);

//   //     api.success({
//   //       message: "Success",
//   //       description: "File deleted successfully",
//   //       placement: "bottomRight",
//   //       duration: 2,
//   //     });
//   //   } catch (error) {
//   //     console.error("File delete error:", error);
//   //     api.error({
//   //       message: "Error",
//   //       description: "Failed to delete file",
//   //       placement: "bottomRight",
//   //       duration: 3,
//   //     });
//   //   }
//   // };
// // Handle Delete Attachment - Updated for both existing and new files
// const handleDeleteAttachment = async (
//   itemIndex: number,
//   fileToDelete: UploadedFile,
// ) => {
//   try {
//     // If it's a new file (has file object), remove from allFiles state
//     if (fileToDelete.file) {
//       setAllFiles((prev) =>
//         prev.filter((f) => f.name !== fileToDelete.fileName),
//       );
//     } else {
//       // If it's an existing file from server, you might want to:
//       // Option 1: Mark for deletion on server (recommended)
//       // Add to a state for files to delete on server
//       // setFilesToDelete(prev => [...prev, fileToDelete]);

//       // Option 2: Just remove from UI and handle on save
//       // For now, we'll just remove from UI
//       console.log("Existing file marked for deletion:", fileToDelete.fileName);
//     }

//     // Remove from UI immediately
//     const newItems = [...reimbursementItems];
//     newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
//       (file) => file.fileName !== fileToDelete.fileName,
//     );
//     setReimbursementItems(newItems);

//     api.success({
//       message: "Success",
//       description: "File removed",
//       placement: "bottomRight",
//       duration: 2,
//     });
//   } catch (error) {
//     console.error("File delete error:", error);
//     api.error({
//       message: "Error",
//       description: "Failed to delete file",
//       placement: "bottomRight",
//       duration: 3,
//     });
//   }
// };
//   // Validate Form
//   const validateForm = () => {
//     const totalAttachments = reimbursementItems.reduce(
//       (sum, item) => sum + item.attachments.length,
//       0,
//     );

//     // For new submissions, require at least one attachment
//     if (!reimbursementId && totalAttachments === 0) {
//       api.error({
//         message: "Validation Error",
//         description: "Please upload at least one attachment",
//         placement: "bottomRight",
//         duration: 3,
//       });
//       return false;
//     }

//     for (let i = 0; i < reimbursementItems.length; i++) {
//       const item = reimbursementItems[i];

//       if (!item.category) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a category`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.date) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please select a date`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.billNo?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter bill number`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       if (!item.amount || item.amount <= 0) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a valid amount`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }

//       const amountError = validateAmount(item.category, item.amount);
//       if (amountError) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: ${amountError}`,
//           placement: "bottomRight",
//           duration: 4,
//         });
//         return false;
//       }

//       if (!item.description?.trim()) {
//         api.error({
//           message: "Validation Error",
//           description: `Item #${i + 1}: Please enter a description`,
//           placement: "bottomRight",
//           duration: 3,
//         });
//         return false;
//       }
//     }

//     return true;
//   };

//   // Transform items to match backend format
//   const transformItemsForBackend = () => {
//     return reimbursementItems.map((item) => ({
//       category: item.category,
//       date: item.date,
//       billNo: item.billNo,
//       amount: item.amount ? Number(item.amount) : 0,
//       description: item.description,
//     }));
//   };

//   // Handle Save Draft
//   const handleSaveDraft = async () => {
//     if (!validateForm()) return;

//     setActionLoading((prev) => ({ ...prev, saveDraft: true }));

//     try {
//       const itemsData = transformItemsForBackend();

//       if (reimbursementId) {
//         // Update existing draft
//         await updateMutation.mutateAsync({
//           id: reimbursementId,
//           data: {
//             items: itemsData,
//             status: REIMBURSEMENT_STATUS.DRAFT,
//           },
//           files: allFiles,
//         });

//         api.success({
//           message: "Success",
//           description: "Draft updated successfully",
//           placement: "bottomRight",
//           duration: 2,
//         });
//       } else {
//         // Create new draft
//         await createMutation.mutateAsync({
//           items: itemsData,
//           files: allFiles,
//           status: REIMBURSEMENT_STATUS.DRAFT,
//         });

//         api.success({
//           message: "Success",
//           description: "Reimbursement saved as draft",
//           placement: "bottomRight",
//           duration: 2,
//         });
//       }

//       setTimeout(() => {
//         router.push("/reimbursements/view");
//       }, 1000);
//     } catch (error: any) {
//       console.error("Save draft error:", error);
//       api.error({
//         message: "Error",
//         description: error?.message || "Failed to save draft",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     } finally {
//       setActionLoading((prev) => ({ ...prev, saveDraft: false }));
//     }
//   };

//   // Handle Submit
//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     setActionLoading((prev) => ({ ...prev, submit: true }));

//     try {
//       const itemsData = transformItemsForBackend();

//       console.log("📦 REIMBURSEMENT PAYLOAD:");
//       console.log("Items:", JSON.stringify(itemsData, null, 2));
//       console.log(
//         "New Files:",
//         allFiles.map((f) => ({
//           name: f.name,
//           size: f.size,
//           type: f.type,
//         })),
//       );
//       console.log("Status:", REIMBURSEMENT_STATUS.SUBMITTED);

//       let result;
//       if (reimbursementId) {
//         // Update existing and submit
//         result = await updateMutation.mutateAsync({
//           id: reimbursementId,
//           data: {
//             items: itemsData,
//             status: REIMBURSEMENT_STATUS.SUBMITTED,
//           },
//           files: allFiles,
//         });

//         console.log("✅ Update successful, result:", result);

//         api.success({
//           message: "Success",
//           description: "Reimbursement updated and submitted successfully!",
//           placement: "bottomRight",
//           duration: 2,
//         });
//       } else {
//         // Create new and submit
//         result = await createMutation.mutateAsync({
//           items: itemsData,
//           files: allFiles,
//           status: REIMBURSEMENT_STATUS.SUBMITTED,
//         });

//         api.success({
//           message: "Success",
//           description: "Reimbursement submitted successfully!",
//           placement: "bottomRight",
//           duration: 2,
//         });
//       }

//       setTimeout(() => {
//         router.push("/reimbursement");
//       }, 1000);
//     } catch (error: any) {
//       console.error("❌ Submit error:", error);
//       api.error({
//         message: "Error",
//         description: error?.message || "Failed to submit reimbursement",
//         placement: "bottomRight",
//         duration: 3,
//       });
//     } finally {
//       setActionLoading((prev) => ({ ...prev, submit: false }));
//     }
//   };

//   // Calculate Total Amount
//   const getTotalAmount = () => {
//     return reimbursementItems.reduce((sum, item) => {
//       const amount =
//         typeof item.amount === "string"
//           ? parseFloat(item.amount) || 0
//           : typeof item.amount === "number" && !isNaN(item.amount)
//             ? item.amount
//             : 0;
//       return sum + amount;
//     }, 0);
//   };

//   // Helper to view file
//   const handleViewFile = (file: UploadedFile) => {
//     if (file.base64) {
//       window.open(file.base64, "_blank");
//     }
//   };

//   const handleBack = () => {
//     router.push("/reimbursement");
//   };

//   // Only show full page loading for initial data fetch when editing
//   const isInitialLoading =
//     (fetchingReimbursement && reimbursementId) || loadingReimbursement;

//   if (isInitialLoading) {
//     return (
//       <MainLayout>
//         <LoadingSpinner message="Loading reimbursement data..." />
//       </MainLayout>
//     );
//   }

//   return (
//     <div
//       style={{
//         maxWidth: 900,
//         margin: "0 auto",
//         padding: "24px 16px",
//         height: "calc(100vh - 64px)",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       {contextHolder}

//       {/* Header with Back Button */}
//       <div style={{ marginBottom: 16, flexShrink: 0 }}>
//         <Space align="center" style={{ marginBottom: 8 }}>
//           <Button
//             icon={<ArrowLeftOutlined />}
//             onClick={handleBack}
//             type="text"
//             size="small"
//           >
//             Back
//           </Button>
//           <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
//             {reimbursementId
//               ? "Edit Reimbursement Request"
//               : "Create Reimbursement Request"}
//           </Title>
//         </Space>
//         <Text type="secondary" style={{ fontSize: 13, marginLeft: 32 }}>
//           {new Date().toLocaleDateString("en-US", {
//             weekday: "long",
//             month: "long",
//             day: "numeric",
//             year: "numeric",
//           })}
//         </Text>
//         {reimbursementId && existingReimbursement && (
//           <div style={{ marginTop: 8, marginLeft: 32 }}>
//             <Tag
//               color={
//                 existingReimbursement.status === "DRAFT" ? "default" : "blue"
//               }
//             >
//               Status: {existingReimbursement.status}
//             </Tag>
//           </div>
//         )}
//       </div>

//       {/* Category Limits Summary - Only this shows loading state for limits */}
//       {loadingLimits ? (
//         <Card
//           size="small"
//           style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}
//         >
//           <LoadingSpinner message="Loading your reimbursement limits..." />
//         </Card>
//       ) : (
//         categoryOptions.length > 0 && (
//           <Card
//             size="small"
//             style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}
//           >
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text strong>Your Reimbursement Limits:</Text>
//               <Space size={16} wrap>
//                 {categoryOptions.map((opt) => (
//                   <Text key={opt.value} style={{ fontSize: 12 }}>
//                     {opt.label}: ₹{opt.maxAmount}/{opt.periodType.toLowerCase()}
//                   </Text>
//                 ))}
//               </Space>
//             </div>
//           </Card>
//         )
//       )}

//       {/* Error Alert */}
//       {categoryError && (
//         <Alert
//           message="Error Loading Limits"
//           description={categoryError}
//           type="error"
//           showIcon
//           style={{ marginBottom: 16 }}
//         />
//       )}

//       {/* Form Card */}
//       <Card
//         style={{
//           boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
//           borderRadius: 8,
//           border: "1px solid #e8e8e8",
//           flex: 1,
//           display: "flex",
//           flexDirection: "column",
//           overflow: "hidden",
//         }}
//         styles={{
//           body: {
//             padding: "16px 20px",
//             flex: 1,
//             display: "flex",
//             flexDirection: "column",
//             overflow: "hidden",
//           },
//         }}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           style={{
//             display: "flex",
//             flexDirection: "column",
//             height: "100%",
//           }}
//         >
//           {/* Scrollable Content Area */}
//           <div
//             style={{
//               flex: 1,
//               overflowY: "auto",
//               paddingRight: 8,
//               marginBottom: 16,
//             }}
//           >
//             {/* Reimbursement Items Section */}
//             <div style={{ marginBottom: 16 }}>
//               <Text
//                 strong
//                 style={{ fontSize: 15, display: "block", marginBottom: 12 }}
//               >
//                 Reimbursement Items
//               </Text>

//               {reimbursementItems.map((item, index) => {
//                 const amountError =
//                   item.category && item.amount
//                     ? validateAmount(item.category, item.amount)
//                     : null;

//                 return (
//                   <div
//                     key={item.id}
//                     style={{
//                       border: "1px solid #e8e8e8",
//                       borderRadius: 6,
//                       padding: "12px 14px",
//                       marginBottom: 12,
//                       backgroundColor: "#fafafa",
//                       position: "relative",
//                     }}
//                   >
//                     {/* Item Header */}
//                     <div
//                       style={{
//                         display: "flex",
//                         justifyContent: "space-between",
//                         alignItems: "center",
//                         marginBottom: 12,
//                       }}
//                     >
//                       <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
//                         Expense #{index + 1}
//                       </Text>
//                       {reimbursementItems.length > 1 && (
//                         <Button
//                           type="text"
//                           danger
//                           size="small"
//                           icon={<DeleteOutlined />}
//                           onClick={() => handleRemoveItem(index)}
//                           disabled={
//                             actionLoading.saveDraft || actionLoading.submit
//                           }
//                         >
//                           Remove
//                         </Button>
//                       )}
//                     </div>

//                     {/* Row 1: Category and Date */}
//                     <Row gutter={12} style={{ marginBottom: 10 }}>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Category{" "}
//                               <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <Select
//                             placeholder={
//                               loadingLimits ? "Loading categories..." : "Select"
//                             }
//                             value={item.category || undefined}
//                             onChange={(value) => {
//                               handleItemChange(index, "category", value);
//                               if (item.amount) {
//                                 const error = validateAmount(
//                                   value,
//                                   item.amount,
//                                 );
//                                 if (error) {
//                                   api.warning({
//                                     message: "Limit Warning",
//                                     description: error,
//                                     placement: "bottomRight",
//                                     duration: 3,
//                                   });
//                                 }
//                               }
//                             }}
//                             options={categoryOptions}
//                             style={{ width: "100%" }}
//                             size="small"
//                             disabled={
//                               actionLoading.saveDraft ||
//                               actionLoading.submit ||
//                               loadingLimits
//                             }
//                             showSearch
//                             filterOption={(input, option) =>
//                               (option?.label ?? "")
//                                 .toLowerCase()
//                                 .includes(input.toLowerCase())
//                             }
//                             loading={loadingLimits}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Date <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <DatePicker
//                             style={{ width: "100%" }}
//                             placeholder="Select"
//                             value={item.date ? dayjs(item.date) : null}
//                             onChange={(date) =>
//                               handleItemChange(
//                                 index,
//                                 "date",
//                                 date ? date.toISOString() : null,
//                               )
//                             }
//                             format="DD-MM-YYYY"
//                             size="small"
//                             disabled={
//                               actionLoading.saveDraft || actionLoading.submit
//                             }
//                             disabledDate={(current) =>
//                               current && current > dayjs().endOf("day")
//                             }
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     <Row gutter={12} style={{ marginBottom: 10 }}>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Bill No{" "}
//                               <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                         >
//                           <Input
//                             placeholder="Enter bill no"
//                             value={item.billNo}
//                             onChange={(e) =>
//                               handleItemChange(index, "billNo", e.target.value)
//                             }
//                             size="small"
//                             disabled={
//                               actionLoading.saveDraft || actionLoading.submit
//                             }
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={12}>
//                         <Form.Item
//                           label={
//                             <span style={{ fontSize: 12 }}>
//                               Amount (₹){" "}
//                               <span style={{ color: "#ff4d4f" }}>*</span>
//                             </span>
//                           }
//                           required={false}
//                           style={{ marginBottom: 0 }}
//                           validateStatus={amountError ? "error" : undefined}
//                           help={amountError}
//                         >
//                           <Input
//                             type="number"
//                             placeholder={`Enter amount (max ₹${getMaxAmountForCategory(item.category)})`}
//                             value={item.amount || undefined}
//                             onChange={(e) =>
//                               handleItemChange(
//                                 index,
//                                 "amount",
//                                 e.target.value
//                                   ? parseFloat(e.target.value)
//                                   : null,
//                               )
//                             }
//                             prefix="₹"
//                             min={0}
//                             max={getMaxAmountForCategory(item.category)}
//                             step={0.01}
//                             size="small"
//                             disabled={
//                               actionLoading.saveDraft ||
//                               actionLoading.submit ||
//                               !item.category
//                             }
//                             status={amountError ? "error" : undefined}
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     {/* Row 3: Description */}
//                     <Form.Item
//                       label={
//                         <span style={{ fontSize: 12 }}>
//                           Description{" "}
//                           <span style={{ color: "#ff4d4f" }}>*</span>
//                         </span>
//                       }
//                       required={false}
//                       style={{ marginBottom: 10 }}
//                     >
//                       <TextArea
//                         rows={2}
//                         placeholder="Describe expense details..."
//                         value={item.description}
//                         onChange={(e) =>
//                           handleItemChange(index, "description", e.target.value)
//                         }
//                         size="small"
//                         disabled={
//                           actionLoading.saveDraft || actionLoading.submit
//                         }
//                       />
//                     </Form.Item>

// <Form.Item
//   label={
//     <span style={{ fontSize: 12 }}>
//       Attachments
//       <Text
//         type="secondary"
//         style={{ fontSize: 11, marginLeft: 4 }}
//       >
//         {!reimbursementId
//           ? "(Required - at least one)"
//           : "(Upload new files to add more)"}
//       </Text>
//     </span>
//   }
//   style={{ marginBottom: 0 }}
// >
//   <Space
//     direction="vertical"
//     size={8}
//     style={{ width: "100%" }}
//   >
//     <AttachmentUploader
//       onUpload={(base64File, fileName) =>
//         handleFileUpload(index, base64File, fileName)
//       }
//       maxSize={5}
//       accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
//       disabled={
//         actionLoading.saveDraft || actionLoading.submit
//       }
//     />

//     {/* Show ALL attachments (existing + new) */}
//     {item.attachments && item.attachments.length > 0 ? (
//       <div style={{ marginTop: 8 }}>
//         <Text type="secondary" style={{ fontSize: 11 }}>
//           {reimbursementId
//             ? "Current Attachments:"
//             : "Attachments:"}
//         </Text>
//         {item.attachments.map((file, fileIndex) => {
//           // Check if this is an existing attachment (no file object) or new one
//           const isExisting = !file.file;

//           return (
//             <div
//               key={`${file.fileName}_${fileIndex}_${isExisting ? "existing" : "new"}`}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "space-between",
//                 padding: "4px 8px",
//                 border: "1px solid #e8e8e8",
//                 borderRadius: 4,
//                 marginBottom: 4,
//                 backgroundColor: isExisting
//                   ? "#f9f9f9"
//                   : "#fff",
//               }}
//             >
//               <span style={{ fontSize: 12 }}>
//                 {file.fileName}
//               </span>
//               <Space size={4}>
//                 <Button
//                   size="small"
//                   type="text"
//                   icon={<EyeOutlined />}
//                   onClick={() => {
//                     if (file.base64) {
//                       window.open(file.base64, "_blank");
//                     }
//                   }}
//                   disabled={
//                     actionLoading.saveDraft ||
//                     actionLoading.submit
//                   }
//                 />
//                   <Button
//                   size="small"
//                   type="text"
//                   danger
//                   icon={<DeleteOutlined />}
//                   onClick={() => handleDeleteAttachment(index, file)}
//                   disabled={
//                     actionLoading.saveDraft ||
//                     actionLoading.submit
//                   }
//                 />
//               </Space>
//             </div>
//           );
//         })}
//       </div>
//     ) : (
//       <Text type="secondary" style={{ fontSize: 11 }}>
//         No attachments
//       </Text>
//     )}
//   </Space>
// </Form.Item>
//                   </div>
//                 );
//               })}

//               {/* Add Item Button */}
//               <Button
//                 type="dashed"
//                 icon={<PlusOutlined />}
//                 onClick={handleAddItem}
//                 style={{ width: "100%", marginTop: 4 }}
//                 size="small"
//                 disabled={actionLoading.saveDraft || actionLoading.submit}
//               >
//                 Add Another Expense
//               </Button>
//             </div>

//             {/* Total Amount Display */}
//             <div
//               style={{
//                 padding: "10px 14px",
//                 backgroundColor: "#f0f5ff",
//                 borderRadius: 6,
//                 border: "1px solid #adc6ff",
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//               }}
//             >
//               <Text strong style={{ fontSize: 13 }}>
//                 Total Amount:
//               </Text>
//               <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: 600 }}>
//                 ₹
//                 {(() => {
//                   const total = getTotalAmount();
//                   return Number(total).toFixed(2);
//                 })()}
//               </Text>
//             </div>
//           </div>

//           {/* Fixed Footer */}
//           <div
//             style={{
//               display: "flex",
//               justifyContent: "flex-end",
//               gap: "12px",
//               borderTop: "1px solid #e8e8e8",
//               paddingTop: 16,
//               flexShrink: 0,
//               backgroundColor: "#fff",
//             }}
//           >
//             <Button
//               onClick={handleSaveDraft}
//               loading={actionLoading.saveDraft}
//               icon={<SaveOutlined />}
//               size="middle"
//               disabled={actionLoading.submit}
//             >
//               {reimbursementId ? "Update Draft" : "Save Draft"}
//             </Button>
//             <Button
//               onClick={handleBack}
//               size="middle"
//               disabled={actionLoading.saveDraft || actionLoading.submit}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="primary"
//               onClick={handleSubmit}
//               loading={actionLoading.submit}
//               size="middle"
//               disabled={actionLoading.saveDraft}
//             >
//               {reimbursementId ? "Update & Submit" : "Submit"}
//             </Button>
//           </div>
//         </Form>
//       </Card>
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Button,
  Select,
  Input,
  Space,
  Typography,
  notification,
  DatePicker,
  Row,
  Col,
  Alert,
  Tag,
  Modal,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import AttachmentUploader from "@/components/common/AttachmentUploader";
import dayjs from "dayjs";
import {
  useCreateReimbursement,
  useReimbursementById,
  useUpdateReimbursement,
} from "@/hooks/usereimbursementcreate";
import {
  ReimbursementService,
  CategoryLimit,
} from "@/services/reimbursementcreateService";

const { Title, Text } = Typography;
const { TextArea } = Input;

// Status enum matching backend
const REIMBURSEMENT_STATUS = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
} as const;

// File interface for preview
interface UploadedFile {
  base64: string;
  fileName: string;
  fileType: string;
  file?: File;
}

// Reimbursement Item Interface
interface ReimbursementItem {
  id: string;
  category: string;
  date: string | null;
  billNo: string;
  amount: number | null;
  description: string;
  attachments: UploadedFile[];
}

// Category option with limit info
interface CategoryOption {
  value: string;
  label: string;
  maxAmount: number;
  periodType: string;
}

export default function CreateReimbursementPage() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const reimbursementId = searchParams.get("id");

  if (isLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading..." />
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <MainLayout>
      <CreateReimbursementContent
        user={user}
        reimbursementId={reimbursementId}
      />
    </MainLayout>
  );
}

interface CreateReimbursementContentProps {
  user: any;
  reimbursementId: string | null;
}

function CreateReimbursementContent({
  user,
  reimbursementId,
}: CreateReimbursementContentProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();

  // State for loading existing reimbursement
  const [loadingReimbursement, setLoadingReimbursement] =
    useState(!!reimbursementId);

  // ===== Category limits state =====
  const [loadingLimits, setLoadingLimits] = useState(true);
  const [categoryLimits, setCategoryLimits] = useState<CategoryLimit[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // ===== File preview modal state =====
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);

  // Use the create and update mutation hooks
  const createMutation = useCreateReimbursement();
  const updateMutation = useUpdateReimbursement();

  // Fetch reimbursement data if editing
  const {
    data: existingReimbursement,
    isLoading: fetchingReimbursement,
    refetch: refetchReimbursement,
  } = useReimbursementById(reimbursementId || "");

  // State for multiple reimbursement items
  const [reimbursementItems, setReimbursementItems] = useState<
    ReimbursementItem[]
  >([
    {
      id: `item_${Date.now()}_0`,
      category: "",
      date: null,
      billNo: "",
      amount: null,
      description: "",
      attachments: [],
    },
  ]);

  // Track all files for upload
  const [allFiles, setAllFiles] = useState<File[]>([]);

  // Track which button is loading
  const [actionLoading, setActionLoading] = useState<{
    saveDraft: boolean;
    submit: boolean;
  }>({
    saveDraft: false,
    submit: false,
  });

  // ===== Load category limits on page load =====
  useEffect(() => {
    loadCategoryLimits();
  }, []);

  // ===== Load existing reimbursement data when editing =====
  useEffect(() => {
    if (existingReimbursement && reimbursementId) {
      console.log("📝 Loading existing reimbursement:", existingReimbursement);
      loadReimbursementData(existingReimbursement);
      setLoadingReimbursement(false);
    }
  }, [existingReimbursement, reimbursementId]);

  const loadReimbursementData = (data: any) => {
    console.log("Loading reimbursement data:", data);

    if (!data || !data.items || data.items.length === 0) {
      console.log("No items found in reimbursement data");
      return;
    }

    // Full API response structure check
    console.log("Full data object:", JSON.stringify(data, null, 2));

    // Transform the API response to match our component state
    const items: ReimbursementItem[] = data.items.map(
      (item: any, index: number) => {
        console.log(`Processing item ${index}:`, item);

        // Check all possible attachment locations
        console.log(`Item ${index} attachments:`, item.attachments);
        console.log(`Item ${index} files:`, item.files);
        console.log(`Item ${index} documents:`, item.documents);
        console.log(`Item ${index} receipts:`, item.receipts);

        // Try different possible attachment field names
        const attachmentsData =
          item.attachments ||
          item.files ||
          item.documents ||
          item.receipts ||
          [];

        console.log(`Item ${index} attachments data found:`, attachmentsData);

        // Convert existing attachments to UploadedFile format
        const existingFiles: UploadedFile[] = attachmentsData.map(
          (att: any) => {
            console.log(`Processing attachment:`, att);
            return {
              base64: att.fileUrl || att.url || att.path || "",
              fileName:
                att.fileName || att.name || att.originalName || "unknown",
              fileType: att.fileType || att.mimeType || att.type || "unknown",
              file: undefined,
            };
          },
        );

        console.log(`Item ${index} attachments processed:`, existingFiles);

        return {
          id: `item_${Date.now()}_${index}`,
          category: item.category || "",
          date: item.date || null,
          billNo: item.billNo || "",
          amount: item.amount || null,
          description: item.description || "",
          attachments: existingFiles,
        };
      },
    );

    console.log("Transformed items with attachments:", items);
    setReimbursementItems(items);

    // Update form fields
    form.setFieldsValue({
      items: items,
    });
  };

  const loadCategoryLimits = async () => {
    try {
      setLoadingLimits(true);
      setCategoryError(null);

      const limits = await ReimbursementService.getUserCategoryLimits();

      console.log("✅ Loaded category limits:", limits);

      if (limits && limits.length > 0) {
        setCategoryLimits(limits);

        const options: CategoryOption[] = limits.map((limit) => ({
          value: limit.categoryId,
          label: limit.categoryId,
          maxAmount: limit.maxAmount,
          periodType: limit.periodType,
        }));

        setCategoryOptions(options);

        if (limits.length > 0) {
          await loadCategoryNames(limits);
        }
      } else {
        console.log("No category limits found for this user");
        setCategoryLimits([]);
        setCategoryOptions([]);

        api.info({
          message: "No Limits Found",
          description:
            "No reimbursement policies are configured for your position",
          placement: "bottomRight",
          duration: 4,
        });
      }
    } catch (error: any) {
      console.error("Failed to load category limits:", error);
      setCategoryError(error.message || "Failed to load category limits");
      setCategoryLimits([]);
      setCategoryOptions([]);
    } finally {
      setLoadingLimits(false);
    }
  };

  const loadCategoryNames = async (limits: CategoryLimit[]) => {
    try {
      const categoryIds = limits.map((limit) => limit.categoryId);

      const response = await fetch("/api/reimbursement-categories/by-ids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: categoryIds }),
      });

      const result = await response.json();

      if (result.success) {
        const categories = result.data;

        const options: CategoryOption[] = limits.map((limit) => {
          const category = categories.find(
            (c: any) => c.id === limit.categoryId,
          );
          return {
            value: limit.categoryId,
            label: category?.name || limit.categoryId,
            maxAmount: limit.maxAmount,
            periodType: limit.periodType,
          };
        });

        setCategoryOptions(options);
      }
    } catch (error) {
      console.error("Failed to load category names:", error);
    }
  };

  // Get max amount for a category
  const getMaxAmountForCategory = (categoryId: string): number => {
    const option = categoryOptions.find((opt) => opt.value === categoryId);
    return option?.maxAmount || 0;
  };

  // Get period type for a category
  const getPeriodTypeForCategory = (categoryId: string): string => {
    const option = categoryOptions.find((opt) => opt.value === categoryId);
    return option?.periodType || "MONTH";
  };

  // Validate amount against category limit
  const validateAmount = (
    categoryId: string,
    amount: number | null,
  ): string | null => {
    if (!categoryId || !amount) return null;

    const maxAmount = getMaxAmountForCategory(categoryId);
    if (amount > maxAmount) {
      const periodType = getPeriodTypeForCategory(categoryId).toLowerCase();
      return `Amount exceeds limit of ₹${maxAmount} per ${periodType}`;
    }
    return null;
  };

  // Handle Add Item
  const handleAddItem = () => {
    setReimbursementItems([
      ...reimbursementItems,
      {
        id: `item_${Date.now()}_${reimbursementItems.length}`,
        category: "",
        date: null,
        billNo: "",
        amount: null,
        description: "",
        attachments: [],
      },
    ]);
  };

  // Handle Remove Item
  const handleRemoveItem = (index: number) => {
    if (reimbursementItems.length === 1) {
      api.warning({
        message: "Warning",
        description: "At least one reimbursement item is required",
        placement: "bottomRight",
        duration: 3,
      });
      return;
    }

    const itemToRemove = reimbursementItems[index];
    const filesToRemove = itemToRemove.attachments.map((att) => att.fileName);
    setAllFiles((prev) =>
      prev.filter((file) => !filesToRemove.includes(file.name)),
    );

    const newItems = reimbursementItems.filter((_, i) => i !== index);
    setReimbursementItems(newItems);
  };

  // Handle Field Change
  const handleItemChange = (
    index: number,
    field: keyof ReimbursementItem,
    value: any,
  ) => {
    const newItems = [...reimbursementItems];

    // If field is 'amount', ensure it's stored as a number
    if (field === "amount") {
      (newItems[index][field] as any) = value ? Number(value) : null;
    } else {
      (newItems[index][field] as any) = value;
    }

    setReimbursementItems(newItems);
  };

  // Handle File Upload
  const handleFileUpload = async (
    index: number,
    base64File: string,
    fileName: string,
  ) => {
    try {
      const response = await fetch(base64File);
      const blob = await response.blob();
      const file = new File([blob], fileName, { type: blob.type });

      setAllFiles((prev) => [...prev, file]);

      const newFile: UploadedFile = {
        base64: base64File,
        fileName: fileName,
        fileType: fileName.split(".").pop() || "unknown",
        file: file,
      };

      const newItems = [...reimbursementItems];
      newItems[index].attachments.push(newFile);
      setReimbursementItems(newItems);

      api.success({
        message: "Success",
        description: "File uploaded successfully",
        placement: "bottomRight",
        duration: 2,
      });
    } catch (error) {
      console.error("File upload error:", error);
      api.error({
        message: "Error",
        description: "Failed to upload file",
        placement: "bottomRight",
        duration: 3,
      });
    }
  };

  // Handle Delete Attachment
  const handleDeleteAttachment = async (
    itemIndex: number,
    fileToDelete: UploadedFile,
  ) => {
    try {
      // If it's a new file (has file object), remove from allFiles state
      if (fileToDelete.file) {
        setAllFiles((prev) =>
          prev.filter((f) => f.name !== fileToDelete.fileName),
        );
      } else {
        // If it's an existing file from server, you might want to:
        // Option 1: Mark for deletion on server (recommended)
        // Add to a state for files to delete on server
        // setFilesToDelete(prev => [...prev, fileToDelete]);

        // Option 2: Just remove from UI and handle on save
        // For now, we'll just remove from UI
        console.log(
          "Existing file marked for deletion:",
          fileToDelete.fileName,
        );
      }

      // Remove from UI immediately
      const newItems = [...reimbursementItems];
      newItems[itemIndex].attachments = newItems[itemIndex].attachments.filter(
        (file) => file.fileName !== fileToDelete.fileName,
      );
      setReimbursementItems(newItems);

      api.success({
        message: "Success",
        description: "File removed",
        placement: "bottomRight",
        duration: 2,
      });
    } catch (error) {
      console.error("File delete error:", error);
      api.error({
        message: "Error",
        description: "Failed to delete file",
        placement: "bottomRight",
        duration: 3,
      });
    }
  };

  // Handle View File in Modal
  const handleViewFile = (file: UploadedFile) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  // Handle Download File
  const handleDownloadFile = (file: UploadedFile) => {
    const link = document.createElement("a");
    link.href = file.base64;
    link.download = file.fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get iframe URL for preview
  const getIframeUrl = (file: UploadedFile): string => {
    const fileName = file.fileName?.toLowerCase() || "";
    const fileType = file.fileType || "";

    if (fileName.endsWith(".pdf") || fileType === "application/pdf") {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(file.base64)}&embedded=true`;
    }

    if (
      fileName.endsWith(".doc") ||
      fileName.endsWith(".docx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".ppt") ||
      fileName.endsWith(".pptx")
    ) {
      return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.base64)}`;
    }

    if (
      fileType?.startsWith("image/") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg") ||
      fileName.endsWith(".png") ||
      fileName.endsWith(".gif")
    ) {
      return file.base64;
    }

    return `https://docs.google.com/viewer?url=${encodeURIComponent(file.base64)}&embedded=true`;
  };

  // Validate Form
  const validateForm = () => {
    const totalAttachments = reimbursementItems.reduce(
      (sum, item) => sum + item.attachments.length,
      0,
    );

    // For new submissions, require at least one attachment
    if (!reimbursementId && totalAttachments === 0) {
      api.error({
        message: "Validation Error",
        description: "Please upload at least one attachment",
        placement: "bottomRight",
        duration: 3,
      });
      return false;
    }

    for (let i = 0; i < reimbursementItems.length; i++) {
      const item = reimbursementItems[i];

      if (!item.category) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please select a category`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }

      if (!item.date) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please select a date`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }

      if (!item.billNo?.trim()) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please enter bill number`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }

      if (!item.amount || item.amount <= 0) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please enter a valid amount`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }

      const amountError = validateAmount(item.category, item.amount);
      if (amountError) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: ${amountError}`,
          placement: "bottomRight",
          duration: 4,
        });
        return false;
      }

      if (!item.description?.trim()) {
        api.error({
          message: "Validation Error",
          description: `Item #${i + 1}: Please enter a description`,
          placement: "bottomRight",
          duration: 3,
        });
        return false;
      }
    }

    return true;
  };

  // Transform items to match backend format
  // const transformItemsForBackend = () => {
  //   return reimbursementItems.map((item) => ({
  //     category: item.category,
  //     // date: item.date,
  //      date: item.date || new Date().toISOString().split('T')[0],
  //     billNo: item.billNo,
  //     amount: item.amount ? Number(item.amount) : 0,
  //     description: item.description,
  //   }));
  // };
  const transformItemsForBackend = () => {
  return reimbursementItems.map((item) => {

    const attachmentIndexes = item.attachments
      .map((att) =>
        allFiles.findIndex((file) => file.name === att.fileName)
      )
      .filter((index) => index !== -1);

    return {
      category: item.category,
      date: item.date || new Date().toISOString().split("T")[0],
      billNo: item.billNo,
      amount: item.amount ? Number(item.amount) : 0,
      description: item.description,
      attachments: attachmentIndexes // ⭐ important
    };
  });
};

  // Handle Save Draft
  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    setActionLoading((prev) => ({ ...prev, saveDraft: true }));

    try {
      const itemsData = transformItemsForBackend();

      if (reimbursementId) {
        // Update existing draft
        await updateMutation.mutateAsync({
          id: reimbursementId,
          data: {
            items: itemsData,
            status: REIMBURSEMENT_STATUS.DRAFT,
          },
          files: allFiles,
        });

        api.success({
          message: "Success",
          description: "Draft updated successfully",
          placement: "bottomRight",
          duration: 2,
        });
      } else {
        // Create new draft
        await createMutation.mutateAsync({
          items: itemsData,
          files: allFiles,
          status: REIMBURSEMENT_STATUS.DRAFT,
        });

        api.success({
          message: "Success",
          description: "Reimbursement saved as draft",
          placement: "bottomRight",
          duration: 2,
        });
      }

      setTimeout(() => {
        router.push("/reimbursements/view");
      }, 1000);
    } catch (error: any) {
      console.error("Save draft error:", error);
      api.error({
        message: "Error",
        description: error?.message || "Failed to save draft",
        placement: "bottomRight",
        duration: 3,
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, saveDraft: false }));
    }
  };

  // Handle Submit
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setActionLoading((prev) => ({ ...prev, submit: true }));

    try {
      const itemsData = transformItemsForBackend();

      console.log("📦 REIMBURSEMENT PAYLOAD:");
      console.log("Items:", JSON.stringify(itemsData, null, 2));
      console.log(
        "New Files:",
        allFiles.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      );
      console.log("Status:", REIMBURSEMENT_STATUS.SUBMITTED);

      let result;
      if (reimbursementId) {
        // Update existing and submit
        result = await updateMutation.mutateAsync({
          id: reimbursementId,
          data: {
            items: itemsData,
            status: REIMBURSEMENT_STATUS.SUBMITTED,
          },
          files: allFiles,
        });

        console.log("✅ Update successful, result:", result);

        api.success({
          message: "Success",
          description: "Reimbursement updated and submitted successfully!",
          placement: "bottomRight",
          duration: 2,
        });
      } else {
        // Create new and submit
        result = await createMutation.mutateAsync({
          items: itemsData,
          files: allFiles,
          status: REIMBURSEMENT_STATUS.SUBMITTED,
        });

        api.success({
          message: "Success",
          description: "Reimbursement submitted successfully!",
          placement: "bottomRight",
          duration: 2,
        });
      }

      setTimeout(() => {
        router.push("/reimbursement");
      }, 1000);
    } catch (error: any) {
      console.error("❌ Submit error:", error);
      api.error({
        message: "Error",
        description: error?.message || "Failed to submit reimbursement",
        placement: "bottomRight",
        duration: 3,
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  // Calculate Total Amount
  const getTotalAmount = () => {
    return reimbursementItems.reduce((sum, item) => {
      const amount =
        typeof item.amount === "string"
          ? parseFloat(item.amount) || 0
          : typeof item.amount === "number" && !isNaN(item.amount)
            ? item.amount
            : 0;
      return sum + amount;
    }, 0);
  };

  const handleBack = () => {
    router.push("/reimbursement");
  };

  // Only show full page loading for initial data fetch when editing
  const isInitialLoading =
    (fetchingReimbursement && reimbursementId) || loadingReimbursement;

  if (isInitialLoading) {
    return (
      <MainLayout>
        <LoadingSpinner message="Loading reimbursement data..." />
      </MainLayout>
    );
  }

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        height: "calc(100vh - 64px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {contextHolder}

      {/* Header with Back Button */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <Space align="center" style={{ marginBottom: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            type="text"
            size="small"
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            {reimbursementId
              ? "Edit Reimbursement Request"
              : "Create Reimbursement Request"}
          </Title>
        </Space>
        <Text type="secondary" style={{ fontSize: 13, marginLeft: 32 }}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        {reimbursementId && existingReimbursement && (
          <div style={{ marginTop: 8, marginLeft: 32 }}>
            <Tag
              color={
                existingReimbursement.status === "DRAFT" ? "default" : "blue"
              }
            >
              Status: {existingReimbursement.status}
            </Tag>
          </div>
        )}
      </div>

      {/* Category Limits Summary - Only this shows loading state for limits */}
      {/* {loadingLimits ? (
        <Card
          size="small"
          style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}
        >
          <LoadingSpinner message="Loading your reimbursement limits..." />
        </Card>
      ) : (
        categoryOptions.length > 0 && (
          <Card
            size="small"
            style={{ marginBottom: 16, backgroundColor: "#f0f5ff" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong>Your Reimbursement Limits:</Text>
              <Space size={16} wrap>
                {categoryOptions.map((opt) => (
                  <Text key={opt.value} style={{ fontSize: 12 }}>
                    {opt.label}: ₹{opt.maxAmount}/{opt.periodType.toLowerCase()}
                  </Text>
                ))}
              </Space>
            </div>
          </Card>
        )
      )} */}

      {/* Error Alert */}
      {categoryError && (
        <Alert
          message="Error Loading Limits"
          description={categoryError}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Form Card */}
      <Card
        style={{
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          borderRadius: 8,
          border: "1px solid #e8e8e8",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        styles={{
          body: {
            padding: "16px 20px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
        }}
      >
        <Form
          form={form}
          layout="vertical"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          {/* Scrollable Content Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: 8,
              marginBottom: 16,
            }}
          >
            {/* Reimbursement Items Section */}
            <div style={{ marginBottom: 16 }}>
              <Text
                strong
                style={{ fontSize: 15, display: "block", marginBottom: 12 }}
              >
                Reimbursement Items
              </Text>

              {reimbursementItems.map((item, index) => {
                const amountError =
                  item.category && item.amount
                    ? validateAmount(item.category, item.amount)
                    : null;

                return (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #e8e8e8",
                      borderRadius: 6,
                      padding: "12px 14px",
                      marginBottom: 12,
                      backgroundColor: "#fafafa",
                      position: "relative",
                    }}
                  >
                    {/* Item Header */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Text strong style={{ fontSize: 13, color: "#1890ff" }}>
                        Expense #{index + 1}
                      </Text>
                      {reimbursementItems.length > 1 && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveItem(index)}
                          disabled={
                            actionLoading.saveDraft || actionLoading.submit
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Row 1: Category and Date */}
                    <Row gutter={12} style={{ marginBottom: 10 }}>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ fontSize: 12 }}>
                              Category{" "}
                              <span style={{ color: "#ff4d4f" }}>*</span>
                            </span>
                          }
                          required={false}
                          style={{ marginBottom: 0 }}
                        >
                          <Select
                            placeholder={
                              loadingLimits ? "Loading categories..." : "Select"
                            }
                            value={item.category || undefined}
                            onChange={(value) => {
                              handleItemChange(index, "category", value);
                              if (item.amount) {
                                const error = validateAmount(
                                  value,
                                  item.amount,
                                );
                                if (error) {
                                  api.warning({
                                    message: "Limit Warning",
                                    description: error,
                                    placement: "bottomRight",
                                    duration: 3,
                                  });
                                }
                              }
                            }}
                            options={categoryOptions}
                            style={{ width: "100%" }}
                            size="small"
                            disabled={
                              actionLoading.saveDraft ||
                              actionLoading.submit ||
                              loadingLimits
                            }
                            showSearch
                            filterOption={(input, option) =>
                              (option?.label ?? "")
                                .toLowerCase()
                                .includes(input.toLowerCase())
                            }
                            loading={loadingLimits}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ fontSize: 12 }}>
                              Date <span style={{ color: "#ff4d4f" }}>*</span>
                            </span>
                          }
                          required={false}
                          style={{ marginBottom: 0 }}
                        >
                          <DatePicker
                            style={{ width: "100%" }}
                            placeholder="Select"
                            value={item.date ? dayjs(item.date) : null}
                            // onChange={(date) =>
                            //   handleItemChange(
                            //     index,
                            //     "date",
                            //     date ? date.toISOString() : null,
                            //   )
                            // }
                            onChange={(date) =>
                              handleItemChange(
                                index,
                                "date",
                                date ? date.format("YYYY-MM-DD") : null, // ✅ This keeps the date as is
                              )
                            }
                            format="DD-MM-YYYY"
                            size="small"
                            disabled={
                              actionLoading.saveDraft || actionLoading.submit
                            }
                            disabledDate={(current) =>
                              current && current > dayjs().endOf("day")
                            }
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={12} style={{ marginBottom: 10 }}>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ fontSize: 12 }}>
                              Bill No{" "}
                              <span style={{ color: "#ff4d4f" }}>*</span>
                            </span>
                          }
                          required={false}
                          style={{ marginBottom: 0 }}
                        >
                          <Input
                            placeholder="Enter bill no"
                            value={item.billNo}
                            onChange={(e) =>
                              handleItemChange(index, "billNo", e.target.value)
                            }
                            size="small"
                            disabled={
                              actionLoading.saveDraft || actionLoading.submit
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          label={
                            <span style={{ fontSize: 12 }}>
                              Amount (₹){" "}
                              <span style={{ color: "#ff4d4f" }}>*</span>
                            </span>
                          }
                          required={false}
                          style={{ marginBottom: 0 }}
                          validateStatus={amountError ? "error" : undefined}
                          help={amountError}
                        >
                          <Input
                            type="number"
                            placeholder={`Enter amount (max ₹${getMaxAmountForCategory(item.category)})`}
                            value={item.amount || undefined}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "amount",
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : null,
                              )
                            }
                            prefix="₹"
                            min={0}
                            max={getMaxAmountForCategory(item.category)}
                            step={0.01}
                            size="small"
                            disabled={
                              actionLoading.saveDraft ||
                              actionLoading.submit ||
                              !item.category
                            }
                            status={amountError ? "error" : undefined}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Row 3: Description */}
                    <Form.Item
                      label={
                        <span style={{ fontSize: 12 }}>
                          Description{" "}
                          <span style={{ color: "#ff4d4f" }}>*</span>
                        </span>
                      }
                      required={false}
                      style={{ marginBottom: 10 }}
                    >
                      <TextArea
                        rows={2}
                        placeholder="Describe expense details..."
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        size="small"
                        disabled={
                          actionLoading.saveDraft || actionLoading.submit
                        }
                      />
                    </Form.Item>

                    {/* Row 4: Attachments */}
                    <Form.Item
                      label={
                        <span style={{ fontSize: 12 }}>
                          Attachments
                          <Text
                            type="secondary"
                            style={{ fontSize: 11, marginLeft: 4 }}
                          >
                            {!reimbursementId
                              ? "(Required - at least one)"
                              : "(Upload new files to add more)"}
                          </Text>
                        </span>
                      }
                      style={{ marginBottom: 0 }}
                    >
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ width: "100%" }}
                      >
                        <AttachmentUploader
                          onUpload={(base64File, fileName) =>
                            handleFileUpload(index, base64File, fileName)
                          }
                          maxSize={5}
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          disabled={
                            actionLoading.saveDraft || actionLoading.submit
                          }
                        />

                        {/* Show ALL attachments (existing + new) */}
                        {item.attachments && item.attachments.length > 0 ? (
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              {reimbursementId
                                ? "Current Attachments:"
                                : "Attachments:"}
                            </Text>
                            {item.attachments.map((file, fileIndex) => {
                              // Check if this is an existing attachment (no file object) or new one
                              const isExisting = !file.file;

                              return (
                                <div
                                  key={`${file.fileName}_${fileIndex}_${isExisting ? "existing" : "new"}`}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "4px 8px",
                                    border: "1px solid #e8e8e8",
                                    borderRadius: 4,
                                    marginBottom: 4,
                                    backgroundColor: isExisting
                                      ? "#f9f9f9"
                                      : "#fff",
                                  }}
                                >
                                  <span style={{ fontSize: 12 }}>
                                    {file.fileName}
                                  </span>
                                  <Space size={4}>
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={<EyeOutlined />}
                                      onClick={() => handleViewFile(file)}
                                      disabled={
                                        actionLoading.saveDraft ||
                                        actionLoading.submit
                                      }
                                    />
                                    <Button
                                      size="small"
                                      type="text"
                                      danger
                                      icon={<DeleteOutlined />}
                                      onClick={() =>
                                        handleDeleteAttachment(index, file)
                                      }
                                      disabled={
                                        actionLoading.saveDraft ||
                                        actionLoading.submit
                                      }
                                    />
                                  </Space>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            No attachments
                          </Text>
                        )}
                      </Space>
                    </Form.Item>
                  </div>
                );
              })}

              {/* Add Item Button */}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                style={{ width: "100%", marginTop: 4 }}
                size="small"
                disabled={actionLoading.saveDraft || actionLoading.submit}
              >
                Add Another Expense
              </Button>
            </div>

            {/* Total Amount Display */}
            <div
              style={{
                padding: "10px 14px",
                backgroundColor: "#f0f5ff",
                borderRadius: 6,
                border: "1px solid #adc6ff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text strong style={{ fontSize: 13 }}>
                Total Amount:
              </Text>
              <Text style={{ color: "#1890ff", fontSize: 18, fontWeight: 600 }}>
                ₹
                {(() => {
                  const total = getTotalAmount();
                  return Number(total).toFixed(2);
                })()}
              </Text>
            </div>
          </div>

          {/* Fixed Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              borderTop: "1px solid #e8e8e8",
              paddingTop: 16,
              flexShrink: 0,
              backgroundColor: "#fff",
            }}
          >
            <Button
              onClick={handleSaveDraft}
              loading={actionLoading.saveDraft}
              icon={<SaveOutlined />}
              size="middle"
              disabled={actionLoading.submit}
            >
              {reimbursementId ? "Update Draft" : "Save Draft"}
            </Button>
            <Button
              onClick={handleBack}
              size="middle"
              disabled={actionLoading.saveDraft || actionLoading.submit}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={actionLoading.submit}
              size="middle"
              disabled={actionLoading.saveDraft}
            >
              {reimbursementId ? "Update & Submit" : "Submit"}
            </Button>
          </div>
        </Form>
      </Card>

      {/* File Preview Modal */}
      <Modal
        title={
          <Space>
            <span>{previewFile?.fileName || "Document Preview"}</span>
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => previewFile && handleDownloadFile(previewFile)}
            >
              Download
            </Button>
          </Space>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
        ]}
        width={1000}
        styles={{ body: { height: "80vh", padding: 0 } }}
      >
        {previewFile && (
          <iframe
            src={getIframeUrl(previewFile)}
            style={{ width: "100%", height: "100%", border: "none" }}
            title={previewFile.fileName}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            referrerPolicy="no-referrer"
            allow="autoplay *; fullscreen *"
          />
        )}
      </Modal>
    </div>
  );
}
