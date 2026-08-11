"use client";
import LoadingSpinner from "@/components/common/LoadingSpinner";

import React from "react";
import { Tag, Tooltip, Typography } from "antd";
import {
  FolderOpenOutlined,
  ArrowRightOutlined,
  FileTextOutlined } from "@ant-design/icons";
import { DocumentHub } from "@/services/documentHub";
import { formatDistanceToNow } from "date-fns";


interface LinkedDocumentHubsListProps {
  hubs: DocumentHub[];
  isLoading: boolean;
  onOpenHub: (hubId: string) => void;
}

export default function LinkedDocumentHubsList({
  hubs,
  isLoading,
  onOpenHub }: LinkedDocumentHubsListProps) {
  if (!isLoading && hubs.length === 0) return null;

  return (
    <div style={{ marginTop: 16, marginBottom: 4 }}>
      <style>{`
        .linked-doc-hub-row {
          background: var(--bg-pure-white);
          border-color: var(--border-slate-200);
        }
        .linked-doc-hub-row:hover {
          border-color: #6366F1;
          background: #F8FAFF;
        }
        [data-theme='dark'] .linked-doc-hub-row:hover {
          border-color: #818cf8;
          background: rgba(99, 102, 241, 0.12);
        }
        [data-theme='dark'] .linked-doc-hub-row:hover .linked-doc-hub-row__title {
          color: #f1f5f9;
        }
        [data-theme='dark'] .linked-doc-hub-row:hover .linked-doc-hub-row__meta {
          color: #cbd5e1;
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10 }}
      >
        <Typography.Title
          level={5}
          style={{
            fontSize: 13,
            margin: 0,
            color: "var(--text-primary)" }}
        >
          Linked Document Hubs
          {hubs.length > 0 && (
            <span
              style={{
                fontSize: 12,
                color: "var(--text-secondary)",
                fontWeight: 400,
                marginLeft: 6 }}
            >
              • {hubs.length}
            </span>
          )}
        </Typography.Title>
      </div>

      {isLoading ? (
        <div style={{ padding: "8px 4px" }}>
          <LoadingSpinner size="small" fullScreen={false} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {hubs.map((hub) => {
            const fileCount =
              hub.treeNodes?.filter((n) => n.type === "file").length || 0;
            return (
              <div
                key={hub.id}
                onClick={() => onOpenHub(hub.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenHub(hub.id);
                  }
                }}
                className="linked-doc-hub-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "8px 10px",
                  border: "1px solid",
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.15s" }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    borderRadius: 8,
                    background:
                      "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(59,130,246,0.25)" }}
                >
                  <FolderOpenOutlined style={{ fontSize: 15 }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                  <span
                    className="linked-doc-hub-row__title"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--text-slate-900)",
                      lineHeight: 1.25,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap" }}
                  >
                    {hub.name}
                  </span>
                  <div
                    className="linked-doc-hub-row__meta"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 2,
                      fontSize: 11,
                      color: "var(--text-slate-400)" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <FileTextOutlined />
                      {fileCount} {fileCount === 1 ? "doc" : "docs"}
                    </span>
                    {hub.updatedAt && (
                      <Tooltip title={new Date(hub.updatedAt).toLocaleString()}>
                        <span>
                          Updated{" "}
                          {formatDistanceToNow(new Date(hub.updatedAt), {
                            addSuffix: true })}
                        </span>
                      </Tooltip>
                    )}
                    {hub.project?.name && (
                      <Tag
                        style={{
                          margin: 0,
                          fontSize: 10,
                          padding: "0 6px",
                          lineHeight: "16px",
                          borderRadius: 6 }}
                      >
                        {hub.project.name}
                      </Tag>
                    )}
                  </div>
                </div>

                <ArrowRightOutlined
                  style={{ fontSize: 12, color: "var(--text-slate-400)" }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
