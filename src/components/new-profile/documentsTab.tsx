"use client";

import React from "react";
import { Tag, Button } from "antd";
import { FileText, Eye } from "lucide-react";
import dayjs from "dayjs";

interface DocumentsProps {
  documents: any[];
}

const DocumentsTab: React.FC<DocumentsProps> = ({ documents }) => {
  const list = Array.isArray(documents) ? documents : [];

  if (list.length === 0) {
    return (
      <div
        style={{
          marginTop: 16,
          padding: "56px 0",
          textAlign: "center",
          background: "var(--bg-secondary, #f8fafc)",
          borderRadius: 14,
          border: "1px dashed var(--border-color, #e2e8f0)",
        }}
      >
        <FileText
          size={42}
          color="var(--text-secondary, #94a3b8)"
          style={{ marginBottom: 14 }}
        />
        <div style={{ color: "var(--text-secondary, #64748b)", fontSize: 14 }}>
          No documents have been uploaded yet.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        marginTop: 16,
      }}
    >
      {list.map((doc: any, i: number) => {
        return (
          <div
            key={i}
            style={{
              background: "var(--bg-primary, #ffffff)",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: 12,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--primary-color, #3b82f6)";
              (e.currentTarget as HTMLDivElement).style.background = "var(--bg-secondary, #f8fafc)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-color, #e2e8f0)";
              (e.currentTarget as HTMLDivElement).style.background = "var(--bg-primary, #ffffff)";
            }}
            onClick={() => {
              if (doc.documentUrl) window.open(doc.documentUrl, "_blank");
            }}
          >
            <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  background: "rgba(59, 130, 246, 0.1)",
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <FileText size={22} color="#3b82f6" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary, #1e293b)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {doc.documentName || doc.documentType || "Unnamed Document"}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary, #64748b)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{doc.documentType}</span>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--border-color, #e2e8f0)" }} />
                  <span>{doc.uploadedAt ? dayjs(doc.uploadedAt).format("MMM D, YYYY") : "Unknown Date"}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Tag 
                color={doc.status === "uploaded" ? "success" : doc.status === "pending" ? "warning" : "error"} 
                style={{ borderRadius: 6, margin: 0, padding: "2px 8px", fontWeight: 500, fontSize: 12 }}
              >
                {doc.status ? doc.status.toUpperCase() : "UNKNOWN"}
              </Tag>
              
              {doc.documentUrl && (
                <Button 
                  type="text" 
                  icon={<Eye size={18} />} 
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(doc.documentUrl, "_blank");
                  }}
                  style={{ color: "var(--text-secondary, #64748b)", display: "flex", alignItems: "center", justifyContent: "center" }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentsTab;
