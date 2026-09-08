"use client";

/**
 * "Which collection is this playbook for?" — asked before the editor opens.
 *
 * WHY ASK FIRST. Filing is the step everyone skips. A playbook written and then
 * left uncollected is invisible to the shelf, which is the surface a customer
 * actually browses — so the pack it belongs in is worth one question at the
 * start rather than a cleanup pass later. Skipping is still one click, because
 * a question that blocks authoring gets answered wrongly to get past it.
 *
 * CREATING ONE INLINE, with only a name and an industry. The full form has a
 * summary, a description, pricing and a shelf position, and none of those are
 * decisions anyone can make while their attention is on the playbook they came
 * to write. The rest is editable on the collection afterwards.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, message } from "antd";
import { Check, Layers, Plus, X } from "lucide-react";

import { SearchableDropdown } from "@/components/common/SearchableDropdown";
import { api as axios } from "@/lib/axios";
import { CollectionIcon } from "@/components/qa/CollectionIcon";
import { INDUSTRY_OPTIONS, iconForIndustry } from "@/components/qa/collectionVocabulary";
import type { CollectionSummary } from "@/components/qa/playbookShared";

export default function NewPlaybookCollectionModal({
  collections,
  industries = [],
  canPublish,
  open,
  onClose,
  /** Called with the chosen collection id, or null when filing is skipped. */
  onContinue,
}: {
  collections: CollectionSummary[];
  industries?: string[];
  canPublish: boolean;
  open: boolean;
  onClose: () => void;
  onContinue: (collectionId: string | null) => void;
}) {
  const queryClient = useQueryClient();

  const [picked, setPicked] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");

  useEffect(() => {
    if (!open) return;
    setPicked(null);
    setCreating(false);
    setName("");
    setIndustry("");
  }, [open]);

  /* Only packs this person could actually file into: their own workspace's, or
     the library's if they curate it. The server enforces the same rule, so a
     collection listed here can never come back 403. */
  const choices = useMemo(
    () => collections.filter((c) => canPublish || c.isOwn),
    [collections, canPublish]
  );

  const industryOptions = useMemo(() => INDUSTRY_OPTIONS(industries), [industries]);

  const taken = useMemo(
    () => new Set(collections.map((c) => c.name.trim().toLowerCase())),
    [collections]
  );
  const clash = creating && taken.has(name.trim().toLowerCase());

  const create = useMutation({
    mutationFn: () =>
      axios.post("/api/v2/qa/playbooks/collections", {
        name: name.trim(),
        kind: "industry",
        industry: industry.trim() || null,
        icon: iconForIndustry(industry),
        visibility: canPublish ? "public" : "workspace",
        // Appended to the shelf rather than jumping ahead of curated packs.
        sort_order:
          collections.reduce((max, c) => Math.max(max, c.sortOrder ?? 0), 0) + 10,
      }),
    onSuccess: (result: any) => {
      message.success(`“${name.trim()}” created`);
      queryClient.invalidateQueries({ queryKey: ["qa", "collections"] });
      onContinue(result?.id ?? null);
      onClose();
    },
    onError: (err: any) => {
      message.error(
        err?.response?.data?.error || err?.message || "Could not create the collection"
      );
    },
  });

  const canContinue = creating ? Boolean(name.trim()) && !clash : true;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Where does this playbook belong?"
      width={620}
      className="pb-gen"
      footer={[
        <Button key="skip" onClick={() => { onContinue(null); onClose(); }}>
          Skip for now
        </Button>,
        <Button
          key="go"
          type="primary"
          loading={create.isPending}
          disabled={!canContinue}
          onClick={() => (creating ? create.mutate() : onContinue(picked))}
        >
          Continue
        </Button>,
      ]}
    >
      <p className="pbf-hint" style={{ marginBottom: 12 }}>
        A playbook in a collection turns up on the shelf customers browse. You can
        change this later, or skip and file it whenever you like.
      </p>

      {creating ? (
        <div className="pbn-create">
          <div className="pbn-create__head">
            <span className="pbc-card__av">
              <CollectionIcon name={iconForIndustry(industry)} size={16} />
            </span>
            <span className="pbn-create__title">New collection</span>
            <button
              type="button"
              className="pbn-create__cancel"
              onClick={() => setCreating(false)}
            >
              <X size={13} /> Pick an existing one
            </button>
          </div>

          <div className="pbf-field">
            <div className="pbf-label">
              Name <span className="pbf-req">Required</span>
            </div>
            <Input
              autoFocus
              value={name}
              maxLength={120}
              placeholder="Fintech Essentials"
              onChange={(e) => setName(e.target.value)}
            />
            {clash && (
              <div className="pbf-hint is-warn">
                “{name.trim()}” is already on the shelf — pick it from the list instead.
              </div>
            )}
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
          </div>

          <div className="pbf-hint">
            Summary, description and pricing are on the collection itself — this is
            only enough to file the playbook.
          </div>
        </div>
      ) : (
        <>
          <div className="pbn-list">
            {choices.map((collection) => {
              const on = picked === collection.id;
              return (
                <button
                  key={collection.id}
                  type="button"
                  className={`pbc-picktile ${on ? "is-on" : ""}`}
                  onClick={() => setPicked(on ? null : collection.id)}
                  aria-pressed={on}
                >
                  <span className="pbc-picktile__av">
                    <CollectionIcon name={collection.icon} size={16} />
                  </span>
                  <span className="pbc-picktile__body">
                    <span className="pbc-picktile__name">{collection.name}</span>
                    <span className="pbc-picktile__meta">
                      {collection.industry || "No industry"} · {collection.playbookCount}{" "}
                      playbooks
                    </span>
                  </span>
                  {on && (
                    <span className="pbc-picktile__pos">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}

            {/* Always last, so the list reads as "one of these, or a new one". */}
            <button
              type="button"
              className="pbn-new"
              onClick={() => setCreating(true)}
            >
              <span className="pbn-new__av">
                <Plus size={16} />
              </span>
              <span className="pbc-picktile__body">
                <span className="pbc-picktile__name">Create a new collection</span>
                <span className="pbc-picktile__meta">Just a name and an industry</span>
              </span>
            </button>
          </div>

          {choices.length === 0 && (
            <div className="pbf-hint" style={{ marginTop: 10 }}>
              <Layers size={12} style={{ verticalAlign: -2, marginRight: 5 }} />
              No collection you can file into yet — create one above, or skip.
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
