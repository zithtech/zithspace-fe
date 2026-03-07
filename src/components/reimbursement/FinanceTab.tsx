
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
// import { 
//   EyeOutlined, 
//   CloseOutlined, 
//   DownloadOutlined, 
//   DollarOutlined, 
//   CloseCircleOutlined, 
//   CheckCircleOutlined, 
//   SearchOutlined, 
//   FilterOutlined 
// } from "@ant-design/icons";

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

//   const [actionType, setActionType] = useState<"pay" | "hold" | null>(null);
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
//         return <span className="text-green-600 font-medium">Manager Approved</span>;
//       case "REJECTED":
//         return <span className="text-orange-600 font-medium">Manager Rejected</span>;
//       default:
//         return <span className="text-orange-500 font-medium">Pending Approval</span>;
//     }
//   };

//   const getFinanceStatusTag = (status?: string, requestStatus?: string) => {
//     if (requestStatus === "REJECTED") {
//       return <span className="text-gray-400">N/A</span>;
//     }
//     if (status === "PAID") {
//       return <span className="text-green-600 font-medium">Finance Paid</span>;
//     }
//     if (status === "ON_HOLD") {
//       return <span className="text-orange-600 font-medium">Finance On Hold</span>;
//     }
//     return <span className="text-orange-500 font-medium">Pending Approval</span>;
//   };

//   /* ===== FILTERED DATA - FIXED VERSION ===== */
//   const filteredData = data.filter((r) => {
//     // Base finance view filtering
//     if (['DRAFT', 'PENDING_APPROVAL', 'CLARIFY'].includes(r.status)) return false;
//     if (r.status === 'REJECTED' && !r.financeStatus) return false;

//     // Search Text filter
//     if (searchText) {
//       const searchLower = searchText.toLowerCase();
//       const matchesName = (r.employee?.name || (r as any).user?.name || "").toLowerCase().includes(searchLower);
//       const matchesDept = ((r as any).department || "").toLowerCase().includes(searchLower);
//       const matchesId = (r.requestId || "").toLowerCase().includes(searchLower);
//       const matchesCategory = (r.category || "").toLowerCase().includes(searchLower);

//       if (!matchesName && !matchesId && !matchesDept && !matchesCategory) {
//         return false;
//       }
//     }

//     // 🔥 FIX: Employee filter
//     if (filters.employee !== "all") {
//       const employeeName = r.employee?.name || (r as any).user?.name;
//       if (employeeName !== filters.employee) {
//         return false;
//       }
//     }

//     // 🔥 FIX: Category filter
//     if (filters.category !== "all") {
//       if (r.category !== filters.category) {
//         return false;
//       }
//     }

//     // 🔥 FIX: Status filter
//     if (filters.status !== "all") {
//       if (r.status !== filters.status) {
//         return false;
//       }
//     }

//     return true;
//   });

//   type StatusChipProps = {
//     status: Reimbursement["status"];
//     size?: "sm" | "md";
//   };

//   const StatusChip = ({ status, size = "sm" }: StatusChipProps) => {
//     const base = "rounded-full font-semibold inline-flex items-center";
//     const sizeCls =
//       size === "sm"
//         ? "px-2.5 py-1 text-xs"
//         : "px-3 py-1.5 text-sm";

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
//         {(status || "").replace("_", " ")}
//       </span>
//     );
//   };

//   /* ===== TABLE COLUMNS ===== */
//   const columns: ColumnsType<Reimbursement> = [
//     {
//       title: "Request ID",
//       dataIndex: "requestId",
//       width: 120,
//       render: (text) => <span className="font-medium text-sm">{text}</span>,
//     },
//     {
//       title: "Employee",
//       width: 150,
//       render: (_, r) => <span className="text-sm">{r.employee?.name || (r as any).user?.name}</span>,
//     },
//     {
//       title: "Category",
//       dataIndex: "category",
//       width: 120,
//       render: (text) => <span className="capitalize text-sm">{text}</span>,
//     },
//     {
//       title: "Amount",
//       width: 110,
//       render: (_, r) => <span className="font-semibold text-sm">₹{r.amount.toLocaleString("en-IN")}</span>,
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       width: 120,
//       render: (status: Reimbursement["status"]) => <StatusChip status={status} />,
//     },
//     {
//       title: "Actions",
//       width: 140,
//       align: "center",
//       render: (_, record) => (
//         <Space size={4}>
//           <Tooltip title="View Details">
//             <Button
//               type="text"
//               icon={<EyeOutlined />}
//               className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-7 h-7"
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
//               className="text-green-600 hover:text-green-700 hover:bg-green-50 w-7 h-7"
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
//               className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 w-7 h-7"
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

//   // ===== RESET FILTERS =====
//   const resetFilters = () => {
//     setFilters({
//       employee: "all",
//       category: "all",
//       status: "all",
//     });
//     setSearchText("");
//   };

//   return (
//     // <Card className="rounded-xl shadow-sm bg-white h-[600px] flex flex-col border border-gray-100">
//       <div className="flex flex-col flex-1 overflow-hidden p-3">

//         {/* ===== TOP HEADER ROW ===== */}
//         <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3">
//           {/* LEFT SIDE: TITLE + DESC + CHIPS */}
//           <div className="space-y-1.5">
//             <h2 className="text-lg font-semibold text-gray-900">
//               <Space>
//                 <DollarOutlined className="text-blue-600" />
//                 <span>Finance Dashboard</span>
//               </Space>
//             </h2>

//             <p className="text-xs text-gray-500 max-w-[520px]">
//               Track payment status, review processed reimbursements, and monitor finance approvals and settlements.
//             </p>

//             {/* ===== FINANCE SUMMARY CHIPS ===== */}
//             <div className="flex flex-wrap gap-1.5 pt-1">
//               {/* Pending Payment */}
//               <div className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
//                 Pending: ₹{data.filter(d => d.status === 'APPROVED').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
//               </div>

//               {/* Paid This Month */}
//               <div className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
//                 Paid: ₹{data.filter(d => d.status === 'PAID').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
//               </div>

//               {/* Total All Time */}
//               <div className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
//                 Total: ₹{data.filter(d => d.status !== 'REJECTED').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
//               </div>
//             </div>
//           </div>

//           {/* RIGHT SIDE: SEARCH + FILTER + EXPORT */}
//           <div className="flex items-center gap-2">
//             {/* 1. Search Bar */}
//             <Input
//               placeholder="Search requests..."
//               prefix={<SearchOutlined className="text-gray-400" />}
//               value={searchText}
//               onChange={(e) => setSearchText(e.target.value)}
//               className="w-56 rounded-lg"
//               size="middle"
//             />

//             <div className="relative" ref={filterRef}>
//               <Button
//                 type="default"
//                 icon={<FilterOutlined />}
//                 className="rounded-lg border-gray-300 shadow-sm hover:border-blue-500 hover:text-blue-600 h-9 px-4"
//                 onClick={() => setShowFilter(prev => !prev)}
//               >
//                 Filters
//               </Button>

//               {/* FILTER DROPDOWN - COMPLETE FIXED VERSION */}
//               {showFilter && (
//                 <div 
//                   style={{
//                     position: 'fixed',
//                     top: (filterRef.current?.getBoundingClientRect().bottom || 0) + 8,
//                     right: window.innerWidth - (filterRef.current?.getBoundingClientRect().right || 0),
//                     width: '300px',
//                     backgroundColor: 'white',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '12px',
//                     boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
//                     padding: '16px',
//                     zIndex: 999999,
//                   }}
//                 >
//                   {/* HEADER */}
//                   <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
//                     <span className="font-semibold text-gray-800 text-base">
//                       Advanced Filters
//                     </span>
//                     <Button
//                       size="small"
//                       type="text"
//                       icon={<CloseOutlined />}
//                       onClick={() => setShowFilter(false)}
//                       className="text-gray-400 hover:text-gray-600"
//                     />
//                   </div>

//                   {/* EMPLOYEE */}
//                   <div className="mb-4">
//                     <label className="block text-xs font-medium text-gray-500 mb-1">
//                       Employee
//                     </label>
//                     <Select
//                       value={filters.employee}
//                       onChange={(v) => handleFilterChange("employee", v)}
//                       className="w-full"
//                       size="middle"
//                       dropdownStyle={{ zIndex: 10000 }}
//                       getPopupContainer={(trigger) => trigger.parentNode}
//                       allowClear
//                       placeholder="Select employee"
//                     >
//                       <Select.Option value="all">All Employees</Select.Option>
//                       {[...new Set(data
//                         .map(item => item.employee?.name || (item as any).user?.name)
//                         .filter(Boolean)
//                       )].map(name => (
//                         <Select.Option key={name} value={name}>{name}</Select.Option>
//                       ))}
//                     </Select>
//                   </div>

//                   {/* CATEGORY */}
//                   <div className="mb-4">
//                     <label className="block text-xs font-medium text-gray-500 mb-1">
//                       Category
//                     </label>
//                     <Select
//                       value={filters.category}
//                       onChange={(v) => handleFilterChange("category", v)}
//                       className="w-full"
//                       size="middle"
//                       dropdownStyle={{ zIndex: 10000 }}
//                       getPopupContainer={(trigger) => trigger.parentNode}
//                       allowClear
//                       placeholder="Select category"
//                     >
//                       <Select.Option value="all">All Categories</Select.Option>
//                       {[...new Set(data
//                         .map(item => item.category)
//                         .filter(Boolean)
//                       )].map(category => (
//                         <Select.Option key={category} value={category}>{category}</Select.Option>
//                       ))}
//                     </Select>
//                   </div>

//                   {/* STATUS */}
//                   <div className="mb-4">
//                     <label className="block text-xs font-medium text-gray-500 mb-1">
//                       Status
//                     </label>
//                     <Select
//                       value={filters.status}
//                       onChange={(v) => handleFilterChange("status", v)}
//                       className="w-full"
//                       size="middle"
//                       dropdownStyle={{ zIndex: 10000 }}
//                       getPopupContainer={(trigger) => trigger.parentNode}
//                       allowClear
//                       placeholder="Select status"
//                     >
//                       <Select.Option value="all">All Status</Select.Option>
//                       <Select.Option value="PAID">Paid</Select.Option>
//                       <Select.Option value="APPROVED">Approved</Select.Option>
//                       <Select.Option value="ON_HOLD">On Hold</Select.Option>
//                       <Select.Option value="REJECTED">Rejected</Select.Option>
//                     </Select>
//                   </div>

//                   {/* ACTIONS */}
//                   <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
//                     <Button size="middle" onClick={resetFilters} className="px-4">
//                       Clear
//                     </Button>
//                     <Button size="middle" type="primary" onClick={() => setShowFilter(false)} className="px-5">
//                       Apply
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </div>

//             {/* EXPORT BUTTON */}
//             <Button 
//               onClick={exportToCSV} 
//               className="h-9 px-4"
//             >
//               Export CSV
//             </Button>
//           </div>
//         </div>

//         <style jsx global>{`
//           .finance-table .ant-table-thead > tr > th {
//             padding: 10px 12px !important;
//             font-size: 12px !important;
//             font-weight: 600 !important;
//             background-color: #fafafa !important;
//           }
          
//           .finance-table .ant-table-tbody > tr > td {
//             padding: 8px 12px !important;
//             font-size: 12px !important;
//           }
          
//           .finance-table .ant-table-tbody > tr:hover > td {
//             background-color: #f5f9ff !important;
//           }
          
//           .finance-table .ant-btn {
//             height: 28px !important;
//             width: 28px !important;
//           }
          
//           .finance-table .ant-pagination {
//             margin-top: 12px !important;
//           }
//         `}</style>

//         <div className="flex-1 overflow-hidden mt-3">
//           <Table
//             className="finance-table"
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
//             <div className="pb-3">
//               <div className="flex items-center justify-between">
//                 <div className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//                   #{selectedRow?.requestId || "REQ-0000"}
//                 </div>
//                 <div className="flex items-center gap-2">
//                   <Tag
//                     color={
//                       selectedRow?.status === "APPROVED"
//                         ? "green"
//                         : selectedRow?.status === "REJECTED"
//                           ? "red"
//                           : "orange"
//                     }
//                     className="rounded-full px-3 py-1 text-xs font-medium border-0"
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
//           width={480}
//           closeIcon={null}
//           open={open}
//           styles={{
//             body: {
//               padding: 16,
//               height: "100vh",
//               overflow: "hidden",
//             },
//             header: { padding: "16px 20px 0" },
//           }}
//           footer={
//             <div className="flex justify-end gap-2 p-3 border-t border-gray-100">
//               <Button
//                 danger
//                 size="middle"
//                 className="px-5"
//                 onClick={() => {
//                   setCurrentRecord(selectedRow);
//                   setActionType("hold");
//                   setOpen(false);
//                 }}
//               >
//                 Put on Hold
//               </Button>
//               <Button
//                 type="primary"
//                 size="middle"
//                 className="bg-green-500 hover:bg-green-600 border-none px-5"
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
//               {/* ================= SUMMARY ================= */}
//               <div className="flex-shrink-0">
//                 <div className="mb-2 font-semibold text-base text-gray-900">
//                   Request Summary
//                 </div>

//                 <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 p-4 border border-slate-200 space-y-2 shadow-sm">
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
//                       className="flex justify-between text-xs py-1.5 px-2 hover:bg-slate-100 rounded-lg transition-colors"
//                     >
//                       <span className="text-gray-500 font-medium">{label}</span>
//                       <span className="font-semibold text-gray-900">{value}</span>
//                     </div>
//                   ))}

//                   <div className="flex items-center justify-between text-xs py-1.5 px-2">
//                     <span className="text-gray-500 font-medium">Manager Status</span>
//                     <span className="font-semibold text-gray-900">
//                       {getManagerStatusTag(selectedRow.status)}
//                     </span>
//                   </div>

//                   <div className="flex items-center justify-between text-xs py-1.5 px-2">
//                     <span className="text-gray-500 font-medium">Finance Status</span>
//                     <span className="font-semibold text-gray-900">
//                       {getFinanceStatusTag(selectedRow.financeStatus, selectedRow.status)}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4">
//                 {/* EXPENSE ITEMS */}
//                 <div>
//                   <div className="mb-2 font-semibold text-base text-gray-900">
//                     Expense Items ({selectedRow.expenseItems?.length || 0})
//                   </div>

//                   <div className="space-y-2">
//                     {selectedRow.expenseItems?.map((item, i) => {
//                       const files = normalizeFiles(item);
//                       const showFiles = files.slice(0, 3);
//                       const hasMoreFiles = files.length > 3;

//                       return (
//                         <div
//                           key={i}
//                           className="group flex items-start gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all"
//                         >
//                           <div className="flex-1 min-w-0">
//                             <div className="font-medium text-sm group-hover:text-blue-700 transition-colors truncate">
//                               {item.title}
//                             </div>
//                             <div className="text-xs text-gray-500 mt-0.5">
//                               {item.date} • ₹{item.amount}
//                             </div>
//                           </div>

//                           {files.length > 0 && (
//                             <div className="space-y-1.5 min-w-[160px]">
//                               {showFiles.map((file, idx) => (
//                                 <div
//                                   key={idx}
//                                   className="flex items-center justify-between bg-white p-1.5 rounded-md text-xs shadow-sm border border-slate-100 h-8"
//                                 >
//                                   <span className="truncate font-medium text-gray-800 max-w-[80px]">
//                                     {getFileName(file)}
//                                   </span>
//                                   <div className="flex gap-1">
//                                     <Button
//                                       size="small"
//                                       type="text"
//                                       disabled={!!downloadingFile}
//                                       className="!p-0 w-6 h-6 text-gray-600 hover:text-blue-600"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         handlePreview(file);
//                                       }}
//                                     >
//                                       <EyeOutlined className="text-sm" />
//                                     </Button>
//                                     <Button
//                                       size="small"
//                                       type="text"
//                                       loading={downloadingFile === file}
//                                       disabled={!!downloadingFile && downloadingFile !== file}
//                                       className="!p-0 w-6 h-6 text-gray-600 hover:text-green-600"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         handleDownload(file);
//                                       }}
//                                     >
//                                       {downloadingFile !== file && <DownloadOutlined className="text-sm" />}
//                                     </Button>
//                                   </div>
//                                 </div>
//                               ))}
//                               {hasMoreFiles && (
//                                 <div className="pt-0.5">
//                                   <Button
//                                     size="small"
//                                     type="link"
//                                     className="p-0 text-xs text-blue-600 hover:text-blue-700 font-medium h-auto"
//                                   >
//                                     +{files.length - 3} more
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
//                   <div className="mb-2 font-semibold text-base text-gray-900">
//                     Activity Log
//                   </div>

//                   <Timeline>
//                     {selectedRow.activityLog.slice(-4).map((log, i) => (
//                       <Timeline.Item key={i}>
//                         <div className="text-xs font-semibold text-gray-700">{log.action}</div>
//                         {log.note && (
//                           <div className="text-xs text-gray-500 italic mt-0.5">"{log.note}"</div>
//                         )}
//                         <div className="text-xs text-gray-400 mt-0.5">{log.date}</div>
//                       </Timeline.Item>
//                     ))}
//                   </Timeline>
//                 </div>
//               </div>
//             </div>
//           )}
//         </Drawer>

//         {/* ===== MODAL ACTIONS ===== */}
//         <Modal
//           open={!!actionType}
//           footer={null}
//           centered
//           closable={false}
//           width={450}
//           className="rounded-lg overflow-hidden"
//           onCancel={() => {
//             setActionType(null);
//             setActionText("");
//           }}
//         >
//           {/* Header */}
//           <div className="px-5 py-3 border-b border-gray-200">
//             <h3 className="text-base font-semibold text-gray-800">
//               {actionType === "pay" && "Mark as Paid"}
//               {actionType === "hold" && "Put on Hold"}
//             </h3>
//             <p className="mt-0.5 text-xs text-gray-500">
//               Request ID: {currentRecord?.requestId}
//             </p>
//           </div>

//           {/* Body */}
//           <div className="px-5 py-4 bg-slate-50 space-y-3">
//             {actionType === "pay" && (
//               <div className="rounded-lg bg-white border p-4 shadow-sm">
//                 <p className="text-sm text-gray-700">
//                   Are you sure you want to mark request <b>{currentRecord?.requestId}</b> as paid?
//                 </p>
//               </div>
//             )}
//             {actionType === "hold" && (
//               <div className="space-y-2">
//                 <label className="text-xs font-medium text-gray-600">
//                   Reason for Hold <span className="text-red-500">*</span>
//                 </label>
//                 <Input.TextArea
//                   rows={4}
//                   value={actionText}
//                   onChange={(e) => setActionText(e.target.value)}
//                   placeholder="Enter the reason for putting this request on hold..."
//                   className="rounded-md text-sm"
//                 />
//               </div>
//             )}
//           </div>

//           {/* Footer */}
//           <div className="flex justify-end gap-2 px-5 py-3 bg-white border-t border-gray-200">
//             <Button
//               size="middle"
//               onClick={() => {
//                 setActionType(null);
//                 setActionText("");
//               }}
//               className="px-4"
//             >
//               Cancel
//             </Button>
//             <Button
//               size="middle"
//               type="primary"
//               className={
//                 actionType === "pay"
//                   ? "bg-green-500 hover:bg-green-600 border-none px-5"
//                   : "bg-orange-500 hover:bg-orange-600 border-none px-5"
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
//     // </Card>
//   );
// }



// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message, Popconfirm } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   EyeOutlined,
//   DownOutlined,
//   UpOutlined,
//   DollarOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";

// export default function FinanceReimbursementsPage() {
//   const queryClient = useQueryClient();
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
  
//   // NEW STATE for paid confirmation
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   // Add approve/reject mutations (we'll keep reject but not show in UI)
//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();

//   // Debug - log reimbursements
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];
    
//     if (!reimbursements || !Array.isArray(reimbursements)) {
//       return rows;
//     }
    
//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';
      
//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
          
//           const status = item.approverStatus || item.status || 'PENDING';
          
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             reimbursementItemId: item.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [],
//             itemStatus: status,
//           });
//         });
//       }
//     });
    
//     return rows;
//   }, [reimbursements]);

//   // 🔴 FILTER ONLY APPROVED ITEMS for Finance
//   const approvedItems = useMemo(() => {
//     return transformedData.filter(item => item.itemStatus === 'APPROVED');
//   }, [transformedData]);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return approvedItems;
//     return approvedItems.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [approvedItems, searchText]);

//   // Handle paid
//   const handlePaid = (record: any) => {
//     setSelectedItem(record);
//     setPaidModalVisible(true);
//   };

//   // Confirm paid
//   const confirmPaid = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     // Here you would call your paid API
//     // For now, just show success message
//     message.success(`Item marked as paid: ₹${selectedItem.amount}`);
//     setPaidModalVisible(false);
//     setSelectedItem(null);
    
//     // Refetch after a short delay
//     setTimeout(() => {
//       refetch();
//       queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//     }, 500);
//   };

//   // Toggle expand/collapse
//   const toggleExpand = (itemKey: string) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [itemKey]: !prev[itemKey]
//     }));
//   };

//   // State for expanded items
//   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

//   // Handle file click
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag - ONLY APPROVED for Finance
//   const getStatusTag = (status: string) => {
//     return <Tag color="green">Approved</Tag>; // Always show Approved
//   };

//   // Columns with PAID button
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => (
//         <div>
//           <div>{record.employeeName}</div>
//           <div className="text-xs text-gray-500">{record.employeeCode}</div>
//         </div>
//       ),
//     },
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: any) => (
//         <span className="font-semibold">₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Bill No",
//       dataIndex: "billNo",
//       key: "billNo",
//     },
//     // {
//     //   title: "Documents",
//     //   key: "documents",
//     //   render: (_: any, record: any) => {
//     //     const attachments = record.attachments || [];
//     //     const itemKey = record.key;
//     //     const isExpanded = expandedItems[itemKey];
        
//     //     if (attachments.length === 0) {
//     //       return <span className="text-gray-400">—</span>;
//     //     }
        
//     //     // Single file
//     //     if (attachments.length === 1) {
//     //       const file = attachments[0];
//     //       const fileName = file.fileName || '';
          
//     //       return (
//     //         <Button
//     //           type="link"
//     //           size="small"
//     //           icon={getFileIcon(file)}
//     //           onClick={() => handleFileClick(file)}
//     //           className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//     //         >
//     //           {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//     //         </Button>
//     //       );
//     //     }
        
//     //     // Multiple files
//     //     const firstFile = attachments[0];
//     //     const remainingFiles = attachments.slice(1);
//     //     const fileName = firstFile.fileName || '';
        
//     //     return (
//     //       <div className="flex flex-col gap-1">
//     //         {/* First file always visible */}
//     //         <Button
//     //           type="link"
//     //           size="small"
//     //           icon={getFileIcon(firstFile)}
//     //           onClick={() => handleFileClick(firstFile)}
//     //           className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//     //         >
//     //           {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
//     //         </Button>
            
//     //         {/* Expand/Collapse button */}
//     //         {remainingFiles.length > 0 && (
//     //           <Button
//     //             type="link"
//     //             size="small"
//     //             onClick={() => toggleExpand(itemKey)}
//     //             className="text-gray-600 hover:text-blue-600 p-0 h-auto text-xs"
//     //             icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
//     //           >
//     //             {isExpanded ? 'Show less' : `+${remainingFiles.length} more`}
//     //           </Button>
//     //         )}
            
//     //         {/* Expanded files list */}
//     //         {isExpanded && (
//     //           <div className="pl-2 mt-1 space-y-1 border-l-2 border-gray-200">
//     //             {remainingFiles.map((file: any, index: number) => (
//     //               <Button
//     //                 key={index}
//     //                 type="link"
//     //                 size="small"
//     //                 icon={getFileIcon(file)}
//     //                 onClick={() => handleFileClick(file)}
//     //                 className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left block"
//     //               >
//     //                 {file.fileName?.length > 25 
//     //                   ? file.fileName.substring(0, 25) + '...' 
//     //                   : file.fileName}
//     //               </Button>
//     //             ))}
//     //           </div>
//     //         )}
//     //       </div>
//     //     );
//     //   },
//     // },
//     {
//   title: "Documents",
//   key: "documents",
//   render: (_: any, record: any) => {
//     const attachments = record.attachments || [];
//     const itemKey = record.key;
//     const isExpanded = expandedItems[itemKey];
    
//     if (attachments.length === 0) {
//       return <span className="text-gray-400">—</span>;
//     }
    
//     // Single file
//     if (attachments.length === 1) {
//       const file = attachments[0];
//       const fileName = file.fileName || '';
      
//       return (
//         <Button
//           type="link"
//           size="small"
//           icon={getFileIcon(file)}
//           onClick={() => handleFileClick(file)}
//           className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//         >
//           {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//         </Button>
//       );
//     }
    
//     // Multiple files - VERTICAL layout
//     const firstFile = attachments[0];
//     const remainingFiles = attachments.slice(1);
//     const fileName = firstFile.fileName || '';
    
//     return (
//       <div className="flex flex-col gap-1">
//         {/* First file always visible */}
//         <Button
//           type="link"
//           size="small"
//           icon={getFileIcon(firstFile)}
//           onClick={() => handleFileClick(firstFile)}
//           className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//         >
//           {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
//         </Button>
        
//         {/* Expand/Collapse button */}
//         {remainingFiles.length > 0 && (
//           <Button
//             type="link"
//             size="small"
//             onClick={() => toggleExpand(itemKey)}
//             className="text-gray-600 hover:text-blue-600 p-0 h-auto text-xs"
//             icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
//           >
//             {isExpanded ? 'Show less' : `+${remainingFiles.length} more`}
//           </Button>
//         )}
        
//         {/* Expanded files list - VERTICAL layout (oru file kela oru file) */}
//         {isExpanded && (
//           <div className="flex flex-col gap-1 pl-2 mt-1 border-l-2 border-gray-200">
//             {remainingFiles.map((file: any, index: number) => (
//               <Button
//                 key={index}
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(file)}
//                 onClick={() => handleFileClick(file)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//               >
//                 {file.fileName?.length > 25 
//                   ? file.fileName.substring(0, 25) + '...' 
//                   : file.fileName}
//               </Button>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   },
// },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => getStatusTag(record.itemStatus),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         return (
//           <Popconfirm
//             title="Mark as Paid"
//             description={`Are you sure you want to mark this item as paid? Amount: ₹${Number(record.amount).toFixed(2)}`}
//             onConfirm={() => handlePaid(record)}
//             okText="Yes, Mark as Paid"
//             cancelText="Cancel"
//             okButtonProps={{ type: "primary" }}
//           >
//             <Button
//               type="primary"
//               size="small"
//               icon={<DollarOutlined />}
//               className="bg-green-600 hover:bg-green-700"
//             >
//               Paid
//             </Button>
//           </Popconfirm>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Finance - Approved Reimbursements
//           </h2>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={isRefetching}
//             size="small"
//           >
//             Refresh
//           </Button>
//         </div>
//         <Input.Search
//           placeholder="Search by employee, category, or bill no..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 300 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary - Only Approved Items */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Approved: {approvedItems.length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Amount: ₹{approvedItems.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table - Only Approved Items */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching}
//         pagination={{ 
//           pageSize: 10,
//           showTotal: (total: number) => `Total ${total} approved items`
//         }}
//         rowKey="key"
//         bordered
//       />

//       {/* Preview Modal */}
//       <Modal
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={1000}
//         bodyStyle={{ height: '80vh', padding: 0 }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Modal>

//       {/* Paid Confirmation Modal (if you want modal instead of Popconfirm) */}
//       {/* <Modal
//         title="Mark as Paid"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setSelectedItem(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//       >
//         <div className="py-4">
//           <p>Are you sure you want to mark this item as paid?</p>
//           {selectedItem && (
//             <div className="mt-2 p-3 bg-gray-50 rounded">
//               <p><strong>Employee:</strong> {selectedItem.employeeName}</p>
//               <p><strong>Category:</strong> {selectedItem.category}</p>
//               <p><strong>Amount:</strong> ₹{Number(selectedItem.amount).toFixed(2)}</p>
//               <p><strong>Bill No:</strong> {selectedItem.billNo}</p>
//             </div>
//           )}
//         </div>
//       </Modal> */}
//     </div>
//   );
// }









// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message, Popconfirm } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   EyeOutlined,
//   DownOutlined,
//   UpOutlined,
//   DollarOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";

// export default function FinanceReimbursementsPage() {
//   const queryClient = useQueryClient();
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
  
//   // State for paid confirmation
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   // Add approve/reject mutations
//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();
  
//   // 🔴 Add mark as paid mutation
//   const { mutate: markAsPaid, isPending: isPaidPending } = useMarkAsPaid();

//   // Debug - log reimbursements
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];
    
//     if (!reimbursements || !Array.isArray(reimbursements)) {
//       return rows;
//     }
    
//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';
      
//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
          
//           // 🔴 Include paid status
//           const status = item.approverStatus || item.status || 'PENDING';
          
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             reimbursementItemId: item.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [],
//             itemStatus: status,
//             // 🔴 Add paid status field (you'll need to add this in your backend)
//             isPaid: item.isPaid || false,
//           });
//         });
//       }
//     });
    
//     return rows;
//   }, [reimbursements]);

//   // 🔴 FILTER APPROVED AND NOT PAID ITEMS for Finance
//   const approvedItems = useMemo(() => {
//     return transformedData.filter(item => 
//       item.itemStatus === 'APPROVED' && !item.isPaid
//     );
//   }, [transformedData]);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return approvedItems;
//     return approvedItems.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [approvedItems, searchText]);

//   // Handle paid
//   const handlePaid = (record: any) => {
//     setSelectedItem(record);
//     setPaidModalVisible(true);
//   };

//   // 🔴 Confirm paid - use the markAsPaid mutation
//   const confirmPaid = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     markAsPaid(selectedItem.reimbursementItemId, {
//       onSuccess: () => {
//         message.success(`Item marked as paid: ₹${selectedItem.amount}`);
//         setPaidModalVisible(false);
//         setSelectedItem(null);
        
//         // Refetch after a short delay
//         setTimeout(() => {
//           refetch();
//         }, 500);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to mark as paid");
//         setPaidModalVisible(false);
//         setSelectedItem(null);
//       }
//     });
//   };

//   // Toggle expand/collapse
//   const toggleExpand = (itemKey: string) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [itemKey]: !prev[itemKey]
//     }));
//   };

//   // State for expanded items
//   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

//   // Handle file click
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // 🔴 Get status tag - Show PAID status
//   const getStatusTag = (record: any) => {
//     if (record.isPaid) {
//       return <Tag color="cyan">Paid</Tag>;
//     }
//     if (record.itemStatus === 'APPROVED') {
//       return <Tag color="green">Approved</Tag>;
//     }
//     return <Tag color="gold">Pending</Tag>;
//   };

//   // Columns with PAID button
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => (
//         <div>
//           <div>{record.employeeName}</div>
//           <div className="text-xs text-gray-500">{record.employeeCode}</div>
//         </div>
//       ),
//     },
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: any) => (
//         <span className="font-semibold">₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Bill No",
//       dataIndex: "billNo",
//       key: "billNo",
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];
//         const itemKey = record.key;
//         const isExpanded = expandedItems[itemKey];
        
//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }
        
//         // Single file
//         if (attachments.length === 1) {
//           const file = attachments[0];
//           const fileName = file.fileName || '';
          
//           return (
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(file)}
//               onClick={() => handleFileClick(file)}
//               className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//             >
//               {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//             </Button>
//           );
//         }
        
//         // Multiple files - VERTICAL layout
//         const firstFile = attachments[0];
//         const remainingFiles = attachments.slice(1);
//         const fileName = firstFile.fileName || '';
        
//         return (
//           <div className="flex flex-col gap-1">
//             {/* First file always visible */}
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(firstFile)}
//               onClick={() => handleFileClick(firstFile)}
//               className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//             >
//               {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
//             </Button>
            
//             {/* Expand/Collapse button */}
//             {remainingFiles.length > 0 && (
//               <Button
//                 type="link"
//                 size="small"
//                 onClick={() => toggleExpand(itemKey)}
//                 className="text-gray-600 hover:text-blue-600 p-0 h-auto text-xs"
//                 icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
//               >
//                 {isExpanded ? 'Show less' : `+${remainingFiles.length} more`}
//               </Button>
//             )}
            
//             {/* Expanded files list - VERTICAL layout */}
//             {isExpanded && (
//               <div className="flex flex-col gap-1 pl-2 mt-1 border-l-2 border-gray-200">
//                 {remainingFiles.map((file: any, index: number) => (
//                   <Button
//                     key={index}
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//                   >
//                     {file.fileName?.length > 25 
//                       ? file.fileName.substring(0, 25) + '...' 
//                       : file.fileName}
//                   </Button>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => getStatusTag(record),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         // 🔴 Don't show Paid button if already paid
//         if (record.isPaid) {
//           return <Tag color="cyan">Paid</Tag>;
//         }
        
//         return (
//           <Popconfirm
//             title="Mark as Paid"
//             description={`Are you sure you want to mark this item as paid? Amount: ₹${Number(record.amount).toFixed(2)}`}
//             onConfirm={() => handlePaid(record)}
//             okText="Yes, Mark as Paid"
//             cancelText="Cancel"
//             okButtonProps={{ type: "primary", loading: isPaidPending }}
//           >
//             <Button
//               type="primary"
//               size="small"
//               icon={<DollarOutlined />}
//               className="bg-green-600 hover:bg-green-700"
//               loading={isPaidPending && selectedItem?.reimbursementItemId === record.reimbursementItemId}
//             >
//               Paid
//             </Button>
//           </Popconfirm>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Finance - Approved Reimbursements
//           </h2>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={isRefetching}
//             size="small"
//           >
//             Refresh
//           </Button>
//         </div>
//         <Input.Search
//           placeholder="Search by employee, category, or bill no..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 300 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary - Only Approved Items */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Approved: {approvedItems.length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Amount: ₹{approvedItems.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table - Only Approved Items */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching}
//         pagination={{ 
//           pageSize: 10,
//           showTotal: (total: number) => `Total ${total} approved items`
//         }}
//         rowKey="key"
//         bordered
//       />

//       {/* Preview Modal */}
//       <Modal
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={1000}
//         bodyStyle={{ height: '80vh', padding: 0 }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Modal>

//       {/* Paid Confirmation Modal */}
//       <Modal
//         title="Mark as Paid"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setSelectedItem(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//         confirmLoading={isPaidPending}
//       >
//         <div className="py-4">
//           <p>Are you sure you want to mark this item as paid?</p>
//           {selectedItem && (
//             <div className="mt-2 p-3 bg-gray-50 rounded">
//               <p><strong>Employee:</strong> {selectedItem.employeeName}</p>
//               <p><strong>Category:</strong> {selectedItem.category}</p>
//               <p><strong>Amount:</strong> ₹{Number(selectedItem.amount).toFixed(2)}</p>
//               <p><strong>Bill No:</strong> {selectedItem.billNo}</p>
//             </div>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }ui chnages 


//   "use client";
// import { Button, Table, Tag, Input, Space, Modal, message, Popconfirm } from "antd";
// import { 
//   ReloadOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   DollarOutlined,
//   LinkOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useMarkAsPaid } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState } from "react";

// export default function FinanceReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
  
//   // State for paid confirmation
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();
  
//   // Add mark as paid mutation
//   const { mutate: markAsPaid, isPending: isPaidPending } = useMarkAsPaid();

//   // Transform data and filter only APPROVED items
//   const approvedItems = useMemo(() => {
//     const rows: any[] = [];
    
//     if (!reimbursements || !Array.isArray(reimbursements)) {
//       return rows;
//     }
    
//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';
      
//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
          
//           // Get item status
//           const status = item.approverStatus || item.status || 'PENDING';
//           const isPaid = item.isPaid || false;
          
//           // Only show APPROVED and NOT PAID items
//           if (status === 'APPROVED' && !isPaid) {
//             rows.push({
//               key: `${reimbursement.id}-${item.id || index}`,
//               reimbursementId: reimbursement.id,
//               reimbursementItemId: item.id,
//               employeeName: employeeName,
//               employeeCode: employeeCode,
//               category: item.category || 'N/A',
//               date: item.date || reimbursement.createdAt,
//               amount: item.amount || 0,
//               billNo: item.billNo || '—',
//               description: item.description || '—',
//               attachments: item.attachments || [],
//               itemStatus: status,
//               isPaid: isPaid,
//             });
//           }
//         });
//       }
//     });
    
//     return rows;
//   }, [reimbursements]);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return approvedItems;
//     return approvedItems.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.employeeCode?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [approvedItems, searchText]);

//   // Handle paid
//   const handlePaid = (record: any) => {
//     setSelectedItem(record);
//     setPaidModalVisible(true);
//   };

//   // Confirm paid
//   const confirmPaid = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     markAsPaid(selectedItem.reimbursementItemId, {
//       onSuccess: () => {
//         message.success(`Item marked as paid: ₹${selectedItem.amount}`);
//         setPaidModalVisible(false);
//         setSelectedItem(null);
        
//         // Refetch after a short delay
//         setTimeout(() => {
//           refetch();
//         }, 500);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to mark as paid");
//         setPaidModalVisible(false);
//         setSelectedItem(null);
//       }
//     });
//   };

//   // Handle file click for preview
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL for preview
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag
//   const getStatusTag = (record: any) => {
//     return <Tag color="green">Approved</Tag>;
//   };

//   // Expanded row renderer
//   const expandedRowRender = (record: any) => {
//     const attachments = record.attachments || [];
    
//     if (attachments.length <= 1) {
//       return <div className="text-gray-400 py-2">No additional files</div>;
//     }
    
//     // Skip the first file (already shown in main row)
//     const remainingFiles = attachments.slice(1);
    
//     return (
//       <div className="py-2">
//         <div className="text-xs text-gray-500 mb-2">Additional Documents:</div>
//         <div className="flex flex-col gap-2">
//           {remainingFiles.map((file: any, index: number) => (
//             <div key={index} className="flex items-center justify-between group bg-gray-50 p-2 rounded">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(file)}
//                 onClick={() => handleFileClick(file)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto flex-1 text-left"
//               >
//                 {file.fileName || 'Unnamed file'}
//               </Button>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<DownloadOutlined />}
//                 onClick={() => handleDownload(file)}
//                 className="opacity-0 group-hover:opacity-100 transition-opacity"
//                 title="Download"
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Columns
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       width: 180,
//       render: (_: any, record: any) => (
//         <div>
//           <div className="font-medium">{record.employeeName}</div>
//           <div className="text-xs text-gray-500">{record.employeeCode}</div>
//         </div>
//       ),
//     },
//     {
//       title: "Category",
//       key: "category",
//       width: 120,
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       width: 100,
//       render: (_: any, record: any) => (
//         <span className="font-semibold">₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Bill No",
//       dataIndex: "billNo",
//       key: "billNo",
//       width: 100,
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       width: 300,
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];
        
//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }
        
//         // Show first file + count in one line
//         const firstFile = attachments[0];
//         const remainingCount = attachments.length - 1;
//         const fileName = firstFile.fileName || '';
        
//         return (
//           <div className="flex items-center justify-between group">
//             <div className="flex items-center gap-1 flex-1 min-w-0">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(firstFile)}
//                 onClick={() => handleFileClick(firstFile)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//               >
//                 <span className="truncate block max-w-[150px]">
//                   {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//                 </span>
//               </Button>
//               {remainingCount > 0 && (
//                 <Tag color="blue" className="!text-xs !px-1 !py-0 !mx-0">
//                   +{remainingCount} more
//                 </Tag>
//               )}
//             </div>
//             <Button
//               type="text"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(firstFile)}
//               className="opacity-0 group-hover:opacity-100 transition-opacity"
//               title="Download"
//             />
//           </div>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       width: 100,
//       render: (_: any, record: any) => getStatusTag(record),
//     },
//     {
//       title: "Action",
//       key: "action",
//       width: 100,
//       render: (_: any, record: any) => (
//         <Popconfirm
//           title="Mark as Paid"
//           description={`Are you sure you want to mark this item as paid? Amount: ₹${Number(record.amount).toFixed(2)}`}
//           onConfirm={() => handlePaid(record)}
//           okText="Yes, Mark as Paid"
//           cancelText="Cancel"
//           okButtonProps={{ 
//             type: "primary", 
//             loading: isPaidPending && selectedItem?.reimbursementItemId === record.reimbursementItemId 
//           }}
//         >
//           <Button
//             type="primary"
//             size="small"
//             icon={<DollarOutlined />}
//             className="bg-green-600 hover:bg-green-700"
//             loading={isPaidPending && selectedItem?.reimbursementItemId === record.reimbursementItemId}
//           >
//             Paid
//           </Button>
//         </Popconfirm>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Finance - Approved Reimbursements
//           </h2>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={isRefetching}
//             size="small"
//           >
//             Refresh
//           </Button>
//         </div>
//         <Input.Search
//           placeholder="Search by employee, category, bill no..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 300 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary - Only Approved Items */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Approved: {approvedItems.length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{approvedItems.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table - Only Approved Items with Expandable Rows */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching}
//         pagination={{ 
//           pageSize: 10,
//           showTotal: (total: number) => `Total ${total} approved items`
//         }}
//         rowKey="key"
//         bordered
//         size="small"
//         scroll={{ x: 1200 }}
//         expandable={{
//           expandedRowRender,
//           expandRowByClick: true,
//           expandIconColumnIndex: -1, // Hide expand icon
//           rowExpandable: (record) => (record.attachments?.length || 0) > 1,
//         }}
//       />

//       {/* Preview Modal */}
//       <Modal
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={1000}
//         bodyStyle={{ height: '80vh', padding: 0 }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Modal>

//       {/* Paid Confirmation Modal */}
//       <Modal
//         title="Mark as Paid"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setSelectedItem(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//         confirmLoading={isPaidPending}
//       >
//         <div className="py-4">
//           <p>Are you sure you want to mark this item as paid?</p>
//           {selectedItem && (
//             <div className="mt-2 p-3 bg-gray-50 rounded">
//               <p><strong>Employee:</strong> {selectedItem.employeeName}</p>
//               <p><strong>Category:</strong> {selectedItem.category}</p>
//               <p><strong>Amount:</strong> ₹{Number(selectedItem.amount).toFixed(2)}</p>
//               <p><strong>Bill No:</strong> {selectedItem.billNo}</p>
//             </div>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }working


// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message, Popconfirm } from "antd";
// import { 
//   ReloadOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   DollarOutlined,
// } from "@ant-design/icons";
// import { useFinanceItems, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState } from "react";

// export default function FinanceReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
  
//   // State for paid confirmation
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
  
//   // const { 
//   //   data: items = [], 
//   //   isLoading: loading,
//   //   refetch,
//   //   isRefetching 
//   // } = useFinanceItems();
  
//   const { mutate: markAsPaid, isPending: isPaidPending } = useMarkAsPaid();

//   // Transform data for table
//   // const tableData = useMemo(() => {
//   //   return items.map((item: any) => ({
//   //     key: item.id,
//   //     reimbursementItemId: item.id,
//   //     reimbursementId: item.reimbursementId,
//   //     employeeName: item.reimbursement?.createdBy?.name || 
//   //                   `${item.reimbursement?.createdBy?.employee?.first_name || ''} ${item.reimbursement?.createdBy?.employee?.last_name || ''}`.trim() || 
//   //                   "N/A",
//   //     employeeCode: item.reimbursement?.createdBy?.employee?.employee_code || "N/A",
//   //     category: item.category,
//   //     date: item.date,
//   //     amount: item.amount,
//   //     billNo: item.billNo,
//   //     description: item.description,
//   //     attachments: item.attachments || [],
//   //     itemStatus: item.status, // "APPROVED" or "PAID"
//   //   }));
//   // }, [items]);
//   const { 
//   data: items = [], 
//   isLoading: loading,
//   refetch,
//   isRefetching 
// } = useFinanceItems();

// // Add these debug logs
// console.log('🔍 useFinanceItems hook - raw items:', items);
// console.log('🔍 Is items an array?', Array.isArray(items));
// console.log('🔍 Items length:', items?.length);
// console.log('🔍 Loading state:', loading);
// console.log('🔍 IsRefetching:', isRefetching);

// // Transform data for table
// const tableData = useMemo(() => {
//   console.log('🔄 Transforming items in useMemo:', items);
  
//   if (!items) {
//     console.log('❌ Items is null/undefined');
//     return [];
//   }
  
//   if (!Array.isArray(items)) {
//     console.log('❌ Items is not an array:', items);
//     return [];
//   }
  
//   console.log('✅ Items is array with length:', items.length);
  
//   return items.map((item: any, index: number) => {
//     console.log(`📦 Processing item ${index}:`, item);
    
//     return {
//       key: item.id || index,
//       reimbursementItemId: item.id,
//       reimbursementId: item.reimbursementId,
//       employeeName: item.reimbursement?.createdBy?.name || 
//                     `${item.reimbursement?.createdBy?.employee?.first_name || ''} ${item.reimbursement?.createdBy?.employee?.last_name || ''}`.trim() || 
//                     "N/A",
//       employeeCode: item.reimbursement?.createdBy?.employee?.employee_code || "N/A",
//       category: item.category,
//       date: item.date,
//       amount: item.amount,
//       billNo: item.billNo,
//       description: item.description,
//       attachments: item.attachments || [],
//       itemStatus: item.status,
//     };
//   });
// }, [items]);

// console.log('🏁 Final tableData:', tableData);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return tableData;
//     return tableData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.employeeCode?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [tableData, searchText]);

//   // Handle paid button click
//   const handlePaid = (record: any) => {
//     setSelectedItem(record);
//     setPaidModalVisible(true);
//   };

//   // Confirm paid
//   const confirmPaid = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     markAsPaid(selectedItem.reimbursementItemId, {
//       onSuccess: () => {
//         message.success(`Item marked as paid: ₹${selectedItem.amount}`);
//         setPaidModalVisible(false);
//         setSelectedItem(null);
//         refetch(); // Refresh the list
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to mark as paid");
//         setPaidModalVisible(false);
//         setSelectedItem(null);
//       }
//     });
//   };

//   // Handle file click for preview
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL for preview
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag based on item status
//   const getStatusTag = (record: any) => {
//     if (record.itemStatus === "PAID") {
//       return <Tag color="purple">Paid</Tag>;
//     }
//     if (record.itemStatus === "APPROVED") {
//       return <Tag color="green">Approved</Tag>;
//     }
//     return <Tag>{record.itemStatus}</Tag>;
//   };

//   // Expanded row renderer for multiple files
//   const expandedRowRender = (record: any) => {
//     const attachments = record.attachments || [];
    
//     if (attachments.length <= 1) {
//       return <div className="text-gray-400 py-2">No additional files</div>;
//     }
    
//     const remainingFiles = attachments.slice(1);
    
//     return (
//       <div className="py-2">
//         <div className="text-xs text-gray-500 mb-2">Additional Documents:</div>
//         <div className="flex flex-col gap-2">
//           {remainingFiles.map((file: any, index: number) => (
//             <div key={index} className="flex items-center justify-between group bg-gray-50 p-2 rounded">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(file)}
//                 onClick={() => handleFileClick(file)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto flex-1 text-left"
//               >
//                 {file.fileName || 'Unnamed file'}
//               </Button>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<DownloadOutlined />}
//                 onClick={() => handleDownload(file)}
//                 className="opacity-0 group-hover:opacity-100 transition-opacity"
//                 title="Download"
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Table columns
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       width: 180,
//       render: (_: any, record: any) => (
//         <div>
//           <div className="font-medium">{record.employeeName}</div>
//           <div className="text-xs text-gray-500">{record.employeeCode}</div>
//         </div>
//       ),
//     },
//     {
//       title: "Category",
//       key: "category",
//       width: 120,
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       width: 100,
//       render: (_: any, record: any) => (
//         <span className="font-semibold">₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Bill No",
//       dataIndex: "billNo",
//       key: "billNo",
//       width: 100,
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       width: 300,
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];
        
//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }
        
//         const firstFile = attachments[0];
//         const remainingCount = attachments.length - 1;
//         const fileName = firstFile.fileName || '';
        
//         return (
//           <div className="flex items-center justify-between group">
//             <div className="flex items-center gap-1 flex-1 min-w-0">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(firstFile)}
//                 onClick={() => handleFileClick(firstFile)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//               >
//                 <span className="truncate block max-w-[150px]">
//                   {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//                 </span>
//               </Button>
//               {remainingCount > 0 && (
//                 <Tag color="blue" className="!text-xs !px-1 !py-0 !mx-0">
//                   +{remainingCount} more
//                 </Tag>
//               )}
//             </div>
//             <Button
//               type="text"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(firstFile)}
//               className="opacity-0 group-hover:opacity-100 transition-opacity"
//               title="Download"
//             />
//           </div>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       width: 100,
//       render: (_: any, record: any) => getStatusTag(record),
//     },
//     {
//       title: "Action",
//       key: "action",
//       width: 100,
//       render: (_: any, record: any) => {
//         // If already paid, show disabled Paid tag
//         if (record.itemStatus === "PAID") {
//           return <Tag color="purple">Paid</Tag>;
//         }
        
//         // Otherwise show Paid button
//         return (
//           <Popconfirm
//             title="Mark as Paid"
//             description={`Are you sure you want to mark this item as paid? Amount: ₹${Number(record.amount).toFixed(2)}`}
//             onConfirm={() => handlePaid(record)}
//             okText="Yes, Mark as Paid"
//             cancelText="Cancel"
//             okButtonProps={{ 
//               type: "primary", 
//               loading: isPaidPending && selectedItem?.reimbursementItemId === record.reimbursementItemId 
//             }}
//           >
//             <Button
//               type="primary"
//               size="small"
//               icon={<DollarOutlined />}
//               className="bg-green-600 hover:bg-green-700"
//               loading={isPaidPending && selectedItem?.reimbursementItemId === record.reimbursementItemId}
//             >
//               Paid
//             </Button>
//           </Popconfirm>
//         );
//       },
//     },
//   ];

//   // Calculate totals
//   const totalAmount = useMemo(() => {
//     return tableData.reduce((sum, r) => sum + Number(r.amount || 0), 0);
//   }, [tableData]);

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Finance - Reimbursements
//           </h2>
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={isRefetching}
//             size="small"
//           >
//             Refresh
//           </Button>
//         </div>
//         <Input.Search
//           placeholder="Search by employee, category, bill no..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 300 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {tableData.length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching}
//         pagination={{ 
//           pageSize: 10,
//           showTotal: (total: number) => `Total ${total} items`
//         }}
//         rowKey="key"
//         bordered
//         size="small"
//         scroll={{ x: 1200 }}
//         expandable={{
//           expandedRowRender,
//           expandRowByClick: true,
//           expandIconColumnIndex: -1,
//           rowExpandable: (record) => (record.attachments?.length || 0) > 1,
//         }}
//       />

//       {/* Preview Modal */}
//       <Modal
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={1000}
//         styles={{ body: { height: '80vh', padding: 0 } }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Modal>

//       {/* Paid Confirmation Modal */}
//       <Modal
//         title="Mark as Paid"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setSelectedItem(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//         confirmLoading={isPaidPending}
//       >
//         <div className="py-4">
//           <p>Are you sure you want to mark this item as paid?</p>
//           {selectedItem && (
//             <div className="mt-2 p-3 bg-gray-50 rounded">
//               <p><strong>Employee:</strong> {selectedItem.employeeName}</p>
//               <p><strong>Category:</strong> {selectedItem.category}</p>
//               <p><strong>Amount:</strong> ₹{Number(selectedItem.amount).toFixed(2)}</p>
//               <p><strong>Bill No:</strong> {selectedItem.billNo}</p>
//             </div>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }only change table 



// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message, Popconfirm } from "antd";
// import { 
//   ReloadOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   DollarOutlined,
// } from "@ant-design/icons";
// import { useFinanceItems, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState } from "react";

// export default function FinanceReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
  
//   // State for paid confirmation
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
  
//   const { 
//     data: items = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useFinanceItems();
  
//   const { mutate: markAsPaid, isPending: isPaidPending } = useMarkAsPaid();

//   // Debug logs
//   console.log('🔍 useFinanceItems hook - raw items:', items);
//   console.log('🔍 Is items an array?', Array.isArray(items));
//   console.log('🔍 Items length:', items?.length);
//   console.log('🔍 Loading state:', loading);
//   console.log('🔍 IsRefetching:', isRefetching);

//   // Transform data for table
//   const tableData = useMemo(() => {
//     console.log('🔄 Transforming items in useMemo:', items);
    
//     if (!items) {
//       console.log('❌ Items is null/undefined');
//       return [];
//     }
    
//     if (!Array.isArray(items)) {
//       console.log('❌ Items is not an array:', items);
//       return [];
//     }
    
//     console.log('✅ Items is array with length:', items.length);
    
//     return items.map((item: any, index: number) => {
//       console.log(`📦 Processing item ${index}:`, item);
      
//       return {
//         key: item.id || index,
//         reimbursementItemId: item.id,
//         reimbursementId: item.reimbursementId,
//         employeeName: item.reimbursement?.createdBy?.name || 
//                       `${item.reimbursement?.createdBy?.employee?.first_name || ''} ${item.reimbursement?.createdBy?.employee?.last_name || ''}`.trim() || 
//                       "N/A",
//         employeeCode: item.reimbursement?.createdBy?.employee?.employee_code || "N/A",
//         category: item.category,
//         date: item.date,
//         amount: item.amount,
//         billNo: item.billNo,
//         description: item.description,
//         attachments: item.attachments || [],
//         itemStatus: item.status,
//       };
//     });
//   }, [items]);

//   console.log('🏁 Final tableData:', tableData);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return tableData;
//     return tableData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.employeeCode?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [tableData, searchText]);

//   // Handle paid button click
//   const handlePaid = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
//     setSelectedItem(record);
//     setPaidModalVisible(true);
//   };

//   // Confirm paid
//   const confirmPaid = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     markAsPaid(selectedItem.reimbursementItemId, {
//       onSuccess: () => {
//         message.success(`Item marked as paid: ₹${selectedItem.amount}`);
//         setPaidModalVisible(false);
//         setSelectedItem(null);
//         refetch();
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to mark as paid");
//         setPaidModalVisible(false);
//         setSelectedItem(null);
//       }
//     });
//   };

//   // Handle file click for preview
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL for preview
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag based on item status
//   const getStatusTag = (record: any) => {
//     if (record.itemStatus === "PAID") {
//       return <Tag color="purple">Paid</Tag>;
//     }
//     if (record.itemStatus === "APPROVED") {
//       return <Tag color="green">Approved</Tag>;
//     }
//     return <Tag>{record.itemStatus}</Tag>;
//   };

//   // Expanded row renderer for multiple files
//   const expandedRowRender = (record: any) => {
//     const attachments = record.attachments || [];
    
//     if (attachments.length <= 1) {
//       return <div className="text-gray-400 py-2">No additional files</div>;
//     }
    
//     const remainingFiles = attachments.slice(1);
    
//     return (
//       <div className="py-2">
//         <div className="text-xs text-gray-500 mb-2">Additional Documents:</div>
//         <div className="flex flex-col gap-2">
//           {remainingFiles.map((file: any, index: number) => (
//             <div key={index} className="flex items-center justify-between group bg-gray-50 p-2 rounded">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(file)}
//                 onClick={() => handleFileClick(file)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto flex-1 text-left"
//               >
//                 {file.fileName || 'Unnamed file'}
//               </Button>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<DownloadOutlined />}
//                 onClick={() => handleDownload(file)}
//                 className="opacity-0 group-hover:opacity-100 transition-opacity"
//                 title="Download"
//               />
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   // Table columns
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       width: 180,
//       render: (_: any, record: any) => (
//         <div>
//           <div className="font-medium">{record.employeeName}</div>
//           {/* <div className="text-xs text-gray-500">{record.employeeCode}</div> */}
//         </div>
//       ),
//     },
//     {
//       title: "Category",
//       key: "category",
//       width: 120,
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       width: 100,
//       render: (_: any, record: any) => (
//         <span className="font-semibold">₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Bill No",
//       dataIndex: "billNo",
//       key: "billNo",
//       width: 100,
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       width: 300,
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];
        
//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }
        
//         const firstFile = attachments[0];
//         const remainingCount = attachments.length - 1;
//         const fileName = firstFile.fileName || '';
        
//         return (
//           <div className="flex items-center justify-between group">
//             <div className="flex items-center gap-1 flex-1 min-w-0">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(firstFile)}
//                 onClick={() => handleFileClick(firstFile)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//               >
//                 <span className="truncate block max-w-[150px]">
//                   {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//                 </span>
//               </Button>
//               {remainingCount > 0 && (
//                 <Tag color="blue" className="!text-xs !px-1 !py-0 !mx-0">
//                   +{remainingCount} more
//                 </Tag>
//               )}
//             </div>
//             <Button
//               type="text"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(firstFile)}
//               className="opacity-0 group-hover:opacity-100 transition-opacity"
//               title="Download"
//             />
//           </div>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       width: 100,
//       render: (_: any, record: any) => getStatusTag(record),
//     },
//     {
//       title: "Action",
//       key: "action",
//       width: 100,
//       render: (_: any, record: any) => {
//         if (record.itemStatus === "PAID") {
//           return <Tag color="purple">Paid</Tag>;
//         }
        
//         return (
//           <Popconfirm
//             title="Mark as Paid"
//             description={`Are you sure you want to mark this item as paid? Amount: ₹${Number(record.amount).toFixed(2)}`}
//             onConfirm={() => handlePaid(record)}
//             okText="Yes, Mark as Paid"
//             cancelText="Cancel"
//             okButtonProps={{ 
//               type: "primary", 
//               loading: isPaidPending && selectedItem?.reimbursementItemId === record.reimbursementItemId 
//             }}
//           >
//             <Button
//               type="primary"
//               size="small"
//               icon={<DollarOutlined />}
//               className="bg-green-600 hover:bg-green-700"
//               loading={isPaidPending && selectedItem?.reimbursementItemId === record.reimbursementItemId}
//             >
//               Paid
//             </Button>
//           </Popconfirm>
//         );
//       },
//     },
//   ];

//   // Calculate totals
//   const totalAmount = useMemo(() => {
//     return tableData.reduce((sum, r) => sum + Number(r.amount || 0), 0);
//   }, [tableData]);

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Finance - Reimbursements
//           </h2>
//           {/* <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={isRefetching}
//             size="small"
//           >
//             Refresh
//           </Button> */}
//         </div>
//         <Input.Search
//           placeholder="Search by employee, category, bill no..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 300 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary - Updated to match employee page style */}
//       <div className="flex gap-1.5 mb-3">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {tableData.length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table - Updated with employee page styling */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching}
//         size="small"
//         bordered
//         pagination={{ 
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total: number) => `Total ${total} items`
//         }}
//         rowKey="key"
//         scroll={{ x: 1200 }}
//         expandable={{
//           expandedRowRender,
//           expandRowByClick: true,
//           expandIconColumnIndex: -1,
//           rowExpandable: (record) => (record.attachments?.length || 0) > 1,
//         }}
//       />

//       {/* Preview Modal */}
//       <Modal
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={1000}
//         styles={{ body: { height: '80vh', padding: 0 } }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Modal>

//       {/* Paid Confirmation Modal */}
//       <Modal
//         title="Mark as Paid"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setSelectedItem(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//         confirmLoading={isPaidPending}
//       >
//         <div className="py-4">
//           <p>Are you sure you want to mark this item as paid?</p>
//           {selectedItem && (
//             <div className="mt-2 p-3 bg-gray-50 rounded">
//               <p><strong>Employee:</strong> {selectedItem.employeeName}</p>
//               <p><strong>Category:</strong> {selectedItem.category}</p>
//               <p><strong>Amount:</strong> ₹{Number(selectedItem.amount).toFixed(2)}</p>
//               <p><strong>Bill No:</strong> {selectedItem.billNo}</p>
//             </div>
//           )}
//         </div>
//       </Modal>
//     </div>
//   );
// }all working with paid



// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   EyeOutlined,
//   DownOutlined,
//   UpOutlined,
//   DollarOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";

// export default function ManagerReimbursementsPage() {
//   const queryClient = useQueryClient();
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [rejectRemarks, setRejectRemarks] = useState("");
  
//   // Approve confirmation modal
//   const [approveModalVisible, setApproveModalVisible] = useState(false);
//   const [itemToApprove, setItemToApprove] = useState<any>(null);
  
//   // Paid confirmation modal
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [itemToMarkPaid, setItemToMarkPaid] = useState<any>(null);
  
//   // Expanded items for multiple files
//   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   // Add approve/reject mutations
//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();
  
//   // Add mark as paid mutation
//   const markAsPaidMutation = useMarkAsPaid();

//   // Debug - log reimbursements
//   // const transformedData = useMemo(() => {
//   //   const rows: any[] = [];
    
//   //   if (!reimbursements || !Array.isArray(reimbursements)) {
//   //     return rows;
//   //   }
    
//   //   reimbursements.forEach((reimbursement: any) => {
//   //     const employeeName = reimbursement.employeeName || 
//   //                         reimbursement.createdBy?.name || 
//   //                         'N/A';
//   //     const employeeCode = reimbursement.employeeCode || 
//   //                         reimbursement.createdBy?.employee?.employee_code || 
//   //                         'N/A';
      
//   //     if (reimbursement.items && reimbursement.items.length > 0) {
//   //       reimbursement.items.forEach((item: any, index: number) => {
          
//   //         const status = item.approverStatus || item.status || 'PENDING';
          
//   //         rows.push({
//   //           key: `${reimbursement.id}-${item.id || index}`,
//   //           reimbursementId: reimbursement.id,
//   //           reimbursementItemId: item.id,
//   //           employeeName: employeeName,
//   //           employeeCode: employeeCode,
//   //           category: item.category || 'N/A',
//   //           date: item.date || reimbursement.createdAt,
//   //           amount: item.amount || 0,
//   //           billNo: item.billNo || '—',
//   //           description: item.description || '—',
//   //           attachments: item.attachments || [],
//   //           itemStatus: status,
//   //           // Add paid status from your data structure
//   //           paidStatus: item.paidStatus || item.paid || 'UNPAID',
//   //         });
//   //       });
//   //     }
//   //   });
    
//   //   return rows;
//   // }, [reimbursements]);
//   const transformedData = useMemo(() => {
//   const rows: any[] = [];
  
//   if (!reimbursements || !Array.isArray(reimbursements)) {
//     return rows;
//   }
  
//   reimbursements.forEach((reimbursement: any) => {
//     const employeeName = reimbursement.employeeName || 
//                         reimbursement.createdBy?.name || 
//                         'N/A';
//     const employeeCode = reimbursement.employeeCode || 
//                         reimbursement.createdBy?.employee?.employee_code || 
//                         'N/A';
    
//     if (reimbursement.items && reimbursement.items.length > 0) {
//       reimbursement.items.forEach((item: any, index: number) => {
        
//         rows.push({
//           key: `${reimbursement.id}-${item.id || index}`,
//           reimbursementId: reimbursement.id,
//           reimbursementItemId: item.id,
//           employeeName: employeeName,
//           employeeCode: employeeCode,
//           category: item.category || 'N/A',
//           date: item.date || reimbursement.createdAt,
//           amount: item.amount || 0,
//           billNo: item.billNo || '—',
//           description: item.description || '—',
//           attachments: item.attachments || [],
//           // Approval status (from approvers table)
//           itemStatus: item.approverStatus || 'PENDING',
//           //  itemStatus: item.status || 'PENDING',
//           // Payment status (from reimbursementItem table)
//           // paidStatus: item.status || 'UNPAID',  // ✅ This will be 'PAID' after markAsPaid
//           paidStatus: item.itemStatus || 'UNPAID',
           
//         });
//       });
//     }
//   });
  
//   return rows;
// }, [reimbursements]);
// useEffect(() => {
//   if (reimbursements && reimbursements.length > 0) {
//     console.log("🔍 First reimbursement item:", reimbursements[0]?.items?.[0]);
//     console.log("🔍 All fields:", Object.keys(reimbursements[0]?.items?.[0] || {}));
//   }
// }, [reimbursements]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle approve button click
//   const handleApproveClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     setItemToApprove(record);
//     setApproveModalVisible(true);
//   };

//   // Confirm approve
//   const confirmApprove = () => {
//     if (!itemToApprove?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     approveMutation.mutate(itemToApprove.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         setApproveModalVisible(false);
//         setItemToApprove(null);
        
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
//         setApproveModalVisible(false);
//         setItemToApprove(null);
//       }
//     });
//   };

//   // Handle paid button click
//   // const handlePaidClick = (record: any) => {
//   //   if (!record.reimbursementItemId) {
//   //     message.error("Invalid item ID");
//   //     return;
//   //   }
    
//   //   setItemToMarkPaid(record);
//   //   setPaidModalVisible(true);
//   // };
//   // In your ManagerReimbursementsPage component
// const handlePaidClick = (record: any) => {
//   console.log("🔍 Paid clicked for record:", {
//     reimbursementItemId: record.reimbursementItemId,
//     itemStatus: record.itemStatus,
//     paidStatus: record.paidStatus,
//     fullRecord: record
//   });
  
//   if (!record.reimbursementItemId) {
//     message.error("Invalid item ID");
//     return;
//   }
  
//   setItemToMarkPaid(record);
//   setPaidModalVisible(true);
// };

// // In confirmPaid function
// const confirmPaid = () => {
//   console.log("🔍 Confirm paid for item:", itemToMarkPaid);
  
//   if (!itemToMarkPaid?.reimbursementItemId) {
//     message.error("No item selected");
//     return;
//   }
  
//   console.log("🔍 Calling markAsPaidMutation with ID:", itemToMarkPaid.reimbursementItemId);
  
//   markAsPaidMutation.mutate(itemToMarkPaid.reimbursementItemId, {
//     onSuccess: () => {
//       console.log("✅ Mark as paid success");
//       message.success("Item marked as paid successfully");
//       setPaidModalVisible(false);
//       setItemToMarkPaid(null);
      
//       setTimeout(() => {
//         refetch();
//         queryClient.invalidateQueries({ 
//           queryKey: ["manager-approvals"] 
//         });
//       }, 100);
//     },
//     onError: (error: any) => {
//       console.error("❌ Mark as paid error:", error);
//       message.error(error?.message || "Failed to mark item as paid");
//       setPaidModalVisible(false);
//       setItemToMarkPaid(null);
//     }
//   });
// };

//   // Confirm paid - Now using the actual mutation
//   // const confirmPaid = () => {
//   //   if (!itemToMarkPaid?.reimbursementItemId) {
//   //     message.error("No item selected");
//   //     return;
//   //   }
    
//   //   markAsPaidMutation.mutate(itemToMarkPaid.reimbursementItemId, {
//   //     onSuccess: () => {
//   //       message.success("Item marked as paid successfully");
//   //       setPaidModalVisible(false);
//   //       setItemToMarkPaid(null);
        
//   //       // Refetch data to show updated status
//   //       setTimeout(() => {
//   //         refetch();
//   //         queryClient.invalidateQueries({ 
//   //           queryKey: ["manager-approvals"] 
//   //         });
//   //       }, 100);
//   //     },
//   //     onError: (error: any) => {
//   //       message.error(error?.message || "Failed to mark item as paid");
//   //       setPaidModalVisible(false);
//   //       setItemToMarkPaid(null);
//   //     }
//   //   });
//   // };

//   // Handle reject button click
//   const handleRejectClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     setSelectedItem(record);
//     setRejectModalVisible(true);
//   };

//   // Confirm reject
//   const confirmReject = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     rejectMutation.mutate({
//       id: selectedItem.reimbursementItemId,
//       remarks: rejectRemarks || "Rejected by manager"
//     }, {
//       onSuccess: () => {
//         message.success("Item rejected successfully");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
        
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 500);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to reject item");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//       }
//     });
//   };

//   // Toggle expand/collapse for multiple files
//   const toggleExpand = (itemKey: string) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [itemKey]: !prev[itemKey]
//     }));
//   };

//   // Handle file click
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag
//   // const getStatusTag = (status: string) => {
//   //   switch(status?.toUpperCase()) {
//   //     case 'APPROVED':
//   //       return <Tag color="green">Approved</Tag>;
//   //     case 'REJECTED':
//   //       return <Tag color="red">Rejected</Tag>;
//   //     default:
//   //       return <Tag color="gold">Pending</Tag>;
//   //   }
//   // };
// const getStatusTag = (status: string) => {
//   switch(status?.toUpperCase()) {
//     case 'APPROVED':
//       return <Tag color="green">Approved</Tag>;
//     case 'REJECTED':
//       return <Tag color="red">Rejected</Tag>;
//     case 'PENDING':
//       return <Tag color="gold">Pending</Tag>;
//     case 'PAID':
//       return <Tag color="blue">Paid</Tag>;
//     case 'SUBMITTED':
//       return <Tag color="cyan">Submitted</Tag>;
//     default:
//       return <Tag color="default">{status || 'Unknown'}</Tag>;
//   }
// };
  
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => (
//         <div>
//           <div>{record.employeeName}</div>
//           {/* <div className="text-xs text-gray-500">{record.employeeCode}</div> */}
//         </div>
//       ),
//     },
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: any) => (
//         <span>₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Bill No",
//       dataIndex: "billNo",
//       key: "billNo",
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       width: 300,
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];
//         const itemKey = record.key;
//         const isExpanded = expandedItems[itemKey];
        
//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }
        
//         // Single file - show file name only
//         if (attachments.length === 1) {
//           const file = attachments[0];
//           const fileName = file.fileName || '';
          
//           return (
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(file)}
//               onClick={() => handleFileClick(file)}
//               className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//             >
//               {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//             </Button>
//           );
//         }
        
//         // Multiple files - show first file + count in one line
//         const firstFile = attachments[0];
//         const remainingFiles = attachments.slice(1);
//         const fileName = firstFile.fileName || '';
        
//         return (
//           <div className="flex flex-col">
//             {/* First file + count in one line */}
//             <div className="flex items-center gap-1">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(firstFile)}
//                 onClick={() => handleFileClick(firstFile)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//               >
//                 {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
//               </Button>
              
//               {/* Count tag - click to expand/collapse */}
//               <Tag 
//                 color="blue" 
//                 className="cursor-pointer hover:bg-blue-100 transition-colors"
//                 onClick={() => toggleExpand(itemKey)}
//               >
//                 +{remainingFiles.length} more
//               </Tag>
//             </div>
            
//             {/* Expanded files list - shown when clicked */}
//             {isExpanded && (
//               <div className="flex flex-col gap-1 pl-6 mt-2 border-l-2 border-gray-200">
//                 {remainingFiles.map((file: any, index: number) => (
//                   <Button
//                     key={index}
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//                   >
//                     {file.fileName?.length > 25 
//                       ? file.fileName.substring(0, 25) + '...' 
//                       : file.fileName}
//                   </Button>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => getStatusTag(record.itemStatus),
//     },
  
//     // Paid column
//     {
//       title: "Paid",
//       key: "paid",
//       render: (_: any, record: any) => {
//         const isPaid = record.paidStatus === 'PAID';
        
//         if (isPaid) {
//           return <Tag color="green">Paid</Tag>;
//         }
        
//         // Unpaid - show as clickable blue tag
//         return (
//           <Tag 
//             color="blue" 
//             className="cursor-pointer hover:bg-blue-100 transition-colors"
//             icon={<DollarOutlined />}
//             onClick={() => handlePaidClick(record)}
//           >
//             Unpaid
//           </Tag>
//         );
//       },
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         const isPending = record.itemStatus === 'PENDING';
//         const isApproved = record.itemStatus === 'APPROVED';
//         const isRejected = record.itemStatus === 'REJECTED';
        
//         if (isApproved || isRejected) {
//           return (
//             <Space size={4}>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<CheckOutlined />}
//                 className="text-gray-400 cursor-not-allowed"
//                 disabled={true}
//               >
//                 Approve
//               </Button>
              
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<CloseOutlined />}
//                 className="text-gray-400 cursor-not-allowed"
//                 disabled={true}
//               >
//                 Reject
//               </Button>
//             </Space>
//           );
//         }
        
//         return (
//           <Space size={4}>
//             <Button
//               type="text"
//               size="small"
//               icon={<CheckOutlined />}
//               className="text-green-600 hover:text-green-800"
//               onClick={() => handleApproveClick(record)}
//               loading={approveMutation.isPending && approveMutation.variables === record.reimbursementItemId}
//             >
//               Approve
//             </Button>
            
//             <Button
//               type="text"
//               size="small"
//               icon={<CloseOutlined />}
//               className="text-red-600 hover:text-red-800"
//               onClick={() => handleRejectClick(record)}
//               loading={rejectMutation.isPending && selectedItem?.reimbursementItemId === record.reimbursementItemId}
//             >
//               Reject
//             </Button>
//           </Space>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Team Reimbursements
//           </h2>
//           {/* <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             loading={isRefetching}
//             size="small"
//           >
//             Refresh
//           </Button> */}
//         </div>
//         <Input.Search
//           placeholder="Search by employee, category, or bill no..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 300 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary - Updated with paid summary */}
//       <div className="flex gap-1.5 mb-3 flex-wrap">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-2 !py-0.5 !text-xs">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//         {/* Paid summary */}
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Unpaid: {transformedData.filter(item => item.paidStatus !== 'PAID').length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Paid: {transformedData.filter(item => item.paidStatus === 'PAID').length}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching}
//         size="small"
//         bordered
//         pagination={{ 
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total: number) => `Total ${total} items`
//         }}
//         rowKey="key"
//       />

//       {/* Approve Confirmation Modal */}
//       <Modal
//         title="Confirm Approval"
//         open={approveModalVisible}
//         onOk={confirmApprove}
//         onCancel={() => {
//           setApproveModalVisible(false);
//           setItemToApprove(null);
//         }}
//         okText="Yes, Approve"
//         cancelText="Cancel"
//         okButtonProps={{ type: "primary", className: "bg-green-600 hover:bg-green-700" }}
//         confirmLoading={approveMutation.isPending}
//       >
//         <div className="py-4">
//           <p className="text-base">Are you sure you want to approve this item?</p>
//         </div>
//       </Modal>

//       {/* Paid Confirmation Modal - Now connected to the mutation */}
//       <Modal
//         title="Confirm Payment"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setItemToMarkPaid(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//         okButtonProps={{ type: "primary", className: "bg-blue-600 hover:bg-blue-700" }}
//         confirmLoading={markAsPaidMutation.isPending}
//       >
//         <div className="py-4">
//           <p className="text-base mb-2">Are you sure you want to mark this item as paid?</p>
//           {itemToMarkPaid && (
//             <div className="bg-gray-50 p-3 rounded-md">
//               <p><span className="font-medium">Employee:</span> {itemToMarkPaid.employeeName}</p>
//               <p><span className="font-medium">Category:</span> {itemToMarkPaid.category}</p>
//               <p><span className="font-medium">Amount:</span> ₹{Number(itemToMarkPaid.amount).toFixed(2)}</p>
//               <p><span className="font-medium">Bill No:</span> {itemToMarkPaid.billNo}</p>
//             </div>
//           )}
//         </div>
//       </Modal>

//       {/* Preview Modal */}
//       <Modal
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={1000}
//         styles={{ body: { height: '80vh', padding: 0 } }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Modal>

//       {/* Reject Modal */}
//       <Modal
//         title="Reject Item"
//         open={rejectModalVisible}
//         onOk={confirmReject}
//         onCancel={() => {
//           setRejectModalVisible(false);
//           setRejectRemarks("");
//           setSelectedItem(null);
//         }}
//         okText="Reject"
//         okButtonProps={{ danger: true }}
//         confirmLoading={rejectMutation.isPending}
//       >
//         <div className="py-4">
//           <label className="block mb-2 text-sm font-medium">
//             Remarks (Optional)
//           </label>
//           <Input.TextArea
//             rows={4}
//             value={rejectRemarks}
//             onChange={(e) => setRejectRemarks(e.target.value)}
//             placeholder="Enter reason for rejection..."
//           />
//         </div>
//       </Modal>
//     </div>
//   );
// }partially working





// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   DollarOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";

// export default function ManagerReimbursementsPage() {
//   const queryClient = useQueryClient();
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [rejectRemarks, setRejectRemarks] = useState("");
  
//   // Approve confirmation modal
//   const [approveModalVisible, setApproveModalVisible] = useState(false);
//   const [itemToApprove, setItemToApprove] = useState<any>(null);
  
//   // Paid confirmation modal
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [itemToMarkPaid, setItemToMarkPaid] = useState<any>(null);
  
//   // Expanded items for multiple files
//   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();
//   const markAsPaidMutation = useMarkAsPaid();

//   // 🔴 SIMPLE & CLEAN transformation
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];
    
//     if (!reimbursements || !Array.isArray(reimbursements)) {
//       return rows;
//     }
    
//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';
      
//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
          
//           console.log("🔍 Processing item:", {
//             id: item.id,
//             reimbursementItemStatus: item.reimbursementItemStatus,
//             approverStatus: item.approverStatus
//           });
          
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             reimbursementItemId: item.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [],
//             // ✅ STATUS COLUMN - uses approver status (from approvers table)
//             approvalStatus: item.approverStatus || 'PENDING',
//             // ✅ PAID COLUMN - uses reimbursement item status (from reimbursementItem table)
//             paymentStatus: item.reimbursementItemStatus || 'UNPAID',
//           });
//         });
//       }
//     });
    
//     console.log("🔍 Transformed data:", rows);
//     return rows;
//   }, [reimbursements]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle approve button click
//   const handleApproveClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
//     setItemToApprove(record);
//     setApproveModalVisible(true);
//   };

//   // Confirm approve
//   const confirmApprove = () => {
//     if (!itemToApprove?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     approveMutation.mutate(itemToApprove.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         setApproveModalVisible(false);
//         setItemToApprove(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
//         setApproveModalVisible(false);
//         setItemToApprove(null);
//       }
//     });
//   };

//   // Handle paid button click
//   const handlePaidClick = (record: any) => {
//     console.log("🔍 Paid clicked:", record);
    
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     setItemToMarkPaid(record);
//     setPaidModalVisible(true);
//   };

//   // Confirm paid
//   const confirmPaid = () => {
//     if (!itemToMarkPaid?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     markAsPaidMutation.mutate(itemToMarkPaid.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item marked as paid successfully");
//         setPaidModalVisible(false);
//         setItemToMarkPaid(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to mark item as paid");
//         setPaidModalVisible(false);
//         setItemToMarkPaid(null);
//       }
//     });
//   };

//   // Handle reject button click
//   const handleRejectClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
//     setSelectedItem(record);
//     setRejectModalVisible(true);
//   };

//   // Confirm reject
//   const confirmReject = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     rejectMutation.mutate({
//       id: selectedItem.reimbursementItemId,
//       remarks: rejectRemarks || "Rejected by manager"
//     }, {
//       onSuccess: () => {
//         message.success("Item rejected successfully");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 500);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to reject item");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//       }
//     });
//   };

//   // Toggle expand/collapse for multiple files
//   const toggleExpand = (itemKey: string) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [itemKey]: !prev[itemKey]
//     }));
//   };

//   // Handle file click
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag for APPROVAL status column
//   const getApprovalStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       case 'PENDING':
//         return <Tag color="gold">Pending</Tag>;
//       default:
//         return <Tag color="default">{status || 'Unknown'}</Tag>;
//     }
//   };

//   // Get tag for PAYMENT status column
//   const getPaymentStatusTag = (status: string, record: any) => {
//     const isPaid = status === 'PAID';
    
//     if (isPaid) {
//       return <Tag color="green">Paid</Tag>;
//     }
    
//     // Only show clickable Unpaid if the item is APPROVED
//     if (record.approvalStatus === 'APPROVED') {
//       return (
//         <Tag 
//           color="blue" 
//           className="cursor-pointer hover:bg-blue-100 transition-colors"
//           icon={<DollarOutlined />}
//           onClick={() => handlePaidClick(record)}
//         >
//           Unpaid
//         </Tag>
//       );
//     }
    
//     // If not approved, show disabled Unpaid
//     return <Tag color="gray">Unpaid</Tag>;
//   };

//   // Columns
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => (
//         <div>
//           <div>{record.employeeName}</div>
//         </div>
//       ),
//     },
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: any) => (
//         <span>₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Bill No",
//       dataIndex: "billNo",
//       key: "billNo",
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       width: 300,
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];
//         const itemKey = record.key;
//         const isExpanded = expandedItems[itemKey];
        
//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }
        
//         if (attachments.length === 1) {
//           const file = attachments[0];
//           const fileName = file.fileName || '';
          
//           return (
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(file)}
//               onClick={() => handleFileClick(file)}
//               className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//             >
//               {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//             </Button>
//           );
//         }
        
//         const firstFile = attachments[0];
//         const remainingFiles = attachments.slice(1);
//         const fileName = firstFile.fileName || '';
        
//         return (
//           <div className="flex flex-col">
//             <div className="flex items-center gap-1">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(firstFile)}
//                 onClick={() => handleFileClick(firstFile)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//               >
//                 {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
//               </Button>
              
//               <Tag 
//                 color="blue" 
//                 className="cursor-pointer hover:bg-blue-100 transition-colors"
//                 onClick={() => toggleExpand(itemKey)}
//               >
//                 +{remainingFiles.length} more
//               </Tag>
//             </div>
            
//             {isExpanded && (
//               <div className="flex flex-col gap-1 pl-6 mt-2 border-l-2 border-gray-200">
//                 {remainingFiles.map((file: any, index: number) => (
//                   <Button
//                     key={index}
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//                   >
//                     {file.fileName?.length > 25 
//                       ? file.fileName.substring(0, 25) + '...' 
//                       : file.fileName}
//                   </Button>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       title: "Approval Status",
//       key: "approvalStatus",
//       render: (_: any, record: any) => getApprovalStatusTag(record.approvalStatus),
//     },
//     {
//       title: "Payment Status",
//       key: "paymentStatus",
//       render: (_: any, record: any) => getPaymentStatusTag(record.paymentStatus, record),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         const isPending = record.approvalStatus === 'PENDING';
//         const isApproved = record.approvalStatus === 'APPROVED';
//         const isRejected = record.approvalStatus === 'REJECTED';
        
//         if (isApproved || isRejected) {
//           return (
//             <Space size={4}>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<CheckOutlined />}
//                 className="text-gray-400 cursor-not-allowed"
//                 disabled={true}
//               >
//                 Approve
//               </Button>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<CloseOutlined />}
//                 className="text-gray-400 cursor-not-allowed"
//                 disabled={true}
//               >
//                 Reject
//               </Button>
//             </Space>
//           );
//         }
        
//         return (
//           <Space size={4}>
//             <Button
//               type="text"
//               size="small"
//               icon={<CheckOutlined />}
//               className="text-green-600 hover:text-green-800"
//               onClick={() => handleApproveClick(record)}
//               loading={approveMutation.isPending && approveMutation.variables === record.reimbursementItemId}
//             >
//               Approve
//             </Button>
            
//             <Button
//               type="text"
//               size="small"
//               icon={<CloseOutlined />}
//               className="text-red-600 hover:text-red-800"
//               onClick={() => handleRejectClick(record)}
//               loading={rejectMutation.isPending && selectedItem?.reimbursementItemId === record.reimbursementItemId}
//             >
//               Reject
//             </Button>
//           </Space>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold text-gray-900">
//           Team Reimbursements
//         </h2>
//         <Input.Search
//           placeholder="Search..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 300 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary */}
//       <div className="flex gap-1.5 mb-3 flex-wrap">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-2 !py-0.5 !text-xs">
//           Pending: {transformedData.filter(item => item.approvalStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Approved: {transformedData.filter(item => item.approvalStatus === 'APPROVED').length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Unpaid: {transformedData.filter(item => item.paymentStatus !== 'PAID').length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Paid: {transformedData.filter(item => item.paymentStatus === 'PAID').length}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching}
//         size="small"
//         bordered
//         pagination={{ 
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total: number) => `Total ${total} items`
//         }}
//         rowKey="key"
//       />

//       {/* Approve Modal */}
//       <Modal
//         title="Confirm Approval"
//         open={approveModalVisible}
//         onOk={confirmApprove}
//         onCancel={() => {
//           setApproveModalVisible(false);
//           setItemToApprove(null);
//         }}
//         okText="Yes, Approve"
//         cancelText="Cancel"
//         okButtonProps={{ type: "primary", className: "bg-green-600 hover:bg-green-700" }}
//         confirmLoading={approveMutation.isPending}
//       >
//         <div className="py-4">
//           <p className="text-base">Are you sure you want to approve this item?</p>
//         </div>
//       </Modal>

//       {/* Paid Modal */}
//       <Modal
//         title="Confirm Payment"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setItemToMarkPaid(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//         okButtonProps={{ type: "primary", className: "bg-blue-600 hover:bg-blue-700" }}
//         confirmLoading={markAsPaidMutation.isPending}
//       >
//         <div className="py-4">
//           <p className="text-base mb-2">Are you sure you want to mark this item as paid?</p>
//           {itemToMarkPaid && (
//             <div className="bg-gray-50 p-3 rounded-md">
//               <p><span className="font-medium">Employee:</span> {itemToMarkPaid.employeeName}</p>
//               <p><span className="font-medium">Category:</span> {itemToMarkPaid.category}</p>
//               <p><span className="font-medium">Amount:</span> ₹{Number(itemToMarkPaid.amount).toFixed(2)}</p>
//             </div>
//           )}
//         </div>
//       </Modal>

//       {/* Preview Modal */}
//       <Modal
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={1000}
//         styles={{ body: { height: '80vh', padding: 0 } }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Modal>

//       {/* Reject Modal */}
//       <Modal
//         title="Reject Item"
//         open={rejectModalVisible}
//         onOk={confirmReject}
//         onCancel={() => {
//           setRejectModalVisible(false);
//           setRejectRemarks("");
//           setSelectedItem(null);
//         }}
//         okText="Reject"
//         okButtonProps={{ danger: true }}
//         confirmLoading={rejectMutation.isPending}
//       >
//         <div className="py-4">
//           <label className="block mb-2 text-sm font-medium">
//             Remarks (Optional)
//           </label>
//           <Input.TextArea
//             rows={4}
//             value={rejectRemarks}
//             onChange={(e) => setRejectRemarks(e.target.value)}
//             placeholder="Enter reason for rejection..."
//           />
//         </div>
//       </Modal>
//     </div>
//   );
// }final working just chnage model to drawer




// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message, Drawer } from "antd"; // Added Drawer import
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   DollarOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";

// export default function ManagerReimbursementsPage() {
//   const queryClient = useQueryClient();
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [rejectRemarks, setRejectRemarks] = useState("");
  
//   // Approve confirmation modal
//   const [approveModalVisible, setApproveModalVisible] = useState(false);
//   const [itemToApprove, setItemToApprove] = useState<any>(null);
  
//   // Paid confirmation modal
//   const [paidModalVisible, setPaidModalVisible] = useState(false);
//   const [itemToMarkPaid, setItemToMarkPaid] = useState<any>(null);
  
//   // Expanded items for multiple files
//   const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();
//   const markAsPaidMutation = useMarkAsPaid();

//   // 🔴 SIMPLE & CLEAN transformation
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];
    
//     if (!reimbursements || !Array.isArray(reimbursements)) {
//       return rows;
//     }
    
//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';
      
//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
          
//           console.log("🔍 Processing item:", {
//             id: item.id,
//             reimbursementItemStatus: item.reimbursementItemStatus,
//             approverStatus: item.approverStatus
//           });
          
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             reimbursementItemId: item.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [],
//             // ✅ STATUS COLUMN - uses approver status (from approvers table)
//             approvalStatus: item.approverStatus || 'PENDING',
//             // ✅ PAID COLUMN - uses reimbursement item status (from reimbursementItem table)
//             paymentStatus: item.reimbursementItemStatus || 'UNPAID',
//           });
//         });
//       }
//     });
    
//     console.log("🔍 Transformed data:", rows);
//     return rows;
//   }, [reimbursements]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle approve button click
//   const handleApproveClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
//     setItemToApprove(record);
//     setApproveModalVisible(true);
//   };

//   // Confirm approve
//   const confirmApprove = () => {
//     if (!itemToApprove?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     approveMutation.mutate(itemToApprove.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         setApproveModalVisible(false);
//         setItemToApprove(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
//         setApproveModalVisible(false);
//         setItemToApprove(null);
//       }
//     });
//   };

//   // Handle paid button click
//   const handlePaidClick = (record: any) => {
//     console.log("🔍 Paid clicked:", record);
    
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
    
//     setItemToMarkPaid(record);
//     setPaidModalVisible(true);
//   };

//   // Confirm paid
//   const confirmPaid = () => {
//     if (!itemToMarkPaid?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     markAsPaidMutation.mutate(itemToMarkPaid.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item marked as paid successfully");
//         setPaidModalVisible(false);
//         setItemToMarkPaid(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to mark item as paid");
//         setPaidModalVisible(false);
//         setItemToMarkPaid(null);
//       }
//     });
//   };

//   // Handle reject button click
//   const handleRejectClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }
//     setSelectedItem(record);
//     setRejectModalVisible(true);
//   };

//   // Confirm reject
//   const confirmReject = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }
    
//     rejectMutation.mutate({
//       id: selectedItem.reimbursementItemId,
//       remarks: rejectRemarks || "Rejected by manager"
//     }, {
//       onSuccess: () => {
//         message.success("Item rejected successfully");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 500);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to reject item");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//       }
//     });
//   };

//   // Toggle expand/collapse for multiple files
//   const toggleExpand = (itemKey: string) => {
//     setExpandedItems(prev => ({
//       ...prev,
//       [itemKey]: !prev[itemKey]
//     }));
//   };

//   // Handle file click
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // Handle download
//   const handleDownload = (file: any) => {
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     message.success(`Downloading ${file.fileName}`);
//   };

//   // Get iframe URL
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }
    
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }
    
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }
    
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';
    
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
//       return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
//       return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
//       return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
//       return <FileOutlined className="text-orange-500" />;
//     if (fileType?.startsWith('image/')) 
//       return <FileOutlined className="text-purple-500" />;
    
//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag for APPROVAL status column
//   const getApprovalStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       case 'PENDING':
//         return <Tag color="gold">Pending</Tag>;
//       default:
//         return <Tag color="default">{status || 'Unknown'}</Tag>;
//     }
//   };

//   // Get tag for PAYMENT status column
//   const getPaymentStatusTag = (status: string, record: any) => {
//     const isPaid = status === 'PAID';
    
//     if (isPaid) {
//       return <Tag color="green">Paid</Tag>;
//     }
    
//     // Only show clickable Unpaid if the item is APPROVED
//     if (record.approvalStatus === 'APPROVED') {
//       return (
//         <Tag 
//           color="blue" 
//           className="cursor-pointer hover:bg-blue-100 transition-colors"
//           icon={<DollarOutlined />}
//           onClick={() => handlePaidClick(record)}
//         >
//           Unpaid
//         </Tag>
//       );
//     }
    
//     // If not approved, show disabled Unpaid
//     return <Tag color="gray">Unpaid</Tag>;
//   };

//   // Columns
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => (
//         <div>
//           <div>{record.employeeName}</div>
//         </div>
//       ),
//     },
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: any) => (
//         <span>₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Bill No",
//       dataIndex: "billNo",
//       key: "billNo",
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       width: 300,
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];
//         const itemKey = record.key;
//         const isExpanded = expandedItems[itemKey];
        
//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }
        
//         if (attachments.length === 1) {
//           const file = attachments[0];
//           const fileName = file.fileName || '';
          
//           return (
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(file)}
//               onClick={() => handleFileClick(file)}
//               className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//             >
//               {fileName.length > 25 ? fileName.substring(0, 25) + '...' : fileName}
//             </Button>
//           );
//         }
        
//         const firstFile = attachments[0];
//         const remainingFiles = attachments.slice(1);
//         const fileName = firstFile.fileName || '';
        
//         return (
//           <div className="flex flex-col">
//             <div className="flex items-center gap-1">
//               <Button
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(firstFile)}
//                 onClick={() => handleFileClick(firstFile)}
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//               >
//                 {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
//               </Button>
              
//               <Tag 
//                 color="blue" 
//                 className="cursor-pointer hover:bg-blue-100 transition-colors"
//                 onClick={() => toggleExpand(itemKey)}
//               >
//                 +{remainingFiles.length} more
//               </Tag>
//             </div>
            
//             {isExpanded && (
//               <div className="flex flex-col gap-1 pl-6 mt-2 border-l-2 border-gray-200">
//                 {remainingFiles.map((file: any, index: number) => (
//                   <Button
//                     key={index}
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
//                   >
//                     {file.fileName?.length > 25 
//                       ? file.fileName.substring(0, 25) + '...' 
//                       : file.fileName}
//                   </Button>
//                 ))}
//               </div>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       title: "Approval Status",
//       key: "approvalStatus",
//       render: (_: any, record: any) => getApprovalStatusTag(record.approvalStatus),
//     },
//     {
//       title: "Payment Status",
//       key: "paymentStatus",
//       render: (_: any, record: any) => getPaymentStatusTag(record.paymentStatus, record),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         const isPending = record.approvalStatus === 'PENDING';
//         const isApproved = record.approvalStatus === 'APPROVED';
//         const isRejected = record.approvalStatus === 'REJECTED';
        
//         if (isApproved || isRejected) {
//           return (
//             <Space size={4}>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<CheckOutlined />}
//                 className="text-gray-400 cursor-not-allowed"
//                 disabled={true}
//               >
//                 Approve
//               </Button>
//               <Button
//                 type="text"
//                 size="small"
//                 icon={<CloseOutlined />}
//                 className="text-gray-400 cursor-not-allowed"
//                 disabled={true}
//               >
//                 Reject
//               </Button>
//             </Space>
//           );
//         }
        
//         return (
//           <Space size={4}>
//             <Button
//               type="text"
//               size="small"
//               icon={<CheckOutlined />}
//               className="text-green-600 hover:text-green-800"
//               onClick={() => handleApproveClick(record)}
//               loading={approveMutation.isPending && approveMutation.variables === record.reimbursementItemId}
//             >
//               Approve
//             </Button>
            
//             <Button
//               type="text"
//               size="small"
//               icon={<CloseOutlined />}
//               className="text-red-600 hover:text-red-800"
//               onClick={() => handleRejectClick(record)}
//               loading={rejectMutation.isPending && selectedItem?.reimbursementItemId === record.reimbursementItemId}
//             >
//               Reject
//             </Button>
//           </Space>
//         );
//       },
//     },
//   ];

//   return (
//     <div className="p-1">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-xl font-semibold text-gray-900">
//           Team Reimbursements
//         </h2>
//         <Input.Search
//           placeholder="Search..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 300 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary */}
//       <div className="flex gap-1.5 mb-3 flex-wrap">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-2 !py-0.5 !text-xs">
//           Pending: {transformedData.filter(item => item.approvalStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Approved: {transformedData.filter(item => item.approvalStatus === 'APPROVED').length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//         <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
//           Unpaid: {transformedData.filter(item => item.paymentStatus !== 'PAID').length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-xs">
//           Paid: {transformedData.filter(item => item.paymentStatus === 'PAID').length}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading || isRefetching}
//         size="small"
//         bordered
//         pagination={{ 
//           pageSize: 10,
//           size: "small",
//           showSizeChanger: true,
//           showTotal: (total: number) => `Total ${total} items`
//         }}
//         rowKey="key"
//       />

//       {/* Approve Modal */}
//       <Modal
//         title="Confirm Approval"
//         open={approveModalVisible}
//         onOk={confirmApprove}
//         onCancel={() => {
//           setApproveModalVisible(false);
//           setItemToApprove(null);
//         }}
//         okText="Yes, Approve"
//         cancelText="Cancel"
//         okButtonProps={{ type: "primary", className: "bg-green-600 hover:bg-green-700" }}
//         confirmLoading={approveMutation.isPending}
//       >
//         <div className="py-4">
//           <p className="text-base">Are you sure you want to approve this item?</p>
//         </div>
//       </Modal>

//       {/* Paid Modal */}
//       <Modal
//         title="Confirm Payment"
//         open={paidModalVisible}
//         onOk={confirmPaid}
//         onCancel={() => {
//           setPaidModalVisible(false);
//           setItemToMarkPaid(null);
//         }}
//         okText="Yes, Mark as Paid"
//         cancelText="Cancel"
//         okButtonProps={{ type: "primary", className: "bg-blue-600 hover:bg-blue-700" }}
//         confirmLoading={markAsPaidMutation.isPending}
//       >
//         <div className="py-4">
//           <p className="text-base mb-2">Are you sure you want to mark this item as paid?</p>
//           {itemToMarkPaid && (
//             <div className="bg-gray-50 p-3 rounded-md">
//               <p><span className="font-medium">Employee:</span> {itemToMarkPaid.employeeName}</p>
//               <p><span className="font-medium">Category:</span> {itemToMarkPaid.category}</p>
//               <p><span className="font-medium">Amount:</span> ₹{Number(itemToMarkPaid.amount).toFixed(2)}</p>
//             </div>
//           )}
//         </div>
//       </Modal>

//       {/* 🔴 CHANGED: Preview Drawer instead of Modal - 50% width */}
//       <Drawer
//         title={
//           <Space>
//             <span>{previewFile?.fileName || 'Document Preview'}</span>
//             <Button
//               type="primary"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(previewFile)}
//             >
//               Download
//             </Button>
//           </Space>
//         }
//         placement="right"
//         width="50%"
//         onClose={() => setPreviewVisible(false)}
//         open={previewVisible}
//         destroyOnClose
//         styles={{ body: { padding: 0, height: 'calc(100vh - 55px)' } }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
//             sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
//             referrerPolicy="no-referrer"
//             allow="autoplay *; fullscreen *"
//           />
//         )}
//       </Drawer>

//       {/* Reject Modal */}
//       <Modal
//         title="Reject Item"
//         open={rejectModalVisible}
//         onOk={confirmReject}
//         onCancel={() => {
//           setRejectModalVisible(false);
//           setRejectRemarks("");
//           setSelectedItem(null);
//         }}
//         okText="Reject"
//         okButtonProps={{ danger: true }}
//         confirmLoading={rejectMutation.isPending}
//       >
//         <div className="py-4">
//           <label className="block mb-2 text-sm font-medium">
//             Remarks (Optional)
//           </label>
//           <Input.TextArea
//             rows={4}
//             value={rejectRemarks}
//             onChange={(e) => setRejectRemarks(e.target.value)}
//             placeholder="Enter reason for rejection..."
//           />
//         </div>
//       </Modal>
//     </div>
//   );
// }just change parent 




"use client";
import { Button, Table, Tag, Input, Space, Modal, message, Drawer } from "antd";
import { 
  ReloadOutlined, 
  CheckOutlined, 
  CloseOutlined, 
  DownloadOutlined,
  FileOutlined,
  DollarOutlined,
  DownOutlined,
  RightOutlined
} from "@ant-design/icons";
import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
import { useApproveItem, useRejectItem, useMarkAsPaid } from "@/hooks/usereimbursementcreate";
import { useMemo, useState, useEffect } from "react";
import { useApproverTypeMap } from "@/hooks/usereimbursementcreate"; 
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

export default function ManagerReimbursementsPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  // Approve confirmation modal
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [itemToApprove, setItemToApprove] = useState<any>(null);
  
  // Paid confirmation modal
  const [paidModalVisible, setPaidModalVisible] = useState(false);
  const [itemToMarkPaid, setItemToMarkPaid] = useState<any>(null);
  
  // Expanded items for multiple files
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  const { 
    data: reimbursements = [], 
    isLoading: loading,
    refetch,
    isRefetching 
  } = useManagerApprovals();

  const approveMutation = useApproveItem();
  const rejectMutation = useRejectItem();
  const markAsPaidMutation = useMarkAsPaid();

  console.log('📊 Raw reimbursements data:', reimbursements);
   const approverTypeMap = useApproverTypeMap();



   // Add this useEffect - COMPLETELY SAFE, just console logs
useEffect(() => {
  if (reimbursements && reimbursements.length > 0) {
    console.log("========== FRONTEND APPROVER DEBUG ==========");
    
    // Just log the first few items to check
    const sample = reimbursements.slice(0, 3);
    sample.forEach((reb: any) => {
      if (reb.items && reb.items.length > 0) {
        reb.items.forEach((item: any) => {
          console.log(`Item ${item.id}:`, {
            itemId: item.id,
            approverStatus: item.approverStatus,
            approverDetails: item.approverDetails
          });
        });
      }
    });
  }
}, [reimbursements]);

  // Transform data for parent-child structure
  // const transformedData = useMemo(() => {
  //   if (!reimbursements || !Array.isArray(reimbursements)) {
  //     return [];
  //   }
    
  //   return reimbursements.map((reimbursement: any) => {
  //     const employeeName = reimbursement.employeeName || 
  //                         reimbursement.createdBy?.name || 
  //                         'N/A';
  //     const employeeCode = reimbursement.employeeCode || 
  //                         reimbursement.createdBy?.employee?.employee_code || 
  //                         'N/A';
  //     console.log(`📅 Reimbursement ${reimbursement.id}:`, {
  //     submittedAt: reimbursement.submittedAt,
  //     createdAt: reimbursement.createdAt,
  //     fromObject: reimbursement
  //   });
      
  //     return {
  //       id: reimbursement.id,
  //       key: reimbursement.id,
  //       employeeName: employeeName,
  //       employeeCode: employeeCode,
  //       status: reimbursement.status,
  //       totalAmount: reimbursement.totalAmount || 0,
  //       submittedAt: reimbursement.submittedAt, // Add this
  //       createdAt: reimbursement.createdAt,     // Add this
  //       items: (reimbursement.items || []).map((item: any, index: number) => ({
  //         ...item,
  //         key: `${reimbursement.id}-${item.id || index}`,
  //         reimbursementId: reimbursement.id,
  //         // Use approverStatus for approval status
  //         approvalStatus: item.approverStatus || 'PENDING',
  //         // Use reimbursementItemStatus for payment status
  //         paymentStatus: item.reimbursementItemStatus || 'UNPAID',
  //       })),
  //     };
  //   });
  // }, [reimbursements]);
const transformedData = useMemo(() => {
  if (!reimbursements || !Array.isArray(reimbursements)) {
    return [];
  }
  
  return reimbursements.map((reimbursement: any) => {
    const employeeName = reimbursement.employeeName || 
                        reimbursement.createdBy?.name || 
                        'N/A';
    const employeeCode = reimbursement.employeeCode || 
                        reimbursement.createdBy?.employee?.employee_code || 
                        'N/A';
    
    // ✅ Debug log to check items count
    console.log(`Reimbursement ${reimbursement.id}:`, {
      itemCount: reimbursement.items?.length || 0,
      items: reimbursement.items?.map((i: any) => ({
        id: i.id,
        amount: i.amount,
        approvalStatus: i.approverStatus,
        paymentStatus: i.reimbursementItemStatus
      }))
    });
    
    return {
      id: reimbursement.id,
      key: reimbursement.id,
      employeeName: employeeName,
      employeeCode: employeeCode,
      status: reimbursement.status,
      totalAmount: reimbursement.totalAmount || 0,
      submittedAt: reimbursement.submittedAt,
      createdAt: reimbursement.createdAt,
      items: (reimbursement.items || []).map((item: any, index: number) => ({
        ...item,
        key: `${reimbursement.id}-${item.id || index}`,
        reimbursementId: reimbursement.id,
        approvalStatus: item.approverStatus || 'PENDING',
        paymentStatus: item.reimbursementItemStatus || 'UNPAID',
        // ✅ Ensure amount is a number
        amount: Number(item.amount) || 0,
      })),
    };
  });
}, [reimbursements]);


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

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchText) return transformedData;
    
    return transformedData.filter((record: any) => {
      // Search in parent
      const parentMatch = record.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
                         record.employeeCode?.toLowerCase().includes(searchText.toLowerCase());
      
      // Search in child items
      const childMatch = record.items?.some((item: any) => 
        item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchText.toLowerCase())
      );
      
      return parentMatch || childMatch;
    });
  }, [transformedData, searchText]);

  // Handle approve button click
  const handleApproveClick = (item: any, record: any) => {
    if (!item.id) {
      message.error("Invalid item ID");
      return;
    }
    setItemToApprove({ ...item, employeeName: record.employeeName });
    setApproveModalVisible(true);
  };

  // Confirm approve
  const confirmApprove = () => {
    if (!itemToApprove?.id) {
      message.error("No item selected");
      return;
    }
    
    approveMutation.mutate(itemToApprove.id, {
      onSuccess: () => {
        message.success("Item approved successfully");
        setApproveModalVisible(false);
        setItemToApprove(null);
        setTimeout(() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
        }, 100);
      },
      onError: (error: any) => {
        message.error(error?.message || "Failed to approve item");
        setApproveModalVisible(false);
        setItemToApprove(null);
      }
    });
  };

  // Handle paid button click
  const handlePaidClick = (item: any, record: any) => {
    if (!item.id) {
      message.error("Invalid item ID");
      return;
    }
    
    setItemToMarkPaid({ ...item, employeeName: record.employeeName });
    setPaidModalVisible(true);
  };

  // Confirm paid
  const confirmPaid = () => {
    if (!itemToMarkPaid?.id) {
      message.error("No item selected");
      return;
    }
    
    markAsPaidMutation.mutate(itemToMarkPaid.id, {
      onSuccess: () => {
        message.success("Item marked as paid successfully");
        setPaidModalVisible(false);
        setItemToMarkPaid(null);
        setTimeout(() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
        }, 100);
      },
      onError: (error: any) => {
        message.error(error?.message || "Failed to mark item as paid");
        setPaidModalVisible(false);
        setItemToMarkPaid(null);
      }
    });
  };

  // Handle reject button click
  const handleRejectClick = (item: any, record: any) => {
    if (!item.id) {
      message.error("Invalid item ID");
      return;
    }
    setSelectedItem({ ...item, employeeName: record.employeeName });
    setRejectModalVisible(true);
  };

  // Confirm reject
  const confirmReject = () => {
    if (!selectedItem?.id) {
      message.error("No item selected");
      return;
    }
    
    rejectMutation.mutate({
      id: selectedItem.id,
      remarks: rejectRemarks || "Rejected by manager"
    }, {
      onSuccess: () => {
        message.success("Item rejected successfully");
        setRejectModalVisible(false);
        setRejectRemarks("");
        setSelectedItem(null);
        setTimeout(() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
        }, 500);
      },
      onError: (error: any) => {
        message.error(error?.message || "Failed to reject item");
        setRejectModalVisible(false);
        setRejectRemarks("");
        setSelectedItem(null);
      }
    });
  };

  // Toggle expand/collapse for multiple files
  const toggleExpand = (itemKey: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  // Handle file click
  const handleFileClick = (file: any) => {
    setPreviewFile(file);
    setPreviewVisible(true);
  };

  // Handle download
  const handleDownload = (file: any) => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.fileName || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`Downloading ${file.fileName}`);
  };

  // Get iframe URL
  const getIframeUrl = (file: any): string => {
    const fileName = file.fileName?.toLowerCase() || '';
    const fileType = file.fileType || '';
    
    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
    }
    
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
        fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
        fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
      return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
    }
    
    if (fileType?.startsWith('image/') || 
        fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
        fileName.endsWith('.png') || fileName.endsWith('.gif')) {
      return file.fileUrl;
    }
    
    return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
  };

  // Get file icon
  const getFileIcon = (file: any) => {
    const fileName = file.fileName?.toLowerCase() || '';
    const fileType = file.fileType || '';
    
    if (fileName.endsWith('.pdf') || fileType === 'application/pdf') 
      return <FileOutlined className="text-red-500" />;
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) 
      return <FileOutlined className="text-blue-500" />;
    if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) 
      return <FileOutlined className="text-green-500" />;
    if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) 
      return <FileOutlined className="text-orange-500" />;
    if (fileType?.startsWith('image/')) 
      return <FileOutlined className="text-purple-500" />;
    
    return <FileOutlined className="text-gray-500" />;
  };

  // Get status tag for APPROVAL status
  const getApprovalStatusTag = (status: string) => {
    switch(status?.toUpperCase()) {
      case 'APPROVED':
        return <Tag color="green">Approved</Tag>;
      case 'REJECTED':
        return <Tag color="red">Rejected</Tag>;
      case 'PENDING':
        return <Tag color="gold">Pending</Tag>;
      default:
        return <Tag color="default">{status || 'Unknown'}</Tag>;
    }
  };

  // Get tag for PAYMENT status
  const getPaymentStatusTag = (status: string, item: any, record: any) => {
    const isPaid = status === 'PAID';
    
    if (isPaid) {
      return <Tag color="green">Paid</Tag>;
    }
    
    // Only show clickable Unpaid if the item is APPROVED
    if (item.approvalStatus === 'APPROVED') {
      return (
        <Tag 
          color="blue" 
          className="cursor-pointer hover:bg-blue-100 transition-colors"
          icon={<DollarOutlined />}
          onClick={() => handlePaidClick(item, record)}
        >
          Unpaid
        </Tag>
      );
    }
    
    // If not approved, show disabled Unpaid
    return <Tag color="gray">Unpaid</Tag>;
  };

  // Expanded row renderer for child items
  const expandedRowRender = (record: any) => {
    const items = record.items || [];
    
    // Child table columns
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
      },
      {
        title: "Documents",
        key: "documents",
        width: 250,
        render: (_: any, item: any) => {
          const attachments = item.attachments || [];
          const itemKey = item.key;
          const isExpanded = expandedItems[itemKey];
          
          if (attachments.length === 0) {
            return <span className="text-gray-400">—</span>;
          }
          
          if (attachments.length === 1) {
            const file = attachments[0];
            const fileName = file.fileName || '';
            
            return (
              <Button
                type="link"
                size="small"
                icon={getFileIcon(file)}
                onClick={() => handleFileClick(file)}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                {fileName.length > 20 ? fileName.substring(0, 20) + '...' : fileName}
              </Button>
            );
          }
          
          const firstFile = attachments[0];
          const remainingFiles = attachments.slice(1);
          const fileName = firstFile.fileName || '';
          
          return (
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <Button
                  type="link"
                  size="small"
                  icon={getFileIcon(firstFile)}
                  onClick={() => handleFileClick(firstFile)}
                  className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                >
                  {fileName.length > 15 ? fileName.substring(0, 15) + '...' : fileName}
                </Button>
                
                <Tag 
                  color="blue" 
                  className="cursor-pointer hover:bg-blue-100 transition-colors"
                  onClick={() => toggleExpand(itemKey)}
                >
                  +{remainingFiles.length}
                </Tag>
              </div>
              
              {isExpanded && (
                <div className="flex flex-col gap-1 pl-6 mt-2 border-l-2 border-gray-200">
                  {remainingFiles.map((file: any, index: number) => (
                    <Button
                      key={index}
                      type="link"
                      size="small"
                      icon={getFileIcon(file)}
                      onClick={() => handleFileClick(file)}
                      className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
                    >
                      {file.fileName?.length > 20 
                        ? file.fileName.substring(0, 20) + '...' 
                        : file.fileName}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          );
        },
      },
   
      {
        title: "Approval Status",
        key: "approvalStatus",
        width: 120,
        render: (_: any, item: any) => getApprovalStatusTag(item.approvalStatus),
      },
       {
        title: "Approver Type",
        key: "approverType",
        width: 130,
        render: (_: any, item: any) => getApproverTypeTag(item.category),
      },
      {
        title: "Payment Status",
        key: "paymentStatus",
        width: 120,
        render: (_: any, item: any) => getPaymentStatusTag(item.paymentStatus, item, record),
      },
      {
        title: "Action",
        key: "action",
        width: 150,
        render: (_: any, item: any) => {
          const isPending = item.approvalStatus === 'PENDING';
          const isApproved = item.approvalStatus === 'APPROVED';
          const isRejected = item.approvalStatus === 'REJECTED';
          
          if (isApproved || isRejected) {
            return (
              <Space size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<CheckOutlined />}
                  className="text-gray-400 cursor-not-allowed"
                  disabled={true}
                >
                  Approve
                </Button>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  className="text-gray-400 cursor-not-allowed"
                  disabled={true}
                >
                  Reject
                </Button>
              </Space>
            );
          }
          
          return (
            <Space size={4}>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                className="text-green-600 hover:text-green-800"
                onClick={() => handleApproveClick(item, record)}
                loading={approveMutation.isPending && approveMutation.variables === item.id}
              >
                Approve
              </Button>
              
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                className="text-red-600 hover:text-red-800"
                onClick={() => handleRejectClick(item, record)}
                loading={rejectMutation.isPending && selectedItem?.id === item.id}
              >
                Reject
              </Button>
            </Space>
          );
        },
      },
    ];
    
    return (
      <div className="pl-8 pr-4 py-2 bg-gray-50">
        <Table
          columns={childColumns}
          dataSource={items}
          rowKey={(item) => item.key || `item-${Math.random()}`}
          pagination={false}
          size="small"
          bordered={false}
          className="child-table"
         
        />
      </div>
    );
  };
  // Expanded row renderer for child items


  // Parent table columns
  const columns = [
    // {
    //   title: "Employee",
    //   key: "employee",
    //   width: 200,
    //   render: (_: any, record: any) => (
    //     <div>
    //       <div className="font-medium">{record.employeeName}</div>
    //     </div>
    //   ),
    // },
      {
    title: "Created Date",
    key: "createdAt",
    width: 120,
    render: (_: any, record: any) => {
      // First try to get from reimbursement object
      const date = record.submittedAt || record.createdAt;
      return date ? dayjs(date).format('DD MMM YYYY') : '—';
    },
  },
    {
      title: "Total Items",
      key: "itemCount",
      width: 100,
      render: (_: any, record: any) => (
        <Tag color="blue">{record.items?.length || 0}</Tag>
      ),
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      width: 120,
      render: (_: any, record: any) => (
        <span className="font-semibold text-blue-600">₹{Number(record.totalAmount).toFixed(2)}</span>
      ),
    },
    {
      title: "Reimbursement Status",
      key: "status",
      width: 150,
      render: (_: any, record: any) => {
        const status = record.status;
        if (status === "DRAFT") return <Tag>Draft</Tag>;
        if (status === "SUBMITTED") return <Tag color="blue">Submitted</Tag>;
        if (status === "APPROVED") return <Tag color="green">Approved</Tag>;
        if (status === "REJECTED") return <Tag color="red">Rejected</Tag>;
        if (status === "PAID") return <Tag color="purple">Paid</Tag>;
        return <Tag>{status}</Tag>;
      },
    },
  ];





  

  // Calculate summary stats
  // const totalItems = useMemo(() => {
  //   return transformedData.reduce((sum, r) => sum + (r.items?.length || 0), 0);
  // }, [transformedData]);

  // const pendingItems = useMemo(() => {
  //   return transformedData.reduce((sum, r) => 
  //     sum + (r.items?.filter((i: any) => i.approvalStatus === 'PENDING').length || 0), 0);
  // }, [transformedData]);

  // const approvedItems = useMemo(() => {
  //   return transformedData.reduce((sum, r) => 
  //     sum + (r.items?.filter((i: any) => i.approvalStatus === 'APPROVED').length || 0), 0);
  // }, [transformedData]);

  // const totalAmount = useMemo(() => {
  //   return transformedData.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
  // }, [transformedData]);

  // const unpaidItems = useMemo(() => {
  //   return transformedData.reduce((sum, r) => 
  //     sum + (r.items?.filter((i: any) => i.paymentStatus !== 'PAID').length || 0), 0);
  // }, [transformedData]);

  // const paidItems = useMemo(() => {
  //   return transformedData.reduce((sum, r) => 
  //     sum + (r.items?.filter((i: any) => i.paymentStatus === 'PAID').length || 0), 0);
  // }, [transformedData]);






   const totalItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      return sum + (reimbursement.items?.length || 0);
    }, 0);
  }, [transformedData]);

  // ✅ CORRECT: Pending items count (approval pending)
  const pendingItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const pendingInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.approvalStatus === 'PENDING'
      ).length || 0;
      return sum + pendingInThisReimbursement;
    }, 0);
  }, [transformedData]);

  // ✅ CORRECT: Approved items count
  const approvedItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const approvedInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.approvalStatus === 'APPROVED'
      ).length || 0;
      return sum + approvedInThisReimbursement;
    }, 0);
  }, [transformedData]);

  // ✅ CORRECT: Rejected items count
  const rejectedItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const rejectedInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.approvalStatus === 'REJECTED'
      ).length || 0;
      return sum + rejectedInThisReimbursement;
    }, 0);
  }, [transformedData]);

  // ✅ CORRECT: Total amount (sum of all items)
  const totalAmount = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      return sum + (Number(reimbursement.totalAmount) || 0);
    }, 0);
  }, [transformedData]);

  // ✅ CORRECT: Unpaid items count
  const unpaidItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const unpaidInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.paymentStatus !== 'PAID'
      ).length || 0;
      return sum + unpaidInThisReimbursement;
    }, 0);
  }, [transformedData]);

  // ✅ CORRECT: Paid items count
  const paidItems = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const paidInThisReimbursement = reimbursement.items?.filter(
        (item: any) => item.paymentStatus === 'PAID'
      ).length || 0;
      return sum + paidInThisReimbursement;
    }, 0);
  }, [transformedData]);

  // ✅ NEW: Approved amount total
  const approvedAmount = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const approvedItemsAmount = reimbursement.items
        ?.filter((item: any) => item.approvalStatus === 'APPROVED')
        .reduce((itemSum: number, item: any) => itemSum + (Number(item.amount) || 0), 0) || 0;
      return sum + approvedItemsAmount;
    }, 0);
  }, [transformedData]);

  // ✅ NEW: Pending amount total
  const pendingAmount = useMemo(() => {
    return transformedData.reduce((sum, reimbursement) => {
      const pendingItemsAmount = reimbursement.items
        ?.filter((item: any) => item.approvalStatus === 'PENDING')
        .reduce((itemSum: number, item: any) => itemSum + (Number(item.amount) || 0), 0) || 0;
      return sum + pendingItemsAmount;
    }, 0);
  }, [transformedData]);

  return (
    <div className="p-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-900">
            Team Reimbursements
          </h2>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => refetch()}
            loading={loading || isRefetching}
            size="small"
          >
            Refresh
          </Button>
        </div>
        
        <Input.Search
          placeholder="Search by employee, category, bill no..."
          allowClear
          size="middle"
          style={{ width: 300 }}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {/* Summary tags */}
      {/* <div className="flex gap-1.5 mb-3 flex-wrap">
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Total Reimbursements: {transformedData.length}
        </Tag>
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Total Items: {totalItems}
        </Tag>
        
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Approved: {approvedItems}
        </Tag>
        <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
          Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
        </Tag>
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Unpaid: {unpaidItems}
        </Tag>
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Paid: {paidItems}
        </Tag>
      </div> */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Reimbursements: {transformedData.length}
        </Tag>
        <Tag color="geekblue" className="!px-2 !py-0.5 !text-xs">
          Total Items: {totalItems}
        </Tag>
        <Tag color="gold" className="!px-2 !py-0.5 !text-xs">
          Pending: {pendingItems} (₹{pendingAmount.toFixed(2)})
        </Tag>
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Approved: {approvedItems} (₹{approvedAmount.toFixed(2)})
        </Tag>
        <Tag color="red" className="!px-2 !py-0.5 !text-xs">
          Rejected: {rejectedItems}
        </Tag>
        <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
          Total Amount: ₹{totalAmount.toFixed(2)}
        </Tag>
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Unpaid: {unpaidItems}
        </Tag>
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Paid: {paidItems}
        </Tag>
      </div>

      {/* Main Table with Expandable Child Rows */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredData}
        loading={loading || isRefetching || approveMutation.isPending || rejectMutation.isPending || markAsPaidMutation.isPending}
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
          // Always show expand icon since we want to see items
          rowExpandable: () => true,
        }}
        pagination={{
          pageSize: 10,
          size: "small",
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} reimbursements`,
        }}
      />

      {/* Approve Modal */}
      <Modal
        title="Confirm Approval"
        open={approveModalVisible}
        onOk={confirmApprove}
        onCancel={() => {
          setApproveModalVisible(false);
          setItemToApprove(null);
        }}
        okText="Yes, Approve"
        cancelText="Cancel"
        okButtonProps={{ type: "primary", className: "bg-green-600 hover:bg-green-700" }}
        confirmLoading={approveMutation.isPending}
      >
        <div className="py-4">
          <p className="text-base mb-2">Are you sure you want to approve this item?</p>
          {itemToApprove && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Employee:</span> {itemToApprove.employeeName}</p>
              <p><span className="font-medium">Category:</span> {itemToApprove.category}</p>
              <p><span className="font-medium">Amount:</span> ₹{Number(itemToApprove.amount).toFixed(2)}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Paid Modal */}
      <Modal
        title="Confirm Payment"
        open={paidModalVisible}
        onOk={confirmPaid}
        onCancel={() => {
          setPaidModalVisible(false);
          setItemToMarkPaid(null);
        }}
        okText="Yes, Mark as Paid"
        cancelText="Cancel"
        okButtonProps={{ type: "primary", className: "bg-blue-600 hover:bg-blue-700" }}
        confirmLoading={markAsPaidMutation.isPending}
      >
        <div className="py-4">
          <p className="text-base mb-2">Are you sure you want to mark this item as paid?</p>
          {itemToMarkPaid && (
            <div className="bg-gray-50 p-3 rounded-md">
              <p><span className="font-medium">Employee:</span> {itemToMarkPaid.employeeName}</p>
              <p><span className="font-medium">Category:</span> {itemToMarkPaid.category}</p>
              <p><span className="font-medium">Amount:</span> ₹{Number(itemToMarkPaid.amount).toFixed(2)}</p>
            </div>
          )}
        </div>
      </Modal>

      {/* Preview Drawer */}
      <Drawer
        title={
          <Space>
            <span>{previewFile?.fileName || 'Document Preview'}</span>
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(previewFile)}
            >
              Download
            </Button>
          </Space>
        }
        placement="right"
        width="50%"
        onClose={() => setPreviewVisible(false)}
        open={previewVisible}
        destroyOnClose
        styles={{ body: { padding: 0, height: 'calc(100vh - 55px)' } }}
      >
        {previewFile && (
          <iframe
            src={getIframeUrl(previewFile)}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={previewFile.fileName}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
            referrerPolicy="no-referrer"
            allow="autoplay *; fullscreen *"
          />
        )}
      </Drawer>

      {/* Reject Modal */}
      <Modal
        title="Reject Item"
        open={rejectModalVisible}
        onOk={confirmReject}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectRemarks("");
          setSelectedItem(null);
        }}
        okText="Reject"
        okButtonProps={{ danger: true }}
        confirmLoading={rejectMutation.isPending}
      >
        <div className="py-4">
          <label className="block mb-2 text-sm font-medium">
            Remarks (Optional)
          </label>
          <Input.TextArea
            rows={4}
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            placeholder="Enter reason for rejection..."
          />
        </div>
      </Modal>
    </div>
  );
}











