"use client";
import React, { forwardRef, useEffect, useState, useImperativeHandle } from "react";
import { Button, Drawer, Form, Input, Upload, message, Typography, Select, DatePicker } from "antd";
import { Plus, Trash2, FileText, UploadCloud } from "lucide-react";
import dayjs from "dayjs";
import { commonDrawerProps, drawerFormStyles, SectionCard } from "@/components/common/DrawerSection";
import { SearchableDropdown } from "@/components/common/SearchableDropdown";

const { Text } = Typography;

const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-slate-500)",
  marginBottom: "4px",
  display: "inline-block",
};

const DOC_TYPES = [
  "Passport",
  "National ID",
  "Driver's License",
  "Offer Letter",
  "Employment Contract",
  "Relieving Letter",
  "Payslip",
  "Bank Statement",
  "Degree Certificate",
  "Tax Form",
  "Other",
];

const Documents = forwardRef(({ data }: any, ref: any) => {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setDocuments(data);
    }
  }, [data]);

  useImperativeHandle(ref, () => ({
    validate: async () => true,
    getData: () => documents.filter((d) => !d.id),
  }));

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_SIZE) {
      message.error("File size must be less than 5MB");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAddDocument = async () => {
    const values = await form.validateFields();
    const fileObj = values.file?.[0];

    if (!fileObj?.originFileObj) {
      message.error("Please upload a file");
      return;
    }

    const fileBase64 = await fileToBase64(fileObj.originFileObj);

    const docData = {
      documentType: values.documentType,
      documentName: values.documentType,
      notes: values.notes,
      fileBase64,
      fileName: fileObj.originFileObj.name,
      documentUrl: "",
      status: "uploaded",
    };

    setDocuments((prev) => [docData, ...prev]);
    form.resetFields();
    setOpen(false);
  };

  const handleDelete = (index: number, doc: any) => {
    if (doc.id) {
      message.error("Existing documents can only be deleted from the main Documents module.");
      return;
    }
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="ob-doc-wrap" style={{ padding: "0 24px 24px", minHeight: 400 }}>
      <div className="ob-doc-header">
        <div>
          <h1 className="ob-doc-title">Employee Documents</h1>
          <p className="ob-doc-subtitle">Upload required HR documents for this employee</p>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          size="large"
          className="ob-doc-add-btn"
          onClick={() => setOpen(true)}
        >
          Add Document
        </Button>
      </div>

      <div className="ob-doc-table-wrap">
        <div className="ob-doc-table-head">
          <div className="ob-doc-col ob-doc-col--name">DOCUMENT</div>
          <div className="ob-doc-col ob-doc-col--type">TYPE</div>
          <div className="ob-doc-col ob-doc-col--status">STATUS</div>
          <div className="ob-doc-col ob-doc-col--actions"></div>
        </div>

        {documents.length === 0 ? (
          <div className="ob-doc-center">
            <div style={{ textAlign: "center", color: "var(--text-slate-400)" }}>
              <div style={{
                width: 64, height: 64, background: "var(--bg-secondary)",
                borderRadius: 16, display: "inline-flex", alignItems: "center",
                justifyContent: "center", marginBottom: 16
              }}>
                <FileText size={28} style={{ color: "var(--text-secondary)" }} />
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                No Documents Yet
              </div>
              <div style={{ fontSize: 13, marginTop: 4 }}>
                Click "Add Document" to upload files.
              </div>
            </div>
          </div>
        ) : (
          <div>
            {documents.map((doc, i) => (
              <div key={i} className="ob-doc-row">
                <div className="ob-doc-col ob-doc-col--name">
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(59, 130, 246, 0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={18} style={{ color: "#3b82f6" }} />
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <div className="ob-doc-doc-name">{doc.documentName || doc.documentType}</div>
                    <div className="ob-doc-muted" style={{ fontSize: 11.5 }}>
                      {doc.fileName || (doc.id ? "Already saved" : "New upload")}
                    </div>
                  </div>
                </div>

                <div className="ob-doc-col ob-doc-col--type">
                  <span className="ob-doc-type-badge">{doc.documentType}</span>
                </div>

                <div className="ob-doc-col ob-doc-col--status">
                  <span className="ob-doc-status-badge" style={{
                    background: doc.id ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                    color: doc.id ? "#10b981" : "#f59e0b",
                    border: doc.id ? "1px solid rgba(16, 185, 129, 0.2)" : "1px solid rgba(245, 158, 11, 0.2)"
                  }}>
                    {doc.id ? "Saved" : "Pending Save"}
                  </span>
                </div>

                <div className="ob-doc-col ob-doc-col--actions">
                  <button
                    className="ob-doc-action-btn ob-doc-action-btn--danger"
                    title={doc.id ? "Cannot delete saved documents here" : "Remove"}
                    onClick={() => handleDelete(i, doc)}
                    disabled={!!doc.id}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Drawer
        {...commonDrawerProps}
        open={open}
        onClose={() => setOpen(false)}
      >
        <style>{drawerFormStyles}</style>
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }} className="customer-drawer-form">
          <div
            className="customer-drawer-header"
            style={{
              padding: "16px 14px 12px 14px",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              position: "sticky",
              top: 0,
              zIndex: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 0,
                  background: "rgba(59, 130, 246, 0.10)",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                <Plus size={20} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  Add Document
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                  Upload HR documents
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ padding: 24, background: "var(--customers-page-bg, #0B0F1A)" }}>
            <div className="customer-drawer-card" style={{ border: "1px solid var(--border-color)", borderRadius: "12px", background: "var(--bg-primary)", padding: "24px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ width: "40px", height: "40px", background: "rgba(59, 130, 246, 0.10)", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.20)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", fontWeight: 700, fontSize: "16px" }}>
                  01
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>Document Details</div>
                  <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Enter the basic information for this document</div>
                </div>
              </div>
              <div style={{ borderBottom: "1px dashed var(--border-color)", marginBottom: "24px" }} />
              
              <Form 
                form={form} 
                layout="horizontal" 
                labelCol={{ span: 6 }} 
                wrapperCol={{ span: 18 }}
                labelAlign="left"
                colon={false}
              >
                <Form.Item
                  name="documentType"
                  label={<span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-slate-400)" }}>Document Type</span>}
                  rules={[{ required: true, message: "Type is required" }]}
                  style={{ marginBottom: "24px" }}
                >
                  <SearchableDropdown
                    style={{ height: "44px", borderRadius: "8px" }}
                    placeholder="Select type"
                    options={DOC_TYPES.map((t) => ({ label: t, value: t }))}
                  />
                </Form.Item>

                <Form.Item
                  name="file"
                  label={<span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-slate-400)" }}>Upload File</span>}
                  valuePropName="fileList"
                  getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                  rules={[{ required: true, message: "File is required" }]}
                  style={{ marginBottom: "24px" }}
                >
                  <Upload.Dragger
                    beforeUpload={handleBeforeUpload}
                    maxCount={1}
                    accept=".pdf,.jpg,.jpeg,.png"
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadCloud style={{ color: "#3b82f6" }} />
                    </p>
                    <p className="ant-upload-text">Click or drag file to this area to upload</p>
                    <p className="ant-upload-hint">Support for a single upload. Maximum size 5MB.</p>
                  </Upload.Dragger>
                </Form.Item>

                <Form.Item
                  name="notes"
                  label={<span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-slate-400)" }}>Notes (Optional)</span>}
                  style={{ marginBottom: "0" }}
                >
                  <Input.TextArea rows={3} placeholder="Add any additional notes here..." style={{ borderRadius: "8px", fontSize: "14px", background: "var(--bg-primary)", color: "var(--text-primary)", borderColor: "var(--border-color)" }} />
                </Form.Item>
              </Form>
            </div>
          </div>

          <div
            className="customer-drawer-footer"
            style={{
              padding: "16px",
              borderTop: "1px solid var(--border-color)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              position: "sticky",
              bottom: 0,
              zIndex: 10,
            }}
          >
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleAddDocument}>
              Add Document
            </Button>
          </div>
        </div>
      </Drawer>

      <style jsx>{`
        .ob-doc-wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
          flex: 1;
        }
        .ob-doc-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 6px 0 2px;
        }
        .ob-doc-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.025em;
          line-height: 1.1;
        }
        .ob-doc-subtitle {
          margin: 4px 0 0;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .ob-doc-table-wrap {
          border: 1px solid var(--border-color);
          border-radius: 0px;
          background: var(--bg-primary);
          overflow: hidden;
          flex: 1;
        }
        .ob-doc-table-head {
          display: flex;
          align-items: center;
          padding: 0 14px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border-color);
          min-height: 42px;
        }
        .ob-doc-row {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-bottom: 1px solid var(--border-color);
          transition: background 0.12s ease;
        }
        .ob-doc-row:last-child { border-bottom: none; }
        .ob-doc-row:hover { background: var(--bg-secondary); }
        .ob-doc-col {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }
        .ob-doc-table-head .ob-doc-col {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-slate-400);
        }
        .ob-doc-col--name    { flex: 1.6; min-width: 0; }
        .ob-doc-col--type    { flex: 1.2; min-width: 0; }
        .ob-doc-col--date    { flex: 0 0 110px; }
        .ob-doc-col--status  { flex: 0 0 90px; }
        .ob-doc-col--actions { flex: 0 0 90px; justify-content: flex-end; }
        .ob-doc-doc-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ob-doc-muted {
          font-size: 12.5px;
          color: var(--text-secondary);
        }
        .ob-doc-type-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
        }
        .ob-doc-status-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          white-space: nowrap;
        }
        .ob-doc-action-btn {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
        }
        .ob-doc-action-btn:hover { background: var(--bg-primary); color: var(--text-primary); }
        .ob-doc-action-btn--danger:hover:not(:disabled) { color: #dc2626; border-color: #fecaca; background: #fff1f2; }
        .ob-doc-action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .ob-doc-center {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 64px 24px;
          min-height: 280px;
        }
      `}</style>
    </div>
  );
});

Documents.displayName = "Documents";
export default Documents;
