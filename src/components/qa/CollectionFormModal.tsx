"use client";

/**
 * Creating and editing a collection's identity — everything except its
 * membership, which is the curation drawer's job.
 *
 * TWO FIELDS DOING TWO JOBS, which is the correction migration 010 makes:
 *
 *   Name      free text. What this pack is CALLED — "Fintech Essentials",
 *             "Our Q3 regression pack". Nothing constrains it.
 *   Industry  a dropdown. Who it is FOR. Picked from the list, or typed to
 *             add a new one.
 *
 * They were one field before, and that collapsed two different things: there
 * was no way to have two packs for one industry, and the industry itself lived
 * in free text where "Fintech", "FinTech" and "Financial services" become
 * three audiences. The dropdown is what keeps the vocabulary from drifting;
 * being able to type into it is what keeps the list from being a cage.
 *
 * NO KIND PICKER. Everything authored here is an industry pack. The other kinds
 * — a compliance standard, an editorial "start here" — are Testiez's own seeded
 * rows, and asking every author to classify their pack five ways was a question
 * about the taxonomy rather than about their work.
 *
 * NO ICON FIELD. It is derived from the industry, and preserved as-is on a
 * collection that already has one. The preview at the top shows the result.
 *
 * WHO SEES WHAT: a curator gets the tier and price fields, because only the
 * platform library may be sold. Everyone else is authoring a pack for their own
 * workspace, where 'workspace' is the only tier that exists — so those fields
 * are not shown, and the server forces the tier regardless of what this form
 * sends.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Checkbox, Input, Modal, message } from "antd";

import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { api as axios } from "@/lib/axios";
import { CollectionIcon } from "@/components/qa/CollectionIcon";
import {
  INDUSTRY_OPTIONS,
  iconForIndustry,
} from "@/components/qa/collectionVocabulary";
import {
  type CollectionSummary,
} from "@/components/qa/playbookShared";

export default function CollectionFormModal({
  collection,
  existing = [],
  industries = [],
  open,
  onClose,
  onSaved,
  /** Curator — may publish to the platform library and price it. */
  canCurate = false,
}: {
  /**
   * Absent when creating. `description` comes with it because a save sends the
   * WHOLE record — seeding the form from a summary alone would silently blank
   * the description of every collection anyone edited.
   */
  collection?: (CollectionSummary & { description?: string | null }) | null;
  /** What is already on the shelf, so a duplicate name can be pointed out. */
  existing?: CollectionSummary[];
  /** Industries anyone has already used, merged into the picker's list. */
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
  const [premium, setPremium] = useState(false);
  const [priceAmount, setPriceAmount] = useState("");
  const [priceCredits, setPriceCredits] = useState("");

  /* Re-seed on open so a cancelled edit leaves nothing behind. */
  useEffect(() => {
    if (!open) return;
    setName(collection?.name ?? "");
    setIndustry(collection?.industry ?? "");
    setSummary(collection?.summary ?? "");
    setDescription(collection?.description ?? "");
    /* A new pack goes at the END of the shelf, not the front. Defaulting to 0
       put every freshly created collection ahead of the curated ones, which is
       the opposite of what a first draft has earned. Gaps of ten so it can be
       slotted between two others later without renumbering the row. */
    setSortOrder(
      String(
        collection?.sortOrder ??
          existing.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), 0) + 10
      )
    );
    setPremium(collection?.visibility === "premium");
    setPriceAmount(collection?.priceAmount ?? "");
    setPriceCredits(collection?.priceCredits != null ? String(collection.priceCredits) : "");
  }, [open, collection, existing]);

  /* Names already on the shelf, so the picker can say so rather than letting
     someone create a second "Fintech & Payments" and wonder why. The one being
     edited does not count as a clash with itself. */
  const taken = useMemo(() => {
    const set = new Set<string>();
    for (const c of existing) {
      if (collection && c.id === collection.id) continue;
      set.add(c.name.trim().toLowerCase());
    }
    return set;
  }, [existing, collection]);

  /* One source with the short "where does this playbook belong?" step, so the
     two cannot start offering different lists. */
  const industryOptions = useMemo(() => INDUSTRY_OPTIONS(industries), [industries]);

  const clash = taken.has(name.trim().toLowerCase());
  const icon = iconForIndustry(industry, collection?.icon);

  const save = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        /* Everything authored through this form is an industry pack. The other
           kinds are Testiez's seeded rows; an edit keeps whatever it already
           is rather than being reclassified by a form that no longer asks. */
        kind: collection?.kind ?? "industry",
        industry: industry.trim() || null,
        summary: summary.trim() || null,
        description: description.trim() || null,
        // Derived, not chosen — see the header note.
        icon,
        /* Only a curator's write can be anything but a workspace pack, and the
           server re-derives this from who is asking either way. */
        visibility: canCurate ? (premium ? "premium" : "public") : "workspace",
        /* Both ways to charge, matching the playbook form — a plan buys with
           credits, a one-off buys with money, and a pack can be offered either
           way. Cleared unless it is actually for sale. */
        price_amount: canCurate && premium && priceAmount ? Number(priceAmount) : null,
        price_credits: canCurate && premium && priceCredits ? Number(priceCredits) : null,
        // Position on the shelf. Gaps of ten so a collection can be slotted
        // between two others without renumbering the row.
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
      title={editing ? "Edit collection" : "New collection"}
      width={720}
      className="pb-gen pbf-modal"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={save.isPending}
          disabled={!name.trim() || clash}
          onClick={() => save.mutate()}
        >
          {editing ? "Save" : "Create collection"}
        </Button>,
      ]}
    >
      {/* What the card will look like on the shelf, live. It is also the only
          place the derived icon shows itself, now that the picker is gone. */}
      <div className="pbf-preview">
        <span className="pbf-preview__av">
          <CollectionIcon name={icon} size={19} />
        </span>
        <div className="pbf-preview__body">
          <div className="pbf-preview__name">
            {name.trim() || <span className="pbf-preview__ghost">Untitled collection</span>}
          </div>
          <div className="pbf-preview__meta">
            {industry.trim() || "No industry set"}
            {summary.trim() ? ` · ${summary.trim()}` : ""}
          </div>
        </div>
      </div>

      <div className="pbf-form">
        <div className="pbf-field">
          <div className="pbf-label">
            Name <span className="pbf-req">Required</span>
          </div>
          <Input
            value={name}
            maxLength={120}
            placeholder="Fintech Essentials"
            onChange={(e) => setName(e.target.value)}
          />
          <div className={`pbf-hint ${clash ? "is-warn" : ""}`}>
            {clash
              ? `“${name.trim()}” is already on the shelf — pick another name or edit that one.`
              : "What this pack is called. One industry can have several."}
          </div>
        </div>

        <div className="pbf-field">
          <div className="pbf-label">Industry</div>
          <SearchableDropdown
            value={industry || null}
            onChange={(value: string) => setIndustry(value || "")}
            options={industryOptions}
            freeText
            allowClear
            hideAvatar
            placeholder="Who is this pack for?"
            searchPlaceholder="Search, or type a new industry…"
            itemNoun="industries"
            width="100%"
            style={{ width: "100%" }}
          />
          <div className="pbf-hint">
            Pick one, or type an industry the list does not cover — it joins the list
            for everyone after you.
          </div>
        </div>

        <div className="pbf-field">
          <div className="pbf-label">Summary</div>
          <Input
            value={summary}
            maxLength={400}
            placeholder="Money movement, ledgers, KYC and the failure modes that cost real money."
            onChange={(e) => setSummary(e.target.value)}
          />
          <div className="pbf-hint">
            One line. It is the whole card, so make it say who this is for.
          </div>
        </div>

        <div className="pbf-field">
          <div className="pbf-label">Description</div>
          <Input.TextArea
            value={description}
            rows={4}
            maxLength={20000}
            placeholder="What this pack covers, and how to work through it."
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {canCurate && (
          <div className={`pbf-sell ${premium ? "is-on" : ""}`}>
            <div className="pbf-sell__top">
              <Checkbox checked={premium} onChange={(e) => setPremium(e.target.checked)}>
                <span className="pbf-sell__label">Sell this as a pack</span>
              </Checkbox>
              {premium && (
                <span className="pbf-sell__prices">
                  <Input
                    value={priceAmount}
                    style={{ width: 118 }}
                    placeholder="Price"
                    prefix="$"
                    inputMode="decimal"
                    onChange={(e) => setPriceAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  />
                  <Input
                    value={priceCredits}
                    style={{ width: 118 }}
                    placeholder="Credits"
                    inputMode="numeric"
                    onChange={(e) => setPriceCredits(e.target.value.replace(/[^0-9]/g, ""))}
                  />
                </span>
              )}
            </div>
            {premium && (
              <div className="pbf-hint">
                The pack still opens for everyone — unlocking it is what gives a workspace
                the full recommendations in the playbooks inside, including any added
                later. Leave both prices empty to list it as “On request”.
              </div>
            )}
          </div>
        )}

        <div className="pbf-field pbf-field--narrow">
          <div className="pbf-label">Shelf position</div>
          <Input
            value={sortOrder}
            inputMode="numeric"
            onChange={(e) => setSortOrder(e.target.value.replace(/[^0-9]/g, ""))}
          />
          <div className="pbf-hint">Lower is earlier. Leave gaps of ten.</div>
        </div>
      </div>
    </Modal>
  );
}
