"use client";

import NoData from "@/components/common/NoData";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import {
  Typography,
  Button,
  Table,
  Input,
  Select,
  Modal,
  Avatar,
  App,
  Dropdown,
  Tooltip,
  Drawer,
  Popconfirm,
  DatePicker,
  Space,
} from "antd";
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  VideoCameraOutlined,
  AudioOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  EllipsisOutlined,
  RestOutlined,
  BankOutlined,
  WalletOutlined,
  ArrowLeftOutlined,
  UndoOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { TransactionsService, Transaction } from "@/services/transactionsService";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePermission } from "@/hooks/usePermission";
import {
  Menu,
  Trash2,
  Paperclip,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Clock,
  User as UserIcon,
  Tag as TagIcon,
  DollarSign,
  Layers,
} from "lucide-react";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

dayjs.extend(relativeTime);

const { Text } = Typography;
const { RangePicker } = DatePicker;

export default function AccountTrashPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { message: messageApi } = App.useApp();
  const { canReadAccount, canDeleteAccount, canUpdateAccount } = usePermission();

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savedView, setSavedView] = useState<"all" | "credit" | "debit">("all");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  // Views & Layout
  const [view, setView] = useState<"list" | "grid">("list");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // View Details Drawer & Preview Modal
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
  const [previewingAttachment, setPreviewingAttachment] = useState<{
    name: string;
    url?: string;
    base64?: string;
    size?: number;
    type?: string;
  } | null>(null);

  const searchRef = useRef<any>(null);

  // Expense categories
  const { data: categoriesResponse } = useExpenseCategories();
  const expenseCategories = categoriesResponse?.data || [];

  // Helpers
  const formatCurrency = (amount?: number): string => {
    if (amount === undefined || amount === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const initialsOf = (name?: string): string => {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      salary: "#10b981",
      bonus: "#059669",
      office_supplies: "#f59e0b",
      software_subscription: "#3b82f6",
      travel: "#8b5cf6",
      marketing: "#ec4899",
      rent: "#6366f1",
      utilities: "#14b8a6",
      consulting: "#f97316",
      hardware: "#06b6d4",
      meals_entertainment: "#84cc16",
      training_development: "#a855f7",
      legal_professional: "#64748b",
      miscellaneous: "#94a3b8",
      other: "#94a3b8",
    };
    return colors[category] || "#3b82f6";
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getAttachmentFileType = (name: string, type?: string): string => {
    if (type) return type.toLowerCase();
    const ext = (name || "").split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image/" + ext;
    if (ext === "pdf") return "application/pdf";
    if (["doc", "docx"].includes(ext)) return "application/msword";
    if (["xls", "xlsx", "csv"].includes(ext)) return "application/vnd.ms-excel";
    if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "application/zip";
    if (["mp4", "webm", "mov", "avi"].includes(ext)) return "video/" + ext;
    if (["mp3", "wav", "ogg"].includes(ext)) return "audio/" + ext;
    if (["txt", "log", "md"].includes(ext)) return "text/plain";
    return "application/octet-stream";
  };

  const getFileIcon = (fileName: string, fileType?: string) => {
    const type = getAttachmentFileType(fileName, fileType);
    const iconStyle = { fontSize: "16px" };

    if (type.includes("image")) {
      return { icon: <FileImageOutlined style={iconStyle} />, color: "#10b981", bg: "rgba(16, 185, 129, 0.10)" };
    }
    if (type.includes("pdf")) {
      return { icon: <FilePdfOutlined style={iconStyle} />, color: "#ef4444", bg: "rgba(239, 68, 68, 0.10)" };
    }
    if (type.includes("word") || type.includes("msword") || type.includes("document") || /\.(docx?)$/i.test(fileName)) {
      return { icon: <FileWordOutlined style={iconStyle} />, color: "#3b82f6", bg: "rgba(59, 130, 246, 0.10)" };
    }
    if (type.includes("excel") || type.includes("spreadsheet") || type.includes("sheet") || /\.(xlsx?|csv)$/i.test(fileName)) {
      return { icon: <FileExcelOutlined style={iconStyle} />, color: "#10b981", bg: "rgba(16, 185, 129, 0.10)" };
    }
    if (type.includes("zip") || type.includes("rar") || type.includes("7z") || type.includes("tar") || type.includes("gz")) {
      return { icon: <FileZipOutlined style={iconStyle} />, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.10)" };
    }
    if (type.includes("video")) {
      return { icon: <VideoCameraOutlined style={iconStyle} />, color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.10)" };
    }
    if (type.includes("audio")) {
      return { icon: <AudioOutlined style={iconStyle} />, color: "#ec4899", bg: "rgba(236, 72, 153, 0.10)" };
    }
    return { icon: <FileTextOutlined style={iconStyle} />, color: "#64748b", bg: "rgba(100, 116, 139, 0.10)" };
  };

  const handleDownloadAttachment = (e: React.MouseEvent, fileUrl?: string, fileName?: string, base64?: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (fileUrl) {
      const proxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName || "download")}`;
      const link = document.createElement("a");
      link.href = proxyUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (base64) {
      const link = document.createElement("a");
      link.href = base64;
      link.download = fileName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Fetch trash transactions
  const fetchTrash = async () => {
    if (!canReadAccount) return;
    setLoading(true);
    try {
      const response = await TransactionsService.getTrashTransactions({
        page,
        limit: pageSize,
        search: searchTerm || undefined,
      });
      setTransactions(response.data || []);
      setTotal(response.pagination?.total || 0);
    } catch (error: any) {
      messageApi.error(error.message || "Failed to fetch trash transactions");
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchText);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    fetchTrash();
  }, [page, pageSize, searchTerm, canReadAccount]);

  // Client-side filtering for views / categories / date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (savedView === "credit" && t.type !== "credit") return false;
      if (savedView === "debit" && t.type !== "debit") return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (dateRange && dateRange[0] && dateRange[1]) {
        const d = dayjs(t.date || t.createdAt);
        if (d.isBefore(dateRange[0].startOf("day")) || d.isAfter(dateRange[1].endOf("day"))) {
          return false;
        }
      }
      return true;
    });
  }, [transactions, savedView, categoryFilter, dateRange]);

  // Metric stats calculated from trashed items
  const stats = useMemo(() => {
    const totalCount = total;
    const currentList = transactions;
    const totalVal = currentList.reduce((sum, t) => sum + (t.amount || 0), 0);
    const credits = currentList.filter((t) => t.type === "credit");
    const debits = currentList.filter((t) => t.type === "debit");
    const creditsTotal = credits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const debitsTotal = debits.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      totalCount,
      totalVal,
      creditsCount: credits.length,
      creditsTotal,
      debitsCount: debits.length,
      debitsTotal,
    };
  }, [transactions, total]);

  const viewCounts = useMemo(() => {
    return {
      all: total,
      credit: transactions.filter((t) => t.type === "credit").length,
      debit: transactions.filter((t) => t.type === "debit").length,
    };
  }, [transactions, total]);

  // Actions: Restore & Permanent Delete
  const handleRestore = async (id: string) => {
    setActionLoading(true);
    try {
      await TransactionsService.restoreTransaction(id);
      messageApi.success("Transaction restored successfully");
      if (viewTransaction?.id === id) {
        setViewDrawerVisible(false);
        setViewTransaction(null);
      }
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
      fetchTrash();
    } catch (error: any) {
      messageApi.error(error.message || "Failed to restore transaction");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePermanentDelete = async (id: string) => {
    setActionLoading(true);
    try {
      await TransactionsService.permanentlyDeleteTransaction(id);
      messageApi.success("Transaction permanently deleted");
      if (viewTransaction?.id === id) {
        setViewDrawerVisible(false);
        setViewTransaction(null);
      }
      setSelectedRowKeys((prev) => prev.filter((k) => k !== id));
      fetchTrash();
    } catch (error: any) {
      messageApi.error(error.message || "Failed to delete transaction");
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Actions
  const handleBulkRestore = async () => {
    if (selectedRowKeys.length === 0) return;
    setActionLoading(true);
    try {
      await Promise.all(selectedRowKeys.map((id) => TransactionsService.restoreTransaction(String(id))));
      messageApi.success(`Successfully restored ${selectedRowKeys.length} transactions`);
      setSelectedRowKeys([]);
      fetchTrash();
    } catch (error: any) {
      messageApi.error(error.message || "Failed to restore selected transactions");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    setActionLoading(true);
    try {
      await Promise.all(
        selectedRowKeys.map((id) => TransactionsService.permanentlyDeleteTransaction(String(id)))
      );
      messageApi.success(`Permanently deleted ${selectedRowKeys.length} transactions`);
      setSelectedRowKeys([]);
      fetchTrash();
    } catch (error: any) {
      messageApi.error(error.message || "Failed to delete selected transactions");
    } finally {
      setActionLoading(false);
    }
  };

  const showViewDrawer = (transaction: Transaction) => {
    setViewTransaction(transaction);
    setViewDrawerVisible(true);
  };

  // Stat card definitions
  const statCells = useMemo(() => {
    return [
      {
        key: "total",
        title: "Items in Trash",
        value: stats.totalCount.toString(),
        icon: <RestOutlined />,
        color: "#ef4444",
        tint: "rgba(239, 68, 68, 0.10)",
        delta: stats.totalCount,
        deltaLabel: "deleted items",
      },
      {
        key: "value",
        title: "Total Volume",
        value: formatCurrency(stats.totalVal),
        icon: <WalletOutlined />,
        color: "#3b82f6",
        tint: "rgba(59, 130, 246, 0.10)",
        delta: transactions.length,
        deltaLabel: "on page",
      },
      {
        key: "credits",
        title: "Deleted Credits",
        value: formatCurrency(stats.creditsTotal),
        icon: <ArrowUpOutlined />,
        color: "#10b981",
        tint: "rgba(16, 185, 129, 0.10)",
        delta: stats.creditsCount,
        deltaLabel: "transactions",
      },
      {
        key: "debits",
        title: "Deleted Debits",
        value: formatCurrency(stats.debitsTotal),
        icon: <ArrowDownOutlined />,
        color: "#64748b",
        tint: "rgba(100, 116, 139, 0.10)",
        delta: stats.debitsCount,
        deltaLabel: "transactions",
      },
    ];
  }, [stats, transactions]);

  // Sidebar views
  const views = [
    { key: "all" as const, label: "All Trashed", icon: <Layers size={14} />, color: "#ef4444" },
    { key: "credit" as const, label: "Credits (Money In)", icon: <ArrowUpOutlined />, color: "#10b981" },
    { key: "debit" as const, label: "Debits (Money Out)", icon: <ArrowDownOutlined />, color: "#64748b" },
  ];

  // Action Menu for each item
  const actionMenu = (record: Transaction) => ({
    items: [
      {
        key: "view",
        label: (
          <div className="pp-menu-item">
            <div className="pp-menu-ic" style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}>
              <EyeOutlined />
            </div>
            <div className="pp-menu-text">
              <span className="pp-menu-title">View Details</span>
              <span className="pp-menu-desc">Inspect transaction info & attachments</span>
            </div>
          </div>
        ),
        onClick: () => showViewDrawer(record),
      },
      {
        type: "divider" as const,
      },
      {
        key: "restore",
        label: (
          <div className="pp-menu-item">
            <div className="pp-menu-ic" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
              <RotateCcw size={14} />
            </div>
            <div className="pp-menu-text">
              <span className="pp-menu-title" style={{ color: "#10b981" }}>Restore Item</span>
              <span className="pp-menu-desc">Move back to active transactions</span>
            </div>
          </div>
        ),
        onClick: () => handleRestore(record.id),
      },
      ...(canDeleteAccount
        ? [
          {
            type: "divider" as const,
          },
          {
            key: "delete",
            danger: true,
            label: (
              <Popconfirm
                title="Permanent Delete"
                description="This action cannot be undone. Are you sure you want to permanently erase this transaction?"
                onConfirm={() => handlePermanentDelete(record.id)}
                okText="Delete Forever"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <div className="pp-menu-item" onClick={(e) => e.stopPropagation()}>
                  <div className="pp-menu-ic" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                    <Trash2 size={14} />
                  </div>
                  <div className="pp-menu-text">
                    <span className="pp-menu-title" style={{ color: "#ef4444" }}>Delete Forever</span>
                    <span className="pp-menu-desc">Irrevocably erase transaction</span>
                  </div>
                </div>
              </Popconfirm>
            ),
          },
        ]
        : []),
    ],
  });

  // Table Columns
  const columns: ColumnsType<Transaction> = [
    {
      title: "DATE & TIME",
      dataIndex: "date",
      key: "date",
      width: 140,
      render: (date: string, record: Transaction) => {
        const d = dayjs(date || record.createdAt);
        return (
          <div className="pp-date">
            <span className="pp-date-main">{d.format("MMM D, YYYY")}</span>
            <span className="pp-date-sub">{d.format("h:mm A")}</span>
          </div>
        );
      },
    },
    {
      title: "TYPE",
      dataIndex: "type",
      key: "type",
      width: 110,
      render: (type: string) => {
        const isCredit = type === "credit";
        const color = isCredit ? "#10b981" : "#64748b";
        const bg = isCredit ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)";
        const border = isCredit ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.25)";
        return (
          <span className="pp-vis-pill" style={{ color, background: bg, borderColor: border }}>
            <span className="pp-vis-dot" style={{ background: color }} />
            {type.toUpperCase()}
          </span>
        );
      },
    },
    {
      title: "AMOUNT",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      align: "right",
      render: (amount: number, record: Transaction) => {
        const isCredit = record.type === "credit";
        return (
          <span
            style={{
              fontWeight: 700,
              fontSize: "12.5px",
              color: isCredit ? "#10b981" : "var(--text-slate-900)",
            }}
          >
            {isCredit ? "+" : "-"}
            {formatCurrency(amount)}
          </span>
        );
      },
    },
    {
      title: "MEMBER",
      dataIndex: "member",
      key: "member",
      width: 160,
      render: (_: any, record: Transaction) => {
        const m = typeof record.member === "object" ? record.member : null;
        if (!m) return <Text className="pp-muted">—</Text>;
        return (
          <div className="pp-creator">
            <Avatar
              size={20}
              src={m.avatarUrl}
              style={{ background: "rgba(59,130,246,0.10)", color: "#3b82f6", fontSize: 9, fontWeight: 700 }}
            >
              {initialsOf(m.name)}
            </Avatar>
            <span className="pp-creator-name">{m.name}</span>
          </div>
        );
      },
    },
    {
      title: "CATEGORY",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (category: string, record: Transaction) => {
        const isCredit = record.type === "credit";
        const color = isCredit ? "#10b981" : "#64748b";
        const bg = isCredit ? "rgba(16,185,129,0.10)" : "rgba(100,116,139,0.10)";
        return (
          <span className="pp-tag" style={{ background: bg, color }}>
            <span className="pp-tag-dot" />
            {(category || "uncategorized").replace("_", " ").toUpperCase()}
          </span>
        );
      },
    },
    {
      title: "DESCRIPTION",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--text-slate-900)",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: "1.4",
              maxWidth: "340px",
            }}
          >
            {text || "—"}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "DELETED",
      dataIndex: "updatedAt",
      key: "deletedAt",
      width: 130,
      render: (date: string, record: any) => {
        const d = record.deletedAt || date;
        return (
          <Tooltip title={dayjs(d).format("MMM D, YYYY h:mm A")}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-slate-500)", fontSize: "11.5px" }}>
              <Clock size={12} style={{ color: "#ef4444" }} />
              <span>{dayjs(d).fromNow()}</span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "center",
      width: 110,
      fixed: "right",
      render: (_, record: Transaction) => (
        <Space size={4} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Restore Transaction">
            <Button
              type="text"
              size="small"
              className="pp-icon-btn"
              icon={<RotateCcw size={14} style={{ color: "#10b981" }} />}
              onClick={() => handleRestore(record.id)}
            />
          </Tooltip>
          {canDeleteAccount && (
            <Popconfirm
              title="Permanent Delete"
              description="Permanently delete this transaction?"
              onConfirm={() => handlePermanentDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete Forever">
                <Button
                  type="text"
                  size="small"
                  className="pp-icon-btn"
                  icon={<Trash2 size={14} style={{ color: "#ef4444" }} />}
                />
              </Tooltip>
            </Popconfirm>
          )}
          <Dropdown
            menu={actionMenu(record)}
            overlayClassName="pp-action-pop"
            trigger={["click"]}
            placement="bottomRight"
          >
            <Button type="text" className="pp-icon-btn" icon={<EllipsisOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  // Pagination calculation
  const pageStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, total);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  // Access denied fallback
  if (!canReadAccount) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <AlertCircle size={48} className="text-slate-300 mb-4" />
          <Typography.Title level={4}>Access Denied</Typography.Title>
          <Typography.Paragraph type="secondary">
            You don&apos;t have permission to access the Accounts Trash.
          </Typography.Paragraph>
          <Button type="primary" onClick={() => router.push("/accounts/accounts-dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="pp-shell">
        {/* ============================ MOBILE BACKDROP ============================ */}
        {isMobileOpen && <div className="pp-backdrop" onClick={() => setIsMobileOpen(false)} />}

        {/* ============================ SIDEBAR ============================ */}
        <aside className={`pp-sidebar ${isMobileOpen ? "is-open" : ""}`}>
          <div className="pp-side-head">
            <div className="pp-side-logo" style={{ color: "#ef4444" }}>
              <Trash2 size={22} color="#ef4444" />
            </div>
            <div className="pp-side-head-text">
              <div className="pp-side-title">Accounts Trash</div>
              <div className="pp-side-subtitle">Deleted Transactions</div>
            </div>
          </div>

          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            className="pp-back-btn"
            onClick={() => router.push("/accounts/accounts-dashboard")}
            block
          >
            Back to Dashboard
          </Button>

          <div className="pp-side-scroll">
            <div className="pp-side-section-label">Views</div>
            <div className="pp-side-list">
              {views.map((v) => {
                const active = savedView === v.key;
                return (
                  <button
                    key={v.key}
                    type="button"
                    className={`pp-view-item ${active ? "is-active" : ""}`}
                    onClick={() => setSavedView(v.key)}
                  >
                    <span className="pp-view-icon" style={{ color: active ? v.color : "var(--text-slate-400)" }}>
                      {v.icon}
                    </span>
                    <span className="pp-view-label">{v.label}</span>
                    <span className="pp-view-count">{viewCounts[v.key]}</span>
                  </button>
                );
              })}
            </div>

            <div className="pp-side-section-label">Filters</div>
            <div className="pp-side-filters">
              <SearchableDropdown
                className="pp-side-sd"
                placeholder="Category"
                searchPlaceholder="Search categories"
                itemNoun="categories"
                value={categoryFilter ?? undefined}
                onChange={(v) => setCategoryFilter(v ?? undefined)}
                options={expenseCategories.map((c: any) => ({ value: c.name, label: c.name }))}
                width={212}
                disabled={expenseCategories.length === 0}
              />
              <RangePicker
                className="pp-side-range"
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
                placeholder={["Start date", "End date"]}
                separator={<span style={{ color: "var(--text-slate-400)" }}>›</span>}
                suffixIcon={null}
                format="MMM D"
              />
              {(categoryFilter || dateRange || searchText) && (
                <button
                  type="button"
                  className="pp-clear-filters"
                  onClick={() => {
                    setCategoryFilter(undefined);
                    setDateRange(null);
                    setSearchText("");
                  }}
                >
                  <CloseCircleOutlined /> Clear filters
                </button>
              )}
            </div>

            {selectedRowKeys.length > 0 && (
              <>
                <div className="pp-side-section-label">Selected Actions ({selectedRowKeys.length})</div>
                <div className="pp-side-list">
                  <button
                    type="button"
                    className="pp-view-item"
                    onClick={handleBulkRestore}
                    style={{ color: "#10b981" }}
                  >
                    <span className="pp-view-icon"><RotateCcw size={14} /></span>
                    <span className="pp-view-label">Restore Selected</span>
                  </button>
                  {canDeleteAccount && (
                    <Popconfirm
                      title="Bulk Permanent Delete"
                      description={`Are you sure you want to permanently delete ${selectedRowKeys.length} items?`}
                      onConfirm={handleBulkPermanentDelete}
                      okText="Delete Forever"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <button
                        type="button"
                        className="pp-view-item"
                        style={{ color: "#ef4444" }}
                      >
                        <span className="pp-view-icon"><Trash2 size={14} /></span>
                        <span className="pp-view-label">Delete Forever</span>
                      </button>
                    </Popconfirm>
                  )}
                  <button
                    type="button"
                    className="pp-view-item"
                    onClick={() => setSelectedRowKeys([])}
                  >
                    <span className="pp-view-icon"><CloseCircleOutlined /></span>
                    <span className="pp-view-label">Deselect All</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ============================ MAIN CONTENT ============================ */}
        <main className="pp-main">
          {/* Topbar */}
          <div className="pp-topbar">
            <button className="pp-mobile-toggle" onClick={() => setIsMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="pp-search-wrap">
              <SearchOutlined className="pp-search-icon" />
              <input
                ref={searchRef}
                className="pp-search"
                placeholder="Search trash descriptions, categories, amounts…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="pp-topbar-meta">
              <span className="pp-meta-item">
                <span className="pp-pulse pp-pulse--red" />
                <strong>{total}</strong> items in trash
              </span>
              <span className="pp-meta-dot">·</span>
              <span className="pp-meta-item">
                <strong>{formatCurrency(stats.totalVal)}</strong> trashed volume
              </span>
            </div>

            {selectedRowKeys.length > 0 && (
              <div className="pp-bulk-bar">
                <span className="pp-bulk-badge">{selectedRowKeys.length} selected</span>
                <Button
                  size="small"
                  type="primary"
                  icon={<UndoOutlined />}
                  onClick={handleBulkRestore}
                  loading={actionLoading}
                  style={{ background: "#10b981", borderColor: "#10b981", borderRadius: 6, fontSize: "11.5px" }}
                >
                  Restore ({selectedRowKeys.length})
                </Button>
                {canDeleteAccount && (
                  <Popconfirm
                    title="Permanent Delete"
                    description={`Permanently delete ${selectedRowKeys.length} selected transactions?`}
                    onConfirm={handleBulkPermanentDelete}
                    okText="Delete Forever"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      size="small"
                      danger
                      type="primary"
                      icon={<DeleteOutlined />}
                      loading={actionLoading}
                      style={{ borderRadius: 6, fontSize: "11.5px" }}
                    >
                      Delete Forever
                    </Button>
                  </Popconfirm>
                )}
                <Button
                  size="small"
                  type="text"
                  onClick={() => setSelectedRowKeys([])}
                  style={{ fontSize: "11.5px", color: "var(--text-slate-500)" }}
                >
                  Clear
                </Button>
              </div>
            )}

            <div className="pp-topbar-actions">
              <div className="pp-segmented">
                <button
                  type="button"
                  className={view === "list" ? "is-active" : ""}
                  onClick={() => setView("list")}
                  aria-label="List view"
                >
                  <UnorderedListOutlined />
                </button>
                <button
                  type="button"
                  className={view === "grid" ? "is-active" : ""}
                  onClick={() => setView("grid")}
                  aria-label="Grid view"
                >
                  <AppstoreOutlined />
                </button>
              </div>
              <Tooltip title="Refresh Trash">
                <button type="button" className="pp-ghost-btn" onClick={fetchTrash}>
                  <ReloadOutlined spin={loading} />
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="pp-divider" />

          {/* Sprint Header (Stats) */}
          <div className="pp-sprint-head-v2">
            <div className="pp-sprint-row1">
              <div className="pp-sprint-title-block">
                <div className="pp-sprint-dot" style={{ background: '#ef4444' }} />
                <h2 className="pp-sprint-title">Accounts — Deleted Items</h2>
                <div className="pp-sprint-tags">
                  <span className="pp-sprint-tag pp-sprint-tag-delayed" style={{ borderColor: 'rgba(239, 68, 68, 0.32)' }}>TRASH</span>
                </div>
              </div>
            </div>
            <div className="pp-sprint-row2">
              <span className="pp-sprint-meta">
                <CalendarOutlined style={{ fontSize: 11 }} />
                <span>All Time</span>
              </span>
              {statCells.map((s) => (
                <span key={s.key} className="pp-sprint-meta">
                  <span style={{ color: s.color, display: 'flex', alignItems: 'center' }}>{s.icon}</span>
                  {s.title}: <b>{s.value}</b>
                </span>
              ))}
            </div>
            <div className="pp-sprint-row3">
              <div className="pp-sprint-progress-bar">
                <div
                  className="pp-sprint-progress-fill"
                  style={{ width: `100%`, background: 'linear-gradient(90deg, #ef4444, #fca5a5)' }}
                />
              </div>
              <span className="pp-sprint-progress-pct">100%</span>
            </div>
          </div>

          {/* Table / Grid Content */}
          <div className="pp-body">
            {view === "list" ? (
              <div className="pp-table-wrap">
                <ZukvoLoadingOverlay loading={loading} message="">
                  <Table
                    columns={columns}
                    dataSource={filteredTransactions}
                    rowKey="id"
                    pagination={false}
                    rowSelection={{
                      selectedRowKeys,
                      onChange: (newSelectedRowKeys) => setSelectedRowKeys(newSelectedRowKeys),
                    }}
                    rowClassName={() => "pp-row"}
                    onRow={(record) => ({
                      onClick: () => showViewDrawer(record),
                    })}
                    locale={{
                      emptyText: (
                        <div className="pp-empty">
                          <div className="pp-empty-orb" style={{ background: "rgba(239, 68, 68, 0.10)", color: "#ef4444" }}>
                            <Trash2 size={26} />
                          </div>
                          <div className="pp-empty-title">Trash is Empty</div>
                          <div className="pp-empty-sub">No deleted transactions found matching your criteria.</div>
                        </div>
                      ),
                    }}
                    className="pp-table"
                  />
                </ZukvoLoadingOverlay>
              </div>
            ) : (
              /* Grid View */
              <div className="pp-grid">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === "credit";
                  const color = getCategoryColor(tx.category);
                  const member = typeof tx.member === "object" ? tx.member : null;
                  return (
                    <div
                      key={tx.id}
                      className="pc-card"
                      onClick={() => showViewDrawer(tx)}
                    >
                      <div className="pc-top">
                        <div className="pc-avatar" style={{ background: color }}>
                          {initialsOf(tx.description || tx.category)}
                        </div>
                        <div className="pc-identity-body">
                          <div className="pc-title" title={tx.description}>
                            {tx.description || "No description"}
                          </div>
                          <div className="pc-client-line">
                            <span className="pc-client-key">Category:</span>
                            <span className="pc-client-val">{(tx.category || "other").replace("_", " ")}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Restore">
                            <button
                              type="button"
                              className="pc-actions"
                              onClick={() => handleRestore(tx.id)}
                            >
                              <RotateCcw size={14} style={{ color: "#10b981" }} />
                            </button>
                          </Tooltip>
                          {canDeleteAccount && (
                            <Popconfirm
                              title="Delete Permanently"
                              description="Irrevocably erase this item?"
                              onConfirm={() => handlePermanentDelete(tx.id)}
                              okText="Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <button type="button" className="pc-actions">
                                <Trash2 size={14} style={{ color: "#ef4444" }} />
                              </button>
                            </Popconfirm>
                          )}
                        </div>
                      </div>

                      <div className="pc-foot">
                        <div className="pc-foot-row">
                          <div className="pc-foot-item">
                            <span className="pc-foot-key">Amount:</span>
                            <span
                              style={{
                                fontWeight: 700,
                                color: isCredit ? "#10b981" : "var(--text-slate-900)",
                              }}
                            >
                              {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                            </span>
                          </div>
                          <div className="pc-foot-div" />
                          <div className="pc-foot-item">
                            <span className="pc-foot-key">Type:</span>
                            <span
                              className="pp-vis-pill"
                              style={{
                                height: 18,
                                padding: "0 6px",
                                fontSize: 10,
                                color: isCredit ? "#10b981" : "#64748b",
                                background: isCredit ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                              }}
                            >
                              {tx.type.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="pc-foot-row">
                          <div className="pc-foot-item">
                            <Clock size={11} style={{ color: "#3b82f6", marginRight: 3 }} />
                            <span style={{ fontSize: 10.5, color: "var(--text-slate-500)" }}>
                              Deleted {dayjs(tx.updatedAt).fromNow()}
                            </span>
                          </div>
                          {member && (
                            <>
                              <div className="pc-foot-div" />
                              <div className="pc-foot-item">
                                <UserIcon size={11} style={{ marginRight: 3, color: "var(--text-slate-400)" }} />
                                <span style={{ fontSize: 10.5, color: "var(--text-slate-600)" }}>{member.name}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============================ FIXED FOOTER ============================ */}
          <footer className="pp-footer pp-footer--sticky">
            <div className="pp-footer-info">
              Showing <strong>{pageStart}–{pageEnd}</strong> of <strong>{total}</strong> deleted entries
            </div>

            <div className="pp-pager">
              <button
                type="button"
                className="pp-pager-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ‹
              </button>

              {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                let p = i + 1;
                if (pageCount > 5 && page > 3) {
                  p = page - 2 + i;
                  if (p > pageCount) p = pageCount - 4 + i;
                }
                return (
                  <button
                    key={p}
                    type="button"
                    className={`pp-pager-num ${page === p ? "is-active" : ""}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                );
              })}

              <button
                type="button"
                className="pp-pager-btn"
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                ›
              </button>

              <Select
                className="pp-pagesize"
                value={pageSize}
                onChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                options={[
                  { value: 10, label: "10 / page" },
                  { value: 15, label: "15 / page" },
                  { value: 20, label: "20 / page" },
                  { value: 25, label: "25 / page" },
                  { value: 50, label: "50 / page" },
                  { value: 100, label: "100 / page" },
                ]}
                popupMatchSelectWidth={false}
              />
            </div>
          </footer>
        </main>
      </div>

      {/* ============================ VIEW DETAILS DRAWER ============================ */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "rgba(59, 130, 246, 0.12)",
                color: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-slate-900)" }}>
                Deleted Transaction Details
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-slate-400)", fontWeight: 600 }}>
                This item is currently in Trash
              </div>
            </div>
          </div>
        }
        placement="right"
        width={680}
        open={viewDrawerVisible}
        onClose={() => {
          setViewDrawerVisible(false);
          setViewTransaction(null);
        }}
        destroyOnClose
        extra={
          <Space size={8}>
            {viewTransaction && (
              <Button
                type="primary"
                icon={<RotateCcw size={14} />}
                onClick={() => handleRestore(viewTransaction.id)}
                size="small"
                style={{ borderRadius: 6, background: "#10b981", borderColor: "#10b981", fontWeight: 600 }}
              >
                Restore
              </Button>
            )}
            {viewTransaction && canDeleteAccount && (
              <Popconfirm
                title="Permanent Delete"
                description="This action cannot be undone. Are you sure you want to permanently erase this transaction?"
                onConfirm={() => handlePermanentDelete(viewTransaction.id)}
                okText="Delete Forever"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  danger
                  type="primary"
                  icon={<Trash2 size={14} />}
                  size="small"
                  style={{ borderRadius: 6, fontWeight: 600 }}
                >
                  Delete Forever
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
        styles={{
          header: {
            borderBottom: "1px solid var(--accounts-card-border)",
            padding: "14px 20px",
            background: "var(--accounts-card-bg)",
          },
          body: { padding: 0, background: "var(--customers-page-bg)" },
        }}
      >
        {viewTransaction && (
          <div className="accounts-view-drawer__body">
            {/* Amount Banner Card */}
            <div
              className="accounts-view-banner"
              style={{
                borderColor: viewTransaction.type === "credit" ? "rgba(16,185,129,0.25)" : "rgba(59,130,246,0.25)",
              }}
            >
              <div className="accounts-view-banner__top">
                <div>
                  <span className="accounts-view-banner__label">Transaction Amount</span>
                  <div
                    className="accounts-view-banner__amount"
                    style={{ color: viewTransaction.type === "credit" ? "#10b981" : "var(--text-slate-900)" }}
                  >
                    {viewTransaction.type === "credit" ? "+" : "-"}
                    {formatCurrency(viewTransaction.amount)}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <span
                    className="pp-vis-pill"
                    style={{
                      color: viewTransaction.type === "credit" ? "#10b981" : "#64748b",
                      background: viewTransaction.type === "credit" ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.12)",
                      borderColor: viewTransaction.type === "credit" ? "rgba(16,185,129,0.25)" : "rgba(100,116,139,0.25)",
                      fontSize: "11px",
                      padding: "3px 10px",
                    }}
                  >
                    <span
                      className="pp-vis-dot"
                      style={{ background: viewTransaction.type === "credit" ? "#10b981" : "#64748b" }}
                    />
                    {viewTransaction.type.toUpperCase()}
                  </span>
                  <span
                    className="pp-tag"
                    style={{
                      fontSize: "11px",
                      padding: "3px 8px",
                      background: "rgba(59,130,246,0.10)",
                      color: "#3b82f6",
                    }}
                  >
                    <span className="pp-tag-dot" style={{ background: "#3b82f6" }} />
                    TRASHED
                  </span>
                </div>
              </div>
            </div>

            {/* General Information */}
            <div className="accounts-view-card">
              <div className="accounts-view-card__header">
                <div className="accounts-view-card__title">
                  <BankOutlined style={{ color: "#3b82f6", marginRight: 6 }} /> General Information
                </div>
              </div>
              <div className="accounts-view-grid">
                <div className="accounts-view-field">
                  <span className="accounts-view-field__label">Created By</span>
                  <div className="accounts-view-field__value">
                    {(() => {
                      const member = typeof viewTransaction.member === "object" ? (viewTransaction.member as any) : null;
                      if (!member) return <span style={{ color: "var(--text-slate-400)" }}>—</span>;
                      return (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar
                            size={24}
                            src={member.avatarUrl}
                            style={{
                              background: "rgba(59,130,246,0.12)",
                              color: "#3b82f6",
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {initialsOf(member.name)}
                          </Avatar>
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-slate-800)", fontSize: "12.5px" }}>
                              {member.name}
                            </div>
                            {member.position && (
                              <div style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>
                                {typeof member.position === "object" ? member.position?.title : member.position}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="accounts-view-field">
                  <span className="accounts-view-field__label">Original Date</span>
                  <div className="accounts-view-field__value">
                    <div style={{ fontWeight: 600, color: "var(--text-slate-800)", fontSize: "12.5px" }}>
                      {dayjs(viewTransaction.date).format("MMMM D, YYYY")}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>
                      {dayjs(viewTransaction.date).format("h:mm A")}
                    </div>
                  </div>
                </div>

                <div className="accounts-view-field">
                  <span className="accounts-view-field__label">Category</span>
                  <div className="accounts-view-field__value">
                    <span style={{ fontWeight: 600, textTransform: "capitalize", color: "var(--text-slate-800)" }}>
                      {(viewTransaction.category || "uncategorized").replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="accounts-view-field">
                  <span className="accounts-view-field__label">Deleted At</span>
                  <div className="accounts-view-field__value">
                    <span style={{ fontWeight: 600, color: "var(--text-slate-800)", fontSize: "12px" }}>
                      {dayjs(viewTransaction.updatedAt).format("MMM D, YYYY h:mm A")}
                    </span>
                    <div style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>
                      ({dayjs(viewTransaction.updatedAt).fromNow()})
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="accounts-view-card">
              <div className="accounts-view-card__header">
                <div className="accounts-view-card__title">
                  <FileTextOutlined style={{ color: "#3b82f6", marginRight: 6 }} /> Description
                </div>
              </div>
              <div className="accounts-view-card__content">
                <div style={{ fontSize: "13px", color: "var(--text-slate-800)", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
                  {viewTransaction.description || "No description provided."}
                </div>
              </div>
            </div>

            {/* Notes Card */}
            {viewTransaction.notes && (
              <div className="accounts-view-card">
                <div className="accounts-view-card__header">
                  <div className="accounts-view-card__title">
                    <FileTextOutlined style={{ color: "#64748b", marginRight: 6 }} /> Additional Notes
                  </div>
                </div>
                <div className="accounts-view-card__content">
                  <div style={{ fontSize: "12.5px", color: "var(--text-slate-700)", lineHeight: "1.5", whiteSpace: "pre-wrap" }}>
                    {viewTransaction.notes}
                  </div>
                </div>
              </div>
            )}

            {/* Attachments Card */}
            {(() => {
              const atts = viewTransaction.attachments || viewTransaction.metadata?.attachments || [];
              if (atts.length === 0) return null;
              return (
                <div className="accounts-view-card">
                  <div className="accounts-view-card__header">
                    <div className="accounts-view-card__title">
                      <Paperclip size={14} style={{ color: "#3b82f6", marginRight: 6 }} /> Attachments ({atts.length})
                    </div>
                  </div>
                  <div className="accounts-view-card__content">
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {atts.map((att: any, idx: number) => {
                        const { icon, color, bg } = getFileIcon(att.name, att.type);
                        return (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              background: "var(--bg-slate-50)",
                              border: "1px solid var(--border-slate-200)",
                              borderRadius: 8,
                              cursor: att.url ? "pointer" : "default",
                              transition: "all 0.15s ease",
                            }}
                            onClick={() => {
                              if (att.url) setPreviewingAttachment(att);
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: 8,
                                  background: bg,
                                  color: color,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {icon}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div
                                  style={{
                                    fontSize: "12.5px",
                                    fontWeight: 600,
                                    color: "var(--text-slate-800)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={att.name}
                                >
                                  {att.name}
                                </div>
                                {att.size ? (
                                  <div style={{ fontSize: "11px", color: "var(--text-slate-400)" }}>
                                    {formatFileSize(att.size)}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {att.url && (
                              <div
                                style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="small"
                                  icon={<EyeOutlined style={{ color: "#10b981" }} />}
                                  onClick={() => setPreviewingAttachment(att)}
                                  style={{ borderRadius: 6, fontSize: "11.5px", height: 28 }}
                                >
                                  View
                                </Button>
                                <Button
                                  size="small"
                                  icon={<DownloadOutlined style={{ color: "#3b82f6" }} />}
                                  onClick={(e) => handleDownloadAttachment(e, att.url, att.name)}
                                  style={{ borderRadius: 6, fontSize: "11.5px", height: 28 }}
                                >
                                  Download
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Drawer>

      {/* ============================ ATTACHMENT PREVIEW MODAL ============================ */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8, maxWidth: "90%" }}>
            <Paperclip size={15} style={{ color: "#3b82f6", flexShrink: 0 }} />
            <span style={{ fontSize: "14px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {previewingAttachment?.name}
            </span>
          </div>
        }
        open={!!previewingAttachment}
        onCancel={() => setPreviewingAttachment(null)}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setPreviewingAttachment(null)}>Close</Button>
            {previewingAttachment && (previewingAttachment.url || previewingAttachment.base64) && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={(e) =>
                  handleDownloadAttachment(e, previewingAttachment.url, previewingAttachment.name, previewingAttachment.base64)
                }
              >
                Download File
              </Button>
            )}
          </div>
        }
        width={840}
        centered
        destroyOnClose
        className="attachment-viewer-modal"
      >
        {previewingAttachment && (
          <div
            style={{
              width: "100%",
              height: "65vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: "var(--bg-slate-50)",
              borderRadius: 8,
            }}
          >
            {getAttachmentFileType(previewingAttachment.name, previewingAttachment.type).includes("image") ? (
              <img
                src={previewingAttachment.url || previewingAttachment.base64}
                alt={previewingAttachment.name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            ) : getAttachmentFileType(previewingAttachment.name, previewingAttachment.type).includes("pdf") ? (
              <iframe
                src={
                  previewingAttachment.url
                    ? `/api/download?url=${encodeURIComponent(previewingAttachment.url)}&name=${encodeURIComponent(previewingAttachment.name)}&inline=true`
                    : previewingAttachment.base64
                }
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title={previewingAttachment.name}
              />
            ) : previewingAttachment.url &&
              (getAttachmentFileType(previewingAttachment.name, previewingAttachment.type).includes("word") ||
                getAttachmentFileType(previewingAttachment.name, previewingAttachment.type).includes("msword") ||
                getAttachmentFileType(previewingAttachment.name, previewingAttachment.type).includes("excel") ||
                getAttachmentFileType(previewingAttachment.name, previewingAttachment.type).includes("spreadsheet") ||
                /\.(docx?|xlsx?|pptx?)$/i.test(previewingAttachment.name)) ? (
              <iframe
                src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewingAttachment.url)}&embedded=true`}
                width="100%"
                height="100%"
                style={{ border: "none", background: "#fff" }}
                title={previewingAttachment.name}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 24,
                  textAlign: "center",
                }}
              >
                <FileTextOutlined style={{ fontSize: 48, color: "var(--text-slate-400)", marginBottom: 12 }} />
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text-slate-800)", marginBottom: 4 }}>
                  {previewingAttachment.name}
                </div>
                <Typography.Text type="secondary" style={{ fontSize: "12px", marginBottom: 16 }}>
                  Direct preview is not available for this file type.
                </Typography.Text>
                {(previewingAttachment.url || previewingAttachment.base64) && (
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={(e) =>
                      handleDownloadAttachment(
                        e,
                        previewingAttachment.url,
                        previewingAttachment.name,
                        previewingAttachment.base64
                      )
                    }
                  >
                    Download File
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ============================ GLOBAL STYLES ============================ */}
      <style jsx global>{`
        .pp-shell {
          display: flex;
          margin: 0 -24px;
          height: calc(100vh - 54px);
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .pp-shell,
        .pp-shell *,
        .ant-table,
        .ant-btn,
        .ant-select,
        .ant-picker,
        .ant-input,
        .ant-modal,
        .ant-drawer,
        .ant-tooltip,
        .ant-popconfirm,
        .ant-dropdown {
          font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif !important;
        }

        /* Sidebar */
        .pp-sidebar {
          width: 264px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white);
          display: flex;
          flex-direction: column;
          padding: 14px 14px 0 38px;
          position: sticky;
          top: 0;
          height: calc(100vh - 54px);
          z-index: 31;
        }
        .pp-side-head {
          display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
          border-bottom: 1px solid var(--border-slate-100);
        }
        .pp-side-logo {
          flex-shrink: 0; display: flex; align-items: center; justify-content: center;
        }
        .pp-side-head-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
        .pp-side-subtitle {
          font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
          text-transform: uppercase; letter-spacing: 0.07em;
        }
        .pp-back-btn {
          height: 35px !important; border-radius: 8px !important; font-weight: 600 !important; font-size: 12.5px !important;
          background: #3B82F6 !important;
          border: none !important; box-shadow: none !important;
          margin-bottom: 12px;
          color: #fff !important;
        }
        .pp-back-btn:hover { background: #2563EB !important; }
        .pp-side-scroll {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 0;
          padding: 0;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .pp-side-scroll::-webkit-scrollbar {
          display: none;
        }
        .pp-side-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
          color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
        }
        .pp-side-scroll > .pp-side-section-label:first-child { margin-top: 6px; }
        .pp-side-list { display: flex; flex-direction: column; gap: 1px; }
        .pp-view-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
          cursor: pointer; transition: background .12s ease; text-align: left;
        }
        .pp-view-item:hover { background: var(--bg-slate-50); }
        .pp-view-item.is-active { background: var(--bg-blue-50); }
        .pp-view-item.is-active .pp-view-label { color: var(--text-slate-900); font-weight: 600; }
        .pp-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
        .pp-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
        .pp-view-count {
          font-size: 11.5px; font-weight: 600; color: var(--text-slate-400);
          min-width: 18px; text-align: right;
        }
        .pp-view-item.is-active .pp-view-count {
          color: #3b82f6; font-weight: 700;
          background: rgba(59,130,246,0.12); border-radius: 6px; padding: 1px 7px; min-width: 0;
        }
        .pp-side-filters { display: flex; flex-direction: column; gap: 7px; padding: 0; }
        .pp-side-sd { border-radius: 8px !important; }
        .pp-side-range.ant-picker {
          border-radius: 8px !important; border-color: var(--border-slate-200) !important;
          background: var(--bg-pure-white) !important;
          width: 100%; height: 35px;
        }
        .pp-clear-filters {
          display: inline-flex; align-items: center; gap: 5px; align-self: flex-start;
          background: none; border: none; cursor: pointer; padding: 3px;
          font-size: 12px; font-weight: 600; color: #64748b;
        }
        .pp-clear-filters:hover { color: #3b82f6; }

        /* Main Content */
        .pp-main { flex: 1; min-width: 0; padding: 8px 0 0 0; display: flex; flex-direction: column; overflow: hidden; }
        .pp-body { flex: 1; min-height: 0; padding-bottom: 60px; overflow-y: auto; overflow-x: hidden; }
        .pp-topbar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; flex-wrap: wrap; padding: 0 32px 0 20px; flex-shrink: 0; }
        .pp-search-wrap {
          position: relative; flex: 1; max-width: 480px; min-width: 240px; display: flex; align-items: center;
          height: 32px; border-radius: 8px; background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-200); padding: 0 10px;
        }
        .pp-search-wrap:focus-within { border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,0.10); }
        .pp-search-icon { color: var(--text-slate-400); font-size: 14px; }
        .pp-search {
          flex: 1; border: none; outline: none; background: transparent; margin-left: 9px;
          font-size: 13px; color: var(--text-slate-900);
        }
        .pp-search::placeholder { color: var(--text-slate-400); }
        .pp-topbar-meta { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text-slate-500); white-space: nowrap; }
        .pp-topbar-meta strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-meta-dot { color: var(--text-slate-300); }
        .pp-pulse { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 5px; }
        .pp-pulse--blue { background: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.2); }

        .pp-bulk-bar {
          display: flex; align-items: center; gap: 8px;
          background: rgba(59,130,246,0.06); border: 1px solid rgba(59,130,246,0.2);
          padding: 2px 8px; border-radius: 7px;
        }
        .pp-bulk-badge { font-size: 11px; font-weight: 700; color: #3b82f6; }

        .pp-topbar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .pp-segmented { display: inline-flex; border: 1px solid var(--border-slate-200); border-radius: 9px; overflow: hidden; background: var(--bg-pure-white); }
        .pp-segmented button {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          color: var(--text-slate-400); font-size: 14px; display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-segmented button.is-active { background: var(--bg-blue-50); color: #3b82f6; }
        .pp-ghost-btn {
          width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
          background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pp-ghost-btn:hover { color: #3b82f6; border-color: #bfdbfe; }

        .pp-divider { height: 1px; background: var(--border-slate-200); margin: 0 0 10px 0; flex-shrink: 0; }

        /* Sprint Header (Stats) */
        .pp-sprint-head-v2 { display: flex; flex-direction: column; gap: 2px; padding: 8px 20px 10px; background: var(--bg-pure-white); border-bottom: 1px solid var(--border-slate-200); margin-bottom: 0px; flex-shrink: 0; }
        .pp-sprint-row1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-bottom: 2px; }
        .pp-sprint-title-block { display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1 1 auto; }
        .pp-sprint-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .pp-sprint-title { font-size: 13px !important; font-weight: 800 !important; color: var(--text-slate-900) !important; letter-spacing: -0.01em; margin: 0; }
        .pp-sprint-tags { display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .pp-sprint-tag { display: inline-flex; align-items: center; height: 16px; padding: 0 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.04em; border-radius: 4px; border: 1px solid transparent; text-transform: uppercase; line-height: 1; }
        .pp-sprint-tag-delayed { background: transparent; color: #ef4444; border-color: rgba(239, 68, 68, 0.32); }
        .pp-sprint-row2 { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding-left: 14px; margin-bottom: 4px; }
        .pp-sprint-meta { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: var(--text-slate-500); letter-spacing: -0.005em; }
        .pp-sprint-meta b { color: var(--text-slate-900); font-weight: 800; }
        .pp-sprint-row3 { display: flex; align-items: center; gap: 10px; padding-left: 14px; }
        .pp-sprint-progress-bar { flex: 1 1 auto; position: relative; height: 5px; background: var(--bg-slate-100); border-radius: 999px; overflow: hidden; min-width: 60px; }
        .pp-sprint-progress-fill { position: absolute; inset: 0; border-radius: 999px; transition: width 0.4s ease; }
        .pp-sprint-progress-pct { flex-shrink: 0; font-size: 11px; font-weight: 800; color: var(--text-slate-900); font-variant-numeric: tabular-nums; min-width: 32px; }

        /* Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: none; border-bottom: 1px solid var(--border-slate-200); border-radius: 0; overflow: visible; }
        .pp-table-wrap ::-webkit-scrollbar { display: none !important; }
        .pp-table-wrap, .pp-table-wrap * { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .pp-table .ant-table, .pp-table .ant-table-container, .pp-table .ant-table-content { background: transparent; font-size: 12px; border-radius: 0 !important; overflow: visible !important; }
        .pp-table .ant-table-thead > tr > th {
          position: sticky; top: 0; z-index: 10;
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important; border-radius: 0 !important;
        }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr.pp-row:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-tbody > tr.pp-row { cursor: pointer; }

        .pp-date { display: flex; flex-direction: column; line-height: 1.25; }
        .pp-date-main { font-size: 11px; font-weight: 500; color: var(--text-slate-700); }
        .pp-date-sub { font-size: 9.5px; color: var(--text-slate-400); }

        .pp-vis-pill {
          display: inline-flex; align-items: center; gap: 5px; height: 23px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; border: 1px solid transparent; white-space: nowrap;
        }
        .pp-vis-dot { width: 6px; height: 6px; border-radius: 50%; }

        .pp-creator { display: flex; align-items: center; gap: 6px; }
        .pp-creator-name { font-size: 11.5px; color: var(--text-slate-700); white-space: nowrap; }

        .pp-tag {
          display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 8px;
          border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap;
        }
        .pp-tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
        .pp-muted { color: var(--text-slate-400); }

        .pp-icon-btn { color: var(--text-slate-400) !important; width: 26px !important; height: 26px !important; min-width: 26px !important; padding: 0 !important; }
        .pp-icon-btn:hover { color: var(--text-slate-900) !important; background: var(--bg-slate-100) !important; }

        /* Footer Sticky */
        .pp-footer {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
          padding: 10px 14px; border-top: 1px solid var(--border-slate-200);
        }
        .pp-footer--sticky {
          position: sticky; bottom: 0; z-index: 30;
          margin: 8px -32px 0 -20px;
          padding: 0 32px 0 20px;
          background: var(--bg-pure-white);
          box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
          height: 45px;
        }
        .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
        .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
        .pp-pager { display: flex; align-items: center; gap: 3px; }
        .pp-pager-btn, .pp-pager-num {
          min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
          background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
        }
        .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pp-pager-num.is-active { background: #3B82F6; border-color: #3B82F6; color: #fff; }
        .pp-pagesize { margin-left: 5px; }
        .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }

        /* Empty + Grid */
        .pp-empty { display: flex; flex-direction: column; align-items: center; padding: 56px 20px; }
        .pp-empty-orb {
          width: 64px; height: 64px; border-radius: 18px; display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .pp-empty-title { font-size: 16px; font-weight: 700; color: var(--text-slate-900); }
        .pp-empty-sub { font-size: 13px; color: var(--text-slate-400); margin-top: 4px; }
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; padding: 16px 20px; }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
          height: 144px;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }
        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; height: 64px; overflow: hidden; }
        .pc-avatar {
          width: 30px; height: 30px; border-radius: 6px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 800; font-size: 12px;
        }
        .pc-identity-body { display: flex; flex-direction: column; min-width: 0; gap: 3px; flex: 1; }
        .pc-actions {
          flex-shrink: 0; width: 26px; height: 26px; border-radius: 6px; border: none; cursor: pointer;
          background: transparent; color: var(--text-slate-400); display: inline-flex; align-items: center; justify-content: center;
        }
        .pc-actions:hover { background: var(--bg-slate-100); color: var(--text-slate-900); }
        .pc-title {
          font-size: 13px; font-weight: 700; color: var(--text-slate-900); letter-spacing: -0.01em; line-height: 1.3;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-client-line { display: flex; align-items: center; gap: 5px; font-size: 11.5px; min-width: 0; }
        .pc-client-key { color: var(--text-slate-400); font-weight: 600; flex-shrink: 0; }
        .pc-client-val { color: var(--text-slate-700); font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); height: 78px; justify-content: center; }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; padding: 6px 12px; overflow: hidden; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); overflow: hidden; white-space: nowrap; }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); flex-shrink: 0; }

        /* Action Menu */
        .pp-action-pop .ant-dropdown-menu {
          padding: 6px; border-radius: 0; min-width: 236px;
          background: var(--bg-pure-white);
          border: 1px solid var(--border-slate-100);
          box-shadow: 0 16px 40px rgba(15,23,42,0.18), 0 2px 8px rgba(15,23,42,0.06);
          overflow: hidden !important;
        }
        .pp-action-pop .ant-dropdown-menu-item {
          padding: 0 !important; border-radius: 0 !important; margin: 1px 0;
          transition: background .12s ease;
        }
        .pp-action-pop .ant-dropdown-menu-item:hover { background: var(--bg-slate-50) !important; }
        .pp-menu-item { display: flex; align-items: center; gap: 11px; padding: 7px 9px; }
        .pp-menu-ic {
          width: 30px; height: 30px; border-radius: 0; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center; font-size: 14px;
        }
        .pp-menu-text { display: flex; flex-direction: column; min-width: 0; }
        .pp-menu-title { font-size: 13px; font-weight: 600; color: var(--text-slate-900); }
        .pp-menu-desc { font-size: 11px; color: var(--text-slate-400); margin-top: 1px; }

        /* View Drawer styles */
        .accounts-view-drawer__body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .accounts-view-banner {
          border: 1px solid;
          border-radius: 12px;
          padding: 16px 20px;
          background: var(--accounts-card-bg, #fff);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
        }
        .accounts-view-banner__top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .accounts-view-banner__label {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-slate-400);
        }
        .accounts-view-banner__amount {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin-top: 2px;
        }
        .accounts-view-card {
          border: 1px solid var(--border-slate-200);
          border-radius: 12px;
          background: var(--accounts-card-bg, #fff);
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        .accounts-view-card__header {
          padding: 12px 18px;
          border-bottom: 1px solid var(--border-slate-100);
          background: var(--bg-slate-50);
        }
        .accounts-view-card__title {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--text-slate-800);
          display: flex;
          align-items: center;
        }
        .accounts-view-card__content {
          padding: 16px 18px;
        }
        .accounts-view-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px 20px;
          padding: 16px 18px;
        }
        .accounts-view-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .accounts-view-field__label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-slate-400);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .accounts-view-field__value {
          font-size: 13px;
          color: var(--text-slate-900);
        }

        .pp-mobile-toggle {
          display: none;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: var(--text-slate-600);
          margin-right: 12px;
        }
        .pp-backdrop {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(2px);
          z-index: 999;
        }

        @media (max-width: 1250px) {
          .pp-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1024px) {
          .pp-stats { grid-template-columns: 1fr; }
          .pp-sidebar {
            position: fixed;
            left: -280px;
            top: 54px;
            bottom: 0;
            height: calc(100vh - 54px);
            transition: left 0.3s ease;
            z-index: 1000;
          }
          .pp-sidebar.is-open {
            left: 0;
            box-shadow: 4px 0 24px rgba(15, 23, 42, 0.15);
          }
          .pp-mobile-toggle {
            display: inline-flex !important;
          }
          .pp-backdrop {
            display: block;
          }
          .pp-main {
            padding: 8px 16px 0 16px;
          }
          .pp-divider {
            margin: 0 -16px 10px -16px;
          }
          .pp-footer--sticky {
            margin: 8px -16px 0 -16px;
            padding: 0 16px;
          }
        }
        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </MainLayout>
  );
}
