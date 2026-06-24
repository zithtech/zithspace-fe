"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  AutoComplete,
  Segmented,
  Space,
  Popconfirm,
  Card,
  Tooltip,
  Row,
  Col,
  message,
  Dropdown,
  Avatar,
  Tag,
} from "antd";
import {
  Upload as UploadIcon,
  Download,
  FileText,
  FileCode,
  FilePlus,
  Eye,
  Trash2,
  Pencil,
  FileCheck,
  Search,
  X,
  Folder,
  FolderArchive,
  ShieldCheck,
  Link2,
  UploadCloud,
  ExternalLink,
  AlertTriangle,
  Copy,
  MoreHorizontal,
  LayoutGrid,
  List,
} from "lucide-react";
import { api, apiClient, TokenManager } from "@/lib/axios";
import dayjs from "dayjs";
import { usePermission } from "@/hooks/usePermission";
import { TimeTrackingHeader } from "@/components/time-tracking/TimeTrackingHeader";
import { useSocket } from "@/providers/SocketProvider";

const { Option } = Select;

interface Props {
  clientId: string;
  documents: any[];
  onRefresh: () => void;
}

const DOCUMENT_CATEGORIES: Record<string, string[]> = {
  Sales: ["Proposal", "RFP", "RFQ", "Quotation", "Cost Estimate"],
  Legal: [
    "MSA",
    "SOW",
    "NDA",
    "Amendment",
    "Change Request",
    "Service Agreement",
  ],
  Finance: ["PO", "Invoice Copy", "Credit Note", "Debit Note", "Rate Card"],
  Compliance: [
    "GST Certificate",
    "VAT Certificate",
    "PAN Copy",
    "DPA",
    "Insurance Certificate",
  ],
};

export default function DocumentsTab({
  clientId,
  documents,
  onRefresh,
}: Props) {
  const { canUpdateClient, canDeleteClient } = usePermission();
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [docSource, setDocSource] = useState<"upload" | "url">("upload");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const documentActionMenu = (record: any) => ({
    items: [
      {
        key: "preview",
        label: (
          <span className="pp-menu-item" onClick={() => {
            if (record.fileUrl) {
              setViewingDocument(record);
              setViewModalOpen(true);
            } else {
              messageApi.info("Preview Notification: Live preview is not supported for this file type.");
            }
          }}>
            <Eye size={14} className="pp-menu-ic" />
            <span>Preview Content</span>
          </span>
        ),
      },
      {
        key: "download",
        label: (
          <span className="pp-menu-item" onClick={() => handleDownload(record)}>
            <Download size={14} className="pp-menu-ic" />
            <span>Download File</span>
          </span>
        ),
      },
      ...(canUpdateClient ? [
        {
          key: "edit",
          label: (
            <span className="pp-menu-item" onClick={() => openEditModal(record)}>
              <Pencil size={14} className="pp-menu-ic" />
              <span>Edit Details</span>
            </span>
          ),
        }
      ] : []),
      ...(canDeleteClient ? [
        {
          type: "divider" as const,
        },
        {
          key: "delete",
          danger: true,
          label: (
            <span className="pp-menu-item" onClick={() => {
              modal.confirm({
                title: "Purge Document",
                content: "Are you sure you want to permanently delete this document archive?",
                okText: "Purge",
                okType: "danger",
                cancelText: "Cancel",
                centered: true,
                onOk: () => handleDelete(record.id),
              });
            }}>
              <Trash2 size={14} className="pp-menu-ic" />
              <span>Purge Document</span>
            </span>
          ),
        }
      ] : []),
    ]
  });

  // Real-time: refresh when documents for this client change anywhere.
  const { socket, connected } = useSocket();
  useEffect(() => {
    if (!socket || !connected) return;
    const handler = (payload: { clientId?: string } | undefined) => {
      if (payload?.clientId && payload.clientId !== clientId) return;
      onRefresh();
    };
    socket.on("client_document:created", handler);
    socket.on("client_document:updated", handler);
    socket.on("client_document:deleted", handler);
    return () => {
      socket.off("client_document:created", handler);
      socket.off("client_document:updated", handler);
      socket.off("client_document:deleted", handler);
    };
  }, [socket, connected, clientId, onRefresh]);

  type DocPreview =
    | { kind: "image"; src: string }
    | { kind: "iframe"; src: string; service: string }
    | null;

  const getDocPreview = (doc: any): DocPreview => {
    const url: string | undefined = doc?.fileUrl;
    if (!url) return null;

    // Google Drive file → /preview
    let m = url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/);
    if (m) return { kind: "iframe", src: `https://drive.google.com/file/d/${m[1]}/preview`, service: "Google Drive" };

    // Google Docs / Sheets / Slides → /preview
    m = url.match(/docs\.google\.com\/(document|spreadsheets|presentation)\/d\/([^/?#]+)/);
    if (m) return { kind: "iframe", src: `https://docs.google.com/${m[1]}/d/${m[2]}/preview`, service: "Google Workspace" };

    // YouTube
    m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
    if (m) return { kind: "iframe", src: `https://www.youtube.com/embed/${m[1]}`, service: "YouTube" };

    // Image
    if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$|#)/i.test(url)) return { kind: "image", src: url };

    // Office docs (publicly accessible) — gview wrapper
    if (/\.(docx?|xlsx?|pptx?)(\?|$|#)/i.test(url)) {
      return {
        kind: "iframe",
        src: `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`,
        service: "Office viewer",
      };
    }

    // PDF — modern browsers handle inline
    if (/\.pdf(\?|$|#)/i.test(url)) return { kind: "iframe", src: url, service: "PDF" };

    // Default: direct iframe (handles HTML pages, internal doc hub URLs, etc.)
    return { kind: "iframe", src: url, service: "Web preview" };
  };

  const isExternalDoc = (doc: any) => {
    if (!doc?.fileUrl) return false;
    try {
      const host = new URL(doc.fileUrl).hostname;
      return !host.includes("r2.cloudflarestorage") && !host.includes("r2.dev");
    } catch {
      return false;
    }
  };

  const copyDocLink = async (doc: any) => {
    try {
      await navigator.clipboard.writeText(doc?.fileUrl || "");
      messageApi.success("Link copied");
    } catch {
      messageApi.error("Couldn't copy link");
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filteredDocuments = documents.filter((d) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (d.fileName || "").toLowerCase().includes(q) ||
      (d.category || "").toLowerCase().includes(q) ||
      (d.documentType || "").toLowerCase().includes(q)
    );

    return matchesSearch;
  });

  // --- Category + subtype option lists (suggested + custom from prior uploads) ---
  const uniq = (arr: (string | undefined | null)[]) =>
    Array.from(new Set(arr.filter((x): x is string => !!x && x.trim().length > 0)));

  const suggestedCategories = Object.keys(DOCUMENT_CATEGORIES);
  const customCategories = uniq(documents.map((d) => d.category)).filter(
    (c) => !suggestedCategories.includes(c),
  );

  const categoryOptions = [
    {
      label: <span className="doc-opt-group">Suggested</span>,
      options: suggestedCategories.map((c) => ({
        value: c,
        label: (
          <span className="doc-opt">
            <span>{c}</span>
            <span className="doc-opt-meta">{(DOCUMENT_CATEGORIES[c] || []).length} types</span>
          </span>
        ),
      })),
    },
    ...(customCategories.length
      ? [
        {
          label: <span className="doc-opt-group">Used before</span>,
          options: customCategories.map((c) => ({
            value: c,
            label: (
              <span className="doc-opt">
                <span>{c}</span>
                <span className="doc-opt-custom">Custom</span>
              </span>
            ),
          })),
        },
      ]
      : []),
  ];

  const buildSubtypeOptions = (cat: string | null) => {
    if (!cat) return [];
    const suggested = DOCUMENT_CATEGORIES[cat] || [];
    const customForCat = uniq(
      documents.filter((d) => d.category === cat).map((d) => d.documentType),
    ).filter((t) => !suggested.includes(t));
    return [
      ...(suggested.length
        ? [
          {
            label: <span className="doc-opt-group">Suggested</span>,
            options: suggested.map((t) => ({ value: t, label: t })),
          },
        ]
        : []),
      ...(customForCat.length
        ? [
          {
            label: <span className="doc-opt-group">Used before</span>,
            options: customForCat.map((t) => ({
              value: t,
              label: (
                <span className="doc-opt">
                  <span>{t}</span>
                  <span className="doc-opt-custom">Custom</span>
                </span>
              ),
            })),
          },
        ]
        : []),
    ];
  };

  const subtypeOptions = buildSubtypeOptions(selectedCategory);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return <FileText size={18} style={{ color: "#ef4444" }} />;
    if (["doc", "docx"].includes(ext || "")) return <FileText size={18} style={{ color: "#3b82f6" }} />;
    return <FileCode size={18} style={{ color: "var(--text-slate-500)" }} />;
  };

  const columns = [
    {
      title: "Document Name",
      dataIndex: "fileName",
      key: "fileName",
      width: 420,
      render: (text: string, record: any) => (
        <Space size={12}>
          <div style={{ background: "var(--bg-slate-50)", padding: 8, borderRadius: 8, display: "flex" }}>
            {getFileIcon(text)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 600,
                color: "var(--text-slate-900)",
                fontSize: 14,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 340,
              }}
              title={text}
            >
              {text}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-slate-400)" }}>{record.documentType || "Unclassified"}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Classification",
      key: "classification",
      render: (_: any, record: any) => (
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-slate-700)" }}>{record.category}</div>
          <div style={{ fontSize: 11, color: "var(--text-slate-400)" }}>Group</div>
        </div>
      ),
    },
    {
      title: "Created By",
      key: "uploadedByName",
      render: (_: any, record: any) => {
        const name: string | undefined = record.uploadedByName;
        if (!name) return <span style={{ fontSize: 13, color: "var(--text-slate-400)" }}>—</span>;
        const initial = name.trim().charAt(0).toUpperCase();
        return (
          <Space size={8} align="center">
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--bg-blue-50)", color: "#3b82f6",
                fontSize: 10.5,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "0.02em",
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-slate-700)" }}>
              {name}
            </span>
          </Space>
        );
      },
    },
    {
      title: "Create Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <div style={{ fontSize: 13, color: "var(--text-slate-500)" }}>
          {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      width: 150,
      fixed: "right" as const,
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="Preview Content">
            <Button
              type="text"
              className="premium-action-btn"
              icon={<Eye size={16} />}
              onClick={() => {
                if (record.fileUrl) {
                  setViewingDocument(record);
                  setViewModalOpen(true);
                } else {
                  messageApi.info("Preview Notification: Live preview is not supported for this file type.");
                }
              }}
              style={{ color: "var(--text-slate-500)" }}
            />
          </Tooltip>
          <Button
            type="text"
            className="premium-action-btn"
            icon={<Download size={16} />}
            onClick={() => handleDownload(record)}
            style={{ color: "var(--text-slate-500)" }}
          />

          {canUpdateClient && (
            <Tooltip title="Edit details">
              <Button
                type="text"
                className="premium-action-btn"
                icon={<Pencil size={16} />}
                onClick={() => openEditModal(record)}
                style={{ color: "var(--text-slate-500)" }}
              />
            </Tooltip>
          )}

          {canDeleteClient && (
            <Popconfirm
              title="Purge Document"
              description="Are you sure you want to permanently delete this document archive?"
              onConfirm={() => handleDelete(record.id)}
              okText="Purge"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete Archive">
                <Button
                  type="text"
                  danger
                  className="premium-action-btn"
                  icon={<Trash2 size={16} />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    form.setFieldsValue({ documentType: undefined });
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();

      let payload: Record<string, any>;
      if (docSource === "url") {
        const externalUrl = (values.externalUrl || "").trim();
        if (!externalUrl) {
          messageApi.error("URL required: Paste a document URL or switch to file upload.");
          return;
        }
        payload = {
          externalUrl,
          fileName: (values.urlFileName || "").trim() || undefined,
          category: values.category,
          documentType: values.documentType,
        };
      } else {
        if (fileList.length === 0) {
          messageApi.error("File required: Select a file or switch to URL mode.");
          return;
        }
        const fileObj = fileList[0].originFileObj as File;
        const base64Str = await getBase64(fileObj);
        payload = {
          base64: base64Str,
          fileName: fileObj.name,
          category: values.category,
          documentType: values.documentType,
        };
      }

      setUploading(true);
      try {
        await api.post(`/api/clients-v2/${clientId}/documents`, payload);

        messageApi.success(
          `Document added: ${docSource === "url"
            ? "External link has been saved successfully."
            : "Document has been uploaded successfully."
          }`
        );
        setUploading(false);
        setIsUploadModalVisible(false);
        form.resetFields();
        setFileList([]);
        setDocSource("upload");
        onRefresh();
      } catch (err: any) {
        messageApi.error(
          `Save Failed: ${err.response?.data?.error || "Failed to save document."}`
        );
        setUploading(false);
      }
    } catch (err: any) {
      // Validation handled by AntD
    }
  };

  const handleDownload = async (record: any) => {
    if (!record) return;

    const external = isExternalDoc(record);
    if (external) {
      window.open(record.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const loadingKey = "downloading-doc";
    try {
      messageApi.loading({ content: "Downloading file...", key: loadingKey, duration: 0 });

      const response = await apiClient.get(
        `/api/clients-v2/${clientId}/documents/${record.id}/download`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: response.headers["content-type"] });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", record.fileName || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);

      messageApi.success({ content: "Downloaded successfully", key: loadingKey });
    } catch (err) {
      messageApi.error({ content: "Failed to download", key: loadingKey });
      window.open(record.fileUrl, "_blank", "noopener,noreferrer");
    }
  };

  const openEditModal = (record: any) => {
    setEditingDocument(record);
    setEditingCategory(record.category || null);
    editForm.setFieldsValue({
      fileName: record.fileName,
      category: record.category,
      documentType: record.documentType,
    });
    setEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingDocument) return;
    try {
      const values = await editForm.validateFields();
      setSavingEdit(true);
      try {
        await api.patch(
          `/api/clients-v2/${clientId}/documents/${editingDocument.id}`,
          {
            fileName: values.fileName?.trim(),
            category: values.category?.trim(),
            documentType: values.documentType?.trim(),
          },
        );
        messageApi.success("Document updated: Changes saved successfully.");
        setEditModalOpen(false);
        setEditingDocument(null);
        editForm.resetFields();
        onRefresh();
      } catch (err: any) {
        messageApi.error(
          `Update failed: ${err.response?.data?.error || "Could not update document."}`
        );
      } finally {
        setSavingEdit(false);
      }
    } catch {
      // antd handles validation messaging
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await api.delete(`/api/clients-v2/${clientId}/documents/${documentId}`);
      messageApi.success("Deletion Complete: Document archive has been successfully removed.");
      onRefresh();
    } catch (error) {
      messageApi.error("Error: Failed to purge document archive.");
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}
      {modalContextHolder}
      <div className="cd-tab-sticky-head">
      <div className="documents-header-wrap" style={{ margin: "0 -32px" }}>
          <TimeTrackingHeader
            icon={<FolderArchive size={20} color="#3b82f6" />}
            title="Document Repository"
            description="Centralized storage for all MSA, SOW, NDAs, and legal annexures"
            extra={
              canUpdateClient && (
                <Button
                  type="primary"
                  icon={<FilePlus size={16} />}
                  onClick={() => setIsUploadModalVisible(true)}
                  className="ptab-primary-btn"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    borderColor: "transparent",
                    borderRadius: "8px",
                    height: "32px",
                    fontWeight: 600,
                    boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Add Document
                </Button>
              )
            }
            style={{ background: "transparent", borderBottom: "1px solid var(--border-slate-100)", padding: "4px 32px", marginBottom: "8px" }}
          />
        </div>
  
        <div style={{ margin: "12px 0 8px 0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <Input
            placeholder="Search by name or classification..."
            prefix={<Search size={15} style={{ color: "var(--text-slate-400)", marginRight: 8 }} />}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="documents-search-input"
            style={{ width: "320px" }}
            allowClear
          />
  
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div className="ptab-segmented">
              <button
                type="button"
                className={viewMode === "grid" ? "is-active" : ""}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                className={viewMode === "list" ? "is-active" : ""}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>
        <div className="ptab-divider" />
      </div>

      {viewMode === "list" ? (
        <div className="pp-table-wrap">
          <Table
            dataSource={filteredDocuments}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            className="pp-table"
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: (
                <div className="ptab-empty">
                  <div className="ptab-empty-icon">
                    <FolderArchive size={26} />
                  </div>
                  <div className="ptab-empty-title">No documents yet</div>
                  <div className="ptab-empty-desc">
                    Upload MSAs, SOWs, NDAs, and other legal annexures to keep a complete client record.
                  </div>
                </div>
              ),
            }}
          />
        </div>
      ) : (
        <div className="pp-grid">
          {filteredDocuments.length === 0 ? (
            <div className="ptab-empty-wrapper">
              <div className="ptab-empty" style={{ background: "var(--bg-pure-white)", border: "1px solid var(--border-slate-200)", padding: "40px 24px" }}>
                <div className="ptab-empty-icon">
                  <FolderArchive size={26} />
                </div>
                <div className="ptab-empty-title">No documents yet</div>
                <div className="ptab-empty-desc">
                  Upload MSAs, SOWs, NDAs, and other legal annexures to keep a complete client record.
                </div>
              </div>
            </div>
          ) : (
            filteredDocuments.map((doc) => {
              return (
                <div key={doc.id} className="pc-card">
                  <div className="pc-top">
                    <div className="pc-avatar" style={{ background: "#3b82f6", color: "#fff" }}>
                      <FileText size={16} color="#fff" />
                    </div>
                    <div className="pc-identity-body">
                      <div className="pc-title" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <span style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={doc.fileName}>{doc.fileName}</span>
                        <Tag style={{ borderRadius: 6, fontWeight: 600, border: 0, fontSize: "10px", padding: "1px 6px" }}>
                          {(doc.documentType || "UNCLASSIFIED").toUpperCase()}
                        </Tag>
                      </div>
                      <div className="pc-client-line">
                        <span className="pc-client-key">Group:</span>
                        <span className="pc-client-val">{doc.category || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pc-foot">
                    <div className="pc-foot-row">
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Created</span>
                        <span className="pc-foot-val">{doc.createdAt ? dayjs(doc.createdAt).format("MMM DD, YYYY") : "—"}</span>
                      </span>
                      {doc.fileSize && (
                        <>
                          <span className="pc-foot-div" />
                          <span className="pc-foot-item">
                            <span className="pc-foot-key">Size</span>
                            <span className="pc-foot-val">{formatBytes(doc.fileSize)}</span>
                          </span>
                        </>
                      )}
                      <span className="pc-foot-div" />
                      <span className="pc-foot-item">
                        <span className="pc-foot-key">Created by</span>
                        <Avatar size={16} style={{ background: "var(--bg-blue-50)", color: "#3b82f6", fontSize: 8, fontWeight: 700 }}>
                          {doc.uploadedByName?.charAt(0).toUpperCase() || "—"}
                        </Avatar>
                        <span className="pc-foot-val">{doc.uploadedByName || "—"}</span>
                      </span>
                    </div>

                    <div className="pc-foot-row" style={{ gap: "4px" }}>
                      <Button
                        type="text"
                        size="small"
                        icon={<Eye size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (doc.fileUrl) {
                            setViewingDocument(doc);
                            setViewModalOpen(true);
                          } else {
                            messageApi.info("Preview Notification: Live preview is not supported for this file type.");
                          }
                        }}
                        style={{ display: "inline-flex", alignItems: "center", fontSize: "11px", color: "var(--text-slate-600)", padding: "2px 6px", height: "auto" }}
                      >
                        Preview
                      </Button>

                      <Button
                        type="text"
                        size="small"
                        icon={<Download size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(doc);
                        }}
                        style={{ display: "inline-flex", alignItems: "center", fontSize: "11px", color: "var(--text-slate-600)", padding: "2px 6px", height: "auto" }}
                      >
                        Download
                      </Button>

                      {canDeleteClient && (
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<Trash2 size={12} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            modal.confirm({
                              title: "Purge Document",
                              content: "Are you sure you want to permanently delete this document archive?",
                              okText: "Purge",
                              okType: "danger",
                              cancelText: "Cancel",
                              centered: true,
                              onOk: () => handleDelete(doc.id),
                            });
                          }}
                          style={{ display: "inline-flex", alignItems: "center", fontSize: "11px", padding: "2px 6px", height: "auto" }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        open={isUploadModalVisible}
        onCancel={() => {
          setIsUploadModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        title={null}
        width={520}
        centered
        className="pmodal"
        closeIcon={<X size={16} />}
      >
        <Form form={form} layout="vertical">
          <div className="pmodal-hero pmodal-hero-slim">
            <div className="pmodal-hero-mesh" />
            <div className="pmodal-hero-blob" />
            <div className="pmodal-hero-content">
              <div className="pmodal-hero-icon">
                <UploadIcon size={20} />
              </div>
              <div>
                <div className="pmodal-hero-title">Add New Document</div>
                <div className="pmodal-hero-sub">
                  Upload an MSA, SOW, NDA, or any compliance document
                </div>
              </div>
            </div>
          </div>

          <div className="pmodal-body">
            <div className="pmodal-section-label">
              <Folder size={11} />
              <span>Classification</span>
            </div>

            <Form.Item
              name="category"
              label={
                <span className="doc-field-label">
                  <span>Primary category</span>
                  <span className="doc-field-help">
                    Pick a suggested one or type to create new
                  </span>
                </span>
              }
              rules={[{ required: true, message: "Required" }]}
            >
              <AutoComplete
                placeholder="e.g. Legal, Sales, or type a new category"
                options={categoryOptions}
                onChange={handleCategoryChange}
                filterOption={(input, option) => {
                  const v = (option as any)?.value;
                  if (typeof v !== "string") return false;
                  return v.toLowerCase().includes((input || "").toLowerCase());
                }}
                popupClassName="doc-autocomplete-popup"
                allowClear
              />
            </Form.Item>

            <Form.Item
              name="documentType"
              label={
                <span className="doc-field-label">
                  <span>Document subtype</span>
                  <span className="doc-field-help">
                    {selectedCategory
                      ? "Pick a known type or create your own"
                      : "Choose a category first"}
                  </span>
                </span>
              }
              rules={[{ required: true, message: "Required" }]}
            >
              <AutoComplete
                placeholder={
                  selectedCategory
                    ? "e.g. Proposal, NDA, or type a new subtype"
                    : "Choose a category first"
                }
                disabled={!selectedCategory}
                options={subtypeOptions}
                filterOption={(input, option) => {
                  const v = (option as any)?.value;
                  if (typeof v !== "string") return false;
                  return v.toLowerCase().includes((input || "").toLowerCase());
                }}
                popupClassName="doc-autocomplete-popup"
                allowClear
              />
            </Form.Item>

            <div className="pmodal-section-label">
              <UploadIcon size={11} />
              <span>Source</span>
            </div>

            <Segmented
              block
              value={docSource}
              onChange={(v) => setDocSource(v as "upload" | "url")}
              className="doc-source-toggle"
              options={[
                {
                  value: "upload",
                  label: (
                    <span className="doc-source-opt">
                      <UploadCloud size={14} /> Upload file
                    </span>
                  ),
                },
                {
                  value: "url",
                  label: (
                    <span className="doc-source-opt">
                      <Link2 size={14} /> Use URL
                    </span>
                  ),
                },
              ]}
            />

            {docSource === "upload" ? (
              <Form.Item required style={{ marginTop: 14 }}>
                {fileList.length === 0 ? (
                  <Upload.Dragger
                    className="doc-dragger"
                    fileList={fileList}
                    beforeUpload={(file) => {
                      const allowedExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg'];
                      const ext = file.name.split('.').pop()?.toLowerCase() || '';
                      if (!allowedExtensions.includes(ext)) {
                        messageApi.error('File format not supported. Please upload PDF, DOCX, or JPG.');
                        return Upload.LIST_IGNORE;
                      }
                      setFileList([{ ...file, originFileObj: file }]);
                      return false;
                    }}
                    onRemove={() => setFileList([])}
                    maxCount={1}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg"
                    showUploadList={false}
                  >
                    <div className="doc-dragger-content">
                      <div className="doc-dragger-icon">
                        <UploadCloud size={28} />
                      </div>
                      <div className="doc-dragger-title">
                        Drop file here or click to browse
                      </div>
                      <div className="doc-dragger-sub">
                        PDF, DOCX, JPG · single file · up to 25 MB
                      </div>
                    </div>
                  </Upload.Dragger>
                ) : (
                  <div className="doc-file-card">
                    <div className="doc-file-icon">
                      <FileText size={20} />
                    </div>
                    <div className="doc-file-meta">
                      <div className="doc-file-name">
                        {(fileList[0]?.originFileObj as File)?.name || fileList[0]?.name}
                      </div>
                      <div className="doc-file-sub">
                        <span className="doc-file-tag ok">
                          <FileCheck size={11} /> Ready
                        </span>
                        <span className="doc-file-size">
                          {formatBytes((fileList[0]?.originFileObj as File)?.size || 0)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="doc-file-remove"
                      onClick={() => setFileList([])}
                      aria-label="Remove file"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </Form.Item>
            ) : (
              <div style={{ marginTop: 14 }}>
                <Form.Item
                  name="externalUrl"
                  label={
                    <span className="doc-field-label">
                      <span>Document URL</span>
                      <span className="doc-field-help">
                        Paste a Drive, Dropbox, S3 or any HTTPS link
                      </span>
                    </span>
                  }
                  rules={[
                    { required: true, message: "Required" },
                    { type: "url", message: "Must be a valid URL" },
                  ]}
                >
                  <Input
                    placeholder="https://drive.google.com/file/d/…"
                    prefix={<Link2 size={14} style={{ color: "var(--text-slate-400)" }} />}
                  />
                </Form.Item>
                <Form.Item
                  name="urlFileName"
                  label={
                    <span className="doc-field-label">
                      <span>Display name</span>
                      <span className="doc-field-help">
                        Optional — auto-detected from the URL if blank
                      </span>
                    </span>
                  }
                >
                  <Input placeholder="e.g. Q3 MSA Final.pdf" />
                </Form.Item>
              </div>
            )}
          </div>

          <div className="pmodal-footer">
            <span className="pmodal-footer-hint">
              <ShieldCheck size={12} />
              Files are encrypted at rest
            </span>
            <Button
              onClick={() => {
                setIsUploadModalVisible(false);
                form.resetFields();
                setFileList([]);
              }}
              className="pmodal-btn-cancel"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleUpload}
              loading={uploading}
              icon={<UploadIcon size={15} />}
              className="pmodal-btn-primary"
            >
              Upload Document
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingDocument(null);
          editForm.resetFields();
        }}
        footer={null}
        title={null}
        width={480}
        centered
        className="pmodal"
        closeIcon={<X size={16} />}
      >
        <Form
          form={editForm}
          layout="vertical"
          onValuesChange={(changed) => {
            if ("category" in changed) {
              setEditingCategory(changed.category || null);
              editForm.setFieldsValue({ documentType: undefined });
            }
          }}
        >
          <div className="pmodal-hero pmodal-hero-slim">
            <div className="pmodal-hero-mesh" />
            <div className="pmodal-hero-blob" />
            <div className="pmodal-hero-content">
              <div className="pmodal-hero-icon">
                <Pencil size={18} />
              </div>
              <div>
                <div className="pmodal-hero-title">Edit document details</div>
                <div className="pmodal-hero-sub">
                  Update file name and classification — the underlying file isn't replaced.
                </div>
              </div>
            </div>
          </div>

          <div className="pmodal-body">
            <Form.Item
              name="fileName"
              label={
                <span className="doc-field-label">
                  <span>Display name</span>
                  <span className="doc-field-help">Shown in the document list</span>
                </span>
              }
              rules={[{ required: true, message: "Required" }]}
            >
              <Input placeholder="e.g. Q3 MSA Final.pdf" prefix={<FileText size={14} style={{ color: "var(--text-slate-400)" }} />} />
            </Form.Item>

            <Form.Item
              name="category"
              label={
                <span className="doc-field-label">
                  <span>Primary category</span>
                </span>
              }
              rules={[{ required: true, message: "Required" }]}
            >
              <AutoComplete
                placeholder="e.g. Legal, Sales"
                options={categoryOptions}
                filterOption={(input, option) => {
                  const v = (option as any)?.value;
                  if (typeof v !== "string") return false;
                  return v.toLowerCase().includes((input || "").toLowerCase());
                }}
                popupClassName="doc-autocomplete-popup"
                allowClear
              />
            </Form.Item>

            <Form.Item
              name="documentType"
              label={
                <span className="doc-field-label">
                  <span>Document subtype</span>
                  <span className="doc-field-help">
                    {editingCategory ? "Pick a known type or create your own" : "Choose a category first"}
                  </span>
                </span>
              }
              rules={[{ required: true, message: "Required" }]}
            >
              <AutoComplete
                placeholder={editingCategory ? "e.g. Proposal, NDA" : "Choose a category first"}
                disabled={!editingCategory}
                options={buildSubtypeOptions(editingCategory)}
                filterOption={(input, option) => {
                  const v = (option as any)?.value;
                  if (typeof v !== "string") return false;
                  return v.toLowerCase().includes((input || "").toLowerCase());
                }}
                popupClassName="doc-autocomplete-popup"
                allowClear
              />
            </Form.Item>
          </div>

          <div className="pmodal-footer">
            <Button
              onClick={() => {
                setEditModalOpen(false);
                setEditingDocument(null);
                editForm.resetFields();
              }}
              className="pmodal-btn-cancel"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleEditSave}
              loading={savingEdit}
              icon={<FileCheck size={14} />}
              className="pmodal-btn-primary"
            >
              Save changes
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setViewingDocument(null);
        }}
        footer={null}
        title={null}
        width={"min(1100px, 92vw)"}
        centered
        className="pmodal doc-preview-modal"
        closeIcon={<X size={16} />}
        styles={{ body: { padding: 0 } }}
      >
        {viewingDocument && (() => {
          const preview = getDocPreview(viewingDocument);
          const external = isExternalDoc(viewingDocument);
          return (
            <>
              <div className="doc-preview-head">
                <div className="doc-preview-icon">
                  <FileText size={20} />
                </div>
                <div className="doc-preview-info">
                  <div className="doc-preview-name" title={viewingDocument.fileName}>
                    {viewingDocument.fileName || "Untitled document"}
                  </div>
                  <div className="doc-preview-meta">
                    {viewingDocument.category && (
                      <span className="doc-preview-tag">{viewingDocument.category}</span>
                    )}
                    {viewingDocument.documentType && (
                      <span className="doc-preview-tag">{viewingDocument.documentType}</span>
                    )}
                    <span className={`doc-preview-source ${external ? "external" : "uploaded"}`}>
                      {external ? <Link2 size={11} /> : <UploadCloud size={11} />}
                      {external ? "Linked source" : "Uploaded file"}
                    </span>
                    {preview?.kind === "iframe" && preview.service && (
                      <span className="doc-preview-service">via {preview.service}</span>
                    )}
                  </div>
                </div>
                <div className="doc-preview-actions">
                  <Tooltip title="Copy link">
                    <Button
                      icon={<Copy size={14} />}
                      onClick={() => copyDocLink(viewingDocument)}
                      className="doc-preview-icon-btn"
                    />
                  </Tooltip>
                  <Button
                    icon={<ExternalLink size={14} />}
                    onClick={() => window.open(viewingDocument.fileUrl, "_blank", "noopener,noreferrer")}
                    className="doc-preview-btn"
                  >
                    Open
                  </Button>
                  <Button
                    type="primary"
                    icon={<Download size={14} />}
                    onClick={() => handleDownload(viewingDocument)}
                    className="pmodal-btn-primary doc-preview-btn"
                  >
                    Download
                  </Button>
                </div>
              </div>

              <div className="doc-preview-pane">
                {!preview ? (
                  <div className="doc-preview-fallback">
                    <div className="doc-preview-fb-icon">
                      <AlertTriangle size={28} />
                    </div>
                    <div className="doc-preview-fb-title">Preview unavailable</div>
                    <div className="doc-preview-fb-desc">
                      No file source is attached to this record.
                    </div>
                  </div>
                ) : preview.kind === "image" ? (
                  <div className="doc-preview-image-wrap">
                    <img
                      src={preview.src}
                      alt={viewingDocument.fileName || "Document"}
                      className="doc-preview-image"
                    />
                  </div>
                ) : (
                  <iframe
                    key={preview.src}
                    src={preview.src}
                    className="doc-preview-iframe"
                    title="Document Preview"
                    allow="fullscreen"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              <div className="doc-preview-foot">
                <span className="doc-preview-foot-hint">
                  <ShieldCheck size={12} />
                  Can't see the preview? Some sources block embedding — open it in a new tab.
                </span>
                <Button
                  size="small"
                  icon={<ExternalLink size={12} />}
                  onClick={() => window.open(viewingDocument.fileUrl, "_blank", "noopener,noreferrer")}
                  className="doc-preview-foot-link"
                >
                  Open in new tab
                </Button>
              </div>
            </>
          );
        })()}
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        html body .documents-header-wrap .ptab-primary-btn {
          background: linear-gradient(135deg, #3b82f6, #2563eb) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25) !important;
          border-radius: 8px !important;
        }
        html body .pmodal .ant-modal-content {
          border-radius: 8px !important;
        }
        html body .pmodal-btn-primary,
        html body .pmodal-btn-cancel {
          border-radius: 8px !important;
        }
        .premium-table .ant-table {
          background: transparent !important;
          color: var(--text-slate-700) !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-400) !important;
          font-weight: 700 !important;
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          padding: 6px 10px !important;
          border-bottom: 1px solid var(--border-slate-200) !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        .premium-table .ant-table-tbody > tr > td {
          padding: 6.5px 10px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .premium-table .ant-table-tbody > tr:hover > td {
          background: var(--bg-slate-50) !important;
        }
        .premium-table .ant-table-placeholder > td {
          background: transparent !important;
        }
        .premium-action-btn:hover {
          background: var(--bg-slate-50) !important;
          color: #f59e0b !important;
        }
        .ant-modal-header {
            border-bottom: 1px solid var(--border-slate-100) !important;
            padding-bottom: 16px !important;
        }
        [data-theme="dark"] .premium-action-btn {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .premium-action-btn:hover {
          background: rgba(245, 158, 11, 0.16) !important;
          color: #f59e0b !important;
        }

        /* Zero white borders constraint for inputs */
        html body .documents-search-input {
          background-color: var(--bg-slate-50) !important;
          border: 1px solid var(--border-slate-200) !important;
          border-radius: 8px !important;
          color: var(--text-slate-900) !important;
        }
        html body .documents-search-input:hover,
        html body .documents-search-input:focus {
          border-color: #f59e0b !important;
        }
        [data-theme="dark"] html body .documents-search-input {
          background-color: var(--bg-secondary) !important;
          border: 1px solid var(--border-slate-800) !important;
        }

        /* Full bleed header styling flush with vertical sidebar border */
        .documents-header-wrap .saas-header-container {
          margin-left: -32px !important;
          margin-right: -32px !important;
          padding-left: 32px !important;
          padding-right: 32px !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          margin-bottom: 0 !important;
        }
        @media (max-width: 900px) {
          .documents-header-wrap .saas-header-container {
            margin-left: -20px !important;
            margin-right: -20px !important;
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
        }
        @media (max-width: 720px) {
          .documents-header-wrap .saas-header-container {
            margin-left: -16px !important;
            margin-right: -16px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }

        /* Segmented Toggles */
        .ptab-segmented {
          display: inline-flex;
          border: 1px solid var(--border-slate-200);
          border-radius: 8px;
          overflow: hidden;
          background: var(--bg-pure-white);
        }
        .ptab-segmented button {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          cursor: pointer;
          color: var(--text-slate-400);
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .ptab-segmented button:hover {
          color: var(--text-slate-600);
          background: var(--bg-slate-50);
        }
        .ptab-segmented button.is-active {
          background: var(--bg-blue-50) !important;
          color: #3b82f6 !important;
        }
        [data-theme='dark'] .ptab-segmented {
          border-color: var(--border-slate-200);
          background: var(--bg-secondary);
        }
        [data-theme='dark'] .ptab-segmented button.is-active {
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }

        /* Proposal Style Table */
        .pp-table-wrap { background: var(--bg-pure-white); border: 1px solid var(--border-slate-200); border-radius: 0; overflow: hidden; }
        .pp-table .ant-table { background: transparent; font-size: 12px; }
        .pp-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important; border-bottom: 1px solid var(--border-slate-200) !important;
          font-size: 10px !important; font-weight: 700 !important; letter-spacing: 0.04em;
          text-transform: uppercase; color: var(--text-slate-400) !important; padding: 6px 10px !important;
          white-space: nowrap !important;
        }
        .pp-table .ant-table-thead > tr > th::before { display: none !important; }
        .pp-table .ant-table-tbody > tr > td { border-bottom: 1px solid var(--border-slate-100) !important; padding: 6.5px 10px !important; }
        .pp-table .ant-table-tbody > tr:last-child > td { border-bottom: none !important; }
        .pp-table .ant-table-tbody > tr:hover > td { background: var(--bg-slate-50) !important; }
        .pp-table .ant-table-placeholder > td { background: transparent !important; }

        /* Proposal Grid & Cards */
        .pp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
        .ptab-empty-wrapper { grid-column: 1 / -1; }
        @media (max-width: 700px) {
          .pp-grid { grid-template-columns: 1fr; }
        }

        .pc-card {
          border: 1px solid var(--border-slate-200); border-radius: 0; background: var(--bg-pure-white);
          cursor: pointer; overflow: hidden; display: flex; flex-direction: column;
          transition: box-shadow .15s ease, border-color .15s ease;
        }
        .pc-card:hover { box-shadow: 0 3px 12px rgba(15,23,42,0.06); border-color: #cbd5e1; }

        .pc-top { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; flex: 1; }
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

        .pc-foot { display: flex; flex-direction: column; padding: 0; border-top: 1px solid var(--border-slate-200); background: var(--bg-slate-50); }
        .pc-foot-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 12px; }
        .pc-foot-row + .pc-foot-row { border-top: 1px solid var(--border-slate-200); }
        .pc-foot-item { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-slate-700); }
        .pc-foot-key { font-size: 10.5px; font-weight: 600; color: var(--text-slate-400); }
        .pc-foot-div { width: 1px; height: 11px; background: var(--border-slate-300, #cbd5e1); }

        [data-theme="dark"] .pc-card {
          background: var(--bg-slate-900);
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot {
          background: var(--bg-secondary);
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot-row {
          border-color: var(--border-slate-800);
        }
        [data-theme="dark"] .pc-foot-div {
          background: var(--border-slate-800);
        }

        /* Add Document Modal Header Polish */
        .pmodal-hero {
          background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%) !important;
          color: var(--text-slate-900) !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .pmodal-hero-slim {
          background: linear-gradient(135deg, #f5f3ff 0%, #eef2ff 100%) !important;
          color: var(--text-slate-900) !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
        }
        .pmodal-hero-title {
          color: var(--text-slate-900) !important;
        }
        .pmodal-hero-sub {
          color: var(--text-slate-500) !important;
        }
        .pmodal-hero-icon {
          background: rgba(139, 92, 246, 0.1) !important;
          border: 1px solid rgba(139, 92, 246, 0.2) !important;
          color: #8b5cf6 !important;
          box-shadow: none !important;
        }
        .pmodal-hero-mesh {
          background-image:
            linear-gradient(rgba(139, 92, 246, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.05) 1px, transparent 1px) !important;
        }
        .pmodal-hero-blob {
          opacity: 0.25 !important;
        }

        /* Dark theme header overrides */
        [data-theme="dark"] .pmodal-hero {
          background:
            radial-gradient(800px 220px at -10% 0%, rgba(139, 92, 246, 0.4), transparent 60%),
            radial-gradient(600px 220px at 110% 100%, rgba(59, 130, 246, 0.35), transparent 60%),
            linear-gradient(135deg, #0b1220 0%, #111827 100%) !important;
          color: #fff !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        [data-theme="dark"] .pmodal-hero-slim {
          background:
            radial-gradient(500px 140px at -10% 0%, rgba(139, 92, 246, 0.4), transparent 65%),
            radial-gradient(420px 140px at 110% 100%, rgba(99, 102, 241, 0.35), transparent 65%),
            linear-gradient(135deg, #0b1220 0%, #111827 100%) !important;
          color: #fff !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
        }
        [data-theme="dark"] .pmodal-hero-title {
          color: #fff !important;
        }
        [data-theme="dark"] .pmodal-hero-sub {
          color: rgba(226, 232, 240, 0.78) !important;
        }
        [data-theme="dark"] .pmodal-hero-icon {
          background: rgba(255, 255, 255, 0.1) !important;
          border: 1px solid rgba(255, 255, 255, 0.16) !important;
          color: #fff !important;
        }
        [data-theme="dark"] .pmodal-hero-mesh {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px) !important;
        }
        [data-theme="dark"] .pmodal-hero-blob {
          opacity: 0.45 !important;
        }
      `}} />
    </div>
  );
}

