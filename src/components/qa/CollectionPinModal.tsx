"use client";

/**
 * "What do you build?" — asked once, remembered.
 *
 * WHY THIS EXISTS AT ALL: the library is the same hundreds of playbooks for
 * everybody, and a QA opening it on day one cannot tell which are theirs. The
 * shelf can answer that; this is the workspace saying which shelf is its own so
 * every later visit starts from the answer rather than from the whole catalog.
 *
 * IT IS NOT A FILTER AND NOT A PERMISSION. Pinning Fintech puts it first;
 * everything else stays one click away, because the day the lending app grows a
 * storefront nobody should have to find a setting first. The copy says so
 * plainly — a chooser that looks like it locks you in gets answered wrong.
 */

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Modal, Tooltip, message } from "antd";
import { Sparkles } from "lucide-react";

import { api as axios } from "@/lib/axios";
import { CollectionIcon } from "@/components/qa/CollectionIcon";
import {
  COLLECTION_KIND_HEADINGS,
  COLLECTION_KIND_ORDER,
  type CollectionKind,
  type CollectionSummary,
} from "@/components/qa/playbookShared";

export default function CollectionPinModal({
  collections,
  open,
  onClose,
}: {
  collections: CollectionSummary[];
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [picked, setPicked] = useState<string[]>([]);

  /* Re-seed on open so a cancelled change is genuinely cancelled. */
  useEffect(() => {
    if (open) setPicked(collections.filter((c) => c.pinned).map((c) => c.id));
  }, [open, collections]);

  /* Only packs with something in them: pinning an empty shelf entry would sort
     the library by a collection that answers nothing. */
  const choices = useMemo(
    () => collections.filter((c) => c.playbookCount > 0),
    [collections]
  );

  /* Grouped by kind, in the shelf's own order. A flat list of a dozen tiles
     makes "Fintech" and "PCI-DSS" look like the same sort of answer, and they
     are not — one is what you build, the other is what you must evidence. */
  const sections = useMemo(() => {
    const byKind = new Map<CollectionKind, CollectionSummary[]>();
    for (const collection of choices) {
      const list = byKind.get(collection.kind) ?? [];
      list.push(collection);
      byKind.set(collection.kind, list);
    }
    return COLLECTION_KIND_ORDER.filter((kind) => (byKind.get(kind)?.length ?? 0) > 0).map(
      (kind) => ({ kind, items: byKind.get(kind) ?? [] })
    );
  }, [choices]);

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const save = useMutation({
    mutationFn: () =>
      axios.put("/api/v2/qa/playbooks/collections/pins", { collections: picked }),
    onSuccess: () => {
      message.success(
        picked.length === 0
          ? "Cleared — the shelf is back in its default order"
          : "Saved. Your collections come first from now on."
      );
      queryClient.invalidateQueries({ queryKey: ["qa", "collections"] });
      onClose();
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.error || err?.message || "Could not save");
    },
  });

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <span className="pbc-pick__title">
          <span className="pbc-pick__titleav">
            <Sparkles size={15} />
          </span>
          What do you build?
        </span>
      }
      width={600}
      className="pb-gen"
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" loading={save.isPending} onClick={() => save.mutate()}>
          {picked.length > 0 ? `Save ${picked.length}` : "Save"}
        </Button>,
      ]}
    >
      <p className="pbc-pick__lede">
        Pick the collections that match your product. They come first on the shelf and
        on the catalog — nothing is hidden, and you can change this whenever you like.
      </p>

      {choices.length === 0 ? (
        <div className="pbc-curate__empty">
          No collection has been filled in yet — there is nothing to pin.
        </div>
      ) : (
        <>
          {/* The count doubles as the only place the ORDER is explained: the
              first pack you choose is the one that leads the shelf, and the
              numbers on the tiles below are otherwise unexplained. */}
          <div className="pbc-pick__bar">
            <span className="pbc-pick__count">
              {picked.length === 0 ? (
                "Nothing chosen yet"
              ) : (
                <>
                  <b>{picked.length}</b> chosen — numbered in the order they will appear
                </>
              )}
            </span>
            {picked.length > 0 && (
              <button type="button" className="pbc-pick__clear" onClick={() => setPicked([])}>
                Clear
              </button>
            )}
          </div>

          <div className="pbc-picklist">
            {sections.map(({ kind, items }) => (
              <section className="pbc-picksec" key={kind}>
                <div className="pbc-picksec__head">{COLLECTION_KIND_HEADINGS[kind]}</div>
                <div className="pbc-picksec__grid">
                  {items.map((collection) => {
                    const position = picked.indexOf(collection.id);
                    const on = position >= 0;
                    return (
                      <button
                        key={collection.id}
                        type="button"
                        className={`pbc-picktile ${on ? "is-on" : ""}`}
                        onClick={() => toggle(collection.id)}
                        aria-pressed={on}
                      >
                        <span className="pbc-picktile__av">
                          <CollectionIcon name={collection.icon} size={16} />
                        </span>
                        <span className="pbc-picktile__body">
                          <span className="pbc-picktile__name">{collection.name}</span>
                          <span className="pbc-picktile__meta">
                            {collection.playbookCount} playbooks · {collection.itemCount}{" "}
                            recommendations
                          </span>
                        </span>
                        {/* The position, not a tick. A tick says "chosen", which
                            the green already says; the number says WHERE it will
                            sit, which nothing else on this screen does. */}
                        {on && (
                          <Tooltip
                            title={
                              position === 0
                                ? "Leads your shelf"
                                : `Position ${position + 1} on your shelf`
                            }
                          >
                            <span className="pbc-picktile__pos">{position + 1}</span>
                          </Tooltip>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
