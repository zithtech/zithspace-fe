"use client";

import React, { useState } from "react";
import {
  Table,
  Button,
  Upload,
  Tag,
  Modal,
  Form,
  Select,
  Space,
  Popconfirm,
  notification,
  Card,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  Upload as UploadIcon,
  Download,
  FileText,
  FileCode,
  FilePlus,
  Eye,
  Trash2,
  FileCheck,
  Search,
  X,
  Folder,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/axios";

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
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [notify, contextHolder] = notification.useNotification();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);

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
      width: 300,
      render: (text: string, record: any) => (
        <Space size={12}>
          <div style={{ background: "var(--bg-slate-50)", padding: 8, borderRadius: 8, display: "flex" }}>
            {getFileIcon(text)}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--text-slate-900)", fontSize: 14 }}>{text}</div>
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
      title: "Revision",
      dataIndex: "version",
      key: "version",
      render: (v: number) => (
        <Tag style={{ borderRadius: 6, fontWeight: 600, border: 0, background: "var(--bg-slate-50)", color: "var(--text-slate-500)" }}>
          REV {v || 1}
        </Tag>
      ),
    },
    {
      title: "Ingestion Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <div style={{ fontSize: 13, color: "var(--text-slate-500)" }}>
          {new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right" as const,
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
                  notify.info({
                    message: "Preview Notification",
                    description: "Live preview is not supported for this file type.",
                    placement: "top",
                  });
                }
              }}
              style={{ color: "var(--text-slate-500)" }}
            />
          </Tooltip>
          <Tooltip title="Download File">
            <Button
              type="text"
              className="premium-action-btn"
              icon={<Download size={16} />}
              onClick={() => handleDownload(record)}
              style={{ color: "var(--text-slate-500)" }}
            />
          </Tooltip>

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
      if (fileList.length === 0) {
        notify.error({
          message: "Upload Error",
          description: "No file selected for ingestion.",
          placement: "top",
        });
        return;
      }

      setUploading(true);
      try {
        const fileObj = fileList[0].originFileObj as File;
        const base64Str = await getBase64(fileObj);

        const payload = {
          base64: base64Str,
          fileName: fileObj.name,
          category: values.category,
          documentType: values.documentType,
        };

        await api.post(`/api/clients-v2/${clientId}/documents`, payload);

        notify.success({
          message: "Ingestion Success",
          description: "Document has been successfully archived.",
          placement: "top",
        });
        setUploading(false);
        setIsUploadModalVisible(false);
        form.resetFields();
        setFileList([]);
        onRefresh();
      } catch (err: any) {
        notify.error({
          message: "Upload Failed",
          description: err.response?.data?.error || "Failed to process document upload.",
          placement: "top",
        });
        setUploading(false);
      }
    } catch (err: any) {
      // Validation handled by AntD
    }
  };

  const handleDownload = (record: any) => {
    if (record?.fileUrl) {
      const link = document.createElement("a");
      link.href = record.fileUrl;
      link.download = record.fileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await api.delete(`/api/clients-v2/${clientId}/documents/${documentId}`);
      notify.success({
        message: "Deletion Complete",
        description: "Document archive has been successfully removed.",
        placement: "top",
      });
      onRefresh();
    } catch (error) {
      notify.error({
        message: "Error",
        description: "Failed to purge document archive.",
        placement: "top",
      });
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
      {contextHolder}
      <Card
        style={{
          borderRadius: 16,
          border: "1px solid var(--border-slate-100)",
          background: "var(--bg-pure-white)"
        }}
        bodyStyle={{ padding: "0" }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid var(--border-slate-100)" }}>
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={18}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-slate-900)" }}>Document Repository</div>
                <div style={{ fontSize: 13, color: "var(--text-slate-500)", marginTop: 4 }}>Centralized storage for all MSA, SOW, NDAs, and legal annexures</div>
              </div>
            </Col>
            <Col xs={24} md={6} style={{ textAlign: "right" }}>
              <Button
                type="primary"
                size="large"
                icon={<FilePlus size={18} />}
                onClick={() => setIsUploadModalVisible(true)}
                style={{ borderRadius: 10, height: 40, fontWeight: 600, display: "flex", alignItems: "center", width: "100%", justifyContent: "center" }}
              >
                Archive Document
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          dataSource={documents}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8, hideOnSinglePage: true }}
          className="premium-table"
          scroll={{ x: "max-content" }}
          locale={{ emptyText: <div style={{ padding: "40px 0", color: "var(--text-slate-500)" }}>No document archives available</div> }}
        />
      </Card>

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
          <div className="pmodal-hero blue">
            <div className="pmodal-hero-mesh" />
            <div className="pmodal-hero-blob" />
            <div className="pmodal-hero-content">
              <div className="pmodal-hero-icon">
                <UploadIcon size={20} />
              </div>
              <div>
                <div className="pmodal-hero-title">Archive New Document</div>
                <div className="pmodal-hero-sub">
                  Upload an MSA, SOW, NDA or any compliance document
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
              label="Primary category"
              rules={[{ required: true, message: "Selection required" }]}
            >
              <Select
                placeholder="e.g. Legal, Sales"
                onChange={handleCategoryChange}
              >
                {Object.keys(DOCUMENT_CATEGORIES).map((cat) => (
                  <Option key={cat} value={cat}>
                    {cat}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="documentType"
              label="Document subtype"
              rules={[{ required: true, message: "Selection required" }]}
            >
              <Select
                placeholder={selectedCategory ? "Select specific type…" : "Choose a category first"}
                disabled={!selectedCategory}
              >
                {selectedCategory &&
                  DOCUMENT_CATEGORIES[selectedCategory].map((type) => (
                    <Option key={type} value={type}>
                      {type}
                    </Option>
                  ))}
              </Select>
            </Form.Item>

            <div className="pmodal-section-label">
              <UploadIcon size={11} />
              <span>File</span>
            </div>

            <Form.Item required>
              <Upload.Dragger
                fileList={fileList}
                beforeUpload={(file) => {
                  setFileList([{ ...file, originFileObj: file }]);
                  return false;
                }}
                onRemove={() => setFileList([])}
                maxCount={1}
              >
                <div style={{ padding: "20px 0" }}>
                  <p
                    className="ant-upload-drag-icon"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      color: "#8b5cf6",
                      marginBottom: 8,
                    }}
                  >
                    <FilePlus size={36} />
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-slate-900)",
                      fontWeight: 700,
                      margin: 0,
                    }}
                  >
                    Click or drag file to upload
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--text-slate-500)",
                      marginTop: 4,
                    }}
                  >
                    PDF, DOCX, JPG · max one file at a time
                  </p>
                </div>
              </Upload.Dragger>
            </Form.Item>
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
              Start Ingestion
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#f0fdf4", padding: 8, borderRadius: 8, color: "#16a34a", display: "flex" }}>
              <Eye size={20} />
            </div>
            <span style={{ fontWeight: 700, fontSize: 18, color: "var(--text-slate-900)" }}>Archive Preview: {viewingDocument?.fileName}</span>
          </div>
        }
        open={viewModalOpen}
        onCancel={() => {
          setViewModalOpen(false);
          setViewingDocument(null);
        }}
        footer={[
          <Button key="close" style={{ borderRadius: 8 }} onClick={() => setViewModalOpen(false)}>
            Close View
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<Download size={16} />}
            onClick={() => handleDownload(viewingDocument)}
            style={{ borderRadius: 8, fontWeight: 600 }}
          >
            Download Archive
          </Button>,
        ]}
        width={900}
        centered
        bodyStyle={{ height: "75vh", padding: 0 }}
        className="premium-modal"
      >
        {viewingDocument && (
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(
              viewingDocument.fileUrl,
            )}&embedded=true`}
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Document Preview"
          />
        )}
      </Modal>

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-table .ant-table {
          background: transparent !important;
          color: var(--text-slate-700) !important;
        }
        .premium-table .ant-table-thead > tr > th {
          background: var(--bg-slate-50) !important;
          color: var(--text-slate-500) !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          padding: 16px 24px !important;
          border-bottom: 1px solid var(--border-slate-100) !important;
          white-space: nowrap !important;
        }
        .premium-table .ant-table-thead > tr > th::before { display: none !important; }
        @media (max-width: 576px) {
          .premium-table .ant-table-thead > tr > th,
          .premium-table .ant-table-tbody > tr > td {
            padding: 12px 16px !important;
          }
        }
        .premium-table .ant-table-tbody > tr > td {
          padding: 16px 24px !important;
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
          color: #8b5cf6 !important;
        }
        .ant-modal-header {
            border-bottom: 1px solid var(--border-slate-100) !important;
            padding-bottom: 16px !important;
        }
        [data-theme="dark"] .premium-action-btn {
          color: var(--text-slate-400) !important;
        }
        [data-theme="dark"] .premium-action-btn:hover {
          background: rgba(139, 92, 246, 0.16) !important;
          color: #a78bfa !important;
        }
      `}} />
    </div>
  );
}
