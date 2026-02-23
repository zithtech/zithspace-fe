


"use client";
import PreviewModal from "@/components/common/PreviewModal";
import {
  Card,
  Table,
  Tag,
  Button,
  Drawer,
  Modal,
  message,
  Timeline,
  Col,
  Row,
  Space,
  Popconfirm,
} from "antd";
import {
  CloseOutlined,
  EyeOutlined,
  DownloadOutlined,
  TransactionOutlined,
  PlusOutlined,
  FilterOutlined,
  EditOutlined,
  UserOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { useRef, useEffect } from "react";

import { useRouter } from "next/navigation";
import { ReimbursementRequest as Reimbursement } from "@/services/categoryService";
import { useRequests, useDeleteRequest } from "@/hooks/useCategories";

export default function EmployeeTab() {
  /* ===== DATA ===== */
  const router = useRouter();
  const { data: requestData, isLoading: loading, refetch: reload } = useRequests({ view: 'my' });
  const data = requestData?.data || [];
  const { mutate: deleteRequest } = useDeleteRequest();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");

  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [downloadingFile, setDownloadingFile] = useState<any | null>(null);

  const filterRef = useRef<HTMLDivElement | null>(null);

  const handleDelete = (id: string) => {
    deleteRequest(id);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
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

  const getManagerStatusTag = (status: string) => {
    switch (status) {
      case "APPROVED":
      case "PAID":
      case "ON_HOLD":
        return <span className="text-green-600 font-medium">Manager Approved</span>;
      case "REJECTED":
        return <span className="text-orange-600 font-medium">Manager Rejected</span>;
      case "CLARIFY":
        return <span className="text-blue-600 font-medium">Manager Clarification</span>;
      default:
        return <span className="text-orange-500 font-medium">Pending Approval</span>;
    }
  };

  const getFinanceStatusTag = (status?: string, requestStatus?: string) => {
    if (status === "PAID") {
      return <span className="text-green-600 font-medium">Finance Paid</span>;
    }
    if (status === "ON_HOLD") {
      return <span className="text-orange-600 font-medium">Finance On Hold</span>;
    }
    return <span className="text-orange-500 font-medium">Pending Approval</span>;
  };

  const employeeData = data;

  const filteredData = employeeData.filter((r) => {
    const search = searchText.toLowerCase();

    return (
      (r.category ?? "").toLowerCase().includes(search) ||
      (r.status ?? "").toLowerCase().includes(search) ||
      ((r as any).department || "").toLowerCase().includes(search) ||
      String(r.amount ?? "").includes(search)
    ) &&
      (statusFilter === "all" || r.status === statusFilter) &&
      (!dateFilter || r.submitted?.startsWith(dateFilter));
  });

  const allCategories = Array.from(new Set(employeeData.map(r => r.category)));

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

  const getFileExtension = (fileName: string) => {
    return fileName?.split('.').pop()?.toLowerCase() || '';
  };

  type StatusChipProps = {
    status: Reimbursement["status"];
    size?: "sm" | "md";
  };

  const StatusChip = ({ status, size = "sm" }: StatusChipProps) => {
    const base =
      "rounded-full font-semibold inline-flex items-center";

    const sizeCls =
      size === "sm"
        ? "px-3 py-1 text-xs"
        : "px-4 py-1.5 text-sm";

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
        {status.replace("_", " ")}
      </span>
    );
  };

  /* ===== TABLE COLUMNS ===== */
  const columns = [
    {
      title: "Request ID",
      dataIndex: "requestId",
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    { 
      title: "Category", 
      dataIndex: "category",
      render: (text: string) => <span className="capitalize">{text}</span>,
    },
    {
      title: "Amount",
      render: (_: any, r: Reimbursement) =>
        <span className="font-semibold">₹{r.amount.toLocaleString("en-IN")}</span>,
    },
    {
      title: "Submitted",
      render: (_: any, r: Reimbursement) =>
        r.status === "DRAFT" ? "—" : r.submitted,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: Reimbursement["status"]) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold
            ${status === "PENDING_APPROVAL"
              ? "bg-orange-100 text-orange-700"
              : status === "APPROVED"
                ? "bg-green-100 text-green-700"
                : status === "PAID"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-red-100 text-red-700"
            }
          `}
        >
          {(status || "").replace("_", " ")}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Reimbursement) => (
        <div className="flex items-center gap-2">
          {/* VIEW */}
          <Button
            type="text"
            size="middle"
            icon={<EyeOutlined />}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            onClick={() => {
              setSelectedRow(record);
              setOpen(true);
            }}
          />

          {/* EDIT */}
          <Button
            type="text"
            size="middle"
            icon={<EditOutlined />}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            disabled={!['DRAFT', 'PENDING_APPROVAL', 'CLARIFY'].includes(record.status)}
            onClick={() => {
              router.push(`/reimburseCreate?id=${record.id}`);
            }}
          />

          {/* DELETE */}
          <Popconfirm
            title="Delete reimbursement?"
            description="This cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            disabled={!['DRAFT', 'PENDING_APPROVAL'].includes(record.status)}
            okType="danger"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              danger
              size="middle"
              disabled={!['DRAFT', 'PENDING_APPROVAL'].includes(record.status)}
              icon={<DeleteOutlined />}
              className="hover:bg-red-50"
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    // <Card className="rounded-xl shadow-md bg-white min-h-[600px] flex flex-col border border-gray-100">
      <div className="space-y-4 p-2">

        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 pb-4">
          {/* LEFT SIDE */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">
              <Space>
                <UserOutlined className="text-blue-600" />
                <span>My Reimbursements</span>
              </Space>
            </h2>

            <p className="text-sm text-gray-500">
              Track, review, and manage your reimbursement requests and expense claims.
            </p>

            {/* ✅ CHIPS JUST BELOW DESCRIPTION */}
            <div className="flex flex-wrap gap-2 pt-1">
              {/* TOTAL SUBMITTED */}
              <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                Total: {employeeData.length}
              </div>

              {/* PENDING */}
              <div className="px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                Pending: {employeeData.filter(d => d.status === "PENDING_APPROVAL").length}
              </div>

              {/* APPROVED */}
              <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                Approved: {employeeData.filter(d => d.status === "APPROVED").length}
              </div>

              {/* PAID */}
              <div className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                Paid: ₹{employeeData
                  .filter(d => d.status === "PAID")
                  .reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* RIGHT SIDE – SEARCH + CREATE */}
          <div className="flex items-center gap-3">
            {/* SEARCH */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-56 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-gray-50/50"
              />
            </div>

            <div className="relative" ref={filterRef}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilter((prev) => !prev)}
                className={`
                  flex items-center gap-2 px-4 py-2 h-auto rounded-lg border text-sm font-medium
                  ${showFilter ? "border-blue-500 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}
                `}
              >
                Filter
              </Button>

              {/* FILTER DROPDOWN */}
              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                    <span className="font-semibold text-gray-800">Filter Reimbursements</span>
                    <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setShowFilter(false)} className="text-gray-400 hover:text-gray-600" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none bg-white"
                      >
                        <option value="all">All Status</option>
                        <option value="PENDING_APPROVAL">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Submitted Date</label>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-gray-100">
                    <Button
                      onClick={() => { setStatusFilter("all"); setDateFilter(""); setSearchText(""); }}
                      className="text-sm px-4 py-1 border-transparent hover:bg-gray-100 text-gray-500"
                    >
                      Reset
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => setShowFilter(false)}
                      className="text-sm px-5 py-1 bg-blue-600 hover:bg-blue-700 border-none shadow-sm"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className="h-10 px-5 text-sm font-medium bg-blue-600 hover:bg-blue-700 border-none shadow-sm flex items-center gap-2"
              onClick={() => router.push("/reimburseCreate")}
            >
              Create New
            </Button>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <style jsx global>{`
          .medium-table .ant-table-thead > tr > th {
            padding: 12px 16px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            background-color: #fafafa !important;
            border-bottom: 2px solid #f0f0f0 !important;
          }
          
          .medium-table .ant-table-tbody > tr > td {
            padding: 12px 16px !important;
            font-size: 13px !important;
          }
          
          .medium-table .ant-table-tbody > tr:hover > td {
            background-color: #f5f9ff !important;
          }
          
          .medium-table .ant-btn {
            height: 32px !important;
            width: 32px !important;
          }
          
          .medium-table .ant-pagination {
            margin-top: 16px !important;
            margin-bottom: 8px !important;
          }
          
          .medium-table .ant-pagination-item {
            border-radius: 8px !important;
          }
          
          .medium-table .ant-pagination-item-active {
            border-color: #3b82f6 !important;
          }
          
          .medium-table .ant-pagination-item-active a {
            color: #3b82f6 !important;
          }
        `}</style>

        <div className="flex-1 overflow-hidden">
          <Table
            className="medium-table"
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
            <div className="pb-4">
              <div className="flex items-center justify-between">
                <div className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  #{selectedRow?.requestId || "REQ-0000"}
                </div>
                <div className="flex items-center gap-3">
                  <Tag
                    color={
                      selectedRow?.status === "APPROVED"
                        ? "green"
                        : selectedRow?.status === "REJECTED"
                          ? "red"
                          : "orange"
                    }
                    className="rounded-full px-4 py-1.5 text-xs font-medium border-0"
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
          width={500}
          closeIcon={null}
          open={open}
          styles={{
            body: { padding: 20 },
            header: { padding: '20px 24px 0' }
          }}
        >
          {selectedRow && (
            <div className="text-sm text-gray-700 h-full flex flex-col">
              {/* COMPACT SUMMARY - FIXED HEIGHT */}
              <div className="flex-shrink-0">
                <div className="mb-3 font-semibold text-lg text-gray-900">Request Summary</div>
                <div className="rounded-xl bg-gradient-to-br from-white to-slate-50 p-5 border border-slate-200 space-y-3 shadow-sm">
                  {[
                    ["Category", selectedRow.category],
                    ["Total Amount", `₹${selectedRow.amount}`],
                    ["Employee", selectedRow.employee?.name || (selectedRow as any).user?.name],
                    ["Department", (selectedRow as any).department || selectedRow.employee?.department || (selectedRow as any).user?.department || (selectedRow as any).user?.position || "N/A"],
                    ["Submitted", selectedRow.submitted],
                    ["Created", selectedRow.created],
                  ].map(([label, value], i) => (
                    <div key={i} className="flex justify-between text-sm py-1.5 px-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <span className="text-gray-500 font-medium">{label}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}

                  {/* 🔹 MANAGER STATUS */}
                  <div className="flex justify-between text-sm py-1.5 px-2">
                    <span className="text-gray-500 font-medium">Manager Status</span>
                    <span className="font-semibold">{getManagerStatusTag(selectedRow.status)}</span>
                  </div>

                  {/* 🔹 FINANCE STATUS */}
                  <div className="flex justify-between text-sm py-1.5 px-2">
                    <span className="text-gray-500 font-medium">Finance Status</span>
                    <span className="font-semibold">{getFinanceStatusTag(selectedRow.financeStatus, selectedRow.status)}</span>
                  </div>
                </div>
              </div>

              {/* ================= ONLY SCROLLABLE AREA ================= */}
              <div className="flex-1 overflow-y-auto mt-4 pr-2 space-y-6">
                {/* EXPENSE ITEMS */}
                <div>
                  <div className="mb-3 font-semibold text-lg text-gray-900">
                    Expense Items ({selectedRow.expenseItems?.length || 0})
                  </div>
                  <div className="space-y-3">
                    {selectedRow.expenseItems?.map((item, i) => {
                      const files = normalizeFiles(item);
                      const showFiles = files.slice(0, 4);
                      const hasMoreFiles = files.length > 4;

                      return (
                        <div key={i} className="group flex items-start gap-4 p-4 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base group-hover:text-blue-700 transition-colors truncate">{item.title}</div>
                            <div className="text-sm text-gray-500 mt-1">{item.date} • ₹{item.amount}</div>
                          </div>

                          {files.length > 0 && (
                            <div className="space-y-2 min-w-[200px]">
                              {showFiles.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white p-2 rounded-lg text-sm shadow-sm hover:shadow-md transition-all border border-slate-100 h-10"
                                >
                                  <span className="truncate font-medium text-gray-800 max-w-[100px]">
                                    {getFileName(file)}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      size="small"
                                      type="text"
                                      disabled={!!downloadingFile}
                                      className="!p-1 w-7 h-7 text-gray-600 hover:text-blue-600 flex items-center justify-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreview(file);
                                      }}
                                    >
                                      <EyeOutlined />
                                    </Button>
                                    <Button
                                      size="small"
                                      type="text"
                                      loading={downloadingFile === file}
                                      disabled={!!downloadingFile && downloadingFile !== file}
                                      className="!p-1 w-7 h-7 text-gray-600 hover:text-green-600 flex items-center justify-center"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(file);
                                      }}
                                    >
                                      {downloadingFile !== file && <DownloadOutlined />}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {hasMoreFiles && (
                                <div className="pt-1">
                                  <Button
                                    size="small"
                                    type="link"
                                    className="p-0 text-sm text-blue-600 hover:text-blue-700 font-medium h-auto"
                                  >
                                    +{files.length - 4} more files
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
                  <div className="mb-3 font-semibold text-lg text-gray-900">Activity Log</div>
                  <Timeline>
                    {selectedRow.activityLog.slice(-4).map((log, i) => (
                      <Timeline.Item key={i}>
                        <div className="text-sm font-semibold text-gray-700">{log.action}</div>
                        {log.note && (
                          <div className="text-sm text-gray-500 italic mt-1">"{log.note}"</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">{log.date}</div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* ===== PREVIEW MODAL ===== */}
        <PreviewModal
          open={previewModal}
          onCancel={() => setPreviewModal(false)}
          previewUrl={previewUrl}
          previewFileName={previewFileName}
        />
      </div>
  );
}