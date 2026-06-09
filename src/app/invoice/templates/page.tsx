"use client";

import React, { useMemo, useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import {
  Typography,
  Button,
  Skeleton,
  Input,
  Tooltip,
  Dropdown,
  Modal,
  Table,
  App,
} from "antd";
import type { MenuProps } from "antd";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  FileText,
  Layers,
  LayoutGrid,
  List,
  MoreVertical,
  Copy,
  ChevronRight,
  ChevronLeft,
  Star,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useInvoiceTemplates,
  useDeleteInvoiceTemplate,
} from "@/hooks/useInvoiceTemplates";
import InvoiceTemplateDrawer from "./InvoiceTemplateDrawer";
import { InvoiceTemplate } from "@/services/invoiceTemplateService";
import { usePermission } from "@/hooks/usePermission";
import { useAuth } from "@/context/AuthContext";
import { useActivitySource } from "@/hooks/useActivitySource";

const { Title, Text } = Typography;

type StatusFilter = "all" | "active" | "default" | "inactive";

export default function InvoiceTemplatePage() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();
  const [searchText, setSearchText] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<InvoiceTemplate | null>(null);
  const { message: messageApi } = App.useApp();
  const router = useRouter();
  const {
    canReadInvoiceTemplate,
    canCreateInvoiceTemplate,
    canUpdateInvoiceTemplate,
    canDeleteInvoiceTemplate
  } = usePermission();
  const { isLoading: authLoading } = useAuth();

  // Route guard
  React.useEffect(() => {
    if (!authLoading && !canReadInvoiceTemplate) {
      router.push("/invoice/invoices");
    }
  }, [authLoading, canReadInvoiceTemplate, router]);

  // Register UX context for activity logging
  useActivitySource({ section: "FINANCE", module: "Invoices", page: "InvoiceTemplateList" });

  const { data: templates, isLoading } = useInvoiceTemplates();
  const deleteMutation = useDeleteInvoiceTemplate();

  const handleEdit = (template: InvoiceTemplate) => {
    setSelectedTemplateId(template.id);
    setDrawerVisible(true);
  };

  const handleCreate = () => {
    setSelectedTemplateId(undefined);
    setDrawerVisible(true);
  };

  const handleDelete = (template: InvoiceTemplate) => {
    setTemplateToDelete(template);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      await deleteMutation.mutateAsync(templateToDelete.id);
      messageApi.success("Template deleted successfully");
      setDeleteModalVisible(false);
      setTemplateToDelete(null);
    } catch (error: any) {
      console.error("Delete template error:", error);
      if (error?.code === "23001" || error?.message?.includes("foreign key constraint")) {
        messageApi.error(
          "Cannot delete template: it's used by existing invoices. Please delete or reassign those invoices first.",
          6
        );
      } else {
        messageApi.error(error?.message || "Failed to delete template");
      }
    }
  };

  const counts = useMemo(() => {
    const all = templates?.length || 0;
    const active = templates?.filter((t) => t.isActive).length || 0;
    const inactive = templates?.filter((t) => !t.isActive).length || 0;
    const def = templates?.filter((t) => t.isDefault).length || 0;
    return { all, active, inactive, default: def };
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return (templates || []).filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchText.toLowerCase()) ||
        t.billingType.toLowerCase().includes(searchText.toLowerCase());
      if (!matchesSearch) return false;
      if (statusFilter === "active") return t.isActive;
      if (statusFilter === "inactive") return !t.isActive;
      if (statusFilter === "default") return t.isDefault;
      return true;
    });
  }, [templates, searchText, statusFilter]);

  const filterPills: { key: StatusFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: counts.all },
    { key: "active", label: "Active", count: counts.active },
    { key: "default", label: "Default", count: counts.default },
    { key: "inactive", label: "Inactive", count: counts.inactive },
  ];

  // Stat tile — minimal, single accent bar on left
  const StatTile = ({
    label,
    value,
    icon: Icon,
    accent,
  }: {
    label: string;
    value: string | number;
    icon: any;
    accent: string;
  }) => (
    <div
      className="rounded-2xl px-5 py-4 flex items-center gap-4 relative overflow-hidden"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
      }}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: accent }}
      />
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${accent}14`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
      >
        <Icon size={18} strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </div>
        <div
          className="text-[22px] font-bold leading-tight tabular-nums"
          style={{ color: "var(--text-primary)" }}
        >
          {value}
        </div>
      </div>
    </div>
  );

  // Table columns
  const columns = [
    {
      title: "TEMPLATE",
      dataIndex: "name",
      key: "name",
      render: (value: string, record: InvoiceTemplate) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
            style={{
              background: "var(--bg-blue-50)",
              color: "var(--text-blue-700)",
              border: "1px solid var(--border-blue-200)",
            }}
          >
            <FileText size={16} strokeWidth={2.25} />
          </div>
          <div>
            <div
              className="text-sm font-semibold flex items-center gap-1.5"
              style={{ color: "var(--text-primary)" }}
            >
              {value}
              {record.isDefault && (
                <Tooltip title="Default template">
                  <Star size={13} className="text-amber-500" fill="currentColor" />
                </Tooltip>
              )}
            </div>
            <div
              className="text-[11px] mt-0.5"
              style={{ color: "var(--text-secondary)" }}
            >
              {record.description || "No description"}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "TYPE",
      dataIndex: "billingType",
      key: "billingType",
      render: (value: string) => (
        <span
          className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider"
          style={{
            background: "var(--bg-slate-50)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-color)",
          }}
        >
          {value}
        </span>
      ),
    },
    {
      title: "FIELDS",
      dataIndex: "fields",
      key: "fields",
      render: (_: any, record: InvoiceTemplate) => (
        <div
          className="flex items-center gap-1.5 text-[13px] tabular-nums"
          style={{ color: "var(--text-secondary)" }}
        >
          <Layers size={14} />
          {record._count?.fields || 0}
        </div>
      ),
    },
    {
      title: "STATUS",
      dataIndex: "isActive",
      key: "isActive",
      render: (_: any, record: InvoiceTemplate) => {
        if (record.isDefault) {
          return (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
              style={{
                background: "var(--bg-blue-50)",
                color: "var(--text-blue-700)",
                border: "1px solid var(--border-blue-200)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--text-blue-700)" }}
              />
              Default
            </span>
          );
        }
        return record.isActive ? (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981" }} />
            Active
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold"
            style={{
              background: "var(--bg-slate-50)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-color)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#94a3b8" }} />
            Inactive
          </span>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 60,
      render: (_: any, record: InvoiceTemplate) => {
        const menuItems: MenuProps["items"] = [
          canUpdateInvoiceTemplate && { key: "edit", icon: <Edit3 size={14} />, label: "Edit template", onClick: () => handleEdit(record) },
          { key: "copy", icon: <Copy size={14} />, label: "Duplicate", disabled: true },
          (canUpdateInvoiceTemplate || canDeleteInvoiceTemplate) && { type: "divider" },
          canDeleteInvoiceTemplate && { key: "delete", danger: true, icon: <Trash2 size={14} />, label: "Delete", onClick: () => handleDelete(record) },
        ].filter(Boolean) as MenuProps["items"];
        return (
          <div onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
              <Button
                type="text"
                icon={<MoreVertical size={16} style={{ color: "var(--text-secondary)" }} />}
              />
            </Dropdown>
          </div>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div
        style={{
          margin: "0 -24px",
          background: "var(--customers-page-bg)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* TOP BAR */}
        <div
          className="sticky top-0 z-40 backdrop-blur-md border-b"
          style={{
            background:
              "color-mix(in oklab, var(--customers-page-bg) 85%, transparent)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="px-8 py-3 md:py-0 min-h-[56px] md:h-14 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/invoice/invoices")}
                  className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-slate-50)]"
                  aria-label="Back"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <ChevronLeft size={18} />
                </button>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "var(--bg-blue-50)",
                    color: "var(--text-blue-700)",
                    border: "1px solid var(--border-blue-200)",
                  }}
                >
                  <Layers size={14} strokeWidth={2.25} />
                </div>
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Invoice templates
                </span>
              </div>
              <span
                className="h-4 w-px hidden sm:inline"
                style={{ background: "var(--border-color)" }}
              />
              <span
                className="text-[12px]"
                style={{ color: "var(--text-secondary)" }}
              >
                Design and manage structures for professional invoices
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              {canCreateInvoiceTemplate && (
                <Button
                  type="primary"
                  icon={<Plus size={16} />}
                  onClick={handleCreate}
                  className="flex-1 md:flex-initial flex items-center justify-center"
                  style={{
                    borderRadius: 8,
                    height: 36,
                    fontWeight: 600,
                    background: "#2563eb",
                  }}
                >
                  <span>New template</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="px-8 pt-6 pb-12">
          <div className="mx-auto max-w-[1600px]">
            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatTile
                label="Total"
                value={isLoading ? "—" : counts.all}
                icon={Layers}
                accent="#2563eb"
              />
              <StatTile
                label="Active"
                value={isLoading ? "—" : counts.active}
                icon={CheckCircle2}
                accent="#10b981"
              />
              <StatTile
                label="Default"
                value={isLoading ? "—" : counts.default}
                icon={Star}
                accent="#f59e0b"
              />
              <StatTile
                label="Inactive"
                value={isLoading ? "—" : counts.inactive}
                icon={AlertCircle}
                accent="#f43f5e"
              />
            </div>

            {/* TOOLS */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                {filterPills.map((p) => {
                  const active = statusFilter === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setStatusFilter(p.key)}
                      className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-[13px] font-medium transition-all"
                      style={{
                        background: active ? "var(--bg-blue-50)" : "var(--bg-secondary)",
                        color: active ? "var(--text-blue-700)" : "var(--text-secondary)",
                        border: `1px solid ${active ? "var(--border-blue-200)" : "var(--border-color)"}`,
                        boxShadow: active ? "0 0 0 3px rgba(96,165,250,0.12)" : "none",
                      }}
                    >
                      {p.label}
                      <span
                        className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-md text-[11px] font-semibold tabular-nums"
                        style={{
                          background: active ? "white" : "var(--bg-slate-50)",
                          color: active ? "var(--text-blue-700)" : "var(--text-secondary)",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        {p.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search templates..."
                  prefix={<Search size={14} style={{ color: "var(--text-secondary)" }} />}
                  allowClear
                  value={searchText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
                  style={{
                    width: 280,
                    borderRadius: 8,
                    height: 36,
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-color)",
                  }}
                />
                <div
                  className="inline-flex items-center h-9 rounded-lg p-0.5"
                  style={{
                    background: "var(--bg-slate-50)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <Tooltip title="Card view">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setViewMode("card")}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold transition-all"
                      style={{
                        background:
                          viewMode === "card" ? "var(--bg-secondary)" : "transparent",
                        color:
                          viewMode === "card"
                            ? "var(--text-blue-700)"
                            : "var(--text-secondary)",
                        boxShadow:
                          viewMode === "card"
                            ? "0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px var(--border-color)"
                            : "none",
                      }}
                    >
                      <LayoutGrid size={14} strokeWidth={2.25} />
                      Cards
                    </button>
                  </Tooltip>
                  <Tooltip title="Table view">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setViewMode("table")}
                      className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold transition-all"
                      style={{
                        background:
                          viewMode === "table" ? "var(--bg-secondary)" : "transparent",
                        color:
                          viewMode === "table"
                            ? "var(--text-blue-700)"
                            : "var(--text-secondary)",
                        boxShadow:
                          viewMode === "table"
                            ? "0 1px 2px rgba(15,23,42,0.06), 0 0 0 1px var(--border-color)"
                            : "none",
                      }}
                    >
                      <List size={14} strokeWidth={2.25} />
                      Table
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* CONTENT */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-5"
                    style={{
                      background: "var(--bg-secondary)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <Skeleton active avatar paragraph={{ rows: 2 }} />
                  </div>
                ))}
              </div>
            ) : !filteredTemplates || filteredTemplates.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-20 rounded-2xl border-dashed"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1.5px dashed var(--border-color)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{
                    background: "var(--bg-blue-50)",
                    color: "var(--text-blue-700)",
                    border: "1px solid var(--border-blue-200)",
                  }}
                >
                  <Sparkles size={24} strokeWidth={2} />
                </div>
                <Title
                  level={5}
                  style={{
                    color: "var(--text-primary)",
                    margin: 0,
                    fontWeight: 700,
                  }}
                >
                  {searchText || statusFilter !== "all"
                    ? "No templates match your filters"
                    : "No templates yet"}
                </Title>
                <Text
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: 13,
                    marginTop: 6,
                    marginBottom: 20,
                  }}
                >
                  {searchText || statusFilter !== "all"
                    ? "Try adjusting your search or filter"
                    : "Create your first invoice template to get started."}
                </Text>
                {!searchText && statusFilter === "all" && canCreateInvoiceTemplate && (
                  <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={handleCreate}
                    style={{
                      borderRadius: 8,
                      height: 38,
                      fontWeight: 600,
                      background: "#2563eb",
                    }}
                  >
                    Create template
                  </Button>
                )}
              </div>
            ) : viewMode === "card" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="template-card group rounded-2xl p-5 cursor-pointer transition-all relative overflow-hidden"
                    style={{
                      background: "var(--bg-secondary)",
                      border: `1px solid ${
                        template.isDefault ? "var(--border-blue-200)" : "var(--border-color)"
                      }`,
                    }}
                    onClick={() => router.push(`/invoice/newinvoice?templateId=${template.id}`)}
                  >
                    {template.isDefault && (
                      <span
                        className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: "#2563eb" }}
                      />
                    )}

                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: template.isDefault
                              ? "var(--bg-blue-50)"
                              : "var(--bg-slate-50)",
                            color: template.isDefault
                              ? "var(--text-blue-700)"
                              : "var(--text-secondary)",
                            border: `1px solid ${
                              template.isDefault ? "var(--border-blue-200)" : "var(--border-color)"
                            }`,
                          }}
                        >
                          <FileText size={20} strokeWidth={2.25} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-[15px] font-semibold leading-tight truncate"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {template.name}
                            </span>
                            {template.isDefault && (
                              <Star
                                size={13}
                                className="text-amber-500"
                                fill="currentColor"
                              />
                            )}
                          </div>
                          <span
                            className="inline-flex items-center mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider"
                            style={{
                              background: "var(--bg-slate-50)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-color)",
                            }}
                          >
                            {template.billingType}
                          </span>
                        </div>
                      </div>
                      <Dropdown
                        menu={{
                          items: [
                            canUpdateInvoiceTemplate && {
                              key: "edit",
                              icon: <Edit3 size={14} />,
                              label: "Edit template",
                              onClick: (e: any) => {
                                e.domEvent.stopPropagation();
                                handleEdit(template);
                              },
                            },
                            canDeleteInvoiceTemplate && {
                              key: "delete",
                              danger: true,
                              icon: <Trash2 size={14} />,
                              label: "Delete",
                              onClick: (e: any) => {
                                e.domEvent.stopPropagation();
                                handleDelete(template);
                              },
                            },
                          ].filter(Boolean) as MenuProps["items"],
                        }}
                        trigger={["click"]}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={
                            <MoreVertical
                              size={16}
                              style={{ color: "var(--text-secondary)" }}
                            />
                          }
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>

                    <p
                      className="text-[12.5px] leading-relaxed line-clamp-2 mb-3"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {template.description ||
                        "Professionally structured billing layout for efficient invoicing."}
                    </p>

                    {/* Field tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.fields?.length ? (
                        <>
                          {template.fields.slice(0, 3).map((f) => (
                            <span
                              key={f.id}
                              className="text-[10.5px] font-medium px-1.5 py-0.5 rounded"
                              style={{
                                background: "var(--bg-slate-50)",
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              {f.fieldLabel}
                            </span>
                          ))}
                          {template.fields.length > 3 && (
                            <span
                              className="text-[10.5px] font-medium px-1.5 py-0.5 rounded"
                              style={{
                                background: "var(--bg-slate-50)",
                                color: "var(--text-secondary)",
                                border: "1px solid var(--border-color)",
                              }}
                            >
                              +{template.fields.length - 3}
                            </span>
                          )}
                        </>
                      ) : (
                        <span
                          className="text-[11px] italic"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          System default fields
                        </span>
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      className="flex items-center justify-between pt-3"
                      style={{ borderTop: "1px solid var(--border-color)" }}
                    >
                      <div
                        className="flex items-center gap-1.5 text-[11.5px] font-medium"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Layers size={12} />
                        {template._count?.fields || 0} field
                        {(template._count?.fields || 0) === 1 ? "" : "s"}
                      </div>
                      <div
                        className="flex items-center gap-1 text-[11.5px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-blue-700)" }}
                      >
                        Use template
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add card */}
                {canCreateInvoiceTemplate && (
                  <div
                    onClick={handleCreate}
                  className="rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-[var(--bg-slate-50)] self-stretch"
                  style={{
                    background: "transparent",
                    border: "1.5px dashed var(--border-color)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: "var(--bg-secondary)",
                      color: "var(--text-blue-700)",
                      border: "1px solid var(--border-blue-200)",
                    }}
                  >
                    <Plus size={20} strokeWidth={2.25} />
                  </div>
                  <span
                    className="text-[13.5px] font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Create template
                  </span>
                  <span
                    className="text-[11.5px] mt-1"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Design a new billing structure
                  </span>
                </div>
              )}
              </div>
            ) : (
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={filteredTemplates}
                  pagination={{
                    pageSize: 10,
                    style: { padding: "12px 20px" },
                  }}
                  className="templates-table"
                  onRow={(record) => ({
                    onClick: () =>
                      router.push(`/invoice/newinvoice?templateId=${record.id}`),
                    className: "cursor-pointer",
                  })}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .template-card:hover {
          border-color: #93c5fd !important;
          box-shadow: 0 0 0 3px rgba(96,165,250,0.10), 0 4px 12px -2px rgba(15,23,42,0.06);
        }
        .templates-table .ant-table-thead > tr > th {
          background-color: var(--bg-slate-50) !important;
          color: var(--text-secondary) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          padding: 10px 16px !important;
          letter-spacing: 0.06em !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .templates-table .ant-table-tbody > tr > td {
          padding: 14px 16px !important;
          border-bottom: 1px solid var(--border-color) !important;
        }
        .templates-table .ant-table-row:hover > td {
          background-color: var(--bg-slate-50) !important;
        }
        .templates-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }
        .ant-segmented {
          background: var(--bg-slate-50) !important;
          padding: 3px !important;
          border-radius: 8px !important;
          border: 1px solid var(--border-color);
        }
        .ant-segmented-item { border-radius: 6px !important; transition: all 0.2s !important; }
        .ant-segmented-item-selected {
          background: var(--bg-secondary) !important;
          border-radius: 6px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
          color: var(--text-blue-700) !important;
        }
      `,
        }}
      />

      {/* Create/Edit Drawer */}
      <InvoiceTemplateDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        templateId={selectedTemplateId}
      />

      {/* Delete confirmation modal — refined */}
      <Modal
        open={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setTemplateToDelete(null);
        }}
        footer={null}
        width={440}
        centered
        closable={false}
        styles={{
          body: { padding: 0 },
          mask: { backdropFilter: "blur(4px)", background: "rgba(15, 23, 42, 0.45)" },
          content: { padding: 0, borderRadius: 20, overflow: "hidden" },
        }}
      >
        <div
          className="px-6 pt-5 pb-4 border-b"
          style={{
            background: "var(--bg-slate-50)",
            borderColor: "var(--border-color)",
          }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "#fef2f2",
                color: "#dc2626",
                border: "1px solid #fecaca",
              }}
            >
              <Trash2 size={18} strokeWidth={2.25} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[15px] font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                Delete template
              </div>
              <div
                className="text-[12px] mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                This action cannot be undone
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <p
            className="text-[13px] leading-relaxed mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            You are about to permanently delete
            {templateToDelete?.name && (
              <>
                {" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  "{templateToDelete.name}"
                </span>
              </>
            )}
            . The template structure, custom fields, and settings will be removed.
          </p>

          <div
            className="rounded-lg p-3 mb-5 flex items-start gap-2"
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
            }}
          >
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "#dc2626" }} />
            <span className="text-[12px]" style={{ color: "#991b1b" }}>
              If invoices reference this template, deletion will be blocked.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => {
                setDeleteModalVisible(false);
                setTemplateToDelete(null);
              }}
              style={{ borderRadius: 8, height: 36 }}
            >
              Cancel
            </Button>
            <Button
              danger
              type="primary"
              loading={deleteMutation.isPending}
              onClick={confirmDelete}
              style={{ borderRadius: 8, height: 36, fontWeight: 600 }}
            >
              Delete template
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
