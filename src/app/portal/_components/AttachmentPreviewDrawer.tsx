"use client";

import React, { useEffect, useState } from "react";
import { Drawer } from "antd";
import {

  X,
  Download,
  ExternalLink,
  FileText,
  FileType2,
  Image as ImageIcon,
  Link2,
  AlertTriangle
} from "lucide-react";
import ZukvoLoader from "@/components/common/ZukvoLoader";

/**
 * In-app preview drawer for both uploaded files and external links.
 *
 * Rendering strategy (no shadows, borders only — matches portal style rule):
 *  - kind='file' + mime starts with 'image/' → centered <img> preview
 *  - kind='file' + mime is application/pdf → <iframe> for inline PDF view
 *  - kind='file' + other mime → metadata card + Download button (no preview)
 *  - kind='link' → <iframe> with a fallback "Open in new tab" if the host
 *    blocks framing (browser quietly shows about:blank — we can't detect
 *    this reliably, so we always surface a fallback button)
 */

export interface PreviewAttachment {
  id: string;
  kind: "file" | "link";
  fileName?: string | null;
  fileUrl?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
}

const p = {
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  text: "#0f172a",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
  accent: "#3b82f6",
  accentBg: "#eff6ff",
  accentBorder: "#bfdbfe",
  accentText: "#1d4ed8",
  warningBg: "#fffbeb",
  warningBorder: "#fde68a",
  warningText: "#92400e"
};

function isImage(mime?: string | null): boolean {
  return !!mime && mime.startsWith("image/");
}
function isPdf(mime?: string | null): boolean {
  return mime === "application/pdf";
}

function fmtBytes(b?: number | null): string {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

function hostnameOf(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/* --------------------------------------------------------------- */

export default function AttachmentPreviewDrawer({
  attachment,
  onClose }: {
    attachment: PreviewAttachment | null;
    onClose: () => void;
  }) {
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    setIframeLoading(true);
  }, [attachment?.id]);

  if (!attachment) return null;

  const isFile = attachment.kind === "file";
  const title = isFile
    ? attachment.fileName || "Attachment"
    : attachment.linkLabel || hostnameOf(attachment.linkUrl);
  const subtitle = isFile
    ? `${attachment.mimeType || "file"} · ${fmtBytes(attachment.fileSizeBytes)}`
    : attachment.linkUrl || "";
  const url = isFile ? attachment.fileUrl : attachment.linkUrl;
  const iframeSrc = (isFile && isPdf(attachment.mimeType) && url)
    ? `/api/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(attachment.fileName || '')}&inline=true`
    : url || "";

  const HeaderIcon = isFile
    ? isImage(attachment.mimeType)
      ? ImageIcon
      : isPdf(attachment.mimeType)
        ? FileType2
        : FileText
    : Link2;

  return (
    <Drawer
      open={!!attachment}
      onClose={onClose}
      width={Math.min(960, typeof window !== "undefined" ? window.innerWidth - 80 : 960)}
      title={null}
      closable={false}
      styles={{
        mask: { backgroundColor: "rgba(15,23,42,0.55)" },
        content: { background: p.surface },
        header: { display: "none" },
        body: { padding: 0, background: p.surface, display: "flex", flexDirection: "column" }
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${p.border}`,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: p.accentBg,
            color: p.accentText,
            border: `1px solid ${p.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <HeaderIcon size={17} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 600,
              color: p.text,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
            title={title || ""}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 11.5,
              color: p.textSubtle,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
            title={subtitle}
          >
            {subtitle}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 11px",
                background: "#ffffff",
                border: `1px solid ${p.border}`,
                borderRadius: 7,
                color: p.textMuted,
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 500
              }}
            >
              <ExternalLink size={12} />
              Open in new tab
            </a>
          )}
          {isFile && url && (
            <a
              href={url}
              download={attachment.fileName || true}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 11px",
                background: p.text,
                border: `1px solid ${p.text}`,
                borderRadius: 7,
                color: "#ffffff",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 600
              }}
            >
              <Download size={12} />
              Download
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              background: "#ffffff",
              border: `1px solid ${p.border}`,
              borderRadius: 7,
              color: p.textSubtle,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          background: p.surfaceMuted,
          padding: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "auto"
        }}
      >
        {!url ? (
          <EmptyState title="No URL on this attachment" />
        ) : isFile && isImage(attachment.mimeType) ? (
          <img
            src={url}
            alt={attachment.fileName || ""}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              border: `1px solid ${p.border}`,
              borderRadius: 8,
              background: "#ffffff"
            }}
          />
        ) : isFile && !isPdf(attachment.mimeType) ? (
          // Non-previewable file — show metadata card
          <NoPreviewCard
            attachment={attachment}
            note="This file type doesn't preview inline. Use Download to view it locally."
          />
        ) : (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              minHeight: 480,
              background: "#ffffff",
              border: `1px solid ${p.border}`,
              borderRadius: 8,
              overflow: "hidden"
            }}
          >
            {iframeLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: p.textSubtle,
                  fontSize: 12.5,
                  gap: 8
                }}
              >
                <ZukvoLoader size="sm" /> Loading preview…
              </div>
            )}
            <iframe
              src={iframeSrc}
              onLoad={() => setIframeLoading(false)}
              style={{
                width: "100%",
                height: "100%",
                border: 0,
                display: "block"
              }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
              referrerPolicy="no-referrer"
              title={title || "preview"}
            />
          </div>
        )}
      </div>

      {/* Footer hint for external links (some hosts block framing) */}
      {!isFile && (
        <div
          style={{
            padding: "8px 20px",
            borderTop: `1px solid ${p.border}`,
            background: p.warningBg,
            color: p.warningText,
            fontSize: 11.5,
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <AlertTriangle size={11} />
          Some sites (Notion, Google Docs, Figma) block being shown inside other
          apps. If the preview is blank, use <strong>Open in new tab</strong>.
        </div>
      )}
    </Drawer>
  );
}

/* --------------------------------------------------------------- */

function EmptyState({ title }: { title: string }) {
  return (
    <div
      style={{
        padding: 40,
        fontSize: 13,
        color: p.textSubtle,
        textAlign: "center"
      }}
    >
      {title}
    </div>
  );
}

function NoPreviewCard({
  attachment,
  note }: {
    attachment: PreviewAttachment;
    note: string;
  }) {
  return (
    <div
      style={{
        padding: 28,
        background: "#ffffff",
        border: `1px solid ${p.border}`,
        borderRadius: 12,
        maxWidth: 460,
        textAlign: "center"
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 12,
          background: p.accentBg,
          color: p.accentText,
          border: `1px solid ${p.accentBorder}`,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14
        }}
      >
        <FileText size={22} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: p.text }}>
        {attachment.fileName || "File"}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 11.5,
          color: p.textSubtle
        }}
      >
        {attachment.mimeType || "Unknown type"} ·{" "}
        {fmtBytes(attachment.fileSizeBytes)}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 12.5,
          color: p.textMuted,
          lineHeight: 1.55
        }}
      >
        {note}
      </div>
    </div>
  );
}
