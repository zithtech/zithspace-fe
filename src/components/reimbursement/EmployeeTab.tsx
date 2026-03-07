


// "use client";
// import PreviewModal from "@/components/common/PreviewModal";
// import {
//   Card,
//   Table,
//   Tag,
//   Button,
//   Drawer,
//   Modal,
//   message,
//   Timeline,
//   Col,
//   Row,
//   Space,
//   Popconfirm,
// } from "antd";
// import {
//   CloseOutlined,
//   EyeOutlined,
//   DownloadOutlined,
//   TransactionOutlined,
//   PlusOutlined,
//   FilterOutlined,
//   EditOutlined,
//   UserOutlined,
//   DeleteOutlined,
// } from "@ant-design/icons";
// import { useState } from "react";
// import { useRef, useEffect } from "react";

// import { useRouter } from "next/navigation";
// import { ReimbursementRequest as Reimbursement } from "@/services/categoryService";
// import { useRequests, useDeleteRequest } from "@/hooks/useCategories";

// export default function EmployeeTab() {
//   /* ===== DATA ===== */
//   const router = useRouter();
//   const { data: requestData, isLoading: loading, refetch: reload } = useRequests({ view: 'my' });
//   const data = requestData?.data || [];
//   const { mutate: deleteRequest } = useDeleteRequest();

//   const [open, setOpen] = useState(false);
//   const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);
//   const [previewModal, setPreviewModal] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState("");
//   const [previewFileName, setPreviewFileName] = useState("");

//   const [showFilter, setShowFilter] = useState(false);
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [dateFilter, setDateFilter] = useState("");
//   const [searchText, setSearchText] = useState("");
//   const [downloadingFile, setDownloadingFile] = useState<any | null>(null);

//   const filterRef = useRef<HTMLDivElement | null>(null);

//   const handleDelete = (id: string) => {
//     deleteRequest(id);
//   };

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (
//         filterRef.current &&
//         !filterRef.current.contains(event.target as Node)
//       ) {
//         setShowFilter(false);
//       }
//     }

//     if (showFilter) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [showFilter]);

//   const getManagerStatusTag = (status: string) => {
//     switch (status) {
//       case "APPROVED":
//       case "PAID":
//       case "ON_HOLD":
//         return <span className="text-green-600 font-medium">Manager Approved</span>;
//       case "REJECTED":
//         return <span className="text-orange-600 font-medium">Manager Rejected</span>;
//       case "CLARIFY":
//         return <span className="text-blue-600 font-medium">Manager Clarification</span>;
//       default:
//         return <span className="text-orange-500 font-medium">Pending Approval</span>;
//     }
//   };

//   const getFinanceStatusTag = (status?: string, requestStatus?: string) => {
//     if (status === "PAID") {
//       return <span className="text-green-600 font-medium">Finance Paid</span>;
//     }
//     if (status === "ON_HOLD") {
//       return <span className="text-orange-600 font-medium">Finance On Hold</span>;
//     }
//     return <span className="text-orange-500 font-medium">Pending Approval</span>;
//   };

//   const employeeData = data;

//   const filteredData = employeeData.filter((r) => {
//     const search = searchText.toLowerCase();

//     return (
//       (r.category ?? "").toLowerCase().includes(search) ||
//       (r.status ?? "").toLowerCase().includes(search) ||
//       ((r as any).department || "").toLowerCase().includes(search) ||
//       String(r.amount ?? "").includes(search)
//     ) &&
//       (statusFilter === "all" || r.status === statusFilter) &&
//       (!dateFilter || r.submitted?.startsWith(dateFilter));
//   });

//   const allCategories = Array.from(new Set(employeeData.map(r => r.category)));

//   // =============================================
//   // ✅ SIMPLE & WORKING VERSION
//   // =============================================
//   const getFileUrl = (file: any): string => {
//     if (!file) return "";
    
//     // 🔥 R2 Configuration
//     const R2_BASE = "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev";
//     const R2_PATH = "b85c1b5b-77a3-4281-9147-51d6bd3ee94d/reimbursements/attachments";
    
//     // ============ CASE 1: STRING ============
//     if (typeof file === 'string') {
//       // Already full URL?
//       if (file.startsWith('http')) return file;
      
//       return `${R2_BASE}/${R2_PATH}/${file}`;
//     }
    
//     // ============ CASE 2: OBJECT ============
//     if (typeof file === 'object' && file !== null) {
//       // Try to get URL
//       const url = file.url || file.fileUrl || '';
//       if (url) {
//         if (url.startsWith('http')) return url;
//         return `${R2_BASE}/${R2_PATH}/${url}`;
//       }
      
//       // Try to get filename
//       const name = file.name || file.filename || file.fileName || '';
//       if (name) {
//         return `${R2_BASE}/${R2_PATH}/${name}`;
//       }
//     }
    
//     return '';
//   };

//   // 2. GET FILE NAME
//   const getFileName = (file: any): string => {
//     if (!file) return "file";
    
//     // Object-ல name இருந்தால்
//     if (typeof file === 'object' && file.name) {
//       return file.name;
//     }
    
//     // URL-ல இருந்து filename எடு
//     const url = getFileUrl(file);
//     if (url) {
//       const parts = url.split('/');
//       const fileName = parts.pop() || 'file';
//       // R2 URL-ல இருந்து clean filename
//       if (fileName.includes('_')) {
//         return fileName.split('_').slice(1).join('_');
//       }
//       return fileName;
//     }
    
//     return "file";
//   };

//   // 3. HANDLE PREVIEW - MODAL OPEN!
//   const handlePreview = (file: any) => {
//     const url = getFileUrl(file);
//     const fileName = getFileName(file);
    
//     if (!url) {
//       message.error("File URL not found");
//       return;
//     }
    
//     console.log("✅ Preview URL:", url);
//     setPreviewUrl(url);
//     setPreviewFileName(fileName);
//     setPreviewModal(true);
//   };

//   const handleDownload = async (file: any) => {
//     try {
//       setDownloadingFile(file);
      
//       const url = getFileUrl(file);
//       const fileName = getFileName(file);
      
//       if (!url) {
//         message.error("File URL not found");
//         return;
//       }
      
//       console.log("✅ Download URL:", url);
      
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = fileName;
//       link.click();
      
//       message.success(`Downloading ${fileName}`);
      
//     } catch (error) {
//       console.error("Download error:", error);
//       message.error("Failed to download file");
//     } finally {
//       setDownloadingFile(null);
//     }
//   };

//   const normalizeFiles = (item: any): any[] => {
//     const files: any[] = [];
//     if (!item) return files;
    
//     // Helper
//     const addIfValid = (file: any) => {
//       if (file === null || file === undefined) return;
//       if (typeof file === 'string' && !file.trim()) return;
//       if (!files.includes(file)) files.push(file);
//     };
    
//     // Check all possible locations
//     if (item.attachments) {
//       if (Array.isArray(item.attachments)) item.attachments.forEach(addIfValid);
//       else addIfValid(item.attachments);
//     }
    
//     if (item.files) {
//       if (Array.isArray(item.files)) item.files.forEach(addIfValid);
//       else addIfValid(item.files);
//     }
    
//     if (item.file) addIfValid(item.file);
    
//     return files;
//   };

//   const getFileExtension = (fileName: string) => {
//     return fileName?.split('.').pop()?.toLowerCase() || '';
//   };

//   type StatusChipProps = {
//     status: Reimbursement["status"];
//     size?: "sm" | "md";
//   };

//   const StatusChip = ({ status, size = "sm" }: StatusChipProps) => {
//     const base =
//       "rounded-full font-semibold inline-flex items-center";

//     const sizeCls =
//       size === "sm"
//         ? "px-3 py-1 text-xs"
//         : "px-4 py-1.5 text-sm";

//     const color =
//       status === "DRAFT"
//         ? "bg-gray-100 text-gray-600"
//         : status === "PENDING_APPROVAL"
//           ? "bg-orange-100 text-orange-700"
//           : status === "APPROVED"
//             ? "bg-green-100 text-green-700"
//             : status === "PAID"
//               ? "bg-blue-100 text-blue-700"
//               : "bg-red-100 text-red-700";

//     return (
//       <span className={`${base} ${sizeCls} ${color}`}>
//         {status.replace("_", " ")}
//       </span>
//     );
//   };

//   /* ===== TABLE COLUMNS ===== */
//   const columns = [
//     {
//       title: "Request ID",
//       dataIndex: "requestId",
//       render: (text: string) => <span className="font-medium">{text}</span>,
//     },
//     { 
//       title: "Category", 
//       dataIndex: "category",
//       render: (text: string) => <span className="capitalize">{text}</span>,
//     },
//     {
//       title: "Amount",
//       render: (_: any, r: Reimbursement) =>
//         <span className="font-semibold">₹{r.amount.toLocaleString("en-IN")}</span>,
//     },
//     {
//       title: "Submitted",
//       render: (_: any, r: Reimbursement) =>
//         r.status === "DRAFT" ? "—" : r.submitted,
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       render: (status: Reimbursement["status"]) => (
//         <span
//           className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold
//             ${status === "PENDING_APPROVAL"
//               ? "bg-orange-100 text-orange-700"
//               : status === "APPROVED"
//                 ? "bg-green-100 text-green-700"
//                 : status === "PAID"
//                   ? "bg-blue-100 text-blue-700"
//                   : "bg-red-100 text-red-700"
//             }
//           `}
//         >
//           {(status || "").replace("_", " ")}
//         </span>
//       ),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: Reimbursement) => (
//         <div className="flex items-center gap-2">
//           {/* VIEW */}
//           <Button
//             type="text"
//             size="middle"
//             icon={<EyeOutlined />}
//             className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
//             onClick={() => {
//               setSelectedRow(record);
//               setOpen(true);
//             }}
//           />

//           {/* EDIT */}
//           <Button
//             type="text"
//             size="middle"
//             icon={<EditOutlined />}
//             className="text-green-600 hover:text-green-700 hover:bg-green-50"
//             disabled={!['DRAFT', 'PENDING_APPROVAL', 'CLARIFY'].includes(record.status)}
//             onClick={() => {
//               router.push(`/reimburseCreate?id=${record.id}`);
//             }}
//           />

//           {/* DELETE */}
//           <Popconfirm
//             title="Delete reimbursement?"
//             description="This cannot be undone."
//             okText="Delete"
//             cancelText="Cancel"
//             disabled={!['DRAFT', 'PENDING_APPROVAL'].includes(record.status)}
//             okType="danger"
//             onConfirm={() => handleDelete(record.id)}
//           >
//             <Button
//               type="text"
//               danger
//               size="middle"
//               disabled={!['DRAFT', 'PENDING_APPROVAL'].includes(record.status)}
//               icon={<DeleteOutlined />}
//               className="hover:bg-red-50"
//             />
//           </Popconfirm>
//         </div>
//       ),
//     },
//   ];

//   return (
//     // <Card className="rounded-xl shadow-md bg-white min-h-[600px] flex flex-col border border-gray-100">
//       <div className="space-y-4 p-2">

//         <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//           {/* LEFT SIDE */}
//           <div className="space-y-2">
//             <h2 className="text-xl font-semibold text-gray-900">
//               <Space>
//                 <UserOutlined className="text-blue-600" />
//                 <span>My Reimbursements</span>
//               </Space>
//             </h2>

//             <p className="text-sm text-gray-500">
//               Track, review, and manage your reimbursement requests and expense claims.
//             </p>

//             {/* ✅ CHIPS JUST BELOW DESCRIPTION */}
//             <div className="flex flex-wrap gap-2 pt-1">
//               {/* TOTAL SUBMITTED */}
//               <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
//                 Total: {employeeData.length}
//               </div>

//               {/* PENDING */}
//               <div className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
//                 Pending: {employeeData.filter(d => d.status === "PENDING_APPROVAL").length}
//               </div>

//               {/* APPROVED */}
//               <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
//                 Approved: {employeeData.filter(d => d.status === "APPROVED").length}
//               </div>

//               {/* PAID */}
//               <div className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
//                 Paid: ₹{employeeData
//                   .filter(d => d.status === "PAID")
//                   .reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString("en-IN")}
//               </div>
//             </div>
//           </div>

//           {/* RIGHT SIDE – SEARCH + CREATE */}
//           <div className="flex items-center gap-3">
//             {/* SEARCH */}
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search requests..."
//                 value={searchText}
//                 onChange={(e) => setSearchText(e.target.value)}
//                 className="w-56 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-gray-50/50"
//               />
//             </div>

//             <div className="relative" ref={filterRef}>
//               <Button
//                 icon={<FilterOutlined />}
//                 onClick={() => setShowFilter((prev) => !prev)}
//                 className={`
//                   flex items-center gap-2 px-4 py-2 h-auto rounded-lg border text-sm font-medium
//                   ${showFilter ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}
//                 `}
//               >
//                 Filter
//               </Button>

//               {/* FILTER DROPDOWN */}
//               {showFilter && (
//                 <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
//                   <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
//                     <span className="font-semibold text-gray-800">Filter Reimbursements</span>
//                     <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-gray-600" />
//                   </div>

//                   <div className="space-y-4">
//                     <div>
//                       <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
//                       <select
//                         value={statusFilter}
//                         onChange={(e) => setStatusFilter(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none bg-white"
//                       >
//                         <option value="all">All Status</option>
//                         <option value="PENDING_APPROVAL">Pending</option>
//                         <option value="APPROVED">Approved</option>
//                         <option value="REJECTED">Rejected</option>
//                         <option value="PAID">Paid</option>
//                       </select>
//                     </div>

//                     <div>
//                       <label className="block text-xs font-medium text-gray-500 mb-1">Submitted Date</label>
//                       <input
//                         type="date"
//                         value={dateFilter}
//                         onChange={(e) => setDateFilter(e.target.value)}
//                         className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
//                       />
//                     </div>
//                   </div>

//                   <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
//                     <Button
//                       onClick={() => { setStatusFilter("all"); setDateFilter(""); setSearchText(""); }}
//                       className="text-sm px-4 py-1 border-transparent hover:bg-gray-100 text-gray-500"
//                     >
//                       Reset
//                     </Button>
//                     <Button
//                       type="primary"
//                       onClick={() => setShowFilter(false)}
//                       className="text-sm px-5 py-1 bg-blue-600 hover:bg-blue-700 border-none shadow-sm"
//                     >
//                       Apply
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </div>

//             <Button
//               type="primary"
//               size="large"
//               icon={<PlusOutlined />}
//               className="h-10 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-2"
//               onClick={() => router.push("/reimburseCreate")}
//             >
//               Create New
//             </Button>
//           </div>
//         </div>

//         {/* ===== TABLE ===== */}
//         <style jsx global>{`
//           .medium-table .ant-table-thead > tr > th {
//             padding: 12px 16px !important;
//             font-size: 13px !important;
//             font-weight: 600 !important;
//             background-color: #fafafa !important;
//             border-bottom: 2px solid #f0f0f0 !important;
//           }
          
//           .medium-table .ant-table-tbody > tr > td {
//             padding: 12px 16px !important;
//             font-size: 13px !important;
//           }
          
//           .medium-table .ant-table-tbody > tr:hover > td {
//             background-color: #f5f9ff !important;
//           }
          
//           .medium-table .ant-btn {
//             height: 32px !important;
//             width: 32px !important;
//           }
          
//           .medium-table .ant-pagination {
//             margin-top: 16px !important;
//             margin-bottom: 8px !important;
//           }
          
//           .medium-table .ant-pagination-item {
//             border-radius: 8px !important;
//           }
          
//           .medium-table .ant-pagination-item-active {
//             border-color: #3b82f6 !important;
//           }
          
//           .medium-table .ant-pagination-item-active a {
//             color: #3b82f6 !important;
//           }
//         `}</style>

//         <div className="flex-1 overflow-hidden">
//           <Table
//             className="medium-table"
//             rowKey="id"
//             columns={columns}
//             dataSource={filteredData}
//             loading={loading}
//             pagination={{
//               pageSize: 8,
//               showSizeChanger: true,
//               showQuickJumper: true,
//               showTotal: (total) => `Total ${total} items`,
//               position: ["bottomRight"],
//             }}
//           />
//         </div>

//         {/* ===== DRAWER ===== */}
//         <Drawer
//           title={
//             <div className="pb-4">
//               <div className="flex items-center justify-between">
//                 <div className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   #{selectedRow?.requestId || "REQ-0000"}
//                 </div>
//                 <div className="flex items-center gap-3">
//                   <Tag
//                     color={
//                       selectedRow?.status === "APPROVED"
//                         ? "green"
//                         : selectedRow?.status === "REJECTED"
//                           ? "red"
//                           : "orange"
//                     }
//                     className="rounded-full px-4 py-1.5 text-xs font-medium border-0"
//                   >
//                     {selectedRow?.status || "PENDING"}
//                   </Tag>
//                   <CloseOutlined
//                     className="cursor-pointer text-gray-500 hover:text-gray-900 text-base transition-colors"
//                     onClick={() => setOpen(false)}
//                   />
//                 </div>
//               </div>
//             </div>
//           }
//           placement="right"
//           width={500}
//           closeIcon={null}
//           open={open}
//           styles={{
//             body: { padding: 20 },
//             header: { padding: '20px 24px 0' }
//           }}
//         >
//           {selectedRow && (
//             <div className="text-sm text-gray-700 h-full flex flex-col">
//               {/* COMPACT SUMMARY - FIXED HEIGHT */}
//               <div className="flex-shrink-0">
//                 <div className="mb-3 font-semibold text-lg text-gray-900">Request Summary</div>
//                 <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 p-5 border border-slate-200 space-y-3 shadow-sm">
//                   {[
//                     ["Category", selectedRow.category],
//                     ["Total Amount", `₹${selectedRow.amount}`],
//                     ["Employee", selectedRow.employee?.name || (selectedRow as any).user?.name],
//                     ["Department", (selectedRow as any).department || selectedRow.employee?.department || (selectedRow as any).user?.department || (selectedRow as any).user?.position || "N/A"],
//                     ["Submitted", selectedRow.submitted],
//                     ["Created", selectedRow.created],
//                   ].map(([label, value], i) => (
//                     <div key={i} className="flex justify-between text-sm py-1.5 px-2 hover:bg-slate-100 rounded-lg transition-colors">
//                       <span className="text-gray-500 font-medium">{label}</span>
//                       <span className="font-semibold text-gray-900">{value}</span>
//                     </div>
//                   ))}

//                   {/* 🔹 MANAGER STATUS */}
//                   <div className="flex justify-between text-sm py-1.5 px-2">
//                     <span className="text-gray-500 font-medium">Manager Status</span>
//                     <span className="font-semibold">{getManagerStatusTag(selectedRow.status)}</span>
//                   </div>

//                   {/* 🔹 FINANCE STATUS */}
//                   <div className="flex justify-between text-sm py-1.5 px-2">
//                     <span className="text-gray-500 font-medium">Finance Status</span>
//                     <span className="font-semibold">{getFinanceStatusTag(selectedRow.financeStatus, selectedRow.status)}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* ================= ONLY SCROLLABLE AREA ================= */}
//               <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-6">
//                 {/* EXPENSE ITEMS */}
//                 <div>
//                   <div className="mb-3 font-semibold text-lg text-gray-900">
//                     Expense Items ({selectedRow.expenseItems?.length || 0})
//                   </div>
//                   <div className="space-y-3">
//                     {selectedRow.expenseItems?.map((item, i) => {
//                       const files = normalizeFiles(item);
//                       const showFiles = files.slice(0, 4);
//                       const hasMoreFiles = files.length > 4;

//                       return (
//                         <div key={i} className="group flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all">
//                           <div className="flex-1 min-w-0">
//                             <div className="font-semibold text-base group-hover:text-blue-700 transition-colors truncate">{item.title}</div>
//                             <div className="text-sm text-gray-500 mt-1">{item.date} • ₹{item.amount}</div>
//                           </div>

//                           {files.length > 0 && (
//                             <div className="space-y-2 min-w-[200px]">
//                               {showFiles.map((file, idx) => (
//                                 <div
//                                   key={idx}
//                                   className="flex items-center justify-between bg-white p-2 rounded-lg text-sm shadow-sm hover:shadow-md transition-all border border-slate-100 h-10"
//                                 >
//                                   <span className="truncate font-medium text-gray-800 max-w-[100px]">
//                                     {getFileName(file)}
//                                   </span>
//                                   <div className="flex gap-1">
//                                     <Button
//                                       size="small"
//                                       type="text"
//                                       disabled={!!downloadingFile}
//                                       className="!p-1 w-7 h-7 text-gray-600 hover:text-blue-600 flex items-center justify-center"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         handlePreview(file);
//                                       }}
//                                     >
//                                       <EyeOutlined />
//                                     </Button>
//                                     <Button
//                                       size="small"
//                                       type="text"
//                                       loading={downloadingFile === file}
//                                       disabled={!!downloadingFile && downloadingFile !== file}
//                                       className="!p-1 w-7 h-7 text-gray-600 hover:text-green-600 flex items-center justify-center"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         handleDownload(file);
//                                       }}
//                                     >
//                                       {downloadingFile !== file && <DownloadOutlined />}
//                                     </Button>
//                                   </div>
//                                 </div>
//                               ))}
//                               {hasMoreFiles && (
//                                 <div className="pt-1">
//                                   <Button
//                                     size="small"
//                                     type="link"
//                                     className="p-0 text-sm text-blue-600 hover:text-blue-700 font-medium h-auto"
//                                   >
//                                     +{files.length - 4} more files
//                                   </Button>
//                                 </div>
//                               )}
//                             </div>
//                           )}
//                         </div>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 {/* ACTIVITY LOG */}
//                 <div>
//                   <div className="mb-3 font-semibold text-lg text-gray-900">Activity Log</div>
//                   <Timeline>
//                     {selectedRow.activityLog.slice(-4).map((log, i) => (
//                       <Timeline.Item key={i}>
//                         <div className="text-sm font-semibold text-gray-700">{log.action}</div>
//                         {log.note && (
//                           <div className="text-sm text-gray-500 italic mt-1">"{log.note}"</div>
//                         )}
//                         <div className="text-xs text-gray-400 mt-1">{log.date}</div>
//                       </Timeline.Item>
//                     ))}
//                   </Timeline>
//                 </div>
//               </div>
//             </div>
//           )}
//         </Drawer>

//         {/* ===== PREVIEW MODAL ===== */}
//         <PreviewModal
//           open={previewModal}
//           onCancel={() => setPreviewModal(false)}
//           previewUrl={previewUrl}
//           previewFileName={previewFileName}
//         />
//       </div>
//   );
// }






// "use client";
// import { Button } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";

// export default function EmployeeTab() {
//   const router = useRouter();
  
//   return (
//     <div className="space-y-4 p-2">
//       {/* Header with Create Button */}
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//         <div className="space-y-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>

//         {/* CREATE BUTTON */}
//         <div className="flex items-center gap-3">
//           <Button
//             type="primary"
//             size="large"
//             icon={<PlusOutlined />}
//             className="h-10 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-2"
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }





// "use client";
// import { Button, Table, Tag } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements } from "@/hooks/usereimbursementcreate";
// import dayjs from "dayjs";

// interface ReimbursementRequest {
//   id: string;
//   requestId: string;
//   category: string;
//   amount: number;
//   description?: string;
//   status: string;
//   submitted?: string;
//   created: string;
//   expenseItems?: Array<{
//     date: string;
//     category: string;
//     description: string;
//     amount: number;
//     billNo?: string;
//   }>;
// }

// export default function EmployeeTab() {
//   const router = useRouter();
  
//   // Fetch data from hooks
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading 
//   } = useAllReimbursements();

//   // Table columns
//   const columns = [
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: ReimbursementRequest) => {
//         // Get category from main request or first expense item
//         return record.category || record.expenseItems?.[0]?.category || 'N/A';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       render: (_: any, record: ReimbursementRequest) => {
//         // Get date from expense item or request
//         const date = record.expenseItems?.[0]?.date || record.submitted || record.created;
//         return date ? dayjs(date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: ReimbursementRequest) => {
//         const amount = record.amount || record.expenseItems?.[0]?.amount || 0;
//         return <span>₹{amount.toLocaleString("en-IN")}</span>;
//       },
//     },
//     {
//       title: "Bill No.",
//       key: "billNo",
//       render: (_: any, record: ReimbursementRequest) => {
//         const billNo = record.expenseItems?.[0]?.billNo;
//         return billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       render: (_: any, record: ReimbursementRequest) => {
//         return record.description || record.expenseItems?.[0]?.description || '—';
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: ReimbursementRequest) => {
//         // Show only Draft or Submit
//         const status = record.status;
//         if (status === 'DRAFT') {
//           return <Tag color="default">Draft</Tag>;
//         } else {
//           return <Tag color="blue">Submit</Tag>;
//         }
//       },
//     },
//   ];

//   return (
//     <div className="space-y-4 p-2">
//       {/* Header with Create Button */}
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//         <div className="space-y-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>

//         {/* CREATE BUTTON */}
//         <div className="flex items-center gap-3">
//           <Button
//             type="primary"
//             size="large"
//             icon={<PlusOutlined />}
//             className="h-10 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-2"
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </div>
//       </div>

//       {/* Table */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={reimbursements}
//         loading={loading}
//         pagination={{
//           pageSize: 10,
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} items`,
//         }}
//       />
//     </div>
//   );
// }


// "use client";
// import { Button, Table, Tag } from "antd";
// import { PlusOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";

// export default function EmployeeTab() {
//   const router = useRouter();
  
//   // Fetch data from hooks
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading 
//   } = useAllReimbursements();

//   console.log('📊 Raw reimbursements data:', reimbursements);

//   // Table columns using the actual data structure
//   const columns = [
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get category from first item in items array
//         return record.items?.[0]?.category || 'N/A';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get date from first item or use createdAt
//         const date = record.items?.[0]?.date || record.createdAt;
//         return date ? dayjs(date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Use totalAmount from the response
//         const amount = record.totalAmount || 0;
//         return <span>₹{Number(amount).toLocaleString("en-IN")}</span>;
//       },
//     },
//     {
//       title: "Bill No.",
//       key: "billNo",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get billNo from first item
//         const billNo = record.items?.[0]?.billNo;
//         return billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get description from first item
//         const description = record.items?.[0]?.description;
        
//         // If there are multiple items, show count
//         if (record.items && record.items.length > 1) {
//           return (
//             <div>
//               <div>{description || '—'}</div>
//               <div className="text-xs text-gray-500">+{record.items.length - 1} more items</div>
//             </div>
//           );
//         }
        
//         return description || '—';
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;
//         if (status === 'DRAFT') {
//           return <Tag color="default">Draft</Tag>;
//         } else {
//           return <Tag color="blue">Submitted</Tag>;
//         }
//       },
//     },
//   ];

//   return (
//     <div className="space-y-4 p-2">
//       {/* Header with Create Button */}
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//         <div className="space-y-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>

//         {/* CREATE BUTTON */}
//         <div className="flex items-center gap-3">
//           <Button
//             type="primary"
//             size="large"
//             icon={<PlusOutlined />}
//             className="h-10 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-2"
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </div>
//       </div>

//       {/* Table */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={reimbursements}
//         loading={loading}
//         pagination={{
//           pageSize: 10,
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} items`,
//         }}
//       />
//     </div>
//   );
// }













// "use client";
// import { Button, Table, Tag, Popconfirm, message } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";

// export default function EmployeeTab() {
//   const router = useRouter();
  
//   // Fetch data from hooks
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch // Add refetch to refresh data after delete
//   } = useAllReimbursements();

//   console.log('📊 Raw reimbursements data:', reimbursements);

//   // Handle delete function
//   const handleDelete = async (id: string) => {
//     try {
//       // Call your delete API here
//       // const response = await deleteReimbursement(id);
      
//       // For now, showing success message
//       message.success('Reimbursement deleted successfully');
      
//       // Refetch the data to update the list
//       refetch();
//     } catch (error) {
//       message.error('Failed to delete reimbursement');
//       console.error('Delete error:', error);
//     }
//   };

//   // Handle edit function
//   const handleEdit = (id: string) => {
//     // Navigate to reimbursement create page with the ID for editing
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Table columns using the actual data structure
//   const columns = [
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get category from first item in items array
//         return record.items?.[0]?.category || 'N/A';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get date from first item or use createdAt
//         const date = record.items?.[0]?.date || record.createdAt;
//         return date ? dayjs(date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Use totalAmount from the response
//         const amount = record.totalAmount || 0;
//         return <span>₹{Number(amount).toLocaleString("en-IN")}</span>;
//       },
//     },
//     {
//       title: "Bill No.",
//       key: "billNo",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get billNo from first item
//         const billNo = record.items?.[0]?.billNo;
//         return billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get description from first item
//         const description = record.items?.[0]?.description;
        
//         // If there are multiple items, show count
//         if (record.items && record.items.length > 1) {
//           return (
//             <div>
//               <div>{description || '—'}</div>
//               <div className="text-xs text-gray-500">+{record.items.length - 1} more items</div>
//             </div>
//           );
//         }
        
//         return description || '—';
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;
//         if (status === 'DRAFT') {
//           return <Tag color="default">Draft</Tag>;
//         } else {
//           return <Tag color="blue">Submitted</Tag>;
//         }
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_: any, record: ReimbursementResponse) => (
//         <div className="flex gap-2">
//           {/* Edit Button - Only show for DRAFT status or always show based on your requirement */}
//           <Button
//             type="text"
//             icon={<EditOutlined />}
//             className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//             onClick={() => handleEdit(record.id)}
//             //disabled={record.status !== 'DRAFT'} // Optional: Disable edit for non-draft items
//           />
          
//           {/* Delete Button with Popconfirm */}
//           <Popconfirm
//             title="Delete Reimbursement"
//             description="Are you sure you want to delete this reimbursement? This action cannot be undone."
//             onConfirm={() => handleDelete(record.id)}
//             okText="Yes, Delete"
//             cancelText="Cancel"
//             okButtonProps={{ danger: true }}
//           >
//             <Button
//               type="text"
//               icon={<DeleteOutlined />}
//               className="text-red-600 hover:text-red-800 hover:bg-red-50"
//               danger
//             />
//           </Popconfirm>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="space-y-4 p-2">
//       {/* Header with Create Button */}
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//         <div className="space-y-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>

//         {/* CREATE BUTTON */}
//         <div className="flex items-center gap-3">
//           <Button
//             type="primary"
//             size="large"
//             icon={<PlusOutlined />}
//             className="h-10 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-2"
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </div>
//       </div>

//       {/* Table */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={reimbursements}
//         loading={loading}
//         pagination={{
//           pageSize: 10,
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} items`,
//         }}
//       />
//     </div>
//   );
// }






// "use client";
// import { Button, Table, Tag, Popconfirm, message } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";

// export default function EmployeeTab() {
//   const router = useRouter();
  
//   // Fetch data from hooks
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch // Add refetch to refresh data after delete
//   } = useAllReimbursements();

//   console.log('📊 Raw reimbursements data:', reimbursements);

//   // Handle delete function
//   const handleDelete = async (id: string) => {
//     try {
//       // Call your delete API here
//       // const response = await deleteReimbursement(id);
      
//       // For now, showing success message
//       message.success('Reimbursement deleted successfully');
      
//       // Refetch the data to update the list
//       refetch();
//     } catch (error) {
//       message.error('Failed to delete reimbursement');
//       console.error('Delete error:', error);
//     }
//   };

//   // Handle edit function
//   const handleEdit = (id: string) => {
//     // Navigate to reimbursement create page with the ID for editing
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Table columns using the actual data structure
//   const columns = [
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get category from first item in items array
//         return record.items?.[0]?.category || 'N/A';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get date from first item or use createdAt
//         const date = record.items?.[0]?.date || record.createdAt;
//         return date ? dayjs(date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Use totalAmount from the response
//         const amount = record.totalAmount || 0;
//         return <span>₹{Number(amount).toLocaleString("en-IN")}</span>;
//       },
//     },
//     {
//       title: "Bill No.",
//       key: "billNo",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get billNo from first item
//         const billNo = record.items?.[0]?.billNo;
//         return billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       render: (_: any, record: ReimbursementResponse) => {
//         // Get description from first item
//         const description = record.items?.[0]?.description;
        
//         // If there are multiple items, show count
//         if (record.items && record.items.length > 1) {
//           return (
//             <div>
//               <div>{description || '—'}</div>
//               <div className="text-xs text-gray-500">+{record.items.length - 1} more items</div>
//             </div>
//           );
//         }
        
//         return description || '—';
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;
//         if (status === 'DRAFT') {
//           return <Tag color="default">Draft</Tag>;
//         } else {
//           return <Tag color="blue">Submitted</Tag>;
//         }
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_: any, record: ReimbursementResponse) => (
//         <div className="flex gap-2">
//           {/* Edit Button - Enabled for all statuses */}
//           <Button
//             type="text"
//             icon={<EditOutlined />}
//             className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//             onClick={() => handleEdit(record.id)}
//           />
          
//           {/* Delete Button with Popconfirm */}
//           <Popconfirm
//             title="Delete Reimbursement"
//             description="Are you sure you want to delete this reimbursement? This action cannot be undone."
//             onConfirm={() => handleDelete(record.id)}
//             okText="Yes, Delete"
//             cancelText="Cancel"
//             okButtonProps={{ danger: true }}
//           >
//             <Button
//               type="text"
//               icon={<DeleteOutlined />}
//               className="text-red-600 hover:text-red-800 hover:bg-red-50"
//               danger
//             />
//           </Popconfirm>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="space-y-4 p-2">
//       {/* Header with Create Button */}
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//         <div className="space-y-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>

//         {/* CREATE BUTTON */}
//         <div className="flex items-center gap-3">
//           <Button
//             type="primary"
//             size="large"
//             icon={<PlusOutlined />}
//             className="h-10 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-2"
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </div>
//       </div>

//       {/* Table */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={reimbursements}
//         loading={loading}
//         pagination={{
//           pageSize: 10,
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} items`,
//         }}
//       />
//     </div>
//   );
// }









// "use client";
// import { Button, Table, Tag, Popconfirm, message } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";

// export default function EmployeeTab() {
//   const router = useRouter();
  
//   // Fetch data from hooks
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//   } = useAllReimbursements();

//   // Delete mutation hook
//   const deleteMutation = useDeleteReimbursement();

//   console.log('📊 Raw reimbursements data:', reimbursements);

//   // Handle delete function
//   const handleDelete = async (id: string) => {
//     try {
//       // Call the delete mutation
//       await deleteMutation.mutateAsync(id);
//       // No need to refetch manually - the query invalidation in onSuccess will handle it
//     } catch (error) {
//       console.error('Delete error:', error);
//     }
//   };

//   // Handle edit function
//   const handleEdit = (id: string) => {
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Table columns using the actual data structure
//   const columns = [
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: ReimbursementResponse) => {
//         return record.items?.[0]?.category || 'N/A';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       render: (_: any, record: ReimbursementResponse) => {
//         const date = record.items?.[0]?.date || record.createdAt;
//         return date ? dayjs(date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: ReimbursementResponse) => {
//         const amount = record.totalAmount || 0;
//         return <span>₹{Number(amount).toLocaleString("en-IN")}</span>;
//       },
//     },
//     {
//       title: "Bill No.",
//       key: "billNo",
//       render: (_: any, record: ReimbursementResponse) => {
//         const billNo = record.items?.[0]?.billNo;
//         return billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       render: (_: any, record: ReimbursementResponse) => {
//         const description = record.items?.[0]?.description;
        
//         if (record.items && record.items.length > 1) {
//           return (
//             <div>
//               <div>{description || '—'}</div>
//               <div className="text-xs text-gray-500">+{record.items.length - 1} more items</div>
//             </div>
//           );
//         }
        
//         return description || '—';
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;
//         if (status === 'DRAFT') {
//           return <Tag color="default">Draft</Tag>;
//         } else {
//           return <Tag color="blue">Submitted</Tag>;
//         }
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       render: (_: any, record: ReimbursementResponse) => (
//         <div className="flex gap-2">
//           <Button
//             type="text"
//             icon={<EditOutlined />}
//             className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
//             onClick={() => handleEdit(record.id)}
//             disabled={deleteMutation.isPending} // Disable while deleting
//           />
          
//           <Popconfirm
//             title="Delete Reimbursement"
//             description="Are you sure you want to delete this reimbursement?"
//             onConfirm={() => handleDelete(record.id)}
//             okText="Yes, Delete"
//             cancelText="Cancel"
//             okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
//           >
//             <Button
//               type="text"
//               icon={<DeleteOutlined />}
//               className="text-red-600 hover:text-red-800 hover:bg-red-50"
//               danger
//               disabled={deleteMutation.isPending} // Disable while deleting
//             />
//           </Popconfirm>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="space-y-4 p-2">
//       {/* Header with Create Button */}
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//         <div className="space-y-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>

//         {/* CREATE BUTTON */}
//         <div className="flex items-center gap-3">
//           <Button
//             type="primary"
//             size="large"
//             icon={<PlusOutlined />}
//             className="h-10 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-2"
//             onClick={() => router.push("/reimburseCreate")}
//             disabled={deleteMutation.isPending}
//           >
//             Create New
//           </Button>
//         </div>
//       </div>

//       {/* Table */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={reimbursements}
//         loading={loading || deleteMutation.isPending}
//         pagination={{
//           pageSize: 10,
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} items`,
//         }}
//       />
//     </div>
//   );
// }table change panna pora below



// "use client";
// import { Button, Table, Tag, Popconfirm, Space, Input } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useState, useMemo } from "react";

// export default function EmployeeTab() {
//   const router = useRouter();
//   const [searchText, setSearchText] = useState("");
  
//   // Fetch data from hooks
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch
//   } = useAllReimbursements();

//   const deleteMutation = useDeleteReimbursement();

//   console.log('📊 Raw reimbursements data:', reimbursements);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return reimbursements;
    
//     return reimbursements.filter((record: ReimbursementResponse) => {
//       const category = record.items?.[0]?.category || '';
//       const billNo = record.items?.[0]?.billNo || '';
//       const description = record.items?.[0]?.description || '';
//       const status = record.status || '';
      
//       return category.toLowerCase().includes(searchText.toLowerCase()) ||
//              billNo.toLowerCase().includes(searchText.toLowerCase()) ||
//              description.toLowerCase().includes(searchText.toLowerCase()) ||
//              status.toLowerCase().includes(searchText.toLowerCase());
//     });
//   }, [reimbursements, searchText]);

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteMutation.mutateAsync(id);
//     } catch (error) {
//       console.error('Delete error:', error);
//     }
//   };

//   const handleEdit = (id: string) => {
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Calculate totals
//   const totalAmount = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
//   }, [reimbursements]);

//   const totalItems = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
//   }, [reimbursements]);

//   // Table columns - UI only changed, words same
//   const columns = [
//     {
//       title: "Category", // Same word
//       key: "category",
//       render: (_: any, record: ReimbursementResponse) => {
//         const category = record.items?.[0]?.category || 'N/A';
//         return <Tag color="blue">{category}</Tag>;
//       },
//     },
//     {
//       title: "Date", // Same word
//       key: "date",
//       render: (_: any, record: ReimbursementResponse) => {
//         const date = record.items?.[0]?.date || record.createdAt;
//         return date ? dayjs(date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount", // Same word
//       key: "amount",
//       render: (_: any, record: ReimbursementResponse) => {
//         const amount = Number(record.items?.[0]?.amount || 0);
//         return <span>₹{amount.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Bill No.", // Same word
//       key: "billNo",
//       render: (_: any, record: ReimbursementResponse) => {
//         const billNo = record.items?.[0]?.billNo;
//         return billNo || '—';
//       },
//     },
//     {
//       title: "Description", // Same word
//       key: "description",
//       render: (_: any, record: ReimbursementResponse) => {
//         const description = record.items?.[0]?.description;
        
//         if (record.items && record.items.length > 1) {
//           return (
//             <div>
//               <div>{description || '—'}</div>
//               <div className="text-xs text-gray-500">+{record.items.length - 1} more items</div>
//             </div>
//           );
//         }
        
//         return description || '—';
//       },
//     },
//     // {
//     //   title: "Status", // Same word
//     //   key: "status",
//     //   render: (_: any, record: ReimbursementResponse) => {
//     //     const status = record.status;
//     //     if (status === 'DRAFT') {
//     //       return <Tag color="default">Draft</Tag>; // Same word
//     //     } else {
//     //       return <Tag color="blue">Submitted</Tag>; // Same word
//     //     }
//     //   },
//     // },
//     {
//   title: "Status",
//   key: "status",
//   render: (_: any, record: ReimbursementResponse) => {
//     const status = record.status;

//     if (status === "DRAFT") {
//       return <Tag>Draft</Tag>;
//     }

//     if (status === "SUBMITTED") {
//       return <Tag color="blue">Submitted</Tag>;
//     }

//     if (status === "APPROVED") {
//       return <Tag color="green">Approved</Tag>;
//     }

//     if (status === "REJECTED") {
//       return <Tag color="red">Rejected</Tag>;
//     }

//     if (status === "PAID") {
//       return <Tag color="purple">Paid</Tag>;
//     }

//     return <Tag>{status}</Tag>;
//   },
// },
//     {
//       title: "Actions", // Same word
//       key: "actions",
//       render: (_: any, record: ReimbursementResponse) => (
//         <Space size={4}>
//           <Button 
//             type="text" 
//             size="small" 
//             icon={<EditOutlined />} 
//             onClick={() => handleEdit(record.id)}
//             disabled={deleteMutation.isPending}
//           />
//           <Popconfirm
//             title="Delete Reimbursement"
//             description="Are you sure you want to delete this reimbursement?"
//             onConfirm={() => handleDelete(record.id)}
//             okText="Yes, Delete"
//             cancelText="Cancel"
//             okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
//           >
//             <Button 
//               type="text" 
//               size="small" 
//               danger 
//               icon={<DeleteOutlined />}
//               disabled={deleteMutation.isPending}
//             />
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header with same words */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <span className="text-2xl"></span>
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements {/* Same word */}
//           </h2>
//         </div>
        
//         <Space size={8}>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={loading}
//             size="small"
//           />
//           <Input.Search
//             placeholder="Search..."
//             allowClear
//             size="small"
//             style={{ width: 200 }}
//             onChange={(e) => setSearchText(e.target.value)}
//           />
//           <Button
//             type="primary"
//             size="small"
//             icon={<PlusOutlined />}
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New {/* Same word */}
//           </Button>
//         </Space>
//       </div>

//       {/* Summary tags - UI only */}
//       <div className="flex gap-1.5 mb-3">
//   <Tag color="blue" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//     Total Reimbursements: {reimbursements.length}
//   </Tag>
  
//   <Tag color="green" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//     Total Items: {totalItems}
//   </Tag>
  
//   <Tag color="purple" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//     Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//   </Tag>
// </div>

//       {/* Table */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || deleteMutation.isPending}
//         size="small"
//         bordered
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} items`,
//         }}
//       />
//     </div>
//   );
// }working good 



// "use client";
// import { Button, Table, Tag, Popconfirm, Space, Input } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useState, useMemo } from "react";

// export default function EmployeeTab() {
//   const router = useRouter();
//   const [searchText, setSearchText] = useState("");
//   const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch
//   } = useAllReimbursements();

//   const deleteMutation = useDeleteReimbursement();

//   console.log('📊 Raw reimbursements data:', reimbursements);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return reimbursements;
    
//     return reimbursements.filter((record: ReimbursementResponse) => {
//       // Search in parent
//       const parentMatch = record.status?.toLowerCase().includes(searchText.toLowerCase()) ||
//                          record.totalAmount?.toString().includes(searchText);
      
//       // Search in child items
//       const childMatch = record.items?.some(item => 
//         item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.description?.toLowerCase().includes(searchText.toLowerCase())
//       );
      
//       return parentMatch || childMatch;
//     });
//   }, [reimbursements, searchText]);

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteMutation.mutateAsync(id);
//     } catch (error) {
//       console.error('Delete error:', error);
//     }
//   };

//   const handleEdit = (id: string) => {
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Calculate totals
//   const totalAmount = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
//   }, [reimbursements]);

//   const totalItems = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
//   }, [reimbursements]);

//   // Expanded row renderer for child items
//   const expandedRowRender = (record: ReimbursementResponse) => {
//     const items = record.items || [];
    
//     if (items.length === 0) {
//       return <div className="text-gray-400 py-4 text-center">No items found</div>;
//     }
    
//     // Child table columns
//     const childColumns = [
//       {
//         title: "Category",
//         key: "category",
//         width: 120,
//         render: (_: any, item: any) => <Tag color="blue">{item.category}</Tag>,
//       },
//       {
//         title: "Date",
//         key: "date",
//         width: 120,
//         render: (_: any, item: any) => dayjs(item.date).format('DD MMM YYYY'),
//       },
//       {
//         title: "Amount",
//         key: "amount",
//         width: 100,
//         render: (_: any, item: any) => <span className="font-semibold">₹{Number(item.amount).toFixed(2)}</span>,
//       },
//       {
//         title: "Bill No",
//         dataIndex: "billNo",
//         key: "billNo",
//         width: 100,
//       },
//       {
//         title: "Description",
//         dataIndex: "description",
//         key: "description",
//         ellipsis: true,
//       },
//       {
//         title: "Attachments",
//         key: "attachments",
//         width: 100,
//         render: (_: any, item: any) => {
//           const count = item.attachments?.length || 0;
//           return count > 0 ? <Tag color="green">{count} file(s)</Tag> : <Tag color="default">0</Tag>;
//         },
//       },
//     ];
    
//     return (
//       <div className="pl-8 pr-4 py-2 bg-gray-50">
//         <h4 className="text-sm font-medium text-gray-700 mb-2">Reimbursement Items:</h4>
//         <Table
//           columns={childColumns}
//           dataSource={items}
//           rowKey={(item) => item.id || `item-${Math.random()}`}
//           pagination={false}
//           size="small"
//           bordered={false}
//           className="child-table"
//         />
//       </div>
//     );
//   };

//   // Parent table columns
//   const columns = [
//     {
//       title: "Reimbursement ID",
//       key: "id",
//       width: 200,
//       render: (_: any, record: ReimbursementResponse) => (
//         <span className="font-mono text-xs">{record.id.substring(0, 8)}...</span>
//       ),
//     },
//     {
//       title: "Created Date",
//       key: "createdAt",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => dayjs(record.createdAt).format('DD MMM YYYY'),
//     },
//     {
//       title: "Total Amount",
//       key: "totalAmount",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => (
//         <span className="font-semibold">₹{Number(record.totalAmount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Items Count",
//       key: "itemsCount",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => (
//         <Tag color={record.items?.length > 0 ? "blue" : "default"}>
//           {record.items?.length || 0} items
//         </Tag>
//       ),
//     },
//     {
//       title: "Status",
//       key: "status",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;

//         if (status === "DRAFT") return <Tag>Draft</Tag>;
//         if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
//         if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
//         if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
//         if (status === "PAID") return <Tag color="purple">Paid</Tag>;
        
//         return <Tag>{status}</Tag>;
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => (
//         <Space size={4}>
//           <Button 
//             type="text" 
//             size="small" 
//             icon={<EditOutlined />} 
//             onClick={() => handleEdit(record.id)}
//             disabled={deleteMutation.isPending || record.status !== "DRAFT"}
//           />
//           <Popconfirm
//             title="Delete Reimbursement"
//             description="Are you sure you want to delete this reimbursement?"
//             onConfirm={() => handleDelete(record.id)}
//             okText="Yes, Delete"
//             cancelText="Cancel"
//             okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
//           >
//             <Button 
//               type="text" 
//               size="small" 
//               danger 
//               icon={<DeleteOutlined />}
//               disabled={deleteMutation.isPending || record.status !== "DRAFT"}
//             />
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>
        
//         <Space size={8}>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={loading}
//             size="small"
//           />
//           <Input.Search
//             placeholder="Search by category, bill no, status..."
//             allowClear
//             size="small"
//             style={{ width: 250 }}
//             onChange={(e) => setSearchText(e.target.value)}
//           />
//           <Button
//             type="primary"
//             size="small"
//             icon={<PlusOutlined />}
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </Space>
//       </div>

//       {/* Summary tags */}
//       <div className="flex gap-1.5 mb-3">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {totalItems}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Parent Table with Expandable Child Rows */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || deleteMutation.isPending}
//         size="small"
//         bordered
//         expandable={{
//           expandedRowRender,
//           expandRowByClick: true,
//           expandedRowKeys: expandedRows,
//           onExpand: (expanded, record) => {
//             if (expanded) {
//               setExpandedRows([...expandedRows, record.id]);
//             } else {
//               setExpandedRows(expandedRows.filter(id => id !== record.id));
//             }
//           },
//           rowExpandable: (record) => (record.items?.length || 0) > 0,
//         }}
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} reimbursements`,
//         }}
//       />
//     </div>
//   );
// }working parent child 


// "use client";
// import { Button, Table, Tag, Popconfirm, Space, Input } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useState, useMemo } from "react";

// export default function EmployeeTab() {
//   const router = useRouter();
//   const [searchText, setSearchText] = useState("");
//   const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch
//   } = useAllReimbursements();

//   const deleteMutation = useDeleteReimbursement();

//   console.log('📊 Raw reimbursements data:', reimbursements);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return reimbursements;
    
//     return reimbursements.filter((record: ReimbursementResponse) => {
//       // Search in parent
//       const parentMatch = record.status?.toLowerCase().includes(searchText.toLowerCase()) ||
//                          record.totalAmount?.toString().includes(searchText);
      
//       // Search in child items
//       const childMatch = record.items?.some(item => 
//         item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.description?.toLowerCase().includes(searchText.toLowerCase())
//       );
      
//       return parentMatch || childMatch;
//     });
//   }, [reimbursements, searchText]);

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteMutation.mutateAsync(id);
//     } catch (error) {
//       console.error('Delete error:', error);
//     }
//   };

//   const handleEdit = (id: string) => {
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Calculate totals
//   const totalAmount = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
//   }, [reimbursements]);

//   const totalItems = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
//   }, [reimbursements]);

//   // Check if reimbursement has multiple items (more than 1)
//   const hasMultipleItems = (record: ReimbursementResponse) => {
//     return (record.items?.length || 0) > 1;
//   };

//   // Expanded row renderer for child items - ONLY SHOWN WHEN MULTIPLE ITEMS EXIST
//   const expandedRowRender = (record: ReimbursementResponse) => {
//     const items = record.items || [];
    
//     // Child table columns
//     const childColumns = [
//       {
//         title: "Category",
//         key: "category",
//         width: 120,
//         render: (_: any, item: any) => <Tag color="blue">{item.category}</Tag>,
//       },
//       {
//         title: "Date",
//         key: "date",
//         width: 120,
//         render: (_: any, item: any) => dayjs(item.date).format('DD MMM YYYY'),
//       },
//       {
//         title: "Amount",
//         key: "amount",
//         width: 100,
//         render: (_: any, item: any) => <span className="font-semibold">₹{Number(item.amount).toFixed(2)}</span>,
//       },
//       {
//         title: "Bill No",
//         dataIndex: "billNo",
//         key: "billNo",
//         width: 100,
//       },
//       {
//         title: "Description",
//         dataIndex: "description",
//         key: "description",
//         ellipsis: true,
//       },
//       {
//         title: "Attachments",
//         key: "attachments",
//         width: 100,
//         render: (_: any, item: any) => {
//           const count = item.attachments?.length || 0;
//           return count > 0 ? <Tag color="green">{count} file(s)</Tag> : <Tag color="default">0</Tag>;
//         },
//       },
//     ];
    
//     return (
//       <div className="pl-8 pr-4 py-2 bg-gray-50">
//         <Table
//           columns={childColumns}
//           dataSource={items.slice(1)} // Skip first item (already shown in parent)
//           rowKey={(item) => item.id || `item-${Math.random()}`}
//           pagination={false}
//           size="small"
//           bordered={false}
//           className="child-table"
//         />
//       </div>
//     );
//   };

//   // Parent table columns
//   const columns = [
//     // {
//     //   title: "Reimbursement ID",
//     //   key: "id",
//     //   width: 200,
//     //   render: (_: any, record: ReimbursementResponse) => (
//     //     <span className="font-mono text-xs">{record.id.substring(0, 8)}...</span>
//     //   ),
//     // },
//     // {
//     //   title: "Created Date",
//     //   key: "createdAt",
//     //   width: 120,
//     //   render: (_: any, record: ReimbursementResponse) => dayjs(record.createdAt).format('DD MMM YYYY'),
//     // },
//     {
//       title: "Category",
//       key: "category",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem ? <Tag color="blue">{firstItem.category}</Tag> : '—';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem ? dayjs(firstItem.date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         const amount = firstItem ? Number(firstItem.amount) : 0;
//         return <span className="font-semibold">₹{amount.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Bill No",
//       key: "billNo",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem?.billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       width: 150,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         const itemCount = record.items?.length || 0;
        
//         return (
//           <div>
//             <div>{firstItem?.description || '—'}</div>
//             {itemCount > 1 && (
//               <div className="text-xs text-gray-500 mt-1">
//                 +{itemCount - 1} more {itemCount - 1 === 1 ? 'item' : 'items'}
//               </div>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       title: "Total Amount",
//       key: "totalAmount",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => (
//         <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Status",
//       key: "status",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;

//         if (status === "DRAFT") return <Tag>Draft</Tag>;
//         if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
//         if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
//         if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
//         if (status === "PAID") return <Tag color="purple">Paid</Tag>;
        
//         return <Tag>{status}</Tag>;
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => (
//         <Space size={4}>
//           <Button 
//             type="text" 
//             size="small" 
//             icon={<EditOutlined />} 
//             onClick={() => handleEdit(record.id)}
//             disabled={deleteMutation.isPending || record.status !== "DRAFT"}
//           />
//           <Popconfirm
//             title="Delete Reimbursement"
//             description="Are you sure you want to delete this reimbursement?"
//             onConfirm={() => handleDelete(record.id)}
//             okText="Yes, Delete"
//             cancelText="Cancel"
//             okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
//           >
//             <Button 
//               type="text" 
//               size="small" 
//               danger 
//               icon={<DeleteOutlined />}
//               disabled={deleteMutation.isPending || record.status !== "DRAFT"}
//             />
//           </Popconfirm>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>
        
//         <Space size={8}>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={loading}
//             size="small"
//           />
//           <Input.Search
//             placeholder="Search by category, bill no, status..."
//             allowClear
//             size="small"
//             style={{ width: 250 }}
//             onChange={(e) => setSearchText(e.target.value)}
//           />
//           <Button
//             type="primary"
//             size="small"
//             icon={<PlusOutlined />}
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </Space>
//       </div>

//       {/* Summary tags */}
//       <div className="flex gap-1.5 mb-3">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {totalItems}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Parent Table with Expandable Child Rows */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || deleteMutation.isPending}
//         size="small"
//         bordered
//         expandable={{
//           expandedRowRender,
//           expandRowByClick: true,
//           expandedRowKeys: expandedRows,
//           onExpand: (expanded, record) => {
//             if (expanded) {
//               setExpandedRows([...expandedRows, record.id]);
//             } else {
//               setExpandedRows(expandedRows.filter(id => id !== record.id));
//             }
//           },
//           // 🔴 KEY CHANGE: Only show expand icon when MORE THAN 1 item exists
//           rowExpandable: (record) => (record.items?.length || 0) > 1,
//         }}
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} reimbursements`,
//         }}
//       />
//     </div>
//   );
// }






// "use client";
// import { Button, Table, Tag, Popconfirm, Space, Input } from "antd";
// import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useState, useMemo } from "react";

// export default function EmployeeTab() {
//   const router = useRouter();
//   const [searchText, setSearchText] = useState("");
//   const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch
//   } = useAllReimbursements();

//   const deleteMutation = useDeleteReimbursement();

//   console.log('📊 Raw reimbursements data:', reimbursements);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return reimbursements;
    
//     return reimbursements.filter((record: ReimbursementResponse) => {
//       // Search in parent
//       const parentMatch = record.status?.toLowerCase().includes(searchText.toLowerCase()) ||
//                          record.totalAmount?.toString().includes(searchText);
      
//       // Search in child items
//       const childMatch = record.items?.some(item => 
//         item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.description?.toLowerCase().includes(searchText.toLowerCase())
//       );
      
//       return parentMatch || childMatch;
//     });
//   }, [reimbursements, searchText]);

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteMutation.mutateAsync(id);
//     } catch (error) {
//       console.error('Delete error:', error);
//     }
//   };

//   const handleEdit = (id: string) => {
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Calculate totals
//   const totalAmount = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
//   }, [reimbursements]);

//   const totalItems = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
//   }, [reimbursements]);

//   // Check if actions should be enabled (DRAFT or SUBMITTED)
//   const isActionsEnabled = (status: string) => {
//     return status === "DRAFT" || status === "SUBMITTED";
//   };

//   // Expanded row renderer for child items - ONLY SHOWN WHEN MULTIPLE ITEMS EXIST
//   const expandedRowRender = (record: ReimbursementResponse) => {
//     const items = record.items || [];
    
//     // Child table columns
//     const childColumns = [
//       {
//         title: "Category",
//         key: "category",
//         width: 120,
//         render: (_: any, item: any) => <Tag color="blue">{item.category}</Tag>,
//       },
//       {
//         title: "Date",
//         key: "date",
//         width: 120,
//         render: (_: any, item: any) => dayjs(item.date).format('DD MMM YYYY'),
//       },
//       {
//         title: "Amount",
//         key: "amount",
//         width: 100,
//         render: (_: any, item: any) => <span className="font-semibold">₹{Number(item.amount).toFixed(2)}</span>,
//       },
//       {
//         title: "Bill No",
//         dataIndex: "billNo",
//         key: "billNo",
//         width: 100,
//       },
//       {
//         title: "Description",
//         dataIndex: "description",
//         key: "description",
//         ellipsis: true,
//       },
//       {
//         title: "Attachments",
//         key: "attachments",
//         width: 100,
//         render: (_: any, item: any) => {
//           const count = item.attachments?.length || 0;
//           return count > 0 ? <Tag color="green">{count} file(s)</Tag> : <Tag color="default">0</Tag>;
//         },
//       },
//     ];
    
//     return (
//       <div className="pl-8 pr-4 py-2 bg-gray-50">
//         <Table
//           columns={childColumns}
//           dataSource={items.slice(1)} // Skip first item (already shown in parent)
//           rowKey={(item) => item.id || `item-${Math.random()}`}
//           pagination={false}
//           size="small"
//           bordered={false}
//           className="child-table"
//         />
//       </div>
//     );
//   };

//   // Parent table columns
//   const columns = [
//     {
//       title: "Category",
//       key: "category",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem ? <Tag color="blue">{firstItem.category}</Tag> : '—';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem ? dayjs(firstItem.date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         const amount = firstItem ? Number(firstItem.amount) : 0;
//         return <span className="font-semibold">₹{amount.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Bill No",
//       key: "billNo",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem?.billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       width: 150,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         const itemCount = record.items?.length || 0;
        
//         return (
//           <div>
//             <div>{firstItem?.description || '—'}</div>
//             {itemCount > 1 && (
//               <div className="text-xs text-gray-500 mt-1">
//                 +{itemCount - 1} more {itemCount - 1 === 1 ? 'item' : 'items'}
//               </div>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       title: "Total Amount",
//       key: "totalAmount",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => (
//         <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Status",
//       key: "status",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;

//         if (status === "DRAFT") return <Tag>Draft</Tag>;
//         if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
//         if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
//         if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
//         if (status === "PAID") return <Tag color="purple">Paid</Tag>;
        
//         return <Tag>{status}</Tag>;
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const enabled = isActionsEnabled(record.status);
        
//         return (
//           <Space size={4}>
//             <Button 
//               type="text" 
//               size="small" 
//               icon={<EditOutlined />} 
//               onClick={() => handleEdit(record.id)}
//               disabled={deleteMutation.isPending || !enabled}
//               title={!enabled ? "Cannot edit in current status" : ""}
//             />
//             <Popconfirm
//               title="Delete Reimbursement"
//               description="Are you sure you want to delete this reimbursement?"
//               onConfirm={() => handleDelete(record.id)}
//               okText="Yes, Delete"
//               cancelText="Cancel"
//               okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
//               disabled={!enabled}
//             >
//               <Button 
//                 type="text" 
//                 size="small" 
//                 danger 
//                 icon={<DeleteOutlined />}
//                 disabled={deleteMutation.isPending || !enabled}
//                 title={!enabled ? "Cannot delete in current status" : ""}
//               />
//             </Popconfirm>
//           </Space>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-2">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>
        
//         <Space size={8}>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={loading}
//             size="small"
//           >
//             Refresh
//           </Button>
//           <Input.Search
//             placeholder="Search by category, bill no, status..."
//             allowClear
//             size="small"
//             style={{ width: 250 }}
//             onChange={(e) => setSearchText(e.target.value)}
//           />
//           <Button
//             type="primary"
//             size="small"
//             icon={<PlusOutlined />}
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </Space>
//       </div>

//       {/* Summary tags */}
//       <div className="flex gap-1.5 mb-3">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {totalItems}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Parent Table with Expandable Child Rows */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || deleteMutation.isPending}
//         size="small"
//         bordered
//         expandable={{
//           expandedRowRender,
//           expandRowByClick: true,
//           expandedRowKeys: expandedRows,
//           onExpand: (expanded, record) => {
//             if (expanded) {
//               setExpandedRows([...expandedRows, record.id]);
//             } else {
//               setExpandedRows(expandedRows.filter(id => id !== record.id));
//             }
//           },
//           // Only show expand icon when MORE THAN 1 item exists
//           rowExpandable: (record) => (record.items?.length || 0) > 1,
//         }}
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} reimbursements`,
//         }}
//       />
//     </div>
//   );
// }working now add approve type




// "use client";
// import { Button, Table, Tag, Popconfirm, Space, Input } from "antd";
// import { 
//   PlusOutlined, 
//   EditOutlined, 
//   DeleteOutlined, 
//   ReloadOutlined,
//   UserOutlined 
// } from "@ant-design/icons";
// import { useRouter } from "next/navigation";
// import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
// import { useApproverTypeMap } from "@/hooks/usereimbursementcreate"; // Import the new hook
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useState, useMemo } from "react";

// export default function EmployeeTab() {
//   const router = useRouter();
//   const [searchText, setSearchText] = useState("");
//   const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch
//   } = useAllReimbursements();

//   const deleteMutation = useDeleteReimbursement();
  
//   // Get approver type map from configurations
//   const approverTypeMap = useApproverTypeMap();

//   console.log('📊 Raw reimbursements data:', reimbursements);
//   console.log('📊 Approver Type Map:', approverTypeMap);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return reimbursements;
    
//     return reimbursements.filter((record: ReimbursementResponse) => {
//       // Search in parent
//       const parentMatch = record.status?.toLowerCase().includes(searchText.toLowerCase()) ||
//                          record.totalAmount?.toString().includes(searchText);
      
//       // Search in child items
//       const childMatch = record.items?.some(item => 
//         item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
//         item.description?.toLowerCase().includes(searchText.toLowerCase())
//       );
      
//       return parentMatch || childMatch;
//     });
//   }, [reimbursements, searchText]);

//   const handleDelete = async (id: string) => {
//     try {
//       await deleteMutation.mutateAsync(id);
//     } catch (error) {
//       console.error('Delete error:', error);
//     }
//   };

//   const handleEdit = (id: string) => {
//     router.push(`/reimburseCreate?id=${id}`);
//   };

//   // Calculate totals
//   const totalAmount = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
//   }, [reimbursements]);

//   const totalItems = useMemo(() => {
//     return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
//   }, [reimbursements]);

//   // Check if actions should be enabled (DRAFT or SUBMITTED)
//   const isActionsEnabled = (status: string) => {
//     return status === "DRAFT" || status === "SUBMITTED";
//   };

//   // Get approver type tag
//   const getApproverTypeTag = (category: string) => {
//     if (!category) return <Tag color="default">N/A</Tag>;
    
//     const approverType = approverTypeMap.get(category.toLowerCase());
    
//     if (!approverType) return <Tag color="default">Not Configured</Tag>;
    
//     switch(approverType?.toUpperCase()) {
//       case 'MANAGER':
//         return <Tag color="blue">Manager</Tag>;
//       case 'FINANCE':
//         return <Tag color="purple">Finance</Tag>;
//       case 'HR':
//         return <Tag color="green">HR</Tag>;
//       default:
//         return <Tag color="cyan">{approverType}</Tag>;
//     }
//   };

//   // Expanded row renderer for child items
//   const expandedRowRender = (record: ReimbursementResponse) => {
//     const items = record.items || [];
    
//     // Child table columns - ADDED APPROVER TYPE COLUMN
//     const childColumns = [
//       {
//         title: "Category",
//         key: "category",
//         width: 120,
//         render: (_: any, item: any) => <Tag color="blue">{item.category}</Tag>,
//       },
//       {
//         title: "Date",
//         key: "date",
//         width: 120,
//         render: (_: any, item: any) => dayjs(item.date).format('DD MMM YYYY'),
//       },
//       {
//         title: "Amount",
//         key: "amount",
//         width: 100,
//         render: (_: any, item: any) => <span className="font-semibold">₹{Number(item.amount).toFixed(2)}</span>,
//       },
//       {
//         title: "Bill No",
//         dataIndex: "billNo",
//         key: "billNo",
//         width: 100,
//       },
//       {
//         title: "Description",
//         dataIndex: "description",
//         key: "description",
//         ellipsis: true,
//       },
//       // 🔴 NEW COLUMN: Approver Type
//       {
//         title: "Approver Type",
//         key: "approverType",
//         width: 130,
//         render: (_: any, item: any) => getApproverTypeTag(item.category),
//       },
//       {
//         title: "Attachments",
//         key: "attachments",
//         width: 100,
//         render: (_: any, item: any) => {
//           const count = item.attachments?.length || 0;
//           return count > 0 ? <Tag color="green">{count} file(s)</Tag> : <Tag color="default">0</Tag>;
//         },
//       },
//     ];
    
//     return (
//       <div className="pl-8 pr-4 py-2 bg-gray-50">
//         <Table
//           columns={childColumns}
//           dataSource={items.slice(1)} // Skip first item (already shown in parent)
//           rowKey={(item) => item.id || `item-${Math.random()}`}
//           pagination={false}
//           size="small"
//           bordered={false}
//           className="child-table"
//         />
//       </div>
//     );
//   };

//   // Parent table columns - ADDED APPROVER TYPE COLUMN IN PARENT AS WELL
//   const columns = [
//     {
//       title: "Category",
//       key: "category",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem ? <Tag color="blue">{firstItem.category}</Tag> : '—';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem ? dayjs(firstItem.date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         const amount = firstItem ? Number(firstItem.amount) : 0;
//         return <span className="font-semibold">₹{amount.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Bill No",
//       key: "billNo",
//       width: 100,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem?.billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       width: 150,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         const itemCount = record.items?.length || 0;
        
//         return (
//           <div>
//             <div>{firstItem?.description || '—'}</div>
//             {itemCount > 1 && (
//               <div className="text-xs text-gray-500 mt-1">
//                 +{itemCount - 1} more {itemCount - 1 === 1 ? 'item' : 'items'}
//               </div>
//             )}
//           </div>
//         );
//       },
//     },
//     // 🔴 NEW COLUMN: Approver Type in Parent (shows for first item)
//     {
//       title: "Approver Type",
//       key: "approverType",
//       width: 130,
//       render: (_: any, record: ReimbursementResponse) => {
//         const firstItem = record.items?.[0];
//         return firstItem ? getApproverTypeTag(firstItem.category) : '—';
//       },
//     },
//     {
//       title: "Total Amount",
//       key: "totalAmount",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => (
//         <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Status",
//       key: "status",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const status = record.status;

//         if (status === "DRAFT") return <Tag>Draft</Tag>;
//         if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
//         if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
//         if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
//         if (status === "PAID") return <Tag color="purple">Paid</Tag>;
        
//         return <Tag>{status}</Tag>;
//       },
//     },
//     {
//       title: "Actions",
//       key: "actions",
//       width: 120,
//       render: (_: any, record: ReimbursementResponse) => {
//         const enabled = isActionsEnabled(record.status);
        
//         return (
//           <Space size={4}>
//             <Button 
//               type="text" 
//               size="small" 
//               icon={<EditOutlined />} 
//               onClick={() => handleEdit(record.id)}
//               disabled={deleteMutation.isPending || !enabled}
//               title={!enabled ? "Cannot edit in current status" : ""}
//             />
//             <Popconfirm
//               title="Delete Reimbursement"
//               description="Are you sure you want to delete this reimbursement?"
//               onConfirm={() => handleDelete(record.id)}
//               okText="Yes, Delete"
//               cancelText="Cancel"
//               okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
//               disabled={!enabled}
//             >
//               <Button 
//                 type="text" 
//                 size="small" 
//                 danger 
//                 icon={<DeleteOutlined />}
//                 disabled={deleteMutation.isPending || !enabled}
//                 title={!enabled ? "Cannot delete in current status" : ""}
//               />
//             </Popconfirm>
//           </Space>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-2">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             My Reimbursements
//           </h2>
//         </div>
        
//         <Space size={8}>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={loading}
//             size="small"
//           >
//             Refresh
//           </Button>
//           <Input.Search
//             placeholder="Search by category, bill no, status, approver..."
//             allowClear
//             size="small"
//             style={{ width: 280 }}
//             onChange={(e) => setSearchText(e.target.value)}
//           />
//           <Button
//             type="primary"
//             size="small"
//             icon={<PlusOutlined />}
//             onClick={() => router.push("/reimburseCreate")}
//           >
//             Create New
//           </Button>
//         </Space>
//       </div>

//       {/* Summary tags - Added approver type stats */}
//       <div className="flex gap-1.5 mb-3 flex-wrap">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {totalItems}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Parent Table with Expandable Child Rows */}
//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || deleteMutation.isPending}
//         size="small"
//         bordered
//         expandable={{
//           expandedRowRender,
//           expandRowByClick: true,
//           expandedRowKeys: expandedRows,
//           onExpand: (expanded, record) => {
//             if (expanded) {
//               setExpandedRows([...expandedRows, record.id]);
//             } else {
//               setExpandedRows(expandedRows.filter(id => id !== record.id));
//             }
//           },
//           // Only show expand icon when MORE THAN 1 item exists
//           rowExpandable: (record) => (record.items?.length || 0) > 1,
//         }}
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} reimbursements`,
//         }}
//       />
//     </div>
//   );
// }working all just chnage parent child same finance





"use client";
import { Button, Table, Tag, Popconfirm, Space, Input } from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  DownOutlined,
  RightOutlined
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAllReimbursements, useDeleteReimbursement } from "@/hooks/usereimbursementcreate";
import { useApproverTypeMap } from "@/hooks/usereimbursementcreate"; // Keep this import
import { ReimbursementResponse } from "@/services/reimbursementcreateService";
import dayjs from "dayjs";
import { useState, useMemo } from "react";

export default function EmployeeTab() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  const { 
    data: reimbursements = [], 
    isLoading: loading,
    refetch
  } = useAllReimbursements();

  const deleteMutation = useDeleteReimbursement();
  
  // Keep approver type map
  const approverTypeMap = useApproverTypeMap();

  console.log('📊 Raw reimbursements data:', reimbursements);
  console.log('📊 Approver Type Map:', approverTypeMap);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchText) return reimbursements;
    
    return reimbursements.filter((record: ReimbursementResponse) => {
      // Get approver type for items for search
      const childMatch = record.items?.some(item => {
        const approverType = item.category ? 
          approverTypeMap.get(item.category.toLowerCase()) : '';
        
        return item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
               item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
               item.description?.toLowerCase().includes(searchText.toLowerCase()) ||
               approverType?.toLowerCase().includes(searchText.toLowerCase());
      });
      
      // Search in parent
      const parentMatch = record.status?.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.totalAmount?.toString().includes(searchText);
      
      return parentMatch || childMatch;
    });
  }, [reimbursements, searchText, approverTypeMap]);

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/reimburseCreate?id=${id}`);
  };

  // Calculate totals
  const totalAmount = useMemo(() => {
    return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  }, [reimbursements]);

  const totalItems = useMemo(() => {
    return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
  }, [reimbursements]);

  // Check if actions should be enabled (DRAFT or SUBMITTED)
  const isActionsEnabled = (status: string) => {
    return status === "DRAFT" || status === "SUBMITTED";
  };

  // Keep approver type tag function
  const getApproverTypeTag = (category: string) => {
    if (!category) return <Tag color="default">N/A</Tag>;
    
    const approverType = approverTypeMap.get(category.toLowerCase());
    
    if (!approverType) return <Tag color="default">Not Configured</Tag>;
    
    switch(approverType?.toUpperCase()) {
      case 'MANAGER':
        return <Tag color="blue">Manager</Tag>;
      case 'FINANCE':
        return <Tag color="purple">Finance</Tag>;
      case 'HR':
        return <Tag color="green">HR</Tag>;
      default:
        return <Tag color="cyan">{approverType}</Tag>;
    }
  };

  // Expanded row renderer for ALL child items - WITH APPROVER TYPE COLUMN
  const expandedRowRender = (record: ReimbursementResponse) => {
    const items = record.items || [];
    
    // Child table columns - WITH APPROVER TYPE
    const childColumns = [
      {
        title: "Category",
        key: "category",
        width: 120,
        render: (_: any, item: any) => <Tag color="blue">{item.category}</Tag>,
      },
      {
        title: "Date",
        key: "date",
        width: 120,
        render: (_: any, item: any) => dayjs(item.date).format('DD MMM YYYY'),
      },
      {
        title: "Amount",
        key: "amount",
        width: 100,
        render: (_: any, item: any) => <span className="font-semibold">₹{Number(item.amount).toFixed(2)}</span>,
      },
      {
        title: "Bill No",
        dataIndex: "billNo",
        key: "billNo",
        width: 100,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        width:150,
      },
      // APPROVER TYPE COLUMN - KEPT
      {
        title: "Approver Type",
        key: "approverType",
        width: 130,
        render: (_: any, item: any) => getApproverTypeTag(item.category),
      },
      // {
      //   title: "Attachments",
      //   key: "attachments",
      //   width: 100,
      //   render: (_: any, item: any) => {
      //     const count = item.attachments?.length || 0;
      //     return count > 0 ? <Tag color="green">{count} file(s)</Tag> : <Tag color="default">0</Tag>;
      //   },
      // },
//       {
//   title: "Attachments",
//   key: "attachments",
//   width: 100,
//   render: (_: any, item: any) => {
//     // Make sure we're counting correctly
//     const attachments = item.attachments || [];
//     const count = attachments.length;
    
//     console.log(`Item ${item.id} attachments:`, attachments); // Debug log
    
//     if (count === 0) {
//       return <Tag color="default">0</Tag>;
//     } else if (count === 1) {
//       return <Tag color="green">1 file</Tag>;
//     } else {
//       return <Tag color="green">{count} files</Tag>;
//     }
//   },
// },
    ];
    
    return (
      <div className="pl-8 pr-4 py-2 bg-gray-50">
        <Table
          columns={childColumns}
          dataSource={items} // Show ALL items
          rowKey={(item) => item.id || `item-${Math.random()}`}
          pagination={false}
          size="small"
          bordered={false}
          className="child-table"
        />
      </div>
    );
  };

  // Parent table columns - Summary view
  const columns = [
    {
      title: "Created Date",
      key: "createdAt",
      width: 120,
      render: (_: any, record: ReimbursementResponse) => 
        dayjs(record.createdAt).format('DD MMM YYYY'),
    },
    {
      title: "Total Items",
      key: "itemCount",
      width: 100,
      render: (_: any, record: ReimbursementResponse) => (
        <Tag color="blue">{record.items?.length || 0}</Tag>
      ),
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      width: 120,
      render: (_: any, record: ReimbursementResponse) => (
        <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: ReimbursementResponse) => {
        const status = record.status;

        if (status === "DRAFT") return <Tag>Draft</Tag>;
        if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
        if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
        if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
        if (status === "PAID") return <Tag color="purple">Paid</Tag>;
        
        return <Tag>{status}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: any, record: ReimbursementResponse) => {
        const enabled = isActionsEnabled(record.status);
        
        return (
          <Space size={4}>
            <Button 
              type="text" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record.id)}
              disabled={deleteMutation.isPending || !enabled}
              title={!enabled ? "Cannot edit in current status" : ""}
            />
            <Popconfirm
              title="Delete Reimbursement"
              description="Are you sure you want to delete this reimbursement?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes, Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
              disabled={!enabled}
            >
              <Button 
                type="text" 
                size="small" 
                danger 
                icon={<DeleteOutlined />}
                disabled={deleteMutation.isPending || !enabled}
                title={!enabled ? "Cannot delete in current status" : ""}
              />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">
            My Reimbursements
          </h2>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        </div>
        
        <Space size={8}>
          <Input.Search
            placeholder="Search by category, bill no, status, approver..."
            allowClear
            size="middle"
            style={{ width: 280 }}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button
            type="primary"
            size="middle"
            icon={<PlusOutlined />}
            onClick={() => router.push("/reimburseCreate")}
          >
            Create New
          </Button>
        </Space>
      </div>

      {/* Summary tags */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Total Reimbursements: {reimbursements.length}
        </Tag>
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Total Items: {totalItems}
        </Tag>
        <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
          Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
        </Tag>
      </div>

      {/* Parent Table with Expandable Child Rows - WITH APPROVER TYPE IN EXPANDED VIEW */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading || deleteMutation.isPending}
        size="small"
        bordered
        expandable={{
          expandedRowRender,
          expandRowByClick: true,
          expandedRowKeys: expandedRows,
          onExpand: (expanded, record) => {
            if (expanded) {
              setExpandedRows([...expandedRows, record.id]);
            } else {
              setExpandedRows(expandedRows.filter(id => id !== record.id));
            }
          },
          expandIcon: ({ expanded, onExpand, record }) => (
            <Button
              type="text"
              size="small"
              icon={expanded ? <DownOutlined /> : <RightOutlined />}
              onClick={(e) => onExpand(record, e)}
              className="mr-2"
            />
          ),
          // Always show expand icon to see all items
          rowExpandable: () => true,
        }}
        pagination={{
          pageSize: 10,
          size: "small",
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} reimbursements`,
        }}
      />
    </div>
  );
}








