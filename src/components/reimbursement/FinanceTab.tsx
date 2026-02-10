"use client";

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
import { EyeOutlined, CloseOutlined, DownloadOutlined, DollarOutlined, CloseCircleOutlined, CheckCircleOutlined, SearchOutlined, FilterOutlined } from "@ant-design/icons";

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

  const [actionType, setActionType] = useState<"pay" | "hold" | null>(
    null
  );
  const [actionText, setActionText] = useState("");
  const [currentRecord, setCurrentRecord] = useState<Reimbursement | null>(null);



  const [showFilter, setShowFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);



  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const tenantId = localStorage.getItem("tenantId");
    return {
      "Authorization": `Bearer ${token}`,
      "x-tenant-id": tenantId || "",
    };
  };

  const getFileName = (file: any): string => {
    if (!file) return "file";

    let name = "";
    if (typeof file === "string") {
      name = file;
    } else if (file && typeof file === "object") {
      name = file.name || file.fileName || file.url || "file";
    }

    // If it's a URL, extract the filename
    if (name.startsWith('http://') || name.startsWith('https://')) {
      const parts = name.split("/");
      const lastPart = parts.pop() || "";
      // Handle potential timestamped files from backend
      const cleanName = lastPart.includes('_') ? lastPart.split('_').slice(1).join('_') : lastPart;
      return cleanName || lastPart;
    }

    return name.split("/").pop()?.split("\\").pop() || name;
  };

  const getFileUrl = (file: any): string => {
    if (!file) return "";

    const fileIdentifier = typeof file === 'string' ? file : (file?.url || file?.name || file?.fileName || "");

    if (!fileIdentifier) return "";

    if (fileIdentifier.startsWith('http://') || fileIdentifier.startsWith('https://')) {
      return fileIdentifier;
    }

    return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/uploads/${fileIdentifier}`;
  };

  const handlePreview = async (file: any) => {
    try {
      const fileName = getFileName(file);
      const url = getFileUrl(file);

      const response = await fetch(url, {
        headers: getAuthHeaders() as any
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load preview");
        } catch {
          throw new Error("Failed to load preview");
        }
      }

      // Check if response is JSON (error) despite 200 OK
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await response.json();
        throw new Error(json.error || "Failed to load preview");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setPreviewFileName(fileName);
      setPreviewUrl(objectUrl);
      setPreviewModal(true);
    } catch (error: any) {
      message.error(error.message || "Failed to load preview");
    }
  };

  const getFileExtension = (fileName: string) => {
    return fileName?.split('.').pop()?.toLowerCase() || '';
  };

  const handleDownload = async (file: string) => {
    try {
      setDownloadingFile(file);
      const fileName = getFileName(file);
      const url = getFileUrl(file);

      const response = await fetch(url, {
        headers: getAuthHeaders() as any
      });
      if (!response.ok) throw new Error("File not found");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
      message.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      message.error("Download failed");
    } finally {
      setDownloadingFile(null);
    }
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



  const normalizeFiles = (item: any): string[] => {
    if (Array.isArray(item.attachments)) return item.attachments;
    if (Array.isArray(item.files)) return item.files;
    if (typeof item.attachments === "string") return [item.attachments];
    if (typeof item.files === "string") return [item.files];
    return [];
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
        return <span className="text-green-600">Manager Approved</span>;
      case "REJECTED":
        return <span className="text-orange-600">Manager Rejected</span>;
      default:
        return <span className="text-orange-500">Pending  Approval</span>;
    }
  };

  const getFinanceStatusTag = (status?: string, requestStatus?: string) => {
    if (requestStatus === "REJECTED") {
      return <span className="text-gray-400">N/A</span>;
    }
    if (status === "PAID") {
      return <span className="text-green-600">Finance Paid</span>;
    }
    if (status === "ON_HOLD") {
      return <span className="text-orange-600">Finance On Hold</span>;
    }
    return <span className="text-orange-500">Pending  Approval</span>;
  };



  /* ===== FILTERED DATA ===== */
  const filteredData = data.filter((r) => {
    // Explicitly exclude non-finance statuses (Drafts, Pending Manager Approval, Clarifications)
    // Also exclude REJECTED by manager (unless it has a finance action already)
    if (['DRAFT', 'PENDING_APPROVAL', 'CLARIFY'].includes(r.status)) return false;
    if (r.status === 'REJECTED' && !r.financeStatus) return false;

    // Search Text filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();

      const matchesName =
        (r.employee?.name || (r as any).user?.name || "").toLowerCase().includes(searchLower);

      const matchesDept =
        ((r as any).department || "").toLowerCase().includes(searchLower);

      const matchesId =
        (r.requestId || "").toLowerCase().includes(searchLower);

      if (!matchesName && !matchesId && !matchesDept) {
        return false;
      }
    }

    // Employee filter
    if (
      filters.employee !== "all" &&
      (r.employee?.name || (r as any).user?.name) !== filters.employee
    ) {
      return false;
    }

    // Category filter
    if (
      filters.category !== "all" &&
      r.category !== filters.category
    ) {
      return false;
    }

    // Status filter
    if (
      filters.status !== "all" &&
      r.status !== filters.status
    ) {
      return false;
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
        ? "px-2 py-[2px] text-[10px]"
        : "px-3 py-1 text-[12px]";

    const color =
      status === "DRAFT"
        ? "bg-gray-100 text-gray-600"
        : status === "PENDING_APPROVAL"
          ? "bg-yellow-100 text-yellow-700"
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





  /* ===== TABLE COLUMNS (UNCHANGED) ===== */
  const columns: ColumnsType<Reimbursement> = [
    {
      title: "Request ID",
      dataIndex: "requestId",
    },
    {
      title: "Employee",
      render: (_, r) => r.employee?.name || (r as any).user?.name,
    },
    {
      title: "Category",
      dataIndex: "category",
    },
    {
      title: "Amount",
      render: (_, r) => `₹${r.amount.toLocaleString("en-IN")}`,
    },

    {
      title: "Status",
      dataIndex: "status",
      render: (status: Reimbursement["status"]) => (
        <StatusChip status={status} />
      ),
    },

    {
      title: "Actions",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
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
    // Don't close modal on reset, just clear values
  };


  return (

    <Card className="rounded-2xl shadow-md bg-white h-[540px] flex flex-col">
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ===== TOP HEADER ROW ===== */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-2">


          {/* LEFT SIDE: TITLE + DESC + CHIPS */}
          <div className="space-y-1">

            <h2 className="text-lg font-semibold text-gray-900">
              <Space>
                <DollarOutlined />
                <span>Finance</span>
              </Space>
            </h2>


            <p className="text-[11px] text-gray-500 leading-tight max-w-[520px]">
              Track payment status, review processed reimbursements, and monitor
              finance approvals and settlements.
            </p>

            {/* ===== FINANCE SUMMARY CHIPS ===== */}
            <div className="flex flex-wrap gap-1 pt-1 ml-1">
              {/* Pending Payment */}
              <div className="px-2 py-[2px] rounded-full bg-orange-100 text-orange-700 text-[10px] font-medium">
                Pending Payment:
                <span className="ml-1 font-semibold">
                  ₹{data.filter(d => d.status === 'APPROVED').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Paid This Month */}
              <div className="px-2 py-[2px] rounded-full bg-green-100 text-green-700 text-[10px] font-medium">
                Paid:
                <span className="ml-1 font-semibold">
                  ₹{data.filter(d => d.status === 'PAID').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>

              {/* Total All Time */}
              <div className="px-2 py-[2px] rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium">
                Total:
                <span className="ml-1 font-semibold">
                  ₹{data.filter(d => d.status !== 'REJECTED').reduce((sum, item) => sum + Number(item.amount || 0), 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

          </div>

          {/* RIGHT SIDE: SEARCH + FILTER + EXPORT */}
          <div className="flex items-center gap-2 mt-1">

            {/* 1. Search Bar */}
            <Input
              placeholder="Search requests..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-48 rounded-lg"
            />

            <div className="relative" ref={filterRef}>
              <Button
                type="default"
                icon={<FilterOutlined />}
                className="rounded-lg border-gray-300 shadow-sm
      hover:border-blue-500 hover:text-blue-600"
                onClick={() => setShowFilter(prev => !prev)}
              >
                Advanced Filters
              </Button>

              {showFilter && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 text-[12px]">

                  {/* HEADER */}
                  <div className="flex justify-between items-center mb-3 border-b pb-2">
                    <span className="font-semibold text-gray-800">
                      Advanced Filters
                    </span>
                    <Button
                      size="small"
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => setShowFilter(false)}
                    />
                  </div>

                  {/* EMPLOYEE */}
                  <div className="mb-3">
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">
                      Employee
                    </label>
                    <Select
                      value={filters.employee}
                      onChange={(v) => handleFilterChange("employee", v)}
                      className="w-full"
                      size="small"
                    >
                      <Select.Option value="all">All Employees</Select.Option>
                      {[...new Set(data.map(d => d.employee?.name || (d as any).user?.name))].filter(Boolean).map(name => (
                        <Select.Option key={name} value={name}>{name}</Select.Option>
                      ))}
                    </Select>
                  </div>

                  {/* CATEGORY */}
                  <div className="mb-3">
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">
                      Category
                    </label>
                    <Select
                      value={filters.category}
                      onChange={(v) => handleFilterChange("category", v)}
                      className="w-full"
                      size="small"
                    >
                      <Select.Option value="all">All Categories</Select.Option>
                      {[...new Set(data.map(d => d.category))].filter(Boolean).map(cat => (
                        <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                      ))}
                    </Select>
                  </div>

                  {/* STATUS */}
                  <div className="mb-4">
                    <label className="block text-[11px] font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <Select
                      value={filters.status}
                      onChange={(v) => handleFilterChange("status", v)}
                      className="w-full"
                      size="small"
                    >
                      <Select.Option value="all">All Status</Select.Option>
                      <Select.Option value="PAID">Paid</Select.Option>
                      <Select.Option value="APPROVED">Pending Payment</Select.Option>
                      <Select.Option value="ON_HOLD">On Hold</Select.Option>
                    </Select>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      size="small"
                      onClick={resetFilters}
                    >
                      Clear
                    </Button>

                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setShowFilter(false)}
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              )}
            </div>



          </div>
        </div>


        <style jsx global>{`
        /* ===== TABLE ROW COMPRESSION ===== */

.compact-table .ant-table-thead > tr > th {
  padding: 6px 8px !important;
  font-size: 11px !important;
  line-height: 1.2 !important;
  height: 32px !important;
}

.compact-table .ant-table-tbody > tr > td {
  padding: 4px 6px !important;
  font-size: 11px !important;
  line-height: 1.2 !important;
  height: 32px !important;
}

/* ===== ACTION BUTTON (eye icon) ===== */
.compact-table .ant-btn {
  padding: 0 !important;
  height: 22px !important;
  min-width: 22px !important;
}

/* ===== PAGINATION COMPACT ===== */
.compact-table .ant-pagination {
  margin-top: 6px !important;
}
  
`}</style>

        <div className="flex-1 overflow-hidden">
          <Table
            className="compact-table"
            rowKey="id"
            columns={columns}
            dataSource={filteredData}
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: false,
              position: ["bottomRight"],
            }}
          />
        </div>


        <Modal
          open={previewModal}
          onCancel={() => setPreviewModal(false)}
          footer={null}
          width={900}
          styles={{ body: { padding: 0, height: "80vh" } }}
        >
          {/* HEADER */}
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <div className="font-semibold text-lg truncate">
              Preview: {previewFileName}
            </div>

            <div className="flex gap-2">
              <Button onClick={() => setPreviewModal(false)}>Close</Button>
            </div>
          </div>

          {/* PREVIEW */}
          {(() => {
            const ext = getFileExtension(previewFileName);
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
            const isPdf = ext === 'pdf';

            if (isImage) {
              return (
                <div className="w-full h-[calc(100%-70px)] flex items-center justify-center bg-gray-100 overflow-auto">
                  <img src={previewUrl} alt={previewFileName} className="max-w-full max-h-full object-contain" />
                </div>
              );
            }
            if (isPdf) {
              return <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-[calc(100%-70px)] border-0" />;
            }

            return (
              <div className="w-full h-[calc(100%-70px)] flex flex-col items-center justify-center bg-gray-50">
                <div className="text-gray-500 mb-2 text-lg">Preview not available</div>
                <p className="text-gray-400 mb-6 text-xs">This file type ({ext}) cannot be previewed directly.</p>
              </div>
            );
          })()}
        </Modal>

        {/* ===== DRAWER (UNCHANGED) ===== */}
        <Drawer
          title={
            <div className="pb-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
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
                    className="rounded-full px-4 py-1 text-xs font-medium shadow-sm border-0 backdrop-blur-sm"
                  >
                    {selectedRow?.status || "PENDING"}
                  </Tag>
                  <CloseOutlined
                    className="cursor-pointer text-gray-500 hover:text-gray-900 hover:scale-110 text-base transition-all duration-200"
                    onClick={() => setOpen(false)}
                  />
                </div>
              </div>
            </div>
          }
          placement="right"
          width={450}
          closeIcon={null}
          open={open}
          styles={{
            body: {
              padding: 10,
              height: "100vh",
              overflow: "hidden",
            },
            header: { padding: "16px 20px 0" },
          }}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                danger
                onClick={() => {
                  setCurrentRecord(selectedRow);
                  setActionType("hold");
                  setOpen(false);
                }}
              >
                Reject
              </Button>
              <Button
                type="primary"
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

              {/* ================= SUMMARY (FIXED) ================= */}
              <div className="flex-shrink-0">
                <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
                  Request Summary
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-white to-slate-50 p-4 border border-slate-100 space-y-2 shadow-lg">
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
                      className="flex justify-between text-xs py-1 hover:bg-slate-100 hover:rounded-lg px-2 transition-colors"
                    >
                      <span className="text-gray-500 font-medium">{label}</span>
                      <span className="font-bold text-gray-900">{value}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-xs py-1 px-2">
                    <span className="text-gray-500 font-medium">
                      Manager Status
                    </span>

                    <span className="min-w-[90px] text-right font-bold text-gray-900">
                      {getManagerStatusTag(selectedRow.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1 px-2">
                    <span className="text-gray-500 font-medium">
                      Finance Status
                    </span>
                    <span className="min-w-[90px] text-right font-bold text-gray-900">
                      {getFinanceStatusTag(selectedRow.financeStatus, selectedRow.status)}
                    </span>
                  </div>
                </div>



              </div>
              <div className="flex-1 overflow-y-auto mt-3 pr-2 space-y-6">

                {/* EXPENSE ITEMS */}
                <div>
                  <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
                    Expense Items ({selectedRow.expenseItems?.length || 0})
                  </div>

                  <div className="space-y-2">
                    {selectedRow.expenseItems?.map((item, i) => {
                      const files = normalizeFiles(item);
                      const showFiles = files.slice(0, 4);
                      const hasMoreFiles = files.length > 4;

                      return (
                        <div
                          key={i}
                          className="group flex items-start gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.date} • ₹{item.amount}
                            </div>
                          </div>

                          {files.length > 0 && (
                            <div className="space-y-1.5 min-w-[180px]">
                              {showFiles.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white/90 backdrop-blur-sm p-2 rounded-lg text-xs shadow-sm hover:shadow-md hover:bg-white transition-all duration-200 border border-slate-100 hover:border-blue-100 h-8"
                                >
                                  <span className="truncate font-medium text-gray-800 max-w-[90px]">
                                    {getFileName(file)}
                                  </span>
                                  <div className="flex gap-2">
                                    <Button
                                      size="small"
                                      type="text"
                                      disabled={!!downloadingFile}
                                      className="!p-0 w-6 h-6 text-gray-600 hover:text-blue-600 hover:scale-110 flex items-center justify-center"
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
                                      className="!p-0 w-6 h-6 text-gray-600 hover:text-green-600 hover:scale-110 flex items-center justify-center shadow-none"
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
                                    className="p-0 text-xs text-blue-600 hover:text-blue-700 font-medium h-auto"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
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
                  <div className="mb-3 font-semibold text-base text-gray-900 tracking-tight">
                    Activity Log
                  </div>

                  <Timeline>
                    {selectedRow.activityLog.slice(-4).map((log, i) => (
                      <Timeline.Item key={i}>
                        <div className="text-xs font-semibold text-gray-700">{log.action}</div>
                        {log.note && (
                          <div className="text-xs text-gray-500 italic">"{log.note}"</div>
                        )}
                        <div className="text-[10px] text-gray-400 mt-0.5">{log.date}</div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </div>

              </div>
            </div>
          )}
        </Drawer>


        <Modal
          open={!!actionType}
          footer={null}
          centered
          closable={false}
          className="rounded-2xl overflow-hidden"
          onCancel={() => {
            setActionType(null);
            setActionText("");
          }}
        >
          {/* Header */}
          <div className="px-6 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">
              {actionType === "pay" && "Mark as Paid"}
              {actionType === "hold" && "Put on Hold"}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Request ID: {currentRecord?.requestId}
            </p>
          </div>

          {/* Body */}
          <div className="px-6 py-5 bg-slate-50 space-y-4">
            {actionType === "pay" && (
              <div className="rounded-xl bg-white border p-4 shadow-sm">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Are you sure you want to mark request{" "}
                  <b>{currentRecord?.requestId}</b> as paid?
                </p>
              </div>
            )}
            {actionType === "hold" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Reason for Hold
                </label>
                <Input.TextArea
                  rows={5}
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="Enter the reason for putting this request on hold..."
                  className="rounded-lg"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-white border-t">
            <Button
              onClick={() => {
                setActionType(null);
                setActionText("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              className={
                actionType === "pay"
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-red-500 hover:bg-red-600"
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


      </div>
    </Card>
  );
}
