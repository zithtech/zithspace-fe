"use client";

import React from "react";
import { Image, Tag } from "antd";
import { Laptop } from "lucide-react";

interface AssetsProps {
  assets: any[];
}

const Assets: React.FC<AssetsProps> = ({ assets }) => {
  const list: any[] = Array.isArray(assets) ? assets : [];

  if (list.length === 0) {
    return (
      <div
        style={{
          padding: "56px 0",
          textAlign: "center",
          background: "var(--bg-slate-50)",
          borderRadius: 14,
          border: "1px dashed var(--border-slate-200)",
        }}
      >
        <Laptop
          size={42}
          color="var(--text-slate-400)"
          style={{ marginBottom: 14 }}
        />
        <div style={{ color: "var(--text-slate-500)", fontSize: 14 }}>
          No assets have been assigned to you yet.
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
        gap: 16,
      }}
    >
      {list.map((asset: any, i: number) => {
        const returned =
          typeof asset.returnStatus === "string"
            ? /return/i.test(asset.returnStatus)
            : !!asset.returnStatus;

        return (
          <div
            key={i}
            style={{
              background: "var(--bg-pure-white)",
              border: "1px solid var(--border-slate-100)",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
            }}
          >
            <div style={{ display: "flex", gap: 14 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  background: "var(--bg-slate-50)",
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--border-slate-100)",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {asset.image ? (
                  <Image
                    alt="asset"
                    src={asset.image}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Laptop size={28} color="var(--text-slate-400)" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14.5,
                      fontWeight: 700,
                      color: "var(--text-slate-900)",
                      marginBottom: 2,
                      wordBreak: "break-word",
                    }}
                  >
                    {asset.item || "Asset"}
                  </div>
                  <Tag
                    style={{
                      margin: 0,
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 10,
                      border: "none",
                      flexShrink: 0,
                      background: returned
                        ? "rgba(239,68,68,0.10)"
                        : "rgba(16,185,129,0.10)",
                      color: returned ? "#EF4444" : "#10B981",
                    }}
                  >
                    {returned ? "RETURNED" : "IN USE"}
                  </Tag>
                </div>
                <div
                  style={{ fontSize: 13, color: "var(--text-slate-500)" }}
                >
                  {[asset.brand, asset.model].filter(Boolean).join(" · ") || "—"}
                </div>
                {asset.modelNumber && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 10.5,
                      color: "var(--text-slate-400)",
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    S/N: {asset.modelNumber}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: "1px solid var(--border-slate-100)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <DetailRow label="Condition" value={asset.condition} />
              <DetailRow
                label="Return Status"
                value={asset.returnStatus}
              />
              {asset.remarks && (
                <DetailRow label="Remarks" value={asset.remarks} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}
  >
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "var(--text-slate-400)",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--text-slate-900)",
        textAlign: "right",
        wordBreak: "break-word",
      }}
    >
      {value || "—"}
    </span>
  </div>
);

export default Assets;
