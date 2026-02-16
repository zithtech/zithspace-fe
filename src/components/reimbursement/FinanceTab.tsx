// "use client";

// import PreviewModal from "@/components/common/PreviewModal";
// import {
//   Card,
//   Table,
//   Tag,
//   Button,
//   Tooltip,
//   Space,
//   Drawer,
//   Row,
//   Col,
//   message,
//   Input,
//   Modal,
//   Timeline,
//   Select,
//   Divider,
// } from "antd";
// import type { ColumnsType } from "antd/es/table";
// import { EyeOutlined, CloseOutlined, DownloadOutlined, DollarOutlined, CloseCircleOutlined, CheckCircleOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";

// import { useState, useEffect, useRef } from "react";
// import { CategoryService, ReimbursementRequest as Reimbursement } from "@/services/categoryService";
// import { useRequests, useFinanceAction } from "@/hooks/useCategories";

// export default function FinanceTab() {
//   /* ===== DATA FROM HOOK ===== */
//   const { data: requestData, isLoading: loading, refetch: reload } = useRequests({ view: 'finance' });
//   const data = requestData?.data || [];
//   const { mutateAsync: performFinanceAction } = useFinanceAction();

//   const [open, setOpen] = useState(false);
//   const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);


//   const [loadingFile, setLoadingFile] = useState<boolean>(false);
//   const [previewModal, setPreviewModal] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState("");
//   const [previewFileName, setPreviewFileName] = useState("");
//   const [searchText, setSearchText] = useState("");
//   const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

//   const [actionType, setActionType] = useState<"pay" | "hold" | null>(
//     null
//   );
//   const [actionText, setActionText] = useState("");
//   const [currentRecord, setCurrentRecord] = useState<Reimbursement | null>(null);

//   const [showFilter, setShowFilter] = useState(false);
//   const filterRef = useRef<HTMLDivElement | null>(null);



//   const getFileExtension = (fileName: string) => {
//     return fileName?.split('.').pop()?.toLowerCase() || '';
//   };

//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
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




//   // ===== FILTER STATES =====
//   const [filters, setFilters] = useState({
//     employee: "all",
//     category: "all",
//     status: "all",
//   });


//   const getManagerStatusTag = (status: string) => {
//     switch (status) {
//       case "APPROVED":
//       case "PAID":
//       case "ON_HOLD":
//         return <span className="text-green-600">Manager Approved</span>;
//       case "REJECTED":
//         return <span className="text-orange-600">Manager Rejected</span>;
//       default:
//         return <span className="text-orange-500">Pending  Approval</span>;
//     }
//   };

//   const getFinanceStatusTag = (status?: string, requestStatus?: string) => {
//     if (requestStatus === "REJECTED") {
//       return <span className="text-gray-400">N/A</span>;
//     }
//     if (status === "PAID") {
//       return <span className="text-green-600">Finance Paid</span>;
//     }
//     if (status === "ON_HOLD") {
//       return <span className="text-orange-600">Finance On Hold</span>;
//     }
//     return <span className="text-orange-500">Pending  Approval</span>;
//   };



//   /* ===== FILTERED DATA ===== */
//  /* ===== FILTERED DATA - FIXED VERSION ===== */
// const filteredData = data.filter((r) => {
//   // Base finance view filtering
//   if (['DRAFT', 'PENDING_APPROVAL', 'CLARIFY'].includes(r.status)) return false;
//   if (r.status === 'REJECTED' && !r.financeStatus) return false;

//   // Search Text filter
//   if (searchText) {
//     const searchLower = searchText.toLowerCase();
//     const matchesName = (r.employee?.name || (r as any).user?.name || "").toLowerCase().includes(searchLower);
//     const matchesDept = ((r as any).department || "").toLowerCase().includes(searchLower);
//     const matchesId = (r.requestId || "").toLowerCase().includes(searchLower);
//     const matchesCategory = (r.category || "").toLowerCase().includes(searchLower);

//     if (!matchesName && !matchesId && !matchesDept && !matchesCategory) {
//       return false;
//     }
//   }

//   // 🔥 FIX: Employee filter
//   if (filters.employee !== "all") {
//     const employeeName = r.employee?.name || (r as any).user?.name;
//     if (employeeName !== filters.employee) {
//       return false;
//     }
//   }

//   // 🔥 FIX: Category filter
//   if (filters.category !== "all") {
//     if (r.category !== filters.category) {
//       return false;
//     }
//   }

//   // 🔥 FIX: Status filter
//   if (filters.status !== "all") {
//     if (r.status !== filters.status) {
//       return false;
//     }
//   }

//   return true;
// });

//   type StatusChipProps = {
//     status: Reimbursement["status"];
//     size?: "sm" | "md";
//   };

//   const StatusChip = ({ status, size = "sm" }: StatusChipProps) => {
//     const base = "rounded-full font-semibold inline-flex items-center";
//     const sizeCls =
//       size === "sm"
//         ? "px-2 py-[2px] text-[10px]"
//         : "px-3 py-1 text-[12px]";

//     const color =
//       status === "DRAFT"
//         ? "bg-gray-100 text-gray-600"
//         : status === "PENDING_APPROVAL"
//           ? "bg-yellow-100 text-yellow-700"
//           : status === "APPROVED"
//             ? "bg-green-100 text-green-700"
//             : status === "PAID"
//               ? "bg-blue-100 text-blue-700"
//               : "bg-red-100 text-red-700";

//     return (
//       <span className={`${base} ${sizeCls} ${color}`}>
//         {(status || "").replace("_", " ")}
//       </span>
//     );
//   };





//   /* ===== TABLE COLUMNS (UNCHANGED) ===== */
//   const columns: ColumnsType<Reimbursement> = [
//     {
//       title: "Request ID",
//       dataIndex: "requestId",
//     },
//     {
//       title: "Employee",
//       render: (_, r) => r.employee?.name || (r as any).user?.name,
//     },
//     {
//       title: "Category",
//       dataIndex: "category",
//     },
//     {
//       title: "Amount",
//       render: (_, r) => `₹${r.amount.toLocaleString("en-IN")}`,
//     },

//     {
//       title: "Status",
//       dataIndex: "status",
//       render: (status: Reimbursement["status"]) => (
//         <StatusChip status={status} />
//       ),
//     },

//     {
//       title: "Actions",
//       render: (_, record) => (
//         <Space size={4}>
//           <Tooltip title="View Details">
//             <Button
//               type="text"
//               icon={<EyeOutlined />}
//               onClick={() => {
//                 setSelectedRow(record);
//                 setOpen(true);
//               }}
//             />
//           </Tooltip>
//           <Tooltip title="Mark as Paid">
//             <Button
//               type="text"
//               icon={<CheckCircleOutlined />}
//               onClick={() => {
//                 setCurrentRecord(record);
//                 setActionType("pay");
//               }}
//             />
//           </Tooltip>
//           <Tooltip title="Put on Hold">
//             <Button
//               type="text"
//               icon={<CloseCircleOutlined />}
//               onClick={() => {
//                 setCurrentRecord(record);
//                 setActionType("hold");
//               }}
//             />
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   const exportToCSV = () => {
//     if (!data || data.length === 0) return;

//     // ===== CSV HEADERS (EXACT AS TABLE) =====
//     const headers = [
//       "Request ID",
//       "Category",
//       "Amount",
//       "Submitted",
//       "Status",
//     ];

//     // ===== ROW DATA (MAP FROM TABLE DATA) =====
//     const rows = data.map((item) => [
//       item.requestId,
//       item.category,
//       item.amount,
//       item.submitted || '',
//       item.status,
//     ]);

//     // ===== BUILD CSV STRING =====
//     const csvContent =
//       [
//         headers.join(","), // header row
//         ...rows.map((row) =>
//           row.map((value) =>
//             `"${String(value).replace(/"/g, '""')}"`
//           ).join(",")
//         ),
//       ].join("\n");

//     // ===== CREATE & DOWNLOAD FILE =====
//     const blob = new Blob([csvContent], {
//       type: "text/csv;charset=utf-8;",
//     });

//     const url = URL.createObjectURL(blob);

//     const link = document.createElement("a");
//     link.href = url;
//     link.download = "reimbursements.csv";

//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);

//     URL.revokeObjectURL(url);
//   };

//   // ===== HANDLE FILTER CHANGES =====
//   const handleFilterChange = (key: string, value: string) => {
//     setFilters((prev) => ({
//       ...prev,
//       [key]: value,
//     }));
//   };

// // ===== RESET FILTERS =====
// const resetFilters = () => {
//   setFilters({
//     employee: "all",
//     category: "all",
//     status: "all",
//   });
//   setSearchText(""); // Also clear search!
// };


//   return (

//     <Card className="rounded-2xl shadow-md bg-white h-[540px] flex flex-col">
//       <div className="flex flex-col flex-1 overflow-hidden">

//         {/* ===== TOP HEADER ROW ===== */}
//         <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-2">


//           {/* LEFT SIDE: TITLE + DESC + CHIPS */}
//           <div className="space-y-1">

//             <h2 className="text-lg font-semibold text-gray-900">
//               <Space>
//                 <DollarOutlined />
//                 <span>Finance</span>
//               </Space>
//             </h2>


//             <p className="text-[11px] text-gray-500 leading-tight max-w-[520px]">
//               Track payment status, review processed reimbursements, and monitor
//               finance approvals and settlements.
//             </p>

//             {/* ===== FINANCE SUMMARY CHIPS ===== */}
//             <div className="flex flex-wrap gap-1 pt-1 ml-1">
//               {/* Pending Payment */}
//               <div className="px-2 py-[2px] rounded-full bg-orange-100 text-orange-700 text-[10px] font-medium">
//                 Pending Payment:
//                 <span className="ml-1 font-semibold">
//                   ₹{data.filter(d => d.status === 'APPROVED').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
//                 </span>
//               </div>

//               {/* Paid This Month */}
//               <div className="px-2 py-[2px] rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
//                 Paid:
//                 <span className="ml-1 font-semibold">
//                   ₹{data.filter(d => d.status === 'PAID').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
//                 </span>
//               </div>

//               {/* Total All Time */}
//               <div className="px-2 py-[2px] rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">
//                 Total:
//                 <span className="ml-1 font-semibold">
//                   ₹{data.filter(d => d.status !== 'REJECTED').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
//                 </span>
//               </div>
//             </div>

//           </div>

//           {/* RIGHT SIDE: SEARCH + FILTER + EXPORT */}
//           <div className="flex items-center gap-2 mt-1">

//             {/* 1. Search Bar */}
//             <Input
//               placeholder="Search requests..."
//               prefix={<SearchOutlined className="text-gray-400" />}
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               className="w-48 rounded-lg"
//             />

//             <div className="relative" ref={filterRef}>
//               <Button
//                 type="default"
//                 icon={<FilterOutlined />}
//                 className="rounded-lg border-gray-300 shadow-sm
//       hover:border-blue-500 hover:text-blue-600"
//                 onClick={() => setShowFilter(prev => !prev)}
//               >
//                 Advanced Filters
//               </Button>

//             {/* FILTER DROPDOWN - COMPLETE FIXED VERSION */}
// {showFilter && (
//    <div 
//     style={{
//       position: 'fixed',
//       top: (filterRef.current?.getBoundingClientRect().bottom || 0) + 8,
//       right: window.innerWidth - (filterRef.current?.getBoundingClientRect().right || 0),
//       width: '288px',
//       backgroundColor: 'white',
//       border: '1px solid #e5e7eb',
//       borderRadius: '8px',
//       boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
//       padding: '16px',
//       zIndex: 999999,
//     }}
//   >
//     {/* HEADER */}
//     <div className="flex justify-between items-center mb-3 border-b pb-2">
//       <span className="font-semibold text-gray-800">
//         Advanced Filters
//       </span>
//       <Button
//         size="small"
//         type="text"
//         icon={<CloseOutlined />}
//         onClick={() => setShowFilter(false)}
//       />
//     </div>

//     {/* EMPLOYEE - FIXED WITH OPTIONS! */}
//     <div className="mb-3">
//       <label className="block text-[11px] font-medium text-gray-500 mb-1">
//         Employee
//       </label>
//       <Select
//         value={filters.employee}
//         onChange={(v) => handleFilterChange("employee", v)}
//         className="w-full"
//         size="small"
//         dropdownStyle={{ zIndex: 10000 }}
//         getPopupContainer={(trigger) => trigger.parentNode}
//         allowClear
//         placeholder="Select employee"
//       >
//         <Select.Option value="all">All Employees</Select.Option>
//         {[...new Set(data
//           .map(item => item.employee?.name || (item as any).user?.name)
//           .filter(Boolean) // Remove null/undefined
//         )].map(name => (
//           <Select.Option key={name} value={name}>{name}</Select.Option>
//         ))}
//       </Select>
//     </div>

//     {/* CATEGORY - FIXED WITH OPTIONS! */}
//     <div className="mb-3">
//       <label className="block text-[11px] font-medium text-gray-500 mb-1">
//         Category
//       </label>
//       <Select
//         value={filters.category}
//         onChange={(v) => handleFilterChange("category", v)}
//         className="w-full"
//         size="small"
//         dropdownStyle={{ zIndex: 10000 }}
//         getPopupContainer={(trigger) => trigger.parentNode}
//         allowClear
//         placeholder="Select category"
//       >
//         <Select.Option value="all">All Categories</Select.Option>
//         {[...new Set(data
//           .map(item => item.category)
//           .filter(Boolean)
//         )].map(category => (
//           <Select.Option key={category} value={category}>{category}</Select.Option>
//         ))}
//       </Select>
//     </div>

//     {/* STATUS - FIXED WITH CORRECT VALUES! */}
//     <div className="mb-4">
//       <label className="block text-[11px] font-medium text-gray-500 mb-1">
//         Status
//       </label>
//       <Select
//         value={filters.status}
//         onChange={(v) => handleFilterChange("status", v)}
//         className="w-full"
//         size="small"
//         dropdownStyle={{ zIndex: 10000 }}
//         getPopupContainer={(trigger) => trigger.parentNode}
//         allowClear
//         placeholder="Select status"
//       >
//         <Select.Option value="all">All Status</Select.Option>
//         <Select.Option value="PAID">Paid</Select.Option>
//         <Select.Option value="APPROVED">Approved</Select.Option>
//         <Select.Option value="ON_HOLD">On Hold</Select.Option>
//         <Select.Option value="REJECTED">Rejected</Select.Option>
//       </Select>
//     </div>

//     {/* ACTIONS */}
//     <div className="flex justify-end gap-2 pt-2 border-t">
//       <Button size="small" onClick={resetFilters}>Clear</Button>
//       <Button size="small" type="primary" onClick={() => setShowFilter(false)}>
//         Apply Filters
//       </Button>
//     </div>
//   </div>
// )}
//             </div>



//           </div>
//         </div>


//         <style jsx global>{`
//         /* ===== TABLE ROW COMPRESSION ===== */

// .compact-table .ant-table-thead > tr > th {
//   padding: 6px 8px !important;
//   font-size: 11px !important;
//   line-height: 1.2 !important;
//   height: 32px !important;
// }

// .compact-table .ant-table-tbody > tr > td {
//   padding: 4px 6px !important;
//   font-size: 11px !important;
//   line-height: 1.2 !important;
//   height: 32px !important;
// }

// /* ===== ACTION BUTTON (eye icon) ===== */
// .compact-table .ant-btn {
//   padding: 0 !important;
//   height: 22px !important;
//   min-width: 22px !important;
// }

// /* ===== PAGINATION COMPACT ===== */
// .compact-table .ant-pagination {
//   margin-top: 6px !important;
// }
  
// `}</style>

//         <div className="flex-1 overflow-hidden">
//           <Table
//             className="compact-table"
//             rowKey="id"
//             columns={columns}
//             dataSource={filteredData}
//             size="small"
//             pagination={{
//               pageSize: 10,
//               showSizeChanger: false,
//               showQuickJumper: false,
//               position: ["bottomRight"],
//             }}
//           />
//         </div>



//         {/* ===== DRAWER (UNCHANGED) ===== */}
//         <Drawer
//           title={
//             <div className="pb-4">
//               <div className="flex items-center justify-between">
//                 <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
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
//                     className="rounded-full px-4 py-1 text-xs font-medium shadow-sm border-0 backdrop-blur-sm"
//                   >
//                     {selectedRow?.status || "PENDING"}
//                   </Tag>
//                   <CloseOutlined
//                     className="cursor-pointer text-gray-500 hover:text-gray-900 hover:scale-110 text-base transition-all duration-200"
//                     onClick={() => setOpen(false)}
//                   />
//                 </div>
//               </div>
//             </div>
//           }
//           placement="right"
//           width={450}
//           closeIcon={null}
//           open={open}
//           styles={{
//             body: {
//               padding: 10,
//               height: "100vh",
//               overflow: "hidden",
//             },
//             header: { padding: "16px 20px 0" },
//           }}
//           footer={
//             <div className="flex justify-end gap-2">
//               <Button
//                 danger
//                 onClick={() => {
//                   setCurrentRecord(selectedRow);
//                   setActionType("hold");
//                   setOpen(false);
//                 }}
//               >
//                 Reject
//               </Button>
//               <Button
//                 type="primary"
//                 onClick={() => {
//                   setCurrentRecord(selectedRow);
//                   setActionType("pay");
//                   setOpen(false);
//                 }}
//               >
//                 Mark as Paid
//               </Button>
//             </div>
//           }
//         >
//           {selectedRow && (
//             <div className="h-full flex flex-col text-sm text-gray-700">

//               {/* ================= SUMMARY (FIXED) ================= */}
//               <div className="flex-shrink-0">
//                 <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
//                   Request Summary
//                 </div>

//                 <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-4 border border-slate-100 space-y-2 shadow-lg">
//                   {[
//                     ["Category", selectedRow.category],
//                     ["Total Amount", `₹${selectedRow.amount}`],
//                     ["Employee", selectedRow.employee?.name || (selectedRow as any).user?.name],
//                     ["Department", (selectedRow as any).department || selectedRow.employee?.department || (selectedRow as any).user?.department || (selectedRow as any).user?.position || "N/A"],
//                     ["Submitted", selectedRow.submitted],
//                     ["Created", selectedRow.created],
//                   ].map(([label, value], i) => (
//                     <div
//                       key={i}
//                       className="flex justify-between text-xs py-1 hover:bg-slate-100 hover:rounded-lg px-2 transition-colors"
//                     >
//                       <span className="text-gray-500 font-medium">{label}</span>
//                       <span className="font-bold text-gray-900">{value}</span>
//                     </div>
//                   ))}

//                   <div className="flex items-center justify-between text-xs py-1 px-2">
//                     <span className="text-gray-500 font-medium">
//                       Manager Status
//                     </span>

//                     <span className="min-w-[90px] text-right font-bold text-gray-900">
//                       {getManagerStatusTag(selectedRow.status)}
//                     </span>
//                   </div>

//                   <div className="flex items-center justify-between text-xs py-1 px-2">
//                     <span className="text-gray-500 font-medium">
//                       Finance Status
//                     </span>
//                     <span className="min-w-[90px] text-right font-bold text-gray-900">
//                       {getFinanceStatusTag(selectedRow.financeStatus, selectedRow.status)}
//                     </span>
//                   </div>
//                 </div>



//               </div>
//               <div className="flex-1 overflow-y-auto mt-3 pr-2 space-y-6">

//                 {/* EXPENSE ITEMS */}
//                 <div>
//                   <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
//                     Expense Items ({selectedRow.expenseItems?.length || 0})
//                   </div>

//                   <div className="space-y-2">
//                     {selectedRow.expenseItems?.map((item, i) => {
//                       const files = normalizeFiles(item);
//                       const showFiles = files.slice(0, 4);
//                       const hasMoreFiles = files.length > 4;

//                       return (
//                         <div
//                           key={i}
//                           className="group flex items-start gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
//                         >
//                           <div className="flex-1 min-w-0">
//                             <div className="font-bold text-sm truncate">
//                               {item.title}
//                             </div>
//                             <div className="text-xs text-gray-500">
//                               {item.date} • ₹{item.amount}
//                             </div>
//                           </div>

//                           {files.length > 0 && (
//                             <div className="space-y-1.5 min-w-[180px]">
//                               {showFiles.map((file, idx) => (
//                                 <div
//                                   key={idx}
//                                   className="flex items-center justify-between bg-white/90 backdrop-blur-sm p-2 rounded-lg text-xs shadow-sm hover:shadow-md hover:bg-white transition-all duration-200 border border-slate-100 hover:border-blue-100 h-8"
//                                 >
//                                   <span className="truncate font-medium text-gray-800 max-w-[90px]">
//                                     {getFileName(file)}
//                                   </span>
//                                   <div className="flex gap-2">
//                                     <Button
//                                       size="small"
//                                       type="text"
//                                       disabled={!!downloadingFile}
//                                       className="!p-0 w-6 h-6 text-gray-600 hover:text-blue-600 hover:scale-110 flex items-center justify-center"
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
//                                       className="!p-0 w-6 h-6 text-gray-600 hover:text-green-600 hover:scale-110 flex items-center justify-center shadow-none"
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
//                                     className="p-0 text-xs text-blue-600 hover:text-blue-700 font-medium h-auto"
//                                     onClick={(e) => {
//                                       e.stopPropagation();
//                                     }}
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
//                   <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
//                     Activity Log
//                   </div>

//                   <Timeline>
//                     {selectedRow.activityLog.slice(-4).map((log, i) => (
//                       <Timeline.Item key={i}>
//                         <div className="text-xs font-semibold text-gray-700">{log.action}</div>
//                         {log.note && (
//                           <div className="text-xs text-gray-500 italic">"{log.note}"</div>
//                         )}
//                         <div className="text-[10px] text-gray-400 mt-0.5">{log.date}</div>
//                       </Timeline.Item>
//                     ))}
//                   </Timeline>
//                 </div>

//               </div>
//             </div>
//           )}
//         </Drawer>


//         <Modal
//           open={!!actionType}
//           footer={null}
//           centered
//           closable={false}
//           className="rounded-2xl overflow-hidden"
//           onCancel={() => {
//             setActionType(null);
//             setActionText("");
//           }}
//         >
//           {/* Header */}
//           <div className="px-6 py-3 border-b border-gray-200">
//             <h3 className="text-base font-semibold text-gray-800">
//               {actionType === "pay" && "Mark as Paid"}
//               {actionType === "hold" && "Put on Hold"}
//             </h3>
//             <p className="mt-1 text-xs text-gray-500">
//               Request ID: {currentRecord?.requestId}
//             </p>
//           </div>

//           {/* Body */}
//           <div className="px-6 py-5 bg-slate-50 space-y-4">
//             {actionType === "pay" && (
//               <div className="rounded-xl bg-white border p-4 shadow-sm">
//                 <p className="text-sm text-gray-700 leading-relaxed">
//                   Are you sure you want to mark request{" "}
//                   <b>{currentRecord?.requestId}</b> as paid?
//                 </p>
//               </div>
//             )}
//             {actionType === "hold" && (
//               <div className="space-y-2">
//                 <label className="text-xs font-medium text-gray-600">
//                   Reason for Hold
//                 </label>
//                 <Input.TextArea
//                   rows={5}
//                   value={actionText}
//                   onChange={(e) => setActionText(e.target.value)}
//                   placeholder="Enter the reason for putting this request on hold..."
//                   className="rounded-lg"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="flex justify-end gap-3 px-6 py-4 bg-white border-t">
//             <Button
//               onClick={() => {
//                 setActionType(null);
//                 setActionText("");
//               }}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="primary"
//               className={
//                 actionType === "pay"
//                   ? "bg-green-500 hover:bg-green-600"
//                   : "bg-red-500 hover:bg-red-600"
//               }
//               onClick={async () => {
//                 if (!currentRecord) return;

//                 if (actionType === "hold" && !actionText.trim()) {
//                   message.error("Reason is required to put a request on hold.");
//                   return;
//                 }

//                 if (actionType === "pay") {
//                   await performFinanceAction({ id: currentRecord.id, data: { action: "PAID" } });
//                 }

//                 if (actionType === "hold") {
//                   await performFinanceAction({ id: currentRecord.id, data: { action: "ON_HOLD", comments: actionText } });
//                 }
//                 setActionType(null);
//                 setActionText("");
//               }}
//             >
//               {actionType === "pay" ? "Confirm Payment" : "Put on Hold"}
//             </Button>
//           </div>
//         </Modal>

//         <PreviewModal
//           open={previewModal}
//           onCancel={() => setPreviewModal(false)}
//           previewUrl={previewUrl}
//           previewFileName={previewFileName}
//         />


//       </div>
//     </Card>
//   );
// }
"use client";

import PreviewModal from "@/components/common/PreviewModal";
import {
  Card,
  Table,
  Tag,
  Button,
  Tooltip,
  Space,
  Drawer,
  Row,
  Col,
  message,
  Input,
  Modal,
  Timeline,
  Select,
  Divider,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { 
  EyeOutlined, 
  CloseOutlined, 
  DownloadOutlined, 
  DollarOutlined, 
  CloseCircleOutlined, 
  CheckCircleOutlined, 
  SearchOutlined, 
  FilterOutlined 
} from "@ant-design/icons";

import { useState, useEffect, useRef } from "react";
import { CategoryService, ReimbursementRequest as Reimbursement } from "@/services/categoryService";
import { useRequests, useFinanceAction } from "@/hooks/useCategories";

export default function FinanceTab() {
  /* ===== DATA FROM HOOK ===== */
  const { data: requestData, isLoading: loading, refetch: reload } = useRequests({ view: 'finance' });
  const data = requestData?.data || [];
  const { mutateAsync: performFinanceAction } = useFinanceAction();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);

  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  const [actionType, setActionType] = useState<"pay" | "hold" | null>(null);
  const [actionText, setActionText] = useState("");
  const [currentRecord, setCurrentRecord] = useState<Reimbursement | null>(null);

  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const getFileExtension = (fileName: string) => {
    return fileName?.split('.').pop()?.toLowerCase() || '';
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    }

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  // =============================================
  // ✅ SIMPLE & WORKING VERSION
  // =============================================
  const getFileUrl = (file: any): string => {
    if (!file) return "";

    // 🔥 R2 Configuration
    const R2_BASE = "https://pub-7f315f14b4bb4930bd64cae157207c92.r2.dev";
    const R2_PATH = "b85c1b5b-77a3-4281-9147-51d6bd3ee94d/reimbursements/attachments";

    // ============ CASE 1: STRING ============
    if (typeof file === 'string') {
      // Already full URL?
      if (file.startsWith('http')) return file;

      return `${R2_BASE}/${R2_PATH}/${file}`;
    }

    // ============ CASE 2: OBJECT ============
    if (typeof file === 'object' && file !== null) {
      // Try to get URL
      const url = file.url || file.fileUrl || '';
      if (url) {
        if (url.startsWith('http')) return url;
        return `${R2_BASE}/${R2_PATH}/${url}`;
      }

      // Try to get filename
      const name = file.name || file.filename || file.fileName || '';
      if (name) {
        return `${R2_BASE}/${R2_PATH}/${name}`;
      }
    }

    return '';
  };

  // 2. GET FILE NAME
  const getFileName = (file: any): string => {
    if (!file) return "file";

    // Object-ல name இருந்தால்
    if (typeof file === 'object' && file.name) {
      return file.name;
    }

    // URL-ல இருந்து filename எடு
    const url = getFileUrl(file);
    if (url) {
      const parts = url.split('/');
      const fileName = parts.pop() || 'file';
      // R2 URL-ல இருந்து clean filename
      if (fileName.includes('_')) {
        return fileName.split('_').slice(1).join('_');
      }
      return fileName;
    }

    return "file";
  };

  // 3. HANDLE PREVIEW - MODAL OPEN!
  const handlePreview = (file: any) => {
    const url = getFileUrl(file);
    const fileName = getFileName(file);

    if (!url) {
      message.error("File URL not found");
      return;
    }

    console.log("✅ Preview URL:", url);
    setPreviewUrl(url);
    setPreviewFileName(fileName);
    setPreviewModal(true);
  };

  const handleDownload = async (file: any) => {
    try {
      setDownloadingFile(file);

      const url = getFileUrl(file);
      const fileName = getFileName(file);

      if (!url) {
        message.error("File URL not found");
        return;
      }

      console.log("✅ Download URL:", url);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();

      message.success(`Downloading ${fileName}`);

    } catch (error) {
      console.error("Download error:", error);
      message.error("Failed to download file");
    } finally {
      setDownloadingFile(null);
    }
  };

  const normalizeFiles = (item: any): any[] => {
    const files: any[] = [];
    if (!item) return files;

    // Helper
    const addIfValid = (file: any) => {
      if (file === null || file === undefined) return;
      if (typeof file === 'string' && !file.trim()) return;
      if (!files.includes(file)) files.push(file);
    };

    // Check all possible locations
    if (item.attachments) {
      if (Array.isArray(item.attachments)) item.attachments.forEach(addIfValid);
      else addIfValid(item.attachments);
    }

    if (item.files) {
      if (Array.isArray(item.files)) item.files.forEach(addIfValid);
      else addIfValid(item.files);
    }

    if (item.file) addIfValid(item.file);

    return files;
  };

  // ===== FILTER STATES =====
  const [filters, setFilters] = useState({
    employee: "all",
    category: "all",
    status: "all",
  });

  const getManagerStatusTag = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "PAID":
      case "ON_HOLD":
        return <span className="text-green-600 font-medium">Manager Approved</span>;
      case "REJECTED":
        return <span className="text-orange-600 font-medium">Manager Rejected</span>;
      default:
        return <span className="text-orange-500 font-medium">Pending Approval</span>;
    }
  };

  const getFinanceStatusTag = (status?: string, requestStatus?: string) => {
    if (requestStatus === "REJECTED") {
      return <span className="text-gray-400">N/A</span>;
    }
    if (status === "PAID") {
      return <span className="text-green-600 font-medium">Finance Paid</span>;
    }
    if (status === "ON_HOLD") {
      return <span className="text-orange-600 font-medium">Finance On Hold</span>;
    }
    return <span className="text-orange-500 font-medium">Pending Approval</span>;
  };

  /* ===== FILTERED DATA - FIXED VERSION ===== */
  const filteredData = data.filter((r) => {
    // Base finance view filtering
    if (['DRAFT', 'PENDING_APPROVAL', 'CLARIFY'].includes(r.status)) return false;
    if (r.status === 'REJECTED' && !r.financeStatus) return false;

    // Search Text filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesName = (r.employee?.name || (r as any).user?.name || "").toLowerCase().includes(searchLower);
      const matchesDept = ((r as any).department || "").toLowerCase().includes(searchLower);
      const matchesId = (r.requestId || "").toLowerCase().includes(searchLower);
      const matchesCategory = (r.category || "").toLowerCase().includes(searchLower);

      if (!matchesName && !matchesId && !matchesDept && !matchesCategory) {
        return false;
      }
    }

    // 🔥 FIX: Employee filter
    if (filters.employee !== "all") {
      const employeeName = r.employee?.name || (r as any).user?.name;
      if (employeeName !== filters.employee) {
        return false;
      }
    }

    // 🔥 FIX: Category filter
    if (filters.category !== "all") {
      if (r.category !== filters.category) {
        return false;
      }
    }

    // 🔥 FIX: Status filter
    if (filters.status !== "all") {
      if (r.status !== filters.status) {
        return false;
      }
    }

    return true;
  });

  type StatusChipProps = {
    status: Reimbursement["status"];
    size?: "sm" | "md";
  };

  const StatusChip = ({ status, size = "sm" }: StatusChipProps) => {
    const base = "rounded-full font-semibold inline-flex items-center";
    const sizeCls =
      size === "sm"
        ? "px-2.5 py-1 text-xs"
        : "px-3 py-1.5 text-sm";

    const color =
      status === "DRAFT"
        ? "bg-gray-100 text-gray-600"
        : status === "PENDING_APPROVAL"
          ? "bg-orange-100 text-orange-700"
          : status === "APPROVED"
            ? "bg-green-100 text-green-700"
            : status === "PAID"
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700";

    return (
      <span className={`${base} ${sizeCls} ${color}`}>
        {(status || "").replace("_", " ")}
      </span>
    );
  };

  /* ===== TABLE COLUMNS ===== */
  const columns: ColumnsType<Reimbursement> = [
    {
      title: "Request ID",
      dataIndex: "requestId",
      width: 120,
      render: (text) => <span className="font-medium text-sm">{text}</span>,
    },
    {
      title: "Employee",
      width: 150,
      render: (_, r) => <span className="text-sm">{r.employee?.name || (r as any).user?.name}</span>,
    },
    {
      title: "Category",
      dataIndex: "category",
      width: 120,
      render: (text) => <span className="capitalize text-sm">{text}</span>,
    },
    {
      title: "Amount",
      width: 110,
      render: (_, r) => <span className="font-semibold text-sm">₹{r.amount.toLocaleString("en-IN")}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status: Reimbursement["status"]) => <StatusChip status={status} />,
    },
    {
      title: "Actions",
      width: 140,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-7 h-7"
              onClick={() => {
                setSelectedRow(record);
                setOpen(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Mark as Paid">
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 w-7 h-7"
              onClick={() => {
                setCurrentRecord(record);
                setActionType("pay");
              }}
            />
          </Tooltip>
          <Tooltip title="Put on Hold">
            <Button
              type="text"
              icon={<CloseCircleOutlined />}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 w-7 h-7"
              onClick={() => {
                setCurrentRecord(record);
                setActionType("hold");
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const exportToCSV = () => {
    if (!data || data.length === 0) return;

    // ===== CSV HEADERS (EXACT AS TABLE) =====
    const headers = [
      "Request ID",
      "Category",
      "Amount",
      "Submitted",
      "Status",
    ];

    // ===== ROW DATA (MAP FROM TABLE DATA) =====
    const rows = data.map((item) => [
      item.requestId,
      item.category,
      item.amount,
      item.submitted || '',
      item.status,
    ]);

    // ===== BUILD CSV STRING =====
    const csvContent =
      [
        headers.join(","), // header row
        ...rows.map((row) =>
          row.map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          ).join(",")
        ),
      ].join("\n");

    // ===== CREATE & DOWNLOAD FILE =====
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "reimbursements.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ===== HANDLE FILTER CHANGES =====
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ===== RESET FILTERS =====
  const resetFilters = () => {
    setFilters({
      employee: "all",
      category: "all",
      status: "all",
    });
    setSearchText("");
  };

  return (
    <Card className="rounded-xl shadow-sm bg-white h-[600px] flex flex-col border border-gray-100">
      <div className="flex flex-col flex-1 overflow-hidden p-3">

        {/* ===== TOP HEADER ROW ===== */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
          {/* LEFT SIDE: TITLE + DESC + CHIPS */}
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-gray-900">
              <Space>
                <DollarOutlined className="text-blue-600" />
                <span>Finance Dashboard</span>
              </Space>
            </h2>

            <p className="text-xs text-gray-500 max-w-[520px]">
              Track payment status, review processed reimbursements, and monitor finance approvals and settlements.
            </p>

            {/* ===== FINANCE SUMMARY CHIPS ===== */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {/* Pending Payment */}
              <div className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                Pending: ₹{data.filter(d => d.status === 'APPROVED').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
              </div>

              {/* Paid This Month */}
              <div className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                Paid: ₹{data.filter(d => d.status === 'PAID').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
              </div>

              {/* Total All Time */}
              <div className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                Total: ₹{data.filter(d => d.status !== 'REJECTED').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: SEARCH + FILTER + EXPORT */}
          <div className="flex items-center gap-2">
            {/* 1. Search Bar */}
            <Input
              placeholder="Search requests..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-56 rounded-lg"
              size="middle"
            />

            <div className="relative" ref={filterRef}>
              <Button
                type="default"
                icon={<FilterOutlined />}
                className="rounded-lg border-gray-300 shadow-sm hover:border-blue-500 hover:text-blue-600 h-9 px-4"
                onClick={() => setShowFilter(prev => !prev)}
              >
                Filters
              </Button>

              {/* FILTER DROPDOWN - COMPLETE FIXED VERSION */}
              {showFilter && (
                <div 
                  style={{
                    position: 'fixed',
                    top: (filterRef.current?.getBoundingClientRect().bottom || 0) + 8,
                    right: window.innerWidth - (filterRef.current?.getBoundingClientRect().right || 0),
                    width: '300px',
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                    padding: '16px',
                    zIndex: 999999,
                  }}
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <span className="font-semibold text-gray-800 text-base">
                      Advanced Filters
                    </span>
                    <Button
                      size="small"
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => setShowFilter(false)}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  </div>

                  {/* EMPLOYEE */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Employee
                    </label>
                    <Select
                      value={filters.employee}
                      onChange={(v) => handleFilterChange("employee", v)}
                      className="w-full"
                      size="middle"
                      dropdownStyle={{ zIndex: 10000 }}
                      getPopupContainer={(trigger) => trigger.parentNode}
                      allowClear
                      placeholder="Select employee"
                    >
                      <Select.Option value="all">All Employees</Select.Option>
                      {[...new Set(data
                        .map(item => item.employee?.name || (item as any).user?.name)
                        .filter(Boolean)
                      )].map(name => (
                        <Select.Option key={name} value={name}>{name}</Select.Option>
                      ))}
                    </Select>
                  </div>

                  {/* CATEGORY */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Category
                    </label>
                    <Select
                      value={filters.category}
                      onChange={(v) => handleFilterChange("category", v)}
                      className="w-full"
                      size="middle"
                      dropdownStyle={{ zIndex: 10000 }}
                      getPopupContainer={(trigger) => trigger.parentNode}
                      allowClear
                      placeholder="Select category"
                    >
                      <Select.Option value="all">All Categories</Select.Option>
                      {[...new Set(data
                        .map(item => item.category)
                        .filter(Boolean)
                      )].map(category => (
                        <Select.Option key={category} value={category}>{category}</Select.Option>
                      ))}
                    </Select>
                  </div>

                  {/* STATUS */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <Select
                      value={filters.status}
                      onChange={(v) => handleFilterChange("status", v)}
                      className="w-full"
                      size="middle"
                      dropdownStyle={{ zIndex: 10000 }}
                      getPopupContainer={(trigger) => trigger.parentNode}
                      allowClear
                      placeholder="Select status"
                    >
                      <Select.Option value="all">All Status</Select.Option>
                      <Select.Option value="PAID">Paid</Select.Option>
                      <Select.Option value="APPROVED">Approved</Select.Option>
                      <Select.Option value="ON_HOLD">On Hold</Select.Option>
                      <Select.Option value="REJECTED">Rejected</Select.Option>
                    </Select>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button size="middle" onClick={resetFilters} className="px-4">
                      Clear
                    </Button>
                    <Button size="middle" type="primary" onClick={() => setShowFilter(false)} className="px-5">
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* EXPORT BUTTON */}
            <Button 
              onClick={exportToCSV} 
              className="h-9 px-4"
            >
              Export CSV
            </Button>
          </div>
        </div>

        <style jsx global>{`
          .finance-table .ant-table-thead > tr > th {
            padding: 10px 12px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            background-color: #fafafa !important;
          }
          
          .finance-table .ant-table-tbody > tr > td {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
          
          .finance-table .ant-table-tbody > tr:hover > td {
            background-color: #f5f9ff !important;
          }
          
          .finance-table .ant-btn {
            height: 28px !important;
            width: 28px !important;
          }
          
          .finance-table .ant-pagination {
            margin-top: 12px !important;
          }
        `}</style>

        <div className="flex-1 overflow-hidden mt-3">
          <Table
            className="finance-table"
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} items`,
              position: ["bottomRight"],
            }}
          />
        </div>

        {/* ===== DRAWER ===== */}
        <Drawer
          title={
            <div className="pb-3">
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  #{selectedRow?.requestId || "REQ-0000"}
                </div>
                <div className="flex items-center gap-2">
                  <Tag
                    color={
                      selectedRow?.status === "APPROVED"
                        ? "green"
                        : selectedRow?.status === "REJECTED"
                          ? "red"
                          : "orange"
                    }
                    className="rounded-full px-3 py-1 text-xs font-medium border-0"
                  >
                    {selectedRow?.status || "PENDING"}
                  </Tag>
                  <CloseOutlined
                    className="cursor-pointer text-gray-500 hover:text-gray-900 text-base transition-colors"
                    onClick={() => setOpen(false)}
                  />
                </div>
              </div>
            </div>
          }
          placement="right"
          width={480}
          closeIcon={null}
          open={open}
          styles={{
            body: {
              padding: 16,
              height: "100vh",
              overflow: "hidden",
            },
            header: { padding: "16px 20px 0" },
          }}
          footer={
            <div className="flex justify-end gap-2 p-3 border-t border-gray-100">
              <Button
                danger
                size="middle"
                className="px-5"
                onClick={() => {
                  setCurrentRecord(selectedRow);
                  setActionType("hold");
                  setOpen(false);
                }}
              >
                Put on Hold
              </Button>
              <Button
                type="primary"
                size="middle"
                className="bg-green-500 hover:bg-green-600 border-none px-5"
                onClick={() => {
                  setCurrentRecord(selectedRow);
                  setActionType("pay");
                  setOpen(false);
                }}
              >
                Mark as Paid
              </Button>
            </div>
          }
        >
          {selectedRow && (
            <div className="h-full flex flex-col text-sm text-gray-700">
              {/* ================= SUMMARY ================= */}
              <div className="flex-shrink-0">
                <div className="mb-2 font-semibold text-base text-gray-900">
                  Request Summary
                </div>

                <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 p-4 border border-slate-200 space-y-2 shadow-sm">
                  {[
                    ["Category", selectedRow.category],
                    ["Total Amount", `₹${selectedRow.amount}`],
                    ["Employee", selectedRow.employee?.name || (selectedRow as any).user?.name],
                    ["Department", (selectedRow as any).department || selectedRow.employee?.department || (selectedRow as any).user?.department || (selectedRow as any).user?.position || "N/A"],
                    ["Submitted", selectedRow.submitted],
                    ["Created", selectedRow.created],
                  ].map(([label, value], i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs py-1.5 px-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <span className="text-gray-500 font-medium">{label}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-xs py-1.5 px-2">
                    <span className="text-gray-500 font-medium">Manager Status</span>
                    <span className="font-semibold text-gray-900">
                      {getManagerStatusTag(selectedRow.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1.5 px-2">
                    <span className="text-gray-500 font-medium">Finance Status</span>
                    <span className="font-semibold text-gray-900">
                      {getFinanceStatusTag(selectedRow.financeStatus, selectedRow.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4">
                {/* EXPENSE ITEMS */}
                <div>
                  <div className="mb-2 font-semibold text-base text-gray-900">
                    Expense Items ({selectedRow.expenseItems?.length || 0})
                  </div>

                  <div className="space-y-2">
                    {selectedRow.expenseItems?.map((item, i) => {
                      const files = normalizeFiles(item);
                      const showFiles = files.slice(0, 3);
                      const hasMoreFiles = files.length > 3;

                      return (
                        <div
                          key={i}
                          className="group flex items-start gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm group-hover:text-blue-700 transition-colors truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {item.date} • ₹{item.amount}
                            </div>
                          </div>

                          {files.length > 0 && (
                            <div className="space-y-1.5 min-w-[160px]">
                              {showFiles.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white p-1.5 rounded-md text-xs shadow-sm border border-slate-100 h-8"
                                >
                                  <span className="truncate font-medium text-gray-800 max-w-[80px]">
                                    {getFileName(file)}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      size="small"
                                      type="text"
                                      disabled={!!downloadingFile}
                                      className="!p-0 w-6 h-6 text-gray-600 hover:text-blue-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreview(file);
                                      }}
                                    >
                                      <EyeOutlined className="text-sm" />
                                    </Button>
                                    <Button
                                      size="small"
                                      type="text"
                                      loading={downloadingFile === file}
                                      disabled={!!downloadingFile && downloadingFile !== file}
                                      className="!p-0 w-6 h-6 text-gray-600 hover:text-green-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(file);
                                      }}
                                    >
                                      {downloadingFile !== file && <DownloadOutlined className="text-sm" />}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {hasMoreFiles && (
                                <div className="pt-0.5">
                                  <Button
                                    size="small"
                                    type="link"
                                    className="p-0 text-xs text-blue-600 hover:text-blue-700 font-medium h-auto"
                                  >
                                    +{files.length - 3} more
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ACTIVITY LOG */}
                <div>
                  <div className="mb-2 font-semibold text-base text-gray-900">
                    Activity Log
                  </div>

                  <Timeline>
                    {selectedRow.activityLog.slice(-4).map((log, i) => (
                      <Timeline.Item key={i}>
                        <div className="text-xs font-semibold text-gray-700">{log.action}</div>
                        {log.note && (
                          <div className="text-xs text-gray-500 italic mt-0.5">"{log.note}"</div>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">{log.date}</div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* ===== MODAL ACTIONS ===== */}
        <Modal
          open={!!actionType}
          footer={null}
          centered
          closable={false}
          width={450}
          className="rounded-lg overflow-hidden"
          onCancel={() => {
            setActionType(null);
            setActionText("");
          }}
        >
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">
              {actionType === "pay" && "Mark as Paid"}
              {actionType === "hold" && "Put on Hold"}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Request ID: {currentRecord?.requestId}
            </p>
          </div>

          {/* Body */}
          <div className="px-5 py-4 bg-slate-50 space-y-3">
            {actionType === "pay" && (
              <div className="rounded-lg bg-white border p-4 shadow-sm">
                <p className="text-sm text-gray-700">
                  Are you sure you want to mark request <b>{currentRecord?.requestId}</b> as paid?
                </p>
              </div>
            )}
            {actionType === "hold" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Reason for Hold <span className="text-red-500">*</span>
                </label>
                <Input.TextArea
                  rows={4}
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="Enter the reason for putting this request on hold..."
                  className="rounded-md text-sm"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-5 py-3 bg-white border-t border-gray-200">
            <Button
              size="middle"
              onClick={() => {
                setActionType(null);
                setActionText("");
              }}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              size="middle"
              type="primary"
              className={
                actionType === "pay"
                  ? "bg-green-500 hover:bg-green-600 border-none px-5"
                  : "bg-orange-500 hover:bg-orange-600 border-none px-5"
              }
              onClick={async () => {
                if (!currentRecord) return;

                if (actionType === "hold" && !actionText.trim()) {
                  message.error("Reason is required to put a request on hold.");
                  return;
                }

                if (actionType === "pay") {
                  await performFinanceAction({ id: currentRecord.id, data: { action: "PAID" } });
                }

                if (actionType === "hold") {
                  await performFinanceAction({ id: currentRecord.id, data: { action: "ON_HOLD", comments: actionText } });
                }
                setActionType(null);
                setActionText("");
              }}
            >
              {actionType === "pay" ? "Confirm Payment" : "Put on Hold"}
            </Button>
          </div>
        </Modal>

        <PreviewModal
          open={previewModal}
          onCancel={() => setPreviewModal(false)}
          previewUrl={previewUrl}
          previewFileName={previewFileName}
        />
      </div>
    </Card>
  );
}