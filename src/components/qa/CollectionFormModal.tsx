"use client";

/**
 * Creating and editing a collection's identity — compact, non-scrolling modal
 * with internal scrollable form body.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, message } from "antd";
import { Layers, Lock, Sparkles } from "lucide-react";

import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { api as axios } from "@/lib/axios";
import { CollectionIcon } from "@/components/qa/CollectionIcon";
import {
  INDUSTRY_OPTIONS,
  iconForIndustry,
} from "@/components/qa/collectionVocabulary";
import {
  type CollectionSummary,
  type PlaybookStatus,
  type PlaybookVisibility,
} from "@/components/qa/playbookShared";

export default function CollectionFormModal({
  collection,
  existing = [],
  industries = [],
  open,
  onClose,
  onSaved,
  canCurate = false,
}: {
  collection?: (CollectionSummary & { description?: string | null }) | null;
  existing?: CollectionSummary[];
  industries?: string[];
  open: boolean;
  onClose: () => void;
  onSaved?: (slug: string) => void;
  canCurate?: boolean;
}) {
  const queryClient = useQueryClient();
  const editing = Boolean(collection);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [visibility, setVisibility] = useState<PlaybookVisibility>("workspace");
  const [status, setStatus] = useState<PlaybookStatus>("draft");
  const [priceAmount, setPriceAmount] = useState("");
  const [priceCredits, setPriceCredits] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(collection?.name ?? "");
    setIndustry(collection?.industry ?? "");
    setSummary(collection?.summary ?? "");
    setDescription(collection?.description ?? "");
    setVisibility(collection?.visibility ?? "workspace");
    setStatus(collection?.status ?? "draft");
    setSortOrder(
      String(
        collection?.sortOrder ??
          existing.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), 0) + 10
      )
    );
    setPriceAmount(collection?.priceAmount ?? "");
    setPriceCredits(collection?.priceCredits != null ? String(collection.priceCredits) : "");
  }, [open, collection, existing]);

  const taken = useMemo(() => {
    const set = new Set<string>();
    for (const c of existing) {
      if (collection && c.id === collection.id) continue;
      set.add(c.name.trim().toLowerCase());
    }
    return set;
  }, [existing, collection]);

  const industryOptions = useMemo(() => INDUSTRY_OPTIONS(industries), [industries]);
  const clash = taken.has(name.trim().toLowerCase());
  const icon = iconForIndustry(industry, collection?.icon);

  const save = useMutation({
    mutationFn: () => {
      const isPremium = visibility === "premium" && canCurate;
      const body = {
        name: name.trim(),
        kind: collection?.kind ?? "industry",
        industry: industry.trim() || null,
        summary: summary.trim() || null,
        description: description.trim() || null,
        icon,
        visibility: isPremium ? "premium" : visibility,
        status,
        price_amount: isPremium && priceAmount ? Number(priceAmount) : null,
        price_credits: isPremium && priceCredits ? Number(priceCredits) : null,
        sort_order: Number(sortOrder) || 0,
      };
      return collection
        ? axios.put(`/api/v2/qa/playbooks/collections/${collection.id}`, body)
        : axios.post("/api/v2/qa/playbooks/collections", body);
    },
    onSuccess: (result: any) => {
      message.success(editing ? "Collection updated" : "Collection created");
      queryClient.invalidateQueries({ queryKey: ["qa", "collections"] });
      onSaved?.(result?.slug);
      onClose();
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.error || err?.message || "Could not save the collection"
      );
    },
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 700 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "rgba(59, 130, 246, 0.1)",
              color: "#2563eb",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers size={16} />
          </span>
          {editing ? "Edit Collection" : "Create Collection"}
        </div>
      }
      width={640}
      centered
      className="pbf-modal-compact"
      styles={{
        body: {
          maxHeight: "calc(78vh - 120px)",
          overflowY: "auto",
          overflowX: "hidden",
          paddingRight: "6px",
          paddingTop: "4px",
          paddingBottom: "8px",
        },
      }}
      footer={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={save.isPending}
            disabled={!name.trim() || clash}
            onClick={() => save.mutate()}
            style={{ borderRadius: 8, minWidth: 100 }}
          >
            {editing ? "Save Changes" : "Create Collection"}
          </Button>
        </div>
      }
    >
      <style jsx global>{`
        .pbf-modal-compact .ant-modal-content {
          border-radius: 14px;
          overflow: hidden;
          padding: 20px 24px 16px 24px;
        }
        .pbf-modal-compact .ant-modal-header {
          margin-bottom: 14px;
        }
        .pbf-modal-compact .ant-modal-footer {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--border-slate-200, #e2e8f0);
        }

        /* ── Compact Preview Box ── */
        .pbf-preview-compact {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 10px;
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.01));
          border: 1px solid rgba(59, 130, 246, 0.18);
          margin-bottom: 14px;
        }
        .pbf-preview-compact__av {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
          flex-shrink: 0;
        }
        .pbf-preview-compact__body {
          flex: 1;
          min-width: 0;
        }
        .pbf-preview-compact__name {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--text-slate-900, #0f172a);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pbf-preview-compact__meta {
          font-size: 11.5px;
          color: var(--text-slate-500, #64748b);
          margin-top: 1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ── Compact Grid Layout ── */
        .pbf-compact-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .pbf-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 580px) {
          .pbf-grid-2 {
            grid-template-columns: 1fr;
          }
        }
        .pbf-cfield {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .pbf-clabel {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-slate-800, #1e293b);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .pbf-chint {
          font-size: 11px;
          line-height: 1.4;
          color: var(--text-slate-400, #94a3b8);
          margin-top: 2px;
        }
        .pbf-chint.is-warn {
          color: #dc2626;
        }
      `}</style>

      {/* ── Live Preview Card ── */}
      <div className="pbf-preview-compact">
        <span className="pbf-preview-compact__av">
          <CollectionIcon name={icon} size={18} />
        </span>
        <div className="pbf-preview-compact__body">
          <div className="pbf-preview-compact__name">
            {name.trim() || <span style={{ color: "#94a3b8", fontWeight: 500 }}>Untitled collection</span>}
          </div>
          <div className="pbf-preview-compact__meta">
            {industry.trim() || "General"}
            {summary.trim() ? ` · ${summary.trim()}` : ""}
          </div>
        </div>
      </div>

      {/* ── Compact Scrollable Form ── */}
      <div className="pbf-compact-form">
        {/* Row 1: Name & Industry */}
        <div className="pbf-grid-2">
          <div className="pbf-cfield">
            <label className="pbf-clabel">
              <span>Collection Name</span>
              <span style={{ fontSize: 10, color: "#2563eb", fontWeight: 600 }}>Required</span>
            </label>
            <Input
              value={name}
              maxLength={120}
              placeholder="e.g., Fintech & Payments"
              onChange={(e) => setName(e.target.value)}
              style={{ borderRadius: 8, height: 36 }}
            />
            {clash && (
              <div className="pbf-chint is-warn">
                “{name.trim()}” is already taken on the shelf.
              </div>
            )}
          </div>

          <div className="pbf-cfield">
            <label className="pbf-clabel">Industry / Domain</label>
            <SearchableDropdown
              value={industry || null}
              onChange={(value: string) => setIndustry(value || "")}
              options={industryOptions}
              freeText
              allowClear
              hideAvatar
              placeholder="Select or type domain…"
              searchPlaceholder="Search or type industry…"
              itemNoun="industries"
              width="100%"
              style={{ width: "100%", borderRadius: 8 }}
            />
          </div>
        </div>

        {/* Row 2: Summary */}
        <div className="pbf-cfield">
          <label className="pbf-clabel">Summary</label>
          <Input
            value={summary}
            maxLength={400}
            placeholder="One-line summary for shelf card preview"
            onChange={(e) => setSummary(e.target.value)}
            style={{ borderRadius: 8, height: 36 }}
          />
        </div>

        {/* Row 3: Description */}
        <div className="pbf-cfield">
          <label className="pbf-clabel">Description</label>
          <Input.TextArea
            value={description}
            rows={2}
            maxLength={20000}
            placeholder="Detailed overview of what this collection covers…"
            onChange={(e) => setDescription(e.target.value)}
            style={{ borderRadius: 8, resize: "none" }}
          />
        </div>

        {/* Row 4: Status & Visibility */}
        <div className={status === "published" ? "pbf-grid-2" : "pbf-cfield"}>
          <div className="pbf-cfield">
            <label className="pbf-clabel">Status</label>
            <SearchableDropdown
              value={status}
              onChange={(value: string) => setStatus(value as PlaybookStatus)}
              options={[
                {
                  value: "draft",
                  label: "Draft",
                  description: "Work in progress (visible only to you)",
                },
                {
                  value: "published",
                  label: "Published",
                  description: "Live on shelf",
                },
              ]}
              placeholder="Select status"
              hideAvatar
              width="100%"
              style={{ width: "100%", borderRadius: 8 }}
            />
          </div>

          {status === "published" && (
            <div className="pbf-cfield">
              <label className="pbf-clabel">Visibility</label>
              <SearchableDropdown
                value={visibility}
                onChange={(value: string) => setVisibility(value as PlaybookVisibility)}
                options={[
                  {
                    value: "workspace",
                    label: "Private (My Workspace)",
                    description: "Visible only within your workspace tenant",
                  },
                  {
                    value: "public",
                    label: "Public",
                    description: "Visible to all workspaces and tenants",
                  },
                  ...(canCurate
                    ? [
                        {
                          value: "premium",
                          label: "Premium",
                          description: "Listed everywhere, unlocked on purchase",
                        },
                      ]
                    : []),
                ]}
                placeholder="Select visibility"
                hideAvatar
                width="100%"
                style={{ width: "100%", borderRadius: 8 }}
              />
            </div>
          )}
        </div>

        {/* Curator Pricing row if Premium */}
        {canCurate && status === "published" && visibility === "premium" && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: "#faf5ff",
              border: "1px solid #f3e8ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#7e22ce" }}>
              Premium Pricing
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                value={priceAmount}
                style={{ width: 100, borderRadius: 6 }}
                placeholder="Price"
                prefix="$"
                inputMode="decimal"
                onChange={(e) => setPriceAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              />
              <Input
                value={priceCredits}
                style={{ width: 100, borderRadius: 6 }}
                placeholder="Credits"
                inputMode="numeric"
                onChange={(e) => setPriceCredits(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>
        )}

        {/* Row 5: Shelf Position */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
          <span style={{ fontSize: 11.5, color: "#64748b" }}>
            Shelf sort order (lower appears first):
          </span>
          <Input
            value={sortOrder}
            inputMode="numeric"
            style={{ width: 80, textAlign: "center", borderRadius: 6, height: 30 }}
            onChange={(e) => setSortOrder(e.target.value.replace(/[^0-9]/g, ""))}
          />
        </div>
      </div>
    </Modal>
  );
}
