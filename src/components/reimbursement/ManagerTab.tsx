
"use client";
import PreviewModal from "@/components/common/PreviewModal";
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Tooltip,
  Timeline,
  message,
  Modal,
  Drawer,
  Input,
  Select,
} from "antd";

import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  CloseOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import type { ColumnsType } from "antd/es/table";
import { useState, useEffect, useRef } from "react";

import { CategoryService, ReimbursementRequest as Reimbursement } from "@/services/categoryService";
import { useRequests, useManagerAction } from "@/hooks/useCategories";

const { Title } = Typography;

/* ================== COMPONENT ================== */
export default function ManagerTab() {
  /* ===== DATA FROM SERVICE ===== */
  const { data: requestData, isLoading: loading, refetch: reload } = useRequests({ view: 'manager' });
  const data = requestData?.data || [];
  const { mutateAsync: performManagerAction } = useManagerAction();

  /* ===== STATE ===== */
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Reimbursement | null>(null);

  const [actionType, setActionType] = useState<
    "approve" | "reject" | "clarify" | null
  >(null);
  const [actionText, setActionText] = useState("");
  const [currentRecord, setCurrentRecord] = useState<Reimbursement | null>(null);

  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewFileName, setPreviewFileName] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");

  // Search & Filter (same pattern as settings)
  const [searchText, setSearchText] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("PENDING_APPROVAL");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [submittedFilter, setSubmittedFilter] = useState<string[]>([]);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    }

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilter]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const tenantId = localStorage.getItem("tenantId");
    return {
      "Authorization": `Bearer ${token}`,
      "x-tenant-id": tenantId || "",
    };
  };

  const filteredRequests = data.filter((item) => {
    // Explicitly exclude DRAFT from Manager view
    if (item.status === 'DRAFT') return false;

    // search
    const matchesSearch =
      (item.requestId || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (item.employee?.name || (item as any).user?.name || "").toLowerCase().includes(searchText.toLowerCase()) ||
      ((item as any).department || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(searchText.toLowerCase()) ||
      (item.submitted ?? "").toLowerCase().includes(searchText.toLowerCase());

    // category filter
    const matchesCategory =
      categoryFilter.length === 0 || categoryFilter.includes(item.category);

    // submitted filter
    const matchesSubmitted =
      !dateFilter || (item.submittedAt && item.submittedAt.startsWith(dateFilter));
    // status filter
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesSubmitted && matchesStatus;
  });

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

  //filter logic
  const pendingRequests = data.filter(r => r.status === "PENDING_APPROVAL");
  const clarifyRequests = data.filter(r => r.status === "CLARIFY");

  const approvedTodayCount = data.filter(d => {
    if (d.status !== 'APPROVED') return false;
    const updated = new Date(d.updatedAt);
    const today = new Date();
    return updated.getDate() === today.getDate() &&
      updated.getMonth() === today.getMonth() &&
      updated.getFullYear() === today.getFullYear();
  }).length;

  const getManagerStatusTag = (status: string) => {
    switch (status) {
      case "APPROVED":
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

  type StatusChipProps = {
    status: Reimbursement["status"];
    size?: "sm" | "md";
  };

  const StatusChip = ({ status, size = "sm" }: StatusChipProps) => {
    const base =
      "rounded-full font-semibold inline-flex items-center";

    const sizeCls =
      size === "sm"
        ? "px-2 py-1 text-xs"
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
        {status.replace("_", " ")}
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
      width: 160,
      render: (_, record) => {
        const emp = record.employee || (record as any).user;
        return (
          <div>
            <div className="font-medium text-sm">
              {emp?.name}
            </div>
            <div className="text-xs text-gray-500">
              {(record as any).department || emp?.department || emp?.position}
            </div>
          </div>
        );
      },
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
      title: "Submitted",
      dataIndex: "submitted",
      width: 110,
      render: (text) => <span className="text-sm">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 120,
      render: (status: Reimbursement["status"]) => (
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold
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
      title: "Actions",
      width: 150,
      align: "center",
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View">
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

          <Tooltip title="Approve">
            <Button
              type="text"
              icon={<CheckCircleOutlined />}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 w-7 h-7"
              onClick={() => {
                setCurrentRecord(record);
                setActionType("approve");
              }}
            />
          </Tooltip>

          <Tooltip title="Reject">
            <Button
              type="text"
              icon={<CloseCircleOutlined />}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 w-7 h-7"
              onClick={() => {
                setCurrentRecord(record);
                setActionType("reject");
              }}
            />
          </Tooltip>

          <Tooltip title="Clarify">
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 w-7 h-7"
              onClick={() => {
                setCurrentRecord(record);
                setActionType("clarify");
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    // <Card className="rounded-lg shadow-sm bg-white h-[540px] flex flex-col border border-gray-100">
      <div className="space-y-3 p-3">

        <style jsx global>{`
          .manager-table .ant-table-thead > tr > th {
            padding: 8px 10px !important;
            font-size: 12px !important;
            font-weight: 600 !important;
            background-color: #fafafa !important;
          }
          
          .manager-table .ant-table-tbody > tr > td {
            padding: 6px 10px !important;
            font-size: 12px !important;
          }
          
          .manager-table .ant-table-tbody > tr:hover > td {
            background-color: #f5f9ff !important;
          }
          
          .manager-table .ant-btn {
            height: 26px !important;
            width: 26px !important;
          }
          
          .manager-table .ant-pagination {
            margin-top: 10px !important;
          }
          
          .manager-table .ant-pagination-item {
            min-width: 26px !important;
            height: 26px !important;
            line-height: 24px !important;
          }
        `}</style>

        {/* ================= HEADER ================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          {/* ================= LEFT SIDE ================= */}
          <div className="space-y-1.5">
            <h2 className="text-base font-semibold text-gray-900">
              <Space size={4}>
                <TeamOutlined className="text-blue-600" />
                <span>Manager Dashboard</span>
              </Space>
            </h2>

            <p className="text-xs text-gray-500 leading-normal">
              View and take action on employee reimbursement claims.
            </p>

            {/* ✅ CHIPS – IMPROVED */}
            <div className="flex flex-wrap gap-2">
              <div className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                Pending: {pendingRequests.length}
              </div>

              <div className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium border border-orange-100">
                Review: {clarifyRequests.length}
              </div>

              <div className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                Today: {approvedTodayCount}
              </div>
            </div>
          </div>

          {/* ================= RIGHT SIDE - IMPROVED ALIGNMENT ================= */}
          <div className="flex items-center gap-2">
            {/* SEARCH BAR - BETTER SIZE */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search requests..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-48 px-3 py-1.5 rounded-md border border-gray-200 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-gray-50/50"
              />
            </div>

            {/* FILTER BUTTON - IMPROVED */}
            <div className="relative" ref={filterRef}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilter(prev => !prev)}
                className={`
                  flex items-center gap-1.5
                  px-3 py-1.5 h-auto rounded-md
                  border text-xs font-medium
                  ${showFilter
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}
                `}
              >
                Filter
              </Button>

              {/* ================= FILTER CARD - IMPROVED ================= */}
              {showFilter && (
                <div
                  className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50"
                >
                  {/* HEADER */}
                  <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                    <span className="font-semibold text-gray-800 text-sm">
                      Filter Requests
                    </span>
                    <Button
                      size="small"
                      type="text"
                      icon={<CloseOutlined />}
                      onClick={() => setShowFilter(false)}
                      className="text-gray-400 hover:text-gray-600"
                    />
                  </div>

                  {/* CATEGORY */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Category
                    </label>
                    <Select
                      mode="multiple"
                      size="small"
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      style={{ width: "100%" }}
                      maxTagCount={1}
                      placeholder="Select category"
                      className="text-xs"
                    >
                      {[...new Set(data.map(d => d.category))].map(c => (
                        <Select.Option key={c} value={c}>
                          {c}
                        </Select.Option>
                      ))}
                    </Select>
                  </div>

                  {/* SUBMITTED DATE */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Submitted Date
                    </label>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* STATUS */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs focus:outline-none focus:border-blue-500"
                    >
                      <option value="PENDING_APPROVAL">Pending</option>
                      <option value="CLARIFY">Clarification</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="all">All</option>
                    </select>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <Button
                      size="small"
                      onClick={() => {
                        setSearchText("");
                        setCategoryFilter([]);
                        setSubmittedFilter([]);
                        setDateFilter("");
                        setStatusFilter("PENDING_APPROVAL");
                      }}
                      className="text-xs px-3"
                    >
                      Reset
                    </Button>

                    <Button
                      size="small"
                      type="primary"
                      onClick={() => setShowFilter(false)}
                      className="text-xs px-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        <div className="flex-1 overflow-hidden mt-1">
          <Table
            className="manager-table"
            rowKey="id"
            columns={columns}
            dataSource={filteredRequests}
            loading={loading}
            pagination={{
              pageSize: 7,
              showSizeChanger: false,
              showQuickJumper: false,
              position: ["bottomRight"],
            }}
          />
        </div>

        {/* ===== DRAWER ===== */}
        <Drawer
          title={
            <div className="pb-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
                    className="rounded-full px-2.5 py-1 text-xs font-medium border-0"
                  >
                    {selectedRow?.status || "PENDING"}
                  </Tag>
                  <CloseOutlined
                    className="cursor-pointer text-gray-500 hover:text-gray-900 text-sm transition-colors"
                    onClick={() => setOpen(false)}
                  />
                </div>
              </div>
            </div>
          }
          placement="right"
          width={420}
          closeIcon={null}
          open={open}
          styles={{
            body: {
              padding: 14,
              height: "100vh",
              overflow: "hidden",
            },
            header: { padding: "14px 18px 0" },
          }}
          footer={
            <div className="flex justify-end p-2 border-t border-gray-100">
              <div className="flex gap-2">
                <Button
                  type="primary"
                  size="middle"
                  className="bg-green-500 hover:bg-green-600 border-none px-4 text-xs"
                  onClick={async () => {
                    if (!selectedRow) return;
                    await performManagerAction({ id: selectedRow.id, data: { action: "APPROVE" } });
                    setOpen(false);
                  }}
                >
                  Approve
                </Button>

                <Button
                  danger
                  size="middle"
                  className="px-4 text-xs"
                  onClick={async () => {
                    if (!selectedRow) return;
                    await performManagerAction({ id: selectedRow.id, data: { action: "REJECT" } });
                    setOpen(false);
                  }}
                >
                  Reject
                </Button>
              </div>
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

                <div className="rounded-lg bg-gradient-to-br from-white to-slate-50 p-3 border border-slate-200 space-y-2 shadow-sm">
                  {[
                    ["Category", selectedRow.category],
                    ["Total", `₹${selectedRow.amount}`],
                    ["Employee", selectedRow.employee?.name || (selectedRow as any).user?.name],
                    ["Dept", (selectedRow as any).department || selectedRow.employee?.department || "N/A"],
                    ["Submitted", selectedRow.submitted],
                  ].map(([label, value], i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs py-1 px-2 hover:bg-slate-100 rounded transition-colors"
                    >
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}

                  {/* MANAGER STATUS */}
                  <div className="flex justify-between text-xs py-1 px-2">
                    <span className="text-gray-500">Manager</span>
                    <span className="font-medium">{getManagerStatusTag(selectedRow.status)}</span>
                  </div>

                  {/* FINANCE STATUS */}
                  <div className="flex justify-between text-xs py-1 px-2">
                    <span className="text-gray-500">Finance</span>
                    <span className="font-medium">{getFinanceStatusTag(selectedRow.financeStatus, selectedRow.status)}</span>
                  </div>
                </div>
              </div>

              {/* ================= SCROLLABLE AREA ================= */}
              <div className="flex-1 overflow-y-auto mt-3 space-y-4">
                {/* EXPENSE ITEMS */}
                <div>
                  <div className="mb-2 font-semibold text-base text-gray-900">
                    Items ({selectedRow.expenseItems?.length || 0})
                  </div>

                  <div className="space-y-2">
                    {selectedRow.expenseItems?.map((item, i) => {
                      const files = normalizeFiles(item);
                      const showFiles = files.slice(0, 2);
                      const hasMoreFiles = files.length > 2;

                      return (
                        <div key={i} className="group flex items-start gap-3 p-3 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded shadow-sm">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm group-hover:text-blue-700 transition-colors truncate">{item.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.date} • ₹{item.amount}</div>
                          </div>

                          {files.length > 0 && (
                            <div className="space-y-1.5 min-w-[140px]">
                              {showFiles.map((file, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white p-1.5 rounded text-xs shadow-sm border border-slate-100 h-7"
                                >
                                  <span className="truncate font-medium text-gray-800 max-w-[70px]">
                                    {getFileName(file)}
                                  </span>
                                  <div className="flex gap-1">
                                    <Button
                                      size="small"
                                      type="text"
                                      disabled={!!downloadingFile}
                                      className="!p-0 w-5 h-5 text-gray-600 hover:text-blue-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreview(file);
                                      }}
                                    >
                                      <EyeOutlined style={{ fontSize: 11 }} />
                                    </Button>
                                    <Button
                                      size="small"
                                      type="text"
                                      loading={downloadingFile === file}
                                      disabled={!!downloadingFile && downloadingFile !== file}
                                      className="!p-0 w-5 h-5 text-gray-600 hover:text-green-600"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(file);
                                      }}
                                    >
                                      {downloadingFile !== file && <DownloadOutlined style={{ fontSize: 11 }} />}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                              {hasMoreFiles && (
                                <div>
                                  <Button
                                    size="small"
                                    type="link"
                                    className="p-0 text-xs text-blue-600 hover:text-blue-700 font-medium h-auto"
                                  >
                                    +{files.length - 2} more
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
                  <div className="mb-2 font-semibold text-base text-gray-900">Activity</div>

                  <Timeline>
                    {selectedRow.activityLog.slice(-3).map((log, i) => (
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

        {/* ===== MODAL ACTIONS ===== */}
        <Modal
          open={!!actionType}
          footer={null}
          centered
          closable={false}
          width={400}
          className="rounded-lg overflow-hidden"
          onCancel={() => {
            setActionType(null);
            setActionText("");
          }}
        >
          {/* HEADER */}
          <div className="px-5 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-800">
              {actionType === "approve" && "Approve Request"}
              {actionType === "reject" && "Reject Request"}
              {actionType === "clarify" && "Request Clarification"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {currentRecord?.requestId}
            </p>
          </div>

          {/* BODY */}
          <div className="px-5 py-4 bg-slate-50">
            {/* APPROVE CONTENT */}
            {actionType === "approve" && (
              <div className="rounded bg-white border p-3">
                <p className="text-sm text-gray-700">
                  Approve <b>{currentRecord?.requestId}</b>?
                </p>
              </div>
            )}

            {/* REJECT CONTENT */}
            {actionType === "reject" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Reason <span className="text-red-500">*</span>
                </label>
                <Input.TextArea
                  rows={3}
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="rounded text-sm"
                />
              </div>
            )}

            {/* CLARIFICATION CONTENT */}
            {actionType === "clarify" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Question <span className="text-red-500">*</span>
                </label>
                <Input.TextArea
                  rows={3}
                  value={actionText}
                  onChange={(e) => setActionText(e.target.value)}
                  placeholder="What additional information do you need?"
                  className="rounded text-sm"
                />
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex justify-end gap-2 px-5 py-3 bg-white border-t border-gray-200">
            <Button
              size="middle"
              onClick={() => {
                setActionType(null);
                setActionText("");
              }}
              className="px-4 text-xs"
            >
              Cancel
            </Button>

            <Button
              size="middle"
              type="primary"
              className={
                actionType === "approve"
                  ? "bg-green-500 hover:bg-green-600 border-none px-5 text-xs"
                  : actionType === "reject"
                    ? "bg-red-500 hover:bg-red-600 border-none px-5 text-xs"
                    : "bg-blue-500 hover:bg-blue-600 border-none px-5 text-xs"
              }
              onClick={async () => {
                if (!currentRecord) return;

                if ((actionType === "reject" || actionType === "clarify") && !actionText.trim()) {
                  message.error("Message required");
                  return;
                }

                if (actionType === "approve") {
                  await performManagerAction({ id: currentRecord.id, data: { action: "APPROVE" } });
                }

                if (actionType === "reject") {
                  await performManagerAction({ id: currentRecord.id, data: { action: "REJECT", comments: actionText } });
                }

                if (actionType === "clarify") {
                  await performManagerAction({ id: currentRecord.id, data: { action: "CLARIFY", comments: actionText } });
                }

                setActionType(null);
                setActionText("");
              }}
            >
              {actionType === "approve"
                ? "Approve"
                : actionType === "reject"
                  ? "Reject"
                  : "Send"}
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
    // </Card>
  );
}
