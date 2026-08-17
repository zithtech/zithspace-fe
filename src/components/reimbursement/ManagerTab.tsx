
// "use client";
// import PreviewModal from "@/components/common/PreviewModal";
// import {
//   Card,
//   Typography,
//   Row,
//   Col,
//   Statistic,
//   Table,
//   Tag,
//   Button,
//   Space,
//   Tooltip,
//   Timeline,
//   message,
//   Modal,
//   Drawer,
//   Input,
//   Select,
// } from "antd";

// import {
//   ClockCircleOutlined,
//   SyncOutlined,
//   CheckCircleOutlined,
//   EyeOutlined,
//   CloseOutlined,
//   CloseCircleOutlined,
//   TeamOutlined,
//   DownloadOutlined,
//   QuestionCircleOutlined,
//   FilterOutlined,
// } from "@ant-design/icons";

// import type { ColumnsType } from "antd/es/table";
// import { useState, useEffect, useRef } from "react";

// import { CategoryService, ReimbursementRequest as Reimbursement } from "@/services/categoryService";
// import { useRequests, useManagerAction } from "@/hooks/useCategories";

// const { Title } = Typography;

// /* ================== COMPONENT ================== */
// export default function ManagerTab() {
//   /* ===== DATA FROM SERVICE ===== */
//   const { data: requestData, isLoading: loading, refetch: reload } = useRequests({ view: 'manager' });
//   const data = requestData?.data || [];
//   const { mutateAsync: performManagerAction } = useManagerAction();

//   /* ===== STATE ===== */
//   const [open, setOpen] = useState(false);
//   const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);

//   const [actionType, setActionType] = useState<
//     "approve" | "reject" | "clarify" | null
//   >(null);
//   const [actionText, setActionText] = useState("");
//   const [currentRecord, setCurrentRecord] = useState<Reimbursement | null>(null);

//   const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
//   const [loadingFile, setLoadingFile] = useState(false);
//   const [previewModal, setPreviewModal] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState("");
//   const [previewFileName, setPreviewFileName] = useState("");
//   const [dateFilter, setDateFilter] = useState<string>("");

//   // Search & Filter (same pattern as settings)
//   const [searchText, setSearchText] = useState("");
//   const [showFilter, setShowFilter] = useState(false);

//   const [statusFilter, setStatusFilter] = useState<string>("PENDING_APPROVAL");
//   const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
//   const [submittedFilter, setSubmittedFilter] = useState<string[]>([]);

//   const filterRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     function handleClickOutside(e: MouseEvent) {
//       if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
//         setShowFilter(false);
//       }
//     }

//     if (showFilter) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }

//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [showFilter]);

//   const getAuthHeaders = () => {
//     const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
//     const tenantId = localStorage.getItem("tenantId");
//     return {
//       "Authorization": `Bearer ${token}`,
//       "x-tenant-id": tenantId || "",
//     };
//   };

//   const filteredRequests = data.filter((item) => {
//     // Explicitly exclude DRAFT from Manager view
//     if (item.status === 'DRAFT') return false;

//     // search
//     const matchesSearch =
//       (item.requestId || "").toLowerCase().includes(searchText.toLowerCase()) ||
//       (item.employee?.name || (item as any).user?.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
//       ((item as any).department || "").toLowerCase().includes(searchText.toLowerCase()) ||
//       (item.category || "").toLowerCase().includes(searchText.toLowerCase()) ||
//       (item.submitted ?? "").toLowerCase().includes(searchText.toLowerCase());

//     // category filter
//     const matchesCategory =
//       categoryFilter.length === 0 || categoryFilter.includes(item.category);

//     // submitted filter
//     const matchesSubmitted =
//       !dateFilter || (item.submittedAt && item.submittedAt.startsWith(dateFilter));
//     // status filter
//     const matchesStatus =
//       statusFilter === "all" || item.status === statusFilter;

//     return matchesSearch && matchesCategory && matchesSubmitted && matchesStatus;
//   });

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

//   //filter logic
//   const pendingRequests = data.filter(r => r.status === "PENDING_APPROVAL");
//   const clarifyRequests = data.filter(r => r.status === "CLARIFY");

//   const approvedTodayCount = data.filter(d => {
//     if (d.status !== 'APPROVED') return false;
//     const updated = new Date(d.updatedAt);
//     const today = new Date();
//     return updated.getDate() === today.getDate() &&
//       updated.getMonth() === today.getMonth() &&
//       updated.getFullYear() === today.getFullYear();
//   }).length;

//   const getManagerStatusTag = (status: string) => {
//     switch (status) {
//       case "APPROVED":
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

//   type StatusChipProps = {
//     status: Reimbursement["status"];
//     size?: "sm" | "md";
//   };

//   const StatusChip = ({ status, size = "sm" }: StatusChipProps) => {
//     const base =
//       "rounded-full font-semibold inline-flex items-center";

//     const sizeCls =
//       size === "sm"
//         ? "px-2 py-1 text-xs"
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
//         {status.replace("_", " ")}
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
//       width: 160,
//       render: (_, record) => {
//         const emp = record.employee || (record as any).user;
//         return (
//           <div>
//             <div className="font-medium text-sm">
//               {emp?.name}
//             </div>
//             <div className="text-xs text-gray-500">
//               {(record as any).department || emp?.department || emp?.position}
//             </div>
//           </div>
//         );
//       },
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
//       title: "Submitted",
//       dataIndex: "submitted",
//       width: 110,
//       render: (text) => <span className="text-sm">{text}</span>,
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       width: 120,
//       render: (status: Reimbursement["status"]) => (
//         <span
//           className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold
//           ${status === "PENDING_APPROVAL"
//               ? "bg-orange-100 text-orange-700"
//               : status === "APPROVED"
//                 ? "bg-green-100 text-green-700"
//                 : status === "PAID"
//                   ? "bg-blue-100 text-blue-700"
//                   : "bg-red-100 text-red-700"
//             }
//         `}
//         >
//           {(status || "").replace("_", " ")}
//         </span>
//       ),
//     },
//     {
//       title: "Actions",
//       width: 150,
//       align: "center",
//       render: (_, record) => (
//         <Space size={4}>
//           <Tooltip title="View">
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

//           <Tooltip title="Approve">
//             <Button
//               type="text"
//               icon={<CheckCircleOutlined />}
//               className="text-green-600 hover:text-green-700 hover:bg-green-50 w-7 h-7"
//               onClick={() => {
//                 setCurrentRecord(record);
//                 setActionType("approve");
//               }}
//             />
//           </Tooltip>

//           <Tooltip title="Reject">
//             <Button
//               type="text"
//               icon={<CloseCircleOutlined />}
//               className="text-red-600 hover:text-red-700 hover:bg-red-50 w-7 h-7"
//               onClick={() => {
//                 setCurrentRecord(record);
//                 setActionType("reject");
//               }}
//             />
//           </Tooltip>

//           <Tooltip title="Clarify">
//             <Button
//               type="text"
//               icon={<QuestionCircleOutlined />}
//               className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 w-7 h-7"
//               onClick={() => {
//                 setCurrentRecord(record);
//                 setActionType("clarify");
//               }}
//             />
//           </Tooltip>
//         </Space>
//       ),
//     },
//   ];

//   return (
//     // <Card className="rounded-lg shadow-sm bg-white h-[540px] flex flex-col border border-gray-100">
//       <div className="space-y-3 p-3">

//         <style jsx global>{`
//           .manager-table .ant-table-thead > tr > th {
//             padding: 8px 10px !important;
//             font-size: 12px !important;
//             font-weight: 600 !important;
//             background-color: #fafafa !important;
//           }

//           .manager-table .ant-table-tbody > tr > td {
//             padding: 6px 10px !important;
//             font-size: 12px !important;
//           }

//           .manager-table .ant-table-tbody > tr:hover > td {
//             background-color: #f5f9ff !important;
//           }

//           .manager-table .ant-btn {
//             height: 26px !important;
//             width: 26px !important;
//           }

//           .manager-table .ant-pagination {
//             margin-top: 10px !important;
//           }

//           .manager-table .ant-pagination-item {
//             min-width: 26px !important;
//             height: 26px !important;
//             line-height: 24px !important;
//           }
//         `}</style>

//         {/* ================= HEADER ================= */}
//         <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
//           {/* ================= LEFT SIDE ================= */}
//           <div className="space-y-1.5">
//             <h2 className="text-base font-semibold text-gray-900">
//               <Space size={4}>
//                 <TeamOutlined className="text-blue-600" />
//                 <span>Manager Dashboard</span>
//               </Space>
//             </h2>

//             <p className="text-xs text-gray-500 leading-normal">
//               View and take action on employee reimbursement claims.
//             </p>

//             {/* ✅ CHIPS – IMPROVED */}
//             <div className="flex flex-wrap gap-2">
//               <div className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
//                 Pending: {pendingRequests.length}
//               </div>

//               <div className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
//                 Review: {clarifyRequests.length}
//               </div>

//               <div className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
//                 Today: {approvedTodayCount}
//               </div>
//             </div>
//           </div>

//           {/* ================= RIGHT SIDE - IMPROVED ALIGNMENT ================= */}
//           <div className="flex items-center gap-2">
//             {/* SEARCH BAR - BETTER SIZE */}
//             <div className="relative">
//               <input
//                 type="text"
//                 placeholder="Search requests..."
//                 value={searchText}
//                 onChange={(e) => setSearchText(e.target.value)}
//                 className="w-48 px-3 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-gray-50/50"
//               />
//             </div>

//             {/* FILTER BUTTON - IMPROVED */}
//             <div className="relative" ref={filterRef}>
//               <Button
//                 icon={<FilterOutlined />}
//                 onClick={() => setShowFilter(prev => !prev)}
//                 className={`
//                   flex items-center gap-1.5
//                   px-3 py-1.5 h-auto rounded-md
//                   border text-xs font-medium
//                   ${showFilter
//                     ? "border-blue-500 text-blue-600 bg-blue-50"
//                     : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}
//                 `}
//               >
//                 Filter
//               </Button>

//               {/* ================= FILTER CARD - IMPROVED ================= */}
//               {showFilter && (
//                 <div
//                   className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
//                 >
//                   {/* HEADER */}
//                   <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
//                     <span className="font-semibold text-gray-800 text-sm">
//                       Filter Requests
//                     </span>
//                     <Button
//                       size="small"
//                       type="text"
//                       icon={<CloseOutlined />}
//                       onClick={() => setShowFilter(false)}
//                       className="text-gray-400 hover:text-gray-600"
//                     />
//                   </div>

//                   {/* CATEGORY */}
//                   <div className="mb-3">
//                     <label className="block text-xs font-medium text-gray-500 mb-1">
//                       Category
//                     </label>
//                     <Select
//                       mode="multiple"
//                       size="small"
//                       value={categoryFilter}
//                       onChange={setCategoryFilter}
//                       style={{ width: "100%" }}
//                       maxTagCount={1}
//                       placeholder="Select category"
//                       className="text-xs"
//                     >
//                       {[...new Set(data.map(d => d.category))].map(c => (
//                         <Select.Option key={c} value={c}>
//                           {c}
//                         </Select.Option>
//                       ))}
//                     </Select>
//                   </div>

//                   {/* SUBMITTED DATE */}
//                   <div className="mb-3">
//                     <label className="block text-xs font-medium text-gray-500 mb-1">
//                       Submitted Date
//                     </label>
//                     <input
//                       type="date"
//                       value={dateFilter}
//                       onChange={(e) => setDateFilter(e.target.value)}
//                       className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:border-blue-500 focus:outline-none"
//                     />
//                   </div>

//                   {/* STATUS */}
//                   <div className="mb-3">
//                     <label className="block text-xs font-medium text-gray-500 mb-1">
//                       Status
//                     </label>
//                     <select
//                       value={statusFilter}
//                       onChange={(e) => setStatusFilter(e.target.value)}
//                       className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
//                     >
//                       <option value="PENDING_APPROVAL">Pending</option>
//                       <option value="CLARIFY">Clarification</option>
//                       <option value="APPROVED">Approved</option>
//                       <option value="REJECTED">Rejected</option>
//                       <option value="all">All</option>
//                     </select>
//                   </div>

//                   {/* ACTIONS */}
//                   <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
//                     <Button
//                       size="small"
//                       onClick={() => {
//                         setSearchText("");
//                         setCategoryFilter([]);
//                         setSubmittedFilter([]);
//                         setDateFilter("");
//                         setStatusFilter("PENDING_APPROVAL");
//                       }}
//                       className="text-xs px-3"
//                     >
//                       Reset
//                     </Button>

//                     <Button
//                       size="small"
//                       type="primary"
//                       onClick={() => setShowFilter(false)}
//                       className="text-xs px-4 bg-blue-600 hover:bg-blue-700"
//                     >
//                       Apply
//                     </Button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ===== TABLE ===== */}
//         <div className="flex-1 overflow-hidden mt-1">
//           <Table
//             className="manager-table"
//             rowKey="id"
//             columns={columns}
//             dataSource={filteredRequests}
//             loading={loading}
//             pagination={{
//               pageSize: 7,
//               showSizeChanger: false,
//               showQuickJumper: false,
//               position: ["bottomRight"],
//             }}
//           />
//         </div>

//         {/* ===== DRAWER ===== */}
//         <Drawer
//           title={
//             <div className="pb-2">
//               <div className="flex items-center justify-between">
//                 <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
//                     className="rounded-full px-2.5 py-1 text-xs font-medium border-0"
//                   >
//                     {selectedRow?.status || "PENDING"}
//                   </Tag>
//                   <CloseOutlined
//                     className="cursor-pointer text-gray-500 hover:text-gray-900 text-sm transition-colors"
//                     onClick={() => setOpen(false)}
//                   />
//                 </div>
//               </div>
//             </div>
//           }
//           placement="right"
//           width={420}
//           closeIcon={null}
//           open={open}
//           styles={{
//             body: {
//               padding: 14,
//               height: "100vh",
//               overflow: "hidden",
//             },
//             header: { padding: "14px 18px 0" },
//           }}
//           footer={
//             <div className="flex justify-end p-2 border-t border-gray-100">
//               <div className="flex gap-2">
//                 <Button
//                   type="primary"
//                   size="middle"
//                   className="bg-green-500 hover:bg-green-600 border-none px-4 text-xs"
//                   onClick={async () => {
//                     if (!selectedRow) return;
//                     await performManagerAction({ id: selectedRow.id, data: { action: "APPROVE" } });
//                     setOpen(false);
//                   }}
//                 >
//                   Approve
//                 </Button>

//                 <Button
//                   danger
//                   size="middle"
//                   className="px-4 text-xs"
//                   onClick={async () => {
//                     if (!selectedRow) return;
//                     await performManagerAction({ id: selectedRow.id, data: { action: "REJECT" } });
//                     setOpen(false);
//                   }}
//                 >
//                   Reject
//                 </Button>
//               </div>
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

//                 <div className="rounded-lg bg-gradient-to-br from-white to-slate-50 p-3 border border-slate-200 space-y-2 shadow-sm">
//                   {[
//                     ["Category", selectedRow.category],
//                     ["Total", `₹${selectedRow.amount}`],
//                     ["Employee", selectedRow.employee?.name || (selectedRow as any).user?.name],
//                     ["Dept", (selectedRow as any).department || selectedRow.employee?.department || "N/A"],
//                     ["Submitted", selectedRow.submitted],
//                   ].map(([label, value], i) => (
//                     <div
//                       key={i}
//                       className="flex justify-between text-xs py-1 px-2 hover:bg-slate-100 rounded transition-colors"
//                     >
//                       <span className="text-gray-500">{label}</span>
//                       <span className="font-medium text-gray-900">{value}</span>
//                     </div>
//                   ))}

//                   {/* MANAGER STATUS */}
//                   <div className="flex justify-between text-xs py-1 px-2">
//                     <span className="text-gray-500">Manager</span>
//                     <span className="font-medium">{getManagerStatusTag(selectedRow.status)}</span>
//                   </div>

//                   {/* FINANCE STATUS */}
//                   <div className="flex justify-between text-xs py-1 px-2">
//                     <span className="text-gray-500">Finance</span>
//                     <span className="font-medium">{getFinanceStatusTag(selectedRow.financeStatus, selectedRow.status)}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* ================= SCROLLABLE AREA ================= */}
//               <div className="flex-1 overflow-y-auto mt-3 space-y-4">
//                 {/* EXPENSE ITEMS */}
//                 <div>
//                   <div className="mb-2 font-semibold text-base text-gray-900">
//                     Items ({selectedRow.expenseItems?.length || 0})
//                   </div>

//                   <div className="space-y-2">
//                     {selectedRow.expenseItems?.map((item, i) => {
//                       const files = normalizeFiles(item);
//                       const showFiles = files.slice(0, 2);
//                       const hasMoreFiles = files.length > 2;

//                       return (
//                         <div key={i} className="group flex items-start gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded shadow-sm">
//                           <div className="flex-1 min-w-0">
//                             <div className="font-medium text-sm group-hover:text-blue-700 transition-colors truncate">{item.title}</div>
//                             <div className="text-xs text-gray-500 mt-0.5">{item.date} • ₹{item.amount}</div>
//                           </div>

//                           {files.length > 0 && (
//                             <div className="space-y-1.5 min-w-[140px]">
//                               {showFiles.map((file, idx) => (
//                                 <div
//                                   key={idx}
//                                   className="flex items-center justify-between bg-white p-1.5 rounded text-xs shadow-sm border border-slate-100 h-7"
//                                 >
//                                   <span className="truncate font-medium text-gray-800 max-w-[70px]">
//                                     {getFileName(file)}
//                                   </span>
//                                   <div className="flex gap-1">
//                                     <Button
//                                       size="small"
//                                       type="text"
//                                       disabled={!!downloadingFile}
//                                       className="!p-0 w-5 h-5 text-gray-600 hover:text-blue-600"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         handlePreview(file);
//                                       }}
//                                     >
//                                       <EyeOutlined style={{ fontSize: 11 }} />
//                                     </Button>
//                                     <Button
//                                       size="small"
//                                       type="text"
//                                       loading={downloadingFile === file}
//                                       disabled={!!downloadingFile && downloadingFile !== file}
//                                       className="!p-0 w-5 h-5 text-gray-600 hover:text-green-600"
//                                       onClick={(e) => {
//                                         e.stopPropagation();
//                                         handleDownload(file);
//                                       }}
//                                     >
//                                       {downloadingFile !== file && <DownloadOutlined style={{ fontSize: 11 }} />}
//                                     </Button>
//                                   </div>
//                                 </div>
//                               ))}
//                               {hasMoreFiles && (
//                                 <div>
//                                   <Button
//                                     size="small"
//                                     type="link"
//                                     className="p-0 text-xs text-blue-600 hover:text-blue-700 font-medium h-auto"
//                                   >
//                                     +{files.length - 2} more
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
//                   <div className="mb-2 font-semibold text-base text-gray-900">Activity</div>

//                   <Timeline>
//                     {selectedRow.activityLog.slice(-3).map((log, i) => (
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

//         {/* ===== MODAL ACTIONS ===== */}
//         <Modal
//           open={!!actionType}
//           footer={null}
//           centered
//           closable={false}
//           width={400}
//           className="rounded-lg overflow-hidden"
//           onCancel={() => {
//             setActionType(null);
//             setActionText("");
//           }}
//         >
//           {/* HEADER */}
//           <div className="px-5 py-3 border-b border-gray-200">
//             <h3 className="text-base font-semibold text-gray-800">
//               {actionType === "approve" && "Approve Request"}
//               {actionType === "reject" && "Reject Request"}
//               {actionType === "clarify" && "Request Clarification"}
//             </h3>
//             <p className="text-xs text-gray-500 mt-0.5">
//               {currentRecord?.requestId}
//             </p>
//           </div>

//           {/* BODY */}
//           <div className="px-5 py-4 bg-slate-50">
//             {/* APPROVE CONTENT */}
//             {actionType === "approve" && (
//               <div className="rounded bg-white border p-3">
//                 <p className="text-sm text-gray-700">
//                   Approve <b>{currentRecord?.requestId}</b>?
//                 </p>
//               </div>
//             )}

//             {/* REJECT CONTENT */}
//             {actionType === "reject" && (
//               <div className="space-y-2">
//                 <label className="text-xs font-medium text-gray-600">
//                   Reason <span className="text-red-500">*</span>
//                 </label>
//                 <Input.TextArea
//                   rows={3}
//                   value={actionText}
//                   onChange={(e) => setActionText(e.target.value)}
//                   placeholder="Enter reason for rejection..."
//                   className="rounded text-sm"
//                 />
//               </div>
//             )}

//             {/* CLARIFICATION CONTENT */}
//             {actionType === "clarify" && (
//               <div className="space-y-2">
//                 <label className="text-xs font-medium text-gray-600">
//                   Question <span className="text-red-500">*</span>
//                 </label>
//                 <Input.TextArea
//                   rows={3}
//                   value={actionText}
//                   onChange={(e) => setActionText(e.target.value)}
//                   placeholder="What additional information do you need?"
//                   className="rounded text-sm"
//                 />
//               </div>
//             )}
//           </div>

//           {/* FOOTER */}
//           <div className="flex justify-end gap-2 px-5 py-3 bg-white border-t border-gray-200">
//             <Button
//               size="middle"
//               onClick={() => {
//                 setActionType(null);
//                 setActionText("");
//               }}
//               className="px-4 text-xs"
//             >
//               Cancel
//             </Button>

//             <Button
//               size="middle"
//               type="primary"
//               className={
//                 actionType === "approve"
//                   ? "bg-green-500 hover:bg-green-600 border-none px-5 text-xs"
//                   : actionType === "reject"
//                     ? "bg-red-500 hover:bg-red-600 border-none px-5 text-xs"
//                     : "bg-blue-500 hover:bg-blue-600 border-none px-5 text-xs"
//               }
//               onClick={async () => {
//                 if (!currentRecord) return;

//                 if ((actionType === "reject" || actionType === "clarify") && !actionText.trim()) {
//                   message.error("Message required");
//                   return;
//                 }

//                 if (actionType === "approve") {
//                   await performManagerAction({ id: currentRecord.id, data: { action: "APPROVE" } });
//                 }

//                 if (actionType === "reject") {
//                   await performManagerAction({ id: currentRecord.id, data: { action: "REJECT", comments: actionText } });
//                 }

//                 if (actionType === "clarify") {
//                   await performManagerAction({ id: currentRecord.id, data: { action: "CLARIFY", comments: actionText } });
//                 }

//                 setActionType(null);
//                 setActionText("");
//               }}
//             >
//               {actionType === "approve"
//                 ? "Approve"
//                 : actionType === "reject"
//                   ? "Reject"
//                   : "Send"}
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
// }































// "use client";
// import { Button, Table, Tag } from "antd";
// import { ReloadOutlined } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";

// export default function ManagerReimbursementsPage() {
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   console.log('📊 Manager approvals:', reimbursements);

//   // Function to get employee name from the data
//   const getEmployeeName = (record: any) => {
//     // Try different possible paths based on your actual API response
//     return record.employeeName || 
//            record.createdBy?.name || 
//            record.user?.name || 
//            'N/A';
//   };

//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => { // Use 'any' temporarily
//         return getEmployeeName(record);
//       },
//     },
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
//         return <Tag color="gold">Pending Approval</Tag>;
//       },
//     },
//   ];

//   return (
//     <div className="space-y-4 p-2">
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//         <div className="space-y-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Team Reimbursements
//           </h2>
//           <p className="text-sm text-gray-500">
//             Pending approvals from your team
//           </p>
//         </div>

//         <div className="flex items-center gap-3">
//           <Button
//             icon={<ReloadOutlined />}
//             onClick={() => refetch()}
//             className="h-10 px-5"
//           >
//             Refresh
//           </Button>
//         </div>
//       </div>

//       <Table
//         rowKey="id"
//         columns={columns}
//         dataSource={reimbursements}
//         loading={loading}
//         pagination={{
//           pageSize: 10,
//           showSizeChanger: true,
//           showTotal: (total) => `Total ${total} pending approvals`,
//         }}
//       />
//     </div>
//   );
// }








// "use client";
// import { Button, Table, Tag } from "antd";
// import { ReloadOutlined } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useMemo } from "react";

// export default function ManagerReimbursementsPage() {
//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   console.log('📊 Manager approvals:', reimbursements);

//   // Transform data - split items into separate rows (no "+X more" message)
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       // Get employee details
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           reimbursement.user?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       // If there are multiple items, create separate row for each
//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
//           rows.push({
//             // Unique key for each row
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             // No itemsCount or isFirst flags
//           });
//         });
//       } else {
//         // If no items, create one row with reimbursement data
//         rows.push({
//           key: reimbursement.id,
//           reimbursementId: reimbursement.id,
//           employeeName: employeeName,
//           employeeCode: employeeCode,
//           category: 'N/A',
//           date: reimbursement.createdAt,
//           amount: 0,
//           billNo: '—',
//           description: '—',
//         });
//       }
//     });

//     console.log('📊 Transformed data (separate rows):', rows);
//     return rows;
//   }, [reimbursements]);

//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => {
//         return (
//           <div>
//             <div>{record.employeeName}</div>
//             <div className="text-xs text-gray-500">{record.employeeCode}</div>
//           </div>
//         );
//       },
//     },
//     {
//       title: "Category",
//       key: "category",
//       render: (_: any, record: any) => {
//         return record.category || 'N/A';
//       },
//     },
//     {
//       title: "Date",
//       key: "date",
//       render: (_: any, record: any) => {
//         return record.date ? dayjs(record.date).format('DD MMM YYYY') : '—';
//       },
//     },
//     {
//       title: "Amount",
//       key: "amount",
//       render: (_: any, record: any) => {
//         return <span className="font-semibold">₹{Number(record.amount).toLocaleString("en-IN")}</span>;
//       },
//     },
//     {
//       title: "Bill No.",
//       key: "billNo",
//       render: (_: any, record: any) => {
//         return record.billNo || '—';
//       },
//     },
//     {
//       title: "Description",
//       key: "description",
//       render: (_: any, record: any) => {
//         return record.description || '—';
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => {
//         return <Tag color="gold">Pending </Tag>;
//       },
//     },
//   ];

//   return (
//     <div className="space-y-4 p-6">
//       <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
//         <div className="space-y-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Team Reimbursements
//           </h2>
//           <p className="text-sm text-gray-500">
//             You have {transformedData.length} pending item(s) to review
//           </p>
//         </div>

//         <div className="flex items-center gap-3">
//           <Button
//             icon={<ReloadOutlined />}
//             onClick={() => refetch()}
//             loading={loading}
//             className="h-10 px-5"
//           >
//             Refresh
//           </Button>
//         </div>
//       </div>

//       {/* Summary Cards */}
//        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//       <Tag className="!p-4 !h-auto !bg-white !border !rounded-lg !block">
//         <div className="text-gray-500 text-sm">Total Reimbursements</div>
//         <div className="text-2xl font-bold">{reimbursements.length}</div>
//       </Tag>

//       <Tag className="!p-4 !h-auto !bg-white !border !rounded-lg !block">
//         <div className="text-gray-500 text-sm">Total Items</div>
//         <div className="text-2xl font-bold">{transformedData.length}</div>
//       </Tag>

//       <Tag className="!p-4 !h-auto !bg-white !border !rounded-lg !block">
//         <div className="text-gray-500 text-sm">Total Amount</div>
//         <div className="text-2xl font-bold text-green-600">
//           ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </div>
//       </Tag>
//     </div>


//       <Table
//         rowKey="key"
//         columns={columns}
//         dataSource={transformedData}
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
// import { Button, Table, Tag, Input, Space } from "antd";
// import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useMemo, useState } from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   console.log('📊 Manager approvals:', reimbursements);

//   // Transform data - split items into separate rows (functionality unchanged)
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       // Get employee details
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           reimbursement.user?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       // If there are multiple items, create separate row for each
//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//           });
//         });
//       } else {
//         rows.push({
//           key: reimbursement.id,
//           reimbursementId: reimbursement.id,
//           employeeName: employeeName,
//           employeeCode: employeeCode,
//           category: 'N/A',
//           date: reimbursement.createdAt,
//           amount: 0,
//           billNo: '—',
//           description: '—',
//         });
//       }
//     });

//     return rows;
//   }, [reimbursements]);

//   // Filter data based on search (new functionality but keeps existing logic)
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Columns - only UI changed, functionality same
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => {
//         return (
//           <div>
//             <div>{record.employeeName}</div>
//             <div className="text-xs text-gray-500">{record.employeeCode}</div>
//           </div>
//         );
//       },
//     },
//     {
//       title: "Category Type",
//       key: "category",
//       render: (_: any, record: any) => {
//         return <Tag color="blue">{record.category}</Tag>;
//       },
//     },
//     {
//       title: "Period",
//       key: "period",
//       render: () => <Tag color="green">Month</Tag>,
//     },
//     {
//       title: "Monthly",
//       key: "monthly",
//       render: (_: any, record: any) => {
//         return <span>₹{Number(record.amount).toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Yearly",
//       key: "yearly",
//       render: (_: any, record: any) => {
//         const yearly = Number(record.amount) * 12;
//         return <span>₹{yearly.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: () => <Tag color="success">ACTIVE</Tag>,
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: () => (
//         <Space size={4}>
//           <Button type="text" size="small" icon={<EditOutlined />} />
//           <Button type="text" size="small" danger icon={<DeleteOutlined />} />
//         </Space>
//       ),
//     },
//   ];

//  return (
//   <div className="p-6">
//     {/* Header */}
//     <div className="flex justify-between items-center mb-4">
//       <div className="flex items-center gap-2">
//         <span className="text-2xl"></span>
//         <h2 className="text-xl font-semibold text-gray-900">
//           Team Reimbursements
//         </h2>
//       </div>

//       <Space size={8}>
//         <Button 
//           icon={<ReloadOutlined />} 
//           onClick={() => refetch()}
//           loading={loading}
//           size="small"
//         />
//         <Input.Search
//           placeholder="Search..."
//           allowClear
//           size="small"
//           style={{ width: 200 }}
//           onChange={(e) => setSearchText(e.target.value)}
//         />
//         <Button
//           type="primary"
//           size="small"
//           icon={<PlusOutlined />}
//         >
//           Add configuration
//         </Button>
//       </Space>
//     </div>

//     {/* 🔴 Summary Cards - Small tags like screenshot */}
//     <div className="flex gap-2 mb-4">
//       <Tag color="blue" className="!px-3 !py-1 !text-sm">
//         Total Reimbursements: {reimbursements.length}
//       </Tag>

//       <Tag color="green" className="!px-3 !py-1 !text-sm">
//         Total Items: {transformedData.length}
//       </Tag>

//       <Tag color="purple" className="!px-3 !py-1 !text-sm">
//         Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//       </Tag>
//     </div>

//     {/* Table */}
//     <Table
//       columns={columns}
//       dataSource={filteredData}
//       size="small"
//       pagination={{
//         pageSize: 10,
//         size: "small",
//         showTotal: (total) => `Total ${total} items`,
//       }}
//       loading={loading}
//       rowKey="key"
//       bordered
//     />
//   </div>
// );
// }


// "use client";
// import { Button, Table, Tag, Input, Space, Modal } from "antd";
// import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined, EyeOutlined } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useMemo, useState ,useEffect} from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewUrl, setPreviewUrl] = useState("");
//   const [previewFileName, setPreviewFileName] = useState("");


//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();
//   // ManagerTab.tsx - Add this useEffect to verify data
// useEffect(() => {
//   console.log('📦 API Response:', reimbursements);
//   reimbursements.forEach((r: any) => {
//     console.log(`📦 Reimbursement ${r.id}:`);
//     r.items?.forEach((item: any, idx: number) => {
//       console.log(`  Item ${idx}:`, {
//         category: item.category,
//         attachments: item.attachments,
//         attachmentsCount: item.attachments?.length
//       });
//     });
//   });
// }, [reimbursements]);

//   console.log('📊 Manager approvals:', reimbursements);

//   // Transform data - split items into separate rows
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           reimbursement.user?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [], // Add attachments
//           });
//         });
//       } else {
//         rows.push({
//           key: reimbursement.id,
//           reimbursementId: reimbursement.id,
//           employeeName: employeeName,
//           employeeCode: employeeCode,
//           category: 'N/A',
//           date: reimbursement.createdAt,
//           amount: 0,
//           billNo: '—',
//           description: '—',
//           attachments: [],
//         });
//       }
//     });

//     return rows;
//   }, [reimbursements]);


//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle document preview
//   const handlePreview = (attachments: any[]) => {
//     if (attachments && attachments.length > 0) {
//       const file = attachments[0]; // Show first attachment
//       setPreviewUrl(file.fileUrl);
//       setPreviewFileName(file.fileName);
//       setPreviewVisible(true);
//     }
//   };

//   // Columns - Added Document column
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => {
//         return (
//           <div>
//             <div>{record.employeeName}</div>
//             <div className="text-xs text-gray-500">{record.employeeCode}</div>
//           </div>
//         );
//       },
//     },
//     {
//       title: "Category Type",
//       key: "category",
//       render: (_: any, record: any) => {
//         return <Tag color="blue">{record.category}</Tag>;
//       },
//     },
//     {
//       title: "Period",
//       key: "period",
//       render: () => <Tag color="green">Month</Tag>,
//     },
//     {
//       title: "Monthly",
//       key: "monthly",
//       render: (_: any, record: any) => {
//         return <span>₹{Number(record.amount).toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Yearly",
//       key: "yearly",
//       render: (_: any, record: any) => {
//         const yearly = Number(record.amount) * 12;
//         return <span>₹{yearly.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Document", // 🔴 New Document column
//       key: "document",
//       render: (_: any, record: any) => {
//         const hasAttachments = record.attachments && record.attachments.length > 0;

//         return hasAttachments ? (
//           <Button 
//             type="link" 
//             size="small" 
//             icon={<FileOutlined />}
//             onClick={() => handlePreview(record.attachments)}
//             className="text-blue-600 hover:text-blue-800"
//           >
//             View
//           </Button>
//         ) : (
//           <span className="text-gray-400">—</span>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: () => <Tag color="success">ACTIVE</Tag>,
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: () => (
//         <Space size={4}>
//           <Button type="text" size="small" icon={<EditOutlined />} />
//           <Button type="text" size="small" danger icon={<DeleteOutlined />} />
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <span className="text-2xl"></span>
//           <h2 className="text-xl font-semibold text-gray-900">
//             Team Reimbursements
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
//           >
//             Add configuration
//           </Button>
//         </Space>
//       </div>

//       {/* Summary Cards */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1 !text-sm">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>

//         <Tag color="green" className="!px-3 !py-1 !text-sm">
//           Total Items: {transformedData.length}
//         </Tag>

//         <Tag color="purple" className="!px-3 !py-1 !text-sm">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         size="small"
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showTotal: (total) => `Total ${total} items`,
//         }}
//         loading={loading}
//         rowKey="key"
//         bordered
//       />

//       {/* 🔴 Document Preview Modal */}
//       <Modal
//         title={previewFileName}
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={800}
//         bodyStyle={{ height: '600px', padding: 0 }}
//       >
//         {previewUrl && (
//           <iframe
//             src={previewUrl}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title="Document Preview"
//           />
//         )}
//       </Modal>
//     </div>
//   );
// }preview matum work agala 


// "use client";
// import { Button, Table, Tag, Input, Space, Modal } from "antd";
// import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined, DownloadOutlined } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { ReimbursementResponse } from "@/services/reimbursementcreateService";
// import dayjs from "dayjs";
// import { useMemo, useState, useEffect } from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [selectedFile, setSelectedFile] = useState<any>(null);

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   // Debug: Check if attachments are coming from backend
//   useEffect(() => {
//     console.log('📦 API Response:', reimbursements);
//     reimbursements.forEach((r: any) => {
//       console.log(`📦 Reimbursement ${r.id}:`);
//       r.items?.forEach((item: any, idx: number) => {
//         console.log(`  Item ${idx}:`, {
//           category: item.category,
//           attachments: item.attachments,
//           attachmentsCount: item.attachments?.length
//         });
//       });
//     });
//   }, [reimbursements]);

//   // Transform data - split items into separate rows
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           reimbursement.user?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [], // Attachments from item
//           });
//         });
//       } else {
//         rows.push({
//           key: reimbursement.id,
//           reimbursementId: reimbursement.id,
//           employeeName: employeeName,
//           employeeCode: employeeCode,
//           category: 'N/A',
//           date: reimbursement.createdAt,
//           amount: 0,
//           billNo: '—',
//           description: '—',
//           attachments: [],
//         });
//       }
//     });

//     return rows;
//   }, [reimbursements]);

//   // Filter data based on search
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle file preview
//   // const handlePreview = (file: any) => {
//   //   setSelectedFile(file);
//   //   setPreviewVisible(true);
//   // };
//   // Add this in handlePreview to debug
// const handlePreview = (file: any) => {
//   console.log('📎 Selected file:', {
//     fileName: file.fileName,
//     fileUrl: file.fileUrl,
//     fileType: file.fileType,
//     fileSize: file.fileSize
//   });
//   setSelectedFile(file);
//   setPreviewVisible(true);
// };

//   // Handle file download
//   const handleDownload = (file: any) => {
//     window.open(file.fileUrl, '_blank');
//   };

//   // Check if file is viewable in browser
//   const isViewableFile = (fileType: string) => {
//     return fileType?.startsWith('image/') || 
//            fileType === 'application/pdf' ||
//            fileType?.startsWith('text/');
//   };

//   // Columns - Updated Document column for multiple files
//   const columns = [
//     {
//       title: "Employee",
//       key: "employee",
//       render: (_: any, record: any) => {
//         return (
//           <div>
//             <div>{record.employeeName}</div>
//             <div className="text-xs text-gray-500">{record.employeeCode}</div>
//           </div>
//         );
//       },
//     },
//     {
//       title: "Category Type",
//       key: "category",
//       render: (_: any, record: any) => {
//         return <Tag color="blue">{record.category}</Tag>;
//       },
//     },
//     {
//       title: "Period",
//       key: "period",
//       render: () => <Tag color="green">Month</Tag>,
//     },
//     {
//       title: "Monthly",
//       key: "monthly",
//       render: (_: any, record: any) => {
//         return <span>₹{Number(record.amount).toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Yearly",
//       key: "yearly",
//       render: (_: any, record: any) => {
//         const yearly = Number(record.amount) * 12;
//         return <span>₹{yearly.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         // If multiple files, show list
//         if (attachments.length > 1) {
//           return (
//             <Space direction="vertical" size={2} className="w-full">
//               {attachments.slice(0, 2).map((file: any, idx: number) => (
//                 <Button
//                   key={idx}
//                   type="link"
//                   size="small"
//                   icon={<FileOutlined />}
//                   onClick={() => handlePreview(file)}
//                   className="text-blue-600 hover:text-blue-800 block text-left"
//                   style={{ padding: 0, height: 'auto' }}
//                 >
//                   {file.fileName?.length > 20 
//                     ? file.fileName.substring(0, 20) + '...' 
//                     : file.fileName}
//                 </Button>
//               ))}
//               {attachments.length > 2 && (
//                 <Tag color="blue" className="text-xs">
//                   +{attachments.length - 2} more
//                 </Tag>
//               )}
//             </Space>
//           );
//         }

//         // Single file
//         const file = attachments[0];
//         return (
//           <Button
//             type="link"
//             size="small"
//             icon={<FileOutlined />}
//             onClick={() => handlePreview(file)}
//             className="text-blue-600 hover:text-blue-800"
//           >
//             {file.fileName?.length > 25 
//               ? file.fileName.substring(0, 25) + '...' 
//               : file.fileName}
//           </Button>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: () => <Tag color="success">ACTIVE</Tag>,
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: () => (
//         <Space size={4}>
//           <Button type="text" size="small" icon={<EditOutlined />} />
//           <Button type="text" size="small" danger icon={<DeleteOutlined />} />
//         </Space>
//       ),
//     },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <span className="text-2xl"></span>
//           <h2 className="text-xl font-semibold text-gray-900">
//             Team Reimbursements
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
//           >
//             Add configuration
//           </Button>
//         </Space>
//       </div>

//       {/* Summary Cards */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1 !text-sm">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>

//         <Tag color="green" className="!px-3 !py-1 !text-sm">
//           Total Items: {transformedData.length}
//         </Tag>

//         <Tag color="purple" className="!px-3 !py-1 !text-sm">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         size="small"
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showTotal: (total) => `Total ${total} items`,
//         }}
//         loading={loading}
//         rowKey="key"
//         bordered
//       />

//       {/* File Preview Modal */}
//       <Modal
//         title={selectedFile?.fileName || 'File Preview'}
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button 
//             key="download" 
//             type="primary" 
//             icon={<DownloadOutlined />} 
//             onClick={() => handleDownload(selectedFile)}
//           >
//             Download
//           </Button>,
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>
//         ]}
//         width={800}
//         bodyStyle={{ height: '70vh', padding: 0 }}
//       >
//         {selectedFile && (
//           <>
//             {selectedFile.fileType?.startsWith('image/') ? (
//               <img 
//                 src={selectedFile.fileUrl} 
//                 alt={selectedFile.fileName}
//                 style={{ width: '100%', height: '100%', objectFit: 'contain' }}
//               />
//             ) : selectedFile.fileType === 'application/pdf' ? (
//               <iframe
//                 src={`${selectedFile.fileUrl}#view=fitH`}
//                 style={{ width: '100%', height: '100%', border: 'none' }}
//                 title={selectedFile.fileName}
//               />
//             ) : (
//               <div className="flex flex-col items-center justify-center h-full bg-gray-50">
//                 <FileOutlined style={{ fontSize: 64, color: '#1890ff' }} />
//                 <p className="mt-4 text-gray-600">{selectedFile.fileName}</p>
//                 <p className="text-sm text-gray-400 mb-4">
//                   {(selectedFile.fileSize / 1024).toFixed(2)} KB
//                 </p>
//                 <Button type="primary" onClick={() => handleDownload(selectedFile)}>
//                   Download to View
//                 </Button>
//               </div>
//             )}
//           </>
//         )}
//       </Modal>
//     </div>
//   );
// }













// "use client";
// import { Button, Table, Tag, Input, Space } from "antd";
// import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined, EyeOutlined } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import dayjs from "dayjs";
// import { useMemo, useState, useEffect } from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   // Debug
//   useEffect(() => {
//     console.log('📦 API Response:', reimbursements);
//   }, [reimbursements]);

//   // Transform data
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           reimbursement.user?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [],
//           });
//         });
//       }
//     });

//     return rows;
//   }, [reimbursements]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // 🔴 Open file in new tab
//   const openFileInNewTab = (file: any) => {
//     window.open(file.fileUrl, '_blank', 'noopener,noreferrer');
//   };

//   // Columns
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
//       title: "Category Type",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Period",
//       key: "period",
//       render: () => <Tag color="green">Month</Tag>,
//     },
//     {
//       title: "Monthly",
//       key: "monthly",
//       render: (_: any, record: any) => (
//         <span>₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Yearly",
//       key: "yearly",
//       render: (_: any, record: any) => {
//         const yearly = Number(record.amount) * 12;
//         return <span>₹{yearly.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         // Multiple files
//         if (attachments.length > 1) {
//           return (
//             <Space direction="vertical" size={2} className="w-full">
//               {attachments.slice(0, 2).map((file: any, idx: number) => (
//                 <Button
//                   key={idx}
//                   type="link"
//                   size="small"
//                   icon={<FileOutlined />}
//                   onClick={() => openFileInNewTab(file)}
//                   className="text-blue-600 hover:text-blue-800 block text-left"
//                   style={{ padding: 0, height: 'auto' }}
//                 >
//                   {file.fileName?.length > 20 
//                     ? file.fileName.substring(0, 20) + '...' 
//                     : file.fileName}
//                 </Button>
//               ))}
//               {attachments.length > 2 && (
//                 <Tag color="blue" className="text-xs">
//                   +{attachments.length - 2} more
//                 </Tag>
//               )}
//             </Space>
//           );
//         }

//         // Single file
//         const file = attachments[0];
//         return (
//           <Button
//             type="link"
//             size="small"
//             icon={<EyeOutlined />}
//             onClick={() => openFileInNewTab(file)}
//             className="text-blue-600 hover:text-blue-800"
//           >
//             {file.fileName?.length > 25 
//               ? file.fileName.substring(0, 25) + '...' 
//               : file.fileName}
//           </Button>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: () => <Tag color="success">ACTIVE</Tag>,
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: () => (
//         <Space size={4}>
//           <Button type="text" size="small" icon={<EditOutlined />} />
//           <Button type="text" size="small" danger icon={<DeleteOutlined />} />
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
//             Team Reimbursements
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
//           >
//             Add configuration
//           </Button>
//         </Space>
//       </div>

//       {/* Summary Cards */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1 !text-sm">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>

//         <Tag color="green" className="!px-3 !py-1 !text-sm">
//           Total Items: {transformedData.length}
//         </Tag>

//         <Tag color="purple" className="!px-3 !py-1 !text-sm">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         size="small"
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showTotal: (total) => `Total ${total} items`,
//         }}
//         loading={loading}
//         rowKey="key"
//         bordered
//       />
//     </div>
//   );
// }pdf woek

// "use client";
// import { Button, Table, Tag, Input, Space } from "antd";
// import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined, EyeOutlined ,CheckOutlined, 
//   CloseOutlined,} from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import dayjs from "dayjs";
// import { useMemo, useState, useEffect } from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   // Debug
//   useEffect(() => {
//     console.log('📦 API Response:', reimbursements);
//   }, [reimbursements]);

//   // Transform data
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           reimbursement.user?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [],
//           });
//         });
//       }
//     });

//     return rows;
//   }, [reimbursements]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // 🔴 Function to get online viewer URL based on file type
//   const getViewerUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';

//     // Google Docs Viewer (works for PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX)
//     const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;

//     // Microsoft Office Online Viewer (for Office files)
//     const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;

//     // Check if it's an Office document
//     const isOfficeDoc = 
//       fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//       fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//       fileName.endsWith('.ppt') || fileName.endsWith('.pptx') ||
//       fileType.includes('document') || fileType.includes('spreadsheet') || fileType.includes('presentation');

//     // Check if it's PDF
//     const isPdf = fileName.endsWith('.pdf') || fileType === 'application/pdf';

//     // Check if it's image
//     const isImage = fileType?.startsWith('image/') || 
//                    fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//                    fileName.endsWith('.png') || fileName.endsWith('.gif') ||
//                    fileName.endsWith('.bmp') || fileName.endsWith('.webp');

//     if (isPdf) {
//       return file.fileUrl; // Browser PDF viewer
//     } else if (isImage) {
//       return file.fileUrl; // Browser image viewer
//     } else if (isOfficeDoc) {
//       // Try Office Viewer first, fallback to Google Viewer
//       return officeViewerUrl;
//     } else {
//       // For other files, use Google Viewer
//       return googleViewerUrl;
//     }
//   };

//   // 🔴 Open file in new tab with appropriate viewer
//   const openFileInNewTab = (file: any) => {
//     const viewerUrl = getViewerUrl(file);
//     window.open(viewerUrl, '_blank', 'noopener,noreferrer');
//   };

//   // Check file type for icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';

//     if (fileName.endsWith('.pdf')) return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return <FileOutlined className="text-orange-500" />;
//     if (file.fileType?.startsWith('image/')) return <FileOutlined className="text-purple-500" />;
//     return <FileOutlined />;
//   };

//   // Columns
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
//       title: "Category Type",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Period",
//       key: "period",
//       render: () => <Tag color="green">Month</Tag>,
//     },
//     {
//       title: "Monthly",
//       key: "monthly",
//       render: (_: any, record: any) => (
//         <span>₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Yearly",
//       key: "yearly",
//       render: (_: any, record: any) => {
//         const yearly = Number(record.amount) * 12;
//         return <span>₹{yearly.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         // Multiple files
//         if (attachments.length > 1) {
//           return (
//             <Space direction="vertical" size={2} className="w-full">
//               {attachments.slice(0, 2).map((file: any, idx: number) => (
//                 <Button
//                   key={idx}
//                   type="link"
//                   size="small"
//                   icon={getFileIcon(file)}
//                   onClick={() => openFileInNewTab(file)}
//                   className="text-blue-600 hover:text-blue-800 block text-left"
//                   style={{ padding: 0, height: 'auto' }}
//                   title={`Click to view ${file.fileName}`}
//                 >
//                   {file.fileName?.length > 20 
//                     ? file.fileName.substring(0, 20) + '...' 
//                     : file.fileName}
//                 </Button>
//               ))}
//               {attachments.length > 2 && (
//                 <Tag color="blue" className="text-xs">
//                   +{attachments.length - 2} more
//                 </Tag>
//               )}
//             </Space>
//           );
//         }

//         // Single file
//         const file = attachments[0];
//         const fileName = file.fileName || '';
//         const fileExt = fileName.split('.').pop()?.toUpperCase();

//         return (
//           <Button
//             type="link"
//             size="small"
//             icon={getFileIcon(file)}
//             onClick={() => openFileInNewTab(file)}
//             className="text-blue-600 hover:text-blue-800"
//             title={`Click to view ${file.fileName}`}
//           >
//             {fileName.length > 25 
//               ? fileName.substring(0, 25) + '...' 
//               : fileName}
//             {fileExt && <Tag className="ml-1 text-xs">{fileExt}</Tag>}
//           </Button>
//         );
//       },
//     },
//     // {
//     //   title: "Status",
//     //   key: "status",
//     //   render: () => <Tag color="success">pending</Tag>,
//     // },
//         {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => {
//         return <Tag color="gold">Pending </Tag>;
//       },
//     },
//     // {
//     //   title: "Action",
//     //   key: "action",
//     //   render: () => (
//     //     <Space size={4}>
//     //       <Button type="text" size="small" icon={<EditOutlined />} >Approve</Button>
//     //        <Button type="text" size="small" icon={<EditOutlined />} >reject</Button>
//     //     </Space>
//     //   ),
//     // },
//     {
//   title: "Action",
//   key: "action",
//   render: (_: any, record: any) => (
//     <Space size={4}>
//       <Button
//         type="text"
//         size="small"
//         icon={<CheckOutlined />}
//         className="text-green-600 hover:text-green-800 hover:bg-green-50"
//       >
//         Approve
//       </Button>

//       <Button
//         type="text"
//         size="small"
//         icon={<CloseOutlined />}
//         className="text-red-600 hover:text-red-800 hover:bg-red-50"
//         danger
//       >
//         Reject
//       </Button>
//     </Space>
//   ),
// },
//   ];

//   return (
//     <div className="p-6">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-4">
//         <div className="flex items-center gap-2">
//           <h2 className="text-xl font-semibold text-gray-900">
//             Team Reimbursements
//           </h2>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1 !text-sm">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>

//         <Tag color="green" className="!px-3 !py-1 !text-sm">
//           Total Items: {transformedData.length}
//         </Tag>

//         <Tag color="purple" className="!px-3 !py-1 !text-sm">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         size="small"
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showTotal: (total) => `Total ${total} items`,
//         }}
//         loading={loading}
//         rowKey="key"
//         bordered
//       />
//     </div>
//   );
// }//working but other pages 


// "use client";
// import { Button, Table, Tag, Input, Space, Modal } from "antd";
// import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined, EyeOutlined ,CheckOutlined, 
//   CloseOutlined,} from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import dayjs from "dayjs";
// import { useMemo, useState, useEffect } from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   // Debug
//   useEffect(() => {
//     console.log('📦 API Response:', reimbursements);
//   }, [reimbursements]);

//   // Transform data
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           reimbursement.user?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [],
//           });
//         });
//       }
//     });

//     return rows;
//   }, [reimbursements]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // 🔴 Handle file click - open modal
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // 🔴 Get iframe URL based on file type (NO PROXY)
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';

//     // For PDF files
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       // Use Google Docs Viewer for PDF (works without proxy)
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // For Office documents (Word, Excel, PowerPoint)
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       // Use Microsoft Office Online Viewer
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }

//     // For images, return direct URL
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }

//     // For text files
//     if (fileName.endsWith('.txt') || fileType === 'text/plain') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Default to Google Docs Viewer for any other file
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Check file type for icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';

//     if (fileName.endsWith('.pdf')) return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return <FileOutlined className="text-orange-500" />;
//     if (file.fileType?.startsWith('image/')) return <FileOutlined className="text-purple-500" />;
//     return <FileOutlined />;
//   };

//   // Columns
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
//       title: "Category Type",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Period",
//       key: "period",
//       render: () => <Tag color="green">Month</Tag>,
//     },
//     {
//       title: "Monthly",
//       key: "monthly",
//       render: (_: any, record: any) => (
//         <span>₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Yearly",
//       key: "yearly",
//       render: (_: any, record: any) => {
//         const yearly = Number(record.amount) * 12;
//         return <span>₹{yearly.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         // Multiple files
//         if (attachments.length > 1) {
//           return (
//             <Space direction="vertical" size={2} className="w-full">
//               {attachments.slice(0, 2).map((file: any, idx: number) => (
//                 <Button
//                   key={idx}
//                   type="link"
//                   size="small"
//                   icon={getFileIcon(file)}
//                   onClick={() => handleFileClick(file)}
//                   className="text-blue-600 hover:text-blue-800 block text-left"
//                   style={{ padding: 0, height: 'auto' }}
//                   title={`Click to view ${file.fileName}`}
//                 >
//                   {file.fileName?.length > 20 
//                     ? file.fileName.substring(0, 20) + '...' 
//                     : file.fileName}
//                 </Button>
//               ))}
//               {attachments.length > 2 && (
//                 <Tag color="blue" className="text-xs">
//                   +{attachments.length - 2} more
//                 </Tag>
//               )}
//             </Space>
//           );
//         }

//         // Single file
//         const file = attachments[0];
//         const fileName = file.fileName || '';
//         const fileExt = fileName.split('.').pop()?.toUpperCase();

//         return (
//           <Button
//             type="link"
//             size="small"
//             icon={getFileIcon(file)}
//             onClick={() => handleFileClick(file)}
//             className="text-blue-600 hover:text-blue-800"
//             title={`Click to view ${file.fileName}`}
//           >
//             {fileName.length > 25 
//               ? fileName.substring(0, 25) + '...' 
//               : fileName}
//             {fileExt && <Tag className="ml-1 text-xs">{fileExt}</Tag>}
//           </Button>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => {
//         return <Tag color="gold">Pending </Tag>;
//       },
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => (
//         <Space size={4}>
//           <Button
//             type="text"
//             size="small"
//             icon={<CheckOutlined />}
//             className="text-green-600 hover:text-green-800 hover:bg-green-50"
//           >
//             Approve
//           </Button>

//           <Button
//             type="text"
//             size="small"
//             icon={<CloseOutlined />}
//             className="text-red-600 hover:text-red-800 hover:bg-red-50"
//             danger
//           >
//             Reject
//           </Button>
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
//             Team Reimbursements
//           </h2>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1 !text-sm">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>

//         <Tag color="green" className="!px-3 !py-1 !text-sm">
//           Total Items: {transformedData.length}
//         </Tag>

//         <Tag color="purple" className="!px-3 !py-1 !text-sm">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         size="small"
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showTotal: (total) => `Total ${total} items`,
//         }}
//         loading={loading}
//         rowKey="key"
//         bordered
//       />

//       {/* 🔴 Iframe Preview Modal - All files open here */}
//       <Modal
//         title={previewFile?.fileName || 'Document Preview'}
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="download" onClick={() => window.open(previewFile?.fileUrl, '_blank')}>
//             Download
//           </Button>,
//           <Button key="close" type="primary" onClick={() => setPreviewVisible(false)}>
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
//     </div>
//   );
// }inside working



// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message } from "antd";
// import { ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, FileOutlined, EyeOutlined ,CheckOutlined, 
//   CloseOutlined, DownloadOutlined } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import dayjs from "dayjs";
// import { useMemo, useState, useEffect } from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   // Debug
//   useEffect(() => {
//     console.log('📦 API Response:', reimbursements);
//   }, [reimbursements]);

//   // Transform data
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           reimbursement.user?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
//           rows.push({
//             key: `${reimbursement.id}-${item.id || index}`,
//             reimbursementId: reimbursement.id,
//             employeeName: employeeName,
//             employeeCode: employeeCode,
//             category: item.category || 'N/A',
//             date: item.date || reimbursement.createdAt,
//             amount: item.amount || 0,
//             billNo: item.billNo || '—',
//             description: item.description || '—',
//             attachments: item.attachments || [],
//           });
//         });
//       }
//     });

//     return rows;
//   }, [reimbursements]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // 🔴 Handle file click - open modal
//   const handleFileClick = (file: any) => {
//     setPreviewFile(file);
//     setPreviewVisible(true);
//   };

//   // 🔴 Handle download
//   const handleDownload = (file: any) => {
//     // Create a temporary link and click it
//     const link = document.createElement('a');
//     link.href = file.fileUrl;
//     link.download = file.fileName || 'download';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);

//     message.success(`Downloading ${file.fileName}`);
//   };

//   // 🔴 Get iframe URL based on file type
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';

//     // For PDF files
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // For Office documents
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }

//     // For images
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) {
//       return file.fileUrl;
//     }

//     // For text files
//     if (fileName.endsWith('.txt') || fileType === 'text/plain') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Default
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Check file type for icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';

//     if (fileName.endsWith('.pdf')) return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return <FileOutlined className="text-green-500" />;
//     if (fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) return <FileOutlined className="text-orange-500" />;
//     if (file.fileType?.startsWith('image/')) return <FileOutlined className="text-purple-500" />;
//     return <FileOutlined />;
//   };

//   // Columns
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
//       title: "Category Type",
//       key: "category",
//       render: (_: any, record: any) => (
//         <Tag color="blue">{record.category}</Tag>
//       ),
//     },
//     {
//       title: "Period",
//       key: "period",
//       render: () => <Tag color="green">Month</Tag>,
//     },
//     {
//       title: "Monthly",
//       key: "monthly",
//       render: (_: any, record: any) => (
//         <span>₹{Number(record.amount).toFixed(2)}</span>
//       ),
//     },
//     {
//       title: "Yearly",
//       key: "yearly",
//       render: (_: any, record: any) => {
//         const yearly = Number(record.amount) * 12;
//         return <span>₹{yearly.toFixed(2)}</span>;
//       },
//     },
//     {
//       title: "Documents",
//       key: "documents",
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         // Multiple files
//         if (attachments.length > 1) {
//           return (
//             <Space direction="vertical" size={2} className="w-full">
//               {attachments.slice(0, 2).map((file: any, idx: number) => (
//                 <div key={idx} className="flex items-center gap-1">
//                   <Button
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 text-left"
//                     style={{ padding: 0, height: 'auto' }}
//                     title={`Click to view ${file.fileName}`}
//                   >
//                     {file.fileName?.length > 20 
//                       ? file.fileName.substring(0, 20) + '...' 
//                       : file.fileName}
//                   </Button>
//                   <Button
//                     type="text"
//                     size="small"
//                     icon={<DownloadOutlined />}
//                     onClick={() => handleDownload(file)}
//                     className="text-gray-500 hover:text-blue-600"
//                     title="Download"
//                   />
//                 </div>
//               ))}
//               {attachments.length > 2 && (
//                 <Tag color="blue" className="text-xs">
//                   +{attachments.length - 2} more
//                 </Tag>
//               )}
//             </Space>
//           );
//         }

//         // Single file
//         const file = attachments[0];
//         const fileName = file.fileName || '';
//         const fileExt = fileName.split('.').pop()?.toUpperCase();

//         return (
//           <Space>
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(file)}
//               onClick={() => handleFileClick(file)}
//               className="text-blue-600 hover:text-blue-800"
//               title={`Click to view ${file.fileName}`}
//             >
//               {fileName.length > 25 
//                 ? fileName.substring(0, 25) + '...' 
//                 : fileName}
//               {fileExt && <Tag className="ml-1 text-xs">{fileExt}</Tag>}
//             </Button>
//             <Button
//               type="text"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(file)}
//               className="text-gray-500 hover:text-blue-600"
//               title="Download"
//             />
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => {
//         return <Tag color="gold">Pending </Tag>;
//       },
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => (
//         <Space size={4}>
//           <Button
//             type="text"
//             size="small"
//             icon={<CheckOutlined />}
//             className="text-green-600 hover:text-green-800 hover:bg-green-50"
//           >
//             Approve
//           </Button>

//           <Button
//             type="text"
//             size="small"
//             icon={<CloseOutlined />}
//             className="text-red-600 hover:text-red-800 hover:bg-red-50"
//             danger
//           >
//             Reject
//           </Button>
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
//             Team Reimbursements
//           </h2>
//         </div>
//       </div>

//       {/* Summary Cards */}
//       {/* <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1 !text-sm">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>

//         <Tag color="green" className="!px-3 !py-1 !text-sm">
//           Total Items: {transformedData.length}
//         </Tag>

//         <Tag color="purple" className="!px-3 !py-1 !text-sm">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div> */}
//       <div className="flex gap-1 mb-3">
//   <Tag color="blue" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//     Total Reimbursements: {reimbursements.length}
//   </Tag>

//   <Tag color="green" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//     Total Items: {transformedData.length}
//   </Tag>

//   <Tag color="purple" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//     Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//   </Tag>
// </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         size="small"
//         pagination={{
//           pageSize: 10,
//           size: "small",
//           showTotal: (total) => `Total ${total} items`,
//         }}
//         loading={loading}
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
//     </div>
//   );
// }//all working









// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined 
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [rejectRemarks, setRejectRemarks] = useState("");

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   // Add approve/reject mutations
//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();

//   // Debug - log reimbursements
//   useEffect(() => {
//     console.log('📦 Reimbursements from API:', reimbursements);
//   }, [reimbursements]);

//   // Transform data
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
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
//             itemStatus: item.status || 'PENDING',
//           });
//         });
//       }
//     });

//     console.log('📊 Transformed data:', rows);
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

//   // Handle approve
//   const handleApprove = (record: any) => {
//     console.log("✅ Approve button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     // Call approve mutation
//     approveMutation.mutate(record.reimbursementItemId);
//   };

//   // Handle reject button click
//   const handleRejectClick = (record: any) => {
//     console.log("❌ Reject button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
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

//     console.log("📤 Confirming reject for:", selectedItem.reimbursementItemId, "remarks:", rejectRemarks);

//     rejectMutation.mutate({
//       id: selectedItem.reimbursementItemId,
//       remarks: rejectRemarks || "Rejected by manager"
//     });

//     // Close modal and reset
//     setRejectModalVisible(false);
//     setRejectRemarks("");
//     setSelectedItem(null);
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

//     if (fileName.endsWith('.pdf')) {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     return file.fileUrl;
//   };

//   // Get file icon
//   const getFileIcon = (file: any) => {
//     const fileName = file.fileName?.toLowerCase() || '';

//     if (fileName.endsWith('.pdf')) return <FileOutlined className="text-red-500" />;
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return <FileOutlined className="text-blue-500" />;
//     if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return <FileOutlined className="text-green-500" />;
//     return <FileOutlined />;
//   };

//   // Get status tag
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // Columns
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
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         return (
//           <Space>
//             {attachments.map((file: any, idx: number) => (
//               <Button
//                 key={idx}
//                 type="link"
//                 size="small"
//                 icon={getFileIcon(file)}
//                 onClick={() => handleFileClick(file)}
//                 className="text-blue-600"
//               >
//                 View
//               </Button>
//             ))}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => getStatusTag(record.itemStatus),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         // Only show actions for pending items
//         if (record.itemStatus !== 'PENDING') {
//           return <span className="text-gray-400">—</span>;
//         }

//         return (
//           <Space size={4}>
//             <Button
//               type="text"
//               size="small"
//               icon={<CheckOutlined />}
//               className="text-green-600 hover:text-green-800"
//               onClick={() => handleApprove(record)}
//               loading={approveMutation.isPending}
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
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
//             size="small"
//           >
//             Refresh
//           </Button>
//         </div>
//         <Input.Search
//           placeholder="Search..."
//           allowClear
//           onChange={(e) => setSearchText(e.target.value)}
//           style={{ width: 250 }}
//           size="middle"
//         />
//       </div>

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue">
//           Total: {reimbursements.length}
//         </Tag>
//         <Tag color="gold">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//       </div>

//       {/* Table */}
//       <Table
//         columns={columns}
//         dataSource={filteredData}
//         size="small"
//         pagination={{ pageSize: 10 }}
//         loading={loading}
//         rowKey="key"
//         bordered
//       />

//       {/* Preview Modal */}
//       <Modal
//         title={previewFile?.fileName}
//         open={previewVisible}
//         onCancel={() => setPreviewVisible(false)}
//         footer={[
//           <Button key="close" onClick={() => setPreviewVisible(false)}>
//             Close
//           </Button>,
//           <Button 
//             key="download" 
//             type="primary" 
//             icon={<DownloadOutlined />}
//             onClick={() => handleDownload(previewFile)}
//           >
//             Download
//           </Button>
//         ]}
//         width={800}
//         bodyStyle={{ height: '70vh' }}
//       >
//         {previewFile && (
//           <iframe
//             src={getIframeUrl(previewFile)}
//             style={{ width: '100%', height: '100%', border: 'none' }}
//             title={previewFile.fileName}
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
// }






// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined 
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";

// export default function ManagerReimbursementsPage() {
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false);
//   const [previewFile, setPreviewFile] = useState<any>(null);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [rejectRemarks, setRejectRemarks] = useState("");

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch 
//   } = useManagerApprovals();

//   // Add approve/reject mutations
//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();

//   // Debug - log reimbursements
//   useEffect(() => {
//     console.log('📦 Reimbursements from API:', reimbursements);
//   }, [reimbursements]);

//   // Transform data
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
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
//             itemStatus: item.status || 'PENDING',
//           });
//         });
//       }
//     });

//     console.log('📊 Transformed data:', rows);
//     return rows;
//   }, [reimbursements]);





//   // Transform data
//   useEffect(() => {
//   console.log('📦 Raw reimbursements:', reimbursements);

//   // Check all unique status values
//   const allStatuses = new Set();
//   reimbursements.forEach((reimbursement: any) => {
//     reimbursement.items?.forEach((item: any) => {
//       allStatuses.add(item.status);
//     });
//   });
//   console.log('🔍 Unique status values from API:', Array.from(allStatuses));
//   // Monitor item status changes


//   // Check transformed data statuses
//   const transformedStatuses = new Set(transformedData.map(item => item.itemStatus));
//   console.log('🔍 Transformed data statuses:', Array.from(transformedStatuses));
// }, [reimbursements, transformedData]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle approve with success/error
//   const handleApprove = (record: any) => {
//     console.log("✅ Approve button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     approveMutation.mutate(record.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         refetch();
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
//       }
//     });
//   };

//   // Handle reject button click
//   const handleRejectClick = (record: any) => {
//     console.log("❌ Reject button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     setSelectedItem(record);
//     setRejectModalVisible(true);
//   };

//   // Confirm reject with success/error
//   // const confirmReject = () => {
//   //   if (!selectedItem?.reimbursementItemId) {
//   //     message.error("No item selected");
//   //     return;
//   //   }

//   //   console.log("📤 Confirming reject for:", selectedItem.reimbursementItemId, "remarks:", rejectRemarks);

//   //   rejectMutation.mutate({
//   //     id: selectedItem.reimbursementItemId,
//   //     remarks: rejectRemarks || "Rejected by manager"
//   //   }, {
//   //     onSuccess: () => {
//   //       message.success("Item rejected successfully");
//   //       refetch();
//   //       setRejectModalVisible(false);
//   //       setRejectRemarks("");
//   //       setSelectedItem(null);
//   //     },
//   //     onError: (error: any) => {
//   //       message.error(error?.message || "Failed to reject item");
//   //     }
//   //   });
//   // };
// // In your confirmReject function
// const confirmReject = () => {
//   if (!selectedItem?.reimbursementItemId) {
//     message.error("No item selected");
//     return;
//   }

//   console.log("📤 Confirming reject for item:", {
//     itemId: selectedItem.reimbursementItemId,
//     currentStatus: selectedItem.itemStatus,
//     remarks: rejectRemarks
//   });

//   rejectMutation.mutate({
//     id: selectedItem.reimbursementItemId,
//     remarks: rejectRemarks || "Rejected by manager"
//   }, {
//     onSuccess: (data) => {
//       console.log("✅ Reject success for item:", selectedItem.reimbursementItemId, "Response:", data);
//       message.success("Item rejected successfully");

//       // Force refetch
//       refetch().then(() => {
//         console.log("📊 Data after refetch should show updated item status");
//       });

//       setRejectModalVisible(false);
//       setRejectRemarks("");
//       setSelectedItem(null);
//     },
//     onError: (error: any) => {
//       console.error("❌ Reject error:", error);
//       message.error(error?.message || "Failed to reject item");
//     }
//   });
// };
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

//   // Get iframe URL with enhanced file type support
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';

//     // PDF files
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Office documents
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }

//     // Images
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif') ||
//         fileName.endsWith('.bmp') || fileName.endsWith('.webp')) {
//       return file.fileUrl;
//     }

//     // Text files
//     if (fileName.endsWith('.txt') || fileType === 'text/plain') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Default to Google Docs Viewer
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon with enhanced icons
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
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) 
//       return <FileOutlined className="text-purple-500" />;

//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };
//   // Get status tag for ITEMS (not reimbursements)


//   // Columns with enhanced document display
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
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         // Multiple files
//         if (attachments.length > 1) {
//           return (
//             <Space direction="vertical" size={2} className="w-full">
//               {attachments.slice(0, 2).map((file: any, idx: number) => (
//                 <div key={idx} className="flex items-center gap-1">
//                   <Button
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 text-left"
//                     style={{ padding: 0, height: 'auto' }}
//                     title={`Click to view ${file.fileName}`}
//                   >
//                     {file.fileName?.length > 20 
//                       ? file.fileName.substring(0, 20) + '...' 
//                       : file.fileName}
//                   </Button>
//                   <Button
//                     type="text"
//                     size="small"
//                     icon={<DownloadOutlined />}
//                     onClick={() => handleDownload(file)}
//                     className="text-gray-500 hover:text-blue-600"
//                     title="Download"
//                   />
//                 </div>
//               ))}
//               {attachments.length > 2 && (
//                 <Tag color="blue" className="text-xs">
//                   +{attachments.length - 2} more
//                 </Tag>
//               )}
//             </Space>
//           );
//         }

//         // Single file
//         const file = attachments[0];
//         const fileName = file.fileName || '';
//         const fileExt = fileName.split('.').pop()?.toUpperCase();

//         return (
//           <Space>
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(file)}
//               onClick={() => handleFileClick(file)}
//               className="text-blue-600 hover:text-blue-800"
//               title={`Click to view ${file.fileName}`}
//             >
//               {fileName.length > 25 
//                 ? fileName.substring(0, 25) + '...' 
//                 : fileName}
//               {fileExt && <Tag className="ml-1 text-xs">{fileExt}</Tag>}
//             </Button>
//             <Button
//               type="text"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(file)}
//               className="text-gray-500 hover:text-blue-600"
//               title="Download"
//             />
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => getStatusTag(record.itemStatus),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         // Only show actions for pending items
//         if (record.itemStatus !== 'PENDING') {
//           return <span className="text-gray-400">—</span>;
//         }

//         return (
//           <Space size={4}>
//             <Button
//               type="text"
//               size="small"
//               icon={<CheckOutlined />}
//               className="text-green-600 hover:text-green-800"
//               onClick={() => handleApprove(record)}
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
//           <Button 
//             icon={<ReloadOutlined />} 
//             onClick={() => refetch()}
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

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-3 !py-1">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-3 !py-1">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="purple" className="!px-3 !py-1">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
//         </Tag>
//       </div>

//       {/* Table */}
//       {/* <Table
//         columns={columns}
//         dataSource={filteredData}
//         size="small"
//         pag={{ pageSize: 10, showTotal: (total) => `Total ${total} items` }}
//         loading={loading}
//         rowKey="key"
//         bordered
//       /> */}
//   <Table
//         columns={columns}
//         dataSource={filteredData}
//         loading={loading}
//         pagination={{ 
//           pageSize: 10,
//           showTotal: (total: number) => `Total ${total} items`  // FIXED: Added type
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
// }//statys work agaal






// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined 
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
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

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   // Add approve/reject mutations
//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();

//   // Debug - log reimbursements
//   useEffect(() => {
//     console.log('📦 Reimbursements from API:', reimbursements);
//   }, [reimbursements]);

//   // Transform data
//   const transformedData = useMemo(() => {
//     const rows: any[] = [];

//     reimbursements.forEach((reimbursement: any) => {
//       const employeeName = reimbursement.employeeName || 
//                           reimbursement.createdBy?.name || 
//                           'N/A';
//       const employeeCode = reimbursement.employeeCode || 
//                           reimbursement.createdBy?.employee?.employee_code || 
//                           'N/A';

//       if (reimbursement.items && reimbursement.items.length > 0) {
//         reimbursement.items.forEach((item: any, index: number) => {
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
//             itemStatus: item.status || 'PENDING',
//             // itemStatus: item.approvers?.[0]?.status || 'PENDING'
//             // itemStatus: item.approvers?.[0]?.status || item.status || 'PENDING'
//           });
//         });
//       }
//     });

//     console.log('📊 Transformed data:', rows);
//     return rows;
//   }, [reimbursements]);




//   console.log("API items with approvers:", reimbursements.map(r => r.items));

//   // Monitor status changes
//   useEffect(() => {
//     console.log('📦 Raw reimbursements:', reimbursements);

//     // Check all unique status values
//     const allStatuses = new Set();
//     reimbursements.forEach((reimbursement: any) => {
//       reimbursement.items?.forEach((item: any) => {
//         allStatuses.add(item.status);
//       });
//     });
//     console.log('🔍 Unique status values from API:', Array.from(allStatuses));
//     console.log("📌 After action reimbursements:", reimbursements);

//     // Check transformed data statuses
//     const transformedStatuses = new Set(transformedData.map(item => item.itemStatus));
//     console.log('🔍 Transformed data statuses:', Array.from(transformedStatuses));
//   }, [reimbursements, transformedData]);

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle approve with success/error
//   const handleApprove = (record: any) => {
//     console.log("✅ Approve button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     approveMutation.mutate(record.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         // Force refetch after a short delay
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
//       }
//     });
//   };

//   // Handle reject button click
//   const handleRejectClick = (record: any) => {
//     console.log("❌ Reject button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     setSelectedItem(record);
//     setRejectModalVisible(true);
//   };

//   // Confirm reject with success/error
//   const confirmReject = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }

//     console.log("📤 Confirming reject for item:", {
//       itemId: selectedItem.reimbursementItemId,
//       currentStatus: selectedItem.itemStatus,
//       remarks: rejectRemarks
//     });

//     rejectMutation.mutate({
//       id: selectedItem.reimbursementItemId,
//       remarks: rejectRemarks || "Rejected by manager"
//     }, {
//       onSuccess: (data) => {
//         console.log("✅ Reject success for item:", selectedItem.reimbursementItemId, "Response:", data);
//         message.success("Item rejected successfully");

//         // Close modal first
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);

//         // Force refetch after a short delay
//         setTimeout(() => {
//           console.log("🔄 Forcing refetch...");
//           refetch().then(() => {
//             console.log("📊 Refetch completed");
//           });
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 500);
//       },
//       onError: (error: any) => {
//         console.error("❌ Reject error:", error);
//         message.error(error?.message || "Failed to reject item");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//       }
//     });
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

//   // Get iframe URL with enhanced file type support
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';

//     // PDF files
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Office documents
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }

//     // Images
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif') ||
//         fileName.endsWith('.bmp') || fileName.endsWith('.webp')) {
//       return file.fileUrl;
//     }

//     // Text files
//     if (fileName.endsWith('.txt') || fileType === 'text/plain') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Default to Google Docs Viewer
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon with enhanced icons
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
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) 
//       return <FileOutlined className="text-purple-500" />;

//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // Columns with enhanced document display
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
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         // Multiple files
//         if (attachments.length > 1) {
//           return (
//             <Space direction="vertical" size={2} className="w-full">
//               {attachments.slice(0, 2).map((file: any, idx: number) => (
//                 <div key={idx} className="flex items-center gap-1">
//                   <Button
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 text-left"
//                     style={{ padding: 0, height: 'auto' }}
//                     title={`Click to view ${file.fileName}`}
//                   >
//                     {file.fileName?.length > 20 
//                       ? file.fileName.substring(0, 20) + '...' 
//                       : file.fileName}
//                   </Button>
//                   <Button
//                     type="text"
//                     size="small"
//                     icon={<DownloadOutlined />}
//                     onClick={() => handleDownload(file)}
//                     className="text-gray-500 hover:text-blue-600"
//                     title="Download"
//                   />
//                 </div>
//               ))}
//               {attachments.length > 2 && (
//                 <Tag color="blue" className="text-xs">
//                   +{attachments.length - 2} more
//                 </Tag>
//               )}
//             </Space>
//           );
//         }

//         // Single file
//         const file = attachments[0];
//         const fileName = file.fileName || '';
//         const fileExt = fileName.split('.').pop()?.toUpperCase();

//         return (
//           <Space>
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(file)}
//               onClick={() => handleFileClick(file)}
//               className="text-blue-600 hover:text-blue-800"
//               title={`Click to view ${file.fileName}`}
//             >
//               {fileName.length > 25 
//                 ? fileName.substring(0, 25) + '...' 
//                 : fileName}
//               {fileExt && <Tag className="ml-1 text-xs">{fileExt}</Tag>}
//             </Button>
//             <Button
//               type="text"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(file)}
//               className="text-gray-500 hover:text-blue-600"
//               title="Download"
//             />
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => getStatusTag(record.itemStatus),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         // Only show actions for pending items
//         if (record.itemStatus !== 'PENDING') {
//           return <span className="text-gray-400">—</span>;
//         }

//         return (
//           <Space size={4}>
//             <Button
//               type="text"
//               size="small"
//               icon={<CheckOutlined />}
//               className="text-green-600 hover:text-green-800"
//               onClick={() => handleApprove(record)}
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

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-3 !py-1">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-3 !py-1">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="purple" className="!px-3 !py-1">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
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
// }status work agala





// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined 
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
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

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   // Add approve/reject mutations
//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();

//   // Debug - log reimbursements
//   // 🔴 TRANSFORM DATA - Use approverStatus from API (ReimbursementItemApprover table)
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

//           // 🔴 ONLY THIS LINE CHANGED - Use approverStatus from ReimbursementItemApprover table
//           // If backend sends approverStatus, use it. Otherwise fallback to item.status
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
//             // 🔴 This now gets status from ReimbursementItemApprover table via backend
//             itemStatus: status,
//           });
//         });
//       }
//     });

//     console.log('📊 Transformed data with approver status:', 
//       rows.map(r => ({ 
//         itemId: r.reimbursementItemId, 
//         status: r.itemStatus
//       }))
//     );

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

//   // Handle approve with success/error
//   const handleApprove = (record: any) => {
//     console.log("✅ Approve button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     approveMutation.mutate(record.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         // Force refetch after a short delay
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
//       }
//     });
//   };

//   // Handle reject button click
//   const handleRejectClick = (record: any) => {
//     console.log("❌ Reject button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     setSelectedItem(record);
//     setRejectModalVisible(true);
//   };

//   // Confirm reject with success/error
//   const confirmReject = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }

//     console.log("📤 Confirming reject for item:", {
//       itemId: selectedItem.reimbursementItemId,
//       currentStatus: selectedItem.itemStatus,
//       remarks: rejectRemarks
//     });

//     rejectMutation.mutate({
//       id: selectedItem.reimbursementItemId,
//       remarks: rejectRemarks || "Rejected by manager"
//     }, {
//       onSuccess: (data) => {
//         console.log("✅ Reject success for item:", selectedItem.reimbursementItemId, "Response:", data);
//         message.success("Item rejected successfully");

//         // Close modal first
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);

//         // Force refetch after a short delay
//         setTimeout(() => {
//           console.log("🔄 Forcing refetch...");
//           refetch().then(() => {
//             console.log("📊 Refetch completed");
//           });
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 500);
//       },
//       onError: (error: any) => {
//         console.error("❌ Reject error:", error);
//         message.error(error?.message || "Failed to reject item");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//       }
//     });
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

//   // Get iframe URL with enhanced file type support
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';

//     // PDF files
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Office documents
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }

//     // Images
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif') ||
//         fileName.endsWith('.bmp') || fileName.endsWith('.webp')) {
//       return file.fileUrl;
//     }

//     // Text files
//     if (fileName.endsWith('.txt') || fileType === 'text/plain') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Default to Google Docs Viewer
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon with enhanced icons
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
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) 
//       return <FileOutlined className="text-purple-500" />;

//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // Columns with enhanced document display
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
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

//         if (attachments.length === 0) {
//           return <span className="text-gray-400">—</span>;
//         }

//         // Multiple files
//         if (attachments.length > 1) {
//           return (
//             <Space direction="vertical" size={2} className="w-full">
//               {attachments.slice(0, 2).map((file: any, idx: number) => (
//                 <div key={idx} className="flex items-center gap-1">
//                   <Button
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 text-left"
//                     style={{ padding: 0, height: 'auto' }}
//                     title={`Click to view ${file.fileName}`}
//                   >
//                     {file.fileName?.length > 20 
//                       ? file.fileName.substring(0, 20) + '...' 
//                       : file.fileName}
//                   </Button>
//                   <Button
//                     type="text"
//                     size="small"
//                     icon={<DownloadOutlined />}
//                     onClick={() => handleDownload(file)}
//                     className="text-gray-500 hover:text-blue-600"
//                     title="Download"
//                   />
//                 </div>
//               ))}
//               {attachments.length > 2 && (
//                 <Tag color="blue" className="text-xs">
//                   +{attachments.length - 2} more
//                 </Tag>
//               )}
//             </Space>
//           );
//         }

//         // Single file
//         const file = attachments[0];
//         const fileName = file.fileName || '';
//         const fileExt = fileName.split('.').pop()?.toUpperCase();

//         return (
//           <Space>
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(file)}
//               onClick={() => handleFileClick(file)}
//               className="text-blue-600 hover:text-blue-800"
//               title={`Click to view ${file.fileName}`}
//             >
//               {fileName.length > 25 
//                 ? fileName.substring(0, 25) + '...' 
//                 : fileName}
//               {fileExt && <Tag className="ml-1 text-xs">{fileExt}</Tag>}
//             </Button>
//             <Button
//               type="text"
//               size="small"
//               icon={<DownloadOutlined />}
//               onClick={() => handleDownload(file)}
//               className="text-gray-500 hover:text-blue-600"
//               title="Download"
//             />
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => getStatusTag(record.itemStatus),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         // Only show actions for pending items
//         if (record.itemStatus !== 'PENDING') {
//           return <span className="text-gray-400">—</span>;
//         }

//         return (
//           <Space size={4}>
//             <Button
//               type="text"
//               size="small"
//               icon={<CheckOutlined />}
//               className="text-green-600 hover:text-green-800"
//               onClick={() => handleApprove(record)}
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

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-3 !py-1">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-3 !py-1">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="purple" className="!px-3 !py-1">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
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
// }all workking ui changes 


// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message } from "antd";
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   EyeOutlined 
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
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

//   const { 
//     data: reimbursements = [], 
//     isLoading: loading,
//     refetch,
//     isRefetching 
//   } = useManagerApprovals();

//   // Add approve/reject mutations
//   const approveMutation = useApproveItem();
//   const rejectMutation = useRejectItem();

//   // Debug - log reimbursements
//   // 🔴 TRANSFORM DATA - Use approverStatus from API (ReimbursementItemApprover table)
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

//           // 🔴 ONLY THIS LINE CHANGED - Use approverStatus from ReimbursementItemApprover table
//           // If backend sends approverStatus, use it. Otherwise fallback to item.status
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
//             // 🔴 This now gets status from ReimbursementItemApprover table via backend
//             itemStatus: status,
//           });
//         });
//       }
//     });

//     console.log('📊 Transformed data with approver status:', 
//       rows.map(r => ({ 
//         itemId: r.reimbursementItemId, 
//         status: r.itemStatus
//       }))
//     );

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

//   // Handle approve with success/error
//   const handleApprove = (record: any) => {
//     console.log("✅ Approve button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     approveMutation.mutate(record.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         // Force refetch after a short delay
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
//       }
//     });
//   };

//   // Handle reject button click
//   const handleRejectClick = (record: any) => {
//     console.log("❌ Reject button clicked for:", record);

//     if (!record.reimbursementItemId) {
//       console.error("❌ No reimbursementItemId found:", record);
//       message.error("Invalid item ID");
//       return;
//     }

//     setSelectedItem(record);
//     setRejectModalVisible(true);
//   };

//   // Confirm reject with success/error
//   const confirmReject = () => {
//     if (!selectedItem?.reimbursementItemId) {
//       message.error("No item selected");
//       return;
//     }

//     console.log("📤 Confirming reject for item:", {
//       itemId: selectedItem.reimbursementItemId,
//       currentStatus: selectedItem.itemStatus,
//       remarks: rejectRemarks
//     });

//     rejectMutation.mutate({
//       id: selectedItem.reimbursementItemId,
//       remarks: rejectRemarks || "Rejected by manager"
//     }, {
//       onSuccess: (data) => {
//         console.log("✅ Reject success for item:", selectedItem.reimbursementItemId, "Response:", data);
//         message.success("Item rejected successfully");

//         // Close modal first
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);

//         // Force refetch after a short delay
//         setTimeout(() => {
//           console.log("🔄 Forcing refetch...");
//           refetch().then(() => {
//             console.log("📊 Refetch completed");
//           });
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 500);
//       },
//       onError: (error: any) => {
//         console.error("❌ Reject error:", error);
//         message.error(error?.message || "Failed to reject item");
//         setRejectModalVisible(false);
//         setRejectRemarks("");
//         setSelectedItem(null);
//       }
//     });
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

//   // Get iframe URL with enhanced file type support
//   const getIframeUrl = (file: any): string => {
//     const fileName = file.fileName?.toLowerCase() || '';
//     const fileType = file.fileType || '';

//     // PDF files
//     if (fileName.endsWith('.pdf') || fileType === 'application/pdf') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Office documents
//     if (fileName.endsWith('.doc') || fileName.endsWith('.docx') ||
//         fileName.endsWith('.xls') || fileName.endsWith('.xlsx') ||
//         fileName.endsWith('.ppt') || fileName.endsWith('.pptx')) {
//       return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(file.fileUrl)}`;
//     }

//     // Images
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif') ||
//         fileName.endsWith('.bmp') || fileName.endsWith('.webp')) {
//       return file.fileUrl;
//     }

//     // Text files
//     if (fileName.endsWith('.txt') || fileType === 'text/plain') {
//       return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//     }

//     // Default to Google Docs Viewer
//     return `https://docs.google.com/viewer?url=${encodeURIComponent(file.fileUrl)}&embedded=true`;
//   };

//   // Get file icon with enhanced icons
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
//     if (fileType?.startsWith('image/') || 
//         fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
//         fileName.endsWith('.png') || fileName.endsWith('.gif')) 
//       return <FileOutlined className="text-purple-500" />;

//     return <FileOutlined className="text-gray-500" />;
//   };

//   // Get status tag
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // Columns with UI changes only
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
//       render: (_: any, record: any) => {
//         const attachments = record.attachments || [];

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
//               title={`Click to view ${file.fileName}`}
//             >
//               {fileName.length > 25 
//                 ? fileName.substring(0, 25) + '...' 
//                 : fileName}
//             </Button>
//           );
//         }

//         // Multiple files - Show first file + "more" button
//         const firstFile = attachments[0];
//         const remainingCount = attachments.length - 1;
//         const fileName = firstFile.fileName || '';

//         return (
//           <Space>
//             {/* First file - click to view */}
//             <Button
//               type="link"
//               size="small"
//               icon={getFileIcon(firstFile)}
//               onClick={() => handleFileClick(firstFile)}
//               className="text-blue-600 hover:text-blue-800 p-0 h-auto"
//               title={`Click to view ${firstFile.fileName}`}
//             >
//               {fileName.length > 20 
//                 ? fileName.substring(0, 20) + '...' 
//                 : fileName}
//             </Button>

//             {/* More button - opens SAME file when clicked */}
//             {remainingCount > 0 && (
//               <Button
//                 type="link"
//                 size="small"
//                 onClick={() => handleFileClick(firstFile)} // Opens the SAME file
//                 className="text-blue-600 hover:text-blue-800 p-0 h-auto font-semibold"
//                 icon={<EyeOutlined />}
//               >
//                 +{remainingCount} more
//               </Button>
//             )}
//           </Space>
//         );
//       },
//     },
//     {
//       title: "Status",
//       key: "status",
//       render: (_: any, record: any) => getStatusTag(record.itemStatus),
//     },
//     {
//       title: "Action",
//       key: "action",
//       render: (_: any, record: any) => {
//         const isPending = record.itemStatus === 'PENDING';
//         const isApproved = record.itemStatus === 'APPROVED';
//         const isRejected = record.itemStatus === 'REJECTED';

//         // If approved or rejected, disable buttons but still show them
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

//         // Pending items - normal buttons (not disabled)
//         return (
//           <Space size={4}>
//             <Button
//               type="text"
//               size="small"
//               icon={<CheckOutlined />}
//               className="text-green-600 hover:text-green-800"
//               onClick={() => handleApprove(record)}
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

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-3 !py-1">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-3 !py-1">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-3 !py-1">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="purple" className="!px-3 !py-1">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
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
// }



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
//   UpOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
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

//   // NEW STATE for expanded items
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

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle approve
//   const handleApprove = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }

//     approveMutation.mutate(record.reimbursementItemId, {
//       onSuccess: () => {
//         message.success("Item approved successfully");
//         setTimeout(() => {
//           refetch();
//           queryClient.invalidateQueries({ queryKey: ["manager-approvals"] });
//         }, 100);
//       },
//       onError: (error: any) => {
//         message.error(error?.message || "Failed to approve item");
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

//   // NEW: Toggle expand/collapse
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
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // Columns with EXPANDABLE documents
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

//         // Multiple files
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

//             {/* Expanded files list */}
//             {isExpanded && (
//               <div className="pl-2 mt-1 space-y-1 border-l-2 border-gray-200">
//                 {remainingFiles.map((file: any, index: number) => (
//                   <Button
//                     key={index}
//                     type="link"
//                     size="small"
//                     icon={getFileIcon(file)}
//                     onClick={() => handleFileClick(file)}
//                     className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left block"
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
//               onClick={() => handleApprove(record)}
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

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
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
// }only approve modal change 



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
//   UpOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
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

//   // NEW STATE for approve confirmation modal
//   const [approveModalVisible, setApproveModalVisible] = useState(false);
//   const [itemToApprove, setItemToApprove] = useState<any>(null);

//   // NEW STATE for expanded items
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

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // 🔴 NEW: Handle approve button click - show modal
//   const handleApproveClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }

//     setItemToApprove(record);
//     setApproveModalVisible(true);
//   };

//   // 🔴 NEW: Confirm approve - actual approve pannum
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

//   // Toggle expand/collapse
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
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // Columns with EXPANDABLE documents
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
//         <span>₹{Number(record.amount).toFixed(2)}</span>
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
//               onClick={() => handleApproveClick(record)} // 🔴 Changed to handleApproveClick
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

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
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
//       />

//       {/* 🔴 NEW: Approve Confirmation Modal */}
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
//           {/* {itemToApprove && (
//             <div className="mt-3 p-3 bg-gray-50 rounded">
//               <p><strong>Employee:</strong> {itemToApprove.employeeName}</p>
//               <p><strong>Category:</strong> {itemToApprove.category}</p>
//               <p><strong>Amount:</strong> ₹{Number(itemToApprove.amount).toFixed(2)}</p>
//               <p><strong>Bill No:</strong> {itemToApprove.billNo}</p>
//             </div>
//           )} */}
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
// }working


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
//   UpOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
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

//   // NEW STATE for approve confirmation modal
//   const [approveModalVisible, setApproveModalVisible] = useState(false);
//   const [itemToApprove, setItemToApprove] = useState<any>(null);

//   // NEW STATE for expanded items (for multiple files)
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

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // 🔴 NEW: Handle approve button click - show modal
//   const handleApproveClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }

//     setItemToApprove(record);
//     setApproveModalVisible(true);
//   };

//   // 🔴 NEW: Confirm approve - actual approve pannum
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
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // 🔴 UPDATED: Documents column with one-line display and expandable
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

//       {/* Summary */}
//       <div className="flex gap-2 mb-4">
//         <Tag color="blue" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Reimbursements: {reimbursements.length}
//         </Tag>
//         <Tag color="green" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Items: {transformedData.length}
//         </Tag>
//         <Tag color="gold" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Pending: {transformedData.filter(item => item.itemStatus === 'PENDING').length}
//         </Tag>
//         <Tag color="purple" className="!px-2 !py-0.5 !text-[10px] !leading-4 !h-5">
//           Total Amount: ₹{transformedData.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString("en-IN")}
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
// }



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
//   UpOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
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

//   // NEW STATE for approve confirmation modal
//   const [approveModalVisible, setApproveModalVisible] = useState(false);
//   const [itemToApprove, setItemToApprove] = useState<any>(null);

//   // NEW STATE for expanded items (for multiple files)
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

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // 🔴 NEW: Handle approve button click - show modal
//   const handleApproveClick = (record: any) => {
//     if (!record.reimbursementItemId) {
//       message.error("Invalid item ID");
//       return;
//     }

//     setItemToApprove(record);
//     setApproveModalVisible(true);
//   };

//   // 🔴 NEW: Confirm approve - actual approve pannum
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
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // 🔴 UPDATED: Documents column with one-line display and expandable
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

//       {/* Summary - Updated to match employee page style */}
//       <div className="flex gap-1.5 mb-3">
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
// }modal to drawer 



// "use client";
// import { Button, Table, Tag, Input, Space, Modal, message, Drawer } from "antd"; // Added Drawer import
// import { 
//   ReloadOutlined, 
//   CheckOutlined, 
//   CloseOutlined, 
//   DownloadOutlined,
//   FileOutlined,
//   EyeOutlined,
//   DownOutlined,
//   UpOutlined
// } from "@ant-design/icons";
// import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
// import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
// import { useMemo, useState, useEffect } from "react";
// import { useQueryClient } from "@tanstack/react-query";

// export default function ManagerReimbursementsPage() {
//   const queryClient = useQueryClient();
//   const [searchText, setSearchText] = useState("");
//   const [previewVisible, setPreviewVisible] = useState(false); // This will now control Drawer
//   const [previewFile, setPreviewFile] = useState<any>(null);
//   const [rejectModalVisible, setRejectModalVisible] = useState(false);
//   const [selectedItem, setSelectedItem] = useState<any>(null);
//   const [rejectRemarks, setRejectRemarks] = useState("");

//   // NEW STATE for approve confirmation modal
//   const [approveModalVisible, setApproveModalVisible] = useState(false);
//   const [itemToApprove, setItemToApprove] = useState<any>(null);

//   // NEW STATE for expanded items (for multiple files)
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

//   // Filter data
//   const filteredData = useMemo(() => {
//     if (!searchText) return transformedData;
//     return transformedData.filter(item => 
//       item.employeeName?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
//       item.billNo?.toLowerCase().includes(searchText.toLowerCase())
//     );
//   }, [transformedData, searchText]);

//   // Handle approve button click - show modal
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
//   const getStatusTag = (status: string) => {
//     switch(status?.toUpperCase()) {
//       case 'APPROVED':
//         return <Tag color="green">Approved</Tag>;
//       case 'REJECTED':
//         return <Tag color="red">Rejected</Tag>;
//       default:
//         return <Tag color="gold">Pending</Tag>;
//     }
//   };

//   // Documents column with one-line display and expandable
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

//       {/* Summary */}
//       <div className="flex gap-1.5 mb-3">
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

//       {/* 🔴 CHANGED: Preview Drawer instead of Modal */}
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
// }perfectly fyn only change parent child 



"use client";
import { Button, Table, Tag, Input, Space, Modal, message, Drawer } from "antd";
import {
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  FileOutlined,
  EyeOutlined,
  DownOutlined,
  UpOutlined
} from "@ant-design/icons";
import { useManagerApprovals } from "@/hooks/usereimbursementcreate";
import { useApproveItem, useRejectItem } from "@/hooks/usereimbursementcreate";
import { useMemo, useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

export default function ManagerReimbursementsPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");

  // Approve confirmation modal
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [itemToApprove, setItemToApprove] = useState<any>(null);

  // Expanded rows for parent-child (like employee table)
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const {
    data: reimbursements = [],
    isLoading: loading,
    refetch,
    isRefetching
  } = useManagerApprovals();

  const approveMutation = useApproveItem();
  const rejectMutation = useRejectItem();

  console.log('📊 Raw manager data:', reimbursements);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchText) return reimbursements;

    return reimbursements.filter((record: any) => {
      const employeeName = record.employeeName ||
        record.createdBy?.name ||
        'N/A';

      const parentMatch = record.status?.toLowerCase().includes(searchText.toLowerCase()) ||
        record.totalAmount?.toString().includes(searchText) ||
        employeeName?.toLowerCase().includes(searchText.toLowerCase());

      const childMatch = record.items?.some((item: any) =>
        item.category?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.billNo?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchText.toLowerCase())
      );

      return parentMatch || childMatch;
    });
  }, [reimbursements, searchText]);

  // Handle approve button click
  const handleApproveClick = (record: any, item: any) => {
    if (!item.id) {
      message.error("Invalid item ID");
      return;
    }

    setItemToApprove({
      ...item,
      reimbursementId: record.id,
      employeeName: record.employeeName || record.createdBy?.name || 'N/A',
      employeeCode: record.employeeCode || record.createdBy?.employee?.employee_code || 'N/A',
    });
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
        refetch();
      },
      onError: (error: any) => {
        message.error(error?.message || "Failed to approve item");
        setApproveModalVisible(false);
        setItemToApprove(null);
      }
    });
  };

  // Handle reject button click
  const handleRejectClick = (record: any, item: any) => {
    if (!item.id) {
      message.error("Invalid item ID");
      return;
    }

    setSelectedItem({
      ...item,
      reimbursementId: record.id,
      employeeName: record.employeeName || record.createdBy?.name || 'N/A',
    });
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
        refetch();
      },
      onError: (error: any) => {
        message.error(error?.message || "Failed to reject item");
        setRejectModalVisible(false);
        setRejectRemarks("");
        setSelectedItem(null);
      }
    });
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

  // Get status tag
  const getStatusTag = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <Tag color="green">Approved</Tag>;
      case 'REJECTED':
        return <Tag color="red">Rejected</Tag>;
      case 'PENDING':
      case 'SUBMITTED':
        return <Tag color="gold">Pending</Tag>;
      default:
        return <Tag color="default">{status || 'Unknown'}</Tag>;
    }
  };

  // 🔴 NEW: Expanded row renderer for child items
  const expandedRowRender = (record: any) => {
    const items = record.items || [];

    if (items.length === 0) {
      return <div className="text-gray-400 py-4 text-center">No items found</div>;
    }

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
        width: 150,
        ellipsis: true,
      },
      {
        title: "Status",
        key: "status",
        width: 100,
        render: (_: any, item: any) => getStatusTag(item.status || item.approverStatus),
      },
      {
        title: "Documents",
        key: "documents",
        width: 200,
        render: (_: any, item: any) => {
          const attachments = item.attachments || [];

          if (attachments.length === 0) {
            return <span className="text-gray-400">—</span>;
          }

          if (attachments.length === 1) {
            const file = attachments[0];
            return (
              <Button
                type="link"
                size="small"
                icon={getFileIcon(file)}
                onClick={() => handleFileClick(file)}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                {file.fileName?.length > 20 ? file.fileName.substring(0, 20) + '...' : file.fileName}
              </Button>
            );
          }

          return (
            <div className="flex flex-col gap-1">
              {attachments.map((file: any, idx: number) => (
                <Button
                  key={idx}
                  type="link"
                  size="small"
                  icon={getFileIcon(file)}
                  onClick={() => handleFileClick(file)}
                  className="text-blue-600 hover:text-blue-800 p-0 h-auto text-left"
                >
                  {file.fileName?.length > 20 ? file.fileName.substring(0, 20) + '...' : file.fileName}
                </Button>
              ))}
            </div>
          );
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 160,
        render: (_: any, item: any) => {
          const itemStatus = item.status || item.approverStatus || 'PENDING';
          const isPending = itemStatus === 'PENDING' || itemStatus === 'SUBMITTED';
          const isApproved = itemStatus === 'APPROVED';
          const isRejected = itemStatus === 'REJECTED';

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
                onClick={() => handleApproveClick(record, item)}
                loading={approveMutation.isPending && approveMutation.variables === item.id}
              >
                Approve
              </Button>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                className="text-red-600 hover:text-red-800"
                onClick={() => handleRejectClick(record, item)}
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
        <h4 className="text-sm font-medium text-gray-700 mb-2">Reimbursement Items:</h4>
        <Table
          columns={childColumns}
          dataSource={items}
          rowKey={(item) => item.id || `item-${Math.random()}`}
          pagination={false}
          size="small"
          bordered={false}
          className="child-table"
        />
      </div>
    );
  };

  // Parent table columns
  const columns = [
    {
      title: "Employee",
      key: "employee",
      width: 200,
      render: (_: any, record: any) => (
        <div>
          <div className="font-medium">{record.employeeName || record.createdBy?.name || 'N/A'}</div>
          <div className="text-xs text-gray-500">{record.employeeCode || record.createdBy?.employee?.employee_code || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: "Category",
      key: "category",
      width: 120,
      render: (_: any, record: any) => {
        const firstItem = record.items?.[0];
        return firstItem ? <Tag color="blue">{firstItem.category}</Tag> : '—';
      },
    },
    {
      title: "Date",
      key: "date",
      width: 120,
      render: (_: any, record: any) => {
        const firstItem = record.items?.[0];
        return firstItem ? dayjs(firstItem.date).format('DD MMM YYYY') : '—';
      },
    },
    {
      title: "Amount",
      key: "amount",
      width: 100,
      render: (_: any, record: any) => {
        const firstItem = record.items?.[0];
        const amount = firstItem ? Number(firstItem.amount) : 0;
        return <span className="font-semibold">₹{amount.toFixed(2)}</span>;
      },
    },
    {
      title: "Bill No",
      key: "billNo",
      width: 100,
      render: (_: any, record: any) => {
        const firstItem = record.items?.[0];
        return firstItem?.billNo || '—';
      },
    },
    {
      title: "Description",
      key: "description",
      width: 150,
      render: (_: any, record: any) => {
        const firstItem = record.items?.[0];
        const itemCount = record.items?.length || 0;

        return (
          <div>
            <div>{firstItem?.description || '—'}</div>
            {itemCount > 1 && (
              <div className="text-xs text-gray-500 mt-1">
                +{itemCount - 1} more {itemCount - 1 === 1 ? 'item' : 'items'}
              </div>
            )}
          </div>
        );
      },
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
      title: "Status",
      key: "status",
      width: 120,
      render: (_: any, record: any) => {
        const status = record.status;
        return getStatusTag(status);
      },
    },
  ];

  // Calculate totals
  const totalAmount = useMemo(() => {
    return reimbursements.reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);
  }, [reimbursements]);

  const totalItems = useMemo(() => {
    return reimbursements.reduce((sum, r) => sum + (r.items?.length || 0), 0);
  }, [reimbursements]);

  const pendingCount = useMemo(() => {
    return reimbursements.reduce((count, r) => {
      const pendingItems = r.items?.filter((item: any) =>
        (item.status === 'PENDING' || item.status === 'SUBMITTED' || item.approverStatus === 'PENDING')
      ).length || 0;
      return count + pendingItems;
    }, 0);
  }, [reimbursements]);

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
            loading={isRefetching}
            size="small"
          >
            Refresh
          </Button>
        </div>
        <Input.Search
          placeholder="Search by employee, category, bill no..."
          allowClear
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          size="middle"
        />
      </div>

      {/* Summary tags */}
      <div className="flex gap-1.5 mb-3">
        <Tag color="blue" className="!px-2 !py-0.5 !text-xs">
          Total Reimbursements: {reimbursements.length}
        </Tag>
        <Tag color="green" className="!px-2 !py-0.5 !text-xs">
          Total Items: {totalItems}
        </Tag>
        <Tag color="gold" className="!px-2 !py-0.5 !text-xs">
          Pending: {pendingCount}
        </Tag>
        <Tag color="purple" className="!px-2 !py-0.5 !text-xs">
          Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
        </Tag>
      </div>

      {/* Parent Table with Expandable Child Rows */}
      <ZukvoLoadingOverlay loading={loading || isRefetching} message="">
          <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredData}
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
                    rowExpandable: (record) => (record.items?.length || 0) > 0,
                  }}
                  pagination={{
                    pageSize: 10,
                    size: "small",
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} reimbursements`,
                  }}
                />
          </ZukvoLoadingOverlay>

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
          <p className="text-base">Are you sure you want to approve this item?</p>
          {itemToApprove && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p><strong>Employee:</strong> {itemToApprove.employeeName}</p>
              <p><strong>Category:</strong> {itemToApprove.category}</p>
              <p><strong>Amount:</strong> ₹{Number(itemToApprove.amount).toFixed(2)}</p>
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
          {selectedItem && (
            <div className="mt-3 p-3 bg-gray-50 rounded">
              <p><strong>Employee:</strong> {selectedItem.employeeName}</p>
              <p><strong>Category:</strong> {selectedItem.category}</p>
              <p><strong>Amount:</strong> ₹{Number(selectedItem.amount).toFixed(2)}</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}


