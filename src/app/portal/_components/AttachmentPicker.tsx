"use client";

import React from "react";
import { Upload, FileText, X } from "lucide-react";

/**
 * Shared file-attachment picker used inside the portal's Raise-Ticket,
 * Raise-CR, and reply modals.
 *
 * Previously this lived inside `src/app/portal/tickets/page.tsx` and was
 * imported cross-file. Next.js' typed-route system forbids page files from
 * exporting helpers (only `default` + a known list of metadata/config
 * exports), so it now lives here.
 *
 * Single solid surface, no shadows / glass — matches the portal style rule.
 */

const p = {
  surfaceMuted: "#f8fafc",
  border: "#e5e7eb",
  borderStrong: "#d1d5db",
  textMuted: "#475569",
  textSubtle: "#64748b",
  textFaint: "#94a3b8",
};

export interface AttachmentPickerFile {
  name: string;
  size: number;
}

export function AttachmentPicker({
  files,
  onAdd,
  onRemove,
}: {
  files: AttachmentPickerFile[];
  onAdd: (f: File) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          const fs = e.target.files;
          if (!fs) return;
          for (let i = 0; i < fs.length; i++) onAdd(fs[i]);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: "100%",
          padding: 14,
          background: p.surfaceMuted,
          border: `1px dashed ${p.borderStrong}`,
          borderRadius: 10,
          cursor: "pointer",
          color: p.textMuted,
          fontSize: 12.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Upload size={14} />
        Click to attach files
      </button>
      {files.length > 0 && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "8px 10px",
                background: p.surfaceMuted,
                border: `1px solid ${p.border}`,
                borderRadius: 8,
                fontSize: 12.5,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  minWidth: 0,
                }}
              >
                <FileText size={13} color={p.textSubtle} />
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={f.name}
                >
                  {f.name}
                </span>
                <span style={{ color: p.textFaint, fontSize: 11 }}>
                  · {(f.size / 1024).toFixed(1)} KB
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: p.textSubtle,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
